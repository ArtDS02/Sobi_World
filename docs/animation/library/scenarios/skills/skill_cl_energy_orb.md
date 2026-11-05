# Kịch bản: Cầu Năng Lượng (`skill_cl_energy_orb`) — lớp Pháp Sư

```json scenario
{
  "id": "skill_cl_energy_orb", "kind": "skill", "name": "Cầu Năng Lượng", "element": "SELF", "tier": 3, "durationMs": 1250,
  "status": "draft", "refs": [], "bibles": ["actions/projectile", "actions/cast"],
  "assets": [
    { "id": "fx_energy_orb", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $color)" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": ["prop_flipbook"]
}
```

## 1. Ý tưởng
**Quả cầu theo hệ quay quanh người hai vòng, lớn dần** (năng lượng cuộn bên trong), rồi **phóng xoáy** đi theo đường xoắn ốc nhẹ, nổ theo hệ. Cảm giác: tích tụ rồi phóng, "wum-wum → fwoom". T3 (power 1,5). Skill **ưu tiên cao nhất** của audit (27): mọi heo Pháp Sư đều có.

## 2. Hiện tại
Dùng `fxp_bubble_big` (bong bóng **nước**) làm quả cầu cho **mọi hệ** — sai nhận diện; không vòng quanh người. Audit: `STATIC_HERO`, `STATIC_SHARE`, `FEW_LAYERS`, `DURATION_UNDER`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tụ | 0–450 | pose `cast`, xoay tay | quả cầu nhỏ **quay quanh người 2 vòng**, **to dần** 0,3 → 0,8, hạt hệ bị hút vào | — | — | "wum-wum" |
| 2 Giữ | 450–520 | đẩy tay ra trước | cầu dừng ở `front`, **sáng chói**, rung | — | — | ngân |
| 3 Phóng | 520–800 | giật lùi 12 | cầu bay **xoắn ốc nhẹ** (lượn ±10 px), kéo giãn, vệt hạt hệ | — | — | "fwoom" |
| 4 Nổ | 800 | — | nổ theo hệ 1,0 + 10 hạt hệ | bật lùi 24 | hit-stop medium 80, punch 1,04, rung 4 | "BOOM" |
| 5 Dư âm | 800–1250 | idle | khói tan, hạt hệ rơi | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | cầu năng lượng; nổ | `fx_energy_orb` ($color), `fx_hit_burst` | `prop orbit` quanh actor 2 vòng + size tăng 0–450 → `hover` + `pulse` 450–520 → `prop throw` arc 10 + `wobble` (xoắn) + `stretch` 520–800 — cầu phải **phát khung loop** khi di chuyển (`prop_flipbook`); `strip fx_hit_burst` 800 | 0–1000 |
| L2 | lõi sáng tay; vệt | — | `glow $color` 0–520; `trail $color` 520–800 | 0–800 |
| L3 | hạt hút vào; vệt hạt; khói | `fxs_puff` | `burst $spark` hút vào 100; `prop … trail $spark every 60`; `burst puff_rise` 900 | 100–1250 |
| L4 | hit-stop, punch | — | `stop medium`; `punch 1.04`; `shake 4`; `move knock x 24` | 800–1100 |
L1 đạt 3/3: biến hình (cầu cuộn loop, nổ khung) · phụ sinh (hạt) · vận tốc (quay quanh, to dần, xoắn, kéo giãn).

## 5. Asset
`fx_energy_orb`, `fx_hit_burst` **mới**. Dự phòng trước `prop_flipbook`: `prop` dùng `fxs_spark` to tô hệ + `pulse` + `glow` (không dùng bong bóng nước).

## 6. Các bước dựng
B1 nhịp `{ release 520, impact 800, end 1250 }` · B2 xoay tay, đẩy, giật lùi; mục tiêu bật · B3 cầu quay → giữ → phóng → nổ · B4 hạt, khói · B5 hit-stop + punch · B6 âm · B7 capture (heo pháp sư 2–3 hệ khác nhau).

## 7. Nghiệm thu
Audit hết 4 cờ; capture: khung ~200 cầu ở **phía sau** người, khung ~400 ở **phía trước**, to hơn; màu cầu đổi theo hệ của heo.
