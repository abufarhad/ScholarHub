import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
      <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-foreground/90 dark:prose-invert">
        <p>
          ScholarHub is an information discovery service. Scholarship listings are aggregated from third-party
          sources and may contain errors, become outdated, or be removed by the original provider without notice.
          We do not guarantee the accuracy or availability of any listing, and we are not affiliated with the
          scholarship providers unless explicitly stated.
        </p>
        <p>
          Always verify deadlines, eligibility, and application procedures on the official provider website before
          applying or making decisions based on information found here.
        </p>
        <p>
          Accounts are provided for personal, non-commercial use. Do not use automated tools to scrape or bulk-export
          data from this platform.
        </p>
      </div>
    </div>
  );
}
