import Link from "next/link";
import { ArrowRight, ShieldCheck, RadarIcon, Layers } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ScholarshipCard } from "@/components/scholarship-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFeatured, getClosingSoon } from "@/services/scholarship-query";
import { prisma } from "@/lib/prisma";

const QUICK_FILTERS = [
  { label: "Fully Funded", href: "/scholarships?fundingTypes=FULLY_FUNDED" },
  { label: "Bachelor's", href: "/scholarships?degreeLevels=UNDERGRADUATE" },
  { label: "Master's", href: "/scholarships?degreeLevels=MASTERS" },
  { label: "PhD", href: "/scholarships?degreeLevels=PHD" },
  { label: "Computer Science", href: "/subjects/computer-science" },
  { label: "Engineering", href: "/subjects/engineering" },
  { label: "USA", href: "/countries/united-states" },
  { label: "UK", href: "/countries/united-kingdom" },
  { label: "Germany", href: "/countries/germany" },
  { label: "Japan", href: "/countries/japan" },
];

export default async function HomePage() {
  const [featured, closingSoon, totalCount, sourceCount] = await Promise.all([
    getFeatured(8),
    getClosingSoon(4),
    prisma.scholarship.count({ where: { status: "PUBLISHED" } }),
    prisma.scholarshipSource.count({ where: { enabled: true } }),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
          <Badge variant="secondary" className="mb-5">
            {totalCount.toLocaleString()}+ opportunities tracked across {sourceCount} sources
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find Scholarships That <span className="text-primary">Fund Your Future</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
            Discover scholarships, fellowships, and fully funded opportunities from universities, governments, and
            organizations worldwide — verified, deduplicated, and always linked to the official source.
          </p>

          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBar />
          </div>

          <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {QUICK_FILTERS.map((f) => (
              <Link key={f.label} href={f.href}>
                <Badge variant="outline" className="cursor-pointer bg-background/60 px-3 py-1.5 text-sm hover:bg-muted">
                  {f.label}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <TrustPoint
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Verified & sourced"
            description="Every listing links to its original source and shows exactly when it was last verified."
          />
          <TrustPoint
            icon={<Layers className="h-5 w-5" />}
            title="Deduplicated"
            description="The same scholarship posted on multiple sites is merged into one canonical listing."
          />
          <TrustPoint
            icon={<RadarIcon className="h-5 w-5" />}
            title="Always fresh"
            description="Sources are re-crawled on a schedule, so deadlines and details stay current."
          />
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Featured Scholarships</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fully funded opportunities, hand-picked from verified sources.</p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/scholarships/fully-funded" className="gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((s) => (
              <ScholarshipCard key={s.id} scholarship={s} />
            ))}
          </div>
        </section>
      )}

      {closingSoon.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Closing Soon</h2>
                <p className="mt-1 text-sm text-muted-foreground">Don&apos;t miss these — sorted by nearest deadline.</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/scholarships/closing-soon" className="gap-1">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {closingSoon.map((s) => (
                <ScholarshipCard key={s.id} scholarship={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function TrustPoint({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
