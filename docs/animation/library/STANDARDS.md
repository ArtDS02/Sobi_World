# STANDARDS — Chuẩn animation & VFX trận Sobi Adventure

Decision 049. Bổ sung cho rubric (`docs/animation-review/ANIMATION_QUALITY_RUBRIC.md`) và style guide (`docs/animation/animation_style_guide.md`); mâu thuẫn thì hai tài liệu đó thắng. Số liệu là **đề xuất ban đầu**, chỉnh qua playtest; mỗi lần đổi ghi vào §8.
Các ngưỡng tự kiểm được nằm trong `scripts/anim-review/lib/scriptAudit.ts` (`npm run anim:audit`); đổi số ở đây thì đổi cả ở đó.

## 1. Bảy giai đoạn (chọn giai đoạn hợp với hành động, không bắt buộc đủ)
| Giai đoạn | Mục đích | Act điển hình | % thời lượng |
|---|---|---|---|
| Preparation | báo ai sắp làm gì | `pose cast/attack`, `move cast_coil/recoil`, `glow`, vòng phép | 15–25 |
| Startup | tụ lực, hiệu ứng **hình thành** | `burst` hút vào, `strip` hình thành, `prop rise/grow`, `tint` | 10–20 |
| Execution | giải phóng | `move dash/lunge`, `pose attack`, `trail` (smear) | 5–10, nhanh |
| Travel | đường đi | `prop throw/fly` + `trail`, `beam`, `ribbon`, `tether` | 10–25 |
| Impact | va chạm | `stop`, `flash`, `shake`, `punch`, `strip` va chạm, `burst` bung ra, mục tiêu `move knock/lift` | 5–10 + hit-stop |
| Aftermath | dư âm | `decal`, hạt rơi / tan, `ribbon` nhỏ, khói | 15–25 |
| Recovery | trả về idle | `move` lò xo về chỗ, `pose idle` | 10–15 |
Khuôn theo loại: **cận chiến** Prep → Exec → Impact → Recovery · **phóng đạn** Prep → Startup → Exec (giật lùi) → Travel → Impact → Aftermath · **buff / hồi** Prep → Startup → Exec (bùng **lên**) → Aftermath (aura) · **diện rộng / ultimate** đủ 7, Impact lệch nhịp theo mục tiêu (`stagger`).

## 2. Ba dấu hiệu "sống" của hình chủ đạo
Hình chủ đạo = vật lớn nhất xuất hiện trước va chạm (định nghĩa giống `anim:audit`). Phải có **ít nhất 2/3**:
1. **Biến hình nội tại**: flipbook ≥ 6 khung, hoặc vẽ bằng code biến dạng (`ribbon`, `beam`, `cone`), hoặc shader biến dạng (displacement — đang thử ở P2). Silhouette đầu và cuối pha khác rõ.
2. **Chuyển động phụ sinh ra từ chính vật**: hạt rơi / bay ra *từ* vật trong lúc nó di chuyển (`prop … trail: {ref, every}`), không chỉ ở điểm va chạm.
3. **Biến dạng theo vận tốc**: kéo giãn theo hướng bay (`stretch`), bẹp khi chạm (`squashOnHit`), nghiêng theo đường cong.
Một `prop` chỉ có tween vị trí / scale / xoay + `pulse` / `bobY` = **0/3** (cờ `STATIC_HERO`).

## 3. Năm lớp
| Lớp | Nội dung | Act |
|---|---|---|
| L0 màn | tối / tint nền, vignette, letterbox, cut-in | `tint`, `vignette`, `letterbox`, `cutin` |
| L1 thân | hình chủ đạo | `prop`, `strip`, `ribbon`, `beam`, `cone`, `tether` |
| L2 lõi / vệt | lõi sáng, quầng, vệt | `glow`, `trail`, `marker` |
| L3 hạt & vết | hạt, mảnh, vết trên đất | `burst`, `decal` |
| L4 phản hồi | hit-stop, rung, chớp, zoom | `stop`, `shake`, `flash`, `punch`, `split`, `slowmo` |
Tối thiểu: T0 → 2 lớp · T1–T2 → 3 · T3 → 4 · ultimate → 5 (+ hiệu ứng môi trường theo rubric).

## 4. Bậc lực T0–T4 (ngăn "rung mọi đòn")
Bậc cần suy từ `power` của skill: 0 → T0 · < 0,9 → T1 · < 1,4 → T2 · ≥ 1,4 → T3 · ultimate → T4.
| Bậc | `stop` (tier → ms, `screenFx.ts`) | `shake` amount | `flash` alpha | `punch` zoom | `tint` màn |
|---|---|---|---|---|---|
| T0 hỗ trợ | — | 0 | ≤ 0,15 (màu ấm, không trắng) | — | ≤ 0,1 |
| T1 nhẹ | light (50) | 0–2 | — | — | — |
| T2 thường | medium (80) | 3–4 | ≤ 0,25 | — | — |
| T3 mạnh | heavy (120) | 5–6 | ≤ 0,35 | 1,02–1,04 | ≤ 0,2 |
| T4 ultimate | ultimate (220), có thể nhiều nhịp | 7–12 | ≤ 0,5, ≤ 2 chớp mạnh/giây | 1,04–1,08 | ≤ 0,5 |
Lệch ≥ 2 bậc → cờ `IMPACT_UNDER_TIER` / `IMPACT_OVER_TIER`. Đòn nhiều nhịp: nhịp cuối mạnh nhất (1-2-…-**BỤP**).

## 5. Ngân sách thời gian (tốc độ x1)
| Loại | Tổng | Lấy đà (sau vòng phép) | Hit-stop |
|---|---|---|---|
| Đánh thường | 600–900 | 120–200 | 50–80 |
| Skill T1–T2 | 900–1500 | 200–350 | 50–80 |
| Skill T3 | 1300–2000 | 300–450 | 80–120 |
| Ultimate | 2500–4500 (bỏ qua được) | ≥ 600 kèm cut-in | 120–220 |
| Buff / hồi | 700–1400 | 150–250 | 0 |
| Status: dính / mỗi nhịp loop / hết | 400–700 / ≤ 400 / 300–500 | | 0 (đóng băng vỡ: ≤ 60) |
Ở x2 (`pacing.fast` = 0,55): giữ tỉ lệ pha; hit-stop không dưới 40 ms.

## 6. Mục tiêu bị trúng (mọi skill gây sát thương)
Phản ứng **theo hướng đòn** và **theo bậc**: T1 giật nhẹ (`move shake`) · T2 bật lùi (`knock` x 10–18) · T3 bật + nhấc (`lift` + `knock`) · T4 bật mạnh + nảy + pose `hurt`. Nhiều mục tiêu: lệch nhịp `stagger` 60–120 ms. Không để mục tiêu đứng yên khi bị trúng.

## 7. Checklist trước khi gửi review
- [ ] Hình chủ đạo đạt ≥ 2/3 dấu hiệu §2 (`anim:audit` không có `STATIC_HERO`; capture không có `STATIC_SHAPE`).
- [ ] Đủ giai đoạn theo khuôn §1; có hình thành **và** tan biến (không bật ra / mất đi trong 1 khung).
- [ ] Đủ lớp §3; bậc lực đúng §4; thời lượng trong §5.
- [ ] Mục tiêu phản ứng theo §6.
- [ ] Đọc được khi bỏ màu (C4): hình khối và hướng chuyển động riêng của hệ (bible).
- [ ] Không che thanh máu / số quá 1 khung; không chớp trắng toàn màn > 100 ms; "Giảm chuyển động" vẫn đọc được.
- [ ] Asset mới đi qua manifest, `assets:check`, IP audit; tên gốc.

## 8. Nhật ký
- 2026-11-05: bản đầu (decision 049), từ nghiên cứu + audit P0.
