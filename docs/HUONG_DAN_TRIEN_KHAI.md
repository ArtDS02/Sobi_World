# HƯỚNG DẪN CHI TIẾT TRIỂN KHAI SOBI WORLD

## A. Chuẩn bị (làm 1 lần) — ✅ ĐÃ XONG 2026-10-04

> Repo `Sobi_World` đã nhập lịch sử Sobi Farm (tag `sobi-farm-final`); tài liệu ở `docs/`, tài liệu cũ ở
> `docs/archive/sobi-farm/`, quyết định đã chốt ở `docs/decisions/`. Bản gốc Sobi Farm giữ ở `D:\Local\Sobi_Farm`.

1. Tạo thư mục `Sobi_World/docs/`.
2. Chép vào `docs/` 6 file: `SOBI_WORLD_PROJECT_SPEC_V2.md`, `ARCHITECTURE.md`, `GAME_BALANCE.md`, `ROADMAP.md`, `AGENT_RULES.md`, `HUONG_DAN_TRIEN_KHAI.md`.
3. Chuyển spec cũ vào `docs/archive/SOBI_WORLD_PROJECT_SPEC.md` (chỉ để tham khảo).
4. Sao lưu riêng toàn bộ thư mục `Sobi Farrm` và một file save đang chơi ra ngoài dự án (ví dụ USB hoặc thư mục khác).

## B. Cách dùng

- **Gameplay trước, art sau (decision 017):** từ nay mọi giai đoạn gameplay (GĐ10–GĐ13) dùng placeholder cho art, animation, VFX, âm thanh và ghi nhu cầu vào `docs/ASSET_TODO.md`; art làm ở GĐ14. Không quay lại phase đã nghiệm thu chỉ để thêm art.
- **Mỗi giai đoạn mở một phiên agent mới.** Copy nguyên khối prompt của giai đoạn đó.
- Agent sẽ dừng ở **điểm dừng** để bạn duyệt. Đọc báo cáo, trả lời "Đồng ý, tiếp tục" hoặc yêu cầu sửa.
- Xong giai đoạn: làm danh sách **"Bạn kiểm tra"** bên dưới mỗi prompt. Đạt thì mới sang giai đoạn sau.
- Agent bị ngắt giữa chừng hoặc hết phiên: dùng **Prompt tiếp tục** ở mục D.

---

## C. Prompt từng giai đoạn

### GĐ1 — Nền móng thế giới

```
Bạn là kiến trúc sư phần mềm kiêm lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC (theo thứ tự): docs/AGENT_RULES.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md, docs/ARCHITECTURE.md, docs/GAME_BALANCE.md, docs/ROADMAP.md (mục GĐ1). Tuân thủ tuyệt đối AGENT_RULES.

BỐI CẢNH: Repo này chứa code game nuôi heo Sobi Farm đã hoàn thiện (src/, electron/, tools/admin/). Đây là giai đoạn 1: biến nó thành Area đầu tiên của Sobi World. Đọc thêm docs/decisions/ (các quyết định đã chốt).

BƯỚC 1 — KIỂM TRA (chưa sửa code):
- Làm trên nhánh git phase-01-world-foundation.
- Đọc toàn bộ code Sobi Farm: tech stack, cách chạy, cấu trúc, model heo, AI, lai giống, túi đồ, tiền, shop, save, asset, layout, admin, cách đóng gói.
- Tạo docs/AUDIT_AND_PLAN.md gồm:
  a) Bảng: mỗi phần code hiện có → đi vào core / systems / areas/farm / content / admin.
  b) Chỗ đang hard-code nội dung, số liệu, chữ hiển thị, hoặc gắn chặt với "heo".
  c) Con số hiện có so với GAME_BALANCE.md (giữ số hiện có nếu đang chơi ổn).
  d) Cấu trúc save mới và cách migrate save cũ.
  e) Tech stack có đóng gói desktop offline được không, đề xuất công cụ đóng gói.
  f) Kế hoạch các bước nhỏ, mỗi bước kết thúc game vẫn chạy.
  g) Rủi ro và câu hỏi cho chủ dự án.
- ĐIỂM DỪNG: báo cáo tóm tắt và chờ tôi duyệt.

BƯỚC 2 — THỰC HIỆN (sau khi tôi duyệt), theo đúng kế hoạch:
1. Dựng cấu trúc thư mục. Chuyển code vào src/areas/farm và các lớp tương ứng, chưa đổi logic. Game chạy như cũ.
2. core/save (schemaVersion, migration, ghi an toàn, 5 backup, validation) + migrate save cũ.
3. core/content + content/schemas; chuyển dữ liệu heo, item, shop, giá vào content/.
4. core/inventory, items, economy, events, progression (khung), assets (registry).
5. systems/creature (model chung, heo là species), quality, valuation, behavior-ai, layout; khung systems/health.
6. core/area-registry + manifest Farm + src/areas/_template.
7. Chữ hiển thị chuyển sang bảng chuỗi.
8. Nối Admin vào content mới, không mất chức năng cũ.
9. Test: save/migration, inventory, economy, valuation, test quy tắc import, test Area giả lập từ _template.

KẾT THÚC: cập nhật docs/PROGRESS.md, README các thư mục, báo cáo theo mẫu trong AGENT_RULES.
```

**Bạn kiểm tra:** Game mở và chơi được như trước. Save cũ còn nguyên heo, tiền, đồ. Admin vẫn chỉnh được heo và shop.

---

### GĐ2 — Thời gian thật và thế giới sống

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 2, 5, 7), docs/ARCHITECTURE.md (mục 5, 6, 9), docs/GAME_BALANCE.md (mục 1, 2), docs/ROADMAP.md (GĐ2).

NHIỆM VỤ: Giai đoạn 2 — thế giới chạy theo giờ thật, kể cả khi tắt game.

Trước khi code: đọc cơ chế thời gian và mô phỏng hiện có của Sobi Farm (chủ dự án thấy đang ổn), giữ những gì tốt, viết kế hoạch ngắn vào PROGRESS.md.

VIỆC CẦN LÀM:
1. core/clock: giờ thật, 4 buổi trong ngày, chống lùi giờ, tính thời gian offline (tối đa 30 ngày).
2. core/simulation: 3 chế độ (đang xem / nền / bù offline) dùng chung hàm simulate() của từng Area. Bước 1 phút online, 10 phút offline.
3. Farm.simulate(): đói, sạch sẽ, năng lượng, ngủ đêm, lớn, cân nặng, phân, máng tự cho ăn.
4. systems/health: nguy cơ bệnh, bệnh, nguy kịch (48 giờ), chết (72 giờ), giá trị giảm khi bệnh, thuốc, bảo vệ 72 giờ đầu của save mới.
5. Thay "harvest" bằng "Xuất chuồng" (UI, dữ liệu, công thức giá theo GAME_BALANCE mục 2.5).
6. Dọn phân thành tài nguyên item_manure.
7. Máng ăn tự động có cấp và sức chứa.
8. Màn hình "Trong lúc bạn vắng nhà" (dùng getSummary của Area), có nút đi đến chỗ cần xử lý.
9. Cảnh báo trong game: heo bệnh, heo nguy kịch.
10. Admin: tua thời gian (+1 giờ, +1 ngày, +7 ngày), chỉnh mọi con số mới.
11. Test: nhất quán bước 1 phút vs 10 phút trong 24 giờ; bù 30 ngày dưới 3 giây; bệnh → chết đúng mốc; bảo vệ người mới; chống lùi giờ.

ĐIỂM DỪNG: sau khi xong 1–4, báo cáo và chờ tôi duyệt trước khi làm 5–11.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu.
```

**Bạn kiểm tra:** Dùng Admin tua 1 ngày: heo đói, có phân, màn hình tóm tắt hiện đúng. Tua 4 ngày không cho ăn (sau 72 giờ bảo vệ): heo bệnh rồi chết đúng mốc. Xuất chuồng ra giá hợp lý.

---

### GĐ3 — Nhân vật và Sảnh Sobi

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 3, 4), docs/ARCHITECTURE.md, docs/ROADMAP.md (GĐ3).

NHIỆM VỤ: Giai đoạn 3 — người chơi có nhân vật và Sảnh Sobi.

VIỆC CẦN LÀM:
1. systems/character: di chuyển 4 hướng + chéo, va chạm theo layout, animation đi/đứng theo 4 hướng (dùng asset registry).
2. Tương tác: đứng gần vật thể → hiện gợi ý phím → nhấn phím tương tác.
3. core/settings + màn hình Cài đặt: đổi phím (mặc định WASD/mũi tên, E, I, C, Esc), kiểm tra trùng phím, lưu settings.json riêng.
4. Area Sảnh Sobi (src/areas/plaza): layout, 5 vật thể cổng (Chuồng heo, Khu vườn, Biển, Cây cao chọc trời, Cổng dịch chuyển). Area chưa mở hiển thị trạng thái khóa và điều kiện mở.
5. Chuyển cảnh Sảnh ↔ Farm (gọi onExit/onEnter, đổi chế độ mô phỏng).
6. Chuyển các thao tác Farm sang tương tác qua nhân vật. Giữ thao tác hàng loạt bằng chuột qua UI (ví dụ đổ thức ăn vào máng).
7. Mở game xuất hiện ở Sảnh. Lưu vị trí nhân vật.
8. Asset nhân vật và Sảnh: nếu chưa có, dùng placeholder rõ ràng, ghi danh sách asset cần làm vào docs/ASSET_TODO.md.
9. Admin: chỉnh layout Sảnh và vị trí cổng.
10. Test: chuyển Area không làm sai số liệu mô phỏng; đổi phím lưu đúng.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu.
```

**Bạn kiểm tra:** Đi lại mượt, đổi phím được, vào Farm làm đủ việc bằng nhân vật, quay về Sảnh. Các cổng chưa mở hiện điều kiện.

---

### GĐ4 — Bản cài desktop đầu tiên

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/ARCHITECTURE.md (mục 9, 10, 11), docs/ROADMAP.md (GĐ4).

NHIỆM VỤ: Giai đoạn 4 — tạo bản cài để người chơi bình thường cài và chơi.

VIỆC CẦN LÀM:
1. Chọn công cụ đóng gói phù hợp stack (đã đề xuất ở AUDIT_AND_PLAN). Ghi lý do vào docs/decisions/.
2. Build ra installer hoặc file chạy cho Windows (thêm macOS nếu stack cho phép dễ dàng), có icon, tên "Sobi World", tạo shortcut.
3. Save và settings lưu ở thư mục dữ liệu người dùng của hệ điều hành.
4. Build người chơi không chứa Admin; viết test hoặc script kiểm tra.
5. Game chạy hoàn toàn không cần internet.
6. Viết docs/BUILD.md: lệnh build, nơi ra file, cách kiểm tra.
7. Viết docs/TEST_MAY_SACH.md: các bước để chủ dự án tự thử trên máy không có công cụ lập trình.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, ghi rõ đường dẫn file cài.
```

**Bạn kiểm tra:** Chép file cài sang một máy khác (không cài phần mềm lập trình), tắt mạng, cài, mở bằng shortcut, chơi, tắt, mở lại thấy save còn.

---

### GĐ5 — Sobi Garden và sản xuất

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 3.3, 8.2), docs/ARCHITECTURE.md (mục 5), docs/GAME_BALANCE.md (mục 5, 6, 7), docs/ROADMAP.md (GĐ5).

NHIỆM VỤ: Giai đoạn 5 — thêm Sobi Garden, hoàn thành vòng lặp Garden ↔ Farm.

VIỆC CẦN LÀM:
1. Tạo Area garden từ _template. KHÔNG sửa core trừ khi bắt buộc; nếu phải sửa, ghi lý do.
2. systems/plants: gieo, tưới, lớn, chín, héo, phân bón. Hoạt động đúng ở cả 3 chế độ mô phỏng.
3. Dữ liệu 5 loại cây theo GAME_BALANCE mục 5.
4. Ô đất và mở rộng ô; vòi tưới tự động.
5. core/production: recipe theo thời gian thật tại công trình. Thêm Máy xay và Thùng ủ với 3 recipe khởi điểm.
6. Heo ăn được thức ăn cao cấp và cỏ ăn vặt.
7. Mở khóa Garden ở Farm Lv3; cổng Khu vườn ở Sảnh mở.
8. Tóm tắt offline có phần Garden.
9. Admin: chỉnh cây, recipe, công trình.
10. Test: vòng lặp phân → phân bón → cây → thức ăn → heo chạy đúng online và offline.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại bản desktop.
```

**Bạn kiểm tra:** Trồng bắp/lúa, chế thức ăn, cho heo ăn; dọn phân, chế phân bón, bón cây. Tắt game (tua Admin) rồi mở lại: cây vẫn lớn, sản xuất vẫn chạy.

---

### GĐ6 — Gắn kết (Vertical slice)

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 6, 7, 9, 13), docs/GAME_BALANCE.md (mục 3, 7, 8), docs/ROADMAP.md (GĐ6).

NHIỆM VỤ: Giai đoạn 6 — biến Farm + Garden thành trải nghiệm hấp dẫn, có mục tiêu liên tục.

VIỆC CẦN LÀM:
1. core/goals: Bảng đơn hàng ở Sảnh (ô, làm mới, thưởng, đổi đơn bằng Gems), mục tiêu hằng ngày, thành tựu (thưởng Gems).
2. systems/bond: 5 tim, vuốt ve, món yêu thích riêng mỗi con, hiệu ứng theo GAME_BALANCE. Đặt tên cho heo.
3. Mục đích nuôi: Xuất chuồng, Giống, Thú cưng (Phiêu lưu để khung, khóa đến GĐ10).
4. core/progression: level từng Area, World Development, thông báo lên cấp và mở khóa.
5. core/collection: Codex bản đầu (heo, cây, item), mốc thưởng.
6. Chợ: giá theo ngày, hiển thị nhóm hàng được giá.
7. Trang trí cơ bản: đặt/di chuyển/cất đồ, tăng tâm trạng sinh vật gần đó.
8. NPC hướng dẫn ở Farm và Garden. Hướng dẫn 10 phút đầu cho save mới (ngắn, bỏ qua được).
9. Rà soát cân bằng: mô phỏng 7 ngày chơi bằng script, báo cáo tiền kiếm được, thời gian lên level, thời gian mở Garden. Đề xuất chỉnh số nếu quá nhanh hoặc quá chậm.
10. Admin: chỉnh đơn hàng, mục tiêu, thành tựu, Codex, trang trí, NPC.

ĐIỂM DỪNG: sau bước 9, gửi báo cáo cân bằng và chờ tôi duyệt số trước khi hoàn tất.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build bản desktop để chủ dự án chơi thử nhiều ngày.
```

**Bạn kiểm tra (quan trọng nhất):** Tạo save mới, chơi thật ít nhất 3 ngày. Tự hỏi: Có muốn mở game mỗi ngày không? Lúc nào cũng biết việc tiếp theo không? Có chỗ nào chán, khó hiểu? Ghi lại cảm nhận, gửi cho agent bằng **Prompt chỉnh sửa** (mục D) trước khi sang GĐ7.

---

### GĐ7 — Lai giống nâng cao

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 7, 9), docs/GAME_BALANCE.md (mục 4), docs/ROADMAP.md (GĐ7).

NHIỆM VỤ: Giai đoạn 7 — lai giống có chiều sâu, khuyến khích khám phá.

VIỆC CẦN LÀM:
1. systems/breeding: gen, trait (tối đa 3), trait ẩn (lộ khi Bond 5 tim), di truyền, rarity, đột biến, pity.
2. Bảng tổ hợp trong content/breeding/. Thiết kế thêm ít nhất 6 giống mới có nhánh khám phá, mỗi giống có điểm riêng (ngoại hình, trait, giá, món yêu thích).
3. Phả hệ: xem bố mẹ, thế hệ.
4. NPC Nhà lai giống: tin đồn gợi ý mơ hồ, làm mới mỗi ngày.
5. Codex: mục giống heo, ô "???" cho giống chưa khám phá.
6. Admin: chỉnh bảng lai, xác suất, mô phỏng thử 1.000 lần lai để xem tỉ lệ.
7. Test: tỉ lệ đúng cấu hình; pity hoạt động; save cũ không lỗi.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Lai vài cặp, thấy kết quả đa dạng. Tin đồn gợi ý được nhưng không lộ hết. Dùng Admin mô phỏng 1.000 lần, tỉ lệ đúng.

---

### GĐ8 — Sobi Aquarium

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 8.3, 13), docs/GAME_BALANCE.md (mục 9), docs/ROADMAP.md (GĐ8).

NHIỆM VỤ: Giai đoạn 8 — thêm Sobi Aquarium, mở qua cổng Biển ở Sảnh.

VIỆC CẦN LÀM:
1. Area aquarium từ _template. Cá dùng systems/creature, health, bond, breeding (không viết lại).
2. Bể cá: sức chứa, độ sạch nước, nâng cấp.
3. Câu cá ở bờ biển: thao tác đơn giản, dễ thương; cá ban đêm.
4. Ít nhất 10 loài cá (Common đến Epic), mỗi loài có ít nhất 2 công dụng (bán, vật liệu, Codex, đơn hàng, lai, phiêu lưu sau này).
5. Thức ăn cá từ Garden (khoai tây) qua recipe mới.
6. Vật liệu từ cá (vảy, ngọc trai) dùng cho ít nhất 1 nâng cấp ở Farm hoặc Garden.
7. Đơn hàng và mục tiêu hằng ngày có cá; Codex cá; mở khóa theo GAME_BALANCE.
8. Admin: chỉnh cá, bể, câu cá.
9. Rà soát cân bằng 7 ngày có Aquarium; báo cáo.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Aquarium mở đúng lúc, câu cá vui, cá có ích cho Farm/Garden, không có cá "vô dụng".

---

### GĐ9 — Sobi Cloud

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 8.4, 13), docs/GAME_BALANCE.md (mục 9), docs/ROADMAP.md (GĐ9).

NHIỆM VỤ: Giai đoạn 9 — thêm Sobi Cloud, mở qua Cây cao chọc trời ở Sảnh.

VIỆC CẦN LÀM:
1. Area cloud từ _template, phong cách pastel trên mây. Hoa dùng systems/plants.
2. Nước tinh khiết (nguồn sản xuất), hoa thường và hoa hiếm, hoa đêm.
3. Potion: Healing Potion (chữa bệnh heo/cá), potion tâm trạng, potion hỗ trợ trận đánh (để dùng ở GĐ10).
4. Hoa tăng tỉ lệ đột biến khi lai (nối systems/breeding qua item, không import Area).
5. Mỗi hoa ít nhất 2 công dụng. Đơn hàng, mục tiêu, Codex hoa.
6. NPC Nhà giả kim.
7. Admin: chỉnh hoa, potion, recipe.
8. Rà soát cân bằng; báo cáo.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Healing Potion cứu được heo nguy kịch. Hoa làm lai giống thú vị hơn.

---

### GĐ10 — Adventure nền tảng

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 7, 8.5, 13), docs/GAME_BALANCE.md (mục 9), docs/ROADMAP.md (GĐ10).

NHIỆM VỤ: Giai đoạn 10 — Sobi Adventure đánh theo lượt, mở qua Cổng dịch chuyển.

VIỆC CẦN LÀM:
1. systems/combat: thứ tự theo Tốc độ, đòn thường, skill (năng lượng/hồi chiêu), dùng vật phẩm, nguyên tố khắc chế, chí mạng. Hàm thuần, có seed, test được.
2. Level, EXP, chỉ số theo level; mở skill ở level 10, 20.
3. systems/equipment: các ô trang bị, chỉ số, rarity.
4. Mỗi giống heo/loài cá có combatCapability có bộ skill riêng theo tính cách giống. Thiết kế ít nhất 12 skill.
5. Vùng Rừng: bản đồ ô sự kiện (trận, rương, sự kiện nhỏ), trùm cuối, loot table.
6. Thua: Kiệt sức nghỉ 4 giờ thật, không chết. Sinh vật đang bệnh không vào được.
7. Nhiệm vụ mở khóa tặng heo phiêu lưu khởi đầu. Mục đích "Phiêu lưu" được mở.
8. Giao diện trận đánh dễ thương, rõ ràng, có tốc độ x2.
9. Admin: chỉnh kẻ địch, skill, vùng, loot; mô phỏng 100 trận để xem tỉ lệ thắng.
10. Test combat, loot, kiệt sức.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Đánh vài trận, skill khác nhau rõ rệt giữa các con, thua không bị phạt nặng, trận không quá dài.

---

### GĐ11 — Adventure liên hệ thống

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 3.3, 8.5, 13), docs/GAME_BALANCE.md, docs/ROADMAP.md (GĐ11).

NHIỆM VỤ: Giai đoạn 11 — khép kín vòng lặp thế giới: Adventure cần nhà, nhà cần Adventure.

VIỆC CẦN LÀM:
1. Loot quay về: vật liệu cổ cho công trình Lv3–Lv4 ở mọi Area, hạt giống hiếm, cá hiếm, heo hiếm.
2. Công nghệ trang trại: cây nâng cấp dùng vật liệu Adventure (sức chứa, tốc độ sản xuất, recipe mới).
3. Chuẩn bị trước trận: thức ăn và potion từ Garden/Cloud cho buff; Bond ảnh hưởng chỉ số.
4. Thêm 2 vùng: Núi và Tàn tích cổ, kẻ địch và trùm mới.
5. Gems từ loot hiếm theo GAME_BALANCE.
6. Kiểm tra luật "không tài nguyên chết": liệt kê mọi item và số công dụng, sửa item chỉ có 1 công dụng.
7. Rà soát cân bằng toàn bộ 14 ngày chơi; báo cáo.

ĐIỂM DỪNG: sau bước 6–7, gửi báo cáo và chờ tôi duyệt.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Chơi thử vài ngày. Có cảm giác đi phiêu lưu để nâng cấp nhà, và chăm nhà để đi phiêu lưu xa hơn không?

---

### GĐ12 — Thế giới động

```
Bạn là lập trình viên chính kiêm game designer của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 9, 10, 13), docs/ROADMAP.md (GĐ12).

NHIỆM VỤ: Giai đoạn 12 — thời tiết, sự kiện, chợ sống động.

VIỆC CẦN LÀM:
1. systems/weather: thời tiết theo ngày (seed), hiệu ứng nhẹ: mưa cây nhanh, mưa đêm cá hiếm, cầu vồng tăng đột biến. Hiển thị dự báo ngày mai.
2. Hiệu ứng hình ảnh thời tiết ở Area đang xem; Area nền chỉ tính số liệu.
3. Sự kiện theo mùa với Event Tokens và cửa hàng sự kiện. Thiết kế 4 sự kiện (Lễ hội thu hoạch, Lễ hội cá, Lễ hội hoa, Lễ hội heo).
4. NPC Thương nhân: đơn hàng đặc biệt, thay đổi nhu cầu chợ.
5. Admin: chỉnh thời tiết, lịch sự kiện, bật sự kiện thử.
6. Cân bằng lại kinh tế tổng thể; báo cáo.

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Thời tiết tạo cảm giác thế giới sống nhưng không bắt buộc. Dùng Admin bật thử từng sự kiện.

---

### GĐ13 — Tích hợp, kiểm thử gameplay, nghiệm thu

```
Bạn là lập trình viên chính kiêm QA của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md (đặc biệt §8), docs/PROGRESS.md, docs/ROADMAP.md (GĐ13), docs/decisions/017-gameplay-first-art-later.md, docs/BUILD.md.

NHIỆM VỤ: Giai đoạn 13 — chốt toàn bộ gameplay. Art vẫn là placeholder; KHÔNG làm art, animation, VFX, âm thanh ở giai đoạn này.

VIỆC CẦN LÀM:
1. Lập danh sách nghiệm thu từng Area và hệ thống chung (từ ROADMAP và spec), chạy từng mục, ghi kết quả vào PROGRESS.md.
2. UI chức năng: mọi luồng thao tác được, nút nói lý do khi tắt; không dựa vào art.
3. Trợ năng chức năng: cỡ chữ, chế độ màu dễ nhìn, tắt rung màn hình.
4. Ngôn ngữ: hoàn thiện tiếng Việt, thêm tiếng Anh từ bảng chuỗi, chọn trong Cài đặt.
5. Hiệu năng: đo FPS và thời gian bù offline; tối ưu chỗ chậm.
6. Rà "không tài nguyên chết" cho toàn bộ item; kiểm save/migration từ mọi phiên bản save trước.
7. Chơi thử các luồng chính trên bản cài (dist:win), sửa lỗi gameplay/kiến trúc thật; chạy sim:week dài để xem cân bằng.
8. Chốt gameplay freeze: ghi danh sách những gì đã đóng băng.

ĐIỂM DỪNG: sau bước 8, gửi báo cáo và chờ tôi duyệt (chơi thử ≥ 7 ngày thật).

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Chơi từ đầu trên máy sạch, đủ luồng Farm → Garden → Aquarium → Cloud → Adventure; không còn lỗi chặn; cân bằng ổn.

---

### GĐ14 — Hoàn thiện art, animation, VFX, âm thanh

```
Bạn là art director kiêm lập trình viên của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/ROADMAP.md (GĐ14), docs/ASSET_TODO.md, docs/decisions/017-gameplay-first-art-later.md; skill image-to-asset.

NHIỆM VỤ: Giai đoạn 14 — thay toàn bộ placeholder bằng art cuối. Không đổi logic, content hay save.

VIỆC CẦN LÀM (làm theo từng Area, báo cáo sau mỗi Area):
1. Art theo ASSET_TODO.md và ảnh tham khảo trong docs/reference-assets/ và asset/reference/.
2. Animation nhân vật, sinh vật, cảnh; VFX (lên cấp, mở khóa, Codex, thời tiết, sự kiện).
3. Nhạc nền mỗi Area và Sảnh; âm thanh tương tác; chỉnh âm lượng đã có ở Cài đặt.
4. Polish UI (bố cục, chuyển cảnh, khoảng cách).
5. npm run assets:check và npm run assets:release phải qua; test và e2e xanh.

ĐIỂM DỪNG: sau mỗi Area, gửi ảnh chụp và chờ tôi duyệt.

KẾT THÚC: cập nhật PROGRESS.md, ASSET_TODO.md, báo cáo theo mẫu, build lại.
```

**Bạn kiểm tra:** Xem từng Area, từng vật phẩm, nghe âm thanh; hình khớp phong cách; game vẫn mượt.

---

### GĐ15 — Phát hành

```
Bạn là lập trình viên chính của dự án Sobi World.

ĐỌC TRƯỚC: docs/AGENT_RULES.md, docs/PROGRESS.md, docs/ROADMAP.md (GĐ15), docs/BUILD.md.

NHIỆM VỤ: Giai đoạn 15 — chuẩn bị bản phát hành 1.0.

VIỆC CẦN LÀM:
1. Rà lần cuối: lỗi, chữ, giao diện; kiểm save/migration từ mọi phiên bản save trước.
2. Installer cuối cùng, phiên bản 1.0.0, ghi chú phát hành ngắn, tag sobi-world-v1.0.0 (v1.0.0 đã thuộc Sobi Farm, không tạo trùng).

KẾT THÚC: cập nhật PROGRESS.md, báo cáo theo mẫu, đường dẫn file cài 1.0.0.
```

**Bạn kiểm tra:** Cài trên máy sạch, chơi từ đầu, đổi ngôn ngữ, chỉnh âm lượng. Save từ các bản thử trước vẫn mở được.

---

## D. Prompt dùng nhiều lần

### Tiếp tục khi agent bị ngắt

```
Đọc docs/AGENT_RULES.md và docs/PROGRESS.md. Kiểm tra git log và trạng thái code để xác định chính xác giai đoạn và bước đang dở. Báo cho tôi bạn đang ở đâu, việc gì đã xong, việc gì còn lại. Sau đó tiếp tục làm đúng theo prompt của giai đoạn đó trong docs/HUONG_DAN_TRIEN_KHAI.md.
```

### Sửa lỗi

```
Đọc docs/AGENT_RULES.md và docs/PROGRESS.md.
LỖI: [mô tả: đã làm gì, mong đợi gì, thực tế thấy gì, có ảnh chụp/log thì đính kèm]
Yêu cầu: tìm nguyên nhân gốc, sửa, viết test để lỗi không quay lại, kiểm tra save không bị ảnh hưởng. Ghi vào PROGRESS.md và báo cáo theo mẫu.
```

### Chỉnh sửa sau khi chơi thử

```
Đọc docs/AGENT_RULES.md, docs/PROGRESS.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md.
CẢM NHẬN SAU KHI CHƠI THỬ: [liệt kê điều thấy chán, khó hiểu, quá nhanh/chậm, điều thích]
Yêu cầu: phân tích nguyên nhân từng điểm, đề xuất cách chỉnh (ưu tiên chỉnh số trong content/balance trước khi đổi cơ chế). ĐIỂM DỪNG: chờ tôi duyệt rồi mới làm. Sau khi làm, cập nhật GAME_BALANCE.md nếu đổi con số.
```

### Thêm nội dung mới (heo, cây, cá, item…)

```
Đọc docs/AGENT_RULES.md, docs/SOBI_WORLD_PROJECT_SPEC_V2.md (mục 13).
NỘI DUNG MỚI: [mô tả]
Yêu cầu: thêm bằng dữ liệu trong content/ (qua Admin nếu được), đảm bảo có ít nhất 2 công dụng và 1 liên kết với Area khác, thêm vào Codex, kiểm tra validation, báo cáo theo mẫu.
```
