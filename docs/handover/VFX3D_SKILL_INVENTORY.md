# Danh mục skill cho việc làm animation 3D (sinh tự động)

Sinh bằng `npx tsx scripts/animation/skillInventory.ts`; **đừng sửa tay**. Dữ liệu gốc: `content/adventure/skills.json`, `battle_fx.json`.

`Bậc` suy từ `power`: T0 hỗ trợ · T1 < 0,9 · T2 < 1,4 · T3 ≥ 1,4 · T4 tuyệt kỹ (chuẩn: `docs/animation/library/STANDARDS.md` §4). `3D hiện tại` = act `vfx3d` đang dùng (prototype, decision 059).

Tổng: 134 skill.


## WATER

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_cl_freeze` | Đóng Băng | class | enemy | T1 | 20/3 | freeze 60% 1l | Phép Nước vào một kẻ địch, 60% Đóng băng 1 lượt. | `ice_bloom` | 1500 |
| `skill_e_bubble` | Phun Bọt | enemy | enemy | T2 | 8/1 | wet | Phun bọt nước, làm Ướt. | `bubble_spray` | 1300 |
| `skill_e_frost_breath` | Hơi Thở Băng | enemy | enemy | T2 | 12/3 | freeze 25% 1l | Hơi lạnh, 25% Đóng băng 1 lượt. | `frost_breath` | 1500 |
| `skill_e_tide_slap` | Quật Sóng | enemy | enemy | T2 | 8/1 | wet 50% | Quật sóng vào một mục tiêu, có thể làm nó Ướt. | `tide_slap` | 1050 |
| `skill_e_whirlpool` | Xoáy Nước | enemy | allEnemies | T2 | 20/3 | spdDown 40% | Xoáy nước cuốn cả đội, có thể làm Chậm. | `whirlpool_row` | 2000 |
| `skill_ult_trident` | Đinh Ba Hải Vương | ultimate | allEnemies | T4 | 0/0 | wet, stun 30% | Tuyệt kỹ: đinh ba triệu sóng đánh mọi kẻ địch, làm Ướt và 30% làm choáng. | `trident_sea` | 3200 |
| `skill_nh_bubble` | Bong Bóng Nước | unique | enemy | T2 | 8/0 | wet | Bắn bong bóng nước vào một kẻ địch và làm nó Ướt. | `bubble_shot` | 1400 |
| `skill_nh_tsunami` | Sóng Thần Cổ | unique | allEnemies | T2 | 28/3 | spdDown 60% | Sóng lớn đánh mọi kẻ địch, có thể làm chúng Chậm. | `tsunami_sweep` | 2300 |
| `skill_nh_whirlpool` | Xoáy Nước Cổ | unique | allEnemies | T2 | 24/3 | wet, spdDown 50% | Xoáy nước cuốn mọi kẻ địch, làm Ướt và có thể làm Chậm. | `great_whirlpool` | 2300 |

## FIRE

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_ember_bite` | Cắn Than Hồng | enemy | enemy | T2 | 8/1 | burn 30% | Cắn lửa, 30% gây Bỏng. | `jaw_flame` | 1050 |
| `skill_e_idol_flame` | Lửa Tượng Thần | enemy | allEnemies | T2 | 16/2 | burn 30% | Lửa tượng thần phủ cả đội, 30% gây Bỏng. | `flame_pillars` | 1800 |
| `skill_e_lava_spit` | Phun Dung Nham | enemy | enemy | T2 | 10/1 | burn 40% | Phun dung nham, 40% gây Bỏng. | `lava_glob` | 1400 |
| `skill_e_magma_breath` | Hơi Thở Dung Nham | enemy | allEnemies | T2 | 20/3 | burn 50% | Phun dung nham lên cả đội, 50% gây Bỏng. | `magma_cone` | 1550 |
| `skill_e_meteor` | Mưa Thiên Thạch | enemy | allEnemies | T3 | 30/4 | — | Thiên thạch lửa rơi xuống cả đội. | `meteor_rain` | 2400 |
| `skill_ult_hg` | Lò Rèn Nguyên Thủy | ultimate | allEnemies | T4 | 0/0 | burn, atkUp→allies | Tuyệt kỹ: lửa lò rèn đánh mọi kẻ địch và gây Bỏng, cả đội tăng công. | `forge_ult` | 3300 |
| `skill_ult_phoenix` | Phượng Hoàng Tái Sinh | ultimate | allEnemies | T4 | 0/0 | burn, autoRevive→allies | Tuyệt kỹ: lửa phượng hoàng đánh mọi kẻ địch và gây Bỏng, cả đội nhận Bất khuất. | `phoenix_rebirth` | 3400 |
| `skill_hg_hot_claw` | Càng Nung | unique | enemy | T2 | 8/0 | burn 40% | Kẹp càng nóng vào một kẻ địch, 40% gây Bỏng. | `claw_clamp` | 1100 |
| `skill_hg_inferno_hammer` | Búa Hỏa Ngục | unique | enemy | T3 | 28/3 | — | Búa lửa giáng mạnh vào một kẻ địch. | `hammer_slam` | 1450 |
| `skill_hg_lava` | Phun Dung Nham | unique | allEnemies | T2 | 24/3 | burn 50% | Dung nham phủ mọi kẻ địch, 50% gây Bỏng. | `lava_flood` | 1550 |

## NATURE

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_corrupt_bloom` | Hoa Nhiễm Độc | enemy | allEnemies | T1 | 20/3 | poison 50% | Hoa nhiễm Umbraflux phun độc lên cả đội. | `corrupt_bloom` | 1550 |
| `skill_e_poison_spore` | Bào Tử Độc | enemy | enemy | T1 | 10/2 | poison 60% | Phun bào tử, dễ gây Trúng độc. | `spore_cone` | 1700 |
| `skill_e_root_quake` | Rễ Rung Chuyển | enemy | allEnemies | T2 | 16/2 | spdDown 40% | Rễ cây rung chuyển dưới cả đội, có thể làm Chậm. | `root_quake` | 1550 |
| `skill_e_thorn_storm` | Bão Gai | enemy | allEnemies | T2 | 24/3 | — | Bão gai quất cả đội. | `thorn_storm` | 2000 |
| `skill_e_vine_lash` | Quất Dây Leo | enemy | enemy | T2 | 6/0 | — | Quất dây leo vào một mục tiêu. | `vine_whip` | 1050 |
| `skill_mm_binding_roots` | Rễ Trói | unique | allEnemies | T1 | 20/3 | evaDown 80%, spdDown 50% | Rễ cây quấn mọi kẻ địch: Giảm né, có thể làm Chậm. | `root_bind` | 1450 |
| `skill_mm_poison_thorn` | Gai Độc | unique | enemy | T2 | 8/0 | poison 70% | Bắn gai vào một kẻ địch, dễ làm nó Trúng độc. | `thorn_volley` | 1500 |

## EARTH

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_boulder_toss` | Ném Tảng | enemy | enemy | T3 | 12/2 | — | Ném tảng đá nặng vào một mục tiêu. | `boulder_toss` | 1400 |
| `skill_e_rock_slam` | Nện Đá | enemy | enemy | T3 | 10/2 | stun 20% | Nện đá, 20% làm choáng. | `rock_fist` | 1650 |
| `skill_e_sand_veil` | Màn Cát | enemy | allEnemies | T1 | 16/3 | accDown 50% | Cát bay mù cả đội, dễ làm Giảm chính xác. | `sand_veil` | 1700 |
| `skill_e_seal_quake` | Địa Chấn Phong Ấn | enemy | allEnemies | T2 | 24/3 | stun 25% | Đất nứt quanh phong ấn, đánh cả đội, 25% làm choáng. | `seal_quake` | 2400 |
| `skill_e_tusk_charge` | Húc Nanh | enemy | enemy | T3 | 12/2 | stun 25% | Húc nanh mạnh, 25% làm choáng. | `tusk_charge` | 1600 |
| `skill_qs_boulder_roll` | Lăn Tảng | unique | enemy | T3 | 18/2 | stun 35% | Lăn tảng đá nghiền một kẻ địch, 35% làm choáng. | `boulder_roll` | 1500 |
| `skill_qs_dust_cloud` | Mây Bụi | unique | allEnemies | T1 | 20/3 | accDown 60% | Mây bụi mù mịt phủ mọi kẻ địch, dễ làm Giảm chính xác. | `dust_cloud` | 1550 |
| `skill_qs_quake` | Địa Chấn Cổ | unique | allEnemies | T2 | 28/3 | stun 25% | Đất rung dưới mọi kẻ địch, 25% làm choáng. | `quake_spikes` | 1550 |
| `skill_qs_rock_smash` | Đập Đá | unique | enemy | T3 | 8/1 | stun 30% | Đập đá vào một kẻ địch, 30% làm nó choáng. | `boulder_smash` | 1500 |

## METAL

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_bronze_crush` | Nghiền Đồng | enemy | enemy | T3 | 14/2 | defDown 70% | Nghiền bằng nắm đấm đồng, dễ làm Giảm thủ. | `bronze_fist` | 1500 |
| `skill_e_metal_claw` | Vuốt Thép | enemy | enemy | T3 | 8/1 | defDown 30% | Vuốt thép, 30% làm Giảm thủ. | `metal_claw` | 1050 |
| `skill_e_shield_bash` | Húc Khiên | enemy | enemy | T3 | 10/2 | stun 20% | Đập khiên vào một mục tiêu, 20% làm choáng. | `shield_bash` | 1600 |
| `skill_e_spike_volley` | Mưa Chông | enemy | allEnemies | T2 | 18/3 | defDown 30% | Chông thép rơi xuống cả đội, có thể Giảm thủ. | `spike_rain` | 2400 |
| `skill_ult_tg` | Đoàn Kỵ Thép | ultimate | allEnemies | T4 | 0/0 | defDown, shield 25%→self | Tuyệt kỹ: đánh mọi kẻ địch và làm Giảm thủ, tự tạo khiên 25% máu. | `steel_cavalry` | 3300 |
| `skill_tg_armor_break` | Phá Giáp | unique | enemy | T2 | 16/2 | defDown 80% | Đánh một kẻ địch, dễ làm nó Giảm thủ. | `armor_break` | 1500 |
| `skill_tg_spike_barrage` | Mưa Chông Thép | unique | randomEnemies ×4 | T1 | 24/3 | — | Bốn mũi chông thép phóng vào kẻ địch ngẫu nhiên. | `spike_barrage` | 1550 |
| `skill_tg_steel_charge` | Húc Thép | unique | enemy | T3 | 28/3 | stun 35% | Húc cực mạnh vào một kẻ địch, 35% làm choáng. | `steel_charge` | 1250 |
| `skill_tg_steel_slash` | Chém Thép | unique | enemy | T3 | 8/0 | — | Chém thép vào một kẻ địch. | `steel_slash` | 1050 |

## LIGHTNING

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_dive` | Bổ Nhào | enemy | enemy | T3 | 10/2 | — | Bổ nhào sấm sét vào một mục tiêu. | `lightning_dive` | 1250 |
| `skill_e_spark_peck` | Mổ Tia Điện | enemy | enemy | T2 | 6/0 | — | Mổ tia điện vào một mục tiêu. | `spark_peck` | 950 |
| `skill_e_thunder_charge` | Lao Sấm | enemy | allEnemies | T2 | 18/3 | stun 15% | Lao vào cả đội trong tiếng sấm, 15% làm choáng. | `thunder_rush` | 1550 |
| `skill_ult_ld` | Hiệu Lệnh Sấm | ultimate | allEnemies | T4 | 0/0 | spdUp→allies | Tuyệt kỹ: sấm lớn đánh mọi kẻ địch, cả đội tăng tốc. | `thunder_command` | 3100 |
| `skill_ld_call_thunder` | Gọi Sấm | unique | allEnemies | T2 | 28/3 | stun 25% | Sấm giáng xuống mọi kẻ địch, 25% làm choáng. | `call_thunder` | 1650 |
| `skill_ld_chain` | Chuỗi Sét | unique | randomEnemies ×3 | T1 | 22/3 | — | Ba tia sét đánh vào kẻ địch ngẫu nhiên. | `chain_lightning` | 1550 |
| `skill_ld_thunder_strike` | Lôi Kích | unique | enemy | T3 | 8/0 | — | Đòn sấm vào một kẻ địch. | `thunder_strike` | 1100 |

## LIGHT

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_glare` | Chói Lòa | enemy | enemy | T2 | 10/2 | accDown 50% | Chớp sáng chói vào một mục tiêu, dễ làm nó Giảm chính xác. | `glare_flash` | 1150 |
| `skill_e_halo_burst` | Vầng Sáng Nổ | enemy | allEnemies | T2 | 20/3 | mdefDown 40% | Vầng sáng bùng ra đánh cả đội, có thể Giảm thủ phép. | `halo_burst` | 1800 |
| `skill_e_prism_lance` | Giáo Lăng Kính | enemy | enemy | T3 | 14/2 | — | Giáo ánh sáng xuyên một mục tiêu. | `prism_lance` | 1150 |
| `skill_e_rune_beam` | Tia Rune | enemy | enemy | T3 | 10/1 | — | Tia rune sáng vào một mục tiêu. | `rune_beam` | 1150 |
| `skill_qt_dawn_spear` | Giáo Rạng Đông | unique | enemy ×3 | T1 | 22/3 | — | Ba mũi giáo ánh sáng liên tiếp vào một kẻ địch. | `dawn_spears` | 1550 |
| `skill_qt_lumina` | Tia Lumina | unique | enemy | T3 | 28/3 | — | Tia sáng mạnh vào một kẻ địch. | `lumina_ray` | 1400 |
| `skill_qt_prism` | Lăng Kính Tán Sắc | unique | allEnemies | T2 | 24/3 | accDown 50% | Tán tia sáng thành bảy màu đánh mọi kẻ địch, dễ làm Giảm chính xác. | `prism_split` | 1550 |
| `skill_qt_ray` | Tia Sáng | unique | enemy | T2 | 8/0 | — | Bắn tia sáng vào một kẻ địch. | `light_ray` | 950 |

## DARK

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_curse` | Lời Nguyền | enemy | allEnemies | T1 | 16/3 | atkDown 50%, matkDown 50% | Nguyền cả đội: có thể Giảm công và Giảm công phép. | `curse_eyes` | 1800 |
| `skill_e_shadow_bite` | Cắn Trong Bóng Tối | enemy | enemy | T3 | 8/1 | accDown 30% | Cắn trong bóng tối, 30% làm Giảm chính xác. | `shadow_bite` | 1100 |
| `skill_e_wraith_touch` | Chạm Hồn Ma | enemy | enemy | T2 | 12/2 | disable 30% 2l | Chạm lạnh của hồn ma, 30% Phong ấn 2 lượt. | `wraith_touch` | 1250 |
| `skill_ult_dm` | Lưới Dệt Đêm | ultimate | allEnemies | T4 | 0/0 | stun, spdDown | Tuyệt kỹ: sát thương Bóng tối mọi kẻ địch, làm choáng và Chậm. | `night_weave` | 3100 |
| `skill_dm_ink` | Phun Mực | unique | enemy | T2 | 8/0 | accDown 70% | Phun mực vào một kẻ địch, dễ làm nó Giảm chính xác. | `ink_spray` | 1500 |
| `skill_dm_night_net` | Lưới Đêm | unique | allEnemies | T1 | 24/3 | spdDown 70%, stun 20% | Lưới đêm phủ mọi kẻ địch: làm Chậm, 20% làm choáng. | `night_net` | 1550 |
| `skill_dm_nightmare` | Ác Mộng | unique | enemy | T2 | 26/3 | disable 75% 2l | Gửi ác mộng vào một kẻ địch, dễ Phong ấn nó 2 lượt. | `nightmare` | 1500 |

## VOID

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_e_null_gaze` | Ánh Nhìn Trống Rỗng | enemy | enemy | T3 | 14/2 | disable 20% 2l | Nhìn xuyên một mục tiêu, 20% Phong ấn 2 lượt. | `null_gaze` | 1150 |
| `skill_e_rift_pulse` | Xung Khe Nứt | enemy | allEnemies | T1 | 18/3 | spdDown 40% | Khe nứt hư không rung lên đánh cả đội, có thể làm Chậm. | `rift_pulse` | 1800 |
| `skill_e_void_touch` | Chạm Hư Vô | enemy | enemy | T2 | 10/1 | dispel 1 | Chạm vào một mục tiêu, xóa một trạng thái tốt của nó. | `void_drain` | 1250 |
| `skill_ult_hk` | Bầu Trời Trong Chuông | ultimate | allEnemies | T4 | 0/0 | dispel | Tuyệt kỹ: sát thương Hư Không mọi kẻ địch và xóa mọi trạng thái tốt của chúng. | `sky_bell` | 3200 |
| `skill_ult_mythical` | Huyền Thoại Thức Tỉnh | ultimate | allEnemies | T4 | 0/0 | heal 20%→allies, atkUp→allies, matkUp→allies | Tuyệt kỹ: sát thương Hư Không mọi kẻ địch, cả đội hồi 20% máu và tăng công. | `mythic_awakening` | 3500 |
| `skill_hk_pure_impact` | Va Chạm Thuần | unique | enemy | T2 | 8/0 | — | Sát thương Hư Không vào một kẻ địch: không khắc, không bị kháng. | `void_fist` | 1050 |
| `skill_hk_star_fall` | Sao Rơi Vô Định | unique | randomEnemies ×4 | T1 | 24/3 | — | Bốn ngôi sao hư không rơi vào kẻ địch ngẫu nhiên. | `void_stars` | 1550 |
| `skill_hk_void_vortex` | Xoáy Hư Không | unique | allEnemies | T1 | 24/3 | — | Xoáy Hư Không đánh mọi kẻ địch. | `void_vortex` | 1550 |

## SELF (hệ của người tung)

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_cl_armor_crush` | Phá Giáp | class | enemy | T2 | 14/2 | defDown 80% | Đánh một kẻ địch, dễ làm nó Giảm thủ. | `armor_crush` $color | 1150 |
| `skill_cl_combo` | Liên Hoàn | class | enemy ×3 | T1 | 16/2 | — | Ba đòn liên tiếp vào một kẻ địch. | `combo_slash` $color | 1550 |
| `skill_cl_elemental_rain` | Mưa Nguyên Tố | class | allEnemies | T2 | 24/2 | — | Mưa phép mang hệ của người tung lên mọi kẻ địch. | `element_rain` $color | 1650 |
| `skill_cl_energy_orb` | Cầu Năng Lượng | class | enemy | T3 | 10/0 | — | Quả cầu mang hệ của người tung vào một kẻ địch. | `energy_orb` $color | 1200 |
| `skill_cl_finisher` | Tuyệt Kỹ | class | enemy | T3 | 30/4 | — | Đòn kết liễu cực mạnh vào một kẻ địch. | `finisher_x` $color | 1700 |
| `skill_cl_meteor` | Thiên Thạch | class | allEnemies | T3 | 36/4 | — | Thiên thạch mang hệ của người tung giáng xuống mọi kẻ địch. | `star_fall` $color | 2030 |
| `skill_cl_pierce` | Xuyên Phép | class | enemy | T2 | 14/2 | mdefDown 80% | Đánh một kẻ địch, dễ làm nó Giảm thủ phép. | `spell_lance` $color | 1100 |
| `skill_cl_power_strike` | Chém Mạnh | class | enemy | T3 | 10/1 | — | Một đòn mạnh vào một kẻ địch. | `power_cleave` $color | 1000 |
| `skill_cl_rend` | Xé Giáp | class | enemy | T2 | 14/2 | defDown 80% | Đánh một kẻ địch và dễ làm nó Giảm thủ. | `rend_tear` $color | 1150 |
| `skill_cl_seal` | Phong Ấn | class | enemy | T1 | 18/3 | disable 70% 2l | Đánh một kẻ địch, dễ Phong ấn nó 2 lượt. | `seal_stamp` $color | 1420 |
| `skill_cl_shadow_dance` | Bóng Ảnh | class | randomEnemies ×4 | T1 | 28/4 | evaUp→self | Bốn đòn vào kẻ địch ngẫu nhiên, rồi tự tăng né. | `shadow_dance` $color | 2330 |
| `skill_cl_spell_storm` | Bão Phép | class | allEnemies | T1 | 30/4 | atkDown 50%, matkDown 50%, spdDown 50% | Bão phép lên mọi kẻ địch: có thể Giảm công, Giảm công phép, Chậm. | `spell_storm` $color | 1750 |
| `skill_cl_stomp` | Dậm Đất | class | allEnemies | T1 | 18/3 | spdDown 70% | Dậm đất làm mọi kẻ địch Chậm. | `stomp_quake` $color | 1600 |
| `skill_cl_tremor` | Chấn Động | class | allEnemies | T2 | 30/4 | stun 30% | Chấn động đánh mọi kẻ địch, 30% làm choáng. | `tremor_heave` $color | 1950 |
| `skill_cl_vital` | Đòn Hiểm | class | enemy | T2 | 16/2 | — | Đánh vào chỗ hiểm: tỉ lệ chí mạng +40%. | `vital_pierce` $color | 1050 |

## Không hệ (hỗ trợ)

| id | Tên | Loại | Đích | Bậc | MP/CD | Hiệu quả | Mô tả (descVi) | 3D hiện tại | Kết thúc (ms) |
|---|---|---|---|---|---|---|---|---|---|
| `skill_cl_aim` | Ngắm Chuẩn | class | self | T0 | 8/3 | accUp 2l, atkUp 2l | Tự tăng chính xác và công 2 lượt. | `aim_focus` #fff0a0 | 1600 |
| `skill_cl_aura` | Hào Quang | class | allAllies | T0 | 28/4 | regen, defUp | Cả đội được Hồi phục và tăng thủ 3 lượt. | `aura_regen` #9af0b0 | 1900 |
| `skill_cl_channel` | Truyền Năng | class | ally | T0 | 0/3 | mp 25 | Truyền 25 MP cho một đồng đội. | `mp_stream` #6fc4ff | 1300 |
| `skill_cl_cheer` | Cổ Vũ | class | ally | T0 | 10/2 | atkUp, matkUp | Một đồng đội tăng công và công phép 3 lượt. | `cheer_burst` #ff9a4a | 1600 |
| `skill_cl_dash` | Lướt Gió | class | self | T0 | 12/3 | evaUp, spdUp | Tự tăng né và tốc độ 3 lượt. | `wind_dash` #5ae0c8 | 1650 |
| `skill_cl_focus` | Tập Trung | class | self | T0 | 0/4 | matkUp, mp 10 | Tự tăng công phép 3 lượt và hồi 10 MP. | `focus_charge` #b06aff | 1650 |
| `skill_cl_fortress` | Pháo Đài Sống | class | self | T0 | 26/4 | taunt 2l, defUp, mdefUp, shield 25% | Khiêu khích, tăng thủ vật lý và thủ phép, tự tạo khiên 25% máu. | `fortress` #ffd66a | 1770 |
| `skill_cl_healing_rain` | Mưa Hồi Phục | class | allAllies | T0 | 22/3 | heal 20% | Hồi 20% máu cả đội. | `healing_rain` #8fd8ff | 1550 |
| `skill_cl_hold_fast` | Thủ Vững | class | self | T0 | 10/3 | defUp, mdefUp, heal 5% | Tự tăng thủ vật lý, thủ phép và hồi 5% máu. | `hold_fast` #9ab8ff | 1620 |
| `skill_cl_mend` | Hồi Phục | class | ally | T0 | 10/1 | heal 30% | Hồi 30% máu một đồng đội. | `mend_cross` #8ff0b0 | 1570 |
| `skill_cl_purify` | Thanh Tẩy | class | allAllies | T0 | 16/3 | cleanse | Xóa mọi trạng thái xấu của cả đội, kể cả Diệt vong. | `purify` #e8f4ff | 1820 |
| `skill_cl_rally` | Khích Lệ | class | allAllies | T0 | 20/3 | atkUp, matkUp | Cả đội tăng công và công phép 3 lượt. | `rally_wave` #ff9a4a | 1800 |
| `skill_cl_second_wind` | Hồi Sức | class | self | T0 | 14/3 | heal 25%, cleanse 1 | Tự hồi 25% máu và xóa một trạng thái xấu. | `second_wind` #8ff0b0 | 1650 |
| `skill_cl_shield_wall` | Tường Khiên | class | allAllies | T0 | 20/3 | shield 15% | Khiên 15% máu (của người tung) cho cả đội. | `shield_wall` #cfe0ff | 1820 |
| `skill_cl_taunt` | Khiêu Khích | class | self | T0 | 8/2 | taunt 2l, shield 8% | Khiêu khích 2 lượt và tự tạo khiên nhỏ. | `taunt_call` #ffa040 | 1570 |
| `skill_cl_undying` | Tinh Thần Bất Khuất | class | ally | T0 | 28/5 | autoRevive | Một đồng đội nhận Bất khuất: khi gục sẽ đứng dậy với 30% máu. | `undying_spark` #fff0a0 | 1620 |
| `skill_e_bark_skin` | Vỏ Cây Cứng | enemy | self | T0 | 10/3 | defUp, shield 15% | Tự tăng thủ và tạo khiên. | `bark_skin` #7ccf5a | 1720 |
| `skill_e_doom_mark` | Dấu Diệt Vong | enemy | enemy | T0 | 24/5 | doom 3l | Đặt dấu Diệt vong: 3 lượt nữa mục tiêu gục, trừ khi được thanh tẩy. | `doom_sigil` #a04ad0 | 1700 |
| `skill_e_dragon_roar` | Tiếng Gầm Rồng | enemy | allAllies | T0 | 16/4 | atkUp, matkUp→self | Cả bọn tăng công, bản thân tăng công phép. | `roar_wave` #ff5a3a | 1800 |
| `skill_e_holy_ward` | Bùa Hộ Thân | enemy | ally | T0 | 14/3 | heal 30%, cleanse | Hồi 30% máu và xóa trạng thái xấu cho một đồng bọn. | `ward_mend` #fff0a0 | 1600 |
| `skill_e_howl` | Tru Lên | enemy | allAllies | T0 | 12/4 | atkUp | Cả bọn tăng công 3 lượt. | `howl_wave` #ff7a3a | 1850 |
| `skill_e_iron_shell` | Vỏ Sắt | enemy | self | T0 | 10/3 | defUp, mdefUp | Tự tăng thủ vật lý và thủ phép. | `iron_shell` #c8d0dc | 1720 |
| `skill_e_soothe` | Nước Mát | enemy | ally | T0 | 12/3 | heal 25% | Hồi 25% máu cho một đồng bọn. | `mend_cross` #8fe8d8 | 1650 |
| `skill_e_stone_guard` | Thủ Đá | enemy | allAllies | T0 | 12/3 | defUp | Cả bọn tăng thủ. | `stone_guard` #c0a070 | 1770 |
| `skill_ult_mm` | Rừng Mẹ Ôm Ấp | ultimate | allAllies | T4 | 0/0 | heal 30%, regen, poison→foes | Tuyệt kỹ: hồi 30% máu và Hồi phục cả đội, mọi kẻ địch Trúng độc. | `mother_forest` | 3400 |
| `skill_ult_nh` | Tiếng Hát Đại Dương | ultimate | allAllies | T4 | 0/0 | heal 40%, cleanse, wet→foes | Tuyệt kỹ: hồi 40% máu cả đội, xóa mọi trạng thái xấu, mọi kẻ địch bị Ướt. | `ocean_song` | 3300 |
| `skill_ult_qs` | Núi Thiêng Trỗi Dậy | ultimate | allAllies | T4 | 0/0 | shield 30%, taunt 2l→self | Tuyệt kỹ: khiên 30% máu cho cả đội, tự khiêu khích 2 lượt. | `holy_mountain` | 3300 |
| `skill_ult_qt` | Lồng Đèn Trung Thu | ultimate | allAllies | T4 | 0/0 | autoRevive, heal 25% | Tuyệt kỹ: cả đội nhận Bất khuất một lần và hồi 25% máu. | `moon_lanterns` | 3200 |
| `skill_dm_ink_veil` | Màn Mực | unique | allAllies | T0 | 14/3 | evaUp | Cả đội tăng né 3 lượt. | `ink_veil` #5ae0c8 | 1770 |
| `skill_hg_forge_fire` | Lửa Rèn | unique | self | T0 | 12/3 | atkUp, matkUp | Tự tăng công và công phép 3 lượt. | `forge_fire` #ff7a3a | 1900 |
| `skill_hk_null_ward` | Kết Giới Trống | unique | allAllies | T0 | 20/4 | shield 20% | Dựng kết giới trống rỗng: khiên 20% máu cho cả đội. | `null_ward` | 1820 |
| `skill_hk_phase_shift` | Lệch Pha | unique | self | T0 | 0/3 | evaUp, mp 15 | Tự tăng né 3 lượt và hồi 15 MP. | `phase_shift` #b48aff | 1700 |
| `skill_hk_void_veil` | Màn Hư Vô | unique | all | T0 | 18/4 | clearAll | Xóa mọi trạng thái của cả hai phe (trừ Diệt vong). | `void_veil` #b48aff | 1620 |
| `skill_ld_swift_bolt` | Tốc Lôi | unique | allAllies | T0 | 14/3 | spdUp | Cả đội tăng tốc 3 lượt. | `swift_bolt` #ffe25a | 1650 |
| `skill_mm_blossom` | Hoa Hồi Sinh | unique | allAllies | T0 | 24/4 | regen | Cả đội được Hồi phục 3 lượt. | `blossom_regen` #ffa0d0 | 1700 |
| `skill_mm_sprout` | Chồi Non | unique | ally | T0 | 12/2 | heal 10%, regen | Hồi 10% máu một đồng đội và cho Hồi phục 3 lượt. | `sprout_mend` #7ccf5a | 1600 |
| `skill_nh_rising_tide` | Triều Dâng | unique | ally | T0 | 14/2 | heal 20%, shield 10% | Triều dâng nâng một đồng đội: hồi 20% máu và khiên 10% máu. | `rising_tide` | 1650 |
| `skill_nh_soothe` | Sóng Vỗ Về | unique | ally | T0 | 12/1 | heal 30% | Hồi 30% máu cho một đồng đội. | `wave_mend` #8fe8d8 | 1650 |
| `skill_nh_tide_song` | Khúc Ca Triều | unique | allAllies | T0 | 22/3 | heal 18%, cleanse 1 | Hồi 18% máu cả đội và xóa một trạng thái xấu của mỗi bạn. | `tide_song` #7fd0ff | 1900 |
| `skill_qs_mountain_shell` | Mai Núi | unique | allAllies | T0 | 18/3 | defUp, mdefUp | Cả đội tăng thủ vật lý và thủ phép. | `mountain_shell` #c0a070 | 1870 |
| `skill_qs_stone_skin` | Da Đá | unique | self | T0 | 12/3 | defUp, shield 20% | Tự tăng thủ và tạo khiên 20% máu. | `stone_skin` #c0a070 | 1750 |
| `skill_qt_first_light` | Ánh Sáng Đầu Tiên | unique | ally | T0 | 16/2 | heal 28%, cleanse | Hồi 28% máu một đồng đội và xóa mọi trạng thái xấu, kể cả Diệt vong. | `dawn_mend` #fff0a0 | 1770 |
| `skill_qt_guiding_lamp` | Đèn Dẫn Lối | unique | allAllies | T0 | 18/3 | accUp, matkUp | Cả đội tăng chính xác và công phép. | `guiding_lamp` #ffe9a0 | 1750 |
| `skill_tg_bronze_wall` | Tường Khiên Đồng | unique | self | T0 | 14/3 | defUp, taunt 2l | Tự tăng thủ và khiêu khích 2 lượt. | `bronze_wall` #d89a50 | 1490 |
| `skill_tg_iron_oath` | Lời Thề Sắt | unique | allAllies | T0 | 20/4 | defUp, shield 12% | Cả đội tăng thủ vật lý và nhận khiên 12% máu. | `iron_oath` | 1820 |
