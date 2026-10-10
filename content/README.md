# content/ — nội dung và số liệu game (JSON)

- `shared/` — dùng chung mọi Area: item, shop, túi đồ, tiến trình, quality, thành tích, quà hằng ngày, ngày/đêm, `time.json` (4 buổi, bước mô phỏng, trần offline), `health.json` (bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới).
- `farm/` — của Sobi Farm: giống heo, lai giống, balance, hành vi, trang trí, quà, tên, FX mùa, layout, `area.json` (manifest Area).
- `schemas/` — zod schema cho từng file, từ vựng đóng (`vocab.ts`), id sinh tự động (`ids.generated.ts`).

Quy tắc: không hard-code số liệu trong code; sửa nội dung bằng Admin (`npm run admin`) hoặc sửa JSON rồi chạy test.
Sau khi thêm/xóa id: `npm run content:ids`. Id đã phát hành không bị xóa (decision 006). Game đọc qua `src/core/config/content.ts`.

GĐ5: `garden/` — `crops.json` (5 cây: hạt, giờ lớn, sản lượng), `balance.json` (ô đất, tưới, héo, phân bón, vòi tưới, Máy xay / Thùng ủ, bảng cấp), `area.json`; `shared/recipes.json` (recipe của công trình); `shared/items.json` có thêm hạt, nông sản, thức ăn cao cấp, phân bón. Tất cả sửa được ở Admin → Số liệu.

GĐ3: `plaza/layout.json` (Sảnh), `shared/character.json` (nhân vật), `<area>/area.json` có `planned: true` cho Area chưa làm (Garden, Aquarium, Cloud, Adventure).

GĐ7: `breeding/` — `traits.json` (tính trạng: hiệu ứng, trọng số), `balance.json` (di truyền, đột biến, vận may, phả hệ), `rumors.json` (câu tin đồn của Nhà lai giống). Bảng cặp và công thức đặc biệt vẫn ở `farm/breeding.json`; `farm/species.json` thêm `signatureTrait`, `favorite`; `shared/npcs.json` thêm NPC `station`.
