# Bible hệ BÓNG TỐI (DARK)

Khuôn như [WATER](WATER.md). Màu: `elements.DARK` (`color #7a4ed0`, `glow #d9b8ff`); nét `swirl`, `spark ink_pop`, `boom fx_ink_splat`, rung 4. Phân biệt với Umbraflux (tha hóa — style guide §4): Bóng tối là hệ của phe ta / quái thường, **không** viền hồng răng cưa, không vệt chảy xuống.

## 1. Tính cách
Bóng tối **đặc, nhớt, rỉ ra, co rút**. Đọc khi bỏ màu: khối mực loang mép mềm, lan **chậm** rồi **co giật về**, không phản chiếu (khác Nước), mắt / hình ẩn hiện trong khói.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Hình thành | rỉ ra từ bóng dưới chân / từ khe | `decal` tối dưới chân lan ra, `prop rise` từ bóng |
| Đường đi | trườn, bò, lượn chậm rồi **phóng bất ngờ** | `prop` ease `inBack` (lùi trước khi lao), `tether` |
| Va chạm | nuốt vào (co lại) rồi bung mực | `strip fx_ink_splat`, `burst ink_spray`, `tint focus` tối quanh mục tiêu |
| Dư âm | khói tròn co lại và tan, đốm tím lơ lửng | `burst dark_smoke`, `burst dark_motes` |
| Mục tiêu | rùng mình, tint tối 1 nhịp | `glow #7a4ed0 tint`, `move shake` chậm |

## 3. Nhịp mẫu
Bàn tay ma T2: bóng lan dưới mục tiêu 300 → tay trồi **chậm** 300 → **chộp 60** + hit-stop medium → kéo xuống + mực bung 200 → khói co 500. Hệ có nhịp "chậm – chậm – NHANH" rõ nhất.

## 4. Hình chủ đạo sống
6/7 skill Bóng tối là vật tĩnh (`fxp_ghost_hand`, `fxp_nightmare_mask`, `fxp_curse_eye`, `fxp_night_net`, `fxp_octo_tentacle`, `fxs_ink_blob`). Cách rẻ: mép mờ gợn (displacement, P2) + khói tỏa từ vật (`trail dark_smoke`) + co giãn không đều (`pulse` lớn, chậm). Xúc tu: `ribbon` / `tether` có `wave` thay ảnh tĩnh.

## 5. Asset hiện có
Flipbook `fx_ink_splat` [4], `fx_poof` [4]. Vật: như trên + `fxp_doom_clock`; sprite `fxs_ink_blob`. Hạt: `dark_*`, `ink_*`, `puff_*`.
**Thiếu:** flipbook khói đặc loang / co 6 khung (lớp phủ cho vật tối).

## 6. Hiện trạng (audit)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_ult_dm` | T4/T4 | STATIC_HERO, FEW_LAYERS | xúc tu bằng ribbon gợn, mực loang toàn sân; thêm L2 |
| `skill_e_wraith_touch` | T2/**T0** | STATIC_HERO, IMPACT_UNDER_TIER, NO_AFTERMATH | thêm chộp + hit-stop medium + khói co |
| `skill_dm_nightmare` | T2/T1 | STATIC_HERO, NO_AFTERMATH | mặt nạ hiện ra từ khói, rung mắt; thêm tác động |
| `skill_e_curse`, `skill_dm_night_net`, `skill_dm_ink` | T1–T2 | STATIC_HERO | khói từ vật, dư âm |
| `skill_e_shadow_bite` | T3/T2 | FEW_LAYERS, DURATION_UNDER | thêm tác động T3 + lớp hạt |
Phản ứng `reaction_eclipse` (với Ánh sáng): vòng sáng – tối nuốt nhau.

## 7. Cấm
Viền hồng răng cưa / vệt chảy xuống (dành cho Umbraflux); bóng tối phản chiếu bóng loáng; chớp sáng mạnh; tối màn > 25% ở skill thường; hình gợi kinh dị (máu, xương) — game cozy.
