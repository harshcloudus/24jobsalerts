import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(
    /\/$/,
    "",
  );
}

async function resolveTypeFromSlug(slug: string): Promise<string | null> {
  try {
    const res = await fetch(`${apiBase()}/api/filters`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const types: string[] = data.job_types || [];
    return types.find((t) => slugify(t) === slug) || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveTypeFromSlug(slug);
  const base = siteUrl();
  const canonical = `${base}/job-types/${slug}/`;
  const ogImage = `${base}/og-default.png`;

  if (!resolved) {
    return {
      title: "Sector not found",
      alternates: { canonical },
    };
  }

  const title = `${resolved} Jobs — Latest Openings`;
  const description = `Browse the latest ${resolved} openings on 24JobsAlerts with eligibility, last date, and direct apply links.`;

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      `${resolved.toLowerCase()} jobs`,
      `${resolved.toLowerCase()} recruitment 2026`,
      "sarkari naukri",
      "government job",
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
}

export default function JobTypeDetailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
