# SESSION 2 — Developer (Fix)

Bạn sửa animation theo `FEEDBACK.md` của vòng hiện tại. Bạn **không tự quyết xong**: "xong" = tiêu chí đạt của từng ID sẽ được Tester chụp lại và TD xác nhận. Bạn không sửa harness (`scripts/anim-review/`) — hỏng thì ghi vào FIX_REPORT cho Tester.

## 0. Khởi động
1. Đọc `CLAUDE.md`, `docs/AGENT_RULES.md`, `docs/PROGRESS.md` (đầu), `docs/animation-review/README.md`.
2. Đọc `STATE.json`. Chỉ tiếp tục nếu `phase == needs_fix`, `blocked == false`. Khác → dừng.
3. Đọc **chỉ** `STATE.review.feedbackFile` (không đọc lại baseline cũ, trừ khi một mục trỏ tới) và `docs/decisions/042`, `044`, `docs/animation/COMBAT_ART_GUIDE.md`.
4. **Đọc lại file ngay trước khi sửa** — số dòng trong feedback có thể lệch; tìm theo `file::hàm`.
5. Đọc phần của `ANIMATION_QUALITY_RUBRIC.md` ứng với nhóm bạn sửa (MUST-HAVE §4, trọng số §3, thông số §5): "xong" nghĩa là đạt các điều đó, không chỉ hết lỗi được nêu.
6. Mở ảnh bằng chứng của mục đang sửa (đường dẫn trong feedback) để hiểu lỗi nhìn ra sao, đừng chỉ đọc mô tả.

## 1. Cách làm
- Làm theo thứ tự trong feedback; **gộp theo nguyên nhân gốc**, sửa gốc trước (vd bug `circleOf` trước khi tinh chỉnh từng cast).
- Giữ ràng buộc (README feedback + CLAUDE.md): logic thời gian thuần ở `ui/battle*.ts` có test; Phaser chỉ phát cue ở `scene/battle/*`; khai báo bằng `content/adventure/battle_fx.json` + schema `content/schemas/adventure/battle*.ts`; chuỗi ở `src/i18n/`; asset qua id→manifest; `reduce` vẫn đúng; không đổi logic trận/save; `src/core` thuần.
- Mỗi lỗi sửa kèm **test** nếu là logic thuần (thứ tự cue, thời lượng, hit-stop…). Hành vi nhìn thấy thì dựa vào tiêu chí đạt của mục.
- Cần xem tận mắt khi sửa: dùng Admin "Xưởng animation trận" (`npm run admin` → `#/battle-lab`) **hoặc** `npm run anim:capture -- --only <caseId>` để tự chụp thử (kết quả này chỉ để bạn xem, **không** thay run chính thức của Tester).
- Mục nghĩ là sai/không nên làm: không im lặng bỏ qua — ghi `wontfix`/`disagree` kèm lý do vào FIX_REPORT để TD quyết.
- Cần asset mới: ghi `docs/ASSET_TODO.md`, dùng placeholder; tên/đặc điểm gốc, không gợi IP (AGENT_RULES §9).
- Không "dọn" ngoài phạm vi các ID giao. Ghi lỗi phát hiện thêm vào mục "Phát hiện thêm" của FIX_REPORT (TD sẽ cấp ID).
- Làm xong từng cụm: `npm run check` xanh. Cuối cùng chạy lại. Commit chỉ khi chủ dự án yêu cầu; nếu không commit, vẫn phải ghi băm file (bước 2 §2) để Tester thấy thay đổi.

## 2. Đầu ra: `rounds/round-NN/FIX_REPORT.md`
1. Bảng theo ID: `fixed | partial | wontfix | disagree`, mô tả ≤ 3 dòng, **cách bạn tự kiểm** (lệnh, case, mốc).
2. Danh sách **file đã đổi + SHA-1 sau khi sửa** (`git hash-object <file>`) → `STATE.fix.changedFiles`.
3. Hành vi khác nhìn thấy được mà Tester nên chụp thêm (case nên đưa vào `affected`).
4. Phát hiện thêm; rủi ro; điều chủ dự án cần kiểm.
5. Kết quả `npm run check`.

Cập nhật `STATE.json`: `fix={reportFile, changedFiles, targetsRunId: <run TD đã review>}`, `phase="needs_capture"`.

## 3. Xong khi
- [ ] Mọi ID `open` được xử lý (fixed/partial/wontfix/disagree có lý do).
- [ ] `npm run check` xanh (nói rõ nếu có test đã sẵn đỏ từ trước và bằng chứng).
- [ ] FIX_REPORT có băm file; STATE cập nhật; không sửa harness/feedback.

Báo cáo cuối theo AGENT_RULES §7; in prompt Tester vòng kế từ `PROMPTS.md`.
