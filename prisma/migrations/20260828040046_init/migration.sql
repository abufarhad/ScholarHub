-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScholarshipSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "crawlerType" TEXT NOT NULL,
    "reliability" TEXT NOT NULL DEFAULT 'AGGREGATOR',
    "crawlFrequencyHrs" INTEGER NOT NULL DEFAULT 12,
    "respectRobotsTxt" BOOLEAN NOT NULL DEFAULT true,
    "robotsTxtAllowed" BOOLEAN NOT NULL DEFAULT true,
    "requestDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "lastCrawledAt" DATETIME,
    "nextCrawlAt" DATETIME,
    "crawlStatus" TEXT NOT NULL DEFAULT 'IDLE',
    "crawlError" TEXT,
    "totalItemsFound" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "itemsFound" INTEGER NOT NULL DEFAULT 0,
    "itemsCreated" INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
    "itemsUnchanged" INTEGER NOT NULL DEFAULT 0,
    "itemsSkipped" INTEGER NOT NULL DEFAULT 0,
    "itemsExpired" INTEGER NOT NULL DEFAULT 0,
    "duplicatesFound" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'scheduler',
    CONSTRAINT "CrawlRun_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ScholarshipSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CrawlItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "crawlRunId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "rawTitle" TEXT,
    "action" TEXT NOT NULL,
    "scholarshipId" TEXT,
    "contentHash" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrawlItem_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CrawlItem_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipSourceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scholarshipId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "externalId" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rawTitle" TEXT,
    "rawDeadlineText" TEXT,
    "contentHash" TEXT,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheckedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScholarshipSourceLink_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScholarshipSourceLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ScholarshipSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "canonicalTitleNormalized" TEXT NOT NULL,
    "provider" TEXT,
    "university" TEXT,
    "organization" TEXT,
    "description" TEXT NOT NULL,
    "summary" TEXT,
    "degreeLevels" JSONB NOT NULL DEFAULT [],
    "fundingType" TEXT NOT NULL,
    "tuitionCoverage" TEXT,
    "monthlyStipend" TEXT,
    "accommodationCovered" BOOLEAN,
    "airfareCovered" BOOLEAN,
    "healthInsuranceCovered" BOOLEAN,
    "applicationFeeCovered" BOOLEAN,
    "otherBenefits" JSONB NOT NULL DEFAULT [],
    "minimumEducation" TEXT,
    "minimumGPA" REAL,
    "ageLimit" TEXT,
    "nationalityRequirements" TEXT,
    "languageRequirements" TEXT,
    "ieltsRequired" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "toeflRequired" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "workExperienceRequired" BOOLEAN,
    "otherEligibility" TEXT,
    "allNationalitiesEligible" BOOLEAN NOT NULL DEFAULT true,
    "applicationDeadline" DATETIME,
    "deadlineType" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "isRolling" BOOLEAN NOT NULL DEFAULT false,
    "openingDate" DATETIME,
    "deadlineStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "primaryCountryId" TEXT,
    "destinationCity" TEXT,
    "region" TEXT,
    "publishedAt" DATETIME,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" DATETIME,
    "scrapedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "contentHash" TEXT NOT NULL,
    "sourceReliability" TEXT NOT NULL DEFAULT 'AGGREGATOR',
    "officialUrl" TEXT,
    "applicationUrl" TEXT NOT NULL,
    "primarySourceId" TEXT,
    "isSeed" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB NOT NULL DEFAULT [],
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Scholarship_primaryCountryId_fkey" FOREIGN KEY ("primaryCountryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Scholarship_primarySourceId_fkey" FOREIGN KEY ("primarySourceId") REFERENCES "ScholarshipSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipSubject" (
    "scholarshipId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    PRIMARY KEY ("scholarshipId", "subjectId"),
    CONSTRAINT "ScholarshipSubject_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScholarshipSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipEligibleCountry" (
    "scholarshipId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    PRIMARY KEY ("scholarshipId", "countryId"),
    CONSTRAINT "ScholarshipEligibleCountry_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScholarshipEligibleCountry_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScholarshipDestination" (
    "scholarshipId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("scholarshipId", "countryId"),
    CONSTRAINT "ScholarshipDestination_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScholarshipDestination_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_slug_key" ON "Country"("slug");

-- CreateIndex
CREATE INDEX "Country_region_idx" ON "Country"("region");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_slug_key" ON "Subject"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipSource_name_key" ON "ScholarshipSource"("name");

-- CreateIndex
CREATE INDEX "CrawlRun_sourceId_startedAt_idx" ON "CrawlRun"("sourceId", "startedAt");

-- CreateIndex
CREATE INDEX "CrawlItem_crawlRunId_idx" ON "CrawlItem"("crawlRunId");

-- CreateIndex
CREATE INDEX "ScholarshipSourceLink_scholarshipId_idx" ON "ScholarshipSourceLink"("scholarshipId");

-- CreateIndex
CREATE UNIQUE INDEX "ScholarshipSourceLink_sourceId_sourceUrl_key" ON "ScholarshipSourceLink"("sourceId", "sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_slug_key" ON "Scholarship"("slug");

-- CreateIndex
CREATE INDEX "Scholarship_status_applicationDeadline_idx" ON "Scholarship"("status", "applicationDeadline");

-- CreateIndex
CREATE INDEX "Scholarship_deadlineStatus_idx" ON "Scholarship"("deadlineStatus");

-- CreateIndex
CREATE INDEX "Scholarship_canonicalTitleNormalized_idx" ON "Scholarship"("canonicalTitleNormalized");

-- CreateIndex
CREATE INDEX "Scholarship_contentHash_idx" ON "Scholarship"("contentHash");

-- CreateIndex
CREATE INDEX "Scholarship_slug_idx" ON "Scholarship"("slug");

-- CreateIndex
CREATE INDEX "Scholarship_primaryCountryId_idx" ON "Scholarship"("primaryCountryId");

-- CreateIndex
CREATE INDEX "ScholarshipSubject_subjectId_idx" ON "ScholarshipSubject"("subjectId");

-- CreateIndex
CREATE INDEX "ScholarshipEligibleCountry_countryId_idx" ON "ScholarshipEligibleCountry"("countryId");

-- CreateIndex
CREATE INDEX "ScholarshipDestination_countryId_idx" ON "ScholarshipDestination"("countryId");
