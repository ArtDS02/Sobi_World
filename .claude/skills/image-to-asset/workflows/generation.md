# Generation — pick the backend

| Backend | Use when | Style fidelity | Autonomy |
|---|---|---|---|
| **R** reference cut | Registry cell for this id is EXACT (or PARTIAL and the gap is acceptable/reported), `cuttable: true` | Identical to reference | Full |
| **R+tint** | Plain recolour of a CORE pig (coat colour variants like `pig_white`, `pig_brown`) | Identical shading | Full |
| **X** image model + references | New concept, PARTIAL gap not acceptable, any sleep frame, regenerating OUTLIER pigs | High if the anchor image is attached | Needs an image model: tool in session, else the user runs it |
| **K** code kit (`scripts/art/*`) | fx, UI icons, props, env layers (existing source of those) | Medium; must still pass V | Full |

**K is not allowed for pigs** until its rig passes S7/S5 on a `pig_classic` redraw — today it draws the frontal
big-head face (GAME_ART_DIRECTION §0 OUTLIER).

## R — reference cut

1. Add `{ id, sheet: PIGS | ENV, box: cell(c, r) }` (optional `tint: recolour([r,g,b], strength, bright)`) to
   `CUTS` in `scripts/cut-reference.ts`. Cell address from the registry.
2. `npm run art:cut` → writes `art_inbox/<id>.png` for every CUTS entry (idempotent) and drops `sleepAsset` of
   cut pigs (spec-map §3). Then QA only the new stem.
3. Particles/props near the pig: the cutter keeps only the largest blob, so detached sparkles/hearts vanish;
   fused ones (puddle, pillow) make the cell non-cuttable.

## X — image model with reference images

Prompt = pack blocks, never a fresh style description:

```text
{AI pack §1.1 STYLE}
Single full-body pig character: body in side view facing right, head turned slightly toward the viewer
(three-quarter head, both eyes visible, far eye narrower), seen from slightly above, all four feet on one
invisible ground line, calm standing pose.
Match the attached reference image exactly in outline weight and colour, soft cel shading with one shadow
and one highlight tone, top-left light, proportions (head clearly smaller than body, short thick legs) and
eye style.
{CONCEPT — the brief's MUST-HAVE list as one or two sentences, worn items only, "nothing held"}
The character must remain clearly recognizable as a pig.
{AI pack §1.2 OUTPUT}
Negative: {AI pack §1.3} , frontal face, big head, oversized eyes, flat vector, glossy, sticker, chibi
mascot, glow, sparkles, particles
```

Attachments (in this order): `public/assets/pigs/base/pig_classic.png` (style/img2img, strength 0.35–0.55,
pack §1.4); crop of the concept cell if PARTIAL (content hint); for `_sleep`: the pig's **accepted idle** +
crop of `pigs c5r2` (pose).

Run:
- Image tool available in the session → generate 3–4 candidates into `art_inbox/.candidates/<stem>_<a..d>.png`.
- No image tool → write the prompt and attachment list into the brief, report BLOCKED
  (`NEED: tạo 3–4 ảnh theo art_inbox/.briefs/<id>.md, lưu art_inbox/.candidates/<stem>_a.png…`), resume at QA.

Candidates usually come back with a background and a wrong scale; normalising them (background removal, trim,
scale, ground line) is exactly `npm run art:process`. So: triage candidates by eye (pack §2, one look at all of
them), copy the best to `art_inbox/<stem>.png`, make sure the manifest row exists (§After acceptance), run
`npm run art:process`, then QA the processed file in `public/assets/…`. FAIL → `git restore` that file and
`public/assets/manifest/assets.json` (or `git rm` if new) and refine. Git is the undo.

## K — code kit

Edit the family module (`scripts/art/world.ts`, `icons.ts`), reuse `kit.ts` primitives and `PAL` only, then
`npm run art:generate` — careful: it rewrites every K asset plus pigs in `art_inbox/`; delete the stems you
did not intend to change before `art:process`, then re-run `art:cut` if pigs were touched.

## After acceptance

- `npm run art:process` (moves into `public/assets/`, sets `status: production`).
- `npm run assets:check`; `npm run check` if any `.ts` changed (cut-reference, kit).
- New pig without manifest row: add the `proposed_row` from `resolve.mjs` (status `placeholder`) before
  `art:process`. The user's "tạo Pig X" is the request to have it in the game; DONE must say it is now a shop
  skin at `priceGold` (pack §9 ladder) so the user can veto. P5 (unlock-only, no unlock rule) → BLOCKED.
- Commit: `feat(art): <id> (<backend>)` with the gate results in the body.
