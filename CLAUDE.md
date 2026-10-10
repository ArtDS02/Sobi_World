# Sobi World
Game desktop (Electron + Vite + TypeScript + Phaser), chơi đơn, offline. Phát triển từ Sobi Farm (lịch sử git giữ nguyên, tag `sobi-farm-final`).

Bắt đầu mỗi phiên: đọc `docs/AGENT_RULES.md` rồi `docs/PROGRESS.md`. Nguồn sự thật: `docs/SOBI_WORLD_PROJECT_SPEC_V2.md` > `docs/decisions/` > `docs/ARCHITECTURE.md` > `docs/GAME_BALANCE.md` > code. Prompt từng giai đoạn: `docs/HUONG_DAN_TRIEN_KHAI.md`.
- Không đọc trừ khi task cần: `docs/archive/` (tài liệu Sobi Farm cũ, chỉ tham khảo), `asset/` (nguồn art), ảnh.
- `src/core/` thuần tuyệt đối: không import game/ui/store/platform, không DOM/browser/Node API, không `Date.now()`/`Math.random()`. `now`/`rng` luôn inject. Node API chỉ ở `electron/`.
- Tiền chỉ đổi qua 1 helper ghi Transaction. Chuỗi hiển thị ở `src/i18n/`, asset chỉ qua id → manifest.
- Mọi action thành công phát GameEvent; animation/VFX/âm thanh/toast chỉ qua FeedbackDirector.
- Không HTTP server/port/mạng trong bản ship. Save = file qua SaveStorage port; lỗi ghi không được nuốt. Không làm mất save người chơi.
- Cổng chất lượng: `npm run check` xanh trước khi commit. File LF (`.gitattributes`).
- Gameplay trước, art sau (decision 017, AGENT_RULES §8): art/animation/VFX/âm thanh chỉ làm ở GĐ14; trước đó dùng placeholder và ghi `docs/ASSET_TODO.md`.
- Skill `image-to-asset` dùng cho art (từ GĐ14). Guard kiến trúc: `scripts/guard/` (`npm run guard`).
- Comment code tiếng Anh. Trả lời tiếng Việt, báo cáo theo mẫu trong AGENT_RULES §7.
