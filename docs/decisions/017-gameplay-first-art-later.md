# 017 — Gameplay trước, art sau (điều chỉnh roadmap)

**Ngày:** 2026-10-11 · **Trạng thái:** Đã chốt bởi chủ dự án

## Bối cảnh
Đến GĐ9, mỗi Area mới đều có art placeholder và một danh sách art còn thiếu (`docs/ASSET_TODO.md`). Gameplay của GĐ10–GĐ12 (Adventure, thế giới động) còn có thể đổi cơ chế; làm art sớm có nguy cơ phải làm lại. Roadmap cũ trộn âm thanh, hiệu ứng, trợ năng, ngôn ngữ và phát hành vào GĐ13.

## Quyết định
- Hoàn thiện logic, gameplay, hệ thống dùng chung, save/load, cân bằng và tích hợp trước. Art, animation, VFX, âm thanh làm một lần ở giai đoạn riêng sau khi gameplay đóng băng.
- Roadmap: GĐ10–GĐ12 giữ nguyên (gameplay). **GĐ13** thành "Tích hợp, kiểm thử gameplay, nghiệm thu" (UI chức năng, trợ năng chức năng, tiếng Anh, hiệu năng, rà item/save, chơi thử, **gameplay freeze**). **GĐ14** mới: hoàn thiện art, animation, VFX, âm thanh, polish UI. **GĐ15**: phát hành 1.0 (GĐ13 cũ, phần art/âm thanh chuyển sang GĐ14).
- Placeholder không chặn merge nếu gameplay đạt nghiệm thu. UI chức năng vẫn phải đủ để chơi. Asset đi qua id → manifest nên thay placeholder không đụng logic.
- Không quay lại phase đã nghiệm thu chỉ để thêm art/animation/VFX/polish UI: ghi vào `ASSET_TODO.md`, làm ở GĐ14. Lỗi gameplay, kiến trúc hoặc tích hợp thật vẫn được sửa (đánh giá ảnh hưởng, sửa phần cần thiết, ghi `PROGRESS.md`).

## Không đổi
Lịch sử các phase đã xong (GĐ1–GĐ9), đặc tả gameplay (SPEC V2), kiến trúc, GAME_BALANCE. Art đã có (placeholder hay đã cắt) giữ nguyên.

## Hệ quả
- Tài liệu cập nhật: `ROADMAP.md` (tổng quan, GĐ13–15, bảng phụ thuộc và nghiệm thu), `HUONG_DAN_TRIEN_KHAI.md` (prompt GĐ13–15), `AGENT_RULES.md` §8, `ASSET_TODO.md` (chính sách), `CLAUDE.md`, `PROGRESS.md`.
- Hiệu ứng thời tiết (GĐ12) và âm thanh/hiệu ứng nhỏ chỉ cần **đủ để chơi** bằng placeholder; bản đẹp ở GĐ14.
