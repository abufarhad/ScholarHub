import type { Metadata } from "next";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "Browse Scholarships",
  description: "Search and filter scholarships by degree level, subject, destination country, funding type, and deadline.",
};

export default function ScholarshipsPage() {
  return <ScholarshipBrowser title="Browse Scholarships" description="available worldwide" basePath="/scholarships" />;
}
