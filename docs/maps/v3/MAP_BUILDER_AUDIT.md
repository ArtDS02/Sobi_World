# Sobi Adventure — Custom Map Builder: audit + đề xuất tích hợp (GĐ1)

Ngày: 2026-11-02 · Trạng thái: **đã duyệt** (decision 047), GĐ2 xong. Đầu vào: task "Upgrade Visual Map Editor into Sobi Adventure Custom Map Builder" (chủ dự án, 2026-11-02), mở rộng `ADMIN_MAP_EDITOR.md`. Chưa đổi code.

## 1. Hệ thống hiện có (audit)

### 1.1 Dữ liệu
| Khái niệm trong task | Trong code hiện tại | Ghi chú |
|---|---|---|
| Map | 1 hàng trong `content/adventure/maps.json` (18 map, 220 KB, schema `mapSchema` ở `content/schemas/adventure/maps.ts`) | `id` dạng `map_*`, `nameVi`, `cols × rows`, `tile` = 40 px thiết kế, `terrain` (chuỗi ký tự mỗi hàng = va chạm), `corruption` |
| World / Region | `zone` trong `content/adventure/zones.json` | map thuộc đúng 1 zone: `zone.maps` (đường chính, map đầu có cửa vùng, map cuối có trùm) hoặc `zone.branches` (nhánh) |
| Terrain background | `map.scene` (tùy chọn): `art` = gốc id manifest, `chunks`, `px` = 64, `elevation` | ảnh khối ở `public/assets/environment/adventure_v3/`, vào `public/assets/manifest/assets.json`; thiếu `scene` thì vẽ bằng ô ghép |
| **Portal (của task)** = lối chuyển map | **`map.exits[]`**: `id`, ô `x,y,w,h`, `to` (map đích), `arriveX/arriveY` (ô tới), `facing`, `kind`, `lock` (`guardian` / `shortcut`) | chuyển map thật: `takeExit` (`logic/actions/explore.ts`) |
| (khác) cổng dịch chuyển 2×2 | `map.portal` (1 cái / map) | nối mọi cổng **đã thắp** với nhau, tới `spawn` của map đích (`travel`); không có đích cố định |
| Spawn point | chỉ có **1** `map.spawn`; điểm tới của lối ra là tọa độ rời `arriveX/Y` trên lối ra | chưa có Spawn ID |
| Unlock condition | `exit.lock` (`guardian`, `shortcut`) + vùng đích phải mở (`exitLock` ở `actions/trip.ts`) | không thêm loại khóa mới (giữ luật gameplay) |
| Asset library | `content/adventure/props.json` (id `prop_adv_*`, `art`, footprint `w×h`, `scale`) — **đã dùng chung**, map chỉ lưu `{prop, x, y}` | ảnh qua id → manifest; thêm ảnh qua `art_inbox/` + `art:process` |
| Lớp che | `map.covers[]` (`x,y,w,h`, `look`); đội đứng dưới thì ẩn hẳn (decision 046) | chưa có Fade Partial / vùng kích hoạt riêng |
| Vật gameplay | `groups`, `chests`, `nodes`, `gates`, `puzzles`, `springs`, `npcs`, `lore`, `shrine`, `portal`, `spawn`, `exits` | mọi id đã ship nằm trong save |

### 1.2 Runtime đọc map thế nào
- `maps.json` / `zones.json` được **import tĩnh** khi build (`logic/config/content.ts` → `MAP_LIST`, `MAPS`, `ZONES`). Bản ship chỉ thấy đúng file trong repo lúc build. ⇒ Tách Draft / Published rất tự nhiên: **Published = `maps.json`**, Draft nằm ngoài `content/` nên game không bao giờ đọc.
- Map mới thêm vào `maps.json` + `zones.json` là runtime nhận ngay như map chính thức (vòng lặp, `MAPS[id]`, renderer, sương mù, bot cân bằng đọc `zone.maps`). Không cần sửa code cho từng map.
- Kiểm tra sẵn có, dùng lại nguyên:
  - `mapProblems(map)` (`logic/maps.ts`): vật ngoài map / trên tường / chồng nhau, prop lạ, lối ra không đi được, spawn bị chặn, vật không tới được, lối tiến không sau kẻ canh, lối ra / cổng / kẻ canh không sau cổng nguyên tố, lớp che sai, điểm tới rơi vào ô chặn / nhóm quái.
  - `mapGraphProblems(maps, zones)` (`logic/mapGraph.ts`): map ở đúng 1 zone, **mọi lối ra có lối ngược lại**, shortcut mở được, mọi map của zone đi tới được từ cửa zone, nhánh không có trùm.
  - Schema zod + `superRefine` (lối ra tới map lạ, id lối ra trùng).
- Lưu từ Admin: `POST /__admin/content` (`scripts/admin/contentSave.ts`): schema → nạp lại mọi module content của game (kiểm chéo) → **hỏng thì khôi phục mọi file**. Admin chỉ chạy ở `npm run admin` (vite riêng), không vào bản build.

### 1.3 Save người chơi tham chiếu gì (không được làm vỡ)
Slice Adventure v7 (`logic/state.ts`): `run.mapId` + `x,y` (px), `beaten` (`<mapId>/<groupId>`), `openedChests`, `openedGates`, `openedExits` (id lối ra), `explored` (sương mù theo map id, bitmask khối 4×4 tính từ `cols/rows`), lore đã đọc. `content/adventure/engagement.json` cũng tham chiếu map id.
- Đứng trên ô nay bị chặn → `settleWalker` đưa về `spawn` (đã có, dùng cho mọi lần sửa layout).
- **Lỗ hổng:** `contentSave` chỉ chặn xóa id ở `ID_LISTS` (giống, item, decor) — **xóa map / chest / exit đã ship hiện không bị chặn**. Save có `run.mapId` trỏ map đã xóa sẽ hỏng. Builder phải chặn.
- Đổi `cols/rows` của map đã ship làm lệch sương mù (chỉ hình thức, không mất tiến trình) — cảnh báo khi đổi.

### 1.4 Admin hiện có
`tools/admin/adventureMaps.ts` (131 dòng): lưới nút 18 px, tô ô, đặt / xóa prop, dời vật, chạy `mapProblems` mỗi lần đổi, chặn lưu khi còn lỗi, lưu thẳng `maps.json`. Không có: ảnh nền, canvas zoom / pan, undo, nháp, map mới, spawn nhiều, mạng map, kiểm `mapGraph`.

### 1.5 Điểm cần quyết (luật hiện tại chưa cho)
1. **Lối ra một chiều:** `mapGraph` coi lối ra không có đường về là **lỗi**. Task yêu cầu cho phép một chiều.
2. **Portal inactive / map disabled:** runtime không có cờ này; thêm cờ runtime = đổi gameplay.
3. **Xóa / tắt map đã ship:** save có thể đang đứng ở đó.
4. **Asset đặt tự do** (resize / rotate / scale X-Y / layer / collision riêng): runtime chỉ có `props` theo ô. Ghi chú cũ đã đề xuất `scene.scenery[]`.

## 2. Nguyên tắc tích hợp

- **Một hệ map duy nhất:** builder đọc / ghi đúng `mapSchema` + `zones.json`; không có định dạng map riêng cho Admin. Mọi trường mới **tùy chọn, chỉ thêm** ⇒ 18 map cũ hợp lệ nguyên vẹn, **không tăng phiên bản save**.
- **Không đổi luật gameplay:** chuyển map vẫn qua `takeExit` / `travel`; khóa vẫn `guardian` / `shortcut` / vùng.
- **Tọa độ logic = ô** (tile 40 px thiết kế). Editor zoom chỉ đổi cách vẽ: `ô = floor(màn_hình / (zoom × tile))`. Vật trang trí lưu theo **ô thực** (số lẻ, làm tròn 1/8 ô). Nền vẽ 64 px nguồn / ô quy về cùng lưới.
- **Id ổn định:** id sinh 1 lần khi tạo (`map_<slug>`, `exit_<map>_<slug>`, `spawn_<slug>`…), sau khi publish hoặc khi đã có lối ra khác trỏ tới thì **khóa**, đổi tên chỉ đổi `nameVi`.

## 3. Đề xuất dữ liệu

### 3.1 Thêm vào `mapSchema` (runtime, tùy chọn)
```ts
// Named arrival points (spawn_default = map.spawn, implicit). Editor + validation use them; the runtime keeps reading arriveX/Y.
spawns?: { id: 'spawn_*'; nameVi; x; y; facing? }[]
exits[i].arrive?: 'spawn_*'      // the spawn of `to` this exit lands on; publish writes its x/y/facing into arriveX/arriveY/facing
exits[i].oneWay?: true           // no way back needed (mapGraph skips that rule; a shortcut still needs a plain way back)
scene.scenery?: {                // hand-placed decoration (replaces script placement)
  id; art /* props.json id */; x; y /* foot, tiles */; scaleX; scaleY; rotate? /* deg */; flip?;
  layer: 'ground' | 'world' | 'canopy' | 'fx';
  mode: 'normal' | 'occluder' | 'foreground' | 'cover';   // occluder = depth-sorted by its foot
  fade?: { to: 0..1; by: 'inside' | 'radius'; radius?; area?: {x,y,w,h} };   // cover / foreground only
  foot?: {x,y,w,h}[]             // blocked tiles relative to the foot (absent = props.json footprint, [] = none)
}[]
```
- `arrive` giải quyết lúc publish thành `arriveX/Y/facing` ⇒ `takeExit` **không đổi**; kiểm tra đối chiếu hai trường.
- `scenery.foot` đưa vào `blockedTiles` (sửa nhỏ ở `logic/maps.ts`, như `props` đang làm) ⇒ `terrain` vẫn là va chạm nền, asset có va chạm riêng, xóa asset không phải tô lại ô.
- Renderer: `scene/mapScene.ts` + `mapDepth.ts` vẽ `scenery` (sort theo chân, lớp che mờ dần — mở rộng `mapCovers.ts`). Thuộc GĐ14 art nên được làm.

### 3.2 Không vào runtime — dữ liệu riêng của builder
`tools/admin/data/adventure/` (commit vào git, không import từ `src/`, guard chặn):
- `drafts/<mapId>.json` — bản nháp cả hàng map (đúng `mapSchema`, được phép còn lỗi) + `zone` dự kiến.
- `meta.json` — mỗi map: `description`, `status` (`draft` / `published` / `disabled`), `createdAt`, `updatedAt`, `publishedAt`, tên lối ra hiển thị trong editor, vị trí node trên Map Network. **Kéo node chỉ ghi file này.**
- `history/<mapId>/<thời điểm>.json` — bản published trước mỗi lần publish ⇒ "quay lại bản trước".
- Lối ra / spawn **inactive** = chỉ có trong draft (đánh dấu `inactive` trong meta), bị bỏ khi publish. Không có cờ runtime.
- `disabled` = map chưa từng publish bị tạm gác (không publish được). Map đã ship **không xóa, không tắt** (§4).
- Nhạc nền: hiện chưa có nhạc theo map ⇒ để trống, chờ GĐ14 âm thanh.

### 3.3 Asset Library
- Dùng tiếp `props.json` làm thư viện chung (map chỉ tham chiếu id). Thêm `category` (tùy chọn: `tree`, `rock`, `building`, `deco`, `cover`, `water`…) và `anchor` (chân, mặc định giữa đáy).
- Upload: `POST /__admin/adventure/asset` → chép PNG vào `art_inbox/`, thêm dòng manifest + hàng `props.json`, chạy `art:process` (tách nền, cắt chân) như pipeline hiện có. Nền map mới: `scripts/art/map_v3/bg_prepare.py` (xóa dấu sao, phóng 64 px / ô, chia khối) qua dev API.

## 4. Data flow

```
 Admin (npm run admin, dev only)
   Map Management ─┐
   Map Network ────┼─► drafts/<id>.json + meta.json      (Save Draft: chỉ schema hình dạng, cho phép lỗi)
   Map Editor ─────┘        │
                            ▼ Validate (thuần, chạy trên trình duyệt + lại ở dev API)
          bản ghép = maps.json với các draft thay vào / thêm vào; zones.json với zone mới
          ├ mapSchema + mapsFileSchema (zod)
          ├ mapProblems(mỗi map)                      ─ lỗi nghiêm trọng
          ├ mapGraphProblems(bản ghép, zones)          ─ lỗi (trừ lối oneWay)
          ├ arrive → spawn tồn tại, arriveX/Y khớp      ─ lỗi
          ├ asset id có trong props.json / manifest     ─ lỗi
          ├ id đã ship còn đủ (map, exit, chest, gate, group, lore, cover, puzzle)  ─ lỗi
          └ cảnh báo: map không lối vào, chưa nối, đổi cols/rows map đã ship, scenery chồng vật gameplay
                            ▼ Publish (chỉ khi 0 lỗi)
          history/ ← bản cũ;  POST /__admin/content maps.json (+ zones.json)
          → contentSave: schema → nạp lại mọi module content → hỏng thì khôi phục hết
                            ▼
          content/adventure/maps.json  ──(import tĩnh lúc build)──► runtime game
```
- Draft không bao giờ chạm `content/` ⇒ không ảnh hưởng game đang chạy.
- **Xóa map:** chỉ map chưa từng publish (không có trong `maps.json` của `main` / tag phát hành gần nhất). Trước khi xóa liệt kê mọi lối ra (published + draft) trỏ tới nó. Map đã ship: nút xóa / tắt bị khóa kèm lý do (save giữ `run.mapId`, `beaten`, `explored`). Nếu sau này cần gỡ map đã ship → decision riêng + migration chuyển chuyến dở về map khác.
- **Kết nối hai chiều:** tạo lối ra A→B xong, editor mở luôn map B ở chế độ "đặt lối về": admin tự chọn ô; không tự sinh lối ngược ở chỗ chưa xác định. Chưa đặt thì kết nối hiện cảnh báo "một chiều chưa xác nhận" (chặn publish trừ khi đánh `oneWay`).
- **Preview bằng renderer thật, không đụng save thật:** `npm run admin:preview -- <mapId> [spawnId]` (dev API gọi): dựng bản ghép như Validate vào thư mục tạm, chạy game dev (vite config riêng, alias `content/adventure/maps.json` / `zones.json` → bản ghép) trên **save sandbox** (`%TEMP%\sobiworld-sandbox`, dựng từ `scripts/dev/richSave.ts`, đặt `run` tại map + spawn). Đi thử, va chạm, che, chuyển cảnh qua lối ra bằng `takeExit` thật. Không thêm code preview vào `src/`.
- **Undo / Redo:** mỗi thao tác trong editor = 1 bản sao draft (map ≈ 12 KB, giữ 200 bước), Ctrl+Z / Ctrl+Y; áp cho Map Editor và Map Network (vị trí node, sửa lối ra).

## 5. UI

- Admin → nhóm "⚔️ Sobi Adventure" thêm 4 trang: **Quản lý map**, **Mạng map**, **Map Editor** (thay "Bản đồ khu"), **Thư viện asset**.
- **Quản lý map:** bảng (tên, id, zone, kích thước, trạng thái, sửa lúc, số lối vào / ra, số lỗi), lọc zone / trạng thái, tìm. Nút: Tạo mới (trống cỡ tùy chọn / từ mẫu = nhân bản bố cục một map, vật gameplay được đặt id mới), Nhân bản, Đổi tên, Tắt / Bật (chỉ draft), Xóa (chỉ draft), Mở editor.
- **Mạng map:** SVG; node = map (màu theo trạng thái, nhóm theo zone), cạnh = lối ra (mũi tên; hai chiều gộp 1 cạnh; khóa vẽ nét đứt; lỗi tô đỏ). Click node → editor; click cạnh → bảng sửa lối ra; kéo thả node; tìm; lọc. Cảnh báo ở thanh bên.
- **Map Editor:** canvas (nền vẽ + lưới 40 px + lớp phủ), toolbar trái-trên (chọn, tô đi được / chặn, tẩy, hình chữ nhật, đổ loang, độ cao, che, vùng đặt, đặt vật gameplay, lối ra, spawn), thư viện asset trái, Inspector phải (số chính xác), thanh trạng thái Draft / Published + Save Draft / Validate / Preview / Publish. Zoom bánh xe, pan chuột giữa / Space. Chọn nhiều (khung kéo, Shift), sao chép / dán, lật, xoay, scale X / Y.

## 6. Giai đoạn (mỗi GĐ: code + test + `npm run check` + báo cáo, chờ duyệt)

| GĐ | Nội dung | Đổi runtime? |
|---|---|---|
| 1 | Audit + đề xuất này | không |
| 2 ✅ | Kho draft + `meta.json` + dev API; trang Quản lý map: tạo (trống / mẫu), nhân bản, đổi tên, tắt, xóa có liệt kê tham chiếu; khóa xóa id đã ship trong `contentSave` (sửa lỗ hổng §1.3) | không |
| 3 ✅ | `spawns[]` + `exits[].arrive` (schema, test); quản lý spawn trong editor | schema chỉ thêm |
| 4 ✅ | Lối ra: nhiều lối / map, đích + spawn đích, khóa, `oneWay`, hai chiều có xác nhận, mở nhanh map đích; `mapGraph` hiểu `oneWay` (test) | `mapGraph` |
| 5 | Mạng map (SVG, kéo thả, tìm, lọc, cảnh báo) | không |
| 6 | Map Editor canvas (nền, lưới, công cụ tô, undo), `scene.scenery[]` + render + va chạm, Thư viện asset + upload | renderer + `blockedTiles` |
| 7 | Validate tổng hợp + Publish + lịch sử / quay lại + Preview sandbox + **chạy thử trong Admin** (đi bằng bàn phím trên map đã publish, luật đi / lối ra của game, không chạm save) | không |
| 8 | Test tích hợp: map mới tạo từ Admin → publish → chơi qua lối ra thật; save thật cũ nạp được; 18 map cũ sạch `check_live`; build desktop | không |

Ước lượng: GĐ6 lớn nhất (canvas editor + renderer scenery), có thể tách 6a (canvas + terrain + gameplay object) / 6b (scenery + asset library).

## 7. Cần chủ dự án chốt (đề xuất của agent in đậm)

1. **Lối ra một chiều:** cho phép bằng cờ `oneWay` (người chơi có thể bị "mắc" ở map không có đường về ngoài cổng dịch chuyển / về Trại — luôn có `returnToCamp`, nên không kẹt thật). → **Cho phép**.
2. **Map / id đã ship:** không xóa, không tắt; chỉ sửa. → **Đồng ý**.
3. **Portal / map inactive:** chỉ là trạng thái nháp, không có cờ runtime. → **Đồng ý**.
4. **Va chạm của asset trang trí:** runtime đọc `scenery.foot` (sửa nhỏ `blockedTiles`) thay vì "nướng" vào `terrain`. → **Runtime đọc foot**.
5. **Nơi lưu draft / meta / lịch sử:** `tools/admin/data/adventure/` (commit git). → **Đồng ý**.
6. Về lâu dài (hàng trăm map): tách `maps.json` thành `content/adventure/maps/<id>.json` nạp bằng `import.meta.glob` — chưa làm ở các GĐ trên (mọi script `map_v3`, `check_live`, `contentCatalog` đang trỏ 1 file); đề xuất decision riêng khi vượt ~40 map.
