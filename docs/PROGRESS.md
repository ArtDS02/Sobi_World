# PROGRESS — Sobi World

## Trạng thái hiện tại
**Giai đoạn:** GĐ7 — Lai giống nâng cao: xong, chờ chủ dự án chơi thử và duyệt số (`content/breeding/`); bản cài 0.7.0.
**Nhánh:** `phase-07-breeding` (tách từ `main` sau khi GĐ6 đã merge, tag `phase-06`).
**Quy ước (chủ dự án, 2026-10-10):** chủ dự án tự merge, gắn tag `phase-XX` và push sau mỗi giai đoạn; agent chỉ commit trên nhánh giai đoạn.
**Bước tiếp theo:** chơi thử lai giống (Admin → Luật phối giống → Mô phỏng lai để xem tỉ lệ); rồi GĐ8 — Sobi Aquarium.

## Nhật ký

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
