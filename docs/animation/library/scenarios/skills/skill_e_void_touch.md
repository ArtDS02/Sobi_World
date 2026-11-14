# Kịch bản: Chạm Hư Vô (`skill_e_void_touch`)

```json scenario
{"id": "skill_e_void_touch", "kind": "skill", "name": "Chạm Hư Vô", "element": "VOID", "tier": 2, "durationMs": 1250, "status": "built", "refs": [], "bibles": ["elements/VOID", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Chạm vào một mục tiêu, xóa một trạng thái tốt của nó.". Hình chủ đạo và chất liệu theo bộ phần của hệ (VOID), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `void_drain` (at 320 ms, dur 930 ms).

## 3. Kịch bản theo nhịp
1. Khe nứt mở cạnh mục tiêu (phía người tung). 2. Đúng nhịp trúng một đốm sáng nhợt (trạng thái tốt) bị rút khỏi mục tiêu, bay vào khe nứt và nhỏ dần. 3. Khe nứt khép.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_void_touch — Chạm Hư Vô   Hệ: VOID   Loại: enemy   Đích: enemy   Kết thúc: 1250 ms
descVi: "Chạm vào một mục tiêu, xóa một trạng thái tốt của nó."
HIỆU ỨNG: vfx3d `void_drain` (at 320 ms, dur 930 ms)
PHẢI THẤY: 1. Khe nứt mở cạnh mục tiêu (phía người tung). 2. Đúng nhịp trúng một đốm sáng nhợt (trạng thái tốt) bị rút khỏi mục tiêu, bay vào khe nứt và nhỏ dần. 3. Khe nứt khép.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 300 · IMPACT 650 · end 1250
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_void_touch_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
