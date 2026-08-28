import { DeadlineStatus } from "@/lib/enums";

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSING_SOON_THRESHOLD_DAYS = 21;
const UPCOMING_THRESHOLD_DAYS = 30; // opens within this window counts as "Upcoming"

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysRemaining: number | null;
}

/**
 * Single source of truth for deadline status across the app: crawl pipeline
 * (cached on the row for fast filtering/sorting), API responses, and the
 * nightly re-sweep job all call this instead of recomputing ad hoc.
 */
export function computeDeadlineInfo(
  applicationDeadline: Date | null,
  isRolling: boolean,
  openingDate: Date | null,
  now: Date = new Date(),
): DeadlineInfo {
  if (isRolling) {
    return { status: DeadlineStatus.ROLLING, daysRemaining: null };
  }

  if (openingDate && openingDate.getTime() > now.getTime()) {
    const daysUntilOpen = Math.ceil((openingDate.getTime() - now.getTime()) / DAY_MS);
    if (daysUntilOpen <= UPCOMING_THRESHOLD_DAYS || !applicationDeadline) {
      return { status: DeadlineStatus.UPCOMING, daysRemaining: null };
    }
  }

  if (!applicationDeadline) {
    return { status: DeadlineStatus.UNKNOWN, daysRemaining: null };
  }

  const daysRemaining = Math.ceil((applicationDeadline.getTime() - now.getTime()) / DAY_MS);

  if (daysRemaining < 0) return { status: DeadlineStatus.CLOSED, daysRemaining };
  if (daysRemaining <= CLOSING_SOON_THRESHOLD_DAYS) return { status: DeadlineStatus.CLOSING_SOON, daysRemaining };
  return { status: DeadlineStatus.OPEN, daysRemaining };
}

export const DEADLINE_STATUS_LABELS: Record<DeadlineStatus, string> = {
  OPEN: "Open",
  CLOSING_SOON: "Closing Soon",
  CLOSED: "Closed",
  UPCOMING: "Upcoming",
  ROLLING: "Rolling",
  UNKNOWN: "Unknown",
};

/** Best-effort parse of the free-text deadline strings scholarship posts use. */
export function parseDeadlineText(text: string | undefined): Date | null {
  if (!text) return null;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (/rolling|ongoing|no deadline|open until filled/i.test(cleaned)) return null;

  // "31 May 2027", "May 31, 2027", "2027-05-31", "31/05/2027", "05/31/2027"
  const patterns = [
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // ISO
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/, // 31 May 2027
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/, // May 31, 2027
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    const parsed = new Date(match[0]);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}
