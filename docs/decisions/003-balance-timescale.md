# 003 — Thang thời gian và bộ số khởi điểm

**Ngày:** 2026-10-04 · **Trạng thái:** Đã chốt (chủ dự án giao agent tự quyết, đã duyệt)

## Tiêu chí của chủ dự án
Tiện cho người chơi; không ức chế vì lặp việc dư thừa; không mất hứng vì giá trị giảm quá nhiều.

## Lựa chọn
Nhịp mục tiêu: **mở game 2–3 lần/ngày là đủ**.

| Thông số | Sobi Farm cũ | Sobi World |
|---|---|---|
| Đói đầy → 0 | ~2 giờ | 12 giờ |
| Sạch đầy → 0 | ~5 giờ | 24 giờ |
| Common đến Adult (xuất chuồng được) | ngắn | 24 giờ |
| Common đến Mature (lai được) | — | 48 giờ |
| Hệ số thời gian lớn theo rarity | — | Common ×1 · Uncommon ×1,25 · Rare ×1,5 · Epic ×2 · Legendary ×2,5 |
| Phân | — | 1 đống / 8 giờ / con (Young trở lên) |
| Máng Lv1 | 20 thức ăn | đủ cho chuồng đầu ăn ~2 ngày; nâng cấp tới 5–7 ngày |
| Giá trị khi bệnh | — | −10%/24 giờ, tối đa −30%; **chữa xong hồi đủ** |
| Thuốc | — | ~8% giá một heo Common |

- Giữ **thang tiền Sobi Farm** (vốn 5.000, heo Common 500, giá ô chuồng, cửa hàng) vì 69 giống heo đã cân bằng theo thang này.
  "Vàng" đổi tên hiển thị thành **Coins**.
- Áp công thức giá Sobi World (rarity × quality × cân nặng × sức khỏe × chợ); hệ số chỉnh ở GĐ2 bằng `npm run sim:economy`.
- Thao tác hàng loạt bắt buộc có: "Dọn cả chuồng", "Tắm cả chuồng", đổ máng bằng chuột.
- Có thức ăn trong máng thì heo không đói → không bệnh vì đói: người chăm đều gần như không gặp rủi ro.

## Lý do
2 giờ/lần ép người chơi canh liên tục. 72 giờ/lứa (spec bản đầu) quá chậm cho cảm giác tiến bộ.
Mức phạt −20%/ngày (mất tới 60%) gây mất hứng; phạt chủ yếu bằng thời gian là đủ.
