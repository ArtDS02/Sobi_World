# Acceptance Checklist — animation puppet (decision 050)

Mỗi mục kiểm được: **[T]** = test tự động (`tests/unit/animationRig.test.ts`, `battlePerf.test.ts`), **[L]** = xem ở Admin "Xưởng rig sinh vật" (`#/rig-lab`, ×0,25, Hiện xương, Dải 8 khung), **[B]** = xem ở "Xưởng animation trận" / trận thật, **[O]** = chủ dự án chấm.

Trạng thái 2026-11-06: 4 prototype + 18 chiến binh skin (R2b); ban đầu 2026-11-05 cho 4 prototype (`pig_boar`, `pig_turtle`, `fish_betta`, `octopus`): ✅ đạt · 🟡 đạt trên bản rig-proof, chờ art · ⬜ chưa kiểm.

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
| A10 | Không còn cảm giác "ảnh tĩnh di chuyển": xem dải 8 khung attack — chân / đầu / thân ở tư thế khác nhau từng khung | [L] | ✅ trên layer vẽ tay (2026-11-06: dải attack Heo Rừng / Cá Betta, `g_slam` Heo Rùa, `ultimate` Bạch Tuộc); ⬜ chủ dự án chấm |
| A11 | Chuyển trạng thái mượt: idle → attack → hurt → idle trong trận, không giật | [B] | 🟡 (đã chạy trong Xưởng trận; chưa playtest trận thật) |
| A12 | Tỉ lệ & nét vẽ đạt chuẩn Sobi Farm | [O] + [T] | 🟡 skin (2026-11-06): ở tư thế nghỉ trùng ảnh đã duyệt (test `skins`); chờ chủ dự án chấm lúc chuyển động |
| A13 | Skin không rách: khớp giãn mềm, không xén thẳng ở tai / vây / đầu | [L] + `rig:snap` | ✅ attack, g_roar, move, ko, g_slam, ultimate của 3 chiến binh; 🟡 tuyệt kỹ bạch tuộc (xúc tu giơ cao) còn giãn nhẹ |

## B. Skill animation
| # | Tiêu chí | Cách kiểm | Trạng thái |
|---|---|---|---|
| B1 | Thân người dùng có chuẩn bị riêng cho cast (khác đánh thường) | [L] cast vs attack | ✅ |
| B2 | Ba lớp tách: thân (clip) – VFX (`battle_fx.json`) – phản ứng mục tiêu (clip `hurt` của mục tiêu) | [B] | ✅ |
| B3 | VFX neo vào bộ phận thật (đầu / mắt của puppet) | [B] anchor `head` | ✅ |
| B4 | Skill khác nhau có tư thế thân khác nhau: mỗi skill của dòng máu prototype ra clip cử chỉ riêng (`g_*` / `ultimate`), không rơi về `cast` | [T] `battlePerf.test.ts` + [L] "Cử chỉ skill" | ✅ 4 rig × dòng máu của nó (16 skill + 4 tuyệt kỹ) |
| B5 | Ultimate có khoảnh khắc thân riêng (clip `ultimate`, có gom lực dài – bung – hồi) | [T] + [L] | ✅ clip; ⬜ flipbook khoảnh khắc |
| B6 | Cử chỉ khớp nhịp: release của clip trùng release của beat | [B] | ✅ `skill_mm_poison_thorn` / Heo Rừng: beat 860 ms ↔ clip 462 ms (mốc 460) |
| B7 | VFX phát từ bộ phận thật (spot `mouth`, `tail`) | [B] | ✅ neo miệng theo đầu; ⬜ mới chuyển 1 skill (`skill_dm_ink`) |
| B8 | Chủ dự án chấm cảm giác skill thí điểm | [O] | ⬜ |

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
| D4 | Script: `rig:parts`, `rig:fmt`, `rig:guide`, `rig:batch`, `rig:cut` | ✅ |
| D5 | Màn kiểm tra trực quan (Xưởng rig) | ✅ |
| D6 | Đổi nguồn art không đổi code / clip | ✅ cắt rời → skin: cùng id xương / clip; chỉ đo lại khớp và nhân hệ số biên độ (`skinRigs.py`) |
