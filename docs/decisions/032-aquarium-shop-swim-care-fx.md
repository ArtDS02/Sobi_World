# 032 — Cửa hàng Aquarium; cá bơi sống động; hiệu ứng cho ăn và thay nước

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án yêu cầu (cho agent tự quyết hiệu ứng); giá chờ chơi thử (sửa được ở Admin → Số liệu)

## Bối cảnh
Aquarium chưa có chỗ mua: thức ăn cá chỉ được mua ngầm khi cho ăn thiếu, thuốc chỉ có ở cửa hàng Farm, cá chỉ có từ câu và cho đẻ.
Cá bơi thẳng tới một điểm rồi đứng; cho ăn và thay nước không có hình ảnh gì ngoài toast.

## Quyết định
- **Cửa hàng** như Garden / Cloud (decision 029, 031): `shop: [{ itemId, price }]` trong `content/aquarium/balance.json`,
  hành động `buyShopItem` (sổ cái `AQUARIUM_SHOP`, sự kiện `AQUARIUM_SHOP_BOUGHT` → `currency.changed` + `item.added`),
  lưới thẻ dùng chung tông xanh nước, mở bằng nút "Cửa hàng" trên HUD. Không đổi save.
  - Bán: Thức ăn cá 20 (giá gốc), Thuốc 100 (giá gốc), cá giống Cá Vàng 40, Cá Rô 50, Cá Chép 60 (3 loài Thường).
  - Cá giống vào túi như cá câu được, thả vào bể bằng "Cá trong túi" (bắt đầu ở 30% lớn như cá câu).
    Giá cao hơn giá bán cá câu (20 / 24 / 28) nên không có vòng mua–bán lời; nuôi lớn mới có lãi nhỏ. Loài hiếm vẫn chỉ có từ câu / cho đẻ.
- **Cá bơi** (`scene/fishSwim.ts`): vận tốc đuổi theo hướng muốn đi (tăng tốc, chậm dần khi gần tới, đi cong), mỗi chặng lên / xuống
  tối đa 120 px (cá chủ yếu bơi ngang), thân nghiêng theo hướng lên / xuống, vẫy đuôi nhanh dần theo tốc độ, quay đầu bằng cách
  thân hẹp lại rồi lật, nhấp nhô khi nghỉ, thỉnh thoảng lao nhanh (12%), thỉnh thoảng nhả bọt. Cá đói bơi ở 1/3 trên (tìm mồi),
  cá bệnh ở nửa dưới và chậm.
- **Cho ăn** (`scene/aquariumFx.ts`): cảnh thấy cá có bữa ăn mới (`lastFedAt` đổi) → rắc hạt quanh chỗ các con đó, hạt rơi xuống
  mặt nước (gợn sóng), chìm lắc lư, nằm đáy một lúc rồi mờ; mỗi con vừa ăn nhận vài hạt, bơi nhanh tới hạt gần nhất và đớp
  (phồng nhẹ + bọt). Cá no không bơi tới (khớp với hành động: cá no không được cho ăn).
- **Thay nước**: nước tăng ≥ 5 điểm → dòng nước đổ vào bên trái bể, gợn sóng liên tục chỗ rơi, bọt dâng lên, dải sáng quét ngang
  trong khi lớp đục tan dần (tween thay vì tắt ngay), lấp lánh; cá bơi vui (nhanh hơn một lúc).
- Hiệu ứng chỉ là trình bày, đọc từ trạng thái như hiệu ứng thu hoạch của Garden; tắt khi "Giảm chuyển động".
- Ảnh: hạt thức ăn và gợn sóng vẽ bằng code tới khi có ảnh (`art_inbox/.batch/aquarium-03-fx/PROMPT.md`); dòng nước giữ bằng code.

## Còn lại
- Chơi thử giá cá giống. Sạp hàng trong cảnh (như Garden) chưa có: 5 nơi khác nhau, cần đo chỗ trên từng nền.
