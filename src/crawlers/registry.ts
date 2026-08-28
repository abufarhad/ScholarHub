import type { CrawlerDefinition } from "@/types/scholarship";
import { opportunitiesCornersCrawler } from "./sources/opportunities-corners";
import { scholarshipRoarCrawler } from "./sources/scholarship-roar";
import { fullScholarshipsCrawler } from "./sources/full-scholarships";
import { shedGovCrawler } from "./sources/shed-gov";

/**
 * Every crawler the platform knows about, keyed by ScholarshipSource.crawlerType.
 * Adding a new source is: write an adapter implementing CrawlerDefinition,
 * register it here, and insert a ScholarshipSource row — no changes to the
 * pipeline, dedup, normalization, or API layers are ever required.
 */
export const CRAWLER_REGISTRY: Record<string, CrawlerDefinition> = {
  [opportunitiesCornersCrawler.key]: opportunitiesCornersCrawler,
  [scholarshipRoarCrawler.key]: scholarshipRoarCrawler,
  [fullScholarshipsCrawler.key]: fullScholarshipsCrawler,
  [shedGovCrawler.key]: shedGovCrawler,
};

export function getCrawler(crawlerType: string): CrawlerDefinition {
  const crawler = CRAWLER_REGISTRY[crawlerType];
  if (!crawler) throw new Error(`No crawler registered for type "${crawlerType}"`);
  return crawler;
}
