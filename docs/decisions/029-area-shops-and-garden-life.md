# 029 — Cửa hàng riêng của Garden và Cloud; vườn sống động hơn

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án yêu cầu cửa hàng và đồng ý 6 đề xuất (cho agent tự quyết); giá chờ chơi thử (sửa được ở Admin)

## Bối cảnh
Garden và Cloud không có chỗ mua hạt hay vật tư: hạt chỉ được mua ngầm khi gieo thiếu, phân bón chỉ có từ Thùng ủ, Nước tinh khiết chỉ có từ Suối mây. Chủ dự án muốn mỗi vùng có cửa hàng (asset + giao diện đẹp), và đồng ý các đề xuất: thú trang trí, nông sản bay về túi, cây chín lấp lánh, màu riêng mỗi khu, HUD Garden tông trắng–tím, vòi tưới đổi hình theo cấp.

## Quyết định
- **Danh sách hàng nằm trong balance của từng vùng** (`shop: [{ itemId, price }]` trong `content/garden/balance.json` và `content/cloud/balance.json`), nên giá sửa được ở Admin → Số liệu. Không thêm file content mới.
  - Garden: 5 loại hạt (giá như hiện tại) và phân bón 50.
  - Cloud: 6 loại hạt hoa (giá như hiện tại), Nước tinh khiết 15 (bán ra 6: suối vẫn có lợi hơn) và phân bón 50.
- **Hành động `buyShopItem`** của mỗi Area: trả tiền qua sổ cái (`GARDEN_SHOP` / `CLOUD_SHOP`), đồ vào túi chung theo kiểu "đủ hết hoặc không gì cả", tối đa 999 một lần, phát `*_SHOP_BOUGHT` (đổi thành sự kiện thế giới `currency.changed` + `item.added`). Không đổi save.
- **Giao diện:** lưới thẻ dùng chung `ui/components/shopGrid.ts` (ảnh, tên, công dụng, giá một cái, đang có, nút ×1 / ×10 / ×50; nút luôn nói lý do bị tắt). Garden tông xanh lá–gỗ, Cloud tông tím–trắng. Mở bằng nút "Cửa hàng" trên HUD hoặc bấm vào sạp trong cảnh.
- **Sạp hàng trong cảnh:** Garden ở bãi cỏ góc dưới phải, Cloud ở bờ đảo bên phải (kèm bảng gỗ "Cửa hàng"). Tới khi có ảnh (`bld_shop_garden`, `bld_shop_cloud`), sạp được vẽ bằng code (`ui/world/codeStall.ts`).
- **Vườn sống động** (chỉ là trình bày, tắt khi "Giảm chuyển động"):
  - Gà và vịt (sprite Farm) đi dạo trên lối đi quanh ruộng, thỉnh thoảng mổ.
  - Thu hoạch: icon nông sản bay về nút Vật phẩm, kèm số "+n" nổi lên.
  - Cây vừa chín nảy lên và lấp lánh.
  - Mỗi khu phủ một màu nền nhẹ.
  - Vòi tưới đổi hình theo cấp: dùng ảnh riêng từng cấp khi có (`bld_sprinkler_l2..l5`); trước đó ảnh gốc được phóng to dần.
  - HUD Garden đổi sang tông trắng–tím và khay kem như Cloud.
- Ảnh cần vẽ: `asset/batches/extras-01.md` (2 sạp hàng, 4 vòi tưới), `asset/batches/drone-01.md` (drone). Dòng manifest thêm khi giao ảnh.

## Còn lại
- Chơi thử giá cửa hàng (nhất là phân bón 50 so với Thùng ủ, nước 15 so với suối).
- Hiệu ứng thu hoạch / cây chín hiện mới có ở Garden; Cloud có thể làm sau nếu muốn.
