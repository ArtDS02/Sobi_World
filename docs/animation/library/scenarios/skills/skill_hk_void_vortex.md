# Kịch bản: Xoáy Hư Không (`skill_hk_void_vortex`)

```json scenario
{
  "id": "skill_hk_void_vortex", "kind": "skill", "name": "Xoáy Hư Không", "element": "VOID", "tier": 1, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["elements/VOID"],
  "assets": [
    { "id": "fx_void_portal", "state": "have", "layer": "L1" },
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 1,4 giữa phe địch)" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" },
    { "id": "fxs_ice_shard", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sứa **xoay tròn chậm rồi nhanh**; **xoáy mở giữa phe địch**, **hút** cả hàng quái nghiêng về tâm, vệt gió cuộn vào; **lặng** — rồi **bung ngược** hất văng ra ngoài. Cảm giác: hút → nổ, chữ ký "khoảng lặng" của Hư Không. T1 diện rộng (power 0,85).

## 2. Hiện tại
`fx_void_portal` + tilt + streak + `fx_boom` chung + knock + split; rung đã hạ 7 → 3. Audit: dư âm đã thêm. Không có khoảng lặng; bung dùng `fx_boom` chung.

## 3. Kịch bản theo nhịp
| # | ms | Sứa | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Xoay | 0–350 | pose `cast`, xoay chậm → nhanh | — | — | — | ù tăng |
| 2 Hút | 350–800 | giữ xoay | xoáy **mở** giữa phe địch, vệt gió **cuộn vào** tâm, gia tốc tăng | **nghiêng + trượt về tâm** 20 px | tối nhẹ quanh xoáy | "vwooooo" |
| 3 Lặng | 800–850 | dừng xoay | xoáy **sụp** thành điểm sáng | khựng | im | — |
| 4 Bung | 850 | — | **bung ngược** vòng sóng ra ngoài | **hất văng** ra ngoài, stagger 60 | hit-stop light 60, tách màu, rung 3 | "VWAM" |
| 5 Dư âm | 850–1400 | idle | mảnh pha lê tím rơi, vòng rỗng nhấp nháy tắt | ngồi dậy | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | xoáy; sụp / bung | `fx_void_portal`, `fx_void_implode` | `strip fx_void_portal hold 300` foeside 350–800; `strip fx_void_implode frames [2,5]` 800–1000 | 350–1000 |
| L2 | tối quanh xoáy | — | `tint focus #2e2470 0.25` | 350–900 |
| L3 | gió cuộn; mảnh tím; vòng tắt | `fxs_streak`, `fxs_ice_shard` (tô tím) | `burst streak_spray` hút vào 400, 550; `burst void_sparks` 900; `decal ring` 850–1300 | 400–1400 |
| L4 | hút / hất; hit-stop | — | `move tilt` + trượt về tâm 350–800; `move knock` ra ngoài stagger 60; `stop light`; `split`; `shake 3` | 350–1200 |
L1 đạt 3/3: biến hình (xoáy, sụp, bung khung) · phụ sinh (gió, mảnh) · vận tốc (hút gia tốc → lặng → bung).

## 5. Asset
`fx_void_implode` **mới**; dự phòng `fx_boom` tô tím.

## 6. Các bước dựng
B1 nhịp `{ release 350, impact 850, end 1400 }` · B2 xoay; quái hút / hất · B3 xoáy → lặng → bung · B4 gió, mảnh, vòng · B5 hit-stop light (T1) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit không `IMPACT_OVER_TIER`; capture: khung ~700 quái **nghiêng về tâm**; khung ~820 gần như đứng; khung ~950 quái lệch **ra ngoài**.
