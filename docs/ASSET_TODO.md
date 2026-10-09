# ASSET_TODO — art còn thiếu hoặc là bản tạm

`npm run assets:release` chỉ qua khi hết hàng `placeholder`. Art Sobi Farm đã ổn, không đụng tới.

## GĐ3 — Nhân vật và Sảnh
Đã có (cắt từ `asset/reference/sobi_world`, `npx tsx scripts/cut-plaza.ts`, ảnh mô phỏng nên là bản tạm cho tới khi có art gốc): nhân vật So và Bi, mỗi người 12 khung (`chr_so`, `chr_bi`, 96×144), cổng Adventure / Garden / Aquarium / Cloud, đài phun nước, ghế, đèn, thuyền, cây, rương, rơm, biển gỗ.

Còn thiếu:
| Việc | Ghi chú |
|---|---|
| `ui_icon_lock` (128×128) | Ổ khóa trên cổng chưa mở: vẫn là placeholder. |
| Trạng thái khóa riêng của từng cổng | Hiện cổng khóa = ảnh cổng bị làm tối + ổ khóa. Spec §3.1: rào, mây che, cổng tắt. |
| Nhân vật Kai (nam) | Có trong ảnh `sobi_world_character_moving.png`; game hiện chỉ dùng Sobi. |
| Nền đất, đường, bãi cát, biển | Hiện vẽ bằng hình tô màu trong cảnh (`content/plaza/layout.json` → `ground`). Ảnh tham khảo có ô nền (cỏ, đá lát, đường đất, biển) để cắt thành tile. |
| Bảng đơn hàng, Chợ, NPC ở Sảnh | GĐ6. |
| Art Sobi Garden / Aquarium / Cloud / Adventure | Ảnh tham khảo ở `asset/reference/sobi_{garden,aquarium,cloud}`; làm cùng từng Area. |
