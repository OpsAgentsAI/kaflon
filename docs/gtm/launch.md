# Kaflon — launch copy

Ready-to-send drafts for the public GitHub launch of **Kaflon**. Every post carries a
`[SCREENSHOT]` placeholder — slot in the real-kid mid-game screenshot from the kid-QA
sessions (Trello [AmT5BqIb](https://trello.com/c/AmT5BqIb) — Moshe, web /
[qYuIOa8b](https://trello.com/c/qYuIOa8b) — Libi) **before** sending.

- **Repo:** https://github.com/OpsAgentsAI/kaflon
- **Live:** https://kaflon.web.app
- **License:** MIT

> **Voice rules.** Personal posts = Michal, first person. Hebrew personal voice =
> feminine singular. The MSApps/OpsAgents brand voice = masculine plural. No marketing
> fluff — the honest framing is "a couple-of-hours parent project that turned into a
> small open-source toy."

---

## 1. Tweet — English (<280 chars)

> I built a little math-practice app for my kids in a couple of hours with Claude Code.
> One HTML file, no build step, Hebrew + English, MIT-licensed. Fork it and swap in your
> own kid's questions 👇
>
> https://github.com/OpsAgentsAI/kaflon
>
> `[SCREENSHOT: kid mid-drill, EN]`

(269 chars incl. URL placeholder — trim the trailing line if your client counts the link long.)

---

## 2. Tweet — Hebrew (<280 chars)

> בניתי לילדים שלי אפליקציה קטנה לתרגול חשבון בכמה שעות עם Claude Code. קובץ HTML אחד,
> בלי build, עברית ואנגלית, קוד פתוח (MIT). אפשר לעשות fork ולהחליף את התרגילים לילד/ה
> שלכם 👇
>
> https://github.com/OpsAgentsAI/kaflon
>
> `[SCREENSHOT: ילד/ה תוך כדי תרגול, עברית]`

(Speaker = Michal, feminine singular: "בניתי". Audience inclusive: "לילד/ה שלכם".)

---

## 3. r/ClaudeAI post

**Title:** I built an open-source math-practice app for my kids in an afternoon with Claude Code — one HTML file, Hebrew + English

**Body (~190 words):**

> Over an afternoon I used Claude Code to build [Kaflon](https://kaflon.web.app) — a small
> math-drill app for my own kids. It grew into something other parents might want to fork.
>
> Honestly, what it is:
>
> - **One file.** The whole app is a single `index.html` — Tailwind via CDN, vanilla JS,
>   no build step, no `npm install`. View-source *is* the documentation.
> - **Per-kid profiles** with their own tracks (whole numbers → decimals → fractions →
>   percentages → geometry), plus a new opt-in **"Learn" mode**: a 4-step guided flow
>   (explain → worked example → guided practice with a hint that only appears once you're
>   stuck → then it drops you into the real drill).
> - **Hebrew (RTL) and English (LTR)** are both first-class on every screen.
> - **MIT-licensed.** Fork it, rewrite the question generators, and it's your kid's app.
>
> Tests live in a second standalone `tests.html` you open in a browser; it deploys to
> Firebase Hosting on push.
>
> Repo: https://github.com/OpsAgentsAI/kaflon — feedback and PRs welcome.
>
> `[SCREENSHOT: kid mid-drill]`

---

## 4. Anthropic Discord — #community-showcase (one paragraph)

> Built **Kaflon** with Claude Code — an open-source (MIT) math-practice web app I made
> for my kids. It's a single `index.html` with no build step: per-kid profiles, an opt-in
> 4-step "Learn" tutorial mode (explain → example → guided practice with a hint-when-stuck
> → drill), and full Hebrew/English RTL+LTR on every screen. The whole thing is
> fork-and-edit friendly — swap the question generators and it's your kid's app.
> Live: https://kaflon.web.app · Code: https://github.com/OpsAgentsAI/kaflon
> `[SCREENSHOT]`

---

## 5. Hebrew kids/education FB group (50–80 words, mom-to-mom, no AI-built lede)

> שיתוף קטן להורים: יש לי משחק חינמי ופשוט לתרגול חשבון לילדים — בעברית, בלי פרסומות
> ובלי הרשמה. לכל ילד/ה יש פרופיל משלו, יש מצב "הסבר" שמלמד שלב-שלב לפני התרגול, והכול
> עובד גם בעברית וגם באנגלית. פשוט נכנסים מהדפדפן בטלפון או בטאבלט ומתחילים. משתפת בשמחה
> אם זה יכול לעזור גם לכן: https://kaflon.web.app
>
> `[SCREENSHOT: מסך תרגול בעברית]`

(Mom-to-mom, feminine singular speaker, kid-benefit lede — no "built with AI" opener, per card guardrail.)

---

## Pre-send checklist (operator)

- [ ] Real-kid screenshot captured ([AmT5BqIb](https://trello.com/c/AmT5BqIb) Moshe / [qYuIOa8b](https://trello.com/c/qYuIOa8b) Libi) and slotted into every `[SCREENSHOT]`.
- [ ] Hebrew gender proofread (Michal feminine singular in personal voice; brand voice masculine plural).
- [ ] Links resolve (repo + live).
- [ ] Posts sent from Michal's / OpsAgents accounts (operator step — not automated).
- [ ] If/when the launch is meant to drive **Phase 2 signups** (not just OSS stars/forks), confirm the kaflonAgent rate-limit ([YceloyvK](https://trello.com/c/YceloyvK)) shipped first. This OSS launch promotes the public single-file repo (stars/forks), which does not depend on it.
