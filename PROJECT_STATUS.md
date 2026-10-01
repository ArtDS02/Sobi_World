Current phase: S08A — DOM UI khung + nông trại      Status: DONE
Current task: -
Completed: S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07, S08A — tag p08a
In progress: -
Known issues: tsconfig root dùng chung (lib DOM có ở core). skins.ts còn giữ giá skin — C2 chuyển sang assets.json khi làm store/shop. File trích Phụ lục chưa prettier. Fuzz invariant §5.5 → S19. §14.3 buySlot chưa làm. Away summary (§9.5) chưa ghép. UI re-render toàn bộ màn mỗi tick 1 s (mất focus bàn phím) — chấp nhận tới khi có Phaser. Màn recovery chưa có nút nhập file/bắt đầu mới (S08B). Lịch sử chưa có lối vào.
Important decisions: -
UI: src/ui/{app,dom,viewModel}.ts, components/{topBar,navBar,pigPanel,toast}.ts, screens/{farmScreen,placeholderScreen,statusScreen}.ts; style src/styles/core/* + features/_farm.scss. View-model thuần có test (tests/unit/viewModel.test.ts).
Next task: S08B — DOM UI: hành động + cổng chơi thử (block "### S08B" trong PROMPTS_THEO_PHASE.md). Gắn nút vào components/pigPanel.ts, dispatch qua store.dispatch.
