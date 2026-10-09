# ASSET_TODO — art còn là placeholder

Các hàng này đã có trong `public/assets/manifest/assets.json` với `status: placeholder` (file do `npm run assets:placeholders` sinh). Thay file, đổi `status` thành `production`; `npm run assets:release` chỉ qua khi hết placeholder.

## GĐ3 — Nhân vật và Sảnh
| Id | Loại | Kích thước | Cần gì |
|---|---|---|---|
| `chr_player` | props (states) | 96×144 mỗi khung | Nhân vật người chơi, 4 hướng (`down` `up` `left` `right`) × 3 khung (`idle`, `walk1`, `walk2`). Chân chạm đáy khung, giữa khung theo chiều ngang. Chu kỳ bước: walk1, idle, walk2, idle. |
| `prop_garden_gate` | buildings | 320×300 | Cổng Khu vườn (Sobi Garden). Cần bản "mở" khi Area có thật. |
| `prop_sea_dock` | buildings | 420×300 | Bến/biển dẫn vào Sobi Aquarium. |
| `prop_sky_tree` | buildings | 340×520 | Cây cao chọc trời dẫn lên Sobi Cloud. |
| `prop_portal_gate` | buildings | 320×360 | Cổng dịch chuyển tới Sobi Adventure. |
| `prop_plaza_signpost` | buildings | 160×200 | Biển chỉ đường "Ra Sảnh" ở Farm. |
| `ui_icon_lock` | ui | 128×128 | Ổ khóa trên cổng chưa mở. |

Cổng chuồng heo của Sảnh dùng lại `prop_pig_house` (art thật). Cổng khóa hiện là ảnh cũ tối màu + ổ khóa: art chính thức nên có trạng thái khóa riêng (rào, mây che, cổng tắt — spec §3.1).
Sảnh còn thiếu: nền/nền gạch riêng, Bảng đơn hàng, Chợ, NPC (GĐ6).
