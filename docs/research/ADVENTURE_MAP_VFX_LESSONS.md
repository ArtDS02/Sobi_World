# Làm lại giao diện map Sobi Adventure — học từ bộ VFX skill

Ngày: 2026-11-18 · Trạng thái: **nghiên cứu + đề xuất, chưa code**, chờ chủ dự án chọn hướng. Cập nhật cùng ngày: 12 góp ý chơi thử (mục 5–8), trả lời của chủ dự án + tháp dịch chuyển (mục 9), hướng làm lại từ đầu "Diorama 2.5D" (mục 10), phương án theo tiền đề agent làm hết (mục 11), kết quả prototype G0 (mục 12) lượt sửa sau góp ý (mục 13) lượt 3 (mục 14) và sửa che khuất trong rừng (mục 15).
Đầu vào: chụp map trong game (sandbox Adventure, 1600 × 900, Rừng Thì Thầm), tờ ghép 18 nền `public/assets/environment/adventure_v3/`, code `src/areas/adventure/scene/map*.ts`, `docs/SKILL_ANIMATION_STANDARD.md`, decision 045 / 046 / 059.

---

## 1. Map hiện tại xấu ở đâu (chẩn đoán)

Nền v3 (một tấm vẽ Gemini, decision 046) **không phải vấn đề chính** — tranh Rừng, Núi, Biển nhìn riêng khá ổn. Cái xấu nằm ở chỗ nó là **một tấm ảnh chết** với vài thứ dán lên:

| # | Vấn đề | Thấy ở đâu |
|---|---|---|
| A | **Đứng yên.** Nước, thác, dung nham, sóng biển, cỏ đều là ảnh tĩnh; chỉ có lấp lánh nước theo ô, vệt nắng, bóng mây, đom đóm — **cùng một bộ cho mọi vùng, chỉ đổi màu** (`mapDepthKit.ts` `DRESS`). | mọi map |
| B | **Không có ánh sáng.** Dung nham, tinh thể, đuốc trong tranh không phát sáng; không có trời tối / mưa / giờ trong ngày thấy được. Mọi vùng cùng một độ sáng phẳng. | Núi, Hầm, Tàn Tích |
| C | **Sinh vật không thuộc về cảnh.** Đội, quái, rương là sprite màu khác, ánh sáng khác, chỉ có bóng elip mềm; quái to nhỏ lộn xộn, dán lên nền. | ảnh chụp Rừng |
| D | **Tha hóa = màn tím phẳng** (`mapCorruption.ts`: rect tím alpha ≤ 0,3 + ô `c` tô thêm + chấm tròn tím bay). Cốt truyện quan trọng nhất của Adventure lại là hiệu ứng rẻ nhất. | Tàn Tích, Vết Nứt |
| E | **Phong cách không đồng nhất giữa vùng.** Tàn Tích (gate / hall / sanctum / crypt) là lưới đá xám như bản vẽ kỹ thuật, `ruins_hall` gần như isometric; Rừng / Núi là 3/4 vẽ tay ấm. | tờ ghép 18 nền |
| F | **Nền mềm** (phóng ×3 từ 1376 × 768, decision 046 đã ghi) và **khoảng đất trống lớn** không có điểm nhấn. | đường đất M1 |
| G | **Phụ:** bản đồ nhỏ (phím M) là khối màu trơn; thẻ vùng ở Trại không có ảnh (ô trắng) cho Rừng / Núi / Biển. | Trại, minimap |

A, B, D là thứ bộ VFX skill đã giải được trong trận. C, E, F là việc art; VFX chỉ đỡ được một phần.

---

## 2. Bộ VFX skill làm đúng điều gì — và áp vào map ra sao

Bộ 134 skill được duyệt không phải nhờ một thủ thuật đồ họa, mà nhờ **quy trình + ngôn ngữ chất liệu + bộ phần dùng chung + duyệt bằng ảnh**. Cả bốn chuyển được sang map.

### 2.1. Hợp đồng nhìn thấy trước khi code → "hợp đồng cảnh" cho từng map
Skill: `PHẢI THẤY · KHÔNG ĐƯỢC · NHỊP · HÌNH CHỦ ĐẠO · KIỂM` viết trước, code sau.
Map: mỗi map một file `docs/maps/v4/<mapId>.md` cùng khuôn:
- **HÌNH CHỦ ĐẠO:** một vật mốc (thác, miệng núi lửa, rùa đá, cổng tàn tích) — chiếm đủ lớn, có sự sống riêng (rule §3.1 của skill: "một hình chủ đạo, đủ lớn, đủ sống").
- **PHẢI THẤY:** nước chảy theo hướng nào, cái gì phát sáng, cái gì đung đưa, tha hóa ở đâu nặng nhất.
- **NHỊP:** chu kỳ sống của cảnh (gió 4–6 s, đom đóm, sóng vỗ 3 s, dung nham phập 2 s) — so le, không đồng bộ.
- **KHÔNG ĐƯỢC:** che đội > 250 ms khi đi (rule §3.7), làm lối đi khó đọc, chớp > 2 lần / giây.

### 2.2. Ngôn ngữ chất liệu theo hệ (§4) → bảng chất liệu theo **vùng**
Đây là bài học quan trọng nhất. Bảng §4 cấm đúng cái map đang làm: *"một hình đổi màu cho cả nhóm"*. Mỗi vùng cần "Phải có / Cấm" riêng, và **lấy luôn bộ phần của hệ tương ứng**:

| Vùng | Bộ phần dùng lại | Phải có | Cấm |
|---|---|---|---|
| Rừng | `plantParts`, `waterParts`, `glowParts` | tán lá đung đưa theo gió, lá rơi có hình (`F.leaf`), suối chảy có viền bọt, vệt nắng xuyên tán, đom đóm đi lên | mọi thứ phát sáng trừ đom đóm / phấn; nước đứng như thủy tinh |
| Núi | `flameParts`, `stoneParts` | dung nham chảy có vỏ nứt, **sáng trong khe nứt**, khói + tàn lửa bay, hơi nóng làm méo nhẹ, bụi đá | lửa chỉ cộng sáng; đá lơ lửng |
| Hầm mỏ | `glowParts`, `stoneParts` | tinh thể sáng thật (bloom), đuốc lắc, vũng nước phản chiếu, bụi trong luồng sáng | sáng đều cả hầm |
| Biển | `waterParts` | sóng có mào cuộn + bọt chạy vào bờ, lấp lánh theo pixel nước (không theo ô), tán dừa lắc, bong bóng ở rạn | sóng đồng bộ cả bờ |
| Tàn Tích | `glowParts`, `riftParts` | rune trên tường sáng lên / tắt chậm, đốm sáng cổ, bụi trong cột sáng | rung, giật |
| **Tha hóa (mọi vùng)** | `shadeParts` → `riftParts` theo cấp | khối mù đen mực **viền tím, mép nhiễu chậm** bò trên mặt đất; cấp cao có khe nứt hư không (bên trong đêm sao, viền lam / hồng); hạt có hình (mảnh mực), không chấm tròn | màn tím phẳng phủ cả map; che đường đi |

Bảng này giải luôn D: tha hóa dùng chính chất liệu Bóng tối / Hư không người chơi đã thấy trong trận ⇒ cốt truyện "bóng tối nuốt thế giới" đọc được ngay bằng mắt, cùng một ngôn ngữ giữa map và trận.

### 2.3. "Sơn trước, sáng sau" (§3.8–3.9, `post3d.ts`) → tách lớp sơn / lớp sáng cho map
Trận vẽ hai nửa: **sơn** (che) và **sáng** (cộng + bloom chỉ bắt màu > 0,9). Map hiện chỉ có sơn. Đề xuất:
- **Mặt nạ phát sáng** cho mỗi tranh (dung nham, tinh thể, đuốc, rune, cửa sổ) → lớp sáng cộng + bloom có chủ đích. Mặt nạ sinh tự động từ màu tranh (cùng cách `propose_mask.py` / `import_v3.py` đã nhận dung nham theo màu), chỉnh tay ít.
- **Ánh sáng môi trường theo vùng / thời tiết / đêm:** nhân màu lên lớp sơn (tối đi về đêm, lạnh khi mưa) **nhưng lớp sáng giữ nguyên** ⇒ ban đêm dung nham và đom đóm nổi bật hẳn. Game đã có mưa / đêm (quái kỳ dị `when: rain / night`) mà map không thể hiện.
- Cùng lớp nhân màu áp lên **sprite** (đội, quái, rương) ⇒ giải một phần C: sinh vật cùng ánh sáng với cảnh. Thêm bóng tiếp đất cứng hơn + viền sáng nhẹ phía nguồn sáng.

### 2.4. Hàm thuần theo tuổi, seed, `quality` (§5)
- Mọi chuyển động của map = hàm của thời gian + `hash(mapId, i)` ⇒ map luôn giống nhau, **chụp được ở mốc thời gian cố định** (điều kiện để duyệt bằng ảnh như skill).
- Số hạt nhân `quality` của cài đặt hiệu ứng (decision 057) — `off` thì map vẫn đẹp tĩnh, chỉ mất chuyển động; tôn trọng reduced motion như hiện nay.

### 2.5. Duyệt bằng bằng chứng (§2.4, §7)
- `scripts/animation/shots.ts` → bản map: chụp mỗi map ở **4–6 điểm camera cố định** (spawn, vật mốc, trùm, cổng, khu tha hóa nặng) × 2–3 mốc thời gian × (ngày / đêm / mưa), 1600 × 900; `reviewSheet.py` ra contact sheet ở `docs/maps/v4/shots/`.
- **Thước chấm map** (5 × 2 = 10, ngưỡng 7, như skill):
  1. Đúng hợp đồng cảnh (vật mốc, những gì PHẢI THẤY).
  2. **Đọc được lối đi** — chuyển ảnh xám vẫn phân biệt đi được / chặn; đội và quái nổi khỏi nền.
  3. Sống — không vùng nào trên màn đứng yên hoàn toàn; nhịp so le.
  4. Chất liệu & màu đúng bảng vùng; sprite cùng ánh sáng với cảnh.
  5. Hiệu năng & an toàn — ≥ 50 FPS (`fps.ts`), không chớp, không che đội.
- **Mốc chuẩn:** làm 1 map pilot tới mức chủ dự án duyệt, rồi map sau "không thấp hơn map cùng vùng" — đúng cách 134 skill đã nhân rộng.

---

## 3. Kỹ thuật: dùng lại lớp 3D của trận được tới đâu

Lớp `vfx3d` (Three.js → texture Phaser, hai nửa sơn / sáng) có một giới hạn được ghi ở §3.6: **luôn vẽ đè lên sinh vật, không có chiều sâu**. Trong trận chấp nhận được; trên map thì không, vì đội đi sau / trước cây, nước nằm dưới chân. Nên tách hai tầng:

| Tầng | Nằm ở | Làm bằng | Nội dung |
|---|---|---|---|
| **Mặt đất** (dưới sprite) | thay `layScene` | **shader Phaser** trên khối nền + mặt nạ (nước / dung nham / phát sáng / hướng chảy) | nước & dung nham chảy (UV cuộn theo mặt nạ hướng), mép bọt, phập sáng dung nham, lấp lánh theo pixel, cỏ / tán lay (méo nhẹ theo mặt nạ thực vật), mực tha hóa bò trên đất |
| **Không khí** (trên sprite) | thay hạt Phaser hiện tại | **dùng lại `Stage3d` + `post3d` + `quads` / `atlas` + bộ phần các hệ**, camera trực giao khớp camera map | lá rơi, tàn lửa, đom đóm, bụi trong cột sáng, sương, mưa, khe nứt hư không, bloom của lớp sáng |

Lý do không dồn hết vào Three: mặt đất phải nằm dưới sprite và bám pixel tranh; shader Phaser rẻ hơn và đúng thứ tự vẽ. Lý do vẫn dùng Three cho tầng trên: bộ phần (`waterParts`, `flameParts`, `shadeParts`, `riftParts`, `glowParts`…) và bloom giữ màu đã được duyệt — viết lại bằng hạt Phaser sẽ ra lại đúng cái "chấm tròn mềm" §3.11 cấm.

Cần đo: copy canvas Three → texture mỗi khung ở màn đi map (trận đang 60 FPS trên RTX 3050, nhưng chưa đo trong Electron — PROGRESS đã ghi). Nếu nặng: tầng không khí chạy 30 Hz hoặc nửa độ phân giải (bloom đã ở nửa cỡ).

---

## 4. Những gì VFX **không** sửa được (phải làm art)

- **E — Tàn Tích lệch phong cách:** cần vẽ lại 4 nền Tàn Tích theo cùng góc 3/4 vẽ tay của Rừng / Núi (batch Gemini mới, giữ mask / layout hiện có). Hiệu ứng rune không cứu được tranh lưới xám.
- **F — nền mềm:** tạo lại ở 2K theo mảnh có chồng mép, hoặc lượt vẽ chi tiết theo mảnh (M2_PLAN §7). Làm sau khi chốt pilot, vì lớp sáng + chuyển động che bớt độ mềm.
- **Khoảng trống:** đặt đạo cụ / cụm cây bằng Admin "Cập nhật bản đồ" theo hợp đồng cảnh (kit 151 asset đã có, `docs/ASSET_TODO.md` ghi kit chưa có chỗ dùng).
- **C — cỡ quái lộn xộn:** bảng cỡ theo loại đã có (decision 045: 2,0 → 4 ô); cần rà lại tỉ lệ so với cây / đội trên nền v3 (camera ×1 khác lúc chốt ×2).
- **G — minimap / thẻ vùng:** minimap = tranh nền thu nhỏ + sương mù khám phá bằng mực (`shadeParts`) thay khối màu; thẻ vùng ở Trại = ảnh cắt từ vật mốc của nền. Việc nhỏ, làm cùng pilot.

---

## 5. Góp ý chơi thử của chủ dự án (2026-11-18) — nguyên nhân đã kiểm

Mỗi dòng: nguyên nhân tìm thấy trong code / dữ liệu (không đoán), hướng sửa, và loại việc. **Loại** quyết định có cần decision không: *lỗi / tích hợp* sửa được ngay (AGENT_RULES §8); *art / UI* thuộc GĐ14; *gameplay* phải có decision trước (gameplay đang đóng băng, decision 021).

Bằng chứng: chồng mask va chạm lên tranh M1 và M5 (đỏ = chặn, vàng = vật dùng được, tím = nhóm quái); đếm nội dung 18 map từ `maps.json`.

| # | Góp ý | Nguyên nhân (đã kiểm) | Hướng sửa | Loại |
|---|---|---|---|---|
| 1, 5 | Xấu, không sinh động, không có hiệu ứng môi trường | Nền là ảnh tĩnh; phần "sống" là một bộ chung đổi màu (`mapDepthKit.ts`) | Mục 2–3: lớp sống theo chất liệu vùng, ánh sáng, ngày / đêm / mưa | art |
| 2 | Lối đi trông trống mà bị chặn | Va chạm là **lưới ô 40 px suy từ màu tranh** (Otsu, `import_v3.py`), nên: mép chặn hình bậc thang lệch mép vẽ tới ~1 ô; **lối mòn vẽ chạy vào rừng / ra mép nhưng bị chặn** (M1 góc phải dưới); phiến đá xám ở M5 bị tính là vách; chân vật / rương / cổng dịch chuyển chặn ô mà không có gì vẽ để báo | (a) Lối nào vẽ thì đi được, lối cụt thì phải vẽ bị chặn (cây đổ, đá) — kiểm tự động "mép lối mòn trong tranh ↔ mask"; (b) **trượt góc**: kẹt mép thì đẩy nhẹ sang bên tối đa ~12 px; (c) va chạm mép mềm (mặt nạ nửa ô) thay bậc thang 1 ô; (d) màn Admin bật lớp mask để soát từng map | lỗi / tích hợp |
| 3a | Nhân vật đè lên asset | **Cây, vách, vòm trong tranh nằm ở độ sâu −10** (`mapScene.ts`), luôn dưới đội; chỉ vật đặt riêng mới xếp theo chân. Đi sát tán cây vẽ ở hàng dưới là đè lên tán | **Lớp tiền cảnh cắt từ chính tranh**: phần tán cây / đỉnh vách / vòm nằm trên ô chặn được cắt thành dải có "đường chân", xếp với đội theo y (đội đi sau tán thì bị che, lớp đó mờ đi như lớp che hiện nay). Sinh tự động từ mask, chỉnh tay ít | art / tích hợp |
| 3b | Asset như giấy dán, không có lớp lang | Vật chỉ có bóng elip mềm, không cùng ánh sáng, không chuyển động | Bóng tiếp đất cứng + bóng đổ theo hướng nắng của vùng; vật cùng lớp nhân màu với cảnh (mục 2.3); mỗi vật có nhịp sống riêng (rương lấp lánh, nước gợn quanh bệ, cổng xoáy) | art |
| 3c | Rương, suối hồi, vật dùng được quá nhỏ | Rương / mỏ / đá truyền thuyết **1 × 1 ô = 40 px**, trong khi đội trưởng cao **120 px** (`walker.ts`) | Vẽ to 1,6–2 ô (giữ ô chân cho va chạm), viền sáng + nhãn phím khi lại gần, tia sáng nhỏ nhìn thấy từ xa | UI / art |
| 4 | Lách qua quái vào cổng được | Nhóm quái **không chặn ô** và chỉ đánh khi đội vào **trong 34 px** quanh chỗ nó đứng (`balance.json` `explore.touch`, nhỏ hơn 1 ô); quái đứng yên (decision 045). Lối 2–3 ô (M5) là lách được. Chỉ cổng dịch chuyển đang khóa sau kẻ canh là chặn như tường | **Giữ quái đứng yên** (chủ dự án chốt): thân quái chặn ô; kẻ canh có vùng canh thấy được, bước vào là vào trận, quái không bước đi; quái canh đặt ở chỗ hẹp — mục 9.4 | **gameplay** |
| 6 | Đi lên trên / xuống dưới lộ vùng trống | Camera cho cuộn **quá mép trên 270 px và mép dưới 70 px** để chừa chỗ HUD (`mapCamera.ts` `HUD_TOP` / `HUD_BOTTOM`); ngoài tranh chỉ là màu tối trơn | Giữ camera trong khung tranh; HUD nằm đè lên tranh. Thêm **viền tranh vẽ nối dài** (outpaint 4–6 ô quanh mỗi map) để mép trông như rừng / núi tiếp tục, không phải tường màu | lỗi / art |
| 7, 12 | Trống, chán, không có gì để khám phá | 18 map: mỗi khung màn hình (40 × 22 ô) có ~7–12 thứ, **~70 % là nhóm quái**; mỗi map chỉ 3–5 rương, 0–2 mỏ, 0–2 câu đố, 1 đá truyền thuyết, 1 lớp che (= 1 chỗ ẩn); **đồ trang trí đặt tay = 0 ở cả 18 map**, đạo cụ = 1. Map gần như chỉ là tranh + quái | Mục 6 dưới (vòng khám phá) | **gameplay** + art |
| 8 | Vào lại phải ở chỗ đã thoát; thẻ map chỉ để xem | Hiện chọn vùng + chọn cổng đã thắp (`campVm.ts` `starts`) rồi "Lên đường" | **Đã chốt:** đi tiếp đúng chỗ đã rời, sang vùng cũ thì đi bộ, dịch chuyển nhanh chỉ bằng **tháp dịch chuyển** đặt sâu trong vùng — thiết kế ở mục 9.2–9.3 | **gameplay** + save |
| 9 | Lobby quá nhiều thông tin, lộn xộn, không chia class | Một bảng gom: nhiệm vụ đầu, nhận đồ, người dẫn đường, cửa hàng, truyền thuyết, 6 thẻ vùng, bộ lọc **chỉ theo hệ**, hàng chiến binh cuộn ngang, đội hình, khẩu phần | Chia **3 khu rõ**: (1) *Hành trình*: nút lớn "Đi tiếp — Rừng Thì Thầm, 8 %", thẻ vùng thu nhỏ; (2) *Đội*: chiến binh **xếp cột theo class** (Chiến Binh / Hộ Vệ / Pháp Sư / Hỗ Trợ), hệ là bộ lọc phụ, 3 ô đội hình to ngay trên; (3) *Trại*: cửa hàng, lò rèn, truyền thuyết, người dẫn đường | UI |
| 10 | Không thấy skill, cây skill, skill riêng của từng con | Đã có nhưng bị giấu: nút nhỏ **"Hồ sơ · 18 SP"** trên thẻ mở hộp thoại 5 tab (Chỉ số / Kỹ năng / Cây kỹ năng / Trang bị / Đền) | Bấm chọn một con → **bảng chi tiết bên phải** luôn hiện: 4 skill riêng + tuyệt kỹ (icon hệ, mô tả ngắn, nút xem animation), cây class thu nhỏ, chấm đỏ khi còn SP | UI |
| 11 | "Chín First Guardians" không có tác dụng; các nút nhạt | Nút đó chỉ **bật / tắt một tranh minh họa** chen vào bảng, không nội dung, không tương tác. Các nút khác là chữ trên nút viền mờ, không biểu tượng, không mô tả | Truyền thuyết thành **trang riêng**: 9 thẻ Guardian (hệ, câu chuyện ngắn, đã gặp / chưa, liên kết với tha hóa từng vùng). Mọi nút ở Trại có icon + một dòng tác dụng ("Mua đồ, rèn trang bị"), trạng thái (chấm đỏ khi có việc) | UI |

---

## 6. Vòng khám phá (góp ý 7, 12) — đề xuất cần chủ dự án chọn

Nguyên tắc học từ thước chấm skill ("không khung nào đứng yên"): **mỗi khung màn hình ≥ 3 điểm tò mò không phải quái**, và mỗi map có **một hình chủ đạo** kèm một bí mật gắn với nó.

| Ý tưởng | Người chơi làm gì | Có sẵn để dựa vào | Mức đổi |
|---|---|---|---|
| **Kỹ năng hiện trường theo hệ của đội** | Đốt bụi gai (Lửa), đóng băng nước để qua (Nước), soi hang tối (Ánh sáng), đập đá (Đất), mọc dây leo lên vách (Thiên nhiên) | cổng hệ, câu đố hệ đã có | gameplay — lớn nhất, đáng nhất |
| Vật tương tác nhỏ dày đặc | bụi rung rơi đồ, hũ vỡ, tổ chim, vũng câu cá, cây ăn quả | mỏ, nút thu hoạch đã có | gameplay nhẹ + kinh tế (bot cân bằng) |
| Sưu tập theo map | 3–5 "mảnh ký ức Guardian" mỗi map, ghép thành câu chuyện ở trang Truyền thuyết | đá truyền thuyết, tranh Guardian | nội dung |
| ~~Quái có hành vi~~ | **hoãn**: giữ quái đứng yên tới khi hoạt ảnh di chuyển đủ mượt | quái ngủ đã có | — |
| Sự kiện trong map | thương nhân lạc đường, mưa làm hiện quái kỳ dị, đêm mở lối ẩn | quái `when: rain / night`, du khách | gameplay nhẹ |
| Sinh vật môi trường | chim bay khi lại gần, cá nhảy, bướm theo hoa (không đánh) | — | art thuần |
| Đồ trang trí đặt tay | cụm cây, đá, tàn tích nhỏ theo hợp đồng cảnh — hiện là **0** | Admin builder + 151 asset kit | art thuần |

Đề xuất thứ tự: đồ trang trí + sinh vật môi trường (art, làm ngay cùng pilot) → kỹ năng hiện trường theo hệ (decision riêng, đổi cảm giác chơi nhiều nhất) → sưu tập + sự kiện.

---

## 7. Lộ trình gộp (thay bản trước)

| Đợt | Việc | Góp ý | Loại |
|---|---|---|---|
| **A — sửa lỗi** | camera không lộ mép (6); trượt góc + soát mask, lối vẽ = lối đi (2); công cụ chồng mask cho cả 18 map | 2, 6 | lỗi, làm được ngay |
| **B — chuẩn + pilot M2** | Decision mới + `docs/maps/MAP_SCENE_STANDARD.md` (hợp đồng cảnh, bảng chất liệu vùng, thước chấm); chụp "trước"; pilot M2: lớp tiền cảnh cắt từ tranh, vật to + có sống, lớp mặt đất động, tầng không khí 3D, ánh sáng ngày / đêm / mưa, tha hóa bằng `shadeParts`, đồ trang trí đặt tay | 1, 3, 5, 12 | art, chủ dự án duyệt mốc chuẩn |
| **C — lobby** | 3 khu Hành trình / Đội (theo class) / Trại; bảng chi tiết skill; trang Truyền thuyết; nút có icon + mô tả | 9, 10, 11 | UI |
| **D — luật chơi** (decision trước, bot cân bằng trước / sau) | đi tiếp từ chỗ đã rời + tháp dịch chuyển + thẻ vùng chỉ xem (save + migration, mục 9.2–9.3); quái chặn thân + vùng canh, vẫn đứng yên (9.4); vòng khám phá mục 6 | 4, 7, 8 | gameplay |
| **E — nhân rộng** | 17 map còn lại theo vùng; vẽ lại 4 nền Tàn Tích; outpaint viền; Vết Nứt | 1, 5, 6 | art |

---

## 8. Cần chủ dự án quyết (lượt 1 — câu 2, 3 đã trả lời; câu còn mở chuyển sang mục 9.5)

1. Giữ nền v3 và thêm lớp sống + lớp tiền cảnh (không vẽ lại toàn bộ), làm pilot M2 trước rồi duyệt mốc chuẩn?
2. **Góp ý 8:** "Lên đường" luôn đi tiếp đúng chỗ đã rời. Muốn sang vùng cũ thì **đi bộ qua lối ra**, hay có **cổng dịch chuyển trong thế giới** (đá dịch chuyển đã thắp, dùng ngay trên map, không phải ở Trại)? "Đi nhanh" (quét vùng đã hạ trùm) vẫn chọn vùng ở Trại được không?
3. **Góp ý 4:** quái chặn thân + kẻ canh có vùng canh / đuổi — đồng ý đổi luật "quái đứng yên" của decision 045?
4. **Góp ý 7:** chọn những ý nào ở mục 6 (đề xuất: kỹ năng hiện trường theo hệ là trục chính)?
5. Ngày / đêm / mưa trên map chỉ để trình bày, không đổi luật?
6. Vẽ lại 4 nền Tàn Tích cho đồng phong cách (chủ dự án tạo ảnh Gemini)?

---

## 9. Trả lời của chủ dự án (2026-11-18) và nghiên cứu thêm

**Đã chốt hướng (chưa triển khai):**
- **Góp ý 8:** không chọn map ở Trại để dịch chuyển. Sang vùng cũ thì đi bộ qua lối cũ. Dịch chuyển nhanh chỉ bằng **tháp dịch chuyển** trong từng khu vực, đặt sâu ở các map sau để người chơi phải khám phá trước.
- **Góp ý 4:** **giữ luật "quái đứng yên"** (decision 045) cho tới khi hoạt ảnh di chuyển của sinh vật đủ mượt; lúc đó xét lại.

### 9.1. Hiện trạng di chuyển (đã đọc code)

| Thứ | Hiện nay | Nguồn |
|---|---|---|
| Cổng mỗi map | **18 / 18 map có cổng** (2 × 2 ô), đặt **sát điểm xuất phát** (≤ 4 ô, sát mép) | `maps.json` `portal` |
| Thắp cổng | map đầu vùng thắp sẵn; map khác thắp khi hạ **kẻ canh / trùm** của map đó | `actions/battle.ts`, `trip.ts` `portalLit` |
| Dùng cổng | đứng cạnh cổng đã thắp → **đi tới mọi cổng đã thắp, kể cả vùng khác**, hoặc về Trại | `actions/explore.ts` `travel` |
| Ở Trại | chọn vùng + chọn cổng đã thắp làm điểm xuất phát | `campVm.ts` `starts` |
| Một chuyến | đi → về Trại / thua / rút lui thì chuyến kết thúc, **vị trí không được lưu** (`run` chỉ sống trong chuyến) | `state.ts` `runSchema`, `finish` |
| Thua | đội kiệt sức 1 giờ, chuyến kết thúc | `balance.json` `run.exhaustHours` |
| Lối ra | vẽ bằng **ảnh cổng dịch chuyển** (`adv_warp_gate`) khi chưa có kit lối của vùng | `mapView.ts` `gateKey` |

Đồ thị lối đi rất gọn: từ Bìa Rừng đi bộ tới map xa nhất (Rạn San Hô, Vịnh Đắm Tàu) chỉ **5 lần qua lối**. Map rộng 64–80 ô, đi 6,5 ô / giây, nên mỗi map tốn khoảng 15–40 giây. Đi bộ hết đường dài nhất mất khoảng 2–3 phút: đủ để thấy cần tháp, nhưng không tới mức phải có tháp ở mọi map.

### 9.2. Tháp dịch chuyển — đề xuất thiết kế

**Mỗi vùng 1 tháp**, đặt ở **map nhánh làm nút giao** của vùng (sâu, nối nhiều hướng, phải khám phá mới tới):

| Vùng | Tháp đặt ở | Cách từ Bìa Rừng | Vì sao |
|---|---|---|---|
| Rừng | **Thác Rêu** (`forest_falls`, N2) | 2 lối | nút giao Thung Nấm / Lõi Rừng (lối tắt) / Đầm Sương → Biển; có thác làm vật mốc |
| Núi | **Đèo Gió** (`mountain_pass`, N4) | 4 lối | nối Chân Núi / Đỉnh Dung Nham (lối tắt) / Cổng Tàn Tích |
| Tàn Tích | **Hầm Mộ Rune** (`ruins_crypt`, N6) | 4 lối | nối Cổng Tàn Tích / Hành Lang Rune / Điện Phong Ấn |
| Biển | **Rạn San Hô** (`coast_reef`, N8) | 5 lối | sâu nhất, cạnh Vịnh Đắm Tàu (trùm) |

Luật đề xuất:
1. **Thắp tháp:** đi tới là kích hoạt (chủ dự án chốt, không cần đánh trùm phụ). Phần thưởng khám phá nằm ở chỗ tháp đặt sâu trong map nhánh.
2. **Dùng tháp:** đứng cạnh tháp đã thắp → chọn tháp đã thắp khác (cả vùng khác) để tới. Không dịch chuyển từ Trại, không từ giữa map.
3. **Bỏ hẳn 18 cổng cũ** (chủ dự án chốt).
4. **Lối ra không vẽ như cổng dịch chuyển nữa**: dùng lối của kit vùng (lối mòn, vòm, hang, bậc đá, cầu — đã có `exitArt`). Chỉ tháp mới có hình phép thuật, để người chơi không nhầm "cổng" với "lối".
5. Tháp là **vật mốc lớn** (hình chủ đạo của map, đúng bài học mục 2.1): cao 4–5 ô, có lớp sống (lõi sáng, vòng rune quay, hạt bay lên); tháp đã thắp nhìn thấy được từ xa.

### 9.3. "Lên đường" = đi tiếp từ chỗ đã rời

- Lưu **chỗ đứng cuối** (map + tọa độ + hướng) mỗi khi chuyến kết thúc: về Trại, rút lui hoặc thắng.
- **Thua:** về **chỗ đứng trước khi vào trận** (chủ dự án chốt), lùi ra ngoài tầm chạm của nhóm vừa thắng, cộng kiệt sức như cũ.
- **Chỗ đứng an toàn:** mỗi chuyến mới thì quái thường xuất hiện lại. Nếu chỗ cũ nằm trong tầm chạm của một nhóm, lùi về ô an toàn gần nhất (hoặc điểm vào map), cộng thời gian miễn đánh đã có (`graceMs`).
- **Thẻ vùng ở Trại** chỉ để xem: đã mở / chưa đi tới / đã hạ trùm, % khám phá, rương, tháp đã thắp. Không có nút chọn.
- **Vết Nứt** (chuyến riêng hằng ngày) giữ nguyên, không đụng tới chỗ đứng cuối.

**Save** (thêm trường, có migration, không mất gì):
- `resume: { mapId, x, y, facing } | null` và `towers: string[]`.
- Save cũ chưa có chỗ đứng: đặt ở lối vào của **vùng đã mở xa nhất** (không bắt người chơi cũ đi bộ từ Bìa Rừng).
- Tháp tự thắp cho vùng **đã hạ trùm**, hoặc vùng mà người chơi đã thắp cổng ở chính map có tháp.
- `activePortals` giữ trong save (không xóa dữ liệu). % khám phá đổi sang đếm tháp.

### 9.4. Chặn lách qua quái khi quái vẫn đứng yên (góp ý 4)

Không cần sinh vật di chuyển:
1. **Thân quái chặn ô** theo cỡ của loại (2–4 ô, bảng decision 045): không đi xuyên được nữa.
2. **Vùng canh** cho kẻ canh, trùm phụ, trùm: vòng 2–3 ô trước mặt, **vẽ thấy được** (vòng sáng mờ trên đất, quái quay mặt về phía lối). Bước vào là hiện "!" trên đầu quái, rồi vào trận bằng hiệu ứng chuyển cảnh. **Quái không bước đi**, nên luật "đứng yên" vẫn giữ.
3. **Đặt quái canh ở chỗ hẹp:** thêm kiểm tra vào `mapProblems`, kiểu "không có đường từ phía spawn tới lối / tháp mà không đi qua vùng canh". Cách làm giống kiểm tra cổng hệ chặn đúng khu (`gate_in`, decision 046).
4. **Quái ngủ** vẫn lách được (tầm chạm × 0,5): đây là lối né có chủ đích, nên giữ và ghi rõ cho người chơi (Zzz to hơn).

Ghi chú: mọi lối tiến trên map chính đã khóa sau kẻ canh (8 lối). Chỗ lách được là các **lối sang map nhánh** và **cổng dịch chuyển cạnh spawn**: hai chỗ này mục 9.2 và 9.4 đều xử lý.

### 9.5. Câu hỏi lượt 2 (đã trả lời bên dưới)

1. Mỗi vùng **1 tháp ở map nhánh nút giao** (bảng 9.2) có đúng ý không, hay muốn 2 tháp ở vùng lớn (Rừng 6 map, Núi 5 map)?
2. Tháp đứng **sau trùm phụ** của map đó (phải đánh mới thắp), hay chỉ cần đi tới?
3. 18 cổng cũ: **bỏ hẳn** hay đổi thành **đá nghỉ** (chỗ về khi thua)?
4. Thua thì về **điểm vào map** (đề xuất) hay về **tháp gần nhất**?
5. **"Đi nhanh"** (quét vùng đã hạ trùm, không đi bộ) có giữ không? Nó không phải dịch chuyển nhưng vẫn chọn vùng ở Trại.
6. Góp ý 7: chọn ý nào ở **bảng mục 6** (Vòng khám phá)?

**Trả lời 9.5 (chủ dự án, 2026-11-18):**
1. Mỗi vùng lớn **1 tháp** (Rừng 1, Núi 1, Tàn Tích 1, Biển 1).
2. **Đi tới là tháp kích hoạt**, không cần đánh.
3. **Bỏ hẳn 18 cổng cũ.**
4. **Thua thì về đúng chỗ đứng trước khi vào trận** (cạnh con quái vừa thua). Lưu ý khi làm: đặt đội lùi ra ngoài tầm chạm của nhóm đó (tầm chạm + 1 ô, về phía đội đã đi tới) cộng thời gian miễn đánh, để không vào trận lại ngay.
5. **Bỏ "Đi nhanh"** (quét vùng). Kết quả `sweep` trong save cũ vẫn đọc được (không xóa giá trị khỏi schema).
6. **Chọn tất cả** ý ở bảng mục 6 (trừ "quái có hành vi" đã hoãn).

Hệ quả cần ghi trong decision khi làm: % khám phá đổi từ "cổng đã thắp" sang "tháp đã thắp"; bỏ hành động `travel` tới cổng; Trại không còn chọn vùng / điểm xuất phát; vị trí tháp mặc định theo bảng 9.2 (đặt chỗ đi tới tự nhiên trong map nhánh, không sau trùm phụ).

---

## 10. Làm lại từ đầu: hướng nào cho map đẹp nhất

Chủ dự án chấp nhận đập đi làm lại, miễn đẹp. Nên câu hỏi không còn là "vá map v3 thế nào", mà là **"nền tảng dựng map nào có trần đẹp cao nhất và giải tận gốc 12 góp ý"**.

### 10.1. Gốc rễ của 3 lần làm map trước

| Lần | Cách | Vì sao hỏng |
|---|---|---|
| v1 | ô 40 px màu phẳng | lộ lưới, nhạt |
| v2 (045) | ghép ô + kit Gemini | Gemini không vẽ được bộ ô nối mép; mép vuông; nhiều nguồn art lệch nhau |
| v3 (046) | **một tranh Gemini mỗi map**, va chạm suy ra từ màu tranh | **dữ liệu suy ra từ hình** ⇒ lối vẽ ≠ lối đi (góp ý 2); tranh là một lớp phẳng ⇒ không che được nhân vật (3), không sống (1, 5); tranh 1376 × 768 phóng ×3 ⇒ mềm; mỗi tranh một phối cảnh ⇒ Tàn Tích lệch; tranh kín khung ⇒ hết tranh là hết thế giới (6); thêm đồ là phải vẽ lại tranh (12) |

Bài học chung: **phải dựng hình từ dữ liệu, không suy dữ liệu từ hình**. Đây cũng là cách bộ VFX skill thành công: mọi thứ là hàm của dữ liệu và thời gian, vẽ bằng code từ bộ phần chung, nên luôn khớp, luôn sống, sửa được từng phần.

### 10.2. Bốn hướng so sánh

| | **A. Tranh v3 + lớp sống** (mục 2–4) | **B. Tranh lớn chia lớp** | **C. 2D ghép module chất lượng cao** | **D. Diorama 2.5D** (đề xuất) |
|---|---|---|---|---|
| Cách | giữ tranh, thêm shader / hạt / tiền cảnh cắt từ tranh | vẽ tranh 4K theo mảnh, AI tách lớp nền / vật / tán | nền vẽ bằng shader trộn chất liệu (không ô), vật là sprite rời, xếp theo chân | **địa hình 3D sinh từ lưới logic**, chất liệu vẽ tay, **cây / đá / vật / sinh vật là tranh 2D đứng thẳng trong không gian 3D**, ánh sáng + bóng + hậu kỳ thật |
| Trần đẹp | trung bình (tranh vẫn phẳng) | khá | khá–cao | **cao nhất** (kiểu HD-2D) |
| Lối vẽ = lối đi (2) | không (vẫn suy từ màu) | không | có | **có, tuyệt đối** (hình sinh từ chính lưới va chạm) |
| Che / lớp lang (3) | giả (cắt tán từ tranh) | được, tách lớp lỗi ở mép | được (xếp theo chân) | **tự nhiên** (bộ đệm sâu: đi sau cây là bị che, sau vách là mờ dần) |
| Sống (1, 5) | thêm từng thứ | thêm từng thứ | gió, nước bằng shader | **gió, nước, dung nham, đèn, ngày / đêm / mưa, bóng mây** đều là chuẩn của 3D |
| Mép map (6) | phải vẽ thêm viền | phải vẽ thêm viền | sinh thêm rừng ngoài mép | **thế giới nối dài vô hạn bằng code** (vòng cây, núi xa, sương) |
| Đổi bố cục / thêm đồ (12) | vẽ lại tranh | vẽ lại tranh | đặt trong Admin | **đặt trong Admin**, thấy ngay |
| Đồng nhất giữa vùng | thấp | thấp | cao | **cao** (một camera, một ánh sáng, một bộ luật) |
| Art chủ dự án phải tạo | ít | rất nhiều (tranh 4K) | nhiều sprite + texture | **vừa**: texture liền mép + tranh đứng (kit 250 ảnh hiện có dùng lại được nhiều) |
| Công code | ít | vừa | nhiều | **nhiều nhất** |
| Rủi ro | không đủ đẹp | tách lớp lỗi | vẫn "giấy dán" nếu ánh sáng yếu | trông "3D rẻ" nếu chất liệu / ánh sáng kém; GPU yếu |

**A** là cách rẻ nhất nhưng không giải gốc: chỉ trang điểm cho một tấm ảnh. **B** đắt art mà vẫn suy dữ liệu từ hình. **C** đúng gốc nhưng thiếu chiều sâu thật. **D** giải gốc cả 12 góp ý và có trần đẹp cao nhất.

### 10.3. Hướng D: "Diorama 2.5D" làm thế nào

Kỹ thuật tham khảo, chỉ học cách dựng (decision 048, không lấy nội dung): HD-2D (nhân vật 2D trong cảnh 3D, bloom, mờ chiều sâu), "tranh 2D đứng trong thế giới 3D", và các game nuôi quái lượt có thế giới 3D thấp đa giác + nhân vật 2D.

**Lớp cảnh (Three.js, đã có trong dự án):**
1. **Địa hình từ lưới `maps.json`:** mỗi ô có loại (cỏ, đất, nước, dung nham…) và độ cao (trường `elevation` 0–9 đã có từ decision 046). Mép giữa các loại / độ cao làm bằng **marching squares + nhiễu**: mép cong tự nhiên, không bậc thang. Va chạm dùng **chính đường mép đó**, nên chỗ nào trông đi được là đi được.
2. **Chất liệu vẽ tay:** mỗi vùng 5–8 texture liền mép (cỏ ×3, đất, cát, đá lát, rêu…), trộn theo mặt nạ mềm (splat) cộng nhiễu. Mặt vách là dải texture dọc của vùng. Toon ramp + màu theo vùng để giữ chất tranh Sobi, không ra "3D nhựa".
3. **Tranh đứng (card):** cây, bụi, đá, đạo cụ, rương, tháp, **và cả quái, đội** là ảnh 2D dựng đứng, hơi nghiêng về camera. Có bóng đổ thật lên đất, gió lay phần ngọn bằng shader, sắp xếp sâu tự đúng. Đội đi sau tán cây thì cây mờ dần (dither), như các game 3/4 thường làm.
4. **Nước / dung nham:** mặt phẳng shader; màu sâu theo khoảng cách tới bờ (tính từ lưới), bọt ở mép, chảy theo hướng, phản chiếu trời. Dung nham có vỏ nứt và phát sáng (lớp sáng + bloom của `post3d`).
5. **Ánh sáng & hậu kỳ:** một mặt trời theo vùng / giờ, bóng mây trôi, ngày / đêm / mưa; bloom ngưỡng, mờ chiều sâu nhẹ (kiểu tilt-shift: cảnh như sa bàn), bảng màu (LUT) theo vùng, sương xa. Dùng lại `post3d` (paint / light), `quads` / `atlas` và bộ phần các hệ (`plantParts`, `waterParts`, `flameParts`, `shadeParts`, `riftParts`…) cho lá rơi, tàn lửa, đom đóm, **tha hóa bằng mực bóng tối thật bò trên đất**.
6. **Ngoài mép:** vòng rừng / vách / biển sinh bằng code nối dài, sương che chân trời; camera không bao giờ thấy "hết thế giới".
7. **Camera:** góc 3/4 cố định (nghiêng ~35–45°, ống kính hẹp như camera trận `fov 10`) để giữ cảm giác 2D; có thể nghiêng nhẹ khi vào vùng mới, zoom chậm khi tới vật mốc.

**Phần giữ nguyên:**
- Logic Adventure (lưới, `walkableOf`, nhóm quái, rương, cổng, save) không đổi. Renderer chỉ là một lớp mới đọc cùng dữ liệu (đúng ARCHITECTURE: logic thuần, scene chỉ vẽ).
- HUD Phaser / DOM giữ nguyên. Canvas Three nằm dưới canvas Phaser trong suốt; hoặc chép texture như lớp VFX trận (đo cả hai trong prototype).

**Phần thưởng thêm:** trận đấu có thể đặt trên **chính đoạn map nơi gặp quái** (cùng diorama, camera trận), thay nền trận vẽ riêng. Để sau, không thuộc phạm vi này.

### 10.4. Art cần (chủ dự án tạo bằng Gemini, agent cắt / xử lý)

| Loại | Mỗi vùng | Ghi chú |
|---|---|---|
| Texture nền liền mép | 5–8 | agent làm liền mép bằng code (bù mép, trộn), kiểm lặp hình |
| Dải mặt vách / bờ | 2–3 | dải ngang lặp |
| Tranh đứng cây / bụi / đá | 10–15 | **kit hiện có (vd. Rừng: oak, fir, blossom, bushes, rocks, stumps, reeds, mushroom ring…) dùng lại được**, chỉ cần thống nhất góc nhìn và ánh sáng |
| Vật mốc | 2–3 | tháp dịch chuyển (mới), cây cổ thụ, cối xay… |
| Vật dùng được | dùng chung | rương 5 loại, mỏ, đá truyền thuyết — vẽ to hơn (mục 5 #3c) |

Không còn tranh 4K mỗi map. Nền v3 hiện chiếm 177 MB; diorama chỉ cần vài chục MB texture dùng chung cả vùng.

### 10.5. Thiết kế màn (level design) làm lại cùng lúc

Vì dựng lại từ đầu, bố cục cũng làm lại có chủ đích, theo hợp đồng cảnh (mục 2.1) và vòng khám phá (mục 6):
- mỗi map: 1 vật mốc thấy từ xa; 1 vòng lặp chính + 1–2 nhánh có bí mật; ≥ 3 điểm tò mò không phải quái mỗi khung màn hình;
- tháp dịch chuyển của vùng là vật mốc của map nhánh nút giao;
- kỹ năng hiện trường theo hệ: mỗi map có chỗ dùng ít nhất 2 hệ (đốt, đóng băng, soi sáng…), có phần thưởng thấy được trước khi mở;
- quái đứng yên ở chỗ hẹp, vùng canh thấy được (mục 9.4).

Admin map builder (decision 047) mở rộng thêm: cọ độ cao, cọ chất liệu, đặt tranh đứng, xem trước bằng chính renderer mới. Chủ dự án dựng map bằng mắt, không qua script Python.

### 10.6. Lộ trình có điểm dừng (không làm hết rồi mới biết đẹp hay không)

| Bước | Việc | Điểm dừng |
|---|---|---|
| **0. Prototype** (vài ngày) | trang thử chỉ có trong dev / sandbox: dựng **một đoạn Bìa Rừng** (≈ 1,5 khung màn hình) theo hướng D bằng kit hiện có + texture tạm; đội đi được, cây che được, suối chảy, gió, ngày / đêm, bloom. Đo FPS trên RTX 3050 và trên GPU tích hợp (mức `light`) | **chủ dự án so ảnh / video với map hiện tại → đi tiếp hay dừng** |
| 1. Decision mới + chuẩn | `docs/maps/MAP_SCENE_STANDARD.md`: hợp đồng cảnh, bảng chất liệu vùng, camera, ánh sáng, thước chấm 10 điểm, ngưỡng 7 | duyệt chuẩn |
| 2. Renderer + Admin | renderer diorama, va chạm theo đường mép, công cụ Admin, công cụ chụp map tự động | `npm run check` xanh, FPS đạt |
| 3. Vùng Rừng (6 map) | art Rừng + bố cục mới + tháp + vòng khám phá | **chủ dự án duyệt mốc chuẩn Rừng** |
| 4. Núi → Tàn Tích → Biển → Vết Nứt | theo mốc chuẩn | mỗi vùng một lần duyệt |
| Song song (decision riêng) | đi tiếp từ chỗ rời, tháp, bỏ 18 cổng và "Đi nhanh", thua về chỗ cũ, chặn lách, lobby mới | không phụ thuộc renderer |

**Nếu prototype không đẹp hơn rõ rệt:** quay về A (lớp sống trên tranh v3). Mọi việc gameplay và lobby vẫn dùng được, không phí.

### 10.7. Rủi ro và cách đỡ

- **Trông "3D rẻ":** chất liệu vẽ tay, toon ramp, không dùng mô hình 3D chi tiết, mọi vật đứng là tranh. Prototype là để bắt lỗi này sớm.
- **GPU yếu:** 3 mức như cài đặt hiệu ứng (`off` / `light` / `full`): tắt bóng, tắt mờ chiều sâu, giảm hạt; lưới 64 × 36 ô chỉ vài chục nghìn tam giác.
- **Tranh đứng lệch góc / ánh sáng:** thống nhất brief cho Gemini (góc 3/4, nắng từ trên trái, nền trong suốt) qua skill `image-to-asset`; QA trước khi vào game.
- **Công lớn:** chia bước, có điểm dừng; logic / save không đổi nên không rủi ro mất save.
- **Bản quyền:** chỉ học kỹ thuật dựng cảnh; mọi hình gốc (decision 048, `IP_AUDIT_PROMPT.md`).

### 10.8. Câu hỏi lượt 3 (đã trả lời bên dưới)

1. Đồng ý **làm prototype hướng D** (một đoạn Bìa Rừng, chỉ trong dev) trước khi chốt nền tảng?
2. Bố cục 18 map **làm lại theo thiết kế màn mới** (mục 10.5), hay giữ bố cục v3 và chỉ đổi cách dựng hình? Đề xuất: làm lại.
3. Quái và đội trên map giữ **sprite 2D hiện tại** (tranh đứng) — đồng ý? (Không làm mô hình 3D cho sinh vật.)

**Trả lời 10.8 (chủ dự án, 2026-11-18):**
- Bố cục 18 map: **làm lại** theo thiết kế màn mới (mục 10.5).
- Sinh vật: nếu chuyển sang Diorama 2.5D thì chủ dự án **đồng ý chuyển cả sprite 2D sang mô hình 3D**.
- **Tiền đề mới:** agent làm toàn bộ; chủ dự án chỉ duyệt và render ảnh AI khi cần.

---

## 11. Phương án theo tiền đề "agent làm hết, chủ dự án duyệt + render ảnh AI"

### 11.1. Sinh vật 3D: khuyến nghị **không**, giữ tranh 2D đứng trong cảnh 3D

Chủ dự án đã đồng ý chuyển, nhưng với tiền đề trên, bằng chứng trong repo cho thấy đây là phần dễ hỏng nhất:

| Bằng chứng | Nguồn |
|---|---|
| Lần duy nhất agent dựng sinh vật 3D (Unity, cổng U1): **4/4 mẫu không đẹp hơn tranh, "như đồ nhựa"**, đã dừng | `docs/studio/STATUS.md`, decision 051 / 058 |
| AI 3D (11/2026): mesh tĩnh thì tốt; **rig cho cá, cánh, tai dài, đuôi, tỷ lệ chibi: yếu**; **animation cho sinh vật không phải người: gần như chưa có** | `docs/research/2d-3d-strategy/05_CONG_NGHE_AI_3D.md` mục 5 |
| Model tốt cần 8–24 GB VRAM, máy dự án 6 GB ⇒ phải dùng dịch vụ cloud; bản miễn phí thường cấm thương mại hoặc buộc ghi công | cùng file, mục 4; `07_BAN_QUYEN.md` |
| Đổi sang 3D là bỏ 44 rig pose-to-pose, 814 layer, 266 key pose trận, và phải cân lại 134 VFX skill vốn tính cỡ theo tranh | `04_SO_SANH_2D_HYBRID_3D.md` mục 5; `SKILL_ANIMATION_STANDARD.md` |
| Mỗi con cần ít nhất 25 clip (đi, đứng, 10 cử chỉ skill, tuyệt kỹ…) × ~55 sinh vật, agent phải tự keyframe bằng code, không có công cụ AI gánh | decision 050 |

Quan trọng hơn: **nhân vật 2D trong cảnh 3D chính là đặc trưng của kiểu HD-2D**, không phải phương án tạm. Tranh Sobi đã được duyệt từng con. Đặt chúng đứng trong cảnh có ánh sáng thật, bóng thật, che khuất thật là được phần đẹp của 3D mà không mất nét vẽ.

Những gì sinh vật **vẫn được thêm** trong diorama:
- bóng đổ thật lên mặt đất và vách;
- ánh sáng vùng / đêm / mưa phủ lên tranh (nhân màu + viền sáng phía mặt trời);
- che khuất đúng theo chiều sâu;
- puppet rig hiện có vẫn chạy (thở, đi, nhún);
- tranh hơi nghiêng về camera, không phẳng dán đất.

**Cửa để ngỏ:** sau khi Rừng xong, có thể thử **một** con bằng image-to-3D: chủ dự án đưa 1 tranh đã duyệt lên dịch vụ có giấy phép thương mại, agent đặt vào diorama và so cạnh bản tranh. Chỉ đổi khi bản 3D thắng rõ ở ảnh so. Mesh tĩnh (không rig) cho **vật mốc** (tháp, cây cổ thụ) là chỗ AI 3D mạnh nhất, cũng thử được ở bước đó.

### 11.2. Ai làm gì

| Việc | Agent | Chủ dự án |
|---|---|---|
| Thiết kế màn 18 map + 4 tháp + vòng khám phá | ✔ viết hợp đồng cảnh, dựng dữ liệu, kiểm tự động | duyệt bản thiết kế (ảnh sơ đồ) |
| Renderer diorama, shader, ánh sáng, hậu kỳ | ✔ | — |
| Texture nền | ✔ **sinh bằng code trước** (nước, dung nham, cát, đá, cỏ cơ bản); Gemini chỉ khi code không đủ đẹp | render khi agent gửi prompt |
| Tranh đứng (cây, đá, vật, tháp, vật dùng được, trạng thái kỹ năng hiện trường) | ✔ dùng lại kit cũ; viết brief + prompt dán sẵn (skill `image-to-prompt`, `image-to-asset`), cắt, xử lý, QA | **render theo lô** |
| Gameplay (tháp, đi tiếp, thua về chỗ cũ, bỏ cổng / Đi nhanh, chặn lách, kỹ năng hiện trường, sưu tập, sự kiện) | ✔ decision, code, test, bot cân bằng trước / sau, migration save | duyệt decision |
| Lobby mới | ✔ | duyệt ảnh |
| Kiểm chất lượng | ✔ tự chấm ≥ 7 theo thước 10 điểm **trước khi** gửi; chụp ảnh + video đi bộ cố định | **duyệt ở cổng** |

**Ước lượng ảnh chủ dự án cần render** [NHẬN ĐỊNH]: khoảng 120–150 asset, gom thành sheet nhiều asset mỗi lần tạo, tức khoảng **20–30 lần tạo Gemini** cho cả dự án:
- Rừng khoảng 1/3 (dùng lại kit nhiều nhất);
- mỗi vùng sau 4–6 lần;
- vật dùng được + kỹ năng hiện trường 5–8 lần.

### 11.3. Cổng duyệt (chủ dự án chỉ cần xem những lúc này)

| Cổng | Agent gửi gì | Chủ dự án quyết |
|---|---|---|
| **G0 — Prototype** | ảnh so cạnh "map hiện tại ↔ diorama" ở 4 điểm, video đi bộ 20–30 s, ngày / đêm, FPS | **đi tiếp hay quay về hướng A** |
| G1 — Chuẩn + thiết kế Rừng | `MAP_SCENE_STANDARD.md`, sơ đồ 6 map Rừng (vật mốc, lối, bí mật, tháp) | duyệt chuẩn + bố cục |
| G2 — Rừng hoàn chỉnh | contact sheet 6 map, video, điểm tự chấm, bảng FPS | **mốc chuẩn** cho các vùng sau |
| G3–G5 — Núi, Tàn Tích, Biển (+ Vết Nứt) | như G2 | duyệt từng vùng |
| D1–D3 — decision gameplay | decision + bảng bot cân bằng | duyệt luật |
| L1 — Lobby | ảnh trước / sau | duyệt |

Giữa các cổng agent tự chạy, không hỏi thêm, trừ khi đụng gameplay mới, bản quyền hoặc save (AGENT_RULES §6).

### 11.4. Rủi ro riêng của tiền đề này

| Rủi ro | Đỡ |
|---|---|
| Agent tự chấm "đẹp" sai (chỉ thấy ảnh chụp) | G0 có điểm dừng thật; thước chấm có tiêu chí so cạnh bản cũ / tranh mẫu; luôn gửi ảnh cỡ đầy đủ + video, không chỉ ảnh thu nhỏ |
| Diorama dựng bằng code trông "nhựa" như U1 | khác U1 ở chỗ **hình vẫn là tranh vẽ** (texture + tranh đứng), 3D chỉ cho chiều sâu và ánh sáng. G0 chấm riêng tiêu chí "có còn chất tranh Sobi không" |
| Texture code không đủ chất vẽ tay | chuyển sang Gemini cho đúng loại đó (ít lần tạo) |
| Khối lượng lớn [NHẬN ĐỊNH, tin cậy thấp] | prototype 2–3 phiên; renderer + công cụ 8–12; 18 map + art 15–20; gameplay 8–12; lobby 3–5 ⇒ khoảng **40–55 phiên agent**. Mỗi vùng xong là chơi được, không chờ hết |
| GĐ15 (phát hành) lùi | gameplay và lobby làm song song; renderer cũ giữ tới khi vùng mới thay xong (bật / tắt theo map) |

### 11.5. Bước tiếp theo đề xuất

**G0 — prototype diorama một đoạn Bìa Rừng**, chỉ trong dev / sandbox, không đụng `content/` hay save. Dùng kit Rừng hiện có làm tranh đứng, texture sinh bằng code, sprite đội + 2–3 quái hiện tại làm tranh đứng. Cần chủ dự án: **không cần render ảnh nào** ở bước này.

---

## 12. Kết quả G0 — prototype diorama trên Bìa Rừng (2026-11-18)

**Ở đâu:** Admin → Phiêu lưu → **🏞️ Diorama map (G0)** (`#/diorama-lab`). Đi bằng W A S D / phím mũi tên. Có nút chọn ngày / chiều / đêm, mức Đẹp / Nhẹ, bật tắt gió, và 4 điểm duyệt. Chỉ có trong Admin: game, `content/` và save không đổi.

**Bằng chứng:**
- So cạnh map hiện tại ở 4 điểm: `docs/maps/diorama/g0_compare_day.jpg`. Cột trái là nền vẽ v3 cắt đúng khung game (40 ô, chưa có sprite); cột phải là diorama (khung 30 ô).
- Ngày / chiều / đêm: `docs/maps/diorama/g0_times.jpg`.
- Ảnh gốc 1600 × 900 (12 ảnh) + ảnh động đi bộ 22 giây: `art_inbox/diorama_shots/g0/` (`g0_walk.webp`).
- Chụp lại: `npx tsx scripts/maps/dioramaShots.ts --base <admin> --out <thư mục> --gpu` và `scripts/maps/dioramaWalk.ts`.

**Đã dựng (đều từ dữ liệu hiện có, không vẽ ảnh mới):**

| Phần | Cách làm |
|---|---|
| Địa hình | Lưới `maps.json` → trường mịn: lấy mẫu ô, uốn nhiễu, làm mờ Gauss, nên mép cong tự nhiên, không còn bậc thang. Có độ cao (`elevation`); cao nguyên được bao vách đá, bậc thang là dốc |
| Mặt đất | Một shader trộn cỏ (3 tông theo mảng + nét cọ + hoa nhỏ), đường đất (2 tông + sỏi), nền rừng, bờ, đá; mặt vách có vân lớp và mép cỏ; bóng mây trôi |
| Vách cao nguyên | Dải vách của kit dựng đứng dọc mọi chỗ đất tụt |
| Nước | Khoảng cách tới bờ có dấu + tỉ lệ nước mịn: màu nông → sâu, gợn chảy, bọt mép thở, tia lấp lánh, lá sen + hoa |
| Cầu | Một sàn ván thẳng có lan can cho mỗi cụm ô cầu |
| Cây, bụi, đá | Kit Rừng (sồi, thông, tán lớn, hoa anh đào, bụi, đá, gốc): tranh đứng, **bóng thật**, **gió lay ngọn**, **mờ dần khi che đội**; bóng vẽ sẵn trong ảnh được tự xóa |
| Đội, quái, rương | Sprite hiện có làm tranh đứng; quái thở, cỡ theo loại; rương to hơn, có tia sáng |
| Ánh sáng & hậu kỳ | Mặt trời có bóng mềm theo camera; ngày / chiều (bóng dài) / đêm (trăng xanh + đèn ấm quanh đội); bloom có ngưỡng, mờ trên dưới kiểu sa bàn, chỉnh màu, vignette |
| Sự sống | Đom đóm (chiều, đêm), lá rơi xoay, bụi nắng, bướm vỗ cánh |
| Đi lại | Đúng luật va chạm của game (`walkableOf`, `stepCharacter`), camera bám mềm, không lộ mép thế giới (rừng nối dài bằng code) |

**Hiệu năng** (đo bằng `dioramaShots.ts`):

| Máy | Mức Đẹp | Mức Nhẹ |
|---|---|---|
| RTX 3050 | 60 FPS mọi điểm (giới hạn vsync) | 60 FPS |
| Không GPU (SwiftShader, CPU) | — | 32–48 FPS |

**Tự chấm** (thước 10 điểm, mục 2.5), **7,5 / 10**:

| # | Tiêu chí | Điểm | Ghi chú |
|---|---|---|---|
| 1 | Đủ những gì G0 hứa | 1,5 | thiếu mưa, tha hóa |
| 2 | Đọc được lối đi | 1,5 | lối rõ, mép mịn; va chạm vẫn theo ô nên lệch mép vẽ tối đa ~0,5 ô |
| 3 | Sống | 1,5 | gió, nước, đom đóm, lá, bướm, thở, bóng mây; ảnh tĩnh không thể hiện hết, xem ảnh động |
| 4 | Chất liệu & màu | 1,0 | nước, cây, ánh sáng tốt; mặt đất còn ít chi tiết hơn tranh v3 |
| 5 | Hiệu năng & an toàn | 2,0 | 60 FPS; mức Nhẹ chạy được cả không GPU; không chớp |

**Nói thẳng điều so cạnh cho thấy:**
- **Diorama hơn** ở: chiều sâu (cây che đội thật, bóng thật), ánh sáng theo giờ, chuyển động, mép map không lộ, và chỗ trông đi được thì gần như đúng là đi được.
- **Tranh v3 còn hơn** ở: độ chi tiết mặt đất (hoa, cỏ vẽ tay, bờ có nét) và cảnh cao nguyên có bậc đá đẹp (điểm 4).
- Lý do: bố cục v3 được vẽ cho một tấm tranh phẳng. Cao nguyên thấp, cầu bị biến thành sàn rộng, đất trống nhiều. **Bố cục mới thiết kế cho diorama** (mục 10.5) cộng **vài lô tranh đứng chi tiết** (đá bậc, hoa, cỏ cao, bờ đá) sẽ lấp phần này. Đó là việc của bước 1–3, không phải giới hạn của nền tảng.

**Giới hạn đã biết của G0:**
- Va chạm vẫn theo ô. Bước renderer thật sẽ dùng chính đường mép mịn.
- Chưa có tương tác (đánh, mở rương), tha hóa, mưa, tháp.
- Mép mặt đất ở xa còn nhìn hơi phẳng.

**Lỗi asset phát hiện khi làm** (ngoài phạm vi, chưa sửa): `public/assets/props/chr_so_down_idle.png` là **nguyên một sheet 6 hình nền trắng** (843 × 1264), từ commit `99e2f228`. Mọi khung khác là 96 × 144. Trong game, So đứng quay mặt xuống sẽ hiện sai. Prototype tạm dùng khung `down_walk1` thay.

**Cổng G0 — chủ dự án quyết:** đi tiếp hướng diorama (bước 1: decision + chuẩn, rồi thiết kế lại vùng Rừng), hay quay về hướng A?

---

## 13. G0 lượt 2 — sửa theo 7 góp ý của chủ dự án (2026-11-18)

Bằng chứng: `docs/maps/diorama/g0b_before_after.jpg` (lượt 1 ↔ lượt 2 ở 4 điểm), `docs/maps/diorama/g0b_times.jpg`, ảnh gốc + ảnh động đi bộ qua cầu `art_inbox/diorama_shots/g0b/` (`g0b_walk.webp`).

| # | Góp ý | Nguyên nhân | Đã sửa |
|---|---|---|---|
| 1 | Cây như tờ giấy | Tranh dựng thẳng đứng bị góc nhìn từ trên ép còn ~62 % chiều cao; ánh sáng phẳng; bóng đổ từ một tấm phẳng thành vệt mỏng | Mọi tranh **nghiêng 26° về camera** (giữ ~93 % chiều cao); **normal map "gối phồng"** sinh từ hình tán, nên có mặt sáng và mặt tối như một khối; **bóng đổ từ khối tròn ẩn** (tán + thân), không từ tấm phẳng |
| 2 | Đi qua cầu bị lọt xuống | Chân đội lấy độ cao mặt đất (lòng sông −0,45) | Có mặt sàn riêng (`decksOf`, `standAt`): trên cầu, chân đứng ở mặt ván. Ảnh động đã đi qua cầu |
| 3 | Gốc cây lộ vòng tròn | Kit vẽ sẵn bóng là ellipse xám **đặc** (alpha 255), quy tắc cũ chỉ bắt điểm trong suốt | Quy tắc mới: phần dưới tranh, điểm xám không màu thì xóa. Đã thử trên 8 tranh kit, sạch |
| 4 | Chỗ trống vẫn bị chặn | Va chạm theo lưới ô của tranh v3; hình vẽ đã cong và mờ mép nên lệch tới 1 ô; ô `#` lẻ không có cây | **Va chạm sinh từ chính trường đã vẽ** (`walk.ts`, ô 0,25): rừng / nước / đá vượt 0,5 thì chặn, **cây trồng đúng trên ngưỡng đó**. Vật (rương, đá truyền thuyết…) và đạo cụ giữ ô chân |
| 5 | Vào tán rừng không thấy gì | Nhiều tán chồng nhau, mỗi cây chỉ mờ còn 32 % | **Vòng nhìn xuyên quanh đội**: mọi tranh đứng trước đội (gần camera hơn) bị khoét một vòng tròn theo màn hình, mép mềm, xuyên mọi lớp |
| 6 | Quái là ảnh dựng đứng, trông giả | Ảnh tĩnh, bị ép bởi góc nhìn | Nghiêng về camera (đúng tỉ lệ), **thở co giãn**, **nhảy nhẹ** theo nhịp riêng, **quay mặt về phía đội** khi lại gần (lật kiểu giấy cắt, qua mép mỏng), nghiêng người khi đội ở gần, bóng tiếp đất; quái đứng nước tạo **gợn tròn**. Rương sáng và nảy khi lại gần |
| 7 | Cần sinh động hơn | — | **Gió giật** chạy thành sóng qua cả rừng và cỏ; **cỏ và bụi rẽ ra** khi đội đi qua; **bụi đất** dưới chân khi đi; **gợn nước** (cá nhảy quanh tầm nhìn, chân đội lội mép nước) |

**Hiệu năng sau lượt 2:**
- RTX 3050: 60 FPS ở mọi điểm, mọi giờ.
- Không GPU (mức Nhẹ): 34–49 FPS.

**Nói thẳng về góp ý 1 và 6:** cây và quái vẫn là tranh 2D, chỉ được làm cho có khối, có sáng tối và có chuyển động. Khi đi vòng quanh một vật, góc nhìn của nó không đổi (camera cố định hướng), nên nhìn kỹ vẫn biết là tranh. Hai bước tiếp theo nếu cần hơn nữa:
- **Cây nhiều lớp:** tách tán thành 2–3 lớp ở độ sâu khác nhau, có thị sai khi camera trôi. Không cần ảnh mới, agent làm được.
- **Thử 1 quái 3D bằng image-to-3D:** chủ dự án đã đồng ý cho chuyển sinh vật sang 3D (mục 11). Cần chủ dự án đưa 1 tranh đã duyệt lên một dịch vụ có giấy phép thương mại. Agent đặt kết quả vào diorama cạnh bản tranh để so. Rủi ro đã ghi ở mục 11.1: rig và animation cho sinh vật không phải người.

**Giới hạn đã biết:**
- Ảnh chụp tĩnh dùng nút nhảy điểm, nên đồng đội đứng dồn sát chân trưởng nhóm; khi đi họ tự giãn hàng (xem ảnh động).
- Khu ẩn dưới tán (lớp che của game) trong diorama là đất trống, vì tán chỉ trồng trên ô rừng. Bố cục mới sẽ thiết kế lại.

---

## 14. G0 lượt 3 (2026-11-18)

Bằng chứng:
- So lượt 2 ↔ lượt 3 ở 4 điểm: `docs/maps/diorama/g0c_before_after.jpg`.
- Cận cảnh: `docs/maps/diorama/g0c_closeup.jpg`.
- Ảnh gốc + ảnh động đi bộ: `art_inbox/diorama_shots/g0c/` (`g0c_walk.webp`).

| Việc | Cách làm (agent tự làm, không ảnh mới) |
|---|---|
| Cây nhiều lớp | Mỗi cây 3 lớp, dời dọc hướng nhìn nên vẫn khớp nhau trên màn hình: mặt tán phía sau (chính tranh, tối hơn), cây, và **lớp chùm lá sáng phía trước** cắt từ phần sáng bên trong tán (`extraArt.ts` `leafLayer`). Mỗi lớp lắc một nhịp khác, nên khi có gió tán cây chuyển động thành từng lớp lá |
| Viền cỏ dọc đường | Hàng cỏ dày ở mọi mép đường đất, như nét viền trong tranh v3 |
| Sậy bờ nước | Cụm sậy (lá + bông nâu) theo từng đoạn bờ, có lắc gió và rẽ ra khi đội đi qua |
| Chim bay | Đàn chim chữ V bay ngang trời mỗi ~17 giây (ngày, chiều), **bóng chim lướt trên mặt đất** theo hướng nắng (`birds.ts`) |
| Camera nhìn trước | Camera dời nhẹ về phía đội đang đi (trái / phải 2,6, lên / xuống 1,6 ô), mềm trong 0,7 giây |
| Vòng nhìn xuyên | Dither mịn (không còn lưới chấm 4 × 4), giữa vòng trong hẳn |
| Đồng đội khi vào map | Xếp hàng về phía trống nhất, không dồn vào chân trưởng nhóm |
| Không đặt cỏ / sậy trên mặt cầu | — |

- Đã thử sỏi trên đường, nhưng trông như hạt bẩn nên bỏ.
- 60 FPS ở mọi điểm, mọi giờ (RTX 3050).
- **Còn lại:** cây và quái vẫn là tranh 2D (xem mục 13). Cầu vẫn là sàn rộng theo khung ô cầu của bố cục v3. Vách cao nguyên vẫn thấp. Hai việc này sẽ giải ở bước thiết kế lại bố cục.

---

## 15. Sửa che khuất trong rừng rậm (2026-11-18)

**Góp ý:** vào nhiều khu rừng rậm vẫn bị thân cây che, cây che mất người.

**Nguyên nhân:** vòng nhìn xuyên đang so **độ sâu từng điểm ảnh** với đội (phải gần camera hơn 0,35). Cây mọc sát mép chỗ đứng (gốc gần cùng hàng với đội) chỉ gần hơn rất ít, nên không bị khoét, và thân cây của nó che đội.

**Đã sửa:**
- **Khoét theo gốc cây:** mọi tranh đứng có gốc ngang hàng hoặc ở trước đội (z gốc > z đội − 0,2) đều bị khoét vòng tròn quanh đội trên màn hình, xuyên mọi lớp. Hai lớp phụ của cây (tán sau, lá trước) dùng gốc thật của cây, nên cả 3 lớp bị khoét như nhau.
- Vòng to hơn (20 % chiều cao khung), giữa vòng trong hẳn.
- **Bóng viền nhân vật:** đội và đồng đội có thêm một bản vẽ màu ấm, mờ 50 %, **chỉ hiện ở chỗ có vật gần hơn che** (depth test "greater"). Kể cả khi vòng khoét chưa đủ, người chơi vẫn thấy dáng đội.

**Kiểm tra tự động:**
- `scripts/maps/denseSpots.ts` tìm 8 chỗ đứng được mà rừng dày nhất ở phía trước trong Bìa Rừng.
- `dioramaShots.ts --spots` chụp cả 8 chỗ: đội đều thấy rõ (`docs/maps/diorama/g0d_dense_spots.jpg`).
- Ảnh động đi trong rừng rậm (`dioramaWalk.ts --from 48,24`): `art_inbox/diorama_shots/g0d/g0d_forest_walk.webp`.
- 60 FPS ở cả 8 chỗ.


---

## 16. Diorama vào game: 6 map vùng Rừng (2026-11-19, decision 064)

Chủ dự án quyết cổng G0: đi tiếp Diorama. Vòng lặp nhiều agent (`docs/AGENT_LOOP.md`, sổ `docs/agent-loop/forest-diorama/STATE.md`) đưa renderer từ Admin vào game cho cả 6 map Rừng. Chuẩn: `docs/maps/MAP_SCENE_STANDARD.md`. Điểm reviewer độc lập: `docs/maps/diorama/SCORES.md`.

**Kiến trúc đã chốt:**
- Renderer dùng chung ở `src/areas/adventure/scene/diorama/` (Admin lab import lại). `walk.ts` (va chạm theo trường mịn) đã xóa: va chạm vẫn là `walkableOf` / `stepCharacter` theo ô; cảnh phải khớp ô (`blockerPlan` + test 6 map: mọi ô chặn có vật nhìn thấy, không gốc cây trên ô đi được, mép đi được / chặn lệch ≤ 0,25 ô).
- `MapRenderer` (`ClassicRenderer` 2D giữ nguyên, `DioramaRenderer` chép texture Three sang Phaser như lớp VFX trận). Luật (chạm quái, tương tác, cổng, lưu) ở lại AdventureScene, chung cho hai renderer.
- Cài đặt theo máy (`settings.json`, không đụng save): Kiểu bản đồ Diorama / 2D cổ điển, Chất lượng Tự động / Đẹp / Nhẹ. GPU phần mềm ⇒ 2D; chậm ⇒ Nhẹ ⇒ 2D.
- Dữ liệu riêng từng map ở `contracts.ts` (ánh sáng, đời sống, gió, tông đất, điểm nhấn) + module điểm nhấn: vệt nắng, mực tha hóa, bào tử, thác, sương, guồng nước.

**Điểm (thước §2.5, ngưỡng > 7,5):**

| Map | Vòng | Điểm | FPS RTX 2060 Đẹp | FPS GPU tích hợp AMD Nhẹ |
|---|---|---|---|---|
| Bìa Rừng | 3 | 9,0 | 144 (cả 6 điểm) | 117–144 |
| Rừng Sâu | 2 | 8,0 | 115–144 | 92–124 |
| Lõi Rừng | 1 | 8,0 | 144 | 98–113 |
| Thung Nấm | 1 | 8,0 | 93–144 | 96–130 |
| Thác Rêu | 2 | 8,0 | 114–138 | 55–86 |
| Đầm Sương | 1 | 8,0 | 102–144 | 90–123 |

**Bài học:**
1. **Đo đúng máy.** Chrome headless `--gpu` mặc định chạy GPU tích hợp (AMD Radeon), không phải GPU rời; máy đo thật là RTX 2060, không phải RTX 3050. Số "60 FPS RTX 3050" của G0 thật ra là GPU tích hợp. Script chụp nay nhận `ANIM_GPU=high | low` và in chuỗi adapter. Số "32–48 FPS không GPU" của G0 sai: bộ đếm cũ kẹp 50 ms nên không đọc được dưới 20; thực tế SwiftShader 2–4 FPS ⇒ GPU phần mềm tự lùi 2D.
2. **Chi phí chính không ở hình học.** MSAA 4× trên đích half-float tốn nhất (34 → 61 FPS khi bỏ, thay FXAA); nhiễu từng điểm ảnh ở shader mặt đất ⇒ nướng màu đất một lần mỗi map; 2000 khối bóng không cắt khung ⇒ chia khúc 12 ô + cắt khung.
3. **Ép mép 0,25 ô cho mọi ranh giới làm lộ lưới.** Chỉ ranh giới đi được / chặn cần khớp ô (bo góc); ranh giới giữa hai chất liệu đi được (cỏ / đất / rêu) phải mềm như G0.
4. **Reviewer độc lập bắt được điều coder bỏ qua**: thiếu cao nguyên + vật mốc (Bìa Rừng v1 6,5), vật mốc < 1/8 khung, màu ngày "giống Bìa Rừng", khối tối mép cứng (thường là một tranh kit bị cắt khung, một hố cao nguyên vẽ thành vách, hoặc bộ lọc bóng xóa mất phần xám của tranh vật mốc).
5. **Gió phải chứng minh bằng số**: chụp đoạn đứng yên (camera đứng) và đo khác biệt từng góc ¼ khung giữa hai khung liên tiếp (gió tắt ≈ 0,2–0,9, gió bật ≥ 2,5).
6. **Lỗi chung sửa một lần ở map sau** (đêm trong rừng quá tối, bóng cầu tròn đen, tán rìa đứng yên) và kiểm hồi quy bằng ảnh các map đã đạt.

**Còn yếu (đều đã đạt ngưỡng, chưa sửa):** xem cột "Còn yếu" của `docs/maps/diorama/SCORES.md`; nhu cầu art ở `docs/ASSET_TODO.md` mục "Diorama vùng Rừng".
