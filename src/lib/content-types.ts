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
  /** Shown on the TV. The website does not render this. */
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

export type BookDirectIcon = "house" | "mountain" | "dining" | "pines" | "more";

export type BookDirectPerk = {
  id: string;
  label: string;
  icon: BookDirectIcon;
};

/** TV Book Direct screen. The website does not render this block. */
export type BookDirect = {
  version: number;
  headline: string[];
  banner: string;
  body: string;
  savingsText: string;
  siteUrl: string;
  bookingUrl: string;
  qrImageUrl: string;
  bookingQrImageUrl: string;
  photoUrl: string;
  photoTvUrl: string;
  perks: BookDirectPerk[];
  signOff: string;
  homePromptTitle: string;
  homePromptSub: string;
};

export type GuideFile = {
  version: number;
  siteConfig: SiteConfig;
  houseRules: string[];
  troubleshooting: TroubleshootingItem[];
  guestGuideSections: GuestGuideSection[];
  quickReference: QuickReferenceItem[];
  bookDirect: BookDirect;
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

export type SeasonRank = Partial<Record<CalendarSeason, number>>;

/** Credit for a photo added from Wikimedia Commons. Omitted on photos that were already on the site. */
export type ImageCredit = {
  author: string;
  license: string;
  licenseUrl: string;
  /** Commons file page. */
  source: string;
  /** Set when this file is not the original, for example "Resized". */
  changes?: string;
};

export type ActivityJson = {
  id: string;
  name: string;
  description: string;
  image: string;
  imageUrl: string;
  /** JPEG about 640 px on the long edge. The website does not render this. */
  imageTvUrl: string;
  imageAlt: string;
  imageCredit?: ImageCredit;
  distance?: string;
  /** Trail length when it is not already the `distance` badge. */
  trailDistance?: string;
  difficulty?: string;
  gettingThere?: string;
  season: Season[];
  seasonLabel: string;
  /** False when the display label names no season. Omitted when the label does. */
  seasonSpecified?: boolean;
  /**
   * One positive integer per calendar season. Lower sorts earlier on the TV.
   * A missing key sorts after every ranked activity. The website ignores this.
   */
  seasonRank?: SeasonRank;
  tip?: string;
  url?: string;
  /** PNG QR of `url` only. Omitted when `url` is omitted. The website does not render this. */
  qrUrl?: string;
  affiliateUrl?: string;
};

export type ActivitySectionJson = {
  id: string;
  title: string;
  subtitle?: string;
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
  imageCredit?: ImageCredit;
  distance?: string;
  season?: string;
  difficulty?: string;
  trailDistance?: string;
  gettingThere?: string;
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
