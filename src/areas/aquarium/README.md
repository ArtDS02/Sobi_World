# src/areas/aquarium — Sobi Aquarium (GĐ8)

Area thứ ba: nuôi cá trong bể (cho ăn, giữ nước trong, chữa bệnh, vuốt ve), câu cá ở bến (mini-game căn phao), bán cá, thu vảy, nâng cấp bể, cho cá đẻ. Decision `docs/decisions/015-aquarium.md`.

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest `content/aquarium/area.json`; mở khi Sobi World cấp 6, registry tự mở; tặng 1 cá vàng nửa lớn và 6 thức ăn cá).
- `logic/` — thuần, có test (`tests/unit/aquarium.test.ts`):
  - `config/content.ts` — nạp `content/aquarium/*.json`, bảng loài (`FISH`), cấp bể (`TANK_LEVELS`), `AB` (cân bằng).
  - `state.ts` — slice save `areas.sobi_aquarium` (bể, cá, trứng, cần câu, tưởng niệm) + schema; `Fish` là `Creature` của `systems/creature`.
  - `fishLife.ts` — một con cá theo thời gian = `advanceCreature` với bộ số của bể (đói 5/giờ, không ngủ, vảy thay cho phân), tính trạng, giai đoạn, sức khỏe.
  - `simulate.ts` — nước đục dần, cá lớn / đói / bệnh / chết (như heo), vảy rụng, trứng nở; dạng đóng, cắt đúng lúc trứng nở, dùng cho cả 3 chế độ.
  - `fishing.ts` — một lần quăng cần: điểm mini-game → bảng bốc theo độ hiếm, ban đêm, trai ngọc.
  - `pricing.ts` — giá cá nuôi lớn: giá loài × cỡ × chất lượng × sức khỏe × tính trạng.
  - `actions/` — `care.ts` (cho ăn, thay nước, vuốt ve, chữa, mục đích, đổi tên), `fishing.ts` (quăng cần, thả cá vào bể), `trade.ts` (bán cá, bán cá trong túi, thu vảy, nâng bể), `breed.ts` (cho đẻ), `kit.ts` (đường ống chung: bù thời gian → hành động → KN).
  - `derived.ts`, `suggest.ts` ("việc tiếp theo"), `summary.ts` (dòng "vắng mặt"), `worldEvents.ts` (sự kiện chuẩn cho thế giới), `rewind.ts` (Admin tua thời gian), `art.ts` (id art cần có trong manifest).
- `scene/` — Phaser: `AquariumScene` chỉ vẽ bể, cá bơi, bến câu và báo click; `aquariumView.ts` là số đo của cảnh.
- `ui/` — DOM: `aquariumUi.ts` (HUD, thanh nút), `dialogKit.ts` (nút nói lý do, hộp thoại "sống"), `fishDialogs.ts`, `fishingDialog.ts`, `tankDialogs.ts`; dữ liệu hiển thị là view-model thuần (`aquariumVm.ts`, `fishCardVm.ts`, `dockVm.ts`, `vmKit.ts`), thử chạy hành động thật để biết nút tắt vì sao.
- `feedback.ts` — âm thanh + toast của sự kiện Aquarium, đưa cho FeedbackDirector.
- `stage.ts` — nối hook `onEnter/onExit` với cảnh.

Vòng lặp: khoai tây (Garden) → Máy xay → thức ăn cá → cá → vảy + ngọc trai (câu) → nâng bể và Vòi tưới (Garden); cá nuôi lớn → bán; cá câu được → Codex, đơn hàng.
Area không import Area khác (guard: `npm run guard`).
