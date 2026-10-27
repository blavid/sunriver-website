import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { qrPng } from "./qr-png.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activitiesPath = path.join(root, "public/data/activities.json");
const guidePath = path.join(root, "public/data/guide.json");
const qrDir = path.join(root, "public/data/qr");
const origin = "https://sunrivertownhome.com";

function insertAfter(object, afterKey, key, value) {
  const next = {};
  let placed = false;
  for (const [entryKey, entryValue] of Object.entries(object)) {
    if (entryKey === key) continue;
    next[entryKey] = entryValue;
    if (entryKey === afterKey) {
      next[key] = value;
      placed = true;
    }
  }
  if (!placed) next[key] = value;
  return next;
}

function omit(object, key) {
  const next = {};
  for (const [entryKey, entryValue] of Object.entries(object)) {
    if (entryKey !== key) next[entryKey] = entryValue;
  }
  return next;
}

const activities = JSON.parse(fs.readFileSync(activitiesPath, "utf8"));
const guide = JSON.parse(fs.readFileSync(guidePath, "utf8"));
fs.mkdirSync(qrDir, { recursive: true });

const expected = new Map();
for (const section of activities.activitySections) {
  for (const activity of section.activities) {
    if (!activity.url) continue;
    const filename = `${activity.id}.png`;
    const previous = expected.get(filename);
    if (previous !== undefined && previous !== activity.url) {
      throw new Error(`${activity.id} is used for two different urls`);
    }
    expected.set(filename, activity.url);
  }
}

const bookDirect = guide.bookDirect;
expected.set("book-direct-site.png", bookDirect.siteUrl);
expected.set("book-direct-booking.png", bookDirect.bookingUrl);

for (const [filename, payload] of expected) {
  const { png } = qrPng(payload);
  fs.writeFileSync(path.join(qrDir, filename), png);
}

for (const file of fs.readdirSync(qrDir)) {
  if (!expected.has(file)) fs.unlinkSync(path.join(qrDir, file));
}

for (const section of activities.activitySections) {
  section.activities = section.activities.map((activity) => {
    if (!activity.url) return omit(activity, "qrUrl");
    return insertAfter(activity, "url", "qrUrl", `${origin}/data/qr/${activity.id}.png`);
  });
}
if (activities.version < 4) activities.version = 4;
fs.writeFileSync(activitiesPath, `${JSON.stringify(activities, null, 2)}\n`);
console.log(`wrote ${expected.size} QR pngs`);
