# Positioning — The Regional Table

Brand voice rules for all editorial copy on this site. Applies to: MDX recipe body text, region landing page copy, About page, homepage hero text, Colophon, chat system prompts (when those are authored here), and any UI strings that appear in page content.

This document governs what voice `scripts/check-copy.sh` enforces automatically. If a phrase is in the forbidden list below, the script will catch it and exit non-zero.

---

## The central principle

**This is an editorial publication, not a product landing page.**

The Regional Table's authority comes from specificity, not from claims. A Neapolitan Nonna does not "revolutionise" pasta. She has opinions — specific, uncompromising, earned. The Washoku Shokunin does not "leverage" dashi. He knows exactly how long to steep konbu in cold water and will tell you why it matters.

Every sentence of copy should pass one test: **could a real regional expert have said this?** If it sounds like a marketing page, rewrite it. If it sounds like it came from a pitch deck, delete it.

---

## Voice: what it sounds like

**Editorial-warm, proudly opinionated.** The writing acknowledges regional expertise with humility and respect. It takes positions ("This is not bolognese") without aggression. It gives cultural context without being academic. It is written for a reader who already cooks, not a reader who needs to be sold on the idea of cooking.

**No Verbalogix corporate voice bleed.** This site is not an agency project about to win awards. The About page acknowledges the architecture explicitly, but recipe and region pages must read as the publication's own voice. The reader on a Lyonnais region page is not buying a web development service — they are learning about Paul Bocuse's kitchen. Write accordingly.

**Regional expert voice examples (correct):**

- "The roux is not decoration. It is the foundation. You do not rush a roux."  (Cajun-Creole Matriarch)
- "Sit down. Tell me which part you find difficult. I will show you once." (Neapolitan Nonna)
- "A good dashi is invisible. You know it is there only when it is absent." (Washoku Shokunin)
- "Every borough has its own pizza opinion. This is the slice I grew up with." (NYC Street-Food Veteran)

**What PASSES — sample sentences:**

- "The ragù cooks whole. You shred the meat at the table, not before."
- "Lyon's bouchons are not restaurants. They are arguments about how to braise."

**What FAILS — sample sentences:**

- "Our cutting-edge AI leverages five regional culinary knowledge graphs to seamlessly empower home cooks." (three banned phrases; corporate non-voice)
- "Revolutionise your weeknight dinners with next-gen recipe recommendations." (two banned phrases; sounds like an app store listing)

---

## Forbidden phrases

These are banned from all editorial copy, MDX content, YAML region files, and `docs/` files (except this one and `docs/DECISIONS.md`, which may discuss the rules).

`scripts/check-copy.sh` greps for all of these. Exit 1 on any match in the scanned paths.

```
revolutionize / revolutionise
seamlessly
cutting-edge
leverage
unleash
next-gen / next-generation
game-changing
best-in-class
synergy
disrupt / disruptive
paradigm shift
empower
robust
scalable solution
```

### Why each is banned

**"revolutionize / revolutionise"** — Nothing in home cooking is a revolution. Regional cuisine is specifically the opposite of revolution: it is continuity, preservation, transmission. Using this word signals you have no idea what you are talking about.

**"seamlessly"** — Adverb of fictional smoothness. Nothing is seamless; it is either well-made or it is not.

**"cutting-edge"** — Cuisine is measured in centuries, not product cycles. A "cutting-edge" beurre blanc is absurd.

**"leverage"** — The financialisation of a verb that already exists as "use." Banned in both senses (the verb and the noun metaphor).

**"unleash"** — Marketing energy drink copy. Not a food word.

**"next-gen / next-generation"** — Every generation of cooks learns from the previous one. There is no "next-gen" ragù.

**"game-changing"** — Games are not changed. Techniques are learned, flavours are balanced, timing is respected.

**"best-in-class"** — Unprovable. Also, what class? The best dashi in what competition?

**"synergy"** — Banned on sight, always, everywhere, for any project. No exceptions.

**"disrupt / disruptive"** — Regional cuisine disrupts nothing. It pre-dates everything being disrupted.

**"paradigm shift"** — The paradigm of Neapolitan cooking shifted approximately once, in 1889, when Margherita pizza was named. We were not there. Do not claim equivalence.

**"empower"** — People learn to cook. They are not empowered by a website.

**"robust"** — Technical jargon used as a substitute for specificity. Say what the thing actually does.

**"scalable solution"** — This is a food editorial site, not a B2B SaaS deck. If you are typing "scalable solution" into a recipe page, you have wandered into the wrong project.

---

## What happens if copy slips

1. `./scripts/check-copy.sh` catches it on the next run.
2. Rewrite the sentence to be specific instead of promotional. Ask: what would the actual regional expert say here?
3. If the phrase slipped into a region YAML voice description, it came from a copy-paste of the backend region JSON. The JSON was written for the API, not for publication. Edit the voice for the editorial register.
4. Log the slip in `CHANGELOG.md` if it recurs — it means the source data needs a stricter editorial pass.

---

## Copy that is always acceptable

- Direct quotes from regional expert voices (in-character, specific, opinionated)
- Cultural and historical context ("Bouchon cooking dates to Lyon's silk weavers, who needed cheap, filling meals")
- Integrity lines as-stated ("No cream. No carrot. The meat cooks whole.")
- Honest limitations ("This site carries five recipes per region at launch; more are being authored")
- The architecture disclosure on the About page (factual, first-person, no buzzwords)

---

## M4 — About page voice patterns (added 2026-04-20)

The About page established patterns for the "architecture disclosure" register — honest about what the site is (a demonstration of a pattern), but written as a publication's own colophon rather than an agency pitch. Key voice moves confirmed in M4:

- **Name the technology plainly.** "The chat is backed by Claude Haiku 4.5 with a persona-bridge layer." No euphemism, no puffery.
- **Lead with the publication, not the agency.** The site's own voice leads. The agency attribution comes last, in a short dedicated section.
- **Use the word "demonstration" without apology.** The reader on the About page expects honesty. Calling it a demonstration is honest, and honest is the register.
- **Integrity lines can appear in body copy.** "She knows you cannot rush it. She knows the difference..." — this is the Nonna's voice bleeding into editorial description. That's correct. It earns the trust.

---

## Related

- [`scripts/check-copy.sh`](../scripts/check-copy.sh) — automated enforcement
- [`docs/DECISIONS.md`](DECISIONS.md) — why the Regional Table is an editorial publication, not a product page
- [`../CLAUDE.md`](../CLAUDE.md) — DON'T section lists the forbidden phrases for quick reference
