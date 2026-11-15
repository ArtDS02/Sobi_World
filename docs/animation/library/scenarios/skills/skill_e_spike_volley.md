# Kịch bản: Mưa Chông (`skill_e_spike_volley`)

```json scenario
{"id": "skill_e_spike_volley", "kind": "skill", "name": "Mưa Chông", "element": "METAL", "tier": 2, "durationMs": 2400, "status": "built", "refs": [], "bibles": ["elements/METAL", "actions/melee-and-hit"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Chông thép rơi xuống cả đội, có thể Giảm thủ.". Hình chủ đạo và chất liệu theo bộ phần của hệ (METAL), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `spike_rain` (at 450 ms, dur 1950 ms).

## 3. Kịch bản theo nhịp
1. Chông thép rơi từ trời xuống từng mục tiêu (4 chông mỗi con, lệch 40 ms) và cắm xuống đất. 2. Tia lửa keng trên từng con.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_spike_volley — Mưa Chông   Hệ: METAL   Loại: enemy   Đích: allEnemies   Kết thúc: 2400 ms
descVi: "Chông thép rơi xuống cả đội, có thể Giảm thủ."
HIỆU ỨNG: vfx3d `spike_rain` (at 450 ms, dur 1950 ms)
PHẢI THẤY: 1. Chông thép rơi từ trời xuống từng mục tiêu (4 chông mỗi con, lệch 40 ms) và cắm xuống đất. 2. Tia lửa keng trên từng con.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 600 · IMPACT 1000 · end 2400
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_spike_volley_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
