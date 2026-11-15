# Kịch bản: Xoáy Nước Cổ (`skill_nh_whirlpool`)

```json scenario
{"id": "skill_nh_whirlpool", "kind": "skill", "name": "Xoáy Nước Cổ", "element": "WATER", "tier": 2, "durationMs": 2300, "status": "built", "refs": [], "bibles": ["elements/WATER", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Xoáy nước cuốn mọi kẻ địch, làm Ướt và có thể làm Chậm.". Hình chủ đạo và chất liệu theo bộ phần của hệ (WATER), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `great_whirlpool` (at 450 ms, dur 1850 ms); stagger 90 ms.

## 3. Kịch bản theo nhịp
1. Xoáy nước to hơn, dòng nước dày và nhiều bọt trắng hơn. 2. Mỗi kẻ địch bị cuốn trong dòng, cột bọt bắn lên từng con lệch 90 ms (Ướt / Chậm là của trạng thái).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_nh_whirlpool — Xoáy Nước Cổ   Hệ: WATER   Loại: unique   Đích: allEnemies   Kết thúc: 2300 ms
descVi: "Xoáy nước cuốn mọi kẻ địch, làm Ướt và có thể làm Chậm."
HIỆU ỨNG: vfx3d `great_whirlpool` (at 450 ms, dur 1850 ms); stagger 90 ms
PHẢI THẤY: 1. Xoáy nước to hơn, dòng nước dày và nhiều bọt trắng hơn. 2. Mỗi kẻ địch bị cuốn trong dòng, cột bọt bắn lên từng con lệch 90 ms (Ướt / Chậm là của trạng thái).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 700 · IMPACT 1050 · end 2300
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_nh_whirlpool_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
