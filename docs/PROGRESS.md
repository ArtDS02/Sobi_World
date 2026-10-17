# PROGRESS — Sobi World

## Trạng thái hiện tại
**Giai đoạn:** GĐ14 đang làm — art, animation, VFX, âm thanh (nhánh `phase-14-art`, tách từ `main`). GĐ13 đã merge `main` (gameplay freeze, decision 021); phiên bản 0.13.0.
**Chiến lược (decision 017, 022):** gameplay trước, art sau; phong cách chuẩn Sobi Farm, chủ dự án tạo ảnh Gemini theo batch (`asset/batches/`), agent cắt và nối vào game. GĐ15 phát hành.
**Tiến độ GĐ14:** 50 dòng manifest còn `placeholder`. Xong (chờ duyệt): **Cloud** (cloud-01..04, 10 tầng mây: decision 023), **Sảnh** (world-01-scene, bỏ nhân vật ở Sảnh: decision 024, 025), **Garden** (garden-01..03 + cảnh theo ảnh mẫu: decision 027; 4 khu trồng, drone bón phân: decision 028). **Aquarium** (12 cá, icon, vật phẩm; cảnh 5 nơi theo cấp bể, HUD theo ảnh mẫu: decision 030). Còn lại: Aquarium (ảnh Gà Mái; cấp bể 5: decision 026 chờ duyệt số), Adventure, Farm (6 giống heo), `ui_icon_lock`; ngoài manifest: NPC, icon thời tiết / công nghệ / tính trạng, lễ hội, VFX, nhạc nền từng Area + Sảnh, SFX, icon app; cuối cùng `assets:release`, e2e, build.
**Chờ chủ dự án:** duyệt HUD dùng chung (cả Farm) + cửa hàng mới (decision 031); duyệt Cloud, Sảnh, Garden, cảnh Aquarium (decision 030); duyệt giá / cấp khu Garden 2–4 và vòi tưới cấp 4–5 (decision 028) và giá cửa hàng (decision 029);  duyệt số cấp bể 5; chốt `asset/FIRST_GUARDIANS_ART_PLAN.md` (đề xuất 9 nguyên tố: ngoài Spec V2, cần decision riêng).
**Save format:** v11 (Cloud save v2 từ decision 023).
**Bước tiếp theo:** chủ dự án chơi thử Adventure V2 (decision 037) và tạo ảnh batch `adventure-02-maps`; sau đó art Adventure + ô đất bản đồ.

## Nhật ký

### 2026-10-17 — Adventure V2 hoàn thành phần code (decision 037, chờ chủ dự án chơi thử)
✅ Đã làm (chủ dự án: "triển khai toàn bộ Sobi Adventure, cho phép tự quyết"):
1. **Combat V2** (`src/systems/combat`): 9 nguyên tố, ma trận Ngũ hành + Sấm + Ánh sáng/Bóng tối + Void trung tính; MP riêng từng con; Nộ theo % máu mất, Tuyệt kỹ 1 lần / trận; 25 trạng thái (độc cộng dồn, choáng / đóng băng có miễn nhiễm sau, Phong ấn, Diệt vong, Bất khuất, Khiêu khích, khiên…); 6 phản ứng; Phòng thủ; kẻ địch công bố ý định đầu vòng; trang bị affinity có trần; pipeline 18 bước; tất định theo seed.
2. **Nội dung**: 4 class × cây 8 node; 9 dòng Guardian × 4 skill riêng + Tuyệt kỹ (3 heo Huyền thoại có Tuyệt kỹ riêng); 112 skill; 22 kẻ địch (3 kẻ canh khu mới, trùm đổi pha, nhiễm Umbraflux); 21 trang bị (9 mới) + Cuộn Kỹ Năng; 3 vùng × 3 khu bản đồ; 24 đạo cụ có footprint. Mở Adventure ở Phát triển thế giới 16.
3. **Bản đồ khám phá**: So / Bi dẫn đầu (chọn ở Trại), 3 bạn theo sau; chỉ phím mũi tên / WASD, Space tương tác; va chạm theo lưới, vật chặn đủ đế; quái đứng / đi tuần, chạm mới đánh, trận thường bỏ chạy được; rương báu mở 1 lần / save, luôn có đường tới (có test cho cả 9 khu); cổng nguyên tố chỉ chặn lối phụ; mỗi khu một cổng dịch chuyển (thắp khi hạ kẻ canh / trùm); suối, lữ khách, bia lore, đền Guardian; bản đồ nhỏ (M); camera chừa chỗ cho HUD.
4. **Tiến triển**: SP (+2 / cấp, +3 lần đầu hạ trùm, cuộn), mở / nâng node, loadout 3 ô, Đền Huấn Luyện (đổi class trả lại SP, tẩy điểm lần đầu miễn phí), đội hình lưu sẵn, Đi nhanh vùng đã hạ trùm. Save slice v2 + migration (giữ cấp, truy lĩnh SP, đóng chuyến dở và trả năng lượng, thắp cổng của vùng đã hạ trùm).
5. **UI**: Trại (vùng, % khám phá, điểm xuất phát, cảnh báo đội hình), hồ sơ chiến binh 5 tab (chỉ số, kỹ năng, cây kỹ năng, trang bị, đền), HUD bản đồ, trận (thứ tự lượt, ý định, MP / Nộ, trạng thái có giải thích, nhãn hiệu quả khi chọn mục tiêu, Tuyệt kỹ, Phòng thủ, bỏ chạy, phím số), tổng kết. Chuỗi Việt / Anh đầy đủ.
6. **Admin**: "Mô phỏng trận" theo dòng + class (tỉ lệ thắng, khu tới được, skill hay dùng, phản ứng); trang mới "Bản đồ khu" (tô ô, đặt / xoá vật, dời rương / quái / cổng…, kiểm tra lối đi ngay khi sửa, không cho lưu khi còn lỗi); mọi file content mới có form.
7. **Cân bằng**: số liệu ở decision 037 (mô phỏng + bot 45 ngày). Bot `sim:week` nay đi chuyến trên bản đồ thật (`scripts/economy/adventureTrip.ts`).
8. **Art**: 46 id mới vào manifest dạng placeholder; PROMPT 7 sheet / 55 asset ở `art_inbox/.batch/adventure-02-maps/PROMPT.md`; ô đất bản đồ để batch sau (`docs/ASSET_TODO.md`).
🧪 Đã kiểm tra: `npm run check` xanh (mới: combat V2, 9 bản đồ, chuyến đi, cây kỹ năng, migration, view-model). Chạy thật ở sandbox 1600×900 với save cuối game: Trại → lên đường → đi bằng phím (đội theo sau) → chạm quái vào trận (ý định, thứ tự lượt) → Tự động thắng → khôi phục vị trí sau khi tải lại → Space ở cổng dịch chuyển → sang Đỉnh Dung Nham → Về Trại → tổng kết → hồ sơ / cây kỹ năng.
⚠️ Tự quyết: scene nghe thêm phím Space (không đổi phím mặc định E); hệ số máu / công / phần thưởng của kẻ địch (decision 037); trong mô phỏng, loadout tự chọn skill mạnh. E2e Adventure (2 kịch bản, bản build desktop) xanh: đi bộ bằng phím, vị trí được lưu, về Trại, khẩu phần.
👉 Bạn cần: chơi thử một chuyến Rừng (đi bộ, rương ẩn, cổng gai cần hệ Lửa, kẻ canh khu, cổng dịch chuyển), xem hồ sơ / cây kỹ năng; thử Admin "Bản đồ khu"; tạo ảnh batch `adventure-02-maps`.

### 2026-10-17 — Adventure V2: A0 spec + decision 037 (chủ dự án đã duyệt hướng)
✅ Đã làm: viết `docs/update_spec_sobi_adventure_gameplay_v1.md` (Combat V2 từ master prompt `UPDATE_SPEC_SOBI_ADVENTURE.md` + bản đồ khám phá) và decision 037. Chủ dự án chốt: mở băng cho Adventure; ma trận 9 nguyên tố theo Ngũ hành; Unique / Ultimate theo 9 dòng First Guardian; class đổi được, tẩy điểm; ý định kẻ địch, thanh lượt; Đi nhanh, đội hình lưu sẵn; WD 16 để mở Adventure; 30 loài hậu duệ để sau. Bản đồ kiểu Epic Battle Fantasy 3: So / Bi dẫn, 3 sinh vật theo sau, **chỉ phím mũi tên / WASD**, Space tương tác, rương báu ẩn mở 1 lần và luôn có đường tới, footprint vật phủ đúng đế (test), cổng dịch chuyển mỗi khu mở khi hạ trùm khu.
⚠️ Tự quyết (ghi trong spec, chờ chủ dự án soát): số khởi điểm (SP +2/cấp, giá node 2/4/6, MP, Rage K 1,2, trạng thái, phản ứng); độ hiếm nén 1,00 → 1,20; mỗi vùng 3 khu, khu 1–2 có trùm khu; quái không đuổi, trận thường được bỏ chạy; tên 36 Unique + 9 Ultimate + 32 node cây class; `master prompt` nhắc file `SOBI_ADVENTURE_GAMEPLAY_SPEC.md` không tồn tại nên spec mới đặt tên theo kiểu spec các Area khác.
👉 Bạn cần: đọc spec (nhất là §3 bản đồ, §6 dòng, §7 cây class, §9.3 ma trận), báo chỗ muốn đổi trước A1.

### 2026-10-17 — Admin: làm lại cho cả Sobi World, sửa lỗi sửa item / người chơi (decision 036, chờ duyệt)
✅ Đã làm (chủ dự án: "trang admin là bản cũ, nhiều lỗi khi sửa item, sửa user"):
1. **Sửa lỗi:** API admin nạp 4 module ở đường dẫn cũ → lưu giống heo / luật cặp / di truyền / hiệu ứng mùa trả 500 (đã sửa, lưu lại không đổi byte nào). Trình sửa người chơi kiểm bằng schema Sobi Farm cũ → save có giao dịch Garden / Aquarium… bị báo lỗi, không lưu được (thay bằng kiểm save thế giới + schema từng khu). Trang tự tải lại khi ai đó sửa code làm mất bản nháp (tắt hot-reload cho admin).
2. **Nội dung game** (thay "Số liệu"): mọi file `content/` (49 file sửa tại chỗ + 7 file dẫn sang trang riêng), form dựng từ zod schema của game: sửa số / chữ / công tắc / chọn id có tên, thêm / nhân bản / xoá / đổi thứ tự dòng, trường tuỳ chọn; tên vật phẩm, trang trí, thành tựu (Việt + Anh) sửa cạnh dòng. Server kiểm schema, chặn xoá id đã phát hành, sinh lại id, nạp lại toàn bộ content của game; lỗi thì khôi phục.
3. **Người chơi** theo save thế giới: 12 tab (Tổng quan, Ví 3 loại tiền, Túi đồ có ảnh / lọc, Tiến trình & mở khu, Bộ sưu tập & thành tựu, mỗi khu một tab, Thế giới & thời gian — tua mọi khu, Nâng cao — JSON / reset / xoá vào backups). Đổi là áp ngay, lỗi hiện trên đầu và khoá Lưu.
4. Giao diện mới (tím–kem, sáng / tối, menu nhóm có chấm "chưa lưu", Tổng quan theo 5 khu, vừa 375 px). Hướng dẫn trong admin cập nhật.
🧪 Đã kiểm tra: `npm run check` xanh (105 file, 1.414 test; test mới: sửa save thế giới, mở / khoá khu, tua mọi khu, danh mục phủ đủ file content, chặn xoá id, bắt buộc tên, ghi bảng chuỗi, giá trị mặc định của form). Chạy thật `npm run admin` (save thử trong thư mục tạm, không đụng save thật): 49 file dựng form không lỗi, lưu Vật phẩm (diff đúng 1 dòng, đã trả lại), từ chối vật phẩm mới thiếu tên; người chơi: đổi tiền / túi / KN / dữ liệu Garden / sửa heo / tua 1 ngày → lưu → game đọc lại đúng; mọi trang không lỗi console; 375 px không tràn ngang.
⚠️ Tự quyết: bỏ trang "Số liệu" (Nội dung game làm được hết); admin không hot-reload (sửa code admin thì F5); mở khu bằng tay tạo dữ liệu khởi đầu như game; tua thời gian giờ lùi cả Bảng đơn. Chưa làm: sửa chữ tiếng Anh của file content (`content/i18n/en.json`) trong form.
👉 Bạn cần: chạy `npm run admin`, thử Nội dung game và một save người chơi; duyệt decision 036.

### 2026-10-17 — GĐ14: câu cá dễ giật hơn, giao diện bến câu mới (decision 035, bổ sung)
✅ Đã làm (chủ dự án: "khó giựt quá, giao diện chưa đẹp"): cửa sổ giật 0,9 → 1,5 giây; giật sớm chỉ làm cá giật mình (tha 2 lần); thanh lực chậm hơn; nhịp kéo dễ hơn (vùng xanh to, cá chậm, bắt đầu trong vùng) nhưng xa khơi vẫn thử thách. Giao diện: khung cảnh bến câu (cần, dây, phao, đảo), thanh lực nằm trên dải độ xa, bước 1-2-3, hiệu ứng cắn câu / sắp tuột, thẻ kết quả có tia sáng. Sửa lỗi cũ: sau màn kết quả phím Cách / Enter thôi hoạt động.
🧪 Đã kiểm tra: unit test (giật sớm, trận bắt đầu trong vùng); mô phỏng 3 kiểu người chơi × 3 độ xa × 4 cỡ cá; sandbox: quăng, chờ, giật sớm, cắn câu.
⚠️ Chưa kiểm bằng tay nhịp kéo và thẻ kết quả (khung trình duyệt chạy nền, chỉ ~2 khung hình/giây). Số mới đặt trong `ui/fishingGame.ts` (như trước), chưa đưa vào `content/`.
👉 Bạn cần: chơi thử vài lượt câu (gần bờ và xa khơi), báo nếu còn khó / quá dễ.

### 2026-10-17 — GĐ14: 46 loài mới, lai giống, kiểu bơi theo loài, câu cá ba nhịp, bảng tên, popup (decision 035, chờ duyệt)
✅ Đã làm (chủ dự án yêu cầu a–f, cho tự quyết):
1. Cắt 13 sheet (aquarium-04-fish, farm-02-pigs, garden-04-crops, cloud-05-flowers): 18 cá, 12 heo (kèm ngủ / thức), 8 cây, 8 hoa; 50 icon vật phẩm lấy từ sprite. Content, đơn hàng, chuỗi Anh.
2. Lai giống: `systems/hybrid` + `content/<area>/hybrids.json`; Vườn lai giống ở Garden và Cloud (cây "chỉ lai" khóa tới lần lai đầu), cá hai loài đẻ trứng loài hiếm, 12 heo mới có công thức đột biến; bảo đảm loài nào cũng lai ra được.
3. Aquarium: 10 kiểu bơi theo loài (sứa, bạch tuộc, rùa, đuối, cá ngựa, cá heo, chạch, cá hộp, cá nóc…).
4. Câu cá: quăng chọn độ xa → chờ phao (rỉa giả) → giật → kéo cá; bóng cá, chuỗi câu; cần nghỉ 60 giây.
5. Bảng tên Cloud / Aquarium: chữ đúng vùng, cỡ tự vừa. Dialog: đầu gỗ, nút ✕ góc, thân cuộn; popup vắng mặt thành thẻ theo khu.
🧪 Đã kiểm tra: `npm run check` xanh (105 file, 1.406 test; mới: hybrids, polish035, kiểu bơi, mini-game câu); sandbox riêng 1600×900: lai cà chua thành công (thẻ "Giống mới!"), cá mới bơi trong bể, quăng cần / phao; bảng tên Cloud.
⚠️ Chưa kiểm bằng tay: nhịp kéo cá (khung trình duyệt chạy ẩn nên vòng lặp khung hình bị chậm; có unit test), popup vắng mặt (có test nhóm). Ảnh heo mới nhỏ hơn 512 nên bị phóng (hơi mờ). Màn tải nông trại ở sandbox đứng lâu ở 11% khi khung trình duyệt chạy ẩn (không có lỗi tải ảnh nào; do vòng lặp khung hình bị chậm, không phải do heo mới).
👉 Bạn cần: chơi thử lai giống, câu cá, xem kiểu bơi; duyệt tỉ lệ lai, phí lab, cá Huyền thoại, cần nghỉ 60 giây.

### 2026-10-16 — GĐ14 Aquarium: art sạp hàng (batch aquarium-05-shop)
✅ Đã làm: cắt sheet S (Gemini vẽ lưới 2×2 = 2 phiên bản mỗi sạp → lấy hàng trên): `bld_shop_aquarium` (sạp gỗ trên bến, cấp 1) và `bld_shop_aquarium_sea` (sạp vỏ sò dưới nước, cấp 2–5), canvas 300×380, vẽ rộng 230 px. Sạp gỗ có vùng nền xám kẹt giữa mái và quầy → xoá thêm các lỗ nền kín (sạp vỏ sò giữ bản cắt gốc để không mất lòng quả cầu thuỷ tinh và sỏi). Placeholder: 2 dòng mới vào thẳng production.
🧪 Đã kiểm tra: `npm run check` xanh (1.383 test); ghép thử lên 5 nền; sandbox (bể cấp 4): sạp vỏ sò hiện, bấm mở cửa hàng. Cấp 1 chỉ kiểm bằng ảnh ghép (save sandbox ở cấp 4).
⚠️ `art:process` chỉ chạy cho 2 file này (các ảnh khác trong `art_inbox/` tạm dời ra rồi trả lại) để không xử lý lại các nền đã chỉnh tay.

### 2026-10-16 — GĐ14: chuông thông báo; Aquarium sạp hàng, bấm cá, cá đói, mưa / đêm, trứng nở, cá nhảy vào túi (decision 034, chờ duyệt)
✅ Đã làm (chủ dự án đồng ý 5 đề xuất của 033 + đổi khung gợi ý):
1. **Chuông thông báo** thay khung "việc tiếp theo" ở mọi nơi: nút tròn tím dưới các nút HUD góc phải, huy hiệu đếm việc đang chờ (màu theo việc gấp nhất), bấm mở danh sách mọi thông báo, mỗi dòng có "Đi".
2. Aquarium: sạp hàng trong cảnh (bấm mở cửa hàng); bấm cá → cá giật mình, cá thân nhả tim, rồi mở thẻ; cá đói lên mặt nước đớp; mưa / tuyết gợn mặt nước; đêm có đom đóm và ánh trăng (biển sâu: đốm phát sáng); trứng nở tách vỏ; cá câu được nhảy khỏi nước rồi bay vào túi.
3. Prompt sheet S (sạp hàng + icon chuông) thêm vào `art_inbox/.batch/aquarium-03-fx/PROMPT.md`.
🧪 Đã kiểm tra: xem cuối mục.
👉 Bạn cần: xem chuông ở Farm / Sảnh / các Area; xem Aquarium; tạo ảnh sheet W, S.

### 2026-10-16 — GĐ14 Aquarium: góp ý lượt 2 — drone, cá vẫy đuôi, cá cắn câu, bỏ bảng "Bể cá" (decision 033, chờ duyệt)
✅ Đã làm:
1. Bỏ bảng "Bể cá" trong cảnh (thẻ Bể vẫn mở bằng bảng tên nơi / thẻ "Bể cá").
2. Bỏ dấu "!" trên cần câu: khi câu được, phao (cắt riêng từ ảnh cần câu) giật xuống và cần rung; cấp 1 gợn sóng quanh phao vẽ sẵn, cấp 5 đèn lồng loé sáng.
3. Cá vẫy đuôi thật: thân cá vẽ thành dải 14 đoạn (Phaser Rope) uốn theo sóng, mạnh ở đuôi, nhanh hơn khi bơi nhanh / quay đầu.
4. Drone: cho ăn → drone thức ăn bay tới rắc hạt, cá lao tới khi hạt rơi; thay nước → drone nước đổ nước từ bụng xuống, nước đục tan sau khi đổ. Đang mượn drone Garden / Cloud.
5. Prompt sheet W (2 drone) thêm vào `art_inbox/.batch/aquarium-03-fx/PROMPT.md`.
🧪 Đã kiểm tra: typecheck, lint, test; sandbox 1600×900 (bể cấp 4): cá uốn đuôi, cho ăn có drone + hạt, thay nước có drone + dòng nước, phao giật; không lỗi console. Xem `npm run check` ở cuối phiên.
👉 Bạn cần: xem lại Aquarium; tạo ảnh sheet W (khuyên làm) và F (không bắt buộc).

### 2026-10-16 — GĐ14 Aquarium: cửa hàng, cá bơi sống động, hiệu ứng cho ăn / thay nước (decision 032, chờ duyệt)
✅ Đã làm (chủ dự án yêu cầu):
1. **Cửa hàng Aquarium** (nút "Cửa hàng" trên HUD, lưới dùng chung tông xanh nước): Thức ăn cá 20, Thuốc 100, cá giống Cá Vàng 40 / Cá Rô 50 / Cá Chép 60 (`content/aquarium/balance.json` `shop`, Admin sửa được giá). Hành động `buyShopItem`, sổ cái `AQUARIUM_SHOP`, sự kiện `AQUARIUM_SHOP_BOUGHT`; nhãn loại hàng mới (Thức ăn, Thuốc, Cá giống). Không đổi save.
2. **Cá bơi** (`scene/fishSwim.ts`): tăng / giảm tốc, đi cong, nghiêng thân theo hướng, vẫy đuôi theo tốc độ, quay đầu (thân hẹp rồi lật), nhấp nhô khi nghỉ, thỉnh thoảng lao nhanh và nhả bọt; cá đói bơi gần mặt nước, cá bệnh gần đáy.
3. **Cho ăn**: hạt rơi xuống mặt nước (gợn sóng), chìm lắc lư; cá vừa được cho ăn bơi nhanh tới hạt gần nhất và đớp. **Thay nước**: dòng nước đổ vào, bọt dâng, dải sáng quét ngang, lớp đục tan dần, lấp lánh; cá bơi vui. Đọc từ trạng thái (`fedAt` mới, nước tăng), tắt khi "Giảm chuyển động".
4. Prompt ảnh `art_inbox/.batch/aquarium-03-fx/PROMPT.md` (hạt thức ăn, gợn sóng; 1 lượt Gemini). Tới khi có ảnh, vẽ bằng code.
🧪 Đã kiểm tra: `npm run check` xanh (1.381 test; mới: `aquariumShop.test.ts`, `aquariumSwim.test.ts`); sandbox 1600×900: mua ×10 thức ăn (0 → 10, toast), cho ăn cả bể (hạt rơi, 15 cá lao tới ăn), thay nước 18% → 100% (dòng nước, bọt, đục tan); không lỗi console.
⚠️ Quyết định tự đưa ra: bán cá giống 3 loài Thường (giá cao hơn giá bán cá câu, không có vòng lời); chưa có sạp hàng trong cảnh; dòng nước giữ vẽ bằng code. Sau khi sửa cắt dải sáng theo vùng nước đục, chưa chạy lại thay nước bằng tay (save sandbox nước đã trong).
👉 Bạn cần: xem cửa hàng + hiệu ứng; duyệt giá cá giống; tạo ảnh theo prompt (không bắt buộc).
➡️ Tiếp theo: Adventure.

### 2026-10-16 — GĐ14: HUD dùng chung cho các Area, cửa hàng làm lại (decision 031, chờ duyệt)
✅ Đã làm (chủ dự án yêu cầu, theo `art_inbox/.batch/hud-01/PROMPT.md`):
1. **HUD chung** `ui/components/areaHud.ts` + `_areahud.scss` (bộ tím của Sảnh / Aquarium): viên xu, viên cấp có sao, nút vuông có icon. Garden, Cloud, Aquarium, Adventure dùng chung; bỏ CSS HUD lặp ở 4 file.
2. **Khay dưới một hàng** chia nhóm có nhãn: chọn hạt / hoa (✓ + viền, giá có icon xu, "có n", cuộn ngang) → Chăm sóc → Thu hoạch & gieo (xanh lá) → Mở rộng (nhạt, cuối). Thẻ tắt ghi lý do ngay dưới nhãn. Cloud: khay từ 2 hàng (190 px) còn 1 hàng; thanh tên tầng nâng 26 px để mũi tên không bị che ở 1024 × 640.
3. **Chip thời tiết / lễ hội / thương nhân** một hàng nhỏ; dưới 1280 px và (lễ hội, thương nhân) trong các khu chỉ hiện ký hiệu, rê chuột mở chữ.
4. **Cửa hàng Garden / Cloud**: số dư, nút × ở góc, chỉ lưới cuộn, 4 cột, nhãn loại hàng, tổng tiền trên nút ×1/×10/×50, lý do tắt ghi trên thẻ, chặn bấm lặp 0,4 s (`guardBuy`). **Cửa hàng Farm**: tab + số dư dính trên đầu.
🧪 Đã kiểm tra: `npm run check` xanh (1.372 test, thêm test `guardBuy`, nhãn loại hàng, giá / tồn của thẻ hạt); e2e 14/14 (bản build) xanh; sandbox 1600×900, 1280×720, 1024×640: Garden, Cloud, Aquarium, Adventure, Farm; mua ×10 → số dư và "Đang có" đổi ngay, toast "Đã mua 10 Hạt cỏ", bấm đúp chỉ mua một lần; thu hoạch hết → nút tự tắt kèm lý do; nút × đóng cửa hàng; không lỗi console.
⚠️ Quyết định tự đưa ra: chưa làm lại màn chuẩn bị Adventure (để lượt art Adventure); nhãn nút gieo bỏ "(tên cây)" vì icon đã là hạt đang chọn. Chưa thử được trạng thái "thiếu xu" trong cửa hàng bằng tay (save sandbox đủ tiền) — có test VM.
🛠️ Bổ sung (chủ dự án chọn đổi HUD Farm): thanh trên Farm sang bộ tím chung (viên hồng khi máng trống / trại đầy / heo bệnh), góc phải Ra Sảnh + Menu (Cài đặt trong Menu, Esc vẫn mở), dock thành 5 thẻ kem trên khay trắng; bỏ CSS `.hud-pill`. Test smoke e2e đi qua Menu → Cài đặt. Đã kiểm tra: `npm run check` (1.372 test) và e2e 14/14 xanh; sandbox 1600×900 và 1024×640: một hàng viên, bấm máng / Menu / Ra Sảnh đúng.
👉 Bạn cần: duyệt HUD (cả Farm) + cửa hàng.
➡️ Tiếp theo: Adventure.


### 2026-10-16 — GĐ14 Aquarium: HUD và thanh nút theo ảnh mẫu (decision 030, chờ duyệt)
✅ Đã làm (chủ dự án yêu cầu):
1. **HUD trên** kiểu tím của Sảnh: viên Sobi Coin, viên độ trong nước %, viên cấp có ngôi sao + thanh KN; nút vuông tím có icon Ra Sảnh / Vật phẩm / Menu. Token tím (`$pz-*`, `pz-pill`) chuyển sang `styles/core/_mixins.scss` để Sảnh và Aquarium dùng chung.
2. **Thanh dưới** trắng: ô trạng thái (cá / sức chứa, trứng, thanh nước) + 7 thẻ kem có icon (cá, rong, mây–giọt nước, vỏ sò, rương, san hô, hoa); thẻ tắt mờ và ghi lý do. Gọn ở cửa sổ nhỏ, to hơn từ 1280 px (breakpoint `lg` mới).
3. **9 icon** cắt từ sheet H (ba lô, mây–giọt nước, sao; Gemini vẽ 2 hàng trùng → lấy hàng trên) và sheet I (bỏ bóng xám dưới chân). Bảng "Bể cá" cấp 4–5 dời phải khỏi chip thời tiết / lễ hội.
🧪 Đã kiểm tra: `npm run check` xanh (1.369 test, thêm test HUD); sandbox 1600×900 và 1024×640: HUD hiện đủ, thẻ "Bể cá" mở thẻ Bể, nút Ra Sảnh về Sảnh, thanh dưới vừa cạnh chân dung NPC; không lỗi script.
⚠️ Quyết định tự đưa ra: icon cho từng thẻ (rong = cho ăn, vỏ sò = thu vảy, rương = cá trong túi, san hô = bể, hoa = cho đẻ); không dùng icon quà và sao biển (không có tính năng); cửa sổ nhỏ thì chip thời tiết vẫn che một phần bảng "Bể cá" (vẫn mở được bằng thẻ "Bể cá" và bảng tên nơi).
👉 Bạn cần: duyệt HUD + cảnh Aquarium.
➡️ Tiếp theo: Adventure.

### 2026-10-16 — GĐ14 Aquarium: cảnh theo 5 ảnh mẫu, mỗi cấp bể một nơi (decision 030, chờ duyệt)
✅ Đã làm:
1. **5 nền** từ sheet E1–E5 của `aquarium-01-scene` (đã có từ 13/10): `bg_aquarium` (bể kính trên bến), `bg_aquarium_t2..t5` (hồ đá, đầm san hô, vịnh tàn tích, biển sâu), 1800×900; xoá dấu ✦ watermark Gemini ở góc dưới phải (inpaint).
2. **Sprite** cắt từ sheet A, D: cần câu (`bld_fish_dock`), bảng "Bể cá" trên cọc, bảng hoa ghi tên nơi, ngọc cam, đống ngọc; bỏ dòng `bld_fish_tank` (bể vẽ liền trong nền cấp 1). Placeholder 53 → 50.
3. **Cảnh dựng lại** (`scene/`): mỗi cấp bể một nơi đo trên nền (`AQUARIUM_PLACES`): vùng cá bơi, chỗ trứng / vảy, bảng, cần câu hoặc vùng bấm trên chỗ câu vẽ sẵn (cấp 1, 5), dấu "!" khi câu được; nâng bể thì đổi nơi ngay. Trứng và đống vảy dùng ảnh thật (vảy có số). Cá nhỏ lại (tối đa 0,6). Tên 5 nơi trong bảng chuỗi Việt / Anh.
🛠️ Lỗi tìm thấy khi chạy và đã sửa: nền phủ sai khung ở lần vẽ đầu (camera `worldView` chậm một frame) → cảnh nhớ khung nhìn do `fitCamera` báo.
🧪 Đã kiểm tra: typecheck, lint, test (1.368) xanh; `assets:check` OK; sandbox 1600×900 và 1916×949 (save đang ở bể cấp 4): nền phủ kín, cá bơi, bấm bảng "Bể cá" mở thẻ Bể, bấm cần câu mở Bến câu, "!" cạnh cần câu; 5 cấp kiểm bằng ảnh ghép bố cục lên nền. Ảnh: `art_inbox/.qa/aquarium-review/`.
⚠️ Quyết định tự đưa ra: giữ HUD / thanh nút hiện tại (sheet H, I chưa dùng); loại sheet C (Gà Mái vẽ pixel art); không dùng 8 cá trang trí của sheet F (content có 12 loài riêng); cấp 1–3 có ngọc trang trí trên cát (cấp 4 vẽ sẵn trong nền); cấp 5 chưa có trong content (chờ duyệt số) nhưng nền đã sẵn.
👉 Bạn cần: duyệt cảnh Aquarium; quyết có đổi HUD Aquarium sang kiểu ảnh mẫu (tím–trắng, icon sheet H / I) không; duyệt số cấp bể 5.
➡️ Tiếp theo: HUD Aquarium (nếu duyệt) hoặc Adventure.

### 2026-10-16 — GĐ14: art drone, sạp hàng, vòi tưới theo cấp, cá Aquarium (chờ duyệt)
✅ Đã làm:
1. **Cắt 4 batch** (6 ảnh Gemini của chủ dự án): `drone-01` (2 drone), `extras-01` (2 sạp hàng, vòi tưới cấp 2–5), `aquarium-01-fish` (12 cá), `aquarium-02-items` (vảy, ngọc trai, thức ăn cá, trứng cá, đống vảy, phao). 12 icon cá `ui_item_fish_*` lấy từ sprite cá (K-derive). 13 dòng manifest mới + kích thước canvas; placeholder 80 → 53.
2. Gemini vẽ đảo vòi tưới cấp 3 và 4 so với mô tả → đổi lại khi giao (cấp 3 = đầu xoay bằng đồng, cấp 4 = có bể nước).
3. Sạp Garden bằng art thật to hơn bản vẽ code → thu nhỏ (0,7) và dời sang phải để không đè ô góc dưới.
🧪 Đã kiểm tra: QA không FAIL, `assets:check` OK; Edge ẩn 1600×900: drone art bay ở Garden và Cloud, sạp hai vùng, vòi tưới cấp 3 có art riêng; không lỗi script.
⚠️ Còn lại ở Aquarium: `bld_fish_tank`, `bld_fish_dock`, `bg_aquarium` chờ dựng cảnh theo 5 ảnh mẫu (nền E1–E5 đã có trong `art_inbox/.batch/aquarium-01-scene/`); trứng cá / đống vảy / phao đã có ảnh, chờ cảnh mới dùng.
👉 Bạn cần: duyệt art mới (ảnh chụp đã gửi).
➡️ Tiếp theo: dựng cảnh Aquarium theo ảnh mẫu.

### 2026-10-16 — GĐ14 Garden + Cloud: cửa hàng từng vùng, vườn sống động, HUD Garden mới (decision 029) — chờ duyệt
✅ Đã làm:
1. **Cửa hàng Garden và Cloud**: danh sách hàng + giá trong balance của từng vùng (Admin sửa được giá), hành động `buyShopItem` (sổ cái `GARDEN_SHOP` / `CLOUD_SHOP`, sự kiện `*_SHOP_BOUGHT`), hộp thoại lưới thẻ dùng chung (`ui/components/shopGrid.ts`, nút ×1/×10/×50 luôn nói lý do tắt), nút "Cửa hàng" trên HUD, sạp hàng trong cảnh (vẽ bằng code tới khi có ảnh).
2. **Đề xuất đã được duyệt**: gà và vịt đi dạo quanh ruộng; thu hoạch thì nông sản bay về túi kèm "+n"; cây vừa chín nảy và lấp lánh; mỗi khu phủ màu nhẹ; vòi tưới to dần theo cấp (dùng ảnh từng cấp khi có); HUD Garden tông trắng–tím như Cloud.
3. **Batch `extras-01`** (2 lượt Gemini): 2 sạp hàng, vòi tưới cấp 2–5 (dùng ảnh vòi hiện tại làm mẫu hình dáng).
4. Tách code: `gardenDrone.ts`, `gardenLife.ts`, `gardenShopVm.ts`, `cloudShopVm.ts`, `ui/world/codeStall.ts`.
🧪 Đã kiểm tra: `npm run check` xanh (1.368 test); 14/14 e2e (bản build) xanh; test mới cho cửa hàng (giá, túi, từ chối hàng không bán / số lượng sai / thiếu tiền, sự kiện thế giới, thẻ hàng). Chạy sandbox bằng Edge ẩn 1600×900: thu hoạch → icon bay về túi; mở cửa hàng bằng nút HUD và bằng sạp; nút ×10 tắt đúng khi túi đầy; Cloud có sạp + bảng "Cửa hàng", cửa hàng tông tím; gà / vịt đi trên lối; không lỗi script.
⚠️ Quyết định tự đưa ra: giá hạt giữ như giá hiện tại; phân bón 50, nước tinh khiết 15; không bán potion / nông sản (để Vạc nấu, Máy xay còn ý nghĩa); hiệu ứng thu hoạch / cây chín chỉ ở Garden.
👉 Bạn cần: xem cửa hàng và vườn; tạo ảnh `asset/batches/extras-01.md` và `drone-01.md`.
➡️ Tiếp theo: giao ảnh sạp / vòi / drone khi có; Aquarium.

### 2026-10-16 — GĐ14 Garden + Cloud: góp ý của chủ dự án (khu trồng, gieo/bón theo khu, drone, cảnh) — chờ duyệt
✅ Đã làm (decision 028):
1. **Garden 4 khu × 24 ô**: content `plotsPerZone`, bước mở khu 2–4 có cổng cấp (`LEVEL_TOO_LOW`), vòi tưới thêm cấp 4–5; save không đổi. Thanh "‹ Khu n · tên ›" trên HUD; đổi khu thì ruộng trượt ngang; mua khu mới tự chuyển sang, toast "Đã mở <tên khu>!". Admin có nhãn cho trường mới.
2. **"Gieo kín ô trống" theo khu / tầng đang xem** cho Garden và Cloud (Cloud: cảnh ghi lại tầng, `viewedTier.ts`).
3. **"Bón phân tất cả"** (Garden và Cloud) cho khu / tầng đang xem, dùng hành động bón phân có sẵn; **drone** bay qua từng ô vừa bón (vẽ bằng code tới khi có ảnh; batch `drone-01` đã viết).
4. Cảnh Garden: bỏ hover ô, cây đung đưa, bỏ bảng tên (bong bóng tên khi rê chuột lên công trình), bỏ số trên vòi tưới, vòi phun nước + sương trên ô được tưới tự động.
5. Tách code để giữ ≤ 300 dòng: `gardenField.ts`, `gardenFx.ts`, `gardenZoneVm.ts`, `cloudDrone.ts`, `cloudTierVm.ts`; nền/trời của Cloud chuyển sang `cloudFx.ts`.
🧪 Đã kiểm tra: `npm run check` xanh (1.365 test); 14/14 e2e (bản build) xanh; test mới: mở khu theo cấp, 4 khu / vòi tưới 96 ô, gieo / bón chỉ trong khu (Garden) và tầng (Cloud), thanh khu. Chạy sandbox bằng Edge ẩn 1600×900: mua khu 2 → ruộng trượt sang, gieo kín đúng 24 ô của khu 2, về khu 1 (trượt), thu hoạch, gieo, bón phân tất cả → drone bay qua từng ô; Cloud: bón phân tất cả → drone; không lỗi script.
⚠️ Quyết định tự đưa ra: khu mới mở trọn 24 ô một lần (như tầng mây); số giá / cấp đề xuất (xem decision 028); tưới / thu hoạch vẫn cho cả vườn; khu kế tiếp chỉ xem được khi khu cuối đã đầy (như Cloud); toast có thể che thanh khu vài giây.
👉 Bạn cần: duyệt Garden (khu, drone, vòi phun) và Cloud (nút bón phân); duyệt số khu / vòi tưới; tạo ảnh `asset/batches/drone-01.md` (1 lượt Gemini).
➡️ Tiếp theo: cắt `drone-01` khi có ảnh; Aquarium.

### 2026-10-16 — GĐ14 Garden: cảnh dựng lại theo ảnh mẫu (decision 027, chờ duyệt)
✅ Đã làm:
1. **Nền `bg_garden`** (sheet E của `garden-01-scene`, 1449×720 → 1812×900), phủ màn hình theo khung nhìn như Cloud; trời tô màu chỉ hiện khi ảnh chưa tải.
2. **Bố cục đo trên nền**: ruộng 4 × 6 ô trên bãi cỏ trong lối đi (ô / cây tỉ lệ 0,86); Máy xay góc trên trái, Thùng ủ bãi cỏ tròn dưới trái, Vòi tưới bên phải. Nhãn: bảng gỗ trên cọc `prop_garden_sign` (cắt từ sheet L của `garden-01-scene`, dòng manifest mới) cho Máy xay / Vòi tưới; "Thùng ủ" viết lên tấm bảng trống vẽ sẵn trong nền, bấm vào bảng mở Thùng ủ.
3. Rê chuột: ô đất nhấc 3 px + phóng nhẹ, công trình và bảng phóng nhẹ (tắt khi "Giảm chuyển động"). Ảnh nạp muộn được trỏ lại (như Cloud).
🛠️ Lỗi tích hợp tìm thấy và đã sửa: dev server (Vite) sập với EBUSY khi chủ dự án đang tải ảnh Gemini vào `art_inbox/` (file `.crdownload` bị khóa) → `vite.config.ts` bỏ theo dõi `art_inbox/` và `asset/`.
🧪 Đã kiểm tra: `npm run check` xanh (1.361 test); e2e Garden + display (bản build) xanh; sandbox với save cuối game ở 1600×900 và 1916×949: nền phủ kín, bấm Máy xay / bảng "Thùng ủ" mở đúng hộp thoại, Esc đóng. Ảnh: `art_inbox/.qa/garden-review/garden_v2_*.jpg`.
⚠️ Quyết định tự đưa ra: 4 hàng ô thay vì 2 như ảnh mẫu (Garden có 24 ô); nhãn Thùng ủ dùng bảng vẽ sẵn trong nền để không chồng hai bảng; HUD Garden chưa đổi.
🛠️ Sửa theo góp ý: cây lệch xuống so với lòng đất (gốc đè lên khung gỗ trước). Đo trên ảnh: lòng đất của `plot_soil` ở giữa canvas, ụ đất của cây ở sát đáy canvas → đáy cây đặt thấp hơn tâm ô 16 px ảnh (`cropBaseY`, trước là 32 px).
👉 Bạn cần: duyệt cảnh Garden.
➡️ Tiếp theo: Aquarium (cắt `aquarium-01-fish`, `aquarium-02-items` khi có ảnh; dựng cảnh theo 5 ảnh mẫu).

### 2026-10-16 — GĐ14 Garden: 38 sprite vào game; soạn batch Aquarium (chờ duyệt / chờ ảnh)
✅ Đã làm:
1. **Cắt `garden-01..03`** (7 ảnh Gemini của chủ dự án): 38 file → `public/assets/`, status `production` (placeholder 118 → 80). Gemini vẽ sai lưới ở 2 sheet: S thành 3×3 (thừa 2 gói lặp) → bỏ hàng dưới của sheet rồi cắt 2×3; L thành 2×3 (vẽ 2 bộ trùng) → cắt theo lưới thật, lấy bộ trên. Không cần vẽ lại.
2. QA: không FAIL; WARN viền mềm ở cây thân mảnh (như Cloud, chấp nhận), vòi tưới có giọt nước tách rời (có chủ ý). Chạy game (sandbox, save cuối game): Garden hiện đủ Máy xay / Thùng ủ / Vòi tưới / luống / cây các giai đoạn / gói hạt, cây đứng giữa luống; không lỗi console. Ảnh: `art_inbox/.qa/garden-review/garden_v1.jpg`.
3. **Batch Aquarium** (3 lượt Gemini): `aquarium-01-fish` (12 loài cá theo content, 2 sheet 2×3; view mới `fish`), `aquarium-02-items` (vảy, ngọc trai, thức ăn cá + trứng cá, đống vảy, phao). Icon cá sẽ K-derive từ sprite cá.
🔎 Phát hiện: `art_inbox/.batch/garden-01-scene/` và `aquarium-01-scene/` (13/10, soạn tay, chưa có JSON / chưa ghi PROGRESS) có ảnh mẫu bố cục của chủ dự án và ảnh đã render: nền vườn (E), nhà xay / thùng gỗ / vòi bơm kiểu khác, bảng tên, Bác Vịt Cẩn, rau (có "Cà tím" thay "Cỏ"); Aquarium có 5 nền E1–E5 (bể kính vẽ liền trong nền), bảng gỗ, cần câu, icon, Gà Mái, 8 cá trang trí (không phải 12 loài trong content).
⚠️ Quyết định tự đưa ra: dùng bộ `garden-01..03` cho 38 dòng manifest (chủ dự án vừa render theo yêu cầu); chưa đụng cảnh Garden (vẫn vẽ nền bằng code) và chưa dùng bộ `garden-01-scene` vì hai bộ khác nhau về công trình và cây (cà tím ≠ cỏ trong content).
👉 Bạn cần: duyệt Garden; chọn hướng dựng cảnh theo ảnh mẫu; render `aquarium-01-fish.md`, `aquarium-02-items.md`.
➡️ Tiếp theo: dựng cảnh Garden theo ảnh mẫu (nền `bg_garden` từ E.png) nếu được duyệt; cắt batch Aquarium khi có ảnh.

### 2026-10-16 — GĐ14 Garden: viết batch garden-01..03 (chờ chủ dự án tạo ảnh)
✅ Đã làm:
1. Commit tài liệu đang dở (kế hoạch art Aquarium, First Guardians, decision 026, skill `image-to-prompt`, ảnh tham khảo Adventure); viết lại phần "Trạng thái hiện tại" (đầu file đã cũ: còn ghi nhánh GĐ13).
2. **3 batch Garden, 38 asset, 7 lượt Gemini**: `garden-01-crops` (5 cây × 4 giai đoạn, 3 sheet), `garden-02-items` (5 gói hạt + phân bón, 5 nông sản + thức ăn cao cấp), `garden-03-world` (3 ô đất cùng tỉ lệ; Vòi tưới, Máy xay, Thùng ủ). Đã `prep`, file đính kèm nằm trong `art_inbox/.batch/garden-0*/`.
3. Skill `image-to-asset`: view mới `stages_crop` (giai đoạn "chín" cho cây trồng, thay "nở hoa"), `building_grass` (công trình đứng trên cỏ; `building` vẫn là mảng mây của Cloud), `plot` (luống đất không đế); gợi ý `game: true` cho ảnh cắt từ art Farm (dùng hình dáng + chất liệu, cùng phong cách) thay câu "bỏ qua phong cách". Prompt Cloud không đổi.
⚠️ Quyết định tự đưa ra: gói hạt Garden cùng dáng gói hạt Cloud; luống đất theo luống rau trong ảnh môi trường Farm (khung gỗ thấp); Máy xay là nhà xay có cối đá (khác cối xay gió Farm); Thùng ủ là thùng gỗ nan; thức ăn cao cấp là bao tải buộc ruy băng vàng, có bắp + cà rốt. Garden chưa có ảnh mẫu bố cục và nền vẫn vẽ bằng code: batch này không có `bg_garden`.
👉 Bạn cần: tạo 7 ảnh theo `asset/batches/garden-01-crops.md`, `garden-02-items.md`, `garden-03-world.md`, lưu đúng tên (`C1.png`, `S.png`, `L.png`…) vào thư mục làm việc; nếu muốn Garden làm lại cảnh như Cloud / Sảnh thì gửi ảnh mẫu bố cục.
➡️ Tiếp theo: `batch.mjs cut garden-0*` → chọn → `deliver` → `art:process` → chạy game, chụp Garden → chờ duyệt.

### 2026-10-13 — GĐ14 Aquarium: kế hoạch art + bộ prompt (chờ duyệt, chưa tạo ảnh)
✅ Đã làm: `asset/AQUARIUM_ART_PLAN.md` — định hướng art, 4 cấp môi trường gắn 4 cấp bể có sẵn (Bể Kính Bên Bến / Hồ Đá Ven Bờ / Đầm San Hô Sinh Thái / Vịnh Ngọc Trai Cổ), layout 1800×900 chung, danh sách asset P0–P2, prompt Gemini (concept, mock từng cấp, sửa mock thành nền, sheet cá / vật / icon / tiền cảnh / NPC), quy trình.
✅ Bổ sung: mục 5.2 tách thành prompt riêng cho từng cấp (prompt concept 5.1 gộp mọi vùng vào một ảnh); mực nước giữ 28% ở mọi cấp.
✅ Chủ dự án chốt **cấp bể 5 "Đại Dương Sâu"** (decision 026): tài liệu đổi thành 5 cấp, thêm prompt mock T5, tiền cảnh AQ-FG5, sứa trang trí. Số của cấp 5 (20 cá; 20.000 + 40 vảy + 5 ngọc trai + 8 bánh răng cổ; nước ×0,5) chờ duyệt, **chưa sửa content**.
✅ T5 sửa theo góp ý: chìm hẳn dưới nước, hùng vĩ hơn (cá voi, manta, hẻm vực nhiều lớp); chỗ câu là dây câu thả từ trên (`bld_fish_line_deep`, thêm vào sheet AQ-W1); prompt T5 có cách A (sửa từ mock v1) và cách B (vẽ mới).
👉 Bạn cần: duyệt số cấp 5; chốt các điểm còn lại ở §0 (khung 2:1, dòng manifest mới, ảnh `npc_fisher`, sinh vật trang trí).
➡️ Tiếp theo: tạo concept + mock T1–T4, rồi T5 (đính kèm mock T4) → duyệt → viết batch `aquarium-01..05`; thêm dòng cấp 5 vào `balance.json` sau khi số được duyệt.

### 2026-10-13 — GĐ14 Sảnh: art world-01-scene vào game, bỏ nhân vật ở Sảnh (chờ duyệt)
✅ Đã làm:
1. **Cắt batch `world-01-scene`** (9 ảnh Gemini của chủ dự án): 31 file → `public/assets/`, status `production`. Sheet P Gemini vẽ 4×2 (thay 2×4), sheet H vẽ 2 bộ trùng → cắt theo lưới thật, lấy bộ trên; không cần vẽ lại. `bg_plaza` 1511×704 → 1932×900.
2. **Bố cục đo lại trên nền thật** (đường đi lệch ảnh mẫu một chút): 5 cổng, nhà, đài phun nước, cây, bụi, đèn, ghế, bồn hoa; bảng tên 160 px với icon khu vực; Bảng đơn hàng cạnh quảng trường; tia nước đài phun ở đỉnh tượng mây.
3. **Bỏ nhân vật ở Sảnh** (yêu cầu của chủ dự án, decision 025): bấm vào công trình / bảng tên là vào khu; rê chuột: công trình phóng nhẹ, bảng nảy, gợi ý hiện ngay trên công trình (tên hoặc điều kiện mở); khu khóa: tối + ổ khóa + hiệu ứng từ chối. Thanh khu vực chỉ hiện khi Sảnh đã vẽ xong. Cài đặt: bỏ chọn nhân vật, phím chỉ còn Túi đồ / Codex / Menu. Gợi ý hướng dẫn "Vào Chuồng heo (phím E)" → "Bấm vào Chuồng heo để bắt đầu". Xóa code đi bộ của Sảnh; save không đổi.
🛠️ Lỗi tìm thấy và đã sửa: bấm thanh khu vực khi game còn tải ảnh làm Farm tải trùng texture ("Texture key already in use") → thanh chỉ hiện khi Sảnh sẵn sàng.
🧪 Đã kiểm tra: `npm run check` xanh (1.361 test); 14/14 e2e (Electron, bản build) xanh; chụp Sảnh 1837×856 và 1600×900, rê chuột lên cổng mở / cổng khóa.
⚠️ Quyết định tự đưa ra (chủ dự án cho tự quyết HUD): giữ HUD như decision 024; trường đi bộ của layout (`walkArea`, `spawn`, `solid`…) để lại vì Admin còn ghi; `ui_icon_lock` vẫn là placeholder (batch `plaza-01-icons`).
👉 Bạn cần: xem Sảnh trong game; duyệt.
➡️ Tiếp theo: Garden (`garden-01..03`).

### 2026-10-13 — GĐ14 Sảnh: bố cục và HUD theo ảnh mẫu, batch world-01-scene (chờ chủ dự án tạo ảnh)
✅ Đã làm:
1. **Ảnh mẫu** `art_inbox/.batch/world-01-scene/sobi-world-lobby.png` → `asset/reference/sobi_world/plaza_layout_mock.png` (CONTENT, đăng ký trong reference-registry). Decision 024.
2. **Bố cục Sảnh** (`content/plaza/layout.json`) đo lại trên ảnh mẫu: khung 1932 × 900, 5 cổng, nhà, đài phun nước, cây, bụi, đèn, ghế, bồn hoa, đá, đường đất, quảng trường, biển. Bảng đơn hàng đặt cạnh quảng trường (ảnh mẫu không có).
3. **Cảnh**: nền vẽ sẵn (`backdrop`, chỉ bật khi `bg_plaza` có ảnh thật, ngoài khung tô màu trời / mây), `fallback` cho từng vật (art cũ tới khi art mới về), `paintedGround` (thuyền, vỏ sò chỉ vẽ khi chưa có nền); bảng tên có chỗ cho icon khu vực.
4. **HUD Sảnh** theo ảnh mẫu: thẻ hồ sơ + Sobi Coin, Ngọc, thanh Cấp thế giới có sao; nút Sảnh / Bộ sưu tập / Menu / Vật phẩm; thanh 5 khu vực (đi thẳng tới khu đã mở, khu khóa báo lý do); logo Sobi World. Chip thời tiết dời xuống dưới thẻ hồ sơ.
5. **Batch `world-01-scene`** (`asset/batches/world-01-scene.json` + `.md`, file đính kèm có sẵn trong `art_inbox/.batch/world-01-scene/`): E (nền, sửa ảnh mẫu), A (cổng Adventure, bể cá, đài phun nước), B (nhà, cây đậu thần), F (vườn hoa, trại heo), P (8 đồ trang trí), D (bảng tên, logo, sao cấp), H (4 icon HUD), I (5 icon khu vực), C (linh vật Sobi). 23 dòng manifest mới (placeholder) + kích thước canvas.
🧪 Đã kiểm tra: `npm run check` xanh; 13/13 e2e (Electron, bản build) xanh; chụp Sảnh ở 1837×856 và 1600×900 (art cũ, chưa có nền mới).
⚠️ Quyết định tự đưa ra: bỏ nút "Bản đồ" (đang tắt) và thêm "Bộ sưu tập" như ảnh mẫu; không làm nút "quay lại" và "+" cạnh Ngọc (không có tính năng); thanh khu vực cho đi thẳng tới khu đã mở.
👉 Bạn cần: tạo 9 ảnh Gemini theo `asset/batches/world-01-scene.md`, lưu vào `art_inbox/.batch/world-01-scene/` đúng tên (`E.png`, `A.png`, …); duyệt hướng HUD / thanh khu vực.
➡️ Tiếp theo: `batch.mjs cut world-01-scene` → chọn → `deliver` → `art:process`, chỉnh chỗ chữ trên bảng tên / tia nước đài phun theo art thật, chụp duyệt.

### 2026-10-12 — GĐ14 Cloud: sửa theo góp ý (hoa, ô mây, hover, chim bắt sâu, màu UI) — chờ duyệt
✅ Đã làm:
1. **Hoa nằm đúng lòng đất**: đo trên ảnh — lòng đất của `plot_cloud` cao hơn tâm ô 10,6 px, gốc hoa cách đáy canvas 6 px → `flowerOffsetY` = +1 (trước là +32: lệch xuống ~38 px).
2. **Hoa đung đưa**: xoay quanh gốc, biên độ theo giai đoạn (mầm 1,6°, đang lớn 2,6°, nở 3,4°, héo 1°), mỗi cây một nhịp, cơn gió chung chậm; hoa nở vẫn "thở".
3. **Ô mây trắng**: viền vàng là khe trong suốt giữa đám mây và một vòng viền rời (sót từ bóng khi cắt) → xoá vòng viền (morphological opening) trong `plot_cloud.png`. Hover ô: nhấc 3 px + sáng hơn 7% (không quầng vàng). Ô chưa mở: xanh xám nhạt, hơi trong (thay xám đậm).
4. **Hover công trình riêng từng loại** (bỏ glow): suối bắn giọt nước, vạc nảy nhẹ + sủi bong bóng (lặp khi giữ chuột; rê vào bảng gỗ cũng vậy); bảng gỗ và nút tầng phóng nhẹ.
5. **Chim mây** (`scene/cloudBird.ts`): nghỉ lơ lửng 4,5–9 s rồi bay đường cong tới điểm ngẫu nhiên trên đảo hoặc về chỗ đậu, quay đầu theo hướng bay, vỗ cánh nhanh khi bay. **Sâu trang trí** (vẽ bằng code, không gameplay, không save): 9–18 s một lần, tối đa 2 con, trên cây đang lớn / đã nở; chim chờ ~2,5 s rồi lần lượt bay tới mổ; sâu biến mất khi hoa được hái hoặc đổi tầng.
6. **Màu UI dịu**: HUD trên (xu, nước, cấp, nút) nền trắng–tím nhạt chữ tím đậm; thanh dưới và 5 nút pastel chữ đậm, bỏ quầng vàng khi hover.
🧪 Đã kiểm tra: `npm run check` xanh (1.374 test, guard OK); Edge ẩn 1916×949 với save cuối game: tầng cao → tầng 1, phóng to ô (gốc hoa trong đất), hover ô / suối / vạc, quan sát chim 45 s (dò màu thấy sâu ở khung 40–42, chim tới khung 43, sâu biến mất khung 44), bật "Giảm chuyển động" → 2 khung cách 1,5 s giống hệt; không lỗi console. Ảnh: `art_inbox/.qa/cloud-review/v3/final/`.
⚠️ Quyết định tự đưa ra: sâu chỉ trang trí (không hại cây, không đổi gameplay/save — freeze); sprite sâu, giọt nước, bong bóng vẽ bằng code (không cần batch Gemini).
👉 Bạn cần: duyệt lại màn Cloud.

### 2026-10-12 — GĐ14 Cloud: cắt batch cloud-04, cảnh theo nền thật, hiệu ứng (chờ duyệt)
✅ Đã làm:
1. **Cắt `cloud-04-scene`** (3 ảnh Gemini của chủ dự án; `C.png` lưu nhầm ở `cloud-03-world`, đã chuyển): `bg_cloud` (nền đảo sửa từ ảnh mẫu, 1453×720 → 1816×900, phóng ×1,25), `prop_sign_plank`, `prop_title_banner`, `ui_btn_tier_up/down`, `prop_cloud_bird`, `prop_npc_alchemist` → `public/assets/`, status `production`. `cut-sheet.mjs` bỏ vạch chia khung do model vẽ; dấu ✦ của Gemini nằm ngoài vật thể nên không vào sprite. Kích thước khung chỉnh theo tỉ lệ art thật (bảng 300×110, băng rôn 520×198, cú 240×300). Bác Cú Giả Kim dùng ảnh cú (`npcs.json` `artId`).
2. **Bố cục theo nền thật** (nền = ảnh mẫu thu nhỏ 0,815 → toạ độ đo trực tiếp): lưới 5×3, suối / vạc trên 2 thảm cỏ, bảng gỗ, băng rôn tên tầng tự co cho vừa, nút tầng hai bên, nhãn số là viên tròn viền trắng.
3. **Hiệu ứng** (tắt hết khi "Giảm chuyển động"): mây nhỏ trôi qua trời mỗi đám một tốc độ; chim mây bay lơ lửng, đung đưa, vỗ cánh; băng rôn và nút tầng nổi nhẹ lệch nhịp; vạc phồng nhẹ khi đang nấu; hoa nở "thở" như cũ. Rê chuột: ô hoa sáng viền vàng + nhấc 4 px, suối / vạc / bảng / nút sáng + phóng 5%, thẻ hoa và nút ở thanh dưới có quầng ấm. Chuyển tầng: ô hoa trôi lên / xuống và mờ, dải mây mềm (blur) che rồi tách ra, nền trời dịch nhẹ (parallax), tên tầng bật lên. Cú nhún nhảy trong khung chân dung.
4. Tách cảnh cho đúng guard (≤ 300 dòng): `cloudFx.ts`, `cloudTierBar.ts`, `cloudBuildings.ts`.
🛠️ Lỗi tìm thấy và đã sửa: Esc đóng hộp thoại của Area (Cloud, Garden, Aquarium…) lại mở luôn Cài đặt (hotkey chỉ thấy hộp thoại của Farm) → `app.ts` `dialogOpen` nhận mọi `.c-dialog`; tên tầng co sai khi đang tween.
🧪 Đã kiểm tra: `npm run check` xanh (1.374 test, guard OK); chạy game bằng Edge ẩn 1916×949 với save cuối game: tầng 8 → chuyển cảnh → tầng 1 → tầng 9 (khóa, thông báo cấp / giá, nút lên ẩn), rê chuột ô / nút, bấm bảng "Suối mây" mở hộp thoại, Esc chỉ đóng hộp thoại; không lỗi console, không 404. Ảnh: `art_inbox/.qa/cloud-review/v2/`.
⚠️ Còn lại: nền là ảnh phóng ×1,25 (hơi mềm); 9 tầng cao dùng chung nền + màu phủ (đề xuất nền riêng từng tầng); HUD chung chưa đổi theo mẫu.
👉 Bạn cần: duyệt ảnh Cloud (tầng 1, tầng cao, khi chuyển tầng).
➡️ Tiếp theo: sau khi duyệt → HUD mới theo mẫu hoặc Garden.

### 2026-10-12 — GĐ14 Cloud: làm lại cảnh theo ảnh mẫu + 10 tầng mây (decision 023)
✅ Đã làm: chủ dự án không duyệt màn Cloud (bố cục placeholder: khối trắng, trời phẳng, nhãn chữ trần) và gửi ảnh mẫu bố cục; yêu cầu thêm tầng mây.
1. **10 tầng mây × 15 ô** (mở theo cấp + vàng, chỉ thêm ô): content `plotsPerTier` + `plotExpansions.level`, `nextExpansion` trả `tier` / `level`, `buyPlots` chặn `LEVEL_TOO_LOW`, toast "Đã mở <tầng>!", **save Cloud v2** (18 ô cũ → mở trọn tầng 2), Admin có nhãn cho trường mới, chuỗi Việt / Anh cho 10 tên tầng.
2. **Cảnh mới theo mẫu**: nền vẽ phủ kín màn hình rộng, lưới 5×3, suối / vạc bên trái, bảng gỗ nhãn, băng rôn tên tầng + nút lên / xuống, chim mây; thanh dưới hiện hình hoa, nút màu, icon không còn bị vỡ điểm ảnh. Sửa thêm: ảnh nạp muộn không còn kẹt ở ô vuông dự phòng.
3. **Batch `cloud-04-scene`** (3 lượt Gemini): nền sạch sửa từ ảnh mẫu, bảng / băng rôn / nút, chim + Cú Giả Kim; `batch.mjs` hỗ trợ sheet "sửa ảnh" và gợi ý "giống y kiểu dáng". Ảnh mẫu lưu ở `asset/reference/sobi_cloud/cloud_layout_mock.png`.
🧪 Đã kiểm tra: `npm run check` xanh (1.374 test, thêm 4 test tầng mây + migration); chụp màn Cloud 1916×949 bằng Edge chạy ẩn với save cuối game (save được nâng v2, mở tới tầng 8, hiển thị đúng; phần trang trí còn placeholder).
⚠️ Lưu ý: bot kinh tế mở tới tầng 8 trong 45 ngày → cần chơi thử, chỉnh giá ở Admin nếu quá nhanh. Nền hiện là placeholder cho tới khi có ảnh Gemini.
👉 Bạn cần: tạo 3 ảnh theo `asset/batches/cloud-04-scene.md` (nên dùng Google AI Studio để không có watermark), rồi báo "cắt batch cloud-04".
➡️ Tiếp theo: cắt → đặt nền, căn lại vị trí theo nền thật → chụp lại → duyệt → Garden.

### 2026-10-12 — GĐ14 Cloud: 43/44 asset art thật (chờ duyệt)
✅ Đã làm: chủ dự án tạo 8 sheet Gemini theo `asset/batches/cloud-0*.md`; agent cắt (`batch.mjs cut`, cả 8 sheet khớp lưới), duyệt bảng ứng viên, giao 43 asset, `art:process` (status `production`), chạy game bằng save cuối game (`dev:rich-save` + `dev:sandbox`): vườn mây, suối, vạc, 6 gói hạt, icon hoa / potion trong Kho hiển thị đúng, không lỗi console.
🧪 Đã kiểm tra: `npm run check` xanh (1.370 test), `assets:check` OK, `qa.mjs` không FAIL (T8 viền mờ ở cây thân mảnh do thu nhỏ ~0,5×: chấp nhận).
⚠️ Chưa nhận: `bg_cloud` — ảnh Gemini có watermark ✦ hiển thị ở góc dưới phải, agent không tự xóa watermark → cần tạo lại (Google AI Studio) hoặc chủ dự án quyết; CloudScene vẫn tô trời bằng code (nối ảnh sau). Hoa lệch nhẹ phong cách: nét mảnh và nhạt hơn bộ Farm (nội dung, giai đoạn, tỉ lệ đúng) → chờ chủ dự án quyết giữ hay vẽ lại.
👉 Bạn cần: duyệt ảnh chụp Cloud; chọn giữ hoa hay vẽ lại; tạo lại nền trời.
➡️ Tiếp theo: sau khi duyệt → Garden (`garden-01..03`).

### 2026-10-12 — GĐ14: dựng quy trình art (skill + kế hoạch batch), Cloud sẵn sàng để vẽ
✅ Đã làm (decision 022): chủ dự án chốt **phong cách chuẩn = Sobi Farm**, **Area đầu tiên = Cloud**; nguồn ảnh = Gemini bản miễn phí do chủ dự án chạy (phiên agent không có model ảnh, không mua API).
1. **Skill `image-to-asset` cho Sobi World**: backend **G** (`workflows/batch.md`): `scripts/batch.mjs` (`list` / `prep` / `cut` / `deliver`) sinh prompt + bảng phong cách + ảnh gợi ý, cắt sheet, ra ảnh duyệt; `scripts/cut-sheet.mjs` tách nền xám phẳng, chia lưới, cắt từng asset, giữ chung tỉ lệ cho các giai đoạn của cây (`fit shared`), có dự phòng cho vật thể nhiều mảnh; `references/families.md` (canvas, hướng nhìn, backend từng nhóm id), `references/style-boards.json` (bảng phong cách từ art Farm, khối prompt). `ref-check.mjs` quét thư mục con; registry thêm lớp `CONTENT` (mock-up Sobi World chỉ gợi ý hình dáng).
2. **Kế hoạch 162 placeholder** → 17 batch, khoảng 39 lượt Gemini (`asset/batches/README.md`), cùng danh sách việc ngoài manifest (NPC, icon thời tiết / công nghệ / tính trạng, VFX, âm thanh). **Cloud**: 3 batch đã viết và `prep` (`cloud-01-flowers` 24, `cloud-02-items` 16, `cloud-03-world` 4: 8 lượt Gemini).
3. **Ảnh tham khảo** gom về `asset/reference/<area>/` (+ README): đổi tên 5 ảnh Cloud theo nội dung, bỏ `docs/reference-assets/` (bản trùng).
🛠️ Lỗi tích hợp tìm thấy và đã sửa: lần dời thư mục `asset/*/sobi_farm/` trước đây làm hỏng đường dẫn của `cut-reference`, `cut-buildings`, `cut-seasons`, `cut-season-fx`, trang Nguồn art của Admin (`scripts/admin/artFiles.ts`, `tools/admin/assets.ts`) và `resolve.mjs` của skill.
🧪 Đã kiểm tra: `npm run check` xanh (1.370 test); `ref-check` "style profile current"; `cut-sheet` / `batch cut` chạy thử trên sheet giả (2×6, 2×4, vật thể nhiều mảnh, lưới sai báo lỗi đúng) rồi xóa dữ liệu thử.
⚠️ Quyết định tự đưa ra: ngoại hình 6 hoa (spec không tả; màu theo placeholder), potion xanh lá / hồng / tím theo `ASSET_TODO`, nước tinh khiết là lọ giọt nước (khác dáng potion), công trình Cloud đứng trên mảng mây thay cỏ; animation làm bằng code, không vẽ nhiều khung. `bg_cloud` có trong manifest nhưng CloudScene vẫn tô trời bằng code: nối ảnh sau khi được duyệt.
👉 Bạn cần: tạo 8 ảnh theo `asset/batches/cloud-0*.md` (thư mục làm việc `art_inbox/.batch/<batch>/`), lưu đúng tên; rồi bảo mình "cắt batch cloud".
➡️ Tiếp theo: cắt → chọn → `art:process` → chạy game, chụp Cloud → chờ duyệt → Garden.

### 2026-10-11 — GĐ14 bắt đầu: phần code (art chờ chủ dự án)
✅ Đã làm: chủ dự án chọn "làm phần code, art chờ bạn" vì phiên agent không có model tạo ảnh / âm thanh (162 asset còn `placeholder`, skill `image-to-asset` ở trạng thái BLOCKED cho backend X).
1. **Hiệu ứng đòn trong trận Adventure** (`areas/adventure/ui/battleFx.ts`, SCSS `adventure-hit/heal/ko`): so máu từng đơn vị với lần vẽ trước → rung + nháy đỏ khi trúng đòn, vòng sáng khi hồi máu, mờ dần khi gục. Chỉ là trình bày; test `tests/unit/battleFx.test.ts`.
2. **Màn mờ khi đổi nơi** Sảnh ↔ Area (`ui/components/placeVeil.ts`, gọi từ `setPlace`): kem nhạt tan trong 0,45 giây; tắt khi giảm chuyển động.
🧪 `npm run check` xanh (1.370 test; `saveFiles` "rotation keeps the newest 5" từng đỏ một lần do EPERM của Windows khi đổi tên file, chạy lại thì qua: không liên quan).
⚠️ Chưa làm (cần chủ dự án / model ảnh): toàn bộ 162 asset placeholder, nhạc nền từng Area, âm thanh riêng; chưa làm animation trứng nở, toast "lễ hội bắt đầu / Thương nhân đến", dòng lễ hội trong màn vắng mặt; `assets:release` chưa qua. Chưa chụp màn hình để duyệt (quy tắc: duyệt từng Area).
👉 Bạn cần: cho biết nguồn art (tự tạo theo brief, hay cấp model ảnh cho phiên sau); mình sẽ soạn brief theo từng Area từ `ASSET_TODO.md`.

### 2026-10-11 — GĐ13 hoàn thành: tích hợp, nghiệm thu, freeze (chờ duyệt)
✅ Đã làm (8 việc của prompt GĐ13; danh sách nghiệm thu đầy đủ ở `docs/ACCEPTANCE.md`, freeze ở `docs/decisions/021-gameplay-freeze.md`):
1. **Danh sách nghiệm thu** từng Area (GĐ1–GĐ12) và 13 hệ thống chung, mỗi mục có cách kiểm và kết quả; thêm `tests/scripts/acceptance.test.ts` (bot chơi 40 ngày qua đủ Farm → Garden → Aquarium → Cloud → Adventure + đơn, mục tiêu, Codex, lễ hội, Thương nhân; 9 khẳng định).
2. **UI chức năng**: rà mã mọi nút tắt: đều đi qua dry-run và hiện lý do; sửa nút khẩu phần hết hàng. Lướt 12 màn hình của Menu bằng tiếng Anh ở cỡ chữ lớn nhất: không vỡ bố cục.
3. **Trợ năng** (`settings.json`, theo máy, không vào save): cỡ chữ Vừa / Lớn / Rất lớn (gốc `rem`), màu **dễ nhìn** (xanh dương – cam thay xanh lá – đỏ, độ hiếm tương phản cao, viền và vòng focus đậm; màu ngữ nghĩa đổi sang biến CSS), **tắt rung màn hình** (chỉ bỏ rung, giữ VFX / âm thanh); giảm chuyển động có từ trước. `<html lang>` theo ngôn ngữ.
4. **Ngôn ngữ Việt / Anh** chọn trong Cài đặt: bảng chuỗi tiếng Anh (`src/i18n/en/`, ~1.700 dòng, kiểu bắt buộc cùng khóa với `vi.ts`), chữ trong `content/*.json` (tên 75 giống heo, NPC, kỹ năng, cá, hoa, lễ hội… 413 chữ) dịch qua `content/i18n/en.json` (khóa theo id, hook `setContentLocalizer` trong `loadContent`); đổi ngôn ngữ lưu save rồi tải lại màn hình. Test chặn thiếu / thừa khóa, sai `{tham_số}`, lẫn chữ Việt.
5. **Hiệu năng**: `npm run perf:catchup` (thế giới 45 ngày, 5 Area): một bước 1 giây của game **0,11 ms**, bù 30 ngày **0,45 giây**, 1 ngày 16 ms, save 57 KB; FPS trên Electron (build thật): Sảnh **54**, Nông trại **60** (`tests/e2e/perf.spec.ts`). Không cần tối ưu.
6. **Rà tài nguyên chết và save**: `npm run items:audit`: 67 vật phẩm, 0 dưới 2 công dụng. `tests/unit/saveVersions.test.ts`: save v1, v7 (Sobi Farm) và v8, v9, v10 (save dev thật, thêm vào `tests/fixtures/`) đều mở được, giữ ví và heo, ghi → đọc lại đúng, chơi tiếp 30 ngày không lỗi; save bản mới hơn bị từ chối.
7. **Chơi thử bằng máy**: `sim:week` 60 ngày nhiều seed; `npm run test:e2e` 13/13 (thêm `display` và `perf`); `npm run dist:win` + `verify:build` + `verify:installer` (`release/SobiWorld-Setup-0.13.0.exe`); xem tay trong trình duyệt bằng save cuối game (`npm run dev:rich-save`): màn "vắng mặt", 12 màn Menu, cỡ chữ, màu dễ nhìn, tiếng Anh.
8. **Freeze** (decision 021): ghi những gì đóng băng, những gì còn được làm, và 1 số chờ chốt.
🛠️ Lỗi tích hợp tìm thấy và đã sửa: (a) **World Development thiếu số hạng "công trình Lv3"** của decision 013 (registry luôn truyền 0): nối máng / vòi tưới / bể / suối (`AreaModule.buildingLevels`), cổng mở Area và Bảng đơn dùng cùng một số (`phase13.test.ts`); (b) chữ "KN" cứng trong thưởng Codex; (c) nút khẩu phần hết hàng không nói lý do.
📁 File chính: `src/i18n/{en/,language.ts,locale.ts,contentText.ts}`, `content/i18n/en.json`, `src/core/settings/settings.ts` (+ `ui/components/displaySettings.ts`, `app/display.ts`, `platform/earlySettings.ts`, `app/main.ts`), `styles/features/_access.scss` + tokens, `feedbackPlan` (rung), `core/area-registry` (`buildingLevels`), `scripts/perf/catchup.ts`, `scripts/dev/richSave.ts`, `scripts/content/i18nDump.ts`, `tests/unit/{i18n,saveVersions,phase13}.test.ts`, `tests/scripts/acceptance.test.ts`, `tests/e2e/{display,perf}.spec.ts`, `docs/{ACCEPTANCE.md,decisions/021-gameplay-freeze.md}`.
🧪 Đã kiểm tra: `npm run check` xanh (1.367 test, thêm 43 của GĐ13); `npm run test:e2e` 13/13; `dist:win` + verify xanh; `perf:catchup` trong ngân sách.
⚠️ Quyết định tự đưa ra: chữ trong content dịch bằng lớp phủ (file content vẫn tiếng Việt, id không đổi) để Admin và save không đổi; cài đặt hiển thị lưu ở `settings.json` (theo máy) chứ không trong save nên không đổi định dạng save; màu "dễ nhìn" là một chế độ riêng chứ không đổi mặc định; không đổi số nào của gameplay.
⚠️ **Cần chủ dự án quyết (chặn freeze): điều kiện mở Adventure.** Đang Phát triển thế giới 20. Bot không sưu tầm mở Adventure ngày **~47** (ngay cả sau khi nối công trình Lv3: các công trình cấp 3 cần vật liệu cổ của chính Adventure nên không giúp mở nó). Đo: 18 → ngày 31, 16 → ngày 23, 14 → ngày 18; Cloud (WD 15) mở ngày ~22. Đề xuất 16–18 (một số trong `content/adventure/area.json`, Admin sửa được). Chưa đổi vì là số đã chốt ở decision 013.
⚠️ Chưa làm / giới hạn: chơi tay ≥ 7 ngày (điều kiện duyệt); bản cài trên **máy sạch thật** (`docs/TEST_MAY_SACH.md`); Admin không có màn dịch riêng (có mục hướng dẫn "Ngôn ngữ" và `npm run content:i18n`); thêm một mục content có chữ mà quên bản tiếng Anh thì test đỏ (cố ý); chưa có mẫu chữ cho tiếng Anh dạng số nhiều ("1 pigs": đã viết dạng "Label: {count}" để tránh); FPS chỉ đo trên máy dev có GPU; bot không ấp Trứng Heo Hoang (giới hạn của bot, không phải lỗi game).
👉 Bạn cần: (1) chơi thử ≥ 7 ngày thật, thử đổi cỡ chữ / màu / tiếng Anh; (2) chốt WD mở Adventure (16–18?); (3) thử bản cài trên máy sạch; (4) nếu ổn: merge `main`, tag `phase-13`, push; freeze có hiệu lực.
➡️ Tiếp theo: GĐ14 (art, animation, VFX, âm thanh theo `docs/ASSET_TODO.md`).

### 2026-10-11 — GĐ12 hoàn thành phần code: Thế giới động (chờ duyệt)
✅ Đã làm (6 việc của prompt GĐ12; quyết định ở `docs/decisions/020-living-world.md`):
1. **Thời tiết** (`systems/weather`, `content/shared/weather.json`): nắng / mưa / sương mù / tuyết / cầu vồng là hàm thuần của **số ngày** (mùa theo lịch Việt, cầu vồng sau mưa), nên nhất quán mọi chế độ mô phỏng và **dự báo ngày mai chính xác**; không lưu gì. Tác dụng nhẹ, không phạt: **mưa** tưới mọi ô đất và cây lớn ×1,25 (`simulateGarden` cắt ở mỗi nửa đêm nên một cú nhảy dài = nhiều lát ngắn), **mưa đêm** cá hiếm dễ cắn ×1,8, **sương mù** +0,1 điểm câu, **cầu vồng** +3 điểm % đột biến khi phối giống (Farm và Aquarium). Nắng, tuyết chỉ là cảnh.
2. **Hiệu ứng thời tiết** ở Area đang xem (`ui/live/skyLayer`): lớp CSS placeholder (tông, vệt mưa, tuyết, vòng cầu vồng, tắt khi giảm chuyển động) + chip ở góc trái; popup **Thời tiết** (hôm nay, ngày mai).
3. **4 lễ hội** (Thu hoạch / Cá / Hoa / Heo, chu kỳ 28 ngày, mỗi lễ hội 4 ngày) với **Vé Lễ Hội** (`wallet.eventTokens`): hoạt động trả vé (trần 12/ngày) + quà 3 vé/ngày; **cửa hàng lễ hội** (4 món chung, 3–4 món theo chủ đề, giới hạn theo lần lễ hội; chỉ bán vật phẩm đã có).
4. **Thương nhân** (`core/live/merchant`): ghé 40% số ngày, 3 đơn đặc biệt ×1,8 giá trị + 1 vé mỗi đơn, đơn giữ nguyên cả ngày; ngày ông ghé một nhóm hàng của **Chợ** được +0,15 hệ số.
5. **Admin**: Số liệu có `weather.json`, `festivals.json`, `merchant.json`; Người chơi → Trạng thái game → "Thế giới sống (bật thử)": lịch 14 ngày, ép thời tiết / lễ hội / Thương nhân mọi ngày, cộng vé.
6. **Cân bằng tổng thể**: bot có routine (`scripts/economy/live.ts`), `npm run sim:week -- <seed> 28 [plain]` so thế giới động với trước GĐ12: tiến trình nhanh hơn ≤ 0,8 ngày ở cấp 11, lễ hội ~6.000 Sobi Coin/28 ngày (~2–3% thu nhập), Thương nhân ~70 Sobi Coin/ngày. Số liệu đầy đủ trong decision 020.
**Save v11** (migration 10 → 11, chỉ thêm `live`; test với save v10): `live.festival`, `live.merchant`, `live.dev` (công tắc thử của Admin).
📁 File chính: `src/systems/weather/`, `src/core/live/` (`festival`, `merchant`, `visit`, `state`), `content/shared/weather.json` / `festivals.json` / `merchant.json` + schema, `src/ui/live/` (`skyLayer`, `liveVm`, `livePanels`), `src/styles/features/_sky.scss`, `src/systems/plants/plot.ts` (`PlotWeather`), `src/areas/garden/logic/simulate.ts`, `src/areas/aquarium/logic/{fishing,sky}.ts`, `src/systems/valuation/market.ts` (+ `marketRules.ts`), `core/goals/{settle,events,api}.ts`, `tools/admin/liveSection.ts`, `scripts/economy/live.ts`, `tests/unit/liveWorld.test.ts`, `tests/e2e/live.spec.ts`.
🧪 Đã kiểm tra: `npm run check` xanh (1.324 test, 25 test mới của GĐ12: thời tiết, mưa trong Garden qua nửa đêm, cần câu, lễ hội, thương nhân, màn hình, save v11 + migration); `npm run test:e2e` 11/11 (có `live.spec.ts`); `npm run dist:win` + verify:build + verify:installer (`release/SobiWorld-Setup-0.12.0.exe`); chạy thật trong trình duyệt (sandbox): chip thời tiết / lễ hội / Thương nhân ở Sảnh, popup Sự kiện (nhận quà, đổi), Thương nhân (giao một đơn), vòng cầu vồng, Menu có 3 mục mới.
⚠️ Quyết định tự đưa ra (decision 020): chu kỳ lễ hội 28 ngày theo số ngày (không theo tháng thật) để dễ thử và ai cũng gặp lễ hội trong ≤ 7 ngày; không tính vé cho thứ xảy ra khi vắng mặt; cửa hàng chỉ bán vật phẩm có sẵn (không tài nguyên chết); Thương nhân ghé theo xác suất cố định theo ngày; công tắc thử lưu trong save (`live.dev`); thời tiết không đổi Adventure; Nắng / tuyết chỉ là cảnh.
⚠️ Chưa làm: art / animation / VFX thật, sạp hay NPC Thương nhân vẽ ở Sảnh, đồ trang trí độc quyền lễ hội, toast "lễ hội bắt đầu" và dòng lễ hội trong màn "vắng mặt" (`docs/ASSET_TODO.md`); công tắc Admin không đổi phần Chợ; chưa chơi tay nhiều ngày; chưa kiểm `dist:win` trên máy sạch.
⚠️ Lưu ý khi thử: chạy `npm run dev` (không sandbox) trên nhánh này **nâng save dev** ở `%APPDATA%\SobiWorld Dev\saves` từ v10 lên v11 (có bản `before-migration-v10-*.json`); quay lại `main` thì game cũ báo save thuộc phiên bản mới hơn. Dùng `npm run dev:sandbox` để thử mà không đụng save dev.
👉 Bạn cần: chơi thử vài ngày (Admin → Người chơi → Trạng thái game → "Thế giới sống" để bật thử từng thời tiết, từng lễ hội và Thương nhân); xem mưa có tạo cảm giác "thế giới sống" nhưng không ép; Vé Lễ Hội có đủ / quá nhiều; giá cửa hàng lễ hội (Admin → Số liệu → Lễ hội); rồi merge, tag `phase-12`, push.

### 2026-10-11 — GĐ11 hoàn thành phần code: Adventure liên hệ thống (chờ duyệt)
✅ Đã làm (7 việc của prompt GĐ11; quyết định ở `docs/decisions/019-adventure-links.md`):
1. **Loot quay về**: vật liệu cổ (Quặng Núi, Bánh Răng Cổ, Rune Cổ) mở công trình Lv3–Lv4 ở Farm (máng Lv3, chuồng thứ 17–24), Garden (vòi tưới Lv3), Aquarium (bể Lv4), Cloud (suối Lv3); hạt giống hiếm, cá hiếm, **Trứng Heo Hoang** (ấp ở Farm ra heo Hiếm: `hatchEgg`, nút "Ấp trứng" trong Kho).
2. **Công nghệ** (`core/tech`, Menu → Công nghệ): Xưởng Cải Tiến (làm nhanh 15/30/45%), Lò Lớn (+5/+10/+20 mẻ), Bếp Dã Chiến (công thức khẩu phần + chỗ mang), Lều Trại (hồi năng lượng phiêu lưu +25/50/100%). Cấp lưu ở `progression.stats`, không đổi save; công thức có thể khóa theo công nghệ (`requiresTech`).
3. **Chuẩn bị trước trận**: 3 khẩu phần làm ở Máy xay (từ cây Garden, thảo mộc / nanh Adventure, nước Cloud) chọn ở sảnh Adventure; Bond +5% chỉ số mỗi tim (trước 3%); potion Cloud vẫn dùng trong trận.
4. **2 vùng mới** nối chuỗi: Núi Đá Vọng (cấp 10, sau trùm Rừng) và Tàn Tích Cổ (cấp 13, sau trùm Núi): 11 kẻ địch, 2 trùm, 7 sự kiện nhỏ, 3 trang bị Sử thi.
5. **Gems** theo GAME_BALANCE §8 (rương 3–4%, trùm 8–12%, 1–3 Gems).
6. **Luật "không tài nguyên chết"**: `npm run items:audit` (67 vật phẩm) + test chặn item < 2 công dụng. Sửa hạt giống (thêm bán lại); `FOOD_BASIC` và `MEDICINE_COMMON` có công dụng thứ hai trong code.
7. **Cân bằng 14 ngày**: bot có routine Adventure (`scripts/economy/adventure.ts`); `npm run sim:week -- 7 45 adventure`. Bot chạm Phát triển thế giới 20 rất muộn (không nuôi/sưu tầm như người chơi) nên lệnh có chế độ `adventure` mở Adventure ngay khi đủ cấp 8 (ngày ~15).
📁 File chính: `src/core/tech/`, `content/shared/tech.json`, `src/areas/adventure/logic/actions/start.ts`, `content/adventure/` (vùng, kẻ địch, trang bị, `prep`), `src/areas/farm/logic/actions/hatchEgg.ts` + `materials.ts`, `src/ui/goals/techPanel.ts` + `techVm.ts`, `core/production` (`durationMs` của job), `scripts/audit/itemUses.ts`, `scripts/economy/adventure.ts`, `tests/unit/phase11.test.ts`, `scripts/content/fmt.ts` (`npm run content:fmt`).
🧪 Đã kiểm tra: `npm run check` xanh (1.296 test, 24 test mới của GĐ11 + balance guard); `npm run test:e2e` (có e2e công nghệ + khẩu phần); chạy thật trong Electron: Menu → Công nghệ → nâng Bếp Dã Chiến → chọn khẩu phần → xuất phát (ảnh chụp); `npm run dist:win`.
📊 Bot 45 ngày (seed 7 và 11, cận trên: ~8 chuyến/ngày): Adventure mở ngày 15 → trùm Rừng ngày 19, Núi ngày 24, Tàn Tích ngày 31; công nghệ đầu ngày 23–24, đủ 12 cấp ngày 31–32; chiến binh cấp 17 sau 14 ngày; Adventure đưa ~3.800 Sobi Coin/ngày (Farm ~8.000) và ~3 Gems/ngày. Bản đầu quá rộng tay (vật liệu cổ gấp 10 lần nhu cầu, Adventure ngang Farm): đã giảm số rơi, tiền, giá bán, KN.
⚠️ Quyết định tự đưa ra (decision 019): giá và hiệu quả công nghệ; mở vùng theo chuỗi (thêm `requiresCleared`); khẩu phần là vật phẩm (không là potion) và cộng cho cả đội cả chuyến; Bond 3% → 5%; `expBase` 30 → 40 (lên cấp chậm hơn ~33%); trang bị Hiếm / Sử thi rơi ít, bán rẻ (Kiếm Gỗ 15 … Kiếm Rune 150); Farm: chuồng thứ 17–24 và máng Lv3 cần vật liệu cổ; hạt giống sell = nửa giá mua.
⚠️ Cần biết: (a) Phát triển thế giới 20 để mở Adventure vẫn rất xa với bot (`buildingsLv3` trong registry luôn 0, Codex mới chỉ tính mục khám phá); nên chốt ở GĐ13. (b) Bot hết nội dung sau ngày ~31 (cấp 30, mọi công nghệ, đủ 3 vùng). (c) Đội toàn kiểu giòn (Pháp sư lửa, Thích khách, Triệu bão) khó qua trùm Núi nếu thiếu hồi máu: cần khẩu phần / potion. (d) Gió yếu ở Núi (Lửa khắc Gió), nhỉnh ở Rừng. (e) Bot không dùng potion trong trận nên số thắng là sàn.
⚠️ Chưa làm: potion trong chuẩn bị trước trận, nút bỏ qua trận, nhiệm vụ / thành tựu riêng cho công nghệ và vùng mới, Codex kẻ địch / trang bị, nâng cấp thêm công trình bằng vật liệu cổ, art (GĐ14, `docs/ASSET_TODO.md`), chơi tay nhiều ngày.
👉 Bạn cần: chơi thử vài ngày (Admin: Số liệu → Công nghệ, Vùng; Mô phỏng trận có vùng mới, đồ Sử thi và khẩu phần): có cảm giác đi phiêu lưu để nâng cấp nhà, và chăm nhà để đi xa hơn không; duyệt các con số trong decision 019; xem Phát triển thế giới 20 có quá xa; rồi merge, tag `phase-11`, push.

### 2026-10-11 — Nghiệm thu GĐ10: chơi thử bằng mô phỏng và chỉnh cân bằng
✅ Đã làm: kiểm thử Adventure ở ngưỡng mở (Sobi World cấp 8 + Phát triển thế giới 20: test biên 7/20, 8/19, 8/20), đo bằng mô phỏng (`npm run sim:adventure`, mới) rồi chỉnh. Phát hiện bản đầu: trận chỉ 2–3 vòng; cấp 4+ thắng ~100%; Triệu bão / Pháp sư lửa hơn hẳn, Quỷ kế gần vô dụng (Rừng nặng hệ Đất); bộ trang bị Hiếm làm cấp 1 thắng 100%; cấp 4 sau 1 chuyến.
Đã chỉnh (chi tiết ở decision 018, mục Cân bằng): kẻ địch máu ×1,8 / công ×1,25 / thủ ×1,2 và hệ chia đều; kiểu đánh (Triệu bão, Pháp sư lửa bớt trội; Quỷ kế, Pháp sư nước, Hộ vệ, Man lực, Chiến binh chỉnh); hồi máu giảm; trang bị yếu đi; KN kẻ địch ×0,55, tiền ×0,6; điểm dừng đầu có nhóm 1 kẻ địch cho đội một heo cấp 1.
Kết quả: đội 3 (Chiến binh, Hộ vệ, Pháp sư nước): cấp 1 0% · cấp 3 ~10% · cấp 4 ~35–55% · cấp 5 ~70% · cấp 6 ~95% · cấp 8 ~100%; trận 4–5 vòng; thua = −30 năng lượng và kiệt sức 4 giờ, giữ KN và loot. Cấp 5 sau ~2 ngày, cấp 8 sau ~5 ngày chơi.
🧪 `npm run check` xanh (1.271 test, thêm 6: ngưỡng mở + "balance guard"); `npm run test:e2e` 9/9.
⚠️ Còn lại: chưa có người chơi tay nhiều ngày (số là từ mô phỏng, AI đánh cho cả hai bên); Rừng chỉ có một vùng nên đội ba con cùng kiểu Pháp sư nước / Thích khách hơi nhỉnh; vùng mới ở GĐ11 nên đổi cơ cấu hệ. Bot  chưa có routine Adventure (GĐ11). Art / animation / âm thanh ở GĐ14.

### 2026-10-11 — GĐ10 hoàn thành: Sobi Adventure
✅ Đã làm (10 việc của prompt GĐ10; quyết định ở `docs/decisions/018-adventure.md`):
1. **`systems/combat`**: thứ tự theo Tốc độ, đòn thường, kỹ năng (năng lượng trận + hồi chiêu), dùng vật phẩm, 4 nguyên tố (×1,5 khắc chế), chí mạng, 7 trạng thái, AI (kẻ địch và nút Tự động); thuần, có seed, lưu giữa chừng rồi chơi tiếp ra cùng kết quả.
2. **Cấp / KN / chỉ số** theo cấp, độ hiếm, tim Bond và trang bị; kỹ năng mở ở cấp 1, 1, 10, 20.
3. **`systems/equipment`**: 3 ô (vũ khí, giáp, bùa), 9 món là vật phẩm `EQUIPMENT`.
4. **8 kiểu đánh × 4 kỹ năng riêng, 20 kỹ năng** (5 mỗi nguyên tố); 14 họ heo và 6 loài cá đánh được.
5. **Vùng Rừng Thì Thầm**: 5 điểm dừng + trùm, loot, sự kiện nhỏ, 8 loại kẻ địch.
6. **Thua = Kiệt sức 4 giờ thật**, không mất gì; bệnh không vào được; rút lui giữa hai điểm dừng không phạt.
7. **Heo khởi đầu** từ Hiệp Sĩ Heo (tặng qua registry, không import Farm); mục đích Phiêu lưu mở ở Farm và Aquarium (loài đánh được).
8. **UI**: sảnh (chọn đội, thanh KN và năng lượng, trang bị), bản đồ chuyến, trận đánh với **Tự động** và **tốc độ x2**, tổng kết.
9. **Admin**: Số liệu sửa kẻ địch, kỹ năng, kiểu đánh, vùng, trang bị, cân bằng; trang **Mô phỏng trận**; tua thời gian dịch cả Adventure.
10. **Test**: combat (21), Adventure (22 + 13 cho UI / liên kết / mô phỏng), roster, quà tặng; `npm run check` xanh (1.265 test).
📁 File chính: `src/systems/combat/`, `src/systems/equipment/`, `src/areas/adventure/`, `content/adventure/` + `content/schemas/adventure/`, `tools/admin/adventure.ts`, `src/areas/farm/logic/roster.ts`, `src/areas/aquarium/logic/roster.ts`, `docs/decisions/018-adventure.md`; hook mới `roster` và `receiveGift` ở `core/area-registry`.
🧪 Đã kiểm tra: `npm run check` xanh (1.265 test); `npm run test:e2e` 9/9 (có `adventure.spec.ts`); `npm run dist:win` + verify:build + verify:installer (`release/SobiWorld-Setup-0.10.0.exe`); chạy thật trong trình duyệt (sandbox): sảnh, chọn đội, bản đồ, trận đánh (chọn mục tiêu, kỹ năng, Tự động, x2), thua trùm, tổng kết, nhận thưởng, kiệt sức; chuyến lưu giữa trận rồi tải lại chơi tiếp được.
⚠️ Quyết định tự đưa ra (decision 018): ×0,75 khi bị kháng nguyên tố; năng lượng phiêu lưu riêng của Adventure (không trừ năng lượng nuôi của heo); kiểu đánh theo họ; trùm hạ 420 → 340 máu; thua vẫn giữ KN và loot; máu mang theo giữa điểm dừng.
⚠️ Chưa làm: bot `sim:week` chưa có routine Adventure (GĐ11); Codex kẻ địch / trang bị; nhân vật đi trên bản đồ; art, animation, âm thanh (GĐ14, `docs/ASSET_TODO.md`); chưa chơi nhiều ngày.
👉 Bạn cần: chơi thử (cần Sobi World cấp 8 và Phát triển thế giới 20, hoặc sửa save): nhận heo của Hiệp Sĩ, đánh vài chuyến, xem các kiểu đánh có khác nhau rõ, thua có bị phạt nặng không, trận có dài không; rồi merge, tag `phase-10`, push.

### 2026-10-11 — Điều chỉnh roadmap: gameplay trước, art sau (decision 017)
✅ Đã làm: rà AGENT_RULES, ROADMAP, HUONG_DAN, ASSET_TODO, decisions; roadmap cũ trộn art/âm thanh vào GĐ13 → tách: GĐ13 Tích hợp và nghiệm thu gameplay (freeze), GĐ14 art/animation/VFX/âm thanh, GĐ15 phát hành; thêm bảng phụ thuộc và nghiệm thu; AGENT_RULES §8; ASSET_TODO đặt là backlog GĐ14; prompt GĐ13–15 trong HUONG_DAN; `CLAUDE.md`. Lịch sử GĐ1–GĐ9 và đặc tả gameplay không đổi.
✅ Nghiệm thu GĐ9 (gameplay): `npm run check` xanh, test Cloud (Healing Potion cứu heo nguy kịch, hoa tăng đột biến khi lai, ≥ 2 công dụng mỗi hoa), build chạy; art placeholder không chặn. Tag: kiểm tra trước khi gắn, `phase-07` và `phase-09` mới, không trùng, không force-push.
⚠️ Còn lại của GĐ9: art Cloud (ASSET_TODO, làm ở GĐ14), chủ dự án chơi thử số liệu Cloud.

### 2026-10-11 — GĐ9 hoàn thành: Sobi Cloud
✅ Đã làm (8 việc của prompt GĐ9; quyết định ở `docs/decisions/016-cloud.md`):
1. **Area `sobi_cloud`** từ `_template` (`src/areas/cloud`), phong cách pastel trên mây, hoa dùng `systems/plants`; mở bằng Cây cao chọc trời ở Sảnh (cấp 8 + Phát triển thế giới 15).
2. **Nước tinh khiết** từ Suối mây (3 cấp), **6 hoa**: thường, hiếm, đêm (hái lúc tối ×2).
3. **Potion** ở Vạc nấu: Healing Potion (chữa heo/cá kể cả nguy kịch, tâm trạng +20), Potion Vui Vẻ, Potion Chiến Đấu (cho GĐ10). Hành động `usePotion`, `useFishPotion`; nút trong bảng heo và hộp thoại cá.
4. **Hoa tăng đột biến** khi lai: `mutationBoost` trên item, `breedPigs`/`breedFish` nhận `boostItem`, hàng chọn hoa trong hộp thoại phối giống.
5. Mỗi hoa ≥ 2 công dụng (test); đơn hàng (10 dòng), 2 mục tiêu ngày, 5 thành tựu, Codex `flower`.
6. **NPC Bác Cú Giả Kim** (5 chủ đề).
7. **Admin**: Số liệu sửa hoa, cân bằng Cloud, vật phẩm (potion/hoa), recipe; tua thời gian dịch cả Cloud.
8. **Cân bằng**: `npm run sim:week -- 7 40` (bot có routine Cloud): xem decision 016 mục "Cân bằng".
📁 File chính: `src/areas/cloud/`, `content/cloud/` + `content/schemas/cloud/`, `tests/unit/cloud.test.ts`, `docs/decisions/016-cloud.md`; đổi ở core (events, goals, codex), Farm (`usePotion`, `breedPigs`), Aquarium (`useFishPotion`, `breedFish`), `ui/components/boostPicker.ts`, shell (`areaOverlays`, `start`, `Place` 'cloud').
🧪 Đã kiểm tra: `npm run check` xanh; chạy thật trong trình duyệt (sandbox): vào từ Sảnh, HUD, hái hoa, mở Vạc nấu, xây vạc, danh sách recipe.
⚠️ Quyết định tự đưa ra: điều kiện mở (giữ manifest có sẵn), con số hoa/suối/vạc, hoa đêm ×2 khi hái, mood potion dùng cơ chế mood boost có sẵn (theo giờ), Cloud không phải nguồn tiền chính.
⚠️ Chưa làm: Potion Chiến Đấu chưa dùng (GĐ10), thời tiết cầu vồng, art/âm thanh thật, chưa kiểm `dist:win`, chưa thử tay nhiều ngày; chưa test UI hộp thoại phối giống có chọn hoa bằng tay.
👉 Bạn cần: chơi thử Cloud (cấp 8 + dev 15, hoặc sửa save/Admin), xem Cloud mở ngày ~27 có muộn; nước có quá khan; Healing Potion có cứu được heo nguy kịch; hoa có làm lai thú vị hơn; rồi merge, tag `phase-09`, push.
### 2026-10-10 — GĐ8 hoàn thành: Sobi Aquarium
✅ Đã làm (9 việc của prompt GĐ8; quyết định ở `docs/decisions/015-aquarium.md`):
1. **Area `sobi_aquarium`** từ `_template` (`src/areas/aquarium`). Cá = `Creature` chung: `advanceCreature` (đói −5/giờ, lớn 6–24 giờ), `systems/health` (bệnh → nguy kịch 48 giờ → chết 72 giờ, ân hạn sau offline), `bond` (vuốt ve, món yêu thích từ Garden, 5 tim mở tính trạng ẩn), `quality`, `breeding` (tính trạng, phả hệ). Mở ở Sobi World cấp 6 (decision 007).
2. **Bể cá**: 4 cấp (5 / 8 / 12 / 16 cá), độ trong của nước (đục dần theo thời gian và số cá, **Thay nước** miễn phí), vảy rụng vào bể, nâng cấp bằng Sobi Coin + vảy + ngọc trai.
3. **Câu cá** ở bến: mini-game căn phao (cần nghỉ 2 phút, cá tuột chỉ nghỉ nửa), điểm càng cao càng dễ ra cá hiếm, **4 loài chỉ cắn lúc tối**, trai ngọc cho ngọc trai.
4. **12 loài** (3 Common, 4 Uncommon, 3 Rare, 2 Epic), mỗi loài ≥ 2 công dụng: bán / nuôi lớn bán giá cao / Codex / đơn hàng / vảy / lai (6 loài đẻ được) / phiêu lưu sau này.
5. **Thức ăn cá** từ khoai tây Garden qua `recipe_fish_feed` ở Máy xay; thiếu thì mua phần thiếu (20 Sobi Coin) trong cùng hành động.
6. **Vảy và ngọc trai** nâng bể (cấp 3–4) và **Vòi tưới của Garden** (cấp 2: 10 vảy; cấp 3: 20 vảy + 3 ngọc trai).
7. **Đơn hàng** (9 dòng có cá / vảy / ngọc trai / thức ăn cá), mục tiêu hằng ngày (câu cá, thay nước), 5 thành tựu, Codex loài cá (`discovery.fish`), NPC cô Gà Mơ Màng; sự kiện chuẩn mới `fish.caught`, `tank.cleaned`.
8. **Admin**: Số liệu sửa được cá (giờ lớn, giá, độ hay cắn, vảy, tên, mô tả) và cân bằng bể / nước / cần câu / đẻ trứng; tua thời gian dịch cả bể.
9. **Cân bằng 7 ngày có Aquarium**: `npm run sim:week -- 7 17` (bot đã có routine Aquarium: `scripts/economy/aquarium.ts`): xem decision 015 mục "Cân bằng".
✅ Thêm: cá đẻ trứng với tính trạng di truyền (GĐ7, "tính trạng cho cá"), cảnh Phaser (cá bơi, trứng, đống vảy, bến, đêm, nước đục), HUD + 6 hộp thoại, `app/areaOverlays.ts` (Garden và Aquarium chung một overlay), placeholder art 30 ảnh.
📁 File chính: `src/areas/aquarium/`, `content/aquarium/` + `content/schemas/aquarium/`, `tests/unit/aquarium.test.ts`, `aquariumUi.test.ts`, `docs/decisions/015-aquarium.md`; đổi nhỏ ở core (`events`, `goals/stats|settle|achievements|api`, `collection/codex`, `config/errors`), `vocab.ts`, Garden (`sprinkler.materials`), shell (`Place` 'aquarium', `areaOverlays`).
🧪 Đã kiểm tra: `npm run check` xanh (1.168 test: 48 mới cho Aquarium, mô phỏng giống nhau với mọi cỡ lát); chạy thật trong trình duyệt (`sandbox-aquarium`): vào từ cửa Biển ở Sảnh, màn "vắng mặt" có dòng cá, cá bơi / click mở hộp thoại, bến câu + mini-game, cá trong túi (thả vào bể, bán), hộp thoại bể, đêm; `npm run test:e2e`.
⚠️ Quyết định tự đưa ra (decision 015): điều kiện mở theo cấp Sobi World 6 (GAME_BALANCE §7 cũ nói Farm Lv6 + Garden Lv4); giá cá, giá bể, vật liệu; mini-game; cá chỉ đẻ cùng loài, không có vận may; cho ăn tự mua phần thiếu; lớp phủ Aquarium dùng chung overlay với Garden.
⚠️ Chưa làm: cá phiêu lưu (GĐ10), Healing Potion (GĐ9), lai khác loài, đổi tên cá trong UI, art / âm thanh thật (`docs/ASSET_TODO.md`), chưa thử tay nhiều ngày; chưa kiểm `dist:win` trên máy sạch.
👉 Bạn cần: chơi thử (mở Aquarium ở cấp 6, hoặc Admin tua thời gian / sửa save), câu vài lần xem mini-game có vui, xem cân bằng (giá cá hiếm, trai ngọc ~2%, tốc độ rụng vảy; bể lên đủ cấp sau ~10 ngày), rồi merge `main`, tag `phase-08`, push.

### 2026-10-10 — GĐ7 hoàn thành: lai giống nâng cao
✅ Đã làm (7 việc của prompt GĐ7; quyết định ở `docs/decisions/014-advanced-breeding.md`):
1. **`systems/breeding`** (thuần, có test): tính trạng (tối đa 3, mỗi tính trạng 50% từ mỗi bố/mẹ), tính trạng ẩn (Hiếm/Sử thi, lộ ở 5 tim: lúc đó mới hiện và mới có hiệu ứng; chưa lộ vẫn truyền),
   đột biến (2% + tính trạng bố mẹ + nguồn ngoài, trần 25%), tính trạng riêng của loài, vận may (+2 điểm % mỗi lần lỡ Rare+ khi cặp có thể ra, về 0 khi trúng, trần 30), phả hệ 3 đời, tin đồn.
   Nối vào Farm: con được định lúc bắt đầu mang thai (tính trạng, ẩn, phả hệ nằm trong `pregnancy.child*`) → sinh → nhận nuôi. 4 hiệu ứng thật: lớn nhanh, giá xuất chuồng (có dòng trong hộp thoại), Bond mỗi lần chăm, cộng đột biến.
2. **`content/breeding/`** (`traits.json` 11 tính trạng, `balance.json`, `rumors.json`) + **6 giống mới** (75 giống): Nấm, Đom Đóm, Mây, San Hô, Pha Lê, Cực Quang; hai nhánh khám phá nối ở Cực Quang; mỗi giống có tính trạng riêng, món yêu thích, giá riêng. Art placeholder.
3. **Phả hệ**: nút "Phả hệ" ở bảng heo, hộp thoại cây tổ tiên (bố mẹ → ông bà → cụ), giữ nguyên khi bán / mất bố mẹ.
4. **Nhà lai giống** (Bà Ngan Lai): mở từ Menu hoặc nút "Hỏi Nhà lai giống" trong hộp thoại phối giống; mỗi ngày 1 tin đồn gợi ý công thức chưa khám phá (nêu bậc hiếm và họ, không gọi tên loài) + 1 mẹo; cố định theo ngày.
5. **Codex**: ô chưa khám phá hiện "???" + bậc hiếm + gợi ý họ; ô đã khám phá có tooltip (họ, tính trạng riêng, món yêu thích).
6. **Admin**: tab "🧪 Mô phỏng lai" (N lần lai với seed, tính trạng cha mẹ, vận may, đột biến cộng thêm); "Số liệu" sửa được tính trạng, cân bằng lai, câu tin đồn; Admin species giữ `signatureTrait` / `favorite`.
7. **Test**: `breedingSystem` (tỉ lệ di truyền, đột biến, giới hạn 3, ẩn, pity, phả hệ, tin đồn), `breedingHeredity` (qua thai kỳ → sinh → nhận nuôi, pity trong Farm, hiệu ứng, 6 giống, save cũ), `heredityVm`, `breedingSim` (50.000 lần lai: tỉ lệ loài trong 1 điểm), Admin.
🧪 Đã kiểm tra: `npm run check` xanh (1.117 test); `npm run test:e2e`; Admin chạy thật (Mô phỏng 1.000 lần lai, nhập số liệu mới); dựng bảng heo, phả hệ, hộp thoại phối giống và bảng Nhà lai giống trong trình duyệt bằng `dev:sandbox` (không vào được Farm bằng tay vì trình duyệt chậm nên mô phỏng từng màn từ mã thật).
⚠️ Quyết định tự đưa ra: xem decision 014. Điểm đáng chú ý: tính trạng chỉ đến từ lai giống (heo mua / khởi đầu không có); tính trạng ẩn chỉ có hiệu ứng khi lộ; vận may tính theo cả trang trại (không theo cặp), trần 30 điểm %; rng của phần tính trạng sinh từ (mẹ, bố, thời điểm) để không đổi kết quả loài / giới tính cũ.
⚠️ Cân bằng cần chơi thử: tỉ lệ tính trạng quanh heo mới thấp (0,16 tính trạng / con khi bố mẹ chưa có gì); vận may +30 điểm % ở trần có thể quá mạnh với cặp ra Rare+ khó (Admin → Mô phỏng lai để xem, chỉnh ở Số liệu → "Lai giống nâng cao").
⚠️ Chưa làm: nguồn cộng đột biến (hoa Cloud, cầu vồng; đã có tham số), tính trạng cho cá (GĐ8), icon tính trạng, art thật 6 giống, ảnh riêng Nhà lai giống (`docs/ASSET_TODO.md`); chưa thử tay lâu dài; chưa kiểm `dist:win` trên máy sạch.
👉 Bạn cần: chơi thử (Admin → Luật phối giống → Mô phỏng lai trước), lai vài cặp xem tính trạng và phả hệ, xem tin đồn qua vài ngày (Admin tua thời gian), rồi merge `main`, tag `phase-07`, push.

### 2026-10-10 — GĐ5 hoàn thành: Sobi Garden và sản xuất
✅ Đã làm (10 việc của prompt GĐ5):
1. **Area Garden** từ `_template` (`src/areas/garden`, decision 012). `core` chỉ đổi 3 chỗ, đều nhỏ: registry thêm `unlockReady` (tự mở Area đủ điều kiện), danh mục item thêm `SEED`/`CROP`, 9 mã lỗi mới.
2. **`systems/plants`**: gieo, tưới (khô = lớn chậm một nửa), phân bón (−25% thời gian, +1 sản lượng), chín, héo (quá 48 giờ: ×0,5). Dạng đóng nên online / nền / offline cho cùng kết quả (test lát 1 phút = 10 phút = 1 giờ = nhảy một lần; 30 ngày bù trong < 3 giây).
3. **5 cây** theo GAME_BALANCE §5 (`content/garden/crops.json`): cỏ, lúa mì, bắp, khoai tây, cà rốt.
4. **Ô đất**: 6 ô, mở thêm 3 ô tới 24 ô (200 → 15.000); **Vòi tưới** (Lv1 6 ô, 500). Gieo / tưới / bón / thu hoạch làm cho nhiều ô một lần (nút "Gieo kín ô trống", "Tưới cả vườn", "Thu hoạch hết").
5. **`core/production`** + **Máy xay** và **Thùng ủ** với 3 recipe khởi điểm (thức ăn heo, thức ăn cao cấp, phân bón; `content/shared/recipes.json`), chạy theo giờ thật, làm tới 10 mẻ một lần.
6. **Heo ăn thức ăn cao cấp (+70 no) và cỏ (+14)**: nút mới trong bảng heo (chỉ hiện khi túi có), `feedPig` nhận `itemId`.
7. **Mở Garden ở Farm Lv3**: registry tự mở (kể cả save cũ đã đủ cấp), cổng Khu vườn ở Sảnh mở, toast "Sobi Garden đã mở cửa!".
8. **Tóm tắt vắng mặt có phần Garden**: cây đã chín / héo, mẻ xong, việc cần làm (hái, nhận, tưới) kèm nút "Vào vườn".
9. **Admin**: Số liệu có thêm cây, cân bằng Garden, recipe, vật phẩm (chỉ sửa số, kiểm schema); ⏩ Tua thời gian dịch cả đồng hồ Garden.
10. **Test**: vòng lặp phân → phân bón → cây → thức ăn → heo (online và offline), 24 test Garden, 16 test màn hình/VM, 19 test plants/production, e2e `garden.spec.ts` (mở vườn, gieo, tắt 5 giờ, màn vắng mặt, thu hoạch).
Giao diện: cảnh Phaser `GardenScene` (ruộng, vòi tưới, 2 công trình) + HUD / bảng hạt / hộp thoại DOM; Sảnh ↔ Garden đi qua cổng như Farm.
🧪 Đã kiểm tra: `npm run check` xanh (1.001 test); `npm run test:e2e` 7/7; `npm run sim:economy` OK; chạy thật bằng `npm run dev:sandbox` trong trình duyệt (vào vườn, gieo, tưới, xây Máy xay, làm mẻ, mở Kho); `npm run dist:win` + verify.
⚠️ Quyết định tự đưa ra (decision 012): giá xây Máy xay 400 / Thùng ủ 300; Vòi tưới cấp 2–3 (12 / 24 ô, 1.500 / 4.000); mở ô chỉ tính Sobi Coin (bản cập nhật Garden cần Ngọc trai / vật liệu cổ chưa có); thức ăn cao cấp +70 vì Farm giữ thang +50; thức ăn cao cấp 60 / phân bón 50 chưa bán ở cửa hàng; tưới tay có hiệu lực 3 giờ và chỉ tưới ô đang khô.
⚠️ Chưa làm (ngoài 10 việc): tâm trạng +10 / +3 của thức ăn cao cấp / cỏ (cần Bond, GĐ6); luân canh, đất Ẩm / Nước, cửa sổ khát, Life Essence, 7 cây còn lại của spec Garden chi tiết; cửa hàng hạt riêng; art thật (toàn placeholder, `ASSET_TODO.md`); âm thanh riêng; thử tay lâu dài.
⚠️ Cân bằng cần chơi thử: hạt bắp 5 → 3 bắp bán 4 (12): tự làm thức ăn rẻ hơn mua (25) rất nhiều; nếu quá dễ, chỉnh ở Admin → Số liệu.
👉 Bạn cần: chơi thử `npm run dev:sandbox` hoặc bản cài (Farm cấp 3 để mở vườn — tua Admin hoặc cho heo lớn), xuất chuồng / dọn phân → ủ phân bón → trồng → xay thức ăn → cho heo ăn; tua Admin 1 ngày xem cây chín và héo; xem Admin → Số liệu. Rồi merge `main`, tag `phase-05`, push.

### 2026-10-10 — GĐ4 hoàn thành: bản cài desktop Sobi World
✅ Đã làm:
1. Đổi tên: `productName` "Sobi World", `appId` `com.sobiworld.game`, `SobiWorld.exe`, `SobiWorld-Setup-0.5.0.exe`, shortcut Desktop + Start Menu "Sobi World"; gói npm `sobi-world` 0.4.0. Giữ Electron + NSIS (decision 011, bổ sung 005).
2. Save/settings ở `%APPDATA%\SobiWorld\` (đã có từ GĐ1); gỡ cài đặt không xóa save.
3. Kiểm bản người chơi tự động, nằm trong `npm run dist:win`: `verify:build` (dist + dist-electron: không Admin, không dấu vết dev, không file thừa, không URL ngoài) và `verify:installer` (mở `app.asar` thật, chạy `SobiWorld.exe` trên thư mục dữ liệu tạm: cửa sổ "Sobi World", ghi được save, không request mạng). Luật thuần ở `scripts/build/checks.ts` + `tests/scripts/buildChecks.test.ts` (7 test, trong `npm run check`).
4. Biến `SOBIWORLD_APPDATA` thay `%APPDATA%` cho kiểm thử (phát hiện khi chạy thử: đặt `APPDATA` không đủ, lần chạy đầu của tôi đã tạo `%APPDATA%\SobiWorld` thật; thư mục chỉ chứa một thế giới mới tinh do chính lần chạy đó tạo, không có dữ liệu của bạn, tôi đã xóa).
5. Tài liệu: `docs/BUILD.md`, `docs/TEST_MAY_SACH.md`, `electron/README.md`, `docs/ASSET_TODO.md` (icon).
6. Sửa test `assetsCheck` (vẽ lại toàn bộ placeholder, ~8 giây) vượt hạn 5 giây mặc định làm `npm run check` đỏ: nâng hạn 60 giây.
🧪 Đã kiểm tra: `npm run check` xanh (938 test); `npm run test:e2e` 6/6; `npm run dist:win` ra `release/SobiWorld-Setup-0.5.0.exe` (~145 MB) và qua `verify:build` + `verify:installer`; cài thử im lặng vào thư mục tạm: có `SobiWorld.exe`, shortcut "Sobi World" ở Desktop và Start Menu; gỡ im lặng: sạch exe + shortcut (shortcut "Sobi Farm" cũ của bạn không bị đụng).
⚠️ Quyết định / giới hạn:
- Chỉ Windows x64; macOS không làm (cần máy Mac + chữ ký Apple), mã không chặn việc thêm sau.
- Chưa ký số: SmartScreen hiện "Unknown publisher" (hướng dẫn trong TEST_MAY_SACH).
- Icon vẫn là mặt heo hồng vẽ bằng script (ASSET_TODO).
- `npm audit`: 9 cảnh báo (8 vừa, 1 cao), tất cả trong công cụ build (`electron-builder`…), không nằm trong game. Sửa cần `--force` nâng bản lớn, để dành.
- Chưa kiểm: máy sạch thật (không phải máy lập trình), tắt mạng thật khi cài, nâng cấp đè lên bản cài cũ.
👉 Bạn cần: chép `release\SobiWorld-Setup-0.5.0.exe` sang máy khác và làm theo `docs/TEST_MAY_SACH.md`; rồi merge `main`, tag `phase-04`, push.

### 2026-10-09 — Nâng cấp Sảnh: bố cục theo ảnh mẫu, Bi/So, thanh trên mới, hiệu ứng sống
✅ Đã làm:
- **Bố cục Sảnh** dựng lại theo `sobi_world_lobby.png` (`content/plaza/layout.json`): nền cỏ lát từ ô cỏ của sheet, đường đất, quảng trường đá cuội, bãi cát + biển (chặn đường), cổng Adventure, vườn Garden, bể Aquarium, cây đậu thần trong mây (Cloud), chuồng Farm (trại + heo), nhà chính, đài phun nước, ghế, đèn, thuyền, cây. Mỗi cổng có biển gỗ ghi tên (thay nhãn cũ). Nền vẽ một lần vào canvas (`GroundPainter`); sky phía trên, ngoài khung tiếp tục bằng màu phẳng.
- **Chọn nhân vật Bi (nam) / So (nữ)**: ô chọn trong Cài đặt, lưu ở `settings.json` (không đụng save thế giới); mỗi người có 12 khung riêng (`chr_so`, `chr_bi`), đổi là thấy ngay ở Sảnh/Adventure. `chr_player` được thay.
- **Thanh trên của Sảnh** (`plazaBar`): Sobi Coin + Ngọc lấy từ ví thật; nút Sảnh (đang ở đây, tắt), Bản đồ (chưa có màn → tắt, ghi "sắp ra mắt"), Menu (popup mới: Cửa hàng, Đơn hàng, Bộ sưu tập, Thành tích, Lịch sử, Cài đặt), Vật phẩm (Kho). Hover phóng nhẹ, nhấn thu nhỏ, tắt có style riêng. Khu vực (Farm…) giữ thanh cũ.
- **Hiệu ứng** (`PlazaAmbient` + `ambientConfig.ts`): mây mới trôi, sóng bọt + lấp lánh ở bờ biển, nước đài phun, cổng Adventure phát sáng + hạt tím (mạnh hơn khi lại gần), biển gỗ đung đưa và nảy khi lại gần, bướm bay quanh vườn (đổi hướng mềm, đập cánh), gà/heo/cừu/vịt/lạc đà có idle, đèn đường sáng dần về tối, ánh sáng ngày/chiều/tối theo giờ máy (dùng chung cấu hình day-night của Farm, `PlazaLight`), bóng mềm dưới chân, bụi khi đi trên đường đất, vật lớn mờ ~50% khi nhân vật đứng sau (`fade`, `FadeBehind`). Giảm chuyển động (cài đặt) tắt chuyển động nền.
- Walk cycle chạy theo quãng đường thực đi (không trượt chân khi cọ tường).
- Cắt art mới từ sheet bằng `scripts/cut-plaza.ts` (có tự đăng ký manifest).
🧪 `npm run check` xanh (931 test), `npm run test:e2e` 6/6; chạy dev trong trình duyệt: Sảnh hiển thị, đi bộ, đổi Bi/So, mở Menu → Cài đặt, không lỗi console.
⚠️ Quyết định / giới hạn:
- **Không có thanh Năng lượng** (48/100 của ảnh mẫu): game chưa có hệ thống năng lượng người chơi, không đặt số giả; thêm khi có hệ thống.
- Sheet chỉ có 2 khung/hướng (đứng + bước); khung bước thứ hai là bản lật (lên/xuống). Tên nam trên sheet là "Kai", game gọi là Bi.
- Ô cỏ của sheet có tông hơi khác nhau: đã chỉnh về cùng màu trung bình và pha nhẹ với màu nền.
- Chưa kiểm tay: hiệu ứng buổi tối (cần đổi giờ máy), nhấn chuột phải cổng khóa, Electron `dist:win`.
- Không thêm tiếng click riêng cho nút mới (dùng `ui_click` chung của mọi nút DOM).
👉 Bạn cần: chơi thử Sảnh (đi quanh, lại gần từng biển/cổng), đổi giờ máy sang chiều/tối xem ánh sáng, chọn Bi trong Cài đặt.

### 2026-10-09 — GĐ3 cập nhật theo yêu cầu: nhân vật chỉ đi ở Sảnh/Adventure, Sảnh đẹp hơn
✅ Đã làm:
- **Nhân vật chỉ di chuyển ở Sảnh và Sobi Adventure.** Farm (và Garden, Aquarium, Cloud sau này) chơi bằng click; đã gỡ nhân vật, gợi ý phím và đi bộ khỏi Farm. Về Sảnh bằng nút "Ra Sảnh" ở HUD (không thêm art vào Farm). Manifest Area có `movement: click | character` (Adventure = `character`).
- **Địa hình Sảnh:** nhà, cây, đá, bụi, hàng rào, ghế, đèn, đài phun nước, rương, rơm đều chắn đường (chắn phần chân, chỉnh `footprint` từng vật); biển chắn đường; đường đất, quảng trường lát đá, bãi cát. Test: chân mọi vật `solid` và nước không đứng được, vẫn tới được mọi cổng, ≥ 45% mặt bằng đi được.
- **Art từ ảnh tham khảo** `asset/reference/sobi_world` (script `scripts/cut-plaza.ts`): nhân vật Sobi 12 khung, 4 cổng Area, đài phun nước, ghế, đèn, thuyền, cây, rương, rơm, biển gỗ; bố cục Sảnh theo ảnh `sobi_world_lobby.png`. Art Sobi Farm không đụng.
- **Giao diện:** gợi ý phím thành "biển gỗ" nhỏ có mũi chỉ, phím bấm như phím bàn phím; nút "Ra Sảnh" ở HUD; màn đổi phím có phím dạng nút bấm, báo lỗi rõ; hợp màn hẹp và `prefers-reduced-motion`.
🧪 `npm run check` xanh, e2e 6/6 (đã sửa theo luồng mới).
⚠️ Lưu ý: ảnh tham khảo là ảnh mô phỏng nên art cắt ra là bản tạm; thư mục `asset/` bạn đang sắp xếp lại (chưa commit) không bị đụng. Admin sửa được vật, cổng, vùng đi, điểm xuất hiện của Sảnh; đường/biển (`ground`) sửa trong `content/plaza/layout.json`.

### 2026-10-09 — GĐ3 hoàn thành: nhân vật và Sảnh Sobi
✅ Đã làm:
1. (đã đổi, xem mục cập nhật phía trên: nhân vật chỉ ở Sảnh/Adventure) `systems/character` (thuần, có test): đi 8 hướng (chéo không nhanh hơn), hộp chân va chạm, trượt dọc tường, không xuyên vật mỏng khi frame chậm, `settle` đẩy ra khỏi vật cản, tầm với để tương tác. Số liệu `content/shared/character.json`.
2. Tương tác: gần vật → gợi ý phím (`[E] Vào Sobi Farm`), bấm E dùng vật gần nhất. Bấm chuột vào vật = nhân vật đi tới rồi dùng.
3. `core/settings` + màn **Phím điều khiển** trong Cài đặt: WASD/mũi tên, E, I, C, Esc; 2 phím mỗi hành động, kiểm tra trùng và phím hệ thống, bấm ô rồi nhấn phím; lưu `settings.json` riêng (desktop: ghi tạm rồi đổi tên; web: localStorage); file hỏng → mặc định; lỗi ghi hiện ra.
4. Sảnh Sobi (`src/areas/plaza`, `content/plaza/layout.json`): 5 cổng (Chuồng heo, Khu vườn, Biển, Cây cao, Cổng dịch chuyển). Chuồng heo mở; 4 cổng còn lại khóa, đứng gần hiện "Sắp ra mắt" + điều kiện mở (Farm Lv3…), ổ khóa trên cổng, bấm E phát tiếng lỗi. Area chưa làm khai báo bằng `planned: true`.
5. Chuyển cảnh Sảnh ↔ Farm (`app/areaFlow.ts`): gọi `onExit/onEnter` của Area; Farm ngủ/thức theo scene, số liệu vẫn chạy cùng công thức. Farm có biển "Ra Sảnh".
6. Farm: mọi thao tác qua nhân vật (máng, giếng, cửa hàng, kho, bảng đơn, sưu tập, heo, hộp quà); thao tác hàng loạt vẫn bằng chuột qua UI. Phím I/C/Esc mở Kho/Sưu tập/Cài đặt.
7. Mở game luôn ở Sảnh; save v9 giữ `player` (vị trí, hướng), migration v8→v9. Thoát trong Area → mở lại trước cửa Area đó.
8. Art placeholder đã đăng ký manifest (nhân vật 12 khung, 4 cổng, biển chỉ đường, ổ khóa); danh sách ở `docs/ASSET_TODO.md`.
9. Admin: Bố cục có chọn **Nông trại / Sảnh Sobi**; Sảnh sửa được vật, cổng (id Area, chặn đường), vùng đi, điểm xuất hiện, tầm với; luật: mỗi Area đúng 1 cổng đang hiện; Farm cần đúng 1 lối ra.
10. Test: ~25 test mới (phím, settings, nhân vật, cổng/điều kiện, vị trí xuất hiện, save v9, flow, **đi lại giữa các nơi không đổi số liệu**, layout đi được tới mọi cổng/vật), e2e Sảnh→Farm→Sảnh + đổi phím + nhớ vị trí; e2e cũ sửa theo luồng mới.
🧪 Đã kiểm tra: `npm run check` xanh; `npm run test:e2e`; chạy bản build bằng Playwright-Electron (đi, vào Farm, gợi ý phím, chụp màn hình). Chưa kiểm: chơi tay lâu dài, `dist:win` (GĐ4).
⚠️ Quyết định tự đưa ra (decision 010): Sảnh không là AreaModule; một canvas nhiều scene; phím theo `KeyboardEvent.code`; cổng Area `planned` không bao giờ mở dù đủ điều kiện; HUD Sảnh = HUD Farm ẩn máng/đàn heo/cảnh báo; tutorial chỉ trong Farm; mở game ở Sảnh dù lần trước thoát trong Farm.
⚠️ Còn mở: art thật (ASSET_TODO); chuyển cảnh chưa có hiệu ứng mờ dần; `unlockedAreas` chưa tự mở theo cấp (GĐ5); Bảng đơn hàng/Chợ/NPC ở Sảnh thuộc GĐ6.
👉 Bạn cần: chơi thử đi lại ở Sảnh và Farm, đổi phím trong Cài đặt, xem Admin → Bố cục → Sảnh Sobi.

### 2026-10-09 — GĐ2 hoàn thành việc 5–11 (chờ duyệt để merge `main` + tag `phase-02`)
✅ Đã làm:
5. **Xuất chuồng** thay "Bán" (UI, lịch sử giao dịch; id nội bộ `sellPig`/`PIG_SOLD`/`PIG_SELL` giữ nguyên): từ giai đoạn Adult (≥ 50% lớn). Giá = giá gốc giống × Quality (tâm trạng
   trung bình suốt đời: ×1 / 1,2 / 1,5 / 2 / 3) × cân nặng (/ chuẩn của giống) × sức khỏe (−10%/ngày bệnh, tối đa −30%, khỏi là hồi đủ) × chợ (0,9 / 1,0 / 1,2 theo ngày). Hộp thoại
   xuất chuồng liệt kê từng hệ số. Decision 009.
6. **Dọn phân**: nút "Dọn phân" ở Giếng nước; mỗi đống thành 1 `item_manure` trong túi đồ chung (túi đầy thì bỏ phần dư), 2 KN/đống; bán được (6 Sobi Coin/cái) ở màn Túi đồ.
7. **Máng có cấp** 30 / 80 / 200 phần (giá nâng 0 / 1.200 / 4.000 Sobi Coin), nâng trong hộp thoại máng; sức chứa không còn theo cấp người chơi. Save cũ: cấp suy ra từ sức chứa.
8. **Màn hình "Trong lúc bạn vắng mặt"** dựng từ `getSummary(events, world, now)` của Area: số liệu đã xảy ra (sinh, lớn, bệnh, nguy kịch, mất, đơn, quà) + việc cần làm ngay
   (heo nguy kịch / bệnh, phân chưa dọn) kèm nút đi tới chỗ cần xử lý (heo, giếng, máng).
9. **Cảnh báo**: nút ⚠ ở thanh trên ("N heo bệnh" / "N heo nguy kịch!", đỏ nhấp nháy) mở heo cần chăm; thẻ heo ghi "Nguy kịch"; bảng heo ghi thời gian còn lại trước khi nguy kịch / mất heo.
10. **Admin**: ⏩ Tua thời gian (+1 giờ / +1 ngày / +7 ngày: lùi mọi mốc thời gian của save, lần mở game kế tiếp bù đúng khoảng đó); trang **Số liệu** sửa mọi con số của
    thời gian, sức khỏe, giá trị, chất lượng, túi đồ và cân bằng Nông trại (chỉ số; server kiểm bằng schema của game trước khi ghi).
11. **Test**: tổng ~855 unit/script test + 4 e2e. Mới: nhất quán 1 phút vs 10 phút; bù 30 ngày (nhẹ: ~0,2 giây; nặng 24 heo bỏ bê: dưới 3 giây); bệnh → nguy kịch → chết đúng mốc;
    bảo vệ 72 giờ; chống lùi giờ; ân hạn 12 giờ; Xuất chuồng (từng hệ số giá); phân và máng; màn vắng nhà; cảnh báo; tua thời gian của Admin; e2e "bỏ nông trại 3 ngày".
🧪 Đã kiểm tra: `npm run check` xanh; `npm run test:e2e` 4/4 (build web + Electron); Admin chạy thật (`/numbers` nhận số đúng, từ chối dữ liệu sai / sửa chữ / file lạ);
   `npm run sim:economy` OK. Chưa kiểm: `npm run dist:win` (GĐ4), chơi bằng tay lâu dài.
⚠️ Quyết định tự đưa ra:
- Hệ số rarity của spec (1/1,5/2,5/4/7) **không nhân thêm** vì giá gốc từng bậc (`sellGold`) đã mang bậc hiếm (decision 009); Quality ×3 làm heo chăm tốt có giá cao hơn Sobi Farm nhiều
  (PINK 48 giờ: lãi 525 / 765 / 2.925 Sobi Coin cho Thường / Tốt / Hoàn hảo): tiến trình mở chuồng nhanh hơn; cân lại khi có Garden (thức ăn tự làm).
- Máng cấp 3 giá 4.000 chưa kèm vật liệu Adventure (spec ghi "4.000 + vật liệu"): chờ GĐ có Adventure.
- Trần Quality không đặt cho máng tự động (luật "tự động tối đa Good" của Lore) — chưa có cơ chế phân biệt chăm tay / máng: để GĐ6+ khi thêm Bond và vuốt ve.
- Bond, vuốt ve, thức ăn cao cấp / cỏ / món yêu thích (GAME_BALANCE §2.3) chưa làm: không thuộc 11 việc của GĐ2.
- Đơn hàng vẫn đo "vui vẻ" cũ (đói + sạch); chỉ giá không còn dùng nó.
⚠️ Còn mở: xem "Vấn đề còn mở" bên dưới.
👉 Bạn cần: chơi thử (tua bằng Admin 1 ngày và 4 ngày sau 72 giờ bảo vệ), duyệt để merge `main` + tag `phase-02`.

### 2026-10-09 — GĐ2 việc 1–4 xong, **dừng chờ duyệt** trước việc 5–11
✅ Đã làm:
1. `core/clock`: 4 buổi (`content/shared/time.json`), `awayWindow` (trần 30 ngày, giờ máy lùi). Store: `snapshot.clockRewound`, `CatchupInfo.capped`.
2. `core/simulation`: lát ≤ 1 phút (online) / 10 phút (offline) trên lưới giờ địa phương; `registry.advance` dùng nó; hook mới `AreaModule.rebase`. Xem decision 008.
3. Farm.simulate theo thang GĐ2: đói −8/giờ, sạch −4/giờ (−1/giờ mỗi đống phân, tối đa 4), năng lượng −5/giờ thức / +12/giờ ngủ (ngủ ở buổi Đêm), lớn
   48 giờ × hệ số rarity (1 / 1,25 / 1,5 / 2 / 2,5) với 4 giai đoạn Baby <12,5% · Young <50% · Adult <100% · Mature = 100%, chỉ lớn khi đói > 30 và không bệnh,
   cân nặng theo giai đoạn, phân 1 đống / 8 giờ / heo từ Young (tối đa 12 đống), máng tự ăn khi đói < 40. Trường mới (tùy chọn, không cần migration): `energy`,
   `poopProgress`, `illRisk` trên heo; `manure`, `graceUntil`, `memorials` trên Farm.
4. `systems/health`: bệnh theo giờ (`content/shared/health.json`: đói 0 +15%, sạch < 20 +10%, tâm trạng < 20 +5%), nguy kịch sau 48 giờ bệnh, chết sau 72 giờ,
   không chết khi bù offline + ân hạn 12 giờ, thuốc chữa ngay + miễn bệnh 6 giờ, 72 giờ đầu của save mới không bệnh; sự kiện `PIG_BECAME_CRITICAL`, `PIG_DIED`
   (→ `creature.critical`, `creature.died`), toast + tóm tắt vắng nhà; heo chết để lại dòng kỷ niệm (`memorials`).
🧪 Đã kiểm tra: `npm run check` xanh (67 file, ~820 test); `npm run test:e2e` 3/3; `npm run sim:economy` OK. Test mới: `clock`, `simulation` (lát, nhất quán 1 phút vs 10 phút
   trong 1 ngày, bù 30 ngày < 3 giây, trần 30 ngày, lùi giờ, đi bộ bỏ mặc: bảo vệ 72 giờ → bệnh → nguy kịch +48 giờ → chết +72 giờ, bù offline 12 ngày), `mortality`
   (nguy kịch, chết, ân hạn, thuốc kịp thời, phân, ngủ), rủi ro bệnh (`systems.test`).
⚠️ Quyết định tự đưa ra (ghi để duyệt):
- Chia lát thay vì sửa thành "bước cố định": giữ công thức giải tích sẵn có; bệnh đổi sang ngân sách rủi ro tích lũy để hai chế độ ra cùng kết quả (decision 008).
- Giữ giá thức ăn 25 / +50 đói, thuốc 100 và hệ số giá rarity cũ; `sim:economy` vẫn qua (PINK: 7 phần ăn = 175 Sobi Coin / 48 giờ, lãi 165–765). Tính lại cùng công thức giá ở việc 5.
- Cân nặng = tỉ lệ × `maxWeight` của hạng (2% / 5% / 60% / 100% tại 0 / 12,5 / 50 / 100%), chưa dùng cho giá (việc 5).
- Mood cho rủi ro bệnh = trung bình (đói, sạch, năng lượng); "hạnh phúc" dùng cho giá/đơn hàng chưa đổi (đổi cùng công thức giá ở việc 5).
- Việc bán/đơn hàng vẫn yêu cầu Mature (100%) như cũ; việc 5 chuyển sang Adult (≥ 50%) khi đổi thành "Xuất chuồng".
- Nhãn giai đoạn: Adult = "Heo lớn", Mature = "Trưởng thành".
⚠️ Hệ quả cần biết:
- Heo trong save Sobi Farm cũ giữ nguyên `growthProgress`; vì thang mới dài hơn 24 lần nên heo đang ở 50% lúc đó sẽ thành "Adult" (bằng 24 giờ lớn). Không mất heo/tiền.
- Máng và nhu cầu đã chậm lại nhiều (đói đầy → 0 sau 12,5 giờ thay vì 2 giờ).
- Bù offline dài sinh sự kiện theo từng lát (mỗi đơn hàng/quà/lần bệnh một sự kiện); màn hình "vắng nhà" (việc 8) sẽ gom lại cho gọn.
👉 Bạn cần duyệt: thang số trên, cách xử lý chết/ân hạn, và có làm tiếp việc 5–11 không.

### 2026-10-09 — GĐ2 kế hoạch (trước khi code)
**Hiện trạng đã đọc:** mô phỏng Farm là *giải tích* (`advanceWorld` → `advancePig` → `systems/creature/advance`): một lời gọi
đúng cho 1 giây hay 30 ngày; máng tự ăn tính đóng (`trough.ts`); bệnh = hazard không nhớ (5%/10 phút khi sạch < 30, ×2 khi đói 0, 1 lần/ngày),
không có chết; store tick mỗi 1 giây và gọi `catchup` khi mở/hiện lại; không có trần 30 ngày, không chống lùi giờ.
**Giữ:** công thức giải tích trong lát cắt, `Clock` inject, `rng` inject, store/persist, các sự kiện `PIG_*`.
**Thêm theo bước:**
1. `core/clock`: 4 buổi (`content/shared/time.json`: Sáng 05–10, Ngày 10–17, Chiều 17–20, Đêm 20–05), `awayWindow` (trần 30 ngày, phát hiện lùi giờ).
   Store dùng nó: lùi giờ → không mô phỏng ngược, báo `clockRewound` trong snapshot; trần 30 ngày → mô phỏng 30 ngày đầu rồi `rebase` mốc Area về `now`.
2. `core/simulation`: chia khoảng thời gian thành lát ≤ bước (online 60 giây, offline 10 phút), lát **canh theo lưới giờ địa phương** để mốc buổi
   (05/10/17/20 giờ) luôn trùng ranh giới lát; gọi `simulate` của từng Area theo lát. `registry.advance` dùng nó. Hook mới của Area: `rebase`.
3. `Farm.simulate`: đói −8/giờ, sạch −4/giờ (+ −1/giờ mỗi đống phân, tối đa −4), năng lượng −5/giờ thức, +12/giờ ngủ (ngủ ban đêm),
   lớn theo 4 giai đoạn (Baby/Young/Adult/Mature, hệ số rarity 1/1,25/1,5/2/2,5, chỉ lớn khi đói > 30 và không bệnh), cân nặng, phân 1 đống/8 giờ (Young+),
   máng tự ăn khi đói < 40. Save: farm slice v1 → v2 (thêm `energy`, `poopAcc`, `manure`).
4. `systems/health`: nguy cơ bệnh theo giờ (đói 0 +15%, sạch < 20 +10%, tâm trạng < 20 +5%) dưới dạng **ngân sách rủi ro tích lũy** (bệnh khi
   tích lũy ≥ ngưỡng lấy từ rng seed theo id + số lần bệnh) để kết quả không phụ thuộc cỡ lát; nguy kịch 48 giờ, chết 72 giờ, không chết trong bù offline
   và ân hạn 12 giờ sau khi mở game, thuốc chữa ngay + miễn bệnh 6 giờ, 72 giờ đầu của save mới không bệnh.
**Quyết định tạm (hỏi lại nếu bạn muốn khác):** giữ giá thức ăn 25 / +50 đói và hệ số giá rarity cũ ở bước 1–4 (đổi cùng công thức giá ở việc 5, bằng `sim:economy`).
**Điểm dừng:** sau 1–4 báo cáo, chờ duyệt rồi mới làm 5–11.

### 2026-10-09 — GĐ1: khôi phục, đối chiếu spec mới, hoàn tất bước 7–9
✅ Đã làm:
- Đối chiếu kế hoạch với code: bước 1–6 đã xong ở các commit trước (guard, `areas/farm`, save v8 + backup + thư mục SobiWorld,
  content JSON + zod, core economy/inventory/items/events/progression, systems, area-registry + `_template`, Admin ghi JSON).
- Tên tiền hiển thị: **Sobi Coin** (spec V2 §6), thay "Coins" trong `vi.ts` và 3 test.
- Item có `category` + `rarity` (spec V2 §6) trong schema và `items.json`.
- Test quét chuỗi: `tests/unit/noHardcodedText.test.ts` (không có chuỗi tiếng Việt ngoài `src/i18n`, trừ 4 file chỉ Admin thấy).
- Decision 005 (đóng gói Electron), 006 (content JSON + id); README cho `content/`, `src/core`, `src/systems`, `src/areas/farm`, `src/app`.
🧪 Đã kiểm tra: `npm run check` xanh (64 file, 751 test); `npm run test:e2e` (build web + electron + 3 e2e) pass;
Admin chạy thật: `GET /__admin/files` 200, `POST /__admin/products` với dữ liệu không đổi → 200 và không có diff, dữ liệu sai → 400.
Chưa kiểm: `npm run dist:win` (installer), chạy Electron thủ công, thử luồng chơi bằng tay.

⚠️ Spec mới (c35d8c8: lore, Garden, Aquarium, Cloud, Adventure, animation) — ảnh hưởng ở mức kiến trúc:
- Dữ liệu tiến trình `progression.areas.<id>.xp` đáp ứng cả hai cách: V2 ghi Level riêng từng Area + World Development,
  còn Cloud/Lore ghi một Sobi World Level chung (World EXP). **Chủ dự án cần chốt ở GĐ6**; GĐ1 không cần đổi code.
- Túi đồ 40 ô, stack 99 đã đúng (`content/shared/inventory.json`); Cloud §XVIII (50–150 ô) mâu thuẫn, Lore §5 đã bảo xóa.
- Essence, hạt giống, nguyên liệu sẽ là item trong `items.json` khi tới GĐ5+ (cần thêm giá trị vào `ITEM_CATEGORY_VALUES`).
- Rarity 6 bậc có Mythic (V2); code hiện 5 bậc, Mythic dành riêng, thêm khi có species cần.
- Garden/Aquarium/Cloud/Adventure: không làm gameplay ở GĐ1. Area mới đi theo `src/areas/_template`.

⚠️ Chưa làm, có chủ ý:
- Bù offline tối đa 30 ngày + chống lùi giờ (ARCHITECTURE §9): Farm mô phỏng giải tích theo thời gian thực, đổi sẽ đụng
  gameplay; làm cùng `simulate()` chuẩn ở GĐ2.
- Tách `src/i18n/vi.ts` thành nhiều file theo namespace (kế hoạch bước 7): bảng chuỗi đã tập trung một chỗ, tách chưa có lợi ích.
- Tên trong content vẫn là `nameVi`/`descVi`, chưa là `name: { vi }`: đổi khi thêm ngôn ngữ thứ hai.

### 2026-10-05 — GĐ1 Bước 1: kiểm tra code Sobi Farm
✅ Đã làm: đọc toàn bộ code (core, store, game, ui, platform, electron, admin, guard), viết `docs/AUDIT_AND_PLAN.md`
(bản đồ code → core/systems/areas/content/admin, chỗ hard-code, so số với GAME_BALANCE, save v8 + migration,
đóng gói, kế hoạch 9 bước, rủi ro, 10 câu hỏi). Chưa sửa code.
⚠️ Phát hiện: GAME_BALANCE §6 (thức ăn 6 Coins) mâu thuẫn thang tiền Sobi Farm (thức ăn 25) — câu hỏi 5.

### 2026-10-04 — Tạo repo Sobi World
✅ Đã làm:
- Tạo repo `Sobi_World`, nhập toàn bộ lịch sử Sobi Farm (nhánh `start/unimo-v2` → `main`, giữ 54 tag), tag `sobi-farm-final`.
- Tài liệu Sobi World vào `docs/`; tài liệu Sobi Farm vào `docs/archive/sobi-farm/`; `CLAUDE.md`, `README.md` mới.
- Ghi 4 quyết định: `001` cấu trúc repo, `002` sinh vật có thể chết, `003` thang thời gian/bộ số, `004` lưới an toàn offline.
- Cập nhật SPEC (§2 bệnh/chết), ARCHITECTURE (§2 cấu trúc, §9 chuyển save cũ), GAME_BALANCE (thời gian, lớn, bệnh, giá),
  ROADMAP (ghi chú GĐ4), HUONG_DAN (mục A xong, prompt GĐ1), AGENT_RULES (nhánh, cổng chất lượng, ưu tiên decisions).
- Thêm `.gitattributes` ép LF (checkout CRLF làm hỏng test round-trip của admin config).

🧪 Đã kiểm tra: `npm ci` + `npm run check` xanh — 57 file test, 667 test.

## Chênh lệch số so với Sobi Farm (cần xử lý ở GĐ2)
- Đói 2 giờ → 12 giờ; sạch 5 giờ → 24 giờ; thời gian lớn theo rarity mới (decision 003).
- D21 "không chết" → chết sau 72 giờ bệnh, có ân hạn 12 giờ sau bù offline (decision 002, 004).
- Giá chuồng/máng trong GAME_BALANCE §2.6 viết theo thang 360 Coins; quy đổi sang thang tiền Sobi Farm (heo 500).

## Vấn đề còn mở
- (Đã xử lý ở GĐ1) skill `spec-to-source` đã xóa, guard nằm ở `scripts/guard/`; thư mục save đã chuyển sang `%APPDATA%\SobiWorld` kèm sao chép save cũ.
- `npm ci` báo vài cảnh báo `npm audit` (thư viện dev) — chưa xử lý.

### 2026-10-10 — GĐ6 hoàn tất (số cân bằng đã được chủ dự án duyệt; v0.6.0, `release/SobiWorld-Setup-0.6.0.exe` qua verify:build + verify:installer; chờ chơi thử nhiều ngày, rồi merge `main`, tag `phase-06`)
(ghi chú tiến độ trước đó:)
### GĐ6 đang làm (nhánh `phase-06-engagement`, chưa xong, chưa duyệt số)
✅ Đã làm: World Level chung (decision 007/013, bảng 100·n^1,5, 20 cấp); Bond (vuốt ve, món yêu thích, tim nâng Quality, tâm trạng món ăn vặt); mục đích nuôi (Xuất chuồng/Giống/Thú cưng); `core/goals` (Bảng đơn Sảnh, mục tiêu ngày, thành tựu trả Ngọc, quà đăng nhập), Codex + mốc thưởng, save world v10 (migration từ v9), bước `settle` trong store; Chợ theo ngày; trang trí đặt/cất/dời; chip "việc tiếp theo" + NPC Farm/Garden; trạm Bảng đơn ở Sảnh; Admin Số liệu mở rộng; script `npm run sim:week`.
✅ Đã bổ sung (phiên 2): tutorial thêm 2 bước (vuốt ve/Bond; Bảng đơn + chip Việc tiếp theo, tổng 7 bước), decision 013 ghi bước 8, README cho core/goals, core/collection, systems/bond, plaza; sửa e2e theo save v10 và click cổng Garden tự vào.
⚠️ Còn lại: **chủ dự án duyệt số cân bằng** (`npm run sim:week`: Garden mở ~ngày 4,5, cấp 5 ở ngày 7; cấp chậm hơn Sobi Farm cũ) — điểm dừng của prompt GĐ6; sau đó mới tăng version và build bản desktop (`npm run dist:win`). Chưa chơi tay các màn mới ngoài thử nhanh trong trình duyệt; vị trí trang trí thay thế chưa nhìn.
