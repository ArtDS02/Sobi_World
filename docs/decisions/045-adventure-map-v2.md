# 045 — Adventure: bản đồ v2 — camera bám, khu ẩn, tha hóa, phân loại quái, bộ asset dựng map mới

Ngày: 2026-10-30 · Trạng thái: **chủ dự án đã duyệt hướng** (2026-10-30). Code: camera bám + zoom ×2 xong (2026-10-31, `scene/mapCamera.ts`); phân loại quái + tha hóa + quái ngủ xong (2026-10-31, `logic/foes.ts`); lớp che + khu ẩn + tường giả xong (2026-10-31, save v6); bố cục lại M1–M9 + map nhánh N1–N6 (bước 4a), vùng Biển (4b), tha hóa map + thanh tẩy (5), câu đố, sương mù (save v7) xong (2026-10-31, các mục dưới). **Toàn bộ phần code của decision 045 đã xong.** Art: batch `adventure-15-coast-foes` và bộ ghép vẽ lại (`adventure-14b-map-v2-redo`, cả CE vẽ lại và I1) đã vào game (2026-11-01, hai mục cuối); phần kit chưa có chỗ dùng ghi ở `docs/ASSET_TODO.md`.
Đầu vào: `docs/WORLD_MAP_V2_PROPOSAL.md` (đề xuất + câu trả lời Q2–Q9, A1–A5), decision 043.

## Bối cảnh

Sau Đợt 1 của decision 043, chủ dự án chơi thử và thấy: góc nhìn quá rộng (thấy gần cả map), map nhạt và xấu, không có khu ẩn, quái ít và nhỏ, quái chưa phân loại, map chưa thể hiện cốt truyện tha hóa, lối đi đơn điệu. Tham khảo cách dàn dựng của Epic Battle Fantasy 3 (chỉ học cách làm, không chép nội dung).

## Đã chốt

**Từ audit (decision 043):** N1–N3 thuộc Rừng, N4–N5 Núi, N6 Tàn Tích. Vùng Biển N7–N9 (`zone_coast`) mở sau trùm Núi, đội cấp 14–24. Map nhánh có cổng khu riêng. Quái N01–N12 dùng cho map nhánh, mở batch quái biển.

**Mới:**
1. **Camera** bám nhân vật, **zoom ×2** (thấy khoảng 20 × 11 ô). Kích thước map tùy map, 40 × 24 → 80 × 48. Luật "không đặt lối ra ở mép trên / dưới" của 043 bỏ.
2. **Sương mù khám phá:** bản đồ toàn khu chỉ hiện phần đã đi qua.
3. **Map vẽ bằng bộ ghép** (thay hướng 3 / Q5): ô nền liền mép + mép chuyển tiếp + đạo cụ theo cụm + vật mốc + **lớp che** (tán cây, mái, vòm hang). Tranh một tấm `adventure-11-map/after/` không dùng trong game nữa; `M1-hint.png` là ảnh phong cách chuẩn cho map. Cả 9 map cũ (kể cả M1–M3) bố cục lại.
4. **Khu ẩn**, 3 kiểu: lối dưới lớp che (mờ đi khi bước vào), tường giả cần nguyên tố, rương thấy nhưng phải đi đường khác.
5. **Lối đi:** mỗi map 2–4 lối ra ở nhiều vị trí; trong map ≥ 2 đường tới lối tiến.
6. **Quái trên map:** map chính 10–14 nhóm, map nhánh 14–20. Hình to hơn (thường 2 ô … trùm chính 4 ô, trước zoom). Quái **đứng canh hoặc ngủ, không di chuyển**.
7. **Sáu loại quái:** thường, tinh anh, biến dị, trùm phụ, trùm chính, đặc biệt (ghép nhiều sinh vật / nguyên tố; rương giả là một dạng).
8. **Cấp tha hóa 1–5:** cấp cao hơn thì **mạnh hơn** và trông nguy hiểm hơn (mắt tím → mảng tối → gai tinh thể → nửa thân bị bóng tối nuốt). LIGHT gây thêm sát thương lên quái tha hóa cao. Dấu tha hóa phần lớn vẽ bằng code phủ lên ảnh gốc.
9. **Quái xuất hiện lại:** quái đặc biệt, trùm phụ, trùm chính **không** xuất hiện lại sau khi bị hạ. Các loại khác giữ cách hiện tại.
10. **Map tha hóa theo hành trình:** Rừng 10 → 30 %, Núi 30 → 50 %, Biển 40 → 60 %, Tàn Tích 60 → 85 %, Vết Nứt 100 %.
11. **Thanh tẩy:** hạ trùm vùng thì vùng đó sáng lại một bậc.
12. **Rương 5 loại:** gỗ, bạc (có quái canh), vàng (sau trùm phụ), ẩn, rương giả (quái).
13. **Quái đặc biệt có điều kiện** (chỉ khi mưa hoặc ban đêm), **câu đố nguyên tố nhiều bước**, **suối hồi phục trước trùm phụ**.

## Lựa chọn kỹ thuật cho art

- Ô thế giới vẫn 40 px; zoom ×2 nên ảnh nguồn vẽ cho **80 px mỗi ô**.
- **Ô nền** (Gemini) là ô vuông liền mép, mỗi loại 2–3 biến thể. **Mép chuyển tiếp** (cỏ ↔ đường, bờ nước) vẽ bằng code: mặt nạ bo tròn + viền nâu ấm + bóng trong, rồi rắc đồ trang trí dọc mép. Lý do: Gemini không vẽ khớp được bộ autotile 47 ô.
- **Vách / bậc cao** vẽ kiểu 3/4: mặt trên dùng ô nền, **mặt vách** là dải ảnh lặp ngang (Gemini) + hai góc.
- **Tha hóa map** bằng code trước (tint theo `corruption`, hạt bụi tím), cộng bộ đồ trang trí tha hóa (Gemini).
- **Quy trình art (chủ dự án chốt 2026-10-30, thay cho 5 cảnh mẫu):**
  1. Thiết kế bố cục mới từng map bằng lưới ô (`scripts/art/map_layouts_v2/`, kết quả ở `docs/maps/v2/`), có kiểm tra đường đi.
  2. Dựng ảnh before giống `adventure-11-map/before` (ô tạm + sprite game, 1 ô = 40 px).
  3. Chủ dự án vẽ lại cả map theo `M1-hint.png` (batch `adventure-14-map-v2`).
  4. Agent cắt ô nền, cây, đá, vách, lớp che… từ tranh đã duyệt làm ảnh chuẩn, sinh các sheet bộ ghép; ghép map trong game bằng các asset đó.
  - Thử 5 cảnh mẫu (khối màu, rồi ảnh cắt ghép) cho kết quả xấu hoặc chật, bỏ.
- Bố cục đủ 18 map (Rừng, Núi, Tàn Tích, Biển).

## Hệ quả

- Save Adventure sẽ cần thêm `foundSecrets`, các quái không xuất hiện lại, ô đã khám phá (slice v6, migration cộng thêm). Chi tiết khi làm code.
- Cân bằng: nhiều nhóm hơn thì thưởng mỗi nhóm thường giảm; chạy lại `sim:week`.
- Thứ tự code đề xuất: camera + zoom + kích thước map → phân loại / tha hóa / mật độ quái → lớp che + khu ẩn → bố cục lại 9 map và thêm N1–N9 (Đợt 2–5 của 043) → tha hóa map + thanh tẩy.

## Bước code 2 — phân loại quái, tha hóa, quái ngủ (2026-10-31)

Số ở `content/adventure/balance.json` → `foes`; logic `src/areas/adventure/logic/foes.ts`. Trường nhóm (`maps.json`): `kind` (6 loại, tên theo bố cục `docs/maps/v2/`: `normal`, `elite`, `mutant`, `subboss`, `boss`, `special`), `corruption` 1–5 (không ghi = cấp gốc của loại), `sleep`, `when` (`rain` / `night`, chỉ quái kỳ dị), `element2` (hệ mọc thêm của biến dị / kỳ dị; không ghi = bảng `secondElement`).

| Loại | Cỡ (ô) | Tha hóa gốc | Chỉ số | Thưởng × | Rơi đồ × | Hạ vĩnh viễn | Chạy trốn |
|---|---|---|---|---|---|---|---|
| thường | 2,0 | 1 | gốc | 1 | 1 | không | được |
| tinh anh (kẻ canh khu) | 2,6 | 2 | gốc | 1 | 1 | có | không |
| biến dị | 2,4 | 3 | HP ×1,3, công ×1,15, + hệ thứ hai | 1,6 | 1,5 | không | được |
| trùm phụ | 3,2 | 3 | HP ×2,6, công ×1,3, thủ ×1,2 | 3 | 2 | có | không |
| trùm vùng | 4,0 | 4 | gốc | 1 | 1 | có | không |
| kỳ dị | 3,0 | 4 | HP ×2,2, công ×1,25, thủ ×1,15, tốc ×1,1, + hệ thứ hai | 3 | 2,5 | có | không |

Cấp tha hóa 1–5: chỉ số (HP, công, thủ) ×1 / 1,05 / 1,1 / 1,16 / 1,22; thưởng ×1 / 1,1 / 1,2 / 1,35 / 1,5; kháng mọi hệ trừ Ánh sáng +0 / 0 / 0 / 10 / 15 %; kỹ năng tối: cấp 3 Cắn Trong Bóng Tối, cấp 4 Lời Nguyền. **Chỉ số, thưởng, kháng và kỹ năng tính so với cấp gốc của loại**: nhóm ở đúng cấp gốc đánh như quái được thiết kế, nên trùm và kẻ canh hiện có không đổi độ khó. Riêng điểm yếu Ánh sáng tính đủ (+0 / 0 / 10 / 15 / 20 % sát thương nhận), và từ cấp 3 quái mang thẻ `umbraflux` (phản ứng Thanh Tẩy).

**Tự quyết:**
- **Kẻ canh = tinh anh** (mỗi khu tối đa một tinh anh hoặc một trùm; `contentProblems` kiểm tra). Tinh anh **không** mang biến thể (affix) bắt buộc như đề xuất 3.4, để giữ độ khó các cửa tiến. Có thể thêm sau.
- **Xuất hiện lại** (A3): biến dị như quái thường (về lại khi đổi khu); tinh anh giữ cách cũ (hạ vĩnh viễn); trùm phụ, trùm, kỳ dị hạ vĩnh viễn. Dùng lại `slice.beaten` nên **không đổi save**; report `kind` chỉ mở rộng enum.
- **Quái ngủ:** chạm khi đứng cách 50 % khoảng chạm thường (đi nhẹ qua được); vào trận cả nhóm bị Choáng 1 lượt (đội ra đòn trước).
- **Quái kỳ dị** chỉ đứng trên map khi trời mưa (`rainy`) hoặc ban đêm theo giờ game; điều kiện khác (sau thanh tẩy) để bước 5.
- **Mức tha hóa 9 map hiện có:** Rừng theo cấp gốc; Núi: quái thường ở Mỏ và Đỉnh cấp 2, kẻ canh Mỏ cấp 3; Tàn Tích: quái thường cấp 2, kẻ canh cấp 3, trùm cấp 5. Mỗi map một nhóm ngủ (theo bố cục v2).
- **Mật độ 10–14 nhóm** và các loại mới trên map đi cùng bước bố cục lại (bố cục v2 đã đặt sẵn 233 nhóm có `cls`, `sleep`, `when`).
- Hình tha hóa tạm bằng code: tint tím theo cấp, quầng tối từ cấp 3, chữ Zzz; trong trận: vạch ◆ cạnh tên. Art lớp phủ ghi ở `docs/ASSET_TODO.md`.

Cân bằng (`npm run sim:adventure`, 80 chuyến, so với trước): Rừng dễ hơn chút (nhóm ngủ), Núi gần như cũ, Tàn Tích gần như cũ (starter L24 71 → 65 %, nature L24 49 → 54 %). Bài guard `phase11` (Núi cấp 6 < 20 %) đạt sau khi nâng quái thường ở Mỏ lên cấp 2.

## Bước code 3 — lớp che, khu ẩn, tường giả (2026-10-31)

- **Lớp che** (`maps.json` → `covers[]`: `id`, `x`, `y`, `w`, `h`, `look` = `canopy` / `rock` / `roof`): vẽ trên đầu đội (`scene/mapCovers.ts`), che những gì bên dưới; ô dưới lớp che đi được theo địa hình. Đội đứng dưới lớp che thì lớp che mờ còn 25 %. Lần đầu đứng dưới một lớp che = **tìm thấy khu ẩn**: lưu vĩnh viễn ở `slice.foundSecrets`, sự kiện `ADVENTURE_SECRET_FOUND` (toast + âm), tính vào % khám phá. Scene báo lưu vị trí ngay khi bước vào lớp che chưa tìm, nên không phải chờ lần lưu định kỳ.
- **Tường giả** = cổng hệ có `look: 'crack'`: trông như ô tường của vùng, có vết nứt; mở bằng hệ như cổng thường (đã tính trong % khám phá qua `openedGates`), khi mở phát thêm `ADVENTURE_SECRET_FOUND` loại `wall`.
- **Rương thấy nhưng phải đi đường khác**: chỉ là cách đặt vật trên bố cục, không cần code.
- Kiểm tra map: lớp che nằm trong khu, có ô đi tới được bên dưới, không che điểm xuất phát, cổng dịch chuyển, lối ra, nhóm quái.
- **Save v6**: thêm `foundSecrets: []` (migration v5 → v6). Đã thử trên save sandbox thật (v5 → v6) và chuỗi migration từ fixture v2.
- Nội dung tạm cho 9 map hiện có: mỗi map một lớp che phủ lên một rương (tán cây / mái đá / mái đổ theo vùng); `gate_f2_rock`, `gate_m3_boulder` thành tường giả. Bố cục v2 có sẵn vùng che + rương ẩn của từng map, thay khi bố cục lại.
- Hình lớp che tạm bằng code (các khối tròn chồng nhau theo màu vùng), chờ art bộ ghép.

## Bước code 4a — bố cục lại M1–M9, thêm map nhánh N1–N6 (2026-10-31)

- **Nhập bố cục:** `scripts/art/map_layouts_v2/export.py` xuất `docs/maps/v2/layouts.json`, `import_maps.py` ghi `maps.json`, `zones.json` (`branches`, bảng rương theo loại), `props.json` (vật mốc), `content/i18n/en.json`. Chạy lại: `python scripts/art/map_layouts_v2/export.py`, `python scripts/art/map_layouts_v2/import_maps.py`, `npm run content:fmt`.
- **15 khu:** 9 khu chính (64 × 36, khu trùm 48 × 27, 9–12 nhóm) và 6 khu nhánh (64 × 36 → 80 × 45, 16–19 nhóm, có trùm phụ, biến dị, kỳ dị, rương giả). Rừng: N1 Thung Nấm, N2 Thác Rêu, N3 Đầm Sương; Núi: N4 Đèo Gió, N5 Đường Hầm Cổ; Tàn Tích: N6 Hầm Mộ Rune.
- **Địa hình mới** trong game: `^` đất cao, `s` bậc đá, `c` đất tha hóa (đi được); `F` vách cao nguyên, `w` thác (chặn). Tạm vẽ bằng ô cơ bản + tint.
- **Giữ tiến độ save:** id cũ của nhóm (pool, quà, bảng trùm), rương, cổng, lối ra giữ nguyên khi vật còn. Bia lore cũ gán sang bia của bố cục mới (giữ id + chữ). Đền Guardian của M3 / M6 / M9 đặt ở chỗ đền của bố cục. Sự kiện lữ khách giữ theo khu.
- **Vật mới:** nhóm thường pool `[E] ×3, [E, E] ×1`; tinh anh / trùm phụ có quà; rương theo loại: gỗ `chest_wood_<vùng>` (nhẹ), bạc / ẩn `treasure_<vùng>`, vàng `chest_gold_<vùng>` (3 lượt, 60 % ngọc); rương giả = nhóm kỳ dị `disguise: 'chest'` (hình rương đóng, không nhãn; quái của vùng thay tạm cho ảnh riêng). Tha hóa nhóm theo % tha hóa của khu: quái thường cấp 2 từ 30 %, cấp 3 từ 90 %; tinh anh +1; trùm phụ cấp 4 từ 50 %; kỳ dị và trùm cấp 5 từ 75 %.
- **Thưởng:** quái thường ×0,45 (số nhóm thường mỗi vùng ~11 → ~29).
- **Để sau:** vùng Biển N7–N9 (bước 4b: `zone_coast`, quái và trùm biển); câu đố nguyên tố (`puzzle`, decision 045 mục 13); tinh thể tha hóa trang trí (bước 5). Lối N4 → Cổng Tàn Tích và N5 → Hành Lang Rune bị bỏ vì map đích chưa có lối về (cần sửa bố cục). Vật mốc của N5 và M8 bị bỏ vì chắn đường / đứng trên vách.
- **Cân bằng** (`phase11`, đội tank + dps + support, 40 chuyến): Rừng cấp 8 95 %, Núi cấp 16 100 %, Tàn Tích cấp 22 (epic) 72,5 %. Cấp thấp vẫn thua (Rừng cấp 1 0 %, Núi cấp 6 0 %, Tàn Tích cấp 8 0 %).

## Bước 5 — tha hóa map, thanh tẩy (2026-10-31)

- `maps.json` → `corruption` (0–100 %, lấy từ bố cục): Rừng 10–35, Núi 30–50, Biển 40–60, Tàn Tích 60–85.
- Hình tạm bằng code (`scene/mapCorruption.ts`): lớp màn tím phủ mặt đất (đậm hơn trên ô `c`), bụi tím bay lên; cả hai mạnh theo % tha hóa.
- **Thanh tẩy:** hạ trùm vùng lần đầu thì cả vùng giảm 20 % tha hóa và quái thường giảm 1 cấp tha hóa (không dưới 1), thưởng giảm theo. Toast "Cả vùng sáng lại". Khu được dựng lại khi % thay đổi. Số ở `balance.json` → `foes.purify`.

## Câu đố nguyên tố, sương mù khám phá (2026-10-31, save v7)

- **Câu đố** (`maps.json` → `puzzles[]`: `id`, `element`, `gate`): đứng cạnh, bấm Space với một bạn đúng hệ để thắp (lưu vĩnh viễn `slice.litPuzzles`). Cổng có câu đố không mở bằng hệ được (`GATE_NEEDS_PUZZLE`); thắp đủ bộ thì cổng tự mở. 9 cơ quan trên N1, N3, N4, N5, N6, N8 (lò lửa, bánh xe nước, cột thu lôi, bánh răng, phiến rune, vỏ trai). Hình tạm: điện thờ mờ / sáng.
- **Sương mù** (`logic/fog.ts`): ô 4 × 4, thấy trong bán kính 7 ô quanh đường đi (đoạn thẳng giữa hai lần lưu); lưu vĩnh viễn theo khu ở `slice.explored` (chuỗi hex). Bản đồ nhỏ (phím M) chỉ hiện phần đã thấy, quanh đội hiện ngay.
- **Save v7:** `litPuzzles: []`, `explored: {}` (migration v6 → v7).

## Bước 4b — vùng Biển (2026-10-31)

- `zone_coast` "Bờ Biển Muối": mở sau trùm Núi, Sobi World cấp 12, đội cấp 14–24, vào từ Đầm Sương (N3). Ba khu N7 Bãi Vỏ Sò, N8 Rạn San Hô, N9 Vịnh Đắm Tàu (trùm). Vết Nứt: `zoneScale` 1,1.
- **Quái biển (7):** Cua Rạn, Mòng Biển Muối, Lươn San Hô, Sứa Trôi, Hồn Nước Mặn, tinh anh Hiệp Sĩ Vỏ Ốc (Kim + Thủy), trùm Bạch Tuộc Vực Thẳm (đổi sang Bóng tối ở nửa máu). Bố cục `coast.py` đã đổi sang quái biển. Ảnh: tạm mượn ảnh quái cũ (ghi ASSET_TODO).
- Cân bằng (đội tank + dps + support, 40 chuyến): cấp 18 (rare) 65 %, cấp 22 (epic) 100 %, nhẹ hơn Tàn Tích một chút (Tàn Tích cấp 20 rare 30 %, cấp 22 epic 72,5 %): hai vùng sau Núi, Biển là vùng nhẹ hơn.
- Bảng loot `treasure_coast`, `boss_coast` (tạm bằng bảng Tàn Tích), `chest_wood_coast`, `chest_gold_coast`. Ảnh nền thẻ vùng tạm dùng `bg_adventure_forest`.
- Lối Cổng Tàn Tích ↔ Đèo Gió và Hành Lang Rune ↔ Đường Hầm Cổ đã có đường về (sửa `ruins.py`).

## Art vào game — batch 15 + bộ ghép vẽ lại (2026-11-01)

- **Quái biển + rương giả:** 7 quái biển dùng ảnh riêng. Rương giả là 4 quái `enemy_mimic_<vùng>` (ảnh `enemy_mimic`, tên "Rương Giả" / "Mimic Chest", chỉ số, kỹ năng, rơi đồ **chép đúng** quái vùng mà nhóm đó dùng trước đây: Heo Rừng Gai, Tượng Quặng, Lính Gác Đá, Cua Rạn), nên độ khó không đổi. Thẻ `elite` để không lọt vào bể quái thường của Vết Nứt. `import_maps.py` luôn đặt lại pool rương giả theo `MIMIC_ENEMY` (id nhóm không đổi, save không đổi).
- **Nền vùng Biển** `bg_adventure_coast` (thẻ vùng, trại, trận).
- **Dấu tha hóa trên quái** (map + trận): gân tím dưới chân từ cấp 3, cụm gai pha lê sau lưng từ cấp 4, cấp 5 thêm một cụm (map). Nhóm ngủ đeo `fx_sleep_zzz`. Đây là hình theo trạng thái nên vẽ trong scene như tint / quầng cũ. Hiệu ứng **một lần** `fx_secret_found` đi qua FeedbackDirector: `Presentation.vfx` (`AreaVfx` trong `core/events.ts`) → `areaVfx` → `AdventureScene.playVfx`; giảm chuyển động = chỉ hiện rồi mờ, không phóng / xoay.
- **Bộ ghép:** `scene/mapKit.ts` là bảng duy nhất "phần nào dùng ảnh kit nào"; ảnh thiếu thì về ảnh cũ. Biển có ô nền riêng (cát, đụn, biển, biển sâu, cầu gỗ, đá ướt cho `#` / `F`), khung cọ + đá hà, rắc vỏ sò. Lớp che 4 vùng chồng mảnh kit (tán cây, mái đá, mái đổ, cây dừa, trần hang) lên khối tròn cũ để vẫn che kín. Rương theo `type`; rương giả đội ảnh rương mimic. Cơ quan câu đố chọn theo từ trong id (lò lửa, bánh xe, cột thu lôi, bánh răng, phiến đá, vỏ trai), không có thì theo hệ. Đồ tha hóa rắc theo seed của khu, số lượng theo % (gần như chắc trên ô `c`), không chặn đường; giảm % thì bớt đi chứ không đổi chỗ.
- **Vật mốc:** dùng ảnh kit khi kit có (sồi cổ thụ, vòng đá, cây khô tha hóa, tháp nâng mỏ, sọ rồng, tượng vỡ, cửa phong ấn, hải đăng, vòm mai rùa, xác tàu). `import_maps.py` dời vật mốc chắn đường tới chỗ trống gần nhất trong 3 ô: xác tàu N9 (−1, +2), cửa đá N5 (−1, 0), bích họa M8 (0, +3) giờ đứng được. Id `prop_adv_lm_*` giữ nguyên.
- **Kỹ thuật:** hàng manifest của kit sinh bằng `kit_manifest.py`, khung = đúng cỡ ảnh đã duyệt (`mapKitSizes.json`) để `art:process` không co / đệm; `art:process` không tách nền ô nền kit (`adv_map_*_tile_*`); `seam_tiles.py` làm liền mép ô Biển (trộn với bản dịch nửa ô, như ô cũ).
- **Soát batch 14b:** CE hỏng (khối isometric chéo + chữ) nên không duyệt; FE, ME, RE, RP vẽ thừa hàng / vật, MT dính chữ, S1 vẽ lặp hai hàng: cắt bằng hộp tay (`MANUAL_REDO`). Batch 15: S1 có vạch đất nối 4 con, cắt lại tay; mòng biển, lươn, hiệp sĩ quay phải nên lật.

## Art vào game — đợt 2: CE, I1, mặt vách, lối ra, đạo cụ, ô nền 3 vùng (2026-11-01)

- **CE vẽ lại** đạt (mặt vách thẳng 3/4); dải vách cắt bỏ phần nước. **I1** (lưu là `I.png`, chép sang `I1.png`) cắt hàng trên; huy hiệu bạc giữ phần giữa xám.
- **Huy hiệu loại quái** `ui_icon_foe_*`: đầu nhãn nhóm trên map; trong trận cạnh tên quái (trùm → huy hiệu trùm, kẻ canh → tinh anh, còn lại theo loại nhóm; quái thường không có).
- **Mặt vách 3/4** (`scene/mapCliffs.ts`): mặt trước cao nguyên = dải `F` sâu ≤ 3 ô, phía trên là `^`, phía dưới là đất hoặc bậc thấp hơn; dải vách kit lặp ngang (`seam_tiles.py` làm liền mép ngang), bậc `s` và thác `w` ảnh riêng, đầu dải chạm tường bên thì đặt mảnh đầu vách bo tròn. Viền bên / sau của cao nguyên vẫn là ô tint (nhìn từ trên). Tàn Tích không có `F`.
- **Lối ra** theo `exits[].kind` + vùng; lối ra khóa đổi sang vật chắn của vùng (thay vì làm tối). **Tường giả** = tảng đá kit (id có `boulder`) hoặc tường nứt của vùng; mở ra thì thành bản vỡ, không biến mất. **Suối** theo vùng.
- **Ô nền kit 3 vùng** (nền, cao nguyên, nước, dung nham); đường / cầu / tường giữ ô cũ vì ô đường kit là một làn. Mỗi ảnh ô kit phủ 2 × 2 ô (khung con `q<x%2><y%2>`) để giảm lặp. Tách `scene/mapGround.ts`.
- **Đạo cụ theo cụm:** bố cục v2 không đặt đạo cụ, nên `wallPropsOf` rắc đạo cụ kit (cây, đá, cột đổ, cọ…) lên ô `#` sát đường đi, theo seed của khu; chỉ đứng trên ô chặn nên không đổi đường đi. Khung viền 3 vùng đổi sang đạo cụ kit.
