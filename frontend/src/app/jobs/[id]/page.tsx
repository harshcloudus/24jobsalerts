import Link from "@/app/components/HardLink";
import { notFound } from "next/navigation";
import React from "react";
import AdSenseDisplay from "../../components/AdSenseDisplay";
import SaveJobButton from "./SaveJobButton";
import {
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  type Job,
  type JobLike,
  type JobTable,
  type JobTableCell,
} from "@/lib/seo";

export const revalidate = 300;

function parseNumericId(slug: string): number | null {
  const parts = slug.split("-");
  const last = parts[parts.length - 1];
  const num = Number(last);
  return Number.isNaN(num) ? null : num;
}

function apiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
}

async function fetchJob(numId: number): Promise<Job | null> {
  try {
    const res = await fetch(`${apiBase()}/api/jobs/${numId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Job;
  } catch {
    return null;
  }
}

const linkClass = "text-primary hover:underline font-medium break-words";

const normalizeText = (s: string) =>
  s.replace(/ /g, " ").replace(/\s+/g, " ").trim();

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);
const isDomain = (s: string) =>
  /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}(?:\/[\w\-./?&=#%]*)?$/i.test(
    s
  );
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const ctaPattern =
  /^(apply now|click here|apply online|apply offline|register now|register here|apply here|download(?:\s+(?:notification|pdf|form|the notification|notification pdf))?|notification|view notification|official notification|application form|download form|view details|check here|get details|here|view here|read more|details here|click to apply|apply|link|view link)$/i;

const toAbsoluteUrl = (raw: string) => {
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^mailto:|^tel:/i.test(raw)) return raw;
  return `https://${raw.replace(/^www\./i, "")}`;
};

const truncateForDisplay = (url: string, max = 50) =>
  url.length <= max ? url : `${url.slice(0, max - 1)}…`;

function linkifyText(text?: string | null): React.ReactNode {
  if (!text) return text;
  const urlRegex = /(https?:\/\/[^\s<>"')]+)/gi;
  const trailingPunct = /[.,;:!?]+$/;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    let url = match[0];
    let tail = "";
    const punctMatch = url.match(trailingPunct);
    if (punctMatch) {
      tail = punctMatch[0];
      url = url.slice(0, url.length - tail.length);
    }
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        title={url}
      >
        {truncateForDisplay(url)}
      </a>
    );
    if (tail) parts.push(tail);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? <>{parts}</> : text;
}

function renderCellContent(
  cell: unknown,
  fallbackUrl?: string | null,
  forceLink: boolean = false
): React.ReactNode {
  // Forward-compatible: support { text, href } objects from updated scrapers.
  // Only render as a clickable link inside "Important Links" tables (forceLink),
  // so regular data cells like Post Name / Salary stay as plain text even when
  // the scraper happened to capture an href on them.
  if (cell && typeof cell === "object" && "text" in (cell as Record<string, unknown>)) {
    const obj = cell as { text?: string; href?: string | null };
    const text = normalizeText(String(obj.text ?? ""));
    const href = obj.href && typeof obj.href === "string" ? obj.href.trim() : "";
    if (text && href && forceLink) {
      return (
        <a
          href={toAbsoluteUrl(href)}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {text}
        </a>
      );
    }
    return renderCellContent(text, fallbackUrl, forceLink);
  }

  if (typeof cell !== "string") return (cell as React.ReactNode) ?? "";
  const trimmed = normalizeText(cell);
  if (!trimmed) return cell;

  if (isUrl(trimmed)) {
    return (
      <a href={trimmed} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {trimmed}
      </a>
    );
  }

  if (isDomain(trimmed)) {
    return (
      <a
        href={toAbsoluteUrl(trimmed)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {trimmed}
      </a>
    );
  }

  if (isEmail(trimmed)) {
    return (
      <a href={`mailto:${trimmed}`} className={linkClass}>
        {trimmed}
      </a>
    );
  }

  if (fallbackUrl && (ctaPattern.test(trimmed) || forceLink)) {
    return (
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {trimmed}
      </a>
    );
  }

  return cell;
}

const isImportantLinksTable = (heading?: string | null) =>
  !!heading && /important\s*links?/i.test(heading);

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = await params;
  const numId = parseNumericId(slug);
  if (numId === null) notFound();

  const job = await fetchJob(numId);
  if (!job) notFound();

  const tables: JobTable[] = job.tables_json || [];

  const categoryLabel =
    job.category === "structured_job"
      ? "Job"
      : job.category === "article"
      ? "Article"
      : job.category || "Job";

  const jobLike: JobLike = job as JobLike;
  const jobPostingLd = buildJobPostingJsonLd(jobLike, slug);
  const breadcrumbLd = buildBreadcrumbJsonLd(jobLike, slug);

  return (
    <div className="bg-canvas">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          {/* Breadcrumb */}
          <nav className="mb-5 sm:mb-6 flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-on-dark-muted min-w-0">
            <Link href="/" className="hover:text-on-dark transition-colors shrink-0">
              Home
            </Link>
            <span className="material-symbols-rounded opacity-60 shrink-0" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <Link href="/latest-jobs" className="hover:text-on-dark transition-colors shrink-0">
              Jobs
            </Link>
            <span className="material-symbols-rounded opacity-60 shrink-0" style={{ fontSize: "14px" }}>
              chevron_right
            </span>
            <span className="text-on-dark/80 truncate max-w-[20ch] sm:max-w-[40ch] min-w-0">
              {job.title}
            </span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="badge-orange">{categoryLabel}</span>
            {job.posted_date && (
              <span className="inline-flex items-center gap-1.5 text-xs text-on-dark-muted">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: "16px" }}
                >
                  calendar_today
                </span>
                Posted {job.posted_date}
              </span>
            )}
            {job.last_date && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: "16px" }}
                >
                  event_busy
                </span>
                Apply by {job.last_date}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-semibold tracking-[-0.02em] text-on-dark leading-[1.15] mb-5 sm:mb-6 break-words">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-on-dark-muted">
            {job.job_type && (
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-rounded text-primary"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  work
                </span>
                <span>{job.job_type}</span>
              </div>
            )}
            {job.qualification && (
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-rounded text-primary"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  school
                </span>
                <span>{job.qualification}</span>
              </div>
            )}
            {job.salary && (
              <div className="flex items-center gap-2">
                <span
                  className="material-symbols-rounded text-primary"
                  style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
                >
                  payments
                </span>
                <span>{job.salary}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
            {/* Intro */}
            {job.intro_text && (
              <section className="card-base p-5 sm:p-6 lg:p-8">
                <h3 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
                  <span
                    className="material-symbols-rounded text-primary"
                    style={{ fontSize: "20px" }}
                  >
                    description
                  </span>
                  Job description
                </h3>
                <p className="text-text-body leading-relaxed">{linkifyText(job.intro_text)}</p>
              </section>
            )}

            {/* Dynamic tables */}
            {tables.map((table: JobTable, tIdx: number) => {
              const importantLinks = isImportantLinksTable(table.heading);
              // For "Important Links" tables, the scraper stores the first
              // link-pair row inside `columns` (the table on the source page
              // has no real headers — just pairs of label/link cells). Treat
              // the columns as an additional data row so its cells run through
              // renderCellContent and become clickable like the rest.
              const bodyRows: JobTableCell[][] = importantLinks
                ? [table.columns as JobTableCell[], ...table.rows]
                : table.rows;
              const showHeader = !importantLinks;
              return (
              <section
                key={tIdx}
                className="card-base overflow-hidden"
              >
                {table.heading && (
                  <div className="bg-ink text-on-dark px-4 sm:px-6 py-3 sm:py-3.5 text-sm font-semibold tracking-tight break-words">
                    {table.heading.toLowerCase().includes("eligibility")
                      ? "Eligibility / Requirement details"
                      : table.heading}
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  {table.name && table.name !== table.heading && (
                    <h4 className="font-semibold text-ink mb-3 text-base">
                      {table.name}
                    </h4>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      {showHeader && (
                        <thead>
                          <tr>
                            {table.columns.map((col: string, cIdx: number) => (
                              <th
                                key={cIdx}
                                className="border-b border-hairline-strong bg-surface px-4 py-3 text-left font-semibold text-ink text-[13px] tracking-tight whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody>
                        {bodyRows.map((row: JobTableCell[], rIdx: number) => {
                          const linkColIdx = row.length - 1;
                          return (
                          <tr
                            key={rIdx}
                            className="border-b border-hairline-soft last:border-b-0"
                          >
                            {row.map((cell: JobTableCell, dIdx: number) => (
                              <td
                                key={dIdx}
                                className="px-4 py-3 text-text-body align-top whitespace-nowrap"
                              >
                                {renderCellContent(
                                  cell,
                                  job.official_site || job.url,
                                  importantLinks && dIdx === linkColIdx && row.length > 1
                                )}
                              </td>
                            ))}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {table.heading &&
                    table.heading.toLowerCase().includes("eligibility") &&
                    (job.requirement_text || job.eligibility_text) && (
                      <div className="mt-4 space-y-2 text-sm text-text-body leading-relaxed">
                        {job.requirement_text && <p>{job.requirement_text}</p>}
                        {job.eligibility_text && <p>{job.eligibility_text}</p>}
                      </div>
                    )}

                  {table.heading &&
                    table.heading.toLowerCase().includes("how to apply") &&
                    job.official_site_text && (
                      <div className="mt-4 text-sm text-text-body leading-relaxed">
                        <p>{linkifyText(job.official_site_text)}</p>
                      </div>
                    )}
                </div>
              </section>
              );
            })}

            {(job.selection_process || job.application_fee) && (
              <AdSenseDisplay variant="inline" />
            )}

            {(job.selection_process || job.application_fee) && (
              <section className="card-base p-5 sm:p-6 lg:p-8 space-y-6">
                {job.application_fee && (
                  <div>
                    <h3 className="text-lg font-semibold text-ink mb-2 flex items-center gap-2">
                      <span
                        className="material-symbols-rounded text-primary"
                        style={{ fontSize: "20px" }}
                      >
                        payments
                      </span>
                      Application fee
                    </h3>
                    <p className="text-text-body leading-relaxed">{job.application_fee}</p>
                  </div>
                )}
                {job.selection_process && (
                  <div>
                    <h3 className="text-lg font-semibold text-ink mb-2 flex items-center gap-2">
                      <span
                        className="material-symbols-rounded text-primary"
                        style={{ fontSize: "20px" }}
                      >
                        dynamic_form
                      </span>
                      Selection process
                    </h3>
                    <p className="text-text-body leading-relaxed">{job.selection_process}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 min-w-0">
            <div className="sticky-sidebar lg:sticky lg:top-24 space-y-5">
              {/* Apply actions */}
              <div className="card-base p-5 sm:p-6">
                <h4 className="text-sm font-semibold tracking-[0.10em] text-text-subtle uppercase mb-4">
                  Quick actions
                </h4>
                <div className="space-y-3">
                  {job.official_site && (
                    <a
                      href={job.official_site}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full justify-center"
                    >
                      Official website
                      <span
                        className="material-symbols-rounded"
                        style={{ fontSize: "16px" }}
                      >
                        open_in_new
                      </span>
                    </a>
                  )}

                  <SaveJobButton jobId={numId} />

                  {job.apply_text && (
                    <div className="mt-2 p-4 bg-surface border border-hairline rounded-lg text-xs text-text-body leading-relaxed">
                      {linkifyText(job.apply_text)}
                    </div>
                  )}
                </div>
              </div>

              {/* Last date */}
              <div className="card-base p-5 sm:p-6 bg-surface-feat border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="material-symbols-rounded text-primary"
                    style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
                  >
                    event_busy
                  </span>
                  <h4 className="text-sm font-semibold tracking-[0.10em] text-primary-deep uppercase">
                    Last date
                  </h4>
                </div>
                {job.last_date_text ? (
                  <p className="text-sm text-text-body leading-relaxed">
                    {linkifyText(job.last_date_text)}
                  </p>
                ) : job.last_date ? (
                  <p className="text-base font-semibold text-ink">{job.last_date}</p>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    No data found for last date.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
