# STATE — forest-diorama (6 map vùng Rừng sang Diorama 2.5D, chạy trong game)
Nhánh: map-diorama-forest (tách từ new-ideas/update-3d-adventure @ 2ad31ee6)   Commit xanh gần nhất: xem Xong
Mốc hiện tại: M4 — Thác Rêu   Vòng: 2/3
Đang làm: coder falls (cùng agent) vòng 2 theo 5 lỗi reviewer v1 (7,0)
Brief đang chạy: xem mục Brief cuối file
Xong: M0 ✅ 237df342 | M2 ✅ 3be15092 (kèm ảnh chr_so_down_idle đã sửa) | M1 ✅ (commit sau) check xanh 2127/2127 | M3a ✅ 3602a56f module diorama ở src/areas/adventure/scene/diorama, blockerPlan+test, lab 6 map, --map | M3a-perf+M3b ✅ c0522d2b check xanh 2166, e2e adventure 2/2 | M3c ✅ 45a87b5a diorama trong game, cài đặt, quality.ts; check xanh 2182, build xanh | M3 chơi thử ✅ (commit này) gameForest.ts --battle --chest --exit --reload: diorama = classic, đều PASS (rương xác nhận bằng mắt) | edge v2 code ✅ bc56ad3f | M3 Bìa Rừng ✅ ecdb7eba reviewer 9,0, check xanh 2182 | deep v1 code ✅ 38309c09 | M4 deep ✅ b90208ee reviewer 8,0 | M4 heart ✅ 28a5b489 reviewer 8,0 | M4 hollow ✅ 85c27eb9 reviewer 8,0 | falls v1 code ✅ (commit này)
Còn lại: M4 falls → marsh → vòng đánh bóng chung → M5
Điểm reviewer: edge v1 6,5 ✗ | edge v2 7,5 ✗ | edge v3 9,0 ✓ (2/2/1,5/2/2) | deep v1 7,5 ✗ | deep v2 8,0 ✓ | heart v1 8,0 ✓ | hollow v1 8,0 ✓ | falls v1 7,0 ✗ (1/1,5/1,5/1/2)   FPS edge v3 (máy rảnh): RTX 2060 Đẹp 144×6; AMD iGPU Nhẹ 131/144/135/134/117/118
Lỗi đang mở: e2e đỏ CÓ SẴN (đã xác nhận ở 2ad31ee6: aquarium:63, away:41, garden:73 treo 2,6 h, live:25; species:103 cùng khẳng định schemaVersion 11 cũ — save đã 13+; perf plaza 16 FPS môi trường) — ngoài phạm vi, không thuộc npm run check, báo chủ dự án. SwiftShader 2–4 FPS → tự lùi 2D (chỉ test đơn vị, chưa thấy trong game). Diorama dựng lại (đứng ~1 s) khi mở cổng/thắp đố/đổi đội giữa map. warp() không có hình riêng (flash che). Máy đo: dGPU là RTX 2060, headless --gpu mặc định = AMD iGPU. Báo chủ dự án: layout.json 15 chỗ đặt decor (141e330e).
Chờ chủ dự án: —
Ghi chú: `package-lock.json` (sửa) và `studio/` (chưa track) có sẵn trước phiên, không thuộc việc này — KHÔNG commit.

## Brief M1
(coder sonnet) Sửa hết đỏ sẵn của `npm run check`, không đổi gameplay/số cân bằng/save:
1. guard: src/areas/adventure/scene/AdventureScene.ts 311 dòng > 300 → tách phần hợp lý sang module mới trong cùng thư mục, không đổi hành vi.
2. tests/unit/assets.test.ts:128 (A4 decor cắt sai cỡ) và tests/unit/decor.test.ts:74 (DECOR_HAY_BALE thiếu chỗ đặt [0,1,2]) — tìm nguyên nhân thật; sửa dữ liệu layout/asset nếu đó là lỗi dữ liệu, không nới test bừa.
3. tests/scripts/assetsCheck.test.ts: beforeEach chép cả public/assets 561 MB → chỉ chép phần test cần (manifest + thư mục liên quan) hoặc fixture nhỏ; giữ nguyên ý nghĩa test.
4. tests/unit/phase11.test.ts:248 quá giờ khi chạy cả bộ → timeout riêng cho test đó (không đổi số cân bằng trong content/; nếu buộc phải đổi → DỪNG, báo).
5. public/assets/props/chr_so_down_idle.png: `git show 3b10d833:public/assets/props/chr_so_down_idle.png` để khôi phục.
Không commit. Báo ≤ 25 dòng.

## Brief M2 (chạy song song M1 — chỉ ghi docs)
(designer opus) Viết: docs/decisions/064-diorama-forest.md (đi tiếp Diorama theo cổng G0 chủ dự án đã quyết, phạm vi 6 map Rừng, lý do, ngoài phạm vi);
docs/maps/MAP_SCENE_STANDARD.md (hợp đồng cảnh, bảng chất liệu vùng Rừng, camera, ánh sáng, thước 10 điểm §2.5 nghiêm như SKILL_ANIMATION_STANDARD §7, ngưỡng > 7,5, quy trình chụp/chấm);
docs/agent-loop/forest-diorama/design.md (kiến trúc: renderer dùng chung đặt ở đâu theo ARCHITECTURE + guard, cách gắn AdventureScene, cài đặt Diorama/2D + Đẹp/Nhẹ + tự rơi Nhẹ; hợp đồng cảnh 6 map; danh sách kiểm đánh số).

## Brief M3a (coder sonnet)
Đọc design.md §A1, A2, A5 + MAP_SCENE_STANDARD.md. Chuyển tools/admin/diorama/* (trừ dioramaLab.ts, diorama.css) sang src/areas/adventure/scene/diorama/
theo bảng A1 (world.ts → dioramaView.ts; creatures.ts → foes.ts; dress tách 2; party bỏ walk; walk.ts xóa; thêm contracts.ts đủ 6 map theo §C,
quality.ts để M3c). field.ts: ký tự w/c, ô chặn từ blockedTiles, uốn nhiễu ≤0,25 ô. blockerPlan thuần + test (6 map: 100 % ô chặn có vật, 0 gốc trên ô đi được).
Asset qua resolver art(id). Lab: chọn 6 map, labDriver đi bằng walkableOf+stepCharacter, window.diorama giữ; scripts/maps/* thêm --map <id>|all.
Chưa gắn vào AdventureScene (M3b/M3c). Mỗi file ≤ 300 dòng. Tự kiểm typecheck/lint/guard + test mới. Không commit. Báo ≤ 25 dòng.

## Bài học sự cố (2026-11-19)
- Không nối junction/symlink node_modules vào worktree tạm: xóa worktree đã xóa luôn node_modules thật. Brief sau: worktree tạm dùng `npm ci` riêng hoặc không dùng worktree.
- Báo cáo vòng 2 của coder M3a bị mất (handback lần 2 bị từ chối) — đo FPS lại bằng checker.

## Brief M3a-perf+mép (coder A, sonnet mới)
FPS Bìa Rừng Đẹp 31–45 (mục tiêu ≥58 cả 6 điểm, headless dioramaShots --gpu), Nhẹ 42–70. Tìm nguyên nhân (renderer.info draw calls/tam giác; 1409 cây ngoài mép, cây 3 lớp, bóng, fog pass, cấp phát mỗi khung) và sửa (instancing/gộp, cắt cây ngoài khung, LOD...).
Mép: ranh giới vật liệu giữa hai ô ĐI ĐƯỢC (cỏ/đất/rêu) phải mềm, uốn như G0 (không ép 0,25); ranh giới đi được/chặn (nước, rừng, vách): bo góc, không bậc thang, vẫn lệch ≤0,25 ô (test). Ảnh day_3 cho thấy bậc thang vuông.
Cấm junction/symlink node_modules vào worktree. Chỉ sửa diorama/, tools/admin/diorama, scripts/maps, tests/unit/dioramaBlockers.test.ts.

## Brief M3b (coder B, sonnet mới)
Theo design.md §A4: scene/mapRenderer.ts (interface), scene/classicRenderer.ts bọc code 2D hiện có (không đổi pixel), coverUnder thuần + test, updateFocus dùng renderer.chestHint, walker.followerSpots(). Chỉ sửa src/areas/adventure/scene/* NGOÀI diorama/ + test mới. Không đổi luật/save.

## Brief M3c (coder sonnet mới)
design.md §A3, A4, A6, B. diorama/dioramaRenderer.ts implements MapRenderer (chép texture sang Phaser CanvasTexture, depth −1000, không rAF riêng);
createRenderer chọn Diorama khi mapView=diorama + zone_forest + có contract; đồng bộ groups/chests/gates/followers/leader/corruption/sky; nhãn Phaser qua screenOf;
hide/show khi vào/ra trận (sửa showBackdrop); dựng bất đồng bộ — Walker đứng tới khi ready, >6 s/lỗi/mất context → Classic; dispose + disposeKit khi shutdown.
Cài đặt mapView/mapQuality trong settings.json (optional, không đụng save), UI displaySettings, i18n vi+en; quality.ts (chuỗi GPU SwiftShader/llvmpipe → 2D luôn; đo FPS → Nhẹ → 2D) + test.
Camera ~34 ô ngang. Kiểm: check + chạy game thật vào Bìa Rừng (Playwright), ảnh chụp.

## Brief chụp bằng chứng (checker haiku) — dùng lại cho mỗi map, đổi <map>
vite 5198 (lab) → ANIM_GPU=high: dioramaShots --map <map> --gpu --out art_inbox/diorama_shots/m3/<map> (day,golden,night);
denseSpots --map <map> → dioramaShots --spots <...> --times day --out .../dense; dioramaWalk --map <map> --gpu --out .../ (giữ ~8 khung cách đều);
dioramaProfile --gpu --quality full (ANIM_GPU=high) + --quality light (ANIM_GPU=low). Báo đường dẫn + FPS.

## Brief Bìa Rừng vòng 2 (coder sonnet mới) — 5 lỗi reviewer v1 (6,5)
1. Cao nguyên + vách (adv_map_forest_edge_cliff/_end_l/_r, elevation thật, vách cao rõ) + bậc đá ở (44–46, 9–12) + Sồi cổ thụ prop_adv_lm_f1 (46,6) to ≥ 1/8 khung, thấy từ điểm duyệt 4 (chỉnh điểm duyệt nếu cần).
2. Cổng Đông: gate_f1_bramble / exit art đọc được, điểm duyệt 5 nhìn thẳng vào.
3. Chỗ rậm: bỏ vũng tối tròn dưới chân đội (khoét + bóng), đội không chồng dọc.
4. Gió tán lá thấy được giữa 2 khung liên tiếp; lá rơi / phấn hoa.
5. Camera in-game: đội trong 60 % giữa khung ở Start; quái trung lập không đè đầu đội.

## Brief Bìa Rừng vòng 3 (coder OPUS mới) — reviewer v2 7,5
1. Cổng Đông (61,20) khi đóng: đọc rõ là bụi gai chặn (exit_bramble / gate_f1_bramble của kit, dây gai, viền đỏ); lab có nút cổng đóng/mở; điểm duyệt 5 chụp ở trạng thái đóng.
2. Gió chứng minh được: dioramaWalk thêm đoạn đứng yên (camera đứng) ≥ 3 s; biên độ lay theo lớp thấy được giữa 2 khung 100 ms, không "thạch".
3. Đội luôn trên cùng: quái trung lập + thú đồng đội không đè đầu trưởng nhóm (thứ tự vẽ / đẩy ra).
4. Đêm: đất giữ nâu ấm tối, không xám xanh.
5. Cầu: trụ + bóng dưới cầu bằng code.

## Brief mẫu M4 (coder sonnet; thay <map>, <mục C n>)
Hoàn thiện hợp đồng design.md §C <n> cho <map>: vật mốc + bậc/cao nguyên, điểm nhấn riêng (thay TODO(M4) trong contracts/dress), PHẢI THẤY / KHÔNG ĐƯỢC, điểm duyệt nhìn đúng vật,
cổng đóng đọc là vật chặn, đội luôn thấy ở chỗ rậm (denseSpots --map <map>). Không thấp hơn Bìa Rừng 9,0 (ảnh art_inbox/diorama_shots/m3r3/map_forest_edge).
Không sửa luật/save/content; không phá Bìa Rừng (chụp lại edge day_2, day_4 để so). FPS RTX Đẹp ≥60, iGPU Nhẹ ≥30. Tự chụp vào art_inbox/diorama_shots/m4/<map>/ (shots 3 giờ, dense, walk có đoạn tĩnh, 2 profile).
- Chỉ đạo tự sửa test: luôn chạy `npm run typecheck` trước commit (2 lần để sót tham số timeout cũ: assetsCheck, breeding).
