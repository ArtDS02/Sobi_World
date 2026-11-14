# Kịch bản: Triều Dâng (`skill_nh_rising_tide`)

```json scenario
{"id": "skill_nh_rising_tide", "kind": "skill", "name": "Triều Dâng", "element": "SUPPORT", "tier": 0, "durationMs": 1650, "status": "built", "refs": [], "bibles": ["actions/buff-and-heal"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Triều dâng nâng một đồng đội: hồi 20% máu và khiên 10% máu.". Hình chủ đạo và chất liệu theo bộ phần của hệ (SUPPORT), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `rising_tide` (at 350 ms, dur 1300 ms).

## 3. Kịch bản theo nhịp
1. Mảng nước loang dưới đồng đội, nước dâng quanh chân. 2. Giọt bắn, dấu cộng (hồi máu). 3. Vòm nước mỏng khép lại (khiên).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_nh_rising_tide — Triều Dâng   Hệ: không hệ   Loại: unique   Đích: ally   Kết thúc: 1650 ms
descVi: "Triều dâng nâng một đồng đội: hồi 20% máu và khiên 10% máu."
HIỆU ỨNG: vfx3d `rising_tide` (at 350 ms, dur 1300 ms)
PHẢI THẤY: 1. Mảng nước loang dưới đồng đội, nước dâng quanh chân. 2. Giọt bắn, dấu cộng (hồi máu). 3. Vòm nước mỏng khép lại (khiên).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 320 · IMPACT 700 · end 1650
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_nh_rising_tide_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
