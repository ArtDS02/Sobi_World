# STATE — skill-audit-tool (script kiểm kê skill chiến đấu theo hệ / vai trò / bậc + điểm review; chạy thử skill /agent-loop)
Nhánh: map-diorama-forest   Commit xanh gần nhất: (commit này) U1
Mốc hiện tại: T — retro   Vòng: 1/3   Model coder: sonnet
Đang làm: — (VIỆC XONG) | U1 ✅ check xanh 2190/2190, CLI --json hợp lệ
Brief đang chạy: mẫu C (briefs.md) — xem khối "Brief U1" cuối file
Ngưỡng: logic — test đơn vị xanh, `npm run check` xanh   Pilot: — (1 đơn vị)

## Đơn vị
| # | Đơn vị | Trạng thái | Vòng | Điểm | Commit |
|---|---|---|---|---|---|
| U1 | skillAudit (lib + CLI + test) | ✅ | 1 | test 7/7 | (commit này) |

## Nhật ký
- 00:58 Chỉ đạo P: 1 đơn vị, bỏ D (không có phần nhìn thấy, brief giữ kiểm), bỏ V; baseline = check xanh 2183/2183 ở 890c2fcd (chạy 00:52).
- 01:00 Explore (sonnet) R: research.md 40 dòng; tier dùng lại expectedTier (scripts/anim-review/lib/scriptAudit.ts:40); khống chế = statuses kind control; 134/134 skill có điểm SCORES (80k, 1′)
- 01:03 coder (sonnet) U1 v1: lib + CLI + 7 test, tự kiểm xanh, hợp đồng 7/7 ✅ (--json chưa chạy tay); 134 skill, điểm 6,5–8, 9 hệ < 10 skill người chơi
- 01:07 checker (haiku) U1 v1: XANH 2190/2190, --json 7,4 KB hợp lệ, skill:audit exit 0 (16k, 3′5″)
- 01:08 Chỉ đạo: report.md của coder KHÔNG có trên đĩa dù báo đã ghi; giờ trong STATE trước đó là đoán → sửa skill (LESSONS §6)

Đỏ sẵn (baseline): rỗng
Lỗi đang mở: —
Chờ chủ dự án: —
Ghi chú: `package-lock.json` (npm 10.9 bỏ trường libc, không đổi phụ thuộc) — KHÔNG commit.

## Brief U1
(coder sonnet) Viết scripts/audit/skillAuditLib.ts (thuần, không đọc file) + scripts/audit/skillAudit.ts (CLI đọc content + SCORES, in bảng markdown) + tests/scripts/skillAudit.test.ts + lệnh `skill:audit` trong package.json.
Vai chính (ưu tiên trên → dưới): ultimate (type ultimate) > khống chế (effect status thuộc statuses kind 'control' nhắm phe địch) > hỗ trợ (category support) > diện rộng (target allEnemies/randomEnemies/all) > đơn mục tiêu. Bậc = expectedTier. Điểm = dòng cuối có số của id trong SCORES.md, tìm cột theo header "Tự chấm"/"Điểm", ô có thể chứa 2 id.
Đầu ra: bảng theo hệ (FIRE…VOID, SELF, — cho null): tổng, theo type (unique/ultimate/class/enemy), theo vai, theo bậc, điểm min/tb/max; bảng khoảng trống: hệ < --min N (mặc định 10) và ô hệ × vai bằng 0; skill thiếu điểm. --json để xuất JSON.
