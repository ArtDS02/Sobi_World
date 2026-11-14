# Kịch bản: Màn Cát (`skill_e_sand_veil`)

```json scenario
{"id": "skill_e_sand_veil", "kind": "skill", "name": "Màn Cát", "element": "EARTH", "tier": 1, "durationMs": 1700, "status": "built", "refs": [], "bibles": ["elements/EARTH", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Cát bay mù cả đội, dễ làm Giảm chính xác.". Hình chủ đạo và chất liệu theo bộ phần của hệ (EARTH), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `sand_veil` (at 150 ms, dur 1550 ms).

## 3. Kịch bản theo nhịp
1. Gió thổi cát từ phía quái sang. 2. Màn cát treo trên cả hàng, dày nhất ở từng con, hạt cát bay ngang.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_sand_veil — Màn Cát   Hệ: EARTH   Loại: enemy   Đích: allEnemies   Kết thúc: 1700 ms
descVi: "Cát bay mù cả đội, dễ làm Giảm chính xác."
HIỆU ỨNG: vfx3d `sand_veil` (at 150 ms, dur 1550 ms)
PHẢI THẤY: 1. Gió thổi cát từ phía quái sang. 2. Màn cát treo trên cả hàng, dày nhất ở từng con, hạt cát bay ngang.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 350 · IMPACT 700 · end 1700
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_sand_veil_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
