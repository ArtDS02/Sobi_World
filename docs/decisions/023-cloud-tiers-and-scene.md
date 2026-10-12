# 023 — Sobi Cloud: 10 tầng mây và cảnh theo mẫu của chủ dự án

**Ngày:** 2026-10-12 · **Trạng thái:** Đã chốt bởi chủ dự án (10 tầng × 15 ô, mở theo cấp và vàng, chỉ thêm ô; bố cục theo ảnh mẫu); con số cấp / giá do agent đề xuất, sửa được ở Admin

## Bối cảnh
Màn Cloud sau đợt art đầu (decision 022) vẫn là bố cục placeholder (khối trắng, trời tô phẳng, nhãn chữ trần); chủ dự án đánh giá không đạt và gửi ảnh mẫu bố cục (`asset/reference/sobi_cloud/cloud_layout_mock.png`), đồng thời yêu cầu "lên các tầng mây cao hơn, tùy level, càng cao càng tốn tiền". Đây là thay đổi gameplay trong lúc đóng băng (decision 021): chủ dự án mở băng riêng cho phần này.

## Quyết định
- **10 tầng mây, mỗi tầng 15 ô** (`content/cloud/balance.json`: `plotsPerTier`, `plotExpansions` có thêm `level`). Tầng 1 giữ cách mở dần cũ (6 → 9 → 12 → 15); tầng 2–10 mỗi lần mở trọn 15 ô, cần cấp thế giới và Sobi Coin: cấp 9 / 5.000, 10 / 8.000, 11 / 12.000, 12 / 18.000, 14 / 26.000, 15 / 36.000, 17 / 50.000, 18 / 70.000, 20 / 100.000. Tầng cao **chỉ thêm ô**, không đổi tốc độ hay sản lượng hoa.
- `buyPlots` trả `LEVEL_TOO_LOW` khi chưa đủ cấp; sự kiện `CLOUD_PLOTS_BOUGHT` có thêm `tier` (thông báo "Đã mở <tên tầng>!").
- **Save Cloud v2** (migration 1 → 2): save cũ có 18 ô (bước cũ 15 → 18 giá 5.000) được mở trọn tầng 2 (30 ô) miễn phí, cây đang trồng giữ nguyên.
- **Cảnh theo ảnh mẫu:** nền đảo mây vẽ sẵn (`bg_cloud`, 1816×900 ≈ 2:1 như mẫu, phủ kín màn hình rộng), lưới 5 × 3 trên bãi mây kem, suối và vạc trên thảm cỏ bên trái, nhãn là bảng gỗ, băng rôn tên tầng + 2 nút lên / xuống tầng, chim mây bay; mỗi lần xem một tầng, mở tầng mới thì tự chuyển tới. Thanh dưới hiện hình bông hoa, nút màu theo mẫu.
- Nền sạch lấy bằng cách **sửa chính ảnh mẫu** (Gemini, xóa UI / chữ / ô / suối / vạc) để vị trí khớp mẫu; bảng gỗ, băng rôn, nút, chim, Cú Giả Kim vẽ theo vùng cắt từ mẫu (batch `cloud-04-scene`). Chữ trên bảng do game viết (Việt / Anh).
- Trước khi có nền riêng cho từng tầng, mỗi tầng phủ một màu nhẹ lên nền chung.

## Không đổi
Hoa, nước, vạc, potion, giá hạt, cân bằng của từng ô. Save thế giới (chỉ slice Cloud lên v2).

## Hệ quả
- Tổng ô tối đa 18 → 150. Bot kinh tế (`scripts/economy/cloud.ts`) tự mua tầng khi đủ cấp và tiền: save thử 45 ngày mở tới tầng 8. Nước tinh khiết (suối tối đa 16) là giới hạn tự nhiên: nhiều ô sẽ lớn chậm khi khô. Cần chủ dự án chơi thử và chỉnh giá ở Admin nếu tầng mở quá nhanh.
- Asset mới (placeholder đến khi có art): `prop_sign_plank`, `prop_title_banner`, `ui_btn_tier_up`, `ui_btn_tier_down`, `prop_cloud_bird`, `prop_npc_alchemist` (đổi `artId` của Bác Cú Giả Kim sau khi duyệt ảnh).
- Đề xuất art sau: nền riêng cho 9 tầng cao (sửa từ nền tầng 1 theo chủ đề tên tầng), HUD mới theo mẫu (icon xu, giọt nước, sao cấp, nút có icon) dùng chung mọi Area.
