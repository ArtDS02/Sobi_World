# SOBI ADVENTURE – BỘ TIÊU CHUẨN ĐÁNH GIÁ ANIMATION
Phiên bản 1.0 · Áp dụng cho: combat (animal, quái vật, skill, buff, status, ultimate, targeting, chuyển lượt, HUD) và di chuyển trên map.
Tham chiếu chất lượng: Epic Battle Fantasy 3.

---

## 1. THANG ĐIỂM CHO MỖI TIÊU CHÍ (0–5)

| Điểm | Mức | Mô tả |
|---|---|---|
| 0 | Không có | Thiếu hoàn toàn yếu tố này |
| 1 | Kém | Có nhưng sai, gây khó chịu hoặc khó hiểu |
| 2 | Yếu | Có, nhưng sơ sài, cứng, chung chung |
| 3 | Đạt | Đúng chức năng, chưa có điểm nhấn |
| 4 | Tốt | Sống động, rõ ràng, có đặc trưng |
| 5 | Xuất sắc | Ngang hoặc hơn tham chiếu, gây ấn tượng mạnh |

---

## 2. BẢY TIÊU CHÍ CỐT LÕI

### C1. Rõ ràng (Readability)
Người chơi nhìn một lần là hiểu: ai làm, làm gì, lên ai, kết quả ra sao.
- 1: Không biết skill trúng ai, hiệu ứng lẫn vào nhau
- 3: Hiểu được nhưng phải để ý
- 5: Hiểu tức thì, kể cả khi nhiều hiệu ứng diễn ra liên tiếp

### C2. Timing & nhịp (Anticipation → Action → Recovery)
Có đủ 3 pha lấy đà, ra đòn, thu về; nhịp nhanh chậm có chủ đích.
- 1: Không có lấy đà, ra đòn và biến mất đột ngột
- 3: Có đủ pha nhưng nhịp đều đều
- 5: Nhịp có điểm nhấn (chậm lấy đà, bùng nhanh, dư âm), cảm giác có lực

### C3. Độ sống động của chuyển động
Có animation nội tại (bản thân hiệu ứng thay đổi hình dạng), easing, squash/stretch, chuyển động phụ (particle, trail, mảnh vỡ, tóc/đuôi/vải lay).
- 1: Như ảnh tĩnh đang trượt, tốc độ đều
- 3: Có easing và một ít particle
- 5: Mọi thành phần đều "sống", nhiều lớp chuyển động đan xen tự nhiên

### C4. Tính đặc trưng (Identity)
Nhìn là biết hệ (nước, lửa, băng, độc, gió…), loại hiệu ứng (buff công, thủ, hồi máu…) và cá tính của nhân vật hoặc quái.
- 1: Dùng chung một hiệu ứng, đổi màu là xong
- 3: Phân biệt được nhờ màu
- 5: Phân biệt được bằng hình khối, hướng chuyển động và nhịp, kể cả khi bỏ màu

### C5. Tác động (Impact)
Đòn đánh có lực: hit-stop, flash, rung màn hình, knockback, phản ứng của mục tiêu, số sát thương.
- 1: Mục tiêu đứng yên, không phản ứng
- 3: Có nháy đỏ và số sát thương
- 5: Cảm nhận rõ sức nặng, mức tác động tương xứng với sức mạnh skill

### C6. Liền mạch & trình tự
Chuyển tiếp mượt giữa các pha và giữa các animation (idle → cast → skill → impact → idle), đúng thứ tự, không giật hay khựng.
- 1: Nhảy cóc, chồng chéo, chọn skill là chạy luôn
- 3: Đúng trình tự nhưng chuyển tiếp còn cứng
- 5: Như một đoạn phim liền mạch

### C7. Kỹ thuật & hiệu năng
Không giật frame, đúng z-order, không bị che, không lỗi input, không tụt FPS; thông số đặt trong config, không hard-code.
- 1: Có lỗi hiển thị hoặc input rõ ràng
- 3: Chạy ổn, còn hard-code hoặc thiếu tối ưu nhỏ
- 5: Sạch, ổn định, tái sử dụng tốt, giữ FPS mục tiêu

---

## 3. TRỌNG SỐ THEO NHÓM ANIMATION (%)

| Nhóm | C1 | C2 | C3 | C4 | C5 | C6 | C7 |
|---|---|---|---|---|---|---|---|
| Buff bản thân | 20 | 10 | 20 | 25 | 5 | 10 | 10 |
| Cast phép (animal/quái) | 15 | 25 | 20 | 10 | 5 | 15 | 10 |
| Skill thường | 15 | 15 | 20 | 15 | 15 | 10 | 10 |
| Status effect | 25 | 5 | 15 | 25 | 10 | 10 | 10 |
| Ultimate | 10 | 15 | 20 | 15 | 25 | 10 | 5 |
| Targeting | 35 | 5 | 5 | 5 | 0 | 15 | 35 |
| Chuyển lượt + HUD | 30 | 15 | 10 | 5 | 5 | 20 | 15 |
| Di chuyển map | 15 | 15 | 30 | 10 | 0 | 15 | 15 |
| Khác (bị đánh, chết, né, chí mạng, số sát thương, thắng/thua) | 20 | 15 | 15 | 10 | 20 | 10 | 10 |

**Công thức:** Điểm tổng (thang 100) = Σ (điểm tiêu chí ÷ 5 × trọng số)

---

## 4. ĐIỀU KIỆN BẮT BUỘC (MUST-HAVE) THEO NHÓM
Thiếu bất kỳ mục nào → animation **KHÔNG ĐẠT**, bất kể điểm tổng.

**Buff bản thân**
- [ ] Mỗi loại buff có ngôn ngữ hình ảnh riêng (công: đỏ/cam, hướng lên, sắc nhọn · thủ: xanh/vàng, khiên bao quanh · hồi máu: xanh lá, hạt bay lên mềm · tốc độ: vệt gió, nghiêng người…)
- [ ] Có pha kích hoạt (bùng lên), pha duy trì (aura/icon nhẹ khi còn hiệu lực), pha kết thúc
- [ ] Nhân vật có phản ứng cơ thể (vươn người, phồng lên, nhún)

**Cast phép**
- [ ] Trình tự: pose lấy đà → vòng tròn phép → phát skill → recovery
- [ ] Nhân vật có cử động rõ (không chỉ phát sáng tại chỗ)
- [ ] Vòng tròn phép mang màu và ký hiệu của hệ skill

**Skill thường**
- [ ] Hiệu ứng có animation nội tại, không chỉ tween vị trí
- [ ] Có pha hình thành và tan biến
- [ ] Mục tiêu có phản ứng khi trúng đòn
- [ ] Skill nước/sóng: sóng tự cuộn, có bọt, giọt bắn, có quán tính khi đổ xuống

**Status effect**
- [ ] Có đủ 3 pha: khi dính · duy trì (loop) · khi hết
- [ ] Có icon trên HUD và hiệu ứng trên chính nhân vật
- [ ] Choáng: sao/chim xoay quanh đầu + biểu cảm choáng
- [ ] Đóng băng: khối băng bao bọc, nhân vật đứng hình, vỡ băng khi hết
- [ ] Độc: tái màu + bọt/khói độc + hiệu ứng mỗi lần mất máu
- [ ] Bỏng: lửa bám người + tàn lửa + tint đỏ
- [ ] Các trạng thái khác đều có hình ảnh riêng, không dùng chung

**Ultimate**
- [ ] Có intro (tối màn hình, zoom, khung cinematic hoặc tên chiêu)
- [ ] Tối thiểu 3 lớp VFX chồng nhau (nền, chính, chi tiết)
- [ ] Có hiệu ứng môi trường (nứt đất, tuyết rơi, bão, mưa lửa…)
- [ ] Có rung màn hình và hit-stop mạnh hơn skill thường
- [ ] Có outro, trả màn hình về trạng thái bình thường mượt mà
- [ ] Mỗi ultimate có kịch bản riêng, không tái dùng khung của ultimate khác

**Targeting**
- [ ] Vòng chọn mục tiêu luôn ở lớp trên cùng, không bị che
- [ ] Vùng bấm (hit-area) đủ lớn, bấm trúng ngay lần đầu
- [ ] Có hover/feedback khi rê chuột hoặc chạm
- [ ] Đa mục tiêu hiển thị rõ tất cả đối tượng bị ảnh hưởng

**Chuyển lượt + HUD**
- [ ] Đối tượng đến lượt (kể cả quái) có hiệu ứng dễ nhận ra
- [ ] HUD trượt ra khi đến lượt, cuộn vào khi animation skill chạy
- [ ] HUD gọn, không che vùng combat

**Di chuyển map**
- [ ] Có sprite hoặc frame riêng cho từng hướng (tối thiểu 4)
- [ ] Đi lên/xuống mượt như đi ngang
- [ ] Có nhún bước, tốc độ frame khớp tốc độ di chuyển
- [ ] Có easing khi bắt đầu và dừng
- [ ] Sắp xếp độ sâu theo trục Y đúng (đi sau, đi trước vật thể)

---

## 5. THÔNG SỐ TIMING THAM KHẢO
Đây là điểm xuất phát để tinh chỉnh, không phải luật cứng.

| Hạng mục | Thời lượng tham khảo |
|---|---|
| Lấy đà (anticipation) | 150–300 ms |
| Vòng tròn phép | 300–600 ms |
| Skill thường (toàn bộ) | 0.8–1.8 s |
| Buff (pha kích hoạt) | 0.6–1.2 s |
| Hit-stop skill thường | 50–100 ms |
| Hit-stop ultimate | 150–300 ms |
| Ultimate (toàn bộ) | 2.5–5 s (có thể cho bỏ qua) |
| Chỉ báo chuyển lượt | 200–400 ms |
| HUD trượt ra/vào | 150–250 ms, ease-out |
| Status khi dính / khi hết | 300–600 ms |
| Chu kỳ bước đi trên map | 4–8 frame/bước, nhún 2–4 px |

---

## 6. NGƯỠNG ĐÁNH GIÁ

| Điểm tổng | Xếp loại | Hành động |
|---|---|---|
| 90–100 | Xuất sắc | Chốt |
| 80–89 | Tốt | Chốt, trừ Ultimate |
| 65–79 | Đạt | Phải cải thiện |
| < 65 | Không đạt | Làm lại |

**Quy tắc chặn:**
1. Thiếu bất kỳ mục MUST-HAVE nào → Không đạt.
2. Có tiêu chí nào ≤ 2 điểm → Không được chốt, dù tổng cao.
3. Ultimate phải đạt ≥ 90 mới được chốt.
4. Targeting và Chuyển lượt + HUD phải có C1 và C7 ≥ 4.

**Mục tiêu tối thiểu theo nhóm:**
Ultimate ≥ 90 · Skill thường, Cast, Status ≥ 85 · Buff, Chuyển lượt + HUD, Map ≥ 80 · Khác ≥ 80

---

## 7. NGUỒN BẰNG CHỨNG
Mỗi điểm số phải ghi rõ cách kiểm:
- **[Hình]** contact sheet hoặc frame (ghi tên file + số frame/mốc ms)
- **[Đồ thị]** dữ liệu vị trí/scale/alpha theo thời gian
- **[Code]** đọc code
- **[Playtest]** người dùng tự chơi thử

AI không tự chấm được phần "cảm giác khi chơi". Các tiêu chí C2 và C5 của Ultimate, Skill thường và Di chuyển map phải được người dùng xác nhận qua [Playtest] trước khi chốt.

---

## 8. MẪU BÁO CÁO CHO MỖI ANIMATION

### [Nhóm] – [Đối tượng] – [Tên skill/trạng thái]
| Tiêu chí | Trọng số | Điểm (0–5) | Bằng chứng | Nhận xét |
|---|---|---|---|---|
| C1 Rõ ràng | | | | |
| C2 Timing | | | | |
| C3 Sống động | | | | |
| C4 Đặc trưng | | | | |
| C5 Tác động | | | | |
| C6 Liền mạch | | | | |
| C7 Kỹ thuật | | | | |
| **Tổng** | 100 | | | |

- MUST-HAVE thiếu: …
- Xếp loại: …
- Cần làm để lên mức tiếp theo: … (mô tả bằng lời dễ hiểu trước, thông số kỹ thuật sau)
- Cần người dùng xác nhận qua playtest: …

---

## 9. BẢNG TỔNG HỢP CUỐI ĐỢT
| Nhóm | Số animation | Điểm TB | Xuất sắc | Tốt | Đạt | Không đạt |
|---|---|---|---|---|---|---|