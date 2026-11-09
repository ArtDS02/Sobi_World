# Plot upgrade — work log (decision 056)

Branch `feature-plot-upgrade` (from `overnight-hardening`). Tick a step when its commit is in.

## Baseline (before any change, 2026-11-09)
`npx vitest run`: 1958 pass / 2 fail. Known failures, not ours: `tests/scripts/studio.test.ts` (2 tests) — tag `pre-unity-studio` is missing in this checkout.

## Steps
- [x] 1 Level 100 (table 1–100, rewards through the ledger, save v13 `progression.levelRewardsPaid`, achievements 30…100, HUD 3-digit star)
- [x] 2 Tier / zone upgrade logic (content `cloud/tiers.json`, `garden/zones.json`, `systems/plants/tiers.ts`, `upgradeTier` / `upgradeZone`, harvest bonus, Cloud slice v3, Garden slice v2)
- [x] 3 Upgrade UI + Admin (Cloud banner rank line + button, Garden zone chip + button, shared upgrade dialog, plot cards, toasts, Admin catalog + labels)
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
- Step 2: item requirements are concrete item ids (the research said "hoa thường / hoa hiếm / hoa EPIC/LEGENDARY", but no Cloud flower item is EPIC): Cloud tier 2 = 30 Cúc Mây (cloud daisy), tier 3 = 10 Hoa Hồng Cầu Vồng (rainbow rose) + 20 scales, tier 5 = 10 Lan Sao (star orchid); Garden tier 2 = 40 corn + 20 fertilizer, tier 5 = 50 sunflower. Both are tunable in Admin.
- Step 2: the upgrade ladder is "bậc / rank" in the UI (the word "tầng" already means a cloud floor).
- Step 2: new standard world event `plot.tierUpgraded` (ARCHITECTURE §7, count 28 → 29). Admin catalog lists both new content files.
- Step 2: `cloud.test` v1→v2 migration test now chains v2→v3 because the slice version moved. The only red tests in the full run are timeouts of `assetsCheck` / `phase11` (machine-slow, already known in PROGRESS; they pass or fail at random between runs, never on an assertion) plus the 2 studio tests.
- Step 2: no real save contains Cloud / Garden slices (fixtures hold only the farm), so the "save thật" check builds old-shape slices (v2 / v1) from live slices inside the real v12 fixture and runs the whole codec.
- Step 3: the upgrade button appears when the tier / zone owns all its plots and a next rank exists; the world-level gate is explained inside the dialog (the button there says why it is off: plots → level → coins → items). The Cloud banner shows the rank line under the title banner (canvas), the Garden shows a chip + button inside the zone pill (DOM).
- Step 3: unit tests are node-only (no DOM env in the repo), so the dialog DOM is checked in the step-8 sandbox run; the data is covered by `tests/unit/plotTierUi.test.ts`.
- Step 3: guard limit is 300 lines per file: rank VMs live in `cloudRankVm.ts` / `gardenRankVm.ts`. `assetsCheck` / `phase11` timeouts appear at random on this loaded machine (they pass with `--testTimeout=120000`).
