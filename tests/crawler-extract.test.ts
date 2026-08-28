import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { extractJsonLdArticle, htmlToText, extractLabeledValue, findOfficialLink, firstMatchingSelector } from "@/crawlers/core/extract";

// Fixture modeled on the real markup found on the WordPress sources this
// platform crawls (see src/crawlers/sources) — JSON-LD Article block,
// h1.entry-title, a .entry-content body with "Label: value" bullet lines and
// an outbound "Apply Now" link.
const FIXTURE_HTML = `
<html>
<head>
<script type="application/ld+json">
{"@context":"https://schema.org","@graph":[{"@type":"Article","headline":"Canada Scholarships 2027 (Fully Funded)","description":"A guide to Canadian scholarships.","datePublished":"2026-07-28T09:33:50+00:00","dateModified":"2026-07-29T09:33:50+00:00"}]}
</script>
</head>
<body>
<article class="post tag-masters-scholarships tag-phd-scholarships category-scholarship-lists">
  <h1 class="entry-title">Canada Scholarships 2027 (Fully Funded)</h1>
  <div class="entry-content">
    <p>Host Country: Canada</p>
    <p>Degree Level: Master's and PhD</p>
    <p>Financial Benefits: Fully Funded</p>
    <p>Application Deadline: 31 May 2027</p>
    <p>Learn more and <a href="https://apply.canada-university.example/portal">Apply Now</a> or visit our <a href="https://facebook.com/example">Facebook page</a>.</p>
  </div>
</article>
</body>
</html>
`;

describe("extractJsonLdArticle", () => {
  it("pulls headline/description/dates out of an Article JSON-LD graph", () => {
    const $ = cheerio.load(FIXTURE_HTML);
    const article = extractJsonLdArticle($);
    expect(article?.headline).toBe("Canada Scholarships 2027 (Fully Funded)");
    expect(article?.datePublished).toBe("2026-07-28T09:33:50+00:00");
  });

  it("returns null when there is no JSON-LD on the page", () => {
    const $ = cheerio.load("<html><body><p>No structured data here</p></body></html>");
    expect(extractJsonLdArticle($)).toBeNull();
  });
});

describe("firstMatchingSelector + htmlToText", () => {
  it("finds the first matching content selector and extracts readable text", () => {
    const $ = cheerio.load(FIXTURE_HTML);
    const selector = firstMatchingSelector($, [".does-not-exist", ".entry-content"]);
    expect(selector).toBe(".entry-content");
    const text = htmlToText($, selector!);
    expect(text).toContain("Host Country: Canada");
    expect(text).toContain("Application Deadline: 31 May 2027");
  });
});

describe("extractLabeledValue", () => {
  it("extracts a 'Label: value' line from prose text", () => {
    const $ = cheerio.load(FIXTURE_HTML);
    const text = htmlToText($, ".entry-content");
    expect(extractLabeledValue(text, ["Host Country"])).toBe("Canada");
    expect(extractLabeledValue(text, ["Application Deadline"])).toBe("31 May 2027");
  });

  it("returns null when none of the given labels appear", () => {
    expect(extractLabeledValue("Nothing relevant here", ["Host Country"])).toBeNull();
  });
});

describe("findOfficialLink", () => {
  it("picks an outbound link whose anchor text suggests it's the application link", () => {
    const $ = cheerio.load(FIXTURE_HTML);
    const link = findOfficialLink($, "https://scholarshiproar.com/canada-scholarships/");
    expect(link).toBe("https://apply.canada-university.example/portal");
  });

  it("ignores generic social-media redirects even if they matched by text", () => {
    const html = `<a href="https://facebook.com/apply">Apply Now</a>`;
    const $ = cheerio.load(html);
    expect(findOfficialLink($, "https://example.com/post")).toBeNull();
  });
});
