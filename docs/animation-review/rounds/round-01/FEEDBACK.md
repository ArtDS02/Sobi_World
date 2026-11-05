# ANIMATION REVIEW — Vòng 01

> round: 1 · runId: `20261104-152903-755dce5-f5ba39e3` · stamp: `755dce5`/`f5ba39e3` · nhánh `phase-14-art` · ngày: 2026-11-04 · Người review: Technical Director
> Tiêu chuẩn: `docs/animation-review/ANIMATION_QUALITY_RUBRIC.md` v1.1 · Bằng chứng: `docs/animation-review/capture/CAPTURE_MANIFEST.md`
> Đầu vào đã qua cổng: manifest `complete:true`, run khớp `STATE.json`, determinism ✓ (0 px), canary ✓, `anim:verify -- --manifest latest` xanh.
> Chưa có bằng chứng hình cho: di chuyển map, targeting, chỉ báo lượt, HUD (`suitesNotBuilt`).
> Hiệu chuẩn neo: `rounds/round-01/CALIBRATION.md`.

## 0. Phạm vi thực sự đã xem (đọc trước)
Run có **149 case**; vòng này TD **chưa xem hết**. Đã xem trực tiếp: 3 sheet tổng (ultimate, status, skill trang 1), sheet từng case `ult_nh`, `ult_tg`, `ult_qs`, `status.freeze`, `status.stun`, `variant.taunt.reduce`; còn lại chỉ dựa [Auto] (bảng số đo + cờ) trong manifest. Mọi điểm dưới đây chỉ áp cho **mẫu đã xem**; nhóm chưa xem để `needs_evidence`, **không** suy rộng. Đề nghị vòng 1b (TD xem tiếp skill/buff/reaction/KO/win) có thể chạy song song với lượt sửa của Developer vì các lỗi bên dưới đã đủ rõ để sửa.

## 1. Bảng trạng thái lỗi
| ID | severity | status | since | case | tóm tắt |
|---|---|---|---|---|---|
| ANIM-110 | blocker | open | 1 | `battle.ult.skill_ult_{qs,qt,mm}` | 3 ultimate buff không có hit-stop (MUST-HAVE Ultimate #4) — chủ dự án đã quyết giữ rubric (đã quyết: giữ rubric, §2) |
| ANIM-111 | major | open | 1 | `battle.variant.*.reduce` | Chế độ `reduce` làm mất gần như mọi tín hiệu (C1 = 1); rubric §10.4 |
| ANIM-112 | major | open | 1 | 12 ultimate | Cả 12 ultimate cùng nhịp (500 ms lấy đà, vòng 820 ms) và cùng khung cut-in (MUST-HAVE Ultimate #6, C2/C4) |
| ANIM-114 | major | open | 1 | `battle.status.{atkDown,matkDown,matkUp,accUp}.apply` | 2 cặp status có cấu trúc script y hệt (MUST-HAVE Status "không dùng chung") |
| ANIM-119 | major | open | 1 | 7 debuff `…Down` | 7 debuff không có `expire` → thiếu pha "khi hết" (MUST-HAVE Status) |
| ANIM-117 | minor | open | 1 | vòng phép | Vòng phép phân biệt hệ chỉ bằng màu, chưa bằng hình (C4) |
| ANIM-113 | minor | taste | 1 | ultimate / skill | Lấy đà 500 ms (ult) và 300 ms (nhiều skill) vượt khoảng tham khảo 150–300 ms |
| ANIM-001 | — | **fixed** | 0 | mọi case có phép | Vòng phép hiện ra: `ult_nh/tg/qs`, `freeze`, `stun` (ô `t=200`–`820`) |
| ANIM-003 | — | **fixed** | 0 | `freeze`, `stun` | Có diff "hết hiệu lực": băng vỡ bay ra, sao tản (ô `t=0`–`200`; xem §4 về lý do thấy được) |
| ANIM-004 | — | fixed (một phần) | 0 | ultimate, skill | Hit-stop theo tầng có (50/80/120/220), letterbox có; ngoại lệ ANIM-110 |
| ANIM-009 | — | fixed (một phần) | 0 | `ult_nh/tg/qs` | Intro (cut-in+dim+letterbox), nhiều lớp (9–11), outro có; ngoại lệ ANIM-110/112 |
| ANIM-022 | — | fixed (một phần) | 0 | vòng phép | 2 vòng quay ngược, màu theo hệ; chưa phân biệt bằng hình → ANIM-117 |
| ANIM-040 | — | fixed (một phần) | 0 | `ult_nh`, `skill_nh_tsunami` | Sóng cuộn có bọt/ribbon thấy trong sheet tổng và `ult_nh` |
| ANIM-051 | — | fixed | 0 | `freeze` | Khối băng bọc, vỡ băng khi hết (ô `t=1340`–`1910`, `t=0`–`200`) |
| ANIM-050 | — | fixed (một phần) | 0 | `stun` | Sao xoay trên đầu (ô `t=0`), tản khi hết; chưa thấy "biểu cảm choáng" (needs_evidence) |
| ANIM-060 … 071 | — | needs_evidence | 0 | 9 ultimate còn lại | Chỉ có khung `impact` ở sheet tổng; hình ảnh có vẻ riêng từng cái nhưng chưa xem sheet từng case |
| ANIM-002, 010, 011, 057, 080–082, 090–094 | — | needs_evidence | 0 | — | Targeting, HUD, chỉ báo lượt, map: harness chưa chụp được |
| ANIM-008, 030–034, 041–043, 052–056, 058, 100–107 | — | needs_evidence | 0 | buff/skill/status/KO | Chưa xem sheet; chỉ có [Auto] (xem ANIM-114) |
| ANIM-032 | — | open (Dev tự ghi chưa làm) | 0 | heal/cleanse/revive | Giữ nguyên; chưa có bằng chứng hình để đánh giá thêm |

severity theo rubric §10.2 (Thiếu MUST-HAVE Ultimate → blocker; thiếu MUST-HAVE nhóm khác / tiêu chí ≤ 2 → major).

## 2. Quyết định cần chủ dự án (rubric)
**D-1 — Ultimate hỗ trợ có cần hit-stop không?** `skill_ult_qs`, `skill_ult_qt`, `skill_ult_mm` là ultimate buff đồng đội (không gây đòn lên kẻ địch trong lab). Rubric v1.1 §4 đòi *mọi* ultimate có hit-stop mạnh hơn skill thường. Hai hướng:
- (a) Giữ nguyên rubric: thêm "khoảnh khắc nhấn" tại `impact` (≥150 ms đứng hình/flash) cho 3 ultimate này → ANIM-110 xử lý.
- (b) Sửa rubric: ultimate hỗ trợ được **thay** hit-stop bằng "nhấn bắt buộc" (freeze nhẹ ≥100 ms **hoặc** flash + zoom punch tại điểm bùng buff). (b) không được chọn.
**Quyết định của chủ dự án (2026-11-04): (a) — giữ rubric.** ANIM-110 giữ `blocker`, Developer thêm hit-stop cho 3 ultimate buff.

## 3. Điểm theo rubric (mẫu đã xem)
### 3.1 Tổng hợp (rubric §9) — chỉ phần có bằng chứng
| Nhóm | Số đơn vị chấm (đã xem/tổng) | Điểm TB mẫu | Xếp loại | Mục tiêu §6 | Đạt? |
|---|---|---|---|---|---|
| Ultimate | 3/12 (`nh`, `tg`, `qs`) | 70 | Đạt (phải cải thiện) | ≥ 90 | **Không** |
| Status | 2/25 (`freeze`, `stun`) | 67 | Đạt (phải cải thiện) | ≥ 85 | **Không** |
| Variant `reduce` | 2/2 | — (C1 = 1) | Không đạt | — | **Không** |
| Skill thường / Buff / Cast / Khác | 0 | chưa chấm | — | ≥ 85 / 80 / 85 / 80 | chưa có bằng chứng |
| Targeting / HUD / Map | 0 | chưa chấm | — | — | chưa chụp |

### 3.2 Bảng đơn vị chấm (bảng rút gọn §10.7 cho ultimate/status đã xem)
| Đơn vị | C1 | C2 | C3 | C4 | C5 | C6 | C7 | Tổng | Loại | Bằng chứng chính | MUST-HAVE thiếu |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `ult_nh` (Ult) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 72 | Đạt | [Hình] sheet `ult_nh` t=2104–2320; [Auto] hit-stop 220, anticipation 500, 11 lớp | #6 một phần (khung cut-in dùng chung → ANIM-112) |
| `ult_tg` (Ult) | 4 | 3 | 4 | 4 | 3 | 4 | 4 | 72 | Đạt | [Hình] sheet `ult_tg` t=2100–3200 (kỵ sĩ đồng, bu-lông); [Auto] hit-stop 220 | #6 một phần |
| `ult_qs` (Ult buff) | 4 | 3 | 4 | 4 | 2 | 4 | 4 | 67 | Đạt | [Hình] sheet `ult_qs` t=2350–3200 (vỏ rùa, dấu cộng); [Auto] hit-stop = null | #4 hit-stop (ANIM-110), #6 một phần |
| `status.freeze` | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 73 | Đạt | [Hình] sheet `freeze` t=1340–1910 và t=0–200 | pha loop chưa chụp có chủ ý (§4) |
| `status.stun` | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 60 | Không đạt | [Hình] sheet `stun` t=0, 1400–1760 | "biểu cảm choáng" chưa thấy; dùng chung hình khối đá/sao |
Quy tắc chặn: không đơn vị nào vi phạm §6 #2 (≤2) ngoài `ult_qs` C5 = 2 (ANIM-110). Ultimate chưa đạt §6 #3 (≥ 90).

Công thức mẫu (`ult_nh`): 4/5·10 + 3/5·15 + 4/5·20 + 4/5·15 + 3/5·25 + 4/5·10 + 4/5·5 = 8+9+16+12+15+8+4 = **72**.
C2 và C5 của ultimate **chưa chốt**: cần [Playtest] (§7) → xem §7.

## 4. Việc cần sửa (Developer)

### ANIM-110 — Ultimate buff không có "khoảnh khắc nhấn" (BLOCKER, D-1 đã quyết: giữ rubric)
- **Rubric**: Ultimate · MUST-HAVE #4 · C5 hiện 2 → mục tiêu ≥ 4.
- **Case & bằng chứng**: `battle.ult.skill_ult_qs`, `…_qt`, `…_mm` · `docs/animation-review/capture/runs/20261104-152903-755dce5-f5ba39e3/sheets/battle.ult.skill_ult_qs.png` ô `impact`/`impact+80`.
- **Số đo [Auto]**: `hitStopMs = null` cho 3 case này; 9 ultimate còn lại = 220 ms.
- **Quan sát**: lúc `impact` không đứng hình, không rung; vỏ rùa và dấu cộng bật ra nhẹ nhàng, cảm giác "buff thường", không phải đòn tối thượng.
- **Nguyên nhân (code)**: script của 3 skill trong `content/adventure/battle_fx.json` (`skills.skill_ult_qs|qt|mm`) không có act `stop` (tier `ultimate`); đối chiếu 9 ultimate còn lại có.
- **Kỳ vọng**: theo D-1(a): thêm act `stop` tier `ultimate` (hoặc tier `heavy` + `punch`) tại điểm bùng buff, kèm `shake` nhẹ hướng vào đội mình.
- **Tiêu chí đạt**: manifest `hitStopMs ≥ 150` cho 3 case; ô `impact-1f` và `impact` hai khung giống nhau (đứng hình).
- **Ràng buộc**: `reduce` vẫn bỏ shake/flash; không đổi logic trận.

### ANIM-111 — `reduce` làm mất mọi tín hiệu (MAJOR)
- **Rubric**: §10.4 (C1 ≥ 3 khi `reduce`), C7 ≤ 3 nếu thiếu.
- **Case & bằng chứng**: `battle.variant.skill_cl_taunt.reduce`, `battle.variant.skill_ult_nh.reduce` · sheet `variant.skill_cl_taunt.reduce` ô `t=0`–`impact`.
- **Số đo [Auto]**: `changedFrames` = 1/13 (taunt), 1/28 (ult_nh); `layerClasses` = 0.
- **Quan sát**: với `reduce`, ultimate Nam Hải (4,1 s) gần như không hiện gì: không vòng phép, không người ra đòn nào nhúc nhích, không cut-in; taunt chỉ có hai huy hiệu nhỏ sau `impact`. Người chơi bật `reduce` không biết ai ra đòn và lên ai.
- **Nguyên nhân (code)**: `ui/battlePlan.ts::stepPlan(…, reduce)` giữ lại chỉ cue `sound` khi `reduce` (xem mô tả hàm: "`reduce` keeps only the sounds").
- **Kỳ vọng**: `reduce` bỏ **chuyển động/chớp/rung/zoom**, nhưng giữ tín hiệu tĩnh: (1) viền sáng (không nhấp nháy) quanh người ra đòn trong lúc lấy đà; (2) vòng/đệm màu hệ fade-in/out tại mục tiêu lúc `impact`; (3) tên chiêu hiện bằng banner tĩnh với ultimate (không letterbox kéo, không zoom); (4) số sát thương/hồi vẫn đúng nhịp.
- **Tiêu chí đạt**: `changedFrames` ≥ 4 cho cả 2 case; không có cue `shake|flash|punch|slowmo`; TD nhìn ô `impact` thấy rõ mục tiêu bị nhắm tới.
- **Ràng buộc**: không thêm chuyển động nhanh; giữ test `reduce` hiện có; chuỗi hiển thị qua `src/i18n/`.

### ANIM-112 — 12 ultimate cùng nhịp và cùng khung cut-in (MAJOR)
- **Rubric**: Ultimate · MUST-HAVE #6 ("kịch bản riêng, không tái dùng khung"), C2, C4.
- **Case & bằng chứng**: 12 case `battle.ult.*`; sheets `ult_nh`, `ult_tg`, `ult_qs` ô `release-50` (cut-in) và ô `cast` (vòng phép).
- **Số đo [Auto]**: `anticipationMs` = **500** ở cả 12; `circleMs` = 820 ở cả 12; `durationMs` 3920–4320 (chênh ≤ 10%); cut-in xuất hiện cùng `t=1270` (release-50) ở cả 12.
- **Quan sát**: dải cut-in là cùng một hình chữ nhật nghiêng + chân dung heo + bóng mờ nhân đôi, chỉ đổi màu (xám/vàng đất/xanh ngọc). Wind-up giống hệt nhau nên 12 ultimate "mở màn" nhịp như nhau; chỉ phần sau `impact` mới riêng.
- **Nguyên nhân (code)**: `pacing.circle.ultimate = 820` và beat chung từ `ui/motionProfiles.ts` (`CIRCLE_MS`, `timingOf`) áp cho mọi ultimate; act `cutin` dùng một bố cục (`scene/battle/fxActs.ts`, act `cutin`).
- **Kỳ vọng**: cho phép từng ultimate khai báo `cast`/nhịp riêng (vd ultimate lửa bùng nhanh 300 ms lấy đà, ultimate hư không chậm 600 ms) và cut-in có **bố cục/tên chiêu/hình** riêng theo hệ (ít nhất: tên chiêu bằng chữ, hướng dải, và một biểu tượng riêng); không tái dùng chân dung nhân đôi.
- **Tiêu chí đạt**: manifest: `anticipationMs` có ≥ 4 giá trị khác nhau trong 12 case; tổng `durationMs` trải ≥ 2.5 s – 5 s; TD đặt 12 ô `release-50` cạnh nhau và phân biệt được ≥ 10/12 khi che màu.
- **Ràng buộc**: giữ tổng step ≤ `STEP_MAX_MS` (5600); asset mới qua id → manifest, đặt `docs/ASSET_TODO.md`, tên gốc (AGENT_RULES §9); không ảnh hưởng `reduce`/x2.

### ANIM-114 — Hai cặp status có script giống hệt (MAJOR)
- **Rubric**: Status · MUST-HAVE "các trạng thái khác có hình ảnh riêng, không dùng chung"; C4.
- **Case & bằng chứng**: `battle.status.atkDown.apply` ≡ `battle.status.matkDown.apply`; `battle.status.matkUp.apply` ≡ `battle.status.accUp.apply` · sheet tổng status (hàng 2–3).
- **Số đo [Auto]**: cờ `DUPLICATE_SCRIPT` (chữ ký cue trùng, `scriptSig` bằng nhau) cho cả hai cặp.
- **Quan sát**: ở khung impact, cặp Up đều là vài tia lửa cam cạnh 3 heo; cặp Down đều là cùng bố cục sụp/mũi tên. Không đoán được loại chỉ bằng hình.
- **Nguyên nhân (code)**: `content/adventure/battle_fx.json` → `statuses.{atkDown,matkDown,matkUp,accUp}.apply` cùng chuỗi act, chỉ khác màu/ref; `ui/buffLanguage.ts` định hướng khác nhau nhưng script thực không khác về cấu trúc.
- **Kỳ vọng**: khác nhau theo bảng ngôn ngữ (ANIM-008): atk=kiếm/mũi nhọn ↑ đỏ; matk=rune quay tím; acc=tâm ngắm; Down tương ứng: kiếm gãy / rune tắt / mờ mắt.
- **Tiêu chí đạt**: `DUPLICATE_SCRIPT` biến mất cho 4 case; TD che màu vẫn phân biệt 4 status.
- **Ràng buộc**: debuff ≤ 400 ms (`DEBUFF_MAX_MS`), `buffLanguage.test.ts` xanh.

### ANIM-119 — 7 debuff thiếu pha "hết hiệu lực" (MAJOR)
- **Rubric**: Status · MUST-HAVE "đủ 3 pha: khi dính · duy trì · khi hết".
- **Bằng chứng**: [Code]+[Auto]: `content/adventure/battle_fx.json` → `statuses.{atkDown,defDown,matkDown,mdefDown,accDown,evaDown,spdDown}` không có `expire` (18/25 status có). Pha dính + duy trì: có. Các status khác đã chứng minh có expire (xem ANIM-003).
- **Kỳ vọng**: thêm `expire` ngắn (≤ 300 ms) cho 7 debuff: khói tím tan, mũi tên ↓ hóa mờ, thân hồi lại độ sáng.
- **Tiêu chí đạt**: schema/JSON có `expire` cho cả 7; test hiện có (`buffLanguage.test.ts`) mở rộng kiểm; chụp lại thấy hiệu ứng tan khi hết.
- **Ràng buộc**: không thêm event log; dùng cơ chế diff hiện có (ANIM-003).

### ANIM-117 — Vòng phép phân biệt hệ chủ yếu bằng màu (MINOR)
- **Rubric**: C4 (5 = phân biệt được kể cả bỏ màu).
- **Bằng chứng**: sheet `ult_tg` ô `t=200` (trắng), `stun` (vàng), `freeze` (xanh): cùng một vành hai lớp quay, chỉ khác màu; glyph ở tâm không đọc được ở 600 px.
- **Kỳ vọng**: glyph/rune theo hệ to hơn hoặc hạt `<hệ>_rise` ở đáy để phân biệt hình.
- **Tiêu chí đạt**: TD che màu vẫn phân biệt lửa/nước/đất; ghi vào ASSET_TODO nếu cần art.

### ANIM-113 — Thời gian lấy đà ngoài khoảng tham khảo (MINOR, `taste`)
- 77 case cờ `ANTICIPATION_RANGE`; ultimate 500 ms vs 150–300 ms; vòng phép 820 ms vs 300–600 ms (`CIRCLE_RANGE`). Rubric §5 nói "không phải luật cứng". **Không bắt buộc sửa**; xét cùng ANIM-112. Chủ dự án quyết qua playtest.

## 5. needs_evidence — yêu cầu Tester (harness), không phải việc Developer
1. **Sửa nhận định sai trong manifest**: mục `absent` ghi "content không có pha hết hiệu lực / không có loop" là **sai**. Schema và content có `expire` (18/25) và `layers` (12) thay cho `loop`; chỉ 7 debuff thiếu expire (ANIM-119). Harness phải: coi `layers` là pha duy trì; chụp pha **expire** chủ động (đặt status rồi gỡ trong cùng case) thay vì ghi `absent`.
2. **Khung tổng hợp (sheet tổng) chọn sai thời điểm**: dùng khung `impact` nên nhiều ultimate/status trông trống vì lúc đó đứng hình (hit-stop) hoặc hiệu ứng chưa hiện. Đổi thành khung có **biến đổi lớn nhất** so với `t=0` (hoặc `impact+200`), và với status thêm ô tại `marks.status.at`.
3. **Nhiễm từ lần khởi động**: ở nhiều sheet status, khung `t=0` còn hiệu ứng của lần chạy khởi động (băng vỡ, sao tản). Tôi dùng được nó làm bằng chứng expire nhưng đó là lẫn dữ liệu. Harness cần dọn trạng thái trước lần đo (hoặc ghi nhãn rõ) để `t=0` sạch.
4. **Cờ `ULT_SKIPPABLE_UNVERIFIED` nhiễu** (12/12): chuyển thành ghi chú cấp manifest.
5. Chưa có: map, targeting, chỉ báo lượt, HUD (`suitesNotBuilt`) — cần khi TD chấm các nhóm này.
6. Cần thêm case: `ko`, `win`, `crit` đã chụp (variants) nhưng TD chưa xem; ghi nhận chỉ chụp trên `skill_cl_taunt` — nên thêm trên 1 skill sát thương để thấy phản ứng bị đánh/KO thật sự.

## 6. Hồi quy & nhất quán
Chưa có run trước nên chưa so được hồi quy. Nhất quán giữa ultimate: **khung mở màn quá giống nhau** (ANIM-112) nhưng phần impact rõ riêng (sheet tổng ultimate: kỵ sĩ vàng, bu-lông, phượng hoàng, nhẫn linh, sóng, mưa băng — mỗi cái một chủ đề).

## 7. Danh sách cần chủ dự án playtest (rubric §7)
| Đơn vị | Tiêu chí | Câu hỏi |
|---|---|---|
| mọi ultimate | C2, C5 | Wind-up 0,5 s + vòng phép 0,8 s trước khi ra chiêu có thấy dài/nặng nề hay đúng "chiêu cuối"? Cảm giác va chạm lúc `impact` (đứng hình 220 ms) đã đủ nặng chưa? |
| skill thường | C2, C5 | Lấy đà 220–300 ms có đủ nhanh để không thấy rề rà khi đánh nhiều lượt? |
| `reduce` | C1 | Với `reduce` bạn còn biết ai đánh ai không (sau khi ANIM-111 sửa)? |

## 8. Phán quyết
**`needs_fix`**: còn 1 blocker + 4 major `open` (round 1 < maxRounds 3). Đồng thời: D-1 đã được chủ dự án quyết (giữ rubric); Tester xử lý §5 song song (không chặn Developer); TD xem nốt phần chưa xem ở vòng 1b trước khi chốt điểm nhóm.
