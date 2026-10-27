import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
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
  for (const name of fs.readdirSync(dataDir)) {
    assert.equal(name.endsWith(".json"), true);
    const text = fs.readFileSync(path.join(dataDir, name), "utf8");
    assert.equal(text.includes("secretRef"), false, name);
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
  assert.equal(guide.siteConfig.host.phone, null);
  assert.equal(typeof guide.siteConfig.host.name, "string");
  assert.ok(guide.siteConfig.host.name.length > 0);
  assert.ok(guide.siteConfig.host.email.includes("@"));
  assert.equal(guide.houseRules.length, 6);
  assert.equal(guide.troubleshooting.length, 13);
  assert.equal(guide.guestGuideSections.length, 3);
  assert.equal(guide.hikes.length, 6);
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
    if (section.seasonPriority) {
      for (const [season, rank] of Object.entries(section.seasonPriority)) {
        assert.ok(CALENDAR.includes(season), season);
        assert.equal(typeof rank, "number");
      }
    }
    for (const activity of section.activities) {
      count += 1;
      assert.ok(Array.isArray(activity.season) && activity.season.length > 0, activity.id);
      for (const season of activity.season) assert.ok(SEASONS.includes(season), activity.id);
      if (activity.season.includes("year-round")) {
        assert.deepEqual(activity.season, ["year-round"], activity.id);
      }
      assert.equal(typeof activity.seasonLabel, "string");
      assert.ok(activity.seasonLabel.length > 0, activity.id);
      assert.ok(activity.image.startsWith("/"), activity.id);
      assert.equal(
        activity.imageUrl,
        absoluteUrl(activity.image, guide.siteConfig.domain),
        activity.id,
      );
      if (activity.seasonSpecified === false) {
        assert.deepEqual(activity.season, CALENDAR, activity.id);
      } else {
        assert.equal(activity.seasonSpecified, undefined, activity.id);
      }
    }
  }

  assert.equal(count, 64);
  assert.deepEqual(activities.activitySections.find((s) => s.id === "skiing-snowboarding").seasonPriority, {
    winter: 1,
  });
  assert.deepEqual(activities.activitySections.find((s) => s.id === "river-floats").seasonPriority, {
    summer: 1,
  });
  const unspecified = activities.activitySections
    .flatMap((section) => section.activities)
    .filter((activity) => activity.seasonSpecified === false)
    .map((activity) => activity.id);
  assert.deepEqual(unspecified, ["rio-sol", "century-common-taps-and-trucks"]);
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

test("rendered route HTML matches the pre-migration snapshot", () => {
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
