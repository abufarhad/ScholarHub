import * as cheerio from "cheerio";
import type { RawScholarship } from "@/types/scholarship";
import { fetchText, politeDelay } from "../core/http";
import { isPathAllowed } from "../core/robots";
import { fetchSitemapUrls } from "../core/sitemap";
import { extractJsonLdArticle, htmlToText, firstMatchingSelector, extractLabeledValue, findOfficialLink } from "../core/extract";

export interface WordPressSourceConfig {
  baseUrl: string;
  sitemapUrls: string[];
  contentSelectors: string[];
  titleSelectors: string[];
  requestDelayMs: number;
  /** Skip pages whose sitemap lastmod is older than this many hours (incremental crawl). */
  maxAgeHours?: number;
  /** Hard cap on pages fetched in one run, to keep individual crawls short and polite. */
  maxPages?: number;
}

/**
 * Shared crawl strategy for WordPress-based scholarship sites: discover URLs
 * via the site's own XML sitemap (never by scraping paginated listing pages),
 * then fetch each post and extract via JSON-LD first, falling back to
 * theme-specific CSS selectors passed in by the caller. Both
 * OpportunitiesCorners and ScholarshipRoar use this — they're different
 * WordPress themes but the same underlying strategy, so the theme-specific
 * bits are just configuration, not new code.
 */
export async function* crawlWordPressSource(config: WordPressSourceConfig): AsyncGenerator<RawScholarship> {
  const allowed = await isPathAllowed(config.baseUrl, "/");
  if (!allowed) {
    throw new Error(`robots.txt disallows crawling ${config.baseUrl}`);
  }

  const cutoff = config.maxAgeHours ? Date.now() - config.maxAgeHours * 60 * 60 * 1000 : null;
  const seen: { loc: string; lastmod: Date | null }[] = [];
  for (const sitemapUrl of config.sitemapUrls) {
    try {
      seen.push(...(await fetchSitemapUrls(sitemapUrl)));
    } catch {
      // this particular sitemap file failed — keep going with whatever we already have
    }
  }

  const candidates = seen
    .filter((u) => !cutoff || !u.lastmod || u.lastmod.getTime() >= cutoff)
    .slice(0, config.maxPages ?? seen.length);

  for (const { loc } of candidates) {
    const path = safePath(loc);
    if (path && !(await isPathAllowed(config.baseUrl, path))) continue;

    await politeDelay(config.requestDelayMs);
    let html: string;
    try {
      html = await fetchText(loc);
    } catch {
      continue; // one unreachable post shouldn't stop the rest of the crawl
    }

    const $ = cheerio.load(html);
    const jsonLd = extractJsonLdArticle($);

    const titleSelector = firstMatchingSelector($, config.titleSelectors);
    const title = jsonLd?.headline?.trim() || (titleSelector ? $(titleSelector).first().text().trim() : "");

    const contentSelector = firstMatchingSelector($, config.contentSelectors);
    const descriptionText = contentSelector ? htmlToText($, contentSelector) : "";
    const descriptionHtml = contentSelector ? ($(contentSelector).first().html() ?? "") : "";

    if (!title || !descriptionText) continue;

    const publishedAtRaw =
      jsonLd?.datePublished ?? $('meta[property="article:published_time"]').attr("content") ?? undefined;
    const lastUpdatedAtRaw =
      jsonLd?.dateModified ?? $('meta[property="article:modified_time"]').attr("content") ?? undefined;

    const officialUrl = findOfficialLink($, loc) ?? undefined;
    const deadlineRaw =
      extractLabeledValue(descriptionText, ["Application Deadline", "Deadline", "Last Date to Apply", "Closing Date"]) ??
      undefined;
    const hostCountryRaw = extractLabeledValue(descriptionText, ["Host Country", "Country", "Study In"]) ?? undefined;
    const degreeRaw = extractLabeledValue(descriptionText, ["Degree Level", "Level of Study", "Program Level"]) ?? undefined;
    const fundingRaw = extractLabeledValue(descriptionText, ["Financial Benefits", "Funding Type", "Scholarship Type"]) ?? undefined;

    // Article tag/category classes often encode degree level directly
    // (e.g. tag-masters-scholarships, tag-phd-scholarships) — fold those in
    // alongside the "Degree Level:" prose line as extra signal.
    const classHints = ($("article").attr("class") ?? "")
      .split(/\s+/)
      .filter((c) => c.startsWith("tag-") || c.startsWith("category-"))
      .join(" ")
      .replace(/[-_]/g, " ");

    yield {
      sourceUrl: loc,
      title,
      descriptionText,
      descriptionHtml,
      degreeLevelsRaw: [degreeRaw, classHints].filter(Boolean) as string[],
      fundingTypeRaw: fundingRaw,
      destinationCountryRaw: hostCountryRaw ? [hostCountryRaw] : undefined,
      applicationDeadlineRaw: deadlineRaw,
      publishedAtRaw,
      lastUpdatedAtRaw,
      officialUrl,
      applicationUrl: officialUrl ?? loc,
      tags: classHints ? classHints.split(" ").filter(Boolean) : undefined,
    };
  }
}

function safePath(url: string): string | null {
  try {
    return new URL(url).pathname;
  } catch {
    return null;
  }
}
