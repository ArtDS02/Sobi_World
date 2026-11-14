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

### Hệ Thiên nhiên (tự chấm 2026-11-13, ảnh `docs/animation/vfx3d/nature/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_mm_poison_thorn` Gai Độc | `thorn_volley` | 7 | nụ hoa mọc trước người tung, giật lùi mỗi phát; năm gai sẫm màu bay lần lượt có ánh sáng bám theo, cắm và rung trên kẻ địch, nhựa bắn, lá rơi | gai là hình lá dẹt kéo dài, chưa có khối |
| `skill_e_vine_lash` Quất Dây Leo | `vine_whip` | 7,5 | dây leo có đốt vươn ra, cong ra sau lấy đà rồi quất vòng cung xuống mục tiêu; vệt chém sáng, lá tung, vòng chấn | lá trên dây gần như không thấy |
| `skill_e_poison_spore` Bào Tử Độc | `spore_cone` | 7 | luồng bào tử hình nón từ miệng quái, phủ lên mục tiêu rồi treo thành đám mây tím cuộn, đốm phấn vàng xanh | — |
| `skill_mm_binding_roots` Rễ Trói | `root_bind` | 7 | rễ phá đất dưới từng kẻ địch (lệch 110 ms), hai rễ xoắn ngược chiều quấn lên rồi siết lại ở 900 ms, đất văng, lá rụng | hai rễ xoắn đối xứng nhìn hơi "hình học" |
| `skill_e_root_quake` Rễ Rung Chuyển | `root_quake` | 7 | vết nứt sáng chạy trên đất từ quái tới từng mục tiêu, ba rễ to quật lên dưới mỗi con, đất và bụi tung, vòng chấn | rễ giống gai nhọn hơn là rễ |
| `skill_e_corrupt_bloom` Hoa Nhiễm Độc | `corrupt_bloom` | 7 | thân cong mọc lên trước quái, hoa tím hai vòng cánh nở, giật lùi mỗi lần phun; mỗi mục tiêu một cục độc bay vòng cung, vỡ thành giọt và mây độc | hoa còn phẳng như hình dán |
| `skill_e_thorn_storm` Bão Gai | `thorn_storm` | 7 | lốc gai và lá xoáy quanh quái, siết lại rồi lao dọc hàng; ba đợt gió có vệt chém trên từng mục tiêu | lốc đọc là "gió xanh" nhiều hơn là "gai" |

Bài học: hình `streak` của atlas rất mảnh, hạt kéo dài bằng hình đó chỉ là sợi chỉ; vật bay cần thấy rõ (gai) dùng hình `leaf` kéo dài, màu tương phản với nền và có ánh sáng bám theo.

### Hệ Đất (tự chấm 2026-11-14, ảnh `docs/animation/vfx3d/earth/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_qs_rock_smash` Đập Đá | `boulder_smash` | 7,5 | đất nứt trước người tung, tảng đá có mặt cắt trồi lên, lơ lửng một nhịp rồi bay vòng cung xoay tới mục tiêu; vỡ thành sáu mảnh lớn lăn đi, mảnh vụn, bụi, vết nứt, vòng chấn | — |
| `skill_qs_quake` Địa Chấn Cổ | `quake_spikes` | 7,5 | cú dậm làm nứt đất dưới người tung, bụi chạy sát đất tới hàng địch, mỗi kẻ địch một cụm sáu gai đá trồi lên có nảy (lệch 130 ms) rồi lún xuống | — |
| `skill_e_tusk_charge` Húc Nanh | `tusk_charge` | 7 | bụi tung dọc đường lao, hai chiếc ngà cong màu ngà voi móc từ dưới đất lên qua mục tiêu, lóe sáng, mảnh vụn, vết nứt | gốc ngà bị cắt phẳng; ngà là dải dẹt tô bóng chứ không phải khối |
| `skill_e_rock_slam` Nện Đá | `rock_fist` | 7 | nắm đấm đá (bàn tay khối, bốn đốt, ngón cái, cổ tay sáu cạnh) kết lại trên cao, nghiêng lấy đà, giáng trong 100 ms, bẹp và nảy; hố nứt, mảnh vụn, bụi, vòng chấn | các đốt ngón chưa tách rõ, nhìn xa giống búa đá |
| `skill_e_seal_quake` Địa Chấn Phong Ấn | `seal_quake` | 7,5 | ấn vàng (hai vòng xoay ngược, khung vuông vỡ) cháy trên đất dưới cả hàng, vết nứt lan và sáng lên, ấn rách ra ở 1200 ms, phiến đá có vân sáng trồi dưới từng mục tiêu, giật thêm một nhịp ở 1700 | — |

### Hệ Kim (tự chấm 2026-11-14, ảnh `docs/animation/vfx3d/metal/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_tg_steel_slash` Chém Thép | `steel_slash` | 7,5 | một vệt chém lưỡi liềm lớn vẽ trong 70 ms, đứng yên qua nhịp hit-stop, rồi một đường sáng mảnh xuyên qua kẻ địch lóe lên và tia lửa bung ra ở 600 ms | vệt chém là mảng sáng phẳng, chưa có thớ |
| `skill_tg_armor_break` Phá Giáp | `armor_break` | 7,5 | giáp của kẻ địch hiện thành tấm khiên tám mảnh có ánh lướt qua, một nhát chém vàng giáng xuống, vết nứt sáng lan 100 ms rồi các mảnh văng tung và rơi | khiên che gần hết kẻ địch trước khi vỡ |
| `skill_tg_steel_charge` Húc Thép | `steel_charge` | 7,5 | bánh thép mười hai răng quay tít tại chỗ lấy đà, lao đi có vệt gió và tia lửa dưới đất, dừng khựng trên kẻ địch, bẹp và nảy; tia lửa, bụi, vết nứt | — |
| `skill_e_metal_claw` Vuốt Thép | `metal_claw` | 7 | ba lượt vuốt (400 / 480 / 560), mỗi lượt ba vệt mảnh song song, lượt thứ hai chéo ngược, lượt cuối rộng nhất; tia lửa mỗi lượt | lóe sáng giữa mục tiêu còn to |
| `skill_e_bronze_crush` Nghiền Đồng | `bronze_fist` | 7 | găng đồng (mu bàn tay, bốn ngón hai đốt, ngón cái, cổ tay loe có đai) rơi xuống, nghiêng lấy đà, giáng trong 100 ms rồi xoay nghiến, tia lửa phun ngang nửa giây | nhìn từ trên xuống thấy nhiều mặt cổ tay hơn là nắm đấm |
| `skill_ult_tg` Đoàn Kỵ Thép | `steel_cavalry` | 7,5 | ba kỵ sĩ thép cầm thương dàn hàng sau người tung, lao qua hàng địch ba lượt (1350 / 1600 / 1850) rồi cùng đánh ở 2200; mỗi lượt một đường thương sáng trên từng kẻ địch; cuối cùng các mảnh thép ghép thành khiên trước người tung | kỵ sĩ là tranh phẳng hai tư thế; khuôn mặt / chi tiết ngựa đơn giản |

Kỵ sĩ là hình gốc vẽ bằng code (ngựa có giáp, người đội mũ có ngù, khiên tròn, thương có cờ): không dựa trên nhân vật hay thương hiệu nào.

### Hệ Ánh sáng (tự chấm 2026-11-14, ảnh `docs/animation/vfx3d/light/*_sheet.jpg`, chụp sau lần sửa cuối)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_qt_ray` Tia Sáng | `light_ray` | 7,5 | đốm sáng tụ trước người tung thành một hào quang nhỏ, tia mảnh bắn tới kẻ địch đúng nhịp trúng, lóe sao dịu, vòng sáng dưới chân, đốm sáng bay lên | — |
| `skill_qt_lumina` Tia Lumina | `lumina_ray` | 8 | mặt trời (hào quang có tia) mở sau lưng người tung, tia rộng xuyên qua kẻ địch, cột sáng dựng lên tới trời ở chỗ trúng, vương miện sáng trên đất | lóe sáng ở điểm trúng còn che kẻ địch khoảng 150 ms |
| `skill_e_rune_beam` Tia Rune | `rune_beam` | 7,5 | bánh xe có dải ký hiệu rune xoay trước quái, sáng dần, bắn tia xâu các vòng trượt về phía mục tiêu, một vòng rune đóng xuống đất dưới mục tiêu | màu xanh lam của rune bị bloom làm ngả trắng |

Ký hiệu rune là các nét vẽ ngẫu nhiên theo ô (shader), không lấy từ bảng chữ hay biểu tượng nào có sẵn.
FPS trên RTX 3050 (Chrome headless, 1600 × 900): Tia Lumina, Đoàn Kỵ Thép, Địa Chấn Phong Ấn, Bão Gai đều 60 fps.

### Hệ Bóng tối (tự chấm 2026-11-14, ảnh `docs/animation/vfx3d/dark/*_sheet.jpg`, chụp sau lần sửa cuối; phiên Fable dựng, phiên Opus chỉnh và chấm)
| Skill | Hiệu ứng | Tự chấm | Thấy gì | Còn yếu |
|---|---|---|---|---|
| `skill_dm_ink` Phun Mực | `ink_spray` | 7 | luồng mực đặc bắn vòng cung từ người tung, mảng mực úp lên đầu kẻ địch đúng nhịp trúng, chảy xệ thành giọt dọc thân, thành vũng dưới chân; kẻ địch thấy lại sau ~150 ms | luồng mực là dải đen phẳng, chưa có ánh bóng / viền tím |
| `skill_dm_nightmare` Ác Mộng | `nightmare` | 7,5 | khói đen dâng sau kẻ địch, mặt nạ dài hiện ra trên đầu nó, lắc lư, mở mắt tím rồi nhe răng; hai tay bóng vươn quanh; đúng nhịp trúng mặt nạ lao xuống úp vào kẻ địch rồi tan trong ~250 ms | lúc treo trên cao, đầu tay bóng có thể chạm kẻ địch đứng sau |
| `skill_e_shadow_bite` Cắn Trong Bóng Tối | `shadow_bite` | 7 | vũng bóng trượt từ chỗ quái biến mất tới dưới mục tiêu, hàm bóng hai dải răng trồi lên há rộng quanh mục tiêu, sập lại đúng nhịp trúng với khe sáng tím, tan ngay sau đó | lúc sập, dải hàm che ngang ngực mục tiêu khoảng 200 ms |
| `skill_e_wraith_touch` Chạm Hồn Ma | `wraith_touch` | 7 | sương lạnh bên cạnh mục tiêu, cánh tay nhợt mọc lên vòng qua, bàn tay năm ngón xòe trên cao rồi lật úp, các ngón cong như móng chụp lấy đầu mục tiêu; hồn trắng xanh bị rút bay lên | cánh tay là ống trơn, chưa có đốt; nhìn xa giống cần câu |
| `skill_dm_night_net` Lưới Đêm | `night_net` | 7 | sao tụ trên hàng địch, lưới đêm dệt từ giữa ra, nghiêng dần và rơi phủ cả hàng, siết lại; mỗi kẻ địch một vòng tím và mảnh bóng lệch 80 ms | lưới là ô trám đều, hơi giống lưới rào; mảng tím đậm quanh mục tiêu sau cú trúng là hiệu ứng trúng chung của hệ (2D), không thuộc skill |
| `skill_ult_dm` Lưới Dệt Đêm | `night_weave` | 7,5 | trời đen tụ trên hàng địch, các sợi chỉ bay từ người tung lên đan chéo, tấm lưới lớn dệt ra và hạ xuống cả hàng, ba sợi quấn kén quanh từng kẻ địch (lệch 150 ms), siết ở 1500, giật siết bung sao và vòng lớn ở 2050 | sợi chỉ lúc bay gần trắng (đọc như ánh sáng hơn là chỉ đêm) |
| `skill_e_curse` Lời Nguyền | `curse_eyes` | 7 | một con mắt lớn mở trên quái, nhìn dọc hàng; rồi trên mỗi mục tiêu một con mắt nhỏ mở (lệch 120 ms), nhỏ lệ mực xuống, mảng bóng tối và vòng tím | mắt của mục tiêu đứng trước đè lên thân con đứng sau |

Lỗi đã sửa trong lúc chấm (bản Fable bị ngắt trước khi chấm): Phun Mực, Ác Mộng, Cắn Trong Bóng Tối che kín mục tiêu 300–600 ms (hình quá to, tan chậm); Chạm Hồn Ma mọc xuyên qua con heo bên cạnh, bàn tay xòe ngang thay vì nắm; quầng khói của Lời Nguyền thành cột đen treo từ mép trên; lưới của Lưới Đêm bị cắt ở mép trên khung; mảnh khói trong `blot` dày và che mục tiêu (đã làm mảnh hơn cho cả hệ).
Bài học: lớp 3D luôn vẽ **đè lên** sinh vật (không có chiều sâu so với sprite), nên vật "sau lưng" mục tiêu thực ra che mặt nó; vật cần đứng cạnh mục tiêu phải đặt **bên cạnh**, về phía trống (phía người tung), không về phía đồng đội của mục tiêu.
Mặt nạ, mắt, hàm, bàn tay là hình gốc vẽ bằng shader / code, không dựa trên nhân vật hay biểu tượng nào.
FPS trên RTX 3050 (Chrome headless, 1600 × 900): Lưới Dệt Đêm 60,1, Lưới Đêm 60,2, Ác Mộng 60,3 fps.
