# Kịch bản hành động: Kháng trạng thái (`resist`)

```json scenario
{
  "id": "resist", "kind": "action", "name": "Kháng trạng thái", "element": "NONE", "tier": 0, "durationMs": 450,
  "status": "draft", "refs": [], "bibles": ["actions/status"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (K5, lóe trắng mỏng)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trạng thái xấu **bị gạt đi**: icon **bay tới rồi bật ngược ra** khỏi thân như chạm kính, khiên mỏng lóe một nhịp, con **lắc đầu "không!"**. Người chơi hiểu "kháng được".

## 2. Hiện tại
glow + sao + `fx_shield_dome`. Không thấy trạng thái "bị bật ra".

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Gạt | 0–250 | lắc đầu | icon xấu **bật ngược** ra khỏi thân, khiên lóe | "ting" |
| 2 Xong | 250–450 | đứng thẳng | sao nhỏ | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | khiên lóe | `fx_shield_form` (K5) | `strip frames [4,4] dur 200` |
| L3 | sao; icon bật | `fxs_star` | `burst star_pop`; icon: `prop` ảnh `st_*` bật ra (cần ảnh status vào prop — tạm dùng sao) |
| L4 | lắc đầu | — | `move wiggle n 2` |

## 5. Asset
`fx_shield_form` **mới**.

## 6. Các bước dựng
B1 ≤ 450 · B2 lắc đầu · B3 khiên lóe · B4 sao / icon bật · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Khác `guard` (không giữ khiên) và khác `debuff` (không xìu).
