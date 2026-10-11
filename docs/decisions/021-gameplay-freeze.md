# 021 — Đóng băng gameplay (GĐ13)

**Ngày:** 2026-10-11 · **Trạng thái:** Đề xuất, có hiệu lực **sau khi chủ dự án chơi thử ≥ 7 ngày thật và duyệt GĐ13**. Từ lúc đó hết đổi cơ chế; chỉ sửa lỗi (ROADMAP GĐ13, decision 017).

## Bối cảnh
GĐ1–GĐ12 đã xong phần gameplay với art placeholder. GĐ14 sẽ vẽ, làm animation, VFX, âm thanh; art chỉ thay được an toàn khi cơ chế đứng yên (decision 017). GĐ13 đã chạy nghiệm thu toàn bộ (`docs/ACCEPTANCE.md`), sửa các lỗi tích hợp tìm thấy và đo hiệu năng.

## Đã đóng băng
**Luật và cấu trúc, không thêm bớt:**
- **Thế giới:** một Sobi World Level (20 cấp, bảng KN ở `shared/progression.json`) và World Development = cấp + Codex / 10 + công trình Lv3 (máng, vòi tưới, bể, suối). Năm Area: Farm (mở sẵn), Garden (cấp 3), Aquarium (cấp 6), Cloud (cấp 8 + WD 15), Adventure (cấp 8 + WD; **số WD đang chờ chủ dự án chốt**, xem dưới). Điều kiện mở theo `unlock` của từng `area.json`.
- **Thời gian thật:** mô phỏng một công thức cho online (lát 1 phút) / nền / offline (lát 10 phút), trần bù 30 ngày, ân hạn sau offline, chống lùi giờ; bệnh → nguy kịch (48 giờ) → mất (72 giờ), bảo vệ 72 giờ đầu, thuốc.
- **Farm:** heo (75 giống, 4 giai đoạn lớn, Quality theo tâm trạng suốt đời, cân nặng), máng tự động có cấp, phân và dọn phân, xuất chuồng (giá = giống × chất lượng × cân nặng × sức khỏe × chợ), Bond / món yêu thích / mục đích nuôi (xuất chuồng, giống, thú cưng, phiêu lưu), phối giống nâng cao (tính trạng ≤ 3, ẩn mở ở 5 tim, đột biến, vận may, phả hệ), trang trí.
- **Garden:** ô đất (6–24), tưới, phân bón, héo sau 48 giờ, vòi tưới, Máy xay, Thùng ủ, vòng phân → phân bón → cây → thức ăn → heo.
- **Aquarium:** cá là sinh vật chung, bể 4 cấp, độ trong của nước, câu cá căn phao, cá chỉ cắn ban đêm, trai ngọc, vảy, cá đẻ trứng.
- **Cloud:** hoa thường / hiếm / đêm, Nước tinh khiết từ suối, Vạc nấu potion (Healing, Vui Vẻ, Chiến Đấu), hoa tăng đột biến khi lai.
- **Adventure:** trận theo lượt (tốc độ, 4 nguyên tố ×1,5 khắc chế, chí mạng, 7 trạng thái), 8 kiểu đánh × 4 kỹ năng, 3 ô trang bị, 3 vùng nối chuỗi và trùm, khẩu phần, thua = kiệt sức 4 giờ không mất gì, loot nâng công trình Lv3–Lv4 và 4 công nghệ × 3 cấp.
- **Thế giới động:** thời tiết là hàm của số ngày (5 loại, tác dụng nhẹ, không phạt), 4 lễ hội chu kỳ 28 ngày với Vé Lễ Hội và cửa hàng, Thương nhân.
- **Hệ thống chung:** Bảng đơn hàng và đơn của trại, mục tiêu hằng ngày, thành tích và Gems, Codex (4 loại + vật phẩm), quà đăng nhập, Chợ theo ngày, NPC hướng dẫn mỗi Area, hướng dẫn 10 phút đầu.
- **Nguyên tắc:** mọi vật phẩm ≥ 2 công dụng (`npm run items:audit` phải sạch); tiền chỉ đổi qua một helper ghi Transaction; mọi hành động thành công phát sự kiện; không mạng; không làm mất save.
- **Save v11:** định dạng world hiện hành. Không đổi cấu trúc nữa; nếu một lỗi bắt buộc phải đổi thì thêm migration `11 → 12` và test với save thật (`tests/unit/saveVersions.test.ts`).
- **Cài đặt máy (`settings.json`, ngoài save):** phím, nhân vật, ngôn ngữ (Việt / Anh), cỡ chữ, chế độ màu, rung màn hình.

## Vẫn được phép sau freeze
- **Sửa lỗi** (gameplay, kiến trúc, chữ, giao diện chức năng), kèm test; ghi `PROGRESS.md`.
- **Chỉnh con số** trong `content/` (giá, thời gian, tỉ lệ) khi chủ dự án chơi thấy lệch: một dòng trong `PROGRESS.md` nêu số cũ → mới và lý do; chạy `npm run sim:week` / `check`. Không đổi công thức hay thêm hạng mục.
- **Chữ và dịch:** sửa câu chữ Việt / Anh (`vi.ts`, `en/`, `content/i18n/en.json`).
- **GĐ14:** art, animation, VFX, âm thanh đi qua id → manifest, không đụng logic; `docs/ASSET_TODO.md` là danh sách việc.

## Không được phép (phải có decision mới và chủ dự án duyệt)
Area, loại vật phẩm, loại tiền, công thức tính (giá, lớn, trận đánh, mở khóa) hay cơ chế mới; đổi cấu trúc save; thêm mạng hay máy chủ; làm art / animation / âm thanh trước GĐ14.

## Việc đang chờ chủ dự án chốt trước khi freeze có hiệu lực
**Điều kiện mở Adventure: Phát triển thế giới.** Hiện là 20 (từ decision 013). Bot không sưu tầm heo mở Adventure ngày ~47; với WD 18 → ngày 31, 16 → ngày 23, 14 → ngày 18 (Cloud ngày ~22, bot tự đi Adventure ngay cấp 8 = ngày 15 thì vòng Adventure → công trình chạy sớm nhất). Người chơi sưu tầm nhiều heo đạt sớm hơn. Đề xuất: **16 hoặc 18** (một số trong `content/adventure/area.json`, sửa được ở Admin). Chưa đổi để không tự quyết số đã chốt trong decision 013.
