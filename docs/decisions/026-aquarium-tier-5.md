# 026 — Sobi Aquarium: cấp bể 5 "Đại Dương Sâu" và 5 môi trường theo cấp bể

**Ngày:** 2026-10-13 · **Trạng thái:** Đã thêm cấp 5 vào content (2026-10-17) với số đề xuất bên dưới; sửa được ở Admin

## Bối cảnh
Kế hoạch art Aquarium (`asset/AQUARIUM_ART_PLAN.md`) cho mỗi cấp bể một môi trường riêng: Bể Kính Bên Bến → Hồ Đá Ven Bờ → Đầm San Hô Sinh Thái → Vịnh Ngọc Trai Cổ. Agent đề xuất dừng ở 4 cấp vì đang freeze gameplay (decision 021). Chủ dự án quyết định thêm cấp 5 "Đại Dương Sâu", tức là mở băng riêng cho phần này (giống Cloud ở decision 023).

## Quyết định
- **Bể có 5 cấp.** Mỗi cấp bể là một môi trường. Nâng cấp bể thì thay môi trường (cá, trứng, vảy giữ nguyên). Bố cục màn chơi giống nhau ở mọi cấp.
- **Cấp 5 (đề xuất):** sức chứa 20 cá; 20.000 Sobi Coin + 40 vảy + 5 ngọc trai + 8 bánh răng cổ; hệ số nước đục ×0,5. Chỉ dùng vật liệu đã có, không thêm vật phẩm hay cơ chế mới.
- **Cảnh cấp 5 chìm hẳn dưới nước** (chủ dự án yêu cầu, sau mock đầu vẫn có mặt nước): không mặt nước, trời hay bờ. Chỗ bấm vẫn giữ vị trí: bảng "Bể cá" bên trái (cắm trên gờ đá), chỗ câu ở góc phải trên là dây câu thả từ trên xuống (`bld_fish_line_deep` thay `bld_fish_dock` ở cấp này). Mini-game câu cá không đổi.
- Cách làm: thêm một dòng vào `tank.levels` của `content/aquarium/balance.json`. Code lấy số cấp từ content (`MAX_TANK_LEVEL = levels.length`; schema save cho phép `level` ≤ số cấp). Save cũ không cần migration. Thêm tên 5 môi trường vào bảng chuỗi (Việt / Anh).

## Không đổi
Cá, câu cá, chăm sóc, cho đẻ, vảy, giá cá, 4 cấp bể có sẵn.

## Việc còn lại
- Chủ dự án duyệt số của cấp 5. Sau đó: thêm dòng vào content, test (nâng cấp 4 → 5, save cũ, `nextTankLevel` ở cấp 5 trả null), chạy bot `sim:week` để xem bao lâu thì lên được cấp 5.
- Art: `bg_aquarium_t5`, tiền cảnh `fg_aq_t5_*`, sứa trang trí; prompt ở `asset/AQUARIUM_ART_PLAN.md` §5.2 (T5) và §5.7 (AQ-FG5).
