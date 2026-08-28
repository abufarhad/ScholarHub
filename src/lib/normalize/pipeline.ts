import { DeadlineType } from "@prisma/client";
import type { NormalizedScholarship, RawScholarship } from "@/types/scholarship";
import { normalizeDegreeLevels } from "./degree";
import { normalizeFundingType } from "./funding";
import { normalizeSubjects } from "./subject";
import { normalizeCountries } from "./country";
import { normalizeRequirementLevel } from "./requirement";
import { parseDeadlineText } from "@/lib/deadline";
import { normalizeTitleForDedup } from "@/lib/slug";
import { contentHash } from "@/lib/hash";

/**
 * Turns a crawler's free-text RawScholarship into the closed-vocabulary
 * NormalizedScholarship the database expects. This is the one place that
 * bridges "whatever a source's HTML says" and "what the schema stores" —
 * crawlers never touch enums directly, and callers downstream (dedup,
 * validation, persistence) never touch raw HTML.
 */
export function normalizeScholarship(raw: RawScholarship): NormalizedScholarship {
  const fullText = [raw.descriptionText, raw.title, raw.otherEligibility, raw.languageRequirements].filter(Boolean).join("\n");

  const degreeLevels = normalizeDegreeLevels([raw.title, ...(raw.degreeLevelsRaw ?? []), raw.descriptionText]);
  const fundingType = normalizeFundingType([raw.fundingTypeRaw, raw.title, raw.descriptionText].filter(Boolean).join(" "));
  const subjectNames = normalizeSubjects([...(raw.subjectsRaw ?? []), raw.descriptionText]);

  const destinationCountryNames = normalizeCountries([...(raw.destinationCountryRaw ?? []), raw.title]);
  const eligibleCountryNames = normalizeCountries(raw.eligibleCountriesRaw);

  const applicationDeadline = parseDeadlineText(raw.applicationDeadlineRaw);
  const openingDate = parseDeadlineText(raw.openingDateRaw);
  const isRolling = raw.isRolling ?? /rolling|ongoing|open until filled|no deadline/i.test(raw.applicationDeadlineRaw ?? "");

  const summary = raw.descriptionText.slice(0, 280).trim();
  const applicationUrl = raw.applicationUrl ?? raw.officialUrl ?? raw.sourceUrl;

  const normalized: NormalizedScholarship = {
    title: raw.title.trim(),
    canonicalTitleNormalized: normalizeTitleForDedup(raw.title),
    provider: raw.provider?.trim() || raw.organization?.trim() || null,
    university: raw.university?.trim() || null,
    organization: raw.organization?.trim() || null,
    // The detail page renders `description` as plain text, not HTML — using
    // descriptionHtml here would leak raw markup (tracking links, inline
    // styles, blogger image embeds) straight onto the page as visible text.
    // descriptionHtml is captured for a possible future rich-render feature
    // but must never be the source for this field.
    description: raw.descriptionText,
    summary: summary.length > 0 ? summary : null,

    degreeLevels,
    fundingType,

    tuitionCoverage: raw.tuitionCoverage ?? null,
    monthlyStipend: raw.monthlyStipend ?? null,
    accommodationCovered: raw.accommodationCovered ?? inferBenefit(fullText, "accommodation"),
    airfareCovered: raw.airfareCovered ?? inferBenefit(fullText, "airfare|air ticket|flight"),
    healthInsuranceCovered: raw.healthInsuranceCovered ?? inferBenefit(fullText, "health insurance|medical insurance"),
    applicationFeeCovered: raw.applicationFeeCovered ?? inferBenefit(fullText, "no application fee|application fee waived"),
    otherBenefits: raw.otherBenefits ?? [],

    minimumEducation: raw.minimumEducation ?? null,
    minimumGPA: raw.minimumGPA ?? extractGpa(fullText),
    ageLimit: raw.ageLimit ?? null,
    nationalityRequirements: raw.nationalityRequirements ?? null,
    languageRequirements: raw.languageRequirements ?? null,
    ieltsRequired: normalizeRequirementLevel(raw.ieltsRequiredRaw ?? fullText, "ielts"),
    toeflRequired: normalizeRequirementLevel(raw.toeflRequiredRaw ?? fullText, "toefl"),
    workExperienceRequired: raw.workExperienceRequired ?? null,
    otherEligibility: raw.otherEligibility ?? null,
    allNationalitiesEligible: raw.allNationalitiesEligible ?? eligibleCountryNames.length === 0,

    applicationDeadline,
    deadlineType: isRolling ? DeadlineType.ROLLING : applicationDeadline ? DeadlineType.FIXED : DeadlineType.UNKNOWN,
    isRolling,
    openingDate,

    destinationCountryNames,
    eligibleCountryNames,
    destinationCity: raw.destinationCityRaw ?? null,
    region: null,

    subjectNames,
    tags: raw.tags ?? [],

    publishedAt: raw.publishedAtRaw ? new Date(raw.publishedAtRaw) : null,
    applicationUrl,
    officialUrl: raw.officialUrl ?? null,

    contentHash: "", // filled in below once every other field is final
  };

  normalized.contentHash = contentHash([
    normalized.title,
    normalized.description,
    normalized.fundingType,
    normalized.degreeLevels.join(","),
    normalized.applicationDeadline?.toISOString(),
    normalized.applicationUrl,
  ]);

  return normalized;
}

function inferBenefit(text: string, pattern: string): boolean | null {
  const re = new RegExp(pattern, "i");
  return re.test(text) ? true : null;
}

function extractGpa(text: string): number | null {
  const match = text.match(/gpa\s*(?:of|:)?\s*(\d(?:\.\d+)?)\s*(?:\/|out of)?\s*(\d(?:\.\d+)?)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]);
  const scale = match[2] ? parseFloat(match[2]) : 4;
  if (Number.isNaN(value)) return null;
  // Normalize to a 4.0 scale so filtering ("min GPA 3.0") is comparable across
  // sources that quote GPA out of 4, 5, or 10.
  return scale && scale !== 4 ? Math.round((value / scale) * 4 * 100) / 100 : value;
}
