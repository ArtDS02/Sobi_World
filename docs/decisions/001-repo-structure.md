# 001 — Cấu trúc repo: một game, mỗi Area một thư mục

**Ngày:** 2026-10-04 · **Trạng thái:** Đã chốt (chủ dự án duyệt)

## Bối cảnh
Sobi World gồm Sảnh + 5 Area dùng chung nhân vật, túi đồ, tiền, save, đồng hồ mô phỏng và một bản cài.
Code nền là repo Sobi Farm (Electron + Vite + TypeScript + Phaser), lịch sử ở `D:\Local\Sobi_Farm` (remote `ArtDS02/UNIMO`).

## Lựa chọn
- **Repo mới `ArtDS02/Sobi_World`**, nhập nguyên lịch sử git của Sobi Farm (nhánh `start/unimo-v2` → `main`, giữ mọi tag; tag `sobi-farm-final` = điểm xuất phát).
- **Một ứng dụng, một `package.json`**. Không tách 5 project/package. Mỗi Area là một thư mục `src/areas/<id>/`.
- Độc lập giữa các Area được bảo đảm bằng **script kiểm tra import** (`npm run guard`), không bằng ranh giới package.
- Dữ liệu nội dung và asset **gom theo Area** để sửa một Area chỉ đụng thư mục của Area đó:
  `content/<area>/`, `public/assets/<area>/`; thứ dùng chung ở `content/shared/`, `public/assets/shared/`.
- Bên trong mỗi Area: `index.ts` (manifest + hook), `logic/` (simulate thuần, có test), `scene/` (Phaser), `ui/`, `README.md`.
- Tài liệu Sobi Farm cũ chuyển vào `docs/archive/sobi-farm/` (tham khảo, không còn là nguồn sự thật).
- `.gitattributes` ép LF: admin ghi config và test round-trip so sánh văn bản chính xác.

## Lý do
Tách project buộc đồng bộ phiên bản save/item giữa nhiều nơi; sửa một lỗi save phải sửa nhiều chỗ. Một repo + quy tắc
import cho độ cô lập tương đương mà không tốn chi phí. Giữ lịch sử git để truy lại mọi quyết định cũ.

## Khác với ARCHITECTURE.md bản đầu
`content/` chia theo Area thay vì theo loại dữ liệu (đã cập nhật ARCHITECTURE.md §2).
