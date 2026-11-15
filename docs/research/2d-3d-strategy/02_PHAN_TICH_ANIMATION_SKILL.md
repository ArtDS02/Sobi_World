# 02 — Adventure chuyên sâu và phân tích animation skill

> Phần của bộ báo cáo chiến lược 2D / Hybrid / 3D (`docs/research/PROMPT_2D_3D_STRATEGY.md`). Ngày viết: 2026-11-11. Chỉ đọc repo, không chạy game, không chạy `npm run check`.
> Nhãn: **[DỮ LIỆU]** = đọc được trong repo (kèm đường dẫn, số dòng khi có) · **[NHẬN ĐỊNH]** = suy luận của người viết từ dữ liệu · **[GIẢ ĐỊNH]** = chưa có căn cứ trong repo.
> Ba phương án: **A** = toàn bộ 2D nâng cấp · **B** = hybrid (riêng Adventure 3D) · **C** = toàn bộ 3D. Báo cáo này không mặc định 3D tốt hơn.

## 0. Cách đọc tài liệu nguồn (để biết mức tin cậy)

| Nguồn | Cách đọc |
|---|---|
| `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md` (1802 dòng; viết tắt **FINAL**) | Đọc toàn văn, từng dòng. |
| `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_filled_new.md` (2624 dòng; viết tắt **FILLED**) | Dòng 1–330 đọc nguyên văn. Dòng 330–2475 (112 khối skill) đọc bằng cách tách các dòng lặp y nguyên giữa các khối (đếm số lần lặp) rồi đọc toàn bộ phần không lặp của từng skill (tiêu đề, người dùng, loại, "Ý tưởng", thời lượng, asset) cộng vài khối nguyên văn làm mẫu (`skill_mm_poison_thorn`, `skill_ult_nh`). Phụ lục (dòng 2476–2624) đọc nguyên văn, trừ phần giữa bảng hạt đọc lướt. Lý do: file vượt giới hạn đọc một lần; các dòng bị bỏ là dòng trùng nguyên văn. |
| `docs/decisions/040, 042, 044, 049, 050, 051` | Đọc toàn văn. |
| `docs/animation/rig/{AUDIT,ARCHITECTURE,HANDOFF,ROADMAP,ACCEPTANCE}.md`, `docs/animation/{animation_style_guide,integration_spec,technical_pipeline,sobi_adventure_audit,COMBAT_ART_GUIDE}.md` | Đọc toàn văn (dòng dài bị cắt ở ~450 ký tự). |
| `docs/animation-review/` | Rubric: 7 tiêu chí + mục lục. `ANIMATION_REVIEW_FEEDBACK.md`: tóm tắt điều hành (dòng 16–47) + tìm theo từ khoá. Vòng mới nhất `rounds/round-04/FEEDBACK.md`: toàn văn. |
| `docs/SOBI_WORLD_ANIMATION_SPEC.md` | Mục lục + §15–§25 (Adventure). Các phần khác chưa đọc. |
| `content/adventure/*.json`, `content/anim/rigs/*.json` | Đọc bằng script đếm (số skill, số act, body, clip), không đọc từng dòng. |
| Code `src/areas/adventure/ui/battlePerf.ts`, `src/systems/animation/warp.ts`, `content/schemas/adventure/battlePoses.ts` | Toàn văn. Các file khác: phần đầu hoặc grep. |

## 1. Adventure hiện tại

### 1.1 Khám phá, di chuyển, bản đồ

- [DỮ LIỆU] Bản đồ khám phá vẽ bằng Phaser; 3 vùng × 3 khu, mỗi khu 4–5 nhóm quái, khu 1–2 có kẻ canh khu, khu 3 có trùm (`docs/animation/sobi_adventure_audit.md:9`, `:29`).
- [DỮ LIỆU] Người dẫn (So / Bi) đi bằng phím trên lưới; ba bạn đồng hành đi theo vệt (`src/areas/adventure/scene/walker.ts:1-2`). Chu kỳ bước của người dẫn là 4 nhịp từ 3 khung (`walk1, idle, walk2, idle`, `walker.ts:13`), 4 hướng; bạn đồng hành là **một ảnh tĩnh** nhún theo nhịp (`docs/animation-review/ANIMATION_REVIEW_FEEDBACK.md:752`, `:800`).
- [DỮ LIỆU] Review chấm "Map movement" 4/10 ở bản gốc (`ANIMATION_REVIEW_FEEDBACK.md:38`); vòng 4 nhóm Map **chưa chấm** vì chỉ có ảnh tĩnh (`docs/animation-review/rounds/round-04/FEEDBACK.md:35`).
- [NHẬN ĐỊNH] Đây là chỗ sinh vật phải đổi **góc nhìn** thật (lên / xuống / trái / phải). Với 2D, mỗi góc là một bộ tranh; bạn đồng hành hiện chỉ có tranh nhìn ngang.

### 1.2 Chiến đấu

- [DỮ LIỆU] Theo lượt, thứ tự theo Tốc độ; engine thuần, tất định theo (seed, số hành động) (`src/systems/combat/engine.ts:1-4`). Một hành động của người chơi chạy luôn mọi lượt địch tới khi lại tới lượt ta (`sobi_adventure_audit.md:33`).
- [DỮ LIỆU] Đội tối đa 3 (`content/adventure/balance.json` → `team.max = 3`). Hành động: đánh thường, kỹ năng, Tuyệt kỹ, vật phẩm, Phòng thủ (`src/systems/combat/types.ts:188-192`).
- [DỮ LIỆU] Trình bày: một bước trận cắt thành **beat**; mỗi beat có `start / cast / release / impact / end` (`src/areas/adventure/ui/battleMotion.ts:10-27`). Tổng một bước ≤ 5600 ms, x2 = ×0,55 (`content/adventure/battle_fx.json` → `pacing`).
- [DỮ LIỆU] Animation **không bao giờ quyết định gameplay**: trận tính xong trước, animation chỉ đọc sự kiện (`docs/decisions/040-battle-motion.md:10`, `docs/decisions/044-battle-animation-scripts.md:43`). Spec cũng yêu cầu "Gameplay timing là authoritative" (`docs/SOBI_WORLD_ANIMATION_SPEC.md` §20, dòng 1057 trở đi).
- [NHẬN ĐỊNH] Vì trận theo lượt, sân nhìn ngang, hai phe đứng cố định, mọi mô tả trong FINAL đều viết cho **một góc máy cố định** ("mô tả viết cho phe ta (đánh sang phải)", FINAL:14). Tài liệu không đòi camera xoay quanh.

### 1.3 Chiến binh, quái, boss

- [DỮ LIỆU] Chiến binh là heo (Farm) và cá (Aquarium): 20 loài heo + 2 loài cá có cờ `fighter` (`content/farm/species.json`, `content/aquarium/fish.json`; đếm bằng script). 21 con có đủ 6 key pose (`docs/animation/rig/HANDOFF.md:6`).
- [DỮ LIỆU] Quái: `content/adventure/enemies.json` hiện có **33** mục (22 quái đất liền + 7 quái biển + 4 biến thể rương giả). Tài liệu animation chỉ phủ 22; quái biển chưa có key pose (`HANDOFF.md:45`).
- [DỮ LIỆU] Kỹ năng **không gắn theo loài** mà theo 9 dòng First Guardian và 4 lớp: "Unique Skill và Ultimate theo 9 dòng First Guardian… Không viết 4 skill cho từng giống" (`docs/decisions/037-adventure-v2.md:12`).
- [NHẬN ĐỊNH — quan trọng] FINAL mô tả động tác theo **thân của Guardian** ("rùa húc", "xoay xúc tu tròn trên đầu", "cua đi ngang", "sứa co lại": FINAL:392, :469, :717, :846), nhưng con thực sự diễn là một con heo hoặc cá thuộc dòng đó. Thân Guardian chỉ xuất hiện đúng nghĩa ở dạng **vật thể triệu hồi** của tuyệt kỹ (`fxp_whale`, `fxp_octo_tentacle`, `fxp_turtle_mountain`). Decision 050 đã xử lý bằng "cử chỉ": cùng một cử chỉ, mỗi thân diễn theo cách của mình (`docs/decisions/050-puppet-rig-animation.md:26`). Điểm lệch này tồn tại ở cả 2D lẫn 3D và cần chủ dự án xác nhận (mục cuối).

### 1.4 Kỹ năng, nguyên tố, phản ứng

- [DỮ LIỆU] 112 skill (`content/adventure/skills.json`): 48 dòng máu + tuyệt kỹ, 32 lớp, 32 quái (FINAL:317, :943, :1361). 9 hệ + Không hệ (`content/adventure/elements.json`). 25 trạng thái (FINAL:186–260). 6 phản ứng nguyên tố (`content/adventure/reactions.json`; FINAL:264–275).
- [DỮ LIỆU] Kỹ năng lớp mang hệ của người dùng: màu, hạt, vụ nổ lấy theo hệ (FINAL:13, bảng "Hạt theo hệ" FINAL:301–313).

### 1.5 Animation đã triển khai tới đâu

| Lớp | Thiết kế trên giấy | Đã chạy trong code | Căn cứ |
|---|---|---|---|
| Kịch bản skill (VFX, vật thể, màn hình, âm) | 112 skill × 4 pha (FINAL mục 7) | 112/112 skill có `script` trong `battle_fx.json`, tổng 1640 act; 26 hành động chung, 25 trạng thái, 6 phản ứng | [DỮ LIỆU] đếm trên `content/adventure/battle_fx.json`; `docs/PROGRESS.md:10` |
| 20 khả năng engine (Phụ lục C) | FINAL:1781–1802 | Có đủ dưới dạng act: `stop`, `punch`, `tint`, `cutin`, `prop`, `strip`, `beam`, `tether`, `cone`, `decal`, `marker`, `trail`, `split`… | [DỮ LIỆU] `decisions/044…:12-30` |
| Thư viện kịch bản 7 mục | 169 kịch bản | 168 còn `draft`, 1 `built` | [DỮ LIỆU] `PROGRESS.md:10` |
| Thân sinh vật | FINAL mô tả động tác thân ở pha 1 của hầu hết skill | 44 rig; 43 con chạy **pose to pose** trên 6 key pose, lưới chỉ thêm lấy đà / nén giãn / chân bám đất / đầu trễ; 25 clip **chung** sinh từ một script | [DỮ LIỆU] `decisions/050…:64-74`; `HANDOFF.md:26` |
| Cử chỉ skill | — | 10 cử chỉ (`shoot, breath, summon_ground, summon_sky, channel, brace, slam, charge, lash, roar`); 8/112 skill khai `gesture`, còn lại suy từ kịch bản / cách ra đòn | [DỮ LIỆU] `content/schemas/adventure/battlePoses.ts:8`; `src/areas/adventure/ui/battlePerf.ts:48-72` |
| Clip riêng cho skill (`skill_<id>`) | Nhiều skill có động tác độc nhất | **0 clip**: mọi rig có đúng 25 clip chung | [DỮ LIỆU] đếm `content/anim/rigs/*.json`; `decisions/050…:33` ("Chưa làm") |
| Flipbook khoảnh khắc tuyệt kỹ | — | Chưa làm | [DỮ LIỆU] `docs/animation/rig/ACCEPTANCE.md:35` |
| Chớp mắt, đổi biểu cảm ngoài 6 tranh | FINAL:63 "mắt nhắm", :1069 "nheo một mắt" | Không có: "không vẽ gì đè lên mặt, idle không chớp mắt" | [DỮ LIỆU] `decisions/050…:70` |
| Thắng trận, hồi sinh, vào trận | FINAL:31–38, :166–182 | Có action `victory`, `revive`, `enter_ally`, `enter_enemy`, `boss_phase` | [DỮ LIỆU] khoá `actions` của `battle_fx.json` |

Hai ví dụ cho thấy khoảng cách giữa giấy và code ở **lớp thân**:

- [DỮ LIỆU] `skill_cl_combo`: thiết kế là "đấm, xoay đá, nhảy đập… lộn ngược về chỗ" (FINAL:1080–1085). Kịch bản đang chạy dùng `pose attack` + `move dash` + `move spin` + `move hop` (đọc từ `battle_fx.json` → `skills.skill_cl_combo.script`), tức xoay và nhấc **cả ảnh**.
- [DỮ LIỆU] `skill_cl_taunt`: thiết kế là "quay lưng lắc mông 3 nhịp, lè lưỡi" (FINAL:952). Kịch bản đang chạy dùng `move cast_bow` cho người dùng.

### 1.6 Hiệu ứng đánh, trúng, trạng thái

- [DỮ LIỆU] Đã có: hit-stop theo bậc (light 50 / medium 80 / heavy 120 / ultimate 220 ms), slow-mo, rung có hướng, letterbox, vignette (`ANIMATION_REVIEW_FEEDBACK.md:824`); hạt GPU trần 420; biểu tượng trạng thái cạnh đầu tối đa 3 (`decisions/044…:37`).
- [DỮ LIỆU] Phản ứng mục tiêu: 3 bậc `hit / hit-heavy / hit-crit` ánh xạ sang clip `hurt / hurt_heavy / hurt_crit` (`battlePerf.ts:16-25`), nhưng `hurt_crit` rơi về `hurt_heavy` (`docs/animation/rig/ARCHITECTURE.md:56`), và mọi con dùng cùng bộ clip chung.

### 1.7 Vấn đề về độ sống động và đồng bộ, và cách giải

Cột "2D giải được?" so với pipeline 2D **đã nâng cấp** (pose to pose + cử chỉ + flipbook + kịch bản), không so với hiện trạng.

| # | Vấn đề | Căn cứ | 2D giải được? | 3D có thật sự cần? |
|---|---|---|---|---|
| V1 | Thân là ảnh phẳng; chuyển động thân là biến đổi cả ảnh | [DỮ LIỆU] `rig/AUDIT.md:9` | Một phần: lưới skin thêm lấy đà, nén giãn, đầu trễ (`decisions/050…:69`). Bản cắt bộ phận cho chuyển động tốt nhưng **nét xấu** nên bị bác (`HANDOFF.md:11-13`) | [NHẬN ĐỊNH] 3D giải dứt điểm phần "bộ phận chuyển động lệch nhau" **nếu** model đạt chất lượng hình. Rủi ro hình là thật: lần thử dựng 3D rồi render ra 2D đã không qua cổng "đẹp hơn bản cũ" (`decisions/051…:38-41`) |
| V2 | Đổi key pose là nhảy hình; 6 tranh AI không cùng tỉ lệ, góc nhìn | [DỮ LIỆU] `rig/AUDIT.md:10`; hiện hoà 70 ms, "không có khung trung gian" (`decisions/050…:74`) | Có, bằng tranh trung gian (`windup` đã thử 2 con, `HANDOFF.md:42`). Giới hạn: AI vẽ lại thì lệch nhận diện giữa các khung (`PROGRESS.md:89`) | [NHẬN ĐỊNH] Đây là lợi thế cấu trúc của 3D: một model, mọi tư thế nội suy liên tục, không lệch nhận diện |
| V3 | Một bộ clip cho mọi loài; khác nhau ở `tempo` / `weight` | [DỮ LIỆU] `HANDOFF.md:26`; `rig/AUDIT.md:12` | Có: clip theo body plan, clip riêng theo con (schema đã cho phép) | Không cần. 3D cũng phải làm clip theo body plan |
| V4 | Skill có cá tính ở VFX, không ở thân | [DỮ LIỆU] `rig/AUDIT.md:11`; 0 clip `skill_<id>` | Một phần: 10 cử chỉ; động tác độc nhất cần thêm tranh | [NHẬN ĐỊNH] 3D giúp ở nhóm skill có động tác thân phức tạp (mục 5: khoảng 16 % skill ở mức vừa trở lên), không giúp ở phần còn lại |
| V5 | Hình chủ đạo của VFX là ảnh tĩnh chỉ được tween: 64/112 skill | [DỮ LIỆU] `decisions/049…:4` | Có: flipbook + ripple (Phaser Rope) đã chứng minh ở sóng thần (`decisions/049…:33-36`); 22/23 dải VFX đã lên 8 khung 24 fps (`decisions/051…:56-58`) | Không. Đây là việc VFX 2D; 3D không tự giải |
| V6 | Không chớp mắt, biểu cảm chỉ có trong 6 tranh | [DỮ LIỆU] `decisions/050…:70` | Có nếu có tranh mặt được duyệt; bản vẽ nét bằng code đã bị bác "cẩu thả" (`decisions/050…:65`) | [NHẬN ĐỊNH] 3D cần blendshape hoặc mặt dạng texture đổi khung; cũng là việc art phải làm, không miễn phí |
| V7 | Đòn nhiều nhát chỉ có một mốc `impact` | [DỮ LIỆU] schema `timing = { release, impact, end }` (`content/schemas/adventure/battleFx.ts:86`); `skill_cl_combo` đặt `impact: 220` trong khi các nhát ở 220 / 470 / 720 | Có: là việc dữ liệu (mục 7) | Không liên quan 2D / 3D |
| V8 | Đồng bộ thân ↔ số sát thương | [DỮ LIỆU] Đã giải: clip được warp theo mốc để `contact` trùng `impact` (`src/systems/animation/warp.ts:14-46`; `ACCEPTANCE.md:16`) | Đã có | Không. Cơ chế warp dùng lại được cho clip 3D |
| V9 | Bạn đồng hành trên bản đồ là ảnh tĩnh; người dẫn 3 khung × 4 hướng | [DỮ LIỆU] `ANIMATION_REVIEW_FEEDBACK.md:752`, `:800` | Tốn: mỗi hướng một bộ tranh cho từng loài | [NHẬN ĐỊNH] **Lợi ích 3D rõ nhất của Adventure nằm ở đây**, không nằm ở sân trận |
| V10 | Cảm giác khi chơi chưa được xác nhận | [DỮ LIỆU] Vòng 4: "không còn blocker hay major", điểm 72–80 dưới mục tiêu 80–90 vì C2 / C5 chờ playtest (`round-04/FEEDBACK.md:24-39`); A11 "chưa playtest trận thật" (`ACCEPTANCE.md:24`) | — | [NHẬN ĐỊNH] Vòng 4 chấm **trước** decision 050; chưa có vòng review nào cho bản pose to pose. Không nên quyết 3D dựa trên điểm cũ |

[NHẬN ĐỊNH] Tóm lại: trong 10 vấn đề, 3D có lợi thế cấu trúc ở V1, V2, V9; trung tính ở V3, V6; không liên quan ở V5, V7, V8, V10.

## 2. Kiểm kê tài liệu animation

### 2.1 Số lượng

| Hạng mục | Số | Căn cứ |
|---|---|---|
| Skill được mô tả | 112 = 36 dòng máu + 12 tuyệt kỹ + 32 lớp + 32 quái | [DỮ LIỆU] FILLED:285–287, :1001, :1240, :1854; FINAL gộp 36 + 12 thành 7A (FINAL:317) |
| Tuyệt kỹ | 12 = 9 dòng + 3 riêng (`PIG_PHOENIX`, `PIG_POSEIDON`, `PIG_MYTHICAL`) | [DỮ LIỆU] FINAL:904–941 |
| Skill boss đổi pha | 3 (`skill_e_thorn_storm`, `skill_e_meteor`, `skill_e_seal_quake`) | [DỮ LIỆU] FINAL:1519, :1649, :1766 |
| Hành động chung + phản ứng | 18 mục ở FINAL (idle, vào trận, đánh thường, thủ, 3 kiểu mất lượt, vật phẩm, trúng, trúng mạnh, né, hồi máu, buff, debuff, mất máu đầu lượt, KO, hồi sinh, thắng) | [DỮ LIỆU] FINAL:22–182 |
| Trạng thái | 25, mỗi cái có "lúc gắn" và "khi còn hiệu lực" | [DỮ LIỆU] FINAL:186–260 |
| Phản ứng nguyên tố | 6 | [DỮ LIỆU] FINAL:264–275 |
| Kiểu ra đòn (khung chung) | 6: melee, slam, projectile, burst, aura, ultimate | [DỮ LIỆU] FINAL:279–284 |
| Kiểu ra đòn ghi ở từng skill | 23 nhãn (bảng mục 3) | [DỮ LIỆU] đếm dòng "Kiểu ra đòn" của FINAL |
| Người dùng được nêu | 9 dòng Guardian, 4 lớp, 22 quái (3 là boss), 3 heo có tuyệt kỹ riêng | [DỮ LIỆU] dòng "Ai dùng" của FINAL |

[DỮ LIỆU] Tài liệu **không** có mục riêng cho từng Animal: không có bảng "loài X diễn skill Y thế nào". Thân chỉ được phân theo kiểu thân.

### 2.2 Body plan

| Nguồn | Danh sách | Ghi chú |
|---|---|---|
| FILLED:16, `battle_fx.json` → `bodies` | `quadruped, aquatic, flyer, floater, sprout, heavy` (6) | Chỉ khác chu kỳ thở, độ nhún, độ lao |
| FINAL:27, :45, :99, :180 | bốn chân, bay, bơi, lơ lửng, nặng | Có động tác riêng theo thân cho idle, đánh thường, bị trúng, thắng |
| `battle_fx.json` → `creatures` (33 mục khai thân) | heavy 12, floater 8, flyer 6, aquatic 4, sprout 3; còn lại mặc định bốn chân | [DỮ LIỆU] đếm bằng script |
| Rig (`rig/ARCHITECTURE.md:80`) | Thiết kế 8 plan: `quadruped, biped, heavy, aquatic, cephalopod, flyer, floater, small` | Thực tế 44 rig chỉ dùng 4: quadruped 30, heavy 6, cephalopod 6, aquatic 2 (đếm `content/anim/rigs/`) |

[NHẬN ĐỊNH] Chưa có rig nào mang plan `flyer` hay `biped` dù có 6 sinh vật khai thân bay và nhiều heo đứng hai chân trong tranh cast (`rig/AUDIT.md:10`). Chim đang dùng clip của heo rừng (`decisions/050…:59`). Đây là khoảng trống ở cả hai hướng 2D và 3D.

### 2.3 FINAL và FILLED khác nhau ở đâu

| Điểm | FILLED (bản cũ, 2026-10-27) | FINAL (bản thay thế) |
|---|---|---|
| Nguồn | Sinh tự động từ dữ liệu game, có dòng "Hiện tại" chi tiết cho từng skill (FILLED:3–5) | Sinh từ `_design/*.mjs`, "không sửa tay" (FINAL:3) |
| Nhịp từng skill | Một khuôn: gần như mọi skill 0–250 / 250–750 / 750 / 950–1400 ms; dòng "Pha 1" lặp nguyên văn 30 lần, "Pha 4" 36 lần, "Âm thanh" 63 lần (đếm) | Nhịp riêng từng skill, 950–3500 ms (FINAL:4 tự nhận xét bản cũ "chép một khuôn") |
| Mục 4 phản ứng nguyên tố | Cả 6 mục chép nhầm nội dung "Thắng trận" (FILLED:188–224) | Viết riêng từng phản ứng (FINAL:264–275) |
| Mục 5 kiểu ra đòn | Bảng hiện trạng, phần "Mong muốn" để trống (FILLED:236–242) | Điền 6 kiểu (FINAL:279–284) |
| Động tác thân | Chung: "thân nén xuống rồi giật ngược lấy đà" | Riêng: "phồng má 2 lần", "rụt cổ vào mai", "cào đất 2 lần"… |
| Asset | Thư viện 40 dải `fx_*` 4–7 khung 256² (FILLED:2534–2580), 14 burst hạt mới | Bốn họ: `fxp_*` vật thể, `fx_*` 4 khung, `fxs_*` hạt, `st_*` biểu tượng (FINAL:7) |
| Engine cần thêm | 18 khả năng (FILLED:2603–2624) | 20 khả năng, có số chỗ dùng (FINAL:1781–1802) |
| Giá trị còn lại | Dòng "Animation hiện tại" là ảnh chụp hiện trạng trước decision 044; bảng 51 chùm hạt (FILLED:2476–2530) | Là bản thiết kế đang được code theo (`decisions/044…:4`) |

[DỮ LIỆU] FINAL:5 và `PROMPT_thiet_ke_animation.md:21` lấy "tinh thần" của một game bên thứ ba làm phong cách tham khảo. Decision 049 xếp nguồn đó vào loại `R` (chỉ nghiên cứu nguyên lý, không lưu ảnh, `decisions/049…:10`). Báo cáo này không dùng nguồn đó làm chuẩn.

## 3. Phân tích theo nhóm skill

Nhóm theo đúng nhãn "Kiểu ra đòn" của FINAL. Số trong ngoặc là số skill. Thời điểm tính bằng ms từ đầu nhịp.

### 3.1 Cận chiến: `melee` (11), `dash_through` (2), `spin_roll` (1), `vanish` (2), `whip` (1), `exit_top + dive` (1)

- **Khung chung** [DỮ LIỆU] FINAL:279: lấy đà 180–250 (lùi + nén) → dash đường thẳng thấp → khựng hình lúc chạm → nảy về theo vồng thấp, 2 bóng mờ.
- **Giai đoạn và bộ phận**:
  - Đánh thường khác theo thân: bốn chân húc đầu, bay mổ 2 nhát cách 90 ms, bơi quẫy đuôi tát, nặng đấm từ trên xuống (FINAL:45). Bốn động tác này dùng bốn bộ phận khác nhau (đầu, mỏ, đuôi, tay).
  - `skill_cl_combo` (FINAL:1075–1086): ba động tác khác nhau trong 500 ms (đấm 220, xoay người đá 470, nhảy đập 720), rồi lộn ngược về. Hit-stop 40 / 40 / 100.
  - `skill_tg_steel_slash` (FINAL:644–655): rút kiếm bên hông, nhún thấp, lao xuyên, khựng 140, **tra kiếm lúc 600 rồi mục tiêu mới phản ứng**. Sát thương đọc được ở động tác tra kiếm, không ở lúc chạm.
  - `skill_tg_steel_charge` (FINAL:683–694): cào đất 2 lần, cuộn tròn xoay 720°, lăn, bật ngược, xòe ra, lắc đầu.
  - `skill_hg_hot_claw` (FINAL:709–720): giơ càng, đi ngang lạch bạch; cú kẹp là vật thể `fxp_crab_claw`.
  - `skill_e_tusk_charge` (FINAL:1467–1478): cào đất 3 lần, khói mũi, lao, phanh trượt.
  - `skill_e_spark_peck` (FINAL:1389–1400): xù lông, lao zig-zag, mổ 2 nhát 380 / 470, 3 lông rơi.
  - `skill_cl_shadow_dance`, `skill_e_shadow_bite` (FINAL:1140, :1454): mờ dần, hiện quanh / sau lưng mục tiêu.
- **Anticipation**: 200–420 ms; dài nhất ở đòn húc (cào đất).
- **Impact**: 330–800; hit-stop 40–160; nhát cuối luôn nặng nhất.
- **Recovery**: 400–900 ms, luôn có động tác (lộn về, phanh, lắc đầu, tạo dáng `victory` 250 ms ở `skill_cl_finisher`, FINAL:1137).
- **Riêng hay chung**: [NHẬN ĐỊNH] Đánh thường và kỹ năng lớp phải chạy trên **mọi thân** (heo, cá, và về sau loài khác), nên cần bộ clip theo body plan: `strike_head`, `strike_peck`, `strike_tail`, `strike_overhead`. Combo, rút / tra kiếm, cuộn lăn là clip đặc thù. Không thể thay bằng VFX: tài liệu ghi rõ đó là động tác thân.

### 3.2 Dậm, rơi: `slam` (3), `fall` (4), boss `fall` (1)

- **Khung chung** [DỮ LIỆU] FINAL:280: squash 120 → nhảy 90 px → bóng báo trước → rơi nhanh gấp đôi lúc lên → vết nứt + sóng đất → mục tiêu nảy lần lượt.
- **Bộ phận**: `skill_qs_quake` nhấc hai chân trước, giữ 140 ms, dậm (FINAL:430–431). `skill_cl_stomp` nhấc chân rất cao, giữ 150, thân run (FINAL:1017). `skill_cl_tremor` đập đất 3 nhịp (FINAL:1043). Nhóm `fall`: người dùng chỉ giơ tay / càng (`skill_hg_inferno_hammer` FINAL:755, `skill_e_rock_slam` FINAL:1604); vật rơi là `fxp_*`.
- **Impact**: 400–1100; hit-stop 60–130; rung 8–14 (mạnh nhất tài liệu). Mục tiêu dẹp `sy 0.5` 150 ms rồi bật như lò xo (FINAL:757).
- **Riêng hay chung**: [NHẬN ĐỊNH] Chung theo body plan (`g_slam` đã có). Phản ứng "dẹp như bánh" là squash cực đại: 2D làm tự nhiên; 3D cần xương scale không đều, dễ lộ méo lưới.

### 3.3 Phóng chiêu: `projectile` (11), `beam` (4), `strike` (1), `chain` (1), `stretch` (1), `tether` (1)

- **Khung chung** [DỮ LIỆU] FINAL:281: đạn hiện ở tay / miệng và lớn dần → phóng có giật lùi 10 px → quỹ đạo riêng (thẳng, vồng, lượn, nảy, lăn) → nổ.
- **Bộ phận**: phồng má 2 lần, bong bóng nổi từ miệng (`skill_nh_bubble` FINAL:326); phồng túi mực, mắt nheo (`skill_dm_ink` FINAL:456); lắc đầu, 3 gai mọc trên lưng (`skill_mm_poison_thorn` FINAL:781); sừng tích điện (`skill_ld_thunder_strike` FINAL:586); cúi đầu, mũ sắt lóe (`skill_tg_armor_break` FINAL:677); vẽ 3 rune trên không (`skill_cl_seal` FINAL:1225).
- **Điểm phát**: miệng, sừng, đèn trên tay, lưng. Engine đã có neo `mouth`, `tail` (`decisions/050…:30`), mới chuyển 1 skill (`ACCEPTANCE.md:37`).
- **Impact**: 440–800; đạn mới là vật mang cá tính (bong bóng nảy 2 lần, mực lượn chữ S, đá lăn 2 vòng).
- **Riêng hay chung**: [NHẬN ĐỊNH] Thân dùng chung 2–3 cử chỉ theo body plan (`shoot`, `breath`, `channel`). Phần riêng nằm ở vật thể và quỹ đạo, vốn là 2D thuần.

### 3.4 Phun hình nón: `cone` (3)

- [DỮ LIỆU] `skill_e_poison_spore` phồng 1,2×, mặt đỏ, xẹp lại khi phun (FINAL:1383–1384); `skill_e_frost_breath` hít sâu, má phồng (FINAL:1591); `skill_e_magma_breath` ngửa cổ, cổ họng sáng đỏ dần (FINAL:1630).
- [NHẬN ĐỊNH] Phồng / xẹp là squash & stretch; ngửa cổ là xoay trong mặt phẳng. Clip `g_breath` theo body plan là đủ.

### 3.5 Diện rộng: `burst` (12), `sweep` (1), `rain` (1), `curse` (1), boss `sweep` / `burst` (2)

- **Khung chung** [DỮ LIỆU] FINAL:282: mỗi skill có một vật thể / hiện tượng trên phe địch (mây, lưới, cổng, cột nước) rồi đánh từng con lệch nhau.
- **Thân**: gần như luôn là pose `cast` + một cử chỉ ngắn (cắm càng xuống đất FINAL:742; tung 4 xúc tu FINAL:482; xoay tròn chậm rồi nhanh FINAL:885).
- **Impact**: 700–1700, `stagger` 60–160 ms giữa các mục tiêu (dùng ở 38 chỗ, FINAL:1795).
- **Phản ứng mục tiêu riêng**: bị ép thấp `sy 0.85` (lưới), bị hất 40 px (gai đá), nhảy cẫng 2 lần vì nóng (dung nham), nghiêng về tâm 20 px rồi bị hất ra (xoáy), ho (bào tử).
- **Riêng hay chung**: [NHẬN ĐỊNH] Thân người dùng chung. Điều đáng chú ý là **hit reaction có ngữ nghĩa** (bị nóng, bị trói, bị hút, bị ép): cần 5–6 clip phản ứng theo body plan thay cho một `hurt`.

### 3.6 Hỗ trợ: `aura` (22), `self` (13)

- **Khung chung** [DỮ LIỆU] FINAL:283: người dùng làm động tác riêng (hát, cầu nguyện, gồng) → vật thể bay tới / trồi lên ở từng đồng đội → biểu tượng trạng thái bật lần lượt.
- **Bộ phận** (nhóm này có nhiều "diễn xuất" nhất):
  - `skill_cl_taunt`: quay lưng lắc mông 3 nhịp, lè lưỡi (FINAL:952).
  - `skill_cl_second_wind`: thở dốc → hít sâu phồng 1,12× → thở ra "phù" (FINAL:991–993).
  - `skill_cl_focus`: ngồi xuống, bay lên 8 px, mắt nhắm (FINAL:1173).
  - `skill_cl_aim`: nheo một mắt, nghiêng đầu (FINAL:1069).
  - `skill_cl_dash`: chạy một vòng quanh sân, phanh két, tai / đuôi bay phần phật (FINAL:1109–1110).
  - `skill_cl_cheer`: nhảy cổ vũ 2 cái (FINAL:1277). `skill_e_howl`: ngửa cổ −15° (FINAL:1448). `skill_e_stone_guard`: đập ngực 2 cái (FINAL:1669).
  - `skill_hg_forge_fire`: nện búa lên đe 3 lần (FINAL:730).
- **Phản ứng đồng đội**: khuỵu nhẹ "như đeo ba lô nặng" (FINAL:419), chạy tại chỗ 3 bước (FINAL:601), cả đội đồng loạt nhảy 20 px (FINAL:1318).
- **Mốc**: 600–1250; ít rung, không hit-stop (trừ tuyệt kỹ buff).
- **Riêng hay chung**: [NHẬN ĐỊNH] 16 trong 35 skill nhóm này là kỹ năng lớp, tức phải diễn trên mọi thân. Các động tác "quay lưng", "ngồi thiền", "nheo một mắt" không có trong 6 key pose. Đây là nhóm lộ rõ nhất giới hạn của pose to pose.

### 3.7 Tuyệt kỹ: `ultimate` (12)

- **Khung chung** [DỮ LIỆU] FINAL:284: cut-in 500 → nền đổi màu theo hệ → vật thể khổng lồ → 2–3 nhịp tăng dần → nhịp cuối khựng 120 + zoom + chớp → dư âm 400–600. Tổng 2,8–3,5 s (FINAL:10).
- **Ai diễn**: 10/12 là "ultimate (summon)": vật thể diễn chính, người dùng gần như không có động tác được mô tả. Ngoại lệ: rùa bước lên trước, gầm, scale 1,15 (FINAL:445); người dùng bùng lửa (FINAL:912).
- **Vật thể có chuyển động nội tại**: cá voi "đuôi vẫy chậm", phun vòi nước, quẫy đuôi (FINAL:379–380); 4 xúc tu "đan chéo nhau", kéo lưới, siết (FINAL:509–510); phượng hoàng bay một vòng lớn, "khép cánh thành kén", lao quét, bay ngược lên rắc lông (FINAL:912–913); 3 kỵ binh giơ thương, phi qua (FINAL:704–705); lồng đèn "xoay chậm" (FINAL:574); cây mẹ "lá rung" (FINAL:834).
- **Camera**: chỉ cut-in, `camera_punch` 1,04–1,06×, `bg_tint`, letterbox. Không có lia hay xoay máy.
- **Riêng hay chung**: [NHẬN ĐỊNH] Mỗi tuyệt kỹ là một màn dựng riêng; phần dùng chung chỉ là khung đạo diễn (cut-in, nền, nhịp, outro) và clip `ultimate` của thân.

### 3.8 Boss đổi pha (3)

- [DỮ LIỆU] `boss_phase` 600 ms: tối màn, boss rung + tô màu, khung đỏ mờ (FINAL:1801). Động tác: cây gầm, lá đổi đỏ cam, 24 gai xoay như cối xay (FINAL:1526–1527); rồng bay vụt khỏi màn rồi hạ cánh trở lại (FINAL:1656–1659); hộ pháp đặt hai tay xuống đất, mắt sáng (FINAL:1773).
- [DỮ LIỆU] Clip `phase` cho boss chưa có (`rig/ROADMAP.md:11`).

### 3.9 Hành động chung, trạng thái, phản ứng nguyên tố

- [DỮ LIỆU] Phần lớn là squash & stretch và đổi màu: đáp đất bẹp 0,85 rồi bật 1,05 (FINAL:36); xìu `scaleY 0.92` (FINAL:144); chí mạng "khựng 120 ms (mắt tròn xoe)" rồi văng 44 px, nảy 2 lần (FINAL:108); KO "xoay 1 vòng nhỏ tại chỗ", ngồi bệt mắt xoắn ốc (FINAL:162); Điện Giật lộ "bộ xương kiểu hoạt hình" bằng tô thân trắng (FINAL:265).
- [NHẬN ĐỊNH] Đây là ngôn ngữ hoạt hình 2D cổ điển. Trong 3D, "lộ bộ xương", "dẹp như bánh", "mắt xoắn ốc" đều phải dựng riêng (shader, đổi texture mặt, xương scale).

## 4. So sánh ba cách thể hiện

### 4.1 Sprite sheet 2D (vẽ từng khung)

Ước lượng số khung cho **một** sinh vật nếu làm đúng FINAL ([GIẢ ĐỊNH] về số khung; danh mục lấy từ mục 3):

| Bộ | Khung |
|---|---|
| idle 6 + 2 thói quen × 6 | 18 |
| vào trận 5, thủ 4, né 5, dùng vật phẩm 5 | 19 |
| đánh thường (lấy đà 3, lao 2, chạm 1, về 3) | 9 |
| 10 cử chỉ × 7 | 70 |
| hurt 4, hurt nặng 6, 5 phản ứng có ngữ nghĩa × 4 | 30 |
| KO 6, hồi sinh 5, thắng 8, choáng 4 | 23 |
| clip `ultimate` | 10 |
| **Cộng một con, một góc nhìn** | **~170** |
| Kỹ năng lớp có động tác độc nhất (taunt, combo, dash, focus, aim…) × ~6 khung | +50 |

- [DỮ LIỆU] Ước lượng của chính dự án: 44 sinh vật × 7 trạng thái × 6–8 khung ≈ 2.000 hình (`docs/decisions/042-battle-perf-and-light-animation.md:18`); 43 con × 10 trạng thái × 8 khung ≈ 3.400 hình (`rig/ARCHITECTURE.md:10`).
- [DỮ LIỆU] Rào cản thực tế không phải số khung mà là AI vẽ lại cả con ở mỗi khung nên lệch nhận diện: đốm khác nhau từng khung, sọc đổi số, "cả thân sôi" (`docs/PROGRESS.md:89`). Dự án kết luận: không khả thi cho cá, khả thi cho chim vì hình bóng đổi lớn (`PROGRESS.md:97`).
- [NHẬN ĐỊNH] Về chất lượng, sprite sheet vẽ tay là trần cao nhất cho phong cách này (smear, biến dạng tự do, nét đồng nhất với tranh tĩnh). Nó không khả thi với nguồn lực hiện tại (art do AI sinh + chủ dự án render), trừ khi có hoạ sĩ.

### 4.2 Skeletal 2D (puppet rig, decision 050)

| Cách | Cần gì | Kết quả đã quan sát |
|---|---|---|
| Cắt bộ phận trên xương | ~15–24 ảnh bộ phận / con, phải vẽ cả phần bị che | Chuyển động tốt, **hình ghép xấu hơn tranh duyệt**: nhỏ hơn ~30 %, đầu tách khỏi thân, ánh sáng không liền khối → bị bác (`decisions/050…:40`) |
| Skin một ảnh (lưới bẻ tranh) | 1 tranh + đo khớp | Đẹp lúc đứng; phải giảm biên độ: đầu ×0,65, tai ×0,45–0,5; "đầu xoay > ~18° kéo giãn thấy được" (`decisions/050…:45`, `:49`) → bị bác khi nhân rộng |
| Pose to pose trên 6 key pose (đang dùng) | 6 tranh / con | Chủ dự án: "tốt hơn rất nhiều, đồng ý" (`HANDOFF.md:16`). Giới hạn: hoà 70 ms, không khung trung gian, không chớp mắt |

Giới hạn cấu trúc của skeletal 2D với thiết kế này [NHẬN ĐỊNH, dựa trên các dữ liệu trên]:

- **Xoay thân ra khỏi mặt phẳng**: không làm được. "Quay lưng lắc mông" (FINAL:952), "xoay người đá" (FINAL:1083), quái "quay nhìn" (đang giả bằng xoay 4–6°, FINAL:1797) đều cần tranh khác góc.
- **Đổi góc nhìn**: mỗi góc là một bộ tranh và một rig mới. Ảnh hưởng trực tiếp tới bản đồ (V9).
- **Foreshortening**: tay / càng vươn về phía người xem không có; tài liệu hầu như không đòi, vì đòn hướng ngang.
- **Cánh, đuôi chồng lớp**: Phaser Rope uốn tốt dải đơn (đuôi, vây, xúc tu). Cánh gập, cánh che thân rồi thân che cánh trong một nhịp vỗ cần đổi thứ tự vẽ theo khung và tranh cánh nhiều trạng thái. Dự án đang giải bằng 3 tranh bay vẽ tay cho Ưng (`rig/ROADMAP.md:11`).
- **Phần bị che**: tranh một lớp không có thân sau đầu, chân xa sau chân gần; tách ra là thủng (`rig/AUDIT.md:55`).

### 4.3 3D (model + rig + clip)

- [NHẬN ĐỊNH] Được: một model cho mọi tư thế và mọi góc; nội suy liên tục giữa clip; clip dùng lại giữa các model cùng bộ xương (20 loài heo cùng tỉ lệ chibi là trường hợp thuận lợi); bản đồ có đủ hướng; overlap thật từ xương phụ.
- [NHẬN ĐỊNH] Phải trả: 43+ model đạt chất lượng nhận diện ngang tranh đã duyệt; squash & stretch phải dựng bằng xương scale hoặc lattice; mặt hoạt hình cần blendshape hoặc texture đổi khung; VFX của FINAL (dải 4 khung, hạt ảnh, vật thể `fxp_*`) vẫn là 2D đặt trong không gian 3D, không tự đẹp hơn; phải thêm renderer 3D bên cạnh Phaser.
- [DỮ LIỆU] Bằng chứng duy nhất trong repo về "dựng 3D để ra hình": Sobi Studio dựng hình 3D bằng SDF + toon rồi render ra 2D; cổng U1 tự chấm "đẹp hơn bản cũ — không, đồng bộ hơn — có, đáng đổi cả game — không" và hướng tạo lại toàn bộ dừng (`docs/decisions/051-unity-studio.md:38-41`); thử riêng VFX cũng không đạt (`:45-48`). Cái đạt là dùng công cụ để tạo **chuyển động trên tranh đã duyệt** (`:50-54`).
- [NHẬN ĐỊNH] Bằng chứng đó nói về hình dựng thủ tục bằng code, **không** nói về model do hoạ sĩ hay công cụ AI tạo. Nó cho thấy rủi ro "3D kém đẹp hơn tranh" là có thật ở dự án này, nhưng không chứng minh mọi 3D đều thua.

### 4.4 Chỗ nào ai hơn

| Yếu tố trong thiết kế | Sprite sheet | Skeletal 2D | 3D | Ghi chú |
|---|---|---|---|---|
| Squash & stretch cực đại (dẹp `sy 0.5`, phồng 1,25×) | Tốt nhất | Tốt | Kém hơn, phải dựng riêng | FINAL:757, :1422 |
| Smear, bóng mờ nối đuôi | Tốt nhất | Tốt (đã có `trail`) | Tương đương, tốn hơn | FINAL:1798 |
| Nét vẽ tay khớp tranh tĩnh | Tốt nhất | Tốt (dùng chính tranh duyệt) | Rủi ro cao nhất | `decisions/051…:38-41` |
| VFX nguyên tố kiểu hoạt hình | Tốt nhất | Như nhau | Như nhau hoặc kém | FINAL mục 6 |
| Giữ nhận diện giữa các khung | Kém với AI | Tốt | Tốt nhất | `PROGRESS.md:89` |
| Chuyển tiếp giữa tư thế | Theo số khung | Yếu (hoà 70 ms) | Tốt nhất | `decisions/050…:74` |
| Xoay thân, đổi góc nhìn | Tốn | Không | Tốt nhất | FINAL:952, :1083; V9 |
| Vật thể sống có cánh / nhiều chi bay vòng | Tốn | Trung bình | Tốt nhất | FINAL:912–913 |
| Xúc tu, đuôi uốn | Tốn | Tốt (Rope) | Tốt | `rig/ARCHITECTURE.md:20` |
| Thêm loài mới | Rất tốn | 6 tranh + đo khớp | 1 model + skin vào bộ xương chung | `decisions/050…:49` |
| Chạy trên engine hiện có | Có | Có | Không: cần renderer 3D | `package.json` chỉ có Phaser |

## 5. Bảng phân loại skill

Tiêu chí (do người viết đặt, [NHẬN ĐỊNH]): **độ phức tạp** tính theo động tác **thân** được mô tả (không tính VFX). **Lợi ích 3D** so với 2D đã nâng cấp: *không* = chỉ có biến đổi trong mặt phẳng + VFX / vật thể 2D; *ít* = có một chi tiết 3D làm tự nhiên hơn nhưng 2D có cách rẻ; *vừa* = cần tư thế thân mới ngoài 6 key pose cho nhiều thân, hoặc vật thể sống cần chu kỳ riêng; *lớn* = cần xoay ngoài mặt phẳng, đổi góc nhìn, hoặc chuỗi động tác khớp nối trên mọi thân.

| Nhóm / skill | Số | Phức tạp thân | Lợi ích 3D | Lý do | Tin cậy |
|---|---|---|---|---|---|
| `skill_cl_taunt` | 1 | cao | **lớn** | Quay lưng: cần mặt sau của mọi loài chiến binh | cao |
| `skill_cl_combo` | 1 | cao | **lớn** | Đấm + xoay đá + nhảy đập + lộn về, trên mọi thân | cao |
| `skill_ult_phoenix` | 1 | cao (vật thể) | **lớn** | Chim bay vòng, khép cánh, lao, bay ngược: đổi hướng và vỗ cánh liên tục | vừa |
| `skill_tg_steel_slash`, `skill_tg_steel_charge`, `skill_hg_forge_fire`, `skill_hg_hot_claw` | 4 | cao | vừa | Rút / tra kiếm, cuộn lăn rồi xòe, vung búa, đi ngang: cần tư thế riêng; cuộn lăn và đi ngang vẫn nằm trong mặt phẳng | vừa |
| `skill_cl_dash`, `skill_cl_finisher`, `skill_cl_focus` | 3 | vừa–cao | vừa | Chu kỳ chạy + đổi hướng; bay lên – bổ – tạo dáng; ngồi thiền: mọi thân | vừa |
| `skill_e_tusk_charge`, `skill_e_spark_peck`, `skill_e_seal_quake`, `skill_e_meteor` | 4 | vừa | vừa | Cào đất, mổ, đặt hai tay xuống đất, bay khỏi màn: khớp nối theo loài, mỗi skill chỉ 1–2 quái | vừa |
| `skill_ult_nh`, `skill_ult_dm`, `skill_ult_tg`, `skill_ult_qs` | 4 | cao (vật thể) | vừa | Cá voi, xúc tu, kỵ binh, rùa núi có chuyển động nội tại; xúc tu và đuôi 2D Rope làm tương đương | vừa |
| Cận chiến còn lại (`power_strike`, `vital`, `rend`, `armor_crush`, `ember_bite`, `metal_claw`, `shadow_bite`, `shadow_dance`, `dive`, `thunder_charge`, `vine_lash`) | 11 | thấp–vừa | ít | Lấy đà – lao – chạm; nhát chém là dải `fx_*` | vừa |
| Dậm / rơi (`qs_quake`, `stomp`, `tremor`, `inferno_hammer`, `cl_meteor`, `rock_slam`, `bronze_crush`) | 7 | thấp–vừa | ít–không | Xoay và squash trong mặt phẳng; vật rơi là 2D | cao |
| Phóng chiêu, tia, sét, dây (`projectile` 11, `beam` 4, `strike`, `chain`, `stretch`, `tether`) | 19 | thấp | không–ít | Thân chỉ phồng / ngả / giật lùi; cá tính ở đạn và quỹ đạo | cao |
| Phun nón | 3 | thấp | ít | Phồng – xẹp, ngửa cổ | cao |
| Diện rộng (`burst` 12, `sweep`, `rain`, `curse`, 2 boss) | 17 | thấp | không–ít | Hiện tượng trên phe địch; phản ứng mục tiêu là squash, nảy | cao |
| Hỗ trợ còn lại (`aura` 22, `self` 13, trừ 4 skill đã nêu) | 31 | thấp–vừa | không–ít | Hát, gồng, giơ tay; vật thể bay tới | vừa |
| Tuyệt kỹ còn lại (`ult_qt`, `ult_ld`, `ult_hg`, `ult_mm`, `ult_hk`, `ult_trident`, `ult_mythical`) | 7 | thấp (thân) | ít | Vật thể cứng (chuông, đe, đinh ba, huy hiệu, cây); chỉ "xoay chậm" có lợi nhẹ | vừa |

**Tổng hợp** ([NHẬN ĐỊNH], phân loại từng skill theo tiêu chí trên; sai số ±5 skill giữa hai mức liền kề):

| Lợi ích 3D | Số skill | Tỉ lệ |
|---|---|---|
| Lớn | 3 | ~3 % |
| Vừa | 15 | ~13 % |
| Ít | ~38 | ~34 % |
| Không | ~56 | ~50 % |

[NHẬN ĐỊNH] Con số này đo lợi ích **riêng của từng skill**. Nó không đo lợi ích nền dùng chung cho mọi skill (V1, V2: chuyển tiếp mượt, bộ phận lệch nhịp) và lợi ích ngoài sân trận (V9). Ngược lại, khoảng 84 % skill không có lý do riêng để cần 3D, và khoảng một nửa có nguy cơ **kém đi** nếu VFX và squash không được dựng lại đúng chất hoạt hình.

## 6. Nếu đi 3D: thiết kế kỹ thuật giữ nguyên ý đồ

Mục này là đề xuất của người viết ([NHẬN ĐỊNH]) dựng trên dữ liệu của FINAL; không đơn giản hoá nội dung.

### 6.1 State machine của một đơn vị

```
ENTER → IDLE ⇄ IDLE_FIDGET
IDLE → TURN_START → (ATTACK | CAST(gesture) | SKILL_SPECIFIC(id) | ULTIMATE | GUARD_ENTER→GUARD_HOLD | ITEM | SKIP_STUN | SKIP_FROZEN | SKIP_SEALED) → RECOVER → IDLE
bất kỳ (trừ KO) → HIT_LIGHT | HIT_HEAVY | HIT_CRIT | HIT_THEMED(burn|bind|pull|press|cough|lift) → IDLE
bất kỳ → DODGE(lean | hop) → IDLE
bất kỳ → BUFF | DEBUFF | HEAL | DOT_TICK → IDLE   (lớp cộng thêm, không cắt đòn đang diễn)
bất kỳ → KO → KO_HOLD → REVIVE → IDLE
IDLE → VICTORY_LOOP        KO_HOLD → VICTORY_SIT (vẫy tay, FINAL:180)
BOSS: IDLE → PHASE_SHIFT (600 ms) → SKILL_SPECIFIC
```

- Ưu tiên giữ như hiện tại: phản ứng mới nhất > beat của mình > tư thế kịch bản ép > thắng > idle; đã gục giữ `ko` ([DỮ LIỆU] `rig/ARCHITECTURE.md:60`; `battlePerf.ts:88-118`).
- Lớp trạng thái kéo dài chạy song song: `LOW_HP` (thở nhanh 30 %, FINAL:27), `GUARDING` (run 1 px, lùi 8 thay 24 khi trúng, FINAL:54), `FROZEN` (thân bất động, FINAL:197), `SLOWED` (nhịp thở chậm 40 %, FINAL:247).

### 6.2 Danh sách clip theo body plan

| Nhóm clip | Clip | Căn cứ |
|---|---|---|
| Sống | `idle`, `idle_fidget_a/b` (bốn chân: lắc đầu + vẫy đuôi; bay: vỗ cánh 2 nhịp; bơi: xoay tròn nhỏ; lơ lửng: chìm 6 rồi nổi; nặng: dậm 1 chân), `idle_low_hp` | FINAL:27 |
| Vào / ra | `enter_jump` (ta), `enter_pop` + `grr` (quái), `victory` theo thân (bay lộn 1 vòng, bơi phun bong bóng), `victory_sit`, `ko`, `revive` | FINAL:36, :162, :171, :180 |
| Đánh thường | `strike_head`, `strike_peck_x2`, `strike_tail`, `strike_overhead` | FINAL:45 |
| Cử chỉ skill | `g_shoot`, `g_breath`, `g_summon_ground`, `g_summon_sky`, `g_channel`, `g_brace`, `g_slam`, `g_charge`, `g_lash`, `g_roar` | `battlePoses.ts:8` |
| Cử chỉ lớp cần thêm | `g_taunt_wiggle`, `g_combo_3`, `g_sprint_loop` + `g_skid`, `g_meditate`, `g_aim`, `g_cheer`, `g_pant_inhale_exhale`, `g_finisher` | FINAL:952, :1083, :1109, :1173, :1069, :1277, :991, :1134 |
| Đặc thù dòng / quái | `draw_sheathe`, `curl_roll_unfurl`, `hammer_x3`, `side_walk`, `paw_ground`, `ruffle_zigzag`, `hands_to_ground`, `fly_off` / `land` | FINAL:651–654, :690–693, :730, :717, :1474, :1396, :1773, :1656 |
| Phòng thủ | `guard_enter`, `guard_hold`, `guard_hit` | FINAL:54 |
| Phản ứng | `hit_light`, `hit_heavy`, `hit_crit` (khựng 120 rồi văng, nảy 2 lần), `hit_flat`, `hit_lift_spin`, `hit_hop_hot`, `hit_bound`, `hit_pull`, `hit_cough`, `hit_startle`, `dodge_lean`, `dodge_hop` | FINAL:99, :108, :117, :757, :367, :744, :809, :886, :1385, :497 |
| Mất lượt | `stun_wobble`, `frozen_shiver`, `sealed_fail` (cast 200 rồi khựng, lắc đầu) | FINAL:63, :72, :81 |
| Trạng thái | `apply_wet_shake` (lắc như vẩy nước), `apply_burn_jump`, `apply_spd_run2`, `apply_acc_rub_eyes`, `droop`, `flex` | FINAL:193, :190, :244, :235, :144, :135 |
| Tuyệt kỹ | `ultimate` + clip riêng cho rùa (bước lên, gầm) | FINAL:445 |

[NHẬN ĐỊNH] Khoảng 60–70 clip cho một body plan. Với heo chibi dùng chung bộ xương, clip làm một lần cho 20 loài; quái nhiều body plan (chim, sói, golem, cây, tinh linh) mỗi nhóm một bộ rút gọn. Danh sách này cũng là danh sách tư thế cần có nếu ở lại 2D.

### 6.3 Yêu cầu rig

- **Xương chính** theo plan: bốn chân / hai chân chibi (root, hông, cột sống 2–3, cổ, đầu, 4 chi × 2–3 đốt), bay (thêm cánh 3 đốt + lông đầu cánh), bơi (cột sống 4–5 đốt + vây), lơ lửng (thân + tua), nặng (thân to, tay ngắn).
- **Xương phụ có lò xo**: tai, bờm, đuôi, lá, mào, vạt áo, phụ kiện (đèn, sừng). Hành vi cần giữ: lệch ngược chiều gia tốc, về nghỉ < 3 s ([DỮ LIỆU] `ACCEPTANCE.md:18`).
- **IK**: chân bám đất khi thân ngả hoặc lấy đà (tương đương vùng `root` ở dải chân, `decisions/050…:69`); IK tay cho giơ vật (đèn, búa, kiếm); look-at cho đầu (`enemy_look`, FINAL:1797).
- **Mặt**: tối thiểu mắt mở / nhắm / nheo một mắt / tròn xoe / `> <` / xoắn ốc / lóe; miệng nghỉ / há / lè lưỡi / mếu / phồng má; má hồng. Làm bằng blendshape hoặc texture mặt đổi khung. [NHẬN ĐỊNH] Texture đổi khung giữ nét vẽ tay tốt hơn với phong cách này.
- **Squash / stretch**: xương scale không đều ở root và cột sống, dải 0,5–1,25 (FINAL:757, :1422), có bù thể tích; xương "phồng" cho má và túi họng.
- **Socket VFX**: `mouth`, `tail`, `head_top`, `chest`, `feet`, `hand`, `horn`, `back` (gai mọc trên lưng, FINAL:781). Hiện có `mouth`, `tail`, `head` ([DỮ LIỆU] `decisions/050…:30`).
- **Material**: toon + viền nâu ấm, tô phẳng, bóng mềm ([DỮ LIỆU] `docs/animation/animation_style_guide.md:9`); cần kênh tô trắng toàn thân (chớp 70 ms), tô màu trạng thái (ướt 10 %, đóng băng 30 %), xám dần khi KO, độ mờ 30–45 %.

### 6.4 Animation events

| Event | Ý nghĩa | Tương ứng hiện có |
|---|---|---|
| `windup` | Bắt đầu lấy đà | mốc `windup` của clip |
| `release` | Đạn rời thân, bắt đầu lao | `release` của beat và clip |
| `vfx_spawn(socket, id)` | Sinh hiệu ứng ở socket | act của `battle_fx.json` có `spot` |
| `impact[i]` | Nhát thứ i chạm; số sát thương bật | chỉ có **một** `impact` (`battleFx.ts:86`) → cần mở thành mảng |
| `damage[i, target]` | Gameplay đã tính sẵn; chỉ là lúc hiển thị | `stagger` giữa các mục tiêu |
| `hitstop(ms)`, `camera(kind)`, `sfx(id)` | Màn hình, âm | act `stop`, `punch`, `sound` |
| `recover` | Bắt đầu thu về | mốc `recover` |
| `end` | Trả lượt | `end` của beat |

Nguyên tắc giữ nguyên: event **không** sinh sát thương; thời điểm do timeline quyết, clip được warp theo ([DỮ LIỆU] `warp.ts:35-46`; spec §25 "gameplay không được phụ thuộc tuyệt đối vào frame", `docs/SOBI_WORLD_ANIMATION_SPEC.md` dòng 1190 trở đi).

### 6.5 Timing skill, đồng bộ VFX

- Giữ nguyên số của FINAL: skill thường 950–2000 ms; boss 2000–2400; tuyệt kỹ 3100–3500; một lượt ≤ 5,6 s; x2 = 55 % (FINAL:10).
- Hit-stop phải dừng **cả** clip thân, hạt và tween, trong khi âm thanh và số vẫn chạy (FINAL:1783). Hiện đã đúng với puppet ([DỮ LIỆU] `rig/ARCHITECTURE.md:69`).
- `stagger` 80–160 ms theo thứ tự trái → phải hoặc theo đường đi của vật thể (FINAL:1795).
- Giảm chuyển động: tắt tween, hạt, rung, zoom, khựng hình; giữ số, âm, biểu tượng (FINAL:15). Trong 3D: giữ tư thế nghỉ, không phát clip.

### 6.6 Blending, transition

- Crossfade từ đúng tư thế khung trước, kể cả lò xo; mặt đổi ngay ([DỮ LIỆU] `rig/ARCHITECTURE.md:57`).
- Ngoại lệ có chủ đích: chí mạng **cắt cứng** vào tư thế "mắt tròn xoe" rồi giữ 120 ms (FINAL:108); `sealed_fail` cắt cứng từ cast sang giật lùi (FINAL:81). Không được làm mượt hai chỗ này.
- Lớp cộng (additive): thở, run khi thủ, run lạnh, chạy tại chỗ, nhún khi được hồi máu chồng lên clip đang chạy.
- Root motion: dash, knock-back, vồng do timeline điều khiển; clip chỉ diễn tại chỗ ([DỮ LIỆU] `decisions/050…:9`).

### 6.7 Tuyệt kỹ và boss

- **Đạo diễn tuyệt kỹ** (dùng chung 12 skill): letterbox vào → cut-in 500 (dải chéo màu hệ, chân dung trượt vào, còn lại tối 50 %, FINAL:1786) → `bg_tint` → vật thể vào → 2–3 nhịp → nhịp cuối hit-stop 110–120 + `camera_punch` 1,04–1,06 + chớp → dư âm → nền trở lại. Tên chiêu bằng chữ i18n ([DỮ LIỆU] quyết định D-2, `docs/animation-review/STATE.json`).
- **Vật thể triệu hồi** là diễn viên riêng: cá voi (cột sống đuôi 4–5 đốt, vòi nước), 4 xúc tu (chuỗi 8–10 đốt, đan chéo), phượng hoàng (cánh 3 đốt, clip `orbit`, `cocoon`, `dive`, `ascend`), 3 kỵ binh (chu kỳ phi + giơ thương), rùa núi (trồi chậm), lồng đèn, chuông, đe + búa, đinh ba, cây mẹ, vòng linh thú.
- **Camera**: tài liệu chỉ cần punch và cut-in. [NHẬN ĐỊNH] Nếu thêm lia / xoay máy vì "3D làm được" thì đó là **thay đổi thiết kế**, phải được duyệt riêng và phải vừa trong 3,5 s.
- **Boss**: `PHASE_SHIFT` 600 ms + clip riêng (gầm và đổi màu lá; bay vụt khỏi màn rồi hạ cánh; hai tay xuống đất, mắt sáng).

## 7. Hệ thống animation dùng được cho cả 2D và 3D

### 7.1 Kiến trúc đề xuất ([NHẬN ĐỊNH])

```
Lớp 1  SKILL TIMELINE (trung lập, dữ liệu)
       marks: windup, release, impacts[], recover, end   (ms, tốc độ thường)
       tracks: body(gesture | clipId) · root(move) · vfx(spawn@socket) · screen(stop, punch, tint, cutin) · audio · targetReaction(kind)
Lớp 2  BODY PERFORMANCE (theo body plan)
       Want { action, alt[], key, timing } → chọn clip: skill_<id> → ultimate → g_<gesture> → gần nhất → cast → idle
Lớp 3  BACKEND
       2D: rig JSON + Phaser (puppet / skin / pose)     3D: skeleton + clip trên renderer 3D
Lớp 4  PROCEDURAL (cộng thêm): thở, lò xo, chuỗi uốn, look-at, chân bám đất
Lớp 5  VFX / SCREEN: act khai báo, neo vào socket
```

### 7.2 Đã có sẵn và còn thiếu

| Thành phần | Trạng thái | Căn cứ |
|---|---|---|
| Timeline theo mốc, tất định, có test | Có | [DỮ LIỆU] `battleMotion.ts:10-27`; `decisions/044…:8` |
| VFX / màn hình / âm khai báo bằng dữ liệu | Có (112 skill, 1640 act) | [DỮ LIỆU] `battle_fx.json` |
| Giao diện `Want { action, alt, key, timing }` giữa trận và thân | Có, và **không phụ thuộc 2D** | [DỮ LIỆU] `battlePerf.ts:88-118` |
| Warp clip theo mốc | Có, thuần toán học | [DỮ LIỆU] `warp.ts:14-46` |
| Chuỗi dự phòng clip | Có | [DỮ LIỆU] `battlePerf.ts:75-82`; `rig/ARCHITECTURE.md:56` |
| Cử chỉ theo body plan | Có 10; thiếu ~8 cử chỉ lớp (mục 6.2) | [DỮ LIỆU] `battlePoses.ts:8` |
| Socket VFX | Có 3; thiếu `hand`, `horn`, `back`, `chest`, `feet` | [DỮ LIỆU] `decisions/050…:30` |
| Không có rig thì chạy như cũ | Có | [DỮ LIỆU] `decisions/050…:10` |
| Nhiều mốc `impact` cho đòn nhiều nhát | **Thiếu** | [DỮ LIỆU] `battleFx.ts:86` |
| Phản ứng mục tiêu có ngữ nghĩa | **Thiếu**: 8 loại chung (`battleMotion.ts:29`) | [DỮ LIỆU] |
| Clip theo từng body plan thật | **Thiếu**: 25 clip chung một script; chim dùng clip heo | [DỮ LIỆU] `HANDOFF.md:26`; `decisions/050…:59` |
| Clip `skill_<id>`, flipbook tuyệt kỹ, clip `phase` của boss | **Thiếu** | [DỮ LIỆU] `decisions/050…:33`; `rig/ROADMAP.md:11` |
| Đơn vị trung lập trong kịch bản | **Thiếu một phần**: tham số act tính bằng px, khung dải, id ảnh (`content/schemas/adventure/battleScript.ts:60-142`) | [NHẬN ĐỊNH] cần lớp ánh xạ nếu thêm backend 3D |
| Dùng lại ngoài Adventure | Thiết kế có (`systems/animation`, `ui/puppet`); Farm / Garden / Cloud chưa dùng rig | [DỮ LIỆU] `PROGRESS.md:11` |
| Đo FPS, chạy không WebGL | Chưa đo | [DỮ LIỆU] `ACCEPTANCE.md:48-49` |

### 7.3 Thêm Animal hoặc skill mới không phải xây lại

- Skill mới: thêm timeline; chọn một cử chỉ có sẵn; chỉ thêm clip khi động tác độc nhất. Kỹ năng lớp tự lấy hệ của người dùng qua `$color`, `$spark`, `$boom` ([DỮ LIỆU] `decisions/044…:32`).
- Animal mới (2D): 6 key pose + đo khớp; kế thừa clip của body plan ([DỮ LIỆU] `decisions/050…:49`, `:71`). Animal mới (3D): một model skin vào bộ xương chung của plan.
- [NHẬN ĐỊNH] Việc đáng làm **trước** khi chọn A / B / C, vì có ích cho cả ba: (1) mở `impact` thành mảng; (2) thêm loại phản ứng có ngữ nghĩa; (3) thêm cử chỉ lớp; (4) tách clip theo body plan thật (ít nhất `flyer`, `biped`); (5) thêm socket. Cả năm đều là dữ liệu và code thuần, không phụ thuộc cách vẽ.

## 8. Đề xuất nội dung prototype kiểm chứng

Mục tiêu: cùng một nội dung, dựng bằng 2D nâng cấp và bằng 3D, đặt cạnh nhau trong "Xưởng animation trận".

| Vai | Chọn | Lý do (căn cứ) |
|---|---|---|
| Animal đơn giản | **Heo Rừng** `pig_boar` (bốn chân) | Đã là prototype 2D có rig, clip, dải khung để so (`decisions/050…:12`); dòng Thiết Giáp có `skill_tg_steel_charge` và `skill_tg_steel_slash` là hai skill thân phức tạp nhất của heo |
| Animal cấu trúc phức tạp | **Heo Phượng Hoàng** `pig_phoenix` (thân bay, có cánh) | Chưa có rig `flyer` nào (mục 2.2); có tuyệt kỹ riêng `skill_ult_phoenix` là skill duy nhất xếp "lớn" ở nhóm tuyệt kỹ (FINAL:904–915) |
| Đối chứng phần mềm (tuỳ chọn) | **Cá Betta** `fish_betta` | Kiểm tra chỗ 2D đang mạnh (thân uốn bằng Rope); nếu 3D không hơn ở đây thì có số liệu cho Aquarium |
| Quái | **Ưng Vách Đá** `enemy_cliff_hawk` | Dùng `skill_e_spark_peck` (mổ 2 nhát) và `skill_e_dive` (bay khỏi khung, bổ nhào) (FINAL:1389, :1558); đã có 3 tranh bay vẽ tay để so |
| Boss (tuỳ chọn) | **Rồng Dung Nham** `enemy_magma_drake` | `skill_e_magma_breath` (nón), `skill_e_dragon_roar`, `skill_e_meteor` (đổi pha, bay khỏi màn) (FINAL:1623–1660) |

| Loại skill | Chọn | Kiểm chứng điều gì |
|---|---|---|
| Cận chiến đơn | Đánh thường × 3 thân (húc, mổ 2 nhát, quẫy đuôi) (FINAL:45) | Clip theo body plan; `contact` trùng số sát thương |
| Cận chiến phức tạp | `skill_cl_combo` (FINAL:1075) | 3 mốc `impact`; chuyển tiếp giữa 3 động tác; xoay người |
| Động tác ngoài mặt phẳng | `skill_cl_taunt` (FINAL:945) | Quay lưng: 2D cần tranh mặt sau, 3D có sẵn |
| Phóng chiêu | `skill_nh_bubble` (FINAL:319) | Phồng má, đạn nảy, mục tiêu bị nhốt rồi rơi bẹp: bài thử squash cho 3D |
| AoE nguyên tố | `skill_qs_quake` (FINAL:423) hoặc `skill_nh_tsunami` (FINAL:358, đã có pilot 2D lai) | `stagger`, decal mặt đất, phản ứng "bị hất lên" |
| Hỗ trợ | `skill_cl_second_wind` (FINAL:984) | Diễn xuất thân thuần squash: dự đoán 2D tương đương hoặc hơn |
| Tuyệt kỹ | `skill_ult_phoenix` (FINAL:904) | Vật thể sống bay vòng, cut-in, 3 nhịp, ≤ 3,5 s |
| Phản ứng | Chí mạng (FINAL:103) + Vỡ Băng (FINAL:270) | Cắt cứng + khựng 120; hit-stop dừng cả thân |
| Bản đồ | Một bạn đồng hành đi 4 hướng | V9: nơi dự đoán 3D lợi nhất |

Tiêu chí so ([NHẬN ĐỊNH]): dùng rubric C1–C7 hiện có (`docs/animation-review/ANIMATION_QUALITY_RUBRIC.md:20-64`), thêm hai câu hỏi bắt buộc: (a) đặt cạnh tranh đã duyệt, nhân vật có còn là nó không (bài học `HANDOFF.md:18`); (b) cùng một động tác, phía nào cần ít tranh / công hơn để thêm con thứ hai.

## Điều chưa xác minh

1. Chưa chạy game hay "Xưởng animation trận": mọi nhận xét về cảm giác chuyển động dựa trên tài liệu và dữ liệu, không dựa trên quan sát.
2. Chưa có vòng review nào sau decision 050; điểm 72–80 của vòng 4 là của bản **trước** pose to pose (`rounds/round-04/FEEDBACK.md:3`).
3. Chủ dự án chưa chấm ACCEPTANCE A10–A13, B8 (`docs/PROGRESS.md:11`).
4. Chưa đo FPS của 6 puppet + VFX; chưa thử không WebGL (`ACCEPTANCE.md:48-49`). Chưa có số liệu nào về chi phí hiệu năng của một renderer 3D trong Electron ở dự án này.
5. Bảng mục 5 là phân loại bằng đọc văn bản của một người; tỉ lệ 3 % / 13 % / 34 % / 50 % có sai số, chưa được người thứ hai kiểm.
6. Ước lượng số khung (mục 4.1) và số clip (mục 6.2) là giả định, chưa kiểm bằng sản xuất thử.
7. FILLED dòng 330–2475 đọc bằng cách tách dòng lặp (mục 0), không đọc tuần tự từng dòng; phần giữa của Phụ lục A / B chỉ đọc lướt.
8. `docs/SOBI_WORLD_ANIMATION_SPEC.md` chỉ đọc §15–§25. `docs/animation/library/` (bible, 169 kịch bản) chưa mở.
9. `docs/animation/technical_pipeline.md` và `integration_spec.md` còn mô tả trận là DOM + CSS (decision 040), đã lỗi thời so với sân Phaser (decision 042); không dùng làm căn cứ hiện trạng.
10. Chưa mở ảnh nào (key pose, sheet VFX, ảnh QA); nhận định về chất lượng hình lấy từ lời chấm đã ghi trong decision 050, 051 và `PROGRESS.md`.
11. Không có dữ liệu nào trong repo về model 3D do hoạ sĩ hoặc công cụ AI tạo cho nhân vật Sobi; bằng chứng 3D duy nhất là hình SDF dựng bằng code (decision 051).

## Cần chủ dự án cung cấp / duyệt

1. **Xác nhận ai diễn động tác của Guardian**: FINAL viết "rùa húc", "xoay xúc tu", "cua đi ngang" cho skill dòng máu, trong khi người dùng là heo / cá. Muốn (a) mỗi thân diễn cử chỉ theo cách của mình như decision 050, hay (b) hình bóng Guardian hiện ra diễn hộ?
2. **Chấm bản pose to pose** (A10–A13, B8) và cho chạy một vòng review mới, trước khi so với 3D. Không có điểm này thì không biết phương án A đang ở đâu.
3. **Duyệt phạm vi prototype** ở mục 8 (2 Animal + 1 quái + 8–9 skill + 1 đoạn bản đồ), và ai dựng phía 3D (nguồn model: hoạ sĩ, công cụ AI, hay agent).
4. **Quyết định về camera**: tài liệu chỉ có cut-in và zoom 1,04–1,06×. Nếu muốn lia / xoay máy ở tuyệt kỹ thì đó là thay đổi thiết kế cần duyệt riêng.
5. **Mức ưu tiên của bản đồ khám phá**: nếu bạn đồng hành đi đủ 4 hướng là yêu cầu thật, đây là lý do mạnh nhất cho 3D ở Adventure; nếu không, lý do đó yếu đi nhiều.
6. **Tranh bổ sung cho hướng 2D**, nếu giữ: mặt sau của chiến binh (cho `skill_cl_taunt`), tranh mắt nhắm (chớp mắt), tranh `windup` cho các con còn lại, key pose cho 7 quái biển (`HANDOFF.md:45`).
7. **Cho phép làm 5 việc trung lập ở mục 7.3** trước khi chọn phương án (mảng `impact`, phản ứng có ngữ nghĩa, cử chỉ lớp, clip theo body plan thật, socket).
8. **Rà IP**: FINAL:5 và `PROMPT_thiet_ke_animation.md:21` nêu tên một game bên thứ ba làm phong cách tham khảo. Theo decision 048 / 049 chỉ được dùng nguyên lý; đề nghị xác nhận câu đó có cần gỡ khỏi tài liệu thiết kế không.
