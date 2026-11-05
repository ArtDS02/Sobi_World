# Kịch bản: Lửa Tượng Thần (`skill_e_idol_flame`) — quái Tượng Lửa

```json scenario
{
  "id": "skill_e_idol_flame", "kind": "skill", "name": "Lửa Tượng Thần", "element": "FIRE", "tier": 2, "durationMs": 1400,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE"],
  "assets": [
    { "id": "fxp_flame_crown", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (lửa cháy trên vương miện)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Hai mắt tượng thần lóe cam**, tượng rung; trên đầu từng con phe ta **vương miện lửa bùng cháy**, rồi **chụp xuống** "FWOOM". Cảm giác: nghi lễ cổ, trống, lửa từ trời. T2 diện rộng (power 1,0), 30 % Bỏng.

## 2. Hiện tại
`fxp_flame_crown` (ảnh tĩnh) + `fx_flame_burst`; 1500+ ms. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_OVER` (dư âm, vết cháy đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Tượng | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Mắt lóe | 0–400 | rung, **hai mắt lóe cam** | tia ở mắt | ngước | nền cam 10 % | trống cổ |
| 2 Vương miện | 400–800 | — | vương miện lửa **hiện** trên đầu từng con (stagger 110), **lửa cháy liên tục** trên vành | run | — | "fwip" ×n |
| 3 Chụp | 900 | — | vương miện **chụp xuống** đầu → **nổ lửa** | giật, tint cam | hit-stop light 60, rung 4 | "FWOOM" ×n |
| 4 Dư âm | 900–1400 | idle | khói, vết cháy (có); `st_burn` | thổi đầu | nền về | xèo |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | vương miện + lửa | `fxp_flame_crown` (0,35), `fx_flame_loop` (0,3, phủ trên) | `prop pop spot above` stagger 110 400–800 + `bobY` → `prop fall` ngắn xuống đầu 850–900; lửa loop theo vị trí vương miện | 400–950 |
| L2 | mắt tượng | — | `glow #ff9a3c` actor + `burst spark_pop spot head` | 0–400 |
| L3 | nổ lửa; khói; vết | `fx_fire_blast`, `fxs_spark` | `strip fx_fire_blast` per target 900; `burst fire_smoke` (có); `decal scorch` (có) | 900–1400 |
| L4 | hit-stop, rung | — | `stop light`; `shake 4` (từ 6) | 900–1100 |
L1 đạt 3/3: biến hình (lửa loop) · phụ sinh (nổ) · vận tốc (pop, chụp xuống).

## 5. Asset
`fx_flame_loop`, `fx_fire_blast` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 400, impact 900, end 1400 }` (rút) · B2 tượng rung; phe ta run, giật · B3 vương miện + lửa → chụp · B4 nổ · B5 hit-stop light, rung 4 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_OVER`, `STATIC_HERO`; capture: vương miện có **lửa đổi hình** giữa 2 khung pha 2.
