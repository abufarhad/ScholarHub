import { describe, it, expect } from "vitest";
import { slugify, normalizeTitleForDedup } from "@/lib/slug";
import { contentHash } from "@/lib/hash";

describe("slugify", () => {
  it("produces a URL-safe, lowercase slug", () => {
    expect(slugify("MEXT Japanese Government Scholarship 2027!")).toBe("mext-japanese-government-scholarship-2027");
  });

  it("collapses repeated separators and trims leading/trailing dashes", () => {
    expect(slugify("  Hello   World -- Test  ")).toBe("hello-world-test");
  });
});

describe("normalizeTitleForDedup", () => {
  it("treats titles differing only by year and funding-status boilerplate as identical", () => {
    const a = normalizeTitleForDedup("MEXT Scholarship 2027 (Fully Funded)");
    const b = normalizeTitleForDedup("MEXT Scholarship 2026 (Fully Funded)");
    expect(a).toBe(b);
  });

  it("still distinguishes genuinely different scholarship names", () => {
    const a = normalizeTitleForDedup("MEXT Scholarship 2027 (Fully Funded)");
    const b = normalizeTitleForDedup("Chevening Scholarship 2027 (Fully Funded)");
    expect(a).not.toBe(b);
  });
});

describe("contentHash", () => {
  it("is deterministic for the same input", () => {
    const parts = ["Title", "Description", "FULLY_FUNDED", "2027-05-31", "https://example.com/apply"];
    expect(contentHash(parts)).toBe(contentHash(parts));
  });

  it("is case- and whitespace-insensitive (aggregators reformat text inconsistently)", () => {
    const a = contentHash(["  Title  ", "desc"]);
    const b = contentHash(["title", "DESC"]);
    expect(a).toBe(b);
  });

  it("changes when meaningful content changes", () => {
    const a = contentHash(["Title", "Description v1"]);
    const b = contentHash(["Title", "Description v2"]);
    expect(a).not.toBe(b);
  });

  it("treats null/undefined the same as an empty string", () => {
    expect(contentHash(["a", null])).toBe(contentHash(["a", ""]));
    expect(contentHash(["a", undefined])).toBe(contentHash(["a", ""]));
  });
});
