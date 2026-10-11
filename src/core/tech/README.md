# src/core/tech — công nghệ (GĐ11)

Nâng cấp mua bằng Sobi Coin và vật liệu của Sobi Adventure (`content/shared/tech.json`, schema `content/schemas/shared/tech.ts`, decision `docs/decisions/019-adventure-links.md`). Hiện ở **Menu → Công nghệ** (`ui/goals/techPanel.ts`, số liệu `techVm.ts`).

- `tech.ts` — thuần: `techLevel`, `techValue` (hiệu quả hiện có theo loại), `nextTechLevel`, `buyTech` (trừ tiền qua `changeCurrency` và vật liệu khỏi túi, tất cả hoặc không), `recipeLocked` (công thức cần công nghệ).
- Cấp công nghệ nằm trong `progression.stats["tech.<id>"]` của world save: không cần migration, save cũ đọc được.
- Bốn hiệu quả: `productionSpeed` và `maxBatches` (máy xay, thùng ủ, vạc nấu: Garden và Cloud), `prepSlots` (khẩu phần mang vào chuyến) và `adventureEnergy` (hồi năng lượng phiêu lưu: Adventure). Nơi dùng đọc qua `core/config/tech.ts` (`techBonus`).
- Tốc độ sản xuất được ghi vào job lúc bắt đầu (`ProductionJob.durationMs`), nên mua thêm cấp không làm lệch mẻ đang chạy.
- Sự kiện `TECH_UPGRADED` (đọc thành `tech.upgraded`, `currency.changed`, `item.removed`).
