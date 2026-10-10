# ASSET_TODO — art còn thiếu hoặc là bản tạm

`npm run assets:release` chỉ qua khi hết hàng `placeholder`. Art Sobi Farm đã ổn, không đụng tới.

## GĐ9 — Sobi Cloud
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
| `bld_fish_tank` (640×400), `bld_fish_dock` (520×300), `bg_aquarium` (1600×900) | Bể kính, bến câu (cây cần vẽ trên bến), nền biển. Vị trí nước trong bể ở `scene/aquariumView.ts` (`water`) phải khớp art thật. |
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
Tất cả là placeholder sinh bằng `npm run assets:placeholders` (chưa có ảnh tham khảo `asset/reference/sobi_garden`):
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
| Nhân vật Kai (nam) | Có trong ảnh `sobi_world_character_moving.png`; game hiện chỉ dùng Sobi. |
| Nền đất, đường, bãi cát, biển | Hiện vẽ bằng hình tô màu trong cảnh (`content/plaza/layout.json` → `ground`). Ảnh tham khảo có ô nền (cỏ, đá lát, đường đất, biển) để cắt thành tile. |
| Bảng đơn hàng, Chợ, NPC ở Sảnh | GĐ6. |
| Art Sobi Garden / Aquarium / Cloud / Adventure | Ảnh tham khảo ở `asset/reference/sobi_{garden,aquarium,cloud}`; làm cùng từng Area. |
