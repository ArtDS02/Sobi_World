# Kịch bản: Xung Khe Nứt (`skill_e_rift_pulse`)

```json scenario
{"id": "skill_e_rift_pulse", "kind": "skill", "name": "Xung Khe Nứt", "element": "VOID", "tier": 1, "durationMs": 1800, "status": "built", "refs": [], "bibles": ["elements/VOID", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Khe nứt hư không rung lên đánh cả đội, có thể làm Chậm.". Hình chủ đạo và chất liệu theo bộ phần của hệ (VOID), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `rift_pulse` (at 400 ms, dur 1400 ms); stagger 120 ms.

## 3. Kịch bản theo nhịp
1. Khe nứt đen nằm ngang trên đất giữa hàng, phập phồng. 2. Ba vòng gợn tím lan ra qua cả hàng. 3. Đốm không gian bị hút về khe. 4. Mảnh vỡ trên từng con.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_rift_pulse — Xung Khe Nứt   Hệ: VOID   Loại: enemy   Đích: allEnemies   Kết thúc: 1800 ms
descVi: "Khe nứt hư không rung lên đánh cả đội, có thể làm Chậm."
HIỆU ỨNG: vfx3d `rift_pulse` (at 400 ms, dur 1400 ms); stagger 120 ms
PHẢI THẤY: 1. Khe nứt đen nằm ngang trên đất giữa hàng, phập phồng. 2. Ba vòng gợn tím lan ra qua cả hàng. 3. Đốm không gian bị hút về khe. 4. Mảnh vỡ trên từng con.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 400 · IMPACT 900 · end 1800
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_rift_pulse_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
