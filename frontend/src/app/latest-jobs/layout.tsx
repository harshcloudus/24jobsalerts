import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

const title = "Latest Government Jobs 2026";
const description =
  "Latest government job notifications updated daily — SSC, UPSC, Railway, Banking, Police, Defence and PSU recruitment with eligibility, last date and direct apply links.";
const canonical = `${siteUrl()}/latest-jobs/`;
const ogImage = `${siteUrl()}/og-default.png`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: [
    "latest government jobs 2026",
    "sarkari naukri",
    "free job alert",
    "ssc",
    "upsc",
    "railway jobs",
    "bank jobs",
    "police recruitment",
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

export default function LatestJobsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
