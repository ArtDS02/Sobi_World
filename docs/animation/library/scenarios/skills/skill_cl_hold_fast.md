# Kịch bản: Thủ Vững (`skill_cl_hold_fast`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_hold_fast", "kind": "skill", "name": "Thủ Vững", "element": "SUPPORT", "tier": 0, "durationMs": 950,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_shield_form", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (hai lớp: xanh dương + ngọc)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_plus", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Hạ trọng tâm, cắm chân xuống đất** (bụi bắn), **hai vòng khiên khép quanh người theo hai chiều ngược nhau**, khóa "clunk" — đứng vững như cột. Thủ + Thủ phép + hồi 5 %, T0.

## 2. Hiện tại
`fx_shield_dome` 4 khung. Audit: `SHARED_FLIPBOOK_HERO` (dome dùng ở 11 skill).

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Cắm chân | 0–250 | hạ thấp sy 0,86, chân mở | bụi vòng ở chân | "hngh!" |
| 2 Khép | 250–650 | giữ | 2 khiên lục giác **ghép dần** quanh thân, một xanh dương xoay phải, một ngọc xoay trái | "vmm-vmm" |
| 3 Khóa | 650 | rung 1 px, mắt sáng | hai khiên **khớp** (sóng sáng chạy qua), 4 dấu cộng nhỏ bay lên | "clunk" |
| 4 Dư âm | 650–950 | đứng thẳng | khiên mờ thành viền; `st_def_up`, `st_mdef_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | 2 khiên | `fx_shield_form` ×2 (tô 2 màu, một `flip`) | `strip` hai act cùng lúc 250, size 1,3 / 1,45 | 250–900 |
| L3 | bụi; dấu cộng | `fx_dust_ring`, `fxs_plus` | `strip fx_dust_ring under` 0; `burst plus_rise` 650 | 0–950 |
| L4 | hạ / bật; rung thân | — | `move squash 0.86` 0–650 → `puff_up 1.03`; `move shake x 1` 650 | 0–800 |
L1 đạt 2/3: biến hình (ghép khung) · vận tốc (hai chiều xoay).

## 5. Asset
`fx_shield_form`, `fx_dust_ring` **mới**; dự phòng `fx_shield_dome`, `burst slam_dust`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 hạ / bật · B3 2 khiên · B4 bụi, dấu cộng · B5 không rung màn · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO` (khi có `fx_shield_form`); capture: khung ~450 hai khiên ở **hai màu** đang ghép.
