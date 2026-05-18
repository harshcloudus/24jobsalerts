"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import JobCard from "./components/JobCard";
import AdSenseDisplay from "./components/AdSenseDisplay";
import { getQualificationIcon } from "@/lib/qualificationIcons";
import type { Job } from "@/lib/seo";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
).replace(/\/$/, "");

export default function Home() {
  const router = useRouter();
  const [homeQualifications, setHomeQualifications] = useState<string[]>([]);
  const [loadingHomeQuals, setLoadingHomeQuals] = useState(true);
  const [homeJobTypes, setHomeJobTypes] = useState<string[]>([]);
  const [loadingHomeJobTypes, setLoadingHomeJobTypes] = useState(true);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);


  const getJobTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("police")) return "local_police";
    if (t.includes("health")) return "health_and_safety";
    if (t.includes("railway")) return "train";
    if (t.includes("municipal") || t.includes("corporation"))
      return "location_city";
    if (t.includes("post office") || t.includes("postal")) return "mail";
    if (t.includes("airline")) return "flight";
    if (t.includes("psc") || t.includes("public service"))
      return "account_balance";
    if (t.includes("bank")) return "account_balance_wallet";
    if (t.includes("forest")) return "park";
    if (t.includes("private")) return "work";
    return "work";
  };

  const handleJobType = (type: string) => {
    router.push(`/job-types?job_type=${encodeURIComponent(type)}`);
  };

  const handleQualification = (qualification: string) => {
    router.push(
      `/qualifications?qualification=${encodeURIComponent(qualification)}`,
    );
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

        setHomeQualifications(quals);

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

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero-home">
        <div className="hero-bg" />
        <div className="hero-grid-overlay" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[13px] text-on-dark mb-4 sm:mb-5 max-w-full">
            <span className="hero-badge-dot" />
            <span className="hidden sm:inline">Updated daily ·</span>
            <span className="sm:hidden">Daily ·</span>
            <span className="hero-badge-chip whitespace-nowrap">
              2,438 this week
            </span>
          </div>

          {/* Heading */}
          <h1 className="hero-heading">
            Every job alert,{" "}
            <span className="text-primary italic font-medium">friendlier.</span>
          </h1>

          {/* Sub */}
          <p className="text-[14px] sm:text-[17px] text-on-dark-muted leading-[1.55] max-w-[60ch] mx-auto mb-6 sm:mb-7 px-1 sm:px-2">
            Verified government, banking, railway and private listings — sorted,
            searchable, and saved before the deadline catches you off guard.
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
                type="text"
                name="search"
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
                type="text"
                name="qualification"
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

          {/* Trust bar — credibility stats */}
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

      {/* ===== LATEST JOBS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
          <div>
            <div className="section-eyebrow">Fresh today</div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">
              Latest job openings
            </h2>
          </div>
          <Link href="/latest-jobs" className="view-all">
            View all
            <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </div>

        <div className="job-grid">
          {loadingLatest ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-base p-5 space-y-3">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))
          ) : latestJobs.length === 0 ? (
            <div className="col-span-full text-center text-text-muted py-10 card-base">
              No recent jobs found.
            </div>
          ) : (
            latestJobs.map((job, idx) => <JobCard key={idx} job={job} />)
          )}
        </div>
      </section>

      {/* ===== JOB TYPES ===== */}
      <section className="bg-surface border-y border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
            <div>
              <div className="section-eyebrow">Browse by field</div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">
                Find jobs by type
              </h2>
            </div>
            <Link href="/job-types" className="view-all">
              All types
              <span className="material-symbols-rounded">arrow_forward</span>
            </Link>
          </div>

          <div className="tile-grid">
            {loadingHomeJobTypes ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))
            ) : homeJobTypes.length === 0 ? (
              <div className="col-span-full text-center text-text-muted py-6">
                No data.
              </div>
            ) : (
              homeJobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleJobType(type)}
                  type="button"
                  className="tile"
                >
                  <div className="tile-icon">
                    <span className="material-symbols-rounded">
                      {getJobTypeIcon(type)}
                    </span>
                  </div>
                  <div className="tile-body">
                    <div className="tile-title">{type}</div>
                    <div className="tile-count">Browse jobs</div>
                  </div>
                  <div className="tile-arrow">
                    <span className="material-symbols-rounded">
                      arrow_forward
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {/* <AdSenseDisplay variant="wide" className="py-6" /> */}

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
          {loadingHomeQuals ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))
          ) : homeQualifications.length === 0 ? (
            <div className="col-span-full text-center text-text-muted py-6">
              No data.
            </div>
          ) : (
            homeQualifications.map((qual) => (
              <button
                key={qual}
                type="button"
                onClick={() => handleQualification(qual)}
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
                  <span className="material-symbols-rounded">
                    arrow_forward
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </section>

      <AdSenseDisplay variant="wide" className="py-6" />

      {/* ===== ALL JOBS ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4 mb-7 sm:mb-10">
          <div>
            <div className="section-eyebrow">Open right now</div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink">
              All job openings
            </h2>
          </div>
          <Link href="/all-jobs" className="view-all">
            View all
            <span className="material-symbols-rounded">arrow_forward</span>
          </Link>
        </div>

        <div className="job-grid">
          {loadingAll ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-base p-5 space-y-3">
                <div className="skeleton h-8 w-8 rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))
          ) : allJobs.length === 0 ? (
            <div className="col-span-full text-center text-text-muted py-10 card-base">
              No jobs found.
            </div>
          ) : (
            allJobs.map((job, idx) => <JobCard key={idx} job={job} />)
          )}
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="bg-surface border-y border-hairline">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          <div className="max-w-2xl mb-8 sm:mb-10">
            <div className="section-eyebrow">Why 24JobsAlerts</div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.015em] text-ink mb-3">
              Built for serious job seekers.
            </h2>
            <p className="text-base text-text-body leading-relaxed">
              Clean, accurate, daily-updated job alerts with direct links to the
              official source.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                icon: "bolt",
                title: "Daily updates",
                desc: "New jobs are posted every single day so you never miss an opportunity.",
              },
              {
                icon: "verified",
                title: "Verified listings",
                desc: "Every job links to the official source so you can verify before applying.",
              },
              {
                icon: "filter_alt",
                title: "Clean filters",
                desc: "Filter by sector, qualification, or job type — no spammy popups.",
              },
              {
                icon: "bookmark",
                title: "Save & revisit",
                desc: "Bookmark jobs in your browser and come back to them anytime.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="why-card">
                <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-rounded text-primary"
                    style={{
                      fontSize: "20px",
                      fontVariationSettings: "'FILL' 1",
                    }}
                  >
                    {icon}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ink mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-text-body leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
