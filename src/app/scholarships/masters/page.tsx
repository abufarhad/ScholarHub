import type { Metadata } from "next";
import { DegreeLevel } from "@prisma/client";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "Master's Scholarships",
  description: "Browse Master's degree scholarships and fully funded graduate programs worldwide.",
};

export default function MastersPage() {
  return (
    <ScholarshipBrowser
      presetFilters={{ degreeLevels: [DegreeLevel.MASTERS] }}
      title="Master's Scholarships"
      description="graduate-level opportunities"
      basePath="/scholarships/masters"
    />
  );
}
