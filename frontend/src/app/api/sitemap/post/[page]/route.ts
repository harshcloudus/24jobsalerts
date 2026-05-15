import { NextResponse } from "next/server";

const SITEMAP_PAGE_SIZE = 1000;
const API_PAGE_SIZE = 100;
const API_PAGES_PER_SITEMAP = SITEMAP_PAGE_SIZE / API_PAGE_SIZE;

interface ApiJobsResponse {
  items: Array<{ id: number; title: string; posted_date?: string | null }>;
  total: number;
}

function slugify(title: string, id: number): string {
  const slug = (title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug ? `${slug}-${id}` : String(id);
}

function safeIsoDate(value: string | null | undefined): string {
  if (value) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const { page: pageStr } = await params;
  const page = Math.max(1, parseInt(pageStr, 10) || 1);

  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://mediresponse.org/24jobsalert"
  ).replace(/\/$/, "");
  const apiBase = (
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  ).replace(/\/$/, "");

  const apiPageStart = (page - 1) * API_PAGES_PER_SITEMAP + 1;
  const apiPageEnd = page * API_PAGES_PER_SITEMAP;

  const urls: string[] = [];
  try {
    for (let p = apiPageStart; p <= apiPageEnd; p++) {
      const res = await fetch(
        `${apiBase}/api/jobs?page=${p}&page_size=${API_PAGE_SIZE}`,
        { next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const data = (await res.json()) as ApiJobsResponse;
      if (!data.items || data.items.length === 0) break;
      for (const job of data.items) {
        const slug = slugify(job.title, job.id);
        const lastmod = safeIsoDate(job.posted_date);
        urls.push(
          `  <url><loc>${base}/jobs/${slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`
        );
      }
      if (data.items.length < API_PAGE_SIZE) break;
    }
  } catch {
    /* API offline — return whatever was collected so the route stays valid */
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
