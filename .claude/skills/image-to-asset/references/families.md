# Asset families — Sobi World (GĐ14)

One row per id prefix. Canvas = `scripts/assets/sizes.ts` (catalogue) or the standard (`pigs` 512², `ui` 128²);
`assets:check` enforces the standard ones. Style = Sobi Farm everywhere (owner decision 2026-10-12,
`asset/GAME_ART_DIRECTION.md`): the Sobi World mock-ups in `asset/reference/sobi_cloud|sobi_world` are
`CONTENT` (shape hints only). Board = style board of `references/style-boards.json` (image 1 of a prompt).

| Prefix | Canvas | View | Board | Fit (cut-sheet) | Backend | Notes |
|---|---|---|---|---|---|---|
| `pig_*` (species) | 512² | side right, 3/4 head (GAME_ART_DIRECTION §2) | creature | each → art:process ground line | G (sheet of idles), then sleep / wake from the **accepted idle** (Gemini edit) | qa.mjs S1–S7 apply; never the code kit |
| `flower_<id>_<stage>`, `crop_<id>_<stage>` | 152×132 | side, slightly above, plant only, base at the bottom | flora | **shared** (one row = one plant, 4 stages) | G | Stages `sprout grow ripe wilt`; no pot / plot / grass (the scene draws `plot_*` under it) |
| `plot_*` | 152×108 | three-quarter from above | building | shared when the sheet holds variants of one plot (`plot_soil`, `_wet`, `_locked`) | G | The bed itself; nothing stands on it |
| `fish_*` | 192×120 | side view facing **right** | creature | each | G | No water, no bubbles |
| `enemy_*` | 192² · 240² · bosses 320×360 | side view facing **left** (battle: party right, enemies left) | creature | each | G | Cute-not-scary; bosses one per sheet |
| `bld_*`, scene props | sizes.ts | three-quarter from slightly above, own base patch + contact shadow (standard §4.3) | building | each | G | Base patch = the Area's ground (grass on Farm/Garden, cloud on Cloud, sand/plank on Aquarium) |
| `bg_*` | 1600×900 | full-bleed scene | sky (Cloud) / building | backdrop (copied, art:process cover-fits) | G | Calm lower 60 %; image models give ~1344×768 → ×1.2 upscale is accepted for a soft backdrop |
| `ui_item_*` | 128² | front-on, centred, readable at 48 px | item | each | G; **K-derive** when the item is a picture of an existing sprite (fish icons from `fish_*`) | No container / frame |
| `ui_icon_*`, `ui_btn_*` | 128² | front-on | item | each | G or K (`scripts/art/icons.ts`) | Existing system icons stay |
| `fx_*` | 256² / 64² | front-on | — | — | K or runtime VFX (Phaser particles / tweens) | Prefer runtime VFX: no file |
| `npc_*` (new rows) | 512² (as pigs) | side right, 3/4 head | creature | each | G | Needs a manifest row + `content/shared/npcs.json` `artId` change → owner approval (GĐ14 says no content change) |

Animation is runtime (tweens: bob, squash, blink overlay, hit flash, lunge), not frame sheets: image
models cannot keep a character identical across frames. Exception: pig `sleep` / `wake` (manifest files).

## Choosing the backend

- **R** cut from a CORE sheet — only when the registry marks the cell as that asset (Farm pigs).
- **G** Gemini sheet via the owner (`workflows/batch.md`) — default for every new painted asset.
- **K** code — fx, simple system icons, and **K-derive**: an icon rendered from an accepted sprite
  (trim + fit into 128², same file through `art:process`), so the two never drift apart.
- **X** image tool inside the session — same prompts as G; use it if one ever becomes available.
