import type { Metadata } from "next";
import {
  buildKeywords,
  buildMetaDescription,
  canonicalForJob,
  parseHiringOrgName,
  siteUrl,
  trimToLen,
  type JobLike,
} from "@/lib/seo";

function parseJobIdFromSlug(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const num = Number(last);
  return Number.isNaN(num) ? null : num;
}

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: slug } = await params;
  const numId = parseJobIdFromSlug(slug);
  if (numId === null) {
    return { title: "Job" };
  }

  let job: JobLike | null = null;
  try {
    const res = await fetch(`${apiBase()}/api/jobs/${numId}`, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      job = (await res.json()) as JobLike;
    }
  } catch {
    /* network/API failure — fall through to minimal metadata */
  }

  if (!job) {
    return { title: "Job not found" };
  }

  const rawTitle = (job.title || "").trim() || "Job details";
  const title = trimToLen(rawTitle, 72);
  const description = buildMetaDescription(job);
  const keywords = buildKeywords(job);
  const canonical = canonicalForJob(slug);
  const ogImage = `${siteUrl()}/og-default.png`;

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "24jobsalerts",
      type: "article",
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: "24jobsalerts" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    other: {
      "article:section": parseHiringOrgName(job),
    },
  };
}

export default function JobDetailLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
