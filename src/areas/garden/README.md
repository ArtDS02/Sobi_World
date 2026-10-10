# src/areas/garden — Sobi Garden (GĐ5)

Area thứ hai: trồng cây từ hạt, tưới, bón phân, thu hoạch; chế thức ăn và phân bón ở hai công trình. Decision `docs/decisions/012-garden.md`.

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest `content/garden/area.json`; mở khi Farm cấp 3, registry tự mở).
- `logic/` — thuần, có test:
  - `config/content.ts` — nạp `content/garden/*.json`, bảng cây (`CROPS`), luật ô (`PLOT_RULES`), bảng cấp.
  - `state.ts` — slice save `areas.sobi_garden` (ô đất, vòi tưới, công trình, công việc) + schema.
  - `simulate.ts` — cây lớn / chín / héo và mẻ chế biến xong theo thời gian (dạng đóng, dùng cho cả 3 chế độ).
  - `actions/` — `plants.ts` (gieo, tưới, bón, thu hoạch theo danh sách ô), `buildings.ts` (mua ô, vòi tưới, xây công trình, làm / nhận mẻ), `kit.ts` (đường ống chung: bù thời gian → hành động → KN).
  - `derived.ts`, `summary.ts` (dòng "vắng mặt"), `worldEvents.ts` (sự kiện chuẩn cho thế giới), `rewind.ts` (Admin tua thời gian), `art.ts` (id art cần có trong manifest).
- `scene/` — Phaser: `GardenScene` chỉ vẽ ruộng và báo click; `gardenView.ts` là số đo của cảnh.
- `ui/` — DOM: `gardenUi.ts` (HUD, bảng hạt, nút hàng loạt), `gardenDialogs.ts` (ô, công trình, vòi tưới, mở thêm ô), `gardenVm.ts` (dữ liệu hiển thị, thử hành động thật để biết nút tắt vì sao).
- `feedback.ts` — âm thanh + toast của sự kiện Garden, đưa cho FeedbackDirector.
- `stage.ts` — nối hook `onEnter/onExit` với cảnh.

Vòng lặp: phân heo (Farm, "Dọn phân") → Thùng ủ → phân bón → cây → Máy xay → thức ăn → heo (`feedPig` nhận `FOOD_PREMIUM`, `item_grass`).
Area không import Area khác (guard: `npm run guard`).
