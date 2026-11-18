# Audit dữ liệu combat — Sobi Adventure (2026-11-16)

Báo cáo đi kèm trang Admin **Dữ liệu chiến đấu** (`#/combat-db`, `tools/admin/combatDb.ts`). Mọi bảng dưới đây được sinh từ chính `tools/admin/combatDbModel.ts`, tức là từ dữ liệu game thật, không gõ tay. Xem bản sống trong Admin: tab **Báo cáo dữ liệu**.

## Nguồn dữ liệu đã đọc

| Dữ liệu | Nguồn chính thức | Cách Admin đọc |
|---|---|---|
| Combat animal (ai được đánh) | `content/adventure/lineages.json` → `species` (heo) + `fish` (cá) | `identityOf()` của game |
| Tên, độ hiếm, ảnh của chiến binh | `content/farm/species.json` (`artId`, `fighter`), `content/aquarium/fish.json` (`art`, `fighter`) | `FARM_CONTENT`, `FISH_LIST` |
| Dòng Guardian (hệ, 4 Độc nhất, Tuyệt kỹ) | `lineages.json` → `lineages` | `LINEAGES` |
| Class, chỉ số gốc, cây kỹ năng | `content/adventure/classes.json` | `CLASSES`, `TREES` |
| Công thức chỉ số chiến binh | `src/systems/combat/stats.ts` `deriveStats` + `balance.json` → `stats` | gọi thẳng `deriveStats` (đã test bằng `fighterStats`) |
| Quái | `content/adventure/enemies.json` | `ENEMY_LIST` |
| Loại quái (thường / tinh anh / biến dị / trùm phụ / trùm / kỳ dị) | `content/adventure/maps.json` → `groups[].kind` (loại là của **nhóm**, không phải của quái) + `engagement.json` → `rift.nightmares` | gom từ `MAP_LIST`, `RIFT` |
| Chỉ số quái trong trận | `balance.json` → `foes` (loại nhóm, tha hóa) | gọi thẳng `withClass(enemyInits())` của game |
| Skill | `content/adventure/skills.json` | `SKILL_LIST` |
| Trạng thái, tương khắc | `statuses.json`, `elements.json` | `STATUSES`, `ELEMENT_CHART` |
| Animation skill | `content/adventure/battle_fx.json` → `skills` (kịch bản, `vfx3d`, âm thanh) | `BATTLE_FX` |
| Rig / kiểu thân | `content/anim/rigs/*.json`, `battle_fx.json` → `creatures` | `RIGS`, `bodyOf()` |
| Ảnh | `public/assets/manifest/assets.json` (ảnh chính, `cb_<art>_<pose>` key pose, `ui_<skill>` icon, `guardian_*`) | manifest, `status: production / placeholder` |

## Quy ước phân loại trong Admin

- **Kỹ năng riêng (Unique) của chiến binh**: 4 ô Độc nhất + Tuyệt kỹ. Mỗi ô ghi rõ "Của dòng" (dùng chung với các loài cùng dòng) hay "Riêng loài" (loài ghi đè ô đó trong `lineages.json`).
- **Kỹ năng chung (Common) của chiến binh**: 8 nút cây class mặc định (mọi chiến binh cùng class học được; đổi class ở Đền thì dùng cây khác).
- **Quái**: không có Độc nhất / Tuyệt kỹ / cây class. Chia: riêng quái này, dùng chung với quái khác, thêm khi đổi pha, thêm theo cấp tha hóa.
- **Hộ tống trùm**: quái không có cờ `boss` nằm trong nhóm `boss` (vẫn nhận chỉ số của loại Trùm trong trận).
- **Trạng thái dữ liệu**: *Placeholder* = ảnh đại diện thiếu hoặc là placeholder; *Thiếu dữ liệu* = có ảnh nhưng thiếu rig và key pose, skill không tồn tại, skill chưa có animation riêng, hoặc quái chưa được đặt ở đâu; *Đầy đủ* = đạt mọi mục bắt buộc. Icon skill riêng là mục tuỳ chọn (game tự dùng icon nguyên tố: `vmKit.skillArt` / `art.ts`).

## Trường không tồn tại trong hệ thống (hiển thị N/A, không tự điền)

- **Passive**: Combat V2 không có kỹ năng bị động. Bổ trợ thường trực đến từ trang bị, khẩu phần, cộng hưởng dòng (`engagement.json` → `synergies`), biến thể nhóm quái (`affixes`).
- **AI riêng từng quái**: mọi quái dùng AI ý định chung (`src/systems/combat/ai.ts`), `enemies.json` không có trường AI.
- **Điều kiện kích hoạt skill**: chỉ có pha trùm (`phases[].hpBelow`) và cấp tha hóa.
- **"SP Cost" của skill**: skill tốn **MP** (Tuyệt kỹ tốn Nộ đầy 100); **SP** là điểm mở / nâng nút cây class.
- **Cooldown**: có (`cooldown`, theo lượt của chính entity).

## Tổng hợp

| Nhóm | Số lượng |
|---|---|
| Combat Animals | 22 (20 heo, 2 cá) |
| Monsters | 33 (4 trùm có cờ boss) |
| Skills | 134 (46 unique, 12 ultimate, 32 class, 44 enemy) |
| Classes | 4 |
| Elements | 9 |
| Dòng Guardian | 9 |
| Trạng thái | 25 |
| Entity chưa đầy đủ | 12 |

## Classes

| ID | Tên | HP | MP | ATK | DEF | MATK | MDEF | SPD | ACC | EVA | CRIT | Nút cây |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `tanker` | Hộ Vệ | 140 | 40 | 16 | 11 | 10 | 10 | 7 | 100 | 3 | 4 | 8 |
| `striker` | Chiến Binh | 105 | 45 | 22 | 6 | 8 | 5 | 12 | 100 | 8 | 10 | 8 |
| `mage` | Pháp Sư | 82 | 80 | 9 | 4 | 22 | 9 | 9 | 100 | 5 | 6 | 8 |
| `support` | Hỗ Trợ | 95 | 70 | 10 | 7 | 16 | 10 | 10 | 100 | 5 | 5 | 8 |

## Elements

- `METAL` Kim loại
- `NATURE` Thiên nhiên
- `WATER` Nước
- `FIRE` Lửa
- `EARTH` Đất
- `LIGHTNING` Sấm
- `DARK` Bóng tối
- `LIGHT` Ánh sáng
- `VOID` Hư Không

## Combat Animals (22)

Chỉ số cấp 1, chưa trang bị / Gắn bó. Riêng = 4 ô Độc nhất + Tuyệt kỹ; ô có * là kỹ năng riêng loài (ghi đè ô của dòng). Chung = cây class mặc định.

| ID | Tên | Nguồn | Độ hiếm | Dòng | Class | Hệ | HP/ATK/DEF/MATK/MDEF/SPD | Độc nhất | Tuyệt kỹ | Chung | Rig | Key pose | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `PIG_KNIGHT` | Heo Hiệp Sĩ | farm | COMMON | Dòng Thiết Giáp | Chiến Binh | Kim loại | 105/22/6/8/5/12 | Chém Thép, Tường Khiên Đồng, Lời Thề Sắt*, Húc Thép | Đoàn Kỵ Thép | 8 | có | 6 | Đầy đủ |
| `PIG_SAMURAI` | Heo Samurai | farm | RARE | Dòng Thiết Giáp | Chiến Binh | Kim loại | 116/24/7/9/6/13 | Chém Thép, Tường Khiên Đồng, Phá Giáp, Mưa Chông Thép* | Đoàn Kỵ Thép | 8 | có | 6 | Đầy đủ |
| `PIG_ROBOT` | Heo Robot | farm | EPIC | Dòng Thiết Giáp | Hộ Vệ | Kim loại + Sấm | 161/18/13/12/12/8 | Chém Thép, Tường Khiên Đồng, Phá Giáp, Húc Thép | Đoàn Kỵ Thép | 8 | có | 6 | Đầy đủ |
| `PIG_NINJA` | Heo Ninja | farm | UNCOMMON | Dòng Dạ Mặc | Chiến Binh | Bóng tối | 110/23/6/8/5/13 | Phun Mực, Màn Mực, Lưới Đêm, Ác Mộng | Lưới Dệt Đêm | 8 | có | 6 | Đầy đủ |
| `PIG_VAMPIRE` | Heo Ma Cà Rồng | farm | UNCOMMON | Dòng Dạ Mặc | Chiến Binh | Bóng tối | 110/23/6/8/5/13 | Phun Mực, Màn Mực, Lưới Đêm, Ác Mộng | Lưới Dệt Đêm | 8 | có | 6 | Đầy đủ |
| `PIG_PIRATE` | Heo Cướp Biển | farm | UNCOMMON | Dòng Nam Hải | Chiến Binh | Nước | 110/23/6/8/5/13 | Bong Bóng Nước, Sóng Vỗ Về, Khúc Ca Triều, Xoáy Nước Cổ* | Tiếng Hát Đại Dương | 8 | có | 6 | Đầy đủ |
| `PIG_POSEIDON` | Heo Poseidon | farm | LEGENDARY | Dòng Nam Hải | Pháp Sư | Nước + Sấm | 98/11/5/26/11/11 | Bong Bóng Nước, Sóng Vỗ Về, Triều Dâng*, Sóng Thần Cổ | Đinh Ba Hải Vương* | 8 | có | 6 | Đầy đủ |
| `PIG_STORM` | Heo Sấm | farm | RARE | Dòng Lôi Dương | Chiến Binh | Sấm | 116/24/7/9/6/13 | Lôi Kích, Tốc Lôi, Chuỗi Sét, Gọi Sấm | Hiệu Lệnh Sấm | 8 | **không** | 0 | Thiếu dữ liệu |
| `PIG_TIGER` | Heo Hổ | farm | RARE | Dòng Lôi Dương | Chiến Binh | Sấm | 116/24/7/9/6/13 | Lôi Kích, Tốc Lôi, Chuỗi Sét, Gọi Sấm | Hiệu Lệnh Sấm | 8 | có | 6 | Đầy đủ |
| `PIG_VALKYRIE` | Heo Valkyrie | farm | RARE | Dòng Quang Trư | Chiến Binh | Ánh sáng | 116/24/7/9/6/13 | Tia Sáng, Ánh Sáng Đầu Tiên, Đèn Dẫn Lối, Lăng Kính Tán Sắc* | Lồng Đèn Trung Thu | 8 | có | 6 | Đầy đủ |
| `PIG_UNICORN` | Heo Kỳ Lân | farm | EPIC | Dòng Quang Trư | Hỗ Trợ | Ánh sáng + Thiên nhiên | 109/12/8/18/12/12 | Tia Sáng, Ánh Sáng Đầu Tiên, Giáo Rạng Đông*, Tia Lumina | Lồng Đèn Trung Thu | 8 | có | 6 | Đầy đủ |
| `PIG_DRAGON` | Heo Rồng | farm | UNCOMMON | Dòng Hỏa Giải | Pháp Sư | Lửa | 86/9/4/23/9/9 | Càng Nung, Lửa Rèn, Phun Dung Nham, Búa Hỏa Ngục | Lò Rèn Nguyên Thủy | 8 | có | 6 | Đầy đủ |
| `PIG_PHOENIX` | Heo Phượng Hoàng | farm | LEGENDARY | Dòng Hỏa Giải | Pháp Sư | Lửa + Ánh sáng | 98/11/5/26/11/11 | Càng Nung, Lửa Rèn, Phun Dung Nham, Búa Hỏa Ngục | Phượng Hoàng Tái Sinh* | 8 | có | 6 | Đầy đủ |
| `PIG_TURTLE` | Heo Rùa | farm | RARE | Dòng Quy Sơn | Hộ Vệ | Đất | 154/18/12/11/11/8 | Đập Đá, Da Đá, Mai Núi, Lăn Tảng* | Núi Thiêng Trỗi Dậy | 8 | có | 6 | Đầy đủ |
| `PIG_CRYSTAL` | Heo Pha Lê | farm | EPIC | Dòng Quy Sơn | Hộ Vệ | Đất + Ánh sáng | 161/18/13/12/12/8 | Đập Đá, Da Đá, Mây Bụi*, Địa Chấn Cổ | Núi Thiêng Trỗi Dậy | 8 | có | 6 | Đầy đủ |
| `PIG_GALAXY` | Heo Ngân Hà | farm | EPIC | Dòng Hư Không | Pháp Sư | Hư Không + Ánh sáng | 94/10/5/25/10/10 | Va Chạm Thuần, Màn Hư Vô, Lệch Pha, Sao Rơi Vô Định* | Bầu Trời Trong Chuông | 8 | có | 6 | Đầy đủ |
| `PIG_MYTHICAL` | Heo Thần Thoại | farm | LEGENDARY | Dòng Hư Không | Pháp Sư | Hư Không + Ánh sáng | 98/11/5/26/11/11 | Va Chạm Thuần, Màn Hư Vô, Kết Giới Trống*, Xoáy Hư Không | Huyền Thoại Thức Tỉnh* | 8 | có | 7 | Đầy đủ |
| `PIG_BOAR` | Heo Rừng | farm | UNCOMMON | Dòng Mộc Mẫu | Hộ Vệ | Thiên nhiên | 147/17/12/11/11/7 | Gai Độc, Chồi Non, Rễ Trói, Hoa Hồi Sinh | Rừng Mẹ Ôm Ấp | 8 | có | 6 | Đầy đủ |
| `PIG_HEDGEHOG` | Heo Nhím | farm | RARE | Dòng Thiết Giáp | Hộ Vệ | Kim loại | 154/18/12/11/11/8 | Chém Thép, Tường Khiên Đồng, Phá Giáp, Húc Thép | Đoàn Kỵ Thép | 8 | có | 6 | Đầy đủ |
| `PIG_SUNFLOWER` | Heo Hướng Dương | farm | RARE | Dòng Mộc Mẫu | Hỗ Trợ | Thiên nhiên | 105/11/8/18/11/11 | Gai Độc, Chồi Non, Rễ Trói, Hoa Hồi Sinh | Rừng Mẹ Ôm Ấp | 8 | có | 6 | Đầy đủ |
| `fish_pufferfish` | Cá Nóc | aquarium | UNCOMMON | Dòng Mộc Mẫu | Pháp Sư | Thiên nhiên | 86/9/4/23/9/9 | Gai Độc, Chồi Non, Rễ Trói, Hoa Hồi Sinh | Rừng Mẹ Ôm Ấp | 8 | có | 6 | Đầy đủ |
| `fish_betta` | Cá Betta Lụa | aquarium | RARE | Dòng Hỏa Giải | Chiến Binh | Lửa | 116/24/7/9/6/13 | Càng Nung, Lửa Rèn, Phun Dung Nham, Búa Hỏa Ngục | Lò Rèn Nguyên Thủy | 8 | có | 9 | Đầy đủ |

## Monsters (33)

Loại = các loại nhóm nó xuất hiện (maps.json; "Hộ tống trùm" = nằm trong nhóm trùm nhưng không có cờ boss). Chỉ số gốc enemies.json.

| ID | Tên | Loại | Hệ | Thẻ | HP/ATK/DEF/MATK/MDEF/SPD | Skill (riêng / chung / pha / tha hóa) | Pha | Nhóm trên map | Rig | Key pose | Trạng thái |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `enemy_mossling` | Rêu Con | Thường | Thiên nhiên | — | 168/18/5/12/6/7 | 0 / 1 / 0 / 0 | 0 | 19 | có | 6 | Đầy đủ |
| `enemy_thorn_sprout` | Mầm Gai | Thường, Hộ tống trùm | Thiên nhiên | — | 146/19/4/22/4/9 | 1 / 0 / 0 / 0 | 0 | 22 | có | 6 | Đầy đủ |
| `enemy_gale_sparrow` | Chim Sẻ Sấm | Biến Dị, Thường | Sấm | — | 129/20/4/14/4/14 | 0 / 1 / 0 / 0 | 0 | 10 | có | 6 | Đầy đủ |
| `enemy_ember_fox` | Cáo Lửa | Kỳ Dị, Thường | Lửa | — | 153/25/5/18/4/11 | 0 / 1 / 0 / 0 | 0 | 14 | có | 6 | Đầy đủ |
| `enemy_dew_frog` | Ếch Sương | Tinh Anh, Biến Dị, Thường | Nước | — | 184/16/6/20/5/8 | 0 / 2 / 0 / 1 | 0 | 16 | có | 6 | Đầy đủ |
| `enemy_forest_wolf` | Sói Đêm | Kỳ Dị, Tinh Anh, Thường | Bóng tối | — | 260/29/7/20/6/12 | 0 / 1 / 0 / 0 | 0 | 23 | có | 6 | Đầy đủ |
| `enemy_bramble_boar` | Heo Rừng Gai | Tinh Anh, Biến Dị, Thường | Đất | elite | 339/31/12/22/11/8 | 0 / 2 / 0 / 0 | 0 | 9 | có | 6 | Đầy đủ |
| `enemy_wolf_alpha` | Sói Đầu Đàn | Trùm Phụ, Tinh Anh | Bóng tối | elite, umbraflux | 435/34/9/24/8/13 | 1 / 1 / 0 / 0 | 0 | 2 | có | 6 | Đầy đủ |
| `enemy_old_treant` | Cổ Thụ Giận Dữ | Trùm, Trùm Phụ, Trùm Ác Mộng (Vết Nứt) | Thiên nhiên | boss, umbraflux | 832/32/12/35/12/9 | 2 / 1 / 1 / 0 | 1 | 2 + Vết Nứt T10 | có | 6 | Đầy đủ |
| `enemy_rock_beetle` | Bọ Giáp Thép | Tinh Anh, Thường | Kim loại | — | 344/38/14/27/10/7 | 0 / 2 / 0 / 1 | 0 | 32 | có | 6 | Đầy đủ |
| `enemy_cliff_hawk` | Ưng Vách Đá | Kỳ Dị, Tinh Anh, Thường | Sấm | — | 252/41/8/30/7/16 | 0 / 2 / 0 / 1 | 0 | 17 | có | 9 | Đầy đủ |
| `enemy_lava_newt` | Kỳ Nhông Dung Nham | Biến Dị, Thường, Hộ tống trùm | Lửa | — | 287/35/9/44/8/10 | 0 / 1 / 0 / 0 | 0 | 22 | có | 6 | Đầy đủ |
| `enemy_snow_goat` | Dê Tuyết | Thường | Nước | — | 321/35/11/35/10/9 | 0 / 2 / 0 / 0 | 0 | 26 | có | 6 | Đầy đủ |
| `enemy_ore_golem` | Người Đá Quặng | Trùm Phụ, Tinh Anh, Thường | Đất | elite | 509/44/18/31/14/6 | 1 / 2 / 0 / 1 | 0 | 13 | có | 6 | Đầy đủ |
| `enemy_thunder_ram` | Cừu Sừng Sấm | Trùm Phụ, Tinh Anh, Thường | Sấm | elite, umbraflux | 626/47/13/32/12/12 | 1 / 1 / 0 / 1 | 0 | 4 | có | 6 | Đầy đủ |
| `enemy_magma_drake` | Rồng Dung Nham | Trùm, Trùm Ác Mộng (Vết Nứt) | Lửa | boss, umbraflux | 1509/47/14/50/13/11 | 2 / 1 / 1 / 0 | 1 | 1 + Vết Nứt T20 | có | 6 | Đầy đủ |
| `enemy_stone_sentinel` | Lính Gác Đá | Tinh Anh, Thường | Đất | — | 789/60/24/42/18/8 | 1 / 2 / 0 / 1 | 0 | 18 | có | 6 | Đầy đủ |
| `enemy_rune_wisp` | Hồn Rune | Kỳ Dị, Tinh Anh, Biến Dị, Thường, Hộ tống trùm | Ánh sáng | — | 468/45/12/66/11/18 | 2 / 1 / 0 / 2 | 0 | 20 | có | 6 | Đầy đủ |
| `enemy_tide_wraith` | Hồn Ma Thủy Triều | Trùm Phụ, Kỳ Dị, Tinh Anh, Thường | Bóng tối + Nước | — | 567/45/14/60/13/12 | 0 / 2 / 0 / 1 | 0 | 22 | có | 6 | Đầy đủ |
| `enemy_ember_idol` | Tượng Lửa | Thường | Lửa | — | 666/69/16/63/14/10 | 1 / 1 / 0 / 0 | 0 | 18 | có | 6 | Đầy đủ |
| `enemy_shadow_priest` | Thầy Tế Bóng Tối | Trùm Phụ, Tinh Anh, Thường | Bóng tối | elite, umbraflux | 883/51/16/75/14/11 | 0 / 3 / 0 / 1 | 0 | 6 | có | 6 | Đầy đủ |
| `enemy_ancient_guardian` | Hộ Pháp Cổ Đại | Trùm, Trùm Ác Mộng (Vết Nứt) | Kim loại | boss, umbraflux | 3204/78/22/60/20/10 | 2 / 2 / 1 / 0 | 1 | 1 + Vết Nứt T30 | có | 7 | Đầy đủ |
| `enemy_reef_crab` | Cua Rạn | Trùm Phụ, Thường | Nước | — | 856/62/24/43/18/7 | 1 / 2 / 0 / 1 | 0 | 8 | **không** | 0 | Thiếu dữ liệu |
| `enemy_salt_gull` | Mòng Biển Muối | Thường | Sấm | — | 552/66/11/48/10/18 | 0 / 2 / 0 / 0 | 0 | 9 | **không** | 0 | Thiếu dữ liệu |
| `enemy_coral_eel` | Lươn San Hô | Biến Dị, Thường | Nước | — | 662/50/13/72/13/13 | 1 / 2 / 0 / 0 | 0 | 8 | **không** | 0 | Thiếu dữ liệu |
| `enemy_drift_jelly` | Sứa Trôi | Kỳ Dị, Thường | Ánh sáng | — | 593/46/11/70/15/11 | 1 / 2 / 0 / 0 | 0 | 5 | **không** | 0 | Thiếu dữ liệu |
| `enemy_brine_wraith` | Hồn Nước Mặn | Thường | Bóng tối | — | 718/50/14/70/14/12 | 0 / 2 / 0 / 0 | 0 | 4 | **không** | 0 | Thiếu dữ liệu |
| `enemy_shell_knight` | Hiệp Sĩ Vỏ Ốc | Tinh Anh | Kim loại + Nước | elite | 1132/70/26/48/20/8 | 1 / 3 / 0 / 1 | 0 | 2 | **không** | 0 | Thiếu dữ liệu |
| `enemy_abyss_kraken` | Bạch Tuộc Vực Thẳm | Trùm | Nước | boss, umbraflux | 3588/77/20/84/20/11 | 0 / 3 / 1 / 0 | 1 | 1 | **không** | 0 | Thiếu dữ liệu |
| `enemy_mimic_forest` | Rương Giả | Kỳ Dị | Đất | elite | 339/31/12/22/11/8 | 0 / 2 / 0 / 0 | 0 | 2 | **không** | 0 | Thiếu dữ liệu |
| `enemy_mimic_mountain` | Rương Giả | Kỳ Dị | Đất | elite | 509/44/18/31/14/6 | 0 / 2 / 0 / 0 | 0 | 2 | **không** | 0 | Thiếu dữ liệu |
| `enemy_mimic_ruins` | Rương Giả | Kỳ Dị | Đất | elite | 789/60/24/42/18/8 | 0 / 2 / 0 / 0 | 0 | 1 | **không** | 0 | Thiếu dữ liệu |
| `enemy_mimic_coast` | Rương Giả | Kỳ Dị | Nước | elite | 856/62/24/43/18/7 | 0 / 2 / 0 / 0 | 0 | 1 | **không** | 0 | Thiếu dữ liệu |

### Skills — unique (46)

| ID | Tên | Hệ | Kiểu | Mục tiêu | Power×đòn | MP | CD | Entity dùng | Dùng chung | Icon | Animation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skill_nh_bubble` | Bong Bóng Nước | Nước | hybrid | enemy | 1.3×1 | 8 | 0 | 2 | shared | có | có |
| `skill_nh_soothe` | Sóng Vỗ Về | — | support | ally | 0×1 | 12 | 1 | 2 | shared | có | có |
| `skill_nh_tide_song` | Khúc Ca Triều | — | support | allAllies | 0×1 | 22 | 3 | 1 | own | có | có |
| `skill_nh_tsunami` | Sóng Thần Cổ | Nước | hybrid | allEnemies | 1.1×1 | 28 | 3 | 1 | own | có | có |
| `skill_qs_rock_smash` | Đập Đá | Đất | hybrid | enemy | 1.4×1 | 8 | 1 | 2 | shared | có | có |
| `skill_qs_stone_skin` | Da Đá | — | support | self | 0×1 | 12 | 3 | 2 | shared | có | có |
| `skill_qs_mountain_shell` | Mai Núi | — | support | allAllies | 0×1 | 18 | 3 | 1 | own | có | có |
| `skill_qs_quake` | Địa Chấn Cổ | Đất | hybrid | allEnemies | 1×1 | 28 | 3 | 1 | own | có | có |
| `skill_dm_ink` | Phun Mực | Bóng tối | hybrid | enemy | 1.3×1 | 8 | 0 | 2 | shared | có | có |
| `skill_dm_ink_veil` | Màn Mực | — | support | allAllies | 0×1 | 14 | 3 | 2 | shared | có | có |
| `skill_dm_night_net` | Lưới Đêm | Bóng tối | hybrid | allEnemies | 0.8×1 | 24 | 3 | 2 | shared | có | có |
| `skill_dm_nightmare` | Ác Mộng | Bóng tối | hybrid | enemy | 1.2×1 | 26 | 3 | 2 | shared | có | có |
| `skill_qt_ray` | Tia Sáng | Ánh sáng | hybrid | enemy | 1.3×1 | 8 | 0 | 2 | shared | có | có |
| `skill_qt_first_light` | Ánh Sáng Đầu Tiên | — | support | ally | 0×1 | 16 | 2 | 2 | shared | có | có |
| `skill_qt_guiding_lamp` | Đèn Dẫn Lối | — | support | allAllies | 0×1 | 18 | 3 | 1 | own | có | có |
| `skill_qt_lumina` | Tia Lumina | Ánh sáng | hybrid | enemy | 2.2×1 | 28 | 3 | 1 | own | có | có |
| `skill_ld_thunder_strike` | Lôi Kích | Sấm | hybrid | enemy | 1.4×1 | 8 | 0 | 2 | shared | có | có |
| `skill_ld_swift_bolt` | Tốc Lôi | — | support | allAllies | 0×1 | 14 | 3 | 2 | shared | có | có |
| `skill_ld_chain` | Chuỗi Sét | Sấm | hybrid | randomEnemies | 0.7×3 | 22 | 3 | 2 | shared | có | có |
| `skill_ld_call_thunder` | Gọi Sấm | Sấm | hybrid | allEnemies | 1×1 | 28 | 3 | 2 | shared | có | có |
| `skill_tg_steel_slash` | Chém Thép | Kim loại | hybrid | enemy | 1.4×1 | 8 | 0 | 4 | shared | có | có |
| `skill_tg_bronze_wall` | Tường Khiên Đồng | — | support | self | 0×1 | 14 | 3 | 4 | shared | có | có |
| `skill_tg_armor_break` | Phá Giáp | Kim loại | hybrid | enemy | 0.9×1 | 16 | 2 | 3 | shared | có | có |
| `skill_tg_steel_charge` | Húc Thép | Kim loại | hybrid | enemy | 2.2×1 | 28 | 3 | 3 | shared | có | có |
| `skill_hg_hot_claw` | Càng Nung | Lửa | hybrid | enemy | 1.3×1 | 8 | 0 | 3 | shared | có | có |
| `skill_hg_forge_fire` | Lửa Rèn | — | support | self | 0×1 | 12 | 3 | 3 | shared | có | có |
| `skill_hg_lava` | Phun Dung Nham | Lửa | hybrid | allEnemies | 0.9×1 | 24 | 3 | 3 | shared | có | có |
| `skill_hg_inferno_hammer` | Búa Hỏa Ngục | Lửa | hybrid | enemy | 2.3×1 | 28 | 3 | 3 | shared | có | có |
| `skill_mm_poison_thorn` | Gai Độc | Thiên nhiên | hybrid | enemy | 1.2×1 | 8 | 0 | 3 | shared | có | có |
| `skill_mm_sprout` | Chồi Non | — | support | ally | 0×1 | 12 | 2 | 3 | shared | có | có |
| `skill_mm_binding_roots` | Rễ Trói | Thiên nhiên | hybrid | allEnemies | 0.6×1 | 20 | 3 | 3 | shared | có | có |
| `skill_mm_blossom` | Hoa Hồi Sinh | — | support | allAllies | 0×1 | 24 | 4 | 3 | shared | có | có |
| `skill_hk_pure_impact` | Va Chạm Thuần | Hư Không | hybrid | enemy | 1.15×1 | 8 | 0 | 2 | shared | **thiếu** | có |
| `skill_hk_void_veil` | Màn Hư Vô | — | support | all | 0×1 | 18 | 4 | 2 | shared | **thiếu** | có |
| `skill_hk_phase_shift` | Lệch Pha | — | support | self | 0×1 | 0 | 3 | 1 | own | **thiếu** | có |
| `skill_hk_void_vortex` | Xoáy Hư Không | Hư Không | hybrid | allEnemies | 0.85×1 | 24 | 3 | 1 | own | **thiếu** | có |
| `skill_qt_prism` | Lăng Kính Tán Sắc | Ánh sáng | hybrid | allEnemies | 0.9×1 | 24 | 3 | 1 | own | **thiếu** | có |
| `skill_qt_dawn_spear` | Giáo Rạng Đông | Ánh sáng | hybrid | enemy | 0.8×3 | 22 | 3 | 1 | own | **thiếu** | có |
| `skill_hk_star_fall` | Sao Rơi Vô Định | Hư Không | hybrid | randomEnemies | 0.6×4 | 24 | 3 | 1 | own | **thiếu** | có |
| `skill_hk_null_ward` | Kết Giới Trống | — | support | allAllies | 0×1 | 20 | 4 | 1 | own | **thiếu** | có |
| `skill_nh_whirlpool` | Xoáy Nước Cổ | Nước | hybrid | allEnemies | 0.9×1 | 24 | 3 | 1 | own | **thiếu** | có |
| `skill_nh_rising_tide` | Triều Dâng | — | support | ally | 0×1 | 14 | 2 | 1 | own | **thiếu** | có |
| `skill_tg_spike_barrage` | Mưa Chông Thép | Kim loại | hybrid | randomEnemies | 0.6×4 | 24 | 3 | 1 | own | **thiếu** | có |
| `skill_tg_iron_oath` | Lời Thề Sắt | — | support | allAllies | 0×1 | 20 | 4 | 1 | own | **thiếu** | có |
| `skill_qs_boulder_roll` | Lăn Tảng | Đất | hybrid | enemy | 1.8×1 | 18 | 2 | 1 | own | **thiếu** | có |
| `skill_qs_dust_cloud` | Mây Bụi | Đất | hybrid | allEnemies | 0.6×1 | 20 | 3 | 1 | own | **thiếu** | có |

### Skills — ultimate (12)

| ID | Tên | Hệ | Kiểu | Mục tiêu | Power×đòn | MP | CD | Entity dùng | Dùng chung | Icon | Animation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skill_ult_nh` | Tiếng Hát Đại Dương | — | support | allAllies | 0×1 | Nộ | 0 | 1 | own | có | có |
| `skill_ult_qs` | Núi Thiêng Trỗi Dậy | — | support | allAllies | 0×1 | Nộ | 0 | 2 | shared | có | có |
| `skill_ult_dm` | Lưới Dệt Đêm | Bóng tối | hybrid | allEnemies | 1.5×1 | Nộ | 0 | 2 | shared | có | có |
| `skill_ult_qt` | Lồng Đèn Trung Thu | — | support | allAllies | 0×1 | Nộ | 0 | 2 | shared | có | có |
| `skill_ult_ld` | Hiệu Lệnh Sấm | Sấm | hybrid | allEnemies | 2.5×1 | Nộ | 0 | 2 | shared | có | có |
| `skill_ult_tg` | Đoàn Kỵ Thép | Kim loại | hybrid | allEnemies | 2×1 | Nộ | 0 | 4 | shared | có | có |
| `skill_ult_hg` | Lò Rèn Nguyên Thủy | Lửa | hybrid | allEnemies | 2×1 | Nộ | 0 | 2 | shared | có | có |
| `skill_ult_mm` | Rừng Mẹ Ôm Ấp | — | support | allAllies | 0×1 | Nộ | 0 | 3 | shared | có | có |
| `skill_ult_hk` | Bầu Trời Trong Chuông | Hư Không | hybrid | allEnemies | 2.2×1 | Nộ | 0 | 1 | own | có | có |
| `skill_ult_phoenix` | Phượng Hoàng Tái Sinh | Lửa | hybrid | allEnemies | 1.8×1 | Nộ | 0 | 1 | own | có | có |
| `skill_ult_trident` | Đinh Ba Hải Vương | Nước | hybrid | allEnemies | 2.2×1 | Nộ | 0 | 1 | own | có | có |
| `skill_ult_mythical` | Huyền Thoại Thức Tỉnh | Hư Không | hybrid | allEnemies | 2×1 | Nộ | 0 | 1 | own | có | có |

### Skills — class (32)

| ID | Tên | Hệ | Kiểu | Mục tiêu | Power×đòn | MP | CD | Entity dùng | Dùng chung | Icon | Animation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skill_cl_taunt` | Khiêu Khích | — | support | self | 0×1 | 8 | 2 | 5 | shared | có | có |
| `skill_cl_hold_fast` | Thủ Vững | — | support | self | 0×1 | 10 | 3 | 5 | shared | có | có |
| `skill_cl_shield_wall` | Tường Khiên | — | support | allAllies | 0×1 | 20 | 3 | 5 | shared | có | có |
| `skill_cl_second_wind` | Hồi Sức | — | support | self | 0×1 | 14 | 3 | 5 | shared | có | có |
| `skill_cl_armor_crush` | Phá Giáp | Theo hệ người dùng | physical | enemy | 0.9×1 | 14 | 2 | 5 | shared | có | có |
| `skill_cl_stomp` | Dậm Đất | Theo hệ người dùng | physical | allEnemies | 0.6×1 | 18 | 3 | 5 | shared | có | có |
| `skill_cl_fortress` | Pháo Đài Sống | — | support | self | 0×1 | 26 | 4 | 5 | shared | có | có |
| `skill_cl_tremor` | Chấn Động | Theo hệ người dùng | physical | allEnemies | 1×1 | 30 | 4 | 5 | shared | có | có |
| `skill_cl_power_strike` | Chém Mạnh | Theo hệ người dùng | physical | enemy | 1.8×1 | 10 | 1 | 9 | shared | có | có |
| `skill_cl_aim` | Ngắm Chuẩn | — | support | self | 0×1 | 8 | 3 | 9 | shared | có | có |
| `skill_cl_combo` | Liên Hoàn | Theo hệ người dùng | physical | enemy | 0.6×3 | 16 | 2 | 9 | shared | có | có |
| `skill_cl_rend` | Xé Giáp | Theo hệ người dùng | physical | enemy | 1.1×1 | 14 | 2 | 9 | shared | có | có |
| `skill_cl_dash` | Lướt Gió | — | support | self | 0×1 | 12 | 3 | 9 | shared | có | có |
| `skill_cl_vital` | Đòn Hiểm | Theo hệ người dùng | physical | enemy | 1.3×1 | 16 | 2 | 9 | shared | có | có |
| `skill_cl_finisher` | Tuyệt Kỹ | Theo hệ người dùng | physical | enemy | 3×1 | 30 | 4 | 9 | shared | có | có |
| `skill_cl_shadow_dance` | Bóng Ảnh | Theo hệ người dùng | physical | randomEnemies | 0.6×4 | 28 | 4 | 9 | shared | có | có |
| `skill_cl_energy_orb` | Cầu Năng Lượng | Theo hệ người dùng | magical | enemy | 1.5×1 | 10 | 0 | 6 | shared | có | có |
| `skill_cl_focus` | Tập Trung | — | support | self | 0×1 | 0 | 4 | 6 | shared | có | có |
| `skill_cl_elemental_rain` | Mưa Nguyên Tố | Theo hệ người dùng | magical | allEnemies | 0.95×1 | 24 | 2 | 6 | shared | có | có |
| `skill_cl_pierce` | Xuyên Phép | Theo hệ người dùng | magical | enemy | 0.9×1 | 14 | 2 | 6 | shared | có | có |
| `skill_cl_freeze` | Đóng Băng | Nước | magical | enemy | 0.8×1 | 20 | 3 | 6 | shared | có | có |
| `skill_cl_seal` | Phong Ấn | Theo hệ người dùng | magical | enemy | 0.6×1 | 18 | 3 | 6 | shared | có | có |
| `skill_cl_meteor` | Thiên Thạch | Theo hệ người dùng | magical | allEnemies | 1.6×1 | 36 | 4 | 6 | shared | có | có |
| `skill_cl_spell_storm` | Bão Phép | Theo hệ người dùng | magical | allEnemies | 0.7×1 | 30 | 4 | 6 | shared | có | có |
| `skill_cl_mend` | Hồi Phục | — | support | ally | 0×1 | 10 | 1 | 2 | shared | có | có |
| `skill_cl_cheer` | Cổ Vũ | — | support | ally | 0×1 | 10 | 2 | 2 | shared | có | có |
| `skill_cl_healing_rain` | Mưa Hồi Phục | — | support | allAllies | 0×1 | 22 | 3 | 2 | shared | có | có |
| `skill_cl_purify` | Thanh Tẩy | — | support | allAllies | 0×1 | 16 | 3 | 2 | shared | có | có |
| `skill_cl_rally` | Khích Lệ | — | support | allAllies | 0×1 | 20 | 3 | 2 | shared | **thiếu** | có |
| `skill_cl_channel` | Truyền Năng | — | support | ally | 0×1 | 0 | 3 | 2 | shared | **thiếu** | có |
| `skill_cl_undying` | Tinh Thần Bất Khuất | — | support | ally | 0×1 | 28 | 5 | 2 | shared | **thiếu** | có |
| `skill_cl_aura` | Hào Quang | — | support | allAllies | 0×1 | 28 | 4 | 2 | shared | **thiếu** | có |

### Skills — enemy (44)

| ID | Tên | Hệ | Kiểu | Mục tiêu | Power×đòn | MP | CD | Entity dùng | Dùng chung | Icon | Animation |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `skill_e_vine_lash` | Quất Dây Leo | Thiên nhiên | physical | enemy | 1.2×1 | 6 | 0 | 2 | shared | có | có |
| `skill_e_poison_spore` | Bào Tử Độc | Thiên nhiên | magical | enemy | 0.8×1 | 10 | 2 | 1 | own | có | có |
| `skill_e_spark_peck` | Mổ Tia Điện | Sấm | physical | enemy | 1.3×1 | 6 | 0 | 3 | shared | có | có |
| `skill_e_ember_bite` | Cắn Than Hồng | Lửa | physical | enemy | 1.3×1 | 8 | 1 | 2 | shared | có | có |
| `skill_e_bubble` | Phun Bọt | Nước | magical | enemy | 1×1 | 8 | 1 | 6 | shared | có | có |
| `skill_e_soothe` | Nước Mát | — | support | ally | 0×1 | 12 | 3 | 3 | shared | có | có |
| `skill_e_howl` | Tru Lên | — | support | allAllies | 0×1 | 12 | 4 | 1 | own | có | có |
| `skill_e_shadow_bite` | Cắn Trong Bóng Tối | Bóng tối | physical | enemy | 1.4×1 | 8 | 1 | 13 | shared | có | có |
| `skill_e_tusk_charge` | Húc Nanh | Đất | physical | enemy | 1.6×1 | 12 | 2 | 2 | shared | có | có |
| `skill_e_bark_skin` | Vỏ Cây Cứng | — | support | self | 0×1 | 10 | 3 | 2 | shared | có | có |
| `skill_e_root_quake` | Rễ Rung Chuyển | Thiên nhiên | magical | allEnemies | 0.9×1 | 16 | 2 | 1 | own | có | có |
| `skill_e_corrupt_bloom` | Hoa Nhiễm Độc | Thiên nhiên | magical | allEnemies | 0.5×1 | 20 | 3 | 1 | own | có | có |
| `skill_e_thorn_storm` | Bão Gai | Thiên nhiên | physical | allEnemies | 1.3×1 | 24 | 3 | 1 | own | có | có |
| `skill_e_iron_shell` | Vỏ Sắt | — | support | self | 0×1 | 10 | 3 | 6 | shared | có | có |
| `skill_e_metal_claw` | Vuốt Thép | Kim loại | physical | enemy | 1.4×1 | 8 | 1 | 2 | shared | có | có |
| `skill_e_dive` | Bổ Nhào | Sấm | physical | enemy | 1.6×1 | 10 | 2 | 3 | shared | có | có |
| `skill_e_lava_spit` | Phun Dung Nham | Lửa | magical | enemy | 1.2×1 | 10 | 1 | 2 | shared | có | có |
| `skill_e_frost_breath` | Hơi Thở Băng | Nước | magical | enemy | 1×1 | 12 | 3 | 3 | shared | có | có |
| `skill_e_rock_slam` | Nện Đá | Đất | physical | enemy | 1.5×1 | 10 | 2 | 4 | shared | có | có |
| `skill_e_thunder_charge` | Lao Sấm | Sấm | physical | allEnemies | 0.9×1 | 18 | 3 | 1 | own | có | có |
| `skill_e_magma_breath` | Hơi Thở Dung Nham | Lửa | magical | allEnemies | 1.1×1 | 20 | 3 | 1 | own | có | có |
| `skill_e_dragon_roar` | Tiếng Gầm Rồng | — | support | allAllies | 0×1 | 16 | 4 | 1 | own | có | có |
| `skill_e_meteor` | Mưa Thiên Thạch | Lửa | magical | allEnemies | 1.6×1 | 30 | 4 | 1 | own | có | có |
| `skill_e_stone_guard` | Thủ Đá | — | support | allAllies | 0×1 | 12 | 3 | 3 | shared | có | có |
| `skill_e_rune_beam` | Tia Rune | Ánh sáng | magical | enemy | 1.4×1 | 10 | 1 | 2 | shared | có | có |
| `skill_e_holy_ward` | Bùa Hộ Thân | — | support | ally | 0×1 | 14 | 3 | 1 | own | có | có |
| `skill_e_wraith_touch` | Chạm Hồn Ma | Bóng tối | magical | enemy | 1.3×1 | 12 | 2 | 3 | shared | có | có |
| `skill_e_curse` | Lời Nguyền | Bóng tối | magical | allEnemies | 0.4×1 | 16 | 3 | 5 | shared | có | có |
| `skill_e_idol_flame` | Lửa Tượng Thần | Lửa | magical | allEnemies | 1×1 | 16 | 2 | 1 | own | có | có |
| `skill_e_doom_mark` | Dấu Diệt Vong | — | support | enemy | 0×1 | 24 | 5 | 3 | shared | có | có |
| `skill_e_bronze_crush` | Nghiền Đồng | Kim loại | physical | enemy | 2×1 | 14 | 2 | 1 | own | có | có |
| `skill_e_seal_quake` | Địa Chấn Phong Ấn | Đất | physical | allEnemies | 1.3×1 | 24 | 3 | 1 | own | có | có |
| `skill_e_glare` | Chói Lòa | Ánh sáng | magical | enemy | 1×1 | 10 | 2 | 1 | own | **thiếu** | có |
| `skill_e_halo_burst` | Vầng Sáng Nổ | Ánh sáng | magical | allEnemies | 0.9×1 | 20 | 3 | 1 | own | **thiếu** | có |
| `skill_e_prism_lance` | Giáo Lăng Kính | Ánh sáng | magical | enemy | 1.7×1 | 14 | 2 | 0 | unused | **thiếu** | có |
| `skill_e_void_touch` | Chạm Hư Vô | Hư Không | magical | enemy | 1.2×1 | 10 | 1 | 0 | unused | **thiếu** | có |
| `skill_e_rift_pulse` | Xung Khe Nứt | Hư Không | magical | allEnemies | 0.8×1 | 18 | 3 | 0 | unused | **thiếu** | có |
| `skill_e_null_gaze` | Ánh Nhìn Trống Rỗng | Hư Không | magical | enemy | 1.5×1 | 14 | 2 | 0 | unused | **thiếu** | có |
| `skill_e_tide_slap` | Quật Sóng | Nước | physical | enemy | 1.3×1 | 8 | 1 | 1 | own | **thiếu** | có |
| `skill_e_whirlpool` | Xoáy Nước | Nước | magical | allEnemies | 0.9×1 | 20 | 3 | 1 | own | **thiếu** | có |
| `skill_e_shield_bash` | Húc Khiên | Kim loại | physical | enemy | 1.5×1 | 10 | 2 | 1 | own | **thiếu** | có |
| `skill_e_spike_volley` | Mưa Chông | Kim loại | physical | allEnemies | 1×1 | 18 | 3 | 1 | own | **thiếu** | có |
| `skill_e_boulder_toss` | Ném Tảng | Đất | physical | enemy | 1.7×1 | 12 | 2 | 1 | own | **thiếu** | có |
| `skill_e_sand_veil` | Màn Cát | Đất | magical | allEnemies | 0.6×1 | 16 | 3 | 1 | own | **thiếu** | có |

## Dữ liệu không đồng nhất

- `battle_fx.json creatures.pig_mythical: no combat animal or monster draws with this art id (its body plan is never used)`
- `rig octopus: no combat animal or monster has this art id (not used in battle)`
- `skill_e_prism_lance (enemy) is declared in skills.json but no entity, tree or corruption level uses it`
- `skill_e_void_touch (enemy) is declared in skills.json but no entity, tree or corruption level uses it`
- `skill_e_rift_pulse (enemy) is declared in skills.json but no entity, tree or corruption level uses it`
- `skill_e_null_gaze (enemy) is declared in skills.json but no entity, tree or corruption level uses it`

## Entity chưa đầy đủ

- `PIG_STORM` Heo Sấm: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_reef_crab` Cua Rạn: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_salt_gull` Mòng Biển Muối: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_coral_eel` Lươn San Hô: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_drift_jelly` Sứa Trôi: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_brine_wraith` Hồn Nước Mặn: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_shell_knight` Hiệp Sĩ Vỏ Ốc: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_abyss_kraken` Bạch Tuộc Vực Thẳm: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_mimic_forest` Rương Giả: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_mimic_mountain` Rương Giả: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_mimic_ruins` Rương Giả: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)
- `enemy_mimic_coast` Rương Giả: Rig hoặc key pose trận (Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh)

## Skill chưa có icon riêng (30)

`skill_hk_pure_impact`, `skill_hk_void_veil`, `skill_hk_phase_shift`, `skill_hk_void_vortex`, `skill_cl_rally`, `skill_cl_channel`, `skill_cl_undying`, `skill_cl_aura`, `skill_e_glare`, `skill_e_halo_burst`, `skill_e_prism_lance`, `skill_e_void_touch`, `skill_e_rift_pulse`, `skill_e_null_gaze`, `skill_e_tide_slap`, `skill_e_whirlpool`, `skill_e_shield_bash`, `skill_e_spike_volley`, `skill_e_boulder_toss`, `skill_e_sand_veil`, `skill_qt_prism`, `skill_qt_dawn_spear`, `skill_hk_star_fall`, `skill_hk_null_ward`, `skill_nh_whirlpool`, `skill_nh_rising_tide`, `skill_tg_spike_barrage`, `skill_tg_iron_oath`, `skill_qs_boulder_roll`, `skill_qs_dust_cloud`


## Đề xuất xử lý an toàn (chưa sửa — cần chủ dự án quyết)

1. `battle_fx.json` → `creatures.pig_mythical`: game tra kiểu thân theo **art id** (`pig_thienlong`), nên khai báo `floater` này không có tác dụng; Heo Thần Thoại đang dùng thân mặc định `quadruped`. Nếu muốn nó bay lơ lửng: đổi khoá thành `pig_thienlong` (thay đổi animation, cần duyệt theo `SKILL_ANIMATION_STANDARD.md`).
2. Rig `octopus` không gắn với chiến binh hay quái nào (dòng Dạ Mặc dùng ảnh `guardian_octopus` làm chân dung Guardian, không phải entity trận). Giữ nguyên hoặc gắn khi có entity bạch tuộc.
3. 4 skill quái chỉ khai báo (`skill_e_prism_lance`, `skill_e_void_touch`, `skill_e_rift_pulse`, `skill_e_null_gaze`): có animation riêng nhưng không quái nào dùng. Thêm vào quái là đổi gameplay → cần decision (AGENT_RULES §10).
4. Heo Sấm (`PIG_STORM`), 7 quái vùng Biển và Rương Giả (4 id dùng chung ảnh `enemy_mimic`) chưa có rig và key pose: thuộc việc art GĐ14 (`docs/ASSET_TODO.md`).
5. 30 skill chưa có icon riêng (game dùng icon nguyên tố): thuộc việc art GĐ14.
