import type { CrawlerDefinition } from "@/types/scholarship";
import { crawlWordPressSource } from "./wordpress-common";

// Site inspected 2026-08-28: WordPress + Yoast SEO (sitemap_index.xml →
// post-sitemap.xml/post-sitemap2.xml) on the tagDiv "Newspaper" theme.
// robots.txt only disallows /?s= and /search/ — post pages and the sitemap
// are explicitly fair game.
export const opportunitiesCornersCrawler: CrawlerDefinition = {
  key: "opportunities-corners",
  crawl: () =>
    crawlWordPressSource({
      baseUrl: "https://opportunitiescorners.com",
      sitemapUrls: [
        "https://opportunitiescorners.com/post-sitemap.xml",
        "https://opportunitiescorners.com/post-sitemap2.xml",
      ],
      contentSelectors: [".td-post-content", ".entry-content"],
      titleSelectors: ["h1.entry-title", "h1.tdb-title-text"],
      requestDelayMs: 1500,
      maxAgeHours: 24 * 14, // re-check anything touched in the last two weeks
      maxPages: 60,
    }),
};
