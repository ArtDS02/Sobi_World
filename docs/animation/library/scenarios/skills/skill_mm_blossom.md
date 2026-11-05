# Kịch bản: Hoa Hồi Sinh (`skill_mm_blossom`)

```json scenario
{
  "id": "skill_mm_blossom", "kind": "skill", "name": "Hoa Hồi Sinh", "element": "SUPPORT", "tier": 0, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/NATURE"],
  "assets": [
    { "id": "fxp_flower_big", "state": "have", "layer": "L1" },
    { "id": "fx_bloom_open", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô hồng nhạt, size 1,4)" },
    { "id": "fxs_petal", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Một **nụ hoa lớn trồi giữa đội**, **nở từng tầng cánh**; **cánh hoa bay vòng** quanh cả đội như gió xoáy nhẹ rồi **đậu lên từng bạn**; hoa khép lại chìm xuống. Cảm giác: êm, xuân, chăm sóc. Hồi phục cả đội, T0.

## 2. Hiện tại
`fxp_flower_big grow` 1,1 s (ảnh to dần), cánh hoa rơi. Audit: `STATIC_HERO`, `STATIC_SHARE`. Hoa không nở, cánh không bay vòng.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Nhắm mắt | 0–300 | pose `cast` | vòng sáng hoa dưới chân heo | — | ngân |
| 2 Nở | 300–750 | — | **nụ trồi** giữa đội → **nở từng tầng** cánh (flipbook), nhị sáng; hoa đứng **lay nhẹ** | — | hợp âm hoa nở |
| 3 Xoáy | 750–1150 | — | 24 cánh hoa **bay vòng** quanh cả đội rồi **đậu** lên từng bạn (stagger 100) | — | "shff" |
| 4 Dư âm | 1150–1450 | mỗi bạn nhún, `st_regen` | hoa **khép lại** và chìm xuống | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | hoa nở; hoa đứng | `fx_bloom_open` (nở), `fxp_flower_big` (đứng + khép) | `strip fx_bloom_open size 1.4 hold 400` 300–750 → chuyển sang `fxp_flower_big` + `wobble rot 3` + `prop_displace` nhẹ 750–1150 → `grow` ngược + chìm 1150–1400 | 300–1400 |
| L2 | vòng hoa dưới chân heo | — | `decal ring #d6ffa8` 0–400 | 0–400 |
| L3 | cánh xoáy rồi đậu | `fxs_petal` | `burst petal_ring` 750 (vòng) → `burst petal_fall` per ally stagger 100 | 750–1250 |
| L4 | đội nhún | — | `move hop y 6` per ally (không rung) | 850–1300 |
L1 đạt 3/3: biến hình (nở khung, khép) · phụ sinh (cánh hoa từ hoa) · vận tốc (lay, chìm).

## 5. Asset
`fx_bloom_open` **mới**; dự phòng `fx_bloom` + `fxp_flower_big grow`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhắm mắt; đội nhún · B3 nở → đứng lay → khép · B4 vòng, cánh xoáy · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~450 hoa **nở dở**; khung ~900 cánh hoa **thành vòng** quanh đội.
