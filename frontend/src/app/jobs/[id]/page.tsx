"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AdSenseDisplay from "../../components/AdSenseDisplay";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";
import {
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  type JobLike,
} from "@/lib/seo";

export default function JobDetailPage() {
  const { id } = useParams();
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");

  const [job, setJob] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseNumericId = () => {
    if (!id) return null;
    const raw = Array.isArray(id) ? id[0] : (id as string);
    const parts = raw.split("-");
    const last = parts[parts.length - 1];
    const num = Number(last);
    return Number.isNaN(num) ? null : num;
  };

  // Always open a job from the top of the page — instant jump, not smooth.
  // Runs synchronously after mount (and on id change) so the page never appears
  // mid-scroll when the user clicks into a job.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prev;
  }, [id]);

  useEffect(() => {
    const numId = parseNumericId();
    if (numId === null) return;
    async function fetchJobDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${numId}`);
        if (!res.ok) throw new Error("Job not found");
        const data = await res.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    const numId = parseNumericId();
    if (numId === null) return;
    if (typeof document === "undefined") return;
    const key = "saved_job_ids";
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
    if (!match) {
      setIsSaved(false);
      return;
    }
    try {
      const val = decodeURIComponent(match.split("=")[1]);
      const arr = JSON.parse(val);
      if (Array.isArray(arr) && arr.map((v) => Number(v)).includes(numId)) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    } catch {
      setIsSaved(false);
    }
  }, [id]);

  const toggleSave = () => {
    const numId = parseNumericId();
    if (numId === null || typeof document === "undefined") return;
    const key = "saved_job_ids";
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
    let arr: number[] = [];
    if (match) {
      try {
        const val = decodeURIComponent(match.split("=")[1]);
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          arr = parsed.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        }
      } catch {
        arr = [];
      }
    }
    if (arr.includes(numId)) {
      arr = arr.filter((n) => n !== numId);
      setIsSaved(false);
    } else {
      arr.push(numId);
      setIsSaved(true);
    }
    const encoded = encodeURIComponent(JSON.stringify(arr));
    document.cookie = `${key}=${encoded}; path=/; max-age=${60 * 60 * 24 * 30}`;
    notifySavedJobsCookieChanged();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-canvas">
        <div className="text-text-muted text-sm">Loading job details…</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-canvas p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mb-4">
          <span className="material-symbols-rounded text-text-muted" style={{ fontSize: "28px" }}>
            search_off
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mb-2">Job not found</h1>
        <p className="text-text-body mb-6 max-w-md">
          This job listing may have been removed or the link is broken.
        </p>
        <Link href="/latest-jobs" className="btn-primary">
          Back to listings
        </Link>
      </div>
    );
  }

  const tables = job.tables_json || [];

  const renderCellContent = (cell: string, fallbackUrl?: string | null) => {
    if (typeof cell !== "string" || !cell.trim()) return cell;
    const trimmed = cell.trim();

    const linkClass = "text-primary hover:underline font-medium";

    if (/^https?:\/\/\S+$/i.test(trimmed)) {
      return (
        <a href={trimmed} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {trimmed}
        </a>
      );
    }

    if (/^(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(trimmed) && /\.[a-zA-Z]{2,}$/.test(trimmed)) {
      const url = trimmed.startsWith("http")
        ? trimmed
        : `https://${trimmed.replace(/^www\./i, "")}`;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {trimmed}
        </a>
      );
    }

    const ctaPattern = /^(apply now|click here|apply online|register now|register here|apply here|download(?: notification| pdf| form)?|notification|view notification|official notification|application form|download form|view details|check here|get details)$/i;
    if (fallbackUrl && ctaPattern.test(trimmed)) {
      return (
        <a href={fallbackUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {trimmed}
        </a>
      );
    }

    return cell;
  };

  const categoryLabel =
    job.category === "structured_job"
      ? "Job"
      : job.category === "article"
      ? "Article"
      : job.category || "Job";

  const slugStr = Array.isArray(id) ? id[0] : (id as string);
  const jobLike: JobLike = job as JobLike;
  const jobPostingLd = buildJobPostingJsonLd(jobLike, slugStr);
  const breadcrumbLd = buildBreadcrumbJsonLd(jobLike, slugStr);

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
                <p className="text-text-body leading-relaxed">{job.intro_text}</p>
              </section>
            )}

            {/* Dynamic tables */}
            {tables.map((table: any, tIdx: number) => (
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
                      <thead>
                        <tr>
                          {table.columns.map((col: string, cIdx: number) => (
                            <th
                              key={cIdx}
                              className="border-b border-hairline-strong bg-surface px-4 py-3 text-left font-semibold text-ink text-[13px] tracking-tight"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row: string[], rIdx: number) => (
                          <tr
                            key={rIdx}
                            className="border-b border-hairline-soft last:border-b-0"
                          >
                            {row.map((cell: string, dIdx: number) => (
                              <td
                                key={dIdx}
                                className="px-4 py-3 text-text-body align-top"
                              >
                                {renderCellContent(cell, job.official_site)}
                              </td>
                            ))}
                          </tr>
                        ))}
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
                        <p>{job.official_site_text}</p>
                      </div>
                    )}
                </div>
              </section>
            ))}

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

                  <button
                    type="button"
                    onClick={toggleSave}
                    className={`btn-outline w-full justify-center ${
                      isSaved ? "bg-primary-light border-primary text-primary" : ""
                    }`}
                  >
                    <span
                      className="material-symbols-rounded"
                      style={{
                        fontSize: "16px",
                        fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      bookmark
                    </span>
                    {isSaved ? "Saved" : "Save for later"}
                  </button>

                  {job.apply_text && (
                    <div className="mt-2 p-4 bg-surface border border-hairline rounded-lg text-xs text-text-body leading-relaxed">
                      {job.apply_text}
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
                    {job.last_date_text}
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
