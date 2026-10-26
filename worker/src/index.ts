import {
  calendarDateInZone,
  htmlEscape,
  isRealCheckoutDate,
  interpretCheckin,
  readLimitedBody,
  secondsUntilPastCheckout,
  timingSafeEqual,
  ZONE,
  type Guest,
} from "./guest";

const KV_KEY = "current";
const MIN_PATH_KEY_LENGTH = 24;
const MAX_PATH_SEGMENT = 256;

export interface GuestKv {
  get(key: string, type: "text"): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface Env {
  GUEST: GuestKv;
  EAGLEWOOD_TOKEN?: string;
  GUEST_PATH_KEY?: string;
}

function json(body: unknown, status: number, extra?: Record<string, string>): Response {
  const headers = new Headers(extra);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(body), { status, headers });
}

function notFound(): Response {
  return json({ error: "not found" }, 404);
}

function methodNotAllowed(allow: string): Response {
  return json({ error: "method not allowed" }, 405, { allow });
}

function authorize(request: Request, secret: string | undefined): Response | null {
  if (typeof secret !== "string" || secret.length === 0) {
    return json({ error: "misconfigured" }, 500);
  }
  const header = request.headers.get("X-Eaglewood-Token") ?? "";
  const query = new URL(request.url).searchParams.get("token") ?? "";
  const headerOk = timingSafeEqual(header, secret);
  const queryOk = timingSafeEqual(query, secret);
  if (!headerOk && !queryOk) {
    return json({ error: "unauthorized" }, 401);
  }
  return null;
}

function guestPathAllowed(segment: string, secret: string | undefined): boolean {
  if (typeof secret !== "string" || secret.length < MIN_PATH_KEY_LENGTH) return false;
  if (segment.length > MAX_PATH_SEGMENT) return false;
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    decoded = segment;
  }
  return timingSafeEqual(decoded, secret);
}

function parseStored(raw: string | null): Guest | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.firstName !== "string" || typeof record.checkout !== "string") return null;
    if (!isRealCheckoutDate(record.checkout)) return null;
    const lastName = typeof record.lastName === "string" ? record.lastName : "";
    return { firstName: record.firstName, lastName, checkout: record.checkout };
  } catch {
    return null;
  }
}

async function checkin(request: Request, env: Env): Promise<Response> {
  const body = await readLimitedBody(request);
  if (!body.ok) return json({ error: "payload too large" }, 413);
  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const decision = interpretCheckin(parsed);
  if (decision.action === "reject") return json({ error: "invalid checkin" }, 400);
  if (decision.action === "clear") {
    await env.GUEST.delete(KV_KEY);
    return json({ ok: true }, 200);
  }
  const expirationTtl = secondsUntilPastCheckout(decision.guest.checkout, Date.now());
  await env.GUEST.put(KV_KEY, JSON.stringify(decision.guest), { expirationTtl });
  return json({ ok: true }, 200);
}

async function checkout(request: Request, env: Env): Promise<Response> {
  const body = await readLimitedBody(request);
  if (!body.ok) return json({ error: "payload too large" }, 413);
  await env.GUEST.delete(KV_KEY);
  return json({ ok: true }, 200);
}

async function readGuest(env: Env): Promise<Response> {
  const headers = {
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  };
  const guest = parseStored(await env.GUEST.get(KV_KEY, "text"));
  if (!guest || calendarDateInZone(Date.now(), ZONE) > guest.checkout) {
    return json({}, 200, headers);
  }
  return json(
    {
      firstName: htmlEscape(guest.firstName),
      lastName: htmlEscape(guest.lastName),
      checkout: guest.checkout,
    },
    200,
    headers,
  );
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;

    if (path === "/tv/checkin" || path === "/tv/checkout") {
      if (request.method !== "POST") return methodNotAllowed("POST");
      const denied = authorize(request, env.EAGLEWOOD_TOKEN);
      if (denied) return denied;
      return path === "/tv/checkin" ? checkin(request, env) : checkout(request, env);
    }

    const guest = /^\/tv\/([^/]+)\/guest\.json$/.exec(path);
    if (guest) {
      if (!guestPathAllowed(guest[1], env.GUEST_PATH_KEY)) return notFound();
      if (request.method !== "GET") return methodNotAllowed("GET");
      return readGuest(env);
    }

    return notFound();
  },
};

export default worker;
