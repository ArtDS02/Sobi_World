# src/systems — hệ thống gameplay dùng chung các Area

Chỉ import `core/`. Area dùng systems, không ngược lại.

| Thư mục | Việc |
|---|---|
| `creature/` | model sinh vật chung (heo là một species), nhu cầu, lớn, tâm trạng |
| `health/` | khung sức khỏe: khỏe/bệnh/hồi phục; nguy kịch và chết tắt bằng balance (GĐ2) |
| `quality/` | bậc Quality từ tâm trạng trung bình (chưa ảnh hưởng giá ở GĐ1) |
| `valuation/` | giá trị = tích các hệ số; cấu hình hiện tại cho ra đúng giá Sobi Farm |
| `behavior-ai/` | luật chọn hành vi chung; hành vi cụ thể là cấu hình |
| `layout/` | hình học vùng đi được, vị trí vật thể |
