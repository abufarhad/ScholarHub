import { describe, it, expect } from "vitest";
import { titleSimilarity, significantWordDiff } from "@/lib/dedup";
import { normalizeTitleForDedup } from "@/lib/slug";

describe("titleSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(titleSimilarity("mext scholarship", "mext scholarship")).toBe(1);
  });

  it("returns 0 when either input is empty", () => {
    expect(titleSimilarity("", "mext scholarship")).toBe(0);
    expect(titleSimilarity("mext scholarship", "")).toBe(0);
  });

  it("scores near-identical titles (post-dedup-normalization) highly", () => {
    const a = normalizeTitleForDedup("MEXT Scholarship 2027 (Fully Funded)");
    const b = normalizeTitleForDedup("MEXT Scholarship 2026 Fully Funded Program");
    expect(titleSimilarity(a, b)).toBeGreaterThan(0.6);
  });

  it("scores unrelated titles low", () => {
    const a = normalizeTitleForDedup("MEXT Scholarship 2027");
    const b = normalizeTitleForDedup("Completely Unrelated Marine Biology Fellowship");
    expect(titleSimilarity(a, b)).toBeLessThan(0.3);
  });

  it("is symmetric", () => {
    const a = "chevening scholarship uk";
    const b = "chevening uk scholarship programme";
    expect(titleSimilarity(a, b)).toBeCloseTo(titleSimilarity(b, a), 10);
  });

  it("regression: char-trigram similarity alone would wrongly favor same-template sibling titles over a genuine reworded duplicate", () => {
    // This is exactly why significantWordDiff() exists as a gate — trigram
    // similarity on its own gets this backwards.
    const eastern = normalizeTitleForDedup("WomenLift Health Eastern Africa Leadership Journey 2027 (Fully-funded)");
    const nigeria = normalizeTitleForDedup("WomenLift Health Nigeria Leadership Journey 2027 (Fully-funded)");
    const mextA = normalizeTitleForDedup("MEXT Scholarship 2027 (Fully Funded)");
    const mextB = normalizeTitleForDedup("MEXT Scholarship 2026 Fully Funded Program");

    expect(titleSimilarity(eastern, nigeria)).toBeGreaterThan(titleSimilarity(mextA, mextB));
  });
});

describe("significantWordDiff", () => {
  it("is zero for titles differing only in boilerplate (years, 'fully funded', 'program')", () => {
    const a = normalizeTitleForDedup("MEXT Scholarship 2027 (Fully Funded)");
    const b = normalizeTitleForDedup("MEXT Scholarship 2026 Fully Funded Program");
    expect(significantWordDiff(a, b)).toBe(0);
  });

  it("rejects sibling regional programs sharing a title template (the WomenLift bug)", () => {
    const eastern = normalizeTitleForDedup("WomenLift Health Eastern Africa Leadership Journey 2027 (Fully-funded)");
    const nigeria = normalizeTitleForDedup("WomenLift Health Nigeria Leadership Journey 2027 (Fully-funded)");
    const southern = normalizeTitleForDedup("WomenLift Health Southern Africa Leadership Journey 2027 (Fully-funded)");
    expect(significantWordDiff(eastern, nigeria)).toBeGreaterThan(1);
    expect(significantWordDiff(eastern, southern)).toBeGreaterThan(1);
  });

  it("rejects sibling subject-variant fellowships sharing a title template (the Jesus College bug)", () => {
    const science = normalizeTitleForDedup("Jesus College Cambridge Science Research Fellowship 2026 (Paid)");
    const arts = normalizeTitleForDedup("Jesus College Cambridge Arts Research Fellowship 2026 (Paid)");
    expect(significantWordDiff(science, arts)).toBeGreaterThan(1);
  });

  it("rejects genuinely different degree-level programs from the same provider", () => {
    const embassy = normalizeTitleForDedup("MEXT Japanese Government Scholarship 2027 (Embassy Track)");
    const undergrad = normalizeTitleForDedup("MEXT Undergraduate Scholarship 2027");
    expect(significantWordDiff(embassy, undergrad)).toBeGreaterThan(1);
  });

  it("tolerates a single extra qualifier word", () => {
    const a = normalizeTitleForDedup("Chevening Scholarships");
    const b = normalizeTitleForDedup("Chevening Scholarships UK");
    expect(significantWordDiff(a, b)).toBeLessThanOrEqual(1);
  });
});
