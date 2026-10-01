# HƯỚNG DẪN TRIỂN KHAI — Ủn Ỉn Homemade (Solo Edition)

> **Tài liệu này là gì:** kế hoạch triển khai nhiều session cho game Ủn Ỉn, thiết kế riêng cho Claude Pro $20/tháng.
> **Tài liệu này KHÔNG phải:** luật chơi. Luật chơi nằm ở `UN_IN_GAME_SPEC_v4_SOLO.md`. Khi 2 bên mâu thuẫn, **spec thắng**.
>
> **Nguồn:** đã đọc đầy đủ `README.md`, `UN_IN_GAME_SPEC_v4_SOLO.md` (1497 dòng, kèm Phụ lục A/B/C), `asset/ASSET_PRODUCTION_STANDARD_v1.md`, `asset/AI_ASSET_GENERATION_PACK.md`, `asset/animals/PIG_CATALOGUE.md`, `asset/building/ENVIRONMENT_CATALOGUE.md`. KHÔNG đọc `archive/UN_IN_GAME_SPEC_v3_SOLO.md` theo đúng chỉ dẫn.
>
> **Trạng thái:** chưa viết dòng code nào. Đây là bản phân tích + kế hoạch.

---

# MỤC LỤC

- [A. Tóm tắt dự án](#a-tóm-tắt-dự-án)
- [B. Đánh giá độ phức tạp](#b-đánh-giá-độ-phức-tạp)
- [B-bis. Mâu thuẫn & OPEN QUESTION](#b-bis-mâu-thuẫn--open-question-phát-hiện-trong-spec)
- [C. Bản đồ phụ thuộc](#c-bản-đồ-phụ-thuộc)
- [D. Flow triển khai](#d-flow-triển-khai)
- [E. Bảng Phase](#e-bảng-phase)
- [F. Đặc tả chi tiết từng Phase](#f-đặc-tả-chi-tiết-từng-phase)
- [G. Chiến lược dùng Claude Pro](#g-chiến-lược-dùng-claude-pro)
- [H. Chiến lược Git](#h-chiến-lược-git)
- [I. Chiến lược phục hồi](#i-chiến-lược-phục-hồi)
- [J. Prompt cho từng Phase](#j-prompt-cho-từng-phase)

---

# A. TÓM TẮT DỰ ÁN

## A.1. Game là gì

**Ủn Ỉn Homemade — Solo Edition**: game nuôi heo nhàn (cozy idle farm), chơi đơn tuyệt đối, chạy offline, dữ liệu nằm trên máy người chơi.

| Hạng mục | Chốt |
|---|---|
| Nền tảng | PWA (web), 1 codebase cho PC + mobile, cài được vào màn hình chính (D1) |
| Ngôn ngữ UI | Tiếng Việt, toàn bộ chuỗi nằm ở `src/i18n/vi.ts` (Phụ lục B) |
| Stack | TypeScript strict, Vite, Phaser 3 (chỉ vẽ nông trại), DOM/CSS cho mọi menu, `zod`, `idb`, `vite-plugin-pwa`, Vitest, Playwright (1 smoke test) |
| Backend | **Không có.** IndexedDB + localStorage mirror + backup key + export/import JSON (D2) |
| Kiếm tiền | Không quảng cáo, không gacha, không IAP (D19) |
| Thời gian | Thời gian thật; state tái dựng từ timestamp, không có timer per-pig |

## A.2. Vòng lặp lõi

```text
Đổ đầy máng ăn ──► heo tự ăn & lớn khi app đóng
      │
      ▼
Quay lại ──► tắm, chữa bệnh, xem happiness ──► bán được giá (0.7x–1.2x)
      │                                             │
      ├──► phối giống ──► giống hiếm hơn ───────────┤
      │                                             ▼
      └──► giao đơn NPC (1.5x–2.2x) ──► vàng ──► skin, chuồng, giống tốt
                                                    │
                                          bộ sưu tập đầy dần
```

## A.3. Cơ chế lõi (đã định nghĩa rõ, không được tự chế)

1. **Time engine piecewise** (`advancePig`, §7.2) — tính chính xác số giây heo *được phép* lớn, chứ không áp growth cho cả delta.
2. **Sickness mũ (memoryless)** — `lambda = -ln(1-0.05)/600`. Chạy 1 lần 600s = chạy 600 lần 1s = đúng 5%. Không được "đơn giản hoá" thành roll-per-tick.
3. **Máng ăn closed-form** (`resolveTrough`, §7.3) — tự cho ăn khi app đóng. **Phải chạy TRƯỚC `advancePig`** trong cùng window.
4. **Care budget suy ra từ growth** (D16) — `hungerFullSec = growthSec/3`, `cleanFullSec = growthSec*0.75`. **Tính, không hard-code.**
5. **Happiness suy ra** (D18) — `clamp(round(0.55*clean + 0.45*hunger) - (sick?40:0), 0, 100)` → nhân giá bán `0.7 + 0.5*happiness/100`.
6. **breed ⟂ skin** (D19) — `breed` lo kinh tế/lai giống, `skinId` lo hình ảnh. Skin **không đổi bất kỳ con số nào**.
7. **Đơn NPC sinh từ đồng hồ** (D20) — `windowIndex = floor(now / 4h)`, `mulberry32(hash(windowIndex, slot))`. Không lưu seed.
8. **Heo không chết** (D21) — bỏ bê chỉ mất thời gian và giá bán.
9. **Sprite chỉ vẽ hướng phải** (D23) — trái = `flipX` lúc chạy. Anchor mirror `x' = 1 - x`.
10. **8 visual state = 2 ảnh/heo + 8 overlay dùng chung** (§11 + art standard §3).

## A.4. Ràng buộc kiến trúc bất di bất dịch

```text
src/core/  KHÔNG import từ game/, ui/, store/ hay bất kỳ browser API nào.
src/core/  KHÔNG có Date.now(), KHÔNG có Math.random().
now và rng LUÔN được inject từ ngoài.
Mọi thay đổi vàng đi qua ĐÚNG MỘT helper, helper đó ghi Transaction.
Mọi số nằm ở src/core/config/. Không magic number ở chỗ khác.
Mọi chuỗi tiếng Việt nằm ở src/i18n/vi.ts. Không hard-code text.
Mọi asset nạp qua public/assets/manifest/assets.json. Không hard-code path.
```

## A.5. Khối lượng ước tính

| Nhóm | Ước lượng |
|---|---|
| File TypeScript nguồn | ~75–95 file |
| File test | ~25–35 file, ~350–450 case |
| Cấu hình đã viết sẵn trong spec | Phụ lục A (breeds/skins/names/errors) — chép nguyên văn |
| Chuỗi i18n | Phụ lục B — chép nguyên văn (~280 dòng) |
| Asset wave 0 | 4 hình chữ nhật placeholder |
| Asset wave 1 | 38 ảnh (game trông "xong" với 4 con heo) |
| Asset wave 2 | 33 ảnh (shop có hàng, nông trại có cảnh) |
| Asset đầy đủ | ~245 (116 heo + 129 phụ kiện) — ngoài phạm vi MVP |

**Điểm mấu chốt về asset:** spec đã tách rời code và art. Game **bắt buộc** chạy được trên 4 hình chữ nhật. Vì vậy toàn bộ 24 phase code **không phụ thuộc** vào việc có art thật hay không. Sinh art là một luồng song song, làm bất cứ lúc nào sau Phase 13.

---

# B. ĐÁNH GIÁ ĐỘ PHỨC TẠP

Thang: 🟢 Simple · 🟡 Medium · 🟠 Complex · 🔴 Very Complex

| Subsystem | Mức | Vì sao |
|---|---|---|
| **Core gameplay** (advancePig, growth, sickness) | 🔴 Very Complex | Toán piecewise + mô hình mũ memoryless + bất biến split (`advance(a+b) == advance(a)+advance(b)`). Sai ở đây làm hỏng toàn bộ game và rất khó phát hiện bằng mắt. 12 golden value bắt buộc. |
| **Trough / auto-feed** | 🔴 Very Complex | Closed-form; thứ tự `resolveTrough` → `advancePig` là bẫy chính; spec tự gọi đây là "vùng dễ hỏng nhất". Idempotence + offline 3 ngày + tranh chấp thức ăn theo `slotIndex`. |
| **Game systems** (XP/level/slot/shop/inventory) | 🟡 Medium | Logic tra bảng đơn giản, nhưng ràng buộc "mọi thay đổi vàng ghi Transaction" phải quán xuyến. |
| **UI/UX** (DOM) | 🟠 Complex | Nhiều màn (Farm/Shop/Kho/Đơn/Bộ sưu tập/Lịch sử/Cài đặt), responsive 360px→1280px, nút disable **kèm lý do**, tutorial 5 bước, away-summary modal, toast. Khối lượng lớn là cái khó. |
| **Character/Pig system** | 🟡 Medium | Data model rõ, nhưng `breed ⟂ skin` phải giữ kỷ luật: skin tuyệt đối không chạm vào số. |
| **Accessories / Cosmetics** | 🟠 Complex | **Spec chưa đủ** — xem [C3]. Data model thiếu `ownedCosmetics`. Anchor + mirror + `_flip` là nguồn bug hình ảnh số 1. |
| **Item / Inventory** | 🟢 Simple | 2 item, `Record<ItemId, number>`. |
| **Breeding / Birth** | 🟠 Complex | Ma trận trọng số + slot reservation (D8) + con chốt lúc phối + idempotent birth + `pregnancySec` theo breed (D22). |
| **Orders (NPC)** | 🟠 Complex | Sinh tất định từ đồng hồ nghe đơn giản nhưng có lỗ thiết kế thật — xem [C1], [Q1], [Q2], [Q3]. |
| **Collection book** | 🟢 Simple | Mảng append-only + bonus 1 lần. |
| **Animation / Phaser** | 🟠 Complex | 8 state bằng composition (tween + particle + overlay), Y-sort, scale theo growth, flip + mirror anchor, `reduceMotion`. Debug bằng mắt → tốn nhiều vòng. |
| **Asset pipeline** | 🟡 Medium (code) / 🔴 (sản xuất art) | Phần code: manifest loader + placeholder generator = dễ. Phần vẽ 245 asset với 3–5 lần sinh mỗi cái = rất lớn, nhưng **nằm ngoài luồng code**. |
| **Data architecture** | 🟡 Medium | Type đầy đủ đã cho ở §5. Chủ yếu là chép cho đúng. |
| **Save / Load / Migrate** | 🟠 Complex | IndexedDB + mirror + backup + zod + migration v1→v2 + recovery screen "không bao giờ xoá âm thầm" + export/import + BroadcastChannel multi-tab. |
| **Audio** | 🟢 Simple | 12 key, bật sau user gesture đầu tiên. |
| **VFX** | 🟡 Medium | 5 loại particle dùng chung. |
| **Testing / QA** | 🟠 Complex | §14 có 7 nhóm test bắt buộc + fuzz invariant + assertion chặn build ở `sim:economy`. |
| **Build / PWA / Deploy** | 🟡 Medium | `vite-plugin-pwa` lo phần lớn; update flow và offline verify cần tay. |
| **TỔNG THỂ** | 🟠 **Complex** (không phải Very Complex) | |

## B.1. Kết luận: dự án có quá lớn với Claude Pro không?

**Không — với điều kiện chia phase.** Lý do:

1. **Spec đã hoàn thiện bất thường.** Phụ lục A cho sẵn config nguyên văn, Phụ lục B cho sẵn toàn bộ i18n, §7.2 cho sẵn thân hàm `advancePig`, §7.3 cho sẵn pseudo-code trough. Rất nhiều "công việc thiết kế" đã xong — phần còn lại là chép cho đúng + test.
2. **Kiến trúc pure-core làm mỗi phase đóng kín.** `src/core/` không phụ thuộc trình duyệt, nên Phase 03/04/06/10/11 test được hoàn toàn bằng Vitest, không cần mở app.
3. **Không backend, không mạng, không account** — biến mất cả một mảng công việc.
4. **Game bắt buộc chạy trên placeholder** → không bị chặn bởi art.

Điểm nguy hiểm duy nhất: **cố nhồi nhiều hệ thống vào một session**. Đó chính là thứ kế hoạch này chống lại.

## B.2. Phần ngốn usage nhiều nhất

| Hạng | Phần | Vì sao ngốn |
|---|---|---|
| 1 | **Phaser + visual states** (P14, P15) | Debug bằng mắt, không assert được bằng test, nhiều vòng thử-sai, phải giữ context cả scene lẫn data. |
| 2 | **UI/UX DOM** (P08A/B, P09, P16) | Khối lượng file lớn, mỗi màn đụng i18n + store + CSS. |
| 3 | **Trough + advanceWorld** (P04) | Logic khó, test nhiều, dễ sai thứ tự → sửa đi sửa lại. |
| 4 | **Save/migrate/recovery** (P05) | Nhiều nhánh lỗi, mock IndexedDB trong test tốn công. |
| 5 | **QA cuối** (P20) | Phải đọc lại nhiều file để chạy checklist Phụ lục C. |

## B.3. Phần nào tách, phần nào gộp được

**BẮT BUỘC tách riêng:**
- `advancePig` (P03) ⟂ `resolveTrough` (P04) — hai vùng toán khác nhau, gộp là mất dấu lỗi.
- Save layer (P05) ⟂ Actions (P06) — một bên I/O + schema, một bên logic thuần.
- Phaser scene (P14) ⟂ Visual states (P15) — P14 phải "vẽ được heo lên màn" trước khi bàn tới tween.
- Breeding (P10) ⟂ Orders (P11) ⟂ Collection/Skins (P12) — 3 hệ thống độc lập, mỗi cái một bộ test riêng.
- UI tối thiểu (P08) ⟂ UI polish (P16) — P08 là **cổng đánh giá gameplay**, không trộn với trang trí.

**Gộp được an toàn:**
- types + toàn bộ config + rng + clock (P02) — phần lớn là chép từ Phụ lục A.
- Collection book + skin shop (P12) — chung data path `discovered*`.
- Audio (P17) đủ nhỏ để đứng một mình, hoặc ghép vào P16 nếu usage còn dư.
- Economy sim + fuzz test (P19) — cùng là script/test, không đụng UI.

**TUYỆT ĐỐI KHÔNG gộp:**
```text
❌ "Làm gameplay + UI + inventory + animation + save + audio"
❌ "Làm hết Phase 10, 11, 12 trong một lượt"
❌ "Vừa viết engine vừa dựng Phaser"
❌ "Viết code trước, test sau" — spec bắt viết test cùng lúc
```

---

# B-bis. MÂU THUẪN & OPEN QUESTION PHÁT HIỆN TRONG SPEC

> ⚠️ **Đây là phần quan trọng nhất của bản audit.** Phase 00 tồn tại chỉ để chốt những mục này. Không được biến giả định thành requirement mà không ghi vào `DECISIONS.md`.

## ⛔ MÂU THUẪN THỰC SỰ (spec tự chống lại chính nó)

### C1 — `orders.length <= 3` mâu thuẫn với TTL 8 giờ
- §5.5 (invariant): `orders.length <= 3`. §6.4: `ORDER_MAX_ACTIVE: 3`.
- §6.4: `ORDER_WINDOW_MS = 4h`, `ORDER_TTL_MS = 8h` — "an order outlives its window by one window".
- §8.14: mỗi window sinh 3 đơn mới và thêm vào nếu thiếu; đơn chỉ bị bỏ khi `expiresAt <= now`.
- **Hệ quả:** đơn của window N vẫn sống suốt window N+1 → tại mọi thời điểm có tới **6 đơn**, vi phạm invariant, và `zod` sẽ từ chối chính save mà game vừa tạo ra.
- **OPEN QUESTION Q-C1:** chọn một trong ba: (a) `ORDER_TTL_MS = 4h`; (b) nâng invariant lên `<= 6` và `ORDER_MAX_ACTIVE = 6`; (c) giữ TTL 8h nhưng chỉ nạp đơn mới khi tổng < 3.
- **Khuyến nghị:** **(b)** — giữ đúng ý đồ "đơn sống lâu hơn window một nhịp" mà §6.4 nêu rõ, chỉ sửa 2 con số. (a) phá ý đồ thiết kế; (c) làm việc sinh đơn không còn tất định.

### C2 — Nguồn chân lý về giá/rarity của skin bị đôi
- Phụ lục A.2 (`skins.ts`) chứa `priceGold`, `rarity`, `allowedBreeds` cho 17 skin, và nói "artwork paths **không** nằm ở file này".
- Art standard §7.2 (`assets.json`) **cũng** chứa `priceGold`, `rarity`, `allowedBreeds`, và nói "Thêm skin = **một dòng ở đây + 2 PNG**, không đụng TypeScript".
- **Hệ quả:** hai file cùng khai một con số. Agent sẽ hoặc đọc nhầm, hoặc để lệch; và "thêm skin không đụng code" không thực hiện được nếu `SKINS` là nguồn chân lý.
- **OPEN QUESTION Q-C2:** (a) `assets.json` là nguồn chân lý cho mọi skin, `skins.ts` chỉ giữ 4 breed default + type + loader; (b) ngược lại.
- **Khuyến nghị:** **(a)** — đúng ý đồ art standard và là điều kiện mở rộng lên 116 skin. NHƯNG `src/core/` **không được** đọc file lúc runtime, nên: manifest nạp ở tầng `store/`, validate bằng `zod`, rồi **inject** vào core dưới dạng `SkinRegistry`. Ghi rõ vào `DECISIONS.md`.

### C3 — Cosmetics không tồn tại trong data model
- §8.13: "Cosmetic slots follow the same pattern: `equipCosmetic({ pigId, slot, cosmeticId | null })`".
- Nhưng §5.1 `SaveGame.player` chỉ có `ownedSkins`, **không có `ownedCosmetics`**; `collection` **không có `discoveredCosmetics`**.
- §5.5 chỉ ràng buộc `skinId ∈ ownedSkins`; cosmetic hoàn toàn không bị ràng buộc → equip được cả thứ chưa mua.
- **OPEN QUESTION Q-C3:** (a) đưa cosmetics ra khỏi MVP (giữ field `Pig.cosmetics` luôn rỗng, không action, không shop); (b) bổ sung `player.ownedCosmetics`, `collection.discoveredCosmetics`, invariant và `buyCosmetic`.
- **Khuyến nghị:** **(a)** cho MVP. §6.6 đã giới hạn "MVP skins = 13 P1 + 4 default", và art standard xếp cosmetics vào **Wave 3**. Giữ `Pig.cosmetics` trong schema (để không phải migrate lần nữa) nhưng khoá lại. Ghi thành backlog.

### C4 — `decorBonus` được tham chiếu nhưng không tồn tại
- §20 mục 2: "...feeding the `decorBonus` term reserved in 5.4". §5.4 **không có** `decorBonus`.
- **Phân xử:** tàn dư bản nháp. §20 là Backlog và spec cấm động vào. **Không tạo field này.** Ghi 1 dòng vào `DECISIONS.md` rồi đi tiếp — không cần hỏi.

## ❓ OPEN QUESTION (spec thiếu, không đủ để code an toàn)

### Q1 — Trọng số của `weightedPick(rng, breedsDiscoveredByPlayer)` (§8.14)
Spec nói "weightedPick" nhưng **không cho bảng trọng số**.
**Mặc định khuyến nghị:** phân bố **đều** trên các breed đã khám phá. Đơn giản nhất, đúng tinh thần §0. **Bắt buộc ghi `DECISIONS.md`.**

### Q2 — Đơn hàng bị sinh lại khi tập breed đã khám phá thay đổi
`wantBreed` phụ thuộc `breedsDiscoveredByPlayer`, nhưng `id = "${windowIndex}:${slot}"` chỉ phụ thuộc đồng hồ. Khám phá breed mới **giữa window** → chạy lại `advanceWorld` sinh đơn **khác nội dung, cùng id**, có thể ghi đè `fulfilledAt`.
**Mặc định khuyến nghị:** đơn đã tồn tại trong `state.orders` thì **không bao giờ tái sinh**; chỉ sinh cho `slot` chưa có id tương ứng. **Bắt buộc có test.**

### Q3 — Hàm `hash(windowIndex, slot)` không được đặc tả
**Mặc định khuyến nghị:** `hash = (windowIndex * 0x9E3779B1 ^ (slot + 1) * 0x85EBCA6B) >>> 0`, khoá cứng bằng 3 golden value trong test.

### Q4 — Thứ tự trough/decay khi thức ăn hết giữa window
§7.3 tự thừa nhận: `resolveTrough` cộng hunger cho **cả window**, rồi `advancePig` trừ decay cho **cả window**. Máng cạn giữa chừng → thời điểm ăn bị ghi nhận sai.
**Đây là xấp xỉ có chủ ý, spec chấp nhận.** Phải ghi rõ vào `README.md` mục "Implementation assumptions"; không ai được "sửa" nó mà không sửa luôn golden value §14.1.

### Q5 — Sleep frame thiếu cho skin hiếm
§11 ghi `sleep` = "dedicated `_sleep` frame — yes, 1 frame" như thể mọi skin đều có. Art standard §3.2 nói rõ chỉ 13 P1 + 4 default có `_sleep`; skin hiếm hơn **fallback idle + `fx_zzz`**.
**Phân xử:** art standard thắng về art (README §1). Renderer **bắt buộc** có nhánh fallback khi `sleepAsset` vắng. Cần 1 test.

### Q6 — `trough.capacity` không bao giờ chạm cap 120
`capacity = 20 + (level-1)*10`, `MAX_LEVEL = 10` → tối đa **110**. Hằng 120 là code chết. Không phải lỗi, nhưng ghi chú để người chỉnh balance sau không tưởng nhầm.

### Q7 — Thiếu đặc tả màn "Kho" và "Lịch sử"
`nav` ở Phụ lục B có `inventory: "Kho"` và `history: "Lịch sử"` nhưng §10 không vẽ 2 màn này.
**Mặc định khuyến nghị:** Kho = danh sách item + số lượng + nút dùng nhanh; Lịch sử = danh sách `transactions` (mới nhất trước, tối đa 200) có nhãn loại và số vàng có dấu.

### Q8 — Pool tên heo cạn
Phụ lục A.3 có 22 tên, "cạn thì thêm số". Save không lưu "đã đặt bao nhiêu tên".
**Mặc định khuyến nghị:** chọn tên chưa trùng heo **đang sống**; nếu trùng hết thì thêm hậu tố số nhỏ nhất chưa dùng. Không thêm field.

## ✅ Những phần đã rõ, KHÔNG được hỏi lại

Time engine, sickness model, care budget, happiness, breeding matrix, pregnancy, slot reservation, save/mirror/backup/recovery, export/import, error code list, toàn bộ i18n, balance constants, audio key, cấu trúc thư mục, quy tắc pure-core, quy tắc asset manifest, 12 golden value, D1–D23.

Spec §0 đã nói: *"Đừng hỏi lại những gì tài liệu đã trả lời."*

---

# C. BẢN ĐỒ PHỤ THUỘC

## C.1. Phụ thuộc giữa các hệ thống

```text
                       ┌──────────────────────────┐
                       │  SPEC + DECISIONS.md     │  (P00)
                       └───────────┬──────────────┘
                                   ▼
                       ┌──────────────────────────┐
                       │  Toolchain / skeleton    │  (P01)
                       └───────────┬──────────────┘
                                   ▼
                       ┌──────────────────────────┐
                       │  types + config          │  (P02)
                       │  rng.ts  clock.ts        │
                       └───────────┬──────────────┘
                                   ▼
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌────────────────────┐                     ┌──────────────────┐
   │  advancePig        │ (P03)               │  save schema     │ (P05)
   │  derived values    │                     │  storage/migrate │
   └─────────┬──────────┘                     └────────┬─────────┘
             ▼                                         │
   ┌────────────────────┐                              │
   │  resolveTrough     │ (P04)                        │
   │  advanceWorld      │                              │
   │  GameEvent         │                              │
   └─────────┬──────────┘                              │
             └───────────────┬──────────────────────────┘
                             ▼
                  ┌────────────────────────┐
                  │  actions (P06A/06B)    │  gold+XP helper
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │  gameStore (P07)       │
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │  DOM UI tối thiểu      │  (P08A/08B)
                  │  ★ CỔNG CHƠI THỬ ★     │
                  └───────────┬────────────┘
                              ▼
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
   ┌────────────────┐ ┌──────────────┐ ┌────────────────┐
   │ Shop/Kho/Level │ │  Breeding    │ │   Orders       │
   │  /Slot (P09)   │ │   (P10)      │ │   (P11)        │
   └───────┬────────┘ └──────┬───────┘ └───────┬────────┘
           └─────────────────┼─────────────────┘
                             ▼
                  ┌────────────────────────┐
                  │ Collection + Skins     │ (P12)
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ assets.json + wave 0   │ (P13)
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ Phaser scene (P14)     │
                  │ Visual states (P15)    │
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ UX polish (P16)        │
                  │ Audio (P17)            │
                  │ PWA (P18)              │
                  └───────────┬────────────┘
                              ▼
                  ┌────────────────────────┐
                  │ sim:economy (P19)      │
                  │ QA / Phụ lục C (P20)   │
                  │ Release (P21)          │
                  └────────────────────────┘
```

## C.2. Các cạnh phụ thuộc đáng chú ý

| Cạnh | Bản chất | Hệ quả |
|---|---|---|
| P03 → P04 | `resolveTrough` phải biết `hungerFullSec` và chạy trong cùng khung với `advancePig` | Không được đảo thứ tự 2 phase |
| P02 → P05 | zod schema mô tả đúng type ở P02 | Sửa type sau P05 = phải thêm migration |
| P05 → P06 | Action trả state mới, store persist | Nhưng P06 **không** import storage; chỉ store làm việc đó |
| P04 → P10 | Birth xảy ra **bên trong** `advanceWorld` | P10 sửa `advanceWorld`, phải chạy lại toàn bộ test P03/P04 |
| P04 → P11 | Order refresh cũng nằm trong `advanceWorld` | Như trên |
| P12 → P13 → P14 | `SkinRegistry` (theo Q-C2) do manifest cấp | P14 không được hard-code path |
| P09/P10/P11/P12 song song? | **Không.** Cả 4 đều sửa `advanceWorld` hoặc store | Làm tuần tự, mỗi phase một commit |

## C.3. Những thứ KHÔNG phụ thuộc gì (làm lúc nào cũng được)

- Sinh asset wave 1/2 (luồng art, song song hoàn toàn).
- Soạn nội dung `README.md` (trừ mục "Implementation assumptions" phải cập nhật dần).
- Chuẩn bị file audio CC0.

---

# D. FLOW TRIỂN KHAI

Flow này **không** copy mẫu chung — nó bám đúng §16 của spec (16 bước phát triển) và bổ sung 3 điểm spec không có: audit, checkpoint, và tách asset thành luồng riêng.

```text
                    ┌──────────────────────────────┐
                    │  0. SPEC AUDIT               │  P00
                    │     chốt C1–C4, Q1–Q8        │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  1. FOUNDATION               │  P01
                    │     toolchain + checkpoint   │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  2. PURE CORE — DATA         │  P02
                    │     types, config, rng, clock│
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  3. PURE CORE — TIME ENGINE  │  P03, P04
                    │     ★ vùng rủi ro cao nhất ★ │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  4. PERSISTENCE              │  P05
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  5. ACTIONS + STORE          │  P06A, P06B, P07
                    └──────────────┬───────────────┘
                                   ▼
                ╔══════════════════════════════════════╗
                ║  6. PLAYABLE DOM BUILD               ║  P08A, P08B
                ║     ★★ CỔNG CHƠI THỬ — DỪNG LẠI ★★  ║
                ║     Không vui ở đây thì art vô ích   ║
                ╚══════════════════┬═══════════════════╝
                                   ▼
                    ┌──────────────────────────────┐
                    │  7. PROGRESSION SYSTEMS      │  P09
                    │     shop, kho, level, slot   │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  8. DEPTH SYSTEMS            │  P10 → P11 → P12
                    │     breeding → orders →      │
                    │     collection + skins       │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  9. ASSET PIPELINE           │  P13
                    │     manifest + wave 0        │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 10. RENDER LAYER             │  P14 → P15
                    │     Phaser scene → states    │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 11. EXPERIENCE               │  P16 → P17
                    │     responsive, tutorial,    │
                    │     away summary, audio      │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 12. PLATFORM                 │  P18
                    │     PWA, offline, update     │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 13. BALANCE GUARD            │  P19
                    │     sim:economy + fuzz       │
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 14. QA / Phụ lục C           │  P20
                    └──────────────┬───────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │ 15. RELEASE                  │  P21
                    └──────────────────────────────┘

    ═══ LUỒNG SONG SONG (không chặn code) ═══
    Wave 0 placeholder ──► Wave 1 (38 ảnh) ──► Wave 2 (33 ảnh) ──► Wave 3 (cosmetics)
         (trong P13)          sau P14              sau P15            backlog
```

## D.1. Vì sao flow này, không phải flow mẫu

| Khác biệt với flow mẫu trong yêu cầu | Lý do |
|---|---|
| Thêm **P00 Spec Audit** trước Foundation | Spec có 4 mâu thuẫn thật (C1–C4). Code trước rồi phát hiện sau = phải migrate save. |
| **Core Architecture tách làm 3** (data / engine / persistence) | Time engine là 🔴, gộp với config là tự chuốc khổ. |
| **Playable gate đặt ở P08, trước mọi hệ thống khác** | Chính spec §16 bắt như vậy, và nêu lý do: "nếu không vui ở dạng danh sách text thì art không cứu được". |
| **Character/Pig không phải một phase riêng** | Pig không phải hệ thống độc lập — nó là data model (P02) + engine (P03) + render (P14). Tách ra sẽ trùng lặp. |
| **Accessories bị hạ xuống backlog** | Xem [C3]: data model không đỡ nổi cosmetics. |
| **Asset pipeline đặt sau tất cả hệ thống logic, trước render** | Manifest chỉ cần khi Phaser vẽ. Đặt sớm hơn là làm sớm thứ chưa ai dùng. |
| **Content không phải một phase** | "Content" của game này = config rows + assets.json rows. Đã nằm trong P02/P12/P13. |

---

# E. BẢNG PHASE

**24 phase** (P00–P21, trong đó P06 và P08 đã được tách đôi). Usage: 🟢 LOW · 🟡 MEDIUM · 🟠 HIGH · 🔴 VERY HIGH

| Phase | Tên | Complexity | Usage | Depends on | Mục tiêu chính |
|---|---|---|---|---|---|
| **P00** | Spec Audit & Decision Lock | 🟡 | 🟢 LOW | — | Đọc hết spec, chốt C1–C4 + Q1–Q8 vào `DECISIONS.md`. Không viết code. |
| **P01** | Project Foundation | 🟢 | 🟢 LOW | P00 | Vite + TS strict + Vitest + ESLint/Prettier, cây thư mục, `PROJECT_STATUS.md`, `HANDOVER/`. |
| **P02** | Core Types & Config | 🟡 | 🟡 MED | P01 | `types.ts`, toàn bộ `config/` (Phụ lục A nguyên văn), `rng.ts` (mulberry32), `clock.ts`, `i18n/vi.ts` (Phụ lục B). |
| **P03** | Engine — advancePig & derived | 🔴 | 🟠 HIGH | P02 | `advancePig`, `happiness`, `growthStage`, `level`, `sellPrice`, `freeSlots` + **12 golden value §14.1**. |
| **P04** | Engine — Trough & advanceWorld | 🔴 | 🔴 V.HIGH | P03 | `resolveTrough`, `advanceWorld`, `GameEvent` + **toàn bộ test §14.2**. Vùng dễ hỏng nhất. |
| **P05** | Save & Persistence | 🟠 | 🟠 HIGH | P02, P04 | zod schema, `migrate` v1→v2, IndexedDB + mirror + backup, export/import, recovery + test §14.6. |
| **P06A** | Actions — kinh tế | 🟠 | 🟠 HIGH | P04, P05 | `addGold` helper (ghi Transaction), `addXP`, `buyPig`, `sellPig`, `buyItem`, `renamePig` + test. |
| **P06B** | Actions — chăm sóc | 🟡 | 🟡 MED | P06A | `feedPig`, `cleanPig`, `cleanAll`, `treatPig`, `fillTrough` + test §14.3. |
| **P07** | gameStore | 🟡 | 🟡 MED | P06B | dispatch → advanceWorld → action → persist → notify. 1 interval toàn cục, `visibilitychange`, `BroadcastChannel`. |
| **P08A** | DOM UI — khung + farm | 🟠 | 🟠 HIGH | P07 | Layout §10.1, top bar (vàng/XP/máng), danh sách heo, panel heo chọn §10.2. |
| **P08B** | DOM UI — hành động + ★ CỔNG CHƠI THỬ ★ | 🟡 | 🟡 MED | P08A | Nút hành động, disable **kèm lý do**, confirm bán, dòng happiness→hệ số giá. **DỪNG & CHƠI.** |
| **P09** | Shop / Kho / Level / Slot / Lịch sử | 🟡 | 🟠 HIGH | P08B | `buySlot`, 4 màn còn lại, XP bar, level-up. |
| **P10** | Breeding & Birth | 🟠 | 🟠 HIGH | P09 | `breedPigs`, pregnancy, birth trong `advanceWorld`, picker + xác suất + test §14.4. |
| **P11** | NPC Orders | 🟠 | 🟠 HIGH | P10 | Sinh tất định, hết hạn, `fulfillOrder`, màn Đơn hàng + test §14.5. |
| **P12** | Collection & Skins | 🟡 | 🟡 MED | P11 | `discovered*`, bonus khám phá, `buySkin`/`equipSkin`, màn Bộ sưu tập + shop skin. |
| **P13** | Asset manifest & Wave 0 | 🟢 | 🟢 LOW | P12 | `assets.json` + zod schema + loader + script sinh 4 placeholder PNG. |
| **P14** | Phaser — scene & sprite | 🟠 | 🔴 V.HIGH | P13 | Boot/Preload/MainFarm, vẽ heo từ manifest, Y-sort, scale theo growth, click chọn. |
| **P15** | Phaser — visual states & VFX | 🟠 | 🔴 V.HIGH | P14 | 8 state bằng composition, wandering, particle, overlay, flip + mirror anchor, `reduceMotion`. |
| **P16** | UX — responsive, tutorial, away summary | 🟠 | 🟠 HIGH | P15 | 360px→1280px, touch 44px, tutorial 5 bước, modal "Trong lúc bạn vắng mặt", toast. |
| **P17** | Audio | 🟢 | 🟢 LOW | P16 | 12 key §12, bật sau gesture, toggle setting, credits. |
| **P18** | PWA & Offline | 🟡 | 🟡 MED | P17 | manifest, service worker, precache, update flow, `storage.persist()`, gợi ý cài đặt. |
| **P19** | Economy sim & balance guard | 🟡 | 🟡 MED | P12 (không cần UI) | `scripts/simulate-economy.ts`, assertion chặn build §14.7, fuzz invariant §5.5. |
| **P20** | QA — Phụ lục C, smoke, README | 🟠 | 🟠 HIGH | P18, P19 | Chạy hết checklist Phụ lục C từng dòng, Playwright smoke §14.8, README §17. |
| **P21** | Release & bàn giao cuối | 🟢 | 🟢 LOW | P20 | build production, verify offline, tag, `HANDOVER/FINAL.md`. |

**Ước lượng session Claude Pro:** 🟢 ≈ 1 session · 🟡 ≈ 1–2 · 🟠 ≈ 2–3 · 🔴 ≈ 3–4.
**Tổng thô: ~40–50 session Claude Pro.** Với ~2 session/ngày, khoảng **3–4 tuần**.

## E.1. Cơ sở xếp hạng usage

Không đoán token. Xếp theo 6 tiêu chí spec-driven:

| Phase | File phải đọc | File có thể sửa | Độ phức tạp logic | Vòng test/debug | Context phải giữ | Mức agentic |
|---|---|---|---|---|---|---|
| P03 | 2 (spec §7.2, config) | ~6 | Rất cao | Nhiều (12 golden) | Hẹp, sâu | Thấp (toán thuần) |
| P04 | 3 | ~8 | Rất cao | Rất nhiều | Hẹp, sâu | Thấp |
| P08A | ~10 | ~15 | Trung bình | Ít (mắt) | Rộng | Cao |
| P14 | ~12 | ~12 | Cao | Rất nhiều (mắt) | Rộng + thị giác | Rất cao |
| P15 | ~14 | ~10 | Cao | Rất nhiều | Rộng + thị giác | Rất cao |
| P20 | **toàn repo** | ít | Thấp | Nhiều | Rất rộng | Cao |

**Quy tắc rút ra:** phase 🔴 không phải vì khó, mà vì **debug bằng mắt** (P14/P15) hoặc vì **test dày** (P04). Hai loại này cần session riêng, không ghép với gì khác.

---

# F. ĐẶC TẢ CHI TIẾT TỪNG PHASE

> Mỗi phase có 9 mục: Objective · Input · Tasks · Files/Systems · Dependencies · Expected result · Acceptance Criteria · Verification · Checkpoint.
> **Prompt copy-paste tương ứng nằm ở §J.**

---

## PHASE 00 — Spec Audit & Decision Lock

**Objective** — Đọc toàn bộ tài liệu, xác nhận từng mâu thuẫn ở §B-bis, chốt câu trả lời vào `DECISIONS.md`. **Không viết code.**

**Input** — Chỉ 5 file spec (không đọc `archive/`).

**Tasks**
1. Đọc `README.md`, `UN_IN_GAME_SPEC_v4_SOLO.md` (cả Phụ lục A/B/C), `ASSET_PRODUCTION_STANDARD_v1.md`, `AI_ASSET_GENERATION_PACK.md`, 2 catalogue.
2. Với từng mục C1, C2, C3, C4 — xác nhận lại bằng trích dẫn số section, rồi ghi quyết định.
3. Với từng mục Q1–Q8 — ghi giá trị mặc định đã chọn + lý do.
4. Tạo `DECISIONS.md` ở gốc repo, mỗi quyết định một block: ID · Câu hỏi · Bằng chứng (section) · Quyết định · Ảnh hưởng tới phase nào.
5. Tạo `SPEC_INDEX.md`: bảng "cần biết X → đọc section nào", để các session sau **không phải đọc lại cả spec**.

**Files/Systems** — `DECISIONS.md`, `SPEC_INDEX.md`, `PROJECT_STATUS.md` (khởi tạo).

**Dependencies** — không.

**Expected result** — Repo có 3 file markdown. Không có file code.

**Acceptance Criteria**
- [ ] `DECISIONS.md` có đủ 12 block (C1–C4, Q1–Q8), mỗi block có trích dẫn section làm bằng chứng.
- [ ] `SPEC_INDEX.md` trỏ được ít nhất 25 chủ đề tới đúng section.
- [ ] Không có file `.ts` nào được tạo.

**Verification** — Đọc lại `DECISIONS.md`, kiểm tra không có quyết định nào mâu thuẫn với D1–D23 của spec.

**Checkpoint** — `PROJECT_STATUS.md`: phase hiện tại = P01; ghi rõ mọi quyết định đã chốt để session sau không hỏi lại.

---

## PHASE 01 — Project Foundation

**Objective** — Dựng toolchain chạy được, cây thư mục đúng §4.1, và **bộ máy checkpoint**.

**Input** — `DECISIONS.md`, spec §4, §4.1.

**Tasks**
1. `npm create vite@latest` → template `vanilla-ts`. TypeScript **strict**.
2. Cài: `phaser`, `zod`, `idb`, `vite-plugin-pwa`, `vitest`, `@playwright/test`, `eslint`, `prettier`.
3. Scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `lint`, `format`, `typecheck`, `sim:economy` (tạm stub).
4. Tạo **toàn bộ** cây thư mục §4.1 (thư mục rỗng có `.gitkeep`).
5. **ESLint rule chặn vi phạm kiến trúc:** cấm `src/core/**` import từ `game/`, `ui/`, `store/`; cấm `Date.now()` và `Math.random()` trong `src/core/**` (`no-restricted-syntax`/`no-restricted-globals`). Đây là hàng rào tự động thay cho việc phải nhớ.
6. `git init`, `.gitignore`, commit đầu.
7. Tạo `PROJECT_STATUS.md` và `HANDOVER/` theo template §I.
8. `README.md` khung + mục "Implementation assumptions" rỗng.

**Files/Systems** — `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.eslintrc.cjs`, `.prettierrc`, cây `src/`, `PROJECT_STATUS.md`, `HANDOVER/PHASE-01.md`.

**Dependencies** — P00.

**Expected result** — `npm run dev` mở trang trắng; `npm test` chạy 0 test và pass; `npm run lint` và `npm run typecheck` sạch.

**Acceptance Criteria**
- [ ] `npm run typecheck` 0 lỗi, strict bật.
- [ ] `npm run lint` 0 lỗi.
- [ ] Tạo thử file `src/core/tmp.ts` có `Date.now()` → ESLint **báo lỗi**. Xoá file sau khi thử.
- [ ] Cây thư mục khớp §4.1 từng dòng.

**Verification** — Chạy 4 lệnh: `typecheck`, `lint`, `test`, `build`.

**Checkpoint** — `HANDOVER/PHASE-01.md`: phiên bản package đã cài, lý do chọn rule ESLint, lệnh chạy.

---

## PHASE 02 — Core Types & Config

**Objective** — Đưa toàn bộ dữ liệu tĩnh của game vào code, **nguyên văn theo Phụ lục A và B**.

**Input** — Spec §5 (data model), §6 (config), Phụ lục A (4 file), Phụ lục B (i18n), `DECISIONS.md` (Q-C2 quyết định `skins.ts` giữ gì).

**Tasks**
1. `src/core/types.ts` — chép đúng §5.1, §5.2, §5.3. Không tự thêm field.
2. `src/core/config/breeds.ts` — **nguyên văn Phụ lục A.1** (giữ nguyên helper `care()` — D16 bắt suy ra, không hard-code).
3. `src/core/config/items.ts` — §6.3.
4. `src/core/config/balance.ts` — **nguyên văn §6.4**, có áp quyết định C1 nếu chọn phương án (b).
5. `src/core/config/breedingMatrix.ts` — **nguyên văn §6.5** + `matrixKey()`.
6. `src/core/config/skins.ts` — theo quyết định Q-C2.
7. `src/core/config/names.ts`, `errors.ts` — nguyên văn A.3, A.4.
8. `src/core/rng.ts` — interface `Rng { next(): number }` + `mulberry32(seed)` + `defaultRng` (chỗ **duy nhất** trong repo được dùng `Math.random`, và nó nằm ngoài `core/` hoặc được inject — theo `DECISIONS.md`).
9. `src/core/clock.ts` — interface `Clock` + real + fake.
10. `src/i18n/vi.ts` — **nguyên văn Phụ lục B**.
11. Test: mọi `ErrorCode` đều có message tiếng Việt (§14 — "test asserts totality"); mỗi entry ma trận lai tổng = 100; `matrixKey(a,b) === matrixKey(b,a)`; bảng §6.2 khớp giá trị suy ra từ `growthSec`.

**Files/Systems** — `src/core/types.ts`, `src/core/config/*`, `src/core/rng.ts`, `src/core/clock.ts`, `src/i18n/vi.ts`, `tests/unit/config.test.ts`.

**Dependencies** — P01.

**Expected result** — Không có gameplay, nhưng mọi con số và chuỗi đã ở đúng chỗ.

**Acceptance Criteria**
- [ ] Bảng §6.2 tái tạo được: PINK → `hungerFullSec 2400`, `cleanFullSec 5400`; MYTHICAL → `28800` / `64800`.
- [ ] Test totality ErrorCode ↔ i18n pass.
- [ ] Không có `Math.random` / `Date.now` trong `src/core/` (ESLint từ P01 canh).
- [ ] Không có chuỗi tiếng Việt ngoài `src/i18n/vi.ts` (trừ `nameVi` trong config — đây là **ngoại lệ có chủ ý của spec**, ghi vào `DECISIONS.md`).

**Verification** — `npm test`, `npm run typecheck`, `npm run lint`.

**Checkpoint** — `HANDOVER/PHASE-02.md`: liệt kê từng file config đã tạo và section spec tương ứng, ghi rõ ngoại lệ `nameVi`.

---

## PHASE 03 — Engine: advancePig & derived values

**Objective** — Trái tim của game. Cài `advancePig` đúng đến từng chữ số, và mọi giá trị suy ra.

**Input** — Spec §7.2 (có sẵn thân hàm), §5.4 (derived), §6.2 (rate), §14.1 (12 golden value).

**Tasks**
1. `src/core/engine/advancePig.ts` — chép công thức §7.2. **Tuyệt đối không "tối ưu"** mô hình mũ.
2. `src/core/engine/derived.ts` — `growthStage`, `weight`, `level`, `happiness`, `sellPrice`, `freeSlots` (§5.4).
3. `tests/unit/advancePig.test.ts` — **cả 12 case của §14.1**, dùng fake clock + `mulberry32`.
4. Test `derived`: happiness ở 0/50/100; sellPrice khớp bảng §6.4 (840 / 1140 / 1440 cho PINK); `freeSlots` trừ cả heo mang thai.
5. Ghi vào `README.md` mục "Implementation assumptions" các xấp xỉ đã chấp nhận (Q4).

**Files/Systems** — `src/core/engine/advancePig.ts`, `derived.ts`, `tests/unit/advancePig.test.ts`, `derived.test.ts`.

**Dependencies** — P02.

**Expected result** — Engine thời gian chạy đúng cho một con heo, đã được 12 golden value khoá lại.

**Acceptance Criteria**
- [ ] 12/12 golden value §14.1 pass, **không nới tolerance để test xanh**.
- [ ] Bất biến split: `advance(a+b)` == `advance(a)` rồi `advance(b)` (rng không bao giờ gây bệnh).
- [ ] `now < lastTickedAt` → chỉ đổi `lastTickedAt` (D14).
- [ ] Thống kê bệnh: ~5% trên nhiều lần chạy 600s, có nêu tolerance.
- [ ] Đói (hunger 0) → tỉ lệ bệnh ~2x.

**Verification** — `npm test -- advancePig`. In ra bảng kết quả 12 case cạnh giá trị kỳ vọng để đối chiếu bằng mắt.

**Checkpoint** — `HANDOVER/PHASE-03.md`: dán bảng 12 golden value **kèm số thực đo được**. Đây là bằng chứng session sau không phải chạy lại.

---

## PHASE 04 — Engine: resolveTrough & advanceWorld

**Objective** — Cơ chế khiến game hoạt động lúc app đóng. **Phase rủi ro cao nhất dự án.**

**Input** — Spec §7.3 (pseudo-code), §7.4, §14.2, `DECISIONS.md` (Q4).

**Tasks**
1. `src/core/engine/trough.ts` — closed-form §7.3, duyệt heo theo `slotIndex` tăng dần.
2. `src/core/engine/advanceWorld.ts` — đúng 6 bước §7.4. **Bước 3 (pregnancy) và 4 (orders) để lại hook rỗng**, P10/P11 sẽ điền.
3. `src/core/events.ts` — union `GameEvent` đủ các loại §7.4 bước 5.
4. Diff before/after để sinh event.
5. Test §14.2 **đầy đủ 6 nhóm**, đặc biệt:
   - Thứ tự: heo hunger 50, trough 5, `dt` = 2 period → kết thúc **trên 50**, không phải 0.
   - Idempotence: gọi `advanceWorld` 2 lần cùng `now` → thức ăn chỉ trừ 1 lần.
   - Offline 3 ngày trough đầy: thức ăn không âm, growth cap 100.
6. Ghi lại trong handover **vì sao** thứ tự resolveTrough → advancePig là như vậy.

**Files/Systems** — `src/core/engine/trough.ts`, `advanceWorld.ts`, `src/core/events.ts`, `tests/unit/trough.test.ts`, `advanceWorld.test.ts`.

**Dependencies** — P03.

**Expected result** — Mô phỏng thế giới đầy đủ cho nhiều heo, chạy đúng qua nhiều ngày vắng mặt.

**Acceptance Criteria**
- [ ] Toàn bộ test §14.2 pass.
- [ ] Golden value: PINK 7200s với trough 10 → progress 100, trough còn **4** (§14.1).
- [ ] PINK 7200s không trough → progress **33.33**, không phải 100.
- [ ] `advanceWorld` idempotent với cùng `now`.
- [ ] Test P03 vẫn xanh (không regression).

**Verification** — `npm test`. Chạy thủ công một kịch bản 72h in log từng mốc.

**Checkpoint** — `HANDOVER/PHASE-04.md`: giải thích thứ tự thao tác, liệt kê hook rỗng đang chờ P10/P11 (ghi rõ tên hàm + dòng).

---

## PHASE 05 — Save & Persistence

**Objective** — Lưu không bao giờ mất âm thầm.

**Input** — Spec §9 toàn bộ, §5.5 (invariant), §14.6.

**Tasks**
1. `src/core/save/schema.ts` — zod schema mô tả `SaveGame` + toàn bộ invariant §5.5.
2. `src/core/save/migrate.ts` — chuỗi `vN → vN+1`. v1→v2 phải thêm `trough`, `orders`, `collection`, `player.ownedSkins`, `settings.reduceMotion`, và set `skinId`/`cosmetics` cho mọi heo cũ.
3. `src/core/save/newGame.ts` — starter state D7 + transaction `INITIAL_GOLD`.
4. `src/core/save/storage.ts` — IndexedDB (`idb`) primary + localStorage mirror + backup key. **Đây là file ngoài `core/` về mặt khái niệm nhưng spec xếp trong `core/save/` — giữ nguyên và cô lập browser API vào đúng file này**, ghi rõ vào `DECISIONS.md`.
5. `src/core/save/exportImport.ts` — xuất `un-in-save-YYYYMMDD-HHmm.json`, nhập có validate + confirm.
6. Chuỗi phục hồi: primary → mirror → backup → **màn recovery**, không bao giờ xoá âm thầm.
7. `SAVE_TOO_NEW` khi `schemaVersion` lớn hơn app.
8. Test §14.6 đầy đủ, gồm một save v3 thật (tự dựng) migrate lên v2.

**Files/Systems** — `src/core/save/*`, `tests/unit/save.test.ts`, `migrate.test.ts`.

**Dependencies** — P02, P04.

**Expected result** — Có thể tạo game mới, lưu, nạp, xuất, nhập, và phục hồi từ hỏng.

**Acceptance Criteria**
- [ ] Round-trip: export → import → state **bằng nhau tuyệt đối**.
- [ ] Primary hỏng → tự rơi về mirror; mirror hỏng → backup; tất cả hỏng → recovery screen state, **không wipe**.
- [ ] Migration v1→v2 pass với save v3 thật.
- [ ] `schemaVersion` tương lai bị từ chối.
- [ ] Import JSON sai **không đụng** save hiện có.

**Verification** — `npm test -- save`. Thử tay trong DevTools: xoá IndexedDB → reload → game phục hồi từ mirror.

**Checkpoint** — `HANDOVER/PHASE-05.md`: sơ đồ chuỗi fallback, tên các key storage, cách dựng save v1 để test.

---

## PHASE 06A — Actions: kinh tế

**Objective** — Bộ khung action + quy tắc vàng, rồi 4 action kinh tế.

**Input** — Spec §8 (khung), §8.1, §8.7, §8.10, §8.12, §8.16.

**Tasks**
1. `src/core/actions/_context.ts` — `ActionContext`, `ActionResult` (§8).
2. `src/core/economy/gold.ts` — **helper duy nhất** đổi vàng, luôn ghi `Transaction` (§8.16). Mọi action khác **bắt buộc** đi qua đây.
3. `src/core/economy/xp.ts` — `addXP`, suy ra level, emit `LEVEL_UP`, tính lại `trough.capacity`.
4. `buyPig` (§8.1) — gồm đặt tên từ pool (Q8) và ghi discovery.
5. `sellPig` (§8.7) — giá theo happiness **sau** `advanceWorld`.
6. `buyItem` (§8.10), `renamePig` (§8.12).
7. Test: mọi nhánh lỗi **không đổi state**; **"vàng không bao giờ đổi mà thiếu Transaction"** (test này bắt buộc, §14.3).

**Files/Systems** — `src/core/actions/{buyPig,sellPig,buyItem,renamePig}.ts`, `src/core/economy/*`, `tests/unit/actions.economy.test.ts`.

**Dependencies** — P04, P05.

**Expected result** — Mua/bán được heo bằng test, chưa có UI.

**Acceptance Criteria**
- [ ] Bán ở happiness 0/50/100 cho đúng 840 / 1140 / 1440 (PINK).
- [ ] Bán heo con → `PIG_NOT_MATURE`; bán heo mang thai → `PIG_IS_PREGNANT`; bán lần 2 → `PIG_NOT_FOUND`.
- [ ] `buyPig` chọn `slotIndex` **thấp nhất còn trống**, tôn trọng gender.
- [ ] Test "gold ↔ transaction" pass.

**Verification** — `npm test -- actions`.

**Checkpoint** — `HANDOVER/PHASE-06A.md`: nhấn mạnh helper vàng là cửa duy nhất; liệt kê action còn thiếu.

---

## PHASE 06B — Actions: chăm sóc

**Objective** — 5 action người chơi bấm nhiều nhất.

**Input** — Spec §8.2–§8.6, §14.3, D11 (chống spam XP).

**Tasks**
1. `feedPig` (§8.2) — XP chỉ khi hunger trước ≤ 80.
2. `cleanPig` (§8.3) — XP chỉ khi cleanliness trước ≤ 70; **không chữa bệnh**.
3. `cleanAll` (§8.4) — không bao giờ lỗi; XP theo từng con theo luật D11.
4. `treatPig` (§8.5) — không hồi hunger/clean, không XP.
5. `fillTrough` (§8.6) — lấy từ kho trước, thiếu thì mua bù bằng vàng trong cùng action; 1 transaction `TROUGH_FILL`.
6. Test §14.3 phần chăm sóc + `fillTrough` vượt capacity → `TROUGH_FULL` và **không đổi gì**.

**Files/Systems** — `src/core/actions/{feedPig,cleanPig,cleanAll,treatPig,fillTrough}.ts`, `tests/unit/actions.care.test.ts`.

**Dependencies** — P06A.

**Expected result** — Toàn bộ vòng lặp chăm sóc chạy được qua test.

**Acceptance Criteria**
- [ ] `ALREADY_FULL` / `ALREADY_CLEAN` / `PIG_NOT_SICK` / `INSUFFICIENT_ITEM` đúng chỗ.
- [ ] Luật XP chống spam đúng ở cả 2 ngưỡng.
- [ ] `cleanAll` trên nông trại sạch → `ok: true`, 0 event.
- [ ] `fillTrough` mua bù đúng giá 25/đơn vị và ghi 1 transaction.

**Verification** — `npm test -- actions`.

**Checkpoint** — `HANDOVER/PHASE-06B.md`.

---

## PHASE 07 — gameStore

**Objective** — Cầu nối duy nhất giữa core thuần và thế giới bên ngoài.

**Input** — Spec §4 (data flow), §7.1, §9.1, §9.4.

**Tasks**
1. `src/store/gameStore.ts` — `dispatch(action)` → `advanceWorld` → action → persist → notify.
2. **Một** interval 1 giây toàn cục khi tab hiển thị. Không bao giờ 1 timer/heo.
3. Gọi `advanceWorld` lúc load, lúc `visibilitychange` thành visible, trước mọi action.
4. Persist: sau mỗi action thành công, mỗi event, mỗi 30s, lúc `visibilitychange → hidden` và `pagehide`.
5. `navigator.storage.persist()` sau action thành công đầu tiên.
6. `BroadcastChannel` phát hiện tab thứ hai → tab đó **read-only**.
7. Đăng ký subscriber cho UI và Phaser.

**Files/Systems** — `src/store/gameStore.ts`, `src/store/persistScheduler.ts`, `src/main.ts`.

**Dependencies** — P06B.

**Expected result** — Vòng đời game chạy trong trình duyệt, chưa có giao diện.

**Acceptance Criteria**
- [ ] Chỉ tồn tại **một** interval trong toàn app (kiểm bằng grep `setInterval`).
- [ ] Reload → state giữ nguyên.
- [ ] Mở tab thứ hai → tab đó không ghi save.
- [ ] Action lỗi → **không** persist.

**Verification** — Chạy `npm run dev`, thao tác trong console, reload.

**Checkpoint** — `HANDOVER/PHASE-07.md`: sơ đồ luồng dispatch, danh sách điểm persist.

---

## PHASE 08A — DOM UI: khung + nông trại

**Objective** — Nhìn thấy game lần đầu.

**Input** — Spec §10.1, §10.2, §10.5, Phụ lục B.

**Tasks**
1. Khung app: top bar (Lv/XP · Vàng · 🥣 máng · ⚙) + vùng nông trại + bottom nav 5 tab (§10.1).
2. Nông trại = **danh sách heo dạng text/thẻ**, chưa có Phaser.
3. Panel heo đang chọn theo đúng §10.2: tên, giống, giới tính, thanh tăng trưởng + stage, cân nặng, đói, sạch, sức khoẻ, **happiness kèm hệ số giá**.
4. Gauge máng ở top bar, **đỏ khi = 0**, bấm mở dialog đổ máng.
5. Mọi chuỗi lấy từ `vi.ts`. **Không hard-code chữ.**
6. CSS tối giản, chưa lo responsive (để P16).

**Files/Systems** — `src/ui/screens/FarmScreen.ts`, `src/ui/components/{TopBar,PigCard,PigPanel,TroughGauge,BottomNav}.ts`, `src/ui/styles/*.css`.

**Dependencies** — P07.

**Expected result** — Mở trình duyệt thấy nông trại, chọn được heo, đọc được mọi chỉ số.

**Acceptance Criteria**
- [ ] Dòng happiness hiển thị **cả số lẫn hệ số giá** ("😊 82 → x1.11"). Spec gọi đây là dòng khiến việc chăm sóc có nghĩa.
- [ ] Gauge máng đúng `food/capacity`, đỏ ở 0.
- [ ] `grep -r "[À-ỹ]" src/ui src/game src/store` không ra chuỗi UI nào (trừ import từ `vi.ts`).

**Verification** — `npm run dev`, mở bằng mắt.

**Checkpoint** — `HANDOVER/PHASE-08A.md` + ảnh chụp mô tả bằng chữ.

---

## PHASE 08B — DOM UI: hành động + ★ CỔNG CHƠI THỬ ★

**Objective** — Game **chơi được và phải vui** ở dạng danh sách text. Đây là cổng quan trọng nhất của cả dự án.

**Input** — Spec §10.2, §16 bước 8, §15 (Acceptance Phase 1).

**Tasks**
1. Nút: Cho ăn · Tắm · Tắm tất cả · Thuốc · Bán · (Phối giống/Giao đơn để disable, làm ở P10/P11).
2. **Nút không hợp lệ phải disable KÈM LÝ DO hiển thị** ("Chưa trưởng thành", "Hết thuốc"...). Lấy chuỗi từ `vi.ts`.
3. Dialog xác nhận bán, hiện **giá cuối cùng**. Bắt buộc với SUPERMAN/MYTHICAL.
4. Dialog đổ máng (chọn số lượng, hiện phần phải mua thêm và số vàng).
5. Màn mua heo (chọn giới tính — D6).
6. Toast cho event: bệnh, trưởng thành, hết máng, level up.
7. **DỪNG LẠI. Chơi thật 15 phút.** Ghi cảm nhận vào `HANDOVER/PHASE-08B.md` mục "Playtest notes".

**Files/Systems** — `src/ui/components/{ActionBar,ConfirmDialog,TroughDialog,Toast}.ts`, `src/ui/screens/BuyPigScreen.ts`.

**Dependencies** — P08A.

**Expected result** — Toàn bộ Acceptance Criteria **Phase 1** ở spec §15 đạt.

**Acceptance Criteria** (chép từ spec §15 Phase 1)
- [ ] Lần chạy đầu tạo starter state; mua heo có chọn giới tính; heo sống sót qua reload và qua khởi động lại trình duyệt.
- [ ] Đói/bẩn giảm đúng kể cả sau nhiều giờ vắng mặt.
- [ ] Growth dừng **đúng thời điểm** hunger về 0 hoặc bệnh bắt đầu.
- [ ] Feed / clean / cleanAll / thuốc chạy đúng với đúng mã lỗi.
- [ ] Bán được heo trưởng thành, hệ số happiness hiển thị và đúng.
- [ ] Mọi thay đổi vàng có Transaction.

**Verification** — Chơi thật. Đóng tab 1 tiếng, mở lại, kiểm tra kết quả khớp kỳ vọng.

**Checkpoint** — `HANDOVER/PHASE-08B.md` **bắt buộc có mục "Playtest notes"**: game có vui không, chỗ nào chán, có cần chỉnh balance trước khi đi tiếp không.

> ⛔ **Nếu ở đây game không vui: DỪNG toàn bộ kế hoạch.** Quay lại chỉnh `BALANCE` (đó là lý do §6.4 đánh dấu TUNABLE), chơi lại, rồi mới sang P09. Đây là chỉ dẫn trực tiếp của spec §16 và là chỗ rẻ nhất để phát hiện vấn đề.

---

## PHASE 09 — Shop / Kho / Level / Slot / Lịch sử

**Objective** — Bốn màn còn thiếu + hệ tiến trình.

**Input** — Spec §8.10, §8.11, §8.16, §6.4 (`SLOT_UNLOCKS`), `DECISIONS.md` (Q7).

**Tasks**
1. `buySlot` action (§8.11) — cổng level + cổng vàng + cap 12.
2. Màn **Cửa hàng**: FOOD_BASIC, MEDICINE_COMMON, mở chuồng (hiện level yêu cầu + giá).
3. Màn **Kho** (theo Q7): item + số lượng + dùng nhanh.
4. Màn **Lịch sử** (theo Q7): `transactions` mới nhất trước, nhãn loại, vàng có dấu +/−.
5. Thanh XP + hiệu ứng level up; `trough.capacity` tăng theo level và **hiển thị** được.
6. Test: `buySlot` chặn đúng khi thiếu level / thiếu vàng / đã đủ 12.

**Files/Systems** — `src/core/actions/buySlot.ts`, `src/ui/screens/{ShopScreen,InventoryScreen,HistoryScreen}.ts`.

**Dependencies** — P08B.

**Expected result** — Acceptance **Phase 2** của spec §15 đạt.

**Acceptance Criteria**
- [ ] Đổ máng từ kho **và** từ vàng đều chạy.
- [ ] Heo tự ăn khi vắng mặt (đã có từ P04, giờ nhìn thấy trên UI).
- [ ] Slot mua đúng theo bảng `SLOT_UNLOCKS`, chặn đúng ở level thiếu.
- [ ] Lịch sử giao dịch hiển thị đủ, cắt ở 200 bản ghi.

**Verification** — `npm test`, chơi thử mua slot ở level thấp → thấy thông báo lý do.

**Checkpoint** — `HANDOVER/PHASE-09.md`.

---

## PHASE 10 — Breeding & Birth

**Objective** — Hệ thống lai giống đầy đủ, kể cả sinh nở lúc offline.

**Input** — Spec §8.8, §8.9, §6.5, §14.4, D8, D10, D22.

**Tasks**
1. `breedPigs` (§8.8) — validate **đúng thứ tự 8 bước**, sai thứ tự = sai mã lỗi trả về.
2. Chốt `childBreed` + `childGender` **ngay lúc phối**, lưu vào `pregnancy`.
3. Điền hook pregnancy trong `advanceWorld` (§8.9): con sinh ở slot trống thấp nhất, `lastTickedAt = pregnancy.endsAt`, rồi `advancePig` tới `now`.
4. `BreedingRecord` + `bornAt`.
5. UI: picker bạn đời hợp lệ + **hiển thị xác suất ma trận** trước khi xác nhận; đếm ngược mang thai trong panel heo.
6. Test §14.4 **đầy đủ** — đặc biệt: sinh 2 lần không nhân đôi con; sau 3 ngày offline vẫn sinh; `freeSlots = 0` để mua nhưng sinh vẫn có chỗ.

**Files/Systems** — `src/core/actions/breedPigs.ts`, `src/core/engine/birth.ts`, `src/ui/components/BreedPicker.ts`.

**Dependencies** — P09.

**Expected result** — Từ PINK lai lên được MELON, rồi SUPERMAN, rồi MYTHICAL.

**Acceptance Criteria**
- [ ] Phân bố 10.000 mẫu có seed khớp ma trận trong tolerance.
- [ ] `A+B` cho kết quả như `B+A`.
- [ ] MYTHICAL và tổ hợp không có trong ma trận → `BREEDING_COMBINATION_NOT_SUPPORTED`, **không fallback âm thầm**.
- [ ] Sinh ở `endsAt − 1s` = chưa gì; ở `endsAt` = đúng **một** con; chạy lại vẫn một con.
- [ ] Đổi rng sau khi phối **không** đổi con.
- [ ] Test P03/P04 vẫn xanh.

**Verification** — `npm test`. Chơi thử: phối 2 PINK, đóng tab, mở lại sau khi hết giờ mang thai.

**Checkpoint** — `HANDOVER/PHASE-10.md`: ghi rõ hook nào trong `advanceWorld` đã được điền.

---

## PHASE 11 — NPC Orders

**Objective** — Mục tiêu và lý do để nuôi một con heo cụ thể.

**Input** — Spec §8.14, §6.4 (hằng order), §14.5, `DECISIONS.md` (C1, Q1, Q2, Q3).

**Tasks**
1. `src/core/engine/orders.ts` — sinh tất định: `windowIndex`, `hash` (Q3), `mulberry32`, weightedPick (Q1).
2. **Áp Q2**: đơn đã có trong state **không bao giờ tái sinh**.
3. **Áp C1**: sửa invariant/hằng theo quyết định đã chốt.
4. Điền hook orders trong `advanceWorld`: bỏ đơn hết hạn (`ORDER_EXPIRED`), thêm đơn window hiện tại (`ORDER_NEW`).
5. `fulfillOrder` (§8.14) — kiểm breed / gender / happiness; xoá heo; cộng thưởng; `fulfilledAt`.
6. Màn **Đơn hàng**: 3 thẻ, yêu cầu, thưởng, đồng hồ đếm ngược, nút "Giao đơn" chọn heo hợp lệ.
7. Test §14.5 + golden value cho `hash` (3 giá trị).

**Files/Systems** — `src/core/engine/orders.ts`, `src/core/actions/fulfillOrder.ts`, `src/ui/screens/OrdersScreen.ts`.

**Dependencies** — P10.

**Expected result** — Đơn hàng xuất hiện đều đặn, giao được, thưởng đúng.

**Acceptance Criteria**
- [ ] Cùng `windowIndex` → luôn ra **đúng 3 đơn giống hệt**.
- [ ] `windowIndex` khác → đơn khác.
- [ ] Chỉ breed **đã khám phá** được yêu cầu.
- [ ] Đơn đã giao không giao lại được.
- [ ] Sai breed / sai gender / happiness thiếu → `ORDER_REQUIREMENTS_NOT_MET`.
- [ ] Invariant `orders.length` không bị vi phạm qua fuzz 1000 bước (kiểm chứng C1).

**Verification** — `npm test -- orders`. Dùng fake clock nhảy qua nhiều window.

**Checkpoint** — `HANDOVER/PHASE-11.md`: dán công thức `hash` + 3 golden value của nó.

---

## PHASE 12 — Collection & Skins

**Objective** — Điểm đến cuối game và bể tiêu vàng.

**Input** — Spec §8.13, §8.15, §6.6, Phụ lục A.2, `DECISIONS.md` (Q-C2, Q-C3).

**Tasks**
1. `src/core/engine/discovery.ts` — append-only, bonus **đúng một lần**/breed và /skin, ghi `DISCOVERY_BONUS`, emit `DISCOVERY`. Nối vào `buyPig`, birth, `buySkin`.
2. `buySkin` / `equipSkin` (§8.13) — đủ 5 nhánh lỗi.
3. **Không làm cosmetics** (theo Q-C3 phương án a). Ghi vào backlog.
4. Màn **Bộ sưu tập**: mọi breed + skin đã biết; chưa khám phá hiển thị dạng bóng mờ.
5. Shop skin: lọc theo rarity, hiện giá, hiện điều kiện unlock.
6. Dropdown chọn skin trong panel heo.
7. Test: bonus khám phá bắn đúng 1 lần; `equipSkin` **không đổi bất kỳ con số nào** (so sánh toàn bộ state trừ `skinId`).

**Files/Systems** — `src/core/engine/discovery.ts`, `src/core/actions/{buySkin,equipSkin}.ts`, `src/ui/screens/{CollectionScreen,SkinShopScreen}.ts`.

**Dependencies** — P11.

**Expected result** — Acceptance **Phase 3** của spec §15 đạt.

**Acceptance Criteria**
- [ ] Mua + mặc skin chạy, **không đổi gì ngoài hình**.
- [ ] `SKIN_ALREADY_OWNED` / `SKIN_NOT_OWNED` / `SKIN_BREED_NOT_ALLOWED` đúng chỗ.
- [ ] Bonus khám phá đúng 1 lần/đối tượng, có transaction.
- [ ] Bộ sưu tập hiển thị đủ silhouette cho thứ chưa có.

**Verification** — `npm test`. So sánh state trước/sau `equipSkin` bằng deep-equal có bỏ qua `skinId`.

**Checkpoint** — `HANDOVER/PHASE-12.md`.

---

## PHASE 13 — Asset manifest & Wave 0

**Objective** — Khoá hợp đồng "đổi art không đụng code" **trước khi** có art thật.

**Input** — Art standard §7.2, §7.3, §10 (wave 0), spec §11.

**Tasks**
1. `public/assets/manifest/assets.json` theo đúng schema §7.2 (pigs / cosmetics / fx / props / ui).
2. `src/core/assets/manifestSchema.ts` — zod schema cho manifest.
3. `src/store/assetRegistry.ts` — nạp, validate, expose `SkinRegistry` để **inject** vào core (theo Q-C2). **Core không tự đọc file.**
4. `scripts/make-placeholders.ts` — sinh 4 PNG chữ nhật bo góc có màu: `pig_classic.png`, `pig_watermelon.png`, `pig_superhero.png`, `pig_thienlong.png`, đúng 512×512, chân ở 82%.
5. Thêm placeholder cho 8 `fx_*` và 3 trạng thái máng (cũng là hình khối).
6. Cây thư mục `public/assets/` theo §7.3.
7. Test: manifest pass zod; mọi `skinId` trong `SKINS` đều có row trong manifest; mọi đường dẫn tồn tại trên đĩa.

**Files/Systems** — `public/assets/**`, `scripts/make-placeholders.ts`, `src/store/assetRegistry.ts`.

**Dependencies** — P12.

**Expected result** — Có thể chỉ cho ai đó thấy: thay 1 file PNG → game đổi hình, không đụng `.ts`.

**Acceptance Criteria**
- [ ] `grep -r "\.png" src/` **không ra kết quả nào** (trừ file loader đọc manifest).
- [ ] Manifest validate pass.
- [ ] Test "mọi asset path tồn tại" pass.

**Verification** — `npm test -- assets`. Đổi màu 1 placeholder → reload → thấy đổi.

**Checkpoint** — `HANDOVER/PHASE-13.md`: hướng dẫn 4 bước thêm skin mới (2 PNG + 1 row + 0 dòng TS).

---

## PHASE 14 — Phaser: scene & sprite

**Objective** — Nông trại thật sự, thay cho danh sách text.

**Input** — Spec §11, §4 (Phaser chỉ vẽ nông trại), art standard §4.1, §5.

**Tasks**
1. `BootScene`, `PreloadScene` (nạp từ manifest), `MainFarmScene`.
2. Vẽ heo từ `skinId` → manifest → texture. Scale theo `growthProgress`.
3. **Y-sort**: heo ở dưới vẽ đè lên trên; scale nhẹ theo Y.
4. Click heo → chọn → panel DOM cập nhật. Canvas co giãn theo container.
5. Vẽ máng ăn với 3 trạng thái theo `food` (0 / ≤ capacity/2 / > capacity/2).
6. Đọc anchor từ `*.anchors.json`, cài hàm mirror `x' = 1 − x` — **viết luôn ở đây dù chưa dùng**, art standard gọi đây là bug cosmetic dễ gặp nhất.
7. **Chưa làm** tween/particle (để P15).

**Files/Systems** — `src/game/scenes/*`, `src/game/prefabs/PigSprite.ts`, `src/game/config/phaser.ts`.

**Dependencies** — P13.

**Expected result** — Thấy heo trên nền nông trại, bấm chọn được, hình đúng theo growth.

**Acceptance Criteria**
- [ ] Game chạy hoàn toàn trên placeholder, **không có art thật**.
- [ ] Y-sort đúng khi 2 heo chồng nhau.
- [ ] Máng đổi hình theo mức thức ăn.
- [ ] Canvas responsive, không tràn ngang.
- [ ] `src/game/` **không** import từ `src/core/` bằng đường dẫn tương đối vòng vèo — chỉ đọc state qua store.

**Verification** — `npm run dev`, thay đổi trough food trong console → thấy hình máng đổi.

**Checkpoint** — `HANDOVER/PHASE-14.md`: sơ đồ scene, cách map state → sprite.

---

## PHASE 15 — Phaser: visual states & VFX

**Objective** — 8 trạng thái hình ảnh, **bằng composition chứ không bằng 8 ảnh/heo**.

**Input** — Spec §11 (bảng state), art standard §3, §3.1, §3.2, `DECISIONS.md` (Q5).

**Tasks**
1. `idle` — tween scale "thở" chậm.
2. `walk` — squash/stretch + `flipX`; quay đầu bằng tween `scaleX: 1 → 0 → -1` trong 120ms (art standard §2.4).
3. `eat` — xoay ~8° về phía máng + particle `fx_crumb`.
4. `clean` — emitter `fx_bubble` + tween sáng.
5. `happy` — nhảy + particle `fx_heart`.
6. `sleep` — dùng frame `_sleep`, **fallback về idle + `fx_zzz` khi thiếu** (Q5).
7. `sick` — tint xanh + overlay `fx_sick` gắn ở anchor `fx_above`.
8. `pregnant` — badge `fx_pregnant` ở `fx_above`.
9. Wandering: chỉ thị giác, trong biên nông trại, tạm dừng khi đang tương tác, **không bao giờ đổi state game**.
10. `settings.reduceMotion` tắt wandering + particle + tween không thiết yếu; giá trị khởi tạo lấy từ `prefers-reduced-motion`.

**Files/Systems** — `src/game/prefabs/PigSprite.ts`, `src/game/fx/*`, `src/game/state/pigVisualState.ts`.

**Dependencies** — P14.

**Expected result** — Nông trại sống động, đúng 8 state, chỉ với 2 ảnh/heo + 8 overlay.

**Acceptance Criteria**
- [ ] Đủ 8 state quan sát được.
- [ ] Skin không có `_sleep` → fallback chạy, không vỡ.
- [ ] Anchor mirror đúng khi heo quay trái (overlay không nhảy sang bên kia).
- [ ] `reduceMotion` bật → không còn wandering/particle.
- [ ] Wandering **không** ghi bất cứ gì vào save (kiểm bằng cách so `updatedAt` khi không thao tác gì).

**Verification** — Chơi thử, bật/tắt `reduceMotion`, ép heo bệnh/mang thai bằng console.

**Checkpoint** — `HANDOVER/PHASE-15.md`: bảng state → cách render, để P20 đối chiếu §11.

---

## PHASE 16 — UX: responsive, tutorial, away summary

**Objective** — Trải nghiệm hoàn chỉnh trên điện thoại lẫn máy tính.

**Input** — Spec §10.3, §10.4, §9.5.

**Tasks**
1. Responsive: tối thiểu 360px, thoải mái ≥1280px, desktop từ 1024px. Touch ≥44px, không hover-only, không cuộn ngang, modal thân thiện mobile, bottom nav trên mobile / side panel trên desktop.
2. Tutorial 5 bước, bỏ qua được: mua heo (chọn giới tính) → đổ máng → tắm → xem growth → đọc dòng happiness→giá. Lưu `settings.tutorialDone`.
3. Modal "Trong lúc bạn vắng mặt" khi vắng ≥10 phút, dựng từ event của `advanceWorld`. **Dòng máng ăn là dòng quan trọng nhất** — "Máng ăn hết lúc 03:20, 4 heo ngừng lớn trong 5 giờ".
4. Rà lại toàn bộ nút disable: mọi nút phải có **lý do nhìn thấy được**.
5. Màn Cài đặt: nhạc/sfx/reduceMotion, export/import, cảnh báo lưu trữ trình duyệt (§9.4), nhắc export nếu >7 ngày.
6. Trạng thái loading / rỗng / lỗi cho mọi màn.

**Files/Systems** — `src/ui/screens/{SettingsScreen,TutorialOverlay,AwaySummaryModal}.ts`, `src/ui/styles/responsive.css`.

**Dependencies** — P15.

**Expected result** — Dùng được thật trên điện thoại.

**Acceptance Criteria**
- [ ] 360px không tràn ngang, mọi nút bấm ≥44px.
- [ ] Tutorial chạy từ đầu và bỏ qua được.
- [ ] Away summary hiện sau ≥10 phút, có dòng máng ăn kèm giờ.
- [ ] Nhắc export xuất hiện đúng 1 lần/session khi quá 7 ngày.

**Verification** — DevTools ở 360×640 và 1440×900. Chỉnh `lastTickedAt` lùi 5 giờ để test away summary.

**Checkpoint** — `HANDOVER/PHASE-16.md`.

---

## PHASE 17 — Audio

**Objective** — 12 âm thanh, đúng key, không vi phạm autoplay policy.

**Input** — Spec §12, environment catalogue §6.

**Tasks**
1. `src/game/audio/AudioManager.ts` với **đúng 12 key** §12. Không đặt tên khác.
2. Nhạc nền chỉ bắt đầu **sau user gesture đầu tiên**.
3. Nối event → âm thanh theo bảng §12.
4. Toggle `musicOn` / `sfxOn` trong settings, lưu vào save.
5. Dùng audio gốc hoặc CC0, ghi credit trong `README.md` và màn credits.
6. Placeholder: nếu chưa có file, phát im lặng thay vì lỗi.

**Files/Systems** — `src/game/audio/*`, `public/assets/audio/`, `README.md` (credits).

**Dependencies** — P16.

**Expected result** — Game có tiếng, không có lỗi console.

**Acceptance Criteria**
- [ ] Đúng 12 key, khớp §12 từng chữ.
- [ ] Không phát trước gesture đầu tiên (không có warning autoplay).
- [ ] Tắt sfx → im hẳn.
- [ ] Thiếu file audio → không crash.

**Verification** — Mở console, bấm quanh, kiểm tra không có warning.

**Checkpoint** — `HANDOVER/PHASE-17.md` + danh sách nguồn audio và giấy phép.

---

## PHASE 18 — PWA & Offline

**Objective** — Cài được, chơi offline hoàn toàn.

**Input** — Spec §13, §9.4.

**Tasks**
1. `manifest.webmanifest`: name, short name, `display: standalone`, theme colour, icon 192/512.
2. `vite-plugin-pwa`: precache **toàn bộ** asset đã build.
3. Update flow: có bản mới → hiện "Có bản mới — tải lại". **Không bao giờ tự reload giữa chừng.**
4. Gợi ý "Thêm vào màn hình chính".
5. Kiểm tra không còn **bất kỳ** request ra host ngoài: không CDN font, không analytics.
6. Ghi vào README: web không gửi được thông báo nền; away-summary là thứ thay thế có chủ ý.

**Files/Systems** — `vite.config.ts`, `public/manifest.webmanifest`, `public/icons/*`, `src/ui/components/UpdatePrompt.ts`.

**Dependencies** — P17.

**Expected result** — Cài vào màn hình chính, tắt mạng, vẫn chơi đầy đủ.

**Acceptance Criteria**
- [ ] Tắt mạng sau lần tải đầu → game chạy đủ chức năng.
- [ ] Tab Network: **0 request ra ngoài** lúc runtime.
- [ ] Lighthouse PWA installable pass.
- [ ] Prompt update hiện ra, không tự reload.

**Verification** — `npm run build && npm run preview`, DevTools → Offline, reload.

**Checkpoint** — `HANDOVER/PHASE-18.md`.

---

## PHASE 19 — Economy sim & balance guard

**Objective** — Biến "chăm sóc là có lợi" thành **assertion chặn build**.

**Input** — Spec §14.7, §6.4 (bảng sanity), Phụ lục C mục Balance.

**Tasks**
1. `scripts/simulate-economy.ts` — in theo từng breed: giá bán gốc, số giờ lớn, số đơn vị thức ăn tới khi trưởng thành, chi phí thức ăn, vàng/giờ/slot ở happiness 0/50/100, số giờ chơi để mua được từng slot và từng bậc skin.
2. **Assertion chặn build**: vàng/giờ ở happiness 100 phải ≥ **2×** giá trị ở happiness 0.
3. Kiểm chứng 3 con số sanity §6.4: PINK cần đúng **6** đơn vị thức ăn; lợi nhuận ròng 190 / 490 / 790.
4. Fuzz test invariant §5.5: chạy ngẫu nhiên 1000 action, sau **mỗi** action mọi invariant phải giữ.
5. Nối `sim:economy` vào script kiểm tra trước release.

**Files/Systems** — `scripts/simulate-economy.ts`, `tests/unit/invariants.fuzz.test.ts`.

**Dependencies** — P12 (không cần UI, không cần Phaser — **chạy được sớm nếu muốn**).

**Expected result** — Một lệnh cho biết cân bằng game còn đúng không.

**Acceptance Criteria**
- [ ] `npm run sim:economy` in đủ bảng và **exit 0**.
- [ ] Cố tình sửa `SELL_MULT_SPAN` về 0 → script **fail**. (Thử rồi trả lại.)
- [ ] PINK trưởng thành tốn đúng 6 thức ăn; trough rỗng thì kẹt ở 33.33%.
- [ ] Fuzz 1000 bước không vi phạm invariant nào.

**Verification** — `npm run sim:economy`, `npm test -- fuzz`.

**Checkpoint** — `HANDOVER/PHASE-19.md`: dán nguyên output bảng để lần sau so sánh.

---

## PHASE 20 — QA: Phụ lục C, smoke test, README

**Objective** — Chạy checklist tự kiểm của spec, **từng dòng một**.

**Input** — Phụ lục C (toàn bộ), spec §15 (4 nhóm acceptance), §17 (yêu cầu README), §14.8.

**Tasks**
1. Chạy **từng dòng** Phụ lục C, báo cáo PASS/FAIL kèm bằng chứng (lệnh đã chạy hoặc file đã kiểm).
2. Playwright smoke §14.8: tải mới → mua heo → đổ máng → reload → còn nguyên → export save.
3. Rà lại 4 nhóm Acceptance Criteria §15.
4. Viết `README.md` đầy đủ theo §17: tổng quan, kiến trúc, cài đặt, lệnh dev/build/preview/test, cách save hoạt động, cách cài PWA, cách chỉnh `BALANCE`, cách thêm breed, cách thêm skin **không đụng code**, credit asset, giới hạn đã biết, implementation assumptions.
5. Sửa mọi FAIL. Nếu FAIL cần thay đổi lớn → **không tự sửa trong phase này**, ghi vào `KNOWN_ISSUES.md` và báo cáo.

**Files/Systems** — `README.md`, `tests/e2e/smoke.spec.ts`, `KNOWN_ISSUES.md`.

**Dependencies** — P18, P19.

**Expected result** — Bảng checklist đầy đủ, hầu hết PASS, FAIL có ghi chú rõ.

**Acceptance Criteria**
- [ ] Mọi dòng Phụ lục C có kết luận PASS/FAIL + bằng chứng.
- [ ] Smoke test pass.
- [ ] README có đủ 12 mục §17.
- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` đều sạch.

**Verification** — Chạy cả 4 lệnh + Playwright.

**Checkpoint** — `HANDOVER/PHASE-20.md`: dán **nguyên bảng checklist Phụ lục C** với kết quả.

---

## PHASE 21 — Release & bàn giao cuối

**Objective** — Bản build chạy được và bộ tài liệu bàn giao.

**Input** — Toàn bộ handover trước đó.

**Tasks**
1. `npm run build` production; kiểm tra kích thước bundle.
2. Deploy lên static host (hoặc `npm run preview`), kiểm tra lại offline **trên bản build thật**.
3. Kiểm tra trên 1 điện thoại thật nếu có.
4. `git tag v1.0.0`.
5. `HANDOVER/FINAL.md`: trạng thái toàn bộ, những gì thuộc backlog (§20 spec + cosmetics từ Q-C3), vị trí từng hệ thống, cách sinh asset wave 1/2.
6. Cập nhật `PROJECT_STATUS.md` = DONE.

**Files/Systems** — `dist/`, `HANDOVER/FINAL.md`, `PROJECT_STATUS.md`.

**Dependencies** — P20.

**Expected result** — Game chơi được, cài được, có tài liệu để người khác tiếp tục.

**Acceptance Criteria**
- [ ] Build production chạy offline sau lần tải đầu.
- [ ] Cài được vào màn hình chính.
- [ ] `HANDOVER/FINAL.md` đủ để người mới tiếp tục mà không cần hỏi.

**Verification** — Chơi 30 phút trên bản build thật.

**Checkpoint** — `HANDOVER/FINAL.md`.

---

# G. CHIẾN LƯỢC DÙNG CLAUDE PRO

## G.1. Bộ công cụ vận hành

```text
Claude Code
    +
Git (1 branch/phase, 1 tag/phase)
    +
PROJECT_STATUS.md      ← trạng thái hiện tại, 1 file duy nhất
    +
HANDOVER/PHASE-XX.md   ← nhật ký từng phase, append-only
    +
DECISIONS.md           ← quyết định đã chốt, không bàn lại
    +
SPEC_INDEX.md          ← "cần biết X → đọc section nào"
    +
Phase prompts (§J)     ← copy-paste, mỗi lần 1 phase
```

**`SPEC_INDEX.md` là thứ tiết kiệm usage nhiều nhất.** Spec dài 1497 dòng. Nếu mỗi session đọc lại toàn bộ, bạn đốt phần lớn hạn mức vào việc đọc. `SPEC_INDEX.md` cho phép prompt nói "đọc §7.3 và §14.2" thay vì "đọc cả spec".

## G.2. Khi nào mở session MỚI

| Tình huống | Hành động |
|---|---|
| Vừa xong một phase (đã verify + commit + checkpoint) | ✅ **Luôn mở session mới** |
| Claude bắt đầu đọc lại file nó vừa sửa 5 phút trước | ✅ Mở mới — context đã nhiễu |
| Claude trả lời chậm, hay quên quyết định vừa chốt | ✅ Mở mới |
| Chuyển từ code sang debug bằng mắt (P14/P15) | ✅ Mở mới |
| Đang sửa dở một bug trong cùng file | ❌ Ở lại |
| Test vừa fail, đang tìm nguyên nhân | ❌ Ở lại — context đang có giá trị |

**Quy tắc vàng: một phase = ít nhất một session mới.** Không bao giờ chạy P03 rồi P04 trong cùng một session, kể cả khi còn usage.

## G.3. Khi nào tiếp tục session hiện tại

- Đang trong vòng lặp *viết test → chạy → sửa* trên cùng một module.
- Claude vừa hỏi một câu và bạn đang trả lời.
- Đang refactor một file mà cả file đang trong context.

## G.4. Khi nào chia nhỏ task ngay lập tức

Chia ngay nếu thấy bất kỳ dấu hiệu nào:
- Prompt đụng **hơn 8 file** phải sửa.
- Phase đụng **cả core lẫn UI lẫn Phaser**.
- Claude phải giữ **2 mô hình tư duy** cùng lúc (toán engine + layout CSS).
- Bạn thấy Claude viết code rồi tự sửa lại quá 2 lần cho cùng một chỗ.

Cách chia: thêm hậu tố A/B/C như P06A/P06B, P08A/P08B đã làm. Ví dụ nếu P15 quá lớn:
```text
P15A — idle / walk / eat / clean (4 state bằng tween + particle)
P15B — sleep / sick / pregnant / happy (overlay + fallback Q5)
P15C — wandering + reduceMotion
```

## G.5. Cách giảm context usage — 9 kỹ thuật cụ thể

1. **Chỉ định chính xác section spec cần đọc trong prompt.** "Đọc §7.3 và §14.2" thay vì "đọc spec".
2. **Bắt đọc `PROJECT_STATUS.md` + `DECISIONS.md` TRƯỚC, spec SAU.** Nếu quyết định đã có trong `DECISIONS.md`, không cần mở spec nữa.
3. **Cấm đọc `archive/`** — nhắc trong mọi prompt.
4. **Cấm đọc `PIG_CATALOGUE.md` và `ENVIRONMENT_CATALOGUE.md`** trong mọi phase code. Hai file này chỉ cần cho P13 và cho luồng art. Chúng nặng 44KB và không chứa luật chơi.
5. **Phụ lục A và B chép nguyên văn, không diễn giải.** Nói thẳng trong prompt: "chép nguyên văn, không tối ưu, không đổi tên biến".
6. **Không bắt Claude tóm tắt lại spec.** Tóm tắt tốn token và không tạo ra giá trị — checkpoint mới là thứ cần giữ.
7. **Một prompt = một phase.** Không bao giờ "làm P10 rồi P11 luôn".
8. **Dùng `git diff` thay vì đọc lại file.** Prompt phục hồi nên nói "chạy `git diff HEAD` để biết đang dở gì", rẻ hơn đọc 10 file.
9. **Checkpoint phải chứa KẾT LUẬN, không chứa quá trình.** "12/12 golden value pass, số đo trong bảng dưới" — không phải nhật ký từng lần thử.

## G.6. Cách tránh Claude sửa phần không liên quan

Đưa vào **mọi** prompt (đã có sẵn trong template §J):

```text
- Không viết lại hệ thống không liên quan tới Phase này.
- Không đổi chức năng đã hoàn thành trừ khi có lý do và ghi vào KNOWN_ISSUES.md.
- Đọc code hiện có TRƯỚC khi sửa.
- Tái sử dụng kiến trúc sẵn có.
- Không tự chế requirement. Spec chưa nói → chọn phương án đơn giản nhất và
  ghi vào DECISIONS.md, không tự coi là luật.
- Trước khi kết thúc, chạy `git diff --stat` và giải thích TỪNG file đã đổi.
  File nào không thuộc phạm vi Phase này phải được revert.
```

Bước cuối là hàng rào mạnh nhất — nó buộc Claude tự soi diff của chính mình.

## G.7. Khi Claude gần hết usage

**Dấu hiệu:** Claude Code báo còn ít hạn mức, hoặc bạn ước lượng còn <20%.

```text
1. DỪNG ngay việc bắt đầu task mới.
2. Bảo Claude: "Đưa code về trạng thái an toàn: biên dịch được,
   test đang xanh vẫn xanh. Không bắt đầu gì mới."
3. Bảo Claude cập nhật PROJECT_STATUS.md + HANDOVER/PHASE-XX.md:
   task nào xong, task nào chưa, file nào đã đổi, bước tiếp theo chính xác là gì.
4. Commit (dù phase chưa xong): `wip(phase-XX): <mô tả> — chưa hoàn tất`
5. Đóng session.
```

**Tuyệt đối không** cố "làm nốt cho xong" khi sắp hết usage. Đó là cách tạo ra code dở dang không ai hiểu nổi.

## G.8. Sau khi usage reset

```text
1. Mở session mới.
2. Dán prompt CONTINUE ở §I.2.
3. Để Claude đọc PROJECT_STATUS.md + git log + git diff.
4. Để Claude NÓI LẠI nó hiểu gì trước khi cho phép nó code.
   ← bước này rẻ và cứu bạn khỏi những lần Claude làm lại từ đầu.
5. Xác nhận, rồi mới cho chạy tiếp.
```

## G.9. Lịch làm việc gợi ý

| | |
|---|---|
| Mỗi ngày | 1–2 session, mỗi session 1 phase (hoặc 1 nửa phase 🔴) |
| Sau mỗi phase | commit + tag + checkpoint, **rồi nghỉ** |
| Sau P08B | **chơi thật 15 phút** trước khi đi tiếp — bắt buộc |
| Sau P12 | chơi thật 30 phút; đây là lúc game "đủ" về mặt hệ thống |
| Cuối tuần | chạy `sim:economy` + đọc lại `KNOWN_ISSUES.md` |

## G.10. Ba sai lầm đắt nhất cần tránh

1. **Gộp phase vì "còn usage".** Usage còn không có nghĩa context còn sạch. Phase gộp = checkpoint mờ = session sau phải đọc lại nhiều hơn.
2. **Bỏ qua cổng chơi thử ở P08B.** Spec §16 nói thẳng: nếu không vui ở dạng danh sách text thì art không cứu được. Bỏ qua bước này là rủi ro lớn nhất của cả dự án.
3. **Để Claude "tự sửa cho hợp lý" khi spec mâu thuẫn.** Đó là lý do P00 tồn tại. Mọi mâu thuẫn phải vào `DECISIONS.md` **trước**, không phải được xử lý ngầm lúc code.

---

# H. CHIẾN LƯỢC GIT

## H.1. Quy ước branch và tag

```text
main                      ← chỉ nhận merge từ phase đã verify
  ├── phase/00-spec-audit
  ├── phase/01-foundation
  ├── phase/02-core-config
  ├── phase/03-engine-advance-pig
  ├── phase/04-engine-trough
  ├── phase/05-save
  ├── phase/06a-actions-economy
  ├── phase/06b-actions-care
  ├── phase/07-game-store
  ├── phase/08a-ui-shell
  ├── phase/08b-ui-actions
  ├── phase/09-shop-progression
  ├── phase/10-breeding
  ├── phase/11-orders
  ├── phase/12-collection-skins
  ├── phase/13-assets
  ├── phase/14-phaser-scene
  ├── phase/15-phaser-states
  ├── phase/16-ux
  ├── phase/17-audio
  ├── phase/18-pwa
  ├── phase/19-economy-sim
  ├── phase/20-qa
  └── phase/21-release
```

Mỗi phase xong và **verify đạt** → merge vào `main` → gắn tag:

```bash
git tag phase-04-trough
```

**Tag là điểm quay lui.** Phase sau làm hỏng → `git reset --hard phase-04-trough`.

## H.2. Quy ước commit

```text
feat(phase-XX): <thay đổi>
test(phase-XX): <test đã thêm>
fix(phase-XX): <sửa>
docs(phase-XX): checkpoint + handover
wip(phase-XX): <mô tả> — chưa hoàn tất, xem PROJECT_STATUS.md
```

Commit `docs(phase-XX): checkpoint` **luôn là commit cuối** của mỗi phase. Session sau tìm nó để biết phase trước kết thúc ở đâu.

## H.3. Vòng lặp Claude nên chạy trong mỗi phase

```text
┌──────────────────────────────────────────────────────┐
│ 1. INSPECT                                           │
│    đọc PROJECT_STATUS.md, DECISIONS.md, git log -5   │
│    đọc CHỈ những section spec mà prompt chỉ định     │
│    đọc code hiện có của vùng sắp sửa                 │
├──────────────────────────────────────────────────────┤
│ 2. IMPLEMENT                                         │
│    viết code + test CÙNG LÚC (spec bắt buộc)         │
├──────────────────────────────────────────────────────┤
│ 3. TEST                                              │
│    npm test && npm run typecheck && npm run lint     │
│    KHÔNG nới tolerance để test xanh                  │
├──────────────────────────────────────────────────────┤
│ 4. REVIEW DIFF                                       │
│    git diff --stat → giải thích TỪNG file            │
│    file ngoài phạm vi → revert                       │
├──────────────────────────────────────────────────────┤
│ 5. COMMIT                                            │
│    feat/test/fix theo quy ước                        │
├──────────────────────────────────────────────────────┤
│ 6. CHECKPOINT                                        │
│    PROJECT_STATUS.md + HANDOVER/PHASE-XX.md          │
│    docs(phase-XX): checkpoint                        │
├──────────────────────────────────────────────────────┤
│ 7. STOP — không tự sang phase tiếp theo              │
└──────────────────────────────────────────────────────┘
```

## H.4. Rollback

| Tình huống | Lệnh |
|---|---|
| Phase hiện tại hỏng, chưa commit | `git checkout -- .` |
| Phase hiện tại hỏng, đã commit trên branch | `git reset --hard phase-<XX-1>-<tên>` |
| Đã merge vào main mới phát hiện hỏng | `git revert -m 1 <merge-sha>` (giữ lịch sử) |
| Chỉ 1 file hỏng | `git checkout phase-<XX-1>-<tên> -- <đường dẫn>` |

**Sau mọi rollback: cập nhật `PROJECT_STATUS.md`.** Nếu không, session sau sẽ tin vào checkpoint đã bị huỷ.

---

# I. CHIẾN LƯỢC PHỤC HỒI

## I.1. `PROJECT_STATUS.md` — template

File này **luôn ở gốc repo**, luôn được cập nhật cuối mỗi phase, và là thứ **đầu tiên** mọi session đọc.

```markdown
# PROJECT STATUS — Ủn Ỉn Homemade

**Cập nhật lần cuối:** 2026-XX-XX HH:mm
**Phase hiện tại:** PHASE 05 — Save & Persistence
**Trạng thái phase:** IN_PROGRESS   (NOT_STARTED | IN_PROGRESS | BLOCKED | DONE)
**Commit cuối:** abc1234 `feat(phase-05): add zod schema`
**Tag an toàn gần nhất:** phase-04-trough

---

## Phase đã hoàn thành
| Phase | Tên | Tag | Ghi chú |
|---|---|---|---|
| P00 | Spec Audit | phase-00-spec-audit | 12 quyết định trong DECISIONS.md |
| P01 | Foundation | phase-01-foundation | ESLint chặn Date.now trong core |
| ... | | | |

## Task ĐÃ XONG trong phase hiện tại
- [x] zod schema cho SaveGame
- [x] invariant §5.5 trong schema

## Task CHƯA XONG trong phase hiện tại
- [ ] migrate v1 → v2
- [ ] IndexedDB storage + localStorage mirror
- [ ] export/import
- [ ] recovery screen
- [ ] test §14.6

## BƯỚC TIẾP THEO CHÍNH XÁC
Viết `src/core/save/migrate.ts`. v1→v2 phải thêm: trough, orders, collection,
player.ownedSkins, settings.reduceMotion; set skinId/cosmetics cho mọi heo cũ
từ BREEDS[breed].defaultSkin. Sau đó viết test với một save v3 tự dựng.

## File đã thay đổi trong phase hiện tại
- src/core/save/schema.ts        (mới)
- tests/unit/save.schema.test.ts (mới)

## Quyết định kiến trúc mới phát sinh
- Browser API chỉ được xuất hiện trong src/core/save/storage.ts.
  Mọi file core khác vẫn thuần. (Đã ghi DECISIONS.md #A3)

## Known issues / bug đang mở
- (không có)

## Session sau CẦN BIẾT
- Test IndexedDB dùng `fake-indexeddb`, đã cài ở devDependencies.
- KHÔNG đọc archive/UN_IN_GAME_SPEC_v3_SOLO.md.
- Quyết định C1 (order TTL) đã chốt phương án (b) — đừng bàn lại.
```

## I.2. Prompt CONTINUE — dán khi mở session mới

```text
Tiếp tục dự án Ủn Ỉn Homemade từ checkpoint gần nhất.

TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ:
1. Đọc PROJECT_STATUS.md
2. Đọc DECISIONS.md
3. Đọc HANDOVER/ của phase hiện tại (nếu có)
4. Chạy: git log --oneline -10
5. Chạy: git status && git diff --stat
6. Chạy: npm test 2>&1 | tail -30

SAU ĐÓ, TRƯỚC KHI VIẾT CODE:
Nói lại cho tôi nghe, ngắn gọn:
- Phase nào đang dở
- Task cuối cùng đã hoàn thành là gì
- Task tiếp theo chính xác là gì
- Có file nào đang dở dang / không biên dịch được không

RỒI DỪNG LẠI CHỜ TÔI XÁC NHẬN.

QUY TẮC:
- Không làm lại việc đã xong.
- Chỉ tiếp tục từ task chưa hoàn thành đầu tiên.
- Không bắt đầu phase tiếp theo.
- KHÔNG đọc archive/UN_IN_GAME_SPEC_v3_SOLO.md.
- Chỉ đọc section spec nào thật sự cần cho task tiếp theo
  (tra SPEC_INDEX.md để biết section nào).
```

## I.3. Template `HANDOVER/PHASE-XX.md`

```markdown
# HANDOVER — PHASE XX: <Tên>

**Ngày:** 2026-XX-XX
**Kết quả:** DONE / PARTIAL / ROLLED_BACK
**Tag:** phase-XX-<tên>
**Số session đã dùng:** N

## Đã làm gì
- ...

## File đã tạo / sửa
| File | Vai trò |
|---|---|
| ... | ... |

## Quyết định đã ra trong phase này
| ID | Quyết định | Lý do |
|---|---|---|

## Bằng chứng verify
```
<dán output test / bảng golden value / kết quả lệnh>
```

## Chưa làm (cố ý)
- ...

## Bẫy cho session sau
- ...

## Bước tiếp theo
Phase XX+1 — <tên>. Điều kiện đầu vào đã đủ: <có/chưa>.
```

## I.4. Bốn tình huống bắt buộc phải xử lý

### Case A — Phase hoàn thành bình thường
```text
verify đạt
  → git diff --stat, giải thích từng file
  → commit feat/test
  → merge vào main, gắn tag phase-XX-<tên>
  → cập nhật PROJECT_STATUS.md + HANDOVER/PHASE-XX.md
  → commit docs(phase-XX): checkpoint
  → DỪNG. Đóng session.
  → Session mới cho phase tiếp theo.
```

### Case B — Claude gần hết usage, phase chưa xong
```text
KHÔNG bắt đầu task mới.
  → đưa code về trạng thái biên dịch được, test đang xanh vẫn xanh
  → nếu có code dở không chạy: comment lại hoặc revert phần đó
  → cập nhật PROJECT_STATUS.md thật chi tiết ở mục
    "TASK CHƯA XONG" và "BƯỚC TIẾP THEO CHÍNH XÁC"
  → commit: wip(phase-XX): <mô tả> — chưa hoàn tất
  → đóng session
```
> Điểm mấu chốt: mục **"BƯỚC TIẾP THEO CHÍNH XÁC"** phải cụ thể tới mức
> đọc xong là code được ngay. "Tiếp tục làm save" là vô dụng.
> "Viết `migrate.ts`, hàm `v1ToV2`, thêm 5 field sau: ..." mới dùng được.

### Case C — Hết usage GIỮA phase, checkpoint chưa kịp ghi
```text
Session mới:
  1. Dán prompt CONTINUE (§I.2)
  2. Claude chạy: git log --oneline -10, git status, git diff
  3. Claude chạy: npm test → xem test nào fail
  4. Claude ĐỌC diff để suy ra task cuối cùng đang làm dở
     (đây là lý do commit thường xuyên quan trọng hơn commit đẹp)
  5. Claude BÁO CÁO nó suy ra được gì → BẠN XÁC NHẬN
  6. Nếu code dở đang làm test fail:
     → sửa cho xanh trước, hoặc revert phần dở
     → KHÔNG xây tiếp trên nền đang đỏ
  7. Cập nhật PROJECT_STATUS.md NGAY (bù cho checkpoint đã mất)
  8. Rồi mới tiếp tục
```

### Case D — Claude làm sai
```text
⛔ KHÔNG xây tiếp trên cái sai.

  1. DỪNG implementation ngay.
  2. Xác định nguyên nhân:
     a) hiểu sai spec        → trích section đúng, sửa, ghi DECISIONS.md
     b) sai kiến trúc        → rollback về tag phase trước, làm lại
     c) bug logic cục bộ     → sửa tại chỗ + thêm test bắt được bug đó
     d) spec thật sự mâu thuẫn → DỪNG, hỏi người, ghi vào DECISIONS.md
  3. Với (b): git reset --hard phase-<XX-1>-<tên>
  4. Verify lại toàn bộ test của các phase TRƯỚC — chứng minh đã về nền sạch.
  5. Ghi vào KNOWN_ISSUES.md: đã sai gì, vì sao, đã xử lý thế nào.
  6. MỚI tiếp tục.
```

> **Quy tắc bất biến:** test của phase trước **luôn phải xanh** trước khi
> phase sau bắt đầu. Đây là lưới an toàn duy nhất chống việc hỏng ngầm
> lan qua nhiều phase mà không ai thấy.

---

# J. PROMPT CHO TỪNG PHASE

> **Cách dùng:** mỗi lần mở session Claude Code mới, copy **đúng một** khối dưới đây và dán vào.
> Từ P01 trở đi, mọi prompt đều bắt đầu bằng việc đọc `PROJECT_STATUS.md` — đó là cách session mới lấy lại ngữ cảnh mà không phải đọc lại spec.

**Khối chung xuất hiện trong mọi prompt** (đã nhúng sẵn, không cần thêm):

```text
## Constraints
- Không viết lại hệ thống không liên quan tới Phase này.
- Không đổi chức năng đã hoàn thành trừ khi có lý do, và phải ghi KNOWN_ISSUES.md.
- Đọc code hiện có TRƯỚC khi sửa.
- Tái sử dụng kiến trúc sẵn có.
- Không tự chế requirement. Spec chưa trả lời → chọn phương án đơn giản nhất,
  ghi vào DECISIONS.md, KHÔNG coi đó là luật chơi chính thức.
- KHÔNG đọc archive/UN_IN_GAME_SPEC_v3_SOLO.md.
- KHÔNG đọc PIG_CATALOGUE.md / ENVIRONMENT_CATALOGUE.md (trừ Phase 13).
- Comment trong code viết bằng tiếng Anh.
```

---

## PHASE 00 — SPEC AUDIT & DECISION LOCK

```text
# PHASE 00 — SPEC AUDIT & DECISION LOCK

## Objective
Đọc toàn bộ tài liệu thiết kế game Ủn Ỉn, xác nhận các mâu thuẫn đã biết,
và chốt mọi quyết định còn treo vào DECISIONS.md.
KHÔNG VIẾT DÒNG CODE NÀO trong phase này.

## Context
Đọc, theo đúng thứ tự này:
- README.md
- UN_IN_GAME_SPEC_v4_SOLO.md — TOÀN BỘ, gồm Phụ lục A, B, C
- asset/ASSET_PRODUCTION_STANDARD_v1.md
- asset/AI_ASSET_GENERATION_PACK.md
- asset/animals/PIG_CATALOGUE.md — chỉ §33 (production priority)
- asset/building/ENVIRONMENT_CATALOGUE.md — chỉ §1, §4, §6

KHÔNG đọc archive/UN_IN_GAME_SPEC_v3_SOLO.md. Nó đã bị thay thế và
chứa giá trị cân bằng sai.

## Tasks
1. Đọc hết tài liệu trên.
2. Xác nhận lại 4 mâu thuẫn sau bằng cách trích số section làm bằng chứng,
   rồi ghi quyết định:
   - C1: §5.5 nói orders.length <= 3 và §6.4 nói ORDER_MAX_ACTIVE = 3,
     nhưng ORDER_TTL_MS = 8h > ORDER_WINDOW_MS = 4h, nên đơn của window
     trước vẫn sống trong window sau → có thể tới 6 đơn cùng lúc.
     Đề xuất: nâng invariant lên <= 6 và ORDER_MAX_ACTIVE = 6.
   - C2: Phụ lục A.2 (skins.ts) và art standard §7.2 (assets.json) CÙNG
     khai priceGold / rarity / allowedBreeds. Phải chọn MỘT nguồn chân lý.
     Đề xuất: assets.json là nguồn chân lý; skins.ts chỉ giữ 4 breed default,
     type và loader. Vì src/core/ không được đọc file lúc runtime, manifest
     phải được nạp ở tầng store/, validate bằng zod, rồi INJECT vào core
     dưới dạng SkinRegistry.
   - C3: §8.13 nói có equipCosmetic, nhưng §5.1 không có player.ownedCosmetics
     và §5.5 không ràng buộc cosmetic. Cosmetics không thể sở hữu được.
     Đề xuất: đưa cosmetics ra khỏi MVP. Giữ field Pig.cosmetics trong schema
     (để không phải migrate lần nữa) nhưng khoá lại, không có action, không có shop.
   - C4: §20 nhắc tới "decorBonus reserved in 5.4" nhưng §5.4 không có field đó.
     Đề xuất: không tạo field này. §20 là Backlog, spec cấm động vào.
3. Chốt 8 câu hỏi mở sau (ghi giá trị đã chọn + lý do):
   - Q1: trọng số weightedPick khi sinh đơn hàng (§8.14) không được cho.
         Đề xuất: phân bố ĐỀU trên các breed đã khám phá.
   - Q2: wantBreed phụ thuộc breed đã khám phá, nhưng order id chỉ phụ thuộc
         đồng hồ → khám phá breed giữa window có thể làm đơn bị sinh lại khác nội dung
         cùng id, ghi đè fulfilledAt.
         Đề xuất: đơn đã tồn tại trong state KHÔNG BAO GIỜ tái sinh; chỉ sinh cho
         slot chưa có id tương ứng.
   - Q3: hash(windowIndex, slot) không được đặc tả.
         Đề xuất: (windowIndex * 0x9E3779B1 ^ (slot + 1) * 0x85EBCA6B) >>> 0,
         khoá cứng bằng 3 golden value trong test.
   - Q4: §7.3 tự thừa nhận resolveTrough cộng hunger cho cả window rồi advancePig
         trừ decay cho cả window → thời điểm ăn bị xấp xỉ khi máng cạn giữa chừng.
         Đề xuất: chấp nhận xấp xỉ này (spec đã chấp nhận), ghi vào README mục
         "Implementation assumptions", và cấm sửa mà không sửa luôn golden value §14.1.
   - Q5: §11 nói mọi skin có frame _sleep; art standard §3.2 nói chỉ 13 P1 + 4 default
         có, còn lại fallback idle + fx_zzz.
         Đề xuất: art standard thắng về art. Renderer BẮT BUỘC có nhánh fallback.
   - Q6: trough.capacity = 20 + (level-1)*10, MAX_LEVEL = 10 → tối đa 110,
         nên cap 120 là code chết. Chỉ cần ghi chú, không sửa.
   - Q7: Phụ lục B có nav "Kho" và "Lịch sử" nhưng §10 không vẽ 2 màn này.
         Đề xuất: Kho = item + số lượng + dùng nhanh; Lịch sử = transactions
         mới nhất trước, tối đa 200, có nhãn loại và vàng có dấu.
   - Q8: pool 22 tên heo, "cạn thì thêm số", nhưng save không lưu số đã dùng.
         Đề xuất: chọn tên chưa trùng heo ĐANG SỐNG; trùng hết thì thêm hậu tố
         số nhỏ nhất chưa dùng. Không thêm field.
4. Tạo DECISIONS.md ở gốc repo. Mỗi quyết định một block:
   ID · Câu hỏi · Bằng chứng (số section) · Quyết định · Ảnh hưởng tới Phase nào.
5. Tạo SPEC_INDEX.md: bảng "cần biết X → đọc section nào", tối thiểu 25 chủ đề.
   Mục đích là để các session sau KHÔNG phải đọc lại cả spec 1497 dòng.
6. Tạo PROJECT_STATUS.md lần đầu theo template trong hướng_dẫn_triển_khai.md §I.1.

## Constraints
- KHÔNG viết code. Không tạo file .ts, không chạy npm.
- Không tự ý đổi bất kỳ quyết định D1–D23 nào của spec.
- Nếu bạn thấy đề xuất của tôi ở trên là SAI, hãy nói rõ và đề xuất khác
  kèm bằng chứng từ spec — đừng im lặng làm theo.

## Implementation Rules
- Mọi quyết định phải trích được số section làm bằng chứng.
- Không biến giả định thành requirement mà không ghi vào DECISIONS.md.

## Testing
Không có test ở phase này.

## Acceptance Criteria
- [ ] DECISIONS.md có đủ 12 block (C1–C4, Q1–Q8), mỗi block có trích dẫn section.
- [ ] SPEC_INDEX.md trỏ được ≥25 chủ đề tới đúng section.
- [ ] PROJECT_STATUS.md tồn tại và đúng template.
- [ ] Không có file .ts nào được tạo.

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md (phase tiếp theo = P01);
- ghi lại mọi quyết định đã chốt;
- ghi lại mọi điều còn chưa chắc chắn.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 01 — PROJECT FOUNDATION

```text
# PHASE 01 — PROJECT FOUNDATION

## Objective
Dựng toolchain chạy được, cây thư mục đúng spec §4.1, và bộ máy checkpoint.

## Context
Đọc:
- PROJECT_STATUS.md
- DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §4 và §4.1 (CHỈ 2 section này)

## Tasks
1. Khởi tạo Vite + vanilla-ts. Bật TypeScript strict.
2. Cài: phaser, zod, idb, vite-plugin-pwa, vitest, @playwright/test,
   eslint, prettier, fake-indexeddb.
3. Thêm scripts: dev, build, preview, test, test:watch, lint, format,
   typecheck, sim:economy (stub tạm).
4. Tạo TOÀN BỘ cây thư mục ở §4.1 (thư mục rỗng dùng .gitkeep).
5. Cấu hình ESLint CHẶN vi phạm kiến trúc — đây là hàng rào tự động,
   quan trọng hơn mọi lời nhắc:
   - cấm src/core/** import từ game/, ui/, store/
   - cấm Date.now() trong src/core/**
   - cấm Math.random() trong src/core/**
6. git init, .gitignore, commit đầu tiên.
7. Tạo PROJECT_STATUS.md (nếu chưa có) và thư mục HANDOVER/.
8. Tạo README.md khung, có sẵn mục rỗng "Implementation assumptions".

## Constraints
(khối Constraints chung — xem đầu §J)
- Không viết logic game ở phase này.
- Không cài thư viện ngoài danh sách trên.

## Implementation Rules
- TypeScript strict là bắt buộc, không tắt bất kỳ flag nào.
- Cây thư mục phải khớp §4.1 từng dòng.

## Testing
npm test chạy với 0 test và pass.

## Acceptance Criteria
- [ ] npm run typecheck: 0 lỗi
- [ ] npm run lint: 0 lỗi
- [ ] npm run build: thành công
- [ ] Tạo thử src/core/tmp.ts có Date.now() → ESLint BÁO LỖI. Xoá file sau khi thử
      và dán kết quả thử vào handover.
- [ ] Cây thư mục khớp §4.1

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-01.md: phiên bản package, lý do chọn rule ESLint, danh sách lệnh;
- ghi known issues (nếu có);
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 02 — CORE TYPES & CONFIG

```text
# PHASE 02 — CORE TYPES & CONFIG

## Objective
Đưa toàn bộ dữ liệu tĩnh của game vào code, NGUYÊN VĂN theo Phụ lục A và B.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §5 (data model), §6 (config),
  Phụ lục A (4 file config), Phụ lục B (i18n đầy đủ)

## Tasks
1. src/core/types.ts — chép đúng §5.1, §5.2, §5.3. KHÔNG tự thêm field.
2. src/core/config/breeds.ts — NGUYÊN VĂN Phụ lục A.1.
   Giữ nguyên helper care(): D16 bắt buộc SUY RA hungerFullSec/cleanFullSec
   từ growthSec, không được hard-code kết quả.
3. src/core/config/items.ts — theo §6.3.
4. src/core/config/balance.ts — NGUYÊN VĂN §6.4, có áp quyết định C1 trong DECISIONS.md.
5. src/core/config/breedingMatrix.ts — NGUYÊN VĂN §6.5, kèm matrixKey().
6. src/core/config/skins.ts — theo quyết định C2 trong DECISIONS.md.
7. src/core/config/names.ts và errors.ts — nguyên văn Phụ lục A.3 và A.4.
8. src/core/rng.ts — interface Rng { next(): number }, mulberry32(seed), defaultRng.
   defaultRng là chỗ duy nhất được dùng Math.random và nó phải nằm ngoài core
   hoặc được inject — làm theo DECISIONS.md.
9. src/core/clock.ts — interface Clock, bản real và bản fake.
10. src/i18n/vi.ts — NGUYÊN VĂN Phụ lục B.

## Constraints
(khối Constraints chung)
- Chép nguyên văn Phụ lục A và B. KHÔNG đổi tên biến, KHÔNG "tối ưu",
  KHÔNG rút gọn, KHÔNG bỏ comment.
- Không viết logic engine ở phase này.

## Implementation Rules
- Mọi số của game nằm trong src/core/config/. Không magic number ở chỗ khác.
- Mọi chuỗi tiếng Việt nằm trong src/i18n/vi.ts. Ngoại lệ DUY NHẤT là nameVi
  trong config — đây là ngoại lệ có chủ ý của spec, ghi vào DECISIONS.md.

## Testing
Viết tests/unit/config.test.ts:
- mọi ErrorCode đều có message tiếng Việt (test totality — spec yêu cầu)
- mỗi entry breeding matrix có tổng weight = 100
- matrixKey(a,b) === matrixKey(b,a)
- bảng §6.2 tái tạo được từ growthSec:
  PINK → hungerFullSec 2400, cleanFullSec 5400
  MYTHICAL → 28800 / 64800

## Acceptance Criteria
- [ ] Toàn bộ test config pass
- [ ] npm run typecheck, npm run lint sạch
- [ ] Không có Math.random / Date.now trong src/core/
- [ ] Bảng §6.2 tái tạo đúng

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-02.md: liệt kê từng file config + section spec tương ứng,
  ghi rõ ngoại lệ nameVi;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 03 — ENGINE: advancePig & DERIVED VALUES

```text
# PHASE 03 — ENGINE: advancePig & DERIVED VALUES

## Objective
Cài trái tim mô phỏng thời gian của game, đúng đến từng chữ số, khoá lại
bằng 12 golden value.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §7.2 (có sẵn thân hàm), §5.4 (derived),
  §6.2 (rate), §14.1 (bảng 12 golden value)

## Tasks
1. src/core/engine/advancePig.ts — cài theo đúng §7.2.
2. src/core/engine/derived.ts — growthStage, weight, level, happiness,
   sellPrice, freeSlots theo §5.4.
3. Viết test CÙNG LÚC với code, không để dồn.
4. Ghi vào README.md mục "Implementation assumptions" xấp xỉ đã chấp nhận
   theo quyết định Q4 trong DECISIONS.md.

## Constraints
(khối Constraints chung)
- TUYỆT ĐỐI KHÔNG "đơn giản hoá" mô hình bệnh mũ thành roll-per-tick.
  Spec §7.2 giải thích rõ vì sao: với lambda = -ln(1-0.05)/600, chạy 1 lần
  600s và chạy 600 lần 1s phải cho cùng 5%. Roll-per-tick làm sức khoẻ heo
  phụ thuộc vào tần suất browser chạy vòng lặp.
- KHÔNG hard-code hungerRate / cleanRate. Tính từ BREEDS[breed] (D16).
- KHÔNG nới tolerance của test để nó xanh. Test đỏ nghĩa là code sai.

## Implementation Rules
- now và rng luôn inject, không lấy từ global.
- Hunger và cleanliness không bao giờ ra ngoài [0, 100].
- Bệnh làm đóng băng growth; đói (hunger 0) đóng băng growth và nhân đôi
  hazard bệnh; đói KHÔNG BAO GIỜ giết heo (D21).
- Heo trưởng thành vẫn tiếp tục decay (D4).

## Testing
tests/unit/advancePig.test.ts — CẢ 12 case của §14.1, dùng fake clock
và mulberry32 có seed:
- advance 1200s → hunger 50, cleanliness 77.8, progress 16.67
- advance 2400s → hunger 0, cleanliness 55.6, progress 33.33
- advance 7200s không trough → progress 33.33 (KHÔNG phải 100)
- advance 7200s trough 10 → progress 100, trough còn 4
- cleanliness cắt ngưỡng 30 đúng tại t = 3780s
- heo bệnh: growth không đổi, hunger/cleanliness vẫn giảm
- now < lastTickedAt → không đổi gì trừ lastTickedAt (D14)
- bất biến split: advance(a+b) == advance(a) rồi advance(b), với rng không gây bệnh
- rng.next() = 0 → bệnh ngay khi cleanliness xuống dưới 30
- rng.next() = 0.9999 → không bệnh trong 1 giờ phơi nhiễm
- thống kê: ~5% của các lần phơi nhiễm 600s bị bệnh (NÊU RÕ tolerance)
- đói: tỉ lệ bệnh đo được ~2x so với khi được ăn

tests/unit/derived.test.ts:
- happiness ở 0 / 50 / 100
- sellPrice PINK = 840 / 1140 / 1440 tương ứng
- freeSlots trừ cả heo đang mang thai (D8)

## Acceptance Criteria
- [ ] 12/12 golden value §14.1 pass
- [ ] Bất biến split pass
- [ ] Thống kê bệnh ~5%, đói ~2x, có nêu tolerance
- [ ] npm run typecheck, lint sạch

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-03.md và DÁN BẢNG 12 GOLDEN VALUE kèm số thực đo được
  — đây là bằng chứng để session sau không phải chạy lại;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 04 — ENGINE: resolveTrough & advanceWorld

```text
# PHASE 04 — ENGINE: resolveTrough & advanceWorld

## Objective
Cài cơ chế máng ăn tự động — thứ khiến game hoạt động khi app đã đóng.
Spec gọi đây là VÙNG DỄ HỎNG NHẤT của dự án. Làm chậm và cẩn thận.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, HANDOVER/PHASE-03.md
- UN_IN_GAME_SPEC_v4_SOLO.md §7.3 (pseudo-code closed-form), §7.4, §14.2

## Tasks
1. src/core/engine/trough.ts — cài closed-form §7.3. Duyệt heo theo
   slotIndex TĂNG DẦN để kết quả tất định khi thức ăn không đủ.
2. src/core/engine/advanceWorld.ts — đúng 6 bước §7.4.
   Bước 3 (pregnancy) và bước 4 (orders) để lại HOOK RỖNG có comment rõ ràng
   — Phase 10 và 11 sẽ điền. Ghi tên hàm + số dòng vào handover.
3. src/core/events.ts — union GameEvent đủ các loại ở §7.4 bước 5.
4. Diff before/after để sinh event.

## Constraints
(khối Constraints chung)
- resolveTrough PHẢI chạy TRƯỚC advancePig trong cùng một window.
  Làm ngược lại khiến con heo vừa ăn lúc t=0 trông như bị bỏ đói.
  Spec §7.3 nêu rõ và bắt phải có test cho đúng điểm này.
- KHÔNG sửa advancePig từ Phase 03.
- KHÔNG cài pregnancy hay orders ở phase này — chỉ để hook.

## Implementation Rules
- advanceWorld phải IDEMPOTENT với cùng một giá trị now.
- Auto-feed KHÔNG phát event cho từng bữa. Chỉ phát TROUGH_EMPTY một lần
  khi máng về 0 mà vẫn còn ít nhất một con đói.
- trough.food không bao giờ âm, không bao giờ vượt capacity.

## Testing
tests/unit/trough.test.ts — TOÀN BỘ §14.2:
- Thứ tự thao tác: heo hunger 50, trough 5, dt = 2 period
  → kết thúc window TRÊN 50, không phải 0
- Trough 1 đơn vị, 3 heo đói: con có slotIndex thấp nhất được ăn;
  kết quả giống hệt nhau ở mọi lần chạy
- Trough rỗng cả window: growth kẹt tại tHungerZero
- advanceWorld 2 lần cùng now: thức ăn chỉ bị trừ MỘT lần
- Offline 3 ngày với trough đầy: thức ăn bị tiêu thụ, không âm, growth cap 100
- fillTrough vượt capacity → TROUGH_FULL và KHÔNG đổi gì
  (nếu fillTrough chưa có ở phase này thì test phần capacity ở mức engine)

## Acceptance Criteria
- [ ] Toàn bộ test §14.2 pass
- [ ] Golden value: PINK 7200s + trough 10 → progress 100, trough còn 4
- [ ] PINK 7200s không trough → progress 33.33
- [ ] advanceWorld idempotent
- [ ] TOÀN BỘ test của Phase 03 VẪN XANH

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-04.md: giải thích VÌ SAO thứ tự resolveTrough → advancePig
  là như vậy, và liệt kê chính xác hook rỗng nào đang chờ Phase 10/11
  (tên hàm + số dòng);
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 05 — SAVE & PERSISTENCE

```text
# PHASE 05 — SAVE & PERSISTENCE

## Objective
Hệ thống lưu không bao giờ mất dữ liệu âm thầm.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §9 (toàn bộ), §5.1, §5.5 (invariant), §14.6

## Tasks
1. src/core/save/schema.ts — zod schema cho SaveGame, bao gồm TOÀN BỘ
   invariant §5.5.
2. src/core/save/migrate.ts — chuỗi migration vN → vN+1.
   v1→v2 phải thêm: trough, orders, collection, player.ownedSkins,
   settings.reduceMotion; và set skinId/cosmetics cho MỌI heo cũ từ
   BREEDS[breed].defaultSkin.
3. src/core/save/newGame.ts — starter state D7 (5000 vàng, 0 heo,
   10 FOOD_BASIC, 1 MEDICINE_COMMON, 4 slot, trough capacity 20, trough rỗng)
   kèm transaction INITIAL_GOLD.
4. src/core/save/storage.ts — IndexedDB (idb) làm primary, localStorage
   mirror, backup key. Tên store và key lấy đúng từ §5 đầu section.
5. src/core/save/exportImport.ts — xuất un-in-save-YYYYMMDD-HHmm.json;
   nhập có validate + xác nhận ghi đè + giữ save cũ làm backup.
6. Chuỗi phục hồi: primary → mirror → backup → MÀN RECOVERY.
   KHÔNG BAO GIỜ xoá âm thầm.
7. schemaVersion lớn hơn app → SAVE_TOO_NEW, từ chối ghi đè.

## Constraints
(khối Constraints chung)
- Browser API (IndexedDB, localStorage) CHỈ được xuất hiện trong
  src/core/save/storage.ts. Mọi file core khác vẫn phải thuần.
  Ghi ngoại lệ này vào DECISIONS.md.
- KHÔNG đổi types.ts từ Phase 02. Nếu buộc phải đổi, DỪNG và báo cáo —
  đổi type sau phase này nghĩa là phải thêm migration.

## Implementation Rules
- Validate bằng zod ở mọi lần load và mọi lần import.
- Trước khi ghi đè, copy save tốt hiện tại sang backup key.
- Không bao giờ start-new-game mà không có xác nhận tường minh của người chơi.

## Testing
tests/unit/save.test.ts và migrate.test.ts — §14.6:
- Round-trip: export → import → state BẰNG NHAU TUYỆT ĐỐI
- IndexedDB hỏng → rơi về mirror; mirror hỏng → backup;
  tất cả hỏng → recovery state, KHÔNG wipe
- Migration v1 (dựng một save v3 thật) → v2
- schemaVersion tương lai bị từ chối
- Import JSON sai / schema sai KHÔNG đụng tới save hiện có
- Fuzz: invariant §5.5 giữ nguyên sau mọi thao tác
Dùng fake-indexeddb cho test.

## Acceptance Criteria
- [ ] Toàn bộ test §14.6 pass
- [ ] Round-trip export/import bằng nhau tuyệt đối
- [ ] Chuỗi fallback 3 tầng chạy đúng, không wipe
- [ ] Migration v1→v2 pass
- [ ] Test Phase 03, 04 vẫn xanh

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-05.md: sơ đồ chuỗi fallback, tên các key storage,
  cách dựng save v1 để test;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 06A — ACTIONS: KINH TẾ

```text
# PHASE 06A — ACTIONS: KINH TẾ

## Objective
Dựng khung action + quy tắc vàng bất di bất dịch, rồi cài 4 action kinh tế.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §8 (khung + danh sách error code),
  §8.1, §8.7, §8.10, §8.12, §8.16

## Tasks
1. src/core/actions/_context.ts — ActionContext và ActionResult theo §8.
2. src/core/economy/gold.ts — HELPER DUY NHẤT thay đổi vàng, luôn ghi
   một Transaction. Mọi action khác BẮT BUỘC đi qua đây (§8.16).
3. src/core/economy/xp.ts — addXP, suy ra level, emit LEVEL_UP,
   tính lại trough.capacity khi lên level.
4. buyPig (§8.1) — gồm đặt tên từ pool theo quyết định Q8, và ghi discovery
   (phần discovery đầy đủ làm ở Phase 12; ở đây chỉ append vào mảng).
5. sellPig (§8.7) — giá tính SAU khi advanceWorld đã chạy.
6. buyItem (§8.10), renamePig (§8.12).

## Constraints
(khối Constraints chung)
- Mỗi action là HÀM THUẦN: chạy advanceWorld trước, rồi validate, rồi trả
  state MỚI. Validate thất bại KHÔNG BAO GIỜ đổi state.
- KHÔNG cho action tự gọi storage. Chỉ store (Phase 07) mới persist.
- Không cài action chăm sóc ở phase này — đó là Phase 06B.

## Implementation Rules
- Mọi thay đổi vàng đi qua đúng một helper. Không có ngoại lệ.
- Transaction giữ tối đa 200 bản ghi, mới nhất trước, cũ nhất bị loại.

## Testing
tests/unit/actions.economy.test.ts:
- Bán ở happiness 0 / 50 / 100 → 840 / 1140 / 1440 (PINK)
- Bán heo con → PIG_NOT_MATURE
- Bán heo mang thai → PIG_IS_PREGNANT
- Bán cùng con lần 2 → PIG_NOT_FOUND
- buyPig chọn slotIndex thấp nhất còn trống, tôn trọng gender (D6)
- buyPig thiếu vàng / hết chỗ → đúng mã lỗi, KHÔNG đổi state
- renamePig: trim, 1–16 ký tự, loại ký tự điều khiển
- TEST BẮT BUỘC: vàng không bao giờ thay đổi mà thiếu Transaction

## Acceptance Criteria
- [ ] Toàn bộ test trên pass
- [ ] Mọi nhánh lỗi đều KHÔNG đổi state
- [ ] Test "gold ↔ transaction" pass
- [ ] Test Phase 03, 04, 05 vẫn xanh

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-06A.md: nhấn mạnh helper vàng là cửa duy nhất;
  liệt kê action còn thiếu;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 06B — ACTIONS: CHĂM SÓC

```text
# PHASE 06B — ACTIONS: CHĂM SÓC

## Objective
Cài 5 action người chơi bấm nhiều nhất.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, HANDOVER/PHASE-06A.md
- UN_IN_GAME_SPEC_v4_SOLO.md §8.2 → §8.6, §14.3

## Tasks
1. feedPig (§8.2) — tiêu 1 FOOD_BASIC, hunger = min(100, hunger + 50).
   XP +2 CHỈ KHI hunger trước khi ăn ≤ 80 (D11, chống spam).
2. cleanPig (§8.3) — miễn phí, cleanliness = 100.
   XP +2 CHỈ KHI cleanliness trước ≤ 70. KHÔNG chữa bệnh.
3. cleanAll (§8.4) — tắm mọi heo có cleanliness < 100 trong một dispatch.
   KHÔNG BAO GIỜ lỗi; nông trại sạch sẵn → ok: true, 0 event.
   XP theo từng con, cùng luật D11.
4. treatPig (§8.5) — tiêu 1 MEDICINE_COMMON, isSick = false.
   KHÔNG hồi hunger/cleanliness, KHÔNG XP.
5. fillTrough (§8.6) — lấy từ inventory trước; thiếu thì mua bù ngay trong
   cùng action ở giá shop; ghi MỘT transaction TROUGH_FILL cho số vàng
   thực sự đã tiêu (0 nếu lấy hết từ kho).
   trough.capacity = min(120, 20 + (level-1)*10), tính lại mỗi lần lên level.

## Constraints
(khối Constraints chung)
- Mọi thay đổi vàng đi qua helper ở Phase 06A.
- KHÔNG sửa engine từ Phase 03/04.

## Implementation Rules
- Luật XP chống spam (D11) phải đúng CHÍNH XÁC ở cả hai ngưỡng 80 và 70.
- Validate thất bại không đổi state.

## Testing
tests/unit/actions.care.test.ts — §14.3:
- feed: ALREADY_FULL; XP chỉ khi ≤80; item chỉ trừ một lần; hunger cap 100
- clean: ALREADY_CLEAN; XP chỉ khi ≤70; KHÔNG chữa bệnh
- cleanAll: không lỗi trên nông trại sạch; XP đúng theo từng con
- treat: PIG_NOT_SICK; INSUFFICIENT_ITEM
- fillTrough: vượt capacity → TROUGH_FULL và KHÔNG đổi gì;
  mua bù đúng 25 vàng/đơn vị; đúng 1 transaction

## Acceptance Criteria
- [ ] Toàn bộ test trên pass
- [ ] Luật XP chống spam đúng ở cả 2 ngưỡng
- [ ] Test các phase trước vẫn xanh

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-06B.md;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 07 — gameStore

```text
# PHASE 07 — gameStore

## Objective
Cầu nối duy nhất giữa core thuần và thế giới bên ngoài (DOM, Phaser, storage).

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §4 (sơ đồ data flow), §7.1, §9.1, §9.4

## Tasks
1. src/store/gameStore.ts — dispatch(action):
   advanceWorld → action → persist (chỉ khi ok: true) → notify UI/Phaser.
2. MỘT interval 1 giây toàn cục khi tab đang hiển thị.
   TUYỆT ĐỐI KHÔNG một timer cho mỗi heo.
3. Gọi advanceWorld: lúc app load, lúc visibilitychange thành visible,
   và trước mọi action.
4. Persist: sau mỗi action thành công, sau mỗi event từ advanceWorld,
   mỗi 30 giây khi tab mở, lúc visibilitychange → hidden, và lúc pagehide.
5. Gọi navigator.storage.persist() sau action thành công đầu tiên.
6. BroadcastChannel phát hiện tab thứ hai → tab đó READ-ONLY,
   không được ghi save.
7. Cơ chế subscribe cho UI và Phaser.

## Constraints
(khối Constraints chung)
- src/core/ vẫn phải thuần. Store là nơi duy nhất chạm now thật, rng thật,
  và storage.
- Không viết UI ở phase này.

## Implementation Rules
- Action lỗi → KHÔNG persist.
- Persist sau khi có event là bắt buộc: đó là thứ chặn người chơi reload
  trang để quay lại kết quả bệnh (§7.4 bước 6).

## Testing
- Test đơn vị cho logic dispatch với clock giả.
- Kiểm thủ công trong trình duyệt cho phần interval / visibility / BroadcastChannel.

## Acceptance Criteria
- [ ] grep "setInterval" trong src/ chỉ ra ĐÚNG MỘT kết quả
- [ ] Reload → state giữ nguyên
- [ ] Mở tab thứ hai → tab đó không ghi save
- [ ] Action lỗi không persist

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-07.md: sơ đồ luồng dispatch, danh sách mọi điểm persist;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 08A — DOM UI: KHUNG + NÔNG TRẠI

```text
# PHASE 08A — DOM UI: KHUNG + NÔNG TRẠI

## Objective
Nhìn thấy game lần đầu. DOM thuần, KHÔNG Phaser, KHÔNG art.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §10.1 (layout), §10.2 (panel heo), §10.5 (i18n)
- src/i18n/vi.ts (đã có từ Phase 02)

## Tasks
1. Khung app theo §10.1: top bar (Lv/XP · Vàng · gauge máng · nút cài đặt),
   vùng nông trại ở giữa, bottom nav 5 tab.
2. Vùng nông trại = DANH SÁCH HEO dạng thẻ/text. KHÔNG dùng Phaser.
3. Panel heo đang chọn theo ĐÚNG §10.2: tên (chạm để đổi), giống, giới tính,
   thanh tăng trưởng + stage, cân nặng, đói, sạch, sức khoẻ,
   và DÒNG HAPPINESS KÈM HỆ SỐ GIÁ BÁN.
4. Gauge máng ở top bar: hiện food/capacity, ĐỎ khi = 0, bấm mở dialog đổ máng.
5. Mọi chuỗi lấy từ src/i18n/vi.ts.
6. CSS tối giản. CHƯA lo responsive — đó là Phase 16.

## Constraints
(khối Constraints chung)
- KHÔNG dùng Phaser ở phase này. Spec §16 bắt game phải chơi được bằng
  DOM thuần trước.
- KHÔNG hard-code chuỗi tiếng Việt trong src/ui/.
- KHÔNG sửa core.

## Implementation Rules
- Dòng happiness PHẢI hiện cả số lẫn hệ số giá, ví dụ "😊 82 → x1.11".
  Spec §10.2 nói rõ: thiếu dòng này thì người chơi không hiểu vì sao
  phải tắm cho heo. Đây là dòng làm cho việc chăm sóc có nghĩa.
- UI chỉ đọc state qua store, không tự tính lại luật game.

## Testing
Kiểm bằng mắt qua npm run dev. Chưa cần test tự động cho UI.

## Acceptance Criteria
- [ ] Mở trình duyệt thấy nông trại, chọn được heo, đọc được mọi chỉ số
- [ ] Dòng happiness hiện cả số lẫn hệ số giá
- [ ] Gauge máng đúng và đỏ khi = 0
- [ ] grep chuỗi tiếng Việt trong src/ui, src/store: không có
      (trừ import từ vi.ts)

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-08A.md, mô tả bằng chữ những gì đang hiển thị;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 08B — DOM UI: HÀNH ĐỘNG + ★ CỔNG CHƠI THỬ ★

```text
# PHASE 08B — DOM UI: HÀNH ĐỘNG + CỔNG CHƠI THỬ

## Objective
Game phải CHƠI ĐƯỢC và PHẢI VUI ở dạng danh sách text.
Đây là cổng quan trọng nhất của toàn dự án.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, HANDOVER/PHASE-08A.md
- UN_IN_GAME_SPEC_v4_SOLO.md §10.2, §15 (Acceptance Phase 1),
  §16 (bước 8 và đoạn giải thích ngay sau bảng)

## Tasks
1. Hàng nút hành động: Cho ăn · Tắm · Tắm tất cả · Thuốc · Bán.
   Nút Phối giống và Giao đơn hiện nhưng DISABLE (Phase 10, 11 sẽ bật).
2. Nút không hợp lệ phải DISABLE KÈM LÝ DO NHÌN THẤY ĐƯỢC
   ("Chưa trưởng thành", "Hết thuốc", "Hết chỗ chứa", "Chưa đủ vui vẻ").
   Lấy chuỗi từ vi.ts.
3. Dialog xác nhận khi bán, hiện GIÁ CUỐI CÙNG.
   Bắt buộc với PIG_SUPERMAN và PIG_MYTHICAL.
4. Dialog đổ máng: chọn số lượng, hiện phần phải mua thêm và số vàng sẽ tiêu.
5. Màn mua heo: chọn giới tính (D6).
6. Toast cho event: bệnh, trưởng thành, hết máng, lên level.
7. SAU KHI XONG: dừng lại. Tôi sẽ chơi thử 15 phút.

## Constraints
(khối Constraints chung)
- Vẫn KHÔNG Phaser, KHÔNG art.
- Không thêm hệ thống mới (không shop, không breeding, không orders).

## Implementation Rules
- Không nút nào được im lặng không làm gì. Hoặc chạy, hoặc disable kèm lý do.

## Testing
Chơi thật. Kiểm tra toàn bộ Acceptance Criteria Phase 1 của spec §15.
Đóng tab 1 giờ, mở lại, đối chiếu kết quả với kỳ vọng.

## Acceptance Criteria (chép từ spec §15 Phase 1)
- [ ] Lần chạy đầu tạo starter state; tutorial chưa cần có (Phase 16)
- [ ] Mua heo có chọn giới tính; heo sống sót qua reload VÀ qua khởi động lại trình duyệt
- [ ] Đói và bẩn giảm đúng, kể cả sau nhiều giờ vắng mặt
- [ ] Growth dừng ĐÚNG thời điểm hunger về 0 hoặc bệnh bắt đầu
- [ ] Feed / clean / cleanAll / thuốc chạy đúng với đúng mã lỗi
- [ ] Bán được heo trưởng thành; hệ số happiness hiển thị và đúng
- [ ] Mọi thay đổi vàng đều có Transaction

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-08B.md, BẮT BUỘC có mục "Playtest notes":
  game có vui không, chỗ nào chán, có cần chỉnh BALANCE trước khi đi tiếp không;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
DỪNG LẠI HOÀN TOÀN. Đây là cổng chơi thử của spec §16.
Không bắt đầu Phase 09 cho tới khi tôi xác nhận game đã vui.
Nếu game chưa vui: đề xuất chỉnh BALANCE (§6.4 đánh dấu TUNABLE),
KHÔNG đề xuất thêm tính năng.
```

---

## PHASE 09 — SHOP / KHO / LEVEL / SLOT / LỊCH SỬ

```text
# PHASE 09 — SHOP / KHO / LEVEL / SLOT / LỊCH SỬ

## Objective
Bốn màn còn thiếu và hệ tiến trình.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md (đặc biệt quyết định Q7)
- UN_IN_GAME_SPEC_v4_SOLO.md §8.10, §8.11, §8.16,
  §6.4 (bảng SLOT_UNLOCKS), §15 (Acceptance Phase 2)

## Tasks
1. Action buySlot (§8.11): slot kế tiếp = unlockedSlots + 1;
   > MAX_SLOTS → MAX_SLOTS_REACHED; thiếu level → LEVEL_TOO_LOW;
   thiếu vàng → INSUFFICIENT_GOLD.
2. Màn Cửa hàng: FOOD_BASIC, MEDICINE_COMMON, và mở chuồng
   (hiện giá + level yêu cầu, disable kèm lý do khi chưa đủ).
3. Màn Kho theo quyết định Q7: item + số lượng + nút dùng nhanh.
4. Màn Lịch sử theo Q7: transactions mới nhất trước, tối đa 200,
   nhãn loại và số vàng có dấu +/−.
5. Thanh XP + hiệu ứng lên level; trough.capacity tăng theo level và
   hiển thị được trên UI.

## Constraints
(khối Constraints chung)
- KHÔNG làm breeding, orders, collection, skins ở phase này.

## Implementation Rules
- buySlot đi qua helper vàng ở Phase 06A.
- Lịch sử chỉ đọc, không sửa được.

## Testing
- buySlot: chặn đúng khi thiếu level, thiếu vàng, đã đủ 12 slot
- Bảng SLOT_UNLOCKS được tôn trọng từng dòng

## Acceptance Criteria (spec §15 Phase 2)
- [ ] Đổ máng từ kho VÀ từ vàng đều chạy
- [ ] Heo tự ăn khi vắng mặt (đã có từ Phase 04, giờ nhìn thấy trên UI)
- [ ] Shop, kho, XP, level, luật XP chống spam, mua slot có cổng level,
      và màn lịch sử đều chạy
- [ ] Test các phase trước vẫn xanh

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-09.md;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 10 — BREEDING & BIRTH

```text
# PHASE 10 — BREEDING & BIRTH

## Objective
Hệ thống lai giống đầy đủ, kể cả sinh nở khi app đã đóng nhiều ngày.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, HANDOVER/PHASE-04.md (để biết hook rỗng ở đâu)
- UN_IN_GAME_SPEC_v4_SOLO.md §8.8, §8.9, §6.5 (ma trận), §14.4

## Tasks
1. breedPigs (§8.8) — validate theo ĐÚNG THỨ TỰ 8 bước trong spec.
   Sai thứ tự sẽ trả về sai mã lỗi và test sẽ bắt được.
2. childBreed (ngẫu nhiên có trọng số từ ma trận) và childGender (50/50)
   được CHỐT NGAY LÚC PHỐI và lưu vào pregnancy.
3. Điền hook pregnancy trong advanceWorld (§8.9):
   - tạo con ở slot trống thấp nhất (D8 bảo đảm luôn có)
   - lastTickedAt = pregnancy.endsAt, RỒI advancePig tới now
     (để thời gian lớn lúc offline được tính)
   - mother.pregnancy = null
   - BreedingRecord.bornAt = pregnancy.endsAt
   - emit BIRTH
4. UI: picker bạn đời hợp lệ, HIỂN THỊ XÁC SUẤT ma trận trước khi xác nhận;
   đếm ngược mang thai trong panel heo.

## Constraints
(khối Constraints chung)
- KHÔNG đổi advancePig / resolveTrough. Chỉ điền hook đã để sẵn.
- PIG_MYTHICAL KHÔNG lai được (D10). Tổ hợp không có trong ma trận →
  BREEDING_COMBINATION_NOT_SUPPORTED, TUYỆT ĐỐI không fallback âm thầm.

## Implementation Rules
- Sinh nở keyed bằng việc xoá pregnancy → chạy advanceWorld 2 lần
  KHÔNG BAO GIỜ tạo 2 con.
- pregnancySec lấy theo giống của MẸ (D22), không dùng hằng chung.
- Phối giống tốn 200 vàng qua helper vàng, XP +15.

## Testing
tests/unit/breeding.test.ts — TOÀN BỘ §14.4:
- Mỗi entry ma trận tổng = 100; A+B cho kết quả như B+A
- Phân bố 10.000 mẫu có seed nằm trong tolerance
- Tổ hợp không xác định và MYTHICAL bị từ chối
- Cùng giới, cùng một con, đang bệnh, đang mang thai, chưa trưởng thành,
  hết chỗ, thiếu vàng → đúng mã lỗi VÀ KHÔNG đổi state
- Con được chốt lúc phối: đổi rng sau đó KHÔNG đổi con
- Sinh ở endsAt − 1s: chưa gì. Ở endsAt: đúng MỘT con.
  Chạy advanceWorld lần nữa: vẫn một con.
- Con tính thời gian lớn từ endsAt
- Sinh sau 3 ngày offline vẫn chạy
- Với 4 slot, 2 heo trưởng thành và 1 thai: freeSlots = 0 để mua,
  nhưng sinh LUÔN tìm được chỗ
- pregnancySec theo breed được tôn trọng (D22)

## Acceptance Criteria
- [ ] Toàn bộ test §14.4 pass
- [ ] Test Phase 03, 04 VẪN XANH (vì advanceWorld đã bị sửa)
- [ ] Lai được từ PINK lên MELON, SUPERMAN, MYTHICAL trong test

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-10.md: ghi rõ hook nào trong advanceWorld đã được điền;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 11 — NPC ORDERS

```text
# PHASE 11 — NPC ORDERS

## Objective
Hệ thống đơn hàng NPC — mục tiêu của game và lý do nuôi một con heo cụ thể.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md (quyết định C1, Q1, Q2, Q3 — BẮT BUỘC),
  HANDOVER/PHASE-04.md (hook orders ở đâu)
- UN_IN_GAME_SPEC_v4_SOLO.md §8.14, §6.4 (hằng số order), §14.5

## Tasks
1. src/core/engine/orders.ts — sinh tất định:
   windowIndex = floor(now / ORDER_WINDOW_MS);
   với mỗi slot 0..2: seed = hash(windowIndex, slot) theo công thức đã chốt
   ở Q3; rng = mulberry32(seed); dựng order theo đúng §8.14.
2. ÁP QUYẾT ĐỊNH Q2: đơn đã tồn tại trong state.orders KHÔNG BAO GIỜ
   được tái sinh. Chỉ sinh cho slot chưa có id tương ứng.
   Đây là chỗ chống việc khám phá breed giữa window làm đổi nội dung đơn
   và ghi đè fulfilledAt.
3. ÁP QUYẾT ĐỊNH C1: sửa invariant và hằng số theo phương án đã chốt
   trong DECISIONS.md (mặc định: orders.length <= 6, ORDER_MAX_ACTIVE = 6).
   Nhớ cập nhật cả zod schema ở Phase 05.
4. ÁP QUYẾT ĐỊNH Q1: trọng số của weightedPick.
5. Điền hook orders trong advanceWorld: bỏ đơn có expiresAt <= now
   (emit ORDER_EXPIRED), thêm đơn của window hiện tại nếu thiếu
   (emit ORDER_NEW).
6. fulfillOrder (§8.14): kiểm breed, gender (nếu wantGender != null),
   happiness >= minHappiness, heo ADULT và không mang thai.
   Xoá heo, cộng rewardGold và rewardXp, đặt fulfilledAt, ghi transaction
   ORDER_REWARD.
7. Màn Đơn hàng: các thẻ đơn, yêu cầu, thưởng, đếm ngược, nút "Giao đơn"
   chỉ cho chọn heo hợp lệ.

## Constraints
(khối Constraints chung)
- Chỉ breed người chơi ĐÃ KHÁM PHÁ mới được yêu cầu — để đơn không bao giờ
  bất khả thi.
- Đơn đã fulfilled giữ fulfilledAt cho tới khi hết hạn, không claim lại được.

## Implementation Rules
- Không lưu seed. Mọi thứ suy ra từ đồng hồ (D20).
- hash phải tất định trên mọi máy — khoá bằng golden value.

## Testing
tests/unit/orders.test.ts — §14.5:
- Cùng windowIndex luôn sinh ra ĐÚNG 3 đơn giống hệt
- windowIndex khác sinh đơn khác
- Chỉ breed đã khám phá xuất hiện
- Hết hạn thì đơn bị bỏ và emit ORDER_EXPIRED
- fulfillOrder từ chối sai breed, sai gender, happiness thiếu
- Đơn đã giao không claim lại được
- GOLDEN VALUE cho hash: 3 cặp (windowIndex, slot) → giá trị cố định
- Fuzz 1000 bước: invariant orders.length không bị vi phạm (kiểm chứng C1)

## Acceptance Criteria
- [ ] Toàn bộ test §14.5 pass
- [ ] Golden value của hash được khoá
- [ ] Fuzz không vi phạm invariant
- [ ] Test Phase 03, 04, 10 VẪN XANH

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-11.md: DÁN công thức hash và 3 golden value của nó;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 12 — COLLECTION & SKINS

```text
# PHASE 12 — COLLECTION & SKINS

## Objective
Bộ sưu tập và shop skin — điểm đến cuối game, và bể tiêu vàng mà spec §1.2
nói là thứ v3 thiếu.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md (quyết định C2 và C3 — BẮT BUỘC)
- UN_IN_GAME_SPEC_v4_SOLO.md §8.13, §8.15, §6.6, Phụ lục A.2, §15 (Phase 3)

## Tasks
1. src/core/engine/discovery.ts — discoveredBreeds và discoveredSkins
   append-only. Lần đầu sở hữu một breed (mua, sinh) hoặc một skin
   → append, cộng DISCOVERY_BONUS_GOLD và XP.DISCOVERY,
   ghi transaction DISCOVERY_BONUS, emit DISCOVERY.
   Nối vào buyPig, birth, buySkin.
2. buySkin (§8.13): skin tồn tại; chưa sở hữu (SKIN_ALREADY_OWNED);
   priceGold != null và đủ vàng; điều kiện unlock đạt (LEVEL_TOO_LOW).
3. equipSkin (§8.13): đã sở hữu (SKIN_NOT_OWNED); allowedBreeds cho phép
   hoặc là "ALL" (SKIN_BREED_NOT_ALLOWED). Miễn phí, đảo được.
   KHÔNG ĐỔI BẤT KỲ CON SỐ NÀO.
4. KHÔNG làm cosmetics — theo quyết định C3. Ghi vào backlog trong README.
5. Màn Bộ sưu tập: mọi breed và skin đã biết; thứ chưa khám phá hiện
   dạng bóng mờ (silhouette).
6. Shop skin: lọc theo rarity, hiện giá, hiện điều kiện unlock.
7. Dropdown chọn skin trong panel heo.

## Constraints
(khối Constraints chung)
- Skin là THUẦN TUÝ trang trí. Nếu bạn thấy mình đang viết code cho skin
  chạm vào giá bán, tốc độ lớn, hay bất kỳ số nào — DỪNG LẠI, đó là sai (D19).
- Nguồn chân lý của skin theo quyết định C2. src/core/ KHÔNG được đọc file
  lúc runtime — registry phải được inject từ tầng store.

## Implementation Rules
- Bonus khám phá bắn ĐÚNG MỘT LẦN cho mỗi breed và mỗi skin.
- Mọi thay đổi vàng qua helper Phase 06A.

## Testing
- Bonus khám phá bắn đúng một lần cho breed và cho skin
- equipSkin KHÔNG đổi bất kỳ con số nào: so sánh deep-equal toàn bộ state
  trước và sau, bỏ qua trường skinId
- buySkin: SKIN_ALREADY_OWNED, INSUFFICIENT_GOLD, LEVEL_TOO_LOW
- equipSkin: SKIN_NOT_OWNED, SKIN_BREED_NOT_ALLOWED

## Acceptance Criteria (spec §15 Phase 3)
- [ ] Bộ sưu tập đầy dần, bonus khám phá trả đúng một lần
- [ ] Mua và mặc skin chạy, KHÔNG đổi gì ngoài hình ảnh
- [ ] Test các phase trước vẫn xanh

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-12.md;
- ghi known issues (gồm việc cosmetics bị hoãn theo C3);
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
Sau phase này tôi sẽ chơi thử 30 phút — game đã đủ về mặt hệ thống.
```

---

## PHASE 13 — ASSET MANIFEST & WAVE 0

```text
# PHASE 13 — ASSET MANIFEST & WAVE 0 PLACEHOLDERS

## Objective
Khoá hợp đồng "đổi art không đụng code" TRƯỚC khi có art thật.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md (quyết định C2)
- asset/ASSET_PRODUCTION_STANDARD_v1.md §4.1, §5 (anchor), §7.2 (schema
  manifest), §7.3 (cây thư mục), §10 (wave 0)
- UN_IN_GAME_SPEC_v4_SOLO.md §11 (đoạn cuối về placeholder)

Đây là phase DUY NHẤT được phép đọc asset catalogue.

## Tasks
1. Tạo public/assets/manifest/assets.json theo ĐÚNG schema §7.2
   (pigs / cosmetics / fx / props / ui).
2. src/core/assets/manifestSchema.ts — zod schema cho manifest.
3. src/store/assetRegistry.ts — nạp manifest, validate, expose SkinRegistry
   để INJECT vào core theo quyết định C2. Core KHÔNG tự đọc file.
4. scripts/make-placeholders.ts — sinh PNG placeholder:
   - 4 heo: pig_classic, pig_watermelon, pig_superhero, pig_thienlong
     512×512, hình chữ nhật bo góc có màu, chân nằm trên đường 82% canvas
   - 8 overlay fx_* (fx_sick, fx_pregnant, fx_zzz, fx_heart, fx_bubble,
     fx_crumb, fx_sparkle, fx_coin)
   - 3 trạng thái máng: prop_feed_trough_empty / _half / _full
5. Tạo cây thư mục public/assets/ theo §7.3.
6. Viết file anchors.json mẫu cho 4 heo placeholder, dùng bộ anchor
   mặc định ở art standard §5 (feet CỐ ĐỊNH ở 0.82).

## Constraints
(khối Constraints chung)
- TUYỆT ĐỐI KHÔNG hard-code đường dẫn ảnh trong src/.
- Không cần art thật. Placeholder là yêu cầu cứng của spec, không phải tạm bợ.

## Implementation Rules
- Thêm một skin mới phải chỉ tốn: 2 file PNG + 1 dòng trong assets.json
  + 0 dòng TypeScript.

## Testing
- Manifest pass zod schema
- Mọi skinId trong SKINS đều có row tương ứng trong manifest
- Mọi đường dẫn asset trong manifest đều tồn tại trên đĩa

## Acceptance Criteria
- [ ] grep "\.png" trong src/ KHÔNG ra kết quả nào (trừ file loader)
- [ ] Manifest validate pass
- [ ] Test "mọi asset path tồn tại" pass
- [ ] Đổi màu một placeholder → reload → thấy đổi, không sửa code

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-13.md, kèm hướng dẫn 4 bước thêm skin mới;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 14 — PHASER: SCENE & SPRITE

```text
# PHASE 14 — PHASER: SCENE & SPRITE

## Objective
Thay danh sách text bằng nông trại thật. CHƯA làm animation.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, HANDOVER/PHASE-13.md
- UN_IN_GAME_SPEC_v4_SOLO.md §11, §4 (Phaser chỉ vẽ nông trại,
  mọi menu vẫn là DOM)
- asset/ASSET_PRODUCTION_STANDARD_v1.md §4.1, §5 (anchor và mirror)

## Tasks
1. BootScene, PreloadScene (nạp asset TỪ MANIFEST), MainFarmScene.
2. Vẽ heo: skinId → manifest → texture. Scale sprite theo growthProgress
   (heo con nhỏ, heo trưởng thành lớn hơn).
3. Y-SORT: heo ở vị trí Y thấp hơn màn hình vẽ ĐÈ LÊN heo ở trên,
   cộng một thay đổi scale nhỏ theo Y. Spec §11 nói đây chính là toàn bộ
   ảo giác chiều sâu, và là lý do không cần vẽ mặt trước/lưng (D23).
4. Click vào heo → chọn → panel DOM cập nhật.
5. Canvas co giãn theo container.
6. Vẽ máng ăn với 3 trạng thái theo trough.food:
   food == 0 / 0 < food <= capacity/2 / food > capacity/2.
7. Đọc anchor từ *.anchors.json, CÀI SẴN hàm mirror x' = 1 - x
   dù chưa dùng tới — art standard §5 gọi việc quên mirror anchor là
   bug cosmetic dễ gặp nhất của dự án.

## Constraints
(khối Constraints chung)
- KHÔNG làm tween, particle, wandering ở phase này — đó là Phase 15.
- Phaser CHỈ vẽ nông trại. Mọi menu, panel, modal vẫn là DOM.
- src/game/ chỉ đọc state qua store, không tự tính luật game.
- Game phải chạy HOÀN TOÀN trên placeholder, không cần art thật.

## Implementation Rules
- Không hard-code đường dẫn asset. Mọi thứ qua manifest.
- Heo vẽ hướng phải; hướng trái là flipX lúc chạy (D23).

## Testing
Kiểm bằng mắt. Thử đổi trough.food trong console → hình máng phải đổi.

## Acceptance Criteria
- [ ] Game chạy trên placeholder, không có art thật
- [ ] Y-sort đúng khi 2 heo chồng nhau
- [ ] Máng đổi hình theo mức thức ăn
- [ ] Canvas responsive, không tràn ngang
- [ ] Click chọn heo hoạt động

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-14.md: sơ đồ scene, cách map state → sprite;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 15 — PHASER: VISUAL STATES & VFX

```text
# PHASE 15 — PHASER: VISUAL STATES & VFX

## Objective
Cài 8 trạng thái hình ảnh BẰNG COMPOSITION — tween, particle và overlay
dùng chung — chứ KHÔNG bằng 8 ảnh cho mỗi con heo.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md (quyết định Q5), HANDOVER/PHASE-14.md
- UN_IN_GAME_SPEC_v4_SOLO.md §11 (bảng state → cách render)
- asset/ASSET_PRODUCTION_STANDARD_v1.md §2.4, §3, §3.1, §3.2

## Tasks
Cài 8 state theo đúng bảng §11:
1. idle — tween scale "thở" chậm
2. walk — tween squash/stretch + flipX theo hướng;
   quay đầu bằng tween scaleX: 1 → 0 → -1 trong 120ms (art standard §2.4)
3. eat — xoay sprite ~8° về phía máng + particle fx_crumb
4. clean — emitter fx_bubble + tween tăng sáng ngắn
5. happy — tween nhảy + particle fx_heart
6. sleep — dùng frame _sleep + overlay fx_zzz.
   ÁP Q5: skin KHÔNG có sleepAsset → fallback về frame idle + fx_zzz.
7. sick — tint xanh + overlay fx_sick gắn ở anchor fx_above
8. pregnant — badge fx_pregnant ở anchor fx_above

Thêm:
9. Wandering: CHỈ THỊ GIÁC, trong biên nông trại, tạm dừng khi đang
   chạy animation tương tác, và TUYỆT ĐỐI KHÔNG đổi state game.
10. settings.reduceMotion tắt wandering, particle và mọi tween không thiết yếu.
    Giá trị khởi tạo lấy từ prefers-reduced-motion.

## Constraints
(khối Constraints chung)
- KHÔNG vẽ thêm ảnh cho mỗi state. Spec §11 nói rõ: một con heo biểu cảm
  đầy đủ chỉ tốn 2 ảnh (idle + sleep) cộng overlay dùng chung.
- Wandering KHÔNG được ghi bất cứ gì vào save.
- Khi heo quay trái, anchor phải mirror x' = 1 - x, nếu không overlay
  sẽ nhảy sang bên kia người heo.

## Implementation Rules
- Visual state SUY RA từ data, không bao giờ lưu (§11).
- .anim của Phaser sở hữu transform của chính nó — đừng ghi đè lẫn nhau
  giữa các tween.

## Testing
Kiểm bằng mắt. Ép state bằng console:
- đặt isSick = true → thấy tint + overlay
- đặt pregnancy → thấy badge
- dùng skin không có sleepAsset → kiểm tra fallback không vỡ
- bật reduceMotion → wandering và particle dừng
- để yên không thao tác → kiểm tra updatedAt của save KHÔNG đổi
  (chứng minh wandering không ghi state)

## Acceptance Criteria
- [ ] Đủ 8 state quan sát được
- [ ] Skin thiếu _sleep → fallback chạy, không vỡ
- [ ] Anchor mirror đúng khi heo quay trái
- [ ] reduceMotion tắt được wandering và particle
- [ ] Wandering không ghi gì vào save

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-15.md: bảng "state → cách render" để Phase 20
  đối chiếu với §11;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
Nếu phase này quá lớn, chia thành 15A (idle/walk/eat/clean),
15B (sleep/sick/pregnant/happy), 15C (wandering + reduceMotion) và
báo cho tôi biết trước khi làm.
```

---

## PHASE 16 — UX: RESPONSIVE, TUTORIAL, AWAY SUMMARY

```text
# PHASE 16 — UX: RESPONSIVE, TUTORIAL, AWAY SUMMARY

## Objective
Trải nghiệm hoàn chỉnh trên cả điện thoại lẫn máy tính.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §10.3 (tutorial), §10.4 (responsive),
  §9.5 (away summary), §9.3, §9.4 (cảnh báo lưu trữ)

## Tasks
1. Responsive theo §10.4: tối thiểu 360px, thoải mái từ 1280px,
   desktop hỗ trợ từ 1024px. Vùng chạm ≥ 44px. Không tương tác chỉ-hover.
   Không cuộn ngang. Modal thân thiện mobile. Bottom nav trên mobile,
   side panel cho phép trên desktop.
2. Tutorial 5 bước, bỏ qua được, lưu settings.tutorialDone:
   mua heo (chọn giới tính) → ĐỔ MÁNG → tắm → xem growth →
   đọc dòng happiness → giá.
   Bước 2 là bước dạy vòng lặp thật sự, đừng bỏ.
3. Modal "Trong lúc bạn vắng mặt" khi vắng ≥ 10 phút, dựng từ event của
   advanceWorld: heo trưởng thành, heo hết thức ăn, heo bị bệnh, sinh nở,
   máng có cạn không và cạn lúc nào, đơn hết hạn và đơn mới.
   DÒNG MÁNG ĂN LÀ DÒNG QUAN TRỌNG NHẤT — ví dụ:
   "Máng ăn hết lúc 03:20, 4 heo ngừng lớn trong 5 giờ".
   Spec §9.5 nói đây là phản hồi dạy người chơi phải tích trữ trước khi thoát.
4. Rà lại TOÀN BỘ nút disable: mọi nút phải có lý do nhìn thấy được.
5. Màn Cài đặt: nhạc, sfx, reduceMotion, export/import,
   cảnh báo lưu trữ trình duyệt (§9.4) nói rõ export mới là lưới an toàn thật,
   và nhắc export nếu lần cuối > 7 ngày (mỗi session một lần).
6. Trạng thái loading / rỗng / lỗi cho mọi màn.

## Constraints
(khối Constraints chung)
- KHÔNG thêm tính năng gameplay mới.
- KHÔNG tạo breakpoint bừa bãi — bám đúng các mốc §10.4.

## Implementation Rules
- Mọi chuỗi từ vi.ts.
- reduceMotion khởi tạo từ prefers-reduced-motion.

## Testing
- DevTools ở 360×640 và 1440×900
- Chỉnh lastTickedAt lùi 5 giờ để test away summary
- Chạy tutorial từ save mới, và thử bỏ qua

## Acceptance Criteria
- [ ] 360px không tràn ngang, mọi nút ≥ 44px
- [ ] Tutorial chạy đủ 5 bước và bỏ qua được
- [ ] Away summary hiện sau ≥ 10 phút, CÓ dòng máng ăn kèm giờ
- [ ] Nhắc export xuất hiện đúng 1 lần/session khi quá 7 ngày
- [ ] Mọi nút disable đều có lý do hiển thị

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-16.md;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 17 — AUDIO

```text
# PHASE 17 — AUDIO

## Objective
12 âm thanh, đúng key, không vi phạm chính sách autoplay của trình duyệt.

## Context
Đọc:
- PROJECT_STATUS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §12 (bảng 12 key canonical)
- asset/building/ENVIRONMENT_CATALOGUE.md §6 (mô tả phong cách âm thanh)

## Tasks
1. src/game/audio/AudioManager.ts với ĐÚNG 12 key của §12:
   music_farm, ui_click, ui_error, pig_oink_happy, pig_oink_hungry,
   feed_munch, water_splash, coin_collect, breed_chime, birth_fanfare,
   level_up, notify.
   KHÔNG đặt tên khác. Spec §12 tồn tại chính vì trước đó có 2 bộ tên
   xung đột nhau.
2. Nhạc nền CHỈ bắt đầu sau user gesture đầu tiên.
3. Nối event của game vào âm thanh theo bảng §12.
4. Toggle musicOn / sfxOn trong settings, lưu vào save.
5. Dùng audio gốc hoặc CC0. Ghi credit trong README.md và màn credits.
6. Thiếu file audio → phát im lặng, KHÔNG crash.

## Constraints
(khối Constraints chung)
- KHÔNG sao chép âm thanh từ bất kỳ game thương mại nào.
- notify và ui_error là 2 âm người chơi nghe nhiều nhất khi có gì đó sai —
  giữ cả hai nhẹ nhàng. Đây là game thư giãn.

## Implementation Rules
- Không phát bất cứ gì trước gesture đầu tiên.

## Testing
Mở console, bấm quanh game, kiểm tra không có warning autoplay và không lỗi.

## Acceptance Criteria
- [ ] Đúng 12 key, khớp §12 từng chữ
- [ ] Không phát trước gesture đầu tiên
- [ ] Tắt sfx → im hẳn
- [ ] Thiếu file audio → không crash

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-17.md + danh sách nguồn audio và giấy phép;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 18 — PWA & OFFLINE

```text
# PHASE 18 — PWA & OFFLINE

## Objective
Cài được vào màn hình chính, chơi offline hoàn toàn sau lần tải đầu.

## Context
Đọc:
- PROJECT_STATUS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §13, §9.4

## Tasks
1. manifest.webmanifest: name, short name, display: standalone,
   theme colour, icon 192 và 512.
2. Cấu hình vite-plugin-pwa precache TOÀN BỘ asset đã build.
3. Update flow: có bản mới → hiện "Có bản mới — tải lại".
   TUYỆT ĐỐI KHÔNG tự reload giữa lúc người chơi đang thao tác.
4. Gợi ý "Thêm vào màn hình chính".
5. Kiểm tra KHÔNG CÒN request nào ra host ngoài lúc runtime:
   không CDN font, không script ngoài, không analytics.
6. Ghi vào README: web không thể gửi thông báo nền khi app đã đóng;
   modal away-summary (§9.5) là thứ thay thế CÓ CHỦ Ý.

## Constraints
(khối Constraints chung)
- Không thêm dependency ngoài.
- Service worker cần HTTPS hoặc localhost; mở index.html bằng file://
  sẽ không chạy — ghi rõ điều này trong README.

## Implementation Rules
- Precache phải phủ cả assets.json và mọi file nó trỏ tới.

## Testing
npm run build && npm run preview, rồi DevTools → Network → Offline → reload.

## Acceptance Criteria
- [ ] Tắt mạng sau lần tải đầu → game chạy đầy đủ chức năng
- [ ] Tab Network: 0 request ra host ngoài lúc runtime
- [ ] Lighthouse: PWA installable pass
- [ ] Prompt update hiện ra và KHÔNG tự reload

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-18.md;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 19 — ECONOMY SIM & BALANCE GUARD

```text
# PHASE 19 — ECONOMY SIM & BALANCE GUARD

## Objective
Biến câu "chăm sóc heo là có lợi" thành một assertion chặn build.

## Context
Đọc:
- PROJECT_STATUS.md
- UN_IN_GAME_SPEC_v4_SOLO.md §14.7, §6.4 (bảng sanity check),
  §5.5 (invariant), Phụ lục C mục "Balance sanity"

## Tasks
1. scripts/simulate-economy.ts — in theo TỪNG BREED:
   giá bán gốc, số giờ để lớn, số đơn vị thức ăn cần để trưởng thành,
   chi phí thức ăn, vàng ròng mỗi giờ mỗi slot ở happiness 0 / 50 / 100,
   và số giờ chơi cần để mua được từng slot unlock và từng bậc skin.
2. ASSERTION CHẶN BUILD (§14.7): vàng/giờ ở happiness 100 phải
   ≥ 2× giá trị ở happiness 0. Không đạt → exit code khác 0.
3. Kiểm chứng 3 con số sanity ở §6.4:
   - Một con PINK cần ĐÚNG 6 đơn vị thức ăn để trưởng thành
   - Lợi nhuận ròng 190 / 490 / 790 ở happiness 0 / 50 / 100
   - PINK với máng rỗng kẹt ở 33.33% growth, không phải 100%
4. tests/unit/invariants.fuzz.test.ts — chạy ngẫu nhiên 1000 action;
   sau MỖI action, mọi invariant §5.5 phải giữ.

## Constraints
(khối Constraints chung)
- KHÔNG chỉnh BALANCE để script pass. Nếu script fail, đó là thông tin thật,
  hãy báo cáo chứ đừng che đi.

## Implementation Rules
- Script dùng fake clock và seeded rng, không đụng Date.now/Math.random.

## Testing
- npm run sim:economy → in đủ bảng và exit 0
- THỬ: tạm sửa SELL_MULT_SPAN về 0 → script PHẢI fail. Sau đó trả lại
  giá trị cũ và dán kết quả thử vào handover.
- npm test -- fuzz

## Acceptance Criteria
- [ ] npm run sim:economy in đủ bảng và exit 0
- [ ] Thử phá balance → script fail đúng như mong đợi
- [ ] PINK cần đúng 6 thức ăn; máng rỗng kẹt ở 33.33%
- [ ] Fuzz 1000 bước không vi phạm invariant nào

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-19.md và DÁN NGUYÊN OUTPUT BẢNG để lần sau so sánh;
- ghi known issues;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 20 — QA: PHỤ LỤC C, SMOKE TEST, README

```text
# PHASE 20 — QA: PHỤ LỤC C, SMOKE TEST, README

## Objective
Chạy checklist tự kiểm của spec, TỪNG DÒNG MỘT, và viết README hoàn chỉnh.

## Context
Đọc:
- PROJECT_STATUS.md, DECISIONS.md, toàn bộ HANDOVER/
- UN_IN_GAME_SPEC_v4_SOLO.md Phụ lục C (toàn bộ), §15 (4 nhóm acceptance),
  §17 (yêu cầu README), §14.8 (smoke test)

## Tasks
1. Chạy TỪNG DÒNG của Phụ lục C. Báo cáo PASS/FAIL cho mỗi dòng,
   KÈM BẰNG CHỨNG (lệnh đã chạy, file đã kiểm, kết quả grep).
   Không được đánh dấu PASS mà không kiểm thật.
2. Playwright smoke test §14.8: tải mới → mua heo → đổ máng → reload →
   heo và máng vẫn còn → export save.
3. Rà lại 4 nhóm Acceptance Criteria ở §15.
4. Viết README.md đầy đủ theo §17, đủ 12 mục:
   tổng quan, kiến trúc, cài đặt, lệnh dev/build/preview, lệnh test,
   cách save hoạt động (store, mirror, backup, export/import, cảnh báo eviction),
   cách cài PWA, cách chỉnh BALANCE, cách thêm breed,
   cách thêm skin hoặc cosmetic KHÔNG ĐỤNG CODE, credit asset,
   giới hạn đã biết (không có thông báo nền, dữ liệu theo từng trình duyệt
   và từng máy), và implementation assumptions.
5. Với mỗi FAIL: nếu sửa nhỏ thì sửa; nếu cần thay đổi lớn thì
   KHÔNG tự sửa trong phase này — ghi vào KNOWN_ISSUES.md và báo cáo cho tôi.

## Constraints
(khối Constraints chung)
- KHÔNG đánh dấu PASS cho thứ chưa kiểm thật.
- KHÔNG refactor lớn ở phase QA.

## Implementation Rules
- Dùng grep để chứng minh các mục kiểm tra tĩnh, ví dụ:
  grep -rn "Date.now()" src/core/      → phải rỗng
  grep -rn "Math.random" src/core/     → phải rỗng
  grep -rn "\.png" src/                → chỉ loader
  grep -rn "[À-ỹ]" src/ui src/game     → chỉ import từ vi.ts

## Testing
npm test && npm run typecheck && npm run lint && npm run build
npx playwright test

## Acceptance Criteria
- [ ] MỌI dòng của Phụ lục C có kết luận PASS/FAIL kèm bằng chứng
- [ ] Smoke test pass
- [ ] README có đủ 12 mục của §17
- [ ] 4 lệnh kiểm tra đều sạch

## Checkpoint
Trước khi kết thúc:
- cập nhật PROJECT_STATUS.md;
- tạo HANDOVER/PHASE-20.md và DÁN NGUYÊN BẢNG CHECKLIST PHỤ LỤC C
  kèm kết quả từng dòng;
- ghi known issues vào KNOWN_ISSUES.md;
- ghi bước tiếp theo.

## Completion Rule
KHÔNG tự động bắt đầu Phase tiếp theo. Dừng lại sau khi Phase này được verify.
```

---

## PHASE 21 — RELEASE & BÀN GIAO CUỐI

```text
# PHASE 21 — RELEASE & BÀN GIAO CUỐI

## Objective
Bản build production chạy được và bộ tài liệu bàn giao đầy đủ.

## Context
Đọc:
- PROJECT_STATUS.md, KNOWN_ISSUES.md, toàn bộ HANDOVER/
- UN_IN_GAME_SPEC_v4_SOLO.md §20 (backlog — để liệt kê, KHÔNG để làm)

## Tasks
1. npm run build production. Báo cáo kích thước bundle.
2. Deploy lên static host hoặc chạy npm run preview.
   KIỂM TRA LẠI OFFLINE TRÊN BẢN BUILD THẬT, không phải bản dev.
3. Kiểm tra trên một điện thoại thật nếu có.
4. git tag v1.0.0
5. Viết HANDOVER/FINAL.md:
   - trạng thái toàn bộ dự án
   - vị trí từng hệ thống trong code
   - những gì thuộc backlog: §20 của spec + cosmetics bị hoãn theo quyết định C3
   - cách sinh asset wave 1 (38 ảnh) và wave 2 (33 ảnh),
     trỏ tới asset/AI_ASSET_GENERATION_PACK.md
   - cách thay art thật vào mà không đụng code
   - mọi implementation assumption đã ghi
6. Cập nhật PROJECT_STATUS.md = DONE.

## Constraints
(khối Constraints chung)
- KHÔNG bắt đầu bất kỳ mục nào trong §20 Backlog.
- KHÔNG thêm tính năng ở phase release.

## Implementation Rules
- Tag chỉ được gắn sau khi bản build thật đã chạy offline thành công.

## Testing
Chơi 30 phút trên bản build production thật.

## Acceptance Criteria
- [ ] Build production chạy offline sau lần tải đầu
- [ ] Cài được vào màn hình chính
- [ ] HANDOVER/FINAL.md đủ để người mới tiếp tục mà không cần hỏi ai

## Checkpoint
- HANDOVER/FINAL.md
- PROJECT_STATUS.md = DONE

## Completion Rule
Đây là phase cuối. Báo cáo tổng kết và dừng lại.
```

---

# TỔNG KẾT

## Thứ tự làm việc

```text
P00 → P01 → P02 → P03 → P04 → P05 → P06A → P06B → P07 → P08A → P08B
                                                                  │
                                                    ★ CHƠI THỬ 15 PHÚT ★
                                                                  │
      P09 → P10 → P11 → P12 → P13 → P14 → P15 → P16 → P17 → P18 → P19 → P20 → P21
                          │
              ★ CHƠI THỬ 30 PHÚT ★
```

## Mỗi phase, không có ngoại lệ

```text
Session mới
    ↓
Dán prompt của phase (§J)
    ↓
INSPECT → IMPLEMENT → TEST → REVIEW DIFF → COMMIT → CHECKPOINT
    ↓
VERIFY (Acceptance Criteria)
    ↓
Merge main + git tag phase-XX-<tên>
    ↓
STOP — đóng session
```

## Ba điều dễ sai nhất

1. **Bỏ qua cổng chơi thử P08B.** Spec §16 nói thẳng: nếu game không vui ở dạng danh sách text, không art nào cứu được. Đây là chỗ rẻ nhất để phát hiện.
2. **Gộp phase vì còn usage.** Usage còn không có nghĩa context còn sạch.
3. **Để Claude tự xử lý mâu thuẫn spec lúc code.** Mọi mâu thuẫn phải vào `DECISIONS.md` ở P00 trước.

## Bốn file phải luôn cập nhật

| File | Vai trò | Ai đọc |
|---|---|---|
| `PROJECT_STATUS.md` | Trạng thái hiện tại | Mọi session, đọc ĐẦU TIÊN |
| `DECISIONS.md` | Quyết định đã chốt, không bàn lại | Mọi session |
| `SPEC_INDEX.md` | "Cần biết X → đọc section nào" | Mọi session — tiết kiệm usage nhiều nhất |
| `HANDOVER/PHASE-XX.md` | Nhật ký từng phase | Session của phase kế tiếp |

---

*Tài liệu này được soạn sau khi đọc đầy đủ 5 file spec trong `extra-content/Un_In/`. Mọi mâu thuẫn và câu hỏi mở ở §B-bis đều có trích dẫn section làm bằng chứng. Các đề xuất ở §B-bis là khuyến nghị — quyết định cuối cùng thuộc về bạn, và phải được ghi vào `DECISIONS.md` ở Phase 00 trước khi viết dòng code đầu tiên.*
