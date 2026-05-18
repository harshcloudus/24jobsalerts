import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "Read the 24JobsAlerts privacy policy and how we handle information on this website.",
};

const SECTIONS = [
  {
    heading: "Information we collect",
    body: "We may collect basic usage information (such as pages visited and approximate location derived from IP address) to improve site performance and content quality.",
  },
  {
    heading: "Cookies",
    body: "Cookies may be used to remember preferences and to measure traffic and engagement. You can disable cookies in your browser settings, but some features may not work as expected.",
  },
  {
    heading: "Advertising (Google AdSense)",
    body: "This site may display ads served by Google (including Google AdSense). Google may use cookies or similar technologies to serve and personalize ads and to measure their effectiveness.",
  },
  {
    heading: "Third-party links",
    body: "Job listings may include links to third-party websites (for example, official application portals). We are not responsible for the privacy practices of external sites.",
  },
  {
    heading: "Updates",
    body: "We may update this policy from time to time. Changes will be posted on this page.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-canvas">
      <section className="hero-band-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <div className="section-eyebrow" style={{ color: "var(--color-primary)" }}>
            Legal
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-on-dark mb-3">
            Privacy policy
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-on-dark-muted max-w-2xl">
            How we handle information when you use 24JobsAlerts.
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
