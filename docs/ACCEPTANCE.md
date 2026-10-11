# Nghiệm thu gameplay — GĐ13

Danh sách nghiệm thu từng Area và hệ thống chung, lấy từ `ROADMAP.md` ("Xong khi" của từng giai đoạn) và đặc tả. Mỗi mục ghi **cách kiểm** và **kết quả** (làm ở GĐ13, ngày 2026-10-11, nhánh `phase-13-integration`).
Quy ước: ✅ đã chạy và đạt · 🟡 đạt bằng máy nhưng cần người chơi thật xác nhận · ❌ chưa đạt.

Lệnh tổng: `npm run check` (typecheck, lint, guard kiến trúc, assets, ~1.367 test), `npm run test:e2e` (13 kịch bản Electron trên bản build), `npm run dist:win` (build, kiểm bản người chơi, kiểm bản cài).

## Hệ thống chung

| # | Mục | Cách kiểm | Kết quả |
|---|---|---|---|
| S1 | Save mở được từ **mọi phiên bản save trước** (v1, v7 của Sobi Farm; v8, v9, v10 thật lấy từ save dev; v11 hiện hành), giữ ví và heo, chơi tiếp 30 ngày không lỗi | `tests/unit/saveVersions.test.ts` (16 test), `tests/unit/worldSave.test.ts` | ✅ |
| S2 | Save bản mới hơn bị từ chối chứ không bị hỏng | `saveVersions.test.ts` (`SAVE_TOO_NEW`) | ✅ |
| S3 | Mô phỏng nhất quán mọi chế độ (lát 1 phút = 10 phút = nhảy một lần) | `tests/unit/advanceWorld`, `plants`, `garden`, `aquarium`, `cloud`, `liveWorld` | ✅ |
| S4 | Bù offline: 30 ngày dưới 3 giây trên thế giới cuối game | `npm run perf:catchup`: 30 ngày **~0,45 giây**, 1 ngày 16 ms, một bước 1 giây của game 0,11 ms; save 57 KB | ✅ |
| S5 | Khung hình | `tests/e2e/perf.spec.ts` (Electron, build thật): Sảnh **54 fps**, Nông trại **60 fps** (sàn 24) | ✅ trên máy dev 🟡 máy yếu hơn |
| S6 | "Không tài nguyên chết": mọi vật phẩm ≥ 2 công dụng | `npm run items:audit` (67 vật phẩm, 0 vật phẩm dưới 2 công dụng) + test chặn trong `phase11.test.ts` | ✅ |
| S7 | Tiền chỉ đổi qua một helper ghi Transaction; mọi hành động thành công phát sự kiện | `tests/unit/economy`, `actionEvents`, `invariants.fuzz` | ✅ |
| S8 | Kiến trúc: core thuần, Area không import Area | `npm run guard` (543 file) | ✅ |
| S9 | Không có mạng, Admin không vào bản cài | `verify:build`, `verify:installer` trong `dist:win` | ✅ (xem bản build bên dưới) |
| S10 | Ngôn ngữ Việt / Anh chọn trong Cài đặt, nhớ sau khi mở lại, không đụng save | `tests/unit/i18n.test.ts` (bảng chuỗi và chữ trong content: khóa, `{tham_số}`, không lẫn tiếng Việt), `tests/e2e/display.spec.ts`; lướt tay 12 màn hình của Menu bằng tiếng Anh: không còn chữ Việt | ✅ |
| S11 | Trợ năng: cỡ chữ (Vừa / Lớn / Rất lớn), màu dễ nhìn (xanh dương – cam, tương phản cao, viền đậm), tắt rung màn hình, giảm chuyển động (có từ trước) | `settings.test.ts`, `feedback.test.ts` (tắt rung chỉ bỏ rung), `display.spec.ts`; xem tay ở cỡ chữ lớn nhất | ✅ |
| S12 | Nút tắt nói lý do | Rà mã: mọi nút tắt đi qua `actionButton` / dry-run (lý do hiện bên cạnh); sửa nút khẩu phần hết hàng (thêm lý do) | ✅ |
| S13 | Cổng chất lượng xanh sau mỗi commit | `npm run check` | ✅ |

## Từng Area và giai đoạn

| GĐ / Area | "Xong khi" | Cách kiểm | Kết quả |
|---|---|---|---|
| GĐ1 Nền móng, Farm là Area | Farm chạy đủ, save cũ migrate, nội dung có schema | `worldSave`, `areaRegistry`, `content` test; S1 | ✅ |
| GĐ2 Thời gian thật | Nhất quán 1/10 phút; bù 30 ngày < 3 giây; tắt 1 ngày cho kết quả đúng | S3, S4; `tests/e2e/away.spec.ts` (bỏ nông trại 3 ngày: màn vắng nhà, heo đói, nút tới máng) | ✅ |
| GĐ3 Nhân vật và Sảnh | Chơi trọn Farm bằng nhân vật; đổi phím lưu lại; Area khóa hiện điều kiện | `tests/e2e/plaza.spec.ts` (2 kịch bản), `plaza`, `controlInput`, `settings` test | ✅ |
| GĐ4 Bản cài | Cài và chơi trên máy sạch, không mạng | `dist:win` + `verify:installer`; **máy sạch thật chưa thử** (`docs/TEST_MAY_SACH.md`) | ✅ 🟡 máy sạch |
| GĐ5 Garden | Vòng lặp chạy cả online và offline; mở đúng điều kiện | `garden`, `gardenUi`, `plants`, `production` test; `tests/e2e/garden.spec.ts` | ✅ |
| GĐ6 Gắn kết | Người mới hiểu cách chơi; mục tiêu ngắn hạn liên tục | `goals`, `orders`, `bond`, `player` test; `tests/e2e/smoke.spec.ts`; bot 40 ngày: đơn, mục tiêu, thành tích, Codex đều chạy (`tests/scripts/acceptance.test.ts`); **chủ dự án chơi ≥ 3 ngày: đã làm ở GĐ6** | ✅ 🟡 |
| GĐ7 Lai giống | Gen, trait, ẩn, đột biến, pity, phả hệ, tin đồn | `breedingSystem`, `breedingHeredity`, `breedingSim` (50.000 lần lai), `heredityVm` | ✅ |
| GĐ8 Aquarium | Cá là sinh vật chung; bể, nước, câu, cá đêm, vảy; Codex cá | `aquarium`, `aquariumUi` test; `tests/e2e/aquarium.spec.ts` | ✅ |
| GĐ9 Cloud | Hoa, Nước tinh khiết, potion, Healing Potion chữa heo/cá nguy kịch, hoa tăng đột biến | `cloud` test; bot: 100+ hoa, potion nấu được | ✅ |
| GĐ10 Adventure nền tảng | Trận theo lượt đúng luật; ≥ 12 skill; thua chỉ kiệt sức 4 giờ; 100 trận ra tỉ lệ thắng hợp lý | `combat`, `adventure`, `adventureUi` test; `npm run sim:adventure`; `tests/e2e/adventure.spec.ts` | ✅ |
| GĐ11 Adventure liên hệ thống | Loot nâng công trình và công nghệ; mọi item ≥ 2 công dụng; cân bằng 14 ngày | `phase11` test; S6; bot 60 ngày: 3 vùng xong (ngày ~19 / ~24 / ~31), đủ 12 cấp công nghệ (ngày ~35) | ✅ 🟡 người chơi thật |
| GĐ12 Thế giới động | Thời tiết nhất quán, 4 lễ hội, Thương nhân, Admin bật thử, kinh tế cân bằng | `liveWorld` test; `tests/e2e/live.spec.ts`; bot 28 ngày: lễ hội ~2–3% thu nhập | ✅ |
| Cả vòng | Farm → Garden → Aquarium → Cloud → Adventure → quay về nhà, không lỗi chặn, không số âm | `tests/scripts/acceptance.test.ts` (bot 40 ngày qua đủ Area, 9 khẳng định); `npm run sim:week -- 7 60 adventure` | ✅ |

## Phát hiện khi tích hợp (đã sửa)

1. **World Development thiếu số hạng "công trình Lv3"** (decision 013): registry luôn truyền 0, nên Adventure (cần 20) xa hơn thiết kế. Đã nối: máng (Farm), vòi tưới (Garden), bể (Aquarium), suối (Cloud) tính một điểm mỗi khi đạt cấp 3 (`AreaModule.buildingLevels`), cổng mở Area và Bảng đơn hàng dùng cùng một số. Test: `tests/unit/phase13.test.ts`.
2. **Chữ "KN" cứng trong thưởng Codex** (`goalsVm`): đưa vào bảng chuỗi (`ui.xpAmount`).
3. **Nút khẩu phần hết hàng** tắt mà không nói lý do: thêm lý do.
4. Công cụ: `i18nDump` (`npm run content:i18n`), `perf:catchup`, `dev:rich-save`.

## Việc còn mở cho chủ dự án (không chặn freeze, ghi ở PROGRESS)

- **Quyết định số: điều kiện mở Adventure** (Phát triển thế giới 20). Bot (không sưu tầm heo) mở Adventure ngày **~47**; đo lại với các ngưỡng khác: 18 → ngày 31, 16 → ngày 23, 14 → ngày 18 (Cloud mở ngày ~22). Đề xuất 16–18; chỉ là một số trong `content/adventure/area.json`.
- Chơi thử ≥ 7 ngày thật (điều kiện duyệt GĐ13) và thử bản cài trên máy sạch.
