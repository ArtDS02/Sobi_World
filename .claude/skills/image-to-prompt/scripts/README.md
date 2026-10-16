# `art.py` — the toolkit

One script, seven subcommands, covering everything in the pipeline except the Gemini
step itself. Requires **PIL + numpy** only (both already installed here).

```bash
python .claude/skills/image-to-prompt/scripts/art.py <command> [options]
```

`--root <dir>` picks the art root; it defaults to `art_inbox` relative to the current
directory. Run from the theme root.

---

### `init <batch> --layout <png> [--title "..."] [--force]`

Scaffolds `.batch/<batch>/batch.json` from a skeleton and copies the layout to
`.ref/<batch>-layout.png`, printing its dimensions. Refuses to clobber an existing
manifest without `--force`.

### `hint <batch> --sheet <ID> --box X,Y,W,H [--index N] [--source <png>] [--role hint|edit] [--pad N] [--out <dir>]`

Crops a region out of the layout (or `--source`) into
`.hints/<batch>/<ID>_<N>_hint.png` and prints the path to paste into the manifest.

**Crops only — never rescales.** Coordinates are pixels in the source image.
`--pad` grows the box on all four sides, clamped to the image. `--index` is the
attachment position the hint will occupy (2, 3, 4 …).

### `prep <batch>`

Validates the manifest, stages every attachment into the batch folder under its
canonical name, and renders `PROMPT.md`. Prints the sheet count, how many attachments
were staged and how many assets the batch promises.

**Exits 1 and writes nothing** if validation fails — the full list is in
[../references/batch-manifest.md](../references/batch-manifest.md).

Output is always LF, so regenerating does not produce a whole-file diff on Windows.

### `cut <batch> [--sheet ID]... [--variant a] [--force]`

Splits each generated `<SHEET>.png` into `.candidates/<asset>_<variant>.png`.

Cells are found by projecting the non-background mask onto each axis and splitting on
gaps, then checked against the manifest grid; on a mismatch it says so and falls back to
an even grid. The background is removed by flood-filling `#C8C8C8` **from each cell's
border**, so a grey area inside an object survives. Sprites are then trimmed to their
own ink, or padded to a shared canvas when the sheet sets `"trim": "uniform"`.

Skips candidates that already exist unless `--force`. Use `--variant b` for a retry so
the previous candidate is kept. Exits 1 if anything looked wrong.

### `check <batch>`

Prints manifest problems, then counts: sheets generated, candidates cut (naming each
missing one), assets approved. Also runs a mechanical pixel pass over every candidate —
no transparency, almost-all transparency, tiny output, a wide empty margin, an opaque
background that should be opaque, unknown name prefixes. Sheets with `trim: uniform`
skip the padding-related checks. Exits 1 if anything is outstanding.

### `profile [--init] [--force]`

With no flags, prints the active profile: where it came from, the flat colour and
tolerance, the full-bleed kinds, the kinds available, the prefixes, and the style line
as the model will see it.

`--init` writes `<root>/profile.json` containing the built-in defaults, ready to edit.
Every key is optional — delete one and it falls back. This is how the skill is pointed
at a different game; see
[../references/prompt-grammar.md](../references/prompt-grammar.md) → *Retargeting*.

### `kinds`

Prints each `kind` the profile defines with its framing clause, marking the full-bleed
ones. Read it before choosing a sheet's `kind`.

### `ruler <image> [--step N]`

Writes `<root>/.qa/<name>-ruler.png` — the image with a magenta coordinate grid drawn
over it, minor lines every `--step` px (auto by default) and labelled major lines every
five. Use it to read `hint --box X,Y,W,H` coordinates off an unfamiliar layout instead
of guessing.

### `status`

One row per batch — sheets / cut / approved. Batches without a `batch.json` are listed
as hand-written.

### `approve <asset>... [--variant a] [--force]`

Copies `.candidates/<asset>_<variant>.png` to `art_inbox/<asset>.png`. Will not
overwrite an approved asset without `--force`.

---

## A full run

```bash
python .claude/skills/image-to-prompt/scripts/art.py init garden-02-props --layout template/garden.png
# edit .batch/garden-02-props/batch.json
python .claude/skills/image-to-prompt/scripts/art.py hint garden-02-props --sheet A --box 320,150,260,240 --pad 8
python .claude/skills/image-to-prompt/scripts/art.py prep garden-02-props
#   -> hand art_inbox/.batch/garden-02-props/PROMPT.md to the user
#   -> they save A.png, B.png ... back into that folder
python .claude/skills/image-to-prompt/scripts/art.py cut   garden-02-props
python .claude/skills/image-to-prompt/scripts/art.py check garden-02-props
python .claude/skills/image-to-prompt/scripts/art.py approve prop_garden_bench prop_garden_arch
```

## Notes

- Paths inside a manifest are relative to the art root; printed paths include the root
  folder name so they can be pasted into a shell.
- `PROMPT.md` is generated. Edit `batch.json` and re-run `prep`; a hand edit is lost.
- The `#C8C8C8` background and the "wide empty gaps" clause in the prompt are what make
  `cut` work. Changing those prompt constants breaks cutting.
