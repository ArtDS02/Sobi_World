# 022 — Quy trình art GĐ14: phong cách Farm, Gemini vẽ sheet, Claude làm phần còn lại

**Ngày:** 2026-10-12 · **Trạng thái:** Đã chốt bởi chủ dự án (phong cách, Area đầu tiên); phần kỹ thuật do agent chọn

## Bối cảnh
GĐ14 cần thay 162 asset `placeholder`. Phiên agent (Claude Code, gói Pro) không có model tạo ảnh, và chủ dự án không mua API. Ảnh tham khảo của các Area mới (`asset/reference/sobi_cloud`, `sobi_world`) là mock-up kiểu "sticker" viền đậm, khác bộ Sobi Farm đã có trong game.

## Quyết định
- **Phong cách chuẩn của mọi Area là Sobi Farm** (`asset/GAME_ART_DIRECTION.md`, CORE `asset/reference/sobi_farm/`). Mock-up Sobi World được xếp loại `CONTENT`: chỉ dùng phần cắt ra để gợi ý hình dáng, không làm chuẩn phong cách.
- **Backend G:** Gemini bản miễn phí vẽ **sheet** (nhiều asset cùng nhóm trong một ảnh: một nét vẽ, một tỉ lệ), chủ dự án chỉ dán prompt và lưu ảnh. Mọi bước khác do agent làm bằng script: prompt và file đính kèm (`batch.mjs prep`), cắt sheet và tách nền (`cut-sheet.mjs`), ảnh duyệt, chọn, `art:process`, `assets:check`, chạy game và chụp màn hình.
- Ảnh đính kèm đầu tiên luôn là **bảng phong cách** ghép từ art Farm đã duyệt (`references/style-boards.json`, không asset nào có chữ).
- Nền sheet là màu xám phẳng `#C8C8C8` để tách tự động; giai đoạn sinh trưởng của một cây vẽ chung một hàng và cắt **cùng tỉ lệ** (`fit shared`).
- Animation chạy bằng code (tween, particle), không vẽ nhiều khung, trừ `sleep` / `wake` của heo vốn có trong manifest.
- Kế hoạch batch cho cả 162 dòng: `asset/batches/README.md` (khoảng 39 lượt Gemini). Làm theo từng Area, dừng chờ duyệt sau mỗi Area. Bắt đầu từ **Cloud**.

## Không đổi
Logic, content, save. Tiêu chuẩn định dạng (`ASSET_PRODUCTION_STANDARD_v1.md`), cỡ canvas (`scripts/assets/sizes.ts`), dung sai QA.

## Hệ quả
- Skill `image-to-asset`: thêm `workflows/batch.md`, `references/families.md`, `references/style-boards.json`, `scripts/batch.mjs`, `scripts/cut-sheet.mjs`; `ref-check.mjs` quét thư mục con; registry có lớp `CONTENT`.
- Ảnh tham khảo gom về `asset/reference/<area>/` (bỏ bản trùng `docs/reference-assets/`); sửa đường dẫn cũ trong các script cắt ảnh sau lần dời thư mục `asset/*/sobi_farm/`.
- Asset ngoài manifest (ảnh NPC riêng, icon thời tiết, công nghệ, tính trạng) cần thêm dòng manifest và đổi `artId` / UI: hỏi chủ dự án trước.
