# 051 — Sobi Studio: Unity làm xưởng tạo lại toàn bộ asset và animation

**Ngày:** 2026-11-07. **Trạng thái:** đã duyệt (chủ dự án giao agent tự quyết mọi chi tiết, chỉ duyệt kết quả).

## Bối cảnh
Art hiện tại (2547 PNG, ảnh Gemini do chủ dự án render) lệch phong cách giữa các bộ. Tranh chuyển động vẽ lại từng khung
thì lệch nhận diện (batch `rig-05-aquarium-move`, kiểm 2026-11-07). Chủ dự án thấy tổng thể chưa đẹp, muốn dùng Unity,
và muốn agent làm toàn bộ việc tạo asset lẫn animation.

## Quyết định
1. Unity (Unity 6 LTS, giấy phép Personal) là **xưởng offline** `studio/` trong repo, **không đi kèm game**. Game giữ
   Electron + Vite + TypeScript + Phaser, chỉ nhận PNG / JSON qua manifest và `content/`. Giữ nguyên id asset.
2. Mọi asset sinh từ **recipe văn bản** có kế thừa, theo một file phong cách duy nhất (`studio/Style/style.json`).
   Agent dựng hình 3D bằng code (SDF), tô toon, render ra 2D. Animation xuất ba kiểu: rig JSON cho runtime puppet rig
   sẵn có, sprite sheet, hoặc giữ tham số code.
3. Lộ trình U0–U10 và chi tiết kỹ thuật: `docs/UNITY_STUDIO_PLAN.md`. Cổng U1 do agent tự chấm trung thực, không đạt
   thì dừng (§10.1). Thay theo Area trọn gói; GĐ15 lùi tới khi xong.
4. Bắt buộc dễ sửa / cập nhật / mở rộng (§12 của plan): style một nguồn, template kế thừa, schema + kiểm, build theo
   hash, hướng dẫn thêm mới, trang Admin "Xưởng asset".

## Thay thế
> **Lưu ý 2026-11-09:** hai dòng dưới chỉ là ý định ban đầu. Cổng U1 không đạt (xem các cập nhật cuối file) nên **không có
> gì bị thay**: art giữ tranh Gemini đã duyệt; rig (decision 050) vẫn lấy key pose `cb_<art>_<pose>` từ tranh Gemini, chạy
> pose to pose. Studio chỉ còn tạo chuyển động cho tranh có sẵn (VFX trận).

- Decision 017 / 022: bỏ "phong cách chuẩn Sobi Farm" và quy trình batch Gemini qua chủ dự án cho asset mới.
- Decision 050: rig vẫn dùng runtime hiện có, nhưng nguồn layer / key pose là Studio thay cho tranh Gemini.
- Luật bản quyền (048), gameplay freeze (021), save, `npm run check`: giữ nguyên.

## Lý do
Một nguồn phong cách + render tất định cho đồng bộ tuyệt đối, không lệch giữa các khung, không phụ thuộc người render,
và render lại được cả game khi đổi phong cách. Unity miễn phí (Personal), không đi kèm game nên không ảnh hưởng bản phát
hành.

## Quay lại
Hướng cũ ở tag `pre-unity-studio` (commit `c1c058b`, nhánh `phase-14-art`). Công việc mới ở nhánh `phase-14-unity-studio`.

## Cập nhật 2026-11-07 — cổng U1 không đạt, hướng "tạo lại tất cả" dừng
U0 xong (Unity 6000.6.8f1 batchmode, renderer SDF + toon tự viết, recipe → PNG → manifest, chụp trong game). Bốn mẫu U1
(heo farm, Cá Vàng, chuồng heo, lửa) đặt trong game cạnh bản cũ, chỉnh 2 vòng. Agent tự chấm: (a) đẹp hơn bản cũ — không,
(b) đồng bộ hơn — có, (c) đáng đổi cả game — không. Theo §10.1 hướng tạo lại toàn bộ **dừng**; game giữ art cũ. Ảnh và
chấm chi tiết: `docs/studio/STATUS.md`, `docs/studio/u1/`. Chờ chủ dự án chọn phương án hẹp (VFX / animation trên
asset hiện có) hoặc bỏ. Công cụ `studio/` + `scripts/studio/` giữ trong git.

## Cập nhật 2026-11-07 (2) — phương án hẹp VFX không đạt
Chủ dự án chọn thử phương án hẹp. Cổng riêng: `fx_flame_burst`, `fx_splash`, `fx_slash_arc` cạnh bản cũ; renderer
thêm nét cọ `stroke` và xếp lớp 2D. Sau 2 vòng chỉnh không hiệu ứng nào đẹp hơn bản cũ → dừng, không nhập vào game.
Đề nghị: bỏ Studio cho việc tạo hình, giữ art hiện có. Chi tiết `docs/studio/STATUS.md`.

## Cập nhật 2026-11-08 (3) — VFX bằng chuyển động trên tranh đã duyệt: đạt cổng thử
Chủ dự án làm rõ phương án hẹp: Unity chỉ tạo **chuyển động** cho hiệu ứng có sẵn. Studio thêm part `image` (nguồn là
sheet ở tag `pre-unity-studio`), co giãn / lay / tan / quét / hạt cắt từ tranh. `fx_flame_burst`, `fx_splash`,
`fx_slash_arc` lên 8 khung @24 fps; trận tính thời lượng khung theo fps (`stripTiming.ts`, sheet 12 fps không đổi). Kiểm
trong Battle Lab cạnh bản cũ: hình giữ nguyên, chuyển động mượt hơn → đạt, đã nhập 3 hiệu ứng. 20 sheet còn lại chờ chủ dự án.

## Cập nhật 2026-11-08 (4) — 22 / 23 sheet VFX trận có chuyển động
Chủ dự án đồng ý làm tiếp. 19 sheet sinh bằng `scripts/studio/fxMotion.ts` (khung 2k đưa tranh k vào, 2k+1 giữ tranh k).
Trận quy đổi chỉ số khung theo fps (`stripRange`, `stripStill` trong `stripTiming.ts`), nội dung `battle_fx.json` không đổi.
`fx_wave_rise` giữ nguyên (đã 8 khung 512 px; gấp đôi quá tốn bộ nhớ).
