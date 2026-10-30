# Đề xuất bản đồ Adventure v2 — góc nhìn, khu ẩn, tha hóa, phân loại quái

Ngày: 2026-10-30 · Nhánh: `phase-14-art` · **Trạng thái: đã duyệt 2026-10-30 → decision 045** (câu trả lời ở mục 7). Chưa sửa code.
Đầu vào: phản hồi của chủ dự án ngày 2026-10-30, `docs/WORLD_MAP_AUDIT.md`, decision 043.
Tham khảo phong cách: Epic Battle Fantasy 3 (EBF3), chỉ học cách dàn dựng (camera bám nhân vật, nhiều lối, khu ẩn, rương rải rác, quái nhìn thấy trên map). Không sao chép map, quái hay nội dung của game đó.

---

## 1. Câu trả lời đã chốt (2026-10-30)

| Câu | Chốt |
|---|---|
| Q2 | N1, N2, N3 thuộc Rừng; N4, N5 thuộc Núi; N6 thuộc Tàn Tích. |
| Q3 | Vùng Biển N7–N9 (`zone_coast`) mở sau trùm Núi, cho đội cấp 14–24. |
| Q6 | Map nhánh **có** cổng dịch chuyển. Thêm: map không còn đi từ cổng A đầu map tới cổng B cuối map; mỗi map có nhiều lối đi, ở nhiều vị trí khác nhau. |
| Q7 | **Mọi quái vật đều bị tha hóa** (kể cả Hộ Pháp Cổ Đại). Quái và bản đồ cần dấu ấn tha hóa nhìn thấy được. |
| Q8 | Dùng N01–N12 cho map nhánh; mở batch quái biển. |
| Q9 | Map nhánh có nhiều rương thưởng hấp dẫn, rải rác; quái đông hơn, mạnh hơn. Rương có quái canh giữ thưởng tốt hơn rương thường. |

Q1, Q4, Q5 đã chốt trước đó (decision 043). Riêng **Q5 (hướng 3)** có thể phải xem lại, xem mục 3.

## 2. Phản hồi mới và nguyên nhân trong code hiện tại

| # | Phản hồi | Nguyên nhân |
|---|---|---|
| 1 | Góc nhìn quá rộng, thấy gần hết map | Màn thiết kế 1600 × 900, map 2000 × 1120 (50 × 28 ô, ô 40 px), zoom ≈ 1. Màn hình chứa ~80 % map, camera gần như đứng yên. |
| 2 | Map xấu, nhạt, không có khu ẩn, asset đặt chưa hợp lý | Map vẽ bằng 5 loại tile phẳng mỗi vùng (`ground, path, bridge, wall, water`), không có lớp chồng, không chuyển tiếp mép, đạo cụ rải theo seed. Chưa có cơ chế che / lộ. |
| 3 | Quái quá ít, quá nhỏ | 4–5 nhóm mỗi map. Hình quái cao 1,4 ô (thường), 1,8 (kẻ canh), 2,4 (trùm), lại bị zoom 1 làm nhỏ thêm. |
| 4 | Quái cần phân loại, trông nguy hiểm, có dấu tha hóa | Quái chỉ có `elite` / `boss` và cờ `umbraflux` (6 loài). Chưa có cấp tha hóa. |
| 5 | Map cần tha hóa dần theo cốt truyện; lối đi đa dạng | Màu tile chỉ theo vùng. Tuyến chính một đường thẳng; trong map thường chỉ một hành lang. |

---

## 3. Đề xuất theo từng phản hồi

### 3.1 Góc nhìn kiểu phiêu lưu (phản hồi 1)
- **Camera bám nhân vật**, có vùng chết nhỏ ở giữa và trễ mượt (lerp), dừng ở mép map.
- **Zoom ≈ 2**: màn hình thấy khoảng 20 × 11 ô (~1/6 map 50 × 28) thay vì gần cả map. Nhân vật, quái, rương to gấp đôi.
- **Kích thước map đa dạng** thay vì mọi map 50 × 28: map nhỏ (sân trùm, hang) 40 × 24; map thường 60 × 36; map nhánh lớn 80 × 48. Map cao hơn rộng cũng được (leo núi, tháp).
- Bản đồ toàn khu (phím M / nút Bản đồ) mới là chỗ xem cả map, **chỉ hiện phần đã đi qua** (sương mù khám phá). Khu ẩn chưa tìm thấy không hiện.
- Hệ quả: bỏ luật "không đặt lối ra ở mép trên / dưới" của decision 043, vì lý do cũ là khung HUD che mép khi nhìn cả map; camera bám thì mép nào cũng thấy.

### 3.2 Map đẹp và có chiều sâu (phản hồi 2)
- **Lớp vẽ**: nền → mép chuyển tiếp (autotile: cỏ viền đường, bờ nước, mép vách) → vật trang trí thấp → nhân vật / quái → **lớp che phía trên** (tán cây, mái, vòm hang) → hiệu ứng (sương, đom đóm, hạt tha hóa).
- **Bố trí asset có chủ đích** thay vì rải theo seed:
  - "cụm" đạo cụ theo chủ đề (bãi nấm quanh gốc cây đổ, lều thợ mỏ có xe goòng và đèn),
  - viền lối đi bằng hàng rào / đá / hoa để mắt thấy đâu là đường,
  - vật mốc to ở mỗi khu để người chơi nhớ vị trí (cây cổ thụ, tượng gãy, cối xay nước),
  - không đặt vật chắn giữa đường chính.
- **Khu ẩn**, ba kiểu:
  1. *Lối dưới tán / sau vách*: ô đi được nằm dưới lớp che. Lớp che mờ dần khi nhân vật bước vào, lộ ra rương hoặc lối khác. Gợi ý nhỏ: một khe sáng, vài chiếc lá rung.
  2. *Tường giả / vách nứt*: trông như tường, có vết nứt; cần nguyên tố (EARTH đập vỡ, FIRE đốt dây leo, WATER làm đầy hố…) — mở rộng từ hệ cổng hệ đã có.
  3. *Lối chỉ thấy từ bên kia*: rương nhìn thấy trên gờ cao nhưng đường lên ở map khác hoặc ở cuối map (kiểu đường tắt).
- **Phần trăm khám phá** tính cả khu ẩn; tìm khu ẩn có toast + âm riêng.
- **Hệ quả cho Q5**: 3 tranh vẽ một tấm của M1–M3 (`adventure-11-map/after/`) vẽ cho zoom 1, phóng ×2 sẽ mờ; tranh một tấm cũng không có lớp che. Đề xuất **chuyển sang tileset + đạo cụ + lớp che** cho mọi map (kể cả M1–M3), tranh cũ dùng làm ảnh tham khảo màu. Cần chủ dự án duyệt việc đổi hướng này.

### 3.3 Quái đông hơn, to hơn (phản hồi 3)
- Map chính: **10–14 nhóm**; map nhánh: **14–20 nhóm**; sân trùm: 4–6 nhóm + trùm.
- Kích thước hiển thị (đơn vị ô, trước zoom ×2): thường 2,0 · tinh anh 2,6 · biến dị 2,4 · trùm phụ 3,2 · đặc biệt 3,0 · trùm chính 4,0.
- **Hành vi trên map** (để map sống động và tránh được):
  - đứng canh (chặn lối, chặn rương),
  - đi tuần theo đoạn đường ngắn,
  - ngủ (đi nhẹ qua được; chạm vào thì đội được ra đòn trước),
  - đuổi theo khi thấy người chơi trong bán kính nhỏ (chỉ một số loài).
- Cân bằng: nhiều nhóm hơn thì EXP / vàng mỗi nhóm thường giảm tương ứng, để tổng thưởng mỗi map không lạm phát. Chạy lại `npm run sim:week`.

### 3.4 Phân loại quái và dấu ấn tha hóa (phản hồi 4)

**Cấp tha hóa 1–5** (thanh hiển thị cạnh tên quái). Tha hóa càng cao càng mạnh và càng lộ rõ:

| Cấp | Dấu ấn nhìn thấy | Hiệu ứng |
|---|---|---|
| 1 | mắt ánh tím, vài đốm năng lượng tối | chỉ số gốc |
| 2 | mảng tối loang trên lông / da, khói mỏng | +chỉ số nhẹ |
| 3 | gai / tinh thể Umbraflux mọc ra, gân tím phát sáng | +chỉ số, 1 kỹ năng tha hóa |
| 4 | nửa thân bị bóng tối nuốt, hào quang đen | +nhiều, kháng thêm |
| 5 | biến dạng, nhiều mắt / vết nứt phát sáng | chỉ trùm và quái đặc biệt |

Hệ LIGHT gây thêm sát thương lên quái tha hóa cao (nối tiếp cờ `umbraflux` hiện có).

**Sáu loại quái:**

| Loại | Vai trò | Tha hóa | Ở đâu |
|---|---|---|---|
| Quái thường | lấp map, đánh nhanh | 1–2 | mọi map |
| Quái tinh anh | phiên bản mạnh của quái thường, có 1–2 thuộc tính đặc biệt (dùng hệ affix sẵn có) | 2–3 | canh lối, canh rương |
| Quái biến dị | đột biến: đổi hệ, thêm hệ thứ hai, hình dạng lệch | 3 | hiếm, map nhánh, sau khi hạ trùm vùng |
| Trùm phụ | trận khó tùy chọn, canh rương lớn / khu ẩn | 3–4 | 1 mỗi map nhánh, một số map chính |
| Trùm chính | chặn tiến trình vùng, nhiều pha | 4–5 | map cuối vùng |
| Quái đặc biệt | ghép nhiều sinh vật / nhiều nguyên tố (chimera), hoặc rương giả (mimic) | 4–5 | rất hiếm, khu ẩn, có điều kiện xuất hiện |

Mỗi loại có khung tên / màu nhãn riêng trên map để người chơi đoán độ khó trước khi chạm.

**Về art (GĐ14):** không cần vẽ lại từng con cho mỗi cấp. Lớp tha hóa vẽ bằng code trên ảnh gốc (tint tím, viền khí đen, hạt bay, mắt phát sáng); cấp 3+ thêm lớp ảnh phủ chung (gai tinh thể, gân). Chỉ quái biến dị / đặc biệt / trùm cần ảnh riêng.

### 3.5 Bản đồ tha hóa dần và lối đi đa dạng (phản hồi 5)

**Độ tha hóa theo hành trình:**

| Vùng | Tha hóa | Cảm giác |
|---|---|---|
| Rừng (M1 → M3) | 10 → 30 % | tươi sáng; tới Lõi Rừng thì vài cây khô, đốm tím |
| Núi | 30 → 50 % | khói, dung nham sẫm, tinh thể tím trong mỏ |
| Biển | 40 → 60 % | nước đục, san hô bạc màu, sương tím |
| Tàn Tích | 60 → 85 % | trời tối, vết nứt phát sáng, rễ đen bò lên tượng |
| Vết Nứt Umbraflux | 100 % | |

Làm bằng: bảng màu theo `corruption` của map (tint tile, màu trời / sương), vật trang trí tha hóa (cây khô, tinh thể, vết nứt) thay dần cho vật thường, hạt bụi tím nhiều dần.

**Thanh tẩy** (đề xuất thêm, hợp tinh thần cozy): hạ trùm vùng thì vùng đó **sáng lại một nấc** — bớt tint tím, hoa mọc lại, quái thường đổi sang tha hóa thấp hơn. Người chơi thấy rõ công sức của mình trên bản đồ, và có lý do quay lại map cũ.

**Lối đi đa dạng:**
- Mỗi map có **2–4 lối ra** ở nhiều cạnh / trong map (cửa hang, cầu, bậc đá, cổng), dẫn tới map khác nhau hoặc cùng map qua đường khác.
- Trong map: ít nhất **2 đường** từ lối vào tới lối tiến (đường ngắn có quái tinh anh chặn, đường dài vòng qua khu ẩn / rương), cộng ngõ cụt có thưởng.
- Kiểm tra dữ liệu thêm: từ spawn tới lối tiến có ≥ 2 đường không trùng ô ở đoạn giữa; mỗi map có ≥ 1 khu ẩn; rương có quái canh nằm sau nhóm quái.

### 3.6 Rương (theo Q9)

| Loại rương | Đặt ở | Thưởng |
|---|---|---|
| Thường (gỗ) | rải rác, ngõ cụt | vật phẩm thường |
| Canh giữ (bạc) | sau nhóm tinh anh | tốt hơn, có trang bị |
| Trùm phụ (vàng) | sau trùm phụ | món hiếm / độc quyền nhánh |
| Ẩn (tím, phát sáng nhẹ) | trong khu ẩn | món độc quyền, mảnh lore |
| Rương giả (mimic) | hiếm, là quái đặc biệt | đánh thắng được thưởng lớn |

---

## 4. Đề xuất thêm để game hay hơn (chờ duyệt từng ý)

1. **Thanh tẩy vùng sau trùm** (mục 3.5) — tiến trình nhìn thấy được.
2. **Sương mù khám phá** trên bản đồ toàn khu, ô "?" khi gần khu ẩn chưa tìm.
3. **Biển báo độ khó**: tên quái đổi màu theo chênh cấp với đội (xanh / vàng / đỏ / tím đầu lâu).
4. **Quái đặc biệt có điều kiện**: chỉ xuất hiện khi trời mưa / ban đêm của game / sau khi thanh tẩy vùng — thưởng cho người chơi quay lại.
5. **Sinh vật bị tha hóa có thể giải cứu**: một số quái tha hóa cấp 1–2 sau trận "tỉnh lại" (hiện lời cảm ơn, đôi khi để lại quà) — giữ chất cozy, nhấn mạnh cốt truyện "mọi quái đều bị tha hóa, không phải ác".
6. **Bảng hoàn thành map**: mỗi map có 3 sao (hạ hết quái canh, mở hết rương, tìm hết khu ẩn), đủ sao cả vùng nhận danh hiệu / phần thưởng. Hiện trên thẻ Trại.
7. **Câu đố nhẹ dùng nguyên tố**: không chỉ "đội có con hệ X thì mở", mà có chuỗi ngắn (đốt bụi gai → nước chảy qua → cối xay quay → cầu hạ).
8. **Điểm nghỉ trong map nhánh** (suối hồi phục) đặt trước trùm phụ, vì map nhánh đông và khó hơn.

## 5. Phạm vi và thứ tự làm (sau khi duyệt)

Đây là thay đổi lớn về gameplay, cần một decision mới (dự kiến **045**). Thứ tự đề xuất, mỗi đợt một commit, `npm run check` xanh:

1. **Camera bám + zoom ×2 + kích thước map tùy biến** — rẻ, tác động lớn nhất. Không đổi save.
2. **Phân loại quái + cấp tha hóa + mật độ + kích thước hiển thị + hành vi trên map** — schema `enemies`, `maps.groups`; cân bằng lại, `sim:week`.
3. **Lớp che + khu ẩn + tường giả** — schema `maps.secrets[]`, save thêm `foundSecrets` (slice Adventure v6, migration thêm `[]`).
4. **Bố cục lại 9 map cũ** theo nhiều lối / nhiều đường (gộp vào Đợt 2–5 của decision 043 khi thêm N1–N9).
5. **Độ tha hóa map + thanh tẩy** — `maps.corruption`, tint / hạt bằng code trước, art sau.
6. **Art (GĐ14)**: tileset có autotile + lớp che cho 4 vùng, lớp phủ tha hóa, quái biến dị / đặc biệt / trùm phụ, rương 5 loại. Ghi `docs/ASSET_TODO.md`.

## 6. Câu hỏi cần chủ dự án quyết

- **A1.** Bỏ tranh vẽ một tấm (hướng 3, Q5) để chuyển mọi map sang tileset + đạo cụ + lớp che, và làm lại bố cục cả M1–M3?
- **A2.** Mức zoom: ×2 (thấy ~20 × 11 ô) hay ×1,6 (thấy ~25 × 14 ô)?
- **A3.** Quái thường bị hạ có xuất hiện lại khi vào lại map (kiểu EBF3 thì không; trận lặp lại ở chỗ khác) hay giữ cách hiện tại?
- **A4.** Duyệt những ý nào ở mục 4 (1–8)?
- **A5.** Cấp tha hóa có ảnh hưởng chỉ số (đề xuất) hay chỉ là hình ảnh?

## 7. Câu trả lời của chủ dự án (2026-10-30)

- **A1:** Bỏ tranh một tấm. Map render lại bố cục và các asset thành phần; tạo hint + PROMPT trong `art_inbox` (batch `adventure-14-map-v2`).
- **A2:** Zoom ×2.
- **A3:** Quái đặc biệt, trùm phụ, trùm chính không xuất hiện lại sau khi bị hạ.
- **A4:** Duyệt mục 3.1–3.6 và các ý 1, 2, 4, 7, 8 của mục 4. Sửa: quái trên map **đứng canh hoặc ngủ, không di chuyển** (bỏ đi tuần, đuổi theo). Không duyệt: biển báo độ khó theo màu (ý 3), giải cứu sinh vật (ý 5), 3 sao mỗi map (ý 6).
- **A5:** Cấp tha hóa làm quái mạnh hơn và trông nguy hiểm hơn.
