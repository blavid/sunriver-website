# Sunriver Townhome Website

A modern, responsive website for [sunrivertownhome.com](https://sunrivertownhome.com) — a luxury vacation rental in Eaglewood, Sunriver, Oregon.

## Features

- **Home** — Hero, property highlights, guest reviews, photo gallery
- **The Home** — Full property details, rooms, amenities, house rules
- **Guest Guide** — Check-in info, quick reference, troubleshooting
- **Activities** — Dining, hiking, swimming, river floats, skiing, mountain biking, and more
- **Book** — Links to direct booking (Hosttools), Airbnb, and VRBO

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build & Deploy

```bash
npm run build
npm start
```

Deploy to Vercel, Netlify, or any Node.js host. Point `sunrivertownhome.com` DNS to your deployment.

## Deploying the TV Worker

```bash
git checkout main && git pull
npm run deploy:worker
```

Run those from the repo root. The script changes into `worker/`, installs packages with `npm ci` (including `uqr`), then runs `npx wrangler deploy`. Wrangler has to start in `worker/` so it reads `worker/wrangler.toml` (`eaglewood-tv`). Started from the repo root, it detects the Next.js app and fails with “Unable to detect the version of next”.

The same commands by hand:

```bash
cd worker && npm ci && npx wrangler deploy
```

`npm install` is required for the `uqr` dependency. `npm run deploy:worker:dry` is the same path with `--dry-run` and does not publish. Extra flags after `npm run deploy:worker --` do not reach Wrangler, because the script is a `cd` chain.

Set secrets from `worker/` with `npx wrangler secret put <NAME>`.

Pages static files can stay edge-cached for up to 4 hours. After a change under `/data/qr/` or `/images/tv/`, purge those paths in Cloudflare.

## Content

Guest copy, activities, and page text live in `public/data/*.json`. The website and the Roku guest guide both read those files. Field reference: `docs/content-schema.md`.

`src/lib/content.ts` and `src/lib/activities.ts` are typed wrappers. They do not hold their own copy. The Book page's marketing sentences stay in `src/app/book/page.tsx`.

### Adding an activity

Add one object to a section's `activities` array in `public/data/activities.json`. That position is the order on the website. Set `season`, `seasonLabel`, and a photo (`image`, `imageUrl`, `imageAlt`). A photo that was not already on the site also needs `imageCredit` (author, license, license URL, and Commons source). Then set `seasonRank` if the TV should feature it in a season. Run `node scripts/render-tv-images.mjs` and `node scripts/render-qr.mjs` so `imageTvUrl` and, when `url` is set, `qrUrl` stay in sync. The website does not show those two fields.

Ranks are positive integers, one per season (`winter`, `spring`, `summer`, `fall`), spaced by 10. Lower sorts earlier. Omit a season to sort after every ranked activity in that season. To insert between two activities, use a number between their ranks (`15` sits between `10` and `20`). No other activity needs to change. The website does not read `seasonRank`.

`src/lib/season-order.ts` (`compareSeasonRank`) is the TV sort. Details and a copy-paste example are in `docs/content-schema.md`.

```bash
npm test
```

`npm test` checks the JSON shape and compares prerendered HTML to `tests/fixtures`. Run `npm run build` first.

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
 
