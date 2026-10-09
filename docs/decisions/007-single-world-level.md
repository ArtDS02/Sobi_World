# 007 — Một Sobi World Level chung; tên tiền Sobi Coin

**Ngày:** 2026-10-09 · **Trạng thái:** Đã chốt (chủ dự án duyệt)

## Lựa chọn
- Toàn thế giới dùng **một Sobi World Level**. Mọi Area cộng World EXP vào cùng một thanh XP; level này mở khóa nội dung toàn Sobi World
  (theo Cloud spec §IV và Lore §5). Mục "Level riêng từng Area" trong SPEC V2 §6 được thay bằng quyết định này; điều kiện mở Area dùng World Level.
- XP vẫn lưu theo Area (`progression.areas.<id>.xp`); World EXP là tổng. Triển khai ở GĐ6, GĐ1 không đổi code. Level Farm hiện có (10 cấp) tạm là Farm level cho tới lúc đó.
- "Sobi Coin" và "Coin" là cùng một đơn vị tiền chung; dùng tên nào tiện cho giao diện. Id kỹ thuật: `coins`.
