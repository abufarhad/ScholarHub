import * as cheerio from "cheerio";
import type { CrawlerDefinition, RawScholarship } from "@/types/scholarship";
import { fetchText, politeDelay } from "../core/http";
import { isPathAllowed } from "../core/robots";

const BASE_URL = "https://shed.gov.bd";
const NOTICES_PATH = "/pages/notices";
const REQUEST_DELAY_MS = 2000; // no robots.txt published at all — crawl extra conservatively

// Bangladesh's Secondary and Higher Education Division notice board. Site
// inspected 2026-08-28: robots.txt returns 404 (no crawl policy published at
// all, so nothing is disallowed), and the /pages/moedu-scholarships page
// itself renders its list client-side — but the general notice board at
// /pages/notices is plain server-rendered HTML with a simple table, so that
// is what this adapter reads, filtering rows to scholarship-related notices
// by keyword. Content is in Bengali and stored as-is (no fabricated
// translation); every notice this source produces is tagged with Bangladesh
// as the eligible nationality, which matches what this division actually
// publishes (scholarships and grants for Bangladeshi students/institutions).
const SCHOLARSHIP_KEYWORDS = ["বৃত্তি", "স্কলারশিপ", "ফেলোশিপ", "অনুদান"];

const BENGALI_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

function toLatinDigits(text: string): string {
  return text.replace(/[০-৯]/g, (d) => BENGALI_DIGITS[d] ?? d);
}

function parseBengaliDate(text: string): string | undefined {
  const latin = toLatinDigits(text).trim();
  const match = latin.match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (!match) return undefined;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

async function* crawlShedGov(): AsyncGenerator<RawScholarship> {
  const allowed = await isPathAllowed(BASE_URL, NOTICES_PATH);
  if (!allowed) throw new Error(`robots.txt disallows ${NOTICES_PATH}`);

  await politeDelay(REQUEST_DELAY_MS);
  const html = await fetchText(`${BASE_URL}${NOTICES_PATH}`, { timeoutMs: 20_000 });
  const $ = cheerio.load(html);

  const rows = $("tr.table-tr").toArray();
  for (const row of rows) {
    const $row = $(row);
    const title = $row.find('td[data-column="title"]').first().text().trim();
    if (!title || !SCHOLARSHIP_KEYWORDS.some((kw) => title.includes(kw))) continue;

    const detailHref = $row.find("td.centered a[href]").first().attr("href");
    const pdfHref = $row.find('td[data-column="files"] a[href]').first().attr("href");
    const dateText = $row.find('td[data-column="publish_date"] span').first().text().trim();
    const publishedAtRaw = parseBengaliDate(dateText);

    const detailUrl = detailHref ? new URL(detailHref, BASE_URL).toString() : `${BASE_URL}${NOTICES_PATH}`;

    let descriptionText = title;
    if (detailHref) {
      try {
        await politeDelay(REQUEST_DELAY_MS);
        const detailHtml = await fetchText(detailUrl, { timeoutMs: 15_000, retries: 1 });
        const $detail = cheerio.load(detailHtml);
        $detail("script, style, header, footer, nav").remove();
        const bodyText = $detail("main, article, .content, body").first().text().replace(/\s+/g, " ").trim();
        if (bodyText.length > title.length) descriptionText = bodyText.slice(0, 4000);
      } catch {
        // detail page fetch failed — fall back to the title-only description below rather than dropping the item
      }
    }

    yield {
      sourceUrl: detailUrl,
      title,
      descriptionText,
      descriptionHtml: `<p>${descriptionText}</p>`,
      eligibleCountriesRaw: ["Bangladesh"],
      allNationalitiesEligible: false,
      nationalityRequirements: "Bangladeshi nationals — see official notice for exact eligibility.",
      publishedAtRaw,
      officialUrl: pdfHref ?? detailUrl,
      applicationUrl: pdfHref ?? detailUrl,
      tags: ["bangladesh", "government-notice"],
    };
  }
}

export const shedGovCrawler: CrawlerDefinition = {
  key: "shed-gov",
  crawl: crawlShedGov,
};
