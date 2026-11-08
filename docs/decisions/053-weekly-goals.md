# 053 — Weekly cross-Area goals (D2)

- Four goals a week, drawn from `content/shared/goals.json › weekly` (10 templates over the five Areas), one Area each while there are Areas left to pick from, new on local Monday (`weekOfDay`: day 0 is a Thursday, so `floor((day + 3) / 7)`).
- Same machinery as the daily goals (target = "this many more of a counter since the goal was set"); drawn from the week's seed, so every save sees the same week. Reward per goal: coins + gems; bonus for finishing all: coins, gems, festival tokens, world XP. Every payment goes through the ledger (`WEEKLY_GOAL` / `WEEKLY_BONUS` Transactions).
- Save: world v12 adds `goals.weekly` (migration 11 → 12 gives an empty block; the first tick draws the week). Existing backup-before-migration applies.
- UI: a "Nhiệm vụ tuần" section under the daily goals in the goals panel; toasts through the goals presentation. No art needed (decision 017).
- Numbers are first guesses in line with GAME_BALANCE §8 (weekly pay ≈ 3–4 daily goals); tune in the admin (Nội dung game › Mục tiêu hằng ngày).
