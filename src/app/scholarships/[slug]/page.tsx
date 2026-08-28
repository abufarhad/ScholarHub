import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  GraduationCap,
  Wallet,
  Calendar,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Globe2,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeadlineBadge } from "@/components/deadline-badge";
import { BookmarkButton } from "@/components/bookmark-button";
import { getScholarshipBySlug, getAllPublishedSlugs } from "@/services/scholarship-query";
import { computeDeadlineInfo } from "@/lib/deadline";
import { formatDate, formatRelativeTime } from "@/lib/format";
import { DEGREE_LEVEL_LABELS } from "@/lib/normalize/degree";
import { FUNDING_TYPE_LABELS } from "@/lib/normalize/funding";

const RELIABILITY_LABELS: Record<string, string> = {
  OFFICIAL_PROVIDER: "Official Provider",
  OFFICIAL_GOVERNMENT: "Official Government Source",
  UNIVERSITY: "University Source",
  VERIFIED_AGGREGATOR: "Verified Aggregator",
  AGGREGATOR: "Scholarship Aggregator",
  UNKNOWN: "Unverified Source",
};

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const scholarship = await getScholarshipBySlug(slug);
  if (!scholarship) return {};

  const title = scholarship.title;
  const description = scholarship.summary ?? scholarship.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/scholarships/${scholarship.slug}` },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary", title, description },
  };
}

export default async function ScholarshipDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const scholarship = await getScholarshipBySlug(slug);
  if (!scholarship) notFound();

  const applicationDeadline = scholarship.applicationDeadline ? new Date(scholarship.applicationDeadline) : null;
  const openingDate = scholarship.openingDate ? new Date(scholarship.openingDate) : null;
  const { status, daysRemaining } = computeDeadlineInfo(applicationDeadline, scholarship.isRolling, openingDate);
  const isOfficialConfirmed = scholarship.sourceLinks.some((l) => l.isOfficial);

  const benefits = [
    { label: "Full Tuition", active: scholarship.fundingType === "FULLY_FUNDED" || Boolean(scholarship.tuitionCoverage) },
    { label: "Monthly Stipend", active: Boolean(scholarship.monthlyStipend) },
    { label: "Airfare", active: Boolean(scholarship.airfareCovered) },
    { label: "Accommodation", active: Boolean(scholarship.accommodationCovered) },
    { label: "Health Insurance", active: Boolean(scholarship.healthInsuranceCovered) },
    { label: "Application Fee Waived", active: Boolean(scholarship.applicationFeeCovered) },
  ].filter((b) => b.active);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: scholarship.title,
    description: scholarship.summary ?? undefined,
    provider: scholarship.provider ? { "@type": "Organization", name: scholarship.provider } : undefined,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/scholarships/${scholarship.slug}`,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/scholarships" className="hover:text-foreground">Scholarships</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{scholarship.title}</span>
      </nav>

      <div className="flex flex-col gap-4 border-b border-border pb-8">
        <div className="flex flex-wrap items-center gap-2">
          {scholarship.provider && <Badge variant="secondary">{scholarship.provider}</Badge>}
          {scholarship.isSeed && <Badge variant="outline">Sample data</Badge>}
          <DeadlineBadge status={status} daysRemaining={daysRemaining} />
        </div>

        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{scholarship.title}</h1>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {scholarship.primaryCountry && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> {scholarship.primaryCountry.name}
              {scholarship.destinationCity ? `, ${scholarship.destinationCity}` : ""}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4" />
            {scholarship.degreeLevels.length > 0 ? scholarship.degreeLevels.map((d) => DEGREE_LEVEL_LABELS[d]).join(" · ") : "Various levels"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> {FUNDING_TYPE_LABELS[scholarship.fundingType]}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {scholarship.isRolling ? "Rolling admission" : `Deadline: ${formatDate(applicationDeadline)}`}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild className="gap-2">
            <a href={scholarship.applicationUrl} target="_blank" rel="noopener noreferrer nofollow">
              Apply on Official Website <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <BookmarkButton slug={scholarship.slug} />
        </div>
      </div>

      <div className="grid gap-10 py-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-10">
          <Section title="Overview">
            <p className="whitespace-pre-line leading-relaxed text-foreground/90">{scholarship.description}</p>
          </Section>

          {benefits.length > 0 && (
            <Section title="Financial Benefits">
              <div className="grid gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <div key={b.label} className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
                    <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-success" />
                    <span className="text-sm font-medium">{b.label}</span>
                  </div>
                ))}
                {scholarship.tuitionCoverage && <BenefitDetail label="Tuition" value={scholarship.tuitionCoverage} />}
                {scholarship.monthlyStipend && <BenefitDetail label="Monthly Stipend" value={scholarship.monthlyStipend} />}
              </div>
              {scholarship.otherBenefits.length > 0 && (
                <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {scholarship.otherBenefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          {scholarship.subjects.length > 0 && (
            <Section title="Fields of Study">
              <div className="flex flex-wrap gap-2">
                {scholarship.subjects.map((subject) => (
                  <Link key={subject.slug} href={`/subjects/${subject.slug}`}>
                    <Badge variant="outline">{subject.name}</Badge>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title="Eligibility">
            <dl className="grid gap-4 sm:grid-cols-2">
              {scholarship.minimumEducation && <Field label="Minimum Education" value={scholarship.minimumEducation} />}
              {scholarship.minimumGPA != null && <Field label="Minimum GPA" value={`${scholarship.minimumGPA} / 4.0`} />}
              {scholarship.ageLimit && <Field label="Age Limit" value={scholarship.ageLimit} />}
              <Field label="IELTS" value={requirementLabel(scholarship.ieltsRequired)} />
              <Field label="TOEFL" value={requirementLabel(scholarship.toeflRequired)} />
              {scholarship.workExperienceRequired != null && (
                <Field label="Work Experience" value={scholarship.workExperienceRequired ? "Required" : "Not required"} />
              )}
            </dl>
            {scholarship.nationalityRequirements && (
              <p className="mt-4 text-sm text-muted-foreground">{scholarship.nationalityRequirements}</p>
            )}
            {scholarship.otherEligibility && <p className="mt-2 text-sm text-muted-foreground">{scholarship.otherEligibility}</p>}
          </Section>

          <Section title="Important Dates">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Application Deadline" value={scholarship.isRolling ? "Rolling" : formatDate(applicationDeadline)} />
              {openingDate && <Field label="Opens" value={formatDate(openingDate)} />}
              {scholarship.publishedAt && <Field label="Published" value={formatDate(new Date(scholarship.publishedAt))} />}
            </dl>
          </Section>

          {(scholarship.eligibleCountries.length > 0 || scholarship.allNationalitiesEligible) && (
            <Section title="Eligible Countries">
              {scholarship.allNationalitiesEligible ? (
                <p className="inline-flex items-center gap-2 text-sm text-foreground">
                  <Globe2 className="h-4 w-4 text-primary" /> Open to all international students
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {scholarship.eligibleCountries.map((country) => (
                    <Badge key={country.slug} variant="outline">{country.name}</Badge>
                  ))}
                </div>
              )}
            </Section>
          )}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Last verified: <strong>{scholarship.lastVerifiedAt ? formatRelativeTime(new Date(scholarship.lastVerifiedAt)) : "Not yet verified"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOfficialConfirmed ? (
                  <ShieldCheck className="h-4 w-4 text-success" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
                <span>
                  Source: <strong>{RELIABILITY_LABELS[scholarship.sourceReliability]}</strong>
                </span>
              </div>
              {scholarship.sourceLinks.length > 1 && (
                <p className="text-xs text-muted-foreground">Found on {scholarship.sourceLinks.length} sources</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Official Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scholarship.sourceLinks.map((link) => (
                <a
                  key={link.sourceUrl}
                  href={link.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center justify-between gap-2 rounded-md border border-border p-2.5 text-xs hover:bg-muted"
                >
                  <span className="truncate">{link.sourceName}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    {link.isOfficial && <Badge variant="success" className="text-[10px]">Official</Badge>}
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                </a>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}

function BenefitDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:col-span-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <p className="text-sm">{value}</p>
    </div>
  );
}

function requirementLabel(value: string): string {
  return { REQUIRED: "Required", NOT_REQUIRED: "Not Required", OPTIONAL: "Optional", UNKNOWN: "Unknown" }[value] ?? value;
}
