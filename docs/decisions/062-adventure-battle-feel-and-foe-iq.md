# 062 — Adventure: cảm giác trận đấu và trí thông minh của quái

Ngày: 2026-11-18. Nguồn: góp ý của chủ dự án sau khi chơi thử.

## Quyết định
1. **Trong trận không hiện nút điều hướng chung** (Ra Sảnh, Vật phẩm, Menu). Chúng quay lại khi trận kết thúc.
2. **Thanh lượt đứng yên**: rộng cố định (`36rem`), chỉ các ô bên trong trượt khi đến lượt mới; bỏ việc thu nhỏ cả thanh khi một đòn đang chạy.
3. **HUD đội (combat animal) to hơn**: ảnh 3.4rem, tên 1.02rem, thanh máu 1.2rem, khung dock 23rem.
4. **Quái "suy nghĩ" 2–3 s trước khi ra đòn** (`pacing.think` trong `content/adventure/battle_fx.json`, chọn ngẫu nhiên có seed theo từng lượt, ×0.55 khi x2). Đây là thời gian trình diễn, nằm ngoài `stepMax`; ba chấm hiện trên đầu quái trong lúc chờ. Lượt mất vì choáng / đóng băng không chờ. Logic trận không đổi.
5. **Trí thông minh của quái** (`iq` 0..1 trong `content/adventure/enemies.json`, mặc định 0.5):
   - `Combatant.iq` không có = AI cũ (Auto của người chơi, bot cân bằng, save cũ) — không đổi hành vi.
   - Thấp: nhắm mục tiêu nhiễu, không nhận ra đòn kết liễu, coi nhẹ kỹ năng phụ (hồi máu, khiên, giải trạng thái, buff), đôi khi chọn bừa.
   - Cao (≥ 0.6): tập trung hỏa lực vào kẻ yếu máu và kẻ biết hồi máu, dùng khống chế lên mục tiêu nguy hiểm nhất, buff đúng lúc, bày thế cho đồng đội phản ứng nguyên tố (đặt trạng thái mà một phản ứng cần khi đồng đội có sẵn chiêu hợp nguyên tố), chọn trong nhóm tùy chọn tốt nhất hẹp hơn.
   - Giá trị: Rừng 0.15 (elite 0.3, boss 0.4); Núi 0.4 (0.5 / 0.6); Di tích 0.5 (0.6 / 0.7); Biển 0.75 (0.85 / 0.95). Di tích hạ từ 0.6/0.7/0.8 xuống 0.5/0.6/0.7 để `phase11` (balance guard decision 037, thắng ≥ 70% ở cấp 22 đồ epic) vẫn qua (đo được 75%).

## Hệ quả
- Cân bằng: map đầu dễ hơn, map sau khó hơn; cần chủ dự án chơi thử Núi / Biển. Chỉnh `iq` ở `enemies.json`.
- Save: không cần migration (`iq` tùy chọn trên `Combatant`).
