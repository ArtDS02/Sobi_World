# Sobi Studio — trạng thái (decision 051)

Cập nhật: 2026-11-07. Nhánh `phase-14-unity-studio`.

## ⛔ Hướng "tạo lại tất cả" đã DỪNG ở cổng U1

Cổng U1 (plan §7, §10.1) **không đạt** sau 2 vòng chỉnh. Theo luật, agent dừng hướng tạo lại toàn bộ asset và chờ chủ
dự án chọn: phương án hẹp (giữ Unity chỉ cho VFX / animation trên asset hiện có) hoặc bỏ hẳn. Game giữ nguyên art cũ:
không có ảnh Studio nào trong `public/assets`.

Session sau: **không làm tiếp U2 → U10**. Đọc mục "Chờ chủ dự án" ở cuối file này.

## Bảng giai đoạn

| GĐ | Trạng thái | Ghi chú |
|---|---|---|
| U0 | ✅ Xong | Unity 6000.6.8f1 (Personal, đã kích hoạt), `studio/`, CLI batchmode, `npm run studio`, render PNG alpha thẳng, QA, nhập manifest, chụp trong game |
| U1 | ❌ Không đạt (2 vòng chỉnh) | 4 mẫu dựng xong và đặt trong game cạnh bản cũ; chấm ở dưới |
| U2–U10 | ⏸ Dừng | Chờ chủ dự án chọn hướng |

## Cổng U1 — tự chấm (trung thực)

| Mẫu | Recipe | Vòng 0 → vòng 2 | (a) Đẹp hơn bản cũ? |
|---|---|---|---|
| Heo farm `pig_classic` (+ ngủ, thức) | `studio/Recipes/farm/pig_classic.json` | Dáng, tai rủ, mõm có viền, mắt decal, viền đậm, vân cọ | **Không**: thân tròn bệt, chân cụt, ít duyên hơn tranh cũ; trong game nhìn như đồ nhựa |
| Cá Vàng `fish_goldfish` (+ 3 khung bơi) | `studio/Recipes/aquarium/fish_goldfish.json` | Vây có gân, vảy, viền rõ | **Không**: sạch nhưng nghèo chi tiết; khung bơi đổi rất ít |
| Chuồng heo `prop_pig_house` (+ mùa đông) | `studio/Recipes/farm/prop_pig_house.json` | Ngói, ván, móng đá, cửa vòm, rào, hoa, tuyết; bỏ biển chữ | **Không**: đơn giản, lệch hẳn với đồ vật xung quanh trong Farm |
| Lửa `fx_flame_burst` (4 khung) | `studio/Recipes/fx/fx_flame_burst.json` | Dải màu lồng nhau, uốn cong lưỡi lửa | **Không**: lưỡi lửa tròn, kém thanh hơn tranh cũ |

- (b) Đồng bộ với nhau hơn? **Có** (cùng viền, bảng màu, cách tô).
- (c) Đáng đổi phong cách cho cả game? **Không**: chất lượng thấp hơn art hiện có, mỗi asset cần ~10 lần chỉnh tay toạ độ.

Ảnh (cũ bên trái, mới bên phải): `docs/studio/u1/` — `r0_*` vòng 0, `r2_*` vòng 2, `*_sheet` ảnh asset cạnh nhau.
Ảnh trong game chụp bằng `npx tsx scripts/studio/shots.ts --tag <tên>` (Electron offscreen, save tạm, trời nắng, 4 cá
đổi thành Cá Vàng). Lửa chưa xem trong trận thật (chỉ so sheet).

## Số asset

| Nhóm | Chưa làm | Đã render (thử) | Đã nhập vào game |
|---|---|---|---|
| Dòng manifest (2279) | 2275 | 4 dòng = 7 file (mẫu U1, chỉ trong `art_inbox/`) | 0 |

## Chờ chủ dự án

Chọn một:
1. **Phương án hẹp**: giữ Unity Studio cho VFX trận (Particle System + shader, không dựng nhân vật) và / hoặc chuyển động
   trên asset hiện có. Lưu ý: mẫu lửa SDF 2D cũng chưa đẹp hơn bản cũ, nên VFX phải thử cách khác (hạt + texture vẽ bằng
   code), có cổng riêng.
2. **Bỏ hẳn** Studio: quay về hướng cũ (tag `pre-unity-studio`); công cụ vẫn nằm trong git để tham khảo.
3. Chủ dự án thấy ảnh mới vẫn đáng làm tiếp (khác với agent chấm): agent làm tiếp U2 với các lỗi đã ghi.
