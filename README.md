# Sobi Farm

_(Tên cũ: Ủn Ỉn Homemade — đổi tên ở AM-2. Thư mục save và key lưu trữ giữ tên cũ để không mất dữ liệu.)_

Game nuôi heo nhàn cho **Windows**, chơi đơn, chạy hoàn toàn trên máy: không tài khoản, không máy chủ,
không cần mạng — kể cả lần mở đầu tiên. Mua heo con, đổ máng ăn, tắm, chữa bệnh, cho lớn rồi bán; heo càng
vui vẻ bán càng được giá. Phối giống ra giống hiếm, nhận đơn hàng NPC, sưu tầm 69 giống heo, săn thành
tích, nhận quà mỗi ngày và trang trí nông trại.

Đặc tả: `UN_IN_GAME_SPEC_v4_SOLO.md` (v4.1) · luật vẽ: `asset/ASSET_PRODUCTION_STANDARD_v1.md` ·
quyết định đã chốt: [`DECISIONS.md`](DECISIONS.md) · trạng thái: [`PROJECT_STATUS.md`](PROJECT_STATUS.md) ·
tài liệu thiết kế cũ (bản PWA, đã lỗi thời về runtime/lưu trữ): [`DESIGN_README.md`](DESIGN_README.md).

---

## Cài và chơi

1. Chạy `SobiFarm-Setup-<phiên bản>.exe`. Cài cho người dùng hiện tại, không cần quyền admin; được chọn
   thư mục cài; tạo lối tắt ở Desktop và Start Menu.
2. Bản v1 **chưa ký số**: Windows SmartScreen hiện "Windows protected your PC" → bấm **More info** →
   **Run anyway**.
3. Double-click biểu tượng **Sobi Farm**. Không cần Node, terminal, server hay mạng.

Cửa sổ mặc định 1280 × 800, tối thiểu 1024 × 640, nhớ kích thước/vị trí; **F11** bật/tắt toàn màn hình.
Mở lần thứ hai chỉ đưa cửa sổ đang chạy lên trước.

---

## Kiến trúc (spec §4)

```text
electron/            RUNTIME   main.ts (cửa sổ, app:// protocol, chặn mạng, single instance),
                               preload.ts (window.unin), saveFiles.ts (ghi atomic + backup). Node API CHỈ ở đây.
src/core/            DOMAIN    TypeScript thuần: config/, engine/, actions/, save/, assets/. Không browser/Node
                               API, không Date.now()/Math.random() — now và rng luôn được inject.
src/platform/        ADAPTER   desktop/ (qua window.unin), web/ (IndexedDB, tab guard — chỉ cho npm run dev)
src/store/           APP       gameStore: một vòng tick 1 s, dispatch, persist, retry; runtime (đồng hồ, rng thật)
src/game/            VIEW      Phaser: chỉ vẽ nông trại (scenes, prefabs, fx, audio, FeedbackDirector)
src/ui/              VIEW      DOM: top bar, popup, hộp thoại, toast, màn hình
src/i18n/vi.ts                 toàn bộ chuỗi hiển thị
src/main.ts          ROOT      chọn platform, tạo store, gắn UI + Phaser + âm thanh
```

Luồng: `UI → store.dispatch(action) → advanceWorld → action → lưu → event → FeedbackDirector`
(animation → VFX → âm thanh → toast, theo bảng dữ liệu `src/game/feedback/feedbackTable.ts`).

---

## Lệnh

| Việc | Lệnh |
|---|---|
| Dev nhanh trong trình duyệt (`?dev=1`: tua giờ, xem asset, fps) | `npm run dev` |
| Dev desktop (Electron trỏ vào Vite dev server — nơi duy nhất có cổng dev) | `npm run dev:desktop` |
| Build renderer + electron | `npm run build` |
| Installer Windows → `release/` | `npm run dist:win` |
| Cổng chất lượng: typecheck + lint + guard kiến trúc + asset + unit test | `npm run check` |
| Unit test | `npm test` |
| Smoke e2e trên bản build (Electron, thư mục dữ liệu tạm, khẳng định 0 request mạng) | `npm run test:e2e` |
| Mô phỏng kinh tế (fail nếu chăm sóc < 2× lãi) | `npm run sim:economy` |
| Kiểm asset / kiểm asset trước phát hành (fail nếu còn placeholder) | `npm run assets:check` / `npm run assets:release` |
| Sinh lại file placeholder | `npm run assets:placeholders` |

---

## Lưu game

- Thư mục: `%APPDATA%\Un In Homemade\saves\` (tên thư mục cũ, giữ nguyên để không mất save; Cài đặt → **Mở thư mục lưu**). Gỡ cài đặt **không** xoá thư mục
  này; cài lại hoặc cài bản mới đè lên vẫn giữ nông trại (bản mới tự migrate save cũ).
- Ghi **atomic**: ghi file tạm → flush → đổi tên; tắt máy giữa chừng không làm hỏng `save.json`.
- **Backup**: giữ 10 bản gần nhất trong `saves\backups\` (Cài đặt → Bản sao lưu → Khôi phục).
- **Chơi lại từ đầu** (Cài đặt, xác nhận 2 lần): nông trại cũ được cất thành 1 bản sao lưu khôi phục được và
  1 bản giữ vĩnh viễn `saves\before-reset-YYYYMMDD-HHmmss.json`.
- Hỏng file: tự lùi về backup hợp lệ mới nhất; file hỏng được đổi tên `save.corrupt-YYYYMMDD-HHmmss.json`, không
  bao giờ bị xoá. Hỏng hết → màn khôi phục: chọn bản sao lưu, nhập file, hoặc bắt đầu mới (có xác nhận).
- Ghi lỗi → banner "Chưa lưu được — đang thử lại…", thử lại 1 s → 5 s → 30 s, dữ liệu trong bộ nhớ được giữ.
- **Xuất / Nhập** trong Cài đặt (`un-in-save-YYYYMMDD-HHmm.json`); nhắc xuất nếu đã quá 7 ngày.
- **Chuyển máy**: chép `save.json` (hoặc cả thư mục) sang máy kia, hoặc dùng Xuất/Nhập. Không chạy cùng lúc trên
  hai máy dùng chung một thư mục đồng bộ (OneDrive…).

---

## Chỉnh cân bằng

Mọi con số ở `src/core/config/` (`balance.ts`, `breeds.ts`, `items.ts`, `levels.ts`, …). Sau khi đổi:
`npm run sim:economy` (bảng lãi/giờ, giờ để mở chuồng/mua skin; fail nếu lãi khi chăm ≥ 2× lãi khi bỏ bê bị phá)
và `npm run check` (golden value của spec không được nới).

## Thêm giống heo

1. Thêm id vào `BREED_ID_VALUES` (`src/core/config/ids.ts`) và một mục trong `BREEDS` (`breeds.ts`: giá, thời gian
   lớn, mang thai, skin mặc định). Hao đói/bẩn tự suy ra từ `growthSec` (D16).
2. Thêm cặp phối ra giống đó trong `breedingMatrix.ts`; tên hiển thị nằm trong `breeds.ts` (`nameVi`).
3. Thêm dòng skin mặc định vào manifest (mục dưới), màu fallback trong `FARM_FALLBACK.BREED` (`farmView.ts`).
4. `npm run check` + `npm run sim:economy`.

## Thêm / nâng cấp skin hay bất kỳ asset nào — không sửa code

1. Thêm hoặc sửa dòng trong `public/assets/manifest/assets.json` (id snake_case; `status: "placeholder"`;
   skin: `rarity`, `priceGold`, `unlock`, `allowedBreeds`; âm thanh: `kind`, `volume`, `loop`, `credit`, `license`).
2. `npm run assets:placeholders` để có file tạm; game chạy được ngay.
3. Art thật: ghi đè file cùng đường dẫn trong `public/assets/` (ảnh theo luật vẽ; âm thanh `.ogg`/`.mp3`), đặt
   `status: "production"` (đã vào game, đạt chuẩn) rồi `"final"` khi duyệt.
4. `npm run assets:check` (kích thước, alpha, đường chân 82 %, anchors…) và `npm run dev` + `?dev=1` → nút
   **assets** để xem từng asset.

---

## Credits

- **Hình** (heo, nhà, đạo cụ, cảnh nền, FX, icon, icon app): vẽ vector bằng code cho dự án —
  `npm run art:generate` (`scripts/art/`, cùng một bộ màu/nét/ánh sáng theo `asset/reference/`), rồi
  `npm run art:process` để hậu kỳ + đăng ký. Tác phẩm gốc của dự án.
- **Hiệu ứng âm thanh** (11 key): tổng hợp bằng code (`scripts/art/sfx.ts`). Tác phẩm gốc của dự án.
- **Nhạc nền** `music_farm`: tạo bằng Mureka AI cho dự án (`asset/music/music-bg.mp3`); quyền dùng theo điều
  khoản gói Mureka của chủ dự án.

Không có tác phẩm bên thứ ba. `credit` + `license` nằm trong từng dòng âm thanh của manifest — màn Cài đặt →
Thông tin tự liệt kê. Thêm asset mới: chỉ dùng tác phẩm tự làm hoặc CC0 và cập nhật mục này.

---

## Giới hạn đã biết

- Chỉ Windows (v1). Không có thông báo nền khi game tắt (heo vẫn lớn, máng vẫn được ăn theo thời gian thật).
- Save theo từng người dùng Windows; chuyển máy bằng chép thư mục hoặc Xuất/Nhập.
- Installer chưa ký số (SmartScreen hỏi một lần).
- Hết vàng mà máng trống (hoặc heo bệnh mà hết thuốc) và không còn heo bán được: "Bác hàng xóm" hiện trên
  nông trại, tặng thức ăn / thuốc / vốn mua heo (DECISIONS PG-1) — không còn kẹt.

---

## Implementation assumptions

Các điểm spec để ngỏ hoặc tự mâu thuẫn, đã chốt trong `DECISIONS.md` (tóm tắt):

- **Máng ăn (Q4):** tính dạng đóng theo từng window — mọi bữa trong window được cộng trước, `advancePig` trừ hao
  đói cả window sau; thức ăn chia tham lam theo `slotIndex` tăng dần, nên window dài (offline) mà thiếu thức ăn
  thì heo slot thấp ăn trước. Xấp xỉ có chủ ý; đổi thì phải đổi golden §14.1. `resolveTrough` không cap hunger
  100 ở bước trung gian (S04A-1).
- **Đơn hàng (C1, Q1–Q3, A5, R07A-1):** tối đa 6 đơn sống (2 window × 3 slot); breed phân bố đều trên giống đã khám
  phá; đơn đã có id không bao giờ sinh lại; seed = hash cố định của (window, slot).
- **Skin (C2, C3):** `assets.json` là nguồn chân lý cho skin; cosmetics ngoài v1 (`Pig.cosmetics` luôn rỗng).
  Skin không đổi bất kỳ con số nào.
- **Bệnh (S03-1):** heo đói 0 coi là "đói" kể cả khi cùng lúc bẩn ≤ 30 (`<=` thay `<`).
- **Giá bán (S03-2):** cộng epsilon 1e-9 trước `floor` để tránh lỗi số thực.
- **Khám phá (R07B-1):** skin mặc định vào sách cùng giống, không thưởng lần hai; thưởng skin khi mua.
- **Kinh tế (R08-1):** cổng 2× áp cho giống mua được trong shop; giống chỉ phối ra được có tỉ lệ ~1,7–1,9× vì
  giá có được gần 0.
- **Ngủ (R09B-1):** spec không có luật dữ liệu → heo khỏe, rảnh ngủ trưa giữa các lần đi dạo (chỉ thị giác).
- **Vị trí heo (R05A-1):** không lưu; suy ra từ slot + hash id; đi dạo chỉ thị giác.
- **Layout (R05C-1):** một màn hình nông trại, menu mở bằng vật thể trong cảnh và nút trên top bar (thay nav dưới).
- **Âm thanh (R10-1):** bấm heo: đói < 30 kêu đói trước, vui ≥ 50 kêu vui, còn lại im.
- **Lưu trữ (R00-2, R00-4, R02-*):** file JSON qua port `SaveStorage`, không SQLite/HTTP; backup trước lần ghi
  đầu mỗi phiên rồi tối đa 15 phút/lần.
- **Vắng mặt (R11-1):** thời gian vắng = lúc này − lần cuối thế giới chạy (máng được resolve mỗi tick).

---

## Tự kiểm Phụ lục C (R12B)

| # | Dòng | Kết quả | Bằng chứng |
|---|---|---|---|
| 1 | core không import game/ui/store/platform, không API browser/Node | PASS | `npm run guard` OK; grep import = 0 |
| 2 | Không `Date.now()`/`Math.random()` trong core | PASS | grep = 0 dòng |
| 3 | Tốc độ đói/bẩn suy từ `growthSec` (D16) | PASS | `breeds.ts:20-21` `growthSec / 3`, `* 0.75` |
| 4 | `resolveTrough` trước `advancePig` | PASS | `trough.ts:83`; `trough.test.ts` |
| 5 | stage, level, happiness, weight, freeSlots không lưu | PASS | không field nào trong `types.ts` |
| 6 | Mọi thay đổi vàng qua 1 helper ghi Transaction | PASS | chỉ `engine/gold.ts:changeGold` ghi `player.gold` |
| 7 | `advanceWorld` hai lần cùng `now` không đổi gì | PASS | `advanceWorld.test.ts:11` |
| 8 | PINK máng trống dừng 33,33 % | PASS | `sim:economy`: "stall: 33.33%" |
| 9 | Lãi/giờ vui 100 ≥ 2× vui 0 | PASS | `sim:economy` 4,16×, exit 0 |
| 10 | PINK cần ~6 thức ăn | PASS | `sim:economy` food 6; `economy.test.ts` |
| 11 | Save v3 migrate sạch sang v2 | PASS | `save.test.ts:89` |
| 12 | Hỏng → backup → màn khôi phục; giữ `save.corrupt-*` | PASS | `fileSaveStorage.test.ts:48,60`; `saveFiles.test.ts:126` |
| 13 | Tắt giữa lúc ghi không hỏng `save.json` | PASS | `saveFiles.test.ts:30-53` |
| 14 | Ghi lỗi → banner + retry, không nuốt | PASS | `gameStore.test.ts:275` |
| 15 | Xuất rồi nhập lại y hệt | PASS | `save.test.ts:183`; e2e xuất file |
| 16 | Mọi `ErrorCode` có câu tiếng Việt | PASS | `config.test.ts:88` |
| 17 | Không chuỗi tiếng Việt ngoài `vi.ts` | PASS | chỉ còn trong comment và `nameVi` của config (Phụ lục A) |
| 18 | Game chạy trên placeholder | PASS | 71/71 asset placeholder; e2e xanh |
| 19 | Asset chỉ qua `assets.json`; `assets:check` | PASS | grep đường dẫn = 0; `assets:check OK` |
| 20 | Mọi dòng v1 `production`/`final`; credit audio | ĐẠT | `assets:release` OK (ART lô 1: 71 dòng production) |
| 21 | Mỗi dòng §11.3 đủ animation/VFX/âm/toast | PASS* | bảng dữ liệu + `audio.test.ts`, `feedback.test.ts`; *chưa xem hết trên bản desktop |
| 22 | Installer tạo lối tắt Desktop/Start Menu có icon | PASS* | cấu hình `build.nsis`; *installer 1.0.0 chưa build được (xem PROJECT_STATUS) |
| 23 | Không cần terminal/Node/server/port; 0 request mạng | PASS | `main.ts` chặn http(s); e2e khẳng định 0 request |
| 24 | Chạy được khi rút mạng từ lần đầu | PASS | không có lời gọi mạng; e2e không dùng mạng |
| 25 | Mở lần hai focus cửa sổ cũ | PASS | `main.ts:69-74` `requestSingleInstanceLock` |
| 26 | Gỡ/cài lại giữ save; cài đè migrate | PASS* | `deleteAppDataOnUninstall: false`, userData cố định; *chưa thử tay trên 1.0.0 |
| 27 | Dùng được ở 1024 × 640; nút ≥ 44 px | PASS | đo ở R11 (không cuộn ngang, 0 nút < 44 px) |
| 28 | `prefers-reduced-motion` là giá trị đầu | PASS | `visualStates.test.ts` |
| 29 | Đã thử trên Windows không có Node | **CHƯA** | cần người kiểm (xem `PROJECT_STATUS.md`) |

§15: Phase 1–3 đạt. Phase 4: asset v1 đủ (production). Phase 5: `UnInHomemade-Setup-1.0.0.exe` build được
(`electronDist` = Electron trong node_modules, tránh EPERM khi đổi tên thư mục giải nén), e2e §14.8 xanh; còn
chờ thử trên máy không có Node.

---

## Bàn giao

**Backlog (spec §20, chưa làm):** trồng rau (tầng thức ăn thứ hai) · đồ trang trí + `decorBonus` · sự kiện ngẫu
nhiên, ngày chợ · thành tựu, quà đăng nhập · xoay vòng skin theo mùa · nền tảng khác (macOS/Linux, mobile + thông
báo) · hệ cosmetics (mũ, kính, áo choàng — `Pig.cosmetics` đã có, luôn rỗng) · backup đám mây tuỳ chọn.

**Mỗi hệ thống nằm ở đâu:**

| Hệ thống | File |
|---|---|
| Hao đói/bẩn, lớn, bệnh | `src/core/engine/advancePig.ts` |
| Máng ăn | `src/core/engine/trough.ts` |
| Bắt kịp thời gian (advanceWorld) | `src/core/engine/advanceWorld.ts` |
| Hành động người chơi | `src/core/actions/*.ts` (pipeline `runAction.ts`) |
| Vàng + giao dịch | `src/core/engine/gold.ts` |
| Phối giống, sinh | `src/core/actions/breedPigs.ts`, `src/core/engine/breeding.ts` |
| Đơn hàng | `src/core/engine/orders.ts`, `src/core/actions/fulfillOrder.ts` |
| Bộ sưu tập, skin | `src/core/engine/collection.ts`, `src/core/actions/skins.ts` |
| Save: schema, migrate, xuất/nhập | `src/core/save/` |
| File save, backup, atomic | `electron/saveFiles.ts`, `src/platform/desktop/` |
| Store, vòng tick, retry | `src/store/gameStore.ts` |
| Manifest + registry asset | `src/core/assets/`, `public/assets/manifest/assets.json` |
| Cảnh nông trại | `src/game/scenes/MainFarmScene.ts`, `src/game/prefabs/` |
| Trạng thái hiển thị heo, đi dạo | `src/game/state/` |
| Feedback (animation → VFX → âm → toast) | `src/game/feedback/` |
| Âm thanh | `src/game/audio/AudioManager.ts` |
| Giao diện DOM | `src/ui/` (`app.ts`, `session.ts`, `screens/`, `components/`) |
| Chuỗi tiếng Việt | `src/i18n/vi.ts` |
| Cửa sổ, menu, mạng, single instance | `electron/main.ts` |

**Nạp art thật:** làm theo mục "Thêm / nâng cấp skin…" ở trên, theo thứ tự wave của luật vẽ §10 (wave 1: 4 heo
mặc định + `_sleep`, 8 fx, máng 3 trạng thái, bảng đơn, icon UI, 4 lớp nền, icon app `build/icon.png` →
`npm run icon`; wave 2: 13 skin P1 + `_sleep` — thêm trường `sleepAsset` vào dòng manifest —, công trình, prop,
mây, 12 âm thanh CC0 có credit). Xong khi `npm run assets:release` báo OK; rồi `npm run check`,
`npm run test:e2e`, `npm run dist:win`.
