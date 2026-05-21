"use client";

import { useEffect, useState } from "react";
import Link from "@/app/components/HardLink";
import { getQualificationIcon } from "@/lib/qualificationIcons";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export default function Qualifications() {
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(/\/$/, "");

  const [qualifications, setQualifications] = useState<string[]>([]);
  const [loadingQuals, setLoadingQuals] = useState(true);

  useEffect(() => {
    async function fetchQualifications() {
      setLoadingQuals(true);
      try {
        const res = await fetch(`${API_BASE}/api/filters`);
        if (!res.ok) throw new Error("Failed to fetch filters");
        const data = await res.json();
        setQualifications(data.qualifications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingQuals(false);
      }
    }
    fetchQualifications();
  }, []);

  return (
    <div className="bg-canvas">
      {/* Hero band */}
      <section className="hero-band-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
          <div className="max-w-3xl">
            <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
              Filter by education
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
              Jobs by qualification
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-on-dark-muted">
              Select your education level to find roles tailored to your
              qualification — from 10th pass to graduate, post-grad, and beyond.
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Qualifications catalog */}
        <div>
          <h2 className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-3 sm:mb-4">
            All qualifications
          </h2>

          {loadingQuals ? (
            <div className="tile-grid">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-2xl" />
              ))}
            </div>
          ) : qualifications.length === 0 ? (
            <div className="text-center text-text-muted py-10">
              No qualifications available.
            </div>
          ) : (
            <div className="tile-grid">
              {qualifications.map((qual) => (
                <Link
                  key={qual}
                  href={`/qualifications/${slugify(qual)}`}
                  className="tile qual-tile"
                >
                  <div className="tile-icon">
                    <span className="material-symbols-rounded">{getQualificationIcon(qual)}</span>
                  </div>
                  <div className="tile-body">
                    <div className="tile-title">{qual}</div>
                    <div className="tile-count">View jobs</div>
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
