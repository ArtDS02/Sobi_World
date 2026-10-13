# src/areas/plaza — Sảnh Sobi (GĐ3)

Điểm xuất hiện khi mở game; 5 cổng dẫn tới 5 Area. **Không phải AreaModule** (không có số liệu, không có slice save): xem `docs/decisions/010-plaza-and-character.md`.

- `logic/portals.ts` — trạng thái từng cổng (mở / khóa / sắp ra mắt) và điều kiện mở, từ `AreaInfo` của registry.
- `scene/PlazaScene.ts` — cảnh Phaser, không có nhân vật (decision 025): bấm công trình / bảng tên là vào khu, rê chuột hiện gợi ý. Gợi ý và đổi chỗ đi qua `WorldHost` (`src/ui/world/host.ts`).
- Nội dung: `content/plaza/layout.json` (sửa bằng Admin → Bố cục → Sảnh Sobi).
- Trạm (`station`, ví dụ Bảng đơn hàng `prop_order_board`, GĐ6): vật có gợi ý và cú bấm như cổng, nhưng mở một bảng thay vì đổi Area.
- `logic/art.ts` — art Sảnh của batch `world-01-scene` (decision 024) và id icon khu vực (`ui_area_<khu>`).
- Ảnh nền vẽ sẵn (`backdrop` trong layout) chỉ hiện khi art thật đã về; mỗi vật có thể có `fallback` (art cũ dùng tạm).
