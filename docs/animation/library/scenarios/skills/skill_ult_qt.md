# Kịch bản: Lồng Đèn Trung Thu (`skill_ult_qt`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_qt", "kind": "skill", "name": "Lồng Đèn Trung Thu", "element": "SUPPORT", "tier": 4, "durationMs": 3200,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "actions/buff-and-heal", "elements/LIGHT"],
  "assets": [
    { "id": "fxp_moon_lantern", "state": "have", "layer": "L1" },
    { "id": "fxp_mini_lantern", "state": "have", "layer": "L1" },
    { "id": "fx_heal_bloom", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô vàng ấm)" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
Trong đêm trăng rằm, **lồng đèn trăng khổng lồ** bay lên giữa sân, xoay chậm, tỏa sao; nó **thả đèn nhỏ** xuống từng bạn — đèn chạm **bung ánh ấm** hồi máu — rồi đèn hóa **nút sáng Bất khuất** quanh ngực, một **vòng sáng lớn** lan khắp phe ta. Cảm giác: lễ hội, ấm cúng, được che chở. Tuyệt kỹ hỗ trợ (Tự hồi sinh + hồi 25 %).

## 2. Hiện tại
`fxp_moon_lantern hover` 2,6 s (một ảnh), đèn nhỏ `fall`/`orbit`, sao, cộng máu. Audit: `STATIC_HERO`, `STATIC_SHARE`. Lồng đèn không xoay, không có ánh lửa bên trong.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Đồng đội | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_bow` | cut-in vàng kem | — | letterbox; nền **đêm trăng rằm** | trống trung thu |
| 2 Bay lên | 500–1300 | nâng đèn | lồng đèn **bay lên** giữa sân, **xoay chậm**, ánh lửa bên trong **lập lòe** (displacement + glow nhịp), tỏa 12 sao | ngước | — | sáo leng keng |
| 3 Thả đèn | 1300–2200 | — | đèn nhỏ **rơi chao** xuống từng bạn (stagger 150); chạm → **ánh ấm bung** | hồi máu, nhún | hit-stop ultimate ở đèn cuối 1750 | "fwoom" ấm ×n |
| 4 Nút sáng | 2200–2700 | — | đèn hóa **nút sáng** xoay quanh ngực mỗi bạn; **vòng sáng lớn** lan khắp phe ta | sáng lên | chớp ấm 0,2 | ngân |
| 5 Outro | 2700–3200 | idle | lồng đèn **bay lên khuất**, mưa sao nhỏ | — | nền về, letterbox rút | trống kết |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền đêm trăng; letterbox | — | `bg_scene` (dự phòng `tint #1a1430 0.35`) | 0–3200 |
| L1 | lồng đèn lớn; đèn nhỏ; vòng hồi | `fxp_moon_lantern`, `fxp_mini_lantern`, `fx_heal_bloom` | `prop rise` + `spin 0.15` + `prop_displace` (lửa bên trong) 500–2700, `rise` tiếp lên khuất 2700–3100; đèn nhỏ `fall` + `wobble` stagger 150 → `orbit` quanh ngực 2200–2700; `strip fx_heal_bloom` per ally | 500–3100 |
| L2 | ánh lửa lập lòe; nút sáng | — | `glow #ffd36a` nhịp 0,6 s trên lồng đèn; `glow` per ally 2200 | 500–2700 |
| L3 | sao tỏa; sao nở khi đèn chạm; mưa sao; vòng sáng lớn | `fxs_star`, `fx_star_bloom` | `burst star_pop` 600–1300; `strip fx_star_bloom` per ally; `decal ring` allyside 2200; `burst star_fall` 2700 | 600–3200 |
| L4 | hit-stop đèn cuối; đồng đội nhún | — | `stop ultimate` 1750; `punch 1.04`; `move hop` per ally | 1300–2300 |
L1 đạt 3/3: biến hình (lửa lập lòe displacement, vòng hồi nở) · phụ sinh (đèn nhỏ rơi ra, sao) · vận tốc (đèn chao, lồng xoay).

## 5. Asset
`fx_heal_bloom`, `fx_star_bloom` **mới**; còn lại có.

## 6. Các bước dựng
B1 nhịp (giữ `{ 520, 1300, 3200 }`) · B2 nâng đèn, đội nhún · B3 lồng đèn → đèn nhỏ → nút sáng → bay khuất · B4 sao, vòng sáng · B5 hit-stop ultimate · B6 âm · B7 capture (ultimates).

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: hai khung pha 2 lồng đèn **góc xoay khác nhau** và độ sáng khác nhau; khung ~2400 nút sáng quanh từng bạn; khung cuối lồng đèn đã ra khỏi màn.
