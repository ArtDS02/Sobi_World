# ANIMATION REVIEW — Vòng 02

> round: 2 · runId: `20261104-161729-755dce5-36236937` · stamp `755dce5`/`36236937` · nhánh `phase-14-art` · 2026-11-04 · TD
> Tiêu chuẩn: rubric v1.1 (D-1 đã quyết: giữ nguyên) · Neo: `rounds/round-01/CALIBRATION.md` (không đổi)
> Cổng đầu vào: `complete:true`, stamp khớp `STATE.json`, determinism ✓, canary ✓, `anim:verify -- --manifest latest` xanh. Đã đọc `TESTER_NOTES.md` (cờ `DUPLICATE_SCRIPT` của status trong run này **không dùng**; tôi dùng chữ ký theo nội dung).
> Bằng chứng: `COMPARE.md` (cùng thư mục) + `capture/CAPTURE_MANIFEST.md`.

## 0. Phạm vi đã xem (vòng 1b gộp)
Xem trực tiếp: sheet tổng ultimate, status (trang 1–2: 12 trên 25 status × 3 pha), reaction, variant, skill (trang 3 = 24 skill); sheet case `ult_qt`, `ult_nh.reduce`, `status.atkDown.apply`; so sánh vòng 1→2 cho `skill_tg_steel_charge`. Cộng số đo [Auto] của cả 200 case (kể cả expire/loop mọi status). **Chưa xem**: skill trang 1–2, 4–5; status trang 3–4 (7 status debuff/buff còn lại và pha loop/expire của chúng); sheet từng case của 8 ultimate còn lại. Điểm dưới đây chỉ áp cho mẫu.

## 1. Bảng trạng thái lỗi
| ID | severity | status | since | case | tóm tắt |
|---|---|---|---|---|---|
| ANIM-120 | major | open | 2 | 25 `status.*.expire` | Pha "khi hết" có nhưng gần như **không nhìn thấy** (đổi 3.8–5.4% khung với buff/debuff) |
| ANIM-114 | major | open | 1 | `status.{atkDown…spdDown}.apply`, `defUp`/`mdefUp`, `matkUp`/`accUp` | (a) hình riêng của 7 debuff quá nhỏ/tối, không đọc được; (b) 2 cặp Up có `apply` y hệt, chỉ khác màu (xác nhận theo nội dung) |
| ANIM-112 | major | open (partial) | 1 | 12 `ult.*` | Đã có 4 kiểu cut-in và nhịp riêng; còn cùng chân dung và kiểu `ring` phủ phẳng toàn màn hình |
| ANIM-054 | minor | open | 0 | `status.wet.{loop,expire}` | Ướt: chỉ có huy hiệu giọt nước, sói không đổi nhìn thấy; expire không thấy |
| ANIM-123 | minor | open | 2 | họ skill hồi máu | `mend`, `healing_rain`, `purify`, `channel`, `undying` cùng một bộ hạt thập xanh + sao (C4) |
| ANIM-117 | minor | open | 1 | vòng phép | Phân biệt hệ chỉ bằng màu (Dev: wontfix vòng này) |
| ANIM-113 | minor | taste | 1 | ultimate/skill | Lấy đà ngoài 150–300 ms (nay 300–700 ms, có chủ đích) |
| ANIM-110 | — | **fixed** | 1 | `ult_qs/qt/mm` | hit-stop 220 ms ở cả 12 ultimate ([Auto]) |
| ANIM-111 | — | **fixed** | 1 | `variant.*.reduce` | Vòng tĩnh dưới người ra đòn và mục tiêu; `changedFrames` 1→4 và 1→8; thấy rõ ở sheet `ult_nh.reduce` |
| ANIM-119 (phần "có mặt") | — | fixed | 1 | 25 status | 25/25 có `expire` (nội dung); **độ rõ** chuyển sang ANIM-120 |
| ANIM-003, 051 | — | fixed | 0 | `freeze` | Khối băng → loop → vỡ, thấy đủ 3 pha (sheet tổng status trang 1) |
| ANIM-050, 052, 053, 055, 056 | — | fixed (một phần) | 0 | stun, poison, burn, disable, doom | Apply + loop thấy rõ (tint xanh độc, lửa cháy, vòng khóa, đồng hồ); expire thấy rõ ở poison/burn/disable/doom, **yếu ở stun** (→ ANIM-120) |
| ANIM-057 | — | fixed (một phần) | 0 | status | Huy hiệu trên đầu thấy ở poison/wet/disable/doom/…; HUD DOM chưa chụp |
| ANIM-008, 030–034 | — | fixed (một phần) | 0 | buff | Up: apply đọc được (atkUp: sao đỏ + vòng; defUp: vòm + vòng xanh); loop tinh tế; xem ANIM-114/120 |
| ANIM-060 … 071 | — | fixed (một phần) | 0 | 12 ultimate | 4 sheet đã xem (`nh`, `tg`, `qs`, `qt`) + sheet tổng 12: chủ đề riêng từng cái; 8 cái còn lại chưa xem sheet |
| ANIM-002, 010, 011, 080–082, 090–094, 100–107 | — | needs_evidence | 0 | — | Targeting, HUD, chỉ báo lượt, map, KO/phản ứng bị đánh: chưa chụp được hoặc chưa chụp đúng (xem §5) |
| ANIM-032 | — | open (Dev ghi chưa làm) | 0 | heal/cleanse/revive | Giữ nguyên |

## 2. Quyết định cần chủ dự án
**D-2 — Cut-in của ultimate: dùng chữ hay art?** Còn thiếu để ANIM-112 xong: mỗi ultimate cần *nhận diện riêng* trong cut-in (hiện đều là chân dung nhân vật). Hai hướng:
- (a) **Chữ**: hiển thị tên chiêu (`nameVi` lấy từ i18n, không cần art mới) và đổi kiểu `ring` để không phủ phẳng toàn màn hình. Làm được ngay trong GĐ14, không tốn art.
- (b) **Art**: biểu tượng/ký hiệu riêng cho từng ultimate (cần art, đi qua `docs/ASSET_TODO.md`).
**Quyết định của chủ dự án (2026-11-04): (a) — tên chiêu bằng chữ, không art mới.** ANIM-112 giữ nguyên hướng (a) ở §4.

## 3. Điểm theo rubric (mẫu đã xem; neo giữ nguyên)
| Nhóm / đơn vị | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Tổng | Mục tiêu | Ghi chú chính |
|---|---|---|---|---|---|---|---|---|---|---|
| Ultimate `nh` | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **72** | ≥ 90 | hit-stop 220 ✓; cut-in kiểu `ring` phủ phẳng teal (sheet tổng @1000) |
| Ultimate `tg` | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **72** | ≥ 90 | cut-in `bars` đọc rõ |
| Ultimate `qs` | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **72** (vòng 1: 67) | ≥ 90 | MUST-HAVE #4 đã đủ |
| Ultimate `qt` | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **72** | ≥ 90 | cut-in `ring` mờ nhạt (sheet t=1170) |
| Status điều kiện (poison, burn, freeze, disable, doom) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | **77** | ≥ 85 | 3 pha đều thấy; expire rõ |
| Status buff/debuff (atkUp, defUp, matkUp, mdefUp, accUp, 7 Down… đã xem 7) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | **60** | ≥ 85 | Up apply rõ, loop tinh tế, expire gần như không thấy; hai cặp Up trùng apply; Down tối/nhỏ |
| `reduce` (taunt, ult_nh) | 3 | 3 | — | 3 | 3 | 3 | 4 | — | — | C1 từ 1 → 3: đạt §10.4 |
Tổng hợp mẫu: Ultimate **72** (vòng 1: 70) — **dưới ≥ 90**; Status mẫu **~67** (vòng 1: 67) — **dưới ≥ 85**. MUST-HAVE: Ultimate #4 ✓ (đủ); #6 một phần; Status "đủ 3 pha" ✓ (nội dung) nhưng pha hết quá yếu. Quy tắc chặn §6 #2: buff/debuff có C1/C4 = 3 (không ≤ 2); expire của chúng thực tế C1 ≈ 2 → ANIM-120.
Skill thường / Buff skill / Cast / Reaction: chưa chấm điểm (chỉ có sheet tổng ở 1–2 trang): **nhận xét định tính** — 6 phản ứng nguyên tố đều có hình riêng (sét, hơi nước, lửa lan, băng vỡ, cột tinh khiết, quả cầu tối); skill khác nhau rõ về hình khối; lặp lại: hồi máu (ANIM-123) và vệt trăng khuyết dùng cho nhiều đòn chém (`vine_lash`, đòn thường, `elemental_rain`).

## 4. Việc cần sửa (Developer, vòng 3 là vòng cuối trước `escalated`)

### ANIM-120 — Pha "khi hết" gần như không nhìn thấy (MAJOR)
- **Rubric**: Status · C1 (25%) · MUST-HAVE "đủ 3 pha"; target C1 ≥ 4 cho expire.
- **Bằng chứng**: sheet tổng status trang 1–2: cột `.expire` (`atkUp`, `defUp`, `matkUp`, `mdefUp`, `accUp`, mọi `…Down`, `wet`, `stun`) ở khung đổi nhiều nhất không thấy gì ngoài vài hạt.
- **Số đo [Auto]** (`maxChangeVsStart`, tỉ lệ pixel đổi so với khung đầu): taunt 3.8%, spdUp 3.8%, accUp 3.9%, autoRevive 3.9%, atkDown 4.0%, spdDown 4.0%, evaDown 4.0%, accDown 4.1%, defDown 4.1%, regen 4.1%, mdefDown 4.2%, evaUp 4.2%, stun 4.3%, matkDown 4.4%, atkUp 4.5%, matkUp 4.6% … so với `burn` 15.7% và `doom` 20.4% (đã rõ).
- **Nguyên nhân (code)**: `content/adventure/battle_fx.json` → `statuses.<id>.expire` của buff/debuff chỉ là một `burst puff_rise` nhỏ (+ `move puff_up 1.06` cho 7 debuff).
- **Kỳ vọng**: expire đọc được như "hiệu ứng vừa tan": buff = aura/vòng thu lại và nổ ra khoảng 300 ms (ring `decal` co lại + hạt tản màu của chính status); debuff = khói tím tan + thân sáng lên trở lại (glow ngắn); stun = sao văng ra; wet = nước chảy/giọt rơi.
- **Tiêu chí đạt**: `status.*.expire` có `maxChangeVsStart ≥ 8%` (≥ 15% với stun, wet); TD thấy rõ ở khung đổi nhiều nhất của sheet tổng.
- **Ràng buộc**: ≤ 400 ms mỗi expire; màu theo `buffLanguage`; `reduce` không phát; không thêm event log; `buffLanguage.test.ts` xanh.

### ANIM-114 — Hình riêng của status chưa đọc được; hai cặp Up trùng apply (MAJOR)
- **Rubric**: Status · MUST-HAVE "các trạng thái khác có hình ảnh riêng, không dùng chung"; C4.
- **(a) 7 debuff Down**: sheet `status.atkDown.apply` t=530–800: hình riêng (thanh kiếm gãy) chỉ là một vệt tối ~20 px lúc t=650, lẫn trong vầng đòn thường (vệt trăng, bu-lông). Bảng sheet tổng (trang 2): `atkDown/defDown/matkDown/mdefDown` đều là vầng tím nhỏ quanh sói.
- **(b) Cặp Up**: theo nội dung `battle_fx.json`: `defUp` ≡ `mdefUp` và `matkUp` ≡ `accUp`: `apply` dùng cùng act (`decal ring`, `burst spark_rise`, `move puff_up`) và cùng hình, chỉ đổi màu; khác nhau chỉ ở `layers` duy trì (matkUp: vòng rune quay; accUp: tâm ngắm) và các layer này nhỏ. Nhận định "dương tính giả" ở vòng trước chỉ đúng với lab (skill mang nhiều status); ở mức nội dung hai cặp này **thật sự trùng apply**.
- **Kỳ vọng**: (a) hình riêng của Down to ≥ 0.45 (cùng đơn vị `size` hiện tại 0.3) và đủ tương phản (dùng viền sáng/đảo màu, không chỉ `#6b4a8a` đậm), rơi trong ~300 ms; (b) mỗi status Up có **hình** apply riêng: defUp = vòm/khiên kim loại, mdefUp = vòm ánh sáng/rune (hoặc ngược), matkUp = vòng rune xoay bay lên, accUp = tâm ngắm thu lại.
- **Tiêu chí đạt**: chữ ký apply (do + ref/img, bỏ màu) **không trùng** giữa bất kỳ hai status; TD che màu phân biệt được defUp/mdefUp và matkUp/accUp; hình riêng của mỗi Down nhìn thấy ở ô `impact+200` (không bị đòn che).
- **Ràng buộc**: debuff apply ≤ 400 ms; asset qua id → manifest; thiếu art thì dùng hình sẵn có và ghi `docs/ASSET_TODO.md`; test mở rộng kiểm chữ ký apply không trùng cho **mọi** status (hiện chỉ kiểm 7 Down).

### ANIM-112 — Cut-in: nhận diện riêng và không phủ phẳng màn hình (MAJOR, D-2 đã quyết: tên chiêu bằng chữ)
- **Rubric**: Ultimate · MUST-HAVE #6; C4.
- **Bằng chứng**: sheet tổng ultimate: `nh` (@1000) và `hk` (@1200) phủ toàn màn hình một màu phẳng; `qt` (sheet t=1170) vòng cut-in mờ gần như không đọc được; cả 12 vẫn cùng chân dung heo.
- **Số đo [Auto]**: nhịp 11 giá trị khác nhau ✓ (đã đạt phần "nhịp").
- **Kỳ vọng (theo D-2 đã quyết: chữ)**: cut-in hiện **tên chiêu** (chuỗi i18n); đổi `ring` thành vòng có mép sáng (không fill 0.85 phủ toàn màn hình, giữ nền còn thấy qua), và đảm bảo chân dung đủ tương phản ở cả 4 kiểu.
- **Tiêu chí đạt**: ô cut-in của 12 ultimate đặt cạnh nhau, TD phân biệt ≥ 10/12 **kể cả bỏ màu**; không kiểu nào che quá 70% sân.
- **Ràng buộc**: chữ qua `src/i18n/`; `reduce` giữ banner tĩnh, không chuyển động; không thêm asset ngoài kế hoạch.

### ANIM-054, ANIM-123 (MINOR) — tùy thời gian
- `wet`: loop phải thấy nước bám (tint xanh nhẹ + giọt rơi theo chu kỳ); expire: nước chảy xuống (rơi 3–4 giọt).
- Họ hồi máu: tách ít nhất 3 phong cách (mend = lá + dấu cộng; healing_rain = mưa giọt xanh; purify = vòng trắng quét + hạt bẩn bay đi) — `ANIM-123`.

## 5. needs_evidence / yêu cầu Tester
1. Biến thể `ko` và `win` chạy trên `skill_cl_taunt` (nhắm chính mình) nên **không thể hiện KO**: khung `ko` giống hệt `crit`. Chụp lại trên một skill gây sát thương (và `crit` trên skill sát thương).
2. TD chưa xem được: sheet từng case của 8 ultimate còn lại và status trang 3–4 — không phải thiếu chụp, chỉ chưa kịp xem; sẽ xem ở vòng 3.
3. Vẫn chưa chụp: map, targeting, chỉ báo lượt, HUD (`suitesNotBuilt`).
4. Đo `OVERFLOW` và kiểm tra nhấp nháy bằng pixel (`flashesPerSec` hiện chỉ đọc từ script).

## 6. Hồi quy & nhất quán
Không thấy hồi quy ở ultimate (letterbox vào/ra, cut-in, hit-stop còn); `reduce` không còn trống. Nhất quán: nhịp ultimate nay khác nhau (tốt); nhưng 12 cut-in vẫn mở đầu giống nhau về nội dung (ANIM-112).

## 7. Danh sách cần chủ dự án playtest (rubric §7)
| Đơn vị | Tiêu chí | Câu hỏi |
|---|---|---|
| ultimate | C2, C5 | Nhịp mới (lấy đà 0,3–0,7 s, vòng phép 0,4–1,0 s) có phân biệt được giữa các chiêu và có thấy "nặng tay" khi trúng (đứng hình 220 ms)? |
| `reduce` | C1 | Bật giảm chuyển động, vòng tĩnh dưới người ra đòn và mục tiêu đã đủ để biết ai đánh ai chưa? |
| status | C1 | Hiệu ứng "hết" của buff/debuff (sau khi ANIM-120 sửa) có thấy được khi đang chơi? |

## 8. Phán quyết
**`needs_fix`**: 3 major `open` (ANIM-112, 114, 120), 0 blocker; round 2/3. Còn một vòng sửa: nếu sau vòng 3 còn blocker/major → `escalated` cho chủ dự án. D-2 đã quyết (chữ). Điểm nhóm vẫn dưới mục tiêu (Ultimate 72/90, Status 67/85): đạt các tiêu chí trên chỉ đưa Status lên khoảng 75–80; để lên ≥ 85/90 cần cải thiện C5 (tác động lên mục tiêu) và C2 của ultimate — **cần playtest của chủ dự án** trước khi đặt tiêu chí cụ thể cho C2/C5.
