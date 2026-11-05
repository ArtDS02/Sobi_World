# Acceptance Checklist — animation puppet (decision 050)

Mỗi mục kiểm được: **[T]** = test tự động (`tests/unit/animationRig.test.ts`, `battlePerf.test.ts`), **[L]** = xem ở Admin "Xưởng rig sinh vật" (`#/rig-lab`, ×0,25, Hiện xương, Dải 8 khung), **[B]** = xem ở "Xưởng animation trận" / trận thật, **[O]** = chủ dự án chấm.

Trạng thái 2026-11-05 cho 4 prototype (`pig_boar`, `pig_turtle`, `fish_betta`, `octopus`): ✅ đạt · 🟡 đạt trên bản rig-proof, chờ art · ⬜ chưa kiểm.

## A. Character animation
| # | Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|---|
| A1 | Mỗi clip idle / move / attack / cast / hurt / victory chuyển động ≥ 3 bộ phận hoặc dải (idle ≥ 2 + thở + chớp) | [T] | ✅ |
| A2 | Đánh và cast có `windup < release < contact < len` (chuẩn bị → thực hiện → chạm → hồi) | [T] | ✅ |
| A3 | Ở mốc va chạm của beat, clip đang ở đúng mốc `contact` (±1 khung) | [T] warp + [B] | ✅ (beat 330 ms ↔ clip 561/560 ms, đo trong Xưởng trận) |
| A4 | Đổi hành động không nhảy hình: khung đầu của hành động mới cách khung trước < 6 px ở đầu / thân / chân | [T] | ✅ |
| A5 | Tai / bờm / lá / vây trễ theo thân (lò xo): lệch ngược chiều gia tốc, về nghỉ trong < 3 s | [T] | ✅ |
| A6 | Hai con cùng loài không cùng nhịp (thở, chớp lệch) | [T] | ✅ |
| A7 | Idle không lặp máy móc: có fidget chen vào trong 20 s; chớp mắt có nhịp không đều, thỉnh thoảng chớp đôi | [T] | ✅ |
| A8 | Mỗi loài khác tempo / trọng lượng (rùa chậm & nặng nhất, cá nhẹ nhất; chu kỳ đi của rùa dài hơn heo rừng) | [T] | ✅ |
| A9 | Mặt diễn: đánh (mắt giận / nhắm khi chạm), bị đánh (><, miệng run), thắng (^^, cười), KO (xoắn) | [T] có faces + [L] | ✅ |
| A10 | Không còn cảm giác "ảnh tĩnh di chuyển": xem dải 8 khung attack — chân / đầu / thân ở tư thế khác nhau từng khung | [L] | 🟡 |
| A11 | Chuyển trạng thái mượt: idle → attack → hurt → idle trong trận, không giật | [B] | 🟡 (đã chạy trong Xưởng trận; chưa playtest trận thật) |
| A12 | Tỉ lệ & nét vẽ đạt chuẩn Sobi Farm | [O] | ⬜ chờ layer vẽ tay (`art_inbox/rig_*.md`) |

## B. Skill animation
| # | Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|---|
| B1 | Thân người dùng có chuẩn bị riêng cho cast (khác đánh thường) | [L] cast vs attack | ✅ |
| B2 | Ba lớp tách: thân (clip) – VFX (`battle_fx.json`) – phản ứng mục tiêu (clip `hurt` của mục tiêu) | [B] | ✅ |
| B3 | VFX neo vào bộ phận thật (đầu / mắt của puppet) | [B] anchor `head` | ✅ |
| B4 | Skill khác nhau có tư thế thân khác nhau (clip theo skill: `cast_<skill>`) | — | ⬜ R2 (hiện mọi skill dùng `cast` của loài) |
| B5 | Ultimate có khoảnh khắc thân riêng (flipbook hoặc clip `ultimate`) | — | ⬜ R2 |

## C. System architecture
| # | Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|---|
| C1 | Runtime thuần, tất định (cùng id + cùng lời gọi → cùng khung) | [T] | ✅ |
| C2 | Đúng tầng phụ thuộc (`systems/animation` ← `ui/puppet` ← Area) | `npm run guard` | ✅ |
| C3 | Thêm loài = dữ liệu + layer, không sửa engine | `PIPELINE.md` §2 | ✅ (4 rig, không code riêng loài) |
| C4 | Không rig → hành vi cũ nguyên vẹn (ảnh + tween) | [T] toàn bộ test cũ xanh + [B] quái | ✅ |
| C5 | Hit-stop / slow-mo / giảm chuyển động áp cho puppet | [B] | 🟡 giảm chuyển động ✅ (Xưởng trận, Heo Rùa: đứng nghỉ, không dời ở t = 100 / 300 / 500 ms); hit-stop / slow-mo: code có (`BattlePuppets.tick`), chưa đo |
| C6 | Hiệu năng: 6 puppet + VFX ≥ 55 fps trên máy chủ dự án | đo FPS bản desktop | ⬜ |
| C7 | Không WebGL vẫn chạy (dải thành ảnh thẳng) | — | ⬜ chưa thử |

## D. Production pipeline
| # | Tiêu chí | Trạng thái |
|---|---|---|
| D1 | Quy chuẩn asset rõ (`art_inbox/rig_README.md`) | ✅ |
| D2 | Quy chuẩn clip rõ (`PIPELINE.md` §4) | ✅ |
| D3 | Yêu cầu art cụ thể cho 4 prototype + ảnh guide | ✅ |
| D4 | Script: `rig:parts`, `rig:fmt`, `rig:guide` | ✅ |
| D5 | Màn kiểm tra trực quan (Xưởng rig) | ✅ |
| D6 | Layer vẽ tay thay vào không đổi code / clip | ⬜ kiểm khi có layer đầu tiên |
