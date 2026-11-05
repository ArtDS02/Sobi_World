# ANIMATION REVIEW — Vòng {NN}

> round: {NN} · runId: {runId} · stamp: {head}/{dirty8} · ngày: {YYYY-MM-DD} · Người review: Technical Director
> Tiêu chuẩn: `ANIMATION_QUALITY_RUBRIC.md` v1.1 · Bằng chứng: `docs/animation-review/capture/CAPTURE_MANIFEST.md` (run trên)
> Đầu vào đã qua cổng: determinism ✓ canary ✓ · Phạm vi chụp: {suite/scope} · Chưa có bằng chứng: {suitesNotBuilt}

## 1. Bảng trạng thái lỗi
| ID | severity | status | since_round | case | tóm tắt |
|---|---|---|---|---|---|
| ANIM-001 | blocker | open | 0 | battle.skill.* | … |

status: `open` · `fixed` (TD xác nhận bằng ảnh) · `regressed` · `not_reproduced` · `wontfix_accepted` · `needs_evidence` · `taste` (chủ dự án quyết)
severity theo rubric §10.2.

## 2. Điểm theo rubric (thang 100, so vòng trước)
### 2.1 Tổng hợp (rubric §9)
| Nhóm | Số đơn vị | Điểm TB | vs vòng trước | Xuất sắc | Tốt | Đạt | Không đạt | Mục tiêu tối thiểu |
|---|---|---|---|---|---|---|---|---|

### 2.2 Từng đơn vị chấm (bảng §8 cho đơn vị bị blocker/major/dưới mục tiêu; còn lại dùng bảng họ §10.7)
#### [Nhóm] – [Đối tượng] – [caseId]
| Tiêu chí | Trọng số | Điểm (0–5) | Bằng chứng ([Hình]/[Auto]/[Code]) | Nhận xét |
|---|---|---|---|---|
| C1 Rõ ràng | | | | |
| C2 Timing | | | | |
| C3 Sống động | | | | |
| C4 Đặc trưng | | | | |
| C5 Tác động | | | | |
| C6 Liền mạch | | | | |
| C7 Kỹ thuật | | | | |
| **Tổng** | 100 | | | |
- MUST-HAVE thiếu: … · Xếp loại: … · Quy tắc chặn vi phạm: …
- Cần làm để lên mức tiếp theo: … (lời dễ hiểu trước, thông số sau)
- Cần chủ dự án xác nhận qua playtest: …

### 2.3 Nhóm chưa có bằng chứng (không chấm)
…

## 3. Việc cần sửa (tối đa 12 mục open)

### ANIM-### — {tên ngắn}
- **severity / status**: major / open
- **Rubric**: nhóm {…} · tiêu chí {C?} · MUST-HAVE {…} · điểm hiện tại → điểm mục tiêu
- **Case & bằng chứng**: `battle.ult.fire` · ô `impact+80ms` · `docs/animation-review/capture/runs/{runId}/sheets/….png`
- **Quan sát**: … (điều nhìn thấy, không suy đoán)
- **Số đo [Auto]**: hit-stop 80 ms · …
- **Nguyên nhân (code)**: `src/areas/adventure/ui/battleMotion.ts::circleOf` …
- **Kỳ vọng**: …
- **Tiêu chí đạt** (Tester chụp lại và TD kiểm được): …
- **Ràng buộc**: giữ `reduce`; không đổi logic trận; …

## 4. needs_evidence (yêu cầu Tester thêm mốc/case)
## 5. Backlog (ngoài 12 mục)
## 6. Hồi quy & nhất quán giữa các case (từ sheet tổng)
## 7. Danh sách cần chủ dự án playtest (rubric §7)
| Đơn vị | Tiêu chí | Câu hỏi cho chủ dự án |
|---|---|---|
## 8. Phán quyết → `needs_fix` | `awaiting_playtest` | `done` | `escalated` + lý do
