import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { compareSeasonRank } from "../src/lib/season-order.ts";
import { normalizeHtml, ROUTES } from "./normalize-html.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "public/data");

const SEASONS = ["winter", "spring", "summer", "fall", "year-round"];
const CALENDAR = ["winter", "spring", "summer", "fall"];
const SECTION_ORDER = [
  "guided-tours-and-activities",
  "dining",
  "hiking",
  "swimming",
  "river-floats",
  "skiing-snowboarding",
  "mountain-biking",
  "scenic-adventures",
  "golf-family",
];

function readJson(name) {
  const file = path.join(dataDir, name);
  const text = fs.readFileSync(file, "utf8");
  assert.equal(text.endsWith("\n"), true, `${name} should end with a newline`);
  return JSON.parse(text);
}

function absoluteUrl(sitePath, domain) {
  const encoded = sitePath
    .split("/")
    .map((part, index) => (index === 0 ? "" : encodeURIComponent(part)))
    .join("/");
  return `https://${domain}${encoded}`;
}

function assertImage(image, domain, label) {
  assert.equal(typeof image.src, "string", label);
  assert.ok(image.src.startsWith("/"), label);
  assert.equal(image.url, absoluteUrl(image.src, domain), label);
}

function walk(value, visit) {
  visit(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) walk(item, visit);
  }
}

const guide = readJson("guide.json");
const site = readJson("site.json");
const activities = readJson("activities.json");
const checkout = readJson("checkout.json");
const pages = readJson("pages.json");

test("every content file has an integer version", () => {
  for (const file of [guide, site, activities, checkout, pages]) {
    assert.equal(typeof file.version, "number");
    assert.ok(Number.isInteger(file.version) && file.version >= 1);
  }
});

test("JSON has no secretRef placeholders", () => {
  for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
    if (entry.isDirectory()) continue;
    assert.equal(entry.name.endsWith(".json"), true, entry.name);
    const text = fs.readFileSync(path.join(dataDir, entry.name), "utf8");
    assert.equal(text.includes("secretRef"), false, entry.name);
    walk(JSON.parse(text), (value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        assert.equal(Object.hasOwn(value, "secretRef"), false);
      }
    });
  }
});

test("guide.json matches the guest-guide contract", () => {
  assert.equal(guide.siteConfig.stats.guests, 9);
  assert.equal(guide.siteConfig.stats.bedrooms, 3);
  assert.equal(guide.siteConfig.stats.bathrooms, 3);
  assert.equal(guide.siteConfig.host.phone, "503-475-0157");
  assert.equal(typeof guide.siteConfig.host.name, "string");
  assert.ok(guide.siteConfig.host.name.length > 0);
  assert.ok(guide.siteConfig.host.email.includes("@"));
  assert.equal(guide.houseRules.length, 6);
  assert.equal(guide.troubleshooting.length, 13);
  assert.equal(guide.guestGuideSections.length, 3);
  assert.equal(Object.hasOwn(guide, "hikes"), false);
  assert.equal(guide.quickReference.length, 8);

  const checkIn = guide.quickReference.find((item) => item.label === "Check-in");
  const checkOut = guide.quickReference.find((item) => item.label === "Check-out");
  assert.equal(checkIn.value, guide.siteConfig.checkIn);
  assert.equal(checkOut.value, guide.siteConfig.checkOut);
  assert.equal(
    guide.quickReference.find((item) => item.label === "WiFi").value,
    "See note on wall in kitchen",
  );

  for (const item of guide.troubleshooting) {
    assert.equal(typeof item.issue, "string");
    assert.ok(item.steps.length > 0);
    for (const step of item.steps) assert.equal(typeof step, "string");
  }

  const trash = guide.troubleshooting.find((item) => item.issue === "Where do I put the trash and recycling?");
  assert.deepEqual(trash.steps, [
    "Trash and recycling bins are located on the front porch in the trash closet.",
    "Please separate recyclables from trash. Trash is on the left, recycling on the right.",
    "Glass bottles and jars should be rinsed and placed in the recycling bin. Please do not put glass in the trash or with the mixed recyclables.",
  ]);
  const during = guide.guestGuideSections.find((section) => section.title === "During Your Stay");
  assert.equal(
    during.items.find((item) => item.includes("Trash")),
    trash.steps.join(" "),
  );

  const wifi = guide.troubleshooting.find((item) => item.issue === "WiFi not connecting");
  const lock = guide.troubleshooting.find((item) => item.issue === "How do I lock the bikes?");
  assert.ok(wifi);
  assert.ok(lock);
  assert.ok(wifi.steps.length >= 2);
  assert.ok(lock.steps.length >= 2);
});

test("site.json image pointers are site paths plus absolute URLs", () => {
  const domain = guide.siteConfig.domain;
  assertImage(site.heroImage, domain, "hero");
  for (const [key, image] of Object.entries(site.pageBackgrounds)) {
    assertImage(image, domain, key);
  }
  assert.equal(site.pageBackgrounds.home.src, site.heroImage.src);
  assert.ok(site.photos.length > 0);
  for (const image of site.photos) assertImage(image, domain, image.src);
  assert.equal(site.highlights.length, 6);
  assert.equal(site.rooms.length, 6);
  assert.equal(site.navLinks.length, 5);
});

test("activities.json seasons, labels, and TV sort hints", () => {
  assert.deepEqual(
    activities.activitySections.map((section) => section.id),
    SECTION_ORDER,
  );

  let count = 0;
  for (const section of activities.activitySections) {
    assert.equal(typeof section.title, "string");
    assert.equal(Object.hasOwn(section, "seasonPriority"), false, section.id);
    for (const activity of section.activities) {
      count += 1;
      assert.ok(Array.isArray(activity.season) && activity.season.length > 0, activity.id);
      for (const season of activity.season) assert.ok(SEASONS.includes(season), activity.id);
      if (activity.season.includes("year-round")) {
        assert.deepEqual(activity.season, ["year-round"], activity.id);
      }
      assert.equal(typeof activity.seasonLabel, "string");
      assert.ok(activity.seasonLabel.length > 0, activity.id);
      assert.equal(typeof activity.image, "string", activity.id);
      assert.ok(activity.image.startsWith("/"), activity.id);
      assert.equal(typeof activity.imageAlt, "string");
      assert.ok(activity.imageAlt.length > 0, activity.id);
      assert.equal(
        activity.imageUrl,
        absoluteUrl(activity.image, guide.siteConfig.domain),
        activity.id,
      );
      assert.equal(fs.existsSync(path.join(root, "public", activity.image)), true, activity.image);
      assert.equal(Object.keys(activity.seasonRank).length, 4, activity.id);
      for (const season of CALENDAR) {
        const rank = activity.seasonRank[season];
        assert.equal(Number.isInteger(rank) && rank >= 1, true, `${activity.id} ${season}`);
      }
      if (activity.seasonSpecified === false) {
        assert.deepEqual(activity.season, CALENDAR, activity.id);
      } else {
        assert.equal(activity.seasonSpecified, undefined, activity.id);
      }
    }
  }

  assert.equal(count, 66);
  const hiking = activities.activitySections.find((section) => section.id === "hiking");
  assert.deepEqual(
    hiking.activities.map((activity) => activity.id),
    [
      "benham-falls",
      "deschutes-river-trail",
      "smith-rock",
      "green-lakes",
      "todd-lake-loop",
      "tam-mcarthur-rim",
      "tumalo-falls",
      "lava-butte",
    ],
  );
  assert.equal(hiking.activities.find((activity) => activity.id === "lava-butte").distance, "10 min drive");

  const flat = activities.activitySections.flatMap((section) =>
    section.activities.map((activity) => ({ activity, sectionId: section.id })),
  );
  for (const season of CALENDAR) {
    const ranks = flat.map((item) => item.activity.seasonRank[season]);
    assert.equal(new Set(ranks).size, ranks.length, season);
  }
  const bySeason = (season) =>
    [...flat].sort((a, b) =>
      compareSeasonRank(season, a.activity, b.activity, flat.indexOf(a), flat.indexOf(b)),
    );
  assert.equal(bySeason("winter")[0].sectionId, "skiing-snowboarding");
  assert.equal(bySeason("summer")[0].sectionId, "river-floats");
  const unranked = { id: "new", seasonRank: { winter: 15 } };
  const sorted = [unranked, { id: "early", seasonRank: { winter: 10 } }, { id: "late" }]
    .map((activity, index) => ({ activity, index }))
    .sort((a, b) => compareSeasonRank("winter", a.activity, b.activity, a.index, b.index))
    .map((item) => item.activity.id);
  assert.deepEqual(sorted, ["early", "new", "late"]);

  const chocolate = flat.find((item) => item.activity.id === "chocolate-tour").activity;
  assert.equal(chocolate.url.endsWith(" "), false);
  assert.equal(chocolate.url.endsWith("medium=link"), true);
  const unspecified = activities.activitySections
    .flatMap((section) => section.activities)
    .filter((activity) => activity.seasonSpecified === false)
    .map((activity) => activity.id);
  assert.deepEqual(unspecified, ["rio-sol", "century-common-taps-and-trucks"]);
});

const LEGACY_ACTIVITY_IMAGES = new Set([
  "/images/photos/activities/Viator/RideTheRiverEbike.jpg",
  "/images/photos/activities/Viator/DeschutesEbike.jpg",
  "/images/photos/activities/Viator/CascadeLakesKayak.jpg",
  "/images/photos/activities/Viator/HighCascadesATV.jpg",
  "/images/photos/activities/Viator/DeschutesHorseRide.jpg",
  "/images/photos/activities/Viator/MoonlightCanoe.jpg",
  "/images/photos/activities/Viator/LavaTubeTour.jpg",
  "/images/photos/activities/Viator/LimitedLavaTube.jpg",
  "/images/photos/activities/Viator/AlpacaPicnic.jpg",
  "/images/photos/activities/Viator/ChocolateTour.jpg",
  "/images/photos/activities/Viator/FoodTruckBrewery.jpg",
  "/images/photos/activities/Viator/CraftBreweryTour.jpg",
  "/images/photos/activities/Viator/ScavengerHunt.jpg",
  "/images/photos/activities/Viator/NightSkyPhotoTour.jpg",
  "/images/photos/activities/Viator/PhotoTutoring.jpg",
  "/images/photos/activities/Viator/StreetPhotoTour.jpg",
  "/images/photos/activities/Viator/PaddleBoardHappyHour.jpg",
  "/images/photos/activities/Viator/MurderMystery.jpg",
  "/images/photos/activities/Dining/HotLavaBakery.jpeg",
  "/images/photos/activities/Dining/SparrowBakery.jpg",
  "/images/photos/activities/Dining/RioSol.jpg",
  "/images/photos/activities/Dining/ElCaporal.jpg",
  "/images/photos/activities/Dining/BlondiesPizza.jpeg",
  "/images/photos/activities/Dining/VillageBarAndGrill.jpg",
  "/images/photos/activities/Dining/TheWallow.jpg",
  "/images/photos/activities/Dining/CampfireCucina.jpg",
  "/images/photos/activities/Dining/CenturyCommonsTapsTrucks.jpg",
  "/images/photos/activities/Dining/JosieKsDeli.jpg",
  "/images/photos/activities/Hiking/BenhamFalls.jpeg",
  "/images/photos/activities/Hiking/smith-rock-vert.jpg",
  "/images/photos/activities/Hiking/Green-Lakes-Trail.jpg",
  "/images/photos/activities/Hiking/TamMcArthurRimTrail.jpg",
  "/images/photos/activities/Hiking/TumaloFalls.jpeg",
  "/images/photos/activities/Hiking/LavaButte.jpg",
  "/images/photos/activities/Swimming/SunriverSHARC.jpg",
  "/images/photos/activities/Swimming/ElkLakeResort.jpeg",
  "/images/photos/activities/Swimming/SparksLake.jpg",
  "/images/photos/activities/Swimming/PaulinaLake.jpg",
  "/images/photos/activities/Swimming/DevilsLake.jpg",
  "/images/photos/activities/Swimming/EaglewoodPool.jpg",
  "/images/photos/activities/Rafting/FloatDeschutes.jpg",
  "/images/photos/activities/Rafting/SunCountryTours.jpg",
  "/images/photos/activities/Rafting/BigEddy.jpeg",
  "/images/photos/activities/Rafting/SUP.jpg",
  "/images/photos/activities/Skiing/MtBachelor.jpeg",
  "/images/photos/activities/Skiing/NordicCenter.jpeg",
  "/images/photos/activities/Skiing/HoodooSkiArea.jpeg",
  "/images/photos/activities/Skiing/SummerChairLift.jpg",
  "/images/photos/activities/Biking/PhilsTrailComplex.jpg",
  "/images/photos/activities/Biking/WanogaBikeTrails.jpeg",
  "/images/photos/activities/Biking/MtBachelorBikePark.jpg",
  "/images/photos/activities/Biking/SunriverBike.jpg",
  "/images/photos/activities/Biking/tiddlywinks.jpg",
  "/images/photos/activities/DayTrips/CraterLake.jpg",
  "/images/photos/activities/DayTrips/LavaRiverCave.jpg",
  "/images/photos/activities/DayTrips/HighDesertMusuem.jpg",
  "/images/photos/activities/DayTrips/NewberryNatMonument.jpg",
  "/images/photos/activities/DayTrips/SunriverObservatory.jpg",
  "/images/photos/activities/Golf/Woodlands.jpg",
  "/images/photos/activities/Golf/Crosswater.jpg",
  "/images/photos/activities/Golf/SunriverStables.jpg",
  "/images/photos/activities/Golf/SunriverVillage.jpg",
]);

const ALLOWED_LICENSE = /^(Public domain|CC0|CC BY-SA|CC BY)( \d+\.\d+)?$/;

test("every activity card has a photo, and new photos have a free license credit", () => {
  const seen = new Set();
  for (const section of activities.activitySections) {
    for (const activity of section.activities) {
      assert.ok(activity.image, activity.id);
      assert.equal(fs.existsSync(path.join(root, "public", activity.image)), true, activity.id);
      const needsCredit = !LEGACY_ACTIVITY_IMAGES.has(activity.image);
      if (!needsCredit && !activity.imageCredit) continue;
      const credit = activity.imageCredit;
      assert.ok(credit, `${activity.id} is a new photo and needs imageCredit`);
      assert.equal(typeof credit.author, "string");
      assert.ok(credit.author.trim().length > 0, activity.id);
      assert.equal(typeof credit.license, "string");
      assert.match(credit.license, ALLOWED_LICENSE, activity.id);
      assert.equal(/\bNC\b|\bND\b/.test(credit.license), false, activity.id);
      assert.equal(credit.licenseUrl.startsWith("https://"), true, activity.id);
      assert.equal(credit.source.startsWith("https://commons.wikimedia.org/wiki/File:"), true, activity.id);
      if (credit.changes !== undefined) {
        assert.ok(credit.changes.length > 0, activity.id);
      }
      seen.add(activity.id);
    }
  }
  assert.ok(seen.has("deschutes-river-trail"));
  assert.ok(seen.has("todd-lake-loop"));
  assert.ok(seen.has("viator-ebike-tour"));
});

test("checkout.json is only the steps already in the guest guide", () => {
  const during = guide.guestGuideSections.find((section) => section.title === "During Your Stay");
  const summary = during.items.find((item) => item.startsWith("Checkout is"));
  assert.equal(checkout.summary, summary);
  assert.equal(checkout.checkIn, guide.siteConfig.checkIn);
  assert.equal(checkout.checkOut, guide.siteConfig.checkOut);
  assert.deepEqual(checkout.steps, [
    "Start the dishwasher",
    "Leave used towels in the laundry room",
  ]);
  for (const step of checkout.steps) {
    assert.equal(summary.toLowerCase().includes(step.toLowerCase()), true, step);
  }
});

test("JSON images are jpeg or png, under 500 KB, and need no URL encoding", () => {
  const maxBytes = 500 * 1024;
  const paths = new Set();
  for (const file of [guide, site, activities, checkout, pages]) {
    walk(file, (value) => {
      if (typeof value !== "string" || !value.includes("/images/")) return;
      const pathname = value.startsWith("http://") || value.startsWith("https://")
        ? decodeURIComponent(new URL(value).pathname)
        : value;
      const match = pathname.match(/\/images\/[^\s"'<>]+/);
      if (match) paths.add(match[0]);
    });
  }
  assert.ok(paths.size > 20);
  for (const imagePath of paths) {
    assert.match(imagePath, /\.(jpe?g|png)$/i, imagePath);
    const filename = imagePath.split("/").pop();
    assert.equal(encodeURIComponent(filename), filename, filename);
    const disk = path.join(root, "public", imagePath);
    assert.equal(fs.existsSync(disk), true, imagePath);
    const size = fs.statSync(disk).size;
    assert.ok(size <= maxBytes, `${imagePath} is ${size} bytes`);
  }
  const resized = activities.activitySections
    .flatMap((section) => section.activities)
    .filter((activity) => activity.imageCredit?.changes);
  assert.deepEqual(
    resized.map((activity) => activity.id),
    ["viator-ebike-tour", "deschutes-river-trail", "viator-ebike-tour"],
  );
  for (const activity of resized) {
    assert.equal(activity.imageCredit.changes, "Resized", activity.id);
  }
});

test("rendered pages do not show the host phone", () => {
  const buildDir = path.join(root, ".next/server/app");
  for (const [built] of ROUTES) {
    const actual = normalizeHtml(fs.readFileSync(path.join(buildDir, built), "utf8"));
    assert.equal(actual.includes(guide.siteConfig.host.phone), false, built);
    assert.equal(actual.includes("47 photos"), false, built);
  }
});

test("rendered route HTML matches the snapshot", () => {
  const buildDir = path.join(root, ".next/server/app");
  for (const [built, fixture] of ROUTES) {
    const builtPath = path.join(buildDir, built);
    assert.equal(
      fs.existsSync(builtPath),
      true,
      `Missing ${builtPath}. Run npm run build before npm test.`,
    );
    const actual = normalizeHtml(fs.readFileSync(builtPath, "utf8"));
    const expected = fs.readFileSync(path.join(root, "tests/fixtures", fixture), "utf8");
    if (actual !== expected) {
      const limit = Math.min(actual.length, expected.length);
      let index = 0;
      while (index < limit && actual[index] === expected[index]) index += 1;
      const start = Math.max(0, index - 120);
      assert.fail(
        `${fixture} diverges at ${index}\nexpected: ${JSON.stringify(expected.slice(start, index + 160))}\nactual:   ${JSON.stringify(actual.slice(start, index + 160))}`,
      );
    }
  }
});
