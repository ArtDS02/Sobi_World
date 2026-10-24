# QA checklist — animation & ảnh tham chiếu Adventure

Đánh dấu: ✅ đã kiểm (có bằng chứng) · ⬜ chưa · ⛔ bị chặn (ghi lý do). Kết quả lần chạy 2026-10-24 ghi sẵn.

## A. Bộ ảnh tham chiếu

| Kiểm | Cách | Kết quả |
| --- | --- | --- |
| Mọi màn có thật đã liệt kê | `sobi_adventure_audit.md` §2 | ✅ |
| Trạng thái truy cập được đã chụp hoặc có lý do | `00_index/screenshot_manifest_*.csv` | ✅ 43 trước / 56 sau, 2 ⛔ có lý do |
| File tồn tại, mở được, đúng 1600×900 | script ghi kích thước; mở thử 8 ảnh | ✅ |
| Manifest khớp file | cột `path` sinh từ chính file đã ghi | ✅ |
| Ảnh gốc không bị sửa | script chỉ ghi PNG thô; bảng ghép xem thử nằm ngoài thư mục | ✅ |
| Không lộ dữ liệu nhạy cảm | save thử nghiệm; banner xuất file đã ẩn | ✅ |

## B. Animation (vertical slice)

| Kiểm | Cách | Kết quả |
| --- | --- | --- |
| Không đổi anatomy / silhouette | dùng ảnh tĩnh gốc, chỉ transform | ✅ |
| Idle không giật điểm nối | keyframe 0% = 100% | ✅ (code) |
| Attack / cast có lấy đà, impact, hồi | `09_motion_slice/*poison_thorn*`, `*basic_attack*` | ✅ |
| Impact trùng sự kiện | test `the numbers land on the impact` + ảnh 600 ms | ✅ |
| Không che thông tin | VFX ≤ 6,5rem, mờ sau 460 ms; banner trên cùng | ✅ (ảnh) |
| Không sai damage / lượt / mục tiêu / hồi chiêu | animation chỉ đọc `run.log`; 1.481+ test logic xanh | ✅ |
| Fallback khi thiếu ảnh | toàn bộ slice đang chạy bằng fallback CSS | ✅ |
| Không khoá vô hạn | không có timer; Auto chờ tối đa 3,2 s | ✅ (test cap) |
| Hiệu năng | chỉ transform / opacity / filter; ≤ ~20 phần tử động mỗi bước | ⬜ chưa đo FPS bằng công cụ |
| Giảm chuyển động | CSS media + `.is-reduced-motion` | ✅ (code); ⬜ chưa chụp |
| Số bay khi bật Giảm chuyển động | — | ⛔ lỗi có từ trước (audit #5), chưa sửa |

## C. Tương thích / regression

| Kiểm | Kết quả |
| --- | --- |
| `npm run check` | ✅ xanh (110 file, 1.487 test) |
| Trận đầy đủ (Vết Nứt tầng 1, Tự động + x2 tới thắng) | ✅ trong script chụp |
| Thắng → màn giữa tầng → Rời Vết Nứt → Trại | ✅ |
| Thua trận | ⬜ |
| Save / API / gameplay | không đổi file logic / save (chỉ `ui/`, styles, scripts, docs) ✅ |

## D. Khi thêm art mới (mỗi asset)

- [ ] id đúng quy ước (`technical_pipeline.md`), dòng manifest `status: production`
- [ ] `npm run assets:check` xanh
- [ ] Chạy script chụp `--tag <asset>`; so với ảnh `_after` cũ
- [ ] Nhìn ở tốc độ x2 và thường; không loé, không che thanh máu
- [ ] Cập nhật `animation_inventory.csv` (`status`, `qa_status`) và `docs/ASSET_TODO.md`
