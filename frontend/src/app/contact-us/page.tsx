import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with 24jobsalerts support. Reach us for feedback, corrections, or help.",
};

const SUPPORT_EMAIL = "24jobsalert@dreamdazzly.com";

export default function ContactUsPage() {
  return (
    <div className="bg-canvas">
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
            Get in touch
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
            Contact us
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">
            For support, feedback, or corrections — email us and we'll get back
            to you as soon as possible.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div className="card-base p-5 sm:p-6 md:p-8">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
              >
                mail
              </span>
            </div>
            <div className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-1.5">
              Email
            </div>
            <a
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-primary transition-colors break-all"
              href={`mailto:${SUPPORT_EMAIL}`}
            >
              {SUPPORT_EMAIL}
            </a>
            <p className="text-sm text-text-muted mt-3 leading-relaxed">
              We typically respond within 1–2 business days.
            </p>
          </div>

          <div className="card-base p-5 sm:p-6 md:p-8">
            <div className="w-10 h-10 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
              <span
                className="material-symbols-rounded"
                style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1" }}
              >
                checklist
              </span>
            </div>
            <div className="text-xs font-semibold tracking-[0.10em] text-text-subtle uppercase mb-2">
              What to include
            </div>
            <ul className="text-sm text-text-body space-y-1.5 list-disc pl-5">
              <li>Job title and the page URL (if reporting an issue)</li>
              <li>What looks incorrect or missing</li>
              <li>Any official source link you want us to verify</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
