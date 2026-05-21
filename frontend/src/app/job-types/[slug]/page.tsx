"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "@/app/components/HardLink";
import JobCard from "../../components/JobCard";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";
import { getQualificationIcon } from "@/lib/qualificationIcons";
import type { Job } from "@/lib/seo";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function JobTypeDetailContent() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || "";

  const [resolvedType, setResolvedType] = useState<string>("");
  const [unknownType, setUnknownType] = useState(false);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingType, setLoadingType] = useState(true);
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
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${cookieKey}=`));
    if (!match) return [];
    try {
      const val = decodeURIComponent(match.split("=")[1]);
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        return parsed.map((v: unknown) => Number(v)).filter((n: number) => !Number.isNaN(n));
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
    async function resolveType() {
      setLoadingType(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const types: string[] = data.job_types || [];
        setQualifications(data.qualifications || []);
        const match = types.find((t) => slugify(t) === slug);
        if (match) {
          setResolvedType(match);
          setUnknownType(false);
        } else {
          setUnknownType(true);
        }
      } catch (err) {
        console.error(err);
        setUnknownType(true);
      } finally {
        setLoadingType(false);
      }
    }
    resolveType();
    setSavedIds(readSavedIdsFromCookie());
  }, [slug]);

  const fetchJobs = async (type: string, page: number) => {
    if (!type) return;
    setLoadingJobs(true);
    try {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("page_size", String(pageSize));
      sp.set("job_type", type);
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
    if (resolvedType) {
      fetchJobs(resolvedType, 1);
      setCurrentPage(1);
    }
  }, [resolvedType]);

  useEffect(() => {
    if (typeof window !== "undefined" && currentPage > 1 && topRef.current) {
      const offset = topRef.current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [currentPage]);

  const displayName = resolvedType || (unknownType ? "Unknown sector" : "Loading…");

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-3">
              <Link
                href="/job-types"
                className="inline-flex items-center gap-1 text-sm text-on-dark-muted hover:text-on-dark transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>
                  arrow_back
                </span>
                All sectors
              </Link>
            </div>
            <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
              Sector
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3 break-words">
              {displayName}
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-dark-muted">
              {loadingType
                ? "Loading sector…"
                : unknownType
                ? "This sector could not be found."
                : `${totalItems.toLocaleString()} ${totalItems === 1 ? "opening" : "openings"} in ${resolvedType}.`}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div ref={topRef} />

        {unknownType ? (
          <div className="card-base text-center py-16 text-text-muted">
            <div className="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: "22px" }}>
                search_off
              </span>
            </div>
            <p className="font-medium text-ink mb-1">Sector not found</p>
            <p className="text-sm mb-5">We couldn&apos;t find a sector that matches this URL.</p>
            <Link href="/job-types" className="btn-primary inline-flex items-center gap-1 px-4 py-2">
              Browse all sectors
            </Link>
          </div>
        ) : (
          <>
            {/* Cross-catalog: qualifications */}
            {qualifications.length > 0 && (
              <div className="mb-10 sm:mb-12">
                <h2 className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">
                  Browse by qualification
                </h2>
                <div className="tile-grid">
                  {qualifications.map((qual) => (
                    <Link
                      key={qual}
                      href={`/qualifications/${slugify(qual)}`}
                      className="tile qual-tile"
                    >
                      <div className="tile-icon">
                        <span className="material-symbols-rounded">{getQualificationIcon(qual)}</span>
                      </div>
                      <div className="tile-body">
                        <div className="tile-title">{qual}</div>
                        <div className="tile-count">View jobs</div>
                      </div>
                      <div className="tile-arrow">
                        <span className="material-symbols-rounded">arrow_forward</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Jobs results heading */}
            <div className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6">
              <div className="min-w-0">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-ink break-words">
                  {resolvedType} jobs
                </h3>
                <p className="text-xs sm:text-sm text-text-muted mt-1">
                  {totalItems.toLocaleString()} {totalItems === 1 ? "job" : "jobs"} in this sector
                </p>
              </div>
            </div>

            <div className="job-grid">
              {(loadingType || loadingJobs) && jobs.length === 0 ? (
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
                    <span className="material-symbols-rounded text-text-muted" style={{ fontSize: "22px" }}>
                      search_off
                    </span>
                  </div>
                  <p className="font-medium text-ink mb-1">No jobs found</p>
                  <p className="text-sm">No openings for {resolvedType} right now.</p>
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
                    fetchJobs(resolvedType, next);
                  }}
                  disabled={currentPage <= 1}
                  className="w-10 h-10 rounded-full border border-hairline-strong text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors flex items-center justify-center shrink-0"
                  aria-label="Previous page"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>
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
                    fetchJobs(resolvedType, next);
                  }}
                  disabled={currentPage >= totalPages}
                  className="w-10 h-10 rounded-full border border-hairline-strong text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface transition-colors flex items-center justify-center shrink-0"
                  aria-label="Next page"
                >
                  <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>
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

export default function JobTypeDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-text-muted">
          Loading…
        </div>
      }
    >
      <JobTypeDetailContent />
    </Suspense>
  );
}
