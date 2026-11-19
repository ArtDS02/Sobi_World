# Mẫu STATE.md

Chép khối dưới vào `docs/agent-loop/<task>/STATE.md`. Mỗi dòng một ý; báo cáo agent tóm thành **một dòng** trong
"Nhật ký". "Brief đang chạy" phải đủ để giao lại nguyên văn sau sự cố.

```markdown
# STATE — <task> (<một câu mục tiêu>)
Nhánh: <tên>   Commit xanh gần nhất: <hash> (<bước>)
Mốc hiện tại: <P|B|R|D|U<n> <đơn vị>> — <tên>   Vòng: <n>/3   Model coder: sonnet|opus
Đang làm: <agent> — <một dòng> (bắt đầu <giờ>)   | "— (VIỆC XONG)" khi hết
Brief đang chạy: <tên mẫu + các ô đã điền, hoặc chép toàn văn>
Ngưỡng: <thước, ngưỡng> (design.md §<n>)   Pilot: <đơn vị> <điểm>

## Đơn vị
| # | Đơn vị | Trạng thái | Vòng | Điểm | Commit |
|---|---|---|---|---|---|
| U1 | <pilot> | ⏳ / 🔧 / 👁 / ✅ / ⛔ | 0 | — | — |

## Nhật ký (một dòng mỗi báo cáo, mới nhất dưới cùng)
- <giờ> <agent> <đơn vị> v<n>: <kết quả một dòng> (<token>k, <phút>′)

Đỏ sẵn (baseline): <rỗng | danh sách file:dòng>
Lỗi đang mở: <file:dòng — một dòng>
Chờ chủ dự án: <câu hỏi | —>
Ghi chú: <file bẩn không thuộc việc này — KHÔNG commit>
```

Trạng thái đơn vị: ⏳ chưa làm · 🔧 đang code / sửa · 👁 đang chụp / chấm · ✅ đạt + commit · ⛔ dừng, báo chủ dự án.
