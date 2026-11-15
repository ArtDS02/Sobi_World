# 08 — Chi phí và hiệu quả dài hạn (mục I)

Ngày: 2026-11-11. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH]. Repo không có số liệu giờ công hay ngân sách, nên mọi con số thời gian và tiền dưới đây là **khoảng ước lượng**, kèm giả định và độ tin cậy. Giá công cụ lấy từ `05_CONG_NGHE_AI_3D.md`.

## 1. Đơn vị đo

- **Phiên agent**: một phiên làm việc của AI agent có chủ dự án duyệt cuối phiên. Căn cứ nhịp độ thật trong repo: decision 050 đi từ audit đến 44 rig trong 2 ngày lịch (2026-11-05 → 11-06) với 5 lần đổi hướng; Sobi Studio U0 + U1 + hai cổng VFX trong 2 ngày (11-07 → 11-08) [DỮ LIỆU] `docs/decisions/050`, `051`.
- **Lượt duyệt của chủ dự án**: mỗi cổng cần chủ dự án nhìn ảnh và trả lời. Đây là tài nguyên khan nhất [NHẬN ĐỊNH]: `docs/PROGRESS.md` đang liệt kê hơn 8 mục "chờ chủ dự án".
- **Tiền**: USD, chỉ tính công cụ và dịch vụ, không tính lương.

## 2. Khối lượng phải làm theo phương án

Số gốc [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2 (đếm 2026-11-07; đếm lại 2026-11-11 ở `01` mục 4.3 là 2455 dòng, 2664 PNG): 2279 dòng manifest; `pigs` 89, `props` 1554 (trong đó key pose trận 266, layer rig 814, kit bản đồ 152), `fx` 117, `buildings` 26, `environment` 128, `ui` 365. 43 sinh vật trận có key pose; 112 skill.

| Hạng mục | A | A+ | B | C |
|---|---|---|---|---|
| Asset tĩnh phải làm mới | 28 placeholder + mục ngoài manifest (NPC, icon) | Như A | Như A cho 4 Area; môi trường trận và bản đồ Adventure làm lại 3D (80 cảnh v3, 152 kit) | Gần 1900 dòng không phải UI |
| Model 3D có rig | 0 | 43 (chỉ cần đủ để render vài pose; rig thô chấp nhận được) | 43 + boss, đạt mức biến dạng đẹp ở mọi clip | 43 + 89 heo + ~30 cá + NPC + chim, côn trùng |
| Clip animation | 25 clip chung đã có; thêm 2–4 tranh trung gian mỗi con | Như A, tranh trung gian lấy từ render | ~25 clip × 6–8 body-plan, cộng clip riêng | Thêm clip farm, bơi, bay |
| VFX | Giữ 117 sheet; chỉnh tay hạt cho sheet còn đơn điệu | Như A | Giữ sheet làm billboard + thêm hiệu ứng có chiều sâu cho 112 skill | Làm lại phần lớn |
| Code render | Thêm ánh sáng 2D, camera trận | Như A + nhập tranh mới | Renderer 3D cho trận và bản đồ; cầu nối với DOM HUD; hai đường nạp asset | Viết lại lớp scene của 6 Area (98 file import Phaser, khoảng 12 800 dòng; `01` mục 3) |
| Giữ nguyên | `src/core`, logic, content, save, test | Như A | Như A | Như A |

## 3. Ước lượng

Giả định chung [GIẢ ĐỊNH]: vẫn là chủ dự án + AI agent, không thuê người. Độ tin cậy: thấp cho B, C (chưa có phép thử); vừa cho A (có nhịp độ thật để ngoại suy).

| Khoản | A | A+ | B | C |
|---|---|---|---|---|
| Chuyển đổi nền tảng (renderer, pipeline) | 0 | 3–6 phiên (Blender headless, nhập) | 15–30 phiên | 40–80 phiên |
| Asset | 5–10 phiên + ~10 lượt Gemini của chủ dự án | Thêm 5–10 phiên cho 43 model | 30–60 phiên, tỉ lệ làm lại 50–80 % | 150–300 phiên |
| Animation | 5–10 phiên | 5–10 phiên | 20–40 phiên | 40–80 phiên |
| VFX | 3–6 phiên | 3–6 phiên | 10–20 phiên | 20–40 phiên |
| Tích hợp, tối ưu, kiểm | 3–5 phiên | 4–6 phiên | 10–20 phiên | 30–50 phiên |
| **Tổng phiên agent** | **16–31** | **20–38** | **85–170** | **280–550** |
| Lượt duyệt của chủ dự án | 15–25 | 20–35 | 60–120 | 200–400 |
| Dịch vụ AI | 0 (Gemini free) | 0–50 USD (43 model × vài lượt, hoặc vài giờ GPU thuê) | 200–500 USD cho 43 nhân vật nếu qua API trả phí (≈ 4,7 USD mỗi nhân vật dùng được, × hệ số làm lại) | 1.000–5.000 USD |
| Nhân sự chuyên môn nếu muốn đạt chất lượng thương mại | Không bắt buộc | Không bắt buộc | Cần ít nhất một người làm rig / animation 3D bán thời gian | Cần nghệ sĩ 3D và animator |
| Độ trễ phát hành (GĐ15) | Thấp | Thấp, có điều kiện dừng | Cao | Rất cao; tương đương làm lại lớp hình của game |
| Độ tin cậy của ước lượng | Vừa | Thấp–vừa | Thấp | Thấp |

Ghi chú về cột C [NHẬN ĐỊNH]: `docs/UNITY_STUDIO_PLAN.md` §9 đã ước "nhiều tuần, nhiều phiên" cho việc render lại 2547 file bằng một pipeline **đã tự động hoàn toàn**. C còn phải thêm rig, animation và renderer runtime, nên không thể rẻ hơn con số đó.

## 4. Chi phí chìm và chi phí bỏ đi

| Đã đầu tư | A / A+ | B | C |
|---|---|---|---|
| 2547 PNG đã cắt, phần lớn đã duyệt theo Area | Giữ | Giữ ~85 % | Bỏ phần lớn |
| 44 rig, 814 layer, runtime puppet (`src/systems/animation`, `src/ui/puppet`) | Giữ | Bỏ ở Adventure (nơi duy nhất đang dùng) | Bỏ |
| 112 kịch bản skill, timeline, mốc nhịp | Giữ | Giữ dữ liệu, viết lại phần phát cue | Như B |
| Sobi Studio (Unity CLI, nhập, chụp) | Giữ cho VFX | Dùng lại làm xưởng | Dùng lại |
| 238 commit GĐ14 chưa merge `main` (`01` mục 1.1) | Giữ | Phần Adventure phải làm lại | Phần lớn phải làm lại |

Chi phí chìm không phải lý do để giữ một hướng sai. Nó được liệt kê vì ở đây nó trùng với thứ đang chạy được và đã được duyệt [NHẬN ĐỊNH].

## 5. Dài hạn

| Khía cạnh | A / A+ | B | C |
|---|---|---|---|
| Thêm một loài mới | 6 tranh + chép template body-plan; đã làm 43 lần | Một model có rig khớp skeleton chung; clip dùng lại ngay nếu skeleton khớp | Như B |
| Thêm skill mới | Một kịch bản trong `battle_fx.json` + cử chỉ có sẵn | Như A, cộng clip nếu động tác mới | Như B |
| Đổi phong cách toàn game | Vẽ lại (đắt) | Hai nơi phải đổi | Đổi shader và texture; rẻ hơn 2D **nếu** model đã tốt |
| Bảo trì | Một renderer | Hai renderer, hai pipeline, hai bộ lỗi | Một renderer mới, ít kinh nghiệm tích luỹ trong repo |
| Rủi ro kỹ thuật | Thấp | Trung bình–cao (chia sẻ canvas, bộ nhớ, đồng bộ HUD DOM) | Cao |
| Rủi ro bản quyền | Thấp; đã có quy trình 048 | Thêm rủi ro giấy phép model và dịch vụ 3D (`07_BAN_QUYEN.md`) | Như B, trên quy mô lớn |
| Phụ thuộc bên ngoài | Gemini free (điều khoản có thể đổi) | Thêm dịch vụ image-to-3D đổi model theo quý | Như B |

Lợi thế dài hạn thật của 3D [NHẬN ĐỊNH]: tái dùng clip theo skeleton và đổi phong cách bằng shader. Cả hai chỉ thành tiền khi số loài và số clip lớn hơn nhiều so với hiện nay, và khi có người làm được rig, clip đạt chuẩn. Với 43 sinh vật và đội hiện tại, điểm hoà vốn chưa tới.

## 6. Kết luận chi phí

1. A rẻ nhất và có độ tin cậy ước lượng cao nhất. [NHẬN ĐỊNH]
2. A+ thêm khoảng 20–25 % công so với A và gần như không thêm tiền, nhưng lợi ích chưa được chứng minh; nên mua bằng một prototype nhỏ có điều kiện dừng. [NHẬN ĐỊNH]
3. B đắt gấp khoảng 4–6 lần A về công, và chi phí thật nằm ở thứ không mua được bằng credit: tay nghề rig và animation. [NHẬN ĐỊNH]
4. C đắt hơn A trên một bậc độ lớn và lùi phát hành không xác định. [NHẬN ĐỊNH]

## Điều chưa xác minh

- Giờ công thật của một phiên agent và của một lượt duyệt: repo không ghi.
- Tỉ lệ làm lại của image-to-3D trên tranh Sobi: chưa đo; mọi ước lượng B, C nhân với hệ số này.
- Giá thuê GPU 24 GB theo giờ: chưa xác minh (`05`).
- Chi phí thuê nghệ sĩ 3D tự do tại Việt Nam: không có nguồn trong báo cáo này.

## Cần chủ dự án cung cấp/duyệt

- Mốc phát hành mong muốn cho GĐ15 và mức lùi chấp nhận được.
- Trần ngân sách công cụ mỗi tháng (0, ~20, ~100 USD).
- Có sẵn sàng thuê một người làm 3D bán thời gian không. Câu trả lời "không" loại B và C ở chất lượng thương mại.
