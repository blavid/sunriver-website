# Eaglewood TV worker

Free-tier Cloudflare Worker for the Roku welcome screen. It stores one current guest in KV and serves that guest at an unguessable path. It does not change the Next.js site, the Pages build, or DNS.

Run every command below from this `worker` directory. Deploy needs Blake's Cloudflare account (`npx wrangler login`). Nothing in this folder deploys itself.

## Deploy

The KV namespace `GUEST` is already created. Its id, `c4631133b163480dbafb12601d16d658`, is already in `wrangler.toml`. That id is not a secret. Do not run `wrangler kv namespace create` again.

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put EAGLEWOOD_TOKEN
openssl rand -hex 16 | npx wrangler secret put GUEST_PATH_KEY
npx wrangler secret put WIFI_SSID
npx wrangler secret put WIFI_PASSWORD
npx wrangler deploy
```

`openssl rand -hex 16` prints 32 hex characters. `GUEST_PATH_KEY` must be at least 24 characters. The worker reads it only from that secret. Do not hard-code it, commit it, or paste the guest URL into a public log. The URL path is the secret.

`npx wrangler secret put WIFI_SSID` and `npx wrangler secret put WIFI_PASSWORD` prompt for the value. Type it at the prompt. Do not pass it as an argument, commit it, or log it. The worker does not log the network name, the password, or the QR text. `WIFI_TYPE` is optional and defaults to `WPA`. Set it only when the network is not WPA, the same way: `npx wrangler secret put WIFI_TYPE`.

`wrangler deploy` publishes the worker, attaches the route `sunrivertownhome.com/tv/*` on the existing zone, and registers the cron in `wrangler.toml`: `15 8 * * *` (08:15 UTC, which is 00:15 PST or 01:15 PDT). There is no separate cron command. The Workers Free plan allows 5 cron triggers per account ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). Deploy does not create DNS records. `workers_dev` stays on, so the same paths also work on the `*.workers.dev` hostname printed after deploy.

Generate `EAGLEWOOD_TOKEN` the same way (`openssl rand -hex 16`) and pass it only to `wrangler secret put`. Do not commit either secret.

## HTTP API

| Request | Auth | Result |
| --- | --- | --- |
| `POST /tv/checkin` | Header `X-Eaglewood-Token` or `?token=` | Upsert one stay, or delete that reservation on `reservation.cancelled`. A test, empty, or unusable body is `{"ok":true,"stored":false}` |
| `POST /tv/checkout` | Header `X-Eaglewood-Token` or `?token=` | Delete the stay with that reservation id or checkout date. An empty or test body does not delete anything |
| `GET` or `HEAD` on those paths | Same token | `200` and no KV write. A trailing slash is the same path |
| `OPTIONS` on those paths | None | `204` CORS preflight. No token and no KV write |
| `GET /tv/<GUEST_PATH_KEY>/guest.json` | Path secret | The in-progress stay as `{firstName, lastName, checkout}`, or `{}` |
| `GET /tv/<GUEST_PATH_KEY>/diag.json` | Path secret | The last authorized POST, redacted: content-type, top-level key names, value types and lengths |
| `GET /tv/<GUEST_PATH_KEY>/wifi.json` | Path secret | `{ssid, password}` from the `WIFI_SSID` and `WIFI_PASSWORD` secrets |
| `GET /tv/<GUEST_PATH_KEY>/wifi.png` | Path secret | PNG QR of `WIFI:T:<type>;S:<ssid>;P:<password>;;`, about 480 px, quiet zone of 2 modules |
| Anything else | | `404`, or `405` when the path is known and the method is wrong |

Each stay is its own KV key, `s:<reservation id>`. The value is only `{firstName, lastName, checkin, checkout}`. A small `idx` key lists ids and dates so `guest.json` does not call KV `list`. Host Tools reservation ids are `document._id` in the [reservation webhook schema](https://docs.hosttools.com/reference/post_webhooks-reservation) (required; example `5e7a6c0b0f2c9c0017b0b0b0`). That schema has no `id` field. If `_id` is missing and `id` is present, that value is used instead.

`startDate` and `endDate` are both converted to America/Los_Angeles calendar dates. Midnight UTC is the previous evening in Los Angeles for most of the year, so `2026-07-05T00:00:00.000Z` is `2026-07-04`. A bare `YYYY-MM-DD` is kept. Phone, email, door codes, and every other document field are dropped.

`reservation.created` and `reservation.changed` upsert that id. A later `reservation.changed` replaces the dates. `reservation.cancelled` deletes that id only. There is no native checkout event.

`GET` returns `{firstName, lastName, checkout}` for the stay where `checkin <= today <= checkout` in America/Los_Angeles. An upcoming stay stays hidden. On a turnover day, the stay whose `checkin` is today wins over the one checking out today. Each record's `expirationTtl` runs until 06:00 Los Angeles on the day after `checkout` (at least 60 seconds). The daily cron deletes index entries whose `checkout` is already before today. It reads `idx` once and does not list the namespace.

The flat `POST /tv/checkin` body `{firstName, lastName, checkout}` still works. It has no reservation id and no start date, so it is stored as id `__manual` with `checkin` set to today in Los Angeles and the checkout you sent. A flat reservation that includes `_id` (or `id`) and `startDate` / `endDate` is stored under that id. `guest.firstName` is used when the top-level name is missing. `POST /tv/checkout` deletes the reservation id in the body, or every stay with that checkout date. An empty checkout body does not delete a stay. A checkout body that names a date does not clear a different guest who is checking in the same day.

`firstName` keeps only the first whitespace-separated token. Both names keep Unicode letters, apostrophes, and hyphens. `lastName` may also keep internal spaces. Digits, email addresses, phone numbers, and PINs are stripped. Caps are 30 characters (`firstName`) and 40 (`lastName`). An empty `firstName` is not stored.

The body limit is 2048 bytes. A larger body is 413. With a valid token, a body that cannot be parsed is not a 4xx or 5xx. The worker accepts a missing content-type, `application/json` with a charset, `multipart/form-data`, form fields, and text. Host Tools message rules POST `{"data":"<rendered message>"}`. A string `data` value is parsed as JSON when it is JSON, and otherwise as `first=` / `last=` / `checkout=` lines. Real newlines, `\r\n`, the two characters `\n`, and `<br>` or `<p>` tags are line breaks. Extra whitespace is ignored. Unrendered `{{...}}` tags are removed. If `data` is already an object, that object is the payload. An empty `data` string, or the Test button's placeholder text, returns `{"ok":true,"stored":false}`. A test payload, an empty body, or a body with no usable name and date returns `{"ok":true,"stored":false}` and does not change stored stays. `/tv/checkin` and `/tv/checkout` are the same with or without a trailing slash. `OPTIONS` returns 204 with `Access-Control-Allow-Origin: *` and does not require a token.

Check-in and checkout dates may be `YYYY-MM-DD`, an ISO timestamp, or a human date such as `Tue, March 11th`. A human date with no year is the next occurrence of that month and day on or after today in America/Los_Angeles. The weekday is ignored. When no start date is present, check-in is today.

Every authorized `POST` writes KV key `diag:last` for 7 days. The value is the content-type, the body's top-level key names, and each value's type and length. It does not contain field values, the query string, or the token. `GET /tv/<GUEST_PATH_KEY>/diag.json` returns that object with `Cache-Control: no-store`. A missing or wrong token writes a separate key, `diag:lastUnauthorized`, for 7 days: the method, the content-type, and two booleans for whether a `token` query parameter and the `X-Eaglewood-Token` header were present. That record does not contain the token or the body. `GET` and `HEAD` with a valid token write nothing.

The header and the `token` query parameter are each compared to `EAGLEWOOD_TOKEN` in constant time. Either match is enough. A missing or wrong token is 401. If `EAGLEWOOD_TOKEN` is unset, check-in and checkout return 500. The worker does not log the request URL or the token. If `GUEST_PATH_KEY` is unset, shorter than 24 characters, or not an exact match, `guest.json`, `diag.json`, `wifi.json`, and `wifi.png` are 404.

`wifi.json` and `wifi.png` use that same path check before they read the Wi-Fi secrets. A wrong key is 404 and does not say whether the secrets are set. If `WIFI_SSID` or `WIFI_PASSWORD` is missing or empty, both routes return 503 with an empty body and `Cache-Control: no-store`. The body does not name the missing secret. `WIFI_TYPE` defaults to `WPA` when it is unset or blank.

Characters `\`, `;`, `,`, `"`, and `:` in the network name, password, and type are escaped with a backslash in the QR text. The image is a non-interlaced 8-bit RGB PNG, about 480 px on a side, with a quiet zone of 2 modules. It is drawn in the worker with the MIT library `uqr`. No outside QR service is called.

A successful Wi-Fi response sends `Cache-Control: private, max-age=3600` and an `ETag`. The validator is the SHA-256 hex of `ssid|password|fmtVersion`, quoted. `fmtVersion` is `2|<json or png>|<type>|480|q2`, so the JSON and the PNG do not share an ETag. Version 2 is the RGB PNG. A cached copy from version 1 must be fetched again. `If-None-Match` with that value, a `W/` prefix, or `*` returns 304 and an empty body. Check-in, checkout, `guest.json`, and `diag.json` are unchanged.

Names are HTML-escaped in `guest.json`. That response also sends `Cache-Control: no-store` and `Access-Control-Allow-Origin: *`.

`guest.json` costs two KV reads (the index, then one stay). The Workers Free KV allowance is 100,000 reads, 1,000 writes, 1,000 deletes, and 1,000 list requests per day ([KV pricing](https://developers.cloudflare.com/kv/platform/pricing/)). One poll a minute is about 2,880 reads a day. This worker never calls KV list. Writes happen on check-in, cancel, and the daily prune. The same index key can be written once a second ([KV limits](https://developers.cloudflare.com/kv/platform/limits/)).

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

curl -sS -D - -o - -X POST "$BASE/tv/checkin?token=$EAGLEWOOD_TOKEN" \
  -H "content-type: application/json" \
  --data '{"type":"reservation","event":"reservation.created","document":{"_id":"5e7a6c0b0f2c9c0017b0b0b0","firstName":"Ada Lovelace","lastName":"van Hopper","startDate":"2026-07-01T00:00:00.000Z","endDate":"2026-07-05T00:00:00.000Z","phone":"555-0100"}}'

curl -sS -D - -o - -X POST "$BASE/tv/checkin?token=$EAGLEWOOD_TOKEN" \
  -H "content-type: application/json" \
  --data '{"type":"reservation","event":"reservation.cancelled","document":{"_id":"5e7a6c0b0f2c9c0017b0b0b0"}}'
```

A successful check-in returns `{"ok":true}`. The flat example's guest request then returns:

```json
{"firstName":"Ada","lastName":"van Hopper","checkout":"2026-11-02"}
```

The native example stores check-in `2026-06-30` and checkout `2026-07-04` (both midnight-UTC timestamps, previous evening in Los Angeles). `reservation.cancelled` deletes that `_id` only. An apostrophe is escaped, so `O'Brien` is returned as `O&#39;Brien`. The wrong-token curl returns 401. After checkout, `guest.json` returns `{}`. Do not commit a URL that contains `token` or the guest path key. The worker does not log that URL. A platform access log still might.

Use the `*.workers.dev` host from `wrangler deploy` the same way if the zone route is not attached yet.

## Tests

```bash
cd worker
npm install
npm test
```

## Host Tools

### Query strings

**Unverified** for both webhook kinds. Neither doc says a webhook URL may include a query string, or that Host Tools strips one.

- API registration: [`POST /api/setWebhook`](https://docs.hosttools.com/reference/post_api-setwebhook) takes `url` as a string. The only example is `https://example.com/webhook/user_id`, a path with no query string.
- Message rules: [How do I use Webhooks on Host Tools?](https://help.hosttools.com/en/articles/6236532-how-do-i-use-webhooks-on-host-tools) says to enter the recipient URL and that Host Tools POSTs to it. It does not mention query strings or custom headers.

This worker accepts `?token=` anyway. If Host Tools drops the query, that call returns 401. The header `X-Eaglewood-Token` still works when the sender can set it. Custom headers on message-rule webhooks are also unverified.

### Native reservation events

[Webhook Reservation](https://docs.hosttools.com/reference/post_webhooks-reservation) allows exactly three `event` values:

- `reservation.created` — new reservation, inquiry, or booking request
- `reservation.changed` — any other change, including new dates or guest count
- `reservation.cancelled` — status became cancelled, including a reservation first seen already cancelled

There is no `reservation.checkout` event. A cancel is not folded into `reservation.changed`. The [changelog](https://docs.hosttools.com/reference/changelog) describes the same three values.

`document._id` is the reservation id. `document.startDate` and `document.endDate` are UTC timestamps (example `2022-05-20T00:00:00.000Z`). `document.firstName` and `document.lastName` are the guest name. Both dates are converted to the America/Los_Angeles calendar date. Midnight UTC is not kept as that UTC day.

What this worker does with that payload on `POST /tv/checkin`:

- `reservation.created` and `reservation.changed` upsert `document._id`.
- `reservation.cancelled` deletes that id only.
- Any other `event` is 400 and does not delete stays.

There is no native checkout event. `GET` returns `{}` when no stay covers today. Each key's TTL runs out at 06:00 Los Angeles the morning after `checkout`, and the cron `15 8 * * *` deletes stays whose checkout date is already past.

`POST /api/setWebhook` is not the setup to use. That route is unauthorized for this account. Message-rule webhooks are the path that works. The [help article](https://help.hosttools.com/en/articles/6236532-how-do-i-use-webhooks-on-host-tools) says these POST reservation data to the recipient URL. It does not document the body format or content-type. This worker therefore accepts the native `{document:{...}}` object, a flat reservation (`firstName` / `lastName` / `startDate` / `endDate` / `_id`, or `guest.firstName`), form fields, and `first=` / `last=` / `checkout=` lines.

`{{Check-Out Date}}` renders as `Tue, March 11th` in [Host Tools Tags Explained](https://help.hosttools.com/en/articles/10536075-host-tools-tags-explained). That string is accepted. The year is the next occurrence of that month and day on or after today in Los Angeles.

### Settings to use

Create two message rules. Where: Messaging, Add Message Rule, Send To `webhook` ([help article](https://help.hosttools.com/en/articles/6236532-how-do-i-use-webhooks-on-host-tools)). Method: `POST`. The article does not name the Event dropdown labels. Pick the entry that fires on the check-in day, and a second entry that fires when the guest checks out.

Check-in-day rule:

- URL: `https://sunrivertownhome.com/tv/checkin?token=<EAGLEWOOD_TOKEN>`
- Message body:

```
first={{Guest First Name}}
last={{Guest Last Name}}
checkout={{Check-Out Date}}
```

Checkout rule:

- URL: `https://sunrivertownhome.com/tv/checkout?token=<EAGLEWOOD_TOKEN>`
- The same message body.

`{{Guest First Name}}` and `{{Check-Out Date}}` are from [Host Tools Tags Explained](https://help.hosttools.com/en/articles/10536075-host-tools-tags-explained). `{{Guest Last Name}}` is named on [Update Reservation](https://docs.hosttools.com/reference/post_api-setreservation-reservationid). No reservation-id tag is documented there, so this template stores a manual stay and the checkout rule clears by the checkout date. If Host Tools also posts a reservation object with `_id`, that id is used instead.

After the first real POST, `GET /tv/<GUEST_PATH_KEY>/diag.json` shows the content-type and top-level key names only. Use that to see which undocumented shape arrived.

`X-HostTools-Signature` is Host Tools' own signing header. This worker does not use it. Auth is `EAGLEWOOD_TOKEN` only.
