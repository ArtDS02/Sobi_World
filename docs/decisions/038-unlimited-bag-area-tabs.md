# 038 — Kho đồ không giới hạn, tab theo khu vực và chip phân loại

**Ngày:** 2026-10-23 · **Trạng thái:** Đã làm, chờ chủ dự án duyệt.

## Bối cảnh
Túi đồ chung là 40 ô × stack 99 (GAME_BALANCE §8, `content/shared/inventory.json`). Với 127 vật phẩm của 5 khu, người chơi
hay bị "Túi đồ đã đầy chỗ" và màn Kho chỉ là một danh sách dài không lọc được. Chủ dự án: "kho đồ không giới hạn, có tab
phân biệt area, có nút phân loại cho từng loại vật phẩm, giao diện chuẩn, đẹp, đề cao UI/UX".

## Quyết định
1. **Không giới hạn**: `inventory.json` bỏ `slots` (`{ "stack": 99 }`); schema cho `slots` là tuỳ chọn, vắng = không giới hạn
   (`core/inventory/bag.ts`). Đặt lại `slots` trong content thì giới hạn quay lại, không cần sửa code. Các nhánh `INVENTORY_FULL`
   của từng khu giữ nguyên (không còn xảy ra khi không có giới hạn). Thắng GAME_BALANCE §8 ("40 ô; mỗi cấp Kho +20 ô").
2. **Mỗi vật phẩm có `area`** (`sobi_farm | sobi_garden | sobi_aquarium | sobi_cloud | sobi_adventure`) trong `items.json`, sửa
   được ở Admin. Gán theo nơi làm ra: hạt / hoa của Cloud → Cloud; cá, vảy, ngọc trai, thức ăn cá → Aquarium; nông sản, hạt,
   phân bón → Garden; thức ăn heo, thuốc, phân heo → Farm; trang bị, nguyên liệu phiêu lưu, khẩu phần, trứng, cuộn kỹ năng → Adventure.
3. **Màn Kho đồ**: tab khu (Tất cả + 5 khu, đếm số loại), mở đúng tab của nơi đang đứng (Sảnh → Tất cả); chip loại (chỉ loại có
   trong tab, đếm số loại); tìm theo tên / công dụng không cần dấu; sắp xếp Mặc định / Nhiều nhất / Hiếm nhất / Tên A–Z; thẻ vật
   phẩm viền theo độ hiếm, số lượng, loại, mô tả 2 dòng, nút nhanh (Đổ máng, Ấp trứng, Bán hết). Phần đầu dính trên cùng khi cuộn;
   cửa sổ rộng hơn (64rem) và cao cố định để tab không nhảy khi lọc; trên điện thoại chip là một hàng cuộn ngang.
4. **Save không đổi** (vẫn là bản đồ id → số lượng), không cần migration.
