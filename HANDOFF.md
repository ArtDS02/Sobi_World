# HANDOFF — adventure-big-update-1

Nhánh: `phase-14-art`. Prompt gốc: 17 mục, thứ tự A → C → B → D → E → F → G. Batch asset: `art_inbox/.batch/adventure-big-update-1/`.

## Tiến độ
- [x] A1 Bố cục trận: đồng minh trái quay phải (`.adventure-ui__face` lật), quái phải; bảng tên nhỏ trên đầu (hệ, tên, cấp, HP, MP + KN cho đồng minh, trạng thái, ý định).
- [x] A2 Dock lệnh có 3 tab Kỹ năng chính (skill `type: unique` + Tuyệt kỹ) / Kỹ năng phụ (skill class) / Vật phẩm; danh sách chỉ mở khi bấm tab (`UiState.menu`).
- [x] A3 Thanh lượt nằm trong hàng HUD (top −4.5rem), ô sáng ở đầu; FLIP trượt (`slideTurns` trong `ui/viewKit.ts`).
- [x] A4 Scrollbar mật ong trong rãnh kem (`.adventure-host ::-webkit-scrollbar`), kéo-cuộn chuột + quán tính + lăn dọc → ngang (`dragScroll`), mọi list `data-keep-scroll` / `data-drag-scroll`.
- [x] C9 Dấu ngắm (vòng + X) trên mục tiêu hợp lệ; skill toàn đội = 1 dấu lớn bao cả phe; chỉ click dấu mới ra chiêu (`battleView.ts` `marker` / `sideMarker`, `BattleActionVm.aim`).
- [ ] B5–B8 animation canvas
- [ ] D10 bảng tổng kết trận
- [ ] E11–E13 bản đồ
- [ ] F14–F15 combat animal
- [ ] G16–G17 cây kỹ năng, vật phẩm lên cấp

## File chính đã sửa
`src/areas/adventure/ui/{battleView,battleVm,viewKit,adventureUi}.ts`, `src/areas/adventure/logic/fighters.ts` (`expShare`), `src/styles/features/_adventure.scss` (khối "The battle" + scrollbar), `src/i18n/vi.ts`, `src/i18n/en/partC.ts`.
