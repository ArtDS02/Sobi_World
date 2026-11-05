# ASSET_TODO — art còn thiếu hoặc là bản tạm

`npm run assets:release` chỉ qua khi hết hàng `placeholder`. Art Sobi Farm đã ổn, không đụng tới.

> **Chính sách (decision 017, gameplay trước, art sau):** danh sách này là backlog của **GĐ14** (art, animation, VFX, âm thanh). Các giai đoạn gameplay GĐ10–GĐ13 chỉ **thêm dòng** vào đây và dùng placeholder; không làm art, và không quay lại phase đã nghiệm thu để làm art hay polish UI. Ảnh tham khảo: `asset/reference/<area>/` (README ở đó). Kế hoạch batch GĐ14 (decision 022): `asset/batches/README.md`.

## Sinh vật: layer bộ phận cho puppet rig (decision 050)
4 rig chạy trên bộ phận **rig-proof** vector (manifest `rig_<rig>_*`, `placeholder`): `pig_boar`, `pig_turtle`, `fish_betta`, `octopus`. Cần layer vẽ tay theo `art_inbox/rig_README.md` + `art_inbox/rig_<rig>.md` (ảnh bố cục `rig_<rig>_guide.png`), đặt vào `asset/rigs/<rig>/layers/`, chạy `npm run rig:parts <rig>`. Sau đó: 22 combat animal + 22 quái theo `docs/animation/rig/ROADMAP.md` R2b / R3.

## Adventure: VFX theo kịch bản animation (decision 049)
Danh mục đầy đủ + đặc tả từng khung: [`docs/animation/library/scenarios/ASSETS.md`](animation/library/scenarios/ASSETS.md) (25 asset: flipbook nước, đất, lửa, thiên nhiên, kim, sấm, sáng, hư không, khiên, buff / debuff / hồi máu, va chạm chung `fx_hit_burst`). Đã có: `fx_wave_rise` (2026-11-05); còn lại chưa tạo; mọi kịch bản có phương án dự phòng bằng asset sẵn có. Thứ tự tạo đề xuất ghi cuối file đó.

## Adventure: bản đồ v3 — batch adventure-15-m2-3q (decision 046)
- **P1 (cây)** ra pixel art, lệch nền vẽ mịn: tạo lại (thêm câu "Smooth painted illustration, absolutely no pixel art." và đính kèm `BG.png` đã chốt).
- **P3** cây rỗng bị cụt tán (chỉ có thân); vòng đá, đền, bia đá dùng được. **P4** thiếu hai mảnh đầu dải (trái / phải). Cả P2–P4 có dấu sao Gemini ở góc phải dưới (agent xóa khi cắt).
- **BG** M2 chỉ 1376 × 768 (phóng ×3, hơi mềm khi xem gần): nếu Gemini có 2K / 4K thì tạo lại cùng prompt, hoặc làm lượt vẽ chi tiết theo mảnh (M2_PLAN §7).
- Lượt 3 dùng P1–P4 cho cây / bụi / landmark / tán che M2; lớp che `cover_f2_a` và vạt tha hóa ô vuông còn là hình cũ.

## Adventure: bản đồ v2 — batch adventure-14-map-v2 / 14b / 15 (decision 045)
**Đã vào game (2026-11-01):** batch `adventure-15-coast-foes` đủ 13 asset; bộ ghép vẽ lại `adventure-14b-map-v2-redo` đủ 36 sheet + CE vẽ lại + I1 (`I.png`), 248 asset đã duyệt, **151 asset kit đang dùng**: ô nền 4 vùng (mỗi ảnh phủ 2 × 2 ô), mặt vách 3/4 + bậc + thác, lớp che 4 vùng, đạo cụ theo cụm dọc đường đi, khung viền, rương 4 loại + rương giả, cơ quan câu đố, suối 4 vùng, lối ra theo kiểu + vật chắn khi khóa, tường giả, đồ tha hóa theo %, vật mốc, huy hiệu 6 loại quái (map + trận).
| Còn thiếu / bản tạm | Ghi chú |
|---|---|
| Kit đã duyệt nhưng chưa dùng | Đường đi của kit (vẽ thành một làn, lặp sẽ ra sọc: giữ ô đường cũ), ô khảm / bệ / cỏ mọc / gạch vụn Tàn Tích, ô đất tha hóa; cầu gỗ `bridge_h/v` (ô `=` vẫn dùng ô cầu cũ); đạo cụ nhỏ không có chỗ đặt trong bố cục (đèn, hàng rào, xe goòng, ray, giàn, thùng, ghế, bục sách, cờ, phao, neo, thuyền, chòi…); lớp che dạng dải (`*_band`, liễu, rễ / dây leo rủ, rèm tảo); đầu vách và bờ của Biển (CE vẽ có nước xung quanh), vách Tàn Tích (RE: Tàn Tích không có ô `F`); `chest_mimic_awake`, `bramble_ash`, bệ ánh sáng, biển chỉ đường; `corrupt_mist`, `purified_bloom`. Cần bố cục đặt đạo cụ (`props[]` theo cụm) hoặc kiểu lối ra mới để dùng. |
| Mép chuyển tiếp mềm (cỏ ↔ đường, bờ nước) | Theo decision 045 vẽ bằng code (mặt nạ bo + viền): chưa làm, ô vẫn ráp cạnh vuông. |
| Vết mờ nhỏ chỗ gỡ dấu ✦ | woodpile, mountain lantern, vines_top, ivy_stones, kelp_curtain, anchor, corrupt_tile_grass. Không chặn. |
| Vật mốc chưa có ảnh kit | Thung Nấm, Thác Rêu, Đầm Sương, Chân Núi, Đèo Gió, Hành Lang Rune, Điện Phong Ấn, Hầm Mộ Rune: dùng `prop_adv_*` cũ gần nhất. |
| Dấu tha hóa trên quái | Gân tím (cấp 3+), cụm gai (cấp 4+) phủ lên ảnh gốc; mắt phát sáng và ảnh riêng cho quái biến dị / kỳ dị / trùm phụ chưa có. |
| Key pose trận | Quái biển và `enemy_mimic` chưa có `cb_<art>_*`; trận dùng ảnh gốc. |

## Adventure: kiểu lối ra giữa các map (decision 043)
| Asset | Ghi chú |
|---|---|
| ~~Ngưỡng lối ra theo `exits[].kind`~~ | Xong 2026-11-01 (bộ ghép kit FX / MX / RX / CX): vòm, hang, đường hầm, bậc, đá bước; khóa = bụi gai / tảng đá / cổng đá đóng / vách san hô. `bridge` dùng ảnh `trail`. |

## Adventure: animation trận — batch adventure-12 / adventure-13 (decision 044)
| Asset | Ghi chú |
|---|---|
| ~~Hạt `fxs_*` (24), biểu tượng `st_*` (24), hiệu ứng 4 khung `fx_*` (22), vật thể `fxp_*` (48)~~ | Xong 2026-10-30 (batch `adventure-12-animation`, 29/29 sheet), chờ duyệt trong app. |
| `fx_shield_dome` khung 4 | Khung 4 ảnh Gemini (vòm kính trắng rất nhạt) bị mất khi xóa nền → **dựng bằng code** từ khung 3 (to 6 %, mờ 45 %). Tạo lại sheet **A11** nếu muốn khung 4 thật (vòm đậm viền hơn). |
| `fxp_*` sheet B7–B12 | Nguồn ~300 px phóng lên 512 px, hơi mềm khi phóng to giữa màn. Có thể tạo lại ở độ phân giải cao hơn. |
| ~~Key pose `cb_<art>_<pose>` 21 combat animal + 22 quái (258 ảnh)~~ | Xong 2026-10-30 (batch `adventure-13-combat-poses`), cắt bằng `cut_blobs.py`; quái có pose → xóa `facing`. `pig_crystal`: ảnh idle thành ảnh gốc (+ ngủ / thức). |
| **A08 Heo Sấm (PIG_STORM) — art gốc mới** | Thiết kế gốc (decision 048): heo xám-xanh, mây dông + tia chớp vàng trên đầu, không búa / mũ cánh / áo choàng đỏ. Đã có ảnh tạm dựng bằng code (`scripts/art/pigs.ts`, `pig_storm` + ngủ / thức). Ảnh tư thế chiến đấu và ult cut-in A08 cũ (Thor) **không dùng nữa**: làm lại theo thiết kế mới, tuân AGENT_RULES §9. |
| Nên tạo lại (không bắt buộc) | **A13** Phượng Hoàng: pose hurt / ko vẽ nhỏ hơn idle. **E04** Cáo Lửa: sheet 3 hàng, pose victory to hơn các pose khác. **E03** Chim Sẻ Sấm: sheet 3×3 (9 con), đã chọn 6 ô. **A16** Heo Ngân Hà: chỉ có bản .jpg 1024 px (mỗi ô ~340 px, hơi mềm). **E05** Ếch Sương: còn vạch đất mảnh dưới pose attack / ko. **E22** đặt tên file khác (`Chibi Golem Guardian Pose Sheet.png`), đã dùng làm E22. |
| ~~Ảnh gốc mới của 5 heo~~ | Xong 2026-10-30 (chủ dự án duyệt): `pig_phoenix`, `pig_turtle`, `pig_thienlong`, `pig_boar`, `pig_hedgehog` lấy hình chính trong `*_new*asset.png`, kèm ngủ / thức (`art:sleep`; Phượng Hoàng thêm ô mắt ở `scripts/assets/eyes.ts`). Rùa và Heo Rừng nguồn ~470–515 px nên hơi mềm. |
| **12 quái mới N01–N12 — chưa có** | Chưa render (để làm cùng đợt mở rộng map). Khi có: ảnh idle thành ảnh gốc `enemy_*`, cần decision gameplay (chỉ số, kỹ năng, vùng, rơi đồ) trước khi vào `enemies.json` / `maps.json`. |
| ~~Âm thanh trận (`AUDIO_SFX.md`, 37 id)~~ | Xong 2026-10-30: bộ `audio_v2` (CC0, tự tạo bằng code) vào `public/assets/audio/`, 37 audio key mới. Âm lượng chưa chuẩn hoá (không có ffmpeg): chỉnh `volume` trong manifest nếu to / nhỏ lệch. |

## Adventure: nhịp chơi, Vết Nứt, gắn bó (decision 039)
| Asset | Ghi chú |
|---|---|
| Nền **Vết Nứt Umbraflux** (`bg_adventure_rift`) | Hiện dùng `bg_adventure_ruins` (`content/adventure/engagement.json` → `rift.backdrop`). Tàn tích bị nứt, ánh tím Umbraflux. |
| Icon 6 biến thể quái | Hiện mượn `ui_icon_stat_atk` / `_def` / `_spd`, `ui_icon_status_wet`, `ui_icon_react_purify`, `ui_icon_coin`. Nên có huy hiệu riêng (khung vàng). |
| Sinh vật Vàng Óng trên bản đồ | Hiện nhuộm vàng (`setTint`) ảnh quái thường; có thể vẽ hào quang / lấp lánh riêng. |
| Cut-in Tuyệt kỹ, băng phản ứng, đổi pha | Hiện là băng CSS + chân dung sinh vật (`ui/battleFxView.ts`); có thể thay khung / VFX riêng 9 dòng. |
| SFX | Số bay, chí mạng, phản ứng, cut-in Tuyệt kỹ, kỷ lục Vết Nứt, nhận danh hiệu (hiện dùng `level_up` / `birth_fanfare` / `coin_collect`). |

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
| Animation trận đánh, VFX đòn / nguyên tố / trạng thái, âm thanh | **2026-10-24 (decision 040):** chuyển động bằng code (idle theo body plan, tấn công / thi triển / trúng đòn / gục, VFX theo hệ vẽ bằng CSS) đã có. Còn art: sheet VFX 9 hệ `fx_adv_<hệ>_projectile|impact`, `fx_skill_mm_poison_thorn_*`, overlay `fx_umbraflux_aura`, key pose 3 trùm, biểu cảm thắng / thua; âm thanh theo beat. Prompt: `docs/animation/prompts/`, danh sách: `docs/animation/animation_inventory.csv`. |
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

## Adventure — cập nhật lớn 1 (decision 041)
- Batch `art_inbox/.batch/adventure-big-update-1/`: mặt đau `<artId>_hurt` (44), icon sách KN / thuốc Năng Lượng / Bình Nộ / lõi trùm (8, đang tô màu tạm), cổng `adv_warp_gate` on/off, nền `bg_adventure_<vùng>_beyond` (3), 10 SFX `adv_*` thật (đang tổng hợp).
