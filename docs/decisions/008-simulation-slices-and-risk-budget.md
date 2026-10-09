`# 008 — Mô phỏng theo lát và ngân sách rủi ro bệnh
`
`**Ngày:** 2026-10-09 · **Trạng thái:** Đã áp dụng ở GĐ2 (việc 1–4), chờ chủ dự án duyệt cùng báo cáo điểm dừng
`
`## Bối cảnh
`Spec: bước 1 phút khi đang chạy, 10 phút khi bù offline, kết quả hai chế độ phải nhất quán, bù 30 ngày dưới 3 giây.
`Mô phỏng Sobi Farm là giải tích (đúng cho mọi khoảng thời gian) nhưng bệnh dùng \`rng\` theo luồng, nên kết quả phụ thuộc cách chia thời gian.
`
`## Lựa chọn
`- \`core/simulation\` chia thời gian thành **lát** ≤ một bước, canh theo lưới giờ địa phương (mốc buổi luôn là ranh giới lát). Trong lát vẫn là công thức đóng.
`- Bệnh = **hazard tích lũy** so với **ngưỡng của từng lần bệnh** (Exp(1) seed theo id + thời điểm bệnh trước). Rủi ro theo giờ của spec (đói 0 +15%, sạch < 20 +10%,
`  tâm trạng < 20 +5%, cộng dồn) đổi thành tốc độ hazard −ln(1−p)/giờ. Không bốc từ dòng \`rng\` nên không phụ thuộc cỡ lát hay thứ tự sinh vật.
`- Chết chỉ xảy ra ở chế độ online; bù offline chỉ đặt ân hạn 12 giờ (\`graceUntil\`) tính từ cuối lần bù (decision 004).
`- Trần 30 ngày: mô phỏng 30 ngày đầu rồi \`rebase\`. Giờ máy lùi: không mô phỏng, store báo \`clockRewound\`.
`
`## Hệ quả
`- Kết quả deterministic theo trạng thái (cùng sinh vật + cùng thời gian → cùng ngày bệnh); chấp nhận được trong game chơi đơn.
`- Sai khác duy nhất giữa hai cỡ lát: số đống phân tính theo đầu lát (vài phút trên một ngày).
`- Khi thức ăn máng khan, thứ tự ăn giữa các heo phụ thuộc cỡ lát (ai chạm ngưỡng trước trong lát) — tổng thức ăn vẫn khớp.
