# Kịch bản: Nghiền Đồng (`skill_e_bronze_crush`) — quái Hộ Pháp Cổ Đại

```json scenario
{
  "id": "skill_e_bronze_crush", "kind": "skill", "name": "Nghiền Đồng", "element": "METAL", "tier": 3, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["elements/METAL", "elements/EARTH"],
  "assets": [
    { "id": "fxp_bronze_fist", "state": "have", "layer": "L1" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô đồng, mảnh kim loại)" },
    { "id": "fx_metal_spark", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô vàng xỉn)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Hộ pháp **giơ nắm đấm**, **bóng** dưới mục tiêu; **nắm đấm đồng khổng lồ** rơi, **nện** — **vòng sóng đồng** + **tia lửa vàng xỉn** "GONG-BWAM". Cảm giác: cổ xưa, vang như chuông đồng. T3 (power 2,0), 70 % Giảm thủ. Khác `skill_e_rock_slam` (đá vỡ, bụi) bởi **tiếng vang kim loại, tia lửa, vòng sóng** — không vỡ vụn.

## 2. Hiện tại
`fxp_bronze_fist fall` (ảnh) + vòng + spark + `fx_pow_star`, rung 10, 1200 ms. Audit: `STATIC_HERO`, `STATIC_SHARE`, `DURATION_UNDER`.

## 3. Kịch bản theo nhịp
| # | ms | Hộ pháp | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Giơ | 0–450 | giơ nắm đấm chậm, mắt sáng | bóng dưới mục tiêu to dần | run | — | gồng |
| 2 Rơi | 450–750 | đập xuống đồng bộ | nắm đấm rơi gia tốc, lóe ánh đồng chạy dọc | — | — | rít |
| 3 Nện | 750 | — | **bẹp** khi chạm, **vòng sóng đồng** lan + **tia lửa vàng xỉn** + bụi | dẹp | hit-stop medium 100, punch 1,05, rung 6 | "GONG-BWAM" |
| 4 Vang | 750–1100 | — | nắm đấm **rung ngân** (wobble nhỏ tắt dần), vòng sóng thứ 2 | bật lò xo; khói xám → `st_def_down` | — | ngân dài |
| 5 Dư âm | 1100–1350 | idle | nắm đấm mờ dần (không vỡ) | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | nắm đấm | `fxp_bronze_fist` | `prop fall` inBack + `shadow` + `squashOnHit` 450–750 → `wobble rot 3 freq 8` tắt dần 750–1100 → alpha 1100–1300 | 450–1300 |
| L2 | lóe đồng dọc nắm đấm | — | `glow #c8873a` 500–750 | 500–750 |
| L3 | tia lửa; vòng sóng; bụi | `fx_metal_spark`, `fx_dust_ring`, `fx_rock_burst` (mảnh đồng nhỏ, 0,6) | `strip fx_metal_spark` 750; `decal ring #c8873a` ×2 (750, 950); `strip fx_dust_ring under` 750; `strip fx_rock_burst frames [3,5]` 760 | 750–1200 |
| L4 | hit-stop, punch, rung | — | `stop medium 100`; `punch 1.05`; `shake 6` (từ 10); `move squash 0.65` → `bounce` | 750–1100 |
L1 đạt 3/3: biến hình nhẹ (ngân, vòng sóng) · phụ sinh (tia, vòng) · vận tốc (gia tốc, bẹp).

## 5. Asset
`fx_rock_burst`, `fx_metal_spark`, `fx_dust_ring` **mới**.

## 6. Các bước dựng
B1 nhịp `{ release 450, impact 750, end 1350 }` · B2 giơ / đập; mục tiêu dẹp · B3 nắm đấm rơi → ngân → mờ · B4 tia, vòng, bụi · B5 hit-stop + punch (rung 10 → 6) · B6 âm chuông · B7 capture.

## 7. Nghiệm thu
Audit hết 3 cờ; capture: hai vòng sóng ở hai khung; khác ảnh `skill_e_rock_slam` (không đá vụn lớn).
