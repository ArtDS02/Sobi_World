# Sobi Studio — trạng thái (decision 051)

Cập nhật: 2026-11-07. Nhánh `phase-14-unity-studio`.

## ✅ VFX bằng CHUYỂN ĐỘNG trên tranh đã duyệt — ĐẠT cổng thử (2026-11-08)

Chủ dự án làm rõ: Unity chỉ **tạo chuyển động cho hiệu ứng có sẵn**, không vẽ hình. Studio thêm chế độ diễn hoạt tranh
(`shape: "image"`): nguồn là sheet đã duyệt ở tag `pre-unity-studio`; co giãn có nảy (`stretch`), lay sóng
(`sway`), tan theo vân (`dissolve`), quét theo cung (`wipe`), hạt cắt từ chính tranh có trọng lực (`emitters`).
3 hiệu ứng thử, 8 khung @24 fps = 340 ms như 4 khung cũ @12 fps (`src/areas/adventure/scene/battle/stripTiming.ts`:
mọi sheet 12 fps chạy y như trước):

| Hiệu ứng | Hình giữ nguyên? | Chuyển động mượt / sinh động hơn? |
|---|---|---|
| `fx_splash` | Có | **Có, rõ** — vương miện mọc lên từ vòng nước, sụp xuống, giọt rơi, vũng loang |
| `fx_slash_arc` | Có | **Có** — lưỡi liềm quét theo cung, bóng mờ, mỏng dần, vỡ mảnh |
| `fx_flame_burst` | Có | **Có, vừa** — vươn lên có nảy, giữ ngọn lớn lâu hơn, lay, vỡ thành lưỡi, tàn |

Kiểm trong trận thật (Battle Lab, `npm run anim:capture`, mỗi 40 ms, cùng mốc thời gian cũ / mới):
`docs/studio/vfx/battle_*.png` (hàng trên cũ, hàng dưới mới); sheet `docs/studio/vfx/sheet_*.png` (cũ 4 khung | mới 8
khung). Cổng "tất định" của công cụ chụp trượt cả trên asset cũ ở máy này nên chạy bản sao tạm bỏ qua cổng đó (đã xoá).
Còn: khung chuyển tiếp tan theo vân hơi lốm đốm; bộ nhớ sheet gấp đôi (256² × 8 ≈ 2 MB GPU / hiệu ứng).
**Đã nhập vào game 3 hiệu ứng này.** 20 sheet trận còn lại: chờ chủ dự án đồng ý làm tiếp.

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
| VFX hẹp (vẽ hình) | ❌ Không đạt (2 vòng chỉnh) | 3 hiệu ứng, không nhập vào game |
| VFX chuyển động | ✅ Đạt cổng thử (2 vòng chỉnh) | 3 hiệu ứng đã nhập; 20 sheet trận còn lại chờ |

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

Đồng ý làm chuyển động cho **20 sheet trận còn lại** (`fx_pow_star`, `fx_boom`, `fx_claw`, `fx_poof`,
`fx_ink_splat`, `fx_wave_rise`, `fx_ice_encase`, `fx_ice_shatter`, `fx_bloom`, `fx_vine_grab`, `fx_rock_spike`,
`fx_lava_pop`, `fx_bolt_strike`, `fx_light_pillar`, `fx_void_portal`, `fx_wind_swirl`, `fx_rune_lock`, `fx_bite`,
`fx_shield_dome`, `fx_ground_crack`) theo cùng cách? Lưu ý khi làm: `fx_ice_encase` có `cover.frame` (huy hiệu trạng thái)
và một số đòn gọi `frames: [a, b]` / `decal.frame` theo chỉ số khung 4 — phải đổi chỉ số tương ứng khi lên 8 khung.
Hướng vẽ hình bằng Unity (U1, VFX vẽ hình) giữ trạng thái dừng.
