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
- [ ] D10 bảng tổng kết trận
- [ ] E11–E13 bản đồ
- [ ] F14–F15 combat animal
- [ ] G16–G17 cây kỹ năng, vật phẩm lên cấp

## File chính đã sửa
`src/areas/adventure/ui/{battleView,battleVm,viewKit,adventureUi}.ts`, `src/areas/adventure/logic/fighters.ts` (`expShare`), `src/styles/features/_adventure.scss` (khối "The battle" + scrollbar), `src/i18n/vi.ts`, `src/i18n/en/partC.ts`.
