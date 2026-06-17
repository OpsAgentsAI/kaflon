# Kaflon — Launch Copy

Draft GTM copy for the Kaflon launch (card [MyM8gfJs](https://trello.com/c/MyM8gfJs), parent [ZjX8krS0](https://trello.com/c/ZjX8krS0)).

**Status:** draft — hold for launch greenlight (per 2026-05-29 PM call; pull when M1+M2 are merged and Michal greenlights launch timing).

**Screenshots** (captured from live `kaflon.web.app`, both languages, real mid-drill state with an 8-streak):
- `he-drill.png` — Hebrew drill, `8 × 6`, answer `48`, רצף 8 🔥, "נכון! 🎉"
- `en-drill.png` — English drill, same state, LTR
- `he-landing.png` / `en-landing.png` — profile picker (4 kids), both languages

Honest framing throughout: this is a 2-hour parent project that turned into a small open-source toy. Single `index.html`, Tailwind CDN, vanilla JS, view-source *is* the docs. MIT.

Hebrew gender: **Michal's personal voice = feminine singular**; **MSApps/OpsAgents voice = masculine plural**.

---

## 1. Tweet — English (≤280)

> I built my kid a math-drill app in one afternoon with Claude Code.
>
> Hebrew + English. RTL + LTR. No signup, no ads, one HTML file you can read end to end.
>
> It's MIT — fork it for your kid 👇
> kaflon.web.app
> github.com/OpsAgentsAI/kaflon
>
> [📷 he-drill.png + en-drill.png]

*(char count ~250, within limit. Attach both drill screenshots.)*

---

## 2. Tweet — Hebrew (≤280)

> בניתי לבן שלי אפליקציית תרגול מתמטיקה באחר־צהריים אחד, עם Claude Code.
>
> עברית ואנגלית, מימין לשמאל ומשמאל לימין. בלי הרשמה, בלי פרסומות, קובץ HTML אחד שאפשר לקרוא מההתחלה לסוף.
>
> רישיון MIT — שכפלו לילד/ה שלכם 👇
> kaflon.web.app
>
> [📷 he-drill.png]

*(feminine singular — Michal's own voice. Attach the Hebrew drill screenshot.)*

---

## 3. r/ClaudeAI post

**Title:** I built my kid a bilingual (Hebrew/English) math-drill app in an afternoon with Claude Code — single HTML file, MIT

**Body:**

My kid needed multiplication practice and I didn't want an app full of ads, signups, and "premium" nags. So I sat down with Claude Code for an afternoon and built [Kaflon](https://kaflon.web.app).

It's deliberately tiny: **one `index.html`**, Tailwind from a CDN, vanilla JS, no build step. View-source *is* the documentation — there's nothing else to read. That constraint kept it honest and made Claude Code a really good fit: every change is one file, instantly testable in a browser.

What it does: pick a kid profile, choose a mode (×, ÷, squares, ×2, halves), and drill. Score, a streak counter, optional sound, optional on-screen numpad. The thing I'm proudest of — it's **fully bilingual, Hebrew and English, RTL and LTR**, first-class in both. One toggle flips the whole UI including layout direction.

No signup. No ads. No tracking. **MIT licensed** — if your kid needs different material (other languages, other topics), fork it and change the generators; they're a few small functions.

Live: https://kaflon.web.app
Code: https://github.com/OpsAgentsAI/kaflon

Happy to answer anything about the build. [📷 screenshots: he-drill, en-drill]

---

## 4. Anthropic Discord — #community-showcase

> Built **Kaflon** — a bilingual (Hebrew + English, RTL + LTR) math-drill app for my kid — in one afternoon with Claude Code. It's a single `index.html` with no build step, so view-source is the whole docs. Multiplication/division/squares drills, streaks, optional sound, no signup, no ads. MIT-licensed so anyone can fork it for their own kid. Live at kaflon.web.app, code at github.com/OpsAgentsAI/kaflon. The one-file constraint made Claude Code a great fit — every change is one file you can test instantly. [📷 he-drill.png + en-drill.png]

---

## 5. Hebrew kids/education FB group (50–80 words, mom-to-mom, no AI-built lede)

> מצאתי משחק תרגול מתמטיקה פשוט ונקי לילדים — בלי פרסומות, בלי הרשמה, בלי כלום. בוחרים ילד/ה, בוחרים תרגיל (כפל, חילוק, ריבועים), ומתרגלים. יש ניקוד ורצף שמחזיק אותם מרוכזים, ואפשר להחליף בין עברית לאנגלית בלחיצה. חינמי לגמרי. שתפו עם עוד הורים 🙂
> kaflon.web.app
>
> [📷 he-drill.png]

*(warm, parent-to-parent; the "built with Claude Code / open source" angle is intentionally omitted here — that's for the dev channels, not the parent group.)*

---

## Notes for whoever hits publish

- Fill each `[📷 ...]` placeholder with the matching screenshot (in `/assets`, or re-capture fresh from `kaflon.web.app`).
- There's also a **14-second launch teaser video** (portrait, HE+EN) built in `kaflon-gtm-video/` — good for the X video slot, IG Reels/Stories, and the FB post.
- Post order suggestion: r/ClaudeAI + Discord (dev community) first, then the two tweets, then the Hebrew FB group once there's a real-kid screenshot/quote to add warmth.
- Keep it honest: it's a small weekend-scale toy, not a product launch. That's the charm.
