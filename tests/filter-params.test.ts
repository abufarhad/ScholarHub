import { describe, it, expect } from "vitest";
import { parseSearchParamsToFilters } from "@/lib/filter-params";

describe("parseSearchParamsToFilters", () => {
  it("parses comma-separated enum lists and drops invalid values", () => {
    const filters = parseSearchParamsToFilters({ degreeLevels: "MASTERS,PHD,NOT_A_REAL_LEVEL" });
    expect(filters.degreeLevels).toEqual(["MASTERS", "PHD"]);
  });

  it("defaults page to 1 when missing or invalid", () => {
    expect(parseSearchParamsToFilters({}).page).toBe(1);
    expect(parseSearchParamsToFilters({ page: "not-a-number" }).page).toBe(1);
  });

  it("parses a numeric page", () => {
    expect(parseSearchParamsToFilters({ page: "3" }).page).toBe(3);
  });

  it("maps the 'closing-week' deadline preset to a 7-day window", () => {
    const filters = parseSearchParamsToFilters({ deadline: "closing-week" });
    expect(filters.deadlineWithinDays).toBe(7);
  });

  it("maps the 'rolling' deadline preset to the ROLLING status", () => {
    const filters = parseSearchParamsToFilters({ deadline: "rolling" });
    expect(filters.deadlineStatuses).toEqual(["ROLLING"]);
  });

  it("trims the search query", () => {
    expect(parseSearchParamsToFilters({ q: "  computer science  " }).q).toBe("computer science");
  });

  it("parses minGpa as a number", () => {
    expect(parseSearchParamsToFilters({ minGpa: "3.5" }).minGpaAtMost).toBe(3.5);
  });
});
