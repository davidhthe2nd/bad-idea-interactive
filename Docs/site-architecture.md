# Site Architecture

Reference for structural work on badideainteractive.com. Read before any change that adds, moves, or reframes a page.

Conventions, i18n rules, and brand overrides live in `/CLAUDE.md`. Final copy lives in `/docs/*-copy.md`.

---

## Positioning

Bad Idea Interactive is one practice operating at two scales: a small studio releasing its own games and tools, and a consulting practice for studios that have outgrown their own processes.

Site-wide thesis: **I build things properly, and help studios do it at scale.**

The site is structured as a **split front door**. The homepage does not sell — it routes, giving both audiences equal weight above the fold. Selling happens on `/consulting`; credibility is built on `/lab`.

Voice is first person singular throughout, including studio pages. See `/CLAUDE.md` for brand overrides that supersede the design-system skill.

---

## Pages

### `/` — Home

**Global message:** Bad Idea Interactive builds its own things, and helps other studios build theirs.

**Job:** Route, fast. Roughly one and a half screens. Both CTAs carry equal visual weight — no hierarchy between studio and consulting.

**Sections:** Hero (thesis + two CTAs) → Two halves (studio / consulting cards) → Featured (2 entries, shared card component) → Who's behind it (David, Pepper) → How I work → Notes (latest 3) → Contact strip.

**Copy:** `/docs/home-copy.md`

---

### `/consulting`

**Global message:** Studios don't struggle at making games. They struggle at the infrastructure around them — and that's fixable.

**Job:** Convert. This is the only page on the site that sells.

**Sections:** Hero + what I bring → Services (Localization / Production / AI Automation) → How it works → About → Past work → Booking.

**Changes pending:**
- Testimonials placed **inside their matching service block**, directly under the claim each one proves — not as a standalone section. Three available, mapping one-to-one: AI/data → Automation, LQA/best practices → Localization, PM/collaboration → Production. Each needs name, role, and company, trimmed to 2–3 sentences.
- **LocFlow** expanded into a full past-work entry with screenshots. It's the only showable thing on this page and currently competes as a text card against Blizzard and Equinox.
- **Confidential client tooling work** added as a further past-work entry, anonymized. This is the honest source for this page's tech clusters (React, Python, Jira) — `/lab` is almost entirely Unity and C# and can't supply them.
- Emoji removed from service markers.

**Tech icons:** grouped by service, small clusters under each service block. Cap at 5–6 per cluster. Only tools work would be accepted in. No ambient tooling (Slack, Excel, Google Docs).

---

### `/web`

**Global message:** For studios and small businesses that make good things but can't be found.

Kept as a distinct sub-offer with its own front door. Deliberately not folded into `/consulting` — it targets a different buyer, and folding it in would dilute the games-industry specificity that makes the consulting page sharp. Under review as the practice develops.

---

### `/lab`

**Global message:** Public R&D. Some of this shipped. Some of it died. All of it taught me something.

**Job:** Build credibility for both audiences without selling to either. Replaces the old games and apps sections.

**Grouped by status, not by type:** Shipped → In development → Experiments → Shelved. Type-based grouping recreates the fragmentation this restructure exists to fix; status tells the visitor how to read what they're looking at.

**The Shelved section is load-bearing.** A lab with no dead ends is a portfolio pretending. It is also the most credible thing on the site for a consulting buyer.

**Card schema — six fields, every entry, no exceptions:**
1. Title
2. One-line hook
3. The question being tested
4. Status + period
5. Findings (required, including on shipped entries)
6. Link, or an explicit statement that there isn't one

The rigidity is the point: when every card fills the same slots, an unfinished prototype sits next to a shipped game without looking embarrassed.

**Tech metadata:** per-card, engine/language/platform only. No IDEs, art tools, or LLM names.

**One outbound line** at the foot of the page to `/consulting`. Nothing else on this page reads as available for hire.

**Copy:** `/docs/lab-copy.md`

---

### `/notes`

**Global message:** What I've learned about shipping things, written down.

Covers both halves of the practice — studio and consulting — deliberately. Mixing them is what makes the site read as one person rather than two departments.

**Sections:** intro line → chronological list → optional tag filter (localization / production / automation / studio). Each post ends with a soft link to `/consulting`. Resist building a magazine.

---

### `/contact`

**Global message:** Different reasons to get in touch, different doors.

Thin page, three routes: consulting enquiry → booking, general/press/collaboration → email, social links.

Replaces the current nav Contact link, which points at `/consulting#book` and sends anyone with a non-sales message into a booking funnel.

---

## The `/lab` ÷ `/consulting` distinction

The single most important editorial rule on the site.

| | `/lab` | `/consulting` |
|---|---|---|
| Framing | Question-led | Problem-led |
| Opens with | What I didn't know | What the client needed fixed |
| Reports | Findings | Outcomes |
| Stance | Admits uncertainty | Asserts capability |

The lab can afford to be honest because nothing on it is for sale. That honesty is what makes the consulting page's confidence believable. Nothing on `/lab` should read as available for hire; nothing on `/consulting` should read as speculative.

Connection between them is exactly two links: the closing line on `/lab` → `/consulting`, and the LocFlow entry on `/consulting` → `/lab`.

---

## Shared components

`/lab` entries and the homepage featured strip use **one card component**. Build it once, with the six-field schema and status badge. This is what makes the two pages visually agree.

---

## Visual spec

- One fixed aspect ratio across every card. Uneven crops are what make a grid feel like a folder.
- In-game capture only — no editor chrome, no debug overlays.
- One composed key image per project, not a raw screenshot.
- Consistent treatment: same overlay, same status-badge position, same type.
- Mayor Saves Christmas gets fresh capture from the 2026 update.
- Tech icons uniform monochrome, one size.

---

## Legacy

`#games` and `#apps` are live anchors on the current homepage and may be shared externally. Both redirect to `/lab`.

Homepage meta title currently reads "Indie Games Studio & Consulting" — replaced per `/docs/home-copy.md`.
