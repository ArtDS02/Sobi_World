# UN IN HOMEMADE — AI ASSET GENERATION PACK

**Purpose:** Everything needed to generate the game's art with an AI image model and get production-ready files out the other end.
**Normative rules:** `ASSET_PRODUCTION_STANDARD_v1.md`. This pack is the executable form of that document.
**Concepts:** `animals/PIG_CATALOGUE.md`, `building/ENVIRONMENT_CATALOGUE.md`.
**Style reference:** `reference/style_reference_pigs.png`.

Everything in fenced blocks is meant to be copied and pasted as-is. Placeholders are written `{LIKE_THIS}`.

---

# 0. THE WORKFLOW

Generation is four steps and **step 3 is not optional**. No current image model reliably produces a correctly sized, correctly grounded, fully transparent sprite on the first try.

```text
1. GENERATE   ─ paste a prompt from §3–§7
2. TRIAGE     ─ reject against §2 before spending any time on it
3. PROCESS    ─ background, trim, ground line, canvas, filename  (§8)
4. REGISTER   ─ one row in public/assets/manifest/assets.json     (§9)
```

Budget roughly **3–5 generations per accepted asset.** For 17 pigs plus sleep frames that is around 150 generations. Plan for it rather than fighting the first bad result.

## 0.1 Which model

Any model that does flat vector-ish cartoon art and accepts a reference image. What actually matters:

- **Image-to-image or a style reference slot is close to mandatory.** 116 pigs generated independently from text will not look like one game — that is precisely how `reference/style_reference_pigs_alt.png` ended up in a different style from `reference/style_reference_pigs.png`. See §1.3.
- **Transparent output is a bonus, not a requirement.** Assume you will be removing backgrounds in step 3 anyway.

---

# 1. THE THREE UNIVERSAL BLOCKS

Every pig prompt is `STYLE + CHARACTER + CONCEPT + OUTPUT`, plus the negative prompt. Copy these once and keep them in a scratch file.

## 1.1 STYLE — never changes

```text
Cute 2D cartoon game art, chibi proportions, flat colors with soft cel-shading,
clean rounded outlines of even weight, warm pastel palette, friendly and playful
personality, polished casual mobile game sprite, consistent top-left lighting,
readable silhouette at small size.
```

## 1.2 OUTPUT — never changes for pigs

```text
Transparent background, isolated character, nothing but the character.
No ground, no floor, no grass, no shadow, no scene, no environment, no furniture.
No text, no letters, no caption, no filename, no watermark, no logo, no UI, no border.
512x512 px.
```

## 1.3 NEGATIVE PROMPT — paste into every single generation

```text
text, letters, words, numbers, watermark, logo, signature, caption, filename, label,
border, frame, background, gradient background, ground, floor, grass, shadow,
drop shadow, scene, environment, furniture, held objects, scene props,
multiple characters, character sheet, contact sheet,
front view, back view, three-quarter view, facing camera, facing left,
photorealistic, 3d render, blurry, extra limbs, deformed, cropped feet
```

Four entries in there exist because of defects actually present in the concept sheets, and removing them will reproduce those defects:

| Entry | Defect it prevents |
|---|---|
| `caption, filename, label` | `style_reference_pigs_alt.png` has "big. farmer png", "plg. nerd.png" burned into the image |
| `held objects, scene props, furniture` | The same sheet has a bathtub, a cauldron and a frying pan fused to pig bodies |
| `front view, back view, facing camera, facing left` | Enforces the one-direction rule (standard §2) |
| `cropped feet` | The 82% ground line needs all four feet present |

## 1.4 Style consistency — the single most important technique

Do **not** generate 17 pigs from 17 independent text prompts. Do this instead:

```text
1. Generate pig_classic until it is perfect. This is the anchor.
2. For every subsequent pig, pass the finished pig_classic.png as a style
   reference / img2img input with a low-to-medium strength (0.35–0.55),
   and put the new concept in the prompt.
3. For every _sleep frame, pass that pig's own finished idle frame as the
   reference, not pig_classic.
```

Step 2 is what keeps 116 pigs looking like one game. Step 3 is what keeps a pig's sleep frame recognisably the same animal — generated from the concept text instead, it comes back as a different pig wearing similar clothes.

---

# 2. TRIAGE — reject before you invest

Check in this order and stop at the first failure. Takes ten seconds and saves the ten minutes of step 3.

| # | Check | Reject if |
|---|---|---|
| 1 | Facing | Not a clean side profile facing right |
| 2 | Feet | Fewer than four feet visible, or feet cropped by the canvas edge |
| 3 | Text | Any letters, numbers or caption anywhere in the image |
| 4 | Scene | Any ground, grass, shadow, furniture, or object not worn on the body |
| 5 | Silhouette | Scale it to 128 px wide and look. If it reads as a blob, reject |
| 6 | Style | Outline weight or shading noticeably different from `pig_classic` |
| 7 | Pigness | No longer clearly a pig — costume has eaten the silhouette |

Checks 5 and 7 are the ones people skip. Check 5 is the whole point of the art direction: the pig is displayed small, and a design that only works at 512 px is a design that does not work. Check 7 is the catalogue's own silhouette rule (§1.4 there).

---

# 3. PIG PROMPT — master template

```text
Cute 2D cartoon game art, chibi proportions, flat colors with soft cel-shading,
clean rounded outlines of even weight, warm pastel palette, friendly and playful
personality, polished casual mobile game sprite, consistent top-left lighting,
readable silhouette at small size.

Single full-body pig character, perfect side view profile facing right,
all four feet visible and resting on the same invisible ground line,
centered composition, neutral or happy expression.

{CONCEPT}

The character must remain clearly recognizable as a pig.
Any costume is integrated into the pig silhouette and worn on the body.
Simple shapes and clean visual hierarchy suitable for a small mobile game sprite.

Transparent background, isolated character, nothing but the character.
No ground, no floor, no grass, no shadow, no scene, no environment, no furniture.
No text, no letters, no caption, no filename, no watermark, no logo, no UI, no border.
512x512 px.
```

## 3.1 P0 — breed defaults. Generate these four first

Without these the game has no art at all. All four exist as concept art in `reference/style_reference_environment.png`, top row, left to right in this order — use it as the img2img reference.

| id | `{CONCEPT}` |
|---|---|
| `pig_classic` | `A classic soft pink farm pig. Rounded body, small floppy ears, curly tail, dark hooves, rosy cheek blush, large friendly dark eyes. No costume, no accessories. This is the anchor design for the entire game.` |
| `pig_watermelon` | `A watermelon-themed pig. Bright green body with dark green vertical rind stripes, pale green belly, a small green leaf sprout growing from the top of the head, a few tiny black seed dots on the flank. Pink snout and ears kept. Cheerful open-mouth smile.` |
| `pig_superhero` | `A superhero pig. Periwinkle blue-purple body, a short red cape flowing from the shoulders tied with a red knot at the chest, confident determined eyebrows, small red mask accent. The cape is worn, not held.` |
| `pig_thienlong` | `A legendary divine pig. Warm golden-cream body with a soft glow, small white feathered wings on the back, a small ornate gold crown, a gold collar with a round amber bell pendant. Regal and serene expression. Subtle, readable, not overloaded with detail.` |

## 3.2 P1 — core skin set, generate after the P0 four

Pass the finished `pig_classic.png` as style reference for every one of these.

| id | Name (vi) | `{CONCEPT}` |
|---|---|---|
| `pig_white` | Heo Trắng | `A cream-white farm pig. Soft off-white body, pale pink snout, ears and hooves, gentle expression. No costume.` |
| `pig_black` | Heo Đen | `A charcoal black farm pig. Deep grey-black body with a soft blue sheen, one small white patch on the flank, pink snout, bright friendly eyes. No costume.` |
| `pig_brown` | Heo Nâu | `A warm chestnut brown farm pig. Rich brown body, cream muzzle and belly, darker brown hooves. No costume.` |
| `pig_farmer` | Heo Nông Dân | `A Vietnamese farmer pig wearing blue denim overalls with a single shoulder strap and a conical straw nón lá hat, a small green leaf between the lips. Clothing only, no basket, no tools, nothing held.` |
| `pig_chef` | Heo Đầu Bếp | `A chef pig wearing a tall white pleated chef hat and an orange neckerchief tied at the throat. Clothing only, no pan, no food, nothing held.` |
| `pig_nerd` | Heo Mọt Sách | `A studious pig wearing large round black-rimmed glasses and a soft green sweater vest, with a tidy brown side fringe. Clothing only, no books, no bag, nothing held.` |
| `pig_knight` | Heo Hiệp Sĩ | `A knight pig wearing polished silver plate armor on the chest and shoulders and a small silver helmet with a red plume. Armor only, no sword, no shield, nothing held.` |
| `pig_wizard` | Heo Pháp Sư | `A wizard pig wearing a tall pointed deep purple hat with a gold buckle band and a matching purple cloak with small gold star motifs. Clothing only, no staff, no cauldron, nothing held.` |
| `pig_cowboy` | Heo Cao Bồi | `A cowboy pig wearing a tan wide-brim cowboy hat and a red bandana around the neck, with a small brown leather vest. Clothing only, no rope, no gun, nothing held.` |
| `pig_detective` | Heo Thám Tử | `A detective pig wearing a brown deerstalker cap and a beige trench coat collar, with a small magnifying-glass charm hanging from the collar. Clothing only, nothing held.` |
| `pig_ghost` | Heo Ma | `A ghost-costume pig wearing a soft white sheet with two cut eye holes draped over the body, the pink snout and front hooves peeking out below, a small yellow bow on top. Costume only, no pumpkin bucket, nothing held.` |
| `pig_christmas` | Heo Giáng Sinh | `A Christmas pig wearing a red Santa hat with a white fur trim and pom-pom and a red scarf with white trim. Clothing only, no gifts, nothing held.` |
| `pig_tet` | Heo Tết | `A Vietnamese Lunar New Year pig wearing a red and gold áo dài style tunic with a small gold apricot-blossom motif and a red silk headband with a gold coin charm. Clothing only, no lanterns, no envelopes, nothing held.` |

**Note the repeated clause `nothing held`.** It is in all thirteen on purpose. Every "job" pig in `reference/style_reference_pigs_alt.png` came back holding its props — that is the failure this clause exists to prevent, and the reason the modular cosmetic system was not usable from those images. The chef's pan becomes `acc_prop_pan`, a separate 256 × 256 file that any pig can hold.

## 3.3 Sleep frames

Pass **that pig's own finished idle frame** as the reference.

```text
{STYLE block from §1.1}

The same pig character shown in the reference image, now lying down asleep on
its side, eyes closed in happy curves, peaceful content expression, legs tucked
under the body, head resting down, facing right.
Identical color palette, identical costume, identical outline weight and shading
style to the reference.

Transparent background, isolated character.
No bedding, no pillow, no blanket, no ground, no scene.
No text, no letters, no watermark, no logo.
512x512 px.
```

Produce `_sleep` for the 4 P0 pigs and the 13 P1 pigs only — 17 frames. Rarer skins fall back to their idle frame plus the `fx_zzz` overlay, which is fine because nobody watches a P4 pig sleep for long.

Usable pose references already exist in `reference/style_reference_pigs.png`: row 3 last column (pig asleep in a nightcap) and row 2 column 2 (pig lying in mud).

---

# 4. SHARED FX OVERLAYS — 8 files that serve all 116 pigs

These replace roughly 700 per-pig state images (standard §3). Generate them early; the game looks broken without them.

```text
Cute 2D cartoon game icon, flat colors with soft cel-shading, clean rounded
outlines, warm pastel palette, consistent top-left lighting, simple and readable
at very small size.

{CONCEPT}

Single isolated element on empty space. No character, no animal, no pig,
no background, no ground, no shadow, no text, no watermark.
Transparent PNG, {SIZE}.
```

| id | Size | `{CONCEPT}` |
|---|---|---|
| `fx_sick` | 256 | `A single large cartoon sweat drop in pale blue, next to a small sickly green swirl mark. Floating symbols only.` |
| `fx_pregnant` | 256 | `A soft pink rounded heart badge with a tiny white pig silhouette inside it, and two small sparkles.` |
| `fx_zzz` | 256 | `Three cartoon sleeping letter Z shapes in soft blue, ascending in size from small to large, in a gentle diagonal.` |
| `fx_heart` | 64 | `One small solid pink cartoon heart with a single white highlight.` |
| `fx_bubble` | 64 | `One small translucent soap bubble, pale blue-white with a crescent highlight.` |
| `fx_crumb` | 64 | `Two tiny golden brown food crumbs, irregular rounded shapes.` |
| `fx_sparkle` | 64 | `One small four-pointed star sparkle in pale gold with a soft glow.` |
| `fx_coin` | 64 | `One small gold coin seen face-on, with a simple rim and a soft highlight.` |

`fx_zzz` is the one exception to "no animation frames" — generate it as 3 separate files `fx_zzz_1/2/3.png` with the Z's at increasing opacity, or as one file animated by a tween. Either is acceptable.

---

# 5. BUILDINGS, PROPS AND THE TROUGH

**Rules invert here** (environment catalogue §0): the grass base **is** baked in, shadows **are** baked in, and the view is three-quarter, not side-on.

```text
Cute 2D cartoon game asset, chibi farm style, flat colors with soft cel-shading,
clean rounded outlines, warm pastel palette, consistent top-left lighting,
casual mobile game art, readable silhouette.

{CONCEPT}

Three-quarter view from slightly above. The object sits on a small rounded patch
of bright green grass with a soft contact shadow underneath.
Isolated object, transparent background outside the grass patch.
No characters, no animals, no text, no letters, no watermark, no logo, no border.
{SIZE} px.
```

## 5.1 P0 — core mechanic props

| id | Size | `{CONCEPT}` |
|---|---|---|
| `prop_feed_trough_empty` | 384x256 | `A long low wooden feeding trough made of warm honey-brown planks with visible grain and darker banding at each end, completely empty, a small carved pig-face emblem on the front panel.` |
| `prop_feed_trough_half` | 384x256 | `The same long wooden feeding trough, filled halfway with golden yellow corn kernels and grain, the fill level clearly below the rim.` |
| `prop_feed_trough_full` | 384x256 | `The same long wooden feeding trough, heaped completely full with golden yellow corn kernels and grain mounded above the rim, a few loose kernels spilling onto the grass.` |
| `prop_order_board` | 256x384 | `A wooden notice board on two posts, warm brown planks with a small pitched roof, three small blank cream paper notes pinned to it with round nails, the papers completely blank with no writing.` |

The three trough states must be **the same trough** — generate `_full` first, then use it as the img2img reference for `_half` and `_empty`. Three troughs that look different will read as three different objects when the level changes.

`prop_order_board` needs `the papers completely blank with no writing` stated explicitly, in the prompt as well as the negative. A notice board is the single strongest trigger for a model to generate text.

## 5.2 P1 — scene buildings and props

| id | Size | `{CONCEPT}` |
|---|---|---|
| `prop_pig_house` | 512x448 | `A small cozy wooden barn with a red tiled pitched roof, a heart-shaped window cut into the gable, an open arched doorway with a wooden ramp, straw visible inside, a small chimney, low wooden fence at one side, white daisies in the grass.` |
| `prop_hay_shed` | 384x384 | `An open-sided wooden shelter with a red tiled roof on four posts, two large round golden straw bales stacked underneath.` |
| `prop_water_well` | 256x384 | `A round grey stone brick well with a wooden roof on two posts, a rope and pulley, and a small wooden bucket hanging, water visible inside.` |
| `prop_fence_section` | 256x160 | `A simple wooden rail fence section, two horizontal rails and three posts, warm light brown, designed to tile seamlessly left and right.` |
| `prop_water_bowl` | 192x128 | `A shallow round blue ceramic pet bowl filled with clear water, a small white pig-face emblem on the side.` |
| `prop_mud_puddle` | 256x160 | `An irregular shallow brown mud puddle with a glossy wet surface and a few small darker spots, a little grass at the edges.` |
| `prop_food_sack` | 192x224 | `A cream burlap sack tied with twine, open at the top with golden corn kernels spilling out, a small brown pig-face emblem stamped on the front.` |

All seven appear in `reference/style_reference_environment.png` rows 2–4 and should be generated with that sheet as the style reference.

---

# 6. UI ICONS

```text
Cute 2D cartoon game UI icon, glossy vector style, flat colors with soft
cel-shading, clean rounded outlines, warm pastel palette, bright and readable
at small size, consistent top-left lighting.

{CONCEPT}

Single centered icon on empty space. No background, no ground, no grass,
no shadow, no container, no button frame, no text, no letters, no watermark.
Transparent PNG, 128x128 px.
```

## 6.1 Status icons

| id | `{CONCEPT}` |
|---|---|
| `ui_icon_hunger` | `A rounded cream food bowl filled with brown kibble, with a small bone shape resting on top.` |
| `ui_icon_cleanliness` | `A white soap bar with two pale blue bubbles floating above it.` |
| `ui_icon_health` | `A bright red rounded heart with a small white cross in the center.` |
| `ui_icon_happiness` | `A bright yellow round smiling face with rosy cheeks and two gold sparkles beside it.` |
| `ui_icon_growth` | `A green sprout with two leaves growing upward, with a small upward arrow behind it.` |
| `ui_icon_gold` | `A stack of three gold coins seen at a slight angle, warm yellow with bright highlights.` |
| `ui_icon_xp` | `A bright blue five-pointed star with a soft glow and one white highlight.` |

## 6.2 System icons (new in v4)

| id | `{CONCEPT}` |
|---|---|
| `ui_icon_trough` | `A small wooden feeding trough seen from the front, filled with golden corn kernels.` |
| `ui_icon_order` | `A cream scroll of paper partly unrolled, with a red wax seal at the bottom. No writing on the paper.` |
| `ui_icon_collection` | `A closed brown leather book with gold corner fittings and a gold star on the cover.` |
| `ui_icon_skin` | `A small pink t-shirt on a wooden hanger, with a gold sparkle at one corner.` |

## 6.3 Action buttons

| id | `{CONCEPT}` |
|---|---|
| `ui_btn_feed` | `A cream food bowl with golden corn kernels heaped in it and one green leaf.` |
| `ui_btn_clean` | `A wooden scrub brush with cream bristles and three pale blue soap bubbles.` |
| `ui_btn_clean_all` | `A wooden scrub brush with cream bristles, with three gold sparkles and three small pale blue bubbles arranged in an arc around it, suggesting many at once.` |
| `ui_btn_heal` | `A small glass syringe with pale green liquid, crossed with a white bandage plaster.` |
| `ui_btn_breed` | `Two overlapping pink hearts, the front one slightly smaller, with a small gold sparkle.` |
| `ui_btn_shop` | `A small market stall with a red and white striped awning and a wooden counter.` |
| `ui_btn_fill_trough` | `A cream burlap sack tipping golden corn kernels down into a small wooden trough below it.` |

`ui_btn_clean` and `ui_btn_clean_all` must be **clearly distinguishable at 44 px** — that is why the "all" version gets the arc of sparkles rather than a subtle badge. Test both at target size side by side before accepting either.

---

# 7. COSMETICS

```text
Cute 2D cartoon game asset, rounded shapes, soft cel-shading, warm pastel
palette, clean edges, consistent top-left lighting, readable at small size.

{CONCEPT}

Single isolated modular accessory shown in side view facing right, sized and
angled to be worn by a chibi pig character.
No pig, no animal, no head, no body, no mannequin, no stand, no hand holding it.
The item alone on empty space.

Transparent PNG, 256x256, no background, no ground, no shadow,
no text, no watermark, no logo.
```

The explicit `no pig, no animal, no head, no body, no mannequin, no stand, no hand` list is necessary. A short "no pig body" is routinely ignored by image models on accessory prompts — they draw the wearer anyway, because almost every training image of a hat contains a head.

## 7.1 Core cosmetic set — matches the catalogue §33 P1 list

| id | Slot | Sym | `{CONCEPT}` |
|---|---|---|---|
| `acc_head_non_la` | head | ✓ | `A Vietnamese conical straw hat, nón lá, pale golden woven straw with a fine radial weave pattern and a thin red chin cord.` |
| `acc_head_straw_hat` | head | ✓ | `A wide-brim straw sun hat in warm honey straw with a green ribbon band and a small white daisy tucked into it.` |
| `acc_head_chef` | head | ✓ | `A tall white pleated chef toque with a soft rounded puffed top and a banded base.` |
| `acc_head_glasses` | face | ✓ | `A pair of round black-rimmed spectacles with pale blue-tinted lenses and a thin bridge.` |
| `acc_head_crown` | head | ✓ | `A small ornate gold crown with five rounded points, each tipped with a small red gem, and a jewelled band.` |
| `acc_head_pirate` | head | ✗ | `A black tricorn pirate hat with a white skull and crossbones emblem and a red band, together with a black eye patch on a thin strap.` |
| `acc_head_nightcap` | head | ✓ | `A soft blue floppy sleeping cap with small yellow star patterns and a white pom-pom at the drooping tip.` |
| `acc_head_wizard` | head | ✓ | `A tall pointed deep purple wizard hat with a slightly bent tip, a gold buckle band, and small gold star motifs.` |
| `acc_body_cape_red` | back | ✗ | `A short red hero cape flowing backward, with a gold clasp and a rounded lower hem.` |
| `acc_body_wings_fairy` | back | ✓ | `A pair of translucent pastel fairy wings, pale pink and mint, with fine darker vein lines and a soft sparkle.` |
| `acc_body_satchel` | body | ✗ | `A small brown leather satchel bag with a buckled flap and a shoulder strap.` |
| `acc_prop_basket` | prop | ✗ | `A woven wicker basket with a curved handle, containing a few green leafy vegetables.` |
| `acc_prop_sword` | prop | ✗ | `A short cartoon sword with a silver blade, a gold crossguard and a brown wrapped grip.` |
| `acc_prop_shield` | prop | ✗ | `A small rounded heater shield, steel grey with a gold rim and a red heart emblem at the center.` |
| `acc_prop_book` | prop | ✗ | `A closed thick book with a brown leather cover, gold corner fittings and cream page edges. No writing on the cover.` |
| `acc_prop_magic_staff` | prop | ✗ | `A wooden wizard staff with a gnarled top holding a glowing pale blue crystal orb, with small sparkles.` |
| `acc_prop_pan` | prop | ✗ | `A black cast-iron frying pan with a long handle, seen from the side, with a small golden fried egg in it.` |
| `acc_fx_sparkle_aura` | fx | ✓ | `A ring of small gold and white sparkles of varying sizes arranged in an oval halo shape, empty in the middle.` |

**Sym ✗ means the item ships a mirrored `_flip.png` companion** (standard §2.3). Generate the flip by mirroring the accepted file in an image editor — do **not** regenerate it, or the two facings will be different objects.

`acc_prop_pan` is on this list deliberately: it is the frying pan that was fused into the chef pig in `reference/style_reference_pigs_alt.png`. Split out as a prop it works on all 116 pigs.

---

# 8. POST-PROCESSING — step 3, mandatory

Per accepted image. Scriptable; a small ImageMagick or Python/Pillow script is worth writing after the first ten.

## 8.1 Pigs and cosmetics

```text
1. Remove background      → full alpha. Check the edges at 400% zoom for a
                            light halo; models trained on white backgrounds
                            leave one and it shows as a glow in-game.
2. Trim transparent edges → get the true bounding box.
3. Scale                  → so the character occupies about 86% of the canvas
                            height, leaving headroom for tall hats.
4. Place on 512x512       → horizontally centered; position vertically so the
                            LOWEST HOOF PIXEL sits at y = 420  (= 82% of 512).
                            This is the ground line. It is the same number for
                            every pig and it is what stops the farm looking broken.
5. Export                 → PNG-32, no interlace.
6. Name                   → standard §7.1. lowercase snake_case, no version suffix.
7. Anchors                → write <pig_id>.anchors.json next to it (standard §5).
                            Only for base pigs, not cosmetics.
```

Step 4 is the one that cannot be eyeballed. Measure the lowest non-transparent pixel and compute the offset.

Cosmetics use the same pipeline with a 256 × 256 canvas and no ground-line rule — they are positioned by anchor instead.

## 8.2 Buildings and props

Same, except: keep the grass base and contact shadow, do not apply a ground line, and place the object so the grass patch bottom sits near the canvas bottom with a few pixels of margin.

## 8.3 Verification before accepting

- [ ] Opens with a transparent background in an image viewer that shows alpha
- [ ] No light halo at the edges at 400% zoom
- [ ] Lowest hoof pixel at y = 420 on a 512 canvas (pigs only)
- [ ] Legible when scaled to 128 px wide
- [ ] Side by side with `pig_classic.png`, reads as the same game
- [ ] Filename correct, no spaces, no capitals, no `_final2`
- [ ] Registered in `assets.json`

---

# 9. REGISTRATION — step 4

Nothing is in the game until it has a row in `public/assets/manifest/assets.json`. The game spec requires final art to be swappable with no code change, and this file is the mechanism — **adding a skin is one row plus two PNGs, never a TypeScript edit.**

```json
{
  "id": "pig_wizard",
  "status": "production",
  "nameVi": "Heo Pháp Sư",
  "collection": "jobs",
  "rarity": "P1",
  "priceGold": 2000,
  "allowedBreeds": "ALL",
  "asset": "pigs/skins/jobs/pig_wizard.png",
  "sleepAsset": "pigs/skins/jobs/pig_wizard_sleep.png",
  "anchors": "pigs/skins/jobs/pig_wizard.anchors.json",
  "tags": ["wizard", "magic", "fantasy"]
}
```

```json
{
  "id": "acc_head_pirate",
  "status": "production",
  "nameVi": "Mũ Cướp Biển",
  "slot": "head",
  "rarity": "P2",
  "symmetric": false,
  "asset": "pigs/cosmetics/head/acc_head_pirate.png",
  "assetFlip": "pigs/cosmetics/head/acc_head_pirate_flip.png",
  "compatibleTags": ["adventure", "classic"],
  "tags": ["pirate", "adventure"]
}
```

Full schema (manifest v2 — environment, audio, layout, frames, credits): standard §7.2. Replacing a placeholder keeps the row's `id` and path and changes `status` to `production`; `npm run assets:check` (standard §7.4) must pass before the commit. Cosmetic rows stay out of the v1 manifest (game spec §20 item 7). Price ladder by rarity: P1 = 2,000, P2 = 6,000, P3 = 15,000, P4 = 40,000, P5 = unlock only (game spec §6.6, tunable).

---

# 10. THE COMPLETE WAVE 1 + WAVE 2 SHOPPING LIST

Everything needed for a game that looks finished. **71 images**, plus 18 cosmetics.

| Group | Files | Where |
|---|---|---|
| P0 pigs | 4 | §3.1 |
| P0 pig sleep frames | 4 | §3.3 |
| Shared FX overlays | 8 | §4 |
| Core mechanic props | 4 | §5.1 |
| UI status icons | 7 | §6.1 |
| UI system icons | 4 | §6.2 |
| UI action buttons | 7 | §6.3 |
| **Wave 1 subtotal** | **38** | game is fully playable and looks finished with 4 pigs |
| P1 pigs | 13 | §3.2 |
| P1 pig sleep frames | 13 | §3.3 |
| Scene buildings and props | 7 | §5.2 |
| **Wave 2 subtotal** | **33** | skin shop has stock, farm has scenery |
| Core cosmetics | 18 + 9 flip | §7.1 |

At 3–5 generations per accepted asset, wave 1 is roughly 150 generations and wave 2 roughly 130. Do wave 1 completely before starting wave 2, and play the game in between — the point of wave 1's cut line is that it is the smallest set that lets you judge whether the game is worth more art.

Before any of this, **wave 0**: four coloured rounded rectangles named `pig_classic.png`, `pig_watermelon.png`, `pig_superhero.png`, `pig_thienlong.png`. The game must run on those. That is not a joke requirement — it is what proves the manifest swap works before 73 real files depend on it.
