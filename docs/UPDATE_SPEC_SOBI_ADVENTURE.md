# MASTER PROMPT — UPDATE SOBI ADVENTURE COMBAT SYSTEM v2

## 0. MỤC TIÊU

Hãy đọc và kiểm tra toàn bộ `SOBI_ADVENTURE_GAMEPLAY_SPEC.md`, sau đó cập nhật lại SPEC để tích hợp toàn bộ hệ thống Combat mới bên dưới.

Mục tiêu là biến hệ thống combat của **Sobi Adventure** thành một hệ thống:

* Turn-based
* Strategic
* Data-driven
* Có chiều sâu build
* Dễ mở rộng
* Không mâu thuẫn giữa Skill / Class / SP / EXP / Rage / Element / Status / Equipment
* Có thể quản lý bằng Admin Dashboard trong tương lai.
* Có cơ chế save game bất cứ khi nào (khi đang không ở trong trận chiến)
* Đề xuất game có 2 ngôn ngữ là tiếng Anh và tiếng Việt (vì là game cho người Việt nên ngôn ngữ mặc định là tiếng Việt)

**Không được xóa hoặc làm mất các hệ thống hiện có nếu chúng vẫn tương thích.**

Nếu nội dung cũ mâu thuẫn với prompt này, **quy tắc trong prompt này được ưu tiên và phải thay thế nội dung cũ**.

Không tự ý đơn giản hóa các hệ thống bên dưới.

---

# 1. QUY TẮC KIẾN TRÚC BẮT BUỘC

Hệ thống phải phân biệt rõ:

```text
EXP
→ tăng Level / progression của Combat Animal

SP — Skill Points
→ mở khóa / nâng cấp Class Skill trong Skill Tree

MP / Energy
→ resource dùng trong combat để sử dụng Skill

Rage
→ resource chiến đấu dành cho Ultimate

Element
→ hệ thống thuộc tính sát thương / tương tác

Status
→ hiệu ứng trạng thái

Equipment
→ vật phẩm thay đổi stat / affinity / skill effect

Ultimate
→ kỹ năng đặc biệt dùng bằng Rage
```

**Không được sử dụng một resource cho nhiều mục đích nếu không có định nghĩa rõ ràng.**

Đặc biệt:

```text
SP ≠ EXP
SP ≠ MP
SP ≠ Rage
```

---

# 2. COMBAT ANIMAL

Mỗi Combat Animal vẫn giữ:

```text
CombatAnimal
├── ID
├── Species
├── Breed
├── Rarity
├── Level
├── EXP
├── Class
├── Base Stats
├── Traits
├── Elements
├── Unique Skills
├── Class Skill Tree Progress
├── Equipment
├── Status Resistances
├── Rage
└── Combat Attributes
```

Chỉ Combat Animal có:

```text
combatEnabled = true
```

mới được tham gia Adventure Combat.

---

# 3. PARTY

Party mặc định:

```text
3 Combatants
```

Có thể kết hợp:

```text
Pig + Pig + Pig
Pig + Fish + Pig
Fish + Fish + Pig
Fish + Fish + Fish
```

Không khóa party theo Species.

Mục tiêu:

> Strategy > Raw Stats

Không được thiết kế hệ thống theo hướng:

> Rarity cao = luôn mạnh hơn.

---

# 4. UNIQUE SKILL

Mỗi Combat Animal có:

```text
4 Unique Skills
```

Unique Skill đại diện cho identity của từng Combat Animal.

Unique Skill phải có thể dựa trên:

* Species
* Breed
* Theme
* Personality
* Rarity
* Element
* Combat Role
* Lore

Ví dụ:

```text
Hero Pig

Unique Skill 1
Unique Skill 2
Unique Skill 3
Unique Skill 4
```

Unique Skill **không thuộc Skill Tree của Class**.

---

# 5. CLASS SYSTEM

Combat Animal có đúng:

```text
1 Combat Class
```

Các Class cơ bản:

```text
Tanker
Physical DPS
Mage
Support
```

Class không khóa Species.

Ví dụ:

```text
Pig → Tanker
Pig → Mage
Fish → Physical DPS
Fish → Support
```

Class quyết định:

* Role
* Class Skill Tree
* Các skill chung mà Combat Animal có thể học
* Một phần Ultimate interaction nếu cần

---

# 6. CLASS SKILL TREE

## 6.1. Thay thế Class Skill Pool phẳng bằng Skill Tree

Hệ thống cũ:

```text
Class Skill Pool
```

phải được nâng cấp thành:

```text
Class Skill Tree
```

Skill Tree có:

* Tier
* Node
* Prerequisite
* SP Cost
* Upgrade Level
* Upgrade Cost
* Branch
* Skill Effect

Ví dụ:

```text
Tier 1
└── Stone Throw Lv1
        ↓
Tier 2
└── Summon Stone Pillar Lv2
        ↓
Tier 3
└── Summon Meteor Lv3
```

Skill Tree phải hỗ trợ **branching**.

Ví dụ:

```text
              ┌── Defensive Branch
Stone Throw ──┤
              └── Offensive Branch
```

Player không nhất thiết phải unlock toàn bộ Skill Tree.

---

# 7. SKILL POINT — SP

SP là resource progression dành riêng cho Class Skill Tree.

SP dùng để:

```text
Unlock Skill
Upgrade Skill
Unlock Higher Tier
```

SP **không dùng trực tiếp để cast skill trong combat**.

Ví dụ:

```text
Stone Throw Lv1
Unlock Cost: 50 SP
```

Sau khi unlock, skill có thể được sử dụng trong combat theo resource của skill, ví dụ:

```text
MP
Energy
Cooldown
```

Không được dùng SP để cast skill trừ khi một skill cụ thể được thiết kế đặc biệt và có định nghĩa riêng.

---

# 8. SKILL TREE PREREQUISITE

Skill Tier cao phải yêu cầu prerequisite.

Ví dụ:

```text
Stone Throw Lv1
Cost: 50 SP
Upgrade: 5 levels
        ↓
Summon Stone Pillar Lv2
Requirement:
- Stone Throw unlocked
- 200 SP
        ↓
Summon Meteor Lv3
Requirement:
- Summon Stone Pillar Lv2
- Fireball Lv2
- 500 SP
```

Hệ thống phải hỗ trợ:

```text
Skill A
↓
Skill B

Skill A + Skill C
↓
Skill D

Skill B + Skill D
↓
Skill E
```

Điều này cho phép xây dựng Skill Tree có chiều sâu.

---

# 9. SKILL UPGRADE

Skill có thể có nhiều Upgrade Level.

Ví dụ:

```text
Stone Throw
Lv1 → Lv2 → Lv3 → Lv4 → Lv5
```

Mỗi lần upgrade có thể tăng:

* Damage
* Healing
* Duration
* Accuracy
* Status Chance
* Effect Strength
* Number of Targets
* Cooldown efficiency
* Resource efficiency

Không bắt buộc mọi skill phải tăng tất cả chỉ số.

---

# 10. SKILL UPGRADE COST

Mỗi lần upgrade phải có cost riêng.

Cost có thể tăng dần:

```text
Upgrade 1
→ low cost

Upgrade 2
→ higher cost

Upgrade 3
→ higher cost

Upgrade 4
→ higher cost
```

Có thể sử dụng điểm SP để UPGRADE skill

Không được khiến player nhầm rằng SP và EXP là cùng một loại progression.

---

# 11. CLASS SKILL LOADOUT

Player có thể unlock nhiều Class Skills nhưng **không mặc định được equip tất cả**.

Phải có:

```text
Unlocked Skills
        ↓
Available Skills
        ↓
Equipped Class Skill Loadout
```

Mục tiêu là tạo build.

Ví dụ:

```text
Tank Build
├── Guard
├── Taunt
├── Shield Wall
└── Counter
```

Trong khi một Tank khác:

```text
Control Tank
├── Taunt
├── Slow
├── Armor Break
└── Damage Reduction
```

Số lượng Class Skill được equip phải là một cấu hình riêng, có thể điều chỉnh về sau.

---

# 12. FINAL SKILL LOADOUT

Combat Animal có:

```text
4 Unique Skills
+
Equipped Class Skills
+
Ultimate
+
Items
+
Equipment
+
Traits
```

Trong đó:

```text
Unique Skills
→ Identity

Class Skills
→ Build / Role

Ultimate
→ High-impact signature combat moment

Equipment
→ Build customization

Traits
→ Passive identity
```

---

# 13. COMBAT RESOURCE

Combat Skill có thể sử dụng:

```text
MP
Energy
Cooldown
```

hoặc kết hợp tùy skill.

Ví dụ:

```text
Basic Skill
→ low MP

Power Skill
→ high MP

Ultimate
→ Rage, KHÔNG dùng MP thông thường
```

SP không phải combat resource.

---

# 14. RAGE SYSTEM

Rage là combat resource dành cho Ultimate.

Mỗi Combat Animal có:

```text
Rage Current
Rage Max
```

Rage tăng dựa trên lượng damage Combat Animal nhận.

Khuyến nghị:

```text
Rage Gain ∝ % Max HP lost
```

Ví dụ:

```text
Combat Animal Max HP = 1000

Nhận 100 damage
→ + Rage tương ứng

Nhận 300 damage
→ + Rage nhiều hơn
```

Không nên chỉ dựa vào số damage tuyệt đối vì Tank có HP cao sẽ bị mất cân bằng.

---

# 15. RAGE PERSISTENCE

Rage có thể:

```text
tích lũy qua nhiều trận
```

theo thiết kế đã định.

Khi Rage đạt:

```text
Rage Max
```

thì:

```text
Rage không tăng thêm
```

Không overflow Rage.

Ví dụ:

```text
Rage: 100 / 100
```

Nhận thêm damage:

```text
Rage vẫn = 100 / 100
```

---

# 16. ULTIMATE

Ultimate là skill đặc biệt sử dụng:

```text
Rage
```

Khi:

```text
Rage >= Rage Max
```

Combat Animal có thể sử dụng Ultimate nếu thỏa các điều kiện khác.

Ultimate không thuộc Class Skill Tree thông thường.

Ultimate phải thể hiện:

* Identity
* Class
* Species
* Theme
* Element
* Personality

Ultimate không nhất thiết chỉ là:

> Damage cực lớn.

Có thể là:

```text
Massive Damage
+
Status
+
Buff
+
Heal
+
Shield
+
Summon
+
Transformation
+
Special Mechanic
```

---

# 17. ULTIMATE RESET

Sau khi Ultimate được sử dụng:

```text
Rage → 0
```

Sau đó Rage bắt đầu tích lũy lại.

Ultimate phải có:

```text
Ultimate ID
Name
Description
Element
Target
Power
Effect
Rage Requirement
Cooldown/Restriction nếu cần
```

---

# 18. NINE-ELEMENT SYSTEM

Hệ thống Element chính thức chỉ có **9 Elements**:

```text
1. Metal / Kim loại
2. Nature / Thiên nhiên
3. Water / Nước
4. Fire / Lửa
5. Earth / Đất
6. Lightning / Sấm
7. Dark / Bóng tối
8. Light / Ánh sáng
9. Void / Neutral / Vô định
```

Tên chuẩn:

```text
Nature / Wood / Thiên nhiên
```

có thể dùng trong UI dưới tên:

```text
Nature
```

hoặc:

```text
Nature / Thiên nhiên
```

nhưng phải thống nhất một ID nội bộ. 

---

# 19. POISON KHÔNG PHẢI ELEMENT

Đây là quy tắc bắt buộc.

**Poison KHÔNG phải Element thứ 10.**

Không được tạo:

```text
Poison Element
```

Hệ thống chỉ có 9 Elements.

Poison là:

```text
Status / Special Effect
```

thuộc nhóm đặc trưng của:

```text
Nature
```

Ví dụ:

```text
Poison Thorn

Element:
Nature

Effect:
Nature Damage
+
Chance to apply Poison
```

Poison Damage có thể được xem là:

```text
Nature-origin Status Damage
```

nhưng không được tham gia Element Matrix như một Element độc lập.

---

# 20. ELEMENT ASSIGNMENT

Combat Animal có thể có:

```text
Primary Element
```

và tùy concept/rarity có thể có:

```text
Secondary Element
```

Không nên cho mọi Combat Animal quá nhiều Element.

Khuyến nghị:

```text
Common
→ 1 Element

Rare
→ 1 Element

Epic
→ có thể 1–2 Elements

Legendary / Special
→ có thể 2 Elements nếu thiết kế yêu cầu
```

Multi-element phải có lý do gameplay/lore rõ ràng.

---

# 21. VOID / NEUTRAL

Void / Neutral là Element đặc biệt.

Nó đại diện cho:

```text
Pure / Neutral Damage
```

Void không phải một Element thông thường dùng để tạo vòng counter bắt buộc.

Mặc định:

```text
Void
→ không bị Strong/Weak theo Element Matrix thông thường
```

Có thể có:

```text
Void Resistance
Void Amplification
```

nếu skill/equipment đặc biệt yêu cầu.

Không được biến Void thành một element "counter tất cả". Cũng cần cân bằng sức mạnh vừa phải cho Void để không bị lạm dụng trong các trận chiến (sử dụng các nguyên tố để counter nhau vẫn sẽ phải là phương án hiệu quả hơn, Void chỉ là giải pháp tạm thời)

---

# 22. ELEMENT MATRIX

Element System phải được data-driven.

Mỗi interaction cần hỗ trợ:

```text
Strong
Weak
Neutral
Resist
Immune
```

Ví dụ data:

```text
Attacker Element
Defender Element
Multiplier
Interaction Type
```

Không hard-code trực tiếp vào UI.

Ví dụ:

```text
Fire → Water = Weak
Water → Fire = Strong
```

Element Matrix phải có thể mở rộng/chỉnh sửa từ data/config.

---

# 23. ELEMENT DAMAGE

Khi Skill có Element:

```text
Final Damage
=
Base Skill Damage
×
Stat Modifier
×
Element Multiplier
×
Other Modifiers
```

Element multiplier phải được áp dụng theo Matrix.

Ví dụ:

```text
Strong
→ increased damage

Weak
→ reduced damage

Neutral
→ normal damage

Resist
→ significantly reduced damage

Immune
→ 0 damage hoặc interaction riêng
```

Giá trị multiplier cụ thể phải nằm trong configuration, không hard-code trong skill logic.

---

# 24. ELEMENT CỦA SKILL

Skill có thể có Element riêng.

Ví dụ:

```text
Fireball
→ Fire

Water Slash
→ Water

Poison Thorn
→ Nature

Metal Crush
→ Metal

Void Strike
→ Void
```

Element của Skill không nhất thiết phải giống Element của Combat Animal.

Ví dụ:

```text
Combat Animal:
Nature

Skill:
Fire
```

vẫn hợp lệ nếu design cho phép.

---

# 25. ELEMENT CỦA EQUIPMENT

Equipment có thể có:

```text
Element Affinity
```

Equipment Affinity có thể:

* Tăng damage của một Element
* Tăng resistance với một Element
* Tăng effectiveness của Skill cùng Element
* Tăng chance gây Status liên quan
* Thay đổi một phần combat behavior
* Tạo special interaction

Ví dụ:

```text
Fire Staff
Element Affinity: Fire

Effect:
+15% Fire Skill Damage
+5% Burn Chance
```

Hoặc:

```text
Nature Ring
Element Affinity: Nature

Effect:
+10% Nature Skill Effect
+5% Poison Application Chance
```

---

# 26. EQUIPMENT AFFINITY KHÔNG THAY ĐỔI ELEMENT GỐC MỘT CÁCH MẶC ĐỊNH

Equipment Affinity chỉ:

```text
Modify / Amplify / Support
```

Element.

Không được tự động biến:

```text
Water Animal
+
Fire Equipment
=
Fire Animal
```

trừ khi một equipment đặc biệt có mechanic rõ ràng:

```text
Element Conversion
```

và mechanic này phải được định nghĩa riêng.

---

# 27. STATUS SYSTEM

Status phải là framework độc lập với Element.

Status có thể có:

```text
Source Element
Duration
Stack
Chance
Damage
Effect
Resistance
Immunity
Cleanse Rule
Expiration Rule
```

Player và Monster đều có thể sử dụng Status.

---

# 28. DAMAGE / DOT STATUS

## Poison

Source:

```text
Nature
```

Effect:

```text
Gây Poison damage ở đầu mỗi lượt
```

Damage có thể dựa trên:

```text
% Max HP
```

Poison:

```text
không phải Element
```

---

## Burn

Source:

```text
Fire
```

Effect:

```text
Gây Fire-based damage ở đầu mỗi lượt.
```

Có thể có duration/stack tùy balancing.

---

# 29. CONTROL STATUS

## Freeze

Effect:

```text
Target không thể thực hiện lượt.
```

Trong thời gian Freeze:

```text
Physical Damage
và/hoặc Fire Damage
→ increased damage
```

Mức multiplier phải là config, ví dụ:

```text
1.5x
hoặc
2.0x
```

Khi target nhận damage phá băng hợp lệ:

```text
Freeze kết thúc
```

Không được vừa Freeze vô hạn vừa nhận bonus damage vô điều kiện.

---

## Stun

```text
Target mất action trong lượt hiện tại.
```

Sau lượt bị Stun:

```text
Status kết thúc
```

trừ khi skill định nghĩa duration khác.

---

## Disable

```text
Skill bị khóa.
```

Target chỉ được:

```text
Attack
Item
Defend / Tactics
```

Disable khác Stun:

```text
Stun
→ mất cả lượt

Disable
→ vẫn được hành động nhưng không được sử dụng Skill
```

---

# 30. DOOM

Doom là high-level special status.

Không phải Element.

Không phải damage thông thường.

Ví dụ:

```text
Doom
Countdown: 3
↓
2
↓
1
↓
0
```

Khi:

```text
Doom = 0
```

target:

```text
Instant KO
```

Doom chủ yếu dành cho:

```text
High-level Monster
Boss
Special Mechanics
```

Player không nên dễ dàng spam Doom.

---

# 31. STAT BUFF / DEBUFF

Hệ thống phải hỗ trợ:

```text
Attack Up
Attack Down

Defense Up
Defense Down

Magic Attack Up
Magic Attack Down

Magic Defense Up
Magic Defense Down

Accuracy Up
Accuracy Down

Evasion Up
Evasion Down

Speed Up
Speed Down
```

---

# 32. RECOVERY STATUS

## Regen

```text
Restore HP
at the start of each turn.
```

## Auto-Revive / Morale

Là special survival effect.

Mặc định:

```text
chỉ nên xuất hiện trong Support Class Skill Tree
```

Khi Combat Animal bị KO:

```text
Auto-Revive triggers
→ restore defined HP
→ consume effect
```

Không cho phép stack vô hạn nếu không có mechanic đặc biệt.

---

# 33. STATUS RESISTANCE

Combat Animal và Monster có thể có:

```text
Status Resistance
Status Immunity
Status Vulnerability
```

Ví dụ:

```text
Poison Resistance: 50%

Stun Resistance: 30%

Burn Immunity: true
```

Status Chance phải được tính dựa trên:

```text
Base Chance
+
Skill Modifier
+
Trait Modifier
+
Equipment Modifier
-
Target Resistance
```

---

# 34. ELEMENT REACTION SYSTEM

Element Reaction là tầng interaction cao hơn Element Matrix.

Không bắt buộc mọi Element đều phải có Reaction.

Reaction được kích hoạt khi:

```text
Element A
+
Element B / Status
```

gặp nhau trong điều kiện phù hợp.

Ví dụ:

```text
Water
+
Lightning
→ Electrified / Shock Reaction
```

hoặc:

```text
Nature
+
Fire
→ Burning Vegetation / special interaction
```

Reaction phải được thiết kế theo data:

```text
Reaction ID
Trigger
Required Elements / Status
Effect
Damage Modifier
Status
Duration
Priority
```

Không hard-code Reaction vào từng skill.

---

# 35. ELEMENT REACTION ≠ ELEMENT MATRIX

Hai hệ thống phải tách biệt.

```text
Element Matrix
→ xác định damage advantage / resistance

Element Reaction
→ tạo special interaction khi các element/status kết hợp
```

Ví dụ:

```text
Fire vs Nature
→ Element Matrix xử lý damage multiplier

Water + Lightning
→ Reaction có thể tạo special effect
```

Một attack có thể đồng thời:

```text
Apply Element Damage
+
Trigger Reaction
+
Apply Status
```

---

# 36. ELEMENT + STATUS SYNERGY

Status có thể có quan hệ với Element.

Ví dụ:

```text
Nature
→ Poison

Fire
→ Burn

Water
→ có thể tạo Wet

Lightning
→ có thể tương tác với Wet

```

Nhưng:

**Không biến các Status thành Element mới.**

Ví dụ:

```text
Poison = Status
Burn = Status
Wet = Status
Freeze = Status
```

không phải:

```text
Poison Element
Burn Element
Wet Element
Freeze Element
```

---

# 37. SKILL EFFECT MODEL

Mỗi Skill nên có data structure tương tự:

```text
Skill
├── ID
├── Name
├── Type
├── Category
├── Element
├── Target
├── Power
├── Accuracy
├── Resource Cost
├── Cooldown
├── Status Effects
├── Status Chance
├── Element Reaction
├── Prerequisites
├── Upgrade Levels
├── SP Cost
├── Animation
└── Description
```

Skill có thể:

```text
Damage
Heal
Buff
Debuff
Shield
Apply Status
Remove Status
Trigger Reaction
Modify Rage
Modify Resource
Summon
Special Mechanic
```

---

# 38. EQUIPMENT DATA MODEL

Equipment nên hỗ trợ:

```text
Equipment
├── ID
├── Name
├── Type
├── Rarity
├── Level
├── Stats
├── Passive
├── Element Affinity
├── Status Affinity
├── Skill Effect Modifier
├── Status Chance Modifier
├── Element Damage Modifier
├── Element Resistance
├── Upgrade Data
└── Requirements
```

Equipment có thể:

```text
+ATK
+DEF
+HP
+Magic Attack
+Magic Defense
+Speed
+Accuracy
+Evasion
```

và:

```text
+Element Damage
+Element Resistance
+Skill Effectiveness
+Status Chance
+Status Resistance
```

---

# 39. EQUIPMENT ↔ SKILL INTERACTION

Equipment có thể tăng hiệu quả Skill theo %.

Ví dụ:

```text
Fire Staff
→ +15% Fire Skill Damage
```

hoặc:

```text
Poison Fang
→ +10% Nature Skill Poison Chance
```

hoặc:

```text
Mage Ring
→ +10% Magic Skill Effect
```

Các modifier phải có giới hạn/balance để tránh stacking vô hạn.

---

# 40. ELEMENTAL BUILD

Player có thể xây dựng build xoay quanh Element.

Ví dụ:

### Fire Build

```text
Fire Animal
+
Fire Skills
+
Fire Equipment
+
Burn Status
```

### Nature Poison Build

```text
Nature Animal
+
Nature Skills
+
Poison Skills
+
Poison-affinity Equipment
```

### Water + Lightning Reaction Build

```text
Water Skill
→ Wet

Lightning Skill
→ Reaction

Reaction
→ Bonus Effect
```

Điều này tạo ra tactical build thay vì chỉ tăng raw stats.

---

# 41. ULTIMATE + ELEMENT

Ultimate có thể có Element.

Ví dụ:

```text
Ultimate
Element: Fire
```

Element Matrix vẫn áp dụng nếu Ultimate gây Element Damage.

Ultimate cũng có thể là:

```text
Void / Neutral
```

nếu design yêu cầu pure damage.

Ultimate có thể trigger:

```text
Status
+
Element Reaction
```

nhưng phải cân bằng vì Ultimate đã là resource-gated skill.

---

# 42. RAGE + DAMAGE TAKEN

Rage gain phải được xử lý sau khi damage cuối cùng được xác định.

Pipeline:

```text
Incoming Attack
        ↓
Element Calculation
        ↓
Defense / Resistance
        ↓
Final Damage
        ↓
Apply Damage
        ↓
Calculate Rage Gain
        ↓
Update Rage
        ↓
Check Ultimate Availability
```

Không tính Rage dựa trên raw damage trước mitigation nếu không có mechanic đặc biệt.

---

# 43. COMBAT RESOLUTION ORDER

Chuẩn hóa combat pipeline:

```text
1. Determine Turn Order

2. Start Turn
   ├── Start-of-turn Status
   ├── DOT
   ├── Regen
   ├── Countdown
   └── Other Start Effects

3. Check Control Status
   ├── Stun
   ├── Freeze
   ├── Disable
   └── Other restrictions

4. Choose Action

5. Validate Resource

6. Resolve Skill / Attack

7. Calculate Base Effect

8. Apply Element Matrix

9. Apply Defense / Resistance

10. Calculate Final Damage

11. Apply Damage / Heal / Shield

12. Apply Status

13. Check Element Reaction

14. Update Rage

15. Check KO

16. Resolve Death / Auto-Revive

17. End Turn Effects

18. Next Turn
```

Thứ tự này phải được ghi rõ trong SPEC để tránh FE/BE implement khác nhau.

---

# 44. ADMIN / DATA-DRIVEN REQUIREMENT

Toàn bộ hệ thống mới phải được thiết kế data-driven.

Admin Dashboard trong tương lai phải có khả năng quản lý:

```text
Class
Skill Tree
Skill
Skill Upgrade
SP Cost
Prerequisite
Element
Element Matrix
Element Reaction
Status
Status Resistance
Equipment
Equipment Affinity
Ultimate
Rage Configuration
```

Không hard-code các bảng balance quan trọng trong UI.

---

# 45. BALANCE RULES

Bắt buộc giữ các nguyên tắc:

### Rule 1

```text
Rarity ≠ Auto Win
```

### Rule 2

```text
Strategy > Raw Stats
```

### Rule 3

```text
SP ≠ EXP
```

### Rule 4

```text
Poison ≠ Element
```

### Rule 5

```text
Void ≠ Universal Counter Element
```

### Rule 6

```text
Ultimate ≠ Class Skill Tree
```

### Rule 7

```text
Equipment Affinity ≠ Automatic Element Conversion
```

### Rule 8

```text
Status ≠ Element
```

### Rule 9

```text
Element Matrix ≠ Element Reaction
```

### Rule 10

Mọi hệ thống phải có thể mở rộng bằng data/config.

---

# 46. KHÔNG ĐƯỢC MÂU THUẪN VỚI SPEC CŨ

Sau khi cập nhật, hãy tìm và xử lý toàn bộ nội dung cũ liên quan tới:

```text
Element
Status
Class Skill Pool
Skill Resource
Skill Upgrade
Equipment
Ultimate
Rage
Combat Pipeline
```

Nếu spec cũ nói:

```text
Fire
Water
Earth
Wind
Light
Dark
Ice
Lightning
```

thì phải thay bằng hệ thống 9 Element mới:

```text
Metal
Nature
Water
Fire
Earth
Lightning
Dark
Light
Void / Neutral
```

Không được để đồng thời hai hệ thống Element.

Nếu spec cũ gọi:

```text
Class Skill Pool
```

thì cập nhật thành:

```text
Class Skill Tree
```

nếu đang nói về progression/unlock/upgrade.

---

# 47. DOCUMENTATION REQUIREMENT

Sau khi cập nhật SPEC:

1. Tạo một section riêng:

```text
COMBAT SYSTEM V2
```

hoặc tổ chức lại các section liên quan nếu hợp lý.

2. Ghi rõ các hệ thống:

```text
Skill Tree
SP
Skill Upgrade
Rage
Ultimate
9 Elements
Element Matrix
Status
Element Reaction
Equipment Affinity
```

3. Thêm data model/example cho từng hệ thống.

4. Thêm combat resolution pipeline.

5. Thêm các dependency/prerequisite quan trọng.

6. Loại bỏ toàn bộ nội dung cũ gây mâu thuẫn.

7. Không tạo duplicate definition của cùng một system ở nhiều nơi nếu có thể.

Nếu một system bắt buộc xuất hiện ở nhiều section, phải có **một định nghĩa chính thức** và các section khác chỉ reference lại.

---

# 48. ACCEPTANCE CHECKLIST

Sau khi cập nhật, tự kiểm tra:

```text
[ ] Party = 3 Combatants
[ ] 4 Unique Skills / Combat Animal
[ ] 1 Class / Combat Animal
[ ] Class Skill Tree
[ ] Skill Tree có Tier
[ ] Skill Tree có Prerequisite
[ ] SP dùng cho Skill Tree
[ ] SP không phải combat resource
[ ] EXP và SP tách biệt
[ ] Skill Upgrade có level
[ ] Skill Upgrade có cost
[ ] Class Skill Loadout riêng
[ ] Rage là resource của Ultimate
[ ] Rage tăng từ damage taken
[ ] Rage dùng % Max HP lost làm cơ sở
[ ] Rage Max không overflow
[ ] Ultimate dùng khi Rage đầy
[ ] Ultimate reset Rage sau khi dùng

[ ] Có đúng 9 Elements
[ ] Metal
[ ] Nature
[ ] Water
[ ] Fire
[ ] Earth
[ ] Lightning
[ ] Dark
[ ] Light
[ ] Void / Neutral

[ ] Poison không phải Element
[ ] Poison thuộc Nature
[ ] Element Matrix riêng
[ ] Strong / Weak / Neutral / Resist / Immune
[ ] Void không phải universal counter

[ ] Status framework độc lập
[ ] Poison
[ ] Burn
[ ] Freeze
[ ] Stun
[ ] Disable
[ ] Doom
[ ] Attack Up/Down
[ ] Defense Up/Down
[ ] Magic Attack Up/Down
[ ] Magic Defense Up/Down
[ ] Accuracy Up/Down
[ ] Evasion Up/Down
[ ] Regen
[ ] Auto-Revive / Morale

[ ] Element Reaction riêng Element Matrix
[ ] Reaction hỗ trợ Element + Status
[ ] Equipment có Element Affinity
[ ] Equipment có thể modify Skill
[ ] Equipment có thể modify Status Chance
[ ] Equipment có thể modify Element Damage/Resistance

[ ] Ultimate hỗ trợ Element
[ ] Ultimate có thể trigger Status
[ ] Ultimate có thể trigger Reaction

[ ] Combat Resolution Order được chuẩn hóa
[ ] Data-driven
[ ] Admin-editable architecture
[ ] Không còn Element System cũ gây conflict
[ ] Không còn Class Skill Pool phẳng gây conflict
[ ] Không có Poison Element
[ ] Không có duplicate/conflicting definitions
```

---

# 49. FINAL INSTRUCTION

Hãy **không chỉ thêm các đoạn text mới vào cuối file**.

Hãy thực sự:

```text
READ CURRENT SPEC
        ↓
IDENTIFY CONFLICTS
        ↓
RESTRUCTURE RELATED SECTIONS
        ↓
MERGE NEW SYSTEMS
        ↓
REMOVE OLD CONFLICTING RULES
        ↓
NORMALIZE TERMINOLOGY
        ↓
ADD DATA MODELS
        ↓
ADD COMBAT PIPELINE
        ↓
RUN CONSISTENCY CHECK
        ↓
UPDATE SPEC
```

Ưu tiên:

```text
Consistency
>
Clear Rules
>
Data-driven Architecture
>
Extensibility
>
Balance
>
Implementation Convenience
```

Kết quả cuối cùng phải là một **Sobi Adventure Gameplay Specification hoàn chỉnh**, trong đó một AI developer khác có thể đọc SPEC và hiểu chính xác:

* Skill được unlock thế nào.
* SP dùng để làm gì.
* EXP dùng để làm gì.
* Skill upgrade hoạt động thế nào.
* Rage hoạt động thế nào.
* Ultimate hoạt động thế nào.
* 9 Elements là gì.
* Element Matrix hoạt động thế nào.
* Poison nằm ở đâu.
* Status hoạt động thế nào.
* Element Reaction hoạt động thế nào.
* Equipment Affinity hoạt động thế nào.
* Combat resolution diễn ra theo thứ tự nào.
* Các hệ thống liên kết với nhau ra sao.

**Không được tự ý thêm Element thứ 10.**
**Không được biến Poison thành Element.**
**Không được dùng SP như MP.**
**Không được để Ultimate trở thành một node Skill Tree thông thường.**
**Không được để Element Matrix và Element Reaction trở thành cùng một hệ thống.**
