# 036 — Trang Admin cho cả Sobi World: Nội dung game theo schema, người chơi theo save thế giới

**Ngày:** 2026-10-17 · **Trạng thái:** Chủ dự án yêu cầu làm lại trang admin (quản lý, sửa mọi game / user, sửa lỗi sửa item / user, UX tốt); chờ duyệt bản làm

## Bối cảnh — lỗi tìm thấy
- **API ghi file hỏng:** `scripts/admin/api.ts` còn nạp 4 module ở đường dẫn trước khi Farm thành Area
  (`src/core/config/breeds.ts`, `breedingPairs.ts`, `src/core/engine/breedingOdds.ts`, `seasonFx.ts`): lưu giống heo, luật cặp,
  di truyền / công thức và hiệu ứng mùa đều trả 500.
- **Sửa người chơi không lưu được:** trình sửa save kiểm bằng schema Sobi Farm v7 (`farmGameSchema`), chỉ biết loại giao dịch của
  Nông trại → save nào có giao dịch Garden / Aquarium / Cloud / Adventure đều bị báo lỗi và nút Lưu bị khoá. Trình sửa chỉ nhìn
  thấy Nông trại (không có Ngọc, khu khác, KN từng khu, Codex theo loại…). Hai bước "Áp dụng" rồi "Lưu" dễ quên bước đầu.
- **Sửa item hạn chế:** trang "Số liệu" chỉ cho đổi con số (không đổi loại / độ hiếm / công dụng, không bật trường tuỳ chọn như giá
  bán, không thêm vật phẩm, không sửa tên — tên nằm ở `src/i18n`), một form khổng lồ 40 file, ô trống thành 0 im lặng; 12 file content
  mới (lai giống, tên cá, hành vi heo, quà, nhân vật, khu…) không có chỗ sửa.
- **Mất bản nháp:** server admin tự tải lại trang khi bất kỳ file nguồn nào đổi (Vite HMR) → đang sửa dở mà ai đó sửa code là mất.

## Lựa chọn
1. **Nội dung game (`#/content`)** thay "Số liệu": danh mục mọi file `content/` (`scripts/admin/contentCatalog.ts`) theo khu; file có
   trang riêng (giống heo, cửa hàng Farm, phối giống heo, bố cục, ngày / đêm, mùa) dẫn sang trang đó. Form **dựng từ chính zod schema
   của game** (`z.toJSONSchema`, `tools/admin/schemaForm.ts` + `schemaModel.ts`): số (gợi ý thời lượng "≈ 2 ngày"), chữ, công tắc,
   chọn từ danh sách id (kèm tên), trường tuỳ chọn thêm / bỏ, giá trị null, union; danh sách dài = danh sách tìm được + chi tiết;
   danh sách ngắn = bảng sửa tại chỗ; thêm / nhân bản / xoá / đổi thứ tự dòng. Kiểm tra trực tiếp bằng schema khi gõ.
2. **Lưu content (`POST /__admin/content`, `scripts/admin/contentSave.ts`):** schema của file → không xoá id đã phát hành
   (`ids.generated.ts`; save giữ chúng) → sinh lại danh sách id → dòng có tên trong bảng chuỗi phải có tên Việt + Anh → **nạp lại mọi
   module content của game** (kiểm chéo). Bước nào lỗi thì khôi phục mọi file đã chạm.
3. **Tên vật phẩm / trang trí / thành tựu** sửa cạnh dòng: ghi khối `shop` / `decor` / `achievements` của `src/i18n/vi.ts` và file
   tiếng Anh tương ứng (`scripts/admin/i18nText.ts`, giữ đúng định dạng dòng `    KEY: "…",`).
4. **Người chơi = save thế giới** (`tools/admin/worldEdits.ts`): kiểm bằng `worldSaveSchema` + schema save của từng khu + bộ đọc save
   của game. Tab: Tổng quan · Ví (3 loại tiền, mỗi lần đổi = một giao dịch ADMIN_ADJUST qua `changeCurrency`) · Túi đồ (mọi vật phẩm,
   ảnh, lọc loại) · Tiến trình & khu (KN từng khu, mở / khoá khu — mở thì tạo dữ liệu khởi đầu, bộ đếm, quà ngày) · Bộ sưu tập &
   thành tựu · mỗi khu một tab (Farm: bảng heo + hộp thoại sửa có năng lượng / thân thiết / mục đích / ốm; khu khác và "Dữ liệu Nông
   trại": form theo schema save của khu) · Thế giới & thời gian (lịch + công tắc thử, tua thời gian **mọi khu**, Bảng đơn) · Nâng cao
   (JSON cả save, tải bản nháp, reset / xoá vào backups). Mỗi thay đổi áp ngay (không còn "Áp dụng"); lỗi game sẽ từ chối hiện trên
   đầu và khoá Lưu; game tự lưu xen giữa thì thay đổi được áp lại lên bản mới (như trước).
5. **Admin không hot-reload** (`vite.admin.config.ts` `hmr: false`): trang chỉ tải lại sau lần lưu của chính nó (hỏi trước nếu còn
   nháp khác); nháp Nội dung game giữ trong sessionStorage; kết quả lưu nhớ ở server theo mã yêu cầu.
6. Giao diện: tông tím–kem của HUD Sobi World, sáng / tối, menu theo nhóm (chấm vàng = còn thay đổi chưa lưu), Tổng quan theo 5 khu,
   vừa khổ điện thoại 375 px.

## Không làm / để sau
- Chữ tiếng Anh của file content (`content/i18n/en.json`) chưa sửa trong form (vẫn theo hướng dẫn "Ngôn ngữ").
- Xoá id đã phát hành bị chặn (đặt `enabled` / `active` = false nếu file có).
- Trang cũ (giống heo, phối giống, cửa hàng Farm, bố cục, mùa, ngày / đêm, asset) giữ cách làm, chỉ sửa lỗi và đổi tông.
