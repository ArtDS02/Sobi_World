# Kịch bản hành động: Quái vào trận (`enter_enemy`)

```json scenario
{
  "id": "enter_enemy", "kind": "action", "name": "Quái vào trận", "element": "NONE", "tier": 0, "durationMs": 700,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states", "elements/DARK"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tím than; quái tha hóa thêm viền hồng)" },
    { "id": "fx_poof", "state": "have", "layer": "L1" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **hiện ra từ khói** tím than: khói **cuộn** tại chỗ, quái **phóng to** 0,6 → 1,08 → 1,0, **rung mình** như vừa tỉnh; lệch nhau 110 ms. Quái tha hóa: khói có viền hồng răng cưa (Umbraflux). Trùm: xem `boss_phase`.

## 2. Hiện tại
`fx_poof` tím + appear + puff_up + shake. Đạt; khói là poof 4 khung (bùng rồi hết), không cuộn.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Khói | 0–250 | — | khói tím than **bùng + cuộn** tại chỗ | "poof" |
| 2 Hiện | 120–450 | phóng to 0,6 → 1,08 → 1,0 | khói tan dần | — |
| 3 Rung mình | 450–700 | rung mình, mắt sáng 1 nhịp | — | gầm nhỏ theo loài |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khói | `fx_poof` (bùng), `fx_smoke_curl` (cuộn) | poof 0; khói loop 0–400 alpha giảm |
| L2 | mắt sáng | — | `glow` 450 |
| L4 | phóng to, rung | — | giữ |

## 5. Asset
`fx_smoke_curl` **mới**.

## 6. Các bước dựng
B1 700, stagger 110 · B2 giữ thân · B3 khói cuộn · B5 không rung màn · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khói **đổi hình** giữa khung 100 và 250.
