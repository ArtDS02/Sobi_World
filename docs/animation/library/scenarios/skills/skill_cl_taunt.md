# Kịch bản: Khiêu Khích (`skill_cl_taunt`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_taunt", "kind": "skill", "name": "Khiêu Khích", "element": "SUPPORT", "tier": 0, "durationMs": 950,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fxp_taunt_badge", "state": "have", "layer": "L1" },
    { "id": "fx_shield_form", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô xanh, chỉ K3–K6 mỏng)" },
    { "id": "fxs_note", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Quay lưng lắc mông, lè lưỡi** chọc tức; **huy hiệu đỏ bật** trên đầu; cả phe địch **quay sang nhìn**, mắt lóe đỏ; vòng khiên mỏng ôm thân. Cảm giác: tinh nghịch, gây chú ý. Khiêu khích + khiên 8 %, T0.

## 2. Hiện tại
`fxp_taunt_badge pop` + quái nhìn + khiên. Audit: `STATIC_HERO`, `STATIC_SHARE`. Thiếu nhịp lắc mông (cá tính).

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Âm thanh |
|---|---|---|---|---|---|
| 1 Chọc | 0–300 | quay lưng (lật), **lắc mông 3 nhịp**, lè lưỡi | 2 nốt nhạc lệch tông | — | "nyeh~" |
| 2 Huy hiệu | 300–600 | quay lại, ưỡn ngực | huy hiệu **bật** 0 → 1,3 → 1,0, **lắc lư** | **quay nhìn** lần lượt (stagger 80), mắt lóe đỏ | "ding!" |
| 3 Khiên | 600 | — | vòng khiên mỏng khép quanh thân | — | "vmm" |
| 4 Dư âm | 600–950 | đứng thách | huy hiệu nhỏ dần về đầu; `st_taunt`, `st_shield` | nhìn chằm | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | huy hiệu | `fxp_taunt_badge` | `prop pop` (outBack) + `wobble rot 10 freq 3` 300–800 | 300–900 |
| L2 | mắt quái lóe đỏ | — | `glow #ff4a4a` foes stagger 80 | 350–600 |
| L3 | nốt nhạc; khiên mỏng | `fxs_note`, `fx_shield_form` | `burst note_pop` 100; `strip fx_shield_form frames [2,5] alpha 0.6` 600 | 100–900 |
| L4 | lắc mông; quái quay | — | `move wiggle n 3` + `flip` 0–300; `move look` foes (không rung) | 0–600 |
L1 đạt 2/3: vận tốc (pop, lắc) · phụ sinh (mắt quái lóe như phản ứng). Huy hiệu nhỏ — chấp nhận.

## 5. Asset
`fx_shield_form` **mới**; dự phòng `fx_shield_dome frames [2,3]`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 lắc mông, ưỡn; quái quay · B3 huy hiệu · B4 nốt, khiên · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~150 heo **quay lưng**; quái quay nhìn ở các khung khác nhau.
