# ASSET_TODO — art còn thiếu hoặc là bản tạm

`npm run assets:release` chỉ qua khi hết hàng `placeholder`. Art Sobi Farm đã ổn, không đụng tới.

> **Chính sách (decision 017, gameplay trước, art sau):** danh sách này là backlog của **GĐ14** (art, animation, VFX, âm thanh). Các giai đoạn gameplay GĐ10–GĐ13 chỉ **thêm dòng** vào đây và dùng placeholder; không làm art, và không quay lại phase đã nghiệm thu để làm art hay polish UI. Ảnh tham khảo: `asset/reference/<area>/` (README ở đó). Kế hoạch batch GĐ14 (decision 022): `asset/batches/README.md`.

## Adventure V2 (decision 037) — làm ở A7
| Asset | Ghi chú |
|---|---|
| Nền 9 khu (3 vùng × 3 khu, cuộn ~1,5–2 màn hình) | Góc nhìn 3/4 từ trên, style Sobi Farm; vẽ khớp lưới 40 px (vách, nước = ô chặn). |
| ~~Đạo cụ bản đồ 24 loại~~ | Xong 2026-10-17 (batch `adventure-02-maps`, P1–P3). |
| ~~Cổng dịch chuyển, 8 cổng nguyên tố, suối, bia lore, đền Guardian, lữ khách, điểm thảo dược / quặng, 3 kẻ canh khu, 10 vật phẩm~~ | Xong 2026-10-17 (batch `adventure-02-maps`, T1, G1, E1, I1). |
| ~~`adv_chest_open` (rương đã mở)~~ | Xong 2026-10-23 (batch `adventure-06-tiles` C1, bản `_b`). |
| ~~**Làm lại giao diện Adventure theo ảnh mẫu**~~ | Xong 2026-10-23: 212 asset từ 8 batch `adventure-03..10` vào game (manifest + `art:process`), 19 kẻ địch và 3 nền vùng lên production; Trại / Trận / Bản đồ dựng lại theo ảnh mẫu (`art_inbox/.batch/adventure-03-layout/`); emoji hệ / class / trạng thái thay bằng icon; bản đồ rắc decal theo seed; ô đất làm liền mép bằng code. Chờ chủ dự án duyệt. |
| **Cần tạo lại** (prompt mới đã có trong `PROMPT.md`) | `adventure-08-skills` sheet **K5** (4 kỹ năng Sứa Hư Không: lần 1 vẽ dải cỏ dưới mỗi ô và trùng 2 hàng); `adventure-09-skills-class` sheet **CP2** (Cổ Vũ Toàn Đội, Truyền Năng, Bất Khuất, Hào Quang: sheet CP lần 1 vẽ lặp hàng trên). Trong game các kỹ năng này dùng huy hiệu hệ thay icon. |
| Nên tạo lại (không bắt buộc) | `adventure-08-skills` **K2** và `adventure-10-skills-enemy` **E1**: Gemini vẽ thẻ đứng (≈ 4:5) thay vì ô vuông, trong game hơi hẹp hơn các icon khác. `adventure-06-tiles` **T3**: ô `ruins_ground` (đá lát + rêu) sau khi làm liền mép bằng code hơi nhoè, `ruins_wall` mép trên / dưới không khớp hoa văn. Nền trận B1–B4 là ảnh 1376 px phóng lên 1600 px (hơi mềm). |
| Tự sửa khi cắt (không cần tạo lại) | Gỡ dấu ✦ Gemini bằng đảo phép trộn alpha (trong bộ nhớ, sheet gốc giữ nguyên); sheet vẽ trùng 2 hàng (U1, T1–T3, F1, M1, K5, CP) lấy đúng ô; bỏ chữ dưới icon (K4, CT, E3); lật ngang 8 kẻ địch quay phải (Ếch Sương, Sói Rừng, Heo Rừng Gai, Bọ Đá, Diều Hâu Vách Đá, Sa Giông Dung Nham, Dê Tuyết, Hộ Pháp Cổ Đại) để mọi kẻ địch nhìn sang trái; 15 ô đất làm liền mép (trộn với bản dịch nửa ô). |
| VFX 9 hệ, phản ứng, cut-in Ultimate 9 dòng | |
| So / Bi đi bộ (đã có `chr_so` / `chr_bi`, bản tạm) | Vẽ lại theo style chuẩn nếu cần. |
| ~~Sprite 9 First Guardians + tranh truyền thuyết~~ | Xong 2026-10-17 (batch `adventure-01-guardians` G1–G3, A1): chân dung trong hồ sơ chiến binh, tranh ở đầu Trại. |
| 32 hậu duệ (sheet D1–D4 đã có ảnh trong `art_inbox/.candidates/`) | Chưa vào game: 30 loài hậu duệ là gameplay để sau (decision 037). `pig_knight` trong sheet D1 trùng id heo đã có, không ghi đè. |

## GĐ14 — Chữa bệnh tất cả (Farm, Aquarium)
| Việc | Ghi chú |
|---|---|
| `fx_syringe` | Mũi tiêm chích vào heo / cá khi khỏi bệnh (chữa từng con và chữa tất cả); đang vẽ bằng code trong `src/ui/world/syringe.ts`. Prompt `art_inbox/.batch/fx-01-syringe/PROMPT.md`. Code tự dùng ảnh khi manifest có id. |
| Âm thanh chích thuốc | Chưa có SFX riêng: Farm dùng `ui_click`, Aquarium `level_up` như chữa từng con. |

## GĐ14 — Aquarium: cho ăn / thay nước (decision 032)
| Việc | Ghi chú |
|---|---|
| `fx_fish_pellet`, `fx_water_ripple` | Đang vẽ bằng code trong `aquariumFx.ts`; prompt `art_inbox/.batch/aquarium-03-fx/PROMPT.md`. Code tự dùng ảnh khi manifest có id. |
| `prop_drone_aquarium`, `prop_drone_water` (decision 033) | Drone thức ăn / drone nước; đang mượn `prop_drone_garden` / `prop_drone_cloud`. Prompt sheet W cùng file. |
| `ui_hud_bell` (decision 034) | Icon chuông thông báo, đang là SVG trong `guideLayer.ts`. Prompt sheet S của `aquarium-03-fx` (ô 2). |

## GĐ12 — Thế giới động
Tất cả là placeholder (CSS, ký tự) — làm art ở GĐ14 (decision 017):
| Việc | Ghi chú |
|---|---|
| Hiệu ứng thời tiết | Lớp CSS `.sky__fx` (tông màu, vệt mưa, tuyết, vòng cầu vồng) phủ lên mọi Area; cần VFX thật theo từng Area (mưa trên ruộng và mặt nước gợn sóng, sương trên bến, tuyết đọng, cầu vồng thật), cùng tông ánh sáng ngày / đêm và âm thanh mưa, gió. |
| Biểu tượng thời tiết (`WEATHER_GLYPH`) | Đang là ký tự (☀ ☂ ☁ ❄ 🌈); cần 5 icon cho chip, popup Thời tiết và dự báo. |
| Lễ hội (4) | Chip chỉ là ★ + chữ; cần banner / cờ trang trí Sảnh và từng Area theo lễ hội (Thu hoạch, Cá, Hoa, Heo), icon Vé Lễ Hội (hiện dùng icon xu), `artId` của mỗi lễ hội đang mượn ảnh `prop_animal_*`. |
| Đồ trang trí độc quyền lễ hội | Chưa có (cần art); cửa hàng lễ hội hiện chỉ bán vật phẩm sẵn có. |
| Thương nhân | Dùng ảnh `prop_animal_llama`; cần sạp hàng trong Sảnh (chỉ hiện khi ông ghé), ảnh Thương nhân riêng, hiệu ứng đến / đi. |
| Toast "lễ hội bắt đầu / Thương nhân đến" và dòng lễ hội trong màn "vắng mặt" | Chưa có (cần chữ và âm báo). |

## GĐ11 — Adventure liên hệ thống
Tất cả là placeholder sinh bằng `npm run assets:placeholders` (decision 017: làm art ở GĐ14):
| Việc | Ghi chú |
|---|---|
| ~~11 kẻ địch mới `enemy_*`~~ (xong 2026-10-23, batch `adventure-07-enemies`) | Núi: Bọ Đá, Diều Hâu Vách Đá, Sa Giông Dung Nham, Dê Tuyết, Tượng Quặng (240×240), Rồng Dung Nham (trùm 320×360). Tàn Tích: Lính Gác Đá, Hồn Rune, Bóng Thủy Triều, Tượng Thần Lửa, Hộ Pháp Cổ Đại (trùm 320×360). |
| ~~`bg_adventure_mountain`, `bg_adventure_ruins` (1600×900)~~ (xong 2026-10-23, `adventure-05-scenes`) | Nền hai vùng mới. |
| 10 icon `ui_item_*` (128×128) | Quặng Núi, Bánh Răng Cổ, Rune Cổ, 3 khẩu phần, Trứng Heo Hoang, 3 trang bị Sử thi (Kiếm Rune, Giáp Đá Cổ, Bùa Rune Cổ). |
| Panel Công nghệ | Đang là danh sách thẻ chữ; cần icon cho 4 công nghệ (xưởng, lò, bếp, lều) và hiệu ứng khi nâng cấp. |
| Quả trứng nở ở Nông trại | Chỉ có toast và tiếng `birth_fanfare`; cần animation trứng nở. |

## GĐ10 — Sobi Adventure
Tất cả là placeholder sinh bằng `npm run assets:placeholders` (decision 017: làm art ở GĐ14):
| Việc | Ghi chú |
|---|---|
| ~~8 kẻ địch `enemy_*` (192×192, trùm Cổ Thụ 320×360, nhìn sang trái)~~ (xong 2026-10-23, `adventure-07-enemies`) | Rêu Con, Mầm Gai, Chim Sẻ Gió, Cáo Lửa, Ếch Sương, Sói Rừng, Heo Rừng Gai, Cổ Thụ Giận Dữ. Chưa có ảnh tham khảo bộ kẻ địch (thêm vào `asset/reference/sobi_adventure/` nếu có). |
| ~~`bg_adventure_forest` (1600×900)~~ (xong 2026-10-23, `adventure-05-scenes`) | Nền Rừng Thì Thầm (cảnh chỉ vẽ nền, UI ở DOM). |
| 11 icon `ui_item_equip_*`, `ui_item_forest_herb`, `ui_item_beast_fang` (128×128) | 9 trang bị (vũ khí, giáp, bùa × 3 bậc) và 2 vật liệu. |
| Ảnh Hiệp Sĩ Heo (`npc_knight`) | Đang dùng ảnh heo `prop_animal_pig_a`. |
| Animation trận đánh, VFX đòn / nguyên tố / trạng thái, âm thanh | Hiện chỉ có chữ nhật ký và âm UI có sẵn. |
| Bản đồ chuyến có nhân vật đi | Manifest ghi `movement: character`; GĐ10 dùng chuỗi nút. |

## GĐ9 — Sobi Cloud
> **GĐ14 (2026-10-12):** 43/44 asset Cloud đã có art thật (hoa, icon, suối, vạc, ô mây; batch `cloud-0*`), chờ chủ dự án duyệt. Còn: `bg_cloud` (ảnh Gemini có watermark hiển thị, cần tạo lại) và nối ảnh nền vào CloudScene; ảnh riêng Bác Cú Giả Kim.

Ảnh tham khảo (do chủ dự án cấp): `asset/reference/sobi_cloud/` (loại CONTENT: chỉ gợi ý hình dáng, phong cách theo Sobi Farm). Batch: `cloud-01-flowers`, `cloud-02-items`, `cloud-03-world`.
| Thứ cần ở GĐ9 | Có trong ảnh tham khảo | Ghi chú |
|---|---|---|
| Hạt (`ui_item_seed_*`) | "Hạt Giống" (gói hạt Economy / Item / Material / Mystery) | Dùng kiểu gói hạt, đổi hình hoa trên gói theo từng loài. |
| Hoa (`flower_*` 4 giai đoạn) | "Cây Hoa" (mầm → cây → nở, trong chậu), hoa trên các Tầng mây | Bản tham khảo là cây trong chậu; cần vẽ lại theo từng loài (Cúc, Bồ Công Anh, Hồng, Lan, Huệ, Chuông) và ô mây trống. |
| Potion (`ui_item_potion_*`) | Lọ thuốc ở "Dụng cụ và tiêu dùng" (Phân Bón Đặc Biệt), "Túi Nước May Mắn" | Lấy dáng lọ; cần 3 màu (xanh lá / hồng / tím). |
| Nước tinh khiết, suối mây | Không có đúng hình ("Túi Nước May Mắn" gần nhất) | Cần vẽ mới. |
| Vạc nấu (`bld_cauldron`) | "Chậu Lửa Rồng", "Forged Pots" (gần nhất) | Cần vẽ mới theo phong cách đó. |
| Ô mây (`plot_cloud`), nền (`bg_cloud`) | "Tầng 1 / Tầng 2" các tầng mây | Dùng được cho ô mây và nền. |
| NPC Cú Giả Kim | Không có ("Thương Gia Chim Mây" cùng phong cách) | Cần vẽ mới. |
Ngoài phạm vi GĐ9 (để dành sau): chậu hoa 4 bậc hiếm, tầng mây theo mùa, Cửa hàng / Lò Rèn / Viện Nghiên Cứu / Kho, sóc và chim gõ kiến trợ thủ, hiệu ứng thời tiết (cầu vồng, mưa, tuyết), Tháp Viễn Vọng, Trạm Hơi Nước, thợ rèn.
Tất cả là placeholder sinh bằng `npm run assets:placeholders`:
| Việc | Ghi chú |
|---|---|
| 6 hoa × 4 giai đoạn `flower_<hoa>_<sprout|grow|ripe|wilt>` (152×132, chân ở đáy) | Cúc Mây, Bồ Công Anh Mây, Hồng Cầu Vồng, Lan Sao, Huệ Trăng, Chuông Mộng. |
| `plot_cloud` (152×108), `bld_cloud_spring` (220×240), `bld_cauldron` (220×220), `bg_cloud` (1600×900) | Ô mây, suối, vạc, nền trời; vị trí ở `scene/cloudView.ts`. |
| 16 icon `ui_item_seed_*`, `ui_item_flower_*`, `ui_item_pure_water`, `ui_item_potion_*` (128×128) | Hiện là hình khối màu. |
| Ảnh Bác Cú Giả Kim (`npc_alchemist`) | Đang dùng ảnh gà kem `prop_animal_hen_cream`. |

## GĐ8 — Sobi Aquarium
Tất cả là placeholder sinh bằng `npm run assets:placeholders` (chưa có ảnh tham khảo dùng được ở `asset/reference/sobi_aquarium`):
| Việc | Ghi chú |
|---|---|
| 12 cá `fish_<loài>` (192×120, nhìn ngang, quay sang phải) | Cá Vàng, Rô, Chép, Hề, Nóc, Thiên Thần, Phát Sáng, Betta, Đèn Lồng, Ngựa, Koi Rồng, Trăng; mỗi loài một màu. Nên có thêm biến thể bệnh / đói nếu muốn. |
| ~~`bld_fish_tank`, `bld_fish_dock`, `bg_aquarium`~~ | **Xong GĐ14 (decision 030):** 5 nền theo cấp bể `bg_aquarium`, `bg_aquarium_t2..t5` (bể kính vẽ liền trong nền cấp 1, bỏ dòng `bld_fish_tank`), `bld_fish_dock` = cần câu, bảng `prop_aqua_sign`, `prop_aqua_plaque`, ngọc trang trí. HUD / thanh nút theo ảnh mẫu (icon sheet H, I) cũng xong. Còn: ảnh Gà Mái (sheet C vẽ pixel art, loại). |
| 15 icon vật phẩm `ui_item_fish_*`, `ui_item_scale`, `ui_item_pearl`, `ui_item_food_fish` (128×128) | Icon cá hiện là hình cá cùng màu. |
| Ảnh cô Gà Mơ Màng (`npc_fisher`) | Đang dùng ảnh gà kem `prop_animal_hen_cream`. |
| Cây cần câu, phao, hiệu ứng nước bắn khi câu được; âm thanh riêng (nước, câu) | Chưa có: dùng bộ âm có sẵn (`water_splash`, `coin_collect`). |

## GĐ7 — Lai giống nâng cao
| Việc | Ghi chú |
|---|---|
| 6 giống heo mới: `pig_mushroom`, `pig_firefly`, `pig_cloud`, `pig_coral`, `pig_crystal`, `pig_aurora` (mỗi giống 3 ảnh: đứng, ngủ, thức, như các giống khác) | Placeholder sinh bằng `npm run assets:placeholders` (màu theo giống). Heo Nấm, Đom Đóm, Mây, San Hô, Pha Lê, Cực Quang; mô tả ngoại hình trong `docs/decisions/014-advanced-breeding.md`. |
| Icon cho tính trạng | Hiện là chip chữ; chưa có icon riêng cho 11 tính trạng. |
| Ảnh bà Ngan Lai (Nhà lai giống) | Đang dùng ảnh vịt của bác Vịt Cần (`prop_animal_duck`). |

## GĐ5 — Sobi Garden
**GĐ14 (2026-10-16):** 38 dòng dưới đây đã có art thật (batch `garden-01..03`, status `production`, chờ duyệt). Cảnh dựng lại theo ảnh mẫu (decision 027): nền `bg_garden`. Khu trồng, vòi phun, drone (decision 028). Cửa hàng + vườn sống động, HUD tông trắng–tím (decision 029). Drone, sạp hàng, vòi tưới cấp 2–5 đã có art (batch `drone-01`, `extras-01`). Còn lại: âm thanh riêng.
| Việc | Ghi chú |
|---|---|
| Ô đất `plot_soil`, `plot_soil_wet`, `plot_locked` (152×108) | đất khô, đất ướt, ô chưa mở |
| 5 cây × 4 giai đoạn `crop_<cây>_{sprout,grow,ripe,wilt}` (152×132, chân ở đáy) | cỏ, lúa mì, bắp, khoai tây, cà rốt |
| `bld_feed_mill` (260×260), `bld_composter` (220×200), `bld_sprinkler` (120×200) | Máy xay, Thùng ủ, Vòi tưới |
| 12 icon vật phẩm `ui_item_*` (128×128) | 5 hạt, 5 nông sản, thức ăn cao cấp, phân bón |
| Nền Garden | vẽ bằng code (`GardenScene.paintGround`), chưa có ảnh; còn thiếu đường, hàng rào, cây quanh vườn |
| Âm thanh | dùng chung bộ có sẵn (`water_splash`, `feed_munch`…); chưa có tiếng riêng cho gieo / xay |

## GĐ4 — Bản cài
| Việc | Ghi chú |
|---|---|
| Icon app Sobi World (`build/icon.png` 1024, `build/icon.ico` 256) | Vẫn là mặt heo hồng vẽ bằng script (`npm run icon`). Thay bằng art thật rồi chạy lại `npm run dist:win`. |

## GĐ3 — Nhân vật và Sảnh
Đã có (cắt từ `asset/reference/sobi_world`, `npx tsx scripts/cut-plaza.ts`, ảnh mô phỏng nên là bản tạm cho tới khi có art gốc): nhân vật So và Bi, mỗi người 12 khung (`chr_so`, `chr_bi`, 96×144), cổng Adventure / Garden / Aquarium / Cloud, đài phun nước, ghế, đèn, thuyền, cây, rương, rơm, biển gỗ.

Còn thiếu:
| Việc | Ghi chú |
|---|---|
| `ui_icon_lock` (128×128) | Ổ khóa trên cổng chưa mở: vẫn là placeholder. |
| Trạng thái khóa riêng của từng cổng | Hiện cổng khóa = ảnh cổng bị làm tối + ổ khóa. Spec §3.1: rào, mây che, cổng tắt. |
| Bảng đơn hàng, Chợ, NPC ở Sảnh | GĐ6. |
| Art Sobi Garden / Aquarium / Cloud / Adventure | Ảnh tham khảo ở `asset/reference/sobi_{garden,aquarium,cloud}`; làm cùng từng Area. |
