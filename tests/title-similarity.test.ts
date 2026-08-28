import { describe, it, expect } from "vitest";
import { titleSimilarity } from "@/lib/dedup";
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
});
