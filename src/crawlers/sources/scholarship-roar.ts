import type { CrawlerDefinition } from "@/types/scholarship";
import { crawlWordPressSource } from "./wordpress-common";

// Site inspected 2026-08-28: WordPress (core wp-sitemap.xml) on the
// GeneratePress theme, with Article JSON-LD on every post. robots.txt blocks
// only wp-admin/search/comment-moderation paths — posts and sitemaps are
// explicitly allowed.
export const scholarshipRoarCrawler: CrawlerDefinition = {
  key: "scholarship-roar",
  crawl: () =>
    crawlWordPressSource({
      baseUrl: "https://scholarshiproar.com",
      sitemapUrls: ["https://scholarshiproar.com/wp-sitemap-posts-post-1.xml"],
      contentSelectors: [".entry-content"],
      titleSelectors: ["h1.entry-title"],
      requestDelayMs: 1500,
      maxAgeHours: 24 * 14,
      maxPages: 60,
    }),
};
