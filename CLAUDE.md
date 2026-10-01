# Ủn Ỉn Homemade
Mọi việc triển khai/tiếp tục: dùng skill `spec-to-source` (quy trình, giao tiếp, state). Task: `PROMPTS_THEO_PHASE.md`. State: `PROJECT_STATUS.md`.
- Không đọc: archive/, hướng_dẫn_triển_khai.md, DESIGN_README.md, asset/animals/, asset/building/, ảnh (trừ khi task bảo).
- src/core/ thuần: không import game/ui/store, không DOM/browser API (trừ save/storage.ts), không Date.now()/Math.random() (trừ defaultRng trong rng.ts). now/rng luôn inject.
- Vàng chỉ đổi qua 1 helper ghi Transaction. Số ở src/core/config/, chuỗi ở src/i18n/vi.ts, asset qua public/assets/manifest/assets.json.
- Không nới golden value/tolerance. Không làm §20 Backlog, không cosmetics, không gọi mạng runtime.
- Comment code tiếng Anh. Trả lời tiếng Việt, theo format DONE/BLOCKED của skill.
