import { createHash } from "node:crypto";

/**
 * Deterministic content hash used for change detection: if two crawls of the
 * same page produce the same hash, nothing meaningful changed and the crawl
 * pipeline records it as UNCHANGED instead of writing an UPDATE.
 */
export function contentHash(parts: Array<string | number | boolean | null | undefined>): string {
  const normalized = parts.map((p) => (p === null || p === undefined ? "" : String(p).trim().toLowerCase())).join("|");
  return createHash("sha256").update(normalized).digest("hex");
}
