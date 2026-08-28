"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isBookmarked, toggleBookmark } from "@/lib/bookmarks";

export function BookmarkButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(isBookmarked(slug));
  }, [slug]);

  function handleClick() {
    const nowSaved = toggleBookmark(slug);
    setSaved(nowSaved);
    toast.success(nowSaved ? "Saved to this browser" : "Removed from saved");
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="lg" disabled className="gap-2">
        <Bookmark className="h-4 w-4" /> Save
      </Button>
    );
  }

  return (
    <Button variant="outline" size="lg" onClick={handleClick} className="gap-2">
      {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
