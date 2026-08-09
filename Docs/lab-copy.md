# /lab — Copy Draft

> **Status:** Draft v1. Question-led framing — nothing here should read as available for hire. Bridge to /consulting is the single closing line only.
> 

**Open items:** bullet-hell name + findings · more Experiments entries · whether to make the Escape From Hell → There Is No Escape → shelving story explicit

---

## Page intro

Public R&D. Between client projects I build things to answer questions I can't answer by reading about them — how a mechanic feels, whether a pipeline holds, what breaks when real users show up.

Some of it shipped. Some is still moving. Some is here because it didn't work, and that turned out to be the useful part.

---

## Shipped

### Mayor Saves Christmas

An arcade platformer set in Vigo. Trap enemies, chain combos, save the city's Christmas lights.

**The question:** Could a small game be tied to a real-world event — Vigo's lights actually switching on — and would that synchronization earn anything a normal release wouldn't?

**Findings:** The real lesson was structural. I built and tested one solid gameplay loop first, then added worlds one at a time, each layered on without breaking what came before. Because the scope stayed small and every layer was additive, the game was releasable at any point — so the fixed real-world deadline stopped being a risk. Tying the launch to the actual event gave it a window and a reason for local players to care, but that only worked because the build was never in a half-finished state waiting on the next feature.

`Shipped · 2025 · updating 2026` — **Unity · C#**

[Play on itch.io →](https://davidhthe1st.itch.io/mayor-saves-christmas)

---

### Escape From Hell

A score-chasing arena runner about tight movement and one-more-run pressure.

**The question:** What's the real distance between a prototype that feels good on my machine and something that ships to a store?

**Findings:** Most of it was performance on mid-range Android and the Play Console work nobody warns you about — store submission is a project of its own, not a final step. Playtesting was the other half: it validated the core idea early, then did the work I couldn't do alone on UX and balance. I'd budget for both from the start now rather than discovering them at the end.

`Shipped · 2024` — **Unity · C# · Android**

[Play on itch.io →](https://davidhthe1st.itch.io/escape-from-hell)

---

## In development

### Mandarin Daily

A flashcard app for Mandarin learners — HSK vocabulary, example sentences, spaced repetition, short daily sessions.

**The question:** Spaced repetition tools optimise for retention and ignore whether anyone opens them on day nine. Can progression and customization do the work motivation usually has to?

**Findings so far:** Progression matters more than the algorithm, and letting learners shape their own path matters nearly as much. Accessibility turned out to be structural rather than a nice-to-have — pinyin toggles, traditional and simplified — because without it whole groups of learners simply can't use the thing. The AI features (scanning documents into your own flashcards, reviewing homework) work, but the real lesson was cost: a feature that's cheap in testing is a different product at scale, and optimising for that changed what was worth building at all.

`Active · since 2026` — **Kotlin · Android**

Not public yet

---

### Coil

A tracker for reptile keepers — collections, feeding schedules, shedding, health records.

**The question:** Keepers already track this in notebooks and spreadsheets. Does an app actually beat the notebook, or just move the problem?

**Findings so far:** Building against an existing need is far easier than manufacturing one — but only if you check the design against how people actually record things, not how you'd organise it yourself. Current work is accounts and cross-platform sync, since a collection that lives on one phone is a notebook with extra steps.

`Active · since 2026` — **Kotlin · Android**

Not public yet

---

## Experiments

### [Name pending] — bullet-hell prototype

A pure prototype, deliberately unscoped beyond the core.

**The question:** How much of a game's systems can I hand to AI before the design stops being mine? Implementation is AI-assisted; every big-picture design decision stays with me. Where that line actually falls is the experiment.

**Findings:** *[TO WRITE — in progress. Even a partial answer is worth having. Most current-feeling entry on the page and the one a consulting reader is most likely to stop on.]*

`Prototype · since 2026` — **Unity · C#**

Not public

> ⚠️ One entry makes this section look like an afterthought. Jam entries, weekend tools, things built for personal use — anything with a question attached would help.
> 

---

## Shelved

### There Is No Escape

A grid-based game built in the world of Escape From Hell.

**The question:** Could an existing prototype's world carry a completely different genre, and does reusing your own IP actually save anything?

**Why it stopped:** The core was fun, but growing it meant going well past the scope I'd set — and that expansion served neither a learning goal nor a market one. Fun on its own wasn't a good enough reason to keep going.

**What it taught me:** Time-boxing this kind of project is the whole discipline, and the basics have to be fun before anything gets built on top of them. Also that "I'm enjoying this" and "this is worth continuing" are different questions, and it's worth asking the second one out loud.

`Shelved · 2025` — **Unity · C#**

---

## Closing

This is how I work: scope it small, ship it, find out what the assumption got wrong. It's the same approach I bring into studios.

[Work with me →] — links to /consulting

---

## Notes for build

- **Card schema is fixed:** title · hook · question · status+date · findings · link-or-explicit-no-link. Every entry, no exceptions. The consistency is what makes an unfinished prototype sit next to a shipped game without looking embarrassed.
- **Tech lines pruned to engine/language/platform.** No IDEs, no art tools, no LLM names — ambient tooling is what made the original site read hobbyist. Exception: the bullet-hell prototype, where AI is the subject of the experiment and belongs in the question.
- **LocFlow is not here** — it lives on /consulting as proof-of-capability.
- **"Client requested tools (confidential)"** is paid work, not lab work → fourth past-work entry on /consulting, anonymized. It's also the honest source for that page's tech clusters (React, Python, Jira), which the lab stack can't supply.
- **Visual spec:** one fixed aspect ratio, in-game capture only, no editor chrome or debug overlays, consistent overlay + status-badge position. Mayor gets fresh capture from the 2026 update.
- **i18n:** EN / ES / FR.