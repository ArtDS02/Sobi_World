# Bible hành động: CẬN CHIẾN & BỊ ĐÁNH (melee, hit)

Đánh thường (`actions.attack`) và mọi skill lao vào mục tiêu; phản ứng khi trúng đòn (`actions.hit`, `heavy`, `crit`, `miss`, `ko`). Đây là animation người chơi **thấy nhiều nhất** — ưu tiên cảm giác lực hơn độ hoành tráng. Nhịp mặc định: `deliveries.melee` = release 220 · impact 330 · end 620 ms.

## 1. Người ra đòn — Prep → Execution → Impact → Recovery
| Giai đoạn | Chuyển động | Act gợi ý |
|---|---|---|
| Prep 150–220 | lùi nhẹ + **nén người** (squash 0,9), mắt / thân hướng mục tiêu | `move recoil x 15–25`, `move squash scale 0.9`, `pose attack` |
| Execution 100–140 | **lao** có kéo giãn theo hướng (stretch), ảnh mờ kéo theo 1–2 khung (smear) | `move dash`, `trail dur 120–160` |
| Impact | dừng **cùng lúc** với hit-stop (người đánh và mục tiêu cùng đứng — engine đứng cả sân) | `stop` theo bậc, `strip $boom` / va chạm của hệ, `burst`, `shake` có `dir` theo hướng đòn |
| Recovery 250–350 | bật ngược nhẹ khỏi mục tiêu, về chỗ **trượt quá rồi lắng** (lò xo) | `move tilt`, `move` về (engine `settle`) |
Quy tắc: Prep **chậm hơn** Execution ít nhất 1,5× (nhịp có trọng âm, STANDARDS §1). Không lao thẳng đều tốc.

## 2. Mục tiêu bị trúng (theo bậc, STANDARDS §6)
| Tình huống | Phản ứng | Act |
|---|---|---|
| Trúng thường (T1–T2) | pose `hurt` 1 nhịp, bật lùi **theo hướng đòn** 10–18 px, lò xo về | `move knock x 10–18`, `glow` trắng 1 khung |
| Trúng mạnh / `heavy` (T3) | bật + nhấc, flash, nảy | hiện có: `stop 120`, `punch 1.04`, `flash 0.25`, `bounce` — giữ |
| Chí mạng `crit` | như heavy + tách màu + chớp đỏ + rung có hướng | hiện có (`split`, `flash #ff5a3a`, `shake 6`) — giữ |
| Né `miss` | ngả người tránh, vệt gió, chữ "Trượt" | hiện có (`rear`, `trail`, `fx_wind_swirl`) — giữ |
| Hạ gục `ko` | bật mạnh → ngồi phịch / nằm nghiêng mệt (không gợi chết, style guide §2) | theo `actions.ko` |
Hạt va chạm lấy **theo hệ của đòn** (`$spark`, `$boom`), không dùng chung một loại cho mọi hệ.

## 3. Hiện trạng & đề xuất (đọc `battle_fx.json`, 2026-11-05)
- `actions.attack`: đủ Prep (recoil + squash) → dash + trail → `$boom` + `stop medium` + `shake 3 dir` → tilt. **Đạt khuôn**; chỉ còn thiếu dư âm nhỏ (bụi ở chân mục tiêu) — ưu tiên thấp.
- `actions.hit`: chỉ `burst drop_spray` + âm thanh → hạt **giọt nước cho mọi hệ** (lửa, đất… cũng bắn giọt). Đề xuất: đổi sang `$spark` (hạt theo hệ của đòn, engine điền lúc chạy) — sửa dữ liệu, rủi ro thấp. Phản ứng thân (knock / lò xo) đã nằm trong `battlePose.ts`, không cần act.
- `heavy`, `crit`, `miss`: đạt; giữ.

## 4. Mẫu kiểm (đạt khi)
Capture `attack`: khung `release-50` thấy người đánh nén / lùi; khung `impact` thấy smear hoặc vệt; `impact+80` mục tiêu lệch khỏi chỗ đứng theo hướng đòn; `end` mọi thứ về chỗ. Không cờ `NO_PREPARATION`.
