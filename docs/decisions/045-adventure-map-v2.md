# 045 — Adventure: bản đồ v2 — camera bám, khu ẩn, tha hóa, phân loại quái, bộ asset dựng map mới

Ngày: 2026-10-30 · Trạng thái: **chủ dự án đã duyệt hướng** (2026-10-30). Chưa làm code; art bắt đầu bằng batch `adventure-14-map-v2`.
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
