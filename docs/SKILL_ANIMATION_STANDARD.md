# SOBI WORLD — TIÊU CHUẨN ANIMATION SKILL (VFX 3D)
## Phiên bản 1.0 — 2026-11-15

> **Trạng thái:** tiêu chuẩn chính thức. Chủ dự án **duyệt toàn bộ 134 animation skill** (112 skill cũ + 22 skill mới, decision 059 / 060) ngày 2026-11-15 ở đúng mức điểm tự chấm (7–8 / 10). Mức đó là **chuẩn tối thiểu** cho mọi animation skill làm sau.
>
> **Áp dụng cho:** mọi skill mới hoặc sửa animation skill cũ trong Sobi Adventure (`content/adventure/battle_fx.json` + lớp 3D `src/areas/adventure/scene/battle/vfx3d/`).
>
> **Vị trí trong nguồn sự thật** (`CLAUDE.md`): spec V2 > `docs/decisions/` > tài liệu này > code. Mâu thuẫn giữa tài liệu này và code: tin code, sửa tài liệu này trong cùng commit.

Tài liệu liên quan (đọc khi cần, không lặp lại ở đây):
- `docs/animation/SKILL_DESCRIPTION_STANDARD.md` — cách viết `descVi`, bảng động từ → hình, từ khóa trạng thái → ai vẽ.
- `docs/animation/library/STANDARDS.md` — bậc lực T0–T4 (hit-stop, rung, chớp) và ngân sách thời gian.
- `docs/animation/vfx3d/SCORES.md` — điểm và ghi chú từng skill đã duyệt; ảnh ở `docs/animation/vfx3d/<nhóm>/`.
- `docs/decisions/059-vfx-3d-layer-prototype.md` (lớp 3D), `060-new-skills.md` (quy trình thêm skill), `021-gameplay-freeze.md`, `048-*` (bản quyền).

---

# 1. MỐC CHUẨN ĐÃ DUYỆT

Mỗi skill mới phải đạt ít nhất mức của skill cùng hệ, cùng loại đòn trong bảng dưới. Khi phân vân, mở contact sheet của skill mẫu và so cạnh.

| Nhóm | Số skill | Bộ phần (`vfx3d/`) | Ảnh | Mẫu nên học |
|---|---|---|---|---|
| Sét | 7 | `stormParts` | `vfx3d/lightning/`, `pilot/` | `skill_ult_ld`, `skill_ld_chain` |
| Nước | 6 + 4 mới | `waterParts` | `vfx3d/water/`, `new/` | `skill_ult_trident`, `skill_nh_bubble` |
| Lửa | 10 | `flameParts`, `phoenixParts` | `vfx3d/fire/` | `skill_ult_hg`, `skill_hg_inferno_hammer` |
| Thiên nhiên | 7 | `plantParts` | `vfx3d/nature/` | `skill_e_vine_lash` |
| Đất | 5 + 4 mới | `stoneParts` | `vfx3d/earth/`, `new/` | `skill_qs_rock_smash`, `skill_qs_boulder_roll` |
| Kim | 6 + 4 mới | `steelParts` | `vfx3d/metal/`, `new/` | `skill_ult_tg`, `skill_tg_steel_charge` |
| Ánh sáng | 3 + 5 mới | `glowParts` | `vfx3d/light/`, `new/` | `skill_qt_lumina`, `skill_qt_prism` |
| Bóng tối | 7 | `shadeParts` | `vfx3d/dark/` | `skill_ult_dm`, `skill_dm_nightmare` |
| Hư không | 4 + 5 mới | `riftParts` | `vfx3d/void/`, `new/` | `skill_hk_pure_impact` |
| Hỗ trợ (hồi, tăng, khiên, đặc biệt, tuyệt kỹ) | 42 | `boonParts` + bộ phần của hệ | `vfx3d/support/` | `skill_mm_blossom`, `skill_ult_qt` |
| Đòn class | 15 | dùng lại bộ phần các hệ | `vfx3d/class/` | `skill_cl_tremor`, `skill_cl_energy_orb` |

---

# 2. QUY TRÌNH MỘT SKILL MỚI (ĐẦU → CUỐI)

## 2.1. Dữ liệu gameplay (chỉ khi thêm / đổi skill)
1. Gameplay đang đóng băng (decision 021): **viết decision mới trước khi sửa `content/`** (mẫu: decision 060), ghi một dòng "Lưu ý" vào đầu decision 021.
2. Viết `descVi` theo `SKILL_DESCRIPTION_STANDARD.md` §2 (mọi động từ, con số đều thấy được trên màn hình; số nhịp = `hits`).
3. Thêm hàng vào `content/adventure/skills.json`; nối vào quái (`enemies.json` → `skills`) hoặc loài (`lineages.json` → `species.<id>.unique[ô]`; dòng giữ cố định 4 Unique).
4. Thêm tên / mô tả tiếng Anh vào `content/i18n/en.json` (`adventure/skills.json` → `skills/<id>/nameVi`, `descVi`); thiếu thì test `i18n` đỏ.
5. `npm run content:ids`, `npm run content:fmt`.
6. Chạy bot cân bằng **trước và sau** cùng seed (`npx tsx scripts/sim-adventure.ts 400 1 <zone> rare` cho các vùng có quái / loài bị đổi; `npx tsx scripts/simulate-week.ts 1 30 adventure`), ghi bảng so vào decision. Không tự chỉnh số cân bằng: báo chủ dự án.

## 2.2. Hợp đồng nhìn thấy (trước khi code)
Viết `docs/animation/library/scenarios/skills/<id>.md`:
- Khối ```` ```json scenario ```` hợp lệ (schema ở `scripts/anim-review/lib/scenario.ts`; test `animScenario` kiểm): `id`, `kind: "skill"`, `name`, `element` (`SUPPORT` cho hỗ trợ không hệ), `tier` (0 hỗ trợ · <0,9 → 1 · <1,4 → 2 · ≥1,4 → 3 · tuyệt kỹ → 4), `durationMs` (= `timing.end`), `status: "built"` khi đã dựng, `refs`, `bibles` (≥ 1: `elements/<HỆ>` và một `actions/…`), `assets: []`, `engine: []`.
- Bảy mục `## 1. Ý tưởng` … `## 7. Nghiệm thu`; mục 3 là danh sách **PHẢI THẤY** theo thứ tự thời gian, mục 7 là khối hợp đồng (khuôn `SKILL_DESCRIPTION_STANDARD.md` §6: PHẢI THẤY · KHÔNG ĐƯỢC · NHỊP · HÌNH CHỦ ĐẠO · KIỂM). Mẫu đầy đủ: `skill_ult_trident.md`, `skill_ld_chain.md`; mẫu gọn: `skill_qt_prism.md`.

## 2.3. Dựng
1. Chọn bộ phần của hệ (§4). Hệ / loại mới chưa có bộ phần: viết `<chất liệu>Parts.ts` trước, thêm dòng vào bảng §4 tài liệu này.
2. Viết hiệu ứng theo §5 (code) và §3 (hình), mốc theo §6.
3. Đăng ký: id vào `VFX3D_IDS` (`content/schemas/adventure/battleScript.ts`) và map `VFX3D` (`vfx3d/effects.ts`).
4. Kịch bản trong `battle_fx.json`: một act `{ "do": "vfx3d", "fx": "<id>", "who": …, "at": …, "dur": … }`; phần còn lại (tư thế, chuyển động, rung, hit-stop, âm thanh) lấy từ skill **cùng dạng** (cùng đích, cùng loại đòn), đổi âm thanh sang hệ của skill (`adv_<hệ>_cast` / `_hit`), bỏ `tint` / `vignette` / `glow` / `flash` mang màu hệ khác. `at = timing.impact − HIT` của hiệu ứng, `dur = timing.end − at`. Đòn nhiều nhịp: `stagger` (ms giữa các nhịp, mẫu Chuỗi Sét 220). `npm run content:fmt`.

## 2.4. Duyệt (bằng chứng trước, ý kiến sau)
1. Chụp **sau lần sửa cuối**: `npx tsx scripts/animation/shots.ts <id[,id…]> --gpu --out art_inbox/vfx3d_shots/<lô>` (sân 1600 × 900; mốc mặc định −500 … +1400 ms quanh `impact`; tuyệt kỹ dùng `--abs 700,1200,…,3000`). Sửa code sau khi chụp ⇒ chụp lại.
2. Xem ở cỡ đầy đủ: `python -I scripts/animation/reviewGrid.py <thư mục chụp> <out.png> <id…> [--idx 2,3,4,5] [--crop x,y,w,h]` (mỗi skill một hàng, khung −100 / 0 / +150 / +400). Không kết luận từ ảnh thu nhỏ.
3. Tự chấm theo §7; dưới 7 ⇒ sửa và chụp lại.
4. Đo FPS skill nặng nhất của lô: `npx tsx scripts/animation/fps.ts <id,…>` (RTX 3050 ≥ 50; mức hiện tại 60).
5. Lưu bằng chứng: `python -I scripts/animation/reviewSheet.py <thư mục chụp> docs/animation/vfx3d/<nhóm> <id…>` (contact sheet JPG 8 khung cỡ đầy đủ).
6. Ghi bảng vào `docs/animation/vfx3d/SCORES.md` (Skill · Hiệu ứng · Tự chấm · Thấy gì · Còn yếu) và "Bài học" nếu có; mục mới trong `docs/PROGRESS.md` (✅ / 🧪 / ⚠️ / 👉).
7. `npm run check` xanh (trừ test đỏ cũ §10); commit một lô: `feat(fx): <nhóm> rebuilt / added … (n skills)`. Không gộp file không liên quan.

---

# 3. QUY TẮC HÌNH ẢNH (MỌI SKILL)

1. **Một hình chủ đạo, đủ lớn, đủ sống.** Đòn T3+ chiếm ≥ 1/3 chiều ngang khung. Hình chủ đạo có ≥ 2/3 dấu hiệu sống: biến hình, hạt sinh từ chính nó, biến dạng theo vận tốc.
2. **Đủ pha:** chuẩn bị / tụ (hút hạt vào, nhấc, nghiêng ra sau) → xả nhanh (70–110 ms) → trúng (bẹp, nảy, vòng chấn, mảnh vụn, khớp `impact` ± 40 ms) → dư âm (bụi, khói, gợn) **tan so le**.
3. **Từng mục tiêu:** đích nhiều con dùng `env.struck` (đúng mục tiêu của lượt, theo thứ tự); mỗi con một điểm trúng riêng, lệch 80–160 ms. Không thay bằng một vụ nổ giữa hàng.
4. **Nhiều nhịp 1-2-…-BỤP:** đúng số nhịp, nhịp cuối to nhất; ngẫu nhiên thì nhịp k rơi lên `struck[k % n]`.
5. **Không vẽ kết quả của xác suất** (bỏng, đóng băng, choáng, Phong ấn, Diệt vong, cánh Bất khuất…): trạng thái tự vẽ.
6. **Lớp 3D luôn vẽ đè lên sinh vật** (không có chiều sâu so với sprite): vật "sau lưng" mục tiêu thực ra che mặt nó. Vật cạnh mục tiêu đặt **bên cạnh, về phía trống** (phía người tung); núi / cảnh lớn đặt xa phía sau (z âm) và lệch vào giữa sân.
7. **Không che mục tiêu quá ~150–250 ms.** Hình chủ đạo của đòn một mục tiêu cỡ thân mục tiêu (mốc `0,5 + tall × 0,25`), không gấp đôi. Khiên đứng trước một đơn vị: lệch về phía địch, tan trong ~350 ms.
8. **Sơn trước, sáng sau.** Thân vật là "sơn" (2–3 tông phẳng, viền / lõi). Cộng sáng chỉ cho thứ phát sáng thật. Lớp sơn và lớp ánh sáng ghép riêng ở hậu kỳ: **vật sơn luôn che vật sáng nằm sau nó**, bất kể `renderOrder`.
9. **Bloom có chủ đích:** chỉ bắt màu > 0,9. Muốn rực ⇒ đẩy > 1. Muốn giữ màu (rune lam, cầu vồng, nhát chém màu hệ) ⇒ giữ < 0,9. Lớp 3D tắt quản lý màu: số trong code là màu trên màn hình.
10. **`lines.ts` vẽ lõi trắng, màu chỉ ở quầng:** dùng cho tia sáng, sét, vệt chạy. Tia **nhiều màu** dùng chuỗi hạt sơn (`quads`, không cộng). Tia nối từ một vật sáng dùng `lines`, không dùng `ray` (có lớp sơn ấm sẽ che vật sáng).
11. **Hạt có hình** (atlas `F.*`), không dùng chấm tròn mềm làm hình chính. `F.streak` rất mảnh: vật bay cần thấy dùng `F.leaf` / `F.drop` / `F.shard` kéo dài, tương phản nền.
12. **Trong khung:** vật trên trời đặt ≤ `tall × 1,5–1,7` (tuyệt kỹ có thanh letterbox che mép trên); vòng ấn trên trời thu nhỏ theo `span`.
13. **Tuyệt kỹ đứng ở phe ta** (`who: "allyside"`) không biết vị trí phe địch: phần "lên mọi kẻ địch" dùng vị trí đối xứng qua giữa sân (x → −x).
14. **Bậc lực đúng bảng** (`STANDARDS.md` §4): hỗ trợ T0 không rung, không chớp trắng; chớp mạnh ≤ 2 lần / giây; `flash` / `split` của kịch bản cộng thêm vào lóe của hiệu ứng nên lóe của hiệu ứng ở điểm trúng giữ nhỏ (`clang` power ≤ 0,75).
15. **Hình gốc 100 %** (decision 048): mọi hình (sinh vật, mặt nạ, rune, lồng đèn, kỵ sĩ…) vẽ bằng code từ hình cơ bản, không dựa trên nhân vật / biểu tượng / chữ có sẵn; ghi một câu xác nhận vào SCORES khi hình dễ gây nghi vấn.

---

# 4. NGÔN NGỮ CHẤT LIỆU TỪNG HỆ

Màu hệ lấy từ `battle_fx.json.elements`. Skill trong hệ chỉ ghép từ bộ phần của hệ và phần chung (`atlas`, `quads`, `lines`, `fxKit`, `glsl`, `effectParts`, `post3d`).

| Hệ | Bộ phần | Phải có | Cấm |
|---|---|---|---|
| Sét | `stormParts` | mây giông có khối (bụng tối, sáng từ trong khi đánh); tia gấp khúc phân nhánh vẽ lại mỗi ~45 ms; lóe, vòng xé trên đất, tia lửa, điện bò, vết cháy; tối nền bằng `tint` | tia mượt như dây; sét cộng trên nền sáng |
| Nước | `waterParts` | thân lỏng có viền trắng và dải sáng; sóng có mào cuộn và bọt; vương miện nước; vũng; bong bóng viền ngũ sắc; xoáy; giọt sơn xoắn lên | nước đứng yên như thủy tinh; vành nước cao che mục tiêu |
| Lửa | `flameParts`, `phoenixParts` | lưỡi lửa có thân bị nhiễu ăn mép, lõi trắng nóng; sắt nung đen → đỏ → vàng; dung nham có vỏ nứt; khói | lửa chỉ cộng sáng (mất viền đỏ); lửa đứng yên |
| Thiên nhiên | `plantParts` | thân sống (dây, rễ, roi) tính lại mỗi khung để mọc / quất / quấn / vòng qua; lá, cánh hoa; hoa nở; mây bào tử | phát sáng (trừ phấn); thẳng tắp; đốt dày như tre |
| Đất | `stoneParts` | đá có mặt cắt ba tông, hạt sạn; tảng / gai từ seed; vết nứt chạy; mảnh vụn, bụi | phát sáng (trừ ánh trong nứt); nhẹ, lơ lửng |
| Kim | `steelParts` | kim loại dải phản chiếu + điểm sáng cứng (thép / đồng); cung chém quét rồi mảnh; tia keng; khiên ghép mảnh khóa / vỡ; chông (`spike` 4 cạnh + `metal`) | mềm, mờ nhòe; khói |
| Ánh sáng | `glowParts` | tia lõi trắng thân vàng, vệt chạy dọc, mảng ấm bên dưới; hào quang có tia; vòng rune; đốm dịu bay lên | rung, khói; chuyển động giật |
| Bóng tối | `shadeParts` | khối mù đen mực viền tím, mép nhiễu chậm; mắt; hàm hai dải răng; lưới đêm có sao; mảnh mực mảnh; sơn, chậm, nhỏ và tan nhanh ở chỗ mục tiêu | sáng chói; nét cứng; khối đặc che mục tiêu |
| Hư không | `riftParts` | khe nứt (bên trong đêm có sao, viền tách màu lam / hồng); lõi đêm trong vòng xoáy; chuông trời sao trong suốt nứt sáng rồi vỡ; mảnh không gian khựng, treo, tắt; hút → vặn → vỡ → lặng | màu ngoài tím lam; vật liệu "thật"; khe nứt dựng đứng che mục tiêu |
| Hỗ trợ | `boonParts` + bộ phần của dòng | luôn nhẹ, ấm, đi lên; dấu cộng (hồi), mũi tên theo **màu chỉ số** (công cam, công phép tím, thủ lam, chính xác vàng trắng, né ngọc, tốc độ vàng, MP lam), vòm lục giác (khiên), cột sáng, vòng ấn; skill của một dòng nguyên tố dùng chất liệu của dòng đó | một hình đổi màu cho cả nhóm; rung |
| Đòn class | bộ phần các hệ | mỗi skill một hình; màu theo hệ người tung (`$color`), giữ dưới ngưỡng bloom (× 0,85) | một hiệu ứng chung cho nhiều skill |

---

# 5. CHUẨN CODE

- **Hàm thuần theo tuổi:** `(env) => { update(ms), dispose() }`; mọi thứ tính từ `ms` (tua được, dừng được). Không đồng hồ riêng, không `Math.random()`: ngẫu nhiên từ `h(i, k, seed)` / `rng(seed)`. Mẫu khung `handle(env, build)` dùng chung trong các file mới.
- **Mốc là hằng có tên** (`FIRE`, `HIT`, `HITS = [...]`), tính từ đầu act. Hướng đánh: `env.origin.x >= env.from.x`. Cỡ theo `env.tall` và `span` (bề ngang hàng), không theo số tuyệt đối.
- **Số hạt nhân `env.quality`** (`full` 1 · `light` 0,55 · `off` 0,3): `quads(root, Math.round(N * env.quality) + k, …)`.
- **Dọn sạch:** `env.scene.remove(root); disposeTree(root);`.
- **File:** `<chất liệu>Parts.ts` (bộ phần), `<chất liệu>Fx.ts` (một mục tiêu), `<chất liệu>Area.ts` (cả hàng), `…Ults.ts` (tuyệt kỹ), `…Extra.ts` (skill thêm sau của hệ). Mỗi file ≤ 300 dòng (`npm run guard`). Dựng lại ⇒ tạo file mới, xóa file cũ, sửa import `effects.ts`; gỡ id không còn skill nào dùng.
- **Comment đầu file tiếng Anh** kể từng hiệu ứng: id, tên tiếng Việt, cái gì hiện ra theo thứ tự.
- **Không đổi gameplay** ngoài decision đã duyệt; `timing` chỉ đổi khi act dài hơn (`timing.end` ≥ cuối act; tuyệt kỹ ≤ 3500 ms; test `battleFxContent`).

---

# 6. CỠ VÀ NHỊP (SỐ ĐÃ DÙNG TRONG BỘ CHUẨN)

| Mục | Giá trị |
|---|---|
| Đỉnh hiệu ứng | `at = timing.impact − HIT`; `HIT` thường 280–700 ms |
| Lệch giữa mục tiêu | 80–160 ms (hàng địch 80–90, đồng đội 110) |
| Nhịp của đòn nhiều nhịp | `stagger` 200–220 ms |
| Nhát chém xả | 50–110 ms; lưu 220–320 ms |
| Hình chủ đạo đòn một mục tiêu | cỡ `0,5 + tall × 0,25` … `1,05 + tall × 0,5` |
| Vòm khiên | `(1 + tall × 0,55) × (1 + tall × 0,6)`, khép 220 ms, tan sau 750–1000 ms |
| Mũi tên / dấu cộng | 8–10 cái mỗi đơn vị, sống 0,6–0,9 s |
| Vật trên trời | y ≤ `tall × 1,5–1,7` |
| Che mục tiêu tối đa | ~150–250 ms |
| FPS | ≥ 50 trên RTX 3050 (bộ chuẩn: 60) |

---

# 7. THƯỚC CHẤM (5 TIÊU CHÍ × 0–2 = 10)

| # | Tiêu chí | 2 điểm khi |
|---|---|---|
| 1 | Đúng mô tả | mọi động từ / con số trong `descVi` thấy được, đúng thứ tự, đúng số nhịp, mỗi mục tiêu có hình riêng |
| 2 | Đọc được ở cỡ nhỏ | khung 600 px vẫn nhận ra hình chủ đạo và đích; bỏ màu vẫn đoán đúng hệ |
| 3 | Chuyển động | đủ pha, cú trúng có đập, dư âm so le, không khung nào đứng yên |
| 4 | Chất liệu & màu | đúng bảng §4, không cháy trắng ngoài ý muốn |
| 5 | Hiệu năng & an toàn | ≥ 50 FPS, hạt theo `quality`, chớp ≤ 2 / giây, không che mục tiêu lâu |

**Ngưỡng:** < 7 chưa xong · ≥ 7 đạt chuẩn (mức chủ dự án đã duyệt) · tuyệt kỹ nên ≥ 7,5. Chỉ xem khung tĩnh ⇒ tiêu chí 3 tối đa 1,5 và ghi rõ. Điểm của chủ dự án là điểm cuối.

---

# 8. DANH SÁCH KIỂM

**Một skill:**
- [ ] Hợp đồng nhìn thấy có trong thư viện kịch bản, khối JSON hợp lệ.
- [ ] Mọi động từ / con số của `descVi` có hình; đúng số nhịp; đích đúng; mỗi mục tiêu có hình, lệch 80–160 ms.
- [ ] Đỉnh khớp `impact` ± 40 ms; act không dài hơn `timing.end`.
- [ ] Có tụ / lấy đà, cú đập, dư âm so le.
- [ ] Không vẽ trạng thái; không che mục tiêu > ~250 ms; không đè lên đồng đội bên cạnh.
- [ ] Chất liệu đúng §4; màu giữ được (không cháy trắng ngoài ý muốn); trong khung.
- [ ] Bậc lực đúng; hạt theo `quality`; ảnh chụp sau lần sửa cuối; tự chấm ≥ 7, ghi SCORES.

**Một lô:**
- [ ] `npm run check` xanh (trừ §10); FPS skill nặng nhất ≥ 50.
- [ ] Contact sheet ở `docs/animation/vfx3d/<nhóm>/`; SCORES, PROGRESS cập nhật.
- [ ] Skill mới: decision, `en.json`, bot cân bằng trước / sau.
- [ ] Commit riêng một lô, không gộp file không liên quan.

---

# 9. BẪY ĐÃ GẶP

- Hạt Three nhỏ hơn 1 px với camera `fov 10`: dùng `quads` (cỡ theo đơn vị thế giới), không dùng `PointsMaterial`.
- Chụp sai mốc ⇒ tưởng hiệu ứng không hiện: luôn chụp tương đối so với `impact`, bắt đầu từ −500.
- Tia sét mượt như dây nếu dùng `CatmullRomCurve3`: phải gấp khúc (`forked`).
- Nhiều lớp cộng chồng nhau ⇒ trắng: xếp tầng, giảm alpha, hoặc chuyển sang sơn.
- `shots.ts` đôi khi kẹt ở một mốc (Playwright chờ "ổn định"): đổi mốc là chụp được.
- `Stage3d.ground()` trả null phía trên đường chân trời.
- Sửa JSON nội dung bằng script ⇒ chạy `npm run content:fmt` (test "bố cục ổn định").
- Python sửa file nhiều chỗ: dùng một lần chạy, `assert` từng chỗ thay (một chỗ không khớp sẽ dừng cả lần và file không được ghi).

---

# 10. TEST ĐỎ ĐÃ BIẾT (KHÔNG PHẢI LỖI ANIMATION)

- 2 `studio.test` (thiếu tag git `pre-unity-studio`).
- `assets.test`, `decor.test` (bố cục `content/farm/layout.json` chủ dự án đang chỉnh).
- `assetsCheck` đôi khi quá 20 s khi máy chậm; chạy riêng với `--testTimeout 120000` thì qua.
