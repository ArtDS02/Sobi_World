# Kịch bản: Lướt Gió (`skill_cl_dash`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_dash", "kind": "skill", "name": "Lướt Gió", "element": "SUPPORT", "tier": 0, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["actions/buff-and-heal"],
  "assets": [
    { "id": "fx_wind_swirl", "state": "have", "layer": "L1" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Cúi người đạp đất**, **vụt chạy một vòng** quanh sân nhanh như gió (bóng mờ dày, xoáy gió theo sau), **phanh két** lại chỗ cũ, tai / đuôi **bay phần phật**. Cảm giác: nhanh, vui. Né + Tốc, T0.

## 2. Hiện tại
`fx_wind_swirl` tại chỗ. Audit: không cờ, nhưng heo không chạy vòng.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Âm thanh |
|---|---|---|---|---|
| 1 Đạp | 0–200 | cúi thấp, chân cào | bụi nhỏ | "tak" |
| 2 Chạy vòng | 200–700 | **chạy** trái → phải (phía sau đội) → về, kéo giãn, bóng mờ dày | xoáy gió theo sau, vệt gió | "zoooom" |
| 3 Phanh | 700 | **phanh**: trượt quá, nghiêng ngược | bụi vòng ở chân | "skrrt!" |
| 4 Dư âm | 700–1050 | tai / đuôi lắc (wiggle), đứng thẳng | vệt gió tan; `st_spd_up`, `st_eva_up` | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | thân chạy + xoáy gió | thân; `fx_wind_swirl` | `move dash` vòng (cần đường vòng: 2–3 `move` nối: dash phải x 120 → dash trái x −160 → về) + `trail every 30`; `strip fx_wind_swirl` theo vị trí 2 mốc | 200–720 |
| L3 | bụi; vệt gió; bụi phanh | `fxs_streak`, `fx_dust_ring` | `burst streak_spray` 300, 500; `strip fx_dust_ring under` 700 | 0–900 |
| L4 | phanh trượt; lắc | — | `move tilt deg -12` 700; `move wiggle` 750 (không rung) | 700–1050 |
Thân là hình chủ đạo: vận tốc (kéo giãn, trượt quá) + phụ sinh (gió, bụi).

## 5. Asset
`fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 chạy vòng (kiểm giới hạn sân, không ra khỏi màn), phanh, lắc · B3 xoáy gió · B4 bụi, vệt · B5 không rung · B6 âm · B7 capture.

## 7. Nghiệm thu
Capture: khung ~450 heo **không ở chỗ cũ**; khung ~720 nghiêng ngược.
