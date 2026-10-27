export const SEASONS = ["winter", "spring", "summer", "fall", "year-round"] as const;

export type Season = (typeof SEASONS)[number];

export type CalendarSeason = Exclude<Season, "year-round">;

export type ImageRef = {
  src: string;
  url: string;
};

export type Host = {
  name: string;
  email: string;
  /** No phone number is published on the site. Null until the host adds one. */
  phone: string | null;
};

export type SiteConfig = {
  name: string;
  tagline: string;
  domain: string;
  bookUrl: string;
  airbnbUrl: string;
  vrboUrl: string;
  host: Host;
  stats: {
    guests: number;
    bedrooms: number;
    bathrooms: number;
  };
  checkIn: string;
  checkOut: string;
};

export type TroubleshootingItem = {
  issue: string;
  steps: string[];
};

export type GuestGuideSection = {
  title: string;
  items: string[];
};

export type QuickReferenceItem = {
  label: string;
  value: string;
};

export type Hike = {
  name: string;
  difficulty: string;
  distance: string;
  description: string;
  gettingThere: string;
  tip: string;
};

export type GuideFile = {
  version: number;
  siteConfig: SiteConfig;
  houseRules: string[];
  troubleshooting: TroubleshootingItem[];
  guestGuideSections: GuestGuideSection[];
  quickReference: QuickReferenceItem[];
  hikes: Hike[];
};

export type Highlight = {
  title: string;
  description: string;
  icon: string;
};

export type Room = {
  name: string;
  features: string[];
};

export type NavLink = {
  href: string;
  label: string;
};

export type SiteFile = {
  version: number;
  heroImage: ImageRef;
  pageBackgrounds: {
    home: ImageRef;
    theHome: ImageRef;
    guestGuide: ImageRef;
    book: ImageRef;
    activities: ImageRef;
  };
  photos: ImageRef[];
  highlights: Highlight[];
  guestReviews: string[];
  rooms: Room[];
  amenities: string[];
  navLinks: NavLink[];
};

export type ActivityJson = {
  id: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  imageAlt: string;
  distance?: string;
  season: Season[];
  seasonLabel: string;
  /** False when the display label names no season. Omitted when the label does. */
  seasonSpecified?: boolean;
  tip?: string;
  url?: string;
  affiliateUrl?: string;
};

export type ActivitySectionJson = {
  id: string;
  title: string;
  subtitle?: string;
  /** Lower number sorts earlier for that season. Omitted seasons keep source order. */
  seasonPriority?: Partial<Record<CalendarSeason, number>>;
  activities: ActivityJson[];
};

export type ActivitiesFile = {
  version: number;
  activitySections: ActivitySectionJson[];
};

/** Fields the website cards render. `season` here is the display label. */
export type Activity = {
  id: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  distance?: string;
  season?: string;
  tip?: string;
  url?: string;
  affiliateUrl?: string;
};

export type ActivitySection = {
  id: string;
  title: string;
  subtitle?: string;
  activities: Activity[];
};

export type CheckoutFile = {
  version: number;
  checkIn: string;
  checkOut: string;
  summary: string;
  steps: string[];
};

export type PagesFile = {
  version: number;
  metadata: {
    title: { default: string; template: string };
    description: string;
    keywords: string[];
    openGraph: {
      title: string;
      description: string;
      url: string;
      siteName: string;
      locale: string;
      type: string;
    };
  };
  header: { brandSubtitle: string; bookNow: string };
  footer: {
    blurb: string;
    exploreHeading: string;
    bookHeading: string;
    directBooking: string;
    airbnb: string;
    vrbo: string;
    hostedBy: string;
  };
  photoGallery: { altPrefix: string; moreLabel: string };
  home: {
    hero: {
      imageAlt: string;
      eyebrow: string;
      title: string;
      subtitle: string;
      primaryCta: string;
      secondaryCta: string;
    };
    stats: { guests: string; bedrooms: string; bathrooms: string };
    intro: { title: string; subtitle: string; paragraphs: string[]; cta: string };
    reviews: { title: string; subtitle: string };
    gallery: { title: string; subtitle: string; cta: string; previewLimit: number };
    booking: {
      title: string;
      body: string;
      bookDirect: string;
      guestGuide: string;
      activities: string;
    };
    resources: {
      title: string;
      subtitle: string;
      learnMore: string;
      cards: { title: string; description: string; href: string }[];
    };
  };
  theHome: {
    metadata: { title: string; description: string };
    hero: { alt: string; title: string; subtitle: string };
    intro: string[];
    sections: {
      highlights: string;
      rooms: string;
      galleryTitle: string;
      gallerySubtitle: string;
      amenities: string;
      houseRules: string;
    };
  };
  guestGuide: {
    metadata: { title: string; description: string };
    hero: { alt: string; title: string; subtitle: string };
    quickReference: { title: string; subtitle: string };
    troubleshooting: { title: string; subtitle: string };
    help: { title: string; body: string; contactPrefix: string };
  };
  activities: {
    metadata: { title: string; description: string };
    hero: { alt: string; title: string; subtitle: string };
    navLabel: string;
    closing: { title: string; body: string };
  };
};
