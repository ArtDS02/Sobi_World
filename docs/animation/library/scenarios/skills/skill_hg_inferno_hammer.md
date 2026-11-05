# Kịch bản: Búa Hỏa Ngục (`skill_hg_inferno_hammer`)

```json scenario
{
  "id": "skill_hg_inferno_hammer", "kind": "skill", "name": "Búa Hỏa Ngục", "element": "FIRE", "tier": 3, "durationMs": 1450,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE"],
  "assets": [
    { "id": "fxp_fire_hammer", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (phủ quanh đầu búa)" },
    { "id": "fx_fire_blast", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô cam khói)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Cua **giơ hai càng lên trời**, **bóng búa to dần** dưới mục tiêu; **búa lửa khổng lồ rơi xoay 90°**, kéo đuôi lửa — **NỆN**: mục tiêu **dẹp lép như bánh** rồi **bật như lò xo**; búa nảy lên, cột khói mềm, than rơi. Cảm giác: nặng tuyệt đối, hài hước. T3 (power 2,3).

## 2. Hiện tại
`fxp_fire_hammer fall` (một ảnh), `fx_boom` + 2 `fx_flame_burst`, hit-stop 130, rung 12. Audit: `STATIC_HERO`, `STATIC_SHARE`. Búa không cháy, không có bóng báo, rung quá tay (12) và hit-stop quá khoảng rubric.

## 3. Kịch bản theo nhịp
| # | ms | Cua | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Gọi | 0–500 | pose `cast`, giơ 2 càng | **bóng búa** dưới mục tiêu **to dần** | ngước, run | — | gió rít tăng |
| 2 Rơi | 500–800 | giữ | búa lửa rơi **gia tốc**, xoay 0 → 90°, **lửa cháy liên tục** quanh đầu búa, đuôi tàn | co rúm | — | rít |
| 3 NỆN | 800 | — | nổ lửa lớn + 2 nổ hai bên + bụi vòng | **dẹp sy 0,5** 150 ms | hit-stop medium 100, punch 1,05, chớp cam 0,3, rung 7 dọc | "BWAMM!" |
| 4 Bật | 950–1150 | — | búa **nảy** lên 40 px rồi mờ | **bật lò xo** (sy 1,2 → 1,0), lắc lư | — | "boing" |
| 5 Dư âm | 1150–1450 | idle | cột khói mềm, than rơi lách tách, vết cháy | — | — | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | búa + lửa quanh búa; nổ | `fxp_fire_hammer`, `fx_flame_loop` (gắn theo búa: strip lặp tại vị trí búa ở từng mốc hoặc trail), `fx_fire_blast` | `prop fall` ease `inBack` + `spin 0.25` + `shadow` + `squashOnHit` 500–800 → nảy (`throw` ngắn lên) 950–1150; `strip fx_fire_blast size 1.3` 800 + 2 nhỏ hai bên 840 | 500–1150 |
| L2 | đuôi tàn sau búa | — | `prop … trail ember_trail every 40` | 500–800 |
| L3 | bụi vòng; khói; than; vết cháy | `fx_dust_ring`, `fxs_puff`, `fxs_ember` | `strip fx_dust_ring under` 800; `burst puff_rise` 950; `burst ember_fall` 1000; `decal scorch` 800–1450 | 800–1450 |
| L4 | hit-stop, punch, chớp, rung; dẹp / bật | — | `stop medium 100`; `punch 1.05`; `flash #ff9a3c 0.3`; `shake 7 dir [0,1]`; `move squash 0.5` → `bounce` | 800–1200 |
L1 đạt 3/3: biến hình (lửa cháy quanh búa, nổ khung) · phụ sinh (đuôi tàn) · vận tốc (gia tốc, xoay, nảy).

## 5. Asset
`fx_flame_loop`, `fx_fire_blast`, `fx_dust_ring` **mới**; dự phòng `fx_flame_burst`, `fx_boom`. Lửa quanh búa đang di chuyển cần prop gắn flipbook (`prop_flipbook`) — tạm dùng `trail` dày + `glow` nhấp.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 giơ càng; mục tiêu run → dẹp → bật · B3 bóng → búa rơi → nện → nảy · B4 bụi, khói, than · B5 hit-stop 100, rung 12 → 7 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~300 bóng **to hơn** khung ~100; khung `impact+80` mục tiêu **dẹp** rõ; `HITSTOP_RANGE` sạch.
