# Visual & Media Spec

Dimensions derived from the live layout: ~1140px container, 16px gutters, 2× for retina.

---

## Card images — `.entry-card`

**One spec covers every card on the site.** The homepage Featured cards (col-md-6, ~562px) and `/lab` wide cards (40% of container, ~456px) are both narrower than 600px, so a single asset serves both.

| | |
|---|---|
| **Export** | 1200 × 675 px |
| **Ratio** | 16:9 — non-negotiable, the component crops to it |
| **Format** | JPEG, quality 80 |
| **Weight** | Under 200 KB |
| **Naming** | `assets/img/lab/<project-slug>.jpg` |

**Content rules**
- In-game capture only. No editor chrome, no debug overlays, no FPS counters.
- One composed key image per project, not a raw screenshot.
- Portrait apps (Mandarin Daily, Coil): compose the phone frame into a 16:9 canvas on a flat brand-appropriate background. Do not stretch or letterbox with black bars.
- Landscape games (Mayor, Escape From Hell, the bullet-hell): capture natively at 16:9.
- Keep the centre clear — the status pill sits top-right and will overlap busy artwork.
- Consistent treatment across all cards: same overlay, same crop logic, same colour weight. Unevenness is what makes a grid read as a folder.

**Current gaps**
- Coil — no image at all, using `work-in-progress.jpg`
- Mayor Saves Christmas — currently illustrated key art, not in-game capture. Different signal from what this spec asks for. Decide whether to shoot in-game from the 2026 update or make illustration the deliberate house style for shipped titles.
- Bullet-hell prototype — none yet

---

## Portraits

| | |
|---|---|
| **Export** | 500 × 500 px, square |
| **Format** | JPEG, quality 80 |
| **Weight** | Under 120 KB |
| **Crop** | Face centred with margin — the component masks to a circle |

Applies to David and Pepper on `/`.

**Consulting page photo** (`consulting-photo`, col-lg-4): 800 px wide, natural ratio, under 200 KB.

---

## Social share image

Currently missing, and `/lab` is the page most likely to be shared.

| | |
|---|---|
| **Export** | 1200 × 630 px |
| **Format** | JPEG or PNG |
| **Weight** | Under 300 KB |

One per key page (`/`, `/consulting`, `/lab`) or one site-wide fallback. Needs `og:image` and `twitter:image` tags — no page currently has either.

---

## Tech icons

- SVG preferred, monochrome, single colour applied via CSS
- If raster: 64 × 64 px PNG with transparency
- One visual weight across the whole set — do not mix filled and outlined
- Grouped by service on `/consulting`, per-card metadata on `/lab`
- Cap 5–6 per group. No ambient tooling (Slack, Excel, Google Docs)

---

## Motion

**Do not use GIF.** A 10-second screen capture is roughly 5–10 MB as a GIF and under 500 KB as MP4, with better colour and no dithering.

**Format:** MP4 (H.264) primary, WebM as an optional second source. Muted, looping, no audio track.

| | |
|---|---|
| **Export** | 1200 × 675 px (matches card ratio) |
| **Length** | 6–12 seconds, seamless loop |
| **Weight** | Target under 1 MB, hard cap 2 MB |
| **Frame rate** | 30 fps |

**Markup requirements**
- `autoplay muted loop playsinline` — `playsinline` is required or iOS opens fullscreen
- `poster` attribute pointing at a static frame, so something renders before load and if playback fails
- `preload="none"` or `metadata` — never `auto`
- Wrap in a `prefers-reduced-motion: reduce` query that falls back to the poster image

**Where it belongs:** inline within the LocFlow past-work entry on `/consulting`, showing the tool doing something real. Not as a page background — full-bleed video contradicts a flat, restrained design system and buries the thing it's meant to demonstrate.

Same treatment would work for a `/lab` entry later, but one per page maximum.

---

## General

- Strip EXIF on export
- No dimensions below the 2× figures above — upscaling is visible on retina and reads cheap
- Prefer JPEG for photographic content, PNG only where transparency is required
- Every image needs meaningful `alt` text, which is a translatable string: use `data-i18n-attr="alt:<key>"`
