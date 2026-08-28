import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ScholarshipBrowser } from "@/components/scholarship-browser";
import { prisma } from "@/lib/prisma";

async function getSubject(slug: string) {
  return prisma.subject.findUnique({ where: { slug } });
}

export async function generateStaticParams() {
  const subjects = await prisma.subject.findMany({
    where: { scholarships: { some: { scholarship: { status: { in: ["PUBLISHED", "EXPIRED"] } } } } },
    select: { slug: true },
  });
  return subjects.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ subject: string }> }): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = await getSubject(slug);
  if (!subject) return {};
  return {
    title: `${subject.name} Scholarships`,
    description: `Browse ${subject.name} scholarships and fully funded programs worldwide.`,
  };
}

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: slug } = await params;
  const subject = await getSubject(slug);
  if (!subject) notFound();

  return (
    <ScholarshipBrowser
      presetFilters={{ subjects: [slug] }}
      title={`${subject.name} Scholarships`}
      description={`in ${subject.name}`}
      basePath={`/subjects/${slug}`}
    />
  );
}
