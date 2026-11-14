# Kịch bản: Ném Tảng (`skill_e_boulder_toss`)

```json scenario
{"id": "skill_e_boulder_toss", "kind": "skill", "name": "Ném Tảng", "element": "EARTH", "tier": 3, "durationMs": 1400, "status": "built", "refs": [], "bibles": ["elements/EARTH", "actions/melee-and-hit"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Ném tảng đá nặng vào một mục tiêu.". Hình chủ đạo và chất liệu theo bộ phần của hệ (EARTH), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `boulder_toss` (at 160 ms, dur 1240 ms).

## 3. Kịch bản theo nhịp
1. Tảng đá to hơn quái được nhấc lên. 2. Bay vòng cung cao, xoay. 3. Vỡ trên mục tiêu thành mảnh lớn và bụi, hố nứt, vòng chấn.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_boulder_toss — Ném Tảng   Hệ: EARTH   Loại: enemy   Đích: enemy   Kết thúc: 1400 ms
descVi: "Ném tảng đá nặng vào một mục tiêu."
HIỆU ỨNG: vfx3d `boulder_toss` (at 160 ms, dur 1240 ms)
PHẢI THẤY: 1. Tảng đá to hơn quái được nhấc lên. 2. Bay vòng cung cao, xoay. 3. Vỡ trên mục tiêu thành mảnh lớn và bụi, hố nứt, vòng chấn.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 320 · IMPACT 720 · end 1400
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_boulder_toss_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
