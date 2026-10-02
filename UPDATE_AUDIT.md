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
| `config/breedingMatrix.ts` → `config/breedingRules.ts` | Trọng số theo luật + `MUTATIONS` (bỏ ma trận cặp — D4). `breedingOutcomes(a,b)` luôn trả kết quả. |
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

## 5. Quyết định cuối (user chốt 2026-10-02 — game single-player cá nhân)

Nguyên tắc: mỗi constraint phải có lợi thật cho game single-player này. Không anti-cheat, không chống exploit, không
backward-compat phức tạp, không giới hạn chỉ vì "production thường làm vậy". Vẫn bảo vệ: save, không mất dữ liệu khi
migrate, không phá feature đang chạy, performance, kiến trúc sạch.

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **Clothing = data foundation tối thiểu.** Type `ClothingDef { id, slot, rarity, priceGold }` dùng lại `CosmeticSlot` + field `Pig.cosmetics` đã có; registry rỗng. Không equip action, không shop, không art cho tới khi cần. | Đủ sạch để thêm sau, không tốn gì bây giờ. |
| D2 | **Giữ 1 góc nghiêng + flip** (D23). Không front/back. | Camera hiện tại không cần; tiết kiệm x4 art. |
| D3 | **Migrate save v2→v3, không xoá gì:** heo `PIG_EARTH_PINK` đang mặc skin `pig_white/black/brown/spotted` → **đổi thành species tương ứng** (skin đó vốn là species). Skin đó đã mua mà không heo nào mặc → hoàn giá mua (`SKIN_REFUND`, qua `changeGold`). Mọi skin vẫn nằm trong `ownedSkins`; species được đánh dấu đã khám phá (không thưởng lần 2). Skin trang phục đang mặc trên heo không tương thích → giữ nguyên (chỉ chặn lần mặc mới). | Người chơi giữ nguyên giá trị; migration 1 bước, ít luật. |
| D4 | **Bỏ ma trận cặp, thay bằng luật data-driven** (U03): cùng loài cao → cùng family → bậc hiếm +1 → +2 → mutation theo cặp. 6 cặp cũ không còn là golden; test breeding cũ viết lại theo luật mới. | Thêm species = thêm 1 dòng config, không thêm cặp. |
| D5 | **Trạng thái hiện tại là baseline, không tag v1.0.0.** Giữ tag theo task (`u01`…) vì rẻ và để `git reset` khi cần. R12B (installer) không chặn U-phase. | Chưa release thật. |
| D6 | **Skin trọn thân chỉ cho species tương thích:** skin trang phục vẽ trên thân hồng → `allowedBreeds: ["PIG_EARTH_PINK"]`; skin default của species → chỉ species đó. | Không cần universal skin. |
| D7 | **12 slot không phải luật.** `MAX_SLOTS` + bảng mở slot là data; U05 đo hiệu năng 20–30 heo, ổn thì nâng (mục tiêu 24) và nới bảng slot. | Giới hạn chỉ giữ nếu gameplay/perf cần. |
| D8 | **Hoãn Pig Level/XP.** Thêm sau = 2 field optional trên `Pig` + 1 bước migrate; không có gì hiện tại chặn. | Chưa cần. |
| D9 | **Rarity `COMMON → UNCOMMON → RARE → EPIC → LEGENDARY`**, ánh xạ cố định `P1→COMMON, P2→UNCOMMON, P3→RARE, P4→EPIC, P5→LEGENDARY` (manifest skin giữ key P*, UI hiển thị tên mới). | Một thang cho cả species và skin. |

Thêm: **Gift + đồng hồ** — không anti-cheat; chỉ bỏ qua `now` lùi (tránh state lạ). Giới hạn số hộp trên farm vẫn giữ vì là gameplay (không spam).
**Kinh tế** — `sim:economy` giữ làm công cụ cân bằng, không phải hàng rào chống exploit; số là TUNABLE trong config.
**Species** — duyệt nguyên 19 loại của `PIG_CONCEPT_PROPOSAL.md`; chỉnh sau bằng config.

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

// save v3
interface GiftState { lastCheckedAt: number; nextSpawnAt: number; boxes: GiftBox[] }
interface GiftBox { id: string; spawnedAt: number; seed: number; reward: { gold: number; xp: number } }
```

- **Gift spawn** (trong `advanceWorld`, không timer riêng): mỗi khi `now ≥ nextSpawnAt` → spawn tối đa `MAX_PER_ROLL` hộp (1 + floor(số heo / 6), cap) nhưng tổng ≤ `MAX_ON_FARM` (3). Khoảng chờ = `BASE_INTERVAL × factor(rarity trung bình đàn)` (≈4h COMMON → 6h LEGENDARY). Offline: lặp các mốc đã qua, dừng khi đầy → mở game sau 2 ngày vẫn tối đa 3 hộp. 0 heo → không spawn. Reward chốt lúc spawn (rng inject) = clamp(MIN, MAX, Σ giftWeight(rarity) × growth × variance) → không reroll được bằng reload.
- **Đồng hồ lùi**: `now < lastCheckedAt` → bỏ qua lượt đó (không anti-cheat, chỉ tránh state lạ).
- **Vị trí**: save chỉ lưu `seed`; view suy vị trí thuần từ seed + layout (core không biết layout manifest; heo đi dạo không có trong save). Retry N lần, fallback điểm cố định.
- **Open**: action `openGift({ giftId })` → xoá box (claim 1 lần, tự idempotent vì box không còn) → `GIFT_REWARD` transaction + XP → event `GIFT_OPENED` → FeedbackDirector chạy pop + số bay lên; state đã cộng trước khi số bay (UI chỉ đọc state).
- **FX**: smoke → scale 0→1.15→0.95→1 → bounce → idle float (1 tween lặp/hộp, tối đa 3) — huỷ khi box biến mất; reduceMotion bỏ tween. Catch-up không phát animation (§11.3): hộp spawn offline hiện tĩnh.

## 7. Dependencies

U01 (rarity + species + catalogue + save v3) → U03 (breeding rules) → U04 (shop/collection theo rarity) ; U05 (farm layout/nameplate/perf) độc lập ; U06 (gift) cần U01 ; U07 (asset) cần U01 + skill `image-to-asset` ; U08 polish/perf cuối. Sim kinh tế chạy lại ở U03, U04, U06.

## 8. Rủi ro

- **Kinh tế**: species mua được + quà miễn phí → lạm phát vàng; fuzz §5.5 / `sim:economy` phải xanh trước khi chốt giá. Có thể giải luôn SOFT-LOCK đã biết (hết vàng → kẹt) nhờ quà, nhưng phải đo.
- **Save migration**: enum breed mới + gift state + hoàn tiền skin — sai là hỏng save thật; cần test migrate từ save v1 và v2 fixture.
- **Test breeding cũ**: viết lại theo luật mới (D4, user cho phép).
- **Asset**: ~11 species mới cần art cùng style; game phải chạy trên placeholder (D24) — code xong trước, art sau.
- **Order**: order đòi species hiếm chưa từng thấy → không làm được; Q1 (đều) phải đổi sang trọng số theo rarity/đã khám phá.
- **Hiệu năng**: nameplate (text) × 12 heo + 3 hộp quà là nhỏ; rủi ro chính là tween lặp không huỷ → test destroy.
- **Phạm vi**: 9 phase ≈ 9+ session; release v1 đang dở.

## 9. Kế hoạch phase (block `### Uxx` trong `PROMPTS_THEO_PHASE.md`)

| Task | Nội dung | Xong khi |
|---|---|---|
| U01 | `rarity.ts`; BreedDef + rarity/family/unlockLevel; đủ 19 species (art có sẵn hoặc placeholder); save v3 + migrate D3; skin tương thích D6; clothing foundation D1; `UN_IN_PIG_CATALOGUE.md` | check xanh, test migrate |
| U03 | `breedingRules.ts` (luật + mutation) thay ma trận, test xác suất | test bảng trọng số + Monte Carlo |
| U04 | Shop tab Heo theo rarity + badge, collection nhóm rarity, order theo rarity, sim kinh tế | sim:economy xanh |
| U05 | Nhãn công trình không đè heo, nameplate heo + tránh chồng, đo perf 20–30 heo → nâng MAX_SLOTS (D7) | test layout thuần + xem trên dev |
| U06 | Gift: state v4, resolveGifts, openGift, placement, FX, offline | test offline/claim-once + xem trên dev |
| U07 | Asset species mới + gift + badge qua `image-to-asset` | assets:check xanh |
| U08 | Polish + perf cuối | fps ghi lại |

(U02 gộp vào U01: catalogue và config species làm cùng lúc để không sửa config hai lần.)
