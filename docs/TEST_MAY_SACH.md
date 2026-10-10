# TEST MÁY SẠCH — Tự thử bản cài Sobi World

Mục tiêu: cài và chơi được trên một máy **không có công cụ lập trình** (không Node, Git, VS Code…) và **không có internet**.
Cần: máy Windows 10/11 64-bit, file `release\SobiWorld-Setup-<version>.exe` (~145 MB, chép bằng USB hoặc ổ mạng).

## Chuẩn bị
1. Chép file cài sang máy thử.
2. **Tắt mạng** (rút dây LAN, tắt Wi-Fi hoặc bật chế độ máy bay). Giữ tắt suốt buổi thử.

## A. Cài đặt
1. Mở file `.exe`. Nếu Windows báo "Windows protected your PC" (chưa ký số): bấm **More info → Run anyway**. Đây là bình thường ở bản thử.
2. Làm theo trình cài đặt: giữ thư mục mặc định (hoặc đổi tùy ý), bấm **Install** → **Finish**. Cài theo người dùng, không cần quyền quản trị.
- [ ] Có shortcut **Sobi World** trên Desktop và trong Start Menu, icon hình mặt heo hồng.

## B. Mở game lần đầu
1. Mở bằng shortcut trên Desktop.
- [ ] Cửa sổ tên **Sobi World** hiện lên trong vài giây, không báo lỗi, không đòi đăng nhập hay kết nối mạng.
- [ ] Mở ở **Sảnh**: có nhân vật; đi bằng **W A S D** hoặc mũi tên.
- [ ] Đi vào cổng chuồng heo (bấm **E**) → vào Sobi Farm.

## C. Chơi thử (5–10 phút)
- [ ] Mua một chú heo ở Cửa hàng, đổ thức ăn vào máng, nhìn heo ăn.
- [ ] Mở Menu → Cài đặt: đổi âm lượng, đổi nhân vật Bi/So, đổi một phím.
- [ ] Ra Sảnh bằng nút "Ra Sảnh". Không thấy chữ lạ, ô vuông thiếu hình, hay tiếng kêu rè.
- [ ] Không có màn hình hoặc nút **Admin** ở bất cứ đâu.

## D. Lưu và mở lại
1. Tắt game bằng nút ✕ của cửa sổ (đợi cửa sổ đóng hẳn, tối đa vài giây).
2. Mở lại bằng shortcut.
- [ ] Con heo, số Sobi Coin, vị trí nhân vật và phím đã đổi **vẫn còn đúng như lúc tắt**.
3. (Tùy chọn) Mở thư mục save: Menu → Cài đặt → "Mở thư mục lưu", hoặc gõ `%APPDATA%\SobiWorld` vào ô địa chỉ của File Explorer.
- [ ] Có `saves\save.json`.

## E. Kiểm offline
- [ ] Mạng vẫn tắt từ đầu đến giờ mà mọi bước trên đều chạy bình thường.

## F. Gỡ cài đặt (tùy chọn)
Settings → Apps → **Sobi World** → Uninstall.
- [ ] Shortcut biến mất; thư mục `%APPDATA%\SobiWorld` **vẫn còn** (save được giữ). Cài lại thì chơi tiếp được.

## Báo lỗi
Nếu có bước không đạt, ghi lại: bước nào, thấy gì, bản Windows. Kèm ảnh chụp màn hình và thư mục `%APPDATA%\SobiWorld` (nén lại) nếu liên quan save.
