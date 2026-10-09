# 009 — Xuất chuồng và công thức giá

**Ngày:** 2026-10-09 · **Trạng thái:** Đã áp dụng ở GĐ2 (việc 5)

## Lựa chọn
- "Bán" heo đổi tên **Xuất chuồng** (giao diện, lịch sử giao dịch); id nội bộ (`sellPig`, `PIG_SOLD`, `PIG_SELL`) giữ nguyên để không đổi save. Xuất chuồng được từ giai đoạn **Adult** (≥ 50% lớn); lai giống vẫn cần **Mature**.
- Giá = `giáGốcGiống × Quality × cânNặng × sứcKhỏe × chợ` (GAME_BALANCE §2.5):
  - Quality từ **tâm trạng trung bình suốt đời** (trung bình đói/sạch/năng lượng, cộng thưởng trang trí): ≥ 90 Hoàn hảo ×3, ≥ 75 Xuất sắc ×2, ≥ 60 Rất tốt ×1,5, ≥ 40 Tốt ×1,2, còn lại Thường ×1.
  - Cân nặng = cân nặng / cân nặng chuẩn của giống (tối đa ×1,1): heo Adult mới 50% mới có 60% cân.
  - Sức khỏe: −10% mỗi 24 giờ đang bệnh, tối đa −30%; khỏi bệnh là hồi đủ.
  - Chợ: 0,9 / 1,0 / 1,2 theo ngày (tỉ lệ 1:2:1, seed theo số ngày nên mọi lần chạy giống nhau).
- **Hệ số rarity của spec (1 / 1,5 / 2,5 / 4 / 7) không nhân thêm**: giá gốc từng giống (`sellGold` theo bậc, ×1 … ×41,7) đã mang bậc hiếm và 69 giống được cân theo thang đó (câu hỏi 6 của audit: giữ). Muốn đổi sang hệ số spec thì chỉnh `sellGold` các bậc.
- "Hạnh phúc" cũ chỉ còn cho điều kiện đơn hàng và hiển thị; không còn nhân vào giá.

## Hệ quả
- Heo chăm tốt có giá cao hơn nhiều so với Sobi Farm (Hoàn hảo ×3 thay vì tối đa ×1,2): `sim:economy` cho PINK lãi 525 / 765 / 2.925 Sobi Coin mỗi 48 giờ (Thường / Tốt / Hoàn hảo). Tốc độ mở chuồng nhanh hơn; cần cân lại khi có Garden (thức ăn tự làm) ở GĐ5.
