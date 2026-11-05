# Kịch bản phản ứng: Cháy Rừng (`reaction_wildfire`)

```json scenario
{
  "id": "reaction_wildfire", "kind": "reaction", "name": "Cháy Rừng", "element": "FIRE", "tier": 2, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "elements/NATURE", "motifs/poison"],
  "assets": [
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,6)" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô cam, dải lửa chạy trên đất)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Mục tiêu **đang Trúng độc** trúng Lửa: bọt độc **bén lửa "phừng"**, rồi **dải lửa chạy lan** theo mặt đất sang mọi kẻ địch, mỗi con **nhảy cẫng**; lá cháy **cuộn thành tàn** bay lên. Cảm giác: lan nhanh, "fwoosh" dài. Bỏng cả phe 2 lượt, hết độc.

## 2. Hiện tại
tint + `fx_flame_burst` + nhảy + âm; không có dải lửa **chạy** giữa các con.

## 3. Kịch bản theo nhịp
| # | ms | Các mục tiêu | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Bén | 0–200 | con gốc giật | bọt độc **bén lửa** "phừng" (nổ nhỏ xanh → cam) | nền cam 15 % | "phừng" |
| 2 Lan | 200–700 | lần lượt **nhảy cẫng** (stagger 100) | **dải lửa chạy** trên đất từ con gốc sang từng con; nổ nhỏ dưới chân mỗi con | rung 2 | "fwoosh" dài |
| 3 Cháy | 700–1100 | thổi chân | lá cháy cuộn thành tàn bay lên; `st_burn` | nền về | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L0 | nền cam | — | `tint #ff7a2a 0.15` |
| L1 | dải lửa; nổ dưới chân | `fx_crack_spread` (cam, `under`), `fx_fire_blast` (0,6) | dải chạy 200–700; `strip` per foe stagger 100 |
| L3 | tàn; lá cháy | `fxs_ember`, `fxs_leaf` (tô cam) | `burst ember_rise` per foe; `burst leaf_rise tint #ff9a3c` 800 |
| L4 | nhảy cẫng | — | `move hop` stagger 100; `shake 2` |

## 5. Asset
`fx_fire_blast`, `fx_crack_spread` **mới**. Phản ứng hiện phát trên **một** đơn vị (`unit`) — dải lửa sang các con khác cần engine phát phản ứng với `who: foes` (kiểm `battleScript` reaction runner; ghi engine nếu thiếu).

## 6. Các bước dựng
B1 ≤ 1100 (giới hạn 1200) · B2 nhảy cẫng lần lượt · B3 dải lửa, nổ · B4 tàn, lá · B5 rung 2 · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~450 dải lửa **giữa hai con**; các con nhảy ở các khung khác nhau.
