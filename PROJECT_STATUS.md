Current phase: S06A — Actions kinh tế      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A — tag p06a
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. BroadcastChannel + requestPersistentStorage → tầng store.
Important decisions: -
Actions: src/core/actions/{runAction,buyPig,sellPig,buyItem,renamePig}.ts. Mọi action mới: `runAction(state, ctx, body)`; vàng chỉ qua engine/gold.ts:changeGold; XP qua engine/xp.ts:addXP.
Next task: S06B — Actions: chăm sóc (block "### S06B" trong PROMPTS_THEO_PHASE.md). Dùng runAction + addXP; fillTrough bật todo TROUGH_FULL trong tests/unit/trough.test.ts nếu thuộc phạm vi.
