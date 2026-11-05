# Kịch bản: Dậm Đất (`skill_cl_stomp`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_stomp", "kind": "skill", "name": "Dậm Đất", "element": "SELF", "tier": 1, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit", "elements/EARTH"],
  "assets": [
    { "id": "fx_dust_ring", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $glow)" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $color, sóng đất chạy sang phe địch)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Nhấc chân thật cao, giữ, run run** — rồi **DẬM**: sóng đất chạy sang, phe địch **nảy lên lần lượt** "boing". Cảm giác: hài, có đà, lan. T1 diện rộng (power 0,6 — hiện quá tay T4: rung 8). Màu theo hệ, 70 % Chậm.

## 2. Hiện tại
`fx_ground_crack` + rung 8. Audit: `IMPACT_OVER_TIER`, `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Nhấc | 0–400 | nhấc chân **rất cao**, giữ 150, thân run | — | — | — | gồng |
| 2 Dậm | 400 | dậm, bẹp 0,85 | bụi vòng theo hệ | — | rung 3 dọc | "BOMP!" |
| 3 Sóng | 400–550 | — | **sóng đất chạy** sang phe địch | — | — | ầm chạy |
| 4 Nảy | 550–900 | — | hạt theo hệ bật dưới chân từng quái | **nảy 20** lần lượt (stagger 80) | hit-stop light 50 | "boing" ×n |
| 5 Dư âm | 900–1300 | idle | bụi lắng; `st_spd_down` | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | bụi vòng; sóng chạy | `fx_dust_ring` ($glow), `fx_crack_spread` ($color) | `strip fx_dust_ring under` 400; `strip fx_crack_spread under` 400–550 | 400–700 |
| L3 | hạt dưới chân quái | — | `burst $spark` per target stagger 80 | 550–900 |
| L4 | rung, hit-stop; quái nảy | — | `shake 3 dir [0,1]` (từ 8); `stop light`; `move hop y 20` stagger 80 | 400–1000 |
Thân heo (nhấc–giữ–dậm) + sóng chạy: đạt 2/3 (vận tốc, biến hình khung).

## 5. Asset
`fx_dust_ring`, `fx_crack_spread` **mới**; dự phòng `fx_ground_crack`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhấc / run / dậm; quái nảy · B3 bụi, sóng · B4 hạt · B5 **hạ rung về T1** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `IMPACT_OVER_TIER`, `SHARED_FLIPBOOK_HERO`; capture: khung ~300 chân heo **cao nhất**; quái nảy ở các khung khác nhau.
