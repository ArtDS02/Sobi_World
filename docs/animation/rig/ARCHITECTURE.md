# Animation Architecture — Puppet rig + lớp sống thủ tục + VFX theo kịch bản (decision 050)

Trạng thái mỗi mục: ✅ đã làm, có test · 🟡 đang làm / một phần · 📝 đề xuất.

## 1. So sánh phương pháp (cho game 2D chibi vẽ tay, art tạo bằng AI + chỉnh tay)
Điểm 1–5 (5 = tốt nhất cho Sobi World).

| Phương pháp | Chất lượng | Cá tính | Tự nhiên | Phức tạp chuyển động | Tái dùng | Dễ làm asset | Dễ code | Runtime | Hợp codebase | Mở rộng |
|---|---|---|---|---|---|---|---|---|---|---|
| Frame-by-frame (vẽ từng khung) | 5 | 5 | 5 | 5 | 1 | **1** (AI không giữ nhân vật đồng nhất qua khung; 43 con × 10 trạng thái × 8 khung ≈ 3.400 ảnh) | 5 | 3 | 4 | 1 |
| Sprite sheet (frame-by-frame đóng gói) | như trên | | | | | | | | | |
| Static image + transform (hiện tại) | 2 | 2 | 1 | 1 | 4 | 5 | 5 | 5 | 5 | 3 |
| **Cutout / puppet (bộ phận trên xương, keyframe)** | 4 | 4 | 4 | 4 | 4 | **4** (1 bộ layer / con, vẽ 1 lần) | 3 | 5 | 4 | 5 |
| Skeletal + mesh deform (Spine, DragonBones) | 5 | 4 | 5 | 5 | 4 | 3 | 2 | 4 | 2 (Spine cần license thương mại; DragonBones runtime ngừng phát triển) | 4 |
| Procedural (lò xo, sóng, IK) | 3 (một mình) | 2 | 4 | 2 | 5 | 5 | 3 | 5 | 4 | 5 |
| **Hybrid** (puppet + procedural + flipbook cho khoảnh khắc đổi hình + VFX kịch bản) | **5** | **5** | **5** | **5** | **4** | **4** | 3 | 5 | 5 | 5 |

**Chọn: Hybrid**, nền là **puppet rig cắt mảnh tự viết** (không thêm thư viện):
- **Puppet + keyframe clip** cho mọi hành động có thân: idle, di chuyển, đánh, cast, bị đánh, KO, thắng, thủ… → chuyển động thân thật, bộ phận phối hợp, đổi mặt.
- **Procedural** chồng lên (không thay): thở, chớp mắt theo nhịp riêng, **lò xo** (tai, bờm, lá, mai — overlap / follow-through tự sinh từ gia tốc thật của thân), **chuỗi uốn** (đuôi, vây, xúc tu, sống lưng cá — mesh deform bằng Phaser Rope).
- **Flipbook** (strip `fx_*`, đã có) cho khoảnh khắc đổi hình mà bộ phận không làm được: sóng dâng, nổ, băng mọc; về sau cho các khoảnh khắc biểu cảm cực mạnh (ultimate) — 4–8 khung, chỉ vài chỗ.
- **VFX kịch bản** (decision 044) giữ nguyên, nay neo vào bộ phận thật (đầu / mắt của puppet).

Lý do không chọn Spine: chất lượng mesh tốt nhất nhưng license editor + runtime thương mại, pipeline phụ thuộc phần mềm ngoài; puppet tự viết đủ cho chibi (bộ phận cứng + chuỗi Rope cho phần mềm), tất định, test được, cùng dữ liệu JSON như phần còn lại của game.

## 2. Kiến trúc (✅ phần lõi)
```
content/anim/rigs/<rig>.json  ──(zod: content/schemas/anim/rig.ts, rigProblems)──►  systems/animation  (THUẦN, có test)
   parts · bones · chains · springs · clips · feel                                      clip.ts      lấy mẫu keyframe, ease, blend
                                                                                         warp.ts      khớp clip vào nhịp trận (mốc)
asset/rigs/<rig>/<rig>.svg | layers/*.png ──npm run rig:parts──► public/assets/props/rig/ life.ts      thở, chớp, lò xo, noise tất định
                                                                  + manifest + box        skeleton.ts  FK, chuỗi uốn, thứ tự vẽ
                                                                                         performer.ts state machine: chọn clip, fallback,
                                                                                                      crossfade, fidget, springs
                                                                                         rigs.ts      registry RIGS, rigOf(art)
src/ui/puppet/puppet.ts (Phaser, dùng chung mọi Area) ◄── Frame (draw list)
   Container + Image/bộ phận + Rope/chuỗi, post-FX sáng / xám / glow, point(bone), copies()
        ▲
areas/adventure: ui/battlePerf.ts (beat → Want{action, timing}) + scene/battle/battlePuppets.ts (đặt puppet lên sân, giảm tween toàn thân theo feel.root)
tools/admin/rigLab.ts — "Xưởng rig sinh vật" (#/rig-lab): từng clip, ×0,25, xương, dải 8 khung, so ảnh cũ, cả đội
```
- Phụ thuộc đúng `ARCHITECTURE.md` §3: `systems/animation` chỉ import `content/schemas`; `ui/puppet` import `systems`; Area dùng cả hai. Guard xanh.
- Thời gian luôn được truyền vào (không `Date.now` / `Math.random`; noise = hash của id đơn vị).

## 3. Mô hình dữ liệu
- **Canvas chung**: 512 × 512, mặt đất y = 470, tâm x = 256 → toạ độ rig: chân tại (0, 0), lên là y âm. Cùng khung với key pose cũ (512²) → puppet đứng to bằng ảnh nó thay.
- **Part**: ảnh (manifest id) + `box` trong canvas (script ghi). **Bone**: `at` (khớp, toạ độ canvas), cha, `part` hoặc `slot` (mặt: nhiều ảnh đổi nhau), `z`.
- **Chain**: ảnh trải lên dải Rope từ gốc tới ngọn; `dir`, `len`, `segments`, `wave` (biên độ ở ngọn, chu kỳ/giây, lệch pha), `curl` (cuộn tĩnh), `taper`. Clip: `rot` xoay gốc, `sx` độ dài, `sy` hệ số cuộn (quất xúc tu).
- **Spring**: `stiff`, `damp`, `gain`/`gainY` (độ lệch / 1000 px/s² gia tốc), `max`. Đọc gia tốc thật của khớp (cả lực đẩy toàn thân từ trận).
- **Clip**: `len`, `loop`, `fade` (crossfade vào), `marks` (`windup`, `release`, `contact`, `recover`), `tracks` (bone → kênh → key `[ms, value, ease]`), `faces` (slot → `[ms, ảnh]`), `life` (bao nhiêu lớp sống chạy dưới clip), `waves` (sóng riêng của chuỗi trong clip).
- **Feel** (cá tính loài): `tempo`, `weight`, `breath`, `blink`, `root` (bao nhiêu tween toàn thân của trận còn áp — thân tự làm phần còn lại).
- **Fidget**: clip tên `idle_*` — performer chen vào khi đứng lâu (5,2–10,4 s, chọn theo noise) để idle không lặp máy móc.

## 4. State machine & transition (✅)
- Caller gửi `Want { action, key?, timing? }` mỗi khung. `key` đổi = bắt đầu lại hành động cùng tên (đòn thứ hai).
- Chọn clip theo `FALLBACK` (`hurt_crit → hurt_heavy → hurt`, `ultimate/support/charge → cast`, `heal → buff → victory`, `debuff/stunned/ko → hurt`, `dodge/enter → move`, cuối cùng `idle`).
- Đổi clip: **crossfade từ đúng tư thế khung trước** (kể cả lò xo), dài `clip.fade / tempo`. Mặt đổi ngay.
- Có `timing`: clip time = warp tuyến tính từng đoạn qua các mốc chung (bắt đầu ↔ 0, release ↔ `marks.release`, contact ↔ `marks.contact`, kết thúc ↔ `len`). → Tiếp xúc của clip trùng mốc số sát thương bật lên, dù trận nén / x2.
- Không `timing`: đồng hồ riêng ×`tempo`; one-shot hết thì về idle.
- Ưu tiên trong trận (`battlePerf.ts`): phản ứng mới nhất > beat của chính mình > posture do kịch bản ép > thắng > idle; đã gục → `ko` giữ khung cuối.

## 5. Ba lớp phối hợp, không thay nhau
| Lớp | Ai làm | Ví dụ Heo Rừng — đánh thường |
|---|---|---|
| Character Animation | clip rig + lò xo + chuỗi | thủ thế, lùi lấy đà, nhấc chân trước, phi 4 chân, húc (nhắm mắt, há miệng), mõm nảy, hồi |
| Root motion | `battlePose.ts` (giảm theo `feel.root`) | lao tới mục tiêu, về chỗ |
| Skill VFX | `battle_fx.json` (decision 044) | vệt, hạt, va chạm theo hệ |
| Impact Feedback | phản ứng mục tiêu = **clip `hurt` của mục tiêu** + hit-stop + số | đầu giật ngược, tai văng (lò xo), mắt nhắm, đổi mặt khóc |
Hit-stop dừng cả đồng hồ puppet (`BattlePuppets.tick`), slow-mo làm chậm nó. VFX neo đầu tại mắt / đầu thật của puppet (`puppets.head`). Bóng mờ / vệt / tách màu chép từng bộ phận (`fxGhosts.ts`).

## 6. Hiệu năng (✅ đo cấu trúc, 📝 đo FPS trên máy thật)
- Mỗi puppet: 1 Container, 15–24 Image, 1–6 Rope (10 đoạn), 0–1 post-FX (chỉ bật khi sáng / xám / glow). 6 đơn vị ≈ 150 object — cùng bậc với 420 hạt hiện có; WebGL gom lô theo texture.
- Lấy mẫu clip O(số key), solve O(số bone + đoạn chuỗi) / khung. Hiện `solve()` còn tạo một Map tra bone, danh sách vẽ và mảng điểm chuỗi mỗi khung, `mixPose` tạo Map tạm khi crossfade — rác nhỏ, chưa đo thấy giật; gom về bộ đệm dùng lại ở R5.
- Không WebGL: chuỗi vẽ thành ảnh thẳng, không post-FX (vẫn chạy).

## 7. Mở rộng cho cả Sobi World (body plan)
`plan` của rig: `quadruped`, `biped`, `heavy`, `aquatic`, `cephalopod`, `flyer`, `floater`, `small`. Mỗi plan có **template xương + bộ clip mẫu** (4 rig prototype là template đầu tiên); loài mới = bộ layer của loài + chỉnh `at`/`feel` + sửa clip ở chỗ cá tính. Nguyên tắc chuyển động từng plan: `PIPELINE.md` §6. Farm / Aquarium / Garden / Cloud dùng cùng `Puppet` (Phaser) với `Want` của Area mình (đi dạo, ăn, ngủ, bơi) — 📝 `ROADMAP.md` R3.

## 8. Những gì kịch bản cũ (049) nay làm được trên thân
"rụt vào mai" (`pig_turtle.guard`), "ngửa cổ gầm" (`pig_boar.cast`), "vẫy đuôi" (wave đuôi trong `victory`), "vây xoè" (`fish_betta.cast`), "xúc tu quất" (`octopus.attack`, `sy` cuộn 2,2 → -0,4), "cá lật bụng" (`fish_betta.ko`). Khả năng engine còn thiếu trong 049 được giải một phần: `action_by_body` → clip theo rig (✅).
