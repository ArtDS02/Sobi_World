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
| Quản lý map, Mạng map, Map Editor, Thư viện asset, Publish / Lịch sử / Chạy thử / Xem bằng game (Map Builder, decision 047) | `mapPublish.ts` (thuần) + `mapPublishDialog.ts` (API `scripts/admin/mapPublishApi.ts`, `mapPreviewApi.ts`), `mapSimulate.ts`, `mapEditor.ts` (giao diện tối toàn màn hình, `mapEditor.css`, icon `mapEditIcons.ts`) + `mapEditCanvas.ts` (overlay vùng đi, lưới, marker lỗi) + `mapEditInspector.ts` + `mapEditModel.ts` (thuần) + `mapIssues.ts` (thuần, có test: lỗi map tiếng Việt, tên hiển thị, mức độ, ô), `mapAssetsPage.ts` (API `scripts/admin/mapAssets.ts`: `scenery.json`, `en.json`, ảnh + manifest), `mapManage.ts`, `mapNetworkPage.ts` + `mapNetwork.ts` (thuần: cạnh, bố cục, cảnh báo), `mapApi.ts` (API + hộp thoại dùng chung), `mapExits.ts` (lối ra, kết nối), `mapLinks.ts` (thuần: kết nối), `mapSpawns.ts` (điểm xuất hiện), `mapCanvas.ts` (vẽ lưới map; bảng đất ở `mapGround.ts`), `mapModel.ts` (thuần, có test) | bản nháp + ghi chú ở `tools/admin/data/adventure/` (`scripts/admin/mapDrafts.ts`); game không đọc tới khi publish |
| Bản đồ khu | `adventureMaps.ts` (`#/adventure-maps/<mapId>`) | `content/adventure/maps.json` (editor cũ, thay ở Map Builder GĐ6) |
| Asset nguồn / Thư viện, Bản desktop, Hướng dẫn | `assets.ts`, `library.ts`, `desktop.ts`, `guide.ts` | ảnh heo + manifest |

Dùng chung: `richSelect.ts` (dropdown có hình: `<select data-rich>` + `optionHtml(…, { img | swatch | icon, sub })`, select gốc vẫn giữ giá trị và sự kiện `change`), `mapThumb.ts` (ảnh thu nhỏ map, ảnh asset theo id), `guide.ts` + `guideWorld.ts` (hướng dẫn; nút ❔ mở popup `openGuide`, không đổi trang).

Quy tắc:
- Save người chơi chỉ sửa qua `worldEdits.ts` (WorldSave → WorldSave): tiền qua `changeCurrency` (giao dịch ADMIN_ADJUST), kết quả kiểm bằng
  schema thế giới + schema save từng khu + bộ đọc save của game. Sửa riêng Nông trại: `farmEdits.ts` chạy trên `farmOf` / `withFarm`.
- Nội dung: form dựng từ zod schema của game (`z.toJSONSchema`); server (`scripts/admin/contentSave.ts`) kiểm schema, không cho xoá id đã
  phát hành (cả id map / rương / lối ra… của Adventure: `scripts/admin/mapIds.ts`), sinh lại `content/schemas/ids.generated.ts`, nạp lại mọi module content của game; lỗi thì khôi phục mọi file.
- Server admin **không hot-reload** (`vite.admin.config.ts`): trang tự tải lại sau lần lưu của chính nó (`store.ts` `rememberMessage`).
  Sửa code admin thì bấm F5.
- Chữ của admin là tiếng Việt viết thẳng ở đây (công cụ dev, không qua `src/i18n`).
- Test: `tests/scripts/admin*.test.ts`, `tests/unit/adminData.test.ts`.
