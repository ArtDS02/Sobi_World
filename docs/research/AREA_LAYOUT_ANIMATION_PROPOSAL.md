# ĐỀ XUẤT — Nâng cấp layout và animation cho các khu (Area)

**Ngày:** 2026-11-09 · **Loại:** đề xuất, **không triển khai** · Thuộc phạm vi GĐ14 (art, animation, VFX — decision 017)
Ký hiệu: **[XM]** đã xác minh (code / chụp màn hình sandbox save max, 1600×900) · **[SL]** nhận định · **[ĐX]** đề xuất.
Liên quan: `PLOT_UPGRADE_FORGING_RESEARCH.md` §10.2 (môi trường nâng theo bậc tầng/khu).

---

## 1. Nguyên tắc

1. **Gameplay đọc được trước, đẹp sau**: ô, sinh vật, nút luôn rõ; trang trí không che, không lẫn với thứ bấm được.
2. **Mỗi khu một "ngữ pháp" bố cục**: tiền cảnh (khung, cây, mép), trung cảnh (nơi chơi), hậu cảnh (trời, xa); có **điểm nhìn chính** và **lối đi** dẫn mắt; không để khoảng trống lớn vô nghĩa.
3. **Chuyển động có mật độ vừa phải**: luôn có 2–4 thứ chuyển động nhẹ trên màn (gió, nước, sinh vật), không bao giờ cả màn rung rinh. Tất cả tắt / đứng yên khi **"Giảm chuyển động"**; có đường lui khi không có WebGL.
4. **Hiệu năng**: khu không hiển thị không chạy animation (Spec §2); chuyển động bằng code / tween / hạt trước, sheet khung hình chỉ cho máy móc (cối xay, guồng nước), rig pose-to-pose cho sinh vật (đã có, decision 050).
5. **Art qua id → manifest**, tạo bằng batch Gemini của chủ dự án (decision 022); bố cục chốt bằng **ảnh mẫu** trước (như Cloud 023, Garden 027, Aquarium 030 — cách này đã cho kết quả tốt nhất).
6. **Bản quyền (§9)**: mọi thiết kế gốc.

---

## 2. Hiện trạng từng khu

| Khu | Nền | Ngày / đêm | Thời tiết trên cảnh | Chuyển động đang có [XM] | Nhận xét từ ảnh chụp [SL] |
|---|---|---|---|---|---|
| **Sảnh** | ảnh vẽ đầy đủ | có (`PlazaLight`) | không | bướm, thú nhàn rỗi, trời | **Đẹp nhất hiện tại**: có trung tâm, lối đi tỏa ra, biển, cây đậu thần. Còn tĩnh: nước, đài phun, thuyền, cổng không động |
| **Farm** | **vẽ bằng code** (`backdropPaint.ts`), không phải ảnh | có (`DayNightDirector`) | có (mùa, `SeasonFxLayer`) | heo, mùa, quà | **Yếu nhất**: nền một màu (mùa đông trắng xóa), công trình rải dọc mép, **giữa sân trống**, không có lối đi / vùng chức năng; đọc như "đồ đặt trên giấy trắng" |
| **Garden** | ảnh vẽ (`bg_garden`), khu khác nhau chỉ bằng **màu phủ** | **không** | **không** (dù mưa ảnh hưởng gameplay: tưới mọi ô, ×1,25) | uốn cây, gà vịt dạo, vòi phun, drone | Ô nhỏ trên bãi cỏ phẳng lớn, nhiều khoảng trống; 4 khu trông gần như giống nhau; thanh công cụ dưới chiếm ~1/5 màn |
| **Cloud** | ảnh vẽ (đảo mây theo mẫu), tầng khác nhau chỉ bằng **màu phủ** | có (cờ `night`) | không | uốn hoa, chim mây + sâu, drone | Bố cục tốt (5×3, suối/vạc trái, sạp phải); 10 tầng có tên chủ đề nhưng trông như nhau trừ màu |
| **Aquarium** | ảnh vẽ, 5 nơi theo cấp bể | có (đom đóm, ánh trăng) | có (mưa/tuyết gợn mặt nước) | cá bơi (nhiều kiểu), chăm sóc, khoảnh khắc | Đẹp nhưng **rối khi đông**: cá dồn một cụm, **mặt cảm xúc trên mọi con**, nước đục phủ xanh cả màn |
| **Adventure** | ảnh trại phía sau + bản đồ vẽ (v2/v3) | không | có (trong bản đồ) | rig chiến binh / quái, VFX trận, người đi trên bản đồ | **Trại là một bảng điều khiển** (thẻ vùng, thẻ bạn đồng hành, đội hình) phủ gần kín cảnh — giàu thông tin nhưng không có "không gian" |

Chung [XM/SL]: HUD dưới (bảng hạt + nhóm nút) cao, lặp lại ở Garden/Cloud/Aquarium; chuyển khu là đổi màn tức thì; không có "đời sống" chung (người dân, mây trôi qua giữa các khu).

---

## 3. Cải tiến dùng chung cho mọi khu [ĐX]

| # | Hạng mục | Nội dung | Lợi ích |
|---|---|---|---|
| C1 | **Ngày / đêm + thời tiết mọi khu** | một lớp ánh sáng + hạt dùng chung (`ui/world`): Garden có mưa thật (và ô trông "đã tưới" khi mưa), nắng chiều; Cloud có sương / cầu vồng; Adventure có giờ trong ngày | thế giới thống nhất; Garden hiện **thiếu đúng chỗ thời tiết có tác dụng** |
| C2 | **Thư viện chuyển động môi trường** | các "hành vi" tái dùng: lay theo gió (đã có `breezeAt`), nước lấp lánh, khói / hơi nước, cánh rơi, mây trôi, chim bay ngang, bóng mây lướt trên mặt đất | mỗi khu chỉ cần khai báo, không viết lại |
| C3 | **HUD gọn** | thanh dưới thu gọn được (chỉ hiện bảng hạt khi đang gieo), nút hành động gom thành cụm tròn | trả lại ~15% chiều cao cho cảnh |
| C4 | **Chuyển khu có hiệu ứng** | Sảnh → khu: mây phủ / lá rơi / bọt nước / cổng xoáy theo khu (≤ 0,6 giây, bỏ được) | cảm giác "đi tới một nơi" |
| C5 | **Thông tin hiện khi cần** | biểu tượng trạng thái (cảm xúc cá, heo) chỉ hiện khi có vấn đề hoặc khi rê chuột | cảnh bớt rối |
| C6 | **Môi trường theo bậc** (gắn nâng cấp tầng/khu) | lớp trang trí + vật mốc xuất hiện dần (xem `PLOT_UPGRADE_FORGING_RESEARCH.md` §10.2) | layout "lớn lên" cùng người chơi |

---

## 4. Đề xuất từng khu [ĐX]

### 4.1 Farm — ưu tiên 1 (nặng nhất)

**Bố cục:** thay nền vẽ bằng code bằng **ảnh vẽ theo ảnh mẫu** (như Garden/Cloud), chia 3 vùng rõ:
- **Khu chuồng & sân heo** ở giữa (điểm nhìn chính, heo đi lại ở đây — không để giữa sân trống);
- **Dãy sản xuất** (giếng, máng ăn, kho) dọc một lối đất;
- **Góc chợ** (cửa hàng, bảng đơn hàng) gần lối ra Sảnh.
Lối đi đất / đá nối các vùng; hàng rào làm khung tiền cảnh; đồi + cối xay ở hậu cảnh. Bốn mùa là **biến thể màu + lớp phủ** của cùng ảnh (đã có hệ mùa), không còn "trắng xóa".

**Chuyển động:** cánh cối xay quay; khói ống khói; gàu giếng; cỏ / hoa ven lối lay gió; gà mổ; heo con chạy đuổi; tuyết đọng mái (đông), lá rơi (thu), hoa rơi (xuân); đom đóm đêm hè.

**Art:** 1 nền × (mùa phủ), sheet cối xay (6–8 khung), vài đạo cụ viền. Cỡ: L.

### 4.2 Garden — ưu tiên 2

**Bố cục:** ô to hơn và khít hơn theo **luống có lối đi giữa** (2–3 dãy luống thay vì lưới thưa giữa bãi cỏ); mép ruộng có mương nước; mỗi khu **một cảnh riêng** theo tên:
- Vườn Nhà: căn nhà nhỏ, giếng, hàng rào tre;
- Đồng Lúa Vàng: ruộng bậc, guồng nước, cò bay;
- Đồi Bắp Nắng: sườn đồi, cối xay gió, bù nhìn;
- Thung Lũng Rau Củ: suối nhỏ, cầu tre, vườn ong.

**Chuyển động:** guồng nước quay, nước mương chảy; **mưa thật** (giọt, vũng, ô sẫm màu "đã tưới"), cầu vồng sau mưa; ong / bướm; bóng mây trôi qua ruộng; đêm: đom đóm, đèn nhà.

**Art:** 4 nền khu (hoặc 1 nền + 4 lớp vật mốc), viền luống, guồng nước (sheet). Cỡ: L. Gắn với bậc khu (§10.2).

### 4.3 Cloud — ưu tiên 3

**Bố cục:** giữ bố cục hiện tại (đã duyệt, decision 023). Thêm **chiều sâu**: đảo nhỏ bay xa (parallax 2–3 lớp), mây trôi ngang dưới đảo, **mỗi tầng một vật mốc theo tên** (Hoa Anh Đào: cây anh đào; Sao Băng: sao băng định kỳ; Ánh Trăng: vầng trăng lớn; Đỉnh Mây: cung điện mây xa).

**Chuyển động:** đảo nhấp nhô rất nhẹ; nước suối chảy + giọt rơi vào; vạc sủi bọt, hơi bốc; cánh hoa / bồ công anh bay; cầu vồng lấp lánh; đêm: đèn lồng sáng, sao.

**Art:** 10 vật mốc tầng + 3 lớp mây parallax + bộ trang trí theo bậc. Cỡ: M–L.

### 4.4 Adventure (trại) — ưu tiên 4

**Bố cục:** biến trại từ **bảng thẻ** thành **cảnh trại**: lửa trại ở giữa, lều, bảng nhiệm vụ, xưởng rèn, cổng xuất phát; chiến binh đứng / ngồi quanh lửa (dùng **rig pose-to-pose đã có**). Bấm vào lửa trại → bảng đội hình; bấm bảng gỗ → chọn vùng; bấm lò rèn → cửa hàng & lò rèn. Bảng thẻ hiện tại giữ làm "chế độ danh sách" cho người thích nhanh.

**Chuyển động:** lửa bập bùng + tàn lửa, khói; chiến binh nhàn rỗi (thở, ngáp, mài vũ khí); cờ bay; đêm: lửa sáng hơn, đom đóm.

**Art:** 1 nền trại, lều / lò rèn / cờ, sheet lửa (Studio VFX đã làm được dạng này). Cỡ: M (rig sẵn có).

### 4.5 Aquarium — ưu tiên 5 (đánh bóng)

**Bố cục:** giữ 5 nơi theo cấp bể. Sửa độ rối: cá **tản theo tầng nước** (đáy / giữa / mặt theo loài) thay vì dồn một cụm; mặt cảm xúc chỉ hiện khi cá đói / bệnh hoặc rê chuột (C5); nước đục chỉ phủ **mờ dần theo độ sâu**, không phủ xanh cả màn.

**Chuyển động:** tia nắng xuyên nước (god rays), vân sáng đáy (caustics), rong lay, cột bọt từ đá, đàn cá nhỏ trang trí xa, sứa trôi.

**Art:** chủ yếu code (shader / hạt); vài đạo cụ. Cỡ: S–M.

### 4.6 Sảnh — ưu tiên 6 (đánh bóng nhẹ)

**Chuyển động:** sóng và lấp lánh trên biển, thuyền nhấp nhô; đài phun nước chảy; cổng Adventure xoáy sáng; cây đậu thần lá lay, mây trôi quanh đỉnh; cối xay xa quay; chim bay ngang theo đàn. (Không thêm nhân vật đi lại ở Sảnh — decision 025.)

**Art:** gần như chỉ code + 1–2 sheet nhỏ. Cỡ: S.

---

## 5. Kỹ thuật chuyển động (tôi chọn theo ủy quyền về animation; báo lại để anh biết)

| Loại | Cách làm | Dùng cho |
|---|---|---|
| Lay theo gió, nhấp nhô, trôi | tween / hàm thời gian trong code (`breezeAt`, `plantBend` đã có) | cây, hoa, đảo, thuyền, cờ |
| Nước, ánh sáng, sương, mưa | hạt + texture mềm (`softTextures` đã có), shader nhẹ khi có WebGL | suối, biển, mưa, tia nắng |
| Máy móc lặp | sheet 6–8 khung | cối xay, guồng nước, lửa |
| Sinh vật | rig pose-to-pose (decision 050) / sprite có sẵn | chiến binh ở trại, gà vịt, ong |
| VFX lớn (nâng bậc, đúc hiếm) | Studio chỉ cho chuyển động VFX (decision 051) | hiệu ứng thưởng |

Mỗi khu có "ngân sách chuyển động" (số đối tượng động tối đa) và một công tắc tắt toàn bộ khi giảm chuyển động.

---

## 6. Lộ trình gợi ý

| Bước | Việc | Đầu ra để anh duyệt |
|---|---|---|
| L0 | Chốt **ảnh mẫu bố cục** từng khu (tôi phác bố cục + ghi chú → anh tạo ảnh mẫu Gemini, hoặc anh gửi mẫu) | 6 ảnh mẫu |
| L1 | Dùng chung: C1 ngày/đêm + thời tiết, C2 thư viện chuyển động, C5 trạng thái khi cần | demo trên Garden (mưa) |
| L2 | Farm nền mới + chuyển động | Farm 4 mùa |
| L3 | Garden 4 khu + mưa | 4 khu |
| L4 | Cloud parallax + vật mốc tầng (đi cùng nâng cấp tầng nếu được mở băng) | 10 tầng |
| L5 | Adventure cảnh trại | trại + rig |
| L6 | Aquarium, Sảnh đánh bóng | — |
| L7 | C3 HUD gọn, C4 chuyển khu | — |

Tiêu chí nghiệm thu mỗi khu: không khoảng trống lớn vô nghĩa; thấy rõ điểm chính; 2–4 chuyển động nền; ngày/đêm + thời tiết đúng gameplay; "Giảm chuyển động" đứng yên; không tụt khung hình ở máy cấu hình thấp (đo bằng `scripts/perf`); không lỗi console.

---

## 7. Câu hỏi cho chủ dự án

1. Thứ tự ưu tiên trên (Farm → Garden → Cloud → Adventure → Aquarium → Sảnh) có đúng ý anh không?
2. Anh muốn **tôi phác bố cục** (sơ đồ + ghi chú) để anh tạo ảnh mẫu, hay anh tự gửi ảnh mẫu từng khu?
3. Trại Adventure: đồng ý chuyển thành **cảnh trại** (giữ bảng thẻ làm chế độ danh sách)?
4. Thu gọn HUD dưới (C3) có được không, hay giữ như HUD dùng chung đã duyệt (decision 031)?
5. Layout Garden/Cloud có nên làm **cùng lúc** với nâng cấp tầng/khu (môi trường theo bậc) để không vẽ hai lần không?
