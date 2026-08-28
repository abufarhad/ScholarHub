import { describe, it, expect } from "vitest";
import { DegreeLevel } from "@prisma/client";
import { normalizeDegreeLevels } from "@/lib/normalize/degree";
import { normalizeFundingType } from "@/lib/normalize/funding";
import { normalizeSubjects } from "@/lib/normalize/subject";
import { normalizeCountries } from "@/lib/normalize/country";
import { normalizeRequirementLevel } from "@/lib/normalize/requirement";

describe("normalizeDegreeLevels", () => {
  it("detects multiple degree levels mentioned together", () => {
    const result = normalizeDegreeLevels("Open to Master's and PhD students in Japan");
    expect(result).toEqual(expect.arrayContaining([DegreeLevel.MASTERS, DegreeLevel.PHD]));
    expect(result).toHaveLength(2);
  });

  it("maps common synonyms to the canonical enum", () => {
    expect(normalizeDegreeLevels("Bachelor's degree required")).toContain(DegreeLevel.UNDERGRADUATE);
    expect(normalizeDegreeLevels("BSc in Computer Science")).toContain(DegreeLevel.UNDERGRADUATE);
    expect(normalizeDegreeLevels("Postdoctoral research fellow")).toContain(DegreeLevel.POSTDOCTORAL);
  });

  it("returns an empty array when nothing matches", () => {
    expect(normalizeDegreeLevels("A generic announcement with no level mentioned")).toEqual([]);
  });

  it("does not misclassify postdoctoral as doctoral/PhD", () => {
    const result = normalizeDegreeLevels("Postdoc position open");
    expect(result).toContain(DegreeLevel.POSTDOCTORAL);
  });
});

describe("normalizeFundingType", () => {
  it("prioritizes 'fully funded' over weaker signals in the same text", () => {
    expect(normalizeFundingType("This fully funded scholarship also includes a stipend")).toBe("FULLY_FUNDED");
  });

  it("falls back to OTHER when nothing matches", () => {
    expect(normalizeFundingType("Please see the official website for details")).toBe("OTHER");
  });

  it("detects tuition waiver distinctly from tuition-only", () => {
    expect(normalizeFundingType("Tuition waiver for all admitted students")).toBe("TUITION_WAIVER");
  });
});

describe("normalizeSubjects", () => {
  it("maps synonyms to canonical subject names", () => {
    const result = normalizeSubjects("Looking for candidates in Machine Learning and Data Analytics");
    expect(result).toContain("Artificial Intelligence");
    expect(result).toContain("Data Science");
  });

  it("returns unique canonical subjects even with repeated mentions", () => {
    const result = normalizeSubjects("Computer Science, computing, CS students welcome");
    expect(result.filter((s) => s === "Computer Science")).toHaveLength(1);
  });
});

describe("normalizeCountries", () => {
  it("resolves common aliases to canonical country names", () => {
    expect(normalizeCountries("Study in the USA")).toContain("United States");
    expect(normalizeCountries("scholarships in the UK")).toContain("United Kingdom");
    expect(normalizeCountries("Korea Scholarship")).toContain("South Korea");
  });

  it("uses word boundaries so a country name doesn't match inside a longer word", () => {
    // "India" must not match within "Indianapolis" or "Indian Ocean Territory"-style text
    expect(normalizeCountries("A conference in Indianapolis")).not.toContain("India");
  });
});

describe("normalizeRequirementLevel", () => {
  it("detects explicit not-required phrasing", () => {
    expect(normalizeRequirementLevel("IELTS is not required for native English speakers", "ielts")).toBe("NOT_REQUIRED");
  });

  it("defaults to REQUIRED when keyword appears without qualifying language", () => {
    expect(normalizeRequirementLevel("Applicants must submit an IELTS score of 6.5", "ielts")).toBe("REQUIRED");
  });

  it("returns UNKNOWN when the keyword never appears", () => {
    expect(normalizeRequirementLevel("No mention of language tests here", "ielts")).toBe("UNKNOWN");
  });
});
