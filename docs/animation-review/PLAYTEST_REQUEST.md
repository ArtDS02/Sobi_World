# Yêu cầu chơi thử (playtest) — Animation Sobi Adventure

> Vòng 4, 2026-11-04. AI đã làm hết phần kiểm chứng được bằng ảnh và số đo (MUST-HAVE, quy tắc chặn rubric, số đo [Auto]). Rubric §7 giao **cảm giác khi chơi** (C2 nhịp, C5 tác động) cho bạn xác nhận. Chỉ cần chơi 10–15 phút rồi trả lời các câu dưới; trả lời ngắn cũng được ("ổn", "chậm", "quá tay"...).

## Cách xem nhanh (không cần chạy chiêu cụ thể)
- Cách dễ nhất: mở **Admin → "Xưởng animation trận"** (`npm run admin`, `#/battle-lab`), chọn từng Tuyệt kỹ (loại "Tuyệt kỹ") và bấm Chạy. Hoặc vào Vết Nứt trong game, bật "Tự động" để xem trận thật.
- Cần so sánh hai chiều: chạy ×1 và ×2 (tốc độ).

## Câu hỏi (đánh dấu: ổn / chưa ổn + một dòng lý do)
| # | Đơn vị | Tiêu chí | Câu hỏi |
|---|---|---|---|
| 1 | 12 Tuyệt kỹ | C2 nhịp | Lấy đà 0,3–0,7 s và vòng phép 0,4–1,0 s theo từng chiêu: có cảm giác "dồn lực rồi bùng nổ" hay bị dài/chờ? Chiêu nào lâu nhất cần rút? |
| 2 | 12 Tuyệt kỹ | C5 tác động | Cú trúng (đứng hình 220 ms + zoom nhẹ + chớp + rung) đã **nặng** chưa, hay **quá tay** (chớp/rung nhiều)? Chiêu buff (Quy Sơn, Quang Trụ, Mộc Mẫu) có "đủ tuyệt kỹ" không? |
| 3 | Skill thường | C2, C5 | Lấy đà 250–420 ms và cả skill 1,5–2,2 s: đánh nhiều lượt có thấy **chậm/rề rà** không? Có skill nào thấy ra đòn quá chậm hoặc quá nhanh? |
| 4 | Status | C1 | Bị choáng / đóng băng / độc / bỏng, và lúc hết: nhìn có dễ nhận ra không khi đang đánh? Buff/debuff có phân biệt được bằng hình? |
| 5 | Giảm chuyển động | C1 | Bật "Giảm chuyển động" (reduce): còn biết **ai đánh ai** không (vòng tĩnh dưới người ra đòn và mục tiêu)? |
| 6 | Targeting | C1 | Chọn mục tiêu: vòng ngắm (6rem, nhãn Hiệu quả/Kém) có dễ bấm và dễ hiểu không? có che quá nhiều thân quái? Hover đã đủ rõ? |
| 7 | Chuyển lượt + HUD | C2 | Dock hiện/ẩn mỗi lượt và thanh lượt: có mượt, không làm mất tầm nhìn? Có lúc nào muốn thấy kỹ năng ngay mà dock chưa ra? |
| 8 | Map (đi bộ) | C2, C3 | Đi bộ có mượt, nhún bước hợp tốc độ, dừng và đổi hướng không giật? Đồng đội đi theo có tự nhiên? |

## Sau khi bạn trả lời
Cho tôi biết các mục "chưa ổn". Mỗi mục sẽ thành một ID mới (`ANIM-13x`) với tiêu chí đạt cụ thể rồi vòng sửa tiếp theo. Nếu tất cả "ổn", TD sẽ chốt `done` và ghi các điểm số cuối.

## Chưa có bằng chứng hình (cần bạn lưu ý khi chơi)
Vòng ngắm nhiều mục tiêu (skill đánh cả hàng); Tuyệt kỹ xuất hiện trong trận thật (cut-in trên giao diện thật); chuỗi frame di chuyển map.
