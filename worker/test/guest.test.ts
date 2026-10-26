import { describe, expect, it } from "vitest";
import {
  calendarDateInZone,
  checkoutDateFromEndDate,
  htmlEscape,
  interpretCheckin,
  interpretCheckout,
  isRealCheckoutDate,
  parseFlexibleDate,
  parseInboundBody,
  selectDisplayedStay,
  parseCheckin,
  sanitizeFirstName,
  sanitizeLastName,
  secondsUntilPastCheckout,
  summarizeBody,
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

  it("infers the next human checkout date on or after today in Los Angeles", () => {
    expect(parseFlexibleDate("2026-11-02", "2026-10-26")).toBe("2026-11-02");
    expect(parseFlexibleDate("2026-07-05T00:00:00.000Z", "2026-07-01")).toBe("2026-07-04");
    expect(parseFlexibleDate("Tue, March 11th", "2026-10-26")).toBe("2027-03-11");
    expect(parseFlexibleDate("March 11th", "2026-03-11")).toBe("2026-03-11");
    expect(parseFlexibleDate("March 11th", "2026-03-12")).toBe("2027-03-11");
    expect(parseFlexibleDate("March 11th, 2024", "2026-10-26")).toBe("2024-03-11");
    expect(parseFlexibleDate("February 29th", "2027-01-01")).toBe("2028-02-29");
    expect(parseFlexibleDate("February 29th", "2028-03-01")).toBe("2032-02-29");
    expect(parseFlexibleDate("February 29th, 2027", "2026-01-01")).toBeNull();
    expect(parseFlexibleDate("Notamonth 11th", "2026-10-26")).toBeNull();
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
    expect(
      interpretCheckin(
        {
          type: "reservation",
          event: "reservation.created",
          document: { _id: "no-start", firstName: "Ada", endDate: "2026-11-04" },
        },
        "2026-11-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "no-start",
      stay: { firstName: "Ada", lastName: "", checkin: "2026-11-01", checkout: "2026-11-04" },
    });
  });

  it("reads a flat reservation, a guest object, and a human checkout date", () => {
    expect(
      interpretCheckin(
        {
          _id: "res-flat",
          firstName: "Ada Lovelace",
          lastName: "Ng",
          startDate: "2026-07-01T00:00:00.000Z",
          endDate: "2026-07-05T00:00:00.000Z",
          phone: "5035550100",
        },
        "2026-07-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "res-flat",
      stay: { firstName: "Ada", lastName: "Ng", checkin: "2026-06-30", checkout: "2026-07-04" },
    });
    expect(
      interpretCheckin(
        {
          _id: "res-9",
          guest: { firstName: "Ada Lovelace", lastName: "Hopper" },
          endDate: "2026-11-04",
        },
        "2026-11-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "res-9",
      stay: { firstName: "Ada", lastName: "Hopper", checkin: "2026-11-01", checkout: "2026-11-04" },
    });
    expect(
      interpretCheckin(
        { document: { _id: "wrapped", firstName: "Bea", startDate: "2026-11-02", endDate: "2026-11-05" } },
        "2026-11-01",
      ),
    ).toEqual({
      action: "upsert",
      id: "wrapped",
      stay: { firstName: "Bea", lastName: "", checkin: "2026-11-02", checkout: "2026-11-05" },
    });
    expect(interpretCheckin({ first: "Ada", last: "Ng", checkout: "Tue, March 11th" }, "2026-10-26")).toEqual({
      action: "upsert",
      id: "__manual",
      stay: { firstName: "Ada", lastName: "Ng", checkin: "2026-10-26", checkout: "2027-03-11" },
    });
    expect(interpretCheckin({ firstName: "Ada", checkout: "2026-01-01" }, "2026-11-01")).toEqual({ action: "reject" });
  });

  it("parses form and line bodies and summarizes them without values", () => {
    expect(parseInboundBody("text/plain", "first=Ada\nlast=Ng\ncheckout=Tue, March 11th")).toEqual({
      ok: true,
      value: { first: "Ada", last: "Ng", checkout: "Tue, March 11th" },
    });
    expect(parseInboundBody("application/x-www-form-urlencoded", "first=Ada+Lovelace&checkout=2026-11-02")).toEqual({
      ok: true,
      value: { first: "Ada Lovelace", checkout: "2026-11-02" },
    });
    expect(parseInboundBody("application/json", "not-json")).toEqual({ ok: true, value: "not-json" });
    expect(
      parseInboundBody(
        "application/json; charset=utf-8",
        JSON.stringify({ firstName: "Ada", checkout: "2026-11-02" }),
      ).value,
    ).toEqual({ firstName: "Ada", checkout: "2026-11-02" });
    expect(
      parseInboundBody(
        'multipart/form-data; boundary=bound',
        '--bound\r\nContent-Disposition: form-data; name="first"\r\n\r\nAda Lovelace\r\n--bound\r\nContent-Disposition: form-data; name="checkout"\r\n\r\n2026-11-02\r\n--bound--\r\n',
      ).value,
    ).toEqual({ first: "Ada Lovelace", checkout: "2026-11-02" });

    const token = "b".repeat(32);
    const parsed = parseInboundBody(
      "application/json",
      JSON.stringify({ firstName: "Ada", phone: "5035550100", document: { accessCode: "998877" }, token }),
    );
    const summary = summarizeBody("application/json", parsed, false);
    const dumped = JSON.stringify(summary);
    expect(dumped).not.toContain("Ada");
    expect(dumped).not.toContain("5035550100");
    expect(dumped).not.toContain("998877");
    expect(dumped).not.toContain(token);
    expect(summary).toEqual({
      contentType: "application/json",
      bodyType: "object",
      keys: [
        { name: "firstName", type: "string", length: 3 },
        { name: "phone", type: "string", length: 10 },
        { name: "document", type: "object", length: 1 },
        { name: "token", type: "string", length: 32 },
      ],
    });
    expect(interpretCheckout({ _id: "res-1", endDate: "2026-11-03", firstName: "Ann" }, "2026-11-03")).toEqual({
      kind: "id",
      id: "res-1",
    });
    expect(interpretCheckout({ checkout: "Tue, March 11th" }, "2026-10-26")).toEqual({
      kind: "date",
      checkout: "2027-03-11",
    });
    expect(interpretCheckout({}, "2026-10-26")).toEqual({ kind: "none" });
    expect(interpretCheckout({ phone: "5035550100" }, "2026-10-26")).toEqual({ kind: "none" });
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
