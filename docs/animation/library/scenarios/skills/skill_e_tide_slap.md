# Kịch bản: Quật Sóng (`skill_e_tide_slap`)

```json scenario
{"id": "skill_e_tide_slap", "kind": "skill", "name": "Quật Sóng", "element": "WATER", "tier": 2, "durationMs": 1050, "status": "built", "refs": [], "bibles": ["elements/WATER", "actions/melee-and-hit"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Quật sóng vào một mục tiêu, có thể làm nó Ướt.". Hình chủ đạo và chất liệu theo bộ phần của hệ (WATER), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `tide_slap` (at 240 ms, dur 810 ms).

## 3. Kịch bản theo nhịp
1. Con sóng nhỏ dựng lên phía quái, chạy ngang qua mục tiêu. 2. Đúng nhịp trúng mào sóng cuộn xuống, bọt và giọt bắn.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_tide_slap — Quật Sóng   Hệ: WATER   Loại: enemy   Đích: enemy   Kết thúc: 1050 ms
descVi: "Quật sóng vào một mục tiêu, có thể làm nó Ướt."
HIỆU ỨNG: vfx3d `tide_slap` (at 240 ms, dur 810 ms)
PHẢI THẤY: 1. Con sóng nhỏ dựng lên phía quái, chạy ngang qua mục tiêu. 2. Đúng nhịp trúng mào sóng cuộn xuống, bọt và giọt bắn.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 300 · IMPACT 560 · end 1050
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_tide_slap_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
