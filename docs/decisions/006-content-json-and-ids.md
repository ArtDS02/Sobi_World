# 006 — Nội dung là JSON có schema; id đã phát hành không đổi

**Ngày:** 2026-10-09 · **Trạng thái:** Đã áp dụng ở GĐ1

## Bối cảnh
Sobi Farm để số liệu và nội dung trong file `.ts`; Admin ghi thẳng vào các file đó giữa marker `// <admin:NAME>`.
Id (giống heo, item, trang trí) là union kiểu TypeScript, nên thêm nội dung nghĩa là sửa code.

## Lựa chọn
- Nội dung và số liệu nằm trong `content/shared/*.json` và `content/farm/*.json`, kiểm bằng zod ở `content/schemas/`.
- `core/content` là hàm thuần `loadContent`; `src/core/config/content.ts` import JSON tĩnh (Vite gộp vào build, không fetch, không mạng).
  Content hỏng làm game dừng ở màn hình lỗi khởi động, không chạy với dữ liệu sai.
- Admin ghi JSON qua đúng schema của game (`scripts/admin/contentFiles.ts`); dữ liệu sai bị từ chối (HTTP 400). Layout file có
  định dạng ổn định (`scripts/content/format.ts`), lưu không đổi thì không có diff.
- Danh sách id sinh từ content (`npm run content:ids` → `content/schemas/ids.generated.ts`); test kiểm file sinh còn khớp
  và id không bị xóa.
- **Id đã phát hành giữ nguyên** (`PIG_*`, `FOOD_BASIC`, `MEDICINE_COMMON`, `DECOR_*`). Quy ước `item_`/`breed_` chỉ cho id mới.
- Tên tiền hiển thị là **Sobi Coin** (spec V2 §6); id kỹ thuật là `coins` trong `wallet`.

## Lý do
Thêm nội dung không cần sửa logic; Admin an toàn hơn khi ghi dữ liệu thay vì sinh mã; save cũ vẫn mở được vì không đổi id.
