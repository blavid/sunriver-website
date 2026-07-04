import type { Metadata } from "next";
import { HighlightIcon } from "@/components/Icons";
import { PhotoGallery } from "@/components/PhotoGallery";
import { PageBackground, PageHeader, Section, SectionTitle } from "@/components/ui";
import { amenities, highlights, houseRules, pageBackgrounds, rooms } from "@/lib/content";

export const metadata: Metadata = {
  title: "The Home",
  description:
    "3 bedrooms, 3 baths, hot tub, SHARC passes, bikes, and smart home features. Full details on our Sunriver Eaglewood townhome.",
};

export default function TheHomePage() {
  return (
    <PageBackground src={pageBackgrounds.theHome} alt="The home background image">
      <PageHeader
        title="The Home"
        subtitle="Updated 2 master suites, hot tub, SHARC passes, and bikes — everything you need for a luxury Sunriver stay."
      />

      <Section>
        <div className="prose-sage max-w-3xl space-y-4 text-base leading-relaxed text-sage-700">
          <p>
            Enjoy all that Central Oregon offers from the comfort and convenience of
            our well-appointed, newly updated home. Tucked between the 1st and 10th
            holes of the Woodlands Golf course, our townhouse offers everything you
            would expect from a luxury vacation home.
          </p>
          <p>
            Featuring three bedrooms, two of which are enormous master suites with
            full private baths, this home is perfect for a large family or small
            family groups vacationing together. The well-appointed kitchen features
            all of the cooking, serving, and eating utensils you&apos;ll need for any
            family feast.
          </p>
          <p>
            The large, open-concept living area is perfect for socializing, eating,
            and enjoying the big screen TV or gathering together to play a game or
            work on a jigsaw puzzle.
          </p>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle title="What people love" />
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
        <SectionTitle title="Rooms & layout" />
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

      <Section className="bg-white">
        <SectionTitle title="Amenities" />
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
        <SectionTitle title="House rules" />
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

      <Section id="gallery" className="bg-white">
        <SectionTitle title="Photo gallery" subtitle="Every corner of the home, inside and out." />
        <PhotoGallery />
      </Section>
    </PageBackground>
  );
}
