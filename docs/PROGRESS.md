# PROGRESS — Sobi World

## Trạng thái hiện tại
**Giai đoạn:** Chuẩn bị xong · chưa bắt đầu GĐ1
**Nhánh:** `main` (bản gốc Sobi Farm + tài liệu Sobi World) · GĐ1 làm trên `phase-01-world-foundation`
**Bước tiếp theo:** GĐ1 Bước 1 — kiểm tra code, viết `docs/AUDIT_AND_PLAN.md`, dừng chờ chủ dự án duyệt.

## Nhật ký

### 2026-10-04 — Tạo repo Sobi World
✅ Đã làm:
- Tạo repo `Sobi_World`, nhập toàn bộ lịch sử Sobi Farm (nhánh `start/unimo-v2` → `main`, giữ 54 tag), tag `sobi-farm-final`.
- Tài liệu Sobi World vào `docs/`; tài liệu Sobi Farm vào `docs/archive/sobi-farm/`; `CLAUDE.md`, `README.md` mới.
- Ghi 4 quyết định: `001` cấu trúc repo, `002` sinh vật có thể chết, `003` thang thời gian/bộ số, `004` lưới an toàn offline.
- Cập nhật SPEC (§2 bệnh/chết), ARCHITECTURE (§2 cấu trúc, §9 chuyển save cũ), GAME_BALANCE (thời gian, lớn, bệnh, giá),
  ROADMAP (ghi chú GĐ4), HUONG_DAN (mục A xong, prompt GĐ1), AGENT_RULES (nhánh, cổng chất lượng, ưu tiên decisions).
- Thêm `.gitattributes` ép LF (checkout CRLF làm hỏng test round-trip của admin config).

🧪 Đã kiểm tra: `npm ci` + `npm run check` xanh — 57 file test, 667 test.

## Chênh lệch số so với Sobi Farm (cần xử lý ở GĐ2)
- Đói 2 giờ → 12 giờ; sạch 5 giờ → 24 giờ; thời gian lớn theo rarity mới (decision 003).
- D21 "không chết" → chết sau 72 giờ bệnh, có ân hạn 12 giờ sau bù offline (decision 002, 004).
- Giá chuồng/máng trong GAME_BALANCE §2.6 viết theo thang 360 Coins; quy đổi sang thang tiền Sobi Farm (heo 500).

## Vấn đề còn mở
- Skill `.claude/skills/spec-to-source` còn trỏ tới tài liệu Sobi Farm đã lưu trữ — không dùng; xem xét xóa hoặc viết lại ở GĐ1.
- Thư mục save vẫn là `%APPDATA%\Un In Homemade\`; chuyển sang `SobiWorld` kèm sao chép save cũ ở GĐ1 (save) hoặc GĐ4.
- `npm ci` báo vài cảnh báo `npm audit` (thư viện dev) — chưa xử lý.
