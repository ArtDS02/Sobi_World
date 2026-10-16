# 027 — Sobi Garden: cảnh theo ảnh mẫu của chủ dự án

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án chọn hướng; bố cục chờ duyệt

## Bối cảnh
Cảnh Garden vẽ nền bằng code (trời, cỏ, hàng rào). Chủ dự án có ảnh mẫu bố cục (`art_inbox/.batch/garden-01-scene/garden-layout-template.png`) và nền đã sửa từ ảnh mẫu (sheet E, bỏ hết UI, ô đất và công trình). Batch `garden-01-scene` (soạn tay ngày 13/10) còn có bộ công trình, ô đất, rau khác với bộ `garden-01..03` đã giao.

## Quyết định (chủ dự án, 2026-10-16)
- **Nền:** `bg_garden` = sheet E của `garden-01-scene`, phóng ×1,25 → 1812 × 900 (như `bg_cloud`), phủ màn hình theo khung nhìn. Toạ độ đo trên nền: design x = px nền − 106, design y = px nền.
- **Sprite:** giữ 38 sprite của `garden-01..03`; cây "Cỏ" theo content (không dùng "Cà tím" của ảnh mẫu); công trình dùng bộ `garden-03-world`.
- **Bố cục:** (khu trồng: decision 028) ruộng 4 hàng × 6 ô trên bãi cỏ trong lối đi (ảnh mẫu vẽ 2 hàng; Garden có tới 24 ô) → ô và cây vẽ ở tỉ lệ 0,86. Máy xay ở góc trên trái, Thùng ủ ở bãi cỏ tròn dưới trái, Vòi tưới ở chỗ trống bên phải.
- **Nhãn công trình** (đã bỏ theo decision 028: thay bằng bong bóng tên khi rê chuột): bảng gỗ trên cọc `prop_garden_sign` (ô 3 sheet L của `garden-01-scene`, dòng manifest mới) cho Máy xay và Vòi tưới; tên Thùng ủ viết lên tấm bảng trống đã vẽ sẵn trong nền cạnh lối đi (bấm vào bảng = bấm công trình).
- Chỉ đổi phần trình bày (`scene/`), không đổi logic, content, save.

## Còn lại
- HUD Garden vẫn kiểu cũ (ảnh mẫu dùng HUD tím–trắng như Cloud / Sảnh).
- Bộ `garden-01-scene` (nhà xay mái xanh, thùng gỗ tròn, vòi bơm, ô viền đá, Bác Vịt Cẩn) chưa dùng; giữ trong `art_inbox` nếu muốn đổi sau.
