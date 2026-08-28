import type { Metadata } from "next";
import { FundingType } from "@prisma/client";
import { ScholarshipBrowser } from "@/components/scholarship-browser";

export const metadata: Metadata = {
  title: "Fully Funded Scholarships",
  description: "Browse fully funded scholarships covering tuition, stipend, accommodation, and airfare worldwide.",
};

export default function FullyFundedPage() {
  return (
    <ScholarshipBrowser
      presetFilters={{ fundingTypes: [FundingType.FULLY_FUNDED] }}
      title="Fully Funded Scholarships"
      description="tuition, stipend, and living costs covered"
      basePath="/scholarships/fully-funded"
    />
  );
}
