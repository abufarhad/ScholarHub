import { describe, it, expect } from "vitest";
import { DegreeLevel, FundingType } from "@prisma/client";
import { normalizeScholarship } from "@/lib/normalize/pipeline";
import type { RawScholarship } from "@/types/scholarship";

const RAW: RawScholarship = {
  sourceUrl: "https://example.com/mext-scholarship-2027",
  title: "MEXT Scholarship 2027 in Japan (Fully Funded)",
  descriptionText:
    "Host Country: Japan. Degree Level: Master's and PhD. Financial Benefits: Fully Funded. The scholarship covers full tuition, monthly stipend, and airfare. IELTS is not required. Application Deadline: 31 May 2027.",
  descriptionHtml: "<p>Host Country: Japan...</p>",
  applicationDeadlineRaw: "31 May 2027",
  officialUrl: "https://www.studyinjapan.go.jp/en/",
};

describe("normalizeScholarship", () => {
  const normalized = normalizeScholarship(RAW);

  it("normalizes degree levels from the title and body", () => {
    expect(normalized.degreeLevels).toEqual(expect.arrayContaining([DegreeLevel.MASTERS, DegreeLevel.PHD]));
  });

  it("normalizes funding type", () => {
    expect(normalized.fundingType).toBe(FundingType.FULLY_FUNDED);
  });

  it("normalizes destination country from the title", () => {
    expect(normalized.destinationCountryNames).toContain("Japan");
  });

  it("parses the deadline into a real Date", () => {
    expect(normalized.applicationDeadline).toBeInstanceOf(Date);
    expect(normalized.applicationDeadline?.getUTCFullYear()).toBe(2027);
  });

  it("detects IELTS not required from the body text", () => {
    expect(normalized.ieltsRequired).toBe("NOT_REQUIRED");
  });

  it("prefers the crawler-provided officialUrl for applicationUrl", () => {
    expect(normalized.applicationUrl).toBe(RAW.officialUrl);
  });

  it("produces a normalized title suitable for dedup matching", () => {
    expect(normalized.canonicalTitleNormalized).not.toContain("2027");
    expect(normalized.canonicalTitleNormalized).toContain("mext");
  });

  it("produces a stable, non-empty content hash", () => {
    expect(normalized.contentHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("defaults allNationalitiesEligible to true when no eligible countries were extracted", () => {
    expect(normalized.allNationalitiesEligible).toBe(true);
  });
});
