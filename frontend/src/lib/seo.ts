export interface JobLike {
  id: number;
  title: string;
  intro_text?: string | null;
  qualification?: string | null;
  job_type?: string | null;
  category?: string | null;
  salary?: string | null;
  posted_date?: string | null;
  last_date?: string | null;
  last_date_text?: string | null;
  official_site?: string | null;
  url?: string | null;
}

export type JobTableCell =
  | string
  | number
  | null
  | { text?: string | null; href?: string | null };

export interface JobTable {
  heading?: string | null;
  name?: string | null;
  columns: string[];
  rows: JobTableCell[][];
}

export interface Job extends JobLike {
  tables_json?: JobTable[] | null;
  requirement_text?: string | null;
  eligibility_text?: string | null;
  official_site_text?: string | null;
  application_fee?: string | null;
  selection_process?: string | null;
  apply_text?: string | null;
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://mediresponse.org/24jobsalert").replace(/\/$/, "");
}

export function canonicalForJob(slug: string): string {
  return `${siteUrl()}/jobs/${slug}`;
}

export function trimToLen(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

export function parseHiringOrgName(job: JobLike): string {
  const m = job.title?.match(/\b[A-Z]{3,6}\b/);
  if (m) return m[0];
  if (job.official_site) {
    try {
      return new URL(job.official_site).hostname.replace(/^www\./, "");
    } catch {
      /* ignore */
    }
  }
  return "24JobsAlerts";
}

export function buildMetaDescription(job: JobLike): string {
  const intro = (job.intro_text || "").replace(/\s+/g, " ").trim();
  if (intro.length >= 60) return trimToLen(intro, 155);

  const parts: string[] = [];
  parts.push(`Apply online for ${job.title}.`);
  if (job.last_date) parts.push(`Last date ${job.last_date}.`);
  if (job.qualification) parts.push(`Eligibility: ${job.qualification}.`);
  parts.push("Latest government job notification on 24JobsAlerts.");
  return trimToLen(parts.join(" "), 155);
}

export function buildKeywords(job: JobLike): string[] {
  const org = parseHiringOrgName(job).toLowerCase();
  const raw = [
    job.title?.toLowerCase(),
    job.qualification?.toLowerCase(),
    job.job_type?.toLowerCase(),
    job.category?.toLowerCase(),
    org,
    `${org} recruitment 2026`,
    "sarkari naukri",
    "government job 2026",
    "free job alert",
    "latest jobs 2026",
    "24JobsAlerts",
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
  return Array.from(new Set(raw)).slice(0, 12);
}

function mapEmploymentType(t?: string | null): string {
  const s = (t || "").toLowerCase();
  if (s.includes("intern")) return "INTERN";
  if (s.includes("contract")) return "CONTRACTOR";
  if (s.includes("part")) return "PART_TIME";
  if (s.includes("temp")) return "TEMPORARY";
  return "FULL_TIME";
}

function introToHtml(intro: string): string {
  const safe = intro
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paragraphs = safe.split(/\n\n+/).map((p) => p.replace(/\n/g, "<br>"));
  return paragraphs.map((p) => `<p>${p}</p>`).join("");
}

export function buildJobPostingJsonLd(
  job: JobLike,
  slug: string,
): Record<string, unknown> {
  const datePosted = job.posted_date || new Date().toISOString().slice(0, 10);
  const descHtml = job.intro_text && job.intro_text.trim().length > 0
    ? introToHtml(job.intro_text.trim())
    : `<p>${job.title}. Apply on the official website.</p>`;

  const org = parseHiringOrgName(job);
  const node: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: descHtml,
    datePosted,
    employmentType: mapEmploymentType(job.job_type),
    hiringOrganization: {
      "@type": "Organization",
      name: org,
      sameAs: job.official_site || siteUrl(),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
    url: canonicalForJob(slug),
    identifier: {
      "@type": "PropertyValue",
      name: org,
      value: String(job.id),
    },
    occupationalCategory: job.category || "Government Job",
    directApply: false,
  };

  if (job.qualification) node.qualifications = job.qualification;
  if (job.last_date) node.validThrough = job.last_date;

  return node;
}

export function buildBreadcrumbJsonLd(
  job: JobLike,
  slug: string,
): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
      { "@type": "ListItem", position: 2, name: "Jobs", item: `${base}/latest-jobs` },
      { "@type": "ListItem", position: 3, name: job.title, item: `${base}/jobs/${slug}` },
    ],
  };
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org/",
    "@type": "Organization",
    name: "24JobsAlerts",
    url: base,
    logo: `${base}/24jobsalerts_logo.png`,
    sameAs: [base],
    description:
      "24JobsAlerts publishes the latest Indian government job notifications with eligibility, last date, and direct apply links.",
  };
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
  const base = siteUrl();
  return {
    "@context": "https://schema.org/",
    "@type": "WebSite",
    name: "24JobsAlerts",
    url: base,
    potentialAction: {
      "@type": "SearchAction",
      target: `${base}/all-jobs?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
