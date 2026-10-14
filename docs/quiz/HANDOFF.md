# Handoff: Global-ready quiz for badideainteractive.com

Status: **built and in the repo**, gate off, three URLs still to supply.

> **This file is publicly readable.** `docs/` is served by GitHub Pages —
> `https://badideainteractive.com/docs/site-architecture.md` returns the file
> today. Once committed, this page is live at
> `https://badideainteractive.com/docs/quiz/HANDOFF.md`. Keep anything you
> would not publish out of `docs/`, or add a `.nojekyll` + `_config.yml`
> `exclude` (or move the folder) if you want it private.

## What was built

| Path | Role |
|---|---|
| `global-ready.html` | The page, at `/global-ready`. Full nav and footer, lifted verbatim from `lab.html`. |
| `assets/quiz/quiz-config.json` | Runtime config: clusters, scoring, bands, flags, URLs. |
| `assets/js/quiz/scoring.js` | Pure scoring, banding, cluster status, booking URL. No DOM. |
| `assets/js/quiz/view.js` | All DOM reads/writes. Only toggles `hidden` and `data-i18n-vars`. |
| `assets/js/quiz/gate.js` | Gate validation and the webhook POST. |
| `assets/js/quiz/main.js` | Wiring and flow. |
| `assets/js/quiz/scoring.test.mjs` | `node --test assets/js/quiz/scoring.test.mjs` — 13 tests. |
| `scss/layout/_quiz.scss` | Styles, imported from `scss/style.scss`. |
| `assets/i18n/en.json` | 68 `quiz.*` keys plus `consulting.services.loc.selfcheck`. |
| `assets/js/i18n.js` | Gained `data-i18n-vars` (see below). |
| `scripts/i18n-audit.js` | Now also reports `zh-tw.json` parity. |
| `consulting.html` | One link out, in the Localization service block. |

`quiz-content.en.json` in this folder stays the copy source of truth; the keys
in `en.json` are byte-identical to it.

## Decisions taken

1. **Translation: `en.json` only.** The 68 keys are now in the ES, FR **and
   zh-tw** translation queues. `scripts/i18n-audit.js` only checked ES and FR,
   so zh-tw was added to its target list — otherwise "in the queue" would not
   have been true for it. Nothing was written to any target file.
2. **Privacy policy is a separate task.** `gate.privacyUrl` is a TODO
   placeholder. The gate will not link a dead `#`: with a placeholder it logs a
   warning and removes the href entirely.
3. **Booking: the existing Calendly link**, for all three bands, with
   `utm_content` carrying the band id — e.g.
   `…/new-meeting?utm_content=gaps`. Set once in `booking.url`.
4. **Interpolation: declarative `data-i18n-vars`.** No sentence is assembled in
   JS.
5. **One runtime config** at `assets/quiz/quiz-config.json`, trimmed:
   `guideSections` and `questionToPrinciple` dropped.
6. **`contact.form.sending` reused** for the gate's sending state — it is a
   generic "Sending…", already translated in all four locales. No
   `quiz.gate.sending` key was added. The four `quiz.cluster.*.guide` keys were
   not added.
7. **Gate behind a flag, default off.** With `gate.enabled: false` the whole
   breakdown is free and the PDF button stays hidden.

## The language layer, as it actually is

Four locales, not three: `en`, `es`, `fr`, `zh-tw` (`assets/js/i18n.js`).
`docs/CLAUDE.md` still says "Trilingual EN/ES/FR" — stale.

**A key missing from a locale falls back to English.** `resolve()` overlays the
target file on the English base, so an untranslated `quiz.*` key renders its
English value. A Spanish visitor sees a Spanish nav and an English quiz, not
blank space and not a raw key. Two things follow:

- Nothing breaks by shipping before translation. It just reads as English.
- `<html lang>` is still set to the target locale, so English fallback text is
  announced as Spanish by a screen reader. Pre-existing, site-wide, not
  introduced here — worth a separate fix.

### `data-i18n-vars`

```html
<p data-i18n="quiz.progress" data-i18n-vars="current:1,total:12"></p>
```

Same comma/colon style as `data-i18n-attr`. Works on `data-i18n`,
`data-i18n-html` and `data-i18n-attr`. `window.refreshI18n(el)` re-renders a
subtree in the active language after the vars change.

- A value with no `{` and an element with no `data-i18n-vars` are both returned
  untouched, so every pre-existing binding is unaffected. Verified: the old and
  new `i18n.js` were run against all 409 bindings on all 12 pages in all four
  locales and produced identical output.
- An unfilled placeholder stays visible as `{count}` rather than blanking, so a
  mistake shows up instead of producing a sentence with a hole in it.
- Values may contain colons; only the first colon in a pair separates name from
  value.

## Flow

Intro (stage toggle) → 12 statements, one per screen, Back allowed → result
(total + band title + message) → **gate, only when enabled** → breakdown
(per-cluster score and status, weak lines, not-sure line, band CTA, PDF when
gated, retake).

Every screen and every string variant is pre-rendered in the HTML behind a
literal `data-i18n` key and shown or hidden by `view.js`. Nothing constructs a
key or a sentence at runtime, which is what keeps `scripts/i18n-audit.js` and
i18n-ally able to see all 68 keys statically. The audit reports zero quiz keys
as unused.

Switching language mid-quiz works: the vars live on the elements, so a full
re-render keeps the current statement and the numbers.

## Scoring

Yes = 1, No and Not sure = 0, `notSureCount` tracked separately. Bands 0-4
retrofit, 5-8 gaps, 9-12 ready. Clusters plan (q1-q3), build (q4-q6), content
(q7-q9), pipeline (q10-q12); 0-1 weak, 2 partial, 3 solid, weak line on weak
only. All of it from `quiz-config.json` — changing a threshold is a config edit.

## Still missing — three URLs and a PDF

All three are `TODO_` placeholders in `assets/quiz/quiz-config.json`, and
`gate.js` treats any value starting `TODO_` as unset.

- **`gate.webhookUrl`** — the n8n endpoint. Payload fields are in
  `webhookPayload.fields` and `gate.js` builds the body from that list, so the
  contract lives in the config. The workflow should store the lead, send the
  results email with the PDF, and respect the optional newsletter consent. Do
  not send the address anywhere else. With the placeholder in place `submit()`
  rejects rather than resolving, so the page can never show a success state for
  a lead that was not stored.
- **`gate.privacyUrl`** — needs a site-wide privacy policy, which does not
  exist. `app-privacy-policy.html` is the Mandarin Daily *app* policy and is
  not a valid target.
- **`gate.pdfUrl`** and the PDF itself, per language.
- **ES, FR and zh-tw translations** of the 68 keys. English is the reference.
  Run `node scripts/i18n-audit.js` for the queue.

### Turning the gate on

1. Supply all three URLs above.
2. Set `gate.enabled: true`.
3. Re-run the tests. The gate path is covered: validation, the POST body, the
   failure state, and the TODO guard.

`utm_content` is the only UTM parameter set. If Calendly or GA attribution
needs `utm_source` / `utm_medium`, add them to `booking.url`.

## Where it lives, and why not under /lab

`/global-ready`, its own page, linked from **`/consulting` only** — not the nav,
not the footer. `docs/site-architecture.md` requires that nothing on `/lab`
read as available for hire and that `/lab` ↔ `/consulting` be exactly two
links; an email-gated lead magnet whose every CTA is a booking link belongs on
the selling page's side of that line. `/notes` is a chronological written list
("resist building a magazine").

The nav is duplicated across 8 HTML files, but adding a page needed none of
them — only adding a nav *entry* would. There is no build step and no Jekyll
config to de-duplicate it with, so it was left alone; fixing it is its own
task.

## Verification run

- `node scripts/i18n-audit.js` — 0 keys missing from `en.json`, 0 quiz keys
  unused, 69 queued for each of es/fr/zh-tw.
- `node --test assets/js/quiz/scoring.test.mjs` — 13 pass.
- `npx sass scss/style.scss assets/css/style.css` — recompiled; the diff is
  additive only.
- End-to-end in jsdom against the real page and modules: 124 checks across 13
  scenarios (both gate states, all three bands, singular/plural/zero not-sure,
  validation, webhook payload, retake, Spanish fallback, mid-quiz language
  switch). jsdom was installed outside the repo; no dependency was added.
