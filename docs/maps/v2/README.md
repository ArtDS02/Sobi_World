# Bố cục map v2 (decision 045)

Bố cục thiết kế cho đợt mở rộng bản đồ, mỗi file một map: lưới ô + vùng che + danh sách vật. M1–M9 và N1–N6 **đã nhập** vào `content/adventure/maps.json` (decision 045 bước 4a: `export.py` → `layouts.json` → `import_maps.py` → `npm run content:fmt`); N7–N9 chờ vùng Biển.

- Nguồn: `scripts/art/map_layouts_v2/` — `layout.py` (bộ công cụ vẽ lưới + kiểm tra đường đi), `forest.py`, `mountain.py`, `ruins.py`, `coast.py` (18 map), `render.py` (sinh file ở đây và ảnh before), `batch.py` (sinh batch ảnh `adventure-14-map-v2`), `refs.py` (cắt ảnh chuẩn từ tranh map đã duyệt làm hint cho bộ ghép), `cut_kit.py` (cắt sheet bộ ghép thành ứng viên: gom mảnh theo hàng / cột, gỡ dấu ✦, giữ ô nền liền khối).
- Chạy lại: `python scripts/art/map_layouts_v2/render.py` rồi `python scripts/art/map_layouts_v2/batch.py` và `python .claude/skills/image-to-prompt/scripts/art.py prep adventure-14-map-v2`.
- Bộ ghép (sau khi có tranh): `python scripts/art/map_layouts_v2/refs.py`, `python scripts/art/map_layouts_v2/batch.py --kit [--redo M7,N7]` (`--redo` thêm sheet vẽ lại map chưa đạt), rồi `art.py prep` như trên.
- Cắt sheet đã tạo: `python scripts/art/map_layouts_v2/cut_kit.py [--sheet FT ...] --qa` (ảnh soát ở `art_inbox/.qa/map-v2/`), rồi `art.py approve <asset>... [--force]`.
- `render.py` báo lỗi (exit 1) nếu có vật không tới được từ điểm xuất phát, vật đứng trên ô cấm, lối ra không nằm ở mép, hoặc map dưới 40 % ô đi được.

## Ký hiệu ô
| Ô | Nghĩa |
|---|---|
| `.` | đất trống | 
| `,` | đường |
| `~` | nước |
| `=` | cầu (đường qua nước) |
| `#` | khối dày (rừng / đá), không đi qua |
| `^` | mặt cao nguyên, đi được |
| `F` | vách / mép cao nguyên, không đi qua |
| `s` | bậc đá lên vách |
| `c` | đất bị tha hóa, đi được |
| `w` | thác nước, không đi qua |

## 18 map
| Map | Vùng | Kích thước | Tha hóa | Nhóm quái | Rương | Lối ra |
|---|---|---|---|---|---|---|
| M1 Bìa Rừng | Rừng | 64 × 36 | 10 % | 11 | 4 | 2 |
| M2 Rừng Sâu | Rừng | 64 × 36 | 18 % | 12 | 3 | 3 |
| M3 Lõi Rừng | Rừng | 48 × 27 | 30 % | 9 | 2 | 3 |
| N1 Thung Nấm | Rừng | 64 × 36 | 15 % | 16 | 6 | 2 |
| N2 Thác Rêu | Rừng | 72 × 40 | 20 % | 17 | 5 | 3 |
| N3 Đầm Sương | Rừng | 80 × 45 | 35 % | 18 | 6 | 2 |
| M4 Chân Núi | Núi | 64 × 36 | 30 % | 12 | 4 | 3 |
| M5 Mỏ Quặng Bỏ Hoang | Núi | 64 × 36 | 40 % | 12 | 4 | 3 |
| M6 Đỉnh Dung Nham | Núi | 48 × 27 | 50 % | 9 | 3 | 3 |
| N4 Đèo Gió | Núi | 72 × 40 | 35 % | 16 | 5 | 3 |
| N5 Đường Hầm Cổ | Núi | 72 × 40 | 45 % | 15 | 5 | 3 |
| M7 Cổng Tàn Tích | Tàn Tích | 64 × 36 | 60 % | 11 | 4 | 3 |
| M8 Hành Lang Rune | Tàn Tích | 64 × 36 | 70 % | 12 | 4 | 3 |
| M9 Điện Phong Ấn | Tàn Tích | 48 × 27 | 85 % | 9 | 3 | 2 |
| N6 Hầm Mộ Rune | Tàn Tích | 72 × 40 | 80 % | 17 | 5 | 3 |
| N7 Bãi Vỏ Sò | Biển | 72 × 40 | 40 % | 12 | 4 | 3 |
| N8 Rạn San Hô | Biển | 72 × 40 | 50 % | 15 | 5 | 2 |
| N9 Vịnh Đắm Tàu | Biển | 64 × 36 | 60 % | 10 | 4 | 2 |

Lối ra theo graph của decision 043: tuyến chính M1 → … → M9, nhánh N1–N6 nối các map chính (có đường tắt mở từ một phía: N2 → M3, N4 → M6, N5 → M5), vùng Biển N7–N9 (trùm vùng ở N9) vào từ N3. Lối sang vùng chưa mở bị khóa. Mỗi file `.txt` ghi `to=`, `lock=`, `note=` của từng lối.

Id của vật trên M1–M3 hiện có giữ nguyên khi vật còn (rương, cổng hệ, lore, nhóm quái); vật mới có id mới.
