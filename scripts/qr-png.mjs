import { deflateSync } from "node:zlib";
import { encode } from "uqr";

const MIN_PX = 320;
const MAX_PX = 400;
const TARGET_PX = 360;

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let bit = 0; bit < 8; bit++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBytes = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, crc]);
}

function encodeGrayPng(width, height, pixels) {
  const stride = width + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    pixels.copy(raw, y * stride + 1, y * width, (y + 1) * width);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function layout(modules) {
  const candidates = [];
  for (const quiet of [4, 2]) {
    const span = modules + quiet * 2;
    for (let scale = 1; scale * span <= MAX_PX; scale++) {
      const size = scale * span;
      if (size >= MIN_PX) candidates.push({ quiet, scale, size });
    }
  }
  if (candidates.length === 0) {
    throw new Error(`QR matrix of ${modules} modules does not fit in ${MIN_PX}–${MAX_PX}px`);
  }
  candidates.sort((a, b) => Math.abs(a.size - TARGET_PX) - Math.abs(b.size - TARGET_PX) || b.quiet - a.quiet);
  return candidates[0];
}

/** PNG QR of `text`, about 320–400 px, quiet zone of 4 modules when it fits. */
export function qrPng(text) {
  const qr = encode(text, { ecc: "M", border: 0 });
  const { quiet, scale, size } = layout(qr.size);
  const pixels = Buffer.alloc(size * size, 255);
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (!qr.data[y][x]) continue;
      const originX = (x + quiet) * scale;
      const originY = (y + quiet) * scale;
      for (let py = 0; py < scale; py++) {
        const row = (originY + py) * size + originX;
        pixels.fill(0, row, row + scale);
      }
    }
  }
  return { png: encodeGrayPng(size, size, pixels), width: size, quiet, scale };
}
