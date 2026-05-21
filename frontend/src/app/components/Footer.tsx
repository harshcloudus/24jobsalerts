"use client";

import Link from "@/app/components/HardLink";
import Image from "next/image";
import { useMemo, useState } from "react";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

const FOOTER_LOGO_SRC = `${BASE_PATH}/footer-logo.png`;

/** Sentence-style labels (reference: footer link columns) */
const COLUMN_EXPLORE = [
  { href: "/latest-jobs", label: "Latest jobs" },
  { href: "/all-jobs", label: "All jobs" },
  { href: "/job-types", label: "Job types" },
  { href: "/qualifications", label: "Qualifications" },
  { href: "/bookmarks", label: "Saved jobs" },
];

const COLUMN_COMPANY = [
  { href: "/about-us", label: "About us" },
  { href: "/contact-us", label: "Contact us" },
];

const COLUMN_LEGAL = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms-and-conditions", label: "Terms & conditions" },
  { href: "/disclaimer", label: "Disclaimer" },
];

/** Match reference: bold white all-caps headers, equal offset to links */
const FOOTER_COL_HEAD =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white";

function WhyUsRow({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2.5 text-[13px] leading-snug text-on-dark-muted sm:text-[14px]">
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-inset ring-primary/20"
        style={{ color: "#f5a886" }}
        aria-hidden
      >
        <span
          className="material-symbols-rounded text-[16px] leading-none select-none"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
        >
          {icon}
        </span>
      </span>
      <span className="min-w-0 flex-1">{label}</span>
    </li>
  );
}

export default function Footer() {
  const API_BASE = useMemo(
    () =>
      (process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000").replace(
        /\/$/,
        ""
      ),
    []
  );

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "exists" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubscribe = async () => {
    const value = email.trim();
    if (!value) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }

    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus("error");
        setMessage(data?.detail || "Subscription failed. Please try again.");
        return;
      }

      const data: { ok: boolean; created: boolean } = await res.json();
      if (data.created) {
        setStatus("success");
        setMessage("Subscribed — check your inbox.");
        setEmail("");
      } else {
        setStatus("exists");
        setMessage("You're already subscribed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <footer className="footer-region mt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 pb-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 md:grid-cols-12 md:gap-x-6 md:gap-y-10 lg:gap-x-8 lg:gap-y-0 lg:items-start">
          {/* Brand + newsletter */}
          <div className="min-w-0 col-span-2 sm:col-span-2 md:col-span-12 lg:col-span-4">
            <div className="flex max-w-lg flex-col gap-3">
              <Link
                href="/"
                className="group block w-fit max-w-full leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#001220] rounded-sm"
              >
                <Image
                  src={FOOTER_LOGO_SRC}
                  alt="24 Jobs Alerts"
                  width={529}
                  height={156}
                  className="block h-9 w-auto max-w-full align-top object-left object-contain sm:h-10 md:h-11 lg:h-12 transition-opacity duration-200 group-hover:opacity-95"
                  sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, 260px"
                  quality={92}
                />
              </Link>
              <p className="text-[14px] leading-relaxed text-on-dark-muted">
                One place for every government and private job alert in India —
                clean, structured listings with eligibility, deadlines, and
                official application links.
              </p>
            </div>

            <div className="mt-6 max-w-md">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                Get jobs in your inbox
              </p>
              <div className="flex min-h-[48px] w-full flex-row items-center rounded-full border border-white/[0.12] bg-white/[0.06] pl-3 pr-1 sm:pl-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/25 transition-[border-color,box-shadow] duration-200">
                <input
                  className="min-h-[48px] min-w-0 flex-1 border-0 bg-transparent py-3 text-[14px] leading-none text-white placeholder:text-white/40 focus:outline-none"
                  placeholder="your@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSubscribe();
                  }}
                  aria-label="Email for newsletter"
                  enterKeyHint="send"
                  autoComplete="email"
                />
                <button
                  type="button"
                  onClick={onSubscribe}
                  disabled={status === "loading"}
                  className="btn-primary h-10 min-h-[40px] shrink-0 rounded-full px-3.5 sm:px-5 !py-0 text-[13px] sm:text-[14px] leading-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  aria-label="Subscribe"
                >
                  {status === "loading" ? "…" : "Subscribe"}
                </button>
              </div>
              {message && (
                <div
                  className={`mt-3 rounded-md px-3 py-2 text-xs font-medium ${
                    status === "success"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : status === "exists"
                      ? "bg-white/5 text-white/70"
                      : "bg-red-500/15 text-red-300"
                  }`}
                  role="status"
                >
                  {message}
                </div>
              )}
            </div>
          </div>

          <nav className="min-w-0 order-1 md:order-none md:col-span-3 lg:col-span-2" aria-label="Explore">
            <h5 className={FOOTER_COL_HEAD}>Explore</h5>
            <ul className="flex flex-col gap-1.5">
              {COLUMN_EXPLORE.map(({ href, label }) => (
                <li key={href}>
                  <Link className="footer-link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="min-w-0 order-3 md:order-none md:col-span-3 lg:col-span-2" aria-label="Company">
            <h5 className={FOOTER_COL_HEAD}>Company</h5>
            <ul className="flex flex-col gap-1.5">
              {COLUMN_COMPANY.map(({ href, label }) => (
                <li key={href}>
                  <Link className="footer-link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="min-w-0 order-2 md:order-none md:col-span-3 lg:col-span-2" aria-label="Legal">
            <h5 className={FOOTER_COL_HEAD}>Legal</h5>
            <ul className="flex flex-col gap-1.5">
              {COLUMN_LEGAL.map(({ href, label }) => (
                <li key={href}>
                  <Link className="footer-link" href={href}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 order-4 md:order-none md:col-span-3 lg:col-span-2">
            <h5 className={FOOTER_COL_HEAD}>Why us</h5>
            <ul className="flex flex-col gap-3">
              <WhyUsRow icon="verified" label="Verified listings" />
              <WhyUsRow icon="update" label="Daily updates" />
              <WhyUsRow icon="lock" label="Privacy first" />
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row">
          <p className="text-center text-[13px] text-on-dark-muted sm:text-left">
            © {new Date().getFullYear()} 24JobsAlerts. All rights reserved.
          </p>
          <p className="text-center text-[13px] text-on-dark-muted sm:text-right">
            Made for job seekers across India.
          </p>
        </div>
      </div>
    </footer>
  );
}
