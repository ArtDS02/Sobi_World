# UN IN — PIG SPECIES CATALOGUE

Danh mục **species** (loài heo) của game — nguồn: `PIG_CONCEPT_PROPOSAL.md` (duyệt 2026-10-02, U00-1).
Số liệu thật nằm ở `src/core/config/breeds.ts` (bảng này chỉ để đọc; lệch thì code thắng). Art: một hướng
side-view nhìn phải + flip (D23), 512×512, theo `asset/reference/style_reference_pigs.png`.

- **Species** = thân/da/lông → quyết định giá, thời gian lớn, lai, sưu tập. Đổi species = đổi con heo.
- **Skin** = ảnh trang phục trọn thân vẽ trên thân hồng → chỉ mặc cho `PIG_EARTH_PINK` (D6), không đổi số nào.
- **Clothing** = lớp đồ (mũ/áo/phụ kiện) — mới có data foundation (`config/clothing.ts`), chưa dùng (D1).
- **Thêm species**: 1 dòng `BREEDS` (+ id trong `ids.ts`) + 1 dòng manifest `pigs[]` (status `placeholder`) →
  `npm run assets:placeholders`. Chỉ số lấy theo `RARITY_TIER`, dòng species chỉ ghi phần khác.

## Rarity

| Rarity | Key skin | Giá bán | Lớn | Lai | Trong shop |
|---|---|---|---|---|---|
| COMMON | P1 | 1.200 | 2h | có | có (500) |
| UNCOMMON | P2 | 3.000 | 4h | có | một số, theo cấp |
| RARE | P3 | 12.000 | 8h | có | một số, theo cấp |
| EPIC | P4 | 24.000 | 16h | có | không |
| LEGENDARY | P5 | 50.000 | 24h | **không** | không |

## Species

| Pig ID | Tên | Cảm hứng | Rarity | Family | Mô tả | Đặc điểm nhận diện | Bảng màu | Ghi chú lai (U03) | Giá shop | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| PIG_EARTH_PINK | Heo Hồng Đất | — | COMMON | FARM | heo hồng cổ điển, chuẩn của cả bộ | — | hồng #F7B8C4 | khởi đầu | 500 · cấp 1 | ✅ production `pig_classic` |
| PIG_WHITE | Heo Trắng | heo Yorkshire | COMMON | FARM | thân kem trắng, tai hồng nhạt | sáng nhất bộ | kem #FFF4EA | WHITE×BLACK → PANDA (mutation) | 500 · cấp 1 | ✅ production `pig_white` |
| PIG_BLACK | Heo Đen | heo Mường / Ỉ | COMMON | FARM | đen than mềm, mõm hồng xám | mắt sáng trên nền tối | than #3D3540 | BLACK×MYTHIC → GALAXY | 500 · cấp 1 | ✅ production `pig_black` |
| PIG_BROWN | Heo Nâu | heo Duroc | COMMON | FARM | nâu đỏ ấm, bụng kem | màu đất | nâu #B9744F | BROWN×BOAR ↑ TIGER | 500 · cấp 2 | ✅ production `pig_brown` |
| PIG_SPOTTED | Heo Đốm | heo lang | COMMON | FARM | hồng, 3–4 mảng nâu lớn | đốm to không đối xứng | hồng + nâu #8C5A3C | — | 500 · cấp 3 | ✅ production `pig_spotted` |
| PIG_STRIPED_MELON | Heo Sọc Dưa | dưa hấu | UNCOMMON | MEADOW | xanh sọc dọc, mầm lá trên đầu | sọc + mầm | #8FD18A / #3E8E4A | từ FARM | lai ra | ✅ production `pig_watermelon` |
| PIG_BOAR | Heo Rừng | lợn rừng | UNCOMMON | WILD | nâu xám, bờm lông dọc sống lưng, 2 nanh mini tròn | bờm + nanh (không nhọn) | #7A6250, bờm #4E3B30 | mở đường WILD | 1.500 · cấp 3 | ⬜ placeholder `pig_boar` |
| PIG_SHEEP | Heo Cừu | cừu / heo Mangalica | UNCOMMON | MEADOW | thân phủ lông xoăn kem, mặt + chân trần | lông cuộn bồng | #F5EBDD | WHITE×WHITE | 1.500 · cấp 4 | ⬜ placeholder `pig_sheep` |
| PIG_BEE | Heo Ong | ong mật | UNCOMMON | MEADOW | vàng sọc đen ngang, cánh trong nhỏ, 2 râu tròn | sọc ngang + cánh mini | #F6C944 / #3B2E2A | MELON×SHEEP | lai ra | ⬜ placeholder `pig_bee` |
| PIG_PENGUIN | Heo Cánh Cụt | chim cánh cụt | UNCOMMON | WATER | lưng navy, bụng + mặt trắng, má vàng nhạt | "áo tux" tự nhiên | #33415C, trắng, #FFD873 | WHITE×BLACK | 1.800 · cấp 5 | ⬜ placeholder `pig_penguin` |
| PIG_SUPERMAN | Heo Siêu Nhân | — | RARE | HERO | thân tím, áo choàng đỏ (v1) | áo choàng | #8C8FE6, đỏ | từ MELON | lai ra | ✅ production `pig_superhero` |
| PIG_TIGER | Heo Hổ | hổ | RARE | WILD | cam, sọc đen ngắn trên trán + lưng, bụng + má trắng | sọc trán, má trắng | #F29A4A, đen, trắng | BOAR×BROWN, BOAR×BOAR | 7.000 · cấp 6 | ⬜ placeholder `pig_tiger` |
| PIG_PANDA | Heo Gấu Trúc | gấu trúc | RARE | WILD | trắng; tai, 4 chân, quầng mắt đen tròn | quầng mắt (mắt vẫn to sáng) | trắng, #2E2A2E | **WHITE×BLACK mutation** | lai ra | ⬜ placeholder `pig_panda` |
| PIG_AXOLOTL | Heo Kỳ Giông | kỳ giông | RARE | WATER | hồng pastel, 3 cặp chùm mang xù sau tai | mang như san hô | #FFC4D6, mang #F07AA0 | PENGUIN×PINK | 7.000 · cấp 7 | ⬜ placeholder `pig_axolotl` |
| PIG_KOI | Heo Cá Chép | koi / cá chép hoá rồng | EPIC | WATER | trắng, mảng đỏ cam kiểu koi, tai dạng vây mềm | mảng koi + vây tai | trắng, #E8573E, vàng | AXOLOTL×WHITE; KOI×DRAGONLING → MYTHICAL | lai ra | ⬜ placeholder `pig_koi` |
| PIG_DRAGONLING | Heo Rồng Con | rồng | EPIC | MYTHIC | xanh ngọc, vảy bụng kem, sừng nụ tròn, cánh dơi nhỏ | sừng nụ + cánh mini + gai lưng tròn | #5FC2A0, bụng #F3E3B5 | TIGER×SUPERMAN | lai ra | ⬜ placeholder `pig_dragonling` |
| PIG_GALAXY | Heo Ngân Hà | bầu trời đêm | EPIC | MYTHIC | tím đêm, đốm sao nhỏ phát sáng | sao trên thân, đuôi lấp lánh | #3B3A78, sao #FFF3B0 | BLACK×DRAGONLING | lai ra | ⬜ placeholder `pig_galaxy` |
| PIG_MYTHICAL | Heo Thần Thoại | — | LEGENDARY | MYTHIC | vàng, cánh thiên thần, vương miện (v1) | cánh + vương miện | #F7D774 | không lai tiếp | lai ra | ✅ production `pig_thienlong` |
| PIG_PHOENIX | Heo Phượng Hoàng | phượng hoàng | LEGENDARY | MYTHIC | đỏ cam → vàng, lông vũ ở tai, chỏm đầu, đuôi | lông lửa chuyển màu | #E8573E → #FFC94A | DRAGONLING×GALAXY; không lai tiếp | lai ra | ⬜ placeholder `pig_phoenix` |

Luật vẽ khi chuyển art (U07, skill `image-to-asset`): giữ thân/mặt/mõm/tai/móng/đuôi xoắn của heo; chỉ mượn
2–3 đặc điểm của con vật; không thay mõm, không tai nhọn, không cổ dài, không thân cá (`PIG_CONCEPT_PROPOSAL.md` §1).
