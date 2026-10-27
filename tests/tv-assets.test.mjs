import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { qrPng } from "../scripts/qr-png.mjs";

const require = createRequire(new URL("../package.json", import.meta.url));
const sharp = require("sharp");
const jsQR = require("jsqr");

const root = path.resolve(import.meta.dirname, "..");
const guide = JSON.parse(fs.readFileSync(path.join(root, "public/data/guide.json"), "utf8"));
const activities = JSON.parse(fs.readFileSync(path.join(root, "public/data/activities.json"), "utf8"));
const origin = "https://sunrivertownhome.com";

function activitiesFlat() {
  return activities.activitySections.flatMap((section) => section.activities);
}

async function decodeQr(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const code = jsQR(pixels, info.width, info.height, { inversionAttempts: "attemptBoth" });
  assert.ok(code, file);
  return { text: code.data, width: info.width, height: info.height };
}

test("bookDirect matches the Phase 2 contract and the live book page wording", () => {
  const book = fs.readFileSync(path.join(root, "src/app/book/page.tsx"), "utf8");
  const savings = "Book direct and pay up to about 10% less than Airbnb or Vrbo, plus no booking-site service fees.";
  assert.equal(guide.version, 3);
  assert.equal(activities.version, 4);
  assert.equal(book.includes(savings), true);
  assert.equal(guide.bookDirect.version, 1);
  assert.equal(guide.bookDirect.savingsText, savings);
  assert.equal(guide.bookDirect.savingsText.includes("up to about 10% less"), true);
  assert.equal(guide.bookDirect.siteUrl, `${origin}`);
  assert.equal(guide.bookDirect.bookingUrl, guide.siteConfig.bookUrl);
  assert.equal(guide.bookDirect.qrImageUrl, `${origin}/data/qr/book-direct-site.png`);
  assert.equal(guide.bookDirect.bookingQrImageUrl, `${origin}/data/qr/book-direct-booking.png`);
  assert.equal(guide.bookDirect.photoUrl, `${origin}/images/photos/house/living-room-1.jpg`);
  assert.equal(guide.bookDirect.photoTvUrl, `${origin}/images/tv/book-direct-living.jpg`);
  assert.equal(guide.bookDirect.headline.length, 3);
  assert.deepEqual(
    guide.bookDirect.perks.map((perk) => perk.icon),
    ["house", "mountain", "dining", "pines", "more"],
  );
});

test("activity QR pngs decode to the plain url and book-direct QR pngs match bookDirect", async () => {
  const flat = activitiesFlat();
  const withUrl = new Map();
  for (const activity of flat) {
    assert.equal(Object.hasOwn(activity, "affiliateUrl"), false, activity.id);
    if (activity.url) {
      const previous = withUrl.get(activity.id);
      if (previous !== undefined) assert.equal(previous, activity.url, activity.id);
      withUrl.set(activity.id, activity.url);
      assert.equal(activity.qrUrl, `${origin}/data/qr/${activity.id}.png`, activity.id);
    } else {
      assert.equal(Object.hasOwn(activity, "qrUrl"), false, activity.id);
      assert.equal(fs.existsSync(path.join(root, "public/data/qr", `${activity.id}.png`)), false, activity.id);
    }
  }

  const expectedFiles = [...withUrl.keys(), "book-direct-site", "book-direct-booking"].map((id) => `${id}.png`).sort();
  const actualFiles = fs.readdirSync(path.join(root, "public/data/qr")).sort();
  assert.deepEqual(actualFiles, expectedFiles);

  for (const [id, url] of withUrl) {
    const file = path.join(root, "public/data/qr", `${id}.png`);
    const decoded = await decodeQr(file);
    assert.equal(decoded.text, url, id);
    assert.equal(decoded.width, decoded.height, id);
    assert.ok(decoded.width >= 320 && decoded.width <= 400, `${id} is ${decoded.width}px`);
    const regenerated = qrPng(url);
    assert.equal(regenerated.png.equals(fs.readFileSync(file)), true, id);
  }

  const site = await decodeQr(path.join(root, "public/data/qr/book-direct-site.png"));
  const booking = await decodeQr(path.join(root, "public/data/qr/book-direct-booking.png"));
  assert.equal(site.text, guide.bookDirect.siteUrl);
  assert.equal(booking.text, guide.bookDirect.bookingUrl);
  assert.equal(qrPng(guide.bookDirect.siteUrl).png.equals(fs.readFileSync(path.join(root, "public/data/qr/book-direct-site.png"))), true);
  assert.equal(
    qrPng(guide.bookDirect.bookingUrl).png.equals(fs.readFileSync(path.join(root, "public/data/qr/book-direct-booking.png"))),
    true,
  );
});

function pngColor(file) {
  const buf = fs.readFileSync(file);
  assert.equal(buf[0], 0x89, file);
  assert.equal(buf.toString("ascii", 12, 16), "IHDR", file);
  return { bitDepth: buf[24], colorType: buf[25], interlace: buf[28] };
}

test("QR pngs are non-interlaced 8-bit RGB", () => {
  const files = fs.readdirSync(path.join(root, "public/data/qr")).filter((name) => name.endsWith(".png"));
  assert.ok(files.length > 40);
  for (const name of files) {
    const header = pngColor(path.join(root, "public/data/qr", name));
    assert.equal(header.bitDepth, 8, name);
    assert.notEqual(header.colorType, 0, name);
    assert.ok(header.colorType === 2 || header.colorType === 6, name);
    assert.equal(header.interlace, 0, name);
  }
});

test("TV jpgs are about 640 px and the living-room hero is 960 by 540", async () => {
  const flat = activitiesFlat();
  const ids = new Set(flat.map((activity) => activity.id));
  for (const activity of flat) {
    assert.equal(activity.imageTvUrl, `${origin}/images/tv/${activity.id}.jpg`, activity.id);
    const file = path.join(root, "public/images/tv", `${activity.id}.jpg`);
    const meta = await sharp(file).metadata();
    assert.equal(meta.format, "jpeg", activity.id);
    const longEdge = Math.max(meta.width, meta.height);
    assert.equal(longEdge, 640, activity.id);
  }

  const living = await sharp(path.join(root, "public/images/tv/book-direct-living.jpg")).metadata();
  assert.equal(living.format, "jpeg");
  assert.equal(living.width, 960);
  assert.equal(living.height, 540);

  const placeholder = await sharp(path.join(root, "public/images/tv/tv-placeholder.jpg")).metadata();
  assert.equal(placeholder.format, "jpeg");
  assert.equal(placeholder.width, 64);
  assert.equal(placeholder.height, 64);

  const expected = [...ids, "book-direct-living", "tv-placeholder"].map((id) => `${id}.jpg`).sort();
  assert.deepEqual(fs.readdirSync(path.join(root, "public/images/tv")).sort(), expected);
});
