# 034 — Chuông thông báo thay khung "việc tiếp theo"; Aquarium sống động hơn

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án đồng ý cả 5 đề xuất của 033 và yêu cầu đổi khung gợi ý thành chuông (chờ duyệt bản làm)

## Chuông thông báo (mọi nơi)
- Khung "việc tiếp theo" giữa màn hình (chữ + "+n việc khác" + "Đi" + ✕) bỏ. Thay bằng **nút chuông tròn tím** ở góc phải,
  ngay dưới các nút vuông của HUD (`ui/goals/guideLayer.ts`).
- Huy hiệu trên chuông đếm **việc đang chờ** (độ ưu tiên ≥ 10, như "+n việc khác" cũ tính); màu theo việc gấp nhất
  (xanh / cam / đỏ), chuông rung nhẹ khi có việc đỏ (tắt khi giảm chuyển động).
- Bấm chuông mở **danh sách mọi thông báo** (`noticesVm`, gấp nhất trước), mỗi dòng có nút "Đi"; gợi ý (mục tiêu ngày, Area
  kế tiếp, nên đi đâu) hiện nhạt ở cuối. Bấm ra ngoài hoặc "Đi" thì đóng. Không còn nút ✕ ẩn gợi ý.
- NPC vẫn trích thông báo đầu tiên. Icon chuông vẽ SVG trong code tới khi có `ui_hud_bell`.

## Aquarium
- **Sạp hàng trong cảnh** (góc dưới phải của cả 5 nơi), bấm mở cửa hàng; vẽ bằng code tới khi có `bld_shop_aquarium`.
- **Bấm cá**: cá giật mình lao đi, cá thân (có tim) nhả tim lên, rồi thẻ cá mới mở (trễ ~0,35 giây).
- **Cá đói** thỉnh thoảng bơi lên mặt nước đớp (vòng gợn nhỏ) — thấy cá đói mà không cần nhìn icon.
- **Mưa / tuyết** gợn mặt nước; **đêm**: đom đóm bay trên mặt nước và ánh trăng lấp lánh trên mặt nước; biển sâu (cấp 5)
  có đốm phát sáng trôi trong nước.
- **Trứng nở**: vỏ trứng tách đôi văng ra, lấp lánh, cá con xuất hiện tại chỗ trứng.
- **Câu được**: cá (hoặc ngọc trai) nhảy khỏi mặt nước cạnh chỗ câu theo đường cong rồi bay vào nút Vật phẩm; chạy khi đóng
  hộp thoại câu (giao diện ghi lại kết quả của lần quăng, cảnh lấy ra khi không bị che).
- Ảnh cần: `art_inbox/.batch/aquarium-03-fx/PROMPT.md` sheet S (sạp + chuông).
