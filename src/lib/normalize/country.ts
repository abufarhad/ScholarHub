export interface CountryDef {
  code: string;
  name: string;
  region: string;
  aliases: string[];
}

// Covers major scholarship-destination countries and the most common
// applicant nationalities. Extend freely — adding a country here is all that
// is needed for it to be searchable/filterable/seedable; no other code
// change is required (see prisma/seed.ts).
export const COUNTRY_CATALOG: CountryDef[] = [
  { code: "US", name: "United States", region: "North America", aliases: ["usa", "united states of america", "u.s.", "u.s.a.", "america"] },
  { code: "GB", name: "United Kingdom", region: "Europe", aliases: ["uk", "britain", "great britain", "england"] },
  { code: "CA", name: "Canada", region: "North America", aliases: [] },
  { code: "DE", name: "Germany", region: "Europe", aliases: ["deutschland"] },
  { code: "FR", name: "France", region: "Europe", aliases: [] },
  { code: "IT", name: "Italy", region: "Europe", aliases: [] },
  { code: "NL", name: "Netherlands", region: "Europe", aliases: ["holland"] },
  { code: "SE", name: "Sweden", region: "Europe", aliases: [] },
  { code: "NO", name: "Norway", region: "Europe", aliases: [] },
  { code: "FI", name: "Finland", region: "Europe", aliases: [] },
  { code: "DK", name: "Denmark", region: "Europe", aliases: [] },
  { code: "CH", name: "Switzerland", region: "Europe", aliases: [] },
  { code: "AT", name: "Austria", region: "Europe", aliases: [] },
  { code: "BE", name: "Belgium", region: "Europe", aliases: [] },
  { code: "IE", name: "Ireland", region: "Europe", aliases: [] },
  { code: "ES", name: "Spain", region: "Europe", aliases: [] },
  { code: "PT", name: "Portugal", region: "Europe", aliases: [] },
  { code: "PL", name: "Poland", region: "Europe", aliases: [] },
  { code: "HU", name: "Hungary", region: "Europe", aliases: [] },
  { code: "CZ", name: "Czech Republic", region: "Europe", aliases: ["czechia"] },
  { code: "GR", name: "Greece", region: "Europe", aliases: [] },
  { code: "RU", name: "Russia", region: "Europe", aliases: ["russian federation"] },
  { code: "TR", name: "Turkey", region: "Europe", aliases: ["turkiye"] },
  { code: "JP", name: "Japan", region: "East Asia", aliases: [] },
  { code: "KR", name: "South Korea", region: "East Asia", aliases: ["korea", "republic of korea"] },
  { code: "CN", name: "China", region: "East Asia", aliases: ["prc"] },
  { code: "TW", name: "Taiwan", region: "East Asia", aliases: [] },
  { code: "HK", name: "Hong Kong", region: "East Asia", aliases: [] },
  { code: "SG", name: "Singapore", region: "Southeast Asia", aliases: [] },
  { code: "MY", name: "Malaysia", region: "Southeast Asia", aliases: [] },
  { code: "TH", name: "Thailand", region: "Southeast Asia", aliases: [] },
  { code: "ID", name: "Indonesia", region: "Southeast Asia", aliases: [] },
  { code: "PH", name: "Philippines", region: "Southeast Asia", aliases: [] },
  { code: "VN", name: "Vietnam", region: "Southeast Asia", aliases: [] },
  { code: "AU", name: "Australia", region: "Oceania", aliases: [] },
  { code: "NZ", name: "New Zealand", region: "Oceania", aliases: [] },
  { code: "SA", name: "Saudi Arabia", region: "Middle East", aliases: ["ksa"] },
  { code: "AE", name: "United Arab Emirates", region: "Middle East", aliases: ["uae"] },
  { code: "QA", name: "Qatar", region: "Middle East", aliases: [] },
  { code: "IL", name: "Israel", region: "Middle East", aliases: [] },
  { code: "JO", name: "Jordan", region: "Middle East", aliases: [] },
  { code: "EG", name: "Egypt", region: "Africa", aliases: [] },
  { code: "ZA", name: "South Africa", region: "Africa", aliases: [] },
  { code: "NG", name: "Nigeria", region: "Africa", aliases: [] },
  { code: "KE", name: "Kenya", region: "Africa", aliases: [] },
  { code: "GH", name: "Ghana", region: "Africa", aliases: [] },
  { code: "MA", name: "Morocco", region: "Africa", aliases: [] },
  { code: "IN", name: "India", region: "South Asia", aliases: [] },
  { code: "PK", name: "Pakistan", region: "South Asia", aliases: [] },
  { code: "BD", name: "Bangladesh", region: "South Asia", aliases: [] },
  { code: "NP", name: "Nepal", region: "South Asia", aliases: [] },
  { code: "LK", name: "Sri Lanka", region: "South Asia", aliases: [] },
  { code: "BR", name: "Brazil", region: "South America", aliases: [] },
  { code: "MX", name: "Mexico", region: "North America", aliases: [] },
  { code: "AR", name: "Argentina", region: "South America", aliases: [] },
  { code: "CL", name: "Chile", region: "South America", aliases: [] },
  { code: "CO", name: "Colombia", region: "South America", aliases: [] },
  { code: "UA", name: "Ukraine", region: "Europe", aliases: [] },
];

const LOOKUP: Array<[string, RegExp]> = COUNTRY_CATALOG.flatMap(({ name, aliases }) => {
  const terms = [name, ...aliases];
  return terms.map((term) => [name, new RegExp(`\\b${escapeRegExp(term)}\\b`, "i")] as [string, RegExp]);
});

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeCountries(text: string | string[] | undefined): string[] {
  if (!text) return [];
  const haystack = Array.isArray(text) ? text.join(" ") : text;
  const found = new Set<string>();
  for (const [canonical, pattern] of LOOKUP) {
    if (pattern.test(haystack)) found.add(canonical);
  }
  return Array.from(found);
}

export function countryByName(name: string): CountryDef | undefined {
  return COUNTRY_CATALOG.find((c) => c.name.toLowerCase() === name.toLowerCase());
}
