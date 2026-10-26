import { describe, expect, it } from "vitest";
import {
  calendarDateInZone,
  checkoutDateFromEndDate,
  htmlEscape,
  interpretCheckin,
  isRealCheckoutDate,
  selectDisplayedStay,
  parseCheckin,
  sanitizeFirstName,
  sanitizeLastName,
  secondsUntilPastCheckout,
  timingSafeEqual,
  zonedDateTimeToUtcMs,
  ZONE,
} from "../src/guest";

describe("checkout dates", () => {
  it("accepts real calendar dates only", () => {
    expect(isRealCheckoutDate("2026-11-02")).toBe(true);
    expect(isRealCheckoutDate("2024-02-29")).toBe(true);
    expect(isRealCheckoutDate("2000-02-29")).toBe(true);
    expect(isRealCheckoutDate("2026-02-29")).toBe(false);
    expect(isRealCheckoutDate("2100-02-29")).toBe(false);
    expect(isRealCheckoutDate("2026-02-31")).toBe(false);
    expect(isRealCheckoutDate("2026-13-01")).toBe(false);
    expect(isRealCheckoutDate("2026-00-10")).toBe(false);
    expect(isRealCheckoutDate("2026-1-02")).toBe(false);
    expect(isRealCheckoutDate("2026-11-02T00:00:00Z")).toBe(false);
    expect(isRealCheckoutDate(" 2026-11-02")).toBe(false);
  });

  it("resolves Pacific wall time, including DST", () => {
    expect(zonedDateTimeToUtcMs("2026-01-15", 6, ZONE)).toBe(Date.parse("2026-01-15T14:00:00.000Z"));
    expect(zonedDateTimeToUtcMs("2026-07-05", 6, ZONE)).toBe(Date.parse("2026-07-05T13:00:00.000Z"));
    expect(zonedDateTimeToUtcMs("2026-03-08", 6, ZONE)).toBe(Date.parse("2026-03-08T13:00:00.000Z"));
    expect(zonedDateTimeToUtcMs("2026-11-03", 6, ZONE)).toBe(Date.parse("2026-11-03T14:00:00.000Z"));
  });

  it("uses the Los Angeles calendar date", () => {
    expect(calendarDateInZone(Date.parse("2026-11-01T06:30:00.000Z"), ZONE)).toBe("2026-10-31");
    expect(calendarDateInZone(Date.parse("2026-11-01T07:30:00.000Z"), ZONE)).toBe("2026-11-01");
    expect(calendarDateInZone(Date.parse("2026-07-05T06:30:00.000Z"), ZONE)).toBe("2026-07-04");
  });

  it("expires a bit after checkout and never below 60 seconds", () => {
    const now = Date.parse("2026-11-01T20:00:00.000Z");
    expect(secondsUntilPastCheckout("2026-11-02", now)).toBe(151200);
    expect(secondsUntilPastCheckout("2026-11-02", Date.parse("2026-11-04T00:00:00.000Z"))).toBe(60);
  });

  it("maps a UTC endDate onto the Los Angeles checkout day, including midnight UTC", () => {
    expect(checkoutDateFromEndDate("2026-07-05T00:00:00.000Z")).toBe("2026-07-04");
    expect(checkoutDateFromEndDate("2026-01-15T00:00:00.000Z")).toBe("2026-01-14");
    expect(checkoutDateFromEndDate("2026-07-05T07:00:00.000Z")).toBe("2026-07-05");
    expect(checkoutDateFromEndDate("2026-11-01T06:30:00.000Z")).toBe("2026-10-31");
    expect(checkoutDateFromEndDate("2026-11-01T07:30:00.000Z")).toBe("2026-11-01");
    expect(checkoutDateFromEndDate("2026-11-02")).toBe("2026-11-02");
    expect(checkoutDateFromEndDate("2026-02-31T00:00:00.000Z")).toBeNull();
  });
});

describe("names", () => {
  it("keeps the first token and strips digits, phones, and other characters", () => {
    expect(sanitizeFirstName("  Ada Lovelace  ")).toBe("Ada");
    expect(sanitizeFirstName("Mary-Jane Extra")).toBe("Mary-Jane");
    expect(sanitizeFirstName("O'Brien Smith")).toBe("O'Brien");
    expect(sanitizeFirstName("Ada2")).toBe("Ada");
    expect(sanitizeFirstName("555-123-4567 Mary")).toBe("");
    expect(sanitizeFirstName("1234")).toBe("");
    expect(sanitizeFirstName("!!!")).toBe("");
    expect(sanitizeFirstName("Łukasz")).toBe("Łukasz");
    expect(sanitizeFirstName("李明 extra")).toBe("李明");
    expect(sanitizeFirstName("-Ada")).toBe("Ada");
    expect(sanitizeFirstName("Ann<script>")).toBe("Annscript");
    expect(sanitizeFirstName(`${"A".repeat(40)} more`)).toBe("A".repeat(30));
  });

  it("keeps a last name with internal spaces and drops contact data", () => {
    expect(sanitizeLastName("  de   la  Cruz ")).toBe("de la Cruz");
    expect(sanitizeLastName("García-López")).toBe("García-López");
    expect(sanitizeLastName("O'Brien")).toBe("O'Brien");
    expect(sanitizeLastName("Hopper 503-555-0199 9876 jane@example.com")).toBe("Hopper");
    expect(sanitizeLastName("José@example.com")).toBe("");
    expect(sanitizeLastName("A - B")).toBe("A B");
    expect(sanitizeLastName("---")).toBe("");
    expect(sanitizeLastName("Мария")).toBe("Мария");
    expect(sanitizeLastName("N".repeat(50))).toBe("N".repeat(40));
  });

  it("ignores extra fields and treats a missing last name as empty", () => {
    expect(
      parseCheckin({
        firstName: "Ada Lovelace",
        checkout: "2026-11-02",
        phone: "5035550100",
        email: "ada@example.com",
        pin: "1234",
      }),
    ).toEqual({
      ok: true,
      guest: { firstName: "Ada", lastName: "", checkout: "2026-11-02" },
    });
    expect(parseCheckin({ firstName: "Ada", lastName: null, checkout: "2026-11-02" })).toEqual({
      ok: true,
      guest: { firstName: "Ada", lastName: "", checkout: "2026-11-02" },
    });
    expect(parseCheckin({ firstName: "Ada", checkout: "2026-02-31" })).toEqual({ ok: false });
    expect(parseCheckin({ checkout: "2026-11-02" })).toEqual({ ok: false });
    expect(parseCheckin(["Ada"])).toEqual({ ok: false });
  });

  it("reads a Host Tools reservation and clears on cancel", () => {
    expect(
      interpretCheckin(
        {
          type: "reservation",
          event: "reservation.created",
          document: {
            _id: "5e7a6c0b0f2c9c0017b0b0b0",
            firstName: "Ada Lovelace",
            lastName: "van Hopper",
            startDate: "2026-07-01T00:00:00.000Z",
            endDate: "2026-07-05T00:00:00.000Z",
            phone: "5035550100",
            email: "ada@example.com",
            accessCode: "998877",
          },
        },
        "2026-07-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "5e7a6c0b0f2c9c0017b0b0b0",
      stay: { firstName: "Ada", lastName: "van Hopper", checkin: "2026-06-30", checkout: "2026-07-04" },
    });
    expect(
      interpretCheckin(
        {
          type: "reservation",
          event: "reservation.changed",
          document: {
            id: "res-fallback",
            firstName: "Ada",
            startDate: "2026-07-01T07:00:00.000Z",
            endDate: "2026-07-05T15:00:00.000Z",
          },
        },
        "2026-07-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "res-fallback",
      stay: { firstName: "Ada", lastName: "", checkin: "2026-07-01", checkout: "2026-07-05" },
    });
    expect(
      interpretCheckin(
        { type: "reservation", event: "reservation.cancelled", document: { _id: "res-1", status: "cancelled" } },
        "2026-07-01",
      ),
    ).toEqual({ action: "delete", id: "res-1" });
    expect(
      interpretCheckin({ type: "reservation", event: "reservation.cancelled", document: { status: "cancelled" } }, "2026-07-01"),
    ).toEqual({ action: "reject" });
    expect(
      interpretCheckin({ type: "reservation", event: "reservation.checkout", document: { _id: "res-1" } }, "2026-07-01"),
    ).toEqual({ action: "reject" });
  });

  it("hides upcoming stays and prefers the guest checking in on a turnover day", () => {
    const stays = [
      { id: "depart", checkin: "2026-11-01", checkout: "2026-11-03" },
      { id: "arrive", checkin: "2026-11-03", checkout: "2026-11-06" },
      { id: "later", checkin: "2026-11-10", checkout: "2026-11-12" },
    ];
    expect(selectDisplayedStay(stays, "2026-11-03")?.id).toBe("arrive");
    expect(selectDisplayedStay(stays, "2026-11-02")?.id).toBe("depart");
    expect(selectDisplayedStay([{ id: "later", checkin: "2026-11-10", checkout: "2026-11-12" }], "2026-11-03")).toBeNull();
    expect(selectDisplayedStay(stays, "2026-11-07")).toBeNull();
  });
});

describe("html escape and constant-time compare", () => {
  it("escapes HTML in names", () => {
    expect(htmlEscape(`A<b>&"'`)).toBe("A&lt;b&gt;&amp;&quot;&#39;");
  });

  it("compares full strings without an early length return", () => {
    expect(timingSafeEqual("same-value", "same-value")).toBe(true);
    expect(timingSafeEqual("same-value", "same-valuE")).toBe(false);
    expect(timingSafeEqual("short", "much-longer-secret")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
    expect(timingSafeEqual("x", "")).toBe(false);
  });
});
