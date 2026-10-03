# Sobi World
Game desktop (Electron + Vite + TypeScript + Phaser), chơi đơn, offline. Phát triển từ Sobi Farm (lịch sử git giữ nguyên, tag `sobi-farm-final`).

Bắt đầu mỗi phiên: đọc `docs/AGENT_RULES.md` rồi `docs/PROGRESS.md`. Nguồn sự thật: `docs/SOBI_WORLD_PROJECT_SPEC_V2.md` > `docs/decisions/` > `docs/ARCHITECTURE.md` > `docs/GAME_BALANCE.md` > code. Prompt từng giai đoạn: `docs/HUONG_DAN_TRIEN_KHAI.md`.
- Không đọc trừ khi task cần: `docs/archive/` (tài liệu Sobi Farm cũ, chỉ tham khảo), `asset/` (nguồn art), ảnh.
- `src/core/` thuần tuyệt đối: không import game/ui/store/platform, không DOM/browser/Node API, không `Date.now()`/`Math.random()`. `now`/`rng` luôn inject. Node API chỉ ở `electron/`.
- Tiền chỉ đổi qua 1 helper ghi Transaction. Chuỗi hiển thị ở `src/i18n/`, asset chỉ qua id → manifest.
- Mọi action thành công phát GameEvent; animation/VFX/âm thanh/toast chỉ qua FeedbackDirector.
- Không HTTP server/port/mạng trong bản ship. Save = file qua SaveStorage port; lỗi ghi không được nuốt. Không làm mất save người chơi.
- Cổng chất lượng: `npm run check` xanh trước khi commit. File LF (`.gitattributes`).
- Skill `.claude/skills/spec-to-source` là quy trình của Sobi Farm (trỏ tới tài liệu đã lưu trữ) — không dùng; quy trình hiện tại là `docs/AGENT_RULES.md`. Skill `image-to-asset` vẫn dùng cho art.
- Comment code tiếng Anh. Trả lời tiếng Việt, báo cáo theo mẫu trong AGENT_RULES §7.
