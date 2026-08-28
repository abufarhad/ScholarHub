"use client";

/**
 * "Saved scholarships" with no backend: just the slugs, in this browser's
 * localStorage. There's no server to sync across devices — that's the
 * honest trade-off of a static site with no accounts — but it costs nothing
 * to run and still lets a student build a shortlist across a session.
 */
const STORAGE_KEY = "scholarhub:bookmarks";

function readAll(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new CustomEvent("scholarhub:bookmarks-changed"));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — saving
    // silently no-ops rather than throwing and breaking the page.
  }
}

export function getBookmarks(): string[] {
  return readAll();
}

export function isBookmarked(slug: string): boolean {
  return readAll().includes(slug);
}

export function toggleBookmark(slug: string): boolean {
  const current = readAll();
  const isSaved = current.includes(slug);
  writeAll(isSaved ? current.filter((s) => s !== slug) : [...current, slug]);
  return !isSaved;
}

export const BOOKMARKS_CHANGED_EVENT = "scholarhub:bookmarks-changed";
