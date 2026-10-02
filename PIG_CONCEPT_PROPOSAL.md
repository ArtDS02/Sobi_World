# PIG CONCEPT PROPOSAL — Species (A3, cập nhật 2026-10-02)

Trạng thái: **đã triển khai** (27 species, đều có art production). Bảng tra nhanh: `UN_IN_PIG_CATALOGUE.md`.
Số liệu thật: `src/core/config/breeds.ts`; luật lai: `src/core/config/breedingRules.ts`. Giá là TUNABLE (`npm run sim:economy`).

## 0. Nguồn và luật

- `asset/animals/` **không có ảnh động vật** (chỉ `PIG_CATALOGUE.md`) → concept dựa trên đặc điểm nhận diện phổ biến
  của loài. Style: `asset/reference/style_reference_pigs.png` (chibi, viền nâu đỏ ấm, mắt to nâu có highlight, má hồng,
  mõm hồng tròn, 4 chân móng nâu, đuôi xoắn, sáng từ trên-trái).
- **Giữ khung heo**: đầu, mõm 2 lỗ, tai heo, thân tròn, 4 chân ngắn có móng, đuôi xoắn.
- **Mượn 2–3 đặc điểm** của con vật thành **hình khối** (lông, mang, sừng, gạc, gai, mai, lông vũ) + bảng màu + hoa văn.
  Cấm: thay mõm, tai nhọn, cổ dài, thân cá, bỏ đuôi xoắn. Không bộ đồ / phụ kiện (DECISIONS A2-1).
- Một góc side-view nhìn phải + flip, 512×512, nền trong, không bóng.

## 1. Đã lọc bỏ

| Concept | Lý do |
|---|---|
| Bò sữa, bọ rùa | trùng PIG_SPOTTED / PANDA (đốm) |
| Ếch | trùng màu PIG_STRIPED_MELON / TURTLE |
| Ngựa vằn, báo | trùng sọc / đốm PIG_TIGER, PIG_DEER |
| Voi, hươu cao cổ, cú, cá | thay mõm / cổ dài / mỏ / thân cá → mất khung heo |
| Mèo, chó, cáo | tai nhọn đổi silhouette đầu heo |
| Heo baby/tiny/fat/fluffy/long_ear | chỉ khác tỷ lệ (trùng growth stage) |
| 13 bộ đồ (farmer, chef, nerd, knight, wizard, cowboy, detective, ghost, christmas, tet, pilot, pirate, ninja) | là trang phục, không phải loài — đã gỡ (A2-1); robot + kỳ lân là thân → thành species |

## 2. Species

Cột rút gọn: **Insp** = cảm hứng · **Thân** = body shape · **Đặc trưng** = signature · **Mặt** = face details ·
**Lai** = breeding notes · **Shop** = giá mua · cấp mở. Asset: tất cả `production` trong `public/assets/pigs/base/`.

### COMMON — FARM (bán trong shop, 500)

| ID | Tên | Insp | Theme | Thân | Đặc trưng | Bảng màu / hoa văn | Mặt | Lai | Shop | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| PIG_EARTH_PINK | Heo Hồng Đất | — | heo quê | tròn chuẩn | chuẩn của bộ | hồng #F7B8C4, trơn | chuẩn | khởi đầu | 500 · 1 | `pig_classic` |
| PIG_WHITE | Heo Trắng | heo Yorkshire | heo quê | tròn chuẩn | sáng nhất bộ | kem #FFF4EA, trơn | tai hồng nhạt | ×BLACK → PANDA 3, PENGUIN 6; ×WHITE → SHEEP 6 | 500 · 1 | `pig_white` |
| PIG_BLACK | Heo Đen | heo Mường / Ỉ | heo quê | tròn chuẩn | tương phản mắt sáng | than #3D3540, mảng hồng nhỏ | mõm hồng xám | ×BOAR → BUFFALO 5; ×DRAGONLING → GALAXY 4 | 500 · 1 | `pig_black` |
| PIG_BROWN | Heo Nâu | heo Duroc | heo quê | tròn chuẩn | màu đất | nâu #B9744F | — | ×BROWN → BOAR 6; ×BOAR → TIGER 5 | 500 · 2 | `pig_brown` |
| PIG_SPOTTED | Heo Đốm | heo lang | heo quê | tròn chuẩn | đốm nâu lớn lệch | hồng + nâu #8C5A3C | — | ×BROWN → DEER 6 | 500 · 3 | `pig_spotted` |

### UNCOMMON

| ID | Tên | Insp | Theme / Family | Thân | Đặc trưng | Bảng màu / hoa văn | Mặt | Lai | Shop | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| PIG_STRIPED_MELON | Heo Sọc Dưa | dưa hấu | vườn · MEADOW | tròn | sọc dọc + mầm lá | #8FD18A / #3E8E4A | tàn nhang | PINK×PINK 5 | lai | `pig_watermelon` |
| PIG_BOAR | Heo Rừng | lợn rừng | rừng · WILD | tròn, lưng gồ | bờm sống lưng sẫm | nâu xám #7A6250, bờm #4E3B30 | — | BROWN×BROWN 6 | 1.500 · 3 | `pig_boar` |
| PIG_SHEEP | Heo Cừu | cừu / Mangalica | đồng cỏ · MEADOW | **phồng như mây** | mây lông xoăn phủ thân + chỏm đầu; mặt, tai, chân, đuôi trần | lông kem #F7EFE2, xoắn nâu nhạt | hồng chuẩn | WHITE×WHITE 6 | 1.500 · 4 | `pig_sheep` |
| PIG_BEE | Heo Ong | ong mật | vườn · MEADOW | tròn | sọc ngang, 2 cánh trong, 2 râu | vàng #F6C944 / đen #3B2E2A | hoa trên đầu | MELON×SHEEP 8 | lai | `pig_bee` |
| PIG_PENGUIN | Heo Cánh Cụt | chim cánh cụt | băng · WATER | tròn | "áo tux" tự nhiên | navy #33415C, bụng trắng | mặt trắng | WHITE×BLACK 6 | 1.800 · 5 | `pig_penguin` |
| PIG_BUFFALO | Heo Trâu | trâu nước VN | đồng lúa · FARM | tròn chắc | **cặp sừng lưỡi liềm** cong ra sau | xám đá #767E8C, bụng xám nhạt, sừng ngà #EFE4CE | mõm hồng xám | BLACK×BOAR 5 | 1.500 · 4 | `pig_buffalo` |
| PIG_DEER | Heo Hươu Sao | hươu sao | rừng thưa · MEADOW | tròn | **gạc nhỏ phân nhánh** + đốm trắng trên lưng | vàng nâu #CE8A52, bụng kem, gạc #D7A679 | — | SPOTTED×BROWN 6 | lai | `pig_deer` |
| PIG_PUMPKIN | Heo Bí Ngô | bí ngô | mùa gặt · MEADOW | **tròn múi bí** | thân bí cam múi dọc, cuống xoắn + lá | cam #F28C28, cuống xanh | mắt cười | PINK×MELON 6 | lai | `pig_pumpkin` |

### RARE

| ID | Tên | Insp | Theme / Family | Thân | Đặc trưng | Bảng màu / hoa văn | Mặt | Lai | Shop | Asset |
|---|---|---|---|---|---|---|---|---|---|---|
| PIG_SUPERMAN | Heo Siêu Nhân | siêu anh hùng | HERO | tròn | áo choàng đỏ | tím #8C8FE6 | lông mày quyết tâm | MELON×MELON 4 | lai | `pig_superhero` |
| PIG_TIGER | Heo Hổ | hổ | WILD | tròn | sọc đen trên lưng + trán | cam #F29A4A, bụng kem | — | BOAR×BROWN 5, BOAR×BOAR 4 | 7.000 · 6 | `pig_tiger` |
| PIG_PANDA | Heo Gấu Trúc | gấu trúc | WILD | tròn | mảng đen tai + chân | trắng / đen #2E2A2E | mắt to sáng | WHITE×BLACK 3 | lai | `pig_panda` |
| PIG_AXOLOTL | Heo Kỳ Giông | kỳ giông Mexico | WATER | tròn | **3 cặp mang san hô** sau tai | hồng pastel #FFA8CC, mang #EC6694, tàn nhang | — | PENGUIN×PINK 4 | 7.000 · 7 | `pig_axolotl` |
| PIG_SUNFLOWER | Heo Hướng Dương | hoa hướng dương | MEADOW | tròn | **vòng cánh hoa** quanh mặt + lá | vàng #F6C62E, lá xanh | mặt trong nhuỵ | BEE×PUMPKIN 5 | lai | `pig_sunflower` |
| PIG_HEDGEHOG | Heo Nhím | nhím | WILD | **tròn gai** | áo gai tròn 2 lớp từ đỉnh đầu tới mông | gai nâu #8A5A3C / #B07A52, da kem #ECCCA8 | mặt mịn | BOAR×SHEEP 5 | 7.000 · 8 | `pig_hedgehog` |
| PIG_TURTLE | Heo Rùa | rùa | WATER | **mai vòm** | mai vảy lục giác + viền mai | da ô liu #96C478, mai #6A9F56, viền #E2CF95 | — | PENGUIN×MELON 5 | lai | `pig_turtle` |

### EPIC (chỉ lai)

| ID | Tên | Insp | Family | Đặc trưng | Bảng màu | Lai | Asset |
|---|---|---|---|---|---|---|---|
| PIG_KOI | Heo Cá Chép | koi / cá chép hoá rồng | WATER | mảng đỏ koi | trắng, #E8573E | AXOLOTL×WHITE 3 | `pig_koi` |
| PIG_DRAGONLING | Heo Rồng Con | rồng | MYTHIC | sừng nụ, cánh dơi, gai lưng | ngọc #5FC2A0 | TIGER×SUPERMAN 4 | `pig_dragonling` |
| PIG_GALAXY | Heo Ngân Hà | trời đêm | MYTHIC | sao phát sáng trên thân | tím đêm #3B3A78, sao #FFF3B0 | BLACK×DRAGONLING 4 | `pig_galaxy` |
| PIG_ROBOT | Heo Robot | robot | HERO | thân kim loại, mắt đèn xanh, bánh xe | bạc #9AA4B4, xanh #4FC3F7 | SUPERMAN×PENGUIN 4 | `pig_robot` |
| PIG_UNICORN | Heo Kỳ Lân | kỳ lân | MYTHIC | sừng vàng, bờm + đuôi cầu vồng | hồng #FFD6E4, cầu vồng pastel | SHEEP×SUPERMAN 4 | `pig_unicorn` |

### LEGENDARY (chỉ lai, không lai tiếp)

| ID | Tên | Insp | Family | Đặc trưng | Bảng màu | Lai | Asset |
|---|---|---|---|---|---|---|---|
| PIG_MYTHICAL | Heo Thần Thoại | thiên long | MYTHIC | cánh thiên thần, vương miện | vàng #F7D774 | KOI×DRAGONLING 3 | `pig_thienlong` |
| PIG_PHOENIX | Heo Phượng Hoàng | phượng hoàng | MYTHIC | mào lửa, đuôi + cánh lông vũ | đỏ #E8523A → cam → vàng #FFD660 | DRAGONLING×GALAXY 2 | `pig_phoenix` |

## 3. Kiểm tra khả năng đạt

Mọi species lai ra được từ heo mua trong shop (theo chuỗi mutation hoặc luật bậc +1/+2 trong family) — test
`tests/unit/config.test.ts` kiểm từng species có ít nhất một cặp cha mẹ cho ra nó.
