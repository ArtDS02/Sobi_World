# Kịch bản: Đập Đá (`skill_qs_rock_smash`)

```json scenario
{
  "id": "skill_qs_rock_smash", "kind": "skill", "name": "Đập Đá", "element": "EARTH", "tier": 3, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/EARTH", "actions/projectile"],
  "assets": [
    { "id": "fxp_boulder", "state": "have", "layer": "L1" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Rùa dậm, **tảng đá trồi lên** trước mặt; rùa **húc** cho đá **lăn như bowling** sát đất, nảy một lần, **vỡ đôi** trên mục tiêu. Cảm giác: nặng, lì, "KRAK!". T3 (power 1,4), 30 % Choáng. Nguồn: thiết kế gốc; bible [EARTH](../../bibles/elements/EARTH.md).

## 2. Hiện tại
`fxp_boulder` `rise` rồi `throw` (một ảnh), va chạm `fx_pow_star` chung, rung 11. Audit: `STATIC_HERO`, `STATIC_SHARE`, `FEW_LAYERS`, `DURATION_UNDER`. Đá bay vồng như đạn chứ không lăn; không vỡ.

## 3. Kịch bản theo nhịp
| # | ms | Rùa | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Trồi | 0–400 | dậm 2 chân trước (`hop` thấp) | đất nứt, **đá trồi theo nấc** trước mặt, sỏi rơi khỏi đá | — | rung 2 | "grrnk" |
| 2 Húc | 400–480 | rụt cổ rồi húc (lunge 20) | đá bắt đầu lăn | — | — | "thud" |
| 3 Lăn | 480–860 | lò xo về | đá **lăn sát đất xoay 2 vòng**, nảy 1 lần giữa sân (bẹp khi chạm), vệt bụi nâu sau lưng | ngước | — | lăn ầm ì |
| 4 Vỡ | 860 | — | đá **vỡ đôi** trên thân mục tiêu + bụi vòng | văng 40 px, pose `hurt` | hit-stop medium 90, punch 1,04, rung 6 dọc | "KRAK!" |
| 5 Dư âm | 860–1300 | idle | hai nửa đá lăn lộc cộc ra hai phía rồi mờ, sỏi, bụi lắng; Choáng `st_stun` | ngồi phịch | — | lộc cộc |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | — | — | — | — |
| L1 | đá trồi; đá lăn; đá vỡ | `fx_stone_rise`, `fxp_boulder`, `fx_rock_burst` | `strip fx_stone_rise` tại `front` 0–400 → `prop throw` arc 10 + `spin 2` + nảy (hai `throw` nối, arc 25 rồi 8) + `squashOnHit` 480–860 → `strip fx_rock_burst` 860 | 0–1100 |
| L2 | vệt bụi sau đá | — | `trail` màu `#c08a50` | 480–860 |
| L3 | sỏi rơi khi trồi; bụi khi lăn; bụi vòng + sỏi khi vỡ; vết nứt | `fxs_pebble`, `fxs_puff`, `fx_dust_ring` | `burst pebble_fall` 200; `prop … trail puff_trail every 60`; `strip fx_dust_ring under` 860; `burst pebble_spray` 860; `decal crack` 860–1300 | 0–1300 |
| L4 | hit-stop, punch, rung dọc; mục tiêu văng | — | `stop medium`; `punch 1.04`; `shake 6 dir [0,1]`; `move knock x 40` | 860–1200 |
L1 đạt 3/3: biến hình (trồi + vỡ khung) · phụ sinh (bụi khi lăn) · vận tốc (lăn xoay, bẹp khi nảy).

## 5. Asset
`fx_stone_rise`, `fx_rock_burst`, `fx_dust_ring` **mới** ([ASSETS](../ASSETS.md)); `fxp_boulder`, `fxs_pebble`, `fxs_puff` có. Dự phòng: `prop rise` + `fx_rock_spike` (trồi), `fx_ground_crack` + `burst pebble_spray` (vỡ).

## 6. Các bước dựng
B1 nhịp `{ release 480, impact 860, end 1300 }` · B2 dậm, húc, mục tiêu văng + ngồi phịch · B3 trồi → lăn có nảy → vỡ · B4 sỏi, bụi, nứt · B5 hit-stop medium + punch (rung giảm từ 11 xuống 6) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, `FEW_LAYERS`, `DURATION_UNDER`; capture: khung giữa đường thấy đá **sát đất** (không vồng cao), khung `impact+80` thấy **hai nửa đá** tách ra; rung ≤ 6.
