# Đề xuất skill mới cho các hệ còn ít

**Ngày:** 2026-11-12. **Trạng thái: đề xuất, chưa áp dụng.** Gameplay đang đóng băng (decision 021); thêm skill là đổi nội dung chiến đấu, nên cần chủ dự án duyệt và một decision riêng (số 060, mở băng hẹp cho đúng nội dung này).
Dữ liệu sẵn sàng: `docs/animation/new_skills.draft.json` (22 skill, đã kiểm bằng schema thật: `npx tsx scripts/animation/checkNewSkills.ts`). Chuẩn mô tả và hợp đồng nhìn thấy: `SKILL_DESCRIPTION_STANDARD.md`.

## 1. Vì sao
Đếm skill theo hệ (kể cả skill quái; chi tiết `docs/handover/VFX3D_SKILL_INVENTORY.md`):

| Hệ | Hiện có | Skill quái | Nhận xét |
|---|---|---|---|
| FIRE | 10 | 5 | đủ |
| NATURE | 7 | 5 | đủ |
| LIGHTNING | 7 | 3 | đủ |
| DARK | 7 | 3 | đủ |
| WATER | 6 | 2 | quái chỉ có 2 |
| METAL | 6 | 2 | quái chỉ có 2 |
| EARTH | 5 | 3 | chỉ 2 đòn tấn công của dòng |
| VOID | 4 | **0** | không có skill quái nào; dòng chỉ có 2 đòn tấn công + tuyệt kỹ |
| LIGHT | **3** | **1** | ít nhất: 2 đòn tấn công của dòng, 1 skill quái |

Mỗi dòng (lineage) cố định 4 Unique + 1 Ultimate (`unique: z.array(skillId).length(4)`, test `adventure.test.ts`), nên **không thêm Unique vào dòng được** nếu không đổi schema. Hai đường không đổi schema:
- **Skill quái** (`type: "enemy"`): không đụng người chơi, chỉ đổi độ khó/đa dạng khi gặp quái. 12 skill.
- **Skill riêng của loài** (`species.<id>.unique[slot]`): schema đã cho phép một loài thay Unique của dòng ở từng ô (null = của dòng). 10 skill, mỗi hệ yếu 2 skill, mỗi loài thay đúng một ô.

## 2. Skill quái (12) — không ảnh hưởng người chơi
Số liệu nằm trong khoảng của skill quái hiện có (đòn đơn: power 1,0–1,7, MP 8–14, hồi chiêu 1–2; diện rộng: 0,6–1,1, MP 16–24, hồi chiêu 3).

| id | Tên | Hệ | Đích | Số | Hiệu quả | Mô tả (`descVi`) | Gợi ý quái dùng |
|---|---|---|---|---|---|---|---|
| `skill_e_glare` | Chói Lòa | LIGHT | một | 1,0 · MP 10 · CD 2 | Giảm chính xác 50 % | Chớp sáng chói vào một mục tiêu, dễ làm nó Giảm chính xác. | `enemy_rune_wisp` |
| `skill_e_halo_burst` | Vầng Sáng Nổ | LIGHT | cả đội | 0,9 · MP 20 · CD 3 | Giảm thủ phép 40 % | Vầng sáng bùng ra đánh cả đội, có thể Giảm thủ phép. | `enemy_drift_jelly` |
| `skill_e_prism_lance` | Giáo Lăng Kính | LIGHT | một | 1,7 · MP 14 · CD 2 | — | Giáo ánh sáng xuyên một mục tiêu. | quái LIGHT tương lai / trùm |
| `skill_e_void_touch` | Chạm Hư Vô | VOID | một | 1,2 · MP 10 · CD 1 | xóa 1 trạng thái tốt | Chạm vào một mục tiêu, xóa một trạng thái tốt của nó. | chưa có quái VOID |
| `skill_e_rift_pulse` | Xung Khe Nứt | VOID | cả đội | 0,8 · MP 18 · CD 3 | Chậm 40 % | Khe nứt hư không rung lên đánh cả đội, có thể làm Chậm. | chưa có quái VOID |
| `skill_e_null_gaze` | Ánh Nhìn Trống Rỗng | VOID | một | 1,5 · MP 14 · CD 2 | Phong ấn 2 lượt 20 % | Nhìn xuyên một mục tiêu, 20% Phong ấn 2 lượt. | chưa có quái VOID |
| `skill_e_tide_slap` | Quật Sóng | WATER | một | 1,3 · MP 8 · CD 1 | Ướt 50 % | Quật sóng vào một mục tiêu, có thể làm nó Ướt. | `enemy_reef_crab` |
| `skill_e_whirlpool` | Xoáy Nước | WATER | cả đội | 0,9 · MP 20 · CD 3 | Chậm 40 % | Xoáy nước cuốn cả đội, có thể làm Chậm. | `enemy_coral_eel` |
| `skill_e_shield_bash` | Húc Khiên | METAL | một | 1,5 · MP 10 · CD 2 | Choáng 20 % | Đập khiên vào một mục tiêu, 20% làm choáng. | `enemy_shell_knight` |
| `skill_e_spike_volley` | Mưa Chông | METAL | cả đội | 1,0 · MP 18 · CD 3 | Giảm thủ 30 % | Chông thép rơi xuống cả đội, có thể Giảm thủ. | `enemy_ancient_guardian` |
| `skill_e_boulder_toss` | Ném Tảng | EARTH | một | 1,7 · MP 12 · CD 2 | — | Ném tảng đá nặng vào một mục tiêu. | `enemy_ore_golem` |
| `skill_e_sand_veil` | Màn Cát | EARTH | cả đội | 0,6 · MP 16 · CD 3 | Giảm chính xác 50 % | Cát bay mù cả đội, dễ làm Giảm chính xác. | `enemy_stone_sentinel` |

Lưu ý VOID: hệ này chưa có quái nào (không có `enemy_*` hệ VOID). Ba skill VOID chỉ có tác dụng khi có quái VOID (cần art quái mới, ngoài phạm vi). Có thể làm animation trước và chạy bằng Battle Lab; gắn vào quái khi chủ dự án quyết định.

## 3. Skill riêng của loài (10) — người chơi thấy
Số liệu theo mẫu Unique hiện có: đòn diện rộng power 0,8–1,1, MP 22–28, CD 3; đòn nhiều nhịp theo `Chuỗi Sét` (0,7 × 3, MP 22); đòn nặng 1,8–2,3; hỗ trợ MP 14–20, CD 2–4.

| id | Tên | Hệ / loại | Đích | Số | Hiệu quả | Mô tả (`descVi`) | Loài gợi ý (ô) |
|---|---|---|---|---|---|---|---|
| `skill_qt_prism` | Lăng Kính Tán Sắc | LIGHT diện rộng | cả đội địch | 0,9 · MP 24 · CD 3 | Giảm chính xác 50 % | Tán tia sáng thành bảy màu đánh mọi kẻ địch, dễ làm Giảm chính xác. | `PIG_VALKYRIE` (ô 3, Lv 20) |
| `skill_qt_dawn_spear` | Giáo Rạng Đông | LIGHT nhiều nhịp | một | 0,8 × 3 · MP 22 · CD 3 | — | Ba mũi giáo ánh sáng liên tiếp vào một kẻ địch. | `PIG_UNICORN` (ô 2, Lv 10) |
| `skill_hk_star_fall` | Sao Rơi Vô Định | VOID nhiều nhịp | ngẫu nhiên | 0,6 × 4 · MP 24 · CD 3 | — | Bốn ngôi sao hư không rơi vào kẻ địch ngẫu nhiên. | `PIG_GALAXY` (ô 3) |
| `skill_hk_null_ward` | Kết Giới Trống | VOID hỗ trợ | cả đội | khiên 20 % · MP 20 · CD 4 | khiên | Dựng kết giới trống rỗng: khiên 20% máu cho cả đội. | `PIG_MYTHICAL` (ô 2) |
| `skill_nh_whirlpool` | Xoáy Nước Cổ | WATER diện rộng | cả đội địch | 0,9 · MP 24 · CD 3 | Ướt, Chậm 50 % | Xoáy nước cuốn mọi kẻ địch, làm Ướt và có thể làm Chậm. | `PIG_PIRATE` (ô 3) |
| `skill_nh_rising_tide` | Triều Dâng | WATER hỗ trợ | một đồng đội | hồi 20 % + khiên 10 % · MP 14 · CD 2 | hồi + khiên | Triều dâng nâng một đồng đội: hồi 20% máu và khiên 10% máu. | `PIG_POSEIDON` (ô 2) |
| `skill_tg_spike_barrage` | Mưa Chông Thép | METAL nhiều nhịp | ngẫu nhiên | 0,6 × 4 · MP 24 · CD 3 | — | Bốn mũi chông thép phóng vào kẻ địch ngẫu nhiên. | `PIG_SAMURAI` (ô 3) |
| `skill_tg_iron_oath` | Lời Thề Sắt | METAL hỗ trợ | cả đội | thủ + khiên 12 % · MP 20 · CD 4 | defUp + khiên | Cả đội tăng thủ vật lý và nhận khiên 12% máu. | `PIG_KNIGHT` (ô 2) |
| `skill_qs_boulder_roll` | Lăn Tảng | EARTH đòn nặng | một | 1,8 · MP 18 · CD 2 | Choáng 35 % | Lăn tảng đá nghiền một kẻ địch, 35% làm choáng. | `PIG_TURTLE` (ô 3) |
| `skill_qs_dust_cloud` | Mây Bụi | EARTH diện rộng | cả đội địch | 0,6 · MP 20 · CD 3 | Giảm chính xác 60 % | Mây bụi mù mịt phủ mọi kẻ địch, dễ làm Giảm chính xác. | `PIG_CRYSTAL` (ô 2) |

"Ô" là chỉ số trong `unique` của loài (0–3), mở ở level `[1, 1, 10, 20]` (`balance.levels.uniqueUnlockLevels`). Mỗi loài thay một ô nên **mất skill của dòng ở ô đó**: đây là chỗ chủ dự án phải đồng ý.
Cân bằng: trong khoảng của Unique cùng loại, MP hợp lý; chưa chạy bot kinh tế / cân bằng (`scripts/economy/`). Sau khi duyệt phải chạy trước khi đóng băng lại.

## 4. Hợp đồng nhìn thấy (bản nháp, "PHẢI THẤY") cho 22 skill
Khuôn đầy đủ ở `SKILL_DESCRIPTION_STANDARD.md` §6. Dưới đây chỉ phần **phải thấy**; người làm animation viết nốt nhịp, KIỂM, và đặt vào `scenarios/skills/<id>.md`.

**LIGHT** — Chói Lòa: (1) quầng sáng gom ở người tung; (2) một chớp trắng ấm **bùng ở mắt mục tiêu**; (3) mục tiêu nheo / lùi (cử động, không phải trạng thái). Vầng Sáng Nổ: (1) vòng hào quang nở ra từ giữa đội địch; (2) lan qua từng con, mỗi con một nhịp; (3) tia nhỏ tỏa ra theo vòng. Giáo Lăng Kính: một giáo ánh sáng **dài và có tán sắc** bay thẳng, xuyên mục tiêu, vệt lăng kính để lại. Lăng Kính Tán Sắc: (1) một tia trắng chạm tấm lăng kính trên trời; (2) tách **bảy tia màu** quét xuống mỗi kẻ địch; (3) chói nhẹ. Giáo Rạng Đông: **đúng 3** mũi giáo, mũi cuối to hơn, mỗi mũi một nhịp.
**VOID** — Chạm Hư Vô: tay / khe nứt chạm mục tiêu, **một thứ sáng bị hút ra** (trạng thái tốt) và biến mất. Xung Khe Nứt: một khe nứt đen mở giữa đội địch, rung (vòng gợn), kéo nhẹ cả hàng về tâm. Ánh Nhìn Trống Rỗng: hai vòng tròn đối nhau như con mắt, tia nhìn tím xuyên mục tiêu, tách màu. Sao Rơi Vô Định: **đúng 4** ngôi sao rơi lên các mục tiêu khác nhau. Kết Giới Trống: một vòm trong suốt có sao bên trong khép quanh mỗi đồng đội.
**WATER** — Quật Sóng: một con sóng nhỏ quất ngang tới mục tiêu, bọt. Xoáy Nước: một xoáy nước dựng đứng giữa đội, cuốn các con theo vòng. Xoáy Nước Cổ: xoáy to hơn, lớp nước cao, bọt trắng, mỗi kẻ địch bị cuốn một vòng. Triều Dâng: một mảng nước nâng đồng đội lên rồi hạ xuống, vòm khiên mỏng.
**METAL** — Húc Khiên: người tung **giơ khiên** lao vào, vang kim loại. Mưa Chông: chông thép rơi từ trên xuống cả đội, cắm xuống đất. Mưa Chông Thép: **đúng 4** chông phóng vào các mục tiêu khác nhau. Lời Thề Sắt: các tấm giáp bay tới ghép thành khiên trên mỗi đồng đội, cột tăng thủ.
**EARTH** — Ném Tảng: một tảng đá **lớn hơn người** ném vòng cung, vỡ khi trúng. Màn Cát: gió cuốn cát thành màn che cả đội địch. Lăn Tảng: tảng đá cao bằng người lăn từ xa nghiền qua mục tiêu, để vệt lún. Mây Bụi: một mây bụi dày cuộn lên phủ cả hàng, che tầm nhìn.

## 5. Quy trình áp dụng sau khi chủ dự án duyệt
1. Chủ dự án chọn: nhóm A (12 skill quái), nhóm B (10 skill loài), hoặc cả hai; chọn loài mang skill và ô (mục 3); chọn quái dùng skill quái (mục 2).
2. Viết `docs/decisions/060-new-skills.md` (mở băng hẹp, liệt kê id; ghi vào decision 021) — **trước khi sửa `content/`**.
3. Thêm hàng vào `content/adventure/skills.json`; nối vào `lineages.json` (`species.<id>.unique`) và `enemies.json` (`skills`). Chạy `npm run content:ids`, `npm run content:fmt`.
4. Viết kịch bản trong `battle_fx.json` (một act `vfx3d` hoặc nhiều lớp 3D) cho từng skill mới, đủ hợp đồng nhìn thấy.
5. Cập nhật test: số skill trong `battleFxContent` (mọi skill phải có kịch bản), `adventure.test.ts`; chạy `npm run check`; chạy bot cân bằng; ghi `PROGRESS.md`; đóng băng lại.
