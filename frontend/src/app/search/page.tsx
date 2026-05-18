"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import JobCard from "../components/JobCard";
import { getQualificationIcon } from "@/lib/qualificationIcons";
import type { Job } from "@/lib/seo";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
).replace(/\/$/, "");

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("search") || "";
  const qualificationQuery = searchParams.get("qualification") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const hasQuery = !!(searchQuery || qualificationQuery);
  const displayLabel = [searchQuery, qualificationQuery].filter(Boolean).join(" + ");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [qualifications, setQualifications] = useState<string[]>([]);
  const [loadingQuals, setLoadingQuals] = useState(true);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    async function fetchQuals() {
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) return;
        const data = await res.json();
        setQualifications(data.qualifications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuals(false);
      }
    }
    fetchQuals();
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setJobs([]);
      setTotalItems(0);
      return;
    }
    async function fetchJobs() {
      setLoadingJobs(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("page_size", String(pageSize));
        if (searchQuery) params.set("search", searchQuery);
        if (qualificationQuery) params.set("qualification", qualificationQuery);
        const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data.items || []);
        setTotalItems(data.total || 0);
      } catch (err) {
        console.error(err);
        setJobs([]);
        setTotalItems(0);
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchJobs();
  }, [searchQuery, qualificationQuery, currentPage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const handleHeroSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const search = ((fd.get("search") as string) || "").trim();
    const qualification = ((fd.get("qualification") as string) || "").trim();
    if (!search && !qualification) return;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (qualification) params.set("qualification", qualification);
    router.push(`/search?${params.toString()}`);
  };

  const navigatePage = (page: number) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (qualificationQuery) params.set("qualification", qualificationQuery);
    params.set("page", String(page));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="bg-canvas">
      {/* ===== HERO ===== */}
      <section className="hero-home">
        <div className="hero-bg" />
        <div className="hero-grid-overlay" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-center">
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/15 bg-white/6 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] text-on-dark mb-4 sm:mb-5 max-w-full">
            <span className="hero-badge-dot" />
            {hasQuery ? (
              <>
                <span>Search results</span>
                <span className="text-on-dark-muted">·</span>
                <span className="hero-badge-chip truncate max-w-[18ch]">
                  &ldquo;{displayLabel}&rdquo;
                </span>
              </>
            ) : (
              <span>Search jobs</span>
            )}
          </div>

          <h1 className="hero-heading">
            {hasQuery ? (
              <>
                Results for{" "}
                <span className="text-primary italic font-medium">
                  &ldquo;{displayLabel}&rdquo;
                </span>
              </>
            ) : (
              <>
                Find your{" "}
                <span className="text-primary italic font-medium">
                  perfect job.
                </span>
              </>
            )}
          </h1>

          <p className="text-[14px] sm:text-[17px] text-on-dark-muted leading-[1.55] max-w-[60ch] mx-auto mb-6 sm:mb-7 px-1 sm:px-2">
            {hasQuery
              ? `${loadingJobs ? "Searching…" : `${totalItems.toLocaleString()} result${totalItems === 1 ? "" : "s"} found.`} Refine your search below.`
              : "Enter a job title, exam name, or employer to find matching opportunities."}
          </p>

          {/* Search bar — dual field */}
          <form className="hero-search-bar" onSubmit={handleHeroSearch}>
            <label className="hero-search-field">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "20px", color: "var(--color-text-subtle)" }}
              >
                search
              </span>
              <input
                key={`s-${searchQuery}`}
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Job title, exam, or employer"
              />
            </label>
            <span className="hero-search-divider" aria-hidden />
            <label className="hero-search-field">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "20px", color: "var(--color-text-subtle)" }}
              >
                tune
              </span>
              <input
                key={`q-${qualificationQuery}`}
                type="text"
                name="qualification"
                defaultValue={qualificationQuery}
                placeholder="Qualification or type"
              />
            </label>
            <button className="btn-primary" type="submit">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "18px" }}
              >
                search
              </span>
              Find jobs
            </button>
          </form>

          {/* Trust bar */}
          <div className="hero-trust-bar">
            <span className="hero-trust-item">
              <span className="material-symbols-rounded">verified</span>
              14,832 verified listings
            </span>
            <span className="hero-trust-divider" />
            <span className="hero-trust-item">
              <span className="material-symbols-rounded">groups</span>
              2.6M monthly seekers
            </span>
            <span className="hero-trust-divider" />
            <span className="hero-trust-item">
              <span className="material-symbols-rounded">schedule</span>
              Updated every morning
            </span>
          </div>
        </div>
      </section>

      {/* ===== QUALIFICATIONS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
          <div>
            <div className="section-eyebrow">Browse by qualification</div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">
              Jobs that fit what you&apos;ve earned
            </h2>
          </div>
          <Link href="/qualifications" className="view-all">
            All qualifications
            <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </div>

        <div className="tile-grid">
          {loadingQuals ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          ) : qualifications.length === 0 ? (
            <div className="col-span-full text-center text-text-muted py-6">
              No data.
            </div>
          ) : (
            qualifications.map((qual) => (
              <Link
                key={qual}
                href={`/qualifications?qualification=${encodeURIComponent(qual)}`}
                className="tile qual-tile"
              >
                <div className="tile-icon">
                  <span className="material-symbols-rounded">
                    {getQualificationIcon(qual)}
                  </span>
                </div>
                <div className="tile-body">
                  <div className="tile-title">{qual}</div>
                  <div className="tile-count">View jobs</div>
                </div>
                <div className="tile-arrow">
                  <span className="material-symbols-rounded">arrow_forward</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* ===== SEARCH RESULTS ===== */}
      {hasQuery && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 border-t border-hairline">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
            <div>
              <div className="section-eyebrow">Search results</div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">
                {loadingJobs
                  ? `Searching for "${displayLabel}"…`
                  : `${totalItems.toLocaleString()} result${totalItems === 1 ? "" : "s"} for "${displayLabel}"`}
              </h2>
            </div>
          </div>

          <div className="job-grid">
            {loadingJobs ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-base p-5 space-y-3">
                  <div className="skeleton h-8 w-8 rounded-lg" />
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div className="col-span-full card-base text-center py-16 text-text-muted">
                <div className="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
                  <span
                    className="material-symbols-rounded text-text-muted"
                    style={{ fontSize: "22px" }}
                  >
                    search_off
                  </span>
                </div>
                <p className="font-medium text-ink mb-1">No matching jobs found</p>
                <p className="text-sm">Try a different keyword or fewer words.</p>
              </div>
            ) : (
              jobs.map((job, idx) => <JobCard key={idx} job={job} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-row mt-10 sm:mt-12 flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={() => navigatePage(Math.max(1, currentPage - 1))}
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
                onClick={() => navigatePage(Math.min(totalPages, currentPage + 1))}
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
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-text-muted">
          Loading…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
