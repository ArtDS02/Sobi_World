# Kịch bản: Lưới Đêm (`skill_dm_night_net`)

```json scenario
{
  "id": "skill_dm_night_net", "kind": "skill", "name": "Lưới Đêm", "element": "DARK", "tier": 1, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["elements/DARK"],
  "assets": [
    { "id": "fxp_night_net", "state": "have", "layer": "L1" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
**Lưới đêm đính sao bung trên trời, rơi chậm như dù**, chụp gọn cả phe địch, **nút sao lóe lần lượt**, rồi **siết lại** và tan thành sao. Cảm giác: êm mà chắc, "ting-ting". T1 diện rộng (power 0,8), Chậm 70 % + Choáng 20 %.

## 2. Hiện tại
`fxp_night_net fall` (một ảnh rơi), squash, sao. Audit: `STATIC_HERO`, `STATIC_SHARE`. Lưới cứng như tấm ván rơi; không bung, không siết.

## 3. Kịch bản theo nhịp
| # | ms | Bạch tuộc | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tung | 0–360 | pose `cast`, tung 4 xúc tu lên | 10 sao nhỏ hiện trên cao | — | nền đêm 25 % | "whoosh" |
| 2 Bung | 360–500 | — | lưới **bung từ nhỏ ra rộng** (grow + outBack) trên phe địch | ngước lên | — | "fwap" |
| 3 Rơi | 500–860 | — | lưới **rơi chậm như dù**, mép **gợn sóng** (displacement), lắc nhẹ | — | — | gió |
| 4 Chụp | 860–1100 | — | lưới chụp, **nút sao lóe lần lượt** trên từng quái (stagger 80) | ép thấp sy 0,85 | hit-stop light 60, rung 3 | "thwump" + "ting-ting" |
| 5 Siết + tan | 1100–1500 | idle | lưới **co lại** (scale 1 → 0,85) rồi tan thành sao bay lên; `st_spd_down` / `st_stun` | giữ ép rồi bật | nền về | ngân |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền đêm, vignette | — | `tint #100818 0.25` | 0–1500 |
| L1 | lưới | `fxp_night_net` | `prop grow` 360–500 (outBack) → `prop fall` ease outQuad (chậm cuối) + `wobble rot 4 freq 1.5` + `prop_displace` (mép gợn) 500–860 → co + alpha 1100–1400 | 360–1400 |
| L2 | nút sao lóe | — | `burst star_pop` per target stagger 80 + `glow #d9b8ff` per target | 860–1100 |
| L3 | sao trên cao; sao tan bay lên | `fxs_star` | `burst star_pop` field 0; `burst star_rise` foeside 1200 | 0–1500 |
| L4 | ép quái; hit-stop | — | `move squash 0.85` targets; `stop light`; `shake 3` | 860–1300 |
L1 đạt 3/3 khi có displacement (gợn mép) · phụ sinh (sao từ nút lưới) · vận tốc (bung outBack, rơi chậm dần, co khi siết). Chưa có displacement: 2/3.

## 5. Asset
Đủ asset (`fxp_night_net`, `fxs_star`); cần `prop_displace` cho mép gợn.

## 6. Các bước dựng
B1 nhịp `{ release 360, impact 860, end 1500 }` · B2 tung xúc tu; quái ép · B3 lưới bung → rơi → siết · B4 sao · B5 hit-stop light, rung 3 (hạ từ 4) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO` (khi có displacement); capture: khung ~430 lưới **nhỏ hơn** khung ~700 (bung); nút sao sáng ở 3 khung khác nhau; khung ~1300 lưới nhỏ lại.
