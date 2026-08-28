# ScholarHub

A scholarship discovery platform, deployed as a **fully static site on GitHub Pages** — no server, no managed database, no hosting bill. A GitHub Action crawls scholarship sources on a schedule, stores what it finds in a SQLite file committed to this repo, exports it to static JSON, and rebuilds the site. That's the entire backend.

## How "no backend, no database" actually works

| Instead of... | This uses... |
|---|---|
| A hosted Postgres/MySQL instance | A single SQLite file, **`prisma/data/scholarhub.db`, committed to git** — the crawl history and canonical scholarship data live in your repo, versioned like any other file |
| A server process (API routes, cron daemon) | A **GitHub Actions workflow** (`.github/workflows/deploy.yml`) that runs every 12 hours: crawl → commit the updated `.db` → export to JSON → `next build` (static export) → deploy to Pages |
| Server-side search/filtering | **Client-side JavaScript** filtering an array loaded from `public/data/scholarships.json` — fast enough at hundreds-to-low-thousands of scholarships, and it's the only option with no server to query |
| User accounts, saved scholarships, email alerts | **Removed.** These fundamentally require a live backend (session storage, outbound email) that a static site cannot provide. "Saved scholarships" is reimplemented as a **local-only browser bookmark list** (`src/lib/bookmarks.ts`, plain `localStorage`) — no accounts, no sync across devices, but it costs nothing to run. |

This is a deliberate trade-off, not an oversight — see "What this deployment model gives up" below.

## Stack

- **Frontend**: Next.js 15 (App Router, static export via `output: "export"`), TypeScript, Tailwind CSS v4, hand-built shadcn/ui-style components (Radix UI + `class-variance-authority`), Lucide icons
- **Data store**: SQLite via Prisma ORM (schema in `prisma/schema.prisma`) — read at build time only, never at request time
- **Crawling**: `cheerio` + the Fetch API, no headless browser, no external scraping service
- **Deployment**: GitHub Actions → GitHub Pages (`actions/upload-pages-artifact` + `actions/deploy-pages`)
- **Testing**: Vitest

## One-time setup (do this before the first deploy)

1. **Push this repo to GitHub.**
2. **Settings → Pages → Source: "GitHub Actions"** (not "Deploy from a branch").
3. **Settings → Actions → General → Workflow permissions: "Read and write permissions."** The workflow commits the updated SQLite file back to `main` after each crawl — it needs write access to do that.
4. That's it. The workflow runs automatically every 12 hours, and once on push to `main`. You can also trigger it manually from the Actions tab ("Run workflow") — this is also how you retry a failed crawl.

The workflow auto-detects whether you're deploying to a *project* site (`https://you.github.io/your-repo`) or a *user/org* site (a repo literally named `you.github.io`, served at the domain root) and sets the Next.js `basePath` accordingly — no configuration needed either way.

## Local development

```bash
npm install
npx prisma migrate deploy   # creates/updates prisma/data/scholarhub.db
npm run db:seed              # reference data + ~13 sample scholarships (marked "Sample data" in the UI)
npm run dev                  # exports the current DB to JSON, then starts next dev
```

Visit `http://localhost:3000`.

### Run a crawl locally

```bash
npm run crawler                              # all enabled sources
npm run crawler -- opportunities-corners     # a single source, by crawlerType
npm run export-data                          # regenerate public/data/*.json from the DB without crawling
```

### Preview the actual static export

```bash
npm run build      # runs export-data, then `next build` with output:"export" → ./out
npx serve out       # or: python3 -m http.server 4173 --directory out
```

This is exactly what ships to GitHub Pages — same HTML, same JSON, no server.

### Tests, typecheck, lint

```bash
npm run test
npm run typecheck
npm run lint
```

## Architecture

```
src/
  app/                     Next.js routes — all static (no API routes, no middleware)
  components/              UI components
  crawlers/
    core/                  crawler-agnostic building blocks: HTTP client w/ retry+backoff,
                            robots.txt checker, sitemap reader, HTML/JSON-LD extraction
    sources/                one file per source, each implementing CrawlerDefinition
    registry.ts            maps ScholarshipSource.crawlerType -> adapter
  lib/
    enums.ts                plain string-constant mirrors of the Prisma schema enums —
                            imported by client-bundled code instead of @prisma/client,
                            whose generated module is Node-only and breaks in the browser
    normalize/              degree/funding/subject/country/requirement-level normalization
    dedup.ts                multi-signal duplicate detection — in-process trigram
                            similarity (no pg_trgm; see "SQLite instead of Postgres" below)
    client-search.ts        the filtering/search engine that runs IN THE BROWSER over
                            public/data/scholarships.json — this replaces what used to be
                            server-side Prisma `WHERE` queries
    deadline.ts             single source of truth for deadline status + days-remaining,
                            called both at build time and again in the browser (so
                            "closing in 3 days" stays correct between rebuilds)
    bookmarks.ts             the entire "saved scholarships" feature — localStorage, no schema
  services/                 build-time-only database read/write logic
  jobs/run-crawl.ts         one-shot crawl script, run by the GitHub Actions workflow
  types/static-data.ts       the exact shape of public/data/scholarships.json
scripts/export-static-data.ts   SQLite → public/data/*.json
prisma/
  schema.prisma             data model (SQLite provider — see header comment for why
                            some fields differ from a "normal" Postgres design)
  data/scholarhub.db         the committed database. Yes, really — see above.
  seed.ts                   development seed data
.github/workflows/deploy.yml  the entire deployment pipeline
```

### The crawl pipeline

```
ScholarshipSource (config row in SQLite)
        │
        ▼
CrawlerDefinition.crawl()  →  RawScholarship (free text, per-adapter)
        │
        ▼
normalizeScholarship()      →  NormalizedScholarship (closed vocab: DegreeLevel[],
        │                       FundingType, RequirementLevel, parsed Date, ...)
        ▼
findDuplicateScholarship()   →  existing canonical Scholarship, or null
        │                          │
        │ null                    │ found
        ▼                          ▼
createScholarship()        updateScholarshipFromDuplicate()
        │                          │
        └──────────┬───────────────┘
                   ▼
         CrawlRun/CrawlItem bookkeeping, sweepDeadlineStatuses()
                   ▼
         scripts/export-static-data.ts  →  public/data/*.json
                   ▼
         next build (output: "export")  →  ./out  →  GitHub Pages
```

One item throwing (a parse error, a missing field) is logged and skipped without stopping
the rest of that source's crawl. One *source* throwing doesn't stop the others — see
`crawlAllEnabledSources()` in `src/services/crawl-service.ts`.

### Adding a new source

1. Inspect its `robots.txt`, sitemap, and page structure by hand first.
2. Write an adapter in `src/crawlers/sources/your-source.ts` implementing `CrawlerDefinition`
   (most WordPress/Blogger-style sites can reuse `crawlWordPressSource()` from
   `wordpress-common.ts` with just different CSS selectors).
3. Register it in `src/crawlers/registry.ts`.
4. Insert a `ScholarshipSource` row (via `prisma/seed.ts` or a one-off script) with a
   `crawlerType` matching the registry key, then run `npx prisma migrate deploy && npm run crawler`
   locally and commit the updated `prisma/data/scholarhub.db`.

### Duplicate detection — SQLite instead of Postgres

The original design used Postgres's `pg_trgm` extension for fuzzy title matching. SQLite
has no equivalent extension available on GitHub's runners, so `src/lib/dedup.ts`
implements the same idea — trigram (3-character n-gram) Dice coefficient similarity — in
plain TypeScript, run once over the (small) set of existing scholarships per crawl item.
Exact-match fast paths (identical content hash, identical application URL) still
short-circuit via a direct query. See `titleSimilarity()` and its tests in
`tests/title-similarity.test.ts`.

### Data quality & honesty

- `lastVerifiedAt` is only set when a crawl actually confirmed the record — never backfilled.
- `sourceReliability` / `isOfficial` per source link distinguish an aggregator's own post
  from a confirmed official application URL, even when the same record has both.
- A less-reliable source can attach itself as an additional `ScholarshipSourceLink`
  ("Found on N sources") but can never overwrite content from a more reliable one — see
  `isMoreOrEquallyReliable()` in `src/services/scholarship-service.ts`.
- Expired scholarships are marked `status: EXPIRED`, never deleted, and automatically
  reopen if a later crawl finds a future deadline for the same canonical record.
- Deadline status (`Open` / `Closing Soon` / `Closed` / ...) is **recomputed in the
  visitor's browser** using their real current time, not frozen at whatever it was when
  the site was last built — see `computeDeadlineInfo()`.

## Crawling safety

Before writing each adapter, the source's `robots.txt`, sitemap, and page structure were
inspected directly:

| Source | robots.txt | Discovery |
|---|---|---|
| opportunitiescorners.com | Disallows only `/?s=`, `/search/` | Yoast SEO XML sitemap |
| scholarshiproar.com | Disallows `/wp-admin/`, `/search/`, comment/moderation paths | WordPress core XML sitemap |
| fullscholarships.net | Disallows only `/search` | Blogger's paginated `sitemap.xml` |
| shed.gov.bd | No `robots.txt` published (404) — treated as no restrictions declared, crawled at reduced rate as a courtesy | No sitemap; the general `/pages/notices` board, filtered by scholarship keywords |
| scholars4dev.com | Disallows `/wp-admin/`, `/cgi-bin/`, a handful of nationality-tag archives | All in One SEO XML sitemap |
| opportunitydesk.org | No `Disallow` directives at all — only the content-signal policy legend, with no restriction values set | WordPress core XML sitemap |

Also evaluated and rejected before writing an adapter: `studyin.lt`, `studyinlatvia.lv`, and
`educationinireland.com` all had permissive robots.txt but, on inspecting actual content,
turned out to be general promotional sites with little-to-no crawlable scholarship-listing
content (see git history for the full evaluation). `studyingreece.edu.gr` explicitly
disallows `ClaudeBot` and sets `ai-train=no` via its Cloudflare content-signal policy — not
crawled, full stop. `scholarshipportal.com` redirects to a Cloudflare-protected page that
403s on a plain request — not crawled; bypassing bot protection is out of scope.

All four are crawled via sitemap/notice-board listing rather than scraping paginated
category pages, with a per-request delay, retry-with-backoff (no retry on 4xx), a request
timeout, and an incremental filter on sitemap `lastmod`.

## What this deployment model gives up

Being explicit about the trade-off, since it's a real product-scope change from a
full-stack build:

- **No user accounts.** No login, no per-user saved lists synced across devices, no
  server-verified anything. "Saved scholarships" is a local-only bookmark list.
- **No email alerts.** Matching scholarships against a saved search requires storing that
  search somewhere durable and sending mail from a server — neither exists here.
- **No admin moderation UI.** Reviewing/editing/merging scholarships happens by running
  `npx prisma studio` locally against `prisma/data/scholarhub.db`, or by editing
  `prisma/seed.ts`/adapters and re-crawling — there's no `/admin` route in production.
- **Search is "as good as client-side JS gets."** No Postgres full-text ranking, no
  external search index — a scored substring match over the loaded JSON. Entirely
  sufficient at hundreds-to-low-thousands of scholarships; would need revisiting well
  before that stops being true.
- **The site is only as fresh as the last successful Action run** (every 12 hours, plus
  whatever's committed on push) — there's no live "crawl right now and see it instantly"
  admin action; the equivalent is manually running the workflow from the Actions tab.

If any of these matter more than "must be free/static," see the "Vercel instead" option
this project's setup discussion covered — the same crawler/normalize/dedup code works
unmodified against a real Postgres instance; only the query/API layer and hosting target
would need to change back.
