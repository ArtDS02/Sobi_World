# Sobi Studio — cách dùng và viết recipe

Unity là xưởng offline (`studio/`), không đi kèm game (decision 051). Mọi logic recipe nằm ở TypeScript
(`scripts/studio/`); Unity chỉ dò tia SDF, tô toon và xuất PNG. Trạng thái hướng đi: `docs/studio/STATUS.md`.

## Lệnh

| Lệnh | Làm gì |
|---|---|
| `npm run studio -- validate` | Kiểm style + mọi recipe (cũng chạy trong `npm run check` qua `tests/scripts/studio.test.ts`) |
| `npm run studio -- build <id…>` | Biên dịch → Unity render → QA → chép vào `public/assets` (+ `frames` manifest nếu output có `fps`) → `studio/status.json` |
| `npm run studio -- build <id…> --no-import` | Chỉ render ra `art_inbox/studio/<run>/`, không đụng game |
| `npm run studio -- build --changed` / `--all` | Chỉ recipe có hash đổi (recipe + template + style + công cụ) / tất cả |
| `npm run studio -- compare <id…>` | Ảnh cũ (tag `pre-unity-studio`) cạnh ảnh hiện tại, ra `art_inbox/studio/compare/` |
| `npm run studio -- schema` | Ghi JSON Schema từ zod vào `studio/Recipes/schema/` (test báo nếu lệch) |
| `npx tsx scripts/studio/shots.ts --tag <tên>` | Chụp Farm + Aquarium trong game (Electron offscreen, dev server `sandbox` cổng 5181 phải chạy) |
| `npx tsx scripts/studio/pair.ts <cũ> <mới> x,y,w,h <out>` | Cắt cùng vùng hai ảnh chụp, đặt cạnh nhau |
| `npx tsx scripts/studio/strip.ts <out> <scale> <png…>` | Xếp PNG cạnh nhau, phóng to (soi khung ở độ phân giải đầy đủ) |
| `npx tsx scripts/studio/bbox.ts <png…>` | Khung bao vùng có màu (đo vị trí / vạch chân) |

Unity: `studio/studio.local.json` `{ "unity": "<Unity.exe>" }` > biến `SOBI_UNITY` > `C:\Program Files\Unity\Hub\Editor\<bản trong ProjectVersion.txt>`.
Project phải đóng trong Editor khi chạy batchmode.

## File

| Đường dẫn | Nội dung |
|---|---|
| `studio/Style/style.json` | Nguồn phong cách duy nhất: bảng màu, ánh sáng / bậc tô, viền, mắt, vân cọ, cỡ canvas / neo / góc camera theo `kinds` |
| `studio/Recipes/_templates/*.json` | Lớp mẫu: `pig_farm`, `fish_tail`, `building`, `fx_flat` |
| `studio/Recipes/<area>/<id>.json` | Recipe một asset: `extends` template, chỉ ghi phần khác |
| `studio/Assets/Sobi/Shaders/SdfRender.compute` | Renderer GPU (GBuffer → Shade → Down; Flat cho hiệu ứng 2D) |
| `studio/Assets/Sobi/Editor/*.cs` | CLI batchmode, đọc job, render, đọc ngược GPU, ghi PNG |
| `scripts/studio/schema.ts` | Schema zod (nguồn), `compile.ts` (recipe → job), `cli.ts`, `qa.ts`, `manifest.ts` |

## Recipe

Đơn vị thế giới: mặt đất y = 0, sinh vật quay +x, mặt nhìn thấy +z. `extends` gộp object theo khoá, mảng bị thay;
`"remove": true` xoá một part của template.

- `colors`: vai màu → khoá bảng màu (`"skin": "pig_pink"`). Part dùng vai hoặc khoá bảng màu; màu ngoài bảng là lỗi.
- `parts`: `shape` (`sphere [r]`, `ellipsoid [rx,ry,rz]`, `box [hx,hy,hz,bo]`, `cone [r_gốc,r_ngọn,cao]` dọc +y,
  `arc [R,r,góc°]` vòng trong mặt XY quanh +y, `cylinder [r,nửa cao,bo]`, `wedge [nửa rộng,cao,nửa sâu,bo]`),
  `parent`, `at` (khớp trong khung cha, part xoay quanh nó), `rot` (độ, X rồi Y rồi Z), `offset` (tâm hình so với khớp),
  `scale`, `blend` (gộp mềm với mọi thứ trước nó), `op` (`add` / `cut` / `intersect`; `cut` khoét mọi thứ đứng trước),
  `group` (khác nhóm thì có nét viền khi một bên ở trước), `flags` (`unlit`, `noline`, `gloss`, `tintcut`), `noise`,
  `bend` (uốn: x lệch theo bend·y²), `mirror` (bản `_r` đối xứng qua z), `repeat` (lặp / lưới / xoay), `order`, `hide`.
  Part không có `shape` là khớp thuần (chỉ để xoay con).
- `paints`: tô màu lên bề mặt có sẵn, không đổi hình: cùng hình như part + `on` (nhóm được tô), `soft`, `opacity`.
  `billboard: true` là decal chiếu từ camera (mắt, miệng, mí). `shape: "eye"` = mắt chuẩn theo `style.eyes` (vai màu
  `eye`, `iris`).
- `poses`: delta theo tên node (`"paint:<tên>"` cho paint): `rot` / `at` / `offset` cộng thêm, `scale` nhân, `size`
  thay, `bend` cộng, `hide` / `show`. Bản lặp `tên#i` theo delta của `tên`.
- `clips`: `frames`, `keys` (`t` 0..1, `pose` tên hoặc nội tuyến, `ease`), `loop`, `phase` (pha nhiễu cho lửa).
- **Diễn hoạt tranh có sẵn** (VFX, kind `fx_battle_anim`: 1 đơn vị = một khung 256 px, gốc ở đáy giữa):
  `source: { file, ref, frame: [w, h] }` (tranh đã duyệt đọc từ git, không phải file đang ghi đè); part `shape: "image"`,
  `size [w, h]`, `src: { frame }` hoặc `{ rect: [x, y, w, h] }`, `stretch [sx, sy]` (co giãn quanh khớp), `sway { amp, waves,
  speed }`, `dissolve { amount, soft, freq }`, `wipe { center, from, to, soft, progress }`, `opacity`. Pose:
  `stretch`, `dissolve`, `wipe`, `opacity`, `swayPhase` (khoá thiếu giá trị = trung tính: rõ hẳn, không tan, quét xong).
  `emitters`: hạt là mảnh `src` của tranh, `count`, `seed`, `at`, `box`, `vel`, `jitter`, `gravity` (đơn vị / giây theo
  `clips.<tên>.ms`), `life [xuất hiện đầu, xuất hiện cuối, hết]` theo thời gian clip 0..1. Tìm mảnh: `npx tsx
  scripts/studio/blobs.ts <file> <khung> <rộng khung>`. Sheet trận: 8 khung + `fps: 24` giữ 340 ms.
- **Sheet 4 khung → 8 khung hàng loạt**: thêm một dòng vào `MOTIONS` trong `scripts/studio/fxMotion.ts` (neo `bottom` / `center` / `top`, `first` = cách tranh 0 xuất hiện, `enter` = cách tranh kế vào, `sway`, `spin`), chạy `npx tsx scripts/studio/fxMotion.ts <id>` rồi `npm run studio -- build <id>`. Quy ước: khung 2k đưa tranh k vào (tranh trước tan dưới nó), khung 2k+1 là tranh k nguyên vẹn. Trận tự quy đổi chỉ số khung cũ (`src/areas/adventure/scene/battle/stripTiming.ts`: dải `[a, b]` → `[2a, 2b+1]`, khung đơn `f` → `2f+1` khi sheet 24 fps), nên `battle_fx.json` không phải sửa.
- So trong trận: `npm run anim:capture -- --suite skills --only battle.skill.<id> --grid 40` (một lần với asset cũ, một lần
  mới), rồi `npx tsx scripts/studio/battlePair.ts <run cũ> <run mới> battle.skill.<id> <từ ms> <tới ms> x,y,w,h <out.png>`.
- `outputs`: `file` phải là file của manifest id `asset` (id không bao giờ đổi), `pose` hoặc `clip` (+ `frame`, `cols`,
  `fps` cho sheet), `view` đè canvas / ppu / origin.

## Thêm một asset (≤ 5 bước)

1. Chép recipe gần giống nhất trong `studio/Recipes/<area>/`, đổi `id`, `outputs`.
2. Đổi `colors` / part khác biệt (chỉ ghi phần khác template).
3. `npm run studio -- build <id> --no-import`, xem `art_inbox/studio/compare/` ở độ phân giải đầy đủ.
4. Đạt thì `npm run studio -- build <id>`, `npm run assets:check`.
5. Kiểm trong game (`shots.ts`), `npm run check`, commit đúng đường dẫn.
