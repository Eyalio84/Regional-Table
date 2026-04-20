# Architecture — The Regional Table

How `~/regional-table/` is laid out and how the pieces connect. Updated each milestone.

## Overview

The Regional Table is a statically-generated Astro site. At build time, Astro reads content collections (region YAML, recipe MDX) and renders every page to HTML. The only runtime JavaScript per page is the expert chat island, hydrated `client:visible` via React. That island calls the Cuisine-Expert FastAPI backend directly from the browser; no API proxy lives in this repo.

The site is structured as an editorial publication: a homepage cover, five region landing pages with voice intros and recipe listings, individual recipe pages with a structured "atlas-plate" layout, and supporting pages (Ask, About, Colophon). Each region has its own colour palette, applied via a `data-region` attribute on `<body>`.

## Tech stack

| Layer | Pick | Notes |
|---|---|---|
| Framework | Astro 5 | `output: 'static'`; React islands only where JS is needed |
| React | `@astrojs/react` | Chat island (`client:visible`), floating pill modal |
| MDX | `@astrojs/mdx` | Recipe files; MDX components (IngredientList, StepList, etc.) injected at build |
| CSS | Tailwind CSS 4 via `@tailwindcss/vite` | NOT `@astrojs/tailwind` (that is Tailwind 3) |
| Design tokens | `src/styles/tokens.css` | CSS custom properties; per-region `[data-region=...]` blocks |
| Fonts | Google Fonts via `<link>` | DM Serif Display 400/400i; DM Sans 400/500/700/800 |
| Content | Astro Content Collections | Zod-validated frontmatter; `src/content/regions/` + `src/content/recipes/` |
| Images | Unsplash CDN URLs | No local assets; `photographer` + `photographerUrl` in frontmatter for attribution |
| Backend | Cuisine-Expert FastAPI | Existing service; called from browser; this repo does NOT proxy it |
| Deploy — frontend | nginx-alpine on Cloud Run | Static `dist/` served; port 8080; domain `cuisine.verbalogix.com` |
| Deploy — backend | Cloud Run | `cuisine-expert-api`; domain `cuisine-api.verbalogix.com`; separate service |

## Directory tree

```
regional-table/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro           HTML shell, fonts, SEO meta, data-region="neutral";
│   │                                  mounts DuotoneFilters, SiteFooter, FloatingChefPill,
│   │                                  MasterChefModal client:idle
│   ├── components/
│   │   ├── SiteFooter.astro           Persistent footer: 3-col nav + wordmark (post-M4 audit)
│   │   ├── atlas/                     All Atlas cartographic primitives (M0.5+)
│   │   │   ├── CoordinateStrip.astro
│   │   │   ├── RuleLine.astro
│   │   │   ├── LegendCallout.astro
│   │   │   ├── SpecimenList.astro
│   │   │   ├── MethodList.astro
│   │   │   ├── DottedPath.astro
│   │   │   ├── RegionalDuotone.astro  Uses SVG feColorMatrix via filter:url(#duotone-X)
│   │   │   ├── DuotoneFilters.astro   SVG <filter> defs, mounted once in BaseLayout (post-M4)
│   │   │   ├── MapSVG.astro           Real Wikimedia world map (CC0), 339 paths, equirectangular
│   │   │   ├── FloatingChefPill.astro
│   │   │   ├── MasterChefModal.tsx    client:idle in BaseLayout
│   │   │   ├── PhotoCredit.astro
│   │   │   ├── Reveal.astro
│   │   │   └── RegionHero.astro       Region landing page hero (M1)
│   │   └── chat/
│   │       └── ExpertChatPanel.tsx    React chat island (M1); a11y fixes post-M4 audit
│   ├── pages/
│   │   ├── index.astro                Homepage (M4: hybrid 3-frame cover)
│   │   ├── about.astro                Architecture disclosure (M4)
│   │   ├── ask.astro                  Master Chef dedicated chat (M4)
│   │   ├── colophon.astro             Photo + source credits (M4)
│   │   ├── styleguide.astro           Dev-only Atlas reference; noindex + robots.txt disallow
│   │   ├── 404.astro                  Custom 404 in editorial voice (post-M4 audit)
│   │   ├── regions/
│   │   │   ├── index.astro            All-regions index with atlas map (M1)
│   │   │   └── [slug].astro           Dynamic region pages; includes recipe grid (M1 + post-M4)
│   │   └── recipes/
│   │       ├── index.astro            Recipe listing with region filter chips (M2)
│   │       └── [slug].astro           Atlas-plate recipe template; includes region back-link (M2 + post-M4)
│   ├── content/
│   │   ├── config.ts                  Content collection schemas — Zod (M1; Astro 6 location)
│   │   ├── regions/                   Per-region YAML files (M1) — 5 files
│   │   │   ├── neapolitan.yaml
│   │   │   ├── lyonnais.yaml
│   │   │   ├── cajun-creole.yaml
│   │   │   ├── nyc-street-food.yaml
│   │   │   └── washoku.yaml
│   │   └── recipes/                   MDX recipe files (M2-M3) — 5 files
│   │       ├── ragu-napoletano.mdx
│   │       ├── dashi.mdx
│   │       ├── quenelle-de-brochet.mdx
│   │       ├── gumbo.mdx
│   │       └── chopped-cheese.mdx
│   ├── lib/
│   │   ├── api.ts                     Typed client + translation layer: {region_id, messages[]} → {region, message}; maps data.response → content; separates network from HTTP errors (M1; contract fix v1)
│   │   └── regions.ts                 Slug adapter + region metadata (M1)
│   └── styles/
│       ├── global.css                 @import "tailwindcss"; + @theme block
│       └── tokens.css                 Atlas CSS custom properties; [data-region="X"] selectors
├── docs/
│   ├── ARCHITECTURE.md                This file
│   ├── DECISIONS.md                   Load-bearing decision log
│   ├── POSITIONING.md                 Brand voice rules + forbidden phrases
│   ├── DEPLOY.md                      PRoot Ubuntu → Cloud Run deploy procedure
│   ├── CONTENT-WORKFLOW.md            Recipe authoring template (M2)
│   └── POST-V1-ROADMAP.md             Scoped-but-deferred v1.1 items
├── scripts/
│   ├── smoke.sh                       Health check: artifacts, build, typecheck, dev boot
│   └── check-copy.sh                  Positioning red-flag grep
├── public/
│   ├── favicon.svg / favicon.ico
│   └── robots.txt                     Disallows /styleguide; sitemap hint (post-M4 audit)
├── Dockerfile                         nginx-alpine static serve; 2-stage build (post-M4 audit)
├── CLAUDE.md                          Agent conventions + DO/DON'T
├── START-HERE.md                      Five-minute orientation, current status
├── CHANGELOG.md                       Session narrative log
├── astro.config.mjs                   output: static, site URL, Vite Tailwind plugin, integrations
├── package.json
└── tsconfig.json                      extends astro/tsconfigs/strict; jsx: react-jsx
```

## Page inventory

All pages under `src/pages/` as of post-M4 audit. Build generates 18 static HTML files.

| Page file | URL | Status | Notes |
|---|---|---|---|
| `index.astro` | `/` | Built M4 | Three-frame homepage: cover + atlas map + featured plates |
| `about.astro` | `/about` | Built M4 | Architecture disclosure; publication-colophon voice |
| `ask.astro` | `/ask` | Built M4 | Master Chef dedicated chat; FloatingChefPill hidden here |
| `colophon.astro` | `/colophon` | Built M4 | Photo credits, content sources, typography note |
| `styleguide.astro` | `/styleguide` | Dev-only | `<meta name="robots" content="noindex">`; `robots.txt` disallow. Not linked from any production page. 13-section Atlas primitive reference. |
| `404.astro` | `/404` | Built post-M4 audit | Custom editorial 404; served by nginx `error_page 404 /404.html` |
| `regions/index.astro` | `/regions/` | Built M1 | All-regions index with MapSVG + 5 region cards |
| `regions/[slug].astro` | `/regions/{slug}` × 5 | Built M1; recipe grid added post-M4 audit | Dynamic; reads regions collection; "PLATES FROM THIS KITCHEN" section added |
| `recipes/index.astro` | `/recipes/` | Built M2 | Recipe listing with region filter chips |
| `recipes/[slug].astro` | `/recipes/{slug}` × 5 | Built M2; back-link added post-M4 audit | Atlas-plate template; "« From the {region} kitchen" back-link added |

## Component map

Components are authored starting in M0.5. The table below lists the planned component set with TBD markers; each row is filled in as the component is built.

### Atlas primitives (M0.5)

| Component | File | Role | Status |
|---|---|---|---|
| CoordinateStrip | `src/components/atlas/CoordinateStrip.astro` | Top strip: `40.84°N · 14.25°E · NAPLES · Plate III`. Coordinates tick from 0 to actual on load (400ms). | Done — M0.5 |
| RuleLine | `src/components/atlas/RuleLine.astro` | Hairline variants (hair/strong/dotted) with optional centered label. | Done — M0.5 |
| LegendCallout | `src/components/atlas/LegendCallout.astro` | Integrity-line component styled as a map legend box. Gold-accent border, DM Serif rule text. | Done — M0.5 |
| SpecimenList | `src/components/atlas/SpecimenList.astro` | Numbered ingredient list (01/02/03). Hairline-separated rows. | Done — M0.5 |
| MethodList | `src/components/atlas/MethodList.astro` | Numbered step list (i./ii./iii.). Hairline-separated rows. | Done — M0.5 |
| DottedPath | `src/components/atlas/DottedPath.astro` | SVG dotted path between two DOM anchors. `stroke-dashoffset` draw animation on mount. | Done — M0.5 |
| RegionalDuotone | `src/components/atlas/RegionalDuotone.astro` | Per-region duotone wrapper for `<img>`. References `filter: url(#duotone-{region})` SVG filter defined in `DuotoneFilters.astro`. Guard comment: DO NOT use for hero images — heroes are full-color. | Done — M0.5; SVG filter impl finalized post-M0.75 |
| MapSVG | `src/components/atlas/MapSVG.astro` | Real Wikimedia world map (CC0, 339 country paths, equirectangular projection). 5 region pins, graticule grid, Master-Chef star centrepiece. `activePin` prop. `transform="scale(0.842105,0.645161)"` + `vector-effect: non-scaling-stroke`. | Done — M0.5 placeholder; real map inline in M4 |
| FloatingChefPill | `src/components/atlas/FloatingChefPill.astro` | Gold floating pill (bottom-right, site-wide). Opens MasterChefModal. Hidden on `/ask`. | Done — M0.5 |
| MasterChefModal | `src/components/atlas/MasterChefModal.tsx` | React shell modal (placeholder for M1 full port). Listens for `open-master-chef` event + Escape. | Done — M0.5 |
| PhotoCredit | `src/components/atlas/PhotoCredit.astro` | Inline Unsplash attribution under every photo. Configurable alignment. | Done — M0.5 |
| Reveal | `src/components/atlas/Reveal.astro` | IntersectionObserver fade-in slot wrapper. Uses window.__rtReveal guard to avoid duplicate observers. | Done — M0.5 |

### Global UI (post-M4 audit)

| Component | File | Role | Status |
|---|---|---|---|
| SiteFooter | `src/components/SiteFooter.astro` | Persistent page footer. Three-column nav (Kitchens / Browse / The Publication) + wordmark + issue line. Mounted in BaseLayout on every page. Uses `RuleLine` for the top hairline divider. | Done — post-M4 audit |
| SiteHeader | `src/components/SiteHeader.astro` | Sticky header: wordmark, desktop nav, mobile hamburger. | Deferred to v1.1 — not built |

### Region + recipe components (M1 + M2)

| Component | File | Role | Status |
|---|---|---|---|
| RegionHero | `src/components/atlas/RegionHero.astro` | Atlas primitive: hero section for region pages. CoordinateStrip + wordmark + expert voice label + voice quote + attribution hairline. No interaction. | Done — M1 |
| ExpertChatPanel | `src/components/chat/ExpertChatPanel.tsx` | React island: inline chat, ported from CuisineChat.tsx. Props: `regionId` (scopes region, hides carousel), `contextSeed` (seeded opener bubble), `placeholder`. Uses `src/lib/api.ts` for API calls. REGIONS config hardcoded inside component. Post-M4 audit: `aria-label` added to textarea and send button; chat emojis removed. | Done — M1; a11y fixes post-M4 audit |
| RecipeCard | `src/components/RecipeCard.astro` | Recipe preview card abstraction. | Deferred to v1.1 — not built. Recipe cards are inlined in pages (`index.astro`, `src/pages/index.astro`). Acceptable at 5-recipe scale. |
| ArticleLayout | `src/layouts/ArticleLayout.astro` | Editorial layout wrapper for recipe + article pages. | Deferred — not built. Recipe pages use `BaseLayout` directly. |

### M1 — Region pages

#### Content collection: `regions`

Schema defined in `src/content.config.ts` (Astro 6 format, with `glob` loader). Five YAML files in `src/content/regions/`. These are structural snapshots translated faithfully from backend JSONs — voice editing handled by Opus coordinator in a separate pass.

Fields:
- `id` — kebab-case slug matching URL (e.g. `cajun-creole`)
- `displayName`, `cuisineFamily`, `expertVoice` — display metadata
- `coordinates` — `{ lat, lon, city }` for CoordinateStrip
- `voiceDescription` — copied verbatim from backend JSON `voice_description`
- `voiceQuote` — first greeting from frontend `regions.ts` config
- `shortBlurb` — from frontend `regions.ts` `shortDescription`
- `legendaryTechniques` — first 5 from backend JSON; description from `what_user_doesnt_know_yet`
- `integrityLines` — all from backend JSON; `severity` mapped (backend `strict` → schema `strong`)
- `legendaryChefs` — all from backend JSON
- `seasonalCalendar` — month/season-key → dish array
- `culturalNote` — condensed 1–2 sentence note from `cultural_identity`
- `sacredIngredients` — ingredient `name` strings only

#### Content collection: `recipes`

Schema defined in `src/content.config.ts`. MDX content authored in M2. All fields:
- `title` — recipe name
- `slug` — optional override (defaults to Astro entry `id`)
- `region` — one of the 5 region slugs; controls theme swap on recipe page
- `heroImage` / `heroPhotographer` / `heroPhotographerUrl` — Unsplash hero photo + credit
- `servings` — integer
- `time` — `{ prep, cook, total }` all strings (e.g. `"3 hours 30 minutes"`)
- `difficulty` — `beginner | intermediate | advanced`
- `techniques` — array of technique strings
- `integrityLines` — map-legend callouts; `{ rule, severity }` where severity is `absolute | strong | mild`; defaults to `[]`
- `ingredients` — array of `{ quantity, name, note? }`; the "Specimen" column in atlas-plate layout; defaults to `[]`
- `method` — array of `{ step, tip? }`; the "Method" column in atlas-plate layout; defaults to `[]`
- `seoDescription` — meta description string
- `publishedAt` — date
- `plateNumber` — integer (1-indexed within region); rendered as Roman numeral in CoordinateStrip and recipe index

#### Atlas-plate recipe layout: `src/pages/recipes/[slug].astro`

The recipe page template. Atlas-plate composition (top to bottom):

1. `CoordinateStrip` — lat/lon/regionName/plateNumber for the recipe's region
2. **Hero split** — title (`--fs-display`, serif) + metadata (caps-sans) on the left; `RegionalDuotone`-wrapped hero image + `PhotoCredit` on the right. CSS grid, stacks on mobile, 1:1.1 split on desktop (min-width: 900px)
3. `RuleLine` (strong)
4. **Cultural preamble** — MDX body (`<Content />`) rendered in a `readable` section with serif lede styling. First paragraph gets a CSS drop-cap (`::first-letter` in `--accent`). This is the narrative prose authored by Opus — separated from structured frontmatter by design
5. `RuleLine` (strong, label: "SPECIMEN · METHOD")
6. **Atlas-plate split** — 1:2 grid on desktop. Left: `SpecimenList` (ingredients from frontmatter). Right: `MethodList` (method steps from frontmatter)
7. `integrityLines` block — conditional on `integrityLines.length > 0`; each rendered as `LegendCallout`
8. `ExpertChatPanel` island (`client:visible`) — seeded with recipe title

**Design decision:** Frontmatter holds structured data (ingredients, method, integrity lines); MDX body holds cultural prose. These are intentionally separate — see `docs/DECISIONS.md § M2`.

#### Recipe index: `src/pages/recipes/index.astro`

Reads all recipe entries, sorts by `plateNumber` then title. Renders:
- `CoordinateStrip` labelled "THE RECIPE INDEX"
- 5 region filter chips linking to `/regions/[slug]`
- `auto-fill minmax(280px, 1fr)` grid of recipe cards (thumbnail duotone + plate Roman numeral + region + title + time/difficulty)
- Empty-state message when no MDX files exist (pre-M2 content)

#### Slug adapter: `src/lib/regions.ts`

`RegionSlug` (URL/frontend form) ↔ `BackendRegionId` (snake_case backend form). Translations: `cajun-creole` ↔ `cajun_creole`, `nyc-street-food` ↔ `nyc_street_food`. Others are identical. `regionCoordinates(slug)` returns hardcoded lat/lon for each of the 5 regions.

#### API client: `src/lib/api.ts`

Typed client + translation layer between the frontend's conversation-history model and the backend's stateless single-message contract. `sendChatMessage(req)` accepts `{region_id, messages[]}` from the component, extracts the last user message, and POSTs `{region, message}` to `POST /api/v1/chat`. Maps `data.response` → `content` for the component. Separates network errors (fetch throws — server unreachable) from HTTP 4xx/5xx (server reached, returned an error) with independent `try/catch` blocks for accurate humanized error surfacing. Uses `PUBLIC_CUISINE_API_URL` env var with `localhost:8000` fallback. Client-side only — no build-time fetch.

#### Dynamic route: `src/pages/regions/[slug].astro`

`getStaticPaths()` reads the regions collection and returns 5 paths. Sets `data-region` on `<body>` via BaseLayout's new `region` prop. Renders: `RegionHero` → integrity lines as `LegendCallout` → chef grid → seasonal calendar strip → `ExpertChatPanel` island.

#### BaseLayout (accumulated changes M0 → post-M4 audit)

`src/layouts/BaseLayout.astro` accepts `region` prop (default `'neutral'`) set on `<body data-region={region}>` (added M1). Post-M4 audit additions:
- `<DuotoneFilters />` mounted before `<main>` — provides shared SVG `<filter>` definitions for `RegionalDuotone` on every page
- `<SiteFooter />` mounted after `<main>` — persistent navigation footer
- `<MasterChefModal client:idle />` — hydration directive changed from `client:load`; defers React bootstrap to browser idle

## Data flow

### Build-time (static generation)

```
npm run build
  │
  ├─ Astro reads src/content/config.ts (Zod schemas for regions + recipes)
  │
  ├─ getCollection('regions') → 5 YAML files → region landing pages rendered
  │   └─ [slug].astro getStaticPaths() → /regions/neapolitan, /lyonnais, etc.
  │
  ├─ getCollection('recipes') → MDX files → recipe pages rendered
  │   └─ [slug].astro getStaticPaths() → /recipes/ragu-napoletano, /dashi, etc.
  │
  └─ All 10+ pages output as static HTML into dist/
```

### Runtime (browser)

```
User loads a recipe page
  │
  ├─ Static HTML renders immediately (fonts, content, atlas layout — zero JS needed)
  │
  └─ ExpertChatPanel scrolls into view → client:visible hydration
       │
       ├─ React island mounts with regionId + contextSeed props
       │
       └─ User sends a message
            │
            └─ api.ts extracts last user message from history array
                 │   (frontend keeps full message history client-side for display;
                 │    each send transmits only the latest user turn to the backend,
                 │    which responds statelessly based on its KG + regional persona)
                 │
                 └─ POST https://cuisine-api.verbalogix.com/api/v1/chat
                      │   body: {region, message} — backend's stateless contract
                      └─ FastAPI → Claude Haiku 4.5 (Cuisine-Expert backend)
                           └─ data.response mapped to content → chat panel
```

### Floating pill flow (site-wide, M0.5+)

```
FloatingChefPill (Astro, static) present on every page except /ask
  │
  └─ User clicks pill → MasterChefModal (React) mounts lazily
       └─ POST cuisine-api.verbalogix.com with regionId="master"
```

## Backend integration

The Cuisine-Expert FastAPI backend (`cuisine-expert-api` Cloud Run service) is a completely separate deployment. This frontend calls it directly from the browser via `PUBLIC_CUISINE_API_URL` (env var, injected at build time).

Subdomain separation: `cuisine.verbalogix.com` (frontend) talks to `cuisine-api.verbalogix.com` (backend). CORS policy on the backend (added in M5) allows only `https://cuisine.verbalogix.com` and `http://localhost:4321`.

The slug adapter in `src/lib/regions.ts` translates URL slugs (`cajun-creole`, `nyc-street-food`) to backend region IDs (`cajun_creole`, `nyc_street_food`).

No API proxy, no server-side fetch of backend data at runtime. Build-time data (region metadata) comes from local YAML files, not from live API calls — this keeps the build independent of the backend's availability.

## Port map

| Service | Dev port | Prod |
|---|---|---|
| Astro dev server | 4321 (or 4322+ if occupied) | nginx-alpine on Cloud Run, port 8080 |
| Cuisine-Expert API | 8000 (local) | Cloud Run port 8080, `cuisine-api.verbalogix.com` |
| Agency site | 3000 | Deployed separately |
| Intake tool | 3001 | Cloud Run, `intake.verbalogix.com` |

## Atlas design system (M0.5)

The Atlas / cartographic visual identity is the site's defining design choice. All primitives live in `src/components/atlas/`. The living reference is `/styleguide` (noindex, dev/staging only). See `docs/DECISIONS.md` for the reasoning behind the aesthetic choice.

### Primitives

| Component | File | One-line description |
|---|---|---|
| CoordinateStrip | `src/components/atlas/CoordinateStrip.astro` | Top strip: `40.84°N · 14.25°E · NAPLES · Plate III`. Coordinates tick from 0 → actual on mount (400ms, respects prefers-reduced-motion). |
| RuleLine | `src/components/atlas/RuleLine.astro` | Hairline rule variants (hair/strong/dotted) with optional centered label that breaks the rule. |
| LegendCallout | `src/components/atlas/LegendCallout.astro` | Map-legend styled integrity-line callout. Three severity levels (absolute/strong/mild); left border in var(--accent). |
| SpecimenList | `src/components/atlas/SpecimenList.astro` | Ingredient list rendered as zero-padded numbered specimens (01/02/03). Serif name, sans quantity, hairline between rows. |
| MethodList | `src/components/atlas/MethodList.astro` | Recipe method as Roman-numeral plate steps (i./ii./iii.). Accent-colored numerals in italic serif, optional tip line. |
| DottedPath | `src/components/atlas/DottedPath.astro` | SVG dotted path between two DOM elements by ID. Animates stroke-dashoffset on mount. Straight or arc curve. |
| RegionalDuotone | `src/components/atlas/RegionalDuotone.astro` | Per-region duotone wrapper for `<img>`. References `filter: url(#duotone-{region})` from `DuotoneFilters.astro`. Guard comment: not for hero images. |
| DuotoneFilters | `src/components/atlas/DuotoneFilters.astro` | Zero-visual SVG holding all `<filter id="duotone-{region}">` defs. Mounted once in BaseLayout. `feColorMatrix` luminance pass + `feComponentTransfer type="table"` two-stop mapping. |
| MapSVG | `src/components/atlas/MapSVG.astro` | Real Wikimedia world map (CC0), 800×400 viewBox, 339 country paths, equirectangular projection. 5 region pins, graticule grid, Master Chef star. activePin prop. Non-uniform scale transform + `vector-effect: non-scaling-stroke`. |
| FloatingChefPill | `src/components/atlas/FloatingChefPill.astro` | Gold fixed pill (bottom-right, z-index var(--z-pill)). Dispatches `open-master-chef` event on click. Self-hides on /ask route. |
| MasterChefModal | `src/components/atlas/MasterChefModal.tsx` | React shell modal. Listens for `open-master-chef` event + Escape key. Slide-in animation. M4: renders `ExpertChatPanel regionId="master"`, 72vh. Hydrated `client:idle` in BaseLayout. |
| PhotoCredit | `src/components/atlas/PhotoCredit.astro` | Inline photo attribution: "Photograph by [name] on Unsplash". Caps-sans, configurable alignment. |
| Reveal | `src/components/atlas/Reveal.astro` | IntersectionObserver fade-in wrapper. Adds .reveal; script adds .is-visible at 10% threshold. Uses window.__rtReveal flag to avoid duplicate observers. |

### /styleguide page

`src/pages/styleguide.astro` — 13-section long-scroll page exercising every primitive. Not linked from any other page; direct-URL access only. Contains `<meta name="robots" content="noindex">`. Shows type scale, all rule variants, coordinate strips with region wrappers, legend callouts at all severity levels, specimen + method lists, dotted path demos, per-region duotone grid, palette chip rows for all 5 regions, the atlas map, floating pill/modal usage notes, photo credit, and three reveal blocks.

## M3 — Recipe multiplication (2026-04-20)

Three additional recipes authored (one per remaining region), completing the 5-recipe v1 launch set.

### Recipe roster (complete at M3)

| File | Region | Title | Plate | Voice density |
|---|---|---|---|---|
| `ragu-napoletano.mdx` | neapolitan | Ragù Napoletano | I | Dense (Mediterranean maximalism — Nonna voice) |
| `dashi.mdx` | washoku | Awase Dashi | I | Sparse (Japanese minimalism — Shokunin voice) |
| `quenelle-de-brochet.mdx` | lyonnais | Quenelle de Brochet, Sauce Nantua | I | Medium-technical (Lyonnais Chef — precise, economical) |
| `gumbo.mdx` | cajun-creole | Chicken and Andouille Gumbo | I | Dense-narrative (Cajun-Creole Matriarch — warm, opinionated) |
| `chopped-cheese.mdx` | nyc-street-food | The Chopped Cheese | I | Short-brash (NYC Street Food Veteran — direct, no hedging) |

**Total recipe count: 5** (one per region). Build now generates 17 pages total: 5 region landing pages + 5 recipe pages + recipes index + regions index + styleguide + 4 support pages (index, about, ask, colophon).

### Content-multiplication workflow

The recipe authoring workflow is captured in `docs/CONTENT-WORKFLOW.md`. Key decisions made concrete during M3:

1. **Voice spectrum confirmed.** The Ragù ↔ Dashi axis predicts preamble density correctly: Gumbo (Cajun-Creole) lands near Ragù; Quenelle (Lyonnais) sits between them; Chopped Cheese (NYC) is the sparsest preamble (180-250 words, 2-3 paragraphs), proving the layout does not require padding to work.

2. **Techniques field cross-referenced.** Each recipe's `techniques[]` array contains only names that appear in the matching region YAML `legendaryTechniques` — this is the constraint documented in `docs/CONTENT-WORKFLOW.md §1`.

3. **`plateNumber: 1`** for all three new recipes — each is the first recipe for its region.

4. **Duotone guard added.** `RegionalDuotone.astro` now carries a doc-comment warning at the top of the frontmatter block: DO NOT apply to hero images. Heroes are full-color per the confirmed photo treatment decision.

5. **`docs/CONTENT-WORKFLOW.md` created** — captures frontmatter conventions, drop-cap rules, integrity-line severity guide, duotone application rule, authoring checklist, voice spectrum, and forbidden phrase pointer.

## M4 — Homepage + About + Ask + Colophon + Floating Pill wiring (2026-04-20)

Hub pages connecting everything together. The site is now navigable end-to-end.

### Pages built or upgraded

| File | Status | Description |
|---|---|---|
| `src/pages/index.astro` | Built (was placeholder) | Three-frame homepage: editorial cover + atlas map + featured plates |
| `src/pages/about.astro` | Built (was placeholder) | Architecture disclosure: four sections, colophon voice, check-copy clean |
| `src/pages/ask.astro` | Built (was placeholder) | Master Chef dedicated chat page; ExpertChatPanel with regionId="master" |
| `src/pages/colophon.astro` | Built (was placeholder) | Photo credits, content sources, typography, design system note |

### Homepage composition (Hybrid — LOCKED in M4)

Three scroll-frames, each ~100vh on desktop:

1. **Frame 1 — Editorial cover:** Full-bleed Ragù Napoletano hero image (plain `<img>`, no duotone), dark bottom gradient overlay, wordmark in display-serif (`var(--cream)`), issue line `No. I · MMXXVI · Spring` in caps-sans opacity 0.8, animated scroll arrow.
2. **Frame 2 — Atlas map:** `MapSVG` centered with 5 region mini-cards below, each linking to `/regions/{slug}` and showing `expertVoice` name + `voiceQuote` sourced from region YAMLs. Headline: "Five Kitchens, Five Voices."
3. **Frame 3 — Featured plates:** 3 recipe cards (Ragù Napoletano, Dashi, Chopped Cheese), full-color `<img>` thumbnails, region cap label, serif title, link to recipe page. "View all plates" link to `/recipes/`.

### MasterChefModal upgrade

`MasterChefModal.tsx` upgraded from M0.5 placeholder text to render `ExpertChatPanel` with `regionId="master"`. The modal body now holds the full chat panel. Header/close/backdrop-click/Escape behavior preserved. Max-height extended to 72vh to give the chat room.

### ExpertChatPanel carousel-hiding fix (M4)

`ExpertChatPanel.tsx` — line `const showCarousel = !regionId;` changed to:
```
const showCarousel = !regionId || isMasterMode;
```
where `isMasterMode = regionId === 'master'`. Master mode keeps the carousel visible so users can switch regions from within the Master Chef context. Three related `if (regionId)` guards updated to `if (regionId && !isMasterMode)`.

### FloatingChefPill verify

`FloatingChefPill.astro` — self-hides on `/ask` path logic confirmed correct (pathname check for `/ask` and `/ask/`). Pill visible on all other pages.

### Page count at M4

17 pages total (unchanged from M3 — support pages were counted as placeholders).

## Post-M4 audit fixes (2026-04-20)

A set of pre-launch quality and infrastructure fixes applied after M4 was complete and before M5 backend work begins. No new milestone; tracked as a named audit pass.

### Persistent SiteFooter

**Problem:** Every page was a navigation dead end — no persistent nav anywhere on the site. Users landing on a recipe or region page via search had no way to reach other pages except the browser back button.

**Fix:** `src/components/SiteFooter.astro` created and mounted in `BaseLayout.astro`. Three-column nav grid (Kitchens — 5 region links; Browse — Homepage / All kitchens / All plates / Master Chef; The Publication — About / Colophon) plus wordmark and issue line below a `RuleLine`. Renders on every page.

**Note:** `SiteHeader.astro` (sticky top nav with logo + desktop nav + mobile hamburger) is the correct v1.1 investment and remains deferred. See "Deferred (post-v1.1)" section below.

### Recipe ↔ Region interlinking

**Problem:** Recipe pages had no link back to their home region. Region pages had no visible recipe listings.

**Fix — recipes → regions:** `src/pages/recipes/[slug].astro` hero section adds a caps-sans back-link above `<h1>`: `« From the {regionLabel} kitchen` linking to `/regions/{recipe.data.region}`.

**Fix — regions → recipes:** `src/pages/regions/[slug].astro` `getStaticPaths()` now fetches the recipes collection and passes matching recipes as a prop. A "PLATES FROM THIS KITCHEN" section renders a `plate-card` grid (thumbnail + plate Roman numeral + title + time/difficulty) filtered by region slug and sorted by `plateNumber`. Section only renders when `recipes.length > 0`.

### MasterChefModal hydration: `client:load` → `client:idle`

`BaseLayout.astro` line: `<MasterChefModal client:idle />`. Changed from `client:load`. The modal is invisible until the user clicks the floating pill; React hydration is deferred until the browser's idle period. No UX cost; eliminates unnecessary JavaScript on the critical render path of every page.

### Custom 404 page

`src/pages/404.astro` added. Opens: "You have wandered past the edge of the atlas." Caps-sans "404 · OFF THE MAP" marker, display-serif title, serif lede, `RuleLine` "TRY ONE OF THESE", 5 navigation links. `BaseLayout` with `region="neutral"`. Astro builds it to `dist/404.html`; nginx Dockerfile serves it via `error_page 404 /404.html`.

### Dockerfile

`Dockerfile` added at project root. Two-stage build:

1. **Stage 1 (`build`):** `node:22-alpine`; `npm ci`; `npm run build`. `ARG PUBLIC_CUISINE_API_URL` and `ARG PUBLIC_SITE_URL` injectable at `docker build --build-arg` time; default to production URLs.
2. **Stage 2 (`serve`):** `nginx:alpine`; listens on port 8080 (Cloud Run requirement, patched via `sed` from default 80); copies `dist/` to nginx html root; custom 404 routing via `error_page 404 /404.html` directive.

### `public/robots.txt`

`public/robots.txt` added:
- `Allow: /` for all crawlers
- `Disallow: /styleguide` (belt-and-suspenders alongside the page's `noindex` meta tag)
- `Sitemap: https://cuisine.verbalogix.com/sitemap.xml` (forward-looking hint; sitemap generation via `@astrojs/sitemap` deferred to v1.1)

### Chat a11y

`src/components/chat/ExpertChatPanel.tsx` — two ARIA labels added:
- `<textarea aria-label={`Message ${selectedRegion.primaryVoice}`}>` — contextual label identifying which expert voice the user is addressing
- Send `<button aria-label="Send message">` — accessible label for the icon-only send button

---

## Deferred (post-v1.1)

Items scoped but explicitly deferred past v1 launch. Source: `docs/POST-V1-ROADMAP.md` and DECISIONS entries above.

| Item | Reason deferred |
|---|---|
| `SiteHeader.astro` — sticky top nav | Low priority at 18 pages; footer nav solves the dead-end problem for v1 |
| `RecipeCard.astro` abstraction | Recipe cards inlined in pages; abstraction adds no value at 5-recipe scale |
| `ArticleLayout.astro` | Recipe pages use `BaseLayout` directly; no editorial layout differences require a separate wrapper |
| `@astrojs/sitemap` — `sitemap.xml` | `robots.txt` Sitemap hint is pre-wired; add the integration when v1.1 content grows |
| JSON-LD structured data | SEO enhancement; out of v1 scope |
| OG image (per-page) | Static placeholder meta exists; custom per-page OG images deferred |
| `DottedPath` production wiring | Animated path between hero and map works in styleguide; not yet wired to recipe/region pages in production |
| Chat error retry UI | `ExpertChatPanel.tsx` shows an error state; retry-on-failure UX not implemented |
| Additional regions (4 dossiers) | Barcelona/Catalan, Copenhagen, Southeast Brazil, Tuscan — dossiers authored; conversion to KG JSON + frontend YAML + palette + MapSVG pins deferred |

---

## Known constraints

- **Termux ext4 only.** Work in `~/regional-table/`. The sdcard path at `/storage/emulated/0/...` is FUSE and breaks `node_modules`. See `CLAUDE.md`.
- **No API proxy.** Backend calls go browser → `cuisine-api.verbalogix.com` directly. This means CORS must be correctly configured on the backend (M5).
- **Static output only.** `output: 'static'` is the pick for v1. The chat island is the only dynamic element; it runs entirely in the browser. No SSR, no edge functions.

## Related docs

- [`DECISIONS.md`](DECISIONS.md) — why each key choice was made
- [`POSITIONING.md`](POSITIONING.md) — copy voice rules
- [`DEPLOY.md`](DEPLOY.md) — Cloud Run deploy procedure
- [`../CLAUDE.md`](../CLAUDE.md) — agent conventions
- [`../CHANGELOG.md`](../CHANGELOG.md) — session narrative
