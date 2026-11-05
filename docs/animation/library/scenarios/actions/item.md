# Kịch bản hành động: Dùng vật phẩm (`item`)

```json scenario
{
  "id": "item", "kind": "action", "name": "Dùng vật phẩm", "element": "NONE", "tier": 0, "durationMs": 850,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_poof", "state": "have", "layer": "L1" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["item_icon_prop"]
}
```

## 1. Ý tưởng
**Lôi đồ trong túi ra**: cúi xuống, ngẩng lên — **icon vật phẩm** bật lên 50 px trên đầu, **xoay một vòng**, rồi **bay vồng** tới mục tiêu (hoặc vỡ trên đầu nếu dùng cho mình); vỡ thành khói tô theo **tác dụng** (xanh lá hồi máu, xanh tím MP, vàng thanh tẩy). "zip – pop – plink".

## 2. Hiện tại
Như skill hỗ trợ không vòng phép. Không thấy **vật phẩm nào** được dùng.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Lục túi | 0–120 | cúi xuống | — | "zip" |
| 2 Giơ | 120–400 | ngẩng lên | **icon vật phẩm** bật lên 50 px, xoay 1 vòng | "pop" |
| 3 Bay | 400–650 | — | icon bay vồng tới mục tiêu (hoặc ở yên) | vút |
| 4 Vỡ | 650–850 | mục tiêu nhún | khói **tô theo tác dụng** + 8 hạt (cộng / sao) | "plink" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | icon vật phẩm; khói | ảnh `ui_item_*` của vật phẩm dùng (cần `prop` nhận ảnh UI theo vật phẩm — engine `item_icon_prop`), `fx_poof` | `prop pop` + `spin 1` → `throw` arc 40; `strip fx_poof` tô theo tác dụng |
| L3 | hạt | `fxs_plus` / `fxs_star` | theo tác dụng |
| L4 | cúi / ngẩng; nhún | — | `move squash` → `puff_up` |

## 5. Asset
Đủ ảnh; cần engine `item_icon_prop` (act biết vật phẩm đang dùng).

## 6. Các bước dựng
B1 850 · B2 cúi / ngẩng / nhún · B3 icon + khói · B4 hạt theo tác dụng · B5 không rung · B6 âm · B7 capture (bình máu, bình MP, thuốc thanh tẩy).

## 7. Nghiệm thu
Capture: khung ~300 thấy **đúng icon** vật phẩm trên đầu; màu khói khác nhau giữa 3 loại vật phẩm.
