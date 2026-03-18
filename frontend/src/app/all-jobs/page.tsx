"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "../components/JobCard";

function AllJobsContent() {
  const searchParams = useSearchParams();
  const API_BASE = "http://localhost:8000";

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [jobType, setJobType] = useState(searchParams.get("job_type") || "");
  const [qualification, setQualification] = useState(searchParams.get("qualification") || "");
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get("page") || "1"));
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-900 tracking-tighter text-charcoal mb-2 uppercase italic">All Job Openings</h1>
          <p className="text-text-body font-bold">Showing {totalItems} matches for your career profile</p>
        </div>

        <div className="relative mb-8">
          <div className="flex flex-col sm:flex-row bg-white rounded-xl border-[3px] border-charcoal divide-y-[3px] sm:divide-y-0 sm:divide-x-[3px] divide-charcoal">
            <div className="flex-1 min-w-[250px] relative bg-white rounded-t-xl sm:rounded-t-none sm:rounded-l-xl">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal">search</span>
              <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-3 bg-white border border-transparent rounded-xl focus:outline-none focus:ring-0 text-charcoal placeholder:text-text-muted font-bold" 
                placeholder="Job titles, keywords, or qualification" 
                type="text"
              />
            </div>
            <div className="w-full sm:w-auto relative bg-white">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-charcoal text-lg">category</span>
              <button
                type="button"
                onClick={() => setIsCategoryOpen((open) => !open)}
                className="w-full sm:w-48 pl-10 pr-8 py-3 bg-white text-left text-sm text-charcoal font-bold cursor-pointer"
              >
                {category === "" ? "All categories" : (
                  (() => {
                    const match = categories.find((c) => c === category) || "";
                    const lower = match.toLowerCase();
                    if (lower === "structured_job") return "Job";
                    if (lower === "article") return "Article";
                    return match || "All categories";
                  })()
                )}
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-charcoal text-sm">
                  expand_more
                </span>
              </button>
              {isCategoryOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-charcoal rounded-xl shadow-[4px_4px_0px_rgba(26,23,22,1)] z-20 max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory("");
                      setCurrentPage(1);
                      setIsCategoryOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-bold ${
                      category === "" ? "bg-sand-light text-charcoal border-l-4 border-primary" : "text-charcoal hover:bg-sand-light"
                    }`}
                  >
                    All categories
                  </button>
                  {categories.map((c) => {
                    const lower = (c || "").toLowerCase();
                    const label =
                      lower === "structured_job"
                        ? "Job"
                        : lower === "article"
                        ? "Article"
                        : c;
                    const isActive = category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setCurrentPage(1);
                          setIsCategoryOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm font-bold ${
                          isActive ? "bg-sand-light text-charcoal border-l-4 border-primary" : "text-charcoal hover:bg-sand-light"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              onClick={handleSearchClick}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white font-black px-8 py-3 transition-all flex items-center justify-center gap-2 rounded-b-xl rounded-t-none sm:rounded-b-none sm:rounded-l-none sm:rounded-tr-xl sm:rounded-br-xl"
            >
              FIND JOBS
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full py-10 text-center text-sm font-bold border-2 border-charcoal border-dashed rounded-xl">Loading jobs...</div>
              ) : jobs.length === 0 ? (
                <div className="col-span-full text-center py-16 text-charcoal font-black border-2 border-charcoal border-dashed rounded-xl uppercase">No jobs found.</div>
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

            <div className="mt-12 flex justify-center items-center gap-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-white border-2 border-charcoal text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-light transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="px-6 py-2 bg-white border-2 border-charcoal rounded-lg text-sm font-black text-charcoal">
                PAGE {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-white border-2 border-charcoal text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-light transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AllJobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen items-center justify-center flex font-black uppercase">Loading...</div>}>
      <AllJobsContent />
    </Suspense>
  );
}

