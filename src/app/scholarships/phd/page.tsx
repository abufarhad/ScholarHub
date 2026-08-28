import type { Metadata } from "next";
import { DegreeLevel } from "@prisma/client";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "PhD Scholarships",
  description: "Browse PhD and doctoral scholarships, fellowships, and research funding worldwide.",
};

export default function PhdPage() {
  return (
    <ScholarshipBrowser
      presetFilters={{ degreeLevels: [DegreeLevel.PHD] }}
      title="PhD Scholarships"
      description="doctoral and research opportunities"
      basePath="/scholarships/phd"
    />
  );
}
