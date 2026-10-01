# Adapter — Ủn Ỉn Homemade (Solo Edition)

Game nuôi heo nhàn, PWA, chơi đơn tuyệt đối, offline, không backend.

## 0. Task ở đâu

- Danh sách task + định nghĩa từng task: `PROMPTS_THEO_PHASE.md` (gốc repo). Task `S03` = block dưới
  heading `### S03`; tìm bằng `grep -n "^### S03\|^## 2. S00" PROMPTS_THEO_PHASE.md` rồi đọc đúng block đó.
- Thứ tự: S00 → S02 → S03 → S04A → S04B → S05 → S06A → S06B → S07 → S08A → S08B ★ → S09 → S10 → S11
  → S12 ★ → S19 → S13 → S14A → S14B → S15A → S15B → S16 → S17 → S20. ART chạy khi user yêu cầu.
- ★ = cổng chơi thử: sau DONE, `NEXT:` ghi "user chơi thử rồi gọi task sau". Không tự đi tiếp.
- User chỉ nói "tiếp" / gọi skill không kèm task → task = `Next task` trong `PROJECT_STATUS.md`.
- Block task là đặc tả đầy đủ (spec dòng nào, làm gì, xong khi nào). Phần "Theo CLAUDE.md" trong block
  = theo skill này.

## 1. Spec

| | |
|---|---|
| **Luật chơi** | `UN_IN_GAME_SPEC_v4_SOLO.md` (Phụ lục A config, B i18n, C checklist). Mục lục dòng: `SPEC_INDEX.md` |
| **Luật vẽ** | `asset/ASSET_PRODUCTION_STANDARD_v1.md` |
| **Quyết định đã chốt** | `DECISIONS.md` — thắng spec ở các mâu thuẫn C1–C4, Q1–Q8 |

**⛔ KHÔNG đọc:** `archive/` (giá trị cân bằng sai) · `hướng_dẫn_triển_khai.md` (172KB; đã được chưng
cất vào PROMPTS + DECISIONS) · `DESIGN_README.md` · `asset/animals/`, `asset/building/` (trừ task nói rõ) · ảnh.

**Phân xử:** luật chơi theo spec; luật vẽ theo art standard.

---

## 2. Stack & lệnh

TypeScript strict · Vite · Phaser 3 (chỉ vẽ nông trại) · DOM + SCSS (`sass`) cho mọi menu · `zod` · `idb` ·
`vite-plugin-pwa` · Vitest · Playwright (1 smoke test).

**Không:** backend, database server, account, analytics, quảng cáo, IAP, multiplayer,
gọi mạng lúc runtime.

| Việc | Lệnh |
|---|---|
| **Cổng mỗi task** | `npm run check` = typecheck + lint + test + `node .claude/skills/spec-to-source/scripts/check-architecture.mjs` |
| Dev | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |
| Test | `npm test` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Mô phỏng kinh tế | `npm run sim:economy` |

---

## 3. Tầng & cây thư mục

Cây thư mục do **spec §4.1 quy định**, không phải adapter tự đặt. Giữ nguyên.

```text
src/
├── core/            ← DOMAIN + CONFIG. TypeScript THUẦN.
│   ├── config/      ← CONFIG: breeds, items, skins, breedingMatrix, balance, errors, names
│   ├── engine/      ← advancePig, advanceWorld, trough, pricing, breeding, happiness, orders
│   ├── actions/     ← mỗi action một file
│   ├── save/        ← schema, migrate, storage, exportImport
│   ├── rng.ts  clock.ts  events.ts  types.ts
├── store/           ← ADAPTER: gameStore
├── game/            ← VIEW (Phaser): scenes/, prefabs/, config/
├── ui/              ← VIEW (DOM): components/, screens/
├── i18n/vi.ts       ← toàn bộ chuỗi hiển thị
└── main.ts
```

| Tầng | Thư mục | Được import |
|---|---|---|
| CONFIG | `src/core/config/` | — |
| DOMAIN | `src/core/{engine,actions,save}/` | `core/config` |
| ADAPTER | `src/store/` | `core/*` |
| VIEW | `src/ui/`, `src/game/` | `core/*`, `store/` |

### Quy tắc bất di bất dịch (spec §4.1, "non-negotiable")

```text
src/core/ KHÔNG import từ game/, ui/, store/ hay bất kỳ browser API nào.
src/core/ KHÔNG có Date.now(), KHÔNG có Math.random().
now và rng LUÔN được inject từ ngoài.
```

---

## 4. Ngoại lệ ranh giới

| File | Ngoại lệ | Lý do | Ghi ở |
|---|---|---|---|
| `src/core/save/storage.ts` | Được dùng IndexedDB + localStorage | Spec xếp lớp lưu trữ trong `core/save/`. Cô lập browser API vào đúng file này | `DECISIONS.md` #ARCH-01 |
| `src/core/rng.ts` | `defaultRng` được dùng `Math.random` | Phải có một nơi sinh số thật. Không file core nào khác được gọi nó — luôn inject | `DECISIONS.md` #ARCH-02 |
| `config/*.ts` | Chứa `nameVi` tiếng Việt | Spec Phụ lục A viết sẵn như vậy. Chuỗi **hiển thị** vẫn chỉ ở `i18n/vi.ts` | `DECISIONS.md` #ARCH-03 |

Ngoài ba mục này, không có ngoại lệ nào khác được chấp nhận mà không thêm block mới.

---

## 5. Hệ style

Spec **không** quy định hệ style — đây là phần adapter tự chốt. Áp
[04-styles.md](../../04-styles.md), điều chỉnh:

```text
src/styles/
├── main.scss              # chỉ @use
├── core/
│   ├── _index.scss        # thứ tự cascade, có comment
│   ├── _tokens.scss       # $c-*, $fs-*, $sp-*, $z-*, $bp-*
│   ├── _mixins.scss       # mq()
│   ├── _reset.scss
│   ├── _layout.scss       # top bar, bottom nav, khung app
│   ├── _components.scss   # .c-button, .c-dialog, .c-toast, .c-gauge, .c-bar
│   └── _utilities.scss    # .u-*
└── features/
    ├── _index.scss        # @forward từng màn — THIẾU DÒNG = KHÔNG SHIP
    ├── _farm.scss         ├── _shop.scss      ├── _inventory.scss
    ├── _orders.scss       ├── _collection.scss ├── _history.scss
    ├── _settings.scss     └── _tutorial.scss
```

| | |
|---|---|
| **Breakpoint** | Hai mốc: `sm` 480px, `md` 768px. **Không tạo thêm.** Spec §10.4 yêu cầu tối thiểu 360px, desktop từ 1024px → dùng `md` làm ranh giới mobile/desktop |
| **Media query** | `@include mq(md) { }`. Cấm viết `@media` trần |
| **Đặt cạnh rule** | Media query nằm ngay trong block nó sửa, không dồn cuối file |
| **Tiền tố** | *(không)* = block của màn · `c-` component chung · `u-` utility · `is-`/`has-` trạng thái · `js-` chỉ để JS bám |
| **Scope màn** | `[data-screen="farm"]` — mỗi màn một gốc, mọi rule nằm trong đó |
| **Nest** | Tối đa 3 cấp; `&__` tối đa 2 cấp |

**Giá trị được viết thẳng** (danh sách đóng): `0` · `1px` (đường kẻ) · `50%` · `100%` · `auto` ·
`9999px` (bo tròn) · `translate(-50%, -50%)` · `letter-spacing` theo `em` · `44px`
(vùng chạm tối thiểu — spec §10.4 nêu con số này, đặt thành `$sp-touch-min`).

**Phaser vẽ nông trại; DOM vẽ mọi menu, panel, modal** (spec §4). Không dựng UI trong Phaser.

---

## 6. Ngưỡng

| Ngưỡng | Giá trị | Ngoại lệ |
|---|---|---|
| Dòng / file | 300 | `i18n/vi.ts` (Phụ lục B chép nguyên văn), `config/breeds.ts` |
| Dòng / hàm | 50 | `advancePig` — chép nguyên văn spec §7.2 |
| Cấp lồng | 3 | — |

---

## 7. Config guard

`.claude/spec-to-source.config.mjs` trong repo game:

```js
export default {
  maxFileLines: 300,
  maxFileLinesExceptions: ['src/i18n/vi.ts', 'src/core/config/breeds.ts'],
  layers: [
    { name: 'config',  dir: 'src/core/config', mayImport: [] },
    { name: 'domain',  dir: 'src/core',        mayImport: ['config'] },
    { name: 'adapter', dir: 'src/store',       mayImport: ['config', 'domain'] },
    { name: 'view',    dir: 'src/ui',          mayImport: ['config', 'domain', 'adapter'] },
    { name: 'view',    dir: 'src/game',        mayImport: ['config', 'domain', 'adapter'] },
  ],
  forbidden: [
    {
      dir: 'src/core',
      patterns: [/Date\.now\(/, /Math\.random\(/, /window\./, /document\./, /localStorage/],
      exceptions: ['src/core/save/storage.ts', 'src/core/rng.ts'],
    },
  ],
  barrels: [
    { index: 'src/styles/features/_index.scss', glob: 'src/styles/features/_*.scss' },
  ],
  bannedFileNames: ['utils', 'helpers', 'misc', 'common', 'shared'],
};
```

---

## 8. Grep guard

```bash
# core phải thuần (trừ 2 file ngoại lệ ở §4)
grep -rn "Date.now()\|Math.random()\|localStorage\|window\.\|document\." src/core/ \
  | grep -v "src/core/save/storage.ts\|src/core/rng.ts"

# không chuỗi tiếng Việt ngoài i18n và config
grep -rnP "[\x{00C0}-\x{1EF9}]" --include=*.ts src/ui src/game src/store \
  | grep -v "i18n"

# không hard-code đường dẫn asset — mọi thứ qua assets.json
grep -rn "\.png\|\.webp\|\.mp3\|\.ogg" src/ | grep -v "assetRegistry\|manifestSchema"

# không màu hard-code trong style feature
grep -rnE "#[0-9a-fA-F]{3,8}\b" src/styles/features/

# breakpoint lạ
grep -rn "@media" src/styles/ | grep -v "mq("

# file style thiếu barrel
for f in src/styles/features/_*.scss; do
  n=$(basename "$f" .scss); n=${n#_}
  grep -q "forward '$n'" src/styles/features/_index.scss || echo "THIẾU BARREL: $n"
done

# đúng MỘT interval toàn cục (spec §7.1)
grep -rn "setInterval" src/ | wc -l    # phải = 1

# tên file bị cấm
find src -name "utils.*" -o -name "helpers.*" -o -name "misc.*" -o -name "common.*"
```

---

## 9. Chia increment

Xem §0. Đã gộp/tách so với 24 phase gốc: P00+P01 = S00, P17+P18 = S17, P20+P21 = S20, P04/P14/P15 tách A/B,
S19 chạy trước đồ hoạ.

---

## 10. Bẫy đã biết của dự án này

> Ghi thêm mỗi lần mất hơn 15 phút vì một cái bẫy.

- **12 mâu thuẫn/câu hỏi mở đã phát hiện trong spec** — đã chốt trong `DECISIONS.md` (S00). Bốn cái nghiêm trọng: invariant số đơn hàng vs. TTL;
  giá skin có hai nguồn chân lý; cosmetics không có chỗ trong data model; `decorBonus` không tồn tại.
- **`resolveTrough` phải chạy TRƯỚC `advancePig`** trong cùng window. Ngược lại là con heo vừa ăn
  trông như bị bỏ đói. Spec §7.3 bắt phải có test cho đúng điểm này.
- **Không "đơn giản hoá" mô hình bệnh mũ** thành roll-per-tick. Spec §7.2 giải thích: chạy 1 lần
  600s và 600 lần 1s phải cho cùng kết quả.
- **Care budget phải SUY RA từ `growthSec`** (D16), không hard-code bảng §6.2. Bảng đó là để kiểm.
- **`advanceWorld` phải idempotent** với cùng `now`. Gọi hai lần không được trừ thức ăn hai lần,
  không được sinh hai con.
- **Skin tuyệt đối không chạm vào số nào** (D19). Thấy mình viết code skin ảnh hưởng giá bán
  hay tốc độ lớn → đang sai.
- **Anchor phải mirror `x' = 1 - x`** khi sprite lật. Art standard §5 gọi đây là bug cosmetic
  dễ gặp nhất của dự án.
- **Game phải chạy trên 4 hình chữ nhật placeholder.** Đây là yêu cầu cứng, không phải tạm bợ —
  nó chứng minh cơ chế đổi art không đụng code hoạt động.
- **Đúng một `setInterval` toàn app** (spec §7.1), không phải một timer cho mỗi con heo.
