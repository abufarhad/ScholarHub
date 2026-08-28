import { DegreeLevel, FundingType, ScholarshipStatus, DeadlineStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fromJsonArray } from "@/lib/json-array";
import type { StaticScholarship } from "@/types/static-data";

/**
 * Build-time-only data access. There is no server at runtime — every
 * function here is called either from a Server Component that Next
 * pre-renders once during `next build` (homepage, detail pages via
 * generateStaticParams) or from scripts/export-static-data.ts. Nothing here
 * is reachable after the static export ships; interactive filtering on the
 * live site reads public/data/scholarships.json instead (see
 * src/lib/client-search.ts). Every list function returns the same
 * StaticScholarship shape the exported JSON uses, so <ScholarshipCard> and
 * friends never need to know whether their data came from a build-time
 * Prisma query or a client-side fetch.
 */

const FULL_INCLUDE = {
  primaryCountry: true,
  eligibleCountries: { include: { country: true } },
  subjects: { include: { subject: true } },
  sourceLinks: { include: { source: true } },
} satisfies Prisma.ScholarshipInclude;

type FullRow = Prisma.ScholarshipGetPayload<{ include: typeof FULL_INCLUDE }>;

function toStaticScholarship(row: FullRow): StaticScholarship {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    provider: row.provider,
    university: row.university,
    organization: row.organization,
    description: row.description,
    summary: row.summary,
    degreeLevels: fromJsonArray<DegreeLevel>(row.degreeLevels),
    fundingType: row.fundingType,
    tuitionCoverage: row.tuitionCoverage,
    monthlyStipend: row.monthlyStipend,
    accommodationCovered: row.accommodationCovered,
    airfareCovered: row.airfareCovered,
    healthInsuranceCovered: row.healthInsuranceCovered,
    applicationFeeCovered: row.applicationFeeCovered,
    otherBenefits: fromJsonArray<string>(row.otherBenefits),
    minimumEducation: row.minimumEducation,
    minimumGPA: row.minimumGPA,
    ageLimit: row.ageLimit,
    nationalityRequirements: row.nationalityRequirements,
    languageRequirements: row.languageRequirements,
    ieltsRequired: row.ieltsRequired,
    toeflRequired: row.toeflRequired,
    workExperienceRequired: row.workExperienceRequired,
    otherEligibility: row.otherEligibility,
    allNationalitiesEligible: row.allNationalitiesEligible,
    applicationDeadline: row.applicationDeadline ? row.applicationDeadline.toISOString() : null,
    isRolling: row.isRolling,
    openingDate: row.openingDate ? row.openingDate.toISOString() : null,
    primaryCountry: row.primaryCountry ? { name: row.primaryCountry.name, code: row.primaryCountry.code, slug: row.primaryCountry.slug } : null,
    destinationCity: row.destinationCity,
    region: row.region,
    eligibleCountries: row.eligibleCountries.map((c) => ({ name: c.country.name, slug: c.country.slug })),
    subjects: row.subjects.map((s) => ({ name: s.subject.name, slug: s.subject.slug })),
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    lastVerifiedAt: row.lastVerifiedAt ? row.lastVerifiedAt.toISOString() : null,
    sourceReliability: row.sourceReliability,
    applicationUrl: row.applicationUrl,
    officialUrl: row.officialUrl,
    isSeed: row.isSeed,
    tags: fromJsonArray<string>(row.tags),
    sourceLinks: row.sourceLinks.map((link) => ({ sourceName: link.source.name, sourceUrl: link.sourceUrl, isOfficial: link.isOfficial })),
  };
}

async function fetchScholarships(where: Prisma.ScholarshipWhereInput, orderBy: Prisma.ScholarshipOrderByWithRelationInput, take?: number) {
  const rows = await prisma.scholarship.findMany({ where, include: FULL_INCLUDE, orderBy, take });
  return rows.map(toStaticScholarship);
}

const PUBLISHED_OR_EXPIRED: Prisma.ScholarshipWhereInput = { status: { in: [ScholarshipStatus.PUBLISHED, ScholarshipStatus.EXPIRED] } };

export async function getScholarshipBySlug(slug: string): Promise<StaticScholarship | null> {
  const row = await prisma.scholarship.findUnique({ where: { slug }, include: FULL_INCLUDE });
  return row ? toStaticScholarship(row) : null;
}

export async function getAllPublishedSlugs(): Promise<string[]> {
  const rows = await prisma.scholarship.findMany({ where: PUBLISHED_OR_EXPIRED, select: { slug: true } });
  return rows.map((r) => r.slug);
}

export function getClosingSoon(limit = 20) {
  return fetchScholarships(
    { status: ScholarshipStatus.PUBLISHED, deadlineStatus: { in: [DeadlineStatus.CLOSING_SOON, DeadlineStatus.OPEN] }, applicationDeadline: { not: null } },
    { applicationDeadline: "asc" },
    limit,
  );
}

export function getFeatured(limit = 8) {
  return fetchScholarships(
    { status: ScholarshipStatus.PUBLISHED, fundingType: FundingType.FULLY_FUNDED },
    { createdAt: "desc" },
    limit,
  );
}

export function getRecentlyAdded(limit = 12) {
  return fetchScholarships({ status: ScholarshipStatus.PUBLISHED }, { createdAt: "desc" }, limit);
}

/** The full dataset for public/data/scholarships.json. */
export function getAllForStaticExport() {
  return fetchScholarships(PUBLISHED_OR_EXPIRED, { createdAt: "desc" });
}

export async function listCountriesWithCounts() {
  return prisma.country.findMany({
    where: { destinations: { some: { scholarship: PUBLISHED_OR_EXPIRED } } },
    select: { name: true, slug: true, code: true, region: true, _count: { select: { destinations: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listSubjectsWithCounts() {
  return prisma.subject.findMany({
    where: { scholarships: { some: { scholarship: PUBLISHED_OR_EXPIRED } } },
    select: { name: true, slug: true, category: true, _count: { select: { scholarships: true } } },
    orderBy: { name: "asc" },
  });
}
