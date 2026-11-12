# 059 — Lớp VFX 3D cho hiệu ứng skill (thử nghiệm), điều chỉnh decision 058

**Ngày:** 2026-11-11. **Trạng thái:** thử nghiệm, chờ chủ dự án chấm (chưa commit).

## Bối cảnh
Decision 058 chọn animation bằng code Phaser 2D. Chủ dự án đưa `Sobi_VFX_Lab_3D.html` (Three.js, 11 kịch bản, tự chấm 5/10 nhưng
"đúng tinh thần") và nói animation 2D vẫn không thể hiện đúng mô tả skill. Bộ nghiên cứu `docs/research/2d-3d-strategy/` giả định
chưa có prototype; nay đã có. Phạm vi thử: **chỉ lớp VFX của skill chuyển sang 3D**; sinh vật, nền, UI giữ 2D như đã duyệt.

## Thử gì
- Act mới `vfx3d` (`fx`, `dur`, `size`) trong kịch bản `battle_fx.json`; `VFX3D_IDS` ở `content/schemas/adventure/battleScript.ts`.
- `src/areas/adventure/scene/battle/vfx3d/`: `stage3d.ts` (một renderer Three.js vẽ ra canvas riêng, chép vào một texture Phaser
  mỗi khung, hiện thành ảnh phủ màn hình ở depth AIR_DEPTH + 3), `tridentSea.ts` (Đinh Ba Hải Vương), `effects.ts`.
- Hiệu ứng là hàm thuần của tuổi (ms) do đồng hồ trận gọi nên hit stop, slow motion, rung / zoom camera, Giảm chuyển động áp dụng như
  mọi hiệu ứng khác. Camera cố định, ống kính hẹp (ít viễn cận) để khớp tranh 2D phẳng; `Stage3d.ground()` đổi điểm màn hình
  thành điểm trên mặt đất 3D. `?vfx3d=0` tắt lớp này.
- Skill thử: `skill_ult_trident`. Các act 2D thay bằng 3D: vật `fxp_trident`, 2 `fx_splash`, `ribbon`, 4 `decal`, 6 `drop_fall`.
  Rung đầu tiên dời từ 1000 sang 1100 ms cho khớp tiếp đất.
- Thư viện mới: `three` 0.170 (MIT) và `@types/three` (dev); ghi ở `docs/THIRD_PARTY.md`. Cài qua npm, đóng gói cùng game.

## Mở rộng nhóm Nước (2026-11-11)
Thêm 5 hiệu ứng: `bubble_shot`, `bubble_spray` (`bubbles.ts`), `tsunami_sweep` (`tsunami.ts`), `ice_bloom`, `frost_breath`
(`iceFx.ts`); phần dùng chung ở `effectParts.ts`. Env có thêm `from` (điểm đất dưới người ra đòn) cho đạn và hơi thở. Anchor hàng
(`@enemy`, `@ally`) có thêm `mid` (giữa các chân) để hiệu ứng 3D đứng giữa hàng. Hai skill băng bỏ cảnh bọc băng của skill: trạng thái
Đóng băng tự vẽ khi thật sự trúng. `timing.end` của 5 skill tăng bằng độ dài act 3D (bong bóng 1150→1400, sóng thần 1650→2300,
đóng băng 1350→1500, phun bọt 1150→1300, hơi thở băng 1250→1500) vì test không cho kịch bản dài hơn nhịp; lượt hơi dài hơn.
Ảnh: `docs/animation/vfx3d/water_group_3d.jpg`.
Bài học: Three chỉnh cỡ điểm theo khoảng cách chứ không theo ống kính, nên với camera xa phải nhân `POINT_SCALE` (11,6); trước đó
hạt nhỏ dưới 1 px nên không thấy.

## Mở rộng nhóm Lửa (2026-11-11)
Thêm 10 hiệu ứng: `claw_clamp`, `jaw_flame`, `hammer_slam`, `lava_glob` (`fireHits.ts`); `lava_flood`, `magma_cone`, `meteor_rain`,
`flame_pillars` (`fireArea.ts`); `forge_ult`, `phoenix_rebirth` (`fireUlts.ts`); phần dùng chung ở `fireParts.ts` (đám lửa tô màu theo tuổi,
cột lửa, vũng dung nham, kim loại nóng). Các act 2D (`prop`, `strip`, `decal`, `burst`, `cone`) của 10 skill Lửa thay bằng một act `vfx3d`;
`timing.end` chỉnh bằng độ dài act (Càng Nung 1050→1100, Phun Dung Nham quái 1150→1400, Mưa Thiên Thạch 2300→2400, Lửa Tượng Thần 1550→1800,
Lò Rèn 3200→3300 là mốc cũ giữ nguyên; còn lại không đổi). Ảnh: `docs/animation/vfx3d/fire_group_3d.jpg`. Yếu nhất (trước lần chỉnh 2): hình chim của Phượng
Hoàng, hàm của Cắn Than Hồng, búa và đe còn dạng khối. Tốt nhất: dung nham, thiên thạch, hơi thở dung nham.

Chỉnh Lửa lần 2: `forgeHammer` / `forgeAnvil` (`fireParts.ts`) sắt tối có đèn + mặt phát sáng; Phượng Hoàng dựng lại (`fireUlts.ts`);
hàm Cắn Than Hồng nanh trắng nóng + chớp. Ảnh: `docs/animation/vfx3d/fire_fixes_3d.jpg`. Bài học khi chụp: thời điểm trong act không bằng mốc
của lượt cộng 560 ms như tôi giả định cho mọi skill (Cắn Than Hồng bắt đầu sớm hơn); khi chụp phải bắt đầu từ mốc sớm rồi tăng dần,
nếu không dễ kết luận nhầm là hiệu ứng "không hiện".

## Mở rộng nhóm Thiên nhiên (2026-11-11)
Thêm 7 hiệu ứng: `thorn_volley`, `vine_whip`, `spore_cone` (`natureHits.ts`); `root_bind`, `root_quake`, `corrupt_bloom`, `thorn_storm`
(`natureArea.ts`); phần dùng chung `natureParts.ts` (gai, rễ xoắn, luồng bào tử). Act 2D (`prop`, `strip`, `decal`, `burst`, `cone`, `tether`)
của 7 skill thay bằng một act `vfx3d`; `timing.end` chỉnh bằng độ dài act (Gai Độc 1100→1500, Bào Tử Độc 1150→1700, Quất Dây Leo,
Rễ Trói, Rễ Rung Chuyển, Hoa Nhiễm Độc, Bão Gai giữ hoặc khớp). Ảnh: `docs/animation/vfx3d/nature_group_3d.jpg`. Lần này chụp từ mốc sớm (500 ms).

## Mở rộng nhóm Đất (2026-11-11)
Thêm 5 hiệu ứng trong `earthFx.ts`: `boulder_smash`, `quake_spikes`, `tusk_charge`, `rock_fist`, `seal_quake` (vòng phong ấn là shader: vòng, nan hoa, tam giác xoay, ánh vàng).
Act 2D của 5 skill thay bằng một act `vfx3d`; `timing.end` chỉnh bằng độ dài act. Ảnh: `docs/animation/vfx3d/earth_group_3d.jpg`.

## Mở rộng nhóm Kim (2026-11-11)
Thêm 6 hiệu ứng: `steel_slash`, `armor_break`, `steel_charge`, `metal_claw`, `bronze_fist` (`metalFx.ts`), `steel_cavalry` (`metalUlt.ts`); phần dùng chung
`metalParts.ts` (thép, đồng, cung chém là shader quét và mờ dần, tia lửa). Lần đầu cung chém gần như không thấy (đầu sáng chỉ tới 17 % và
bán kính nhỏ); đã sửa shader (đầu quét tới 100 %, vòng dày hơn) và tăng cỡ. Act 2D của 6 skill thay bằng `vfx3d`. Ảnh: `docs/animation/vfx3d/metal_group_3d.jpg`.

## Mở rộng nhóm Sét (2026-11-11)
Thêm 7 hiệu ứng: `thunder_strike`, `chain_lightning`, `spark_peck`, `lightning_dive` (`lightningFx.ts`); `call_thunder`, `thunder_command`, `thunder_rush`
(`lightningArea.ts`); phần dùng chung `lightningParts.ts` (tia sét có góc cạnh dựng bằng đường gấp khúc, nháy, dấu sét xoay là shader). Lần đầu tia sét
mượt như sợi dây và quá dày; đã đổi sang đường gấp khúc, mảnh hơn. Act 2D thay bằng `vfx3d`. Ảnh: `docs/animation/vfx3d/lightning_group_3d.jpg`.

## Mở rộng nhóm Ánh sáng (2026-11-11)
Thêm 3 hiệu ứng trong `lightFx.ts`: `light_ray`, `lumina_ray`, `rune_beam` (tia sáng là hai ống cộng sáng: lõi trắng và quầng màu; cột sáng dùng chung hàm tia). Act 2D (kể cả `beam`)
của 3 skill thay bằng `vfx3d`. Ảnh: `docs/animation/vfx3d/light_group_3d.jpg`.

## Mở rộng nhóm Bóng tối (2026-11-11)
Thêm 7 hiệu ứng: `ink_spray`, `nightmare`, `shadow_bite`, `wraith_touch` (`darkFx.ts`); `night_net`, `night_weave`, `curse_eyes` (`darkArea.ts`; lưới đêm là shader). Act 2D thay bằng `vfx3d`.
Bài test `battleFxContent` có ngưỡng "ít nhất 100 ảnh được kịch bản gọi tên" (kiểm đã đọc danh sách); sau khi 3D thay ảnh của nhiều skill số này còn đúng 100 nên đã hạ ngưỡng xuống 50
(`tests/unit/battleFxContent.test.ts`). Ảnh: `docs/animation/vfx3d/dark_group_3d.jpg`.

## Mở rộng nhóm Hư không (2026-11-11)
Thêm 4 hiệu ứng trong `voidFx.ts`: `void_fist`, `void_vortex`, `sky_bell`, `mythic_awakening`. Act 2D (kể cả `beam`) thay bằng `vfx3d`. Ảnh: `docs/animation/vfx3d/void_group_3d.jpg`.

## Skill hệ trống, class, hỗ trợ (2026-11-11)
57 skill còn lại (hệ trống, class, `SELF`) dùng 13 hiệu ứng tham số hóa: `heal_bloom`, `buff_up`, `shield_dome`, `cleanse`, `mp_channel`, `doom_mark` (`supportFx.ts`);
`class_strike`, `class_combo`, `class_orb`, `ground_stomp`, `class_rain`, `class_meteor` (`classFx.ts`); `ult_party` (`partyUlt.ts`). Hai thay đổi nền: act `vfx3d` có thêm `color` (một màu hoặc `$color` / `$glow`
của hệ người tung; `Vfx3dEnv.color`), và `Vfx3dEnv.row` (act ở trên cả một phe hay cả sân: hiệu ứng trải ra ba chỗ). Mốc `at` của act tính từ `timing.impact` của skill trừ thời điểm đỉnh của hiệu ứng, nên mọi
hiệu ứng đỉnh đúng nhịp trúng; `timing.end` tăng khi cần (tuyệt kỹ giữ trần 3500). Ảnh: `docs/animation/vfx3d/classless_group_3d.jpg`. **Từ đây cả 112 skill đều có 3D.**

## Chỉnh điểm yếu (2026-11-11)
Một đợt chỉnh các hiệu ứng yếu nhất, ảnh `docs/animation/vfx3d/weak_fixes_3d.jpg` (17 skill): Chạm Hồn Ma (bàn tay to, sáng, có ngón), Lưới Đêm (thấp hơn, rõ hơn),
Gọi Sấm (mây giông nhạt và to hơn), Mổ Tia Điện (tia dày hơn), Nện Đá và Nghiền Đồng (nắm đấm to, cổ tay ngắn nên đọc ra nắm đấm, không còn giống cột), Càng Nung (to hơn), Cắn Than Hồng
(thanh hàm sáng cam), Đoàn Kỵ Thép (đồng sáng hơn), Chuông (nhỏ hơn), Huyền Thoại Thức Tỉnh (4 tia mảnh hơn và xếp tầng để giữ màu), Tia Rune (vòng to), Tia Sáng (tia dày),
Gai Độc / Bão Gai (gai to và sáng), Hoa Nhiễm Độc (hoa to), Vuốt Thép (vệt to). Chưa chỉnh: tuyệt kỹ hỗ trợ cùng một hình khác màu; đòn class giống nhau giữa các skill cùng loại;
kỵ sĩ đồng vẫn là bóng phẳng; chim Phượng Hoàng chưa có lông đuôi thật; Huyền Thoại chưa chụp lại ở mốc 4 tia.

## Kết quả đo (2026-11-11)
- Ảnh trước / sau ở Battle Lab (đồng hồ giả, cùng mốc): bản 3D rơi đúng nhịp `impact` của skill; bản 2D cũ có đinh ba tiếp đất
  muộn hơn đòn khoảng 1,3 s. 3D có: đinh ba rơi, vương miện nước, 3 bức sóng ngày càng xa, gợn trên đất, cột nước.
- Hiệu năng: chỉ đo được bằng GPU phần mềm (SwiftShader): trung bình 25,1 ms / khung (tắt 3D) so với 32,6 ms (bật). Chưa đo trên
  RTX 3050 thật; số này là cận trên.
- Hạn chế đã biết: chưa dùng bloom; hạt nước còn mờ trên nền sáng; sóng giống vành nước hơn là một con sóng lớn; chưa chấm theo
  setting Cường độ hiệu ứng (`off | light | full`); chưa có chất lượng thấp; chưa thử Electron; cả 112 skill (9 hệ + hệ trống / class); sóng thần còn dạng khối có đuôi mờ; chưa đo lại FPS sau khi thêm 5 hiệu ứng.

## Chờ chủ dự án
Chấm bản 3D này cạnh bản 2D (`npm run dev:admin`, tab Animation trận, chọn Đinh Ba Hải Vương). Nếu đạt: mở rộng theo bảng
`docs/animation/SKILL_REVIEW.md`, và quyết định này thay mục "không làm 3D" của decision 058. Nếu không: gỡ `vfx3d/`, act `vfx3d`
và `three`; trả `battle_fx.json` về HEAD.
