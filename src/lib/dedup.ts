import type { PrismaClient } from "@prisma/client";
import type { NormalizedScholarship } from "@/types/scholarship";

export interface DuplicateMatch {
  scholarshipId: string;
  score: number;
  reason: string;
}

const TITLE_SIMILARITY_THRESHOLD = 0.45;
const MATCH_SCORE_THRESHOLD = 0.6;
const DEADLINE_PROXIMITY_DAYS = 21;
// Max number of non-boilerplate words allowed to differ between two titles
// before they're presumed to name different scholarships outright — see the
// significantWordDiff() doc comment for why this exists.
const MAX_SIGNIFICANT_WORD_DIFF = 1;

const TITLE_STOPWORDS = new Set([
  "scholarship",
  "scholarships",
  "fellowship",
  "fellowships",
  "program",
  "programme",
  "programs",
  "programmes",
  "grant",
  "grants",
  "award",
  "awards",
  "funding",
  "fully",
  "partially",
  "funded",
  "international",
  "students",
  "student",
  "application",
  "apply",
  "opportunity",
  "opportunities",
  "for",
  "the",
  "and",
  "of",
  "in",
  "at",
  "to",
  "a",
  "an",
  "on",
  "with",
]);

function significantWords(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter((w) => w.length > 1 && !TITLE_STOPWORDS.has(w) && !/^\d+$/.test(w)));
}

/**
 * Char-trigram similarity (see titleSimilarity()) can't tell "the same
 * scholarship, reworded" apart from "a sibling scholarship in the same
 * program family, differing only in region/subject" — two titles that share
 * one long template and differ in a single proper noun ("...Nigeria
 * Leadership Journey..." vs "...Eastern Africa Leadership Journey...") score
 * HIGHER on trigram similarity than genuinely-the-same titles phrased
 * differently do, because most of the string is byte-identical. This gate
 * catches that: it strips common scholarship boilerplate words and years,
 * then requires the two titles' remaining (presumably distinguishing) words
 * to match almost exactly before trigram/provider/deadline scoring even
 * runs. A false negative here just means two sources of the truly same
 * scholarship stay as separate records a little longer; a false positive
 * would silently merge two different scholarships into one, which is worse.
 */
export function significantWordDiff(a: string, b: string): number {
  const wordsA = significantWords(a);
  const wordsB = significantWords(b);
  let diff = 0;
  for (const w of wordsA) if (!wordsB.has(w)) diff++;
  for (const w of wordsB) if (!wordsA.has(w)) diff++;
  return diff;
}

interface CandidateRow {
  id: string;
  canonicalTitleNormalized: string;
  provider: string | null;
  applicationDeadline: Date | null;
}

/**
 * Trigram (3-character n-gram) Dice coefficient — a dependency-free
 * equivalent of Postgres's `pg_trgm` `similarity()`, which the Postgres
 * version of this platform used directly in SQL. Running it in application
 * code instead of the database is the right trade for a SQLite-backed,
 * server-less deployment: the dataset here (hundreds, not millions, of
 * scholarships) makes an in-memory pass over every candidate title cheap,
 * and it keeps duplicate detection portable to whatever database (or none)
 * a future deployment mode uses.
 */
function trigrams(text: string): Set<string> {
  const padded = `  ${text}  `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    grams.add(padded.slice(i, i + 3));
  }
  return grams;
}

export function titleSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const gramsA = trigrams(a);
  const gramsB = trigrams(b);
  let shared = 0;
  for (const g of gramsA) {
    if (gramsB.has(g)) shared += 1;
  }
  return (2 * shared) / (gramsA.size + gramsB.size);
}

/**
 * Finds the best-matching existing canonical Scholarship for a freshly
 * normalized crawl result, using several independent signals per the spec
 * (title, provider, deadline, application URL) rather than any single one.
 *
 * Two fast-path exact matches short-circuit the scored comparison:
 *  - identical contentHash (byte-identical scholarship, re-crawled)
 *  - identical applicationUrl with a real path (not just a bare domain)
 */
export async function findDuplicateScholarship(
  prisma: PrismaClient,
  candidate: NormalizedScholarship,
  destinationCountryIds: string[],
): Promise<DuplicateMatch | null> {
  const exactHash = await prisma.scholarship.findFirst({
    where: { contentHash: candidate.contentHash },
    select: { id: true },
  });
  if (exactHash) return { scholarshipId: exactHash.id, score: 1, reason: "identical content hash" };

  if (hasRealPath(candidate.applicationUrl)) {
    const exactUrl = await prisma.scholarship.findFirst({
      where: { applicationUrl: candidate.applicationUrl },
      select: { id: true },
    });
    if (exactUrl) return { scholarshipId: exactUrl.id, score: 1, reason: "identical application URL" };
  }

  if (!candidate.canonicalTitleNormalized) return null;

  const rows: CandidateRow[] = await prisma.scholarship.findMany({
    where: { status: { not: "REJECTED" } },
    select: { id: true, canonicalTitleNormalized: true, provider: true, applicationDeadline: true },
  });

  let best: DuplicateMatch | null = null;
  for (const row of rows) {
    if (significantWordDiff(row.canonicalTitleNormalized, candidate.canonicalTitleNormalized) > MAX_SIGNIFICANT_WORD_DIFF) continue;

    const similarity = titleSimilarity(row.canonicalTitleNormalized, candidate.canonicalTitleNormalized);
    if (similarity <= TITLE_SIMILARITY_THRESHOLD) continue;

    const score = scoreMatch(candidate, row, similarity);
    if (score.score >= MATCH_SCORE_THRESHOLD && (!best || score.score > best.score)) {
      best = { scholarshipId: row.id, score: score.score, reason: score.reason };
    }
  }

  void destinationCountryIds; // reserved for a future "same destination" signal
  return best;
}

function scoreMatch(candidate: NormalizedScholarship, row: CandidateRow, similarity: number): { score: number; reason: string } {
  const reasons: string[] = [`title similarity ${similarity.toFixed(2)}`];
  let score = similarity * 0.6;

  if (candidate.provider && row.provider && candidate.provider.toLowerCase() === row.provider.toLowerCase()) {
    score += 0.2;
    reasons.push("same provider");
  }

  if (candidate.applicationDeadline && row.applicationDeadline) {
    const diffDays = Math.abs(candidate.applicationDeadline.getTime() - row.applicationDeadline.getTime()) / 86_400_000;
    if (diffDays <= DEADLINE_PROXIMITY_DAYS) {
      score += 0.15;
      reasons.push(`deadline within ${DEADLINE_PROXIMITY_DAYS} days`);
    }
  }

  return { score: Math.min(score, 1), reason: reasons.join(", ") };
}

function hasRealPath(url: string): boolean {
  try {
    return new URL(url).pathname.length > 1;
  } catch {
    return false;
  }
}
