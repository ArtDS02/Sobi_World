# ANIMATION REVIEW — Sobi Adventure (combat + map)

> Tài liệu bàn giao cho developer ở session khác, tự đủ nghĩa. Người review: Senior Game Technical Director (session chỉ-đọc, không sửa code).
> Ngày: 2026-11-03. Nhánh: `phase-14-art`. **Phương pháp: đánh giá qua code** (không chạy game, không có ảnh/video lỗi:
> `docs/animation-review/screenshots/` không tồn tại; `tests/feedback/Animation_feedback_v1` là file rỗng 0 byte). Mọi nhận định về
> "nhìn ra sao" được suy từ code + `content/adventure/battle_fx.json`; developer phải xác nhận bằng mắt trong Admin
> "Xưởng animation trận" (`npm run admin` → `#/battle-lab`) và game thật trước khi coi một task là xong.
> Số dòng trích dẫn là của working tree lúc review (có vài file đang sửa dở: `battlePose.ts`, `battleMoves.ts`, `battleUnits.ts`) — tìm theo tên hàm nếu lệch.
> Quy ước dự án (đọc trước khi làm): `CLAUDE.md`, `docs/AGENT_RULES.md`, `docs/decisions/042`, `044`, `docs/animation/COMBAT_ART_GUIDE.md`.
> Ràng buộc kiến trúc phải giữ: logic thời gian **thuần** ở `ui/battle*.ts` (có test), Phaser chỉ phát cue ở `scene/battle/*`;
> khai báo bằng `content/adventure/battle_fx.json` + schema `content/schemas/adventure/battle{Fx,Script}.ts`; chuỗi ở `src/i18n/`;
> asset chỉ qua id → manifest; không đổi logic trận / save; "Giảm chuyển động" (`reduce`) phải vẫn đúng; `npm run check` xanh.

---

## 0. Tóm tắt điều hành

### 0.1 Kiến trúc hiện tại (tóm tắt để khỏi đọc lại)
- **Engine**: Electron + Vite + TypeScript + **Phaser 3.90**. Sân trận = scene Phaser `scene/battle/BattleScene.ts` vẽ **dưới** DOM (nameplate, turn bar, dock, reticle chọn mục tiêu, số bay). Map = `scene/AdventureScene.ts` + `scene/walker.ts`.
- **Animation thân**: **không có sprite sheet/skeletal**. Mỗi chiến binh là 1 ảnh tĩnh "key pose" (`cb_<art>_<idle|attack|cast|hurt|ko|victory>`, fallback ảnh gốc) được biến dạng **thủ tục** mỗi frame: `ui/battlePose.ts::poseOf` (dịch/xoay/squash/độ sáng/glow) + `ui/battleMoves.ts::addMoves` (move do kịch bản gọi: dash, hop, jump, wiggle…).
- **Timeline**: có. `ui/battleMotion.ts::stepMotion` cắt log trận thành *beat* (mỗi lượt 1 beat: start → cast → release → impact → end); `ui/battleScript.ts::stepScript` đặt các *act* của kịch bản (`battle_fx.json` → `skills[id].script`) lên đồng hồ của step; `ui/battlePlan.ts::stepPlan` ra danh sách cue; `BattleScene.update` phát cue theo `performance.now()`.
- **VFX**: có particle (217 preset `particles` trong JSON, `fxBursts.ts`, cap ~420 hạt), strip 4 khung (`fx_*`, 22 dải), prop lớn đi theo đường (`fxp_*`, 12 path: fall/rise/sweep/orbit/pop/grow/throw/fly/stretch/hover…, `fxProps.ts`), beam/tether/cone (`fxLines.ts`), decal mặt đất, tint nền, camera punch/shake, hit-stop, cut-in (`fxActs.ts`), badge trạng thái (`statusBadges.ts`).
- **Layer/z-order**: Phaser depth theo hằng (`GROUND_DEPTH`, `AIR_DEPTH`, thân = `1000 + feet.y`); DOM xếp bằng `z-index` CSS (`_adventure.scss`).
- **Content-driven tốt**: 112 skill đều có script, 25 status đều có icon, có Admin lab để xem. Nền móng **tốt hơn mức trung bình** — vấn đề chủ yếu nằm ở *chất lượng nội dung hoạt ảnh* và vài **lỗi gốc cụ thể** bên dưới.

### 0.2 Điểm số (thang 10)
| Hạng mục | Điểm | Ghi chú ngắn |
|---|---|---|
| Kiến trúc/pipeline animation | 7.5 | Thuần, test được, data-driven, có lab. Thiếu: keyframe track, status "end", layer persistent, HUD state machine |
| Cast / tung phép | 3 | Vòng phép **không bao giờ hiện** (bug §0.3-#1); 29/32 skill quái không có pose cast; chuyển động 1 trục |
| Buff / hỗ trợ | 3.5 | Tất cả buff dùng chung "mũi tên + puff_up"; không phân biệt loại |
| Skill VFX tổng thể | 5 | Nhiều lớp, có hit-stop/shake; nhưng prop là sprite tĩnh trượt đường thẳng, thiếu chuyển động phụ |
| Skill nước/sóng | 3 | `fxp_wave_crest` = 1 ảnh cứng quét ngang |
| Trạng thái (status) | 3.5 | Chỉ có "khi dính" + loop bằng particle; **không có hiệu ứng khi hết**; Đóng băng còn *rung* (sai nghĩa) |
| Ultimate | 5.5 | Có cut-in/tint/shake/prop; nhưng cut-in là dải màu + ảnh, hit-stop ≤120ms, không có môi trường, không outro |
| Chọn mục tiêu (targeting) | 3 | Marker đa mục tiêu nằm **dưới** các unit (z-index 50 < 61–93) → không click được; hit-area 5.2rem |
| Chuyển lượt / HUD | 4 | Chỉ có thanh lượt DOM; không có hiệu ứng "đến lượt" trên sân; dock không co lại |
| Map movement | 4 | 3 khung × 4 hướng, 8 fps cố định, vận tốc tức thời, leader không bob, follower ảnh tĩnh |
| Hiệu năng (đã xét) | 7 | Có cap hạt, hit-stop pause đúng; nhưng cấp phát `Map` mỗi frame mỗi unit (§5) |
| **Tổng thể** | **4.7 / 10** | Nền tốt, "da thịt" còn mỏng; sửa đúng ~8 nền móng thì phần nội dung lên nhanh |

### 0.3 5 vấn đề nghiêm trọng nhất (theo thứ tự xử lý)
1. **Vòng phép/cast sequence không bao giờ chạy** — `battleMotion.ts::circleOf` trả `0` khi `!(own?.circle ?? !own?.script)`; **cả 112 skill đều có `script` và không skill nào đặt `circle: true`** ⇒ `circle` luôn `false` ⇒ chọn skill là vào thẳng script. Đây là gốc của lỗi #4 người dùng báo (→ ANIM-001).
2. **Marker chọn nhiều mục tiêu bị che** — `sideMarker` được thêm sau các unit trong `.adventure-ui__field`, nhưng mỗi unit có `z-index` inline = `round(spot.y)` (61–93) còn `.adv-reticle` chỉ `z-index: 50` ⇒ marker nằm **dưới** unit/nameplate, click rơi vào unit (không có handler). Marker đơn lẻ lồng trong thân unit nên bị unit đứng trước (z lớn hơn) che khi chồng nhau (→ ANIM-002).
3. **Hệ trạng thái thiếu vòng đời "hết hiệu lực"** — log trận không có event `expire`; `statusBadges.ts` chỉ vẽ badge/loop khi đang có, không diff để phát hiệu ứng khi mất; `cleanse`/`resist` có event nhưng **không có visual**. 25 status → 0 hiệu ứng kết thúc; Đóng băng action `frozen` còn dùng `shake` (đứng hình bị rung) (→ ANIM-003, 050–058).
4. **Cử động cast/buff quá nghèo vì thiếu công cụ keyframe** — `battlePose.ts` lines ~154–176 chỉ có 1 pha "ngả lui → đẩy tới" cho mọi cast; khi skill có script, nhánh này **bị tắt** (`script.scripted.has(id) && t >= b.cast`) và script chỉ dùng `move` 1 trục (`rear`, `wiggle`, `hop`, `puff_up`). 29/32 skill quái không có `pose cast`. Buff chung 1 template `spark_pop + puff_up` (→ ANIM-005, 008, 020–021, 030–034).
5. **Ultimate/Skill nước thiếu "cảm giác lớn" & "cảm giác chảy"** — hit-stop ult 80–120 ms, không có môi trường (nứt đất/tuyết/bão/mưa lửa chỉ lẻ tẻ qua `decal ring`), không outro; nước dùng `fxp_wave_crest` (ảnh tĩnh) trượt ngang, không biến dạng (→ ANIM-004, 006, 007, 009, 040, 060–071).

---

## 1. Kiến trúc & nền móng cần làm trước

> Nguyên tắc: **không thêm thư viện**; mở rộng schema `battleScript.ts` (Act union) + `battleFx.ts`; logic thuần → test ở `tests/unit/`; Phaser chỉ phát.
> Thứ tự: 1.1 → 1.2 → 1.3 làm trước mọi task nội dung.

### 1.1 Cast Sequence (ANIM-001) — timeline chuẩn cho animal & quái
Hiện có: `CIRCLE_MS {skill:560, ultimate:820}`, `deliveries{release,impact,end}` trong `battle_fx.json.pacing/deliveries`, beat có `start/cast/release/impact/end`. Bổ sung **profile cast** khai báo trong JSON:

```jsonc
// battle_fx.json
"castProfiles": {
  "default":  { "anticipate": 220, "circle": 360, "release": 120, "recover": 260, "circleStyle": "rune",  "chant": "adv_cast" },
  "support":  { "anticipate": 180, "circle": 300, "release": 100, "recover": 240, "circleStyle": "ring",  "chant": "adv_cast_soft" },
  "ultimate": { "anticipate": 420, "circle": 700, "release": 180, "recover": 520, "circleStyle": "rune_big", "chant": "adv_ult_charge" },
  "physical": { "anticipate": 200, "circle": 0,   "release": 80,  "recover": 220, "circleStyle": "none" }
}
// skills[id].cast = "default" | { ...override }   (override từng pha, vd tsunami: { circle: 480 })
```
Phase (ms, tốc độ x1; x2 nhân `FAST_SHARE`=0.55; toàn step vẫn bị ép ≤ `STEP_MAX_MS`=5600):

| Pha | Skill thường | Support | Ultimate | Nội dung |
|---|---|---|---|---|
| P0 Spotlight lượt | 220 (ở HUD, ANIM-010/080) | 220 | 220 | Đơn vị "bật sáng" + banner tên skill |
| P1 Anticipation | 220 | 180 | 420 | Body: lùi/hạ thấp (xem 1.4 preset), mắt/đuôi, glow dần lên |
| P2 Circle (chồng 60% với P1) | 360 | 300 | 700 | Vòng phép mở dưới chân (scale 0.4→1 easeOutBack), rune xoay ngược chiều 2 lớp, chant SFX |
| P3 Release | 120 | 100 | 180 | Vòng chớp trắng 60ms, thân bật tới/vươn (spring), `adv_cast_release` |
| P4 Skill anim | theo script | — | — | Script hiện có (`script` `at` tính từ **P3 end** = `b.cast` hiện tại) |
| P5 Impact | hit-stop theo tầng (1.3) | — | — | Số/hit react rơi đúng `impact` (đã đúng) |
| P6 Recovery | 260 | 240 | 520 | Vòng mờ dần (overlap 200ms), thân settle (`settle()`), glow tắt |

Cách làm: (a) sửa `circleOf` để mặc định = có vòng khi `category !== 'physical'` (đừng phụ thuộc `!script`); (b) đọc `castProfiles` thay cho `CIRCLE_MS`; (c) `MotionBeat` thêm `anticipate/circleEnd/release/recoverEnd`; (d) `stepPlan` phát cue `circle` + `charge` + `release-flash`; (e) quái dùng **cùng** profile (key theo `category`+`boss`). Đặt file: `src/areas/adventure/ui/battleMotion.ts` (+ `motionProfiles.ts` export `castOf(skillId, pose)`), schema `content/schemas/adventure/battleFx.ts`. Test: `tests/unit/battleMotion*.test.ts` — mọi skill non-physical có `circle>0`, tổng step ≤ `stepMax`.

### 1.2 Status Visual System (ANIM-003)
Hiện có: `statuses[id] = { icon, apply[], loop{every,script}, tint, cover }` (`battle_fx.json`, `statusBadges.ts`). Thiếu: **expire/tick**, **layer liên tục**, **ưu tiên khi nhiều status**, **diff để biết status vừa mất**. Đề xuất mở rộng:

```ts
interface StatusVisual {
  icon: string;                    // chip HUD + badge (đã có)
  apply: Act[];                    // khi dính (đã có)
  layers?: StatusLayer[];          // MỚI: hiệu ứng duy trì liên tục (khác loop theo chu kỳ)
  loop?: { every: number; script: Act[] };   // giữ nguyên cho vụn nhỏ
  tick?: Act[];                    // MỚI: mỗi lần trúng damage over time (poison/burn)
  expire: Act[];                   // MỚI: khi hết / bị cleanse / bị phá
  freezeBody?: boolean;            // MỚI: tắt idle sin/thở, giữ pose (freeze, stun-ngủ)
  tint?: { color: string; alpha: number; pulse?: number };
  priority: number;                // tint/aura mạnh nhất thắng; badge xếp theo priority
}
type StatusLayer =
  | { kind: 'orbit';   img: string; n: number; radius: number; speed: number; spot: 'head'|'chest'|'feet'; behindFront?: boolean }
  | { kind: 'cover';   img: string; frame?: number; alpha: number; pulse?: number }
  | { kind: 'emitter'; ref: string; rate: number; spot: Spot }          // hạt liên tục (bọt độc, tàn lửa)
  | { kind: 'aura';    img?: string; color: string; alpha: number; pulse: number; scale: number }
```
Phát hiện hết hiệu lực: **không có event `expire`** trong `systems/combat/types.ts::BattleEvent` (chỉ có `status`, `cleanse`, `resist`, `tick`). Không đổi logic trận ⇒ `StatusBadges.update` đã nhận `statuses` mỗi frame cho từng unit → giữ `Map<unitId, Set<StatusId>>` frame trước, **diff**: id mất đi ⇒ phát `expire[]` tại anchor unit (cue `act`), id mới (không do step đang chiếu) ⇒ bỏ qua (đã có `apply`). Khi unit `down` thì xoá layer không phát expire. Layer vẽ trong `statusBadges.ts` (đổi tên cân nhắc `statusLayers.ts`), depth `1000 + feet.y ± 0.5`. Act `cleanse` mark đã có trong `StepMark` nhưng `battleScript.ts` **không xử lý** (chỉ xử lý `reaction/phase/revive/victory`) → thêm.

### 1.3 Screen FX Director (ANIM-004)
Hiện có rải rác: `stop` (hit-stop ms), `shake`, `punch` (zoom), `flash`, `tint`, `split`, `cutin`. Gom lại thành 1 module `scene/battle/screenFx.ts` với API:
```ts
screenFx.hitStop(tier: 'light'|'medium'|'heavy'|'ultimate' | ms)   // 50 / 80 / 120 / 180–260 ms
screenFx.slowMo(scale: number, ms: number, easeOut = true)         // vd 0.25 trong 350ms trước đòn kết
screenFx.shake({ amount, ms, dir?: {x,y}, decay: 'exp' })         // shake có hướng, suy giảm mũ
screenFx.zoomTo({ target: 'unit'|'center', zoom, ms, hold, ease })
screenFx.letterbox(on, ms)                                         // 2 thanh đen trên/dưới (cinematic)
screenFx.vignette(color, alpha, ms)
screenFx.chromatic(ms)                                             // đã có 'split'
```
`BattleScene` hiện chỉ có `holdUntil` + `tweens.timeScale`; slow-mo cần `timeScale` trung gian (≠0) **và** nhân `dt` của `fx.update`, `bursts`, `poseOf` (đồng hồ của step dùng `performance.now()` nên slow-mo thật sự cần một "stage clock" riêng: `stageNow = ∫ timeScale dt`; cue/pose đọc `stageNow` thay vì `performance.now()`; `p.at` phải ở cùng hệ). Schema: act mới `slowmo`, `letterbox`, `vignette`; `stop` cho phép `tier`.

### 1.4 Keyframe pose track + preset cast (ANIM-005)
Thêm act `track` (và 8–10 preset đặt tên) vào `battleScript.ts` + `battleMoves.ts`:
```jsonc
{ "do":"track", "at":0, "who":"actor", "dur":520, "keys":[
  {"t":0.00,"dx":0,"dy":0,"rot":0,"sx":1,"sy":1},
  {"t":0.40,"dx":-14,"dy":6,"rot":-7,"sx":1.06,"sy":0.92,"ease":"outBack"},   // lùi lấy đà
  {"t":0.55,"dx":-14,"dy":6,"rot":-7,"sx":1.06,"sy":0.92},                     // giữ
  {"t":0.72,"dx":18,"dy":-10,"rot":9,"sx":0.94,"sy":1.1,"ease":"outQuad"},    // vươn
  {"t":1.00,"dx":0,"dy":0,"rot":0,"sx":1,"sy":1,"ease":"spring"} ] }
```
Preset (`"move":"cast_<name>"`, dùng khi khai báo ngắn): `cast_charge` (lùi→bật), `cast_raise` (ngẩng, vươn lên, rung nhẹ), `cast_roar` (phình ngực sx/sy 1.12, ngửa rot, rung), `cast_stomp` (nhún xuống rồi dậm), `cast_spin` (xoay 360 + vươn), `cast_hover` (nổi lên, lắc nhẹ), `cast_sprout` (cho thực vật: co rồi bung), `cast_coil` (cho cá/rắn: uốn S), `cast_bow` (cúi chào cho support), `cast_wing` (flyer: vỗ cánh, đẩy lên). Chọn preset mặc định theo `bodyOf(art)` (`quadruped|aquatic|flyer|floater|sprout|heavy`). Yêu cầu: mọi track phải kết thúc về pose 0 (test thuần).

### 1.5 VFX library / preset
Hiện đã có 217 particle preset + strip + prop. Cần thêm **3 loại kỹ thuật** (task riêng): ribbon/mesh (ANIM-006), prop motion modifier (ANIM-007), layer liên tục (1.2). Quy ước đặt tên preset mới: `<element>_<verb>` (vd `water_ribbon_wave`, `ice_shard_burst`). Không tạo particle ngoài `battle_fx.json`.

### 1.6 Layer / z-order manager (ANIM-002 + đề xuất)
Bảng depth hiện tại (Phaser): GROUND_DEPTH(decal) < thân `1000+feet.y` < AIR_DEPTH(~hiệu ứng) < CUTIN_DEPTH(`AIR_DEPTH+20`). Hằng nằm rải ở `fxBursts.ts`/`fxActs.ts`. Gom vào `scene/battle/layers.ts`:
`BACKDROP 0 · GROUND_DECAL 5 · SHADOW 100 · BODY_BACK(status layer sau) 999 · BODY 1000+y · BODY_FRONT(status layer trước) 1000+y+0.5 · AIR_FX 5000 · SCREEN_TINT 7000 · CINEMATIC 8000 · CUTIN 9000`. DOM CSS: gom z-index thành biến SCSS: `field 10 · fxcanvas 12 · dock 20 · turnbar 40 · reticle 60 (xem ANIM-002) · banner 70`.

### 1.7 HUD state machine (ANIM-010)
`ui/battleHud.ts` (thuần) với trạng thái: `idle(wait)` → `turnStart(ally|enemy)` → `choosing` → `aiming` → `resolving(animating)` → `result` → `idle`. Mỗi trạng thái xác định `dock: 'open'|'compact'|'hidden'`, `turnbar: 'full'|'mini'`, `plates: 'full'|'hp-only'|'hidden'`. Nguồn sự kiện: `playingStep()` (đang chiếu step), `state.aim`, `vm.actor`. Transition CSS 180–240ms `transform/opacity` (không layout). Test thuần bảng chuyển trạng thái.

---

## 2. Danh sách task

> Ký hiệu: **P0** chặn chơi/yêu cầu cốt lõi · **P1** ảnh hưởng lớn · **P2** đánh bóng. Mọi task: giữ `reduce` đúng, không đổi logic trận, `npm run check` xanh, thêm/cập nhật test thuần nơi có logic thời gian, kiểm tra bằng Admin lab `#/battle-lab`.
> Đường dẫn gốc: `src/areas/adventure/…` (viết tắt `adv/`), `content/adventure/battle_fx.json` (viết tắt `fx.json`), schema `content/schemas/adventure/` (viết tắt `schema/`).
> **Danh sách skill/status/quái gốc ở Phụ lục A** (kiểm kê đầy đủ).

---
### Nhóm Targeting

### [ANIM-002] Sửa z-order, hit-area và feedback của vòng chọn mục tiêu
- [x] Đã làm (B0)
Ghi chú dev: ĐIỀU CHỈNH (làm phần gốc lỗi, bằng CSS thay vì dựng aimlayer riêng). `_adventure.scss`: marker bên-nhiều-mục-tiêu `z-index:300` (trên mọi unit/plate), `.adv-reticle` z 60, Ø 5.2→6rem (`$adv-reticle-size`), vùng click mở rộng +0.9rem (`::after`, ~7.8rem), hover/focus scale 1.12 + transition 120ms, plate `pointer-events:none` khi `.is-aiming`. `battleField.ts`: unit aimable được nâng z-index +100 (`AIM_Z_LIFT`) nên marker/vùng click không bị unit khác che. CHƯA làm (còn lại): hover làm sáng unit trong Phaser (`StageUnit.hover`), nhãn pill mới, ellipse+ring từng mục tiêu, phím Esc/mũi tên (Tab/Enter đã chạy nhờ button), test jsdom `elementFromPoint`. Cần xác nhận bằng mắt trong game.
- Ưu tiên: **P0**
- Nhóm: Targeting
- Đối tượng: mọi skill/đòn đánh cần chọn mục tiêu; đặc biệt skill nhiều mục tiêu (`allEnemies`, `allAllies`, `all`: tsunami, quake, ult…)
- File liên quan: `adv/ui/battleField.ts` (`unitOnField`, `marker`, `sideMarker`, `SPOTS`); `adv/ui/battleView.ts` (`renderBattle`, thứ tự con của `.adventure-ui__field`); `src/styles/features/_adventure.scss` (`.adventure-ui__unit` ~l.824, `.adv-reticle` ~l.1164–1245, `__field` l.819, `__fxcanvas` l.822)
- Hiện trạng (nguyên nhân gốc, đã đối chiếu code):
  1. **Marker nhiều mục tiêu bị đè.** `sideMarker()` là con *sau* các unit trong `.adventure-ui__field`; unit có `style="z-index:{round(spot.y)}"` (SPOTS.y = 61…93) trong khi `.adv-reticle { z-index: 50 }`. Hai phần tử cùng nằm trong stacking context của `__field` ⇒ 50 < 61–93 ⇒ marker ở **dưới** mọi unit và nameplate của chúng; chỗ nào có unit/nameplate (đều `pointer-events:auto` do `.adventure-ui__unit{pointer-events:auto}`) thì click không tới marker. Chỉ phần ellipse hở giữa các unit mới click được ⇒ cảm giác "rất khó click".
  2. **Marker đơn nằm trong thân unit** (`__body` → `button.adv-reticle`) nên z-order = z của unit. Các unit chồng nhau (hàng ally x=31/19/16, y=79/61/93; ảnh 10rem, boss 15.5rem; nameplate rộng, bật `pointer-events:auto`) → unit đứng *trước* (y lớn) che marker của unit *sau*. Nameplate của unit trước nằm đè lên thân unit sau.
  3. **Hit-area nhỏ & không khoan dung**: 5.2rem tròn ở giữa 10rem thân; ảnh unit không phải vùng click (chỉ marker); `:hover { scale:1.08 }` nhỏ, không có tooltip tên/sát thương ngoài chip `adventure-ui__eff`.
  4. Ảnh unit thật nằm trong Phaser canvas (`pointer-events:none`) nên *không* nhận click — đúng, nhưng DOM `__face` bị `visibility:hidden` khi `has-stage` ⇒ vùng click phải do DOM `__body` đảm nhận, mà hiện chỉ marker nút nhận click.
- Hướng sửa:
  1. Tách **lớp targeting riêng**: trong `renderBattle`, khi `state.aim` bật, render một `<div class="adventure-ui__aimlayer">` (position:absolute; inset:0; **z-index: 60**; `pointer-events:none`) là con của `.adventure-ui__battle` (không phải của `__field`), chứa *tất cả* reticle (đơn + side) đặt bằng toạ độ % của `SPOTS` (cùng hệ toạ độ với `__field`: nhớ `top/right/bottom/left` của `__field` — đặt aimlayer cùng box). Mỗi reticle `pointer-events:auto`. Thứ tự DOM: side marker **trước**, marker đơn **sau** (marker đơn ưu tiên khi chồng).
  2. Hit-area: mỗi unit aimable có **nút trong suốt** kích thước = hộp ảnh thật (`10rem×10rem`, elite `12rem`, boss `15.5rem`) + padding 0.5rem, `border-radius:50%`, đặt trong aimlayer, bên dưới vòng reticle. Reticle (ring+X) vẫn là hình ảnh; vùng click = hộp lớn này. Mục tiêu tối thiểu **7rem** mỗi cạnh kể cả unit nhỏ.
  3. Khi aiming: nameplate của unit **không aimable** và mọi `.adventure-ui__plate` đặt `pointer-events:none` (CSS `.is-aiming .adventure-ui__plate {pointer-events:none}`); `tooltip title` giữ.
  4. Feedback hover/focus (CSS + 1 class): hover → ring scale 1→1.12 (`transition 120ms cubic-bezier(.2,.9,.3,1.4)`), màu ring sáng lên (đỏ cam `#ff7a3c` → vàng `#ffd23c`), hiện nhãn `tên · hiệu quả` (đã có `__eff`) phía trên đầu bằng pill 0.8rem, và *làm nổi unit trong Phaser*: thêm vào `StageUnit` field `hover: boolean` (UI ghi qua `data-hover` → `battleStage()`), `BattleUnits.apply` tăng `light` +0.15 & viền glow trắng; unit không hover tối nhẹ (`alpha 0.8`).
  5. Side marker: thay ellipse lớn bằng **ellipse bao quanh tất cả mục tiêu + ring nhỏ trên từng mục tiêu** (nhấp vào bất kỳ đâu trong ellipse hoặc ring đều kích hoạt); hover side → tất cả mục tiêu cùng highlight.
  6. Bàn phím: `Tab`/phím mũi tên chuyển mục tiêu, `Enter` chọn, `Esc` huỷ (accessibility, rẻ).
  7. Tham số: ring dày 4px, `Ø` 5.2rem → **6rem**; anim `reticle-in` 180ms; xoay đứt nét 6s; hover pulse 0.7s.
- Phụ thuộc: không.
- Tiêu chí nghiệm thu:
  - [ ] Với 3 enemy chồng lên nhau, click vào bất kỳ chỗ nào trên thân/nameplate vùng thân của một enemy chọn đúng enemy đó.
  - [ ] Skill `allEnemies`: click ở **giữa một unit**, ở **nameplate**, và ở khoảng hở đều kích hoạt.
  - [ ] Hover làm unit đó sáng lên trong Phaser và hiện nhãn; di chuột ra thì tắt.
  - [ ] Tab/Enter/Esc hoạt động; không có phần tử nào chặn click (kiểm bằng DevTools "pointer-events" overlay hoặc `document.elementFromPoint` ở 9 điểm).
  - [ ] Test DOM nhỏ: `elementFromPoint` tại tâm mỗi unit khi aiming trả về reticle/hit-area (có thể làm test jsdom).
- Asset cần thêm: không (CSS). Tuỳ chọn `ui_reticle_ring.png` — xem file asset `A07`.

---
### Nhóm Cast (nền móng)

### [ANIM-001] Cast Sequence chuẩn + sửa lỗi vòng phép không hiện
- [x] Đã làm (B0)
Ghi chú dev: ĐIỀU CHỈNH. Gốc lỗi sửa ở `ui/battleMotion.ts::circleOf`: mặc định có vòng khi pose ≠ 'attack' (cast/support/ultimate), không phụ thuộc `script`; `skills[id].circle:false` để tắt. Vì `release/impact/end` đã cộng độ dài vòng nên script vẫn bắt đầu ở `b.cast`. Test cập nhật (`battleMotion/battleScript/battleFx.test.ts`) + test mới 'every spell opens with its magic circle' (mọi skill non-physical `circle=true`, `cast>start`, step ≤ stepMax). CHƯA làm: `castProfiles` trong JSON (anticipate/release/recover riêng, boss profile), SFX `adv_cast_release`, sàn P2≥160ms — dùng `CIRCLE_MS` hiện có (skill 560 / ult 820) tạm thời; nên làm cùng ANIM-005/022.
- Ưu tiên: **P0**
- Nhóm: Cast
- Đối tượng: **mọi skill non-physical của animal và quái** (112 skill; xem Phụ lục A)
- File liên quan: `adv/ui/battleMotion.ts` (`circleOf` ~l.153–158, `stepMotion` ~l.164–), `adv/ui/motionProfiles.ts` (`CIRCLE_MS`, `timingOf`), `adv/ui/battlePlan.ts` (cue `circle`/`charge`, nhánh `own` l.69–76 `continue` bỏ qua charge), `adv/ui/battleScript.ts` (`stepScript` dùng `b.cast`), `adv/ui/battlePose.ts` (`if (b.circle && t < b.cast)`), `scene/battle/fxPlayer.ts` (case `'circle'` ~l.114), `fx.json` (`pacing`, `deliveries`), `schema/battleFx.ts`
- Hiện trạng: `circleOf()` trả 0 trừ khi `own?.circle ?? !own?.script` là true. Vì **mọi skill đều có `script`** và **không skill nào set `circle`** (kiểm tra `fx.json`: danh sách `circle:true` rỗng) ⇒ `beat.circle=false` ⇒ không `circle` cue, không "nâng người + chớp sáng" (battlePose), script chạy ngay tại `b.start`. Thêm nữa nhánh `own` trong `stepPlan` bỏ `charge` mặc định và pose cast chung bị tắt khi script có move/pose. Kết quả đúng như người dùng mô tả: "chọn skill là chạy animation ngay".
- Hướng sửa:
  1. Thêm `castProfiles` + `skills[id].cast` như §1.1; schema + migration nhẹ của JSON (mặc định giữ nguyên hành vi cho skill physical).
  2. `circleOf`: `profile.circle > 0` quyết định; mặc định = `category !== 'physical'` (magical/support/hybrid/ultimate) — đừng phụ thuộc `script`. Skill physical dùng P1+P3 (không vòng).
  3. Tách thời gian beat: `anticipate` (P1) bắt đầu ở `b.start`, vòng mở chồng 60%, `b.cast` = hết P2+P3; script bắt đầu ở `b.cast` (đã đúng cho `stepScript`); `impact` giữ theo `deliveries`.
  4. `fxPlayer` circle: xem ANIM-022 cho visual; ở task này chỉ cần: scale 0.4→1 `easeOutBack` 360ms, 2 lớp xoay ngược nhau (±1.6 rad/s), flash trắng 60ms ở release, fade 200ms trong P6.
  5. Phát SFX `chant` ở P2 và `release` ở P3 (id mới `adv_cast_release`, nếu thiếu file → im lặng, ghi `docs/ASSET_TODO.md`).
  6. Áp cho quái y hệt animal: quái không cần chi nhánh riêng; `boss` dùng profile `ultimate`-nhẹ (`anticipate 320, circle 520`).
  7. Bảo toàn `STEP_MAX_MS` (5600): khi step nhiều beat bị ép, `k` nhỏ hơn — kiểm chứng P2 vẫn ≥ 160ms sau ép (đặt sàn).
- Phụ thuộc: không (làm đầu tiên cùng ANIM-002).
- Tiêu chí nghiệm thu:
  - [ ] Chọn một skill phép của animal: thấy lùi lấy đà (~220ms) → vòng phép mở dưới chân (~360ms) → chớp trắng & bật tới → rồi mới chạy hiệu ứng skill.
  - [ ] Quái cast phép (vd `skill_e_curse`, `skill_e_magma_breath`) có đủ chuỗi: cast action → vòng tròn → skill → impact → recovery.
  - [ ] Đòn vật lý (`skill_cl_power_strike`…) không có vòng nhưng có lấy đà rõ.
  - [ ] x2 tốc độ và `reduce` vẫn đúng; step 3 beat không vượt 5600 ms.
  - [ ] Test: mọi skill category ≠ physical có beat `circle=true` và `cast>start`.
- Asset cần thêm: SFX `adv_cast_release`, `adv_ult_charge`, `adv_cast_soft` (file `A09`); vòng phép đẹp hơn: `A04`.

### [ANIM-022] Nâng cấp hình ảnh vòng phép (rune circle theo hệ)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. Vòng phép 3 lớp (`fxPlayer` case circle): vòng ngoài +1.2 rad/s, vòng giữa -1.8 rad/s, glyph theo hệ ở tâm nhịp 3Hz (`elements.*.glyph`: lửa spark, nước drop, mộc leaf, đất rock, kim shard, sấm spark, tối smoke, sáng star, hư ring, trung tính rune), cột sáng khi sắp thả, depth GROUND+3; ult/boss ×1.5 tốc độ quay. CHƯA làm: hạt `<elem>_rise` dưới đáy, art rune theo hệ (A04) — 9 hệ chỉ khác glyph+màu, khó phân biệt 'không đọc tên' bằng code; boss ×2.6.
- Ưu tiên: P1
- Nhóm: Cast
- Đối tượng: 9 hệ (`FIRE, WATER, NATURE, EARTH, METAL, LIGHTNING, DARK, LIGHT, VOID`) + trung tính; vòng nhỏ (skill) và lớn (ult/boss)
- File liên quan: `scene/battle/fxPlayer.ts` case `'circle'`, `scene/battle/fxTextures.ts` (`CIRCLE_KEY`, texture vẽ bằng code), `fx.json` `elements.*` (thêm `circle: {glyph, outer, inner}`)
- Hiện trạng: vòng = **một** ảnh `CIRCLE_KEY` (glow dẹt) ADD, tint theo `look.color`, xoay đơn, một lớp ⇒ giống nhau ở mọi hệ; không có rune/hoa văn; depth cố định `10` (thấp hơn mọi thứ — có thể bị ground decal che).
- Hướng sửa: vòng 3 lớp (outer ring rune, inner glyph theo hệ, light beam lên) — lớp ngoài xoay +1.2 rad/s, lớp giữa −1.8 rad/s, lớp trong glyph đứng yên pulse 0.9↔1.05 (6 Hz); đáy phát hạt `<elem>_rise` 14 hạt/s; tia sáng cột mờ (`fx_light_pillar` frame 1 alpha 0.35) khi bước vào P3. Kích thước: `a.width * 1.6` (skill) / `2.1` (ult) / `2.6` (boss); dẹt 0.38. Khi asset PNG chưa có → fallback vẽ code (đang dùng). Depth = `GROUND_DEPTH + 3` (trên decal, dưới thân).
- Phụ thuộc: ANIM-001.
- Tiêu chí nghiệm thu: [ ] 9 hệ nhìn là biết hệ (không đọc tên); [ ] vòng nhìn "có độ sâu" (≥2 lớp quay ngược); [ ] không che thân unit; [ ] 3 unit cast cùng lúc không tụt FPS (<2 ms/frame thêm).
- Asset cần thêm: `A04_cast_circles.md`.

### [ANIM-005] Keyframe pose track + preset cast theo dạng thân
- [x] Đã làm (B2)
Ghi chú dev: ĐIỀU CHỈNH. `ui/castTracks.ts` (thuần): `sampleTrack`, 6 ease, 10 preset `cast_*` (hằng `CAST_TRACKS`), `CAST_BY_BODY` (6 dạng thân -> 6 preset khác nhau), biên độ nhân `width/160`, lật theo hướng nhìn. Act `track` {keys} + move `cast_*` trong schema; `battleMoves.addMoves` xử lý cả hai; `battlePose` cast mặc định nay dùng preset theo thân (support = `cast_bow`) thay chuỗi nghiêng cố định; skill có `track`/`cast_*` thì tính là `scripted`. Test `castTracks.test.ts` (mọi track về pose 0, kể cả track trong JSON). CHƯA làm: dropdown xem preset trong Admin lab; gán preset riêng cho từng skill (ANIM-020/021); `cast_spin` kết thúc ở 360° (≡ 0, test so modulo 360).
- Ưu tiên: P1
- Nhóm: Cast
- Đối tượng: tất cả
- File liên quan: `adv/ui/battleMoves.ts` (`addMoves`, enum `move`), `schema/battleScript.ts` (Act union), `adv/ui/battlePose.ts` (l.154–176 cast mặc định), `tests/unit/battleFx.test.ts`
- Hiện trạng: thân chỉ có 1 chuỗi cast cố định (rot ±5–7°, dx ±8–14, sx/sy ±5%) — **biên độ quá nhỏ để đọc là "tung phép"**; khi skill có script thì chuỗi này bị tắt và thay bằng đúng 1 `move` trong script. Không có cách nhiều bước (thu → giữ → vươn → giật lại).
- Hướng sửa: xem §1.4. Thông số mặc định `cast_charge`: anticipation 40% (dx −14, dy +6, rot −7°, sy 0.92/sx 1.06), hold 15%, release 25% (dx +18, dy −10, rot +9°, sy 1.1/sx 0.94, `outQuad`), settle 20% (`settle()` spring). Biên độ nhân theo `a.width/160` để unit to/nhỏ cùng cảm giác. Thêm `ease` set: `linear,outQuad,inQuad,inOutQuad,outBack,spring`. Chọn preset mặc định theo `BODY` plan trong `bodyOf`.
- Phụ thuộc: ANIM-001.
- Tiêu chí nghiệm thu: [ ] mỗi plan thân (6 loại) có preset cast khác nhau, nhìn ra; [ ] track luôn về pose 0 (test); [ ] Admin lab có dropdown xem preset; [ ] không phá `scripted` logic (script có `track` ⇒ tắt cast mặc định).
- Asset cần thêm: không.

### [ANIM-020] Cử động tung phép của Animal (22 combat animal)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. Body plan thêm cho 9 loài (ĐỀ XUẤT DEV, chủ dự án xác nhận theo ảnh): flyer = pig_phoenix/valkyrie/dragon; floater = pig_galaxy/mythical/crystal; heavy = pig_turtle/boar; sprout = pig_sunflower. Preset cast gán tự động cho 82 skill phép có script (theo hệ/loại: lửa roar, nước coil, mộc sprout, đất stomp, kim/sấm charge, tối/hư hover, sáng raise, support bow) bằng cách thay move nhẹ đầu tiên của actor (rear/wiggle/…) hoặc chèn mới; skill đã có dash/jump/… giữ nguyên. CHƯA làm: giữ pose `cb_<art>_cast` suốt P1–P3, tinh chỉnh từng skill bằng mắt.
- Ưu tiên: P1
- Nhóm: Cast
- Đối tượng: 9 dòng (lineage) × 4 skill riêng + 32 skill class + 12 ultimate (Phụ lục A); loài `PIG_*` (20 species) và 2 cá (`fish_pufferfish`, `fish_betta`)
- File liên quan: `fx.json` `creatures` (body plan mỗi art: hiện chỉ **15 mục**, gồm 13 quái + 2 cá ⇒ các `PIG_*` mặc định `quadruped`!), `adv/ui/motionProfiles.ts::bodyOf`, `adv/ui/battlePose.ts`
- Hiện trạng: `bodyOf(art)` mặc định `'quadruped'` cho mọi animal không khai báo ⇒ Phượng Hoàng (`PIG_PHOENIX`), Rồng (`PIG_DRAGON`), Kỳ Lân, Thiên Mã… đều nhún/thở như thú bốn chân; không flyer/floater.
- Hướng sửa: (1) khai báo `creatures` cho tất cả `PIG_*` (flyer: PHOENIX, VALKYRIE, DRAGON?; floater: GALAXY, MYTHICAL, CRYSTAL?; heavy: TURTLE, BOAR…; sprout: SUNFLOWER; aquatic: POSEIDON?) — chốt với chủ dự án theo ảnh; (2) mỗi skill unique 36 cái chọn preset cast (ANIM-005) hợp hệ: nước `cast_coil/cast_hover`, lửa `cast_roar`, sấm `cast_charge` + rung, đất `cast_stomp`, mộc `cast_sprout`, sáng/tối/hư `cast_raise`; (3) pose key `cb_<art>_cast` giữ ở giai đoạn P1–P3 (không chỉ `release+160`).
- Phụ thuộc: ANIM-001, 005.
- Tiêu chí nghiệm thu: [ ] mỗi animal có body plan đúng; [ ] 4 skill riêng của một dòng có 4 cách tung khác nhau; [ ] mọi preset kết thúc về idle mượt.
- Asset cần thêm: nếu thiếu `cb_<art>_cast` cho animal nào → xem `docs/ASSET_TODO.md`.

### [ANIM-021] Chuỗi tung phép của Quái (29/32 skill quái không có pose cast)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. Quái: thêm body plan cho 9 quái; skill_e_* phép có preset (magma_breath/dragon_roar/frost_breath/howl = roar, curse = hover, meteor/doom_mark/holy_ward/rune_beam = raise, thorn_storm = sprout); 11 skill quái tấn công thêm telegraph (`marker` 300ms dưới chân mục tiêu trước impact). Vòng phép đã hiện cho quái nhờ B0. CHƯA làm: telegraph đỏ riêng cho boss, intent icon phát sáng (ANIM-082), mimic chưa có body plan (không rõ art id).
- Ưu tiên: P1
- Nhóm: Cast
- Đối tượng: quái thường và trùm: `enemy_old_treant, enemy_magma_drake, enemy_ancient_guardian, enemy_abyss_kraken` (boss) + 29 quái; 32 skill `skill_e_*`
- File liên quan: `fx.json` `skills.skill_e_*.script`, `creatures`, `adv/ui/battlePose.ts`
- Hiện trạng: trong `fx.json`, chỉ 3/32 skill quái có `pose cast` (kiểm tra script); 29 skill còn lại chỉ có `move`+`burst`+`sound`; nhiều quái (mimic, newt, jelly…) chưa có entry `creatures` ⇒ dùng `quadruped` hoặc `aquatic` theo tiền tố `fish_`. Không có tín hiệu "sắp ra chiêu" nên người chơi khó đọc quái cast.
- Hướng sửa: mỗi skill quái thêm `cast` profile (ANIM-001) + preset: `skill_e_magma_breath` `cast_roar` (cổ ngửa rot −12°, ngực phình sy 1.12, 380ms) rồi cone; `skill_e_curse` `cast_hover` + vòng DARK; `skill_e_meteor` `cast_raise`; `skill_e_dragon_roar` `cast_roar` + shockwave; `skill_e_thorn_storm` `cast_sprout`; `skill_e_frost_breath` `cast_roar` lạnh; `skill_e_doom_mark` `cast_raise` + `fxp_doom_clock`… Boss: thêm telegraph 300ms (vòng đỏ dưới chân mục tiêu, `marker` act) trước impact. Intent icon (`u.intentArt`) phát sáng khi sắp thực hiện (ANIM-082).
- Phụ thuộc: ANIM-001, 005.
- Tiêu chí nghiệm thu: [ ] mỗi skill quái có ≥3 pha rõ (lấy đà/cast/giật lại); [ ] vòng phép hiện cho quái cast phép; [ ] boss có telegraph; [ ] không skill quái nào "bắn ngay không báo".
- Asset cần thêm: nếu có `cb_enemy_*_cast` chưa vẽ (xem `ASSET_TODO.md`) → mục `A08`.

---
### Nhóm Buff

### [ANIM-008] Ngôn ngữ hình ảnh buff (registry)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. `ui/buffLanguage.ts` (bảng family/màu/hướng/loại layer cho 18 status buff+debuff, `DEBUFF_MAX_MS` 400) + `buffLanguage.test.ts` ép nội dung JSON theo bảng (đủ entry, đúng màu họ, buff có layer duy trì, debuff đi xuống ≤400ms). Nội dung ở `battle_fx.json statuses`. Khác đề xuất: lưới hex/vòm dùng hình `ring` code thay `fx_hex_guard` (chưa có asset A03); spdUp đổi màu #ffe36a -> #ffd23c theo bảng. Chưa kiểm 'đoán đúng 5/6' bằng mắt.
- Ưu tiên: P1
- Nhóm: Buff
- Đối tượng: tất cả skill `support` (animal: 14 unique + 16 class + 4 ult; quái: 8) và 14 status buff/debuff
- File liên quan: `fx.json` `actions.buff/debuff/heal/regen`, `statuses.*.apply`, `adv/ui/battleScript.ts` (`run` cho reaction `buff`/`debuff`), mới `adv/ui/buffLanguage.ts` (thuần, bảng id→look)
- Hiện trạng: action `buff` = `spark_pop + puff_up(1.06)` cho **mọi** buff; `apply` của mỗi status buff có 3–4 act nhưng chỉ khác `fx_*`/icon, không khác **ngôn ngữ chuyển động & hướng**. Người dùng báo đúng.
- Hướng sửa — **bảng ngôn ngữ hình ảnh** (dùng làm tiêu chuẩn cho ANIM-030…034 và status):

| Loại | Màu chủ | Hình khối | Hướng/Chuyển động | Hạt | Aura loop | Icon (HUD) |
|---|---|---|---|---|---|---|
| Tăng công (atkUp/matkUp) | `#ff5a3c` / `#b06aff` (phép) | mũi kiếm / sao nhọn 4 cánh | **bay lên + nở ra**, xung nhịp tim 1.2 Hz | tia lửa đỏ bắn lên 8/s | viền sáng đỏ quanh thân, nhịp | kiếm đỏ ↑ |
| Tăng thủ (defUp/mdefUp) | `#4aa8ff` / `#8fe0ff` | **lục giác/khiên** | **ép vào trong → khoá** (hex co từ ngoài vào thân) | mảnh kim loại nhỏ | lưới hex mờ quanh thân | khiên xanh ↑ |
| Hồi máu (heal/regen) | `#6ff0a0` | dấu cộng, lá, tim | **trôi lên chậm, lắc ngang (sin)** | `plus_rise`, `leaf_rise` 6/s | vầng xanh dịu ở chân | thập xanh |
| Tăng tốc (spdUp) | `#ffd23c` | vệt gió/mũi tên ngang | **vệt chạy ngang ngược hướng nhìn**, thân hơi nghiêng 6° | streak 10/s | afterimage nhẹ (trail 80ms) | giày/gió vàng |
| Né/Chính xác (evaUp/accUp) | `#b0f0ff` / `#ffe08a` | mờ ảnh / tâm ngắm | evaUp: thân mờ 0.85↔1 nhấp nháy; accUp: ngắm xoay | hạt mảnh | — | |
| Khiên (shield) | `#9ad0ff` | **vòm/bong bóng** | vòm phồng ra → ổn định, gợn sóng khi trúng | — | vòm loop alpha 0.35 pulse | khiên tròn |
| Chọc giận (taunt) | `#ff4a4a` | dấu `!`/mắt đỏ/loa | **xung sóng đỏ lan rộng**, thân giật to | — | mắt đỏ trên đầu | |
| Debuff (…Down) | tối hoá màu gốc `#6b4a8a` | mũi tên **hướng xuống** + khói tím | **sụp xuống**, thân thấp/xám nhẹ | khói tím rơi | khói loop | mũi tên ↓ |
- Quy tắc chung: buff = chuyển động **đi lên/mở ra**, debuff = **đi xuống/co vào**; buff dùng màu bão hoà sáng + ADD blend; debuff dùng màu trầm + NORMAL blend; thời lượng apply 500–700ms; luôn có 3 lớp: *lead* (flash/ring 100ms), *body* (aura/particle 400ms), *settle* (glow fade 200ms) + 1 SFX riêng.
- Phụ thuộc: ANIM-003 (layer), ANIM-004.
- Tiêu chí nghiệm thu: [ ] đặt 6 buff cạnh nhau, che icon, người xem đoán đúng loại ≥5/6; [ ] buff và debuff khác hướng chuyển động; [ ] bảng này được mã hoá trong `buffLanguage.ts` + test "mọi status buff/debuff có entry".
- Asset cần thêm: `A03_buff_auras.md`.

### [ANIM-030] Buff "Tăng công/phép/chính xác" (power)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. atkUp/matkUp/accUp: apply ring màu + hạt bay lên + sao `fx_pow_star` (atk) + puff 1.12; layer duy trì: aura glow (atk), aura + 3 rune quay (matk), crosshair quay quanh đầu (acc); loop mũi tên lên mỗi 1.4s; expire khói màu. CHƯA làm: anticipation ngồi xuống + hạt hút vào (cần act hạt hướng vào), skill cụ thể (`skill_cl_aim`… giữ script cũ, chỉ nhận preset cast).
- Ưu tiên: P1
- Nhóm: Buff
- Đối tượng: status `atkUp`, `matkUp`, `accUp`; skill `skill_cl_aim`, `skill_cl_focus`, `skill_cl_dash`(tempo), `skill_hg_forge_fire` (self buff), `skill_e_howl`, `skill_e_dragon_roar`
- File liên quan: `fx.json` `statuses.atkUp/matkUp/accUp.apply`, `skills.skill_cl_aim|skill_cl_focus|skill_hg_forge_fire|skill_e_howl|skill_e_dragon_roar.script`
- Hiện trạng: ví dụ `skill_cl_aim` = `tilt` + `fxp_crosshair` + `spark_big` + glow — có crosshair nhưng thân gần như đứng yên; `atkUp` apply 3 act chung chung.
- Hướng sửa: (1) P1 anticipation 180ms: thân *ngồi xuống* (sy 0.9, dy +6) hạt đỏ hút vào (`ember_rise` ngược — dùng `trail` hướng vào); (2) P2 220ms: bùng nở — ring đỏ (`decal ring #ff5a3c`, size 1.6) + flash 60ms + `fx_pow_star` trên đầu + thân phình sx/sy 1.12 rồi settle; (3) P3 loop: viền sáng đỏ (`aura` layer, alpha 0.35 pulse 1.2 Hz) và 1 mũi tên ↑ đỏ bay lên mỗi 1400ms; matkUp thay đỏ bằng `#b06aff` + rune xoay quanh đầu (`orbit` n=3 radius 0.3w speed 2.4); accUp: crosshair xoay quanh đầu (`fxp_crosshair` orbit, alpha 0.8).
- Phụ thuộc: ANIM-003, 005, 008.
- Tiêu chí nghiệm thu: [ ] 3 loại nhìn khác nhau không cần icon; [ ] hiệu ứng duy trì không che mặt; [ ] hết hiệu lực có `expire` (aura tắt dần 300ms).
- Asset cần thêm: `A03`.

### [ANIM-031] Buff phòng thủ & khiên
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. defUp/mdefUp/shield: apply vòm `fx_shield_dome` + hạt kim loại, layer `ring` duy trì (thay lưới hex), shield có expire (vòm vỡ). CHƯA làm: mảnh bay VÀO ép sát thân (cần act hạt hút), vòm chớp khi bị đánh lúc có shield, vật liệu riêng từng skill (đá/đồng/mực/hư không).
- Ưu tiên: P1
- Nhóm: Buff
- Đối tượng: `defUp`, `mdefUp`, `shield`; skill `skill_qs_stone_skin`, `skill_qs_mountain_shell`, `skill_tg_bronze_wall`, `skill_cl_hold_fast`, `skill_cl_shield_wall`, `skill_cl_fortress`, `skill_hk_void_veil`, `skill_dm_ink_veil`, `skill_e_bark_skin`, `skill_e_iron_shell`, `skill_e_stone_guard`, `skill_e_holy_ward`
- File liên quan: `fx.json` các script trên + `statuses.defUp/mdefUp/shield`
- Hiện trạng: ví dụ `skill_qs_stone_skin` đã có `fxp_stone_plate` ×2 + `fx_shield_dome` nhưng `shield`/`defUp` không có lớp duy trì ⇒ sau 1 giây không còn nhìn thấy gì ngoài icon.
- Hướng sửa: apply = lục giác/mảnh *bay vào ép sát thân* (3–6 mảnh, từ bán kính 1.2w co về 0.55w trong 380ms, easeInQuad) kèm tiếng "clang"; xong thành **lớp duy trì**: lưới hex mờ (`aura` img `fx_hex_guard`, alpha 0.28, xoay chậm 0.3 rad/s) hoặc vòm (`shield`: `fx_shield_dome` frame cuối, alpha 0.35, gợn sóng khi trúng — khi unit bị hit và có `shield` ⇒ vòm chớp alpha 0.8 trong 120ms + gợn); `defUp` màu `#4aa8ff`, `mdefUp` `#8fe0ff`; skill vật liệu: đá (qs: mảnh đá), đồng (tg: tấm đồng), ink_veil (dm: màn mực đen), void_veil (hk: màn tím trong suốt).
- Phụ thuộc: ANIM-003, 008.
- Tiêu chí nghiệm thu: [ ] mảnh bay *vào* thân (không bay ra); [ ] vòm/lưới còn thấy khi đứng yên, mờ đi khi hết; [ ] bị đánh lúc có shield → vòm chớp.
- Asset cần thêm: `A03` (`fx_hex_guard`, vòm loop).

### [ANIM-032] Hồi máu / hồi sinh / thanh tẩy
- [ ] Chưa làm
Ghi chú dev (B4): CHƯA LÀM đủ. Đã có từ B1/B4: action `cleanse`, `regen` loop+expire, `autoRevive` layer+expire. Còn: heal dâng từ chân lên, stagger 100ms nhiều mục tiêu, mini-ult revive.
- Ưu tiên: P1
- Nhóm: Buff
- Đối tượng: events `heal`/`revive`/`cleanse`; status `regen`, `autoRevive`; skill `skill_nh_soothe`, `skill_nh_tide_song`, `skill_qt_first_light`, `skill_qt_guiding_lamp`, `skill_mm_sprout`, `skill_mm_blossom`, `skill_cl_mend`, `skill_cl_cheer`, `skill_cl_healing_rain`, `skill_cl_purify`, `skill_cl_second_wind`, `skill_cl_channel`, `skill_cl_undying`, `skill_cl_rally`, `skill_cl_aura`, `skill_e_soothe`, `skill_ult_nh/qs/qt/mm`
- File liên quan: `fx.json` `actions.heal/regen/revive`, `statuses.regen/autoRevive`, `adv/ui/battleScript.ts` (bỏ sót `cleanse`)
- Hiện trạng: `heal` = `plus_rise + plus_pop + star_pop + decal(600)` — giống hệt cho mọi nguồn; `cleanse` (thanh tẩy) có event nhưng không có visual; `regen` chỉ 2 burst.
- Hướng sửa: heal = **vầng xanh `#6ff0a0` dâng từ chân lên đầu** (mask-like: dùng strip `fx_heal_rise` + dấu cộng lắc ngang sin 6px, 6 hạt/s, 700ms) + thanh HP nhấp; số heal xanh bay lên (DOM đã có). cleanse = **vòng trắng quét từ chân lên đầu** (decal ring → scale 1.4) + các hạt "bẩn" (khói tím/xanh) bị hút lên rồi tan + chim bồ câu/ánh sáng (`fx_light_pillar` alpha 0.5) 400ms; regen mỗi lượt tick: 3 lá (`leaf_rise`) + 1 plus nhỏ; autoRevive icon: phượng nhỏ xoay (layer orbit n=1). Revive (đã có `fx_light_pillar`): thêm mini-ult — thân bay lên 24px rồi hạ, flash trắng 150ms, tim `heart_rise` 12 hạt.
- Phụ thuộc: ANIM-003, 008.
- Tiêu chí nghiệm thu: [ ] heal/cleanse/revive nhìn khác nhau; [ ] cleanse hiển thị ngay cả khi không có damage; [ ] heal nhiều mục tiêu stagger 100ms.
- Asset cần thêm: `A03` (`fx_heal_rise`).

### [ANIM-033] Buff nhịp độ: tăng tốc, né tránh
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. spdUp có expire; evaUp có layer 2 bóng ảo lệch quanh thân (alpha 0.12) + expire. CHƯA làm: thân nghiêng 6° + afterimage trail loop, thân nhấp nháy mờ 4Hz, spdDown/evaDown nặng nề, `phase_shift`.
- Ưu tiên: P2
- Nhóm: Buff
- Đối tượng: `spdUp`, `evaUp`, `accDown?`(không), `spdDown`, `evaDown`; skill `skill_ld_swift_bolt`, `skill_cl_dash`, `skill_hk_phase_shift`
- File liên quan: `fx.json` các `statuses`/`skills` trên
- Hiện trạng: `spdUp` (5 act) và `evaUp` (4 act, có loop) có sẵn nhưng cùng ngôn ngữ puff/tia sáng.
- Hướng sửa: spdUp = vệt gió vàng ngang chạy *ngược hướng nhìn* + thân nghiêng 6° + afterimage trail 80ms loop mỗi 1.6s; evaUp = thân nhấp nháy mờ (opacity 0.85↔1, 4 Hz) + vệt "ảo ảnh" lệch ±6px màu `#b0f0ff`; `spdDown/evaDown` ngược: vệt nặng chảy xuống, thân nặng (dy +4, sx 1.03, sy 0.97) + xích/slime. `phase_shift`: thân trong suốt 0.4 + mờ rìa, 300ms rồi chớp lại.
- Phụ thuộc: ANIM-003, 008.
- Tiêu chí nghiệm thu: [ ] nhìn thấy thân "nhanh"/"mờ"; [ ] loop không ồn (≤ 1 vụ nổ hạt/1.2 s).
- Asset cần thêm: `A03`.

### [ANIM-034] Taunt và họ debuff (…Down, doom-mark)
- [x] Đã làm (B4)
Ghi chú dev: ĐIỀU CHỈNH. 7 debuff: apply ≤300ms (squash + mũi tên xuống + hạt riêng từng loại: kim loại rơi / mảnh khiên / rune tắt / mực / đá / bùn) màu #6b4a8a, loop khói tím mỗi 1.8s. taunt: sóng đỏ 360ms + mắt đỏ trên đầu (layer) + puff 1.15. CHƯA làm: kiếm gãy/khiên nứt dạng hình (asset), neo/xích.
- Ưu tiên: P2
- Nhóm: Buff
- Đối tượng: `taunt`, `atkDown, defDown, matkDown, mdefDown, accDown, evaDown, spdDown`; skill `skill_cl_taunt`, `skill_e_doom_mark`, `skill_tg_armor_break`, `skill_cl_armor_crush`
- File liên quan: `fx.json` `statuses.*Down.apply`, `actions.debuff`
- Hiện trạng: debuff = `squash + puff_pop` + icon; không phân biệt loại; `taunt` chỉ 2 act.
- Hướng sửa: taunt = sóng đỏ lan 360ms + mắt đỏ trên đầu (layer orbit n=1 pulse) + thân giật to (puff 1.15) 200ms; debuff theo thuộc tính: atkDown = kiếm gãy rơi xuống; defDown = khiên nứt (lưới hex vỡ); matkDown/mdefDown = rune tắt/vỡ; accDown = mờ mắt (vòng tối quanh đầu); evaDown = chân bị nặng (neo/xích rơi); spdDown = chậm (hạt bùn/kẹo kéo từ chân, thân sx 1.04). Mọi debuff: mũi tên ↓ tím + khói tím rơi, màu trầm, NORMAL blend; **tối đa 400ms** để không rườm.
- Phụ thuộc: ANIM-003, 008.
- Tiêu chí nghiệm thu: [ ] 7 debuff phân biệt được bằng hình; [ ] không tốn thời gian > 400ms/unit.
- Asset cần thêm: `A03`.

---
### Nhóm Skill (chung)

### [ANIM-006] Ribbon/Mesh VFX (nền móng cho nước, gió, xúc tu, roi, cờ)
- [x] Đã làm (B2)
Ghi chú dev: ĐIỀU CHỈNH. `ui/ribbonMotion.ts` (thuần, có test): n≤20 điểm, envelope đầu cao/đuôi thấp (đuôi 27%), quán tính từng điểm. Act `ribbon` {color, amp, freq, speed, thickness, length, foam, flip} + `scene/battle/fxRibbon.ts`: VẼ BẰNG GRAPHICS (dải tô + viền trắng + bọt ở đầu) chạy cả WebGL/Canvas, tối đa 3 ribbon cùng lúc; `reduce` không phát acts nên bỏ ribbon. CHƯA dùng Phaser Rope + texture (chờ asset A05_water_kit) và chưa gắn vào skill nước nào (ANIM-040).
- Ưu tiên: P1
- Nhóm: Skill
- Đối tượng: skill nước (xem ANIM-040), `fxp_octo_tentacle`, roi dây (vine_lash, binding_roots), `tether` act
- File liên quan: mới `scene/battle/fxRibbon.ts`; `fxLines.ts` (`tether` đã có sóng), `fxProps.ts`, tham chiếu có sẵn trong repo: `src/areas/aquarium/scene/fishBody.ts` (đã dùng `Phaser.GameObjects.Rope` khi `renderer.type === Phaser.WEBGL`)
- Hiện trạng: prop là ảnh tĩnh (`set(x,y,scale,alpha)`), chỉ dịch/phóng; không biến dạng điểm.
- Hướng sửa: `playRibbon(act)` dùng `Phaser.GameObjects.Rope` (Phaser 3.90 có sẵn) với texture dải seamless (xem `A05`), N=12–20 điểm; mỗi frame đặt `points[i].y = y0 + sin(i*freq - time*speed)*amp*envelope(i)`; **envelope** để đầu sóng cao, đuôi thấp; **quán tính**: biên độ theo vận tốc lái (lag 80–120 ms giữa điểm i và i+1 bằng lerp `p[i] += (p[i-1]-p[i])*0.35`). Thêm act `ribbon` {img, path, dur, amp, freq, speed, thickness, foam}. Fallback Canvas renderer: đoạn thẳng nhiều khúc bằng `Graphics` (đã có `tether`). Giới hạn: ≤ 3 ribbon đồng thời, ≤ 20 điểm.
- Phụ thuộc: ANIM-004 (tuỳ chọn).
- Tiêu chí nghiệm thu: [ ] sóng uốn lượn, đầu sóng nhấp nhô thấy được; [ ] FPS không tụt (giữ ≥ 55 fps trên máy test) khi 2 ribbon + 200 hạt; [ ] `reduce` bỏ ribbon (hoặc thay bằng ảnh tĩnh).
- Asset cần thêm: `A05_water_kit.md`.

### [ANIM-007] Prop motion modifier (chuyển động phụ cho vật thể bay)
- [x] Đã làm (B2)
Ghi chú dev: ĐIỀU CHỈNH. `ui/propMotion.ts` (thuần, có test): `propFrame` trả prog đã ease, dy (bobY), rot (wobble), sx/sy (pulse, stretch theo độ dốc ease, squashOnHit). Mặc định theo path đúng spec (sweep inOutSine+wobble 3°@2.5Hz+bob 6px@3Hz; fall inBack+squash; throw/fly stretch). Schema prop thêm `ease,wobble,pulse,stretch,bobY,squashOnHit,trail`; `fxProps.ts` dùng khung này cho mọi prop (đổi cảm giác toàn bộ 95 act — cần xem lại bằng mắt). Khác đề xuất: throw mặc định ease `linear` (giữ parabol), fly `inQuad` (như cũ). `trail` chạy qua burst mỗi `every` ms. Chưa chỉnh JSON từng skill.
- Ưu tiên: P1
- Nhóm: Skill
- Đối tượng: mọi act `prop` (95 act trong 112 skill)
- File liên quan: `scene/battle/fxProps.ts::playProp` (`step(t)` trả vị trí/scale/alpha rồi `setRotation`), `schema/battleScript.ts` (Prop act)
- Hiện trạng: `sweep`: `set(x0 + (x1-x0)*t, y, 1, fade)` — **tuyến tính, không easing, không xoay, không scale phụ**; `fly` = `easeIn` đơn giản; `throw` parabol chuẩn nhưng không squash/stretch theo vận tốc; không có đuôi (trail) mặc định cho prop. ⇒ cảm giác "dán ảnh trượt".
- Hướng sửa: thêm field tuỳ chọn cho prop: `ease` (`inOutSine|outQuad|inBack|outBack|spring`), `wobble` {rot: deg, freq: Hz}, `pulse` {amp, freq}, `stretch` (true ⇒ kéo dãn theo hướng vận tốc `1 + 0.35*speedNorm`, nén vuông góc), `trail` {ref, every}, `squashOnHit` (khi `t>0.92`), `bobY` {amp, freq}. Mặc định theo path: `sweep` = `inOutSine` + `wobble 3°@2.5Hz` + `bobY 6px@3Hz`; `fall` = `inBack` + `squashOnHit`; `throw` = `stretch` + `trail`; `hover` = giữ. Công thức sóng: `y += sin(t*2π*freq + phase)*amp*(1-t*0.4)`.
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] không prop nào di chuyển theo đường tuyến tính thuần (kiểm lab); [ ] ảnh có độ nảy/xoay nhẹ; [ ] test thuần (`propPath(t, act)` trả vị trí mong đợi, tách phần tính ra `ui/propMotion.ts` để test).
- Asset cần thêm: không.

### [ANIM-040] Skill nước: sóng, vòi, mưa, bọt (làm lại cho "chảy")
- [x] Đã làm (B5)
Ghi chú dev: ĐIỀU CHỈNH (làm 5/10 skill; ribbon vẽ bằng code). Tsunami: ribbon quét 900ms có bọt đầu sóng + prop `fxp_wave_crest` (đã ease/wobble từ B2) rải hạt `drop_spray` theo đường (`trail`), flash xanh 80ms, hit-stop tier medium, mmục tiêu bị đẩy 18px nghiêng 10° (`knock`) + bọt, ribbon dội ngược nhỏ 1330ms (timing.end 1650→1800). Tide song: ribbon nhẹ + 3 vòng gợn tròn dưới chân đồng đội stagger. Healing rain: 3 vòng gợn xanh lá + bọt trôi lên. Bubble (animal + quái): bong bóng nở outBack, pulse 6%@3Hz, bobY. Frost breath: sương trắng dưới đất + tuyết ngang. Hạt giọt dùng gravity có sẵn của particle. CHƯA làm: `skill_cl_freeze`, `skill_ult_nh`, `skill_ult_trident`, `enemy_abyss_kraken` (ult/boss, B6-B7), `fxs_foam_curl` (asset A05), displacement/shader, ribbon dạng Rope+texture.
- Ưu tiên: P1
- Nhóm: Skill
- Đối tượng: `skill_nh_bubble`, `skill_nh_tide_song`, `skill_nh_tsunami`, `skill_cl_freeze` (hệ nước), `skill_cl_healing_rain`, `skill_e_bubble`, `skill_e_frost_breath`, ultimate `skill_ult_nh` (cá voi), `skill_ult_trident`, trùm `enemy_abyss_kraken`
- File liên quan: `fx.json` các `skills.*` trên; `fxProps.ts`; `fxBursts.ts`; mới `fxRibbon.ts` (ANIM-006)
- Hiện trạng: Tsunami = `fxp_wave_crest` path `sweep` size 0.55 (một ảnh tĩnh trượt ngang) + `drop_fall` + `fx_splash` + `lift` thân. Không có sóng cuộn, không bọt theo sóng, không phản xạ, mục tiêu chỉ "bị nhấc lên".
- Hướng sửa (kỹ thuật cụ thể, thứ tự ưu tiên):
  1. **Sóng = Ribbon**: dải texture nước seamless, 18 điểm, `amp = 0.22 * H` đầu sóng (phía trước) giảm tuyến tính về 0.06H ở đuôi, `freq = 2.2` chu kỳ trên chiều dài, `speed = 5 rad/s`; đầu sóng *cuộn* (curl): thêm sprite `fxs_foam_curl` ở điểm đầu xoay ±12° theo vận tốc; tốc độ trượt `easeInOutSine` 900ms + `wobble`.
  2. **Bọt & giọt**: dọc sóng phát `bubble_spray` 14 hạt/s + `drop_spray` 22 hạt/s với **gia tốc trọng trường** (gravity 900 px/s²), vận tốc ban đầu ngẫu nhiên hướng lên-ra; giọt va đất để lại `decal puddle` nhỏ (alpha 0.5, 400ms).
  3. **Dòng chảy có quán tính**: khi sóng qua mỗi mục tiêu, mục tiêu bị đẩy 18px theo hướng sóng (`knock`) rồi *trôi lại* (settle spring 380ms), nghiêng 10° theo dòng.
  4. **Displacement giả** (nếu không có shader): vẽ 2 lớp nước `NORMAL` + `ADD` lệch pha 40% để tạo cảm giác phản chiếu; hoặc tween scaleY của `tint` nền nước (rectangle gradient xanh) theo `sin` 3 Hz biên độ 6% — rẻ. Shader/displacement thật: chỉ nếu `renderer.type===WEBGL` và đã có PipelineFX (cân nhắc `Phaser.FX` `Displacement` ở 3.60+; **phải có fallback**).
  5. Tsunami theo pha: cast (chim biển/ngửa đầu, ANIM-005 `cast_coil`) → nước dâng ở bờ trái (ribbon cao dần 0→1 trong 420ms) → quét ngang 900ms → nện (hit-stop 90ms medium, shake 6, flash xanh nhạt 80ms) → dội ngược (backwash 300ms, ribbon ngược nhỏ) → puddle decals.
  6. `healing_rain`/`tide_song`: mưa theo đường xiên + gợn tròn dưới chân mục tiêu (decal ring nước, 3 vòng stagger 120ms) + bọt trôi lên từ chân.
  7. `bubble`: bong bóng *nở* (grow `easeOutBack`) rồi trôi chậm với `bobY`, vỡ ra giọt (`bubble_pop` + `drop_pop`); scale pulsing 6% @ 3 Hz.
  8. `frost_breath`: hơi lạnh dạng `cone` + hạt `snow_*` gió ngang + sương mờ dưới đất.
- Phụ thuộc: ANIM-006, 007, 004.
- Tiêu chí nghiệm thu: [ ] đầu sóng nhìn "cuộn", thân sóng uốn; [ ] có bọt và giọt bắn rơi theo trọng lực; [ ] mục tiêu bị đẩy rồi trôi lại; [ ] 3 skill nước nhìn khác nhau (đòn đơn / sóng / mưa); [ ] không giật khi 3 mục tiêu.
- Asset cần thêm: `A05_water_kit.md`.

### [ANIM-041] Chuẩn hoá anticipation → impact → recovery cho đòn vật lý
- [x] Đã làm (B5)
Ghi chú dev: ĐIỀU CHỈNH. Mọi skill vật lý có script + action `attack`: `stop` có `tier` theo độ dài cũ (≤55 light, ≤95 medium, ≤130 heavy), `shake` thành shake có hướng ngang (dir [1,0.12], suy giảm mũ, ≥220ms), thêm follow-through `tilt` 8° sau cú dash. Combo giữ nhịp tăng dần sẵn có (40/40/100ms, 3/3/7px). CHƯA làm: knockback theo vector (`dirFrom`; `knock` hiện đẩy ra xa phe mình nên đã hợp lý), hit-stop heavy theo crit trong action `hit-heavy`.
- Ưu tiên: P2
- Nhóm: Skill
- Đối tượng: skill class vật lý (9: `power_strike, combo, rend, vital, finisher, shadow_dance, armor_crush, stomp, tremor`), skill quái vật lý (12), đòn thường (`actions.attack`)
- File liên quan: `fx.json`; `adv/ui/battlePose.ts` (khối `melee`, đã khá tốt: coil → dash → punch → return)
- Hiện trạng: đòn cận chiến đã có coil/dash/punch/skid (điểm sáng của dự án) nhưng skill physical có script thường dùng `dash`+`strip`; thiếu **follow-through** (xoay thân theo hướng đòn), **shake hướng** (shake theo hướng đòn thay vì ngẫu nhiên) và knockback mục tiêu theo vector.
- Hướng sửa: đặt hit-stop `medium` (80ms) ở impact đòn thường, `heavy` (120ms) ở crit/`hit-heavy`; shake có hướng (`dir = vector actor→target`, amount 5/9, decay exp 220ms); knockback mục tiêu theo vector (`knock` act đã có, thêm `dirFrom:"actor"`); thân người đánh thêm `rot` follow-through 8° → settle. Combo (`skill_cl_combo`) 3 hit: hit-stop 50/50/120 và tăng dần shake.
- Phụ thuộc: ANIM-004.
- Tiêu chí nghiệm thu: [ ] 3 mức đòn (thường/nặng/chí mạng) khác nhau rõ; [ ] combo có nhịp tăng dần.
- Asset cần thêm: không.

### [ANIM-042] Đạn/tia/vệt: đường bay có gia tốc và quán tính
- [x] Đã làm (B5)
Ghi chú dev: ĐIỀU CHỈNH. `fxPlayer.shot`: smoothstep (chậm rồi nhanh), core pulse ±8% @8Hz, halo nhấp ±20% @5Hz, trail theo quãng đường bay (mỗi 9px, dừng khi hit-stop vì dt=0). CHƯA làm: spiral nhẹ cho hệ gió/nước (look không biết hệ).
- Ưu tiên: P2
- Nhóm: Skill
- Đối tượng: mọi skill `projectile` (mặc định `delivery` của `magical` đơn), cue `shot`
- File liên quan: `scene/battle/fxPlayer.ts::shot` (Linear t), `fx.json` `elements.*.projectile`
- Hiện trạng: `Phaser.Math.Linear(from, to, t)` — **tốc độ không đổi**; arc parabol OK nhưng không có tăng tốc đầu, không xoay gradual, halo không nhấp.
- Hướng sửa: easing `inQuad`→`outQuad` (khởi chậm tăng tốc: `e = t*t*(3-2t)` smoothstep), core `pulse` ±8% @ 8 Hz, halo size ×(1+0.2 sin), spiral nhẹ cho hệ gió/nước (`x += sin(t*2π*3)*6`), chuỗi hạt trail đều theo quãng đường thay vì theo thời gian (ổn định khi hit-stop).
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] đạn có cảm giác "phóng đi" (nhanh dần); [ ] trail đều khi x2.
- Asset cần thêm: không.

### [ANIM-043] Dấu ấn riêng của từng hệ (signature pass)
- [x] Đã làm (B5)
Ghi chú dev: ĐIỀU CHỈNH. Dấu ấn hệ gán tự động vào 25 skill phép (không phải ult) tại thời điểm impact: Sét flash trắng 60ms + shake dọc; Đất shake dọc dài hơn +3; Lửa flash cam 110ms; Tối vignette tối 700ms trước impact; Sáng flash vàng nhạt 130ms; Hư vô `split` 220ms; Kim flash 50ms. Mộc giữ nguyên. CHƯA làm: rung điện thân 40Hz, tia zigzag, đảo màu 1 frame, kiểm 'grayscale vẫn đoán được hệ' bằng mắt.
- Ưu tiên: P2
- Nhóm: Skill
- Đối tượng: 9 hệ — lửa (`hg_*`), sét (`ld_*`), đất (`qs_*`), mộc (`mm_*`), kim (`tg_*`), tối (`dm_*`), sáng (`qt_*`), hư vô (`hk_*`)
- File liên quan: `fx.json elements.*` + `skills`
- Hiện trạng: mỗi hệ có màu/hạt/projectile riêng (tốt) nhưng cùng khung thời gian & cùng cấu trúc script ⇒ khác màu hơn là khác "cảm giác".
- Hướng sửa — nhịp & chuyển động đặc trưng: **Lửa**: bùng nở nhanh, tàn lửa bay lên, shake ngắn gắt, ánh sáng cam nhấp nháy; **Sét**: zigzag tức thời, nhấp nháy trắng 2-frame, hit-stop ngắn + "rung điện" thân (shake ±3 @ 40 Hz); **Đất**: nặng, trễ, dậm → nứt → bụi bay, shake dài thấp tần; **Mộc**: mọc dần (grow `easeOutBack`), lá rơi; **Kim**: chớp loé + tia lửa kim loại, "clang" sắc; **Tối**: chậm, hút vào (vignette tối), khói; **Sáng**: sáng dần rồi chớp, tia trên xuống; **Hư vô**: biến dạng không gian (`split` chromatic, vòng hút), đảo màu 1 frame.
- Phụ thuộc: ANIM-004, 007.
- Tiêu chí nghiệm thu: [ ] tắt màu (grayscale) vẫn đoán được hệ từ chuyển động.
- Asset cần thêm: một số `fx_*` dải mới — xem `A05/A06`.

---
### Nhóm Status

> Bảng tổng hợp theo inventory (25 status). **"Hiện có"** = tình trạng trong `fx.json`. Tất cả cần thêm cột **expire** (chưa có ở đâu cả).

| Status | Hiệu ứng khi dính | Duy trì (loop) | Khi hết | Icon HUD |
|---|---|---|---|---|
| poison | `spore_pop` + glow tím (có) | `spore_rise` /1.8s (có); thêm bọt xanh-tím + khói + thân tái | khói tan + thân hồi màu | `st_poison` (có) |
| burn | `fx_flame_burst` + hop (có) | `ember_rise` /1.2s (có); thêm lửa bám người + tint đỏ | lửa tắt: khói xám | `st_burn` (có) |
| wet | splash + glow (có) | tint xanh 0.1 (có); thêm giọt nhỏ | giọt bay hơi | `st_wet` |
| freeze | `fx_ice_encase` (có) | cover frame 3 (có) — nhưng action `frozen` **rung** | `fx_ice_shatter` + mảnh (chưa có; chỉ 1 skill dùng) | `ui_icon_status_freeze` |
| stun | `star_pop` + wiggle (có) | `star_rise` /1.4s (có) — **không có vòng sao xoay** | sao rơi + thân hồi | `st_stun` |
| disable | `fx_rune_lock` (có) | `rune_a_pop` /2s (có) | xích vỡ | `st_disable` |
| doom | `fxp_doom_clock` pop (có) | **không có loop**; cần đồng hồ đếm trên đầu | đồng hồ chạm 0 → nổ | `st_doom` |
| atk/matk/acc ↑, def/mdef ↑, spd/eva ↑ | xem ANIM-030…033 | aura/layer | `expire` tắt dần | `st_*_up` |
| …↓ | xem ANIM-034 | khói tím | tan | `st_*_down` |
| shield | vòm (có) | **không loop** | vòm vỡ | `st_shield` |
| taunt | (2 act) | — | — | `st_taunt` |
| regen | lá+plus | — | — | `st_regen` |
| autoRevive | 2 act | — | — | `st_revive` |

> Các trạng thái người dùng nhắc nhưng **game hiện không có**: *ngủ, câm lặng, trói/root, mù, choáng váng, chậm*. Tương đương hiện có: `disable` ≈ phong ấn/câm lặng/trói; `accDown` ≈ mù; `spdDown` ≈ chậm; `stun` ≈ choáng; **không có "ngủ"** — nếu thêm sẽ là thay đổi gameplay (hỏi chủ dự án trước; thiết kế sẵn ở ANIM-050 phụ chú).

### [ANIM-050] Choáng (stun)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Engine B3: schema `statuses[id].layers` (kind `orbit`: img = hình dạng hạt hoặc `fxs_/fxp_`, n, rx/ry, speed, spot, size, tint, pulse; nửa sau vẽ sau thân, nhỏ 0.8 alpha 0.6) và `sway` (thân lảo đảo, `PoseAnchor.swaying`), vẽ trong `statusBadges.ts`. Stun: 3 sao vàng + 1 tia xanh ngược chiều quay quanh đầu, thân lảo đảo suốt thời gian choáng, expire sao tung ra. CHƯA làm: mặt choáng (mắt xoáy `fxs_dizzy_eyes`), chim `fxs_birdie` (asset A02 — dùng hạt `spark` thay), sao rơi theo trọng lực, bật thẳng bằng settle.
- Ưu tiên: P1
- Nhóm: Status
- Đối tượng: status `stun`; skill gây choáng; action `stunned` (mất lượt vì stun)
- File liên quan: `fx.json statuses.stun`, `actions.stunned`; `adv/ui/battlePose.ts` (nhánh `stunned` `rot += sin((t-start)/45)*8`); `scene/battle/statusBadges.ts`
- Hiện trạng: apply = `star_pop` ở trên đầu + wiggle 400ms; loop = `star_rise` mỗi 1.4s; action mất lượt: pose `hurt` + wiggle 700ms + `star_pop`. **Không có "vòng sao/chim xoay quanh đầu", không có mặt choáng, thân không lảo đảo kéo dài.**
- Hướng sửa: layer `orbit`: 3 sao (`fxs_star` vàng `#ffe36a`, 0.26w) trên elip quanh đầu: rx = `0.34w`, ry = `0.12w`, tốc độ 2.4 rad/s, pha lệch 120°, **nửa sau** (sin<0) vẽ phía sau đầu depth −0.5 alpha 0.6 & nhỏ 0.8; thêm 1 chim nhỏ xanh (`fxs_birdie`) quỹ đạo ngược chiều tốc độ 1.6; **mặt choáng**: dùng key pose `hurt` + mắt xoáy (`fxs_dizzy_eyes` đè lên vùng mắt `head` offset, xoay 3 rad/s) — nếu thiếu asset: dấu `@` code-draw; thân lảo đảo: `rot = sin(now/380)*4°`, `dx = sin(now/760)*3`, tắt idle thở; icon `st_stun`; expire: sao rơi xuống (gravity) + bật thẳng lại (`settle`) 300ms.
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] thấy sao/chim xoay quanh đầu, nửa sau ở sau đầu; [ ] mặt choáng; [ ] thân lảo đảo liên tục suốt thời gian choáng; [ ] hết choáng: sao rơi + đứng thẳng.
- Asset cần thêm: `A02_status_overlays.md` (`fxs_birdie`, `fxs_dizzy_eyes`).

### [ANIM-051] Đóng băng (freeze) — và sửa lỗi "đóng băng mà rung"
- [x] Đã làm (B0+B3)
Ghi chú dev B3: thêm loop 1.6s (glint + tuyết), expire mạnh hơn (hit-stop 60 + vỡ băng + 2.2x mảnh + shake 3). CHƯA: chớp/nứt thêm khi bị đánh lúc băng, bật thân scale 1.08, `fx_ice_crack`.
Ghi chú dev B0: ĐIỀU CHỈNH (chỉ phần P0 'bỏ rung'). `battle_fx.json actions.frozen`: xoá `move shake`; `ui/battlePose.ts`: beat `stunned` do skip lý do `freeze` giữ nguyên thân (không wobble/thở), stun thường vẫn wobble. CHƯA làm: vỡ băng khi hết (cần ANIM-003 expire), đứng yên khi idle bị freeze (cần `freezeBody`), chớp/nứt khi bị đánh.
- Ưu tiên: **P0** (mâu thuẫn nghĩa — đứng hình bị rung)
- Nhóm: Status
- Đối tượng: status `freeze`; skill `skill_cl_freeze`, `skill_e_frost_breath`; action `frozen`
- File liên quan: `fx.json statuses.freeze` (có `cover` frame 3 alpha 0.75, tint), `actions.frozen` (**`move shake 600` + glow + `snow_fall`**), `adv/ui/battlePose.ts` (idle sin + nhánh `stunned` dùng chung), `scene/battle/statusBadges.ts` (cover), `public/assets/fx/battle/fx_ice_shatter.png` (đã có file! chỉ 1 skill dùng, grep `fx_ice_shatter` ở `fx.json` l.~7704)
- Hiện trạng: Cover băng có, nhưng (1) unit đóng băng vẫn **thở/nhún** (idle sin) và khi mất lượt **rung 600ms** + `pose stunned` wobble ⇒ trái nghĩa "đứng hình"; (2) **không có vỡ băng khi hết** dù có sẵn asset `fx_ice_shatter`.
- Hướng sửa: `freezeBody:true` ⇒ trong `poseOf`: bỏ `cyc` (dx,dy,sx,sy=1/0), `rot=0`, giữ nguyên posture hiện tại (hoặc `hurt`), thêm tint `#bfe8ff` 0.45 và gray 0.25; **bỏ `shake` khỏi action `frozen`** — thay bằng: khối băng rung *rất nhẹ* (cover scale ±1.5% @ 6Hz) chỉ khi bị đánh. Apply: băng bò từ chân lên 360ms (`fx_ice_encase` frames 0→3 + hold) + hit-stop 60ms + tiếng "crack-freeze". Loop: glint chạy ngang khối băng /1.6s, sương lạnh trôi xuống từ chân (`snow_fall` 3/s). **Expire**: `fx_ice_shatter` 380ms + 14 mảnh băng (`ice_pop` more 1.5, gravity) + bật thân scale 1.08→1 (settle) + hit-stop 60 + shake 3 + `adv_ice_shatter`. Bị đánh khi đóng băng: cover chớp trắng 80ms + vết nứt tăng (frame 3 → có thể thêm `fx_ice_crack`).
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] unit bị đóng băng **không cử động** (không thở, không rung) trong suốt thời gian; [ ] khối băng bao toàn thân, phản chiếu sáng; [ ] hết băng ⇒ vỡ tung mảnh; [ ] bị đánh lúc băng ⇒ chớp + nứt thêm.
- Asset cần thêm: `A02` (`fx_ice_loop` glint, `fx_ice_crack`).

### [ANIM-052] Nhiễm độc (poison)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Poison: tint #b8e0a0 α0.22 (priority 3), loop 0.7s bọt + bào tử, `tick` riêng (rùng mình + giọt độc xanh), expire khói tan. CHƯA làm: thân khom/rùng mình định kỳ, tint pulse, số sát thương tím.
- Ưu tiên: P1
- Nhóm: Status
- Đối tượng: status `poison`; tick `dot_poison`; skill `skill_mm_poison_thorn`, `skill_e_poison_spore`, `skill_e_corrupt_bloom`
- File liên quan: `fx.json statuses.poison`, `actions.dot_poison`; `statusBadges.ts::tintOf` (không tint cho poison)
- Hiện trạng: apply = `spore_pop` + glow tím; loop `spore_rise` /1.8s (rất thưa); **không tint thân** (`tint:null`); tick damage dùng chung action `dot_poison`.
- Hướng sửa: layer `emitter`: bọt tím-xanh (`#7be08a` / `#9a6ad6`) nổi từ thân 4/s với dao động ngang sin, vỡ ở đầu; khói mỏng loop; tint thân `#b8e0a0` alpha 0.22 pulse 1.5s (thân tái xanh); thân hơi khom (sy 0.98, dy +2) và rùng mình mỗi 2.4s (rot ±3 trong 200ms). Tick (mỗi lượt): thân nhấp giật + giọt độc chảy (drop xanh) + số sát thương tím; expire: khói tan lên, tint trả về 300ms, thở sâu (sy 1.04 → 1).
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] nhìn thấy bọt/khói tím-xanh liên tục; [ ] thân tái; [ ] tick có phản hồi riêng; [ ] hết độc có khói tan.
- Asset cần thêm: `A02`.

### [ANIM-053] Bỏng (burn)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Burn: tint #ff9a6a α0.2 (priority 4), loop 0.6s tàn lửa + lửa nhỏ ở chân (dùng `fx_flame_burst` thay `fx_flame_cling` chưa có), `tick` phụt lửa to, expire khói xám. CHƯA làm: lửa bám loop liên tục (cần asset A02), tint nhấp nháy ngẫu nhiên.
- Ưu tiên: P1
- Nhóm: Status
- Đối tượng: status `burn`; tick `dot_burn`; skill lửa
- File liên quan: `fx.json statuses.burn`, `actions.dot_burn`
- Hiện trạng: apply `fx_flame_burst` + hop; loop `ember_rise` /1.2s; không tint, không lửa bám.
- Hướng sửa: layer `cover` lửa dạng loop (`fx_flame_cling` 4–6 frame, alpha 0.7, scale 0.7w đặt ở thân dưới + vai) + emitter tàn lửa `ember_rise` 6/s; tint đỏ cam `#ff9a6a` alpha 0.2 flicker (random 0.15–0.3 @ 8 Hz); thân hơi giật mỗi 1.2s. Tick: lửa phụt to (scale 1.3 trong 160ms) + hạt + số cam. Expire: lửa co lại thành khói xám (`fire_smoke`), tint trả 300ms. Nếu có `wet` đang bật: bỏng bị dập (phản ứng `reaction_steam` đã có).
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] lửa bám thân liên tục, có tàn bay; [ ] nhìn đỏ nóng; [ ] hết bỏng → khói.
- Asset cần thêm: `A02` (`fx_flame_cling`).

### [ANIM-054] Ướt (wet)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Wet: tint α0.16 (priority 1), giọt chảy + vũng nhỏ dưới chân mỗi 1.2s (decal puddle), expire bọt bay hơi. CHƯA làm: highlight ADD trên thân.
- Ưu tiên: P2
- Nhóm: Status
- Đối tượng: status `wet`
- File liên quan: `fx.json statuses.wet`
- Hiện trạng: tint xanh 0.1 + apply 2 act, loop có; quá mờ.
- Hướng sửa: tint `#bfe4ff` 0.16; giọt nhỏ chảy xuống từ thân (`drop_fall` 2/s), vũng nhỏ dưới chân (`decal puddle` loop alpha 0.35); lông/da bóng (thêm highlight ADD 0.12); expire: giọt bay hơi lên (`bubble_rise` 6 hạt).
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] thân nhìn bóng ướt; [ ] có vũng.
- Asset cần thêm: không.

### [ANIM-055] Phong ấn (disable)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Disable: 2 rune tím quay quanh ngực (layer orbit, nhịp 1.2Hz) thay xích `fxs_chain` (chưa có asset), expire: khóa vỡ + shake nhẹ. CHƯA làm: xích giật căng khi mất lượt.
- Ưu tiên: P2
- Nhóm: Status
- Đối tượng: status `disable`; skill `skill_cl_seal`, `skill_e_seal_quake`
- File liên quan: `fx.json statuses.disable`
- Hiện trạng: apply `fx_rune_lock` + loop `rune_a_pop` /2s.
- Hướng sửa: layer `cover`/`orbit`: 2 xích/rune khoá quanh thân (`fxs_chain`), xoay chậm 0.6 rad/s, nháy tím `#b48aff` 1 Hz; icon khoá; khi unit định dùng skill (mất lượt): xích giật căng 200ms + tiếng "clank"; expire: xích vỡ thành mảnh rơi (gravity) 320ms.
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] thấy xích/khoá bao quanh; [ ] vỡ khi hết.
- Asset cần thêm: `A02` (`fxs_chain`).

### [ANIM-056] Tử chú (doom)
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Doom: đồng hồ `fxp_doom_clock` luôn hiện trên đầu (layer orbit rx=ry=0, nhịp 1.2Hz), expire: hit-stop 120 + khói tối + shake 6. CHƯA làm: số lượt còn lại, cảnh báo lượt cuối, kim quay, đồng hồ vỡ khi cleanse (VM chưa cung cấp số lượt).
- Ưu tiên: P2
- Nhóm: Status
- Đối tượng: status `doom`; skill `skill_e_doom_mark`, trùm `enemy_ancient_guardian`, `enemy_shadow_priest`
- File liên quan: `fx.json statuses.doom` (apply 3 act, **không loop**)
- Hiện trạng: `fxp_doom_clock` pop 900ms rồi biến mất ⇒ người chơi không thấy "đếm ngược".
- Hướng sửa: layer đồng hồ (`fxp_doom_clock` 0.22w trên đầu, kim đỏ quay 0.4 rad/s, đập thịch mỗi lượt) + số lượt còn lại (text); khi đến hạn (lượt cuối): đồng hồ phình + rung + đỏ rực; expire (kích hoạt): nổ bóng tối (`dark_big`) + hit-stop 120 + tiếng chuông; nếu cleanse: kim gãy, đồng hồ vỡ.
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] luôn thấy đồng hồ trên đầu; [ ] lượt cuối cảnh báo rõ.
- Asset cần thêm: `A02`.

### [ANIM-057] Icon trạng thái trên HUD (nhất quán 25 status)
- [ ] Chưa làm
Ghi chú dev (B3): CHƯA LÀM. Cần quyết định sản phẩm: bỏ badge Phaser hay chip DOM (hiện cả hai), đổi icon `freeze` -> `st_freeze` phụ thuộc asset, số lượt còn lại cần VM mới. Để lại cho B9/HUD.
- Ưu tiên: P2
- Nhóm: Status
- Đối tượng: 25 status; chip DOM (`statusChip` trong `viewKit.ts`) và badge Phaser (`statusBadges.ts`, tối đa 3, luân phiên 1.6s)
- File liên quan: `adv/ui/viewKit.ts::statusChip`, `statusBadges.ts`, `fx.json statuses.*.icon` (`freeze` dùng `ui_icon_status_freeze`, còn lại `st_*` ⇒ không nhất quán)
- Hiện trạng: 2 hệ icon cùng tồn tại (chip DOM trong nameplate + badge Phaser cạnh đầu) — trùng lặp; badge chỉ nhỏ (`max(22, 0.26w)`) và khi >3 status thì luân phiên khiến người chơi **không thấy hết**.
- Hướng sửa: chuẩn hoá nhóm màu viền icon: buff xanh lá, debuff tím, CC (stun/freeze/disable/doom) đỏ; hiệu ứng nhấp khi **mới nhận** (scale 1.5→1, 200ms) và nhấp đỏ khi **sắp hết** (còn 1 lượt): pulse 1 Hz; đổi `freeze` về `st_freeze` cho đồng bộ; thêm số lượt còn lại (nếu VM có); tooltip ở chip DOM; badge Phaser chỉ giữ CC (ưu tiên cao) và đẩy buff/debuff vào chip DOM để khỏi trùng.
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] không còn 2 nơi hiển thị cùng thông tin; [ ] thấy được status sắp hết; [ ] 25 icon đồng bộ phong cách.
- Asset cần thêm: icon `st_freeze` (đồng bộ) trong `A02`.

### [ANIM-058] Phản hồi Kháng cự / Miễn nhiễm / Thanh tẩy
- [x] Đã làm (B3)
Ghi chú dev: ĐIỀU CHỈNH. Event `resist` -> mark `resist` -> action mới `resist` (JSON: khiên chớp + sao xanh, `battleMotion`/`battleScript`). `cleanse` đã có từ B1. CHƯA làm: chữ "KHÁNG" (i18n + số bay), hit-stop/shake cho 6 phản ứng nguyên tố.
- Ưu tiên: P1
- Nhóm: Status
- Đối tượng: events `resist`, `cleanse`; phản ứng nguyên tố (6)
- File liên quan: `adv/ui/battleMotion.ts` (không có case `resist`; `cleanse` chỉ thành mark), `adv/ui/battleScript.ts`, `fx.json elementReactions`
- Hiện trạng: `resist` không có cue; `cleanse` mark bị bỏ qua.
- Hướng sửa: `resist` ⇒ khiên mờ chớp trên đầu + chữ "KHÁNG" (i18n `vi.adventure.battle.resist`) + sound; `cleanse` xem ANIM-032; 6 `elementReactions` giữ nhưng bổ sung hit-stop 90 + shake 5 + tên banner (đã có).
- Phụ thuộc: ANIM-003.
- Tiêu chí nghiệm thu: [ ] mỗi status bị kháng có phản hồi; [ ] cleanse luôn có hiệu ứng.
- Asset cần thêm: không.

---
### Nhóm Ultimate

> **Khung chung (ANIM-009)** áp dụng cho cả 12 ultimate; các task 060–071 chỉ ghi phần riêng. Hiện tại ult = `cutin` 500ms (dải màu −8° + ảnh unit trượt) + `tint` nền 0.35 + 1–3 `prop` + `shake` ≤12 + `stop` 80–120ms; **không có**: letterbox, zoom camera có điều khiển, slow-mo, môi trường, outro.

### [ANIM-009] Ultimate Director: intro / layer / impact / outro / môi trường
- [x] Đã làm (B6)
Ghi chú dev: ĐIỀU CHỈNH. Không viết module `ultDirector.ts` riêng: khung chuẩn được SINH vào script của cả 12 ult trong `battle_fx.json` (vì engine đã có acts): letterbox vào 240ms ở 0 và ra ở `end-320`, vignette tối #0a0612 α0.5, `punch` zoom 1.08 về phía người cast 620ms, hit-stop tier `ultimate` 220ms ở đòn cuối (ult support không có đòn nên không có stop). Test `buffLanguage.test.ts` ép 12 ult có khung. Dọn dẹp: `screen.reset()` khi đổi step/hết trận, `reduce` không phát acts. CHƯA làm: slow-mo (DOM số bay lệch đồng hồ, chưa xử lý), zoom out 0.96 lúc bung, chromatic 200ms, knockback chung, số sát thương to hơn, module môi trường `ultEnv`, tên skill chữ lớn trong cut-in, `castProfiles.ultimate` riêng. Timing các ult giữ nguyên (<3.5s).
- Ưu tiên: P1
- Nhóm: Ultimate
- Đối tượng: 12 ultimate (`skill_ult_*`) + "ult của trùm" (boss_phase nâng cấp)
- File liên quan: `scene/battle/fxActs.ts::cutin`, mới `scene/battle/ultDirector.ts` + `screenFx.ts` (ANIM-004), `fx.json castProfiles.ultimate`, `adv/ui/battlePlan.ts` (cue `dim`)
- Hiện trạng: xem trên. `cutin` 500ms dải màu + khuôn mặt = ảnh thân đang đứng (`a.picture.texture.key`), không dùng pose `ult`/crop mặt.
- Hướng sửa — kịch bản chuẩn 5 pha (tổng ≈ 3.2–3.8s, trong `stepMax`):
  1. **Intro (0–700ms)**: `letterbox` 2 thanh đen (cao 11% màn) trượt vào 240ms; nền tối `#0a0612` alpha 0.55 + vignette; camera **zoom 1.0→1.12 về phía người cast** (`zoomTo` 420ms `inOutQuad`); cut-in: dải màu hệ 22% chiều cao góc −8°, **tên skill** chữ lớn trượt vào ngược chiều dải, ảnh unit (pose `ult` nếu có, fallback `attack`) scale 1.15 với rim light; gió "whoosh"; slow-mo 0.35 trong 280ms ở cuối cut-in.
  2. **Charge (700–1300ms)**: vòng phép lớn (`rune_big`), hạt hút vào từ rìa màn, rung thân; âm tăng tần (riser).
  3. **Release/Hero (1300–2300ms)**: hiệu ứng riêng của ult (060–071), ≥3 lớp: (a) *vật thể chính* (prop lớn) (b) *hạt/dòng chảy* (c) *môi trường* (nứt đất, tuyết, mưa lửa, bão…). Camera zoom out về 0.96 (cảm giác bung lớn) rồi shake.
  4. **Impact (≈2300ms)**: **hit-stop 200–260ms** (tier `ultimate`), flash trắng 120ms, `chromatic` 200ms, knockback mục tiêu mạnh (dx 60–90, rot 20–30°, bay lên 24px), số sát thương *to* (scale 1.6) và shake 12–16 decay exp 450ms; slow-mo 0.3 trong 300ms *sau* hit-stop để người chơi thấy các mục tiêu văng.
  5. **Outro (2600–3500ms)**: letterbox rút 240ms, nền sáng lại 300ms, zoom về 1.0 (`outQuad` 360ms), khói/bụi lắng, mục tiêu settle; người cast giữ pose cuối 300ms rồi về idle; banner hiệu quả (nếu có phản ứng).
- Thông số môi trường dùng chung (module `ultEnv`): `ground_crack` (decal strip + `rock_spike` mọc dọc, 6–10 vết, dài 40% màn), `snow` (hạt `snow_fall` 60/s nghiêng 12°, tích tụ decal trắng), `gale` (hạt `streak` ngang 80/s + lá cuốn xoáy elip), `fire_rain` (hạt `ember_fall` có đuôi 40/s + hố lửa decal), `lightning_storm` (chớp toàn màn 3 lần random 90–160ms), `void_rift` (vòng hút + đảo màu), `light_rays` (tia sáng xiên chùm).
- Phụ thuộc: ANIM-004, 001.
- Tiêu chí nghiệm thu: [ ] ult có đủ intro/impact/outro; [ ] nhìn khác hẳn skill thường ngay từ 0.5s; [ ] camera trở về 1.0 và bars/tint được dọn sạch sau ult (kể cả khi `reduce`/skip nhanh); [ ] không lỗi khi 4 mục tiêu và khi x2.
- Asset cần thêm: `A06_ult_environment.md`, `A08_ult_cutin.md`.

> Mỗi task ult dưới đây: **Đối tượng** = tên ult; **File** = `fx.json skills.<id>.script` (+ `ultDirector`); **Phụ thuộc** = ANIM-009 (+ ANIM-006 khi dùng ribbon); **Asset** = file `A06`; **Nghiệm thu chung** = §ANIM-009 + điểm riêng bên dưới. Hiện trạng chung: prop riêng đã có (xem ngoặc), nhưng chưa có môi trường/impact/outro.

### [ANIM-060] Ult Nam Hải — `skill_ult_nh` (cá voi, nhóm nước, buff đồng đội)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Ribbon sóng cuộn + ribbon cột nước dựng, slow-mo 0.5 300ms khi cá voi nhảy, 3 vòng gợn nước dưới chân đồng đội, mưa nước 3 đợt, bọt bay lên, ánh nắng nhạt cuối. CHƯA làm: cột nước thẳng đứng 0.9 màn thật, bóng đổ cá voi. · Target allAllies (support) · Hiện có: `fxp_whale`, `fxp_rainbow`, cut-in teal `#3ad0c8`
- Kịch bản: tối xanh sâu `#0a3a6a` + bong bóng dâng; **sóng cuộn ribbon** từ trái tràn qua sân (ANIM-006), cá voi bơi qua phía sau với bóng đổ; cá voi **phun cột nước** lên trời (cột nước 0.9 màn, ribbon thẳng đứng); mưa nước nhẹ + cầu vồng hiện ở đỉnh sau mưa; đồng đội lần lượt được vầng hồi xanh và nhảy `hop` 12px; outro: bọt lung linh bay lên, ánh nắng.
- Chi tiết: hit-stop không (support) nhưng `slow-mo 0.5` 300ms khi cá voi nhảy lên; môi trường: gợn nước dưới chân đồng đội.

### [ANIM-061] Ult Quy Sơn — `skill_ult_qs` (núi rùa, buff đồng đội)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Shake dọc 700ms, nứt đất quanh núi, bụi 3 đợt + đá rơi, rune đá dưới chân đồng đội, vòng vàng + flash khi vòm khép, bụi lắng cuối. CHƯA làm: núi chìm xuống chậm, hex 6 mảnh ép vào. · allAllies (support) · Hiện có: `fxp_turtle_mountain`, `fxp_stone_plate`, `fxp_taunt_badge`
- Kịch bản: mặt đất rung (shake thấp tần 3Hz 700ms), **ngọn núi-rùa trồi lên** từ phía sau (`rise`, 700ms, bụi + đá văng), ván đá bay xuống bao từng đồng đội (hex đá 6 mảnh ép vào), vòm đá phủ nhóm; vòng taunt/khiên sáng vàng; outro: đá lắng bụi, núi chìm xuống chậm.
- Môi trường: nứt đất nhẹ quanh núi, bụi rơi.

### [ANIM-062] Ult Dạ Minh — `skill_ult_dm` (bạch tuộc/lưới đêm, tối)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Vignette đen 0.6, vết mực (decal puddle) dưới địch, mực dâng, mục tiêu squash 0.85 rồi knock, flash tím + split, khói tối cuối. CHƯA làm: tentacle ribbon quấn mục tiêu, chromatic thật (dùng split). · allEnemies · Hiện có: `fxp_octo_tentacle`×2, `fxp_night_net`, shake 8, punch
- Kịch bản: màn tối dần (vignette đen 0.6), mực loang từ góc; **xúc tu ribbon** vươn từ đáy màn quấn mục tiêu (ANIM-006), lưới đêm phủ xuống (grow); mục tiêu bị kéo xuống (sy 0.85) rồi tung lên; impact: hit-stop 160 + chromatic tím; outro: mực tan thành bóng.
- Môi trường: mực đen loang trên đất (decal ink).

### [ANIM-063] Ult Quang Trụ — `skill_ult_qt` (đèn trăng, ánh sáng, buff đồng đội)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Vignette xanh đêm, đèn nhỏ orbit quanh từng đồng đội, 4 đợt sao sáng, rune vàng dưới chân, hạt hồi dâng, flash bình minh. CHƯA làm: chùm tia xiên `light_rays` (cần asset A06). · allAllies (support) · Hiện có: `fxp_moon_lantern`, `fxp_mini_lantern`, decal ring
- Kịch bản: đêm xuống (tint xanh đậm), **trăng lồng đèn lớn** hạ từ trời, đèn nhỏ bay vòng quanh từng đồng đội (orbit), chùm tia sáng xiên (`light_rays`) rọi xuống; hồi máu = hạt sáng dâng; outro: bình minh nhẹ.

### [ANIM-064] Ult Lôi Đường — `skill_ult_ld` (sấm, hệ sét)
- [x] Đã làm (B6) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. 3 nhát sét: chớp toàn màn nhát 1-2, 3 chớp nền xa, nhát cuối: mục tiêu co giật (shake x3 n16, 400ms) rồi văng (knock), vết cháy + tia điện `bolt_pop`, shake dọc. CHƯA làm: nứt đất tỏa tia, bóng đổ đảo, `lightning_storm` module. · allEnemies · Hiện có: `fxp_horn_sigil`, decal crack, shake 5/7/10, stop 120
- Kịch bản: mây đen kéo vào (tint xám xanh), **3 nhát sét to** đánh lần lượt (flash toàn màn 90ms, bóng đổ đảo), nhát cuối trúng thẳng mục tiêu với cột sét + nứt đất toả tia; mục tiêu co giật (shake ±3@40Hz 400ms) rồi văng; điện chạy trên mặt đất.
- Môi trường: `lightning_storm` + vết cháy `decal scorch`.

### [ANIM-065] Ult Thiết Giáp — `skill_ult_tg` (hiệp sĩ đồng, kim)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Mỗi nhát chém: shake dọc, vết cắt kim loại (decal crack), mảnh kim loại văng, flash trắng 2 nhát đầu; cuối mưa mảnh kim + bụi, vòng đồng khi khiên đóng. CHƯA làm: hiệp sĩ rơi có shadow growth. · allEnemies · Hiện có: `fxp_bronze_knight`×4, `fxp_bronze_shield`, shake 8
- Kịch bản: 4 hiệp sĩ đồng từ trên rơi xuống (`fall` + shadow growth) lần lượt chém tạo đường cắt kim loại chéo (slash arc lớn + tia lửa), tiếng chuông kim; tấm khiên đồng cuối đóng lại; shake nặng, bụi + mảnh kim loại văng.
- Môi trường: vết cắt trên đất, tia lửa kim loại bắn.

### [ANIM-066] Ult Hoả Giải — `skill_ult_hg` (lò rèn/búa lửa, hệ lửa)
- [x] Đã làm (B6) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Búa 3 nhát: hit-stop light/medium/ultimate, flash cam mỗi nhát, shake dọc; nhát cuối thêm nứt đất rực cam (`fx_ground_crack` tint), vết cháy, 4 đợt `ember_fall` (mưa lửa ~0.9s). CHƯA làm: sóng xung kích riêng, burn visual cho mục tiêu, `fire_rain` module. · allEnemies · Hiện có: `fxp_forge_anvil`, `fxp_fire_hammer`, 3 decal ring cam, shake 6/8/12, stop 120
- Kịch bản: nền đỏ cam; đe lơ lửng trên địch, búa lửa to nện 3 nhát (nhát 1 nhẹ, 2 vừa, 3 cực mạnh), mỗi nhát: ring cam + sóng xung kích + flash; nhát cuối **mưa lửa** (`fire_rain`) rơi 1.2s + nứt đất rực dung nham; mục tiêu cháy (applies burn visual).
- Môi trường: `fire_rain` + `ground_crack` phát sáng cam.

### [ANIM-067] Ult Mộc Mẫu — `skill_ult_mm` (cây mẹ, buff đồng đội)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Lá nảy, ribbon dây leo xanh toả ra, vòng xanh + hạt sáng dưới chân đồng đội, cánh hoa, lá rơi cuối, flash xanh nhạt. CHƯA làm: cỏ mọc quanh chân, đom đóm (cần asset A06). · allAllies (support) · Hiện có: `fxp_mother_tree` (shake 0, stop 0)
- Kịch bản: hạt giống rơi, **cây mẹ lớn mọc lên** (grow `easeOutBack` 900ms, dây leo ribbon toả ra), hoa nở trên đồng đội, phấn hoa/cánh hoa bay trong gió, vầng xanh hồi; outro: lá rơi.
- Môi trường: cỏ mọc quanh chân, đom đóm.

### [ANIM-068] Ult Hư Không — `skill_ult_hk` (chuông trời, hệ hư vô)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Flash trắng 1 nhịp đầu (thay đảo màu), rune tím dưới địch, 3 hồi chuông: split + sóng tròn toàn sân, tia hư vô, mục tiêu co lại, vignette tím. CHƯA làm: vòng hút xoáy thật, vết nứt không gian, tinh vân. · allEnemies · Hiện có: `fxp_sky_bell`, 3 decal ring, shake 5/7/10, stop 120
- Kịch bản: màn đảo màu 1 frame, **vòng hút hư không** (spiral) kéo mục tiêu về tâm, chuông trời gõ 3 hồi (mỗi hồi sóng tròn lan toàn màn + chromatic), hư vô nuốt rồi nổ ra; mục tiêu mờ rìa.
- Môi trường: vết nứt không gian (đường trắng zigzag), tinh vân tím.

### [ANIM-069] Ult Phượng Hoàng — `skill_ult_phoenix` (lửa, địch toàn bộ)
- [x] Đã làm (B6) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Thêm 2 phượng bay chéo ngược chiều, phượng lớn dang cánh (grow 1.4) bao màn, flash vàng + shake dọc, mưa lông lửa 4 đợt, tro/khói xám cuối. CHƯA làm: phượng `dive` đường cong thật, sóng nhiệt méo viền màn, bão lốc lửa. · allEnemies · Hiện có: `fxp_phoenix`×3, shake 10, stop 110
- Kịch bản: trời đỏ cam, 3 phượng hoàng lao xuống nối nhau (`dive` đường cong), lông lửa rơi (`firefeather_fall`), cuối cùng phượng hoàng lớn **dang cánh bao trùm màn** (grow) rồi nổ cầu lửa; mưa lửa + bão lốc lửa nhỏ; outro: tro bay.
- Môi trường: `fire_rain` + sóng nhiệt (méo viền màn nhẹ).

### [ANIM-070] Ult Đinh Ba — `skill_ult_trident` (nước, địch toàn bộ)
- [x] Đã làm (B6) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Mưa lớn 5 đợt, ribbon nước dâng (dày 28% màn, dài 1.2, bọt) 1.2s, 3 vòng sóng xung kích tròn, flash xanh, mục tiêu knock + lift sẵn có, hit-stop heavy. CHƯA làm: cột nước xoáy xoắn quanh đinh ba (ribbon xoắn), nước dâng 12% rồi rút thật, mây giông. · allEnemies · Hiện có: `fxp_trident`, shake 8×2, stop 90
- Kịch bản: mây giông + mưa lớn, đinh ba lơ lửng sáng, **cột nước xoáy (waterspout) dựng quanh đinh ba** (ribbon xoắn), phóng đinh ba cắm xuống giữa sân → sóng xung kích tròn dâng cao + ngập (nước dâng 12% màn rồi rút); mục tiêu bị nhấc lên rồi quật xuống.
- Môi trường: mưa, ngập nước, gợn tròn.

### [ANIM-071] Ult Thần Thoại — `skill_ult_mythical` (vòng linh, hư vô)
- [x] Đã làm (B7) · P1 · Ultimate
Ghi chú dev: ĐIỀU CHỈNH. Rune vàng trên đất, 2 vòng linh bay qua (xanh/lục), flash trắng + split, slow-mo 0.3 300ms sau hit-stop, nổ sao đa sắc, mưa sao băng 4 đợt, mục tiêu văng. Giữ 3.5s (test chặn ult <3.5s, không phải 3.8s). CHƯA làm: 4 linh thú ảo ảnh. · allEnemies · Hiện có: `fxp_spirit_circle`, shake 10, stop 120, punch
- Kịch bản: vòng linh khổng lồ trải xuống sân (rune tự quay + phát sáng), 4 linh thú ảo ảnh bay quanh rồi lao vào các mục tiêu; đỉnh điểm: **vụ nổ ánh sáng đa sắc** (flash trắng 160 + chromatic) + sao băng; đây là ult "đỉnh" nên dài nhất (3.8s) với slow-mo 0.3 ở cú chạm.
- Môi trường: rune sáng trên đất, sao rơi.

---
### Nhóm Turn-HUD

### [ANIM-010] HUD state machine + dock/plate co giãn
- [x] Đã làm (B2)
Ghi chú dev: ĐIỀU CHỈNH. `ui/battleHud.ts` (thuần, có test): `hudPhase` (idle/turnStart/choosing/aiming/resolving/result theo độ ưu tiên), bảng `HUD_LAYOUT` (dock open/compact/hidden, turnbar full/mini, plates full/hp-only), `hudTracker` ghi mốc đổi phase, `hudMoving` (220ms, tắt khi reduceMotion). `battleView` gắn class `is-hud-*`/`is-dock-*`/`is-plates-*`/`is-hud-moving` lên `.adventure-ui__battle`; `_adventure.scss`: dock trượt ra khi skill chạy (animation transform/opacity, pointer-events tắt khi ẩn), plate chỉ giữ HP, thanh lượt thu 0.82. Dùng CSS animation (không transition) vì `patch()` thay cả node khi markup đổi. Cần xác nhận bằng mắt không bị giật khi DOM dựng lại.
- Ưu tiên: P1
- Nhóm: Turn-HUD
- Đối tượng: dock lệnh (`__dock`), nameplate (`__plate`), thanh lượt (`__turnbar`), nút công cụ
- File liên quan: mới `adv/ui/battleHud.ts`; `adv/ui/battleView.ts` (`renderBattle`: dock chỉ ẩn khi `replay`); `_adventure.scss` (`__dock` l.956, `__turnbar` l.742, `__plate`)
- Hiện trạng: dock **luôn hiện** khi không replay — kể cả lúc skill đang phát animation (dock còn hiển thị che 8.4rem đáy sân, nameplate full); không phân biệt lượt mình/quái.
- Hướng sửa: xem §1.7. Trạng thái và hành vi: `turnStart(ally)`: dock **trượt lên** (translateY 100%→0, 220ms `cubic-bezier(.2,.9,.3,1.1)`) ; `resolving`: dock **cuộn xuống** (→ translateY 82% chỉ còn mép tay cầm 1.2rem, 200ms) và nameplate phụ (không phải actor/target) mờ 0.55 / thu gọn chỉ còn thanh HP; `turnStart(enemy)`: dock ẩn hẳn, thanh lượt phóng to đầu (`.is-now` scale 1.15, 180ms); `result`: plates trở lại full sau 300ms. Phải chạy bằng class `data-hud` trên `.adventure-ui__battle` (không dựng lại DOM — nhớ lỗi `patch()` ở PROGRESS 2026-10-25).
- Phụ thuộc: không (độc lập với Phaser).
- Tiêu chí nghiệm thu: [ ] khi skill chạy dock cuộn vào, xong thì trượt ra; [ ] không giật layout (chỉ transform/opacity); [ ] click dock vẫn đúng khi trượt; [ ] `reduce` ⇒ chuyển tức thì; [ ] test thuần bảng chuyển trạng thái.
- Asset cần thêm: không.

### [ANIM-011] Dấu hiệu "đến lượt" trên sân (animal & quái)
- [x] Đã làm (B2)
Ghi chú dev: ĐIỀU CHỈNH. `scene/battle/turnMarker.ts`: vòng nhịp dưới chân + mũi tên nảy trên đầu (vẽ bằng code, vàng cho ta / tím cho quái; hằng `TURN_MARKER`), biến mất khi step bắt đầu chiếu hoặc unit gục, đứng yên khi reduce. `StageUnit.active` đọc từ class DOM `is-active` (`battleStageVm.ts`). CHƯA làm: thay bằng art `A07`, hoạt cảnh bắt đầu lượt (ANIM-080).
- Ưu tiên: P1
- Nhóm: Turn-HUD
- Đối tượng: mọi unit khi đến lượt (kể cả quái)
- File liên quan: `scene/battle/battleUnits.ts` (`StageUnit` **không có** trường `active` ⇒ Phaser không biết ai đang đến lượt; chỉ có `.is-active::after` bóng sáng DOM dưới chân), `adv/ui/adventureUi.ts` (`battleStage()`), `adv/ui/battleStageVm.ts::measureStage`, mới `scene/battle/turnMarker.ts`
- Hiện trạng: lượt hiện **chỉ** thể hiện ở thanh lượt DOM + ellipse sáng dưới chân (DOM). Quái đến lượt không có tín hiệu riêng.
- Hướng sửa: `StageUnit.active` + `StageUnit.hover`; `TurnMarker`: (1) mũi tên/kim cương bobbing phía trên đầu (`fxs_turn_arrow`, bob 6px@2Hz, màu ally vàng `#ffd23c`, enemy tím `#b06ae0`); (2) vòng sáng dẹt dưới chân scale 0.8→1.1 pulse 1.4Hz; (3) thân "nhún chào" lúc bắt đầu: `hop` 8px + scale 1.06 trong 220ms (`turnStart`); (4) các unit khác tối nhẹ (brightness 0.85) trong lúc chọn lệnh của ally; với quái: spotlight vignette 0.25 quanh quái 240ms + banner tên nhỏ "Tên quái đang tung <skill>" (nếu không quá ồn). Khi quái hành động 240ms trước skill (P0 của §1.1).
- Phụ thuộc: ANIM-010 (cùng trạng thái).
- Tiêu chí nghiệm thu: [ ] nhìn một cái biết ai đến lượt, cả quái; [ ] không che nameplate; [ ] biến mất ngay khi unit bắt đầu hành động/bị hạ.
- Asset cần thêm: `A07_turn_marker_hud.md`.

### [ANIM-080] Hoạt cảnh bắt đầu lượt cho quái & animal (áp dụng ANIM-011)
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Turn-HUD
- Đối tượng: 13 quái thường/elite có entry `creatures` + 4 trùm; 22 animal
- File liên quan: `fx.json actions` (thêm `turn_start_ally`, `turn_start_enemy`), `battleScript.ts`
- Hiện trạng: không có action `turn_start`.
- Hướng sửa: thêm 2 action 240ms: ally `hop 8 + star_pop nhỏ`; enemy `rear 8° + mắt đỏ lóe (glow #ff4a4a 120ms) + sound growl`; boss thêm shake nhẹ 2px 200ms.
- Phụ thuộc: ANIM-011.
- Tiêu chí nghiệm thu: [ ] mỗi quái có tín hiệu lượt riêng, không > 240ms.
- Asset cần thêm: SFX trong `A09`.

### [ANIM-081] Thanh lượt: trượt đầu hàng & phản hồi
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Turn-HUD
- Đối tượng: `turnBar` (`battleField.ts`), slot sáng `__turn-slot`
- File liên quan: `battleField.ts::turnBar`, `_adventure.scss` l.742–815
- Hiện trạng: thanh lượt rebuild theo DOM (không animate di chuyển ô); `adventure-slot` pulse. Không có chuyển động khi ô đầu rời đi / ô kế trượt lên.
- Hướng sửa: FLIP animation (đo vị trí cũ/mới theo `data-turn`) — ô đầu trượt ra trái và mờ 180ms, các ô còn lại trượt 200ms, ô mới của vòng sau xuất hiện scale 0.6→0.82 (`outBack`); ô `.is-now` có viền sáng nhịp 1.2s.
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] thấy ô trượt, không nhảy cóc; [ ] không rebuild DOM mỗi tick.
- Asset cần thêm: không.

### [ANIM-082] Telegraph ý định của quái (intent)
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Turn-HUD
- Đối tượng: quái có `intent` (`u.intent`, `u.intentArt`), trùm
- File liên quan: `battleField.ts` (`adventure-ui__intent`)
- Hiện trạng: icon ý định tĩnh trong nameplate.
- Hướng sửa: icon nhấp nhẹ 1Hz; khi sắp tung (trước lượt của nó) phóng to 1.25 + viền đỏ pulse 2Hz; mũi tên/đường mờ từ quái tới mục tiêu dự kiến (nếu VM cho biết).
- Phụ thuộc: ANIM-021.
- Tiêu chí nghiệm thu: [ ] người chơi đọc được "con này sắp làm gì".
- Asset cần thêm: không.

---
### Nhóm Map

> Hiện trạng chung (đã đối chiếu): `scene/walker.ts`: leader là **ảnh tĩnh** `chr_so|chr_bi_<up|down|left|right>_<idle|walk1|walk2>` (96×144, 3 khung/hướng), chu kỳ `['walk1','idle','walk2','idle']` ở **8 fps cố định**; tốc độ `AB.explore.speed = 260 px/s` (`content/adventure/balance.json`), cao hiển thị 120px; `stepCharacter` (`src/systems/character/move.ts`) cho vận tốc **tức thời** (không tăng/giảm tốc), chéo được chuẩn hoá nhưng hướng hiển thị chỉ 4 hướng (`facingFor` giữ trục hiện tại). Camera `MapCamera.follow` ease 110ms. Follower: ảnh tĩnh 1 khung (`textureKey(a.art)`), nhún `|sin(walkedMs/1000*9+i)|*6px`, chỉ `flipX`.

### [ANIM-090] Chuyển động mượt: tăng/giảm tốc, làm tròn pixel
- [x] Đã làm (B8)
Ghi chú dev: ĐIỀU CHỈNH. `logic/walkMotion.ts` (thuần, có test): vận tốc có quán tính ở Walker (tăng tốc tau 70ms, giảm 55ms), truyền hướng+tỉ lệ tốc độ vào `stepCharacter` (không đổi `systems/character`); giữ `moving` trong lúc giảm tốc; đụng tường thì mất vận tốc. Làm tròn vị trí vẽ theo 1/zoom và `scroll` camera sau `centerOn`. Cần xác nhận bằng mắt không còn rung viền.
- Ưu tiên: P1
- Nhóm: Map
- Đối tượng: nhân vật dẫn đầu (So/Bi) và cả đội
- File liên quan: `src/systems/character/move.ts::stepCharacter`, `scene/walker.ts::update`, `scene/mapCamera.ts`
- Hiện trạng: vận tốc 0→260 tức thì khi nhấn/thả ⇒ cảm giác đơ; vị trí lẻ pixel (`setPosition(pos.x, pos.y+6)` không làm tròn) kết hợp camera lerp ⇒ rung nhẹ sprite so với nền; khi dừng `walkedMs=0` và đổi khung sang `idle` ngay (giật).
- Hướng sửa: giữ `stepCharacter` thuần cho va chạm nhưng thêm **vận tốc có quán tính** ở `Walker` (không đổi logic `systems/character`, hoặc thêm `velocity` tuỳ chọn): `v += (target - v) * (1 - exp(-dt/70ms))` khi bắt đầu (tăng tốc ~120ms), `exp(-dt/55ms)` khi thả (giảm tốc ~90ms); truyền `dir*vNorm` vào `stepCharacter`. Làm tròn vị trí vẽ: `Math.round` theo `1/zoom`; sửa camera `centerOn` làm tròn. Giảm tốc kéo theo khung chân chậm dần (xem ANIM-091). Giữ `moving=true` trong lúc giảm tốc để walk anim không cắt đột ngột.
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] bắt đầu/dừng có độ trượt ~0.1 s; [ ] không rung viền sprite khi camera đuổi; [ ] va tường vẫn trượt đúng; [ ] test thuần cho hàm vận tốc.
- Asset cần thêm: không.

### [ANIM-091] Chu kỳ bước: khớp tốc độ, nhún, squash
- [x] Đã làm (B8)
Ghi chú dev: ĐIỀU CHỈNH. Tốc độ khung = clamp(speed/30, 5, 14) (260px/s ≈ 8.7fps), 2 khung = 1 bước; leader nhún 5px, squash 4% khi chạm đất, nghiêng ±1.5°; dừng thì squash nhỏ settle 90ms; bóng elip dưới chân co theo độ nâng. CHƯA làm: chu kỳ 6–8 khung (cần asset A01). Cần chỉnh `FRAME_STRIDE_PX` bằng mắt nếu chân còn trượt.
- Ưu tiên: P1
- Nhóm: Map
- Đối tượng: So/Bi dẫn đầu
- File liên quan: `walker.ts` (`CYCLE`, `WALK_FPS`, `LEADER_HEIGHT`), asset `chr_so_*`, `chr_bi_*`
- Hiện trạng: chu kỳ 4 khung 8 fps = 2 Hz; quãng đường mỗi chu kỳ = 260/2 = **130 px** > chiều cao nhân vật (120) ⇒ chân "trượt trên mặt đất" (foot sliding); **leader không có nhún thân** (chỉ follower có `hop`); chỉ 3 khung ⇒ chuyển động nghèo.
- Hướng sửa: (a) `fps = clamp(speed * vNorm / strideLen, 6, 14)` với `strideLen ≈ 60 px/bước` (1 bước = 1 khung chạm đất); với 260 px/s ⇒ ~4.3 bước/s ⇒ chu kỳ 4 khung ~ 8.7 fps — kiểm chứng bằng mắt để hết trượt (hoặc giảm tốc độ); (b) thêm **bob thân leader**: `dy = -|sin(phase*π)|*5px`, `sy = 1 - 0.03*|sin|` (squash khi chạm đất), `rot = sin(phase*π)*1.5°`; (c) bóng dưới chân co theo bob; (d) nếu có thêm khung (xem asset): chu kỳ 6–8 khung. Dừng: khung `idle` + squash nhỏ (settle 90ms).
- Phụ thuộc: ANIM-090 (tuỳ chọn).
- Tiêu chí nghiệm thu: [ ] chân khớp nền khi đi (không trượt); [ ] thân nhún theo nhịp bước; [ ] tốc độ khung đổi theo vận tốc (chạy chậm → bước chậm).
- Asset cần thêm: `A01_walk_cycle_so_bi.md`.

### [ANIM-092] Đi lên/xuống, đi chéo, 8 hướng
- [x] Đã làm (B8)
Ghi chú dev: ĐIỀU CHỈNH. Mặt hiển thị tách khỏi `Facing` chung (`pickFace`, hysteresis 120ms, chéo chọn trục lớn hơn, chéo đều giữ mặt hiện tại); đi lên/xuống lắc thân ±3°. Không đổi API `systems/character`. CHƯA làm: 4 hướng chéo/6 khung (cần asset A01).
- Ưu tiên: P1
- Nhóm: Map
- Đối tượng: So/Bi và follower
- File liên quan: `src/systems/character/move.ts::facingFor`, `walker.ts` (khung `${facing}_${frame}`), `systems/character/types.ts::FACINGS` (4 hướng)
- Hiện trạng: chỉ 4 hướng; đi chéo giữ trục cũ (`prev === horizontal || vertical ? prev : horizontal`) ⇒ khi đi chéo lên-phải có thể mặt vẫn quay xuống hoặc chuyển hướng đột ngột; đi lên/xuống dùng chung 3 khung như ngang ⇒ cảm giác đơ (đặc biệt "lên/xuống" do không có phối cảnh bước chéo).
- Hướng sửa: (1) **Trước mắt (không cần asset)**: với hướng lên/xuống thêm *lắc thân* (rot ±3°) + squash mạnh hơn 4%; khi đi chéo, chọn mặt theo trục có |dir| lớn hơn, có **hysteresis** 120ms để không nhảy; flip ngang cho chéo-trái khi chỉ có `right` (kiểm tra art có đối xứng); (2) **Có asset**: bổ sung 4 hướng chéo (ur, ul, dr, dl) hoặc ít nhất `down/up` với 6 khung. `FACINGS` mở rộng sẽ động tới `systems/character` (Farm cũng dùng) — chuyển sang **thuộc tính hiển thị riêng của Adventure** (`displayFacing`) thay vì đổi `Facing` chung để khỏi ảnh hưởng Farm/Garden.
- Phụ thuộc: ANIM-091.
- Tiêu chí nghiệm thu: [ ] đi lên/xuống nhìn có nhịp bước & lắc thân; [ ] đi chéo mặt hướng ổn định; [ ] không đổi API `systems/character` chung nếu không cần.
- Asset cần thêm: `A01`.

### [ANIM-093] Follower (3 đồng đội) di chuyển sống động
- [x] Đã làm (B8)
Ghi chú dev: ĐIỀU CHỈNH. Follower nhún cùng pha bước của leader (lệch 0.3 bước mỗi con), nhún mờ dần 120ms khi dừng, "thở" ±2% (2.2s) khi đứng, squash 4%, lật theo hướng đi thật (điểm trail phía trước). CHƯA làm: trễ phản ứng 40ms/follower.
- Ưu tiên: P2
- Nhóm: Map
- Đối tượng: 3 follower (animal/pet trong đội)
- File liên quan: `walker.ts::update` (followers), `setFollowers`
- Hiện trạng: follower dùng 1 ảnh tĩnh (`textureKey(a.art)`), nhún `hop` biên độ 6px với pha `walkedMs/1000*9` — **không đồng bộ** với nhịp bước leader (8 fps ⇒ 2 Hz vs 9 rad/s ≈ 1.43 Hz); chỉ `flipX` khi `at.x > pos.x+2` (lật theo vị trí so với leader, không theo hướng di chuyển thật); khoảng cách `GAP=42` cố định ⇒ cuộn nhẹ khi đứng; dừng thì follower ngừng nhún ngay.
- Hướng sửa: đồng bộ pha `phase = walkedMs/1000 * strideHz * 2π + i*0.9`; flip theo vector di chuyển của chính follower (lấy điểm trail i và i+3); squash khi chạm đất 4%; follower "thở" khi đứng (sy ±2%, 2.2s); khi dừng: giảm dần nhún 120ms; thêm trễ phản ứng nhẹ (mỗi follower lag 40ms); khi leader đổi hướng gấp, follower lượn cong (đã theo trail — ổn).
- Phụ thuộc: ANIM-091.
- Tiêu chí nghiệm thu: [ ] đội trông là một đội đang đi cùng nhịp; [ ] follower quay mặt đúng hướng đi.
- Asset cần thêm: không (nếu có `cb_<art>_idle` có thể dùng).

### [ANIM-094] Sắp xếp độ sâu theo Y, bóng, che khuất
- [x] Đã làm (B8)
Ghi chú dev: ĐIỀU CHỈNH. Bóng elip (texture canvas `advmap_shadow`) dưới leader và từng follower, co/mờ theo độ nâng; depth follower = chân − 0.001×(i+1) để cùng hệ sort với leader. CHƯA kiểm bằng mắt: che khuất sau cây/nhà (`mapCovers`) và dốc (`mapCliffs`).
- Ưu tiên: P2
- Nhóm: Map
- Đối tượng: So/Bi + follower + scenery (`scene/mapDepth.ts`, `mapDepthKit.ts`)
- File liên quan: `walker.ts` (`setDepth(pos.y)`, follower `at.y - 1`), `scene/mapDepth.ts`
- Hiện trạng: depth = `y` chân — đúng cho sort theo Y; follower `-1`; không có bóng dưới chân nhân vật trên map (kiểm tra `walker.ts`: không có shadow image) ⇒ nhân vật "lơ lửng" nhất là khi bob thêm; khi nhân vật đi sau vật cản cao cần che (đã có `mapCovers.ts`; xác minh với leader 120px).
- Hướng sửa: thêm bóng elip (texture `SHADOW_KEY` tương tự battle) co/giãn theo bob; kiểm lại ngưỡng depth với `mapCovers`/`mapDepth` để leader và follower sort cùng hệ (dùng chân + 0.001*idx); kiểm khi leo dốc (nếu bản đồ có `mapCliffs`).
- Phụ thuộc: ANIM-091.
- Tiêu chí nghiệm thu: [ ] nhân vật có bóng; [ ] đi sau cây/nhà bị che đúng; [ ] follower không "nhảy" trước/sau leader sai.
- Asset cần thêm: không.

---
### Nhóm Khác

### [ANIM-004] Screen FX Director (hit-stop theo tầng, slow-mo, letterbox, vignette)
- [x] Đã làm (B1)
Ghi chú dev: ĐIỀU CHỈNH. `scene/battle/screenFx.ts`: `hitStop(tier|ms)` (HIT_STOP_MS light50/medium80/heavy120/ultimate220), `slowMo`, `shake` có hướng + suy giảm mũ, `letterbox`, `vignette`, `reset()` (gọi ở fx.clear + đổi step). Acts mới `slowmo`, `letterbox`, `vignette`; `stop` nhận `tier`; `shake` nhận `dir`. Stage clock: `BattleScene` có `lost` -> cue/pose đọc `now - lost` nên slow-mo kéo giãn đồng bộ cue, pose, tween, hạt. LƯU Ý: số bay/banner DOM chạy bằng đồng hồ thật nên sẽ LỆCH khi slow-mo (chưa skill nào dùng; xử lý trước khi dùng ở B6). CHƯA làm: `zoomTo` (act `punch` hiện có đủ dùng), `chromatic` (act `split` có sẵn), gom hằng depth vào `layers.ts`. Chưa có skill nào gọi các act mới -> cần thử bằng Admin lab khi dùng ở ult.
- Ưu tiên: P1
- Nhóm: Khác
- Đối tượng: toàn trận (đòn thường, chí mạng, ult, boss phase, KO)
- File liên quan: mới `scene/battle/screenFx.ts`; `BattleScene.ts` (`holdUntil`, `tweens.timeScale`), `fxActs.ts` (`stop`, `shake`, `punch`, `flash`, `tint`, `split`), `ui/battleFxView.ts`, `ui/battleFloaters.ts`
- Hiện trạng: hit-stop chỉ có `holdUntil` (ms, tối đa ult 120 ms trong dữ liệu); không có slow-mo thực; không có thanh cinematic; shake dùng `cameras.main.shake` (ngẫu nhiên, không hướng); các số DOM (`floaterEl`) **vẫn chạy trong hit-stop** (do chú thích trong `BattleScene`: số DOM đi tiếp) ⇒ tách rời nhịp.
- Hướng sửa: §1.3. Tier hit-stop: `light 50 · medium 80 · heavy 120 · ultimate 200–260`. Stage clock có `timeScale` (xem §1.3); DOM floaters phải đọc cùng đồng hồ stage (`playingStep().shown` nhân hệ số) hoặc bị trễ đúng bằng thời gian hit-stop (cộng `holdTotal` vào offset). `shake` có hướng: `camera.setScroll(origin + dir*amp*decay)` bằng tween `outExpo` 220–450ms. `reduce` ⇒ tất cả bị bỏ.
- Phụ thuộc: không (nền móng).
- Tiêu chí nghiệm thu: [ ] hit-stop đồng bộ với số bay; [ ] slow-mo mượt (không nhảy hạt); [ ] hết hiệu ứng thì mọi biến camera/tint được reset (kể cả thoát trận giữa chừng); [ ] test thuần cho `stageClock`.
- Asset cần thêm: không.

### [ANIM-100] Idle sống động (key pose tĩnh)
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: mọi unit trong trận
- File liên quan: `adv/ui/battlePose.ts` (idle sin: `dy = cyc*bob`, `sy = 1 + cyc*breathe`), `motionProfiles.ts::BODY`
- Hiện trạng: idle = hô hấp sin biên độ 2.8% (`breathe 0.028`) ± bob theo plan; mọi unit cùng một kiểu; nhìn "ảnh tĩnh phồng xẹp".
- Hướng sửa: thêm **cử động phụ định kỳ** ngẫu nhiên theo `hash(id)`: mỗi 4–7 s một "micro-action" 500ms (vẫy đuôi/tai = rot ±3° lệch trục dưới/trên, nhìn quanh = flipX tạm thời không dùng; nháy = swap `hurt` face?) ; chuyển trọng tâm (dx ±3 theo 2.6 s); quái hung dữ: thở nặng hơn + rung nhẹ. Unit sắp chết (HP<25%) thở gấp (idleMs ×0.6) và lảo đảo nhẹ.
- Phụ thuộc: ANIM-005.
- Tiêu chí nghiệm thu: [ ] hai unit cạnh nhau không đồng pha; [ ] unit HP thấp có dấu hiệu.
- Asset cần thêm: không.

### [ANIM-101] Phản ứng bị đánh theo tầng (nhẹ / nặng / chí mạng)
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: mọi unit (reaction `hit`, `hit-heavy`)
- File liên quan: `battlePose.ts` (case `hit`/`hit-heavy`), `fx.json actions.hit/heavy`, `battleMotion.ts` (`crit || mult > 1`)
- Hiện trạng: 2 mức (`hit` 24px, `heavy` 42px); chí mạng = `heavy`. `hit` action chỉ `drop_spray` + sound (nhẹ); `heavy`: stop 120, punch, flash, boom.
- Hướng sửa: tách 3 mức: `light` (hit-stop 40, nhún 18px), `medium` (80, 28px, flash 60ms), `crit` (120, 44px, chữ "CRIT!" scale 1.4, shake 6 hướng, viền flash đỏ vàng 140ms, `chromatic` 120ms); weak/strong theo hệ (`mult`): khi **khắc hệ** hiện biểu tượng mũi tên ↑ nhỏ & tia sáng; **bị kháng** hiện khiên mờ.
- Phụ thuộc: ANIM-004.
- Tiêu chí nghiệm thu: [ ] 3 mức khác nhau rõ; [ ] khắc hệ/kháng hệ có dấu hiệu riêng.
- Asset cần thêm: không.

### [ANIM-102] Né / trượt đòn
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: reaction `miss`
- File liên quan: `fx.json actions.miss`, `battlePose.ts` (case `miss`: dx −40 hop)
- Hiện trạng: `rear` + trail + `fx_wind_swirl` + streak; nhìn ổn. Thiếu chữ "MISS" nảy và đòn đánh *xuyên qua* ảnh mờ của mục tiêu (afterimage đã có).
- Hướng sửa: thêm chữ "MISS" slide-in từ phía né (DOM floater đã có tone `miss` — kiểm tra), âm "whiff", và người tấn công **lố đà** (overshoot 14px rồi lấy lại, `settle`).
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] né nhìn "tránh được" chứ không phải "bị đẩy".
- Asset cần thêm: không.

### [ANIM-103] Hạ gục / xác / hồi sinh
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: KO của animal và quái (trùm khác)
- File liên quan: `battlePose.ts` (case `ko`), `battleUnits.ts` (`u.down ? opacity 0.4 + gray`), `fx.json actions.ko/revive`
- Hiện trạng: KO = xoay −14°, sy 0.86, xám, opacity 0.4, pose `ko` + `fx_poof` + sao; unit **đứng đó xám mờ vĩnh viễn** (cả quái, vì `down` vẫn vẽ ở 0.4). Quái nên tan/biến mất; trùm cần phase chết riêng.
- Hướng sửa: Quái thường: 600ms ngã → 400ms mờ dần về 0 + phát hạt tan (`ko_puff`) → ẩn; chừa chỗ để drop/exp bay (nếu có). Animal ally: ngã & giữ pose `ko` mờ 0.5 (hồi sinh được). Trùm: slow-mo 0.3 trong 500ms, shake mạnh, nổ lớn (`fx_boom` scale 2.2) + flash, rồi tan; hồi sinh: xem ANIM-032.
- Phụ thuộc: ANIM-004.
- Tiêu chí nghiệm thu: [ ] quái bị hạ biến mất gọn; [ ] trùm chết có khoảnh khắc "đã đời"; [ ] animal ally ngã vẫn nhìn ra là còn cứu được.
- Asset cần thêm: không.

### [ANIM-104] Số sát thương & floater theo nhịp stage
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: số bay (`FloaterVm`: damage, crit, strong, weak, heal, miss, status, buff)
- File liên quan: `adv/ui/battleFloaters.ts`, `battleFxView.ts::floaterEl`, `_adventure.scss` (`__floats`)
- Hiện trạng: số render bằng DOM, tối đa 4/unit (`MAX_PER_UNIT`), thời điểm theo `eventAt`; không theo hit-stop.
- Hướng sửa: nảy `outBack` 220ms (scale 0.6→1.25→1), bay lên theo parabol nhẹ, crit lớn + đổi màu + viền; stacking tránh chồng; số heal bay lên từ chân; đồng bộ stage clock (ANIM-004).
- Phụ thuộc: ANIM-004.
- Tiêu chí nghiệm thu: [ ] số nảy có "trọng lượng"; [ ] không chồng đè khi nhiều mục tiêu.
- Asset cần thêm: không.

### [ANIM-105] Chuyển cảnh vào/ra trận, thắng/thua, bảng tổng kết
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: vào trận (`ENTER_MS=1100`, `actions.enter_ally/enemy`), thắng (`victory`), thua, bảng `reportView.ts`
- File liên quan: `battleFxView.ts`, `AdventureScene` (fade vào trận?), `adv/ui/reportView.ts`, `fx.json actions.victory`
- Hiện trạng: vào trận: cột sáng + flicker (`teleport`, opacity sin) và quái `poof + appear`; thắng: pose `victory` + hop + cánh hoa/sao; thua: chưa thấy chuỗi animation riêng (kiểm tra thủ công — đánh giá qua code: `mark victory` chỉ cho `outcome==='win'`); bảng tổng kết có đếm EXP bar stagger và `levelUp` nhãn (xem `reportView.ts`).
- Hướng sửa: (1) transition vào: màn "bắt đầu trận" 500ms (xoáy/lật tấm) trước khi sân hiện; tên khu & cờ phe chạy ngang 700ms; (2) thua: màn chuyển đỏ-xám + units ally gục + dòng chữ, không "ngay lập tức" về map; (3) thắng: slow-mo nhẹ ở đòn cuối (0.35 trong 300ms), camera zoom vào người đánh cuối, confetti; (4) bảng tổng kết: panel trượt lên + đếm số có `easeOutExpo`, item rơi nảy (nếu có).
- Phụ thuộc: ANIM-004.
- Tiêu chí nghiệm thu: [ ] vào/ra trận có chuyển cảnh; [ ] thua có hoạt cảnh riêng; [ ] bảng tổng kết sinh động.
- Asset cần thêm: không.

### [ANIM-106] Lên cấp (level up)
- [ ] Chưa làm
- Ưu tiên: P2
- Nhóm: Khác
- Đối tượng: animal lên cấp (sau trận, trên bảng và ở trại)
- File liên quan: `adv/ui/reportView.ts` (`adventure-board__levelup`, SFX `level_up`), `tripResultVm.ts`
- Hiện trạng: chỉ nhãn chữ `levelUp` + âm.
- Hướng sửa: cột sáng từ chân lên 500ms + vòng sao + animal nhảy `hop` ×2 + chữ "LV n→n+1" scale pop; bảng chỉ số +x hiện từng dòng nảy.
- Phụ thuộc: không.
- Tiêu chí nghiệm thu: [ ] khoảnh khắc lên cấp có "ăn mừng".
- Asset cần thêm: không.

### [ANIM-107] Ngân sách hiệu năng + test + công cụ QA animation
- [x] Đã làm (B0)
Ghi chú dev: ĐIỀU CHỈNH (một phần). `BattleScene.update`: `poseAnchors` + map `sides` tái dùng giữa frame (clear + set), `poseOf` nhận `sidesIn` tùy chọn nên không dựng `Map` mỗi unit mỗi frame. `fxAnchors` còn tạo mới mỗi frame (chưa gom). Test mới: mọi skill phép có circle & step ≤ stepMax. CHƯA làm: số liệu FPS/particle trong Admin lab, các test 'track về pose 0', 'status có expire' (chờ ANIM-005/003).
- Ưu tiên: P1
- Nhóm: Khác
- Đối tượng: toàn hệ
- File liên quan: `BattleScene.update` (alloc mỗi frame), `battlePose.ts::poseOf` (l.82: `new Map(...)` **mỗi lần gọi, mỗi unit, mỗi frame**), `tests/unit/battleFx.test.ts`, `tools/admin/battleLab.ts`
- Hiện trạng: `poseOf` dựng `new Map([...anchors].map(...))` cho mỗi unit mỗi frame (3+4 unit ⇒ ~7 Map/frame); `BattleScene.update` dựng `poseAnchors`, `fxAnchors` (Map mới) mỗi frame; `stepScript` đã cache (tốt).
- Hướng sửa: truyền `sides` đã tính một lần/frame vào `poseOf`; tái dùng Map giữa các frame (clear + set); đo bằng `performance.measure` trong lab; thêm test "không skill nào có tổng thời lượng > `stepMax`", "mọi asset script tham chiếu tồn tại" (đã có theo PROGRESS), "mọi track về pose 0", "mọi status có `expire`" (sau ANIM-003), "mọi skill non-physical có circle". Lab thêm: chọn status → xem apply/loop/expire; chọn ult → xem từng pha; hiển thị FPS/particle count/active timed.
- Phụ thuộc: không (làm song song).
- Tiêu chí nghiệm thu: [ ] không cấp phát Map trong vòng lặp frame; [ ] lab hiển thị số liệu; [ ] test mới xanh.
- Asset cần thêm: không.

### [ANIM-003] Status Visual System (apply · layers · tick · expire + diff)
- [x] Đã làm (B1)
Ghi chú dev: ĐIỀU CHỈNH (lõi đã làm, `layers` hoãn). Schema `statuses[id]` thêm `expire`, `tick`, `freezeBody`, `priority` (+ validator). `ui/statusDelta.ts` (thuần, có test): diff trạng thái giữa 2 frame; `statusBadges.ts` phát `expire` đúng 1 lần khi status mất, không phát cho unit mới thấy (reload) / unit gục / sau `hideAll`. `tick` riêng thay action dot_* chung (battleScript). `cleanse` mark nay chạy action mới `cleanse` (JSON). `freezeBody` -> `PoseAnchor.frozen` làm thân đứng yên khi idle. Tint chọn theo `priority`. JSON: freeze có expire (vỡ băng `fx_ice_shatter`) + freezeBody + priority 10; poison có expire (khói tan). CHƯA làm: `layers` (orbit/aura/emitter liên tục), `resist` visual, expire cho 23 status còn lại (nội dung, làm ở B3/B4), Admin lab xem apply→loop→expire, tint pulse. => ANIM-051 phần vỡ băng + đứng yên idle nay đã có.
- Ưu tiên: **P0**
- Nhóm: Status
- Đối tượng: toàn bộ 25 status + events `cleanse`/`resist`
- File liên quan: `scene/battle/statusBadges.ts`, `scene/battle/BattleScene.ts` (`badges.update`, loops), `adv/ui/battleScript.ts` (marks), `adv/ui/battlePose.ts` (freezeBody), `schema/battleFx.ts` (StatusVisual), `fx.json statuses`
- Hiện trạng: xem §1.2 — không có `expire`/`tick`/`layers`, mỗi status loop chỉ bằng `loopCues` (các act chỉ tính vào `ScriptCue`, không có đối tượng sống để xoá), thân tint chỉ khi `tint` khai báo.
- Hướng sửa: §1.2. Thứ tự làm: (1) schema + validator + migration JSON (mặc định rỗng); (2) `StatusLayers` quản lý đối tượng sống theo `(unitId, statusId)`; (3) diff để phát `expire`; (4) `freezeBody`, `tint pulse`, `priority`; (5) cleanse/resist/tick; (6) Admin lab: chọn status, xem apply→loop(3s)→expire. Test thuần: bộ diff `statusDelta(prev,next)`.
- Phụ thuộc: không (nền móng, làm sớm).
- Tiêu chí nghiệm thu: [ ] mỗi status có thể khai báo apply/layers/tick/expire trong JSON; [ ] mất status ⇒ phát expire đúng 1 lần; [ ] unit chết ⇒ layer dọn sạch; [ ] reload giữa trận ⇒ layer dựng lại không phát expire giả.
- Asset cần thêm: xem `A02`.

---

## 3. Thứ tự triển khai đề xuất

> Mỗi batch vừa sức 1 session. Batch 0–2 là nền móng, **làm đúng thứ tự**. Batch 8 (Map) độc lập, có thể song song với bất kỳ batch nào.

| Batch | Nội dung | Task | Kết quả |
|---|---|---|---|
| **B0 — Sửa lỗi chặn chơi** | Targeting + vòng phép | ANIM-002, ANIM-001, ANIM-051 (bỏ rung khi đóng băng), ANIM-107 (alloc mỗi frame + test) | Click được mọi mục tiêu; mọi skill phép có cast → circle → skill |
| **B1 — Nền móng FX** | Stage clock + Screen FX + Status system | ANIM-004, ANIM-003 | `screenFx`, `StatusLayers`, diff expire, Admin lab xem được |
| **B2 — Nền móng chuyển động** | Keyframe/prop/ribbon + HUD | ANIM-005, ANIM-007, ANIM-006, ANIM-010, ANIM-011 | Track pose, prop có quán tính, ribbon, HUD state machine, turn marker |
| **B3 — Trạng thái** | 7 status + HUD icon | ANIM-050, 052, 053, 054, 055, 056, 057, 058 (051 phần còn lại) | Mỗi status có apply/loop/expire; cần asset `A02` (hoặc fallback code) |
| **B4 — Buff & Cast** | Ngôn ngữ buff + cast animal/quái | ANIM-008, 030, 031, 032, 033, 034, 020, 021, 022 | Buff phân biệt được; animal & quái tung phép đủ pha |
| **B5 — Skill** | Nước + passes | ANIM-040, 041, 042, 043 | Nước "chảy"; đòn vật lý & đạn có quán tính |
| **B6 — Ultimate I** | Director + 4 ult nặng | ANIM-009, 066, 064, 069, 070 | Khung ult + lửa/sét/phượng/đinh ba |
| **B7 — Ultimate II** | 8 ult còn lại | ANIM-060, 061, 062, 063, 065, 067, 068, 071 | Đủ 12 ult |
| **B8 — Map** | Di chuyển | ANIM-090, 091, 092, 093, 094 | Đi mượt, chân khớp, follower đồng nhịp |
| **B9 — Turn/HUD & Khác** | HUD, idle, hit, KO, chuyển cảnh | ANIM-080, 081, 082, 100, 101, 102, 103, 104, 105, 106 | Hoàn thiện cảm giác tổng |

Ghi chú: sau mỗi batch cập nhật `docs/PROGRESS.md`, chạy `npm run check`, chụp GIF từ Admin lab đính vào PR để người dùng duyệt (theo AGENT_RULES §7). Gameplay-freeze (decision 021) không bị đụng: mọi thứ là trình bày. **Hai chỗ có thể là thay đổi gameplay → hỏi chủ dự án trước**: thêm status "ngủ", thêm unit trạng thái mới; thêm hướng chéo cho `systems/character` chung (nên tránh).

---

## 4. Asset & âm thanh AI không tự làm được

Hint + PROMPT + hướng dẫn: thư mục `art_inbox/.batch/adventure-big-update-1/animation/` (`README.md` = hướng dẫn; `A01…A08` = hint + 35 sheet prompt dán thẳng vào Gemini theo chuẩn batch adventure-12/13: sheet nhiều ô, ảnh mẫu đính kèm, nền xám #C8C8C8, không glow/chữ). Hiệu ứng 4 khung theo quy ước `fx_*_f1..f4` như `docs/animation/COMBAT_ART_GUIDE.md`. Âm thanh: file mp3 ngắn (`adv_*`), thiếu thì im lặng (đúng quy ước hiện tại).

| File | Nội dung | Dùng ở task |
|---|---|---|
| `A01_walk_cycle_so_bi.md` | Walk cycle 6–8 khung × 4 (hoặc 8) hướng cho So & Bi | ANIM-091/092 |
| `A02_status_overlays.md` | Vòng sao/chim choáng, mặt xoáy, băng loop/nứt, bọt độc, lửa bám, xích phong ấn, đồng hồ doom, icon freeze | ANIM-050…057 |
| `A03_buff_auras.md` | Aura/hex/vòm/heal-rise/streak cho buff | ANIM-008, 030–034 |
| `A04_cast_circles.md` | 9 hệ vòng phép (2–3 lớp) | ANIM-022 |
| `A05_water_kit.md` | Dải nước seamless, foam curl, giọt, bọt | ANIM-006, 040 |
| `A06_ult_environment.md` | Nứt đất, tuyết, bão, mưa lửa, rạn không gian, tia sáng | ANIM-009, 060–071 |
| `A07_turn_marker_hud.md` | Mũi tên lượt, vòng chân, reticle tuỳ chọn | ANIM-011, 002 |
| `A08_ult_cutin.md` | Chân dung cut-in 12 ult / pose `ult` | ANIM-009 |
| `A09_sfx_list.md` | Danh sách SFX cần thêm | nhiều task |

---

## 5. Rủi ro & lưu ý hiệu năng

- **Cấp phát mỗi frame**: `poseOf` tạo `Map` mỗi unit mỗi frame; `BattleScene.update` tạo 2 Map mỗi frame → GC giật trên máy yếu. Sửa trong ANIM-107 trước khi thêm layer.
- **Số đối tượng Phaser sống đồng thời**: mỗi act `strip/prop/decal` tạo `Image` rồi huỷ qua `Timed`; thêm layer status liên tục × 7 unit × nhiều status có thể >100 đối tượng; đặt **ngân sách**: ≤ 6 layer/unit, ≤ 40 layer toàn sân, ≤ 420 hạt (đã có cap), ≤ 3 ribbon, ≤ 20 điểm/ribbon. Khi vượt: giảm `more` của hạt (không tắt layer CC).
- **Ribbon/Rope** chỉ khi WebGL (Aquarium đã kiểm `renderer.type === Phaser.WEBGL` ở `fishBody.ts`) — luôn có fallback Canvas/`reduce`.
- **Stage clock / slow-mo**: hiện cue/pose/hạt đều dùng `performance.now()`; slow-mo nửa vời (chỉ tween) sẽ lệch nhau. Thiết kế 1 đồng hồ, làm trong ANIM-004 trước các ult.
- **DOM rebuild**: từng có lỗi `patch()` so `outerHTML` dựng lại cả màn mỗi tick (PROGRESS 2026-10-25). HUD/targeting mới phải đổi bằng class/attribute, không đổi markup theo đồng hồ.
- **State dọn**: camera zoom/letterbox/tint/slow-mo phải reset khi: thoát trận, reload, hạ nhanh, `reduce` bật giữa chừng. Viết `screenFx.reset()` gọi ở `!s.active`.
- **Asset thiếu**: mọi hook phải có fallback bằng code (đúng nguyên tắc hiện có: glow theo màu look). Ghi `docs/ASSET_TODO.md`.
- **x2 tốc độ & ép `STEP_MAX_MS`**: đặt sàn thời lượng từng pha (P2 ≥ 160ms) để hệ số ép không phá cảm giác.
- **Test**: logic thời gian thuần đã có test; đừng đưa logic vào Phaser. `npm run check` phải xanh; test hiệu năng đo bằng lab, không đưa vào CI.
- **Rủi ro review**: đánh giá này **qua code**, chưa xem được chuyển động thật; các con số (ms, px, màu) là điểm xuất phát — tinh chỉnh bằng mắt trong lab. Một số file đang sửa dở trong working tree (battlePose/battleMoves/battleUnits) — rebase trước khi sửa.

---

## Phụ lục A — Inventory (kiểm kê)

**Combat animal (phe ta):** 9 dòng — `nam_hai` (WATER), `quy_son` (EARTH), `da_mac` (DARK), `quang_tru` (LIGHT), `loi_duong` (LIGHTNING), `thiet_giap` (METAL), `hoa_giai` (FIRE), `moc_mau` (NATURE), `hu_khong` (VOID); 20 loài `PIG_*` (`KNIGHT, SAMURAI, ROBOT, NINJA, VAMPIRE, PIRATE, POSEIDON, THOR, TIGER, VALKYRIE, UNICORN, DRAGON, PHOENIX, TURTLE, CRYSTAL, GALAXY, MYTHICAL, BOAR, HEDGEHOG, SUNFLOWER`) + 2 cá (`fish_pufferfish`, `fish_betta`). Dữ liệu: `content/adventure/lineages.json`, ảnh pose `cb_<art>_*` (258 key pose theo PROGRESS 2026-10-30).

**Skill riêng theo dòng (unique, 36):** `nh`: bubble, soothe, tide_song, tsunami · `qs`: rock_smash, stone_skin, mountain_shell, quake · `dm`: ink, ink_veil, night_net, nightmare · `qt`: ray, first_light, guiding_lamp, lumina · `ld`: thunder_strike, swift_bolt, chain, call_thunder · `tg`: steel_slash, bronze_wall, armor_break, steel_charge · `hg`: hot_claw, forge_fire, lava, inferno_hammer · `mm`: poison_thorn, sprout, binding_roots, blossom · `hk`: pure_impact, void_veil, phase_shift, void_vortex.
**Skill class (32):** taunt, hold_fast, shield_wall, second_wind, armor_crush, stomp, fortress, tremor, power_strike, aim, combo, rend, dash, vital, finisher, shadow_dance, energy_orb, focus, elemental_rain, pierce, freeze, seal, meteor, spell_storm, mend, cheer, healing_rain, purify, rally, channel, undying, aura.
**Ultimate (12):** `ult_nh, ult_qs, ult_dm, ult_qt, ult_ld, ult_tg, ult_hg, ult_mm, ult_hk, ult_phoenix, ult_trident, ult_mythical` (4 support: nh, qs, qt, mm).
**Quái (33 bản ghi `enemies.json`):** thường `mossling, thorn_sprout, gale_sparrow, ember_fox, dew_frog, forest_wolf, bramble_boar, wolf_alpha, rock_beetle, cliff_hawk, lava_newt, snow_goat, ore_golem, thunder_ram, stone_sentinel, rune_wisp, tide_wraith, ember_idol, shadow_priest, reef_crab, salt_gull, coral_eel, drift_jelly, brine_wraith, shell_knight`, mimic ×4 (`forest, mountain, ruins, coast`), **trùm**: `old_treant, magma_drake, ancient_guardian, abyss_kraken`. Body-plan đã khai báo (`fx.json creatures`, chỉ 15): 13 quái + 2 cá.
**Skill quái (32):** `vine_lash, poison_spore, spark_peck, ember_bite, bubble, soothe, howl, shadow_bite, tusk_charge, bark_skin, root_quake, corrupt_bloom, thorn_storm, iron_shell, metal_claw, dive, lava_spit, frost_breath, rock_slam, thunder_charge, magma_breath, dragon_roar, meteor, stone_guard, rune_beam, holy_ward, wraith_touch, curse, idol_flame, doom_mark, bronze_crush, seal_quake`.
**Status (25):** `poison, burn, wet, freeze, stun, disable, doom, atkUp, atkDown, defUp, defDown, matkUp, matkDown, mdefUp, mdefDown, accUp, accDown, evaUp, evaDown, spdUp, spdDown, shield, taunt, regen, autoRevive` (định nghĩa kiểu ở `src/systems/combat/types.ts`, số liệu `content/adventure/statuses.json`, visual `battle_fx.json statuses`).
**Phản ứng nguyên tố (6):** `shock, steam, wildfire, shatter, purify, eclipse`.
**Action chung (20):** `attack, guard, stunned, frozen, item, hit, heavy, miss, heal, regen, buff, debuff, dot_poison, dot_burn, ko, revive, victory, enter_ally, enter_enemy, boss_phase`.
**Strip hiện có dùng trong skill (21):** `fx_bite, bloom, bolt_strike, boom, claw, flame_burst, ground_crack, ice_encase, ink_splat, lava_pop, light_pillar, poof, pow_star, rock_spike, rune_lock, shield_dome, slash_arc, splash, vine_grab, void_portal, wind_swirl` (+ `fx_ice_shatter` file có, chỉ 1 skill dùng); `fxp_*` ≥ 48 vật thể; 217 preset hạt.
