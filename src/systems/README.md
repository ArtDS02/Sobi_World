# src/systems — hệ thống gameplay dùng chung các Area

Chỉ import `core/`. Area dùng systems, không ngược lại.

| Thư mục | Việc |
|---|---|
| `creature/` | model sinh vật chung (heo là một species): nhu cầu, năng lượng và ngủ, lớn (Baby/Young/Adult/Mature), cân nặng, phân, mô phỏng đóng theo lát |
| `health/` | bệnh → nguy kịch → chết (`disease.ts`) và nguy cơ bệnh theo giờ dưới dạng ngân sách rủi ro tích lũy (`risk.ts`) |
| `quality/` | bậc Quality từ tâm trạng trung bình (chưa ảnh hưởng giá ở GĐ1) |
| `valuation/` | giá trị = tích các hệ số; cấu hình hiện tại cho ra đúng giá Sobi Farm |
| `behavior-ai/` | luật chọn hành vi chung; hành vi cụ thể là cấu hình |
| `layout/` | hình học vùng đi được, vị trí vật thể |
| `plants/` | một ô đất theo thời gian thật: gieo, tưới (lớn nhanh gấp đôi khi khô), phân bón, chín, héo; dạng đóng nên 3 chế độ mô phỏng ra cùng kết quả (GĐ5) |
| `character/` | nhân vật người chơi: đi 8 hướng, va chạm hộp chân, tương tác theo tầm với (GĐ3) |
| `breeding/` | lai giống nâng cao: tính trạng, di truyền, đột biến, vận may, phả hệ, tin đồn của Nhà lai giống (GĐ7) |
