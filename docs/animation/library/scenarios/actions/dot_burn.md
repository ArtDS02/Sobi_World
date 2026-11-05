# Kịch bản hành động: Mất máu vì Bỏng (`dot_burn`)

```json scenario
{
  "id": "dot_burn", "kind": "action", "name": "Mất máu vì Bỏng", "element": "FIRE", "tier": 0, "durationMs": 420,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "actions/status"],
  "assets": [
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (nhỏ 0,5 ở chân)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đầu lượt mất máu vì bỏng: **giật tại chỗ**, **nhảy cóc** một cái vì nóng, **lửa ở chân bùng** một nhịp, 4 tàn **bay lên**, tô cam 150 ms. "fsst".

## 2. Hiện tại
`fx_flame_burst` 0,5 ở chân + tàn + glow cam. Đạt; flipbook chung.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Bùng | 0–420 | giật + **nhảy cóc** 8, tint cam 150 | lửa chân **bùng** + 4 tàn bay lên | "fsst" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | lửa bùng | `fx_fire_blast` (0,5, `feet`) | thay `fx_flame_burst` |
| L2 | tint cam | — | `glow #ff9a4a tint` (giữ) |
| L3 | tàn | `fxs_ember` | giữ |
| L4 | giật / nhảy cóc | — | `move hop y 8` |

## 5. Asset
`fx_fire_blast` **mới**.

## 6. Các bước dựng
B1 ≤ 420 · B2 nhảy cóc · B3 lửa · B4 tàn · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Khác `dot_poison` (bay lên, cam, nhảy).
