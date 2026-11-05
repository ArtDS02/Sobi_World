# Kịch bản: Hồi Sức (`skill_cl_second_wind`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_second_wind", "kind": "skill", "name": "Hồi Sức", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_wind_swirl", "state": "have", "layer": "L1" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Thở dốc** (mồ hôi), **hít một hơi thật sâu** (phồng to, gió xanh cuộn vào), **thổi "phù"** — khói xám mang **trạng thái xấu bay đi**, đứng thẳng tươi tỉnh. Cảm giác: hài hước, hồi phục thật. Hồi 25 % + xóa 1 trạng thái xấu, T0.

## 2. Hiện tại
`fx_wind_swirl` + hạt. Audit: không cờ, nhưng thiếu nhịp thở dốc → hít → thổi.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Thở dốc | 0–300 | thở nhanh (squash nhịp 0,96 ×3), mồ hôi | 2 giọt mồ hôi bay | hổn hển |
| 2 Hít | 300–700 | **phồng to 1,12** dần | gió xanh **cuộn vào** từ dưới chân | "haaa" |
| 3 Thổi | 700 | xẹp nhanh về 1,0 | 6 khói xám bay **ra khỏi thân** (mang icon xấu); vòng hồi nở ở chân | "phù~" |
| 4 Tươi tỉnh | 700–1150 | đứng thẳng, nhún 1 cái | dấu cộng nhỏ bay lên | ngân nhẹ |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | gió cuộn vào; vòng hồi | `fx_wind_swirl` (xanh lá), `fx_heal_bloom` | `strip fx_wind_swirl under hold 200` 300–700; `strip fx_heal_bloom` 700 | 300–1000 |
| L3 | mồ hôi; khói xám; dấu cộng | `fxs_drop`, `fxs_puff` | `burst drop_pop spot head` 100; `burst puff_spray tint #9a9a9a` 700; `burst plus_rise` 750 | 100–1150 |
| L4 | thở dốc / phồng / xẹp / nhún | — | `move squash 0.96` ×3; `move puff_up 1.12` 300–700; `move hop` 900 (không rung) | 0–1150 |
L1 đạt 2/3: biến hình (gió, vòng hồi khung) · phụ sinh (khói từ thân). Thân heo mang phần lớn chuyển động.

## 5. Asset
`fx_heal_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 thở dốc → phồng → xẹp → nhún · B3 gió, vòng hồi · B4 mồ hôi, khói, cộng · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~650 heo **to hơn** khung 0; khung ~750 khói xám bay ra.
