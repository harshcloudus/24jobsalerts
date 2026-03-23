"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import JobCard from "../components/JobCard";

function QualificationsContent() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
  const searchParams = useSearchParams();
  const initialFromQuery = searchParams.get("qualification") || "";

  const [qualifications, setQualifications] = useState<string[]>([]);
  const [activeQualification, setActiveQualification] = useState("");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loadingQuals, setLoadingQuals] = useState(true);
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
  };

  useEffect(() => {
    async function fetchQualifications() {
      setLoadingQuals(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const quals = data.qualifications || [];
        setQualifications(quals);
        if (quals.length > 0) {
          const normalized = initialFromQuery.toLowerCase().trim();
          const fromQuery = quals.find(
            (q: string) => q.toLowerCase().trim() === normalized
          );
          setActiveQualification(fromQuery || quals[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuals(false);
      }
    }
    fetchQualifications();
    setSavedIds(readSavedIdsFromCookie());
  }, []);

  const fetchJobs = async (qual: string, page: number) => {
    if (!qual) return;
    setLoadingJobs(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      params.set("qualification", qual);
      
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
    if (activeQualification) {
      fetchJobs(activeQualification, 1);
      setCurrentPage(1);
    }
  }, [activeQualification]);

  useEffect(() => {
    if (typeof window !== "undefined" && headingRef.current) {
      const offset = headingRef.current.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, [activeQualification, currentPage]);

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="mb-12">
          <div className="mb-8">
            <h1 className="text-3xl font-900 tracking-tighter text-charcoal mb-2 uppercase italic">
              Jobs by Qualification
            </h1>
            <p className="text-text-body max-w-2xl text-base font-bold">
              Select your education level to find tailored career opportunities.
            </p>
          </div>
          
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-2">
            {loadingQuals ? (
              <div className="text-sm font-bold underline">Loading...</div>
            ) : qualifications.length === 0 ? (
              <div className="text-sm font-bold italic">No data.</div>
            ) : (
              qualifications.map((qual) => {
                const isActive = activeQualification === qual;
                return (
                  <button 
                    key={qual} 
                    onClick={() => setActiveQualification(qual)}
                    type="button" 
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 transition-all hover:-translate-y-1 ${isActive ? 'bg-primary text-white border-charcoal shadow-[6px_6px_0px_rgba(26,23,22,1)]' : 'text-charcoal bg-white border-charcoal hover:shadow-[4px_4px_0px_rgba(26,23,22,1)]'}`}
                  >
                    <span className={`material-symbols-outlined text-3xl mb-2 ${isActive ? 'text-white' : 'text-primary'}`}>school</span>
                    <span className="text-[11px] sm:text-sm font-black uppercase italic tracking-tighter text-center">
                      {qual}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center mb-2" ref={headingRef}>
            <h3 className="text-2xl md:text-3xl font-900 uppercase italic tracking-tight text-charcoal">
              {activeQualification || "All Qualifications"}
            </h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-charcoal uppercase italic tracking-wider">
              RESULTS: {totalItems || 0} JOBS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loadingJobs && jobs.length === 0 ? (
              <div className="col-span-full p-20 text-center font-black italic border-2 border-charcoal border-dashed rounded-2xl">
                SEARCHING...
              </div>
            ) : !loadingJobs && jobs.length === 0 ? (
              <div className="col-span-full p-20 text-center font-black italic border-2 border-charcoal border-dashed rounded-2xl uppercase">
                NO JOBS FOUND
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

          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => {
                if (currentPage <= 1) return;
                const next = currentPage - 1;
                setCurrentPage(next);
                fetchJobs(activeQualification, next);
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
                fetchJobs(activeQualification, next);
              }}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg bg-white border-2 border-charcoal text-charcoal disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-light transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function Qualifications() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center font-black uppercase">
          Loading...
        </div>
      }
    >
      <QualificationsContent />
    </Suspense>
  );
}
