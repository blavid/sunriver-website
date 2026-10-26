# Eaglewood TV worker

Free-tier Cloudflare Worker for the Roku welcome screen. It stores one current guest in KV and serves that guest at an unguessable path. It does not change the Next.js site, the Pages build, or DNS.

Run every command below from this `worker` directory. Deploy needs Blake's Cloudflare account (`npx wrangler login`). Nothing in this folder deploys itself.

## Deploy

```bash
cd worker
npm install
npx wrangler login
npx wrangler kv namespace create GUEST
```

Copy the printed namespace id into `wrangler.toml`, replacing `id = "placeholder"`.

```bash
npx wrangler secret put EAGLEWOOD_TOKEN
openssl rand -hex 16 | npx wrangler secret put GUEST_PATH_KEY
npx wrangler deploy
```

`openssl rand -hex 16` prints 32 hex characters. `GUEST_PATH_KEY` must be at least 24 characters. The worker reads it only from that secret. Do not hard-code it, commit it, or paste the guest URL into a public log. The URL path is the secret.

`wrangler deploy` publishes the worker and attaches the route `sunrivertownhome.com/tv/*` on the existing zone. It does not create DNS records. `workers_dev` stays on, so the same paths also work on the `*.workers.dev` hostname printed after deploy.

Generate `EAGLEWOOD_TOKEN` the same way (`openssl rand -hex 16`) and pass it only to `wrangler secret put`. Do not commit either secret.

## HTTP API

| Request | Auth | Result |
| --- | --- | --- |
| `POST /tv/checkin` | `X-Eaglewood-Token` | Store `{firstName, lastName, checkout}` at KV key `current` |
| `POST /tv/checkout` | `X-Eaglewood-Token` | Delete `current` |
| `GET /tv/<GUEST_PATH_KEY>/guest.json` | Path secret | Current guest, or `{}` |
| Anything else | | `404`, or `405` when the path is known and the method is wrong |

Check-in JSON is `{ "firstName", "lastName", "checkout" }`. `checkout` is `YYYY-MM-DD` and must be a real calendar date. Every other field is ignored. `lastName` is optional and is stored as `""` when it is missing.

`firstName` keeps only the first whitespace-separated token. Both names keep Unicode letters, apostrophes, and hyphens. `lastName` may also keep internal spaces. Digits, email addresses, phone numbers, and PINs are stripped. Caps are 30 characters (`firstName`) and 40 (`lastName`). An empty `firstName` is a 400.

The body limit is 2048 bytes. A larger body is 413. A form body or other non-JSON body is 400.

The token is compared in constant time. A missing or wrong token is 401. If `EAGLEWOOD_TOKEN` is unset, POSTs return 500. If `GUEST_PATH_KEY` is unset, shorter than 24 characters, or not an exact match, the guest URL is 404.

KV `expirationTtl` is the number of seconds until 06:00 `America/Los_Angeles` on the day after `checkout` (at least 60 seconds). `GET` returns `{}` when nothing is stored or when today's date in `America/Los_Angeles` is after `checkout`. The checkout date itself still returns the guest. Names are HTML-escaped in the JSON response. Response headers are `Content-Type: application/json`, `Cache-Control: no-store`, and `Access-Control-Allow-Origin: *`.

## curl

```bash
export EAGLEWOOD_TOKEN
export GUEST_PATH_KEY
BASE=https://sunrivertownhome.com

curl -sS -D - -o - -X POST "$BASE/tv/checkin" \
  -H "content-type: application/json" \
  -H "X-Eaglewood-Token: $EAGLEWOOD_TOKEN" \
  --data '{"firstName":"Ada Lovelace","lastName":"van Hopper","checkout":"2026-11-02","phone":"555-0100"}'

curl -sS -D - "$BASE/tv/$GUEST_PATH_KEY/guest.json"

curl -sS -D - -o - -X POST "$BASE/tv/checkout" \
  -H "X-Eaglewood-Token: $EAGLEWOOD_TOKEN"

curl -sS -o - -w "\n%{http_code}\n" -X POST "$BASE/tv/checkin" \
  -H "content-type: application/json" \
  -H "X-Eaglewood-Token: wrong" \
  --data '{"firstName":"Ada","checkout":"2026-11-02"}'
```

A successful check-in returns `{"ok":true}`. The guest request then returns:

```json
{"firstName":"Ada","lastName":"van Hopper","checkout":"2026-11-02"}
```

An apostrophe is escaped, so `O'Brien` is returned as `O&#39;Brien`. The wrong-token curl returns 401. After checkout, `guest.json` returns `{}`.

Use the `*.workers.dev` host from `wrangler deploy` the same way if the zone route is not attached yet.

## Tests

```bash
cd worker
npm install
npm test
```

## Host Tools

Confirmed template variables:

- Guest first name: `{{Guest First Name}}`
- Checkout date: `{{Check-Out Date}}`
- Guest last name: `{{Guest Last Name}}`

Sources:

- [Host Tools Tags Explained](https://help.hosttools.com/en/articles/10536075-host-tools-tags-explained) shows `{{Guest First Name}}` and `{{Check-Out Date}}`. In that article the checkout tag renders as a human date (`Tue, March 11th`), not `YYYY-MM-DD`.
- [Update Reservation](https://docs.hosttools.com/reference/post_api-setreservation-reservationid) says `firstName` is used in `{{Guest First Name}}` and `lastName` is used in `{{Guest Last Name}}`.

Message-rule webhooks, from [How do I use Webhooks on Host Tools?](https://help.hosttools.com/en/articles/6236532-how-do-i-use-webhooks-on-host-tools):

1. Create a message rule (Messaging, then Add Message Rule).
2. Pick an event. The article says webhooks can fire for a new reservation, a modification, a time before check-in, or checkout. Use a check-in-time event for `POST /tv/checkin` and the checkout event for `POST /tv/checkout`.
3. Set Send To to `webhook`.
4. Set the URL to `https://sunrivertownhome.com/tv/checkin` or `https://sunrivertownhome.com/tv/checkout`.

The separate reservation webhook is documented at [Webhook Reservation](https://docs.hosttools.com/reference/post_webhooks-reservation). That POST is `{ type, event, document }`. Guest fields on `document` are `firstName`, `lastName`, and `endDate`. `endDate` is described as the check-out date in UTC, with example `2022-05-20T00:00:00.000Z`, not a bare `YYYY-MM-DD`.

**Unverified:** the message-rule help article does not document a custom JSON body or custom request headers. It is not confirmed that Host Tools can send `X-Eaglewood-Token` or `{"firstName","lastName","checkout"}` by itself. Pointing either Host Tools webhook straight at this worker will not check a guest in unless the body and header match this API. The API webhook's `X-HostTools-Signature` is not this worker's token.

Use an intermediary (Zapier, Make, or similar) that can set `X-Eaglewood-Token` and POST only:

```json
{
  "firstName": "<document.firstName>",
  "lastName": "<document.lastName>",
  "checkout": "YYYY-MM-DD"
}
```

Take `checkout` from the reservation's check-out calendar date. Do not send the rendered `{{Check-Out Date}}` string (`Tue, March 11th`). If you slice `document.endDate` to the first 10 characters, confirm that UTC date is the same calendar date you want in `America/Los_Angeles`. That timezone conversion is unverified against a live Host Tools payload.
