# Kịch bản: Giáo Rạng Đông (`skill_qt_dawn_spear`)

```json scenario
{"id": "skill_qt_dawn_spear", "kind": "skill", "name": "Giáo Rạng Đông", "element": "LIGHT", "tier": 1, "durationMs": 1550, "status": "built", "refs": [], "bibles": ["elements/LIGHT", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Ba mũi giáo ánh sáng liên tiếp vào một kẻ địch.". Hình chủ đạo và chất liệu theo bộ phần của hệ (LIGHT), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `dawn_spears` (at 0 ms, dur 1550 ms); stagger 220 ms.

## 3. Kịch bản theo nhịp
1. Hào quang nhỏ mở sau người tung. 2. Đúng ba mũi giáo sáng 320 / 540 / 760, mũi cuối to nhất. 3. Vòng sáng trên đất ở mũi cuối.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_qt_dawn_spear — Giáo Rạng Đông   Hệ: LIGHT   Loại: unique   Đích: enemy   Kết thúc: 1550 ms
descVi: "Ba mũi giáo ánh sáng liên tiếp vào một kẻ địch."
HIỆU ỨNG: vfx3d `dawn_spears` (at 0 ms, dur 1550 ms); stagger 220 ms
PHẢI THẤY: 1. Hào quang nhỏ mở sau người tung. 2. Đúng ba mũi giáo sáng 320 / 540 / 760, mũi cuối to nhất. 3. Vòng sáng trên đất ở mũi cuối.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 320 · IMPACT 320 · end 1550
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_qt_dawn_spear_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
