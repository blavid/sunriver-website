export const MAX_BODY_BYTES = 2048;
export const ZONE = "America/Los_Angeles";
export const DIAG_KEY = "diag:last";
export const DIAG_UNAUTH_KEY = "diag:lastUnauthorized";
export const DIAG_TTL_SECONDS = 7 * 24 * 60 * 60;
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

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const HUMAN_DATE =
  /^(?:(?:mon|monday|tue|tues|tuesday|wed|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday|sun|sunday)\.?,?\s+)?([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?$/i;

function formatYmd(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Next calendar occurrence of a month and day on or after `today`. */
function inferHumanYear(month: number, day: number, today: string): string | null {
  const startYear = Number(today.slice(0, 4));
  for (let year = startYear; year <= startYear + 4; year++) {
    const ymd = formatYmd(year, month, day);
    if (isRealCheckoutDate(ymd) && ymd >= today) return ymd;
  }
  return null;
}

function parseHumanDate(value: string, today: string): string | null {
  const match = HUMAN_DATE.exec(value.trim().replace(/\s+/g, " "));
  if (!match) return null;
  const month = MONTHS[match[1].toLowerCase()];
  const day = Number(match[2]);
  if (!month || day < 1 || day > 31) return null;
  if (match[3]) {
    const year = Number(match[3]);
    const ymd = formatYmd(year, month, day);
    return isRealCheckoutDate(ymd) ? ymd : null;
  }
  return inferHumanYear(month, day, today);
}

/**
 * YYYY-MM-DD, an ISO timestamp (Los Angeles calendar day), or a human date
 * such as "Tue, March 11th". A human date with no year is the next occurrence
 * on or after `today`. The weekday is not used to choose the year.
 */
export function parseFlexibleDate(value: string, today: string): string | null {
  const trimmed = value.trim();
  const structured = checkoutDateFromEndDate(trimmed);
  if (structured) return structured;
  return parseHumanDate(trimmed, today);
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

const FIRST_KEYS = ["firstname", "guestfirstname", "first"] as const;
const LAST_KEYS = ["lastname", "guestlastname", "last"] as const;
const START_KEYS = ["startdate", "checkindate", "checkin", "arrivaldate"] as const;
const END_KEYS = ["enddate", "checkoutdate", "checkout", "departuredate"] as const;

function normKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function lookupString(sources: readonly Record<string, unknown>[], names: readonly string[]): string | undefined {
  for (const name of names) {
    for (const source of sources) {
      for (const [key, value] of Object.entries(source)) {
        if (normKey(key) !== name) continue;
        if (typeof value === "string" && value.trim() !== "") return value;
      }
    }
  }
  return undefined;
}

function lookupId(sources: readonly Record<string, unknown>[]): string | null {
  for (const source of sources) {
    const direct = reservationId(source);
    if (direct) return direct;
    const named = lookupString([source], ["reservationid"]);
    if (named && named !== MANUAL_STAY_ID && /^[A-Za-z0-9_-]{1,128}$/.test(named)) return named;
  }
  return null;
}

function withGuest(record: Record<string, unknown> | null): Record<string, unknown>[] {
  if (!record) return [];
  const sources = [record];
  const guest = asRecord(record.guest);
  if (guest) sources.push(guest);
  return sources;
}

function fieldSources(record: Record<string, unknown>): Record<string, unknown>[] {
  const document = asRecord(record.document);
  return [...withGuest(document), ...withGuest(record)];
}

function stayFromSources(sources: readonly Record<string, unknown>[], today: string): StayRecord | null {
  const firstRaw = lookupString(sources, FIRST_KEYS);
  const endRaw = lookupString(sources, END_KEYS);
  if (!firstRaw || !endRaw) return null;
  const checkout = parseFlexibleDate(endRaw, today);
  if (!checkout) return null;
  const startRaw = lookupString(sources, START_KEYS);
  let checkin = today;
  if (startRaw) {
    const parsed = parseFlexibleDate(startRaw, today);
    if (!parsed) return null;
    checkin = parsed;
  }
  if (checkin > checkout) return null;
  const firstName = sanitizeFirstName(firstRaw);
  if (!firstName) return null;
  const lastRaw = lookupString(sources, LAST_KEYS);
  const lastName = lastRaw ? sanitizeLastName(lastRaw) : "";
  return { firstName, lastName, checkin, checkout };
}

export function interpretCheckin(value: unknown, today: string): CheckinDecision {
  const record = asRecord(value);
  if (!record) return { action: "reject" };
  if (record.type === "reservation" && typeof record.event === "string") {
    const document = asRecord(record.document);
    if (!document) return { action: "reject" };
    const id = reservationId(document);
    if (!id) return { action: "reject" };
    if (record.event === "reservation.cancelled") return { action: "delete", id };
    if (record.event !== "reservation.created" && record.event !== "reservation.changed") {
      return { action: "reject" };
    }
    const stay = stayFromSources(withGuest(document), today);
    return stay ? { action: "upsert", id, stay } : { action: "reject" };
  }
  const sources = fieldSources(record);
  const stay = stayFromSources(sources, today);
  if (!stay) return { action: "reject" };
  const id = lookupId(sources);
  if (!id && stay.checkout < today) return { action: "reject" };
  return { action: "upsert", id: id ?? MANUAL_STAY_ID, stay };
}

export type CheckoutTarget = { kind: "id"; id: string } | { kind: "date"; checkout: string } | { kind: "none" };

/** A webhook Test button, or a body that is only the word test, must not change stored stays. */
export function isTestPayload(value: unknown, rawText: string): boolean {
  if (/^test$/i.test(rawText.trim())) return true;
  if (typeof value === "string" && /^test$/i.test(value.trim())) return true;
  const record = asRecord(value);
  if (!record) return false;
  if (record.test === true || record.test === "true") return true;
  const type = typeof record.type === "string" ? record.type.trim().toLowerCase() : "";
  const event = typeof record.event === "string" ? record.event.trim().toLowerCase() : "";
  return type === "test" || event === "test" || type === "webhook.test" || event === "webhook.test";
}

/** How an authorized checkout body chooses which stay to clear. An empty or test body clears nothing. */
export function interpretCheckout(value: unknown, today: string): CheckoutTarget {
  const record = asRecord(value);
  if (!record) return { kind: "none" };
  if (record.type === "reservation" && record.event === "reservation.cancelled") {
    const document = asRecord(record.document);
    const id = document ? reservationId(document) : null;
    return id ? { kind: "id", id } : { kind: "none" };
  }
  if (Object.keys(record).length === 0) return { kind: "none" };
  const sources = fieldSources(record);
  const id = lookupId(sources);
  if (id) return { kind: "id", id };
  const endRaw = lookupString(sources, END_KEYS);
  if (!endRaw) return { kind: "none" };
  const checkout = parseFlexibleDate(endRaw, today);
  return checkout ? { kind: "date", checkout } : { kind: "none" };
}

function stripTemplateTags(text: string): string {
  return text.replace(/\{\{[^{}]*\}\}/g, "");
}

/** Message-rule bodies may use real newlines, the two characters `\n`, or HTML breaks. */
function normalizeMessageText(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<br\b[^>]*>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "\n");
}

function stripTagsDeep(value: unknown): unknown {
  if (typeof value === "string") return stripTemplateTags(value).trim();
  if (Array.isArray(value)) return value.map(stripTagsDeep);
  const record = asRecord(value);
  if (!record) return value;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) out[key] = stripTagsDeep(entry);
  return out;
}

/**
 * Host Tools message-rule webhooks POST `{data: "<rendered message>"}`.
 * `data` may be the line template, a JSON string, an object, or the Test button's placeholder.
 */
export function unwrapHostToolsData(value: unknown, depth = 0): unknown {
  if (depth > 3) return value;
  const record = asRecord(value);
  if (!record || !("data" in record)) return value;
  const data = record.data;
  if (data === null || data === undefined) return {};
  if (asRecord(data)) return unwrapHostToolsData(stripTagsDeep(data), depth + 1);
  if (typeof data !== "string") return value;
  const parsed = messageDataValue(data);
  const parsedRecord = asRecord(parsed);
  if (parsedRecord && "data" in parsedRecord) return unwrapHostToolsData(parsedRecord, depth + 1);
  return parsed;
}

function messageDataValue(data: string): unknown {
  const trimmed = data.replace(/^\uFEFF/, "").trim();
  if (trimmed === "") return {};
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return stripTagsDeep(parsed);
      if (typeof parsed === "string") return messageDataValue(parsed);
    } catch {
      // The string is not JSON. Fall through to the line template.
    }
  }
  const text = stripTemplateTags(normalizeMessageText(data));
  if (text.trim() === "" || isHostToolsTestPlaceholder(text)) return {};
  const lines = assignmentLines(text);
  if (lines) return linesToObject(lines);
  const single = text.trim();
  if (/^[^=\s][^=]*=/.test(single) && !single.includes("\n")) return linesToObject([single]);
  return {};
}

/** The Test button sends placeholder prose, not reservation fields. Unrendered `{{tags}}` are not a guest. */
function isHostToolsTestPlaceholder(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed === "") return true;
  if (/^[^=\n]*=/m.test(trimmed)) return false;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return false;
  return /\btest\b/i.test(trimmed);
}

function assignmentLines(text: string): string[] | null {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return null;
  const useful = lines.map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
  if (!useful.some((line) => /^[^=\s][^=]*=/.test(line))) return null;
  return useful;
}

function linesToObject(lines: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of lines) {
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    out[key] = line.slice(eq + 1).trim();
  }
  return out;
}

function formToObject(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of new URLSearchParams(text)) {
    if (key) out[key] = value;
  }
  return out;
}

function parseMultipart(contentType: string, text: string): Record<string, string> | null {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  const boundary = (boundaryMatch?.[1] ?? boundaryMatch?.[2] ?? "").trim();
  if (!boundary) return null;
  const out: Record<string, string> = {};
  let found = false;
  for (const part of text.split(`--${boundary}`)) {
    const trimmed = part.trim();
    if (trimmed === "" || trimmed === "--") continue;
    const separator = part.includes("\r\n\r\n") ? "\r\n\r\n" : "\n\n";
    const splitAt = part.indexOf(separator);
    if (splitAt < 0) continue;
    const header = part.slice(0, splitAt);
    let body = part.slice(splitAt + separator.length).replace(/\r?\n$/, "");
    const nameMatch = /(?:^|;)\s*name="([^"]*)"|name=([^;\s]+)/i.exec(header);
    const name = (nameMatch?.[1] ?? nameMatch?.[2] ?? "").trim();
    if (!name) continue;
    out[name] = body.trim();
    found = true;
  }
  return found ? out : null;
}

/**
 * JSON (including `application/json` with a charset), multipart, form fields,
 * `key=value` lines, or the raw text. A missing content-type is sniffed.
 * This does not fail closed: an unreadable body comes back as text.
 */
export function parseInboundBody(contentType: string | null, text: string): { ok: true; value: unknown } {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: {} };
  const ctype = (contentType ?? "").toLowerCase();
  if (ctype.includes("multipart/form-data")) {
    const multipart = parseMultipart(contentType ?? "", text);
    if (multipart) return { ok: true, value: multipart };
  }
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[");
  if (looksJson || ctype.includes("json")) {
    try {
      return { ok: true, value: JSON.parse(trimmed) };
    } catch {
      // A declared JSON type with a form or text body is still accepted below.
    }
  }
  const lines = assignmentLines(trimmed);
  if (lines) return { ok: true, value: linesToObject(lines) };
  if (ctype.includes("application/x-www-form-urlencoded") || (!looksJson && trimmed.includes("="))) {
    return { ok: true, value: formToObject(trimmed) };
  }
  return { ok: true, value: trimmed };
}

export interface DiagSummary {
  contentType: string;
  bodyType: string;
  keys: { name: string; type: string; length: number }[];
}

function diagValueType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function diagValueLength(value: unknown): number {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).length;
  }
  if (value === null) return 0;
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object") return Object.keys(value).length;
  return 0;
}

/** Top-level key names plus value types and lengths. Values themselves are omitted. */
export function summarizeBody(
  contentType: string | null,
  parsed: { ok: true; value: unknown } | { ok: false } | null,
  tooLarge: boolean,
): DiagSummary {
  const cleaned = (contentType ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
  const summary: DiagSummary = {
    contentType: Array.from(cleaned).slice(0, 120).join(""),
    bodyType: tooLarge ? "too_large" : "unparsed",
    keys: [],
  };
  if (tooLarge || !parsed || !parsed.ok) return summary;
  summary.bodyType = diagValueType(parsed.value);
  const record = asRecord(parsed.value);
  if (!record) return summary;
  summary.keys = Object.entries(record).map(([name, entry]) => ({
    name: Array.from(name).slice(0, 80).join(""),
    type: diagValueType(entry),
    length: diagValueLength(entry),
  }));
  return summary;
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
