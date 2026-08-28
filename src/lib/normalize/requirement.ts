import { RequirementLevel } from "@/lib/enums";

/**
 * Reads a requirement's status (IELTS/TOEFL/etc.) out of free text near the
 * keyword. Looks for explicit "not required"/"optional" phrasing before
 * falling back to "required" when the keyword is merely mentioned, and
 * UNKNOWN when the keyword never appears at all — we never guess.
 */
export function normalizeRequirementLevel(text: string | undefined, keyword: string): RequirementLevel {
  if (!text) return RequirementLevel.UNKNOWN;
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return RequirementLevel.UNKNOWN;

  const windowText = text.slice(Math.max(0, idx - 60), idx + 80).toLowerCase();
  if (/not\s+(required|mandatory|needed)|waived|no\s+need/.test(windowText)) {
    return RequirementLevel.NOT_REQUIRED;
  }
  if (/optional|preferred|if available|not mandatory/.test(windowText)) {
    return RequirementLevel.OPTIONAL;
  }
  if (/required|mandatory|must (have|submit|provide)|minimum score/.test(windowText)) {
    return RequirementLevel.REQUIRED;
  }
  return RequirementLevel.UNKNOWN;
}
