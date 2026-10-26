export const MAX_BODY_BYTES = 2048;
export const ZONE = "America/Los_Angeles";
const FIRST_NAME_MAX = 30;
const LAST_NAME_MAX = 40;

export interface Guest {
  firstName: string;
  lastName: string;
  checkout: string;
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/gu;
const PHONE = /(?:\+|00)?\d[\d\s().-]{5,}\d/g;

function isLeap(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeap(year) ? 29 : 28;
  return [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month] ?? 0;
}

export function isRealCheckoutDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return false;
  return day >= 1 && day <= daysInMonth(year, month);
}

export function nextCalendarDay(ymd: string): string {
  let year = Number(ymd.slice(0, 4));
  let month = Number(ymd.slice(5, 7));
  let day = Number(ymd.slice(8, 10)) + 1;
  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  const y = String(year).padStart(4, "0");
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function utcFromParts(year: number, month: number, day: number, hour: number, minute = 0, second = 0): number {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, 0);
  return date.getTime();
}

function timeZoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  let year = pick("year");
  let month = pick("month");
  let day = pick("day");
  let hour = pick("hour");
  const minute = pick("minute");
  const second = pick("second");
  if (hour === 24) {
    hour = 0;
    const rolled = nextCalendarDay(
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    );
    year = Number(rolled.slice(0, 4));
    month = Number(rolled.slice(5, 7));
    day = Number(rolled.slice(8, 10));
  }
  return utcFromParts(year, month, day, hour, minute, second) - instant;
}

export function zonedDateTimeToUtcMs(ymd: string, hour: number, timeZone: string): number {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  const localAsUtc = utcFromParts(year, month, day, hour);
  const offset1 = timeZoneOffsetMs(localAsUtc, timeZone);
  let utc = localAsUtc - offset1;
  const offset2 = timeZoneOffsetMs(utc, timeZone);
  utc -= offset2 - offset1;
  return utc;
}

export function calendarDateInZone(nowMs: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(nowMs));
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

/** Seconds until 06:00 America/Los_Angeles on the day after checkout, minimum 60. */
export function secondsUntilPastCheckout(checkout: string, nowMs: number): number {
  const expiryMs = zonedDateTimeToUtcMs(nextCalendarDay(checkout), 6, ZONE);
  return Math.max(60, Math.ceil((expiryMs - nowMs) / 1000));
}

function isLetter(char: string): boolean {
  return /\p{L}/u.test(char);
}

function isMark(char: string): boolean {
  return /\p{M}/u.test(char);
}

function isApostrophe(char: string): boolean {
  return char === "'" || char === "\u2019" || char === "\u02BC";
}

function isHyphen(char: string): boolean {
  return char === "-" || char === "\u2010" || char === "\u2011";
}

function hasLetterToward(chars: string[], index: number, step: number): boolean {
  for (let i = index + step; i >= 0 && i < chars.length; i += step) {
    const char = chars[i];
    if (char === " ") return false;
    if (isLetter(char) || isMark(char)) return true;
  }
  return false;
}

function stripSensitiveTokens(input: string): string {
  return input.replace(EMAIL, " ").replace(PHONE, " ").replace(/\d+/g, "");
}

function cleanName(input: string, allowSpaces: boolean): string {
  const stripped = stripSensitiveTokens(input);
  let kept = "";
  for (const char of stripped) {
    if (isLetter(char) || isMark(char) || isApostrophe(char) || isHyphen(char)) {
      kept += char;
    } else if (allowSpaces && /\s/u.test(char)) {
      kept += " ";
    }
  }
  kept = kept.replace(/ {2,}/g, " ").trim();
  const chars = Array.from(kept);
  let result = "";
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (isLetter(char) || isMark(char) || char === " ") {
      result += char;
      continue;
    }
    if ((isApostrophe(char) || isHyphen(char)) && hasLetterToward(chars, i, -1) && hasLetterToward(chars, i, 1)) {
      result += char;
    }
  }
  result = result.replace(/ {2,}/g, " ").trim();
  if (!Array.from(result).some(isLetter)) return "";
  return result;
}

function limit(value: string, max: number): string {
  return Array.from(value).slice(0, max).join("");
}

export function sanitizeFirstName(raw: string): string {
  const token = raw.trim().split(/\s+/u)[0] ?? "";
  return limit(cleanName(token, false), FIRST_NAME_MAX);
}

export function sanitizeLastName(raw: string): string {
  return limit(cleanName(raw, true), LAST_NAME_MAX);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export const MANUAL_STAY_ID = "__manual";

export interface StayRecord {
  firstName: string;
  lastName: string;
  checkin: string;
  checkout: string;
}

export function parseCheckin(value: unknown): { ok: true; guest: Guest } | { ok: false } {
  const record = asRecord(value);
  if (!record) return { ok: false };
  if (typeof record.firstName !== "string" || typeof record.checkout !== "string") return { ok: false };
  if (!isRealCheckoutDate(record.checkout)) return { ok: false };
  const firstName = sanitizeFirstName(record.firstName);
  if (!firstName) return { ok: false };
  const lastName = typeof record.lastName === "string" ? sanitizeLastName(record.lastName) : "";
  return { ok: true, guest: { firstName, lastName, checkout: record.checkout } };
}

/** UTC timestamp → checkout calendar date in America/Los_Angeles. A bare YYYY-MM-DD is kept. */
export function checkoutDateFromEndDate(endDate: string): string | null {
  if (isRealCheckoutDate(endDate)) return endDate;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.exec(endDate);
  if (!match) return null;
  if (!isRealCheckoutDate(match[1])) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = Number(match[4]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  const ms = Date.parse(endDate);
  if (Number.isNaN(ms)) return null;
  const ymd = calendarDateInZone(ms, ZONE);
  return isRealCheckoutDate(ymd) ? ymd : null;
}

export type CheckinDecision =
  | { action: "upsert"; id: string; stay: StayRecord }
  | { action: "delete"; id: string }
  | { action: "reject" };

/** Published reservation schema uses `_id`. `id` is only a fallback. */
export function reservationId(document: Record<string, unknown>): string | null {
  const raw = typeof document._id === "string" ? document._id : typeof document.id === "string" ? document.id : "";
  if (raw === MANUAL_STAY_ID || !/^[A-Za-z0-9_-]{1,128}$/.test(raw)) return null;
  return raw;
}

function stayFromDocument(document: Record<string, unknown>): StayRecord | null {
  if (typeof document.firstName !== "string" || typeof document.startDate !== "string" || typeof document.endDate !== "string") {
    return null;
  }
  const checkin = checkoutDateFromEndDate(document.startDate);
  const checkout = checkoutDateFromEndDate(document.endDate);
  if (!checkin || !checkout || checkin > checkout) return null;
  const firstName = sanitizeFirstName(document.firstName);
  if (!firstName) return null;
  const lastName = typeof document.lastName === "string" ? sanitizeLastName(document.lastName) : "";
  return { firstName, lastName, checkin, checkout };
}

export function interpretCheckin(value: unknown, today: string): CheckinDecision {
  const record = asRecord(value);
  if (record && record.type === "reservation" && typeof record.event === "string") {
    const document = asRecord(record.document);
    if (!document) return { action: "reject" };
    const id = reservationId(document);
    if (!id) return { action: "reject" };
    if (record.event === "reservation.cancelled") return { action: "delete", id };
    if (record.event !== "reservation.created" && record.event !== "reservation.changed") {
      return { action: "reject" };
    }
    const stay = stayFromDocument(document);
    return stay ? { action: "upsert", id, stay } : { action: "reject" };
  }
  const flat = parseCheckin(value);
  if (!flat.ok || flat.guest.checkout < today) return { action: "reject" };
  return {
    action: "upsert",
    id: MANUAL_STAY_ID,
    stay: {
      firstName: flat.guest.firstName,
      lastName: flat.guest.lastName,
      checkin: today,
      checkout: flat.guest.checkout,
    },
  };
}

export function selectDisplayedStay<T extends { id: string; checkin: string; checkout: string }>(
  stays: readonly T[],
  today: string,
): T | null {
  const eligible = stays.filter((stay) => stay.checkin <= today && today <= stay.checkout);
  const arriving = eligible.filter((stay) => stay.checkin === today);
  const pool = arriving.length > 0 ? arriving : eligible;
  if (pool.length === 0) return null;
  return [...pool].sort((a, b) => {
    if (a.checkin !== b.checkin) return a.checkin < b.checkin ? 1 : -1;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  })[0];
}

export function htmlEscape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("\u2019", "&#8217;")
    .replaceAll("\u02BC", "&#700;");
}

export function timingSafeEqual(provided: string, expected: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(provided);
  const right = encoder.encode(expected);
  let diff = left.length ^ right.length;
  for (let i = 0; i < right.length; i++) {
    diff |= (left[i] ?? 0) ^ right[i];
  }
  return diff === 0;
}

export async function readLimitedBody(
  request: Request,
  maxBytes = MAX_BODY_BYTES,
): Promise<{ ok: true; text: string } | { ok: false; error: "too_large" }> {
  const declared = request.headers.get("content-length");
  if (declared !== null && declared.trim() !== "") {
    const size = Number(declared);
    if (Number.isFinite(size) && size > maxBytes) return { ok: false, error: "too_large" };
  }
  if (request.body === null) return { ok: true, text: "" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // The caller only needs the size rejection.
      }
      return { ok: false, error: "too_large" };
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder().decode(merged).replace(/^\uFEFF/, "");
  return { ok: true, text };
}
