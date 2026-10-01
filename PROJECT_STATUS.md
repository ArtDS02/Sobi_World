Current phase: S08B — DOM UI hành động + cổng chơi thử      Status: DONE (chờ user chơi thử)
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07, S08A, S08B — tag p08b
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. §14.3 buySlot chưa làm. Away summary (§9.5) chưa ghép. Màn recovery chưa có nút nhập file/bắt đầu mới. Lịch sử chưa có lối vào. Tutorial chưa có (§15 Phase 1).
Important decisions: -
UI: actionsVm.ts (probe → lý do), dialogs.ts (bán/đổi tên/đổ máng), components/{actionButton,dialog}.ts, devTools.ts (?dev=1). Smoke test trình duyệt OK: mua, đổ máng, tắm tất cả, +6h, toast, hộp bán.
Next task: CHỜ phản hồi chơi thử của user, rồi S09 (block "### S09" trong PROMPTS_THEO_PHASE.md).
