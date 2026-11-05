# Kịch bản: Mổ Tia Điện (`skill_e_spark_peck`) — quái chim

```json scenario
{
  "id": "skill_e_spark_peck", "kind": "skill", "name": "Mổ Tia Điện", "element": "LIGHTNING", "tier": 2, "durationMs": 950,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng, size 0,6)" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" },
    { "id": "fxs_feather", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Chim **xù lông tích điện** lách tách, **lao zig-zag**, **mổ hai nhát** tóe lửa điện; bay ngược về, lông rơi. Cảm giác: nhanh, nhỏ, cay. T2 (power 1,3). Sẻ Sấm, Ưng Vách Đá.

## 2. Hiện tại
`fx_pow_star` ×2 chung, 880 ms. Audit: `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`; bậc có T1.

## 3. Kịch bản theo nhịp
| # | ms | Chim | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Xù | 0–250 | **xù lông** 1,1, run | 4 tia nhỏ lách tách quanh thân | — | — | "bzz" |
| 2 Zig-zag | 250–380 | lao **zig-zag** (lệch dọc ±12 ×2) | vệt vàng | — | — | vút |
| 3 Mổ ×2 | 380 / 470 | mổ (gập đầu) | va chạm vàng nhỏ ×2 + tia | giật ×2 | hit-stop light 40, rồi medium 60, rung 3 | "tik-tik!" |
| 4 Về | 470–950 | bay ngược về, lắc | hồ quang nhỏ trên mục tiêu; 3 lông rơi | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | va chạm ×2 | `fx_hit_burst` (vàng, 0,6) | `strip` 380, 470 | 380–650 |
| L2 | vệt zig-zag | — | `trail #ffe14a every 30` | 250–380 |
| L3 | tia quanh thân; hồ quang; lông | `fxs_bolt_mini`, `fx_spark_arc`, `fxs_feather` | `burst bolt_pop` 0–250; `strip fx_spark_arc size 0.5` 500; `burst feather_fall` 600 | 0–950 |
| L4 | hit-stop ×2 | — | `stop light`, `stop medium`; `shake 3`; `move shake` target | 380–700 |
Thân chim (xù, zig-zag, mổ) + va chạm 6 khung: đạt 2/3.

## 5. Asset
`fx_hit_burst`, `fx_spark_arc` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 250, impact 470, end 950 }` · B2 xù, zig-zag, mổ ×2, về · B3 va chạm · B4 tia, hồ quang, lông · B5 hit-stop (lên T2) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`, bậc T2; capture: khung ~320 chim **lệch dọc** so với đường thẳng.
