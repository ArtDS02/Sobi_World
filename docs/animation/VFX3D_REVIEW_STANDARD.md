# Tiêu chuẩn duyệt animation skill (VFX 3D)

**Ngày:** 2026-11-14. **Áp dụng cho:** mọi skill dựng lại trên lớp 3D (decision 059), gồm 112 skill hiện có và 22 skill mới (decision 060).
**Nguồn:** rút từ cách Fable 5.2 đã làm 47 skill (P1–P3, 7 hệ), từ handover và chuẩn mô tả. File này **gom và cụ thể hóa** các tài liệu đó, không thay thế:
- Thước chấm gốc: `docs/handover/FABLE_VFX3D_HANDOVER.md` §3. Kiến trúc lớp 3D: §5. Bẫy: §10.
- Chuẩn mô tả, bảng động từ → hình, chuẩn màu từng hệ, hợp đồng nhìn thấy: `docs/animation/SKILL_DESCRIPTION_STANDARD.md`.
- Bậc lực T0–T4 và ngân sách thời gian: `docs/animation/library/STANDARDS.md` §4–§5.
- Điểm chấm: `docs/animation/vfx3d/SCORES.md`.

Khi các nguồn mâu thuẫn, thứ tự ưu tiên vẫn theo `CLAUDE.md` (spec > decisions > …). Giữa file này và code thì **tin code** và sửa file này.

## 1. Mốc chuẩn (bộ mẫu "đạt chuẩn")
Chủ dự án chọn 47 skill dưới đây làm **mức chuẩn**: skill dựng sau phải đạt ít nhất mức này. Tất cả đã push lên `origin/feature-plot-upgrade`.

| Hệ | Skill | Commit | Bộ phần | Ảnh mẫu | Tự chấm |
|---|---|---|---|---|---|
| Pilot (Nước, Lửa, Sét) | 3 | `a0140c0f` | `post3d`, `atlas`, `quads`, `lines`, `fxKit` | `docs/animation/vfx3d/pilot/` | 7,5–8 |
| Sét | 7 | `ff267782` | `stormParts.ts` | `docs/animation/vfx3d/lightning/` | 6,5–8 |
| Nước | 6 | `2a60a163` | `waterParts.ts` | `docs/animation/vfx3d/water/` | 7–8 |
| Lửa | 10 | `32b65e50` | `flameParts.ts`, `phoenixParts.ts` | `docs/animation/vfx3d/fire/` | 7–7,5 |
| Thiên nhiên | 7 | `2c805f15` | `plantParts.ts` | `docs/animation/vfx3d/nature/` | 7–7,5 |
| Đất | 5 | `375caf09` | `stoneParts.ts` | `docs/animation/vfx3d/earth/` | 7–7,5 |
| Kim | 6 | `76ab7de4` | `steelParts.ts` | `docs/animation/vfx3d/metal/` | 7–7,5 |
| Ánh sáng | 3 | `00dfbbcf` | `glowParts.ts` | `docs/animation/vfx3d/light/` | 7,5–8 |

Mẫu tốt nhất để học (tự chấm 8): `skill_ult_trident` (`tridentSea.ts`), `skill_ult_ld` (`stormArea.ts`), `skill_qt_lumina` (`glowFx.ts`).
Phản hồi đã có của chủ dự án (2026-11-12): Đinh Ba ~7, "cần sinh động hơn"; Phượng Hoàng "xấu, thiếu điểm nhấn, mờ nhạt"; Sét "thiếu mạnh mẽ, sét và mây mờ nhạt". Các bản dựng lại đã sửa theo hướng này. **Chủ dự án chưa chấm số cho 7 hệ.**

## 2. Thước chấm (5 tiêu chí × 0–2 = 10)
| # | Tiêu chí | 2 điểm khi | Thường bị trừ vì |
|---|---|---|---|
| 1 | **Đúng mô tả** | mọi động từ, danh từ, con số trong `descVi` thành một thứ thấy được, đúng thứ tự; đúng số nhịp (`hits`); mỗi mục tiêu có hình riêng | thiếu một động từ ("phun" vẽ thành một viên); một vụ nổ giữa hàng thay vì từng con |
| 2 | **Đọc được ở cỡ nhỏ** | ở khung rộng 600 px vẫn nhận ra hình chủ đạo và đích; bỏ màu vẫn đoán đúng hệ | hạt mảnh như chỉ; vật bay lẫn vào nền; hình phẳng như hình dán |
| 3 | **Chuyển động** | đủ pha chuẩn bị → tụ → xả → trúng → dư âm; cú trúng có "đập" (bẹp / nảy / hit-stop đúng bậc); không khung nào đứng yên | vật xuất hiện sẵn rồi phóng to; không lấy đà; tan biến cùng lúc |
| 4 | **Chất liệu & màu** | lửa ra lửa, đá ra đá (§4); không cháy trắng; viền / lõi đúng hệ | chồng nhiều lớp cộng sáng thành trắng; bloom làm ngả trắng màu chủ đạo |
| 5 | **Hiệu năng & an toàn** | ≥ 50 FPS trên RTX 3050; số hạt theo `env.quality`; chớp mạnh ≤ 2 lần / giây; Giảm chuyển động tắt rung / chớp | hạt cố định không theo `quality`; chớp liên tục; hiệu ứng che mục tiêu quá lâu |

**Ngưỡng:**
- **Tự chấm < 7:** chưa xong. Tự sửa, chụp lại, chấm lại. Không sang hệ khác.
- **Tự chấm ≥ 7:** được ghi điểm và commit. **Mục tiêu 7,5.** Ultimate nên ≥ 7,5.
- **Điểm chủ dự án là điểm cuối.** Tự chấm chỉ để đi tiếp; ghi ở cột riêng.
- Khi chỉ xem được khung tĩnh (không xem clip), tiêu chí 3 chấm **dè dặt** (tối đa 1,5) và nói rõ là chưa xem chuyển động.

## 3. Quy tắc hình ảnh chung (mọi hệ)
1. **Một hình chủ đạo rõ, đủ lớn.** Đòn T3 trở lên: hình chủ đạo chiếm ≥ 1/3 chiều ngang khung chiến đấu. Cỡ theo `env.tall` (chiều cao đơn vị), không theo số cố định. Hình chủ đạo đạt ≥ 2/3 dấu hiệu sống: biến hình, hạt sinh từ chính nó, biến dạng theo vận tốc.
2. **Sơn trước, sáng sau.** Thân vật là "sơn": vài mảng màu phẳng (2–3 tông, dải màu trong `glsl.ts`) có viền / lõi. Cộng sáng (additive) chỉ dành cho thứ thật sự phát sáng. Trên nền trời sáng, vật chỉ cộng sáng sẽ bị bạc màu; vật sơn giữ được viền.
3. **Bloom có chủ đích.** Bloom chỉ bắt màu > 0,9. Chỗ muốn rực (bọt, lõi nóng, lóe) thì đẩy màu > 1. Chỗ phải giữ màu (rune lam, lá xanh) thì giữ < 0,9. Lớp 3D tắt quản lý màu: số trong code là màu trên màn hình.
4. **Hạt có hình.** Dùng atlas (`F.flame`, `F.drop`, `F.leaf`, `F.shard`, `F.star`, `F.feather`…), không dùng chấm tròn mềm làm hình chính. `F.streak` rất mảnh: vật bay cần thấy rõ thì dùng `F.leaf` / `F.drop` kéo dài, màu tương phản nền, có ánh sáng bám theo.
5. **Đủ pha chuyển động.** Chuẩn bị (nhấc, nghiêng ra sau, tụ hạt vào) → xả nhanh (giáng / chém trong 70–110 ms) → trúng (bẹp, nảy, vòng chấn, mảnh vụn, đúng `timing.impact` ± 40 ms) → dư âm (bụi, khói, vết cháy, gợn, tan dần **so le**, không tắt cùng lúc).
6. **Từng mục tiêu.** Đích nhiều con: lấy `env.struck` (đúng mục tiêu của lượt, theo thứ tự). Mỗi con một điểm trúng riêng, lệch nhau 80–160 ms. Không dùng một vụ nổ giữa hàng thay cho từng con.
7. **Nhiều nhịp: 1-2-…-BỤP.** Đúng `hits` nhịp; nhịp cuối to nhất (rung, chớp mạnh nhất). Các nhịp đầu chỉ chớp nhẹ.
8. **Không vẽ kết quả của xác suất.** Bọc băng, bỏng, choáng, Phong ấn… do trạng thái tự vẽ. Skill chỉ vẽ phần chắc chắn xảy ra.
9. **Không che mục tiêu lâu.** Lóe sáng, khối khiên, cột nước, mảng mực… không che kín mục tiêu quá ~150–250 ms. Đây là điểm yếu Fable ghi nhiều nhất ở cột "Còn yếu"; hệ Bóng tối mắc nhiều nhất vì vật liệu là "sơn" đặc.
   **Lớp 3D luôn vẽ đè lên sinh vật** (không có chiều sâu so với sprite): vật đặt "sau lưng" mục tiêu thực ra che mặt nó. Vật đứng cạnh mục tiêu đặt **bên cạnh**, về phía trống (phía người tung), không về phía đồng đội của mục tiêu. Cỡ hình chủ đạo của đòn một mục tiêu nên cỡ thân mục tiêu (`0,5 + env.tall × 0,25` là mốc đã dùng), không to gấp đôi.
10. **Nền phục vụ hệ.** Sét, Bóng tối, đòn mạnh có thể tối nền bằng `tint` trong kịch bản (`battle_fx.json`), trong giới hạn bậc lực. Không đổi `timing` nếu không cần.
11. **Bậc lực đúng bảng** (`STANDARDS.md` §4): hit-stop, rung, chớp, punch không vượt bậc. Hỗ trợ (T0) không rung, không chớp trắng.
12. **Hình gốc 100 %** (decision 048): kỵ sĩ, phượng hoàng, rune, mặt nạ… đều vẽ bằng code từ hình cơ bản, không dựa trên nhân vật / biểu tượng / chữ có sẵn. Ghi một câu xác nhận vào SCORES khi hình dễ gây nghi vấn.

## 4. Ngôn ngữ chất liệu từng hệ (đã dựng)
Mỗi hệ có một bộ phần riêng (`<chất liệu>Parts.ts`). Skill trong hệ chỉ ghép từ bộ phần đó và phần chung. Đây là hướng nghệ thuật Fable đã chốt; hệ chưa dựng phải viết dòng của mình trước khi code.

| Hệ | Bộ phần | Chất liệu (phải có) | Cấm |
|---|---|---|---|
| Sét | `stormParts` | mây giông có khối (bụng tối, đỉnh nhạt, sáng từ trong khi đánh); tia **gấp khúc, phân nhánh, vẽ lại mỗi ~45 ms**; ở điểm trúng: lóe, vòng sáng xé trên đất, tia lửa, điện bò, vết cháy, khói mỏng | tia mượt như dây; sét cộng màu trên nền sáng (phải tối nền) |
| Nước | `waterParts` | thân lỏng xanh sâu có viền trắng và dải sáng chạy; sóng có mào cuộn và bọt; vương miện nước bắn; vũng ướt; bong bóng có viền ngũ sắc; bọt sáng hơn trắng để bloom bắt | nước đứng yên như thủy tinh; hạt phát sáng giống ánh sáng |
| Lửa | `flameParts`, `phoenixParts` | lưỡi lửa có thân (mặt phẳng bị nhiễu ăn mép, bốc lên), tông phẳng của dải lửa, lõi trắng nóng; sắt nung đổi màu đen → đỏ → vàng; dung nham có vỏ nứt; khói | lửa đứng yên; lửa chỉ cộng sáng (mất viền đỏ trên nền sáng) |
| Thiên nhiên | `plantParts` | thân sống (dây, rễ, roi): dải luôn quay về camera, tô như tròn, đường đi tính lại mỗi khung để mọc, quất, quấn; lá, cánh hoa tung; hoa nở; mây bào tử | phát sáng (trừ phấn hoa); thẳng tắp, cứng |
| Đất | `stoneParts` | đá có mặt cắt, ba tông phẳng (sáng từ trên) và hạt sạn; tảng / gai có hình từ seed; vết nứt chạy trên đất; mảnh vụn văng, bụi lăn | phát sáng (trừ ánh trong vết nứt khi cần); nhẹ, lơ lửng |
| Kim | `steelParts` | kim loại bóng vẽ bằng dải phản chiếu và điểm sáng cứng (thép hoặc đồng); cung chém quét rồi mảnh dần; tia "keng" trắng; khiên ghép mảnh khóa lại hoặc vỡ tung | mềm, mờ nhòe; khói |
| Ánh sáng | `glowParts` | tia có lõi trắng, thân vàng với vệt chạy dọc, mảng ấm sơn dưới để đọc được trên trời sáng; hào quang có tia nắng; vòng rune; đốm sáng dịu bay lên | rung, khói; chuyển động giật |
| Bóng tối | `shadeParts` | khối "mù" đen mực, viền tím mảnh, mép bị nhiễu chậm ăn mòn; mắt mở; hàm bóng hai dải răng (không phải cả đĩa); lưới đêm có sao ở nút; mảnh mực mảnh; **sơn, không chiếu sáng**: chuyển động chậm, ánh duy nhất là viền tím; vì sơn che thứ phía sau nên phải nhỏ và tan nhanh ở chỗ mục tiêu | sáng chói; nét cứng; khối đặc che mục tiêu |
| Hư không (chưa dựng) | — | (theo `SKILL_DESCRIPTION_STANDARD.md` §3) vòng, khe nứt, lõi đen, mảnh vỡ trôi; vặn không gian, tách màu | màu ngoài tím lam; vật liệu "thật" |
| Không hệ / class / hỗ trợ (chưa dựng) | — | làm **riêng từng loại** (hồi, tăng, khiên, thanh tẩy, đòn class, tuyệt kỹ hỗ trợ); đổi màu theo `$color` của người tung; hỗ trợ luôn nhẹ, ấm, đi lên | một hình đổi màu cho cả nhóm; bốn tuyệt kỹ hỗ trợ trùng hình |

## 5. Chuẩn code
- **Hàm thuần theo tuổi.** Mỗi hiệu ứng là `(env) => { update(ms), dispose() }`. Mọi thứ tính từ `ms` (tua được, dừng được). Không đồng hồ riêng, không `Math.random()`: ngẫu nhiên lấy từ `h(i, k, seed)` / `rng(seed)`.
- **Mốc thời gian là hằng có tên** trong hàm (`FIRE`, `HIT`…), tính từ đầu act. Hướng đánh lấy từ `env.origin.x >= env.from.x`. Cỡ theo `env.tall`.
- **Số hạt nhân `env.quality`:** `quads(root, Math.round(N * env.quality) + k, …)`. Mức `full` = 1, `light` = 0,55, `off` = 0,3.
- **Dọn sạch:** `dispose()` gọi `env.scene.remove(root)` và `disposeTree(root)`.
- **Tổ chức file:** `<chất liệu>Parts.ts` (phần của hệ), `<chất liệu>Fx.ts` (đòn một mục tiêu), `<chất liệu>Area.ts` (đòn cả hàng), tuyệt kỹ lớn tách file riêng. Dựng lại thì **tạo file mới, xóa file cũ** và sửa import trong `effects.ts` (ví dụ `darkFx.ts` → `shadeFx.ts`). Mỗi file ≤ 300 dòng (`npm run guard`).
- **Comment đầu file bằng tiếng Anh**, kể từng hiệu ứng thành câu: tên id, tên tiếng Việt, cái gì hiện ra theo thứ tự. Đây là bản tóm tắt hợp đồng nhìn thấy trong code.
- **Đăng ký:** id trong `VFX3D_IDS` (`content/schemas/adventure/battleScript.ts`) và map `VFX3D` (`effects.ts`). Act `vfx3d` trong `battle_fx.json`; sửa JSON xong chạy `npm run content:fmt`.
- **Gameplay đóng băng:** không đổi `skills.json`, số, trạng thái, save. Chỉ sửa trình diễn. `timing.end` được tăng nếu act dài hơn (tuyệt kỹ ≤ 3500 ms).

## 6. Quy trình dựng và duyệt một hệ
1. **Hợp đồng nhìn thấy.** Với mỗi skill: đọc `descVi`, `hits`, `target`, `power`, `timing` thật trong `content/`. Liệt kê "phải thấy" theo thứ tự thời gian (khuôn ở `SKILL_DESCRIPTION_STANDARD.md` §6). Tuyệt kỹ và skill mới: ghi hợp đồng đầy đủ vào cuối `docs/animation/library/scenarios/skills/<id>.md` (như 3 pilot). Skill thường: tối thiểu là comment đầu file và cột "Thấy gì" trong SCORES.
2. **Chất liệu.** Hệ mới thì viết bộ phần `<chất liệu>Parts.ts` trước, và dòng của hệ trong bảng §4 file này.
3. **Dựng** từng skill theo §3 và §5.
4. **Chụp sau lần sửa cuối:** `npx tsx scripts/animation/shots.ts <id,id,…> --out art_inbox/vfx3d_shots/p3_<hệ>` (sân 1600 × 900, mốc tương đối so với lúc trúng, bắt đầu từ mốc sớm). Sửa code sau khi chụp thì **chụp lại**: ảnh cũ hơn file code không được dùng làm bằng chứng.
5. **Xem ở cỡ đầy đủ:** phóng to từng khung quan trọng (khoảng 100 ms quanh điểm trúng). Không kết luận từ ảnh thu nhỏ.
6. **Tự chấm** theo §2. Dưới 7: quay lại bước 3.
7. **Ghi bằng chứng:** chuyển contact sheet sang JPG vào `docs/animation/vfx3d/<hệ>/<id>_sheet.jpg`. Thêm bảng hệ vào `SCORES.md` với cột: Skill · Hiệu ứng · Tự chấm · Thấy gì · Còn yếu. Ghi thêm "Bài học" nếu có.
8. **Đo FPS** cho skill nặng nhất của hệ: `npx tsx scripts/animation/fps.ts` (RTX 3050, ≥ 50 FPS).
9. **`npm run check`.** Typecheck, lint, guard, assets:check phải xanh. Test chỉ được đỏ các test đỏ cũ (§7).
10. **PROGRESS.md:** thêm một mục theo mẫu ✅ / 🧪 / 👉 như các hệ trước, ghi danh sách hệ còn lại.
11. **Commit riêng một hệ:** `feat(fx): <hệ> skills rebuilt on the <chất liệu> parts (n of n)`. Không gộp file không phải của mình (`content/farm/layout.json`, `tools/admin/battleLab.ts`, `docs/handover/FABLE_SESSION_PROMPT.md`, `docs/research/`). Chỉ push khi chủ dự án yêu cầu.

### Danh sách kiểm một skill (trước khi báo xong)
- [ ] Mọi động từ / con số trong `descVi` có một hình tương ứng; đúng số nhịp.
- [ ] Điểm trúng khớp `timing.impact` (± 40 ms); act không dài hơn `timing.end`.
- [ ] Đích đúng (một / mọi / ngẫu nhiên), mỗi mục tiêu có hình riêng, lệch 80–160 ms.
- [ ] Có lấy đà, có cú đập, có dư âm so le.
- [ ] Không vẽ trạng thái; không che mục tiêu > ~150 ms.
- [ ] Chất liệu đúng bảng §4; bỏ màu vẫn nhận ra hệ; không cháy trắng.
- [ ] Bậc lực đúng; chớp mạnh ≤ 2 / giây; số hạt theo `env.quality`.
- [ ] Ảnh chụp sau lần sửa cuối; tự chấm ≥ 7, ghi vào SCORES.

## 7. Test đỏ đã biết (không phải lỗi của lớp 3D)
- 2 `studio.test` (thiếu tag git `pre-unity-studio`).
- `assets.test`, `decor.test` (do `content/farm/layout.json` chủ dự án đang sửa).
- `assetsCheck` đôi khi quá 20 s vì máy chậm; chạy riêng với `--testTimeout 120000` thì qua.

## 8. Việc còn lại (2026-11-14)
1. ~~Bóng tối (7)~~: xong 2026-11-14, tự chấm 7–7,5 (`docs/animation/vfx3d/dark/`), chờ chủ dự án chấm.
2. **Hư không (4):** đang dùng bản cũ (`voidFx.ts`, `voidUlts.ts`).
3. **Không hệ / class / hỗ trợ (57):** đang dùng 13 hiệu ứng chung (`supportFx.ts`, `classFx.ts`, `partyUlt.ts`). Phải tách theo loại.
4. **22 skill mới (P4):** viết decision 060 trước khi sửa `content/`, rồi dựng theo file này.
5. **Chốt (P5):** `npm run check` đầy đủ, đo FPS trong Electron, cập nhật decision 059, `PROGRESS.md`, `THIRD_PARTY.md`.
6. **Chủ dự án:** chấm từng hệ đã dựng (điểm chủ dự án là điểm cuối).
