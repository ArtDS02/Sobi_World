# Plot upgrade — work log (decision 056)

Branch `feature-plot-upgrade` (from `overnight-hardening`). Tick a step when its commit is in.

## Baseline (before any change, 2026-11-09)
`npx vitest run`: 1958 pass / 2 fail. Known failures, not ours: `tests/scripts/studio.test.ts` (2 tests) — tag `pre-unity-studio` is missing in this checkout.

## Steps
- [x] 1 Level 100 (table 1–100, rewards through the ledger, save v13 `progression.levelRewardsPaid`, achievements 30…100, HUD 3-digit star)
- [ ] 2 Tier / zone upgrade logic
- [ ] 3 Upgrade UI + Admin
- [ ] 4 Tier scenery (presentation)
- [ ] 5 Plot-skin forging
- [ ] 6 Economy bot + tuning
- [ ] 7 Tier-5 perk (optional)
- [ ] 8 Audit, sandbox run, docs, freeze

## Self-made decisions
(none yet)
- Step 1: v12 fixture `tests/fixtures/save-v12-derived.json` is DERIVED from the real v10 fixture (migrated, then set back to v12 shape with 114,848 XP = level 29); no real save in `%APPDATA%` was touched.
- Step 1: reward pointer lives in the world save (`progression.levelRewardsPaid`, v13) and rewards are paid in `settleWorld` (step 0) as ONE `WORLD_LEVEL_REWARD` event (coins + gems each one ledger Transaction, type `WORLD_LEVEL_REWARD`). Old saves migrate with pointer 20, so the first settle pays levels 21..current once.
- Step 1: achievement schema Gem cap raised 30 → 50 for the level 30…100 achievements (approved range 20–50). Tests changed only because the cap moved (20 → 100): config, coreSystems (curve now checked per segment), gardenUi, viewModel, goals (Gem range), adminData (unlockLevel 99 is now valid → 999), garden/liveWorld (save version 13).
