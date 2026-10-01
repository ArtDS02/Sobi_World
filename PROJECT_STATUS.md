Current phase: S04B — Engine advanceWorld + GameEvent      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B — tag p04b
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. PIG_BECAME_SICK/ADULT chưa có thời điểm (advancePig không trả tSick).
Important decisions: -
Hooks: src/core/engine/breeding.ts:resolveBirths (S10, bước 3 §7.4), src/core/engine/orders.ts:refreshOrders (S11, bước 4). LEVEL_UP/DISCOVERY do actions phát.
Golden §14.1 12/12. §14.2: tất cả pass trừ fillTrough TROUGH_FULL (todo, phase actions).
Next task: S05 — Save & persistence (block "### S05" trong PROMPTS_THEO_PHASE.md).
