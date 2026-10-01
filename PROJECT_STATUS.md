Current phase: S00 — Setup + chốt quyết định + khung dự án      Status: DONE
Current task: -
Completed: S00 — tag p00
In progress: -
Known issues: tsconfig.json ở root dùng chung cho src/tests/scripts (lib DOM có mặt cả ở core; core thuần dựa vào ESLint + guard)
Important decisions: -
Next task: S02 — Types, config, rng, clock, i18n (block "### S02" trong PROMPTS_THEO_PHASE.md). Tạo src/core/types.ts, src/core/config/* (trích Phụ lục A bằng sed), src/core/rng.ts (Rng, mulberry32, hash Q3, defaultRng), src/core/clock.ts (Clock + fake, A2), src/i18n/vi.ts (Phụ lục B). Xem DECISIONS C1/C2/C3/Q3/Q6/A2.
