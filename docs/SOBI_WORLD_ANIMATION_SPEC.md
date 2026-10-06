# SOBI WORLD — ANIMATION SPECIFICATION
## Version 1.0

> **Mục đích:** Chuẩn hóa toàn bộ hệ thống animation cho Sobi World theo hướng 2D casual, nhẹ, offline, dễ mở rộng và phù hợp với kiến trúc Web/Vite/Electron hiện tại.
>
> **Nguyên tắc cốt lõi:** Không phải mọi animation đều cần sprite sheet. Chuyển động đơn giản dùng CSS/transform; chuyển động làm thay đổi hình ảnh dùng sprite/frame animation; chuyển động nhân vật kết hợp animation state + movement; animation hiếm dùng Special Animation System.

---

# 1. MỤC TIÊU

Sobi World gồm:

- Sobi Cloud
- Sobi Aquarium
- Sobi Garden
- Sobi Farm
- Sobi Adventure

Tất cả area phải sử dụng **một Animation System dùng chung**, không xây 5 hệ thống animation độc lập.

Animation System phải hỗ trợ:

1. Ambient animation.
2. Idle animation.
3. Movement animation.
4. Action animation.
5. Combat animation.
6. Special animation.
7. Random special event.
8. Direction/facing.
9. Animation priority.
10. Interrupt/cancel animation.
11. Animation cooldown.
12. Animation speed variation.
13. Performance throttling.
14. Reduced-motion fallback.
15. Asset/animation configuration bằng data thay vì hard-code.
16. Có thể mở rộng qua Admin Dashboard trong tương lai.

---

# 2. PHONG CÁCH ANIMATION

## 2.1. Visual direction

Animation phải phù hợp với phong cách Sobi World:

- Cute 2D casual.
- Chuyển động mềm.
- Không quá nhanh.
- Không quá exaggerated.
- Không tạo cảm giác pixel-art nếu asset gốc không phải pixel-art.
- Giữ silhouette và style của asset.
- Giữ lighting/shading nhất quán.
- Không làm asset méo hoặc thay đổi tỷ lệ ngoài ý muốn.
- Ưu tiên chuyển động nhỏ nhưng liên tục để tạo cảm giác thế giới sống.

## 2.2. Nguyên tắc "less is more"

Không phải object nào cũng cần animation phức tạp.

Ví dụ:

```text
Flower:
  sway → đủ.

Tree:
  sway → đủ.

Cloud:
  float → đủ.

Pig:
  walk + idle → cần sprite animation.

Fish:
  swim + turn → cần sprite animation hoặc deform/motion phù hợp.

Combat animal:
  idle + skill + hit + defeat → cần state animation.
```

---

# 3. ANIMATION TECHNOLOGY POLICY

## 3.1. Level A — Transform Animation

Dùng cho chuyển động đơn giản:

- Rotate.
- Translate.
- Scale.
- Opacity.
- Floating.
- Sway.
- Bobbing.
- Pulse.

Ưu tiên CSS transform / animation hoặc animation loop nhẹ tương đương.

### Ví dụ

```text
Flower:
  rotate -3° → +3° → -3°
```

Không tạo thêm frame hình ảnh nếu transform đã đủ đẹp.

---

# 4. Level B — Sprite / Frame Animation

Dùng khi hình ảnh thực sự thay đổi:

- Chân bước.
- Cánh chim vỗ.
- Vây cá chuyển động.
- Heo chạy.
- Sóc chạy.
- Nhân vật tấn công.
- Nhân vật dùng skill.
- Enemy bị đánh.
- Ultimate.

Sprite animation phải hỗ trợ:

```text
frames
fps
loop
direction
play
pause
stop
reverse
onComplete
```

---

# 5. Level C — Movement + Animation

Movement và visual animation phải là hai lớp riêng.

Ví dụ:

```text
Pig movement:
  position x/y thay đổi

Pig animation:
  walk frame 1 → 2 → 3 → 4
```

Không gắn cứng movement vào sprite animation.

Điều này cho phép:

- thay đổi tốc độ di chuyển mà không cần đổi sprite.
- thay đổi animation FPS mà không đổi gameplay.
- AI behavior quyết định destination.
- Animation System quyết định visual state.

---

# 6. Level D — State Machine

Các entity phức tạp phải dùng animation state.

Ví dụ:

```text
IDLE
 ↓
MOVE
 ↓
ACTION
 ↓
IDLE
```

Combat:

```text
IDLE
 ↓
ATTACK / SKILL
 ↓
HIT / REACTION
 ↓
IDLE
```

State Machine không được hard-code riêng cho từng animal nếu có thể dùng generic state definitions.

---

# 7. ANIMATION PRIORITY

Mỗi animation có priority.

Đề xuất:

```text
0 = ambient
10 = idle
20 = movement
30 = normal action
40 = reaction
50 = attack
60 = skill
70 = ultimate
80 = defeat
100 = forced/system animation
```

Animation priority cao hơn có quyền interrupt animation thấp hơn.

Ví dụ:

```text
Pig walking
    ↓
Hungry
    ↓
Run to feeder
```

Walk có thể bị thay thế bởi Run.

Trong combat:

```text
Idle
    ↓
Skill
    ↓
Hit reaction
```

Không để idle animation ghi đè skill animation.

---

# 8. ANIMATION DATA MODEL

Animation phải được định nghĩa bằng data.

Ví dụ:

```json
{
  "id": "pig_hero",
  "animations": {
    "idle": {
      "type": "sprite",
      "asset": "pig_hero_idle.png",
      "frames": 6,
      "fps": 8,
      "loop": true,
      "priority": 10
    },
    "walk": {
      "type": "sprite",
      "asset": "pig_hero_walk.png",
      "frames": 8,
      "fps": 10,
      "loop": true,
      "priority": 20
    },
    "special": {
      "type": "sprite",
      "asset": "pig_hero_special.png",
      "frames": 12,
      "fps": 12,
      "loop": false,
      "priority": 40,
      "chance": 0.03,
      "cooldown": [20, 40]
    }
  }
}
```

Transform animation:

```json
{
  "id": "flower_common",
  "animations": {
    "sway": {
      "type": "transform",
      "rotation": [-3, 3],
      "duration": [2500, 3500],
      "easing": "ease-in-out",
      "loop": true,
      "origin": "bottom-center"
    }
  }
}
```

---

# 9. RANDOM SPECIAL ANIMATION SYSTEM

## 9.1. Mục tiêu

Một số asset hiếm phải có animation đặc biệt nhưng không được phát liên tục.

Ví dụ:

```text
Normal:
  Idle / Sway / Swim

Occasionally:
  Special Animation

Then:
  Return to Normal
```

## 9.2. Special trigger

Không dùng một timer cố định cho toàn bộ object.

Mỗi instance phải có variation.

Ví dụ:

```text
Flower A → 21s
Flower B → 34s
Flower C → 27s
```

## 9.3. Recommended probability

Ambient rare special:

```text
Common: 0%
Uncommon: 0–1%
Rare: 1–3%
Epic: 2–5%
Legendary: 3–8%
```

Các giá trị trên là baseline, có thể chỉnh bằng data.

## 9.4. Cooldown

Special animation phải có cooldown.

Ví dụ:

```text
minCooldown = 20s
maxCooldown = 45s
```

Không được xảy ra liên tục.

## 9.5. Visibility condition

Không chạy special animation nếu:

- object không visible.
- area đang ở background/hidden state.
- game đang paused.
- tab/window bị inactive nếu browser API/state cho phép phát hiện.
- entity nằm ngoài vùng render đáng kể.

---

# 10. RANDOM IDLE VARIATION

Không chỉ special animation mới có variation.

Một số animal có thể có:

```text
Idle A
Idle B
Idle C
```

Ví dụ heo:

```text
Idle:
  đứng

Idle variation:
  lắc tai
  vẫy đuôi
  nhìn xung quanh
  nhún người
```

Tần suất thấp hơn animation idle chính.

---

# 11. SOBI CLOUD

## 11.1. Flower

### Normal animation

Tất cả cây hoa có thể:

```text
Sway Left
→ Center
→ Sway Right
→ Center
→ repeat
```

Baseline:

```text
rotation: -2° đến +3°
duration: 2.5–3.5s
easing: ease-in-out
loop: true
origin: bottom-center
```

Không đồng bộ toàn bộ flower.

Mỗi instance có:

```text
duration variation
rotation variation
delay variation
phase variation
```

### Rare flower special

Rare flower vẫn sway bình thường.

Thỉnh thoảng:

```text
Sway
→ pause
→ special animation
→ return to sway
```

Special có thể là:

- nở cánh.
- rung nhẹ.
- phát sáng.
- hạt/phấn hoa bay.
- sparkle.
- nghiêng mạnh một lần.
- mở/đóng cánh.

Không được biến special thành hiệu ứng quá mạnh làm mất phong cách casual.

---

## 11.2. Bird — bắt sâu

Bird phải có:

```text
IDLE/PERCH
FLY
TURN
LAND
CATCH_ACTION
RETURN
```

### Flying

Sprite:

```text
wing_up
wing_mid
wing_down
wing_mid
```

Baseline:

```text
8–12 FPS
```

### Movement

Bird bay theo đường mềm:

```text
start
→ target
```

Không teleport.

Có thể dùng:

```text
linear interpolation
ease-in-out
Bezier-like path nếu cần
```

### Catch insect

```text
FLY
→ SLOW/DIVE
→ CATCH
→ FLAP
→ FLY
```

Animation catch phải được trigger bởi gameplay AI, không random hoàn toàn.

---

## 11.3. Squirrel — tưới nước

State:

```text
IDLE
RUN_TO_TARGET
WATER
RUN_BACK / MOVE_TO_NEXT
IDLE
```

### Run

Sprite animation:

```text
run_1
run_2
run_3
run_4
...
```

Baseline:

```text
8–12 FPS
```

### Water

```text
STOP
→ WATER_START
→ WATER_LOOP
→ WATER_END
```

Water effect có thể dùng:

- sprite effect.
- particle nhẹ.
- transform.
- opacity.

Không cần physics simulation.

---

# 12. SOBI AQUARIUM

Sobi Aquarium chỉ có **một môi trường đáy đại dương**, nhưng có nhiều aquatic animals.

## 12.1. Fish movement

Mỗi fish cần:

```text
SWIM
TURN
IDLE / HOVER
SPECIAL optional
```

### Swim

Fish sprite phải có tối thiểu:

```text
swim_1
swim_2
swim_3
swim_4
```

Có thể nhiều hơn nếu cần.

Baseline:

```text
6–12 FPS
```

### Movement

Fish di chuyển trong khu vực sống.

Không yêu cầu exploration system.

Fish chỉ cần:

```text
current position
target position
speed
direction
```

### Direction

Nếu asset chỉ có một hướng:

```text
horizontal flip
```

nếu style cho phép.

Không được flip những asset có asymmetry quan trọng.

---

## 12.2. Different swimming behavior

Các loài có behavior khác nhau:

```text
Small fish:
  nhanh
  đổi hướng thường xuyên

Large fish:
  chậm
  quãng đường dài

Bottom animal:
  di chuyển gần đáy

Jellyfish-like:
  bobbing + drift

Rare animal:
  chậm + special animation
```

Animation system không được hard-code theo tên loài.

Dùng config:

```json
{
  "movementProfile": "slow_large",
  "swimSpeed": 30,
  "turnFrequency": 0.2
}
```

---

## 12.3. Rare aquatic special

Ví dụ:

```text
Rare fish
→ swim
→ sudden sparkle
→ quick turn / circle
→ return to swim
```

Hoặc:

```text
Rare creature
→ glow
→ particles
→ swim away
```

Special phải giữ nhẹ và không che UI.

---

# 13. SOBI GARDEN

## 13.1. Crop sway

Cây trồng khi trưởng thành:

```text
Sway Left
→ Center
→ Sway Right
→ Center
→ repeat
```

Baseline:

```text
rotation: -2° đến +3°
duration: 2.5–4s
```

Cây nhỏ có thể sway nhẹ hơn.

Ví dụ:

```text
Seedling:
  -1° → +1°

Young:
  -2° → +2°

Mature:
  -3° → +3°
```

## 13.2. Growth state

Growth animation là một hệ riêng:

```text
seed
→ sprout
→ young
→ mature
→ harvestable
```

Không bắt buộc real-time frame animation.

Có thể dùng:

```text
scale
opacity
sprite transition
```

## 13.3. Rare crop special

Rare crop:

```text
normal sway
→ random special
→ normal sway
```

Special có thể:

- flower bloom.
- sparkle.
- leaf movement.
- fruit shine.
- small pollen effect.

---

# 14. SOBI FARM

## 14.1. Pig animation states

Pig world:

```text
IDLE
WALK
RUN
EAT
DRINK
SLEEP
WAKE
HAPPY
SICK
SPECIAL
```

Không phải mọi pig bắt buộc có tất cả animation.

Animation fallback:

```text
missing specific animation
→ fallback to idle / movement
```

---

## 14.2. Pig movement

Movement:

```text
position update
+
direction
+
walk animation
```

Baseline walk:

```text
8–12 FPS
```

Run:

```text
10–14 FPS
```

## 14.3. Pig idle

Random idle variation:

```text
stand
ear twitch
tail movement
look around
body bounce
```

Tần suất thấp.

## 14.4. Feeding

```text
IDLE
→ HUNGRY
→ RUN_TO_FEEDER
→ EAT
→ SATISFIED
→ IDLE
```

Animation phải đồng bộ với gameplay state.

## 14.5. Sleeping

```text
WAKE
→ WALK
→ SLEEP
```

Sleep animation có thể:

```text
walk
→ stop
→ lower body
→ idle sleep
```

Nếu không có sprite sleep, dùng transform/scale nhẹ.

---

## 14.6. Rare pig special

Rare pigs vẫn dùng animation bình thường.

Occasionally:

```text
IDLE
→ SPECIAL
→ IDLE
```

Possible special:

- jump.
- spin.
- tail wag.
- happy bounce.
- pose.
- small sparkle.
- unique species behavior.

Không được làm special quá thường xuyên.

---

# 15. SOBI ADVENTURE

Sobi Adventure có yêu cầu animation cao nhất.

Animation chia thành:

```text
MAP ANIMATION
COMBAT ANIMATION
EFFECT ANIMATION
```

---

# 16. MAP AVATAR

States:

```text
IDLE
WALK
RUN optional
TURN
SPECIAL_IDLE optional
```

Movement:

```text
input / path
→ movement system
→ animation state
```

Nếu avatar đứng:

```text
idle
```

Nếu di chuyển:

```text
walk
```

Nếu đổi hướng:

```text
direction update
```

---

# 17. COMBAT ANIMAL

Combat animal:

```text
IDLE
IDLE_SPECIAL
ATTACK
SKILL_1
SKILL_2
SKILL_3
SKILL_4
CLASS_SKILL
HIT
DEFEND
RAGE
ULTIMATE
DEFEAT
```

Không phải mọi animal phải có sprite riêng cho mọi state ngay từ V1.

Fallback hierarchy:

```text
specific skill animation
→ generic attack
→ idle
```

---

# 18. COMBAT ENTRY

Khi animal vào trận:

```text
OFFSCREEN / RESERVE
→ ENTER
→ MOVE_TO_SLOT
→ STOP
→ COMBAT_IDLE
```

Có thể thêm:

- landing.
- jump.
- run-in.
- short pose.

Tùy animal.

---

# 19. COMBAT IDLE

Combat animal phải có cảm giác sống.

Ví dụ:

```text
breathing
body bounce
ear movement
tail movement
weapon movement
```

Không nên để toàn bộ party đứng bất động hoàn toàn.

Baseline:

```text
idle loop 2–5s
```

Random variation:

```text
5–15s
```

---

# 20. SKILL ANIMATION

Skill animation phải tách thành:

```text
CAST
→ EFFECT
→ IMPACT
→ RECOVERY
```

Ví dụ:

```text
Mage
CAST
 ↓
Magic effect
 ↓
Projectile
 ↓
Impact
 ↓
Recovery
```

Animation System phải cho phép gameplay chờ animation ở các điểm cần thiết.

Ví dụ:

```text
skill starts
→ cast
→ damage event
→ impact
→ recovery
→ turn continues
```

Không để damage timing phụ thuộc hoàn toàn vào animation FPS.

Gameplay timing là authoritative.

---

# 21. RAGE

Rage animation:

```text
NORMAL
→ RAGE_TRIGGER
→ RAGE_POSE
→ RAGE_IDLE
```

Có thể dùng:

- scale.
- shake nhẹ.
- glow.
- special sprite.
- particle.

Không dùng screen shake mạnh trừ khi combat effect yêu cầu.

---

# 22. ULTIMATE

Ultimate có priority rất cao.

Flow:

```text
COMBAT_IDLE
→ ULTIMATE_START
→ CAST
→ EFFECT
→ IMPACT
→ ULTIMATE_END
→ COMBAT_IDLE
```

Ultimate có thể sử dụng:

- character animation.
- VFX.
- camera effect.
- projectile.
- impact.
- sound.

Nhưng tất cả phải có thể tắt/giảm hiệu ứng nếu performance cần.

---

# 23. ENEMY MAP

Enemy map:

```text
IDLE
MOVE optional
SPECIAL_IDLE optional
```

Enemy không cần quá nhiều animation ở map.

Mục tiêu:

> Map có cảm giác sống nhưng không tiêu tốn tài nguyên.

---

# 24. ENEMY COMBAT

States:

```text
IDLE
ATTACK
SKILL
HIT
DEFEND optional
SPECIAL
DEFEAT
```

Enemy animation phải dùng cùng Animation System với combat animal.

---

# 25. ANIMATION EVENT SYSTEM

Animation có thể phát event:

```text
onStart
onFrame
onMarker
onComplete
onCancel
```

Ví dụ:

```text
skill animation
      ↓
frame 8
      ↓
impact event
      ↓
damage
```

Nhưng gameplay không được phụ thuộc tuyệt đối vào frame.

Có thể dùng marker:

```json
{
  "skill_1": {
    "animation": "skill_1",
    "events": [
      {
        "time": 0.45,
        "event": "damage"
      }
    ]
  }
}
```

---

# 26. ASSET PIPELINE

Recommended structure:

```text
assets/
├── animation/
│   ├── sprites/
│   ├── effects/
│   └── manifests/
│
├── cloud/
│   ├── flowers/
│   ├── birds/
│   └── squirrels/
│
├── aquarium/
│   ├── fish/
│   └── animals/
│
├── garden/
│   └── crops/
│
├── farm/
│   └── pigs/
│
└── adventure/
    ├── avatar/
    ├── combat_animals/
    └── enemies/
```

Mỗi animated entity:

```text
entity/
├── idle.png
├── walk.png
├── special.png
└── manifest.json
```

Không bắt buộc tất cả file phải tồn tại.

---

# 27. SPRITE SHEET STANDARD

Nếu dùng sprite sheet:

```text
- frame size nhất quán.
- transparent background.
- không watermark.
- không text.
- không crop mất phần cơ thể.
- cùng baseline.
- cùng scale.
- cùng lighting.
```

Frame phải được căn chỉnh để tránh object nhảy vị trí giữa các frame.

---

# 28. FRAME COUNT GUIDELINES

Không cần quá nhiều frame.

## Ambient

```text
Transform:
0 frame bổ sung
```

## Simple idle

```text
4–8 frames
```

## Walk

```text
6–10 frames
```

## Run

```text
6–10 frames
```

## Fly

```text
4–8 frames
```

## Swim

```text
4–8 frames
```

## Action

```text
6–16 frames
```

## Skill

```text
8–24 frames
```

## Ultimate

```text
12–30+ frames
```

Chỉ tăng số frame khi animation thực sự cần.

---

# 29. FPS GUIDELINES

Baseline:

```text
Ambient transform:
2–4s cycle

Idle:
6–10 FPS

Walk:
8–12 FPS

Run:
10–14 FPS

Swim:
6–12 FPS

Fly:
8–12 FPS

Action:
10–16 FPS

Combat skill:
10–20 FPS
```

Không hard-code tất cả.

Các giá trị phải configurable.

---

# 30. VARIATION SYSTEM

Mỗi instance có thể có:

```text
animationDelay
animationSpeedMultiplier
rotationOffset
specialCooldown
specialChance
movementSpeed
idleVariationChance
```

Ví dụ:

```json
{
  "animationSpeedMultiplier": 0.94,
  "delay": 0.37,
  "specialChance": 0.03
}
```

Mục đích:

> Tránh mọi entity cùng animation cùng frame.

---

# 31. PERFORMANCE

Sobi World là game offline nhưng vẫn phải tiết kiệm tài nguyên.

## 31.1. Visibility culling

Entity ngoài vùng nhìn thấy:

```text
pause animation
```

hoặc giảm update frequency.

## 31.2. Background throttling

Khi area không active:

```text
reduce animation updates
```

## 31.3. Avoid hundreds of independent timers

Không tạo một `setInterval` riêng cho từng entity nếu có thể.

Ưu tiên:

```text
central animation/update loop
```

và entity đăng ký vào system.

## 31.4. CSS transform

Ambient animation nên ưu tiên:

```text
transform
opacity
```

Tránh animation gây layout/reflow.

---

# 32. LAYERING

Animation phải giữ đúng render layer:

```text
Background
↓
Environment
↓
Ground Objects
↓
Animals / Crops
↓
Effects
↓
UI
```

Không để animation làm thay đổi z-index ngoài ý muốn.

---

# 33. DIRECTION

Generic direction:

```text
left
right
up
down
```

Nếu asset hỗ trợ horizontal flip:

```text
right = original
left = flipX
```

Không tự động flip mọi sprite.

Một số asset có:

- shadow.
- text.
- asymmetrical equipment.
- directional details.

Những asset đó phải có directional sprite riêng nếu cần.

---

# 34. TRANSFORM ORIGIN

Các object phải có transform origin phù hợp.

Ví dụ:

### Flower

```text
bottom-center
```

### Tree

```text
bottom-center
```

### Character

```text
center-bottom
```

### Fish

```text
center
```

### Cloud

```text
center
```

Sai transform-origin sẽ khiến object "bay" hoặc xoay quanh điểm không tự nhiên.

---

# 35. SPECIAL ANIMATION DESIGN RULE

Special animation phải:

1. Không phá gameplay.
2. Không block input nếu không cần.
3. Không thay đổi gameplay state trừ khi explicitly configured.
4. Có cooldown.
5. Có random delay.
6. Có fallback.
7. Có thể disable.
8. Không gây performance spike.
9. Không che UI quan trọng.
10. Có thể mở rộng cho rarity.

---

# 36. RARITY INTEGRATION

Rarity không tự động quyết định animation.

Rarity chỉ có thể mở khóa:

```text
special animation
special idle
special VFX
special behavior
```

Ví dụ:

```text
Common:
  normal animation

Rare:
  normal + rare idle

Epic:
  normal + rare idle + special

Legendary:
  normal + special + unique effect
```

Không biến rarity thành animation stat.

---

# 37. ACCESSIBILITY / REDUCED MOTION

Nếu user/system bật reduced motion:

```text
- giảm hoặc tắt ambient sway.
- giảm special animation.
- giảm camera effects.
- giữ gameplay animation cần thiết.
```

Không được làm game unusable.

---

# 38. AUDIO SYNC

Animation có thể trigger audio event:

```text
wing_flap
footstep
water
attack
impact
```

Nhưng Audio System phải độc lập.

Không hard-code audio vào sprite renderer.

---

# 39. ADMIN DASHBOARD FUTURE SUPPORT

Thiết kế data để sau này Admin có thể chỉnh:

```text
Animation
├── enable
├── type
├── asset
├── frames
├── fps
├── duration
├── loop
├── speed
├── priority
├── chance
├── cooldown
├── rotation
└── special behavior
```

Admin không bắt buộc phải hỗ trợ toàn bộ field ở V1.

V1 có thể chỉ read configuration.

---

# 40. FALLBACK SYSTEM

Nếu asset thiếu animation:

```text
special missing
→ idle

run missing
→ walk

walk missing
→ idle + movement transform

attack missing
→ generic attack / idle

skill missing
→ generic action + VFX
```

Game tuyệt đối không crash chỉ vì thiếu animation asset.

---

# 41. ERROR HANDLING

Nếu animation asset không load:

- log rõ asset ID.
- không crash game.
- dùng fallback.
- không tạo infinite retry loop.
- admin/dev mode có warning.
- production mode không spam console.

---

# 42. DEVELOPMENT TOOLS

Dev mode nên có:

```text
Animation Debug Panel
```

Có thể chọn entity và:

```text
Play
Pause
Restart
Next Frame
Change FPS
Change Speed
Play Special
```

Nếu chi phí triển khai thấp, thêm:

```text
Show current state
Show animation ID
Show frame
Show FPS
```

Đây là công cụ debug, không phải gameplay UI.

---

# 43. RECOMMENDED IMPLEMENTATION ARCHITECTURE

```text
AnimationManager
│
├── AnimationRegistry
│
├── AnimationPlayer
│
├── SpriteAnimator
│
├── TransformAnimator
│
├── MovementAnimator
│
├── AnimationStateMachine
│
├── SpecialAnimationScheduler
│
├── AnimationEventSystem
│
├── AnimationAssetLoader
│
└── AnimationPerformanceController
```

Entity sử dụng:

```text
Entity
 ↓
AnimationController
 ↓
AnimationManager
```

Không để mỗi component tự tạo một animation implementation riêng.

---

# 44. GENERIC ANIMATION API

API nên có khả năng tương tự:

```ts
play("idle")
play("walk")
play("special")
stop()
pause()
resume()
setSpeed(1)
setDirection("left")
isPlaying("walk")
getCurrentAnimation()
```

Không bắt buộc dùng đúng tên API này; đây là behavior contract.

---

# 45. ANIMATION STATE CONTRACT

Mỗi animated entity phải có:

```text
currentAnimation
previousAnimation
direction
isPlaying
animationTime
animationSpeed
```

Optional:

```text
queue
priority
interruptible
specialCooldown
```

---

# 46. ANIMATION QUEUE

Dùng khi cần:

```text
CAST
→ IMPACT
→ RECOVERY
```

Animation Queue không được dùng cho ambient loop.

---

# 47. INTERRUPT RULES

Ví dụ:

```text
IDLE
→ WALK
```

được interrupt.

```text
WALK
→ RUN
```

được interrupt.

Nhưng:

```text
ULTIMATE
→ IDLE
```

không được tự động interrupt trừ khi forced.

---

# 48. IMPLEMENTATION PHASES

## Phase 1 — Core

Implement:

- AnimationManager.
- SpriteAnimator.
- TransformAnimator.
- basic state.
- play/pause/stop.
- priority.
- fallback.
- config-based animation.

## Phase 2 — Ambient

Implement:

- Cloud flower sway.
- Garden crop sway.
- basic environmental animation.

## Phase 3 — Animals

Implement:

- Farm pig movement.
- Aquarium fish movement.
- Cloud bird.
- Cloud squirrel.

## Phase 4 — Special

Implement:

- random special scheduler.
- rarity integration.
- idle variations.

## Phase 5 — Adventure

Implement:

- map avatar.
- combat animal states.
- enemy states.
- skill animation.
- hit/defeat.
- rage.
- ultimate.

## Phase 6 — Optimization

Implement:

- visibility culling.
- central update loop.
- background throttling.
- performance profiling.
- reduced motion.

## Phase 7 — Admin/Dev Tools

Implement:

- animation debug panel.
- animation configuration preview.
- future admin integration.

---

# 49. IMPLEMENTATION RULES FOR AI CODING AGENT

AI coding agent phải:

1. Đọc toàn bộ source trước khi sửa.
2. Xác định renderer/UI/game architecture hiện tại.
3. Không tự ý thay đổi gameplay logic không liên quan.
4. Không tạo duplicate animation systems.
5. Tái sử dụng common components.
6. Không hard-code asset path trong nhiều nơi.
7. Dùng configuration/data-driven animation.
8. Giữ backward compatibility với asset hiện tại.
9. Không bắt buộc tạo sprite sheet nếu CSS transform đã đủ.
10. Không tạo animation asset giả nếu chưa có source/reference.
11. Có fallback khi asset animation chưa tồn tại.
12. Không làm animation ảnh hưởng collision/hitbox/gameplay position.
13. Không để animation thay đổi logical position nếu chỉ là visual transform.
14. Không tạo timer riêng cho hàng trăm entity nếu có central scheduler.
15. Kiểm tra performance sau khi áp dụng animation hàng loạt.
16. Không làm animation đồng bộ hoàn toàn giữa các entity.
17. Không tự ý thêm dependency lớn nếu browser/CSS/JS hiện tại đã đáp ứng.
18. Ưu tiên giải pháp free và dependency-light.
19. Không thay đổi style asset hiện tại.
20. Không sửa asset gốc chỉ để phục vụ animation nếu không cần thiết.

---

# 50. IMPORTANT: VISUAL VS LOGICAL POSITION

Đặc biệt tránh lỗi:

```text
CSS transform
```

làm visual object lệch khỏi:

```text
logical position
collision
interaction area
click target
AI position
```

Animation phải có separation:

```text
Logical Transform
+
Visual Animation Transform
```

Ví dụ flower sway chỉ thay đổi visual rotation, không thay đổi vị trí logic.

---

# 51. ACCEPTANCE CRITERIA — SOBI CLOUD

### Flower

- [ ] Tất cả flower có thể sway.
- [ ] Sway xoay quanh chân cây.
- [ ] Không tất cả flower đồng bộ.
- [ ] Có speed variation.
- [ ] Rare flower có thể special.
- [ ] Special có cooldown.
- [ ] Không ảnh hưởng interaction.

### Bird

- [ ] Có wing flap.
- [ ] Có movement.
- [ ] Có turn.
- [ ] Có landing/perching.
- [ ] Có catch behavior khi gameplay yêu cầu.

### Squirrel

- [ ] Có run.
- [ ] Có stop.
- [ ] Có watering.
- [ ] Có return/move-next.
- [ ] Animation khớp gameplay state.

---

# 52. ACCEPTANCE CRITERIA — SOBI AQUARIUM

- [ ] Fish có swim animation.
- [ ] Fish có movement.
- [ ] Có direction.
- [ ] Có turn.
- [ ] Các loài có movement profile khác nhau.
- [ ] Rare animal có special animation.
- [ ] Không yêu cầu exploration system.
- [ ] Không tạo môi trường nước thứ hai.
- [ ] Tất cả aquatic animals dùng chung Animation System.

---

# 53. ACCEPTANCE CRITERIA — SOBI GARDEN

- [ ] Mature crops sway.
- [ ] Cây không bị xoay quanh tâm sai.
- [ ] Các crop không đồng bộ.
- [ ] Growth state không phá animation.
- [ ] Rare crop có special animation.
- [ ] Animation không ảnh hưởng harvest/click area.

---

# 54. ACCEPTANCE CRITERIA — SOBI FARM

- [ ] Pig có idle.
- [ ] Pig có walk.
- [ ] Pig có run nếu gameplay cần.
- [ ] Pig có eat.
- [ ] Pig có sleep/wake.
- [ ] Pig movement khớp animation direction.
- [ ] Rare pig có special.
- [ ] Animation không phá feeder AI.
- [ ] Animation không phá collision/interaction.

---

# 55. ACCEPTANCE CRITERIA — SOBI ADVENTURE

### Map

- [ ] Avatar có idle.
- [ ] Avatar có movement.
- [ ] Avatar có direction.
- [ ] Movement mượt.

### Combat animal

- [ ] Combat idle.
- [ ] Entry animation.
- [ ] Attack.
- [ ] Skill.
- [ ] Hit.
- [ ] Defeat.
- [ ] Rage.
- [ ] Ultimate.
- [ ] Fallback nếu thiếu animation.

### Enemy

- [ ] Map idle.
- [ ] Combat idle.
- [ ] Attack.
- [ ] Skill.
- [ ] Hit.
- [ ] Defeat.
- [ ] Special nếu có.

---

# 56. PERFORMANCE ACCEPTANCE

Animation implementation phải:

- Không gây noticeable FPS drop với số lượng entity gameplay bình thường.
- Không tạo timer explosion.
- Không gây memory leak.
- Không giữ animation chạy vô hạn cho invisible entity.
- Không tạo layout thrashing.
- Không load toàn bộ sprite sheet của toàn Sobi World ngay khi game khởi động nếu không cần.
- Có lazy loading hoặc equivalent nếu architecture hỗ trợ.
- Có fallback nhẹ.

---

# 57. FINAL DESIGN PRINCIPLE

Sobi World không cần animation phức tạp ở mọi nơi.

Mục tiêu là:

```text
Static world
     ↓
Small ambient movement
     ↓
Living environment
     ↓
Animal movement
     ↓
Action animation
     ↓
Rare special moments
```

Cảm giác mong muốn:

> **Người chơi không cần chú ý đến animation, nhưng khi nhìn vào thế giới họ cảm thấy mọi thứ đang sống.**

---

# 58. SUMMARY TABLE

| Area | Entity | Normal | Special | Primary Technique |
|---|---|---|---|---|
| Cloud | Flower | Sway | Bloom / sparkle | Transform + Sprite |
| Cloud | Bird | Fly / flap | Rare behavior | Sprite + Movement |
| Cloud | Squirrel | Run / water | Optional | Sprite + Movement |
| Aquarium | Fish | Swim | Rare behavior | Sprite + Movement |
| Aquarium | Aquatic animals | Move / swim | Rare behavior | Sprite + Movement |
| Garden | Crop | Sway / grow | Bloom / sparkle | Transform + Sprite |
| Farm | Pig | Idle / walk / eat / sleep | Rare behavior | Sprite + Movement |
| Adventure | Avatar | Idle / walk | Optional | Sprite + Movement |
| Adventure | Combat animal | Idle / attack / skill | Rage / ultimate | Sprite + State Machine |
| Adventure | Enemy | Idle / attack / skill | Special | Sprite + State Machine |

---

# 59. FINAL REQUIREMENT

**Build one reusable Sobi World Animation System first.**

Do not implement five unrelated animation systems.

The final architecture must allow a new entity to declare:

```text
entity ID
+
animation definitions
+
movement profile
+
special animation configuration
```

without requiring a new custom animation implementation.

The system must make it possible to add a new:

- flower,
- crop,
- fish,
- pig,
- bird,
- squirrel,
- combat animal,
- enemy

by adding/configuring assets and data rather than rewriting the animation engine.

**Sobi World Animation System = shared infrastructure.**

**Each game area = data/content layer.**

This separation is mandatory for maintainability and future expansion.
