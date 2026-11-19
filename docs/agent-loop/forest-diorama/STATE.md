# STATE — forest-diorama (6 map vùng Rừng sang Diorama 2.5D, chạy trong game)
Nhánh: map-diorama-forest (tách từ new-ideas/update-3d-adventure @ 2ad31ee6)   Commit xanh gần nhất: (M0)
Mốc hiện tại: M1 — sửa đỏ sẵn   Vòng: 1/3
Đang làm: coder (sonnet) — sửa 5 lỗi đỏ sẵn   (bắt đầu 2026-11-19)
Brief đang chạy: xem mục "Brief M1" cuối file.
Xong: M0 ✅ baseline (AGENT_LOOP §6)
Còn lại: M1 → M2 designer → M3 Bìa Rừng trong game → M4 deep, heart, hollow, falls, marsh → M5 kiểm tổng
Điểm reviewer: —   FPS: —
Lỗi đang mở (baseline): guard AdventureScene.ts 311>300; assets.test.ts:128 A4; decor.test.ts:74 HAY_BALE;
  phase11.test.ts:248 quá giờ khi chạy cả bộ (riêng: xanh); assetsCheck.test.ts quá giờ cả khi chạy riêng (beforeEach chép 561 MB);
  chr_so_down_idle.png là sheet 6 hình (khôi phục bản 3b10d833, 22 KB).
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
