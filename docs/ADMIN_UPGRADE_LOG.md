# Admin upgrade log

Branch `admin-upgrade` (from `overnight-hardening`). Baseline before this branch: only the two known slow tests fail (simulation 30-day under load, assetsCheck 80 s). The plan said 8 failing tests; on a clean run the count is 2.

## Decisions
- Step 1: defaults flipped in `defaultSettings` and `newGame`; no migration touches existing saves (test proves it). Admin overview shows a read-only line; the editor comes with step 8.2.
- Step 2: instead of editing ~100 `innerHTML =` sites, `tools/admin/redraw.ts` wraps the `innerHTML` setter of every element inside #admin: it keeps window scroll, inner scroll boxes, focus + caret and ratchets the page box height so a shrinking page does not pull the scroll up. `npm run admin:scrollcheck` (needs the admin dev server and Chrome/Edge) clicked 16 safe controls (tabs, chips, summaries) over 21 pages: first run found jumps on #/pigs filters, #/adventure tabs and #/battle-lab; after the guard: 0. Coverage is limited to safe controls; save/delete buttons are never clicked.
- Step 3: navState.ts (prefs in localStorage, try/catch), quickSearch.ts (Ctrl+K, accent-insensitive, pages + every id/name row of content files; jump goes to the content file, not the row), shortcuts.ts (Ctrl+K, Ctrl+S clicks the first enabled save control, Esc closes top layer, ? lists). Verified in the browser pane: fold all / open all, icon-only (64 px column), search results, Enter jumps. 3.5 "context help per page" already exists as the header Hướng dẫn button. Phone width hides the sidebar tools.
