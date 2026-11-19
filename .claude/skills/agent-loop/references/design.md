# Mẫu design.md

Designer viết `docs/agent-loop/<task>/design.md` theo khung dưới, tiếng Việt, ≤ ~150 dòng (việc nhiều đơn vị:
≤ 25 dòng mỗi đơn vị, phần chung ở A). Mỗi kiểm có **cách đo**: ảnh ở điểm / mốc nào, % khung, con số, tên test.

```markdown
# <task> — <mục tiêu một câu>

Thước: <file §>, ngưỡng <x>. Mốc chuẩn: <pilot / skill mẫu + đường dẫn ảnh>.
Nguồn: research.md, <decision>, <chuẩn>.

## A. Phần chung
- Kiến trúc / file: <module ở đâu, theo ARCHITECTURE + guard; mỗi file ≤ 300 dòng>.
- Dữ liệu: <content/… + schema; decision cần có trước khi sửa content/>.
- Lệnh chụp / đo (nguyên văn, dùng lại cho mọi đơn vị): `<lệnh> --out <R>`.
- KHÔNG ĐƯỢC (mặc định, mọi đơn vị):
  1. Khối tối / bóng tròn đen mép cứng không có nguồn.
  2. Vật chính bị cắt mép khung ở điểm duyệt.
  3. Che nhân vật / mục tiêu quá ~250 ms (trận) hoặc che đội ở chỗ rậm (map).
  4. Giống hệt đơn vị khác cùng nhóm (màu / hình chủ đạo).
  5. Tên, hình, mô tả gợi IP bên thứ ba (decision 048).

## B. Đơn vị (pilot trước)
### B1. <đơn vị> — <một câu cảm giác>
- Hình chủ đạo / vật mốc: <gì, cỡ ≥ <x> khung, ở đâu>.
- PHẢI THẤY (theo thứ tự thời gian hoặc theo điểm duyệt):
  1. <…> — đo: <ảnh / số>
- KHÔNG ĐƯỢC (thêm riêng): <…>
- Điểm duyệt / mốc chụp: <…>

## C. Nghiệm thu chung (đánh số, reviewer kiểm)
1. <…>

## D. Test
- <test logic mới, test hồi quy> — đỏ khi bỏ phần sửa.

## E. Ngoài phạm vi
## F. Cần chủ dự án quyết
```
