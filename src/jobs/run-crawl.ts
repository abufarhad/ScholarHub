/**
 * One-shot manual crawl trigger: `npm run crawler` (all enabled sources) or
 * `npm run crawler -- opportunities-corners` (a single source by crawlerType).
 */
import { prisma } from "@/lib/prisma";
import { crawlAllEnabledSources, crawlSourceById } from "@/services/crawl-service";

async function main() {
  const arg = process.argv[2];

  if (arg) {
    const source = await prisma.scholarshipSource.findFirst({ where: { crawlerType: arg } });
    if (!source) {
      console.error(`No ScholarshipSource with crawlerType "${arg}". Run \`npm run db:seed\` first, or check the name.`);
      process.exitCode = 1;
      return;
    }
    const result = await crawlSourceById(source.id, "manual");
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const results = await crawlAllEnabledSources("manual");
  console.log(JSON.stringify(results, null, 2));
}

main()
  .catch((err) => {
    console.error("Crawl run failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
