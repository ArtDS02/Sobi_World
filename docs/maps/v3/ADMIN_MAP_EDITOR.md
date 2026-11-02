# Admin "Cập nhật bản đồ" — yêu cầu (chưa làm)

Ngày ghi: 2026-11-02 · Trạng thái: **chủ dự án nêu hướng, làm sau** khi đã có layout + nền v3 của các map (decision 046). Mục tiêu: chỉnh từng map bằng tay cho hợp lý nhất, thay cho việc agent đặt vật bằng script.

## Chủ dự án muốn

1. **Chọn map** (18 map, kể cả map chưa chuyển v3).
2. **Bật lưới 40 px** chồng lên ảnh nền; **tô ô chặn / đi được** (va chạm), như mask đang duyệt bằng ảnh overlay.
3. **Kéo thả asset** lên map, **đặt kích thước** từng asset.
4. **Đánh dấu asset là lớp che** (ẩn hẳn khi đội đi vào phạm vi của nó, như `covers` hiện tại).
5. **Đặt vị trí cổng dịch chuyển** (portal), điểm xuất phát, lối ra; và các vật gameplay (rương, cổng hệ, nhóm quái, suối, câu đố, NPC, bia lore…).
6. **Thêm ảnh asset mới và đặt tên** ngay trong Admin.
7. Nói chung: tùy chỉnh mọi thứ để ra map phù hợp nhất.

## Ghi chú kỹ thuật (đề xuất, chốt khi làm)

- Mở rộng màn có sẵn `tools/admin/adventureMaps.ts` ("Bản đồ khu": đã vẽ lưới, tô ô, di chuyển vật, chạy `mapProblems` mỗi lần đổi và chặn lưu khi có lỗi) thay vì làm màn mới từ đầu; lưu qua dev API như các màn Admin khác. Admin không vào bản build.
- Dữ liệu cần thêm (chỉ thêm, tùy chọn) vào `maps.json` → `scene`: `scenery[]` = asset trang trí đặt tay (`art`, tọa độ chân theo ô, rộng, lớp `ground` / `world` / `canopy`, ô chặn `foot`, lật, `cover: true` = ẩn khi đội vào phạm vi). Vật gameplay giữ trường cũ (id không đổi).
- Thêm ảnh: chép PNG vào `art_inbox/`, thêm hàng manifest (`props`, id snake_case), chạy `art:process` (tách nền, cắt chân) — qua dev API.
- Kiểm tra giữ như hiện tại: `mapProblems` + `mapGraph` (lối ra hai chiều) trước khi cho lưu.
- Thứ tự gợi ý: (1) ảnh nền + lưới + tô ô chặn, (2) kéo thả / đổi cỡ asset trang trí + lớp che, (3) vật gameplay + portal / lối ra (sửa `arriveX/Y` hai phía tự động), (4) thêm ảnh asset.

## Trước khi làm màn này

Tiếp tục chuyển các map sang v3 theo vùng để có layout và logic mẫu (`docs/maps/v3/M2_PLAN.md` §4b): Rừng (batch `adventure-16-forest-3q`) → Núi → Tàn Tích → Biển. Vị trí / kích thước asset do script đặt chỉ là tạm, sẽ chỉnh lại bằng màn này.
