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

### Hệ Sét (tự chấm 2026-11-12, ảnh `docs/animation/vfx3d/lightning/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_ld_thunder_strike` Lôi Kích | `thunder_strike` | 7,5 | mây đen tụ trên một kẻ địch, tia dò xuống dài dần, một tia lớn phân nhánh + đánh lại, vòng chấn, vết cháy | mây lúc sáng lên hơi ngả kem |
| `skill_ld_chain` Chuỗi Sét | `chain_lightning` | 7,5 | (pilot) | như bảng pilot |
| `skill_ld_call_thunder` Gọi Sấm | `call_thunder` | 7,5 | dải mây giông trên cả hàng, mỗi kẻ địch một tia lệch 160 ms | — |
| `skill_ult_ld` Hiệu Lệnh Sấm | `thunder_command` | 8 | tia sét từ người tung phóng lên trời (hiệu lệnh), mây phủ cả bầu trời, hai loạt sét lên từng kẻ địch, một tia khổng lồ giữa hàng + cung điện sang từng con, sét chạy dọc từng đồng đội (tăng tốc) | chớp nền của kịch bản cũ dày (6 lần, 3 mạnh): đúng giới hạn nhưng nên xem bằng mắt |
| `skill_e_spark_peck` Mổ Tia Điện | `spark_peck` | 6,5 | hai tia ngắn 380 / 470, lóe sao | tia xuất phát trước khi quái tới nơi; lóe che mục tiêu |
| `skill_e_dive` Bổ Nhào | `lightning_dive` | 7 | đầu sáng lao từ trời kéo đuôi sét, tia lớn khi chạm, vòng chấn | nền không tối lại ở đòn của quái (tint có trong kịch bản, chưa rõ vì sao không thấy) |
| `skill_e_thunder_charge` Lao Sấm | `thunder_rush` | 7 | đường sét bắn theo cú lao xuyên hàng, quất xuống từng mục tiêu | như trên |

Lỗi đã sửa trong lúc làm: danh sách mục tiêu của lượt (`struck`) gồm cả đồng đội nhận hiệu quả phụ, nên tuyệt kỹ Sét từng đánh cả vào phe mình; nay lọc theo phe của điểm neo.
