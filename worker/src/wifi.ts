import { encode } from "uqr";
import { encodeRgbPng } from "./png";

export const WIFI_TARGET_PX = 480;
export const WIFI_QUIET_MODULES = 2;
export const WIFI_CACHE_CONTROL = "private, max-age=3600";

export type WifiKind = "json" | "png";

export interface WifiSecrets {
  WIFI_SSID?: string;
  WIFI_PASSWORD?: string;
  WIFI_TYPE?: string;
}

/** Format token mixed into the ETag. Includes the representation so json and png do not share a validator. */
export function wifiFmtVersion(kind: WifiKind, type: string): string {
  return `2|${kind}|${type}|${WIFI_TARGET_PX}|q${WIFI_QUIET_MODULES}`;
}

export function escapeWifiField(value: string): string {
  return value.replace(/[\\;,":]/g, (character) => `\\${character}`);
}

export function wifiPayload(ssid: string, password: string, type: string): string {
  return `WIFI:T:${escapeWifiField(type)};S:${escapeWifiField(ssid)};P:${escapeWifiField(password)};;`;
}

export function wifiType(raw: string | undefined): string {
  if (typeof raw !== "string") return "WPA";
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : "WPA";
}

function presentSecret(value: string | undefined): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  return value;
}

export function wifiBitmap(payload: string): { width: number; scale: number; quiet: number; pixels: Uint8Array } {
  const qr = encode(payload, { border: 0 });
  const modules = qr.size;
  const quiet = WIFI_QUIET_MODULES;
  const span = modules + quiet * 2;
  const scale = Math.max(1, Math.round(WIFI_TARGET_PX / span));
  const width = span * scale;
  const pixels = new Uint8Array(width * width);
  pixels.fill(255);
  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (!qr.data[y][x]) continue;
      const originX = (x + quiet) * scale;
      const originY = (y + quiet) * scale;
      for (let py = 0; py < scale; py++) {
        const row = (originY + py) * width + originX;
        pixels.fill(0, row, row + scale);
      }
    }
  }
  return { width, scale, quiet, pixels };
}

export async function wifiPng(payload: string): Promise<Uint8Array> {
  const bitmap = wifiBitmap(payload);
  return encodeRgbPng(bitmap.width, bitmap.width, bitmap.pixels);
}

export async function wifiEtag(ssid: string, password: string, kind: WifiKind, type: string): Promise<string> {
  const material = `${ssid}|${password}|${wifiFmtVersion(kind, type)}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  let hex = "";
  for (const byte of new Uint8Array(digest)) hex += byte.toString(16).padStart(2, "0");
  return `"${hex}"`;
}

function ifNoneMatch(request: Request, etag: string): boolean {
  const header = request.headers.get("if-none-match");
  if (header === null) return false;
  const expected = etag.slice(1, -1);
  for (const part of header.split(",")) {
    const token = part.trim();
    if (token === "*") return true;
    const bare = token.replace(/^W\//i, "").replace(/^"(.*)"$/, "$1");
    if (bare === expected) return true;
  }
  return false;
}

function unavailable(): Response {
  return new Response(null, { status: 503, headers: { "cache-control": "no-store" } });
}

export async function wifiResponse(request: Request, env: WifiSecrets, kind: WifiKind): Promise<Response> {
  const ssid = presentSecret(env.WIFI_SSID);
  const password = presentSecret(env.WIFI_PASSWORD);
  if (ssid === null || password === null) return unavailable();
  const type = wifiType(env.WIFI_TYPE);
  const etag = await wifiEtag(ssid, password, kind, type);
  const headers = { "cache-control": WIFI_CACHE_CONTROL, etag };
  if (ifNoneMatch(request, etag)) return new Response(null, { status: 304, headers });
  if (kind === "json") {
    return Response.json({ ssid, password }, { status: 200, headers });
  }
  const png = await wifiPng(wifiPayload(ssid, password, type));
  const body = new ArrayBuffer(png.byteLength);
  new Uint8Array(body).set(png);
  return new Response(body, { status: 200, headers: { ...headers, "content-type": "image/png" } });
}
