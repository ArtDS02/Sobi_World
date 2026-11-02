# SOBI ADVENTURE — ĐỊNH HƯỚNG HỆ THỐNG BẢN ĐỒ MỚI

**Phiên bản:** 1.1
**Ngày:** 02-11-2026
**Phạm vi:** Art direction, map production pipeline, navigation authoring, rendering, camera và compatibility.
**Đối tượng đọc:** AI agent triển khai (Claude Code) và chủ dự án.

> Tài liệu này đi kèm `Context.md` (mô tả cách dựng map hiện tại, 01-11-2026). Nếu code thực tế khác Context.md thì **code thực tế là chuẩn**; ghi lại điểm khác trong báo cáo audit.

---

## 0. Cách đọc tài liệu này (dành cho AI triển khai)

1. Mục 16 "Quyết định đã chốt" là **ràng buộc cao nhất**. Nếu mục khác mâu thuẫn, mục 16 thắng.
2. Mục 15 liệt kê điều tuyệt đối không được làm.
3. Công việc chia thành **3 lượt có điểm dừng** (mục 17). Không tự chạy sang lượt sau khi chưa được chủ dự án duyệt.
4. Chỗ nào ghi "AI tự quyết": hãy quyết định, **ghi quyết định + lý do + rủi ro vào kế hoạch/báo cáo**, không hỏi lại trừ khi ảnh hưởng gameplay hoặc save.
5. Không tuyên bố hoàn thành nếu chưa có ảnh capture, kết quả validator và kiểm thử save.

---

## 1. Mục tiêu

Sobi Adventure chuyển từ cách dựng bản đồ bằng ô terrain và asset ghép rời sang hệ thống bản đồ phiêu lưu 2D góc nhìn 3/4, địa hình liên tục và bố cục khám phá có chủ đích.

Tham chiếu Epic Battle Fantasy 3 chỉ dùng cho **góc nhìn, cảm giác không gian, cách thể hiện địa hình và tổ chức đường đi**. Không sao chép thiết kế màn chơi, hình ảnh, nhân vật hay phong cách nhận diện của trò chơi đó. Sobi Adventure phải giữ bản sắc nghệ thuật của Sobi World.

### Kết quả cần đạt

- Góc nhìn 3/4 (oblique), không còn cảm giác top-down phẳng.
- Camera zoom `fitZoom × 1.5` thay cho `× 2` (áp dụng toàn game).
- Địa hình là một môi trường liền mạch, không giống lưới ghép.
- Đường đi rõ ràng, tự nhiên, có không gian mở và nhiều khu vực khám phá.
- Props, nhân vật, quái và địa hình theo cùng một quy chuẩn phối cảnh.
- Navigation, collision và gameplay quản lý bằng dữ liệu logic **độc lập** với hình ảnh.
- Không mất tiến trình, không phá save hiện tại.

---

## 2. Chẩn đoán hệ thống hiện tại

Theo Context.md:

- Lưới logic 40 px/ô (map 64 × 36 = 2560 × 1440 logic).
- Layout sinh bằng Python từ hình nguyên thủy (`rect`, `blob`, `line`, `plateau`, `steps`, `cover`).
- Tranh tham khảo bị cắt thành bộ kit rồi ghép lại theo lưới; game không dùng tranh tổng thể.
- Scene vẽ terrain từng ô 40 px; mép chuyển tiếp cỏ/đường/nước/tường vuông, lộ lưới.
- Decal và props có phần rải theo seed, không theo ý đồ bố cục.
- Camera dùng `fitZoom × 2`.

Vấn đề thị giác chính:

1. Biên terrain dạng bậc vuông → bản đồ giống lưới ghép.
2. Nhiều nguồn art khác nét, màu, độ bão hòa, tỉ lệ chi tiết.
3. Tường/khối rừng là texture lặp, thiếu khối, thiếu chiều sâu.
4. Cao nguyên như hộp/tấm thảm, thiếu các mặt địa hình.
5. Đường đi và vật thể thiếu nhịp; chỗ trống quá, chỗ rối.
6. Thiếu phân cấp khu vực và điểm nhấn khám phá.

**Kết luận:** không tiếp tục vá bằng tile/props. Đổi nền tảng sản xuất hình ảnh và bố cục map.

---

## 3. Art direction: góc nhìn 3/4 và camera ×1.5

### 3.1 Góc nhìn

- Người chơi thấy mặt đất và một phần mặt đứng của địa hình.
- Núi, vách, cao nguyên, cầu, công trình thể hiện mặt trên và mặt bên/trước phù hợp.
- Cây có thân, tán, bóng, điểm tiếp xúc mặt đất rõ.
- Đường có chiều sâu, uốn lượn theo địa hình.
- Vật thể có thể che nhân vật theo vị trí tương đối.
- Không chuyển sang isometric hình thoi 45°. Giữ hệ tọa độ gameplay 2D; phối cảnh chỉ là quy ước trình bày.

### 3.2 Camera

- Đổi `fitZoom × 2` thành `fitZoom × 1.5` trong `mapCamera.ts` (hoặc nơi thực sự áp dụng — AI xác định chính xác trong audit). **Áp dụng toàn game.**
- Đây là đổi hệ số camera, không đổi kích thước logic, grid hay collision.
- Không phóng to riêng nhân vật/quái/props để bù.
- Kiểm tra lại camera follow, giới hạn biên map, vùng chừa HUD (hiện 270 px trên / 70 px dưới), khả năng quan sát lối đi.
- Chụp kiểm tra **mọi map** (kể cả map còn tile cũ) ở ×1.5 để chắc biên camera, HUD và sương mù không lỗi. Không yêu cầu làm đẹp lại map chưa chuyển đổi.
- Nhân vật, vật phẩm, quái, điểm tương tác phải vẫn dễ nhận biết ở ×1.5.

### 3.3 Quy chuẩn địa hình 3/4

- **Cao nguyên:** mặt trên, mép/vách đứng, bóng đổ, lối lên xuống.
- **Vách đá:** mặt đứng có chiều cao và chiều sâu, không chỉ viền tối.
- **Dốc/bậc:** thể hiện hướng và chuyển tiếp cao độ.
- **Cầu:** mặt cầu, đầu cầu, kết cấu bên dưới nếu thấy.
- **Sông/hồ:** bờ chuyển tiếp tự nhiên.
- **Thác:** điểm bắt đầu, mặt rơi, vùng nước nhận.
- **Hang/cửa vào:** hòa vào khối địa hình, có độ sâu và bóng.

---

## 4. Continuous Terrain Layout — địa hình liên tục

### 4.1 Nguyên tắc

Mỗi map có **một bức tranh môi trường hoàn chỉnh** làm nền địa hình, tạo trước khi đặt props. Đây không phải bảng tile mẫu để cắt thành nhiều mảnh rồi ghép.

Được chia ảnh nền thành chunk kỹ thuật (giới hạn texture WebGL/RAM), nhưng mọi chunk phải cắt từ **cùng một ảnh nguồn hoàn chỉnh**, đảm bảo khớp pixel, không seam, không lệch scale/màu. Không tái tạo từng chunk độc lập.

### 4.2 Được phép nằm trong nền

- Mặt đất, cỏ, đất, cát, đá nền.
- Núi, vách, sườn dốc, cao nguyên.
- Sông, hồ, bờ nước, thác.
- Đường mòn và cầu tự nhiên.
- Hang/cửa địa hình và cấu trúc địa hình cố định.

**Nền KHÔNG chứa tha hóa** (xem mục 16.6).

### 4.3 Không được nằm trong nền (phải là layer/asset riêng)

- Cây độc lập, bụi, nấm, hoa, đá trang trí rời.
- Nhà, cột, tượng, công trình cần depth sorting.
- Rương, NPC, puzzle, cổng, vật phẩm tương tác, tường giả.
- Quái, nhân vật người chơi.
- VFX động, lá bay, đom đóm, sương động, **tha hóa**.

Cấu trúc cố định như vách núi thuộc nền. Cây lớn có thể che nhân vật phải là object riêng hoặc tách layer để xử lý occlusion.

### 4.4 Không bắt AI vẽ theo grid

Ảnh nền vẽ theo bố cục thị giác tự nhiên. Grid logic áp dụng ở bước authoring sau (mục 8, 12).

---

## 5. Map composition — thiết kế theo khu vực khám phá

Mỗi map tổ chức thành các khu vực có vai trò gameplay và thị giác rõ. Không tạo mặt bằng lớn rồi rải vật thể ngẫu nhiên.

Các loại khu vực (không bắt buộc đủ mọi loại ở mọi map): **Starting Area**, **Main Exploration Area**, **Combat Area**, **Reward Area**, **Landmark Area**, **Secret Area**, **Exit Area**.

### Nguyên tắc bố cục

1. Hướng đi chính hiểu được mà không cần UI chỉ dẫn mọi thứ.
2. Đường chính dễ nhận; đường phụ có lý do khám phá.
3. Landmark giúp định hướng và ghi nhớ.
4. Combat area đủ rộng để nhìn rõ quái và thao tác.
5. Rương/phần thưởng đặt có chủ đích.
6. Lối ra thể hiện bằng ngôn ngữ hình ảnh hợp địa hình.
7. **Không đóng kín map bằng tường địa hình liên tục**; có khe mở, hành lang, lối kết nối tự nhiên.

### Loại tuyến đường

Main Path · Secondary Path · Hidden Path · Vertical Route (cầu/bậc/dốc) · Dead-end Reward Area.

---

## 6. Landscape density — phân lớp mật độ

| Lớp | Đặc điểm | Vai trò |
|---|---|---|
| Open Area | Ít props, khoảng trống lớn, đường dễ đọc | Di chuyển, quan sát, định hướng |
| Dense Area | Cụm cây/đá/bụi dày, che khuất có kiểm soát | Cảm giác rừng sâu, bí ẩn, nguy hiểm |
| Special Area | Bố cục có chủ đích, landmark/điểm tương tác nổi bật | Thu hút chú ý, khoảnh khắc khám phá |

Quy tắc:

- Tạo cụm props có chủ đề, không rải đều.
- Giữ khoảng trống quanh đường chính và combat area.
- Props không che lối ra, rương, NPC, quái quan trọng.
- Không dùng density cao chỉ để lấp chỗ trống; khoảng trống là thành phần composition.

---

## 7. Asset Style Guide

Mọi asset trong cùng map/zone tuân cùng quy ước phối cảnh và phong cách.

### 7.1 Thuộc tính cần chuẩn hóa

Perspective · Scale · Lighting Direction · Shadow · Visual Bounds · Foot/Depth Anchor · Collision Footprint · Placement Anchor · Cover Bounds · Layering (ground / world object / foreground).

Không phải asset nào cũng cần collision hay foreground; metadata phản ánh chức năng thật.

### 7.2 Style Guide phải có SỐ LIỆU (AI soạn ở Lượt 1)

Trước khi tạo prompt Gemini, AI phải đề xuất và ghi vào kế hoạch các giá trị cụ thể, để nền và props vẽ ở các lượt khác nhau không lệch nhau:

- Hướng sáng (ví dụ từ trên-trái) và hướng bóng đổ.
- Độ nghiêng 3/4 (mô tả bằng ngôn ngữ rõ cho Gemini + ảnh ví dụ nếu cần).
- Chiều cao nhân vật Sobi/Bi theo px/ô ở độ phân giải nguồn; tỉ lệ cây, đá, vách so với nhân vật.
- Bảng màu chủ đạo của vùng Rừng và mức bão hòa.
- Độ mềm và độ đậm bóng.

### 7.3 Quy tắc tạo và đặt asset

- Landmark lớn đặt thủ công.
- Props nhỏ có thể bán tự động nhưng phải kiểm soát cụm, mật độ, khoảng trống.
- Không đặt props lên đường đi nếu không có chủ đích.
- Không để asset top-down phẳng cạnh nền 3/4.
- Không dùng asset chỉ vì lấp được chỗ trống.

### 7.4 Props 3/4 cho pilot

Props và landmark mới cho M2 cũng do **chủ dự án tạo bằng Gemini** theo prompt AI soạn (mục 16.1). AI soạn **danh sách props/landmark M2 cần** (loại, số lượng, kích thước tương đối, layering, footprint dự kiến), rồi prompt + ảnh hint cho từng batch, cùng hướng dẫn tách nền/đặt tên/đặt vào đâu để qua `npm run art:process` và manifest. Asset luôn đi qua id → manifest (AGENT_RULES).

---

## 8. Navigation, collision và elevation

Hình ảnh và dữ liệu di chuyển **độc lập**.

### 8.1 Giữ hệ tọa độ logic

`tile: 40`, `cols`, `rows`; spawn, exits, props, groups, chests… lưu theo tọa độ ô. Bảo toàn hợp đồng này trừ khi có lý do kỹ thuật bắt buộc **và** migration được kiểm chứng.

### 8.2 Các lớp navigation

- **Walkable / Blocked**
- **Elevation** (cao độ/quan hệ cao-thấp cho trình bày và điều hướng)
- **Hidden Path**
- **Placement Zone** (vùng phù hợp đặt props/đối tượng)

Mở rộng Admin ("Bản đồ khu", `tools/admin/adventure*.ts`) để **hiển thị ảnh nền chồng lưới 40 px** và xem/chỉnh các lớp này là nên làm. Không suy luận collision thuần từ pixel ảnh. AI **được đề xuất mask walkable/blocked ban đầu** (ví dụ từ ảnh + ảnh guide), nhưng mask chỉ chính thức sau khi chủ dự án duyệt trên ảnh overlay lưới và qua kiểm tra bằng dữ liệu/gameplay.

### 8.3 Collision theo footprint

- Cây: chặn ở thân, không phải toàn tán.
- Đá: theo chân đá.
- Nhà/công trình: theo nền hoặc phần cản.
- Cầu: walkable trên mặt cầu.
- Vách đứng/nước sâu: blocked.
- Tán cây: chủ yếu là lớp che, không tự chặn.

Kiểm tra collision bằng vị trí **chân** nhân vật, không bằng bounding box ảnh.

---

## 9. Hidden paths và bí mật

### 9.1 Hidden Passage
Tuyến nằm trong map hiện tại; navigation đã có đường nhưng hình bị cây/đá/tán che. Khi người chơi đến gần/tương tác/giải puzzle, lớp che mờ/ẩn để lộ. Lưu trạng thái phát hiện bằng cơ chế save hiện tại (`foundSecrets`…).

### 9.2 Hidden Pocket Area
Map/khu vực riêng có hợp đồng chuyển cảnh rõ ràng; lối vào có thể sau thác, trong hang, sau vách. Có điểm vào/ra và trạng thái phát hiện ổn định.

Không biến mọi đường phụ thành bí mật; bí mật cần dấu hiệu gợi ý vừa đủ và phần thưởng hợp lý.

---

## 10. Rendering, depth sorting và occlusion

Thứ tự layer:

1. Terrain background (chunk từ một ảnh nguồn).
2. Ground details/decal.
3. World objects và props.
4. Player, combat animals, creatures.
5. Foreground/canopy.
6. Dynamic effects/VFX (kể cả lớp tha hóa, xem 16.6).

### Depth sorting

- Sort theo foot/depth anchor, không theo góc trên hay bounding box.
- Asset lớn có thể tách phần sau/phần trước.
- Nhân vật đi sau thân cây bị che đúng; đi trước thì vẽ phía trên.
- Lớp che có thể giảm alpha khi che nhiều nhưng vẫn nhận ra vị trí nhân vật.

### Trạng thái động (không bake vào nền)

Tha hóa theo % và thanh tẩy · rương mở/đóng · cổng đóng/mở · tường giả · puzzle bật/tắt · lớp che và bí mật đã phát hiện · sương mù khám phá · quái đã bị đánh bại/encounter hoàn thành. Tất cả phải vẽ được **chồng lên nền mới**.

---

## 11. Bảo toàn gameplay và save — bắt buộc

Đây là nâng cấp presentation và map production, **không phải viết lại gameplay**.

### 11.1 Phải giữ

- Map ID, Zone ID, Save ID.
- Map Graph và các kết nối hiện tại (decision 043).
- `tile`, `cols`, `rows` và hệ tọa độ 40 px/ô.
- `spawn`, `portal`, `exits` (kể cả `arriveX/arriveY` phía map liền kề), điều kiện khóa.
- Id và loại của props, groups, chests, nodes, gates, covers, puzzles, springs, NPC, lore, shrine.
- Trạng thái save: `openedChests`, `openedGates`, `foundSecrets`, `litPuzzles`, `beaten`, `explored` và liên quan.
- Quy tắc gameplay, chiến đấu, encounter, tiến trình.

### 11.2 Được thay đổi

- Ảnh nền và pipeline tạo terrain.
- Asset art và cách bố trí asset.
- Render layers, depth sorting, occlusion.
- Công cụ authoring navigation/collision.
- Camera zoom ×2 → ×1.5.
- Cách biểu diễn hình ảnh của đường đi và cao độ.
- **Bố cục mặt bằng của M2** (xem 16.2), với điều kiện giữ ID, số lượng, loại, hành vi của mọi đối tượng gameplay.

### 11.3 Điều kiện an toàn

- Không đổi ID đã được save tham chiếu nếu không có migration.
- Không xóa field hoặc đổi nghĩa field hiện có.
- Nếu đổi schema: nêu lý do, migration tương thích ngược, kiểm thử save cũ, phương án rollback; không migration phá hủy.
- Không reset/ghi đè save thật. QA dùng bản sao save (sandbox `sandbox-anim` hoặc tương đương).
- Chạy `mapProblems()` và kiểm tra `mapGraph` sau mỗi thay đổi dữ liệu map.

---

## 12. Quy trình sản xuất map mới

Phân công: **AI** = Claude Code; **Chủ** = chủ dự án.

| Bước | Việc | Ai |
|---|---|---|
| 1 | Audit map hiện tại; chụp ảnh toàn khu + player view "before"; ghi ID/tọa độ quan trọng | AI |
| 2 | Soạn kế hoạch, Style Guide số liệu, danh sách props M2 | AI |
| 3 | Tạo ảnh hint/guide + file PROMPT (nền, props) | AI |
| 4 | Render ảnh nền và props bằng Gemini, đặt vào đúng thư mục | **Chủ** |
| 5 | Tích hợp nền liên tục (chunk từ một ảnh nguồn), camera ×1.5 | AI |
| 6 | Trải ảnh lên lưới 40 px; AI đề xuất mask walkable/blocked/elevation; duyệt qua overlay | AI đề xuất → **Chủ duyệt** |
| 7 | Đặt lại spawn/exits/rương/nhóm quái/cổng/puzzle lên bố cục mới (giữ ID) | AI |
| 8 | Đặt landmark trước, props theo cụm/mật độ | AI |
| 9 | Depth sort, occlusion, lớp tha hóa động, fog, trạng thái động | AI |
| 10 | QA: validator, đường đi, collision, graph, save cũ, hiệu năng, ảnh capture | AI |
| 11 | Nghiệm thu nghệ thuật cuối | **Chủ** |

Ghi chú:

- Ảnh hint nên gồm: sơ đồ bố cục khu vực (vị trí starting/main/combat/landmark/reward/secret/exit, đường chính/phụ, vị trí lối ra ở mép khớp map liền kề), ảnh tham chiếu phong cách Sobi World, và tham chiếu tỉ lệ nhân vật. Có thể dùng bố cục ASCII M2 (`docs/maps/v2/`) làm khung tham khảo nhưng **không bắt buộc** giữ nguyên.
- Skill `image-to-prompt` (nếu có trong môi trường) có thể dùng để dựng prompt/manifest/hint, nhưng không được dẫn tới việc cắt nền thành tile ghép.
- Không có mạng: không cố tải thư viện hay gọi API ảnh.

---

## 13. Phạm vi pilot: M2 — Rừng Sâu

`map_forest_deep`: 64 × 36 ô, tile 40 px, tha hóa mặc định 18%, nằm trên tuyến rừng chính (M1 → M2 → M3, và có nhánh liên kết theo graph decision 043).

M2 dùng để thử: nền liên tục 3/4, camera ×1.5, khu vực khám phá + landmark, phân lớp Open/Dense/Special, cụm cây/props, foreground canopy + occlusion, Hidden Passage, collision theo footprint, tha hóa dạng lớp phủ.

**Không triển khai đồng loạt các map khác trước khi M2 được nghiệm thu.** Sau pilot, cập nhật quy chuẩn theo vấn đề thực tế rồi mới mở rộng.

---

## 14. Tiêu chí nghiệm thu

Nghiệm thu nghệ thuật cuối do **chủ dự án** quyết định qua ảnh capture. AI không tự chấm "đạt" các mục thị giác; AI liệt kê lỗi thị giác nó thấy và trình bày ảnh.

### Visual
- [ ] Góc nhìn 3/4 rõ và nhất quán.
- [ ] Terrain liền mạch, không seam, không lặp tile lộ rõ.
- [ ] Cao nguyên, vách, dốc, cầu, nước có chiều sâu hợp lý.
- [ ] Nền và asset cùng phối cảnh, scale, ánh sáng.
- [ ] Có landmark và nhịp điệu cảnh quan.

### Composition & exploration
- [ ] Khu vực khám phá có vai trò rõ.
- [ ] Có Open, Dense, Special Area.
- [ ] Đường chính dễ đọc.
- [ ] Có khoảng trống hợp lý; không bị tường địa hình bao kín.
- [ ] Combat area và điểm tương tác không bị props che.
- [ ] Đường phụ/bí mật có lý do tồn tại.

### Navigation & rendering
- [ ] Walkable/blocked khớp địa hình (đối chiếu overlay lưới).
- [ ] Collision theo footprint.
- [ ] Spawn và exits hoạt động, nối đúng map liền kề.
- [ ] Depth sorting và occlusion đúng.
- [ ] Hidden path hoạt động.
- [ ] Tha hóa (lớp phủ động), fog, rương, cổng, puzzle, tường giả hoạt động.

### Camera
- [ ] Mọi map dùng ×1.5; chụp kiểm tra toàn bộ map.
- [ ] Nhân vật và đối tượng quan trọng dễ nhận.
- [ ] Camera follow, biên map đúng.
- [ ] HUD không che khu vực gameplay quan trọng.

### Hiệu năng
- [ ] Kích thước texture trong giới hạn WebGL; AI nêu RAM/VRAM ước tính và thời gian tải của M2, có biện pháp chunk/nén hợp lý.

### Compatibility
- [ ] Map ID và object ID bảo toàn.
- [ ] Map Graph hợp lệ; `mapProblems()` sạch.
- [ ] Save cũ (bản sao) tải được, tiến trình giữ nguyên.
- [ ] Không thay đổi ngoài phạm vi đã phê duyệt.
- [ ] Formatter, typecheck, lint/test của dự án đều xanh.

---

## 15. Điều tuyệt đối không được làm

1. Không tự ý viết lại gameplay hoặc combat.
2. Không reset/xóa save.
3. Không đổi ID map/object đang được save tham chiếu.
4. Không đổi tọa độ logic chỉ để khớp hình nếu chưa có phương án tương thích.
5. Không quay lại cách cắt một bức tranh thành nhiều tile rời rồi ghép terrain.
6. Không đưa cây, rương, NPC, quái, UI, tha hóa vào ảnh nền nếu cần quản lý riêng.
7. Không để props rải ngẫu nhiên làm hỏng composition hoặc chặn đường.
8. Không chuyển sang isometric diamond grid.
9. Không triển khai các map khác trước khi M2 được duyệt.
10. Không tuyên bố hoàn thành khi thiếu ảnh capture, kết quả validator, kiểm thử save.
11. Không dùng ảnh placeholder rồi coi như xong; placeholder phải gắn nhãn rõ và chỉ để thử pipeline.
12. Không chuyển sang Lượt sau khi chưa được chủ dự án duyệt Lượt trước.
13. Không thêm thư viện nếu không thật cần (AGENT_RULES §3); `src/core/` giữ thuần.

---

## 16. Quyết định đã chốt (ưu tiên cao nhất)

1. **Ai tạo ảnh:** chủ dự án tự tạo ảnh bằng Gemini web (không API trả phí). Claude Code **không** tạo ảnh nền/props cuối cùng. Việc của Claude Code: tạo ảnh hint/guide và file `PROMPT` trong `art_inbox/.batch/<tên-batch>/` (ví dụ `adventure-15-m2-3q`), ghi rõ ảnh kết quả cần đặt vào đâu, tên gì, kích thước/tỉ lệ yêu cầu. Được dùng ảnh placeholder để thử pipeline, phải gắn nhãn placeholder, không tính là hoàn thành.
2. **Quy trình bố cục:** ảnh nền vẽ tự do → trải lên grid 40 px → AI đề xuất, chủ duyệt các ô walkable/blocked/elevation. Bố cục mặt bằng M2 **được phép khác bố cục cũ**. Khi đó: giữ ID, số lượng, loại, hành vi mọi đối tượng gameplay và đặt lại lên vùng đi được; **lối ra ở mép phải tương thích** `arriveX/arriveY` của các map liền kề (nếu dời lối ra thì cập nhật cả hai phía và chạy `mapGraph`).
3. **Độ phân giải, chunking, định dạng/nén:** AI tự quyết, miễn phù hợp giới hạn texture WebGL, RAM và các map/gameplay hiện tại. Phải tính lại px/ô nguồn thực sự cần khi zoom ×1.5 (Context ghi 80 px/ô cho ×2; có thể thấp hơn nay) và ghi quyết định + lý do. Cần tính tới việc Gemini xuất ảnh cỡ nhỏ: nêu rõ cách đạt độ phân giải mục tiêu (upscale, vẽ theo vùng có chồng lấn…) mà vẫn giữ nguyên tắc "một ảnh nguồn".
4. **Camera:** `fitZoom × 1.5` áp dụng toàn game, chụp kiểm tra mọi map. Map chưa chuyển đổi không cần làm đẹp lại.
5. **Schema dữ liệu:** AI tự quyết, theo nguyên tắc **chỉ thêm, không sửa**; tương thích save cũ; map chưa chuyển đổi vẫn chạy bằng renderer cũ (ví dụ map có trường cấu hình nền mới thì dùng nền liên tục, không có thì dùng renderer cũ); `terrain`/logic vẫn là nguồn sự thật cho va chạm.
6. **Tha hóa:** nền **không** chứa tha hóa. Tha hóa là lớp phủ/mask động riêng, đổi theo % và thanh tẩy.
7. **Các mục không nêu rõ** (style guide số liệu, pipeline props 3/4, ngân sách hiệu năng, công cụ authoring, cấu trúc thư mục): AI tự quyết, liệt kê trong kế hoạch Lượt 1 kèm lý do và rủi ro.

---

## 17. Chia lượt giao việc và điểm dừng

### Lượt 1 — Audit, kế hoạch, gói prompt Gemini → **DỪNG chờ duyệt**
- Đọc tài liệu và code (xem Phụ lục B), audit M2, chụp ảnh "before".
- Xác định nơi áp dụng `fitZoom × 2`.
- Kế hoạch: kiến trúc, schema đề xuất, danh sách file sẽ đổi, rủi ro, kiểm thử, hướng độ phân giải/chunking, Style Guide số liệu, danh sách props/landmark M2, danh sách ID/tọa độ/save cần bảo toàn.
- Tạo ảnh hint/guide + `PROMPT` cho nền M2 (và batch props), hướng dẫn cho chủ dự án.
- Chỉ được sửa code nếu thay đổi an toàn, không đổi hành vi (ví dụ công cụ chụp). **Chưa tích hợp nền, chưa đổi camera.**

### Lượt 2 — Tích hợp nền, camera, mask nav → **DỪNG chờ duyệt mask**
- Chủ đã đặt ảnh nền vào thư mục. Tích hợp nền liên tục + chunking.
- Camera ×1.5 toàn game, chụp kiểm tra mọi map.
- Trải lưới, xuất ảnh overlay, đề xuất mask walkable/blocked/elevation; đặt lại đối tượng gameplay (giữ ID).

### Lượt 3 — Props, render, tha hóa, QA, bàn giao
- Tích hợp props/landmark (sau khi chủ đã tạo), depth sort, occlusion, lớp tha hóa động, hidden passage.
- QA đầy đủ (mục 14), chụp ảnh toàn khu + player view ×1.5, so trước/sau.
- Báo cáo bàn giao (Phụ lục B, mục "Báo cáo").

---

## PHỤ LỤC A — Tóm tắt định hướng

Sobi Adventure dùng bản đồ 2D góc nhìn 3/4, camera ×1.5, nền terrain liên tục do chủ dự án tạo bằng Gemini (Claude Code chuẩn bị hint + prompt), navigation/collision tách khỏi ảnh và author trên lưới 40 px, asset theo Style Guide có số liệu, bố cục chia khu vực khám phá và mật độ có chủ đích, tha hóa là lớp động. Pilot M2 — Rừng Sâu. Bảo toàn gameplay, Map Graph, ID, save.

---

## PHỤ LỤC B — Khung công việc cho Claude Code

**Vai trò:** Senior Game Map Systems Engineer + 2D Environment Art Pipeline Engineer của dự án Sobi Adventure.

### Việc cần đọc trước khi làm (Lượt 1)
1. `SOBI_ADVENTURE_NEW_MAP_DIRECTION.md` (toàn bộ) và `Context.md`.
2. `AGENT_RULES`, `docs/decisions/043-adventure-world-map.md`, `045-adventure-map-v2.md`, `docs/WORLD_MAP_V2_PROPOSAL.md`, `src/areas/adventure/README.md`, `docs/maps/v2/README.md` và bố cục M2.
3. Code thực tế ở branch hiện tại: `content/adventure/maps.json`, `props.json`, `zones.json`; `logic/maps.ts`, `mapGraph.ts`, `fog.ts`, `foes.ts`; `scene/mapView.ts`, `mapGround.ts`, `mapCliffs.ts`, `mapDepth.ts`, `mapDepthKit.ts`, `mapCovers.ts`, `mapCorruption.ts`, `decals.ts`, `mapKit.ts`, `mapCamera.ts`; hệ save; `scripts/capture/adventureMaps.ts`; `tools/admin/adventure*.ts`; quy trình `npm run art:process` và manifest.

### Báo cáo cuối mỗi lượt gồm
- File đã đổi/tạo; kiến trúc/pipeline; cách nền liên tục được tích hợp; cách author navigation/collision; cách đặt asset và sort depth; nơi áp dụng camera ×1.5.
- Kết quả formatter/typecheck/lint/test, `mapProblems()`, `mapGraph`.
- Đường dẫn ảnh capture; kết quả kiểm thử save cũ.
- Quyết định tự quyết (mục 16.3, 16.5, 16.7) kèm lý do.
- Phần chưa xong, lý do, và đề xuất bước tiếp theo trước khi nhân rộng.
