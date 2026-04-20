# Start Here

Five-minute orientation for `~/regional-table/`. Read this before touching anything.

## What this is

An editorial food publication with embedded AI cooking experts. Five regional cuisine experts (Neapolitan, Lyonnais, Cajun-Creole, NYC Street-Food, Washoku) each inhabit region pages and recipe pages with their own voice, answering reader questions about the food they know.

- **Stack:** Astro 5 (static output) · React islands · MDX · Tailwind CSS 4 (`@tailwindcss/vite`) · Google Fonts (DM Serif Display + DM Sans) · Cuisine-Expert FastAPI backend (separate repo)
- **Project type:** Static editorial frontend. The only dynamic piece per page is the expert chat island, hydrated `client:visible`.
- **Primary audience:** Internal AI sessions + Eyal
- **Status: M0 → M4 complete + M-meta. Next milestone: M5 — backend additions (rate limiter, CORS, master pseudo-region, Dockerfile).**

## Run it

```bash
cd ~/regional-table
npm run dev
# open http://localhost:4321
```

## Read-order for a fresh session

1. **This file** — current status, what was built, what's next
2. **[`CLAUDE.md`](CLAUDE.md)** — project conventions, DO/DON'T, platform notes
3. **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** — full structural reference, component map, data flow
4. **[`/data/data/com.termux/files/home/.claude/plans/splendid-humming-scroll.md`]** — phased milestone plan (authoritative spec). Read the upcoming milestone's section before starting work.
5. **[`docs/DECISIONS.md`](docs/DECISIONS.md)** — why each load-bearing choice was made
6. **[`docs/POSITIONING.md`](docs/POSITIONING.md)** — voice rules before touching any copy

If you're starting M0.5, also read the phased plan's M0.5 section in full before writing a single component.

## Where to look for what

| Need | Read |
|---|---|
| Project overview | This file |
| Agent conventions + DO/DON'T | [`CLAUDE.md`](CLAUDE.md) |
| File layout + data flow | [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) |
| Why each key decision was made | [`docs/DECISIONS.md`](docs/DECISIONS.md) |
| Brand voice + forbidden phrases | [`docs/POSITIONING.md`](docs/POSITIONING.md) |
| Deploy procedure | [`docs/DEPLOY.md`](docs/DEPLOY.md) |
| Session narrative log | [`CHANGELOG.md`](CHANGELOG.md) |
| Phased milestone spec | `/data/data/com.termux/files/home/.claude/plans/splendid-humming-scroll.md` |
| Original implementation plan | `/storage/emulated/0/Download/claude-projects/regional-table/IMPLEMENTATION-PLAN.md` |
| Backend (read-only until M5) | `/storage/emulated/0/Download/claude-projects/Cuisine-expert/` |

## Status snapshot

Last updated: 2026-04-20 (end-of-day, M4 complete)

**Done: M0 → M4 + M-meta + pre-launch audit fixes**

- **M0** — Scaffold + SMM baseline (9 SMM artifacts)
- **M0.5** — Atlas design system (12 primitives + `/styleguide`)
- **M0.75** — Design review gate (Eyal signed off after two bug fixes: `[data-region]` nested scoping, SVG `feColorMatrix type="table"`)
- **M1** — 5 region landing pages (content collection + YAML snapshots + chat port)
- **M2** — 2 golden recipes (Ragù Napoletano + Dashi) — template approved
- **M3** — Multiplied to 5 recipes (Quenelle de Brochet, Gumbo, Chopped Cheese)
- **M4** — Homepage + About + Ask + Colophon + Floating Pill + real Wikimedia world map
- **M-meta** — Updated INTERACTIVE-PLANNING-PATTERN.md with /frontend-design + Sonnet-delegation sections
- **Pre-launch audit fixes** — Dockerfile, robots.txt, persistent SiteFooter, recipe↔region cross-links, chat a11y, 404.astro, MasterChefModal → client:idle

**Current state:** 18 static pages, build clean, check-copy clean, all 5 regions rendering with accurate duotones + per-region palette swap, real equirectangular world map on homepage with 339 country paths.

**Next: M5 — Backend additions**
- Rate limiter middleware (10/hr/IP on `/api/v1/chat`, in-memory sliding window)
- CORS config for `https://cuisine.verbalogix.com` + localhost:4321 dev
- `/api/v1/regions/summary` endpoint
- `region_id="master"` pseudo-region in persona bridge
- Dockerfile for `cuisine-expert-api` service

**After M5:**
- **M6** — Deploy (requires explicit user confirmation before any Cloud Run write)
- **M7** — Verification + agency demo-card update + portfolio integration

**Deferred to post-v1 (see `docs/POST-V1-ROADMAP.md`):**
- 4 additional region dossiers (Barcelona, Copenhagen, Brazil, Tuscan)
- Full `SiteHeader.astro` + `RecipeCard.astro` shared components
- `@astrojs/sitemap` + JSON-LD Recipe schema
- OG image + DottedPath production wiring

## Three things most new readers miss

1. **Tailwind 4 is NOT configured via `astro add tailwind`.** It uses `@tailwindcss/vite` as a Vite plugin. The legacy `@astrojs/tailwind` integration installs Tailwind 3 and will conflict. This is already correct — don't change the config.

2. **The backend is read-only until M5.** All Cuisine-Expert FastAPI files at `/storage/emulated/0/Download/claude-projects/Cuisine-expert/` are reference material only. M5 is the first milestone that modifies them.

3. **Work only in `~/regional-table/` (Termux ext4).** The sdcard path at `/storage/emulated/0/Download/claude-projects/regional-table/` holds plan documents only. Installing packages or running the build from sdcard breaks `node_modules` (FUSE drops executable bits).

## Sister projects

- [`~/verbalogic-intake/`](../verbalogic-intake/) — voice intake tool (Next.js 16, separate product)
- [`~/verbalogix-agency/`](../verbalogix-agency/) — agency landing page
- [`/storage/emulated/0/Download/claude-projects/Cuisine-expert/`] — existing FastAPI backend this site will call
- Shared memory: `~/.claude/projects/-storage-emulated-0-Download-claude-projects-verbalogix-agency/memory/` — user philosophy, Termux caveats, project history
