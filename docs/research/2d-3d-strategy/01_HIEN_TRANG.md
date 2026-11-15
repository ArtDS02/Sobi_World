# 01 — Hiện trạng Sobi World (mục B)

Ngày khảo sát: 2026-11-11. Nhánh: `feature-plot-upgrade` (commit `660d17f1`, 2026-11-10). Phiên chỉ-đọc: không build, không chạy game, không mở ảnh.
Nhãn: **[DỮ LIỆU]** đọc / đo được trong repo (kèm file hoặc lệnh) · **[NHẬN ĐỊNH]** suy luận của người khảo sát · **[GIẢ ĐỊNH]** chưa có bằng chứng.

Tóm tắt một dòng: game 2D chạy trên một `Phaser.Game` duy nhất, logic tách sạch khỏi renderer; khoảng 70 % dòng TypeScript trong `src/` không phụ thuộc cách vẽ, khoảng 20 % là code Phaser phải viết lại nếu đổi renderer, khoảng 10 % là toán trình bày 2D phải chỉnh. GĐ14 (art) đang làm dở; thử nghiệm 3D duy nhất của dự án (Sobi Studio, decision 051) đã dừng ở cổng U1.

---

## 1. Cấu trúc Sobi World

### 1.1 Giai đoạn và nhánh

| Mục | Giá trị | Nguồn |
|---|---|---|
| Giai đoạn | **GĐ14 đang làm** (art, animation, VFX, âm thanh). GĐ13 đã merge `main` (gameplay freeze, decision 021). GĐ15 = phát hành | [DỮ LIỆU] `docs/PROGRESS.md` dòng 4–5 |
| GĐ14 đã bắt đầu chưa | Đã bắt đầu, **chưa merge `main`**. Chuỗi nhánh `phase-14-art` → `phase-14-unity-studio` → `overnight-hardening` → `feature-plot-upgrade` | [DỮ LIỆU] `docs/PROGRESS.md` dòng 4; `git branch -a` |
| Nhánh hiện tại | `feature-plot-upgrade`, hơn `main` **238 commit**; repo có 455 commit | [DỮ LIỆU] `git log --oneline main..HEAD \| wc -l`, `git log --oneline \| wc -l` |
| Phiên bản | 0.13.0 | [DỮ LIỆU] `package.json` dòng 4 |
| Save | world v13 (decision 056); kiến trúc ghi v11 | [DỮ LIỆU] `docs/PROGRESS.md` (mục 2026-11-09), `docs/ARCHITECTURE.md` §9 |
| Việc làm gần nhất | Decision 056 (Level 100, bậc tầng mây / khu đất, đúc mẫu khuông), 057 (HUD, hiệu ứng nâng bậc, bố cục kéo-thả) | [DỮ LIỆU] `git log -5`, `docs/PROGRESS.md` nhật ký 2026-11-09, 2026-11-10 |
| File đang sửa chưa commit | `content/farm/layout.json` (của chủ dự án), làm 2 test đỏ | [DỮ LIỆU] `git status`, `docs/PROGRESS.md` nhật ký 2026-11-10 |

### 1.2 Các Area

Gameplay theo `docs/SOBI_WORLD_PROJECT_SPEC_V2.md` §3, §8; số lượng nội dung đếm trong `content/` (mục 4.4).

| Area | Gameplay | Cách trình bày hiện tại |
|---|---|---|
| **Sảnh Sobi (Plaza)** | Trung tâm, cổng sang 5 Area, Bảng đơn hàng, Chợ, NPC. Area chưa mở hiện trạng thái khóa | Ảnh nền vẽ đầy đủ, có ngày / đêm (`PlazaLight`), bướm, thú nhàn rỗi. Decision 025 có tên "plaza-without-character" (bỏ nhân vật ở Sảnh) |
| **Farm** | Nuôi heo: cho ăn, dọn phân, vuốt ve, chữa bệnh, lai giống, xuất chuồng. Heo có AI hành vi (lang thang, tìm máng, ngủ đêm). 87 giống trong `content/farm/species.json` | Nền **vẽ bằng code** (`backdropPaint.ts`), heo là 1 ảnh + ảnh ngủ / thức, 4 mùa, ngày / đêm |
| **Garden** | Trồng trọt trên ô đất: gieo, tưới, bón, thu hoạch; cây héo nếu để lâu. 13 cây trồng, 4 khu, drone bón phân (decision 028) | Ảnh nền `bg_garden`, khu khác nhau bằng màu phủ; cây uốn theo gió bằng Phaser Rope |
| **Aquarium** | Nuôi cá trong bể, giữ nước sạch, bán, sưu tầm, lai, câu cá; có cá đánh được. 30 loài | Ảnh nền 5 nơi theo cấp bể; cá bơi nhiều kiểu, thân uốn bằng Rope |
| **Cloud** | Vườn hoa phép trên mây: hạt + nước tinh khiết + phân bón, nấu potion. 14 hoa, 10 tầng mây (decision 023) | Ảnh đảo mây, hoa uốn, chim mây bắt sâu, drone |
| **Adventure** | Đội tối đa 3 sinh vật, đi bộ trên bản đồ vùng (18 bản đồ, 4 vùng), chạm nhóm quái thì vào trận **đánh theo lượt**: thứ tự theo Tốc độ, 112 skill, 9 hệ, 25 trạng thái, 6 phản ứng nguyên tố. Thua không chết, chỉ Kiệt sức | Bản đồ tile + tranh vẽ (v2 / v3), camera bám đội; trận vẽ bằng scene Phaser riêng nằm dưới HUD DOM |

Nguồn bảng: [DỮ LIỆU] `docs/SOBI_WORLD_PROJECT_SPEC_V2.md` dòng 51–188; `docs/research/AREA_LAYOUT_ANIMATION_PROPOSAL.md` §2; `content/*/*.json`; `docs/decisions/` (tên file 023, 025, 028).

Quy tắc hiệu năng đã chốt: Area không hiển thị chỉ tính số liệu, không chạy AI di chuyển và animation. [DỮ LIỆU] Spec V2 dòng 40.

---

## 2. Kiến trúc và engine

### 2.1 Phiên bản

| Thành phần | Khai báo (`package.json`) | Đang cài (`node_modules/<pkg>/package.json`) |
|---|---|---|
| Phaser | `^3.90.0` | 3.90.0 |
| Electron | `^44.5.1` | 44.5.1 |
| Vite | `^8.3.1` | 8.3.1 |
| TypeScript | `^6.0.3` | 6.0.3 |
| Vitest | `^5.0.3` | 5.0.3 |
| electron-builder | `^26.15.3` | 26.15.3 |

[DỮ LIỆU] `package.json` dòng 71–98; lệnh `node -e "require('./node_modules/<pkg>/package.json').version"`.

Phụ thuộc runtime chỉ có 4 gói: `@fontsource/baloo-2`, `idb`, `phaser`, `zod`. **Không có thư viện 3D nào** (không three, babylon, playcanvas). [DỮ LIỆU] `package.json` dòng 71–76; `grep -nE "three|babylon|playcanvas" package.json package-lock.json` không ra kết quả.

### 2.2 Renderer

- `type: Phaser.AUTO`, `render: { preserveDrawingBuffer: true }`, `scale.mode: NONE` (canvas lấy cỡ từ CSS, camera fit khung thiết kế). [DỮ LIỆU] `src/areas/farm/scene/config/phaser.ts` dòng 16–30.
- Khung thiết kế Adventure 1600 × 900. [DỮ LIỆU] `src/areas/adventure/scene/mapCamera.ts` dòng 9.
- **Toàn game chỉ có một `Phaser.Game`**, tạo ở `createFarmView` (`src/areas/farm/scene/farmView.ts` dòng 72–84). Các scene khác (Plaza, Garden, Aquarium, Cloud, Adventure, Battle) được app truyền vào dưới dạng `extraScenes` và ngủ / thức theo Area (`showScene` / `sleepScene`). [DỮ LIỆU] `src/app/start.ts` dòng 226–267.
- Nhiều hiệu ứng có đường lui khi không có WebGL (cây / cá / skin đứng yên hoặc nghiêng cả ảnh). [DỮ LIỆU] `grep -rn "WEBGL" src` (`fxRipple.ts` dòng 128, `fishBody.ts` dòng 37, `puppet.ts` dòng 88, `skinView.ts` dòng 5).
- [NHẬN ĐỊNH] Trong Electron 44, `Phaser.AUTO` gần như chắc chắn chọn WebGL; chưa đo trên máy (phiên không chạy game).

### 2.3 Thư mục `src/`

```text
src/core/       nền tảng thế giới: clock, simulation, save, economy, inventory, assets, content, rng…
src/systems/    gameplay dùng chung: creature, health, breeding, combat, plants, weather, animation (rig thuần)…
src/areas/<id>/ index.ts + logic/ (thuần, có test) + scene/ (Phaser) + ui/ (DOM + view-model)
src/ui/         components, goals, live (DOM); world/, puppet/ (Phaser dùng chung)
src/app/        composition root: store, vòng lặp, chuyển Area
src/platform/   adapter desktop / web (save file)
src/i18n/       bảng chuỗi
electron/       tiến trình chính (Node API chỉ ở đây)
tools/admin/    Admin Dashboard (chỉ bản phát triển)
content/        JSON nội dung + schemas/ (zod)
```

[DỮ LIỆU] `ls src`; `docs/ARCHITECTURE.md` §2. Thư mục `src/store`, `src/game` mà ARCHITECTURE.md nhắc là code Sobi Farm cũ **không còn** (đã chuyển hết sang khuôn Area).

### 2.4 Quy tắc phụ thuộc và guard

- Chiều phụ thuộc: `app → areas/* → systems/* → core/*`; Area không import Area khác. [DỮ LIỆU] `docs/ARCHITECTURE.md` §3.
- Guard tự động `npm run guard` (`scripts/guard/check-architecture.mjs` + `config.mjs`), nằm trong `npm run check`:
  - bảng `layers` (dòng 14–24): `core` chỉ import `content`; `systems` import `core`, `content`; `areas` (cô lập nhau) import `core`, `systems`, `ui`, `i18n`, `content`; `ui` import `core`, `systems`, `i18n`.
  - danh sách cấm `PURE` (dòng 4–7): `Date.now(`, `Math.random(`, `new Date()`, `window.`, `document.`, `localStorage`, `indexedDB`, `navigator.`, `fetch(`, `require(`, `from 'node:` áp cho `src/core`, `src/systems`, `content`, và **`src/areas/*/logic/`** (dòng 25–31).
  - mỗi file tối đa 300 dòng (dòng 10).
- [DỮ LIỆU] Guard **không** có luật cấm `import 'phaser'` theo tên; việc `core` / `systems` / `logic` không dùng Phaser hiện đúng trên thực tế (mục 3.2) và được giữ gián tiếp nhờ luật cấm `window.` / `document.` cùng `tsconfig.core.json`.

---

## 3. Đo mức tách biệt

### 3.1 Cách đo

- Số dòng: `wc -l` trên mọi file `*.ts` (gồm dòng trống và comment). Dòng trong repo dài (file ≤ 300 dòng) nên có kèm số byte ở vài chỗ.
- "File Phaser" = file có `from 'phaser'` (`grep -rlE "from ['\"]phaser['\"]"`).
- "UI DOM" = file trong `areas/*/ui` khớp `HTMLElement|document\.|ui/dom'|\bh\(`; còn lại gọi là "view-model thuần".
- Đây là phân loại theo từ khoá, sai số vài phần trăm. Không đo độ khó, chỉ đo khối lượng dòng.

### 3.2 Xác nhận độ thuần

| Kiểm tra | Kết quả |
|---|---|
| `grep -rnE "phaser\|Phaser\|document\.\|window\.\|HTMLElement\|Date\.now\|Math\.random\|from 'node:" src/core` | 1 dòng, là comment (`src/core/config/dayNight.ts:99`). **`src/core` không import Phaser, không DOM** |
| Cùng lệnh (Phaser + DOM) trên `src/systems` | 3 file, cả 3 là comment (`systems/animation/{index,plantBend,skin}.ts`) |
| Cùng lệnh trên `src/areas/*/logic` | 3 file, là comment hoặc chữ "window" trong câu tiếng Anh (`walkMotion.ts:3`, `mortality.ts:18`, `orders.ts:19`) |
| File có `from 'phaser'` theo thư mục | `areas/adventure/scene` 29 · `areas/farm/scene` 27 · `areas/aquarium/scene` 7 · `areas/plaza/scene` 7 · `areas/cloud/scene` 6 · `areas/garden/scene` 6 · `src/ui` 16 (toàn bộ ở `ui/world`, `ui/puppet`) · `tools/admin` 6. **Tổng trong `src/`: 98 file / 681** |
| `areas/*/ui` | 0 file import Phaser |

[DỮ LIỆU] các lệnh grep ghi trong bảng, chạy 2026-11-11.

### 3.3 Bảng số liệu theo lớp

| Lớp | File `.ts` | Dòng | Ghi chú |
|---|---:|---:|---|
| `src/core` | 80 | 5 367 | thuần |
| `src/systems` | 60 | 4 306 | thuần; trong đó `animation/` 13 file, 1 251 dòng (toán rig 2D), `combat/` 10 file, 1 244 dòng |
| `src/areas/*/logic` | 185 | 12 651 | thuần (farm 4 968 · adventure 3 945 · aquarium 1 409 · cloud 1 108 · garden 1 055 · plaza 116 · template 50) |
| `src/areas/*/scene` | 130 | 16 156 | 82 file Phaser = 11 454 dòng; 48 file không Phaser = 4 702 dòng (config, state, bảng feedback) |
| `src/areas/*/ui` | 113 | 14 087 | DOM 55 file = 7 577 dòng; view-model thuần 58 file = 6 510 dòng |
| `src/areas/*` file gốc (`index.ts`, `feedback.ts`, `stage.ts`) | 18 | 793 | |
| `src/ui` | 62 | 5 134 | Phaser (`world/`, `puppet/`) 1 374 dòng; DOM 3 760 dòng |
| `src/app` | 10 | 635 | |
| `src/platform` | 13 | 640 | |
| `src/i18n` | 10 | 5 282 | |
| **Tổng `src/`** | **681** | **65 051** | 2,99 MB |
| `electron/` | 11 | 1 105 | |
| `tests/` | 195 (178 `*.test.ts`) | 25 494 | 40 file test tham chiếu `scene/`, `ui/world` hoặc `ui/puppet`; 1 file nhắc Phaser |
| `tools/admin/` | 89 | 15 665 | 6 file Phaser = 1 701 dòng (`battleLab`, `rigLab`, `plantLab`, `plotLab`…) |
| `scripts/` | 123 `.ts` + Python | 17 309 + 7 665 | pipeline art, rig, studio, sim, guard |
| `content/schemas/` | 69 | 3 837 | zod |
| `content/**/*.json` | 120 | 48 877 | 1,75 MB |
| SCSS (`src/styles`) | 34 | 8 567 | |

Riêng Adventure (`src/areas/adventure`, 118 file, 14 537 dòng): `logic` 37 file / 3 945 · `scene` 35 file / 4 579 (Phaser 29 file / 4 014; trong đó `scene/battle/` 18 file / 2 454) · `ui` 43 file / 5 849 (DOM 14 file / 2 378; thuần 29 file / 3 471) · file gốc 3 / 164.

[DỮ LIỆU] `find <dir> -name "*.ts" | wc -l` và `... | xargs cat | wc -l` cho từng thư mục, chạy 2026-11-11.

### 3.4 Nếu đổi 2D → 3D: giữ, sửa, bỏ

Ba nhóm:

- **(a) Giữ nguyên**: không biết gì về renderer. `core`, `systems` (trừ `animation`), `areas/*/logic`, `i18n`, `platform`, `app`, file gốc của Area, toàn bộ UI DOM, view-model thuần không chứa toán chuyển động.
- **(b1) Chỉnh**: code thuần nhưng viết theo hệ toạ độ / phép biến đổi 2D. Gồm file không-Phaser trong `scene/` (4 702 dòng), toán tư thế trận trong `adventure/ui` (`battlePose`, `battleMoves`, `battlePerf`, `castTracks`, `propMotion`, `ribbonMotion`, `motionProfiles`, `poseKit` = 1 019 dòng), `systems/animation` (1 251 dòng).
- **(b2) Viết lại**: mọi file `from 'phaser'`.

| | Dòng `src/` | (a) Giữ nguyên | (b1) Chỉnh | (b2) Viết lại |
|---|---:|---:|---:|---:|
| **Toàn game (phương án C)** | 65 051 | 45 251 = **69,6 %** | 6 972 = **10,7 %** | 12 828 = **19,7 %** |
| **Chỉ Adventure (phương án B)**, tính trên code Adventure | 14 537 | 8 939 = **61,5 %** | 1 584 = **10,9 %** | 4 014 = **27,6 %** |
| Phương án B tính trên toàn `src/` | 65 051 | khoảng **89–91 %** không đụng | 1 584 = 2,4 % | 4 014 = 6,2 % |

[DỮ LIỆU] cộng từ bảng 3.3. Cách cộng (a) toàn game: 5 367 + 3 055 + 12 651 + 5 282 + 640 + 635 + 793 + 3 760 + 7 577 + 5 491.

**Sẽ bỏ hẳn** nếu sinh vật trận thành model 3D có xương: runtime puppet rig 2D, gồm `src/ui/puppet` (393 dòng), phần rig của `systems/animation` (`clip`, `life`, `performer`, `skeleton`, `skin`, `rigs`, `poseFade`, `warp` = 874 dòng), `scene/battle/battlePuppets.ts` (93 dòng): khoảng 1 360 dòng = 2,1 % `src/`. Rig hiện **chỉ dùng trong trận Adventure** ("Farm / Garden / Cloud / Sảnh chưa dùng rig", `docs/PROGRESS.md` dòng 11), nên với phương án B phần này cũng mất chỗ dùng trong game. [DỮ LIỆU + NHẬN ĐỊNH]

Ngoài `src/`:

| Phần | Ảnh hưởng |
|---|---|
| `electron/` (1 105 dòng), save, migration | Giữ nguyên [NHẬN ĐỊNH, dựa trên việc `electron/` không import code vẽ] |
| `tests/` | 138 / 178 file test không tham chiếu `scene/`, `ui/world`, `ui/puppet` → giữ. 40 file còn lại phải xem từng cái [DỮ LIỆU: `grep -rlE "areas/[a-z]+/scene\|ui/world\|ui/puppet" tests \| wc -l` = 40] |
| `content/` gameplay (species, items, skills, enemies, balance, recipes…) | Giữ nguyên: khoảng 12 100 dòng JSON |
| `content/` trình bày 2D | Phải làm lại hoặc chuyển đổi: `content/anim/rigs/*.json` (44 file, khoảng 20 900 dòng, sinh bằng script), `content/adventure/battle_fx.json` (9 769 dòng: kịch bản theo mốc thời gian nhưng tham số là px / ảnh 2D), `content/*/layout.json` + `adventure/maps.json` (6 085 dòng toạ độ 2D). Tổng khoảng 36 800 / 48 877 dòng = **75 % số dòng content là dữ liệu trình bày** [DỮ LIỆU: `wc -l`] |
| `tools/admin` | 6 file Phaser (1 701 dòng) là các "xưởng" xem thử (Battle Lab, Rig Lab, Plant Lab, Plot Lab) phải viết lại theo renderer mới; trình dựng bản đồ `mapEditor.ts` 1 168 dòng làm việc trên lưới tile 2D |
| `scripts/` | Pipeline rig (`scripts/rig`, 15 file), `scripts/studio` (16 file), `scripts/anim-review` gắn với ảnh 2D; sim kinh tế / trận, guard, admin giữ |

[NHẬN ĐỊNH] Con số 70 % nói về khối lượng dòng, không nói về công sức. Phần 20 % viết lại chứa gần như toàn bộ thứ người chơi nhìn thấy. Ngược lại, timeline trận (`battleMotion.ts`, `battlePlan.ts`, `battleScript.ts`, khoảng 630 dòng, tính beat `cast / release / impact / end` và danh sách cue) đã được xếp vào nhóm giữ vì nó chỉ sinh mốc thời gian, không vẽ.

---

## 4. Tổ chức asset

### 4.1 Manifest và id

- Một file: `public/assets/manifest/assets.json` (380 KB, `version: 3`), 7 mục: `pigs`, `fx`, `props`, `buildings`, `environment`, `ui`, `audio`. Mỗi dòng có `id`, `status` (`production` / `placeholder`), `asset` (đường dẫn); tuỳ mục có `sleepAsset` / `wakeAsset`, `states`, `seasons`, `frames`, `particle`, `anchor`, `tile`. [DỮ LIỆU] đọc bằng `node -e`.
- Code chỉ tra asset qua id: `src/core/assets/registry.ts` (thuần, "never touches the network or the DOM"). [DỮ LIỆU] dòng 1–3.

### 4.2 Pipeline

`art_inbox/<tên file đích>.png` → `npm run art:process` (`scripts/process-art.ts`: chuẩn hoá, chép vào `public/assets/`, dòng manifest thành `production` khi đủ file) → `npm run assets:check` (nằm trong `npm run check`) → `npm run assets:release` (trượt khi còn dòng `placeholder`). [DỮ LIỆU] `scripts/process-art.ts` dòng 1–8, `scripts/assets-check.ts` dòng 1–3, `package.json` scripts.

Phía trước pipeline (decision 022): chủ dự án dán prompt vào **Gemini bản miễn phí** để vẽ sheet nền xám `#C8C8C8`; agent cắt sheet, tách nền, QA. Kế hoạch batch ở `asset/batches/` (53 mục). Nhánh phụ: `rig:*` (11 lệnh, decision 050), `studio` (decision 051), `anim:*` (5 lệnh chụp và so khung). [DỮ LIỆU] `docs/decisions/022-art-pipeline.md`; `package.json` dòng 57–69; `ls asset/batches | wc -l`.

### 4.3 Số lượng asset

| Mục manifest | Dòng | `placeholder` | PNG trong `public/assets/<mục>` | Dung lượng |
|---|---:|---:|---:|---:|
| `pigs` | 89 | 5 | 263 | 44 MB |
| `props` | 1 611 | 0 | 1 685 (`rig/` 814 · `combat/` 266 · `adventure_map/` 152) | 247 MB |
| `fx` | 117 (31 có `frames`) | 0 | 117 (`battle/` 95) | 20 MB |
| `buildings` | 68 | 0 | 88 | 8 MB |
| `environment` | 146 | 0 | 146 (`adventure_v3/` 80) | 252 MB |
| `ui` | 365 | 22 | 365 | 7 MB |
| `audio` | 59 (58 sfx, 1 nhạc) | 0 | 59 file mp3 | 3 MB |
| **Tổng** | **2 455** | **27** | **2 664 PNG** | **561 MB** |

[DỮ LIỆU] `node -e` đếm manifest; `find public/assets/<mục> -name "*.png" | wc -l`; `du -sb`, `du -sh public/assets`.

- 27 dòng `placeholder`: 5 heo (`pig_mushroom`, `pig_firefly`, `pig_cloud`, `pig_coral`, `pig_aurora`), `ui_icon_lock`, 21 icon vật phẩm / trang bị Adventure. PROGRESS ghi 28. [DỮ LIỆU]
- Tiền tố trong `props`: `rig` 814 · `cb` (key pose trận) 266 · `adv` 168 · `prop` 124 · `flower` 56 · `crop` 52 · `fish` 33 · `enemy` 30 · `skin` 27 · `scn` 26. [DỮ LIỆU]
- **Ảnh rời, không có atlas**: 0 lời gọi `load.atlas` / `load.multiatlas` trong `src/`; không có file `*atlas*` trong `public/`. Sprite sheet chỉ có ở VFX dạng dải ngang (31 dòng `fx` có `frames`). `ARCHITECTURE.md` §12 đặt mục tiêu "gom thành sprite atlas khi có thể" nhưng chưa làm. [DỮ LIỆU] grep.
- Cỡ ảnh (cạnh dài, đọc header PNG): ≤ 128 px 781 · ≤ 256 px 589 · ≤ 512 px 868 · ≤ 1024 px 285 · ≤ 2048 px 140 · lớn hơn 1 (4096 px). [DỮ LIỆU] script `node` đọc 24 byte đầu mỗi PNG.
- Nguồn art ngoài bản ship: `asset/` 342 MB (1 094 PNG, 44 thư mục `asset/rigs`), `art_inbox/` 2,7 GB (5 265 PNG, không theo dõi git), `art_inbox.rar` 2,4 GB (chưa theo dõi). [DỮ LIỆU] `du -sh`, `find ... | wc -l`.
- Số liệu ngày 2026-11-07 của Sobi Studio là 2 279 dòng / 2 547 PNG; chênh lệch tới nay do decision 056 / 057 thêm ảnh. [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2.

### 4.4 Nội dung theo `content/`

| Loại | Số lượng | File |
|---|---:|---|
| Giống heo (Animal Farm) | 87 | `content/farm/species.json` |
| Loài cá | 30 | `content/aquarium/fish.json` |
| Hoa phép | 14 | `content/cloud/flowers.json` |
| Cây trồng | 13 | `content/garden/crops.json` |
| Kẻ địch | 33 | `content/adventure/enemies.json` |
| Skill | 112 | `content/adventure/skills.json` |
| Trạng thái | 25 | `content/adventure/statuses.json` |
| Dòng máu / class | 9 / 4 | `lineages.json`, `classes.json` |
| Vùng / bản đồ | 4 / 18 | `zones.json`, `maps.json` |
| Trang bị | 21 | `equipment.json` |
| Đạo cụ bản đồ | 42 | `adventure/props.json` |
| Vật phẩm | 135 | `content/shared/items.json` |
| NPC | 6 | `content/shared/npcs.json` |
| Recipe | 11 | `content/shared/recipes.json` |
| Đồ trang trí Farm | 6 | `content/farm/decor.json` |
| Mẫu khuông | 9 | `content/shared/plotSkins.json` |
| Rig animation | 44 | `content/anim/rigs/*.json` |

[DỮ LIỆU] `node -e` đếm phần tử mảng trong từng file.

Sinh vật có mặt trong trận: 21 chiến binh + 22 quái có đủ 6 key pose (43 con, 258 ảnh). [DỮ LIỆU] `docs/animation/rig/AUDIT.md` §1; `docs/PROGRESS.md` dòng 11.

---

## 5. Cơ chế animation hiện tại

### 5.1 Puppet rig 2D (decision 050)

- Code: runtime thuần ở `src/systems/animation/` (13 file, 1 251 dòng: `skeleton.ts`, `clip.ts`, `performer.ts`, `life.ts`, `skin.ts`, `warp.ts`, `poseFade.ts`, `rigs.ts`…); vẽ Phaser ở `src/ui/puppet/puppet.ts` (275 dòng) và `skinView.ts` (118 dòng); nối vào trận ở `src/areas/adventure/scene/battle/battlePuppets.ts`; khớp nhịp ở `src/areas/adventure/ui/battlePerf.ts`. [DỮ LIỆU] `wc -l`; `docs/decisions/050-puppet-rig-animation.md` mục "File".
- Dữ liệu: **44 rig** trong `content/anim/rigs/`, tổng 263 xương, 1 094 clip (khoảng 25 clip / con); 814 ảnh ở `public/assets/props/rig/`. [DỮ LIỆU] `node -e` đếm; `find`.
- Trạng thái thật sau 5 lần đổi hướng trong 2 ngày (2026-11-05 → 11-06): bộ phận cắt rời (chủ dự án chê hình xấu hơn ảnh tĩnh) → skin bẻ một ảnh (bị bác: "thực sự không ổn… cẩu thả") → **pose to pose trên 6 key pose đã duyệt**, lưới chỉ thêm nén / giãn / đầu trễ nhịp / thở. 43 con chạy kiểu này; Bạch Tuộc giữ skin một ảnh. [DỮ LIỆU] decision 050, các bổ sung (1)–(5).
- "Lớp sống thủ tục": thở, lò xo cho đầu / tai, dải uốn (Phaser Rope) cho đuôi / vây / xúc tu (`life.ts`, `skin.ts`). Chớp mắt đã tắt ở idle vì chưa có tranh mắt nhắm được duyệt. [DỮ LIỆU] decision 050 bổ sung (5) điểm 3.
- Giới hạn tự ghi: "chuyển giữa hai tranh là hoà nhanh, không có khung trung gian vẽ tay". [DỮ LIỆU] decision 050 dòng cuối.

### 5.2 Tween và chuyển động bằng code

- 114 lời gọi `tweens.add / chain / addCounter` trong 34 file (Farm 11 file, Plaza 6, Garden 4, Cloud 4, Aquarium 3, Adventure 2). [DỮ LIỆU] grep.
- Phaser Rope dùng ở 5 file: `ui/world/bentPlant.ts` (cây, hoa uốn), `ui/puppet/{puppet,skinView}.ts`, `aquarium/scene/fishBody.ts`, `adventure/scene/battle/fxRibbon.ts`. [DỮ LIỆU] grep.
- Nhân vật đi bộ trên bản đồ: 3 khung × 4 hướng (`chr_bi_*`, `chr_so_*`), `walker.ts` 193 dòng. [DỮ LIỆU] `ls public/assets/props`; `ANIMATION_REVIEW_FEEDBACK.md` §0.2.

### 5.3 Kịch bản animation trận (decision 044)

- Dữ liệu: `content/adventure/battle_fx.json` (325 KB): kịch bản cho 112 skill, 26 hành động chung, 25 trạng thái, 6 phản ứng nguyên tố, 217 preset hạt, 10 bảng hệ. [DỮ LIỆU] `node -e`.
- Một kịch bản là danh sách act `{ do, at, who, … }` với khoảng 20 loại `do`: `pose`, `move`, `glow`, `burst`, `strip`, `prop`, `beam`, `tether`, `cone`, `decal`, `marker`, `trail`, `tint`, `punch`, `stop` (hit stop), `split`, `shake`, `flash`, `sound`, `cutin`. [DỮ LIỆU] `docs/decisions/044-battle-animation-scripts.md` §1.
- Ba tầng: dữ liệu → **thời gian thuần có test** (`ui/battleMotion.ts`, `battleScript.ts`, `battlePlan.ts`, `battlePose.ts`, `battleMoves.ts`) → **Phaser chỉ phát cue** (`scene/battle/fxActs.ts`, `fxPlayer.ts`, `fxProps.ts`, `fxLines.ts`, `fxBursts.ts`, `statusBadges.ts`). [DỮ LIỆU] decision 044 §1; `BattleScene.ts` dòng 1–20.
- Quy tắc: animation không quyết định gameplay, chỉ đọc sự kiện trận; "Giảm chuyển động" tắt hết. [DỮ LIỆU] decision 040 điểm 5–6.

### 5.4 FeedbackDirector

- `src/areas/farm/scene/feedback/FeedbackDirector.ts`: "The only place that turns GameEvents into presentation": mỗi sự kiện → animation → VFX → âm thanh → toast, theo bảng `feedbackTable.ts`. [DỮ LIỆU] dòng 1–3.
- Area khác góp phần của mình qua `src/areas/<id>/feedback.ts` (adventure, aquarium, cloud, garden) và cổng `other` / `areaVfx`; app nối ở `src/app/start.ts` dòng 278–285. [DỮ LIỆU] `ls src/areas/*/feedback.ts`.
- [NHẬN ĐỊNH] Director nằm trong thư mục `areas/farm/scene/` nhưng không import Phaser; nó gọi một cổng `FarmEffects`. Đây là chỗ nối độc lập renderer.

### 5.5 VFX

| Kỹ thuật | Có / không | Bằng chứng |
|---|---|---|
| Particle GPU (`ParticleEmitter`) | Có, ít chỗ: 4 file (3 ở Adventure, 1 ở Plaza), trần 420 hạt trong trận | grep; decision 042 §1 |
| Sprite strip nhiều khung | Có: 31 dòng `fx` có `frames`; 22 / 23 sheet trận đã lên 8 khung @24 fps | manifest; `studio/status.json` |
| Vật thể bay theo đường (`fxp_*`) | Có: 12 kiểu đường | decision 044 |
| Blend ADD | Có: 64 chỗ trong 18 file | grep `BlendModes.ADD\|setBlendMode` |
| Phaser FX (`preFX` / `postFX`: color matrix, glow) | Có, rất ít: 5 chỗ trong 3 file (`puppet.ts`, `PigSprite.ts`, `cloudFx.ts`) | grep |
| Shader tự viết (GLSL, pipeline riêng) | **Không** | `grep -rE "BaseShader\|GLSL\|fragShader\|PostFXPipeline\|\.glsl" src` = 0 |
| RenderTexture | **Không** | grep = 0 |

### 5.6 Camera, chuyển động, tương tác

- Camera: mỗi scene fit khung thiết kế (`src/ui/world/fitCamera.ts`). Chỉ Adventure có camera cuộn bám đội (`mapCamera.ts`, zoom ×1, trễ 110 ms). Trận có `punch` (zoom) và `shake`. 25 chỗ dùng camera trong 14 file, 7 file ở Adventure. [DỮ LIỆU] grep; `mapCamera.ts` dòng 14–18.
- Parallax: gần như không. 1 chỗ `setScrollFactor` (Cloud). [DỮ LIỆU] grep.
- Hit-test: `setInteractive` / `pointerdown` ở 18 file (Farm 4, Cloud 3, Aquarium 3, Garden 2…). Riêng trận Adventure, **chọn mục tiêu nằm ở DOM**, không ở Phaser: DOM xếp hộp của từng con, scene đọc vị trí chân theo px trang (`BattleStageState.units`, "their feet in page px"). [DỮ LIỆU] `BattleScene.ts` dòng 24–34; decision 042 §5.
- Thứ tự vẽ: `setDepth` 215 chỗ trong 67 file; thân trong trận = `1000 + feet.y`. [DỮ LIỆU] grep; `ANIMATION_REVIEW_FEEDBACK.md` §0.1.

### 5.7 Ánh sáng

- **Không có** Light2D, normal map, pipeline ánh sáng: `grep -rE "Light2D|lights\.(enable|addLight)|setPipeline|normalMap" src` = 0 file. [DỮ LIỆU]
- Ngày / đêm là lớp màu phủ: Farm `DayNightDirector` + `SeasonFxLayer`; Plaza `PlazaLight` ("one multiply layer over the world"); Cloud cờ `night`; Aquarium đom đóm, ánh trăng. Garden và Adventure không có ngày / đêm. [DỮ LIỆU] `PlazaLight.ts` dòng 1; `AREA_LAYOUT_ANIMATION_PROPOSAL.md` §2.
- Không có post-processing toàn màn; chỉ có `tint`, `flash`, `split` (tách màu) trong trận, làm bằng lớp phủ. [DỮ LIỆU] decision 044.

---

## 6. Decision 050 và 051 đã tới đâu

Lịch sử: `git log --oneline -- studio docs/UNITY_STUDIO_PLAN.md "docs/decisions/050*" "docs/decisions/051*"` ra 12 commit, từ `699efb6a` (framework rig) tới `a7c48d43` (cập nhật tài liệu).

### 6.1 Decision 050 — puppet rig

| Bước | Trạng thái | Nguồn |
|---|---|---|
| R1 framework + 4 prototype body plan | Xong 2026-11-05 | `699efb6a` |
| R2 cử chỉ skill theo body plan (10 cử chỉ, điểm neo VFX `mouth` / `tail`) | Xong bước 1; 8 / 112 skill khai `gesture`, còn lại suy từ kịch bản | `78283506`; PROGRESS dòng 10 |
| R1b bộ phận vẽ rời | Làm rồi **bỏ** (hình xấu hơn ảnh duyệt) | decision 050 bổ sung (2) |
| R2b / R3 skin một ảnh cho 18 chiến binh + 22 quái | Làm rồi **bị chủ dự án bác** | `fc08e67f`, `07cd9bab`; bổ sung (5) |
| Pose to pose trên 6 key pose | **Đang dùng**: 43 con, 25 clip / con | `48ea0388` |
| R4 lớp `possessed` cho quái tha hoá | Đề xuất, chưa làm | decision 050 điểm 7 |
| R5 rig cho Farm / Garden / Cloud / Sảnh | Chưa làm | PROGRESS dòng 11 |
| Khung trung gian (`windup`) | Mới có cho 2 con; khung bay / bơi cho 2 con | PROGRESS dòng 11 |
| Nghiệm thu | Chờ chủ dự án chấm ACCEPTANCE A10–A13, B8 | PROGRESS dòng 11 |

Thử vẽ lại nhiều khung bằng AI: batch `rig-05-aquarium-move` "đánh giá không khả thi cho cá (lệch nhận diện giữa các khung)". [DỮ LIỆU] PROGRESS dòng 11.

### 6.2 Decision 051 — Sobi Studio (Unity)

| Mục | Thực tế |
|---|---|
| Unity | **6000.6.8f1** (Unity 6, giấy phép Personal), chạy batchmode. [DỮ LIỆU] `studio/ProjectSettings/ProjectVersion.txt` |
| Phụ thuộc Unity | Chỉ 2 module: `imageconversion`, `jsonserialize`. Không URP, không package ngoài. [DỮ LIỆU] `studio/Packages/manifest.json` |
| Code Studio trong repo | 3 file C# (`Cli.cs`, `Job.cs`, `Renderer.cs`), 1 compute shader `SdfRender.compute` (renderer SDF + toon tự viết), `studio/Style/style.json` (bảng màu, ánh sáng, viền, mắt), 5 template, 16 file TypeScript ở `scripts/studio/`. [DỮ LIỆU] `find studio -type f` |
| Recipe | 26 file: 22 `fx/`, 2 `farm/` (`pig_classic`, `prop_pig_house`), 1 `aquarium/` (`fish_goldfish`), cộng schema. [DỮ LIỆU] `find studio/Recipes` |
| U0 (công cụ) | Xong |
| **U1 (4 mẫu: heo, Cá Vàng, chuồng heo, lửa)** | **Không đạt** sau 2 vòng chỉnh. Agent tự chấm: đẹp hơn bản cũ: không; đồng bộ hơn: có; đáng đổi cả game: không. Hướng "tạo lại toàn bộ" **dừng** |
| U2–U10 | Dừng |
| Phương án hẹp "vẽ hình VFX bằng Unity" | Không đạt (3 hiệu ứng, không cái nào đẹp hơn bản cũ), không nhập vào game |
| Phương án hẹp "chuyển động trên tranh đã duyệt" | **Đạt**: 22 / 23 sheet VFX trận lên 8 khung @24 fps, **đã nằm trong game**. `fx_wave_rise` giữ nguyên |
| Asset Studio trong game | Chỉ 22 sheet VFX nói trên (`studio/status.json`: mọi recipe có `kind: fx_battle_anim`, `imported: 2026-11-08`). **Không có hình nào do Studio dựng 3D trong `public/assets`** |
| Còn dở | Chủ dự án chưa xem 22 hiệu ứng trong game; 19 sheet sinh tự động chỉ "mượt hơn mức vừa"; VFX ngoài trận chưa làm; 2 test `studio.test.ts` đỏ vì thiếu tag git `pre-unity-studio` |

[DỮ LIỆU] `docs/decisions/051-unity-studio.md` (4 cập nhật); `docs/studio/STATUS.md`; `studio/status.json`; `docs/PROGRESS.md` dòng 9 và nhật ký 2026-11-10; `git tag` (không có `pre-unity-studio` trong danh sách tag cục bộ).

Lý do U1 trượt, theo tài liệu: "agent đặt hình bằng toạ độ số rồi mới nhìn thấy kết quả; mỗi hiệu ứng cần rất nhiều vòng mà vẫn kém tranh vẽ sẵn"; heo "trong game nhìn như đồ nhựa"; "mỗi asset cần ~10 lần chỉnh tay toạ độ". [DỮ LIỆU] `docs/studio/STATUS.md`.

[NHẬN ĐỊNH] U1 thử một cách làm 3D rất hẹp (hình SDF dựng bằng code, không model, không texture vẽ, không rig xương). Kết quả của nó là bằng chứng về **cách làm đó**, chưa phải bằng chứng về 3D nói chung.

---

## 7. Giới hạn của đồ họa 2D hiện tại (trích từ tài liệu, không tự suy diễn)

### 7.1 Lời chủ dự án (được ghi lại trong decision)

| Lời chê | Nguồn |
|---|---|
| "Sau nhiều lần chỉnh, nhân vật vẫn như ảnh tĩnh được di chuyển bằng code" | decision 050, Bối cảnh |
| Hình ghép từ bộ phận vẽ rời "xấu hơn hẳn ảnh tĩnh đã duyệt" | decision 050 bổ sung (2) |
| Skin một ảnh: "thực sự không ổn"; đòn đánh không giống tranh attack; biểu cảm vẽ đè lên tai / vương miện: "cẩu thả, không chấp nhận được" | decision 050 bổ sung (5) |
| "Tổng thể chưa đẹp", art lệch phong cách giữa các bộ, muốn dùng Unity | decision 051, Bối cảnh |
| HUD kỹ năng giựt, phải click nhiều lần, cả màn trận lag, sinh vật quay sai phía (đã sửa) | decision 042, Bối cảnh |

### 7.2 Audit animation (`docs/animation/rig/AUDIT.md`, 2026-11-05)

- Đơn vị nhỏ nhất của sinh vật là **một ảnh phẳng**; mọi chuyển động thân chỉ là biến đổi cả ảnh. "Đó là trần của phương pháp, không phải lỗi chỉnh số."
- 6 key pose của cùng một con vẽ riêng bằng AI nên lệch tỉ lệ, góc nhìn; đổi pose là "một cú pop".
- Skill có cá tính ở lớp VFX, không ở lớp thân; 64 / 112 skill có cờ `STATIC_HERO` / `STATIC_SHAPE`.
- Không có blend giữa trạng thái, không overlap, không follow-through thật.
- Không có walk / run / jump trong trận; trên bản đồ "nhân vật trượt".
- Không ảnh sinh vật nào tách được bộ phận mà không vẽ lại phần bị che.
- Phần được khen và đề nghị giữ: bộ máy beat thuần có test, engine kịch bản VFX theo dữ liệu, hit stop, Admin lab, harness review.

### 7.3 Review kỹ thuật (`docs/animation-review/ANIMATION_REVIEW_FEEDBACK.md`, 2026-11-03, đánh giá qua code)

Điểm tổng **4,7 / 10**. Kiến trúc / pipeline 7,5 · hiệu năng 7 · Ultimate 5,5 · skill VFX 5 · chuyển lượt 4 · map movement 4 · buff 3,5 · status 3,5 · cast 3 · skill nước 3 · targeting 3. Nhận xét chung: "Nền tốt, 'da thịt' còn mỏng". Năm vấn đề lớn nhất gồm vòng phép không bao giờ chạy, marker chọn nhiều mục tiêu bị che, trạng thái không có hiệu ứng khi hết, cast / buff nghèo vì thiếu keyframe, Ultimate và skill nước thiếu "cảm giác lớn" và "cảm giác chảy". Tài liệu ghi ngày 2026-11-03; một số mục có thể đã sửa sau đó (chưa đối chiếu từng mục).

### 7.4 Đề xuất layout (`docs/research/AREA_LAYOUT_ANIMATION_PROPOSAL.md`, 2026-11-09)

- Farm "yếu nhất": nền vẽ bằng code, một màu, giữa sân trống, "đọc như đồ đặt trên giấy trắng".
- Garden: ô nhỏ trên bãi cỏ phẳng, 4 khu gần như giống nhau, không ngày / đêm, không thời tiết trên cảnh.
- Cloud: 10 tầng trông như nhau trừ màu.
- Aquarium: đẹp nhưng rối khi đông cá.
- Adventure: Trại là "một bảng điều khiển" phủ gần kín cảnh, không có "không gian".
- Chung: chuyển khu là đổi màn tức thì; HUD dưới cao.

### 7.5 `docs/ASSET_TODO.md` và pipeline Gemini

- Ảnh nguồn độ phân giải thấp phải phóng to: nền M2 1376 × 768 phóng ×3; nền trận 1376 → 1600 px; `fxp_*` khoảng 300 → 512 px; vài heo nguồn 470–515 px "hơi mềm".
- Gemini vẽ lệch: sheet trùng hàng, vẽ thẻ đứng thay ô vuông, một sheet cây ra pixel art, pose to nhỏ không đều, dấu sparkle phải gỡ, cối xay bị vẽ thành công trình khác.
- Còn thiếu: mép chuyển tiếp mềm giữa các ô (vẫn ráp cạnh vuông), key pose cho quái biển, 12 quái mới, cut-in Ultimate riêng, VFX 9 hệ, nền Vết Nứt.
- Bộ nhớ: một sheet VFX 256² × 8 khung khoảng 2 MB GPU; `fx_wave_rise` 16 khung sẽ tốn khoảng 16 MB nên không làm. [DỮ LIỆU] `docs/studio/STATUS.md`.

---

## 8. Hệ quả kiến trúc của từng phương án (chỉ dữ kiện và chỗ nối)

### 8.1 Phương án A — toàn bộ 2D nâng cấp

Chạm vào: `public/assets/` + manifest (thay ảnh theo id, không đụng logic: AGENT_RULES §8); `src/areas/*/scene/` và `src/ui/world/` khi thêm lớp ánh sáng, thời tiết, chuyển động môi trường; `content/anim/rigs/` và `battle_fx.json` khi thêm khung trung gian hoặc kịch bản; `scripts/rig`, `scripts/studio`. Không chạm `core`, `systems` (trừ `animation`), `logic`, save. Các khoảng trống kỹ thuật đã đo: chưa có atlas, chưa có shader tự viết, chưa có Light2D / normal map, parallax gần như không (mục 5.5–5.7). [DỮ LIỆU + NHẬN ĐỊNH]

### 8.2 Phương án B — Adventure sang 3D, phần còn lại 2D

Chỗ nối có sẵn trong code:

| Chỗ nối | File / hàm | Ý nghĩa |
|---|---|---|
| Vào / ra Area | `src/areas/adventure/stage.ts`: `bindAdventureStage({ enter, exit })`, `adventureStage` | Hook Area không biết scene là gì; app gắn vào. Hiện gắn `view.showScene(ADVENTURE_SCENE_KEY)` ở `src/app/start.ts` dòng 267 |
| Bản đồ | `AdventureScene` nhận `AdventureSceneDeps { read(): AdventureSceneState, report: SceneReport, input, reduceMotion, paused, image }` (`scene/AdventureScene.ts` dòng 29–39; kiểu ở `scene/sceneState.ts`) | Scene **đọc state thuần mỗi khung và báo lại sự kiện**, "never reaches the store". Một renderer khác có thể cài cùng hợp đồng |
| Trận | `BattleScene` nhận `BattleSceneDeps { read(): BattleStageState, image(id) }` (`scene/battle/BattleScene.ts` dòng 24–52) | State gồm `units` (chân theo px trang), `step` đang phát, `reduce`, `sound` |
| Timeline trận | `stepPlan()` (`ui/battlePlan.ts`), `perfOf()` (`ui/battlePerf.ts`), `poseOf()` (`ui/battlePose.ts`) | Cue có mốc thời gian, thuần, có test |
| Logic trận | `src/systems/combat/` (1 244 dòng), `src/areas/adventure/logic/` (3 945 dòng) | Không đổi |
| Khởi tạo | `src/app/start.ts` dòng 246, 262 | Nơi duy nhất `new AdventureScene(...)`, `new BattleScene(...)` |

Những thứ B phải thêm, theo dữ kiện:

- Một renderer 3D thứ hai. Hiện chỉ có một canvas của một `Phaser.Game`, đặt trong host `.app__stage` (`farmView.ts` dòng 72–84; `areas/farm/ui/app.ts` dòng 66). Phaser 3.90 không có pipeline mesh 3D có xương. Canvas riêng xếp chồng hay dùng chung WebGL context là quyết định kỹ thuật chưa có trong repo. [DỮ LIỆU + NHẬN ĐỊNH]
- Một thư viện 3D trong `dependencies` (hiện 4 gói). AGENT_RULES §3: "Không thêm thư viện mới nếu không cần. Nếu thêm, ghi lý do"; license ghi vào `docs/THIRD_PARTY.md`. [DỮ LIỆU]
- Loại file asset mới (model, texture, clip). Manifest hiện chỉ có đường dẫn PNG / mp3 và các trường 2D; `scripts/assets/check.ts`, `process-art.ts`, `assets:release` kiểm theo PNG. [DỮ LIỆU]
- Xử lý việc **HUD trận là DOM và quyết định vị trí đơn vị**: `ui/battleField.ts` xếp hộp, `ui/battleStageVm.ts` đo, scene vẽ đúng chỗ DOM chỉ. Với camera 3D, chiều này phải đảo (chiếu vị trí 3D ra màn hình cho nameplate, dấu ngắm, số bay). [DỮ LIỆU: `BattleScene.ts` dòng 1–6, decision 042 §5] [NHẬN ĐỊNH về hệ quả]
- `battle_fx.json` (9 769 dòng, 112 kịch bản): act như `strip`, `prop`, `decal`, `move` mang tham số px và ảnh 2D. Mốc thời gian dùng lại được; tham số không gian phải ánh xạ. [NHẬN ĐỊNH]
- Bản đồ: 18 bản đồ trong `maps.json` là lưới tile + tranh vẽ; `systems/character` (va chạm) và `logic/maps.ts` là 2D. Trình dựng bản đồ Admin 1 168 dòng. [DỮ LIỆU]
- Admin: `battleLab.ts` (622 dòng), `rigLab.ts` (340 dòng) chạy trên chính `BattleScene` / puppet. [DỮ LIỆU]
- Phần mất chỗ dùng: 44 rig, 814 ảnh `props/rig`, 266 ảnh `cb_*`, runtime puppet (mục 3.4). Ảnh `cb_*` vẫn dùng cho chân dung, thẻ (decision 050 điểm 5). [DỮ LIỆU]
- 43 sinh vật trận cần bản 3D; 21 chiến binh trong số đó cũng xuất hiện ở Farm / Aquarium dưới dạng ảnh 2D, nên cùng một con sẽ có hai dạng thể hiện. [DỮ LIỆU về số lượng; NHẬN ĐỊNH về hệ quả]

### 8.3 Phương án C — toàn bộ 3D

Viết lại: toàn bộ 82 file Phaser trong `areas/*/scene` (11 454 dòng) và `ui/world` + `ui/puppet` (1 374 dòng); bộ khởi động canvas (`farmView.ts`, `config/phaser.ts`, `fitCamera.ts`); 6 file lab trong Admin. Chỉnh: 6 972 dòng toán trình bày 2D. Dữ liệu: 4 file `layout.json` + `plaza/layout.json` + `maps.json`, 44 rig, `battle_fx.json`. Asset: 2 396 dòng manifest hình ảnh; nhóm UI (365 dòng, icon và khung HUD) vẫn là 2D vì HUD là DOM. Pipeline: `art:process`, `assets:check`, `rig:*`, `studio`, `anim:*`, skill `image-to-asset` đều giả định PNG. Hit-test ở 18 file chuyển từ `setInteractive` sang raycast. Giữ: `core`, `systems` (trừ `animation`), mọi `logic/`, save, `electron/`, `i18n`, UI DOM, FeedbackDirector và bảng feedback, 138 file test. [DỮ LIỆU từ mục 3; NHẬN ĐỊNH về phân loại]

Ràng buộc đã chốt mà cả B và C đụng tới: decision 017 (art chỉ làm ở GĐ14, GĐ15 phát hành), decision 021 (gameplay freeze), decision 048 (IP), Spec §12 và ARCHITECTURE §12 (offline, 60 FPS máy trung bình, tối đa 30 sinh vật chạy AI), decision 051 mục "Quay lại" (hướng cũ ở tag `pre-unity-studio`). [DỮ LIỆU]

---

## 9. Tìm HTML prototype

Kết quả do điều phối viên tìm, người khảo sát chạy lại độc lập và ra cùng kết quả.

| Việc đã làm | Kết quả |
|---|---|
| `find . -iname "*.html" -o -iname "*.htm" -o -iname "*.xhtml" -o -iname "*.mhtml"` (trừ `node_modules`, `dist`, `dist-electron`, `release`, `build`, `.git`; **gồm** `studio/`, `tools/`, `art_inbox/`, `docs/`, `public/`, `test-results/`, `saves-export/`) | Chỉ 2 file: `./index.html`, `./admin.html` |
| `./index.html` | Trang vỏ của game: `<div id="app">` + `<script type="module" src="/src/app/main.ts">` |
| `./admin.html` | Trang vỏ của Admin Dashboard: nạp 6 file CSS `tools/admin/*.css` |
| `git ls-files \| grep -iE "\.html?$"` và `git log --all --diff-filter=A --name-only -- "*.html" "*.htm"` | Chỉ 2 file trên, ở mọi nhánh và mọi thời điểm lịch sử |
| `find` file `.glb .gltf .fbx .obj .blend .usdz .dae .stl .ply .vrm .unity .prefab .mat .shader .compute` | Chỉ `studio/Assets/Sobi/Shaders/SdfRender.compute` (renderer SDF của Sobi Studio) |
| `grep` chuỗi `three.js`, `from 'three'`, `babylon`, `playcanvas`, `GLTFLoader`, `WebGLRenderer`, `.gltf`, `.glb`, `.fbx`, `.blend` (trừ `node_modules`, ảnh, lockfile) | Không có dấu vết thật. Các file khớp đều là `.blend` trong nghĩa "trộn màu" (`Image.blend`, `part.blend`, `next.blend`) |
| `package.json`, `package-lock.json` | Không có thư viện 3D |
| Thư mục build bị loại trừ (liệt kê cho đủ) | `dist/index.html` (bản build của game), `release/win-unpacked/LICENSES.chromium.html` (file giấy phép của Chromium) |
| `art_inbox.rar` (2,4 GB, chưa theo dõi) | Không giải nén được (máy không có `unrar` / `7z`). Quét byte tìm tên file `.html` / `.glb` / `.fbx` không thấy tên file đọc được, nhưng cách quét này không đủ để kết luận |

**Kết luận: không tìm thấy prototype 3D nào, cũng không tìm thấy HTML prototype nào trong repo.** Thử nghiệm gần với 3D nhất là 4 mẫu U1 của Sobi Studio (mục 6.2), render ra PNG, không phải HTML. Chưa kiểm tra bên ngoài `D:\Local\Sobi_World`.

---

## Điều chưa xác minh

1. Renderer thực tế khi chạy (WebGL hay Canvas), FPS, bộ nhớ GPU: phiên không chạy game.
2. GPU / VRAM của máy chủ dự án: không kiểm tra.
3. Chất lượng hình ảnh thật của game, của 4 mẫu U1 và của 22 VFX Studio: không mở ảnh; mọi nhận xét về "đẹp / xấu" ở mục 7 là trích tài liệu.
4. Phân loại "giữ / chỉnh / viết lại" dựa trên từ khoá import và regex DOM, chưa đọc từng file. Sai số ước vài điểm phần trăm; riêng 4 702 dòng không-Phaser trong `scene/` có thể một phần thuộc nhóm giữ nguyên.
5. Số dòng `placeholder`: manifest đếm 27, PROGRESS ghi 28. `docs/ASSET_TODO.md` nói 26 ảnh `scn_*` còn là placeholder với `status: placeholder`, nhưng trong manifest 53 dòng `scn_*` / `skin_*` đều ghi `production`. Chưa rõ bên nào đúng.
6. Các mục trong `ANIMATION_REVIEW_FEEDBACK.md` (2026-11-03) đã sửa tới đâu sau decision 044 / 050: chưa đối chiếu từng task ANIM-xxx.
7. Nội dung `art_inbox.rar` và các thư mục ngoài repo.
8. Tag `pre-unity-studio`: decision 051 nhắc tới, nhưng không có trong `git tag` cục bộ (PROGRESS cũng ghi 2 test đỏ vì thiếu tag này). Chưa kiểm tra trên remote.
9. Chi tiết decision 018, 023–047 (trừ 040, 042, 044): chỉ đọc tên file và phần được PROGRESS / tài liệu khác trích.
10. Hai file `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_*.md`: không đọc trong phần này (thuộc mục phân tích skill).

## Cần chủ dự án cung cấp/duyệt

1. **HTML prototype**: file (hoặc thư mục) prototype, hoặc đường dẫn nơi nó nằm; nếu không còn file thì ảnh chụp / video và cho biết nó dựng bằng gì (three.js, Babylon, công cụ AI nào), ai làm, cảnh nào của game.
2. Cho biết `art_inbox.rar` có chứa gì khác `art_inbox/` không, và có cho phép giải nén ra thư mục tạm ngoài repo không.
3. Cấu hình máy: GPU, VRAM, RAM (để đánh giá công cụ chạy local và ngân sách hiệu năng 3D).
4. Xác nhận cấu hình máy tối thiểu của người chơi mục tiêu ("máy trung bình" trong ARCHITECTURE §12 chưa có con số).
5. Đã xem 22 VFX Studio trong game và các rig pose to pose (ACCEPTANCE A10–A13, B8) chưa, kết luận thế nào: đây là dữ kiện quan trọng nhất để biết đường 2D hiện tại còn cách kỳ vọng bao xa.
6. Lời chê cụ thể nhất hiện nay nằm ở đâu: sinh vật trong trận, VFX, bản đồ, hay bố cục các khu (Farm). Tài liệu ghi cả bốn nhưng không xếp thứ tự ưu tiên.
7. Xác nhận phạm vi "Adventure sang 3D" của phương án B: chỉ trận đánh, hay cả bản đồ khám phá và Trại.
8. Mốc GĐ15 (phát hành) có được phép lùi không, và lùi tối đa bao lâu.
9. Xử lý chênh lệch số `placeholder` ở mục "Điều chưa xác minh" số 5 (manifest hay ASSET_TODO là đúng).
