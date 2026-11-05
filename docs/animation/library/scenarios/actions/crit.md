# Kịch bản hành động: Chí mạng (`crit`)

```json scenario
{
  "id": "crit", "kind": "action", "name": "Chí mạng", "element": "NONE", "tier": 3, "durationMs": 760,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (vàng + viền đỏ, size 1,2, sau lưng)" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (vàng, chữ thập chí mạng)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Như `heavy` nhưng **có chữ ký chí mạng**: **tách màu** + **chớp đỏ cam** + **sao chữ thập vàng** nở sau lưng mục tiêu; rung **có hướng**. Người chơi phải nhận ra "CHÍ MẠNG!" mà không cần đọc chữ.

## 2. Hiện tại
stop heavy 120 + punch 1,05 + chớp đỏ 0,28 + split + rung 6 có hướng + `fx_boom` vàng + sao + bounce. Đạt (bible: giữ); va chạm dùng `fx_boom` chung.

## 3. Kịch bản theo nhịp
| # | ms | Thân | Hiệu ứng | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Khựng | 0–120 | `hurt`, khựng | **sao chữ thập vàng** nở sau lưng + va chạm vàng viền đỏ | hit-stop heavy 120, punch 1,05, chớp đỏ cam 0,28, **tách màu** 120 | "KRA-TING!" |
| 2 Văng | 120–460 | văng 50 + xoay 20° | sao vàng + cam bung | rung 6 dir [1,0.4] | — |
| 3 Nảy | 460–760 | nảy 2 lần | — | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động |
|---|---|---|---|
| L1 | va chạm | `fx_hit_burst` (vàng viền đỏ, 1,2, `behind`) | thay `fx_boom` |
| L3 | sao chữ thập; sao | `fx_star_bloom` (vàng), `fxs_star` | `strip` 30; `burst star_pop` 100 (giữ) |
| L4 | giữ hiện có | — | `stop`, `punch`, `flash`, `split`, `shake`, `bounce` |

## 5. Asset
`fx_hit_burst`, `fx_star_bloom` **mới**.

## 6. Các bước dựng
B1 ≤ 760 · B2 giữ thân · B3 va chạm + sao chữ thập · B4 sao · B5 giữ · B6 âm riêng chí mạng · B7 capture (case crit).

## 7. Nghiệm thu
Capture crit khác heavy ở: sao chữ thập vàng, chớp đỏ, tách màu (so sánh hai sheet).
