# PROGRESS — Sobi World

## Trạng thái hiện tại
**Giai đoạn:** GĐ2 — Thời gian thật và thế giới sống: việc 1–4 xong, **chờ chủ dự án duyệt** trước việc 5–11
**Nhánh:** `phase-02-real-time`
**Bước tiếp theo:** sau khi duyệt → GĐ2 việc 5 (Xuất chuồng thay harvest), 6 (phân thành item_manure), 7 (máng có cấp), 8 (màn hình vắng nhà), 9 (cảnh báo), 10 (Admin tua giờ), 11 (test).

## Nhật ký

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
