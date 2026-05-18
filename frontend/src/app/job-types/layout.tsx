import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

const title = "Jobs by Type — Permanent, Contract, Internship, Apprentice";
const description =
  "Government job openings filtered by employment type — permanent, contract, apprenticeship, internship and walk-in interviews across India.";
const canonical = `${siteUrl()}/job-types`;
const ogImage = `${siteUrl()}/og-default.png`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: [
    "permanent government jobs",
    "contract jobs",
    "apprenticeship",
    "internship",
    "walk-in interview",
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

export default function JobTypesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
