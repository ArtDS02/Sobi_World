# Kịch bản: Húc Thép (`skill_tg_steel_charge`)

```json scenario
{
  "id": "skill_tg_steel_charge", "kind": "skill", "name": "Húc Thép", "element": "METAL", "tier": 3, "durationMs": 1300,
  "status": "draft", "refs": [], "bibles": ["elements/METAL", "actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô bạc)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_spark", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Heo **cào đất hai lần**, **cuộn tròn thành bánh xe thép**, **lăn sát đất tóe lửa** tới húc bay mục tiêu (lộn một vòng); heo bật ngược, **xòe ra đứng dậy lắc đầu**. Cảm giác: hài hước + nặng, "CLANG-BOOM". T3 (power 2,2), 35 % Choáng.

## 2. Hiện tại
squash → `spin_roll` + trail + spark → `fx_pow_star` + `fx_boom` (chung), rung 9. Audit: `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`. Hình chủ đạo là thân heo lăn — đúng ý, nhưng va chạm dùng flipbook chung, thiếu tia lửa từ mặt đất liên tục và pha đứng dậy.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Cào | 0–300 | cào đất 2 lần | bụi nâu sau chân ×2 | — | — | "skrt skrt" |
| 2 Cuộn | 300–420 | **cuộn tròn** (squash 0,8 + spin bắt đầu) | lóe thép | — | — | "clack" |
| 3 Lăn | 420–700 | lăn sát đất xoay 720° | **tia lửa bắn ngược** từ mặt đất liên tục, 2 vệt gió | — | — | vù vù |
| 4 Húc | 700 | — | va chạm bạc + lóe chữ thập + bụi vòng | bay lên 50 px **lộn 1 vòng** | hit-stop medium 100, punch 1,04, rung 6 | "CLANG-BOOM" |
| 5 Đứng dậy | 700–1300 | bật ngược, **xòe ra**, lắc đầu | sao nhỏ trên đầu heo 1 nhịp | rơi bẹp; `st_stun` | — | "boing" |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | thân heo lăn (hình chủ đạo); va chạm | thân sinh vật; `fx_hit_burst` | `move squash` → `move spin_roll` 300–700 → `move recoil` + `bounce` + `wiggle` 700–1300; `strip fx_hit_burst` 700 | 300–1300 |
| L2 | vệt lăn | — | `trail every 30` | 420–700 |
| L3 | bụi cào; tia lửa đất; lóe chữ thập; bụi vòng; mảnh kim | `fxs_puff`, `fxs_spark`, `fx_metal_spark`, `fx_dust_ring` | `burst puff_pop` 0, 150; `burst spark_spray` lặp mỗi 60 ms 420–700 (hoặc `trail` hạt); `strip fx_metal_spark` 700; `strip fx_dust_ring under` 700; `burst metal_fall` 900 | 0–1100 |
| L4 | hit-stop, punch, rung; mục tiêu lộn | — | `stop medium`; `punch 1.04`; `shake 6`; `move lift y 50` + `spin` target | 700–1200 |
Hình chủ đạo là thân heo: đạt vận tốc (squash → lăn → bật) + phụ sinh (tia lửa từ đất); va chạm 6 khung.

## 5. Asset
`fx_hit_burst`, `fx_metal_spark`, `fx_dust_ring` **mới**; dự phòng `fx_boom`.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 700, end 1300 }` · B2 cào, cuộn, lăn, bật, xòe, lắc đầu; mục tiêu lộn · B3 va chạm · B4 bụi, tia lửa liên tục, bụi vòng · B5 hit-stop medium + punch (rung 9 → 6) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`; capture: khung lăn có tia lửa **phía sau** heo; khung ~1000 heo đang **xòe ra / lắc đầu**.
