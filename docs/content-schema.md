# Guest content JSON

These files are the copy for the Sunriver Townhome website and for the Eaglewood Roku guest guide. Edit the JSON. The TypeScript modules under `src/lib/` only import it and reshape a few fields for the existing React components.

The Book page's marketing sentences are not in these files. They still live in `src/app/book/page.tsx`.

Guest capacity stays **9** (`siteConfig.stats.guests`).

## URLs

Production (Cloudflare Pages, files from `public/data/`):

| File | URL |
|---|---|
| Guide | `https://sunrivertownhome.com/data/guide.json` |
| Activities | `https://sunrivertownhome.com/data/activities.json` |
| Checkout | `https://sunrivertownhome.com/data/checkout.json` |
| Property catalog | `https://sunrivertownhome.com/data/site.json` |
| Website chrome | `https://sunrivertownhome.com/data/pages.json` |

The Roku app should fetch **guide**, **activities**, and **checkout**. `site.json` is photos, rooms, highlights, and nav. `pages.json` is website headlines. Both are valid to ignore on the TV. `ParseJSON` memory is the reason to skip them.

`guest.json` (per-stay name and checkout date) is still the Worker route `/tv/<key>/guest.json`. It is not one of these files. Keep treating it as `cache-control: no-store`.

## Versioning

Each file has its own integer `version`, starting at `1`.

- Bump that file's `version` when a field is added, removed, renamed, or starts meaning something else.
- A sentence change that keeps the same fields can stay on the same version. The ETag still changes, so a re-fetch sees the new body.
- Files are versioned independently. A bump of `activities.json` does not require a bump of `guide.json`.

Store `{ etag, version, fetchedAt }` in the Roku registry next to the `cachefs:` body. The registry entry is a few dozen bytes.

## Caching and ETag

These are static assets. This repo does not add a `public/_headers` file and does not set `Cache-Control: max-age=300`.

On Cloudflare Pages, a cacheable static asset (no `Authorization` or `Range` on the request) is served with:

- `ETag` on every `200`
- `Cache-Control: public, max-age=0, must-revalidate`

`max-age=0` means "revalidate before reuse," not "do not cache." Send the stored ETag back as `If-None-Match`, including a `W/` weak-validator prefix if that is how it was sent. A `304` means the `cachefs:` body is still current. A `200` means replace the body and store the new ETag. `next start` sends a weak ETag (`W/"..."`) with `Cache-Control: public, max-age=0` and returns 304 on a match. Pages documents the production headers in [Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

`next start` (Node, not the production host) serves `public/` with `Cache-Control: public, max-age=0` as well. See the Next.js [public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder) note. Production is the Pages behavior above.

Suggested TV schedule, same as the guest-guide brief:

- On launch, and again every 6 hours while the app is running: revalidate `guide.json`, `activities.json`, and `checkout.json`.
- Revalidate `guest.json` about every 15 minutes. That route stays `no-store`; do not apply this ETag plan to it.
- Do not wait for `max-age`. The TV's own timer is the refresh policy.

Images use the absolute `url` / `imageUrl` fields. This change does not generate resized TV variants. Card art should still be downscaled before it is held on the device (about 640×360). One full-screen background is enough.

## Offline

Order when the network fails:

1. Fresh response (`200` or `304`).
2. `cachefs:` copy from the last good fetch.
3. Snapshot bundled in the Roku package (`pkg:/data/guide.json`, `activities.json`, `checkout.json`), taken from these public URLs at package time.
4. Short built-in fallback text. Greeting falls back to "Welcome to Eaglewood".

The Wi-Fi network name and password, and the bike-lock combination, are ordinary sentences in `guide.json` (see Troubleshooting). They are not Worker secrets. A bundled snapshot of `guide.json` includes them, same as the public site.

## What the website renders

The site imports these files and shows the same strings as before.

| JSON | What the site shows |
|---|---|
| `guide.json` `siteConfig`, house rules, troubleshooting, guest-guide sections, quick reference | Header, footer, guest guide, home stats, book-page links and times |
| `site.json` paths (`src`, and `image` on activities) | `<img>` / `next/image` sources |
| `activities.json` `seasonLabel` | The season badge on each card |
| `pages.json` | Headlines and section chrome, except the Book page |
| `checkout.json` | Nothing new. The guest guide still shows `summary` because that sentence is also a "During Your Stay" item |

Ignored by the website, present for the TV: `season`, `seasonSpecified`, `seasonPriority`, `imageUrl`, `url` on images, `host.phone`, and `checkout.steps` as a separate list.

`src/lib/activities.ts` copies `seasonLabel` onto the card's `season` prop so the existing component does not change. Section order in the JSON is the website order. The site does not sort by `seasonPriority`.

## guide.json

```ts
{
  version: number
  siteConfig: {
    name: string
    tagline: string
    domain: string
    bookUrl: string
    airbnbUrl: string
    vrboUrl: string
    host: { name: string, email: string, phone: string | null }
    stats: { guests: number, bedrooms: number, bathrooms: number }
    checkIn: string   // "4:00 PM"
    checkOut: string  // "11:00 AM"
  }
  houseRules: string[]
  troubleshooting: { issue: string, steps: string[] }[]
  guestGuideSections: { title: string, items: string[] }[]
  quickReference: { label: string, value: string }[]
  hikes: {
    name: string
    difficulty: string
    distance: string
    description: string
    gettingThere: string
    tip: string
  }[]
}
```

`host.phone` is `null`. The repo has a name and an email only. The TV should not invent a number. The website contact buttons use `host.email` and `host.name`.

`quickReference` is the eight cards on the guest-guide page. Check-in and check-out values match `siteConfig.checkIn` and `siteConfig.checkOut`. The Wi-Fi card says "See note on wall in kitchen". It does not repeat the password. The password is in troubleshooting.

### House rules

Six strings. The quiet-hours line is "Quiet hours after 10:00 PM". Check-in and check-out lines repeat `siteConfig` in sentence form ("Check-in after 4:00 PM", "Check-out before 11:00 AM").

### Troubleshooting

Thirteen `{ issue, steps }` entries. `steps` are numbered on the website in array order.

The Wi-Fi entry's `issue` is `"WiFi not connecting"`. Step 1 is the network name. Step 2 is the password line. Later steps are the router reset.

The lock entry's `issue` is `"How do I lock the bikes?"`. The combination is in the second step, in the same sentence the website shows.

Example (thermostat, no special fields):

```json
{
  "issue": "How do I change the thermostat temperature?",
  "steps": [
    "Our home is equipped with a furnace for heating and an air conditioner for cooling.",
    "The thermostat is located in the hallway near the kitchen.",
    "Rotate the dial to adjust the temperature.",
    "You can change the mode from heating to cooling by pressing down on the dial and rotating to the desired mode."
  ]
}
```

On the TV, the Wi-Fi troubleshooting row should jump to the Wi-Fi screen instead of repeating the password in Quick Fixes. The strings are still in this file so that screen can read them.

### Guest guide sections

Three sections: "Before You Arrive", "During Your Stay", "Getting Around". Each `items` array is the bullet list.

One "During Your Stay" item is the checkout sentence. That exact string is also `checkout.json`'s `summary`.

### Hikes

Six write-ups (Benham Falls, Lava Butte, Deschutes River Trail, Todd Lake Loop, Green Lakes Trail, Lava Lands Trail). They have difficulty, distance, how to get there, and a tip. They do not have photos.

The activities file has a separate `hiking` section with photos and a different list (Smith Rock, Tam McArthur Rim, Tumalo Falls, and a combined "Lava Butte & Lava Lands"). Names do not all match. The TV can merge on exact `name` where it matches (Benham Falls, Green Lakes Trail) and should not assume the two lists are the same trail.

## activities.json

```ts
{
  version: number
  activitySections: {
    id: string
    title: string
    subtitle?: string
    seasonPriority?: { winter?: number, spring?: number, summer?: number, fall?: number }
    activities: Activity[]
  }[]
}

Activity = {
  id: string
  name: string
  description: string
  image: string          // site path, "/images/..."
  imageUrl: string       // https://sunrivertownhome.com/images/...
  imageAlt: string
  distance?: string      // may be "" 
  season: Season[]       // structured, for the TV
  seasonLabel: string    // exact badge text the website shows
  seasonSpecified?: false
  tip?: string
  url?: string
  affiliateUrl?: string  // reserved; none are set today
}

Season = "winter" | "spring" | "summer" | "fall" | "year-round"
```

Nine sections, in website order: Guided tours and activities, Dining, Hiking, Swimming, River Floats & Rafting, Skiing & Snowboarding, Mountain Biking, Scenic & Day Trips, Golf & Family Fun. 64 activities. The website must keep this order.

`image` is what the website passes to `next/image`. `imageUrl` is the absolute URL for the TV. Path segments are percent-encoded (`&` in `VillageBar&Grill.avif` is `%26`).

`url` is copied exactly. `chocolate-tour` has a trailing space in its URL today; it was left in place so the site link does not change.

`affiliateUrl`, when it is added later, wins over `url` (`getActivityLink` already does that). QR codes on the TV should use `affiliateUrl ?? url`, and omit the QR when both are missing.

### Season

Every activity has `season` (one or more tokens) and `seasonLabel` (the original badge string).

`year-round` is never mixed with other tokens. If the label contains "year-round", `season` is `["year-round"]` even when the label also mentions a season as a caveat. Example: "Year-round — check road access in winter" stays `["year-round"]`. The caveat remains in `seasonLabel`.

Otherwise the label is read as follows:

- A month range uses meteorological seasons: December–February winter, March–May spring, June–August summer, September–November fall. "November through May" is `["fall", "winter", "spring"]`. "December through March" is `["winter", "spring"]` because March is spring. "June through September" is `["summer", "fall"]`.
- "spring through fall" (including "late spring" / "early fall") is the inclusive range `["spring", "summer", "fall"]`.
- Other labels contribute only the season words they name. "Spring and fall are ideal" is `["spring", "fall"]`. "Best in spring for peak flow" is `["spring"]`. "Summer only" is `["summer"]`.
- A label that starts with "Seasonal" and names no season (`"Seasonal — check hours"`, `"Seasonal — check schedule"`) has `seasonSpecified: false` and `season` set to all four calendar seasons. That means the copy did not say which seasons. Show `seasonLabel` and do not filter the card out. Today that is Rio Sol and Century Common Taps & Trucks only. When `seasonSpecified` is omitted, the array came from the label.

Benham Falls' activity label is "Best in spring for peak flow", so its structured season is `["spring"]`. The description also says the falls are beautiful year-round. The hike tip says the same. The structured field follows the badge, not the description.

### seasonPriority

Optional hint so the TV can feature skiing in winter and river floats in summer without changing the website.

```json
{ "id": "skiing-snowboarding", "seasonPriority": { "winter": 1 } }
{ "id": "river-floats", "seasonPriority": { "summer": 1 } }
```

Lower rank sorts earlier. A missing season key means "no hint." Sort hint first, then original index:

```
function sortSections(sections, season) {
  return sections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => {
      const rankA = a.section.seasonPriority?.[season] ?? 100
      const rankB = b.section.seasonPriority?.[season] ?? 100
      return rankA - rankB || a.index - b.index
    })
    .map((entry) => entry.section)
}
```

In winter, skiing is first and every other section stays in source order. In summer, river floats are first and the rest stay in source order. Spring and fall have no hints, so the source order is unchanged. No other section has `seasonPriority`.

### Example

```json
{
  "id": "hot-lava-bakery",
  "name": "Hot Lava Bakery",
  "description": "Fresh pastries, croissants, and coffee in Sunriver Village — a local favorite for breakfast and take-away treats.",
  "image": "/images/photos/activities/Dining/HotLavaBakery.jpeg",
  "imageUrl": "https://sunrivertownhome.com/images/photos/activities/Dining/HotLavaBakery.jpeg",
  "imageAlt": "Fresh pastries and croissants in a bakery display",
  "distance": "5 min by bike to the Village",
  "season": ["year-round"],
  "seasonLabel": "Year-round",
  "tip": "Arrive before 9:30 AM in peak season.",
  "url": "https://www.hotlavabakery.com/"
}
```

## checkout.json

Derived from the current guest-guide sentence. No steps were added.

```json
{
  "version": 1,
  "checkIn": "4:00 PM",
  "checkOut": "11:00 AM",
  "summary": "Checkout is 11:00 AM — please start the dishwasher and leave used towels in the laundry room.",
  "steps": [
    "Start the dishwasher",
    "Leave used towels in the laundry room"
  ]
}
```

`checkIn` and `checkOut` match `guide.json` `siteConfig`. `summary` is the "During Your Stay" item that starts with "Checkout is". Each step is a clause of that sentence, with "please" removed and the first letter capitalized.

`steps` is the whole list the website states. It does not include trash, thermostat, hot-tub cover, or lock-up. Those are not in the current copy. The TV checklist should render `steps` plus the guest's checkout time from `guest.json`, and should not append tasks that are not in this file.

## site.json

Property catalog for the website. Safe for the TV to skip.

```ts
{
  version: number
  heroImage: ImageRef
  pageBackgrounds: {
    home: ImageRef
    theHome: ImageRef
    guestGuide: ImageRef
    book: ImageRef
    activities: ImageRef
  }
  photos: ImageRef[]
  highlights: { title: string, description: string, icon: string }[]
  guestReviews: string[]
  rooms: { name: string, features: string[] }[]
  amenities: string[]
  navLinks: { href: string, label: string }[]
}

ImageRef = { src: string, url: string }
```

`src` is the site path (`/images/photos/house/pool.jpg`). `url` is `https://sunrivertownhome.com` plus that path, with each segment encoded. `pageBackgrounds.home` is the same image as `heroImage`.

`highlights[].icon` is one of `bed`, `spa`, `pool`, `bike`, `home`, `wifi`. Those keys select SVG icons in the website. They are not image files.

The home page says "47 photos" in `pages.json`. The `photos` array is the gallery the site actually renders (21 files). That subtitle was already on the site and was not changed.

## pages.json

Website headlines, button labels, and section titles for Home, The Home, Guest Guide, and Activities, plus layout `<title>` / Open Graph, header, and footer. The Book page is absent on purpose.

`metadata.title.template` is `"%s | Sunriver Townhome"`. Next.js applies it to inner pages. The home page uses `metadata.title.default`.

`photoGallery.altPrefix` is `"Sunriver townhome photo"` and `moreLabel` is `"more"` (`+12 more` on the home preview).

## Screen mapping for the TV

| Screen | Read |
|---|---|
| Home | `guest.json` name and checkout date, `siteConfig.checkOut`, the quiet-hours house rule |
| House rules | `houseRules`, with `siteConfig.checkIn` / `checkOut` if a screen needs the times alone |
| Quick Fixes | `troubleshooting`. Hide the Wi-Fi row and open the Wi-Fi screen instead |
| Things to do | `activitySections` except `dining` and `hiking`. Optional reorder with `seasonPriority` |
| Dining | section `id` `dining` |
| Hiking | `hikes` for difficulty and `gettingThere`, plus the `hiking` section for photos. Do not assume the lists match |
| Checkout | `checkout.json` `steps` and `checkOut`, plus the guest's date from `guest.json` |
| Wi-Fi | network name and password from the `"WiFi not connecting"` steps |
| Promo | `siteConfig.domain` and `siteConfig.bookUrl` |

Phone-sized actions (booking, tour pages, maps) stay QR codes of `affiliateUrl ?? url` or `bookUrl`. The TV does not open a browser.
