import type { Metadata } from "next";
import { PageHeader, Section, SectionTitle } from "@/components/ui";
import { guestGuideSections, siteConfig, troubleshooting } from "@/lib/content";

export const metadata: Metadata = {
  title: "Guest Guide",
  description:
    "Everything you need for your stay — check-in info, house rules, WiFi, SHARC passes, and troubleshooting tips.",
};

export default function GuestGuidePage() {
  return (
    <>
      <PageHeader
        title="Guest Guide"
        subtitle="Everything you need before, during, and after your stay. Save this page for quick reference."
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          {guestGuideSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-sage-200 bg-white p-6 shadow-sm">
              <h2 className="font-display text-xl text-sage-900">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-sage-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cedar-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle
          title="Quick reference"
          subtitle="The essentials at a glance."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Check-in", value: siteConfig.checkIn },
            { label: "Check-out", value: siteConfig.checkOut },
            { label: "WiFi", value: "See note on wall in kitchen" },
            { label: "SHARC passes", value: "8 passes hanging in the entry" },
            { label: "Bikes", value: "Garage — helmets on hooks" },
            { label: "Hot tub", value: "Back deck — cover when done" },
            { label: "Trash day", value: "Collection on Thursday morning" },
            { label: "Emergency", value: "Call or text Blake" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-sage-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-sage-500">
                {item.label}
              </p>
              <p className="mt-1 font-medium text-sage-900">{item.value}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="Troubleshooting"
          subtitle="Common issues and how to fix them. Still stuck? Reach out anytime — we're here to help."
        />
        <div className="space-y-4">
          {troubleshooting.map((item) => (
            <details
              key={item.issue}
              className="group rounded-2xl border border-sage-200 bg-white shadow-sm"
            >
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-sage-900 marker:content-none">
                {item.issue}
                <svg
                  className="h-5 w-5 shrink-0 text-sage-400 transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <ol className="border-t border-sage-100 px-6 py-4">
                {item.steps.map((step, i) => (
                  <li key={step} className="flex gap-3 py-2 text-sm leading-relaxed text-sage-700">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-sage-600">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </Section>

      <Section className="bg-sage-800">
        <div className="text-center">
          <h2 className="font-display text-2xl text-white sm:text-3xl">Need help?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sage-300">
            We&apos;re immediately available to handle anything that may arise. We have
            a network of professionals available 24/7 for household emergencies.
          </p>
          <a
            href={`mailto:${siteConfig.host.email}`}
            className="mt-6 inline-flex rounded-full bg-cedar-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cedar-500"
          >
            Contact {siteConfig.host.name}
          </a>
        </div>
      </Section>
    </>
  );
}
