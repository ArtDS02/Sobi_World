# 030 — Sobi Aquarium: cảnh theo 5 ảnh mẫu, mỗi cấp bể một nơi

**Ngày:** 2026-10-16 · **Trạng thái:** Agent dựng theo ảnh mẫu của chủ dự án; chờ duyệt

## Bối cảnh
Cảnh Aquarium còn vẽ bằng placeholder (bể kính, bến, nền biển). Chủ dự án đã có 5 ảnh mẫu bố cục (`art_inbox/.batch/aquarium-01-scene/aquarium-layout-1..5.png`) và ảnh Gemini của batch `aquarium-01-scene` (soạn tay 13/10): 5 nền đã xoá UI (E1–E5), sheet A (ngọc cam, đống ngọc, cần câu), D (bảng gỗ hoa, bảng trên cọc), C (Gà Mái, Gà Con), H / I (icon HUD, icon thanh dưới), F (8 cá trang trí). Decision 026 đã chốt: mỗi cấp bể là một môi trường, bố cục giống nhau.

## Quyết định
- **Nền theo cấp bể:** `bg_aquarium` (cấp 1, bể kính trên bến — bể và cần câu vẽ liền trong nền), `bg_aquarium_t2` (hồ đá), `_t3` (đầm san hô), `_t4` (vịnh tàn tích), `_t5` (biển sâu, chỗ câu là đèn treo vẽ sẵn). Ảnh 2:1 → 1800 × 900, phủ màn hình theo khung nhìn như Garden; khung thiết kế vẫn 1600 × 900, x thiết kế = x nền − 100. Xoá dấu ✦ watermark Gemini ở góc dưới phải của cả 5 nền (inpaint).
- **Bỏ dòng `bld_fish_tank`:** bể kính là một phần của nền cấp 1; các cấp khác là vùng nước mở. `bld_fish_dock` = cây cần câu (sheet A), đứng trên cầu gỗ ở góc phải trên (cấp 2–4); cấp 1 và 5 dùng vùng bấm trên chỗ câu vẽ sẵn.
- **Dòng manifest mới:** `bg_aquarium_t2..t5`, `prop_aqua_sign` (bảng "Bể cá" trên cọc, góc trái trên: mở thẻ Bể), `prop_aqua_plaque` (bảng hoa giữa đáy, ghi tên nơi: cũng mở thẻ Bể), `prop_pearl_pile`, `prop_orange_pearls` (trang trí trên cát). Trứng (`prop_fish_egg`) và đống vảy (`prop_scale_pile`, có số) dùng ảnh thật thay hình vẽ code.
- **Tên 5 nơi** (bảng chuỗi Việt / Anh): Bể Kính Bên Bến, Hồ Đá Ven Bờ, Đầm San Hô, Vịnh Ngọc Trai Cổ, Đại Dương Sâu. Nâng cấp bể thì cảnh đổi nơi ngay (cá được thả lại trong vùng nước mới).
- Cá vẽ nhỏ lại (tỉ lệ tối đa 0,8 → 0,6) cho hợp ảnh thật và bể 16 cá. Dấu "!" cạnh chỗ câu khi cần câu sẵn sàng.
- Chỉ đổi phần trình bày (`scene/`, art, chuỗi); không đổi logic, content, save. Cấp 5 vẫn chờ duyệt số (decision 026): nền đã sẵn, thêm dòng vào `tank.levels` là hiện.

## Không dùng
- Sheet C (Gà Mái, Gà Con): Gemini vẽ pixel art, lệch phong cách → loại; NPC vẫn mượn ảnh gà kem.
- Sheet F (8 cá trang trí): content có 12 loài riêng (batch `aquarium-01-fish`).
- Sheet H ô quà (`ui_hud_gift`) và sheet I ô sao biển: không có tính năng tương ứng.

## Bổ sung (chủ dự án yêu cầu, 2026-10-16): HUD theo ảnh mẫu
- **HUD trên** dùng chung bộ tím của HUD Sảnh (decision 024; token `$pz-*` và `pz-pill` chuyển sang `styles/core/_mixins.scss`): viên Sobi Coin, viên **độ trong nước %** (icon mây–giọt nước), viên cấp có ngôi sao (icon sao) + thanh KN; ba nút vuông tím có icon: Ra Sảnh (`ui_hud_hub`), Vật phẩm (`ui_hud_bag`, ba lô hồng), Menu.
- **Thanh dưới** trắng như ảnh mẫu: ô trạng thái (số cá / sức chứa, số trứng, thanh độ trong nước) + 7 thẻ kem có icon: Câu cá = cá, Cho ăn cả bể = rong, Thay nước = mây–giọt nước, Thu vảy = vỏ sò, Cá trong túi = rương, Bể cá = san hô, Cho đẻ = hoa. Thẻ tắt mờ đi và ghi lý do (dòng nhỏ + tooltip).
- Mặc định gọn để vừa cửa sổ nhỏ nhất (1024 × 640) cạnh chân dung NPC; từ 1280 px (breakpoint mới `lg`) thẻ to hơn.
- 9 dòng manifest `ui_*` mới (sheet H, I; bỏ bóng xám dưới chân icon khi cắt). Bảng "Bể cá" cấp 4–5 dời phải để chip thời tiết / lễ hội không che.
