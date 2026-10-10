# 016 — Sobi Cloud: hoa, Nước tinh khiết, potion (GĐ9)

**Ngày:** 2026-10-11 · **Trạng thái:** Đã làm, số liệu chờ chủ dự án chơi thử

## Bối cảnh
GĐ9 (spec V2 §8.4, §13; GAME_BALANCE §9) thêm Area thứ tư qua Cây cao chọc trời ở Sảnh. Hoa dùng `systems/plants`; potion nối Farm/Aquarium/Adventure **qua vật phẩm**, không import Area.
Điều kiện mở giữ như manifest đã có: Sobi World cấp 8 + Phát triển thế giới ≥ 15 (decision 007; GAME_BALANCE §7 cũ ghi Garden Lv6, Aquarium Lv3).

## Lựa chọn
- **Hoa** (6, `content/cloud/flowers.json`): thường (Cúc Mây 4 giờ, Bồ Công Anh Mây 5 giờ), hiếm (Hồng Cầu Vồng 10 giờ ×2, Lan Sao 12 giờ ×1), đêm (Huệ Trăng 8 giờ, Chuông Mộng 10 giờ). Hoa đêm hái lúc `night` (20h–5h) được ×2 (`nightYieldFactor`): quy tắc lúc hái, nên mô phỏng không đổi. Hoa là vật phẩm loại `FLOWER`, hạt loại `SEED`; hạt thiếu thì mua phần thiếu như Garden.
- **Nước tinh khiết** (`item_pure_water`): nguồn là **Suối mây** (3 cấp: 20 / 12 / 8 phút một giọt, chứa 6 / 10 / 16; cấp 3 cần 3 ngọc trai của Aquarium). Dạng đóng: chỉ lưu `since`; đầy thì ngừng. Hoa chưa tưới lớn bằng ¼ tốc độ (`dryGrowthRate` 0,25), tưới 1 nước / ô kéo dài 4 giờ. Nước là thứ khan hiếm có chủ ý: vừa tưới vừa là nguyên liệu mọi potion.
- **Potion** nấu ở **Vạc nấu** (xây 600 Sobi Coin) bằng hệ production chung (recipe `building: cauldron` trong `content/shared/recipes.json`, Admin sửa được): Healing Potion (Hồng Cầu Vồng + Nước, 20 phút; chữa bệnh kể cả nguy kịch, tâm trạng +20 trong 6 giờ), Potion Vui Vẻ (2 Cúc Mây + 1 Bồ Công Anh + Nước, hoặc 1 Huệ Trăng + Nước; tâm trạng +40 trong 12 giờ), Potion Chiến Đấu (Lan Sao + Chuông Mộng + Nước; chỉ là vật phẩm cho GĐ10). Tâm trạng dùng đúng cơ chế `withMoodBoost` có sẵn (hiệu ứng theo giờ, không đổi nhu cầu).
- **Dùng potion**: `usePotion` (heo) và `useFishPotion` (cá) là hành động mới, sự kiện `PIG_POTION_USED` / `AQUARIUM_FISH_POTION`. Healing chỉ dùng cho con đang bệnh; Vui Vẻ không dùng khi tác dụng yếu hơn cái đang chạy.
- **Hoa tăng đột biến**: trường `mutationBoost` của item (Hồng Cầu Vồng +5, Lan Sao +8, Huệ Trăng +3, Chuông Mộng +4 điểm %); `breedPigs` / `breedFish` nhận `boostItem`, trừ 1 hoa và đưa vào `rollChildTraits(mutationBoost)` (đã có từ GĐ7). Hộp thoại phối giống có hàng chọn hoa (`ui/components/boostPicker`).
- **Công dụng mỗi hoa ≥ 2** (có test): bán, nguyên liệu potion, tăng đột biến (hoa hiếm/đêm), đơn hàng, Codex (`discovery.flower`).
- **Liên kết thế giới**: sự kiện chuẩn mới `flower.harvested`, `potion.brewed` (thống kê `flowersHarvested`, `potionsBrewed`), Codex loại `flower`, 5 thành tựu, 2 mục tiêu ngày, 10 dòng đơn hàng, NPC `npc_alchemist` (Bác Cú Giả Kim, 5 chủ đề).
- **Save**: slice `areas.sobi_cloud` v1, không đổi world save. Admin: Số liệu sửa hoa, cân bằng, vật phẩm (potion/hoa), recipe; tua thời gian dịch cả Cloud.

## Cân bằng (`npm run sim:week -- 7 40`)
Bot mở Cloud ở ngày ~27 (cấp 8 sớm hơn, nhưng Phát triển thế giới ≥ 15 chậm hơn: Codex + công trình cấp 3). Trong ~13 ngày: hái ~340 hoa, nấu 14 potion, bán hoa ~6.000 Sobi Coin, chi hạt ~4.200 và xây ~15.200: Cloud là **tiện ích**, không phải nguồn tiền (đúng ý: potion cứu heo và hoa lai giống). Nước khan: bot phải chọn giữa tưới và nấu. Cần chủ dự án chơi thử: điều kiện mở (day 27 có quá muộn?), tốc độ suối, giá Healing Potion so với thuốc 100 Sobi Coin.

## Để sau
Potion Chiến Đấu dùng ở GĐ10; art placeholder (`docs/ASSET_TODO.md`); thời tiết cầu vồng tăng đột biến chưa làm.
