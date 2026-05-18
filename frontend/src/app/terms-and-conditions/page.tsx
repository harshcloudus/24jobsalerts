import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Read the terms and conditions for using 24JobsAlerts.",
};

const SECTIONS = [
  {
    heading: "Content information",
    body: "We try to keep job information accurate and up to date, but we do not guarantee completeness or correctness. Always verify details on the official website / application portal.",
  },
  {
    heading: "External links",
    body: "Our site may link to third-party websites. We are not responsible for their content, availability, or policies.",
  },
  {
    heading: "Changes",
    body: "We may update these terms at any time by posting changes on this page.",
  },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-canvas">
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
            Legal
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
            Terms &amp; conditions
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">
            By using 24JobsAlerts, you agree to the terms below.
          </p>
        </div>
      </section>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="card-base p-5 sm:p-6 md:p-10">
          <div className="divide-y divide-hairline-soft">
            {SECTIONS.map((s) => (
              <section key={s.heading} className="py-5 sm:py-6 first:pt-0 last:pb-0">
                <h2 className="text-base sm:text-lg font-semibold text-ink mb-2 tracking-tight">
                  {s.heading}
                </h2>
                <p className="text-sm sm:text-base text-text-body leading-relaxed">{s.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
