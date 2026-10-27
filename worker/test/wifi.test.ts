import { inflateSync } from "node:zlib";
import { encode } from "uqr";
import jsQR from "jsqr";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type Env, type GuestKv } from "../src/index";
import {
  escapeWifiField,
  WIFI_CACHE_CONTROL,
  WIFI_QUIET_MODULES,
  WIFI_TARGET_PX,
  wifiEtag,
  wifiFmtVersion,
  wifiPayload,
  wifiType,
} from "../src/wifi";

const PATH_KEY = "a".repeat(32);
const SSID = "TestSSID";
const PASSWORD = "test-password-not-real";

class MemoryKv implements GuestKv {
  async get(): Promise<string | null> {
    return null;
  }

  async put(): Promise<void> {}

  async delete(): Promise<void> {}
}

function bindings(overrides: Partial<Env> = {}): Env {
  return {
    GUEST: new MemoryKv(),
    EAGLEWOOD_TOKEN: "b".repeat(32),
    GUEST_PATH_KEY: PATH_KEY,
    WIFI_SSID: SSID,
    WIFI_PASSWORD: PASSWORD,
    ...overrides,
  };
}

function wifiUrl(kind: "json" | "png", key = PATH_KEY): string {
  return `https://sunrivertownhome.com/tv/${key}/wifi.${kind}`;
}

function readRgbPng(png: Uint8Array): { width: number; height: number; pixels: Uint8Array } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < signature.length; i++) {
    if (png[i] !== signature[i]) throw new Error("not a png");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let interlace = -1;
  const idat: Uint8Array[] = [];
  while (offset + 8 <= png.length) {
    const view = new DataView(png.buffer, png.byteOffset + offset, 8);
    const length = view.getUint32(0);
    const type = String.fromCharCode(png[offset + 4], png[offset + 5], png[offset + 6], png[offset + 7]);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      const ihdr = new DataView(data.buffer, data.byteOffset, data.byteLength);
      width = ihdr.getUint32(0);
      height = ihdr.getUint32(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  expect(bitDepth).toBe(8);
  expect(colorType).not.toBe(0);
  expect(colorType).toBe(2);
  expect(interlace).toBe(0);
  const compressed = new Uint8Array(idat.reduce((total, part) => total + part.length, 0));
  let cursor = 0;
  for (const part of idat) {
    compressed.set(part, cursor);
    cursor += part.length;
  }
  const raw = inflateSync(compressed);
  const pixels = new Uint8Array(width * height);
  const stride = width * 3 + 1;
  for (let y = 0; y < height; y++) {
    if (raw[y * stride] !== 0) throw new Error("png row filter is not none");
    for (let x = 0; x < width; x++) {
      const dest = y * stride + 1 + x * 3;
      const red = raw[dest];
      if (red !== raw[dest + 1] || red !== raw[dest + 2]) throw new Error("wifi png pixel is not gray RGB");
      pixels[y * width + x] = red;
    }
  }
  return { width, height, pixels };
}

function decodeGray(pixels: Uint8Array, width: number, height: number): string | null {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < pixels.length; i++) {
    const value = pixels[i];
    rgba[i * 4] = value;
    rgba[i * 4 + 1] = value;
    rgba[i * 4 + 2] = value;
    rgba[i * 4 + 3] = 255;
  }
  return jsQR(rgba, width, height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("wifi payload", () => {
  it("escapes backslash, semicolon, comma, quote, and colon", () => {
    expect(escapeWifiField('a\\b;c,d"e:f')).toBe('a\\\\b\\;c\\,d\\"e\\:f');
    expect(wifiType(undefined)).toBe("WPA");
    expect(wifiType("")).toBe("WPA");
    expect(wifiType("  WEP  ")).toBe("WEP");
    expect(wifiPayload("Cafe", "p;q", "WPA")).toBe("WIFI:T:WPA;S:Cafe;P:p\\;q;;");
  });
});

describe("wifi routes", () => {
  it("returns the network json and a scannable png for the path key", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const env = bindings();
    const json = await worker.fetch(new Request(wifiUrl("json")), env);
    expect(json.status).toBe(200);
    expect(json.headers.get("content-type")).toContain("application/json");
    expect(json.headers.get("cache-control")).toBe(WIFI_CACHE_CONTROL);
    expect(await json.json()).toEqual({ ssid: SSID, password: PASSWORD });

    const pngResponse = await worker.fetch(new Request(wifiUrl("png")), env);
    expect(pngResponse.status).toBe(200);
    expect(pngResponse.headers.get("content-type")).toBe("image/png");
    expect(pngResponse.headers.get("cache-control")).toBe(WIFI_CACHE_CONTROL);
    const png = new Uint8Array(await pngResponse.arrayBuffer());
    const image = readRgbPng(png);
    expect(image.width).toBe(image.height);
    expect(Math.abs(image.width - WIFI_TARGET_PX)).toBeLessThanOrEqual(40);
    const payload = wifiPayload(SSID, PASSWORD, "WPA");
    const modules = encode(payload, { border: 0 }).size;
    const span = modules + WIFI_QUIET_MODULES * 2;
    const scale = Math.round(WIFI_TARGET_PX / span);
    expect(image.width).toBe(span * scale);
    for (let i = 0; i < WIFI_QUIET_MODULES * scale; i++) {
      expect(image.pixels[i]).toBe(255);
      expect(image.pixels[(image.height - 1) * image.width + i]).toBe(255);
    }
    expect(decodeGray(image.pixels, image.width, image.height)).toBe(payload);

    const special = 'semi;colon"quote:colon,comma\\slash';
    const specialEnv = bindings({ WIFI_SSID: special, WIFI_PASSWORD: special, WIFI_TYPE: "WEP" });
    const specialPng = await worker.fetch(new Request(wifiUrl("png")), specialEnv);
    const specialImage = readRgbPng(new Uint8Array(await specialPng.arrayBuffer()));
    expect(decodeGray(specialImage.pixels, specialImage.width, specialImage.height)).toBe(
      wifiPayload(special, special, "WEP"),
    );

    expect(log).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("sends an etag of hash(ssid|password|fmtVersion) and answers If-None-Match with 304", async () => {
    const env = bindings();
    const jsonEtag = await wifiEtag(SSID, PASSWORD, "json", "WPA");
    const pngEtag = await wifiEtag(SSID, PASSWORD, "png", "WPA");
    expect(jsonEtag).not.toBe(pngEtag);
    expect(wifiFmtVersion("json", "WPA")).toBe("2|json|WPA|480|q2");
    expect(wifiFmtVersion("png", "WPA")).toBe("2|png|WPA|480|q2");

    const first = await worker.fetch(new Request(wifiUrl("json")), env);
    expect(first.headers.get("etag")).toBe(jsonEtag);
    const png = await worker.fetch(new Request(wifiUrl("png")), env);
    expect(png.headers.get("etag")).toBe(pngEtag);

    const matched = await worker.fetch(new Request(wifiUrl("png"), { headers: { "if-none-match": pngEtag } }), env);
    expect(matched.status).toBe(304);
    expect(await matched.text()).toBe("");
    expect(matched.headers.get("etag")).toBe(pngEtag);
    expect(matched.headers.get("cache-control")).toBe(WIFI_CACHE_CONTROL);

    const weak = await worker.fetch(
      new Request(wifiUrl("json"), { headers: { "if-none-match": `W/${jsonEtag}, "other"` } }),
      env,
    );
    expect(weak.status).toBe(304);

    const stale = await worker.fetch(
      new Request(wifiUrl("json"), { headers: { "if-none-match": '"0123456789abcdef"' } }),
      env,
    );
    expect(stale.status).toBe(200);
    expect(await stale.json()).toEqual({ ssid: SSID, password: PASSWORD });
  });

  it("404s a wrong key and 503s with an empty body when a secret is missing", async () => {
    const wrong = await worker.fetch(new Request(wifiUrl("png", "c".repeat(32))), bindings());
    expect(wrong.status).toBe(404);
    expect(await wrong.json()).toEqual({ error: "not found" });

    const short = await worker.fetch(new Request(wifiUrl("json", "short-key")), bindings());
    expect(short.status).toBe(404);

    const unset = await worker.fetch(new Request(wifiUrl("json")), bindings({ WIFI_SSID: undefined }));
    expect(unset.status).toBe(503);
    expect(await unset.text()).toBe("");
    expect(unset.headers.get("cache-control")).toBe("no-store");

    const passwordOnly = await worker.fetch(
      new Request(wifiUrl("png")),
      bindings({ WIFI_SSID: "", WIFI_PASSWORD: PASSWORD }),
    );
    expect(passwordOnly.status).toBe(503);
    const body = await passwordOnly.text();
    expect(body).toBe("");
    expect(body.includes(PASSWORD)).toBe(false);
    expect(body.toLowerCase().includes("wifi")).toBe(false);

    const wrongWithoutSecrets = await worker.fetch(
      new Request(wifiUrl("json", "c".repeat(32))),
      bindings({ WIFI_SSID: undefined, WIFI_PASSWORD: undefined }),
    );
    expect(wrongWithoutSecrets.status).toBe(404);
  });

  it("does not change guest or diag responses", async () => {
    const env = bindings();
    const guest = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`), env);
    expect(guest.status).toBe(200);
    expect(guest.headers.get("cache-control")).toBe("no-store");
    expect(await guest.json()).toEqual({});

    const diag = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/diag.json`), env);
    expect(diag.status).toBe(200);
    expect(await diag.json()).toEqual({});

    const posted = await worker.fetch(
      new Request(wifiUrl("json"), { method: "POST" }),
      env,
    );
    expect(posted.status).toBe(405);
  });
});
