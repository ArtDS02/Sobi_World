# Admin upgrade plan (approved by the owner)

Scope: the Admin dashboard (`tools/admin/`, `scripts/admin/`) plus one game setting (sound off by default).
Rules for every step: `npm run check` green before commit, one commit per step, LF files, UI text in Vietnamese,
code comments in English, no save is ever rewritten by the dashboard without the backup of step 7.
Decisions taken by the owner: sound-off applies to NEW saves only; one shared list/detail frame for all areas;
shared redraw helper for every page plus partial redraw on heavy pages; all extra features B1–B11 accepted (B9 last).

Legend: `[ ]` open, `[x]` done. Tick a box in the commit that finishes it.

## Step 1 — Sound off by default (game)
- [x] 1.1 `src/areas/farm/logic/save/newFarm.ts`: new farm `musicOn: false`, `sfxOn: false`.
- [x] 1.2 `src/core/save/world.ts`: default world settings `musicOn: false`, `sfxOn: false`.
- [x] 1.3 Existing saves keep their own values (no migration that flips them); add a test that proves it.
- [x] 1.4 Fix tests and fixtures that assume sound is on; check Settings screen still turns it on and off.
- [x] 1.5 Admin: show the default in the "Nội dung game"/overview as a read-only line (edit later via step 8).
- [x] 1.6 Update `docs/PROGRESS.md` (and a short decision note in `docs/decisions/` if the numbering rule asks for it).

## Step 2 — No scroll jump on any click (admin)
- [x] 2.1 Reproduce on each page that redraws (users, userDetail tabs, products, breeding, layout, seasons, mapManage,
      mapNetwork, contentPage, adventure, adventureMaps, breedSim, rigLab, battleLab): record page, action, scroll before/after.
- [x] 2.2 New helper `tools/admin/redraw.ts`: `redraw(root, fn)` keeps min-height, window scroll, inner scroll containers
      (lists, tables, editors), the focused element and its caret/selection.
- [x] 2.3 Replace the ad-hoc `root.innerHTML = …` redraws in the pages above with the helper (remove the temporary patches
      in `main.ts` and `battleLab.ts` that the helper supersedes).
- [ ] 2.4 (not needed: the guard keeps scroll and focus of any partial redraw; heavy pages still rebuild their DOM) Heavy pages (battle lab, layout, map pages): redraw only the part that changed (tab body, side block), not the page.
- [ ] 2.5 (hash links not audited yet) Hash-link tabs and `<a href="#…">` must not scroll to top unless the page changes.
- [x] 2.6 Script `scripts/admin/scrollCheck.*` (browser-driven): per page scroll to the middle, click every tab/button/option,
      fail when scroll moves more than 4 px. Wire it into `npm run check` or a documented separate command.

## Step 3 — Sidebar, quick search, shortcuts (admin)
- [x] 3.1 Collapsible nav groups (click the title), state saved in `localStorage` (guarded by try/catch), the group of the
      open page opens itself.
- [x] 3.2 Buttons "thu tất cả / mở tất cả".
- [x] 3.3 Icon-only sidebar mode (toggle), remembered.
- [x] 3.4 B1 — Quick search (Ctrl+K): pages plus content names (skills, pigs, enemies, items, maps…) → jump to the page/row.
- [x] 3.5 B11 — Shortcuts: Ctrl+S save, Esc close dialog, `?` shows the list; context help per page.
- [x] 3.6 Keep the quiet scrollbars; verify the narrow-screen layout of the sidebar.

## Step 4 — Audit of every admin page, UI and operations (admin)
- [ ] 4.1 Page inventory: list every route in `main.ts` with its buttons, forms, dialogs, API calls.
- [ ] 4.2 UI sweep at 1440, 1100 and 760 px, light and dark: overflow, overlap, double scrollbars, clipped buttons,
      untranslated text, empty states, loading states. Screenshots into the scratchpad, findings table in this file.
- [ ] 4.3 Operation sweep: create / edit / delete / cancel / save / double click / leave with unsaved changes / API offline /
      invalid input, per page. Read console and failed requests.
- [ ] 4.4 Fix the findings in order of severity (data loss > wrong data > broken action > layout > polish).
- [ ] 4.5 A regression test for each fixed logic or operation bug (unit test or browser script).
- [ ] 4.6 Script for horizontal-overflow check at the three widths, reusable later.

## Step 5 — Names instead of ids (admin)
- [ ] 5.1 One name table `nameOf(id, kind?)` built from content rows, i18n tables and the species draft (extends `idNames.ts`).
- [ ] 5.2 One shared picker (picture + name + search, id as small sub-line / tooltip) replacing every raw id field and select
      (skill type, element, status, creature, map, item, trait, zone, class…).
- [ ] 5.3 Tables, labels, validation messages, breadcrumbs and toasts show names; ids only as secondary text.
- [ ] 5.4 Types and categories (e.g. `class`, `unique`, `ultimate`, `enemy`) get Vietnamese display names from one table.
- [ ] 5.5 Test that scans the rendered admin pages for `snake_case`/id-like strings outside allowed spots and reports leftovers.

## Step 6 — Animation workshop (battle lab and rig lab)
- [ ] 6.1 Reproduce play and action bugs: every skill, every status, every reaction, enter battle, win, phase change,
      1–3 units, corruption 0–5, fast speed, reduce motion, pause/resume, after "Áp dụng thử", after save. Log console errors.
- [ ] 6.2 Fix every error found; list them in the report with cause and fix.
- [ ] 6.3 Keep one Phaser game: changing an option updates data in place instead of destroying and recreating the game
      (check no leaked timers/listeners: the `setInterval` clock, the scale listener, the fullscreen handler).
- [ ] 6.4 Controls: draggable timeline, frame step, loop, keyboard (Space, ←/→, R), remembered choices, searchable skill list.
- [ ] 6.5 Editing: layer form view (JSON stays as fallback), undo/redo, before/after compare, validation message per field.
- [ ] 6.6 Layout of the 3-column workshop: small-screen behaviour, long names, empty skill, no-API state.
- [ ] 6.7 Same pass for the rig lab (`rigLab.ts`).
- [ ] 6.8 Keep `scripts/anim-review` and the `__animLab` test hook working; run the animation tests.

## Step 7 — Data safety (admin)
- [ ] 7.1 B2 — One unsaved-changes system: every page registers its dirty state; header shows count; "Lưu tất cả";
      leaving a page or the app warns once, consistently.
- [ ] 7.2 B4 — Automatic backup of any content file before the API overwrites it (`content-api` side, outside shipped game),
      keep the last N, with a "Khôi phục" list per file. Write errors are never swallowed.
- [ ] 7.3 B3 — Diff before save (old vs new, readable names) and a change history with undo for the session.
- [ ] 7.4 Tests for backup/restore and for a failed write (nothing lost, error shown).

## Step 8 — Edit every area (admin)
Order: Adventure → Aquarium → Garden → Cloud → Plaza → Breeding → Farm leftovers. One commit per area.
- [ ] 8.0 Inventory: for each file in `content/` and each save-affecting config, record which fields the admin can edit today
      and which cannot. Table in this file. Goal: no content file that can only be edited by hand.
- [ ] 8.1 Shared frame: list → detail pages driven by a config per data kind (columns, filters, detail form, schema, names).
- [ ] 8.2 Add the "Âm thanh mặc định" editor from step 1.5 here.
- [ ] 8.3 Each area gets its own sidebar group; pages per data kind (fish, crops, flowers, hybrids, balance, layout…).
- [ ] 8.4 B7 — Duplicate row, bulk edit, import/export CSV/JSON for lists.
- [ ] 8.5 B6 — "Dùng ở đâu": from any row show every place that references it; warn before delete/rename.
- [ ] 8.6 B8 — Balance table: compare stats side by side, highlight outliers.
- [ ] 8.7 B5 — Data check center for all areas: orphan ids, broken references, missing assets, missing translations
      (`content/i18n/en.json`), schema errors; counts in the sidebar.
- [ ] 8.8 Every form validated by the game's own schema before saving; error messages name the field in Vietnamese.

## Step 9 — Close-out
- [ ] 9.1 B10 — Health panel on the overview: API status, data errors, unsaved changes, missing translations/assets.
- [ ] 9.2 Logic audit pass (step 4 lớp logic) once all areas are editable: re-run every check against the current version.
- [ ] 9.3 B9 — "Chạy thử" from the admin: open the game with the edited data (local only; no network in the shipped build).
- [ ] 9.4 Update `docs/` guide pages inside the admin (`guide.ts`) for new features; update `docs/PROGRESS.md`.
- [ ] 9.5 Final: full `npm run check`, `npm run guard`, scroll check, overflow check, report in the AGENT_RULES §7 format.

## Open points to confirm while working
- Whether the existing 8 failing tests (assetsCheck, phase11, simulation timing) are pre-existing; compare against a clean
  checkout before step 1 so they are not blamed on this work.
- Exact failing actions in the animation workshop, if the owner remembers any (otherwise found by step 6.1).
