import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | 24jobsalerts",
  description:
    "Learn about 24jobsalerts — a premium job alerts portal for government and private opportunities.",
};

export default function AboutUsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-black text-charcoal uppercase tracking-tight">
          About Us
        </h1>
        <p className="mt-2 text-text-body font-bold">
          24jobsalerts is built to help you discover the right opportunities
          faster with clean, structured job listings and useful details.
        </p>
      </div>

      <section className="bg-white border-2 border-charcoal rounded-2xl p-6 md:p-8">
        <div className="space-y-5 text-text-body font-bold leading-relaxed">
          <p>
            We curate and organize job information so you can quickly understand
            eligibility, application steps, important dates, and official links.
          </p>
          <p>
            Our goal is to make job search simple, reliable, and easy to
            navigate—whether you are looking for government jobs, private jobs,
            or roles by qualification.
          </p>
          <p>
            If you have suggestions or want to report an issue with any listing,
            please reach out via our Contact Us page.
          </p>
        </div>
      </section>
    </main>
  );
}

