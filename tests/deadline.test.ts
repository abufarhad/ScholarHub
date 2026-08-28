import { describe, it, expect } from "vitest";
import { computeDeadlineInfo, parseDeadlineText } from "@/lib/deadline";

const NOW = new Date("2026-08-28T00:00:00Z");

describe("computeDeadlineInfo", () => {
  it("marks rolling admissions as ROLLING regardless of any deadline field", () => {
    const result = computeDeadlineInfo(new Date("2020-01-01"), true, null, NOW);
    expect(result.status).toBe("ROLLING");
    expect(result.daysRemaining).toBeNull();
  });

  it("marks a past deadline as CLOSED and flags expiry for the caller", () => {
    const result = computeDeadlineInfo(new Date("2026-01-01"), false, null, NOW);
    expect(result.status).toBe("CLOSED");
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it("marks a deadline within the closing-soon window as CLOSING_SOON", () => {
    const soon = new Date(NOW.getTime() + 10 * 86_400_000);
    const result = computeDeadlineInfo(soon, false, null, NOW);
    expect(result.status).toBe("CLOSING_SOON");
    expect(result.daysRemaining).toBe(10);
  });

  it("marks a far-future deadline as OPEN", () => {
    const future = new Date(NOW.getTime() + 90 * 86_400_000);
    const result = computeDeadlineInfo(future, false, null, NOW);
    expect(result.status).toBe("OPEN");
  });

  it("marks a scholarship that hasn't opened yet as UPCOMING", () => {
    const opensIn10Days = new Date(NOW.getTime() + 10 * 86_400_000);
    const result = computeDeadlineInfo(null, false, opensIn10Days, NOW);
    expect(result.status).toBe("UPCOMING");
  });

  it("returns UNKNOWN when there's no deadline, opening date, or rolling flag", () => {
    const result = computeDeadlineInfo(null, false, null, NOW);
    expect(result.status).toBe("UNKNOWN");
  });
});

describe("parseDeadlineText", () => {
  it("parses ISO-style dates", () => {
    const parsed = parseDeadlineText("2027-05-31");
    expect(parsed?.getUTCFullYear()).toBe(2027);
    expect(parsed?.getUTCMonth()).toBe(4); // 0-indexed May
  });

  it("parses 'Month DD, YYYY' dates", () => {
    const parsed = parseDeadlineText("May 31, 2027");
    expect(parsed?.getUTCFullYear()).toBe(2027);
  });

  it("parses 'DD Month YYYY' dates", () => {
    const parsed = parseDeadlineText("31 May 2027");
    expect(parsed?.getUTCFullYear()).toBe(2027);
  });

  it("returns null for rolling/no-deadline phrasing instead of guessing a date", () => {
    expect(parseDeadlineText("Rolling admission, apply anytime")).toBeNull();
    expect(parseDeadlineText("No deadline")).toBeNull();
  });

  it("returns null when the text has no recognizable date", () => {
    expect(parseDeadlineText("Contact the office for more information")).toBeNull();
  });
});
