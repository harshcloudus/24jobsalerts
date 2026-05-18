import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Read the 24JobsAlerts disclaimer.",
};

export default function DisclaimerPage() {
  return (
    <div className="bg-canvas">
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
            Legal
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
            Disclaimer
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">
            Please read this disclaimer before using the site.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <article className="card-base p-5 sm:p-6 md:p-10 prose-clean text-text-body leading-relaxed">
          <p>
            24JobsAlerts is an informational portal that aggregates and
            presents job-related content. We are not affiliated with any
            government department or recruiting organization unless explicitly
            stated.
          </p>
          <p>
            Always verify job details (eligibility, fees, last date, and
            application process) on the official website before applying.
          </p>
          <p>
            We do our best to keep listings accurate and up to date, but cannot
            guarantee completeness or correctness. Use the listings as a
            starting point and confirm all details with the official source.
          </p>
        </article>
      </main>
    </div>
  );
}
