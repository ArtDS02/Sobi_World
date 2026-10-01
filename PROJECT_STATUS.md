Current phase: S05 — Save & persistence      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05 — tag p05
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. BroadcastChannel multi-tab và gọi requestPersistentStorage() → tầng store.
Important decisions: -
Storage: IndexedDB db "un-in-homemade" / store "saves" / key "current" (chuỗi JSON). localStorage mirror "un-in-homemade:save:mirror", backup "un-in-homemade:save:backup" (hằng ở src/core/config/save.ts).
Chuỗi đọc (storage.ts:load): primary → mirror → backup → {kind:'recovery'}; tất cả trống → 'empty' (newGame); SAVE_TOO_NEW ở nguồn đầu tiên đọc được → 'tooNew' + khoá save(). Load không bao giờ ghi/xoá.
Chuỗi ghi (save): backup ← save tốt trước đó → IndexedDB → mirror.
Next task: S06A — Actions: kinh tế (block "### S06A" trong PROMPTS_THEO_PHASE.md). Vàng chỉ qua engine/gold.ts:changeGold.
