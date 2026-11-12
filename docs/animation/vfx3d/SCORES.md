# Điểm chấm animation skill 3D (chủ dự án chấm)

Thang 10, tiêu chí ở `docs/handover/FABLE_VFX3D_HANDOVER.md` mục 3. Cổng thử: cả 3 skill pilot phải ≥ 7 mới mở rộng.

| Ngày | Skill | Điểm | Nhận xét của chủ dự án |
|---|---|---|---|
| 2026-11-12 | `skill_ult_trident` (Đinh Ba) | ~7 | Phần tốt nhất phiên trước. Cần làm sinh động hơn rồi mới dùng làm chuẩn. |
| 2026-11-12 | `skill_ult_phoenix` (Phượng Hoàng) | chưa chấm số | Con phượng hoàng còn xấu, thiếu điểm nhấn, hơi mờ nhạt. |
| 2026-11-12 | `skill_ld_chain` (Sét Xích) | chưa chấm | Chưa tìm thấy skill trong Battle Lab. |
| 2026-11-12 | Mọi skill hệ Sét | thấp | Thiếu mạnh mẽ khi sét đánh; sét và mây quá mờ nhạt, thiếu sinh động. |

## Quyết định của chủ dự án (2026-11-12)
- Không có ảnh / clip tham chiếu; Fable tự thiết kế hướng nghệ thuật gốc.
- Chế độ chất lượng thấp (nối Cường độ hiệu ứng): giao Fable quyết.
- Làm tất cả nguyên tố, từng hệ một, chủ dự án chấm trước khi sang hệ khác.
- Duyệt cả 22 skill mới trong `NEW_SKILLS_PROPOSAL.md` (vẫn cần decision 060 trước khi sửa `content/`).

## Tự chấm của Fable (cột riêng; chủ dự án chấm lại sau)
Thước: handover mục 3 (5 tiêu chí × 0–2). Ảnh chụp sau lần sửa cuối, sân 1600 × 900: `docs/animation/vfx3d/pilot/*_sheet.jpg` (`before_*` = bản cũ). Chuyển động chỉ được xem qua các khung tĩnh dày, không xem được clip: điểm "chuyển động" vì thế chấm dè dặt.

| Ngày | Skill | Đúng mô tả | Đọc ở cỡ nhỏ | Chuyển động | Chất liệu & màu | Hiệu năng & an toàn | Tự chấm | Còn yếu |
|---|---|---|---|---|---|---|---|---|
| 2026-11-12 | `skill_ult_trident` | 2 | 2 | 1,5 | 1,5 | 2 | **8** | Giọt nước bắn còn ít thấy sau lớp sóng; hit-stop của kịch bản cũ ở 1300 chứ không ở 1100. |
| 2026-11-12 | `skill_ult_phoenix` | 2 | 2 | 1,5 | 1,5 | 1,5 | **7,5** | Đầu chim nhỏ, ngực còn sáng; lông rơi hơi giống giọt; hai lần chớp cách nhau 750 ms (đúng giới hạn). |
| 2026-11-12 | `skill_ld_chain` | 2 | 2 | 1,5 | 1,5 | 1,5 | **7,5** | Mép mây còn thô; chưa đo lại độ lệch giữa tia 2–3 và số sát thương sau khi bỏ hit-stop đầu. |

FPS đo bằng `npx tsx scripts/animation/fps.ts` trên RTX 3050 (Chrome headless, D3D11, sân 1600 × 900, chế độ đầy đủ): cả ba skill 60,1 fps (trần của màn hình), khung chậm nhất 17 ms. Chưa đo trong Electron.

**Cách mở Chuỗi Sét trong Battle Lab:** `npm run admin` → `admin.html#/battle-lab` → khối "Bên ra đòn": Loại kỹ năng = kỹ năng riêng (unique), Nguyên tố = Sấm → chọn "Chuỗi Sét" (`skill_ld_chain`). Nên để 3 quái.
