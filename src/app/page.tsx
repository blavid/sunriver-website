import Image from "next/image";
import Link from "next/link";
import { HighlightIcon, StatBadge } from "@/components/Icons";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button, Section, SectionTitle } from "@/components/ui";
import {
  guestReviews,
  heroImage,
  highlights,
  siteConfig,
} from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <section className="relative flex min-h-[85vh] items-end overflow-hidden">
        <Image
          src={heroImage}
          alt="Sunriver townhome deck with hot tub overlooking the golf course"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sage-950/80 via-sage-950/30 to-sage-950/20" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-cedar-300">
            Sunriver, Oregon
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Central Oregon home base
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-sage-200">
            Updated luxury townhome on the Woodlands Golf Course — hot tub, SHARC
            passes, bikes, and everything you need for an unforgettable stay.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/book" variant="cedar">
              Check Availability
            </Button>
            <Button href="/the-home" variant="secondary">
              Explore the Home
            </Button>
          </div>

          <div className="mt-12 flex gap-10 rounded-2xl bg-white/10 px-8 py-6 backdrop-blur-sm sm:gap-16">
            <StatBadge value={siteConfig.stats.guests} label="Guests" />
            <StatBadge value={siteConfig.stats.bedrooms} label="Bedrooms" />
            <StatBadge value={siteConfig.stats.bathrooms} label="Bathrooms" />
          </div>
        </div>
      </section>

      <Section className="bg-white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle
              title="Thoughtfully appointed, perfectly located"
              subtitle="Tucked between the 1st and 10th holes of the Woodlands Golf Course, our townhouse offers everything you'd expect from a luxury vacation home."
            />
            <p className="leading-relaxed text-sage-700">
              Whether you crave the serenity of the Oregon high desert or the thrill
              of outdoor adventure, our home will not disappoint. Featuring three
              bedrooms — two enormous master suites with private baths — this home
              is perfect for families or small groups vacationing together.
            </p>
            <p className="mt-4 leading-relaxed text-sage-700">
              Hit the slopes at Mt. Bachelor, just 24 minutes away, then come home
              to wind down in the hot tub. Or grab a bike from the garage and ride
              to the Village for dinner.
            </p>
            <div className="mt-8">
              <Button href="/the-home">See Full Details</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {highlights.slice(0, 4).map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-sage-100 bg-sage-50 p-5"
              >
                <HighlightIcon name={item.icon} />
                <h3 className="mt-3 font-semibold text-sage-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-sage-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionTitle
          title="What guests are saying"
          subtitle="We're proud of the experience we've created — here's what recent guests have shared."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {guestReviews.map((review) => (
            <blockquote
              key={review}
              className="rounded-2xl border border-sage-200 bg-white p-6 shadow-sm"
            >
              <p className="font-display text-lg leading-relaxed text-sage-800">
                &ldquo;{review}&rdquo;
              </p>
            </blockquote>
          ))}
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle title="Photo gallery" subtitle="47 photos of the home, deck, and surroundings." />
        <PhotoGallery limit={9} />
        <div className="mt-8 text-center">
          <Button href="/the-home#gallery">View All Photos</Button>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl bg-sage-800 px-8 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="font-display text-3xl text-white sm:text-4xl">
            Planning your Sunriver getaway?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sage-300">
            Book direct for the best rates, or browse our guest guide for local
            dining, hikes, and everything you need during your stay.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href={siteConfig.bookUrl} variant="cedar" external>
              Book Direct
            </Button>
            <Button href="/guest-guide" variant="secondary">
              Guest Guide
            </Button>
            <Button href="/activities" variant="secondary">
              Activities Guide
            </Button>
          </div>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle
          title="More than a place to stay"
          subtitle="This site is your resource before, during, and after your visit."
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Guest Guide",
              description: "WiFi, house rules, check-in info, and troubleshooting for common issues.",
              href: "/guest-guide",
            },
            {
              title: "Activities Guide",
              description: "Dining, hiking, swimming, river floats, skiing, mountain biking, and more.",
              href: "/activities#dining",
            },
            {
              title: "Hikes & Outdoors",
              description: "Trails, waterfalls, and adventures — many starting just minutes from the door.",
              href: "/activities#hiking",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-sage-200 p-6 transition-all hover:border-sage-400 hover:shadow-md"
            >
              <h3 className="font-display text-xl text-sage-900 group-hover:text-cedar-700">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sage-600">
                {card.description}
              </p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-cedar-600">
                Learn more
                <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
