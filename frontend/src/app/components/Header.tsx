"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { assetUrl, pathnameWithoutBase } from "@/lib/basePath";

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  const linkClass = (href: string) => {
    const base = "text-sm font-bold transition-colors";
    const rel = pathnameWithoutBase(pathname);
    const isActive =
      rel === href || (href !== "/" && rel.startsWith(href));
    const color = isActive ? "text-primary" : "text-charcoal hover:text-primary";
    const underline = isActive ? "border-b-2 border-primary pb-0.5" : "";
    return `${base} ${color} ${underline}`;
  };

  return (
    <nav className="sticky top-0 z-50 nav-solid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and desktop nav */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={assetUrl("/24jobsalerts_logo.png")}
                alt="24jobsalerts"
                width={140}
                height={36}
                priority
                className="h-9 w-auto"
              />
            </Link>
            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-6">
              <Link className={linkClass("/")} href="/">
                Home
              </Link>
              <Link className={linkClass("/latest-jobs")} href="/latest-jobs">
                Latest Jobs
              </Link>
              <Link className={linkClass("/all-jobs")} href="/all-jobs">
                All Jobs
              </Link>
              <Link
                className={linkClass("/qualifications")}
                href="/qualifications"
              >
                Qualification
              </Link>
              <Link className={linkClass("/job-types")} href="/job-types">
                Job Types
              </Link>
            </div>
          </div>

          {/* Desktop bookmarks + mobile toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/bookmarks"
              className="hidden sm:flex bg-white text-charcoal border-2 border-charcoal px-5 py-2 rounded-lg text-sm font-bold hover:bg-sand-light transition-all items-center gap-1"
            >
              <span className="material-symbols-outlined text-base">
                bookmark
              </span>
              Bookmarks
            </Link>
            {/* Mobile hamburger */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-9 h-9 border-2 border-charcoal rounded-lg bg-white text-charcoal"
              onClick={() => setIsOpen((open) => !open)}
              aria-label="Toggle navigation"
            >
              <span className="material-symbols-outlined text-lg">
                {isOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden pb-3 border-t border-charcoal/10">
            <div className="flex flex-col gap-2 pt-3">
              <Link className={linkClass("/")} href="/" onClick={closeMenu}>
                Home
              </Link>
              <Link
                className={linkClass("/latest-jobs")}
                href="/latest-jobs"
                onClick={closeMenu}
              >
                Latest Jobs
              </Link>
              <Link
                className={linkClass("/all-jobs")}
                href="/all-jobs"
                onClick={closeMenu}
              >
                All Jobs
              </Link>
              <Link
                className={linkClass("/qualifications")}
                href="/qualifications"
                onClick={closeMenu}
              >
                Qualification
              </Link>
              <Link
                className={linkClass("/job-types")}
                href="/job-types"
                onClick={closeMenu}
              >
                Job Types
              </Link>
              <Link
                href="/bookmarks"
                className="mt-1 bg-white text-charcoal border-2 border-charcoal px-4 py-2 rounded-lg text-sm font-bold hover:bg-sand-light transition-all flex items-center gap-1 w-max"
                onClick={closeMenu}
              >
                <span className="material-symbols-outlined text-base">
                  bookmark
                </span>
                Bookmarks
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

