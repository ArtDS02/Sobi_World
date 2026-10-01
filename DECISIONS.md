# DECISIONS

Chốt ở S00. Spec §0 bảo ghi giả định vào README "Implementation assumptions" — dự án ghi ở đây; README game (phase cuối) sẽ chép lại mục cần cho người chơi/người chỉnh balance (bắt buộc: Q4).

## Mâu thuẫn

**C1** · Đơn hàng: `ORDER_MAX_ACTIVE = 6`, invariant `orders.length <= 6`; giữ `ORDER_TTL_MS = 8h`, `ORDER_WINDOW_MS = 4h`, mỗi window sinh 3 slot.
Spec: §5.5, §6.4 (A.1 balance), §8.14 · Phase: S02 (config), save schema/zod, engine orders, UI đơn hàng (hiển thị tới 6).

**C2** · `assets.json` là nguồn chân lý cho mọi skin (giá, rarity, allowedBreeds). `skins.ts` chỉ giữ 4 skin default theo breed + type + loader/schema. Manifest nạp ở `src/store/`, validate zod, inject vào core dạng `SkinRegistry`.
Spec: Phụ lục A.2, §6.6, art standard §7.2 · Phase: S02 (config/types), store, actions buySkin/equipSkin, shop UI.

**C3** · Cosmetics ra khỏi MVP: giữ field `Pig.cosmetics` trong schema, luôn rỗng; không action `equipCosmetic`, không shop, không `ownedCosmetics`. Ghi vào backlog.
Spec: §5.1, §5.5, §8.13, §6.6 · Phase: S02 (types/schema), actions, UI.

**C4** · Không tạo `decorBonus` (tàn dư bản nháp, thuộc §20 Backlog).
Spec: §5.4, §20 mục 2 · Phase: engine happiness.

## Open question

**Q1** · `weightedPick(rng, breedsDiscoveredByPlayer)` = phân bố đều trên các breed đã khám phá.
Spec: §8.14 · Phase: engine orders.

**Q2** · Đơn đã có trong `state.orders` (theo id `${windowIndex}:${slot}`) không bao giờ tái sinh; chỉ sinh cho slot chưa có id. Bắt buộc có test.
Spec: §8.14 · Phase: engine orders.

**Q3** · `hash(windowIndex, slot) = (windowIndex * 0x9E3779B1 ^ (slot + 1) * 0x85EBCA6B) >>> 0`, khoá bằng 3 golden value trong test.
Spec: §8.14 · Phase: S02 (rng), engine orders.

**Q4** · Giữ xấp xỉ có chủ ý: `resolveTrough` cộng hunger cho cả window rồi `advancePig` trừ decay cả window. Không "sửa" nếu không sửa luôn golden value §14.1. Phải ghi vào README game mục "Implementation assumptions".
Spec: §7.3, §14.1 · Phase: engine trough/advanceWorld, README cuối.

**Q5** · Renderer bắt buộc có nhánh fallback khi skin không có `_sleep`: dùng idle + `fx_zzz`. Cần 1 test.
Spec: §11, art standard §3.2 · Phase: Phaser/render.

**Q6** · `trough.capacity = 20 + (level-1)*10` tối đa 110; cap 120 là code chết — giữ nguyên, chỉ ghi chú.
Spec: §6 balance, trough · Phase: S02 (config), engine trough.

**Q7** · Màn Kho = danh sách item + số lượng + nút dùng nhanh; Lịch sử = `transactions` mới nhất trước, tối đa 200, nhãn loại + số vàng có dấu.
Spec: §10, Phụ lục B `nav` · Phase: UI DOM.

**Q8** · Tên heo: chọn tên chưa trùng heo đang sống; trùng hết thì thêm hậu tố số nhỏ nhất chưa dùng. Không thêm field.
Spec: Phụ lục A.3 · Phase: actions buyPig/birth.

## Kiến trúc

**A1** · ~~Browser API trong `src/core/` chỉ được nằm ở `src/core/save/storage.ts`.~~ **Thay bởi R00-3** (v4.1): `src/core/` không có ngoại lệ nào; storage chuyển sang `src/platform/` ở R01.
Spec: §4.1, D2 · Phase: save/storage; guard + ESLint.

**A2** · Real clock (`Date.now()`) không nằm trong `src/core/clock.ts`: core chỉ giữ interface `Clock` + fake clock; `realClock` đặt ở `src/store/`. Lý do: §4.1 ghi "clock.ts (real + fake)" nhưng guard/CLAUDE.md cấm `Date.now()` trong core (chỉ ngoại lệ rng.ts, storage.ts).
Spec: §4.1 · Phase: S02 (clock), store.

**A3** · Id unions (`Gender`, `BreedId`, `ItemId`, `CosmeticSlot`) nằm ở `src/core/config/ids.ts`; `types.ts` re-export. Lý do: guard cấm tầng config import domain, mà breeds.ts/skins.ts (Phụ lục A) import `../types` → chỉ đổi import path sang `./ids`.
Spec: §5.1, Phụ lục A · Phase: S02.

**A4** · `defaultRng` (Math.random) tạo ngoài core, ở `src/store/runtime.ts` cùng `realClock` (theo task S02). `src/core/rng.ts` không gọi Math.random; ngoại lệ rng.ts trong guard/ESLint để trống, không dùng.
Spec: §4.1 · Phase: S02, store.

**A5** · `BALANCE.ORDER_SLOTS_PER_WINDOW = 3` (số slot sinh mỗi window, §8.14) tách khỏi `ORDER_MAX_ACTIVE = 6` (C1).
Spec: §6.4, §8.14 · Phase: engine orders.

**S03-1** · `advancePig`: `starving = tHungerZero <= tCleanBelow` (spec §7.2 viết `<`). Với `<`, heo đã đói 0 và cleanliness ≤ 30 (cả hai = 0) bị coi là không đói → hazard không nhân đôi, trái luật "Hunger at 0 doubles the sickness hazard" (§7.2 Rules, D21) và golden "starving hazard" §14.1. Không ảnh hưởng golden khác (khởi đầu 100/100 không có tie).
Spec: §7.2, §14.1 · Phase: S03.

**S03-2** · `sellPrice` cộng epsilon 1e-9 trước `floor` để tránh lỗi float (vd 1200 × 0.95); test so với phép tính nguyên chính xác cho mọi breed × happiness 0..100.
Spec: §5.4 · Phase: S03.

**S04A-1** · `resolveTrough` KHÔNG cap hunger ở 100 (pseudo-code §7.3 viết `min(100, …)`). Có cap thì cả golden §14.1 "trough 10 → adult, food 4" (ra 33.33) lẫn test bắt buộc §14.2 "hunger 50, trough 5, 2 periods → >50" (ra 0) đều fail. Không cap: hunger cuối window = `100 − (x mod 50)` ∈ (50, 100] khi đủ thức ăn — đúng với mô phỏng từng giây; giá trị trung gian > 100 chỉ dùng làm input cho advancePig, `advanceWithTrough` clamp ≤ 100 sau đó.
Spec: §7.3, §14.1, §14.2 · Phase: S04A, S04B (advanceWorld phải gọi `advanceWithTrough`, không gọi resolveTrough riêng).

**Q4-README** · Dòng cho README "Implementation assumptions": "Máng ăn tính dạng đóng theo từng window: mọi bữa trong window được cộng trước, advancePig trừ hao đói cả window sau; thức ăn chia tham lam theo slotIndex tăng dần — window dài (offline) mà thiếu thức ăn thì heo slot thấp ăn hết trước. Đây là xấp xỉ có chủ ý; đổi thì phải đổi golden §14.1."

**S04B-1** · Event cho away summary (§9.5): `TROUGH_EMPTY { at }` = thời điểm bữa cuối khi máng cạn trong window mà còn heo muốn ăn (đã cạn từ đầu window → không emit); `PIG_HUNGRY_ZERO { at, stalled }` = lúc hunger chạm 0 (chỉ ở lần vượt ngưỡng), `stalled` = chưa trưởng thành → UI tính "ngừng lớn bao lâu" = now − at. Thời điểm theo xấp xỉ Q4 (tham lam theo slot).
Spec: §7.3, §7.4, §9.5 · Phase: S04B, UI away summary.

**S05-1** · (v4.1: áp cho adapter web dev; adapter desktop theo spec §9.1–9.2 + R00-4.) Storage: IndexedDB lưu cùng chuỗi JSON với mirror. Backup = save tốt gần nhất mà phiên này đã load/ghi (giữ trong bộ nhớ), chép sang backup key trước mỗi lần ghi đè; chưa có save tốt (vd sau recovery → "Bắt đầu mới") thì backup cũ giữ nguyên. Gặp SAVE_TOO_NEW ở bất kỳ nguồn nào → dừng chuỗi (không lùi về bản cũ hơn) và khoá ghi.
Spec: §9.1, §9.2 · Phase: S05, store.

**S05-2** · Migration v1→v2: `trough = { food 0, capacity theo level từ xp, lastResolvedAt = updatedAt }`; `collection.discoveredBreeds` = breed của heo + breedingRecords, `discoveredSkins` = skin default của các breed đó (không cộng discovery bonus); `ownedSkins` = 4 skin default. Field lạ của v1 bị zod bỏ qua.
Spec: §9.2 · Phase: S05.

**S05-3** · Helper vàng duy nhất: `src/core/engine/gold.ts:changeGold` (ghi Transaction, newest first, tối đa 200, không cho âm → INSUFFICIENT_GOLD). Id sinh bằng `rng.ts:randomId(rng)`.
Spec: §8.16 · Phase: S05, mọi action.

**S06A-1** · Action pipeline `actions/runAction.ts`: advanceWorld → body(stateĐãAdvance) → `{ok, state(updatedAt=now), events: world + action}`; lỗi chỉ trả `{ok:false,error}`, store giữ state cũ. Helper vàng vẫn ở `engine/gold.ts:changeGold` (S05-3), XP ở `engine/xp.ts:addXP`, khám phá breed ở `engine/collection.ts:discoverBreed` (dùng cho buyPig, sau này birth). Thứ tự kiểm lỗi buyPig: breed/gender → NO_PIG_SLOT → INSUFFICIENT_GOLD (theo §8.1).
Spec: §8, §8.1, §8.15, §8.16 · Phase: S06A+, mọi action.

**S06A-2** · `BALANCE.SHOP_MAX_QUANTITY = 99`, `BALANCE.PIG_NAME_MAX = 16` (số từ §8.10/§8.12 đưa vào config). Độ dài tên đếm theo code point sau khi bỏ ký tự điều khiển (\p{Cc}) và trim.
Spec: §8.10, §8.12 · Phase: S06A.

**S06B-1** · `fillTrough` luôn ghi đúng 1 transaction `TROUGH_FILL`, kể cả amount 0 khi lấy hết từ kho (§8.6 "0 if it all came from inventory"); `changeGold` chuẩn hoá -0 → 0. `units` không phải số nguyên ≥ 1 → INVALID_REQUEST. Cap sức chứa `BALANCE.TROUGH_CAPACITY_MAX = 120` áp trong `troughCapacityForLevel`. Note transaction là chuỗi máy (tiếng Anh), không hiển thị trực tiếp.
Spec: §8.6 · Phase: S06B.

**S07-1** · Store API (`src/store/gameStore.ts`): `init()` → status `ready | recovery | tooNew`; `dispatch((s, c) => action(s, args, c))`; `tick()`; `startNewGame()`/`importSave(json)` (UI hỏi xác nhận trước); `subscribe` (snapshot) + `onEvents` (GameEvent[]). Persist: sau action thành công, khi tick có event, khi ≥ 30 s từ lần ghi cuối, khi hidden và pagehide. Một `setInterval` 1 s duy nhất, dừng khi hidden, tick + chạy lại khi visible. `requestPersist()` gọi sau action thành công đầu tiên. Action bị từ chối khi read-only/tooNew/recovery → `INVALID_REQUEST` (ErrorCode không có mã riêng).
Spec: §4, §7.1, §9.1, §9.4 · Phase: S07, UI.

**S07-2** · (v4.1: chỉ còn dùng cho bản web dev, chuyển vào `src/platform/web/` ở R01; desktop dùng single-instance — R00-5.) Multi-tab (`src/store/tabGuard.ts`): tab mới gửi `hello`, chờ 150 ms; tab khác trả `here {primary}`. Nhận `here` từ tab primary (hoặc tab id nhỏ hơn khi cùng khởi động) → read-only vĩnh viễn (`snapshot.readOnly`, UI hiện vi.multiTab, nút tải lại); tab read-only không bao giờ ghi. Multi-tab báo qua snapshot, không thêm GameEvent.
Spec: §9.4 · Phase: S07, UI.

**S08A-1** · Thêm nhóm `vi.ui` (comingSoon, farmEmpty, selectPig, breed, gender, percent, weightKg) — Phụ lục B không có các nhãn khung này. Định dạng số theo `vi-VN` (8.420; x1,20) qua `src/i18n/format.ts` (`t`, `formatInt`, `formatDec`, `formatDuration`). Bottom nav 5 mục như §10.1; Cài đặt ở nút ⚙ top bar; Lịch sử chưa có lối vào (S08B/màn settings). Toast `PIG_HUNGRY_ZERO` chỉ khi heo chưa trưởng thành.
Spec: §10.1, §10.2, §10.5 · Phase: S08A.

**S08A-2** · Store đổi deps timer `setInterval/clearInterval` → `every/cancel` để toàn `src/` chỉ còn đúng 1 dòng `setInterval` (grep guard adapter §8).
Spec: §7.1 · Phase: S08A.

**S08B-1** · Nút disable lấy lý do bằng cách chạy thử chính action đó trên save hiện tại (`ui/actionsVm.ts:probe`, rng bỏ đi) rồi map ErrorCode → `vi.disabled.*` (ngắn) hoặc `vi.error.*`; INSUFFICIENT_ITEM nói rõ hết thức ăn/hết thuốc. Mua heo đặt tạm ở thanh công cụ màn Nông trại (chọn Đực/Cái) cho tới khi có màn Cửa hàng; chạm thước máng ăn mở hộp đổ máng (§10.1). Bán luôn hỏi xác nhận kèm giá cuối, cảnh báo thêm cho SUPERMAN/MYTHICAL. DOM chỉ thay khi markup đổi (so outerHTML) để click không mất vì re-render mỗi giây. Dev time-travel: `npm run dev` + `?dev=1`, offset cộng vào clock của store, nằm sau `import.meta.env.DEV` + dynamic import nên không có trong build (đã kiểm dist).
Spec: §10.1, §10.2 · Phase: S08B.

## Hướng desktop — R00 (spec v4.1, art standard v1.1)

Chốt sau Architecture & Product Direction Review (sau S08B). Spec v4.1 đã ghi nguyên văn; mục dưới chỉ là các lựa chọn spec để ngỏ hoặc cần nhớ khi code. Bốn câu hỏi mở của review chốt theo khuyến nghị.

**R00-1** · Runtime = **Electron** (không Tauri: không thêm Rust/MSVC toolchain, Chromium giống môi trường dev/test; đổi được sau vì chỉ chạm `electron/` + `src/platform/desktop`). **Chỉ Windows**, không mobile (spec D1, §10.4). Bản web (`npm run dev`) chỉ để dev.
Spec: D1, §4, §13 · Phase: R02.

**R00-2** · Data layer = **file JSON** qua port `SaveStorage` (không SQLite, không HTTP API cục bộ — save là 1 tài liệu nhỏ đọc/ghi nguyên khối). BE cloud không làm; đồng bộ máy = chép/đồng bộ thư mục save (spec §9.3, §20 mục 8).
Spec: D2, §9 · Phase: R01, R02.

**R00-3** · `src/core/` thuần tuyệt đối: không browser/Node API, không ngoại lệ file. `SaveStorage` interface ở `src/core/save/port.ts`; adapter ở `src/platform/{web,desktop}/`; Node API chỉ trong `electron/`. Guard (`.claude/spec-to-source.config.mjs`) + ESLint cập nhật ở R01.
Spec: §4.1 · Phase: R01.

**R00-4** · Backup desktop: tạo từ `save.json` tốt trước lần ghi đầu mỗi phiên, sau đó tối đa 15 phút/lần, giữ 10 bản; file hỏng đổi tên `save.corrupt-*` (không xoá). Ghi lỗi → `saveError` + retry 1 s/5 s/30 s; thoát app chờ hàng đợi ghi ≤ 3 s.
Spec: §9.1, §9.2 · Phase: R01 (saveError), R02 (file).

**R00-5** · Một instance: `app.requestSingleInstanceLock()`, lần mở thứ hai focus cửa sổ cũ. tabGuard/BroadcastChannel chỉ còn ở bản web dev.
Spec: §9.4 · Phase: R02.

**R00-6** · Mọi action thành công phát ≥ 1 event (spec §8.0); feedback chỉ qua `FeedbackDirector` + bảng dữ liệu (§11.3). Event catch-up dài không phát animation, chỉ vào away summary.
Spec: D25, §8.0, §11.3 · Phase: R05B (event các action đã có), R06/R07 (event action mới).

**R00-7** · Manifest v2 (art standard §7.2): `status` placeholder/production/final, thêm `environment`, `audio`, `layout`, `frames`, `credit/license`; trough/order board ở `props/`. Schema zod ở `src/core/assets/manifestSchema.ts` (thuần); nạp file ở `src/platform/` (fetch tương đối, chạy cả `app://` lẫn dev). Thay cho kế hoạch `src/store/assetRegistry.ts` của S13 cũ.
Spec: D24, §11.4, art §7.2–7.4 · Phase: R04.

**R00-8** · Cosmetics/accessories **vẫn ngoài v1** (C3 giữ nguyên, spec §20 mục 7). Phạm vi asset v1 = wave 0–2 (art standard §10).
Spec: §20 · Phase: —.

**R00-9** · Đóng gói lên sớm: R02 (ngay sau R01) đã ra installer; cổng chơi thử S08B làm trên bản cài đặt. Mọi phase sau kiểm trên `npm run dev:desktop` hoặc bản `dist:win`.
Spec: §16 · Phase: R02+.

**R00-10** · `hướng_dẫn_triển_khai.md` và `DESIGN_README.md` còn mô tả PWA — đã lỗi thời về runtime/save; vẫn không đọc (CLAUDE.md). Nguồn đúng: spec v4.1 + file này.
