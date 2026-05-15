"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "../components/JobCard";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";
import type { Job } from "@/lib/seo";

function AllJobsContent() {
  const searchParams = useSearchParams();
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [jobType] = useState(searchParams.get("job_type") || "");
  const [qualification] = useState(searchParams.get("qualification") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);

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

  useEffect(() => {
    async function fetchFilters() {
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) return;
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error("Failed to load filters", err);
      }
    }
    fetchFilters();
    setSavedIds(readSavedIdsFromCookie());
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("page_size", String(pageSize));
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (jobType) params.set("job_type", jobType);
      if (qualification) params.set("qualification", qualification);

      const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load jobs");
      const data = await res.json();
      setJobs(data.items || []);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error(err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [currentPage, category, jobType, qualification]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setCurrentPage(1);
      fetchJobs();
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

  const categoryLabel = (c: string) => {
    const lower = (c || "").toLowerCase();
    if (lower === "structured_job") return "Job";
    if (lower === "article") return "Article";
    return c || "All";
  };

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
              All opportunities
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
              All job openings
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-dark-muted">
              {loading
                ? "Searching jobs…"
                : `Showing ${totalItems.toLocaleString()} matches across every sector.`}
            </p>
          </div>

          {/* Search bar */}
          <div className="mt-6 sm:mt-8 max-w-3xl">
            <div className="search-pill-large flex items-center gap-1.5 sm:gap-2 pl-3 sm:pl-5 pr-1.5 sm:pr-2">
              <span
                className="material-symbols-rounded text-text-muted shrink-0"
                style={{ fontSize: "20px" }}
              >
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 min-w-0 bg-transparent outline-none text-ink placeholder:text-text-muted text-sm sm:text-base h-full"
                placeholder="Search jobs…"
                aria-label="Search jobs"
                type="text"
                enterKeyHint="search"
              />
              <button
                onClick={handleSearchClick}
                className="btn-primary px-3 sm:px-5 shrink-0 h-11 sm:h-12"
                aria-label="Find jobs"
              >
                <span className="hidden sm:inline">Find jobs</span>
                <span className="material-symbols-rounded" style={{ fontSize: "18px" }}>
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Filter pill-tabs */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
            <span className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mr-1 sm:mr-2">
              Filter:
            </span>
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setCurrentPage(1);
              }}
              className={category === "" ? "pill-tab pill-tab-active" : "pill-tab"}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setCurrentPage(1);
                }}
                className={category === c ? "pill-tab pill-tab-active" : "pill-tab"}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>
        )}

        {/* Jobs grid */}
        <div className="job-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-base p-5 space-y-3">
                <div className="skeleton h-11 w-11 rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="col-span-full card-base text-center py-16 text-text-muted">
              <div className="w-12 h-12 rounded-full bg-surface mx-auto mb-3 flex items-center justify-center">
                <span className="material-symbols-rounded text-text-muted" style={{ fontSize: "22px" }}>
                  search_off
                </span>
              </div>
              <p className="font-medium text-ink mb-1">No jobs found</p>
              <p className="text-sm">Try a different keyword or clear the filter.</p>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-row mt-10 sm:mt-12 flex justify-center items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
      </main>
    </div>
  );
}

export default function AllJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] items-center justify-center flex text-text-muted">
          Loading…
        </div>
      }
    >
      <AllJobsContent />
    </Suspense>
  );
}
