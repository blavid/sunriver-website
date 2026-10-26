import {
  calendarDateInZone,
  DIAG_KEY,
  DIAG_TTL_SECONDS,
  htmlEscape,
  interpretCheckin,
  interpretCheckout,
  isRealCheckoutDate,
  parseInboundBody,
  readLimitedBody,
  secondsUntilPastCheckout,
  selectDisplayedStay,
  summarizeBody,
  timingSafeEqual,
  ZONE,
  type StayRecord,
} from "./guest";

const INDEX_KEY = "idx";
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

interface IndexEntry {
  id: string;
  checkin: string;
  checkout: string;
}

export function stayKey(id: string): string {
  return `s:${id}`;
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

async function readIndex(kv: GuestKv): Promise<IndexEntry[]> {
  const raw = await kv.get(INDEX_KEY, "text");
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const entries: IndexEntry[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const record = item as Record<string, unknown>;
      if (typeof record.id !== "string" || typeof record.checkin !== "string" || typeof record.checkout !== "string") {
        continue;
      }
      if (!isRealCheckoutDate(record.checkin) || !isRealCheckoutDate(record.checkout)) continue;
      entries.push({ id: record.id, checkin: record.checkin, checkout: record.checkout });
    }
    return entries;
  } catch {
    return [];
  }
}

async function writeIndex(kv: GuestKv, entries: IndexEntry[]): Promise<void> {
  await kv.put(INDEX_KEY, JSON.stringify(entries));
}

function parseStay(raw: string | null): StayRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const record = value as Record<string, unknown>;
    if (
      typeof record.firstName !== "string" ||
      typeof record.checkin !== "string" ||
      typeof record.checkout !== "string" ||
      !isRealCheckoutDate(record.checkin) ||
      !isRealCheckoutDate(record.checkout)
    ) {
      return null;
    }
    const lastName = typeof record.lastName === "string" ? record.lastName : "";
    return { firstName: record.firstName, lastName, checkin: record.checkin, checkout: record.checkout };
  } catch {
    return null;
  }
}

async function upsertStay(env: Env, id: string, stay: StayRecord, nowMs: number): Promise<void> {
  const expirationTtl = secondsUntilPastCheckout(stay.checkout, nowMs);
  await env.GUEST.put(stayKey(id), JSON.stringify(stay), { expirationTtl });
  const index = (await readIndex(env.GUEST)).filter((entry) => entry.id !== id);
  index.push({ id, checkin: stay.checkin, checkout: stay.checkout });
  await writeIndex(env.GUEST, index);
}

async function deleteStay(env: Env, id: string): Promise<void> {
  await env.GUEST.delete(stayKey(id));
  const index = await readIndex(env.GUEST);
  const next = index.filter((entry) => entry.id !== id);
  if (next.length !== index.length) await writeIndex(env.GUEST, next);
}

export async function pruneExpired(env: Env, nowMs: number): Promise<void> {
  const today = calendarDateInZone(nowMs, ZONE);
  const index = await readIndex(env.GUEST);
  const keep: IndexEntry[] = [];
  for (const entry of index) {
    if (entry.checkout < today) {
      await env.GUEST.delete(stayKey(entry.id));
    } else {
      keep.push(entry);
    }
  }
  if (keep.length !== index.length) await writeIndex(env.GUEST, keep);
}

async function rememberDiag(
  env: Env,
  contentType: string | null,
  parsed: { ok: true; value: unknown } | { ok: false } | null,
  tooLarge: boolean,
): Promise<void> {
  await env.GUEST.put(DIAG_KEY, JSON.stringify(summarizeBody(contentType, parsed, tooLarge)), {
    expirationTtl: DIAG_TTL_SECONDS,
  });
}

async function readAuthorizedBody(
  request: Request,
  env: Env,
): Promise<{ ok: false; response: Response } | { ok: true; text: string; parsed: { ok: true; value: unknown } | { ok: false } }> {
  const contentType = request.headers.get("content-type");
  const body = await readLimitedBody(request);
  if (!body.ok) {
    await rememberDiag(env, contentType, null, true);
    return { ok: false, response: json({ error: "payload too large" }, 413) };
  }
  const parsed = parseInboundBody(contentType, body.text);
  await rememberDiag(env, contentType, parsed, false);
  return { ok: true, text: body.text, parsed };
}

function unparsedError(text: string, contentType: string | null): string {
  const trimmed = text.trim();
  const ctype = (contentType ?? "").toLowerCase();
  if (trimmed.startsWith("{") || trimmed.startsWith("[") || ctype.includes("json")) return "invalid JSON";
  return "invalid checkin";
}

async function checkin(request: Request, env: Env): Promise<Response> {
  const read = await readAuthorizedBody(request, env);
  if (!read.ok) return read.response;
  if (!read.parsed.ok) return json({ error: unparsedError(read.text, request.headers.get("content-type")) }, 400);
  const nowMs = Date.now();
  const decision = interpretCheckin(read.parsed.value, calendarDateInZone(nowMs, ZONE));
  if (decision.action === "reject") return json({ error: "invalid checkin" }, 400);
  if (decision.action === "delete") {
    await deleteStay(env, decision.id);
    return json({ ok: true }, 200);
  }
  await upsertStay(env, decision.id, decision.stay, nowMs);
  return json({ ok: true }, 200);
}

async function checkout(request: Request, env: Env): Promise<Response> {
  const read = await readAuthorizedBody(request, env);
  if (!read.ok) return read.response;
  if (!read.parsed.ok) return json({ ok: true }, 200);
  const today = calendarDateInZone(Date.now(), ZONE);
  const target = interpretCheckout(read.parsed.value, today);
  if (target.kind === "id") {
    await deleteStay(env, target.id);
  } else if (target.kind === "date") {
    const ids = (await readIndex(env.GUEST)).filter((entry) => entry.checkout === target.checkout).map((entry) => entry.id);
    for (const id of ids) await deleteStay(env, id);
  } else if (target.kind === "displayed") {
    const chosen = selectDisplayedStay(await readIndex(env.GUEST), today);
    if (chosen) await deleteStay(env, chosen.id);
  }
  return json({ ok: true }, 200);
}

async function readDiag(env: Env): Promise<Response> {
  const headers = { "cache-control": "no-store" };
  const raw = await env.GUEST.get(DIAG_KEY, "text");
  if (!raw) return json({}, 200, headers);
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return json({}, 200, headers);
    return json(value, 200, headers);
  } catch {
    return json({}, 200, headers);
  }
}

async function readGuest(env: Env): Promise<Response> {
  const headers = {
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  };
  const today = calendarDateInZone(Date.now(), ZONE);
  const chosen = selectDisplayedStay(await readIndex(env.GUEST), today);
  if (!chosen) return json({}, 200, headers);
  const stay = parseStay(await env.GUEST.get(stayKey(chosen.id), "text"));
  if (!stay || stay.checkin > today || today > stay.checkout) return json({}, 200, headers);
  return json(
    {
      firstName: htmlEscape(stay.firstName),
      lastName: htmlEscape(stay.lastName),
      checkout: stay.checkout,
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

    const keyed = /^\/tv\/([^/]+)\/(guest|diag)\.json$/.exec(path);
    if (keyed) {
      if (!guestPathAllowed(keyed[1], env.GUEST_PATH_KEY)) return notFound();
      if (request.method !== "GET") return methodNotAllowed("GET");
      return keyed[2] === "diag" ? readDiag(env) : readGuest(env);
    }

    return notFound();
  },

  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(pruneExpired(env, Date.now()));
  },
};

export default worker;
