# Kịch bản: Mưa Chông Thép (`skill_tg_spike_barrage`)

```json scenario
{"id": "skill_tg_spike_barrage", "kind": "skill", "name": "Mưa Chông Thép", "element": "METAL", "tier": 1, "durationMs": 1550, "status": "built", "refs": [], "bibles": ["elements/METAL", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Bốn mũi chông thép phóng vào kẻ địch ngẫu nhiên.". Hình chủ đạo và chất liệu theo bộ phần của hệ (METAL), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `spike_barrage` (at 0 ms, dur 1550 ms); stagger 200 ms.

## 3. Kịch bản theo nhịp
1. Đúng bốn mũi chông thép phóng từ người tung, 320 / 520 / 720 / 920, mỗi mũi vào một mục tiêu của lượt. 2. Mỗi mũi một tia keng.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_tg_spike_barrage — Mưa Chông Thép   Hệ: METAL   Loại: unique   Đích: randomEnemies   Kết thúc: 1550 ms
descVi: "Bốn mũi chông thép phóng vào kẻ địch ngẫu nhiên."
HIỆU ỨNG: vfx3d `spike_barrage` (at 0 ms, dur 1550 ms); stagger 200 ms
PHẢI THẤY: 1. Đúng bốn mũi chông thép phóng từ người tung, 320 / 520 / 720 / 920, mỗi mũi vào một mục tiêu của lượt. 2. Mỗi mũi một tia keng.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 320 · IMPACT 320 · end 1550
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_tg_spike_barrage_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
