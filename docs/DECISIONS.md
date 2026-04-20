# Decisions — The Regional Table

Log of load-bearing technical and design choices. Each entry: what, why, what was rejected. Newest on top within each milestone group.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the resulting structure, and [`../CLAUDE.md`](../CLAUDE.md) for agent-facing rules that flow from these decisions.

---

## v1 completion — contract fix (2026-04-21)

---

### Frontend-backend API contract mismatch resolved in api.ts — translation layer, not shape change

- **Picked:** `src/lib/api.ts` accepts the frontend's speculative request shape (`{region_id, messages[]}`) unchanged, but internally translates to the backend's actual contract (`{region, message}` singular) and maps the response field (`data.response` → `content`). Also adds a separate `try/catch` around the `fetch()` call to distinguish network errors (server unreachable) from HTTP 4xx/5xx (server reached, bad request or error).
- **Why:** The original shape in `api.ts` was authored in M1 without testing against a live backend. Build typechecks pass because both sides validate against their own interfaces. The mismatch only surfaces at runtime. Translating in the client layer lets us fix the bug with zero changes to the chat component (`ExpertChatPanel.tsx`) — the ported component keeps its conversation-history model; the backend stays stateless. Future: if the backend adopts a conversation-history model, only `api.ts` changes.
- **Trade-off:** We send only the LATEST user message to the backend, not the full conversation history. For the current single-turn expert-answer model, that's fine — the regional persona + KG answer is independent of prior turns. If we later want cross-turn coherence (e.g., "what about the version you mentioned yesterday?"), we'd need either backend history support or a client-side concatenation trick.
- **Rejected:** (a) Changing `ExpertChatPanel.tsx` to POST the backend's shape directly — coupled the display component to backend serialization; (b) changing the backend to accept `{region_id, messages[]}` — expensive refactor for no product benefit.
- **Lesson for future expert-persona products:** contract-test the frontend↔backend boundary BEFORE declaring v1 complete. Integration bugs at this layer are invisible to build-time typechecks; both sides typecheck against their own (wrong) interface. A single successful `curl -X POST` against the real endpoint before declaring ship catches this in seconds.

---

## Post-M4 audit fixes (2026-04-20)

---

### Persistent SiteFooter replaces deferred SiteHeader

**Picked:** `SiteFooter.astro` added to `src/components/` and mounted in `BaseLayout.astro` on every page. Three-column nav (Kitchens / Browse / The Publication) plus wordmark and issue line. A full `SiteHeader` (sticky top nav with logo, desktop links, mobile hamburger) remains deferred to v1.1 per `docs/POST-V1-ROADMAP.md`.

**Why:** The pre-launch audit identified the site as having no persistent navigation — every page was a dead end with no escape route except the browser back button. A footer-only nav solves this entirely without the build-time investment of a fully responsive sticky header. All five region pages, all five recipe pages, and all support pages now have a navigation surface reachable at the bottom of any scroll.

**Trade-off:** Footer nav requires scrolling to the bottom; no persistent navigation affordance at the top of the page. Acceptable for v1 given the short page count (18 pages). The SiteHeader is the correct v1.1 investment when the content catalog grows.

**Rejected:** Building a full SiteHeader for v1 (would block M5/M6; overengineered for 18 pages).

---

### Recipe ↔ Region interlinking added

**Picked:** Two cross-links added. (1) Recipe pages carry a caps-sans "« From the {region} kitchen" back-link above the `<h1>` title, linking to `/regions/{regionSlug}`. (2) Region pages render a "PLATES FROM THIS KITCHEN" section (a grid of `plate-card` links) filtered from the recipes collection by region slug, sorted by `plateNumber`.

**Why:** Baseline editorial navigation for a multi-page publication. A reader who lands on a recipe via search or direct link had no path to the kitchen it came from; a reader on a region page had no visible path to that region's recipes beyond the floating pill. Both gaps were caught in the pre-launch audit.

**Trade-off:** The region page grid uses raw `<img>` thumbnails (full-color) — the same images used as hero photos. No thumbnail-specific crop or resize. Acceptable at 5-recipe scale.

**Rejected:** Only a region sidebar link on recipes (too subtle; misses the region → recipe direction); linking from regions index instead of region landing page (one navigation hop removed is better).

---

### MasterChefModal hydration: `client:load` → `client:idle`

**Picked:** `MasterChefModal` hydration directive in `BaseLayout.astro` changed from `client:load` to `client:idle`. The modal is invisible until the floating pill is clicked; deferring its React bootstrap to browser idle time has zero UX cost.

**Why:** `client:load` causes React to hydrate the modal React tree synchronously during page load — on every page, every visit, regardless of whether the user ever clicks the pill. This is unnecessary JavaScript cost on the critical path. `client:idle` defers until `requestIdleCallback`, after the page is interactive. No user perceives the difference because the modal requires a deliberate click action to open.

**Trade-off:** In theory, if a user clicks the pill in the first ~200ms of page load before idle fires, there could be a brief delay. In practice this is not measurable. The Astro docs confirm `client:idle` is the recommended directive for non-critical UI elements.

**Rejected:** `client:visible` (fires when the component scrolls into view — the modal is off-screen at `position: fixed`, so visibility semantics are ambiguous); keeping `client:load` (unnecessary cost on every page load).

---

### Custom `404.astro` in editorial voice

**Picked:** `src/pages/404.astro` added. Opens with "You have wandered past the edge of the atlas." Caps-sans "404 · OFF THE MAP" label, display-serif title, serif lede explaining the situation in publication voice. `RuleLine` with label "TRY ONE OF THESE" above 5 suggested destination links. Styled consistently with the rest of the site; uses `region="neutral"` so it works at any path.

**Why:** nginx-alpine would have served the default nginx HTML error page (plain unstyled text) for 404s, which would have shattered the publication aesthetic for any user who follows a broken link or types an invalid URL. The Astro convention for custom 404 is a file at `src/pages/404.astro`; Astro builds it to `dist/404.html` automatically. The nginx Dockerfile is configured to serve `404.html` via the `error_page 404` directive.

**Trade-off:** The Dockerfile's `sed` for the `error_page` directive is fragile (string-match on the default nginx config). Works reliably on `nginx:alpine` at the version pinned in the Dockerfile; worth revisiting if the base image changes.

**Rejected:** Relying on nginx's default 404 page (breaks publication aesthetic); a JavaScript redirect to `/` on 404 (loses the "you went somewhere wrong" signal; hides broken links).

---

### `robots.txt` disallows `/styleguide`

**Picked:** `public/robots.txt` added with `Disallow: /styleguide` for all crawlers and a `Sitemap:` hint to `https://cuisine.verbalogix.com/sitemap.xml` (sitemap deferred to v1.1 when `@astrojs/sitemap` is added). The `/styleguide` page already carries `<meta name="robots" content="noindex">`.

**Why:** `noindex` is a page-level signal; `robots.txt` is the primary crawler access-control layer. Both are needed for belt-and-suspenders exclusion of the dev-only styleguide from search indices. The sitemap URL hint in `robots.txt` is forward-looking: it has no effect until `sitemap.xml` exists, but configuring it now means crawlers will pick it up automatically once the sitemap is generated in v1.1.

**Trade-off:** `robots.txt` is advisory (well-behaved crawlers only). Not a security boundary. The styleguide contains no sensitive data, so advisory exclusion is sufficient.

**Rejected:** `noindex` alone (incomplete; robots.txt is the correct first-signal for crawlers); blocking styleguide at the nginx layer (adds deploy complexity; not necessary for a non-sensitive dev page).

---

### Chat a11y: `aria-label` on textarea and send button

**Picked:** `ExpertChatPanel.tsx` — two attributes added. (1) `aria-label` on the message `<textarea>` set to `` `Message ${selectedRegion.primaryVoice}` `` (e.g. "Message Neapolitan Nonna"). (2) `aria-label="Send message"` on the send `<button>`.

**Why:** The textarea and send button had no accessible labels — screen readers would announce them as unlabelled interactive elements. Both are the primary interaction surface of the chat panel. `aria-label` on the textarea provides contextual specificity (which expert voice the user is messaging) that a generic placeholder text cannot supply. Send button icon-only buttons require explicit labels.

**Trade-off:** None meaningful. Pure additive a11y improvement with no visual impact.

**Rejected:** `<label>` element for the textarea (would require visual design adjustment to hide-visually; `aria-label` achieves the same accessibility goal with no layout impact).

---

## M4 — Hub pages (2026-04-20)

---

### Hybrid composition (cover + atlas map + featured plates) over literal-atlas-spread homepage

**Picked:** Homepage is three scroll-frames: (1) editorial cover (full-bleed food photography, wordmark, issue line, scroll arrow), (2) atlas map section ("Five Kitchens, Five Voices" headline, `MapSVG` + 5 region mini-cards), (3) featured plates grid (3 recipe cards, view-all link).

**Why:** A single diagrammatic atlas map as the homepage hero (the "literal atlas spread" option) was too cold an entry point for a first-time visitor. The cover frame primes emotionally — it establishes the publication register before the map reveals the architecture. The three-frame sequence mirrors how a physical cookbook opens: cover → contents page → first feature spread. The atlas diagram lands harder when the user has already felt what the site is about.

**Trade-off:** Three frames means more scroll before reaching the atlas map — the site's most distinctive visual element. Mitigated by the scroll arrow on Frame 1, which signals there is more below.

**Rejected:** Literal atlas map as homepage hero (too diagrammatic, insufficient emotional hook for cold traffic); single-scroll flat layout with all three sections as equal-height segments (loses the pacing / cover-story rhythm).

---

### Master Chef via both `/ask` page AND floating pill

**Picked:** Two entry channels for Master Chef. `/ask` is a dedicated full-page surface with the region carousel visible; the floating pill is site-wide (hidden on `/ask` to avoid redundancy) and opens the Master Chef as a modal overlay.

**Why:** Two distinct user intents. A user starting from the Master Chef (cross-regional curiosity, exploration mode) benefits from the dedicated `/ask` page and the carousel. A user deep in a recipe page who wants a cross-regional question benefits from the pill — they don't want to navigate away. Hiding the pill on `/ask` eliminates the only redundancy.

**Trade-off:** Two surfaces means two places to maintain the `regionId="master"` initialization. Mitigated by both mounting the same `ExpertChatPanel` component.

**Rejected:** `/ask` page only (no site-wide shortcut; forces navigation break mid-recipe); floating pill only (loses the dedicated exploration surface for "start with the Master Chef" intent).

---

### `regionId="master"` shows region carousel in ExpertChatPanel

**Picked:** `ExpertChatPanel.tsx` carousel-hiding logic updated. Original: `const showCarousel = !regionId`. Updated: `const showCarousel = !regionId || isMasterMode` where `isMasterMode = regionId === 'master'`. Three related guards updated from `if (regionId)` to `if (regionId && !isMasterMode)`.

**Why:** The Master Chef is the cross-regional coordinator — the explicit use case is asking questions that range across all five kitchens. Hiding the carousel in Master Chef mode (as the original `!regionId` logic did) removed the user's ability to narrow into a specific kitchen mid-conversation. The carousel is the correct UX affordance for Master Chef mode; it's an implicit region page where the region is not yet chosen.

**Trade-off:** The carousel in Master Chef mode shows all 5 regions as equal options, whereas on a region page the carousel is hidden because the region is implicit. The Master Chef "neutral" theme means the carousel renders in the neutral palette rather than a regional color — visually appropriate.

**Rejected:** Keeping original `showCarousel = !regionId` (hides carousel in Master Chef mode, defeating the cross-regional navigation purpose).

---

### Chat emojis removed

**Picked:** REGION_ICONS object removed from `ExpertChatPanel.tsx`. Region carousel and metadata banners use text labels only. The ⚡ and ⚠ icons in the integrity-line and metadata banners removed.

**Why:** Per `CLAUDE.md` convention: "no emojis unless explicitly requested." The emoji icons had been carried over from the original Cuisine-Expert frontend. They are inconsistent with the atlas/cartographic visual language of the Regional Table, which uses typographic weight (caps, spacing, rule-lines) rather than iconographic embellishment to signal structure.

**Trade-off:** Icon-free labels require the text to carry all of the semantic weight. For brief labels like "INTEGRITY LINE" and "SUGGESTION" this is correct — the typography convention already does this throughout the site.

**Rejected:** Keeping emoji icons (inconsistent with the atlas design system; violates CLAUDE.md convention).

---

### Real Wikimedia world map over hand-authored simplified continents

**Picked:** `MapSVG.astro` uses real country-path data extracted from Wikimedia's "World_map_-_low_resolution.svg" (CC0), 339 country paths, ~75KB inline SVG. Projection verified as equirectangular (content fills a 950×620 canvas; not 2:1 ratio but projection is pure equirectangular within that canvas). Rendered via `transform="scale(0.842105, 0.645161)"` to fit the 800×400 viewBox. `vector-effect="non-scaling-stroke"` keeps stroke-width constant in screen-space after the non-uniform scale.

**Why:** The alternative was a hand-authored set of simplified continent outlines (5-6 polygons per continent, ~200 vertices total). Hand-authored continents are fast to write but produce recognizably wrong shapes at any zoom — which damages the "this is a real atlas" visual register. The Wikimedia source, despite the non-2:1 canvas, maps via a clean linear scale to our equirectangular pin-coordinate system. Pin coordinates computed from real lat/lon land in the correct country on the scaled map.

**Trade-off:** 75KB of inline SVG in every page that uses `MapSVG`. Gzip compresses path data well (~15-20KB); acceptable for a static site. Rendering 339 paths in the browser is GPU-bound, not CPU-bound — not a meaningful performance cost on modern hardware.

**Rejected:** Hand-authored simplified continents (wrong shapes damage the atlas register); external SVG via `<img>` or `<object>` (loses CSS styling, activePin prop, and hover interactivity on pins); raster map image (not scalable; cannot overlay SVG pins and graticule).

---

## M3 — Recipe multiplication (2026-04-20)

---

### Three-recipe parallel draft with Opus voice-polish pass

**Picked:** Sonnet drafted Quenelle de Brochet, Chicken and Andouille Gumbo, and Chopped Cheese in a single session, using the M2 voice bible (Ragù ↔ Dashi axis) as the guiding spectrum. Opus reviewed all three and required no polish pass — voice was clean on first draft.

**Why:** Pattern established in `docs/INTERACTIVE-PLANNING-PATTERN.md`: Sonnet for high-volume structured drafting; Opus for quality gate. All three recipes had sufficient reference material (ingredient lists, cultural provenance, integrity-line candidates) from the backend knowledge graphs to draft without additional research. The Ragù + Dashi axis from M2 provided enough poles to triangulate Gumbo (near Ragù), Quenelle (midpoint), and Chopped Cheese (below Dashi) without ambiguity.

**Trade-off:** Parallel drafting means a single review pass catches all three; no iterative feedback loop per recipe. Acceptable because the template was verified in M2 and the voice spectrum was already confirmed.

**Rejected:** One recipe at a time with Opus review per recipe (3x the coordination overhead; the template is known-good so parallel is lower risk, not higher).

---

### Recipe index thumbnails are full-color (not duotoned)

**Picked:** `src/pages/recipes/index.astro` recipe card grid uses plain `<img>` thumbnails at full color. Same decision applied to homepage "This Week's Plates" cards.

**Why:** At thumbnail scale (~280px wide), duotone reduces image recognizability — a duotoned food photograph reads as "muted and faintly wrong" rather than communicating the regional palette. The photo's inherent color temperature does more editorial work than a forced duotone at thumbnail size. The duotone rule ("body/process photos only, not heroes") applies here: index cards are navigational/preview elements, functionally equivalent to heroes.

**Trade-off:** The recipe index and homepage lack the per-region duotone color accent on food images. Mitigated by the region cap-label (e.g. "NAPLES") and accent-colored plate number on each card.

**Rejected:** Duotoned thumbnails in the index (reduces recognizability at small scale; discovered and reverted in the same session where the recipe hero duotone bug was fixed).

---

## M0.5 — Atlas design system (2026-04-20)

---

### Atlas tokens use `[data-region="X"]` not `body[data-region="X"]`

**Picked:** Per-region theme blocks in `src/styles/tokens.css` are keyed with the bare attribute selector `[data-region="neapolitan"]`, not `body[data-region="neapolitan"]`.

**Why:** The bare selector matches any element carrying the attribute — including `<body>` (the normal page-level case) and also nested wrappers (styleguide section demos, content-island wrappers). This means a `<div data-region="lyonnais">` inside a neutral page renders in the Lyon palette without requiring a full page swap. Discovered in M0.75 review: with `body[data-region]` scoping, the styleguide's per-region demo sections all fell back to the neutral palette because the `body` carries `data-region="neutral"` on that page.

**Trade-off:** A bare attribute selector could match unexpected elements if `data-region` is accidentally applied to a non-page element. In practice, `data-region` is a Reserved token in this codebase — it appears only in `BaseLayout.astro` (page-level) and the styleguide (explicit demos). Not a real risk.

**Rejected:** `body[data-region="X"]` scoping (breaks nested styleguide demos; discovered and fixed in M0.75 review).

---

### SVG feComponentTransfer functions must declare `type="table"`

**Picked:** All `feFuncR`, `feFuncG`, `feFuncB` elements in `DuotoneFilters.astro` carry `type="table"` explicitly, alongside `tableValues`.

**Why:** SVG filter functions without a `type` attribute do not default to `table` — they silently fall back to `identity` (pass-through), producing a grayscale image with no toning. This was caught in the M0.75 review session when all five regional duotones rendered as neutral grayscale. The fix was adding `type="table"` to each feFunc element. The SVG spec is non-obvious here: the attribute omission is not a parse error and produces no console warning; the rendered output simply looks wrong.

**Trade-off:** None — the attribute is required and must always be present. Documented here as a footgun for future maintainers.

**Rejected:** Relying on browser defaults for feFunc type (incorrect behavior; silently produces wrong output).

---

### Duotone filter defs extracted to `DuotoneFilters.astro`, mounted once in BaseLayout

**Picked:** All six `<filter id="duotone-{region}">` blocks live in `DuotoneFilters.astro`, a zero-visual SVG (`width="0" height="0" position:absolute`). `RegionalDuotone.astro` references filters by ID (`filter: url(#duotone-{region})`). `DuotoneFilters.astro` is mounted once per page in `BaseLayout.astro`.

**Why:** If `RegionalDuotone.astro` inlined its own `<filter>` definition, each usage on a page would create a duplicate filter ID in the DOM — SVG ID collision produces undefined behavior (browser picks one arbitrarily). Extracting defs to a single mount point is the standard SVG pattern for reusable filter primitives.

**Trade-off:** `BaseLayout.astro` now carries a zero-visual SVG block on every page, including pages with no duotone images. At `width:0; height:0` this has no visual or layout cost. The SVG is parsed by the browser regardless; ~500 bytes of filter markup.

**Rejected:** Inline filter defs in `RegionalDuotone.astro` per usage (duplicate SVG IDs; undefined rendering behavior when used more than once per page).

---

### Hero images are full-color; body/process photos are duotoned

**Picked:** Design system rule: recipe hero images and region hero images are always rendered as plain `<img>` at full color. `RegionalDuotone.astro` is reserved for body/process photography (cultural context shots, in-article photos). This rule is documented as a guard comment at the top of `RegionalDuotone.astro`.

**Why:** Hero images carry the emotional first impression. A duotoned hero reads as tinted and muted — it weakens the food photography's natural appeal and makes the recipe page feel "stylized away" from the food itself. Body photos benefit from duotone because they are secondary images whose purpose is to establish cultural atmosphere, not appetite. The atlas design system's photographic register is: full-color hero for appetite + regional-toned body for atmosphere.

**Trade-off:** Recipe pages have a visual palette shift between the full-color hero and any duotoned body photos. In practice this transition is a feature, not a bug: the hero is the appetizer, the body is the atlas-plate composition.

**Rejected:** Duotoning all recipe and region images including heroes (discovered in M2 review when the Ragù Napoletano hero appeared B&W-with-hue because the early recipe template wrongly wrapped the hero in `RegionalDuotone`; reverted immediately).

---

## M2 — Two golden recipes scaffold (2026-04-20)

---

### Frontmatter for structured data + MDX body for cultural prose

**Picked:** Recipe frontmatter holds all structured data (`ingredients`, `method`, `integrityLines`, `time`, `servings`, `difficulty`, `plateNumber`). The MDX body is reserved exclusively for cultural prose — the narrative preamble that sets regional context, history, and voice before the specimen/method split.

**Why:** Magazine spreads and culinary reference books have always separated the narrative (prose, cultural context, chef's notes) from the specimen/method (structured ingredients + steps). Mixing them in a single MDX body would couple the editorial voice to the structural layout — making it impossible to render the atlas-plate columns without parsing prose mid-document, and impossible to reformat structured data (e.g. build a shopping list, compute nutrition, sort by technique) without parsing narrative text. Keeping them separate allows the template to render the MDX body as a drop-cap prose section and pull ingredients/method from frontmatter as typed, validated arrays fed directly to `SpecimenList` and `MethodList`.

**Trade-off:** Authors must put ingredients and method in frontmatter YAML syntax rather than markdown lists. This is slightly more verbose to write but produces Zod-validated typed arrays at build time — no risk of a method step or ingredient being silently malformed.

**Rejected:** All-in-MDX (prose + custom components for ingredients/method mixed together — requires MDX custom components injected at render, couples layout to content, cannot extract structured data at build time); all-in-frontmatter (no prose narrative, loses the editorial "cultural preamble" that distinguishes this from a recipe card).

---

### `time.total` as string (not integer minutes)

**Picked:** `time.total` (and `time.prep`, `time.cook`) are `z.string()` in the schema — free-form strings like `"3 hours 30 minutes"` or `"45 minutes"`. The recipe page template renders `time.total` verbatim as metadata.

**Why:** Cooking times are inherently imprecise and regionally expressed. A Ragù Napoletano author might write "4 to 5 hours on lowest flame" — a range, not a number. Converting to integer minutes would lose this expressiveness and force authors to pick an arbitrary midpoint. The template renders the string directly in the metadata line; no arithmetic on time values is needed in the current page layout.

**Trade-off:** Cannot sort or filter recipes by time computationally without parsing the string. For v1 scope (5 recipes, no time filter), this is acceptable. If M3+ adds a "quick recipes" filter, `time.totalMinutes` can be added as an additional integer field while keeping the string for display.

**Rejected:** Integer minutes with a display formatter (forces imprecise rounding; breaks "4 to 5 hours" style authoring).

---

## M1 — Region landing pages (2026-04-20)

---

### URL slug vs backend region_id — adapter location

**Picked:** URL slugs use kebab-case (`cajun-creole`, `nyc-street-food`); backend `region_id` fields use snake_case (`cajun_creole`, `nyc_street_food`). Adapter lives in `src/lib/regions.ts`, exported as `toBackendId(slug)` and `toUrlSlug(id)`. All five regions defined in `RegionSlug` and `BackendRegionId` union types.

**Why:** URL slugs with hyphens are the web convention and are aesthetically correct for a publication URL (`/regions/cajun-creole` reads better than `/regions/cajun_creole`). Backend IDs use underscores because Python identifier convention. The adapter is the single source of truth — no ad-hoc `replace(/-/g, '_')` anywhere in the codebase.

**Location:** `src/lib/regions.ts` — also exports `ALL_REGIONS` (display order), `regionCoordinates(slug)` (hardcoded lat/lon for CoordinateStrip).

**Rejected:** Forcing the backend to use hyphens (would require backend changes); using underscores in URLs (non-standard, SEO unfriendly).

---

### Chat port strategy — hardcoded REGIONS config in ExpertChatPanel

**Picked:** The REGIONS config (region themes, colors, greeting, sample questions) is hardcoded directly inside `src/components/chat/ExpertChatPanel.tsx`. It is a verbatim port of `/storage/emulated/0/Download/claude-projects/Cuisine-expert/frontend/src/config/regions.ts`.

**Why:** M1's goal is a working, buildable chat island — not a perfectly architected one. Reading from Astro content collections inside a React island requires either (a) passing all region data as props (verbose at call sites) or (b) a build-time JSON export from the collection (requires extra build infrastructure). The hardcoded config is the simplest correct solution for M1. If M4 needs the config to stay in sync with the YAML files, a refactor is a low-effort extraction.

**Trade-off:** If a region's theme colors are updated in `tokens.css`, the hardcoded inline styles in ExpertChatPanel don't automatically track. This is acceptable for M1 because the REGIONS config in the component is for CSS-in-JS chat bubble theming — not the page-level CSS token swap.

**Rejected:** Passing all region data as props from `[slug].astro` (verbose, error-prone when calling from multiple surfaces); dynamic import of collection at runtime (Astro content collections are build-time only).

---

### Astro 6 content config location — `src/content.config.ts`

**Picked:** Content collection schemas live in `src/content.config.ts` (project root of `src/`), using the Astro 6 `glob()` loader. The legacy `src/content/config.ts` location is not supported in Astro 6.

**Why:** Astro 6 requires the new location and loader-based schema definition. The `glob()` loader with `pattern: '**/*.yaml'` and `base: './src/content/regions'` mirrors the previous behavior of auto-loading YAML files from `src/content/regions/`.

**Trade-off:** The `id` field in our YAML files is now a schema field (not the Astro-generated file ID). Astro 6 with glob assigns the filename (without extension) as the entry ID. Our `data.id` field is still available as schema data and is what pages use for routing.

**Rejected:** Legacy `src/content/config.ts` location (Astro 6 throws `LegacyContentConfigError`); manual data import without the collection system (loses Zod validation at build time).

---

## M0 — Scaffold + SMM baseline (2026-04-20)

---

### Tailwind 4 via `@tailwindcss/vite` — not `astro add tailwind`

**Picked:** Install `tailwindcss@latest` + `@tailwindcss/vite@latest` directly, then register `tailwindcss()` as a Vite plugin in `astro.config.mjs`. CSS entry point uses `@import "tailwindcss";` in `src/styles/global.css`.

**Why:** `npx astro add tailwind` installs `@astrojs/tailwind`, which is a wrapper around Tailwind CSS 3 — a different major version with a fundamentally different configuration model. Tailwind 4 removed `tailwind.config.ts`; design tokens live in a `@theme {}` block inside the CSS file itself. Using the Astro integration would lock us to the wrong version and the wrong config model from day one.

**Trade-off:** One fewer Astro-managed integration means we own the Vite plugin setup manually. This is two lines in `astro.config.mjs` — not a meaningful cost.

**Rejected:** `@astrojs/tailwind` (Tailwind 3); hand-rolling PostCSS config.

---

### Astro 5 over Next.js

**Picked:** Astro 5 with `output: 'static'`.

**Why:** The agency site and intake tool already use Next.js; adding a third Next.js project contributes nothing new to the portfolio's stack demonstration. Astro ships dramatically less JavaScript for content-heavy static sites — the only interactive island per page is the chat widget. Content Collections with MDX are first-class in Astro; in Next they are bolted on. Islands architecture is precisely the right model for "static editorial publication with one interactive surface per page."

**Trade-off:** Astro's ecosystem is smaller than Next's; some patterns (e.g., middleware, auth) are less mature. This does not matter for a static publication with no auth requirement.

**Rejected:** Next.js App Router (too much JS to the browser for content-only pages; SEO overhead without meaningful benefit here); plain Vite SPA (no SSG, crawlers see empty HTML, kills the "real editorial publication" story).

---

### Static output over SSR for v1

**Picked:** `output: 'static'` in `astro.config.mjs`. Every page is pre-rendered at build time to HTML.

**Why:** Every page on the site is fully deterministic from the content collections. The only dynamic element — the expert chat island — runs entirely in the browser and calls the backend API directly. There is nothing that requires server-side rendering at request time. Static output means: fastest cold start on Cloud Run (no Node process to spin up), lowest hosting cost (pure file serving via nginx-alpine), full SEO (crawlers see rendered HTML instantly), trivial cache invalidation (redeploy = new HTML files).

**Trade-off:** Adding any server-side-only feature (e.g., personalisation, server-side chat proxy) would require switching to `output: 'server'` and adding a server adapter. For v1 scope, this is not a concern.

**Rejected:** `output: 'server'` with an Astro adapter (unnecessary complexity for v1; revisit if v1.2 meal planner requires server state).

---

### Atlas / cartographic aesthetic direction

**Picked:** Atlas / cartographic visual identity. Coordinate strips, hairline rule-lines, dotted path-draw animations, technique-as-map metaphor, per-region duotone photo treatment, "atlas-plate" recipe layout.

**Why:** The default Astro food blog aesthetic is warm neutrals + large food photography — which is what every editorial food site already does. The Regional Table needs to be visually distinctive to function as a portfolio showcase. The atlas metaphor is conceptually coherent: cooking knowledge is regional, recipes are coordinates in culinary space, techniques are routes. The cartographic identity makes the architecture of the site visible in its visual language — which is precisely the point for a demo of the Specialised Expert Persona Architecture.

**Trade-off:** Cartographic motion and coordinate typography require more careful implementation work than standard food-magazine layouts. This is deferred to M0.5 and M2 respectively; M0 pages are deliberate placeholders.

**Rejected:** Standard food-magazine aesthetic (warm sans + large photography — too generic); brutalist food (wrong for the warmth of regional expert voices); minimal Japanese aesthetic (would favour Washoku at the expense of Mediterranean + Cajun voices).

---

### Serif-dominant typography

**Picked:** DM Serif Display as the headline and editorial voice typeface; DM Sans for navigation, metadata, coordinates, and UI elements.

**Why:** DM Serif Display anchors the site in the editorial-publication tradition — cookbooks, food magazines, regional culinary histories all use serif type for the prose that carries cultural weight. It is the same type system already in use in the Cuisine-Expert frontend, so the visual continuity is immediate when a user moves between the two experiences. The contrast between the warm, slightly condensed serif and the crisp DM Sans for functional text (coordinates, plate numbers, nav) creates the atlas visual logic: the "map labels" (sans) and the "editorial prose" (serif) are visually distinct.

**Trade-off:** Loading both families from Google Fonts adds a network round-trip. Mitigated with `preconnect` and `display=swap`. Performance budget is acceptable for a food editorial site where typography is the primary medium.

**Rejected:** Instrument Serif + Geist (those are agency/intake voices — Regional Table is a distinct product with its own identity and must not read as an agency promotional site).

---

### Per-region theme swap via `data-region` body attribute

**Picked:** The `<body>` element carries a `data-region` attribute set by each page's Astro frontmatter. Default is `"neutral"`. Region pages and recipe pages set it to the appropriate region ID. Tailwind 4 `[data-region="neapolitan"]` selectors in `tokens.css` apply the full per-region palette: `--bg`, `--fg`, `--accent`, `--secondary`, `--duotone-dark`, `--duotone-light`.

**Why:** A CSS custom-property swap on `<body>` is the most performant pattern for multi-theme static sites. It requires no JavaScript, no class toggling, no runtime decision-making. The full page renders in the correct theme colour on first paint — no flash of wrong theme. It also maps cleanly to the Astro + Tailwind 4 combination: Astro sets the attribute server-side (or rather at build time), Tailwind 4's arbitrary-value CSS selectors target it naturally.

**Trade-off:** Adding a new region requires adding a `tokens.css` block. This is a one-time, low-effort addition per region. The region palette values need to be decided in advance (M0.5 work).

**Rejected:** CSS class toggling via JavaScript (adds JS to a JS-free build-time decision); separate CSS files per region (unnecessary file count, no caching benefit for a CDN-served static site); CSS-in-JS theming (wrong tool for Astro).

---

### Duotone photo treatment via CSS filter + SVG `feColorMatrix` fallback

**Picked:** Per-region duotone applied in `RegionalDuotone.astro` using `filter: grayscale(1) sepia(1) hue-rotate(var(--duotone-hue)) saturate(var(--duotone-sat))` as the primary technique, with an SVG `feColorMatrix` filter as a fallback for browsers where the CSS approach doesn't produce accurate enough colour. Region duotone pairs: Naples red+cream, Lyon bordeaux+bone, NOLA brick+ochre, NYC yellow+concrete, Japan sumi+washi.

**Why:** The duotone treatment is load-bearing for the cartographic identity — it makes Unsplash photos feel like they belong to a specific region's palette rather than being generic stock photography. CSS-only approach keeps it zero-JavaScript. SVG fallback gives fine-grained colour matrix control when CSS hue-rotation isn't precise enough for a specific region's target colour.

**Trade-off:** CSS `hue-rotate()` is an approximation; it doesn't hit arbitrary target colours precisely. For the Regional Table's palette (warm, high-saturation regional colours), it is close enough. The SVG fallback covers edge cases.

**Rejected:** Pure SVG filters on every image (SVG filter performance degrades on mobile with many images on a single page); JavaScript canvas manipulation (breaks static rendering, adds runtime cost).

---

### Two golden recipes in parallel (Ragù Napoletano + Dashi)

**Picked:** Author Ragù Napoletano (Neapolitan) and Dashi (Washoku) simultaneously as the "golden" template recipes in M2, before multiplying to 5 in M3.

**Why:** The two recipes are at opposite ends of the design stress-test spectrum. Ragù exercises Mediterranean maximalism: long cultural preamble, dense integrity lines ("no cream, no carrot, meat cooks whole"), multiple body photos, complex ingredient list. Dashi exercises Japanese minimalism: sparse preamble, two integrity lines, single hero photo, very short ingredient list. If the atlas-plate layout and the editorial tone work for both, the template is confirmed to be flexible enough for the full range of regional cuisines. Building just one (the easy case) would hide layout failures that only emerge with sparse content.

**Trade-off:** Two recipes requires twice the authoring effort in M2. The payoff is that M3 multiplication runs on a verified template rather than discovering layout failures mid-multiplication.

**Rejected:** Single golden recipe (Ragù only) then multiply — deferred the stress-test until it was expensive to fix.

---

### 5-recipe launch threshold

**Picked:** Ship when 5 recipes are live (one per region), not 15-25.

**Why:** The original plan targeted 15-25 recipes for launch. That is too much content to get right before any real traffic validates the template. Five recipes — one per region — proves the atlas-plate layout works across all regional aesthetics, gives each region landing page a featured recipe, and lets the site go live quickly so that post-launch iteration is on real feedback rather than speculative completeness. The architecture scales to 25+ recipes trivially; the bottleneck is always content quality, not infrastructure.

**Trade-off:** A 5-recipe launch feels thin compared to a mature food magazine. The About page's "architecture disclosure" copy reframes this explicitly: this is a working demo of a persona architecture, and the recipe content will grow post-launch.

**Rejected:** Launch at 15-25 recipes (too much pre-launch content work risks voice drift and template drift before any user has seen the site).

---

### Master Chef via both `/ask` page AND floating gold pill

**Picked:** Two surfaces for the Master Chef persona. (1) `/ask` page: dedicated full-page Master Chef chat with the region carousel visible, allowing cross-region exploration. (2) Floating gold pill: bottom-right, site-wide (hidden on `/ask` to avoid redundancy), opens Master Chef as a modal overlay.

**Why:** The floating pill gives every page on the site a direct path to the Master Chef without navigating away. A user reading a Neapolitan recipe can ask a cross-regional question without losing their place. The `/ask` page serves users who arrive wanting to start with the Master Chef rather than a specific region — the "I'm curious, show me everything" entry point. Two surfaces, two intents, no redundancy because the pill hides on the very page it would duplicate.

**Trade-off:** Two entry points means two places to maintain the chat component initialisation. Mitigated by the fact that both mount the same `ExpertChatPanel` (or `MasterChefModal`) with `regionId="master"`.

**Rejected:** Only `/ask` page (no omnipresent shortcut; forces navigation to reach the Master Chef); only floating pill (loses the dedicated exploration surface for users who want the full region-carousel context).

---
