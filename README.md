# The Regional Table

A fictional editorial food publication where five regional cuisine experts — a Neapolitan Nonna, a Lyonnais Chef, a Cajun-Creole Matriarch, an NYC Street-Food Veteran, a Washoku Shokunin — answer reader questions about the food they know.

Live instance of the *Specialized Expert Persona Architecture* (same pattern as Football-AI and Cuisine-Expert), deployed as a demo card on the Verbalogix agency site.

**Domain (planned):** `cuisine.verbalogix.com`

---

## What's in here

This repo is the **Astro frontend only**. The backend (FastAPI + SQLite knowledge graph + Claude Haiku persona bridge) lives in a separate repo alongside the Cuisine-Expert project.

- **Stack:** Astro 5 (static output) · React islands (`@astrojs/react`) · MDX recipes (`@astrojs/mdx`) · Tailwind CSS 4 via `@tailwindcss/vite` · DM Serif Display + DM Sans (Google Fonts)
- **Content model:** Astro content collections, Zod-validated
  - `src/content/regions/*.yaml` — 5 regional expert profiles
  - `src/content/recipes/*.mdx` — 5 recipes (Ragù Napoletano, Dashi, Quenelle de Brochet, Gumbo, Chopped Cheese)
- **Design system:** Atlas / cartographic — full primitive set documented in `docs/ARCHITECTURE.md`, living reference at `/styleguide` (dev-only, `noindex`)
- **Chat:** per-region expert chat island, ported from Cuisine-Expert; Master Chef meta-persona at `/ask` + floating site-wide pill

---

## Dev commands

```sh
npm install
npm run dev       # local dev server (port 4321)
npm run build     # production build to ./dist/
npm run preview   # preview the build locally
```

**Platform note:** this project runs on Termux on Android (ext4 internal storage). Do NOT run `npm install` from `/storage/emulated/0/...` — FUSE strips executable bits from `node_modules/.bin/*` shims.

---

## Read order for a fresh session

1. [`START-HERE.md`](START-HERE.md) — current status, what's next
2. [`CLAUDE.md`](CLAUDE.md) — agent conventions, DO/DON'T, platform notes
3. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — component map, data flow, Atlas design system reference
4. [`docs/DECISIONS.md`](docs/DECISIONS.md) — why every load-bearing choice was made (≈30 entries across M0-M5)
5. [`docs/POSITIONING.md`](docs/POSITIONING.md) — brand voice + forbidden-phrase list (enforced by `scripts/check-copy.sh`)
6. [`docs/POST-V1-ROADMAP.md`](docs/POST-V1-ROADMAP.md) — 4 additional region dossiers + other deferred work

---

## Guard scripts

```sh
./scripts/smoke.sh          # typecheck, build, dev-server boot, artifact presence
./scripts/check-copy.sh     # positioning red-flag grep (forbidden editorial phrases)
```

Run both before declaring anything done.

---

## Deploy

`Dockerfile` serves the Astro static build via nginx-alpine on port 8080 (Cloud Run convention). Full deploy procedure is in [`docs/DEPLOY.md`](docs/DEPLOY.md) — reuses the PRoot Ubuntu pattern from the Verbalogix intake project.

The backend deploys as a separate Cloud Run service (`cuisine-expert-api`) under the same GCP project.

---

## License

Internal Verbalogix project. Unreleased.
