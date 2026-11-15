# Kịch bản: Lăng Kính Tán Sắc (`skill_qt_prism`)

```json scenario
{"id": "skill_qt_prism", "kind": "skill", "name": "Lăng Kính Tán Sắc", "element": "LIGHT", "tier": 2, "durationMs": 1550, "status": "built", "refs": [], "bibles": ["elements/LIGHT", "actions/cast"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Tán tia sáng thành bảy màu đánh mọi kẻ địch, dễ làm Giảm chính xác.". Hình chủ đạo và chất liệu theo bộ phần của hệ (LIGHT), quy tắc ở `docs/SKILL_ANIMATION_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `prism_split` (at 300 ms, dur 1250 ms); stagger 60 ms.

## 3. Kịch bản theo nhịp
1. Viên lăng kính treo trên hàng địch, xoay. 2. Tia trắng từ người tung chạm lăng kính. 3. Bảy tia màu (chuỗi hạt sơn) tỏa xuống từng kẻ địch. 4. Lóe nhẹ trên từng con.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_qt_prism — Lăng Kính Tán Sắc   Hệ: LIGHT   Loại: unique   Đích: allEnemies   Kết thúc: 1550 ms
descVi: "Tán tia sáng thành bảy màu đánh mọi kẻ địch, dễ làm Giảm chính xác."
HIỆU ỨNG: vfx3d `prism_split` (at 300 ms, dur 1250 ms); stagger 60 ms
PHẢI THẤY: 1. Viên lăng kính treo trên hàng địch, xoay. 2. Tia trắng từ người tung chạm lăng kính. 3. Bảy tia màu (chuỗi hạt sơn) tỏa xuống từng kẻ địch. 4. Lóe nhẹ trên từng con.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 350 · IMPACT 850 · end 1550
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_qt_prism_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
