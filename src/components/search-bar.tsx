"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({ initialQuery = "", size = "lg" }: { initialQuery?: string; size?: "lg" | "md" }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/scholarships?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search scholarships, universities, countries or subjects..."
        className={size === "lg" ? "h-14 rounded-xl pl-12 pr-32 text-base shadow-md" : "h-11 rounded-lg pl-11 pr-24"}
        aria-label="Search scholarships"
      />
      <Button
        type="submit"
        size={size === "lg" ? "default" : "sm"}
        className={size === "lg" ? "absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-lg" : "absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-md"}
      >
        Search
      </Button>
    </form>
  );
}
