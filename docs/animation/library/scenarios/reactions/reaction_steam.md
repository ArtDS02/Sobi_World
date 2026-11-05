# Kịch bản phản ứng: Hơi Nước (`reaction_steam`)

```json scenario
{
  "id": "reaction_steam", "kind": "reaction", "name": "Hơi Nước", "element": "FIRE", "tier": 1, "durationMs": 800,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "elements/WATER"],
  "assets": [
    { "id": "fx_smoke_curl", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô trắng, hơi nước dày)" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Lửa chạm nước: **hơi nước trắng phụt lên dày**, **xoắn lên**, che nửa trên mục tiêu 600 ms; con **quạt tay ho**; hơi tan thì `st_acc_down` hiện. Cảm giác: "PSSHHH", mờ mịt. Giảm chính xác 2 lượt, hết Ướt.

## 2. Hiện tại
khói bay lên + khói pop + rung thân + **âm lửa** (`adv_fire_hit`). Hơi mỏng, không xoắn, âm sai.

## 3. Kịch bản theo nhịp
| # | ms | Mục tiêu | Hiệu ứng | Âm thanh |
|---|---|---|---|---|
| 1 Phụt | 0–150 | giật | hơi trắng **phụt** từ thân (bung tròn) | "PSSH" |
| 2 Xoắn | 150–600 | **quạt tay**, ho, nheo mắt | hơi **xoắn lên** cuộn liên tục, che nửa trên | "HHHH" xì kéo dài |
| 3 Tan | 600–800 | dụi mắt | hơi **mỏng dần** bay lên; `st_acc_down` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | hơi xoắn | `fx_smoke_curl` (trắng, 1,2, `spot chest`) | loop 150–600, alpha giảm 600–800 |
| L3 | phụt; hơi bay | `fxs_puff` | `burst puff_pop tint #ffffff more 1.5` 0; `burst puff_rise` 300, 500 |
| L4 | quạt tay / ho | — | `move wiggle` + `move shake` nhỏ (không hit-stop) |

## 5. Asset
`fx_smoke_curl` **mới**. Âm: cần SFX hơi nước riêng (`adv_steam`?) — ghi ASSET_TODO âm thanh; tạm dùng `adv_water_hit`.

## 6. Các bước dựng
B1 ≤ 800 · B2 quạt / ho / dụi · B3 hơi xoắn · B4 phụt · B5 không rung · B6 đổi âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~400 nửa trên mục tiêu **bị hơi che**; hơi xoắn đổi hình giữa khung.
