# Kịch bản: Lời Thề Sắt (`skill_tg_iron_oath`)

```json scenario
{"id": "skill_tg_iron_oath", "kind": "skill", "name": "Lời Thề Sắt", "element": "SUPPORT", "tier": 0, "durationMs": 1820, "status": "built", "refs": [], "bibles": ["actions/buff-and-heal"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Cả đội tăng thủ vật lý và nhận khiên 12% máu.". Hình chủ đạo và chất liệu theo bộ phần của hệ (SUPPORT), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `iron_oath` (at 380 ms, dur 1440 ms); stagger 120 ms.

## 3. Kịch bản theo nhịp
1. Mảnh giáp bay tới ghép thành khiên trước từng đồng đội (lệch 110 ms), keng. 2. Vòm khép lại (khiên). 3. Mũi tên xanh lam (tăng thủ).

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_tg_iron_oath — Lời Thề Sắt   Hệ: không hệ   Loại: unique   Đích: allAllies   Kết thúc: 1820 ms
descVi: "Cả đội tăng thủ vật lý và nhận khiên 12% máu."
HIỆU ỨNG: vfx3d `iron_oath` (at 380 ms, dur 1440 ms); stagger 120 ms
PHẢI THẤY: 1. Mảnh giáp bay tới ghép thành khiên trước từng đồng đội (lệch 110 ms), keng. 2. Vòm khép lại (khiên). 3. Mũi tên xanh lam (tăng thủ).
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 300 · IMPACT 850 · end 1820
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_tg_iron_oath_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
