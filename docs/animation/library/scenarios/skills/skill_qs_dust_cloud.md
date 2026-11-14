# Kịch bản: Mây Bụi (`skill_qs_dust_cloud`)

```json scenario
{"id": "skill_qs_dust_cloud", "kind": "skill", "name": "Mây Bụi", "element": "EARTH", "tier": 1, "durationMs": 1550, "status": "built", "refs": [], "bibles": ["elements/EARTH", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Mây bụi mù mịt phủ mọi kẻ địch, dễ làm Giảm chính xác.". Hình chủ đạo và chất liệu theo bộ phần của hệ (EARTH), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `dust_cloud` (at 50 ms, dur 1500 ms); stagger 130 ms.

## 3. Kịch bản theo nhịp
1. Mây bụi dày cuộn lên dưới cả hàng. 2. Phủ lên từng kẻ địch, vòng chấn nhẹ trên từng con.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_qs_dust_cloud — Mây Bụi   Hệ: EARTH   Loại: unique   Đích: allEnemies   Kết thúc: 1550 ms
descVi: "Mây bụi mù mịt phủ mọi kẻ địch, dễ làm Giảm chính xác."
HIỆU ỨNG: vfx3d `dust_cloud` (at 50 ms, dur 1500 ms); stagger 130 ms
PHẢI THẤY: 1. Mây bụi dày cuộn lên dưới cả hàng. 2. Phủ lên từng kẻ địch, vòng chấn nhẹ trên từng con.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 420 · IMPACT 600 · end 1550
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_qs_dust_cloud_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
