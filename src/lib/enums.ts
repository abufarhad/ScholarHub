/**
 * Plain, browser-safe mirrors of the enums in prisma/schema.prisma.
 *
 * `@prisma/client`'s generated module has top-level code that assumes a
 * Node.js environment (engine detection, etc.) and does not survive being
 * bundled into client-side JavaScript — importing its enum *values*
 * (`DegreeLevel.MASTERS`, not just the `DegreeLevel` *type*) into any file
 * that ends up in the browser bundle (anything imported, even transitively,
 * from a "use client" component) throws at runtime. Every value in this
 * file is a plain string constant, so it's safe to import from both server
 * and client code. Prisma's own generated enum types are structurally
 * string-literal unions, so these are interchangeable with `@prisma/client`'s
 * types wherever one is expected.
 *
 * Keep these in sync with prisma/schema.prisma by hand — there are few
 * enough that a codegen step isn't worth the complexity.
 */

export const DegreeLevel = {
  HIGH_SCHOOL: "HIGH_SCHOOL",
  UNDERGRADUATE: "UNDERGRADUATE",
  MASTERS: "MASTERS",
  PHD: "PHD",
  POSTDOCTORAL: "POSTDOCTORAL",
  RESEARCH: "RESEARCH",
  FELLOWSHIP: "FELLOWSHIP",
  OTHER: "OTHER",
} as const;
export type DegreeLevel = (typeof DegreeLevel)[keyof typeof DegreeLevel];

export const FundingType = {
  FULLY_FUNDED: "FULLY_FUNDED",
  PARTIALLY_FUNDED: "PARTIALLY_FUNDED",
  TUITION_WAIVER: "TUITION_WAIVER",
  TUITION_ONLY: "TUITION_ONLY",
  STIPEND: "STIPEND",
  FELLOWSHIP: "FELLOWSHIP",
  GRANT: "GRANT",
  OTHER: "OTHER",
} as const;
export type FundingType = (typeof FundingType)[keyof typeof FundingType];

export const RequirementLevel = {
  REQUIRED: "REQUIRED",
  NOT_REQUIRED: "NOT_REQUIRED",
  OPTIONAL: "OPTIONAL",
  UNKNOWN: "UNKNOWN",
} as const;
export type RequirementLevel = (typeof RequirementLevel)[keyof typeof RequirementLevel];

export const DeadlineType = {
  FIXED: "FIXED",
  ROLLING: "ROLLING",
  ANNUAL: "ANNUAL",
  UNKNOWN: "UNKNOWN",
} as const;
export type DeadlineType = (typeof DeadlineType)[keyof typeof DeadlineType];

export const DeadlineStatus = {
  OPEN: "OPEN",
  CLOSING_SOON: "CLOSING_SOON",
  CLOSED: "CLOSED",
  UPCOMING: "UPCOMING",
  ROLLING: "ROLLING",
  UNKNOWN: "UNKNOWN",
} as const;
export type DeadlineStatus = (typeof DeadlineStatus)[keyof typeof DeadlineStatus];

export const ScholarshipStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  EXPIRED: "EXPIRED",
  ARCHIVED: "ARCHIVED",
  REJECTED: "REJECTED",
} as const;
export type ScholarshipStatus = (typeof ScholarshipStatus)[keyof typeof ScholarshipStatus];

export const SourceReliability = {
  OFFICIAL_PROVIDER: "OFFICIAL_PROVIDER",
  OFFICIAL_GOVERNMENT: "OFFICIAL_GOVERNMENT",
  UNIVERSITY: "UNIVERSITY",
  VERIFIED_AGGREGATOR: "VERIFIED_AGGREGATOR",
  AGGREGATOR: "AGGREGATOR",
  UNKNOWN: "UNKNOWN",
} as const;
export type SourceReliability = (typeof SourceReliability)[keyof typeof SourceReliability];
