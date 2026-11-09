# NGHIÊN CỨU — Nâng cấp & Đúc khuông trồng (Sobi Cloud, Sobi Garden)

**Ngày:** 2026-11-09 · **Loại:** báo cáo nghiên cứu, **không triển khai** · **Nhánh khảo sát:** `overnight-hardening`
**Trạng thái:** chờ chủ dự án đánh giá. Không có thay đổi code, content, save, asset.

Ký hiệu dùng trong báo cáo:
- **[XM]** — đã xác minh trong source / content / bằng chạy mô phỏng của dự án (có dẫn file).
- **[SL]** — suy luận / nhận định của agent.
- **[ĐX]** — đề xuất thiết kế mới (chưa tồn tại).

> **Điều chỉnh tiền đề quan trọng [XM]:** Sobi Cloud và Sobi Garden **không phải hai trò chơi riêng**. Chúng là hai **Area** của cùng một game Sobi World (`SOBI_WORLD_PROJECT_SPEC_V2.md` §1): chung một file save (mỗi Area một "slice" trong `areas.*`), chung ví tiền (`wallet`), túi đồ, World XP / World Level. Không có database hay server (Spec §2, §14). Vì vậy câu hỏi "dùng chung hệ thống hay riêng" ở đây là: **chung engine + kinh tế, khác nội dung + trình bày**.

---

## 0. Tóm tắt điều hành

1. **Có phù hợp không?** Có, và đang **thiếu** đúng thứ này. Mô phỏng bot 60 ngày [XM] cho thấy: World Level chạm trần 20 ở **ngày ~45**; sau khi mua hết tầng mây / khu đất / công nghệ (ngày ~56) thì **vàng không còn chỗ tiêu lớn** (thặng dư ~15–20k Sobi Coin/ngày); **Gems tích 633 mà chỉ có một chỗ tiêu** (đổi đơn hàng, 5 Gems); vảy, thảo mộc rừng, nanh thú, phân bón, thức ăn heo **dư thừa** (bot bán đi hàng nghìn đơn vị). Một hệ thống nâng cấp + sưu tầm khuông là **bồn tiêu (sink) dài hạn** hợp lý.
2. **Không nên giữ nguyên ý tưởng ban đầu** ở 4 điểm:
   - **Không** cộng EXP cho khuông (EXP tính theo hành động, không theo sản lượng; cấp tối đa đạt ở ngày ~45 nên bonus EXP chết về sau, còn trước đó thì đẩy nhanh các cổng mở tầng/khu).
   - **Không** dùng tốc độ sinh trưởng làm chỉ số chính (mô hình: người ghé 2 lần/ngày được **0%**, người ghé 9 lần/ngày được tới **+48%** → nới rộng khoảng cách, trái tinh thần cozy).
   - **Không** nâng cấp chỉ số **từng ô** ở quy mô hiện tại (tối đa 150 ô mây + 96 ô đất = 246 ô; 4 cấp → ~984 lượt nâng cấp).
   - Thứ tự **Sắt → Đồng** ngược quy ước phổ biến; kim loại cũng lệch chủ đề (vườn trên mây / đất) và game **không có** vật phẩm sắt / đồng.
3. **Khuyến nghị:** hai hệ thống **tách biệt nhưng xếp lớp**:
   - **Nâng cấp = theo tầng mây / khu đất**, 5 bậc (Cơ bản + 4), chỉ số chính **+% sản lượng** (5 / 10 / 15 / 20 %), bậc cao có **một đặc quyền riêng mỗi Area**. Chi phí vàng + vật phẩm dư thừa của nhiều Area.
   - **Đúc khuông = mở khóa mẫu ngoại hình vĩnh viễn (sưu tầm), chỉ thẩm mỹ**, áp lên tầng / khu; Gems làm chất xúc tác. Cấp nâng cấp hiện bằng **viền / huy hiệu phủ lên** mẫu → kết hợp tự do mà art chỉ tăng tuyến tính.
4. **Cần chủ dự án quyết định trước** (mục 8.5): mở băng gameplay (decision 021), đơn vị nâng cấp, tên bậc, skin có chỉ số hay không, dùng Gems, phạm vi art.

---

## 1. Current System Audit — Hiện trạng

### 1.1 Khuông trồng (ô) là gì trong code [XM]

| Hạng mục | Sobi Cloud | Sobi Garden |
|---|---|---|
| Logic ô dùng chung | `src/systems/plants/plot.ts` (thuần, dạng đóng theo thời gian) | cùng file |
| Dữ liệu một ô | `{ cropId, grown, wetUntil, fertilized, ripeAt }` | giống hệt |
| Ô có thuộc tính riêng (cấp, loại, skin)? | **Không** — ô "không có trạng thái trước khi gieo" (`plot.ts`) | **Không** |
| Lưu ở đâu | `areas.sobi_cloud.plots[]` (`src/areas/cloud/logic/state.ts`, slice **v2**, có migration 1→2) | `areas.sobi_garden.plots[]` (`src/areas/garden/logic/state.ts`, slice **v1**, chưa có migration) |
| Nhóm ô | **Tầng mây**: 15 ô/tầng, 10 tầng, tối đa 150 (`content/cloud/balance.json`, decision 023) | **Khu đất**: 24 ô/khu, 4 khu, tối đa 96 (`content/garden/balance.json`, decision 028) |
| Nhóm có lưu không | Không — tầng = `floor(index/15)`; tầng đang xem chỉ là trạng thái trình bày (`viewedTier.ts`) | Không — khu = `floor(index/24)` (`viewedZone.ts`) |
| Mở rộng | 6 → 9 → 12 → 15 ô (300 / 800 / 2.000), rồi mỗi tầng trọn 15 ô: 5.000 (Lv9) … 100.000 (Lv20). Tổng **328.100** | 6 → … → 24 ô (200 … 15.000), rồi khu 2/3/4: 25.000 (Lv8) / 50.000 (Lv12) / 90.000 (Lv16). Tổng **191.900** |
| Art ô | **một** sprite cho mọi ô: `plot_cloud` (`cloud/logic/art.ts`) | `plot_soil`, `plot_soil_wet`, `plot_locked` (`garden/logic/art.ts`) |

### 1.2 Trồng, sinh trưởng, thu hoạch [XM]

- **Mô hình thời gian đóng:** `grown` tích "mili-giây đủ nước"; ô khô lớn với `dryRate`. Một hàm cho online / nền / offline (ARCHITECTURE §5–6). Mọi bonus mới phải đi qua đây hoặc ở hành động thu hoạch để giữ tính tất định.
- **Khác nhau về nước:**
  - Cloud: khô lớn **25%** tốc độ, tưới 1 **Nước tinh khiết**/ô hiệu lực **4 giờ**. Nước đến từ **Suối mây** (3 cấp: 20/12/8 phút một giọt, sức chứa **6/10/16**) hoặc mua 15 xu. Chỉ tưới được ô **đang khô** (`needsWater`). → **Nước là nút thắt có chủ ý** (decision 016).
  - Garden: khô lớn **50%**, tưới tay 3 giờ; **vòi tưới** phủ N ô **đầu tiên theo chỉ số** (6/12/24/48/96) và **mưa** tưới mọi ô + ×1,25 tốc độ (`simulateGarden` dùng thời tiết; Cloud **không** dùng thời tiết).
- **Phân bón:** thời gian ×0,75 và **+1 sản lượng cố định** (cả hai Area).
- **Héo:** chín quá 48 giờ → sản lượng ×0,5 (tối thiểu 1); không mất cây.
- **Thu hoạch cho vật phẩm, không cho vàng.** Vàng có khi **bán** (`sellGold` trong `content/shared/items.json`, qua `sellItem` + chợ theo ngày). Hoa đêm hái ban đêm ×2 (`pickYield`, Cloud).

### 1.3 EXP và tiến trình [XM]

- EXP cộng **theo hành động × số ô**, không theo số vật phẩm: Cloud gieo 2 / thu 3 / bón 1 / tưới 0; Garden gieo 1 / thu 2 / bón 1 (`balance.json › xp`, `actions/plants.ts`).
- Một **World Level** duy nhất, **tối đa 20** (67.135 XP, `content/shared/progression.json`). Các cổng phụ thuộc cấp: mở Area, **tầng mây 2–10 (cấp 9–20)**, **khu đất 2–4 (cấp 8/12/16)**.
- World Development = cấp + Codex/10 + số công trình Lv3 (`core/progression/levels.ts`) — gác mở Area.

### 1.4 Vàng, Gems, vật phẩm, túi đồ [XM]

- Ví: `coins`, `gems`, `eventTokens` (`core/save/world.ts`). Mọi thay đổi qua sổ cái Transaction (luật dự án).
- **Gems**: nguồn = thành tựu, Codex, mục tiêu tuần, loot Adventure/Rift, cửa hàng lễ hội. **Chỗ tiêu duy nhất tìm thấy: đổi đơn hàng 5 Gems** (`core/goals/orders.ts`, `rerollGems`). GAME_BALANCE §8 dự kiến Gems cho "đồ trang trí độc quyền" — **chưa có**.
- Túi đồ **không giới hạn** (decision 038) → không có áp lực kho.
- Vật liệu liên Area đã dùng làm chi phí nâng cấp công trình: vảy, ngọc trai (Aquarium); bánh răng cổ, rune cổ, quặng (Adventure) — ví dụ vòi tưới cấp 3–5, suối Cloud cấp 3, công nghệ (`content/shared/tech.json`).
- Đã có tiền lệ "mua đồ trang trí có chỉ số nhỏ": `content/farm/decor.json` (1.500–15.000 xu, `happyBonus` 1–3).
- Đã có hệ sản xuất có thời gian (`core/production`) nếu cần "đúc mất thời gian".

### 1.5 Kinh tế thực tế — mô phỏng bot 60 ngày [XM]

Chạy `scripts/simulate-week.ts 7 60` (bot 3 phiên/ngày, logic game thật, chỉ in ra màn hình):

| Mốc / số liệu | Giá trị |
|---|---|
| Garden mở / Cloud mở | ngày 4,5 / ngày 14,5 |
| World Level 20 (trần) | **ngày 45,5**; tới ngày 60 XP = 114.848 (dư ~47.700 XP vô dụng) |
| Công nghệ tối đa | ngày ~54 |
| Mua tầng mây cuối (100.000) | ~ngày 56 |
| Thặng dư vàng cuối game | **~15–20k xu/ngày** (ví 7,8k → 84,6k trong ngày 50–60 dù đã trả 100k) |
| Gems kiếm được | **633** (gần như không tiêu) |
| Thu từ bán hoa Cloud | 221.119 xu (~4,9k/ngày từ khi mở) — Cloud thực tế là **nguồn tiền lớn thứ 2**, không chỉ "tiện ích" như decision 016 dự đoán |
| Chi xây Cloud / Garden | 235.200 / 198.600 |
| Vật phẩm bot phải bán vì dư | vảy ~1.500 cái (61k xu), thảo mộc rừng ~1.600 (29k), nanh thú ~380, phân bón ~1.000; trong túi còn **3.608 thức ăn heo** |
| Vật phẩm khan | ngọc trai (còn 3), **rune cổ (0)**, lõi vùng Adventure (2 mỗi loại) |

**[SL]** Kết luận kinh tế: giai đoạn giữa (ngày 15–45) vàng **đã bị giành** bởi mở rộng tầng/khu, chuồng, công nghệ; giai đoạn cuối (sau ~ngày 50) **thiếu bồn tiêu**. EXP **không còn giá trị** sau ngày ~45.

### 1.6 Giao diện liên quan [XM]

- Thẻ thông tin ô: `plotCardVm` (Cloud `cloudVm.ts`, Garden `gardenVm.ts`) — tiến độ, thời gian chín, khô/ướt, nút tưới/bón/thu.
- Cloud: banner tên tầng + nút lên/xuống tầng, lưới 5×3 một tầng mỗi màn. Garden: thanh "‹ Khu n · tên ›", ruộng trượt ngang.
- Hành động hàng loạt theo **tầng/khu đang xem** (gieo kín, bón phân tất cả — decision 028) → đã có quy ước "thao tác theo nhóm".
- Lưới thẻ cửa hàng dùng chung `ui/components/shopGrid.ts`; drone bón phân dùng chung `ui/world/fertilizerDrone.ts`; mọi phản hồi qua `FeedbackDirector`; "Giảm chuyển động" tắt hiệu ứng.

### 1.7 Ràng buộc dự án ảnh hưởng tính năng [XM]

- **Đóng băng gameplay (decision 021)**: thêm cơ chế cần chủ dự án mở băng riêng (tiền lệ: 023 tầng mây, 028 khu đất, 037 Adventure, 053–055).
- **Spec cập nhật chưa làm** đã có ý tưởng gần: `update_spec_sobi_cloud_gameplay_v1.md` §XIX–XX **Pot System** (chậu có độ hiếm, mỗi chậu một "identity": Swift / Lucky / Golden / Cloud Pot; rèn chậu hàng loạt) và `update_spec_sobi_garden_gameplay_v1.md` (loại đất `soilType`, Quality, Life Essence). `ASSET_TODO.md` ghi "chậu hoa 4 bậc hiếm… để dành sau". → Ý tưởng **có gốc trong tài liệu dự án**, chưa được chốt.
- Spec §13: không hệ thống cô lập; mọi tài nguyên ≥ 2 công dụng; mỗi nội dung mới ≥ 1 liên kết Area khác; cozy, không ép grind.
- AGENT_RULES §4 (Admin cho nội dung mới), §9 (IP), ARCHITECTURE: `core` thuần, rng có seed, save có migration.

### 1.8 Game tham chiếu (Khu Vườn Trên Mây) — chỉ tham khảo cơ chế

Nguồn công khai (chưa kiểm chứng sâu, nhiều phiên bản khác nhau) mô tả: nâng cấp chậu **tăng sản lượng và rút thời gian lớn**; **đúc chậu** từ vàng / ngọc / khoáng sản, có dòng chậu theo chủ đề (cung hoàng đạo) **giảm thời gian thu hoạch, tăng giá trị đơn hàng**. **[SL]** Game đó có số chậu ít hơn nhiều và nhịp chơi mobile ghé thường xuyên, nên "giảm thời gian" có giá trị ở đó hơn ở Sobi World (game desktop, giờ thật, người chơi ghé thưa). **Theo §9:** không dùng tên, hình, dòng chậu đặc trưng của game đó (kể cả "chậu cung hoàng đạo" — ghép chủ đề này với đúc chậu là đặc trưng nhận diện của họ).

---

## 2. Design Opportunities — Cơ hội

| # | Cơ hội | Cơ sở |
|---|---|---|
| O1 | **Bồn tiêu vàng dài hạn** cho cuối game | thặng dư 15–20k/ngày sau ngày ~50 [XM] |
| O2 | **Chỗ tiêu Gems** đúng ý GAME_BALANCE §8 ("trang trí độc quyền") | 633 Gems, 1 chỗ tiêu [XM] |
| O3 | **Công dụng thứ 2–3 cho vật phẩm dư** (vảy, thảo mộc, nanh, phân bón, nông sản rẻ, hoa thường) | bot bán hàng nghìn đơn vị [XM] |
| O4 | **Mục tiêu sau trần cấp 20** (sưu tầm, hoàn thiện vườn) | XP vô dụng sau ngày 45 [XM] |
| O5 | **Cá nhân hóa** khu vườn — hiện mọi ô một sprite | `plot_cloud`, `plot_soil` [XM] |
| O6 | **Liên kết Area** (Aquarium/Adventure/lễ hội → Cloud/Garden) | Spec §13 luật 3 |
| O7 | Biến lời hứa "Rèn chậu" của spec Cloud thành thứ gọn, hợp quy mô 150 ô | update spec §XIX–XX [XM] |

---

## 3. Feature Options — Phương án

### 3.1 Đơn vị nâng cấp

| Phương án | Trải nghiệm | Chiều sâu | Động lực dài | Cân bằng | Kỹ thuật | Mở rộng | Bảo trì |
|---|---|---|---|---|---|---|---|
| **A. Từng ô** | Cảm giác "chậu của tôi" mạnh; nhưng **246 ô × 4 cấp ≈ 984 lượt** → việc vặt | Có: chọn cây tốt cho ô xịn | Dài nhưng do khối lượng, không do lựa chọn | Khó: chi phí × số ô, vòi tưới Garden theo chỉ số ô làm lệch | Mảng cấp theo ô, migration | Tốt | Trung bình |
| **B. Theo tầng mây / khu đất** (14 nhóm) | Rõ ràng, một quyết định / nhóm; cả tầng đổi diện mạo cùng lúc (cảnh chỉ hiện một tầng) → đẹp | Vừa: chọn tầng nào trước | 14 nhóm × 4 cấp = **56 mốc** — vừa đủ | Dễ: mỗi nhóm một dòng giá | Một mảng nhỏ trong slice | Tốt | Thấp |
| **C. Từng ô + nút "nâng cả tầng"** | Linh hoạt nhưng thực tế người chơi sẽ bấm cả tầng → thành B với state rối (tầng lẫn cấp) | Như A | Như A | Khó nhất | Cao nhất | Tốt | Cao |
| **D. Một công trình nâng cấp cho cả Area** (kiểu công nghệ) | Đơn giản nhất, nhưng **mất cảm giác khuông** (không thấy ô đổi) | Thấp | Ngắn (vài cấp) | Dễ | Thấp | Kém | Thấp |

**[SL] Kết luận:** **B** tốt nhất ở quy mô hiện tại; A/C chỉ hợp lý nếu số ô nhỏ (≤ ~30). D đã gần giống công nghệ hiện có, trùng vai trò.

### 3.2 Bậc cố định hay nhánh

- **Cố định 5 bậc** [ĐX]: dễ hiểu, dễ cân bằng, khớp ý 5 bậc của chủ dự án.
- **Nhánh** (ví dụ chọn "Bội thu" hoặc "Bền hoa"): thêm chiều sâu nhưng mỗi nhánh gấp đôi art và cân bằng, và người chơi sẽ tra "nhánh tối ưu". **Để sau**, chỉ cân nhắc nếu v1 thấy nhàm.
- **Sau cấp tối đa**: không đề xuất cấp vô hạn / "tái sinh" (lạm phát, trái cozy). Hậu-max nên là **sưu tầm** (đúc mẫu, biến thể sao) — tiêu tài nguyên mà không tăng sức mạnh.

### 3.3 Loại lợi ích — đánh giá bằng mô hình [XM: mô hình theo luật `plot.ts`; SL: diễn giải]

Mô hình 1 ô / 28 ngày, 3 kiểu người chơi (ghé 2, 4, 9 lần/ngày), Cloud tưới tay mỗi lần ghé, Garden luôn đủ nước (vòi). Lợi nhuận = bán − hạt.

**Lợi nhuận gốc / ô / ngày (vàng)**

| Cây | Ghé 2 lần | Ghé 4 lần | Ghé 9 lần | Nếu để khô |
|---|---|---|---|---|
| Cúc Mây (4h) | 47 | 95 | 119 | 24 |
| Diên Vĩ Sấm (11h) | 77 | 106 | 137 | 40 |
| Sen Mây (16h, sản lượng 1) | 39 | 58 | 73 | 19 |
| Lúa mì (3h) | 10 | 20 | 25 | 10 |
| Dâu tây (9h) | 118 | 120 | 120 | 60 |
| Hướng dương (14h) | 170 | 255 | 255 | 109–140 |

**Tăng thêm khi có bonus (người ghé 2 lần → 9 lần)**

| Bonus | Cúc Mây | Diên Vĩ | Sen Mây | Hướng dương | EXP thêm |
|---|---|---|---|---|---|
| Tốc độ +10% | 0% → 0% | 0% → **+15%** | 0% → +9% | 0% → 0% | ~0 |
| Tốc độ +25% | 0% → 0% | 0% → +17% | 0% → +24% | 0% → **+31%** | rất nhỏ |
| Sản lượng +10% | +15% → +15% | +22% → +22% | +31% → +50% | +13% → +13% | **0** |
| +1 sản lượng cố định (kiểu phân bón) | +33% | +50% | **+100%** | +50% | 0 |

Diễn giải [SL]:
- **Tốc độ**: lợi ích phụ thuộc gần hoàn toàn vào **tần suất ghé** (người ghé ít: 0%; người ghé dày: tới +48% với dâu tây). Trong game giờ thật + offline, đây là bonus **thưởng người cày**, nới khoảng cách — trái Spec §13.4 "chơi ngắn vẫn có tiến bộ". Ở Cloud nó còn tương tác với nước (nút thắt có chủ ý).
- **Sản lượng %**: lợi ích **đều cho mọi kiểu chơi**, tỉ lệ thuận giá trị cây → công bằng, dễ đọc, dễ cân bằng. Lợi nhuận ròng của cây hạt đắt (Sen Mây) tăng mạnh hơn vì biên lợi nhuận mỏng — chấp nhận được, có thể chỉnh bằng giá hạt.
- **+1 cố định**: lệch nặng (+33% đến +100%) theo cây → **loại**.
- **EXP**: EXP tính theo **lượt** chứ không theo sản lượng → bonus sản lượng tự nhiên **không đụng EXP**. Một bonus EXP riêng sẽ (a) vô dụng sau trần cấp 20 (ngày ~45), (b) trước đó **kéo sớm** các cổng tầng mây (Lv9–20) / khu đất (Lv8/12/16) → phá nhịp đã cân. **Loại.**
- **Kéo dài thời gian tưới (Cloud)**: mô hình cho **−9% đến −25%** với người ghé đều, vì game **không cho tưới ô còn ướt** → nước dài hơn lệch nhịp ghé. Muốn "tiết kiệm nước" thì phải định nghĩa là **tiết kiệm số giọt** (ví dụ cứ 4 lần tưới thì 1 lần miễn phí), không phải tăng giờ.

### 3.4 Đúc khuông — 4 phương án

| Phương án | Ưu | Nhược | Đánh giá |
|---|---|---|---|
| **1. Chỉ ngoại hình** | Không lạm phát; tự do phối; mục tiêu sưu tầm thuần; dễ cân bằng | Cần art đẹp để có sức hút; người thích "số" ít động lực | **Khuyến nghị v1** |
| 2. Hiệu ứng đặc biệt (ví dụ mẫu Đại dương: hoa đêm thêm…) | Tạo câu chuyện, liên kết luật Area | Xuất hiện "mẫu tối ưu" → mọi người dùng một mẫu, **giết cá nhân hóa**; chồng với bonus cấp | Để sau, chỉ dạng **rất nhẹ, có điều kiện** nếu cần |
| 3. Chỉ số riêng | — | Trùng vai trò với nâng cấp; nhân bonus; khó cân bằng | **Loại** |
| 4. Biến thể / cấp phát triển (sao ★) | Sink dài hạn cho tài nguyên mà **không tăng sức mạnh** (★2 đổi màu, ★3 có hiệu ứng động) | Thêm art | **Để v2** — hậu-max tốt nhất |

### 3.5 Quan hệ Nâng cấp ↔ Đúc

- **Độc lập về dữ liệu, xếp lớp về hình ảnh** [ĐX]: mẫu (skin) quyết định **chủ đề**; cấp quyết định **viền / huy hiệu / ánh sáng** phủ lên. Bất kỳ mẫu nào cũng hiện được mọi cấp.
- Lý do kỹ thuật/art [SL]: nếu mỗi cặp (mẫu × cấp) là một ảnh riêng thì art tăng theo **tích** (ví dụ 6 mẫu × 5 cấp × 2 Area × trạng thái ướt Garden ≈ 90 ảnh); xếp lớp thì tăng theo **tổng** (6 mẫu × 2 Area (+ ướt) + 4 viền × 2 Area ≈ 26 ảnh).

---

## 4. Economy Analysis — Kinh tế

### 4.1 Tài nguyên: dư / khan / nên dùng [XM số liệu, SL phân loại]

| Tài nguyên | Tình trạng | Dùng cho |
|---|---|---|
| Sobi Coin | Khan giữa game, **dư cuối game** | Cả nâng cấp và đúc |
| Gems | **Rất dư** (633, 1 chỗ tiêu) | **Đúc** (thẩm mỹ, đúng GAME_BALANCE §8). Không dùng cho nâng cấp chỉ số (giữ tinh thần "Gems không mua sức mạnh") |
| Vảy (Aquarium) | **Rất dư** | Nâng cấp bậc 2–3; đúc mẫu Đại dương |
| Thảo mộc rừng, nanh thú, quặng núi | Dư | Nâng cấp Garden; đúc mẫu Rừng / Đá |
| Bánh răng cổ | Bot giữ 40, bán phần thừa | Nâng cấp bậc 3 |
| Phân bón, thức ăn heo, nông sản rẻ, hoa thường | Dư | "Cống phẩm" của chính Area ở bậc 1 (tiêu sản phẩm Area tự làm ra) |
| Ngọc trai, rune cổ, lõi vùng | **Khan** | Chỉ lượng nhỏ ở **bậc 4** / mẫu hiếm → tạo uy tín, không chặn bậc thấp |
| Vé Lễ Hội | Kiếm = tiêu (bot) | Mẫu theo mùa (cửa hàng lễ hội đã có, có giới hạn) |
| **Tiền tệ mới** | — | **Không cần.** Tài nguyên hiện có đủ |

### 4.2 Công thức chi phí đề xuất [ĐX — con số dự đoán, chỉnh ở Admin, kiểm bằng bot]

Giá vàng bậc L của nhóm g (tầng/khu, đánh số từ 1):

```
coins(L, g) = base[L] × (1 + k × (g − 1))
Cloud:  base = [3.000, 9.000, 24.000, 60.000], k = 0,2   (tầng 10: ×2,8)
Garden: base = [4.000, 12.000, 32.000, 80.000], k = 0,4  (khu 4: ×2,2; khu lớn hơn: 24 ô)
```

Nhóm cao giá hơn vì người chơi mở chúng muộn hơn (khi đã giàu hơn).

Vật phẩm (ví dụ, chưa chốt):

| Bậc | Cloud (mỗi tầng) | Garden (mỗi khu) | Bonus |
|---|---|---|---|
| 1 | 30 hoa thường | 40 nông sản thường + 20 phân bón | +5% sản lượng |
| 2 | 10 hoa hiếm + 20 vảy | 30 vảy + 20 thảo mộc rừng | +10% |
| 3 | 30 vảy + 10 bánh răng cổ | 15 bánh răng cổ + 20 nanh thú | +15% |
| 4 | 2 ngọc trai + 1 rune cổ + 10 hoa EPIC/LEGENDARY | 3 ngọc trai + 2 rune cổ + 50 hướng dương | +20% + đặc quyền Area |

Đặc quyền bậc 4 (mỗi Area một, [ĐX], tùy chọn): **Cloud** — tiết kiệm nước (cứ 4 lần tưới trong tầng thì 1 lần không tốn giọt); **Garden** — chống héo (48 → 72 giờ, giúp người ghé thưa, không tăng sản lượng của người cày).

### 4.3 Tổng chi và nhịp [SL, tính từ công thức trên + bot]

| Mốc | Cloud (10 tầng) | Garden (4 khu) | Tổng | ≈ ngày thặng dư cuối game (17k/ngày) |
|---|---|---|---|---|
| Bậc 1–2 mọi nhóm | 228.000 | 102.400 | **330k** | ~20 ngày |
| + Bậc 3 | 456.000 | 204.800 | 661k | ~39 ngày |
| + Bậc 4 | 1.140.000 | 512.000 | 1,65M | ~97 ngày |
| **Tất cả** | 1,82M | 0,82M | **~2,64M** | **~5–6 tháng** |

Hoàn vốn (ROI) [SL]: một tầng mây trồng hoa hiếm, tưới đều, cho ~100–200 xu giá trị thu/ô/ngày → bậc 1 (+5%, 3.000 xu) hoàn vốn **~20–40 ngày**; bậc 4 gần như **không hoàn vốn** (thuần uy tín + ngoại hình). Đây là chủ ý: bậc thấp là **đầu tư hợp lý**, bậc cao là **bồn tiêu**.

Tác động lên tốc độ tích lũy [SL]: tối đa +20% trên thu hoạch Cloud + Garden (~6,5k xu/ngày ở cuối mô phỏng) ≈ **+1,3k/ngày ≈ +7–8% tổng thu nhập** — không phá cân bằng. EXP: **0** thay đổi. Vật phẩm: hoa/nông sản tăng ≤ 20% → nguyên liệu potion và thức ăn heo dồi dào hơn (thức ăn heo đã dư, nên tác động thực ~ chỉ qua bán).

### 4.4 Rủi ro người chơi mới / lâu năm [SL]

- **Người mới**: vàng ngày 1–14 thường < 10k và đã bị giành bởi ô/chuồng/vòi. → **Gác mở**: nâng cấp chỉ hiện khi **nhóm đã đủ ô** (tầng 1 đủ 15 ô / khu 1 đủ 24 ô) và World Level ≥ 8 (giữa game). Không hiện nút xám từ đầu (tránh áp lực).
- **Người lâu năm**: tổng 2,64M + vật phẩm khan (ngọc trai, rune) ở bậc 4 → không thể max trong vài ngày. Đúc + biến thể ★ (v2) là bồn tiêu tiếp theo.
- **Cổng cấp**: không dùng World Level làm điều kiện bậc 3–4 quá cao vì cấp 20 đạt ở ngày 45 — cổng thật nên là **vàng + vật phẩm khan**.

### 4.5 Cách áp bonus sản lượng (vấn đề làm tròn) [SL]

Sản lượng gốc là số nguyên nhỏ (1–3), +5% làm tròn sẽ mất hết. Hai cách:

| Cách | Ưu | Nhược |
|---|---|---|
| **Xác suất mỗi vật phẩm** dùng `ctx.rng` có seed (mỗi hoa thu được có p% ra thêm 1) | Không cần lưu thêm; kỳ vọng đúng %; tỉ lệ theo giá trị | Có may rủi (nhưng 15–24 ô/lần thu nên trung bình nhanh) |
| **Thanh "Bội thu" tất định** lưu theo nhóm | Người chơi **thấy** tiến trình ("lần thu tới +3 hoa") | Phải lưu thêm; nếu tính theo số hoa chung thì bị lách (nạp bằng hoa rẻ, nhận bằng hoa đắt) → phải tách theo loài |

Khuyến nghị v1: **xác suất mỗi vật phẩm** (đơn giản, không lách được); hiển thị "+n bội thu" trong toast thu hoạch.

---

## 5. UI/UX Proposal

### 5.1 Nhận biết & thông tin

- **Banner tầng (Cloud) / thanh khu (Garden)** hiện bậc bằng 0–4 ngôi sao/huy hiệu + nút "Nâng cấp" (chỉ khi đủ điều kiện mở). Ví dụ "‹ Khu 2 · Đồng Lúa Vàng ★★ ›".
- **Thẻ ô** (`plotCardVm` sẵn có) thêm một dòng: "Tầng 3 · bậc 2 · +10% sản lượng · Mẫu Biển Ngọc".
- **Trong cảnh**: mẫu = thân khuông; bậc = viền/ánh (gỗ → đá → bạc → vàng → pha lê, hoặc theo tên bậc chọn ở 8.5). Bậc 4 có ánh lấp lánh nhẹ (tắt khi "Giảm chuyển động").
- Màn danh sách tầng/khu: lưới nhỏ cho thấy bậc của từng nhóm → biết ngay nhóm nào chưa nâng.

### 5.2 Giao diện nâng cấp

- Hộp thoại hai cột **Trước / Sau** (xem trước diện mạo tầng ở bậc kế), bonus viết bằng lời: "Mỗi bông hái ở tầng này có 10% cơ hội ra thêm 1 bông".
- Danh sách chi phí "có / cần" (màu đỏ khi thiếu, kèm nơi kiếm: "Vảy — Sobi Aquarium"). Nút **luôn nói lý do bị tắt** (quy ước hiện có của `shopGrid`).

### 5.3 Giao diện đúc khuông ("Xưởng đúc khuông")

- Lưới thẻ (tái dùng `shopGrid`): **đã sở hữu / đúc được / chưa mở bản thiết kế** (bóng mờ + gợi ý cách mở, ví dụ "Hạ trùm Bờ Biển").
- Chi tiết: ảnh lớn ở cả 2 phiên bản (mây & đất), độ hiếm, nguyên liệu, nút Đúc.
- **Chọn mẫu**: trong cảnh, nút "Đổi mẫu" → dải chọn ngang, **xem trước trực tiếp** trên tầng đang xem; áp cho cả tầng/khu (v1).

### 5.4 Hiệu ứng (qua GameEvent → FeedbackDirector)

- Nâng cấp thành công: làn sáng quét qua 15/24 ô, sao trên banner điền dần, âm thanh nâng cấp; Cloud: bụi sao tím–trắng, mây phồng nhẹ; Garden: đất "cuộn" màu mới, lá rơi, tông xanh–gỗ.
- Đúc mẫu hiếm: màn mở hộp ngắn (≤ 2 giây, bấm để bỏ qua), viền theo độ hiếm; ghi vào bộ sưu tập.
- "Giảm chuyển động": thay bằng đổi ảnh tức thì + toast.

### 5.5 Khác biệt phong cách

| | Cloud | Garden |
|---|---|---|
| Tông | tím–trắng, pastel, phát sáng nhẹ | xanh lá–gỗ–đất, ấm, ít phát sáng |
| "Khuông" là gì | bệ mây / đĩa mây giữ hoa | luống / ô đất có bờ |
| Bậc thể hiện | độ dày mây, viền ánh, hạt sáng | màu đất, bờ (gỗ → đá → gạch men…), cỏ viền |
| Art Garden cần thêm | — | bản **ướt** (`plot_soil_wet`) cho mỗi mẫu |

---

## 6. Cloud vs Garden

| Dùng chung [ĐX] | Thiết kế riêng [ĐX] |
|---|---|
| Logic bonus sản lượng (một tham số trong `systems/plants` hoặc ở bước thu hoạch) | Tên bậc, ngoại hình, tông màu |
| Lược đồ content "bậc nâng cấp" và "mẫu khuông" (schema chung, file riêng mỗi Area) | Bảng giá, vật phẩm từng bậc (Cloud dùng hoa; Garden dùng nông sản/phân bón) |
| Thành phần UI: hộp thoại nâng cấp, lưới đúc, dải chọn mẫu | Đặc quyền bậc 4 (Cloud: tiết kiệm nước; Garden: chống héo) |
| Sự kiện, sổ cái, Admin | Mẫu nào có ở Area nào (một số mẫu chỉ hợp một nơi) |
| **Bộ sưu tập mẫu chung**: đúc một lần, có cả bản mây & bản đất (gợi ý) | Cấu trúc nhóm (15 vs 24 ô) và hệ số giá |

Lưu ý khác biệt đã xác minh khi thiết kế chi tiết: Cloud bị giới hạn bởi **nước**, Garden bởi **vòi tưới theo chỉ số ô + thời tiết**; Cloud có **hệ số hoa đêm ×2**; XP mỗi lượt khác nhau; Cloud slice đã v2 có migration, Garden slice v1.

---

## 7. Risks & Trade-offs

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Vi phạm **đóng băng gameplay** (021) | Cao (quy trình) | Chủ dự án mở băng bằng decision riêng, như 023/028 |
| **Đổi save** (slice Cloud v2→v3, Garden v1→v2 hoặc trường tùy chọn) | Trung bình | Trường tùy chọn (tiền lệ decision 054) hoặc migration + test save thật; vắng = bậc 0, mẫu mặc định |
| **Art** tăng nhiều (mẫu × 2 Area, bản ướt Garden, viền 4 bậc, hiệu ứng) | Cao (chi phí) | Xếp lớp mẫu + viền; v1 ít mẫu; art đi qua id → manifest, placeholder trước |
| **Lạm phát** sản lượng | Thấp | ≤ +20%, chỉ sản lượng; mô phỏng bot trước khi chốt |
| **Mẫu thành "meta"** nếu có chỉ số | Trung bình | Giữ chỉ thẩm mỹ |
| **Codex / World Development** bị đẩy nếu đếm mẫu vào Codex (WD = Codex/10) hoặc tính "công trình Lv3" | Trung bình | Không đếm vào WD, hoặc đếm có chủ đích và mô phỏng lại cổng Adventure |
| Gacha / đúc thất bại (phổ biến trong thể loại) | — | **Không làm**: đúc luôn thành công, không ngẫu nhiên, không mất đồ (cozy, Spec §13.4) |
| **IP** (tên bậc / mẫu trùng game tham chiếu) | Trung bình | Không dùng "chậu cung hoàng đạo"; tên, hình gốc; rà `IP_AUDIT_PROMPT.md` |
| Chủ đề **Núi lửa** không có vùng / vật liệu trong game | Thấp | Hoãn, hoặc thay bằng chủ đề có thật trong game (Núi Đá, Tàn Tích Cổ) |
| Người mới thấy quá tải | Thấp | Gác mở theo nhóm đủ ô + cấp 8 |

Đánh đổi chính [SL]: **Nhóm** thay vì từng ô → mất một chút cảm giác "chậu của riêng tôi", đổi lại rõ ràng, ít việc vặt, cân bằng được. Phần "riêng tôi" chuyển sang **đúc mẫu** (cá nhân hóa không ảnh hưởng số liệu).

---

## 8. Recommended Direction — Khuyến nghị

### 8.1 Phương án tối ưu

**"Nâng cấp theo nhóm cho số liệu, đúc mẫu cho cá nhân hóa"**:
1. **Nâng cấp tầng mây / khu đất**: 5 bậc (Cơ bản + 4), chỉ **+% sản lượng** (5/10/15/20, áp bằng xác suất mỗi vật phẩm có seed), bậc 4 thêm một đặc quyền riêng mỗi Area. Chi phí: vàng tăng theo bậc và theo vị trí nhóm + vật phẩm dư của nhiều Area; vật phẩm khan chỉ ở bậc 4.
2. **Đúc khuông**: mở khóa **mẫu ngoại hình vĩnh viễn**, chỉ thẩm mỹ, nguyên liệu liên Area + **Gems** làm xúc tác; bản thiết kế mở bằng mốc tất định (Codex, hạ trùm, cấp, lễ hội). Mẫu áp theo tầng/khu; bậc hiện bằng viền phủ lên.

Lý do: tạo bồn tiêu vàng, Gems, vật phẩm dư mà kinh tế đang thiếu; công bằng cho người ghé ít (không thưởng tần suất); không đụng EXP và các cổng cấp; art tăng tuyến tính; khớp quy ước "thao tác theo nhóm" và cảnh "một tầng/khu mỗi màn" đã có.

### 8.2 Phạm vi bản đầu (v1)

- Nâng cấp 14 nhóm × 4 bậc, bonus sản lượng, đặc quyền bậc 4 (có thể cắt nếu muốn v1 tối giản).
- Xưởng đúc: **4 mẫu**, mỗi mẫu có bản mây + bản đất, ví dụ [ĐX, tên tạm]:
  - **Rừng Xanh** — thảo mộc rừng + nanh thú (Adventure) + nông sản; mở khi hạ trùm Rừng.
  - **Biển Ngọc** — vảy + ngọc trai (Aquarium); mở khi Codex có N loài cá.
  - **Pha Lê** — quặng núi + Mẫu Đơn Pha Lê (hoa lai Cloud); mở khi phòng lai cho ra hoa đó.
  - **Tinh Tú** — hoa đêm + rune cổ + Gems; mở ở World Level 18.
- Áp mẫu theo tầng/khu, xem trước trực tiếp.
- Sự kiện, sổ cái, Admin (bảng bậc, bảng mẫu), test logic, chạy lại bot kinh tế.

### 8.3 Để dành tương lai

- Biến thể ★2/★3 cho mẫu (đúc lại để đổi màu / hiệu ứng động) — bồn tiêu hậu-max.
- Mẫu theo **lễ hội** (4 lễ hội, chu kỳ 28 ngày → mẫu quay lại, không FOMO) qua cửa hàng vé.
- "Chế độ tô": đặt mẫu cho **từng ô** (chỉ thẩm mỹ).
- Thành tựu / mục tiêu tuần liên quan ("nâng 3 tầng lên bậc 2", "sưu tầm 4 mẫu").
- Nhánh nâng cấp (chỉ nếu v1 thấy đơn điệu).
- Thời gian đúc qua `core/production` (nếu muốn cảm giác chờ đợi).

### 8.4 Nên loại bỏ

- Bonus **EXP** từ khuông (thay bằng một lượng EXP nhỏ một lần khi nâng cấp/đúc, nếu muốn).
- **Tốc độ sinh trưởng** làm chỉ số chính.
- **+1 sản lượng cố định** theo bậc.
- Nâng cấp **chỉ số từng ô** ở quy mô 246 ô.
- Cấp vô hạn / tái sinh; đúc ngẫu nhiên, đúc thất bại, mất đồ khi đúc.
- Mẫu khuông là **vật phẩm tiêu hao** mỗi ô (150 bản sao = việc vặt).
- Tiền tệ mới; chủ đề không có nguồn trong game (Núi lửa) ở v1.

### 8.5 Câu hỏi chủ dự án cần quyết định

1. **Mở băng gameplay** (decision 021) cho tính năng này? Làm **trong GĐ14** hay sau, trước phát hành GĐ15?
2. **Đơn vị nâng cấp**: theo tầng/khu (khuyến nghị) hay từng ô?
3. **Lợi ích**: chỉ sản lượng (khuyến nghị) — có muốn thêm EXP hoặc tốc độ dù đã phân tích ở 3.3?
4. **Đặc quyền bậc 4** (Cloud tiết kiệm nước, Garden chống héo): giữ hay bỏ ở v1?
5. **Tên bậc**: theo chủ đề Area (ví dụ Cloud: Mây Bông → Mây Sương → Mây Bạc → Mây Ráng Vàng → Mây Ngọc; Garden: Đất Thường → Đất Mùn → Đất Phù Sa → Đất Hoàng Thổ → Đất Ngọc) hay theo kim loại? Nếu kim loại: sửa thứ tự (ví dụ Gỗ → Đồng → Bạc → Vàng → Kim cương)?
6. **Mẫu đúc chỉ thẩm mỹ** (khuyến nghị) hay có hiệu ứng nhẹ?
7. **Dùng Gems** làm xúc tác đúc (đồng nghĩa mở chỗ tiêu Gems lớn đầu tiên)?
8. Mẫu áp **theo tầng/khu** (v1) hay cần áp **từng ô** ngay?
9. Danh sách **chủ đề v1** (4 mẫu đề xuất) — giữ / đổi / thêm? Hoãn Núi lửa?
10. Đúc **tức thì** hay **có thời gian chờ**?
11. Mẫu/bậc có **tính vào Codex / World Development** không?
12. **Ngân sách art**: bao nhiêu ảnh cho v1 (ước ~26 ảnh theo cách xếp lớp + hiệu ứng)?

---

## 9. Future Expansion — Khả năng mở rộng

| Hướng | Khả năng | Ghi chú [SL] |
|---|---|---|
| Thêm bậc nâng cấp | Dễ: một dòng content + một viền | Mỗi bậc thêm phải chạy lại bot; nên giữ tổng bonus ≤ ~25–30% |
| Mẫu theo mùa / sự kiện | Dễ: cửa hàng lễ hội đã có giới hạn số lượng và chu kỳ | Mẫu quay lại theo chu kỳ, không FOMO |
| Nguyên liệu / công thức mới | Dễ: công thức là content; mẫu mới cần nguồn vật liệu có thật | Theo Spec §13: mỗi vật liệu ≥ 2 công dụng (`items:audit`) |
| Mở rộng sưu tầm | Bộ sưu tập → thành tựu, album ảnh (đã có tính năng chụp ảnh) | Cẩn thận WD nếu đếm vào Codex |
| Thêm tầng/khu/cây | Công thức giá theo vị trí nhóm tự giãn | Bonus % tự áp cho cây mới, không cần bảng riêng |
| Area khác (Aquarium: "bể", Farm: "chuồng") | Cùng khuôn mẫu "nâng cấp nhóm + mẫu ngoại hình" | Chỉ sau khi v1 được kiểm chứng |

---

## 10. Cập nhật sau phản hồi của chủ dự án (2026-11-09, vòng 2)

Chủ dự án đã trả lời: **nâng cấp theo tầng (Garden: theo khu), nâng cấp thì môi trường cũng nâng cấp; tên bậc theo từng khu; đúc khuông trả bằng Gems hoặc Sobi Coin; World Level có thể nâng lên 100.** Các mục dưới đây điều chỉnh đề xuất theo đó. Vẫn là đề xuất, chưa triển khai.

### 10.1 "Đóng băng gameplay" (decision 021) là gì — giải thích ngắn

Ngày 2026-10-11, sau khi xong GĐ13, dự án **khóa luật chơi** để vẽ art (GĐ14) mà không phải vẽ lại vì cơ chế đổi. Từ đó chỉ được: sửa lỗi, chỉnh con số trong `content/`, sửa chữ, làm art. **Thêm cơ chế mới** (như nâng cấp khuông, đúc khuông, level 100) cần chủ dự án **đồng ý mở băng cho riêng phần đó**, ghi thành một decision. Đã làm vậy nhiều lần: tầng mây (023), khu đất Garden (028), Adventure (037), mục tiêu tuần / hội thi heo / Rift (053–055).
→ Câu hỏi thực chất chỉ là: **anh đồng ý mở băng cho "nâng cấp tầng/khu + đúc khuông + level 100" không?** Câu trả lời của anh ở vòng này có vẻ là có; tôi cần một câu xác nhận để ghi decision khi bước sang thiết kế chi tiết.

### 10.2 Nâng cấp tầng / khu kèm nâng cấp môi trường

Dữ liệu đã có [XM]: mỗi tầng mây có **tên chủ đề riêng** (`vi.ts › tierNames`: Vườn Trên Mây, Tầng Mây Cầu Vồng, … Hoa Anh Đào, Sao Băng, Ánh Trăng, Hoàng Kim, Đỉnh Mây); mỗi khu Garden cũng có tên (Vườn Nhà, Đồng Lúa Vàng, Đồi Bắp Nắng, Thung Lũng Rau Củ). Hiện tại khác biệt giữa tầng/khu **chỉ là phủ một màu** lên cùng một nền (`zoneTints`, decision 023 / 029).

Đề xuất [ĐX] — môi trường xếp lớp theo bậc, chủ đề lấy từ tên tầng/khu:

| Bậc | Khuông (ô) | Môi trường quanh tầng/khu | Chuyển động đi kèm |
|---|---|---|---|
| 1 (cơ bản) | như hiện tại | nền chung + màu tầng/khu | như hiện tại |
| 2 | viền khuông mới | viền hoa / hàng rào, lối đi lát | cánh hoa, bướm |
| 3 | viền + hoa văn | **vật mốc của tầng/khu xuất hiện** (Hoa Anh Đào: cây anh đào; Đồng Lúa Vàng: guồng nước…) | vật mốc có chuyển động riêng (cánh rơi, guồng quay) |
| 4 | viền sáng nhẹ | đèn, ánh sáng đêm, sinh vật nhỏ | đom đóm / chim mây đôi / ong |
| 5 | viền rực + hạt sáng | "điểm nhấn" của tầng (Cloud: thác mây đổ mép đảo, vầng sáng; Garden: cây cổ thụ của khu, chợ quê nhỏ) | hiệu ứng lớn, tắt khi "Giảm chuyển động" |

Art xếp lớp (không vẽ lại nền cho mỗi bậc): **bộ đồ trang trí dùng chung theo bậc** (mỗi Area ~5–6 món/bậc) + **1 vật mốc / tầng hoặc khu** (Cloud 10, Garden 4) + chuyển động bằng code (tween, hạt, rope uốn như cây). Ước lượng: Cloud ~24 món chung + 10 vật mốc; Garden ~24 món chung + 4 vật mốc lớn. Môi trường **chỉ trình bày**, không thêm chỉ số. Liên quan trực tiếp đề xuất layout: `AREA_LAYOUT_ANIMATION_PROPOSAL.md`.

### 10.3 Tên bậc theo từng khu (tránh trùng tên tầng/khu đã có)

| Bậc | Cloud — phương án A (chất mây) | Cloud — phương án B (ánh sáng) | Garden — phương án A (chất đất) | Garden — phương án B (bờ luống thủ công) |
|---|---|---|---|---|
| 1 | Mây Bông | Mây Mộc | Đất Vườn | Luống Mộc |
| 2 | Mây Sương Sớm | Mây Ửng Hồng | Đất Mùn Tơi | Luống Đá Cuội |
| 3 | Mây Lụa Trời | Mây Tơ Bạc | Đất Phù Sa | Luống Gạch Nung |
| 4 | Mây Ngọc Trai | Mây Lưu Ly | Đất Hoàng Thổ | Luống Men Lam |
| 5 | Mây Thiên Quang | Mây Thiên Đường | Đất Ngàn Mùa | Luống Hoa Văn |

Tôi nghiêng về **Cloud A + Garden A** (đọc là hiểu "càng lên càng quý", hợp vật liệu từng bậc: bậc 4 Cloud dùng ngọc trai). Tất cả là tên gốc, chung chung, không dựa IP nào; vẫn sẽ qua `IP_AUDIT_PROMPT.md` khi chốt.

### 10.4 Đúc khuông: Gems **hoặc** Sobi Coin

[ĐX] Mỗi mẫu có **nguyên liệu cố định** (liên Area) + **một phần thanh toán chọn được**: X Sobi Coin **hoặc** Y Gems.
- Tỉ giá gợi ý **1 Gem ≈ 500 Sobi Coin**. Căn cứ [XM/SL]: cửa hàng lễ hội bán 1 Gem = 20 vé, 1 ngọc trai = 15 vé, ngọc trai bán 300 xu → 1 vé ≈ 20 xu → 1 Gem ≈ 400 xu; cuối game bot kiếm ~17k xu/ngày và ~10 Gems/ngày (1 Gem ≈ 1.700 xu theo thu nhập). 500 nằm giữa: người giàu xu cuối game thấy trả xu dễ; người giữa game còn ít xu nhưng có Gems từ thành tựu thì trả Gems.
- Ví dụ: mẫu thường 10.000 xu **hoặc** 20 Gems; mẫu hiếm 30.000 xu **hoặc** 60 Gems; mẫu theo lễ hội trả thêm Vé Lễ Hội.
- **Nâng cấp tầng/khu (có chỉ số) vẫn chỉ trả xu + vật phẩm**, không trả Gems — giữ đúng GAME_BALANCE §8 "Gems không mua lợi thế sức mạnh". Nếu anh muốn cho Gems cả ở đây thì cần quyết riêng.

### 10.5 Level 100 thay đổi gì cho đề xuất khuông

Chi tiết ở `WORLD_LEVEL_100_PROPOSAL.md`. Ảnh hưởng tới phần này:
- Lập luận "EXP vô dụng sau ngày 45" **không còn đúng** nếu có cấp 21–100. Tôi **vẫn khuyến nghị không cộng EXP từ khuông** (EXP tính theo lượt; bonus EXP sẽ rút ngắn đường cong 1 năm của cấp 21–100 và kéo sớm các cổng ≤ 20), nhưng mỗi lần **nâng bậc / đúc mẫu cho một lượng EXP một lần** là hợp lý.
- Cấp 21–100 cho các bậc khuông một **cổng có ý nghĩa** (bổ sung cho vàng + vật phẩm): bậc 2 cấp 12, bậc 3 cấp 25, bậc 4 cấp 40, bậc 5 cấp 60 (≈ ngày 24 / 51 / 83 / 154 theo bot 3 phiên/ngày với đường cong đề xuất). Bản thiết kế mẫu đúc mở ở các mốc 30 / 50 / 70 / 90.

---

## Phụ lục — Cách tái lập số liệu

- Mô phỏng kinh tế: `npx tsx scripts/simulate-week.ts 7 60` (chỉ in ra màn hình, không ghi file).
- Mô hình bonus một ô: script nghiên cứu ngoài repo (thư mục scratchpad của phiên), mô phỏng bước 5 phút theo luật `systems/plants/plot.ts` (khô = `dryRate`, chỉ tưới khi khô, thu + gieo lại mỗi lần ghé), 28 ngày.
- Lợi nhuận/ô/giờ tính từ `content/cloud/flowers.json`, `content/garden/crops.json`, `sellGold` / `priceGold` trong `content/shared/items.json`.

Nguồn tham khảo về game tham chiếu (chỉ cơ chế chung): [tinhte.vn](https://tinhte.vn/thread/2879085), [BlueStacks — hướng dẫn vật phẩm](https://www.bluestacks.com/vi/blog/game-guides/khu-vuon-tren-may/skygarden-items-guide-vn.html), [thegioididong.com](https://www.thegioididong.com/game-app/khu-vuon-tren-may-zingplay-xay-dung-khu-vuon-tren-nhung-tang-may-223277).
