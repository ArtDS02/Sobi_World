# src/areas/cloud — Sobi Cloud (GĐ9)

Area thứ tư: vườn hoa phép trên mây. Gieo hoa, tưới bằng Nước tinh khiết từ suối mây, hái hoa (hoa đêm hái lúc tối được gấp đôi), nấu potion ở Vạc nấu. Decision `docs/decisions/016-cloud.md`.

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest `content/cloud/area.json`; mở khi Sobi World cấp 8 và Phát triển thế giới ≥ 15; tặng 6 Nước tinh khiết).
- `logic/` — thuần, có test (`tests/unit/cloud.test.ts`):
  - `config/content.ts` — nạp `content/cloud/*.json`: hoa (`FLOWERS`), `CB` (cân bằng), các cấp suối.
  - `state.ts` — slice `areas.sobi_cloud`: ô hoa (dùng `systems/plants`), suối (cấp + mốc bắt đầu đầy), vạc (đã xây + mẻ đang nấu).
  - `simulate.ts` — hoa lớn / nở / héo, mẻ potion xong; dạng đóng, giống nhau cho mọi chế độ. Suối đọc thẳng từ `since` (không cần bước).
  - `actions/` — `plants.ts` (gieo, tưới 1 Nước tinh khiết / ô, bón phân, hái), `buildings.ts` (mở ô, hứng nước, nâng suối, xây vạc, nấu, nhận), `kit.ts`.
  - `derived.ts`, `suggest.ts`, `summary.ts`, `worldEvents.ts` (`flower.harvested`, `potion.brewed`), `rewind.ts`, `art.ts`.
- `scene/` — Phaser: `CloudScene` vẽ ô hoa trên mây, suối, vạc, ban đêm; `cloudView.ts` là số đo.
- `ui/` — DOM: `cloudUi.ts` (HUD, bảng hạt, nút chung), `cloudDialogs.ts` (ô hoa, suối, vạc), `cloudVm.ts` (view-model thuần, thử chạy hành động thật để nút nói lý do).
- `feedback.ts`, `stage.ts` — như các Area khác.

Nối với Area khác chỉ qua vật phẩm (`content/shared/items.json`): Healing Potion / Potion Vui Vẻ (`curesSickness`, `moodBoost`, `moodHours`) dùng cho heo (`farm/actions/usePotion`) và cá (`aquarium/actions/care useFishPotion`); hoa hiếm (`mutationBoost`) thêm vào lúc phối giống (`breedPigs`, `breedFish` nhận `boostItem`). Potion Chiến Đấu chờ GĐ10.
