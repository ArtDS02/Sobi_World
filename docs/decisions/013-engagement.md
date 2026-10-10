# 013 — Gắn kết: World Level, Bond, đơn hàng, mục tiêu, Codex (GĐ6)

**Ngày:** 2026-10-10 · **Trạng thái:** Đang làm (số liệu chờ chủ dự án duyệt sau bước 9)

## Bối cảnh
GĐ6 biến Farm + Garden thành vòng lặp có mục tiêu liên tục (spec V2 §6, §7, §9, §13; GAME_BALANCE §3, §7, §8). Phần lớn "gắn kết" của
Sobi Farm (đơn hàng heo, thưởng ngày, thành tựu, trang trí) đã có trong Farm; GĐ6 đưa chúng lên mức thế giới và thêm Bond, mục đích nuôi,
Codex nhiều loại, chợ theo ngày, NPC và hướng dẫn.

## Lựa chọn
### World Level (bước 4, đã làm)
- **Một Sobi World Level** theo decision 007: XP lưu theo Area (`progression.areas.<id>.xp`), World XP = tổng; level từ bảng chung
  `content/shared/progression.json` (`worldLevel`, 20 cấp, bước từ cấp n lên n+1 = `100 × n^1,5` làm tròn, GAME_BALANCE §7).
  Mục "level riêng từng Area" của spec V2 và bảng 10 cấp riêng của Farm / Garden **bỏ**; hook `AreaModule.level` bỏ.
- **Điều kiện mở Area** dùng `unlock: { worldLevel, worldDevelopment }`: Garden cấp 3, Aquarium cấp 6, Cloud cấp 8 + WD 15, Adventure cấp 8 + WD 20
  (spec ghi theo level từng Area; quy về World Level theo 007). **World Development = world level + Codex / 10 + công trình Lv3** (số hạng "tổng level các Area" thành level chung).
- Farm nhìn `player.xp` = World XP (lens), nên mọi cổng cấp của Farm (ô chuồng, giống heo, trang trí) dùng cùng một level; phần XP Farm kiếm được ghi vào mục `sobi_farm`.
- **Hệ quả cân bằng:** bảng mới dốc hơn bảng cũ của Farm (cấp 3: 383 KN thay 250; cấp 10: 11.106 thay 5.700). Rà lại ở bước 9.

(Các mục sau được ghi khi làm xong từng bước.)
