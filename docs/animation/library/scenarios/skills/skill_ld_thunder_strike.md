# Kịch bản: Lôi Kích (`skill_ld_thunder_strike`)

```json scenario
{
  "id": "skill_ld_thunder_strike", "kind": "skill", "name": "Lôi Kích", "element": "LIGHTNING", "tier": 3, "durationMs": 1150,
  "status": "draft", "refs": [], "bibles": ["elements/LIGHTNING"],
  "assets": [
    { "id": "fxp_horn_sigil", "state": "have", "layer": "L2" },
    { "id": "fx_bolt_strike", "state": "have", "layer": "L1" },
    { "id": "fx_spark_arc", "state": "new", "layer": "L3", "spec": "Xem scenarios/ASSETS.md" },
    { "id": "fxs_bolt_mini", "state": "have", "layer": "L3" },
    { "id": "fxs_puff", "state": "have", "layer": "L3" }
  ],
  "engine": []
}
```

## 1. Ý tưởng
Sừng **tích điện lách tách**; **ký hiệu sừng báo trước** nhấp nháy hai lần trên đầu mục tiêu — rồi **sét giáng thẳng xuống** tức thì; mục tiêu bị **tô xám, lông xù**, hồ quang chạy trên thân. Cảm giác: im — báo — KRA-KOOM. T3 (power 1,4).

## 2. Hiện tại
`fxp_horn_sigil pop` 200 ms + `fx_bolt_strike` + chớp + hit-stop 90 + rung 7. Audit: `STATIC_HERO` (ký hiệu bị coi là hình chủ đạo), `DURATION_UNDER` (1000). Thiếu nhịp tích điện rõ và dư âm hồ quang.

## 3. Kịch bản theo nhịp
| # | ms | Heo | Hiệu ứng chính | Mục tiêu | Màn hình | Âm thanh |
|---|---|---|---|---|---|---|
| 1 Tích | 0–350 | pose `cast`, sừng sáng nhấp, lông dựng | 6 tia nhỏ lách tách quanh sừng | — | tối dần 15 % | "bzzzt" |
| 2 Báo | 350–520 | giữ | ký hiệu sừng nhỏ hiện trên đầu mục tiêu, **nhấp nháy 2 lần** | ngước, giật mình | — | "tik tik" |
| 3 Giáng | 520 | ngẩng mạnh | sét **giáng** (2 khung), trắng 1 khung | tô xám 150 ms, lông xù, giật 3 lần | hit-stop medium 90, punch 1,04, chớp 0,35, rung 5 | "KRA-" |
| 4 Rền | 520–700 | — | nhánh sét tỏa ở chân | — | — | "-KOOM" (trễ 1 nhịp) |
| 5 Dư âm | 700–1150 | idle | **hồ quang** nhảy trên thân 400 ms, khói mỏng | rùng mình | nền về | lách tách |

## 4. Bóc lớp
| Lớp | Thành phần | Asset | Chuyển động | ms |
|---|---|---|---|---|
| L0 | tối nền | — | `tint 0.15` | 0–1100 |
| L1 | tia sét | `fx_bolt_strike` (khung đầu giữ 40 ms) | `strip` 520, `size 1.2` | 520–760 |
| L2 | ký hiệu báo; sừng nhấp | `fxp_horn_sigil` | `prop pop` size 0,35 + `pulse amp 0.3 freq 6` (2 nhịp) 350–520; `glow #ffe14a` nhấp trên actor 0–350 | 0–520 |
| L3 | tia nhỏ quanh sừng; hồ quang; khói | `fxs_bolt_mini`, `fx_spark_arc`, `fxs_puff` | `burst bolt_pop` 0–300 thưa; `strip fx_spark_arc` loop `hold 300` 700; `burst puff_rise` 750 | 0–1150 |
| L4 | hit-stop, punch, chớp, giật | — | `stop medium`; `punch 1.04`; `flash #fffbd0 0.35`; `shake 5`; `move shake x 4 n 6` target | 520–900 |
Hình chủ đạo là tia sét (`fx_bolt_strike`, biến hình 4 khung) + hồ quang loop: đạt 2/3 (biến hình · phụ sinh).

## 5. Asset
`fx_spark_arc` **mới**; còn lại có. Dự phòng: `burst bolt_pop` ×3 lệch 120 ms.

## 6. Các bước dựng
B1 nhịp `{ release 350, impact 520, end 1150 }` (kéo dài pha tích / báo) · B2 sừng, lông dựng; mục tiêu giật + tô xám · B3 ký hiệu báo → sét · B4 tia nhỏ, hồ quang, khói · B5 hit-stop medium + punch (giảm rung 7 → 5) · B6 âm tách rắc / ầm · B7 capture.

## 7. Nghiệm thu
Audit hết `DURATION_UNDER`; hero chuyển sang `fx_bolt_strike` (ký hiệu là L2); capture: khung ~400 và ~470 ký hiệu **sáng / tắt** khác nhau; khung ~900 hồ quang trên thân.
