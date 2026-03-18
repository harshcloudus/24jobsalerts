 "use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();

  const linkClass = (href: string) => {
    const base = "text-sm font-bold transition-colors";
    const isActive =
      pathname === href || (href !== "/" && pathname.startsWith(href));
    const color = isActive ? "text-primary" : "text-charcoal hover:text-primary";
    const underline = isActive ? "border-b-2 border-primary pb-0.5" : "";
    return `${base} ${color} ${underline}`;
  };

  return (
    <nav className="sticky top-0 z-50 nav-solid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 text-primary">
              <span className="material-symbols-outlined text-3xl font-bold">work_history</span>
              <h1 className="text-xl font-900 tracking-tight text-charcoal">24jobsalerts</h1>
            </Link>
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
          <Link
            href="/bookmarks"
            className="bg-white text-charcoal border-2 border-charcoal px-5 py-2 rounded-lg text-sm font-bold hover:bg-sand-light transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">bookmark</span>
            Bookmarks
          </Link>
        </div>
      </div>
    </nav>
  );
}

