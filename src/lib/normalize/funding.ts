import { FundingType } from "@/lib/enums";

// Order matters: check the most specific/authoritative phrase first, since a
// post can mention several funding words ("fully funded" implies more than a
// generic "stipend" mention elsewhere in the body).
const FUNDING_PATTERNS: Array<[FundingType, RegExp]> = [
  [FundingType.FULLY_FUNDED, /\bfully[\s-]?funded\b/i],
  [FundingType.TUITION_WAIVER, /\btuition[\s-]?(waiver|exemption|free)\b/i],
  [FundingType.TUITION_ONLY, /\btuition[\s-]?(only|coverage|fee)\b(?!.*fully)/i],
  [FundingType.PARTIALLY_FUNDED, /\bpartial(ly)?[\s-]?funded\b/i],
  [FundingType.FELLOWSHIP, /\bfellowship\b/i],
  [FundingType.GRANT, /\bgrant\b/i],
  [FundingType.STIPEND, /\bstipend\b/i],
];

export function normalizeFundingType(text: string | undefined): FundingType {
  if (!text) return FundingType.OTHER;
  for (const [type, pattern] of FUNDING_PATTERNS) {
    if (pattern.test(text)) return type;
  }
  return FundingType.OTHER;
}

export const FUNDING_TYPE_LABELS: Record<FundingType, string> = {
  FULLY_FUNDED: "Fully Funded",
  PARTIALLY_FUNDED: "Partially Funded",
  TUITION_WAIVER: "Tuition Waiver",
  TUITION_ONLY: "Tuition Only",
  STIPEND: "Stipend",
  FELLOWSHIP: "Fellowship",
  GRANT: "Grant",
  OTHER: "Other",
};
