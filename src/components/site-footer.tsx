import Link from "next/link";
import { GraduationCap } from "lucide-react";

const COLUMNS = [
  {
    title: "Browse",
    links: [
      { href: "/scholarships/fully-funded", label: "Fully Funded" },
      { href: "/scholarships/masters", label: "Master's" },
      { href: "/scholarships/phd", label: "PhD" },
      { href: "/scholarships/bachelors", label: "Bachelor's" },
      { href: "/scholarships/closing-soon", label: "Closing Soon" },
    ],
  },
  {
    title: "Destinations",
    links: [
      { href: "/countries/japan", label: "Japan" },
      { href: "/countries/united-kingdom", label: "United Kingdom" },
      { href: "/countries/germany", label: "Germany" },
      { href: "/countries/canada", label: "Canada" },
      { href: "/countries/united-states", label: "United States" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </span>
              ScholarHub
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              We aggregate, verify, and organize scholarship opportunities from universities, governments, and
              organizations worldwide — you always apply through the official source.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ScholarHub. Scholarship data is aggregated from third-party sources for
          discovery purposes — always confirm details on the official provider website before applying.
        </div>
      </div>
    </footer>
  );
}
