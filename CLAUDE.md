# Project: Kaflon · כפלון

## What This Is

Free, MIT-licensed multiplication, division, and decimals practice toy for kids. **One HTML file, no build step.** "View Source" is the documentation. Built for one parent's kid; designed for any parent to fork and adapt for theirs.

Two surfaces share the same game logic:
- **Web app** (this repo) — Firebase Hosting at `kaflon.web.app`
- **Cardputer-Adv MicroPython app** — `apps/kaflon.py` in [OpsAgentsAI/anthropic-adv](https://github.com/OpsAgentsAI/anthropic-adv)

## Tech Stack

- Single file: `index.html` — everything is in here
- Tailwind via CDN — no PostCSS, no `tailwind.config.js`
- Vanilla JS, no framework, no bundler
- `localStorage` for all state
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

- One file: `index.html`. No bundlers, no `npm install`, no compiled output. View-source is the documentation
- No accounts, backend, tracking, ads, IAPs, or analytics that phone home
- Tailwind CDN only
- MIT license stays MIT
- Hebrew RTL + English LTR both first-class
- Firebase Hosting on `opsagent-prod`. The old `opsagentsai.github.io/kaflon` GitHub Pages mirror is being phased out — don't add it back to docs

If a feature would break any of these, the answer is "fork it."

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
