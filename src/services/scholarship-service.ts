import { DeadlineStatus, ScholarshipStatus, type PrismaClient, type SourceReliability } from "@prisma/client";
import type { NormalizedScholarship } from "@/types/scholarship";
import { computeDeadlineInfo } from "@/lib/deadline";
import { slugify } from "@/lib/slug";
import { toJsonArray } from "@/lib/json-array";
import { upsertCountriesByNames, upsertSubjectsByNames } from "./reference-data";

export interface PersistResult {
  scholarshipId: string;
  action: "created" | "updated" | "unchanged";
}

export interface UpdateResult {
  scholarshipId: string;
  action: "updated" | "unchanged";
}

/**
 * Creates a brand-new canonical Scholarship from a normalized crawl result,
 * wiring up its subjects/destinations/eligible-countries join rows and its
 * first ScholarshipSourceLink. Called by the crawl pipeline only after
 * duplicate detection has confirmed nothing existing matches.
 */
export async function createScholarship(
  prisma: PrismaClient,
  normalized: NormalizedScholarship,
  sourceId: string,
  sourceUrl: string,
  sourceReliability: SourceReliability,
  isOfficial: boolean,
): Promise<PersistResult> {
  const now = new Date();
  const { status } = computeDeadlineInfo(normalized.applicationDeadline, normalized.isRolling, normalized.openingDate, now);

  const [destinationCountries, eligibleCountries, subjects] = await Promise.all([
    upsertCountriesByNames(prisma, normalized.destinationCountryNames),
    upsertCountriesByNames(prisma, normalized.eligibleCountryNames),
    upsertSubjectsByNames(prisma, normalized.subjectNames),
  ]);

  const slug = await uniqueSlug(prisma, normalized.title);

  const scholarship = await prisma.scholarship.create({
    data: {
      slug,
      title: normalized.title,
      canonicalTitleNormalized: normalized.canonicalTitleNormalized,
      provider: normalized.provider,
      university: normalized.university,
      organization: normalized.organization,
      description: normalized.description,
      summary: normalized.summary,
      degreeLevels: toJsonArray(normalized.degreeLevels),
      fundingType: normalized.fundingType,
      tuitionCoverage: normalized.tuitionCoverage,
      monthlyStipend: normalized.monthlyStipend,
      accommodationCovered: normalized.accommodationCovered,
      airfareCovered: normalized.airfareCovered,
      healthInsuranceCovered: normalized.healthInsuranceCovered,
      applicationFeeCovered: normalized.applicationFeeCovered,
      otherBenefits: toJsonArray(normalized.otherBenefits),
      minimumEducation: normalized.minimumEducation,
      minimumGPA: normalized.minimumGPA,
      ageLimit: normalized.ageLimit,
      nationalityRequirements: normalized.nationalityRequirements,
      languageRequirements: normalized.languageRequirements,
      ieltsRequired: normalized.ieltsRequired,
      toeflRequired: normalized.toeflRequired,
      workExperienceRequired: normalized.workExperienceRequired,
      otherEligibility: normalized.otherEligibility,
      allNationalitiesEligible: normalized.allNationalitiesEligible,
      applicationDeadline: normalized.applicationDeadline,
      deadlineType: normalized.deadlineType,
      isRolling: normalized.isRolling,
      openingDate: normalized.openingDate,
      deadlineStatus: status,
      primaryCountryId: destinationCountries[0]?.id,
      destinationCity: normalized.destinationCity,
      region: normalized.region,
      publishedAt: normalized.publishedAt,
      lastUpdatedAt: now,
      lastVerifiedAt: now,
      scrapedAt: now,
      status: ScholarshipStatus.PUBLISHED,
      contentHash: normalized.contentHash,
      sourceReliability,
      officialUrl: normalized.officialUrl,
      applicationUrl: normalized.applicationUrl,
      primarySourceId: sourceId,
      tags: toJsonArray(normalized.tags),
      destinations: {
        create: destinationCountries.map((c, i) => ({ countryId: c.id, isPrimary: i === 0 })),
      },
      eligibleCountries: {
        create: eligibleCountries.map((c) => ({ countryId: c.id })),
      },
      subjects: {
        create: subjects.map((s) => ({ subjectId: s.id })),
      },
      sourceLinks: {
        create: [
          {
            sourceId,
            sourceUrl,
            isOfficial,
            rawTitle: normalized.title,
            contentHash: normalized.contentHash,
          },
        ],
      },
    },
  });

  return { scholarshipId: scholarship.id, action: "created" };
}

/**
 * Updates an existing canonical Scholarship when a duplicate is detected
 * from another (or the same) source. Only overwrites content fields when the
 * incoming source is at least as reliable as the one already on record, so a
 * low-trust aggregator can never clobber data confirmed from an official
 * source — it can still attach itself as an additional ScholarshipSourceLink
 * either way, which is what powers the "Found on N sources" UI.
 */
export async function updateScholarshipFromDuplicate(
  prisma: PrismaClient,
  scholarshipId: string,
  normalized: NormalizedScholarship,
  sourceId: string,
  sourceUrl: string,
  sourceReliability: SourceReliability,
  isOfficial: boolean,
): Promise<UpdateResult> {
  const now = new Date();
  const existing = await prisma.scholarship.findUniqueOrThrow({
    where: { id: scholarshipId },
    include: { sourceLinks: { where: { sourceId, sourceUrl } } },
  });

  const existingLink = existing.sourceLinks[0];
  const contentUnchanged = existingLink?.contentHash === normalized.contentHash;

  await prisma.scholarshipSourceLink.upsert({
    where: existingLink ? { id: existingLink.id } : { sourceId_sourceUrl: { sourceId, sourceUrl } },
    update: { lastSeenAt: now, lastCheckedAt: now, contentHash: normalized.contentHash, rawTitle: normalized.title },
    create: {
      scholarshipId,
      sourceId,
      sourceUrl,
      isOfficial,
      rawTitle: normalized.title,
      contentHash: normalized.contentHash,
    },
  });

  if (contentUnchanged) {
    await prisma.scholarship.update({ where: { id: scholarshipId }, data: { scrapedAt: now, lastVerifiedAt: now } });
    return { scholarshipId, action: "unchanged" };
  }

  const shouldOverwriteContent = isMoreOrEquallyReliable(sourceReliability, existing.sourceReliability);
  const { status } = computeDeadlineInfo(
    normalized.applicationDeadline ?? existing.applicationDeadline,
    normalized.isRolling,
    normalized.openingDate ?? existing.openingDate,
    now,
  );

  const [destinationCountries, eligibleCountries, subjects] = shouldOverwriteContent
    ? await Promise.all([
        upsertCountriesByNames(prisma, normalized.destinationCountryNames),
        upsertCountriesByNames(prisma, normalized.eligibleCountryNames),
        upsertSubjectsByNames(prisma, normalized.subjectNames),
      ])
    : [[], [], []];

  await prisma.scholarship.update({
    where: { id: scholarshipId },
    data: {
      lastUpdatedAt: now,
      lastVerifiedAt: now,
      scrapedAt: now,
      deadlineStatus: status,
      // Reopen a previously expired scholarship if fresh data shows a future deadline.
      status: existing.status === ScholarshipStatus.EXPIRED && status !== DeadlineStatus.CLOSED ? ScholarshipStatus.PUBLISHED : existing.status,
      ...(shouldOverwriteContent
        ? {
            description: normalized.description,
            summary: normalized.summary,
            degreeLevels: toJsonArray(normalized.degreeLevels),
            fundingType: normalized.fundingType,
            tuitionCoverage: normalized.tuitionCoverage,
            monthlyStipend: normalized.monthlyStipend,
            accommodationCovered: normalized.accommodationCovered,
            airfareCovered: normalized.airfareCovered,
            healthInsuranceCovered: normalized.healthInsuranceCovered,
            applicationFeeCovered: normalized.applicationFeeCovered,
            otherBenefits: toJsonArray(normalized.otherBenefits),
            minimumEducation: normalized.minimumEducation,
            minimumGPA: normalized.minimumGPA,
            applicationDeadline: normalized.applicationDeadline,
            deadlineType: normalized.deadlineType,
            isRolling: normalized.isRolling,
            openingDate: normalized.openingDate,
            contentHash: normalized.contentHash,
            sourceReliability,
            officialUrl: normalized.officialUrl ?? existing.officialUrl,
            destinations: { deleteMany: {}, create: destinationCountries.map((c, i) => ({ countryId: c.id, isPrimary: i === 0 })) },
            eligibleCountries: { deleteMany: {}, create: eligibleCountries.map((c) => ({ countryId: c.id })) },
            subjects: { deleteMany: {}, create: subjects.map((s) => ({ subjectId: s.id })) },
            primaryCountryId: destinationCountries[0]?.id ?? existing.primaryCountryId,
          }
        : {}),
    },
  });

  return { scholarshipId, action: "updated" };
}

const RELIABILITY_RANK: Record<SourceReliability, number> = {
  OFFICIAL_PROVIDER: 5,
  OFFICIAL_GOVERNMENT: 5,
  UNIVERSITY: 4,
  VERIFIED_AGGREGATOR: 2,
  AGGREGATOR: 1,
  UNKNOWN: 0,
};

function isMoreOrEquallyReliable(incoming: SourceReliability, existing: SourceReliability): boolean {
  return RELIABILITY_RANK[incoming] >= RELIABILITY_RANK[existing];
}

async function uniqueSlug(prisma: PrismaClient, title: string): Promise<string> {
  const base = slugify(title) || "scholarship";
  let candidate = base;
  let suffix = 1;
  while (await prisma.scholarship.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * Recomputes deadlineStatus (and flips status to EXPIRED where applicable)
 * for every published/expired scholarship. Run after every crawl.
 */
export async function sweepDeadlineStatuses(prisma: PrismaClient): Promise<{ expired: number; reopened: number }> {
  const now = new Date();
  const rows = await prisma.scholarship.findMany({
    where: { status: { in: [ScholarshipStatus.PUBLISHED, ScholarshipStatus.EXPIRED] } },
    select: { id: true, applicationDeadline: true, isRolling: true, openingDate: true, status: true, deadlineStatus: true },
  });

  let expired = 0;
  let reopened = 0;
  for (const row of rows) {
    const { status } = computeDeadlineInfo(row.applicationDeadline, row.isRolling, row.openingDate, now);
    if (status === row.deadlineStatus && (status !== DeadlineStatus.CLOSED) === (row.status !== ScholarshipStatus.EXPIRED)) {
      continue;
    }

    const nextStatus =
      status === DeadlineStatus.CLOSED
        ? ScholarshipStatus.EXPIRED
        : row.status === ScholarshipStatus.EXPIRED
          ? ScholarshipStatus.PUBLISHED
          : row.status;

    if (nextStatus === ScholarshipStatus.EXPIRED && row.status !== ScholarshipStatus.EXPIRED) expired += 1;
    if (row.status === ScholarshipStatus.EXPIRED && nextStatus === ScholarshipStatus.PUBLISHED) reopened += 1;

    await prisma.scholarship.update({
      where: { id: row.id },
      data: { deadlineStatus: status, status: nextStatus },
    });
  }

  return { expired, reopened };
}
