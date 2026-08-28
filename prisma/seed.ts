/**
 * Development seed data. Scholarship records created here are clearly marked
 * isSeed=true and left unverified (lastVerifiedAt=null) — per the project
 * spec, sample data must never be presented as verified. Deadlines are
 * synthetic (a few months out from whenever this seed runs) precisely so
 * they're never mistaken for a real, confirmed date.
 */
import { PrismaClient, DegreeLevel, FundingType, RequirementLevel, DeadlineType, ScholarshipStatus, SourceReliability } from "@prisma/client";
import { COUNTRY_CATALOG } from "../src/lib/normalize/country";
import { SUBJECT_CATALOG } from "../src/lib/normalize/subject";
import { slugify } from "../src/lib/slug";
import { contentHash } from "../src/lib/hash";
import { computeDeadlineInfo } from "../src/lib/deadline";
import { toJsonArray } from "../src/lib/json-array";

const prisma = new PrismaClient();

const SOURCES = [
  {
    name: "Opportunities Corners",
    baseUrl: "https://opportunitiescorners.com",
    crawlerType: "opportunities-corners",
    reliability: SourceReliability.AGGREGATOR,
    notes: "WordPress scholarship aggregator blog. Sitemap-based discovery, robots.txt allows crawling.",
  },
  {
    name: "Scholarship Roar",
    baseUrl: "https://scholarshiproar.com",
    crawlerType: "scholarship-roar",
    reliability: SourceReliability.AGGREGATOR,
    notes: "WordPress scholarship aggregator blog with Article JSON-LD. robots.txt allows crawling.",
  },
  {
    name: "Full Scholarships",
    baseUrl: "https://www.fullscholarships.net",
    crawlerType: "full-scholarships",
    reliability: SourceReliability.AGGREGATOR,
    notes: "Blogger-hosted scholarship aggregator. robots.txt allows crawling except /search.",
  },
  {
    name: "Secondary and Higher Education Division, Bangladesh",
    baseUrl: "https://shed.gov.bd",
    crawlerType: "shed-gov",
    reliability: SourceReliability.OFFICIAL_GOVERNMENT,
    notes: "Official Bangladesh government notice board. No robots.txt published; crawled conservatively.",
  },
];

interface SeedScholarship {
  title: string;
  provider: string;
  description: string;
  summary: string;
  degreeLevels: DegreeLevel[];
  fundingType: FundingType;
  destinationCountry: string;
  eligibleCountries: string[] | "all";
  subjects: string[];
  minimumGPA?: number;
  ielts: RequirementLevel;
  monthlyStipend?: string;
  tuitionCoverage?: string;
  accommodationCovered?: boolean;
  airfareCovered?: boolean;
  healthInsuranceCovered?: boolean;
  daysUntilDeadline: number | null; // null => rolling
  applicationUrl: string;
  sourceIndex: number;
  isOfficial?: boolean;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

const SEED_SCHOLARSHIPS: SeedScholarship[] = [
  {
    title: "MEXT Japanese Government Scholarship 2027 (Embassy Track)",
    provider: "Ministry of Education, Culture, Sports, Science and Technology (MEXT)",
    description:
      "The MEXT Scholarship funds international students to pursue research, master's, or doctoral studies at Japanese universities. Covers full tuition, a monthly stipend, and round-trip airfare. Applications are submitted through the Japanese embassy in the applicant's home country.",
    summary: "Fully funded Japanese government scholarship for graduate study, covering tuition, stipend, and airfare.",
    degreeLevels: [DegreeLevel.MASTERS, DegreeLevel.PHD],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Japan",
    eligibleCountries: "all",
    subjects: ["Engineering", "Computer Science", "Natural Science", "Social Science"],
    minimumGPA: 3.0,
    ielts: RequirementLevel.OPTIONAL,
    monthlyStipend: "Approx. ¥144,000–¥145,000/month",
    tuitionCoverage: "Full tuition waiver",
    accommodationCovered: false,
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 127,
    applicationUrl: "https://www.studyinjapan.go.jp/en/planning/scholarship/",
    sourceIndex: 0,
    isOfficial: false,
  },
  {
    title: "Chevening Scholarships for Master's Study in the UK",
    provider: "UK Foreign, Commonwealth & Development Office",
    description:
      "Chevening is the UK government's global scholarship programme, funding one-year master's degrees at any UK university. Fully funded, including tuition, a monthly stipend, travel costs, and an arrival allowance. Open to applicants with at least two years of work experience.",
    summary: "Fully funded UK government scholarship for a one-year master's degree, open to all nationalities.",
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "United Kingdom",
    eligibleCountries: "all",
    subjects: ["Business", "Economics", "Law", "Social Science", "Journalism"],
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "Monthly stipend at university-specific rate",
    tuitionCoverage: "Full tuition fees",
    accommodationCovered: true,
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 45,
    applicationUrl: "https://www.chevening.org/scholarships/",
    sourceIndex: 1,
  },
  {
    title: "DAAD EPOS Scholarships for Development-Related Postgraduate Courses",
    provider: "German Academic Exchange Service (DAAD)",
    description:
      "DAAD EPOS scholarships support students and young professionals from developing countries pursuing postgraduate studies in Germany in fields relevant to development. Covers tuition, monthly stipend, health insurance, and travel allowance.",
    summary: "Fully funded German scholarship for development-focused postgraduate study.",
    degreeLevels: [DegreeLevel.MASTERS, DegreeLevel.PHD],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Germany",
    eligibleCountries: ["Bangladesh", "India", "Pakistan", "Nepal", "Nigeria", "Kenya", "Ghana", "Egypt"],
    subjects: ["Agriculture", "Environment", "Economics", "Engineering", "Education"],
    minimumGPA: 3.0,
    ielts: RequirementLevel.NOT_REQUIRED,
    monthlyStipend: "€934–1,300/month depending on degree",
    tuitionCoverage: "Full tuition",
    healthInsuranceCovered: true,
    airfareCovered: true,
    daysUntilDeadline: 88,
    applicationUrl: "https://www.daad.de/en/study-and-research-in-germany/scholarships/",
    sourceIndex: 2,
  },
  {
    title: "Australia Awards Scholarships",
    provider: "Australian Government Department of Foreign Affairs and Trade",
    description:
      "Australia Awards provide long-term development scholarships for postgraduate study at Australian universities, targeted at students from partner countries in the Indo-Pacific region. Fully funded including tuition, living expenses, and health cover.",
    summary: "Fully funded Australian government scholarship for postgraduate study, targeted at Indo-Pacific nations.",
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Australia",
    eligibleCountries: ["Bangladesh", "India", "Nepal", "Sri Lanka", "Indonesia", "Vietnam", "Philippines"],
    subjects: ["Medicine", "Business", "Environment", "Education"],
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "Living allowance per Australian Government rate",
    tuitionCoverage: "Full tuition",
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 6,
    applicationUrl: "https://www.australiaawards.gov.au/",
    sourceIndex: 1,
  },
  {
    title: "Erasmus Mundus Joint Master Degree Scholarships 2027/29",
    provider: "European Commission",
    description:
      "Erasmus Mundus Joint Master Degrees are prestigious, integrated study programmes delivered by a consortium of universities across at least two European countries. Scholarships cover tuition, a monthly allowance, travel, and installation costs.",
    summary: "Fully funded EU scholarship for joint master's programs delivered across multiple European universities.",
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Netherlands",
    eligibleCountries: "all",
    subjects: ["Data Science", "Artificial Intelligence", "Environment", "Arts"],
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "€1,400/month",
    tuitionCoverage: "Full tuition across consortium universities",
    airfareCovered: true,
    daysUntilDeadline: 18,
    applicationUrl: "https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en",
    sourceIndex: 0,
  },
  {
    title: "Vanier Canada Graduate Scholarships",
    provider: "Government of Canada",
    description:
      "The Vanier CGS program supports doctoral students demonstrating leadership and a high standard of scholarly achievement in the social sciences, humanities, natural sciences, engineering, and health. Awarded through nominating Canadian universities.",
    summary: "Fully funded Canadian doctoral scholarship for exceptional PhD candidates.",
    degreeLevels: [DegreeLevel.PHD],
    fundingType: FundingType.FELLOWSHIP,
    destinationCountry: "Canada",
    eligibleCountries: "all",
    subjects: ["Natural Science", "Social Science", "Engineering", "Medicine"],
    minimumGPA: 3.5,
    ielts: RequirementLevel.UNKNOWN,
    monthlyStipend: "CAD $50,000/year",
    daysUntilDeadline: 210,
    applicationUrl: "https://vanier.gc.ca/en/home-accueil.html",
    sourceIndex: 1,
  },
  {
    title: "KAUST Fellowship for MS/PhD Programs in Saudi Arabia",
    provider: "King Abdullah University of Science and Technology (KAUST)",
    description:
      "KAUST offers fully funded fellowships to all admitted graduate students, covering tuition, a monthly living allowance, on-campus housing, health insurance, and relocation support, across science, engineering, and technology programs.",
    summary: "Fully funded fellowship automatically granted to all admitted KAUST graduate students.",
    degreeLevels: [DegreeLevel.MASTERS, DegreeLevel.PHD],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Saudi Arabia",
    eligibleCountries: "all",
    subjects: ["Computer Science", "Engineering", "Environment", "Natural Science"],
    minimumGPA: 3.0,
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "Living allowance + housing",
    tuitionCoverage: "Full tuition, no separate application needed",
    accommodationCovered: true,
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 33,
    applicationUrl: "https://admissions.kaust.edu.sa/",
    sourceIndex: 2,
    isOfficial: true,
  },
  {
    title: "Swedish Institute Scholarships for Global Professionals",
    provider: "Swedish Institute",
    description:
      "SISGP scholarships are aimed at future leaders in developing countries, funding one- or two-year master's programs in Sweden. Includes tuition, living costs, travel grant, and insurance, alongside a leadership development program.",
    summary: "Fully funded Swedish scholarship for master's study, aimed at future global leaders.",
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Sweden",
    eligibleCountries: ["Bangladesh", "India", "Pakistan", "Kenya", "Nigeria"],
    subjects: ["Business", "Environment", "Social Science", "Education"],
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "SEK 12,000/month",
    tuitionCoverage: "Full tuition",
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 3,
    applicationUrl: "https://si.se/en/apply/scholarships/",
    sourceIndex: 0,
  },
  {
    title: "Stipendium Hungaricum Scholarship Programme",
    provider: "Tempus Public Foundation, Hungary",
    description:
      "Stipendium Hungaricum offers bachelor's, master's, and doctoral scholarships at Hungarian higher education institutions, covering tuition, a monthly stipend, accommodation contribution, and health insurance for students from partner countries.",
    summary: "Fully funded Hungarian government scholarship spanning bachelor's through doctoral level.",
    degreeLevels: [DegreeLevel.UNDERGRADUATE, DegreeLevel.MASTERS, DegreeLevel.PHD],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Hungary",
    eligibleCountries: ["Bangladesh", "India", "Pakistan", "Nepal", "Vietnam", "Indonesia", "Nigeria", "Egypt"],
    subjects: ["Medicine", "Engineering", "Computer Science", "Arts"],
    ielts: RequirementLevel.OPTIONAL,
    monthlyStipend: "HUF 43,700–140,000/month depending on level",
    tuitionCoverage: "Full tuition",
    accommodationCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: 150,
    applicationUrl: "https://stipendiumhungaricum.hu/",
    sourceIndex: 1,
  },
  {
    title: "Utrecht Excellence Scholarships",
    provider: "Utrecht University",
    description:
      "Utrecht University awards partial-tuition Excellence Scholarships to outstanding international students admitted to select master's programs, based on academic merit.",
    summary: "Partially funded merit scholarship for outstanding master's applicants at Utrecht University.",
    degreeLevels: [DegreeLevel.MASTERS],
    fundingType: FundingType.PARTIALLY_FUNDED,
    destinationCountry: "Netherlands",
    eligibleCountries: "all",
    subjects: ["Natural Science", "Social Science", "Business"],
    minimumGPA: 3.6,
    ielts: RequirementLevel.REQUIRED,
    tuitionCoverage: "Partial tuition reduction",
    daysUntilDeadline: 60,
    applicationUrl: "https://www.uu.nl/en/organisation/utrecht-university-fund/utrecht-excellence-scholarships",
    sourceIndex: 0,
  },
  {
    title: "Bangladesh Ministry of Education Study Abroad Scholarship (Notice)",
    provider: "Secondary and Higher Education Division, Bangladesh",
    description:
      "Notice regarding government scholarships and grants for Bangladeshi students pursuing higher education, published by the Secondary and Higher Education Division. See the official notice for full eligibility and application instructions.",
    summary: "Government of Bangladesh scholarship notice for Bangladeshi students.",
    degreeLevels: [DegreeLevel.UNDERGRADUATE, DegreeLevel.MASTERS],
    fundingType: FundingType.PARTIALLY_FUNDED,
    destinationCountry: "Bangladesh",
    eligibleCountries: ["Bangladesh"],
    subjects: ["Education", "Social Science"],
    ielts: RequirementLevel.UNKNOWN,
    daysUntilDeadline: 40,
    applicationUrl: "https://shed.gov.bd/pages/notices",
    sourceIndex: 3,
    isOfficial: true,
  },
  {
    title: "MEXT Undergraduate Scholarship 2027",
    provider: "Ministry of Education, Culture, Sports, Science and Technology (MEXT)",
    description:
      "MEXT also funds undergraduate study for international students at Japanese universities, covering tuition, a monthly stipend, and airfare, with Japanese language preparation included for non-Japanese speakers.",
    summary: "Fully funded Japanese government scholarship for undergraduate study.",
    degreeLevels: [DegreeLevel.UNDERGRADUATE],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "Japan",
    eligibleCountries: "all",
    subjects: ["Engineering", "Natural Science", "Computer Science"],
    ielts: RequirementLevel.NOT_REQUIRED,
    monthlyStipend: "Approx. ¥117,000/month",
    tuitionCoverage: "Full tuition",
    airfareCovered: true,
    daysUntilDeadline: 95,
    applicationUrl: "https://www.studyinjapan.go.jp/en/planning/scholarship/#undergraduate",
    sourceIndex: 0,
  },
  {
    title: "Fulbright Foreign Student Program",
    provider: "U.S. Department of State / Fulbright Program",
    description:
      "The Fulbright Foreign Student Program enables graduate students, young professionals, and artists from abroad to study and conduct research in the United States. Fully funded, including tuition, living stipend, airfare, and health insurance, for one to two years.",
    summary: "Fully funded U.S. government scholarship for graduate study and research.",
    degreeLevels: [DegreeLevel.MASTERS, DegreeLevel.PHD, DegreeLevel.RESEARCH],
    fundingType: FundingType.FULLY_FUNDED,
    destinationCountry: "United States",
    eligibleCountries: "all",
    subjects: ["Social Science", "Arts", "Journalism", "Business", "Natural Science"],
    ielts: RequirementLevel.REQUIRED,
    monthlyStipend: "Living stipend per host institution",
    tuitionCoverage: "Full tuition",
    airfareCovered: true,
    healthInsuranceCovered: true,
    daysUntilDeadline: null,
    applicationUrl: "https://foreign.fulbrightonline.org/",
    sourceIndex: 1,
    isOfficial: true,
  },
];

async function main() {
  console.log("Seeding reference data (countries, subjects)...");
  const countries = new Map<string, string>();
  for (const c of COUNTRY_CATALOG) {
    const row = await prisma.country.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name, code: c.code, region: c.region, slug: slugify(c.name) },
    });
    countries.set(c.name, row.id);
  }

  const subjects = new Map<string, string>();
  for (const [name, { category }] of Object.entries(SUBJECT_CATALOG)) {
    const row = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name), category },
    });
    subjects.set(name, row.id);
  }

  console.log("Seeding scholarship sources...");
  const sourceIds: string[] = [];
  for (const s of SOURCES) {
    const row = await prisma.scholarshipSource.upsert({
      where: { name: s.name },
      update: {},
      create: {
        name: s.name,
        baseUrl: s.baseUrl,
        crawlerType: s.crawlerType,
        reliability: s.reliability,
        notes: s.notes,
        crawlFrequencyHrs: 12,
      },
    });
    sourceIds.push(row.id);
  }

  console.log("Seeding sample scholarships (marked isSeed=true, unverified)...");
  for (const s of SEED_SCHOLARSHIPS) {
    const slug = slugify(s.title);
    const exists = await prisma.scholarship.findUnique({ where: { slug } });
    if (exists) continue;

    const destinationCountryId = countries.get(s.destinationCountry);
    const eligibleCountryIds =
      s.eligibleCountries === "all" ? [] : s.eligibleCountries.map((name) => countries.get(name)).filter((id): id is string => Boolean(id));
    const subjectIds = s.subjects.map((name) => subjects.get(name)).filter((id): id is string => Boolean(id));

    const applicationDeadline = s.daysUntilDeadline === null ? null : daysFromNow(s.daysUntilDeadline);
    const isRolling = s.daysUntilDeadline === null;
    const { status: deadlineStatus } = computeDeadlineInfo(applicationDeadline, isRolling, null);

    const hash = contentHash([s.title, s.description, s.fundingType, applicationDeadline?.toISOString(), s.applicationUrl]);

    await prisma.scholarship.create({
      data: {
        slug,
        title: s.title,
        canonicalTitleNormalized: s.title.toLowerCase(),
        provider: s.provider,
        description: s.description,
        summary: s.summary,
        degreeLevels: toJsonArray(s.degreeLevels),
        fundingType: s.fundingType,
        tuitionCoverage: s.tuitionCoverage,
        monthlyStipend: s.monthlyStipend,
        accommodationCovered: s.accommodationCovered ?? null,
        airfareCovered: s.airfareCovered ?? null,
        healthInsuranceCovered: s.healthInsuranceCovered ?? null,
        minimumGPA: s.minimumGPA,
        ieltsRequired: s.ielts,
        allNationalitiesEligible: s.eligibleCountries === "all",
        applicationDeadline,
        deadlineType: isRolling ? DeadlineType.ROLLING : DeadlineType.FIXED,
        isRolling,
        deadlineStatus,
        status: ScholarshipStatus.PUBLISHED,
        contentHash: hash,
        sourceReliability: SOURCES[s.sourceIndex].reliability,
        applicationUrl: s.applicationUrl,
        officialUrl: s.isOfficial ? s.applicationUrl : null,
        primaryCountryId: destinationCountryId,
        primarySourceId: sourceIds[s.sourceIndex],
        isSeed: true,
        lastVerifiedAt: null,
        scrapedAt: null,
        publishedAt: daysFromNow(-Math.floor(Math.random() * 30)),
        destinations: destinationCountryId ? { create: [{ countryId: destinationCountryId, isPrimary: true }] } : undefined,
        eligibleCountries: { create: eligibleCountryIds.map((countryId) => ({ countryId })) },
        subjects: { create: subjectIds.map((subjectId) => ({ subjectId })) },
        sourceLinks: {
          create: [
            {
              sourceId: sourceIds[s.sourceIndex],
              sourceUrl: s.applicationUrl,
              isOfficial: Boolean(s.isOfficial),
              rawTitle: s.title,
              contentHash: hash,
            },
          ],
        },
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
