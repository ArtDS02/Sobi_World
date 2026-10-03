# Adapter — Sobi Farm, tên cũ Ủn Ỉn Homemade (Solo Edition, spec v4.1 Desktop)

Game nuôi heo nhàn, **app desktop Windows (Electron)**, chơi đơn tuyệt đối, offline từ lần mở đầu, không backend,
không server/port. Cài bằng installer → double-click icon → chơi.

## 0. Task ở đâu

- Danh sách task + định nghĩa từng task: `PROMPTS_THEO_PHASE.md` (gốc repo). Task `R05A` = block dưới
  heading `### R05A`; tìm bằng `grep -n "^### R05A" PROMPTS_THEO_PHASE.md` rồi đọc đúng block đó (tới `### ` kế tiếp).
- Đã xong (lộ trình cũ, giữ nguyên code): S00 → S02 → S03 → S04A → S04B → S05 → S06A → S06B → S07 → S08A → S08B.
- Thứ tự mới: R01 → R02 ★ → R03 → R04 → R05A → R05C → R05B ★ → R06 → R07A → R07B ★ → R08 → R09A → R09B → R10
  → R11 → R12A → R12B. ART chạy khi user yêu cầu (sau R04).
- ★ = cổng chơi thử: sau DONE, `NEXT:` ghi "user chơi thử rồi gọi task sau". Không tự đi tiếp.
- User chỉ nói "tiếp" / gọi skill không kèm task → task = `Next task` trong `PROJECT_STATUS.md`.
- Block task là đặc tả đầy đủ (spec dòng nào, làm gì, xong khi nào). Phần "Theo CLAUDE.md" trong block
  = theo skill này. Số dòng spec trong block lấy từ `SPEC_INDEX.md` lúc viết; lệch thì tra lại `SPEC_INDEX.md`
  theo số mục (§), không đọc cả file.

## 1. Spec

| | |
|---|---|
| **Luật chơi + kiến trúc** | `UN_IN_GAME_SPEC_v4_SOLO.md` **v4.1** (Phụ lục A config, B i18n, C checklist). Mục lục dòng: `SPEC_INDEX.md` |
| **Luật vẽ + manifest** | `asset/ASSET_PRODUCTION_STANDARD_v1.md` **v1.1** (§7.2 manifest v2, §7.4 kiểm asset) |
| **Quyết định đã chốt** | `DECISIONS.md` — thắng spec ở C1–C4, Q1–Q8; nhóm R00-* chốt hướng desktop |

**⛔ KHÔNG đọc:** `archive/` (giá trị cân bằng sai) · `hướng_dẫn_triển_khai.md` (172KB, lỗi thời về runtime) ·
`DESIGN_README.md` (lỗi thời về runtime) · `asset/animals/`, `asset/building/` (trừ task nói rõ) · ảnh.

**Phân xử:** luật chơi theo spec; luật vẽ theo art standard.

---

## 2. Stack & lệnh

TypeScript strict · Vite (`base: './'`) · Phaser 3 (chỉ vẽ nông trại) · DOM + SCSS (`sass`) cho mọi menu · `zod` ·
Electron + electron-builder (NSIS) · `idb` (chỉ adapter web dev) · Vitest · Playwright `_electron` (1 smoke test).

**Không:** backend, HTTP server/port trong bản ship, SQLite, database server, account, analytics, quảng cáo, IAP,
multiplayer, auto-updater, service worker/PWA, gọi mạng lúc runtime.

| Việc | Lệnh |
|---|---|
| **Cổng mỗi task** | `npm run check` = typecheck + lint + guard + test (+ `assets:check` từ R04) |
| Dev nhanh (trình duyệt) | `npm run dev` |
| Dev desktop | `npm run dev:desktop` (từ R02) |
| Build | `npm run build` (renderer + electron) |
| Installer | `npm run dist:win` → `release/` (từ R02) |
| Test | `npm test` |
| Kiểm asset | `npm run assets:check` (từ R04) |
| Mô phỏng kinh tế | `npm run sim:economy` (từ R08) |
| Smoke e2e | `npm run test:e2e` (từ R12B) |

---

## 3. Tầng & cây thư mục

Cây thư mục do **spec §4.1 (v4.1) quy định**. Trạng thái đích sau R01/R02:

```text
electron/            ← RUNTIME: main.ts, preload.ts, saveFiles.ts. Node API CHỈ ở đây.
src/
├── core/            ← DOMAIN + CONFIG. TypeScript THUẦN, không ngoại lệ.
│   ├── config/      ← CONFIG: breeds, items, skins, breedingMatrix, balance, errors, names
│   ├── engine/      ← advancePig, advanceWorld, trough, pricing, breeding, happiness, orders
│   ├── actions/     ← mỗi action một file
│   ├── save/        ← schema, migrate, exportImport, port.ts (SaveStorage interface)
│   ├── assets/      ← manifestSchema (zod), registry thuần (id → entry, fallback)
│   ├── rng.ts  clock.ts  events.ts  types.ts
├── platform/        ← DATA ADAPTER: desktop/ (qua window.unin), web/ (IndexedDB, tab guard), index.ts
├── store/           ← APPLICATION: gameStore, runtime (realClock, defaultRng)
├── game/            ← VIEW (Phaser): scenes/, prefabs/, fx/, audio/, feedback/, config/
├── ui/              ← VIEW (DOM): components/, screens/
├── i18n/vi.ts       ← toàn bộ chuỗi hiển thị
└── main.ts          ← composition root: chọn platform, tạo store, mount UI + Phaser
```

| Tầng | Thư mục | Được import |
|---|---|---|
| CONFIG | `src/core/config/` | — |
| DOMAIN | `src/core/` (còn lại) | `core/config` |
| PLATFORM | `src/platform/` | `core/*` |
| ADAPTER | `src/store/` | `core/*` (nhận platform qua inject, không import) |
| VIEW | `src/ui/`, `src/game/` | `core/*`, `store/` |
| ROOT | `src/main.ts` | tất cả |
| RUNTIME | `electron/` | không import `src/` trừ type thuần (`src/core/save/port.ts`) |

### Quy tắc bất di bất dịch (spec §4.1, "non-negotiable")

```text
src/core/ KHÔNG import từ game/, ui/, store/, platform/ hay bất kỳ browser/Node API nào. Không ngoại lệ.
src/core/ KHÔNG có Date.now(), KHÔNG có Math.random().
now và rng LUÔN được inject từ ngoài (src/store/runtime.ts).
Renderer KHÔNG chạm file system: chỉ qua window.unin (preload, contextBridge).
```

---

## 4. Ngoại lệ ranh giới

| File | Ngoại lệ | Lý do | Ghi ở |
|---|---|---|---|
| `src/store/runtime.ts` | `Date.now`, `Math.random` | Một nơi duy nhất sinh thời gian/số thật, ngoài core | `DECISIONS.md` A2, A4 |
| `config/*.ts` | Chứa `nameVi` tiếng Việt | Spec Phụ lục A viết sẵn như vậy. Chuỗi **hiển thị** vẫn chỉ ở `i18n/vi.ts` | — |

Ngoài các mục này, không có ngoại lệ nào khác được chấp nhận mà không thêm block mới.

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
| **Breakpoint** | Hai mốc: `sm` 480px, `md` 768px. **Không tạo thêm.** Spec v4.1 §10.4: cửa sổ desktop tối thiểu 1024 × 640, không cần layout mobile → layout mặc định là desktop; mốc chỉ dùng khi cần co panel |
| **Media query** | `@include mq(md) { }`. Cấm viết `@media` trần |
| **Đặt cạnh rule** | Media query nằm ngay trong block nó sửa, không dồn cuối file |
| **Tiền tố** | *(không)* = block của màn · `c-` component chung · `u-` utility · `is-`/`has-` trạng thái · `js-` chỉ để JS bám |
| **Scope màn** | `[data-screen="farm"]` — mỗi màn một gốc, mọi rule nằm trong đó |
| **Nest** | Tối đa 3 cấp; `&__` tối đa 2 cấp |

**Giá trị được viết thẳng** (danh sách đóng): `0` · `1px` (đường kẻ) · `50%` · `100%` · `auto` ·
`9999px` (bo tròn) · `translate(-50%, -50%)` · `letter-spacing` theo `em` · `44px`
(vùng click tối thiểu — spec §10.4 nêu con số này, đặt thành `$sp-touch-min`).

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

`.claude/spec-to-source.config.mjs` trong repo game (đã khớp file thật từ R01):

```js
export default {
  maxFileLines: 300,
  maxFileLinesExceptions: ['src/i18n/vi.ts', 'src/core/config/breeds.ts'],
  layers: [
    { name: 'config',   dir: 'src/core/config', mayImport: [] },
    { name: 'domain',   dir: 'src/core',        mayImport: ['config'] },
    { name: 'platform', dir: 'src/platform',    mayImport: ['config', 'domain'] },
    { name: 'adapter',  dir: 'src/store',       mayImport: ['config', 'domain'] },
    { name: 'view',     dir: 'src/ui',          mayImport: ['config', 'domain', 'adapter'] },
    { name: 'view',     dir: 'src/game',        mayImport: ['config', 'domain', 'adapter'] },
  ],
  forbidden: [
    {
      dir: 'src/core',
      patterns: [/Date\.now\(/, /Math\.random\(/, /window\./, /document\./, /localStorage/,
                 /indexedDB/, /from 'idb'/, /navigator\./, /fetch\(/, /require\(/, /from 'node:/],
      exceptions: [],
    },
    {
      dir: 'src',
      patterns: [/from 'electron'/, /from 'node:/, /require\(/],
      exceptions: [],
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
# core phải thuần — không ngoại lệ (kể cả comment)
grep -rn "Date.now()\|Math.random()\|localStorage\|indexedDB\|window\.\|document\.\|fetch(" src/core/

# Node/Electron chỉ trong electron/
grep -rn "from 'electron'\|from 'node:\|require(" src/

# không chuỗi tiếng Việt ngoài i18n và config
grep -rnP "[\x{00C0}-\x{1EF9}]" --include=*.ts src/ui src/game src/store src/platform \
  | grep -v "i18n"

# không hard-code đường dẫn asset — mọi thứ qua id + assets.json
grep -rn "\.png\|\.webp\|\.mp3\|\.ogg\|\.json'" src/ | grep -v "manifest/assets.json"

# không màu hard-code trong style feature
grep -rnE "#[0-9a-fA-F]{3,8}\b" src/styles/features/

# breakpoint lạ
grep -rn "@media" src/styles/ | grep -v "mq("

# file style thiếu barrel
for f in src/styles/features/_*.scss; do
  n=$(basename "$f" .scss); n=${n#_}
  grep -q "forward '$n'" src/styles/features/_index.scss || echo "THIẾU BARREL: $n"
done

# đúng MỘT interval mô phỏng toàn cục (spec §7.1); Phaser có vòng render riêng, không dùng setInterval
grep -rn "setInterval" src/ | wc -l    # phải = 1

# không có lời gọi mạng / server trong bản ship
grep -rn "http://\|https://\|createServer\|listen(" src/ electron/ | grep -v "^.*//"

# tên file bị cấm
find src electron -name "utils.*" -o -name "helpers.*" -o -name "misc.*" -o -name "common.*"
```

---

## 9. Chia increment

Xem §0. Lộ trình S cũ dừng ở S08B. Lộ trình R (sau review kiến trúc, DECISIONS R00-*) gom S09–S20 cũ cùng phần
desktop/asset/presentation mới: R03 = S09, R06 = S10, R07A = S11, R07B = S12, R08 = S19, R09A/B = S15A/B,
R10 = S17 phần A, R11 = S16, R12B = S20; R01, R02, R04, R05A/B, R12A là việc mới hoặc mở rộng (S13, S14A/B).

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
- **Game phải chạy trên placeholder.** Đây là yêu cầu cứng, không phải tạm bợ —
  nó chứng minh cơ chế đổi art không đụng code hoạt động (D24).
- **Đúng một `setInterval` toàn app** (spec §7.1), không phải một timer cho mỗi con heo.
- **Canvas Phaser không được nằm trong vùng `patch()` của `src/ui/app.ts`** — DOM re-render mỗi giây sẽ huỷ scene.
  Vùng canvas cố định được chừa ở R01.
- **Vite `base` phải là `'./'`** — đường dẫn tuyệt đối `/assets/...` hỏng dưới `app://`.
- **Renderer không có Node.** Mọi thứ cần fs/dialog đi qua `window.unin` (preload). Đừng bật `nodeIntegration`.
- **Ghi file phải atomic** (tmp → rename). Windows/antivirus có thể khoá file khi rename → retry vài lần.
- **Event catch-up không phát animation** (spec §11.3): mở game sau 8 giờ không được nổ 40 hiệu ứng.
- **Electron tự phát nhạc được** (`autoplayPolicy`), bản web dev thì không — AudioManager phải chịu cả hai.
