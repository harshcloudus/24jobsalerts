"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "../components/JobCard";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";

/** Material symbol name per job type (sector tiles) */
type JobTypeBrand = {
  icon: string;
};

const getJobTypeBrand = (type: string): JobTypeBrand => {
  const t = type.toLowerCase();

  if (t.includes("government job") && !t.includes("airline") && !t.includes("bank") && !t.includes("forest") && !t.includes("health") && !t.includes("court") && !t.includes("municipal") && !t.includes("post") && !t.includes("psc") && !t.includes("police") && !t.includes("railway"))
    return { icon: "account_balance" };

  if (t.includes("private"))
    return { icon: "business_center" };

  if (t.includes("airline") || t.includes("aviation"))
    return { icon: "flight" };

  if (t.includes("bank"))
    return { icon: "account_balance_wallet" };

  if (t.includes("forest"))
    return { icon: "park" };

  if (t.includes("health"))
    return { icon: "health_and_safety" };

  if (t.includes("high court") || t.includes("court"))
    return { icon: "gavel" };

  if (t.includes("municipal") || t.includes("corporation"))
    return { icon: "location_city" };

  if (t.includes("police"))
    return { icon: "local_police" };

  if (t.includes("post office") || t.includes("postal"))
    return { icon: "mail" };

  if (t.includes("psc") || t.includes("public service"))
    return { icon: "how_to_reg" };

  if (t.includes("railway") || t.includes("rail"))
    return { icon: "train" };

  if (t.includes("defence") || t.includes("army") || t.includes("military"))
    return { icon: "military_tech" };

  if (t.includes("teaching") || t.includes("education") || t.includes("school"))
    return { icon: "school" };

  if (t.includes("engineer") || t.includes("technical"))
    return { icon: "engineering" };

  if (t.includes("it") || t.includes("software") || t.includes("tech"))
    return { icon: "computer" };

  if (t.includes("science") || t.includes("research"))
    return { icon: "science" };

  // Fallback: hash-based icon variety
  const colors: JobTypeBrand[] = [
    { icon: "work" },
    { icon: "badge" },
    { icon: "verified_user" },
    { icon: "star" },
    { icon: "groups" },
  ];
  const hash = t.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

function JobTypesContent() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
  const searchParams = useSearchParams();
  const initialFromQuery = searchParams.get("job_type") || "";

  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [activeJobType, setActiveJobType] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const headingRef = useRef<HTMLDivElement | null>(null);
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
        return parsed.map((v: any) => Number(v)).filter((n: number) => !Number.isNaN(n));
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
    async function fetchJobTypes() {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const types: string[] = data.job_types || [];

        const orderedTypes = [...types].sort((a, b) => {
          const norm = (s: string) => s.toLowerCase().trim();
          const aNorm = norm(a);
          const bNorm = norm(b);
          const aScore =
            aNorm === "government job" ? 0 : aNorm === "private job" ? 1 : 2;
          const bScore =
            bNorm === "government job" ? 0 : bNorm === "private job" ? 1 : 2;
          if (aScore !== bScore) return aScore - bScore;
          return a.localeCompare(b);
        });

        setJobTypes(orderedTypes);
        if (orderedTypes.length > 0) {
          const normalized = initialFromQuery.toLowerCase().trim();
          const fromQuery = orderedTypes.find(
            (t: string) => t.toLowerCase().trim() === normalized
          );
          setActiveJobType(fromQuery || orderedTypes[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTypes(false);
      }
    }
    fetchJobTypes();
    setSavedIds(readSavedIdsFromCookie());
  }, []);

  const fetchJobs = async (type: string, page: number) => {
    if (!type) return;
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      params.set("job_type", type);

      const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
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
    if (activeJobType) {
      fetchJobs(activeJobType, 1);
      setCurrentPage(1);
    }
  }, [activeJobType]);

  useEffect(() => {
    if (typeof window !== "undefined" && headingRef.current) {
      const offset = headingRef.current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [activeJobType, currentPage]);

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
              Browse by sector
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
              Explore by job type
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-dark-muted">
              Pick a sector — government, private, railways, banking, healthcare
              — and browse openings tailored to that field.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Catalog of job types */}
        <div className="mb-10 sm:mb-12">
          <h2 className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">
            All sectors
          </h2>

          {loadingTypes ? (
            <div className="tile-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : jobTypes.length === 0 ? (
            <div className="text-center text-text-muted py-10">No job types available.</div>
          ) : (
            <div className="tile-grid">
              {jobTypes.map((type) => {
                const brand = getJobTypeBrand(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveJobType(type)}
                    className="tile"
                  >
                    <div className="tile-icon">
                      <span className="material-symbols-rounded">{brand.icon}</span>
                    </div>
                    <div className="tile-body">
                      <div className="tile-title">{type}</div>
                      <div className="tile-count">Browse jobs</div>
                    </div>
                    <div className="tile-arrow">
                      <span className="material-symbols-rounded">arrow_forward</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Active sector jobs */}
        <section>
          <div ref={headingRef} className="flex flex-wrap items-end justify-between gap-3 mb-5 sm:mb-6">
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-[-0.015em] text-ink break-words">
                {activeJobType || "All job types"}
              </h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1">
                {totalItems.toLocaleString()} {totalItems === 1 ? "job" : "jobs"} in this sector
              </p>
            </div>
          </div>

          <div className="job-grid">
            {loadingJobs && jobs.length === 0 ? (
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
                <p className="text-sm">No openings for {activeJobType} right now.</p>
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
                  fetchJobs(activeJobType, next);
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
                  fetchJobs(activeJobType, next);
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
        </section>
      </main>
    </div>
  );
}

export default function JobTypes() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-text-muted">
          Loading…
        </div>
      }
    >
      <JobTypesContent />
    </Suspense>
  );
}
