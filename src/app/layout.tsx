import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ScholarHub — Find Scholarships That Fund Your Future",
    template: "%s | ScholarHub",
  },
  description:
    "Discover, compare, and track fully funded scholarships, fellowships, and study-abroad opportunities from universities, governments, and organizations worldwide.",
  openGraph: {
    type: "website",
    siteName: "ScholarHub",
    title: "ScholarHub — Find Scholarships That Fund Your Future",
    description:
      "Discover, compare, and track fully funded scholarships, fellowships, and study-abroad opportunities worldwide.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScholarHub — Find Scholarships That Fund Your Future",
    description: "Discover, compare, and track fully funded scholarships worldwide.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}>
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
