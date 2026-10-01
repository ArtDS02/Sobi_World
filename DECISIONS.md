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

**A1** · Browser API (IndexedDB, localStorage, window, document) trong `src/core/` chỉ được nằm ở `src/core/save/storage.ts`.
Spec: §4.1, D2 · Phase: save/storage; guard + ESLint.

**A2** · Real clock (`Date.now()`) không nằm trong `src/core/clock.ts`: core chỉ giữ interface `Clock` + fake clock; `realClock` đặt ở `src/store/`. Lý do: §4.1 ghi "clock.ts (real + fake)" nhưng guard/CLAUDE.md cấm `Date.now()` trong core (chỉ ngoại lệ rng.ts, storage.ts).
Spec: §4.1 · Phase: S02 (clock), store.

**A3** · Id unions (`Gender`, `BreedId`, `ItemId`, `CosmeticSlot`) nằm ở `src/core/config/ids.ts`; `types.ts` re-export. Lý do: guard cấm tầng config import domain, mà breeds.ts/skins.ts (Phụ lục A) import `../types` → chỉ đổi import path sang `./ids`.
Spec: §5.1, Phụ lục A · Phase: S02.

**A4** · `defaultRng` (Math.random) tạo ngoài core, ở `src/store/runtime.ts` cùng `realClock` (theo task S02). `src/core/rng.ts` không gọi Math.random; ngoại lệ rng.ts trong guard/ESLint để trống, không dùng.
Spec: §4.1 · Phase: S02, store.

**A5** · `BALANCE.ORDER_SLOTS_PER_WINDOW = 3` (số slot sinh mỗi window, §8.14) tách khỏi `ORDER_MAX_ACTIVE = 6` (C1).
Spec: §6.4, §8.14 · Phase: engine orders.
