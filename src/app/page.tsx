import Image from "next/image";
import Link from "next/link";
import { HighlightIcon, StatBadge } from "@/components/Icons";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button, Section, SectionTitle } from "@/components/ui";
import { guestReviews, heroImage, highlights, pages, siteConfig } from "@/lib/content";

export default function HomePage() {
  const home = pages.home;

  return (
    <>
      <section className="relative flex min-h-[85vh] items-end overflow-hidden">
        <Image
          src={heroImage}
          alt={home.hero.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sage-950/80 via-sage-950/30 to-sage-950/20" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-32 sm:px-6 sm:pb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-cedar-300">
            {home.hero.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            {home.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-sage-200">
            {home.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/book" variant="cedar">
              {home.hero.primaryCta}
            </Button>
            <Button href="/the-home" variant="secondary">
              {home.hero.secondaryCta}
            </Button>
          </div>

          <div className="mt-12 flex gap-10 rounded-2xl bg-white/10 px-8 py-6 backdrop-blur-sm sm:gap-16">
            <StatBadge value={siteConfig.stats.guests} label={home.stats.guests} />
            <StatBadge value={siteConfig.stats.bedrooms} label={home.stats.bedrooms} />
            <StatBadge value={siteConfig.stats.bathrooms} label={home.stats.bathrooms} />
          </div>
        </div>
      </section>

      <Section className="bg-white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionTitle title={home.intro.title} subtitle={home.intro.subtitle} />
            {home.intro.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={index === 0 ? "leading-relaxed text-sage-700" : "mt-4 leading-relaxed text-sage-700"}
              >
                {paragraph}
              </p>
            ))}
            <div className="mt-8">
              <Button href="/the-home">{home.intro.cta}</Button>
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
        <SectionTitle title={home.reviews.title} subtitle={home.reviews.subtitle} />
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
        <SectionTitle title={home.gallery.title} subtitle={home.gallery.subtitle} />
        <PhotoGallery limit={home.gallery.previewLimit} />
        <div className="mt-8 text-center">
          <Button href="/the-home#gallery">{home.gallery.cta}</Button>
        </div>
      </Section>

      <Section>
        <div className="rounded-3xl bg-sage-800 px-8 py-12 text-center sm:px-12 sm:py-16">
          <h2 className="font-display text-3xl text-white sm:text-4xl">{home.booking.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sage-300">{home.booking.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href={siteConfig.bookUrl} variant="cedar" external>
              {home.booking.bookDirect}
            </Button>
            <Button href="/guest-guide" variant="secondary">
              {home.booking.guestGuide}
            </Button>
            <Button href="/activities" variant="secondary">
              {home.booking.activities}
            </Button>
          </div>
        </div>
      </Section>

      <Section className="bg-white">
        <SectionTitle title={home.resources.title} subtitle={home.resources.subtitle} />
        <div className="grid gap-6 sm:grid-cols-3">
          {home.resources.cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border border-sage-200 p-6 transition-all hover:border-sage-400 hover:shadow-md"
            >
              <h3 className="font-display text-xl text-sage-900 group-hover:text-cedar-700">
                {card.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sage-600">{card.description}</p>
              <span className="mt-4 inline-flex items-center text-sm font-semibold text-cedar-600">
                {home.resources.learnMore}
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
