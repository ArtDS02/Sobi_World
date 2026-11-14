# Kịch bản: Giáo Lăng Kính (`skill_e_prism_lance`)

```json scenario
{"id": "skill_e_prism_lance", "kind": "skill", "name": "Giáo Lăng Kính", "element": "LIGHT", "tier": 3, "durationMs": 1150, "status": "built", "refs": [], "bibles": ["elements/LIGHT", "actions/projectile"], "assets": [], "engine": []}
```

## 1. Ý tưởng
Skill mới (decision 060): "Giáo ánh sáng xuyên một mục tiêu.". Hình chủ đạo và chất liệu theo bộ phần của hệ (LIGHT), quy tắc ở `docs/animation/VFX3D_REVIEW_STANDARD.md`.

## 2. Hiện tại
Dựng trên lớp 3D (decision 059): vfx3d `prism_lance` (at 0 ms, dur 1150 ms).

## 3. Kịch bản theo nhịp
1. Giáo ánh sáng dài, có viền lam, bay thẳng xuyên mục tiêu ra phía sau. 2. Vệt lăng kính bảy màu để lại dọc đường bay, tắt dần.

## 4. Bóc lớp
Một act `vfx3d` (lớp 3D: sơn + ánh sáng); tư thế, chuyển động, rung, hit-stop, âm thanh lấy từ skill cùng dạng trong `battle_fx.json`.

## 5. Asset
Không dùng ảnh trong manifest: mọi hình vẽ bằng code.

## 6. Các bước dựng
Hiệu ứng là hàm thuần theo tuổi (ms), số hạt theo `env.quality`; mốc trúng khớp `timing.impact`.

## 7. Nghiệm thu
```
Skill: skill_e_prism_lance — Giáo Lăng Kính   Hệ: LIGHT   Loại: enemy   Đích: enemy   Kết thúc: 1150 ms
descVi: "Giáo ánh sáng xuyên một mục tiêu."
HIỆU ỨNG: vfx3d `prism_lance` (at 0 ms, dur 1150 ms)
PHẢI THẤY: 1. Giáo ánh sáng dài, có viền lam, bay thẳng xuyên mục tiêu ra phía sau. 2. Vệt lăng kính bảy màu để lại dọc đường bay, tắt dần.
KHÔNG ĐƯỢC: vẽ kết quả của xác suất (trạng thái tự vẽ); che mục tiêu quá ~200 ms.
NHỊP: release 380 · IMPACT 560 · end 1150
KIỂM: contact sheet `docs/animation/vfx3d/new/skill_e_prism_lance_sheet.jpg` (mốc −500 … +1400 quanh impact). FPS ≥ 50 (RTX 3050).
```
