# 031 — HUD dùng chung cho các Area và cửa hàng làm lại

**Ngày:** 2026-10-16 · **Trạng thái:** Agent làm theo yêu cầu của chủ dự án (prompt `art_inbox/.batch/hud-01/PROMPT.md`); chờ duyệt

## Bối cảnh
Chủ dự án thấy HUD và cửa hàng của các game "không đẹp, không phù hợp", che mất cảnh. Đo trên game: HUD Garden / Cloud là viên trắng chữ, nút chữ, thanh dưới Cloud cao 2 hàng (190 px ở 1600 × 900) che thanh tên tầng và mũi tên đổi tầng; 6 nút thao tác cùng một mức nổi bật, lý do tắt là dòng chữ nhỏ rời dưới nút; chip thời tiết / lễ hội / thương nhân xếp cột che Máy xay và Chuồng heo. Cửa hàng không có số dư, không có nút đóng ở góc, cả cửa sổ cuộn, nút mua nhỏ, không nói lý do khi tắt. Mỗi Area có HUD viết riêng (Garden, Cloud, Aquarium, Adventure), CSS lặp nhau.

## Quyết định
- **Một bộ HUD dùng chung** (`ui/components/areaHud.ts`, `styles/features/_areahud.scss`), theo HUD tím của Sảnh / Aquarium (decision 024, 030) mà chủ dự án đã chọn: viên Sobi Coin có icon, viên cấp có ngôi sao + thanh KN, nút vuông tím có icon (Ra Sảnh `ui_hud_hub`, Cửa hàng `ui_btn_shop`, Vật phẩm `ui_hud_bag`, Menu `ui_hud_menu`). Garden, Cloud, Aquarium, Adventure và Farm dùng chung; id ảnh ở `AREA_HUD_ART` (`core/config/assetIds.ts`).
- **Thanh dưới một hàng**, chia vùng có nhãn nhỏ: *Chọn hạt giống / Chọn hoa* (thẻ hạt: ảnh, tên cắt "…", giá có icon xu, huy hiệu "có n"; thẻ đang chọn có dấu ✓ + viền xanh, không chỉ dựa vào màu; nhiều thẻ thì cuộn ngang, con lăn chuột cuộn ngang, mép phải mờ báo còn nữa) → *Chăm sóc* (Hứng nước, Tưới cả vườn, Bón phân tất cả) → *Thu hoạch & gieo* (Hái / Thu hoạch hết, Gieo kín ô trống: xanh lá khi bấm được, icon gieo là hạt đang chọn) → *Mở rộng* (Mở khu / tầng: tím nhạt, nhỏ hơn, đứng cuối). Aquarium: ô trạng thái bể → *Chăm sóc* (Câu cá nổi bật, cho ăn, thay nước, thu vảy) → *Bể & cá*.
- **Thẻ tắt**: mờ + xám, ghi lý do ngay dưới nhãn ("⊘ Không còn ô trống"; 1 dòng ở cửa sổ nhỏ, 2 dòng từ 1280 px), tooltip đủ câu; vẫn focus được. Không đổi tên, gộp hay đổi điều kiện của thao tác nào (lý do lấy từ dry-run của action như trước). Nhãn "Gieo kín ô trống" bỏ phần "(Lúa mì)" vì icon thẻ đã là hạt đang chọn.
- **Chip thời tiết / lễ hội / thương nhân**: một hàng nhỏ thay cho cột. Dưới 1280 px chip chỉ hiện ký hiệu, rê chuột / focus thì mở chữ; trong Garden / Cloud / Aquarium chip lễ hội và thương nhân luôn chỉ hiện ký hiệu (tin ở Sảnh). Chữ vẫn là tooltip và tên cho trình đọc màn hình.
- **Cloud**: thanh tên tầng và hai mũi tên nâng 26 px thiết kế (y 706 → 680, mũi tên 712 → 686) để không bị thanh dưới che ở cửa sổ 1024 × 640.
- **Cửa hàng Garden / Cloud** (`shopGrid`): đầu cố định (tiêu đề, lời giới thiệu, viên **Số dư**), nút × tròn ở góc phải trên (hover xoay, Esc và bấm nền vẫn đóng); chỉ lưới cuộn; lưới tự chia cột (4 cột ở 1024 px trở lên, tối thiểu 2). Thẻ: nhãn loại (Hạt giống / Phân bón / Nước), "Đang có n", ảnh, tên (cắt "…"), mô tả 2 dòng, giá một cái có icon xu, 3 nút ×1/×10/×50 ghi tổng tiền; nút tắt xám phẳng và thẻ ghi lý do ("⚠ ×50: Thiếu Sobi Coin"). Bấm lặp trong 0,4 s bị bỏ qua (`guardBuy`), nút vừa bấm khoá tới khi thế giới cập nhật — một lần bấm không trả tiền hai lần. Số dư và "Đang có" đổi ngay sau khi mua; thông báo vẫn là toast của FeedbackDirector khi action thành công.
- **Cửa hàng Farm**: tab và **Số dư** dính trên đầu khi cuộn; thẻ nổi nhẹ khi rê chuột. Không đổi bố cục thẻ heo.
- Hover / nhấn: thẻ nổi 2 px, nhấn lún 1 px; chuyển động ngắn (150 ms), tắt theo `prefers-reduced-motion` và cài đặt "Giảm chuyển động".
- Không đổi logic, giá, content, save. Không thêm thư viện, không thêm ảnh mới (dùng `ui_*` có sẵn).

- **Farm** (chủ dự án chọn, 2026-10-16): thanh trên cũng sang bộ tím — viên cấp có sao, viên xu (bấm mở Lịch sử), viên máng có thanh (bấm đổ máng), viên số heo, cảnh báo heo bệnh, đồng hồ; viên đổi sang hồng khi máng trống / trại đầy / có heo bệnh (kèm chữ, không chỉ màu). Góc phải: nút vuông Ra Sảnh + **Menu** (thay nút ⚙: Cài đặt nằm trong Menu như các khu, Esc vẫn mở Cài đặt). Dock dưới: 5 thẻ kem có icon (Cửa hàng, Kho, Đơn hàng, Bộ sưu tập, Thành tích) trên khay trắng, chấm đỏ giữ nguyên. Bỏ CSS `.hud-pill` và kiểu kem–gỗ cũ.

## Còn mở
- Màn chuẩn bị của Adventure (thẻ khu, bạn đồng hành) chưa làm lại — để lượt art Adventure.
