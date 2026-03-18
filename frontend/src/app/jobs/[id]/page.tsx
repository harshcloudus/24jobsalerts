"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function JobDetailPage() {
  const { id } = useParams();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

  const [job, setJob] = useState<any>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parseNumericId = () => {
    if (!id) return null;
    const raw = Array.isArray(id) ? id[0] : (id as string);
    const parts = raw.split("-");
    const last = parts[parts.length - 1];
    const num = Number(last);
    return Number.isNaN(num) ? null : num;
  };

  useEffect(() => {
    const numId = parseNumericId();
    if (numId === null) return;
    async function fetchJobDetail() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/jobs/${numId}`);
        if (!res.ok) throw new Error("Job not found");
        const data = await res.json();
        setJob(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchJobDetail();
  }, [id]);

  useEffect(() => {
    const numId = parseNumericId();
    if (numId === null) return;
    if (typeof document === "undefined") return;
    const key = "saved_job_ids";
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
    if (!match) {
      setIsSaved(false);
      return;
    }
    try {
      const val = decodeURIComponent(match.split("=")[1]);
      const arr = JSON.parse(val);
      if (Array.isArray(arr) && arr.map((v) => Number(v)).includes(numId)) {
        setIsSaved(true);
      } else {
        setIsSaved(false);
      }
    } catch {
      setIsSaved(false);
    }
  }, [id]);

  const toggleSave = () => {
    const numId = parseNumericId();
    if (numId === null || typeof document === "undefined") return;
    const key = "saved_job_ids";
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
    let arr: number[] = [];
    if (match) {
      try {
        const val = decodeURIComponent(match.split("=")[1]);
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          arr = parsed.map((v) => Number(v)).filter((n) => !Number.isNaN(n));
        }
      } catch {
        arr = [];
      }
    }
    if (arr.includes(numId)) {
      arr = arr.filter((n) => n !== numId);
      setIsSaved(false);
    } else {
      arr.push(numId);
      setIsSaved(true);
    }
    const encoded = encodeURIComponent(JSON.stringify(arr));
    document.cookie = `${key}=${encoded}; path=/; max-age=${60 * 60 * 24 * 30}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-xl font-black uppercase italic animate-pulse">Loading Job Details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
        <h1 className="text-4xl font-black text-charcoal mb-4">404</h1>
        <p className="text-lg font-bold text-text-muted mb-8 italic">Job not found or has been removed.</p>
        <Link href="/latest-jobs" className="bg-primary text-white border-2 border-charcoal px-8 py-3 rounded-xl font-black uppercase shadow-[4px_4px_0px_rgba(26,23,22,1)]">
          Back to Listings
        </Link>
      </div>
    );
  }

  const tables = job.tables_json || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="bg-sand-light border-b-4 border-charcoal py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="bg-white border-2 border-charcoal px-3 py-1 rounded-full text-xs font-black uppercase text-primary">
              {job.category === "structured_job"
                ? "Job"
                : job.category === "article"
                ? "Article"
                : job.category || "Job Opening"}
            </span>
            <span className="text-sm font-bold text-text-muted flex items-center gap-1 italic">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              Posted: {job.posted_date || "N/A"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-900 text-charcoal mb-6 tracking-tighter uppercase italic leading-tight">
            {job.title}
          </h1>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 font-black text-charcoal uppercase text-sm">
              <span className="material-symbols-outlined text-primary">work</span>
              {job.job_type || "N/A"}
            </div>
            <div className="flex items-center gap-2 font-black text-charcoal uppercase text-sm">
              <span className="material-symbols-outlined text-primary">school</span>
              {job.qualification || "N/A"}
            </div>
            {job.last_date && (
              <div className="flex items-center gap-2 font-black text-red-600 uppercase text-sm italic">
                <span className="material-symbols-outlined">event_busy</span>
                {job.last_date}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Intro Segment */}
            {job.intro_text && (
              <section className="bg-white border-2 border-charcoal p-8 rounded-2xl shadow-[6px_6px_0px_rgba(26,23,22,1)]">
                <h3 className="text-xl font-black text-charcoal uppercase italic mb-4 border-b-2 border-charcoal pb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">description</span> Job Description
                </h3>
                <p className="text-text-body font-bold leading-relaxed">{job.intro_text}</p>
              </section>
            )}

            {/* Dynamic Tables from JSON */}
            {tables.map((table: any, tIdx: number) => (
              <section key={tIdx} className="bg-white border-2 border-charcoal rounded-2xl overflow-hidden shadow-[6px_6px_0px_rgba(26,23,22,1)]">
                {table.heading && (
                  <div className="bg-charcoal text-white px-6 py-3 font-black uppercase italic tracking-widest text-sm">
                    {table.heading.toLowerCase().includes("eligibility")
                      ? "Eligibility / Requirement Details"
                      : table.heading}
                  </div>
                )}
                <div className="p-6">
                  {table.name && table.name !== table.heading && (
                    <h4 className="font-black text-charcoal mb-4 uppercase text-lg">
                      {table.name}
                    </h4>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {table.columns.map((col: string, cIdx: number) => (
                            <th key={cIdx} className="border-2 border-charcoal bg-sand-light p-3 text-left font-black uppercase text-xs">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row: string[], rIdx: number) => (
                          <tr key={rIdx}>
                            {row.map((cell: string, dIdx: number) => (
                              <td key={dIdx} className="border-2 border-charcoal p-3 text-sm font-bold text-charcoal">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Inline eligibility / requirement text inside the Eligibility table, below the inner table, without extra titles */}
                  {table.heading &&
                    table.heading.toLowerCase().includes("eligibility") &&
                    (job.requirement_text || job.eligibility_text) && (
                      <div className="mt-4 space-y-2 text-sm font-bold text-text-body leading-relaxed">
                        {job.requirement_text && <p>{job.requirement_text}</p>}
                        {job.eligibility_text && <p>{job.eligibility_text}</p>}
                      </div>
                    )}

                  {/* Inline official site / how-to-apply text below the How to Apply table */}
                  {table.heading &&
                    table.heading.toLowerCase().includes("how to apply") &&
                    job.official_site_text && (
                      <div className="mt-4 text-sm font-bold text-text-body leading-relaxed">
                        <p>{job.official_site_text}</p>
                      </div>
                    )}
                </div>
              </section>
            ))}

            {/* Selection/Apply Info */}
            {(job.selection_process || job.application_fee) && (
              <section className="bg-white border-2 border-charcoal p-8 rounded-2xl shadow-[6px_6px_0px_rgba(26,23,22,1)] space-y-8">
                {job.application_fee && (
                  <div>
                    <h3 className="text-xl font-black text-charcoal uppercase italic mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined">payments</span> Application Fee
                    </h3>
                    <p className="text-text-body font-bold">{job.application_fee}</p>
                  </div>
                )}
                {job.selection_process && (
                  <div>
                    <h3 className="text-xl font-black text-charcoal uppercase italic mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined">dynamic_form</span> Selection Process
                    </h3>
                    <p className="text-text-body font-bold">{job.selection_process}</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border-2 border-charcoal p-6 rounded-2xl shadow-[8px_8px_0px_rgba(196,86,58,1)]">
                <h4 className="font-black text-charcoal uppercase italic mb-4">Quick Actions</h4>
                <div className="space-y-4">
                  {job.official_site && (
                    <a
                      href={job.official_site}
                      target="_blank"
                      className="w-full bg-primary text-white border-2 border-charcoal py-3 rounded-xl font-black text-center block hover:shadow-[4px_4px_0px_rgba(26,23,22,1)] transition-all"
                    >
                      OFFICIAL WEBSITE
                    </a>
                  )}
                  {job.apply_text && (
                    <div className="p-4 bg-sand-light border-2 border-charcoal rounded-xl text-xs font-bold text-charcoal leading-relaxed">
                      {job.apply_text}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={toggleSave}
                    className="w-full bg-white text-charcoal border-2 border-charcoal py-3 rounded-xl font-black hover:bg-sand-light flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">
                      {isSaved ? "bookmark_added" : "bookmark_add"}
                    </span>
                    {isSaved ? "Saved" : "Save for later"}
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-charcoal shadow-[6px_6px_0px_rgba(26,23,22,1)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary text-xl">event_busy</span>
                  <h4 className="font-black uppercase tracking-tight text-sm text-charcoal">
                    Last Date to Apply
                  </h4>
                </div>

                {job.last_date_text ? (
                  <p className="text-sm font-bold text-charcoal leading-relaxed">
                    {job.last_date_text}
                  </p>
                ) : (
                  <p className="text-xs font-bold text-text-muted italic">
                    No data found for last date.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
