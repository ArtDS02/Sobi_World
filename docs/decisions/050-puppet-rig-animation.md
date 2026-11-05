# 050 — Animation sinh vật: puppet rig cắt mảnh + lớp sống thủ tục (thay "ảnh tĩnh + tween" làm nền)

**Ngày:** 2026-11-05 · **Trạng thái:** đã làm R1 (framework + 4 prototype trên art rig-proof); chờ chủ dự án duyệt cảm giác và vẽ layer (R1b).
**Bối cảnh:** chủ dự án giao "Master prompt — audit, redesign & implement hệ thống animation": sau nhiều lần chỉnh, nhân vật vẫn như ảnh tĩnh được di chuyển bằng code. Audit (`docs/animation/rig/AUDIT.md`) xác định gốc rễ: đơn vị nhỏ nhất của sinh vật là **một ảnh phẳng** (6 key pose `cb_<art>_<pose>` không nhất quán) → mọi chuyển động thân chỉ có thể là tween cả ảnh. Lớp VFX (decision 044 / 049) đã tốt; lớp thân thì không thể tốt hơn với phương pháp cũ.

## Quyết định
1. **Hybrid**, nền là **puppet rig tự viết** (không thêm thư viện, không Spine): bộ phận là ảnh riêng trên xương, clip keyframe theo dữ liệu, cộng **lớp sống thủ tục** (thở, chớp mắt nhịp riêng, lò xo cho phần mềm, dải uốn Phaser Rope cho đuôi / vây / xúc tu / thân cá), **flipbook** giữ cho khoảnh khắc đổi hình (decision 049), **VFX kịch bản** giữ nguyên (decision 044). So sánh phương pháp: `docs/animation/rig/ARCHITECTURE.md` §1.
2. **Dùng chung toàn Sobi World**: runtime thuần ở `src/systems/animation/` (đúng chỗ `ARCHITECTURE.md` §4 dành cho "animation theo dữ liệu"), vẽ Phaser ở `src/ui/puppet/`, dữ liệu ở `content/anim/rigs/<rig>.json` (schema `content/schemas/anim/rig.ts`). Area chỉ nói `Want { action, key, timing }`.
3. **Khớp nhịp bằng mốc**: clip có `windup / release / contact / recover`; trận warp clip vào `cast / release / impact / end` của beat (`ui/battlePerf.ts`) → chạm của thân trùng số sát thương. Tween toàn thân của trận giữ làm root motion (dash, knock-back), giảm xoay / squash theo `feel.root`.
4. **Không rig = như cũ**: `rigOf(art)` null → ảnh + tween + key pose (decision 042). Không đổi save, không đổi logic trận, không đổi `battle_fx.json`.
5. **Asset cũ** (`docs/animation/rig/ASSET_REUSE.md`): key pose / ảnh gốc sinh vật = nhóm C cho animation thân (giữ cho portrait, thẻ, tham chiếu, dự phòng). Layer mới theo `art_inbox/rig_*.md`. Bộ phận **rig-proof** vector do agent vẽ (`asset/rigs/<rig>/<rig>.svg`) chỉ để kiểm chứng chuyển động; manifest `placeholder` → `assets:release` chặn phát hành tới khi có layer vẽ tay.
6. **Prototype 4 body plan**: `pig_boar` (quadruped nhanh), `pig_turtle` (heavy), `fish_betta` (aquatic, thân uốn), `octopus` (cephalopod, 6 xúc tu) — mỗi con idle + 2–3 fidget, move, attack, cast, hurt, hurt_heavy, ko, victory, guard, stunned, buff, dodge. Bạch tuộc chưa là chiến binh: chỉ xem ở Xưởng rig.
7. **Lore** (`Lore_Sobi_World.md`): Lumina = sinh trưởng tự do → bạn đồng hành chuyển động hữu cơ, lệch nhịp; Umbra = chiếm hữu "một ý chí" → lớp `possessed` cho quái tha hoá (R4, đề xuất).

## Lý do
- Chỉ tách bộ phận mới có overlap, follow-through, phối hợp chân – thân – đầu, đổi mặt — đúng tiêu chí chủ dự án; frame-by-frame cho 43 con không khả thi với art AI (không giữ nhân vật đồng nhất qua khung).
- Một bộ layer / con vẽ một lần, clip là dữ liệu chỉnh được, loài mới chép template body plan.
- Tất định, có test, cùng phong cách dữ liệu với phần còn lại của game.

## File
`content/schemas/anim/rig.ts`, `content/anim/rigs/*.json`, `src/systems/animation/*`, `src/ui/puppet/puppet.ts`, `src/areas/adventure/ui/battlePerf.ts`, `src/areas/adventure/scene/battle/{battlePuppets,fxGhosts}.ts` (+ sửa `battleUnits`, `BattleScene`, `fxActs`, `fxPlayer`), `tools/admin/rigLab.ts` (`#/rig-lab`), `scripts/rig/{build-parts,fmt,guide,rigText}.ts`, `asset/rigs/*/`, `art_inbox/rig_*`, `tests/unit/{animationRig,battlePerf}.test.ts`, `docs/animation/rig/*`.

## Bổ sung 2026-11-05 — Animation skill: cử chỉ thân + điểm neo VFX (R2 bước 1)
Chủ dự án giao agent tự chọn giải pháp skill. Quyết định:
1. **Ba lớp của một skill**: thân (clip cử chỉ của loài) – VFX (kịch bản `battle_fx.json`, giữ nguyên) – phản ứng mục tiêu (clip `hurt*` của mục tiêu theo bậc đòn). Không lớp nào thay lớp khác.
2. **Bộ cử chỉ** `GESTURE_VALUES` (`content/schemas/adventure/battlePoses.ts`): `shoot`, `breath`, `summon_ground`, `summon_sky`, `channel`, `brace`, `slam`, `charge`, `lash`, `roar`. Mỗi rig diễn cử chỉ theo thân mình (clip `g_<gesture>`): cùng `shoot` nhưng heo rừng ngửa đầu – xù bờm – hất đầu, cá hút lùi rồi phụt, bạch tuộc phồng túi đầu rồi bóp. Clip `ultimate` riêng cho tuyệt kỹ; clip `skill_<id>` (tuỳ chọn) cho skill cần động tác độc nhất.
3. **Cử chỉ của mỗi skill**: `gesture` trong `battle_fx.json` nếu có; nếu không, **suy từ kịch bản đã viết** (act `move` `cast_*` của người dùng: `cast_bow`/`cast_hover` → channel, `cast_stomp`/`cast_sprout` → summon_ground, `cast_roar` → roar, `cast_raise`/`cast_wing` → summon_sky, `cast_coil` → shoot, `cast_charge` → charge, `cast_spin` → lash); nếu không có, từ cách ra đòn (projectile → shoot, burst → summon_ground, aura hỗ trợ → channel, slam → slam). 83/112 skill có `cast_*` → cử chỉ đúng ý đồ thiết kế ngay. Rig thiếu clip → cử chỉ gần nhất (`brace → channel`, `slam → summon_ground`, `breath → roar`, `summon_sky → channel`, `lash → shoot`, `roar → summon_sky`) → `cast` của loài.
4. **Con có rig bỏ qua tween `cast_*` / `track`** của kịch bản (thân tự diễn); các move dời chỗ (dash, lunge, hop, knock…) vẫn chạy.
5. **Khớp nhịp**: clip cử chỉ có `windup / release (/ contact)`; release ↔ release của beat (đạn rời đi đúng lúc), contact ↔ impact (cú dập, cú quất).
6. **Điểm neo thân cho VFX**: spot mới `mouth`, `tail` trong kịch bản; rig khai `anchors` (`mouth` → bone, `tail` → chuỗi = ngọn); con không rig dùng đầu / sau lưng. Đã chuyển `skill_dm_ink` (vệt mực) sang `mouth`.
7. **Thí điểm**: 8 skill có `gesture` rõ (`skill_mm_poison_thorn`, `skill_qs_rock_smash`, `skill_qs_stone_skin`, `skill_qs_mountain_shell`, `skill_qs_quake`, `skill_hg_inferno_hammer`, `skill_dm_ink`, `skill_dm_night_net`); 22 clip cử chỉ + tuyệt kỹ cho 4 rig; test bắt buộc **mọi skill của dòng máu mỗi prototype ra clip thân riêng**, không rơi về `cast` chung.

Chưa làm (R2 tiếp): clip `skill_<id>` cho skill đặc biệt, `ultimate` có flipbook khoảnh khắc, chuyển thêm spot `mouth` cho các skill phun / thở khác sau khi chủ dự án xem bản thí điểm.
