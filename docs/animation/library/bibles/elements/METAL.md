# Bible hệ KIM (METAL)

Khuôn như [WATER](WATER.md). Màu: `elements.METAL` (`color #cfd9e6`, `glow #ffffff`); nét `slash`, `spark metal_pop`, `boom fx_slash_arc`, rung 5.

## 1. Tính cách
Kim **sắc, chính xác, cực nhanh**. Đọc khi bỏ màu: đường **thẳng tuyệt đối**, góc nhọn, loé chữ thập, âm "keng". Không có hình tròn mềm.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Chuẩn bị | đứng yên căng, một tia sáng chạy dọc lưỡi | `pose attack`, `glow #ffffff` ngắn |
| Đường đi | thẳng, linear rất nhanh (≤ 150 ms) | `move dash` / `prop fly` + `trail` mảnh |
| Va chạm | vệt chém sáng mở rồi khép, tia kim văng thẳng, loé chữ thập 1 khung | `strip fx_slash_arc`, `burst metal_spray`, `flash` trắng ≤ 0,2 |
| Dư âm | vệt chém tắt dần 200 ms, mảnh kim nhỏ rơi leng keng | `burst metal_fall` |
| Mục tiêu | giật gọn, không văng xa | `move knock x 8–12` |

## 3. Nhịp mẫu
Chém T3: tụ 300 (đứng yên, sáng dọc lưỡi) → **lướt 80** → vệt chém + hit-stop heavy 120 → tắt dần 250. Tỉ lệ chờ / ra đòn cao nhất trong các hệ (≥ 3:1) — đó là cá tính của Kim.

## 4. Hình chủ đạo sống
Lưỡi (`fxp_steel_blade`) và nắm đấm đồng (`fxp_bronze_fist`) là vật rắn: dùng dấu hiệu 2+3 — vệt sáng chạy dọc vật (glow), `stretch` khi lao, tia lửa kim khi chạm. Hiệp sĩ đồng (`fxp_bronze_knight`): xuất hiện bằng **ghép mảnh** (nhiều `prop` nhỏ lắp lại) hoặc wipe, không hiện nguyên.

## 5. Asset hiện có
Flipbook `fx_slash_arc` [4], `fx_claw` [4]. Vật: `fxp_steel_blade`, `fxp_bronze_fist`, `fxp_bronze_shield`, `fxp_bronze_knight`, `fxp_forge_anvil`; `fxs_metal_bit`. Hạt: `metal_*`.
**Thiếu:** flipbook vệt chém dài 6 khung (mở → khép) riêng cho Kim (`fx_slash_arc` đang dùng chung 7 skill).

## 6. Hiện trạng (audit)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_ult_tg` | T4/T4 | STATIC_HERO, FEW_LAYERS | hiệp sĩ ghép mảnh, vệt chém nhiều nhịp; thêm L2 |
| `skill_tg_steel_slash`, `skill_e_bronze_crush` | T3/T3–4 | STATIC_HERO, DURATION_UNDER | thêm tụ đứng yên 300 + tắt vệt |
| `skill_e_metal_claw` | T3/T3 | FEW_LAYERS, DURATION_UNDER | thêm tia kim (L3) |
| `skill_tg_steel_charge` | T3/T4 | NO_AFTERMATH, SHARED_FLIPBOOK_HERO | va chạm bằng `$spark` |
| `skill_tg_armor_break` | T2/T3 | NO_AFTERMATH | mảnh giáp vỡ rơi |
Nhiều skill Kim **ngắn quá** (DURATION_UNDER 4/6): thiếu pha tụ — đúng chỗ tạo cá tính.

## 7. Cấm
Đường cong mềm, bong bóng / khói tròn; tia lửa bay lên như lửa; ra đòn chậm đều.
