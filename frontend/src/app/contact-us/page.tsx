import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | 24jobsalerts",
  description:
    "Contact 24jobsalerts support. Reach us for feedback, corrections, or help.",
};

const SUPPORT_EMAIL = "24jobsalert@dreamdazzly.com";

export default function ContactUsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-charcoal uppercase tracking-tight">
          Contact Us
        </h1>
        <p className="mt-2 text-text-body font-bold">
          For support, feedback, or corrections, email us and we’ll get back to
          you as soon as possible.
        </p>
      </div>

      <section className="bg-white border-2 border-charcoal rounded-2xl p-6 md:p-8">
        <div className="space-y-4 text-text-body font-bold leading-relaxed">
          <div>
            <div className="text-xs text-text-muted font-black uppercase tracking-widest">
              Email
            </div>
            <a
              className="inline-flex items-center gap-2 mt-1 text-primary hover:underline font-black"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              <span className="material-symbols-outlined text-base">mail</span>
              {SUPPORT_EMAIL}
            </a>
          </div>

          <div className="pt-4 border-t border-charcoal/10">
            <div className="text-xs text-text-muted font-black uppercase tracking-widest">
              What to include
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Job title and the page URL (if reporting an issue)</li>
              <li>What looks incorrect or missing</li>
              <li>Any official source link you want us to verify</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}

