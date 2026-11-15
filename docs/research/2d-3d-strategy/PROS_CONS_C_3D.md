# PROS / CONS — Phương án C: toàn bộ 3D

Ngày: 2026-11-11. Trọng số 1–5 (5 = ảnh hưởng lớn tới quyết định). Tin cậy: Cao / Vừa / Thấp. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

Phạm vi: mọi Area dùng renderer 3D; nền tảng chung cho model, material, rig, animation, VFX, môi trường. Camera khác nhau theo gameplay.

## Lợi

| # | Lợi | Trọng số | Bằng chứng | Tin cậy |
|---|---|---|---|---|
| C1 | Một ngôn ngữ hình, một pipeline cho cả game; không lệch phong cách giữa các bộ asset | 4 | [DỮ LIỆU] U1 câu (b) "đồng bộ hơn: Có", `docs/studio/STATUS.md` | Cao |
| C2 | Đổi phong cách toàn game bằng shader, ánh sáng, texture thay vì vẽ lại | 3 | [NHẬN ĐỊNH] | Vừa |
| C3 | Tái dùng rig và clip theo skeleton giữa các Area (heo ở Farm và heo trong trận là một model) | 3 | [NHẬN ĐỊNH] | Vừa |
| C4 | Camera, ánh sáng theo giờ, bóng đổ, chiều sâu ở mọi Area | 3 | [NHẬN ĐỊNH] | Cao |
| C5 | Lợi thế Adventure như B1–B3 | 3 | Xem `PROS_CONS_B_HYBRID.md` | Vừa |
| C6 | `src/core`, content, save, test giữ nguyên vì đã tách khỏi renderer | 4 | [DỮ LIỆU] `CLAUDE.md` (core thuần); grep không có Phaser trong `src/core` | Cao |

## Hại

| # | Hại | Trọng số | Bằng chứng | Tin cậy | Cách giảm |
|---|---|---|---|---|---|
| c1 | Bỏ vai trò của gần 1900 dòng asset 2D không phải UI, phần lớn đã duyệt | 5 | [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2 | Cao | Không có |
| c2 | Chính hướng "làm lại toàn bộ bằng 3D" đã được thử ở dạng nhẹ hơn (render ra 2D) và dừng ở cổng đầu tiên | 5 | [DỮ LIỆU] `docs/decisions/051` cập nhật 2026-11-07 | Cao | Nguồn hình khác (image-to-3D, nghệ sĩ); chưa có bằng chứng |
| c3 | Cần model đạt production cho mọi loại: heo, cá, cây nhiều giai đoạn, hoa, công trình, môi trường. AI chưa tới mức 6 | 5 | [DỮ LIỆU + NHẬN ĐỊNH] `05_CONG_NGHE_AI_3D.md` mục 5 | Vừa | Thuê đội 3D |
| c4 | Viết lại lớp scene của 6 Area: 98 file import Phaser, khoảng 12 800 dòng (19,7 % của `src/`) | 5 | [DỮ LIỆU] `01_HIEN_TRANG.md` mục 3 | Cao | Không có |
| c5 | Garden, Cloud, Farm không có vấn đề nào mà 3D giải quyết; đổi chỉ để đồng bộ | 4 | [NHẬN ĐỊNH] `04` mục 4 | Vừa | — |
| c6 | Phong cách tranh vẽ pastel khó giữ trong 3D; rủi ro "đồ nhựa" đã xảy ra | 4 | [DỮ LIỆU] `docs/studio/STATUS.md` (heo farm) | Cao | Texture vẽ tay; cần nghệ sĩ |
| c7 | Lùi GĐ15 không xác định: ước 280–550 phiên agent | 5 | [GIẢ ĐỊNH] `08` | Thấp | — |
| c8 | Trái hướng đã chốt: 017 / 021 (gameplay freeze rồi chỉ làm art một lần), 022, 050; và kết luận dừng của 051 | 3 | [DỮ LIỆU] các decision | Cao | Cần decision mới thay thế |
| c9 | Chi phí dịch vụ và rủi ro giấy phép trên quy mô nghìn asset | 3 | [GIẢ ĐỊNH] `05` mục 4; `07` | Thấp | Model mở ghim phiên bản trên GPU thuê |
| c10 | Hiệu năng và dung lượng trên máy người chơi cấu hình thấp chưa đo | 2 | [GIẢ ĐỊNH] | Thấp | — |

## Nhận định chung

C có lợi ích dài hạn thật (C1–C3) cho một studio có đội 3D và đang ở đầu dự án. Sobi World đang ở cuối giai đoạn art với asset 2D gần đủ, không có nghệ sĩ 3D, và đã có một lần thử cùng hướng không đạt. Với dữ kiện hiện có, C không được khuyến nghị. Điều kiện để xét lại: có đội 3D, hoặc một dự án kế tiếp bắt đầu từ đầu.

## Điều chưa xác minh

- Mọi ước lượng khối lượng của C có độ tin cậy thấp.
- Chưa có phép thử image-to-3D trên tranh Sobi.

## Cần chủ dự án cung cấp/duyệt

- Xác nhận có hay không kế hoạch tuyển / thuê đội 3D. Nếu không, đề nghị loại C khỏi danh sách.
