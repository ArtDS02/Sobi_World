# Kịch bản: Vỏ Sắt (`skill_e_iron_shell`) — quái

```json scenario
{
  "id": "skill_e_iron_shell", "kind": "skill", "name": "Vỏ Sắt", "element": "SUPPORT", "tier": 0, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/METAL"],
  "assets": [
    { "id": "fxs_metal_bit", "state": "have", "layer": "L1" },
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô bạc)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Quái **rụt người**, **tám mảnh sắt bay lượn** xếp thành **vỏ cầu** quanh thân (leng keng), **chốt "CLANG"** — tia sáng bạc chạy qua. Cảm giác: cơ khí, lắp ráp. Thủ + Thủ phép, T0. Bọ Giáp Thép, Người Đá Quặng.

## 2. Hiện tại
`fxs_metal_bit` + khiên; rung nhẹ. Audit: `STATIC_HERO`, `STATIC_SHARE`.

## 3. Kịch bản theo nhịp
| # | ms | Quái | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Rụt | 0–250 | rụt người 0,9 | — | — |
| 2 Lượn | 250–750 | — | 8 mảnh sắt **bay lượn** quanh thân (orbit nhiều bán kính), **xếp dần** vào vị trí vỏ | leng keng ×8 |
| 3 Chốt | 750 | bật | vỏ **ghép kín**, lóe chữ thập bạc, sóng sáng chạy qua mặt vỏ | "CLANG" |
| 4 Dư âm | 750–1150 | idle | vỏ trong mờ; `st_def_up`, `st_mdef_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | mảnh sắt; vỏ | `fxs_metal_bit` ×8 (0,2), `fx_shield_form` (bạc) | `prop orbit` bán kính giảm + `spin` → `grow` vào vị trí stagger 60; `strip fx_shield_form` 750 | 250–1000 |
| L3 | lóe | `fx_metal_spark` | `strip` 750 | 750–900 |
| L4 | rụt / bật | — | `move squash 0.9` → `puff_up 1.04` (không rung; bỏ rung hiện có) | 0–900 |
L1 đạt 2/3: biến hình (vỏ ghép) · vận tốc (lượn, xếp).

## 5. Asset
`fx_shield_form`, `fx_metal_spark` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 rụt / bật · B3 mảnh lượn → vỏ · B4 lóe · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, không `IMPACT_OVER_TIER`; capture: khung ~500 mảnh ở nhiều bán kính.
