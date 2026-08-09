# Bad Idea Interactive — Project Conventions

Static site. Plain HTML + Bootstrap 5.3 + SCSS (`scss/base`, `scss/components`, `scss/layout`) compiled to `assets/css/style.css`. Trilingual EN/ES/FR.

Reference docs live in `/docs`. Read `site-architecture.md` before any structural change.

---

## Ground rules

- **Work only within the scope of the current task.** Do not refactor, restyle, or rewrite copy on pages the task did not name.
- **Ask before introducing a dependency, build step, or framework.** This site is intentionally plain.
- Edit SCSS sources, never the compiled `assets/css/style.css`.

---

## i18n — the rule that matters most

- **No user-facing string is ever hardcoded in HTML.** Every visible string uses a `data-i18n` attribute and a key in the translation files.
- Translation files: `assets/i18n/en.json`, `es.json`, `fr.json`. Driven by `setLanguage()` in `assets/js/i18n.js`.
- **Write English strings to `en.json` only.** Do not add, stub, or edit keys in `es.json` or `fr.json`. Do not translate.
- Translation is handled separately through a localization pipeline that reads the gap between `en.json` and the target files. Keys missing from ES/FR are expected and are the input to that process — leaving them absent is correct, not an oversight.
- `setLanguage()` must fall back to the English value when a key is missing from the active language file, so pages stay readable while translation is pending. Verify this before adding keys; if no fallback exists, add one first.
- Key naming: `page.section.field` (e.g. `home.hero.headline`, `lab.mayor.findings`).
- A key-parity script that **reports** (never fails) the diff between `en.json` and each target file is useful — it doubles as the queue of strings awaiting translation.

---

## Copy

- All final strings live in `/docs/*-copy.md`. That is the source of truth — do not invent, paraphrase, or "improve" copy.
- If a string is needed that isn't in the docs, stop and ask rather than writing one.

---

## Brand — overrides

A design-system skill exists for this brand. **The following supersede it**, because they reflect decisions made after it was generated:

- **No emoji anywhere.** The design system documents emoji-as-iconography (🗺️ 📋 ⚙️) as the house convention. That convention is retired. Do not add emoji to sections, service markers, or list items, and remove them where found.
- **Iconography is now real icons**, used contextually only: grouped by service on `/consulting`, as per-card metadata on `/lab`. Uniform monochrome, one size. No standalone tech-logo band on the homepage.
- **Voice is first person singular ("I") across the whole site**, including studio pages. The old studio "we" is retired — it's one person and a dog.
- **The old tagline "Turning bad ideas into joyful experiences" is retired.** Current positioning is in `/docs/site-architecture.md`.

Everything else in the design system still applies.

---

## Visual tokens

Colors — red `#D62828` (CTAs, accents, section rules, hover `#B31F1F`), black `#0B0B0B` (nav, footer, dark sections), white, light grey `#F4F4F4`, navy `#1E3A5F` (secondary, sparing). Flat fills only, no gradients.

Type — Montserrat 700 (headings, line-height 1.15), Inter 400–600 (body). Sentence case; uppercase + wide tracking only for eyebrow labels.

Spacing — 8pt grid (8/16/24/32/48/64). 64px vertical section padding. Sections alternate white → light grey → dark, never the same background twice in a row.

Radii — buttons and cards 6–8px, callouts and photos 12px, pills 999px, portraits circular.

Shadows — resting `0 2px 6px rgba(0,0,0,.09)`, hover `0 4px 12px rgba(0,0,0,.18)`. No inner shadows.

Motion — card lift `translateY(-4px)` + shadow on hover (0.2s), sticky-nav shadow after 10px scroll (0.25s). Nothing else. No entrance animations or parallax.

Layout — ~1140px centered container, 16px gutters. Sticky black nav on main site; sticky white topbar on consulting sub-pages.

---

## Site structure

```
/            home — routes to both halves
/consulting  consulting practice (LocFlow lives here)
/web         web & online presence sub-offer
/lab         public R&D: shipped, in development, experiments, shelved
/notes       written content
/contact     real contact routes — NOT the consulting booking form
```

The `/lab` and homepage featured strip share one card component. Build it once.

Legacy `#games` and `#apps` anchors must redirect to `/lab`.
