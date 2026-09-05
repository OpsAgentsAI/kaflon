# Project: Kaflon · כפלון

## What This Is

Free, MIT-licensed multiplication, division, and decimals practice toy for kids. **One HTML file, no build step.** "View Source" is the documentation. Built for one parent's kid; designed for any parent to fork and adapt for theirs.

Two surfaces share the same game logic:
- **Web app** (this repo) — Firebase Hosting at `kaflon.opsagents.agency`
- **Cardputer-Adv MicroPython app** — `apps/kaflon.py` in [OpsAgentsAI/anthropic-adv](https://github.com/OpsAgentsAI/anthropic-adv)

## Tech Stack

- Single file: `index.html` — everything is in here
- Tailwind via CDN — no PostCSS, no `tailwind.config.js`
- Vanilla JS, no framework, no bundler
- `localStorage` for all state
- Firebase Hosting on GCP project `kaflon-prod`, site `kaflon-prod` (per-app isolation; credit-covered through 2028). **This repo does not deploy that site's live channel** — see Deploy ownership below

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
- Firebase Hosting on `kaflon-prod` (moved off shared `opsagent-prod` in the per-app isolation migration; `kaflon.web.app` is dead — canonical URL is `kaflon.opsagents.agency`). The old `opsagentsai.github.io/kaflon` GitHub Pages mirror is being phased out — don't add either back to docs
- **No live deploy from this repo.** Re-adding one would overwrite the deployed app and drop its GA4 baseline — see Deploy ownership below

If a feature would break any of these, the answer is "fork it."

**Out of scope** (the no-list):

- Accounts, cloud-sync profiles, parent dashboards
- Leaderboards, social, multiplayer
- Story mode, characters, narrative wrappers
- Ads, IAPs, paywalled tiers
- Native mobile apps (the web app is the product; wrappers are forks' problem)

## Quick Reference

- **Live:** <https://kaflon.opsagents.agency>
- **Trello board:** <https://trello.com/b/IOKRU1eM/kaflon>
- **Local dev:** open `index.html` directly in your browser. No dev server. Reload to see changes
- **Test before commit:** toggle Heb↔Eng (RTL must not break), resize to 375px (tap targets must stay ≥44px)
- **Deploy:** PRs get a 7-day preview channel via GHA `deploy.yml` (`kaflon-deployer@kaflon-prod` WIF). **Pushing to `main` deploys nothing** — see Deploy ownership below

## Deploy ownership — this repo is preview-only

**The live site <https://kaflon.opsagents.agency> is deployed from the private
repo `OpsAgentsAI/kaflon-app`, not from here.** This repo builds PR preview
channels only; pushing to `main` deploys nothing.

Both repos used to deploy `index.html` to the same Firebase Hosting site
(`kaflon-prod`), with no coordination — whichever pushed to `main` last
overwrote the other, in both directions. The two files have diverged and the
divergence is load-bearing: `kaflon-app/index.html` carries the mandatory GA4
analytics baseline, which **this** repo can never carry, because "no analytics
that phone home" is a hard constraint here. So every live deploy from this repo
silently switched analytics off, with no alarm and no visible symptom.

The tie is therefore not a preference — only `kaflon-app` can satisfy the
analytics baseline, so it owns the live channel and this repo stands down.

Consequence to know about: a merge here does **not** reach the live site. Public
changes worth shipping have to be ported into `kaflon-app`. That divergence
already existed; this just makes it explicit instead of a race.

Decided 2026-09-05, card [ROkNaunZ](https://trello.com/c/ROkNaunZ).

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
