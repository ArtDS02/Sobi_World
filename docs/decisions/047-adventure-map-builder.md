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
