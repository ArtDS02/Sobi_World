# UPDATE AUDIT — Master prompt "Update & Expand" (U-phase)

Phase 0 (U00) · 2026-10-02 · base: `start/unimo-v1` @ 31dead4 · `npm run check` xanh (448 test).
Đọc: spec v4.1 §5.2, §6.5, §6.6, §20; art standard §2; `asset/animals/PIG_CATALOGUE.md` §0–§13;
`asset/building/ENVIRONMENT_CATALOGUE.md`; 4 ảnh reference; code core/config, engine, actions, MainFarmScene, manifest.

---

## 1. Hiện trạng (Existing)

| Vùng | Đã có | File chính |
|---|---|---|
| Species | `BreedId` = 4 loại: `PIG_EARTH_PINK` (mua 500), `PIG_STRIPED_MELON`, `PIG_SUPERMAN`, `PIG_MYTHICAL` (3 loại sau chỉ lai ra). Breed = trục kinh tế (giá, growth, care suy ra từ growthSec — D16). **Không có rarity cho breed.** | `core/config/breeds.ts`, `ids.ts` |
| Skin | Trục hình ảnh tách khỏi breed (D19 — skin không chạm số nào). 23 skin trong manifest (4 default + 15 P1 giá 2000 + 4 P2 giá 6000). Rarity `P1..P5` chỉ có ở skin. Mua/mặc skin + tủ đồ. | `config/skins.ts`, manifest `pigs[]`, `actions/skins.ts`, `ui/skinsVm.ts` |
| Cosmetics | Field `Pig.cosmetics` luôn rỗng. Không action/shop (DECISIONS C3, R00-8, spec §20.7). | `types.ts` |
| Breeding | `breedPigs` + sinh tự động trong `advanceWorld` (idempotent). Kết quả theo **ma trận cặp** `BREEDING_MATRIX` (6 key, golden value spec §6.5/§14.4); cặp không có → `BREEDING_COMBINATION_NOT_SUPPORTED`. `weightedPick` đã data-driven. | `config/breedingMatrix.ts`, `engine/breeding.ts`, `actions/breedPigs.ts` |
| Shop | Tab `pigs / items / slots / skins`. Tab heo chỉ bán breed có `buyGold` ≠ null → **hiện chỉ 1 loại heo mua được**. | `ui/screens/shopScreen.ts` |
| Collection | Sổ sưu tập breed + skin, thưởng 500 vàng + 30 XP lần đầu. | `engine/collection.ts`, `ui/screens/collectionScreen.ts` |
| Level | Level người chơi suy ra từ XP (D13). **Không có level/XP theo từng heo.** | `config/levels.ts`, `engine/xp.ts` |
| Vàng | Một helper `changeGold` ghi Transaction (enum `TRANSACTION_TYPE_VALUES`). | `engine/gold.ts` |
| Thời gian | Một `setInterval` (store) → `advanceWorld(state, now, rng)`; catch-up khi mở game; offline đúng nhờ timestamp (`lastTickedAt`, `trough.lastResolvedAt`). `now`/`rng` inject. | `store/gameStore.ts`, `core/engine/advanceWorld.ts` |
| Save | Schema v2 (zod) + migrate v1→v2, file atomic qua `SaveStorage` port, sao lưu. | `core/save/*`, `platform/desktop/*` |
| Farm | Phaser 1 màn; layout từ manifest (`walkArea` y 0.62–0.95, placements + `action`). Heo đi dạo thuần hình ảnh (vị trí **không** nằm trong save). Y-sort, scale theo Y. | `game/scenes/MainFarmScene.ts`, `game/state/wander.ts` |
| Animation | Không spritesheet: 1 ảnh side-view + flip (D23), tween thở/đi/bounce, frame `_sleep` tuỳ chọn, overlay fx dùng chung, tint bệnh. Mọi VFX/âm thanh/toast qua `FeedbackDirector` (§11.3). | `game/fx/*`, `game/feedback/*`, `game/prefabs/*` |
| Asset pipeline | id → `public/assets/manifest/assets.json` (manifest v2, zod) → registry; placeholder tự sinh; `assets:check`; skill `image-to-asset` (brief → generate → QA → `art_inbox` → `art:process`). | `core/assets/*`, `scripts/assets/*` |

## 2. Thiếu (Missing)

- Rarity cho species (COMMON…LEGENDARY) + bảng rarity data-driven (màu UI, hệ số giá, trọng số lai, đóng góp quà, giá trị sưu tập).
- Species mới — hiện chỉ 4; nhiều heo "khác thân" (trắng/đen/nâu/đốm) đang bị bán như **skin** → đúng phàn nàn "heo đang dùng như skin".
- Luật lai mở rộng được: ma trận cặp tăng n² (20 loại = 210 key) → cần luật theo family/rarity + mutation + override.
- Gift box: toàn bộ (state, spawn, reward, open action, transaction type, event, FX, asset).
- Bảng tên heo trên farm (hiện **không có** label tên heo; text đè lên heo là **nhãn công trình** — xem §4.3).
- Phân nhóm rarity trong Collection; badge rarity trong shop/thẻ heo.
- Asset: species mới, gift box (đóng/mở), khói, badge rarity, khung thẻ; props trong `style_reference_building.png` chưa dùng (windmill, water pump, apple crate, hay bale, wheelbarrow, barrel, signpost, bush, rock, sunflower, mushroom, veggie patch*).
- **`asset/animals/` không có ảnh động vật nào** — chỉ có `PIG_CATALOGUE.md`. Master prompt giả định có tiger… reference. Proposal U00 dựa trên catalogue + 4 ảnh pig reference + kiến thức chung về động vật (xem `PIG_CONCEPT_PROPOSAL.md` §0).

## 3. Cần sửa (Need modify)

| File | Thay đổi |
|---|---|
| `config/ids.ts` | Mở rộng `BREED_ID_VALUES`; thêm `RARITY_VALUES`; thêm transaction `GIFT_REWARD` (+ `SKIN_REFUND` nếu chọn hoàn tiền, §5-D3). |
| `config/breeds.ts` | `BreedDef` thêm `rarity`, `family`, `shop: { buyable, unlockLevel? }`; giá mua/bán suy từ rarity × base (giữ 4 breed cũ đúng số spec). Giữ tên `breed` trong code (species = breed) — không đổi tên hàng loạt. |
| `config/breedingMatrix.ts` → `config/breedingRules.ts` | Trọng số theo luật + `MUTATIONS` + `OVERRIDES` (= ma trận cũ, golden giữ nguyên). `breedingOutcomes(a,b)` luôn trả kết quả. |
| `core/types.ts`, `save/schema.ts`, `save/migrate.ts` | Schema v3: `gifts` state; enum breed mới; migrate v2→v3. |
| `engine/advanceWorld.ts` | Bước 5: `resolveGifts` (sau orders), idempotent. |
| `engine/orders.ts` | Order chọn breed đều (Q1) → cân nhắc giới hạn theo rarity (tránh order đòi LEGENDARY). |
| `ui/screens/shopScreen.ts`, `skinsVm.ts`, `collectionScreen.ts` | Tab Heo theo rarity; tách rõ Heo (species) / Skin; collection nhóm theo rarity. |
| `game/scenes/MainFarmScene.ts`, `config/farmView.ts` | Nhãn công trình nhỏ, không đè walkArea; bảng tên heo + tránh chồng. |
| manifest `pigs[]` | `pig_white/black/brown/spotted` hết là skin bán được → asset của species. |
| `scripts/sim-economy`, fuzz §5.5 | Chạy lại với species mới; số giá là TUNABLE tới khi sim xanh. |

## 4. Cần tạo (Need create)

1. `core/config/rarity.ts` — `RARITIES: Record<Rarity, { priceMult, breedWeight, giftWeight, collectionValue, uiToken }>`; UI lấy màu qua token SCSS `$c-rarity-*`, không hard-code.
2. `core/config/breedingRules.ts` + test xác suất (bảng trọng số chính xác + Monte Carlo rng seed).
3. `core/config/gifts.ts` — `GIFT: { BASE_INTERVAL_MS, RARITY_INTERVAL_FACTOR, MAX_ON_FARM, MAX_PER_ROLL, REWARD_MIN/MAX (gold, xp), VARIANCE }`.
4. `core/engine/gifts.ts` (`resolveGifts` — spawn + tính reward lúc spawn) · `core/actions/openGift.ts` (chỉ claim 1 lần: xoá box + `changeGold('GIFT_REWARD')` + `addXP` + event `GIFT_OPENED`).
5. `game/view/giftPlacement.ts` (thuần: seed → vị trí trong walkArea, validate với vùng placement/trough/bowl/puddle + vị trí nhà của heo, retry giới hạn, fallback điểm cố định) · `game/prefabs/GiftBox.ts` · entry `feedbackTable` cho `GIFT_SPAWNED` / `GIFT_OPENED`.
6. `game/view/nameplateLayout.ts` (thuần, test được: đặt bảng tên trên đầu, đẩy dọc khi chồng).
7. i18n: `vi.rarity.*`, `vi.gift.*`, `vi.breeds.*` mới, `vi.shop.tab*`.
8. Docs: `UN_IN_PIG_CATALOGUE.md` (sau khi user duyệt proposal), dòng `DECISIONS.md` cho từng quyết định §5.

## 5. Xung đột với spec / CLAUDE.md — cần user chốt trước khi code (master prompt §56)

| # | Xung đột | Đề xuất an toàn nhất |
|---|---|---|
| D1 | **Clothing/cosmetics** = spec §20.7 Backlog; DECISIONS C3/R00-8; CLAUDE.md "không cosmetics". | Làm **foundation dữ liệu** thôi: type `ClothingDef` + slot `hat/shirt/pants/accessory` ánh xạ vào `COSMETIC_SLOT_VALUES` hiện có; không equip action, không shop. Cần user xác nhận gỡ C3 một phần và sửa dòng CLAUDE.md. |
| D2 | **4 hướng (front/back/left/right)** vs D23 / art standard §2 (1 hướng side-view + flip; lý do: x8 asset, mất mặt heo khi quay lưng). | Giữ D23. Đi "vào trong" = di chuyển trục Y + scale + Y-sort (đã có). Thêm tween quay đầu 120 ms nếu chưa có. Không vẽ front/back. |
| D3 | Người chơi đã **mua skin** `pig_white/black/brown/spotted` (2000 vàng). Khi thành species, skin đó còn ý nghĩa gì? | Migrate v2→v3: gỡ khỏi `ownedSkins`, hoàn tiền giá gốc qua `changeGold('SKIN_REFUND')`, heo đang mặc → về default skin của breed. (Phương án khác: giữ như skin nhưng ngừng bán.) |
| D4 | **Golden value breeding** (§6.5/§14.4): pink×pink = 90/10. Master prompt muốn "related ~25%, rare, ultra rare". | Giữ nguyên 6 cặp cũ làm `OVERRIDES` (không đụng golden). Luật mới chỉ áp cho cặp có species mới. Nếu muốn đổi cả cặp cũ → user phải duyệt đổi golden. |
| D5 | Release **v1.0.0 chưa tag** (R12B dở: EPERM khi `dist:win`). | Tag/đóng v1.0.0 trước, U-phase là v1.1 trên nhánh riêng. Hoặc gộp — user chọn. |
| D6 | **Skin pink trên species khác**: skin hiện là ảnh trọn thân màu hồng (`pig_farmer`, `pig_chef`…). Mặc lên Heo Đen → mất nhận diện species — trái tinh thần "skin không thay species". | Ngắn hạn: skin trọn thân chỉ cho phép breed có thân hồng (`allowedBreeds`), species khác chỉ dùng default. Dài hạn: clothing layer (D1) mới là "thay đồ" đúng nghĩa. |
| D7 | Số heo **30+** để test hiệu năng vs `MAX_SLOTS = 12`. | Giữ 12 slot (gameplay). Test hiệu năng 30–40 heo qua dev tool (`?dev=1`), không đổi luật. |
| D8 | **Pig level/XP từng con**, Happiness đa chỉ số. | Hoãn (master prompt §57 cho phép). Happiness đã có (D18 từ hunger + clean + sick) — không thêm chỉ số. |
| D9 | Tên rarity: catalogue P1–P5 = Common/Rare/Epic/Legendary/Mythic; master prompt = COMMON/UNCOMMON/RARE/EPIC/LEGENDARY. | Dùng tên master prompt, ánh xạ P1→COMMON … P5→LEGENDARY cho cả skin (chỉ đổi nhãn hiển thị, giữ key P* trong manifest). |

## 6. Kiến trúc đề xuất (khớp code thật)

```ts
// config — species = breed (giữ BreedId)
type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
type Family = 'FARM' | 'MEADOW' | 'WILD' | 'WATER' | 'HERO' | 'MYTHIC';
interface BreedDef { /* hiện có */ rarity: Rarity; family: Family; shop: { buyable: boolean; unlockLevel?: number } }

// config/breedingRules.ts
const BREEDING = {
  SAME_PARENT: 60,        // mỗi species bố/mẹ (TUNABLE)
  SAME_FAMILY: 25,        // chia đều cho species cùng family với bố hoặc mẹ
  TIER_UP: 9,             // species rarity cao hơn 1 bậc trong family liên quan
  TIER_UP_2: 1,           // cao hơn 2 bậc (very rare)
  BREED_ONLY_LEGENDARY: true,
};
const MUTATIONS: { pair: [BreedId, BreedId]; result: BreedId; weight: number }[];
const OVERRIDES: Record<string, BreedingOutcome[]>; // = BREEDING_MATRIX cũ (golden)

// save v3
interface GiftState { lastCheckedAt: number; nextSpawnAt: number; boxes: GiftBox[] }
interface GiftBox { id: string; spawnedAt: number; seed: number; reward: { gold: number; xp: number } }
```

- **Gift spawn** (trong `advanceWorld`, không timer riêng): mỗi khi `now ≥ nextSpawnAt` → spawn tối đa `MAX_PER_ROLL` hộp (1 + floor(số heo / 6), cap) nhưng tổng ≤ `MAX_ON_FARM` (3). Khoảng chờ = `BASE_INTERVAL × factor(rarity trung bình đàn)` (≈4h COMMON → 6h LEGENDARY). Offline: lặp các mốc đã qua, dừng khi đầy → mở game sau 2 ngày vẫn tối đa 3 hộp. 0 heo → không spawn. Reward chốt lúc spawn (rng inject) = clamp(MIN, MAX, Σ giftWeight(rarity) × growth × variance) → không reroll được bằng reload.
- **Chống chỉnh đồng hồ**: `now < lastCheckedAt` → không tiến (không spawn, không lùi `nextSpawnAt`); chỉ tăng `lastCheckedAt` bằng max. Nhảy giờ tới tương lai bị chặn bởi `MAX_ON_FARM`.
- **Vị trí**: save chỉ lưu `seed`; view suy vị trí thuần từ seed + layout (core không biết layout manifest; heo đi dạo không có trong save). Retry N lần, fallback điểm cố định.
- **Open**: action `openGift({ giftId })` → xoá box (claim 1 lần, tự idempotent vì box không còn) → `GIFT_REWARD` transaction + XP → event `GIFT_OPENED` → FeedbackDirector chạy pop + số bay lên; state đã cộng trước khi số bay (UI chỉ đọc state).
- **FX**: smoke → scale 0→1.15→0.95→1 → bounce → idle float (1 tween lặp/hộp, tối đa 3) — huỷ khi box biến mất; reduceMotion bỏ tween. Catch-up không phát animation (§11.3): hộp spawn offline hiện tĩnh.

## 7. Dependencies

U01 (rarity + species model + save v3) → U02 (catalogue chốt) → U03 (breeding rules) → U04 (shop/collection theo rarity) ; U05 (farm layout/nameplate) độc lập ; U06 (gift) cần U01 (rarity, save v3) ; U07 (asset) cần U02 + skill `image-to-asset` ; U08 polish/perf cuối. Sim kinh tế chạy lại ở U03, U04, U06.

## 8. Rủi ro

- **Kinh tế**: species mua được + quà miễn phí → lạm phát vàng; fuzz §5.5 / `sim:economy` phải xanh trước khi chốt giá. Có thể giải luôn SOFT-LOCK đã biết (hết vàng → kẹt) nhờ quà, nhưng phải đo.
- **Save migration**: enum breed mới + gift state + hoàn tiền skin — sai là hỏng save thật; cần test migrate từ save v1 và v2 fixture.
- **Golden test**: đổi ma trận cũ = vi phạm "không nới golden" → giữ OVERRIDES.
- **Asset**: ~11 species mới cần art cùng style; game phải chạy trên placeholder (D24) — code xong trước, art sau.
- **Order**: order đòi species hiếm chưa từng thấy → không làm được; Q1 (đều) phải đổi sang trọng số theo rarity/đã khám phá.
- **Hiệu năng**: nameplate (text) × 12 heo + 3 hộp quà là nhỏ; rủi ro chính là tween lặp không huỷ → test destroy.
- **Phạm vi**: 9 phase ≈ 9+ session; release v1 đang dở.

## 9. Kế hoạch phase (mỗi phase = 1 task `### Uxx` sẽ thêm vào `PROMPTS_THEO_PHASE.md` sau khi chốt §5)

| Task | Nội dung | Xong khi |
|---|---|---|
| U01 | `rarity.ts`, BreedDef + rarity/family/shop, species FARM (white/black/brown/spotted) từ art có sẵn, save v3 + migrate (D3), skin `allowedBreeds` (D6), foundation clothing (nếu D1 = có) | check xanh, test migrate |
| U02 | `UN_IN_PIG_CATALOGUE.md` từ proposal đã duyệt; thêm species còn lại vào config (placeholder art) | assets:check xanh |
| U03 | `breedingRules.ts` + MUTATIONS + OVERRIDES, test xác suất | golden cũ xanh, test bảng trọng số |
| U04 | Shop tab Heo theo rarity + badge, collection nhóm rarity, order theo rarity | sim:economy xanh |
| U05 | Nhãn công trình không đè heo, nameplate heo + tránh chồng | test layout thuần + xem trên dev |
| U06 | Gift: state, resolveGifts, openGift, placement, FX, save/offline | test offline/clock/claim-once + xem trên dev |
| U07 | Asset species + gift + badge qua `image-to-asset` | assets:release xanh |
| U08 | Polish + perf 5/10/12 heo (+30 qua dev) | fps ghi lại |
