"use client";

import Link from "next/link";

interface JobCardProps {
  job: any;
  isSaved?: boolean;
  onToggleSaved?: (id: number) => void;
  showBookmark?: boolean;
}

export default function JobCard({
  job,
  isSaved = false,
  onToggleSaved,
  showBookmark = false,
}: JobCardProps) {
  const title: string = job.title || "Untitled role";
  const shortTitle = title.length > 70 ? `${title.slice(0, 67)}...` : title;
  const rawCategory = job.category as string | null;
  const badgeText =
    rawCategory === "structured_job"
      ? "Job"
      : rawCategory === "article"
      ? "Article"
      : rawCategory || "Job";
  const jobType = job.job_type || "Not specified";
  const qualificationText = job.qualification || "Not specified";

  const buildJobSlug = (rawTitle: string, id: number) => {
    const base = (rawTitle || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return `/jobs/${base || "job"}-${id}`;
  };

  return (
    <article className="bg-white border-2 border-charcoal p-5 rounded-2xl hover:-translate-y-1 hover:shadow-[6px_6px_0px_rgba(26,23,22,1)] transition-all flex flex-col justify-between group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-xl border-2 border-charcoal">
            {shortTitle.charAt(0).toUpperCase()}
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
            <span className="uppercase tracking-widest text-[10px] text-charcoal mr-1">
              JOB TYPE:
            </span>
            {jobType}
          </p>
          <p>
            <span className="uppercase tracking-widest text-[10px] text-charcoal mr-1">
              QUALIFICATION:
            </span>
            {qualificationText}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t-2 pt-4 border-charcoal/10 mt-4">
        {showBookmark ? (
          <button
            className="text-charcoal hover:text-primary transition-colors flex items-center justify-center"
            type="button"
            onClick={() => onToggleSaved && onToggleSaved(job.id)}
            aria-label={isSaved ? "Remove bookmark" : "Save bookmark"}
          >
            <span className="material-symbols-outlined">
              {isSaved ? "bookmark_added" : "bookmark_add"}
            </span>
          </button>
        ) : (
          <span />
        )}
        <Link
          href={buildJobSlug(title, job.id)}
          className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-6 py-2 rounded-lg font-black text-sm border-2 border-charcoal transition-all"
        >
          DETAILS
        </Link>
      </div>
    </article>
  );
}

