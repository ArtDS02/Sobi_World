# Kịch bản: Hơi Thở Dung Nham (`skill_e_magma_breath`) — quái Rồng Dung Nham

```json scenario
{
  "id": "skill_e_magma_breath", "kind": "skill", "name": "Hơi Thở Dung Nham", "element": "FIRE", "tier": 2, "durationMs": 1500,
  "status": "draft", "refs": [], "bibles": ["elements/FIRE"],
  "assets": [
    { "id": "fx_fire_blast", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (nhỏ, trong cổ họng)" },
    { "id": "fxs_ember", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Rồng **ngửa cổ**, **cổ họng đỏ rực dần** (lửa cháy trong họng), rồi **phun luồng dung nham** hình nón **quét ngang** cả đội từ trái sang phải; nổ lửa ở từng con. Cảm giác: luồng nhiệt đặc, kéo dài. T2 diện rộng (power 1,1), 50 % Bỏng. Rung đã hạ 7 → 4.

## 2. Hiện tại
`cone` + `fx_flame_burst` chung + rung, flash. Audit: `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Rồng | Hiệu ứng chính | Phe ta | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Ngửa | 0–450 | **ngửa cổ**, ngực phồng | **họng đỏ dần**, lửa cháy trong họng, khói mũi | lùi nửa bước | nền cam 10 % | hít sâu |
| 2 Phun | 450–1050 | cúi đầu **quét** từ trái → phải | **nón dung nham** dày, tàn bay theo, nón **lia** qua đội | nổ lửa ở từng con (stagger 100) | hit-stop light 50 con đầu, rung 4 kéo dài | "GRRAAAH" + lửa gầm |
| 3 Tắt | 1050–1200 | khép miệng, khói | nón co lại | nhảy nhót | — | xèo |
| 4 Dư âm | 1200–1500 | idle | khói bốc, vết cháy dưới chân đội; `st_burn` | — | nền về | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | nền cam | — | `tint #ff7a2a 0.1` | 0–1400 |
| L1 | nón dung nham | cone code (`#ff4a1a`) | `cone width` mở 450–600 → giữ, hướng lia (2–3 act lệch target) 600–1050 → co 1050–1200 | 450–1200 |
| L2 | lửa trong họng | `fx_flame_loop` (0,3, `spot front`) | loop 0–450 | 0–450 |
| L3 | tàn theo nón; nổ lửa; khói; vết | `fxs_ember`, `fx_fire_blast` | `burst ember_spray` theo nón; `strip fx_fire_blast` per target stagger 100; `burst fire_smoke` 1200; `decal scorch` | 450–1500 |
| L4 | rung; hit-stop | — | `shake 4` (đã hạ); `stop light`; `move hop` targets | 450–1200 |
L1 (cone code) đạt 2/3: biến hình (nón mở / lia / co) · phụ sinh (tàn).

## 5. Asset
`fx_fire_blast`, `fx_flame_loop` **mới**; dự phòng `fx_flame_burst`.

## 6. Các bước dựng
B1 nhịp `{ release 450, impact 450, end 1500 }` · B2 ngửa / cúi / quét; đội lùi, nhảy · B3 nón lia · B4 tàn, nổ, khói, vết · B5 hit-stop light, rung 4 · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `SHARED_FLIPBOOK_HERO`; capture: khung ~600 nón hướng **con bên trái**, khung ~950 hướng **con bên phải**.
