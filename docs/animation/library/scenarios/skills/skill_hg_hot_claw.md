# Kịch bản: Càng Nung (`skill_hg_hot_claw`)

```json scenario
{
  "id": "skill_hg_hot_claw", "kind": "skill", "name": "Càng Nung", "element": "FIRE", "tier": 2, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "actions/melee-and-hit"],
  "assets": [
    { "id": "fxp_crab_claw", "state": "have", "layer": "L1" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 0,6)" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (phủ nhỏ trên càng)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cua **giơ càng đỏ rực dần**, **đi ngang lạch bạch** tới mục tiêu, càng **khép "CẮP"** một cái — mục tiêu **nhảy dựng**, khói bốc trên đầu. Cảm giác: hài hước, nóng bỏng tay. T2, 40 % Bỏng.

## 2. Hiện tại
Dash (không đi ngang), `fxp_crab_claw pop` + `fx_flame_burst` chung. Audit: `STATIC_SHARE`, `SHARED_FLIPBOOK_HERO`. Càng không khép, cua không đi ngang.

## 3. Kịch bản theo nhịp
| # | ms | Cua | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Nung | 0–280 | pose `attack`, giơ càng | càng **đỏ rực dần**, lửa nhỏ liếm trên càng, tàn bay lên | — | — | "click-click" |
| 2 Đi ngang | 280–480 | **đi ngang** lạch bạch (4 bước nhanh) | vệt tàn sau chân | — | — | lạch bạch |
| 3 Cắp | 480 | khép càng | càng lớn **mở → khép** quanh mục tiêu (pop rồi bóp: scale x 1 → 0,7), nổ lửa nhỏ | **nhảy dựng** 20 px | hit-stop medium 70, rung 4 | "CẮP!" |
| 4 Về | 480–1050 | đi ngang về | khói trên đầu mục tiêu, vết cháy dưới chân; `st_burn` | thổi tay "aaah" (wiggle) | — | "aaah!" nhỏ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | càng cắp; nổ lửa | `fxp_crab_claw`, `fx_fire_blast` | `prop pop` (outBack) 470 → `stretch`/squash ngang (khép) 480–560 → alpha 560–700; `strip fx_fire_blast size 0.6` 480 | 470–750 |
| L2 | lửa trên càng; càng đỏ dần | `fx_flame_loop` (nhỏ) | `strip fx_flame_loop size 0.35 spot front` loop 0–480; `glow #ff7a2a` tăng 0–280 | 0–480 |
| L3 | tàn bay; khói; vết cháy | `fxs_ember`, `fxs_puff` | `burst ember_rise` 0; `trail ember_trail` 280–480; `burst puff_rise spot head` 600; `decal scorch` 480 | 0–1050 |
| L4 | hit-stop; nhảy dựng | — | `stop medium`; `shake 4`; `move hop y 20` target | 480–750 |
L1 đạt 3/3: biến hình (càng khép, nổ khung) · phụ sinh (lửa / tàn từ càng) · vận tốc (bóp).

## 5. Asset
`fx_fire_blast`, `fx_flame_loop` **mới**; dự phòng `fx_flame_burst`, `glow` nhấp.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 đi ngang (`walk_sideways` thay `dash`) tới & về; mục tiêu nhảy, thổi tay · B3 càng cắp · B4 tàn, khói, vết · B5 hit-stop medium (rung 5 → 4) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~380 cua **nghiêng ngang** đang đi; khung ~520 càng **khép** (hẹp hơn khung 470).
