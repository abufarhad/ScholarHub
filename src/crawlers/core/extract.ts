import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";

export interface JsonLdArticle {
  headline?: string;
  description?: string;
  datePublished?: string;
  dateModified?: string;
}

/** Pulls the first Article/BlogPosting node out of any JSON-LD blocks on the page. */
export function extractJsonLdArticle($: CheerioAPI): JsonLdArticle | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    try {
      const parsed = JSON.parse($(el).contents().text());
      const nodes: unknown[] = Array.isArray(parsed) ? parsed : parsed["@graph"] ?? [parsed];
      for (const node of nodes) {
        if (
          node &&
          typeof node === "object" &&
          "@type" in node &&
          ["Article", "BlogPosting", "NewsArticle"].includes(String((node as Record<string, unknown>)["@type"]))
        ) {
          const n = node as Record<string, unknown>;
          return {
            headline: typeof n.headline === "string" ? n.headline : undefined,
            description: typeof n.description === "string" ? n.description : undefined,
            datePublished: typeof n.datePublished === "string" ? n.datePublished : undefined,
            dateModified: typeof n.dateModified === "string" ? n.dateModified : undefined,
          };
        }
      }
    } catch {
      // malformed JSON-LD on the page — ignore and fall through to other signals
    }
  }
  return null;
}

/** Converts a content container's HTML into readable plain text, collapsing whitespace. */
export function htmlToText($: CheerioAPI, selector: string): string {
  const el = $(selector).first();
  if (el.length === 0) return "";
  el.find("script, style, iframe").remove();
  const text = el.text();
  return text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();
}

/**
 * Finds the first content container matching any selector in the given
 * priority list. Adapters pass a list of candidate selectors (theme-specific
 * first, generic fallback last) so a minor template change degrades
 * gracefully instead of extracting nothing.
 */
export function firstMatchingSelector($: CheerioAPI, selectors: string[]): string | null {
  for (const sel of selectors) {
    if ($(sel).first().length > 0) return sel;
  }
  return null;
}

/**
 * Extracts a "Label: value" style line from prose text — the dominant
 * pattern scholarship posts use for structured facts (Host Country: Japan,
 * Degree Level: Masters, Application Deadline: 31 May 2027, ...).
 */
export function extractLabeledValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s*[:\\-]\\s*([^\\n\\r]{1,200})`, "i");
    const match = text.match(pattern);
    if (match) return match[1].trim().replace(/\s{2,}/g, " ");
  }
  return null;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Finds outbound links (different registrable domain than the source page)
 * whose anchor text suggests they lead to the official application/provider
 * page. Used to populate `officialUrl` distinctly from the aggregator's own
 * page — never asserted unless a link like this is actually found.
 */
export function findOfficialLink($: CheerioAPI, pageUrl: string): string | null {
  const pageHost = safeHost(pageUrl);
  const candidates = $("a[href]")
    .toArray()
    .map((el) => ({ href: $(el).attr("href") ?? "", text: $(el).text().trim() }))
    .filter((a) => /apply|official|application (link|form|portal)|apply now|click here to apply/i.test(a.text));

  for (const candidate of candidates) {
    const host = safeHost(candidate.href);
    if (host && host !== pageHost && !isKnownGenericRedirect(host)) {
      return candidate.href;
    }
  }
  return null;
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function isKnownGenericRedirect(host: string): boolean {
  return ["google.com", "facebook.com", "twitter.com", "x.com", "youtube.com", "youtu.be", "instagram.com", "linkedin.com", "t.me"].some(
    (d) => host === d || host.endsWith(`.${d}`),
  );
}

export { cheerio };
