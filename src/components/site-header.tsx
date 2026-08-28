import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";

const NAV_LINKS = [
  { href: "/scholarships", label: "Browse" },
  { href: "/scholarships/fully-funded", label: "Fully Funded" },
  { href: "/scholarships/closing-soon", label: "Closing Soon" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <span className="text-lg">ScholarHub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/scholarships/saved"
            className="rounded-md border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Saved
          </Link>
        </div>

        <MobileNav />
      </div>
    </header>
  );
}
