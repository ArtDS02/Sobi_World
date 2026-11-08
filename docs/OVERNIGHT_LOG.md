NEXT: A1 commit, then A2 (global error handling)

# Overnight log (branch `overnight-hardening`)

Started 2026-11-08. Prompt: `docs/OVERNIGHT_PROMPT.md`. State lives here; resume from NEXT.

## Baseline (before any overnight change)
See "Baseline results" below once recorded.

## Checklist
- [ ] A1 non-finite money / valuation
- [ ] A2 global error handling (tick, renderer, electron main, error.log)
- [ ] A3 safer save (code vs data errors, slice repair)
- [ ] B1 non-blocking dispatch + persist coalescing
- [ ] B2 catch-up 30 days perf
- [ ] B3 settings.json queued writes
- [ ] B4 fs.watch error handler
- [ ] B5 external-edit content hash
- [ ] B6 import validation before backup, atomic export
- [ ] B7 app:// decodeURIComponent
- [ ] B8 fishing dialog keys + injectable rng
- [ ] B9 cleanManure full bag notice
- [ ] C admin upgrade (9 steps, see ADMIN_UPGRADE_LOG.md)
- [ ] D1..D9 features

## Decisions / stuck items
- Layout fixes for admin were already committed (a9d34e3) and the branch `overnight-hardening` already existed.
