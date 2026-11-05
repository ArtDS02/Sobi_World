# Kịch bản: Tường Khiên (`skill_cl_shield_wall`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_shield_wall", "kind": "skill", "name": "Tường Khiên", "element": "SUPPORT", "tier": 0, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô xanh nhạt)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **giơ chân trước** ra lệnh; **khiên lục giác ghép dần** trước từng bạn (lệch nhịp); các khiên **nối nhau bằng một đường sáng** thành **bức tường**; tường mờ thành viền. Cảm giác: đồng đội, kỷ luật. Khiên 15 % cả đội, T0.

## 2. Hiện tại
`fx_shield_dome` từng bạn + tether. Audit: `FEW_LAYERS`, `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Ra lệnh | 0–300 | pose `cast`, giơ chân trước | lóe ở chân | "hup" |
| 2 Dựng | 300–800 | mỗi bạn đứng thẳng | khiên **ghép** trước từng bạn (stagger 120) | "vmm" ×n |
| 3 Nối | 800–1000 | — | **đường sáng chạy** nối khiên này sang khiên kia → tường; sóng sáng chạy dọc tường | "ting" nối |
| 4 Dư âm | 1000–1250 | idle | tường mờ thành viền; `st_shield` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | khiên từng bạn | `fx_shield_form` | `strip` per ally stagger 120 `hold 300` | 300–1100 |
| L2 | đường nối; sóng sáng | — | `tether` allies → allies `wave 0` xanh nhạt 800–1000; `glow` chạy lần lượt | 800–1050 |
| L3 | lấp lánh | `fxs_star` | `burst star_pop` mỗi điểm nối | 850–1000 |
| L4 | đội đứng thẳng | — | `move puff_up 1.03` stagger 120 (không rung) | 300–900 |
L1 đạt 2/3: biến hình (ghép khung) · phụ sinh (đường nối, sao).

## 5. Asset
`fx_shield_form` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 300, impact 800, end 1250 }` · B2 giơ chân; đội thẳng · B3 khiên · B4 đường nối, sao · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `FEW_LAYERS`, `SHARED_FLIPBOOK_HERO`; capture: khung ~900 đường sáng **nối giữa hai khiên**.
