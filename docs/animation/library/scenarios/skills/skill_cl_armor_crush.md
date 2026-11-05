# Kịch bản: Phá Giáp (`skill_cl_armor_crush`) — lớp Hộ Vệ

```json scenario
{
  "id": "skill_cl_armor_crush", "kind": "skill", "name": "Phá Giáp (lớp)", "element": "SELF", "tier": 2, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_hit_burst", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ người dùng $glow)" },
    { "id": "fx_crack_spread", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô trắng, xoay đứng ở ngực: nứt giáp)" },
    { "id": "fxs_metal_bit", "state": "have", "layer": "L3" },
    { "id": "fx_debuff_sink", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Nhún, nhảy vồng lên cao** rồi **bổ xuống** mục tiêu từ trên; **vết nứt sáng tách giáp** ở ngực, mảnh giáp bung. Cảm giác: "hup → KRUNCH", nặng. T2 (power 0,9 — hiện quá tay T4: rung 7+). Màu theo hệ người dùng. 80 % Giảm thủ.

## 2. Hiện tại
`$boom` + nứt + mảnh kim, hit-stop 90, rung lớn. Audit: `STATIC_HERO`, `STATIC_SHARE`, `IMPACT_OVER_TIER`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Nhảy | 0–280 | pose `attack`, nhún bẹp 0,85 → **nhảy vồng 60** (kéo giãn dọc) | — | ngước | — | "hup" |
| 2 Bổ | 280–480 | **lật đầu xuống**, rơi nhanh | vệt theo hệ | — | — | rít |
| 3 Trúng | 480 | bẹp khi chạm | va chạm theo hệ + **nứt sáng lan** trên ngực + mảnh giáp | khuỵu (squash 0,85) | hit-stop medium 80, rung 4 dọc | "KRUNCH" |
| 4 Dư âm | 480–1150 | bật về | khói xám chảy xuống mục tiêu → `st_def_down` | co người | — | leng keng |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | va chạm; nứt giáp | `fx_hit_burst` ($glow), `fx_crack_spread` (trắng, ngực) | `strip` 480; `strip fx_crack_spread` 480–620 | 480–700 |
| L2 | vệt khi bổ | — | `trail $color` | 280–480 |
| L3 | mảnh giáp; khói xuống | `fxs_metal_bit`, `fx_debuff_sink` | `burst metal_spray` 520; `strip fx_debuff_sink` 700 | 520–1100 |
| L4 | hit-stop, rung dọc; khuỵu | — | `stop medium`; `shake 4 dir [0,1]` (từ 7); `move squash 0.85` target | 480–800 |
Hình chủ đạo là **thân người đánh** (nhảy kéo giãn, lật, bẹp) + va chạm 6 khung: đạt 2/3.

## 5. Asset
`fx_hit_burst`, `fx_crack_spread`, `fx_debuff_sink` **mới**; dự phòng `$boom`, `fx_ground_crack`, `burst debuff_smoke`.

## 6. Các bước dựng
B1 nhịp (giữ) · B2 nhún → nhảy → lật → bẹp → bật; mục tiêu khuỵu · B3 va chạm, nứt · B4 mảnh, khói · B5 **hạ rung về T2** · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `IMPACT_OVER_TIER`, `STATIC_HERO`; capture: khung ~200 heo **cao hơn** mục tiêu; khung `impact+80` nứt trên ngực.
