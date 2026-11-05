# Bible hệ ÁNH SÁNG (LIGHT)

Khuôn như [WATER](WATER.md). Màu: `elements.LIGHT` (`color #ffe98a`, `glow #ffffff`); nét `beam`, `spark star_pop`, `boom fx_light_pillar`, rung **0** mặc định. Liên quan: Lumina / Sobi Essence (style guide §4: sáng ấm, hạt tròn, bay lên).

## 1. Tính cách
Ánh sáng **không khối lượng, tỏa từ tâm, ấm và thanh**. Đọc khi bỏ màu: sao 4 cánh, tia thẳng tỏa đều, **nở ra** từ một điểm rồi lấp lánh rơi chậm. Không rung mạnh — tác động thể hiện bằng **độ sáng**, không bằng lắc.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Act |
|---|---|---|
| Hình thành | gom về một điểm sáng nhỏ (hút vào), rồi nở | `burst light_stars` hút vào, `glow` tăng dần |
| Đường đi | tia thẳng tức thì hoặc giáo sáng bay thẳng nhanh | `beam`, `prop fly` + `trail light_trail` |
| Va chạm | nở sao + cột sáng, **bloom** (lóe mềm, không chớp trắng gắt) | `strip fx_light_pillar`, `burst star_spray`, `flash #ffe98a` ≤ 0,3 |
| Dư âm | lấp lánh rơi chậm 600–900, vòng sáng tan | `burst star_fall`, `decal ring` |
| Mục tiêu (địch) | bị đẩy lùi nhẹ, tint trắng 1 nhịp | `move knock`, `glow #ffffff` |

## 3. Nhịp mẫu
Tia sáng T2–T3: tụ điểm sáng 350 → **phóng tia 60** → giữ tia 250 (beam có độ dày dao động) → nở sao + hit-stop medium → lấp lánh 700. Tác động T3 của Ánh sáng: `stop medium` + `punch 1.04` + `flash` vàng, **rung ≤ 3**.

## 4. Hình chủ đạo sống
Vòng Lumina (`fxp_lumina_ring`), đĩa mặt trời (`fxp_sun_disc`): xoay + tia tỏa nhấp nhô (pulse lệch pha) + hạt sao sinh ra từ vành. Beam đã sống sẵn (vẽ bằng code); cần thêm lõi trắng (L2) và độ dày dao động.

## 5. Asset hiện có
Flipbook `fx_light_pillar` [4]. Vật: `fxp_lumina_ring`, `fxp_lumina_spear`, `fxp_sun_disc`, `fxp_moon_lantern`, `fxp_mini_lantern`, `fxp_rainbow`; sprite `fxs_star`. Hạt: `light_*`, `star_*`. Môi trường: `fx_env_sunbeams` [3], `fx_env_glow`.
**Thiếu:** flipbook nở sao 6 khung (khác `fx_pow_star` dùng chung 17 skill).

## 6. Hiện trạng (audit)
| Skill | Bậc | Cờ | Hướng |
|---|---|---|---|
| `skill_qt_lumina` | T3/T3 | STATIC_HERO, NO_AFTERMATH, FEW_LAYERS, DURATION_UNDER | vòng xoay + tia, tụ 350, lấp lánh dư âm |
| `skill_e_rune_beam` | T3/**T1** | IMPACT_UNDER_TIER, NO_AFTERMATH, DURATION_UNDER | đã thêm stop medium + punch 1,04 + rung 4 (2026-11-05); còn: giữ tia lâu hơn |
| `skill_qt_ray` | T2/T1 | — | thêm stop medium |
Ánh sáng là hệ **ngắn và nhẹ tay** nhất (TB 800 ms) — cần pha tụ và dư âm, không cần rung.
Phản ứng `reaction_purify`: hạt sáng bay lên + tan đốm tối.

## 7. Cấm
Chớp trắng gắt toàn màn (dùng vàng ấm, alpha thấp); rung mạnh; hạt sáng rơi nhanh; dùng màu Bóng tối / Umbraflux trong skill hỗ trợ (style guide §2).
