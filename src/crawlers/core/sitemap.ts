import * as cheerio from "cheerio";
import { fetchText } from "./http";

export interface SitemapUrl {
  loc: string;
  lastmod: Date | null;
}

/**
 * Reads a sitemap URL, recursing one level into a <sitemapindex> if that's
 * what's returned. This is the preferred discovery mechanism (over scraping
 * paginated listing pages) per the platform's crawling-safety policy: it's
 * exactly the URL list the site wants crawlers to use, and lastmod lets the
 * pipeline skip pages that haven't changed since the last crawl.
 */
export async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<SitemapUrl[]> {
  if (depth > 1) return []; // guard against pathological recursive sitemaps

  const xml = await fetchText(sitemapUrl, { timeoutMs: 20_000 });
  const $ = cheerio.load(xml, { xmlMode: true });

  const isIndex = $("sitemapindex").length > 0;
  if (isIndex) {
    const childSitemaps = $("sitemap > loc")
      .map((_, el) => $(el).text().trim())
      .get();
    const results: SitemapUrl[] = [];
    for (const child of childSitemaps) {
      try {
        results.push(...(await fetchSitemapUrls(child, depth + 1)));
      } catch {
        // one bad child sitemap shouldn't abort discovery of the rest
      }
    }
    return results;
  }

  return $("url")
    .map((_, el) => {
      const loc = $(el).find("loc").first().text().trim();
      const lastmodText = $(el).find("lastmod").first().text().trim();
      const lastmod = lastmodText ? new Date(lastmodText) : null;
      return { loc, lastmod: lastmod && !Number.isNaN(lastmod.getTime()) ? lastmod : null };
    })
    .get()
    .filter((u) => u.loc);
}
