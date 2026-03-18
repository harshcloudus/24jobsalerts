"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Qualifications() {
  const API_BASE = "http://localhost:8000";
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

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

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
          
          <div className="flex flex-wrap gap-4 sm:gap-6 pb-4">
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
                    className={`flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 transition-all hover:-translate-y-1 ${isActive ? 'bg-primary text-white border-charcoal shadow-[6px_6px_0px_rgba(26,23,22,1)]' : 'text-charcoal bg-white border-charcoal hover:shadow-[4px_4px_0px_rgba(26,23,22,1)]'}`}
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
                    className="bg-white border-2 border-charcoal p-5 rounded-2xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(26,23,22,1)] transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-charcoal">
                          {initial}
                        </div>
                        <span className="text-[10px] font-black text-primary bg-white border-2 border-charcoal px-2 py-1 rounded-full uppercase">
                          {badgeText}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-black text-charcoal group-hover:text-primary transition-colors mb-3 uppercase tracking-tight">
                        {shortTitle}
                      </h3>
                      <div className="space-y-1 text-sm text-text-muted font-bold">
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
                        href={`/jobs/${(job.title || "job")
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-+|-+$/g, "")}-${job.id}`}
                        className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-6 py-2 rounded-lg font-black text-sm border-2 border-charcoal transition-all"
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
