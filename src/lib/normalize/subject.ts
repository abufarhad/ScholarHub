// Canonical subject catalog. Keys are the canonical display name (also used
// to seed the Subject table); values are alternate phrasings/synonyms found
// across source sites that should map to that same canonical subject.
export const SUBJECT_CATALOG: Record<string, { category: string; synonyms: string[] }> = {
  "Computer Science": { category: "STEM", synonyms: ["cs", "computing", "software engineering", "informatics"] },
  "Artificial Intelligence": { category: "STEM", synonyms: ["ai", "machine learning", "ml", "deep learning", "data science and ai"] },
  "Data Science": { category: "STEM", synonyms: ["data analytics", "big data", "statistics and data science"] },
  Engineering: { category: "STEM", synonyms: ["mechanical engineering", "electrical engineering", "civil engineering", "chemical engineering"] },
  Mathematics: { category: "STEM", synonyms: ["applied mathematics", "pure mathematics"] },
  Physics: { category: "STEM", synonyms: ["applied physics", "astrophysics"] },
  Chemistry: { category: "STEM", synonyms: [] },
  Biology: { category: "STEM", synonyms: ["life sciences", "biosciences", "bioscience"] },
  Medicine: { category: "Health", synonyms: ["medical sciences", "public health", "clinical medicine", "mbbs"] },
  "Natural Science": { category: "STEM", synonyms: ["natural sciences"] },
  Agriculture: { category: "Applied Science", synonyms: ["agricultural science", "agronomy"] },
  Business: { category: "Business", synonyms: ["business administration", "management", "mba programs"] },
  Economics: { category: "Business", synonyms: ["economic policy", "finance and economics"] },
  Law: { category: "Humanities", synonyms: ["legal studies", "llm", "llb"] },
  "Social Science": { category: "Humanities", synonyms: ["social sciences", "sociology", "political science", "international relations"] },
  Education: { category: "Humanities", synonyms: ["teaching", "pedagogy", "educational leadership"] },
  Arts: { category: "Humanities", synonyms: ["fine arts", "humanities", "design", "literature"] },
  Journalism: { category: "Humanities", synonyms: ["media studies", "communication studies", "mass communication"] },
  Environment: { category: "Applied Science", synonyms: ["environmental science", "climate studies", "sustainability"] },
};

const SYNONYM_LOOKUP: Array<[string, RegExp]> = Object.entries(SUBJECT_CATALOG).flatMap(
  ([canonical, { synonyms }]) => {
    const terms = [canonical, ...synonyms];
    return terms.map((term) => [canonical, new RegExp(`\\b${escapeRegExp(term)}\\b`, "i")] as [string, RegExp]);
  },
);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSubjects(text: string | string[] | undefined): string[] {
  if (!text) return [];
  const haystack = Array.isArray(text) ? text.join(" ") : text;
  const found = new Set<string>();
  for (const [canonical, pattern] of SYNONYM_LOOKUP) {
    if (pattern.test(haystack)) found.add(canonical);
  }
  return Array.from(found);
}
