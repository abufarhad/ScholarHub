import { DegreeLevel } from "@/lib/enums";

// Ordered so longer/more-specific phrases are tested before short ones that
// could false-positive as substrings (e.g. "post doc" before "doctor").
const DEGREE_PATTERNS: Array<[DegreeLevel, RegExp]> = [
  [DegreeLevel.POSTDOCTORAL, /\b(post[\s-]?doc(toral)?|postdoc)\b/i],
  [DegreeLevel.PHD, /\b(ph\.?d\.?|doctoral|doctorate)\b/i],
  [DegreeLevel.MASTERS, /\b(master'?s?|msc|m\.sc|ma\b|m\.a\.|mba|graduate\s+(degree|program)|postgraduate)\b/i],
  [DegreeLevel.UNDERGRADUATE, /\b(undergraduate|bachelor'?s?|bsc|b\.sc|ba\b|b\.a\.|bs\b)\b/i],
  [DegreeLevel.HIGH_SCHOOL, /\b(high school|secondary school|ssc\b|hsc\b|a[\s-]?levels?)\b/i],
  [DegreeLevel.FELLOWSHIP, /\bfellowship\b/i],
  [DegreeLevel.RESEARCH, /\bresearch\s+(program|position|grant|scholar)/i],
];

/**
 * Extract every degree level mentioned in free text. A scholarship post
 * commonly targets several levels at once ("for Master's and PhD students"),
 * so this returns all matches rather than the first one.
 */
export function normalizeDegreeLevels(text: string | string[] | undefined): DegreeLevel[] {
  if (!text) return [];
  const haystack = Array.isArray(text) ? text.join(" ") : text;
  const found = new Set<DegreeLevel>();
  for (const [level, pattern] of DEGREE_PATTERNS) {
    if (pattern.test(haystack)) found.add(level);
  }
  return Array.from(found);
}

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  HIGH_SCHOOL: "High School",
  UNDERGRADUATE: "Bachelor's",
  MASTERS: "Master's",
  PHD: "PhD",
  POSTDOCTORAL: "Postdoctoral",
  RESEARCH: "Research",
  FELLOWSHIP: "Fellowship",
  OTHER: "Other",
};
