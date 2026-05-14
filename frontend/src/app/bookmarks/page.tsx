"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import JobCard from "../components/JobCard";

type SavedJob = {
  id: number;
  title?: string | null;
  job_type?: string | null;
  qualification?: string | null;
  category?: string | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");
const COOKIE_KEY = "saved_job_ids";

function getSavedIdsFromCookie(): number[] {
  if (typeof document === "undefined") return [];
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${COOKIE_KEY}=`));
  if (!match) return [];
  try {
    const val = decodeURIComponent(match.split("=")[1]);
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) {
      return parsed.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
    }
    return [];
  } catch {
    return [];
  }
}

export default function BookmarksPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = getSavedIdsFromCookie();
      if (ids.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }
      try {
        const fetched: SavedJob[] = [];
        for (const id of ids) {
          const res = await fetch(`${API_BASE}/api/jobs/${id}`);
          if (!res.ok) continue;
          const data = await res.json();
          fetched.push(data);
        }
        setJobs(fetched);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
            <div className="min-w-0 flex-1">
              <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
                Your shortlist
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-2">
                Saved jobs
              </h1>
              <p className="text-on-dark-muted text-sm sm:text-base md:text-lg">
                {loading
                  ? "Loading saved jobs…"
                  : jobs.length === 0
                  ? "No jobs saved yet."
                  : `${jobs.length} job${jobs.length === 1 ? "" : "s"} bookmarked in this browser.`}
              </p>
            </div>
            <Link href="/latest-jobs" className="btn-primary shrink-0">
              Browse jobs
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="job-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card-base p-5 space-y-3">
                <div className="skeleton h-11 w-11 rounded-lg" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="card-base p-10 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-primary-light mx-auto mb-4 flex items-center justify-center">
              <span
                className="material-symbols-rounded text-primary"
                style={{ fontSize: "26px", fontVariationSettings: "'FILL' 1" }}
              >
                bookmark
              </span>
            </div>
            <h2 className="text-lg font-semibold text-ink mb-2">
              No saved jobs yet
            </h2>
            <p className="text-sm text-text-body mb-6 leading-relaxed">
              Tap the bookmark icon on any job to add it here. Your saved jobs
              stay in this browser — no account needed.
            </p>
            <Link href="/latest-jobs" className="btn-primary">
              Browse latest jobs
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </Link>
          </div>
        ) : (
          <div className="job-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
