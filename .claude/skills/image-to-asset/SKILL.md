---
name: image-to-asset
description: >-
  Art director + asset generator + visual QA for Ủn Ỉn Homemade game art. Turns an asset request
  ("tạo Pig #42", "làm pig_pilot", "vẽ lại heo cao bồi", "tạo fx_heart / prop / icon") into a
  production-ready PNG that matches asset/reference and the asset specs: resolve spec → pick
  references → brief → generate → QA gate → refine → art_inbox → art:process → assets:check.
  Also use to audit existing art against the reference style, or when a new image lands in
  asset/reference. Not for code tasks (spec-to-source) or audio.
---

# Image → Asset

**Spec decides WHAT. Reference decides HOW IT LOOKS. Art direction keeps it CONSISTENT.
The quality gate decides IF it ships.** The goal is not a pretty AI picture; it is a sprite that
looks drawn with the existing set from day one.

Giao tiếp, scope, DONE/BLOCKED: như skill `spec-to-source` §1–§2 (im lặng khi làm, chỉ báo khối cuối).
Comment/script tiếng Anh, trả lời tiếng Việt.

## 1. Sources — never mix them up

| Kind | Files | Decides |
|---|---|---|
| Specification (normative) | `asset/ASSET_PRODUCTION_STANDARD_v1.md` (format wins) · `asset/animals/PIG_CATALOGUE.md` (what exists) · `asset/AI_ASSET_GENERATION_PACK.md` (filled concepts + prompt blocks) · `asset/building/ENVIRONMENT_CATALOGUE.md` | subject, id, states, canvas, naming, path |
| Visual reference | `asset/reference/*.png` (CORE / OUTLIER per registry) | style only — never content |
| Art direction (derived) | `asset/GAME_ART_DIRECTION.md` | measured style profile; replaces re-reading the images |
| Pipeline | `scripts/cut-reference.ts`, `scripts/process-art.ts`, `scripts/assets-check.ts`, `public/assets/manifest/assets.json` | delivery |

Routing per asset family, precedence and known spec conflicts: [references/spec-map.md](references/spec-map.md).
Worked runs (R autonomous, X blocked-on-model, family audit): [examples/worked-runs.md](examples/worked-runs.md).

## 2. Pipeline (one asset = one run)

```text
0 ref-check ─ 1 resolve ─ 2 references ─ 3 brief ─ 4 generate ─ 5 QA gate ─ 6 refine ↺ ─ 7 deliver
```

0. `node .claude/skills/image-to-asset/scripts/ref-check.mjs` — exit 0 → style profile current, do **not**
   open reference images again. Exit 1 → [workflows/reference-analysis.md](workflows/reference-analysis.md) first.
1. **Resolve** — pigs: `node .claude/skills/image-to-asset/scripts/resolve.mjs "<#NN | id | tên | keyword>"`
   (YAML: spec lines, pack concept, states, canvas, paths, manifest row, reference cells). Other families /
   AMBIGUOUS / NOT_IN_CATALOGUE: [workflows/resolve-spec.md](workflows/resolve-spec.md). Never read whole catalogues.
2. **References** — from the resolution's `reference_set` only: style anchor `pig_classic` + the concept cell
   (if any) + ≤2 nearest accepted pigs. OUTLIER files are never inputs.
3. **Brief** — fill [templates/asset-brief.md](templates/asset-brief.md) into `art_inbox/.briefs/<id>.md`
   from resolution + `GAME_ART_DIRECTION.md` (cite §, don't copy it). Short; this file is also the prompt source.
4. **Generate** — pick the backend in [workflows/generation.md](workflows/generation.md):
   `R` reference cut (concept exists in a CORE cell) → `X` image model with reference images → `K` code kit
   (fx/ui/props only; pig rig currently fails S7). Output = `art_inbox/<stem>.png`.
5. **QA gate** — [workflows/validation.md](workflows/validation.md): `scripts/qa.mjs` (technical T + measured
   style S) **and** look at the review sheet it writes (visual V + spec Q). Checklist:
   [references/quality-gate.md](references/quality-gate.md). Any FAIL → step 6. Never accept on numbers alone.
6. **Refine** — name the defect, change one thing (prompt clause / reference strength / crop / tint), regenerate,
   re-run 5. Max 4 rounds per asset, then BLOCKED with the best candidate and its failing checks.
7. **Deliver** — sleep frame (if required) from the accepted idle; `npm run art:process`; `npm run assets:check`;
   `npm run check` if any TS changed. New pig → register the proposed row and flag the new shop skin in DONE
   (spec-map §4).

## 3. Hard rules

- One direction: side view facing right (standard §2). A request for front/back/left views does **not**
  override it — state the rule, deliver side-right. States = `idle` (+ `sleep` for P0/P1) only (§3).
- Reference ≠ template: a new concept gets a new design in the reference's language. Copy a reference cell
  only when the registry marks it as that asset (`R`), and list every spec item the cell lacks.
- No style drift: no generic "AI chibi sticker" look — frontal face, head ≈ body, flat vector, glossy 3D,
  painterly sketch are all FAIL (GAME_ART_DIRECTION §0, §2, §5).
- Every image passes T + S + V + Q before it reaches `art_inbox/<stem>.png`. Candidates live in
  `art_inbox/.candidates/`; QA sheets in `art_inbox/.qa/`; briefs in `art_inbox/.briefs/` (dot dirs are
  ignored by `art:process`).
- Out of v1 scope (CLAUDE.md): cosmetics (`acc_*`), crops, anything in game spec §20 → refuse unless the user
  explicitly lifts the scope; audio is not this skill.
- Do not edit the normative docs to make an asset pass. Spec conflict that changes the result → BLOCKED.
- Never loosen `qa.mjs` tolerances to pass an asset. Re-calibrating = run it on all CORE-derived pigs first
  (they must still pass) and record the reason in the commit.

## 4. Token budget

- Text first: `ref-check` + `resolve` + `GAME_ART_DIRECTION.md`. Open images only for: the QA sheet of the
  current candidate (1 image per round), a NEW/CHANGED reference, or a cell crop when a costume needs it.
- One `Read` of the QA sheet per round; never re-open an image already judged.
- Briefs ≤ 40 lines; prompts reuse pack blocks verbatim by reference (§1.1–§1.3), only `{CONCEPT}` is new.

## 5. Output (cuối run)

```text
DONE
- <id>: backend <R|X|K>, <n> vòng; gate T/S/V/Q PASS; files <paths>
- verify: art:process + assets:check (+ check) — kết quả
- lệch spec còn lại (nếu có), ví dụ "cell thiếu áo yếm so với pack"
NEXT: <asset tiếp theo hoặc bước user cần làm>
```
`X` without an image model in the session → BLOCKED with `NEED:` = brief path + exact prompt + reference files
to attach + where to save the candidates; on the next turn resume at step 5.
