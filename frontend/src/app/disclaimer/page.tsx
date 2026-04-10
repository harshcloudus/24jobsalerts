import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | 24jobsalerts",
  description: "Read the 24jobsalerts disclaimer.",
};

export default function DisclaimerPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-charcoal uppercase tracking-tight">
          Disclaimer
        </h1>
        <p className="mt-2 text-text-body font-bold">
          Please read this disclaimer before using the site.
        </p>
      </div>

      <section className="bg-white border-2 border-charcoal rounded-2xl p-6 md:p-8">
        <div className="space-y-5 text-text-body font-bold leading-relaxed">
          <p>
            24jobsalerts is an informational portal that aggregates and presents
            job-related content. We are not affiliated with any government
            department or recruiting organization unless explicitly stated.
          </p>
          <p>
            Always verify job details (eligibility, fees, last date, and
            application process) on the official website before applying.
          </p>
        </div>
      </section>
    </main>
  );
}

