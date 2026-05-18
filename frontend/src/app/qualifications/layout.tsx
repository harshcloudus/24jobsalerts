import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

const title = "Jobs by Qualification — 10th, 12th, Graduate, Diploma, Engineering";
const description =
  "Find Indian government jobs that match your qualification — 10th pass, 12th pass, graduate, post-graduate, ITI, diploma and engineering openings.";
const canonical = `${siteUrl()}/qualifications`;
const ogImage = `${siteUrl()}/og-default.png`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: [
    "10th pass government jobs",
    "12th pass government jobs",
    "graduate jobs",
    "post graduate jobs",
    "diploma jobs",
    "iti jobs",
    "engineering jobs",
    "sarkari naukri",
    "24JobsAlerts",
  ],
  openGraph: {
    title,
    description,
    url: canonical,
    siteName: "24JobsAlerts",
    type: "website",
    locale: "en_IN",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "24JobsAlerts" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function QualificationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
