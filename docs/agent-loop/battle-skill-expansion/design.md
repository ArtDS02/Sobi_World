# battle-skill-expansion — 9 hệ đủ số, đủ vai, có chuỗi tiến hóa "Ấn Hộ Thần" mở khóa theo lore

**Trạng thái: ĐỀ XUẤT cho cổng duyệt của chủ dự án. Chưa code, chưa sửa `content/`.**
Thước: `docs/SKILL_ANIMATION_STANDARD.md` §7 (5 tiêu chí × 2 = 10). **Ngưỡng ĐẠT: mỗi skill mới ≥ 8,0, kể cả tuyệt kỹ** (chủ dự án ấn định; mốc duyệt thấp nhất cũ 6,5, trung bình 7,1).
Một lô ĐẠT khi: mọi skill của lô ≥ 8,0 **và** mọi kiểm §C áp cho lô đạt. Mốc chuẩn: skill mẫu từng hệ ở §1 của chuẩn (vd `skill_ult_hg`, `skill_e_vine_lash`).
Nguồn: `research.md`, `research-lore.md`, `audit_before.md`, decision 021 / 048 / 060, `SKILL_DESCRIPTION_STANDARD.md` §2 §6.

## 0. Audit 3.1 — trước khi làm
Cách quy: audit đếm theo trường `element` (unique + ultimate + class mang hệ). 21 skill hỗ trợ `element: null` của dòng (17 unique + 4 ultimate, grep `skills.json`) được **quy về hệ của dòng** theo `lineages.json`. Cột B1–B4 và điểm là của **mọi** skill mang hệ (gồm skill quái), lấy nguyên từ audit.

| Hệ | Audit (theo element) | + hỗ trợ null quy về dòng | Tổng người chơi | B1/B2/B3/B4 | Điểm min/tb/max |
|---|---|---|---|---|---|
| FIRE | 5 | 1 (forge_fire) | **6** | 0/6/2/2 | 7 / 7,2 / 7,5 |
| WATER | 5 (gồm 1 class) | 4 (soothe, tide_song, rising_tide, ult_nh) | **9** | 1/7/0/1 | 7 / 7,2 / 8 |
| EARTH | 4 | 3 (stone_skin, mountain_shell, ult_qs) | **7** | 2/2/5/0 | 7 / 7,3 / 7,5 |
| METAL | 5 | 2 (bronze_wall, iron_oath) | **7** | 1/2/5/1 | 7 / 7,2 / 7,5 |
| LIGHTNING | 4 | 1 (swift_bolt) | **5** | 1/3/2/1 | 6,5 / 7,3 / 8 |
| NATURE | 2 | 3 (sprout, blossom, ult_mm) | **5** | 3/4/0/0 | 7 / 7,1 / 7,5 |
| LIGHT | 4 | 3 (first_light, guiding_lamp, ult_qt) | **7** | 1/4/3/0 | 7 / 7,3 / 8 |
| DARK | 4 | 1 (ink_veil) | **5** | 2/3/1/1 | 7 / 7,1 / 7,5 |
| VOID | 5 | 3 (void_veil, phase_shift, null_ward) | **8** | 3/2/1/2 | 7 / 7,1 / 7,5 |

- Hệ thiếu (dưới 10): cả 9; nặng nhất LIGHTNING, NATURE, DARK (5), FIRE (6).
- Ô hệ × vai = 0 theo audit: 18 ô. **Sau khi quy null về dòng** còn **6 ô**: FIRE × khống chế, EARTH × đơn mục tiêu, NATURE × khống chế, LIGHT × khống chế, DARK × diện rộng, VOID × khống chế. (Ô "hỗ trợ" và "tối thượng" của EARTH / NATURE / LIGHT đã có skill null.)

## A. Phần chung

### A1. Số tối thiểu mỗi hệ — đề xuất **10 skill người chơi** (sau khi quy null)
Lý do: trùng ngưỡng mặc định của `npm run skill:audit`; đủ chỗ cho 5 vai × ≥ 1 cộng chuỗi 3 bậc; không xóa skill cũ nên WATER / VOID vượt nhẹ. Mỗi hệ nhận **chuỗi Ấn 3 skill** + skill lấp chỗ trống:
| Hệ | FIRE | WATER | EARTH | METAL | LIGHTNING | NATURE | LIGHT | DARK | VOID | Tổng |
|---|---|---|---|---|---|---|---|---|---|---|
| Mới | 4 | 3 | 3 | 3 | 5 | 5 | 3 | 5 | 3 | **34** |
| Sau | 10 | 12 | 10 | 10 | 10 | 10 | 10 | 10 | 11 | 93 |
Tổng skill sau: 134 + 34 = 168. Chênh giữa các hệ: 10–12 (trước: 5–9).

### A2. Đường đưa skill tới người chơi
**Phương án chính — ô "Ấn Hộ Thần" (1 ô mới mỗi con) + tuyệt kỹ Hộ Thần dùng chung Rage:**
- Dữ liệu mới `content/adventure/seals.json`: mỗi dòng 1 chuỗi `steps: [Ấn Khởi, Ấn Thức, Ấn Thần]` + điều kiện mở từng bước (A5). Schema `content/schemas/adventure/seals.ts`. Không đổi `unique[4]`, không đổi `ultimate` của loài.
- Ô Ấn hiện **bước cao nhất đã mở trong 2 bước đầu** (Ấn Khởi → Ấn Thức: **tiến hóa thay thế**). Chưa mở bước nào: ô hiện khóa + gợi ý lore (i18n), không có skill.
- Ấn Thần (`type: "ultimate"`, mpCost 0) **dùng chung Rage và luật 1 tuyệt kỹ / trận** (`rules.ts:58`): Rage đầy thì có 2 nút (tuyệt kỹ loài, Ấn Thần); dùng một thì cái kia khóa tới hết trận. Mỗi loài vẫn 1 `ultimate`.
- Mỗi con: 4 Unique + ≤ 3 class + 1 Ấn + 1 ultimate (+ Ấn Thần chọn thay). Sửa `fighters.ts:42`, test `adventure.test.ts:71`.
- Skill lấp chỗ trống (7 skill FIRE / LIGHTNING / NATURE / DARK): **thay một ô Unique của loài** theo tiền lệ 060 (`species.<id>.unique[ô]`), chọn đúng 7 loài chưa có ô thay (bảng từng lô).
- **Không chạm save**: ô Ấn tính lại mỗi lần dựng fighter từ cờ có sẵn (`loreFound`, `cleared`, `beaten`, `explored`, `openedExits`, `rift.best`, `feats.nightmares`, `level`). `ADVENTURE_STATE_VERSION` giữ 8. Lựa chọn tuyệt kỹ trong trận không lưu.
So sánh:
- (B) Chỉ thay ô Unique loài (060): không đổi code / save, nhưng 34 skill chỉ tới 1 loài mỗi skill, loài mất skill dòng, không có mở khóa theo lore, không có tiến hóa.
- (C) Ô Ấn cho **người chơi tự chọn** trong mọi bước đã mở: linh hoạt hơn, nhưng phải lưu lựa chọn ⇒ `Fighter.seal` mới, migration v8 → v9 (`logic/migrations.ts`, mặc định = bước cao nhất), test `saveVersions`.

### A3. Thang bậc
| Bậc | Skill | power (× hits) | MP | CD | Bậc lực | VFX: cỡ hình chủ đạo | Đổi sân / letterbox / camera | Thời lượng |
|---|---|---|---|---|---|---|---|---|
| Thường | Ấn Khởi, phần lớn skill lấp | 0,85–1,3 (hoặc 0,55–0,65 × 2–3) | 10–14 | 1–2 | T1–T2 | `0,5 + tall×0,25` … `1,05 + tall×0,5` (cỡ thân mục tiêu) | không / không / tĩnh | 900–1500 ms |
| Nâng cao | Ấn Thức | đơn 1,8–1,9; diện rộng 0,95–1,2 | 26–30 | 3 | T3 | ≥ 1/3 chiều ngang khung ở impact | `tint` nền hệ ≤ 400 ms; không letterbox; rung medium | 1200–1800 ms |
| Đặc biệt / tối thượng | Ấn Thần | 1,9–2,3 hoặc hỗ trợ 0 | 0 (Rage) | 0 | T4 | sân bị **đổi** ≥ 2/3 khung | đổi sân theo hệ ≥ 1200 ms rồi trả; letterbox + cut-in; camera đẩy vào 6–10 % ≤ 400 ms nếu `battleScript` có act camera (xem F) | 2800–3500 ms |
Khớp research §3 (unique T2 0,9–1,3; T3 1,4–2,3; ultimate 1,5–2,5) và spec §8.1 (thường 8–15 MP, mạnh 20–35). VOID thấp hơn ~15 % (spec §6.2).

### A4. Liên kết
**Phản ứng mới** (thêm vào `reactions.json` + `battle_fx.json elementReactions`; dùng đúng các trường có sẵn, không code mới trong `resolve.ts`; `priority` thấp hơn 6 phản ứng cũ):
| id | Tên | Đòn hệ | Điều kiện | Kết quả | Cặp hệ mới |
|---|---|---|---|---|---|
| `reaction_temper` | Tôi Thép | METAL | `requiresStatus: burn` | ×1,35, Giảm thủ 2 lượt, consume | FIRE → METAL |
| `reaction_mire` | Bùn Lún | EARTH | `requiresStatus: wet` | ×1,25, Chậm 2 lượt, consume | WATER → EARTH |
| `reaction_rootbind` | Bén Rễ | NATURE | `requiresSourceElement: EARTH` | ×1,3, 30 % Choáng 1 lượt | EARTH → NATURE |
| `reaction_conduct` | Dẫn Điện | LIGHTNING | `requiresSourceElement: METAL` | ×1,3, 25 % Choáng 1 lượt | METAL → LIGHTNING |
| `reaction_abyss_night` | Đêm Không Đáy | VOID | `requiresSourceElement: DARK` | ×1,3, `dispel` 1 | DARK → VOID |
Sau đó 9 / 9 hệ có ≥ 1 phản ứng (cũ: FIRE, WATER, LIGHTNING, NATURE (độc), LIGHT, DARK).
**Combo skill ↔ skill** = skill A đặt trạng thái, skill B tiêu thụ qua phản ứng (ghi ở cột "Liên kết" mỗi lô; mỗi skill mới ≥ 1 liên kết).
**Chuỗi tiến hóa**: Ấn Khởi → Ấn Thức thay thế trong ô Ấn khi đủ điều kiện; Ấn Thần mở thêm (không thay). Không dùng `maxLevel` (Unique giữ level 1).

### A5. Mở khóa
Luật chung: **Ấn Khởi** = đọc bia lore Guardian của hệ + cấp; **Ấn Thức** = hạ trùm / tiểu trùm gắn hệ; **Ấn Thần** = mục tiêu khám phá lớn (100 % vùng, mở lối tắt, Vết Nứt) + cấp. Cờ vùng / lore là của save chung; cấp, `feats` của từng con.
Hàm thuần `sealStepUnlocked(cond, view): boolean` và `sealStepsOf(lineageId, view)` ở `src/areas/adventure/logic/seals.ts` (≤ 300 dòng, không import game/ui/store). `view` = lát đọc từ `AdventureState` + `Fighter`. Kiểu điều kiện: `lore`, `level`, `cleared`, `beaten`, `explorePct {zone, pct}`, `exit`, `riftBest`, `nightmares`. Coder xác nhận khóa thật của `beaten` / `explored` / `openedExits` ở `state.ts:223-240`; thiếu hàm % khám phá thuần thì viết trong file này. Khi một action làm bước mới mở (so trước / sau) ⇒ phát GameEvent `adventure.sealUnlocked` → toast qua FeedbackDirector.
Lore dùng: bia ở `content/adventure/maps.json` (dòng ghi ở từng lô); điểm mở khóa (a)(b)(c) `research-lore.md:32`. Điều chưa có trong lore ghi "đề xuất lore mới".

### A6. Bot cân bằng
Trước / sau cùng seed: `npx tsx scripts/sim-adventure.ts 400 1 <zone> rare` cho `zone_forest`, `zone_mountain`, `zone_ruins` (+ `zone_coast` lô WATER); `npx tsx scripts/simulate-week.ts 1 30 adventure`. Chạy 2 chế độ: mặc định (Ấn theo cờ) và **`--seals all`** (cờ giả định mở hết; thêm cờ này vào script sim ở pilot).
Giới hạn: mỗi ô (đội × cấp) mặc định ±8 điểm tỉ lệ thắng; `--seals all` ≤ +12; tuần 30 ngày ±3. Vượt ⇒ báo chủ dự án, **không tự chỉnh số** (decision 021).

### A7. Kiến trúc / quy trình / KHÔNG ĐƯỢC chung
- Quy trình mỗi lô theo `SKILL_ANIMATION_STANDARD.md` §2 (decision trước content → `skills.json` + `seals.json` + `lineages.json` → `en.json` → `content:ids`, `content:fmt` → hợp đồng `scenarios/skills/<id>.md` → `<chất liệu>Extra.ts` / `…Ults.ts` → chụp → chấm → SCORES).
- Lệnh chụp: `npx tsx scripts/animation/shots.ts <ids> --gpu --out art_inbox/vfx3d_shots/bse_<hệ>`; Ấn Thần thêm `--abs 700,1200,1500,1900,2400,2800,3300`. Lưới: `python -I scripts/animation/reviewGrid.py <thư mục> <out.png> <ids>`.
- KHÔNG ĐƯỢC (mọi lô): (1) khối tối / bóng đen mép cứng không nguồn; (2) hình chủ đạo bị cắt mép ở mốc impact; (3) che mục tiêu > 250 ms; (4) hình chủ đạo trùng skill cũ cùng hệ hoặc Ấn Thần trùng tuyệt kỹ cũ của dòng; (5) tên / hình / mô tả gợi IP bên thứ ba (048); (6) vẽ kết quả xác suất; (7) sửa / xóa skill cũ.

## B. Chín lô (pilot trước)
Cột số: `power × hits · MP · CD`. Khuôn kịch bản: **HÌNH** · **PHẢI THẤY** (thứ tự) · **NHỊP** (ms từ đầu act) · **KHÔNG**.

### B1. NATURE (PILOT) — rừng mọc lại quanh trận
Lý do pilot: hệ ít nhất theo audit (2); vùng Rừng Lv 1–10 nên bot với tới mở khóa ⇒ đo cân bằng sớm; lô duy nhất dùng đủ cả 3 đường (ô Ấn, Ấn Thần dùng chung Rage, thay ô loài) và 1 phản ứng mới với nguồn có sẵn (đòn EARTH của dòng Quy Sơn). Pilot dựng luôn phần chung A2/A4/A5/A6.
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_mm_seed_volley` | Hạt Gai Bật | đơn (ngẫu nhiên) · Ấn Khởi | randomEnemies | 0,55×3 · 12 · 1 | poison 0,25 | Ba hạt gai bật ra rơi vào kẻ địch ngẫu nhiên, mỗi hạt 25% gây Trúng độc. |
| `skill_mm_root_snare` | Rễ Mẹ Siết | khống chế · Ấn Thức | allEnemies | 0,95 · 28 · 3 | stun 0,35 | Rễ cổ trồi từ đất quấn từng kẻ địch, 35% làm choáng. |
| `skill_ult_mm_bloom_field` | Đồng Hoa Gieo Lại | tối thượng · Ấn Thần | allEnemies | 2,0 · 0 · 0 | poison 1 | Tuyệt kỹ: hoa và dây leo mọc phủ kín sân, gai quất mọi kẻ địch và gây Trúng độc. |
| `skill_mm_root_spear` | Mũi Rễ Xuyên | đơn · thường | enemy | 1,3 · 10 · 1 | — | Một mũi rễ nhọn trồi từ đất đâm xuyên một kẻ địch. |
| `skill_mm_vine_lock` | Dây Leo Khóa | khống chế · thường | enemy | 0,85 · 14 · 2 | disable 2 lượt 0,35 | Dây leo quấn chặt một kẻ địch, 35% Phong ấn 2 lượt. |
- seed_volley: HÌNH hạt gai xanh có vỏ · PHẢI THẤY 1) đài hoa nở ở người tung 2) đúng 3 hạt bật cung lên rơi lên `struck[k % n]` 3) hạt thứ 3 to nhất, lá vụn · NHỊP impact 600/820/1040, end 1400 · KHÔNG hạt phát sáng.
- root_snare: HÌNH rễ xoắn tính lại mỗi khung · PHẢI THẤY 1) đất nứt dưới từng địch 2) rễ trồi quấn từng con lệch 90 ms 3) siết rồi rụt, bụi đất · NHỊP impact 800, end 1600 · KHÔNG rễ thẳng tắp; vẽ choáng.
- bloom_field: HÌNH thảm hoa + dây leo phủ sân · PHẢI THẤY 1) letterbox, cut-in lục 2) hoa nở lan từ phe ta qua sân ≥ 2/3 khung 3) dây gai quất từng địch lệch 90 ms 4) cánh hoa bay lên, sân tan về nền cũ · NHỊP impact 1200, end 3300 · KHÔNG giống `skill_ult_mm` (vòng ôm đồng đội); phát sáng.
- root_spear: HÌNH một mũi rễ cỡ thân · PHẢI THẤY gợn đất → rễ đâm lên xuyên → gãy vụn · NHỊP impact 550, end 1100 · KHÔNG đốt dày như tre.
- vine_lock: HÌNH dây leo quấn 3 vòng · PHẢI THẤY dây bò từ đất → quấn → siết thắt nút lá · NHỊP impact 650, end 1300 · KHÔNG vẽ khóa rune (trạng thái lo).
- Mở khóa: Ấn Khởi `lore: lore_f2_pond` (maps.json:499 "heo mẹ phủ hoa") + Lv 5 · Ấn Thức `cleared: zone_forest` (Cổ Thụ = rễ Mộc Mẫu, SPEC:390) · Ấn Thần `lore_f1_sapling` (:215) + `lore_f3_root` (:771) + 100 % `zone_forest` + Lv 15. Loài: `PIG_BOAR` ô 0 (`mm_poison_thorn` → root_spear), `PIG_SUNFLOWER` ô 2 (`mm_binding_roots` → vine_lock).
- Liên kết: seed_volley (Trúng độc) → đòn FIRE (Cháy Rừng); đòn EARTH (vd Quả Đấm Mai Đá) → root_snare (Bén Rễ). Khác anh em: hình thân sống mềm, xanh lá; không hệ nào khác có hoa.

### B2. DARK — đêm ru ngủ, không phải Umbra
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_dm_silver_thread` | Chỉ Bạc Đêm | đơn · Ấn Khởi | enemy | 1,2 · 12 · 1 | spdDown 0,35 | Một sợi chỉ bạc của đêm quất quấn một kẻ địch, có thể làm Chậm. |
| `skill_dm_lullaby_net` | Lưới Ru Đêm | diện rộng · Ấn Thức | allEnemies | 1,1 · 28 · 3 | accDown 0,5 | Lưới đêm có sao chụp xuống từng kẻ địch, có thể làm Giảm chính xác. |
| `skill_ult_dm_hush_night` | Đêm Ru Muôn Loài | tối thượng · Ấn Thần | allEnemies | 2,0 · 0 · 0 | atkDown 1; stun 0,25 | Tuyệt kỹ: trời đêm phủ sân, lưới sao rủ xuống mọi kẻ địch, Giảm công và 25% làm choáng. |
| `skill_dm_ink_tide` | Triều Mực | diện rộng · thường | allEnemies | 0,9 · 24 · 3 | atkDown 0,4 | Mực đêm trào lan qua mọi kẻ địch, có thể làm Giảm công. |
| `skill_dm_star_quilt` | Chăn Sao Ngủ Yên | hỗ trợ · thường | allAllies | 0 · 18 · 3 | cleanse 1; mdefUp | Tấm chăn lưới sao phủ cả đội, xóa một trạng thái xấu và tăng thủ phép. |
- silver_thread: HÌNH sợi chỉ bạc mảnh có sao nhỏ · PHẢI THẤY chỉ phóng từ xúc tu → quấn 2 vòng → giật, mảnh mực tan · NHỊP impact 600, end 1200 · KHÔNG sáng chói.
- lullaby_net: HÌNH lưới đêm có sao ≥ 1/3 khung · PHẢI THẤY lưới giăng trên cao → chụp xuống từng địch lệch 90 ms → mép nhiễu chậm tan · NHỊP impact 850, end 1700 · KHÔNG khối đặc che mục tiêu > 250 ms.
- hush_night: HÌNH trời đêm sao + lưới rủ · PHẢI THẤY letterbox, cut-in tím → nền sân tối thành trời đêm ≥ 2/3 khung → lưới rủ lên từng địch → sao tắt dần, sân về cũ · NHỊP impact 1150, end 3200 · KHÔNG giống `skill_ult_dm` (lưới một tấm), không mắt / hàm (gợi Umbra).
- ink_tide: HÌNH sóng mực thấp · PHẢI THẤY mực trào từ chân người tung → lan qua từng địch → rút để vệt · NHỊP impact 700, end 1400 · KHÔNG nét cứng.
- star_quilt: HÌNH tấm chăn lưới sao · PHẢI THẤY chăn hạ nhẹ lên từng đồng đội lệch 110 ms → mũi tên tím đi lên · NHỊP end 1200 · KHÔNG rung (T0).
- Mở khóa: Ấn Khởi `lore_r2_threads` (maps.json:2338 "Chỉ của Dạ Mặc đang yếu đi") + Lv 12 · Ấn Thức `beaten: enemy_tide_wraith` (Hồn Ma Thủy Triều, Đầm Sương) · Ấn Thần `beaten: enemy_wolf_alpha` + `cleared: zone_ruins` + Lv 22. Đề xuất lore mới: thắng hồn ma "không ngủ được" là nối lại một sợi chỉ. Loài: `PIG_NINJA` ô 2 (`dm_night_net` → ink_tide), `PIG_VAMPIRE` ô 1 (`dm_ink_veil` → star_quilt).
- Liên kết: lullaby_net (trạng thái nguồn DARK) → đòn LIGHT (Nhật Thực) / đòn VOID (Đêm Không Đáy). Khác anh em: duy nhất có lưới sao + mực tím, chậm.

### B3. LIGHTNING — Guardian thức tỉnh đầu tiên
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_ld_horn_spark` | Tia Sừng Xoáy | đơn · Ấn Khởi | enemy | 0,6×2 · 12 · 1 | — | Hai tia sét gấp khúc phóng từ cặp sừng xoáy vào một kẻ địch. |
| `skill_ld_brass_rod` | Đinh Đồng Thu Sét | diện rộng · Ấn Thức | allEnemies | 1,15 · 30 · 3 | stun 0,25 | Đinh đồng khổng lồ cắm giữa sân hút sét, sét tỏa đánh mọi kẻ địch, 25% làm choáng. |
| `skill_ult_ld_waking_storm` | Cơn Giông Thức Tỉnh | tối thượng · Ấn Thần | allEnemies | 2,2 · 0 · 0 | stun 0,3 | Tuyệt kỹ: mây giông phủ kín trời sân, sét giáng xuống mọi kẻ địch, 30% làm choáng. |
| `skill_ld_coil_bind` | Vòng Sét Trói | khống chế · thường | enemy | 0,9 · 14 · 2 | stun 0,4 | Vòng điện gấp khúc thắt quanh một kẻ địch, 40% làm choáng. |
| `skill_ld_charge_cloud` | Mây Tích Điện | hỗ trợ · thường | allAllies | 0 · 18 · 3 | matkUp; accUp | Mây tích điện lơ lửng trên cả đội, tăng công phép và chính xác. |
- horn_spark: HÌNH 2 tia gấp khúc phân nhánh · PHẢI THẤY điện bò trên sừng → tia 1 → tia 2 to hơn, vết cháy · NHỊP impact 550/770, end 1200 · KHÔNG tia mượt.
- brass_rod: HÌNH đinh đồng cao ≥ 1/3 khung (khắc xoáy, hình gốc) · PHẢI THẤY đinh rơi cắm giữa sân → `tint` tối → sét từ mây xuống đinh → tỏa nhánh tới từng địch lệch 80 ms · NHỊP impact 900, end 1700 · KHÔNG đinh che mục tiêu.
- waking_storm: HÌNH mây giông có bụng tối phủ trời · PHẢI THẤY letterbox → trời sân tối, mây cuộn ≥ 2/3 bề ngang → sét giáng từng địch, vòng xé đất → mây tan · NHỊP impact 1100, end 3300 · KHÔNG chớp > 2 / giây; không giống `skill_ult_ld` (một cột).
- coil_bind: HÌNH vòng điện gấp khúc · PHẢI THẤY vòng thắt từ to về sát thân → giật 3 lần · NHỊP impact 600, end 1200 · KHÔNG vẽ sao choáng.
- charge_cloud: HÌNH đám mây nhỏ trên mỗi đồng đội · PHẢI THẤY mây tụ → mũi tên tím + vàng trắng đi lên · NHỊP end 1200 · KHÔNG rung, không chớp (T0).
- Mở khóa: Ấn Khởi `lore_m2_seal` (maps.json:1471 đinh đồng dấu xoáy vàng) + Lv 8 · Ấn Thức `beaten: enemy_thunder_ram` (Đèo Gió) · Ấn Thần `cleared: zone_mountain` + `exit: n4_east` + Lv 20. Loài: `PIG_TIGER` ô 0 (`ld_thunder_strike` → coil_bind), `PIG_STORM` ô 1 (`ld_swift_bolt` → charge_cloud).
- Liên kết: đòn METAL (trạng thái nguồn METAL) → horn_spark / brass_rod (Dẫn Điện); Ướt → mọi đòn sét (Điện Giật). Khác anh em: duy nhất gấp khúc, nhanh, vàng.

### B4. FIRE — lò rèn của Hỏa Giải
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_hg_ember_pincer` | Càng Than Hồng | đơn · Ấn Khởi | enemy | 0,65×2 · 12 · 1 | burn 0,3 | Hai nhát càng nung đỏ kẹp một kẻ địch, 30% gây Bỏng. |
| `skill_hg_slag_wave` | Sóng Xỉ Lò | diện rộng · Ấn Thức | allEnemies | 1,15 · 28 · 3 | defDown 0,4 | Sóng xỉ nóng chảy tràn qua mọi kẻ địch, có thể làm Giảm thủ. |
| `skill_ult_hg_anvil` | Đe Lửa Vạn Năm | tối thượng · Ấn Thần | allEnemies | 2,2 · 0 · 0 | burn 1 | Tuyệt kỹ: đe lửa khổng lồ giáng xuống giữa hàng địch, sóng lửa đánh mọi kẻ địch và gây Bỏng. |
| `skill_hg_slag_cage` | Lồng Xỉ Sắt | khống chế · thường | enemy | 0,9 · 14 · 2 | stun 0,4 | Xỉ sắt nung đỏ đông lại thành lồng quanh một kẻ địch, 40% làm choáng. |
- ember_pincer: HÌNH càng sắt nung (đen → đỏ → vàng) cỡ thân · PHẢI THẤY than tụ → kẹp 1 → kẹp 2 to hơn, tàn bay lên · NHỊP impact 600/820, end 1300 · KHÔNG lửa đứng yên.
- slag_wave: HÌNH sóng dung nham vỏ nứt ≥ 1/3 khung · PHẢI THẤY xỉ trào → lăn qua từng địch lệch 90 ms → nguội đen, khói · NHỊP impact 850, end 1700 · KHÔNG lửa chỉ cộng sáng.
- anvil: HÌNH đe sắt nung to hơn người · PHẢI THẤY letterbox → nền sân nứt dung nham ≥ 2/3 khung → đe rơi (bóng báo trước) → sóng lửa tới từng địch → tàn bay, sân nguội về cũ · NHỊP impact 1150, end 3300 · KHÔNG giống `skill_ult_hg` (lò) / `skill_hg_inferno_hammer` (búa).
- slag_cage: HÌNH các thanh xỉ đỏ đông thành lồng · PHẢI THẤY xỉ phụt lên quanh mục tiêu → cong khép → nguội sẫm · NHỊP impact 650, end 1300 · KHÔNG che mục tiêu > 250 ms (lồng thưa).
- Mở khóa: Ấn Khởi `lore_m1_carving` (maps.json:1176 "Lửa của Hỏa Giải chưa từng tắt") + Lv 8 · Ấn Thức `cleared: zone_mountain` (Rồng Dung Nham) · Ấn Thần `explorePct zone_mountain 1` + `lore_m3_drake` (:1726) + Lv 20. Loài: `PIG_DRAGON` ô 0 (`hg_hot_claw` → slag_cage).
- Liên kết: ember_pincer / slag_wave (Bỏng) → đòn METAL (Tôi Thép); Trúng độc → đòn lửa (Cháy Rừng). Khác anh em: duy nhất có sắt nung đổi màu + dung nham vỏ nứt.

### B5. EARTH — Quy Sơn chặn lối
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_qs_shell_fist` | Quả Đấm Mai Đá | đơn · Ấn Khởi | enemy | 1,3 · 10 · 1 | — | Một nắm đấm đá trồi từ đất nện thẳng vào một kẻ địch. |
| `skill_qs_gate_slab` | Phiến Cổng Đá | đơn nặng · Ấn Thức | enemy | 1,85 · 26 · 3 | defDown 0,4 | Phiến cổng đá khổng lồ trồi lên rồi đổ sập lên một kẻ địch, có thể làm Giảm thủ. |
| `skill_ult_qs_mountain_back` | Mai Rùa Gánh Núi | tối thượng · Ấn Thần | allEnemies | 2,1 · 0 · 0 | stun 0,3 | Tuyệt kỹ: ngọn núi trên mai rùa trồi lên sau sân, đất nứt nện mọi kẻ địch, 30% làm choáng. |
- shell_fist: HÌNH nắm đấm đá ba tông · PHẢI THẤY gợn đất → nắm đấm trồi → nện, sạn bắn → lún về · NHỊP impact 550, end 1100 · KHÔNG phát sáng.
- gate_slab: HÌNH phiến đá cao ≥ 1/3 chiều cao khung, đặt cạnh mục tiêu phía trống · PHẢI THẤY nứt chạy → phiến trồi → nghiêng → đổ sập, bụi · NHỊP impact 900, end 1700 · KHÔNG nhẹ, lơ lửng; không che mục tiêu > 250 ms.
- mountain_back: HÌNH núi trên mai rùa ở xa (z âm) · PHẢI THẤY letterbox → mặt sân nứt ≥ 2/3 khung → núi trồi sau sân → chấn sóng tới từng địch lệch 90 ms → bụi lắng, sân về cũ · NHỊP impact 1200, end 3300 · KHÔNG giống `skill_ult_qs` (khiên đội).
- Mở khóa: Ấn Khởi `lore_n5` (maps.json:4272 cửa đá đường hầm) + Lv 10 · Ấn Thức `beaten: enemy_ore_golem` · Ấn Thần `exit: n5_north` + `explorePct zone_mountain 1` + Lv 20. Đề xuất lore mới: cửa đá "chỉ mở một nửa" là lối Quy Sơn chặn; mở hẳn = Quy Sơn tỉnh.
- Liên kết: Ướt → shell_fist / gate_slab (Bùn Lún); gate_slab (Giảm thủ nguồn EARTH) → đòn NATURE (Bén Rễ). Khác anh em: đá ba tông, nặng, nâu; lấp ô EARTH × đơn.

### B6. METAL — bức tường khiên
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_tg_bronze_tusk` | Nanh Đồng Xuyên | đơn · Ấn Khởi | enemy | 1,2 · 10 · 1 | defDown 0,35 | Húc nanh đồng sáng loáng vào một kẻ địch, có thể làm Giảm thủ. |
| `skill_tg_shield_line` | Hàng Khiên Tiến | diện rộng · Ấn Thức | allEnemies | 1,1 · 28 · 3 | spdDown 0,4 | Một hàng khiên đồng đẩy tới húc mọi kẻ địch, có thể làm Chậm. |
| `skill_ult_tg_shield_wall` | Bức Tường Nghìn Khiên | tối thượng hỗ trợ · Ấn Thần | allAllies | 0 · 0 · 0 | shield 0,3; defUp; mdefUp | Tuyệt kỹ: nghìn tấm khiên đồng ghép thành tường trước cả đội, khiên 30% máu và tăng thủ. |
- bronze_tusk: HÌNH nanh đồng dải phản chiếu · PHẢI THẤY lấy đà → húc → tia keng → mảnh · NHỊP impact 550, end 1100 · KHÔNG mờ nhòe.
- shield_line: HÌNH hàng khiên ghép ≥ 1/3 khung · PHẢI THẤY khiên ghép mảnh khóa → đẩy tới → húc từng địch lệch 80 ms, keng → tan mảnh · NHỊP impact 850, end 1600 · KHÔNG khói.
- shield_wall: HÌNH tường khiên ngang sân trước phe ta · PHẢI THẤY letterbox → khiên bay tới ghép thành tường ≥ 2/3 bề cao khung → vòm khiên trên từng đồng đội → tường lùi tan trong 350 ms · NHỊP end 3000 · KHÔNG rung (hỗ trợ); không giống `skill_ult_tg` (kỵ).
- Mở khóa: Ấn Khởi `lore_r3_seal` (maps.json:2581 tượng Thiết Giáp canh phong ấn) + Lv 12 · Ấn Thức `cleared: zone_ruins` (Hộ Pháp Cổ Đại) · Ấn Thần `explorePct zone_ruins 1` + Lv 22.
- Liên kết: Bỏng → bronze_tusk / shield_line (Tôi Thép); bronze_tusk (nguồn METAL) → đòn LIGHTNING (Dẫn Điện). Khác anh em: duy nhất dải phản chiếu + keng.

### B7. LIGHT — ngọn đèn mở lối
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_qt_lamp_flare` | Đèn Lưng Rọi | khống chế · Ấn Khởi | enemy | 1,0 · 12 · 2 | stun 0,3 | Ngọn đèn trên lưng rọi thẳng một tia vào một kẻ địch, 30% làm choáng. |
| `skill_qt_seal_halo` | Vầng Ấn Rạng | khống chế diện rộng · Ấn Thức | allEnemies | 1,1 · 28 · 3 | disable 2 lượt 0,3 | Vòng rune sáng hạ xuống quanh từng kẻ địch, 30% Phong ấn 2 lượt. |
| `skill_ult_qt_path_lamp` | Ngọn Đèn Mở Lối | tối thượng · Ấn Thần | allEnemies | 2,0 · 0 · 0 | accDown 1 | Tuyệt kỹ: ngọn đèn cổ mở một con đường sáng qua sân, tia sáng rọi mọi kẻ địch và Giảm chính xác. |
- lamp_flare: HÌNH tia lõi trắng thân vàng · PHẢI THẤY đèn lưng sáng dần → tia rọi → mảng ấm dưới chân mục tiêu · NHỊP impact 600, end 1200 · KHÔNG khói, giật.
- seal_halo: HÌNH vòng rune ≥ 1/3 khung chia thành vòng từng con · PHẢI THẤY vòng lớn trên cao → tách hạ xuống từng địch lệch 90 ms → đốm dịu bay lên · NHỊP impact 850, end 1700 · KHÔNG vẽ khóa rune trên đầu (trạng thái lo).
- path_lamp: HÌNH dải đường sáng ngang sân · PHẢI THẤY letterbox → nền tối dần → đèn cổ hiện, mở đường vàng ≥ 2/3 bề ngang → tia rọi từng địch → hào quang tan, sân về cũ · NHỊP impact 1150, end 3200 · KHÔNG giống `skill_ult_qt` (lồng đèn trên đội).
- Mở khóa: Ấn Khởi `lore_r1_lamp` (maps.json:2022 "Khi đèn sáng, lối đi hiện ra") + Lv 12 · Ấn Thức `beaten: enemy_shadow_priest` · Ấn Thần `cleared: zone_ruins` + `lore_n6` (:4639) + Lv 22.
- Liên kết: trạng thái nguồn DARK → đòn LIGHT (Nhật Thực); địch thẻ umbraflux → (Thanh Tẩy). Khác anh em: ấm, thẳng, dịu; lấp ô LIGHT × khống chế.

### B8. WATER — khúc hát giữ triều
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_nh_bell_ripple` | Gợn Chuông Chìm | đơn · Ấn Khởi | enemy | 0,6×2 · 12 · 1 | wet 1 | Hai vòng sóng ngân từ chiếc chuông dưới nước đánh một kẻ địch và làm nó Ướt. |
| `skill_nh_whale_current` | Dòng Cá Ông | diện rộng · Ấn Thức | allEnemies | 1,2 · 30 · 3 | wet 1 | Bóng cá voi lướt dưới sân, sóng bên lưng đánh mọi kẻ địch và làm chúng Ướt. |
| `skill_ult_nh_tide_keeper` | Khúc Hát Giữ Triều | tối thượng · Ấn Thần | allEnemies | 2,0 · 0 · 0 | wet 1; spdDown 0,5 | Tuyệt kỹ: cá voi hát nâng thủy triều phủ sân, sóng đánh mọi kẻ địch, làm Ướt và có thể làm Chậm. |
- bell_ripple: HÌNH vòng sóng có mào bọt · PHẢI THẤY chuông đồng mờ dưới nước → vòng 1 → vòng 2 to hơn, bắn tung · NHỊP impact 600/820, end 1300 · KHÔNG nước đứng như thủy tinh.
- whale_current: HÌNH bóng cá voi dưới mặt nước dài ≥ 1/3 khung · PHẢI THẤY mặt sân gợn → bóng lướt → sóng mào cuộn vỗ từng địch lệch 90 ms → vũng · NHỊP impact 900, end 1700 · KHÔNG vành nước cao che mục tiêu.
- tide_keeper: HÌNH mặt biển phủ sân + cá voi nhô lưng ở xa · PHẢI THẤY letterbox → nước dâng phủ nền ≥ 2/3 khung → cá voi nhô, gợn hát vòng → sóng quét từng địch → nước rút, sân về cũ · NHỊP impact 1200, end 3300 · KHÔNG giống `skill_ult_nh` (hồi đội) / `skill_ult_trident` (đinh ba).
- Mở khóa: Ấn Khởi `lore_c3` (maps.json:5517 chuông đồng ngân dưới nước) + Lv 14 · Ấn Thức `cleared: zone_coast` (Bạch Tuộc Vực Thẳm) · Ấn Thần `explorePct zone_coast 1` + `lore_c1` + Lv 22. Đề xuất lore mới: chuông ngân là tiếng hát của Nam Hải còn vọng lại.
- Liên kết: bell_ripple / whale_current (Ướt) → đòn LIGHTNING (Điện Giật), đòn EARTH (Bùn Lún), đòn FIRE (Hơi Nước). Khác anh em: thân lỏng viền trắng, xanh nước.

### B9. VOID — vì sao thứ chín
| id | Tên | Vai · Bậc | Đích | Số | effects | descVi |
|---|---|---|---|---|---|---|
| `skill_hk_star_sting` | Xúc Tu Sao Trôi | khống chế · Ấn Khởi | enemy | 0,85 · 12 · 2 | disable 2 lượt 0,3 | Xúc tu sứa mang sao chạm một kẻ địch, 30% Phong ấn 2 lượt. |
| `skill_hk_null_ripple` | Gợn Vô Định | diện rộng · Ấn Thức | allEnemies | 0,95 · 28 · 3 | dispel 1 | Một gợn hư không lan qua mọi kẻ địch, xóa một trạng thái tốt của mỗi con. |
| `skill_ult_hk_sky_unveiled` | Bầu Trời Lộ Diện | tối thượng · Ấn Thần | allEnemies | 1,9 · 0 · 0 | dispel 2 | Tuyệt kỹ: mặt sân tách ra lộ bầu trời sao, mọi kẻ địch bị đánh và mất hai trạng thái tốt. |
- star_sting: HÌNH xúc tu trong suốt có sao · PHẢI THẤY xúc tu vươn → chạm → mảnh không gian khựng, treo, tắt · NHỊP impact 600, end 1200 · KHÔNG vật liệu "thật".
- null_ripple: HÌNH vòng gợn tách màu lam / hồng ≥ 1/3 khung · PHẢI THẤY lõi đêm mở giữa sân → gợn lan qua từng địch lệch 80 ms, đốm sáng bị hút ra → lặng · NHỊP impact 850, end 1600 · KHÔNG khe nứt dựng đứng che mục tiêu.
- sky_unveiled: HÌNH khe nứt nằm ngang trên nền sân, trong là trời sao · PHẢI THẤY letterbox → nền sân tách ≥ 2/3 khung → hút → vặn → vỡ lên từng địch → lặng, khe khép · NHỊP impact 1150, end 3300 · KHÔNG giống `skill_ult_hk` (chuông); màu ngoài tím lam.
- Mở khóa: Ấn Khởi `lore_n2` (maps.json:3216 "chín con thú canh giữ, một con đã bị vết nứt tím che mất") + Lv 12 · Ấn Thức `riftBest ≥ 10` (Vết Nứt, decision 039) · Ấn Thần `nightmares ≥ 1` (con đó) + `riftBest ≥ 20`. Đề xuất lore mới: con thú bị che là Hư Không.
- Liên kết: trạng thái nguồn DARK → null_ripple / star_sting (Đêm Không Đáy). Khác anh em: duy nhất tách màu + mảnh khựng; lấp ô VOID × khống chế.

## C. Nghiệm thu (đánh số, reviewer kiểm)
1. Mỗi skill mới ≥ 8,0 theo §7, chấm trên lưới `reviewGrid.py` cỡ đầy đủ sau lần sửa cuối; ghi `docs/animation/vfx3d/SCORES.md`.
2. Tiêu chí 4 (chất liệu) = 2/2 mỗi skill: reviewer nêu ≥ 2 mục cột "Phải có" §4 của hệ thấy trên ảnh, 0 mục cột "Cấm".
3. Cỡ theo bậc (A3): Ấn Thức hình chủ đạo ≥ 1/3 bề ngang khung ở mốc impact; Ấn Thần: letterbox thấy ở mốc 1200–2400, sân đổi ≥ 2/3 khung ở mốc 1500 hoặc 1900, mốc 3300 nền giống mốc 0.
4. Mỗi PHẢI THẤY của §B thấy được, đúng thứ tự; số nhịp = `hits`; mục tiêu nhiều con lệch 80–160 ms.
5. Không mốc nào che mục tiêu quá 250 ms; chớp ≤ 2 / giây; FPS tuyệt kỹ nặng nhất mỗi lô ≥ 50 (`scripts/animation/fps.ts`).
6. `descVi` 10–24 từ, số khớp `hits` / `chance`; test `animScenario`, `i18n`, `battleFxContent` xanh.
7. Test mở khóa đỏ khi bỏ bất kỳ một điều kiện của một bước (D1).
8. `ADVENTURE_STATE_VERSION` vẫn 8; `saveVersions.test` xanh; save v8 có cờ sẵn nạp lên thấy đúng bước Ấn.
9. Bot trước / sau trong giới hạn A6 (bảng so ghi vào decision 065).
10. `npm run check` xanh (trừ đỏ cũ chuẩn §10).
11. `npm run skill:audit` sau lô cuối: mỗi hệ ≥ 10 (quy null theo dòng), 0 ô hệ × vai = 0.
12. `skills.json`: diff chỉ thêm hàng, 0 hàng cũ đổi; 0 skill mới thiếu liên kết (A4).
13. IP: chạy pha 1 `docs/IP_AUDIT_PROMPT.md` trên danh sách tên mới + 9 hình Ấn Thần, 0 nghi vấn.

## D. Test
1. `tests/unit/adventureSeals.test.ts`: mỗi dòng × 3 bước: đủ cờ → mở; bỏ từng cờ → đóng; Ấn Thức mở ⇒ ô Ấn chỉ có Ấn Thức.
2. Engine: Rage đầy có 2 tuyệt kỹ; dùng một thì cái kia khóa hết trận (đỏ nếu bỏ khóa chung).
3. `resolve`: 5 phản ứng mới kích đúng điều kiện, không kích khi thiếu; 6 phản ứng cũ giữ nguyên kết quả.
4. Hồi quy: `adventure.test.ts` (số ô mới), `saveVersions`, `battleFxContent` (mọi skill có kịch bản), bot `--seals all` chạy hết không lỗi.
5. Schema `seals.json`: id skill tồn tại, đúng dòng, bước 3 có `type: "ultimate"`.

## E. Ngoài phạm vi
Sửa / xóa / cân lại skill cũ; quái VOID / quái mới; Đài Phong Ấn, Sobi Essence, Bond tim (L2G:107-113); hiệu ứng gameplay của "đổi sân" (chỉ là hình); skill class mới; art sprite; âm thanh mới ngoài `adv_<hệ>_*` sẵn có; cá `fish_*`.

## F. Cần chủ dự án quyết
1. Duyệt đường chính A2 (ô Ấn + Ấn Thần dùng chung Rage), hay chọn (B) chỉ thay ô loài / (C) tự chọn (đổi save v9)?
2. Số tối thiểu 10 / hệ và tổng 34 skill mới?
3. 7 skill lấp thay ô loài: đồng ý loài / ô ở B1–B4 (mỗi loài mất 1 skill dòng)?
4. Tên ô "Ấn Hộ Thần" và 3 bước Khởi / Thức / Thần? (lore gọi "Guardian").
5. Bot: chấp nhận ±8 điểm (mặc định) / +12 (`--seals all`)?
6. Camera Ấn Thần: nếu `battleScript` chưa có act camera thì thêm act mới (đổi engine kịch bản) hay chỉ letterbox + rung?
7. 4 "đề xuất lore mới" (B2, B5, B8, B9) có được ghi vào lore?
8. Pilot NATURE trước, rồi DARK, LIGHTNING, FIRE, EARTH, METAL, LIGHT, WATER, VOID?

**Bản nháp ý chính decision 065 — "Ấn Hộ Thần và 34 skill mới (mở băng hẹp 021)":** mở băng chỉ cho: `seals.json` + schema, ô Ấn trong `fighters.ts`, luật Rage chung 1 tuyệt kỹ / trận cho Ấn Thần, 5 phản ứng mới, 34 skill đúng bảng §B, 7 thay ô loài; không đổi save (v8), không đổi skill cũ; mỗi lô 1 commit, bot trước / sau ghi vào decision; xong 9 lô thì đóng băng lại; thêm dòng "Lưu ý" vào decision 021.
