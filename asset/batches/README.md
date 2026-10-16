# GĐ14 — Kế hoạch art theo batch

Mỗi batch = một file `<id>.json` (nguồn) + `<id>.md` (prompt sinh tự động, **đừng sửa tay**). Quy trình:
skill `image-to-asset`, `workflows/batch.md`. Xem tiến độ: `node .claude/skills/image-to-asset/scripts/batch.mjs list`.

Phong cách chuẩn: **Sobi Farm** (quyết định của chủ dự án 2026-10-12, decision 022). Ảnh mock-up Sobi World chỉ gợi ý hình dáng.

Backend: **G** = Gemini vẽ sheet (chủ dự án dán prompt, lưu ảnh; còn lại Claude làm) · **K** = Claude vẽ bằng code ·
**K-derive** = Claude tạo icon từ sprite đã duyệt · **VFX** = hiệu ứng chạy bằng code trong game (không cần file).

## 162 dòng `placeholder` trong manifest

| Area | Batch | Asset (số dòng) | Backend | Lượt Gemini | Trạng thái |
|---|---|---|---|---|---|
| Cloud | `cloud-01-flowers` | 6 hoa × 4 giai đoạn (24) | G, 3 sheet 2×4, cùng tỉ lệ | 3 | **production** (chờ duyệt) |
| Cloud | `cloud-02-items` | 6 hạt, 6 hoa, nước tinh khiết, 3 potion (16) | G, 3 sheet | 3 | **production** (chờ duyệt) |
| Cloud | `cloud-03-world` | `bld_cloud_spring`, `bld_cauldron`, `plot_cloud`, `bg_cloud` (4) | G, 1 sheet 1×3 + 1 nền | 2 | 3/4 production; `bg_cloud` chờ (ảnh có watermark Gemini) |
| Cloud | `cloud-04-scene` | nền đảo mây (sửa từ ảnh mẫu), bảng gỗ, băng rôn tầng, 2 nút tầng, chim mây, Cú Giả Kim (7, decision 023) | G: 1 ảnh sửa + 2 sheet | 3 | **production** (chờ duyệt) |
| Garden | `garden-01-crops` | 5 cây × 4 giai đoạn (20) | G, 3 sheet | 3 | **đã viết**, chờ ảnh Gemini |
| Garden | `garden-02-items` | 5 hạt, 5 nông sản, thức ăn cao cấp, phân bón (12) | G, 2 sheet 2×3 | 2 | **đã viết**, chờ ảnh Gemini |
| Garden | `garden-03-world` | `plot_soil`, `_wet`, `plot_locked`, `bld_feed_mill`, `bld_composter`, `bld_sprinkler` (6) | G, 2 sheet 1×3 | 2 | **đã viết**, chờ ảnh Gemini |
| Aquarium | `aquarium-01-fish` | 12 cá theo content, nhìn sang phải (12) | G, 2 sheet 2×3 | 2 | **đã viết**, chờ ảnh Gemini |
| Aquarium | `aquarium-02-items` | 12 icon cá (K-derive) + vảy, ngọc trai, thức ăn cá; thêm trứng cá, đống vảy, phao (dòng manifest mới) (15) | K-derive + G 2×3 | 1 | **đã viết**, chờ ảnh Gemini |
| Aquarium | `aquarium-03-world` | `bld_fish_tank`, `bld_fish_dock`, `bg_aquarium` (3) | nền E1–E5, bảng, cần câu, NPC, icon đã render trong `art_inbox/.batch/aquarium-01-scene/` (theo ảnh mẫu 5 cấp; bể kính vẽ liền trong nền) | 0 | chờ nối khi dựng lại cảnh |
| Adventure | `adventure-01-forest` | 7 kẻ địch + trùm Cổ Thụ, nhìn sang trái (8) | G, 2 sheet + 1 ảnh trùm | 3 | chưa viết |
| Adventure | `adventure-02-mountain` | 4 kẻ địch, Tượng Quặng, trùm Rồng Dung Nham (6) | G, 1 sheet + 2 ảnh đơn | 3 | chưa viết |
| Adventure | `adventure-03-ruins` | 4 kẻ địch + trùm Hộ Pháp Cổ Đại (5) | G, 1 sheet + 1 ảnh trùm | 2 | chưa viết |
| Adventure | `adventure-04-equipment` | 12 trang bị (12) | G, 2 sheet 2×3 | 2 | chưa viết |
| Adventure | `adventure-05-materials` | thảo mộc, nanh, quặng, bánh răng, rune, trứng heo hoang, 3 khẩu phần (9) | G, 2 sheet | 2 | chưa viết |
| Adventure | `adventure-06-backdrops` | `bg_adventure_forest`, `_mountain`, `_ruins` (3) | G, 3 nền | 3 | chưa viết |
| Farm | `farm-01-species` | 6 giống heo GĐ7: đứng (6) + ngủ, thức (từ ảnh đứng đã duyệt) | G sheet 2×3, rồi Gemini sửa ảnh | 3 | chưa viết |
| Sảnh | `world-01-scene` | nền đảo trời (sửa từ ảnh mẫu), 7 công trình cổng, 8 đồ trang trí, bảng tên, logo, sao cấp, 5 icon khu vực, 4 icon HUD, linh vật Sobi (30, decision 024) | G: 1 ảnh sửa + 8 sheet | 9 | **production** (chờ duyệt) |
| Sảnh | `plaza-01-icons` | `ui_icon_lock` (1) | K | 0 | chưa viết |
| | | **162** | | **~39** | |

Thứ tự làm: Cloud → (duyệt) → Garden → Aquarium → Adventure → Farm → Sảnh, mỗi Area dừng chờ duyệt ảnh chụp (GĐ14).

## Ngoài manifest (cần thêm dòng manifest hoặc nối code; liệt kê trong `docs/ASSET_TODO.md`)

| Việc | Cách làm | Cần duyệt |
|---|---|---|
| Ảnh NPC riêng: Cú Giả Kim, Gà Mơ Màng, bà Ngan Lai, Hiệp Sĩ Heo, Thương nhân | G (bảng `creature`), dòng manifest `npc_*` mới | Có: đổi `artId` trong `content/shared/npcs.json` (GĐ14 ghi "không đổi content") |
| 5 icon thời tiết, Vé Lễ Hội, 4 icon công nghệ, 11 icon tính trạng | G sheet icon | Có: dòng manifest mới + thay ký tự trong UI |
| Banner / cờ lễ hội, sạp Thương nhân, đồ trang trí lễ hội | G | Có |
| Nối `bg_cloud` vào CloudScene (đang tô trời bằng code) | Code trình bày, sau khi ảnh được duyệt | Không |
| VFX thời tiết, lên cấp, mở khóa, trứng nở, animation trận | VFX (Phaser particles / tween) | Không |
| Nhạc nền từng Area, âm thanh riêng | Ngoài skill này: SFX tổng hợp bằng code (`scripts/art/sfx.ts`), nhạc AI miễn phí / CC0 | Có (nguồn nhạc) |
| Icon app | G từ `pig_classic` | Không |
