# Kịch bản: Chói Lòa (`skill_e_glare`)

```json scenario
{"id": "skill_e_glare", "kind": "skill", "name": "Chói Lòa", "element": "LIGHT", "tier": 2, "durationMs": 1150, "status": "built", "refs": [], "bibles": ["elements/LIGHT", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Chớp sáng chói vào một mục tiêu, dễ làm nó Giảm chính xác.". Hình chủ đạo và chất liệu theo bộ phần của hệ (LIGHT), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `glare_flash` (at 140 ms, dur 1010 ms).

## 3. Kịch bản theo nhịp
1. Đốm sáng tụ vào quái ra đòn. 2. Đúng nhịp trúng một chớp trắng ấm bùng ở mắt mục tiêu, tia sáng toả ra. 3. Mục tiêu giật lùi (chuyển động của kịch bản).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_glare — Chói Lòa   Hệ: LIGHT   Loại: enemy   Đích: enemy   Kết thúc: 1150 ms
descVi: "Chớp sáng chói vào một mục tiêu, dễ làm nó Giảm chính xác."
HIỆU ỨNG: vfx3d `glare_flash` (at 140 ms, dur 1010 ms)
PHẢI THẤY: 1. Đốm sáng tụ vào quái ra đòn. 2. Đúng nhịp trúng một chớp trắng ấm bùng ở mắt mục tiêu, tia sáng toả ra. 3. Mục tiêu giật lùi (chuyển động của kịch bản).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 380 · IMPACT 560 · end 1150
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_glare_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
