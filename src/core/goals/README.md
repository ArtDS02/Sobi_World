# src/core/goals — Mục tiêu và thưởng (GĐ6)

Thuần (không DOM, không `Date.now()`/`Math.random()`; `now` và `rng` inject). Xem `docs/decisions/013-engagement.md`.

- `orders.ts` — Bảng đơn ở Sảnh: ô, làm mới, thưởng, đổi đơn bằng Ngọc.
- `daily.ts` — mục tiêu hằng ngày; `loginReward.ts` — quà đăng nhập.
- `achievements.ts` — thành tựu, thưởng Ngọc; `stats.ts` — bộ đếm cho thành tựu.
- `settle.ts` — bước "settle" của store: gom sự kiện của một action rồi cộng tiến độ / thưởng.
- `events.ts`, `state.ts`, `api.ts` — sự kiện, dạng state (save world v10) và cửa vào cho UI/store.
