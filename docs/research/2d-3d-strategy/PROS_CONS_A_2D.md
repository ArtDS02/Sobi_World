# PROS / CONS — Phương án A: toàn bộ 2D, nâng cấp

Ngày: 2026-11-11. Trọng số 1–5 (5 = ảnh hưởng lớn tới quyết định). Tin cậy: Cao / Vừa / Thấp. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH].

Phạm vi: giữ Phaser và tranh 2D; nâng cấp asset, animation (tranh trung gian, rig cho Farm / Aquarium), VFX, ánh sáng 2D, thị sai, camera trận. Biến thể **A+**: thêm 3D ở xưởng offline để render tranh trung gian (không đổi runtime).

## Lợi

| # | Lợi | Trọng số | Bằng chứng | Tin cậy |
|---|---|---|---|---|
| A1 | Giữ toàn bộ art đã duyệt: 2547 PNG, chỉ còn 28 dòng placeholder | 5 | [DỮ LIỆU] `docs/PROGRESS.md` đầu file; `docs/UNITY_STUDIO_PLAN.md` §2 | Cao |
| A2 | Không cần nghệ sĩ 3D; pipeline Gemini → cắt → manifest đã chạy cho 5 Area | 5 | [DỮ LIỆU] `docs/decisions/022` | Cao |
| A3 | Hệ animation trận đã có timeline, mốc nhịp, 112 kịch bản skill, 44 rig; vấn đề còn lại hẹp và đã được gọi tên (thiếu khung trung gian) | 4 | [DỮ LIỆU] `docs/decisions/050` bổ sung (5) | Cao |
| A4 | Hướng "thêm chuyển động trên tranh có sẵn" đã qua cổng thật (VFX 22/23 sheet) | 4 | [DỮ LIỆU] `docs/studio/STATUS.md` | Cao |
| A5 | Phong cách Sobi (tròn, pastel, nét vẽ) giữ nguyên, không rủi ro "đồ nhựa" | 4 | [DỮ LIỆU] cổng U1 trong `docs/studio/STATUS.md` | Cao |
| A6 | Một renderer, một pipeline; `npm run check`, guard, test không đổi | 3 | [DỮ LIỆU] `CLAUDE.md` | Cao |
| A7 | Chi phí công cụ bằng 0; không thêm rủi ro giấy phép | 3 | [DỮ LIỆU] `docs/THIRD_PARTY.md`; `07_BAN_QUYEN.md` | Vừa |
| A8 | Không lùi GĐ15 | 4 | [NHẬN ĐỊNH] từ `08` | Vừa |
| A9 | Squash & stretch, smear, biểu cảm vẽ tay là thế mạnh tự nhiên của 2D | 2 | [NHẬN ĐỊNH]; `02_PHAN_TICH_ANIMATION_SKILL.md` | Vừa |

## Hại

| # | Hại | Trọng số | Bằng chứng | Tin cậy | Cách giảm |
|---|---|---|---|---|---|
| a1 | Chuyển giữa hai key pose là hoà nhanh 70 ms, không có khung trung gian vẽ tay | 4 | [DỮ LIỆU] `docs/decisions/050` bổ sung (5) "Giới hạn còn lại" | Cao | Vẽ thêm `cb_<art>_windup` và 1–2 tranh giữa đòn; hoặc A+ |
| a2 | Gemini vẽ lại khung thì lệch nhận diện (đã thấy ở cá) | 4 | [DỮ LIỆU] `docs/decisions/051` bối cảnh | Cao (cho cá), Thấp (cho sinh vật trận) | Vẽ cả bộ pose trong một sheet; A+ cho loài không vẽ lại được |
| a3 | Không quay người, không đổi góc camera, không foreshortening thật | 3 | [NHẬN ĐỊNH]; rig bẻ quá ~18° thì tranh rách [DỮ LIỆU] `docs/decisions/050` bổ sung (2) | Cao | Chấp nhận trận một góc nhìn; Ultimate dùng cut-in, zoom, flipbook |
| a4 | Ánh sáng động trên nhân vật cần normal map riêng cho từng tranh | 2 | [NHẬN ĐỊNH] | Vừa | Chỉ làm ánh sáng môi trường và tint theo giờ; rim bằng post-FX |
| a5 | Mỗi loài mới cần 6+ tranh; không tái dùng clip chi tiết giữa các loài như skeleton 3D | 2 | [DỮ LIỆU] 25 clip chung theo body-plan đã giảm phần lớn chi phí này | Vừa | Template body-plan |
| a6 | Bộ nhớ texture tăng theo số tranh: 512² mỗi pose | 2 | [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §4.5 (400 MB nếu làm toàn khung) | Cao | Giới hạn 8–10 tranh mỗi con; nạp theo trận |
| a7 | Phụ thuộc Gemini bản miễn phí và chủ dự án tự dán prompt | 3 | [DỮ LIỆU] `docs/decisions/022` | Cao | Ghi điều khoản tại thời điểm dùng (`07`) |
| a8 | Riêng A+: ảnh render từ model có thể không khớp nét tranh; cần đưa tranh lên dịch vụ ngoài hoặc thuê GPU | 3 | [GIẢ ĐỊNH]; chưa thử | Thấp | Prototype có điều kiện dừng (`09`) |

## Nhận định chung

A giải được các vấn đề đang được ghi nhận, trừ quay người và camera tự do. Hai thứ đó hiện chưa là yêu cầu gameplay của trận (sân nhìn ngang một góc) [DỮ LIỆU] `docs/animation-review/ANIMATION_REVIEW_FEEDBACK.md` §0.1. Rủi ro lớn nhất của A là a2: khả năng vẽ thêm tranh trung gian nhất quán. Đây là thứ cần đo đầu tiên.

## Điều chưa xác minh

- Tỉ lệ thành công khi Gemini vẽ tranh trung gian cho sinh vật trận trong cùng một sheet.
- Mức cải thiện cảm nhận khi thêm 2 tranh trung gian (chưa có bản thử).

## Cần chủ dự án cung cấp/duyệt

- Chấm ACCEPTANCE A10–A13, B8 của rig hiện tại (đang chờ) để biết mức xuất phát.
- Đồng ý thử vẽ tranh `windup` và tranh giữa đòn cho 2–3 sinh vật.
