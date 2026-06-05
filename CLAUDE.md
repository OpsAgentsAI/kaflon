# Project: Kaflon · כפלון

## What This Is

Free, MIT-licensed multiplication, division, and decimals practice toy for kids. **One HTML file, no build step.** "View Source" is the documentation. Built for one parent's kid; designed for any parent to fork and adapt for theirs.

Two surfaces share the same game logic:
- **Web app** (this repo) — Firebase Hosting at `kaflon.web.app`
- **Cardputer-Adv MicroPython app** — `apps/kaflon.py` in [OpsAgentsAI/anthropic-adv](https://github.com/OpsAgentsAI/anthropic-adv)

## Tech Stack

- `index.html` — all screens and markup
- `app.js` — Firebase auth + kids + subjects + drill routing (loaded after inline script)
- `firebase-config.js` — Firebase project config (safe to commit)
- Tailwind via CDN — no PostCSS, no `tailwind.config.js`
- Firebase SDK via CDN (compat v10) — Auth, Firestore, Functions
- Vanilla JS, no framework, no bundler
- `localStorage` for per-kid drill state (best scores, sound, numpad)
- Firestore for user accounts, kids, global subjects
- Cloud Functions for the kaflon agent (Vertex AI Gemini Flash)
- Firebase Hosting on GCP project `opsagent-prod`, site `kaflon` (credit-covered through 2028)

## Code Conventions

- Custom CSS goes inline `<style>` — no separate CSS files
- Hebrew RTL + English LTR are both first-class — every feature works in both
- Math expressions stay LTR even in Hebrew context (`7 × 8` reads left-to-right because it is math notation, not prose)
- Mobile-first: tap targets ≥44px, test at 375px viewport
- Conventional commits: `feat:`, `fix:`, `docs:`
- State once multi-profile lands: namespace under profile id (`kaflon.profiles.{id}.bestStreak`)

## Output Preferences

- Co-author commits with Claude
- Update the Trello card with commit SHA + live-URL screenshot when shipping a feature

## Boundaries

**Hard constraints — these define what Kaflon is. Don't propose changes that violate them:**

- No bundlers, no `npm install` for frontend code. CDN only (Tailwind + Firebase compat SDK).
- No ads, IAPs, analytics that phone home, or paywalled features. MIT stays MIT.
- Hebrew RTL + English LTR both first-class. Every feature must work in both directions.
- Firebase Hosting on `opsagent-prod`. No GitHub Pages.
- Firestore data: users can only read/write their own kids. Subjects are globally readable, agent-only writable.
- The kaflon agent (Cloud Function) is the only write path for new subjects. No direct Firestore writes for subjects from the frontend.

**Phase 2 additions (no longer out of scope):**

- User accounts via Firebase Auth (Google + email/password)
- Firestore for users, kids, and shared subject library
- Cloud Function `kaflonAgent` — Vertex AI Gemini Flash generates subject + starter questions

**Mandatory app baseline (per global rule "Every app ships with"):**

- **Admin dashboard** — `admin-screen`, admin-only (email allowlist `michal@opsagents.agency` / `michal@msapps.mobi`), lists all users + kid counts via the admin-gated `listAllUsers` Cloud Function. Admin button (🛠️) shows in header only for allowlisted emails.
- **Google Analytics (GA4)** — wired via `firebase-analytics-compat` + `track()` helper in `firebase-config.js`. Auto-activates once a GA4 stream is linked to the web app (operator/console step to provision the measurementId). Key events: `login`, `kid_added`, `subject_created`, `drill_start`, `admin_dashboard_open`, `exception`.
- **Crashlytics** — N/A for the web app (no web SDK). Web error tracking = GA4 `exception` events (window `error` + `unhandledrejection`). The Cardputer/native surface (`apps/kaflon.py`) is the one that would carry Crashlytics if it ever ships as a packaged native app.

**Out of scope** (the no-list):

- Accounts, cloud-sync profiles, parent dashboards
- Leaderboards, social, multiplayer
- Story mode, characters, narrative wrappers
- Ads, IAPs, paywalled tiers
- Native mobile apps (the web app is the product; wrappers are forks' problem)

## Quick Reference

- **Live:** <https://kaflon.web.app>
- **Trello board:** <https://trello.com/b/IOKRU1eM/kaflon>
- **Local dev:** open `index.html` directly in your browser. No dev server. Reload to see changes
- **Test before commit:** toggle Heb↔Eng (RTL must not break), resize to 375px (tap targets must stay ≥44px)
- **Deploy:** push to `main` → Firebase Hosting auto-deploys (once GHA workflow lands; currently operator-driven via cli-gateway warm-instance pattern)

## Community PRs

**Merge eagerly:**
- Translations (any language — Hebrew is RTL-first; reuse for Arabic; LTR for others)
- Accessibility improvements
- New drill modes (squares, fractions, place-value, percentages, etc.)
- Bug fixes
- New profiles for new kids

**Reject with friendly explanation:**
- Anything that adds a build step, backend, tracker, or analytics
- Anything that breaks RTL or English-first rendering
- Anything that compromises MIT
- Anything that paywalls features

## Success metric

A parent's kid uses it 3+ times in week 1 of forking. That is the only metric that really matters.
