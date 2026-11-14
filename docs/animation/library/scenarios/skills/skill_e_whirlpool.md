# Kịch bản: Xoáy Nước (`skill_e_whirlpool`)

```json scenario
{"id": "skill_e_whirlpool", "kind": "skill", "name": "Xoáy Nước", "element": "WATER", "tier": 2, "durationMs": 2000, "status": "built", "refs": [], "bibles": ["elements/WATER", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Xoáy nước cuốn cả đội, có thể làm Chậm.". Hình chủ đạo và chất liệu theo bộ phần của hệ (WATER), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `whirlpool_row` (at 550 ms, dur 1450 ms); stagger 120 ms.

## 3. Kịch bản theo nhịp
1. Xoáy nước mở trên đất giữa hàng, quay nhanh dần. 2. Dòng nước xoắn quanh cả hàng, có vành nước thấp. 3. Bọt bắn trên từng con lệch 90 ms.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_whirlpool — Xoáy Nước   Hệ: WATER   Loại: enemy   Đích: allEnemies   Kết thúc: 2000 ms
descVi: "Xoáy nước cuốn cả đội, có thể làm Chậm."
HIỆU ỨNG: vfx3d `whirlpool_row` (at 550 ms, dur 1450 ms); stagger 120 ms
PHẢI THẤY: 1. Xoáy nước mở trên đất giữa hàng, quay nhanh dần. 2. Dòng nước xoắn quanh cả hàng, có vành nước thấp. 3. Bọt bắn trên từng con lệch 90 ms.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 600 · IMPACT 1100 · end 2000
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_whirlpool_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
