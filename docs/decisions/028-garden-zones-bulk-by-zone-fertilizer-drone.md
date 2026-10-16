# 028 — Garden nhiều khu trồng; gieo kín / bón phân theo khu đang xem; drone bón phân

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án yêu cầu; con số do agent đề xuất, chờ duyệt (sửa được ở Admin)

## Bối cảnh
Góp ý của chủ dự án về cảnh Garden (sau decision 027): Garden chỉ có 1 khu 24 ô, mở hết thì không mở thêm được; "Gieo kín ô trống" gieo cho mọi ô của mọi tầng/khu; cần nút bón phân cho tất cả, có drone bay tới các ô; vòi tưới cần hiệu ứng phun, bỏ số trên vòi; cây đung đưa; bỏ hiệu ứng hover ô và bỏ bảng tên.

## Quyết định
- **Garden có 4 khu × 24 ô** (giống tầng mây của Cloud, decision 023): `plotsPerZone` 24; qua khu 1, mỗi bước mở **trọn một khu** và cần cấp thế giới. Số đề xuất: khu 2 = 48 ô, 25.000, cấp 8; khu 3 = 72 ô, 50.000, cấp 12; khu 4 = 96 ô, 90.000, cấp 16. Tên khu: Vườn Nhà, Đồng Lúa Vàng, Đồi Bắp Nắng, Thung Lũng Rau Củ.
- **Vòi tưới thêm 2 cấp** để phủ khu mới: cấp 4 = 48 ô (10.000 + 30 vảy, 5 ngọc trai, 5 bánh răng cổ), cấp 5 = 96 ô (25.000 + 50 vảy, 8 ngọc trai, 8 bánh răng cổ).
- **Save không đổi**: ô đất vẫn là một mảng; khu = `floor(chỉ số ô / 24)`. Save cũ (≤ 24 ô) dùng nguyên.
- **Khu đang xem** là trạng thái trình bày (không lưu): Garden `viewedZone.ts` (thanh "‹ Khu n · tên ›" ở HUD đổi khu, ruộng trượt ngang khi đổi), Cloud `viewedTier.ts` (cảnh ghi lại tầng đang xem). Xem được các khu đã mở và khu kế tiếp (khóa) khi khu cuối đã đầy; mua khu mới thì tự chuyển sang khu đó.
- **"Gieo kín ô trống" và "Bón phân tất cả" chỉ tác động lên khu / tầng đang xem** (Garden và Cloud). Tưới, thu hoạch, hứng nước vẫn cho toàn bộ.
- **Bón phân tất cả** dùng hành động bón phân có sẵn (`fertilizePlots`, 1 phân bón mỗi ô đang lớn chưa bón), không thêm luật mới. Cloud đã có bón phân từng ô; nay có thêm nút cho cả tầng.
- **Drone** (`ui/world/fertilizerDrone.ts`, dùng chung): cảnh so ô nào vừa được bón phân với lần vẽ trước (như hiệu ứng trúng đòn của Adventure), drone bay từ Thùng ủ / bờ vạc qua từng ô, rắc phân, cây "nhận" phân khi drone tới. Chỉ là trình bày. Chưa có art: drone vẽ bằng code; batch `drone-01` (`prop_drone_garden`, `prop_drone_cloud`), dòng manifest thêm khi giao ảnh.
- Cảnh Garden: bỏ hover ô; cây đung đưa (như hoa Cloud); bỏ bảng tên (decision 027), thay bằng bong bóng tên khi rê chuột lên công trình; bỏ số trên vòi tưới, vòi phun nước theo nhịp và có sương rơi trên ô được tưới tự động. Tất cả tắt khi "Giảm chuyển động".

## Còn lại
- Chủ dự án duyệt giá / cấp của khu 2–4 và vòi tưới cấp 4–5; chơi thử xem nhịp mở khu.
- Ảnh drone (`asset/batches/drone-01.md`).
