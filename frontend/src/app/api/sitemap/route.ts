import { NextResponse } from "next/server";

const SITEMAP_PAGE_SIZE = 1000;

function getBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://mediresponse.org/24jobsalert").replace(/\/$/, "");
}

function getApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
}

async function getJobsTotal(): Promise<number> {
  try {
    const res = await fetch(`${getApiBase()}/api/jobs?page=1&page_size=1`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return 0;
    const data = (await res.json()) as { total?: number };
    return data.total ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const base = getBase();
  const total = await getJobsTotal();
  const postPages = total > 0 ? Math.ceil(total / SITEMAP_PAGE_SIZE) : 0;
  const now = new Date().toISOString();

  const entries: string[] = [
    `  <sitemap><loc>${base}/page-sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>`,
  ];
  for (let i = 1; i <= postPages; i++) {
    const suffix = i === 1 ? "" : String(i);
    entries.push(
      `  <sitemap><loc>${base}/post-sitemap${suffix}.xml</loc><lastmod>${now}</lastmod></sitemap>`
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
