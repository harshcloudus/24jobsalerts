"use client";

import Link from "next/link";
import type { Job } from "@/lib/seo";

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onToggleSaved?: (id: number) => void;
  showBookmark?: boolean;
}

function buildJobSlug(rawTitle: string, id: number) {
  const base = (rawTitle || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `/jobs/${base || "job"}-${id}`;
}

function getEmployerShortname(title: string): string {
  const clean = (title || "").trim();
  const firstWord = clean.split(/[\s\-–]/)[0] || "";
  // Use all-caps acronym as-is (e.g. "IIFCL", "NVS", "RRB")
  if (/^[A-Z]{2,5}$/.test(firstWord)) return firstWord.slice(0, 3);
  // Otherwise take first 2 words' initials
  const words = clean.split(/\s+/).filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || "")
      .join("") || "J"
  );
}

function getRelativeDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (diffDays < 0) return "";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return dateStr;
  } catch {
    return dateStr;
  }
}

// Prevents triggering a reward ad when one is already in progress
let rewardAdInProgress = false;

function isAutoAdShowing(): boolean {
  // Google adds #google_vignette to the URL when a vignette (full-screen) auto ad is active
  return window.location.hash === "#google_vignette";
}

async function navigateWithAdBreak(targetUrl: string, fallback: () => void) {
  console.log("Navigating with ad break to", targetUrl);
  if (typeof window === "undefined") {
    fallback();
    return;
  }

  // Auto ad is already visible — skip reward ad and navigate directly
  console.log("Checking for auto ads...", isAutoAdShowing());
  if (isAutoAdShowing()) {
    fallback();
    return;
  }

  // Reward ad already in progress — ignore duplicate click
  console.log("Checking for auto rewardAdInProgress...", rewardAdInProgress);
  if (rewardAdInProgress) {
    rewardAdInProgress = false; // reset flag in case it was left stuck
    return;
  }

  if (typeof (window as any).adBreak !== "function") {
    console.warn("adBreak API not available, navigating without ad...");
    fallback();
    return;
  }

  rewardAdInProgress = true;
  console.log("Triggering reward ad break for navigation to", targetUrl);
  await (window as any).adBreak({
    type: "reward",
    name: "game_start",
    beforeReward(showAdFn: (delay: number) => void) {
      console.log("Before reward callback, showing ad immediately.");
      showAdFn(0);
    },
    adDismissed() {
      console.log("Ad dismissed, showing alert and not navigating.");
      rewardAdInProgress = false;
      alert("⚠️ Please watch the full ad to play this game.");
    },
    adViewed() {
      console.log("Ad viewed, proceeding to navigate.");
    },
    adBreakDone(info: { breakStatus?: string }) {
      rewardAdInProgress = false;
      if (info && info.breakStatus === "viewed") {
        console.log("Ad viewed, proceeding to navigate.");
        window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
      } else if (info && info.breakStatus === "dismissed") {
        console.log("Ad dismissed, showing alert and not navigating.");
        alert("⚠️ Please watch the full ad to play this game.");
      } else {
        console.log(
          "Ad break done without clear status, proceeding to navigate.",
        );
        window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + targetUrl;
      }
    },
  });
}

export default function JobCard({
  job,
  isSaved = false,
  onToggleSaved,
  showBookmark = false,
}: JobCardProps) {
  const title: string = job.title || "Untitled role";
  const shortTitle = title.length > 140 ? `${title.slice(0, 137)}…` : title;
  const shortname = getEmployerShortname(title);
  const jobType: string = job.job_type || "";
  const qualification: string = job.qualification || "";
  const salary: string = job.salary || "";
  const lastDate: string = job.last_date || "";
  const postedDate: string = job.posted_date
    ? getRelativeDate(job.posted_date)
    : "";
  const jobHref = buildJobSlug(title, job.id);

  const handleCardClick = (jobHref: string) => {
    navigateWithAdBreak(
      jobHref,
      () =>
        (window.location.href = process.env.NEXT_PUBLIC_BASE_PATH + jobHref),
    );
  };

  return (
    <article
      className="job-card"
      role="button"
      tabIndex={0}
      onClick={() => handleCardClick(jobHref)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick(jobHref);
        }
      }}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* Header: employer badge + bookmark */}
      <div className="job-card-header">
        <div className="job-employer-mark" aria-hidden="true">
          {shortname}
        </div>
        {showBookmark && (
          <button
            className={`job-bookmark-btn${isSaved ? " saved" : ""}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onToggleSaved) onToggleSaved(job.id);
            }}
            aria-label={isSaved ? "Remove bookmark" : "Save job"}
          >
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: "18px",
                fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              bookmark
            </span>
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="job-card-title">{shortTitle}</h3>

      {/* Meta row */}
      <div className="job-meta-row">
        {salary ? (
          <span className="job-meta-item">
            <span className="material-symbols-rounded">payments</span>
            <span>{salary}</span>
          </span>
        ) : jobType ? (
          <span className="job-meta-item">
            <span className="material-symbols-rounded">work</span>
            <span>{jobType}</span>
          </span>
        ) : null}
        {postedDate ? (
          <span className="job-meta-item">
            <span className="material-symbols-rounded">schedule</span>
            <span>Posted {postedDate}</span>
          </span>
        ) : qualification ? (
          <span className="job-meta-item">
            <span className="material-symbols-rounded">school</span>
            <span>{qualification}</span>
          </span>
        ) : null}
      </div>

      {/* Tags — always rendered so all cards align identically */}
      <div className="job-card-tags">
        {jobType && <span className="job-tag">{jobType}</span>}
        {qualification && <span className="job-tag">{qualification}</span>}
      </div>

      {/* Footer */}
      <div className="job-card-footer">
        {lastDate ? (
          <span className="job-deadline">
            <span className="material-symbols-rounded">calendar_today</span>
            Apply by {lastDate}
          </span>
        ) : (
          <span />
        )}
        <Link
          href={jobHref}
          className="job-card-apply"
          onClick={(e) => e.stopPropagation()}
        >
          Read more
          <span className="material-symbols-rounded">arrow_forward</span>
        </Link>
      </div>
    </article>
  );
}
