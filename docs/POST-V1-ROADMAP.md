# Post-v1 Roadmap

Work that is scoped but deferred past v1 launch. Update in-session when new roadmap items are decided.

---

## Additional regions — 4 dossiers authored, JSON conversion pending

Research dossiers exist as markdown. Each is substantial (26-40 KB of structured expert knowledge — executive overview, territorial mapping, iconic dishes with provenance, dialect, integrity lines, seasonal calendars, legendary chefs, sacred ingredients). They were authored by Eyal ahead of v1 scope expansion.

| Region | Expert Voice (working) | Dossier |
|---|---|---|
| **Barcelona / Catalan** | Catalan Chef | `/storage/emulated/0/Download/claude-projects/Cuisine-expert/Cuisines/spain/Barcelona & Catalan Cuisine Expert Deep Dive.md` |
| **Copenhagen** | New Nordic Chef | `/storage/emulated/0/Download/claude-projects/Cuisine-expert/Cuisines/Denmark/Copenhagen Cuisine A Deep Expert Dossier.md` |
| **Southeast Brazil** | Paulista / Mineira Cook | `/storage/emulated/0/Download/claude-projects/Cuisine-expert/Cuisines/Brazil/Southeast Brazil Cuisine A Deep Expert Guide.md` |
| **Tuscan** | Fiorentino / Contadino Chef | `/storage/emulated/0/Download/claude-projects/Cuisine-expert/Cuisines/Italian/regions/Tuscan Cuisine The Complete Expert Dossier.md` |

### Why deferred (not a shortcoming of the research)

- v1 homepage (M4), MapSVG pin set, and agency-card copy all encode "five regional cuisine experts." Adding four more regions = revise `MapSVG.astro` coordinates + homepage grid + agency-card text. Out of v1 scope.
- Each region requires: backend JSON conversion (KG-shaped, dense), frontend YAML snapshot in `src/content/regions/`, palette + duotone pair decision in `src/styles/tokens.css`, pin coordinates in `MapSVG.astro`, at minimum one recipe in `src/content/recipes/` to preserve the "one recipe per region at launch" rule. Estimate: 2-3 hours per region, so 8-12 hours total.
- The architecture absorbs new regions without rebuilding — this is explicitly v1.1 / content-only work (see original `IMPLEMENTATION-PLAN.md` §15 option 3). No infrastructure blocks it.

### Conversion path (when v1.1 begins)

For each region:

1. **Backend JSON** — translate the markdown dossier into the Cuisine-Expert KG schema (mirror an existing `Cuisines/*/regions/*.json` — `neapolitan.json` is the richest reference). Fields: `id`, `display_name`, `cuisine_family`, `voice_description`, `dialect`, `legendary_techniques[]`, `learning_path`, `rivalries`, `sacred_ingredients[]`, `cultural_identity`, `seasonal_calendar`, `legendary_chefs[]`, `integrity_lines[]`, `mood_source`. The KG is schema-validated by the backend loader.
2. **Frontend YAML snapshot** — `src/content/regions/{slug}.yaml` derived from the backend JSON, matching `content.config.ts` schema shape. Voice-edit pass for editorial register (same process as v1 regions).
3. **Palette + duotone** — pick region-appropriate `--bg`, `--fg`, `--accent`, `--secondary`, `--duotone-dark`, `--duotone-light` in `tokens.css`. Update `DuotoneFilters.astro` with a new `<filter>` block using normalized RGB values. Suggested palette anchors:
   - Catalan: blood-orange + rust over bone; duotone burnt-sienna + parchment
   - Copenhagen: deep pine + sea-salt grey; duotone charcoal + pale-linen
   - Southeast Brazil: dende-oil yellow + dark cacao; duotone cacao + amber
   - Tuscan: olive green + terracotta + ox-blood; duotone bistecca-char + wheat
4. **Pin coordinates in MapSVG** — add SVG pins (symbolic placement, not true projection) and route `/regions/{slug}` links.
5. **Homepage revision** — update grid to handle 9 regions (current layout assumes 5). Consider scroll-snap carousel or two-row grid.
6. **At least 1 recipe per new region** — maintain the "1 per region" baseline. Canonical candidates: pa amb tomàquet (Barcelona), smørrebrød (Copenhagen), feijoada (Brazil), bistecca alla Fiorentina (Tuscan).
7. **Agency demo-card copy update** — `~/verbalogix-agency/components/demo/DemoShowcase.tsx` references "five regional cuisine experts"; bump to nine.

### Estimated v1.1 effort

~10 hours with Sonnet delegation for JSON/YAML translation; Opus pass for voice edits and palette decisions.

---

## Other deferred items

(populate as new roadmap items are decided)
