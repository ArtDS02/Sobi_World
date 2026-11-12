# Rà skill: mô tả so với hiệu ứng (decision 058)

Mỗi nhóm một bảng. Chủ dự án duyệt cột "Đề xuất" trước khi sửa `content/adventure/battle_fx.json`.
Nguồn: `content/adventure/skills.json` (mô tả `descVi`, hiệu quả) và `battle_fx.json` (kịch bản). Chỉ đọc dữ liệu, chưa chạy
trận; mục "cần xác minh" phải chụp bằng `npm run anim:capture` trước khi sửa.

## Nhóm 1 — hệ Nước (6 skill)

**Trạng thái 2026-11-11:** cả 6 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm): `trident_sea`, `bubble_shot`,
`bubble_spray`, `tsunami_sweep`, `ice_bloom`, `frost_breath`. Ảnh: `docs/animation/vfx3d/water_group_3d.jpg` (hàng: Bong Bóng Nước,
Phun Bọt, Sóng Thần Cổ, Đinh Ba, Đóng Băng, Hơi Thở Băng; mỗi hàng 4 mốc thời gian). Hai skill băng không còn vẽ bọc băng: phần đó
chỉ do trạng thái Đóng băng vẽ khi thật sự trúng (đề xuất ở bảng dưới đã làm). Đinh Ba có thêm lớp sóng; cue choáng 30 % chưa làm.

| Skill | Mô tả | Kịch bản hiện có | Khớp? | Đề xuất |
|---|---|---|---|---|
| `skill_nh_bubble` Bong Bóng Nước | Bắn bong bóng vào một địch, làm Ướt | Bong bóng phồng, bay vòng cung, lơ lửng, vỡ thành nước, vũng | Khớp | Giữ |
| `skill_nh_tsunami` Sóng Thần Cổ | Sóng lớn đánh mọi địch, có thể làm Chậm | Tụ nước, sóng dâng, hất tung, chấn động, vũng, dải nước | Khớp | Giữ |
| `skill_ult_trident` Đinh Ba Hải Vương | Đinh ba "triệu sóng" đánh mọi địch, Ướt, 30 % choáng | Cut-in, đinh ba rơi, 6 đợt giọt nước, bắn nước theo từng địch, 3 vòng, dải nước | Thiếu một phần | Thêm lớp sóng dâng thật (dùng `fx_wave_rise` + `fxp_wave_crest` như Sóng Thần) nối vào các vòng; thêm cue cho choáng 30 % qua trạng thái |
| `skill_cl_freeze` Đóng Băng | Phép Nước, 60 % Đóng băng 1 lượt | Hạt tuyết, bông tuyết bay, bọc băng, vòng | Lệch | Cần xác minh: bọc băng chạy cả khi không trúng 60 %. Dời hình bọc băng cho trạng thái `freeze` (`statuses.freeze.apply` đã có `fx_ice_encase`), skill chỉ giữ phần tụ lạnh + tuyết |
| `skill_e_bubble` Phun Bọt | Phun bọt nước, Ướt | Ba bong bóng liên tiếp, vỡ, vệt nước, vũng | Khớp | Giữ |
| `skill_e_frost_breath` Hơi Thở Băng | Hơi lạnh, 25 % Đóng băng | Luồng hơi hình nón, tuyết, bọc băng | Lệch | Như `skill_cl_freeze`: bọc băng chỉ khi trạng thái thật sự được gán (25 %); phần hơi lạnh giữ |

### Phát hiện chung
1. Bọc băng nằm trong cả kịch bản skill lẫn `statuses.freeze.apply`. Nếu cả hai chạy, hiệu ứng bị đôi và hiện cả khi đòn không gây Đóng băng. Cần chụp để xác nhận.
2. Hiệu ứng skill chỉ nên mô tả phần chắc chắn xảy ra; phần theo xác suất (Đóng băng, Chậm, Choáng) thuộc về trạng thái.
3. Ultimate Nước thiếu "sóng" dù mô tả nói vậy; các ultimate khác nên rà cùng kiểu.

## Nhóm 2 — hệ Lửa (10 skill)

**Trạng thái 2026-11-11:** cả 10 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/fire_group_3d.jpg`
(hàng: Búa Hỏa Ngục, Lò Rèn Nguyên Thủy, Phượng Hoàng Tái Sinh, Hơi Thở Dung Nham, Mưa Thiên Thạch, Lửa Tượng Thần, Cắn Than Hồng; Càng Nung,
Phun Dung Nham người chơi và quái chụp lúc dựng, không có trong ảnh). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_hg_hot_claw` Càng Nung | Kẹp càng nóng, 40 % Bỏng | `claw_clamp`: hai gọng đỏ rực khép lại, vòng nhiệt | Đọc được; nhỏ hơn mong muốn |
| `skill_hg_lava` Phun Dung Nham | Dung nham phủ mọi địch | `lava_flood`: vũng dung nham loang dưới hàng, 3 cột phun | Khớp "phủ" tốt hơn bản cũ (chỉ nổ lẻ từng con) |
| `skill_hg_inferno_hammer` Búa Hỏa Ngục | Búa lửa giáng mạnh | `hammer_slam`: búa rơi, hố dung nham, cột lửa, sóng | Đã chỉnh: sắt có khối, mặt đập phát sáng |
| `skill_ult_hg` Lò Rèn Nguyên Thủy | Lửa lò rèn đánh mọi địch, Bỏng, đội tăng công | `forge_ult`: đe rơi, búa đập 3 nhát, vòng lửa, cột phun, tia lửa bên ta | Khớp (3 nhát, tăng công); đe và búa đã có khối |
| `skill_ult_phoenix` Phượng Hoàng Tái Sinh | Lửa phượng hoàng đánh mọi địch, Bỏng, đội Bất khuất | `phoenix_rebirth`: chim lửa lượn, lao qua hàng, bóng phượng lớn, lông vũ rơi, tia lửa hồi sinh bên ta | Đã dựng lại: chim xòe cánh vỗ, đuôi rủ; còn thô |
| `skill_e_ember_bite` Cắn Than Hồng | Cắn lửa, 30 % Bỏng | `jaw_flame`: hai hàm nanh lửa khép | Đã chỉnh: hàm nanh rõ, thanh hàm còn phẳng |
| `skill_e_lava_spit` Phun Dung Nham (quái) | Phun dung nham, 40 % Bỏng | `lava_glob`: cục dung nham bay vòng cung, vũng loang | Đọc được |
| `skill_e_magma_breath` Hơi Thở Dung Nham | Phun dung nham cả đội | `magma_cone`: luồng lửa từ quái qua cả đội, vũng dung nham | Tốt |
| `skill_e_meteor` Mưa Thiên Thạch | Thiên thạch lửa rơi cả đội | `meteor_rain`: 5 thiên thạch rơi 2 đợt, hố dung nham | Tốt |
| `skill_e_idol_flame` Lửa Tượng Thần | Lửa tượng thần phủ cả đội | `flame_pillars`: vòng lửa trên đầu rồi cột lửa mỗi con | Khá |

Hiệu ứng Bỏng thật (40 / 50 / 30 %) vẫn do trạng thái `burn` vẽ khi trúng; hiệu ứng skill không vẽ bỏng.

**Chỉnh lần 2 (2026-11-11), ảnh `docs/animation/vfx3d/fire_fixes_3d.jpg`:** Phượng Hoàng dựng lại thành chim quay mặt về sân, hai cánh xòe (mỗi cánh một quạt 7 lông lửa) vỗ, mào, ba dải đuôi rủ xuống, hóa thân bóng lớn; Lò Rèn và Búa Hỏa Ngục dùng sắt tối có ánh sáng (có khối) với mặt đập phát sáng theo nhiệt, thay cho khối cam phẳng; Cắn Than Hồng: hai hàm nanh trắng nóng khép lại kèm chớp sáng. Còn: thanh hàm là phiến đỏ phẳng, chim chưa có lông đuôi thật.

## Nhóm 3 — hệ Thiên nhiên (7 skill)

**Trạng thái 2026-11-11:** cả 7 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/nature_group_3d.jpg`
(hàng: Gai Độc, Rễ Trói, Quất Dây Leo, Bào Tử Độc, Rễ Rung Chuyển, Hoa Nhiễm Độc, Bão Gai; mỗi hàng 8 mốc từ 500 đến 2200 ms). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_mm_poison_thorn` Gai Độc | Bắn gai, dễ Trúng độc | `thorn_volley`: 7 gai bay theo vòng cung, cắm vào, mây độc tím, giọt độc | Đọc được; gai nhỏ |
| `skill_mm_binding_roots` Rễ Trói | Rễ quấn mọi địch: giảm né, có thể Chậm | `root_bind`: rễ xoắn mọc quanh từng ô, lá rơi | Khớp "quấn mọi kẻ địch" |
| `skill_e_vine_lash` Quất Dây Leo | Quất dây leo | `vine_whip`: dây leo xanh bắn ra, chớp, rút lại, lá | Tốt |
| `skill_e_poison_spore` Bào Tử Độc | Phun bào tử, dễ Trúng độc | `spore_cone`: luồng bào tử tím, mây độc ở mục tiêu | Tốt |
| `skill_e_root_quake` Rễ Rung Chuyển | Rễ rung chuyển dưới cả đội | `root_quake`: gai đá và rễ trồi dưới từng ô, bụi | Khớp |
| `skill_e_corrupt_bloom` Hoa Nhiễm Độc | Hoa nhiễm phun độc lên cả đội | `corrupt_bloom`: hoa tím mọc trên quái, độc bắn vòng cung, sương độc, mưa phấn | Đọc được; hoa còn đơn giản |
| `skill_e_thorn_storm` Bão Gai | Bão gai quất cả đội | `thorn_storm`: gai xoáy quanh quái rồi phóng qua hàng, chớp từng ô | Đọc được; gai tối màu |

Trúng độc / Chậm / Giảm né thật vẫn do trạng thái vẽ khi trúng.

## Nhóm 4 — hệ Đất (5 skill)

**Trạng thái 2026-11-11:** cả 5 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/earth_group_3d.jpg`
(hàng: Đập Đá, Địa Chấn Cổ, Húc Nanh, Nện Đá, Địa Chấn Phong Ấn). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_qs_rock_smash` Đập Đá | Đập đá vào một địch, 30 % choáng | `boulder_smash`: tảng đá trồi lên, ném vòng cung, vỡ thành mảnh và bụi | Khớp |
| `skill_qs_quake` Địa Chấn Cổ | Đất rung dưới mọi địch | `quake_spikes`: sóng nứt, 6 mũi đá trồi dưới mỗi ô, bụi, mảnh vụn | Khớp |
| `skill_e_tusk_charge` Húc Nanh | Húc nanh mạnh | `tusk_charge`: vệt bụi dọc đường lao, chớp ngà, vòng chấn, mảnh vụn | Đọc được; chủ yếu là bụi |
| `skill_e_rock_slam` Nện Đá | Nện đá | `rock_fist`: nắm đấm đá khổng lồ rơi, hố, mảnh, bụi | Đọc được; nắm đấm giống cột đá |
| `skill_e_seal_quake` Địa Chấn Phong Ấn | Đất nứt quanh phong ấn, đánh cả đội | `seal_quake`: vòng phong ấn vàng xoay, 3 cột sáng, đất nứt, mũi đá | Tốt, khớp "phong ấn" |

Choáng (30 / 25 / 25 / 20 %) vẫn do trạng thái vẽ khi trúng.

## Nhóm 5 — hệ Kim (6 skill)

**Trạng thái 2026-11-11:** cả 6 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/metal_group_3d.jpg`
(hàng: Chém Thép, Phá Giáp, Húc Thép, Vuốt Thép, Nghiền Đồng, Chém Thép và Vuốt Thép sau khi chỉnh cung chém, Đoàn Kỵ Thép). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_tg_steel_slash` Chém Thép | Chém thép vào một địch | `steel_slash`: cung chém sáng quét qua, tia lửa, chớp | Đọc được sau khi chỉnh cung (lần đầu quá mảnh) |
| `skill_tg_armor_break` Phá Giáp | Đánh một địch, dễ Giảm thủ | `armor_break`: tia sáng khóa mục tiêu, 8 mảnh giáp vỡ văng, vòng chấn | Khớp "phá giáp" |
| `skill_tg_steel_charge` Húc Thép | Húc cực mạnh, 35 % choáng | `steel_charge`: bánh thép sáng lăn, vệt mờ, tia lửa, va chạm | Đọc được |
| `skill_ult_tg` Đoàn Kỵ Thép | Đánh mọi địch, Giảm thủ, tự tạo khiên 25 % | `steel_cavalry`: 3 kỵ sĩ đồng hiện bóng rồi lao qua hàng, cung chém, tia lửa; vòm đồng khép quanh người dùng | Khớp (đoàn kỵ, khiên); kỵ sĩ còn là bóng nâu phẳng |
| `skill_e_metal_claw` Vuốt Thép | Vuốt thép, 30 % Giảm thủ | `metal_claw`: ba vệt vuốt liên tiếp, tia lửa | Đọc được, nhỏ |
| `skill_e_bronze_crush` Nghiền Đồng | Nghiền bằng nắm đấm đồng | `bronze_fist`: nắm đấm đồng rơi, vòng vàng, tia lửa | Đọc được; nắm đấm là khối nâu |

Giảm thủ / choáng thật vẫn do trạng thái vẽ khi trúng.

## Nhóm 6 — hệ Sét (7 skill)

**Trạng thái 2026-11-11:** cả 7 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/lightning_group_3d.jpg`
(5 hàng đầu: Lôi Kích, Chuỗi Sét, Gọi Sấm, Mổ Tia Điện, Bổ Nhào, lần chụp đầu; 4 hàng sau chụp lại sau khi chỉnh tia sét: Lôi Kích, Gọi Sấm, Hiệu Lệnh Sấm, Lao Sấm). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_ld_thunder_strike` Lôi Kích | Đòn sấm vào một địch | `thunder_strike`: dấu sét xoay, tia sét từ trời, tia lửa, vòng | Tốt sau khi tia có góc cạnh và mảnh hơn |
| `skill_ld_chain` Chuỗi Sét | Ba tia sét đánh địch ngẫu nhiên | `chain_lightning`: tia từ người dùng nhảy qua 3 địch | Khớp "chuỗi" |
| `skill_ld_call_thunder` Gọi Sấm | Sấm giáng mọi địch, 25 % choáng | `call_thunder`: mây giông tụ trên hàng, 3 tia + tia lớn | Khớp; mây tụ thành dải tối |
| `skill_ult_ld` Hiệu Lệnh Sấm | Sấm lớn đánh mọi địch, đội tăng tốc | `thunder_command`: dấu sét khổng lồ trên trời, 2 đợt tia, tia lớn, điện quanh đội | Tốt, rõ nhất nhóm |
| `skill_e_spark_peck` Mổ Tia Điện | Mổ tia điện | `spark_peck`: hai tia ngắn và tia lửa | Đọc được, nhỏ |
| `skill_e_dive` Bổ Nhào | Bổ nhào sấm sét | `lightning_dive`: vệt sáng từ trời, tia lớn, mảnh vụn | Khá |
| `skill_e_thunder_charge` Lao Sấm | Lao vào cả đội, 15 % choáng | `thunder_rush`: đường điện qua hàng, cung chém từng ô | Tốt |

Choáng và tăng tốc thật vẫn do trạng thái vẽ khi trúng.

## Nhóm 7 — hệ Ánh sáng (3 skill)

**Trạng thái 2026-11-11:** cả 3 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/light_group_3d.jpg`
(hàng: Tia Sáng, Tia Lumina, Tia Rune). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_qt_ray` Tia Sáng | Bắn tia sáng vào một địch | `light_ray`: hạt sáng tụ, tia vàng bắn ra, sao nổ, vòng | Khớp, hơi mảnh |
| `skill_qt_lumina` Tia Lumina | Tia sáng mạnh vào một địch | `lumina_ray`: quầng và tia xòe sau người dùng, giáo ánh sáng bay, cột sáng giáng xuống | Tốt, mạnh hơn Tia Sáng đúng như mô tả |
| `skill_e_rune_beam` Tia Rune | Tia rune sáng vào một mục tiêu | `rune_beam`: vòng rune tím trên đầu, tia tím, rune bay tỏa | Khớp; vòng rune trên đầu khá mờ |

Ánh sáng chỉ có 3 skill sát thương; các skill hồi máu, hỗ trợ của hệ thuộc nhóm class / SELF.

## Nhóm 8 — hệ Bóng tối (7 skill)

**Trạng thái 2026-11-11:** cả 7 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/dark_group_3d.jpg`
(hàng: Phun Mực, Lưới Đêm, Ác Mộng, Cắn Trong Bóng Tối, Chạm Hồn Ma, Lưới Dệt Đêm, Lời Nguyền). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_dm_ink` Phun Mực | Phun mực vào một địch | `ink_spray`: cục mực bay kèm giọt, bắn tung tóe, khói, vũng | Tốt |
| `skill_dm_night_net` Lưới Đêm | Lưới đêm phủ mọi địch | `night_net`: sao tụ, lưới tím rơi từ trên, ghim sao dưới đất | Khớp; lưới ở cao nên mờ |
| `skill_dm_nightmare` Ác Mộng | Ác mộng, dễ Phong ấn | `nightmare`: mặt nạ tím nở sau mục tiêu, khóa rune đóng lại | Tốt, rõ nhất |
| `skill_ult_dm` Lưới Dệt Đêm | Sát thương mọi địch, choáng và Chậm | `night_weave`: vòng dệt trên đất, xúc tu bóng tối trồi, lưới lớn khép, sao | Khớp; xúc tu còn đơn giản |
| `skill_e_shadow_bite` Cắn Trong Bóng Tối | Cắn trong bóng tối | `shadow_bite`: quái tan vào khói, hàm bóng tối cắn, chớp tím | Đọc được |
| `skill_e_wraith_touch` Chạm Hồn Ma | Chạm lạnh của hồn ma | `wraith_touch`: bàn tay nhợt trồi lên, sương xanh, chạm | Yếu: bàn tay khó nhận ra, giống cột xanh |
| `skill_e_curse` Lời Nguyền | Nguyền cả đội | `curse_eyes`: mắt nguyền mở trên đầu mỗi địch, vòng rune dưới chân, khói | Đọc được |

Giảm chính xác / Phong ấn / Chậm / choáng thật vẫn do trạng thái vẽ khi trúng.

## Nhóm 9 — hệ Hư không (4 skill)

**Trạng thái 2026-11-11:** cả 4 skill đã có hiệu ứng 3D (decision 059, thử nghiệm, chờ chủ dự án chấm). Ảnh: `docs/animation/vfx3d/void_group_3d.jpg`
(hàng: Va Chạm Thuần, Xoáy Hư Không, Bầu Trời Trong Chuông, Huyền Thoại Thức Tỉnh). Đối chiếu mô tả:

| Skill | Mô tả | Hiệu ứng 3D | Nhận xét |
|---|---|---|---|
| `skill_hk_pure_impact` Va Chạm Thuần | Sát thương Hư Không vào một địch | `void_fist`: khe nứt mở ở người dùng, nắm đấm hư không bay ra, hai vòng chấn, tách màu | Khớp |
| `skill_hk_void_vortex` Xoáy Hư Không | Xoáy đánh mọi địch | `void_vortex`: lõi đen có quầng, hạt xoáy hút vào rồi nổ, đĩa gợn | Tốt, rõ nhất nhóm |
| `skill_ult_hk` Bầu Trời Trong Chuông | Sát thương mọi địch, xóa trạng thái tốt | `sky_bell`: chuông tím khổng lồ rơi, rung 3 hồi, mỗi hồi một vòng, nốt nhạc, vỡ thành mảnh | Khớp "chuông" và "ba hồi"; chuông nằm sát mép phải |
| `skill_ult_mythical` Huyền Thoại Thức Tỉnh | Sát thương mọi địch, cả đội hồi 20 % và tăng công | `mythic_awakening`: vòng thần linh sau người dùng, 4 tia 4 màu bắn qua hàng, sao rơi và vòng hồi máu bên ta | Khớp; 4 tia cộng lại ra trắng |

Xóa trạng thái, hồi máu, tăng công thật vẫn do hệ thống trạng thái / sự kiện vẽ khi xảy ra.

## Nhóm 10 — skill hệ trống, class, hỗ trợ (57 skill)

**Trạng thái 2026-11-11:** cả 57 skill còn lại (hệ trống, class và `SELF`) đã có hiệu ứng 3D; **cả 112 skill của game giờ đều có** (decision 059, thử nghiệm, chờ chủ dự án chấm).
Ảnh: `docs/animation/vfx3d/classless_group_3d.jpg` (nửa trên: hồi máu, tăng chỉ số, khiên, thanh tẩy, truyền MP, dấu diệt vong; nửa dưới: đòn class, liên hoàn, quả cầu, dậm đất, mưa phép, thiên thạch, tuyệt kỹ hỗ trợ).
Vì không có hệ riêng, các hiệu ứng này **tham số hóa theo màu** (`color` của act, hoặc `$color` = màu hệ của người tung) và tự trải ra ba chỗ khi act ở trên cả một phe (`env.row`):

| Hiệu ứng | Dùng cho | Hình |
|---|---|---|
| `heal_bloom` | Sóng Vỗ Về, Khúc Ca Triều, Chồi Non, Hoa Hồi Sinh, Hồi Sức, Hồi Phục, Mưa Hồi Phục, Nước Mát, Bùa Hộ Thân, Ánh Sáng Đầu Tiên, Hào Quang | dấu cộng bay lên, vòng hồi, ánh sáng |
| `buff_up` | Lửa Rèn, Màn Mực, Đèn Dẫn Lối, Tốc Lôi, Lệch Pha, Ngắm Chuẩn, Lướt Gió, Tập Trung, Cổ Vũ, Khích Lệ, Tru Lên, Tiếng Gầm Rồng | mũi tên chevron leo thành cột, màu theo chỉ số (công cam, tốc độ vàng, né ngọc, phép tím…) |
| `shield_dome` | Da Đá, Mai Núi, Tường Khiên Đồng, Khiêu Khích, Thủ Vững, Tường Khiên, Pháo Đài Sống, Vỏ Cây Cứng, Vỏ Sắt, Thủ Đá, Tinh Thần Bất Khuất | vòm tổ ong khép quanh người |
| `cleanse` | Thanh Tẩy, Màn Hư Vô | hạt trắng bay lên, vòng sạch |
| `mp_channel` | Truyền Năng | quả cầu xanh chảy từ người tung sang đồng đội |
| `doom_mark` | Dấu Diệt Vong | ấn tối, vòng khóa co lại, sương |
| `class_strike` | Chém Mạnh, Phá Giáp, Xé Giáp, Đòn Hiểm, Xuyên Phép, Phong Ấn, Tuyệt Kỹ (cỡ 1,5) | hai cung chém chéo màu hệ, vòng chấn |
| `class_combo` | Liên Hoàn, Bóng Ảnh | bốn nhát chém, nhát cuối lớn; Bóng Ảnh nhảy qua các địch |
| `class_orb` | Cầu Năng Lượng | quả cầu màu hệ bay và nổ |
| `ground_stomp` | Dậm Đất, Chấn Động | sóng chấn từ chân người tung lan qua hàng địch |
| `class_rain` | Mưa Nguyên Tố, Bão Phép | mưa tia màu hệ, nổ từng điểm |
| `class_meteor` | Thiên Thạch | ba thiên thạch màu hệ |
| `ult_party` | Tiếng Hát Đại Dương, Núi Thiêng Trỗi Dậy, Lồng Đèn Trung Thu, Rừng Mẹ Ôm Ấp | ấn lớn dưới phe ta, cột sáng trên từng đồng đội, xoáy và mưa sao |

Nhận xét: hồi máu, tăng chỉ số, khiên đọc rõ; các tuyệt kỹ hỗ trợ cùng một hình khác nhau chỉ ở màu (đề xuất: sau này làm riêng nếu cần). Đòn class dùng màu hệ nên nhìn gần giống nhau giữa các skill cùng loại.

## Hàng đợi
Đã hết skill chưa có hiệu ứng 3D. Còn lại: chỉnh các điểm yếu đã ghi ở từng nhóm; bốn hiệu ứng của quái cũng cần xem lại trong trận thật; Kim, Sét, Ánh sáng, Bóng tối, Hư không, skill hệ trống (`null`: 14 unique, 4 ultimate, 16 class, 8 enemy), skill class `SELF`.
