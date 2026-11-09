# Plot upgrade — work log (decision 056)

Branch `feature-plot-upgrade` (from `overnight-hardening`). Tick a step when its commit is in.

## Baseline (before any change, 2026-11-09)
`npx vitest run`: 1958 pass / 2 fail. Known failures, not ours: `tests/scripts/studio.test.ts` (2 tests) — tag `pre-unity-studio` is missing in this checkout.

## Steps
- [x] 1 Level 100 (table 1–100, rewards through the ledger, save v13 `progression.levelRewardsPaid`, achievements 30…100, HUD 3-digit star)
- [x] 2 Tier / zone upgrade logic (content `cloud/tiers.json`, `garden/zones.json`, `systems/plants/tiers.ts`, `upgradeTier` / `upgradeZone`, harvest bonus, Cloud slice v3, Garden slice v2)
- [x] 3 Upgrade UI + Admin (Cloud banner rank line + button, Garden zone chip + button, shared upgrade dialog, plot cards, toasts, Admin catalog + labels)
- [x] 4 Tier scenery (presentation): rank layers via `systems/animation/rankScenery.ts` + `ui/world/rankScenery.ts`, 26 placeholder ids, batch description `asset/batches/plot-rank-scenery.md`
- [x] 5 Plot-skin forging (content `shared/plotSkins.json`, world save `cosmetics.plotSkins`, `forgePlotSkin` coins OR Gems, `applyTierSkin` / `applyZoneSkin`, forge dialog on `shopGrid`, rank frame, 12 placeholder beds)
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
- Step 4: no art is made; 26 `scn_*` manifest rows are `placeholder` with generated rough shapes (script `drawScenery`), listed in `docs/ASSET_TODO.md` and `asset/batches/plot-rank-scenery.md`. Motion is code on the frame loop (`sceneryMotion`), frozen for "Giảm chuyển động", static images need no WebGL. The Garden has no night in its scene, so its lanterns flicker softly all the time. Rank line / button sit on the lower part of the Cloud banner (the dock covers anything below it). A sandbox config `sandbox-plot` (port 5192, own folder `sobiworld-plot`, save from `dev:max-save` written straight there) was added to `.claude/launch.json`.
- Step 4 checked in the browser: Cloud tier 1 at rank 5 shows border, stones, lanterns, landmark, waterfall; upgrade dialog bought tier 9 → rank 2 (−7,800 coins = 3000 × (1 + 0.2 × 8), items taken); Garden zone 3 (rank 2) shows chip + button, fence and stones; console clean.
- Step 5: owned skins are in the world save (`cosmetics.plotSkins`, folded into the unreleased v13 migration, no second bump); the skin each tier / zone wears is in the Area slice (`tierSkins` in Cloud v3, `zoneSkins` in Garden v2, folded into those migrations too). Blueprint conditions are data in the content file and read from the save generically (`areaList` for the lab, `areaRecord` for the boss, `codex`, `worldLevel`), so `core` imports no Area. Forged skin ids: `verdant` (Rừng Xanh), `pearl_sea` (Biển Ngọc), `crystal` (Pha Lê), `starry` (Tinh Tú); prices 10,000 coins / 20 Gems for the plain one, 30,000 / 60 for the three rare ones (a price must equal Gems × 500, enforced by the schema).
- Step 5: the "rank shown by a frame laid over the skin" is a code-drawn rounded frame around the plots (bronze / silver / gold / violet for ranks 2–5), not art. The forge opens from a button in the dock's "Mở rộng" group (it squeezes the seed palette by one card on a 1280-wide window).
- Step 5: the sandbox save made by `dev:max-save` before step 5 had no `cosmetics` and the game (rightly) refused it and moved it aside as `save.corrupt-*.json`; the sandbox-only file was patched by hand. Real v12 saves go through the migration, which adds the field.
- Step 5 checked in the browser: forge dialog lists 4 cards (Crystal shows its hint because the lab has not made a Crystal Peony), Starry paid with 60 Gems (100,076 → 100,016, toast, card "Đã đúc", strip chip), applied to Tầng 9, plots drawn on the placeholder skin bed with the bronze rank frame; console clean.
