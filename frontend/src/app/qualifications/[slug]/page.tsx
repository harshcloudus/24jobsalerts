"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/app/components/HardLink";
import JobCard from "../../components/JobCard";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";
import { sortJobTypes } from "@/lib/jobTypeIcons";
import type { Job } from "@/lib/seo";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const makeComboLabel = (qual: string, type: string): string => {
  const simplified = type
    .replace(/\s+job$/i, "")
    .replace(/^government\s+/i, "")
    .trim();
  return `${qual} ${simplified} Jobs`;
};

function QualificationDetailContent() {
  const API_BASE = (
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  ).replace(/\/$/, "");
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [resolvedQual, setResolvedQual] = useState<string>("");
  const [unknownQual, setUnknownQual] = useState(false);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingQual, setLoadingQual] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const cookieKey = "saved_job_ids";

  const readSavedIdsFromCookie = () => {
    if (typeof document === "undefined") return [];
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${cookieKey}=`));
    if (!match) return [];
    try {
      const val = decodeURIComponent(match.split("=")[1]);
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed
          .map((v: unknown) => Number(v))
          .filter((n: number) => !Number.isNaN(n));
      }
      return [];
    } catch {
      return [];
    }
  };

  const toggleSaved = (id: number) => {
    if (typeof document === "undefined") return;
    let ids = readSavedIdsFromCookie();
    if (ids.includes(id)) {
      ids = ids.filter((n) => n !== id);
    } else {
      ids = [...ids, id];
    }
    const encoded = encodeURIComponent(JSON.stringify(ids));
    document.cookie = `${cookieKey}=${encoded}; path=/; max-age=${60 * 60 * 24 * 30}`;
    setSavedIds(ids);
    notifySavedJobsCookieChanged();
  };

  useEffect(() => {
    async function resolveQual() {
      setLoadingQual(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const quals: string[] = data.qualifications || [];
        setJobTypes(sortJobTypes(data.job_types || []));
        const match = quals.find((q) => slugify(q) === slug);
        if (match) {
          setResolvedQual(match);
          setUnknownQual(false);
        } else {
          setUnknownQual(true);
        }
      } catch (err) {
        console.error(err);
        setUnknownQual(true);
      } finally {
        setLoadingQual(false);
      }
    }
    resolveQual();
    setSavedIds(readSavedIdsFromCookie());
  }, [slug]);

  const fetchJobs = async (qual: string, page: number) => {
    if (!qual) return;
    setLoadingJobs(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("page_size", String(pageSize));
      sp.set("qualification", qual);
      const res = await fetch(`${API_BASE}/api/jobs?${sp.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setTotalItems(data.total || 0);
      setJobs(data.items || []);
    } catch (err) {
      console.error(err);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (resolvedQual) {
      fetchJobs(resolvedQual, 1);
      setCurrentPage(1);
    }
  }, [resolvedQual]);

  useEffect(() => {
    if (typeof window !== "undefined" && currentPage > 1 && topRef.current) {
      const offset =
        topRef.current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [currentPage]);

  const displayName =
    resolvedQual || (unknownQual ? "Unknown qualification" : "Loading…");

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-3">
              <Link
                href="/qualifications"
                className="inline-flex items-center gap-1 text-sm text-on-dark-muted hover:text-on-dark transition-colors"
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: "18px" }}
                >
                  arrow_back
                </span>
                All qualifications
              </Link>
            </div>
            <div
              className="section-eyebrow"
              style={{ color: "var(--color-primary)" }}
            >
              Qualification
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3 break-words">
              {displayName}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-dark-muted">
              {loadingQual
                ? "Loading qualification…"
                : unknownQual
                  ? "This qualification could not be found."
                  : `${totalItems.toLocaleString()} ${totalItems === 1 ? "opening" : "openings"} matching ${resolvedQual}.`}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div ref={topRef} />

        {unknownQual ? (
          <div className="card-base text-center py-16 text-text-muted">
            <div className="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
              <span
                className="material-symbols-rounded text-text-muted"
                style={{ fontSize: "22px" }}
              >
                search_off
              </span>
            </div>
            <p className="font-medium text-ink mb-1">Qualification not found</p>
            <p className="text-sm mb-5">
              We couldn&apos;t find a qualification that matches this URL.
            </p>
            <Link
              href="/qualifications"
              className="btn-primary inline-flex items-center gap-1 px-4 py-2"
            >
              Browse all qualifications
            </Link>
          </div>
        ) : (
          <>
            {/* Qualification + Job Type combo links */}
            {jobTypes.length > 0 && resolvedQual && (
              <div className="mb-10 sm:mb-12">
                <h2 className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">
                  Browse by sector
                </h2>
                <div className="flex flex-col gap-3">
                  {jobTypes.map((type) => (
                    <Link
                      key={type}
                      href={`/all-jobs?qualification=${encodeURIComponent(resolvedQual)}&job_type=${encodeURIComponent(type)}`}
                      className="qual-combo-btn"
                    >
                      <span className="material-symbols-rounded qual-combo-icon">
                        play_arrow
                      </span>
                      <span className="qual-combo-label">
                        {makeComboLabel(resolvedQual, type)}
                      </span>
                      <span className="material-symbols-rounded qual-combo-arrow">
                        arrow_forward
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs results heading */}
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-ink break-words">
                  {resolvedQual} jobs
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  {totalItems.toLocaleString()}{" "}
                  {totalItems === 1 ? "job" : "jobs"} matching this
                  qualification
                </p>
              </div>
            </div>

            <div className="job-grid">
              {(loadingQual || loadingJobs) && jobs.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-base p-5 space-y-3">
                    <div className="skeleton h-11 w-11 rounded-lg" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                ))
              ) : !loadingJobs && jobs.length === 0 ? (
                <div className="col-span-full card-base text-center py-16 text-text-muted">
                  <div className="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
                    <span
                      className="material-symbols-rounded text-text-muted"
                      style={{ fontSize: "22px" }}
                    >
                      search_off
                    </span>
                  </div>
                  <p className="font-medium text-ink mb-1">No jobs found</p>
                  <p className="text-sm">
                    No openings for {resolvedQual} right now.
                  </p>
                </div>
              ) : (
                jobs.map((job, idx) => (
                  <JobCard
                    key={idx}
                    job={job}
                    isSaved={savedIds.includes(job.id)}
                    onToggleSaved={toggleSaved}
                    showBookmark
                  />
                ))
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination-row mt-10 sm:mt-12 flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
                <button
                  onClick={() => {
                    if (currentPage <= 1) return;
                    const next = currentPage - 1;
                    setCurrentPage(next);
                    fetchJobs(resolvedQual, next);
                  }}
                  disabled={currentPage <= 1}
                  className="w-10 h-10 rounded-full border border-hairline-strong text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors flex items-center justify-center shrink-0"
                  aria-label="Previous page"
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: "20px" }}
                  >
                    chevron_left
                  </span>
                </button>
                <span className="px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-text-body bg-surface border border-hairline whitespace-nowrap">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => {
                    if (currentPage >= totalPages) return;
                    const next = currentPage + 1;
                    setCurrentPage(next);
                    fetchJobs(resolvedQual, next);
                  }}
                  disabled={currentPage >= totalPages}
                  className="w-10 h-10 rounded-full border border-hairline-strong text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors flex items-center justify-center shrink-0"
                  aria-label="Next page"
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: "20px" }}
                  >
                    chevron_right
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function QualificationDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-text-muted">
          Loading…
        </div>
      }
    >
      <QualificationDetailContent />
    </Suspense>
  );
}
