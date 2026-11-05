# Kịch bản: Tia Sáng (`skill_qt_ray`)

```json scenario
{
  "id": "skill_qt_ray", "kind": "skill", "name": "Tia Sáng", "element": "LIGHT", "tier": 2, "durationMs": 950,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHT"],
  "assets": [
    { "id": "fx_star_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_star", "state": "have", "layer": "L3" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Đèn trên tay **sáng dần, hút sao vào**, rồi lóe **một tia mảnh chính xác** (mở từ sợi chỉ thành tia), kết bằng **ngôi sao bốn cánh nở** trên mục tiêu. Cảm giác: thanh, sạch, "pew~ ting!". T2 (power 1,3). Không rung mạnh — tác động bằng độ sáng.

## 2. Hiện tại
`beam` + `fx_pow_star` + `spark_big`, hit-stop 50, rung 2. Audit: không cờ, nhưng bậc có T1 < T2; va chạm là sao chung 17 skill.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tụ | 0–260 | pose `cast`, giơ đèn | đèn **sáng dần**, 6 sao nhỏ **hút vào** đèn | — | — | ngân lên |
| 2 Bắn | 260–440 | giật lùi nhẹ | tia vàng trắng **mở 4 → 14 px** tức thì, giữ, độ dày dao động | — | — | "pew~" |
| 3 Nở | 440 | — | sao 4 cánh **nở** trên mục tiêu | đẩy lùi 10, tint trắng 1 nhịp | hit-stop medium 70, punch 1,02, chớp vàng 0,15 | "ting!" |
| 4 Dư âm | 440–950 | idle | tia **co thành sợi** rồi tắt; lấp lánh rơi chậm | — | — | lấp lánh |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | tia; sao nở | — (beam code), `fx_star_bloom` | `beam width 4` 260–300 → `beam width 14` 300–600 → `width 3` 600–700; `strip fx_star_bloom` 440 | 260–800 |
| L2 | lõi đèn sáng dần | — | `glow #fff2a8 bright 1.4` 0–260 | 0–300 |
| L3 | sao hút vào; tia lóe; lấp lánh rơi | `fxs_star`, `fxs_spark` | `burst star_pop` hút về actor 0; `burst spark_pop` 440; `burst star_fall` 600 | 0–950 |
| L4 | hit-stop, punch, chớp | — | `stop medium`; `punch 1.02`; `flash #ffe98a 0.15`; rung ≤ 2 | 440–600 |
L1 đạt 2/3: biến hình (tia mở / co, sao nở 6 khung) · phụ sinh (lấp lánh).

## 5. Asset
`fx_star_bloom` **mới** (dự phòng `fx_pow_star` tô vàng).

## 6. Các bước dựng
B1 nhịp (giữ) · B2 giơ đèn, giật lùi; mục tiêu đẩy lùi · B3 tia 3 nấc độ dày → sao nở · B4 sao hút / rơi · B5 hit-stop medium + punch (lên T2) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit bậc có T2; capture: khung 280 tia **mảnh**, khung 400 tia **dày**; khung `impact+80` sao 4 cánh (không phải sao chung).
