import { DegreeLevel, FundingType, RequirementLevel, DeadlineStatus } from "@/lib/enums";
import type { ScholarshipFilters } from "@/lib/client-search";

export type SearchParamsInput = Record<string, string | string[] | undefined>;

function toList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw.split(",").map((v) => v.trim()).filter(Boolean);
}

function filterEnum<T extends string>(values: string[], enumObj: Record<string, T>): T[] {
  const valid = new Set(Object.values(enumObj));
  return values.filter((v): v is T => valid.has(v as T));
}

const DEADLINE_PRESETS: Record<string, { deadlineWithinDays?: number; deadlineStatuses?: DeadlineStatus[] }> = {
  "closing-week": { deadlineWithinDays: 7 },
  "closing-month": { deadlineWithinDays: 30 },
  open: { deadlineStatuses: [DeadlineStatus.OPEN, DeadlineStatus.CLOSING_SOON] },
  upcoming: { deadlineStatuses: [DeadlineStatus.UPCOMING] },
  rolling: { deadlineStatuses: [DeadlineStatus.ROLLING] },
};

export function parseSearchParamsToFilters(searchParams: SearchParamsInput): ScholarshipFilters {
  const page = Number(firstValue(searchParams.page)) || 1;
  const q = firstValue(searchParams.q)?.trim() || undefined;
  const sort = (firstValue(searchParams.sort) as ScholarshipFilters["sort"]) || undefined;

  const preset = firstValue(searchParams.deadline);
  const presetFilters = preset ? DEADLINE_PRESETS[preset] : undefined;

  return {
    q,
    page,
    sort,
    degreeLevels: filterEnum(toList(searchParams.degreeLevels), DegreeLevel),
    fundingTypes: filterEnum(toList(searchParams.fundingTypes), FundingType),
    subjects: toList(searchParams.subjects),
    destinationCountries: toList(searchParams.countries),
    eligibleNationality: firstValue(searchParams.nationality),
    ielts: filterEnum(toList(searchParams.ielts), RequirementLevel),
    minGpaAtMost: searchParams.minGpa ? Number(firstValue(searchParams.minGpa)) : undefined,
    ...presetFilters,
  };
}

function firstValue(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
