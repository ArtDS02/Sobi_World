# UN IN — PIG SPECIES CATALOGUE

Danh mục **species** (loài heo) của game. Concept chi tiết: `PIG_CONCEPT_PROPOSAL.md`. Số liệu thật ở
`src/core/config/breeds.ts`, luật lai ở `src/core/config/breedingRules.ts` (bảng này chỉ để đọc; lệch thì code thắng).
Art: một hướng side-view nhìn phải + flip (D23), 512×512, theo `asset/reference/style_reference_pigs.png`.

- **Species** = thân/da/lông → quyết định giá, thời gian lớn, lai, sưu tập. Hình của heo = `BREEDS[breed].artId`.
- **Không có bộ đồ / clothing / phụ kiện** (DECISIONS A2-1).
- **Thêm species**: 1 dòng `BREEDS` (+ id trong `ids.ts`) + 1 dòng manifest `pigs[]` (status `placeholder`) →
  `npm run assets:placeholders`. Chỉ số theo `RARITY_TIER`; tuỳ chọn 1 mutation trong `breedingRules.ts`.

## Rarity

| Rarity | Giá bán | Lớn | Lai | Trong shop |
|---|---|---|---|---|
| COMMON | 1.200 | 2h | có | có (500) |
| UNCOMMON | 3.000 | 4h | có | một số, theo cấp |
| RARE | 12.000 | 8h | có | một số, theo cấp |
| EPIC | 24.000 | 16h | có | không |
| LEGENDARY | 50.000 | 24h | **không** | không |

## Species (27)

| Pig ID | Tên | Rarity | Family | Nhận diện | Mutation chính | Shop | Art |
|---|---|---|---|---|---|---|---|
| PIG_EARTH_PINK | Heo Hồng Đất | COMMON | FARM | heo hồng chuẩn | — | 500 · cấp 1 | R `pig_classic` |
| PIG_WHITE | Heo Trắng | COMMON | FARM | thân kem trắng | WHITE×BLACK → PANDA/PENGUIN | 500 · cấp 1 | R+tint `pig_white` |
| PIG_BLACK | Heo Đen | COMMON | FARM | đen than, mắt sáng | BLACK×BOAR → BUFFALO | 500 · cấp 1 | R `pig_black` |
| PIG_BROWN | Heo Nâu | COMMON | FARM | nâu đỏ ấm | BROWN×BOAR → TIGER | 500 · cấp 2 | R+tint `pig_brown` |
| PIG_SPOTTED | Heo Đốm | COMMON | FARM | mảng nâu lớn | SPOTTED×BROWN → DEER | 500 · cấp 3 | R `pig_spotted` |
| PIG_STRIPED_MELON | Heo Sọc Dưa | UNCOMMON | MEADOW | sọc dưa + mầm lá | PINK×PINK | lai | R `pig_watermelon` |
| PIG_BOAR | Heo Rừng | UNCOMMON | WILD | bờm sống lưng | BROWN×BROWN | 1.500 · cấp 3 | R+coat `pig_boar` |
| PIG_SHEEP | Heo Cừu | UNCOMMON | MEADOW | mây lông xoăn trên thân + chỏm đầu | WHITE×WHITE | 1.500 · cấp 4 | R+trait `pig_sheep` |
| PIG_BEE | Heo Ong | UNCOMMON | MEADOW | sọc vàng-đen, cánh, râu | MELON×SHEEP | lai | R `pig_bee` |
| PIG_PENGUIN | Heo Cánh Cụt | UNCOMMON | WATER | lưng navy, bụng trắng | WHITE×BLACK | 1.800 · cấp 5 | R+coat `pig_penguin` |
| PIG_BUFFALO | Heo Trâu | UNCOMMON | FARM | da xám đá, cặp sừng lưỡi liềm | BLACK×BOAR | 1.500 · cấp 4 | R+coat+trait `pig_buffalo` |
| PIG_DEER | Heo Hươu Sao | UNCOMMON | MEADOW | lông vàng nâu đốm trắng, gạc nhỏ | SPOTTED×BROWN | lai | R+coat+trait `pig_deer` |
| PIG_PUMPKIN | Heo Bí Ngô | UNCOMMON | MEADOW | thân bí ngô cam, cuống xoắn | PINK×MELON | lai | R `pig_pumpkin` |
| PIG_SUPERMAN | Heo Siêu Nhân | RARE | HERO | thân tím, áo choàng đỏ | MELON×MELON | lai | R `pig_superhero` |
| PIG_TIGER | Heo Hổ | RARE | WILD | cam sọc đen | BOAR×BROWN, BOAR×BOAR | 7.000 · cấp 6 | R+coat `pig_tiger` |
| PIG_PANDA | Heo Gấu Trúc | RARE | WILD | trắng, mảng đen tai/chân | WHITE×BLACK | lai | R+coat `pig_panda` |
| PIG_AXOLOTL | Heo Kỳ Giông | RARE | WATER | hồng pastel, 3 cặp mang san hô | PENGUIN×PINK | 7.000 · cấp 7 | R+coat+trait `pig_axolotl` |
| PIG_SUNFLOWER | Heo Hướng Dương | RARE | MEADOW | vòng cánh hoa vàng quanh mặt | BEE×PUMPKIN | lai | R `pig_sunflower` |
| PIG_HEDGEHOG | Heo Nhím | RARE | WILD | áo gai tròn nâu từ đỉnh đầu tới mông | BOAR×SHEEP | 7.000 · cấp 8 | R+coat+trait `pig_hedgehog` |
| PIG_TURTLE | Heo Rùa | RARE | WATER | da xanh ô liu, mai vòm vảy lục giác | PENGUIN×MELON | lai | R+coat+trait `pig_turtle` |
| PIG_KOI | Heo Cá Chép | EPIC | WATER | trắng mảng đỏ koi | AXOLOTL×WHITE | lai | R+coat `pig_koi` |
| PIG_DRAGONLING | Heo Rồng Con | EPIC | MYTHIC | xanh ngọc, sừng nụ, cánh dơi | TIGER×SUPERMAN | lai | R+tint `pig_dragonling` |
| PIG_GALAXY | Heo Ngân Hà | EPIC | MYTHIC | tím đêm đốm sao | BLACK×DRAGONLING | lai | R+coat `pig_galaxy` |
| PIG_ROBOT | Heo Robot | EPIC | HERO | thân kim loại, mắt xanh, bánh xe | SUPERMAN×PENGUIN | lai | R `pig_robot` |
| PIG_UNICORN | Heo Kỳ Lân | EPIC | MYTHIC | sừng vàng, bờm cầu vồng | SHEEP×SUPERMAN | lai | R `pig_unicorn` |
| PIG_MYTHICAL | Heo Thần Thoại | LEGENDARY | MYTHIC | vàng, cánh, vương miện | KOI×DRAGONLING | lai | R `pig_thienlong` |
| PIG_PHOENIX | Heo Phượng Hoàng | LEGENDARY | MYTHIC | thân lửa đỏ → vàng, mào + đuôi + cánh lông vũ | DRAGONLING×GALAXY | lai | R+coat+trait `pig_phoenix` |

Ngoài mutation, mọi cặp còn ra: cùng loài 60 · cùng family 25 · bậc +1 9 · bậc +2 1 (`BREEDING_RULES`).

**Backend art:** R = cắt nguyên từ sheet reference (`npm run art:cut`); R+tint = cắt + đổi màu giữ bóng;
R+coat = `pig_classic` + hoa văn lông (`scripts/assets/coats.ts`); R+trait = thêm hình khối (lông, mang, sừng, gạc,
gai, mai, lông vũ) vẽ bằng bộ kit chung, chồng lên/dưới heo gốc (`scripts/assets/traits.ts`). Mọi species giữ
nguyên đầu, mắt, mõm, chân, móng và đuôi xoắn của heo reference.
