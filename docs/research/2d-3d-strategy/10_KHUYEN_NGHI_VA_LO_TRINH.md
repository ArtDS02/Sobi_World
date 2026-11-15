# 10 — Khuyến nghị cuối và lộ trình (mục K)

Ngày: 2026-11-11. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH]. Đây là khuyến nghị để chủ dự án quyết; chưa có gì được triển khai.

## 1. Khuyến nghị

**Chọn A (toàn bộ 2D, nâng cấp) làm đường chính cho bản 1.0. Không chọn C. Chưa chọn B; chỉ xét B sau 1.0 và chỉ khi một prototype nhỏ, có cổng chấm đặt trước, cho kết quả đạt.**

Kèm một nhánh thử hẹp **A+**: dùng 3D ở xưởng offline (image-to-3D từ tranh đã duyệt → Blender headless → render toon ra PNG) để sinh tranh trung gian và tranh nhiều hướng. Game vẫn 2D hoàn toàn. Nhánh này chỉ mở sau khi phép thử 2D thuần (P-1) có kết quả, và dừng ngay ở cổng đầu nếu model không giống tranh.

Toàn bộ khuyến nghị là [NHẬN ĐỊNH] dựa trên các dữ kiện dưới đây.

## 2. Vì sao

| # | Lý do | Căn cứ |
|---|---|---|
| 1 | Vấn đề đang có phần lớn không phải vấn đề 2D hay 3D. Trong 10 vấn đề về độ sống động và đồng bộ của Adventure, 3D có lợi thế cấu trúc ở 3 (bộ phận lệch nhịp, chuyển tiếp giữa tư thế, đi nhiều hướng trên bản đồ); 7 vấn đề còn lại trung tính hoặc không liên quan | [DỮ LIỆU + NHẬN ĐỊNH] `02` mục 1.7 |
| 2 | Tài liệu animation không đòi thứ chỉ 3D mới có. Trận theo lượt, góc máy cố định, chỉ cần cut-in và zoom 1,04–1,06×. Chỉ khoảng 3 % skill lợi lớn từ 3D, 13 % lợi vừa | [DỮ LIỆU + NHẬN ĐỊNH] `02` mục 1.2, mục 5 |
| 3 | Bằng chứng 3D duy nhất trong repo là âm tính: 4/4 mẫu U1 không đẹp hơn tranh cũ. Nó chỉ nói về hình dựng bằng code, nhưng cho thấy "có 3D" không tự làm đẹp hơn | [DỮ LIỆU] `docs/studio/STATUS.md`; `docs/decisions/051` |
| 4 | AI chưa gánh được phần khó của 3D cho loại nhân vật này. Mesh xoay được thì có; edge loop, rig cho cánh / cá / chibi chập chờn; animation non-humanoid gần như không. Máy dự án 6 GB VRAM không chạy được model tốt | [DỮ LIỆU + NHẬN ĐỊNH] `05` mục 5; đo máy |
| 5 | Chi phí và thời điểm. Dự án ở cuối giai đoạn art với 2455 dòng manifest, 27 placeholder, gameplay đã freeze. B ước gấp 4–6 lần công của A; C hơn một bậc độ lớn. Không có nghệ sĩ 3D | [DỮ LIỆU] `01` mục 1, 4; [GIẢ ĐỊNH] `08` |

Hai lý do phụ: (6) giấy phép của chuỗi công cụ 3D mở vướng nhiều chỗ khi bán thương mại toàn cầu (nvdiffrast phi thương mại; Hunyuan3D cấm đầu ra ở EU, UK, Hàn Quốc; bộ tách nền mặc định phi thương mại), xem `07` mục 5; (7) kiến trúc không khoá đường lui: `src/core` thuần, scene chỉ đọc state, nên quyết định B có thể để sau mà không tốn thêm (`01` mục 3, 8.2).

## 3. Điều gì sẽ làm đổi khuyến nghị

| Nếu | Thì |
|---|---|
| Chủ dự án có HTML prototype 3D mà chính chủ dự án chấm đẹp hơn art hiện tại | Phân tích theo `03` mục 4; nguồn model của prototype trở thành ứng viên cho P-2 |
| P-1 (tranh trung gian 2D) không đạt vì Gemini lệch nhận diện, **và** P-2, P-3 đạt | A+ thành đường chính cho sinh vật trận |
| P-4 được chủ dự án chấm hơn hẳn P-1, và có người làm rig / animation 3D | Lập decision cho B, triển khai sau 1.0 |
| Thiết kế đổi: trận cần camera tự do, hoặc bản đồ thành trọng tâm với nhân vật đi tự do nhiều hướng | Chấm lại `04` mục 3; lợi ích của B tăng |
| Có đội 3D | Xét lại cả B lẫn C, tốt nhất cho dự án kế tiếp |

## 4. Việc nên làm dù chọn phương án nào

Năm việc trung lập với 2D / 3D, lấy từ `02` mục 7. Chúng nâng chất lượng ngay ở A và là nền bắt buộc nếu sau này sang B.

1. Mảng `impact` nhiều mốc trong timing skill (đòn nhiều nhát như `skill_cl_combo` hiện chỉ có một mốc).
2. Phản ứng trúng có ngữ nghĩa (bị hất lên, bị đẩy, bị nhốt) thay cho một kiểu `hurt`.
3. Cử chỉ xếp lớp (thân dưới đi, thân trên ra chiêu).
4. Clip theo body-plan thật: hiện chưa có rig `flyer`, `biped`.
5. Thêm socket (điểm neo) ngoài `mouth`, `tail`.

Mọi việc này đụng `content/` và `src/`, tức nằm ngoài quyền của giai đoạn nghiên cứu; cần duyệt riêng. Decision 021 (gameplay freeze) không bị đụng vì đây là lớp trình diễn.

## 5. Lộ trình

| Giai đoạn | Việc | Nghiệm thu | Điều kiện dừng | Điểm quay lại |
|---|---|---|---|---|
| **L0 — Quyết định** | Chủ dự án đọc `00`, trả lời các câu ở mục 7 dưới đây; gửi HTML prototype nếu có; chấm ACCEPTANCE A10–A13, B8 của rig hiện tại | Có câu trả lời bằng văn bản | — | — |
| **L1 — P-1 (2D)** | Tranh trung gian + tranh `run` + tranh mặt sau cho 3 sinh vật; thị sai, tint ánh sáng, zoom Ultimate trong sân trận; 2 trong 5 việc ở mục 4 (mảng `impact`, phản ứng có ngữ nghĩa) | Chủ dự án chấm "đạt" theo rubric C1–C7 hiện có (`docs/animation-review/ANIMATION_QUALITY_RUBRIC.md`) và câu "nhân vật có còn là nó không" | Tranh mới lệch nhận diện ở ≥ 2/3 con sau 2 lượt | Tắt khe `pose` mới; trạng thái hiện tại |
| **L2 — P-2, P-3 (A+)**, chỉ khi chủ dự án đồng ý đưa tranh lên dịch vụ ngoài hoặc thuê GPU | Như `09` mục 3 | Tiêu chí 1, 2, 4, 5, 8, 14 của `09` mục 4 | Như `09` | Xoá thư mục tạm ngoài repo; game không đổi |
| **L3 — Áp dụng** | Nhánh thắng ở L1 / L2 áp cho 43 sinh vật trận theo lô 5–8 con, mỗi lô một commit; rồi tới Aquarium (cá bơi), heo Farm | Mỗi lô qua `npm run check`, `assets:check`, so cạnh tranh mẫu | Tỉ lệ làm lại > 50 % ở hai lô liên tiếp | Revert commit của lô |
| **L4 — Hoàn tất GĐ14, GĐ15** | Như roadmap hiện có | Như `docs/ROADMAP.md` | — | — |
| **L5 — Sau 1.0 (tuỳ chọn)** | P-4: trang 3D runtime độc lập, ngoài repo | 15 tiêu chí của `09`, ngưỡng không đổi | Như `09` | Không có gì trong repo để gỡ |

Ước lượng [GIẢ ĐỊNH, độ tin cậy thấp–vừa]: L1 2–3 phiên agent và 3 lượt Gemini; L2 4–6 phiên và dưới 30 USD; L3 10–20 phiên.

## 6. Ảnh hưởng tới roadmap và decision

| Decision | Ảnh hưởng nếu theo khuyến nghị | Việc cần làm |
|---|---|---|
| 017 (gameplay trước, art sau) | Không mâu thuẫn. Mọi việc ở L1–L3 là art / animation trong GĐ14 | Không |
| 021 (gameplay freeze) | Không đụng | Không |
| 022 (art pipeline Gemini) | Giữ. L2 thêm một nguồn tranh (render từ model) cho pose trung gian | Nếu L2 đạt: bổ sung 022 một mục "tranh trung gian từ model", kèm quy tắc sổ nguồn gốc |
| 048 (không IP bên thứ ba) | Áp dụng cho mọi công cụ 3D: đầu vào chỉ là tranh gốc của Sobi, không text-to-3D theo tên IP, rà đầu ra theo `docs/IP_AUDIT_PROMPT.md`. Tài liệu animation "FINAL" dòng 5 có nêu tên một game bên thứ ba làm phong cách tham khảo | Rà dòng đó theo 048; thêm vào 048 một đoạn về giấy phép weights / dịch vụ (đề xuất ở `07` mục 4, 6) |
| 050 (puppet rig) | Giữ làm nền. L1 thực hiện đúng đề xuất còn treo ở bổ sung (5): tranh trung gian | Bổ sung 050 mục (6) khi L1 có kết quả |
| 051 (Sobi Studio) | Giữ kết luận hiện tại: Unity chỉ thêm chuyển động cho tranh có sẵn. A+ **không** mở lại U1: nguồn hình khác (tranh đã duyệt), công cụ khác (Blender), phạm vi hẹp (pose trung gian) | Nếu L2 đạt: decision mới (058) ghi rõ khác 051 ở đâu, dùng lại luật cổng §10.1 |
| GĐ15 | A: không lùi thêm. A+: lùi tối đa bằng thời gian L2, có điều kiện dừng | Không |

Nếu chủ dự án vẫn muốn B hoặc C trái với khuyến nghị này: cần decision mới thay phần liên quan của 017 (thời điểm làm art), 022, 050; thêm thư viện 3D vào `docs/THIRD_PARTY.md` với lý do theo `docs/AGENT_RULES.md` §3; và nên đặt sau tag phát hành 1.0 để có điểm quay lại.

## 7. Quyết định cần chủ dự án duyệt

1. Đồng ý lấy A làm đường chính cho 1.0, loại C, hoãn B sau 1.0?
2. Có HTML prototype không? Nếu có, gửi file hoặc ảnh / video (`03`).
3. Duyệt làm P-1 (đụng `content/`, `art_inbox/`, cần 3 lượt Gemini)?
4. Có cho phép đưa 3 tranh đã duyệt lên dịch vụ image-to-3D bên ngoài, hoặc thuê GPU, và cài Blender ngoài repo, cho P-2 / P-3? Trần ngân sách?
5. Game có bán ở EU, UK, Hàn Quốc không? (Quyết định loại hẳn họ Hunyuan3D mở.)
6. Có kế hoạch thuê người làm 3D không?
7. Duyệt 2 việc trung lập đầu tiên ở mục 4?

## Điều chưa xác minh

- Chưa có phép thử nào: khuyến nghị dựa trên tài liệu, code và khảo sát công cụ. `09` là cách để kiểm chứng.
- Chưa xem HTML prototype.
- Chưa có vòng review nào cho bản pose-to-pose hiện tại; điểm 72–80 của vòng 4 có trước decision 050 (`02`).
- Ước lượng công ở mục 5 có độ tin cậy thấp–vừa.

## Cần chủ dự án cung cấp/duyệt

Bảy câu ở mục 7.
