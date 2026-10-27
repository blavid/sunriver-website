/** Typed views of public/data. Edit those JSON files; this module has no copy of its own. */
import checkoutJson from "../../public/data/checkout.json";
import guideJson from "../../public/data/guide.json";
import pagesJson from "../../public/data/pages.json";
import siteJson from "../../public/data/site.json";
import type { BookDirect, CheckoutFile, GuideFile, PagesFile, SiteFile } from "./content-types";

const BOOK_DIRECT_ICONS = new Set<string>(["house", "mountain", "dining", "pines", "more"]);

type GuideJson = Omit<GuideFile, "bookDirect"> & {
  bookDirect: Omit<BookDirect, "perks"> & {
    perks: { id: string; label: string; icon: string }[];
  };
};

function loadGuide(file: GuideJson): GuideFile {
  if (file.bookDirect.headline.length < 1 || file.bookDirect.headline.length > 3) {
    throw new Error("bookDirect.headline must be 1 to 3 lines");
  }
  if (file.bookDirect.bookingUrl !== file.siteConfig.bookUrl) {
    throw new Error("bookDirect.bookingUrl must match siteConfig.bookUrl");
  }
  for (const perk of file.bookDirect.perks) {
    if (!BOOK_DIRECT_ICONS.has(perk.icon)) {
      throw new Error(`Invalid bookDirect icon "${perk.icon}"`);
    }
  }
  return file as GuideFile;
}

const guide = loadGuide(guideJson satisfies GuideJson);
const site = siteJson satisfies SiteFile;

export const pages = pagesJson satisfies PagesFile;
export const checkout = checkoutJson satisfies CheckoutFile;

export const siteConfig = guide.siteConfig;
export const houseRules = guide.houseRules;
export const troubleshooting = guide.troubleshooting;
export const guestGuideSections = guide.guestGuideSections;
export const quickReference = guide.quickReference;

export const heroImage = site.heroImage.src;
export const pageBackgrounds = {
  home: site.pageBackgrounds.home.src,
  theHome: site.pageBackgrounds.theHome.src,
  guestGuide: site.pageBackgrounds.guestGuide.src,
  book: site.pageBackgrounds.book.src,
  activities: site.pageBackgrounds.activities.src,
};
export const photos = site.photos.map((photo) => photo.src);
export const highlights = site.highlights;
export const guestReviews = site.guestReviews;
export const rooms = site.rooms;
export const amenities = site.amenities;
export const navLinks = site.navLinks;
