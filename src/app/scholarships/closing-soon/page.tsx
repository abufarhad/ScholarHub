import type { Metadata } from "next";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "Closing Soon",
  description: "Scholarships with approaching application deadlines, sorted by the nearest deadline first.",
};

export default function ClosingSoonPage() {
  return (
    <ScholarshipBrowser
      presetFilters={{ sort: "deadline", deadlineWithinDays: 60 }}
      title="Closing Soon"
      description="sorted by nearest deadline"
      basePath="/scholarships/closing-soon"
    />
  );
}
