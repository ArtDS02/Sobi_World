# Bible hành động: CAST PHÉP (cast)

Mọi skill phép (magical / hybrid không lao tới). MUST-HAVE rubric: **pose lấy đà → vòng phép → phát skill → recovery**, nhân vật cử động rõ, vòng phép mang màu và ký hiệu của hệ. Vòng phép engine: `pacing.circle` = 560 ms (skill), 820 ms (ultimate); skill có `script` mặc định **không** vòng phép trừ khi `circle: true` (decision 044) — kịch bản tự mở đầu bằng `pose cast` + `move cast_coil`.

## 1. Giai đoạn
| Giai đoạn | Chuyển động | Act |
|---|---|---|
| Prep 250–400 | **gồng**: hạ thấp người (squash), nghiêng ra sau, rồi vươn lên (stretch) | `pose cast`, `move cast_coil` |
| Startup 150–300 | năng lượng **tụ vào** thân / phụ kiện: hạt hút vào, thân sáng dần | `burst …` hút vào, `glow $color` tăng `bright` |
| Execution 60–100 | **đẩy ra**: thân giật về trước nhỏ, tay / mõm hướng mục tiêu, lóe ngắn ở điểm phát | `move recoil` (ngược), `strip` nhỏ ở `front` |
| Recovery 200–300 | thả lỏng, lò xo về idle, hạt dư rơi quanh người cast | `burst …_fall` nhỏ ở actor |
Phát ở ~35% thời lượng (style guide §2). Mặt và silhouette không bị hiệu ứng tụ che quá 1 khung.

## 2. Vòng phép (khi dùng)
Mang **ký hiệu** của hệ, không chỉ màu (ANIM-117 còn mở: "vòng phép phân biệt hệ chủ yếu bằng màu"): giọt (Nước), lưỡi lửa (Lửa), lá (Thiên nhiên), khối đá (Đất), chữ thập (Kim), tia (Sấm), xoáy mực (Bóng tối), sao 4 cánh (Ánh sáng), vòng rỗng (Hư Không). Vòng **vẽ dần** (mở theo cung) → xoay → co lại vào chân khi phát.

## 3. Phân biệt cast của phe ta / quái
Quái cast: thêm 1 nhịp "báo hiệu" rõ hơn (mắt sáng, gầm) để người chơi đọc được đòn sắp tới; quái tha hóa (Umbraflux) dùng overlay tha hóa của style guide §4.

## 4. Mẫu kiểm
Capture: khung `release-50` thấy thân gồng / sáng; khung `release` thấy lóe ở điểm phát; actor không đứng yên hoàn toàn trong suốt pha Prep. `anim:audit` không có `NO_PREPARATION`.
