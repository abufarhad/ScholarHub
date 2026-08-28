/**
 * Reads the SQLite database and writes public/data/*.json — the entire
 * "backend" this static site has at runtime. Run before `next build`
 * (see the `build` script in package.json and .github/workflows/deploy.yml).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getAllForStaticExport, listCountriesWithCounts, listSubjectsWithCounts } from "@/services/scholarship-query";
import type { StaticMeta } from "@/types/static-data";

async function main() {
  const outDir = path.join(process.cwd(), "public", "data");
  await mkdir(outDir, { recursive: true });

  const [scholarships, countries, subjects, sources] = await Promise.all([
    getAllForStaticExport(),
    listCountriesWithCounts(),
    listSubjectsWithCounts(),
    prisma.scholarshipSource.findMany({
      select: { name: true, baseUrl: true, reliability: true, lastCrawledAt: true, totalItemsFound: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const meta: StaticMeta = {
    generatedAt: new Date().toISOString(),
    totalCount: scholarships.length,
    countries: countries.map((c) => ({ name: c.name, slug: c.slug, count: c._count.destinations })),
    subjects: subjects.map((s) => ({ name: s.name, slug: s.slug, count: s._count.scholarships })),
    sources: sources.map((s) => ({
      name: s.name,
      baseUrl: s.baseUrl,
      reliability: s.reliability,
      lastCrawledAt: s.lastCrawledAt ? s.lastCrawledAt.toISOString() : null,
      totalItemsFound: s.totalItemsFound,
    })),
  };

  await writeFile(path.join(outDir, "scholarships.json"), JSON.stringify(scholarships));
  await writeFile(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));

  console.log(`Exported ${scholarships.length} scholarships, ${meta.countries.length} countries, ${meta.subjects.length} subjects to public/data/`);
}

main()
  .catch((err) => {
    console.error("Static data export failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
