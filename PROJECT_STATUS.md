Current phase: S07 — gameStore      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07 — tag p07
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. §14.3 buySlot chưa làm (phase có "Action buySlot"). Away summary (§9.5, ≥10 phút) chưa ghép: init tick đã phát event qua onEvents, UI cần tính thời gian vắng (save.updatedAt/lastTickedAt trước init).
Important decisions: -
Store: src/store/{gameStore,tabGuard,runtime}.ts. realClock/defaultRng chỉ ở runtime.ts, inject qua createGameStore(deps).
Next task: S08A — DOM UI: khung + nông trại (block "### S08A" trong PROMPTS_THEO_PHASE.md). Dùng createGameStore() từ src/store/gameStore.ts.
