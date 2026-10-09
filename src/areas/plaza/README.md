# src/areas/plaza — Sảnh Sobi (GĐ3)

Điểm xuất hiện khi mở game; 5 cổng dẫn tới 5 Area. **Không phải AreaModule** (không có số liệu, không có slice save): xem `docs/decisions/010-plaza-and-character.md`.

- `logic/portals.ts` — trạng thái từng cổng (mở / khóa / sắp ra mắt) và điều kiện mở, từ `AreaInfo` của registry.
- `logic/arrival.ts` — nhân vật xuất hiện ở đâu (chỗ đã lưu, trước cửa Area vừa rời, hoặc điểm xuất hiện).
- `logic/walkable.ts` — mặt đất đi được + vật cản.
- `scene/PlazaScene.ts` — cảnh Phaser; chỉ vẽ và đi. Phím, gợi ý phím, đổi chỗ đi qua `WorldHost` (`src/ui/world/host.ts`).
- Nội dung: `content/plaza/layout.json` (sửa bằng Admin → Bố cục → Sảnh Sobi).
