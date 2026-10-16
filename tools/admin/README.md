# tools/admin — bảng quản trị Sobi World

Công cụ dev: `npm run admin` → http://localhost:5175/admin.html. Không có trong bản build cho người chơi (ARCHITECTURE §10).
API ghi file ở `scripts/admin/` (plugin Vite, chỉ chạy khi `serve`). Quyết định: A7-1, AD-1, AM-1, **036**.

| Trang | File | Ghi gì |
|---|---|---|
| Tổng quan | `overview.ts` | — (đọc content, save, asset) |
| Người chơi | `users.ts`, `userDetail.ts`, `userTabs.ts`, `userFarm.ts`, `userParts.ts`, `userDraft.ts`, `liveSection.ts` | `save.json` của từng thư mục save (backup trước) |
| Nội dung game | `contentPage.ts` + form `schemaForm.ts` / `schemaModel.ts` / `fieldLabels.ts` / `idNames.ts` | mọi file trong `scripts/admin/contentCatalog.ts`; tên vật phẩm / trang trí / thành tựu vào `src/i18n` |
| Giống heo, Kiểm tra dữ liệu | `pigList.ts`, `editor.ts`, `validation.ts`, `store.ts` | `content/farm/species.json`, manifest |
| Phối giống, Cửa hàng Farm, Bố cục, Mùa, Ngày / Đêm | `breeding*.ts`, `products.ts`, `layout*.ts`, `seasons.ts`, `dayNight*.ts` | file content tương ứng |
| Asset nguồn / Thư viện, Bản desktop, Hướng dẫn | `assets.ts`, `library.ts`, `desktop.ts`, `guide.ts` | ảnh heo + manifest |

Quy tắc:
- Save người chơi chỉ sửa qua `worldEdits.ts` (WorldSave → WorldSave): tiền qua `changeCurrency` (giao dịch ADMIN_ADJUST), kết quả kiểm bằng
  schema thế giới + schema save từng khu + bộ đọc save của game. Sửa riêng Nông trại: `farmEdits.ts` chạy trên `farmOf` / `withFarm`.
- Nội dung: form dựng từ zod schema của game (`z.toJSONSchema`); server (`scripts/admin/contentSave.ts`) kiểm schema, không cho xoá id đã
  phát hành, sinh lại `content/schemas/ids.generated.ts`, nạp lại mọi module content của game; lỗi thì khôi phục mọi file.
- Server admin **không hot-reload** (`vite.admin.config.ts`): trang tự tải lại sau lần lưu của chính nó (`store.ts` `rememberMessage`).
  Sửa code admin thì bấm F5.
- Chữ của admin là tiếng Việt viết thẳng ở đây (công cụ dev, không qua `src/i18n`).
- Test: `tests/scripts/admin*.test.ts`, `tests/unit/adminData.test.ts`.
