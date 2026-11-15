# Kịch bản: Kết Giới Trống (`skill_hk_null_ward`)

```json scenario
{"id": "skill_hk_null_ward", "kind": "skill", "name": "Kết Giới Trống", "element": "SUPPORT", "tier": 0, "durationMs": 1820, "status": "built", "refs": [], "bibles": ["actions/buff-and-heal"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Dựng kết giới trống rỗng: khiên 20% máu cho cả đội.". Hình chủ đạo và chất liệu theo bộ phần của hệ (SUPPORT), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `null_ward` (at 380 ms, dur 1440 ms); stagger 120 ms.

## 3. Kịch bản theo nhịp
1. Vòm lục giác tím trong suốt khép quanh từng đồng đội (lệch 110 ms), lóe khi khóa. 2. Sao lấp lánh bên trong vòm.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_hk_null_ward — Kết Giới Trống   Hệ: không hệ   Loại: unique   Đích: allAllies   Kết thúc: 1820 ms
descVi: "Dựng kết giới trống rỗng: khiên 20% máu cho cả đội."
HIỆU ỨNG: vfx3d `null_ward` (at 380 ms, dur 1440 ms); stagger 120 ms
PHẢI THẤY: 1. Vòm lục giác tím trong suốt khép quanh từng đồng đội (lệch 110 ms), lóe khi khóa. 2. Sao lấp lánh bên trong vòm.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 300 · IMPACT 850 · end 1820
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_hk_null_ward_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
