"use client";

import Link from "@/app/components/HardLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SAVED_JOBS_COOKIE_CHANGED } from "@/lib/savedJobsBroadcast";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/latest-jobs", label: "Latest Jobs" },
  { href: "/all-jobs", label: "All Jobs" },
  { href: "/job-types", label: "Job Types" },
  { href: "/qualifications", label: "Qualification" },
];

const SAVED_JOB_IDS_COOKIE = "saved_job_ids";

function readSavedJobIdsCount(): number {
  if (typeof document === "undefined") return 0;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${SAVED_JOB_IDS_COOKIE}=`));
  if (!match) return 0;
  try {
    const val = decodeURIComponent(match.split("=")[1]);
    const parsed = JSON.parse(val);
    if (!Array.isArray(parsed)) return 0;
    return parsed.map((v) => Number(v)).filter((n) => !Number.isNaN(n)).length;
  } catch {
    return 0;
  }
}

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setSavedCount(readSavedJobIdsCount());
    sync();
    const onFocus = () => sync();
    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(SAVED_JOBS_COOKIE_CHANGED, sync);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(SAVED_JOBS_COOKIE_CHANGED, sync);
    };
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="sticky top-0 z-50 nav-solid transition-shadow duration-300"
      style={{ boxShadow: scrolled ? "0 1px 12px rgba(0,30,43,0.06)" : undefined }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 min-w-0 gap-1.5 sm:gap-3">
          {/* Logo + desktop nav — links follow the logo closely */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink min-w-0"
            onClick={closeMenu}
          >
            <Image
              src={`${BASE_PATH}/24jobsalerts_logo.png`}
              alt="24JobsAlerts"
              width={140}
              height={36}
              priority
              className="h-7 sm:h-8 w-auto max-w-[140px]"
            />
          </Link>

          <div className="hidden md:flex items-center gap-0 lg:gap-1 pl-2 lg:pl-4 min-w-0">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link-pill ${isActive(href) ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side — bookmark circle + CTA (no search) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0 ml-auto">
            <Link
              href="/bookmarks"
              className={`header-icon-btn${isActive("/bookmarks") ? " border-primary/40" : ""}`}
              aria-label={
                savedCount > 0
                  ? `Saved jobs, ${savedCount} saved`
                  : "Saved jobs"
              }
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0" }}
              >
                bookmark
              </span>
              {savedCount > 0 ? (
                <span className="header-icon-btn-badge" aria-hidden="true">
                  {savedCount > 99 ? "99+" : savedCount}
                </span>
              ) : null}
            </Link>

            <Link href="/latest-jobs" className="btn-primary header-cta">
              <span className="header-cta-label">Browse jobs</span>
              <span className="material-symbols-rounded header-cta-arrow" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-hairline-strong bg-canvas text-ink hover:bg-surface transition-colors shrink-0"
              onClick={() => setIsOpen((o) => !o)}
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>
                {isOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-[420px] opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pt-2 border-t border-hairline flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={closeMenu}
                className={`flex items-center justify-between px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive(href)
                    ? "bg-primary-light text-primary"
                    : "text-text-body hover:bg-surface hover:text-ink"
                }`}
              >
                {label}
                <span
                  className="material-symbols-rounded opacity-60"
                  style={{ fontSize: "16px" }}
                >
                  chevron_right
                </span>
              </Link>
            ))}

            <Link
              href="/bookmarks"
              onClick={closeMenu}
              className={`flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                isActive("/bookmarks")
                  ? "bg-primary-light text-primary"
                  : "text-text-body hover:bg-surface hover:text-ink"
              }`}
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}
              >
                bookmark
              </span>
              Saved Jobs
            </Link>

            <Link
              href="/latest-jobs"
              onClick={closeMenu}
              className="mt-3 btn-primary justify-center"
            >
              Browse jobs
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
