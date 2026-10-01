# PROMPT THEO PHASE — Ủn Ỉn Homemade (bản tối ưu token cho Claude Pro)

Mỗi khối ```text``` dưới đây là **một prompt dán nguyên** vào Claude Code. Một prompt = một phase = một session sạch.

---

## 0. Vì sao bản này tốn ít token hơn §J của `hướng_dẫn_triển_khai.md`

| Kỹ thuật | Tiết kiệm |
|---|---|
| Luật chung + vòng làm việc nằm **một lần** trong `CLAUDE.md` (Claude Code tự nạp mỗi lượt và được cache), prompt không lặp lại | ~60 dòng/prompt |
| Prompt trỏ **đúng số dòng** của spec (`L517-577`) thay vì "đọc §7" hay "đọc cả spec" | Spec 1497 dòng → mỗi phase chỉ đọc 50–250 dòng |
| Phụ lục A (config) và B (i18n, 270 dòng) được **trích bằng `sed`**, Claude không đọc rồi gõ lại | ~15k token ở P02 |
| Cấm đọc `hướng_dẫn_triển_khai.md` (172KB), 2 catalogue, `archive/` | Tránh vô tình đốt cả hạn mức |
| Gộp phase nhỏ (P00+P01, P17+P18, P20+P21); tách sẵn phase 🔴 thành A/B | Ít session khởi động lại, không phase nào vượt 1 cửa sổ usage |
| Chỉ 1 file state `PROJECT_STATUS.md` ≤ 30 dòng; lịch sử = git log; không file handover | Session sau khôi phục ngữ cảnh bằng ~2k token |
| Test chạy reporter gọn, phase Phaser kiểm bằng hàm thuần có test + bạn nhìn bằng mắt, hạn chế screenshot | Phase 14/15 rẻ hơn nhiều |

## 1. Cách dùng

1. Mở Claude Code tại `D:\Local\Un_In`. Code nằm chung thư mục với tài liệu (thư mục `public/assets/` của game khác với `asset/` tài liệu).
2. Gõ `/spec-to-source S00`. Từ đó mỗi phase: `/clear` → `/spec-to-source tiếp` (hoặc `/spec-to-source S03` để chọn task). Skill tự đọc đúng block bên dưới — **không cần dán prompt**. Các block chỉ để bạn xem/sửa phạm vi.
3. Phase xong khi Claude trả khối `DONE … NEXT:` (check xanh + commit + tag). Nó **tự dừng**. Gặp khối `BLOCKED … NEED:` thì chỉ cần trả lời đúng phần NEED.
4. Model: **Sonnet** cho mọi phase. Nếu gói cho phép, chuyển **Opus** cho P03, P04A, P04B (toán + test dày), xong thì về Sonnet.
5. Đang làm mà gần hết usage → dán prompt **WIP** (mục 4). Usage reset → `/clear` rồi **CONTINUE**.
6. Ngoài `/clear`, nếu một phase kéo dài và context phình to, dùng `/compact` một lần thay vì để nó tự tràn.

**Lộ trình** (23 prompt, ước ~25–35 cửa sổ usage):

| # | Phase | Ghi chú |
|---|---|---|
| S00 | Setup + chốt quyết định + khung dự án | gộp P00+P01 |
| S02 | Types, config, rng, clock, i18n | |
| S03 | Engine: advancePig | Opus nếu có |
| S04A | Engine: resolveTrough | Opus nếu có |
| S04B | Engine: advanceWorld + events | Opus nếu có |
| S05 | Save & persistence | |
| S06A | Actions kinh tế | |
| S06B | Actions chăm sóc | |
| S07 | gameStore | |
| S08A | DOM UI: khung + nông trại | |
| S08B | DOM UI: hành động → **★ DỪNG, CHƠI THỬ 15 phút ★** | |
| S09 | Shop / Kho / Level / Slot / Lịch sử | |
| S10 | Breeding & birth | |
| S11 | NPC orders | |
| S12 | Collection & skins → **chơi thử 30 phút** | |
| S19 | Economy sim + fuzz | đưa lên sớm: không cần UI, bắt lỗi balance trước khi làm đồ hoạ |
| S13 | Asset manifest + placeholder | |
| S14A / S14B | Phaser: scene + sprite / máng, anchor, click | |
| S15A / S15B | Phaser: state động / state overlay + reduceMotion | |
| S16 | UX: responsive, tutorial, away summary | |
| S17 | Audio + PWA/offline | gộp P17+P18 |
| S20 | QA Phụ lục C + README + release | gộp P20+P21 |
| ART | Nạp art thật (wave 1/2) | làm bất kỳ lúc nào sau S13 |

---

## 2. S00 — Setup, chốt quyết định, khung dự án

```text
PHASE S00 — SETUP + DECISION LOCK + FOUNDATION. Trả lời tôi bằng tiếng Việt, ngắn gọn.

Thư mục này đang chứa tài liệu thiết kế game "Ủn Ỉn Homemade — Solo Edition" (PWA nuôi heo, chơi đơn, offline). Chưa có code. Nhiệm vụ: dựng nền để các session sau làm việc rẻ nhất có thể.

GIỚI HẠN ĐỌC (rất quan trọng, tiết kiệm token):
- Chỉ đọc: README.md (toàn bộ), UN_IN_GAME_SPEC_v4_SOLO.md dòng 1-127 và 157-195, hướng_dẫn_triển_khai.md dòng 172-240.
- KHÔNG đọc phần còn lại của hướng_dẫn_triển_khai.md, không đọc archive/, asset/animals/, asset/building/, ảnh.

VIỆC CẦN LÀM:
1. git init. Đổi tên README.md → DESIGN_README.md (README.md sẽ là README của game, viết ở phase cuối). Tạo .gitignore (node_modules, dist, coverage, .vite).

2. Tạo CLAUDE.md ở gốc, NGUYÊN VĂN khối giữa hai dòng ===== dưới đây:
=====
# Ủn Ỉn Homemade
Mọi việc triển khai/tiếp tục: dùng skill `spec-to-source` (quy trình, giao tiếp, state). Task: `PROMPTS_THEO_PHASE.md`. State: `PROJECT_STATUS.md`.
- Không đọc: archive/, hướng_dẫn_triển_khai.md, DESIGN_README.md, asset/animals/, asset/building/, ảnh (trừ khi task bảo).
- src/core/ thuần: không import game/ui/store, không DOM/browser API (trừ save/storage.ts), không Date.now()/Math.random() (trừ defaultRng trong rng.ts). now/rng luôn inject.
- Vàng chỉ đổi qua 1 helper ghi Transaction. Số ở src/core/config/, chuỗi ở src/i18n/vi.ts, asset qua public/assets/manifest/assets.json.
- Không nới golden value/tolerance. Không làm §20 Backlog, không cosmetics, không gọi mạng runtime.
- Comment code tiếng Anh. Trả lời tiếng Việt, theo format DONE/BLOCKED của skill.
=====

3. DECISIONS.md: với C1–C4 và Q1–Q8 ở hướng_dẫn_triển_khai.md dòng 172-240, áp dụng đúng phương án "Khuyến nghị/Mặc định khuyến nghị". Mỗi mục ≤4 dòng: ID · quyết định · section spec liên quan · phase bị ảnh hưởng. Thêm: A1 — browser API chỉ được nằm trong src/core/save/storage.ts. Nếu bạn thấy khuyến nghị nào sai so với spec, nói với tôi thay vì im lặng làm theo.

4. SPEC_INDEX.md: chạy `grep -n '^#' UN_IN_GAME_SPEC_v4_SOLO.md` và tương tự cho asset/ASSET_PRODUCTION_STANDARD_v1.md, asset/AI_ASSET_GENERATION_PACK.md; dựng bảng "chủ đề → file → khoảng dòng (start-end)". Không cần đọc nội dung.

5. Khung dự án theo spec §4 + §4.1 (dòng 128-195):
   - Vite + TypeScript strict (vanilla-ts), cài: phaser, zod, idb; dev: vitest, fake-indexeddb, eslint + typescript-eslint, prettier, tsx, sass. CHƯA cài vite-plugin-pwa, playwright.
   - ESLint: trong src/core/** cấm `Date.now`, `Math.random`, `new Date()` không tham số (no-restricted-syntax/properties), cấm import từ game/ui/store (no-restricted-imports).
   - Tạo cây thư mục §4.1 với .gitkeep; src/main.ts in "Ủn Ỉn" ra màn hình.
   - Guard: tạo .claude/spec-to-source.config.mjs NGUYÊN VĂN từ .claude/skills/spec-to-source/references/projects/un-in-homemade/index.md §7 (chỉ đọc §7). Thử phá 1 lần (file probe có Date.now() trong src/core → guard phải exit 1), rồi xoá probe.
   - Scripts: dev, build, preview, test (vitest run), typecheck (tsc --noEmit), lint, guard (node .claude/skills/spec-to-source/scripts/check-architecture.mjs), check (= typecheck && lint && guard && test).
   - 1 test giả trong tests/unit để chứng minh vitest chạy.

6. PROJECT_STATUS.md theo format state của skill (SKILL.md §5). Next task: S02.

XONG KHI: `npm run check` xanh, `npm run build` chạy được, đã commit + tag p00. Báo DONE.
```

---

## 3. Prompt từng phase

### S02 — Types, config, rng, clock, i18n

```text
PHASE S02 — CORE TYPES & CONFIG. Theo CLAUDE.md.

Đọc spec: §5 dòng 196-328, §6 dòng 329-508, §8.16 dòng 748-754. KHÔNG đọc Phụ lục A/B — trích bằng lệnh:
  sed -n '1047,1097p' UN_IN_GAME_SPEC_v4_SOLO.md > src/core/config/breeds.ts
  sed -n '1105,1144p' UN_IN_GAME_SPEC_v4_SOLO.md > src/core/config/skins.ts
  sed -n '1152,1158p' UN_IN_GAME_SPEC_v4_SOLO.md > src/core/config/names.ts
  sed -n '1166,1176p' UN_IN_GAME_SPEC_v4_SOLO.md > src/core/config/errors.ts
  sed -n '1188,1459p' UN_IN_GAME_SPEC_v4_SOLO.md > src/i18n/vi.ts
Kiểm dòng đầu/cuối mỗi file (head -3 / tail -3) để chắc không dính dấu ``` . Chỉ sửa import path nếu typecheck báo lỗi; không đổi nội dung.

Làm:
1. src/core/types.ts — đúng type ở §5 (SaveGame, Pig, Order, Transaction, BreedingRecord...). Giữ Pig.cosmetics (luôn rỗng, DECISIONS C3).
2. Các config còn lại theo §6: items, balance (bảng §6.4; áp DECISIONS C1 cho ORDER_MAX_ACTIVE), breedingMatrix (§6.5), levels, derived care budget (§6.2: tính từ growthSec, không hard-code), breed→art mapping (§6.6).
3. src/core/rng.ts (Rng interface, mulberry32, seeded rng cho test, default rng chỉ được tạo ngoài core), src/core/clock.ts (Clock interface + fake clock cho test), src/core/events.ts (GameEvent types).
4. Test: mọi entry breedingMatrix cộng = 100 và A+B ≡ B+A; care budget đúng công thức §6.2 cho từng breed; mulberry32 tất định (golden 3 giá trị đầu với seed cố định); mọi key lỗi trong errors.ts có chuỗi trong vi.ts.

XONG KHI: check xanh, commit, checkpoint, tag p02. DỪNG.
```

### S03 — Engine: advancePig & derived values

```text
PHASE S03 — ENGINE advancePig. Theo CLAUDE.md. Vùng rủi ro cao nhất — ưu tiên đúng hơn nhanh.

Đọc spec: §5.4 dòng 308-322, §6.2 dòng 344-357, §7.1-7.2 dòng 509-577, §14.1 dòng 898-918. Dùng type/config đã có ở src/core.

Làm:
1. src/core/engine/advancePig.ts — piecewise đúng như thân hàm §7.2. Sickness dùng mô hình mũ memoryless (lambda = -ln(1-p)/period), KHÔNG roll-per-tick. Starving nhân hazard đúng spec.
2. Derived (không lưu): happiness, growthStage, level, sellPrice (hệ số happiness), freeSlots — theo §5.4.
3. Test đủ 12 golden value §14.1, mỗi dòng bảng là một test case riêng có tên rõ. Test thống kê: ghi rõ tolerance và số lần chạy, dùng seed cố định. Thêm test split invariance với nhiều cặp (a,b).

KHÔNG làm trough ở phase này (golden "trough stocked with 10" đánh dấu test.todo, để S04A).
Nếu một golden value fail: tìm lỗi trong code, KHÔNG sửa số mong đợi. Fail mà nghi spec sai → dừng, báo tôi.

XONG KHI: 11/12 golden pass (+1 todo), check xanh, commit, checkpoint (ghi bảng golden → kết quả), tag p03. DỪNG.
```

### S04A — Engine: resolveTrough

```text
PHASE S04A — ENGINE resolveTrough. Theo CLAUDE.md. Spec gọi đây là vùng dễ hỏng nhất.

Đọc spec: §7.3 dòng 578-601, §14.2 dòng 920-926; grep "TROUGH" trong src/core/config để lấy hằng số. Đọc src/core/engine/advancePig.ts (chỉ phần signature + phần dùng hunger).

Làm:
1. src/core/engine/trough.ts — resolveTrough closed-form như pseudo-code §7.3. Phân thức ăn theo slotIndex tăng dần, tất định. Food không bao giờ âm. Áp DECISIONS Q4 (xấp xỉ có chủ ý, không "sửa").
2. Helper gọi resolveTrough RỒI advancePig cho một window (thứ tự bắt buộc).
3. Test §14.2 trừ mục idempotence advanceWorld (để S04B). Bật lại golden "trough stocked with 10" của §14.1 (progress 100, food 4).
4. Thêm 1 dòng vào DECISIONS/README-notes: Q4 approximation.

XONG KHI: 12/12 golden §14.1 + test §14.2 liên quan pass, check xanh, commit, checkpoint, tag p04a. DỪNG.
```

### S04B — Engine: advanceWorld & events

```text
PHASE S04B — ENGINE advanceWorld + GameEvent. Theo CLAUDE.md.

Đọc spec: §7.4 dòng 602-617, §9.5 dòng 779-785, §14.2 dòng 920-926. Đọc src/core/events.ts, src/core/engine/trough.ts (signature).

Làm:
1. src/core/engine/advanceWorld.ts — chạy toàn bộ heo qua trough → advancePig, cập nhật lastTickedAt, trả {state, events}. Chừa hook rõ ràng (hàm rỗng có comment) cho birth (S10) và orders (S11) đúng vị trí thứ tự theo §7.4.
2. Event đủ để dựng away summary §9.5: máng cạn lúc nào, heo nào ngừng lớn bao lâu, heo bệnh, heo trưởng thành.
3. Test: advanceWorld 2 lần cùng now chỉ tiêu food 1 lần; offline 3 ngày máng đầy (food không âm, growth cap 100); now < lastTickedAt; event "trough empty" có thời điểm đúng.

XONG KHI: check xanh, commit, checkpoint, tag p04b. DỪNG.
```

### S05 — Save & persistence

```text
PHASE S05 — SAVE & PERSISTENCE. Theo CLAUDE.md.

Đọc spec: §5.1 dòng 200-242, §5.5 dòng 323-328, §9.1-9.4 dòng 755-778, §14.6 dòng 937-938; grep "INITIAL_GOLD\|starter" trong spec để lấy starter state (D7).

Làm trong src/core/save/:
1. schema.ts — zod cho SaveGame + mọi invariant §5.5 (áp DECISIONS C1).
2. migrate.ts — chuỗi vN→vN+1. v1→v2 thêm trough, orders, collection, player.ownedSkins, settings.reduceMotion; set skinId/cosmetics cho heo cũ từ breed default. Tự dựng fixture save v1 trong tests/fixtures (KHÔNG đọc archive/ — suy shape v1 = v2 trừ các field trên). schemaVersion lớn hơn → SAVE_TOO_NEW.
3. newGame.ts — starter state + transaction INITIAL_GOLD.
4. storage.ts — IndexedDB (idb) primary + localStorage mirror + backup key. Chuỗi đọc: primary → mirror → backup → trạng thái recovery; KHÔNG BAO GIỜ xoá âm thầm.
5. exportImport.ts — export tên un-in-save-YYYYMMDD-HHmm.json (ngày truyền vào, không tự gọi Date); import validate, lỗi thì không đụng save hiện tại.
6. Test §14.6 (dùng fake-indexeddb). Fuzz invariant để dành S19.

XONG KHI: check xanh, commit, checkpoint (ghi tên key storage + chuỗi fallback), tag p05. DỪNG.
```

### S06A — Actions: kinh tế

```text
PHASE S06A — ACTIONS KINH TẾ. Theo CLAUDE.md.

Đọc spec: §8 phần đầu dòng 618-640, §8.1 dòng 641-646, §8.7 dòng 670-675, §8.10 dòng 698-700, §8.12 dòng 706-708, §8.16 dòng 748-754, §14.3 dòng 928-929.

Làm trong src/core/actions/:
1. Helper duy nhất thay đổi vàng (ghi Transaction) + addXP. Không chỗ nào khác được sửa gold.
2. buyPig (gender, slot thấp nhất còn trống, tên theo DECISIONS Q8), sellPig (hệ số happiness), buyItem, renamePig.
3. Kiểu trả về thống nhất: {ok:true,state,events} | {ok:false,error} — lỗi thì state không đổi.
4. Test phần §14.3 tương ứng + test "gold không bao giờ đổi mà không có transaction".

XONG KHI: check xanh, commit, checkpoint, tag p06a. DỪNG.
```

### S06B — Actions: chăm sóc

```text
PHASE S06B — ACTIONS CHĂM SÓC. Theo CLAUDE.md.

Đọc spec: §8.2-8.6 dòng 647-669, §14.3 dòng 928-929. Đọc helper gold/XP và kiểu kết quả đã có ở src/core/actions (S06A) để tái sử dụng.

Làm: feedPig, cleanPig, cleanAll, treatPig, fillTrough (từ kho và từ vàng; quá capacity → TROUGH_FULL, không đổi gì). Đúng luật XP chống spam (feed ≤80, clean ≤70).
Test đủ phần §14.3 còn lại.

XONG KHI: check xanh, commit, checkpoint, tag p06b. DỪNG.
```

### S07 — gameStore

```text
PHASE S07 — GAMESTORE. Theo CLAUDE.md.

Đọc spec: §4 data flow dòng 147-155, §7.1 dòng 513-516, §9.1-9.2 dòng 757-769. Đọc signature của advanceWorld, actions, storage.

Làm src/store/gameStore.ts:
1. load (storage + migrate, hoặc newGame) → dispatch(action) = advanceWorld(now) → action → persist → notify subscribers + phát events.
2. Real clock + default rng chỉ tạo ở đây. Một interval toàn cục (không timer per-pig). visibilitychange: tick khi quay lại.
3. BroadcastChannel: tab khác đang mở → báo multi-tab (event), không ghi đè save của nhau.
4. Test với fake clock + fake-indexeddb: dispatch persist được, reload giữ state, lỗi action không persist.

XONG KHI: check xanh, commit, checkpoint, tag p07. DỪNG.
```

### S08A — DOM UI: khung + nông trại

```text
PHASE S08A — DOM UI KHUNG. Theo CLAUDE.md. Chưa Phaser, chưa art.

Đọc spec: §10.1-10.2 dòng 786-822, §10.5 dòng 832-836. Chuỗi lấy từ src/i18n/vi.ts (grep key cần dùng, đừng đọc cả file).

Làm src/ui/ (TS thuần, không framework) + src/styles/ theo adapter §5 (SCSS; đọc references/04-styles.md của skill một lần):
1. Layout §10.1: top bar (vàng, level/XP, máng ăn food/capacity), danh sách heo dạng thẻ text (tên, breed, giai đoạn, hunger, clean, bệnh, growth %), nav các màn (màn chưa làm → placeholder "Sắp có").
2. Panel heo đang chọn §10.2 (chỉ hiển thị, chưa nút).
3. main.ts nối gameStore → render lại khi notify. Toast tối giản cho events.
Style đơn giản, dùng được ở 360px. Không text cứng ngoài vi.ts.

Kiểm: npm run dev — tôi sẽ tự nhìn. Không cần screenshot.
XONG KHI: check + build xanh, commit, checkpoint, tag p08a. DỪNG.
```

### S08B — DOM UI: hành động + cổng chơi thử

```text
PHASE S08B — DOM UI HÀNH ĐỘNG + CỔNG CHƠI THỬ. Theo CLAUDE.md.

Đọc spec: §10.2 dòng 806-822, §15 Phase 1 dòng 950. Đọc src/ui hiện có.

Làm:
1. Nút: mua heo (chọn giới tính), cho ăn, tắm, tắm tất cả, chữa, đổ máng, bán (có confirm), đổi tên.
2. Nút disable luôn kèm LÝ DO nhìn thấy được (map từ error code → vi.ts).
3. Dòng "happiness → hệ số giá" ở panel heo.
4. Chỉ cho dev: nếu URL có ?dev=1, thêm nút "tua +1h / +6h" (fake time offset ở store) để tôi thử nhanh. Không có trong build thường.

XONG KHI: check + build xanh, commit, checkpoint, tag p08b.
Rồi DỪNG và gửi tôi checklist chơi thử 5 dòng (làm gì, quan sát gì) cho 15 phút. Tôi sẽ chơi và phản hồi trước khi sang S09.
```

> **Sau khi chơi thử**, nếu cần chỉnh: dán `Phản hồi chơi thử: <ghi chú>. Chỉ chỉnh BALANCE trong src/core/config hoặc UI, không đổi luật. Nếu golden value đổi theo thì báo tôi trước.`

### S09 — Shop, Kho, Level, Slot, Lịch sử

```text
PHASE S09 — SHOP / KHO / LEVEL / SLOT / LỊCH SỬ. Theo CLAUDE.md.

Đọc spec: §8.10-8.11 dòng 698-705, §8.16 dòng 748-754, §15 Phase 2 dòng 952. DECISIONS Q7 cho màn Kho + Lịch sử.

Làm:
1. Action buySlot (gate level + vàng, cap 12) + test.
2. Màn Shop (heo, item), Kho, Lịch sử (≤200 transaction, mới nhất trước, vàng có dấu), XP bar + toast level-up.
3. Đổ máng từ kho hoặc bằng vàng trên UI.

XONG KHI: check + build xanh, commit, checkpoint, tag p09. DỪNG.
```

### S10 — Breeding & birth

```text
PHASE S10 — BREEDING & BIRTH. Theo CLAUDE.md.

Đọc spec: §5.3 dòng 272-307, §6.5 dòng 436-475, §8.8-8.9 dòng 676-697, §14.4 dòng 931-932. Đọc advanceWorld.ts (hook birth).

Làm:
1. breedPigs: đủ validation, phí, con được CHỐT lúc phối (rng lúc phối), giữ slot (D8), pregnancySec theo breed (D22). MYTHICAL không lai được.
2. Birth trong advanceWorld tại hook đã chừa: idempotent, growth của con tính từ endsAt.
3. UI: chọn cặp, hiện xác suất kết quả, đếm ngược mang thai.
4. Test đủ §14.4. Chạy lại toàn bộ test engine (S03/S04) phải xanh.

XONG KHI: check + build xanh, commit, checkpoint, tag p10. DỪNG.
```

### S11 — NPC orders

```text
PHASE S11 — NPC ORDERS. Theo CLAUDE.md.

Đọc spec: §5.3 dòng 272-307, §8.14 dòng 714-744, §14.5 dòng 934-935, grep "ORDER_" trong src/core/config. Áp DECISIONS C1, Q1, Q2, Q3.

Làm:
1. src/core/engine/orders.ts: windowIndex = floor(now/ORDER_WINDOW_MS), hash theo Q3, mulberry32, breed phân bố đều trên breed đã khám phá (Q1). Đơn đã có trong state không bao giờ sinh lại (Q2). Hết hạn → ORDER_EXPIRED.
2. Gọi trong advanceWorld tại hook đã chừa. fulfillOrder (sai breed/giới tính/happiness → lỗi; không nhận 2 lần).
3. Màn Đơn hàng.
4. Test §14.5 phần orders + 3 golden value của hash + test Q2.

XONG KHI: check + build xanh, commit, checkpoint, tag p11. DỪNG.
```

### S12 — Collection & skins

```text
PHASE S12 — COLLECTION & SKINS. Theo CLAUDE.md.

Đọc spec: §5.2 dòng 243-271, §6.6 dòng 476-508, §8.13 dòng 709-713, §8.15 dòng 745-747, §14.5 dòng 934-935, §15 Phase 3 dòng 954. Áp DECISIONS C2, C3.

Làm:
1. discoveredBreeds/discoveredSkins + bonus khám phá đúng 1 lần (khi mua, sinh, nhận).
2. buySkin, equipSkin. Core nhận SkinRegistry inject (tạm dựng từ src/core/config/skins.ts; S13 sẽ thay bằng manifest). Skin KHÔNG đổi bất kỳ con số nào — có test chứng minh sellPrice/growth giống hệt khi đổi skin.
3. Màn Bộ sưu tập + mục skin trong Shop.
4. Test §14.5 phần collection.

XONG KHI: check + build xanh, commit, checkpoint, tag p12.
DỪNG và nhắc tôi chơi thử 30 phút (game đã đủ hệ thống).
```

### S19 — Economy sim & fuzz (chạy trước phần đồ hoạ)

```text
PHASE S19 — ECONOMY SIM + FUZZ INVARIANT. Theo CLAUDE.md.

Đọc spec: §6.4 dòng 365-435 (bảng sanity), §14.7 dòng 940-941, §5.5 dòng 323-328, §18 dòng 992-1005, Phụ lục C mục Balance (grep -n -i "balance" trong dòng 1464-1497).

Làm:
1. scripts/simulate-economy.ts (chạy bằng tsx, chỉ import src/core): in bảng theo §14.7. Exit 1 nếu vàng/giờ ở happiness 100 < 2× ở happiness 0. Script npm "sim:economy".
2. Kiểm số sanity §6.4 (PINK cần đúng 6 thức ăn, v.v.) thành test.
3. tests/unit/invariants.fuzz.test.ts: 1000 action ngẫu nhiên (seed cố định) xen kẽ tua thời gian, sau mỗi bước schema §5.5 phải pass.
4. Thử: đặt SELL_MULT_SPAN=0 → script phải fail; rồi trả lại.

XONG KHI: sim:economy exit 0, check xanh, commit, checkpoint (dán bảng output vào body của commit), tag p19. Nếu bảng cho thấy Q4/Q5 của §18 nên chỉnh, chỉ ĐỀ XUẤT, không tự sửa. DỪNG.
```

### S13 — Asset manifest & placeholder

```text
PHASE S13 — ASSET MANIFEST + WAVE 0. Theo CLAUDE.md.

Đọc: asset/ASSET_PRODUCTION_STANDARD_v1.md dòng 154-227 (§4 format, §5 anchor) và 254-333 (§7 naming + manifest + thư mục); spec §11 dòng 837-863. Áp DECISIONS C2, Q5.

Làm:
1. public/assets/manifest/assets.json đúng schema §7.2 cho 17 skin MVP + fx + trough + ui tối thiểu.
2. src/core/assets/manifestSchema.ts (zod). src/store/assetRegistry.ts: fetch manifest, validate, dựng SkinRegistry inject vào core (thay bản tạm của S12).
3. scripts/make-placeholders.ts (không thêm dependency nặng; dùng pngjs hoặc canvas thuần nếu cần, ghi lý do): PNG 512×512 hình chữ nhật bo góc màu khác nhau, chân ở 82% cao, cho mọi skin trong manifest + 8 fx_* + 3 trạng thái máng. Có _sleep chỉ cho 4 skin để thử fallback Q5.
4. Test: manifest pass zod; mọi skinId trong config có row; mọi path trong manifest tồn tại trên đĩa; MVP rows khớp giá/rarity với config.
5. `grep -rn "\.png" src/` không ra kết quả nào.

XONG KHI: check + build xanh, commit, checkpoint (ghi 3 bước "thêm skin mới không đụng TS"), tag p13. DỪNG.
```

### S14A — Phaser: scene & sprite

```text
PHASE S14A — PHASER SCENE + PIG SPRITE. Theo CLAUDE.md.

Đọc spec: §11 dòng 837-863; art standard dòng 49-106 (§2 hướng sprite). Đọc src/store/assetRegistry.ts, gameStore (API subscribe).

Làm src/game/:
1. config/phaser.ts, scenes BootScene, PreloadScene (nạp texture theo manifest), MainFarmScene. Canvas co theo container, không tràn ngang. Phaser chỉ vẽ nông trại; menu vẫn là DOM.
2. prefabs/PigSprite.ts: texture từ skinId → manifest; scale theo growth; Y-sort (depth = y).
3. Thay danh sách thẻ heo bằng canvas trên màn Farm (giữ panel DOM). src/game chỉ đọc state qua store.
4. Logic map state → thông số hiển thị (scale, depth, texture key) viết thành hàm thuần + unit test, để không phải debug bằng mắt.

Không tween/particle. Không cần screenshot; tôi sẽ tự xem npm run dev.
XONG KHI: check + build xanh, commit, checkpoint, tag p14a. DỪNG.
```

### S14B — Phaser: máng, anchor, chọn heo

```text
PHASE S14B — PHASER MÁNG + ANCHOR + CLICK. Theo CLAUDE.md.

Đọc art standard dòng 81-93 (§2.3) và 204-227 (§5 anchor). Đọc src/game hiện có.

Làm:
1. Sprite máng 3 trạng thái theo food (0 / ≤ capacity/2 / > capacity/2).
2. Đọc anchor (*.anchors.json theo manifest; thiếu thì mặc định), hàm mirror x' = 1 − x khi flipX — hàm thuần + test.
3. Click heo → chọn → panel DOM cập nhật; click nền → bỏ chọn. Touch dùng được.

XONG KHI: check + build xanh, commit, checkpoint, tag p14b. DỪNG.
```

### S15A — Phaser: state động

```text
PHASE S15A — VISUAL STATE: idle / walk / eat / clean / happy + wandering. Theo CLAUDE.md.

Đọc spec §11 dòng 837-863; art standard dòng 94-153 (§2.4, §3). Đọc src/game/prefabs/PigSprite.ts.

Làm:
1. src/game/state/pigVisualState.ts: hàm thuần (pig, now, ui events) → visual state theo bảng §11, có test ưu tiên state.
2. idle thở (tween scale), walk squash/stretch + quay đầu scaleX 1→0→-1 trong 120ms, eat xoay ~8° về máng + fx_crumb, clean fx_bubble, happy nhảy + fx_heart. Particle dùng chung trong src/game/fx/.
3. Wandering: chỉ thị giác, trong biên nông trại, dừng khi đang tương tác, KHÔNG ghi gì vào save.

XONG KHI: check + build xanh, commit, checkpoint, tag p15a. DỪNG.
```

### S15B — Phaser: overlay + reduceMotion

```text
PHASE S15B — VISUAL STATE: sleep / sick / pregnant + reduceMotion. Theo CLAUDE.md.

Đọc spec §11 dòng 837-863; DECISIONS Q5. Đọc pigVisualState.ts và src/game/fx/.

Làm:
1. sleep: dùng frame _sleep nếu manifest có; thiếu → idle + fx_zzz (Q5) — có test cho nhánh fallback.
2. sick: tint + fx_sick ở anchor fx_above; pregnant: fx_pregnant ở fx_above. Overlay đúng vị trí khi heo quay trái (dùng hàm mirror S14B).
3. settings.reduceMotion (khởi tạo từ prefers-reduced-motion): tắt wandering, particle, tween không thiết yếu.
4. Test: wandering/visual không làm đổi updatedAt của save khi không thao tác.

XONG KHI: check + build xanh, commit, checkpoint (bảng 8 state → cách render), tag p15b. DỪNG.
```

### S16 — UX: responsive, tutorial, away summary

```text
PHASE S16 — UX. Theo CLAUDE.md.

Đọc spec: §9.4-9.5 dòng 774-785, §10.3-10.4 dòng 823-831. Đọc src/ui hiện có (chỉ file cần sửa).

Làm:
1. Responsive 360px → ≥1280px: bottom nav mobile / side panel desktop (≥1024px), touch ≥44px, không hover-only, không cuộn ngang, modal thân thiện mobile.
2. Tutorial 5 bước bỏ qua được (§10.3), lưu settings.tutorialDone.
3. Modal "Trong lúc bạn vắng mặt" khi vắng ≥10 phút, dựng từ events của advanceWorld; dòng máng ăn (giờ cạn + số heo ngừng lớn bao lâu) đứng đầu.
4. Màn Cài đặt: nhạc/sfx/reduceMotion, export/import, cảnh báo lưu trữ trình duyệt §9.4, nhắc export nếu >7 ngày (1 lần/session). Màn recovery khi save hỏng, thông báo multi-tab.
5. Trạng thái loading/rỗng/lỗi cho mọi màn; rà mọi nút disable có lý do.

XONG KHI: check + build xanh, commit, checkpoint, tag p16. Gửi tôi 4 dòng cách tự kiểm ở 360×640 và 1440×900. DỪNG.
```

### S17 — Audio + PWA/offline

```text
PHASE S17 — AUDIO + PWA/OFFLINE. Theo CLAUDE.md. Làm phần A xong, commit, rồi mới làm phần B.

Đọc spec: §12 dòng 864-886, §13 dòng 887-897, §9.4 dòng 774-778.

A — AUDIO:
1. src/game/audio/AudioManager.ts với ĐÚNG 12 key §12 (khớp từng chữ). Nhạc chỉ bắt đầu sau user gesture đầu tiên. Nối events → âm thanh theo §12. Toggle musicOn/sfxOn lưu vào save.
2. Path audio qua manifest. Thiếu file → im lặng, không lỗi console. Chưa cần file audio thật; để mục credit trống trong README.

B — PWA:
3. Cài vite-plugin-pwa. Manifest: name, short_name, display standalone, theme color, icon 192/512 (sinh icon placeholder bằng script đã có). Precache toàn bộ asset build.
4. Update flow: có bản mới → prompt "Có bản mới — tải lại", không tự reload. Gợi ý "Thêm vào màn hình chính". Gọi navigator.storage.persist().
5. Rà: không còn request ra host ngoài (font CDN, analytics...).

XONG KHI: check + build xanh, `npm run preview` chạy, commit, checkpoint, tag p17. Gửi tôi 3 dòng cách kiểm offline bằng DevTools. DỪNG.
```

### S20 — QA Phụ lục C, README, release

```text
PHASE S20 — QA + README + RELEASE. Theo CLAUDE.md.

Đọc spec: Phụ lục C dòng 1464-1497, §15 dòng 948-959, §17 dòng 986-991, §14.8 dòng 943-944. Không đọc lại code hàng loạt: kiểm từng dòng checklist bằng lệnh (grep, chạy test cụ thể) và trích bằng chứng ngắn.

Làm:
1. Bảng Phụ lục C: mỗi dòng PASS/FAIL + bằng chứng 1 dòng. Đối chiếu 4 nhóm §15.
2. Sửa FAIL nhỏ ngay. FAIL lớn → Known issues trong PROJECT_STATUS.md, liệt kê trong DONE, không tự sửa lớn.
3. Cài @playwright/test, tests/e2e/smoke.spec.ts theo §14.8 (chạy trên build preview). Script "test:e2e".
4. README.md của game đủ các mục §17, gồm "Implementation assumptions" (gom từ DECISIONS.md) và known limitations. Link tới DESIGN_README.md.
5. Release: npm run build, kiểm kích thước bundle, sim:economy exit 0, check xanh, e2e xanh. README thêm mục "Bàn giao": backlog (§20 + cosmetics C3), vị trí từng hệ thống, cách nạp art thật. PROJECT_STATUS = DONE. git tag v1.0.0.

XONG KHI: tất cả lệnh trên xanh. DONE kèm: dòng Phụ lục C FAIL (nếu có) + số test.
```

### ART — Nạp art thật (wave 1 / wave 2)

> Sinh ảnh làm **ngoài** Claude Code (theo `asset/AI_ASSET_GENERATION_PACK.md` §0–§7, dùng img2img từ `style_reference_pigs.png`). Thả ảnh thô vào `art_inbox/`, rồi dán prompt dưới. Chạy lại mỗi lô.

```text
PHASE ART — HẬU KỲ + ĐĂNG KÝ ASSET. Theo CLAUDE.md.

Đọc: asset/AI_ASSET_GENERATION_PACK.md dòng 370-449 (§8 hậu kỳ, §9 đăng ký); art standard dòng 154-203 (§4 format). Không xem từng ảnh bằng mắt trừ khi script báo lỗi.

Làm:
1. (Lần đầu) scripts/process-art.ts: với mỗi ảnh trong art_inbox/: kiểm/tách nền trong suốt, crop + resize 512×512, canh đường chân 82%, đặt tên đúng §7.1, ghi vào public/assets/... Báo cáo ảnh nào không đạt checklist §8.3 (nền không trong, sai kích thước...).
2. Thêm/cập nhật row trong assets.json. Không sửa file .ts nào ngoài script.
3. Test manifest (S13) phải xanh.

XONG KHI: check + build xanh, commit `feat(art): <lô>`. Liệt kê ảnh đã nhận / bị loại. DỪNG.
```

---

## 4. Prompt tiện ích

### CONTINUE — sau reset usage, bị ngắt giữa phase, hoặc sang task tiếp

```text
/spec-to-source tiếp
```
Skill tự đọc `PROJECT_STATUS.md`, kiểm `git diff`, sửa nền đỏ nếu có và làm tiếp — không hỏi lại.

### WIP — khi gần hết usage

```text
Sắp hết usage: làm theo SKILL.md §5 (về trạng thái xanh, ghi state, commit wip).
```

### FIX — khi Claude làm sai

```text
Dừng. Lỗi: <mô tả>. Kiểm xem nguyên nhân là (a) hiểu sai spec, (b) sai kiến trúc, hay (c) bug cục bộ — trả lời 2 dòng trước khi sửa.
(a) trích đúng dòng spec, sửa, ghi DECISIONS.md. (b) `git reset --hard <tag phase trước>` (BLOCKED nếu làm mất việc chưa commit). (c) sửa + thêm test bắt được bug.
Sau đó npm run check xanh toàn bộ. Ghi 1 dòng vào Known issues trong PROJECT_STATUS.md. Báo DONE.
```

### SPLIT — khi một phase quá lớn so với một cửa sổ usage

```text
Phase hiện tại quá lớn. Chia phần còn lại thành 2 nửa A/B có điểm dừng xanh. Làm xong A, commit, checkpoint ghi rõ B gồm gì, tag pXXa. DỪNG.
```

---

## 5. Quy tắc giữ token (cho bạn, người vận hành)

- Mỗi phase **`/clear`** trước khi dán prompt mới. Đừng chạy 2 phase trong một session dù còn usage.
- Đừng dán log dài hay ảnh vào chat; bảo Claude tự chạy lệnh với `| tail`.
- Đừng hỏi "giải thích code" giữa phase; xem `git log` / `PROJECT_STATUS.md`.
- Phase UI/Phaser: **bạn** mở `npm run dev` và nhìn, rồi mô tả lỗi bằng 1–2 câu. Rẻ hơn rất nhiều so với để Claude chụp và phân tích screenshot.
- Thấy Claude đọc file ngoài danh sách đã chỉ định hoặc sửa file ngoài phạm vi → ngắt (Esc) và nhắc "theo CLAUDE.md".
- Sau S08B và S12 **bắt buộc chơi thử**. Phát hiện game chưa vui ở đây rẻ hơn mọi lúc khác.
