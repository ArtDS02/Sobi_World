# Kịch bản: Mưa Hồi Phục (`skill_cl_healing_rain`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_healing_rain", "kind": "skill", "name": "Mưa Hồi Phục", "element": "SUPPORT", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxp_rain_cloud", "state": "have", "layer": "L1" },
    { "id": "fxp_rainbow", "state": "have", "layer": "L1" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Heo **vẫy gọi**, **đám mây hồng** trôi vào trên đội, **mưa giọt sáng xanh** rả rích, mỗi bạn nhún khi được tưới; mây **tan**, **cầu vồng nhỏ** hiện rồi mờ. Cảm giác: êm, mát, dễ chịu. Hồi 20 % cả đội, T0.

## 2. Hiện tại
`fxp_rain_cloud` (ảnh đứng) + mưa. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (1550).

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Gọi | 0–300 | pose `cast`, vẫy | — | "hú~" |
| 2 Mây vào | 300–550 | — | mây **trôi vào** từ trái, cuộn nhẹ (gợn), nhấp nhô | gió nhẹ |
| 3 Mưa | 550–1100 | mỗi bạn nhún khi giọt tới (stagger 100) | **giọt xanh sáng rơi** dưới mây, vòng hồi nở ở chân từng bạn | mưa rả rích + chuông |
| 4 Tan | 1100–1400 | idle | mây **tan** (alpha + nở rộng), **cầu vồng nhỏ** hiện rồi mờ | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | mây; cầu vồng | `fxp_rain_cloud`, `fxp_rainbow` (0,5) | mây `prop sweep` vào ease outQuad + `bobY` + `prop_displace` 300–1100 → tan 1100–1300; `prop grow` cầu vồng 1150 → alpha 1400 | 300–1400 |
| L3 | mưa; vòng hồi | `fxs_drop` (tô `#7ee08a`), `fx_heal_bloom` | `burst drop_fall` dưới mây lặp 550–1100; `strip fx_heal_bloom` per ally stagger 100 | 550–1250 |
| L4 | đội nhún | — | `move hop y 6` stagger 100 (không rung) | 600–1100 |
L1 đạt 3/3 (khi có displacement): biến hình (mây cuộn, tan) · phụ sinh (mưa từ mây) · vận tốc (trôi vào).

## 5. Asset
`fx_heal_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 600, end 1400 }` (rút 150) · B2 vẫy; đội nhún · B3 mây → cầu vồng · B4 mưa, vòng hồi · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: khung ~400 mây **đang trôi vào**; khung ~1250 cầu vồng.
