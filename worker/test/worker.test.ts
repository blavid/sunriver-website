import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { stayKey, type Env, type GuestKv } from "../src/index";

const TOKEN = "b".repeat(32);
const PATH_KEY = "a".repeat(32);

class MemoryKv implements GuestKv {
  values = new Map<string, string>();
  ttls = new Map<string, number | undefined>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.values.set(key, value);
    this.ttls.set(key, options?.expirationTtl);
  }

  async delete(key: string): Promise<void> {
    this.values.delete(key);
    this.ttls.delete(key);
  }
}

function env(overrides: Partial<Env> = {}, kv = new MemoryKv()): { env: Env; kv: MemoryKv } {
  return {
    kv,
    env: {
      GUEST: kv,
      EAGLEWOOD_TOKEN: TOKEN,
      GUEST_PATH_KEY: PATH_KEY,
      ...overrides,
    },
  };
}

function post(path: string, body: BodyInit | null, token: string | null, extra?: HeadersInit): Request {
  const headers = new Headers(extra);
  if (token !== null) headers.set("X-Eaglewood-Token", token);
  if (body !== null && !headers.has("content-type")) headers.set("content-type", "application/json");
  return new Request(`https://sunrivertownhome.com${path}`, { method: "POST", headers, body });
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("checkin and checkout", () => {
  it("stores the three sanitized fields and drops everything else", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T20:00:00.000Z"));
    const { env: bindings, kv } = env();
    const response = await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({
          firstName: "Ada Lovelace",
          lastName: "van Hopper 503-555-0199 9876 jane@example.com",
          checkout: "2026-11-02",
          phone: "5035550100",
          pin: "1234",
          notes: "ignore me",
        }),
        TOKEN,
      ),
      bindings,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(JSON.parse(kv.values.get(stayKey("__manual")) ?? "")).toEqual({
      firstName: "Ada",
      lastName: "van Hopper",
      checkin: "2026-11-01",
      checkout: "2026-11-02",
    });
    expect(kv.ttls.get(stayKey("__manual"))).toBe(151200);
    expect(kv.values.get("idx")).not.toContain("503");
    expect(kv.values.get(stayKey("__manual"))).not.toContain("503");
  });

  it("rejects a missing token, a wrong token, and a missing secret", async () => {
    const missing = await worker.fetch(post("/tv/checkin", "{}", null), env().env);
    expect(missing.status).toBe(401);
    expect(await missing.json()).toEqual({ error: "unauthorized" });

    const wrong = await worker.fetch(post("/tv/checkin", "{}", "nope"), env().env);
    expect(wrong.status).toBe(401);

    const unset = await worker.fetch(post("/tv/checkout", null, TOKEN), env({ EAGLEWOOD_TOKEN: "" }).env);
    expect(unset.status).toBe(500);
    expect(await unset.json()).toEqual({ error: "misconfigured" });
  });

  it("returns 400 for form bodies, odd JSON, and impossible dates", async () => {
    const { env: bindings } = env();
    const form = await worker.fetch(
      post("/tv/checkin", "firstName=Ada&checkout=2026-11-02", TOKEN, {
        "content-type": "application/x-www-form-urlencoded",
      }),
      bindings,
    );
    expect(form.status).toBe(400);
    expect(await form.json()).toEqual({ error: "invalid JSON" });

    const odd = await worker.fetch(post("/tv/checkin", "not-json", TOKEN), bindings);
    expect(odd.status).toBe(400);

    const arrayBody = await worker.fetch(post("/tv/checkin", "[]", TOKEN), bindings);
    expect(arrayBody.status).toBe(400);
    expect(await arrayBody.json()).toEqual({ error: "invalid checkin" });

    const badDate = await worker.fetch(
      post("/tv/checkin", JSON.stringify({ firstName: "Ada", checkout: "2026-02-31" }), TOKEN),
      bindings,
    );
    expect(badDate.status).toBe(400);

    const emptyName = await worker.fetch(
      post("/tv/checkin", JSON.stringify({ firstName: "555-1212", checkout: "2026-11-02" }), TOKEN),
      bindings,
    );
    expect(emptyName.status).toBe(400);
  });

  it("caps the body at 2KB", async () => {
    const { env: bindings, kv } = env();
    const tooBig = await worker.fetch(post("/tv/checkin", "x".repeat(2049), TOKEN), bindings);
    expect(tooBig.status).toBe(413);
    expect(kv.values.size).toBe(0);

    const headerOnly = await worker.fetch(
      post("/tv/checkout", "small", TOKEN, { "content-length": "3000" }),
      bindings,
    );
    expect(headerOnly.status).toBe(413);
  });

  it("deletes the stay currently on screen", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T18:00:00.000Z"));
    const { env: bindings, kv } = env();
    await worker.fetch(
      post("/tv/checkin", JSON.stringify({ firstName: "Ada", lastName: "Lovelace", checkout: "2026-11-04" }), TOKEN),
      bindings,
    );
    const response = await worker.fetch(post("/tv/checkout", null, TOKEN), bindings);
    expect(response.status).toBe(200);
    expect(kv.values.has(stayKey("__manual"))).toBe(false);
  });

  it("accepts the token in the query string without logging the URL", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T20:00:00.000Z"));
    const calls: unknown[][] = [];
    for (const method of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        calls.push(args);
      });
    }
    const { env: bindings, kv } = env();
    const response = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/checkin?token=${TOKEN}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Ada", checkout: "2026-11-02" }),
      }),
      bindings,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(JSON.stringify([...kv.values.values()])).toContain("Ada");
    const dumped = JSON.stringify(calls);
    expect(dumped).not.toContain(TOKEN);
    expect(dumped).not.toContain("sunrivertownhome.com");

    const wrong = await worker.fetch(
      new Request("https://sunrivertownhome.com/tv/checkin?token=nope", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Ada", checkout: "2026-11-02" }),
      }),
      bindings,
    );
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual({ error: "unauthorized" });
  });

  it("stores a Host Tools reservation using the Los Angeles checkout day and clears on cancel", async () => {
    const { env: bindings, kv } = env();
    const created = await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({
          type: "reservation",
          event: "reservation.created",
          document: {
            _id: "res-ada",
            firstName: "Ada Lovelace",
            lastName: "van Hopper",
            startDate: "2026-07-01T00:00:00.000Z",
            endDate: "2026-07-05T00:00:00.000Z",
            phone: "5035550100",
            email: "ada@example.com",
            accessCode: "998877",
          },
        }),
        TOKEN,
      ),
      bindings,
    );
    expect(created.status).toBe(200);
    const stored = kv.values.get(stayKey("res-ada")) ?? "";
    expect(JSON.parse(stored)).toEqual({
      firstName: "Ada",
      lastName: "van Hopper",
      checkin: "2026-06-30",
      checkout: "2026-07-04",
    });
    expect(stored).not.toContain("5035550100");
    expect(stored).not.toContain("ada@example.com");
    expect(stored).not.toContain("998877");
    expect(Object.keys(JSON.parse(stored)).sort()).toEqual(["checkin", "checkout", "firstName", "lastName"]);

    const changed = await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({
          type: "reservation",
          event: "reservation.changed",
          document: {
            _id: "res-ada",
            firstName: "Bea",
            lastName: "Ng",
            startDate: "2026-01-10T00:00:00.000Z",
            endDate: "2026-01-15T00:00:00.000Z",
          },
        }),
        TOKEN,
      ),
      bindings,
    );
    expect(changed.status).toBe(200);
    expect(JSON.parse(kv.values.get(stayKey("res-ada")) ?? "").checkout).toBe("2026-01-14");
    expect(JSON.parse(kv.values.get("idx") ?? "")).toHaveLength(1);

    const cancelled = await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({ type: "reservation", event: "reservation.cancelled", document: { _id: "res-ada" } }),
        TOKEN,
      ),
      bindings,
    );
    expect(cancelled.status).toBe(200);
    expect(kv.values.has(stayKey("res-ada"))).toBe(false);
  });

  it("shows the arriving guest on a turnover day and hides an upcoming stay", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T18:00:00.000Z"));
    const { env: bindings, kv } = env();
    for (const document of [
      { _id: "depart", firstName: "Ann", lastName: "Old", startDate: "2026-11-01", endDate: "2026-11-03" },
      { _id: "arrive", firstName: "Bea", lastName: "New", startDate: "2026-11-03", endDate: "2026-11-06" },
      { _id: "later", firstName: "Cy", lastName: "Soon", startDate: "2026-11-10", endDate: "2026-11-12", phone: "5551234" },
    ]) {
      const response = await worker.fetch(
        post("/tv/checkin", JSON.stringify({ type: "reservation", event: "reservation.created", document }), TOKEN),
        bindings,
      );
      expect(response.status).toBe(200);
    }
    const shown = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`), bindings);
    expect(await shown.json()).toEqual({ firstName: "Bea", lastName: "New", checkout: "2026-11-06" });
    expect(kv.values.get(stayKey("later"))).not.toContain("5551234");

    vi.setSystemTime(new Date("2026-11-02T18:00:00.000Z"));
    const beforeArrival = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`), bindings);
    expect(await beforeArrival.json()).toEqual({ firstName: "Ann", lastName: "Old", checkout: "2026-11-03" });
  });

  it("prunes stays whose checkout date has passed and keeps current ones", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T18:00:00.000Z"));
    const { env: bindings, kv } = env();
    await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({
          type: "reservation",
          event: "reservation.created",
          document: { _id: "past", firstName: "Ann", startDate: "2026-10-28", endDate: "2026-10-30" },
        }),
        TOKEN,
      ),
      bindings,
    );
    await worker.fetch(
      post(
        "/tv/checkin",
        JSON.stringify({
          type: "reservation",
          event: "reservation.created",
          document: { _id: "current", firstName: "Bea", startDate: "2026-11-01", endDate: "2026-11-04" },
        }),
        TOKEN,
      ),
      bindings,
    );
    vi.setSystemTime(new Date("2026-11-03T08:15:00.000Z"));
    const pending: Promise<unknown>[] = [];
    await worker.scheduled(null, bindings, {
      waitUntil(promise) {
        pending.push(promise);
      },
    });
    await Promise.all(pending);
    expect(kv.values.has(stayKey("past"))).toBe(false);
    expect(JSON.parse(kv.values.get(stayKey("current")) ?? "").firstName).toBe("Bea");
    expect(JSON.parse(kv.values.get("idx") ?? "")).toEqual([
      { id: "current", checkin: "2026-11-01", checkout: "2026-11-04" },
    ]);
  });
});

describe("guest json", () => {
  it("serves the guest only at the secret path", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T18:00:00.000Z"));
    const { env: bindings, kv } = env();
    kv.values.set("idx", JSON.stringify([{ id: "raw", checkin: "2026-11-01", checkout: "2026-11-02" }]));
    kv.values.set(
      stayKey("raw"),
      JSON.stringify({ firstName: "O'Brien", lastName: "A<b>", checkin: "2026-11-01", checkout: "2026-11-02" }),
    );

    const ok = await worker.fetch(new Request(`https://eaglewood-tv.example.workers.dev/tv/${PATH_KEY}/guest.json`), bindings);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("application/json");
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect(ok.headers.get("access-control-allow-origin")).toBe("*");
    expect(await ok.json()).toEqual({
      firstName: "O&#39;Brien",
      lastName: "A&lt;b&gt;",
      checkout: "2026-11-02",
    });

    const oldPath = await worker.fetch(new Request("https://sunrivertownhome.com/tv/guest.json"), bindings);
    expect(oldPath.status).toBe(404);

    const wrong = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${"c".repeat(32)}/guest.json`), bindings);
    expect(wrong.status).toBe(404);
    expect(wrong.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("returns an empty object after the checkout date in Los Angeles", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-03T08:00:00.000Z"));
    const { env: bindings, kv } = env();
    kv.values.set("idx", JSON.stringify([{ id: "ada", checkin: "2026-11-01", checkout: "2026-11-02" }]));
    kv.values.set(
      stayKey("ada"),
      JSON.stringify({ firstName: "Ada", lastName: "Lovelace", checkin: "2026-11-01", checkout: "2026-11-02" }),
    );
    const response = await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`), bindings);
    expect(await response.json()).toEqual({});
  });

  it("returns an empty object when no guest is stored", async () => {
    const response = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`),
      env().env,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({});
  });

  it("404s when the path key is unset or shorter than 24 characters", async () => {
    const unset = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`),
      env({ GUEST_PATH_KEY: undefined }).env,
    );
    expect(unset.status).toBe(404);

    const shortKey = "a".repeat(23);
    const short = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/${shortKey}/guest.json`),
      env({ GUEST_PATH_KEY: shortKey }).env,
    );
    expect(short.status).toBe(404);
  });

  it("uses 405 only after the path key matches", async () => {
    const wrongMethod = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`, { method: "POST" }),
      env().env,
    );
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("allow")).toBe("GET");

    const guessed = await worker.fetch(
      new Request(`https://sunrivertownhome.com/tv/${"c".repeat(32)}/guest.json`, { method: "POST" }),
      env().env,
    );
    expect(guessed.status).toBe(404);
  });
});

describe("other routes", () => {
  it("rejects the wrong method and unknown paths", async () => {
    const getCheckin = await worker.fetch(new Request("https://sunrivertownhome.com/tv/checkin"), env().env);
    expect(getCheckin.status).toBe(405);
    expect(getCheckin.headers.get("allow")).toBe("POST");

    const missing = await worker.fetch(new Request("https://sunrivertownhome.com/tv/nope"), env().env);
    expect(missing.status).toBe(404);
  });

  it("does not log the token or the path key", async () => {
    const calls: unknown[][] = [];
    for (const method of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        calls.push(args);
      });
    }
    const { env: bindings } = env();
    await worker.fetch(post("/tv/checkin", JSON.stringify({ firstName: "Ada", checkout: "2026-11-02" }), TOKEN), bindings);
    await worker.fetch(post("/tv/checkin", "{}", "wrong-token"), bindings);
    await worker.fetch(new Request(`https://sunrivertownhome.com/tv/${PATH_KEY}/guest.json`), bindings);
    const dumped = JSON.stringify(calls);
    expect(dumped).not.toContain(TOKEN);
    expect(dumped).not.toContain(PATH_KEY);
  });
});
