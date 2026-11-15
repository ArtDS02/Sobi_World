# 00 — Executive Summary: chiến lược 2D / Hybrid / 3D cho Sobi World

Ngày: 2026-11-11. Giai đoạn này chỉ nghiên cứu: không có source, content, asset hay dependency nào bị sửa; không commit. Nhãn dùng trong cả bộ: [DỮ LIỆU] đọc được trong repo hoặc nguồn chính thức · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

## Khuyến nghị

**Giữ 2D (phương án A) làm đường chính cho bản 1.0. Loại C. Hoãn B tới sau 1.0, và chỉ mở lại nếu prototype có cổng chấm đặt trước cho kết quả đạt.**

Kèm một nhánh thử hẹp gọi là **A+**: dùng 3D ở xưởng offline để render tranh trung gian và tranh nhiều hướng từ model dựng theo tranh đã duyệt; game vẫn 2D hoàn toàn. Nhánh này chưa được thử và có điều kiện dừng ngay ở bước đầu. [NHẬN ĐỊNH]

Chưa có phép thử nào được chạy. Khuyến nghị dựa trên code, tài liệu trong repo và khảo sát công cụ; `09_PROTOTYPE_VA_TIEU_CHI.md` là cách kiểm chứng.

## Hiện trạng

| Mục | Dữ kiện | Nguồn |
|---|---|---|
| Giai đoạn | GĐ14 (art, animation, VFX, âm thanh) đang làm; gameplay đã freeze ở GĐ13; nhánh hiện tại hơn `main` 238 commit | `01` mục 1 |
| Stack | Electron 44, Vite 8, TypeScript 6, Phaser 3.90; một `Phaser.Game`; không có thư viện 3D | `01` mục 2 |
| Asset | Manifest 2455 dòng, 27 còn placeholder; 2664 PNG, 561 MB; tranh do Gemini vẽ, chủ dự án render | `01` mục 4 |
| Tách lớp | `src/core`, `src/systems`, `areas/*/logic` không import Phaser hay DOM. Đổi sang 3D: giữ 69,6 % dòng, chỉnh 10,7 %, viết lại 19,7 %. Riêng B đụng khoảng 9–11 % | `01` mục 3 |
| Animation trận | 112/112 skill có kịch bản VFX. Thân: 43 sinh vật chạy pose-to-pose trên 6 key pose, 25 clip chung, chưa có clip riêng theo skill; chuyển giữa hai tranh là hoà 70 ms | `02` mục 1.5; `docs/decisions/050` |
| Decision 050 | 44 rig. Bộ phận cắt rời: hình xấu, bỏ. Skin một ảnh: chủ dự án bác. Hiện dùng pose-to-pose; đang chờ chủ dự án chấm | `01` mục 6.1 |
| Decision 051 | Unity dựng 3D bằng code rồi render ra 2D: cổng U1 không đạt (4/4 mẫu không đẹp hơn tranh cũ), đã dừng. Chỉ còn dùng để thêm chuyển động cho VFX có sẵn: 22/23 sheet đã vào game | `docs/studio/STATUS.md` |
| HTML prototype | **Không tìm thấy** trong repo; chưa kiểm tra được | `03` |
| Máy dự án | RTX 3050 6 GB VRAM, RAM 16 GB | đo 2026-11-11 |
| Nhân sự | Chủ dự án + AI agent; không có nghệ sĩ 3D | `docs/decisions/022`, `051` |

## Năm lý do chính

1. **Phần lớn vấn đề đang có không phụ thuộc 2D hay 3D.** Trong 10 vấn đề về độ sống động của Adventure, 3D có lợi thế cấu trúc ở 3 (bộ phận lệch nhịp, chuyển tiếp giữa tư thế, nhân vật đi nhiều hướng trên bản đồ). Bảy vấn đề còn lại là việc dữ liệu, VFX 2D hoặc chưa playtest. (`02` mục 1.7)
2. **Thiết kế animation không đòi thứ chỉ 3D mới có.** Trận theo lượt, góc máy cố định, chỉ cần cut-in và zoom nhẹ. Phân loại 112 skill: khoảng 3 % lợi lớn từ 3D, 13 % lợi vừa, 84 % lợi ít hoặc không. (`02` mục 5)
3. **Bằng chứng 3D duy nhất của dự án là âm tính.** Cổng U1 cho kết quả "đồng bộ hơn nhưng không đẹp hơn, như đồ nhựa". Nó chỉ nói về hình dựng bằng code, nên không loại mọi dạng 3D, nhưng cho thấy 3D không tự làm hình đẹp hơn. (`03` mục 3)
4. **AI chưa gánh được phần khó.** Tới 11/2026: mesh xoay được thì có; topology cho biến dạng và rig cho cánh, cá, tỷ lệ chibi chập chờn; animation cho sinh vật không phải người gần như không có. Model tốt cần 8–24 GB VRAM, máy dự án có 6. Chuỗi công cụ mở còn vướng giấy phép khi bán thương mại. (`05` mục 5; `07` mục 5)
5. **Chi phí và thời điểm.** Dự án ở cuối giai đoạn art. Ước lượng công: A 16–31 phiên agent, A+ 20–38, B 85–170, C 280–550 (độ tin cậy thấp với B, C). B và C ở chất lượng thương mại cần người làm rig và animation 3D. (`08`)

## So sánh nhanh

| | A | A+ | B | C |
|---|---|---|---|---|
| Điểm có trọng số (trên 500) | 394 | 374 | 286 | 260 |
| Giữ art đã duyệt | Toàn bộ | Toàn bộ | Bỏ phần trình diễn trận: 44 rig, 814 layer | Bỏ gần hết trừ UI |
| Cần nghệ sĩ 3D | Không | Không bắt buộc | Có | Có |
| Lùi GĐ15 | Không | Ít, có điều kiện dừng | Nhiều | Không xác định |
| Đã có bằng chứng trong repo | Có (VFX chuyển động đạt cổng) | Chưa | Chưa | Âm tính (U1) |

Điểm là [NHẬN ĐỊNH]; cách chấm và phép thử độ nhạy ở `04` mục 3. Thứ hạng phụ thuộc vào nguồn lực nhiều hơn vào bản chất 2D hay 3D: nếu có đội 3D, B và C tăng đáng kể.

Theo Area: Farm, Garden, Cloud không có vấn đề nào 3D giải quyết. Aquarium (cá bơi) và Adventure (tranh trung gian, đi nhiều hướng) là hai nơi A+ có thể giúp. Adventure là nơi duy nhất B có lợi ích rõ. (`04` mục 4)

## Quyết định cần chủ dự án duyệt

1. Đồng ý A làm đường chính cho 1.0, loại C, hoãn B sau 1.0?
2. Có HTML prototype không? Nếu có, gửi file hoặc ảnh và video. Nếu chủ dự án chấm nó đẹp hơn art hiện tại thì khuyến nghị này phải xét lại.
3. Duyệt phép thử 2D (P-1): tranh trung gian, tranh chạy, tranh mặt sau cho 3 sinh vật; cần 3 lượt Gemini và đụng `content/`, `art_inbox/`.
4. Cho phép thử A+ (P-2, P-3): đưa 3 tranh đã duyệt lên dịch vụ image-to-3D hoặc thuê GPU, cài Blender ngoài repo. Trần ngân sách đề xuất dưới 30 USD.
5. Game có bán ở EU, UK, Hàn Quốc không? Câu trả lời "có" loại hẳn họ Hunyuan3D mở.
6. Có kế hoạch thuê người làm 3D không? Câu trả lời "không" loại B và C ở chất lượng thương mại.
7. Duyệt hai việc trung lập với 2D / 3D: nhiều mốc `impact` cho đòn nhiều nhát, phản ứng trúng có ngữ nghĩa. (`10` mục 4)

Việc phát hiện thêm cần chủ dự án biết:

- `docs/THIRD_PARTY.md` chưa có dòng nào cho Gemini, nguồn của toàn bộ art hiện có; dòng Mureka mâu thuẫn giữa manifest và `THIRD_PARTY.md`. (`07` mục 2.7, 6.1)
- Tài liệu animation "FINAL" dòng 5 nêu tên một game bên thứ ba làm phong cách tham khảo: cần rà theo decision 048. (`02`)
- Unity Personal có ngưỡng 200.000 USD trong 12 tháng; điều khoản không nói rõ trường hợp chỉ dùng Editor để render. (`07` mục 2.5)
- Tài liệu animation gắn skill theo dòng Guardian và lớp, không theo loài; vài mô tả động tác không khớp con đang diễn. (`02`)

## Bộ file

| File | Nội dung |
|---|---|
| `01_HIEN_TRANG.md` | Kiến trúc, số đo tách lớp, asset, animation, trạng thái 050 / 051 |
| `02_PHAN_TICH_ANIMATION_SKILL.md` | Adventure chuyên sâu, phân tích từng nhóm skill, thiết kế nếu đi 3D, hệ thống dùng chung |
| `03_PHAN_TICH_HTML_PROTOTYPE.md` | Không tìm thấy prototype; phân tích thay thế từ cổng U1 |
| `04_SO_SANH_2D_HYBRID_3D.md` | Bảng chấm có trọng số, theo Area, so với 050 + 051 |
| `05_CONG_NGHE_AI_3D.md` | Sáu mức 2D→3D, bảng công cụ, khả năng chạy trên 6 GB |
| `06_PIPELINE_TU_DONG_HOA.md` | 12 bước, ai làm bước nào, ba cấu hình pipeline |
| `07_BAN_QUYEN.md` | Giấy phép code / weights / dataset / đầu ra, danh sách loại, sổ nguồn gốc |
| `08_CHI_PHI_HIEU_QUA_DAI_HAN.md` | Khối lượng, ước lượng, dài hạn |
| `09_PROTOTYPE_VA_TIEU_CHI.md` | Nội dung thử, 4 chặng, 15 tiêu chí và ngưỡng |
| `10_KHUYEN_NGHI_VA_LO_TRINH.md` | Khuyến nghị, điều kiện đổi ý, lộ trình, ảnh hưởng decision |
| `11_NGUON_THAM_KHAO.md` | Nguồn repo và web |
| `PROS_CONS_A_2D.md`, `PROS_CONS_B_HYBRID.md`, `PROS_CONS_C_3D.md` | Lợi / hại có trọng số từng phương án |

## Điều chưa xác minh

- Chưa chạy thử công cụ nào; "chạy được trên 6 GB" là đối chiếu số công bố.
- Chưa xem HTML prototype; chưa mở `art_inbox.rar` (2,4 GB, máy không có công cụ giải nén); chưa tìm ngoài repo.
- Một phần khảo sát web (retopo / UV, Blender, runtime three.js / Babylon.js) là kiến thức nền chưa mở nguồn; một số trang điều khoản không mở được (liệt kê ở `11`).
- Tài liệu animation "FILLED": phần 112 khối skill ở giữa được đọc bằng cách tách dòng lặp, không đọc nguyên văn từng dòng (`02` mục 0).
- Người viết phần bản quyền không phải luật sư; không có cam kết an toàn pháp lý.
- Mọi ước lượng công và điểm số là nhận định, chưa có prototype đối chứng.

## Cần chủ dự án cung cấp/duyệt

Bảy câu ở mục "Quyết định cần chủ dự án duyệt", và HTML prototype nếu có.
