# SOBI WORLD — GAME BALANCE

Con số **khởi điểm**. Tất cả lưu trong `content/balance/` và chỉnh được qua Admin Dashboard.
Thang thời gian và mức phạt đã chốt ở `docs/decisions/003-balance-timescale.md` (ưu tiên hơn số cũ của Sobi Farm).
**Thang tiền giữ theo Sobi Farm** (vốn 5.000, heo Common 500, giá ô chuồng, cửa hàng). Chênh lệch khác ghi vào `docs/PROGRESS.md`.

Thời gian luôn là **giờ thật**. Nhịp mục tiêu: người chơi mở game 2–3 lần/ngày là đủ.

---

## 1. Thời gian

| Thông số | Giá trị |
|---|---|
| Buổi trong ngày | Sáng 05–10, Ngày 10–17, Chiều 17–20, Đêm 20–05 |
| Bước mô phỏng online / offline | 1 phút / 10 phút |
| Bù offline tối đa | 30 ngày |
| Bảo vệ người chơi mới (không bệnh) | 72 giờ đầu |
| Ân hạn sau khi mở game (sinh vật nguy kịch không chết trong bù offline) | 12 giờ (decision 004) |
| Tự động lưu | 60 giây |
| Làm mới mục tiêu hằng ngày | 00:00 giờ máy |

---

## 2. Heo

### 2.1 Giai đoạn lớn (giống Common, mỗi giống có hệ số tốc độ riêng)

| Giai đoạn | Tuổi | Cân nặng | Cho phép |
|---|---|---|---|
| Baby | 0–6 giờ | 2–5 kg | — |
| Young | 6–24 giờ | 5–60 kg | — |
| Adult | 24–48 giờ | 60–90 kg | Xuất chuồng, chọn mục đích |
| Mature | 48 giờ trở đi | 90–110 kg (chuẩn 100) | Lai giống |

Hệ số thời gian lớn theo rarity: Common ×1 · Uncommon ×1,25 · Rare ×1,5 · Epic ×2 · Legendary ×2,5.
Heo chỉ lớn khi Đói > 30 và không bệnh. Không có chết vì già.

### 2.2 Nhu cầu (thang 0–100)

| Chỉ số | Thay đổi |
|---|---|
| Đói | −8/giờ (đói hết sau ~12 giờ) |
| Sạch sẽ | −4/giờ; thêm −1/giờ cho mỗi đống phân chưa dọn trong chuồng (tối đa −4) |
| Năng lượng | −5/giờ khi thức; +12/giờ khi ngủ (ngủ ban đêm) |
| Tâm trạng | Trung bình của Đói, Sạch sẽ, Năng lượng; + thưởng Bond và trang trí |
| Phân | Heo Young trở lên tạo 1 phân / 8 giờ |

Thao tác hàng loạt bắt buộc: "Dọn cả chuồng", "Tắm cả chuồng" (một lần cho mọi heo), đổ máng bằng chuột.

### 2.3 Thức ăn

| Thức ăn | Đói | Thưởng khác |
|---|---|---|
| Thức ăn heo | +35 | — |
| Thức ăn cao cấp | +50 | Tâm trạng +10 |
| Cỏ (ăn vặt) | +10 | Tâm trạng +3 |
| Món yêu thích | +20 | Bond +2 |

Máng tự cho ăn khi heo có Đói < 40 và máng còn thức ăn.

### 2.4 Bệnh và chết

| Thông số | Giá trị |
|---|---|
| Kiểm tra nguy cơ | Mỗi giờ |
| Đói = 0 | +15% nguy cơ |
| Sạch sẽ < 20 | +10% nguy cơ |
| Tâm trạng < 20 | +5% nguy cơ |
| Giá trị khi bệnh | −10% mỗi 24 giờ bệnh, tối đa −30%; **chữa xong hồi đủ** |
| Nguy kịch | Sau 48 giờ bệnh |
| Chết | Sau 72 giờ bệnh (không chết trong bù offline, xem ân hạn mục 1) |
| Thuốc | ~8% giá heo Common (≈40 Coins), khỏi ngay, miễn bệnh 6 giờ |

Có thức ăn trong máng thì heo không đói → không có nguy cơ bệnh vì đói.

### 2.5 Giá trị xuất chuồng

```text
Giá = giáGốcGiống × hệSốRarity × hệSốQuality × hệSốCânNặng × hệSốSứcKhỏe × hệSốChợ
hệSốCânNặng = min(cânNặng / 100, 1.1)
hệSốSứcKhỏe = max(0.7, 1 − 0.1 × số ngày bệnh)   (khỏe hoặc đã chữa = 1)
hệSốChợ    = 0.9 / 1.0 / 1.2 tùy ngày
```

| Rarity | Hệ số | | Quality | Hệ số |
|---|---|---|---|---|
| Common | 1 | | Normal | 1.0 |
| Uncommon | 1.5 | | Good | 1.2 |
| Rare | 2.5 | | Great | 1.5 |
| Epic | 4 | | Excellent | 2.0 |
| Legendary | 7 | | Perfect | 3.0 |
| Mythic | 12 | | | |

> Triển khai GĐ2 (decision 009): hệ số rarity đã nằm sẵn trong giá gốc từng bậc (`sellGold`), không nhân lần hai; xuất chuồng được từ Adult.

**Quality** tính từ tâm trạng trung bình suốt đời: ≥90 Perfect, ≥75 Excellent, ≥60 Great, ≥40 Good, còn lại Normal. Bond 3 tim trở lên: 20% cơ hội lên thêm 1 bậc.

Sobi Farm hiện có 5 bậc (Common → Legendary); **Mythic để dành**, chưa dùng.

**Kiểm tra lãi** (giữ thang tiền Sobi Farm, heo Common mua 500): lãi một lứa Common sau ~24 giờ phải dương rõ khi mua thức ăn, và tăng mạnh khi tự làm thức ăn từ Garden (lý do mở Garden). Con số cụ thể tính lại ở GĐ2 bằng `npm run sim:economy`, ghi vào `docs/PROGRESS.md`.

### 2.6 Công trình Farm

| Công trình | Lv1 | Lv2 | Lv3 | Lv4 |
|---|---|---|---|---|
| Chuồng (số heo) | 6 | 12 | 20 | 30 |
| Giá nâng cấp chuồng | — | 800 | 3.000 | 10.000 + vật liệu Adventure |
| Máng tự động (sức chứa thức ăn) | 30 | 80 | 200 | — |  <!-- GĐ2: content/farm/balance.json TROUGH_LEVELS, giá nâng 1.200 / 4.000 -->
| Giá máng | 300 | 1.200 | 4.000 + vật liệu | — |

Máng Lv1 phải đủ cho chuồng đầu ăn ~2 ngày; cấp cao nhất 5–7 ngày. Giá chuồng/máng quy đổi sang thang tiền Sobi Farm ở GĐ2
(Sobi Farm hiện mở theo từng ô: `SLOT_UNLOCKS`, tối đa 24 ô).

---

## 3. Bond (thân thiết)

| Thông số | Giá trị |
|---|---|
| Thang | 0–100 (5 tim, mỗi tim 20) |
| Vuốt ve | +3, tối đa 2 lần/ngày/con |
| Món yêu thích | +2 |
| Chăm khi bệnh (cho thuốc) | +5 |
| Giảm | Không giảm theo thời gian |
| 3 tim | 20% cơ hội +1 bậc Quality |
| 5 tim | Lộ 1 trait ẩn; +10% chỉ số khi phiêu lưu |

---

## 4. Lai giống

| Thông số | Giá trị |
|---|---|
| Điều kiện | 2 heo Mature, khỏe, Bond ≥ 1 tim |
| Thời gian | 12 giờ ở Trạm lai giống |
| Số con | 1–2 |
| Nghỉ sau lai | 24 giờ |
| Trait | Mỗi con có tối đa 3 trait, mỗi trait 50% từ bố hoặc mẹ |
| Đột biến cơ bản | 2% (tăng nhờ hoa Cloud, thời tiết cầu vồng) |
| Pity | Mỗi lần lai không ra kết quả Rare+ khi có thể: +2% cho lần sau, reset khi trúng |

Bảng tổ hợp cụ thể nằm trong `content/breeding/`, chỉnh qua Admin.

---

## 5. Garden

| Cây | Giá hạt | Thời gian lớn | Sản lượng | Giá bán | Công dụng chính |
|---|---|---|---|---|---|
| Cỏ | 2 | 1 giờ | 3 | 1 | Phân bón, ăn vặt heo |
| Lúa mì | 4 | 3 giờ | 3 | 3 | Thức ăn heo |
| Bắp | 5 | 4 giờ | 3 | 4 | Thức ăn heo |
| Khoai tây | 6 | 5 giờ | 3 | 5 | Thức ăn cá, đơn hàng |
| Cà rốt | 8 | 6 giờ | 2 | 10 | Món yêu thích, thức ăn cao cấp |

| Thông số | Giá trị |
|---|---|
| Ô đất ban đầu | 6 (mở rộng +3, giá tăng dần: 200, 500, 1.200…) |
| Không tưới | Lớn với tốc độ 50% |
| Phân bón | −25% thời gian, +1 sản lượng |
| Héo | Chín quá 48 giờ không thu: sản lượng −50% |
| Vòi tưới tự động | Lv1 tưới 6 ô, giá 500 |

---

## 6. Recipe khởi điểm

| Recipe | Đầu vào | Đầu ra | Thời gian | Công trình |
|---|---|---|---|---|
| Thức ăn heo | Bắp ×2, Lúa mì ×1 | Thức ăn heo ×4 | 10 phút | Máy xay |
| Thức ăn cao cấp | Bắp ×2, Cà rốt ×1 | Thức ăn cao cấp ×2 | 20 phút | Máy xay |
| Phân bón | Phân ×3, Cỏ ×1 | Phân bón ×2 | 30 phút | Thùng ủ |

Giá mua ở chợ: Thức ăn heo 6, Thức ăn cao cấp 15, Phân bón 12.

---

## 7. Tiến trình và mở khóa

| Thông số | Giá trị |
|---|---|
| EXP cần cho level n | `100 × n^1.5` (làm tròn) |
| EXP hành động | Cho ăn 1, dọn phân 2, vuốt ve 1, thu hoạch 2, chế biến 3, xuất chuồng 20, đơn hàng 15–40 |
| World Development | Tổng level các Area + (mục Codex / 10) + số công trình Lv3 trở lên |

| Area | Điều kiện mở |
|---|---|
| Sobi Farm | Có sẵn |
| Sobi Garden | Farm Lv3 |
| Sobi Aquarium | Farm Lv6, Garden Lv4 |
| Sobi Cloud | Garden Lv6, Aquarium Lv3, World Development ≥ 15 |
| Sobi Adventure | Farm Lv8, World Development ≥ 20 (nhận 1 heo phiêu lưu khởi đầu qua nhiệm vụ mở khóa) |

---

## 8. Hệ thống gắn kết

| Hệ thống | Giá trị |
|---|---|
| Bảng đơn hàng | 3 ô (ô thứ 4 ở World Development 10); 1 đơn mới mỗi 3 giờ cho ô trống |
| Thưởng đơn hàng | 1.4 × giá chợ của vật phẩm + EXP; 5% kèm hạt giống hiếm |
| Mục tiêu hằng ngày | 3 mục tiêu, mỗi mục 50–150 Coins; xong cả 3 thêm EXP |
| Thành tựu | 5–30 Gems mỗi thành tựu |
| Loot hiếm Adventure | 1–3 Gems, tỉ lệ 3% mỗi rương |
| Gems dùng cho | Đồ trang trí độc quyền, đổi đơn hàng (5 Gems), mở rộng kho vượt mức tối đa, giống heo đặc biệt |
| Chợ theo ngày | 2 nhóm hàng ×1.2, 1 nhóm ×0.9, chọn theo seed ngày |
| Túi đồ | 40 ô, stack 99; mỗi cấp Kho +20 ô |

Gems không được mua lợi thế lớn về sức mạnh (không pay-to-win, kể cả khi chưa có nạp tiền).

---

## 9. Aquarium, Cloud, Adventure (khởi điểm, agent tinh chỉnh ở giai đoạn tương ứng)

| Mục | Giá trị |
|---|---|
| Cá: thời gian lớn | 6–24 giờ tùy loài |
| Cá: đói | −5/giờ; bể bẩn tăng nguy cơ bệnh giống heo |
| Bể cá Lv1 | 5 cá (GĐ8 chốt 4 cấp 5 / 8 / 12 / 16 cá, nước, vảy, ngọc trai: `content/aquarium/`, decision 015) |
| Câu cá | 1 lần / 2 phút, thành công theo mini thao tác đơn giản (GĐ8: căn phao trong vùng xanh; điểm càng cao càng dễ ra cá hiếm) |
| Hoa Cloud | 4–12 giờ, cần Nước tinh khiết |
| Healing Potion | Hoa hiếm ×1 + Nước tinh khiết ×1 → chữa bệnh + Tâm trạng +20 |
| Đội Adventure | Tối đa 3 sinh vật |
| Nguyên tố | Lửa > Gió > Đất > Nước > Lửa (khắc chế: ×1.5 sát thương) |
| Skill | Mỗi sinh vật: đòn thường + 2 skill (mở thêm ở level 10, 20) |
| Kiệt sức khi thua | Nghỉ 4 giờ |
| Năng lượng phiêu lưu | Mỗi lần vào vùng tốn 30 Năng lượng của sinh vật |
| Vùng đầu tiên | Rừng: 5 ô sự kiện + 1 trùm |
