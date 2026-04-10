import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | 24jobsalerts",
  description: "Read the terms and conditions for using 24jobsalerts.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-charcoal uppercase tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-text-body font-bold">
          By using 24jobsalerts, you agree to the terms below.
        </p>
      </div>

      <section className="bg-white border-2 border-charcoal rounded-2xl p-6 md:p-8">
        <div className="space-y-5 text-text-body font-bold leading-relaxed">
          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Content information
            </h2>
            <p className="mt-2">
              We try to keep job information accurate and up to date, but we do
              not guarantee completeness or correctness. Always verify details
              on the official website/application portal.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              External links
            </h2>
            <p className="mt-2">
              Our site may link to third-party websites. We are not responsible
              for their content, availability, or policies.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-black text-charcoal uppercase tracking-tight">
              Changes
            </h2>
            <p className="mt-2">
              We may update these terms at any time by posting changes on this
              page.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

