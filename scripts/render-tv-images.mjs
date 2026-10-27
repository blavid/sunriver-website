import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const sharp = require("sharp");

const activitiesPath = path.join(root, "public/data/activities.json");
const tvDir = path.join(root, "public/images/tv");
const origin = "https://sunrivertownhome.com";
const livingSource = path.join(root, "public/images/photos/house/living-room-1.jpg");

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

// Baseline (SOF0). mozjpeg:true forces a progressive scan, which Roku Poster does not load.
function jpeg(input) {
  return input.toColorspace("srgb").jpeg({
    quality: 80,
    progressive: false,
    trellisQuantisation: true,
    overshootDeringing: true,
    quantisationTable: 3,
  });
}

const activities = JSON.parse(fs.readFileSync(activitiesPath, "utf8"));
fs.mkdirSync(tvDir, { recursive: true });

const keep = new Set(["book-direct-living.jpg", "tv-placeholder.jpg"]);
const seen = new Set();
for (const section of activities.activitySections) {
  for (const activity of section.activities) {
    const filename = `${activity.id}.jpg`;
    keep.add(filename);
    if (!seen.has(activity.id)) {
      const source = path.join(root, "public", activity.image);
      await jpeg(sharp(source).resize(640, 640, { fit: "inside" })).toFile(path.join(tvDir, filename));
      seen.add(activity.id);
    }
  }
  section.activities = section.activities.map((activity) =>
    insertAfter(activity, "imageUrl", "imageTvUrl", `${origin}/images/tv/${activity.id}.jpg`),
  );
}

await jpeg(sharp(livingSource).resize(960, 540, { fit: "cover", position: "centre" })).toFile(
  path.join(tvDir, "book-direct-living.jpg"),
);
await sharp({
  create: { width: 64, height: 64, channels: 3, background: { r: 232, g: 226, b: 214 } },
})
  .jpeg({ quality: 80, progressive: false })
  .toFile(path.join(tvDir, "tv-placeholder.jpg"));

for (const file of fs.readdirSync(tvDir)) {
  if (!keep.has(file)) fs.unlinkSync(path.join(tvDir, file));
}

if (activities.version < 4) activities.version = 4;
fs.writeFileSync(activitiesPath, `${JSON.stringify(activities, null, 2)}\n`);
console.log(`wrote ${seen.size} activity TV jpgs`);
