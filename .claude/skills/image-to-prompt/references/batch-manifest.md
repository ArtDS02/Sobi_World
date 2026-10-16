# `batch.json` — the manifest

One file per batch at `.batch/<batch>/batch.json`. It is the **only** thing you edit;
`PROMPT.md` is rendered from it and overwritten on every `prep`.

Every path is relative to the art root (`art_inbox/`), so the tree can be moved.

## Top level

```jsonc
{
  "batch": "cloud-01-flowers",          // must match the folder name
  "title": "Hoa Sobi Cloud: 6 loài × 4 giai đoạn",   // shown in the PROMPT.md heading
  "layout": ".ref/cloud-layout.png",    // the target layout; "" when there is none
  "note": "",                           // optional paragraph under the how-to
  "style_refs": {                       // key -> file; a sheet picks one by key
    "flora":    ".batch/cloud-01-flowers/1_style_flora.png",
    "building": "...", "item": "...", "creature": "...", "sky": "..."
  },
  "sheets": [ /* see below */ ]
}
```

Only style keys actually used by a sheet have to resolve, so a skeleton may carry spare
keys without failing validation.

## A sheet

```jsonc
{
  "id": "F1",                  // 1-2 chars, unique in the batch, becomes F1.png
  "title": "Cúc Mây + Bồ Công Anh Mây",
  "mode": "sheet",             // sheet | single | edit
  "kind": "flora",             // picks the framing clause; `art.py kinds` lists them
  "style": "flora",            // key into style_refs
  "grid": [2, 4],              // [rows, cols] - sheet mode only
  "refs": [                    // becomes image 2, 3, 4 ... in order
    { "type": "shape", "src": ".hints/cloud-01-flowers/F1_2_hint.png",
      "subject": "the seed packet (a small paper envelope with a flower picture on it)" }
  ],
  "rows": [                    // one array per row, one string per cell
    ["Cloud Daisy sprout", "...", "...", "..."],
    ["Cloud Dandelion sprout with jagged dandelion leaves", "...", "...", "..."]
  ],
  "extra": ["set-wide note placed before the framing clause"],
  "tail":  ["per-row rule placed after the framing clause"],
  "framing": "",               // optional: replaces the clause "kind" would supply
  "trim": "tight",             // tight (default) | uniform | none
  "anchor": "bottom-center",   // uniform only: bottom-center | bottom-left | center
  "assets": ["flower_cloud_daisy_sprout", "..."]   // reading order, one per cell
}
```

### Per mode

| mode | Required | Produces |
|---|---|---|
| `sheet` | `grid`, `rows`, `assets` (len == rows×cols), `style` | a grid of sprites to cut |
| `single` | `object`, exactly one asset, `style` | one object, cut whole |
| `edit` | `source`, `instruction`, `assets` | an edited screenshot, saved as-is |

`mode: edit` takes **no** style reference and no refs: its only attachment is the image
being edited, staged as `<SHEET>_1_edit.png`.

### `trim`

Controls what `cut` writes out.

- `tight` (default) — each sprite trimmed to its own ink. Right for anything the game
  positions individually.
- `uniform` — every sprite in the sheet padded onto one canvas, anchored the same way.
  **Required for stage/pose sequences**: frames swapped in place must share a baseline,
  or the plant jumps as it grows.
- `none` — no cut at all; the sheet image is the asset. Implied by `kind: bg` and by
  `mode: edit`.

## What `prep` refuses to render

Validation runs before anything is written, so a bad manifest never produces a prompt
that points at a missing file:

- a sheet with no `id`, a duplicate `id`, or an unknown `mode`
- a `kind` the profile does not define, with no `framing` override to stand in for it
- a `trim` other than `tight` / `uniform` / `none`
- `grid` whose `rows × cols` disagrees with the number of cell descriptions or assets
- a declared row count that disagrees with `grid[0]`
- an asset name that is not `lower_snake_case`
- **the same asset produced by two sheets** — one asset, one sheet, so a retry is local
- `style` naming a key that is not in `style_refs`
- a `refs` entry with no `src`, no `subject`, or a `type` other than `accepted`/`shape`
- any `src`, `source` or used `style_refs` value that is empty or not an existing file

Each problem is printed with the sheet id, and `prep` exits non-zero without touching
`PROMPT.md`.

## Worked examples on disk

Four manifests in this repo were reverse-engineered from the hand-written prompts and
reproduce them byte for byte — read them before writing a new one:

| Batch | Shows |
|---|---|
| `cloud-01-flowers` | 2×4 stage sequences, `tail`, `trim: uniform` |
| `cloud-02-items` | `shape` hints, `extra`, mixed 2×3 and 1×4 grids |
| `cloud-03-world` | `building_cloud`, two hints on one sheet, a `single` + `bg` sheet |
| `cloud-04-scene` | `mode: edit`, `accepted` hints, a `framing` override |
