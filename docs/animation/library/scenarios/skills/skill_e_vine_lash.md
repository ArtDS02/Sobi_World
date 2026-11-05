# Kịch bản: Quất Dây Leo (`skill_e_vine_lash`) — quái

```json scenario
{
  "id": "skill_e_vine_lash", "kind": "skill", "name": "Quất Dây Leo", "element": "NATURE", "tier": 2, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/NATURE", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_vine_grow", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô xanh lá)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **lắc người**, **dây leo vươn từ đất** cạnh nó, **giật ra sau** lấy đà rồi **quất cung chữ S** "CHÁT" vào mục tiêu; dây **rút về** đất. Cảm giác: roi, dẻo, có tiếng nổ. T2 (power 1,2). Dùng bởi Rêu Con, Cổ Thụ Giận Dữ.

## 2. Hiện tại
`fx_vine_grab` 4 khung + va chạm; ngắn 860. Audit: `DURATION_UNDER` (dư âm đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Báo | 0–300 | pose `attack`, lắc người | dây **mọc lên** cạnh quái, **ngả ra sau** | — | — | xào xạc |
| 2 Quất | 300–560 | ngả tới | dây **vươn dài** theo cung S qua sân (code ribbon có sóng), đầu dây nhanh nhất | — | — | "swish" |
| 3 Chát | 560 | — | đầu dây đập: va chạm xanh + lá văng | giật lệch theo hướng quất | hit-stop medium 70, rung 3 | "CHÁT!" |
| 4 Rút | 560–1100 | idle | dây **co lại** chui xuống đất, lá rơi | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | dây mọc; dây quất | `fx_vine_grow` (mọc tại chỗ), ribbon code (thân roi) | `strip fx_vine_grow frames [0,3]` cạnh actor 0–300; `ribbon` từ actor tới target `amp 0.12 freq 1.5` length tăng 300–560 → giảm 600–900 | 0–900 |
| L3 | va chạm; lá | `fx_hit_burst` (xanh), `fxs_leaf` | `strip` 560; `burst leaf_spray` 560; `burst leaf_fall` 760 | 560–1100 |
| L4 | hit-stop | — | `stop medium 70`; `shake 3`; `move knock x 14` | 560–800 |
L1 đạt 3/3: biến hình (mọc khung, roi sóng) · phụ sinh (lá) · vận tốc (ngả sau → quất).

## 5. Asset
`fx_vine_grow`, `fx_hit_burst` **mới**; dự phòng `fx_vine_grab`, `fx_slash_arc` xanh.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 560, end 1100 }` · B2 lắc, ngả; mục tiêu lệch · B3 dây mọc → roi → rút · B4 va chạm, lá · B5 hit-stop · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`; capture: khung ~450 thấy **dây cong chữ S** giữa sân.
