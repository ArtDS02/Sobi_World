NEXT: remaining D2..D9 not started; C steps 5-9 not done (see ADMIN_UPGRADE_LOG.md). Final report is the next thing if no more budget.

# Overnight log (branch `overnight-hardening`)

Started 2026-11-08. Prompt: `docs/OVERNIGHT_PROMPT.md`. State lives here; resume from NEXT.

## Baseline (before any overnight change)
`npx vitest run --testTimeout=120000`: 2 fail of 1820 — simulation "a 30-day catch-up finishes quickly" (4.0 s > 3 s) and assetsCheck "the shipped assets pass" (80 s). Under parallel load phase11 "balance guard" can also time out at the default 5 s; it passes alone with a long timeout.

## Checklist
- [x] A1 non-finite money / valuation
- [x] A2 (tick/dispatch try/catch + INTERNAL_ERROR toast once/min, crash overlay, electron render-process-gone/unresponsive/did-fail-load reload ≤3 per 5 min, logs/error.log rotated) global error handling (tick, renderer, electron main, error.log)
- [x] A3 (SAVE_CODE_ERROR keeps files + new status codeError; damaged Area slices recreated via codec.freshSlice, original kept as saves/before-slice-repair-*.json, toast SAVE_AREA_REPAIRED; farm slice included — decision: repair, not fallback to older backup, original is kept) safer save (code vs data errors, slice repair)
- [x] B1 (src/core/world/persister.ts coalesces writes; dispatch no longer awaits disk) non-blocking dispatch + persist coalescing
- [x] B2 catch-up 30 days perf (cpu-prof: farmOf/withFarm rebuilt the item table + remapped transactions every step; now references reused. Standalone 30-day catch-up 0.85 s → 0.53 s; the 3 s failure only appears when 8 test workers compete. Simulation results unchanged: whole suite green)
- [x] B3 settings.json queued writes
- [x] B4 fs.watch error handler
- [x] B5 external-edit content hash
- [x] B6 import validation before backup, atomic export
- [x] B7 app:// decodeURIComponent
- [x] B8 fishing dialog keys + injectable rng
- [x] B9 (XP kept per pile as before; toast says how many piles were thrown away) cleanManure full bag notice
- [~] C admin upgrade: steps 1, 2, 3, 4, 7.2 done and merged; 5, 6, 7.1, 7.3, 8, 9 NOT done (ADMIN_UPGRADE_LOG.md)
- [x] D1 save health (feat/save-health merged): Settings → Kiểm tra file lưu (per-Area verdict, no repair/write), stale-backup banner (>7 days), recovery screen already picks a backup (existing)
- [ ] D2..D9 not started (budget)

## Decisions / stuck items
- Layout fixes for admin were already committed (a9d34e3) and the branch `overnight-hardening` already existed.

- Group A: `npm run check` equivalent (typecheck, lint, guard, vitest minus assetsCheck) green after A3; tests that asserted "corrupt slice refused" (aquarium, cloud, garden, areaRegistry, worldSave) updated to assert repair.
- Group B: typecheck/lint/guard green; vitest 1860 pass excluding assetsCheck (baseline-slow). assets:check not re-run yet.
- Group C: typecheck/lint/guard green; vitest 1868 pass; 3 perf tests flaked only while the admin dev server and Chrome ran in parallel (simulation 30-day 4.2 s, neglected-pigs 3.4 s, breeding 10k-sample 27 s) and pass when run alone.
