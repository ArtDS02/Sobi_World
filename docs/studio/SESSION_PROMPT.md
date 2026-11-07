# Prompt cho session triển khai Sobi Studio

Dán nguyên khối dưới đây vào session mới. Dùng được cho **mọi** session sau: prompt tự đọc `docs/studio/STATUS.md` để
làm tiếp từ chỗ dừng.

```
Triển khai Sobi Studio (decision 051) cho Sobi World: dùng Unity offline tạo lại TOÀN BỘ asset và animation của game
(chuyển động của asset lẫn skill). Chủ dự án đã giao toàn quyền: KHÔNG hỏi lại, tự quyết mọi việc, ghi lựa chọn vào
docs/PROGRESS.md; chỉ gửi kết quả cho chủ dự án duyệt, không chờ trả lời. Chủ dự án không có kinh nghiệm làm art /
animation, chỉ hỗ trợ được việc cài đặt.

ĐỌC TRƯỚC, theo thứ tự: HANDOFF.md → CLAUDE.md → docs/AGENT_RULES.md → docs/PROGRESS.md (các mục đầu) →
docs/UNITY_STUDIO_PLAN.md (toàn bộ; bắt buộc §3, §6, §7, §10, §12) → docs/decisions/051-unity-studio.md.
Nếu đã có docs/studio/STATUS.md: đọc để biết đang ở giai đoạn nào và LÀM TIẾP từ đó, không làm lại.

BƯỚC 0 — kiểm trạng thái:
- Phải đứng ở nhánh phase-14-unity-studio (sai thì git switch). `git status`, `git log --oneline -3`.
- `npm run check`. Test chỉ lỗi vì quá thời gian (assetsCheck, phase11, breeding, simulation) thì chạy riêng file đó
  để phân biệt với lỗi thật; ghi kết quả vào PROGRESS. Ngày 2026-11-07 máy chậm tới mức 12 test này lỗi cả trên code
  chưa sửa (`npm run assets:check` một mình mất 37 s). Nếu vẫn vậy: tìm nguyên nhân trước (CPU bận, Defender quét thư
  mục tạm…). Không tìm ra thì được commit khi mọi test khác xanh và các test đó chạy riêng chỉ lỗi vì quá thời gian.
  Khi đó ghi rõ trong commit message và PROGRESS; không tự nâng timeout của test.
- Tìm Unity.exe (C:\Program Files\Unity\Hub\Editor\*\Editor\Unity.exe). Chưa có thì đưa chủ dự án các bước ở plan §5
  và chờ: đây là việc DUY NHẤT được phép chờ chủ dự án. Nếu batchmode báo thiếu license, hoặc báo project đang mở trong
  Editor, thì nhờ chủ dự án kích hoạt Personal / đóng Editor.

LÀM: U0 → U10 theo plan §6, thay theo Area trọn gói (§10.3). Mỗi giai đoạn:
1. Làm thử 1–2 asset → tự kiểm theo §4.7 → làm cả nhóm.
2. Nhập vào game (giữ nguyên id manifest) → `npm run assets:check` → `npm run check` xanh.
3. Commit: mỗi batch một commit, chỉ `git add` đúng đường dẫn của mình. Sau mỗi giai đoạn push nhánh
   phase-14-unity-studio lên origin để sao lưu. KHÔNG merge vào main, KHÔNG force-push, KHÔNG xoá / sửa tag.
4. Cập nhật docs/PROGRESS.md, docs/studio/STATUS.md (bảng giai đoạn / Area / số asset: chưa làm / đã render / đã nhập),
   HANDOFF.md.
5. Gửi chủ dự án ảnh so sánh TRONG GAME (bản mới cạnh bản cũ) + báo cáo tiếng Việt theo AGENT_RULES §7 (đã kiểm gì,
   kiểm bằng cách nào, chưa kiểm gì). Không chờ trả lời, làm tiếp giai đoạn sau.

LUẬT BẮT BUỘC:
- Cổng U1 (§7, §10.1): tự chấm TRUNG THỰC 4 mẫu cạnh bản cũ trong game. Không trả lời "có" được cho cả 3 câu sau 2 vòng
  chỉnh thì DỪNG hướng "tạo lại tất cả" và báo kèm ảnh. Không che kết quả xấu để đi tiếp.
- §12 (dễ sửa / cập nhật / mở rộng) là luật, không phải gợi ý: style một nguồn (studio/Style/style.json), recipe kế
  thừa template, schema + kiểm trong `npm run check`, build theo hash (`--changed`), docs/studio/RECIPE_GUIDE.md +
  STYLE_BIBLE.md, trang Admin "Xưởng asset". Sửa một asset = sửa một file văn bản + chạy một lệnh.
- Unity không đi kèm game: không có code Unity trong src/, game không biết Studio tồn tại. Không mạng / server trong bản
  ship. Không đổi logic gameplay / save. Nếu runtime rig / FX cần nhận thêm định dạng thì tự quyết, nhưng phải có test
  và ghi vào PROGRESS (thay đổi lớn thì ghi decision mới).
- Bản quyền (decision 048, AGENT_RULES §9): mọi hình dựng từ đầu bằng code; không dùng model / texture / VFX / shader từ
  Asset Store hay nguồn ngoài; chỉ dùng package chính thức của Unity. Rà docs/IP_AUDIT_PROMPT.md cuối mỗi Area. Ghi
  Unity vào docs/THIRD_PARTY.md.
- Không vẽ chữ vào ảnh. Chữ hiển thị đi qua src/i18n/.
- Mọi chuyển động và asset phải soi ở độ phân giải đầy đủ, đặt cạnh mẫu / bản cũ trước khi báo xong. Không báo "đạt" khi
  chưa nhìn.
- Ngân sách bộ nhớ (§4.5): sinh vật trận dùng rig (không dùng khung); khung render ở cỡ hiển thị.
- `npm run check` xanh trước mỗi commit. File LF. Comment code tiếng Anh. Trả lời tiếng Việt.
- Kiểm trong game: preview qua .claude/launch.json (sandbox-anim cổng 5190, Admin cổng 5175: Xưởng rig, Xưởng trận).
  Pane ẩn thì xem cách đo ở HANDOFF §6. Không git stash khi server admin đang chạy.
- Phiên dài: trước khi hết ngữ cảnh, ghi STATUS.md + HANDOFF.md đủ để phiên sau làm tiếp bằng CHÍNH prompt này.

KẾT THÚC khi xong U10 (manifest không còn ảnh cũ / placeholder trong phạm vi, IP audit sạch, `npm run check` xanh):
báo cáo tổng, kèm danh sách việc chủ dự án cần xem trong game.
```
