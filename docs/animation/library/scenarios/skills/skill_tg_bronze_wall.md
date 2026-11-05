# Kịch bản: Tường Khiên Đồng (`skill_tg_bronze_wall`)

```json scenario
{
  "id": "skill_tg_bronze_wall", "kind": "skill", "name": "Tường Khiên Đồng", "element": "SUPPORT", "tier": 0, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/METAL"],
  "assets": [
    { "id": "fxp_bronze_shield", "state": "have", "layer": "L1" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đồng #c8873a)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Khiên tháp đồng rơi cắm phập** trước mặt; heo **gõ khiên ba tiếng** (ting – ting – TING), mỗi tiếng một **vòng sóng đồng** lan sang phe địch, quái **quay nhìn**. Cảm giác: thách thức, vang. Thủ + Khiêu khích, T0 (rung nhẹ khi cắm chấp nhận, ≤ 2).

## 2. Hiện tại
`fxp_bronze_shield fall` + poof + 3 decal + quái nhìn; rung đã hạ còn 2. Audit: `STATIC_HERO`, `STATIC_SHARE`. Gõ khiên không có phản ứng trên khiên.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Dựng | 0–250 | pose `cast`, dựng chân trước | bóng khiên trên đất lớn dần | — | — | — |
| 2 Cắm | 250–470 | — | khiên **rơi cắm**, **lún + nảy** nhẹ, bụi vòng | — | rung 2 | "THUNK" |
| 3 Gõ ×3 | 520 / 680 / 840 | gõ móng vào khiên | mỗi tiếng: khiên **rung** (lắc ±3°), **tia đồng lóe**, vòng sóng đồng lan sang phải; tiếng 3 to nhất | lần lượt **quay nhìn** | — | ting – ting – TING |
| 4 Dư âm | 1000–1250 | đứng sau khiên | khiên mờ thành viền; `st_def_up`, `st_taunt` | nhìn chằm | — | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | khiên | `fxp_bronze_shield` | `prop fall` + `shadow` + `squashOnHit` 250–470; `wobble rot 3` nhịp ở 520/680/840; alpha → 0,4 1000–1250 | 250–1250 |
| L2 | lóe trên mặt khiên | — | `glow #c8873a` nhấp 3 lần | 520–900 |
| L3 | bụi khi cắm; tia đồng; vòng sóng | `fx_dust_ring`, `fx_metal_spark` | `strip fx_dust_ring under` 470; `strip fx_metal_spark size 0.5` ×3; `decal ring` foeside ×3 (cái thứ 3 to hơn) | 470–1200 |
| L4 | quái quay nhìn | — | `move look` foes stagger theo vòng sóng; rung ≤ 2 | 520–1000 |
L1 đạt 2/3: phụ sinh (tia, sóng từ khiên) · vận tốc (cắm lún nảy, rung khi gõ). Vật rắn: không cần biến hình.

## 5. Asset
`fx_dust_ring`, `fx_metal_spark` **mới**; dự phòng `fx_poof`, `burst metal_pop`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 dựng chân, gõ ×3; quái quay · B3 khiên cắm + rung · B4 bụi, tia, sóng · B5 rung ≤ 2 · B6 âm 3 tiếng tăng · B7 capture.

## 7. Nghiệm thu
Audit không `IMPACT_OVER_TIER`; hình tĩnh chấp nhận với 2/3 dấu hiệu (ghi lý do); capture: 3 vòng sóng ở 3 khung; quái quay nhìn lần lượt.
