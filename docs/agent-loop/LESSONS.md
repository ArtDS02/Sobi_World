# Bài học vòng lặp nhiều agent

Nguồn: vòng lặp `forest-diorama` (2026-11-19, nhánh `map-diorama-forest`, 23 commit `237df342` → `9673bd33`), `docs/agent-loop/forest-diorama/STATE.md`, `docs/maps/diorama/SCORES.md`, `docs/research/ADVENTURE_MAP_VFX_LESSONS.md` §16, quy trình 134 skill (`docs/SKILL_ANIMATION_STANDARD.md` §2), transcript phiên Chỉ đạo (số token đọc từ thông báo hoàn thành của từng agent con).

Dùng file này khi sửa skill `.claude/skills/agent-loop/`. Mỗi bài học mới thêm vào cuối, kèm bằng chứng.

## 0. Số liệu forest-diorama

| Mục | Số |
|---|---|
| Thời gian | ~22 giờ (10:09 → 00:49), 6 map + hạ tầng |
| Agent con | 56 lượt (51 lượt mở + 44 SendMessage), ~5,3 triệu token |
| coder (sonnet) | 150–280k token / lượt, 18–50 phút; nặng nhất M3c 249k / 51 phút |
| checker (haiku) | 12–30k / lượt, 3–8 phút |
| reviewer (sonnet) | mở mới 73–90k; **dùng lại qua nhiều map tăng dần 110k → 172k → 230k** |
| Chỉ đạo (opus) | 530 lượt trả lời, ngữ cảnh đỉnh ~433k, nén 1 lần; 167 lệnh Bash, 13 lần tự mở ảnh |
| Đạt ở vòng 1 | 3 / 6 map (heart, hollow, marsh); edge cần 3 vòng (6,5 → 7,5 → 9,0, vòng 3 phải nâng opus); deep, falls 2 vòng |

## 1. Cái gì hiệu quả

1. **Sổ STATE trên đĩa, ghi trước và sau mỗi lần giao việc.** Sau sự cố mất phiên, việc tiếp tục chỉ cần STATE + git; không lần nào phải làm lại bước đã xong. *Bằng chứng:* `forest-diorama/STATE.md` (mục "Xong" ghi hash từng bước), AGENT_LOOP §5.
2. **Checker rẻ, dừng ở lỗi đầu tiên, so với "đỏ sẵn".** 12–30k token mỗi lượt, không lần nào báo nhầm lỗi cũ là lỗi mới sau khi M1 làm sạch baseline. *Bằng chứng:* commit `56c5b9a9` (sửa hết đỏ sẵn trước khi làm việc chính), AGENT_LOOP §6.
3. **Làm sạch đỏ sẵn trước tiên (M1).** Mọi vòng sau so được "xanh / đỏ" tuyệt đối thay vì so danh sách. *Bằng chứng:* `56c5b9a9`, check xanh 2127 → 2183.
4. **Reviewer độc lập, chỉ nhìn ảnh, chấm theo thước 5×2.** Bắt được lỗi coder bỏ qua: thiếu vật mốc / cao nguyên (edge v1 6,5), vật mốc < 1/8 khung, "ngày giống Bìa Rừng", khối tối mép cứng. *Bằng chứng:* `SCORES.md`, LESSONS §16 bài 4, `71133f28`, `c8e26c1b`, `399be540`.
5. **Pilot trước, nhân rộng sau với mốc "không thấp hơn pilot".** Bìa Rừng đạt 9,0 rồi làm mẫu cho 5 map sau; 3 / 5 map sau đạt ngay vòng 1. Giống cách 134 skill đã nhân rộng. *Bằng chứng:* `ecdb7eba` → `28a5b489`, `85c27eb9`, `629642f7`.
6. **Brief mẫu có tham số** ("Brief mẫu M4 — thay <map>, <mục C n>"): mỗi map chỉ đổi 2 chỗ, brief ổn định. *Bằng chứng:* STATE mục "Brief mẫu M4".
7. **Lỗi chung sửa một lần ở cấp vùng, kiểm hồi quy bằng ảnh map đã đạt** (đêm quá tối, bóng cầu, gió tán rìa). *Bằng chứng:* `28a5b489` ("zone-wide moonlit floor, deck shadow, edge wind"), LESSONS §16 bài 6.
8. **Commit sau mỗi bước xanh, message có điểm review.** Đọc `git log` là biết lịch sử điểm. *Bằng chứng:* `ad5060ff` (review 7.0) → `77df8fba` (review 8.0).
9. **Test hồi quy cho lỗi tìm thấy khi chơi thử**, chứng minh đỏ khi bỏ bản sửa. *Bằng chứng:* `9673bd33`, `tests/unit/adventure.test.ts:154` (`iq` trong `combatantSchema`).

## 2. Cái gì tốn token hoặc phải làm lại

1. **Dùng lại reviewer qua nhiều map.** Ảnh các map trước nằm mãi trong ngữ cảnh: 73k → 110k → 172k → 230k cho cùng một reviewer (deep → heart → hollow). Reviewer mới cho mỗi map chỉ tốn ~75–90k. → *Luật:* reviewer **mới cho mỗi đơn vị việc** (map, lô skill); chỉ dùng lại trong cùng đơn vị (vòng 2 của cùng map).
2. **Dùng lại coder sang vòng sửa cũng phình** (Rừng Sâu v2 271k, Thác Rêu v2 279k), nhưng vẫn rẻ hơn coder mới phải đọc lại code. → Giữ luật "tiếp tục coder", nhưng **không dùng coder của đơn vị này cho đơn vị sau**.
3. **Ngữ cảnh Chỉ đạo phình tới ~433k** (530 lượt, 167 lệnh Bash, 13 lần tự mở ảnh, brief viết lại toàn văn mỗi lần). Đây là phần đắt nhất vì mỗi lượt đọc lại cả ngữ cảnh. → Chỉ đạo **không mở ảnh** (việc của reviewer), không chạy lệnh dò trạng thái lặt vặt, brief lặp lại dùng mẫu trong STATE.
4. **Edge vòng 1 bị chấm khi chưa dựng đủ hợp đồng** (6,5): vật mốc / cao nguyên được đẩy sang "TODO(M4)" nhưng reviewer vẫn chấm theo hợp đồng đầy đủ. Mất 1 vòng chụp + chấm. → Coder phải **tự đánh dấu từng mục PHẢI THẤY** (đã dựng / chưa) trong báo cáo; Chỉ đạo chỉ gọi reviewer khi mọi mục đã dựng.
5. **Màu ngày "giống Bìa Rừng"** lặp lại ở hollow, falls (2 lần). Hợp đồng chỉ ghi chỉnh tương đối ("ấm −0,02, bão hòa +0,05"), không có đích đo được. → Hợp đồng ghi **tiêu chí đo được** (tông chủ đạo, % khung của vật mốc, số vật phải thấy ở điểm duyệt nào).
6. **E2E treo 2,6 giờ** trong lượt "Checker e2e baseline" (176 phút, `garden:73`). → Mọi lệnh dài có **timeout cứng** trong brief; checker chạy e2e ở nền với giới hạn.
7. **Brief viết lại dài mỗi vòng** (2–5,6k ký tự / lượt, 51 lượt). → Mẫu brief cố định trong skill, Chỉ đạo chỉ điền ô.

## 3. Lỗi lặp lại

| Lỗi | Lần | Bằng chứng | Cách chặn trong skill |
|---|---|---|---|
| Quên `npm run typecheck` trước khi Chỉ đạo tự commit sửa test | 2 | STATE dòng cuối; `76b4b687` (sửa sót tham số timeout) | Bước commit luôn chạy checker (hoặc ít nhất typecheck), kể cả khi Chỉ đạo tự sửa |
| Đo FPS sai máy (headless `--gpu` = GPU tích hợp, không phải RTX) | 1 lớn, kéo theo số G0 sai | LESSONS §16 bài 1, `567dd0fb` | Brief đo hiệu năng ghi rõ `ANIM_GPU=high/low`, báo cáo phải in tên adapter |
| Junction `node_modules` vào worktree tạm → xóa mất `node_modules` thật | 1 | STATE "Bài học sự cố" | Cấm junction / symlink; worktree dùng `npm ci` riêng |
| Báo cáo agent mất (handback lần 2 bị từ chối) | 1 | STATE "Bài học sự cố" | Agent ghi kết quả số đo vào file trên đĩa (đường dẫn trong brief), không chỉ trong tin nhắn |
| Checker đổi đường dẫn sai (`--base .../admin.html` lặp) | 1 | transcript, lượt "Checker M3a gate + FPS" (4 lần gửi lại) | Lệnh chụp / đo viết sẵn nguyên văn trong mẫu brief, checker không tự ghép |
| Bóng tròn đen, khối mép cứng, vật bị cắt mép khung | ≥ 4 map | `SCORES.md` cột "Còn yếu" | Đưa vào danh sách "KHÔNG ĐƯỢC" mặc định của mẫu design |
| Coder dùng chung thư mục ảnh chụp với vòng trước → reviewer xem ảnh cũ | rủi ro, phải ghi rõ "chụp sau lần sửa cuối" | SKILL_ANIMATION_STANDARD §2.4.1 | Mỗi vòng một thư mục `…/<đơn vị>/v<n>/` |

## 4. Review lệch

- Chấm map v1 khi phần lớn hợp đồng ở "TODO" → điểm thấp không phản ánh chất lượng phần đã làm (edge v1). Xem §2.4.
- Thước chỉ có khung tĩnh làm tiêu chí "Sống" khó chấm; gió phải chứng minh bằng số (khác biệt ¼ khung giữa hai khung, tắt ≈ 0,2–0,9, bật ≥ 2,5). *Bằng chứng:* LESSONS §16 bài 5. → Mỗi tiêu chí chuyển động cần **một phép đo** hoặc **dải khung liên tiếp**, không chỉ ảnh đơn.
- Ngưỡng map (> 7,5) khác skill (≥ 7). → Ngưỡng ghi trong design.md của từng việc, reviewer không tự nhớ.

## 5. Vòng sửa kéo dài

- Edge: 3 vòng, vòng 3 phải nâng coder lên opus mới đạt (7,5 → 9,0). Hai vòng sonnet đều sửa đúng danh sách lỗi nhưng thiếu "đọc được" (cổng chặn, gió thấy được). → Vòng 3 nâng opus là đúng; **lỗi thẩm mỹ lặp lại 2 vòng = dấu hiệu phải nâng model sớm**, không đợi hết vòng.
- Map sau pilot: tối đa 2 vòng. Danh sách lỗi reviewer đánh số ưu tiên → brief vòng sửa chép thẳng danh sách → hiệu quả.

## 6. Thử nghiệm skill `/agent-loop` (bước 2.4)

Việc thật: `skill-audit-tool` (2026-11-20, `ed3c5905`, sổ `docs/agent-loop/skill-audit-tool/STATE.md`) — script `npm run skill:audit` kiểm kê 134 skill chiến đấu theo hệ / vai trò / bậc + điểm SCORES, phục vụ audit bước 3.1. Đường đi: P → R → C → K → M → T (bỏ D, V: không có phần nhìn thấy).

| Bước | Agent · model | Token | Thời gian | Kết quả |
|---|---|---|---|---|
| R | Explore · sonnet | 80k | 1,3′ | research.md 40 dòng, chỉ ra `expectedTier` dùng lại được, 134/134 skill có điểm |
| C | coder · sonnet | 44k | 2,8′ | lib + CLI + 7 test, tự kiểm xanh, 1 vòng |
| K | checker · haiku | 16k | 3,5′ | XANH 2190/2190, `--json` hợp lệ |

Hiệu quả: brief từ mẫu + research ngắn ⇒ coder đọc ít, 1 vòng xong (44k so với 150–280k của coder map). Chỉ đạo chốt luật phân vai ngay trong brief (không cần designer opus cho việc logic nhỏ).

Lỗi lộ ra, đã sửa trong skill:
1. **Coder báo "đã ghi report.md" nhưng file không có** (checker phải tự tạo thư mục). → SKILL §2 luật 6: Chỉ đạo `ls` file báo cáo sau mỗi hand-back, thiếu thì tự dán; `coder.md`: ghi bằng Write rồi `ls`.
2. **Hợp đồng ✅ cho cờ `--json` chưa từng chạy.** → luật 6b: ✅ nghĩa là đã chạy / đã thấy; mục chưa chạy chuyển thành lệnh trong brief checker (checker đã bắt: chạy `--json` thật).
3. **Giờ trong STATE do Chỉ đạo ước đoán** (ghi 01:18–01:40, thật 00:58–01:07). → luật 12: giờ lấy từ `date`, token / phút lấy từ thông báo hoàn thành.
4. Explore không có công cụ Write; lần này tự ghi qua Bash được, nhưng không bảo đảm. → bảng bước R ghi rõ, kiểm file.

Chưa kiểm bằng lần chạy này: designer (D), reviewer (V), vòng sửa (F), nâng opus, resume §6 — đã kiểm ở forest-diorama (cùng luật, nay viết thành mẫu); lô skill chiến đấu ở bước 3 sẽ là lần chạy đủ bước đầu tiên.
