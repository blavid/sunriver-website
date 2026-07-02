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

## Customization

- **Content** — Edit `src/lib/content.ts` for property details, restaurants, hikes, troubleshooting
- **Photos** — Photo URLs are in `src/lib/content.ts`; replace with locally hosted images in `public/` for production
- **Contact email** — Update `siteConfig.host.email` in `src/lib/content.ts`
- **VRBO link** — Add your VRBO listing URL to `siteConfig` when ready

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Tailwind CSS 4](https://tailwindcss.com/)
- TypeScript
