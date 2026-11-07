# Sobi Studio — trạng thái (decision 051)

Cập nhật: 2026-11-07. Nhánh `phase-14-unity-studio`.

## ⛔ Hướng "tạo lại tất cả" đã DỪNG ở cổng U1

Cổng U1 (plan §7, §10.1) **không đạt** sau 2 vòng chỉnh. Theo luật, agent dừng hướng tạo lại toàn bộ asset và chờ chủ
dự án chọn: phương án hẹp (giữ Unity chỉ cho VFX / animation trên asset hiện có) hoặc bỏ hẳn. Game giữ nguyên art cũ:
không có ảnh Studio nào trong `public/assets`.

Session sau: **không làm tiếp U2 → U10**. Đọc mục "Chờ chủ dự án" ở cuối file này.

## ⛔ Phương án hẹp (VFX) cũng không đạt cổng riêng (2026-11-07)

Chủ dự án chọn thử phương án hẹp. Cổng: 3 hiệu ứng của 3 hệ cạnh bản cũ — `fx_flame_burst` (Lửa), `fx_splash`
(Nước), `fx_slash_arc` (Kim), giữ 4 khung 256 px như cũ. Thêm vào renderer: hình **nét cọ** `stroke` (đường cong
Bézier thuôn, `taper` > 0 đầu nhọn / < 0 lưỡi liềm) và **xếp lớp** ở chế độ 2D (mỗi nhóm một lớp, vẽ đè theo thứ tự).
Bản đầu + 2 vòng chỉnh, tự chấm ở độ phân giải đầy đủ:

| Hiệu ứng | Đẹp hơn bản cũ? |
|---|---|
| Lửa | **Không**: lưỡi lửa thô hơn, khung "tan" còn chạm mép |
| Tia nước | **Không**: như vương miện gai, kém dễ đọc hơn bản cũ |
| Vệt chém | **Không** (tối đa ngang bằng): có vệt tốc độ nhưng dáng như chùm cong, chạm mép trên |

Không nhập vào game (chỉ render `--no-import`), nên **chưa xem trong trận thật**: ảnh sheet đã cho thấy không hơn bản
cũ, thay bằng bản ngang hoặc kém thì không có lợi. Ảnh: `docs/studio/u1/vfx_r2_*.png` (cũ trái, mới phải).
Nguyên nhân chung với U1: agent đặt hình bằng toạ độ số rồi mới nhìn thấy kết quả; mỗi hiệu ứng cần rất nhiều vòng mà
vẫn kém tranh vẽ sẵn.

## Bảng giai đoạn

| GĐ | Trạng thái | Ghi chú |
|---|---|---|
| U0 | ✅ Xong | Unity 6000.6.8f1 (Personal, đã kích hoạt), `studio/`, CLI batchmode, `npm run studio`, render PNG alpha thẳng, QA, nhập manifest, chụp trong game |
| U1 | ❌ Không đạt (2 vòng chỉnh) | 4 mẫu dựng xong và đặt trong game cạnh bản cũ; chấm ở dưới |
| U2–U10 | ⏸ Dừng | Chờ chủ dự án chọn hướng |
| VFX hẹp | ❌ Không đạt (2 vòng chỉnh) | 3 hiệu ứng, không nhập vào game |

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

Cả hướng "tạo lại tất cả" (U1) và phương án hẹp VFX đều không đạt. Agent đề nghị **bỏ Studio cho việc tạo hình**, quay
về hướng cũ (tag `pre-unity-studio`, art Gemini hiện có); công cụ `studio/` + `scripts/studio/` để lại trong git
(không ảnh hưởng game, có thể xoá sau). Nếu chủ dự án vẫn muốn dùng Unity, việc hợp nhất còn lại là chuyển động / hiệu
ứng phụ trên chính tranh hiện có (rung, loé sáng, hạt bụi), không vẽ hình mới — cần quyết định riêng.
