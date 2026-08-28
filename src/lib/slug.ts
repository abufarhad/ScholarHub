export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

/** Strips trailing "(Fully Funded)"-style qualifiers and normalizes whitespace
 * so titles that differ only in that boilerplate hash/match as duplicates. */
export function normalizeTitleForDedup(title: string): string {
  return title
    .toLowerCase()
    .replace(/\(.*?(fully|partially|funded|scholarship|program|no ielts).*?\)/gi, "")
    .replace(/\b(20\d{2}([-/]\d{2,4})?)\b/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
