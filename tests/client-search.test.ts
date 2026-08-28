import { describe, it, expect } from "vitest";
import { filterAndScoreScholarships, paginate } from "@/lib/client-search";
import { DegreeLevel, FundingType, RequirementLevel } from "@/lib/enums";
import type { StaticScholarship } from "@/types/static-data";

const NOW = new Date("2026-08-28T00:00:00Z");

function makeItem(overrides: Partial<StaticScholarship> & { id: string; title: string }): StaticScholarship {
  return {
    slug: overrides.id,
    provider: null,
    university: null,
    organization: null,
    description: "A scholarship for testing.",
    summary: null,
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.FULLY_FUNDED,
    tuitionCoverage: null,
    monthlyStipend: null,
    accommodationCovered: null,
    airfareCovered: null,
    healthInsuranceCovered: null,
    applicationFeeCovered: null,
    otherBenefits: [],
    minimumEducation: null,
    minimumGPA: null,
    ageLimit: null,
    nationalityRequirements: null,
    languageRequirements: null,
    ieltsRequired: RequirementLevel.UNKNOWN,
    toeflRequired: RequirementLevel.UNKNOWN,
    workExperienceRequired: null,
    otherEligibility: null,
    allNationalitiesEligible: true,
    applicationDeadline: "2026-12-01T00:00:00Z",
    isRolling: false,
    openingDate: null,
    primaryCountry: { name: "Japan", code: "JP", slug: "japan" },
    destinationCity: null,
    region: null,
    eligibleCountries: [],
    subjects: [{ name: "Computer Science", slug: "computer-science" }],
    publishedAt: "2026-08-01T00:00:00Z",
    lastVerifiedAt: null,
    sourceReliability: "AGGREGATOR",
    applicationUrl: "https://example.com/apply",
    officialUrl: null,
    isSeed: true,
    tags: [],
    sourceLinks: [{ sourceName: "Test Source", sourceUrl: "https://example.com/apply", isOfficial: false }],
    ...overrides,
  };
}

const DATASET: StaticScholarship[] = [
  makeItem({ id: "mext", title: "MEXT Scholarship 2027 in Japan", degreeLevels: [DegreeLevel.MASTERS, DegreeLevel.PHD] }),
  makeItem({
    id: "chevening",
    title: "Chevening Scholarship for UK Study",
    primaryCountry: { name: "United Kingdom", code: "GB", slug: "united-kingdom" },
    fundingType: FundingType.FULLY_FUNDED,
    applicationDeadline: "2026-09-01T00:00:00Z",
    subjects: [{ name: "Business", slug: "business" }],
  }),
  makeItem({
    id: "partial",
    title: "Partial Tuition Award",
    fundingType: FundingType.PARTIALLY_FUNDED,
    degreeLevels: [DegreeLevel.UNDERGRADUATE],
    applicationDeadline: null,
    isRolling: true,
  }),
];

describe("filterAndScoreScholarships", () => {
  it("returns everything when no filters are set", () => {
    const results = filterAndScoreScholarships(DATASET, {}, NOW);
    expect(results).toHaveLength(3);
  });

  it("filters by degree level", () => {
    const results = filterAndScoreScholarships(DATASET, { degreeLevels: [DegreeLevel.PHD] }, NOW);
    expect(results.map((r) => r.item.slug)).toEqual(["mext"]);
  });

  it("filters by funding type", () => {
    const results = filterAndScoreScholarships(DATASET, { fundingTypes: [FundingType.PARTIALLY_FUNDED] }, NOW);
    expect(results.map((r) => r.item.slug)).toEqual(["partial"]);
  });

  it("filters by destination country", () => {
    const results = filterAndScoreScholarships(DATASET, { destinationCountries: ["united-kingdom"] }, NOW);
    expect(results.map((r) => r.item.slug)).toEqual(["chevening"]);
  });

  it("filters by subject", () => {
    const results = filterAndScoreScholarships(DATASET, { subjects: ["business"] }, NOW);
    expect(results.map((r) => r.item.slug)).toEqual(["chevening"]);
  });

  it("matches free-text search against title and ranks by relevance", () => {
    // "partial" also matches on country (its default primaryCountry is Japan),
    // but "mext" scores higher because the term appears in its title too.
    const results = filterAndScoreScholarships(DATASET, { q: "Japan" }, NOW);
    expect(results[0].item.slug).toBe("mext");
    expect(results.map((r) => r.item.slug)).toEqual(expect.arrayContaining(["mext", "partial"]));
    expect(results.map((r) => r.item.slug)).not.toContain("chevening");
  });

  it("excludes rolling scholarships from a deadlineWithinDays filter", () => {
    const results = filterAndScoreScholarships(DATASET, { deadlineWithinDays: 10 }, NOW);
    expect(results.map((r) => r.item.slug)).toEqual(["chevening"]);
  });

  it("computes ROLLING deadline status for isRolling items regardless of a null deadline", () => {
    const results = filterAndScoreScholarships(DATASET, {}, NOW);
    const partial = results.find((r) => r.item.slug === "partial");
    expect(partial?.deadlineStatus).toBe("ROLLING");
  });

  it("sorts by nearest deadline when sort is 'deadline'", () => {
    const results = filterAndScoreScholarships(DATASET, { sort: "deadline" }, NOW);
    const withDeadlines = results.filter((r) => r.item.applicationDeadline);
    expect(withDeadlines[0].item.slug).toBe("chevening"); // Sep 1 comes before Dec 1
  });

  it("combines multiple filters with AND semantics", () => {
    const results = filterAndScoreScholarships(DATASET, { degreeLevels: [DegreeLevel.MASTERS], fundingTypes: [FundingType.PARTIALLY_FUNDED] }, NOW);
    expect(results).toHaveLength(0);
  });
});

describe("paginate", () => {
  it("slices results and reports the true total", () => {
    const items = Array.from({ length: 25 }, (_, i) => i);
    const page1 = paginate(items, 1, 10);
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(25);
    const page3 = paginate(items, 3, 10);
    expect(page3.items).toHaveLength(5);
  });
});
