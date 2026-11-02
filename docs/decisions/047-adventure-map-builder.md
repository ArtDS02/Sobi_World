# 047 — Adventure: Custom Map Builder trong Admin (tạo / nối / sửa / publish / chạy thử map)

Ngày: 2026-11-02 · Trạng thái: **đã duyệt hướng** (chủ dự án, 2026-11-02); làm theo 8 giai đoạn ở `docs/maps/v3/MAP_BUILDER_AUDIT.md` §6, báo cáo sau mỗi giai đoạn.

## Bối cảnh

Chủ dự án muốn tự xây thế giới Sobi Adventure trong Admin: tạo map mới, đặt lối ra / điểm tới, nối các map, vẽ địa hình và đặt asset, lưu nháp, kiểm tra rồi publish — không phải sửa code cho từng map. Audit: `docs/maps/v3/MAP_BUILDER_AUDIT.md`.

## Đã chốt (chủ dự án duyệt mọi đề xuất §7 của audit)

1. **Một hệ map:** builder đọc / ghi đúng `content/adventure/maps.json` + `zones.json` (`mapSchema`). Trường mới chỉ thêm, tùy chọn; save không đổi phiên bản.
2. **Lối ra một chiều** được phép bằng cờ `oneWay` (lối shortcut vẫn cần một lối về thường). Người chơi luôn về Trại được nên không kẹt.
3. **Map và id đã publish không bị xóa, không bị tắt** — chỉ sửa. Save giữ map id, rương, cổng, lối ra, nhóm quái, lớp che, câu đố, lore. Admin chặn ở bước lưu (`contentSave`).
4. **Inactive / disabled chỉ là trạng thái nháp:** game không có cờ này; lối ra inactive không được publish.
5. **Va chạm của asset trang trí:** runtime đọc `scenery.foot` (không ghi đè `terrain`).
6. **Dữ liệu riêng của builder** ở `tools/admin/data/adventure/` (commit git, game không import): `drafts/<mapId>.json`, `meta.json`, `history/`.
7. Tách `maps.json` thành mỗi map một file: để sau, decision riêng khi vượt ~40 map.
8. **Thêm: chế độ chạy thử (mô phỏng).** Sau khi publish, Admin cho đi thử trong map bằng bàn phím, dùng chính luật đi của game (`walkableOf`, `canStand`, khóa lối ra, điểm tới) — không chạm save người chơi. Chạy thử bằng renderer thật trên save sandbox vẫn giữ ở GĐ7.
9. Chất lượng: builder là nơi chỉnh map lâu dài, nên logic thao tác (tạo, nhân bản, đổi id, tham chiếu, kiểm tra) là hàm thuần có test; UI chỉ gọi các hàm đó.

## Giai đoạn 2 (2026-11-02) — Quản lý map + kho nháp

- Trạng thái suy ra, không lưu: **published** = có trong `maps.json`; **draft** = chỉ có bản nháp; **tắt** = cờ `disabled` trong `meta.json` (chỉ map chưa publish). Map published có bản nháp = "có thay đổi chưa publish".
- Map mới: trống (viền chặn, đất giữa, spawn + cổng dịch chuyển ở giữa) hoặc **từ mẫu** (nhân bản một map). Nhân bản đặt id mới cho mọi vật (`chest_<slug>_1`…), sửa câu đố trỏ theo cổng mới, **bỏ lối ra** (kết nối không sao chép — tránh lối một chiều ngoài ý muốn).
- Map mới vào zone ở dạng **nhánh** (`zone.branches`) theo mặc định, vì đường chính có luật trùm / đi nhanh / bot.
- Id map sinh từ tên (bỏ dấu), sửa được chỉ khi map chưa publish và chưa có lối ra nào trỏ tới.

## Giai đoạn 3 (2026-11-02) — Điểm xuất hiện

- `maps.json`: `spawns[]` (tùy chọn: `id` `spawn_*`, `nameVi`, ô, `facing`) và `exits[].arrive` (spawn của map đích). `spawn_default` = `map.spawn` (cổng dịch chuyển, từ Trại).
- **Runtime không đổi:** game vẫn đọc `arriveX/Y` + `facing` của lối ra. Schema bắt khớp: lối ra có `arrive` thì spawn phải tồn tại, ô và hướng phải đúng của spawn. Builder ghi lại ô / hướng khi publish (`resolveArrivals`).
- 50 điểm tới cũ của 18 map được đặt tên `spawn_from_<map nguồn>` bằng `scripts/content/nameArrivals.ts`: **cùng ô, cùng hướng** game đang quay (lối ra chưa có `facing` nay ghi rõ hướng mặc định cũ), nên không đổi gì khi chơi. Tên tiếng Anh "From <map>" vào `content/i18n/en.json`.
- `mapProblems`: spawn phải đứng ô đi được, tới được, không trên nhóm quái; nhận `others` (map của builder) để kiểm điểm tới từ bản nháp.
- Không làm "điều kiện xuất hiện" (spawn conditions): sẽ là luật gameplay mới, cần decision riêng.
- Còn mở: spawn / map do Admin tạo cần tên tiếng Anh trước khi publish (test i18n) — làm ở bước Publish (GĐ7).

## Giai đoạn 4 (2026-11-02) — Lối ra và kết nối

- `exits[].oneWay` (tùy chọn): lối một chiều có chủ ý; `mapGraph` không đòi lối về cho nó. Lối tắt (`shortcut`) không được một chiều (schema chặn), vì nó mở khi đi lối về.
- Hộp thoại **Lối ra** (Quản lý map): hai lưới — map này và map đích của lối đang chọn. Đặt lối ra bằng cú bấm; chọn map đích và điểm tới (danh sách, hoặc bấm lưới map đích: lấy điểm có sẵn ở ô đó, không có thì tạo `spawn_from_<map>` quay vào trong map); rộng / cao, hình, khoá (luôn mở / sau kẻ canh / lối tắt), một chiều, tên, tạm tắt.
- **Hai chiều luôn đặt tay ở cả hai đầu:** "Tạo lối về" → bấm chỗ lối về đứng ở map đích → bấm chỗ nó tới ở map này. Không có lối về tự sinh. Chưa có lối về (và không đánh dấu một chiều) thì báo lỗi.
- Lưu ghi bản nháp của cả hai map; "Lưu & mở lối ra của map đích" mở tiếp map bên kia.
- Lối ra đã publish không xoá, không tắt được (save giữ id `openedExits`); vẫn dời, đổi đích, đổi khoá, đổi điểm tới được. Tên / tạm tắt của lối ra nằm ở `meta.json` (`exits`), không vào game; lối ra tạm tắt bị bỏ khi publish.
- Kiểm tra kết nối chạy trên thế giới "như sau khi publish": map nháp vào vùng của nó (nhánh / đường chính), map tạm tắt và lối ra tạm tắt bị bỏ (`tools/admin/mapLinks.ts`). Bảng Quản lý map cộng lỗi kết nối vào cột Kiểm tra.

## Giai đoạn 5 (2026-11-02) — Mạng map

- Trang **🕸️ Mạng map** (`#/adventure-network`): mỗi map một node (màu theo trạng thái, huy hiệu đỏ = số cảnh báo), mỗi cặp map có lối ra là một đường nối (các lối ra hai phía gộp làm một): mũi tên = một chiều, nét đứt = có khoá, mờ = tạm tắt, đỏ = lỗi.
- Kéo node để sắp xếp → chỉ ghi `meta.json` `node` (không tạo bản nháp, không đổi "cập nhật lúc"); chưa kéo thì xếp tự động theo vùng (cột mỗi vùng, đường chính dọc, nhánh bên cạnh map nó nối). Kéo nền = di chuyển, cuộn = phóng to, "Vừa khung", "Xếp tự động" (ghi đè vị trí đã kéo, có hỏi).
- Bấm node: thông tin + Lối ra / Điểm xuất hiện / Bản đồ khu; bấm đúp: mở Lối ra. Bấm đường nối: các lối ra hai phía (đích, điểm tới, khoá, hình) + "Sửa lối ra này" (mở hộp Lối ra chọn sẵn lối đó). Tìm (tô xanh), lọc vùng / trạng thái (làm mờ phần khác).
- Cảnh báo cả thế giới: map chưa có kết nối; không có lối vào hợp lệ; lối ra tới map không tồn tại / đang tạm tắt; điểm tới không tồn tại hoặc lệch; lỗi kết nối của game (nói lại bằng tiếng Việt, tên map); lối ra tạm tắt đang là lối duy nhất tới một map. Bấm cảnh báo → chọn map đó.
- Mã: `tools/admin/mapNetwork.ts` (thuần, có test), `tools/admin/mapNetworkPage.ts`; API trang dùng chung `tools/admin/mapApi.ts`.

## Giai đoạn 6 (2026-11-02) — Map Editor + Thư viện asset

**6a — Map Editor** (`#/adventure-editor/<mapId>`, nút "Sửa" ở Quản lý map, "Map Editor" ở Mạng map):
- Canvas lớn: nền vẽ (cùng khối ảnh game dùng), đất (tô màu đầy với map vẽ bằng ô; trên nền vẽ chỉ tô ô chặn, mờ), lưới, độ cao, mọi vật. Toạ độ luôn là ô của game; zoom (cuộn) / kéo (chuột phải, giữa, hoặc Space) chỉ đổi cách vẽ.
- Công cụ: Chọn (kéo dời, kéo góc để đổi cỡ cổng / lớp che / lối ra, Shift chọn thêm, kéo khoảng trống chọn khung), Cọ (cỡ 1–5), Chữ nhật, Đổ loang, Độ cao 0–9 (chỉ trình bày), Lối ẩn (kéo khung = lớp che mới), Tẩy vật, Thêm vật (sao chép một vật cùng loại có sẵn, id mới, không tạo luật mới).
- Inspector: ô / cỡ chính xác và các trường chỉ chọn trong cái game đã có (bảng thưởng, loại rương, hệ, hình, sự kiện, lời bia, tên / hướng điểm tới). Nhóm quái chỉ dời / nhân bản, không sửa chỉ số.
- Undo / Redo (200 bước), Ctrl+D / C / V, Del, mũi tên (Shift = 5 ô), Ctrl+S lưu nháp. Kiểm tra sống: `mapProblems` + điểm tới + kết nối. Công việc từng map giữ trong bộ nhớ khi chuyển trang; đóng / tải lại khi chưa lưu thì hỏi.
- Không xoá id save giữ, điểm tới đang có lối ra chọn, cổng có câu đố trỏ tới; điểm mặc định / cổng dịch chuyển chỉ dời.
- "Placement Zone": game chưa có dữ liệu này nên không làm (cần decision nếu muốn).

**6b — Asset trang trí + Thư viện asset:**
- `content/adventure/scenery.json` (schema `content/schemas/adventure/scenery.ts`): thư viện dùng chung — `id` `decor_*`, `nameVi` (+ tiếng Anh ở `en.json`), `art`, `category`, `w` (ô), `anchorY`, `foot` (ô chặn quanh chân), `mode` (`normal` dưới đất / `occluder` sắp theo chân / `foreground` luôn ở trên / `cover` ở trên và mờ khi đội tới gần). Mở đầu 9 asset từ bộ ghép Rừng.
- `maps.json` → `scenery[]` (tùy chọn, cấp map, dùng được cho cả map vẽ bằng ô): `id` `scn_*`, `asset`, chân `x, y` (ô, có số lẻ) và chỉ phần đổi so với thư viện: `w`, `h`, `rotate`, `flip`, `mode`, `foot`, `fade` (`alpha` 0 = ẩn hẳn, 0,3 = mờ một phần; theo `radius` hoặc vùng `area`). Sửa thư viện là mọi chỗ đặt đổi theo.
- Runtime: `logic/scenery.ts` (thuần); chân asset là ô chặn trong `blockedTiles`; `mapProblems` báo asset lạ / vật dưới chân; `scene/mapScenery.ts` vẽ + mờ. Save không đổi; 18 map chưa có asset nào nên chơi không đổi.
- Editor: cột trái có thư viện (tìm, bấm rồi bấm map để đặt), inspector asset. Lớp hiển thị theo renderer: Nền vẽ, Chi tiết mặt đất, Môi trường, Vật tương tác, Nhóm quái, Tiền cảnh / lớp che, Va chạm (kèm ô chặn của asset), Lưới, Độ cao. Renderer không có lớp VFX riêng trên map nên không có ô VFX.
- Trang **Thư viện asset** (`#/adventure-assets`): thẻ asset, sửa, thêm từ ảnh có sẵn, tải PNG mới (`public/assets/props/adventure_decor/adv_decor_*.png` + dòng manifest đúng định dạng; hỏng thì gỡ lại), xoá khi không map nào dùng. Bắt buộc tên tiếng Anh. Ảnh tải lên không qua `art:process`: cần PNG nền trong suốt, cắt sát.

## Giai đoạn 7 (2026-11-02) — Kiểm tra, Publish, Lịch sử, Chạy thử, Xem bằng game

- **Kiểm tra & Publish** (Quản lý map: nút trên đầu / từng dòng; Map Editor): chọn bản nháp cần publish (hai map mới nối nhau thì chọn cùng). Kiểm tra chạy trên thế giới sau publish (`tools/admin/mapPublish.ts`, thuần): schema `maps.json`, `mapProblems` mọi map, kết nối (`mapGraph`), id save giữ, lối ra tới map chưa publish, đổi vùng map đã publish (lỗi), đổi cỡ map đã publish (cảnh báo: sương mù lệch), lối ra map khác đi theo điểm tới đã dời. Lỗi khoá nút; cảnh báo chỉ báo.
- **Tiếng Anh bắt buộc** cho mọi chữ mới hoặc tiếng Việt đã đổi trong `maps.json` (tên map, tên điểm tới, lời bia…): ô nhập ngay trong hộp, ghi vào `content/i18n/en.json` khi publish.
- **Publish nguyên tử** (`scripts/admin/mapPublishApi.ts`): lập lại kế hoạch ở server, ghi `maps.json` + `zones.json` + `en.json` cùng lúc, nạp lại mọi module content của game; hỏng thì khôi phục cả ba. Dòng không đổi giữ nguyên chữ; map khác chỉ đổi ô tới của lối ra đi theo. Map mới vào vùng (nhánh / đường chính theo nháp). Sau publish: bản cũ của mỗi map vào `history/<mapId>/<thời điểm>.json`, nháp đã publish rời kho (giữ lại nếu còn lối ra tạm tắt), ghi `publishedAt`. Trang tự tải lại.
- **Lịch sử** (nút trên dòng map đã publish): danh sách bản cũ, "Đưa về nháp" chép bản đó thành bản nháp — publish lại như thường (vẫn qua mọi kiểm tra, ví dụ không làm mất id save giữ).
- **Chạy thử** (Map Editor, Quản lý map, Mạng map; `tools/admin/mapSimulate.ts`): đi bằng phím mũi tên / WASD theo đúng luật đi của game (`walkableOf`, `stepCharacter`, tốc độ khám phá, hộp chân); cổng nguyên tố đóng / mở; lối ra có khoá chặn như tường trừ khi chọn "coi như đã mở khoá"; bước vào lối ra (cùng khoảng cách game dùng) sang map đích tại điểm tới của nó; đứng cạnh cổng dịch chuyển để tới điểm mặc định map khác; chọn đứng ở điểm xuất hiện bất kỳ; nhật ký chuyển map. Chạy trên bản đã publish hoặc bản nháp (từ Map Editor: cả thay đổi chưa lưu). Không lưu gì, không đụng save.
- **Xem bằng game thật** (Map Editor; `scripts/admin/mapPreviewApi.ts`): ghi thế giới sau publish vào `tools/admin/data/adventure/preview/content` (không đụng `content/`), chạy server game riêng `scripts/dev/mapPreview.mjs` (cổng 5191) đọc file đó, chụp map bằng Electron với `scripts/capture/adventureMaps.ts --content` trên bản sao save tạo bằng `scripts/dev/richSave.ts` trong `%TEMP%\sobiworld-mappreview`. Hai ảnh: cả map và góc nhìn lúc tới. Khoảng 30–60 giây.
- Giới hạn: xem bằng game là ảnh (sắp chiều sâu, lớp che, asset, ánh sáng của renderer thật); đi thử / va chạm / chuyển map dùng Chạy thử (cùng luật, vẽ bằng canvas của Admin).
