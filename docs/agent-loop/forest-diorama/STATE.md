# STATE — forest-diorama (6 map vùng Rừng sang Diorama 2.5D, chạy trong game)
Nhánh: map-diorama-forest (tách từ new-ideas/update-3d-adventure @ 2ad31ee6)   Commit xanh gần nhất: (M0)
Mốc hiện tại: M3 — renderer dùng chung + Bìa Rừng trong game   Vòng: 1/3
Đang làm: (chuẩn bị M3a)
Brief đang chạy: xem mục "Brief M1" cuối file.
Xong: M0 ✅ 237df342 | M2 ✅ 3be15092 (kèm ảnh chr_so_down_idle đã sửa) | M1 ✅ (commit sau) check xanh 2127/2127
Còn lại: M3a chuyển module + blockerPlan + lab 6 map → M3b MapRenderer/ClassicRenderer → M3c DioramaRenderer trong game + cài đặt → chơi thử Bìa Rừng → M4 deep, heart, hollow, falls, marsh → M5
Điểm reviewer: —   FPS: —
Lỗi đang mở: — (đỏ sẵn rỗng). Báo chủ dự án: layout.json khôi phục 15 chỗ đặt decor mất ở 141e330e, kiểm chồng hình trong Admin.
Chờ chủ dự án: —
Ghi chú: `package-lock.json` (sửa) và `studio/` (chưa track) có sẵn trước phiên, không thuộc việc này — KHÔNG commit.

## Brief M1
(coder sonnet) Sửa hết đỏ sẵn của `npm run check`, không đổi gameplay/số cân bằng/save:
1. guard: src/areas/adventure/scene/AdventureScene.ts 311 dòng > 300 → tách phần hợp lý sang module mới trong cùng thư mục, không đổi hành vi.
2. tests/unit/assets.test.ts:128 (A4 decor cắt sai cỡ) và tests/unit/decor.test.ts:74 (DECOR_HAY_BALE thiếu chỗ đặt [0,1,2]) — tìm nguyên nhân thật; sửa dữ liệu layout/asset nếu đó là lỗi dữ liệu, không nới test bừa.
3. tests/scripts/assetsCheck.test.ts: beforeEach chép cả public/assets 561 MB → chỉ chép phần test cần (manifest + thư mục liên quan) hoặc fixture nhỏ; giữ nguyên ý nghĩa test.
4. tests/unit/phase11.test.ts:248 quá giờ khi chạy cả bộ → timeout riêng cho test đó (không đổi số cân bằng trong content/; nếu buộc phải đổi → DỪNG, báo).
5. public/assets/props/chr_so_down_idle.png: `git show 3b10d833:public/assets/props/chr_so_down_idle.png` để khôi phục.
Không commit. Báo ≤ 25 dòng.

## Brief M2 (chạy song song M1 — chỉ ghi docs)
(designer opus) Viết: docs/decisions/064-diorama-forest.md (đi tiếp Diorama theo cổng G0 chủ dự án đã quyết, phạm vi 6 map Rừng, lý do, ngoài phạm vi);
docs/maps/MAP_SCENE_STANDARD.md (hợp đồng cảnh, bảng chất liệu vùng Rừng, camera, ánh sáng, thước 10 điểm §2.5 nghiêm như SKILL_ANIMATION_STANDARD §7, ngưỡng > 7,5, quy trình chụp/chấm);
docs/agent-loop/forest-diorama/design.md (kiến trúc: renderer dùng chung đặt ở đâu theo ARCHITECTURE + guard, cách gắn AdventureScene, cài đặt Diorama/2D + Đẹp/Nhẹ + tự rơi Nhẹ; hợp đồng cảnh 6 map; danh sách kiểm đánh số).
