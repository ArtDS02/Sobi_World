# Kịch bản: Bùa Hộ Thân (`skill_e_holy_ward`) — quái Hồn Rune

```json scenario
{
  "id": "skill_e_holy_ward", "kind": "skill", "name": "Bùa Hộ Thân", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/LIGHT"],
  "assets": [
    { "id": "fx_bloom_open", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng trắng, huy hiệu hoa)" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng)" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đốm rune **xoay**, một **huy hiệu hoa sáng** nở trước nó rồi **bay tới** đồng bọn, **mở thành vòm bảo hộ** vàng; điều xấu **tan**, máu hồi. Cảm giác: thiêng, che chở. Hồi 30 % + xóa trạng thái xấu, T0.

## 2. Hiện tại
`fx_bloom` + khiên. Audit: không cờ, nhưng huy hiệu không bay, vòm dùng flipbook chung.

## 3. Kịch bản theo nhịp
| # | ms | Hồn rune / đồng bọn | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Xoay | 0–300 | xoay nhanh | **hoa sáng nở** trước thân | ngân |
| 2 Bay | 300–650 | — | huy hiệu hoa **bay vồng** tới đồng bọn, xoay chậm | — |
| 3 Mở vòm | 650 | đồng bọn đứng thẳng | **vòm vàng ghép** quanh thân; vòng hồi ở chân; điều xấu tan thành khói | chuông thánh |
| 4 Dư âm | 650–1150 | idle | lấp lánh | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | hoa; vòm | `fx_bloom_open` (vàng trắng, nở tại actor; bay = `fxs_star` to tô vàng thay thế khi đang bay), `fx_shield_form` | `strip fx_bloom_open` 0–300; `prop throw fxs_star` 300–650; `strip fx_shield_form` 650 | 0–1000 |
| L3 | vòng hồi; khói xấu tan; lấp lánh | `fx_heal_bloom` | `strip` 650; `burst puff_rise tint #9a9a9a` 680; `burst star_fall` 800 | 650–1150 |
| L4 | đứng thẳng | — | `move puff_up 1.04` (không rung) | 650–850 |
L1 đạt 2/3: biến hình (nở, ghép) · vận tốc (bay vồng).

## 5. Asset
`fx_bloom_open`, `fx_shield_form`, `fx_heal_bloom` **mới**; dự phòng `fx_bloom`, `fx_shield_dome`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 xoay; đứng thẳng · B3 hoa → bay → vòm · B4 vòng hồi, khói, lấp lánh · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~450 huy hiệu **giữa đường**; khung ~700 vòm quanh đồng bọn.
