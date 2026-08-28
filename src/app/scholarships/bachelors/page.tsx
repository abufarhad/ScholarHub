import type { Metadata } from "next";
import { DegreeLevel } from "@prisma/client";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "Bachelor's Scholarships",
  description: "Browse Bachelor's and undergraduate scholarships worldwide.",
};

export default function BachelorsPage() {
  return (
    <ScholarshipBrowser
      presetFilters={{ degreeLevels: [DegreeLevel.UNDERGRADUATE] }}
      title="Bachelor's Scholarships"
      description="undergraduate opportunities"
      basePath="/scholarships/bachelors"
    />
  );
}
