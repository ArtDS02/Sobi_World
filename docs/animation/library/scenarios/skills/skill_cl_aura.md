# Kịch bản: Hào Quang (`skill_cl_aura`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_aura", "kind": "skill", "name": "Hào Quang", "element": "SUPPORT", "tier": 0, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (chỉ K5: sóng sáng chạy qua, mỏng)" },
    { "id": "fxs_leaf", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Vòng sáng mở** dưới chân heo; **ba vòng sáng đồng tâm lan** khắp đội như gợn nước, mỗi vòng qua một bạn làm bạn **nhún**; lá nhỏ bay lên, khiên **lóe** một lần. Cảm giác: lan tỏa, dịu, nhịp "wuuum ×3". Hồi phục + Thủ cả đội, T0.

## 2. Hiện tại
`fx_shield_dome` + hạt. Audit: `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Mở | 0–300 | pose `cast` | vòng sáng vàng xanh mở dưới chân heo | "wuum" |
| 2 Lan ×3 | 300 / 500 / 700 | mỗi bạn nhún khi vòng tới | 3 vòng đồng tâm **lan rộng** qua cả phe ta (mỗi vòng to hơn, mờ hơn) | "wuuum" ×3 |
| 3 Lóe | 950 | — | 8 lá bay lên + **khiên lóe** một lần trên mỗi bạn | ngân |
| 4 Dư âm | 950–1300 | idle | `st_regen`, `st_def_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 3 vòng lan | `decal ring` code | 3 `decal ring #b8f0a0` lớn dần (size 1 → 4) mỗi act, alpha giảm | 0–1000 |
| L3 | lá; khiên lóe | `fxs_leaf`, `fx_shield_form` (K5) | `burst leaf_rise` 950; `strip fx_shield_form frames [4,4] dur 200` per ally 950 | 950–1200 |
| L4 | đội nhún theo vòng | — | `move hop y 5` per ally theo khoảng cách (không rung) | 300–900 |
L1 đạt 2/3: biến hình (vòng lan to dần) · phụ sinh (lá, lóe).

## 5. Asset
`fx_shield_form` **mới**; dự phòng `fx_shield_dome frames [2,2]`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 cast; đội nhún theo vòng · B3 3 vòng · B4 lá, khiên lóe · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~600 thấy **≥ 2 vòng** cùng lúc ở hai bán kính.
