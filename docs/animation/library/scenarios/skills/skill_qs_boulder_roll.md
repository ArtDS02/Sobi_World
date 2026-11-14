# Kịch bản: Lăn Tảng (`skill_qs_boulder_roll`)

```json scenario
{"id": "skill_qs_boulder_roll", "kind": "skill", "name": "Lăn Tảng", "element": "EARTH", "tier": 3, "durationMs": 1500, "status": "built", "refs": [], "bibles": ["elements/EARTH", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Lăn tảng đá nghiền một kẻ địch, 35% làm choáng.". Hình chủ đạo và chất liệu theo bộ phần của hệ (EARTH), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `boulder_roll` (at 240 ms, dur 1260 ms).

## 3. Kịch bản theo nhịp
1. Tảng đá cao bằng người lăn từ sau người tung, nhanh dần, bụi dọc đường. 2. Nghiền qua mục tiêu đúng nhịp trúng, nảy. 3. Vệt nứt lún dưới đất, mảnh vụn (choáng là của trạng thái).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_qs_boulder_roll — Lăn Tảng   Hệ: EARTH   Loại: unique   Đích: enemy   Kết thúc: 1500 ms
descVi: "Lăn tảng đá nghiền một kẻ địch, 35% làm choáng."
HIỆU ỨNG: vfx3d `boulder_roll` (at 240 ms, dur 1260 ms)
PHẢI THẤY: 1. Tảng đá cao bằng người lăn từ sau người tung, nhanh dần, bụi dọc đường. 2. Nghiền qua mục tiêu đúng nhịp trúng, nảy. 3. Vệt nứt lún dưới đất, mảnh vụn (choáng là của trạng thái).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 350 · IMPACT 760 · end 1500
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_qs_boulder_roll_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
