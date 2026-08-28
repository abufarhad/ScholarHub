import type { CrawlerDefinition } from "@/types/scholarship";
import { crawlWordPressSource } from "./wordpress-common";

// Site inspected 2026-08-28: WordPress + All in One SEO sitemap
// (wp-sitemap.xml redirects to sitemap.xml -> post-sitemap.xml). robots.txt
// only disallows /wp-admin/, /cgi-bin/, and a handful of nationality-tag
// archive pages — individual scholarship posts and the sitemap are fair
// game. No JSON-LD, but posts use a highly consistent "Label: value" format
// (Deadline:, Study in:, Host Institution(s):, Level/Field(s) of Study:)
// inside a `.maincontent` container, with article:published/modified_time
// meta tags for dates.
export const scholars4devCrawler: CrawlerDefinition = {
  key: "scholars4dev",
  crawl: () =>
    crawlWordPressSource({
      baseUrl: "https://www.scholars4dev.com",
      sitemapUrls: ["https://www.scholars4dev.com/post-sitemap.xml"],
      contentSelectors: [".maincontent", ".entry-content"],
      titleSelectors: ["h1"],
      requestDelayMs: 1500,
      maxAgeHours: 24 * 14,
      maxPages: 60,
    }),
};
