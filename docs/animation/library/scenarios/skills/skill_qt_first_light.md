# Kịch bản: Ánh Sáng Đầu Tiên (`skill_qt_first_light`)

```json scenario
{
  "id": "skill_qt_first_light", "kind": "skill", "name": "Ánh Sáng Đầu Tiên", "element": "SUPPORT", "tier": 0, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/LIGHT"],
  "assets": [
    { "id": "fxp_sun_disc", "state": "have", "layer": "L1" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng hồng bình minh)" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" },
    { "id": "fxs_petal", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
**Mặt trời bình minh mọc sau lưng đồng đội**, **nắng quét qua** thổi bay mọi biểu tượng xấu như bụi (kể cả Diệt vong), hoa nở ở chân. Cảm giác: ấm, hy vọng, buổi sáng. Hồi 28 % + xóa trạng thái xấu, T0.

## 2. Hiện tại
`fxp_sun_disc rise` 1 s (một đĩa đứng yên) + `fx_bloom` + cánh hoa. Audit: `STATIC_HERO`, `STATIC_SHARE`. Không có nắng quét, không thấy biểu tượng xấu bị thổi bay.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đồng đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Ngước | 0–360 | pose `cast`, ngước lên, đèn sáng | — | nền ngả hồng cam 12 % | chim hót nhỏ |
| 2 Mọc | 360–820 | — | mặt trời **mọc** sau đồng đội từ dưới đất, **tia tỏa nhấp nhô** (xoay chậm + gợn) | sáng dần | ngân |
| 3 Quét | 820–1000 | đồng đội vươn người | **dải nắng quét ngang** qua thân; mỗi biểu tượng xấu bong ra bay đi như bụi xám | chớp ấm 0,1 | "whoosh" bụi |
| 4 Nở | 1000 | — | vòng hồi máu **nở** ở chân, số hồi | — | chuông sáng |
| 5 Dư âm | 1000–1400 | idle | mặt trời **lặn** xuống, 8 cánh hoa hồng bay | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền bình minh | — | `tint #ffb07a 0.12` | 0–1400 |
| L1 | mặt trời; vòng hồi | `fxp_sun_disc` (`behind`), `fx_heal_bloom` | `prop rise` + `spin 0.2` + `prop_displace` (tia gợn) 360–820, đứng tới 1000, `rise` ngược lặn 1000–1350; `strip fx_heal_bloom` 1000 | 360–1350 |
| L2 | dải nắng quét | — | `beam` ngang mỏng `#ffe98a` 820–1000 (hoặc `ribbon` rộng alpha 0,4) | 820–1000 |
| L3 | bụi xám từ biểu tượng xấu; cánh hoa | `fxs_puff`, `fxs_petal` | `burst puff_spray tint #9a9a9a` 850; `burst petal_rise` 1050 | 850–1400 |
| L4 | đồng đội vươn | — | `move puff_up 1.06` 820 (T0, không rung) | 820–1100 |
L1 đạt 3/3: biến hình (tia gợn, vòng hồi nở) · phụ sinh (nắng → bụi, cánh hoa) · vận tốc (mọc / lặn có ease).

## 5. Asset
`fx_heal_bloom` **mới** (dự phòng `fx_bloom`); còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 360, impact 1000, end 1400 }` · B2 ngước, vươn · B3 mặt trời mọc → quét → vòng hồi → lặn · B4 bụi, hoa · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~600 mặt trời **mọc dở**; khung ~900 dải nắng ngang thân; khung cuối mặt trời đã thấp xuống.
