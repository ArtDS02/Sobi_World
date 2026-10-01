# UN IN HOMEMADE — ASSET PRODUCTION STANDARD v1

**Status:** Normative. This document wins over every other art document on questions of format, direction, states, naming and delivery.
**Companion:** `../UN_IN_GAME_SPEC_v4_SOLO.md` (game rules). Rules win there, art wins here.
**Governs:** `animals/PIG_CATALOGUE.md` (the pig catalogue) and `building/ENVIRONMENT_CATALOGUE.md` (the environment catalogue). Those two stay as **concept catalogues** — what to draw. This document is **how to draw and deliver it**.

---

# 0. WHY THIS DOCUMENT EXISTS

The two existing asset lists are good concept work: 116 pig ideas, 129 cosmetics, an environment set, and a modular composition model. What they did not have was a production contract, and three gaps were blocking:

1. **No answer on sprite directions.** Section 2 settles it.
2. **No animation or state frames.** The game spec needs 8 visual states per pig; the catalogues listed 1 image per pig. Section 3 settles it.
3. **Version and reference chaos.** The pig file is named `v3`, titled `v4`, and says it extends `v3` — itself. The environment file is titled `v4` and says it extends a `v2` file that does not exist in this folder. Two referenced documents (`UN_IN_ASSET_LIST_v2_CHARACTERS_PROPS.md`, `UN_IN_ASSET_LIST_v3`) are missing entirely. Section 8 fixes the numbering.

It also records the problems visible in the sample sheets, which are concept art that must not be shipped as-is (section 6).

---

# 1. MASTER ART DIRECTION

Locked, carried from the pig catalogue section 1.1, with the reference pinned:

```text
Cute 2D cartoon game art, chibi proportions, flat colors with soft cel-shading,
clean rounded outlines, warm pastel palette, friendly and playful personality,
casual mobile game aesthetic, Vietnamese countryside influence where appropriate,
consistent top-left lighting, readable silhouette, polished game-ready sprite,
no text, no letters, no watermark, no logo.
```

**Style reference is `reference/style_reference_pigs.png`, not `reference/style_reference_pigs_alt.png`.**

This matters and must not be treated as a preference. The two sheets are not the same style:

| | `reference/style_reference_pigs.png` | `reference/style_reference_pigs_alt.png` |
|---|---|---|
| Rendering | Flat cel-shading, clean uniform outline | Painterly, sketchy texture, soft edges |
| Head-to-body | ~1 : 1.6 | ~1 : 1.1 — much bigger head |
| Eyes | Small, simple highlight | Large, multi-highlight, glossy |
| Silhouette at small size | Reads clearly | Detail mush |
| Props | Mostly worn | Full scenes baked in |

Mixed in one farm they look like two different games. `style_reference_pigs` is the one that matches the written art direction and survives being scaled down to gameplay size, so it is the reference. If the softer look of sheet 2 is preferred, that is a legitimate choice — but then sheet 1 must be redrawn to match, and this document updated. **Pick one before producing volume.**

---

# 2. SPRITE DIRECTIONS — the decision

## 2.1 Decision

**Draw one direction: side view, facing right. Left is a runtime horizontal flip. Do not produce front or back views.** (Game spec D23.)

```ts
// Phaser, the entire cost of "the pig faces where it walks"
pig.setFlipX(velocityX < 0);
```

## 2.2 Why not four directions

The question was reasonable — in a top-down RPG, four directions is the correct answer. This is not that camera. Four reasons it is wrong here:

**1. The camera does not need it.** The farm is a pen viewed from a fixed three-quarter angle (see `reference/style_reference_environment.png` — every structure is drawn from one angle with a grass base). In this camera, movement "into" the scene is expressed by moving the sprite up the Y axis, scaling it down slightly, and sorting draw order by Y. That reads correctly to the player with zero extra art. It is how farm and pet games in this exact camera have always done it.

**2. The cost is not 4x, it is roughly 8x, and it breaks the modular system.** The catalogues define 116 pigs and 129 cosmetics.

| | Current plan | With 4 directions |
|---|---:|---:|
| Pig skins | 116 | 464 |
| Cosmetics | 129 | 516 |
| Anchor sets in `anchors.json` | 116 | 464 |
| **Total images** | **245** | **980** |

Every cosmetic would need a front, back, left and right variant, and every base pig would need four anchor sets that all have to stay calibrated together. The modular composition model in the pig catalogue section 14 — the thing that lets one crown work on ninety pigs — is what absorbs the 4x cost and is exactly what breaks first.

**3. A back view of a pig is an asset nobody wants to look at.** The entire appeal of these designs is the face: the eyes, the snout, the blush. A rear view deletes all of it and shows a curly tail and two hams. Worse, it makes the whole `acc_face_*` category — 20-plus cosmetics the player paid gold for — invisible for as long as the pig walks upward. The player would be watching their collection disappear.

**4. The art budget is better spent on states.** For the cost of giving one pig four directions, you can give **four** pigs everything the game spec actually asks for. That is the trade, and section 3 is where the budget should go instead.

## 2.3 The one real caveat: asymmetric cosmetics

A horizontal flip mirrors everything. Anything with a handedness looks wrong when mirrored:

- Text or a logo — already banned by the negative prompt, so no issue.
- A one-eye item: `acc_head_pirate` (eyepatch), monocles.
- A prop held on one side: `acc_prop_*`, the chef's pan, the wizard's staff.
- Asymmetric hair, a side-parted fringe, a single earring.

**Rule.** Every cosmetic declares `symmetric: true | false` in its metadata. Symmetric items flip freely. Asymmetric items ship **one extra mirrored file** (`acc_head_pirate.png` plus `acc_head_pirate_flip.png`), and the renderer picks by facing. From the current catalogue that affects roughly 15 of 129 cosmetics, so the real cost of two directions is about **+12%**, not +300%.

Base pigs are symmetric by design (the catalogue's silhouette rule already pushes that way) and need no flip file. The one exception to check: pigs whose concept has a one-sided element — the pirate's eyepatch skin, the detective's pipe. Draw those symmetric or accept the mirror.

## 2.4 What replaces the extra directions

| Need | Solution | New art |
|---|---|---|
| Face left | `setFlipX(true)` | none |
| Walk "into" the scene | move on Y, scale 0.85–1.0 by depth, sort by Y | none |
| Two pigs overlapping | Y-sort | none |
| Pig turning around | 120 ms `scaleX: 1 → 0 → -1` tween — reads as a turn | none |

That last one is worth doing; it costs four lines and removes the only moment where a flip looks like a glitch.

---

# 3. ANIMATION STATES — the real gap

The game spec section 11 requires eight visual states: `idle`, `walk`, `eat`, `clean`, `sleep`, `happy`, `sick`, `pregnant`. The catalogues specify one image per pig. Drawing eight per pig would be 928 images.

**Composition solves seven of the eight.** Per pig, produce **two** images:

| File | Required | Content |
|---|---|---|
| `<pig_id>.png` | yes | The base idle pose. Side view, facing right, all four feet visible. |
| `<pig_id>_sleep.png` | P1 pigs only | Lying down, eyes closed, same facing. |

Everything else is code plus shared overlays:

| State | Rendering | Cost |
|---|---|---|
| idle | base + slow breathing scale tween | code |
| walk | base + squash/stretch tween + flipX | code |
| eat | base rotated ~8 deg down + crumb particles | code + shared particle |
| clean | base + bubble emitter + brightness tween | code + shared particle |
| happy | base + hop tween + heart particles | code + shared particle |
| sleep | `_sleep` frame + `fx_zzz` overlay | **1 image per pig** + 1 shared |
| sick | base + green tint + `fx_sick` overlay | **1 shared image** |
| pregnant | base + `fx_pregnant` badge | **1 shared image** |

## 3.1 Shared overlay set — produce these once, they serve all 116 pigs

`sprites/fx/`, 256 x 256 transparent PNG unless noted:

| File | Use |
|---|---|
| `fx_sick.png` | Sweat drop + small green wobble mark, anchors above the head |
| `fx_pregnant.png` | Soft pink heart badge with a small pig silhouette |
| `fx_zzz.png` | Sleeping Z's, 3 frames |
| `fx_heart.png` | Particle, 64 x 64 |
| `fx_bubble.png` | Particle, 64 x 64 |
| `fx_crumb.png` | Particle, 64 x 64 |
| `fx_sparkle.png` | Particle, 64 x 64 |
| `fx_coin.png` | Particle, 64 x 64 |

**Eight shared files replace roughly 700 per-pig state images.** That is the budget that four directions would have consumed.

## 3.2 Where the sleep frame is genuinely worth drawing

Sleep is the one state a tween cannot fake — the pig has to lie down. The sample sheets already show the pose works: `reference/style_reference_pigs.png` row 3 last column (the pig asleep in a nightcap) and row 2 column 2 (the mud pig lying down) are both usable references. Produce `_sleep` for the 13 P1 pigs and the 4 breed defaults only. Rarer skins fall back to the idle frame with `fx_zzz`, which is acceptable because the player rarely watches a P4 pig sleep.

---

# 4. FILE FORMAT CONTRACT

## 4.1 Base pig

| Property | Value |
|---|---|
| Size | 512 x 512 px |
| Format | PNG-32, transparent |
| Content | Single pig, full body, **side view facing right**, all four feet visible |
| Composition | Centred, with the feet on the horizontal line at y = 82% of the canvas |
| Expression | Neutral or happy |
| Background | Fully transparent — no ground, no shadow, no scene, no props that are not part of the costume |
| Forbidden | Text, letters, UI, watermark, logo, border, baked drop shadow |

The **feet-at-82%** rule is new and necessary: without a fixed ground line, every pig sits at a different height and the farm looks broken. All 116 pigs must share it. Anchors (section 5) are measured against the same canvas.

## 4.2 Cosmetic

| Property | Value |
|---|---|
| Size | 256 x 256 px |
| Format | PNG-32, transparent |
| Content | One isolated item, no pig body, no background |
| Anchoring | Designed around the anchor point named in its slot, see section 5 |
| Extra file | `_flip.png` mirrored variant when `symmetric: false` (section 2.3) |

## 4.3 Buildings, props, environment

Sizes as listed in the environment catalogue. Two additions it is missing:

- **Grass base is baked in and that is correct** for buildings (see `reference/style_reference_environment.png` — every structure sits on its own grass patch). Keep it. It is the opposite of the pig rule and deliberately so: buildings never move, pigs do.
- Every building needs a **`_shadow.png`** companion or a baked contact shadow, otherwise structures float once the ground texture changes.

## 4.4 UI icons

128 x 128 transparent PNG, as the environment catalogue says. One correction: it lists `ui_icon_happiness.png`. In game spec v3 there was no happiness stat and this icon was orphaned. **In v4 happiness exists (D18), so keep this icon** — it now has a home in the selected-pig panel.

## 4.5 Delivery checklist per asset

- [ ] Correct canvas size, transparent, no background layer left enabled
- [ ] Facing right (pigs), feet on the 82% line
- [ ] No text anywhere in the image
- [ ] Reads clearly when scaled to 128 px wide — check it, do not assume
- [ ] Top-left lighting consistent with `reference/style_reference_pigs.png`
- [ ] Filename matches section 7, lowercase snake_case
- [ ] Row added to `assets.json` (section 7)
- [ ] `symmetric` flag set for cosmetics

---

# 5. ANCHOR SYSTEM

Carried from the pig catalogue section 28 with one change: anchors are **required**, not "should".

```json
{
  "head":      { "x": 0.53, "y": 0.25 },
  "face":      { "x": 0.58, "y": 0.31 },
  "body":      { "x": 0.48, "y": 0.50 },
  "back":      { "x": 0.30, "y": 0.46 },
  "hand_prop": { "x": 0.64, "y": 0.61 },
  "feet":      { "x": 0.50, "y": 0.82 },
  "fx_above":  { "x": 0.50, "y": 0.10 }
}
```

Normalised 0.0–1.0 against the 512 x 512 canvas. `fx_above` is new and is where `fx_sick`, `fx_pregnant` and `fx_zzz` attach.

**`feet` is fixed at 0.82 for every pig** (section 4.1). The other six are calibrated per pig and live in `anchors.json` next to the sprite.

When a sprite is flipped, anchors mirror as `x' = 1 - x`. The renderer must do this; it is one line and forgetting it is the most likely cosmetic bug in the project.

---

# 6. THE SAMPLE SHEETS — status and defects

`reference/style_reference_pigs.png`, `reference/style_reference_pigs_alt.png` and `reference/style_reference_environment.png` are **concept sheets, not production assets.** They are useful and should be kept as style references. None of them can be cut up and shipped. Recorded defects:

## 6.1 Both pig sheets
- **Contact-sheet format** with a coloured gradient background. Production needs one pig per file on transparency.
- **Inconsistent facing.** The standard says facing right. On `style_reference_pigs` most face right but several face left. On `style_reference_pigs_alt`, four of eight face left (farmer, nerd, merchant, dragon). Every one must be redrawn or mirrored to face right.
- **Inconsistent ground line.** Pigs sit at different heights within their cells, which is exactly what section 4.1 exists to prevent.

## 6.2 `reference/style_reference_pigs_alt.png` specifically
- **Baked-in text.** Every cell has a filename caption burned into the image: "big. farmer png", "pig..cooking .hat png", "plg. nerd.png", "pig .dragompng", "pig merchant phg". These are AI generation artifacts, they are misspelled, and they violate the negative prompt. They must never reach production.
- **Baked-in scenes.** The bath pig comes with a wooden tub, water and a rubber duck. The witch pig comes with a cauldron, a broom and grass. The chef comes with a frying pan. These are illustrations, not sprites — the prop and the ground are fused to the body, so the pig cannot walk, cannot be composed with cosmetics, and cannot be re-posed.
  - **This is the single most expensive defect**, because these are exactly the concepts the modular system was designed for: `pig_classic` + `acc_head_chef` + `acc_prop_pan` should produce the chef, not a one-off illustration.
  - Redraw rule: the pig body goes in the base file, everything detachable becomes a cosmetic in `sprites/cosmetics/`.
- **Style divergence** from sheet 1 — see section 1.

## 6.3 `reference/style_reference_environment.png`
- Genuinely close to usable and the strongest of the three sheets. The structures are consistent, the grass bases are right, the palette matches.
- Row 1 contains four pigs that belong in the animal catalogue, not the building one. Those four are the **four game-spec breeds** — see game spec 6.6.
- Needs slicing into individual transparent files with the baked gradient background removed.

## 6.4 What to do with the sheets
Keep them in `asset/reference/` renamed to `style_reference_pigs.png`, `style_reference_pigs_alt.png`, `style_reference_environment.png`, so nobody mistakes them for deliverables. Generate production assets one per file against section 4.

---

# 7. NAMING AND THE ASSET MANIFEST

## 7.1 Naming

Lowercase snake_case, no version numbers in production filenames (git handles versions):

```text
pig_classic.png            pig_classic_sleep.png
pig_robot.png              pig_thienlong.png
acc_head_crown.png         acc_head_pirate.png   acc_head_pirate_flip.png
acc_body_cape_red.png      acc_back_wings_dragon.png
acc_prop_magic_staff.png   acc_fx_cyber.png
fx_sick.png                fx_zzz.png
prop_feed_trough.png       prop_hay_shed.png     prop_hay_shed_shadow.png
ui_icon_hunger.png         ui_btn_feed.png
```

Never: `PigRobot.png`, `Robot Helmet Final.png`, `pig-new-final2.png`, `asset123.png`.

## 7.2 `public/assets/manifest/assets.json`

Every asset is reachable from one manifest. The game spec requires final art to be swappable **with no code change**, and this file is the mechanism.

```json
{
  "version": 1,
  "pigs": [
    {
      "id": "pig_classic",
      "nameVi": "Heo Hồng Cổ Điển",
      "collection": "base",
      "rarity": "P1",
      "priceGold": null,
      "allowedBreeds": "ALL",
      "asset": "pigs/base/pig_classic.png",
      "sleepAsset": "pigs/base/pig_classic_sleep.png",
      "anchors": "pigs/base/pig_classic.anchors.json",
      "tags": ["classic", "farm"]
    }
  ],
  "cosmetics": [
    {
      "id": "acc_head_pirate",
      "nameVi": "Mũ Cướp Biển",
      "slot": "head",
      "rarity": "P2",
      "symmetric": false,
      "asset": "pigs/cosmetics/head/acc_head_pirate.png",
      "assetFlip": "pigs/cosmetics/head/acc_head_pirate_flip.png",
      "compatibleTags": ["adventure", "classic"],
      "tags": ["pirate", "adventure"]
    }
  ],
  "fx": [ { "id": "fx_sick", "asset": "fx/fx_sick.png", "anchor": "fx_above" } ],
  "props": [ { "id": "prop_feed_trough", "asset": "buildings/prop_feed_trough.png" } ],
  "ui": [ { "id": "ui_icon_hunger", "asset": "ui/ui_icon_hunger.png" } ]
}
```

`priceGold`, `rarity` and `allowedBreeds` are read directly by the skin shop (game spec 6.6 and 8.13). Adding a skin to the game is **one row here plus two PNGs** — no TypeScript.

## 7.3 Directory layout

```text
public/assets/
├── pigs/
│   ├── base/          pig_classic.png, pig_classic_sleep.png, *.anchors.json
│   ├── skins/         vietnam/ jobs/ adventure/ robot/ fantasy/
│   │                  mythology/ horror/ seasonal/ food/ funny/
│   └── cosmetics/     head/ face/ body/ back/ prop/ effects/
├── buildings/
├── props/
├── ui/
├── fx/
├── audio/
└── manifest/assets.json
```

---

# 8. DOCUMENT LAYOUT — settled

The original three files carried a version mess: the pig file was named `v3`, titled `v4`, and claimed to extend `UN_IN_ASSET_LIST_v3` — itself. The environment file claimed to extend `UN_IN_ASSET_LIST_v2_CHARACTERS_PROPS.md`. **Neither referenced document exists and neither was ever written.** Do not let an AI agent hunt for them; it will invent their contents.

That is resolved. The layout below is final:

```text
Un_In/
├── README.md                              ← start here. Reading order + agent kickoff prompt.
├── UN_IN_GAME_SPEC_v4_SOLO.md             ← game rules. Source of truth for behaviour.
├── archive/
│   └── UN_IN_GAME_SPEC_v3_SOLO.md         ← superseded. Do not read. Kept for audit only.
└── asset/
    ├── ASSET_PRODUCTION_STANDARD_v1.md    ← this file. Format, directions, states, naming.
    ├── AI_ASSET_GENERATION_PACK.md        ← ready-to-paste prompts + post-processing pipeline.
    ├── animals/PIG_CATALOGUE.md           ← 116 pig concepts + 129 cosmetics.
    ├── building/ENVIRONMENT_CATALOGUE.md  ← structures, props, UI, audio.
    └── reference/
        ├── style_reference_pigs.png       ← THE style reference (was pig-list-1.png)
        ├── style_reference_pigs_alt.png   ← rejected alt style (was pig-list-2.png)
        └── style_reference_environment.png (was building-list-1.png)
```

One standard, two catalogues, one prompt pack, no version numbers in filenames, no references to files that do not exist.

---

# 9. CORRECTIONS — applied

The corrections below were **already applied** to the catalogues. They are recorded here so the reasoning survives, and so a reviewer can verify the edits rather than wonder whether they happened.

## 9.1 Pig catalogue — `animals/PIG_CATALOGUE.md`

| Section | Change | Why |
|---|---|---|
| Header, §0 | Retitled, version numbers dropped, the two missing documents explicitly declared dead | An agent that reads "extends v3" will search for v3 and then invent it |
| §1.2 | Added the 82% ground line and the mandatory `_sleep` frame; made "facing right, one direction" explicit | Without a shared ground line every pig sits at a different height |
| §1.3 | Added the `symmetric` flag and the `_flip.png` rule | The flip strategy in §2.3 fails silently on one-eye and one-hand items |
| §12 | `pig_watermelon` promoted to **P0 — breed default** | It is PIG_STRIPED_MELON, a game-spec breed, and was sitting in the catalogue as an ordinary P1 skin with nobody aware of the link |
| §28 | Added `fx_above`, fixed `feet` at 0.82, stated the mirror rule `x' = 1 - x` | Overlays had no attachment point; the mirror rule is the likeliest cosmetic bug in the project |
| §31 | Marked superseded, pointing at `assets.json` in §7.2 here | The sketched schema lacked every field the skin shop reads |
| §33 | Added a **P0** tier above P1 with the four breed defaults | Without those four the game has no art at all, and the old P1 list buried two of them among fifteen |
| §23–27, §37 | Marked superseded, pointing at the generation pack | Those prompts do not forbid captions or held scene props — which is exactly how `reference/style_reference_pigs_alt.png` got filenames burned into the image and frying pans fused to pig bodies |

## 9.2 Environment catalogue — `building/ENVIRONMENT_CATALOGUE.md`

| Change | Why |
|---|---|
| New **§1 core mechanic props, P0**: `prop_feed_trough_{empty,half,full}.png` and `prop_order_board.png` | The trough is a core mechanic (game spec D17) and appeared in no catalogue at all. Three states so the player can read the food level from the farm view — the glance that teaches "stock up before logging off" |
| New **§0** stating the two rule inversions for buildings | Buildings keep their baked grass base and shadow; pigs do not. Both sheets got this right by instinct but nothing wrote it down |
| Audio keys replaced with the canonical list from game spec §12 | The old keys (`sfx_pig_oink_happy`, …) matched nothing in the code; half the sounds would have loaded under names nothing referenced |
| Crops moved to §5 and marked **BACKLOG** | Game spec §20 item 1. Drawing assets for a system whose rules do not exist yet |
| `ui_icon_happiness.png` kept | Orphaned under spec v3 which had no happiness stat; v4 D18 gives it a real home |
| Added `ui_icon_trough`, `ui_icon_order`, `ui_icon_collection`, `ui_icon_skin`, `ui_btn_clean_all`, `ui_btn_fill_trough` | New v4 systems had no icons |
| Added §7 production order and per-asset sizes throughout | The old list gave sizes for some assets and not others |

---

# 10. PRODUCTION ORDER

Do not produce 245 assets before the game is playable. The game spec development order reaches a playable build at step 8 with no art at all.

**Wave 0 — placeholders (day 1).** Four coloured rounded rectangles named `pig_classic.png` and so on. The game must run on these. This is a hard requirement, not a suggestion: it is what proves the manifest swap works.

**Wave 1 — minimum shippable art (17 pig images).** The 4 breed defaults plus their 4 `_sleep` frames, the 8 shared `fx_*` overlays, `prop_feed_trough` in 3 states, and the UI icon set. At this point the game looks finished with 4 pigs.

**Wave 2 — the P1 skin set (26 images).** The 13 P1 pigs from the pig catalogue section 33 plus their `_sleep` frames. This is the first content the skin shop sells, and the first real test of whether the collection loop is fun.

**Wave 3 — cosmetics (about 40 images).** The head and face slots first — they are the most visible and the most reusable. Roughly 15 of them need `_flip` variants.

**Wave 4 and beyond — the remaining ~100 concepts,** driven by what players actually buy.

Every wave is additive and requires no code change beyond `assets.json` rows.

---

# 11. AI GENERATION PROMPTS — updated

The catalogue's prompts are good. These are the corrected versions with the production rules folded in. The changed lines are marked.

## 11.1 Base pig

```text
Cute 2D cartoon game art, chibi pig character, flat colors with soft cel-shading,
clean rounded outlines, warm pastel palette, friendly playful personality,
high-quality casual mobile game character design, consistent top-left lighting.

Single full-body pig character, perfect side view profile facing right,
all four feet visible and resting on the same invisible ground line,
centered composition, readable silhouette, neutral or happy expression.

[SKIN CONCEPT]

The character must remain clearly recognizable as a pig.
Costume and theme integrated naturally into the pig silhouette.
Simple shapes and clean visual hierarchy suitable for a small mobile game sprite.

# CHANGED: props must be worn, never placed
Any accessory must be worn on the body. No separate objects, no held scene props,
no furniture, no ground, no environment, no shadow.

Transparent background, isolated character,
no text, no letters, no watermark, no logo, no UI, no border.

512x512 px.
```

## 11.2 Sleep frame

```text
[same STYLE block as 11.1]

The same pig character as [PIG ID], lying down asleep on its side,
eyes closed, peaceful expression, legs tucked, facing right.
Identical color palette, identical costume, identical line weight to the idle pose.

Transparent background, no bedding, no ground, no pillow, no scene,
no text, no watermark.

512x512 px.
```

The "identical to the idle pose" line is the important one — generate the sleep frame **from** the finished idle image, not from the concept, or the two will not look like the same pig.

## 11.3 Cosmetic

```text
Cute 2D cartoon game asset, rounded shapes, soft cel-shading,
warm pastel palette, clean edges, consistent top-left lighting.

[ITEM DESCRIPTION]

Single isolated modular accessory shown in side view facing right,
sized and angled to be worn by a chibi pig character.

# CHANGED: explicit, because "no pig body" was being ignored
No pig, no animal, no head, no body, no mannequin, no stand, no hand holding it.
The item alone on empty space.

Transparent PNG, 256x256, no background, no ground, no shadow,
no text, no watermark, no logo.
```

## 11.4 Negative prompt — append to every generation

```text
text, letters, words, watermark, logo, signature, caption, filename,
border, frame, background, gradient background, ground, floor, grass,
shadow, drop shadow, scene, environment, furniture, multiple characters,
character sheet, contact sheet, front view, back view, three-quarter view,
facing left, facing camera, blurry, extra limbs, deformed
```

`front view, back view, facing camera` are in there deliberately — they enforce section 2. `caption, filename` are in there because `reference/style_reference_pigs_alt.png` has filenames burned into it (section 6.2).

---

# 12. SUMMARY OF DECISIONS IN THIS DOCUMENT

| # | Decision | Section |
|---|---|---|
| A1 | Style reference is `reference/style_reference_pigs.png`. Sheet 2's painterly style is rejected or must be adopted globally. | 1 |
| A2 | One direction only: side view facing right. Left is a runtime flip. No front or back views. | 2 |
| A3 | Asymmetric cosmetics ship a `_flip.png`. About 15 of 129 items, roughly +12% cost. | 2.3 |
| A4 | Eight visual states are produced by composition. Per pig: 1 idle image, plus 1 sleep image for P1 pigs. | 3 |
| A5 | Eight shared `fx_*` overlays replace roughly 700 per-pig state images. | 3.1 |
| A6 | All pigs share a ground line at 82% of canvas height. | 4.1 |
| A7 | Buildings keep their baked grass base; pigs keep full transparency. | 4.3 |
| A8 | Everything is reachable from one `assets.json`; adding a skin needs no code. | 7.2 |
| A9 | Sample sheets move to `asset/reference/` and are never shipped. | 6.4 |
| A10 | Version numbers leave filenames; two missing referenced documents are declared dead. | 8 |
| A11 | Production runs in 4 waves; the game must run on placeholder rectangles first. | 10 |
