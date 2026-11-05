# Kịch bản hành động: Trúng mạnh (`heavy`)

```json scenario
{
  "id": "heavy", "kind": "action", "name": "Trúng mạnh", "element": "NONE", "tier": 3, "durationMs": 720,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (trắng, sau lưng mục tiêu)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" },
    { "id": "fxs_drop", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Một nhịp **đứng hình hài hước** (mắt tròn xoe) rồi mới **văng xa, xoay, nảy hai lần** trên đất — như anime. Dùng cho đòn mạnh (sát thương lớn) không phải chí mạng.

## 2. Hiện tại
stop 120 + punch 1,04 + chớp 0,25 + `fx_boom` trắng sau lưng + sao + bounce. Đạt (bible melee-and-hit: giữ). Thiếu nước mắt và nhịp "mắt tròn xoe".

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Đứng hình | 0–120 | pose `hurt`, **khựng**, mắt tròn | va chạm trắng to **sau lưng** | hit-stop heavy 120, punch 1,04, chớp 0,25 | "BWOMP!" |
| 2 Văng | 120–420 | **văng 44 + xoay 18°** | 6 sao to, 6 nước mắt | rung theo đòn ×1,5 | — |
| 3 Nảy | 420–720 | **nảy 2 lần** (14 → 5 px), lò xo về | — | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | va chạm sau lưng | `fx_hit_burst` (trắng, `behind`) | thay `fx_boom` |
| L3 | sao; nước mắt | `fxs_star`, `fxs_drop` | `burst star_pop more 1.2`; `burst tears more 1.5` |
| L4 | khựng → văng → nảy | — | giữ `stop`, `punch`, `bounce n 2`; thêm `move knock x 44 deg 18` |

## 5. Asset
`fx_hit_burst` **mới**.

## 6. Các bước dựng
B1 ≤ 720 · B2 khựng / văng / nảy · B3 va chạm sau lưng · B4 sao, nước mắt · B5 giữ hit-stop heavy (hành động chung, ngoài giới hạn skill) · B6 âm · B7 capture (case heavy).

## 7. Nghiệm thu
Capture: khung 60 mục tiêu **ở chỗ cũ** (khựng); khung 300 **xa + nghiêng**; hai khung nảy khác độ cao.
