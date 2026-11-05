# Kịch bản: Chém Mạnh (`skill_cl_power_strike`) — lớp Chiến Binh

```json scenario
{
  "id": "skill_cl_power_strike", "kind": "skill", "name": "Chém Mạnh", "element": "SELF", "tier": 3, "durationMs": 1100,
  "status": "draft", "refs": [], "bibles": ["actions/melee-and-hit"],
  "assets": [
    { "id": "fx_slash_long", "state": "new", "layer": "L1", "spec": "Xem scenarios/ASSETS.md (tô theo hệ $glow)" },
    { "id": "fx_hit_burst", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md (tô theo hệ)" },
    { "id": "fxs_streak", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
**Lùi xa, gồng sức lâu**, mắt lóe, gió hút vào; **lao cực nhanh** thành vệt — một **vệt chém dày** theo hệ, mục tiêu **văng xa**. Cảm giác: tích lực rõ → bùng. T3 (power 1,8).

## 2. Hiện tại
`fx_slash_arc` chung + `fx_pow_star`; ngắn 930 ms. Audit: `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Gồng | 0–380 | pose `attack`, **lùi 40**, nén lâu (sx 1,1 / sy 0,88), mắt lóe | 6 vệt gió **hút vào** | — | tối nhẹ 8 % | "hrrraa" |
| 2 Lao | 380–460 | lao cực nhanh, kéo giãn 1,15, 3 bóng mờ | — | — | — | vút |
| 3 Chém | 460 | — | **vệt chém dày** theo hệ mở → khép + va chạm | **văng 50** | hit-stop medium 100, punch 1,04, rung 5 | "WHAM!" |
| 4 Về | 460–1100 | nảy về, lắc vai | hạt theo hệ rơi | ngồi dậy | — | — |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L1 | vệt chém | `fx_slash_long` ($glow) | `strip` 460 | 460–700 |
| L2 | mắt lóe; bóng mờ | — | `glow $color` 250–380; `trail every 30` | 250–470 |
| L3 | gió hút vào; va chạm; hạt | `fxs_streak`, `fx_hit_burst` | `burst streak_spray` hút vào 0; `strip fx_hit_burst` 460; `burst $spark` 600 | 0–900 |
| L4 | hit-stop, punch; văng | — | `stop medium 100`; `punch 1.04`; `shake 5`; `move knock x 50` | 460–800 |
Thân (gồng → lao kéo giãn) + vệt chém 6 khung: đạt 2/3.

## 5. Asset
`fx_slash_long`, `fx_hit_burst` **mới**; dự phòng `fx_slash_arc`, `$boom`.

## 6. Các bước dựng
B1 nhịp `{ release 380, impact 460, end 1100 }` · B2 gồng / lao / nảy về; mục tiêu văng · B3 vệt chém · B4 gió, va chạm, hạt · B5 hit-stop 100 + punch · B6 âm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`, `SHARED_FLIPBOOK_HERO`; capture: khung ~300 heo **xa hơn** chỗ đứng và nén thấp.
