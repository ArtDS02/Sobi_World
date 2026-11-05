# Kịch bản: Thiên Thạch (`skill_cl_meteor`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_meteor", "kind": "skill", "name": "Thiên Thạch", "element": "SELF", "tier": 3, "durationMs": 1900,
  "status": "draft", "refs": [], "bibles": ["actions/cast", "elements/EARTH"],
  "assets": [
    { "id": "fxp_meteor", "state": "have", "layer": "L1" },
    { "id": "fx_flame_loop", "state": "new", "layer": "L2", "spec": "Xem scenarios/ASSETS.md (tô theo hệ, đuôi sau thiên thạch)" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (size 2)" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Giơ tay gọi; **góc trời trên phải rực màu hệ**, **bóng báo** giữa phe địch to dần; **thiên thạch lao chéo** với đuôi dài cháy theo hệ — **đâm** giữa phe địch: nổ vỡ đá, nứt đất, mọi quái bị hất. Cảm giác: thảm họa nhỏ, nặng. T3 diện rộng (power 1,6), hit-stop / rung trong rubric.

## 2. Hiện tại
`fxp_meteor` (một ảnh lao), `fx_boom` 2× + nứt, hit-stop 130, rung 14. Audit: `STATIC_HERO`, `STATIC_SHARE`; tác động quá khoảng.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Quái | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Gọi | 0–500 | pose `cast`, giơ tay | góc trên phải **rực màu hệ**; **bóng** giữa phe địch to dần | ngước, run | tối 20 % | rít xa |
| 2 Lao | 500–1100 | giữ tay | thiên thạch **lao chéo** (gia tốc), **xoay chậm**, đuôi lửa hệ dài + khói + hạt | co rúm | — | rít dài |
| 3 Đâm | 1100 | — | nổ: **đá vỡ tung** 2×, **nứt đất** lan, bụi vòng | hất lên (stagger 60) | hit-stop medium 100, punch 1,05, chớp 0,35, rung 7 | "KA-BOOOM" |
| 4 Dư âm | 1100–1900 | hạ tay | đá vụn rơi lộp độp, khói cuộn, vết nứt mờ dần | rơi, ngồi dậy | nền về | đá rơi |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | rực góc trời; tối | — | `tint $color 0.2` + `vignette` | 0–1500 |
| L1 | thiên thạch; nổ đá | `fxp_meteor` (tô $color), `fx_rock_burst` (2×) | `prop fall` chéo ease `inQuad` + `spin 0.2` + `stretch` + `shadow` 500–1100; `strip fx_rock_burst` 1100 | 500–1350 |
| L2 | đuôi lửa hệ | `fx_flame_loop` ($color) | đuôi: `trail` hạt dày + (khi có `prop_flipbook`) lửa phủ | 500–1100 |
| L3 | nứt; bụi vòng; đá vụn; khói | `fx_crack_spread`, `fx_dust_ring`, `fxs_pebble` | `strip fx_crack_spread under` 1100; `strip fx_dust_ring` 1100; `burst pebble_fall` 1300; `burst puff_rise` 1300 | 1100–1900 |
| L4 | hit-stop, punch, chớp, rung; quái hất | — | `stop medium 100` (từ 130); `punch 1.05`; `flash 0.35`; `shake 7` (từ 14); `move lift` stagger 60 | 1100–1500 |
L1 đạt 3/3: biến hình (nổ đá khung; đuôi lửa) · phụ sinh (đuôi, khói, đá vụn) · vận tốc (gia tốc, xoay, kéo giãn).

## 5. Asset
`fx_flame_loop`, `fx_rock_burst`, `fx_crack_spread`, `fx_dust_ring` **mới**; dự phòng `fx_boom`, `fx_ground_crack`.

## 6. Các bước dựng
B1 nhịp `{ release 500, impact 1100, end 1900 }` (rút 100) · B2 giơ tay; quái run / hất · B3 thiên thạch lao → nổ · B4 nứt, bụi, đá vụn · B5 **hit-stop 100, rung 7** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`, `HITSTOP_RANGE` sạch; capture: khung ~300 bóng **to hơn** khung ~100; khung ~900 thiên thạch xiên có đuôi.
