# Bible hệ ĐẤT (EARTH)

Khuôn như [WATER](WATER.md). Màu: `elements.EARTH` (`color #c08a50`, `glow #f6deb0`); `spark pebble_pop`, `boom fx_rock_spike`, rung mặc định **10** (cao nhất).

## 1. Tính cách
Đất **rất nặng, chậm khởi động, dừng phịch**. Đọc khi bỏ màu: khối góc cạnh, **rơi thẳng / trồi thẳng**, va chạm làm **cả mặt đất phản ứng** (nứt, bụi vòng, sinh vật nảy lên).

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Hình thành | báo trước bằng **rung + nứt** dưới chân rồi mới trồi | `move shake` (nhỏ) + `decal crack` trước, rồi `prop rise` / `strip fx_rock_spike` |
| Đường đi | rơi: gia tốc mạnh (`fall` inBack); ném: arc cao 90 | `prop fall` + `marker` bóng báo trước |
| Va chạm | dừng phịch, `squashOnHit`, bụi vòng, mảnh đá văng **thấp** | `stop heavy`, `shake` có `dir [0,1]` (dọc), `burst slam_dust`, `burst pebble_spray` |
| Dư âm | bụi lắng chậm 800 ms, nứt đất 1–1,5 s, sỏi lăn | `decal crack`, `burst earth_dust` |
| Mục tiêu | **nảy lên** (lift) rồi rơi, không bật xa | `move lift y 20–40`, `move bounce` |

## 3. Nhịp mẫu
Đập đá T3: nhấc đá chậm 450 (anticipation dài nhất trong các hệ) → rơi 150 → **chạm 120 hit-stop heavy + rung dọc 6–8** → bụi 800. Đất là hệ được phép rung mạnh nhất, nhưng vẫn theo bậc (STANDARDS §4).

## 4. Hình chủ đạo sống
Đá là vật rắn: không cần biến hình nội tại, nhưng **bắt buộc** dấu hiệu 2 và 3: `squashOnHit` + mảnh vụn tách khỏi đá khi bay (`trail pebble_trail`) + vỡ đôi khi chạm (`strip fx_ground_crack` / mảnh). Dấu ấn phong ấn (`fxp_seal_circle`): vẽ dần (wipe / xoay mở) thay vì hiện nguyên.

## 5. Asset hiện có
Flipbook `fx_rock_spike` [4], `fx_ground_crack` [4] (7 skill). Vật: `fxp_boulder`, `fxp_rock_fist`, `fxp_stone_plate`, `fxp_mountain_trio`, `fxp_turtle_mountain`, `fxp_seal_circle`; `fxs_pebble`. Hạt: `earth_*`, `pebble_*`, `slam_*`.
**Thiếu:** flipbook đá vỡ đôi 4–6 khung; flipbook bụi vòng lan 6 khung.

## 6. Hiện trạng (audit) — ưu tiên **cao nhất** theo hệ (12)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_qs_rock_smash` | T3/T4 | STATIC_HERO, NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER | thêm nhấc chậm + bóng báo, vỡ đá, bụi lắng; kéo dài tới 1300+ |
| `skill_e_rock_slam` | T3/T4 | STATIC_HERO, NO_AFTERMATH, DURATION_UNDER | như trên |
| `skill_e_seal_quake` | T2/**T4** | STATIC_HERO, IMPACT_OVER_TIER, DURATION_OVER | hạ về T2–T3; dấu ấn vẽ dần; rút ngắn |
| `skill_e_tusk_charge` | T3/T4 | NO_AFTERMATH, FEW_LAYERS, SHARED_FLIPBOOK_HERO | bụi chân khi lao, vết cày trên đất |
| `skill_qs_quake` | T2/**T4** | IMPACT_OVER_TIER | hạ rung về 3–4 |
Đất thường **quá tay** (rung 10 mặc định) — xu hướng ngược các hệ khác.

## 7. Cấm
Đá bay lơ lửng nhẹ như lá; va chạm không có bụi; rung ngang cho đòn rơi dọc; mảnh đá văng cao như tia lửa.
