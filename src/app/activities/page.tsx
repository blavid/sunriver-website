import type { Metadata } from "next";
import { ActivityCard } from "@/components/ActivityCard";
import { PageHeader, PageHero, Section, SectionTitle } from "@/components/ui";
import { activitySections } from "@/lib/activities";
import { pageBackgrounds } from "@/lib/content";

export const metadata: Metadata = {
  title: "Activities Guide",
  description:
    "The best things to do in Central Oregon — dining, hiking, swimming, river floats, skiing, mountain biking, and more near Sunriver.",
};

export default function ActivitiesPage() {
  return (
    <>
      <PageHero
        src={pageBackgrounds.activities}
        alt="Activities guide background image"
        title="Central Oregon Activities Guide"
        subtitle="Our curated guide to the best dining, trails, water, snow, and adventures — all within reach of your Sunriver home base."
      />

      <div className="sticky top-[73px] z-40 border-b border-sage-200 bg-sage-50/95 backdrop-blur-md">
        <nav
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6"
          aria-label="Activity categories"
        >
          {activitySections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-200 hover:text-sage-900"
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>

      {activitySections.map((section, index) => (
        <Section
          key={section.id}
          id={section.id}
          className={index % 2 === 1 ? "bg-white" : ""}
        >
          <SectionTitle title={section.title} subtitle={section.subtitle} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {section.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </Section>
      ))}

      <Section className="bg-sage-800">
        <div className="text-center">
          <h2 className="font-display text-2xl text-white sm:text-3xl">
            Ready to explore?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sage-300">
            Your stay includes SHARC passes, bikes, and a hot tub waiting for you
            after every adventure. We&apos;re glad you&apos;re here.
          </p>
        </div>
      </Section>
    </>
  );
}
