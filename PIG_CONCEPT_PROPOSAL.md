# PIG CONCEPT PROPOSAL — Species mới (U00)

Trạng thái: **đề xuất, chờ duyệt.** Sau khi duyệt → `UN_IN_PIG_CATALOGUE.md` (U02). Mọi giá là TUNABLE, chốt bằng `npm run sim:economy`.

## 0. Nguồn

- `asset/animals/` **chỉ có `PIG_CATALOGUE.md`, không có ảnh động vật.** Các concept "lấy cảm hứng động vật" dưới đây dựa trên đặc điểm nhận diện phổ biến của loài, không copy thiết kế/texture/bố cục của tác phẩm nào. Nếu bạn có ảnh động vật muốn dùng, thả vào `asset/animals/` — proposal sẽ chỉnh theo.
- Style: `asset/reference/style_reference_pigs.png` (chuẩn chính — chibi, viền nâu ấm, mắt to nâu có highlight, má hồng, mõm hồng tròn, 4 chân móng nâu, đuôi xoắn), `style_reference_pigs_alt.png`, `PIG_CATALOGUE.md` §1, art standard §1–§4.
- Ảnh pig reference đã có sẵn hình ý tưởng cho: heo đen, heo đốm, heo ong (hàng 4 cột 4), heo kỳ lân, heo robot, heo tiểu quỷ đỏ.

## 1. Luật chuyển "động vật → heo"

1. **Giữ nguyên khung heo**: thân tròn, mặt heo, mõm hồng tròn 2 lỗ, tai heo, 4 chân ngắn có móng, đuôi xoắn, tỷ lệ chibi như sheet reference.
2. Chỉ mượn **2–3 đặc điểm**: hoa văn lông, bảng màu, 1 chi tiết nhỏ không phá silhouette (bờm, chỏm lông, mang, vảy bụng).
3. **Cấm**: thay mõm (vòi voi, mỏ chim), thay tai bằng tai mèo/chó nhọn, cổ dài, thân cá, bỏ đuôi xoắn.
4. Species = **thân/da/lông** (giải phẫu). Thứ mặc được (mũ, áo, áo choàng) = skin/clothing, **không** phải species.
5. Một hướng side-view nhìn phải, 512×512, nền trong, không bóng (art standard §4.1, D23).

## 2. Phân loại catalogue hiện có

| Nhóm | Mục | Kết luận |
|---|---|---|
| Species (thân khác thật) | `pig_classic`, `pig_white`, `pig_black`, `pig_brown`, `pig_spotted`, `pig_watermelon`, `pig_superhero` (thân tím), `pig_thienlong` | Species. 4 cái đầu-sau (white/black/brown/spotted) đang bán như skin → chuyển thành species (audit D3). |
| Biến thể tỷ lệ | `pig_baby`, `pig_tiny`, `pig_fat`, `pig_fluffy`, `pig_long_ear` | **Loại** khỏi species: baby/tiny trùng growth stage (heo con đã nhỏ), fat/fluffy/long_ear chỉ khác nhẹ → giữ làm ý tưởng skin. |
| Trang phục | farmer, chef, nerd, knight, wizard, cowboy, detective, ghost, christmas, tet, pilot, pirate, ninja, robot, unicorn… (§4–§13) | Giữ là **skin** (trọn thân) hiện tại; tương lai tách thành clothing. Robot/unicorn giữ là skin để không phá save người đã mua. |

## 3. Species đề xuất — 19 loại (8 có sẵn + 11 mới)

Phân bổ: COMMON 5 · UNCOMMON 5 · RARE 4 · EPIC 3 · LEGENDARY 2. Family dùng cho luật lai (audit §6).

| ID | Tên | Cảm hứng | Rarity | Family | Mô tả hình ảnh | Đặc điểm nhận diện | Bảng màu | Ghi chú lai | Giá mua | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| PIG_EARTH_PINK | Heo Hồng Đất | — | COMMON | FARM | Heo hồng cổ điển | chuẩn của cả bộ | hồng #F7B8C4, mõm #F29AAE | khởi đầu | 500 | ✅ `pig_classic` |
| PIG_WHITE | Heo Trắng | heo Yorkshire | COMMON | FARM | thân kem trắng, tai hồng nhạt | sạch, sáng nhất bộ | kem #FFF4EA, hồng nhạt | WHITE×BLACK → mutation PANDA | 600 | ✅ `pig_white` |
| PIG_BLACK | Heo Đen | heo Mường / Ỉ | COMMON | FARM | thân đen than mềm, mõm hồng xám | tương phản mắt sáng | than #3D3540, mõm #C99AA6 | BLACK×MYTHIC → GALAXY | 600 | ✅ `pig_black` |
| PIG_BROWN | Heo Nâu | heo Duroc | COMMON | FARM | nâu ấm đỏ | màu đất ấm | nâu #B9744F, kem bụng | BROWN×BOAR ↑ TIGER | 600 | ✅ `pig_brown` |
| PIG_SPOTTED | Heo Đốm | heo lang | COMMON | FARM | hồng, 3–4 mảng nâu lớn | đốm to không đối xứng | hồng + nâu #8C5A3C | — | 700 | ✅ `pig_spotted` |
| PIG_STRIPED_MELON | Heo Sọc Dưa | dưa hấu | UNCOMMON | MEADOW | xanh lá sọc dọc, mầm lá trên đầu | sọc + mầm | xanh #8FD18A / #3E8E4A | ma trận cũ | lai ra | ✅ `pig_watermelon` |
| PIG_BOAR | Heo Rừng | lợn rừng | UNCOMMON | WILD | nâu xám, dải bờm lông cứng dọc sống lưng, 2 nanh nhỏ tròn | bờm lưng + nanh mini (không nhọn) | nâu xám #7A6250, bờm #4E3B30 | BROWN×BROWN 5%; mở đường WILD | 2.000 | ⬜ |
| PIG_SHEEP | Heo Cừu | cừu / heo Mangalica lông xoăn | UNCOMMON | MEADOW | thân phủ lông xoăn kem như đám mây, mặt + chân để trần | lông cuộn tròn bồng | kem #F5EBDD, mặt hồng | WHITE×WHITE 5% | 2.500 | ⬜ |
| PIG_BEE | Heo Ong | ong mật | UNCOMMON | MEADOW | thân vàng sọc đen ngang, 2 cánh trong nhỏ, 2 râu tròn | sọc ngang + cánh mini | vàng #F6C944, đen #3B2E2A | MELON×SHEEP ↑ | lai ra | ⬜ (ý tưởng có trong sheet) |
| PIG_PENGUIN | Heo Cánh Cụt | chim cánh cụt | UNCOMMON | WATER | lưng xanh than, bụng + mặt trắng, má vàng nhạt | "áo tux" tự nhiên | navy #33415C, trắng, vàng #FFD873 | WHITE×BLACK 10% | 2.500 | ⬜ |
| PIG_SUPERMAN | Heo Siêu Nhân | — | RARE | HERO | thân tím, áo choàng đỏ | (giữ nguyên v1) | tím #8C8FE6, đỏ | ma trận cũ | lai ra | ✅ `pig_superhero` |
| PIG_TIGER | Heo Hổ | hổ | RARE | WILD | cam, sọc đen ngắn trên lưng + trán, bụng + má trắng | sọc trán + lưng, "mặt nạ" má trắng | cam #F29A4A, đen, trắng | BOAR×BROWN ↑, BOAR×BOAR | 6.000 (cấp 4) | ⬜ |
| PIG_PANDA | Heo Gấu Trúc | gấu trúc | RARE | WILD | trắng, tai + 4 chân + quầng mắt đen tròn | quầng mắt (mắt vẫn to sáng) | trắng, đen #2E2A2E | **WHITE×BLACK mutation 3%** | lai ra | ⬜ |
| PIG_AXOLOTL | Heo Kỳ Giông | kỳ giông mexico | RARE | WATER | hồng pastel, 3 cặp chùm mang xù sau tai | mang hồng đậm như san hô | hồng #FFC4D6, mang #F07AA0 | PENGUIN×PINK ↑ | 7.000 (cấp 5) | ⬜ |
| PIG_KOI | Heo Cá Chép | cá chép koi / "cá chép hoá rồng" | EPIC | WATER | trắng, mảng đỏ cam như koi, tai dạng vây mềm, vảy nhẹ ở lưng | mảng koi + vây tai | trắng, đỏ #E8573E, vàng | AXOLOTL×WHITE ↑; KOI×DRAGON → MYTHICAL | lai ra | ⬜ |
| PIG_DRAGON | Heo Rồng Con | rồng (thần thoại) | EPIC | MYTHIC | xanh ngọc, vảy bụng kem, 2 sừng nụ tròn, cánh dơi nhỏ | sừng nụ + cánh mini + gai lưng tròn | ngọc #5FC2A0, bụng #F3E3B5 | TIGER×SUPERMAN ↑ | lai ra | ⬜ (gần `pig_dragon` alt ref, nhưng là thân, không phải đồ ngủ) |
| PIG_GALAXY | Heo Ngân Hà | bầu trời đêm | EPIC | MYTHIC | xanh tím đêm, đốm sao nhỏ phát sáng, đuôi xoắn đầu lấp lánh | sao trên thân | tím đêm #3B3A78, sao #FFF3B0 | BLACK×MYTHIC / BLACK×DRAGON | lai ra | ⬜ |
| PIG_MYTHICAL | Heo Thần Thoại | — | LEGENDARY | MYTHIC | vàng, cánh thiên thần, vương miện | (giữ nguyên v1, không lai được) | vàng #F7D774 | ma trận cũ | lai ra | ✅ `pig_thienlong` |
| PIG_PHOENIX | Heo Phượng Hoàng | phượng hoàng | LEGENDARY | MYTHIC | đỏ cam chuyển vàng, lông vũ ở tai + chỏm đầu + đuôi, viền ánh lửa nhẹ | lông lửa + chuyển màu | đỏ #E8573E → vàng #FFC94A | DRAGON×GALAXY 1%; không lai tiếp (như MYTHICAL) | lai ra | ⬜ |

✅ = có art production trong `public/assets/pigs/base/` · ⬜ = chưa có (game chạy bằng placeholder tới U07).

## 4. Đã lọc bỏ

| Concept | Lý do |
|---|---|
| Bò sữa | trùng PIG_SPOTTED / PANDA (đốm trắng-đen) |
| Bọ rùa | trùng PIG_SPOTTED (đốm), khó nhận diện ở cỡ nhỏ |
| Ếch | trùng màu PIG_STRIPED_MELON |
| Ngựa vằn | trùng sọc PIG_TIGER |
| Voi | vòi thay mõm → không còn là heo |
| Hươu cao cổ | phá tỷ lệ (cổ dài) |
| Mèo / chó / cáo | tai nhọn đổi silhouette đầu heo; cáo cần đuôi bông thay đuôi xoắn |
| Cú / chim | mỏ + cánh lớn thay thân |
| Cá (thân cá) | mất chân → giữ ý cá qua KOI (hoa văn), không đổi thân |
| Heo baby/tiny/fat/fluffy/long_ear | chỉ khác tỷ lệ — trùng growth stage hoặc quá giống heo hồng |
| Tiểu quỷ đỏ (sheet ref) | sừng + cánh dơi trùng DRAGON; giữ làm ý tưởng skin Halloween |

## 5. Kinh tế (định hướng, chờ sim)

| Rarity | Hệ số giá mua | Giá bán (×base 1200) | growthSec | Mua trong shop | Trọng số đóng góp quà |
|---|---|---|---|---|---|
| COMMON | ×1 (500–700) | ×1 | 2h | có | 1 |
| UNCOMMON | ×4 (≈2.000–2.500) | ×2.5 | 4h | một số, theo cấp | 2 |
| RARE | ×12 (≈6.000–7.000) | ×10 | 8h | một số, cấp ≥ 4 | 4 |
| EPIC | — | ×25 | 16h | không (chỉ lai) | 7 |
| LEGENDARY | — | ×42 (≈50.000) | 24h | không, không lai tiếp | 12 |

4 breed v1 giữ đúng số spec (pink 500/1200, melon 3000, superman 12000, mythical 50000) — bảng trên được chọn để khớp các mốc đó.

## 6. Cần bạn duyệt

1. Danh sách 19 species (thêm/bớt/đổi tên).
2. Các mutation đặc biệt (WHITE×BLACK → PANDA, BLACK×MYTHIC → GALAXY, KOI×DRAGON → MYTHICAL…).
3. Có muốn cung cấp ảnh động vật thật vào `asset/animals/` không, hay dùng proposal này.
