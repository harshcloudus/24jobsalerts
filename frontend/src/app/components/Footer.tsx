import Link from "next/link";
import Image from "next/image";
import { assetUrl } from "@/lib/basePath";

export default function Footer() {
  return (
    <footer className="bg-white border-t-2 border-charcoal pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-6">
            <Image
              src={assetUrl("/24jobsalerts_logo.png")}
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
              <Link className="hover:text-primary transition-colors" href="#">
                About Us
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Contact Support
              </Link>
            </li>
            <li>
              <Link className="hover:text-primary transition-colors" href="#">
                Privacy Policy
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
            />
            <button className="bg-primary p-2 rounded-lg text-white flex items-center justify-center hover:bg-primary-hover border-2 border-charcoal transition-all">
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-charcoal/10 text-center text-xs text-text-muted font-black uppercase tracking-widest">
        © 2026 24jobsalerts Premium Portal. All rights reserved.
      </div>
    </footer>
  );
}


