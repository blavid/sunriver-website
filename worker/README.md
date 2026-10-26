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
| `POST /tv/checkin` | Header `X-Eaglewood-Token` or `?token=` | Store the current guest, or clear it on `reservation.cancelled` |
| `POST /tv/checkout` | Header `X-Eaglewood-Token` or `?token=` | Delete `current` |
| `GET /tv/<GUEST_PATH_KEY>/guest.json` | Path secret | Current guest, or `{}` |
| Anything else | | `404`, or `405` when the path is known and the method is wrong |

Check-in accepts either `{ "firstName", "lastName", "checkout" }` or a Host Tools reservation webhook `{ "type": "reservation", "event", "document" }`. Flat `checkout` is `YYYY-MM-DD` and must be a real calendar date. On the native payload, `document.endDate` is a UTC timestamp and is stored as the `America/Los_Angeles` calendar date. Midnight UTC is the previous evening in Los Angeles for most of the year, so `2026-07-05T00:00:00.000Z` is checkout `2026-07-04`. A bare `YYYY-MM-DD` `endDate` is kept as that date. Every other field is ignored. `lastName` is optional and is stored as `""` when it is missing.

`reservation.created` and `reservation.changed` replace the stored guest. `reservation.cancelled` deletes it. There is no native checkout event. After a stay, `GET` still returns `{}` once the Los Angeles date is past `checkout`, and the KV key expires at 06:00 that next morning. `POST /tv/checkout` also clears the guest immediately.

`firstName` keeps only the first whitespace-separated token. Both names keep Unicode letters, apostrophes, and hyphens. `lastName` may also keep internal spaces. Digits, email addresses, phone numbers, and PINs are stripped. Caps are 30 characters (`firstName`) and 40 (`lastName`). An empty `firstName` is a 400.

The body limit is 2048 bytes. A larger body is 413. A form body or other non-JSON body is 400.

The header and the `token` query parameter are each compared to `EAGLEWOOD_TOKEN` in constant time. Either match is enough. A missing or wrong token is 401. If `EAGLEWOOD_TOKEN` is unset, POSTs return 500. The worker does not log the request URL or the token. If `GUEST_PATH_KEY` is unset, shorter than 24 characters, or not an exact match, the guest URL is 404.

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

curl -sS -D - -o - -X POST "$BASE/tv/checkin?token=$EAGLEWOOD_TOKEN" \
  -H "content-type: application/json" \
  --data '{"type":"reservation","event":"reservation.created","document":{"firstName":"Ada Lovelace","lastName":"van Hopper","endDate":"2026-07-05T00:00:00.000Z","phone":"555-0100"}}'

curl -sS -D - -o - -X POST "$BASE/tv/checkin?token=$EAGLEWOOD_TOKEN" \
  -H "content-type: application/json" \
  --data '{"type":"reservation","event":"reservation.cancelled","document":{}}'
```

A successful check-in returns `{"ok":true}`. The flat example's guest request then returns:

```json
{"firstName":"Ada","lastName":"van Hopper","checkout":"2026-11-02"}
```

The native `endDate` example is midnight UTC on 5 July 2026, so the stored checkout is `2026-07-04`. `reservation.cancelled` clears the guest. An apostrophe is escaped, so `O'Brien` is returned as `O&#39;Brien`. The wrong-token curl returns 401. After checkout, `guest.json` returns `{}`. Do not commit a URL that contains `token` or the guest path key. The worker does not log that URL. A platform access log still might.

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

`document.endDate` is the check-out date in UTC (example `2022-05-20T00:00:00.000Z`). `document.firstName` and `document.lastName` are the guest name. The worker converts `endDate` to the America/Los_Angeles calendar date. It does not keep the UTC date at midnight.

What this worker does with that payload on `POST /tv/checkin`:

- `reservation.created` and `reservation.changed` replace KV key `current`.
- `reservation.cancelled` deletes `current`.
- Any other `event` is 400 and does not delete the guest.

There is no native checkout event, so the stay also ends on its own: `GET` returns `{}` when the Los Angeles date is after `checkout`, and the KV TTL runs out at 06:00 Los Angeles the next morning. A message-rule checkout webhook can still call `POST /tv/checkout` to clear the guest immediately.

Message-rule checkout is a separate feature. The help article says a webhook can fire when the guest checks out, but it does not list the Event dropdown labels. Those labels are unverified. Do not send the rendered tag `{{Check-Out Date}}` (`Tue, March 11th` in [Host Tools Tags Explained](https://help.hosttools.com/en/articles/10536075-host-tools-tags-explained)). That string is not `YYYY-MM-DD`.

### Settings to use

API reservation webhook. This is the one that sends `{type, event, document}`.

- Where: `POST https://app.hosttools.com/api/setWebhook` ([Set Webhook URL](https://docs.hosttools.com/reference/post_api-setwebhook)). No help-center screen for this URL was found.
- Method Host Tools uses when it calls us: `POST`
- URL: `https://sunrivertownhome.com/tv/checkin?token=<EAGLEWOOD_TOKEN>`
- Events it will deliver: `reservation.created`, `reservation.changed`, `reservation.cancelled`
- Body: the native reservation webhook. No transform step.

Message-rule webhook, only if you also want an explicit checkout clear from the Host Tools UI.

- Where: Messaging, Add Message Rule, Send To `webhook` ([help article](https://help.hosttools.com/en/articles/6236532-how-do-i-use-webhooks-on-host-tools))
- Method: `POST`
- Check-in or new-reservation rule URL: `https://sunrivertownhome.com/tv/checkin?token=<EAGLEWOOD_TOKEN>`
- Checkout rule URL: `https://sunrivertownhome.com/tv/checkout?token=<EAGLEWOOD_TOKEN>`
- Event: pick the dropdown value for a new reservation or a time before check-in, and a second rule for checkout. The exact labels are unverified. The article says those triggers exist.

Template tags, if you are editing a message rather than the webhook body:

- `{{Guest First Name}}` and `{{Check-Out Date}}` from [Host Tools Tags Explained](https://help.hosttools.com/en/articles/10536075-host-tools-tags-explained)
- `{{Guest Last Name}}` from [Update Reservation](https://docs.hosttools.com/reference/post_api-setreservation-reservationid)

`X-HostTools-Signature` is Host Tools' own signing header. This worker does not use it. Auth is `EAGLEWOOD_TOKEN` only.
