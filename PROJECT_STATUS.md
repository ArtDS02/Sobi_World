Current phase: S04A — Engine resolveTrough      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A — tag p04a
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier.
Important decisions: -
Golden §14.1: 12/12 PASS (G4 bật lại qua advanceWithTrough). §14.2: order-of-ops, 1 unit/3 pigs, empty trough, 3-day full trough PASS; idempotence advanceWorld → todo S04B; fillTrough TROUGH_FULL → todo phase actions.
Next task: S04B (block "### S04B" trong PROMPTS_THEO_PHASE.md) — src/core/engine/advanceWorld.ts dùng engine/trough.ts:advanceWithTrough (không gọi resolveTrough riêng, S04A-1); bật todo idempotence trong tests/unit/trough.test.ts.
