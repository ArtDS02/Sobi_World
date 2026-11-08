# Prompt: triển khai nâng cấp Admin qua đêm (dán vào session mới)

Cách dùng: mở session mới trong thư mục dự án, chọn chế độ quyền tự động (không hỏi) trong ứng dụng, rồi dán phần trong khung dưới đây.

---

Bạn là agent triển khai một mình, chạy xuyên đêm, không có người ngồi cạnh. Chủ dự án đã cho phép bạn tự quyết mọi việc và KHÔNG muốn bị hỏi hay hiện popup xin duyệt.

## Việc cần làm
Thực hiện toàn bộ `docs/ADMIN_UPGRADE_PLAN.md` (9 bước, theo đúng thứ tự trong file). Các quyết định đã được chủ dự án duyệt nằm ở đầu file đó, đừng bàn lại.

## Bắt đầu
1. Đọc `docs/AGENT_RULES.md`, `docs/PROGRESS.md`, rồi `docs/ADMIN_UPGRADE_PLAN.md`. Chỉ đọc thêm tài liệu khác khi bước đang làm cần.
2. `git status`: đang có các sửa layout admin chưa commit (battleLab.ts, battleLab.css, main.ts, admin.css, docs). Tạo nhánh `admin-upgrade` từ nhánh hiện tại, chạy `npm run check`, commit gói này riêng với thông điệp mô tả (đây là "bước 0": layout 3 khung, sidebar nhóm, scrollbar chìm, chống giật ở 2 chỗ).
3. Chạy `npx vitest run` một lần trên nhánh sạch, ghi lại những test đang fail sẵn (đã thấy 8 fail: `assetsCheck` x6, `phase11` balance guard, `simulation` 30-day timing) vào `docs/ADMIN_UPGRADE_LOG.md` để không đổ lỗi nhầm. Test chạy theo thời gian có thể fail do máy bận: chạy lại riêng file đó trước khi kết luận.

## Cách làm việc tự chủ
- KHÔNG dùng công cụ hỏi người dùng (AskUserQuestion) và không dừng chờ trả lời. Gặp chỗ mơ hồ: chọn phương án thận trọng, an toàn cho dữ liệu, phù hợp với quy tắc dự án, rồi ghi quyết định + lý do vào `docs/ADMIN_UPGRADE_LOG.md`.
- Một bước kẹt (lỗi không sửa được sau nỗ lực hợp lý, thiếu thứ không thể tự có): ghi rõ vào log (nguyên nhân, đã thử gì, còn lại gì), bỏ qua phần đó, làm tiếp bước kế. Không treo cả đêm vì một mục.
- Dùng danh sách việc (update_plan) và checklist trong `ADMIN_UPGRADE_PLAN.md` làm nguồn tiến độ: tick `[x]` trong cùng commit hoàn thành mục đó. Sau mỗi bước cập nhật `docs/PROGRESS.md` ngắn gọn. Khi ngữ cảnh bị tóm tắt, đọc lại 2 file này (plan + log) để biết đang ở đâu rồi làm tiếp.
- Mỗi bước (hoặc mỗi area ở bước 8): `npm run check` xanh rồi commit riêng, thông điệp rõ. Không gộp nhiều bước vào một commit. Chạy lệnh dài (`npm run check`, vitest) ở chế độ nền và đợi thông báo, không poll.
- Kiểm chứng bằng việc thật: với thay đổi nhìn thấy được, mở admin bằng `preview_start` (tên `admin` trong `.claude/launch.json`), đọc console/request lỗi, thử thao tác, chụp màn hình khi cần. Không báo "xong" nếu chưa kiểm. Với lỗi giao diện/giật, đo bằng script, không đoán.
- Dùng subagent khi việc rộng và độc lập (ví dụ kiểm kê file nội dung, quét giao diện); nhận kết quả rồi tự kiểm lại trước khi tin.

## Ràng buộc bắt buộc (từ CLAUDE.md và AGENT_RULES)
- `src/core/` thuần: không DOM/Node, không `Date.now()`/`Math.random()`, `now`/`rng` inject. Chuỗi hiển thị trong game ở `src/i18n/`; chuỗi của dashboard (dev tool) để trong `tools/admin/` như hiện nay. Comment code bằng tiếng Anh. File LF.
- Tiền chỉ đổi qua helper ghi Transaction. Không có HTTP server/mạng trong bản ship (admin API chỉ chạy dev, không đưa vào bản desktop). Lỗi ghi file không được nuốt.
- Không làm mất hay đổi save của người chơi. Bước 1 (tắt âm) chỉ áp cho save MỚI.
- Bản quyền (decision 048): mọi tên/hình/mô tả mới phải gốc.
- Gameplay trước, art sau (decision 017): không làm art mới, dùng placeholder và ghi `docs/ASSET_TODO.md` nếu cần.
- `npm run guard` phải xanh khi kết thúc.

## Giới hạn an toàn (không được làm, dù đã được cho phép tự quyết)
- Không `git push`, không tạo PR, không merge vào `main`, không đổi/xóa tag, không `git reset --hard`, `git clean`, `checkout --` trên thay đổi chưa commit, không force. Chỉ commit trên nhánh `admin-upgrade`.
- Không xóa hay ghi đè file ngoài thư mục dự án; không đụng `%APPDATA%\SobiWorld` (save thật) và thư mục `asset/`, `docs/archive/`.
- Không cài gói mới nếu không thật sự cần; nếu cần, ghi lý do vào log và kiểm giấy phép. Không gọi dịch vụ ngoài mạng, không gửi dữ liệu ra ngoài.
- Không chỉnh cấu hình quyền/hook/settings của Claude Code.
- Không sửa test cho xanh bằng cách nới điều kiện hay xóa assert. Chỉ đổi test khi hành vi đúng đã đổi theo yêu cầu (ví dụ mặc định âm thanh) và nói rõ trong commit.

## Khi kết thúc (hoặc khi hết khả năng làm tiếp)
1. `npm run check` và `npm run guard` chạy lần cuối; ghi kết quả thật, kể cả phần còn fail.
2. Cập nhật `docs/ADMIN_UPGRADE_PLAN.md` (mục nào xong, mục nào bỏ dở vì sao), `docs/ADMIN_UPGRADE_LOG.md`, `docs/PROGRESS.md`.
3. Viết báo cáo theo mẫu AGENT_RULES §7 bằng tiếng Việt: đã làm, chưa làm, lỗi đã sửa (nguyên nhân + cách sửa), quyết định tự chọn, rủi ro, cách kiểm tra lại, danh sách commit.
4. Dừng ở đó. Không push, không merge.

Trả lời và viết tài liệu bằng tiếng Việt.

---

## Ghi chú cho chủ dự án (không dán)
- Quyền: chương trình hỏi popup là do chế độ quyền của session, prompt không tắt được. Hãy bật chế độ tự chấp nhận/bỏ qua quyền của session trước khi dán, và giữ máy không ngủ (bật keep-awake trong cài đặt app).
- Nếu muốn giới hạn rủi ro hơn: chạy session trong worktree riêng, nhánh `admin-upgrade` sẽ không động tới thư mục đang dùng.
- Sáng hôm sau: đọc `docs/ADMIN_UPGRADE_LOG.md` trước, rồi `git log admin-upgrade`.
