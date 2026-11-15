# Kịch bản: Ánh Nhìn Trống Rỗng (`skill_e_null_gaze`)

```json scenario
{"id": "skill_e_null_gaze", "kind": "skill", "name": "Ánh Nhìn Trống Rỗng", "element": "VOID", "tier": 3, "durationMs": 1150, "status": "built", "refs": [], "bibles": ["elements/VOID", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Nhìn xuyên một mục tiêu, 20% Phong ấn 2 lượt.". Hình chủ đạo và chất liệu theo bộ phần của hệ (VOID), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `null_gaze` (at 0 ms, dur 1150 ms).

## 3. Kịch bản theo nhịp
1. Hai vòng đêm đối nhau như con mắt trước quái. 2. Ánh nhìn tím chạy xuyên mục tiêu, viền tách màu lam / hồng. 3. Tia sáng văng ở mục tiêu (Phong ấn là của trạng thái).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_null_gaze — Ánh Nhìn Trống Rỗng   Hệ: VOID   Loại: enemy   Đích: enemy   Kết thúc: 1150 ms
descVi: "Nhìn xuyên một mục tiêu, 20% Phong ấn 2 lượt."
HIỆU ỨNG: vfx3d `null_gaze` (at 0 ms, dur 1150 ms)
PHẢI THẤY: 1. Hai vòng đêm đối nhau như con mắt trước quái. 2. Ánh nhìn tím chạy xuyên mục tiêu, viền tách màu lam / hồng. 3. Tia sáng văng ở mục tiêu (Phong ấn là của trạng thái).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 380 · IMPACT 560 · end 1150
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_null_gaze_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
