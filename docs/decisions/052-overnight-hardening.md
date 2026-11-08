# 052 — Overnight hardening (2026-11-08)

## Bối cảnh
Đợt rà soát độ bền: số tiền không hữu hạn, ngoại lệ làm chết vòng lặp, ghi save chặn phản hồi, lỗi code bị coi như save hỏng.

## Quyết định
- **Tiền**: `postTransaction` từ chối amount/balance không hữu hạn (`INVALID_REQUEST`); `valueOf`/`weightFactor` luôn trả số hữu hạn.
- **Ngoại lệ**: `tick()` và `dispatch()` bọc try/catch; lỗi → `INTERNAL_ERROR` (toast tối đa 1 lần/phút), log `logs/error.log` (xoay vòng); state hỏng nửa chừng không được lưu. Renderer có màn lỗi (Tải lại / Chơi tiếp); main tự reload cửa sổ tối đa 3 lần / 5 phút.
- **Save**: exception lạ khi đọc/migrate = `SAVE_CODE_ERROR` (status `codeError`): file KHÔNG đổi tên, KHÔNG ghi đè. Slice Area sai schema được tạo lại bằng `init()` của Area (chỉ lấy slice, không tặng lại đồ khởi đầu); bản gốc giữ ở `saves/before-slice-repair-*.json` (ngoài vòng xoay), người chơi được báo. Áp cho cả slice Farm; chọn tạo lại thay vì lùi về backup cũ vì bản gốc còn nguyên để khôi phục tay.
- **Ghi đĩa**: `persister` gộp các lần ghi chờ thành 1 lần ghi state mới nhất; `dispatch` phát event ngay, ghi chạy nền; lỗi ghi vẫn hiện `saveError` và retry. Thoát app vẫn đợi `idle()`.
- `settings.json` ghi tuần tự + retry EPERM/EBUSY; `fs.watch` có handler lỗi; "sửa ngoài" so sánh hash nội dung; import kiểm tra JSON/kích thước trước khi backup; export atomic; `app://` 404 khi escape sai.
- Câu cá: Space/Enter chỉ bị chiếm khi pha cần phím và focus không ở control khác; listener gỡ khi đóng; rng đi qua `kit.rng()` (seed theo clock).
- Dọn phân khi đầy túi: XP giữ nguyên (theo mỗi đống như cũ), thêm thông báo rõ số đống bị bỏ.
