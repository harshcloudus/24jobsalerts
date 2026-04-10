 "use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

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
        setMessage("Subscribed!");
        setEmail("");
      } else {
        setStatus("exists");
        setMessage("You’re already subscribed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <footer className="bg-white border-t-2 border-charcoal pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-6">
            <Image
              src={`${BASE_PATH}/24jobsalerts_logo.png`}
              alt="24jobsalerts"
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <p className="text-sm text-text-body leading-relaxed font-bold">
            Connecting talented professionals with world-class opportunities.
            Your next career milestone starts here.
          </p>
        </div>
        <div>
          <h5 className="font-black mb-6 text-charcoal uppercase text-sm">
            Company
          </h5>
          <ul className="space-y-4 text-sm text-charcoal font-bold">
            <li>
              <Link
                className="hover:text-primary transition-colors"
                href="/about-us"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-primary transition-colors"
                href="/contact-us"
              >
                Contact Us
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-primary transition-colors"
                href="/privacy-policy"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-primary transition-colors"
                href="/terms-and-conditions"
              >
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link
                className="hover:text-primary transition-colors"
                href="/disclaimer"
              >
                Disclaimer
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h5 className="font-black mb-6 text-charcoal uppercase text-sm">
            Newsletter
          </h5>
          <p className="text-xs text-text-muted mb-4 font-bold">
            Get the latest job updates weekly.
          </p>
          <div className="flex gap-2">
            <input
              className="bg-white border-2 border-charcoal rounded-lg px-3 py-2 text-sm w-full focus:ring-1 focus:ring-primary text-charcoal font-bold"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubscribe();
              }}
            />
            <button
              type="button"
              onClick={onSubscribe}
              disabled={status === "loading"}
              className="bg-primary p-2 rounded-lg text-white flex items-center justify-center hover:bg-primary-hover border-2 border-charcoal transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Subscribe to newsletter"
            >
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
          {message && (
            <div
              className={`mt-3 text-xs font-bold ${
                status === "success"
                  ? "text-green-700"
                  : status === "exists"
                  ? "text-text-muted"
                  : "text-primary"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-charcoal/10 text-center text-xs text-text-muted font-black uppercase tracking-widest">
        © 2026 24jobsalerts Premium Portal. All rights reserved.
      </div>
    </footer>
  );
}


