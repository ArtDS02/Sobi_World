# CAPTURE MANIFEST

- runId: `20261104-184504-755dce5-ff9beea5`
- stamp: head `755dce5` · dirty8 `ff9beea5` · branch `phase-14-art`
- round (review sắp tới): 4
- complete: **true**
- suite: all · scope: full
- flags: (none)
- repoRoot: `D:/Local/Sobi_World`
- lệnh: `npm run anim:capture -- --suite all --grid 200`

## Cổng

| cổng | kết quả | bằng chứng |
|---|---|---|
| determinism | pass | case `gate.skill_ult_nh`, 6 khung, lệch tối đa 0 px |
| canary (phục vụ == đĩa) | pass | 4 file, lệch 0 |

## Thay đổi nguồn so với run trước

- `content/adventure/battle_fx.json`
- `scripts/anim-review/battleUi.ts`
- `scripts/anim-review/game.ts`
- `scripts/anim-review/lib/server.ts`

## Case có cờ (84/202)

| case | cờ [Auto] | ghi chú |
|---|---|---|
| `battle.ult.skill_ult_nh` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_qs` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_dm` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_qt` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_tg` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_hg` | ANTICIPATION_RANGE |  |
| `battle.ult.skill_ult_mm` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_hk` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.ult.skill_ult_phoenix` | ANTICIPATION_RANGE |  |
| `battle.ult.skill_ult_trident` | ANTICIPATION_RANGE |  |
| `battle.ult.skill_ult_mythical` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.skill.skill_nh_soothe` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_nh_tide_song` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_nh_tsunami` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_qs_rock_smash` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_qs_mountain_shell` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_qs_quake` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_dm_ink_veil` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_dm_night_net` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_dm_nightmare` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_qt_first_light` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_qt_guiding_lamp` | DURATION_RANGE |  |
| `battle.skill.skill_qt_lumina` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_ld_chain` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_ld_call_thunder` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_tg_bronze_wall` | DURATION_RANGE |  |
| `battle.skill.skill_tg_steel_charge` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_hg_forge_fire` | DURATION_RANGE |  |
| `battle.skill.skill_hg_lava` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_hg_inferno_hammer` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_mm_binding_roots` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_mm_blossom` | DURATION_RANGE |  |
| `battle.skill.skill_hk_void_veil` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_hk_phase_shift` | DURATION_RANGE |  |
| `battle.skill.skill_hk_void_vortex` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_shield_wall` | DURATION_RANGE |  |
| `battle.skill.skill_cl_stomp` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_cl_fortress` | DURATION_RANGE |  |
| `battle.skill.skill_cl_tremor` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_cl_power_strike` | HITSTOP_RANGE |  |
| `battle.skill.skill_cl_combo` | HITSTOP_RANGE |  |
| `battle.skill.skill_cl_finisher` | HITSTOP_RANGE, ANTICIPATION_RANGE |  |
| `battle.skill.skill_cl_energy_orb` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_cl_elemental_rain` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_freeze` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_seal` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_meteor` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_spell_storm` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_cheer` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_cl_healing_rain` | DURATION_RANGE |  |
| `battle.skill.skill_cl_purify` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_rally` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_cl_undying` | DURATION_RANGE |  |
| `battle.skill.skill_cl_aura` | DURATION_RANGE |  |
| `battle.skill.skill_e_poison_spore` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_bubble` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_howl` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_tusk_charge` | HITSTOP_RANGE, ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_root_quake` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_corrupt_bloom` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_thorn_storm` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_dive` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_lava_spit` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_frost_breath` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_rock_slam` | HITSTOP_RANGE, ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_thunder_charge` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_magma_breath` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_dragon_roar` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_meteor` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_stone_guard` | DURATION_RANGE |  |
| `battle.skill.skill_e_rune_beam` | ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_curse` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_idol_flame` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_doom_mark` | ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.skill.skill_e_bronze_crush` | HITSTOP_RANGE, ANTICIPATION_RANGE |  |
| `battle.skill.skill_e_seal_quake` | HITSTOP_RANGE, ANTICIPATION_RANGE, DURATION_RANGE |  |
| `battle.variant.skill_cl_power_strike.crit` | HITSTOP_RANGE |  |
| `battle.variant.skill_cl_power_strike.fast` | HITSTOP_RANGE |  |
| `battle.variant.skill_cl_power_strike.ko` | HITSTOP_RANGE |  |
| `battle.variant.skill_cl_power_strike.win` | HITSTOP_RANGE |  |
| `battle.variant.skill_ult_nh.reduce` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.variant.skill_ult_qs.reduce` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.variant.skill_ult_dm.reduce` | ANTICIPATION_RANGE, CIRCLE_RANGE |  |
| `battle.variant.skill_cl_power_strike.multi33` | HITSTOP_RANGE |  |

## Mọi case

| case | status | sheet | thời lượng | hit-stop | lấy đà | lớp VFX | khung đổi |
|---|---|---|---|---|---|---|---|
| `battle.ult.skill_ult_nh` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_nh.png` | 4120 | 220 | 500 | 11 | 20/28 |
| `battle.ult.skill_ult_qs` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_qs.png` | 4200 | 220 | 600 | 10 | 18/27 |
| `battle.ult.skill_ult_dm` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_dm.png` | 3860 | 220 | 450 | 10 | 17/24 |
| `battle.ult.skill_ult_qt` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_qt.png` | 3900 | 220 | 520 | 9 | 18/26 |
| `battle.ult.skill_ult_ld` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_ld.png` | 3520 | 220 | 300 | 10 | 19/24 |
| `battle.ult.skill_ult_tg` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_tg.png` | 3940 | 220 | 400 | 10 | 18/24 |
| `battle.ult.skill_ult_hg` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_hg.png` | 3780 | 220 | 320 | 10 | 18/24 |
| `battle.ult.skill_ult_mm` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_mm.png` | 4280 | 220 | 560 | 11 | 19/28 |
| `battle.ult.skill_ult_hk` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_hk.png` | 4200 | 220 | 700 | 9 | 17/26 |
| `battle.ult.skill_ult_phoenix` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_phoenix.png` | 3960 | 220 | 350 | 10 | 19/24 |
| `battle.ult.skill_ult_trident` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_trident.png` | 3800 | 220 | 450 | 11 | 19/25 |
| `battle.ult.skill_ult_mythical` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.ult.skill_ult_mythical.png` | 4460 | 220 | 650 | 11 | 18/27 |
| `battle.skill.skill_nh_bubble` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_nh_bubble.png` | 1710 | 50 | 300 | 5 | 9/14 |
| `battle.skill.skill_nh_soothe` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_nh_soothe.png` | 1610 | - | 320 | 4 | 8/13 |
| `battle.skill.skill_nh_tide_song` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_nh_tide_song.png` | 2110 | - | 380 | 7 | 11/17 |
| `battle.skill.skill_nh_tsunami` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_nh_tsunami.png` | 2360 | 80 | 420 | 9 | 10/16 |
| `battle.skill.skill_qs_rock_smash` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qs_rock_smash.png` | 1760 | 50 | 350 | 6 | 9/14 |
| `battle.skill.skill_qs_stone_skin` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qs_stone_skin.png` | 1710 | - | 300 | 6 | 9/14 |
| `battle.skill.skill_qs_mountain_shell` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qs_mountain_shell.png` | 2060 | - | 350 | 6 | 10/15 |
| `battle.skill.skill_qs_quake` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qs_quake.png` | 2110 | 50 | 420 | 5 | 10/16 |
| `battle.skill.skill_dm_ink` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_dm_ink.png` | 1660 | 50 | 260 | 6 | 8/13 |
| `battle.skill.skill_dm_ink_veil` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_dm_ink_veil.png` | 1910 | - | 320 | 7 | 10/15 |
| `battle.skill.skill_dm_night_net` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_dm_night_net.png` | 2110 | 50 | 360 | 7 | 11/17 |
| `battle.skill.skill_dm_nightmare` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_dm_nightmare.png` | 1910 | 50 | 360 | 7 | 10/16 |
| `battle.skill.skill_qt_ray` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qt_ray.png` | 1510 | 50 | 260 | 6 | 8/13 |
| `battle.skill.skill_qt_first_light` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qt_first_light.png` | 2010 | - | 360 | 6 | 10/16 |
| `battle.skill.skill_qt_guiding_lamp` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qt_guiding_lamp.png` | 1960 | - | 300 | 6 | 9/14 |
| `battle.skill.skill_qt_lumina` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_qt_lumina.png` | 1960 | 50 | 460 | 7 | 8/14 |
| `battle.skill.skill_ld_thunder_strike` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_ld_thunder_strike.png` | 1610 | 50 | 300 | 7 | 8/13 |
| `battle.skill.skill_ld_swift_bolt` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_ld_swift_bolt.png` | 1780 | - | 260 | 4 | 8/13 |
| `battle.skill.skill_ld_chain` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_ld_chain.png` | 2110 | 50 | 320 | 6 | 10/17 |
| `battle.skill.skill_ld_call_thunder` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_ld_call_thunder.png` | 2210 | - | 420 | 8 | 9/17 |
| `battle.skill.skill_tg_steel_slash` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_tg_steel_slash.png` | 1610 | 50 | 260 | 7 | 8/13 |
| `battle.skill.skill_tg_bronze_wall` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_tg_bronze_wall.png` | 1810 | - | 250 | 6 | 9/14 |
| `battle.skill.skill_tg_armor_break` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_tg_armor_break.png` | 1660 | 50 | 280 | 7 | 9/14 |
| `battle.skill.skill_tg_steel_charge` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_tg_steel_charge.png` | 1810 | 50 | 400 | 6 | 8/14 |
| `battle.skill.skill_hg_hot_claw` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hg_hot_claw.png` | 1610 | 50 | 280 | 6 | 8/13 |
| `battle.skill.skill_hg_forge_fire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hg_forge_fire.png` | 1910 | - | 300 | 7 | 11/16 |
| `battle.skill.skill_hg_lava` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hg_lava.png` | 2110 | 50 | 400 | 7 | 9/17 |
| `battle.skill.skill_hg_inferno_hammer` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hg_inferno_hammer.png` | 2010 | 50 | 500 | 7 | 9/15 |
| `battle.skill.skill_mm_poison_thorn` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_mm_poison_thorn.png` | 1660 | 50 | 300 | 4 | 8/13 |
| `battle.skill.skill_mm_sprout` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_mm_sprout.png` | 1710 | - | 280 | 5 | 9/14 |
| `battle.skill.skill_mm_binding_roots` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_mm_binding_roots.png` | 2010 | 50 | 360 | 6 | 9/17 |
| `battle.skill.skill_mm_blossom` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_mm_blossom.png` | 2010 | - | 300 | 5 | 11/16 |
| `battle.skill.skill_hk_pure_impact` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hk_pure_impact.png` | 1610 | 50 | 300 | 6 | 9/14 |
| `battle.skill.skill_hk_void_veil` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hk_void_veil.png` | 2110 | - | 320 | 5 | 11/16 |
| `battle.skill.skill_hk_phase_shift` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hk_phase_shift.png` | 1810 | - | 300 | 5 | 10/15 |
| `battle.skill.skill_hk_void_vortex` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_hk_void_vortex.png` | 2110 | 50 | 350 | 4 | 11/16 |
| `battle.skill.skill_cl_taunt` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_taunt.png` | 1510 | - | 300 | 6 | 8/13 |
| `battle.skill.skill_cl_hold_fast` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_hold_fast.png` | 1530 | - | 250 | 6 | 8/13 |
| `battle.skill.skill_cl_shield_wall` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_shield_wall.png` | 1970 | - | 300 | 6 | 9/14 |
| `battle.skill.skill_cl_second_wind` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_second_wind.png` | 1710 | - | 300 | 4 | 9/14 |
| `battle.skill.skill_cl_armor_crush` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_armor_crush.png` | 1150 | 80 | 280 | 4 | 8/10 |
| `battle.skill.skill_cl_stomp` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_stomp.png` | 1350 | - | 400 | 4 | 8/11 |
| `battle.skill.skill_cl_fortress` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_fortress.png` | 2110 | - | 300 | 6 | 11/16 |
| `battle.skill.skill_cl_tremor` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_tremor.png` | 1450 | 80 | 550 | 4 | 9/13 |
| `battle.skill.skill_cl_power_strike` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_power_strike.png` | 1000 | 120 | 280 | 4 | 8/10 |
| `battle.skill.skill_cl_aim` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_aim.png` | 1530 | - | 250 | 6 | 8/13 |
| `battle.skill.skill_cl_combo` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_combo.png` | 1550 | 120 | 220 | 4 | 9/13 |
| `battle.skill.skill_cl_rend` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_rend.png` | 1150 | 80 | 260 | 4 | 8/10 |
| `battle.skill.skill_cl_dash` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_dash.png` | 1610 | - | 200 | 6 | 8/13 |
| `battle.skill.skill_cl_vital` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_vital.png` | 1050 | 80 | 300 | 5 | 8/10 |
| `battle.skill.skill_cl_finisher` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_finisher.png` | 1700 | 220 | 600 | 7 | 10/14 |
| `battle.skill.skill_cl_shadow_dance` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_shadow_dance.png` | 1750 | 80 | 250 | 5 | 11/13 |
| `battle.skill.skill_cl_energy_orb` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_energy_orb.png` | 1710 | 50 | 420 | 5 | 8/14 |
| `battle.skill.skill_cl_focus` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_focus.png` | 1610 | - | 250 | 5 | 8/13 |
| `battle.skill.skill_cl_elemental_rain` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_elemental_rain.png` | 2210 | - | 400 | 5 | 11/17 |
| `battle.skill.skill_cl_pierce` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_pierce.png` | 1660 | 50 | 300 | 6 | 8/13 |
| `battle.skill.skill_cl_freeze` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_freeze.png` | 1910 | 50 | 350 | 6 | 10/15 |
| `battle.skill.skill_cl_seal` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_seal.png` | 1810 | 50 | 380 | 5 | 8/14 |
| `battle.skill.skill_cl_meteor` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_meteor.png` | 2560 | 50 | 500 | 8 | 11/17 |
| `battle.skill.skill_cl_spell_storm` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_spell_storm.png` | 2310 | - | 400 | 7 | 11/17 |
| `battle.skill.skill_cl_mend` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_mend.png` | 1610 | - | 300 | 5 | 8/13 |
| `battle.skill.skill_cl_cheer` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_cheer.png` | 1610 | - | 350 | 6 | 8/13 |
| `battle.skill.skill_cl_healing_rain` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_healing_rain.png` | 2110 | - | 300 | 5 | 11/16 |
| `battle.skill.skill_cl_purify` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_purify.png` | 2020 | - | 320 | 5 | 10/15 |
| `battle.skill.skill_cl_rally` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_rally.png` | 1930 | - | 350 | 6 | 10/15 |
| `battle.skill.skill_cl_channel` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_channel.png` | 1730 | - | 300 | 4 | 9/14 |
| `battle.skill.skill_cl_undying` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_undying.png` | 1810 | - | 300 | 5 | 9/14 |
| `battle.skill.skill_cl_aura` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_cl_aura.png` | 1910 | - | 300 | 6 | 11/16 |
| `battle.skill.skill_e_vine_lash` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_vine_lash.png` | 1050 | 80 | 300 | 4 | 8/10 |
| `battle.skill.skill_e_poison_spore` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_poison_spore.png` | 1710 | - | 350 | 5 | 9/14 |
| `battle.skill.skill_e_spark_peck` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_spark_peck.png` | 950 | 50 | 250 | 4 | 7/9 |
| `battle.skill.skill_e_ember_bite` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_ember_bite.png` | 1050 | 80 | 280 | 3 | 8/10 |
| `battle.skill.skill_e_bubble` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_bubble.png` | 1710 | 50 | 320 | 6 | 9/14 |
| `battle.skill.skill_e_soothe` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_soothe.png` | 1610 | - | 300 | 4 | 8/13 |
| `battle.skill.skill_e_howl` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_howl.png` | 1910 | - | 400 | 6 | 9/15 |
| `battle.skill.skill_e_shadow_bite` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_shadow_bite.png` | 1100 | 80 | 280 | 5 | 10/12 |
| `battle.skill.skill_e_tusk_charge` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_tusk_charge.png` | 1250 | 120 | 420 | 3 | 9/12 |
| `battle.skill.skill_e_bark_skin` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_bark_skin.png` | 1710 | - | 250 | 6 | 10/15 |
| `battle.skill.skill_e_root_quake` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_root_quake.png` | 2110 | - | 420 | 5 | 9/17 |
| `battle.skill.skill_e_corrupt_bloom` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_corrupt_bloom.png` | 2110 | - | 400 | 6 | 10/16 |
| `battle.skill.skill_e_thorn_storm` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_thorn_storm.png` | 2000 | - | 600 | 5 | 12/16 |
| `battle.skill.skill_e_iron_shell` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_iron_shell.png` | 1710 | - | 250 | 7 | 10/15 |
| `battle.skill.skill_e_metal_claw` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_metal_claw.png` | 1050 | 80 | 260 | 4 | 8/10 |
| `battle.skill.skill_e_dive` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_dive.png` | 1250 | 80 | 350 | 4 | 9/12 |
| `battle.skill.skill_e_lava_spit` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_lava_spit.png` | 1710 | 50 | 320 | 7 | 9/14 |
| `battle.skill.skill_e_frost_breath` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_frost_breath.png` | 1810 | - | 350 | 7 | 9/14 |
| `battle.skill.skill_e_rock_slam` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_rock_slam.png` | 1350 | 120 | 450 | 5 | 8/11 |
| `battle.skill.skill_e_thunder_charge` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_thunder_charge.png` | 1550 | 50 | 400 | 5 | 10/13 |
| `battle.skill.skill_e_magma_breath` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_magma_breath.png` | 2110 | - | 450 | 8 | 9/17 |
| `battle.skill.skill_e_dragon_roar` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_dragon_roar.png` | 2010 | - | 350 | 6 | 10/15 |
| `battle.skill.skill_e_meteor` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_meteor.png` | 2860 | 50 | 600 | 9 | 12/19 |
| `battle.skill.skill_e_stone_guard` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_stone_guard.png` | 1810 | - | 300 | 6 | 9/14 |
| `battle.skill.skill_e_rune_beam` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_rune_beam.png` | 1710 | 50 | 380 | 7 | 9/15 |
| `battle.skill.skill_e_holy_ward` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_holy_ward.png` | 1710 | - | 300 | 4 | 9/14 |
| `battle.skill.skill_e_wraith_touch` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_wraith_touch.png` | 1710 | - | 300 | 7 | 9/14 |
| `battle.skill.skill_e_curse` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_curse.png` | 2010 | - | 400 | 8 | 9/15 |
| `battle.skill.skill_e_idol_flame` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_idol_flame.png` | 2110 | - | 400 | 8 | 10/16 |
| `battle.skill.skill_e_doom_mark` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_doom_mark.png` | 2010 | - | 400 | 5 | 9/15 |
| `battle.skill.skill_e_bronze_crush` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_bronze_crush.png` | 1350 | 120 | 450 | 6 | 8/11 |
| `battle.skill.skill_e_seal_quake` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.skill.skill_e_seal_quake.png` | 2400 | 120 | 600 | 5 | 13/17 |
| `battle.reaction.reaction_shock` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_shock.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.reaction.reaction_steam` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_steam.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.reaction.reaction_wildfire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_wildfire.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.reaction.reaction_shatter` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_shatter.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.reaction.reaction_purify` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_purify.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.reaction.reaction_eclipse` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.reaction.reaction_eclipse.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.poison.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.poison.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.poison.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.poison.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.poison.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.poison.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.burn.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.burn.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.burn.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.burn.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.burn.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.burn.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.wet.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.wet.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.wet.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.wet.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.wet.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.wet.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.freeze.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.freeze.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.freeze.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.freeze.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.freeze.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.freeze.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.stun.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.stun.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.stun.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.stun.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.stun.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.stun.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.disable.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.disable.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.disable.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.disable.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.disable.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.disable.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.doom.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.doom.apply.png` | 650 | 80 | 220 | 6 | 7/9 |
| `battle.status.doom.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.doom.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.doom.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.doom.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.atkUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkUp.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.atkUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.atkUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.atkDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkDown.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.atkDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.atkDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.atkDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.defUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defUp.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.defUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.defUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.defDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defDown.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.defDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.defDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.defDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.matkUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkUp.apply.png` | 650 | 80 | 220 | 6 | 7/9 |
| `battle.status.matkUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.matkUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.matkDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkDown.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.matkDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.matkDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.matkDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.mdefUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefUp.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.mdefUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.mdefUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.mdefDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefDown.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.mdefDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.mdefDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.mdefDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.accUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accUp.apply.png` | 650 | 80 | 220 | 6 | 7/9 |
| `battle.status.accUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.accUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.accDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accDown.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.accDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.accDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.accDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.evaUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaUp.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.evaUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.evaUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.evaDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaDown.apply.png` | 650 | 80 | 220 | 5 | 7/9 |
| `battle.status.evaDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.evaDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.evaDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.spdUp.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdUp.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.spdUp.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdUp.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.spdUp.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdUp.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.spdDown.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdDown.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.spdDown.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdDown.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.spdDown.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.spdDown.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.shield.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.shield.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.shield.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.shield.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.shield.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.shield.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.taunt.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.taunt.apply.png` | 650 | 80 | 220 | 6 | 7/9 |
| `battle.status.taunt.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.taunt.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.taunt.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.taunt.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.regen.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.regen.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.regen.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.regen.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.regen.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.regen.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.status.autoRevive.apply` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.autoRevive.apply.png` | 650 | 80 | 220 | 4 | 7/9 |
| `battle.status.autoRevive.loop` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.autoRevive.loop.png` | 2700 | - | - | 0 | 14/15 |
| `battle.status.autoRevive.expire` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.status.autoRevive.expire.png` | 900 | - | - | 0 | 5/6 |
| `battle.variant.skill_cl_power_strike.reduce` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.reduce.png` | 1000 | - | 280 | 0 | 5/10 |
| `battle.variant.skill_cl_power_strike.crit` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.crit.png` | 1000 | 120 | 280 | 5 | 8/10 |
| `battle.variant.skill_cl_power_strike.fast` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.fast.png` | 550 | 120 | 154 | 4 | 6/8 |
| `battle.variant.skill_cl_power_strike.ko` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.ko.png` | 1000 | 120 | 280 | 5 | 8/10 |
| `battle.variant.skill_cl_power_strike.win` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.win.png` | 1000 | 120 | 280 | 4 | 8/10 |
| `battle.variant.skill_ult_nh.reduce` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_ult_nh.reduce.png` | 4120 | - | 500 | 0 | 8/28 |
| `battle.variant.skill_ult_qs.reduce` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_ult_qs.reduce.png` | 4200 | - | 600 | 0 | 6/27 |
| `battle.variant.skill_ult_dm.reduce` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_ult_dm.reduce.png` | 3860 | - | 450 | 0 | 7/24 |
| `battle.variant.skill_cl_power_strike.multi33` | ok | `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/battle.variant.skill_cl_power_strike.multi33.png` | 1000 | 120 | 280 | 4 | 8/10 |

## Không chụp được (absent)

(không)

## Sheet tổng

- ultimate: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.ultimate.png`
- skill.1: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.skill.1.png`
- skill.2: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.skill.2.png`
- skill.3: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.skill.3.png`
- skill.4: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.skill.4.png`
- skill.5: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.skill.5.png`
- reaction: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.reaction.png`
- status.1: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.status.1.png`
- status.2: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.status.2.png`
- status.3: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.status.3.png`
- status.4: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.status.4.png`
- variant: `docs/animation-review/capture/runs/20261104-184504-755dce5-ff9beea5/sheets/_overview.variant.png`

## Ghi chú phương pháp

- ULT_SKIPPABLE: the lab has no skip control, so whether an Ultimate can be skipped is not measured (check in the game)
- status cases: the status is put on by the plain attack alone; `loop` shows it lasting, `expire` plays its end (an empty step after it)
- overview sheets show the frame that differs most from the first, not the impact frame

## Chưa có trong harness

- map-walk (Electron, phase 2)
- targeting / turn indicator / HUD (DOM overlay is not part of the lab stage)
- video (--video not implemented; frames and sheets are the evidence)
