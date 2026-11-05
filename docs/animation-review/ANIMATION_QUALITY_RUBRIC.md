# SOBI ADVENTURE – BỘ TIÊU CHUẨN ĐÁNH GIÁ ANIMATION
Phiên bản 1.1 (v1.0 của chủ dự án + bổ sung quy trình ở §10, đánh dấu **[v1.1]**) · Áp dụng cho: combat (animal, quái vật, skill, buff, status, ultimate, targeting, chuyển lượt, HUD) và di chuyển trên map.
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
2. Có tiêu chí nào ≤ 2 điểm → Không được chốt, dù tổng cao. *(Tiêu chí có trọng số 0 trong nhóm — vd C5 của Targeting và Map — ghi `N/A`, không chấm, không tính vào quy tắc này. [v1.1])*
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
---

## 10. BỔ SUNG v1.1 CHO QUY TRÌNH TỰ ĐỘNG (không đổi thang điểm hay trọng số của v1.0)

Phần này làm cho rubric dùng được bởi AI trong vòng Test → Review → Fix. Khi mâu thuẫn với §1–§9, **§1–§9 thắng**, trừ khi mục nói rõ là làm rõ.

### 10.1 Đơn vị chấm (tránh chấm 100+ animation từng cái mỗi vòng)
| Nhóm | Đơn vị chấm |
|---|---|
| Ultimate (12) | **từng cái** |
| Status (25) | **từng status**, mỗi status 3 pha (dính · loop · hết) → điểm của status = điểm pha thấp nhất ghép với trung bình ba pha, ghi cả hai |
| Skill thường / Buff / Cast | **theo họ (hệ × loại)**: chấm 1 đại diện + **mọi case bị cờ tự động** (§10.3); các case còn lại ghi "theo họ" |
| Targeting, Chuyển lượt + HUD, Map | từng tình huống đã liệt kê trong manifest (1/2/3 mục tiêu, 4 hướng…) |
| Khác | từng loại (bị đánh, KO, né, chí mạng, số sát thương, thắng/thua) |
Điểm lẻ **không dùng**: chỉ số nguyên 0–5. Nghi giữa hai mức thì chọn mức thấp và nói rõ điều gì còn thiếu để lên mức trên.

### 10.2 Ánh xạ sang mức độ lỗi (severity) của FEEDBACK
| Tình huống | Severity |
|---|---|
| Thiếu MUST-HAVE của Ultimate / Targeting / Chuyển lượt+HUD; hoặc C7 ≤ 1; hoặc lỗi input/z-order | **blocker** |
| Thiếu MUST-HAVE ở nhóm khác; hoặc tiêu chí ≤ 2; hoặc dưới *mục tiêu tối thiểu* của nhóm (§6) | **major** |
| Còn lại (điểm đủ nhưng chưa tới mức Tốt/Xuất sắc), hoặc `taste` | **minor** |
Điều kiện `done` của quy trình = không còn blocker/major, **và** mọi đơn vị chấm đạt mục tiêu tối thiểu §6, **và** các mục [Playtest] của §7 đã được chủ dự án xác nhận. Nếu chưa có xác nhận: trạng thái `awaiting_playtest`, không phải `done`.

### 10.3 Kiểm tra tự động từ harness (nguồn bằng chứng mới: **[Auto]**)
Harness (`manifest.json → cases[].metrics`) cho số đo; TD dùng chúng để ghi cờ. Bảng khoảng tham khảo lấy từ §5, **cờ chỉ là gợi ý để TD kiểm tra, không tự động hạ điểm** (§5 là "không phải luật cứng"); TD phải ghi lý do nếu chấp nhận ngoài khoảng.
| Số đo | Khoảng (từ §5) | Cờ |
|---|---|---|
| `hitStopMs` skill thường | 50–100 | `HITSTOP_RANGE` |
| `hitStopMs` ultimate | 150–300 | `HITSTOP_RANGE` |
| `anticipationMs` (start→release) | 150–300 | `ANTICIPATION_RANGE` |
| `circleMs` (start→cast) | 300–600 (chỉ khi `circle`) | `CIRCLE_RANGE` |
| `durationMs` skill thường | 800–1800 | `DURATION_RANGE` |
| `durationMs` ultimate | 2500–5000 | `DURATION_RANGE` |
| `statusApplyMs` / `statusExpireMs` | 300–600 | `STATUS_RANGE` |
| Ultimate: số lớp VFX (cue khác loại chồng nhau) | ≥ 3 | `ULT_LAYERS` |
| Ultimate: có cue `dim`/letterbox đầu **và** cue trả về cuối | cả hai | `ULT_INTRO_OUTRO` |
| Ultimate: có thể bỏ qua (skip) | có | `ULT_SKIPPABLE` |
| Số frame có thay đổi pixel | > 0 sau `release` | `NO_VISIBLE_CHANGE` |
| VFX tràn ra ngoài khung sân | 0 | `OVERFLOW` |
| Status có đủ 3 pha trong data | dính/loop/hết | `STATUS_PHASE_ABSENT` (pha vắng = thiếu MUST-HAVE) |
| Hai case "khác ID" có chuỗi cue giống nhau y hệt | không | `DUPLICATE_SCRIPT` (MUST-HAVE Ultimate #6, Status "không dùng chung") |
Lưu ý: số trong khoảng **không** chứng minh animation tốt; nó chỉ loại bớt lỗi hiển nhiên. C1, C3, C4 vẫn phải dựa vào **[Hình]**.

### 10.4 Tiêu chí bổ sung (ghi vào C7, không thêm cột)
- **Chống nhấp nháy (an toàn quang học)**: không quá 3 lần chớp toàn màn hình/giây, không chớp trắng toàn màn hình > 100 ms liên tục. Vi phạm → C7 ≤ 2.
- **"Giảm chuyển động" (`reduce`)**: mỗi nhóm có ít nhất một case chụp với `reduce:true`; hiệu ứng vẫn phải đọc được (C1 ≥ 3), không mất thông tin quan trọng. Thiếu bản `reduce` → C7 ≤ 3.
- **Bỏ qua / tua nhanh (x2)**: ultimate bỏ qua được; chế độ x2 (`fast`) không làm mất pha lấy đà/impact. Vi phạm → C6 ≤ 3.
- **Ngân sách hiệu năng**: mục tiêu 60 FPS; trần hạt theo `fxBursts` (~420). Số hạt cực đại và thời gian khung hình xấu nhất lấy từ harness; vượt trần → C7 ≤ 2.
- **Nhất quán giữa họ**: các skill cùng hệ cùng cấp có mức "hoành tráng" tương xứng (sheet tổng); lệch rõ → ghi vào C4 của case lệch.

### 10.5 Hiệu chuẩn (làm một lần ở vòng 1, lưu vào `rounds/round-01/CALIBRATION.md`)
AI dễ lệch mức khi chấm. Trước khi chấm hàng loạt, TD chọn **3 neo**: một animation mà TD cho là 1–2 điểm, một 3, một 4–5, nêu lý do bằng ảnh. Chủ dự án chỉ cần đọc và sửa nếu thấy sai. Các vòng sau đối chiếu neo này; không đổi neo giữa chừng nếu không ghi lý do.

### 10.6 Bằng chứng cho từng điểm (bổ sung §7)
Thêm nguồn **[Auto]** (số đo/cờ của harness, ghi `caseId` + tên chỉ số). Quy tắc:
- C2 và C5 có thể sơ bộ bằng **[Auto]+[Hình]** (hit-stop, thời lượng, phản ứng mục tiêu trong ô impact), nhưng **chốt** cần [Playtest] (đúng §7).
- C1, C3, C4, C6: [Hình] bắt buộc; điểm chỉ [Code] thì ghi rõ "chưa xác nhận bằng hình" và không được vượt 3.
- Mọi điểm ≥ 4 phải trỏ tới ô cụ thể (`t=… ms`) chứng minh điều đó.

### 10.7 Mẫu báo cáo rút gọn cho nhóm chấm "theo họ"
`| họ (hệ × loại) | đại diện | cờ [Auto] | C1…C7 | tổng | loại | ID lỗi |` — mỗi dòng một họ; chỉ mở bảng §8 đầy đủ cho đơn vị bị blocker/major hoặc dưới mục tiêu.

### 10.8 Nhật ký thay đổi
- v1.0: bản của chủ dự án.
- v1.1: N/A cho trọng số 0; đơn vị chấm; ánh xạ severity; cờ [Auto]; an toàn quang học/`reduce`/skip/hiệu năng; hiệu chuẩn neo; quy tắc bằng chứng; trạng thái `awaiting_playtest`.

### 10.9 Đề xuất v1.2 — KHÔNG ÁP DỤNG (chủ dự án quyết giữ nguyên rubric, 2026-11-04)
Phát sinh từ vòng 1 (FEEDBACK `D-1`): ba ultimate hỗ trợ (`skill_ult_qs`, `_qt`, `_mm`) không gây đòn lên kẻ địch. Đề xuất: với ultimate **hỗ trợ**, MUST-HAVE "rung màn hình và hit-stop mạnh hơn skill thường" được thay bằng "một khoảnh khắc nhấn ≥ 100 ms tại điểm bùng buff (đứng hình nhẹ, hoặc flash + zoom punch), có rung nhẹ". Chủ dự án chọn: giữ nguyên v1.1 hay duyệt đề xuất này.
