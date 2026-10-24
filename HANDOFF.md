# HANDOFF — adventure-big-update-1

Nhánh: `phase-14-art`. Prompt gốc: 17 mục, thứ tự A → C → B → D → E → F → G. Batch asset: `art_inbox/.batch/adventure-big-update-1/`.

## Tiến độ
- [x] A1 Bố cục trận: đồng minh trái quay phải (`.adventure-ui__face` lật), quái phải; bảng tên nhỏ trên đầu (hệ, tên, cấp, HP, MP + KN cho đồng minh, trạng thái, ý định).
- [x] A2 Dock lệnh có 3 tab Kỹ năng chính (skill `type: unique` + Tuyệt kỹ) / Kỹ năng phụ (skill class) / Vật phẩm; danh sách chỉ mở khi bấm tab (`UiState.menu`).
- [x] A3 Thanh lượt nằm trong hàng HUD (top −4.5rem), ô sáng ở đầu; FLIP trượt (`slideTurns` trong `ui/viewKit.ts`).
- [x] A4 Scrollbar mật ong trong rãnh kem (`.adventure-host ::-webkit-scrollbar`), kéo-cuộn chuột + quán tính + lăn dọc → ngang (`dragScroll`), mọi list `data-keep-scroll` / `data-drag-scroll`.
- [x] C9 Dấu ngắm (vòng + X) trên mục tiêu hợp lệ; skill toàn đội = 1 dấu lớn bao cả phe; chỉ click dấu mới ra chiêu (`battleView.ts` `marker` / `sideMarker`, `BattleActionVm.aim`).
- [x] B5 Animation mới: canvas 2 lớp (ground dưới đơn vị, air trên) + engine hạt/hình vector tự viết (`ui/fx/fxEngine.ts`), công thức 9 hệ (`ui/fx/elementFx.ts`), tween JS từng khung cho thân đơn vị (`ui/battleStage.ts`). Bỏ `battleMotionView.ts` + `_adventureMotion.scss` (CSS cũ).
- [x] B6 Vòng phép quanh người thi triển (cả quái) + âm `adv_cast` trước mỗi skill (`CIRCLE_MS` trong `motionProfiles.ts`, `MotionBeat.circle/cast`).
- [x] B7 Trúng: ngả lui + chớp trắng + nước mắt + `adv_hit`/`adv_crit`; hụt: chỉ ngả/né + bóng mờ + `adv_miss`.
- [x] B8 Vào trận: tia dịch chuyển trên từng đơn vị, nhấp nháy hiện ra + `adv_battle_start` (`ENTER_MS` trong `battleFxView.ts`).
- Âm thanh: 10 SFX tổng hợp `scripts/art/sfx.ts` (`npx tsx scripts/art/adventureSfx.ts` → `public/assets/audio/adv_*.mp3`), thêm vào `AUDIO_KEYS` + manifest; UI phát qua dep `sound` (areaOverlays → adventureUi).
- [x] D10 Bảng tổng kết: `run.report` (slice **v4**, migration `migrateAdventure3to4`), tạo ở `settleBattle`/`settleRiftFloor` (`makeReport` trong `trip.ts`), đóng bằng `closeReport`. UI `ui/reportView.ts` + `reportVm.ts`: chiếu lại đòn kết liễu → bảng (KN/xu/gems, vật phẩm, quà trùm, thanh KN chạy qua từng cấp + LEVEL UP, âm `adv_victory`/`adv_exp_fill`/`level_up`). Bot/sim đóng bảng sau mỗi trận.
- [x] E11 Bản đồ có chiều sâu (`scene/mapDepth.ts`): nền tường lan ra ngoài tối dần, cây/đá/cột lớn viền trên (sau đội) và dưới (trước đội, mờ khi đội tới gần), bóng dưới tường, bóng vật, tia nắng, bóng mây trôi, lá/đom đóm/than hồng/ma thuật bay, nước lấp lánh, vignette CSS.
- [x] E12 Quái đứng yên + thở (scale theo nhịp riêng, bóng dưới chân); quái thường hồi sinh khi đổi khu (`run.defeated = []`), trùm/kẻ canh khu hạ vĩnh viễn (`slice.beaten`).
- [x] E13 Cổng dịch chuyển: exit `lock: 'guardian'` (sau lưng trùm, khóa tới khi hạ; chặn đường đi), vùng nối vùng (Rừng→Núi→Tàn Tích, cổng về ở khu đầu vùng), ảnh `adv_portal` on/off + quầng sáng + chữ "Hạ kẻ canh khu để mở cổng"; đi vào: đội tan vào ánh sáng + chớp trắng + `adv_teleport` → khu mới hiện dần từ trắng. Quà trùm (`gift` trong maps.json) vào bảng tổng kết.
- [x] F14 Combat animal chỉ còn 22 loài (danh sách cố định, `lineages.json` bỏ `families`): heo KNIGHT, SAMURAI, ROBOT, HEDGEHOG (Kim) · NINJA, VAMPIRE (Bóng tối) · PIRATE, POSEIDON (Nước) · THOR, TIGER (Sấm) · VALKYRIE, UNICORN (Ánh sáng) · DRAGON, PHOENIX (Lửa) · TURTLE, CRYSTAL (Đất) · GALAXY, MYTHICAL (Hư Không) · BOAR, SUNFLOWER (Thiên nhiên); cá fish_betta, fish_pufferfish. Cờ `fighter` ở `content/farm/species.json` + `content/aquarium/fish.json`; Farm `setPurpose` ADVENTURE chặn giống thường (`NOT_A_FIGHTER`); Admin có ô "Combat animal". Bot mua chiến binh rẻ nhất chưa có, giữ 1 chuồng trống.
- [x] F15 Thanh cấp: huy hiệu "Lv N" trên ảnh thẻ ở Trại + thanh KN có số; trong trận bảng tên có "Cấp N" + thanh KN mỏng, đội dưới trái có Lv.
- [ ] G16–G17 cây kỹ năng, vật phẩm lên cấp

## File chính đã sửa
`src/areas/adventure/ui/{battleView,battleVm,viewKit,adventureUi}.ts`, `src/areas/adventure/logic/fighters.ts` (`expShare`), `src/styles/features/_adventure.scss` (khối "The battle" + scrollbar), `src/i18n/vi.ts`, `src/i18n/en/partC.ts`.
