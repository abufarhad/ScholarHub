import Link from "next/link";
import { GraduationCap, MapPin, Wallet, Calendar, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeadlineBadge } from "@/components/deadline-badge";
import { DEGREE_LEVEL_LABELS } from "@/lib/normalize/degree";
import { FUNDING_TYPE_LABELS } from "@/lib/normalize/funding";
import { computeDeadlineInfo } from "@/lib/deadline";
import { formatShortDate } from "@/lib/format";
import type { StaticScholarship } from "@/types/static-data";

export function ScholarshipCard({ scholarship }: { scholarship: StaticScholarship }) {
  const { status, daysRemaining } = computeDeadlineInfo(
    scholarship.applicationDeadline ? new Date(scholarship.applicationDeadline) : null,
    scholarship.isRolling,
    scholarship.openingDate ? new Date(scholarship.openingDate) : null,
  );

  return (
    <Link href={`/scholarships/${scholarship.slug}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          {scholarship.provider ? (
            <span className="line-clamp-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {scholarship.provider}
            </span>
          ) : (
            <span />
          )}
          {scholarship.isSeed && (
            <Badge variant="outline" className="shrink-0 text-[10px]">
              Sample data
            </Badge>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground group-hover:text-primary">
          {scholarship.title}
        </h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
          {scholarship.primaryCountry && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {scholarship.primaryCountry.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            {scholarship.degreeLevels.length > 0
              ? scholarship.degreeLevels.map((d) => DEGREE_LEVEL_LABELS[d]).join(" / ")
              : "Various levels"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            {FUNDING_TYPE_LABELS[scholarship.fundingType]}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {scholarship.isRolling ? "Rolling admission" : formatShortDate(scholarship.applicationDeadline)}
          </span>
          <DeadlineBadge status={status} daysRemaining={daysRemaining} />
        </div>

        {scholarship.sourceLinks.length > 1 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Layers className="h-3 w-3" />
            Found on {scholarship.sourceLinks.length} sources
          </div>
        )}
      </Card>
    </Link>
  );
}

export function ScholarshipCardSkeleton() {
  return (
    <Card className="flex h-56 flex-col gap-3 p-5">
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="h-5 w-full animate-pulse rounded bg-muted" />
      <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-auto h-6 w-full animate-pulse rounded bg-muted" />
    </Card>
  );
}
