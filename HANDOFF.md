# HANDOFF — Sobi Studio (decision 051): U0 xong, cổng U1 và cổng VFX hẹp đều KHÔNG ĐẠT, chờ chủ dự án (2026-11-07)

Nhánh `phase-14-unity-studio`. Trạng thái chi tiết: `docs/studio/STATUS.md` (đọc trước). Cách dùng công cụ:
`docs/studio/RECIPE_GUIDE.md`. Nhật ký: `docs/PROGRESS.md` mục 2026-11-07 đầu tiên.

## 1. Đang ở đâu
- **U0 xong**: Unity 6000.6.8f1 (Personal hoạt động, batchmode không cần chủ dự án), `studio/` + `npm run studio`
  (validate / build / compare / schema / status), renderer SDF + toon tự viết, QA, nhập manifest, chụp trong game
  (`scripts/studio/shots.ts`, Electron offscreen — chạy được khi pane trình duyệt ẩn; cần dev server `sandbox` cổng 5181).
- **U1 không đạt sau 2 vòng chỉnh** (agent tự chấm trung thực: không đẹp hơn bản cũ, không đáng đổi cả game). Theo
  luật §7 / §10.1 **dừng hướng "tạo lại tất cả"**. Game giữ nguyên art cũ (không ảnh Studio nào trong `public/assets`).
- Chủ dự án chọn thử **phương án hẹp VFX**: 3 hiệu ứng (lửa, tia nước, vệt chém) với nét cọ + xếp lớp 2D, 2 vòng chỉnh → **cũng không đạt**, không nhập vào game. Agent đề nghị bỏ Studio cho việc tạo hình.
- Ảnh cho chủ dự án: `docs/studio/u1/` (cũ trái, mới phải; `vfx_r2_*` là cổng VFX).

## 2. Session sau làm gì
- **Không làm U2–U10 và không làm thêm VFX Studio** khi chủ dự án chưa trả lời đề nghị ở cuối `docs/studio/STATUS.md`.
- Phương án hẹp VFX đã thử (nét cọ `stroke`, xếp lớp 2D; recipe `studio/Recipes/fx/`). Nếu sau này vẫn thử lại: giữ số khung sheet cũ (`battle_fx.json` gọi khung theo chỉ số, mặc định 85 ms/khung).

## 3. Lưu ý kỹ thuật
- `sandbox-anim` trong `.claude/launch.json` trỏ thư mục của máy khác (`C:\Users\ToraTech`) → lỗi EPERM; dùng `sandbox`.
- Máy chậm: 12 test chỉ lỗi vì quá thời gian (assetsCheck, phase11, breeding, simulation); chạy riêng từng file để phân biệt.
- Sửa manifest bằng `scripts/studio/manifest.ts` (sửa văn bản một entry); **đừng** JSON.stringify + prettier cả file
  (prettier giữ object đã xuống dòng → diff 150+ dòng).
- Unity: project phải đóng trong Editor khi chạy batchmode; `-nographics` không render được (cần GPU).

---

# (Lịch sử) HANDOFF — animation sinh vật: tranh vẽ tay cho chuyển động (2026-11-06)

> **2026-11-07 — ĐỔI HƯỚNG:** chủ dự án duyệt Sobi Studio (Unity tạo lại toàn bộ asset + animation): decision 051,
> `docs/UNITY_STUDIO_PLAN.md`. Làm trên nhánh `phase-14-unity-studio`; session mới làm theo §11 của plan. Các batch
> Gemini ở mục 4 dưới đây **dừng hẳn**. Nội dung bên dưới là lịch sử của hướng cũ (tag `pre-unity-studio`), chỉ tham
> khảo: runtime rig, clip và cách soi khung vẫn dùng được.

Bàn giao giữa hai phiên agent. Nhánh `phase-14-art`. Commit cuối đã có: `1910e53` (khung di chuyển Ưng / Betta, làm mượt
chuyển tranh, windup Hộ Pháp W2). Nguồn sự thật vẫn theo CLAUDE.md; file này chỉ nói đang ở đâu và làm tiếp thế nào.

## 1. Chủ dự án đã quyết (không đổi nếu chưa hỏi)

- Hướng **pose to pose trên 6 key pose đã duyệt** (decision 050 bổ sung (5)). Không đổi hướng nếu chủ dự án chưa đồng ý.
- **Heo Thần Thoại và Hộ Pháp Cổ Đại giữ di chuyển như trước** (không tranh di chuyển; vẽ chân bằng AI quá khó). Mọi con đi
  4 chân / 2 chân khác cũng giữ như cũ. Sheet P1–P3 / G1–G2 của `rig-03-move` bỏ, không dùng.
- Tranh vẽ tay cho chuyển động chỉ dùng cho: **bay / bơi trong trận** (Ưng, Betta đã có; Chim Sẻ Sấm, Cá Nóc đang chờ ảnh),
  **mọi sinh vật Aquarium (30 loài)** và **chim mây ở Sobi Cloud**.
- Windup (lấy đà trước đòn) chỉ thử 2 con (Heo Thần Thoại, Hộ Pháp), đã commit; chủ dự án chưa chấm trong Xưởng rig.

## 2. Luật bắt buộc của chủ dự án (giữ nguyên lời)

- Mọi thay đổi chuyển động phải đặt cạnh key pose / tranh đã duyệt và soi ở độ phân giải đầy đủ trước khi báo xong. Không vẽ gì
  đè lên mặt hay bộ phận. Không báo "đạt" khi chưa so khung với tranh.
- Asset nào cần chủ dự án render thì tạo hint và PROMPT theo quy tắc `.batch` (`art.py prep`), và hỏi trước khi tạo batch lớn.
- `tools/admin/rigLab.ts` / `rigLab.css` là của chủ dự án: chỉ sửa đúng chỗ cần, hỏi trước khi commit phần không phải của mình.
  Khi commit chỉ `git add` đúng đường dẫn của mình.
- Không dùng `git stash` khi server admin đang chạy. `npm run check` xanh trước mỗi commit. Trả lời tiếng Việt, comment code
  tiếng Anh. Báo cáo trung thực theo AGENT_RULES §7: đã kiểm gì, kiểm bằng cách nào, chưa kiểm gì.
- Server admin (`npm run admin`, cổng 5175) chạy cùng lúc có thể làm 2 test chậm quá thời gian (`assetsCheck`, `phase11`):
  chạy riêng 2 file đó để phân biệt, hoặc xin tắt server.

## 3. Phần làm trong phiên 2026-11-06 (đã commit `d8c50f0`, `npm run check` xanh: 140 file, 1801 test)

| Đường dẫn | Nội dung |
|---|---|
| `tools/admin/rigLab.ts` | Sửa 1 dòng: clip lặp không bị phát lại từ đầu sau ~2,4 vòng (khoá phát giữ nguyên cả lượt) |
| `src/systems/animation/poseFade.ts`, `index.ts` | `loopFrameAt(phase, fade)` + `LOOP_FRAME_ORDER` / `LoopFrame`: chọn 1 trong 3 tranh, vòng 1 → 2 → 3 → 2, hoà smoothstep |
| `src/areas/aquarium/scene/fishBody.ts` | Tranh vẽ tay `<art>_swim1..3`: dải thứ hai hoà tranh kế; uốn code ×`DRAWN_BEND` (0,3); `pose(..., swim=false)` hiện tranh gốc |
| `src/areas/aquarium/scene/swimStyles.ts` | `swimFrameAt`, `SWIM_FRAME_FADE`, `DRAWN_BEND` |
| `src/areas/aquarium/scene/AquariumScene.ts`, `fishSwim.ts` | Gọi `useFramesOf(art)` (constructor, đổi loài, texture tới muộn); `still()` hiện tranh gốc |
| `src/areas/cloud/scene/cloudBird.ts`, `cloudView.ts`, `logic/art.ts` | Chim mây vỗ cánh bằng `prop_cloud_bird_fly1..3` (lơ lửng 2,2 nhịp/s, bay 4,5), ảnh thứ hai hoà tranh kế |
| `public/assets/props/fish_betta_swim{1,2,3}.png` + 3 dòng manifest sau `fish_betta` | Betta Aquarium (từ khung trận, khớp + chỉnh màu) |
| `tests/unit/aquariumSwim.test.ts` | Test vòng tranh, quay vòng, đủ 3 tranh cùng cỡ trong manifest |
| `docs/PROGRESS.md` | Nhật ký 2026-11-06 (3 mục mới ở đầu) |
| `docs/animation/rig/requests/rig-04-move/`, `rig-05-aquarium-move/` | Bản có git của 2 batch (PROMPT.md, batch.json, sơ đồ) |
| `HANDOFF.md` | File này |

## 4. Batch đang chờ chủ dự án render (`art_inbox/` bị .gitignore, nằm trên đĩa)

- `art_inbox/.batch/rig-04-move/` — 2 sheet 1×4 (dạng M3 / M4 đã thành công): **S1** Chim Sẻ Sấm (bay), **F1** Cá Nóc (bơi).
  Asset: `cal_<art>_idle_mv`, `cb_<art>_move1..3`.
- `art_inbox/.batch/rig-05-aquarium-move/` — 29 sheet 1×4: **A01–A28** (28 loài Aquarium, trừ Betta đã xong và Cá Nóc lấy
  từ F1), **C1** chim mây. Asset: `cal_<art>_idle_mv`, `<art>_mv1..3` (chim: `prop_cloud_bird_mv1..3`). Đã đề nghị render
  thử trước A01 Cá Vàng, A11 Cá Trăng, A23 Sứa, A26 Đuối, C1 Chim mây; kiểm xong mới làm hết.
- `art.py status` để xem sheet nào đã có ảnh. Ảnh chưa có thì ghi "chưa có", không báo xong.
- **Trạng thái 2026-11-07**: có ảnh S1, F1 (`F1_only up.png` = sheet 1×4, `F1_only_down.png` = 1 con lẻ), A01–A09. Chưa có
  A10–A28, C1. Chủ dự án **dừng render** vì chất lượng tệ; kết quả kiểm + đánh giá ở `docs/PROGRESS.md` mục 2026-11-07.
  Chưa cắt / ghép gì. **Không tạo batch mới, không làm tiếp 5b cho cá** cho tới khi chủ dự án chọn hướng (sheet vẽ lại
  nguyên con lệch nhận diện giữa các khung; chim thì dùng được).
- Python trên máy là 3.14 chưa có numpy / Pillow → `art.py` và `art_inbox/.tools/anim/*.py` không chạy. Xin phép rồi
  `py -m pip install numpy pillow` (lệnh là `py`, không phải `python`).

## 5. Cách ghép khi ảnh về

Script phân tích ở `art_inbox/.tools/anim/` (không vào git; chạy bằng `python` / `npx tsx` với đường dẫn tuyệt đối).

### 5a. Trận đấu (rig-04: Chim Sẻ Sấm, Cá Nóc)
1. `python .claude/skills/image-to-prompt/scripts/art.py cut rig-04-move` rồi `check`. Xem từng candidate bằng mắt.
2. Bỏ mảnh vụn / vạch ô: `keepMain.py <asset>...` (giữ blob ≥ 3 % blob lớn nhất). Dấu ✦ của Gemini đè lên tranh:
   `sparkle.py find|fix` (gỡ trộn bằng độ trong đo trên nền trơn của sheet cùng cỡ). Bản gốc cất `raw/`.
3. Đặt lên canvas key pose 512 (đáy tâm (256, 492)) **theo đầu / mắt, không theo khung bao**: chim → `placeFrames.py <art> head
   <s> <out> dx,dy ×3` (thêm hộp đầu của chim sẻ vào `HEAD`, đo trên `cb_<art>_idle.png`); cá → chế độ `eye`
   (`eyeSnoutLib.py`, tỉ lệ theo khoảng mắt–mõm). Cỡ đo bằng khớp mẫu (`headScale.py`, `featScale.py`).
   Dán bằng `alpha_composite` trên canvas đệm (paste có mask làm viền tối).
4. Nếu tranh không vừa canvas khi đầu đứng yên (Ưng): lưu lệch + ghi `asset/rigs/<art>/pose_offsets.json` (`skin.offsets`).
5. Cài `public/assets/props/combat/cb_<art>_move{1,2,3}.png`, thêm dòng manifest sau dòng `_victory` / `_windup` của con đó.
   `npm run rig:pose -- <art>`, `npm run rig:parts -- <art>` (MỘT con mỗi lần, chạy riêng — gộp chuỗi từng lỗi khoá file),
   `npx tsx scripts/rig/fmt.ts`. `poseRig.py` đã xếp chim sẻ = bay, cá nóc = bơi (`LOCOMOTION`).
6. Sửa danh sách con có khung di chuyển trong `tests/unit/animationRig.test.ts` (test "approved move drawings").
7. Soi: `fadeSnap.ts <rig> move <holdMs> <cửa sổ ms>` + `fadeDraw.py <rig> move <scale> <out.png>` (mô phỏng 60 fps như game,
   hoà như `skinView`); đặt cạnh tranh idle đã duyệt ở độ phân giải đầy đủ.
8. Cá Nóc cho Aquarium: `aqFrames.py fish_pufferfish <out> 12` (khớp tranh idle trận → tranh Aquarium, áp cùng phép cho 3 khung,
   nới 12 px trên + dưới, chỉnh màu LAB) → `public/assets/props/fish_pufferfish_swim{1,2,3}.png` + manifest sau `fish_pufferfish`.

### 5b. Aquarium (rig-05, A01–A28)
1. `art.py cut rig-05-aquarium-move` (trim uniform, anchor center), `check`, xem bằng mắt (cùng con, cùng hướng, không phồng/xẹp).
2. Đo cỡ + vị trí bằng ô `cal_<art>_idle_mv` so với tranh Aquarium đang dùng `public/assets/props/<art>.png` (192×120,
   cùng bức vẽ với `art_inbox/<art>.png`), áp cùng phép cho 3 khung (như `aqFrames.py`, chỉ khác nguồn là candidate thay vì
   `cb_*`). Ba khung **cùng một canvas**, rộng = tranh gốc, nới đều trên + dưới nếu vây vượt (tâm không đổi). Chỉnh màu nếu lệch.
3. Cài `public/assets/props/<art>_swim{1,2,3}.png` + 3 dòng manifest ngay sau dòng `<art>`. `FishBody` tự nhận khi đủ 3 tranh.
4. **Còn phải làm khi có tranh**: Sứa / Bạch Tuộc / Rùa có nhịp co bóp / chèo riêng (`kindFrame` + `pulseAt` trong
   `swimStyles.ts`), nhưng tranh đang chạy theo nhịp vẫy đuôi (`phase`) → cho tranh theo nhịp của loài (vd. truyền pha của
   pulse cho `swimFrameAt`). Đuối (`bend: 'wing'`) và Cá Heo cũng nên xem lại độ uốn code khi có tranh.

### 5c. Chim mây (C1)
`prop_cloud_bird_fly{1,2,3}.png` cùng canvas với `prop_cloud_bird.png` (180×150, nguồn lớn `art_inbox/.candidates/prop_cloud_bird_a.png`
460×377), **quay trái** như tranh gốc, đặt theo đầu. Thêm 3 dòng manifest (section props) sau `prop_cloud_bird`. `CloudBird` tự nhận.

## 6. Kiểm trong game

- Sandbox có đủ 30 loài cá: `.claude/launch.json` → `sandbox-anim` (cổng 5190). Chim mây ở Sobi Cloud.
- Pane trình duyệt ẩn → trang chỉ vẽ ~1 khung / 1,5 s và ảnh chụp không cập nhật. Cách đo: lấy module đang chạy theo URL thật
  (`performance.getEntriesByType('resource')` → `.../fishBody.ts?t=...`, `cloudBird.ts?t=...`), vá tạm `prototype.pose` /
  `update` để bắt đối tượng, lấy `obj.scene.sys.game`, chạy `game.step(t, 16.7)` và đọc `texture.key` / `next.alpha`.
  Gỡ mọi thứ đã vá sau khi đo. Muốn nhìn tận mắt thì nhờ chủ dự án mở pane.
- Xưởng rig: `npm run admin` → Xưởng rig sinh vật (clip `move`).

## 7. Giới hạn đã biết (báo cho chủ dự án, chưa sửa)

- Hoà tranh làm thấy bóng vây / cánh / chân cũ ~3–4 khung mỗi lần đổi tranh (đặc trưng của hoà tan).
- Khung di chuyển Betta (trận) hồng hơn tranh idle; bản Aquarium đã chỉnh màu, bản trận chưa.
- Mặt windup Hộ Pháp cau mày trong khi tranh attack cười. Chưa xem windup / di chuyển trong trận thật (Xưởng trận).
- Quái biển (8 con, chưa có key pose) chưa có rig; mòng biển / lươn có thể vào nhóm bay / bơi sau.
