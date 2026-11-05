# Bible hệ LỬA (FIRE)

Khuôn như [WATER](WATER.md). Màu: `elements.FIRE` (`color #ff7a2a`, `glow #ffd36a`); `spark ember_pop`, `boom fx_flame_burst`, rung mặc định 6.

## 1. Tính cách
Lửa **nhẹ, bốc lên, đói, không giữ hình**. Đọc khi bỏ màu: lưỡi lửa hình giọt nước ngược, **mọi thứ đi lên** (tàn, khói), viền liên tục đổi hình, nổ tung tóe.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Khối lượng | nhẹ; phần nặng duy nhất là than / dung nham / thiên thạch | dung nham, thiên thạch: `fall` / `throw` arc cao |
| Đường đi | cung thấp, **tăng tốc** | `prop fly` (inQuad), `trail fire_trail` |
| Hình thành | bén từ đáy, liếm lên, lớn dần | `burst ember_rise` hút vào + `strip fx_flame_burst` nhỏ dưới tay |
| Va chạm | nổ, tàn bay **lên** và ra | `strip $boom`, `burst ember_spray`, `flash` cam ≤ 0,3 |
| Dư âm | khói xám ấm bốc chậm, tàn rơi lả tả, vết cháy | `burst fire_smoke`, `burst ember_fall`, `decal scorch` |
| Mục tiêu | giật + thân tint cam 1 nhịp, khói nhỏ trên đầu | `glow #ff7a2a`, `move knock` |

## 3. Nhịp mẫu
Đạn lửa T2: chuẩn bị 250 · bén 150 · bay 300 (tăng tốc) · nổ 80 + hit-stop medium · khói 500. Đập lửa T3 (búa): giơ cao chậm 400 → **nện 80** + medium + `punch 1.04` → sóng lửa lan trên đất 300 → khói 500.

## 4. Hình chủ đạo sống
Lửa là hệ **cần biến hình nhất**: ngọn lửa đứng yên trong 1 ảnh là lỗi rõ nhất. Vật lửa tĩnh (`fxp_flame_crown`, `fxp_fire_hammer`, `fxp_phoenix`, `fxp_meteor`) phải kèm: `trail ember_trail` dày (every 40–60) + lớp lửa phủ là flipbook / displacement nhiễu chạy **lên trên** (thử cùng P2) + flicker sáng (`glow` nhấp nháy nhẹ, ≤ 3 lần/giây).

## 5. Asset hiện có
Flipbook `fx_flame_burst` [4] (9 skill — quá tải), `fx_lava_pop` [4]. Vật: `fxp_flame_crown`, `fxp_meteor`, `fxp_fire_hammer`, `fxp_forge_anvil`, `fxp_phoenix`; sprite `fxs_ember`, `fxs_feather_fire`. Hạt: `fire_*`, `ember_*`, `firefeather_*`.
**Thiếu:** flipbook ngọn lửa cháy liên tục (loop 6–8 khung) làm lớp phủ cho mọi vật lửa; flipbook nổ lửa thứ hai (khác `fx_flame_burst`) cho đòn T3+.

## 6. Hiện trạng (audit 2026-11-05)
| Skill | Bậc | Hình chủ đạo | Cờ chính | Hướng |
|---|---|---|---|---|
| `skill_ult_phoenix` | T4/T4 | `fxp_phoenix` tĩnh | STATIC_HERO | cánh lửa cháy (lớp phủ loop), lông lửa rơi, bay vòng có kéo giãn |
| `skill_ult_hg` | T4/T4 | `fxp_forge_anvil` tĩnh | STATIC_HERO, FEW_LAYERS | đe nung đỏ rực dần (glow), tia lửa mỗi nhịp nện; thêm L2 |
| `skill_hg_inferno_hammer` | T3/T4 | `fxp_fire_hammer` tĩnh | STATIC_HERO | búa giơ chậm có vệt lửa, nện + sóng lửa trên đất |
| `skill_e_meteor` | T3/T4 | `fxp_meteor` tĩnh | STATIC_HERO, DURATION_OVER | đuôi lửa dài kéo giãn, bóng báo trước, nhiều thiên thạch lệch nhịp, rút ngắn |
| `skill_e_idol_flame`, `skill_e_lava_spit` | T2/T3 | vật tĩnh | STATIC_HERO, NO_AFTERMATH | thêm khói + vết cháy |
| `skill_hg_hot_claw`, `skill_e_ember_bite`, `skill_e_magma_breath` | T2/T3–4 | `fx_flame_burst` dùng chung | SHARED_FLIPBOOK_HERO; magma: IMPACT_OVER_TIER | hạ tác động magma về T2–T3; flipbook nổ thứ hai |
| `skill_hg_lava` | T2/T3 | `fx_lava_pop` | DURATION_OVER | rút ngắn |
Phản ứng `reaction_wildfire`, `reaction_steam` (với Nước): hơi nước phải **xoắn lên** và có âm xì riêng (hiện dùng âm lửa).

## 7. Cấm
Lửa rơi xuống như nước; tàn tròn đều như bong bóng; ngọn lửa không đổi hình; chớp cam toàn màn ở skill thường; khói đen đặc che sinh vật (> 1 khung).
