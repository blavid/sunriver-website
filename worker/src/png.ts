const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);

function crc32(bytes: Uint8Array): number {
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

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

async function zlibDeflate(raw: Uint8Array): Promise<Uint8Array> {
  const stream = new CompressionStream("deflate");
  const compressed = new Response(stream.readable).arrayBuffer();
  const writer = stream.writable.getWriter();
  await writer.write(new Uint8Array(raw) as BufferSource);
  await writer.close();
  return new Uint8Array(await compressed);
}

/** 8-bit grayscale PNG. `pixels` is row-major, 0 black through 255 white. */
export async function encodeGrayPng(width: number, height: number, pixels: Uint8Array): Promise<Uint8Array> {
  if (pixels.length !== width * height) {
    throw new Error("png size mismatch");
  }
  const stride = width + 1;
  const raw = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const start = y * width;
    raw.set(pixels.subarray(start, start + width), y * stride + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  const parts = [PNG_SIGNATURE, chunk("IHDR", ihdr), chunk("IDAT", await zlibDeflate(raw)), chunk("IEND", new Uint8Array())];
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
