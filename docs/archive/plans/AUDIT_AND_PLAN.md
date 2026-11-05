# AUDIT AND PLAN — GĐ1: Nền móng thế giới

**Ngày:** 2026-10-05 · **Nhánh:** `phase-01-world-foundation` · **Trạng thái:** kế hoạch đã thực hiện xong bước 1–9 (xem `PROGRESS.md` 2026-10-09 cho chênh lệch so với kế hoạch)

Điểm xuất phát: tag `sobi-farm-final` (`npm run check` xanh: 57 file test, 667 test).

---

## 0. Tóm tắt hiện trạng Sobi Farm

| Mục | Hiện trạng |
|---|---|
| Tech stack | TypeScript 6 · Vite 8 · Phaser 3.90 (canvas nông trại) · DOM thuần + SCSS (UI) · zod 4 (validate save/manifest) · Electron 44 + electron-builder (NSIS) · Vitest + Playwright |
| Chạy | `npm run dev` (trình duyệt, save qua API dev của Vite), `npm run dev:desktop` (Electron), `npm run admin` (dashboard, cổng 5175, chỉ dev), `npm run dist:win` (installer) |
| Cấu trúc | `src/core` (thuần: `config/` 30 file số liệu + nội dung, `engine/` 30 file luật, `actions/` 21 action, `save/`, `assets/`), `src/store` (gameStore: vòng lặp 1 giây, autosave 30 giây), `src/game` (Phaser: scenes, prefabs, fx, AI heo), `src/ui` (màn hình DOM, view-model), `src/platform` (web/desktop adapter), `src/i18n/vi.ts` (510 dòng chuỗi), `electron/` (main, preload, saveFiles), `tools/admin` + `scripts/admin` (dashboard), `scripts/` (art, asset, sim kinh tế) |
| Model heo | `Pig` phẳng trong `SaveGame.pigs`: breed, gender, growthProgress 0–100, hunger, cleanliness, isSick, pregnancy, slotIndex, generation, parents, lịch sử bệnh (NH-1). Giai đoạn chỉ có BABY/YOUNG/ADULT (suy ra, không lưu). 69 giống (`speciesTable.ts`) × 5 rarity; chỉ số theo bậc rarity (`RARITY_TIER`) |
| Mô phỏng | `advanceWorld(state, now, rng)` dạng **giải tích** (closed-form, không chia bước): máng → heo → sinh → đơn hàng → quà → thành tích. Cùng một hàm cho online và bù offline (đã đúng tinh thần "một công thức") |
| AI | `game/state/pigBrain.ts` (state machine) + `core/engine/pigLife.ts` (nhu cầu, tính cách, ngủ) + `game/fx/PigLife.ts` (một tick trung tâm 500 ms). Chỉ chạy ở cảnh đang xem |
| Lai giống | 4 lớp: bảng cặp admin → công thức đặc biệt (MUTATIONS) → di truyền ngẫu nhiên theo rarity → gene pool (family + trait). Có vườn ươm (nursery), phả hệ, thế hệ |
| Túi đồ | `inventory: Record<'FOOD_BASIC' \| 'MEDICINE_COMMON', number>`, không giới hạn ô |
| Tiền | Một loại `player.gold`; mọi thay đổi qua `engine/gold.ts changeGold()` ghi `Transaction` (tối đa 200) — **đã đúng luật "1 helper"** |
| Shop | Heo theo level + giá; sản phẩm (`products.ts`, admin sửa); trang trí (`decor.ts`); ô chuồng (`SLOT_UNLOCKS`) |
| Save | `schemaVersion: 7`, migration v1→v7 tuần tự + zod + bất biến chéo. Desktop: `%APPDATA%\Un In Homemade\saves\save.json`, ghi file tạm → fsync → rename, giữ 10 backup cách nhau ≥15 phút, đọc lần lượt save → backup, file hỏng đổi tên `save.corrupt-*`, phát hiện admin ghi đè (AM-1). Web: IndexedDB + mirror + backup localStorage |
| Asset | `public/assets/manifest/assets.json` (v3: pigs, fx, props, buildings, environment, ui, audio **và layout**), zod schema, registry tra theo id, `npm run assets:check` |
| Layout | `manifest.layout`: designSize 1600×900, walkArea, placements (layer, action, signed) — admin sửa |
| Admin | Vite dev server + API (`scripts/admin/api.ts`): sửa giống heo (ghi `speciesTable.ts` + `ids.ts` + manifest), sản phẩm, bảng lai, gene pool, ngày/đêm, mùa/FX, layout, xem/sửa save người chơi, nhập art. **Ghi thẳng vào file `.ts` giữa marker `// <admin:NAME>`** |
| Đóng gói | Electron + NSIS, `app://` custom protocol (không HTTP server), single-instance lock, admin không vào build (entry riêng `admin.html` + `vite.admin.config.ts`) |
| Guard | `npm run guard` gọi `.claude/skills/spec-to-source/scripts/check-architecture.mjs` + `.claude/spec-to-source.config.mjs` (lớp config → domain → platform/store → ui/game; cấm `Date.now`/`Math.random`/DOM trong core; file ≤300 dòng). ESLint cũng chặn import sai trong core |

Nhận xét chung: nền Sobi Farm **sạch và kỷ luật** (core thuần, rng/now inject, 1 helper tiền, migration, ghi atomic, event → FeedbackDirector). Việc của GĐ1 chủ yếu là **tách và đổi chỗ**, không phải viết lại.

---

## a) Bản đồ code hiện có → vị trí mới

Quy ước: **B1** = chuyển ở bước 1 (chỉ đổi đường dẫn), **B3/B4/B5…** = tách/tổng quát hóa ở bước đó. Thứ gì chung cho nhiều Area nhưng hiện viết riêng cho heo thì bước 1 đặt tạm vào `areas/farm/logic`, bước 5 mới tách sang `systems/` kèm tổng quát hóa (để bước 1 không đổi logic).

### src/core
| Hiện tại | Đi đến | Bước |
|---|---|---|
| `rng.ts`, `clock.ts` | `core/rng`, `core/clock` (giữ) | — |
| `events.ts` | `core/events` (bus + kiểu chuẩn §7) · sự kiện `PIG_*` → `areas/farm/logic/events.ts` | B4 |
| `types.ts` (SaveGame, Pig, Order…) | `core/save/types.ts` (world) · `systems/creature/types.ts` · `areas/farm/logic/types.ts` | B2, B5 |
| `save/*` (schema, migrate, port, newGame, exportImport) | `core/save/*` (mở rộng: v8, backup, validation từng Area) | B2 |
| `assets/*` (manifestSchema, registry, anchors) | `core/assets/*`; phần tra texture heo (`BREEDS`) → `areas/farm/scene` | B4 |
| `engine/gold.ts` | `core/economy` (Coins/Gems/Event Tokens, `changeCurrency`) | B4 |
| `engine/xp.ts`, `config/levels.ts` | `core/progression` (level theo Area) | B4 |
| `engine/collection.ts` | `core/collection` (khung; Codex đầy đủ ở GĐ6) | B4 |
| `engine/progress.ts`, `config/achievements.ts`, `config/daily.ts`, `actions/claim*` | tạm `areas/farm/logic` (metric toàn heo); chuyển `core/goals` ở GĐ6 | B1 |
| `engine/advanceWorld.ts` | `areas/farm/logic/simulate.ts` (hook `simulate`) | B1 → B6 |
| `engine/advancePig.ts`, `pigHealth.ts`, `derived.ts`, `config/care.ts` | `areas/farm/logic` → `systems/creature` + `systems/health` | B1 → B5 |
| `engine/happiness.ts`, `pricing.ts` | `areas/farm/logic` → `systems/valuation` (+ `systems/quality` mới) | B1 → B5 |
| `engine/pigLife.ts`, `config/pigLife.ts` | `areas/farm/logic` → `systems/behavior-ai` (luật) + `content/farm/behavior.json` | B1 → B5 |
| `engine/breeding*.ts`, `breedMap.ts`, `genePool.ts` | `areas/farm/logic/breeding/` (GĐ7 mới tách `systems/breeding`) | B1 |
| `engine/trough.ts`, `orders.ts`, `gifts.ts`, `relief.ts`, `decor.ts`, `pigNames.ts`, `shopProducts.ts` | `areas/farm/logic` | B1 |
| `engine/dayNight.ts`, `season.ts`, `seasonFx.ts` | `core/clock` (buổi, mùa) + `areas/farm/scene` (hình) | B1 |
| `actions/*` (21 action) | `areas/farm/logic/actions/*`; `runAction` → `core` (pipeline chung), `setSetting` → `app` | B1, B6 |
| `config/*` số liệu & nội dung | `content/**.json` + schema (xem bảng content dưới) | B3 |
| `config/ids.ts`, `errors.ts`, `save.ts` | id → suy từ content; lỗi chung → `core/errors`, lỗi heo → farm; `save.ts` → `core/save/config` | B2, B3 |
| `config/farmView.ts`, `feedback.ts`, `loadingScreen.ts`, `assetIds.ts` | `areas/farm/scene/config` (số trình bày, không phải balance) · `assetIds` chung → `core/assets` | B1 |

### src/store, src/main.ts → `src/app`
| Hiện tại | Đi đến | Bước |
|---|---|---|
| `store/gameStore.ts`, `storeDeps.ts`, `runtime.ts` | `app/store/*` (store gọi `area-registry` thay vì `advanceWorld` trực tiếp) | B1 → B6 |
| `main.ts` | `app/main.ts` (composition root) | B1 |

### src/game (Phaser) → `areas/farm/scene` + `app`
| Hiện tại | Đi đến |
|---|---|
| `scenes/*`, `prefabs/*`, `fx/*`, `view/*`, `state/*` (pigBrain, wander, sleepCycle), `farmView.ts` | `areas/farm/scene/*` (B1); `pigBrain` → `systems/behavior-ai` (B5) |
| `feedback/*` (FeedbackDirector, bảng feedback, toast) | `app/feedback` (dùng chung mọi Area; bảng riêng mỗi Area đăng ký vào) |
| `audio/*`, `config/phaser.ts` | `app/audio`, `app/phaser` |
| `prefabs/LoadingScreen*.ts` | `app/loading` (giữ hình nông trại tới GĐ3) |

### src/ui → `ui` (chung) + `areas/farm/ui`
| Hiện tại | Đi đến |
|---|---|
| `components/*` (dialog, popup, toast, topBar, icon…), `dom.ts`, `app.ts`, `session.ts`, `settings*`, `screens/settingsScreen`, `statusScreen`, `historyScreen`, `devTools`, `devGallery`, `styles/core` | `ui/` (giữ) |
| `breedDialog`, `breedVm`, `actionsVm`, `ordersVm`, `collectionVm`, `awayVm`, `progressVm`, `tutorialVm`, `viewModel`, `components/pigPanel`, `screens/{farm,shop,inventory*,orders,collection,achievements}Screen`, `styles/features/*` | `areas/farm/ui/*` (B1). Túi đồ/lịch sử/thành tích thành màn chung khi có Area thứ 2 |

### Khác
| Hiện tại | Đi đến |
|---|---|
| `src/platform/*` | giữ `src/platform` |
| `src/i18n/vi.ts` | `src/i18n/vi/` tách theo namespace (`common`, `farm`…) — B7 |
| `electron/*` | giữ; thêm chuyển thư mục save (B2) |
| `tools/admin`, `scripts/admin` | giữ vị trí (ARCHITECTURE §2 đã ghi); đổi từ ghi `.ts` sang ghi `content/*.json` (B8) |
| `public/assets/<loại>/` | GĐ1 **giữ nguyên đường dẫn** file ảnh (chỉ manifest tham chiếu); sắp xếp lại `public/assets/farm/` để GĐ4 cùng lúc với atlas — tránh đụng 300+ file PNG và script art |
| `.claude/skills/spec-to-source/scripts/check-architecture.mjs` | `scripts/guard/check-architecture.mjs` + `scripts/guard/config.mjs` (luật mới §3 ARCHITECTURE) — B1 |

### Dữ liệu → `content/`
| Hiện tại (`src/core/config`) | Đi đến |
|---|---|
| `speciesTable.ts` + `breeds.ts RARITY_TIER` + `speciesTraits.ts` | `content/farm/species/pig.json` (species `pig`, 69 breed, bậc rarity, trait) |
| `breedingRules.ts` (GENETICS, MUTATIONS, COMPAT), `breedingPairs.ts`, `genePool.ts` | `content/farm/breeding.json` |
| `balance.ts` (phần heo/máng/chuồng/bệnh/đơn hàng), `care.ts`, `gifts.ts`, `relief.ts`, `pigLife.ts` | `content/farm/balance.json`, `content/farm/behavior.json` |
| `balance.ts` (vốn đầu, XP, level), `levels.ts`, `rarity.ts` | `content/shared/balance.json`, `content/shared/rarity.json` |
| `items.ts` + `products.ts` | `content/shared/items.json` (định nghĩa item) + `content/shared/shop.json` (gói bán) |
| `decor.ts`, `achievements.ts`, `daily.ts`, `names.ts` | `content/farm/decor.json`, `content/shared/achievements.json`, `content/shared/daily.json`, `content/farm/names.json` |
| `dayNight.ts`, `seasons.ts`, `seasonFx*.ts` | `content/shared/daynight.json`, `content/shared/seasons.json`, `content/farm/season-fx.json` |
| `manifest.layout` | `content/farm/layout.json` (manifest chỉ còn asset) |
| — (mới) | `content/farm/area.json` (manifest Area), `content/schemas/*.ts` (zod) |

---

## b) Chỗ hard-code / gắn chặt với "heo"

**Gắn chặt cấu trúc**
1. `SaveGame` phẳng: `pigs`, `nursery`, `trough`, `orders`, `gifts`, `decor`, `breedingRecords` nằm ngang hàng `player` → không có chỗ cho Area khác.
2. `player.gold` là tiền duy nhất; `CURRENCY_VALUES = ['GOLD']`; không có Gems/Event Tokens.
3. Level người chơi (`player.xp`, 10 cấp) gate mọi thứ (shop, ô chuồng, máng) — thực chất là **Farm level**.
4. Kiểu id là union TS cứng: `BREED_ID_VALUES` (69), `ITEM_ID_VALUES` (2), `DECOR_ID_VALUES`, `STAT_ID_VALUES`, `TRANSACTION_TYPE_VALUES` (`PIG_SELL`, `TROUGH_FILL`…), `ERRORS` (`PIG_NOT_FOUND`…). Save schema dùng `z.enum` của các union này → thêm nội dung = sửa code.
5. `GameEvent` toàn `PIG_*`/`TROUGH_*`; chưa có tên chuẩn `creature.sold`, `item.added`, `currency.changed`… (ARCHITECTURE §7).
6. `collection.discoveredBreeds` chỉ cho heo; `progress.stats` toàn metric heo.
7. `core/assets/registry.ts` import `BREEDS` (core biết heo); `config/assetIds.ts` có `TROUGH_PROP_ID`, `FARM_ACTIONS`, `AUDIO_KEYS` có `pig_oink_*`.
8. `engine/orders.ts`: đơn hàng chỉ đòi giống heo. `engine/relief.ts`, `gifts.ts`: tính theo đàn heo.
9. `store/gameStore` gọi thẳng `advanceWorld` của nông trại.
10. AI (`pigBrain`, `pigLife`) đặt tên/giả định heo, máng, chuồng heo.

**Nội dung & số liệu trong code** (đi vào `content/` ở B3)
- Toàn bộ `src/core/config/*` nêu ở bảng content trên: 69 giống, bậc rarity, bảng lai, giá, XP, level, ô chuồng (20 mức giá), máng, bệnh, quà, thành tích (29), quà hằng ngày, trang trí (6), tên heo (22), ngày/đêm, mùa, FX.
- `products.ts`, `breedingRules.ts`, `breedingPairs.ts`, `genePool.ts`, `seasonFx.ts`, `dayNight.ts`, `speciesTable.ts`, `ids.ts`: dữ liệu admin ghi vào **file mã nguồn** giữa marker.
- `items.ts`: `FOOD_BASIC.hungerRestore` lấy từ `BALANCE.FOOD_HUNGER_RESTORE` — item không tự mô tả công dụng.
- Hằng số rải rác trong engine: `MIN_HAPPINESS = [0, 50, 75]`, `GENDER_CHANCE = 0.4` (`orders.ts`), `ADULT_SNAP`.

**Chữ hiển thị** (đi vào bảng chuỗi ở B7)
- UI **đã gần như sạch**: chuỗi người chơi thấy nằm ở `src/i18n/vi.ts`. Còn lại:
  - Tên nội dung trong data: `nameVi` (69 giống), `nameVi`/`descVi` (sản phẩm), `labelVi` (FX mùa), `PIG_NAME_POOL` (22 tên).
  - `src/main.ts`: chuỗi mẫu tải font `'Ủn Ỉn Cấp vàng'`.
  - Ký hiệu ghép tay trong UI (`♂/♀`, `♥`, `✕`, `⚙`, `·`) — biểu tượng, giữ trong code được, nhưng nhãn giới tính nên đi qua `vi.gender`.
  - Thông báo kiểm tra dữ liệu tiếng Việt trong `core/engine/breedingOdds.ts`, `dayNight.ts`, `seasonFx.ts` — chỉ admin thấy; chuyển vào chuỗi admin (`tools/admin/labels.ts`), không vào i18n người chơi.
  - Tên thương hiệu cũ: `vi.app.title = "Sobi Farm"`, đơn vị `"vàng"` (đổi "Coins" theo decision 003), `EXPORT_FILE_PREFIX 'sobi-farm-save-'`, `productName/shortcutName "Sobi Farm"`, `appId com.uninhomemade.game`, thư mục `Un In Homemade` (đổi tên app/installer để GĐ4; thư mục save đổi ở B2, xem d).

---

## c) Con số hiện có so với GAME_BALANCE.md

Nguyên tắc GĐ1: **chuyển nguyên số Sobi Farm vào `content/`, không đổi gameplay.** Thang thời gian và luật bệnh/chết đổi ở GĐ2 theo decision 002/003/004; số nào chỉ cần khi có tính năng mới thì áp dụng ở giai đoạn có tính năng đó.

| Thông số | Sobi Farm hiện tại | GAME_BALANCE | GĐ1 | Áp dụng khi |
|---|---|---|---|---|
| Vốn đầu | 5.000 vàng, 4 ô chuồng, 10 thức ăn + 1 thuốc | không ghi (giữ thang SF) | giữ | — |
| Heo Common mua | 500 | 500 (giữ thang SF) | giữ | — |
| Common lớn tới Adult | 2 giờ (`growthSec` 7200) | 24 giờ; Mature 48 giờ | giữ | GĐ2 |
| Giai đoạn | Baby <30% · Young · Adult | Baby/Young/Adult/Mature theo giờ | giữ 3 giai đoạn, model chừa Mature | GĐ2 |
| Đói đầy → 0 | max(2 giờ, growth × 0,5) | 12 giờ (−8/giờ) | giữ | GĐ2 |
| Sạch đầy → 0 | max(5 giờ, growth × 1) | 24 giờ (−4/giờ, + phân) | giữ | GĐ2 |
| Thức ăn | +50 đói, 25 vàng | +35 đói, 6 Coins | giữ | GĐ2 (⚠ câu hỏi 5) |
| Thuốc | 100 vàng, miễn bệnh 2 giờ | ~40 Coins (8% heo), miễn 6 giờ | giữ | GĐ2 |
| Bệnh | 5%/10 phút khi sạch <30, đói 0 ×2, tối đa 1 lần/ngày, **không chết** (D21) | kiểm tra mỗi giờ +15/+10/+5%, nguy kịch 48 giờ, chết 72 giờ | giữ; `systems/health` dựng khung có trạng thái nguy kịch/chết **tắt** | GĐ2 |
| Máng | 20 + 10/level (tối đa 120), tự ăn khi đói ≤50 | Lv1 30 / Lv2 80 / Lv3 200, mua nâng cấp; tự ăn khi <40 | giữ | GĐ2 |
| Chuồng | 4 ô → 24 ô, mua từng ô 2.000 → 700.000 | Lv1 6 / 12 / 20 / 30 con | giữ | GĐ2 (quy đổi giá) |
| Giá bán | `sellGold(rarity)` × (0,7 + 0,5 × hạnh phúc/100) | gốc × rarity × quality × cân nặng × sức khỏe × chợ | giữ công thức; `systems/valuation` dựng dạng tích các hệ số, cấu hình tái tạo đúng giá cũ | GĐ2 |
| Hệ số rarity (giá) | 1200/3000/12000/24000/50000 → ×1 / 2,5 / 10 / 20 / 41,7 | ×1 / 1,5 / 2,5 / 4 / 7 / 12 | giữ (69 giống cân theo thang này) | GĐ2 sim (⚠ câu hỏi 6) |
| Quality | không có (chỉ hạnh phúc tức thời) | 5 bậc theo tâm trạng trung bình suốt đời | `systems/quality` + bắt đầu ghi tâm trạng trung bình; **chưa ảnh hưởng giá** | GĐ2 |
| Level | 10 cấp, bảng 100…5.700 KN, một level người chơi | `100 × n^1.5` mỗi Area | giữ bảng, gán làm **Farm level** | GĐ6 |
| XP hành động | cho ăn 2, tắm 2, bán 10, lai 15, đơn 25, khám phá 30 | ăn 1, dọn phân 2, vuốt 1, xuất chuồng 20, đơn 15–40 | giữ | GĐ6 |
| Lai giống | phí 200, mang thai 1–5 giờ theo rarity, 1 con, Legendary không lai | 12 giờ, 1–2 con, nghỉ 24 giờ, cần Bond ≥1 tim | giữ | GĐ7 |
| Đơn hàng | 3 đơn/4 giờ, sống 8 giờ, tối đa 6, thưởng giá × 1,5/1,8/2,2 | 3 ô, 1 đơn/3 giờ, 1,4 × giá chợ | giữ (đơn heo của Farm) | GĐ6 (bảng đơn ở Sảnh) |
| Túi đồ | không giới hạn | 40 ô, stack 99 | `core/inventory` có ô + stack, đặt 40 × 99 (không ảnh hưởng: chỉ có 2 loại item) | — |
| Autosave | 30 giây | 60 giây | giữ 30 giây (an toàn hơn, không tốn gì) | — |
| Backup | 10 bản, cách ≥15 phút | 5 bản + 1 bản trước mỗi migration | **đổi sang 5 + bản trước migration** (yêu cầu kiến trúc, không phải gameplay) | GĐ1 |
| Quà trên trại, quà hằng ngày, hàng xóm giúp, trang trí, thành tích (vàng + KN) | có | spec không nói / thành tích thưởng Gems | **giữ** (AGENT_RULES: không xóa tính năng) | GĐ6 xem lại |

---

## d) Cấu trúc save mới (v8) và cách migrate save cũ

### Cấu trúc v8
```text
SaveGame v8
├── schemaVersion: 8
├── meta        { createdAt, updatedAt, lastSavedAt, migratedFrom?: number }
├── world       { currentArea: 'sobi_farm', unlockedAreas: ['sobi_farm'] }
├── wallet      { coins, gems: 0, eventTokens: 0 }
├── inventory   { items: Record<itemId, number> }            // core/inventory (ô tính từ stack)
├── transactions[]   { id, at, currency: 'coins'|'gems'|'eventTokens', type, amount, refId?, note? }
├── progression { areas: { sobi_farm: { xp } }, stats, claimed, daily }
├── collection  { discovered: { breed: string[] } }           // khóa theo loại, Codex mở rộng ở GĐ6
├── settings    { musicOn, sfxOn, reduceMotion, tutorialDone, lastExportAt }   // tách settings.json ở GĐ3
└── areas
    └── sobi_farm  { schemaVersion: 1, creatures: Creature[], nursery, trough, unlockedSlots,
                     orders, gifts, decor, breedingRecords }
```
- `Creature` (systems/creature): trường chung `id, species: 'pig', breed, name, gender, growthProgress, hunger, cleanliness, health { isSick, lastSickAt?, sickDay?, sickEpisodes?, recoveringUntil? }, generation, parents?, createdAt, lastTickedAt, mood? { avg, samples }` + phần riêng Farm `slotIndex, pregnancy`. Trường GĐ sau (bond, traits, combat…) để optional, thêm khi cần.
- Id giữ nguyên (`PIG_*`, `FOOD_BASIC`, `MEDICINE_COMMON`, `DECOR_*`): ARCHITECTURE §8 "không xóa id đã phát hành"; quy ước `item_`/`breed_` áp cho **id mới**. Save validate id bằng **danh sách từ content** (không còn `z.enum` cứng); id lạ không làm hỏng save (giữ nguyên, đánh dấu disabled).
- Mỗi Area có `migrations` riêng (Area Contract) chạy sau migration world.

### Migration v7 → v8 (trong `core/save/migrate.ts`, nối tiếp chuỗi v1→v7 sẵn có)
| v7 | v8 |
|---|---|
| `createdAt`, `updatedAt` | `meta.*`; `lastSavedAt = updatedAt`; `migratedFrom = 7` |
| `player.gold` | `wallet.coins` |
| `player.xp` | `progression.areas.sobi_farm.xp` |
| `player.unlockedSlots`, `pigs`, `nursery`, `trough`, `orders`, `gifts`, `decor`, `breedingRecords` | `areas.sobi_farm.*` (`pigs` → `creatures`, thêm `species: 'pig'`, gom trường bệnh vào `health`) |
| `inventory` | `inventory.items` |
| `transactions[]` | thêm `currency: 'coins'` |
| `progress` | `progression.{stats, claimed, daily}` |
| `collection.discoveredBreeds` | `collection.discovered.breed` |
| `settings` | giữ |

Bảo đảm an toàn:
1. **Backup trước migration**: trước khi ghi bản v8 đầu tiên, sao `save.json` cũ thành `backups/save-pre-v8-<thời gian>.json` (không bị xoay vòng xóa).
2. Migration là hàm thuần, chạy trên bộ nhớ; chỉ ghi khi validate v8 thành công. Lỗi → màn hình khôi phục, không xóa gì (luồng `recovery` sẵn có).
3. Test: fixture v1 sẵn có + **fixture v7 thật** (bản ẩn danh từ save dev `%APPDATA%\Un In Homemade Dev`, 1 heo, 4.875 vàng) + save tạo bằng `newGame` v7 nhiều heo/đơn/quà/vườn ươm → v8 → so từng trường (heo, tiền, đồ, KN) không mất. Test round-trip v8 → JSON → v8.
4. **Ghi an toàn / 5 backup / validation**: giữ `electron/saveFiles.ts` (đã atomic + fsync + rename retry + fallback backup), đổi `BACKUP_KEEP` 10 → 5, thêm backup trước migration, báo người chơi khi phải tải từ backup (đã có `loadSource`). Logic chọn bản nào/validate nằm ở `core/save` (thuần), I/O ở `electron/` và `platform/`.

### Chuyển thư mục save
`%APPDATA%\Un In Homemade\saves\` → `%APPDATA%\SobiWorld\saves\` (dev: `Un In Homemade Dev` → `SobiWorld Dev`). Lần chạy đầu: nếu thư mục mới chưa có `save.json` mà thư mục cũ có, **sao chép** (save + backups), không xóa bản cũ, rồi migrate. Code ở `electron/dataDir.ts` + test với thư mục tạm. Web (IndexedDB) giữ tên `un-in-homemade` (chỉ dùng khi dev).

---

## e) Đóng gói desktop offline

**Đóng gói được, và đã chạy.** Sobi Farm hiện ra installer NSIS (`npm run dist:win` → `release/SobiFarm-Setup-1.0.0.exe`): Electron nạp `dist/` qua giao thức `app://` (không HTTP server, không cổng mạng), font bundle sẵn, save ở `%APPDATA%`, installer có shortcut, gỡ cài không xóa save, admin không vào build.

**Đề xuất: giữ Electron + electron-builder (NSIS).** Không đổi sang Tauri: Tauri nhẹ hơn nhưng phải viết lại `electron/` sang Rust, đổi WebView (WebView2 khác Chromium về WebGL/Phaser), mất phần save đã test — rủi ro lớn, không có lợi cho yêu cầu hiện tại. Lý do sẽ ghi vào `docs/decisions/005-desktop-packaging.md`.

Việc còn lại thuộc GĐ4 (không làm ở GĐ1): đổi tên app/installer "Sobi World", appId, icon; test kiểm build không chứa admin; `docs/BUILD.md`; thử máy sạch. Cảnh báo `npm audit` (thư viện dev) xem ở GĐ4.

---

## f) Kế hoạch các bước nhỏ

Mỗi bước con = 1 commit, kết thúc bằng `npm run check` xanh và game chạy (`npm run dev` mở được nông trại, thao tác chính hoạt động). Bước có thay đổi save chạy thêm `npm run test:e2e`.

| # | Bước | Việc chính | Kiểm tra cuối bước |
|---|---|---|---|
| 1.1 | Guard mới | Chép guard sang `scripts/guard/`, config theo ARCHITECTURE §3 (core → systems → areas → app; ui dùng chung; **Area không import Area**; core không import systems/areas/ui/app). Ban đầu khai báo cả lớp cũ để vẫn xanh. Xóa skill `spec-to-source` (⚠ câu hỏi 8) | `npm run guard` xanh, test guard tự phát hiện import sai |
| 1.2 | Khung thư mục | Tạo `src/{systems,areas/farm/{logic,scene,ui},app}`, `content/{schemas,shared,farm}` kèm README | check xanh |
| 1.3 | Chuyển Farm logic | `git mv` engine/actions riêng heo → `areas/farm/logic` (bảng a), sửa import, **không đổi logic** | 667 test xanh |
| 1.4 | Chuyển Farm scene/ui | `src/game` → `areas/farm/scene` + `app`; UI riêng heo → `areas/farm/ui`; `store`, `main.ts` → `app` | check xanh, game chạy, e2e smoke |
| 2.1 | core/save v8 | Kiểu world v8, schema (id validate theo danh sách truyền vào), migration v7→v8, `meta.lastSavedAt` | test migration v1→v8, v7 thật → v8 |
| 2.2 | Ghi an toàn & backup | 5 backup + backup trước migration, thông báo tải từ backup | test `saveFiles` (crash giữa chừng, khóa file, hỏng file) |
| 2.3 | Thư mục SobiWorld | Sao chép save cũ lần đầu | test thư mục tạm; chạy desktop thật |
| 3.1 | core/content | `content/schemas` (zod), `core/content` = hàm thuần `createContentDb(raw)` validate + tra cứu; một module `src/app/content` import JSON tĩnh (Vite gộp vào build, không fetch, không mạng); lỗi content → màn hình lỗi khởi động như manifest | test schema từng file, test content hỏng |
| 3.2 | Chuyển dữ liệu | Từng nhóm (giống heo → lai → item/shop → balance → thành tích/quà/trang trí → ngày đêm/mùa → layout) sang JSON, code đọc qua content DB; **so khớp số trước/sau bằng test snapshot** | check xanh sau mỗi nhóm |
| 4 | core/inventory, items, economy, events, progression, assets | inventory (ô, stack, add/remove phát `item.added/removed`), items (tra định nghĩa + công dụng), economy (`changeCurrency` thay `changeGold`, 3 loại tiền, một nơi ghi Transaction), events (bus + kiểu chuẩn §7; sự kiện Farm ánh xạ sang chuẩn, FeedbackDirector nhận cả hai), progression khung (level theo Area, World Development = 0 + công thức), assets registry không biết heo | test từng module |
| 5 | systems | `creature` (model chung, heo = species dữ liệu, nhu cầu/lớn/giai đoạn), `health` (khung trạng thái healthy/ill/recovering/critical/dead, critical/dead **tắt** bằng balance), `quality` (bậc từ tâm trạng trung bình), `valuation` (tích hệ số, cấu hình ra **đúng giá cũ**), `behavior-ai` (state machine chung, hành vi heo là cấu hình), `layout` (schema + va chạm + vật thể tương tác) | test cũ của heo chạy qua systems; test giá cũ = giá mới |
| 6 | area-registry | `core/area-registry` (đăng ký, hook init/simulate/onEnter/onExit/updateActive/getSummary/migrations); `content/farm/area.json`; Farm đăng ký qua manifest; store gọi registry; `src/areas/_template` | test Area giả lập từ `_template` đăng ký + simulate + save/migration |
| 7 | Bảng chuỗi | `src/i18n/vi/` theo namespace; tên trong content thành `name: { vi }`; "vàng" → "Coins"; tên app trong UI → "Sobi World"; test không có chuỗi tiếng Việt ngoài i18n/content | test quét chuỗi |
| 8 | Admin | API admin ghi `content/*.json` (validate bằng chính schema game) thay vì viết `.ts` giữa marker; giữ đủ màn hình cũ (heo, asset, layout, shop, lai, ngày/đêm, mùa, người chơi, desktop); sửa save v8 | test admin cũ chuyển sang JSON; mở admin, sửa 1 giống + 1 sản phẩm, game nhận |
| 9 | Test tổng | save/migration, inventory, economy, valuation, quy tắc import, Area giả lập; chạy game + e2e + thử luồng chính (mua heo, cho ăn, tắm, chữa, lai, bán, đơn, quà, trang trí, xuất/nhập save) | toàn bộ xanh |
| Kết | Tài liệu | `docs/PROGRESS.md`, README từng thư mục, decision 005 (đóng gói) + 006 (content JSON + id), cập nhật ARCHITECTURE nếu lệch; báo cáo | — |

Thứ tự 1 → 9 như prompt GĐ1. Ước lượng: bước 3 và 5 lớn nhất (đụng ~40 file dùng `BREEDS`, ~30 file dùng `BreedId`).

---

## g) Rủi ro và câu hỏi

### Rủi ro
| Rủi ro | Giảm thiểu |
|---|---|
| Chuyển ~200 file làm vỡ import/test hàng loạt | `git mv` theo nhóm nhỏ, mỗi nhóm một commit xanh; không trộn đổi logic với đổi chỗ |
| Mất kiểm tra kiểu khi id chuyển từ union TS sang JSON | Validate id lúc load content + lúc load save; test "mọi id được tham chiếu đều tồn tại" (giống, item, art, decor); cân nhắc sinh file kiểu từ JSON nếu thấy cần |
| Migration v8 làm hỏng/mất save | Backup trước migration không xoay vòng, migration thuần + validate trước khi ghi, test với save thật, không bao giờ xóa thư mục cũ |
| Admin đang ghi `.ts`; đổi sang JSON có thể mất chức năng | Bước 8 chuyển từng màn hình, giữ test round-trip; liệt kê đủ 9 nhóm màn hình để đối chiếu |
| Tách systems làm lệch số liệu mô phỏng | Test golden/fuzz hiện có (advancePig, trough, invariants) giữ nguyên kỳ vọng; valuation test giá cũ = giá mới |
| Hiệu năng: tra cứu qua content DB thay hằng số | Content DB dựng map một lần lúc khởi động; đo lại 24 heo/khung hình |
| Bản Sobi Farm cũ còn cài trên máy người chơi sẽ không thấy tiến trình mới | Chấp nhận: sao chép chứ không chuyển, bản cũ vẫn chạy với save cũ |

### Câu hỏi cho chủ dự án (kèm đề xuất)
1. **Id cũ**: giữ nguyên `PIG_*`, `FOOD_BASIC`, `MEDICINE_COMMON`, `DECOR_*`; quy ước `item_`/`breed_` chỉ cho id mới. *Đề xuất: đồng ý* (đổi tên = xóa id đã phát hành).
2. **Thư mục save** đổi sang `%APPDATA%\SobiWorld` ngay GĐ1 (bước 2.3) thay vì GĐ4? *Đề xuất: GĐ1*, vì đang làm save; tên app/installer vẫn để GĐ4.
3. **Level người chơi → Farm level** (mọi điều kiện level hiện có hiểu là Farm level; World Development tính từ GĐ6). *Đề xuất: đồng ý.*
4. **"vàng" → "Coins"** trên giao diện ở bước 7 GĐ1 (decision 003 đã chốt đổi tên). *Đề xuất: GĐ1.*
5. **Giá vật phẩm**: GAME_BALANCE §6 ghi thức ăn 6 / cao cấp 15 / phân bón 12 Coins, nhưng thang tiền giữ theo Sobi Farm (thức ăn 25, thuốc 100). Mâu thuẫn — chọn ở GĐ2 bằng `sim:economy`? *Đề xuất: GĐ1 giữ 25/100, GĐ2 tính lại toàn bộ cùng thang thời gian mới.*
6. **Hệ số rarity khi bán**: Sobi Farm ×1 → ×41,7 (Legendary), GAME_BALANCE ×1 → ×7. *Đề xuất: GĐ1 giữ; GĐ2 quyết bằng mô phỏng* (69 giống đang cân theo thang cũ).
7. **Quality** GĐ1 chỉ tính và lưu tâm trạng trung bình, chưa đổi giá bán. *Đề xuất: đồng ý* (giá bán đổi một lần ở GĐ2).
8. **Skill `spec-to-source`**: chuyển guard ra `scripts/guard/` rồi **xóa skill** ở bước 1.1? *Đề xuất: xóa* (đã ghi "không dùng").
9. **Cài đặt** (nhạc, hiệu ứng…) còn trong save tới GĐ3 mới tách `settings.json` cùng phím điều khiển. *Đề xuất: đồng ý.*
10. **Vị trí asset**: giữ `public/assets/<loại>/` ở GĐ1, chuyển sang `public/assets/farm/` ở GĐ4 cùng atlas. *Đề xuất: đồng ý* (tránh đụng 300+ ảnh và script art ngay bây giờ).
