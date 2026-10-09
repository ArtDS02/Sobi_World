# src/areas/_template — khung mẫu tạo Area mới

Area = **manifest dữ liệu** + **module code** (ARCHITECTURE §5). Thư mục này là một Area tối thiểu chạy
được, có test (`tests/unit/areaRegistry.test.ts` đăng ký nó cạnh Farm).

## Tạo Area mới
1. Chép thư mục này thành `src/areas/<id>/` (ví dụ `garden`), đổi tên kiểu `Template*`.
2. Manifest: `content/<id>/area.json` theo `content/schemas/area.ts` (id lưu save, cổng ở Sảnh,
   điều kiện mở, item sản xuất / tiêu thụ). Nạp bằng `loadContent` như `areas/farm/logic/config/content.ts`.
3. Số liệu, nội dung: `content/<id>/*.json` + schema trong `content/schemas/<id>/`. Không hard-code.
4. Đăng ký module trong `src/app/areas.ts`.
5. Chuỗi hiển thị: `src/i18n/vi.ts` (namespace của Area).

## Luật
- `logic/` thuần (guard + ESLint): không DOM, không `Date.now()` / `Math.random()`; `now` / `rng` được truyền vào.
- `simulate()` là **một công thức cho mọi chế độ** (đang xem, nền, bù offline).
- Slice save (`areas[<id>]`) chỉ chứa state riêng của Area; tiền qua `core/economy`, đồ qua `core/inventory`,
  XP ở `progression.areas[<id>]`.
- Đổi cấu trúc slice: tăng `version`, thêm migration trong `TEMPLATE_MIGRATIONS` (driver ở `core/save/migrate.ts`).
- **Không import Area khác** (guard kiểm). Liên kết qua item, sự kiện chuẩn (`core/events`), world state.
- Sự kiện riêng của Area → ánh xạ sang sự kiện chuẩn trong `toWorldEvents`.

## Tệp
| Tệp | Vai trò |
|---|---|
| `index.ts` | Module Area: manifest + hook `init`, `simulate`, `simulatedAt`, `level`, `toWorldEvents`, `getSummary` |
| `logic/state.ts` | Schema slice save, version, migrations, state đầu |
| `logic/simulate.ts` | Luật theo thời gian (thuần) và sự kiện riêng |
