# Contact — Copy (EN)

Source of truth for all user-facing strings on `/contact`.
Key namespace: `contact.<section>.<field>`. Shared components (nav, footer) use their own shared keys — never page-scoped ones.

Light hero, per the hero background rule in `CLAUDE.md`.

---

## Hero — `contact.hero.*`

**eyebrow**
Get in touch

**title**
Different reasons to get in touch, different doors.

**lead**
Pick whichever fits. I read everything that arrives and reply within two working days.

**meta**
Vigo, Spain · CET · Working in English, Spanish, French, and Portuguese

---

## Route 1 — Consulting — `contact.consulting.*`

**title**
Consulting enquiry

**desc**
If you're a studio with a pipeline, localization, or process problem, the fastest route is a call. Fifteen minutes, no commitment — we work out together whether there's a fit.

**cta**
Book a call

*Links to `/consulting#book`. Do not duplicate the Calendly embed here.*

---

## Route 2 — Everything else — `contact.general.*`

**title**
Anything else

**desc**
Press, collaborations, a question about one of the games, or something that doesn't fit a category. Use the form, or email me directly — both reach the same place.

### Form fields — `contact.form.*`

**name_label**
Your name

**name_placeholder**
Name

**email_label**
Email

**email_placeholder**
you@example.com

**message_label**
Message

**message_placeholder**
What's on your mind?

**submit**
Send message

**sending**
Sending…

**success**
Thanks — that's arrived. I'll get back to you within two working days.

**error**
Something went wrong sending that. Email me directly at hello@badideainteractive.com and it'll reach me.

**privacy**
Submissions are handled by a third-party form service and sent to my inbox. Nothing is stored on this site or used for anything else.

### Direct email — `contact.email.*`

**label**
Or email directly

*Address: hello@badideainteractive.com — not a translatable string.*

---

## Route 3 — Elsewhere — `contact.social.*`

**title**
Elsewhere

**desc**
LinkedIn is the best place to reach me day to day.

*Links:*
- *LinkedIn (personal): https://www.linkedin.com/in/david-fl%C3%B3rez-herrero-50b95b98/*
- *Instagram: https://www.instagram.com/badideaint/*
- *itch.io: https://davidhthe1st.itch.io/*

*Note: the footer and nav keep the Bad Idea Interactive company LinkedIn. Personal profile is used here only, because this page's primary audience is consulting enquiries.*

---

## Meta — `contact.meta.*`

**title**
Contact — Bad Idea Interactive

**description**
Get in touch with David Flórez Herrero — consulting enquiries, collaborations, press, or questions about the games. Based in Vigo, Spain. Replies within two working days.
