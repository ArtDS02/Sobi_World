---
name: spec-to-source
description: >-
  Implement a project incrementally from a written spec with minimal tokens and
  minimal chat: one task per session, verify gate, short state file for resuming.
  Use for "implement/continue phase X", "build from spec", resuming from
  PROJECT_STATUS.md, or checking source against the project's structure rules.
---

# Spec → Source

**Conversation is not the workspace. Files and code are the workspace.**
DO THE WORK, DON'T TALK ABOUT THE WORK.

Ưu tiên: 1 đúng spec → 2 xong task → 3 verify → 4 tiết kiệm token → 5 code sạch → 6 giải thích.
Phải chọn giữa thêm 500 token giải thích và làm thêm việc → làm việc.

## 1. Giao tiếp

- Trước khi làm: tối đa 1 message, ≤3 dòng (task · file/spec · blocker). Thường bỏ luôn, làm ngay.
- Trong khi làm: im lặng. Không "Tôi sẽ…/Bây giờ…/Tiếp theo…", không nhắc lại yêu cầu, không tóm tắt spec,
  không giải thích code, không báo từng bước, không dán nội dung file/log vào chat.
- Chỉ nhắn giữa chừng khi: chuyển phase, gặp blocker, hoặc xong một milestone thật.
- Kết thúc: CHỈ một trong hai khối dưới, không thêm gì.

```text
DONE
- <đã làm gì>
- <verification: lệnh + kết quả, vd "check xanh, 148 test">
- <còn gì, nếu có>

NEXT: <task tiếp theo>
```
```text
BLOCKED
- <vấn đề>
- <vì sao không tự xử lý được>

NEED: <chính xác thông tin cần từ user>
```

## 2. Khi nào được hỏi

Gặp vấn đề: suy luận → kiểm code/spec → tự xử lý → làm tiếp.
Quyết định nhỏ / spec chưa nói → chọn phương án đơn giản nhất, ghi 1 dòng vào `DECISIONS.md`, làm tiếp.
Chỉ BLOCKED khi: spec tự mâu thuẫn mà `DECISIONS.md` chưa chốt, cần quyết định sản phẩm/kiến trúc spec
không xác định được, hoặc golden value/test bắt buộc fail mà nghi spec sai. Không hỏi "để xác nhận".

## 3. Khởi động (mọi session)

1. `PROJECT_STATUS.md` — nếu chưa có: đây là session đầu, task = phase đầu tiên.
2. Adapter dự án: [references/projects/README.md](references/projects/README.md) → `projects/<x>/index.md`.
3. Định nghĩa task (adapter chỉ chỗ) — đọc **đúng block** của task, không đọc cả file.
4. `DECISIONS.md` (chỉ khi task chạm vùng có quyết định), rồi **chỉ** các dòng spec task chỉ định.
5. Code hiện có của vùng sắp sửa — chỉ file sẽ đụng.

Nếu status ghi `IN_PROGRESS` hoặc có `wip` commit: `git status --short; git diff --stat`, chạy check.
Tiếp tục từ việc chưa xong đầu tiên, **không chờ xác nhận**. Nền đỏ → sửa xanh hoặc revert phần dở trước.
Chỉ BLOCKED nếu không suy ra được đang dở gì.

## 4. Vòng làm việc (1 task = 1 session)

1. Code + test cùng lúc. Grep tái sử dụng trước khi tạo hàm/component mới.
2. Check của adapter xanh, gồm test cũ. Không nới tolerance/golden value. Test đỏ = code sai.
3. `git diff --stat`: file ngoài phạm vi → revert (tự làm, không giải thích trong chat).
4. Commit `feat(<id>): …`; cập nhật state (§5); commit `docs(<id>): status`; `git tag <id>`.
5. Báo DONE. **Dừng** — không tự sang task sau.

## 5. State — `PROJECT_STATUS.md` (≤30 dòng, chỉ kết luận)

```text
Current phase: <id — tên>      Status: IN_PROGRESS | DONE | BLOCKED
Current task: <việc cụ thể>
Completed: <id, id, … — tag cuối>
In progress: <file/hàm đang dở, hoặc "-">
Known issues: <ngắn, hoặc "-">
Important decisions: <chỉ quyết định mới chưa có trong DECISIONS.md, hoặc "-">
Next task: <cụ thể tới mức đọc xong code được ngay: file + hàm + việc>
```

Không tạo file handover/nhật ký/tóm tắt khác. Lịch sử = git log; quyết định = `DECISIONS.md`;
bằng chứng verify = commit message.
Sắp hết usage: không mở việc mới → đưa về trạng thái check xanh (revert phần dở) → ghi state →
commit `wip(<id>): …` → BLOCKED với `NEED: chạy lại sau reset`.
Hook để dành cho task sau: hàm rỗng có comment, ghi `file:hàm` vào state.

## 6. Scope

Chỉ làm đúng task. Không refactor, không tối ưu, không thêm feature, không làm Backlog, không làm lại task
đã DONE, không sửa file ngoài phạm vi. Thấy vấn đề ngoài scope → 1 dòng vào Known issues, đi tiếp.
Sửa sai: hiểu sai spec → sửa + ghi DECISIONS; sai kiến trúc → `git reset --hard <tag trước>` (BLOCKED nếu
mất việc của user); bug cục bộ → sửa + thêm test bắt đúng bug đó.

## 7. Đọc tiết kiệm

- Không đọc lại file đã đọc/vừa sửa trong session; dùng `git diff`. Không đọc file mà state/DECISIONS đã trả lời.
- Spec: đọc theo khoảng dòng (offset/limit), không cả file. Phụ lục viết sẵn: trích bằng `sed`, không gõ lại.
- Output lệnh: `| tail -40`; chạy riêng 1 test file khi debug.
- UI/canvas: kiểm bằng hàm thuần + test; không chụp màn hình trừ khi task bắt buộc.

## 8. Tham chiếu — chỉ đọc khi task cần

| File | Khi |
|---|---|
| [01-spec-audit.md](references/01-spec-audit.md) | Phase audit spec (chỉ khi chưa có `DECISIONS.md`) |
| [02-architecture.md](references/02-architecture.md) | Dựng khung, thêm tầng, không biết đặt file ở đâu |
| [03-naming.md](references/03-naming.md) | Phân vân tên file/module/class |
| [04-styles.md](references/04-styles.md) | Task viết CSS/SCSS — đọc 1 lần ở task UI đầu tiên |
| [06-verification.md](references/06-verification.md) | Phase QA cuối |
| [project-adapter.md](references/project-adapter.md) | Onboard dự án mới |

Guard tự động: [scripts/check-architecture.mjs](scripts/check-architecture.mjs) (adapter khai config, nằm trong check).
