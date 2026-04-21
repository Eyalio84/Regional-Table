# Changelog — The Regional Table

## Deploy — live at cuisine.verbalogix.com (2026-04-21)

Same session as v1 polish completion. Production deploy to Google Cloud Run alongside `cuisine-expert-api` (backend) and `verbalogix-agency` (sister marketing site).

### What shipped

- **Cloud Run service:** `regional-table`, region `us-central1`, project `verbalogic-intake-interview`, revision `00002-n99` (cosmetic redeploy after backend URL was finalized).
- **Custom domain:** `cuisine.verbalogix.com`, CNAME → `ghs.googlehosted.com` (GoDaddy DNS via API), HTTPS auto-provisioned by Cloud Run.
- **Build pipeline:** existing Dockerfile (multi-stage, `node:22-alpine` build → `nginx:alpine` serve, port 8080). Build arg `PUBLIC_CUISINE_API_URL=https://cuisine-api.verbalogix.com` baked into the static bundle. Verified present in `dist/_astro/ExpertChatPanel.*.js` post-build.
- **Local-build note:** PRoot Ubuntu was stuck on Node 20.20.2 (Astro 6 requires ≥22.12.0), so local sanity `npm run build` was blocked. Cloud Build uses the Dockerfile's internal Node 22, which worked cleanly. Workaround documented in case PRoot node is upgraded later.

### Backend integration

Frontend `PUBLIC_CUISINE_API_URL` originally pointed at the run.app URL pre-DNS (first deploy), then rebuilt against `https://cuisine-api.verbalogix.com` once DNS propagated (second deploy, revision 00002). No code changes between revisions — only the build arg.

### Production smoke tests (independent verification)

- `https://cuisine.verbalogix.com/` → HTTP 200, 110 KB, title `The Regional Table — No. I · MMXXVI`
- `https://cuisine.verbalogix.com/recipes/ragu-napoletano/` → 200 (the golden M2 recipe)
- `https://cuisine.verbalogix.com/ask/` → 200 (Master Chef surface)
- SSL cert valid on cuisine.verbalogix.com (Cloud Run auto-provisioned after DNS resolved)
- Chat island works end-to-end against production cuisine-api

### Open / deferred

- Cross-link regional-table demo card on verbalogix-agency → confirmed live as demo #05
- Budget monitoring (GCP $25/month + Anthropic $25/month) set by Eyal post-session
- Vertical-focus decision for outbound push (see `~/verbalogix-agency/docs/go-to-market.md` §4)

---

## v1 complete — polish + M7 (2026-04-21)

Final verification and polish pass. All deliverables local-only (no backend required).

### Delivered

- **`astro.config.mjs`** — `@astrojs/sitemap` added to integrations array with `filter` excluding `/styleguide`. Generates `dist/sitemap-index.xml` (index) + `dist/sitemap-0.xml` (16 public URLs).

- **`public/robots.txt`** — `Sitemap:` line updated from `sitemap.xml` to `sitemap-index.xml` to match Astro's generated filename.

- **`src/pages/recipes/[slug].astro`** — JSON-LD `Recipe` structured data injected into `<head>` via `slot="head"`. Includes all Google-required fields: `name`, `image`, `author`, `datePublished`, `description`, `recipeIngredient`, `recipeInstructions`, `totalTime`/`prepTime`/`cookTime` (ISO 8601 via `toIso8601Duration()` helper), `recipeYield`, `recipeCategory`, `recipeCuisine`. Region→cuisine map hardcoded (5 regions).

- **`src/layouts/BaseLayout.astro`** — `<slot name="head" />` added inside `<head>` to accept per-page head extras (used by recipe JSON-LD).

- **`src/lib/api.ts`** — Raw `Chat API returned ${status}` error replaced with structured errors. Network/5xx → "The chef isn't at the pass right now. Try again in a moment." · 429 → "You've asked a lot of questions in a short time. The kitchen needs a breath — try again in an hour." · Other 4xx → "Something about that question didn't reach the kitchen. Try rephrasing." Raw status logged to `console.error` only.

- **`src/components/chat/ExpertChatPanel.tsx`** — Error rendering updated: reads `err.userMessage` when present (set by `api.ts`), falls through to `err.message` and a final generic fallback.

- **Frontend↔backend API contract fix in `src/lib/api.ts`** — translates `{region_id, messages[]}` → `{region, message}`; maps `data.response` → `content`; distinguishes network errors from HTTP errors. Chat now works end-to-end against the Cuisine-Expert backend (verified: Nonna responds in voice on ragù question).

- **`src/components/atlas/MapSVG.astro`** — Pin label overlap fix: `labelOffset` field added to each pin (default −14 = above pin). Naples pin offset set to `+20` (label below pin) to prevent overlap with Lyon (only 21 SVG units apart horizontally, ~9.5px at mobile 360px viewport). `dominant-baseline="hanging"` applied when offset is positive.

- **`~/verbalogix-agency/components/demo/DemoShowcase.tsx`** — Demo card #04 updated from "Local business site / coming" placeholder to "The Regional Table / live" with full copy, Astro/FastAPI/Knowledge Graph/Claude Haiku 4.5 tags, and `url: 'https://cuisine.verbalogix.com'`. Left uncommitted for user review.

### Verification

- `npm run build` passes: 18 pages, 0 errors. `dist/sitemap-index.xml` and `dist/sitemap-0.xml` generated (16 URLs, `/styleguide` excluded).
- `./scripts/smoke.sh` — 24 pass, 0 fail.
- `./scripts/check-copy.sh` — clean.
- Curl matrix: / → 200 · /regions/neapolitan → 200 "Ragù" · /recipes/ragu-napoletano → 200 + back-link + JSON-LD · /404-test-path → 404 (custom 404.astro served) · sitemap confirmed in dist/.

---

## Unreleased

(Next milestone entries go here before a named release.)

---

## Pre-launch audit fixes (2026-04-20)

Pre-M5 quality and infrastructure pass. No new milestone number; fixes a set of dead-end navigation, accessibility, deploy, and polish issues caught in a post-M4 audit.

### Delivered

- **`src/components/SiteFooter.astro`** — Persistent site footer. Three-column `<nav>` (Kitchens / Browse / The Publication) with links to all five regions, homepage, recipes index, /ask, /about, /colophon. Wordmark + issue line below. Mounted in `BaseLayout.astro` on every page. Replaces the earlier "each page is a dead end" problem without requiring the full `SiteHeader` investment (deferred to v1.1).

- **`src/layouts/BaseLayout.astro` updated** — (1) Imports and mounts `SiteFooter`. (2) `MasterChefModal` hydration directive changed from `client:load` to `client:idle` — defers React startup cost until browser idle; no UX cost since the modal is invisible until the pill is clicked.

- **Recipe ↔ Region cross-links** — (1) `src/pages/recipes/[slug].astro`: caps-sans "« From the {region} kitchen" back-link added above `<h1>` title, linking to `/regions/{regionSlug}`. (2) `src/pages/regions/[slug].astro`: `getStaticPaths()` now fetches the recipes collection and passes matching recipes as props; a "PLATES FROM THIS KITCHEN" `plate-card` grid renders below the seasonal calendar when `recipes.length > 0`.

- **`src/pages/404.astro`** — Custom 404 page in editorial voice. Opener: "You have wandered past the edge of the atlas." Caps-sans "404 · OFF THE MAP" marker, display-serif title, serif lede, `RuleLine` "TRY ONE OF THESE", 5 suggested destination links. Built to `dist/404.html`; nginx Dockerfile serves it via `error_page 404 /404.html`.

- **`Dockerfile`** — Two-stage nginx-alpine static serve. Stage 1: `node:22-alpine` build with `npm ci` + `npm run build`; `PUBLIC_CUISINE_API_URL` and `PUBLIC_SITE_URL` injectable as `--build-arg`. Stage 2: `nginx:alpine` listening on port 8080 (Cloud Run), custom 404 routing wired.

- **`public/robots.txt`** — `Disallow: /styleguide` (belt-and-suspenders alongside page-level `noindex`); `Sitemap:` hint to `https://cuisine.verbalogix.com/sitemap.xml` for when `@astrojs/sitemap` is added in v1.1.

- **`src/components/chat/ExpertChatPanel.tsx` a11y** — `aria-label` added to message `<textarea>` (`` `Message ${selectedRegion.primaryVoice}` ``) and to send `<button aria-label="Send message">`.

### Verification

- `npm run build` passes: 18 pages (added `404.astro`).
- `./scripts/check-copy.sh` — clean.
- Curl: GET /404 → 200 "You have wandered past the edge of the atlas"; GET /regions/neapolitan → 200 "PLATES FROM THIS KITCHEN".

---

## M4 — Homepage + About + Ask + Colophon + Floating Pill wiring (2026-04-20)

Hub pages built; site now navigable end-to-end. MasterChefModal upgraded from M0.5 placeholder to full chat panel.

### Delivered

- **`src/pages/index.astro`** — Hybrid three-frame homepage. Frame 1: full-bleed editorial cover (Ragù Napoletano hero, dark gradient overlay, wordmark + issue line + scroll arrow). Frame 2: "Five Kitchens, Five Voices" headline, lede, `MapSVG`, 5 region mini-cards with voice quotes pulled from region YAMLs. Frame 3: "This Week's Plates" — 3 recipe cards (Ragù Napoletano, Dashi, Chopped Cheese) with full-color thumbnails and view-all link. Footer hairline with `/about` link.

- **`src/pages/about.astro`** — Architecture disclosure in publication-colophon style. Four sections: What this is / How the voices work / Why editorial, not app / About the architecture. Readable container (680px), serif-heavy. Cites Claude Haiku 4.5 and the persona-bridge layer by name. Verbalogix link. Attribution credit. Passes check-copy.

- **`src/pages/ask.astro`** — Master Chef dedicated chat page. Inline coordinate strip `0.00°N · 0.00°E · MASTER CHEF · Plate —`, display-serif title, serif italic lede. `ExpertChatPanel` hydrated `client:visible` with `regionId="master"` and cross-regional contextSeed. Carousel visible (see ExpertChatPanel fix below). FloatingChefPill hidden on this page (existing logic).

- **`src/pages/colophon.astro`** — Photo credits (all 5 recipe photographers from frontmatter, sourced at build time), content source list (knowledge graph / TheMealDB / Wikipedia & Wikibooks CC BY-SA / Project Gutenberg), typography note (DM Serif Display + DM Sans), design system note with /styleguide link.

- **`src/components/atlas/MasterChefModal.tsx`** — Upgraded from M0.5 placeholder (sample question chips) to render `ExpertChatPanel` with `regionId="master"`. Header, close button, backdrop-click, Escape key all preserved. Max-height extended to 72vh for chat room. Modal body is now a flex panel that lets ExpertChatPanel fill it.

- **`src/components/chat/ExpertChatPanel.tsx`** — `showCarousel` logic changed: `const showCarousel = !regionId || isMasterMode;`. Master mode (`regionId="master"`) keeps the region carousel visible, enabling region switching within the Master Chef context. Three internal guards updated from `if (regionId)` to `if (regionId && !isMasterMode)`.

- **`docs/ARCHITECTURE.md`** — M4 section added: homepage composition, modal upgrade, carousel fix, page count.

### Verification

- `npm run build` passes: 17 pages built in 3.43s.
- `./scripts/smoke.sh --fast` passes: 22/22 checks (astro check + dev server + SMM artifacts).
- `./scripts/check-copy.sh` clean — no banned phrases in any new page copy.
- Curl: GET / → 200 "The Regional Table" · GET /about → 200 "specialized expert persona" · GET /ask → 200 "Ask the Master Chef" · GET /colophon → 200 "Colophon".

---

## M3 — Recipe multiplication to 5-recipe launch set (2026-04-20)

Three new recipes authored, completing one recipe per region and reaching the v1 launch threshold.

### Delivered

- **`src/content/recipes/quenelle-de-brochet.mdx`** — Lyonnais, Plate I. Quenelle de brochet, sauce Nantua. Lyonnais Chef voice: precise, technical, short sentences, French terms dropped naturally. 8 ingredients, 7 method steps (several with tips on panade technique and the doubling-in-size invariant), 4 integrity lines. Preamble ~290 words, 4 paragraphs. Mentions Mère Brazier and the doubling standard. Hits "fond" in the preamble. Dismisses store-bought stock as a professional disgrace. Medium density on the Ragù ↔ Dashi spectrum — denser than Dashi, sparser than Ragù.

- **`src/content/recipes/gumbo.mdx`** — Cajun-Creole, Plate I. Chicken and andouille gumbo. Cajun-Creole Matriarch voice: warm, narrative, code-switching. 12 ingredients, 7 method steps (roux step is the load-bearing step with Leah Chase tip), 5 integrity lines including the filé-in-the-bowl rule and the Cajun/Creole tomato divergence. Preamble ~360 words, 4 paragraphs, "First you make a roux" positioned in closing. Closest in density to Ragù on the voice spectrum.

- **`src/content/recipes/chopped-cheese.mdx`** — NYC Street Food, Plate I. The bodega chopped cheese. NYC Street Food Veteran voice: brash, direct, bodega-vernacular opener. 7 ingredients, 4 method steps. 4 integrity lines (Goya adobo + sazon absolute, American cheese absolute, kaiser roll absolute). Preamble ~220 words, 3 short paragraphs. Credits Hajji's Deli/Blue Sky Deli, Spanish Harlem. Aggressive line about artisanal substitutes. Shortest preamble of the 5 — proves the atlas-plate layout works without padding.

- **`src/components/atlas/RegionalDuotone.astro`** — guard comment added at top of doc block: "DO NOT use for recipe or region hero images — heroes are full-color per the plan's photo treatment decision. Apply duotone only to body/process photos."

- **`docs/CONTENT-WORKFLOW.md` created** — recipe authoring template. Sections: where recipes live, frontmatter contract, voice bible (Ragù ↔ Dashi spectrum), authoring checklist (12 steps), duotone application rule, forbidden phrases pointer.

- **`docs/ARCHITECTURE.md` updated** — M3 section added with complete recipe roster table (5 recipes, voice density notes), build page count (17), and content-multiplication workflow decisions.

### Build verification

- `npm run build` — 17 pages, 0 errors
- `scripts/smoke.sh` — pass
- `scripts/check-copy.sh` — clean
- `curl /recipes/quenelle-de-brochet` → 200, title in body
- `curl /recipes/gumbo` → 200, title in body
- `curl /recipes/chopped-cheese` → 200, title in body

---

## M2 — Two golden recipes scaffold (2026-04-20)

Atlas-plate recipe page template is live. Route, schema, and layout are ready for Opus to author `ragu-napoletano.mdx` and `dashi.mdx`.

### Delivered

- **`src/content.config.ts` extended** — recipes schema gains two new structured-data arrays: `ingredients` (`{ quantity, name, note? }[]`) and `method` (`{ step, tip? }[]`), both defaulting to `[]`. `integrityLines` gains `.default([])` (was required, now safe with empty collection). `plateNumber` type tightened to `z.number().int()`.

- **`src/pages/recipes/[slug].astro`** — Atlas-plate recipe template. 190 lines. `getStaticPaths()` from recipes collection (returns 0 paths on empty collection, build still succeeds). Layout top to bottom: `CoordinateStrip` with region coords + plate number → hero split (serif display title left, `RegionalDuotone` + `PhotoCredit` right; 1:1.1 grid on desktop, stacked on mobile) → `RuleLine` → cultural preamble section (MDX `<Content />`, drop-cap on first paragraph via `::first-letter` in `--accent`) → `RuleLine` "SPECIMEN · METHOD" → `atlas-plate` 1:2 grid (`SpecimenList` from `ingredients` | `MethodList` from `method`) → conditional integrity lines as `LegendCallout` → `ExpertChatPanel` island (`client:visible`, recipe-seeded opener).

- **`src/pages/recipes/index.astro`** — Recipe listing page replaces placeholder. `CoordinateStrip` header ("THE RECIPE INDEX") → 5 region filter chips (link to `/regions/[slug]`) → `RuleLine` → auto-fill recipe card grid (thumbnail duotone + plate Roman numeral + region caps + serif title + time/difficulty metadata). Empty-state message renders when no recipes exist.

- **`docs/ARCHITECTURE.md` updated** — M2 section added: recipes schema delta, atlas-plate layout composition detail (each of the 8 sections), frontmatter-vs-MDX split design rationale, recipe index structure.

- **`docs/DECISIONS.md` updated** — Two new M2 entries: (1) frontmatter for structured data + MDX body for prose (why magazine spreads separate specimens/methods from narrative); (2) `time.total` as string not integer (preserves "4 to 5 hours" range authoring).

### Astro 6 API note

`render()` imported from `astro:content` (not `entry.render()`). Works correctly in this Astro version. `getCollection('recipes')` with empty collection emits a non-fatal warning but returns `[]` cleanly — build succeeds.

### Verified

- `npm run build` — 12 pages, 0 errors (recipes collection empty warning is expected)
- `smoke.sh` — 24/24 pass
- `check-copy.sh` — clean
- `curl http://localhost:4321/recipes/` → HTTP 200, body contains recipe-index + empty-state copy

---

## M1 — Region landing pages (2026-04-20)

All five region landing pages now render from Astro content collections. The expert chat island is live (stub API; full backend deployed in M6).

### Delivered

- **`src/content.config.ts`** — Astro 6 content collection schemas with `glob()` loaders. Two collections: `regions` (YAML, Zod-validated) and `recipes` (MDX, pre-defined for M2). Moved from `src/content/config.ts` to comply with Astro 6 `LegacyContentConfigError`.

- **`src/content/regions/*.yaml`** — 5 structural snapshot files translated faithfully from backend JSONs: `neapolitan.yaml`, `lyonnais.yaml`, `cajun-creole.yaml`, `nyc-street-food.yaml`, `washoku.yaml`. Content fields: id, displayName, cuisineFamily, expertVoice, coordinates, voiceDescription, voiceQuote, shortBlurb, legendaryTechniques (first 5), integrityLines (all), legendaryChefs (all), seasonalCalendar, culturalNote, sacredIngredients. Voice edit pass deferred to Opus coordinator.

- **`src/lib/regions.ts`** — Slug adapter (`RegionSlug` ↔ `BackendRegionId`). `toBackendId()`, `toUrlSlug()`, `ALL_REGIONS`, `regionCoordinates()`. Single source of truth for the kebab-case ↔ snake_case mapping.

- **`src/lib/api.ts`** — Typed stub for Cuisine-Expert backend. `sendChatMessage()`, `ChatRequest`, `ChatResponse`. `PUBLIC_CUISINE_API_URL` env var with localhost:8000 fallback. Client-side only.

- **`src/components/atlas/RegionHero.astro`** — New Atlas primitive. Props: regionSlug, displayName, expertVoice, voiceQuote, coordinates. Renders: CoordinateStrip → wordmark at `--fs-display` in `--accent` → caps-sans expert voice label → italic blockquote with `open-quote`/`close-quote` CSS pseudo-elements in `--accent` → hairline + attribution. `--space-9` padding top/bottom.

- **`src/components/chat/ExpertChatPanel.tsx`** — React island ported from `CuisineChat.tsx` (Cuisine-Expert frontend). Three key changes: (1) `regionId` prop hides carousel and scopes region; (2) `contextSeed` prop renders seeded opener bubble; (3) API calls replaced with `src/lib/api.ts` `sendChatMessage()`. REGIONS config hardcoded inline. Message shapes, rivalry banner, integrity-line banner, "What beginners miss" callout, technique pills, loading dots all preserved.

- **`src/pages/regions/[slug].astro`** — Dynamic route from regions collection. Sets per-region theme via BaseLayout `region` prop. Sections: RegionHero → integrity lines → legendary chefs grid → seasonal calendar → ExpertChatPanel island (`client:visible`).

- **`src/pages/regions/index.astro`** — Five Kitchens index. CoordinateStrip header → MapSVG → 5 region cards in auto-fit grid. Cards link to `/regions/{id}` with hover accent.

- **`src/layouts/BaseLayout.astro`** — Added `region` prop (default `'neutral'`). Sets `<body data-region={region}>` enabling per-region CSS token swap.

### Verified

- `npm run build` — 12 pages, clean, 0 errors
- `smoke.sh` — 24/24 pass
- `check-copy.sh` — clean
- Dev server: `GET /regions/neapolitan` → 200, body contains "Naples (Neapolitan)"; `GET /regions/washoku` → 200, body contains "Japan (Washoku)"

### Known gaps (Opus voice-edit pass)

- `voiceDescription` and `voiceQuote` fields in all 5 YAMLs are mechanical translations from backend JSONs. Not yet voice-edited to publication tone.
- NYC Street Food and Washoku have no legendary chefs in the backend data (empty arrays); the page renders a "tradition lives in the street" fallback.
- Backend integrity line `severity: "strict"` has no equivalent in the schema (`absolute|strong|mild`) — mapped to `strong`. Opus may want to revisit severity grading.

---

## M0.5 — Atlas design system (2026-04-20)

Delivers the full Atlas / cartographic visual identity as 12 composable primitives and a living `/styleguide` reference page. Every later milestone assembles from these components.

### Delivered

- **`src/components/atlas/` directory** — all Atlas primitives namespaced here.

- **`CoordinateStrip.astro`** — top strip rendering `lat°N · lon°E · REGION · Plate N`. Inline script animates coordinates from 0 → actual over 400ms using requestAnimationFrame ease. Respects `prefers-reduced-motion`. Plate number formatted as Roman numerals via a build-time helper. Uses `.coord-label` and `.hairline-strong` classes from tokens.css.

- **`RuleLine.astro`** — horizontal hairline with three weight variants (hair/strong/dotted) and an optional centered label that splits the rule. Uses `.hairline` utility classes from tokens.css.

- **`LegendCallout.astro`** — map-legend styled callout box. Three severity levels: `absolute` → "INTEGRITY LINE", `strong` → "RULE", `mild` → "SUGGESTION". Accent left border, serif rule text, color-mix background tint. Accepts either a `rule` prop or a default `<slot />`.

- **`SpecimenList.astro`** — ingredients as zero-padded numbered specimens (01/02/03). Grid layout (number + content columns), serif name, sans quantity, italic note when provided. Hairline between rows.

- **`MethodList.astro`** — recipe method as Roman-numeral plate steps (i./ii./iii.). Italic serif numerals in `var(--accent)`, lede-size step text, caps-sans tip prefixed with `※`. Hairline between rows.

- **`DottedPath.astro`** — SVG position-absolute path connecting two elements by ID. Client script calculates bounding-rect positions, draws arc or straight path, animates `stroke-dashoffset` → 0 over 800ms. Respects `prefers-reduced-motion`.

- **`RegionalDuotone.astro`** — per-region CSS filter duotone wrapper. Hardcoded hue-rotate/saturate values per region (5 regions + neutral). Mix-blend-mode multiply. SVG feColorMatrix fallback noted as TODO.

- **`MapSVG.astro`** — 800×400 SVG stylized world map. Graticule grid lines, 5 symbolic region pins (circle + caps label), Master Chef gold star, `activePin` prop highlights a region. Pins link to `/regions/[slug]`. Hover: scale(1.3) on circle, color shift to `var(--accent)`.

- **`FloatingChefPill.astro`** — fixed bottom-right gold pill. Dispatches `open-master-chef` CustomEvent on click. Self-hides on `/ask` route via `Astro.url.pathname` check. Accessible `<button>` with aria-label.

- **`MasterChefModal.tsx`** — React shell modal. Listens for `open-master-chef` event + Escape key. Slide-in animation from translateY(100%) → 0. Backdrop (40% black + blur-8px) closes on click. Header wordmark + close button. Body: DM Serif placeholder text + 4 non-interactive sample question chips. Full chat wired in M1.

- **`PhotoCredit.astro`** — inline attribution: "Photograph by [name] on [source]". Caps-sans, configurable left/center/right alignment. Hover accent on photographer link.

- **`Reveal.astro`** — IntersectionObserver slot wrapper. Adds `.reveal` + `.is-visible` at 10% threshold. Uses `window.__rtReveal` flag so the script runs only once per page even with multiple instances. Reduced-motion: immediately marks visible.

- **`src/pages/styleguide.astro`** — 13-section living reference page for all primitives. `noindex` meta. Not linked from any production page. Sections: type scale, rule lines, coordinate strips (neutral + regional), legend callouts (all severities + 2 regions), specimen list, method list, dotted path (arc + straight), per-region duotone grid (5 regions + neutral), palette chip rows for all 5 regions, atlas map, floating pill/modal usage note, photo credit (3 alignments), 3 reveal blocks.

- **`BaseLayout.astro` updated** — imports and mounts `FloatingChefPill` (Astro) and `MasterChefModal` (`client:load`) before `</body>` on every page.

- **`docs/ARCHITECTURE.md` updated** — "Atlas design system (M0.5)" section filled in; component map table updated with correct `src/components/atlas/` paths and Done status.

### Verification

- `npm run build` passes: 7 pages, zero errors.
- `./scripts/smoke.sh --fast` passes: 22/22 checks.
- `./scripts/check-copy.sh` clean.
- `curl http://localhost:4321/styleguide` → HTTP 200, body contains "Atlas Design System".

---

## M0 — Scaffold + SMM baseline (2026-04-20)

First committed state of the project. Establishes the Astro foundation and the full SMM documentation set.

### Delivered

- **Astro 5 scaffold** in `~/regional-table/` (Termux internal ext4, NOT sdcard).
  - Base `npm create astro@latest` minimal template.
  - `@astrojs/react` integration installed (React islands for chat components).
  - `@astrojs/mdx` integration installed (recipe files in M2).
  - Tailwind CSS 4 via `@tailwindcss/vite` Vite plugin (NOT the legacy `@astrojs/tailwind` integration).
  - `astro.config.mjs`: `output: 'static'`, `site: 'https://cuisine.verbalogix.com'`, Vite Tailwind plugin, react + mdx integrations.

- **CSS foundations**
  - `src/styles/global.css`: `@import "tailwindcss";` + empty `@theme` block (placeholder for M0.5 Atlas tokens).
  - `src/styles/tokens.css`: Atlas design tokens placeholder (populated in M0.5).

- **BaseLayout**
  - `src/layouts/BaseLayout.astro`: HTML shell, Google Fonts (`<link>` preconnect + stylesheet for DM Serif Display + DM Sans), SEO meta (title, description, canonical, OG), `data-region="neutral"` on `<body>`, `<noscript>` fallback, CSS imports.

- **Empty pages** (each mounts BaseLayout, contains `<h1>` placeholder):
  - `src/pages/index.astro`
  - `src/pages/about.astro`
  - `src/pages/ask.astro`
  - `src/pages/colophon.astro`
  - `src/pages/regions/index.astro`
  - `src/pages/recipes/index.astro`

- **SMM artifacts** (all substantive, no stubs):
  - `CLAUDE.md` — project conventions, DO/DON'T, dev commands, data file locations, design system note, platform note, component map placeholder.
  - `START-HERE.md` — cold-start orientation, read-order, current status snapshot, sister projects.
  - `docs/ARCHITECTURE.md` — overview, tech stack table, full directory tree, component map (TBD rows for M0.5+), data flow (build-time + runtime + floating pill), backend integration, port map, Atlas design system placeholder section.
  - `docs/DECISIONS.md` — 10 entries: Astro over Next.js, static output over SSR, Atlas aesthetic, serif-dominant typography, per-region theme via `data-region`, duotone via CSS filter + SVG fallback, two golden recipes in parallel, 5-recipe launch threshold, Master Chef via `/ask` + floating pill, Tailwind 4 via `@tailwindcss/vite`.
  - `docs/POSITIONING.md` — central principle, voice description, two sample sentences that PASS and FAIL, forbidden phrases list (14 phrases), rationale per phrase, recovery procedure, examples of always-acceptable copy.
  - `docs/DEPLOY.md` — full 9-phase deploy procedure: PRoot setup, source copy, Astro build, Secret Manager, `gcloud run deploy` commands for both services (with placeholder `$PROJECT_ID` logic and real project name), nginx-alpine Dockerfile note, GoDaddy DNS, budget alerts + Anthropic cap, post-deploy smoke checklist, re-deploy and rollback commands.
  - `CHANGELOG.md` — this file, starting with M0.
  - `scripts/smoke.sh` — executable: checks 9 SMM artifacts exist, `astro check` typecheck, dev server boots + responds, optional `npm run build` via `--fast` flag.
  - `scripts/check-copy.sh` — executable: greps pages, content, and docs for 14 forbidden phrases; exits 1 on any hit; prints file:line; whitelists POSITIONING.md and DECISIONS.md (where phrases are discussed, not used as copy).

### Verification

- `npm run build` passes: 6 pages built in ~3s.
- `scripts/smoke.sh` passes.
- `scripts/check-copy.sh` passes (zero hits).
