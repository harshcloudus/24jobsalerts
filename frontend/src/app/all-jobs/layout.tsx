import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

const title = "All Government Jobs in India";
const description =
  "Browse every government job notification listed on 24JobsAlerts — central, state, banking, defence, railway, teaching and more, with eligibility and direct apply links.";
const canonical = `${siteUrl()}/all-jobs`;
const ogImage = `${siteUrl()}/og-default.png`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  keywords: [
    "all government jobs",
    "sarkari naukri",
    "central government jobs",
    "state government jobs",
    "psu jobs",
    "free job alert",
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

export default function AllJobsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
