Current phase: R00 — Review kiến trúc + tài liệu v4.1 (desktop)      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07, S08A, S08B — tag p08b; R00 (chỉ tài liệu)
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core) → R01. Lỗi ghi save bị nuốt (gameStore persist catch) → R01. storage.ts còn trong core (ngoại lệ A1) → R01. skins.ts còn giữ giá skin — C2 chuyển sang assets.json → R04. Action đã có chưa phát event feedback → R05B. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → R08. §14.3 buySlot chưa làm → R03. Away summary (§9.5) chưa ghép → R11. Màn recovery chưa có nút nhập file/bắt đầu mới → R11. Lịch sử chưa có lối vào → R03. Tutorial chưa có → R11. vi.ts còn install/installHint/update (Phụ lục B v4.1 bỏ) → R02.
Important decisions: hướng desktop chốt ở DECISIONS R00-1…R00-10 (Electron, Windows, file save, manifest v2, FeedbackDirector, cosmetics vẫn backlog).
UI: actionsVm.ts (probe → lý do), dialogs.ts (bán/đổi tên/đổ máng), components/{actionButton,dialog}.ts, devTools.ts (?dev=1). Smoke test trình duyệt OK: mua, đổ máng, tắm tất cả, +6h, toast, hộp bán.
Next task: R01 — Platform seam (block "### R01" trong PROMPTS_THEO_PHASE.md): tạo src/core/save/port.ts, chuyển src/core/save/storage.ts + src/store/tabGuard.ts sang src/platform/web/, saveError trong gameStore, tách tsconfig core, Vite base './', vùng .app__stage trong src/ui/app.ts, cập nhật guard. Chơi thử S08B dời sang cổng ★ của R02 (trên bản cài).
