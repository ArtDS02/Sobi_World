# Kịch bản: Cắn Than Hồng (`skill_e_ember_bite`) — quái

```json scenario
{
  "id": "skill_e_ember_bite", "kind": "skill", "name": "Cắn Than Hồng", "element": "FIRE", "tier": 2, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_bite", "state": "have", "layer": "L1" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 0,5)" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (nhỏ, trên đuôi)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cáo lửa **nhe răng, đuôi bùng lửa**, **vồ** theo đường vồng, **cắn** — **lửa bùng** tại chỗ cắn, hai đốm than to bay lên. Cảm giác: hoang dã, nóng. T2, 30 % Bỏng. Cáo Lửa, Rồng Dung Nham.

## 2. Hiện tại
`fx_flame_burst` chung (+ bite). Audit: `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Nhe | 0–280 | pose `attack`, nhe răng, hạ thấp | **đuôi bùng lửa** (lửa loop trên đuôi), tàn bay | — | — | "grr" |
| 2 Vồ | 280–480 | vồ vồng, kéo giãn | vệt lửa | — | — | vút |
| 3 Cắn | 480 | — | hàm cắn (bite) tô cam + **lửa bùng** 0,5 | giật, tint cam | hit-stop medium 70, rung 4 | "CHOMP!" |
| 4 Dư âm | 480–1050 | nhảy về | 2 than to bay lên, khói nhỏ; vết cháy; `st_burn` | thổi | — | xèo |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cắn; lửa bùng | `fx_bite` (cam), `fx_fire_blast` (0,5) | `strip` 480, 500 | 480–750 |
| L2 | lửa trên đuôi; vệt | `fx_flame_loop` (0,3, `behind`) | loop 0–600; `trail #ff7a2a` 280–480 | 0–600 |
| L3 | tàn; than; khói; vết cháy | `fxs_ember` | `burst ember_rise` 0; `burst ember_big` 600; `burst fire_smoke` 650; `decal scorch` 480 | 0–1050 |
| L4 | hit-stop | — | `stop medium 70`; `shake 4`; `move knock x 12` | 480–750 |
L1 đạt 2/3: biến hình (cắn + nổ khung) · phụ sinh (lửa đuôi, than).

## 5. Asset
`fx_fire_blast`, `fx_flame_loop` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhe, vồ, về · B3 cắn, lửa · B4 đuôi lửa, than, khói, vết · B5 hit-stop (rung 5 → 4) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~150 đuôi có lửa; khung ~700 than to bay lên.
