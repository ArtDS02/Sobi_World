# Reference analysis (only when ref-check exits 1)

The style profile (`asset/GAME_ART_DIRECTION.md`) and the registry
(`references/reference-registry.json`) already encode the analysed images. Re-analyse **only** the files
`ref-check.mjs` reports as NEW / CHANGED / MISSING.

## 1. Look once

Open the new image once. If it is a sheet, note the grid (cells, cell size) so cells can be addressed later
without reopening.

## 2. Classify against GAME_ART_DIRECTION §1–§5

| Class | Test | Effect |
|---|---|---|
| CORE | Matches §1–§5 on every axis (3/4 head with far eye ≈ half, head:body ≈ 1:1.6, warm dark outline ≈ 2 % H, 1 shadow + 1 highlight soft cel, top-left light, warm pastel) | May add precision to §1–§5 and new cells to the registry |
| VARIATION | Same style, adds new costumes/poses/props | Registry cells only (content evidence); §1–§5 unchanged |
| OUTLIER | Differs on ≥ 1 axis clearly (painterly, glossy 3D, frontal faces, big head, black outline, other lighting) | Registry entry with the reason; never an input to a brief |

For pig images also run `qa.mjs` on a cut-out of one pig (via a temporary `CUTS` entry or a manual crop into
`art_inbox/.candidates/`) — S7 and S3 settle most borderline cases objectively.

One new image never redefines the style. If a CORE-looking image contradicts §1–§5 (e.g. different
proportions), it is OUTLIER until the user decides to change the art direction (spec-map §4).

## 3. Record

1. Registry: add/replace the `files[]` entry (`sha16` from ref-check output, `class`, one-line `role`) and its
   `cells[]` (id mapping via `resolve.mjs --list <keyword>`; `match` EXACT/PARTIAL/STYLE/POSE; `cuttable` false
   if a scene/prop/particle is fused to the body).
2. GAME_ART_DIRECTION §7 change log: one row. Edit §1–§5 only for CORE, only additive.
3. Compatibility: after any §1–§5 edit run `qa.mjs` on every accepted pig
   (`for f in public/assets/pigs/base/*.png public/assets/pigs/skins/*/*.png ...`). Any newly failing
   reference-cut pig → revert the edit.
4. `ref-check.mjs` must exit 0 before continuing the asset run.
