# The prompt grammar

Every prompt this skill emits is assembled from fixed blocks in a fixed order. The
blocks come from the **art profile**, not from the sheet — they were tuned against real
Gemini output and reproduce the hand-written reference prompts byte for byte. Do not
reword them per sheet; the per-sheet voice lives in the cell descriptions and in
`extra` / `tail` / `framing`.

## The profile

`DEFAULT_PROFILE` in `scripts/art.py` holds one working style; `<art root>/profile.json`
overrides any part of it. Missing keys fall back, so a profile may be partial.
`art.py profile --init` writes the defaults out to edit.

| Key | What it controls |
|---|---|
| `style_line` | the image-1 instruction — **the one key every new project must rewrite** |
| `accepted_line` / `shape_line` | how the two hint types are introduced |
| `sheet_opener` / `single_opener` | the two non-edit openers |
| `separation_line` | the "wide empty gaps" clause that makes a sheet cuttable |
| `background_line` | the flat-background clause; `{hex}` and `{name}` are filled for you |
| `negative_line` | the closing ban list |
| `framing` | kind → framing clause; add project kinds here |
| `full_bleed_kinds` | kinds drawn edge to edge: no separation, no flat bg, never cut |
| `sheet_bg` / `sheet_bg_name` | the flat colour, as hex and in words — **change both** |
| `bg_tolerance` | how far from `sheet_bg` still counts as background when cutting |
| `prefixes` | name prefixes `check` recognises; empty list disables the check |

Two keys are load-bearing beyond their wording:

- **`sheet_bg` is shared by the prompt and the cutter.** `background_line` is formatted
  with it, and `cut` flood-fills that exact value. They cannot drift apart — which is
  the point. `sheet_bg_name` exists so the adjective cannot drift either.
- **`style_line` must end by disclaiming the reference's content.** The default closes
  with *"Do NOT copy the objects of image {n}."* Drop that sentence and the model
  redraws the style reference instead of the cells.

## Block order

```
1  STYLE REFERENCE line                     (image 1; omitted in edit mode)
2  one line per hint                        (image 2, 3, 4 ...)
   <blank>
3  opener                                   sheet grid | single object | edit instruction
4  Row 1: (1) ...; (2) ...                  sheet mode only
5  "extra"   — set-wide notes
6  framing clause                           from "kind", or overridden per sheet
7  "tail"    — per-row rules
   <blank>
8  separation clause                        sheet mode, non-full-bleed only
9  grey background clause                   non-full-bleed only
10 negative clause                          always last
```

`extra` and `tail` straddle the framing clause because real prompts need both sides:
*"All six are the same paper seed packet…"* belongs before it, *"Each row is ONE plant
in 4 growth stages…"* belongs after it.

## The fixed blocks

**Style reference** (always image 1): names the outline colour, the cel shading, the
light direction, the palette and the detail level, and ends with *"Do NOT copy the
objects of image 1."* That last sentence is load-bearing — without it the model
redraws the reference's content.

**Hint lines**, one per attachment, differing only in intent:

| `type` | Line | Use when |
|---|---|---|
| `accepted` | "Image N is the accepted look of **‹subject›**: match its shape, colours and shading closely, but leave out any text or letters." | the reference is already in the target style |
| `shape` | "Image N only shows the SHAPE idea for **‹subject›**. Ignore its style completely (its heavy outline, glossy look, cloud pedestal and captions are wrong for my game)." | the reference came from elsewhere |

`‹subject›` is a noun phrase that fits straight after "the accepted look of" — e.g.
`the wooden label plank`, `the Cloud Spring (a small pond sitting on a cloud)`.

**Openers**

- sheet: *"Draw ONE image: a sheet of N separate game sprites in a clean grid of R
  row(s) x C column(s), in exactly this order, left to right, top to bottom:"*
- single: *"Draw ONE image containing exactly one object, centred, fully visible, with
  empty space around it."* then *"The object: …"*
- edit: the instruction itself, verbatim, with no style block in front of it.

**Separation / background / negative** — the three closing lines that make the sheet
cuttable: wide gaps and nothing crossing cells; one flat `#C8C8C8` everywhere with no
gradient and no cast shadow; and the long negative that bans text, watermarks, frames,
gloss, 3D, pixel art, glow and particles.

The grey matters mechanically: `cut` flood-fills from each cell border at that exact
value. A gradient background, or a cast shadow on it, is what makes a cut come out with
a grey halo.

## Framing clauses by `kind`

Pick the `kind` that matches what the sheet draws; the profile supplies the clause.
`art.py kinds` prints the ones this project defines. An unknown `kind` with no
`framing` override is a validation error, not a silent empty line.

| `kind` | Clause (abridged) |
|---|---|
| `item` | front-on, centred, fills most of its cell, readable at 48 px; no ground, shadow, pedestal, container or button frame |
| `flora` | side view slightly above, upright, stem ends in a small mound of soil; no pot, grass patch, ground or platform |
| `building` | three-quarter from slightly above, each on a small patch of grass with flowers and a soft contact shadow |
| `building_cloud` | same, but standing on its own small fluffy cloud patch |
| `creature` | full body, cute and friendly, in the style of image 1 |
| `bg` | full-bleed 16:9 edge to edge, **no grey background**, low-contrast and desaturated, lower 60 % calm for gameplay |

`kind: bg` also switches off the separation and grey-background blocks, because a
background has neither.

Override with `"framing": "..."` when a sheet needs a combined sentence — the usual case
is folding the "match images 2 and 3 closely, but without …" clause into the framing:

> Match images 2 and 3 closely, but without any signs, text, trees or other objects
> around them. Three-quarter view from slightly above; each stands on a small patch of
> grass with a soft contact shadow.

A two-character sheet similarly overrides to *"Two characters, both full body, cute and
friendly, in the style of image 1."*

## Attachment naming

`prep` stages files under names that make "image N" unambiguous in the browser:

| Staged name | What it is |
|---|---|
| `1_style_<key>.png` | the style reference — always image 1 |
| `<SHEET>_<n>_hint.png` | hint at position n (2, 3, 4 …) |
| `<SHEET>_1_edit.png` | the screenshot being edited, in edit mode |

The user attaches them in listed order. That order is the only thing tying "Image 3" in
the prompt to a file, so never reorder by hand.

## Writing a new clause

If a sheet genuinely needs wording none of the kinds cover, put it in `framing` on that
sheet first. Only promote it into the profile's `framing` table once a **second** sheet
needs the same sentence — a one-off in the shared table is how a grammar turns into a
pile of near-duplicates.

## Retargeting to another project

1. `art.py profile --init` (once per art root).
2. Rewrite `style_line` to describe the new art: outline, shading, light, palette,
   texture, shape language, detail level — in that order, one sentence.
3. Rewrite the parenthetical in `shape_line` to describe what is wrong with the kind of
   off-style reference this project actually receives.
4. Replace `framing` with the kinds this project has, and `full_bleed_kinds` with the
   ones drawn edge to edge.
5. If the art is pale, move `sheet_bg` off light grey and set `sheet_bg_name` to match.
6. Set `prefixes` to the project's naming scheme, or `[]` to switch the check off.
7. `art.py profile` to confirm, then build one small batch and look at the result before
   committing to the wording.
