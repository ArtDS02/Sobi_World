# Kịch bản: Lưới Dệt Đêm (`skill_ult_dm`) — tuyệt kỹ

```json scenario
{
  "id": "skill_ult_dm", "kind": "skill", "name": "Lưới Dệt Đêm", "element": "DARK", "tier": 4, "durationMs": 3100,
  "status": "draft", "refs": [], "bibles": ["actions/ultimate", "elements/DARK"],
  "assets": [
    { "id": "fxp_octo_tentacle", "state": "have", "layer": "L1" },
    { "id": "fxp_night_net", "state": "have", "layer": "L1" },
    { "id": "fx_ink_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_smoke_curl", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_star", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace", "bg_scene"]
}
```

## 1. Ý tưởng
**Bốn xúc tu khổng lồ** vươn lên sau phe địch, **đan chéo dệt** tấm lưới đêm phủ cả phe địch, **nút sao khóa** từng con, rồi **SIẾT** — mực bùng ở mỗi con. Cảm giác: bị trói gọn bởi một thứ to lớn, nhịp chậm–chậm–SIẾT. Tuyệt kỹ T4, Choáng + Chậm.

## 2. Hiện tại
2 `fxp_octo_tentacle rise` (ảnh tĩnh đứng 2 s) + lưới rơi + `fx_ink_splat`, khung tuyệt kỹ đủ. Audit: `STATIC_HERO`, `STATIC_SHARE`. Xúc tu không uốn, không "dệt".

## 3. Kịch bản theo nhịp
| # | ms | Bạch tuộc | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Intro | 0–500 | `cast_hover` | cut-in tím đêm | — | letterbox; nền **đêm sao, trăng lưỡi liềm** | nhạc ru trầm |
| 2 Vươn | 500–1250 | múa xúc tu theo nhịp | 4 xúc tu **vươn lên lệch nhịp 120** từ mép dưới sau phe địch, **uốn lượn** (displacement + wobble), khói mực bò quanh gốc | ngước | — | trườn nặng |
| 3 Dệt | 1250–2000 | — | xúc tu **đan chéo** (2 cặp xoay vào nhau), kéo lưới bung ra phủ phe địch; nút sao khóa từng quái stagger 150 | bị ép dần | — | "ting" ×n |
| 4 Lặng | 2000–2050 | — | mọi thứ khựng, lưới căng | — | gần đứng | im |
| 5 SIẾT | 2050–2450 | — | lưới **co mạnh**, mực **bung** ở mỗi con | kéo thấp, bật lùi | hit-stop ultimate, punch 1,05, rung 8, tách màu | "SNAP" + bùm mực |
| 6 Outro | 2450–3100 | idle | xúc tu **rút xuống**, lưới tan thành sao bay lên; `st_stun` + `st_spd_down` | — | nền về, letterbox rút | ngân tắt |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền đêm, vignette, letterbox | — | `bg_scene` (dự phòng `tint #100818 0.4`) | 0–3100 |
| L1 | 4 xúc tu; lưới | `fxp_octo_tentacle` ×4 (2 lật), `fxp_night_net` | `prop rise` stagger 120 + `wobble rot 8 freq 1.2` + `prop_displace` (uốn) 500–2450, xoay vào nhau 1250–1500, `rise` ngược rút 2450–2900; lưới `grow` 1300 → co 2050 | 500–2900 |
| L2 | lõi người dùng; nút sao | — | `glow $color` actor; `glow #d9b8ff` per target stagger 150 | 0–2050 |
| L3 | khói mực quanh gốc; mực bung; sao tan | `fx_smoke_curl`, `fx_ink_bloom`, `fxs_star` | khói loop `under` 500–2450; `strip fx_ink_bloom` per target 2050; `burst star_rise` 2450 | 500–3100 |
| L4 | lặng → siết | — | `stop ultimate` 2050; `punch 1.05`; `shake 8`; `split`; `move squash` + `knock` targets | 2000–2600 |
L1 đạt 3/3: biến hình (xúc tu uốn displacement, lưới bung / co) · phụ sinh (khói ở gốc) · vận tốc (rút nhanh, siết).

## 5. Asset
`fx_ink_bloom`, `fx_smoke_curl` **mới**; còn lại có. Dự phòng: `fx_ink_splat`, `fx_poof`; chưa có displacement → `wobble` lớn.

## 6. Các bước dựng
B1 nhịp `{ release 450, impact 1250, end 3100 }` (siết ở 2050 là nhịp mạnh nhất) · B2 múa xúc tu, quái ép dần · B3 4 xúc tu → dệt → lưới → siết → rút · B4 khói, mực, sao · B5 lặng 50 ms rồi siết · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~900 thấy **4** xúc tu ở 4 độ cao khác nhau; khung ~1600 xúc tu nghiêng vào nhau; khung `2050+80` mực bung ở mọi quái.
