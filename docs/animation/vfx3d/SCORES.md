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

### Hệ Nước (tự chấm 2026-11-12, ảnh `docs/animation/vfx3d/water/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_ult_trident` Đinh Ba Hải Vương | `trident_sea` | 8 | (pilot) | như bảng pilot |
| `skill_nh_bubble` Bong Bóng Nước | `bubble_shot` | 7,5 | bong bóng xà phòng có viền ngũ sắc phồng ở người tung, bay vòng cung, nuốt kẻ địch, vỡ thành giọt + vòng nước | lúc vỡ hơi nhỏ so với bong bóng |
| `skill_nh_tsunami` Sóng Thần Cổ | `tsunami_sweep` | 7 | con sóng nhìn ngang có mào cuộn dựng lên cạnh người tung, chạy qua, đổ lên hàng địch; cột nước từng con; tấm nước rút đi | cột nước từng con còn to, che quái trong khoảng 300 ms; mép sau sóng còn phẳng |
| `skill_e_bubble` Phun Bọt | `bubble_spray` | 7 | luồng bọt nhỏ từ miệng quái, ba bong bóng vừa vỡ lần lượt trên mục tiêu, vũng nước | luồng bọt hơi mảnh |
| `skill_cl_freeze` Đóng Băng | `ice_bloom` | 7 | tuyết xoáy vào, sương giá bò trên đất, vòng tinh thể băng bật lên, hoa tuyết tung | trong Battle Lab trạng thái Đóng băng luôn trúng nên khối băng của trạng thái che mất tinh thể |
| `skill_e_frost_breath` Hơi Thở Băng | `frost_breath` | 7 | luồng hơi lạnh hình nón cuộn từ miệng quái, hoa tuyết, vệt sáng lạnh, sương giá và tinh thể nhỏ ở đích | như trên |

### Hệ Lửa (tự chấm 2026-11-13, ảnh `docs/animation/vfx3d/fire/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_ult_phoenix` Phượng Hoàng Tái Sinh | `phoenix_rebirth` | 7,5 | (pilot, chụp lại sau khi đổi cách nén sáng: không đổi dáng) | như bảng pilot |
| `skill_ult_hg` Lò Rèn Nguyên Thủy | `forge_ult` | 7,5 | đe sắt đen rơi xuống giữa hàng, búa khổng lồ giơ lên rồi nện ba nhát, mỗi nhát sắt nóng hơn (đen → đỏ → vàng), tia lửa phun, vòng lửa lan xa dần, lửa dưới từng kẻ địch cao dần, dung nham; tàn lửa bay sang từng đồng đội + ngọn lửa (tăng công) | đe che kẻ địch đứng giữa; búa cuối gần như vàng phẳng |
| `skill_hg_hot_claw` Càng Nung | `claw_clamp` | 7 | càng sắt đen hai gọng mở rộng quanh kẻ địch, nung đỏ rồi sập lại, tia lửa, vòng nhiệt | lúc sập hai gọng chồng lên nhau, khó thấy kẻ địch ở giữa |
| `skill_e_ember_bite` Cắn Than Hồng | `jaw_flame` | 7 | hai hàm than có nanh, đỏ rực dần, cắn sập, tàn lửa | cùng khung với Càng Nung (khác ở nanh và màu than) |
| `skill_hg_inferno_hammer` Búa Hỏa Ngục | `hammer_slam` | 7,5 | búa hiện trên cao nghiêng ra sau, nhấc thêm lấy đà, giáng trong 110 ms, bẹp và nảy; cột lửa, vũng dung nham nứt, vòng chấn, khói | đầu búa lúc nóng nhất gần trắng |
| `skill_e_lava_spit` Phun Dung Nham (quái) | `lava_glob` | 7,5 | cục dung nham lắc lư bay vòng cung kéo lửa, vỡ thành vũng dung nham có vỏ nứt, ba ngọn lửa liếm, giọt văng | — |
| `skill_hg_lava` Phun Dung Nham | `lava_flood` | 7 | dung nham trào và loang dưới cả hàng, mỗi kẻ địch một cột lửa + giọt dung nham lệch 120 ms, bong bóng khí | cột lửa mảnh |
| `skill_e_magma_breath` Hơi Thở Dung Nham | `magma_cone` | 7 | luồng lửa hình nón và giọt dung nham từ miệng quái quét qua hàng, vũng dung nham, lửa nghiêng theo luồng ở từng mục tiêu | luồng còn mỏng so với "hơi thở" |
| `skill_e_meteor` Mưa Thiên Thạch | `meteor_rain` | 7 | đá cháy rơi chéo, mỗi mục tiêu một viên lệch 100 ms rồi một viên lớn giữa hàng; cột lửa, vòng chấn, vết cháy | đuôi lửa của thiên thạch còn là các đốm nhạt |
| `skill_e_idol_flame` Lửa Tượng Thần | `flame_pillars` | 7 | vòng lửa xoay khép lại trên hàng rồi cột lửa cao dựng dưới từng mục tiêu, vòng chấn, vết cháy | vòng lửa trên cao còn nhạt |

Thay đổi chung trong lúc làm hệ Lửa: lớp nén sáng giữ sắc độ lâu hơn (lửa chồng nhiều lớp không còn ngả kem / hồng). Ảnh hệ Sét và Nước chụp trước thay đổi này.
