import { NextResponse } from "next/server";

type ChangeFreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

const STATIC_ENTRIES: { path: string; freq: ChangeFreq; pr: number }[] = [
  { path: "/", freq: "daily", pr: 1 },
  { path: "/latest-jobs/", freq: "daily", pr: 0.9 },
  { path: "/all-jobs/", freq: "daily", pr: 0.9 },
  { path: "/qualifications/", freq: "weekly", pr: 0.7 },
  { path: "/job-types/", freq: "weekly", pr: 0.7 },
  { path: "/about-us/", freq: "yearly", pr: 0.4 },
  { path: "/contact-us/", freq: "yearly", pr: 0.4 },
  { path: "/privacy-policy/", freq: "yearly", pr: 0.3 },
  { path: "/terms-and-conditions/", freq: "yearly", pr: 0.3 },
  { path: "/disclaimer/", freq: "yearly", pr: 0.3 },
];

export async function GET() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://mediresponse.org/24jobsalert"
  ).replace(/\/$/, "");
  const now = new Date().toISOString();

  const urls = STATIC_ENTRIES.map(
    (s) =>
      `  <url><loc>${base}${s.path}</loc><lastmod>${now}</lastmod><changefreq>${s.freq}</changefreq><priority>${s.pr}</priority></url>`
  ).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
