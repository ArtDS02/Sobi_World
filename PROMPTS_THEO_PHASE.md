# PROMPT THEO PHASE — Ủn Ỉn Homemade (spec v4.1 Desktop, bản tối ưu token)

Mỗi khối ```text``` dưới đây là đặc tả **một task = một session sạch**. Skill `spec-to-source` tự đọc đúng block
(`grep -n "^### R05A" PROMPTS_THEO_PHASE.md`), bạn không cần dán.

Sản phẩm đích (spec v4.1 §0, §13, §15 Phase 5): **cài bằng installer → icon Desktop → double-click → chơi offline**,
có nhân vật, môi trường, animation, VFX, âm thanh, asset production và save bền. Không terminal, không localhost,
không port, không server.

---

## 0. Nguyên tắc tiết kiệm token (giữ từ bản cũ)

| Kỹ thuật | Tiết kiệm |
|---|---|
| Luật chung nằm **một lần** trong `CLAUDE.md` + adapter skill; block task không lặp lại | ~60 dòng/task |
| Block trỏ **đúng số dòng** spec (theo `SPEC_INDEX.md` sinh sau R00). Lệch → tra `SPEC_INDEX.md` theo số §, không đọc cả file | Spec ~1670 dòng → mỗi task đọc 50–250 dòng |
| Phụ lục A/B trích bằng `sed`, không gõ lại | ~15k token |
| Cấm đọc `hướng_dẫn_triển_khai.md`, `DESIGN_README.md`, 2 catalogue (trừ dòng task chỉ định), `archive/` | Tránh đốt hạn mức |
| Một file state `PROJECT_STATUS.md` ≤ 30 dòng; lịch sử = git log | Khôi phục ngữ cảnh ~2k token |
| Phaser/scene kiểm bằng hàm thuần có test + bạn nhìn bằng mắt; hạn chế screenshot | Task đồ hoạ rẻ hơn nhiều |

## 1. Cách dùng

1. Mở Claude Code tại `D:\Local\Un_In`. Code nằm chung thư mục với tài liệu (`public/assets/` của game khác `asset/` tài liệu).
2. Mỗi task: `/clear` → `/spec-to-source tiếp` (hoặc `/spec-to-source R03` để chọn task). Skill tự đọc đúng block.
3. Task xong khi Claude trả khối `DONE … NEXT:` (check xanh + commit + tag). Nó **tự dừng**. Gặp `BLOCKED … NEED:` thì chỉ trả lời đúng phần NEED.
4. Model: **Sonnet** cho hầu hết task. **Opus** nếu có cho R02 (Electron + file save), R05B (event + feedback), R06 (breeding).
5. Gần hết usage → prompt **WIP** (mục 4). Usage reset → `/clear` rồi **CONTINUE**.
6. Từ R02 trở đi, kiểm bằng `npm run dev:desktop` (cửa sổ desktop thật) hoặc cài từ `release/`. `npm run dev` (trình duyệt) chỉ để sửa nhanh.

**Lộ trình** (16 task + ART lặp lại):

| # | Task | Thay cho (cũ) | Ghi chú |
|---|---|---|---|
| S00–S08B | Nền, engine, save, action, store, DOM UI | — | **Đã xong** (tag `p08b`). Giữ nguyên code |
| R00 | Review kiến trúc + cập nhật tài liệu v4.1 | — | **Đã xong** (session review) |
| R01 | Platform seam: storage ra khỏi core, saveError, base './', vùng canvas | mới | không đổi hành vi |
| R02 | Desktop shell Electron + file save + installer | S17-B (PWA) | **★ chơi thử S08B trên bản cài** |
| R03 | Shop / Kho / Level / Slot / Lịch sử | S09 | |
| R04 | Nền tảng asset: manifest v2, registry, placeholder, assets:check | S13 (mở rộng, đưa lên sớm) | ART chạy được từ đây |
| R05A | Phaser: cảnh nông trại theo layout + entity sync + máng + chọn heo | S14A + S14B | |
| R05B | Event cho mọi action + FeedbackDirector | mới | **★ chơi thử 10 phút** |
| R06 | Breeding & birth | S10 | Opus nếu có |
| R07A | NPC orders | S11 | |
| R07B | Collection & skins | S12 | **★ chơi thử 30 phút** |
| R08 | Economy sim + fuzz | S19 | |
| R09A | Visual state động: idle/walk/eat/clean/happy + wandering | S15A | |
| R09B | Visual state overlay: sleep/sick/pregnant + reduceMotion | S15B | |
| R10 | Audio | S17-A | |
| R11 | Hoàn thiện UX desktop: tutorial, away summary, settings, recovery | S16 | |
| R12A | Polish presentation | mới | |
| R12B | QA Phụ lục C + README + release v1.0.0 | S20 | |
| ART | Nạp art/audio thật (wave 1, wave 2) | ART | bất kỳ lúc nào sau R04, lặp theo lô |

---

## 2. Đã xong (lộ trình cũ)

S00, S02, S03, S04A, S04B, S05, S06A, S06B, S07, S08A, S08B — xem `git log` và tag `p00`…`p08b`. Block cũ đã bỏ khỏi file
này (còn trong git history). Quyết định phát sinh nằm trong `DECISIONS.md`.

---

## 3. Prompt từng task

### R01 — Platform seam + nợ kiến trúc (không đổi hành vi)

```text
TASK R01 — PLATFORM SEAM. Theo CLAUDE.md. Không đổi hành vi game, không thêm dependency.

Đọc spec: §4 dòng 133-218, §9.1-9.4 dòng 802-834, Phụ lục B nhóm saveStatus (grep -n "saveStatus" rồi đọc 5 dòng).
DECISIONS: A1, S05-1, S07-1, S07-2, R00-2, R00-3, R00-4. Adapter §3, §4, §7.
Đọc code: src/core/save/storage.ts, src/store/gameStore.ts, src/store/tabGuard.ts, src/main.ts,
src/ui/app.ts (phần mountApp/render/patch), tsconfig.json, eslint.config.js, vite.config.ts,
.claude/spec-to-source.config.mjs.

Làm:
1. src/core/save/port.ts (chỉ type): SaveStorage, LoadResult, LoadSource; FileDialogs
   { exportSave(json, suggestedName): Promise<boolean>; importSave(): Promise<string | null>; openSaveFolder(): Promise<void> | null };
   InstanceGuard (hình dạng API tabGuard hiện có). Core không còn import `idb`.
2. Chuyển storage.ts → src/platform/web/idbSaveStorage.ts (logic giữ nguyên), tabGuard → src/platform/web/tabGuard.ts,
   phần download/upload file (nếu đang nằm ở ui/store) → src/platform/web/fileDialogs.ts.
   src/platform/index.ts: createPlatform() → { storage, dialogs, instanceGuard } (hiện chỉ web; R02 thêm desktop).
   main.ts inject vào store/UI. Test cũ chuyển path, nội dung test giữ nguyên.
3. Store: persist KHÔNG nuốt lỗi. snapshot.saveError: boolean; retry 1 s → 5 s → 30 s → mỗi 30 s; ghi được lại → false.
   State trong bộ nhớ luôn giữ. UI hiện banner vi.saveStatus.error (thêm nhóm vi.saveStatus theo Phụ lục B v4.1).
   Test: storage giả ném lỗi → saveError true, state giữ, retry thành công → false; không ghi chồng.
4. tsconfig: tách để src/core typecheck KHÔNG có lib DOM (vd tsconfig.core.json, chạy trong npm run typecheck).
   Xoá Known issue tương ứng.
5. Vite: base './' (tách config vite/vitest nếu cần). Kiểm dist/index.html dùng đường dẫn tương đối.
6. src/ui/app.ts: thêm vùng `.app__stage` cố định ngoài mọi patch() để R05A gắn canvas Phaser; màn farm DOM hiện tại vẫn chạy như cũ.
7. Guard + ESLint: cập nhật .claude/spec-to-source.config.mjs theo adapter §7 (bản đích), không còn ngoại lệ trong src/core;
   ESLint no-restricted-globals trong src/core (window, document, localStorage, indexedDB, navigator, fetch).
   Sửa adapter §4: xoá dòng ngoại lệ storage.ts. Thử phá 1 lần (probe localStorage trong src/core → guard exit 1), xoá probe.

XONG KHI: check + build xanh, toàn bộ test cũ xanh, grep guard core sạch (adapter §8), npm run dev chơi được như trước.
Commit, checkpoint, tag r01. DỪNG.
```

### R02 — Desktop shell + file save + installer

```text
TASK R02 — ELECTRON + FILE SAVE + INSTALLER. Theo CLAUDE.md.

Đọc spec: §9.1-9.4 dòng 802-834, §10.4 dòng 882-887, §13 dòng 994-1020, §14.6 dòng 1060-1062,
Phụ lục B nhóm settings/saveStatus/desktop dòng 1561-1605. DECISIONS R00-1, R00-4, R00-5, R00-9.
Đọc code: src/core/save/port.ts, src/platform/**, src/main.ts, package.json.

Làm:
1. devDeps: electron, electron-builder (+ cách build electron/ đơn giản nhất: tsc riêng hoặc plugin Vite — ghi lựa chọn
   vào DECISIONS). tsconfig riêng cho electron/ (lib node). Không import Node trong src/.
2. electron/main.ts: cửa sổ 1280×800, min 1024×640, nhớ kích thước/vị trí (file nhỏ trong userData), F11 fullscreen,
   ẩn menu bar ở production; protocol app:// phục vụ dist/ (loadURL app://game/index.html); single-instance (lần 2 →
   focus cửa sổ cũ); chặn navigation, window.open, permission, mọi request http(s) (session webRequest); CSP;
   autoplayPolicy 'no-user-gesture-required'; before-quit → gửi flush request, chờ renderer ≤ 3 s.
3. electron/saveFiles.ts (Node thuần, test bằng thư mục tạm trong vitest env node):
   readCandidates() → [{source:'save'|'backup:<file>', json}] theo thứ tự save.json rồi backup mới nhất trước;
   write(json): tmp → flush → rename (retry khi EPERM/EBUSY); backup từ save.json tốt trước lần ghi đầu mỗi phiên,
   sau đó ≤ 1 lần/15 phút, giữ 10; markCorrupt(source) → đổi tên save.corrupt-YYYYMMDD-HHmmss.json; listBackups,
   restoreBackup, exportTo(path), importFrom() (dialog), openFolder (shell.openPath).
   Validate/migrate KHÔNG làm ở main: renderer duyệt candidates bằng parseSave của core.
4. electron/preload.ts: contextBridge window.unin đúng §13.1. Type chung đặt ở src/platform/desktop/bridge.ts (chỉ type).
5. src/platform/desktop/: FileSaveStorage (SaveStorage qua window.unin, giữ ngữ nghĩa LoadResult + khoá SAVE_TOO_NEW),
   fileDialogs native, instanceGuard no-op. platform/index.ts chọn desktop khi có window.unin. Store nối onFlushRequest → flush().
6. UI tối thiểu: màn Cài đặt (đang placeholder) có 3 nút Xuất / Nhập (hỏi xác nhận) / Mở thư mục lưu + dòng
   saveFolderHint. UI đầy đủ ở R11. Chuỗi vào vi.ts theo Phụ lục B v4.1 (settings, desktop); bỏ install/installHint/update.
7. build/icon.png 1024 placeholder (script nhỏ trong scripts/, không dependency nặng) + build/icon.ico.
   electron-builder theo §13.3 (nsis, perUser, oneClick false, shortcut Desktop + Start Menu, productName "Ủn Ỉn Homemade",
   executableName UnInHomemade, appId com.uninhomemade.game, deleteAppDataOnUninstall false).
   Scripts: dev:desktop, build (renderer + electron), dist:win (→ release/, gitignore release/).
8. Test: saveFiles (atomic khi giả lập crash giữa chừng, rotation 10, giãn cách 15', corrupt rename, thứ tự chain),
   FileSaveStorage với bridge giả (fallback backup, tooNew dừng chuỗi, saveError).

XONG KHI: check + build xanh; npm run dist:win ra installer. Tự kiểm bản cài: shortcut Desktop có icon → mở → mua heo →
thoát → mở lại còn heo; tắt mạng vẫn chạy; mở lần 2 chỉ focus cửa sổ cũ; gỡ cài đặt còn thư mục save.
Commit, checkpoint, tag r02.
DỪNG ★ và gửi tôi: (a) 3 dòng cách cài + đường dẫn thư mục save, (b) checklist chơi thử S08B 5 dòng cho 15 phút trên bản cài.
Tôi chơi và phản hồi trước khi sang R03.
```

> **Sau khi chơi thử**, nếu cần chỉnh: dán `Phản hồi chơi thử: <ghi chú>. Chỉ chỉnh BALANCE trong src/core/config hoặc UI, không đổi luật. Nếu golden value đổi theo thì báo tôi trước.`

### R03 — Shop, Kho, Level, Slot, Lịch sử

```text
TASK R03 — SHOP / KHO / LEVEL / SLOT / LỊCH SỬ. Theo CLAUDE.md.

Đọc spec: §8.0 dòng 665-685, §8.10-8.11 dòng 743-750, §8.16 dòng 793-799, §15 Phase 2 dòng 1078. DECISIONS Q7.

Làm:
1. Action buySlot (gate level + vàng, cap 12) + test; phát SLOT_BOUGHT (thêm type này vào events.ts theo §8.0).
2. Màn Shop (heo, item), Kho, Lịch sử (≤200 transaction, mới nhất trước, vàng có dấu), XP bar + toast level-up.
   Chuyển nút mua heo tạm ở màn Nông trại (S08B-1) sang Shop.
3. Đổ máng từ kho hoặc bằng vàng trên UI.

XONG KHI: check + build xanh, kiểm trên npm run dev:desktop, commit, checkpoint, tag r03. DỪNG.
```

### R04 — Nền tảng asset: manifest v2 + Wave 0

```text
TASK R04 — ASSET FOUNDATION + PLACEHOLDER WAVE 0. Theo CLAUDE.md.

Đọc: art standard §4 dòng 155-204, §5 dòng 205-228, §7 dòng 255-406, §10 dòng 465-482;
spec §6.6 dòng 499-532, §11.1 dòng 918-933, §11.4 dòng 963-970, §12 dòng 971-993, §14.9 dòng 1069-1073.
Catalogue môi trường (chỉ các bảng kích thước): asset/building/ENVIRONMENT_CATALOGUE.md dòng 29-160.
DECISIONS C2, Q5, R00-7.

Làm:
1. src/core/assets/manifestSchema.ts (zod, đúng §7.2 v2) và registry.ts THUẦN: resolve(id), url(id), fallback skin →
   breed default, sleep → idle + fx_zzz (Q5), placements theo layer, SkinRegistry (giá/rarity/unlock/allowedBreeds từ
   manifest — C2). skins.ts chỉ còn 4 skin default + type (C2); xoá Known issue tương ứng.
2. src/platform/assetSource.ts: fetch đường dẫn TƯƠNG ĐỐI 'assets/manifest/assets.json' (chạy cả dev lẫn app://),
   validate, trả registry. Manifest lỗi → màn lỗi vi.desktop.manifestError.
3. public/assets/manifest/assets.json phạm vi v1, mọi row status "placeholder": 4 skin default + 13 P1, 8 fx (fx_zzz 3
   frame), prop_feed_trough 3 state + prop_order_board, building/prop P1 của catalogue, 4–6 lớp environment (§1A),
   icon UI (§4.1–4.3), 12 audio key, layout (designSize 1600×900, walkArea, placements hợp lý).
4. scripts/make-placeholders.ts (không dependency nặng; pngjs được, ghi lý do): PNG đúng kích thước catalogue, heo là
   hình bo góc màu khác nhau với chân ở 82 %, chỉ 4 skin có _sleep (để thử Q5); audio placeholder là file im lặng ngắn.
   Script npm "assets:placeholders".
5. scripts/assets-check.ts theo art standard §7.4 (mức kiểm theo status) + npm "assets:check", đưa vào "check".
   Test checker bằng manifest fixture hỏng.
6. Dev asset gallery (chỉ dev, ?dev=1 hoặc menu dev): lưới mọi id + ảnh + status, qua registry.
7. Test §14.9; `grep -rn "\.png\|\.ogg" src/` không ra kết quả (trừ đường dẫn manifest).

XONG KHI: check (gồm assets:check) + build xanh, commit, checkpoint (ghi 3 bước "thêm/đổi asset không đụng TS"), tag r04.
DỪNG. Từ đây có thể chạy ART song song.
```

### R05A — Phaser: cảnh nông trại + entity sync

```text
TASK R05A — PHASER FARM SCENE. Theo CLAUDE.md.

Đọc spec §11 dòng 893-937, §10.4 dòng 882-887; art standard §2 dòng 50-107, §5 dòng 205-228.
Đọc code: src/core/assets/registry.ts, src/ui/app.ts (vùng .app__stage), src/ui/screens/farmScreen.ts, API gameStore.

Làm src/game/:
1. config/phaser.ts; scenes BootScene (texture fallback sinh lúc chạy), PreloadScene (thanh tiến độ
   vi.desktop.loadingAssets; nạp environment, máng, fx, icon và skin của heo đang có), MainFarmScene. Canvas gắn vào
   .app__stage, co theo container, letterbox, design 1600×900. Phaser chỉ vẽ thế giới; menu vẫn DOM.
2. Dựng cảnh theo layout.placements, layer 0–5 (§11.1).
3. prefabs/PigSprite + reconcile Map<pigId, PigSprite> mỗi snapshot (§11.2). Hàm thuần pigView(pig, now, layout) →
   { textureId, scale (growth × Y), flipX, depth = y, overlays } + unit test.
4. Máng 3 trạng thái theo food (0 / ≤ cap/2 / > cap/2) — hàm thuần + test.
5. Anchor: đọc *.anchors.json theo manifest (thiếu → mặc định §5), mirror x' = 1 − x khi flipX — hàm thuần + test.
6. Click heo → chọn (panel DOM cập nhật), click nền → bỏ chọn. Thay lưới thẻ heo của màn Nông trại bằng canvas; panel DOM giữ.

Không tween, particle, âm thanh. Không cần screenshot; tôi tự xem bằng npm run dev:desktop.
XONG KHI: check + build xanh, commit, checkpoint, tag r05a. DỪNG.
```

### R05C — Một màn hình + popup theo vật thể (user yêu cầu sau R05A)

```text
TASK R05C — ONE SCREEN, CLICK WORLD OBJECTS. Theo CLAUDE.md. Đã làm; quyết định ở DECISIONS R05C-1.
Bỏ nav dưới; canvas phủ toàn màn; click quầy hàng / nhà kho / bảng đơn / chuồng / máng / giếng / heo → popup DOM.
Ánh xạ ở manifest layout.placements[].action. Thêm building prop_shop_stall (placeholder).
XONG KHI: check + build xanh, commit, checkpoint, tag r05c. DỪNG.
```

### R05B — Event cho mọi action + FeedbackDirector

```text
TASK R05B — ACTION EVENTS + FEEDBACK DIRECTOR. Theo CLAUDE.md.

Đọc spec §8.0 dòng 665-685, §11.3 dòng 938-962, §9.5 dòng 835-841. DECISIONS R00-6.
Đọc code: src/core/events.ts, src/core/actions/*.ts, src/store/gameStore.ts (onEvents), src/ui/app.ts (toast), src/game/.

Làm:
1. events.ts: thêm event §8.0 cho action đã có (PIG_BOUGHT, PIG_FED, PIG_CLEANED, PIG_TREATED, TROUGH_FILLED,
   ITEM_BOUGHT, PIG_RENAMED). Mỗi action phát đúng event; test cho từng action. Golden value không đổi.
2. Store: onEvents(fn(events, origin)) với origin 'action' | 'tick' | 'catchup' (catchup = tick đầu sau init hoặc sau khi
   cửa sổ hiện lại); action bị từ chối báo qua kênh riêng (onReject(error)).
3. src/game/feedback/feedbackTable.ts (dữ liệu đúng bảng §11.3) + FeedbackDirector: animation → VFX → sound → toast.
   catchup không phát animation/VFX. Tween cơ bản (bounce, hop, shake, exit, pop-in) + particle từ fx_* placeholder.
   Sound qua AudioPort no-op (R10 nối thật). Toast chuyển từ app.ts sang director (host toast DOM giữ nguyên).
4. reduceMotion: bỏ tween/particle, giữ toast (và sound sau R10).
5. Test: bảng phủ mọi GameEvent type (totality), catchup không animation, reject → ui_error + toast.

XONG KHI: check + build xanh, commit, checkpoint, tag r05b.
DỪNG ★ và gửi tôi checklist chơi thử 10 phút: mọi hành động đều có phản hồi nhìn thấy được, cảnh đúng layout placeholder.
```

### R06 — Breeding & birth

```text
TASK R06 — BREEDING & BIRTH. Theo CLAUDE.md.

Đọc spec: §5.3 dòng 295-330, §6.5 dòng 459-498, §8.0 dòng 665-685, §8.8-8.9 dòng 721-742, §14.4 dòng 1054-1056.
Đọc advanceWorld.ts (hook birth), src/game/feedback/feedbackTable.ts.

Làm:
1. breedPigs: đủ validation, phí, con được CHỐT lúc phối (rng lúc phối), giữ slot (D8), pregnancySec theo breed (D22).
   MYTHICAL không lai được. Phát BREEDING_STARTED.
2. Birth trong advanceWorld tại hook đã chừa: idempotent, growth của con tính từ endsAt. BIRTH đã có trong bảng feedback;
   kiểm hiệu ứng pop-in cạnh heo mẹ.
3. UI: chọn cặp, hiện xác suất kết quả, đếm ngược mang thai.
4. Test đủ §14.4. Chạy lại toàn bộ test engine phải xanh.

XONG KHI: check + build xanh, commit, checkpoint, tag r06. DỪNG.
```

### R07A — NPC orders

```text
TASK R07A — NPC ORDERS. Theo CLAUDE.md.

Đọc spec: §5.3 dòng 295-330, §8.0 dòng 665-685, §8.14 dòng 759-789, §14.5 dòng 1057-1059, grep "ORDER_" trong src/core/config.
Áp DECISIONS C1, Q1, Q2, Q3, A5.

Làm:
1. src/core/engine/orders.ts: windowIndex = floor(now/ORDER_WINDOW_MS), hash theo Q3, mulberry32, breed phân bố đều trên
   breed đã khám phá (Q1). Đơn đã có trong state không bao giờ sinh lại (Q2). Hết hạn → ORDER_EXPIRED.
2. Gọi trong advanceWorld tại hook đã chừa. fulfillOrder (sai breed/giới tính/happiness → lỗi; không nhận 2 lần), phát ORDER_FULFILLED.
3. Màn Đơn hàng. Click prop_order_board trong cảnh mở màn Đơn hàng.
4. Test §14.5 phần orders + 3 golden value của hash + test Q2.

XONG KHI: check + build xanh, commit, checkpoint, tag r07a. DỪNG.
```

### R07B — Collection & skins

```text
TASK R07B — COLLECTION & SKINS. Theo CLAUDE.md.

Đọc spec: §5.2 dòng 266-294, §6.6 dòng 499-532, §8.0 dòng 665-685, §8.13 dòng 754-758, §8.15 dòng 790-792,
§14.5 dòng 1057-1059, §15 Phase 3 dòng 1080. Áp DECISIONS C2, C3, R00-7. Đọc src/core/assets/registry.ts.

Làm:
1. discoveredBreeds/discoveredSkins + bonus khám phá đúng 1 lần (khi mua, sinh, nhận).
2. buySkin, equipSkin (phát SKIN_BOUGHT / SKIN_EQUIPPED). Core nhận SkinRegistry inject từ manifest (R04).
   Skin KHÔNG đổi bất kỳ con số nào — test chứng minh sellPrice/growth giống hệt khi đổi skin.
3. Màn Bộ sưu tập + mục skin trong Shop (thumbnail <img> qua registry, nạp lười). Đổi skin → texture swap + puff trong cảnh.
4. Test §14.5 phần collection.

XONG KHI: check + build xanh, commit, checkpoint, tag r07b.
DỪNG ★ và nhắc tôi chơi thử 30 phút trên bản desktop (game đã đủ hệ thống).
```

### R08 — Economy sim & fuzz

```text
TASK R08 — ECONOMY SIM + FUZZ INVARIANT. Theo CLAUDE.md.

Đọc spec: §6.4 dòng 388-458 (bảng sanity), §14.7 dòng 1063-1065, §5.5 dòng 346-351, §18 dòng 1125-1138,
Phụ lục C mục Balance (grep -n -i "balance" trong dòng 1625-1666).

Làm:
1. scripts/simulate-economy.ts (chạy bằng tsx, chỉ import src/core): in bảng theo §14.7. Exit 1 nếu vàng/giờ ở
   happiness 100 < 2× ở happiness 0. Script npm "sim:economy".
2. Kiểm số sanity §6.4 (PINK cần đúng 6 thức ăn, v.v.) thành test.
3. tests/unit/invariants.fuzz.test.ts: 1000 action ngẫu nhiên (seed cố định, gồm breed/order/skin) xen kẽ tua thời gian,
   sau mỗi bước schema §5.5 phải pass.
4. Thử: đặt SELL_MULT_SPAN=0 → script phải fail; rồi trả lại.

XONG KHI: sim:economy exit 0, check xanh, commit, checkpoint (dán bảng output vào body commit), tag r08.
Nếu bảng cho thấy Q4/Q5 của §18 nên chỉnh, chỉ ĐỀ XUẤT, không tự sửa. DỪNG.
```

### R09A — Visual state động + wandering

```text
TASK R09A — VISUAL STATE: idle / walk / eat / clean / happy + wandering. Theo CLAUDE.md.

Đọc spec §11 dòng 893-917, §11.3 dòng 938-962; art standard §2.4 dòng 95-107, §3 dòng 108-154.
Đọc src/game/prefabs/PigSprite.ts, src/game/feedback/.

Làm:
1. src/game/state/pigVisualState.ts: hàm thuần (pig, now, feedback đang chạy) → visual state theo bảng §11, test thứ tự ưu tiên.
2. idle thở (tween scale), walk squash/stretch + quay đầu scaleX 1→0→−1 trong 120 ms, eat xoay ~8° về máng + fx_crumb,
   clean fx_bubble + brightness, happy nhảy + fx_heart. Particle dùng chung trong src/game/fx/. FeedbackDirector dùng các state này.
3. Wandering trong layout.walkArea: chỉ thị giác, scale theo Y, Y-sort, dừng khi đang tương tác, KHÔNG ghi gì vào save.

XONG KHI: check + build xanh, commit, checkpoint, tag r09a. DỪNG.
```

### R09B — Visual state overlay + reduceMotion

```text
TASK R09B — VISUAL STATE: sleep / sick / pregnant + reduceMotion. Theo CLAUDE.md.

Đọc spec §11 dòng 893-917, §11.4 dòng 963-970; DECISIONS Q5. Đọc pigVisualState.ts và src/game/fx/.

Làm:
1. sleep: frame _sleep nếu manifest có; thiếu → idle + fx_zzz (spritesheet 3 frame) — test nhánh fallback.
2. sick: tint + fx_sick ở anchor fx_above; pregnant: fx_pregnant ở fx_above. Overlay đúng vị trí khi heo quay trái (hàm mirror R05A).
3. settings.reduceMotion (khởi tạo từ prefers-reduced-motion): tắt wandering, particle, tween không thiết yếu.
4. Test: wandering/visual không làm đổi updatedAt của save khi không thao tác.

XONG KHI: check + build xanh, commit, checkpoint (bảng 8 state → cách render), tag r09b. DỪNG.
```

### R10 — Audio

```text
TASK R10 — AUDIO. Theo CLAUDE.md.

Đọc spec: §12 dòng 971-993, §11.3 dòng 938-962; art standard §7.2 dòng 274-356 (chỉ phần audio).
Đọc src/game/feedback/, src/core/assets/registry.ts.

Làm:
1. src/game/audio/AudioManager.ts với ĐÚNG 12 key §12 (khớp từng chữ), file qua manifest.audio (volume, loop).
   Desktop: nhạc phát khi mở game; bản web dev: sau user gesture đầu. Thiếu file → im lặng, không lỗi console ở production.
2. Thay AudioPort no-op của FeedbackDirector bằng AudioManager. Click heo: pig_oink_happy / pig_oink_hungry theo §12.
   ui_click cho mọi nút DOM (một listener ủy quyền, không gắn từng nút).
3. Toggle musicOn/sfxOn lưu vào save (đã có field); đổi tức thì.
4. Test: map event → key (từ bảng), key thiếu file → không throw.

XONG KHI: check + build xanh, commit, checkpoint, tag r10. DỪNG.
```

### R11 — Hoàn thiện UX desktop

```text
TASK R11 — UX DESKTOP. Theo CLAUDE.md.

Đọc spec: §9.2-9.5 dòng 819-841, §10.3-10.4 dòng 879-887, Phụ lục B dòng 1561-1605 (settings → desktop).
Đọc src/ui hiện có (chỉ file cần sửa).

Làm:
1. Layout desktop 1024–1920 px: top bar, nav, panel bên; click target ≥ 44 px, không hover-only, focus bàn phím thấy được,
   không cuộn ngang. Phaser canvas co giãn đúng khi đổi kích thước cửa sổ / F11.
2. Tutorial 5 bước bỏ qua được (§10.3), lưu settings.tutorialDone.
3. Modal "Trong lúc bạn vắng mặt" khi vắng ≥ 10 phút, dựng từ events catchup; dòng máng ăn (giờ cạn + số heo ngừng lớn
   bao lâu) đứng đầu.
4. Màn Cài đặt đầy đủ: nhạc/sfx/reduceMotion, xuất/nhập/mở thư mục lưu, danh sách bản sao lưu + khôi phục, nhắc xuất nếu
   > 7 ngày (1 lần/phiên), thông tin + credit + phiên bản (vi.desktop.version).
5. Màn recovery đầy đủ: chọn bản sao lưu, nhập file, bắt đầu mới (xác nhận). Banner saveError rà lại.
6. Trạng thái loading/rỗng/lỗi cho mọi màn; rà mọi nút disable có lý do.

XONG KHI: check + build xanh, commit, checkpoint, tag r11. Gửi tôi 4 dòng tự kiểm ở 1024×640 và 1920×1080. DỪNG.
```

### R12A — Polish presentation

```text
TASK R12A — PRESENTATION POLISH. Theo CLAUDE.md. Chỉ làm danh sách dưới, không thêm tính năng.

Đọc spec §11.1 dòng 918-933, §11.3 dòng 938-962, §15 Phase 4 dòng 1082; art standard §10 dòng 465-482.

Làm:
1. Ambient: mây trôi chậm, cỏ/cây lay nhẹ (tween), tôn trọng reduceMotion.
2. Chuyển cảnh: fade-in sau Preload; mở/đóng màn DOM có transition ngắn.
3. Skin UI: nút/icon DOM dùng ui_* qua registry (top bar, nav, nút hành động); trạng thái hover/press/disabled.
4. Rà từng dòng §11.3 trên bản desktop: đủ animation → VFX → sound → toast; ghi dòng thiếu rồi sửa.
5. Hiệu năng: 12 heo + particle giữ ~60 fps trên máy dev; texture skin không dùng được giải phóng.
6. Báo cáo asset còn status placeholder trong phạm vi v1 (để chạy ART).

XONG KHI: check + build xanh, commit, checkpoint (danh sách placeholder còn lại), tag r12a. DỪNG.
```

### R12B — QA Phụ lục C, README, release

```text
TASK R12B — QA + README + RELEASE v1.0.0. Theo CLAUDE.md.

Đọc spec: Phụ lục C dòng 1625-1666, §15 dòng 1074-1087, §17 dòng 1119-1124, §14.8 dòng 1066-1068, §13.3 dòng 1007-1012.
Không đọc lại code hàng loạt: kiểm từng dòng checklist bằng lệnh (grep, chạy test cụ thể) và trích bằng chứng ngắn.

Làm:
1. Bảng Phụ lục C: mỗi dòng PASS/FAIL + bằng chứng 1 dòng. Đối chiếu 5 nhóm §15.
2. Sửa FAIL nhỏ ngay. FAIL lớn → Known issues trong PROJECT_STATUS.md, liệt kê trong DONE, không tự sửa lớn.
3. Cài @playwright/test, tests/e2e/smoke.spec.ts theo §14.8 (_electron.launch trên bản build, userData tạm, khẳng định
   không có request mạng). Script "test:e2e".
4. README.md của game đủ các mục §17, gồm "Implementation assumptions" (gom từ DECISIONS.md) và known limitations.
   Link tới DESIGN_README.md.
5. Release: version 1.0.0 trong package.json, npm run dist:win, ghi kích thước installer, sim:economy exit 0, assets:check
   không còn placeholder trong phạm vi v1 (nếu còn → BLOCKED kèm danh sách, NEED: chạy ART), check xanh, e2e xanh.
   README thêm mục "Bàn giao": backlog (§20), vị trí từng hệ thống, cách nạp art thật. PROJECT_STATUS = DONE. git tag v1.0.0.

XONG KHI: tất cả lệnh trên xanh. DONE kèm: dòng Phụ lục C FAIL (nếu có), số test, kích thước installer, và 4 dòng để
tôi tự kiểm trên một máy Windows chưa cài Node.
```

### ART — Nạp art / audio thật (wave 1, wave 2; lặp theo lô)

> Sinh ảnh **ngoài** Claude Code (theo `asset/AI_ASSET_GENERATION_PACK.md` §0–§7, img2img từ `style_reference_pigs.png`;
> môi trường theo `ENVIRONMENT_CATALOGUE.md` §1A). Audio: tự làm hoặc CC0, ghi nguồn. Thả file thô vào `art_inbox/`
> (ảnh) và `art_inbox/audio/` (kèm `credits.txt`: id, tác giả, license), rồi gọi `/spec-to-source ART`.

```text
TASK ART — HẬU KỲ + ĐĂNG KÝ ASSET. Theo CLAUDE.md.

Đọc: asset/AI_ASSET_GENERATION_PACK.md dòng 370-451 (§8 hậu kỳ, §9 đăng ký); art standard §4 dòng 155-204,
§7.2-7.4 dòng 274-406, §10 dòng 465-482. Không xem từng ảnh bằng mắt trừ khi script báo lỗi.

Làm:
1. (Lần đầu) scripts/process-art.ts: với mỗi ảnh trong art_inbox/: kiểm/tách nền trong suốt, crop + resize đúng kích
   thước loại asset, canh đường chân 82 % (heo), đặt tên đúng §7.1 theo id, ghi đè file placeholder cùng đường dẫn.
   Audio: chuyển/giữ .ogg, chuẩn hoá âm lượng nếu được, đặt đúng tên key. Báo ảnh/âm thanh không đạt §4.5 / §8.3.
2. Cập nhật row trong assets.json: status "production", credit/license cho audio. Không sửa file .ts nào ngoài script.
3. npm run assets:check + check xanh. Xem lại trong dev asset gallery.

XONG KHI: check + build xanh, commit `feat(art): <lô>`. Liệt kê đã nhận / bị loại (lý do) / còn placeholder trong phạm vi v1. DỪNG.
```

---

## 3b. Lộ trình U — Update & Expand (master prompt 2026-10-02)

Quyết định: `UPDATE_AUDIT.md` §5 (D1–D9) + DECISIONS U00-1. Species: `UN_IN_PIG_CATALOGUE.md` (từ U01).
Thứ tự: U01 → U03 → U04 ★ → U05 ★ → U06 ★ → U07 → U08. Code chạy trên placeholder trước, art ở U07.

### U01 — Species + rarity + save v3

```text
TASK U01. Theo CLAUDE.md. Đọc UPDATE_AUDIT.md §1, §3–§6; PIG_CONCEPT_PROPOSAL.md §3.
Làm:
1. core/config/rarity.ts: RARITY_VALUES COMMON..LEGENDARY, ánh xạ P1..P5 (D9), thứ tự bậc.
2. BreedDef thêm rarity, family, unlockLevel?; thêm 15 species → tổng 19 (proposal §3). Số TUNABLE.
3. Manifest: row default skin cho species mới (placeholder), pig_white/black/brown/spotted thành default
   của species (priceGold null). allowedBreeds theo D6. STARTER_SKINS = mọi default skin của breed.
4. buyPig chặn unlockLevel. Save v3 + migrate v2→v3 theo D3 (test).
5. core/config/clothing.ts: ClothingDef + CLOTHING rỗng (D1).
6. UN_IN_PIG_CATALOGUE.md từ proposal (cột Asset Status thật).
XONG KHI: check xanh, assets:check xanh, test migrate D3, commit, tag u01. DỪNG.
```

### U03 — Breeding theo luật

```text
TASK U03. Theo CLAUDE.md. D4. Thay BREEDING_MATRIX bằng core/config/breedingRules.ts: trọng số
SAME_PARENT / SAME_FAMILY / TIER_UP / TIER_UP_2 + MUTATIONS theo cặp; breedingOutcomes(a,b) luôn có kết quả
(trừ species breedable=false). Rarity hiếm hơn → xác suất thấp hơn. Test: bảng trọng số chính xác cho vài cặp +
Monte Carlo seed. Viết lại test breeding cũ. UI phối giống hiện tỉ lệ (nếu đã có chỗ).
XONG KHI: check xanh, commit, tag u03. DỪNG.
```

### U04 — Shop + collection theo rarity ★

```text
TASK U04. Theo CLAUDE.md. Tab Heo: nhóm theo rarity, badge màu (token SCSS $c-rarity-*), khoá theo
unlockLevel; tab Skin tách rõ; collection nhóm rarity + đếm x/y; order chọn breed theo rarity/đã khám phá.
sim:economy chạy với species mới, chỉnh số trong config tới khi hợp lý.
XONG KHI: check + sim xanh, commit, tag u04. NEXT: user chơi thử.
```

### U05 — Farm layout + nameplate + perf ★

```text
TASK U05. Theo CLAUDE.md. Tham khảo asset/building/style_reference_building.png. Nhãn công trình nhỏ, không đè
walkArea/heo; bảng tên heo nhỏ trên đầu, layout thuần (game/view/nameplateLayout.ts) đẩy tránh chồng, có test.
Đo fps 12/20/30 heo (dev tool); ổn thì nâng MAX_SLOTS (D7) + bảng mở slot.
XONG KHI: check xanh, ảnh chụp farm, fps ghi vào commit, tag u05. NEXT: user chơi thử.
```

### U06 — Gift box ★

```text
TASK U06. Theo CLAUDE.md. UPDATE_AUDIT.md §6. Save v4 gifts; core/config/gifts.ts; engine/gifts.ts
(resolveGifts trong advanceWorld, offline, cap trên farm, reward chốt lúc spawn, clamp MIN/MAX);
actions/openGift.ts (GIFT_REWARD qua changeGold + XP, claim 1 lần); game/view/giftPlacement.ts (seed → vị trí,
validate, retry); prefab + FeedbackDirector: khói → pop 0→1.15→0.95→1 → bounce → idle; mở: 1.1 → pop → số bay.
Catch-up không animation. Hết tween khi hộp mất.
XONG KHI: check xanh, test offline/claim-once, xem trên dev, tag u06. NEXT: user chơi thử.
```

### U07 — Asset expansion

```text
TASK U07. Skill image-to-asset. Species placeholder → production theo UN_IN_PIG_CATALOGUE.md; gift box
(đóng/mở), fx khói, badge rarity; props còn thiếu trong style_reference_building.png nếu layout dùng.
XONG KHI: assets:check xanh, tag u07. DỪNG.
```

### U08 — Polish

```text
TASK U08. Rà animation/game feel, layout cửa sổ nhỏ/lớn, perf 5/10/20/30 heo, timer/tween leak, save/load.
XONG KHI: check + e2e xanh, fps ghi lại, tag u08.
```

## 4. Prompt tiện ích

### CONTINUE — sau reset usage, bị ngắt giữa task, hoặc sang task tiếp

```text
/spec-to-source tiếp
```
Skill tự đọc `PROJECT_STATUS.md`, kiểm `git diff`, sửa nền đỏ nếu có và làm tiếp — không hỏi lại.

### WIP — khi gần hết usage

```text
Sắp hết usage: làm theo SKILL.md §5 (về trạng thái xanh, ghi state, commit wip).
```

### FIX — khi Claude làm sai

```text
Dừng. Lỗi: <mô tả>. Kiểm xem nguyên nhân là (a) hiểu sai spec, (b) sai kiến trúc, hay (c) bug cục bộ — trả lời 2 dòng trước khi sửa.
(a) trích đúng dòng spec, sửa, ghi DECISIONS.md. (b) `git reset --hard <tag task trước>` (BLOCKED nếu làm mất việc chưa commit). (c) sửa + thêm test bắt được bug.
Sau đó npm run check xanh toàn bộ. Ghi 1 dòng vào Known issues trong PROJECT_STATUS.md. Báo DONE.
```

### SPLIT — khi một task quá lớn so với một cửa sổ usage

```text
Task hiện tại quá lớn. Chia phần còn lại thành 2 nửa A/B có điểm dừng xanh. Làm xong A, commit, checkpoint ghi rõ B gồm gì, tag <id>a. DỪNG.
```

### SPEC-INDEX — sau khi sửa spec

```text
Sinh lại SPEC_INDEX.md từ heading (bỏ code fence) cho spec + art standard + AI pack; rà các block chưa làm trong PROMPTS_THEO_PHASE.md, sửa số dòng lệch. Commit docs.
```

---

## 5. Quy tắc giữ token (cho bạn, người vận hành)

- Mỗi task **`/clear`** trước khi gọi skill. Đừng chạy 2 task trong một session dù còn usage.
- Đừng dán log dài hay ảnh vào chat; bảo Claude tự chạy lệnh với `| tail`.
- Đừng hỏi "giải thích code" giữa task; xem `git log` / `PROJECT_STATUS.md`.
- Task cảnh/Phaser: **bạn** mở `npm run dev:desktop` và nhìn, rồi mô tả lỗi bằng 1–2 câu. Rẻ hơn rất nhiều so với để Claude chụp và phân tích screenshot.
- Thấy Claude đọc file ngoài danh sách đã chỉ định hoặc sửa file ngoài phạm vi → ngắt (Esc) và nhắc "theo CLAUDE.md".
- Sau R02, R05B và R07B **bắt buộc chơi thử**. Phát hiện game chưa vui ở đây rẻ hơn mọi lúc khác.
- ART không cần đợi: có lô ảnh nào thì chạy lô đó (sau R04). Ưu tiên wave 1 (4 heo mặc định, fx, máng, môi trường, icon app).
