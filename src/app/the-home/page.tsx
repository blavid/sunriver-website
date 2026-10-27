import type { Metadata } from "next";
import { HighlightIcon } from "@/components/Icons";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PageHero, Section, SectionTitle } from "@/components/ui";
import { amenities, highlights, houseRules, pageBackgrounds, pages, rooms } from "@/lib/content";

const theHome = pages.theHome;

export const metadata: Metadata = {
  title: theHome.metadata.title,
  description: theHome.metadata.description,
};

export default function TheHomePage() {
  return (
    <>
      <PageHero
        src={pageBackgrounds.theHome}
        alt={theHome.hero.alt}
        title={theHome.hero.title}
        subtitle={theHome.hero.subtitle}
      />

      <Section>
        <div className="prose-sage max-w-3xl space-y-4 text-base leading-relaxed text-sage-700">
          {theHome.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle title={theHome.sections.highlights} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="flex gap-4 rounded-2xl border border-sage-100 p-5">
              <HighlightIcon name={item.icon} />
              <div>
                <h3 className="font-semibold text-sage-900">{item.title}</h3>
                <p className="mt-1 text-sm text-sage-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title={theHome.sections.rooms} />
        <div className="grid gap-6 sm:grid-cols-2">
          {rooms.map((room) => (
            <div key={room.name} className="rounded-2xl border border-sage-200 bg-white p-6 shadow-sm">
              <h3 className="font-display text-xl text-sage-900">{room.name}</h3>
              <ul className="mt-4 space-y-2">
                {room.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-sage-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cedar-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="gallery" className="bg-white">
        <SectionTitle
          title={theHome.sections.galleryTitle}
          subtitle={theHome.sections.gallerySubtitle}
        />
        <PhotoGallery />
      </Section>

      <Section className="bg-white">
        <SectionTitle title={theHome.sections.amenities} />
        <div className="flex flex-wrap gap-3">
          {amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-sage-200 bg-sage-50 px-4 py-2 text-sm font-medium text-sage-700"
            >
              {amenity}
            </span>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle title={theHome.sections.houseRules} />
        <ul className="max-w-2xl space-y-3">
          {houseRules.map((rule) => (
            <li key={rule} className="flex items-start gap-3 text-sage-700">
              <svg className="mt-0.5 h-5 w-5 shrink-0 text-sage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {rule}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
