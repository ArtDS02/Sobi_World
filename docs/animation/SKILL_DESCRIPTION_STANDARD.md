# Chuẩn mô tả skill và "hợp đồng nhìn thấy"

**Ngày:** 2026-11-12. Dùng cho: viết `descVi` của skill mới, và làm animation / VFX cho mọi skill (cũ và mới).
Nguồn dữ liệu: `content/adventure/skills.json` (mô tả, số), `battle_fx.json` (kịch bản), `elements.json` + `battle_fx.json.elements` (màu, hình đạn).
Thư viện sâu hơn từng hệ: `docs/animation/library/bibles/elements/<HỆ>.md`; chuẩn bậc lực và nhịp: `docs/animation/library/STANDARDS.md`.

## 1. Vì sao cần chuẩn này
Chủ dự án thấy animation "chưa đúng mô tả". Nguyên nhân gốc: `descVi` chỉ là một câu ngắn cho người chơi, còn animation cần biết **chính xác cái gì phải nhìn thấy, theo thứ tự nào, bao nhiêu**. Chuẩn này nối hai thứ:
1. `descVi` được viết theo khuôn để mọi danh từ, động từ, con số trong đó đều đọc ra được thành một thứ trên màn hình.
2. Mỗi skill có một **hợp đồng nhìn thấy** (mục 6): danh sách "phải thấy", "không được", nhịp, và cách kiểm. Hợp đồng nằm trong file kịch bản của skill (`docs/animation/library/scenarios/skills/<id>.md`).

Quy tắc vàng: **không có gì trong `descVi` mà người chơi không nhìn thấy; không có gì trên màn hình mà `descVi` không nói** (trừ trang trí nhỏ của hệ).

## 2. Khuôn viết `descVi`
Một câu, 10–24 từ, tiếng Việt, hiện tại, không dấu chấm than.

`[Hình thức + chất liệu]` + `[đích]` + (`[hiệu ứng phụ có số]`)

- Tuyệt kỹ mở đầu bằng "Tuyệt kỹ:".
- Hiệu ứng phụ có xác suất viết số rõ: "30% làm choáng", "dễ làm … " (dễ = chance ≥ 0,6), "có thể …" (0,25–0,59), "40% gây Bỏng".
- Đích dùng đúng cụm: "một kẻ địch", "mọi kẻ địch", "kẻ địch ngẫu nhiên", "một đồng đội", "cả đội", "bản thân".
- Số lần: "ba tia", "bốn mũi" phải **bằng đúng `hits`** (Chuỗi Sét: `hits 3` → đúng ba tia). Không viết số mà dữ liệu không có.
- Không tên riêng của bên thứ ba, không tên chiêu của game khác (luật bản quyền, decision 048). Dùng chất liệu và hình khối của dự án (bong bóng, lồng đèn, mai núi, lưới đêm…).
- Trạng thái viết đúng tên hiển thị trong game: Ướt, Chậm, Bỏng, Trúng độc, Đóng băng, Choáng, Phong ấn, Diệt vong, Giảm/Tăng công, thủ, thủ phép, chính xác, né, tốc độ; Hồi phục (regen), Bất khuất (autoRevive), khiên, khiêu khích.

### Bảng động từ → hình phải thấy
| Động từ trong mô tả | Hình phải thấy | Ghi chú |
|---|---|---|
| Bắn, phóng, ném | vật rời tay người tung, bay (cung hoặc thẳng) tới đích, va chạm | có điểm xuất phát, đường đi, điểm trúng |
| Phun | luồng / nón hạt từ miệng hoặc tay, rộng dần | không phải một viên |
| Giáng, rơi, dội | vật hoặc lực từ **trên cao** xuống | có bóng báo trước trên đất nếu vật lớn |
| Quất, chém, vuốt, húc, cắn | hình sắc theo cung ở **đích**, người tung lao tới | cận chiến: Prep → Exec → Impact → Recovery |
| Nện, đập | vật nặng giáng xuống, đất lún, bụi | hit-stop ngắn |
| Phủ, bao, quấn | thứ gì đó **che hoặc quấn từng mục tiêu**, không chỉ nổ ở một điểm | "mọi kẻ địch" = mỗi con một hình riêng |
| Xoáy, cuốn | chuyển động quay hút vào | có tâm, có hướng quay |
| Dâng, trồi, mọc | từ **dưới đất** lên | có khe nứt hoặc gợn báo trước |
| Tụ, hút | hạt bay **vào** người tung trước khi bắn | giai đoạn Startup |
| Hồi, chữa | thứ nhẹ, ấm, bay **lên** từ mục tiêu | màu xanh lá hoặc theo hệ; không rung màn |
| Tăng, nâng | mũi tên / cột sáng đi lên quanh người, màu theo chỉ số | công cam, thủ xanh, tốc độ vàng, né ngọc, phép tím, chính xác trắng |
| Giảm, làm yếu | thứ **đi xuống**, sẫm, quấn vào mục tiêu | màu tối hơn, hạt rơi |
| Xóa, thanh tẩy | làn sáng quét qua, hạt trắng bốc lên, vòng sạch | không có vụ nổ |
| Khiên, che | vòm hoặc tấm khép quanh người, có vân | khép trong ≤ 400 ms |
| Khiêu khích | dấu hiệu hướng về người tung (quầng, vòng thu hút) | địch nhìn về phía người tung |

### Con số → quy tắc hình
- `hits = n` → đúng n nhịp trúng, nhịp cuối mạnh nhất (1-2-…-BỤP).
- `target allEnemies` → **mỗi kẻ địch** có điểm trúng riêng (lệch nhau 80–160 ms), không chỉ một vụ nổ ở giữa.
- `target randomEnemies` → các nhịp rơi lên các con khác nhau, không dự đoán được thứ tự.
- `heal x %`, `shield x %` → có vật thể tương ứng (dấu cộng bay lên, vòm khiên); số lớn thì to hơn, không đổi hình.
- `chance` → **skill không vẽ kết quả của xác suất.** Bọc băng, bỏng, choáng, Phong ấn do trạng thái tự vẽ khi thật sự trúng (kịch bản trạng thái ở `battle_fx.json.statuses`). Skill chỉ vẽ phần **chắc chắn xảy ra** (hơi lạnh, ngọn lửa, cú đánh). Xem phát hiện ở `docs/animation/SKILL_REVIEW.md`.
- `turns n` → không hiện số lượt; huy hiệu trạng thái trên đầu lo phần đó.
- `power` → bậc lực T0–T4: quyết định `stop`, `shake`, `flash` (bảng ở `STANDARDS.md` §4). Không dùng hit-stop heavy cho T1–T2.

## 3. Chuẩn từng hệ
Màu lấy từ `battle_fx.json.elements` (cột `color`, `glow`). Mỗi hệ có **một ý hình chủ đạo** và **một thứ cấm**, để hai hệ không nhìn giống nhau khi bỏ màu.

| Hệ | color / glow | Tính cách | Hình khối | Động từ chuyển động | Âm | Cấm |
|---|---|---|---|---|---|---|
| NƯỚC (WATER) | `#3fb2ff` / `#d8f4ff` | nặng, chảy, đàn hồi, trong | giọt, bong bóng có viền cầu vồng, sóng cuộn có bọt, xoáy | dâng, chảy, vỡ ra, bắn tung, cuốn | ùng ục, ào, tí tách | hạt nhỏ phát sáng giống ánh sáng; nước đứng yên như thủy tinh |
| LỬA (FIRE) | `#ff7a2a` / `#ffd36a` | nhẹ, bốc lên, đói, không giữ hình | lưỡi giọt ngược, tàn, dung nham đặc, búa nung đỏ | bén, liếm, bốc, nổ, tàn bay **lên** | phụt, lách tách, ầm | lửa đứng yên trong một ảnh; mọi thứ rơi xuống (trừ dung nham, thiên thạch) |
| THIÊN NHIÊN (NATURE) | `#5cc24e` / `#d6ffa8` | mọc, uốn, mềm rồi bật | dây leo, rễ xoắn, gai, lá, hoa nở, bào tử | mọc, quấn, nở, rắc, bật | sột soạt, rắc | cứng như kim loại; thẳng tắp |
| ĐẤT (EARTH) | `#c08a50` / `#f6deb0` | nặng, chậm, chắc | tảng, mũi đá, nắm đấm đá, vết nứt, bụi | nện, trồi, lún, vỡ, lăn | uỵch, ầm trầm | nhẹ, lơ lửng; hạt phát sáng |
| KIM (METAL) | `#cfd9e6` / `#ffffff` | sắc, lạnh, chính xác, vang | lưỡi, giáp, chông, khiên, bánh | chém, đâm, vỡ mảnh, vang, bật | keng, soảng | mềm, bầu; mờ nhòe |
| SẤM (LIGHTNING) | `#ffe14a` / `#fffbd0` | nhanh, không có hình cố định, giật | tia gấp khúc, quả cầu điện, mây giông, vòng điện | nháy, giật, nhảy, lan | rè, đì đùng | đường cong mượt (tia phải **gấp khúc**); chuyển động chậm đều |
| BÓNG TỐI (DARK) | `#7a4ed0` / `#d9b8ff` | chậm, nuốt ánh sáng, mơ hồ | khói, mực, lưới, mặt nạ, mắt, xúc tu | nuốt, trườn, phủ, hút xuống | thì thầm, ù | sáng chói; nét cứng |
| ÁNH SÁNG (LIGHT) | `#ffe98a` / `#ffffff` | sạch, ấm, thẳng, dịu | tia, vòng hào quang, lồng đèn, sao, cột sáng | rọi, tỏa, nở, bay lên | chuông nhỏ, ngân | khói, vết bẩn; chuyển động giật |
| HƯ KHÔNG (VOID) | `#8c7cff` / `#e4dcff` | lạ, trống rỗng, vặn không gian | vòng, khe nứt, lõi đen, chuông trời sao, mảnh vỡ trôi | hút, vặn, tách màu, vỡ ra rồi lặng | ù trầm, ngân dài | màu nào khác tím lam; vật liệu "thật" như gỗ, đá |
| KHÔNG HỆ / SELF (NEUTRAL) | `#ffe7b0` / `#ffffff` | hỗ trợ, class: **tham số hóa theo màu** | vòm, chevron, dấu cộng, cung chém, sao | khép, leo, bay lên, chém | chime, whoosh | giống hệt nhau cho mọi hệ: phải đổi màu theo `$color` của người tung |

Hỗ trợ không hệ (hồi, tăng, khiên, thanh tẩy): luôn **nhẹ, ấm, đi lên**, không rung màn (T0). Màu theo mục đích, bảng ở §4.

### Mỗi hệ: bộ skill nên có (để thiếu thì xem `NEW_SKILLS_PROPOSAL.md`)
Mỗi dòng (lineage) có 4 Unique + 1 Ultimate; quân địch của hệ có ≥ 3 skill. Bộ cân đối: **1 đòn nhanh** (power 1,2–1,4, MP 8) · **1 đòn diện rộng** (0,8–1,1, MP 22–28, hồi chiêu 3) · **1 đòn nặng** (2,2–2,3, MP 28) · **1 hỗ trợ** · **1 tuyệt kỹ**. Số hiện tại: WATER 6, FIRE 10, NATURE 7, EARTH 5, METAL 6, LIGHTNING 7, DARK 7, **LIGHT 3**, **VOID 4** (kể cả skill quái).

## 4. Từ khóa trạng thái → ai vẽ
Skill **không** tự vẽ các thứ ở cột "Trạng thái vẽ". Nếu thấy skill vẽ chúng, đó là lỗi lặp.

| Trạng thái | Trạng thái vẽ (huy hiệu / hiệu ứng áp dụng) | Màu hỗ trợ dùng khi skill cho trạng thái đó |
|---|---|---|
| burn | lửa liếm thân, khói nhỏ | — |
| poison | bong bóng tím nổi lên, thân ngả xanh | — |
| wet | giọt chảy, thân bóng | xanh nước |
| freeze | bọc băng cả thân (`fx_ice_encase`), thân đứng yên | — |
| stun | sao quay trên đầu | — |
| disable (Phong ấn) | khóa rune trên đầu | tím nhạt |
| doom | dấu đếm ngược | tím sẫm |
| atkUp / atkDown | mũi tên lên / xuống đỏ cam | cam `#ff7a3a` |
| defUp / defDown, mdefUp / mdefDown | khiên nhỏ / vỡ | xanh thép `#9ab8ff` |
| matkUp / matkDown | tím | tím `#b06aff` |
| accUp / accDown | tâm ngắm trắng / mờ | trắng vàng `#fff0a0` |
| evaUp / evaDown | gió ngọc / nặng | ngọc `#5ae0c8` |
| spdUp / spdDown | vệt gió vàng / dây nặng | vàng `#ffe25a` |
| shield | vòm quanh thân | vàng nhạt `#ffd66a` |
| taunt | quầng cam hướng về người khiêu khích | cam `#ffa040` |
| regen | dấu cộng nhỏ nhấp nháy | xanh lá `#7ccf5a` |
| autoRevive (Bất khuất) | cánh sáng / vầng sau lưng | vàng `#fff0a0` |

## 5. Âm thanh và nhịp (nhắc ngắn)
Thời lượng theo loại (x1): đánh thường 600–900 ms · skill T1–T2 900–1500 · T3 1200–1800 · tuyệt kỹ 2800–3500 (trần 3500, test `battleFxContent` giữ). Hit-stop: light 50 · medium 80 · heavy 120 (chỉ crit / ultimate) · ultimate 220. Chi tiết: `STANDARDS.md` §4–§5.

## 6. Hợp đồng nhìn thấy (đặt ở đầu mỗi kịch bản skill)
```
Skill: <id> — <nameVi>   Hệ: …   Bậc: T?   Đích: …   Kết thúc: … ms
descVi: "<nguyên văn>"
PHẢI THẤY (đánh số, theo thứ tự thời gian, mỗi mục kiểm được trên ảnh):
  1. …
KHÔNG ĐƯỢC (lỗi nếu thấy):
  - vẽ kết quả của xác suất (bọc băng, bỏng…) trong skill
  - …
NHỊP (ms từ đầu act):  Prep a–b · Startup … · Execution … · Travel … · IMPACT t · Aftermath …
HÌNH CHỦ ĐẠO: <vật lớn nhất> — 2/3 dấu hiệu sống: biến hình / hạt sinh từ chính nó / biến dạng theo vận tốc
KIỂM: các mốc chụp (ms) + điều phải thấy ở mỗi mốc;  FPS mục tiêu ≥ 50 trên RTX 3050
```
### Ví dụ đã điền: `skill_ult_trident` — Đinh Ba Hải Vương
- descVi: "Tuyệt kỹ: đinh ba triệu sóng đánh mọi kẻ địch, làm Ướt và 30% làm choáng." Bậc T4, đích allEnemies.
- PHẢI THẤY: (1) cut-in xanh nước; (2) nước từ trời tụ lại thành **một cây đinh ba** to hơn người; (3) đinh ba **rơi** và cắm xuống giữa hàng địch đúng nhịp impact; (4) từ chỗ cắm **nhiều lớp sóng** (≥ 3) lan ra, mỗi lớp cao và rộng hơn, **quét qua từng kẻ địch** (mỗi con bị một đợt, lệch ≥ 80 ms); (5) tung bọt và nước bắn; (6) dư âm: gợn nước và vũng tan dần.
- KHÔNG ĐƯỢC: vẽ choáng (do trạng thái); vẽ Ướt như một vụ nổ riêng (huy hiệu Ướt lo); sóng chỉ là một vòng phẳng.
- NHỊP: Prep 0–450 · Startup (tụ nước) 450–1000 · Travel (rơi) 1000–1100 · IMPACT 1100 + hit-stop ultimate 220 · sóng 1100–2400 · Aftermath 2400–3200.
- KIỂM: 1000 ms thấy đinh ba hoàn chỉnh trên đầu; 1250 ms thấy ≥ 2 lớp sóng; 1900 ms thấy sóng ở ít nhất hai kẻ địch khác nhau.

## 7. Danh sách kiểm một skill (trước khi báo xong)
1. Mọi động từ và con số trong `descVi` có một mục "PHẢI THẤY" tương ứng.
2. Nhịp trúng khớp `timing.impact` (lệch ≤ 40 ms), tổng không quá `timing.end` và trần 3500 cho tuyệt kỹ.
3. Đích đúng: một / mọi / ngẫu nhiên; mỗi mục tiêu có hình riêng.
4. Bậc lực đúng (rung, chớp, hit-stop không vượt bảng).
5. Không vẽ lại phần của trạng thái.
6. Bỏ màu vẫn nhận ra hệ (so với hệ khác cùng loại đòn).
7. Hình chủ đạo đạt ≥ 2/3 dấu hiệu sống; bật `Giảm chuyển động` thì không chớp mạnh, không rung.
8. Ảnh chụp ở cỡ đầy đủ tại các mốc trong "KIỂM"; ghi FPS.
