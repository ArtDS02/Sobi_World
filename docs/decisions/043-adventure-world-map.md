# 043 — Adventure: mở rộng bản đồ thế giới (18 map, bán mở) — Đợt 0 nền tảng

Ngày: 2026-10-29 · Trạng thái: **hướng 3 đã duyệt**; các điểm còn lại theo đề xuất trong `docs/WORLD_MAP_AUDIT.md`, chờ chủ dự án xác nhận trước từng đợt.

## Bối cảnh

Chủ dự án giao spec "Sobi Adventure — World Map Expansion": từ 9 lên 18 map, có nhánh phụ, đường tắt, bí mật, lore First Guardians, và map không bị tường bao kín. Audit (`docs/WORLD_MAP_AUDIT.md`) tìm ra mấy điểm:
- Ba vùng dùng chung 3 bố cục: M2 = M5 = M8 và M3 = M6 = M9, giống hệt nhau từng ô.
- Mọi map bị tường bao kín, lối ra cố định ở hàng 12–14.
- Boss gate đã có sẵn: kẻ canh mỗi map, cộng `exitOpen` chặn lối sang vùng chưa mở.
- Còn thiếu đường tắt mở từ một phía.
- Batch vẽ lại `adventure-11-map` đã có 9 tranh theo bố cục cũ.

Decision 037 đã mở băng cho bản đồ và slice save Adventure.

## Lựa chọn

1. **Hướng 3 (lai) cho 9 map cũ** (chủ dự án chọn 2026-10-29):
   - Giữ bố cục M1–M3; tranh vẽ lại của 3 map này dùng được.
   - Đổi bố cục M4–M9, rồi vẽ lại 6 tranh đó.
   - Lối nhánh mới trên M1–M3 đặt **bên trong map** (cửa hang, bậc đá, đầu cầu), để chỉ phải vẽ thêm một vùng nhỏ trên tranh.
   - Mọi id (map, rương, cổng, lore, nhóm quái, lối ra) giữ nguyên, nên save không mất gì.
2. **Tuyến chính giữ như code:** M1 → … → M6 → M7 → M8 → M9. Không thêm cạnh M5–M7 của spec, vì cạnh đó bỏ qua trùm Núi và trái với §14.2 của chính spec.
3. **Map nhánh tách khỏi tuyến chính:** `zone.branches` (tùy chọn) liệt kê map nhánh của vùng; `zone.maps` vẫn là tuyến chính.
   - Đi nhanh, bot cân bằng, Vết Nứt và luật "map cuối có trùm" vẫn chỉ đọc `zone.maps`.
   - % khám phá, cổng khu và kiểm tra dữ liệu đọc cả hai danh sách.
4. **Đường tắt mở từ một phía:**
   - Lối ra có `lock: 'shortcut'` thì đóng cho tới khi đội **đi qua lối ngược lại** từ map bên kia: lối nằm ở map đích của lối đó và dẫn về map nguồn.
   - Đã mở là mở mãi, lưu trong `openedExits` (slice Adventure **v5**, migration thêm `[]`).
   - Khi mở có sự kiện `ADVENTURE_SHORTCUT_OPENED` và một toast.
   - Lối sang vùng chưa mở vẫn bị `exitOpen` chặn như cũ.
5. **Dữ liệu lối ra** (§13.3 của spec):
   - `facing` (tùy chọn): hướng nhân vật khi tới. Thiếu thì giữ cách đoán cũ: lối ở mép trái → quay trái, còn lại quay phải.
   - `kind` (tùy chọn, mặc định `gate`): `gate | trail | cave | bridge | stairs | shore | tunnel`. Đợt 0 chỉ lưu; mọi kiểu vẫn vẽ bằng hình cổng dịch chuyển cho tới khi có art (ASSET_TODO).
6. **Kiểm tra dữ liệu mới** (`config/content.ts`, `logic/maps.ts`):
   - id lối ra không trùng trong toàn game.
   - Mỗi lối ra có lối ngược lại ở map đích. Hiện chưa có lối một chiều.
   - Lối `shortcut` phải có lối ngược lại không phải `shortcut`, nếu không thì không bao giờ mở được.
   - Mỗi map thuộc đúng một vùng, ở `maps` hoặc `branches`.
   - Map nhánh không có trùm.
   - Mọi map của vùng đi tới được từ cửa vùng qua lối ra.
   - Ô đến không trùng chỗ nhóm quái.
7. **Lý do khóa hiện trên lối ra:**
   - "Hạ kẻ canh khu để mở cổng" (guardian)
   - "Lối tắt — mở từ phía bên kia" (shortcut)
   - "Vùng bên kia chưa mở" (vùng đích khóa; trước đây sai, hiện là "hạ kẻ canh")

## Các điểm theo đề xuất audit (chờ chủ dự án xác nhận trước đợt liên quan)

- N1 / N2 / N3 thuộc Rừng, N4 / N5 thuộc Núi, N6 thuộc Tàn Tích.
- Vùng Biển N7–N9 là `zone_coast`, mở sau trùm Núi, cho đội cấp 14–24.
- Map nhánh có cổng khu riêng, thắp sau khi hạ kẻ canh của nó.
- Lore mới tiếp nối tên 9 dòng Guardian. Cách hiểu về Hộ Pháp Cổ Đại chờ chủ dự án chốt.
- Quái mới: N01–N12 của batch 13 dùng cho map nhánh; quái biển cần một batch riêng.

## Kế hoạch đợt

- Đợt 0 (decision này): nền tảng, không thêm map, cảm giác chơi không đổi.
- Đợt 1: đổi bố cục M4–M9. Thêm bước sửa vị trí khi tải: chuyến đang dở mà đứng trên ô không còn đi được thì về `spawn`.
- Đợt 2: N1 + N2.
- Đợt 3: N4 + N5.
- Đợt 4: N6 + Sổ Lore.
- Đợt 5: vùng Biển.

## Hệ quả

- Save Adventure v4 → v5: chỉ thêm `openedExits: []`, không đổi dữ liệu cũ.
- Content cũ hợp lệ nguyên vẹn: mọi lối ra hiện có đã có lối ngược lại, không có `shortcut`.
