"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DEGREE_LEVEL_LABELS } from "@/lib/normalize/degree";
import { FUNDING_TYPE_LABELS } from "@/lib/normalize/funding";

interface Option {
  slug: string;
  name: string;
  count: number;
}

const DEGREE_OPTIONS = Object.entries(DEGREE_LEVEL_LABELS).filter(([k]) => k !== "OTHER");
const FUNDING_OPTIONS = Object.entries(FUNDING_TYPE_LABELS).filter(([k]) => k !== "OTHER");
const DEADLINE_OPTIONS = [
  { value: "closing-week", label: "Closing this week" },
  { value: "closing-month", label: "Closing this month" },
  { value: "open", label: "Open" },
  { value: "upcoming", label: "Upcoming" },
  { value: "rolling", label: "Rolling" },
];
const IELTS_OPTIONS = [
  { value: "REQUIRED", label: "Required" },
  { value: "NOT_REQUIRED", label: "Not Required" },
  { value: "OPTIONAL", label: "Optional" },
  { value: "UNKNOWN", label: "Unknown" },
];

export function FilterSidebar({ countries, subjects }: { countries: Option[]; subjects: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [countrySearch, setCountrySearch] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");

  const current = new URLSearchParams(searchParams.toString());

  function toggleListParam(key: string, value: string) {
    const list = new Set((current.get(key) ?? "").split(",").filter(Boolean));
    if (list.has(value)) list.delete(value);
    else list.add(value);
    const next = new URLSearchParams(current);
    if (list.size > 0) next.set(key, Array.from(list).join(","));
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function setSingleParam(key: string, value: string | null) {
    const next = new URLSearchParams(current);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function isChecked(key: string, value: string) {
    return (current.get(key) ?? "").split(",").includes(value);
  }

  function clearAll() {
    const next = new URLSearchParams();
    const q = current.get("q");
    if (q) next.set("q", q);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Filters</h2>
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-auto p-0 text-xs">
          Clear all
        </Button>
      </div>

      <FilterGroup title="Degree">
        {DEGREE_OPTIONS.map(([value, label]) => (
          <CheckboxRow
            key={value}
            id={`degree-${value}`}
            checked={isChecked("degreeLevels", value)}
            onCheckedChange={() => toggleListParam("degreeLevels", value)}
            label={label}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup title="Funding">
        {FUNDING_OPTIONS.map(([value, label]) => (
          <CheckboxRow
            key={value}
            id={`funding-${value}`}
            checked={isChecked("fundingTypes", value)}
            onCheckedChange={() => toggleListParam("fundingTypes", value)}
            label={label}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup title="Deadline">
        {DEADLINE_OPTIONS.map((opt) => (
          <CheckboxRow
            key={opt.value}
            id={`deadline-${opt.value}`}
            checked={current.get("deadline") === opt.value}
            onCheckedChange={() => setSingleParam("deadline", current.get("deadline") === opt.value ? null : opt.value)}
            label={opt.label}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup title="IELTS">
        {IELTS_OPTIONS.map((opt) => (
          <CheckboxRow
            key={opt.value}
            id={`ielts-${opt.value}`}
            checked={isChecked("ielts", opt.value)}
            onCheckedChange={() => toggleListParam("ielts", opt.value)}
            label={opt.label}
          />
        ))}
      </FilterGroup>

      <Separator />

      <FilterGroup title="Destination Country">
        <Input
          placeholder="Search countries..."
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {countries
            .filter((c) => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
            .map((c) => (
              <CheckboxRow
                key={c.slug}
                id={`country-${c.slug}`}
                checked={isChecked("countries", c.slug)}
                onCheckedChange={() => toggleListParam("countries", c.slug)}
                label={`${c.name} (${c.count})`}
              />
            ))}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Subject / Field">
        <Input
          placeholder="Search subjects..."
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {subjects
            .filter((s) => s.name.toLowerCase().includes(subjectSearch.toLowerCase()))
            .map((s) => (
              <CheckboxRow
                key={s.slug}
                id={`subject-${s.slug}`}
                checked={isChecked("subjects", s.slug)}
                onCheckedChange={() => toggleListParam("subjects", s.slug)}
                label={`${s.name} (${s.count})`}
              />
            ))}
        </div>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Eligible Nationality">
        <Select value={current.get("nationality") ?? "all"} onValueChange={(v) => setSingleParam("nationality", v === "all" ? null : v)}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="All International Students" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All International Students</SelectItem>
            <SelectItem value="bangladesh">Bangladesh</SelectItem>
            <SelectItem value="india">India</SelectItem>
            <SelectItem value="pakistan">Pakistan</SelectItem>
            <SelectItem value="nepal">Nepal</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <Separator />

      <FilterGroup title="Minimum GPA (yours)">
        <Input
          type="number"
          step="0.1"
          min="0"
          max="4"
          placeholder="e.g. 3.2"
          defaultValue={current.get("minGpa") ?? ""}
          onBlur={(e) => setSingleParam("minGpa", e.target.value || null)}
          className="h-9"
        />
        <p className="mt-1 text-xs text-muted-foreground">Shows scholarships whose minimum GPA requirement you meet.</p>
      </FilterGroup>
    </aside>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function CheckboxRow({
  id,
  checked,
  onCheckedChange,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="cursor-pointer text-sm font-normal text-muted-foreground">
        {label}
      </Label>
    </div>
  );
}
