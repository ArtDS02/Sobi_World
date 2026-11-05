# Kịch bản: Tia Rune (`skill_e_rune_beam`) — quái Hồn Rune

```json scenario
{
  "id": "skill_e_rune_beam", "kind": "skill", "name": "Tia Rune", "element": "LIGHT", "tier": 3, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHT"],
  "assets": [
    { "id": "fxs_rune_a", "state": "have", "layer": "L2" },
    { "id": "fxs_rune_b", "state": "have", "layer": "L3" },
    { "id": "fx_star_bloom", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô tím lam)" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Ký tự rune xoay trên đầu** đốm sáng, **sáng dần** và **quay nhanh dần**; bắn **tia tím lam lõi trắng**, **giữ tia** một nhịp; tại mục tiêu **nở sao** và ba rune nhỏ **vỡ**. Cảm giác: bí ẩn, chính xác, "wiiing → TSHH". T3 (power 1,4). Tác động đã thêm (medium + punch + rung 4, 2026-11-05).

## 2. Hiện tại
beam + `fx_pow_star` + stop medium + punch + flash; 1060 ms. Audit: `DURATION_UNDER`.

## 3. Kịch bản theo nhịp
| # | ms | Hồn rune | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tụ | 0–420 | lơ lửng nhấp nhô | rune to **xoay trên đầu**, nhanh dần, **sáng dần** | — | — | "wiiing" tăng |
| 2 Bắn | 420–560 | giật lùi | tia **mở 3 → 12 px** (lõi trắng, viền tím lam) | — | — | "tsss" |
| 3 Trúng | 560 | giữ tia | **sao nở** tím lam + 3 rune nhỏ **vỡ** bắn ra | bật lùi, tint trắng | hit-stop medium 80, punch 1,04, chớp 0,3, rung 4 | "TSHH" |
| 4 Giữ + tắt | 560–850 | — | tia **giữ** rồi **co thành sợi**, tắt | — | — | ngân |
| 5 Dư âm | 850–1150 | idle | lấp lánh tím rơi | — | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | tia | beam code (`#8c9cff`) | `beam width 3` 420–480 → `12` 480–760 → `2` 760–850 | 420–850 |
| L2 | rune trên đầu | `fxs_rune_a` (0,4, tô tím lam) | `prop hover spot above` + `spin` tăng + `glow` tăng 0–420 → co + alpha 420–600 | 0–600 |
| L3 | sao nở; rune vỡ; lấp lánh | `fx_star_bloom`, `fxs_rune_b` | `strip fx_star_bloom` 560; `burst rune_b_spray` 560; `burst star_fall` 850 | 560–1150 |
| L4 | hit-stop, punch, chớp (có) | — | giữ như hiện tại | 560–800 |
L1 (beam code) đạt 2/3: biến hình (mở / co) · phụ sinh (rune vỡ, sao).

## 5. Asset
`fx_star_bloom` **mới**; dự phòng `fx_pow_star` tô tím lam.

## 6. Các bước dựng
B1 nhịp `{ release 420, impact 560, end 1150 }` · B2 nhấp nhô, giật lùi · B3 tia 3 nấc · B4 rune (L2), sao, rune vỡ · B5 giữ tác động hiện có · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`; capture: khung ~200 và ~400 rune **góc xoay khác nhau** và sáng hơn.
