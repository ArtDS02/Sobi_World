# Planning batches and sheets

A **batch** is one unit of work the user sits down to. A **sheet** is one Gemini
conversation producing one image.

## Sizing a batch

Name it `<area>-<nn>-<theme>`: `cloud-01-flowers`, `world-01-scene`. The number keeps
the order of work visible; the theme says what is inside.

Three to six sheets is a comfortable batch — roughly one sitting in the browser. Split
by **subject matter**, not by count, because a style reference is chosen per sheet and
mixing families means mixing references:

- the flora of an area
- the inventory icons of an area
- the buildings and plots
- the scene: background, signage, characters

A scene batch that edits a supplied screenshot is normally its own batch, because the
edit sheet must be done first — everything else is drawn to sit on top of its result.

## Sheet or alone?

| Situation | Shape |
|---|---|
| 2–8 things that must match each other | one `sheet`, grid |
| a full-bleed background | `single`, `kind: bg` |
| one character that needs the whole frame | `single` |
| removing UI/objects from a screenshot | `edit` |

**Grids that work:** 1×2, 1×3, 1×4, 1×5, 2×3, 2×4. Past eight cells the model starts
merging neighbours, dropping cells and drifting in scale across the sheet. 1×7 has been
used successfully for small flat icons, where there is little to get wrong.

**Put a row's worth of meaning in a row.** A 2×4 of two plants × four growth stages
reads as two rows of four, and the `tail` rule ("each row is ONE plant in 4 growth
stages drawn at the SAME scale") only makes sense because the layout matches it.

**Never split a matched set across sheets.** Two sheets are two conversations, and the
model will not hold scale or palette between them. If a set does not fit one grid, it is
a sign the set is really two sets.

## Ordering the sheets

Put them in `batch.json` in the order they should be run:

1. **Edits first.** The cleaned background determines where everything else sits.
2. **Buildings and large props**, which set the scale everything else is judged against.
3. **Characters.**
4. **Icons and UI**, which depend on nothing.

`PROMPT.md` renders them in manifest order, so the file is also the running order.

## Choosing the style reference

One per sheet, by `style_refs` key. Pick a reference **of the same family** as what the
sheet draws — a building reference for buildings, a creature reference for characters.
A style reference of the wrong family is the most reliable way to get the right palette
with the wrong forms.

Approved art from `art_inbox/` is the best style reference available: it is by
definition what the project already accepted.

## Budgeting attachments

A sheet gets at most four images: style + three hints. Each extra reference is another
thing the model tries to blend, and past three hints the sheet starts producing hybrids
of the hints rather than the cells described.

If a sheet needs more than three hints, it has too many cells. Split it — but split it
along a matched-set boundary, never through one.

## Retries without collateral damage

The whole layout is built so a single bad asset is a single cheap re-run:

- **one asset, one sheet** — `prep` enforces it, so regenerating sheet D cannot disturb
  the assets of sheet A
- **`art.py cut <batch> --sheet D`** re-cuts only that sheet
- **`--variant b`** writes `<asset>_b.png` beside `_a`, so a retry never destroys a
  candidate someone may still prefer
- **approval is a separate step**, so an approved asset is untouched by any amount of
  re-generation behind it

In the browser the equivalent is: a retry is a **new conversation**, saved as
`<sheet>-2.png`. Continuing the old conversation carries the previous attempt's mistakes
into the new one.
