# Kịch bản: Màn Hư Vô (`skill_hk_void_veil`)

```json scenario
{
  "id": "skill_hk_void_veil", "kind": "skill", "name": "Màn Hư Vô", "element": "SUPPORT", "tier": 0, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["elements/VOID", "actions/status"],
  "assets": [
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 1,6 giữa sân)" },
    { "id": "fx_void_portal", "state": "have", "layer": "L1" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sứa **xòe xúc tu**, **cổng hư không mở giữa sân**, gió hút vào tâm; **mọi biểu tượng trạng thái** của cả hai phe **bong ra, xoáy bay vào cổng**, mỗi cái "pop"; cổng **đóng "blip"**, rồi **im lặng** một nhịp. Cảm giác: tẩy trắng, công bằng, kỳ lạ. Xóa mọi trạng thái cả hai phe, T0.

## 2. Hiện tại
`fx_void_portal` 4 khung giữa sân + streak + sao + split. Audit: không cờ. Biểu tượng trạng thái không "bay vào cổng", không có nhịp đóng.

## 3. Kịch bản theo nhịp
| # | ms | Sứa / mọi đơn vị | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Xòe | 0–320 | pose `cast`, xòe xúc tu | — | — | ngân thấp |
| 2 Mở | 320–700 | mọi đơn vị nghiêng nhẹ về tâm | cổng **mở** giữa sân (portal khung 0 → 3, to 1,6), **gió hút** cuộn vào | tối nhẹ | hút gió |
| 3 Hút | 700–1150 | mỗi đơn vị giật nhẹ khi mất biểu tượng | biểu tượng bong ra **bay xoáy** vào cổng (stagger 60), mỗi cái lóe "pop" ở tâm | viền tách màu 1 nhịp ở 900 | "pop" ×n |
| 4 Đóng | 1150–1250 | — | cổng **sụp vào** (implode K3–K4) | — | "blip" |
| 5 Lặng | 1250–1450 | đứng thẳng | không gì cả | — | im 150 ms |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cổng mở / đóng | `fx_void_portal` (mở), `fx_void_implode` (đóng) | `strip fx_void_portal hold 450 size 1.6 spot center` 320–1150; `strip fx_void_implode frames [2,3]` 1150 | 320–1250 |
| L2 | — | — | — | — |
| L3 | gió hút; sao "pop" ở tâm | `fxs_streak`, `fxs_star` | `burst streak_spray` hút vào tâm (allies + foes) 400; `burst star_pop` ở tâm lệch 60 ×n (biểu tượng bay vào: engine `statusBadges` cần hook "bay về điểm" — nếu chưa có, dùng sao từ mỗi đơn vị bay vào) | 400–1150 |
| L4 | nghiêng về tâm; tách màu | — | `move tilt` mọi đơn vị về tâm; `split 80` 900 | 320–1100 |
L1 đạt 2/3: biến hình (mở / sụp khung) · phụ sinh (gió, sao).

## 5. Asset
`fx_void_implode` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp `{ release 320, impact 700, end 1450 }` (rút 100) · B2 xòe; mọi đơn vị nghiêng · B3 cổng mở → đóng · B4 gió, sao bay vào tâm · B5 không rung · B6 âm có khoảng im · B7 capture (đơn vị có trạng thái trước khi dùng).

## 7. Nghiệm thu
Capture: khung ~900 thấy sao / biểu tượng **đang bay về tâm**; khung ~1300 cổng đã đóng và sân yên tĩnh.
