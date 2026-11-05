# Bible hành động: TRẠNG THÁI (status)

25 status trong `battle_fx.json → statuses`: mỗi cái có `icon`, `apply`, `loop` (`every` + script), `expire`, và có thể `tint`, `cover`, `layers` (orbit quanh thân), `freezeBody`. Review vòng 4: status ~72–77 / mục tiêu 85; mọi status đã đủ 3 pha (expire ≥ 8% thay đổi khung).

## 1. Ba pha (MUST-HAVE)
| Pha | Thời lượng | Mục đích | Quy tắc |
|---|---|---|---|
| Dính (apply) | 400–700 | báo "vừa dính gì" | hình riêng của status, **phản ứng cơ thể** (giật / co / phồng), icon bật ra |
| Duy trì (loop) | nhịp `every` 700–1600, mỗi nhịp ≤ 400 | nhắc "vẫn đang dính" | **nhỏ, không che**, lệch pha giữa các đơn vị; không chặn input |
| Hết (expire) | 300–500 | báo "đã hết" | ngược với apply (vỡ / tan / rơi), thân **sáng lại** |
Loop không được làm người chơi mỏi: tối đa 1 lớp chuyển động liên tục (layer orbit) + 1 nhịp hạt.

## 2. Ngôn ngữ theo nhóm
| Nhóm | Status | Hình loop | Ghi chú |
|---|---|---|---|
| Sát thương theo lượt | poison, burn | độc: bọt sủi ([poison](../motifs/poison.md)); bỏng: lửa nhỏ bám + tàn bay lên + tint đỏ | `dot_poison` / `dot_burn` khác hẳn nhau |
| Khống chế | freeze, stun, disable | băng bọc ([ice](../motifs/ice.md)); sao / chim xoay quanh đầu + mặt choáng; khóa rune | stun phải có biểu cảm (pose `hurt`) |
| Nguyên tố | wet | giọt rơi + vũng ([WATER](../elements/WATER.md)) | đạt |
| Tăng chỉ số | atkUp, defUp, matkUp, mdefUp, accUp, evaUp, spdUp | aura theo loại buff ([buff-and-heal](buff-and-heal.md) §1), hướng **lên** | 7 status khác nhau bằng hình, không chỉ màu mũi tên |
| Giảm chỉ số | …Down | hướng **xuống**, khói xám tím chảy xuống, thân hơi co | không dùng hình của tăng lật ngược đơn thuần |
| Bảo vệ | shield, taunt, autoRevive, regen | vòm / vòng orbit; huy hiệu; lông vũ chờ; lá + dấu cộng bay lên | |
| Diệt vong | doom | đồng hồ đếm (`fxp_doom_clock`) | nhịp loop tăng dần khi gần hết |

## 3. Hình chủ đạo sống
Layer `orbit` (vòng / sao quay quanh thân) đã là chuyển động liên tục — tốt. Thiếu: biến dạng của chính hình (vòm khiên gợn khi có đòn đánh trúng, sao choáng lắc lư). `cover` băng: thêm lấp lánh chạy dọc mặt băng mỗi nhịp loop.

## 4. Nhiều status cùng lúc
Icon tối đa 3, luân phiên (decision 044). Hiệu ứng trên thân: ưu tiên theo `priority` (freeze 10 > … > wet 1); status ưu tiên thấp chỉ còn icon + 1 hạt nhỏ khi bị status ưu tiên cao che.

## 5. Cấm
Loop che mặt / thanh máu; loop nhấp nháy; status tăng và giảm cùng hình chỉ đổi màu (rubric C4 = 1); expire không thấy gì.
