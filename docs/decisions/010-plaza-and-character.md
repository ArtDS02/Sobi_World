# 010 — Sảnh, nhân vật và cách chuyển Area (GĐ3)

## Bối cảnh
Spec V2 §3.1, §4: game mở ở Sảnh; một nhân vật đi bộ, đứng gần vật thể rồi bấm phím tương tác. Phím đổi được, lưu riêng khỏi save.

## Quyết định
- **Sảnh không phải AreaModule.** Không có số liệu để mô phỏng, không có slice save. Nó là `src/areas/plaza` (logic thuần + scene) cộng nội dung `content/plaza/layout.json`. Cổng của Area nào do `portalInPlaza` trong manifest Area quyết định.
- **Area chưa làm** có manifest `content/<area>/area.json` với `planned: true` (điều kiện mở theo GAME_BALANCE §7). `registry.areas()` trả cả chúng với `planned`; Sảnh hiện cổng khóa + điều kiện. Một Area `planned` không bao giờ mở, dù đủ điều kiện.
- **Một canvas Phaser, nhiều scene.** Sảnh và Farm là hai scene cùng game; đổi chỗ = `sleep` scene cũ, `wake`/`start` scene mới. Farm mô phỏng số vẫn chạy như cũ (cùng công thức, ARCHITECTURE §6): chỉ phần vẽ/AI ngủ. Test `areaFlow.test.ts` chứng minh đi lại không đổi số liệu.
- **`onEnter/onExit` của AreaModule** do `app/areaFlow.ts` gọi; Farm nối chúng vào canvas qua `areas/farm/stage.ts`.
- **Mở game luôn ở Sảnh.** Save giữ `player {area, x, y, facing}` (world save v9, migration v8→v9): thoát trong Sảnh → mở lại đúng chỗ; thoát trong một Area → mở lại ngay trước cửa Area đó.
- **Phím** = `KeyboardEvent.code`, 2 phím mỗi hành động, không trùng, không dùng phím hệ thống. File `settings.json` riêng (desktop: ghi tạm rồi đổi tên; web: localStorage); file hỏng → phím mặc định, không chặn game. Lỗi ghi được báo, không nuốt.
- **Nhân vật chỉ đi ở Sảnh và Sobi Adventure** (chủ dự án, 2026-10-09). Sobi Farm, Garden, Aquarium, Cloud chơi bằng click như Sobi Farm cũ, không có nhân vật. Manifest Area có `movement: click | character`. Từ Farm về Sảnh: nút "Ra Sảnh" trên HUD. Ở Sảnh bấm chuột vào cổng hoặc mặt đất cũng làm nhân vật đi tới.
- **Địa hình Sảnh:** vật `solid` chắn phần chân (nhà, cây, đá, hàng rào, ghế, đèn, đài phun nước…, `footprint` chỉnh từng vật); biển chắn đường (`ground[].blocks`, xấp xỉ bằng các dải chữ nhật). Đường đất, quảng trường, bãi cát chỉ để vẽ. Cùng hàm `plazaObstacles` cho scene và test.
- **Nhân vật:** `systems/character` (thuần): 8 hướng, hộp chân va chạm, trượt dọc tường. Con số ở `content/shared/character.json`.
- **Art Sảnh:** cắt từ ảnh tham khảo `asset/reference/sobi_world` bằng `scripts/cut-plaza.ts` (nhân vật Sobi 12 khung, cổng dịch chuyển, vườn, bể cá, cây đậu thần, đài phun nước, ghế, đèn, thuyền, cây, rương, rơm, biển gỗ). Art Sobi Farm không đổi. Còn thiếu: xem `docs/ASSET_TODO.md`.

## Hệ quả
- Cổng mở = Area đã code **và** đã mở khóa; hiện chỉ Farm. `unlockedAreas` chưa tự mở theo cấp: làm cùng Garden (GĐ5).
- Tutorial và gợi ý của Farm chỉ hiện trong Farm.
