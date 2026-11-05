# Implementation Roadmap — animation puppet (decision 050)

| Giai đoạn | Nội dung | Trạng thái | Điều kiện qua |
|---|---|---|---|
| **R0** Audit + kiến trúc | `AUDIT.md`, `ARCHITECTURE.md`, `ASSET_REUSE.md`, decision 050 | ✅ 2026-11-05 | — |
| **R1** Framework + prototype | schema rig, `systems/animation` (clip, warp, life, skeleton, performer), `ui/puppet`, `rig:parts/fmt/guide`, Xưởng rig, tích hợp trận (`battlePerf`, `battlePuppets`, ghosts), 4 rig × 13–15 clip trên art rig-proof, test | ✅ 2026-11-05 | ACCEPTANCE A1–A9, C1–C4 xanh |
| **R1b** Duyệt prototype | Chủ dự án xem Xưởng rig + trận với Heo Rừng / Heo Rùa / Cá Betta; chấm A10–A12; vẽ layer theo `art_inbox/rig_*.md` (thứ tự gợi ý: `pig_boar` → `pig_turtle` → `fish_betta` → `octopus`) | ⏳ chờ chủ dự án | A10–A12 đạt trên **layer vẽ tay** của ít nhất 1 con |
| **R2** Skill theo thân | ✅ bước 1 (2026-11-05): bộ 10 cử chỉ, suy cử chỉ từ kịch bản, `g_*` + `ultimate` cho 4 rig, spot `mouth`/`tail`, bỏ tween `cast_*` cho con có rig. Tiếp: clip `skill_<id>` cho skill độc nhất, flipbook khoảnh khắc tuyệt kỹ, chuyển spot `mouth` cho skill phun / thở | 🟡 | B4–B8 |
| **R2b** Phủ chiến binh | rig cho 22 combat animal theo template (heo quadruped dùng chung xương `pig_boar`, đổi layer + `feel`; heo đứng 2 chân → template `biped`; cá → `fish_betta`) | 📝 | mỗi con qua `animationRig.test.ts` + A10 |
| **R3** Quái + boss | 22 quái theo plan (sói/cáo/heo rừng gai: quadruped; golem/tượng: heavy; chim: flyer; tinh linh/ma: floater; mầm: small); boss có `phase` clip | 📝 | A1–A9 mỗi rig |
| **R4** Lore Umbraflux | lớp `possessed` cho quái bị tha hoá (bậc 1–5): khựng / giật theo noise, đồng bộ nhịp với đồng loại, mắt đổi (slot `eyes_corrupt`); thanh tẩy (`reaction_purify`) trả về nhịp tự nhiên | 📝 | chủ dự án duyệt cảm giác |
| **R5** Cả Sobi World | Farm (heo đi dạo / ăn / ngủ: `Want` từ AI hành vi), Aquarium (cá bơi: `move` + hướng), Garden / Cloud (sinh vật phụ); tối ưu bộ đệm solve; đo FPS 30 puppet | 📝 | C6 ≥ 55 fps |
| **R6** Kiểm thử | capture harness cho puppet (dải khung → so IoU giữa các khung như `STATIC_SHAPE`), e2e trận, không-WebGL | 📝 | ACCEPTANCE C5–C7, D6 |

Rủi ro & cách xử lý:
- **Art AI không giữ đúng canvas / phần bị che**: dùng ảnh guide làm lớp căn, cho phép chỉnh `at` trong rig; bù phần che bằng tay. Nếu một loài khó, giữ bản vector cho bộ phận đó tạm thời (manifest `placeholder` chặn phát hành).
- **Số lượng clip**: template theo body plan — clip loài mới chép rồi chỉnh cá tính (thường 30–40 % key), không viết lại từ đầu.
- **Hiệu năng ở Farm (nhiều heo)**: R5 đo trước; có thể hạ `segments` của dải và tắt lò xo ngoài màn hình.
