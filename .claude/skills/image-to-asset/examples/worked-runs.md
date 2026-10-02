# Worked runs (verified 2026-10-01)

## A. "Tạo Pig #5" — concept exists in the reference → backend R (fully autonomous)

```text
ref-check.mjs            → style profile current (no image opened)
resolve.mjs "#5"         → pig_spotted, P1, base, catalogue :167 "Pink body with dark spots", no pack row,
                           states [idle, sleep], manifest MISSING (proposed P1 2000), cell pigs c5r0 EXACT cuttable
brief                    → MUST HAVE pink body, brown/dark spots, plain pig; MUST NOT costume
generate (R)             → CUTS += { id: 'pig_spotted', sheet: PIGS, box: cell(5, 0) }; npm run art:cut
qa.mjs art_inbox/pig_spotted.png --compare pig_black,pig_white
                         → T1–T8 PASS, S1 0.93x, S7 0.51, S4/S5 IoU 0.88 → GATE T/S PASS
visual (1 sheet read)    → 4 legs, faces right, same outline/shading as classic, reads at 128 px → V PASS
spec                     → Q PASS with note: spots are mid-brown (catalogue says "dark"); no sleep pose in
                           the sheet → idle + fx_zzz fallback (DECISIONS Q5) until an X sleep frame exists
deliver                  → add proposed row, npm run art:process, npm run assets:check, npm run check
```
(The verification run stopped before `art:process`: the CUTS edit was reverted so the game data is unchanged.)

## B. "Tạo Heo Cứu Hỏa" — new concept, no reference cell → backend X

`resolve.mjs "Heo Cứu Hỏa"` → `#36 pig_firefighter`, P1, jobs, catalogue :214 "Helmet and firefighter gear",
no pack row, `concept_cells: []`. Brief (`art_inbox/.briefs/pig_firefighter.md`):

```text
MUST HAVE: red rounded firefighter helmet with a small gold front badge (no letters/numbers) and a short back
           brim; tan/khaki fire coat on the body with two pale-yellow reflective bands; pink pig face, ears
           (far ear under the helmet), snout, 4 legs and curly tail visible
MUST NOT:  hose, axe, extinguisher, ladder, water, smoke, flames, any text on the badge
COLOR:     identity red #e2504a; accents khaki + reflective yellow; body pig pink
DECISIONS: held gear from the one-liner → dropped (future acc_prop_*); helmet compact so S1 ≤ 1.3x
```

Prompt = generation.md §X with `{CONCEPT}` = the MUST HAVE line; attach `pig_classic.png` (strength 0.45)
and, for costume language, crop `pigs c4r1` (aviator helmet). No image model in this session →

```text
BLOCKED
- pig_firefighter cần backend X (không có cell reference), session không có công cụ tạo ảnh
- brief + prompt + danh sách ảnh đính kèm: art_inbox/.briefs/pig_firefighter.md
NEED: tạo 3–4 ảnh theo brief, lưu art_inbox/.candidates/pig_firefighter_a.png … rồi báo "tiếp"
```
Next turn: triage → copy best → add row → art:process → qa.mjs → sheet → refine ≤ 4 rounds → sleep frame
from the accepted idle → DONE.

## C. Family audit — finds existing drift

`qa.mjs` on all pigs: the 10 reference-cut pigs PASS; `pig_cowboy`, `pig_wizard`, `pig_ghost`, `pig_detective`,
`pig_christmas`, `pig_tet` FAIL S7 (far/near eye 0.90 = frontal face) and `pig_knight` WARNs (eyes hidden).
Their sheet shows head ≈ body and flat vector fill next to `pig_classic` — exactly GAME_ART_DIRECTION §0
OUTLIER. Fix = regenerate each with backend X (pack §3.2 concepts already exist).
