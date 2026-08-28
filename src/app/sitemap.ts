import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [scholarships, countries, subjects] = await Promise.all([
    prisma.scholarship.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true }, take: 5000 }),
    prisma.country.findMany({ select: { slug: true } }),
    prisma.subject.findMany({ select: { slug: true } }),
  ]);

  const staticRoutes = [
    "",
    "/scholarships",
    "/scholarships/fully-funded",
    "/scholarships/masters",
    "/scholarships/phd",
    "/scholarships/bachelors",
    "/scholarships/closing-soon",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "daily" as const, priority: path === "" ? 1 : 0.7 }));

  const scholarshipRoutes = scholarships.map((s) => ({
    url: `${siteUrl}/scholarships/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const countryRoutes = countries.map((c) => ({ url: `${siteUrl}/countries/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.5 }));
  const subjectRoutes = subjects.map((s) => ({ url: `${siteUrl}/subjects/${s.slug}`, changeFrequency: "weekly" as const, priority: 0.5 }));

  return [...staticRoutes, ...scholarshipRoutes, ...countryRoutes, ...subjectRoutes];
}
