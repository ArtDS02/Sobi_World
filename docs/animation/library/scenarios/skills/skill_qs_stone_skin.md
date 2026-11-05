# Kịch bản: Da Đá (`skill_qs_stone_skin`)

```json scenario
{
  "id": "skill_qs_stone_skin", "kind": "skill", "name": "Da Đá", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/EARTH"],
  "assets": [
    { "id": "fxp_stone_plate", "state": "have", "layer": "L1" },
    { "id": "fx_stone_rise", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng đất #f6deb0)" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Sáu phiến đá lục giác trồi quanh rùa, bay lên ốp vào thân** từng phiến một (clack ×6 cao dần), khóa lại thành giáp. Cảm giác: chắc chắn, lắp ráp, tự tin. Buff thủ + khiên 20 %, T0. Nguồn: thiết kế gốc; bible [buff-and-heal](../../bibles/actions/buff-and-heal.md) (thủ: bao quanh).

## 2. Hiện tại
2 `fxp_stone_plate` quay `orbit` + `fx_shield_dome` 4 khung. Audit: `STATIC_HERO`, `STATIC_SHARE`. Chỉ 2 phiến thay vì 6, không có nhịp ốp từng phiến.

## 3. Kịch bản theo nhịp
| # | ms | Rùa | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Rụt | 0–300 | pose `cast`, rụt cổ (sy 0,9), mai sáng vàng | đất quanh chân nứt nhẹ | — | ù |
| 2 Trồi | 300–420 | — | 6 phiến đá **trồi quanh thân** (vòng tròn, lệch 20 ms) | — | lạo xạo |
| 3 Ốp | 420–780 | giật nhẹ mỗi lần một phiến ốp | phiến bay vòng lên rồi **ốp vào thân** lần lượt mỗi 60 ms, mỗi phiến 3 sỏi rơi | — | clack ×6 cao dần |
| 4 Khóa | 780 | bật thẳng (sy 1,1 → 1,0), thò đầu | khiên lục giác **ghép kín** tô vàng đất | — | "THUNK" |
| 5 Dư âm | 780–1150 | idle tự tin | phiến mờ thành viền sáng; `st_def_up`, `st_shield` | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | phiến trồi; phiến ốp; khiên | `fx_stone_rise` (nhỏ, 6 vị trí), `fxp_stone_plate` ×6, `fx_shield_form` | `strip fx_stone_rise size 0.35` quanh chân; 6 `prop orbit` → `grow` vào thân (size 0,3, stagger 60, ease outBack); `strip fx_shield_form` 780 | 300–1000 |
| L2 | mai sáng vàng | — | `glow #f6deb0` 0–300; nhấp sáng mỗi phiến ốp | 0–780 |
| L3 | sỏi rơi mỗi phiến | `fxs_pebble` | `burst pebble_fall` ×6 stagger 60 | 420–800 |
| L4 | thân giật từng nhịp + bật thẳng | — | `move squash 0.97` ×6 nhỏ; `move puff_up 1.1` 780 (không rung màn: T0) | 420–900 |
L1 đạt 3/3: biến hình (trồi + khiên ghép khung) · phụ sinh (sỏi) · vận tốc (ốp có overshoot).

## 5. Asset
`fx_stone_rise`, `fx_shield_form` **mới**; `fxp_stone_plate`, `fxs_pebble` có. Dự phòng: bỏ `fx_stone_rise` (phiến `rise` từ đất), `fx_shield_dome` thay `fx_shield_form`.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 780, end 1150 }` · B2 rụt cổ, giật từng nhịp, bật thẳng · B3 6 phiến trồi → ốp → khiên · B4 sỏi · B5 không rung · B6 clack cao dần (`adv_guard` + tầng âm) · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~600 thấy **phiến đã ốp và phiến đang bay cùng lúc**; khung 800 khiên kín; không rung màn.
