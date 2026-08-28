import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
      <div className="prose prose-neutral mt-6 max-w-none space-y-4 text-foreground/90 dark:prose-invert">
        <p>Last updated: {new Date().getFullYear()}</p>
        <p>
          We collect the information you provide when you create an account (name, email) and the preferences you
          set for recommendations and alerts (degree level, subjects, countries, nationality). We use this data only
          to operate the platform — powering saved scholarships, recommendations, and alert emails.
        </p>
        <p>
          Scholarship listings are aggregated from publicly available third-party sources. We do not sell personal
          data to third parties. You may request deletion of your account and associated data at any time via the
          Contact page.
        </p>
      </div>
    </div>
  );
}
