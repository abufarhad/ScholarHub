import type { DegreeLevel, FundingType, RequirementLevel, DeadlineType } from "@prisma/client";

/**
 * What a crawler adapter hands back for a single scholarship page, before any
 * normalization/dedup/validation happens. Field names are intentionally
 * loose/free-text (e.g. degreeLevelsRaw, countryRaw) — the normalization
 * layer (src/lib/normalize) turns these into the closed vocabularies the DB
 * expects. Keeping raw text here means a crawler never needs to know about
 * enum values, and the normalizer never needs to know about HTML.
 */
export interface RawScholarship {
  sourceUrl: string;
  externalId?: string;

  title: string;
  provider?: string;
  university?: string;
  organization?: string;
  descriptionHtml: string;
  descriptionText: string;

  degreeLevelsRaw?: string[];
  fundingTypeRaw?: string;
  subjectsRaw?: string[];

  destinationCountryRaw?: string[];
  destinationCityRaw?: string;
  eligibleCountriesRaw?: string[];
  allNationalitiesEligible?: boolean;

  tuitionCoverage?: string;
  monthlyStipend?: string;
  accommodationCovered?: boolean;
  airfareCovered?: boolean;
  healthInsuranceCovered?: boolean;
  applicationFeeCovered?: boolean;
  otherBenefits?: string[];

  minimumEducation?: string;
  minimumGPA?: number;
  ageLimit?: string;
  nationalityRequirements?: string;
  languageRequirements?: string;
  ieltsRequiredRaw?: string;
  toeflRequiredRaw?: string;
  workExperienceRequired?: boolean;
  otherEligibility?: string;

  applicationDeadlineRaw?: string;
  isRolling?: boolean;
  openingDateRaw?: string;

  publishedAtRaw?: string;
  lastUpdatedAtRaw?: string;

  /** Best-known link to apply / find full official info. Falls back to sourceUrl. */
  applicationUrl?: string;
  /** Set when the crawler is confident this URL is the provider's own site, not the aggregator. */
  officialUrl?: string;

  tags?: string[];
}

export interface NormalizedScholarship {
  title: string;
  canonicalTitleNormalized: string;
  provider: string | null;
  university: string | null;
  organization: string | null;
  description: string;
  summary: string | null;

  degreeLevels: DegreeLevel[];
  fundingType: FundingType;

  tuitionCoverage: string | null;
  monthlyStipend: string | null;
  accommodationCovered: boolean | null;
  airfareCovered: boolean | null;
  healthInsuranceCovered: boolean | null;
  applicationFeeCovered: boolean | null;
  otherBenefits: string[];

  minimumEducation: string | null;
  minimumGPA: number | null;
  ageLimit: string | null;
  nationalityRequirements: string | null;
  languageRequirements: string | null;
  ieltsRequired: RequirementLevel;
  toeflRequired: RequirementLevel;
  workExperienceRequired: boolean | null;
  otherEligibility: string | null;
  allNationalitiesEligible: boolean;

  applicationDeadline: Date | null;
  deadlineType: DeadlineType;
  isRolling: boolean;
  openingDate: Date | null;

  destinationCountryNames: string[];
  eligibleCountryNames: string[];
  destinationCity: string | null;
  region: string | null;

  subjectNames: string[];
  tags: string[];

  publishedAt: Date | null;
  applicationUrl: string;
  officialUrl: string | null;

  contentHash: string;
}

export interface CrawlerDefinition {
  key: string;
  crawl(): AsyncGenerator<RawScholarship>;
}
