import type { MetadataRoute } from "next";

type ChangeFreq = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const STATIC_ENTRIES: { path: string; freq: ChangeFreq; pr: number }[] = [
  { path: "/", freq: "daily", pr: 1 },
  { path: "/latest-jobs", freq: "daily", pr: 0.9 },
  { path: "/all-jobs", freq: "daily", pr: 0.9 },
  { path: "/qualifications", freq: "weekly", pr: 0.7 },
  { path: "/job-types", freq: "weekly", pr: 0.7 },
  { path: "/about-us", freq: "yearly", pr: 0.4 },
  { path: "/contact-us", freq: "yearly", pr: 0.4 },
  { path: "/privacy-policy", freq: "yearly", pr: 0.3 },
  { path: "/terms-and-conditions", freq: "yearly", pr: 0.3 },
  { path: "/disclaimer", freq: "yearly", pr: 0.3 },
];

function slugify(title: string, id: number): string {
  const slug = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug ? `${slug}-${id}` : String(id);
}

interface ApiJobsResponse {
  items: Array<{ id: number; title: string; posted_date?: string | null }>;
  total: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://24jobsalert.dreamdazzly.com").replace(/\/$/, "");
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ENTRIES.map((s) => ({
    url: `${base}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.pr,
  }));

  const jobEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    while (page <= 200) {
      const res = await fetch(`${apiBase}/api/jobs?page=${page}&page_size=100`, {
        next: { revalidate: 3600 },
      });
      if (!res.ok) break;
      const data = (await res.json()) as ApiJobsResponse;
      for (const job of data.items) {
        const slug = slugify(job.title, job.id);
        jobEntries.push({
          url: `${base}/jobs/${slug}`,
          lastModified: job.posted_date ? new Date(job.posted_date) : now,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
      if (page * 100 >= data.total || data.items.length === 0) break;
      page += 1;
    }
  } catch {
    /* API offline at request time — return static-only sitemap so the route stays valid */
  }

  return [...staticEntries, ...jobEntries];
}
