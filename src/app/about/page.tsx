import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "ScholarHub aggregates, verifies, and organizes scholarship opportunities from trusted sources worldwide.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">About ScholarHub</h1>
      <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-foreground/90 dark:prose-invert">
        <p>
          ScholarHub is a discovery platform for scholarships, fellowships, and fully funded study opportunities. We
          don&apos;t create scholarships or decide who gets funded — we aggregate listings from universities,
          governments, and reputable scholarship-information sites, normalize the details into a consistent format,
          and remove duplicates so the same opportunity doesn&apos;t appear three separate times.
        </p>
        <h2 className="text-xl font-semibold">How it works</h2>
        <p>
          Our crawlers periodically check configured sources for new and updated scholarship listings, respecting
          each site&apos;s robots.txt and rate limits. Extracted data is normalized into a consistent schema (degree
          level, subject, country, funding type), checked against existing listings for duplicates, and stored with a
          timestamp of when it was last verified.
        </p>
        <h2 className="text-xl font-semibold">Always check the official source</h2>
        <p>
          Every listing links back to where the information came from, and — where we can confirm it — to the
          official provider or application page. Scholarship details can change after we crawl a page, so always
          confirm deadlines and requirements on the official website before applying.
        </p>
      </div>
    </div>
  );
}
