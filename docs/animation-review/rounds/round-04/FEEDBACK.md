# ANIMATION REVIEW — Vòng 04

> round: 4 · Lab run `20261104-184504-755dce5-ff9beea5` (202 case, complete, determinism ✓, canary ✓) · game thật run `20261104-192358-755dce5-59fb28d9` (26 ảnh trận + `battle_ui.json`) · 2026-11-04 · TD
> Số đo: `rounds/round-04/manifest.snapshot.json`, `battle_ui.snapshot.json`. Tiêu chuẩn: rubric v1.1; D-1, D-2 giữ nguyên.

## 0. Phạm vi đã xem
Lab: số đo [Auto] của cả 202 case (ultimate, expire, wet, trùng chữ ký) + các sheet tổng/sheet đã xem ở vòng 1–3. Game thật: ảnh `auto_01` (trận giữa chừng: lửa thiêu, hồi máu, khiên, biểu tượng status kèm số lượt trên plate), `auto_05` (một quái bị hạ, thanh lượt đổi, vòng lượt), `auto_10` (màn "Vượt tầng 1!"), cộng số đo hover/targeting.

## 1. Bảng trạng thái lỗi
| ID | severity | status | tóm tắt |
|---|---|---|---|
| ANIM-129 | — | **fixed** | 12/12 ultimate có `punch`, `flash`, `shake` 7–12, chớp mạnh ≤ 2/giây ([Auto] manifest) |
| ANIM-128 | — | **fixed** | Đo trong game thật: hover `scale` = 1.12 (trước: 1) và viền đổi màu |
| ANIM-054 | — | fixed (sát ngưỡng) | `wet.loop` đổi 5.75% khung (ngưỡng đặt 6%): chấp nhận |
| ANIM-057 | — | **fixed** | Huy hiệu status kèm số lượt trên plate (ảnh `auto_01`, `auto_05`) và biểu tượng trên đầu |
| ANIM-080, 081 (lượt quái, thanh lượt) | — | fixed (một phần) | `auto_01`/`auto_05`: vòng vàng dưới đơn vị đến lượt (cả quái), thanh lượt đổi và hiện số vòng; chưa chụp chuỗi frame hoạt cảnh bắt đầu lượt |
| ANIM-103, 105 | — | fixed (một phần) | quái bị hạ biến mất (`auto_05`), màn kết thúc "Vượt tầng 1!" có thanh kinh nghiệm (`auto_10`) |
| ANIM-123 | minor | open (đã ghi lý do) | hồi máu: lớp hồi máu chung chồng lên hình riêng của từng skill (cần quyết định thiết kế) |
| ANIM-117 | minor | open | vòng phép phân biệt hệ chủ yếu bằng màu |
| ANIM-113 | minor | taste | lấy đà 250–420 ms |
| ANIM-130 | — | needs_evidence (còn lại) | vòng ngắm nhiều mục tiêu (`allEnemies`); chuỗi frame di chuyển map; ultimate xuất hiện trong trận thật chưa gặp ở 14 khung tự động |
| (mọi ID còn lại của baseline) | — | fixed hoặc fixed (một phần) | xem các bảng vòng 1–3 |

Không còn **blocker hay major**.

## 2. Điểm theo rubric (mẫu đã xem; thang 100)
| Nhóm | Điểm | Mục tiêu | Ghi chú |
|---|---|---|---|
| Ultimate | **~74** | ≥ 90 | cấu trúc đủ (intro, ≥ 3 lớp, môi trường, rung, hit-stop, outro, kịch bản riêng + tên chiêu); C2, C5 chờ playtest |
| Skill thường | **~74–76** | ≥ 85 | đa dạng hình theo hệ; nhịp 250–420 ms và 1,5–2,2 s là điểm nghi |
| Status | **~72–77** | ≥ 85 | 3 pha đều có, expire rõ, mỗi status khác hình; loop buff còn tinh tế |
| Targeting (game thật) | **~80** | ≥ 80 | vòng 6rem, bấm 5/5 điểm, hover 1.12 + đổi màu, nhãn hiệu quả; thiếu bằng chứng nhiều mục tiêu |
| Chuyển lượt + HUD (game thật) | **~74** | ≥ 80 | dock trượt, plate gọn, vòng lượt, thanh lượt, số lượt status; C2/C3 chưa thể đo thời gian trượt chính xác |
| Buff / Cast / Khác | **~72–76** | ≥ 80–85 | chưa chấm từng đơn vị |
| Map | chưa chấm | ≥ 80 | chỉ có ảnh tĩnh; C2, C3 cần playtest và chuỗi frame |
Quy tắc chặn §6 #1, #2, #4 không vi phạm ở mẫu đã xem. **Khoảng cách tới mục tiêu nằm ở C2 (nhịp) và C5 (tác động) — rubric §7 yêu cầu chủ dự án xác nhận.**

## 3. Phán quyết
**`awaiting_playtest`.** Mọi mục khách quan (MUST-HAVE, quy tắc chặn, số đo [Auto]) đã đạt ở mẫu đã xem. Điểm nhóm chưa tới mục tiêu vì C2/C5 chưa có người chơi xác nhận; tôi không tự nâng điểm hay chốt `done`. Yêu cầu chơi thử ở `PLAYTEST_REQUEST.md`.
