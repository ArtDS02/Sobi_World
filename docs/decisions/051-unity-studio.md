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
- Decision 017 / 022: bỏ "phong cách chuẩn Sobi Farm" và quy trình batch Gemini qua chủ dự án cho asset mới.
- Decision 050: rig vẫn dùng runtime hiện có, nhưng nguồn layer / key pose là Studio thay cho tranh Gemini.
- Luật bản quyền (048), gameplay freeze (021), save, `npm run check`: giữ nguyên.

## Lý do
Một nguồn phong cách + render tất định cho đồng bộ tuyệt đối, không lệch giữa các khung, không phụ thuộc người render,
và render lại được cả game khi đổi phong cách. Unity miễn phí (Personal), không đi kèm game nên không ảnh hưởng bản phát
hành.

## Quay lại
Hướng cũ ở tag `pre-unity-studio` (commit `c1c058b`, nhánh `phase-14-art`). Công việc mới ở nhánh `phase-14-unity-studio`.
