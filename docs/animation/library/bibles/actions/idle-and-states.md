# Bible hành động: IDLE, LƯỢT, KẾT TRẬN (idle & states)

Animation của chính sinh vật ngoài lúc ra đòn: idle (code `battlePose.ts` / `poseKit.ts`), bắt đầu lượt (`turn_start_ally/enemy`), vào trận (`enter_ally/enemy`), phòng thủ (`guard`), choáng (`stunned`), KO (`ko`), hồi sinh (`revive`), thắng (`victory`), đổi pha trùm (`boss_phase`). Sinh vật = ảnh key pose + tween (decision 042): không có khung vẽ tay giữa các pose.

## 1. Idle
Hiện có: thở (co giãn ≤ 3%) hoặc nhún (con bay / bơi), lệch pha mỗi con, gần chết thở nhanh + lắc (ANIM-100), status `freezeBody` dừng thở.
Chuẩn bổ sung:
- **Chuyển động phụ lệch pha**: ngoài thở, một trục thứ hai (nghiêng 1–2°) với chu kỳ khác (không bội số) → không lặp máy móc.
- **Chớp mắt / đổi biểu cảm**: chỉ khi có ảnh pose phụ; không có thì bỏ qua (không vẽ đè mắt bằng code).
- Biên độ theo **tính cách loài** (ghi trong `battle_fx.json → bodies/creatures`): to nặng → chậm, biên độ nhỏ; nhỏ nhanh → nhanh hơn.

## 2. Lượt & vào trận
| Act chung | Hiện có | Chuẩn |
|---|---|---|
| `turn_start_ally` | hop 8 + sao | giữ; nhẹ, ≤ 300 ms, không chặn input |
| `enter_enemy` | poof tím → appear → puff_up | giữ; quái tha hóa thêm overlay Umbraflux |
| `boss_phase` | (kịch bản riêng) | trùm gồng + màn tối nhẹ + rung T3, đổi tint / hào quang để đọc được "đã đổi pha" |

## 3. Phản ứng & kết thúc
| Act | Chuẩn |
|---|---|
| `guard` | co người (squash 0,86) + vòm khiên mở nhanh; khi bị đánh lúc guard: vòm **gợn** + tia văng, thân lùi ít hơn bình thường |
| `stunned` | pose `hurt` + lắc + sao xoay quanh đầu (MUST-HAVE rubric) |
| `ko` | bật mạnh → xoay → poof → nằm nghiêng mệt (style guide: **không gợi chết**, decision 002/039) |
| `revive` | cột sáng từ trên → appear → bounce 2 nhịp |
| `victory` | pose `victory` + nhảy 3 nhịp + cánh hoa rơi; mỗi loài khác nhịp (heo nhảy, cá quẫy) |
| Thua trận | đội ngồi phịch mệt, không màu xám chết chóc |

## 4. Hình chủ đạo sống (áp cho sinh vật)
Ảnh tĩnh của sinh vật là chấp nhận được (decision 042: 6 key pose + tween). Sống nhờ: squash & stretch khi chuyển pose (đã có `easeOutBack`, `settle`), bóng dưới chân co giãn theo độ cao (đã có), **smear** khi lao (`trail`). Không thêm khung vẽ tay giữa pose (AI tạo ảnh không giữ đồng nhất — decision 042).

## 5. Cấm
Idle cùng nhịp cho mọi con (đồng bộ máy móc); KO trông như chết; victory dùng chung một chuyển động cho mọi loài; idle biên độ lớn làm lệch vùng bấm chọn mục tiêu.
