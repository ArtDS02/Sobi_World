# 04 — So sánh A (2D) / B (Hybrid) / C (3D) (mục E)

Ngày: 2026-11-11. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH]. Bảng lợi / hại riêng từng phương án: `PROS_CONS_A_2D.md`, `PROS_CONS_B_HYBRID.md`, `PROS_CONS_C_3D.md`.

## 1. Định nghĩa dùng trong so sánh

| | Runtime | Nguồn asset | Ghi chú |
|---|---|---|---|
| **A** | Phaser 3 (như hiện nay) | Tranh 2D; puppet rig pose-to-pose; VFX sheet | Gồm cả nâng cấp: tranh trung gian, ánh sáng 2D, thị sai, camera trận |
| **A+** (biến thể của A) | Phaser 3 | Như A, cộng tranh trung gian render từ model 3D offline (pipeline P1 ở `06`) | Game vẫn 2D hoàn toàn; 3D chỉ là công cụ xưởng |
| **B** | Phaser cho 4 Area + renderer 3D cho Adventure | 2D cho 4 Area; model, rig, clip 3D cho Adventure | Hai pipeline, hai renderer |
| **C** | Renderer 3D cho mọi Area | Model 3D cho toàn bộ | Bỏ 2547 PNG hiện có khỏi vai trò asset chính |

A+ được tách riêng vì đây là nơi 3D có thể giúp mà không phải trả giá runtime. Nó chưa được thử; `09_PROTOTYPE_VA_TIEU_CHI.md` đề xuất cách thử.

## 2. Bằng chứng nền dùng cho mọi dòng chấm

| # | Dữ kiện | Nguồn |
|---|---|---|
| E1 | Dự án đang ở GĐ14 (art), gameplay đã freeze; manifest 2455 dòng, 2664 PNG, 561 MB, 27 dòng còn placeholder (đếm 2026-11-11; số 2279 / 2547 dùng ở vài chỗ khác là số ngày 2026-11-07 của plan Studio) | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 4.3; `docs/UNITY_STUDIO_PLAN.md` §2 |
| E2 | Hình 3D dựng bằng code, render toon ra 2D: 4/4 mẫu **không** đẹp hơn tranh cũ sau 2 vòng; "như đồ nhựa" | [DỮ LIỆU] `docs/studio/STATUS.md` |
| E3 | Thêm chuyển động trên tranh VFX đã duyệt: **đạt**, 22/23 sheet đã vào game | [DỮ LIỆU] `docs/studio/STATUS.md` |
| E4 | Puppet rig bẻ một ảnh (skin): chủ dự án bác; cắt bộ phận vẽ rời: hình xấu hơn tranh duyệt ~30 %; hiện dùng pose-to-pose trên 6 key pose, giới hạn là thiếu khung trung gian | [DỮ LIỆU] `docs/decisions/050` bổ sung (2), (5) |
| E5 | Gemini vẽ lại từng khung thì lệch nhận diện (batch `rig-05`, cá); Chim Sẻ Sấm thì dùng được | [DỮ LIỆU] `docs/decisions/051` bối cảnh; `docs/PROGRESS.md` |
| E6 | Không có nghệ sĩ 3D; chủ dự án không mua API; máy 6 GB VRAM | [DỮ LIỆU] `docs/decisions/022`; đo máy |
| E7 | AI 11/2026: mesh xoay được thì có; topology cho biến dạng và rig non-humanoid chập chờn; animation non-humanoid gần như không | [DỮ LIỆU + NHẬN ĐỊNH] `05_CONG_NGHE_AI_3D.md` mục 5 |
| E8 | Trận Adventure là sân Phaser vẽ dưới DOM; logic thời gian thuần ở `ui/battle*.ts`, Phaser chỉ phát cue; 112 skill có kịch bản trong `content/adventure/battle_fx.json` | [DỮ LIỆU] `docs/animation-review/ANIMATION_REVIEW_FEEDBACK.md` §0.1; `docs/PROGRESS.md` |
| E9 | 98 / 681 file trong `src/` import Phaser; `src/core`, `src/systems`, `areas/*/logic` không import Phaser hay DOM. Đổi sang 3D: toàn game giữ 69,6 % dòng, chỉnh 10,7 %, viết lại 19,7 %; riêng B chỉ đụng khoảng 9–11 % của `src/`. Phần viết lại chứa gần như mọi thứ người chơi nhìn thấy | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 3 |
| E10 | Trận theo lượt, góc máy cố định, đội 3; tài liệu animation không đòi camera xoay, chỉ cut-in và zoom 1,04–1,06×. Phân loại 112 skill theo lợi ích 3D: lớn ~3 %, vừa ~13 %, ít ~34 %, không ~50 % | [DỮ LIỆU + NHẬN ĐỊNH] `02_PHAN_TICH_ANIMATION_SKILL.md` mục 1.2, mục 5 |

## 3. Bảng chấm có trọng số

Thang 1–5 (5 tốt nhất cho dự án). Trọng số do người viết đặt theo mục tiêu ghi trong đề bài (hình đẹp, sản xuất hiệu quả, chi phí hợp lý, lâu dài) và theo E6. Toàn bộ điểm là [NHẬN ĐỊNH]; cột "Căn cứ" chỉ ra dữ kiện.

| Tiêu chí | Trọng số | A | A+ | B | C | Căn cứ |
|---|---|---|---|---|---|---|
| Chất lượng hình tĩnh đạt được với nguồn lực hiện có | 12 | 4 | 4 | 3 | 2 | E2: 3D do agent làm kém tranh; tranh 2D đã được duyệt từng Area |
| Thể hiện nhân vật, animation thân | 10 | 3 | 4 | 4 | 4 | E4: A thiếu khung trung gian; 3D có nội suy nhưng phụ thuộc rig và clip tốt (E7) |
| Thể hiện skill, Ultimate | 8 | 3 | 4 | 4 | 4 | Chi tiết ở `02_PHAN_TICH_ANIMATION_SKILL.md` |
| VFX | 6 | 4 | 4 | 3 | 3 | E3: VFX 2D đã đạt; sang 3D phải làm billboard hoặc làm lại |
| Tương tác môi trường, camera, chiều sâu | 6 | 2 | 2 | 4 | 5 | 3D mạnh thật ở camera tự do và che khuất |
| Trải nghiệm tổng thể, nhất quán giữa các Area | 6 | 4 | 4 | 2 | 4 | B có hai ngôn ngữ hình trong một game |
| Giữ phong cách Sobi (tròn, pastel, nét) | 8 | 5 | 4 | 3 | 2 | E2; `05` mục 1.3 |
| Tái sử dụng asset và code đã có | 8 | 5 | 5 | 3 | 1 | E1, E9 |
| Mở rộng nội dung (thêm loài, skill) | 6 | 3 | 3 | 3 | 4 | 3D tái dùng clip theo skeleton tốt, nếu có người làm được clip |
| Độ phức tạp kỹ thuật | 6 | 5 | 4 | 2 | 1 | B: hai renderer; C: viết lại lớp scene |
| Chi phí tiền và thời gian | 8 | 5 | 4 | 2 | 1 | `08_CHI_PHI_HIEU_QUA_DAI_HAN.md` |
| Hiệu năng, dung lượng | 4 | 4 | 3 | 3 | 3 | A+ thêm tranh làm tăng bộ nhớ texture; 3D nhẹ file nhưng nặng GPU tích hợp |
| Phụ thuộc nhân sự chuyên môn | 6 | 4 | 3 | 1 | 1 | E6, E7: bước 4, 7, 8 của pipeline cần nghệ sĩ 3D |
| Khả năng dùng AI ngay hôm nay | 6 | 4 | 3 | 2 | 2 | AI ảnh 2D đã dùng được; AI 3D dừng ở mức 2–4 |
| **Tổng (trên 500)** | 100 | **394** | **374** | **286** | **260** | |

Cách tính: tổng của trọng số × điểm. Kiểm tra độ nhạy [NHẬN ĐỊNH]: gấp đôi trọng số ba dòng 3D mạnh nhất (animation thân, skill, camera / chiều sâu) **và** bỏ hẳn hai dòng tái sử dụng, chi phí (tổng trọng số thành 108) thì được A 380, A+ 386, B 342, C 346. A và A+ vẫn đứng trên nhưng khoảng cách còn khoảng 10 %, và A+ vượt A. Thứ hạng chỉ đảo khi giả định dự án có nghệ sĩ 3D và người làm animation 3D; khi đó hai dòng "phụ thuộc nhân sự" và "chất lượng hình" của B, C tăng 2–3 điểm mỗi dòng. Nói cách khác, kết quả phụ thuộc vào nguồn lực (E6) nhiều hơn là vào bản chất 2D hay 3D.

## 4. Theo từng Area

| Area | Gameplay cần gì ở hình ảnh | A | B | C | Kết luận |
|---|---|---|---|---|---|
| **Farm** (cây trồng, heo, tương tác) | Đọc nhanh trạng thái ô, heo; nhiều vật nhỏ; nhìn từ trên xuống | Hợp. Thiếu: heo đi / ăn / ngủ còn ít khung; rig chưa dùng ở Farm (roadmap R5) | Giữ 2D | Phải dựng lại 89 dòng heo, cây trồng nhiều giai đoạn, 26 công trình. Mẫu heo và chuồng 3D đã trượt U1 (E2) | 3D không giải quyết vấn đề nào Farm đang có. Nâng cấp: rig cho heo, ánh sáng theo giờ |
| **Garden** (cây cảnh, chậu, trang trí) | Vật tĩnh đẹp, sưu tầm, bố cục | Hợp nhất: tranh minh hoạ là thế mạnh | Giữ 2D | Lợi duy nhất: xoay chậu khi ngắm. Chi phí: mỗi cây cảnh một model có texture vẽ tay | 2D. Nếu muốn "xoay ngắm": render sẵn 8 góc cho vài vật hiếm |
| **Aquarium** (cá, nước) | Cá bơi mượt, nước, ánh sáng | Điểm yếu thật: sheet bơi vẽ lại lệch nhận diện (E5); đang dùng dải uốn thủ tục | Giữ 2D | Cá là body-plan đơn giản nhất cho 3D (thân uốn, ít khớp); nước 3D tốn công shader | Ứng viên tốt nhất cho A+ ngoài Adventure: model cá → render sheet bơi. Mẫu Cá Vàng U1 "nghèo chi tiết" nên vẫn phải qua cổng |
| **Cloud** (đất mây, vật thể) | Tầng mây, hoa, không khí nhẹ | Hợp; thị sai nhiều lớp đủ tạo chiều sâu | Giữ 2D | Mây thể tích 3D đắt và khó giữ pastel | 2D |
| **Adventure** (khám phá, chiến đấu, skill) | Động tác có trọng lượng, đòn khớp sát thương, Ultimate, camera | Đã có timeline, mốc windup / release / contact, 112 kịch bản skill. Thiếu: khung trung gian, quay người, camera | Lợi thật: nội suy mọi tư thế, camera cho Ultimate, một clip dùng cho mọi con cùng skeleton | Như B | Nơi duy nhất 3D có lợi ích rõ. Nhưng lợi ích đó nằm ở bước AI yếu nhất (rig và animation non-humanoid, E7) |

## 5. B và C so với đường 050 + 051

| Câu hỏi | Trả lời | Nhãn |
|---|---|---|
| Khác gì | 050 + 051: game 2D, 3D (nếu có) chỉ ở xưởng và bị render thành PNG. B / C: model 3D chạy trong game, cần renderer 3D, ánh sáng và camera runtime | [DỮ LIỆU] `docs/decisions/051` §1; [NHẬN ĐỊNH] |
| Thừa kế được | (1) Toàn bộ `src/core` và logic trận, vì đã tách khỏi Phaser (E8, E9). (2) Lớp dữ liệu trung lập: beat `cast / release / impact / end`, mốc clip `windup / release / contact / recover`, bộ cử chỉ `GESTURE_VALUES`, 112 kịch bản `battle_fx.json`, điểm neo `mouth` / `tail`. (3) Phân loại body-plan và `tempo` / `weight` từng loài. (4) Công cụ xưởng: Unity batchmode CLI, script nhập, chụp trong game, Xưởng rig, Xưởng trận. (5) Tranh đã duyệt làm đầu vào image-to-3D và làm chuẩn so sánh | [DỮ LIỆU] `docs/decisions/050` bổ sung 2026-11-05; `docs/studio/STATUS.md` |
| Bỏ phí | (1) 44 rig pose-to-pose và 814 file layer rig. (2) `src/ui/puppet/` và phần vẽ Phaser của trận (15 file trong `scene/battle`, khoảng 2450 dòng). (3) 266 file key pose trận chỉ còn làm tham chiếu. (4) Với C: gần như toàn bộ 2547 PNG trừ UI và icon. (5) VFX sheet 2D dùng lại được dưới dạng billboard, nhưng mất lý do để chuyển sang 3D ở lớp VFX | [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2; đếm dòng ngày 2026-11-11; [NHẬN ĐỊNH] |
| 051 đã tới đâu | U0 xong. U1 (tạo lại hình) không đạt, dừng. VFX vẽ hình bằng Unity không đạt. VFX chuyển động trên tranh có sẵn đạt, 22/23 sheet đã vào game. U2–U10 dừng. Không có ảnh Studio nào thay art nhân vật hay môi trường | [DỮ LIỆU] `docs/studio/STATUS.md`; `docs/decisions/051` cập nhật (1)–(4) |

Điểm cần nói thẳng [NHẬN ĐỊNH]: B và C đòi đúng thứ mà U1 đã cho thấy dự án chưa làm được (hình 3D đẹp ngang tranh), rồi đòi thêm rig, animation và renderer runtime. Bằng chứng mới duy nhất so với ngày 2026-11-07 là giả thuyết "mesh lấy từ tranh đã duyệt bằng image-to-3D sẽ đẹp hơn mesh dựng bằng toạ độ". Giả thuyết này hợp lý nhưng chưa được đo trên tranh Sobi.

## 6. Vấn đề nào thật sự cần 3D

| Vấn đề đang có | Giải bằng 2D | Cần 3D runtime? |
|---|---|---|
| Thiếu khung trung gian giữa các key pose | Vẽ thêm 2–4 tranh trung gian mỗi con (đã đề xuất trong 050); hoặc A+ | Không |
| Nhân vật như ảnh tĩnh bị di chuyển | Đã xử lý phần lớn bằng pose-to-pose + lưới nén / giãn; còn lại là tranh trung gian | Không |
| Quay người, đổi góc nhìn, foreshortening | Vẽ thêm góc; đắt nếu cần nhiều góc | Có lợi rõ nếu gameplay cần nhiều góc. Trận hiện nhìn ngang một góc nên chưa cần |
| Camera Ultimate (áp sát, xoay quanh) | Zoom, pan, cut-in 2D (`fxCutin.ts` đã có), thị sai | Xoay quanh nhân vật thì cần 3D; nhưng tài liệu animation không đòi camera xoay (E10) |
| Đồng bộ đòn đánh với sát thương | Đã giải bằng mốc clip và beat | Không liên quan 2D hay 3D |
| Chiều sâu sân trận | Thị sai nhiều lớp, bóng, sương, ánh sáng 2D | Không |
| Vật liệu, ánh sáng động trên nhân vật | Normal map cho sprite + Light2D của Phaser; chi phí: mỗi tranh một normal map | 3D làm tự nhiên hơn |
| Cá bơi mượt | Dải uốn thủ tục (đang dùng); A+ render sheet từ model | Không |
| Bạn đồng hành trên bản đồ là ảnh tĩnh; đi nhiều hướng | Mỗi hướng một bộ tranh cho từng loài: tốn | Lợi ích 3D rõ nhất của Adventure nằm ở đây, không ở sân trận (`02` mục 1.7, V9). A+ cũng giải được: render 4 hướng từ model |
| Đòn nhiều nhát chỉ có một mốc `impact` | Việc dữ liệu: mở rộng schema timing | Không liên quan 2D hay 3D |

## Điều chưa xác minh

- Điểm số ở mục 3 chưa có prototype đối chứng; các dòng của B, C dựa vào khảo sát công cụ, không phải thử thật.
- Chưa xem HTML prototype (xem `03`).
- Chi phí vẽ thêm tranh trung gian bằng Gemini cho 43 con (tỉ lệ lệch nhận diện ở sinh vật trận) chưa có số; mới có hai điểm dữ liệu trái chiều (cá không được, chim sẻ được).

## Cần chủ dự án cung cấp/duyệt

- Xác nhận trọng số ở mục 3 có phản ánh ưu tiên của chủ dự án không; nếu chủ dự án đặt "chiều sâu, camera" cao hơn hẳn thì cần chấm lại.
- Trận Adventure có định hướng đổi góc nhìn hoặc cho nhân vật di chuyển tự do trong không gian không. Nếu có, lợi ích của B tăng đáng kể.
