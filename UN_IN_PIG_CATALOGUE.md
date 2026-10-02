# UN IN — PIG SPECIES CATALOGUE

Danh mục **species** (loài heo) của game. Concept chi tiết: `PIG_CONCEPT_PROPOSAL.md`. Số liệu thật ở
`src/core/config/breeds.ts`, luật lai ở `src/core/config/breedingRules.ts` (bảng này chỉ để đọc; lệch thì code thắng).
Art: một hướng side-view nhìn phải + flip (D23), 512×512, theo `asset/reference/style_reference_pigs.png`.

- **Species** = thân/da/lông → quyết định giá, thời gian lớn, lai, sưu tập. Hình của heo = `BREEDS[breed].artId`.
- **Không có bộ đồ / clothing / phụ kiện** (DECISIONS A2-1).
- **Thêm / sửa species**: `npm run admin` (dashboard dev, DECISIONS A7-1) ghi 1 dòng `speciesTable.ts` + id trong
  `ids.ts` + dòng manifest `pigs[]`. Sửa tay vẫn được: 1 dòng mỗi species. Chỉ số theo `RARITY_TIER`; tuỳ chọn 1
  mutation trong `breedingRules.ts`. Không xoá species (save cũ) — tắt bằng `enabled: false`.
- **Family A7** (8 bộ sưu tập từ art user, `asset/animals/PIG_CATALOGUE.md`): VIETNAM, JOB, ADVENTURE, SCIFI, FANTASY,
  HORROR, FOOD, FUNNY. Mỗi bộ có 1 heo bán trong shop (SCIFI/FANTASY: 1 heo UNCOMMON) → mọi heo lai ra được.

## Rarity

| Rarity | Giá bán | Lớn | Lai | Trong shop |
|---|---|---|---|---|
| COMMON | 1.200 | 2h | có | có (500) |
| UNCOMMON | 3.000 | 4h | có | một số, theo cấp |
| RARE | 12.000 | 8h | có | một số, theo cấp |
| EPIC | 24.000 | 16h | có | không |
| LEGENDARY | 50.000 | 24h | **không** | không |

## Species (69)

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
| PIG_FARMER | Heo Nông Dân | COMMON | VIETNAM | nón lá, quần yếm | — | 500 · cấp 2 | U `pig_farmer` |
| PIG_ICECREAM | Heo Kem | COMMON | FOOD | ốc quế kem trên đầu | — | 500 · cấp 2 | U `pig_icecream` |
| PIG_CHEF | Heo Đầu Bếp | COMMON | JOB | mũ đầu bếp, khăn đỏ | — | 500 · cấp 3 | U `pig_chef` |
| PIG_SLEEPY | Heo Buồn Ngủ | COMMON | FUNNY | mũ ngủ, pyjama xanh | — | 500 · cấp 3 | U `pig_sleepy` |
| PIG_GHOST | Heo Ma | COMMON | HORROR | trùm khăn ma trắng | — | 500 · cấp 4 | U `pig_ghost` |
| PIG_TEACHER | Heo Giáo Viên | COMMON | JOB | kính tròn, sách, que chỉ | — | 500 · cấp 4 | U `pig_teacher` |
| PIG_KNIGHT | Heo Hiệp Sĩ | COMMON | ADVENTURE | giáp bạc, khiên | — | 500 · cấp 5 | U `pig_knight` |
| PIG_DETECTIVE | Heo Thám Tử | COMMON | JOB | mũ phớt, kính lúp | — | lai | U `pig_detective` |
| PIG_BUSINESS | Heo Doanh Nhân | COMMON | JOB | vest, cà vạt | — | lai | U `pig_business` |
| PIG_BOBA | Heo Trà Sữa | COMMON | FOOD | cốc trà sữa | — | lai | U `pig_boba` |
| PIG_LAZY | Heo Lười | COMMON | FUNNY | nằm trên gối | — | lai | U `pig_lazy` |
| PIG_ANGRY | Heo Cáu | COMMON | FUNNY | đỏ, mày cau, xì khói | — | lai | U `pig_angry` |
| PIG_CRYBABY | Heo Mít Ướt | COMMON | FUNNY | nước mắt lớn | — | lai | U `pig_crybaby` |
| PIG_GRANDPA | Heo Ông | COMMON | FUNNY | tóc bạc, kính | — | lai | U `pig_grandpa` |
| PIG_PARTY | Heo Quẩy | COMMON | FUNNY | mũ tiệc | — | lai | U `pig_party` |
| PIG_AO_DAI | Heo Áo Dài | UNCOMMON | VIETNAM | áo dài đỏ/vàng | — | lai | U `pig_ao_dai` |
| PIG_TET | Heo Tết | UNCOMMON | VIETNAM | áo đỏ, mũ quả dưa | — | lai | U `pig_tet` |
| PIG_LAN | Heo Lân | UNCOMMON | VIETNAM | đầu lân múa | — | lai | U `pig_lan` |
| PIG_BANH_CHUNG | Heo Bánh Chưng | UNCOMMON | VIETNAM | thân bánh chưng lá dong | — | lai | U `pig_banh_chung` |
| PIG_ASTRONAUT | Heo Phi Hành Gia | UNCOMMON | JOB | bộ đồ phi hành | — | lai | U `pig_astronaut` |
| PIG_PIRATE | Heo Cướp Biển | UNCOMMON | ADVENTURE | mũ hải tặc, đai lưng | — | lai | U `pig_pirate` |
| PIG_NINJA | Heo Ninja | UNCOMMON | ADVENTURE | đồ ninja đen, băng đỏ | — | lai | U `pig_ninja` |
| PIG_WITCH | Heo Phù Thủy | UNCOMMON | ADVENTURE | mũ phù thuỷ tím | — | lai | U `pig_witch` |
| PIG_SURFER | Heo Lướt Sóng | UNCOMMON | ADVENTURE | đồ lặn, ván lướt | — | lai | U `pig_surfer` |
| PIG_DIVER | Heo Thợ Lặn | UNCOMMON | ADVENTURE | kính lặn, bình khí | — | lai | U `pig_diver` |
| PIG_ALIEN | Heo Ngoài Hành Tinh | UNCOMMON | SCIFI | tím, ăng-ten | — | 1.800 · cấp 6 | U `pig_alien` |
| PIG_MECHA | Heo Mecha | UNCOMMON | SCIFI | giáp chiến đấu nâu-xanh | — | lai | U `pig_mecha` |
| PIG_CYBORG | Heo Cyborg | UNCOMMON | SCIFI | nửa máy, mắt đỏ | — | lai | U `pig_cyborg` |
| PIG_DRAGON | Heo Rồng | UNCOMMON | FANTASY | đồ rồng vàng, sừng | — | 1.800 · cấp 7 | U `pig_dragon` |
| PIG_ONI | Heo Oni | UNCOMMON | FANTASY | đỏ, sừng, nanh | — | lai | U `pig_oni` |
| PIG_VAMPIRE | Heo Ma Cà Rồng | UNCOMMON | HORROR | tím, áo choàng | — | lai | U `pig_vampire` |
| PIG_ZOMBIE | Heo Zombie | UNCOMMON | HORROR | xanh, vết khâu | — | lai | U `pig_zombie` |
| PIG_DONUT | Heo Donut | UNCOMMON | FOOD | vòng donut hồng | — | lai | U `pig_donut` |
| PIG_BURGER | Heo Burger | UNCOMMON | FOOD | thân burger | — | lai | U `pig_burger` |
| PIG_RICH | Heo Đại Gia | UNCOMMON | FUNNY | dây vàng, tiền | — | lai | U `pig_rich` |
| PIG_BATTLEBOT | Heo Battlebot | RARE | SCIFI | robot đấu trường xám | — | lai | U `pig_battlebot` |
| PIG_UFO | Heo UFO | RARE | SCIFI | ngồi đĩa bay | — | lai | U `pig_ufo` |
| PIG_KITSUNE | Heo Hồ Ly | RARE | FANTASY | tai cáo, nhiều đuôi | — | lai | U `pig_kitsune` |
| PIG_PEGASUS | Heo Pegasus | RARE | FANTASY | cánh trắng, vòng sáng | — | lai | U `pig_pegasus` |
| PIG_ZEUS | Heo Zeus | RARE | FANTASY | vương miện, áo toga, sét | — | lai | U `pig_zeus` |
| PIG_VALKYRIE | Heo Valkyrie | RARE | FANTASY | mũ cánh, giáo | — | lai | U `pig_valkyrie` |
| PIG_THOR | Heo Thor | RARE | FANTASY | búa | — | lai | U `pig_thor` |

Ngoài mutation, mọi cặp còn ra: cùng loài 60 · cùng family 25 · bậc +1 9 · bậc +2 1 (`BREEDING_RULES`).

**Backend art:** U = ảnh user vẽ sẵn trong `asset/animals/asset/` (A7, chép nguyên vào `pigs/base/`); R = cắt nguyên từ sheet reference (`npm run art:cut`); R+tint = cắt + đổi màu giữ bóng;
R+coat = `pig_classic` + hoa văn lông (`scripts/assets/coats.ts`); R+trait = thêm hình khối (lông, mang, sừng, gạc,
gai, mai, lông vũ) vẽ bằng bộ kit chung, chồng lên/dưới heo gốc (`scripts/assets/traits.ts`). Mọi species giữ
nguyên đầu, mắt, mõm, chân, móng và đuôi xoắn của heo reference.
