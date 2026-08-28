"use client";

import { useEffect, useState } from "react";
import { ScholarshipBrowser } from "@/components/scholarship-browser";
import { getBookmarks, BOOKMARKS_CHANGED_EVENT } from "@/lib/bookmarks";

export default function SavedScholarshipsPage() {
  const [slugs, setSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    const sync = () => setSlugs(getBookmarks());
    sync();
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BOOKMARKS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (slugs === null) return null;

  return (
    <ScholarshipBrowser
      restrictToSlugs={slugs}
      title="Saved Scholarships"
      description={slugs.length === 0 ? "saved to this browser" : "saved to this browser — bookmarks are stored locally, not synced across devices"}
      basePath="/scholarships/saved"
      hideFilters
    />
  );
}
