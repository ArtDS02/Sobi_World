# Sobi Adventure — Audit UI & animation (2026-10-24)

Audit dựa trên repository thực tế (nhánh `phase-14-art`, sau commit `6395dee`) và bộ ảnh chụp từ game chạy thật (`art_inbox/sobi_adventure_reference/`). Không chứa secret / dữ liệu cá nhân: ảnh chụp từ save thử nghiệm (bản sao `sandbox-rift`), không mở save của người chơi.

## 1. Công nghệ và cách chạy

| Mục | Thực tế |
| --- | --- |
| Nền tảng | Electron + Vite + TypeScript; Phaser 3.90 vẽ **bản đồ khám phá** (`scene/AdventureScene.ts`); **Trại, trận, HUD, tổng kết là DOM** (`ui/*.ts`, SCSS `src/styles/features/_adventure*.scss`). |
| Điểm khởi chạy | `src/app/start.ts` mount `createAdventureUi` (overlay) + `AdventureScene`; Area module `src/areas/adventure/index.ts`. Vào từ Sảnh (cửa "Sobi Adventure"). |
| Lệnh | `npm run dev` (trình duyệt), `npm run dev:desktop` (Electron), `npm run dev:sandbox` (thư mục dữ liệu riêng), `npm run check` (typecheck + lint + guard + assets + unit test), `npm run test:e2e` (Playwright trên bản build), `npm run sim:adventure`, `npm run sim:rift`. |
| Chụp ảnh | Mới: `npx tsx scripts/capture/adventureShots.ts` (Electron + dev server sandbox, bản sao save) — xem `docs/animation/HUONG_DAN_CHU_DU_AN.md`. |
| Asset | Chỉ qua id → `public/assets/manifest/assets.json` (manifest v3). Nhóm `fx` hỗ trợ `frames` (sprite sheet ngang). |

## 2. Màn hình và trạng thái

| Màn / overlay | File | Trạng thái quan trọng | Ảnh |
| --- | --- | --- | --- |
| Trại Phiêu Lưu (hub) | `campView.ts`, `campCards.ts`, `campVm.ts` | mặc định; tranh Chín First Guardians; lọc 9 hệ; tìm (rỗng); chọn 1–3 bạn (thanh đội, cộng hưởng); hover thẻ; chọn vùng (3 vùng + Vết Nứt); khẩu phần; đội hình lưu sẵn; người dẫn So / Bi; nhận heo khởi đầu / chiến lợi phẩm | `01_lobby/` |
| Hồ sơ chiến binh | `adventureDialogs.ts`, `fighterVm.ts` | 5 tab (chỉ số, cây kỹ năng, loadout, trang bị, danh hiệu / kỷ niệm) | `05_animal_details_and_skills/` |
| Bản đồ khám phá | `scene/*`, `exploreView.ts` | vào khu; thẻ mẹo lần đầu; bản đồ nhỏ (M); đi bộ; nhóm quái đi tuần có huy hiệu hệ / nhãn biến thể; rương, cổng, suối, bia, đền, lữ khách, mỏ / thảo mộc; nút Thắng nhanh; Về Trại | `02_adventure_maps/` |
| Trận | `battleView.ts`, `battleVm.ts`, `battleFloaters.ts`, `battleMotion*.ts` | đầu trận; lượt ta (thẻ kỹ năng, thẻ tắt có lý do); chọn mục tiêu (nhãn Hiệu quả / Kém); bước đang chiếu (số bay, banner, rung, **animation mới**); vật phẩm; nhật ký; Phòng thủ; bảng hiệu ứng; Tự động / x2; Tuyệt kỹ (cut-in) | `03_combat/`, `09_motion_slice/` |
| Vết Nứt Umbraflux | `exploreView.ts` (`renderRift`), `riftVm.ts` | màn giữa hai tầng (đội, luật hôm nay, Lên tầng / Rời), tổng kết khi rời | `03_combat/victory/`, `06_rewards_and_progression/` |
| Tổng kết chuyến | `exploreView.ts` (`renderDone`) | Về Trại an toàn / thắng vùng / thua (gợi ý `adviceVm.ts`) | `06_rewards_and_progression/` |
| Kho đồ (dùng chung) | `areas/farm/ui/screens/inventoryScreen.ts` | mở từ HUD giữa trận, tab Phiêu lưu | `07_other_screens/` |

## 3. Bản đồ

3 vùng × 3 khu (`content/adventure/maps.json`): Rừng Thì Thầm (`map_forest_edge/deep/heart`), Núi Đá Vọng (`map_mountain_foot/mine/peak`), Tàn Tích Cổ (`map_ruins_gate/hall/sanctum`). Mỗi khu 4–5 nhóm quái: khu 1–2 có **kẻ canh khu** (elite), khu 3 có **trùm vùng**. Nhóm thường có thể mang **biến thể** (decision 039). Cổng nguyên tố chặn đường tới khi có bạn đúng hệ; cổng dịch chuyển thắp khi hạ kẻ canh / trùm. Thắng nhanh: đội vượt cấp vùng + mạnh hơn hẳn → AI đánh luôn, không hiện màn trận.

## 4. Combat (systems/combat, V2)

Theo lượt, thứ tự theo tốc độ; một hành động của người chơi chạy luôn mọi lượt địch tới khi lại tới lượt ta (`playEnemies`). Hành động: đánh thường, kỹ năng (112: 36 riêng dòng, 32 class, 12 Tuyệt kỹ, 32 của quái), Tuyệt kỹ (Nộ đầy), vật phẩm, Phòng thủ, Bỏ chạy, Tự động. 9 hệ (Kim, Thiên nhiên, Nước, Lửa, Đất, Sấm, Bóng tối, Ánh sáng, Hư Không), 25 trạng thái (độc, bỏng, ướt, đóng băng, choáng, phong ấn, diệt vong, 14 tăng / giảm chỉ số, khiên, khiêu khích, hồi phục, tự hồi sinh), 6 phản ứng (Điện Giật, Hơi Nước, Cháy Rừng, Vỡ Băng, Thanh Tẩy, Nhật Thực), đổi pha của trùm. Sự kiện trận (`BattleEvent`): `turn, use, damage, miss, heal, status, resist, cleanse, tick, reaction, guard, skip, revive, phase, ready, defeat, end`. **Animation đọc đúng các sự kiện này.**

## 5. Chiến binh / quái được khai báo và vẽ thế nào

- Chiến binh = heo (Farm) / cá (Aquarium) qua `AreaModule.roster`; id trận `<areaId>:<id>`; ảnh = `artId` của con vật (ảnh tĩnh nhìn sang trái, lật ngang cho phe ta).
- Quái: `content/adventure/enemies.json` (22), id trận `<enemyId>#n`, ảnh `props/enemy_*.png` (ảnh tĩnh, đã lật nhìn sang trái).
- Dòng Guardian (9) quyết định hệ, kỹ năng riêng, Tuyệt kỹ (`lineages.json`).
- Kỹ năng: icon `ui_<skillId>` (104 có ảnh), không có VFX riêng trước GĐ14 slice.

## 6. Asset hiện có liên quan animation

Ảnh tĩnh: 89 heo (+ ảnh ngủ / thức), cá, 22 quái, 4 nền vùng + nền trại, icon hệ / class / trạng thái / phản ứng / hành động. Sprite sheet: chỉ `fx_zzz` và 7 `fx_env_*` (môi trường). Animation trận trước slice: lắc ảnh khi mất máu, số bay, banner, rung sân (CSS). Không có Spine / skeletal / particle engine; Phaser có particle nhưng trận không dùng Phaser.

## 7. Lỗi UI/UX và cơ hội quan sát được

| # | Quan sát | Bằng chứng | Mức | Trạng thái |
| --- | --- | --- | --- | --- |
| 1 | Mọi lượt địch của một bước hiện cùng lúc (số bay của 3 kẻ địch bật một lượt), không ai cử động | `03_combat/enemy_turn/*_before.png` | P0 | **Đã sửa** (beat tuần tự) |
| 2 | Khi trúng đòn, keyframe `adventure-hit` dùng `transform` trên ảnh → ghi đè `scaleX(-1)` của phe ta, heo quay ngược mặt trong lúc rung | code `_adventure.scss` (cũ) | P1 | **Đã sửa** (tách lớp body / idle / ảnh) |
| 3 | Banner phản ứng / Tuyệt kỹ `z-index: 6` nằm dưới đơn vị (z-index = hàng, tới ~92) | code | P1 | **Đã sửa** (z-index 120) |
| 4 | Đòn kết thúc trận không kịp hiện (màn chuyển ngay về bản đồ / màn giữa tầng) | decision 039, `03_combat/victory/` | P1 | Còn mở |
| 5 | Với cài đặt "Giảm chuyển động", số bay và banner có `opacity: 0` + animation bị tắt → **không hiện chữ nào** | code `_overlays.scss` + `_adventure.scss` | P1 (truy cập) | Còn mở — đề xuất hiện tĩnh |
| 6 | Bản đồ: khi camera ở mép khu, phía trên lộ dải xanh đậm ngoài bản đồ | `02_adventure_maps/encounters/adv-025_*` | P2 | Còn mở |
| 7 | 21 trang bị trong Kho đồ vẫn icon placeholder (ô tròn màu) | `07_other_screens/*bag_over_battle*` | P2 | Đã có trong ASSET_TODO |
| 8 | Banner nhắc "xuất file lưu" che HUD trên cùng | ảnh chụp lần đầu (đã ẩn trong script) | P2 | Thiết kế có sẵn |
| 9 | Đội mạnh luôn "Thắng nhanh" → người chơi ít thấy animation trận ở vùng cũ | `02_adventure_maps/` | Thiết kế | Ghi nhận |
| 10 | Chưa có chuyển cảnh vào trận / thắng / thua, giới thiệu trùm | — | P1/P2 | Trong inventory |

## 8. Chưa xác minh được

- Trận chạm quái trên bản đồ (quái đi tuần, đường đi cố định của script không chắc chạm; đội cao cấp bị Thắng nhanh) → checklist tay `docs/animation/manual_capture_checklist.md`.
- Cut-in Tuyệt kỹ (tầng 1 Vết Nứt kết thúc trước khi ai đầy Nộ), trận trùm / kẻ canh khu, đổi pha trùm, thua trận + gợi ý, cổng / rương / suối / đền / lữ khách, Đi nhanh, nhận heo khởi đầu: chưa chụp tự động.
- Kích thước 375 px (Adventure thiết kế cho desktop 1600×900).
- Hiệu năng đo bằng công cụ: chưa có số đo FPS; animation chỉ dùng `transform` / `opacity` / `filter` trên ≤ 8 đơn vị + ≤ ~12 phần tử VFX mỗi bước.

## 9. Đề xuất ưu tiên

1. **P0 (đã làm trong slice):** beat tuần tự, idle theo body plan, attack / cast / hit / KO, VFX theo hệ, số bay đúng impact.
2. **P1:** art VFX 9 hệ (`fx_adv_<hệ>_projectile|impact`), hiện đòn kết thúc trước khi rời trận, sửa số bay khi Giảm chuyển động, overlay Umbraflux động, key pose tấn công cho 3 trùm.
3. **P2:** chuyển cảnh vào trận / thắng / thua, giới thiệu trùm, mép bản đồ.
