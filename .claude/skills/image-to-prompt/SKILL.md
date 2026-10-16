---
name: image-to-prompt
description: >-
  Turn a target layout image (a game screen mockup, a reference screenshot, a scene
  concept) plus optional style references into a complete, ready-to-paste plan for
  generating the game art with the Gemini website — no paid API. Analyses the layout
  into separate assets, writes a batch manifest, crops hint images, decides what
  becomes a sprite sheet and what is drawn alone, renders copy-paste prompts, then
  cuts the generated sheets back into transparent per-asset PNGs and checks them
  against the manifest. Use this skill WHENEVER the task involves producing game art
  from a picture: "tách asset từ layout này", "làm prompt Gemini cho màn này",
  "dựng batch ảnh", "cắt sheet ra sprite", "kiểm tra ảnh vừa tạo" — and whenever a
  layout/mockup image is handed over as the source for art.
---

# Layout image → Gemini prompts → game assets

One target layout goes in. What comes out is a folder the user can work through sheet
by sheet with nothing but a browser: each sheet has its attachments already staged, a
prompt to paste, and an exact filename to save the result as. Then the same toolkit
cuts those results back into per-asset transparent PNGs and tells you what is missing.

**No API, no paid service.** Image generation happens by hand on
gemini.google.com or aistudio.google.com. This skill does everything around it.

## The pipeline

```
layout.png  ──analyse──►  batch.json  ──prep──►  PROMPT.md + staged attachments
                 ▲                                        │
                 │                                   (human: Gemini)
            hint crops                                    ▼
                                             <SHEET>.png in the batch folder
                                                          │
                                                        cut
                                                          ▼
                             .candidates/<asset>_a.png  ──check──►  report
                                                          │
                                                      approve
                                                          ▼
                                              art_inbox/<asset>.png
```

Every step except the Gemini one is a command:

```bash
python .claude/skills/image-to-prompt/scripts/art.py <init|hint|prep|cut|check|approve|status>
```

Full CLI: [scripts/README.md](scripts/README.md).
Hướng dẫn tiếng Việt cho người dùng: [references/HUONG-DAN-SU-DUNG.md](references/HUONG-DAN-SU-DUNG.md).

## The art profile — what makes this reusable

Nothing about one game's look lives in the code. The style sentence, the hint wording,
the flat background colour, the set of asset kinds and the name prefixes all come from
an **art profile**: built-in defaults, overridden by `<art root>/profile.json`.

```bash
art.py profile          # what is active right now
art.py profile --init   # write the defaults out as an editable file
art.py kinds            # the framing clauses a sheet can pick
```

Retargeting to a different game is editing that file — a different outline, a dark flat
instead of a light one, extra kinds like `tile` or `portrait` — not forking the script.
Keys you delete fall back to the default, so a partial profile is valid.
Details: [references/prompt-grammar.md](references/prompt-grammar.md) → *The profile*.

## Folder contract

Everything lives under one **art root** (`art_inbox/` by default; `--root` to change).

| Path | What it holds |
|---|---|
| `art_inbox/<asset>.png` | **Approved** assets. The only files the game should read. |
| `art_inbox/profile.json` | This project's art style. Absent = built-in defaults. |
| `.batch/<batch>/batch.json` | The manifest — the single source of truth for a batch. |
| `.batch/<batch>/PROMPT.md` | **Generated.** Never hand-edit; `prep` overwrites it. |
| `.batch/<batch>/<attachments>` | Staged by `prep`, named so the prompt's "Image 2" is unambiguous. |
| `.batch/<batch>/<SHEET>.png` | What the user saved back from Gemini. |
| `.candidates/<asset>_a.png` | Cut, background removed, **not yet approved**. `_b`, `_c` = retries. |
| `.hints/<batch>/` | Crops taken out of the layout by `hint`. |
| `.ref/` | The layout images themselves. |
| `.qa/` | Screenshots and crops used while reviewing. |

**A prepared prompt is not a generated image.** `status` keeps the three columns apart
— sheets generated, candidates cut, assets approved — precisely so "I wrote the prompt"
is never reported as "the art exists".

## How to run a new layout

> **STEP 0 — read the layout before touching a command.**
> [references/layout-analysis.md](references/layout-analysis.md) is the judgment half of
> this skill: which parts of the picture are separate assets, which are background and
> must stay painted in, and which already exist and must not be regenerated.

1. **Inventory existing assets first.** `ls art_inbox/*.png` and
   `ls art_inbox/.candidates/`. Anything already there is reuse, not work. Reusing is the
   default; a second version of an existing asset needs a reason you can state.
2. `art.py init <batch> --layout <png>` — scaffolds `batch.json` and files the layout
   under `.ref/`.
3. **Fill the manifest.** Assets, names, grids, descriptions, which style reference each
   sheet uses. Schema: [references/batch-manifest.md](references/batch-manifest.md);
   wording: [references/prompt-grammar.md](references/prompt-grammar.md).
4. **Crop the hints** the manifest refers to: `art.py hint <batch> --sheet A --index 2
   --box X,Y,W,H`. Crop only — never rescale, never squash to a target size.
   Don't guess coordinates: `art.py ruler <layout>` writes a labelled grid copy to
   `.qa/` to read them off, and the crop itself is the check — look at it.
5. `art.py prep <batch>` — validates, stages every attachment, writes `PROMPT.md`.
   It **fails loudly** rather than writing a prompt that refers to a file that is not there.
6. **Hand `PROMPT.md` to the user.** They work sheet by sheet in the browser.
7. `art.py cut <batch>` once sheets come back, then `art.py check <batch>`.
8. `art.py approve <asset>...` for the ones that passed review.

## The three rules

1. **Reuse before generating.** Search `art_inbox/` and `.candidates/` for an existing
   asset before putting it in a manifest. The expensive resource here is the user's time
   in a browser, and every duplicate sprite is a continuity bug later.
2. **One asset, one sheet.** An asset name appears in exactly one sheet of a batch —
   `prep` refuses otherwise. Regenerating one asset must never force a re-run of others,
   which is why sheets stay small and a retry writes `_b` instead of overwriting `_a`.
3. **The manifest is the truth; `PROMPT.md` is a render of it.** The profile is the
   truth about style; a prompt is a render of both. Fixing a prompt means
   fixing `batch.json` and re-running `prep`. A hand-edit to `PROMPT.md` is destroyed by
   the next `prep` and leaves the manifest lying about what was asked for.

## What goes on one sheet

A sheet is one Gemini conversation producing one image. Group so the grid stays
readable and so things that must *match each other* are drawn together.

- **Same family, drawn together.** Growth stages of one plant, a set of buttons, one
  character's poses: same sheet, so scale and palette are consistent by construction.
- **Keep grids small.** 1×2 to 2×4 works. Past ~8 cells the model starts merging cells
  and dropping items.
- **A full-bleed background is always alone** (`mode: single`, `kind: bg`) — it has no
  grey background and nothing to cut.
- **Editing a supplied screenshot is its own sheet** (`mode: edit`): one attachment, an
  instruction that names what to remove and what to keep, no style reference.

Details and the reasoning: [references/batch-planning.md](references/batch-planning.md).

## Checking what came back

`check` compares disk against the manifest and `cut` reports per-cell defects, but
neither can see art direction. Look at the cut candidates before approving —
[references/qa-and-rework.md](references/qa-and-rework.md) lists the defects that are
worth a re-run, how to re-run just one sheet, and which ones are cheaper to fix by
re-cropping than by re-prompting.

## Common mistakes

- Writing a prompt for an asset that already exists in `art_inbox/`.
- Hand-editing `PROMPT.md` instead of `batch.json`.
- Putting an asset in two sheets of the same batch, so one retry invalidates both.
- Cropping a hint and rescaling it to a square — the shape *is* the information.
- Treating the style reference as content: it is attached to be copied as **style**, and
  every prompt says so explicitly. Do not describe its objects in the cell list.
- Reporting a batch as done when only `PROMPT.md` exists. `status` has three separate
  columns for exactly this.
- Letting a growth/stage sequence be cut tight per frame, so the sprite jumps between
  stages. Those sheets get `"trim": "uniform"`.
- Carrying this project's `style_line` into a different game. Run `profile --init` and
  rewrite it; an unchanged style sentence quietly asks for the wrong art.
- Changing `sheet_bg` without changing `sheet_bg_name`, so the prompt asks for "a flat
  light-grey colour (#202020)" and the model has to pick which half to believe.
