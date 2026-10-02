# PROJECT ASSET AUDIT — Master prompt "Pig species + asset" (A-phase)

2026-10-02 · base `start/unimo-v1` @ 3ec67ce (tag u08) · `npm run check` xanh (480 test) trước khi sửa.
Task: A1 audit → A2 gỡ Bộ đồ → A3 species → A4 building → A5 tích hợp → A6 test/polish.

## 1. Current State

| Vùng | Hiện trạng | File chính |
|---|---|---|
| Kiến trúc | Electron + Vite + Phaser (farm) + DOM/SCSS (menu). `src/core` thuần, `now`/`rng` inject, 1 `setInterval`. Save = file qua `SaveStorage` port, zod schema v4 + migrate tuần tự. | `src/core/**`, `electron/`, `src/platform/` |
| Pig / species | 19 species (`BreedId`), rarity COMMON→LEGENDARY, family, giá suy từ rarity. Ảnh species = `defaultSkin` trong manifest `pigs[]`. | `core/config/breeds.ts`, `rarity.ts` |
| Breeding | Luật data-driven (cùng loài 60 / cùng family 25 / bậc +1 9 / bậc +2 1 + 15 mutation). | `core/config/breedingRules.ts`, `engine/breeding.ts` |
| Shop | Tab Heo (theo rarity) / Vật phẩm / Chuồng / **Bộ đồ**. | `ui/screens/shopScreen.ts` |
| Farm | 1 cảnh Phaser, layout + placements trong manifest, nhãn công trình, bảng tên heo, hộp quà, 24 slot. | `game/scenes/MainFarmScene.ts` |
| Building/props | 5 building + 6 prop, **vẽ bằng code** (`scripts/art/world.ts`): nét mảnh, phẳng, ít khối. | `public/assets/buildings/`, `props/` |
| Asset pipeline | id → `assets.json` (manifest v2, zod) → registry; `art:cut` cắt từ sheet reference; `coats.ts` vẽ hoa văn lông; `assets:check`. | `scripts/cut-reference.ts`, `scripts/assets/*` |

## 2. Problems

1. **Hệ "Bộ đồ" (skin trang phục) vẫn hiện trong game**: tab shop "Bộ đồ", nút "Thay đồ" ở thẻ heo, sổ sưu tập có mục bộ đồ, 16 skin trang phục (farmer, chef, nerd, knight, wizard, cowboy, detective, ghost, christmas, tet, pilot, pirate, ninja, robot, unicorn) + action `buySkin`/`equipSkin`, field save `ownedSkins`, `discoveredSkins`, `Pig.skinId`, `Pig.cosmetics`, `config/clothing.ts`, manifest `cosmetics[]`. Master prompt: bỏ hoàn toàn (thay quyết định U00-1 D1).
2. **3 species chưa có art** (`pig_sheep`, `pig_axolotl`, `pig_phoenix` — placeholder).
3. **Species "chỉ đổi màu"**: tiger/panda/penguin/koi/galaxy/boar là hoa văn trên heo hồng; nhận diện bằng hoa văn, silhouette giống heo gốc.
4. **Building lệch style với heo**: heo cắt từ sheet vẽ tay (viền nâu dày, khối mềm); building vẽ code (viền mảnh, phẳng). `asset/building/style_reference_building.png` (mới, chưa commit) có đủ bộ building/prop cùng style heo.
5. `asset/animals/` **không có ảnh động vật** (chỉ `PIG_CATALOGUE.md`) → concept dựa trên đặc điểm nhận diện phổ biến của loài.

## 3. Legacy Systems

| Hệ | Xử lý |
|---|---|
| Skin trang phục + wardrobe + clothing foundation | Gỡ (A2). Save v5: hoàn vàng đúng giá đã mua cho mỗi bộ đồ đang sở hữu (transaction `SKIN_REFUND`), heo hiển thị theo species. |
| `SKIN_PURCHASE` / `SKIN_REFUND` trong lịch sử giao dịch | Giữ enum để save cũ đọc được lịch sử (chỉ là nhật ký). |
| `ui_icon_skin` | Gỡ khỏi manifest (không còn chỗ dùng). |

## 4. Assets Available

- Heo: 16 species production + 3 placeholder; 15 PNG trang phục (sẽ xoá).
- `asset/reference/style_reference_pigs*.png`, `style_reference_environment.png` (chuẩn style heo).
- `asset/building/style_reference_building.png` (1536×673, nền trong suốt): pig house, máng ăn, giếng bơm, cối xay gió, lán rơm, vũng bùn, bao cám, thùng táo, chậu nước, hàng rào, luống rau, bụi hoa, đá, biển chỉ đường, thùng gỗ, xe cút kít, kiện rơm, hoa hướng dương, nấm.

## 5. Assets Missing

- Art 3 species placeholder + species mới (A3).
- Building/prop theo style reference mới (A4); decor (cối xay, kiện rơm, thùng gỗ, bụi hoa, đá, hướng dương, nấm, xe cút kít, thùng táo, luống rau) chưa có trên farm.
- Shop stall và bảng đơn hàng không có trong sheet → giữ bản code, chỉnh lại nếu lệch quá.

## 6. Recommended Changes

1. A2 — save v5 + migrate v4→v5 (hoàn tiền, xoá field skin/cosmetic); gỡ action/UI/i18n/event/error/manifest skin trang phục; pigTexture theo species.
2. A3 — vẽ đặc điểm hình khối (lông xoăn, mang, lông vũ, sừng, gạc, gai, mai, bờm) bằng SVG chồng lên heo gốc cùng nét viền; thêm species có silhouette riêng; catalogue + breeding rules.
3. A4 — `art:cut` mở rộng cho sheet building; thay 5 building + props; thêm decor (placement không `action`, không đè walkArea).
4. A5/A6 — test migrate v4→v5, shop/breeding với species mới, manifest không id trùng/thiếu; build + e2e.
