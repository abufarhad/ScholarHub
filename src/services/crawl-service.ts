import { prisma } from "@/lib/prisma";
import { getCrawler } from "@/crawlers/registry";
import { runCrawl, type CrawlRunSummary } from "@/crawlers/core/pipeline";

export interface SourceCrawlOutcome extends CrawlRunSummary {
  sourceId: string;
  sourceName: string;
}

/**
 * Crawls a single source by id, regardless of its due schedule — used by the
 * admin "Run Now" action and by retry-on-failure. Never throws for a
 * crawler-level failure (network down, parser exception): those are captured
 * into the CrawlRun row and surfaced via its status/errorMessage instead, so
 * one source's outage never propagates to whatever caller triggered it.
 */
export async function crawlSourceById(sourceId: string, triggeredBy: "scheduler" | "manual" | "retry" = "manual"): Promise<SourceCrawlOutcome> {
  const source = await prisma.scholarshipSource.findUniqueOrThrow({ where: { id: sourceId } });
  const crawler = getCrawler(source.crawlerType);
  const summary = await runCrawl(sourceId, crawler, triggeredBy);
  return { ...summary, sourceId: source.id, sourceName: source.name };
}

/**
 * Crawls every enabled source whose nextCrawlAt has passed (or has never run).
 * This is what the 12-hour scheduler calls; each source runs sequentially so
 * they never contend for the same outbound-request budget, and one source's
 * failure doesn't prevent the rest from running.
 */
export async function crawlDueSources(triggeredBy: "scheduler" | "manual" = "scheduler"): Promise<SourceCrawlOutcome[]> {
  const now = new Date();
  const dueSources = await prisma.scholarshipSource.findMany({
    where: {
      enabled: true,
      OR: [{ nextCrawlAt: null }, { nextCrawlAt: { lte: now } }],
    },
  });

  const results: SourceCrawlOutcome[] = [];
  for (const source of dueSources) {
    try {
      results.push(await crawlSourceById(source.id, triggeredBy));
    } catch (error) {
      // getCrawler() throwing (unknown crawlerType) or findUniqueOrThrow
      // failing are the only ways to get here — runCrawl itself never throws.
      results.push({
        sourceId: source.id,
        sourceName: source.name,
        crawlRunId: "",
        status: "FAILED",
        itemsFound: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsUnchanged: 0,
        itemsSkipped: 0,
        duplicatesFound: 0,
        errorsCount: 1,
      } as SourceCrawlOutcome);
      await prisma.scholarshipSource.update({
        where: { id: source.id },
        data: { crawlStatus: "FAILED", crawlError: error instanceof Error ? error.message : String(error) },
      });
    }
  }
  return results;
}

export async function crawlAllEnabledSources(triggeredBy: "scheduler" | "manual" = "manual"): Promise<SourceCrawlOutcome[]> {
  const sources = await prisma.scholarshipSource.findMany({ where: { enabled: true } });
  const results: SourceCrawlOutcome[] = [];
  for (const source of sources) {
    results.push(await crawlSourceById(source.id, triggeredBy));
  }
  return results;
}
