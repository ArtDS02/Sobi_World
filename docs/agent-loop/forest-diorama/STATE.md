# STATE — forest-diorama (6 map vùng Rừng sang Diorama 2.5D, chạy trong game)
Nhánh: map-diorama-forest (tách từ new-ideas/update-3d-adventure @ 2ad31ee6)   Commit xanh gần nhất: (M0)
Mốc hiện tại: M3 — renderer dùng chung + Bìa Rừng trong game   Vòng: 1/3
Đang làm: (chuẩn bị M3a-perf: FPS Đẹp Bìa Rừng 31–45, Nhẹ 42–70; G0 ghi 60)
Brief đang chạy: xem mục "Brief M1" cuối file.
Xong: M0 ✅ 237df342 | M2 ✅ 3be15092 (kèm ảnh chr_so_down_idle đã sửa) | M1 ✅ (commit sau) check xanh 2127/2127 | M3a ✅ (commit này) module diorama ở src/areas/adventure/scene/diorama, blockerPlan+test, lab 6 map, --map
Còn lại: M3a chuyển module + blockerPlan + lab 6 map → M3b MapRenderer/ClassicRenderer → M3c DioramaRenderer trong game + cài đặt → chơi thử Bìa Rừng → M4 deep, heart, hollow, falls, marsh → M5
Điểm reviewer: —   FPS: edge M3a Đẹp 38/45/39/39/33/31, Nhẹ 57/70/57/56/44/42 (headless --gpu)
Lỗi đang mở: M3a FPS 28–38 headless --gpu (G0 ghi 60) — đang kiểm. Mép sắc hơn G0 (WARP_MAX 0,12) để khớp ô ≤0,25. Báo chủ dự án: layout.json khôi phục 15 chỗ đặt decor (141e330e).
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

## Brief M3a (coder sonnet)
Đọc design.md §A1, A2, A5 + MAP_SCENE_STANDARD.md. Chuyển tools/admin/diorama/* (trừ dioramaLab.ts, diorama.css) sang src/areas/adventure/scene/diorama/
theo bảng A1 (world.ts → dioramaView.ts; creatures.ts → foes.ts; dress tách 2; party bỏ walk; walk.ts xóa; thêm contracts.ts đủ 6 map theo §C,
quality.ts để M3c). field.ts: ký tự w/c, ô chặn từ blockedTiles, uốn nhiễu ≤0,25 ô. blockerPlan thuần + test (6 map: 100 % ô chặn có vật, 0 gốc trên ô đi được).
Asset qua resolver art(id). Lab: chọn 6 map, labDriver đi bằng walkableOf+stepCharacter, window.diorama giữ; scripts/maps/* thêm --map <id>|all.
Chưa gắn vào AdventureScene (M3b/M3c). Mỗi file ≤ 300 dòng. Tự kiểm typecheck/lint/guard + test mới. Không commit. Báo ≤ 25 dòng.

## Bài học sự cố (2026-11-19)
- Không nối junction/symlink node_modules vào worktree tạm: xóa worktree đã xóa luôn node_modules thật. Brief sau: worktree tạm dùng `npm ci` riêng hoặc không dùng worktree.
- Báo cáo vòng 2 của coder M3a bị mất (handback lần 2 bị từ chối) — đo FPS lại bằng checker.
