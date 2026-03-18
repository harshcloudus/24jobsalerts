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

const API_BASE = "http://localhost:8000";
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
    <div className="min-h-screen bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-900 tracking-tighter text-charcoal mb-2 uppercase italic">
              Saved Jobs
            </h1>
            <p className="text-text-body font-bold">
              {jobs.length} job{jobs.length === 1 ? "" : "s"} bookmarked in this browser.
            </p>
          </div>
          <Link
            href="/latest-jobs"
            className="bg-primary text-white border-2 border-charcoal px-5 py-2 rounded-lg text-sm font-black hover:bg-primary-hover transition-all"
          >
            Browse Jobs
          </Link>
        </div>

        {loading ? (
          <div className="border-2 border-charcoal border-dashed rounded-2xl py-16 text-center text-sm font-black">
            Loading saved jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="border-2 border-charcoal border-dashed rounded-2xl py-16 text-center font-black uppercase">
            No saved jobs found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

