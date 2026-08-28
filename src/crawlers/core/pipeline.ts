import { CrawlItemAction, CrawlStatus, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { CrawlerDefinition } from "@/types/scholarship";
import { normalizeScholarship } from "@/lib/normalize/pipeline";
import { findDuplicateScholarship } from "@/lib/dedup";
import { createScholarship, updateScholarshipFromDuplicate, sweepDeadlineStatuses, type UpdateResult } from "@/services/scholarship-service";
import { upsertCountriesByNames } from "@/services/reference-data";

export interface CrawlRunSummary {
  crawlRunId: string;
  status: CrawlStatus;
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsUnchanged: number;
  itemsSkipped: number;
  duplicatesFound: number;
  errorsCount: number;
}

/**
 * Runs one source's crawler end to end: discover → normalize → dedup →
 * persist, recording a CrawlRun + per-item CrawlItem rows the whole way.
 * A single bad item (parse error, missing required field) is caught and
 * logged as CrawlItemAction.ERROR without aborting the run — the spec's
 * "one source failing must not stop the others" requirement extends down to
 * "one page failing must not stop the rest of that source's crawl".
 */
export async function runCrawl(
  sourceId: string,
  crawler: CrawlerDefinition,
  triggeredBy: "scheduler" | "manual" | "retry" = "manual",
  prisma: PrismaClient = defaultPrisma,
): Promise<CrawlRunSummary> {
  const source = await prisma.scholarshipSource.findUniqueOrThrow({ where: { id: sourceId } });

  const run = await prisma.crawlRun.create({
    data: { sourceId, status: CrawlStatus.RUNNING, triggeredBy },
  });

  await prisma.scholarshipSource.update({ where: { id: sourceId }, data: { crawlStatus: CrawlStatus.RUNNING } });

  const counts: RunCounts = { itemsFound: 0, itemsCreated: 0, itemsUpdated: 0, itemsUnchanged: 0, itemsSkipped: 0, duplicatesFound: 0, errorsCount: 0 };
  let runError: string | null = null;

  try {
    for await (const raw of crawler.crawl()) {
      counts.itemsFound += 1;
      try {
        if (!raw.title || !raw.descriptionText) {
          counts.itemsSkipped += 1;
          await logItem(prisma, run.id, raw.sourceUrl, raw.title, CrawlItemAction.SKIPPED, null, "missing title or description");
          continue;
        }

        const normalized = normalizeScholarship(raw);
        const destinationCountries = await upsertCountriesByNames(prisma, normalized.destinationCountryNames);
        const duplicate = await findDuplicateScholarship(
          prisma,
          normalized,
          destinationCountries.map((c) => c.id),
        );

        if (duplicate) {
          counts.duplicatesFound += 1;
          const result = await updateScholarshipFromDuplicate(
            prisma,
            duplicate.scholarshipId,
            normalized,
            sourceId,
            raw.sourceUrl,
            source.reliability,
            source.reliability === "OFFICIAL_PROVIDER" || source.reliability === "OFFICIAL_GOVERNMENT" || source.reliability === "UNIVERSITY",
          );
          if (result.action === "updated") counts.itemsUpdated += 1;
          else counts.itemsUnchanged += 1;
          await logItem(prisma, run.id, raw.sourceUrl, raw.title, mapAction(result.action), result.scholarshipId, `duplicate: ${duplicate.reason}`);
        } else {
          const result = await createScholarship(
            prisma,
            normalized,
            sourceId,
            raw.sourceUrl,
            source.reliability,
            source.reliability === "OFFICIAL_PROVIDER" || source.reliability === "OFFICIAL_GOVERNMENT" || source.reliability === "UNIVERSITY",
          );
          counts.itemsCreated += 1;
          await logItem(prisma, run.id, raw.sourceUrl, raw.title, CrawlItemAction.CREATED, result.scholarshipId, null);
        }
      } catch (itemError) {
        counts.errorsCount += 1;
        await logItem(
          prisma,
          run.id,
          raw.sourceUrl,
          raw.title,
          CrawlItemAction.ERROR,
          null,
          itemError instanceof Error ? itemError.message : String(itemError),
        );
      }
    }
  } catch (fatalError) {
    runError = fatalError instanceof Error ? fatalError.message : String(fatalError);
  }

  await sweepDeadlineStatuses(prisma);

  const status = resolveRunStatus(runError, counts);
  const now = new Date();

  await prisma.crawlRun.update({
    where: { id: run.id },
    data: { ...counts, status, completedAt: now, errorMessage: runError },
  });

  await prisma.scholarshipSource.update({
    where: { id: sourceId },
    data: {
      lastCrawledAt: now,
      nextCrawlAt: new Date(now.getTime() + source.crawlFrequencyHrs * 60 * 60 * 1000),
      crawlStatus: status,
      crawlError: runError,
      totalItemsFound: { increment: counts.itemsFound },
    },
  });

  return { crawlRunId: run.id, status, ...counts };
}

type RunCounts = Omit<CrawlRunSummary, "crawlRunId" | "status">;

function mapAction(action: UpdateResult["action"]): CrawlItemAction {
  return action === "updated" ? CrawlItemAction.UPDATED : CrawlItemAction.UNCHANGED;
}

function resolveRunStatus(runError: string | null, counts: RunCounts): CrawlStatus {
  if (runError && counts.itemsFound === 0) return CrawlStatus.FAILED;
  if (runError || counts.errorsCount > 0) return CrawlStatus.PARTIAL;
  return CrawlStatus.SUCCESS;
}

async function logItem(
  prisma: PrismaClient,
  crawlRunId: string,
  sourceUrl: string,
  rawTitle: string | undefined,
  action: CrawlItemAction,
  scholarshipId: string | null,
  errorMessage: string | null,
) {
  await prisma.crawlItem.create({
    data: { crawlRunId, sourceUrl, rawTitle: rawTitle ?? null, action, scholarshipId, errorMessage },
  });
}
