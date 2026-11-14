# Kịch bản: Sao Rơi Vô Định (`skill_hk_star_fall`)

```json scenario
{"id": "skill_hk_star_fall", "kind": "skill", "name": "Sao Rơi Vô Định", "element": "VOID", "tier": 1, "durationMs": 1550, "status": "built", "refs": [], "bibles": ["elements/VOID", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Bốn ngôi sao hư không rơi vào kẻ địch ngẫu nhiên.". Hình chủ đạo và chất liệu theo bộ phần của hệ (VOID), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `void_stars` (at 0 ms, dur 1550 ms); stagger 200 ms.

## 3. Kịch bản theo nhịp
1. Đúng bốn ngôi sao hư không rơi chéo từ trên cao, 320 / 520 / 720 / 920, mỗi sao lên một mục tiêu của lượt. 2. Mỗi sao: mảnh vỡ và vòng tím.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_hk_star_fall — Sao Rơi Vô Định   Hệ: VOID   Loại: unique   Đích: randomEnemies   Kết thúc: 1550 ms
descVi: "Bốn ngôi sao hư không rơi vào kẻ địch ngẫu nhiên."
HIỆU ỨNG: vfx3d `void_stars` (at 0 ms, dur 1550 ms); stagger 200 ms
PHẢI THẤY: 1. Đúng bốn ngôi sao hư không rơi chéo từ trên cao, 320 / 520 / 720 / 920, mỗi sao lên một mục tiêu của lượt. 2. Mỗi sao: mảnh vỡ và vòng tím.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 320 · IMPACT 320 · end 1550
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_hk_star_fall_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
