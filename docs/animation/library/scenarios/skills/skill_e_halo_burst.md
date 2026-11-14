# Kịch bản: Vầng Sáng Nổ (`skill_e_halo_burst`)

```json scenario
{"id": "skill_e_halo_burst", "kind": "skill", "name": "Vầng Sáng Nổ", "element": "LIGHT", "tier": 2, "durationMs": 1800, "status": "built", "refs": [], "bibles": ["elements/LIGHT", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Vầng sáng bùng ra đánh cả đội, có thể Giảm thủ phép.". Hình chủ đạo và chất liệu theo bộ phần của hệ (LIGHT), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `halo_burst` (at 400 ms, dur 1400 ms); stagger 120 ms.

## 3. Kịch bản theo nhịp
1. Vầng hào quang mở giữa hàng đội bị đánh. 2. Vòng sáng lan ra trên đất qua từng con. 3. Lóe sao trên từng con lệch 90 ms.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_halo_burst — Vầng Sáng Nổ   Hệ: LIGHT   Loại: enemy   Đích: allEnemies   Kết thúc: 1800 ms
descVi: "Vầng sáng bùng ra đánh cả đội, có thể Giảm thủ phép."
HIỆU ỨNG: vfx3d `halo_burst` (at 400 ms, dur 1400 ms); stagger 120 ms
PHẢI THẤY: 1. Vầng hào quang mở giữa hàng đội bị đánh. 2. Vòng sáng lan ra trên đất qua từng con. 3. Lóe sao trên từng con lệch 90 ms.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 400 · IMPACT 900 · end 1800
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_halo_burst_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
