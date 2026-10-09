# src/areas/farm — Sobi Farm (Area đầu tiên)

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest ở `content/farm/area.json`).
- `logic/` — luật và hành động của nông trại (thuần, có test): mô phỏng `advanceWorld`, lai giống, máng, đơn hàng, quà, 21 action.
- `scene/` — Phaser: cảnh nông trại, prefab, FX, phản hồi (FeedbackDirector).
- `ui/` — màn hình DOM và view-model của Farm.
- `store.ts` — gắn Farm vào game store.

Area không import Area khác (guard: `npm run guard`).

GĐ2: mô phỏng theo lát (`core/simulation`), sức khỏe/chết (`logic/mortality.ts`), giá xuất chuồng (`logic/pricing.ts`), tóm tắt vắng nhà (`logic/summary.ts`), máng có cấp (`logic/troughLevel.ts`), dọn phân (`logic/actions/cleanManure.ts`). Số liệu ở `content/farm/balance.json` và `content/shared/{time,health,valuation,quality}.json` (Admin → Số liệu).

GĐ3: Farm chơi bằng click (không có nhân vật; spec §4). Về Sảnh bằng nút "Ra Sảnh" ở HUD; `stage.ts` nối hook `onEnter/onExit` với canvas; phím I/C/menu ở `ui/hotkeys.ts`.
