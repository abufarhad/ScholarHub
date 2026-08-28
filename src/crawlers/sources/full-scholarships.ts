import type { CrawlerDefinition } from "@/types/scholarship";
import { crawlWordPressSource } from "./wordpress-common";

// Site inspected 2026-08-28: this is actually Blogger/Blogspot, not
// WordPress (URLs follow /YYYY/MM/slug.html and the sitemap is Blogger's
// paginated sitemap.xml?page=N format) — but the crawl *strategy* is
// identical (sitemap discovery, JSON-LD/meta dates, h1.entry-title, prose
// "Label: value" fields), so it reuses the same generic implementation
// rather than a bespoke one. robots.txt only disallows /search.
export const fullScholarshipsCrawler: CrawlerDefinition = {
  key: "full-scholarships",
  crawl: () =>
    crawlWordPressSource({
      baseUrl: "https://www.fullscholarships.net",
      sitemapUrls: ["https://www.fullscholarships.net/sitemap.xml"],
      contentSelectors: [".post-body", "div[itemprop='description']", ".entry-content"],
      titleSelectors: ["h1.entry-title", "h3.entry-title"],
      requestDelayMs: 1500,
      maxAgeHours: 24 * 14,
      maxPages: 60,
    }),
};
