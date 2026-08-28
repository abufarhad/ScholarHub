import type { CrawlerDefinition } from "@/types/scholarship";
import { crawlWordPressSource } from "./wordpress-common";

// Site inspected 2026-08-28: WordPress core sitemap (wp-sitemap.xml), 14 post
// chunks, actively publishing current-dated posts. robots.txt has no actual
// Disallow directives — just the content-signal legend with no restrictions
// expressed for any use, so default crawling applies. Covers opportunities
// broadly (jobs, fellowships, competitions) alongside scholarships — the
// normalization layer's degree/funding detection naturally filters out
// non-scholarship posts (they simply won't match any DegreeLevel/FundingType
// pattern and end up OTHER, which is acceptable noise rather than a reason
// to skip the source). JSON-LD Article present; content lives in
// `.post-content-wrap` with "Deadline:"-style labeled lines.
export const opportunityDeskCrawler: CrawlerDefinition = {
  key: "opportunity-desk",
  crawl: () =>
    crawlWordPressSource({
      baseUrl: "https://opportunitydesk.org",
      sitemapUrls: [
        "https://opportunitydesk.org/wp-sitemap-posts-post-14.xml",
        "https://opportunitydesk.org/wp-sitemap-posts-post-13.xml",
      ],
      contentSelectors: [".post-content-wrap", ".entry-content"],
      titleSelectors: ["h1.post-title", "h1"],
      requestDelayMs: 1500,
      maxAgeHours: 24 * 14,
      maxPages: 60,
    }),
};
