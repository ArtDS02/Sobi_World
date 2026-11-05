# IP AUDIT PROMPT — Rà soát bản quyền toàn game

Dùng khi: trước phát hành/tag giai đoạn, sau mỗi batch art lớn, hoặc khi nghi ngờ.
Cách dùng: dán nguyên khối prompt bên dưới vào một phiên mới. Agent làm **2 pha**; pha 2 chỉ chạy sau khi chủ dự án duyệt.

---

```
Đọc docs/AGENT_RULES.md (đặc biệt §9), docs/decisions/048-no-third-party-ip.md, docs/PROGRESS.md.

NHIỆM VỤ: rà soát TOÀN BỘ game để tìm nội dung có thể vi phạm bản quyền/nhãn hiệu của bên thứ ba
(nhân vật, sinh vật, địa danh, vật phẩm, thương hiệu, câu thoại, âm thanh, font, thư viện).
Chưa được xóa/sửa gì ở PHA 1.

=== PHA 1 — CHỈ BÁO CÁO (không sửa file) ===
Phạm vi quét (đọc nội dung thật, không chỉ grep):
1. content/ và mọi JSON: id, tên, mô tả của pig/animal/monster/boss/NPC/cá/cây/hoa/vật phẩm/skill/địa danh/map.
2. src/i18n/: toàn bộ chuỗi hiển thị (cả vi và en).
3. public/assets/, asset manifest, tên file: nhìn trực tiếp ảnh có nghi vấn (dáng, bảng màu, đặc điểm nhận diện giống IP nào).
4. asset/ (nguồn art, ảnh reference), asset/art_inbox, prompt đã dùng để tạo ảnh, docs/ASSET_TODO.md.
5. Code/comment/test/tools/admin: tên biến, tên file, comment nhắc IP.
6. Âm thanh, font, thư viện, package.json: license có cho dùng thương mại không; nguồn gốc.
7. docs/ (spec, balance, update_spec_*): mô tả "giống/lấy cảm hứng từ" IP cụ thể.
8. Tên game/gói/app id/icon/installer (electron-builder), mô tả store.

Phân loại mỗi phát hiện theo mức rủi ro:
- CAO: trùng/nhái rõ tên hoặc hình của IP cụ thể.
- TRUNG BÌNH: có nét nhận diện/ý tưởng rất gần IP, hoặc tên dễ nhầm.
- THẤP/CẦN XÁC MINH: chung chung nhưng nên kiểm tra (license, nguồn không rõ).

Xuất báo cáo, lưu vào docs/IP_AUDIT_REPORT.md và tóm tắt trong chat, gồm:
A. Bảng các LOẠI phát hiện (nhóm theo loại: animal/pig, monster, boss, NPC, item, địa danh, tên chuỗi, ảnh,
   âm thanh, font, lib, khác) với số lượng và mức rủi ro.
B. Danh sách chi tiết: id/tên | file/đường dẫn | IP bị nghi | lý do | mức rủi ro | đề xuất (đổi tên / thay art / xóa / giữ).
C. ẢNH HƯỞNG nếu xử lý từng mục: gameplay (balance, drop, quest, tiến trình, bestiary), SAVE của người chơi
   (id có nằm trong save không → cần migration/alias), content schema, i18n, manifest/asset, test, admin,
   tài liệu. Nêu rõ mục nào cần migration save.
D. Phương án thay thế gốc đề xuất (tên + mô tả ngắn thiết kế gốc, dựa trên động vật thật/thần thoại chung).
E. Khối lượng ước tính và thứ tự xử lý (CAO trước).
F. Những gì KHÔNG chắc chắn → liệt kê để chủ dự án quyết.

DỪNG tại đây và chờ chủ dự án duyệt từng mục (giữ / đổi / xóa).

=== PHA 2 — XỬ LÝ (chỉ sau khi được duyệt) ===
- Nhánh git riêng: fix/ip-audit-<ngày>. Commit nhỏ theo từng nhóm.
- Chỉ xử lý các mục đã được duyệt. Không tự mở rộng.
- Đổi id → thêm migration/alias cho save + test với save thật. KHÔNG làm mất save người chơi.
- Xóa asset: gỡ khỏi manifest, content, i18n, test, admin; không để tham chiếu mồ côi.
- Art thay thế: placeholder + ghi docs/ASSET_TODO.md (art thật làm theo skill image-to-asset, tuân §9).
- Cập nhật docs/THIRD_PARTY.md cho nguồn hợp lệ còn giữ.
- Chạy npm run check xanh; chạy game thử các luồng bị ảnh hưởng.
- Cập nhật docs/PROGRESS.md và báo cáo theo mẫu AGENT_RULES §7.
```
