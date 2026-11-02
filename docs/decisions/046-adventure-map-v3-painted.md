# 046 — Adventure: bản đồ v3 — nền vẽ liền một tấm 3/4, camera ×1, layout mới mọi map (pilot M2)

Ngày: 2026-11-02 · Trạng thái: **Lượt 2 xong, chờ chủ dự án duyệt mask M2**. Đầu vào: `docs/maps/SOBI_ADVENTURE_NEW_MAP_DIRECTION.md` v1.1, kế hoạch `docs/maps/v3/M2_PLAN.md`. Thay phần "map vẽ bằng bộ ghép" của decision 045 cho các map đã chuyển.

## Đã chốt (chủ dự án, 2026-11-02)

- Làm lại layout **mọi map** (không giữ bố cục v2); **M2 Rừng Sâu làm thử trước**, duyệt xong mới nhân rộng theo vùng (Rừng → Núi → Tàn Tích → Biển).
- Camera `fitZoom × 1.5` toàn game (tài liệu định hướng). **Sửa 2026-11-02 sau khi xem ảnh:** chủ dự án đổi về **× 1** (zoom vừa khung, ≈ 40 × 22 ô ở khung 1600 × 900) vì phóng to làm nền vẽ bị mờ.
- **Lớp che** (`covers`): đội đứng dưới thì lớp che **ẩn hẳn** (alpha 0, trước là 25 %) để thấy rõ địa hình bên dưới; bước ra thì hiện lại (mờ dần như cũ).
- Chủ dự án tự tạo ảnh bằng Gemini web; agent làm hint, prompt, xử lý, tích hợp.

## Lựa chọn kỹ thuật

- **`maps.json` → `scene` (tùy chọn, chỉ thêm):** `art` (gốc id manifest), `px` (64 px nguồn / ô), `chunks` [cột, hàng], `elevation` (độ cao 0–9 mỗi ô, chỉ để trình bày). Map có `scene` vẽ nền một tấm (`scene/mapScene.ts`: `sceneChunks`, `layScene`, `PaintedArt`); map chưa có vẫn vẽ ô ghép như cũ. `terrain` vẫn là va chạm. Khi cả 18 map có `scene` thì bỏ renderer ô ghép (decision riêng).
- **Ảnh nền:** ảnh Gemini → xóa dấu sao, phóng Lanczos về 64 px / ô (M2: 4096 × 2304), unsharp nhẹ, cắt khối ≤ 2048 trên ranh ô từ **cùng một ảnh** (`scripts/art/map_v3/bg_prepare.py`). Khối ở `public/assets/environment/adventure_v3/`, PNG (M2: 4 khối, 9,8 MB, 37,7 MB VRAM). Không nạp lúc khởi động (lọc như art chỉ-trận ở `textureKeys.ts`); Adventure nạp khi vào khu, giữ qua trận / Trại, thả khi vào khu khác.
- **Map vẽ:** bỏ bóng tường theo ô, hàng cây khung, decal rắc, đạo cụ dọc đường (đã có trong tranh); giữ viền thế giới, ánh sáng, mây, đom đóm, vật, nhóm quái, lối ra, lớp che, tha hóa.
- **Mask:** `propose_mask.py` phân loại màu từng ô của tranh (đường / cỏ / nước / rừng) + vùng chỉnh tay (gò rêu, bậc, cầu, cổ hẹp của hai túi bí mật); `overlay.py` xuất ảnh duyệt; `m2_apply.py` ghi vào `maps.json`.
- **Camera:** `scene/mapCamera.ts` `EXPLORE_ZOOM = 1` (≈ 40 × 22 ô ở khung 1600 × 900; nền 64 px / ô hiện ở ~0,6 nên luôn được thu nhỏ, không bị phóng); khoảng chừa HUD giữ 270 / 70 px màn hình. `fitZoom` và `ADVENTURE_DESIGN` chuyển sang `mapCamera.ts`.

## M2 layout v3 (giữ id, số lượng, loại, hành vi)

- Mọi đối tượng đặt lại theo tranh; hai cổng `gate_f2_vines`, `gate_f2_boulder` rộng **2 ô** (lối mòn trong tranh rộng 2 ô; id, hệ, kiểu giữ nguyên).
- Lối ra: tây (0,21), đông (63,7), nam (43,35). Phía bên kia đổi `arriveX/Y`: `exit_f1_east` → (1,21), `exit_f3_west` → (62,7), `exit_n5_west` → (43,34).
- `mapProblems` mọi map + `mapGraph` sạch. Save không đổi cấu trúc; chuyến dở đứng ở ô nay bị chặn về spawn (`settleWalker`). Sương mù `explored` của M2 **giữ nguyên** (chưa duyệt việc xóa; bản đồ nhỏ có thể hiện sai vài vùng tới khi đi lại).

## Nhân rộng (2026-11-02)

- Mask M2 duyệt. Làm tiếp theo vùng để có layout + logic mẫu; props từng map để sau, chỉnh bằng màn Admin "Cập nhật bản đồ" (`docs/maps/v3/ADMIN_MAP_EDITOR.md`).
- Bộ công cụ chung `scripts/art/map_v3/layout_v3.py` (địa hình bằng hình khối, đặt vật tự động vào khu, điểm tới hai chiều, hint / guide / PROMPT); vùng Rừng: `forest_v3.py`, batch `adventure-16-forest-3q`. Lối ra ra khỏi vùng giữ ô cũ để map vùng khác không đổi.

## Vùng Rừng vào game (2026-11-02)

- 5 nền (M1, M3, N1, N2, N3) từ batch `adventure-16-forest-3q` nhập bằng `scripts/art/map_v3/import_v3.py` (công cụ chung cho các vùng sau): ngưỡng cỏ / rừng theo **Otsu trên độ sáng từng tranh** (tranh sáng tối khác nhau), gò / vách / bậc / thác nhận quanh phần nâng của bản nháp, cầu ván quanh cầu của bản nháp, nước chỉ nhận gần nước của bản nháp (trời không thành hồ); lối ra đặt theo lối mòn vẽ chạm mép (lối ra khỏi vùng giữ ô, khoét lối mòn tới); mọi vật dời về ô hợp lệ gần chỗ cũ; **cổng hệ đặt ở chỗ hẹp nhất** trước đúng những gì nó chặn trong bản nháp, rộng bằng chỗ hẹp đó (M1 6 ô, N1 / N2 3 ô); lớp che đi theo rương ẩn; **cổng dịch chuyển cạnh điểm xuất phát** (≤ 4 ô).
- Kiểm: `mapProblems` mọi map + `mapGraph` sạch; mỗi cổng chặn đúng như bản nháp; câu đố không sau cổng; rương ẩn dưới lớp che. Test vách đổi sang map dựng trong test (Thác Rêu nay là nền vẽ).
- Ngoài mép map có nền vẽ: màu tối trơn của vùng (thay ô tường cũ dạng pixel).
- Tranh M3 không vẽ lối mòn ra mép phải (lối sang Chân Núi): mask khoét lối mòn tới mép, chờ Admin đặt vật che / chủ dự án vẽ lại. N1 vẽ nấm, vòng đá, bụi gai trong nền (được tính như đất đi được / chặn theo màu).

## Vùng Núi — bản nháp (2026-11-02)

- Mask vùng Rừng duyệt. `mountain_v3.py`: layout mới M4, M5, M6, N4, N5 (ở Núi `~` là dung nham: hint tô cam, nhập nhận màu dung nham). Lối sang Tàn Tích (M6, N4, N5) giữ ô. Bản nháp sạch `mapProblems` + `mapGraph`; mỗi cổng chặn đúng như cũ. Gói `art_inbox/.batch/adventure-17-mountain-3q/`.
- Bộ công cụ: hint / PROMPT theo vùng (bảng màu, lời tả); điểm tới không tính từ lối ra nằm trong map (map cũ đặt lùi khỏi mép).

## Tàn Tích + Biển — bản nháp (2026-11-02)

- `ruins_v3.py` (M7, M8, M9, N6) và `coast_v3.py` (N7, N8, N9): layout mới, giữ id / số lượng / loại / hành vi; lối ra giữ cạnh, giữ ô chỗ nối với Núi / Đầm Sương. Cả 12 bản nháp chưa nhập (Núi, Tàn Tích, Biển) kiểm chung: `mapProblems` + `mapGraph` sạch; cổng chặn đúng.
- Bộ công cụ: cổng đặt tự động ở chỗ hẹp nhất trước khu nó chặn (`gate_in`); vật đứng không được cắt rời phần nào của map (hải đăng trên đầu bậc, xác tàu ngang dải cát); bãi cát nổi (`sandbar`); bảng màu Tàn Tích / Biển.
- Gói ảnh một lượt: `art_inbox/.batch/MAP_V3_RENDER_ALL.md` → `adventure-17-mountain-3q`, `adventure-18-ruins-3q`, `adventure-19-coast-3q`.

## Núi, Tàn Tích, Biển vào game (2026-11-02)

- 12 nền nhập bằng `import_v3.py`; cả 18 map nay có `scene`.
- Tranh có thể vẽ khác hint, nên mask theo tranh trước:
  - dung nham nhận theo màu ở mọi chỗ;
  - cầu vẽ thêm nhận theo hình;
  - khu đất bị tách nối qua khe ≤ 3 ô;
  - đá xanh xám không là nền.
- Vật đứng, cổng dịch chuyển không cắt rời đất (mất tối đa vài ô ngách cụt). Cổng hệ không có chỗ hẹp trước khu cũ thì dời đồ nó canh vào một ngách cụt có cổ hẹp (giữ ngữ nghĩa "cổng chặn đúng những thứ đó").
- Kiểm trên nội dung thật: `npx tsx scripts/art/map_v3/check_live.ts`.

## Hệ quả / còn lại

- Lượt 3: props / landmark / tán che v3 (P1 cần vẽ lại vì ra pixel art), lớp tha hóa mềm thay màn ô vuông, sort theo chân + làm mờ cây che, hidden passage với tán mới.
- Nền phóng ×3 từ 1376 × 768 hơi mềm khi xem gần; nếu cần: tạo lại BG ở 2K/4K hoặc lượt vẽ chi tiết theo mảnh (M2_PLAN §7).
