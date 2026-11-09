# 056 — Plot upgrade tiers, plot-skin forging and World Level 100 (temporary gameplay thaw of decision 021)

**Date:** 2026-11-09 · **Status:** Đã làm, đóng băng lại (done, frozen again) — 2026-11-09. Work log and economy table: `docs/PLOT_UPGRADE_LOG.md`.

## Scope (owner-approved, exactly these three items; nothing else is unfrozen)
1. **World Level cap 100** (was 20). Levels 1–20 and every existing gate stay as they are; levels 21–100 are appended.
2. **Upgrade per Cloud tier / Garden zone** (not per plot): 5 tiers (tier 1 = today). Raising a tier also raises the scenery around that tier/zone (decor, landmarks, motion) — presentation only.
3. **Own tier names per Area.** Cloud: Mây Bông · Mây Sương Sớm · Mây Lụa Trời · Mây Ngọc Trai · Mây Thiên Quang. Garden: Đất Vườn · Đất Mùn Tơi · Đất Phù Sa · Đất Hoàng Thổ · Đất Ngàn Mùa.
4. **Plot-skin forging**: permanent, cosmetic-only skins; paid in **Gems or Sobi Coin** (the player chooses; 1 Gem = 500 coins).

## Defaults (all numbers live in `content/`, editable in Admin)
- XP to reach level n (n ≥ 21) = `4000 + 300 × (n − 21)`; level 100 = 1,335,135 XP. Per level 21–100: Sobi Coin `1000 + 100 × (n − 21)` + 1 Gem; every 10 levels (30…100) a new achievement (20–50 Gems). Old saves convert XP straight to the new level; one summary notice + the rewards of the levels passed, paid once.
- Tier benefit: **+% yield only** (tier 2/3/4/5 = +5/+10/+15/+20 %), applied at harvest as a per-item chance of one extra (`ctx.rng`, seeded). No EXP bonus, no speed bonus. `simulate()` is untouched. One-off EXP: 50 × new tier on upgrade, 30 on forging a skin.
- Upgrade gates: the tier/zone has all its plots; World Level 12 / 25 / 40 / 60 for tier 2 / 3 / 4 / 5. Paid in coins + items only (never Gems: Gems do not buy power).
- Price `base[tier] × (1 + k × (g − 1))`: Cloud base 3000/9000/24000/60000, k 0.2; Garden base 4000/12000/32000/80000, k 0.4. Items per research §4.2 (see `content/cloud/tiers.json`, `content/garden/zones.json`).
- Skins: 4 v1 designs (Rừng Xanh, Biển Ngọc, Pha Lê, Tinh Tú), each with a cloud and a garden variant, applied per tier/zone. Instant forging. Skins and tiers do **not** count towards Codex or World Development.
- Tier-5 perk (optional, last): Cloud 25 % free watering; Garden wilt after 72 h instead of 48 h. Dropped if it endangers `simulate()` determinism.

## Save changes
World save v12 → v13 (`progression.levelRewardsPaid`, `cosmetics.plotSkins`). Cloud slice v2 → v3 (`tierLevels`, `tierSkins`). Garden slice v1 → v2 (`zoneLevels`, `zoneSkins`). Each with a migration and tests.

## Freeze
When done: the laws above join the frozen list of decision 021 (levels 1–100, 5 tiers per tier/zone, cosmetic skin forging). Numbers stay tunable as 021 allows. Work log: `docs/PLOT_UPGRADE_LOG.md`.

## Outcome (2026-11-09)
Frozen laws added to decision 021's list: World Level 1–100 (curve above, rewards once through the ledger), 5 ranks per cloud tier / garden zone (yield bonus only, gates and prices above), cosmetic plot-skin forging (Gems or coins). Numbers stay tunable in Admin as 021 allows.
Choices made along the way: item requirements are concrete item ids; the Cloud rank-5 free-watering perk shipped (25 %), the Garden 72 h wilt perk was dropped to keep `simulate()` determinism; the scenery is placeholder art (26 `scn_*` + 12 `skin_*` ids) pending the owner's batch `asset/batches/cloud-06-rank-scenery`, `garden-05-rank-scenery`, `plots-01-skins` (.json + .md, working files in `art_inbox/.batch/<id>/`); only 4 skins exist, so Gems stay a mostly idle currency (more skins are a content-only change).
