# Content Workflow — The Regional Table

How to author a new recipe from scratch. Follow this document any time you add to `src/content/recipes/`.

Updated: M3 (2026-04-20) — covers the full 5-recipe production workflow.

---

## 1. Where recipes live

All recipe content files live in `src/content/recipes/*.mdx`. Every file in that directory becomes a page at `/recipes/[filename-without-extension]`.

The content collection schema is defined in `src/content.config.ts` (recipes collection). All frontmatter fields are Zod-validated at build time — if a field is wrong, the build will tell you.

---

## 2. Frontmatter contract

Copy frontmatter verbatim from an existing recipe in the same region (or the closest voice match) and edit each field. The full field set, in the canonical order:

```yaml
title: "Human-readable dish name"
slug: "url-slug-no-spaces"           # optional — defaults to filename
region: "lyonnais"                   # one of: neapolitan | lyonnais | cajun-creole | nyc-street-food | washoku
heroImage: "https://images.unsplash.com/..."
heroPhotographer: "Photographer Name"
heroPhotographerUrl: "https://unsplash.com/@handle"
servings: 4                          # integer
time:
  prep: "30m"
  cook: "2h"
  total: "2h 30m"                    # string — can be a range ("4 to 5 hours")
difficulty: "intermediate"           # beginner | intermediate | advanced
techniques:                          # match names from the region YAML legendaryTechniques
  - "Technique Name"
plateNumber: 1                       # 1-indexed per region; increment for each new recipe in that region
publishedAt: 2026-04-20
seoDescription: "One sentence. Accurate to what the page actually contains."
ingredients:
  - quantity: "500 g"
    name: "ingredient name"
    note: "optional preparation or sourcing note"
method:
  - step: "Full step text."
    tip: "Optional tip. Appears with ※ prefix in the MethodList."
integrityLines:
  - rule: "The rule as a complete sentence."
    severity: "absolute"             # absolute | strong | mild
```

**Severity guide:**
- `absolute` — breaking this rule makes the dish wrong in a way no other technique compensates for
- `strong` — breaking this rule badly mars the dish
- `mild` — a preference held firmly by the tradition; violations are detectable to an expert

---

## 3. The voice bible

Every recipe body (MDX prose, below the frontmatter `---`) must be written in a regional voice. The two golden recipes authored in M2 define the poles of the voice spectrum:

**`ragu-napoletano.mdx` — Mediterranean maximalism (Nonna voice)**
- Long cultural preamble (~350 words, 5 paragraphs)
- Drop-cap on the first paragraph (the template handles this with CSS `::first-letter`)
- Dense integrity lines (5 rules)
- Dense method (7 steps, several with tips)
- Attribution: `— *la Nonna*`

**`dashi.mdx` — Japanese minimalism (Shokunin voice)**
- Short preamble (~250 words, 5 short paragraphs but spare prose)
- 3 ingredients, 4 method steps
- 3 integrity lines
- Attribution: `— the *Shokunin*`

Every new recipe lands somewhere on this spectrum. The Lyonnais Chef is precise and technical (closer to Dashi in economy of words, closer to Ragù in structural completeness). The Cajun-Creole Matriarch is warm and narrative-dense (close to Ragù). The NYC Street Food Veteran is brash and clipped (the shortest preamble, fewest words per sentence).

When authoring a new recipe, identify where on the Ragù ↔ Dashi axis the region belongs. Then write the preamble at that density — not shorter to save time, not longer to seem thorough.

---

## 4. Authoring checklist for a new recipe

1. **Identify the dish** — cross-reference the region YAML (`src/content/regions/[region].yaml`) `legendaryTechniques` and `sacredIngredients`. The dish should exercise at least one technique from that list.

2. **Read the backend JSON** — the authoritative factual source is at `/storage/emulated/0/Download/claude-projects/Cuisine-expert/Cuisines/[cuisine]/regions/[region].json`. Check `legendary_techniques[*].what_user_doesnt_know_yet` for the technical facts that integrity lines should encode.

3. **Copy frontmatter from the closest existing recipe** in that region (or a voice-adjacent region). Edit every field — do not leave placeholder values.

4. **Choose a hero image** — search Unsplash for the dish or a close visual analog. Use a URL with `?w=1400&q=80`. Record the photographer name and URL for `heroPhotographer` and `heroPhotographerUrl`. If the photographer cannot be confirmed, use `"Unsplash contributor"` and `"https://unsplash.com"`.

5. **Set `plateNumber`** — check existing recipes for the region and increment. Plate I is the first recipe for that region. If `ragu-napoletano.mdx` is `plateNumber: 1` for `neapolitan`, the next Neapolitan recipe is `plateNumber: 2`.

6. **Draft the preamble in regional voice** — read the region YAML `voiceDescription` and `voiceQuote` before writing. The preamble should sound like that voice, at the density described in §3.

7. **Write method steps** in the same voice — if the voice is terse, steps are short sentences. If the voice is narrative, the key step (the roux, the panade, the chop) gets a longer treatment. Tips are optional but use them on the technically critical steps.

8. **Write integrity lines** — pull rules from the backend JSON `integrity_lines` entries and restate them in the voice. At least one rule should be `absolute` and specific enough that a cook would understand exactly what not to do and why.

9. **Run `./scripts/check-copy.sh`** from the `~/regional-table/` directory. If it exits non-zero, rewrite the flagged sentences. Do not add exceptions to the allow list.

10. **Review on the dev server** — `npm run dev`, open `/recipes/[your-slug]`. Check: drop cap renders on the first paragraph; preamble is readable at mobile width; atlas-plate split is not cramped; integrity lines render as LegendCallout boxes.

11. **Update `docs/ARCHITECTURE.md`** — add the recipe to the M3+ section (or whichever milestone it belongs to) and confirm the recipe count in the overview is accurate.

12. **Update `CHANGELOG.md`** — add a bullet to the relevant milestone entry.

---

## 5. Duotone application rule

`RegionalDuotone.astro` applies a per-region CSS filter duotone to any `<img>` it wraps.

**Hero images: full-color only.** The recipe hero image in the atlas-plate layout is rendered with a plain `<img>` tag — no duotone. This is a confirmed design decision from the phased plan (M0.5 §photo treatment): heroes are full-color, body/process photos are duotoned.

**Body and process photos: duotone.** If you add in-article process images or cultural context shots (in-MDX `<RegionalDuotone>` usage), wrap them with this component. Pass the recipe's region slug as the `region` prop.

**Do not** use `RegionalDuotone` on hero images. The guard comment at the top of `src/components/atlas/RegionalDuotone.astro` repeats this rule.

---

## 6. Forbidden phrases

All editorial copy in MDX files, YAML region files, and `docs/` is checked by `./scripts/check-copy.sh` against the forbidden phrase list in `docs/POSITIONING.md`.

**Quick reference — these phrases are banned:**

```
revolutionize / revolutionise  seamlessly  cutting-edge  leverage
unleash  next-gen / next-generation  game-changing  best-in-class
synergy  disrupt / disruptive  paradigm shift  empower  robust
scalable solution
```

The principle: every sentence of copy should pass the test "could a real regional expert have said this?" If it sounds like a marketing page, rewrite it. See `docs/POSITIONING.md` for the full rationale per phrase.

---

## Related files

- `src/content.config.ts` — full Zod schema for the recipes collection
- `src/content/regions/` — regional voice, integrity lines, legendary techniques
- `src/pages/recipes/[slug].astro` — the recipe page template (do not modify during content authoring)
- `scripts/check-copy.sh` — automated forbidden-phrase enforcement
- `docs/POSITIONING.md` — full voice rules and forbidden phrase rationale
- `docs/DECISIONS.md` — frontmatter-vs-MDX split rationale (M2 entry); `time.total` as string decision
