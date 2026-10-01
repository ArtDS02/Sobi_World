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

**R01-1** · `InstanceGuard.start(onReadOnly)` nhận callback lúc start (tabGuard cũ nhận lúc tạo) để platform tạo guard trước store. Tab id sinh ở platform (`crypto.randomUUID()`), không qua rng của store. `navigator.storage.persist()` + `requestPersist` bỏ theo §9.4 v4.1. Retry ghi lỗi đi qua cùng hàng đợi (không ghi chồng), ghi trạng thái mới nhất; chỉ 1 retry chờ tại một thời điểm. `vi.saveStatus.recovered` chưa dùng (toast phải qua FeedbackDirector — R05B).
Spec: §9.1–9.4 · Phase: R01.

**R02-1** · Build `electron/` bằng Vite lib mode (`vite.electron.config.ts`, không thêm dependency) → `dist-electron/{main,preload}.cjs`, mỗi entry bundle riêng (preload sandbox không `require` file cục bộ được). Typecheck riêng `tsconfig.electron.json` (lib ES2022 + types node, không DOM; gồm `tests/electron`). Tên kênh IPC là type `IpcChannel` trong `bridge.ts` (chỉ type), main/preload tự viết literal. Renderer không mang `node_modules` vào asar (`files` loại trừ).
Spec: §13.1, §13.3 · Phase: R02.

**R02-2** · `window.unin.save` thêm `markCorrupt(source)` ngoài danh sách §13.1: main không validate (§9.1), nên renderer báo file nào parse lỗi để main đổi tên `save.corrupt-*` (§9.2). Backup "từ save.json tốt" = save.json còn trong chuỗi (file hỏng đã bị đổi tên trước lần ghi đầu). Đổi tên áp cho cả backup hỏng gặp trên đường duyệt; gặp SAVE_TOO_NEW thì dừng, không đổi tên gì.
Spec: §9.1, §9.2, §13.1 · Phase: R02.

**R02-3** · Import (§9.3 "bản hiện tại thành backup trước"): main backup save.json ngay khi người chơi chọn file trong `importFrom()` (sau hộp xác nhận). `exportTo(json, suggestedName)` mở dialog ở main (renderer không chọn đường dẫn). `restoreBackup` backup bản hiện tại rồi chép đè; chưa có UI (R11). `store.markExported(at)` ghi `settings.lastExportAt` sau khi xuất thành công — đổi settings, không phát GameEvent (giống importSave).
Spec: §9.3 · Phase: R02.

**R02-4** · userData cố định `%APPDATA%\Un In Homemade\` (`app.setPath`) dù productName có dấu. Đóng cửa sổ: main chặn `close`, gửi flush (renderer `store.persistNow()`), chờ ≤ 3 s; `window-all-closed` chờ hàng đợi ghi rảnh (≤ 3 s) rồi mới quit để lần ghi lúc pagehide không bị cắt (tránh sót `save.json.tmp`). Installer tên `UnInHomemade-Setup-<version>.exe` (ASCII).
Spec: §9.2, §13.1, §13.3 · Phase: R02.

**R03-1** · Shop có 3 tab Heo giống / Vật phẩm / Chuồng (Bộ đồ chờ R04). Mua vật phẩm qua hộp chọn số lượng 1–99 (tổng cập nhật trực tiếp, lý do disable từ chính `buyItem`). Chuồng hiện chuồng kế tiếp; LEVEL_TOO_LOW hiển thị `vi.shop.slotLocked`. Lối vào Lịch sử = bấm ô vàng trên thanh trên (nav dưới không có Lịch sử). Kho: Thức ăn có nút "Đổ máng" mở hộp đổ máng với mặc định = min(kho, chỗ trống); hộp đổ máng có 2 nút đặt nhanh "Lấy từ kho: n" / "Đổ đầy". Thuốc dùng từ panel heo bệnh. `SLOT_BOUGHT` chưa có toast (feedback hành động → R05B). Màn Nông trại trống có nút sang Cửa hàng; `vi.ui.farmEmpty` đổi câu cho khớp.
Spec: §8.0, §8.11, §10.1 · Phase: R03.

**R03-2** · `dev:desktop` (Electron chưa đóng gói) dùng userData riêng `%APPDATA%\Un In Homemade Dev\` để không bao giờ đụng nông trại thật; tham số sau `--` chuyển cho Electron (vd `--remote-debugging-port`).
Spec: §9.1, §13.3 · Phase: R03.

**R04-1** · Script asset: `pngjs` (devDep) để đọc/ghi PNG — checker phải giải mã được PNG bất kỳ do art giao (palette, 16-bit, interlace); tự viết decoder không đáng. Vẽ placeholder bằng raster tối giản trong `scripts/assets/raster.ts`. Script TS chạy bằng `tsx`, typecheck riêng `tsconfig.scripts.json` (types node), test ở `tests/scripts/`. Kích thước catalogue (env/building/prop) chỉ nằm trong `scripts/assets/sizes.ts` để sinh placeholder; `assets:check` chỉ ép kích thước các nhóm art standard §7.4 quy định (pig 512², cosmetic 256², fx 256²/64²/sheet = frames, icon 128²) — thêm building mới không cần sửa TS (placeholder mặc định 256²).
Spec: art §4, §7.4, §10 · Phase: R04.

**R04-2** · Audio placeholder là `.mp3` im lặng (khung MPEG-1 Layer III rỗng, ~0,26 s) vì sinh Ogg Vorbis hợp lệ cần encoder; art §7.2 chấp nhận `.mp3`. Bản thật đổi `asset` sang `.ogg` trong manifest. Pig không có `anchors` ở Wave 0 (trường optional; art giao `*.anchors.json` cùng sprite). Placement có `originX/originY` optional (mặc định renderer quyết ở R05A). Gallery dev: nút `assets` trên thanh dev (`?dev=1`), tile viền theo status. Manifest lỗi → `renderManifestError` (vi.desktop.manifestError + thông điệp zod) trước khi tạo store.
Spec: §11.4, §12, art §7.2 · Phase: R04.

**R05A-1** · Vị trí heo không lưu: chân heo = điểm trong `walkArea`, x rải theo `slotIndex` (dãy tỉ lệ vàng), y và hướng (flipX) theo hash FNV-1a của id — tất định, không dùng rng. Spec chưa có luật "ngủ" → `pigView` chưa chọn frame `_sleep` (nhánh fallback idle + `fx_zzz` vẫn ở registry, Q5). Ốm + mang thai: hiện cả hai overlay, `visualState` = sick. Texture key = id (file `asset`) hoặc `${id}_${file}` (`pig_classic_sleep`, `prop_feed_trough_half`). Origin placement mặc định (0.5, 1); heo origin (0.5, 0.82). Depth: layer 0–3 âm theo thứ tự manifest, layer 4 = y px (máng + heo), layer 5 trên cùng. Ảnh môi trường thiếu → nền phẳng trời/cỏ vẽ sẵn; prop/building thiếu → khối màu; heo thiếu → khối bo tròn màu giống (BootScene). Skin mua sau preload: nạp 1 lần lúc reconcile.
Spec: §11, §11.1, §11.2, §11.4 · Phase: R05A.

**R05A-2** · Regex đường dẫn manifest nhận thêm hậu tố `.anchors.json` (art §7.2 ví dụ `pig_classic.anchors.json`). Màn Nông trại: canvas bên trái (`.app.is-farm`, cao `$farm-stage-height`), panel DOM bên phải rộng `$farm-panel-width`; màn khác ẩn stage và cho vòng lặp Phaser ngủ. Click heo → chọn (không toggle), click nền → bỏ chọn. `scale.expandParent: false` để Phaser không ghi đè kích thước host.
Spec: §10.4, §11.2, art §5, §7.2 · Phase: R05A.

**R05C-1** · (User chốt 2026-10-01, thay layout §10.1) Chỉ 1 màn hình: canvas nông trại phủ toàn bộ dưới thanh trên, **bỏ thanh điều hướng dưới**. Mọi chức năng mở bằng click vật thể trong cảnh → popup DOM giữa màn (mỗi lúc 1 popup; đóng bằng ✕ / Esc / click nền tối; hộp xác nhận như bán heo, đổ máng mở chồng lên trên). Ánh xạ nằm ở manifest `layout.placements[].action` (trường optional, thêm vào mà không bump version vì file v2 cũ vẫn hợp lệ): quầy `prop_shop_stall` (building mới, placeholder) → Cửa hàng; `prop_hay_shed` → Kho; `prop_order_board` → Đơn hàng; `prop_pig_house` → Bộ sưu tập; máng → hộp đổ máng; `prop_water_well` → popup Giếng nước (Tắm tất cả). Click heo → popup thẻ heo (panel §10.2 giữ nguyên nội dung), đóng popup thì bỏ chọn. Thanh trên giữ nguyên (vàng → Lịch sử, ⚙ → Cài đặt, máng → đổ máng). Vật thể bấm được có con trỏ bàn tay + nhãn tên luôn hiện (Phaser text), không dùng gợi ý chỉ khi hover (§10.4). Farm trống → gợi ý DOM nổi trên canvas kèm nút Cửa hàng.
Spec: §10.1 (đổi), §10.2, §10.4, §11.1 · Phase: R05C.

**R05C-2** · (User chốt 2026-10-01) Heo giữ cách dựng chuyển động bằng tween như art §3 / spec §11 (2 ảnh/heo, làm ở R09A); không vẽ sprite sheet đi. Phương án dự phòng nếu chơi thử sau R09A thấy thiếu sức sống: sheet đi 4–6 khung chỉ cho 4 heo mặc định qua trường `frames` của manifest, heo khác vẫn tween — chưa làm.
Spec: §11, art §3 · Phase: R09A.

**R05B-1** · Event §8.0 đứng trước event XP/discovery của cùng action (`PIG_BOUGHT` → `DISCOVERY`, `PIG_CLEANED` → `LEVEL_UP`). `cleanAll` trên trại sạch vẫn phát `PIG_CLEANED { pigIds: [] }` (R00-6: ≥ 1 event). `TROUGH_FILLED.gold` = +0 khi lấy hết từ kho. Store: `onEvents(events, origin)` — `catchup` = tick đầu sau init/import và khi cửa sổ hiện lại; dev time-skip và vòng lặp = `tick`. `onReject(error)` nhận cả dispatch bị từ chối lẫn import lỗi. Catch-up: chỉ toast (không animation/VFX/âm thanh) cho tới khi có away summary (R11). `PIG_HUNGRY_ZERO`, `ORDER_EXPIRED` không có trong bảng §11.3 → chỉ toast như cũ. Chuỗi toast mới (`vi.event.bought/treated/itemBought/renamed/slotBought`) không có trong Phụ lục B. `eventToast` chuyển từ ui/viewModel sang `game/feedback/toastText.ts`; `mountApp` trả `{ toast, dispose }`, director tạo ở main.ts. Tween chạy trên offset `motion` của PigSprite nên re-sync mỗi tick không đè; heo bị bán/mất → `leave()` (nhảy lên + mờ dần), reduceMotion thì biến mất ngay. Âm thanh: `silentAudio` (R10 thay).
Spec: §8.0, §9.5, §11.2, §11.3 · Phase: R05B.

**R06-1** · `breedPigs`: rng rút theo thứ tự id giao dịch phí → giống con (trọng số) → giới tính (50/50) → id BreedingRecord; con chốt vào `pregnancy` ngay lúc phối. Kiểm MYTHICAL bằng `BREEDS[x].breedable` (bước 6). Bàn sinh: duyệt mẹ theo `endsAt` sớm trước; con `lastTickedAt = createdAt = endsAt`, rồi `advancePig(child, now)` không qua máng (đúng §8.9; con không ăn máng trong khoảng offline đó). Record khớp theo `motherId + bornAt null + at === pregnancy.startedAt`. DISCOVERY khi sinh dùng ctx `{ now, rng }` của advanceWorld. Event `BREEDING_STARTED` → dòng bảng feedback: cả hai heo nhảy + `fx_heart` + `breed_chime` + toast (`vi.event.breedingStarted`, chuỗi mới). BIRTH: con pop-in tại chân heo mẹ rồi trượt về chỗ của nó (`from` trong plan). UI: nút Phối giống trong thẻ heo → hộp chọn bạn phối (chỉ liệt kê cặp hợp lệ, tỉ lệ theo matrix, thời gian mang thai theo giống mẹ, phí). Lý do khóa nút: trạng thái của chính heo trước (không phối được / chưa trưởng thành / bệnh / mang thai), rồi lý do chung của cả trại (hết chỗ / thiếu vàng), còn lại "Không có bạn phối phù hợp".
Spec: §6.5, §8.8, §8.9, §10.2, §11.3, D8, D22 · Phase: R06.

**R07A-1** · Đơn hàng: pool breed = `BREED_ID_VALUES` lọc theo `discoveredBreeds` (thứ tự config, không phụ thuộc thứ tự khám phá); rng rút theo thứ tự breed → (0.4 có giới tính → MALE/FEMALE) → minHappiness; `rewardGold = Math.round(sellGold × mult)`. Chưa khám phá breed nào → không sinh đơn (slot sinh sau khi có). Sinh thêm dừng khi chạm `ORDER_MAX_ACTIVE`. `fulfillOrder`: heo không tồn tại → `PIG_NOT_FOUND`; trưởng thành/không mang thai/breed/giới tính/vui vẻ sai → `ORDER_REQUIREMENTS_NOT_MET`; đơn đã giao → `ORDER_NOT_FOUND`. UI: bảng đơn liệt kê đơn còn hạn (đã giao hiện "Đã giao"); "Giao đơn" mở hộp chọn heo đáp ứng; khóa nút khi không có heo (`vi.order.noMatchingPig`, chuỗi mới).
Spec: §8.14, §14.5, C1, Q1–Q3, A5 · Phase: R07A.

**R07B-1** · Bộ sưu tập: khám phá breed (mua/sinh) đồng thời ghi skin mặc định của breed vào `discoveredSkins`, không thưởng lần 2 (giống migrate v1→v2; skin mặc định có sẵn từ đầu nên không phải "nhận mới"). Thưởng skin chỉ khi `buySkin`. View coi skin mặc định của breed đã khám phá là "đã thấy" (save trước R07B). Unlock `COLLECTION` đếm `discoveredBreeds + discoveredSkins`. `buySkin`/`equipSkin(state, args, ctx, skins: SkinRegistry)`: registry inject là tham số thứ 4, UI bind từ `opts.assets.skins`. `buySkin` kiểm theo thứ tự spec (tồn tại → đã có → giá/vàng → unlock); UI hiện lý do khóa unlock trước thiếu vàng. `equipSkin`: heo không có → `PIG_NOT_FOUND`; mặc lại skin đang mặc vẫn hợp lệ (UI khóa nút "Đang mặc"). `SKIN_EQUIPPED` = texture swap (sync sẵn có) + `bounce` + `fx_sparkle` (puff) + `ui_click`, không toast; `SKIN_BOUGHT` toast `vi.event.skinBought` (chuỗi mới). Toast dùng tên skin từ manifest qua `FeedbackDeps.skinName`. UI: tab "Bộ đồ" trong Shop, nút "Thay đồ" trong thẻ heo → hộp chọn skin, màn Bộ sưu tập (silhouette = `filter: brightness(0)`); thumbnail `<img loading="lazy">` qua `registry.url(id)`. Bỏ placeholderScreen.
Spec: §6.6, §8.13, §8.15, §11.3, §14.5, C2, C3, D19 · Phase: R07B.

**R08-1** · `sim:economy` (scripts/simulate-economy.ts + scripts/economy/model.ts, chỉ import src/core): chạy engine thật (advanceWithTrough tick 60 s, rng không bệnh). Thức ăn tới trưởng thành tính cả bữa đến hạn đúng lúc trưởng thành (PINK = 6, khớp §6.4; nếu dừng ngay khi đủ 100% thì ra 5). Giá ở happiness 0/50/100 = `sellPrice` với hunger = cleanliness = mức đó. Lãi/giờ/chuồng = (giá bán − giá có được − thức ăn) / số giờ lớn; giống chỉ phối ra được thì giá có được = `BREEDING_FEE`, không tính thời gian mang thai. Cổng §14.7 (≥ 2×) áp cho giống mua được trong shop (PINK: 4,16×); giống phối ra chỉ in để xem (1,72–1,86×, vì giá có được gần 0 nên tỉ lệ luôn < 2 — đúng toán, không phải lỗi). Giờ để mở chuồng = giá / (lãi PINK ở happiness 100 × số chuồng đang có); tier skin lấy từ manifest. Fuzz §5.5: 1000 bước seed cố định, bắt đầu từ farm giữa game (100.000 vàng, cấp 5 — người chơi ngẫu nhiên từ farm mới phá sản trước khi kịp phối giống), người chơi "biết giữ tiền ăn, giữ 1 chuồng trống, thỉnh thoảng chăm"; tham số nửa chọn hợp lệ, nửa ngẫu nhiên; khẳng định có ít nhất 1 lần thành công cho buy/sell/breed/order/buySkin/equipSkin.
Spec: §5.5, §6.4, §14.7, App. C · Phase: R08.

**R09A-1** · Visual state (`src/game/state/pigVisualState.ts`, thuần): ưu tiên feedback đang chạy (eat/clean/happy, tới `until`) > sleep (chưa có luật, không sinh — R05A-1) > sick > pregnant > walk > idle. AnimationId `hop` đổi thành `happy` (PIG_TREATED, BREEDING_STARTED); `FEEDBACK_STATE` ánh xạ animation → state, PigSprite giữ state trong thời lượng tween (`HOLD_MS`). Particle của từng state vẫn lấy theo dòng event trong bảng §11.3 (vd PIG_TREATED = happy + fx_sparkle, BREEDING_STARTED = happy + fx_heart), không cộng thêm. Wandering (`PigMover` + `state/wander.ts`): chỉ heo idle, không được chọn, không đang tương tác; heo bệnh/mang thai đứng yên nhưng vẫn thở. Đích tất định theo hash(id, bước), trong bán kính `FARM_VIEW.WANDER.radius` quanh chỗ ở (pigSpot), kẹp trong `walkArea`; vị trí chỉ nằm trong sprite, không vào store/save. Scale theo Y và depth = y hiện tại. Quay đầu = chuỗi tween turn 1→0 (lật flipX) →1 trong 120 ms. Brightness khi tắm dùng `preFX` ColorMatrix (chỉ WebGL; Canvas bỏ qua). Eat: quay mặt về phía máng rồi cúi 8°.
Spec: §11, §11.3, art §2.4, §3 · Phase: R09A.

**R09B-1** · Ngủ: spec không có luật dữ liệu cho "sleep" → chọn ngủ trưa thuần thị giác: heo khỏe, rảnh (được đi dạo) ngủ trong một số lần nghỉ giữa hai lần đi dạo (`napsDuring(id, bước)` tất định, `FARM_VIEW.WANDER.napChance` = 0,3); được chọn/tương tác thì thức. Thứ tự ưu tiên chốt lại: feedback > sick > pregnant > sleep > walk > idle (heo bệnh/mang thai không ngủ trưa). Look ngủ (`sleepLook`, thuần): frame `_sleep` nếu manifest có và đã tải, ngược lại idle + `fx_zzz` (Q5). `fx_zzz` có `frames` trong manifest → nạp spritesheet, anim lặp `${id}_anim` theo fps; reduceMotion → đứng ở frame 0. Bệnh: tint `FARM_VIEW.SICK_TINT` + `fx_sick` ở fx_above; mang thai: `fx_pregnant` ở fx_above; vị trí overlay qua `overlayLayout` (thuần, mirror theo hướng nhìn). reduceMotion: `newGame(ctx, { reduceMotion })`, store đọc `prefers-reduced-motion` (dep `prefersReducedMotion`) khi tạo game mới; khi bật: không đi dạo, không thở/squash, quay đầu tức thì, không particle/tween feedback (đã có từ R05B), overlay không animate. Chưa có nút bật/tắt trong Cài đặt (→ R11).
Spec: §11, §11.3, §11.4, Q5 · Phase: R09B.
