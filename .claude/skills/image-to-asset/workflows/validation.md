# Validation + refinement

## Run the gate

```bash
node .claude/skills/image-to-asset/scripts/qa.mjs <png> [--compare <2 nearest pig ids>] [--kind ...] [--size WxH]
```

- Nearest = same collection or same silhouette family (hat pigs vs hat pigs, dark coat vs dark coat) among
  **accepted, non-OUTLIER** pigs.
- Exit 1 → REFINE without opening the sheet unless the failure needs eyes to diagnose.
- Exit 0 → open `art_inbox/.qa/<stem>.png` **once** and run V + Q of
  [../references/quality-gate.md](../references/quality-gate.md).
- Several candidates: run qa on each, open sheets only of those with exit 0, pick one, discard the rest.
- Log one line per round in the brief: `r<n> <candidate> T✓ S✗(S7 0.88) V– Q– → <action>`.

## Refine — one defect, one change

| Defect | Change |
|---|---|
| S7 frontal face / big head | Prompt: reinforce "three-quarter head, far eye narrower, head clearly smaller than body"; raise img2img strength toward 0.55; attach anchor first |
| S1 too small/tall | Costume too tall → "compact hat close to the head"; scale itself is fixed by art:process |
| S4 facing left | Regenerate (never mirror a pig with asymmetric costume; a symmetric one may be mirrored once) |
| T5 ground line | Re-run art:process; persists → feet cropped/merged in the source → regenerate |
| T6 floating parts | Remove "sparkle/aura/particles"; if it is a worn item that detached → "attached to the body" |
| T7 halo / T8 fringe | Background removal issue → generate on a flat mid-grey or transparent background |
| S2/S3 outline or texture off | Lower creativity / raise reference strength; add "same outline colour and weight as the reference" |
| V anatomy (legs, ears, eyes) | REJECT, regenerate with a different seed — do not patch anatomy |
| V accessory clipping/held | Restate "worn on the body", name the slot (head / neck / back / body) |
| Q missing MUST-HAVE | Move it to the first sentence of the concept; drop a less important accent |
| Sleep ≠ idle | Re-generate from the accepted idle only; state "identical palette, costume, markings" |

Max 4 rounds. Round 4 still failing → BLOCKED: best candidate path, remaining failing checks, the next change
you would try.

## Family audit (no new asset)

`for f in $(ls public/assets/pigs/base/*.png public/assets/pigs/skins/*/*.png | grep -v _sleep); do node .claude/skills/image-to-asset/scripts/qa.mjs $f --no-sheet | tail -1; done`
— lists every pig that drifted from the reference (today: the 7 code-drawn P1 pigs).
