# 09 — Prototype kiểm chứng và tiêu chí (mục J)

Ngày: 2026-11-11. **Chỉ là đề xuất; chưa làm gì.** Mọi bước dưới đây cần chủ dự án duyệt riêng. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

## 1. Prototype phải trả lời câu hỏi gì

| # | Câu hỏi | Vì sao là câu hỏi quyết định |
|---|---|---|
| Q1 | Thêm 2–3 tranh trung gian (2D) có làm đòn đánh "có trọng lượng" tới mức chủ dự án chấp nhận không? | Nếu có, phần lớn lý do sang 3D biến mất (`04` mục 6) |
| Q2 | Image-to-3D từ tranh Sobi đã duyệt có ra model **giống tranh** khi nhìn từ đúng góc tranh không? | Đây là giả thuyết duy nhất khác với U1 đã trượt |
| Q3 | Model đó có rig và diễn được clip non-humanoid mà không cần nghệ sĩ 3D không? | Bước AI yếu nhất (`05` mục 5) |
| Q4 | Ảnh render từ model có đặt xen được với tranh gốc trong một clip mà không lộ không? | Điều kiện của A+ |
| Q5 | Bản 3D runtime có hơn bản 2D tốt nhất ở cùng một đòn đánh, theo mắt chủ dự án, đủ để trả giá ở `08` không? | Điều kiện của B |

Thứ tự rẻ → đắt. Trả lời "không" ở Q2 thì dừng Q3–Q5. Trả lời "có" ở Q1 và "không" ở Q5 thì chốt A.

## 2. Nội dung thử (cùng một bộ cho mọi nhánh)

Lựa chọn đã đối chiếu với `02_PHAN_TICH_ANIMATION_SKILL.md` mục 8 (trích dòng của tài liệu animation "FINAL" nằm ở đó). Chỗ hai bên khác nhau được ghi ở cột lý do.

| Vai | Chọn | Lý do |
|---|---|---|
| Animal đơn giản | Heo Rừng `pig_boar` (bốn chân) | Prototype số 1 của decision 050: đã có tranh duyệt, bộ phận vẽ tay, skin, pose-to-pose, tức có sẵn 3 bản 2D để so [DỮ LIỆU] `docs/decisions/050` §6 và bổ sung (1)–(5) |
| Animal cấu trúc phức tạp | Heo Phượng Hoàng `pig_phoenix` (thân bay, có cánh) | Chưa có rig `flyer` nào; có tuyệt kỹ riêng `skill_ult_phoenix`, skill duy nhất của nhóm tuyệt kỹ được xếp lợi ích 3D "lớn" [DỮ LIỆU] `02` mục 2.2, mục 5 |
| Quái | Ưng Vách Đá `enemy_cliff_hawk` | `skill_e_spark_peck` (mổ 2 nhát), `skill_e_dive` (bay khỏi khung, bổ nhào); đã có 3 tranh bay vẽ tay để so [DỮ LIỆU] `02` mục 8 |
| Quái thứ hai (tuỳ chọn) | Hộ Pháp Cổ Đại (dáng `front`, nặng) | Chính con mà chủ dự án chê "đòn đánh không giống tranh attack"; đã có tranh `windup` vẽ thêm làm mốc [DỮ LIỆU] `docs/decisions/050` bổ sung (5); `docs/PROGRESS.md` |
| Đối chứng ngoài Adventure (tuỳ chọn) | Cá Betta `fish_betta` | Chỗ 2D đang mạnh (thân uốn bằng Rope) và cũng là chỗ sheet vẽ lại thất bại; cho số liệu về Aquarium |
| Môi trường nhỏ | Một sân trận vùng rừng: nền + 2 lớp thị sai + mặt đất | Nhỏ nhất đủ để thấy ánh sáng và chiều sâu |
| Tương tác | Chọn mục tiêu; đòn trúng đẩy lùi; KO ngã; một bạn đồng hành đi 4 hướng trên bản đồ | Đi 4 hướng là nơi `02` dự đoán 3D lợi nhất (vấn đề V9) |
| Tình huống chiến đấu | 2 đấu 2: Heo Rừng + Heo Phượng Hoàng đấu Ưng Vách Đá + một quái nhỏ | Đủ đòn đơn, diện rộng, phản ứng trúng |
| Cận chiến đơn | Đánh thường của 3 thân (húc, mổ 2 nhát, quẫy đuôi) | Clip theo body-plan; `contact` trùng số sát thương |
| Cận chiến phức tạp | `skill_cl_combo` (đấm, xoay đá, nhảy đập) | 3 mốc impact, chuyển tiếp giữa 3 động tác, xoay người; hiện chạy bằng spin / hop cả ảnh |
| Động tác ngoài mặt phẳng | `skill_cl_taunt` (quay lưng) | 2D cần tranh mặt sau; 3D có sẵn |
| Phóng chiêu | `skill_nh_bubble` | Phồng má, đạn nảy, mục tiêu bị nhốt rồi rơi bẹp: bài thử squash cho 3D |
| Diện rộng nguyên tố | `skill_qs_quake` | Decal mặt đất, phản ứng "bị hất lên"; đã có `gesture` khai rõ [DỮ LIỆU] `docs/decisions/050` bổ sung 2026-11-05 mục 7 |
| Hỗ trợ | `skill_cl_second_wind` | Diễn xuất thuần squash; `02` dự đoán 2D tương đương hoặc hơn, dùng làm đối chứng ngược |
| Ultimate | `skill_ult_phoenix` | Vật thể sống bay vòng, cut-in, 3 nhịp, ≤ 3,5 giây |
| Phản ứng | Chí mạng + Vỡ Băng | Hit-stop dừng cả thân |
| Clip | idle, walk (`move`), run, attack, cast, hurt, KO, victory | `run` chưa có trong 25 clip chung: phải thêm ở mọi nhánh |

Bộ skill cố ý gồm cả skill mà 3D được dự đoán thắng (`skill_cl_combo`, `skill_cl_taunt`, `skill_ult_phoenix`) lẫn skill mà 2D được dự đoán ngang hoặc hơn (`skill_cl_second_wind`, `skill_nh_bubble`), để prototype không thiên về bên nào. Theo phân loại ở `02` mục 5, khoảng 3 % skill lợi lớn từ 3D, 13 % lợi vừa, 34 % lợi ít, 50 % không lợi (sai số ±5 skill trên 112).

## 3. Ba nhánh, bốn chặng

Nơi làm: nhánh 2D làm trong Admin "Xưởng rig" / "Xưởng trận" sẵn có (cần duyệt riêng vì đụng `content/`). Mọi thứ 3D làm trong **thư mục tạm ngoài repo**, không thêm dependency vào `package.json`.

| Chặng | Việc | Trả lời | Ngân sách đề xuất | Điều kiện dừng |
|---|---|---|---|---|
| **P-0** | Chủ dự án chấm rig hiện tại (ACCEPTANCE A10–A13, B8) và gửi HTML prototype nếu có | Mức xuất phát | 1 lượt duyệt | — |
| **P-1 (2D)** | Vẽ `windup` + 1 tranh giữa đòn + 1 tranh `run` cho 3 sinh vật, cộng tranh mặt sau cho `skill_cl_taunt`, trong **một sheet mỗi con** cùng tranh idle làm mẫu; nối vào khe `pose`; thêm thị sai, tint ánh sáng và zoom cho Ultimate | Q1 | 3 lượt Gemini, 2–3 phiên agent, 0 USD | Tranh mới lệch nhận diện ở ≥ 2/3 con sau 2 lượt vẽ → ghi nhận rủi ro a2, chuyển sang P-2 với lý do rõ hơn |
| **P-2 (mesh)** | Image-to-3D cho 3 sinh vật từ tranh idle (thử 2 công cụ thuộc danh sách chấp nhận được ở `07`); render toon từ đúng góc tranh; đặt chồng lên tranh gốc | Q2 | 1 phiên, 0–10 USD | Không con nào đạt tiêu chí 1 và 2 ở bảng mục 4 → **dừng toàn bộ nhánh 3D**, chốt A |
| **P-3 (rig + clip, A+)** | Rig theo body-plan trong Blender headless; 8 clip; render tranh trung gian; đặt vào clip pose-to-pose của P-1 | Q3, Q4 | 3–5 phiên, 0–20 USD | Sau 2 vòng chỉnh mỗi con vẫn cần sửa weight bằng tay ở hơn một vùng, hoặc ảnh render lộ khi xen với tranh → dừng, chốt A với tranh trung gian vẽ |
| **P-4 (runtime, B)** | Trang HTML độc lập: 3 model, sân trận nhỏ, tình huống 2 đấu 2, 5 skill, đọc cùng timeline beat | Q5 | 4–6 phiên | Không hơn bản P-1 theo chấm của chủ dự án, hoặc dưới 60 fps trên GPU tích hợp → dừng, B không đạt |

Chỉ mở chặng sau khi chặng trước có kết quả. Tổng trần [GIẢ ĐỊNH]: khoảng 10–15 phiên agent, dưới 50 USD, 6–8 lượt duyệt.

Việc cần hỏi trước khi làm, theo giới hạn quyền của giai đoạn này: cài Blender (ngoài repo); mỗi lần đưa tranh lên dịch vụ ngoài; mỗi file tải về (tên, nguồn, dung lượng).

## 4. Mười lăm tiêu chí và ngưỡng đạt (đặt trước khi làm)

Chấm 0–2 (0 không đạt, 1 đạt có điều kiện, 2 đạt). Người chấm cuối là chủ dự án; agent chấm trước và phải ghi rõ đã soi ở độ phân giải nào, cạnh mẫu nào (luật `HANDOFF.md` §2 mà `docs/UNITY_STUDIO_PLAN.md` §3.8 nhắc lại).

| # | Tiêu chí | Cách đo | Ngưỡng đạt (2 điểm) | Loại trực tiếp nếu 0? |
|---|---|---|---|---|
| 1 | Trung thành thiết kế 2D | Render từ góc tranh, đặt chồng 50 % lên tranh duyệt; đặt cạnh nhau ở 100 % | Hình bao lệch ≤ 5 % chiều cao; mắt, mõm, phụ kiện đúng chỗ; chủ dự án nhận ra ngay là cùng một con | **Có** |
| 2 | Model (hình khối, mặt sau) | Xoay 8 góc | Không lỗ, không dính chi vào thân; mặt sau hợp lý, không chi tiết lạ | **Có** |
| 3 | Topology | Wireframe; đếm tam giác | ≤ 15k tam giác; có vòng cạnh ở cổ và gốc chi; không ngôi sao cực ở mặt | Không (với A+); **Có** (với B) |
| 4 | Rig / skin | Bẻ từng khớp tới biên độ của clip | Không rách, không lem weight thấy được ở cỡ hiển thị | **Có** |
| 5 | Animation | 8 clip cạnh clip 2D hiện tại, ×0,25 và ×1 | Có lấy đà, theo đà, nén / giãn; chân không trượt; chủ dự án chấm ≥ bản P-1 | **Có** |
| 6 | VFX | 5 skill trong tình huống 2 đấu 2 | VFX xuất hiện đúng mốc release / impact (lệch ≤ 1 khung ở 60 fps); đọc được hệ nguyên tố | Không |
| 7 | Ánh sáng / vật liệu | Ảnh tĩnh trong sân trận | Không bóng nhựa; pastel đúng bảng màu tranh (ΔE trung bình vùng da ≤ 10); có rim và bóng tiếp đất | Không |
| 8 | Hình ảnh tổng thể | Ảnh trong game cạnh bản hiện tại | Chủ dự án trả lời "đẹp hơn" (câu (a) của cổng U1) | **Có** |
| 9 | Tích hợp engine | Đọc cùng beat / mốc; HUD DOM không đổi | Không sửa `src/core`, không sửa logic trận; số sát thương trùng contact | **Có** |
| 10 | Hiệu năng | Đo trên GPU tích hợp và trên máy dự án | ≥ 60 fps ở 1080p; bộ nhớ đồ hoạ thêm ≤ 150 MB cho một trận | Không |
| 11 | Thời gian | Ghi số phiên và số vòng chỉnh mỗi con | ≤ 2 phiên cho con thứ ba (sau khi pipeline đã có) | Không |
| 12 | Tự động hóa | Đếm bước cần tay người | Bước 1, 5, 9, 12 của `06` tự động; bước 3, 6 chỉ cần duyệt | Không |
| 13 | Chi phí | Tổng credit / giờ GPU | ≤ 5 USD mỗi sinh vật dùng được | Không |
| 14 | Bản quyền | Sổ nguồn gốc đầy đủ cho từng asset; điều khoản đã chụp | Mọi công cụ thuộc nhóm "chấp nhận được" của `07`; rà theo `docs/IP_AUDIT_PROMPT.md` không có cảnh báo | **Có** |
| 15 | Sản xuất hàng loạt | Chạy lại pipeline cho con thứ ba không sửa code | Con thứ ba đạt tiêu chí 1, 2, 4 trong ≤ 2 vòng | Không (với prototype); **Có** (trước khi mở rộng) |

Quy tắc quyết định:

- **Đạt** = không có tiêu chí "loại trực tiếp" nào bằng 0, và tổng ≥ 22/30.
- **A+ đạt** khi P-3 đạt các tiêu chí 1, 2, 4, 5, 8, 14 (tiêu chí 3, 9, 10 không áp dụng cho ảnh render).
- **B đạt** khi P-4 đạt đủ, **và** tiêu chí 8 được chủ dự án chấm hơn bản P-1 chứ không chỉ hơn bản hiện tại.
- Không đổi ngưỡng sau khi đã thấy kết quả. Nếu muốn đổi, ghi lý do vào decision trước khi chấm lại.
- Không che kết quả xấu để đi tiếp (giữ luật §10.1 của `docs/UNITY_STUDIO_PLAN.md`).

## Điều chưa xác minh

- Cấu trúc tranh `pig_phoenix` và art id của Hộ Pháp Cổ Đại: chưa mở ảnh.
- Tài liệu animation gắn skill theo dòng Guardian và lớp, không theo loài; một số mô tả ("rùa húc", "xoay xúc tu") không khớp con đang diễn (`02`). Cần chủ dự án xác nhận con nào diễn skill nào trước khi dựng.
- Ngưỡng ΔE và 15k tam giác là giá trị khởi điểm do người viết đặt [GIẢ ĐỊNH]; cần chỉnh sau con đầu tiên, trước khi chấm.

## Cần chủ dự án cung cấp/duyệt

- Duyệt danh sách nội dung thử ở mục 2 hoặc đổi con / skill.
- Duyệt từng chặng P-1 → P-4 riêng; P-1 đụng `content/` và `art_inbox/` nên nằm ngoài quyền của giai đoạn nghiên cứu này.
- Cho biết máy cấu hình thấp nhất mà game nhắm tới (để đo tiêu chí 10).
