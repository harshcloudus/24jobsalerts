"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobTypeIcon, sortJobTypes } from "@/lib/jobTypeIcons";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function JobTypes() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");

  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    async function fetchJobTypes() {
      setLoadingTypes(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        setJobTypes(sortJobTypes(data.job_types || []));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTypes(false);
      }
    }
    fetchJobTypes();
  }, []);

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
        <div>
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
              {jobTypes.map((type) => (
                <Link
                  key={type}
                  href={`/job-types/${slugify(type)}`}
                  className="tile"
                >
                  <div className="tile-icon">
                    <span className="material-symbols-rounded">{getJobTypeIcon(type)}</span>
                  </div>
                  <div className="tile-body">
                    <div className="tile-title">{type}</div>
                    <div className="tile-count">Browse jobs</div>
                  </div>
                  <div className="tile-arrow">
                    <span className="material-symbols-rounded">arrow_forward</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
