# HANDOFF — adventure-big-update-1

Nhánh `phase-14-art`. Đủ 17 mục (A → C → B → D → E → F → G), `npm run check` xanh (1.497 test). Chi tiết quyết định: `docs/decisions/041-adventure-big-update-1.md`. Batch asset: `art_inbox/.batch/adventure-big-update-1/` (README, assets.csv, prompts.md).

## Đã xong (theo số mục)
1. Bố cục trận: ta trái quay phải, quái phải; bảng tên nhỏ — `ui/battleField.ts`, `_adventure.scss` khối "The battle".
2. Dock 3 tab Kỹ năng chính / phụ / Vật phẩm, chỉ mở khi bấm — `ui/battleDock.ts`, `battleVm.ts` (`tab`, `aim`).
3. Thanh lượt trong hàng HUD, FLIP trượt vào ô sáng — `battleField.ts` `turnBar`, `viewKit.ts` `slideTurns`.
4. Scrollbar mật ong + kéo-cuộn chuột (quán tính) + lăn dọc→ngang — `viewKit.ts` `dragScroll`, `data-keep-scroll` / `data-drag-scroll`.
5. Animation canvas 2 lớp + engine hạt tự viết, 9 hệ — `ui/battleStage.ts`, `battlePose.ts`, `battleCues.ts`, `ui/fx/*`.
6. Vòng phép + âm niệm phép trước mỗi skill (cả quái) — `motionProfiles.ts` `CIRCLE_MS`, `battleMotion.ts`.
7. Trúng: ngả lui + chớp + nước mắt (+ ảnh `<art>_hurt` nếu có); hụt: chỉ né — `battlePose.ts`, `fx/supportFx.ts`.
8. Vào trận: tia dịch chuyển + nhấp nháy + âm — `battleFxView.ts` `ENTER_MS`, `fx/castFx.ts` `teleportIn`.
9. Dấu ngắm vòng+X, dấu lớn cho cả phe, click dấu mới ra chiêu — `battleField.ts` `marker`/`sideMarker`, `battleCommand.ts`.
10. Bảng tổng kết: chiếu lại đòn cuối, vật phẩm, quà trùm, thanh KN chạy + LEVEL UP — `ui/reportView.ts`, `reportVm.ts`, `run.report` (slice v4), `closeReport`.
11. Bản đồ có chiều sâu — `scene/mapDepth.ts`, `mapDepthKit.ts`, vignette CSS.
12. Quái đứng yên + thở; quái thường hồi sinh khi đổi khu; trùm hạ vĩnh viễn (`slice.beaten`) — `AdventureScene.ts`, `logic/actions/explore.ts`, `battle.ts`.
13. Cổng dịch chuyển khóa sau trùm, vùng nối vùng, hiệu ứng dịch chuyển; quà trùm trên bảng — `content/adventure/maps.json` (`lock`, `gift`), `trip.ts` `exitOpen`, `mapView.ts`, `walker.ts` `setWarp`.
14. 22 combat animal (cờ `fighter`, `lineages.json` bỏ `families`) — danh sách ở decision 041.
15. Thanh cấp: huy hiệu Lv + thanh KN có số ở Trại, Cấp + KN trong trận — `campCards.ts`, `battleField.ts`, `battleDock.ts`.
16. Cây kỹ năng dạng đồ thị — `ui/sheetTree.ts`.
17. Lên cấp bằng vật phẩm: Cửa hàng & Lò Rèn + sách KN — `content/adventure/workshop.json`, `logic/actions/workshop.ts`, `ui/workshopView.ts`, `workshopVm.ts`.

## Chưa làm / cần biết
- Chưa chạy e2e (`tests/e2e`) và build desktop. Script chụp ảnh `scripts/capture/adventureShots.ts` còn chọn class cũ (`.adventure-ui__bleft`, `.adventure-vfx`) — cần sửa nếu dùng lại.
- Giá sách / cửa hàng / Lò Rèn chưa cân bằng bằng bot (bot chưa dùng sách).
- Asset thật đang chờ chủ dự án (batch ở trên); game chạy đủ khi chưa có.

## Prompt tiếp tục (dán vào phiên mới nếu cần)
```
Game Sobi World (Electron + Vite + TypeScript + Phaser), project D:\Local\Sobi_World, nhánh phase-14-art. Phần Sobi Adventure vừa xong "adventure-big-update-1" (17 mục, decision 041). Đọc HANDOFF.md (gốc project) rồi docs/AGENT_RULES.md; chỉ đọc thêm file cần thiết, làm tiếp luôn, không lập kế hoạch lại.
Đã chốt (không đổi): trận DOM + 2 canvas (battleStage/battlePose/battleCues, ui/fx/*), vòng phép trước mỗi skill, dấu ngắm click-để-ra-chiêu, bảng tổng kết run.report (slice v4), trùm hạ vĩnh viễn slice.beaten, cổng khóa sau trùm exits[].lock, 22 combat animal theo decision 041, workshop.json cho sách KN / Cửa hàng / Lò Rèn.
Việc còn lại: (1) sửa scripts/capture/adventureShots.ts theo class mới; (2) chạy e2e + build desktop; (3) cân giá sách/cửa hàng bằng bot; (4) khi chủ dự án có asset trong art_inbox/.batch/adventure-big-update-1 thì đặt file + dòng manifest theo README ở đó, chạy npm run assets:check.
npm run check phải xanh trước khi commit.
```
