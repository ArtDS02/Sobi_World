# 004 — Lưới an toàn khi game tắt

**Ngày:** 2026-10-04 · **Trạng thái:** Đã chốt (chủ dự án duyệt)

## Lựa chọn
- Trong lúc **bù offline**, sinh vật có thể bệnh và vào **Nguy kịch**, nhưng **không chết**.
- Khi mở game, màn "Trong lúc bạn vắng nhà" báo ngay; sinh vật nguy kịch được **ân hạn ít nhất 12 giờ thật**
  (tính từ lúc người chơi mở game) trước khi có thể chết.
- Đồng hồ chết 72 giờ vẫn chạy bình thường khi game đang mở (chế độ đang xem và nền).
- Con số 12 giờ nằm trong `content/` balance, chỉnh được qua Admin.

## Lý do
Mở game ra mới thấy con vật đã mất mà chưa từng được cảnh báo là trải nghiệm ức chế nhất của thể loại này.
Luật này giữ ý nghĩa của rủi ro (đã thấy cảnh báo mà bỏ mặc thì mất) mà không trừng phạt người vắng nhà.

## Ghi chú kỹ thuật
`simulate()` vẫn là một công thức chung; chỉ khác tham số "được phép chết" theo chế độ. Test nhất quán so sánh số liệu
(đói, lớn, bệnh), còn mốc chết được test riêng.
