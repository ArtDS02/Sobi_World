# Kịch bản: Húc Khiên (`skill_e_shield_bash`)

```json scenario
{"id": "skill_e_shield_bash", "kind": "skill", "name": "Húc Khiên", "element": "METAL", "tier": 3, "durationMs": 1600, "status": "built", "refs": [], "bibles": ["elements/METAL", "actions/melee-and-hit"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Đập khiên vào một mục tiêu, 20% làm choáng.". Hình chủ đạo và chất liệu theo bộ phần của hệ (METAL), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `shield_bash` (at 400 ms, dur 1200 ms).

## 3. Kịch bản theo nhịp
1. Các mảnh thép ghép thành khiên trước quái. 2. Khiên lao tới, đập vào mục tiêu đúng nhịp trúng, bẹp lại. 3. Tia keng, vòng (choáng là của trạng thái).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_shield_bash — Húc Khiên   Hệ: METAL   Loại: enemy   Đích: enemy   Kết thúc: 1600 ms
descVi: "Đập khiên vào một mục tiêu, 20% làm choáng."
HIỆU ỨNG: vfx3d `shield_bash` (at 400 ms, dur 1200 ms)
PHẢI THẤY: 1. Các mảnh thép ghép thành khiên trước quái. 2. Khiên lao tới, đập vào mục tiêu đúng nhịp trúng, bẹp lại. 3. Tia keng, vòng (choáng là của trạng thái).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 420 · IMPACT 700 · end 1600
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_shield_bash_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
