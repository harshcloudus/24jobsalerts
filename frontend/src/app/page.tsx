"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import JobCard from "./components/JobCard";

export default function Home() {
  const router = useRouter();
  const [homeQualifications, setHomeQualifications] = useState<string[]>([]);
  const [loadingHomeQuals, setLoadingHomeQuals] = useState(true);
  const [homeJobTypes, setHomeJobTypes] = useState<string[]>([]);
  const [loadingHomeJobTypes, setLoadingHomeJobTypes] = useState(true);
  const [latestJobs, setLatestJobs] = useState<any[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

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

  const handleJobType = (type: string) => {
    router.push(`/job-types?job_type=${encodeURIComponent(type)}`);
  };

  const handleQualification = (qualification: string) => {
    router.push(`/qualifications?qualification=${encodeURIComponent(qualification)}`);
  };

  useEffect(() => {
    async function fetchFilters() {
      setLoadingHomeQuals(true);
      setLoadingHomeJobTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        const quals: string[] = data.qualifications || [];
        const types: string[] = data.job_types || [];

        // Same order as Qualifications page (backend order)
        setHomeQualifications(quals);

        // Same ordering logic as Job Types page
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
        setHomeJobTypes(orderedTypes);
      } catch (err) {
        console.error(err);
        setHomeQualifications([]);
        setHomeJobTypes([]);
      } finally {
        setLoadingHomeQuals(false);
        setLoadingHomeJobTypes(false);
      }
    }

    async function fetchLatest() {
      setLoadingLatest(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("page_size", "4");
        params.set("only_recent", "true");
        const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch latest jobs");
        const data = await res.json();
        setLatestJobs(data.items || []);
      } catch (err) {
        console.error(err);
        setLatestJobs([]);
      } finally {
        setLoadingLatest(false);
      }
    }

    async function fetchAll() {
      setLoadingAll(true);
      try {
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("page_size", "4");
        const res = await fetch(`${API_BASE}/api/jobs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch all jobs");
        const data = await res.json();
        setAllJobs(data.items || []);
      } catch (err) {
        console.error(err);
        setAllJobs([]);
      } finally {
        setLoadingAll(false);
      }
    }

    fetchFilters();
    fetchLatest();
    fetchAll();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <header className="relative overflow-hidden pt-12 pb-6 lg:pt-16 lg:pb-6 bg-white">
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-white pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <h2 className="text-5xl md:text-7xl font-900 tracking-tighter text-charcoal mb-6">
              24jobsalerts
            </h2>
            <p className="text-lg md:text-xl text-text-body max-w-2xl mx-auto mb-8 font-medium">
              Find the right job faster. Access thousands of premium opportunities from top-tier companies and government sectors.
            </p>
          </div>

          {/* Hero Latest Jobs (4 cards) */}
          <div className="mt-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl md:text-2xl font-black text-charcoal uppercase tracking-tight">
                Latest Job Openings
              </h3>
              <Link
                href="/latest-jobs"
                className="text-primary text-sm font-black flex items-center gap-1 hover:underline"
              >
                VIEW ALL{" "}
                <span className="material-symbols-outlined text-xs">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingLatest ? (
                <div className="col-span-full text-sm font-bold underline text-center">
                  Loading latest jobs...
                </div>
              ) : latestJobs.length === 0 ? (
                <div className="col-span-full text-sm font-bold italic text-center">
                  No recent jobs found.
                </div>
              ) : (
                latestJobs.map((job, idx) => (
                  <JobCard key={idx} job={job} />
                ))
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Job Type Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-charcoal uppercase tracking-tight">Job Types</h3>
          <Link className="text-primary text-sm font-black flex items-center gap-1 hover:underline" href="/job-types">VIEW ALL <span className="material-symbols-outlined text-xs">arrow_forward</span></Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
          {loadingHomeJobTypes ? (
            <div className="text-sm font-bold underline">Loading...</div>
          ) : homeJobTypes.length === 0 ? (
            <div className="text-sm font-bold italic">No data.</div>
          ) : (
            homeJobTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleJobType(type)}
                type="button"
                className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 border-charcoal bg-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(26,23,22,1)] transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl mb-2 text-primary">
                  {getJobTypeIcon(type)}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase italic tracking-tighter text-charcoal text-center">
                  {type}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* Qualification Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-charcoal uppercase tracking-tight">Jobs by Qualification</h3>
          <Link
            className="text-primary text-sm font-black flex items-center gap-1 hover:underline"
            href="/qualifications"
          >
            VIEW ALL <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
          {loadingHomeQuals ? (
            <div className="text-sm font-bold underline">Loading...</div>
          ) : homeQualifications.length === 0 ? (
            <div className="text-sm font-bold italic">No data.</div>
          ) : (
            homeQualifications.map((qual) => (
              <button
                key={qual}
                type="button"
                onClick={() => handleQualification(qual)}
                className="flex-shrink-0 flex flex-col items-center justify-center w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border-2 transition-all hover:-translate-y-1 text-charcoal bg-white border-charcoal hover:shadow-[4px_4px_0px_rgba(26,23,22,1)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-3xl mb-2 text-primary">school</span>
                <span className="text-[11px] sm:text-sm font-black uppercase italic tracking-tighter text-center text-charcoal">
                  {qual}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      {/* All Jobs Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black text-charcoal uppercase tracking-tight">
            All Job Openings
          </h3>
          <Link
            href="/all-jobs"
            className="text-primary text-sm font-black flex items-center gap-1 hover:underline"
          >
            VIEW ALL <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loadingAll ? (
            <div className="col-span-full text-sm font-bold underline">
              Loading jobs...
            </div>
          ) : allJobs.length === 0 ? (
            <div className="col-span-full text-sm font-bold italic">
              No jobs found.
            </div>
          ) : (
            allJobs.map((job, idx) => <JobCard key={idx} job={job} />)
          )}
        </div>
      </section>

    </>
  );
}
