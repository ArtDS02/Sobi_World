# Kịch bản: Mưa Thiên Thạch (`skill_e_meteor`) — trùm Rồng Dung Nham (dưới 50 % máu)

```json scenario
{
  "id": "skill_e_meteor", "kind": "skill", "name": "Mưa Thiên Thạch", "element": "FIRE", "tier": 3, "durationMs": 1900,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE", "elements/EARTH"],
  "assets": [
    { "id": "fxp_meteor", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (đuôi lửa)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 1,6)" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đỏ cam)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Trùm rồng **gầm (đổi pha)**, **bay vụt khỏi màn**, nền đỏ tối; **hai bóng** hiện dưới phe ta; **hai thiên thạch lửa rơi lệch nhịp** — cú hai mạnh hơn; rồng **hạ cánh** trở lại, than rơi. Cảm giác: thảm họa từ trên trời, nhịp 1-**2**. T3 diện rộng (power 1,6). Rung / hit-stop đưa về rubric.

## 2. Hiện tại
`fxp_meteor` ×2 (ảnh), `fx_boom` + nứt, rung 10/14, 2200 ms. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER`.

## 3. Kịch bản theo nhịp
| # | ms | Rồng | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Đổi pha | 0–500 | gầm, **bay vụt lên** khỏi màn | lửa bùng quanh thân khi bay | ngước | nền đỏ tối 35 % | gầm |
| 2 Bóng | 500–800 | (ngoài màn) | **2 bóng** dưới phe ta to dần (lệch 250) | run | — | rít xa |
| 3 Thạch 1 | 800–1000 | — | thiên thạch 1 lao chéo, **đuôi lửa**, xoay → nổ lửa + nứt | hất (con gần) | hit-stop light 60, rung 5 | "BOOM" |
| 4 Thạch 2 | 1050–1250 | — | thiên thạch 2 **to hơn** → nổ lớn + nứt | hất tất cả | hit-stop medium 100, punch 1,05, chớp 0,3, rung 7 | "BOOM!!" |
| 5 Hạ cánh | 1300–1900 | **hạ cánh** về chỗ, đập cánh | than rơi, khói | ngồi dậy | nền về | than lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền đỏ tối | — | `tint #3a0a00 0.35` | 0–1600 |
| L1 | 2 thiên thạch; nổ | `fxp_meteor` ×2 (0,5 / 0,7), `fx_fire_blast` | `prop fall` chéo ease inQuad + `spin 0.2` + `stretch` + `shadow`; 2 act lệch 250; `strip fx_fire_blast` 1000, 1250 (cái 2 size 1,6) | 600–1450 |
| L2 | đuôi lửa | `fx_flame_loop` | `trail ember_trail every 30` dày (+ flipbook khi có `prop_flipbook`) | 600–1250 |
| L3 | nứt; than; khói | `fx_crack_spread` (đỏ cam), `fxs_ember` | `strip under` 1000, 1250; `burst ember_fall` 1400; `burst fire_smoke` 1300 | 1000–1900 |
| L4 | hit-stop 2 nhịp, punch, chớp | — | `stop light/medium`; `shake 5/7` (từ 10/14); `punch 1.05`; `flash 0.3` chỉ cú 2 | 1000–1500 |
L1 đạt 3/3: biến hình (đuôi lửa, nổ khung) · phụ sinh (than) · vận tốc (gia tốc, xoay).

## 5. Asset
`fx_flame_loop`, `fx_fire_blast`, `fx_crack_spread` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 800, impact 1000, end 1900 }` (rút 300) · B2 rồng bay lên / hạ cánh; phe ta run, hất · B3 2 thiên thạch · B4 nứt, than, khói · B5 hit-stop / rung theo rubric · B6 âm · B7 capture (case trùm đổi pha).

## 7. Nghiệm thu
Audit hết `DURATION_OVER`, `STATIC_HERO`; capture: hai khung impact cách ~250 ms; cú 2 nổ **to hơn**.
