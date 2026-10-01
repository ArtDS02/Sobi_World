Current phase: S06B — Actions chăm sóc      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B — tag p06b
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. BroadcastChannel + requestPersistentStorage → tầng store. §14.3 buySlot chưa làm (thuộc phase có "Action buySlot" trong PROMPTS_THEO_PHASE.md).
Important decisions: -
Actions: src/core/actions/{runAction,buyPig,sellPig,buyItem,renamePig,feedPig,cleanPig(+cleanAll),treatPig,fillTrough}.ts. Test helper chung: tests/unit/actionKit.ts.
Next task: S07 — gameStore (block "### S07" trong PROMPTS_THEO_PHASE.md).
