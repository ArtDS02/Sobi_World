# AUDIT kịch bản animation (dữ liệu)

Sinh bằng `npm run anim:audit` từ `content/adventure/battle_fx.json`, `skills.json`, manifest asset. **Không sửa tay.** Cách đọc và ngưỡng: [README.md](README.md). Cờ là gợi ý cho reviewer, không phải điểm.

## Theo hệ

| hệ | skill | ưu tiên TB | hình chủ đạo tĩnh | tác động dưới bậc | cờ hay gặp |
|---|---|---|---|---|---|
| EARTH | 5 | 12 | 3 | 0 | NO_AFTERMATH ×4, STATIC_HERO ×3, STATIC_SHARE ×3 |
| SELF | 15 | 11.6 | 7 | 0 | NO_AFTERMATH ×8, STATIC_HERO ×7, STATIC_SHARE ×7 |
| WATER | 6 | 10.5 | 5 | 1 | STATIC_HERO ×5, NO_AFTERMATH ×4, STATIC_SHARE ×4 |
| DARK | 7 | 10.4 | 6 | 1 | STATIC_HERO ×6, STATIC_SHARE ×5, NO_AFTERMATH ×4 |
| LIGHT | 3 | 9.3 | 1 | 1 | NO_AFTERMATH ×2, DURATION_UNDER ×2, STATIC_HERO ×1 |
| SUPPORT | 42 | 7.7 | 25 | 0 | STATIC_SHARE ×26, STATIC_HERO ×25, DURATION_OVER ×6 |
| FIRE | 10 | 7.6 | 6 | 0 | STATIC_SHARE ×7, STATIC_HERO ×6, NO_AFTERMATH ×4 |
| METAL | 6 | 7.5 | 3 | 0 | DURATION_UNDER ×4, STATIC_HERO ×3, STATIC_SHARE ×3 |
| VOID | 4 | 7 | 3 | 0 | STATIC_HERO ×3, STATIC_SHARE ×3, FEW_LAYERS ×2 |
| LIGHTNING | 7 | 6.7 | 3 | 0 | NO_AFTERMATH ×4, SHARED_FLIPBOOK_HERO ×4, STATIC_HERO ×3 |
| NATURE | 7 | 4.6 | 2 | 0 | NO_AFTERMATH ×4, STATIC_HERO ×2, STATIC_SHARE ×1 |

## Flipbook dùng nhiều

| ảnh | số skill |
|---|---|
| `fx_pow_star` | 17 |
| `fx_shield_dome` | 11 |
| `fx_boom` | 10 |
| `fx_flame_burst` | 9 |
| `fx_slash_arc` | 7 |
| `fx_ground_crack` | 7 |
| `fx_splash` | 5 |
| `fx_poof` | 5 |
| `fx_rock_spike` | 4 |
| `fx_bloom` | 4 |
| `fx_bolt_strike` | 4 |
| `fx_vine_grab` | 4 |
| `fx_void_portal` | 4 |
| `fx_light_pillar` | 3 |
| `fx_wind_swirl` | 3 |
| `fx_claw` | 3 |
| `fx_ink_splat` | 2 |
| `fx_rune_lock` | 2 |
| `fx_lava_pop` | 2 |
| `fx_ice_encase` | 2 |
| `fx_bite` | 2 |

## Mọi skill (ưu tiên cao trước)

| skill | loại | hệ | power | bậc cần / có | ms | ảnh tĩnh | hình chủ đạo | lớp | cờ | ưu tiên |
|---|---|---|---|---|---|---|---|---|---|---|
| `skill_cl_energy_orb` | class | SELF | 1.5 | T3 / T3 | 1020 | 100% | prop `fxp_bubble_big` (0) | 3 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER | 27 |
| `skill_cl_armor_crush` | class | SELF | 0.9 | T2 / T4 | 880 | 43% | strip `$boom` (0) | 3 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER, NO_AFTERMATH, DURATION_UNDER | 24 |
| `skill_cl_fortress` | class | SUPPORT | 0 | T0 / T2 | 1450 | 80% | prop `fxp_fortress` (0) | 2 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER, DURATION_OVER | 21 |
| `skill_cl_finisher` | class | SELF | 3 | T3 / T4 | 1550 | 63% | prop `fxp_finisher_emblem` (0) | 5 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 18 |
| `skill_cl_healing_rain` | class | SUPPORT | 0 | T0 / T0 | 1550 | 100% | prop `fxp_rain_cloud` (0) | 2 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 18 |
| `skill_cl_seal` | class | SELF | 0.6 | T1 / T1 | 1100 | 38% | prop `fxs_rune_a` (0) | 3 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 18 |
| `skill_cl_vital` | class | SELF | 1.3 | T2 / T2 | 900 | 35% | prop `fxp_crosshair` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 18 |
| `skill_e_wraith_touch` | enemy | DARK | 1.3 | T2 / T0 | 1050 | 100% | prop `fxp_ghost_hand` (0) | 4 | STATIC_HERO, STATIC_SHARE, IMPACT_UNDER_TIER, NO_AFTERMATH | 18 |
| `skill_qs_rock_smash` | unique | EARTH | 1.4 | T3 / T4 | 1200 | 62% | prop `fxp_boulder` (0) | 3 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER | 18 |
| `skill_qt_lumina` | unique | LIGHT | 2.2 | T3 / T3 | 1060 | 52% | prop `fxp_lumina_ring` (0) | 3 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER | 18 |
| `skill_e_seal_quake` | enemy | EARTH | 1.3 | T2 / T4 | 2400 | 65% | prop `fxp_seal_circle` (0) | 4 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER, NO_AFTERMATH, DURATION_OVER | 16 |
| `skill_cl_aim` | class | SUPPORT | 0 | T0 / T0 | 950 | 100% | prop `fxp_crosshair` (0) | 3 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_cheer` | class | SUPPORT | 0 | T0 / T0 | 1000 | 100% | prop `fxs_star` (0) | 2 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_elemental_rain` | class | SELF | 0.95 | T2 / T1 | 1300 | 100% | strip `$boom` (0) | 3 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_meteor` | class | SELF | 1.6 | T3 / T4 | 1550 | 30% | prop `fxp_meteor` (0) | 5 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_rally` | class | SUPPORT | 0 | T0 / T0 | 1300 | 100% | prop `fxp_banner` (0) | 2 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_taunt` | class | SUPPORT | 0 | T0 / T0 | 900 | 51% | prop `fxp_taunt_badge` (0) | 2 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_cl_undying` | class | SUPPORT | 0 | T0 / T0 | 1050 | 100% | prop `fxs_heart` (0) | 2 | STATIC_HERO, STATIC_SHARE | 15 |
| `skill_e_rock_slam` | enemy | EARTH | 1.5 | T3 / T4 | 1050 | 60% | prop `fxp_rock_fist` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH, DURATION_UNDER | 14 |
| `skill_cl_freeze` | class | WATER | 0.8 | T1 / T2 | 1300 | 21% | prop `fxs_snowflake` (0) | 4 | STATIC_HERO, NO_AFTERMATH | 12 |
| `skill_dm_nightmare` | unique | DARK | 1.2 | T2 / T1 | 1300 | 58% | prop `fxp_nightmare_mask` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_bronze_crush` | enemy | METAL | 2 | T3 / T4 | 1200 | 60% | prop `fxp_bronze_fist` (0) | 4 | STATIC_HERO, STATIC_SHARE, DURATION_UNDER | 12 |
| `skill_e_bubble` | enemy | WATER | 1 | T2 / T1 | 1100 | 58% | prop `fxs_bubble` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_corrupt_bloom` | enemy | NATURE | 0.5 | T1 / T0 | 1500 | 100% | prop `fxp_corrupt_flower` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_curse` | enemy | DARK | 0.4 | T1 / T0 | 1400 | 100% | prop `fxp_curse_eye` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_doom_mark` | enemy | SUPPORT | 0 | T0 / T0 | 1450 | 100% | prop `fxp_doom_clock` (0) | 2 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 12 |
| `skill_e_dragon_roar` | enemy | SUPPORT | 0 | T0 / T3 | 1250 | 100% | prop `fxp_dragon_roar` (0) | 3 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER | 12 |
| `skill_e_idol_flame` | enemy | FIRE | 1 | T2 / T3 | 1500 | 50% | prop `fxp_flame_crown` (0) | 5 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_lava_spit` | enemy | FIRE | 1.2 | T2 / T3 | 1120 | 36% | prop `fxs_ember` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_e_meteor` | enemy | FIRE | 1.6 | T3 / T4 | 2200 | 46% | prop `fxp_meteor` (0) | 5 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 12 |
| `skill_hg_forge_fire` | unique | SUPPORT | 0 | T0 / T2 | 1250 | 78% | prop `fxp_forge_anvil` (0) | 4 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER | 12 |
| `skill_ld_call_thunder` | unique | LIGHTNING | 1 | T2 / T3 | 1600 | 67% | prop `fxp_storm_cloud` (0) | 4 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 12 |
| `skill_nh_bubble` | unique | WATER | 1.3 | T2 / T2 | 1160 | 65% | prop `fxp_bubble_big` (0) | 3 | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | 12 |
| `skill_nh_tide_song` | unique | SUPPORT | 0 | T0 / T0 | 1450 | 79% | prop `fxp_wave_crest` (0) | 3 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 12 |
| `skill_nh_tsunami` | unique | WATER | 1.1 | T2 / T3 | 1780 | 55% | prop `fxp_wave_crest` (0) | 4 | STATIC_HERO, STATIC_SHARE, DURATION_OVER | 12 |
| `skill_tg_bronze_wall` | unique | SUPPORT | 0 | T0 / T3 | 1200 | 70% | prop `fxp_bronze_shield` (0) | 3 | STATIC_HERO, STATIC_SHARE, IMPACT_OVER_TIER | 12 |
| `skill_tg_steel_slash` | unique | METAL | 1.4 | T3 / T3 | 960 | 31% | prop `fxp_steel_blade` (0) | 4 | STATIC_HERO, STATIC_SHARE, DURATION_UNDER | 12 |
| `skill_dm_night_net` | unique | DARK | 0.8 | T1 / T2 | 1500 | 100% | prop `fxp_night_net` (0) | 4 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_e_iron_shell` | enemy | SUPPORT | 0 | T0 / T1 | 1050 | 58% | prop `fxs_metal_bit` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_e_rune_beam` | enemy | LIGHT | 1.4 | T3 / T1 | 860 | 0% | beam (1) | 4 | IMPACT_UNDER_TIER, NO_AFTERMATH, DURATION_UNDER | 10 |
| `skill_e_soothe` | enemy | SUPPORT | 0 | T0 / T0 | 1050 | 100% | prop `fxs_drop` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_e_stone_guard` | enemy | SUPPORT | 0 | T0 / T0 | 1200 | 100% | prop `fxp_stone_plate` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_e_thorn_storm` | enemy | NATURE | 1.3 | T2 / T4 | 2000 | 26% | prop `fxs_thorn` (0) | 5 | STATIC_HERO, IMPACT_OVER_TIER, DURATION_OVER | 10 |
| `skill_e_tusk_charge` | enemy | EARTH | 1.6 | T3 / T4 | 1150 | 0% | strip `fx_boom` (0.5) | 3 | NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER, SHARED_FLIPBOOK_HERO | 10 |
| `skill_hg_inferno_hammer` | unique | FIRE | 2.3 | T3 / T4 | 1300 | 38% | prop `fxp_fire_hammer` (0) | 4 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_hk_pure_impact` | unique | VOID | 1.15 | T2 / T3 | 1020 | 74% | prop `fxp_void_fist` (0) | 3 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_ld_thunder_strike` | unique | LIGHTNING | 1.4 | T3 / T4 | 1000 | 14% | prop `fxp_horn_sigil` (0) | 5 | STATIC_HERO, NO_AFTERMATH, DURATION_UNDER | 10 |
| `skill_mm_blossom` | unique | SUPPORT | 0 | T0 / T0 | 1400 | 100% | prop `fxp_flower_big` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_nh_soothe` | unique | SUPPORT | 0 | T0 / T0 | 1060 | 100% | prop `fxp_heart_drop` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_qs_mountain_shell` | unique | SUPPORT | 0 | T0 / T1 | 1320 | 100% | prop `fxp_mountain_trio` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_qs_stone_skin` | unique | SUPPORT | 0 | T0 / T0 | 1080 | 57% | prop `fxp_stone_plate` (0) | 3 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_qt_first_light` | unique | SUPPORT | 0 | T0 / T0 | 1400 | 73% | prop `fxp_sun_disc` (0) | 4 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_qt_guiding_lamp` | unique | SUPPORT | 0 | T0 / T0 | 1280 | 73% | prop `fxp_mini_lantern` (0) | 2 | STATIC_HERO, STATIC_SHARE | 10 |
| `skill_cl_power_strike` | class | SELF | 1.8 | T3 / T4 | 930 | 0% | strip `fx_slash_arc` (0.5) | 4 | NO_AFTERMATH, DURATION_UNDER, SHARED_FLIPBOOK_HERO | 9 |
| `skill_cl_shield_wall` | class | SUPPORT | 0 | T0 / T0 | 1150 | 0% | strip `fx_shield_dome` (0.5) | 1 | FEW_LAYERS, SHARED_FLIPBOOK_HERO | 9 |
| `skill_ult_qs` | ultimate | SUPPORT | 0 | T4 / T4 | 3300 | 90% | prop `fxp_turtle_mountain` (0) | 4 | STATIC_HERO, STATIC_SHARE, NO_PREPARATION, FEW_LAYERS | 9 |
| `skill_dm_ink` | unique | DARK | 1.3 | T2 / T2 | 1020 | 21% | prop `fxs_ink_blob` (0) | 4 | STATIC_HERO, NO_AFTERMATH | 8 |
| `skill_e_frost_breath` | enemy | WATER | 1 | T2 / T0 | 1250 | 0% | strip `fx_ice_encase` (0.5) | 4 | IMPACT_UNDER_TIER, NO_AFTERMATH | 8 |
| `skill_hg_hot_claw` | unique | FIRE | 1.3 | T2 / T3 | 1040 | 35% | strip `fx_flame_burst` (0.5) | 4 | STATIC_SHARE, NO_AFTERMATH, SHARED_FLIPBOOK_HERO | 8 |
| `skill_ult_dm` | ultimate | DARK | 1.5 | T4 / T4 | 3100 | 94% | prop `fxp_octo_tentacle` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_hg` | ultimate | FIRE | 2 | T4 / T4 | 3300 | 63% | prop `fxp_forge_anvil` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_hk` | ultimate | VOID | 2.2 | T4 / T4 | 3200 | 100% | prop `fxp_sky_bell` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_ld` | ultimate | LIGHTNING | 2.5 | T4 / T4 | 3100 | 58% | prop `fxp_horn_sigil` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_mm` | ultimate | SUPPORT | 0 | T4 / T4 | 3400 | 81% | prop `fxp_mother_tree` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_mythical` | ultimate | VOID | 2 | T4 / T4 | 3500 | 59% | prop `fxp_spirit_circle` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_nh` | ultimate | SUPPORT | 0 | T4 / T4 | 3300 | 61% | prop `fxp_whale` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_qt` | ultimate | SUPPORT | 0 | T4 / T4 | 3200 | 100% | prop `fxp_moon_lantern` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_tg` | ultimate | METAL | 2 | T4 / T4 | 3300 | 87% | prop `fxp_bronze_knight` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_ult_trident` | ultimate | WATER | 2.2 | T4 / T4 | 3200 | 68% | prop `fxp_trident` (0) | 4 | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | 7 |
| `skill_cl_combo` | class | SELF | 0.6 | T1 / T4 | 1400 | 0% | strip `fx_boom` (0.5) | 3 | IMPACT_OVER_TIER, SHARED_FLIPBOOK_HERO | 6 |
| `skill_cl_shadow_dance` | class | SELF | 0.6 | T1 / T3 | 1700 | 0% | strip `fx_poof` (0.5) | 4 | IMPACT_OVER_TIER, DURATION_OVER | 6 |
| `skill_cl_stomp` | class | SELF | 0.6 | T1 / T4 | 900 | 0% | strip `fx_ground_crack` (0.5) | 3 | IMPACT_OVER_TIER, SHARED_FLIPBOOK_HERO | 6 |
| `skill_e_bark_skin` | enemy | SUPPORT | 0 | T0 / T0 | 1050 | 43% | strip `fx_shield_dome` (0.5) | 2 | STATIC_SHARE, SHARED_FLIPBOOK_HERO | 6 |
| `skill_e_dive` | enemy | LIGHTNING | 1.6 | T3 / T4 | 1250 | 0% | strip `fx_boom` (0.5) | 4 | NO_AFTERMATH, DURATION_UNDER, SHARED_FLIPBOOK_HERO | 6 |
| `skill_e_metal_claw` | enemy | METAL | 1.4 | T3 / T3 | 960 | 0% | strip `fx_claw` (0.5) | 3 | FEW_LAYERS, DURATION_UNDER | 6 |
| `skill_e_shadow_bite` | enemy | DARK | 1.4 | T3 / T2 | 1050 | 0% | strip `fx_poof` (0.5) | 3 | FEW_LAYERS, DURATION_UNDER | 6 |
| `skill_e_spark_peck` | enemy | LIGHTNING | 1.3 | T2 / T1 | 850 | 0% | strip `fx_pow_star` (0.5) | 4 | NO_AFTERMATH, DURATION_UNDER, SHARED_FLIPBOOK_HERO | 6 |
| `skill_tg_steel_charge` | unique | METAL | 2.2 | T3 / T4 | 1160 | 0% | strip `fx_boom` (0.5) | 4 | NO_AFTERMATH, DURATION_UNDER, SHARED_FLIPBOOK_HERO | 6 |
| `skill_ult_phoenix` | ultimate | FIRE | 1.8 | T4 / T4 | 3400 | 97% | prop `fxp_phoenix` (0) | 5 | STATIC_HERO, STATIC_SHARE | 5 |
| `skill_e_ember_bite` | enemy | FIRE | 1.3 | T2 / T3 | 980 | 0% | strip `fx_flame_burst` (0.5) | 3 | NO_AFTERMATH, SHARED_FLIPBOOK_HERO | 4 |
| `skill_e_magma_breath` | enemy | FIRE | 1.1 | T2 / T4 | 1500 | 0% | strip `fx_flame_burst` (0.5) | 5 | IMPACT_OVER_TIER, SHARED_FLIPBOOK_HERO | 4 |
| `skill_e_thunder_charge` | enemy | LIGHTNING | 0.9 | T2 / T3 | 1400 | 0% | strip `fx_slash_arc` (0.5) | 4 | NO_AFTERMATH, SHARED_FLIPBOOK_HERO | 4 |
| `skill_e_vine_lash` | enemy | NATURE | 1.2 | T2 / T2 | 860 | 0% | strip `fx_vine_grab` (0.5) | 3 | NO_AFTERMATH, DURATION_UNDER | 4 |
| `skill_hk_void_vortex` | unique | VOID | 0.85 | T1 / T4 | 1250 | 0% | strip `fx_void_portal` (0.5) | 3 | IMPACT_OVER_TIER, NO_AFTERMATH | 4 |
| `skill_ld_swift_bolt` | unique | SUPPORT | 0 | T0 / T0 | 1000 | 0% | - | 1 | FEW_LAYERS | 4 |
| `skill_cl_aura` | class | SUPPORT | 0 | T0 / T0 | 1250 | 0% | strip `fx_shield_dome` (0.5) | 2 | SHARED_FLIPBOOK_HERO | 3 |
| `skill_cl_hold_fast` | class | SUPPORT | 0 | T0 / T0 | 950 | 0% | strip `fx_shield_dome` (0.5) | 2 | SHARED_FLIPBOOK_HERO | 3 |
| `skill_cl_pierce` | class | SELF | 0.9 | T2 / T2 | 750 | 0% | beam (1) | 4 | DURATION_UNDER | 3 |
| `skill_cl_purify` | class | SUPPORT | 0 | T0 / T0 | 1500 | 0% | strip `fx_light_pillar` (0.5) | 3 | DURATION_OVER | 3 |
| `skill_cl_rend` | class | SELF | 1.1 | T2 / T3 | 960 | 0% | strip `fx_claw` (0.5) | 4 | NO_AFTERMATH | 3 |
| `skill_cl_spell_storm` | class | SELF | 0.7 | T1 / T2 | 1400 | 0% | strip `fx_wind_swirl` (0.5) | 3 | NO_AFTERMATH | 3 |
| `skill_cl_tremor` | class | SELF | 1 | T2 / T4 | 1200 | 0% | strip `fx_rock_spike` (0.5) | 3 | IMPACT_OVER_TIER | 3 |
| `skill_dm_ink_veil` | unique | SUPPORT | 0 | T0 / T0 | 1420 | 0% | strip `fx_poof` (0.5) | 4 | DURATION_OVER | 2 |
| `skill_e_poison_spore` | enemy | NATURE | 0.8 | T1 / T0 | 1100 | 0% | cone (1) | 3 | NO_AFTERMATH | 2 |
| `skill_hg_lava` | unique | FIRE | 0.9 | T2 / T3 | 1550 | 0% | strip `fx_lava_pop` (0.5) | 4 | DURATION_OVER | 2 |
| `skill_ld_chain` | unique | LIGHTNING | 0.7 | T1 / T2 | 1300 | 0% | strip `fx_pow_star` (0.5) | 3 | SHARED_FLIPBOOK_HERO | 2 |
| `skill_mm_binding_roots` | unique | NATURE | 0.6 | T1 / T2 | 1300 | 0% | strip `fx_vine_grab` (0.5) | 3 | NO_AFTERMATH | 2 |
| `skill_mm_poison_thorn` | unique | NATURE | 1.2 | T2 / T2 | 1060 | 0% | strip `fx_pow_star` (0.5) | 3 | SHARED_FLIPBOOK_HERO | 2 |
| `skill_qs_quake` | unique | EARTH | 1 | T2 / T4 | 1220 | 0% | strip `fx_rock_spike` (0.5) | 3 | IMPACT_OVER_TIER | 2 |
| `skill_tg_armor_break` | unique | METAL | 0.9 | T2 / T3 | 960 | 0% | tether (1) | 4 | NO_AFTERMATH | 2 |
| `skill_cl_channel` | class | SUPPORT | 0 | T0 / T0 | 1300 | 0% | tether (1) | 3 |  | 0 |
| `skill_cl_dash` | class | SUPPORT | 0 | T0 / T0 | 1000 | 0% | strip `fx_wind_swirl` (0.5) | 3 |  | 0 |
| `skill_cl_focus` | class | SUPPORT | 0 | T0 / T0 | 1050 | 0% | - | 2 |  | 0 |
| `skill_cl_mend` | class | SUPPORT | 0 | T0 / T0 | 1000 | 20% | strip `fx_bloom` (0.5) | 2 |  | 0 |
| `skill_cl_second_wind` | class | SUPPORT | 0 | T0 / T0 | 1000 | 0% | strip `fx_wind_swirl` (0.5) | 2 |  | 0 |
| `skill_e_holy_ward` | enemy | SUPPORT | 0 | T0 / T0 | 950 | 0% | strip `fx_bloom` (0.5) | 2 |  | 0 |
| `skill_e_howl` | enemy | SUPPORT | 0 | T0 / T1 | 1300 | 0% | - | 4 |  | 0 |
| `skill_e_root_quake` | enemy | NATURE | 0.9 | T2 / T3 | 1060 | 0% | strip `fx_rock_spike` (0.5) | 3 |  | 0 |
| `skill_hk_phase_shift` | unique | SUPPORT | 0 | T0 / T0 | 1150 | 0% | - | 2 |  | 0 |
| `skill_hk_void_veil` | unique | SUPPORT | 0 | T0 / T0 | 1200 | 0% | strip `fx_void_portal` (0.5) | 3 |  | 0 |
| `skill_mm_sprout` | unique | SUPPORT | 0 | T0 / T0 | 950 | 0% | strip `fx_bloom` (0.5) | 2 |  | 0 |
| `skill_qt_ray` | unique | LIGHT | 1.3 | T2 / T1 | 900 | 0% | beam (1) | 4 |  | 0 |

## Nghĩa của cờ

- `STATIC_HERO`: hình chủ đạo là ảnh tĩnh chỉ được di chuyển / phóng / xoay
- `STATIC_SHARE`: > 30% diện tích hình vẽ là ảnh tĩnh
- `IMPACT_UNDER_TIER`: tác động (hit-stop / rung / chớp) thấp hơn bậc sức mạnh ≥ 2 bậc
- `IMPACT_OVER_TIER`: tác động cao hơn bậc sức mạnh ≥ 2 bậc
- `NO_PREPARATION`: không có lấy đà của người ra đòn trước va chạm
- `NO_AFTERMATH`: không có dư âm sau va chạm (hạt, vết, khói)
- `FEW_LAYERS`: ít lớp hơn mức tối thiểu theo bậc
- `DURATION_OVER`: dài hơn ngân sách thời gian
- `DURATION_UNDER`: ngắn hơn ngân sách thời gian
- `SHARED_FLIPBOOK_HERO`: hình chủ đạo là flipbook dùng chung > 5 skill
- `NO_SCRIPT`: không có kịch bản
