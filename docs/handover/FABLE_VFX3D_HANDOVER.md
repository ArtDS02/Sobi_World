# Handover: nâng chất lượng animation / VFX 3D của skill (cho Fable 5.2)

**Ngày:** 2026-11-12. **Nhánh:** `feature-plot-upgrade`. **Người bàn giao:** phiên Sonnet 5.5 đã dựng lớp 3D (decision 059).
Đọc theo thứ tự: mục 0 → 1 → 2 → 4, rồi mục 5–7 khi bắt tay làm. Mục 9 là danh sách file.

## 0. Việc cần làm trong một câu
Chủ dự án chấm hiệu ứng 3D hiện tại là **chưa đủ sinh động, chưa đẹp, chưa đúng mô tả skill** (chính họ chấm prototype `Sobi_VFX_Lab_3D.html` 5/10 và nói bản trong game cũng ở mức đó). Nhiệm vụ: đưa animation / VFX của 112 skill lên mức **≥ 7,5/10 theo chấm của chủ dự án**, **đúng từng chữ trong mô tả**, mà **không** đổi gameplay, và chạy ≥ 50 FPS trên RTX 3050. Làm theo cổng: thử 3 skill trước; nếu chủ dự án không chấm ≥ 7 thì **dừng và báo**, đừng mở rộng.

Việc phụ đi kèm (đã soạn sẵn, chờ chủ dự án duyệt): thêm skill cho hệ còn ít (`docs/animation/NEW_SKILLS_PROPOSAL.md`), chuẩn mô tả (`docs/animation/SKILL_DESCRIPTION_STANDARD.md`).

## 1. Hiện trạng (sự thật đã kiểm, 2026-11-12)
- **Cả 112 skill đã có hiệu ứng 3D** (prototype decision 059). Hình chụp từng nhóm: `docs/animation/vfx3d/*.png`. Bảng đối chiếu mô tả: `docs/animation/SKILL_REVIEW.md`. Danh mục sinh tự động: `docs/handover/VFX3D_SKILL_INVENTORY.md`.
- **Chưa commit gì.** Cây làm việc có ~620 dòng thêm / ~3650 dòng xóa (phần lớn là `battle_fx.json` bị thay act 2D bằng một act `vfx3d`, và định dạng lại). Bản 2D cũ nằm ở git HEAD: `git show HEAD:content/adventure/battle_fx.json` (để so sánh trước / sau).
- Hai thay đổi trong cây **không phải của lớp 3D**: `content/farm/layout.json` (chủ dự án sửa tay, làm đỏ 2 test farm) và `tools/admin/battleLab.ts` (bộ lọc Nguyên tố của Battle Lab, hữu ích, giữ). **Đừng revert, đừng gộp vào commit 3D.**
- `npm run check`: typecheck, lint, guard, assets:check xanh; test 2116/2121. 5 test đỏ **có từ trước**: 2 `studio.test` (thiếu tag git `pre-unity-studio`), 2 farm (`assets.test`, `decor.test`: layout của chủ dự án), 1 `assetsCheck` (quá 20 s vì máy chậm, chạy riêng với `--testTimeout 120000` thì qua).
- Hiệu năng: **chỉ đo bằng GPU phần mềm** (SwiftShader): 25,1 → 32,6 ms mỗi khung khi bật 3D, lúc đó mới 1 skill. **Chưa đo trên GPU thật, chưa thử Electron, chưa đo sau khi có 112 skill.**
- Đã **đóng cửa Unity** (decision 058). Không làm 3D sinh vật / rig. Chỉ làm lớp VFX của skill; sinh vật, nền, UI giữ 2D đã duyệt.

## 2. Vì sao kết quả đang ở mức 5–6/10 (nguyên nhân gốc, nói thẳng)
1. **Hình dựng từ khối nguyên thủy + hạt tròn mềm.** Hầu hết hiệu ứng là `Points` với một sprite tròn, ống, nón, mặt phẳng shader đơn giản. Lửa, khói, nước, sét đọc "đúng loại" nhưng **không có chất liệu** (không nhiễu fbm, không bọt, không phân nhánh thật, không viền sáng).
2. **Không có hậu kỳ.** Không bloom, không tone mapping, không cộng sáng có kiểm soát; màu cộng dồn thành trắng (Huyền Thoại, tia sáng).
3. **Hiệu ứng nhỏ so với màn.** Camera cố định xa, ống kính hẹp (`fov 10`); nhiều hiệu ứng chiếm chưa tới 1/5 chiều ngang khung chiến đấu. Người chơi nhìn ở cỡ nhỏ; nhiều chi tiết biến mất.
4. **Dùng chung quá nhiều.** 57 skill hệ trống / class dùng 13 hiệu ứng tham số hóa theo màu; bốn tuyệt kỹ hỗ trợ cùng một hình. Đòn class cùng loại nhìn giống nhau.
5. **Chưa có "hợp đồng nhìn thấy" cho từng skill.** Người dựng đọc `descVi` rồi tự đoán. Không có danh sách "phải thấy" kiểm được từng mốc. (Chuẩn mới: `SKILL_DESCRIPTION_STANDARD.md`.)
6. **Kiểm bằng ảnh tĩnh cỡ nhỏ, không xem chuyển động.** Không có ai/gì chấm tính liên tục, tiên đoán (anticipation), theo sau (follow-through), nhịp. Đã mất nhiều lượt vì chụp sai mốc (hiệu ứng "không hiện" thật ra đã qua).
7. **Nhịp 3D tách khỏi nhịp thân.** Thân sinh vật vẫn pose-to-pose 2D; 3D chỉ phủ lên. Chưa có cú "tiếp xúc" (người đánh trúng thật, hình dạng đòn chạm vào thân).
8. **Cường độ hiệu ứng (`off | light | full`, decision 057 B8) chưa nối vào lớp 3D**, `Vfx3dEnv.quality` có nhưng chưa dùng. Chưa có mức chất lượng thấp.
9. **Một số đã ghi ở từng nhóm** (`SKILL_REVIEW.md`): kỵ sĩ đồng phẳng, chim Phượng Hoàng thiếu lông đuôi, Mổ Tia Điện nhỏ…

## 3. Thước chấm và cổng
Chủ dự án chấm trên thang 10, **so cạnh bản hiện tại** (và bản 2D cũ ở HEAD). Tiêu chí (mỗi tiêu chí 0–2, tổng 10):
1. **Đúng mô tả:** mọi động từ / con số trong `descVi` thấy được (hợp đồng nhìn thấy).
2. **Đọc được ở cỡ nhỏ:** nhìn ở khung 600 px ngang vẫn nhận ra hình chủ đạo và đích.
3. **Chuyển động:** có chuẩn bị → tụ → xả → dư âm; đòn trúng có "đập" (squash, hit-stop đúng bậc); không đứng yên.
4. **Chất liệu & màu:** lửa ra lửa, nước ra nước; không bị cộng trắng; bỏ màu vẫn phân biệt hệ.
5. **Hiệu năng & an toàn:** ≥ 50 FPS, tắt được (Giảm chuyển động, Cường độ), không chớp mạnh > 2 lần/giây.

**Cổng thử (pilot):** 3 skill — `skill_ult_trident` (tuyệt kỹ Nước, lớn nhất), `skill_ult_phoenix` (tuyệt kỹ Lửa, có sinh vật), `skill_ld_chain` (nhiều đích, sét). Chủ dự án chấm từng cái. **Cả ba ≥ 7 → mở rộng. Dưới 7 → dừng, viết báo cáo ngắn nói thiếu gì (kỹ thuật hay hướng nghệ thuật) và chờ.** Ghi điểm vào `docs/animation/vfx3d/SCORES.md` (tạo mới).

## 4. Kế hoạch theo cổng
Ước lượng số phiên là **nhận định**, không phải cam kết.

**P0 — Dựng lại nền (0,5 phiên).** Đọc tài liệu mục 9. Chạy `npm run check`, ghi 5 test đỏ cũ. Chụp baseline 3 skill pilot bằng `scripts/animation/shots.ts`. **Hỏi chủ dự án 2–3 ảnh / clip tham chiếu "đẹp" cho mỗi hệ ở pilot** (chỉ học nguyên lý: nhịp, lớp, màu; không sao chép — luật bản quyền decision 048). Commit riêng phần 3D hiện có **nếu chủ dự án đồng ý** (đừng gom hai thay đổi không phải của 3D).

**P1 — Hạ tầng hình ảnh (1–2 phiên).** Đây là chỗ tăng điểm lớn nhất; làm trước khi làm skill nào:
- **Hậu kỳ:** bloom nửa độ phân giải (UnrealBloom hoặc tự viết), tone mapping, có thể tắt theo chất lượng.
- **Bộ shader chung:** fbm noise cho lửa / khói / mây; nước (sóng, bọt, caustic, fresnel); tia sét phân nhánh thật + quầng; năng lượng / ribbon có vệt (trail mesh cập nhật theo thời gian); viền sáng (rim) cho vật chủ đạo.
- **Sprite sinh bằng code:** thay sprite tròn duy nhất bằng atlas flipbook sinh trong canvas (lửa, khói, bọt, tia lửa, tàn, lá, mảnh) để hạt có hình.
- **Hạt mềm đúng thứ tự** (sắp theo độ sâu hoặc blend an toàn), thêm hạt "vệt" kéo theo vận tốc.
- **Cỡ hiệu ứng:** xét lại camera và tỷ lệ để hiệu ứng chủ đạo chiếm đủ lớn (đo: ≥ 1/3 chiều ngang khung với đòn T3+).
- **Nối `quality` và Cường độ hiệu ứng (off / light / full)** vào lớp 3D; thêm chất lượng thấp (ít hạt, tắt bloom).
- **Tùy chọn kết hợp 2D đã duyệt:** dùng ảnh trong manifest (`fxp_*`, `fx_*`) làm texture trên mặt phẳng billboard trong cảnh 3D, để giữ phong cách tranh đã duyệt khi hình vẽ-code không đủ đẹp.
- **Đo FPS thật** (RTX 3050, Electron) ngay sau mỗi hạng mục; trần ngân sách: mục tiêu ≥ 50 FPS khi một tuyệt kỹ chạy.

**P2 — Pilot (1 phiên).** Viết hợp đồng nhìn thấy cho 3 skill pilot, dựng lại bằng hạ tầng mới, chụp (đủ mốc), tự chấm theo thước mục 3, đưa chủ dự án chấm. **Cổng ở đây.**

**P3 — Mở rộng theo hệ (≈ 1 phiên mỗi hệ, 9 hệ + hệ trống).** Mỗi hệ: viết hợp đồng cho từng skill (đặt vào `docs/animation/library/scenarios/skills/<id>.md`), dựng, chụp, cập nhật `SKILL_REVIEW.md`, **xin chủ dự án chấm hệ đó trước khi sang hệ khác.** Thứ tự đề xuất theo độ lộ: Nước → Lửa → Sét → Thiên nhiên → Đất → Kim → Ánh sáng → Bóng tối → Hư không → hệ trống / class / hỗ trợ.
Hệ trống / class: **làm riêng từng loại** (heal, buff, shield, đòn class, tuyệt kỹ hỗ trợ), không dùng một hình đổi màu cho cả nhóm; bốn tuyệt kỹ hỗ trợ cần bốn hình khác nhau.

**P4 — Skill mới (sau khi chủ dự án duyệt `NEW_SKILLS_PROPOSAL.md`; 1–2 phiên).** Làm đúng quy trình mục 5 của file đó, **kể cả decision 060 trước khi sửa `content/`**.

**P5 — Chốt (0,5 phiên).** `npm run check` đầy đủ, đo FPS Electron, cập nhật decision 059 (hoặc 061 nếu thay đổi lớn), `PROGRESS.md`, THIRD_PARTY, đề xuất gộp commit theo nhóm.

## 5. Kiến trúc lớp 3D hiện có (đọc code trong `src/areas/adventure/scene/battle/vfx3d/`)
- `stage3d.ts` — một `THREE.WebGLRenderer` riêng (canvas ngoài màn), mỗi khung vẽ rồi **chép sang một `CanvasTexture` của Phaser** hiển thị bằng một `Image` phủ màn hình ở depth `AIR_DEPTH + 3`. Mọi hiệu ứng nằm **trong cảnh Phaser** nên hit-stop, slow-mo, rung / zoom camera, Giảm chuyển động áp dụng như hiệu ứng khác. Giới hạn cạnh dài canvas 3D: 1280 px. `?vfx3d=0` tắt lớp 3D. Tạo lười (lần đầu có act `vfx3d`).
- **Camera:** `PerspectiveCamera(fov 10)` tại `(0, 23.7, 36.4)` nhìn gốc; `Stage3d.ground(x, y)` đổi điểm màn hình thành điểm trên mặt đất (tia cắt mặt y = 0). Cỡ đơn vị 3D = chiều rộng của neo (đơn vị hay cả hàng) đo trên mặt đất.
- **Vòng đời:** act `vfx3d` (`fx`, `dur`, `size`, `color`, `who`, `at`) trong `battle_fx.json` → `ActPlayer.play` (`fxActs.ts`) → `Stage3d.play(factory, …)` tạo `Vfx3dHandle { update(ms), dispose() }` rồi bám đồng hồ trận qua `FxPlayer.add`. **Hiệu ứng là hàm thuần của tuổi (ms)**: tua được, dừng được, không giữ đồng hồ riêng. `FxPlayer.update` gọi `stage3d.render()` cuối khung.
- `Vfx3dEnv`: `scene`, `origin` (điểm đất dưới đích), `from` (điểm đất dưới người tung), `unit`, `color` (số hoặc null), `row` (đích là cả một phe), `quality` (chưa dùng).
- **Neo hàng:** `@ally` / `@enemy` có thêm `mid` (giữa các chân); `who: "foeside"` / `"allyside"` dùng chúng.
- **Đăng ký:** `effects.ts` (`VFX3D` map) và `VFX3D_IDS` trong `content/schemas/adventure/battleScript.ts`. Thêm hiệu ứng = thêm id vào enum, thêm hàm, thêm vào map, rồi viết act.
- **Phần dùng chung:** `effectParts.ts` (easing, `rng`, `cloud`, `ripple`, `POINT_SCALE`), `earthParts.ts` (`slots`, `shards`, `spikes`…), `*Parts.ts` theo hệ.
- **Mốc act:** với skill hệ trống, `at = timing.impact − đỉnh nội tại của hiệu ứng` để đỉnh trùng nhịp trúng. Với skill đã viết tay, mốc là cố định theo từng skill.
- **Giới hạn tự có:** mỗi file ≤ 300 dòng (`npm run guard`); `battleFxContent.test` cấm script dài hơn `timing.end` và tuyệt kỹ > 3500 ms.

## 6. Quy trình review (bằng chứng trước, ý kiến sau)
- **Công cụ chụp:** `npx tsx scripts/animation/shots.ts <skillId[,skillId]> [--at -500,-250,0,150,400,900] [--cols 4] [--out dir]`. Chụp trong Battle Lab bằng đồng hồ đóng băng, mốc **tương đối so với lúc trúng**, ghi từng khung và một contact sheet. Cần Chrome / Edge (Playwright). Kết quả mặc định ở `art_inbox/vfx3d_shots/` (thư mục này bị git bỏ qua).
- **Xem bằng mắt:** mở contact sheet và **phóng to cắt từng khung quan trọng** (cỡ đầy đủ), không kết luận từ ảnh thu nhỏ. Dùng khoảng 100 ms quanh điểm trúng.
- **Chạy tương tác:** `npm run admin` (cổng 5175), mở `admin.html#/battle-lab`, chọn skill (bộ lọc Nguyên tố). So với bản 2D cũ bằng cách tạm thay `battle_fx.json` bằng bản ở HEAD.
- **Khung hợp đồng:** mỗi skill kiểm đủ danh sách mục 7 của `SKILL_DESCRIPTION_STANDARD.md`.
- **`npm run anim:capture` (cổng "tất định") đang fail trên máy này**, kể cả với asset cũ; dùng `shots.ts` thay.
- **Mọi lần chụp phải nằm cùng lần sửa code** (chống bằng chứng cũ): chạy lại sau mỗi chỉnh.
- Ghi điểm chủ dự án chấm vào `docs/animation/vfx3d/SCORES.md`.

## 7. Luật bắt buộc của dự án (tóm lược; nguồn: `CLAUDE.md`, `docs/AGENT_RULES.md`)
- **Gameplay đóng băng (decision 021).** Chỉ sửa trình diễn. Thêm / đổi skill, số, trạng thái, save → cần decision riêng và chủ dự án duyệt. Không đổi logic trận.
- `src/core/` thuần (không DOM, `Date.now()`, `Math.random()`); lớp 3D nằm ở `scene/` nên được dùng Three.js nhưng **không import ngược vào core**.
- Mọi hiệu ứng / âm thanh / toast chỉ qua đường `FeedbackDirector` / kịch bản trận, không rải code ngoài.
- Không mạng, không server trong bản ship: **Three.js đóng gói cùng game, không tải CDN.** Bản ship không chứa gì ngoài đã cài (npm).
- **Bản quyền (decision 048):** không tạo hình / tên / mô tả liên quan nhân vật, sinh vật, chiêu, thương hiệu của bên thứ ba; mọi thiết kế phải gốc. Học nguyên lý, không sao chép. Ghi thư viện mới vào `docs/THIRD_PARTY.md`.
- Chuỗi hiển thị ở `src/i18n/`; skill mới có `descVi` trong `skills.json` theo chuẩn mô tả. Comment code tiếng Anh. File LF. Trả lời / báo cáo tiếng Việt, theo mẫu báo cáo ở `AGENT_RULES.md` §7.
- Cổng chất lượng: `npm run check` xanh trước khi commit (5 đỏ cũ ở mục 1 là ngoại lệ đã biết, không làm thêm). `npm run content:fmt` sau khi sửa JSON nội dung (test "bố cục ổn định").
- Giảm chuyển động bật → không chớp mạnh, không rung; chớp mạnh ≤ 2 lần / giây (ultimate).
- Không `git push`, không tạo PR nếu chủ dự án chưa yêu cầu; không commit file của người khác.

## 8. Việc chủ dự án phải quyết (hỏi, đừng tự quyết)
1. Chấm điểm từng cổng (mục 3) và tham chiếu "đẹp" cho từng hệ.
2. Duyệt `NEW_SKILLS_PROPOSAL.md`: nhóm A (12 skill quái), nhóm B (10 skill loài), loài nào mang skill nào, quái nào dùng skill quái.
3. Có bán ở EU / UK / Hàn Quốc không (ảnh hưởng chọn công cụ nếu sau này dùng AI 3D ngoài); `THIRD_PARTY.md` còn thiếu dòng cho Gemini (nguồn art hiện có).
4. Có muốn giữ lớp 3D về lâu dài nếu P1–P2 không đạt 7/10 (hoặc quay lại 2D flipbook).
5. Đồng ý commit phần 3D hiện có thành một commit riêng trước khi làm tiếp.

## 9. Danh sách tài liệu và file (đọc theo thứ tự)
1. `CLAUDE.md`, `docs/AGENT_RULES.md`, `docs/PROGRESS.md` (mục đầu), `docs/decisions/058-…`, `059-…`, `021-…`, `048-…`.
2. `docs/animation/SKILL_DESCRIPTION_STANDARD.md` (chuẩn mô tả, hợp đồng nhìn thấy, chuẩn từng hệ).
3. `docs/handover/VFX3D_SKILL_INVENTORY.md` (112 skill, số liệu, 3D hiện tại), `docs/animation/SKILL_REVIEW.md`, `docs/animation/NEW_SKILLS_PROPOSAL.md`, `docs/animation/new_skills.draft.json`.
4. Chuẩn animation có sẵn: `docs/animation/library/STANDARDS.md`, `bibles/elements/*.md`, `bibles/actions/*.md`, `scenarios/skills/*.md` (kịch bản 2D cũ, `draft`), `docs/animation-review/ANIMATION_QUALITY_RUBRIC.md`.
5. Code: `src/areas/adventure/scene/battle/vfx3d/*`, `fxActs.ts`, `fxPlayer.ts`, `BattleScene.ts`, `content/schemas/adventure/battleScript.ts`, `content/adventure/battle_fx.json`.
6. Công cụ: `scripts/animation/{shots,skillInventory,checkNewSkills}.ts`, `tools/admin/battleLab.ts`.
7. Prototype tham chiếu của chủ dự án: `C:\Users\ToraTech\Downloads\Sobi_VFX_Lab_3D.html` (5/10, đúng tinh thần; học cấu trúc kịch bản + pha + inspector).
8. Nghiên cứu nền: `docs/research/2d-3d-strategy/` (chưa commit).

## 10. Bẫy đã gặp (đừng lặp lại)
- **Hạt Three nhỏ hơn 1 px** với camera `fov 10`: `PointsMaterial.size` tính theo khoảng cách, nên mọi cỡ phải nhân `POINT_SCALE` (11,6).
- **Chụp sai mốc** → tưởng hiệu ứng không hiện. Luôn chụp từ sớm, tương đối so với impact; `shots.ts` làm sẵn.
- **Tia sét mượt như dây** nếu dựng bằng `CatmullRomCurve3`: phải là đường gấp khúc.
- **Màu cộng dồn thành trắng** khi nhiều lớp additive chồng nhau: giảm opacity, xếp tầng, tránh chồng cùng chỗ.
- **Skill vẽ cả kết quả của xác suất** (bọc băng khi chỉ 25 % trúng): trạng thái tự vẽ phần đó; skill chỉ vẽ phần chắc chắn.
- **`timing.end` quá ngắn**: test từ chối script dài hơn `end`; tăng `end` cùng hiệu ứng (tuyệt kỹ ≤ 3500).
- **`battle_fx.json` viết bằng script** thì chạy `npm run content:fmt` (test bố cục ổn định).
- **File > 300 dòng** bị `guard` từ chối; tách file theo nhóm hiệu ứng.
- `Stage3d.ground()` trả null phía trên đường chân trời; điểm quá cao so với mặt đất không dựng được.
- Test `battleFxContent` có ngưỡng "≥ N ảnh được kịch bản gọi tên" (đã hạ từ 100 xuống 50 vì 3D thay ảnh). Nếu gỡ 3D, trả về 100.

## 11. Báo cáo cuối mỗi phiên (mẫu ngắn)
Đã làm (file) · đã chạy (lệnh + kết quả, nói rõ test đỏ cũ) · bằng chứng (đường dẫn contact sheet, FPS) · điểm tự chấm theo mục 3 · còn yếu · việc chủ dự án cần quyết · chưa commit gì nếu chưa được phép.
