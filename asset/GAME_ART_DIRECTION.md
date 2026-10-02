# UN IN HOMEMADE — GAME ART DIRECTION (visual style profile)

**Status:** Derived, subordinate. `ASSET_PRODUCTION_STANDARD_v1.md` wins on format, direction, states, naming and delivery; this file only describes **how the approved reference looks**, measured, so every new asset can match it without re-reading the images.
**Built from:** the CORE references listed in `.claude/skills/image-to-asset/references/reference-registry.json` (hash-pinned). Run `node .claude/skills/image-to-asset/scripts/ref-check.mjs`; while it prints `style profile current`, do not re-analyse the images.
**Used by:** skill `image-to-asset` (brief → generate → QA). Measurable rules are enforced by its `scripts/qa.mjs` (check ids `S1`–`S7` below).

---

## 0. Sources and their weight

| Rank | Source | Role |
|---|---|---|
| 1 | Art standard §1 (master style text) + this file | Project art direction |
| 2 | `reference/style_reference_pigs.png` — **CORE** | Pig style: the consistent set (24 pigs, one hand) |
| 3 | `reference/style_reference_environment.png` — **CORE** | Buildings, props; top row = the 4 P0 pigs in the same style |
| 4 | Accepted production pigs cut from the CORE sheets (`pig_classic` = **style anchor**) | Closest visual reference, at the real canvas |
| 5 | Generic "cute cartoon" knowledge | Only to fill gaps — never overrides 1–4 |
| ✗ | `reference/style_reference_pigs_alt.png` — **OUTLIER** | Rejected style (art standard §1). Use only as a list of failure modes |
| ✗ | Code-drawn pigs from `scripts/art/pigs.ts` (`pig_cowboy`, `pig_knight`, `pig_wizard`, `pig_ghost`, `pig_detective`, `pig_christmas`, `pig_tet`) — **OUTLIER** | Frontal face, head ≈ body, flat vector fill. Fail `S7`. Regenerate; never use as reference |

The coloured glow behind every reference cell is presentation, **not** style: assets have no glow and no background.

## 1. Shape language

- Rounded, soft, organic. Every corner is rounded, including costume points (crown tips, horns, hat brims).
- Chunky "bean/loaf" body, slightly wider at the hips than the shoulders; short, thick legs.
- Cute, friendly, low exaggeration: no squash poses, no dynamic perspective; calm standing pose.
- Silhouette reads at 128 px: one big body mass + one head mass + four leg stubs + ears. Costumes add **at most one** big secondary shape (hat, cape, wings, hood) and never swallow the head.

## 2. Pig proportions (side view facing right, head turned 3/4)

Measured on `pig_classic` (height ear-tip → hoof = H ≈ 330 px on the 512 canvas):

| Part | Rule |
|---|---|
| Camera | Body in side view facing right, seen from slightly above (a sliver of the back is visible). **Head turned ~3/4 toward the viewer**: both eyes visible, far eye narrower. Not a flat profile, not a frontal face |
| Overall | Width ≈ 1.2–1.3 × H (bare pig). Head : body ≈ 1 : 1.6 (art standard §1) — the head is big but clearly smaller than the body |
| Head | ≈ 50 % of H tall, sits at the front-top and overlaps the body; top of head ≈ top of back + ears |
| Ears | Two soft triangles folding forward; near ear larger and flopping over, far ear peeking behind; inner ear a deeper pink |
| Eyes | Large dark-brown tall ovals, near eye height ≈ 15–19 % of H, one big white highlight top-left + one small dot. **Far eye width ≈ 0.43–0.59 × near eye** (`S7`, max 0.72). Near eye sits left of the far eye |
| Snout | Short, slightly upturned oval cylinder at the far right, deeper pink than the face, two vertical oval nostrils, outlined |
| Mouth / cheeks | Small curved smile below the snout (open smile with tongue allowed); soft pink blush oval under each eye |
| Legs | Four visible, short and thick, ≈ 18–22 % of H; far legs darker and slightly behind; dark warm-brown hooves with a split |
| Tail | Small curly spiral, upper back-left |
| Ground | Lowest hoof pixel on y = 420 (82 %); all four hooves on one line (art standard §4.1) |

**Sleep pose** (reference `pigs c5r2`, `c1r1`): lying on the belly, legs tucked under, head resting forward and down, eyes closed as happy curves, same facing; height ≈ 0.55–0.75 × idle H. Generate it **from the accepted idle image** (art standard §11.2).

## 3. Line art

- Continuous, smooth, anti-aliased outline in a **dark warm version of the local fill** (pink body → maroon-brown ≈ `#6b3a32`; never pure black). On dark coats the outline may go near-black.
- Weight ≈ 2 % of H (6–8 px at 330 px), even along the silhouette, slightly thinner for inner lines (ear fold, leg separation, cape folds). Inner lines are lighter than the silhouette line.
- Rim of the anchor: mean luma ≈ 78 (`S2`, ±45).

## 4. Colour

- Warm pastel bodies, medium saturation (anchor mean ≈ 0.37; costumes up to ≈ 0.57). Accents may be saturated (cape red, gold) but never neon.
- No pure black or pure white fills: "black" = charcoal with a cool sheen, "white" = cream.
- Base palette tokens (shared with the code kit `scripts/art/kit.ts` `PAL`): body pink `#f8b6c1`, snout `#f39aaa`, blush `#f37f95`, eye `#3a221d`, hoof `#6e4538`, cream `#f6e6c4`, gold `#f6c445`, red `#e2504a`.
- Each pig has one dominant identity colour + at most two accent colours.

## 5. Shading, lighting, rendering

- Light from the **top-left**, always.
- Soft cel: base tone + **one** shadow tone (belly underside, far legs, under the head, lower-right of shapes) + **one** soft highlight (top-left of back, head, snout). Edges between tones are soft (airbrushed), not hard vector cuts and not painterly strokes.
- Subtle painted micro-texture is part of the look (`S3` texture ≈ anchor, 0.55–1.9×). Flat single-colour vector fills read as off-style; sketchy brush texture reads as the rejected alt style.
- Detail level: low–medium. Costume = 2–3 tones per material, no fine patterns that turn to noise at 128 px. No 3D render look, no photographic material, no hard specular.
- No ground, cast shadow, glow, scene or floating particles in pig files (fx are separate assets).

## 6. Perspective by family

| Family | View |
|---|---|
| Pigs (+ sleep) | Side body facing right, head 3/4 (above). Left = runtime flip |
| Cosmetics (post-v1) | Side view facing right, angled to sit on the pig |
| Buildings / props | Three-quarter from slightly above, own grass patch + contact shadow (art standard §4.3) |
| FX / UI icons | Front-on, centred, no ground |

## 7. Reference change log

| Date | Change | Classification | Effect on this file |
|---|---|---|---|
| 2026-10-01 | Initial analysis of the 3 sheets | 2 CORE, 1 OUTLIER | Created |

A new reference image is classified with `.claude/skills/image-to-asset/workflows/reference-analysis.md`. Only a CORE image may change §1–§5, and only by **adding** precision that the existing accepted pigs still satisfy (run `qa.mjs` on them after the edit) — never by moving the style.
