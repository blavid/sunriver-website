import type { Metadata } from "next";
import { Button, PageBackground, PageHeader, Section, SectionTitle } from "@/components/ui";
import { pageBackgrounds, siteConfig } from "@/lib/content";

export const metadata: Metadata = {
  title: "Book Your Stay",
  description:
    "Book direct for the best rates, or find us on Airbnb and VRBO. Check availability and rates on our direct booking page.",
};

export default function BookPage() {
  return (
    <PageBackground src={pageBackgrounds.book} alt="Book your stay at Sunriver Townhome">
      <PageHeader
        title="Book Your Stay"
        subtitle="We offer direct booking with live availability and rates, plus listings on Airbnb and VRBO."
      />

      <Section>
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl border-2 border-cedar-200 bg-gradient-to-br from-cedar-50 to-white p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-cedar-600">
              Recommended
            </p>
            <h2 className="mt-2 font-display text-3xl text-sage-900">Book Direct</h2>
            <p className="mt-4 leading-relaxed text-sage-700">
              Save a buck or two by booking directly with us. Our direct booking page has live availability, current rates, and instant
              booking — powered by Hosttools with the same calendar synced to Airbnb
              and VRBO. No platform service fees.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-sage-700">
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-cedar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Real-time availability & pricing
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-cedar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No platform service fees
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-5 w-5 text-cedar-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Same home, same great experience
              </li>
            </ul>
            <div className="mt-8">
              <Button href={siteConfig.bookUrl} variant="cedar" external className="w-full sm:w-auto">
                Check Availability & Book
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle
          title="Also listed on"
          subtitle="Prefer to book through a platform you're already using? Find us here."
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-sage-200 p-6">
            <h3 className="font-display text-xl text-sage-900">Airbnb</h3>
            <p className="mt-2 text-sm text-sage-600">
              View photos, reviews, and book through Airbnb&apos;s trusted platform.
            </p>
            <div className="mt-4">
              <Button href={siteConfig.airbnbUrl} variant="secondary" external>
                View on Airbnb
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-sage-200 p-6">
            <h3 className="font-display text-xl text-sage-900">VRBO</h3>
            <p className="mt-2 text-sm text-sage-600">
              View photos, reviews, and book through VRBO&apos;s trusted platform.
            </p>
            <div className="mt-4">
              <Button href={siteConfig.vrboUrl} variant="secondary" external>
                View on VRBO
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-2xl bg-sage-100 p-8 text-center sm:p-10">
          <h2 className="font-display text-2xl text-sage-900">Questions before booking?</h2>
          <p className="mx-auto mt-3 max-w-md text-sage-600">
            Happy to help with dates, group size, pet policy, or anything else.
            Check-in is at {siteConfig.checkIn}, checkout by {siteConfig.checkOut}.
          </p>
          <a
            href={`mailto:${siteConfig.host.email}`}
            className="mt-6 inline-flex text-sm font-semibold text-cedar-600 hover:text-cedar-700"
          >
            {siteConfig.host.email}
          </a>
        </div>
      </Section>
    </PageBackground>
  );
}
