# content/ — nội dung và số liệu game (JSON)

- `shared/` — dùng chung mọi Area: item, shop, túi đồ, tiến trình, quality, thành tích, quà hằng ngày, ngày/đêm, `time.json` (4 buổi, bước mô phỏng, trần offline), `health.json` (bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới).
- `farm/` — của Sobi Farm: giống heo, lai giống, balance, hành vi, trang trí, quà, tên, FX mùa, layout, `area.json` (manifest Area).
- `schemas/` — zod schema cho từng file, từ vựng đóng (`vocab.ts`), id sinh tự động (`ids.generated.ts`).

Quy tắc: không hard-code số liệu trong code; sửa nội dung bằng Admin (`npm run admin`) hoặc sửa JSON rồi chạy test.
Sau khi thêm/xóa id: `npm run content:ids`. Id đã phát hành không bị xóa (decision 006). Game đọc qua `src/core/config/content.ts`.

GĐ3: `plaza/layout.json` (Sảnh), `shared/character.json` (nhân vật), `<area>/area.json` có `planned: true` cho Area chưa làm (Garden, Aquarium, Cloud, Adventure).
