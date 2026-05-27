"use client";

import { useEffect, useState } from "react";
import { notifySavedJobsCookieChanged } from "@/lib/savedJobsBroadcast";

export default function SaveJobButton({ jobId }: { jobId: number }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const key = "saved_job_ids";
    const match = document.cookie.split("; ").find((row) => row.startsWith(`${key}=`));
    let saved = false;
    if (match) {
      try {
        const val = decodeURIComponent(match.split("=")[1]);
        const arr = JSON.parse(val);
        saved = Array.isArray(arr) && arr.map((v) => Number(v)).includes(jobId);
      } catch {
        saved = false;
      }
    }
    // Hydrate from a client-only source (document.cookie). Must happen after
    // mount; there is no render-time alternative without an SSR/CSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSaved(saved);
  }, [jobId]);

  const toggleSave = () => {
    if (typeof document === "undefined") return;
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
    if (arr.includes(jobId)) {
      arr = arr.filter((n) => n !== jobId);
      setIsSaved(false);
    } else {
      arr.push(jobId);
      setIsSaved(true);
    }
    const encoded = encodeURIComponent(JSON.stringify(arr));
    document.cookie = `${key}=${encoded}; path=/; max-age=${60 * 60 * 24 * 30}`;
    notifySavedJobsCookieChanged();
  };

  return (
    <button
      type="button"
      onClick={toggleSave}
      className={`btn-outline w-full justify-center ${
        isSaved ? "bg-primary-light border-primary text-primary" : ""
      }`}
    >
      <span
        className="material-symbols-rounded"
        style={{
          fontSize: "16px",
          fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0",
        }}
      >
        bookmark
      </span>
      {isSaved ? "Saved" : "Save for later"}
    </button>
  );
}
