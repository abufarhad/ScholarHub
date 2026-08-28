"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FilterSidebar } from "@/components/filters/filter-sidebar";
import { MobileFilterSheet } from "@/components/filters/mobile-filter-sheet";
import { ScholarshipCard, ScholarshipCardSkeleton } from "@/components/scholarship-card";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { parseSearchParamsToFilters, type SearchParamsInput } from "@/lib/filter-params";
import { filterAndScoreScholarships, paginate, type ScholarshipFilters } from "@/lib/client-search";
import { withBasePath } from "@/lib/base-path";
import type { StaticScholarship, StaticMeta } from "@/types/static-data";

const PAGE_SIZE = 20;

interface Props {
  presetFilters?: Partial<ScholarshipFilters>;
  title: string;
  description: string;
  basePath: string;
  hideFilters?: boolean;
  /** When set, only these slugs are shown (used by the "Saved" page) instead of the full dataset. */
  restrictToSlugs?: string[];
}

function useStaticData() {
  const [scholarships, setScholarships] = useState<StaticScholarship[] | null>(null);
  const [meta, setMeta] = useState<StaticMeta | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(withBasePath("/data/scholarships.json")).then((r) => r.json()),
      fetch(withBasePath("/data/meta.json")).then((r) => r.json()),
    ])
      .then(([s, m]) => {
        if (!cancelled) {
          setScholarships(s);
          setMeta(m);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { scholarships, meta, error };
}

function ScholarshipBrowserInner({ presetFilters, title, description, basePath, hideFilters, restrictToSlugs }: Props) {
  const searchParams = useSearchParams();
  const { scholarships, meta, error } = useStaticData();

  const searchParamsObj = useMemo<SearchParamsInput>(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  const filters: ScholarshipFilters = useMemo(
    () => ({ ...parseSearchParamsToFilters(searchParamsObj), ...presetFilters, pageSize: PAGE_SIZE }),
    [searchParamsObj, presetFilters],
  );

  const pool = useMemo(() => {
    if (!scholarships) return [];
    return restrictToSlugs ? scholarships.filter((s) => restrictToSlugs.includes(s.slug)) : scholarships;
  }, [scholarships, restrictToSlugs]);

  const scored = useMemo(() => filterAndScoreScholarships(pool, filters), [pool, filters]);
  const { items, total } = useMemo(() => paginate(scored, filters.page ?? 1, PAGE_SIZE), [scored, filters.page]);

  const countryOptions = meta?.countries ?? [];
  const subjectOptions = meta?.subjects ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scholarships ? `${total.toLocaleString()} opportunit${total === 1 ? "y" : "ies"} · ${description}` : "Loading…"}
          </p>
        </div>
        {!hideFilters && <MobileFilterSheet countries={countryOptions} subjects={subjectOptions} />}
      </div>

      <div className={hideFilters ? "" : "grid gap-8 lg:grid-cols-[260px_1fr]"}>
        {!hideFilters && (
          <div className="hidden lg:block">
            <FilterSidebar countries={countryOptions} subjects={subjectOptions} />
          </div>
        )}

        <div>
          {error ? (
            <EmptyState
              title="Couldn't load scholarship data"
              description="The dataset failed to load. Try refreshing the page."
            />
          ) : !scholarships ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ScholarshipCardSkeleton key={i} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No scholarships found here"
              description="Try removing a filter or broadening your search — new scholarships are added every time the crawler runs."
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map(({ item }) => (
                <ScholarshipCard key={item.id} scholarship={item} />
              ))}
            </div>
          )}
          {scholarships && (
            <Pagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={total} basePath={basePath} searchParams={searchParamsObj} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ScholarshipBrowser(props: Props) {
  return (
    <Suspense fallback={<BrowserSkeleton title={props.title} />}>
      <ScholarshipBrowserInner {...props} />
    </Suspense>
  );
}

function BrowserSkeleton({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ScholarshipCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
