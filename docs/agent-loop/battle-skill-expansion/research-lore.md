# Research lore — battle-skill-expansion (chỉ tra cứu, không thiết kế)
Viết tắt: LORE=docs/lore/Lore_Sobi_World.md; L2G=docs/lore/LORE_TO_GAMEPLAY.md; SPEC=docs/update_spec_sobi_adventure_gameplay_v1.md; LIN=content/adventure/lineages.json; ZON/MAP/ENM = content/adventure/zones|maps|enemies.json

## 1. Thế giới + 9 hệ
- Nguồn: Lumina (tia sáng đầu) -> Sobi Essence "dòng máu thế giới" (LORE:4-44). Umbra (ý thức bóng tối, "Possession") rơi xuống tạo The Hollow, biến Essence thành Umbraflux ghi đè ý chí (LORE:78-135). First Guardians = thú cộng hưởng Lumina, điều khiển Element (LORE:196-218). "9 Elements đầu tiên được ghi nhận" trong First War (LORE:255). Great Fracture (LORE:257-297). Guardian hy sinh phong ấn Umbra (LORE:299-331). Phong ấn đang yếu (LORE:401-421).
- LORE KHÔNG có đoạn lore riêng từng hệ; chỉ có "9 Elements = các dạng biểu hiện của Sobi Essence" (LORE:538). Lore từng hệ nằm ở LIN (9 Guardian) + SPEC 6.2 (SPEC:197-210) + elements.json:
- FIRE: Hỏa Giải, Cua Lò Rèn (LIN hoa_giai); lò rèn/dung nham; Núi (Rồng Dung Nham); bia "Lửa của Hỏa Giải chưa từng tắt" (MAP map_mountain_foot lore_m1_carving).
- WATER: Nam Hải, Cá Ông Nam Hải (cá voi hát giữ thủy triều); Bờ Biển Muối, Đầm Sương; Tide Essence (L2G:83-88); chuông đồng khắc heo con ở Vịnh Đắm Tàu (lore_c3).
- EARTH: Quy Sơn, Rùa Mang Núi "chặn lối The Hollow"; Núi Đá Vọng; tảng đá/cổng đá chắn đường (gate EARTH).
- METAL: Thiết Giáp, Heo Rừng Giáp Đồng, "bức tường khiên First War"; tượng Thiết Giáp canh phong ấn = Hộ Pháp Cổ Đại (SPEC:390, lore_r3_seal).
- LIGHTNING: Lôi Dương, Heo Sừng Gọi Sấm, "Guardian thức tỉnh đầu tiên"; Cừu Sừng Sấm ở Đèo Gió; đinh đồng dấu xoáy vàng (lore_m2_seal).
- NATURE: Mộc Mẫu, Heo Mẹ Rừng Hoa "gieo lại rừng"; Cổ Thụ = rễ Mộc Mẫu (SPEC:390); hình heo mẹ phủ hoa khắc đá (lore_f2_pond).
- LIGHT: Quang Trư, Heo Mang Đèn, cõng mảnh Tia Sáng Đầu Tiên (= Lumina); đèn cổ heo cõng (lore_r1_lamp); Lồng Đèn Trung Thu.
- DARK: Dạ Mặc, Bạch Tuộc Dệt Đêm (dệt lưới đêm cho muôn loài ngủ yên). elements.json: "Đêm và giấc ngủ (không phải Umbra)"; lore_r2_threads "Chỉ của Dạ Mặc đang yếu đi". Dark KHÔNG đồng nghĩa Umbra.
- VOID: Hư Không, Sứa Vô Định mang bầu trời sao; "sát thương thuần, xóa trạng thái". Lore mỏng nhất (mục 6).

## 2. Vùng / boss / điểm mở khóa (ZON, MAP, ENM)
| zone | tên | hệ chủ đạo | boss vùng (map) | nhánh | cổng/di tích |
|---|---|---|---|---|---|
| zone_forest Lv1-10 | Rừng Thì Thầm | NATURE | enemy_old_treant Cổ Thụ Giận Dữ NATURE (map_forest_heart, boss_forest) | hollow, falls, marsh | gate FIRE/NATURE/EARTH/DARK; npc_f2_shrine |
| zone_mountain Lv7-16 | Núi Đá Vọng | FIRE/EARTH/METAL | enemy_magma_drake Rồng Dung Nham FIRE (map_mountain_peak) | pass, tunnels | gate METAL/LIGHTNING/WATER/EARTH; npc_m1_miner |
| zone_ruins Lv12-22 | Tàn Tích Cổ (phong ấn đang yếu, rơi Rune Cổ) | LIGHT/DARK/METAL | enemy_ancient_guardian Hộ Pháp Cổ Đại METAL (map_ruins_sanctum Điện Phong Ấn) | crypt | gate LIGHT/LIGHTNING/DARK/METAL; npc_r1_altar, npc_r2_vault |
| zone_coast Lv14-24 | Bờ Biển Muối (vào từ Đầm Sương) | WATER | enemy_abyss_kraken Bạch Tuộc Vực Thẳm WATER (map_coast_cove, boss_coast) | không | gate EARTH (san hô); event_shrine beach+cove; puzzle_c2_clam |
- requiresCleared: mountain<-forest; ruins<-mountain; coast<-mountain. Lối "guardian" chặn tới khi hạ kẻ canh (decision 043 §7).
- Tiểu boss nhánh (kind subboss): hollow=Sói Đầu Đàn DARK; falls=Cổ Thụ NATURE; marsh=Hồn Ma Thủy Triều DARK; pass=Cừu Sừng Sấm LIGHTNING; tunnels=Người Đá Quặng EARTH; crypt=Thầy Tế Bóng Tối DARK; reef=Cua Rạn WATER.
- 9 map nhánh (decision 043): Thung Nấm, Thác Rêu, Đầm Sương, Đèo Gió, Đường Hầm Cổ, Hầm Mộ Rune, Bãi Vỏ Sò, Rạn San Hô, Vịnh Đắm Tàu. Lối tắt shortcut (exit_n2_south, n4_east, n5_north) = bí mật mở một phía. Mỗi map có lore_* (bia lore -> Codex, SPEC:130) và puzzle (brazier, wheel, rod, gear, plate, clam).
- Cổng nguyên tố theo hệ: FIRE (f1,n1), NATURE (f2), EARTH (f2,m3,n2,n5,c1,c2), METAL (m1,r3,n5), LIGHTNING (m2,r2,n4), WATER (m2,n3), LIGHT (r1,n6), DARK (f3,r2). KHÔNG có cổng VOID.

## 3. Tha hóa + cốt truyện (điểm mở khóa tối thượng)
- Mỗi map có corruption 10-85 (forest 10/18/30, mountain 30/40/50, ruins 60/70/85, coast 40/50/60; nhánh 15-80). Chuỗi enemy: Wild Pig -> Umbra -> Corrupted -> Abyssal -> Umbra Guardian (LORE:429-445). Lộ trình tiết lộ: Corrupted Animals -> Umbraflux -> The Hollow -> Ancient Guardians -> Great Fracture -> Umbra còn sống (LORE:459-485). Trùm = "sinh vật bị Umbraflux biến đổi sâu" (LORE:546).
- Hạ trùm lần đầu -> cảnh thanh tẩy + bia lore Guardian trong Codex + bật cổng dịch chuyển khu 3 (SPEC:390). Affix "Nhiễm Umbraflux" (thẻ umbraflux, Thanh Tẩy) (decision 039).
- Điểm hợp mở khóa: (a) hạ trùm vùng lần đầu (Cổ Thụ, Rồng, Hộ Pháp, Kraken) = thanh tẩy 1 Guardian; (b) 100% khám phá vùng (SPEC:133); (c) Vết Nứt Umbraflux tầng 10/20/30 trùm Ác Mộng (039); (d) Đài Phong Ấn / Sobi Essence = endgame GĐ13, CHƯA CÓ (L2G:205-230, SPEC:483); (e) đánh thức Guardian: Bond 5 tim + Sobi Essence (L2G:107-113).
- Ánh xạ sẵn: Rừng=Mộc Mẫu, Núi=Hỏa Giải, Tàn Tích=Thiết Giáp (+ cổng LIGHT/DARK), Biển=Nam Hải (WATER).

## 4. Nhiệm vụ / mục tiêu / engagement
- Decision 039 (engagement.json): 14 title (battles, bestHit, ultimates, boss theo zone, rift, nightmare); Vết Nứt Umbraflux (mở sau hạ zone_ruins; 7 luật ngày); 8 synergies; quips theo dòng; 6 tips; thắng nhanh; 6 affix. Decision 055: Rift seed theo ngày + bảng điểm local 20 hàng rift.board. Decision 053: 4 goal tuần / 10 mẫu / 5 Area (content/shared/goals.json weekly); daily cùng cơ chế counter.
- Không có hệ quest cốt truyện riêng trong Adventure. Điều kiện có sẵn để mở: bossClears theo zone, nightmares[] (enemy id), rift.best, feats.ultimates, % khám phá, activePortals, openedExits.

## 5. Tên đã dùng / luật IP
- Lineage/Ult: Nam Hải, Quy Sơn, Dạ Mặc, Quang Trư, Lôi Dương, Thiết Giáp, Hỏa Giải, Mộc Mẫu, Hư Không; Ult: Tiếng Hát Đại Dương, Núi Thiêng Trỗi Dậy, Lưới Dệt Đêm, Lồng Đèn Trung Thu, Hiệu Lệnh Sấm, Đoàn Kỵ Thép, Lò Rèn Nguyên Thủy, Rừng Mẹ Ôm Ấp, Bầu Trời Trong Chuông; thêm Phượng Hoàng Tái Sinh, Đinh Ba Hải Vương, Huyền Thoại Thức Tỉnh.
- 134 skill (skills.json) theo hệ: FIRE10 WATER9 EARTH9 METAL9 LIGHT8 VOID8 DARK7 LIGHTNING7 NATURE7 (+SELF 15, không hệ 45). Tên đã có: Phun Dung Nham, Hơi Thở Dung Nham, Mưa Thiên Thạch, Xoáy Nước, Hơi Thở Băng, Địa Chấn Cổ/Phong Ấn, Lăn Tảng, Mây Bụi, Chuỗi Sét, Gọi Sấm, Bão Gai, Tia Lumina, Lăng Kính Tán Sắc, Giáo Rạng Đông, Chạm Hư Vô, Xung Khe Nứt, Sao Rơi Vô Định, Lời Nguyền, Ác Mộng, Dấu Diệt Vong, Phong Ấn, Tuyệt Kỹ, Bão Phép.
- Tên boss/quái/địa danh đã dùng: Cổ Thụ Giận Dữ, Rồng Dung Nham, Hộ Pháp Cổ Đại, Bạch Tuộc Vực Thẳm, Sói Đầu Đàn, Hồn Rune, Hồn Ma Thủy Triều, Thầy Tế Bóng Tối, Người Đá Quặng, Cừu Sừng Sấm, Tượng Lửa, Lính Gác Đá, Hiệp Sĩ Vỏ Ốc; The Hollow, Great Fracture, Umbraflux, Vết Nứt, Đài/Điện Phong Ấn, Bàn Cộng Hưởng, Sobi/Life/Tide/Sky/Bond Essence; title Người Giữ Phong Ấn, Ánh Sáng Cuối Cùng, Bất Khuất Trong Hư Vô.
- Luật IP (decision 048; AGENT_RULES §9 dòng 61-68): cấm tên/hình/thoại/đặc trưng nhận diện của game, phim, anime, truyện, hãng đồ chơi, thương hiệu; thiết kế gốc từ động vật thật + thần thoại dân gian chung chung; nghi ngờ thì bỏ (không đổi nhẹ để né), ghi PROGRESS.md; áp dụng cả prompt art. IP_AUDIT_PROMPT chỉ là quy trình 2 pha, KHÔNG có danh sách cấm cụ thể; IP_AUDIT_REPORT mục G đã xử Thor, Superman, Battlebot, Loki. Tránh tên chiêu quen thuộc của game khác (nhận định của người tìm, không phải danh sách repo).
- Thêm skill = đổi gameplay: cần decision mới (mẫu 060) + chuẩn animation (AGENT_RULES §10, SKILL_ANIMATION_STANDARD.md).

## 6. Khoảng trống
- VOID: không có vùng, boss, cổng, quái, bia lore; chỉ Dòng Hư Không (Sứa Vô Định), title "Bất Khuất Trong Hư Vô", 3 skill quái VOID chưa gắn quái (decision 060). The Hollow / Vết Nứt là chỗ hợp lý nhất.
- LIGHTNING: chỉ tiểu boss Cừu Sừng Sấm + cổng; không boss vùng, bia lore mỏng.
- EARTH, LIGHT, DARK: không boss vùng nào mang hệ đó (EARTH tiểu boss Người Đá; DARK Sói/Hồn Ma/Thầy Tế; LIGHT chỉ quái thường Hồn Rune, Sứa Trôi). Quy Sơn, Quang Trư chưa có đền Guardian.
- WATER: có vùng/boss (Biển) nhưng bia lore chỉ hải đăng, chuông; nhân vật Nam Hải chưa xuất hiện.
- Chưa có: Đài Phong Ấn, The Hollow chơi được, vùng thứ 5, quest cốt truyện, Sobi Essence tiêu trong Adventure (SPEC:483).