# UN IN HOMEMADE — ENVIRONMENT CATALOGUE

> **Project:** Ủn Ỉn / UN IN HOMEMADE
> **Type:** Concept catalogue — **what** to draw for the farm world, structures, props and UI.
> **Format, naming, delivery:** `../ASSET_PRODUCTION_STANDARD_v1.md` — normative, wins over anything here.
> **Game rules:** `../../UN_IN_GAME_SPEC_v4_SOLO.md`
> **Ready-to-paste generation prompts:** `../AI_ASSET_GENERATION_PACK.md`
> **Style reference:** `../reference/style_reference_environment.png` — the strongest of the three concept sheets. Rows 2–4 are all usable references.

A previous version of this file said it extended `UN_IN_ASSET_LIST_v2_CHARACTERS_PROPS.md`. **That document does not exist and was never written.** Do not look for it.

---

# A4. BUILDING VISUAL STANDARD (2026-10-02 — wins over older notes below)

Source of truth: `style_reference_building_new.png` (Vietnamese signs, game semantics) and
`style_reference_building.png` (pig house without sign, windmill). Both are cut directly — never redrawn —
by `npm run art:buildings` (`scripts/cut-buildings.ts`) → `art_inbox/` → `npm run art:process`.

| Aspect | Standard (measured on the sheets) |
|---|---|
| Camera | three-quarter view from slightly above, one angle, never flipped |
| Silhouette | chunky, rounded, slightly squashed; roof ≈ 45 % of building height, big arched door (≈ 40 % of facade height) |
| Shape language | soft corners, bulging planks and stones, no straight technical lines |
| Outline | dark warm brown, ≈ 3 px on the sheet (≈ pig outline on screen), slightly uneven |
| Palette | red-tile roofs `#d8453a`, honey wood `#c98a4a`, cream plaster `#f3e2c0`, grey stone `#9a9a9a`, pastel blue water `#7cc8f0`, grass `#7cc04a` |
| Light | top-left; soft cel shadow bottom-right, highlight on top edges |
| Materials | wood planks with grain, clay tiles, rough stone, burlap, hay — no glass/metal except small fittings |
| Base | every item stands on its own grass tuft (baked contact shadow) |
| Detail | ≤ pig detail: one or two motifs per item (heart window, pig emblem, sign) |
| Signs | painted Vietnamese name boards replace the code text tag (`signed: true` in the layout) |
| Scale | one world factor for all items (`WORLD_SCALE` 1.2 sheet px → canvas px; older sheet ×0.83) so relative sizes stay as painted |

Canvas sizes now follow the cut (`scripts/assets/sizes.ts`), not the table in §2–§3 below.
Decor in the scene: windmill, red tree, hay bale, wheelbarrow, apple crate, fence, mushroom, veggie patch,
sunflowers, rock, bush (props without an action).

# 0. RULES THAT DIFFER FROM PIGS

Two deliberate inversions of the pig rules. Read these before generating anything here.

| | Pigs | Buildings / props |
|---|---|---|
| Ground | Fully transparent, no ground, no shadow | **Grass base is baked in and correct** — every structure sits on its own grass patch, as in the reference sheet |
| Shadow | Never baked | Baked contact shadow, or a `_shadow.png` companion — without it structures float when the ground texture changes |
| Facing | Side view facing right, one direction | Three-quarter view, one angle, no flipping |
| Canvas | 512 × 512 uniform | Per-asset, listed below |

Buildings never move, so baking the base is free. Pigs move, so it is not.

---

# 1. CORE MECHANIC PROPS — **P0, produce first**

These are the only environment assets the game cannot run without, because they are attached to mechanics in the game spec rather than to decoration.

| File | Size | Spec reference | Description |
|---|---|---|---|
| `prop_feed_trough_empty.png` | 384 × 256 | D17, §7.3, §8.6 | Long wooden trough, empty, visible grain, grass base |
| `prop_feed_trough_half.png` | 384 × 256 | D17 | Same trough, half filled with golden corn and grain |
| `prop_feed_trough_full.png` | 384 × 256 | D17 | Same trough, heaped full, a few kernels spilling over the rim |
| `prop_order_board.png` | 256 × 384 | D20, §8.14 | Wooden notice board on a post, 2–3 blank paper notes pinned with nails, grass base |

**Three trough states are required, not optional.** The trough gauge is in the top bar (spec §10.1), but the player must also be able to read the food level from the farm view without opening a panel — that glance is what teaches "stock up before you log off", which is the central lesson of the whole design. The three states map to `food == 0`, `0 < food <= capacity/2`, `food > capacity/2`.

The trough already exists as concept art in the reference sheet, row 2 column 2 (wooden trough with corn). The notice board can be derived from the wooden signpost in row 4.

---

# 1A. FARM SCENE LAYERS — **P0, wave 1** (new in game spec v4.1)

The farm scene (game spec §11.1) is built from layers. These are what make the game read as a place rather than pigs on a flat colour. All live in `public/assets/environment/`, are placed by the `layout` section of the manifest (standard §7.2), and use the same palette and top-left light as `reference/style_reference_environment.png`.

| File | Size | Description |
|---|---|---|
| `env_sky.png` | 1600 × 500 | Soft daytime sky gradient, pale blue to warm cream at the horizon, no sun disc |
| `env_cloud_1.png`, `env_cloud_2.png` | 384 × 160 | Fluffy rounded clouds, transparent, drift slowly |
| `env_hills_far.png` | 1600 × 300 | Rolling green hills, desaturated for distance, transparent top |
| `env_trees_mid.png` | 1600 × 260 | Row of round cartoon trees and bushes, transparent top |
| `env_ground_grass.png` | 512 × 512 | Seamless tileable grass with tiny flowers, no shadows, no objects |

Flat colour fills stand in when any layer is missing, so the scene always renders.

---

# 2. STRUCTURAL BUILDINGS (`sprites/buildings/`)

Decorative in v1 — they set the scene but carry no mechanic. Produce after wave 1.

| File | Size | Priority | Function |
|---|---|---|---|
| `prop_pig_house.png` | 512 × 448 | P1 | Wooden barn with a red tiled roof, heart-shaped window, ramp, hay inside |
| `prop_hay_shed.png` | 384 × 384 | P1 | Open wooden shelter storing stacked hay bales |
| `prop_water_well.png` | 256 × 384 | P1 | Brick stone water well with bucket and pulley |
| `prop_water_pump.png` | 256 × 320 | P2 | Blue hand pump over a stone basin, running water |
| `prop_windmill.png` | 384 × 512 | P2 | White mill with a red cap and rotating sails |
| `prop_fence_section.png` | 256 × 160 | P1 | Wooden rail fence, tileable horizontally |
| `prop_veggie_patch.png` | 384 × 256 | P3 | Garden plot — see §5, backlog |

Every entry in this section appears in the reference sheet rows 2–3 and can be traced rather than invented.

---

# 3. SMALL PROPS & DECORATION (`sprites/props/`)

| File | Size | Priority | Description |
|---|---|---|---|
| `prop_water_bowl.png` | 192 × 128 | P1 | Blue ceramic bowl with water and a pig-face emblem |
| `prop_mud_puddle.png` | 256 × 160 | P1 | Brown mud patch — the visual cue for a dirty farm |
| `prop_food_sack.png` | 192 × 224 | P1 | Burlap sack of golden corn kernels, pig emblem |
| `prop_apple_crate.png` | 256 × 256 | P2 | Wooden crate of fresh red apples |
| `prop_hay_bale.png` | 192 × 192 | P2 | Round tied straw bale |
| `prop_wheelbarrow.png` | 256 × 192 | P2 | Wooden barrow loaded with hay |
| `prop_barrel.png` | 160 × 192 | P2 | Banded wooden barrel |
| `prop_signpost.png` | 160 × 256 | P2 | Wooden arrow sign on a post |
| `prop_bush.png` | 192 × 128 | P2 | Green bush with small white flowers |
| `prop_rock.png` | 160 × 112 | P2 | Grey rounded boulder cluster |
| `prop_sunflower.png` | 192 × 256 | P2 | Bright yellow flowering sunflowers |
| `prop_mushroom.png` | 96 × 112 | P3 | Red toadstool with white spots |

---

# 4. UI ELEMENTS & ICONS (`sprites/ui/`)

**128 × 128 px, transparent PNG, glossy vector style, no grass base** — UI is the one category that follows neither the pig nor the building rules.

## 4.1 Status icons

| File | Spec reference |
|---|---|
| `ui_icon_hunger.png` | Bowl with a bone / food icon |
| `ui_icon_cleanliness.png` | Soap bubble / water drop |
| `ui_icon_health.png` | Red heart / green cross |
| `ui_icon_happiness.png` | Sparkling smile — **D18.** This icon was orphaned under spec v3, which had no happiness stat. v4 has one and it drives the sell multiplier, so this icon now has a real home in the selected-pig panel |
| `ui_icon_growth.png` | Upward sprout / arrow |
| `ui_icon_gold.png` | Gold coin stack |
| `ui_icon_xp.png` | Blue star |

## 4.2 New in v4 — icons the mechanics need

| File | Spec reference |
|---|---|
| `ui_icon_trough.png` | D17, §10.1 — trough gauge in the top bar, next to gold |
| `ui_icon_order.png` | D20 — bottom nav "Đơn hàng" |
| `ui_icon_collection.png` | §8.15 — bottom nav "Bộ sưu tập" |
| `ui_icon_skin.png` | D19 — skin shop tab |

## 4.3 Action buttons

| File | Action |
|---|---|
| `ui_btn_feed.png` | `feedPig` (§8.2) |
| `ui_btn_clean.png` | `cleanPig` (§8.3) |
| `ui_btn_clean_all.png` | `cleanAll` (§8.4) — **new in v4**, distinguish it clearly from the single-pig version, e.g. sparkles over three pigs |
| `ui_btn_heal.png` | `treatPig` (§8.5) |
| `ui_btn_breed.png` | `breedPigs` (§8.8) |
| `ui_btn_shop.png` | Shop |
| `ui_btn_fill_trough.png` | `fillTrough` (§8.6) — **new in v4** |

---

## 4.4 App icon — wave 1 (new in game spec v4.1)

| File | Size | Description |
|---|---|---|
| `build/icon.png` | 1024 × 1024 | `pig_classic` head and snout, three-quarter crop, on a rounded warm-cream tile; must read at 16 px. Converted to `build/icon.ico` (16–256 px) for the installer and shortcuts. |

---

# 5. CROPS & FARMING — **BACKLOG, do not produce yet**

> This whole section is game spec §20 item 1. It is **not in v1.** The concepts are good and the design is sound — home-grown food is free but takes real time, bought food is instant but costs gold — but the feed trough has to prove itself first. Producing these now means drawing assets for a system whose rules do not exist yet.

| File | Size | Type | Description |
|---|---|---|---|
| `prop_garden_bed_empty.png` | 256 × 192 | Structure | Soil plot with wooden frame borders |
| `crop_cabbage_grow.png` | 256 × 192 | Crop | Cabbage patch, 3 growth frames |
| `crop_corn_sack.png` | 192 × 224 | Item | Burlap sack of golden corn |
| `crop_apple_crate.png` | 256 × 256 | Item | Wooden crate of red apples |
| `crop_sunflower.png` | 192 × 256 | Decorative | Flowering sunflowers |

---

# 6. AUDIO INDEX (`audio/`)

> ⚠️ **Corrected.** A previous version of this file used keys like `sfx_pig_oink_happy`. Those never matched the keys in the game spec, so half the sounds would have been loaded under names no code referenced. The list below is the canonical one from game spec §12 and is the only one to use.

| Key | Trigger | Audio style |
|---|---|---|
| `music_farm` | Background loop | Gentle, warm, countryside, loops seamlessly |
| `ui_click` | Any button | Soft wooden tap |
| `ui_error` | Rejected action | Short low blip, not harsh |
| `pig_oink_happy` | Pig tapped, happiness ≥ 50 | High-pitched cute "ủn ỉn" |
| `pig_oink_hungry` | Pig tapped, hunger < 30 | Slow, low, complaining "ủnnn..." |
| `feed_munch` | Feeding or trough refill | Cute munching / crunching |
| `water_splash` | Cleaning | Gentle splash and bubble pop |
| `coin_collect` | Any positive gold change | Chime, coins jingling |
| `breed_chime` | Breeding confirmed | Soft two-note sparkle |
| `birth_fanfare` | Birth | Short festive flourish |
| `level_up` | Level up or growth stage change | Brass trumpet flourish |
| `notify` | Order appeared, trough empty | Light bell, non-alarming |

All audio must be original or CC0 and credited in `README.md` and the credits screen. `notify` and `ui_error` are the two the player hears most when something is wrong — keep both gentle, this is a relaxing game.

---

# 7. PRODUCTION ORDER

Matches production standard §10.

| Wave | Assets from this catalogue | Count |
|---|---|---|
| 0 | none — coloured rectangles stand in | 0 |
| 1 | §1 core mechanic props, §1A scene layers, §4.1 + §4.2 + §4.3 icons, §4.4 app icon | 4 + 6 + 18 + 1 |
| 2 | §2 P1 buildings, §3 P1 props, §6 audio (music + 11 effects) | 4 + 4 + 12 |
| 3 | §2 P2 buildings, §3 P2/P3 props | 2 + 9 |
| backlog | §5 crops | 5 |

---

# END OF ENVIRONMENT CATALOGUE

Companion documents:
- `../ASSET_PRODUCTION_STANDARD_v1.md` — format, directions, states, naming, delivery (normative)
- `../AI_ASSET_GENERATION_PACK.md` — ready-to-paste generation prompts
- `../animals/PIG_CATALOGUE.md` — the 116 pig concepts and 129 cosmetics
- `../../UN_IN_GAME_SPEC_v4_SOLO.md` — game rules
