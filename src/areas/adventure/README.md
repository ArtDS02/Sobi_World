# src/areas/adventure — Sobi Adventure (GĐ10)

Area thứ năm: đưa tối đa 3 heo / cá (đã lớn, chọn mục đích Phiêu lưu) đi qua một vùng gồm chuỗi điểm dừng (trận đánh, rương, sự kiện nhỏ) và trùm cuối; đánh theo lượt. Thua không ai chết: cả đội kiệt sức 4 giờ thật. Decision `docs/decisions/018-adventure.md`.

- `index.ts` — module Area đăng ký với `core/area-registry` (manifest `content/adventure/area.json`; mở khi Sobi World cấp 8 và Phát triển thế giới ≥ 20).
- `logic/` — thuần, có test (`tests/unit/adventure.test.ts`, `adventureUi.test.ts`):
  - `config/content.ts` — nạp `content/adventure/*.json`: kỹ năng, kiểu đánh (archetype), kẻ địch, vùng, bảng loot, sự kiện, trang bị, cân bằng; `archetypeOf(entry)` cho biết một sinh vật đánh theo kiểu nào.
  - `state.ts` — slice `areas.sobi_adventure`: chiến binh (cấp, KN, trang bị, năng lượng phiêu lưu, kiệt sức), chuyến đang đi (cả trận đang đánh), loot chờ vào túi.
  - `fighters.ts` — chỉ số theo cấp / độ hiếm / Bond / trang bị, kỹ năng mở ở cấp 1, 1, 10, 20, ai được đi.
  - `encounter.ts` — bốc nhóm kẻ địch, bốc loot, lượt của kẻ địch.
  - `actions/` — `run.ts` (xuất phát, bước vào điểm dừng, ra đòn / Tự động, rút lui, đóng chuyến), `camp.ts` (heo khởi đầu, mặc / tháo trang bị, nhận loot), `kit.ts`.
  - `battleSim.ts` — mô phỏng cả chuyến N lần (Admin).
  - `summary.ts`, `suggest.ts`, `worldEvents.ts` (`battle.won`, `adventure.finished`), `rewind.ts`, `art.ts`.
- `scene/` — Phaser: `AdventureScene` chỉ vẽ nền; mọi thao tác ở lớp DOM.
- `ui/` — DOM: `adventureUi.ts` (bộ điều khiển, HUD, Tự động), `adventureViews.ts` (sảnh, bản đồ, tổng kết), `battleView.ts` (trận đánh), `adventureDialogs.ts` (trang bị), view-model thuần `adventureVm.ts`, `battleVm.ts`, `vmKit.ts`.
- `feedback.ts`, `stage.ts` — như các Area khác.

Chiến binh là sinh vật của Area khác: Adventure thấy chúng qua `AreaModule.roster` của registry và nhận heo khởi đầu qua `AreaModule.receiveGift`; nó không import Farm hay Aquarium (guard: `npm run guard`). `systems/combat` và `systems/equipment` là phần luật dùng chung.
