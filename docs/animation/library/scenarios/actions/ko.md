# Kịch bản hành động: Bị hạ (`ko`)

```json scenario
{
  "id": "ko", "kind": "action", "name": "Bị hạ", "element": "NONE", "tier": 2, "durationMs": 900,
  "status": "draft", "refs": [], "bibles": ["actions/idle-and-states"],
  "assets": [
    { "id": "fx_poof", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ngồi bệt mắt xoắn ốc**, sao vàng bay vòng đầu, **"linh hồn nhỏ" bay lên rồi tụt về** — dễ thương, **không gợi chết** (decision 002 / 039: thua là kiệt sức). "bonk + wheee".

## 2. Hiện tại
chớp 0,1 + spin + `fx_poof` + sao. Đạt cơ bản; không có "linh hồn nhỏ", xám / mờ có thể gợi chết nếu quá tối.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Đổ | 0–250 | chớp trắng, **xoay 1 vòng nhỏ** tại chỗ | poof 1,2 | rung 3 | "bonk" |
| 2 Ngồi bệt | 250–600 | pose `ko`, lún 10, **xám nhẹ** (không quá 40 %), mờ còn 60 % | 4 sao vàng bay vòng đầu 2 vòng | — | "wheee" |
| 3 Hồn nhỏ | 400–900 | — | một đốm sáng mềm **bay lên 30 px rồi tụt về** thân (vẫn ở đó) | — | "pip" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | poof | `fx_poof` | giữ |
| L2 | hồn nhỏ | `fxs_star` (trắng, mềm, 0,2) | `prop rise` 30 → `fall` về (không bay mất) |
| L3 | sao vòng đầu | `fxs_star` | `prop orbit` 2 vòng |
| L4 | xoay, ngồi, lún | — | giữ `spin`; pose `ko`; alpha tối thiểu 0,6 |

## 5. Asset
Đủ.

## 6. Các bước dựng
B1 900 · B2 xoay / ngồi / lún · B3 poof · B4 sao, hồn nhỏ (về lại) · B5 rung 3 · B6 âm · B7 capture (case ko).

## 7. Nghiệm thu
Capture cuối: con bị hạ **vẫn thấy rõ**, ngồi bệt; hồn nhỏ **không bay mất**.
