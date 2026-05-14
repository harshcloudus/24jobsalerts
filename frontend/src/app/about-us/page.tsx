import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Learn about 24jobsalerts — a clean, free portal for government and private job alerts in India.",
};

export default function AboutUsPage() {
  return (
    <div className="bg-canvas">
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
            About
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
            About 24jobsalerts
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">
            A clean, free portal for government and private job alerts — built
            so you can find the right opportunity faster.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article className="card-base p-5 sm:p-6 md:p-10 prose-clean text-text-body leading-relaxed">
          <p>
            24jobsalerts curates and organizes job information so you can
            quickly understand eligibility, application steps, important dates,
            and official links — without sifting through cluttered notice
            boards or spammy job portals.
          </p>
          <p>
            Our goal is to make the job search simple, reliable, and easy to
            navigate — whether you are looking for government jobs, private
            jobs, or roles filtered by your qualification.
          </p>
          <p>
            We don't sell premium tiers, coaching, or "guaranteed selection"
            packages. Browsing every listing, bookmarking jobs, and weekly
            email alerts are completely free.
          </p>
          <p>
            If you have suggestions or want to report an issue with any
            listing, please reach out via our <a href="/contact-us">Contact Us</a> page.
          </p>
        </article>
      </main>
    </div>
  );
}
