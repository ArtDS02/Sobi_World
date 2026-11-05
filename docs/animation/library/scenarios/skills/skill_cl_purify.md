# Kịch bản: Thanh Tẩy (`skill_cl_purify`) — lớp Hỗ Trợ

```json scenario
{
  "id": "skill_cl_purify", "kind": "skill", "name": "Thanh Tẩy", "element": "SUPPORT", "tier": 0, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/LIGHT"],
  "assets": [
    { "id": "fx_light_pillar", "state": "have", "layer": "L1" },
    { "id": "fx_ink_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (phát ngược K4–K6: mực co lại rồi tan)" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Giơ cao, ánh vàng**; **cột sáng Lumina rọi lên** từng bạn lần lượt; mọi **trạng thái xấu bong ra như mực**, **co lại tan khói**, gió cuốn đi; lấp lánh. Cảm giác: trong lành, thanh khiết. Xóa mọi trạng thái xấu (cả Diệt vong), T0.

## 2. Hiện tại
`fx_light_pillar` + hạt. Audit: `DURATION_OVER` (1500).

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Giơ | 0–320 | pose `cast`, giơ cao | ánh vàng trên tay | chuông |
| 2 Rọi | 320–800 | mỗi bạn ngẩng lên khi cột tới (stagger 120) | **cột sáng** rọi từ trên xuống từng bạn | ngân sáng |
| 3 Bong | 800–1100 | — | mực (trạng thái xấu) **bong ra, co lại** thành khói, **gió cuốn sang phải**; đồng hồ diệt vong (nếu có) vỡ | "whoosh" |
| 4 Lấp lánh | 1100–1350 | idle | 8 sao lấp lánh rơi chậm | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cột sáng | `fx_light_pillar` | `strip hold 250` per ally stagger 120 | 320–1000 |
| L2 | ánh tay | — | `glow #fff2a8` 0–320 | 0–320 |
| L3 | mực bong; gió; lấp lánh | `fx_ink_bloom` (K4–K6), `fxs_star` | `strip fx_ink_bloom frames [3,5] size 0.6` per ally 800; `burst streak_spray` sang phải 850; `burst star_fall` 1100 | 800–1350 |
| L4 | bạn ngẩng | — | `move tilt deg -6` stagger 120 (không rung) | 320–900 |
L1 đạt 2/3: biến hình (cột khung, mực co) · phụ sinh (mực / gió từ thân).

## 5. Asset
`fx_ink_bloom` **mới**; dự phòng `burst ink_pop` + `puff_rise`.

## 6. Các bước dựng
B1 nhịp `{ release 320, impact 800, end 1350 }` (rút 100) · B2 giơ; bạn ngẩng · B3 cột · B4 mực, gió, sao · B5 không rung · B6 âm · B7 capture (đội có trạng thái xấu).

## 7. Nghiệm thu
Audit hết `DURATION_OVER`; capture: khung ~950 mực **đang co** trên thân bạn.
