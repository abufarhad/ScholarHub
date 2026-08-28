import type { Prisma } from "@prisma/client";

/**
 * SQLite has no native array/enum-array column type, so `degreeLevels`,
 * `otherBenefits`, and `tags` on Scholarship are stored as `Json` (a
 * JSON-encoded array) instead. These helpers are the only place that should
 * ever touch that encoding — everywhere else in the app works with plain
 * `string[]` / `DegreeLevel[]`.
 */

export function toJsonArray<T>(values: readonly T[]): Prisma.InputJsonValue {
  return values as unknown as Prisma.InputJsonValue;
}

export function fromJsonArray<T = string>(value: Prisma.JsonValue | null | undefined): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}
