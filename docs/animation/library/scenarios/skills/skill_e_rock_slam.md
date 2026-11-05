# Kịch bản: Nện Đá (`skill_e_rock_slam`) — quái golem

```json scenario
{
  "id": "skill_e_rock_slam", "kind": "skill", "name": "Nện Đá", "element": "EARTH", "tier": 3, "durationMs": 1350,
  "status": "draft", "refs": [], "bibles": ["elements/EARTH"],
  "assets": [
    { "id": "fxp_rock_fist", "state": "have", "layer": "L1" },
    { "id": "fx_rock_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fx_dust_ring", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_pebble", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Golem **giơ tay lên trời**, **bóng nắm tay** to dần dưới mục tiêu; **nắm đá khổng lồ rơi** gia tốc, **NỆN** — mục tiêu **dẹp lép**; nắm đá **vỡ vụn**. Cảm giác: nặng tuyệt đối, "HNNGH → BWAMM". T3 (power 1,5), 20 % Choáng. Người Đá Quặng, Lính Gác Đá.

## 2. Hiện tại
`fxp_rock_fist fall` (một ảnh) + `fx_boom` + sỏi, rung 10, 1050 ms. Audit: `STATIC_HERO`, `STATIC_SHARE` (dư âm, vết nứt đã thêm).

## 3. Kịch bản theo nhịp
| # | ms | Golem | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Giơ | 0–450 | giơ nắm tay chậm, gồng | **bóng** dưới mục tiêu **to dần**, sỏi rơi lác đác từ trên | ngước, run | — | "HNNGH" |
| 2 Rơi | 450–750 | đập tay xuống (đồng bộ) | nắm đá rơi **gia tốc**, xoay nhẹ, vụn đá rơi theo | — | — | rít |
| 3 Nện | 750 | — | **bẹp** khi chạm, bụi vòng | **dẹp** sy 0,6 | hit-stop medium 100, punch 1,05, rung 6 dọc | "BWAMM" |
| 4 Vỡ | 850 | — | nắm đá **vỡ vụn** (rock_burst) | bật lò xo | — | "krak" |
| 5 Dư âm | 850–1350 | idle | sỏi lăn, bụi lắng, nứt; `st_stun` | — | — | sỏi |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | nắm đá; vỡ | `fxp_rock_fist`, `fx_rock_burst` | `prop fall` ease inBack + `spin 0.1` + `shadow` + `squashOnHit` 450–750 → đứng 750–850 → `strip fx_rock_burst size 1.4` 850 (prop biến mất) | 450–1100 |
| L2 | vụn đá rơi theo | — | `prop … trail pebble_trail every 50` | 450–750 |
| L3 | bụi vòng; sỏi; nứt | `fx_dust_ring`, `fxs_pebble` | `strip fx_dust_ring under` 750; `burst pebble_spray` 850; `decal crack` (đã có) | 750–1350 |
| L4 | hit-stop, punch, rung; dẹp / bật | — | `stop medium 100`; `punch 1.05`; `shake 6 dir [0,1]` (từ 10); `move squash 0.6` → `bounce` | 750–1100 |
L1 đạt 3/3: biến hình (vỡ khung) · phụ sinh (vụn đá) · vận tốc (gia tốc, bẹp).

## 5. Asset
`fx_rock_burst`, `fx_dust_ring` **mới**; dự phòng `fx_boom`, `burst pebble_spray`.

## 6. Các bước dựng
B1 nhịp `{ release 450, impact 750, end 1350 }` · B2 giơ / đập tay; mục tiêu dẹp / bật · B3 nắm đá rơi → vỡ · B4 bụi, sỏi · B5 hit-stop + punch (rung 10 → 6) · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~300 bóng **to hơn** khung ~100; khung ~900 nắm đá **đã vỡ**.
