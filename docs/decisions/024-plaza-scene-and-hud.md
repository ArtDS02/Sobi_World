# 024 — Sảnh Sobi World theo ảnh mẫu của chủ dự án

**Ngày:** 2026-10-13 · **Trạng thái:** Hướng do chủ dự án yêu cầu (ảnh mẫu `asset/reference/sobi_world/plaza_layout_mock.png`); cách làm do agent đề xuất, chờ duyệt

## Bối cảnh
GĐ14: chủ dự án gửi ảnh mẫu Sảnh (đảo nổi trên trời, 5 công trình cổng, bảng gỗ tên khu vực, HUD tím pastel, thanh 5 khu vực ở dưới, logo Sobi World). Bố cục trùng với Sảnh hiện có, khác ở nét vẽ (HD, không pixel), nền đảo trời và HUD. Làm như Cloud (decision 023).

## Quyết định
- **Khung thiết kế của Sảnh = tỉ lệ ảnh mẫu**: 1932 × 900 (ảnh 1837 × 856 × 1,0514), cả khung luôn hiện; ngoài khung tô màu trời (trên), mây (dưới), hai bên. Mọi vị trí trong `content/plaza/layout.json` đo trên ảnh mẫu (tỉ lệ khung = toạ độ ảnh / kích thước ảnh).
- **Nền vẽ sẵn `bg_plaza`** = ảnh mẫu đã xoá HUD, chữ, bảng gỗ và **mọi vật đứng** (công trình, cây, đèn, ghế, bụi, thú). Các vật đó vẫn là sprite để nhân vật đi ra sau, cổng tối + ổ khóa khi đóng. Layout có `backdrop` (art + 3 màu viền); nền chỉ hiện khi art không còn là placeholder, trước đó cảnh vẽ đất bằng code như cũ. Thuyền, cầu tàu, vỏ sò trên cát nằm trong nền (`paintedGround`: chỉ vẽ sprite khi chưa có nền).
- **Art mới thay art cũ không cần sửa layout**: placement có `fallback` (art dùng khi art của nó còn placeholder). Công trình chỉ có ở Sảnh giữ id (`prop_portal_gate`, `prop_garden_gate`, `prop_sky_tree`, `prop_sea_dock`, `prop_farm_yard`, `prop_main_house`, `prop_fountain`) và được vẽ lại; cây / bụi / đèn / ghế dùng id mới `prop_plaza_*` vì Farm và Aquarium dùng chung id cũ.
- **Bảng tên** `prop_plaza_sign` để trống, game viết tên khu vực (Việt / Anh) và đặt icon `ui_area_<khu>` bên phải khi có art.
- **HUD Sảnh**: thẻ hồ sơ (linh vật + "Sobi World" + Sobi Coin), Ngọc, thanh Cấp thế giới có ngôi sao (KN hiện tại / cấp sau, hoặc "Cấp cao nhất"); bên phải Sảnh / **Bộ sưu tập** / Menu / Vật phẩm (bỏ nút "Bản đồ" đang tắt: thanh khu vực thay nó); thanh dưới 5 thẻ khu vực (bấm = đi thẳng tới khu đã mở; khu đóng: hiệu ứng từ chối + thông báo lý do); logo góc phải dưới (trang trí, không bấm). Bỏ nút "quay lại" và nút "+" cạnh Ngọc của ảnh mẫu: không có tính năng tương ứng.
- **Art qua batch `world-01-scene`** (backend G, 9 lượt Gemini): 1 ảnh sửa (nền) + 8 sheet, gợi ý dáng cắt từ ảnh mẫu (look hint). Sheet A dùng 3 gợi ý vì mỗi cổng là một vật riêng.

## Không đổi
Gameplay, save, điều kiện mở khu vực, cách vào cổng (đi tới + phím E hoặc bấm vào cổng), Bảng đơn hàng (đặt cạnh quảng trường, ảnh mẫu không có).

## Hệ quả
- e2e bấm cổng theo khung mới (1932 × 900); `plaza.spec` đo cửa chuồng heo ở x = 1642.
- Thanh khu vực là "đi nhanh": không phải đi bộ tới cổng. Nếu chủ dự án muốn giữ việc đi bộ, chỉ cần bỏ thanh (không ảnh hưởng gì khác).
