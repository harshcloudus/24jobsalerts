import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | 24jobsalerts",
  description:
    "Read the 24jobsalerts privacy policy and how we handle information on this website.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-charcoal uppercase tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-text-body font-bold">
          This Privacy Policy explains how we handle information when you use
          24jobsalerts.
        </p>
      </div>

      <section className="bg-white border-2 border-charcoal rounded-2xl p-6 md:p-8">
        <div className="space-y-5 text-text-body font-bold leading-relaxed">
          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Information we collect
            </h2>
            <p className="mt-2">
              We may collect basic usage information (such as pages visited and
              approximate location derived from IP address) to improve site
              performance and content quality.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Cookies
            </h2>
            <p className="mt-2">
              Cookies may be used to remember preferences and to measure traffic
              and engagement. You can disable cookies in your browser settings,
              but some features may not work as expected.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Advertising (Google AdSense)
            </h2>
            <p className="mt-2">
              This site may display ads served by Google (including Google
              AdSense). Google may use cookies or similar technologies to serve
              and personalize ads and to measure their effectiveness.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Third-party links
            </h2>
            <p className="mt-2">
              Job listings may include links to third-party websites (for
              example, official application portals). We are not responsible for
              the privacy practices of external sites.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Updates
            </h2>
            <p className="mt-2">
              We may update this policy from time to time. Changes will be
              posted on this page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

