/** Typed views of public/data. Edit those JSON files; this module has no copy of its own. */
import checkoutJson from "../../public/data/checkout.json";
import guideJson from "../../public/data/guide.json";
import pagesJson from "../../public/data/pages.json";
import siteJson from "../../public/data/site.json";
import type { CheckoutFile, GuideFile, PagesFile, SiteFile } from "./content-types";

const guide = guideJson satisfies GuideFile;
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
