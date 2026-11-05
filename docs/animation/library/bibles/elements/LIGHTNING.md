# Bible hệ SẤM (LIGHTNING)

Khuôn như [WATER](WATER.md). Màu: `elements.LIGHTNING` (`color #ffe14a`, `glow #fffbd0`); nét `bolt`, `spark bolt_pop`, `boom fx_bolt_strike`, rung 7.

## 1. Tính cách
Sấm **không khối lượng, tức thời, giật cục**. Đọc khi bỏ màu: zigzag nhánh rẽ, xuất hiện / biến mất trong 1–2 khung, **im lặng tích điện rồi nổ**.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Chuẩn bị | tĩnh điện nhỏ nhảy trên thân, lông dựng, mây tụ | `burst spark_pop` lác đác, `glow` nhấp nháy, `prop fxp_storm_cloud` tụ |
| Đường đi | **không bay**: tia đánh tức thì (≤ 2 khung) từ trên / từ tay | `strip fx_bolt_strike`, `beam` ngắn, `tether` có `wave` |
| Va chạm | trắng 1 khung, nhánh tỏa, mục tiêu **giật** 3–4 lần | `flash #fffbd0` ≤ 0,35, `stop medium` (+ `punch` cho T3), `move shake` nhanh |
| Dư âm | hồ quang nhỏ nhảy trên thân 300–500, khói mỏng | `burst bolt_pop` vài nhịp, `burst lightning_glow` |
| Âm thanh | rắc → ầm (lệch 1 nhịp) | 2 `sound` |

## 3. Nhịp mẫu
Gọi sấm T2: mây tụ 400 (tối dần, tĩnh điện) → **đánh 40** → chớp + hit-stop 80 → giật 300 → hồ quang 400. Chuỗi sét: mỗi bước nhảy 80–100, mỗi mục tiêu một nhánh, cuối mạnh nhất.

## 4. Hình chủ đạo sống
Tia sét **phải khác nhau mỗi lần** (zigzag ngẫu nhiên): `beam` / `tether` vẽ bằng code đạt sẵn dấu hiệu 1. Mây (`fxp_storm_cloud`) và ấn sừng (`fxp_horn_sigil`) tĩnh → cần nhấp sáng bên trong theo nhịp sét + rung nhẹ + tia nhỏ nhảy quanh.

## 5. Asset hiện có
Flipbook `fx_bolt_strike` [4]. Vật: `fxp_storm_cloud`, `fxp_horn_sigil`, `fxp_sky_bell`; sprite `fxs_bolt_mini`, `fxs_spark`. Hạt: `lightning_*`, `bolt_*`, `spark_*`.
**Thiếu:** flipbook mây chớp bên trong 4–6 khung.

## 6. Hiện trạng (audit)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_ult_ld` | T4/T4 | STATIC_HERO, FEW_LAYERS | ấn sừng tích điện (glow nhịp), nhiều tia lệch nhịp; thêm L2 |
| `skill_ld_thunder_strike` | T3/T4 | STATIC_HERO, NO_AFTERMATH, DURATION_UNDER | thêm tích điện 300 + hồ quang dư âm |
| `skill_ld_call_thunder` | T2/T3 | STATIC_HERO, DURATION_OVER | mây nhấp sáng; rút ngắn |
| `skill_e_dive`, `skill_e_thunder_charge`, `skill_e_spark_peck`, `skill_ld_chain` | T1–T3 | SHARED_FLIPBOOK_HERO (4/7), NO_AFTERMATH | va chạm bằng `fx_bolt_strike` / `$spark` thay `fx_boom` / `fx_pow_star` / `fx_slash_arc` |
Phản ứng `reaction_shock`: giật + hồ quang trên mục tiêu ướt — giữ, thêm giọt bắn tia điện.

## 7. Cấm
Tia sét bay chậm như đạn; sét cong mềm; nhấp nháy toàn màn > 3 lần/giây (an toàn quang học, rubric §10.4); dùng sao chung thay tia.
