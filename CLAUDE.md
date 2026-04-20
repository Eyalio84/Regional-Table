# CLAUDE.md — The Regional Table

Conventions and context for any AI agent working in `~/regional-table/`. Read before making a change.

## Required reading (in order)

1. [`START-HERE.md`](START-HERE.md) — project orientation and current status
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — what lives where, component map, data flow
3. [`docs/DECISIONS.md`](docs/DECISIONS.md) — why each key choice was made
4. [`docs/POSITIONING.md`](docs/POSITIONING.md) — brand voice rules; governs all editorial copy
5. `/data/data/com.termux/files/home/.claude/plans/splendid-humming-scroll.md` — phased milestone plan (authoritative spec)

## What this project is

**The Regional Table** is an editorial food publication with embedded AI cooking experts. Five regional cuisine experts — a Neapolitan Nonna, a Lyonnais Chef, a Cajun-Creole Matriarch, a NYC Street-Food Veteran, a Washoku Shokunin — each inhabit their own region landing page and recipe pages, answering questions in their specific voice.

It is a live, working instance of Eyal's *Specialized Expert Persona Architecture* (the same pattern as Cuisine-Expert and Football-AI), deployed as demo card #04 on the Verbalogix agency site. The backend is the existing `~/cuisine-expert/` FastAPI service; this repo is the Astro frontend only.

**Stack:** Astro 5 (static output) · React islands (`@astrojs/react`) · MDX (`@astrojs/mdx`) · Tailwind CSS 4 via `@tailwindcss/vite` · Google Fonts (DM Serif Display + DM Sans) · Cuisine-Expert FastAPI backend (separate repo, separate deploy)

**Domain:** `https://cuisine.verbalogix.com`

## Dev commands

```bash
# Dev server (port 4321 by default)
cd ~/regional-table
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview

# Type-check only
npx astro check

# Guard scripts
./scripts/smoke.sh          # full health check — run before declaring anything done
./scripts/check-copy.sh     # positioning red-flag grep — run before committing any copy
```

## Key content and data file locations

| Path | What it holds |
|---|---|
| `src/content/regions/` | Per-region YAML files (populated in M1). One file per region — source of truth for voice, integrity lines, legendary chefs, seasonal calendar. |
| `src/content/recipes/` | MDX recipe files (populated in M2-M3). One file per recipe with typed frontmatter. |
| `src/content/config.ts` | Astro content collection schemas (Zod-validated; added in M1). |
| `src/layouts/BaseLayout.astro` | HTML shell, fonts, SEO meta, CSS imports, `data-region` attribute. |
| `src/styles/global.css` | Tailwind 4 import + `@theme` block (Atlas tokens populated in M0.5). |
| `src/styles/tokens.css` | CSS custom properties for Atlas design system (populated in M0.5). |

## Design system

The Atlas / cartographic aesthetic is the visual identity. Details live in `docs/ARCHITECTURE.md` (Atlas design system section, populated in M0.5). Short version: DM Serif Display for headlines and editorial voice; DM Sans for navigation, metadata, and coordinates. Per-region palette swap via `data-region` attribute on `<body>`. Duotone photo treatment per region. Recipe pages use the "atlas-plate" layout: coordinate strip, specimen-numbered ingredients, roman-numeral method steps, integrity-line callouts as map-legend boxes.

**The full Atlas primitive set (components, tokens, animation) is authored in M0.5. Do not implement Atlas primitives before then.**

## SMM discipline

This project runs Shared-Mental-Model discipline throughout. Every milestone that changes `src/` files also updates `docs/ARCHITECTURE.md` (structure) and `docs/DECISIONS.md` (choices) in the same session — not retroactively. `CHANGELOG.md` gets an entry at the end of each milestone.

Do not let the docs drift. A future session relying on stale docs loses the cold-start advantage entirely.

## DO

- **Update docs when editing `src/`.** Keep `docs/ARCHITECTURE.md` synchronised — file paths, component roles, data flow.
- **Use design tokens.** Once tokens.css is populated in M0.5, reference tokens as CSS custom properties, not raw values.
- **Check copy before committing.** `./scripts/check-copy.sh` catches positioning red flags. Run it whenever touching user-facing copy, MDX content, or YAML region files.
- **Preserve historical plan files.** `/storage/emulated/0/Download/claude-projects/regional-table/` is plan-storage only — do not modify those files.
- **Run `./scripts/smoke.sh` before declaring a milestone done.**

## DON'T

- **Don't `npm install` on the sdcard path** (`/storage/emulated/0/...`). That path is FUSE-mounted and drops executable bits on `.bin/*` shims. All dev happens in Termux internal (`~/regional-table/`); sdcard is archive-only.
- **Don't use `astro add tailwind`** — that installs the legacy `@astrojs/tailwind` integration (Tailwind 3). Tailwind 4 is configured via `@tailwindcss/vite` in `astro.config.mjs`. This is already done; don't change it.
- **Don't touch the Cuisine-Expert backend** (`/storage/emulated/0/Download/claude-projects/Cuisine-expert/`) until M5. Read-only reference before then.
- **Don't deploy to Cloud Run.** M6 requires explicit user confirmation before any production write.
- **Don't add emojis to files unless the user explicitly asks.**
- **Don't use the words flagged by `scripts/check-copy.sh`.** The ban list exists because this is an editorial publication with a voice, not a marketing page with copy. Forbidden phrases: "revolutionize", "seamlessly", "cutting-edge", "leverage", "unleash", "next-gen", "game-changing", "best-in-class", "synergy", "disrupt", "paradigm shift", "empower", "robust", "scalable solution".

## Platform note

Dev machine: Android / Termux on arm64 (Termux ext4 internal storage at `~/`).

- **Work in `~/regional-table/`** (Termux internal, ext4). Never in `/storage/emulated/0/...` (sdcard, FUSE).
- Astro's dev server and `npm run build` both work in Termux. Turbopack is a Next.js concern — not relevant here.
- PRoot Ubuntu is required for `gcloud run deploy` (gcloud CLI needs glibc). See `docs/DEPLOY.md`.

## Component map

Populated in M0.5 and later. For now, see `docs/ARCHITECTURE.md` for placeholder structure.
