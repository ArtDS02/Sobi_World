# Kịch bản: Va Chạm Thuần (`skill_hk_pure_impact`)

```json scenario
{
  "id": "skill_hk_pure_impact", "kind": "skill", "name": "Va Chạm Thuần", "element": "VOID", "tier": 2, "durationMs": 1050,
  "status": "draft", "refs": [], "bibles": ["elements/VOID"],
  "assets": [
    { "id": "fxp_void_fist", "state": "have", "layer": "L1" },
    { "id": "fx_void_implode", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_ice_shard", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_displace"]
}
```

## 1. Ý tưởng
Sứa **co lại**, không khí quanh **méo**; **không gian nén thành nắm đấm pha lê** — **khoảng lặng** — đấm thẳng: mục tiêu **trượt lùi thẳng** không xoay, ba vòng sóng đồng tâm. Cảm giác: lực thuần, lạnh, "… VWUMP". T2 (power 1,15).

## 2. Hiện tại
`fxp_void_fist fly` + knock + `split` + hạt băng. Audit: `STATIC_HERO`, `STATIC_SHARE`. Nắm đấm là ảnh bay sẵn — không thấy "nén" thành nắm đấm; mảnh vỡ dùng hạt băng (lệch hệ).

## 3. Kịch bản theo nhịp
| # | ms | Sứa | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Co | 0–300 | pose `cast`, co 0,75 | không khí trước mặt **bị hút vào** (implode K1–K3) | — | — | hút gió nhỏ |
| 2 Nén | 300–400 | giữ | nắm đấm **hình thành** từ điểm hút (grow 0 → 1, mép gợn) | — | — | ù |
| 3 Lặng | 400–460 | — | nắm đấm đứng, rung nhẹ | — | im | — |
| 4 Đấm | 460–560 | bật về 1,05 | nắm đấm lao **thẳng**, kéo giãn | — | — | — |
| 5 VWUMP | 560 | — | **bung ngược** (implode K5–K6) + 3 vòng sóng đồng tâm | **trượt lùi 50** không xoay | hit-stop medium 100, tách màu 70, rung 5 | "VWUMP" |
| 6 Dư âm | 560–1050 | idle | nắm đấm vỡ thành mảnh pha lê **tím** rơi, vòng tắt | — | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | điểm hút; nắm đấm; bung | `fx_void_implode`, `fxp_void_fist` | `strip fx_void_implode frames [0,2] spot front` 0–300; `prop grow` + `prop_displace` 300–400 → `prop fly` linear + `stretch` 460–560; `strip fx_void_implode frames [4,5]` tại mục tiêu 560 | 0–800 |
| L2 | vệt đấm | — | `trail` tím mảnh | 460–560 |
| L3 | vòng sóng; mảnh pha lê | `fxs_ice_shard` (tô `#8c7cff`) | `decal ring` ×3 lệch 60; `burst void_sparks` 600 (mảnh pha lê tô tím) | 560–1050 |
| L4 | hit-stop, tách màu, trượt lùi | — | `stop medium`; `split 70`; `shake 5`; `move knock x 50 deg 0` | 560–900 |
L1 đạt 3/3: biến hình (hút / nén / bung) · phụ sinh (vòng sóng, mảnh) · vận tốc (lặng → đấm kéo giãn).

## 5. Asset
`fx_void_implode` **mới**; dự phòng `fx_void_portal` khung 0.

## 6. Các bước dựng
B1 nhịp `{ release 460, impact 560, end 1050 }` · B2 co / bật; mục tiêu trượt thẳng · B3 hút → nén → lặng → đấm → bung · B4 vòng, mảnh tím · B5 hit-stop, tách màu (rung 6 → 5) · B6 âm có khoảng lặng · B7 capture.

## 7. Nghiệm thu
Audit hết `STATIC_HERO`; capture: khung ~350 nắm đấm **nhỏ đang hình thành**; khung ~430 gần như đứng yên; mảnh vỡ màu tím, không xanh băng.
