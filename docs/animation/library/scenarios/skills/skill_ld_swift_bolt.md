# Kịch bản: Tốc Lôi (`skill_ld_swift_bolt`)

```json scenario
{
  "id": "skill_ld_swift_bolt", "kind": "skill", "name": "Tốc Lôi", "element": "SUPPORT", "tier": 0, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal", "elements/LIGHTNING"],
  "assets": [
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **giậm móng** tóe lửa; một **dải sét zig-zag vàng chạy sát đất** từ trái sang phải dưới chân cả đội, ai chạm cũng **chạy tại chỗ thật nhanh** ba bước như được sạc điện. Cảm giác: hăng hái, "zip-zip-zip". Tốc độ tăng, T0.

## 2. Hiện tại
Decal dưới chân + `walk_sideways` + streak. Audit: `FEW_LAYERS`, không có hình chủ đạo (không act vẽ hình nào). Không có dải sét chạy.

## 3. Kịch bản theo nhịp
| # | ms | Heo / đội | Hiệu ứng chính | Màn hình | Âm thanh |
|---|---|---|---|---|---|
| 1 Giậm | 0–260 | pose `cast`, giậm móng 2 cái | tia lửa ở móng | — | "tak tak" |
| 2 Chạy dải | 260–700 | — | **dải sét zig-zag** sát đất chạy từ heo sang phải, qua chân từng bạn (stagger 100), mỗi lần qua chân lóe 1 nhịp | — | "zzzip" |
| 3 Sạc | 700–900 | mỗi bạn **chạy tại chỗ** 3 bước (dx ±4) + vệt gió vàng sau lưng | — | — | "zip-zip-zip" |
| 4 Dư âm | 900–1100 | đứng nghiêng tới trước | tia lửa nhỏ còn nhảy ở chân; `st_spd_up` | — | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | dải sét sát đất | — (code) | `tether wave 18` từ actor tới từng ally, `under`, stagger 100 (zig-zag vẽ bằng code, mỗi lần khác) | 260–750 |
| L2 | lóe ở chân; vệt gió | — | `glow #ffe14a` per ally khi dải qua; `trail` per ally 700–900 | 260–900 |
| L3 | tia lửa móng; vệt streak; hồ quang ở chân | `fxs_bolt_mini`, `fxs_streak`, `fx_spark_arc` | `burst bolt_pop` 100, 200; `burst streak_spray` per ally 700; `strip fx_spark_arc size 0.5 spot feet` 900 | 100–1100 |
| L4 | chạy tại chỗ; nghiêng tới | — | `move walk_sideways x 4 n 3` stagger 100; `move tilt deg 6` (không rung) | 700–1100 |
L1 (dải sét code) đạt 2/3: biến hình (zig-zag mới mỗi lần) · vận tốc (chạy có hướng).

## 5. Asset
`fx_spark_arc` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ `{ 260, 700, 1100 }`) · B2 giậm; chạy tại chỗ; nghiêng · B3 dải sét · B4 tia lửa, streak, hồ quang · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `FEW_LAYERS`; capture: khung ~450 dải sét **mới tới giữa đội**; mỗi bạn có khung chạy tại chỗ riêng.
