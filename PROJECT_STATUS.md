Current phase: S03 — Engine advancePig & derived values      Status: DONE
Current task: -
Completed: S00, S02, S03 — tag p03
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier.
Important decisions: -
Golden §14.1 (tests/unit/advancePig.test.ts):
  G1 1200s → 50/77.8/16.67 PASS · G2 2400s → 0/55.6/33.33 PASS · G3 7200s no trough → 33.33 PASS
  G4 7200s trough 10 → TODO (S04A) · G5 clean=30 at 3780s PASS · G6 sick: growth frozen, decay PASS
  G7 now<last → only lastTickedAt PASS · G8 split invariance PASS (+55 cặp (a,b) × 5 trạng thái, 3000×1s)
  G9 rng=0 sick ngay sau 3780s PASS · G10 rng=0.9999 không bệnh 1h PASS
  G11 stats 0.0502 (±0.006, N=20000, seed 12345) PASS · G12 starving 0.0980 vs fed 0.0499, hazard ratio 2±0.25 PASS (cần S03-1)
Next task: S04A (block "### S04A" trong PROMPTS_THEO_PHASE.md) — trough (resolveTrough §7.3), bật G4 trong tests/unit/advancePig.test.ts (it.todo → test).
