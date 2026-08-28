import { DegreeLevel, FundingType, RequirementLevel, DeadlineStatus } from "@/lib/enums";
import type { StaticScholarship } from "@/types/static-data";
import { computeDeadlineInfo } from "@/lib/deadline";

/**
 * Everything the old Postgres `WHERE`/full-text-search layer did, reimplemented
 * as plain array filtering over the JSON dataset shipped to the browser. This
 * runs entirely client-side — there is no server to query. At the dataset
 * sizes this platform targets (hundreds to low thousands of scholarships),
 * filtering an in-memory array is faster than a network round trip would be.
 */
export interface ScholarshipFilters {
  q?: string;
  degreeLevels?: DegreeLevel[];
  subjects?: string[]; // subject slugs
  destinationCountries?: string[]; // country slugs
  eligibleNationality?: string; // country slug, or "all"
  fundingTypes?: FundingType[];
  deadlineStatuses?: DeadlineStatus[];
  deadlineWithinDays?: number;
  ielts?: RequirementLevel[];
  minGpaAtMost?: number;
  page?: number;
  pageSize?: number;
  sort?: "relevance" | "deadline" | "newest";
}

export interface ScoredScholarship {
  item: StaticScholarship;
  deadlineStatus: DeadlineStatus;
  daysRemaining: number | null;
  searchScore: number;
}

function matchesSearch(item: StaticScholarship, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  const terms = q.split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 1;

  const title = item.title.toLowerCase();
  const provider = (item.provider ?? "").toLowerCase();
  const university = (item.university ?? "").toLowerCase();
  const country = (item.primaryCountry?.name ?? "").toLowerCase();
  const subjects = item.subjects.map((s) => s.name.toLowerCase()).join(" ");
  const description = item.description.toLowerCase();
  const tags = item.tags.join(" ").toLowerCase();

  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 5;
    if (provider.includes(term) || university.includes(term)) score += 3;
    if (country.includes(term)) score += 3;
    if (subjects.includes(term)) score += 3;
    if (tags.includes(term)) score += 2;
    if (description.includes(term)) score += 1;
  }
  return score;
}

export function filterAndScoreScholarships(items: StaticScholarship[], filters: ScholarshipFilters, now: Date = new Date()): ScoredScholarship[] {
  const results: ScoredScholarship[] = [];

  for (const item of items) {
    if (filters.degreeLevels?.length && !item.degreeLevels.some((d) => filters.degreeLevels!.includes(d))) continue;
    if (filters.fundingTypes?.length && !filters.fundingTypes.includes(item.fundingType)) continue;
    if (filters.ielts?.length && !filters.ielts.includes(item.ieltsRequired)) continue;
    if (filters.minGpaAtMost !== undefined && item.minimumGPA != null && item.minimumGPA > filters.minGpaAtMost) continue;
    if (filters.subjects?.length && !item.subjects.some((s) => filters.subjects!.includes(s.slug))) continue;
    if (filters.destinationCountries?.length && item.primaryCountry && !filters.destinationCountries.includes(item.primaryCountry.slug)) continue;
    if (filters.destinationCountries?.length && !item.primaryCountry) continue;
    if (filters.eligibleNationality && filters.eligibleNationality !== "all") {
      const eligible = item.allNationalitiesEligible || item.eligibleCountries.some((c) => c.slug === filters.eligibleNationality);
      if (!eligible) continue;
    }

    const deadline = item.applicationDeadline ? new Date(item.applicationDeadline) : null;
    const opening = item.openingDate ? new Date(item.openingDate) : null;
    const { status, daysRemaining } = computeDeadlineInfo(deadline, item.isRolling, opening, now);

    if (filters.deadlineStatuses?.length && !filters.deadlineStatuses.includes(status)) continue;
    if (filters.deadlineWithinDays !== undefined) {
      if (!deadline) continue;
      const days = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
      if (days < 0 || days > filters.deadlineWithinDays) continue;
    }

    const searchScore = matchesSearch(item, filters.q ?? "");
    if (filters.q?.trim() && searchScore <= 0) continue;

    results.push({ item, deadlineStatus: status, daysRemaining, searchScore });
  }

  const sort = filters.sort ?? (filters.q?.trim() ? "relevance" : "newest");
  results.sort((a, b) => {
    if (sort === "relevance") return b.searchScore - a.searchScore;
    if (sort === "deadline") {
      const aTime = a.item.applicationDeadline ? new Date(a.item.applicationDeadline).getTime() : Infinity;
      const bTime = b.item.applicationDeadline ? new Date(b.item.applicationDeadline).getTime() : Infinity;
      return aTime - bTime;
    }
    // "newest" — publishedAt desc, falling back to title for stable ordering
    const aTime = a.item.publishedAt ? new Date(a.item.publishedAt).getTime() : 0;
    const bTime = b.item.publishedAt ? new Date(b.item.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return results;
}

export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length };
}
