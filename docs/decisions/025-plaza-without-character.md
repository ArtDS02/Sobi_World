# 025 — Sảnh không còn nhân vật: bấm vào khu vực là vào

**Ngày:** 2026-10-13 · **Trạng thái:** Đã chốt bởi chủ dự án ("loại bỏ nhân vật ở sảnh, chỉ cần click vào các khu vực thì vào luôn, hoặc vào bằng thanh HUD"); cách làm do agent quyết, chủ dự án cho phép tự quyết HUD

## Bối cảnh
Từ GĐ3 (decision 010) người chơi điều khiển nhân vật So / Bi đi bộ trong Sảnh tới cửa từng khu, bấm phím E để vào. Sau khi có Sảnh theo ảnh mẫu (decision 024) và thanh khu vực, chủ dự án bỏ việc đi bộ.

## Quyết định
- **Sảnh không có nhân vật.** Bấm vào công trình của một khu (hoặc bảng tên của nó) là vào ngay; khu chưa mở: hiệu ứng từ chối, công trình vẫn tối + ổ khóa. Rê chuột lên một khu: công trình phóng nhẹ, bảng tên nảy + lấp lánh, ô gợi ý hiện ngay trên công trình (tên, hoặc lý do + điều kiện mở). Thanh khu vực ở dưới (decision 024) làm việc tương tự và chỉ hiện khi Sảnh đã vẽ xong (tránh vào Farm khi ảnh còn đang tải).
- **Cài đặt**: bỏ mục chọn nhân vật; danh sách phím chỉ còn Túi đồ / Codex / Menu (phím di chuyển và Tương tác vẫn lưu trong `settings.json`, chỉ không hiện).
- **Xóa code chỉ phục vụ việc đi bộ ở Sảnh**: `CharacterActor`, `characterFrames`, `characterPicker`, `FadeBehind`, `plaza/logic/arrival|walkable|groundKind` và test của chúng. Giữ `systems/character` (lõi thuần, có test) và `core/config/character` cho Area có nhân vật sau này (Adventure khai `movement: character`).
- **Save không đổi**: `player` (chỗ đứng) và `settings.character` vẫn đọc/ghi được, chỉ không còn dùng. Không cần migration.
- Bố cục đo lại trên nền thật `bg_plaza` (đường đi khác ảnh mẫu một chút). Các trường `walkArea`, `spawn`, `portalReach`, `solid`, `footprint`, `fade` của layout Sảnh không còn tác dụng; giữ trong schema vì Admin (Bố cục → Sảnh) còn ghi chúng — dọn cùng Admin sau.

## Hệ quả
- e2e: vào cổng bằng một cú bấm, hover hiện gợi ý, phím đổi được thử bằng phím Túi đồ.
- Ảnh `chr_so_*` / `chr_bi_*` vẫn trong manifest nhưng không dùng.
