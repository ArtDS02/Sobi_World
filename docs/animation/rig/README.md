# Puppet rig — animation sinh vật (decision 050)

| Tài liệu | Nội dung |
|---|---|
| [AUDIT.md](AUDIT.md) | Audit hệ thống & asset hiện tại, nguyên nhân gốc, phần giữ / bỏ |
| [ARCHITECTURE.md](ARCHITECTURE.md) | So sánh phương pháp, kiến trúc đã chọn (hybrid puppet), dữ liệu, state machine, ba lớp phối hợp |
| [PIPELINE.md](PIPELINE.md) | Quy trình thêm sinh vật, quy chuẩn asset / clip, tích hợp, nguyên tắc theo body plan |
| [ASSET_REUSE.md](ASSET_REUSE.md) | Asset nhóm A / B / C |
| [ACCEPTANCE.md](ACCEPTANCE.md) | Checklist nghiệm thu kiểm được + trạng thái hiện tại |
| [ROADMAP.md](ROADMAP.md) | R0–R6 |
| [requests/](requests/) (bản có git) = `art_inbox/rig_README.md`, `art_inbox/rig_<rig>.md`, `art_inbox/rig_<rig>_guide.png` (bản làm việc; `art_inbox/` không vào git) | Yêu cầu layer art |

Xem nhanh: `npm run admin` → **Thế giới → Xưởng rig sinh vật** (`#/rig-lab`). Trong trận: **Xưởng animation trận**, chọn bên ra đòn `pig_boar` / `pig_turtle` / `fish_betta`.
Lệnh: `npm run rig:parts [rig]`, `npm run rig:fmt`, `npm run rig:guide [rig]`.
