# src/areas/farm — Sobi Farm (Area đầu tiên)

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest ở `content/farm/area.json`).
- `logic/` — luật và hành động của nông trại (thuần, có test): mô phỏng `advanceWorld`, lai giống, máng, đơn hàng, quà, 21 action.
- `scene/` — Phaser: cảnh nông trại, prefab, FX, phản hồi (FeedbackDirector).
- `ui/` — màn hình DOM và view-model của Farm.
- `store.ts` — gắn Farm vào game store.

Area không import Area khác (guard: `npm run guard`).
