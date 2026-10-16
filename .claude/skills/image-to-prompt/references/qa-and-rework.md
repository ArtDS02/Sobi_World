# Checking output and reworking it

`cut` and `check` catch what a script can see. Art direction they cannot see — so look
at the candidates before approving.

## What the scripts catch

**`cut`** reports, per sheet, and exits non-zero if any of it fires:

| Message | Means | Usually |
|---|---|---|
| `found N row band(s), manifest says R` | the detected grid disagrees with the manifest | the model merged or dropped cells |
| `fell back to an even grid` | detection gave up; cells were split evenly | candidates will be misaligned — look before using |
| `cell is empty` | a grid position has no ink | the model drew fewer objects than asked |
| `ink reaches the sheet edge, may be clipped` | content runs into the canvas border | the sprite is cut off |

Band detection works by projecting the non-grey mask onto each axis and splitting on
gaps. That is exactly why the prompt demands wide empty gaps and a flat background:
**objects that touch each other cannot be separated**, and the fallback even grid will
slice through them.

**`check`** compares disk against the manifest — sheets generated, candidates cut,
assets approved, plus every manifest problem — and runs a mechanical pixel pass over
each candidate:

| Warning | Means |
|---|---|
| `no transparency - the background was not removed` | the flat was not flat, or the wrong `sheet_bg` |
| `N% transparent - almost nothing was kept` | the cut caught speckle instead of a sprite |
| `tiny (WxH)` | the cell was effectively empty |
| `Npx empty margin` | stray background pixels widened the trim |
| `N% transparent - a background should be opaque` | a `bg` asset came out with holes |
| `unknown prefix` | the asset name is outside the profile's naming scheme |

Sheets with `"trim": "uniform"` skip the transparency and margin checks: padding small
frames onto a shared canvas is the intended result there, not a defect.

None of this sees style, likeness or composition. Those still need your eyes.

## What you have to look at

Build a contact sheet and read it — cut candidates composited over a checkerboard so
transparency is visible:

```bash
python - <<'PY'
from PIL import Image
import glob
fs = sorted(glob.glob("art_inbox/.candidates/flower_*_a.png"))
ims = [Image.open(f).convert("RGBA") for f in fs]
w = max(i.width for i in ims); h = max(i.height for i in ims); cols = 4
sheet = Image.new("RGBA", (w*cols, h*((len(ims)+cols-1)//cols)), (255,255,255,255))
for n,(x,y) in enumerate((i%cols*w, i//cols*h) for i in range(len(ims))):
    sheet.alpha_composite(ims[n], (x,y))
sheet.convert("RGB").save("art_inbox/.qa/contact.png")
PY
```

Look for, in rough order of how often it happens:

- **Style drift** — the outline went black, the shading went glossy, the palette
  saturated. Usually means the style reference was the wrong family, or the cell
  descriptions described a style of their own.
- **Scale drift across a sheet** — cell 1 twice the size of cell 4. The model loses
  scale across a wide grid; add an explicit "the same scale for all three" to `extra`.
- **Text that got drawn anyway** on a plate or banner. Re-run; the negative line is
  already there, so this is a dice roll, not a prompt bug.
- **A hint copied as content** — the sheet reproduced the style reference's objects.
  The "Do NOT copy the objects of image 1" sentence is present; a re-run usually fixes it.
- **Grey halo on the cut edges** — the background was not flat. Check the sheet's
  corners; if they are not ~`#C8C8C8`, the model added a gradient and the sheet needs
  re-running rather than re-cutting.
- **Baseline jitter in a sequence** — stages at different heights. That is a `trim`
  problem, not a generation problem: set `"trim": "uniform"` and re-cut.

## Fixing: re-cut, re-prompt, or re-crop

Pick the cheapest one that can actually work.

| Symptom | Fix |
|---|---|
| cells detected wrong, sheet itself looks fine | adjust the manifest grid if it was wrong, then `cut --force` |
| sequence frames jump | `"trim": "uniform"`, then `cut --force` |
| halo, clipped sprite, merged cells, wrong style | re-run the sheet in Gemini |
| shape nearly right, proportions off | re-crop the hint and re-run — do not describe the fix in words |
| one asset of a good sheet is wrong | re-run that sheet into `--variant b`; keep `_a` |

A re-run is always a **new conversation** with the same attachments. Save it as
`<sheet>-2.png`, cut with `--variant b`, compare, approve the winner.

## Approving

```bash
python .claude/skills/image-to-prompt/scripts/art.py approve prop_fountain bld_cauldron
```

Copies `.candidates/<asset>_a.png` to `art_inbox/<asset>.png`. It refuses to overwrite
an approved asset without `--force`, because approved art is what the game reads and
silently replacing it is how a screen changes without anyone deciding it should.

Approve per asset, not per sheet. A sheet of four where three are good yields three
approvals and one retry — that is the whole point of cutting them apart.

## Reporting state

Use `status`. It has three separate columns — sheets generated, candidates cut, assets
approved — so "the prompts are written" can never be reported as "the art is done".
A batch with 3/3 sheets and 0/24 approved has had no art accepted yet.
