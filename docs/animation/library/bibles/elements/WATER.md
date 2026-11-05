# Bible hệ NƯỚC (WATER)

Mở rộng `animation_style_guide.md` §3 (dòng Nước) theo `STANDARDS.md`. Motif liên quan: [ice](../motifs/ice.md) (băng thuộc hệ Nước trong game), steam (phản ứng Hơi Nước). Màu lấy từ `battle_fx.json → elements.WATER` (`color #3fb2ff`, `glow #d8f4ff`, `ring #9ad8ff`), không đặt màu mới ở đây.

## 1. Tính cách
Nước **nặng, có quán tính, chảy, không bao giờ đứng yên**. Đọc được khi bỏ màu nhờ: đường cong tròn, viền bọt trắng, giọt tròn rơi theo trọng lực, **vỡ thành vòng** khi chạm. Khác Bóng tối (cũng loang) ở chỗ: nước có điểm sáng phản chiếu và rơi xuống; bóng tối nhớt, co lại, không phản chiếu.

## 2. Vật lý & chuyển động
| Yếu tố | Quy tắc | Cách làm bằng act |
|---|---|---|
| Khối lượng | nặng: dâng chậm, đổ nhanh | `ease` in-out khi dâng; phần đổ dùng gia tốc (`inQuad` / `fall`) |
| Đường đi | cung tròn, vồng lên rồi rơi | `prop path: throw` + `arc` 40–70; sóng `sweep` phải kèm biến hình (§4) |
| Hình thành | gom từ dưới lên / từ giọt nhỏ thành khối | `burst drop_rise` hút vào + `strip fx_splash under` ở chân + vật `grow/rise` |
| Va chạm | vỡ thành **vòng** + giọt bắn **theo parabol** + bọt | `strip fx_splash`, `burst drop_spray` / `drop_ring`, `burst bubble_spray` |
| Dư âm | vũng, giọt rơi lác đác, gợn, hơi ẩm | `decal puddle` (500–1500 ms), `burst drop_fall` chậm, `ribbon` mảnh |
| Mục tiêu | bị nhấc / đẩy **theo hướng nước**, ướt | `move lift` + `knock`, `glow` xanh nhạt 1 nhịp, status `wet` |

## 3. Nhịp mẫu (x1)
- **Đạn nước (T1–T2)**: chuẩn bị 250–350 · tụ 150 (bong bóng phồng) · bay 350–450 · va chạm 80 + hit-stop light/medium · dư âm 400–600 (giọt + vũng).
- **Sóng diện rộng (T3)**: chuẩn bị 300–420 · **dâng 300** · cuộn / tiến 400 · **đổ sập 120** + hit-stop heavy, lệch nhịp 90 ms mỗi mục tiêu · dư âm 500–700.
- **Ultimate (T4)**: cut-in + tối màn → triệu hồi vật lớn từ biển (dâng có bọt) → nhiều nhịp va chạm, nhịp cuối mạnh nhất → mưa giọt + vũng toàn sân → outro trả màn.

## 4. Hình chủ đạo phải "sống" (STANDARDS §2) — cách làm cho Nước
1. **Biến hình**: sóng / vòi nước cần flipbook ≥ 6 khung (dâng → cuộn → đổ → vỡ) **hoặc** ảnh hiện có + displacement gợn (đang thử ở P2, decision 049 §6). Bong bóng: phồng / méo nhẹ (squash theo vận tốc), vỡ = `fx_splash` + `bubble_pop`.
2. **Phụ sinh từ vật**: `prop … trail: {ref: drop_spray, every: 50–80}` — giọt **rơi khỏi** đỉnh sóng / thân bong bóng trong lúc bay.
3. **Theo vận tốc**: `stretch: true` khi bay nhanh, `squashOnHit: true` khi chạm.

## 5. Asset hiện có (dùng lại trước khi vẽ mới)
- Flipbook: `fx_splash` (4 khung, đang dùng ở 5 skill + status), `fx_ice_encase`, `fx_ice_shatter` (motif ice).
- Vật: `fxp_wave_crest`, `fxp_bubble_big`, `fxp_trident`, `fxp_whale`, `fxp_rain_cloud`, `fxp_octo_tentacle`; sprite `fxs_bubble`, `fxs_drop`.
- Hạt: `water_splash`, `water_bubbles`, `water_trail`, họ `drop_*` và `bubble_*` (pop / rise / fall / spray / trail / big / ring).
**Thiếu (đề xuất cho P2, ghi `ASSET_TODO.md` khi làm):** flipbook sóng 8 khung (dâng → đổ → vỡ); flipbook cột nước / vòi phun 6–8 khung; flipbook bong bóng vỡ riêng (khác `fx_splash`).

## 6. Hiện trạng (`npm run anim:audit`, 2026-11-05)
| Skill | Bậc cần / có | Hình chủ đạo | Cờ | Hướng nâng cấp |
|---|---|---|---|---|
| `skill_nh_tsunami` Sóng Thần Cổ | T2 / T3 | `fxp_wave_crest` tĩnh (`STATIC_SHAPE` 0,891) | STATIC_HERO, STATIC_SHARE, DURATION_OVER | sóng dâng → cuộn → đổ (flipbook 8 khung **hoặc** displacement), giọt rơi khỏi đỉnh; **pilot P2** |
| `skill_ult_trident` Đinh Ba Hải Vương | T4 / T4 | `fxp_trident` tĩnh (0,993) | STATIC_HERO, STATIC_SHARE, FEW_LAYERS | đinh ba **hình thành** từ cột nước xoắn (ribbon / flipbook), cắm xuống → cột nước bùng; thêm lớp L2 |
| `skill_nh_bubble` Bong Bóng Nước | T2 / T2 | `fxp_bubble_big` tĩnh | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | bong bóng phồng có squash, giọt rơi khi bay, vỡ riêng; `decal puddle` |
| `skill_e_bubble` Phun Bọt (quái) | T2 / T1 | `fxs_bubble` tĩnh | STATIC_HERO, STATIC_SHARE, NO_AFTERMATH | chùm bọt nhỏ nhiều kích cỡ, bay lệch nhịp, vỡ lần lượt |
| `skill_cl_freeze` Đóng Băng (class) | T1 / T2 | `fxs_snowflake` tĩnh | STATIC_HERO, NO_AFTERMATH | xem [ice](../motifs/ice.md) |
| `skill_e_frost_breath` Hơi Thở Băng (quái) | T2 / T0 | `fx_ice_encase` 4 khung | IMPACT_UNDER_TIER, NO_AFTERMATH | xem [ice](../motifs/ice.md); thêm hit-stop medium |
Status `wet` (dính: giọt + lắc; loop: giọt rơi + vũng; hết: splash + bọt) — đạt 3 pha; giữ. Phản ứng `reaction_steam`: hiện chỉ có khói trắng + âm lửa → nên có hơi bốc **xoắn lên** + tiếng xì (motif steam, làm khi viết bible Lửa).

## 7. Cấm
- Sóng / nước là **một ảnh trượt ngang** không đổi hình (đúng lỗi hiện tại).
- Giọt bay **lên** sau va chạm như tàn lửa (nước rơi xuống, trừ hơi nước).
- Va chạm nổ tia sắc / chữ thập (đó là Kim / Sấm); băng vỡ mảnh tròn (băng vỡ mảnh sắc — motif ice).
- Tối màn quá 20% cho skill không phải ultimate; xanh lẫn với Hư Không (`#8c7cff`): giữ xanh dương / trắng bọt.
- Hình dáng gợi sinh vật / vũ khí đặc trưng của một IP cụ thể (decision 048): đinh ba, cá voi, xúc tu ở dạng chung chung, viền nâu ấm kiểu Sobi.

## 8. REF
- [REF-WATER-WAVE-001](../../refs/REF-WATER-WAVE-001.json) — sóng diện rộng dâng / cuộn / đổ.
- [REF-WATER-BUBBLE-001](../../refs/REF-WATER-BUBBLE-001.json) — đạn bong bóng.
- [REF-ICE-ENCASE-001](../../refs/REF-ICE-ENCASE-001.json) — băng bọc mục tiêu (motif ice).
