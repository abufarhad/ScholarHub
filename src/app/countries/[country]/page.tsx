import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScholarshipBrowser } from "@/components/scholarship-browser";
import { prisma } from "@/lib/prisma";

async function getCountry(slug: string) {
  return prisma.country.findUnique({ where: { slug } });
}

export async function generateStaticParams() {
  const countries = await prisma.country.findMany({
    where: { destinations: { some: { scholarship: { status: { in: ["PUBLISHED", "EXPIRED"] } } } } },
    select: { slug: true },
  });
  return countries.map((c) => ({ country: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country: slug } = await params;
  const country = await getCountry(slug);
  if (!country) return {};
  return {
    title: `Scholarships in ${country.name}`,
    description: `Browse scholarships and fully funded study opportunities in ${country.name}.`,
  };
}

export default async function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country: slug } = await params;
  const country = await getCountry(slug);
  if (!country) notFound();

  return (
    <ScholarshipBrowser
      presetFilters={{ destinationCountries: [slug] }}
      title={`Scholarships in ${country.name}`}
      description={`opportunities to study in ${country.name}`}
      basePath={`/countries/${slug}`}
    />
  );
}
