# Ủn Ỉn Homemade
Game desktop Windows (Electron), chơi đơn, offline. Spec v4.1. Mọi việc triển khai/tiếp tục: dùng skill `spec-to-source` (quy trình, giao tiếp, state). Task: `PROMPTS_THEO_PHASE.md`. State: `PROJECT_STATUS.md`.
- Không đọc: archive/, hướng_dẫn_triển_khai.md, DESIGN_README.md (cả hai lỗi thời về runtime), asset/animals/, asset/building/, ảnh (trừ khi task bảo).
- src/core/ thuần tuyệt đối: không import game/ui/store/platform, không DOM/browser/Node API, không Date.now()/Math.random() — không có ngoại lệ. now/rng luôn inject. Browser API ở src/platform|store|ui|game; Node API chỉ ở electron/.
- Vàng chỉ đổi qua 1 helper ghi Transaction. Số ở src/core/config/, chuỗi ở src/i18n/vi.ts, asset chỉ qua id → public/assets/manifest/assets.json (không ghi tên file trong src/).
- Mọi action thành công phát GameEvent; animation/VFX/âm thanh/toast chỉ chạy qua FeedbackDirector (spec §11.3).
- Không HTTP server/port/localhost trong bản ship, không SQLite, không gọi mạng runtime. Save = file qua SaveStorage port; lỗi ghi không được nuốt.
- Không nới golden value/tolerance (trừ breeding — U00-1 D4). Không làm §20 Backlog. Cosmetics/clothing: chỉ data foundation (U00-1 D1). Quyết định U-phase: `UPDATE_AUDIT.md` §5.
- Comment code tiếng Anh. Trả lời tiếng Việt, theo format DONE/BLOCKED của skill.
