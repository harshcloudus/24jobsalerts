"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function JobTypes() {
  const API_BASE = "http://localhost:8000";
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

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const getJobTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("police")) return "local_police";
    if (t.includes("health")) return "health_and_safety";
    if (t.includes("railway")) return "train";
    if (t.includes("municipal") || t.includes("corporation")) return "location_city";
    if (t.includes("post office") || t.includes("postal")) return "mail";
    if (t.includes("airline")) return "flight";
    if (t.includes("psc") || t.includes("public service")) return "account_balance";
    if (t.includes("bank")) return "account_balance_wallet";
    if (t.includes("forest")) return "park";
    if (t.includes("private")) return "work";
    return "work";
  };

  useEffect(() => {
    async function fetchJobTypes() {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const types: string[] = data.job_types || [];

        // Restore original ordering: Government, Private, then others A–Z
        const orderedTypes = [...types].sort((a, b) => {
          const norm = (s: string) => s.toLowerCase().trim();
          const aNorm = norm(a);
          const bNorm = norm(b);

          const aScore =
            aNorm === "government job"
              ? 0
              : aNorm === "private job"
              ? 1
              : 2;
          const bScore =
            bNorm === "government job"
              ? 0
              : bNorm === "private job"
              ? 1
              : 2;

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
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-900 text-charcoal mb-4 tracking-tighter uppercase italic">
            Explore by <span className="text-primary">Job Type</span>
          </h2>
          <p className="text-lg text-text-body max-w-2xl font-bold italic">
            Discover high-impact roles in essential industries. Whether you're in public service, healthcare, or finance, your next career move starts here.
          </p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 pt-2 mb-6">
          {loadingTypes ? (
            <div className="col-span-full py-10 font-bold">Loading categories...</div>
          ) : jobTypes.length === 0 ? (
            <div className="col-span-full font-bold">No job types available.</div>
          ) : (
            jobTypes.map((type) => {
              const isActive = activeJobType === type;
              return (
                <button
                  key={type}
                  onClick={() => setActiveJobType(type)}
                  type="button"
                  className={`flex-shrink-0 flex flex-col items-center justify-center w-36 h-36 rounded-2xl border-2 transition-all hover:-translate-y-1 ${
                    isActive
                      ? "bg-primary text-white border-charcoal shadow-[6px_6px_0px_rgba(26,23,22,1)]"
                      : "text-charcoal bg-white border-charcoal hover:shadow-[4px_4px_0px_rgba(26,23,22,1)]"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-3xl mb-2 ${
                      isActive ? "text-white" : "text-primary"
                    }`}
                  >
                    {getJobTypeIcon(type)}
                  </span>
                  <span className="text-sm font-black uppercase italic tracking-tighter text-center">
                    {type}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-6">
          <div className="text-center mb-2" ref={headingRef}>
            <h3 className="text-2xl md:text-3xl font-900 uppercase italic tracking-tight text-charcoal">
              {activeJobType || "All Job Types"}
            </h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-charcoal uppercase italic tracking-wider">
              RESULTS: {totalItems || 0} JOBS
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingJobs && jobs.length === 0 ? (
              <div className="col-span-full py-16 text-center font-black border-2 border-charcoal border-dashed rounded-2xl">
                LOADING...
              </div>
            ) : !loadingJobs && jobs.length === 0 ? (
              <div className="col-span-full text-center py-20 font-black border-2 border-charcoal border-dashed rounded-2xl">
                NO JOBS FOUND
              </div>
            ) : (
              jobs.map((job, idx) => {
                const title: string = job.title || "Untitled role";
                const shortTitle = title.length > 70 ? `${title.slice(0, 67)}...` : title;
                const initial = shortTitle.charAt(0).toUpperCase();
                const rawCategory = job.category as string | null;
                const badgeText =
                  rawCategory === "structured_job"
                    ? "Job"
                    : rawCategory === "article"
                    ? "Article"
                    : rawCategory || "Job";
                const jobType = job.job_type || "Any job type";
                const qualificationText = job.qualification || "Open to multiple levels";

                return (
                  <article
                    key={idx}
                    className="bg-white rounded-2xl border-2 border-charcoal p-5 hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(26,23,22,1)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-charcoal">
                          {initial}
                        </div>
                        <span className="text-[10px] font-black text-primary uppercase bg-white border-2 border-charcoal px-2 py-1 rounded-full">
                          {badgeText}
                        </span>
                      </div>
                      <h4 className="text-base md:text-lg font-black text-charcoal mb-3 uppercase tracking-tight">
                        {shortTitle}
                      </h4>
                      <div className="space-y-1 text-sm text-text-body font-bold">
                        <p>
                          <span className="uppercase tracking-widest text-[10px] text-charcoal mr-1">JOB TYPE:</span>
                          {jobType}
                        </p>
                        <p>
                          <span className="uppercase tracking-widest text-[10px] text-charcoal mr-1">QUALIFICATION:</span>
                          {qualificationText}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t-2 pt-4 border-charcoal/10 mt-4">
                      <button className="text-charcoal hover:text-primary transition-colors" type="button">
                        <span className="material-symbols-outlined">bookmark</span>
                      </button>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="w-auto py-2 px-6 rounded-lg bg-primary/10 text-primary text-center text-sm font-black border-2 border-charcoal hover:bg-primary hover:text-white transition-all"
                        type="button"
                      >
                        DETAILS
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => {
                if (currentPage <= 1) return;
                const next = currentPage - 1;
                setCurrentPage(next);
                fetchJobs(activeJobType, next);
              }}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg bg-white border-2 border-charcoal text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-light transition-all"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="px-6 py-2 bg-white border-2 border-charcoal rounded-lg text-sm font-black text-charcoal">
              PAGE {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => {
                if (currentPage >= totalPages) return;
                const next = currentPage + 1;
                setCurrentPage(next);
                fetchJobs(activeJobType, next);
              }}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-white border-2 border-charcoal text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-light transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
