# Kịch bản hành động: Được tăng chỉ số (`buff`)

```json scenario
{
  "id": "buff", "kind": "action", "name": "Được tăng chỉ số", "element": "NONE", "tier": 0, "durationMs": 560,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "actions/status"],
  "assets": [
    { "id": "fx_buff_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo màu chỉ số)" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Lớp **chung** khi một chỉ số tăng mà status đó **chưa có** `apply` riêng: thân **"lên dây cót"** (nảy 14, gồng), **cột sáng mảnh vút lên** tô theo màu chỉ số, icon bật 0 → 1,4 → 1,0. Nhiều buff cùng lúc: icon bật **lần lượt** cách 120 ms. Hiện mọi status tăng đều có `apply` riêng (xem `statuses/*Up.md`) — action này là dự phòng.

## 2. Hiện tại
tia xanh nhạt + phồng + âm (mọi chỉ số như nhau).

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Lên dây cót | 0–560 | nảy 14, gồng sx 1,06 120 ms, viền sáng | cột sáng **lên** (màu chỉ số), 6 tia tỏa tròn; icon bật | "ting!" (cao độ theo chỉ số) |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | cột sáng | `fx_buff_rise` | `strip` tô màu |
| L3 | tia | `fxs_spark` | `burst spark_pop` |
| L4 | nảy, gồng | — | `move hop y 14` + `puff_up 1.06` |

## 5. Asset
`fx_buff_rise` **mới**.

## 6. Các bước dựng
B1 ≤ 560 · B2 nảy / gồng · B3 cột · B4 tia · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Không bao giờ chạy cùng `apply` riêng của status (không trùng lớp).
