# SOBI WORLD — ARCHITECTURE

Tài liệu kỹ thuật cho AI agent. Nguồn sự thật về gameplay là `SOBI_WORLD_PROJECT_SPEC_V2.md`.

---

## 1. Nguyên tắc chung

1. **Giữ tech stack hiện tại của Sobi Farm.** Chỉ đổi khi không thể đáp ứng yêu cầu đóng gói desktop, và phải ghi lý do vào `docs/decisions/`.
2. **Offline, không server.** Mọi logic chạy trong ứng dụng. Dữ liệu đọc/ghi file trên máy.
3. **Data-driven.** Nội dung game nằm trong `content/`, không nằm trong code.
4. **Phụ thuộc một chiều.** Area không biết đến nhau.
5. **Một công thức mô phỏng cho mọi chế độ** (đang xem, nền, bù offline).

---

## 2. Cấu trúc thư mục

Đã chốt ở `docs/decisions/001-repo-structure.md`: **một ứng dụng, một repo**, mỗi Area một thư mục. Dữ liệu và asset
gom theo Area để sửa một Area chỉ đụng thư mục của Area đó.

```text
Sobi_World/
├── docs/                  Spec, kiến trúc, balance, roadmap, PROGRESS.md, decisions/, archive/
├── content/               Dữ liệu game (JSON), admin chỉnh sửa
│   ├── schemas/           Schema (zod) kiểm tra từng loại dữ liệu
│   ├── shared/            items, balance chung, npcs, orders, achievements, shop
│   ├── farm/              species heo, luật lai, balance farm, layout
│   └── garden/  aquarium/  cloud/  adventure/  plaza/
├── public/assets/
│   ├── manifest/          Asset registry (id, path, kích thước, hướng, animation)
│   └── shared/  plaza/  farm/  garden/  aquarium/  cloud/  adventure/
├── src/
│   ├── core/              Nền tảng thế giới, không biết gì về heo hay cây
│   ├── systems/           Hệ thống gameplay dùng lại được cho nhiều Area
│   ├── areas/
│   │   ├── _template/     Khung mẫu tạo Area mới
│   │   ├── plaza/         Sảnh Sobi
│   │   └── farm/          (mỗi Area cùng một khuôn)
│   │       ├── index.ts   manifest + hook (Area Contract, mục 5)
│   │       ├── logic/     simulate() thuần + action, có test
│   │       ├── scene/     Phaser: cảnh, prefab, AI hiển thị
│   │       ├── ui/        panel DOM riêng của Area
│   │       └── README.md
│   ├── ui/                Theme, component dùng chung, HUD, màn hình chung
│   ├── app/               Khởi động, vòng lặp game, chuyển Area (store hiện tại)
│   ├── platform/          Adapter desktop/web (save file, hộp thoại)
│   └── i18n/              Bảng chuỗi
├── electron/              Tiến trình chính desktop (Node API chỉ ở đây)
├── admin/                 Admin Dashboard (chỉ bản phát triển; hiện ở tools/admin + scripts/admin)
├── build/                 Icon, tài nguyên installer
├── scripts/               Công cụ dev: art, asset, sim kinh tế
└── tests/
```

Thư mục Area nào chưa làm thì chưa tạo. Code Sobi Farm hiện nằm ở `src/{core,store,game,ui,platform}`; GĐ1 chuyển dần
sang khuôn trên, mỗi bước game vẫn chạy (`npm run check` xanh).

---

## 3. Quy tắc phụ thuộc

```text
app → areas/* → systems/* → core/*
ui có thể được dùng bởi app và areas.
admin chỉ đọc/ghi content/ và save qua core.
```

- `core` không import `systems`, `areas`, `ui`.
- `systems` không import `areas`.
- **Area không import Area khác.** Liên kết qua item, recipe, sự kiện và world state.
- Cần có một script/test tự động phát hiện import sai quy tắc.

---

## 4. Các module

### core/
| Module | Trách nhiệm |
|---|---|
| `world` | World state tổng, danh sách Area, trạng thái mở khóa |
| `area-registry` | Đăng ký Area theo manifest, gọi các hook vòng đời |
| `clock` | Giờ thật, buổi trong ngày, chống chỉnh giờ, tính thời gian offline |
| `simulation` | Điều phối 3 chế độ mô phỏng, chia bước thời gian |
| `player` | Hồ sơ, vị trí nhân vật, Area hiện tại |
| `inventory` | Túi đồ chung, giới hạn ô, stack |
| `items` | Tra cứu định nghĩa item |
| `economy` | Coins, Gems, Event Tokens, giao dịch, giá chợ theo ngày |
| `production` | Chạy recipe theo thời gian thật tại công trình |
| `progression` | Level từng Area, World Development, điều kiện mở khóa |
| `collection` | Codex, mốc thưởng |
| `goals` | Bảng đơn hàng, mục tiêu hằng ngày, thành tựu |
| `events` | Event bus |
| `content` | Load và validate toàn bộ `content/` khi khởi động |
| `assets` | Asset registry, tra cứu asset theo id |
| `save` | Lưu/tải, migration, backup, validation |
| `settings` | Cài đặt và phím điều khiển (file riêng) |
| `rng` | Ngẫu nhiên có seed, để test lặp lại được |

### systems/
| Module | Trách nhiệm |
|---|---|
| `creature` | Model sinh vật chung, nhu cầu, lớn, giai đoạn, cân nặng |
| `health` | Nguy cơ bệnh, bệnh, nguy kịch, chết, chữa |
| `bond` | Thân thiết, món yêu thích |
| `behavior-ai` | State machine hành vi (chỉ chạy ở chế độ đang xem) |
| `breeding` | Gen, trait, rarity, đột biến, pity |
| `quality` | Tính quality |
| `valuation` | Công thức giá trị sinh vật/vật phẩm |
| `plants` | Cây/hoa: gieo, tưới, lớn, chín, héo |
| `combat` | Trận đánh theo lượt, skill, nguyên tố |
| `equipment` | Trang bị, chỉ số |
| `animation` | Animation theo dữ liệu |
| `layout` | Bố cục Area, va chạm, vật thể tương tác |
| `character` | Di chuyển nhân vật, tương tác |
| `weather` | Thời tiết theo ngày (giai đoạn sau) |

---

## 5. Hợp đồng Area (Area Contract)

Mỗi Area gồm **manifest dữ liệu** (`content/areas/<id>.json`) và **module code** (`src/areas/<id>/`).

**Manifest:**
```json
{
  "id": "sobi_farm",
  "name": "Sobi Farm",
  "portalInPlaza": "pig_barn",
  "unlock": { "farmLevel": 0 },
  "layout": "layouts/farm.json",
  "buildings": ["barn", "auto_feeder", "breeding_station", "storage"],
  "produces": ["item_manure"],
  "consumes": ["item_pig_feed", "item_medicine"],
  "npc": "npc_farmer"
}
```

**Hook mà module Area phải cung cấp:**
| Hook | Khi nào |
|---|---|
| `init(world)` | Khởi tạo dữ liệu Area lần đầu |
| `simulate(areaState, fromTime, toTime)` | Tính số liệu, **dùng cho cả 3 chế độ** |
| `onEnter()` / `onExit()` | Người chơi vào/ra Area: dựng/hủy cảnh, AI, animation |
| `updateActive(dt)` | Mỗi frame khi đang xem: AI, animation, input |
| `getSummary(fromTime, toTime)` | Dòng tóm tắt cho màn hình "Trong lúc bạn vắng nhà" |
| `migrations` | Danh sách migration cho dữ liệu riêng của Area |

`simulate` phải là hàm thuần (cùng đầu vào → cùng đầu ra), dùng `core/rng` có seed.

---

## 6. Mô phỏng thời gian

- Bước số liệu: **1 phút** khi đang chạy, **10 phút** khi bù offline.
- Bù offline tối đa **30 ngày**. Nếu giờ máy lùi, không tính ngược và ghi log.
- AI di chuyển và animation chỉ chạy ở Area đang xem. Khi người chơi rời Area, vị trí sinh vật được giữ nguyên. Khi quay lại, AI tiếp tục từ trạng thái số liệu hiện tại.
- Bù offline 30 ngày phải xong dưới **3 giây** trên máy trung bình. Nếu chậm, tối ưu bằng cách gộp bước khi không có sự kiện.

**Cách làm (GĐ2, `core/simulation`):** khoảng thời gian được chia thành **lát** dài tối đa một bước (1 phút online, 10 phút offline); ranh giới lát nằm trên
lưới của *giờ địa phương* nên mốc buổi (05/10/17/20 giờ) luôn là ranh giới lát. Mỗi lát gọi `simulate` của từng Area; bên trong lát công thức vẫn là
dạng đóng (giải tích). Quy tắc rời rạc không được phụ thuộc cỡ lát: bệnh dùng *ngân sách rủi ro tích lũy* với ngưỡng seed theo (id, lần bệnh), không bốc
từ dòng `rng`. Chỗ duy nhất lát "lấy mẫu" là số đống phân (tính từ đầu lát) nên kết quả hai chế độ lệch cỡ vài phút, không hơn (test `simulation.test.ts`).
Trần 30 ngày: mô phỏng 30 ngày đầu rồi `rebase` mốc thời gian Area về hiện tại. Giờ máy lùi quá dung sai: không mô phỏng, store báo `clockRewound`.

---

## 7. Sự kiện chuẩn (event bus)

`item.added`, `item.removed`, `currency.changed`, `creature.born`, `creature.sold`, `creature.sick`, `creature.critical`, `creature.died`, `creature.levelUp`, `crop.planted`, `crop.harvested`, `recipe.completed`, `order.completed`, `area.unlocked`, `area.levelUp`, `codex.discovered`, `achievement.unlocked`, `adventure.finished`, `time.dayChanged`.

Area mới có thể thêm sự kiện riêng, phải ghi vào bảng này.

---

## 8. Dữ liệu nội dung

- Mỗi loại dữ liệu có schema trong `content/schemas/`. Game và admin đều validate khi load/lưu.
- Quy ước id: `item_`, `creature_`, `breed_`, `crop_`, `recipe_`, `order_`, `ach_`, `npc_`, `zone_`, `enemy_`, `skill_`, `asset_`.
- Không xóa id đã phát hành. Muốn bỏ nội dung thì đánh dấu `disabled: true` để save cũ không lỗi.
- Mọi con số balance đọc từ `content/balance/`, không hard-code.

---

## 9. Save

- Vị trí: thư mục dữ liệu người dùng của hệ điều hành (ví dụ `%APPDATA%/SobiWorld/` trên Windows).
- **Chuyển save Sobi Farm:** lần chạy đầu, nếu chưa có save Sobi World mà có `%APPDATA%/Un In Homemade/saves/save.json` thì sao chép sang (không xóa bản cũ) rồi migrate.
- File: `save.json` (world state), `settings.json` (cài đặt, phím).
- Có `schemaVersion`. Khi tải save cũ, chạy chuỗi migration lần lượt.
- **Ghi an toàn:** ghi ra file tạm rồi đổi tên, để mất điện không làm hỏng save.
- **Backup:** giữ 5 bản gần nhất, thêm 1 bản trước mỗi lần migration.
- **Validation khi tải:** nếu save hỏng, tự thử bản backup gần nhất và báo cho người chơi.
- Tự động lưu: mỗi 60 giây, khi đổi Area, sau sự kiện quan trọng (xuất chuồng, chết, mở khóa), khi thoát game.
- Lưu thời điểm lưu cuối (`lastSavedAt`) để tính bù offline.

---

## 10. Admin Dashboard

- Entry riêng, chỉ chạy ở chế độ phát triển.
- **Build cho người chơi không chứa admin.** Phải có test kiểm tra điều này.
- Admin sửa file trong `content/` và save test. Mọi thay đổi qua validation.
- Có công cụ: tua thời gian, cộng tiền/đồ, tạo sinh vật, reset save test, xem log mô phỏng.
- Mỗi giai đoạn thêm nội dung mới thì thêm màn hình admin tương ứng.

---

## 11. Đóng gói desktop

- Chọn công cụ đóng gói phù hợp stack hiện tại (ví dụ stack web thì dùng Electron hoặc Tauri). Ghi lý do chọn.
- Kết quả: installer hoặc file chạy, có icon, có shortcut.
- Kiểm tra trên **máy sạch** (không cài Node, Python hay công cụ lập trình nào).
- Chạy không cần internet.

---

## 12. Hiệu năng

- Tối đa 30 sinh vật chạy AI cùng lúc trong Area đang xem.
- Asset gom thành sprite atlas khi có thể.
- Mục tiêu 60 FPS trên máy trung bình.

---

## 13. Kiểm thử

- Unit test cho `core` và `systems`, đặc biệt: save/migration, bù offline, bệnh/chết, giá trị, recipe, breeding, combat.
- **Test nhất quán:** mô phỏng 24 giờ bằng bước 1 phút và bằng bước 10 phút phải cho kết quả gần như nhau.
- Test quy tắc phụ thuộc import.
- Test build người chơi không chứa admin.
