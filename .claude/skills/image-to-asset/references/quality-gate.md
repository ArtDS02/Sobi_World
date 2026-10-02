# Quality gate

An asset ships only when **all four** groups pass. T and S are measured by `scripts/qa.mjs`; V and Q are
judged by looking at the review sheet it writes (`art_inbox/.qa/<stem>.png`: candidate | pig_classic |
compare pigs; row 2 at 128 px, red dotted line = 82 % ground line). Record the result in the brief's
`## QA log` (one line per round).

## T — technical (qa.mjs, FAIL blocks)

| Id | Check | Rule |
|---|---|---|
| T1 | Canvas | pig 512², fx 256²/64², icon 128², props per ENV catalogue (`--size`) |
| T2 | Format | PNG-32 with alpha (colorType 6) |
| T3 | Transparency | four corners transparent (not for props with grass base) |
| T4 | Not cropped | no opaque pixel on the canvas edge |
| T5 | Ground line | lowest pixel y = 420 ± 10 (pigs, sleep) |
| T6 | One subject | detached blobs ≥ 30 px = floating accessory / sparkle / artifact (WARN → judge in V) |
| T7 | Halo | ≤ 25 % of rim pixels very light (white fringe from bg removal) |
| T8 | Soft fringe | ≤ 12 % semi-transparent pixels (leftover glow / blur) — WARN |

## S — measured style vs the anchor `pig_classic` (qa.mjs)

| Id | Check | Rule | Catches |
|---|---|---|---|
| S1 | Scale | idle height 0.80–1.45 × anchor; sleep 0.50–1.10 | wrong size, costume too tall |
| S2 | Outline tone | rim luma within ±45 of anchor (WARN) | grey/black or missing outline |
| S3 | Rendering texture | 0.55–1.9 × anchor (WARN) | flat vector fills / sketchy painterly |
| S4 | Facing | silhouette matches anchor better than its mirror | facing left |
| S5 | Silhouette | IoU with anchor ≥ 0.55 (WARN) | costume ate the pig, wrong proportions |
| S7 | Head turn | far/near eye width ≤ 0.72 (reference 0.43–0.59) | frontal "sticker" face, big-head chibi drift |

Calibration (2026-10-01): all 10 reference-cut pigs PASS; 6 of 7 code-drawn pigs FAIL S7 at 0.90 (knight: eyes
hidden → WARN). If you retune, both facts must stay true.

## V — visual (look at the sheet)

Reject on any of these:

- Anatomy: extra/missing legs (exactly 4 visible), eyes misaligned or different sizes beyond the 3/4 rule,
  ears mismatched, snout deformed, mouth broken, hooves fused.
- Silhouette: distorted body, head ≥ body, legs too long/thin, not a pig at 128 px (pack §2 check 7).
- Accessory: clipping into the body, floating, held instead of worn, covers the face, wider than the pig.
- Style vs anchor (side by side): outline weight/colour, shading tone count, light not top-left, too much
  detail, realistic/3D/glossy, texture foreign to the set, colours not pastel-warm, glow.
- Cleanliness: background remains, white edge, text/letters/numbers/watermark, stray marks, cropped parts.
- Family test: at 128 px next to `pig_classic` and the compare pigs it reads as **the same game**.

## Q — specification

- Correct subject: every MUST-HAVE from the brief visible; nothing from MUST-NOT.
- Correct id, stem, canvas, state, path; rarity rule (P4/P5 → catalogue §22 signature silhouette).
- Consistency: sleep frame = same pig as its idle (palette, costume, markings, line weight); trough
  states = same trough; fx frames = same element. Only pose/expression/fill level may change.

## Verdict

```text
PASS   all T/S FAIL-free, V and Q clean          → deliver
REFINE any FAIL, or a V/Q defect                 → workflows/validation.md §Refine
REJECT wrong subject / unrecoverable anatomy     → new generation, not a fix
```
