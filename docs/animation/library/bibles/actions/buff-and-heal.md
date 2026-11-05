# Bible hành động: BUFF, HỒI MÁU, KHIÊN (support)

42 skill hỗ trợ (power 0) + action chung `buff`, `heal`, `regen`, `revive`, `guard`. Audit: **25/42 hình chủ đạo tĩnh**, 6 quá ngân sách thời gian, 4 rung màn (IMPACT_OVER_TIER). Khuôn: Prep → Startup → Execution (bùng **lên**) → Aftermath (aura) — **không** có Impact kiểu đòn đánh.

## 1. Ngôn ngữ hình theo loại (rubric MUST-HAVE "mỗi loại buff có ngôn ngữ riêng")
| Loại | Hướng | Hình | Màu | Act |
|---|---|---|---|---|
| Công (atk/matk Up) | lên, sắc | mũi nhọn, tia vút lên | đỏ / cam | `burst buff_arrows`, `move puff_up` |
| Thủ (def/mdef Up, khiên) | bao quanh | vòm, vòng khép kín | xanh / vàng | `strip fx_shield_dome`, layer `orbit ring` |
| Hồi máu | lên **mềm** | dấu cộng tròn, giọt sáng | xanh lá | `burst plus_rise`, `decal ring` |
| Tốc độ / né | ngang | vệt gió, nghiêng người | trắng xanh | `trail`, `move tilt` |
| Hồi sinh | từ trên xuống rồi bật lên | cột sáng, lông vũ | vàng ấm | `strip fx_light_pillar`, `move appear` + `bounce` |
| Khiêu khích | ra ngoài | huy hiệu nảy, sóng âm | đỏ | `prop pop` + `burst note_*` |

## 2. Giai đoạn
| Giai đoạn | Act |
|---|---|
| Prep 150–250: người dùng nhún / hít vào | `move squash`, `pose cast` |
| Startup 150–300: hạt **hút vào** người nhận | `burst …` hút vào |
| Execution 100–200: **bùng lên** + người nhận **phồng / vươn** (phản ứng cơ thể bắt buộc) | `move puff_up 1.06`, `strip` / `burst` đi lên |
| Aftermath 300–600: aura mỏng, icon hiện | `glow` nhẹ, status layer |
Tổng 700–1400 ms (STANDARDS §5). Nhiều người nhận: lệch nhịp 80–120 ms.

## 3. Bậc lực
Buff là **T0**: không `stop`, không `shake`, `flash` ≤ 0,15 màu ấm. Ngoại lệ có sẵn: buff **ultimate** giữ hit-stop (quyết định D-1 của chủ dự án, 2026-11-04). 4 skill bị IMPACT_OVER_TIER (`skill_cl_fortress`, `skill_e_dragon_roar`, `skill_hg_forge_fire`, `skill_tg_bronze_wall`): thay rung bằng `punch` rất nhẹ (≤ 1,02) hoặc bỏ.

## 4. Hình chủ đạo sống
Vật tĩnh của skill hỗ trợ (`fxp_fortress`, `fxp_banner`, `fxp_crosshair`, `fxp_taunt_badge`, `fxp_rain_cloud`, `fxp_bronze_shield`, `fxs_heart`, `fxs_star`…) cần ít nhất: xuất hiện có overshoot (`pop` outBack) + chuyển động phụ lệch pha (cờ bay = `wobble`; mây = mưa `burst` từ mây; khiên = vòng sáng quét qua mặt) + tan biến (không tắt cái rụp).

## 5. Hồi máu lẫn với skill riêng (ANIM-123, còn mở)
Lớp hồi máu chung (`actions.heal`) đang chồng lên hình riêng của skill hồi máu. Quyết định (decision 049 giao): skill có hình hồi riêng thì **bỏ lớp chung** khi skill đã có `plus_*` hoặc `heal_*` trong kịch bản; giữ lớp chung cho hồi từ vật phẩm / regen. Sửa ở P3 (engine: `battleScript.ts`).

## 6. Cấm
Buff rung màn; dùng màu Bóng tối / Umbraflux (style guide §2); hồi máu trông như độc (xem [poison](../motifs/poison.md)); aura dày che sinh vật khi còn hiệu lực.
