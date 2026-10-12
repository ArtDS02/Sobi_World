# Backend G — Gemini sheets through the owner

The session has no image model; the owner runs Gemini (free: gemini.google.com or aistudio.google.com).
Everything else is scripted. One batch = `asset/batches/<id>.json` (tracked); its sheets each hold several
assets of one family in a grid, generated in **one** image so they share one hand and one scale.

```text
1 plan ─ 2 prep ─ 3 owner generates ─ 4 cut ─ 5 triage ─ 6 deliver ─ 7 QA ─ 8 integrate ─ 9 report
```

1. **Plan** — `asset/batches/README.md` lists every placeholder row → batch. Write the batch JSON:
   `sheets[]` with `name`, `title`, `board` (style-boards.json), `grid [R, C]`, `fit` (`each` | `shared` +
   `size [W, H]` | `backdrop`), `views` (style-boards.json keys), optional `hints [{from, box, what}]` (crops of
   CONTENT references, ≤ 2, never a style source), `notes`, `cells [{stem, desc}]` row-major. Sheets ≤ 8 cells;
   stage sets one plant per row. Record spec-silent choices in `decisions`.
2. **Prep** — `node .claude/skills/image-to-asset/scripts/batch.mjs prep <id>` → `asset/batches/<id>.md` (prompt
   sheet) + `art_inbox/.batch/<id>/` (style board `1_style_<board>.png`, hint crops, `PROMPT.md`). Look at a new
   board or hint crop once (contact sheet) before handing it over: no baked text, nothing cropped.
3. **Owner** — per sheet: new Gemini chat, attach the files in order, paste the prompt, save the PNG as
   `<sheet>.png` (extra tries `<sheet>-2.png` …) in the work folder. Report BLOCKED with `NEED:` = the batch
   md path; resume here next turn.
4. **Cut** — `batch.mjs cut <id>` → `art_inbox/.candidates/<stem>_<v>.png` + one review board per sheet
   `art_inbox/.qa/<id>_<sheet>.png` (variants as rows, style anchor in column 1, candidates at game size).
   Cut FAIL (object count) → open `art_inbox/.qa/<dir>_<sheet>_cut.png`; objects touching → ask for a
   regeneration with "more space between objects"; never hand-crop.
5. **Triage** — open each review board **once**. Pick per stem; reject per `references/quality-gate.md` V/Q
   (style drift, wrong content, text, wrong facing, stage mismatch). Rejects → refine the cell `desc` /
   `notes` (one change), `prep` again, ask the owner for that sheet only.
6. **Deliver** — `batch.mjs deliver <id> a` (or `stem=b …`) → `art_inbox/<stem>.png`; then
   `npm run art:process` (sets `status: production`) and `npm run assets:check`.
7. **QA** — `qa.mjs public/assets/<path> --kind prop|icon --size WxH` on the processed files (T checks);
   pigs with the full S set. FAIL → `git restore` the file + manifest, back to 5.
8. **Integrate & test** — run the game (`npm run dev:sandbox` / e2e), screenshot the Area. Wire art the scene
   does not load yet (e.g. `bg_cloud`) as a presentation-only change; `npm run check` green.
9. **Report** — per Area (GĐ14 stop point): screenshots + `batch.mjs list`; commit
   `feat(art): <area> <batch> (G)`.

Rules: the background must stay flat grey (#C8C8C8) — cut-sheet and art:process flood-fill it; a backdrop is
the only full-bleed exception. Never loosen tolerances to pass a sheet. Candidates, sheets and QA boards live
in `art_inbox/` (git-ignored); the batch JSON + md are the tracked record.
