import type { Prisma, PrismaClient } from "@prisma/client";
import { slugify } from "@/lib/slug";
import { countryByName } from "@/lib/normalize/country";
import { SUBJECT_CATALOG } from "@/lib/normalize/subject";

type Client = PrismaClient | Prisma.TransactionClient;

/** Upserts a Country by name, seeding code/region from the catalog when creating it fresh. */
export async function upsertCountryByName(db: Client, name: string) {
  const def = countryByName(name);
  return db.country.upsert({
    where: { name },
    update: {},
    create: {
      name,
      code: def?.code ?? slugify(name).slice(0, 2).toUpperCase(),
      region: def?.region ?? null,
      slug: slugify(name),
    },
  });
}

export async function upsertCountriesByNames(db: Client, names: string[]) {
  const results = [];
  for (const name of names) {
    results.push(await upsertCountryByName(db, name));
  }
  return results;
}

export async function upsertSubjectByName(db: Client, name: string) {
  const category = SUBJECT_CATALOG[name]?.category ?? null;
  return db.subject.upsert({
    where: { name },
    update: {},
    create: { name, slug: slugify(name), category },
  });
}

export async function upsertSubjectsByNames(db: Client, names: string[]) {
  const results = [];
  for (const name of names) {
    results.push(await upsertSubjectByName(db, name));
  }
  return results;
}
