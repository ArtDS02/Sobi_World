# Spec map — which document answers what

Read **only** the rows/sections named here, by line range (`resolve.mjs` prints the line numbers).

## 1. Routing per asset family

| Family (id prefix) | Primary spec (what) | Secondary (filled concept / prompt) | Constraint (format) | Reference set |
|---|---|---|---|---|
| Pig skin `pig_*` | PIG_CATALOGUE §3–§13 row | AI pack §3.1/§3.2 row, §3 master, §1.3 negative | Standard §2, §4.1, §4.5, §5, §7; catalogue §1.2–§1.4, §22 (P4/P5) | `pig_classic` (anchor) + registry cell + ≤2 nearest accepted pigs |
| Sleep frame `pig_*_sleep` | Standard §3, §3.2 | AI pack §3.3 | Standard §4.1, §11.2 | the pig's **own accepted idle** + `pigs c5r2` (pose) |
| FX `fx_*` | Standard §3.1 | AI pack §4 | 256² / 64² (`fx_zzz` 3 frames) | CORE pig sheet sparkles/hearts (style only) |
| Core props `prop_feed_trough_*`, `prop_order_board` | ENV catalogue §1 | AI pack §5.1 | Standard §4.3; grass base + shadow baked | `style_reference_environment.png` row 2 |
| Buildings / scene props | ENV catalogue §2–§3 | AI pack §5.2 | Standard §4.3, sizes in ENV catalogue | env sheet rows 2–4 |
| Scene layers `env_*` | ENV catalogue §1A | — | Standard §7.3 | env sheet palette |
| UI icons `ui_icon_*`, `ui_btn_*` | ENV catalogue §4 | AI pack §6 | 128², readable at 44 px | env sheet palette |
| App icon `build/icon.png` | ENV catalogue §4.4 | — | 1024² | `pig_classic` |
| Cosmetics `acc_*` | **Out of v1** (CLAUDE.md, game spec §20.7) | AI pack §7 | Standard §4.2 | — |
| Crops | **Backlog** (ENV catalogue §5) | — | — | — |

## 2. Precedence

1. Art standard — format, views, states, canvas, naming, paths (always wins).
2. Manifest row — existing id, collection folder, rarity, price (wins over catalogue section for existing rows,
   e.g. `pig_knight` is `fantasy` in the manifest though catalogue §6 lists it under adventure).
3. AI pack concept — the detailed MUST-HAVE list where it exists (it is the executable form of the standard).
4. Catalogue row — existence, Vietnamese name, one-line concept, priority. If the pack has no row, expand the
   catalogue one-liner into MUST-HAVEs yourself: worn items only, "nothing held" (pack §3.2 note).
5. GAME_ART_DIRECTION — look. References never add content (a cell's extra scarf is not a spec item).

Never use: catalogue §23–§27, §31, §37 (superseded), `UN_IN_ASSET_LIST_v2/_v3` (never existed), `archive/`,
`DESIGN_README.md`.

## 3. Known conflicts (already decided — do not re-ask)

| Conflict | Decision |
|---|---|
| Request asks for front/back/left/right views | Standard A2: side-right only; left = flip. Multi-view consistency rules apply to idle ↔ sleep and to trough states / fx frames instead |
| Pack says "perfect side view profile"; CORE pigs have a 3/4-turned head | Reference decides the look: side body + 3/4 head. Prompt says so explicitly; keep pack's negative "three-quarter view" (it targets a 3/4 **body**) |
| Registry PARTIAL cells (`pig_farmer`, `pig_chef`, `pig_nerd`) differ from the pack concept | Already shipped as cuts. Report the gap; a fully spec-true version needs backend X |
| Cut pigs have no sleep frame (cut-reference drops `sleepAsset`, DECISIONS Q5) while standard §3.2 wants `_sleep` for P0/P1 | Allowed fallback (idle + `fx_zzz`). A real `_sleep` = backend X from the cut idle |
| Code-drawn P1 pigs (cowboy, knight, wizard, ghost, detective, christmas, tet) | OUTLIER (fail S7). Regenerate with X; they stay in the game until replaced |

## 4. Needs the user (BLOCKED / ask once)

- Pig has no manifest row → it becomes a new shop skin (price by pack §9 ladder). The request itself is the
  go-ahead: register `resolve.mjs`'s `proposed_row` and **say so in DONE** (id, price) so the user can veto.
  Ask only for P5 (unlock-only: no unlock rule exists) or if the user said "chỉ vẽ, chưa đưa vào game".
- Two normative docs disagree in a way §3 doesn't cover and the result differs visibly.
- Backend X needed and no image model is available in the session.
- A NEW reference that would be CORE but contradicts GAME_ART_DIRECTION (style change = product decision).
