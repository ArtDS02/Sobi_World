# UPDATE SPEC --- SOBI AQUARIUM GAMEPLAY V1

> **Document:** `update_spec_sobi_aquarium_gameplay_v1.md`\
> **Project:** Sobi World\
> **Area:** Sobi Aquarium 🐟\
> **Version:** v1.0\
> **Status:** Gameplay Specification\
> **Mode:** Offline / Single-player\
> **Primary progression:** Sobi World Level (shared across all Areas)

------------------------------------------------------------------------

# 1. MỤC TIÊU THIẾT KẾ

Sobi Aquarium là một khu vực mô phỏng hệ sinh thái dưới nước trong Sobi
World.

Người chơi sở hữu và phát triển **một khu đáy đại dương duy nhất**, nơi
nhiều loại sinh vật thủy sinh cùng sinh sống, phát triển, kiếm ăn, sinh
sản và tương tác với môi trường.

Aquarium phải tạo cảm giác:

-   Cute
-   Alive
-   Relaxing
-   Collectible
-   Interactive
-   Expandable
-   Có chiều sâu nhưng không biến thành game mô phỏng khoa học phức tạp

## Nguyên tắc quan trọng

### 1.1 Chỉ có một môi trường nước

Toàn bộ Sobi Aquarium chỉ có:

> **Một khu đáy đại dương duy nhất.**

Không chia thành:

-   Freshwater
-   Saltwater
-   Reef biome
-   Deep sea biome
-   Swamp biome
-   Arctic biome
-   Aquarium tank riêng biệt
-   Exploration map

Các khu vực cát, đá, cây nước, coral, hang động... chỉ là
**habitat/features bên trong cùng một đáy đại dương**, không phải biome
riêng.

### 1.2 Không có hệ thống Water Chemistry phức tạp

Không triển khai:

-   pH
-   Salinity
-   Ammonia
-   Nitrite
-   Nitrate
-   Hardness
-   Water chemistry simulation

Chỉ dùng một số chỉ số môi trường đơn giản, trực quan:

-   Water Cleanliness
-   Oxygen
-   Temperature
-   Ecosystem Stability

### 1.3 Không có Exploration System

Người chơi không đi khám phá nhiều map.

Mọi sinh vật đều sống trong cùng một Ocean Floor.

Việc "khám phá" trong Aquarium được thể hiện thông qua:

-   phát hiện species mới
-   quan sát hành vi
-   breeding
-   mutation
-   research
-   mở rộng khu đáy đại dương
-   phát hiện rare variant

### 1.4 Không có Aquarium Level riêng

Aquarium không có level riêng.

Tất cả XP kiếm được trong Aquarium đều cộng vào:

> **Sobi World XP → Sobi World Level**

Sobi World Level được dùng chung cho:

-   Sobi Farm
-   Sobi Garden
-   Sobi Cloud
-   Sobi Aquarium
-   Sobi Adventure

------------------------------------------------------------------------

# 2. CORE GAMEPLAY LOOP

Gameplay loop chính:

``` text
DISCOVER
   ↓
OBTAIN
   ↓
PLACE ANIMAL
   ↓
FEED / CARE
   ↓
BUILD HABITAT
   ↓
OBSERVE BEHAVIOR
   ↓
BALANCE ECOSYSTEM
   ↓
BREED
   ↓
DISCOVER VARIANTS / MUTATIONS
   ↓
COMPLETE AQUADEX
   ↓
EXPAND OCEAN FLOOR
   ↓
UNLOCK CONTENT
   ↓
GENERATE RESOURCES
   ↓
GAIN SOBI WORLD XP
   ↓
REPEAT
```

Gameplay cần tạo ra hai nhóm hoạt động:

## Active Gameplay

Người chơi chủ động:

-   xây dựng
-   bố trí
-   cho ăn
-   vệ sinh
-   chăm sóc
-   breeding
-   nghiên cứu
-   hoàn thành quest
-   tối ưu ecosystem
-   sưu tầm
-   mở rộng Ocean Floor

## Idle Gameplay

Khi người chơi rời game:

-   animal tiếp tục sinh hoạt
-   animal tiêu thụ thức ăn
-   animal tăng trưởng
-   egg tiếp tục phát triển
-   plant tiếp tục phát triển
-   resource tiếp tục sinh ra
-   ecosystem thay đổi nhẹ theo thời gian

------------------------------------------------------------------------

# 3. OCEAN FLOOR

## 3.1 Cấu trúc

Aquarium sử dụng một scene duy nhất:

> `Ocean Floor`

Có thể mở rộng kích thước theo progression.

Không tạo scene/map mới cho từng biome.

## 3.2 Các habitat bên trong Ocean Floor

Có thể tồn tại:

-   Sandy Bottom
-   Rocky Area
-   Coral Area
-   Plant Area
-   Open Water
-   Small Cave
-   Rock Formation
-   Shallow Area
-   Hiding Area
-   Breeding Area

Các habitat này chỉ là **feature/habitat tag**, không phải biome.

Ví dụ:

``` text
Ocean Floor
├── Sand
├── Rocks
├── Coral
├── Plants
├── Cave
├── Open Water
└── Decorations
```

## 3.3 Mở rộng Ocean Floor

Người chơi có thể mở rộng diện tích.

Expansion giúp:

-   tăng Animal Capacity
-   tăng Habitat Capacity
-   tăng Decoration Capacity
-   mở thêm không gian xây dựng
-   tăng Ecosystem potential
-   mở thêm vị trí breeding
-   tăng khả năng nuôi species hiếm

Expansion không tạo biome mới.

------------------------------------------------------------------------

# 4. AQUATIC ANIMAL SYSTEM

## 4.1 Animal Categories

Aquarium không chỉ có fish.

Có thể có:

### Fish

-   Small Fish
-   Schooling Fish
-   Bottom Fish
-   Predator Fish
-   Rare Fish

### Crustaceans

-   Shrimp
-   Crab
-   Lobster
-   Crayfish

### Mollusks

-   Snail
-   Clam
-   Mussel
-   Octopus
-   Squid

### Marine Creatures

-   Jellyfish
-   Starfish
-   Turtle
-   Seahorse
-   Eel

### Amphibious / Special Aquatic Creatures

Có thể bổ sung các species phù hợp với thế giới Sobi.

### Sobi Original Creatures

Có thể bổ sung:

-   Fantasy Fish
-   Glow Fish
-   Crystal Fish
-   Rainbow Fish
-   Ancient Creature
-   Legendary Sobi Creature

------------------------------------------------------------------------

# 5. ANIMAL DATA MODEL

Mỗi animal nên có dữ liệu tương tự:

``` text
Animal
├── id
├── speciesId
├── name
├── rarity
├── sex
├── age
├── lifeStage
├── level
├── health
├── hunger
├── happiness
├── comfort
├── energy
├── stress
├── growth
├── dietType
├── habitatTags
├── behaviorTags
├── compatibilityTags
├── genetics
├── parentIds
├── birthTime
├── lastUpdateTime
└── state
```

## 5.1 Life Stage

Cơ bản:

``` text
Egg
 ↓
Baby
 ↓
Young
 ↓
Adult
```

Một số species có thể:

``` text
Egg
 ↓
Larva
 ↓
Young
 ↓
Adult
```

------------------------------------------------------------------------

# 6. ANIMAL NEEDS

Animal sử dụng các chỉ số đơn giản.

## 6.1 Hunger

Hunger tăng theo thời gian.

Hunger cao:

-   animal tìm thức ăn
-   giảm Happiness
-   giảm Comfort
-   tăng Stress
-   cuối cùng ảnh hưởng Health

Không để animal chết quá nhanh.

## 6.2 Health

Health bị ảnh hưởng bởi:

-   Hunger quá cao
-   môi trường xấu
-   Oxygen thấp
-   Temperature không phù hợp
-   Stress cao
-   bệnh/event nếu có

## 6.3 Happiness

Happiness tăng khi:

-   đủ thức ăn
-   habitat phù hợp
-   có companion phù hợp
-   môi trường ổn định
-   có không gian sống phù hợp

## 6.4 Comfort

Comfort phụ thuộc:

-   habitat
-   shelter
-   plants
-   rocks
-   hiding spots
-   population density

## 6.5 Energy

Animal sử dụng Energy khi:

-   bơi
-   kiếm ăn
-   tương tác
-   breeding

Animal phục hồi Energy khi:

-   resting
-   sleep/idle state

## 6.6 Stress

Stress tăng khi:

-   môi trường xấu
-   overcrowding
-   predator ở gần
-   habitat không phù hợp
-   thiếu thức ăn

Stress cao làm:

-   giảm Happiness
-   giảm breeding chance
-   giảm Health theo thời gian

## 6.7 Growth

Growth thể hiện tiến trình phát triển tới life stage tiếp theo.

------------------------------------------------------------------------

# 7. ANIMAL AI & BEHAVIOR

Animal không được chỉ đứng yên hoặc chạy ngẫu nhiên.

Mỗi species có behavior profile.

## 7.1 Behavior Tags

Ví dụ:

-   Schooling
-   Solitary
-   BottomDweller
-   FreeSwimmer
-   SurfaceDweller
-   CaveDweller
-   Hider
-   Territorial
-   Predator
-   Peaceful
-   Nocturnal
-   FilterFeeder
-   Cleaner

## 7.2 Basic AI Priority

Có thể dùng priority đơn giản:

``` text
Critical Need
    ↓
Find Food
    ↓
Find Shelter
    ↓
Find Compatible Area
    ↓
Social / Species Behavior
    ↓
Wander
    ↓
Rest
```

## 7.3 Schooling

Một số fish có thể:

-   bơi thành nhóm
-   đổi hướng cùng nhau
-   tách nhóm
-   regroup

Không cần simulation vật lý phức tạp.

## 7.4 Territorial Behavior

Một số species có vùng hoạt động.

Nếu overcrowding:

-   Stress tăng
-   Happiness giảm
-   breeding giảm

## 7.5 Predator Behavior

Predator có thể tạo áp lực ecosystem.

Tuy nhiên:

> Aquarium không phải survival game.

Predator không nên liên tục giết animal.

Có thể dùng:

-   intimidation
-   chase
-   stress
-   food-chain pressure

thay vì death thường xuyên.

------------------------------------------------------------------------

# 8. FEEDING SYSTEM

## 8.1 Food Types

### Basic Food

Thức ăn phổ thông.

### Plant Food

Dùng cho:

-   herbivore
-   một số omnivore

### Meat Food

Dùng cho:

-   carnivore
-   predator

### Special Food

Thức ăn đặc biệt:

-   tăng growth
-   tăng happiness
-   hỗ trợ breeding
-   tăng mutation chance
-   event food

## 8.2 Diet Types

Mỗi species có:

-   Herbivore
-   Carnivore
-   Omnivore
-   Detritivore
-   Filter Feeder

## 8.3 Feeding Behavior

Animal có thể:

-   tự tìm food
-   bơi tới food
-   tranh food
-   ăn theo group
-   ăn dưới đáy
-   ăn trong nước
-   ăn gần plant

## 8.4 Overfeeding

Cho ăn quá nhiều:

-   food waste tăng
-   Water Cleanliness giảm
-   ecosystem stability giảm

Điều này tạo incentive để người chơi cho ăn hợp lý.

## 8.5 Auto Feeding

Có thể mở khóa:

> Auto Feeder

Auto Feeder tự động cung cấp food theo lịch.

Upgrade Auto Feeder có thể:

-   tăng capacity
-   tăng frequency
-   hỗ trợ nhiều food type
-   giảm waste

------------------------------------------------------------------------

# 9. CLEANER ANIMALS

Một số animal có utility ecosystem.

Ví dụ:

-   Shrimp
-   Snail
-   Bottom Feeder
-   Detritivore

Chúng có thể:

-   ăn leftover food
-   giảm waste
-   giảm algae
-   hỗ trợ Cleanliness

Điều này khiến Common animal vẫn có giá trị.

Rarity không đồng nghĩa với usefulness tuyệt đối.

------------------------------------------------------------------------

# 10. ENVIRONMENT SYSTEM

Aquarium chỉ dùng các chỉ số môi trường dễ hiểu.

## 10.1 Water Cleanliness

Phản ánh độ sạch.

Giảm bởi:

-   waste
-   overfeeding
-   quá nhiều animal
-   một số species

Tăng bởi:

-   cleaning
-   filtration
-   cleaner animals
-   equipment

## 10.2 Oxygen

Phản ánh oxygen availability.

Tăng bởi:

-   Oxygen System
-   plants
-   một số equipment

Giảm khi:

-   animal population quá cao
-   ecosystem mất cân bằng

## 10.3 Temperature

Mỗi species có temperature preference.

Không mô phỏng nhiệt độ phức tạp.

Chỉ cần:

``` text
Cold
Normal
Warm
```

hoặc một range đơn giản.

## 10.4 Ecosystem Stability

Đây là chỉ số tổng hợp.

Phụ thuộc:

-   Cleanliness
-   Oxygen
-   Temperature
-   Animal Comfort
-   Habitat Quality
-   Population Balance

------------------------------------------------------------------------

# 11. KHÔNG CÓ WATER CHEMISTRY

Không triển khai:

``` text
pH
Salinity
Ammonia
Nitrite
Nitrate
Hardness
Mineral Chemistry
Complex Water Simulation
```

Mục tiêu là:

> Người chơi quản lý một ecosystem dễ hiểu, không phải học vận hành hồ
> cá thực tế.

------------------------------------------------------------------------

# 12. ANIMAL COMPATIBILITY

Mỗi species có compatibility tags:

-   Peaceful
-   Friendly
-   Neutral
-   Territorial
-   Predator

Ví dụ:

``` text
Fish A
→ Peaceful

Fish B
→ Friendly

Fish C
→ Territorial

Fish D
→ Predator
```

Khi đặt species không phù hợp, game nên cảnh báo:

> "These animals may not live well together."

Không nên tự động ngăn người chơi trong mọi trường hợp.

------------------------------------------------------------------------

# 13. SIMPLE FOOD CHAIN

Có thể mô phỏng food chain ở mức nhẹ:

``` text
Plants
   ↓
Shrimp / Herbivore
   ↓
Small Fish
   ↓
Predator
```

Food chain chỉ tạo:

-   ecosystem flavor
-   compatibility
-   behavior
-   resource balancing

Không biến thành hardcore simulation.

------------------------------------------------------------------------

# 14. ANIMAL DEATH

Death phải là trường hợp hiếm.

Không nên:

``` text
Bad Water → Instant Death
```

Thay vào đó:

``` text
Bad Condition
    ↓
Warning
    ↓
Stress
    ↓
Health Reduction
    ↓
Severe Condition
    ↓
Possible Death
```

UI phải cảnh báo trước.

Mục tiêu là để người chơi cảm thấy:

> "Mình cần chăm sóc ecosystem."

Không phải:

> "Game đang phạt mình."

------------------------------------------------------------------------

# 15. BREEDING SYSTEM

Breeding là hệ thống long-term progression quan trọng.

## 15.1 Điều kiện

Breeding cần:

-   Adult
-   Healthy
-   Compatible Partner
-   Suitable Habitat
-   Enough Comfort
-   Enough Energy
-   Suitable breeding condition

## 15.2 Breeding Flow

``` text
Adult Animal
      +
Compatible Partner
      ↓
Breeding
      ↓
Egg
      ↓
Growth
      ↓
Baby
      ↓
Young
      ↓
Adult
```

## 15.3 Breeding Facility

Có thể sử dụng:

> Breeding Habitat / Breeding Facility

để tăng:

-   breeding success
-   breeding speed
-   breeding capacity
-   special breeding options

------------------------------------------------------------------------

# 16. GENETICS SYSTEM

Genetics dùng để tạo variation.

Các gene có thể gồm:

``` text
Color
Pattern
Body Size
Fin Shape
Tail Shape
Eye Type
Shell Pattern
Glow
Special Trait
```

Không cần triển khai genetic simulation quá phức tạp ở MVP.

## 16.1 Genetic Inheritance

Con có thể kế thừa:

-   color từ parent A
-   pattern từ parent B
-   size từ cả hai
-   random mutation

Ví dụ:

``` text
Parent A: Blue
Parent B: Yellow

Child:
→ Blue
→ Yellow
→ Green
→ Rare variant
```

------------------------------------------------------------------------

# 17. MUTATION SYSTEM

Mutation tạo các biến thể hiếm.

Ví dụ:

-   Glow Fish
-   Rainbow Fish
-   Crystal Fish
-   Pearl Fish
-   Giant Variant
-   Mini Variant
-   Ancient Variant

Mutation chance phụ thuộc:

-   parent genetics
-   rarity
-   breeding condition
-   special food
-   special habitat
-   event
-   special item

Không nên để mutation quá thường xuyên.

------------------------------------------------------------------------

# 18. RARITY SYSTEM

Rarity:

``` text
Common
Uncommon
Rare
Epic
Mythic
Legendary
```

Rarity phản ánh:

-   visual uniqueness
-   collection value
-   breeding difficulty
-   discovery difficulty
-   ecosystem effect
-   special trait

Không mặc định:

> Legendary = mạnh hơn.

Aquarium không tập trung vào combat power.

------------------------------------------------------------------------

# 19. AQUADEX

Aquadex là collection system chính.

Mỗi entry chứa:

-   species name
-   rarity
-   image
-   description
-   habitat preference
-   diet
-   behavior
-   discovered status
-   breeding status
-   mutation status
-   variants collected

## 19.1 Discovery Progress

Ví dụ:

``` text
Fish
12 / 30 discovered

Shrimp
4 / 8 discovered

Crustacean
5 / 12 discovered
```

## 19.2 Variant Collection

Một species có thể có:

``` text
Normal
Rare Color
Glow
Rainbow
Crystal
Ancient
```

------------------------------------------------------------------------

# 20. ANIMAL ACQUISITION

Animal có thể nhận được từ:

### Shop

Mua bằng:

-   Coins
-   Pearls
-   special currency

### Breeding

Sinh từ parent.

### Mutation

Biến thể hiếm.

### Events

Event-limited creatures.

### Research

Unlock bằng Research.

### Cross-Area

Một số creature hoặc egg được nhận từ Area khác.

### World Level

Một số species unlock theo Sobi World Level.

------------------------------------------------------------------------

# 21. OCEAN FLOOR BUILDING

## 21.1 Terrain

Có thể đặt:

-   Sand
-   Rock
-   Rock Formation
-   Small Cliff
-   Coral Structure

## 21.2 Habitat Objects

-   Cave
-   Plant
-   Coral
-   Hiding Spot
-   Breeding Spot
-   Nest
-   Shelter

## 21.3 Decorations

-   Shipwreck
-   Treasure
-   Ancient Ruins
-   Pearl Shrine
-   Sobi Decorations
-   Fantasy Decorations

Decorations chủ yếu phục vụ:

-   visual customization
-   happiness
-   comfort
-   collection
-   ecosystem bonus nếu phù hợp

------------------------------------------------------------------------

# 22. EQUIPMENT SYSTEM

Equipment chính:

## Filter

Tăng:

-   Cleanliness
-   ecosystem stability

## Oxygen System

Tăng:

-   Oxygen

## Temperature System

Giữ:

-   Temperature ổn định

## Auto Feeder

Tự động cho ăn.

## Breeding Facility

Hỗ trợ breeding.

## Research Station

Tăng hiệu quả Research.

Equipment có thể upgrade:

``` text
Lv1
Lv2
Lv3
Lv4
Lv5
```

Upgrade có thể tăng:

-   capacity
-   efficiency
-   speed
-   stability
-   range

------------------------------------------------------------------------

# 23. RESEARCH SYSTEM

Research là progression system phụ.

Không tạo level riêng cho Aquarium.

## Research Data

Người chơi nhận Data từ:

-   discover species
-   breed
-   discover mutation
-   observe behavior
-   ecosystem objectives
-   collection milestones
-   quests

## Research Unlocks

Có thể unlock:

-   new species
-   food
-   equipment
-   habitat objects
-   breeding options
-   decorations
-   mutation mechanics

------------------------------------------------------------------------

# 24. QUEST SYSTEM

Quest được chia:

## Daily Quest

Ví dụ:

-   Feed 5 animals
-   Clean Aquarium
-   Collect Pearl
-   Observe animal

## Animal Quest

-   Raise 3 fish to Adult
-   Keep 5 animals healthy

## Breeding Quest

-   Breed 1 pair
-   Discover a rare offspring

## Ecosystem Quest

-   Maintain 90% Cleanliness
-   Maintain high Oxygen

## Collection Quest

-   Discover 10 species
-   Complete a family

## Research Quest

-   Earn Research Data
-   Unlock research

Quest cho:

-   Coins
-   Pearl
-   Research Data
-   Food
-   Egg
-   Materials
-   Sobi World XP

------------------------------------------------------------------------

# 25. RESOURCE SYSTEM

Main resources:

``` text
Pearl
Shell
Coral
Seaweed
Aquatic Material
Fish Product
Aqua Essence
Special Egg
```

## 25.1 Pearl

Pearl là signature resource của Aquarium.

Dùng cho:

-   expansion
-   equipment upgrade
-   special decorations
-   research
-   special breeding
-   trading

Possible variants:

``` text
Pearl
Rare Pearl
Rainbow Pearl
Ancient Pearl
Legendary Pearl
```

## 25.2 Resource Generation

Resource có thể đến từ:

-   animals
-   plants
-   breeding
-   harvesting
-   quests
-   events
-   ecosystem milestones

------------------------------------------------------------------------

# 26. CROSS-AREA ECONOMY

Sobi Aquarium phải kết nối với Sobi World.

## Sobi Farm → Aquarium

Có thể cung cấp:

-   food ingredients
-   organic materials
-   insects
-   special feed

## Sobi Garden → Aquarium

Có thể cung cấp:

-   plants
-   seeds
-   herbs
-   aquatic plant materials

## Sobi Cloud → Aquarium

Có thể cung cấp:

-   rainwater
-   weather materials
-   cloud resources

## Sobi Adventure → Aquarium

Có thể cung cấp:

-   rare materials
-   ancient artifacts
-   special eggs
-   unique crafting materials

## Aquarium → Other Areas

Có thể cung cấp:

-   Pearl
-   Shell
-   Coral
-   Seaweed
-   aquatic plants
-   aquatic materials
-   rare fish materials

Cross-Area resource flow nên tạo cảm giác:

> Các Area là những phần của cùng một thế giới.

------------------------------------------------------------------------

# 27. SOBI WORLD XP

Không tạo:

``` text
Aquarium Level
```

Thay vào đó:

``` text
Aquarium Action
      ↓
Sobi World XP
      ↓
Sobi World Level
```

XP có thể nhận từ:

-   Feed animal
-   Discover species
-   Breed
-   Discover mutation
-   Complete Aquadex entry
-   Build habitat
-   Complete quest
-   Maintain ecosystem
-   Research
-   Expand Ocean Floor
-   Event objectives

World Level unlock content cho toàn Sobi World.

Ví dụ:

``` text
World Level 5
→ Aquarium equipment

World Level 8
→ New fish

World Level 12
→ New breeding option

World Level 20
→ Rare creature
```

------------------------------------------------------------------------

# 28. OFFLINE PROGRESSION

Sobi Aquarium phải hỗ trợ offline progression.

Khi người chơi đóng game:

-   animals continue growth
-   eggs continue progress
-   plants continue growth
-   resources accumulate
-   food is consumed
-   ecosystem changes
-   equipment continues operating

## Offline Cap

MVP có thể giới hạn:

> 8 giờ offline progression.

Khi mở lại game:

``` text
Offline Duration
      ↓
Calculate Simulation
      ↓
Update Animals
      ↓
Update Plants
      ↓
Update Resources
      ↓
Update Ecosystem
      ↓
Show Summary
```

Ví dụ:

> "While you were away: - 3 fish grew - 2 eggs progressed - 120 Seaweed
> collected - 15 Pearl generated - Water Cleanliness decreased by 3%"

------------------------------------------------------------------------

# 29. ECOSYSTEM SCORE

Ecosystem Score là chỉ số tổng hợp.

Có thể dựa trên:

``` text
Cleanliness
+
Oxygen
+
Animal Comfort
+
Habitat Quality
+
Population Balance
+
Stability
```

Không dùng score để ép người chơi phải đạt 100%.

Score chủ yếu dùng cho:

-   feedback
-   quests
-   achievements
-   rewards
-   progression

------------------------------------------------------------------------

# 30. AQUARIUM RANK --- OPTIONAL

Có thể có Aquarium achievement rank nhưng **không phải Level**.

Ví dụ:

``` text
Novice Aquarist
      ↓
Aquatic Keeper
      ↓
Aquarium Expert
      ↓
Ecosystem Master
      ↓
Aqua Researcher
```

Rank có thể dựa trên:

-   species discovered
-   breeding count
-   ecosystem score
-   research
-   collection

Rank không thay thế Sobi World Level.

------------------------------------------------------------------------

# 31. EVENTS

Event diễn ra ngay trên Ocean Floor hiện tại.

Không tạo event map riêng.

Ví dụ:

## Rainbow Tide

Xuất hiện:

-   Rainbow Fish
-   Rainbow Pearl
-   special decoration

## Pearl Festival

Tăng Pearl generation.

## Jellyfish Bloom

Jellyfish xuất hiện nhiều hơn.

## Turtle Season

Tăng cơ hội gặp Turtle.

## Sobi Ocean Festival

Event lớn với:

-   special creature
-   decoration
-   food
-   quest chain
-   limited rewards

------------------------------------------------------------------------

# 32. ANIMATION & LIVING WORLD

Aquarium phải có cảm giác sống.

Animal animation:

-   swim
-   turn
-   idle
-   eat
-   rest
-   hide
-   interact
-   breed
-   school
-   chase
-   escape

Environmental animation:

-   water movement
-   plants sway
-   bubbles
-   coral movement
-   particles
-   light rays
-   floating particles

Rare animals có thể có:

-   special idle
-   glow
-   particle effect
-   unique movement

Animation không cần phức tạp về kỹ thuật; ưu tiên cảm giác sống động và
nhất quán.

------------------------------------------------------------------------

# 33. UI/UX

UI phải dễ hiểu.

## Main HUD

Nên hiển thị:

``` text
Sobi World Level
Coins
Pearls
Ecosystem Status
Animal Count
Food
```

## Animal Interaction

Click animal:

``` text
Name
Rarity
Age
Life Stage
Health
Hunger
Happiness
Comfort
Energy
Stress
Diet
Habitat
Behavior
```

## Environment Panel

``` text
Water Cleanliness
Oxygen
Temperature
Ecosystem Stability
```

## Main Menus

-   Animals
-   Aquadex
-   Shop
-   Build
-   Breeding
-   Research
-   Quests
-   Storage
-   Equipment
-   Settings

------------------------------------------------------------------------

# 34. PLAYER FEEDBACK

Game phải ưu tiên visual feedback.

Ví dụ:

### Hunger

Animal xuất hiện biểu tượng food.

### Low Oxygen

Hiển thị:

> Oxygen is getting low.

### Dirty Water

Nước chuyển trạng thái visual nhẹ.

### Breeding Ready

Hiển thị:

> Ready to breed

### Rare Mutation

Có:

-   special animation
-   popup
-   sound
-   visual effect

### New Species

Aquadex notification:

> New species discovered!

------------------------------------------------------------------------

# 35. ACHIEVEMENTS

Ví dụ:

## First Fish

Acquire first aquatic animal.

## Animal Keeper

Raise 10 animals.

## Collector

Discover 25 species.

## Geneticist

Discover 5 mutations.

## Breeder

Breed 25 animals.

## Ecosystem Master

Maintain high ecosystem stability.

## Ocean Designer

Build a highly developed Ocean Floor.

## Aqua Researcher

Complete major research milestones.

Achievements có thể thưởng:

-   World XP
-   Pearl
-   Coins
-   Decorations
-   Titles

------------------------------------------------------------------------

# 36. ENDGAME

Endgame không phải combat.

Các mục tiêu dài hạn:

### Collection Mastery

Hoàn thành Aquadex.

### Breeding Mastery

Tìm:

-   rare genetics
-   mutations
-   special variants

### Ecosystem Mastery

Tạo Ocean Floor cân bằng.

### Building Mastery

Trang trí và tối ưu layout.

### Research Mastery

Hoàn thành Research Tree.

### World Progression

Tiếp tục tăng:

> Sobi World Level

### Legendary Creatures

Sưu tầm các creature cực hiếm.

------------------------------------------------------------------------

# 37. GAMEPLAY PILLARS

Sobi Aquarium có 5 gameplay pillars:

## 1. Animal Collection

Sưu tầm nhiều aquatic animals.

## 2. Ocean Floor Building

Thiết kế một đáy đại dương riêng.

## 3. Breeding & Mutation

Tạo offspring và rare variants.

## 4. Living Ecosystem

Animal và môi trường thực sự hoạt động.

## 5. Sobi World Integration

Resource và progression kết nối toàn bộ Sobi World.

------------------------------------------------------------------------

# 38. MVP SCOPE

MVP nên tập trung vào core loop.

## Required

1.  One Ocean Floor scene
2.  Basic Ocean Floor expansion
3.  5--10 animal species
4.  Animal movement AI
5.  Hunger
6.  Health
7.  Happiness
8.  Basic habitat preference
9.  Feeding
10. Basic food types
11. Water Cleanliness
12. Oxygen
13. Temperature
14. Basic plants
15. Basic decorations
16. Basic equipment
17. Aquadex
18. Basic breeding
19. Sobi World XP integration
20. Basic offline progression
21. Basic resource generation
22. Basic quests

## MVP chưa cần

-   complex genetics
-   advanced mutation tree
-   advanced research tree
-   complex predator simulation
-   large event system
-   dozens of species
-   complicated equipment
-   advanced ecosystem simulation

------------------------------------------------------------------------

# 39. POST-MVP ROADMAP

## Phase 2 --- Living Ecosystem

-   more species
-   schooling
-   territorial behavior
-   predator behavior
-   cleaner animals
-   better habitat effects

## Phase 3 --- Breeding

-   genetics
-   inherited traits
-   mutations
-   rare variants
-   breeding facilities

## Phase 4 --- Research

-   Research Data
-   research tree
-   species unlock
-   special equipment
-   special habitats

## Phase 5 --- Expansion

-   larger Ocean Floor
-   advanced decorations
-   more habitat objects
-   more ecosystem interactions

## Phase 6 --- Events

-   seasonal events
-   limited species
-   special resources
-   event quests

## Phase 7 --- Sobi Integration

-   deeper Farm integration
-   Garden integration
-   Cloud integration
-   Adventure integration
-   unique cross-area recipes

## Phase 8 --- Legendary Content

-   Legendary creatures
-   Ancient variants
-   special mutations
-   rare Sobi aquatic creatures

------------------------------------------------------------------------

# 40. DATA ARCHITECTURE PRINCIPLES

Gameplay data nên được data-driven.

Không hard-code species logic trong UI.

Recommended structure:

``` text
animals/
├── species
├── rarity
├── diets
├── habitats
├── behaviors
├── genetics
├── mutations
└── breedingRules

aquarium/
├── food
├── equipment
├── habitats
├── decorations
├── resources
├── research
├── quests
└── events
```

Mỗi species nên có cấu hình riêng.

Ví dụ:

``` json
{
  "id": "fish_blue_001",
  "rarity": "common",
  "dietType": "herbivore",
  "habitatTags": ["open_water", "plant_area"],
  "behaviorTags": ["schooling", "peaceful"],
  "temperature": "normal"
}
```

------------------------------------------------------------------------

# 41. SAVE DATA

Save data cần lưu tối thiểu:

``` text
Ocean Floor Layout
Expansion Level
Animals
Animal Stats
Animal Genetics
Animal Parents
Eggs
Plants
Resources
Food Storage
Equipment
Equipment Levels
Aquadex
Research
Quests
Achievements
Event Progress
Last Save Timestamp
```

Offline simulation phải dựa vào:

``` text
lastSaveTimestamp
```

Không lưu từng frame simulation.

------------------------------------------------------------------------

# 42. PERFORMANCE PRINCIPLES

Do game chạy offline/single-player:

-   Không cần server simulation.
-   Không cần real-time multiplayer.
-   Không cần authoritative backend.
-   Không cần network synchronization.

AI nên tối ưu bằng:

-   simplified behavior states
-   distance checks
-   update intervals
-   capped population
-   pooled effects
-   event-driven updates

Không update mọi animal ở full frequency mỗi frame nếu không cần thiết.

------------------------------------------------------------------------

# 43. DESIGN GUARDRAILS

Trong quá trình triển khai, phải giữ các nguyên tắc sau:

### Không thêm nhiều aquarium maps

Aquarium chỉ có:

> One Ocean Floor.

### Không thêm Aquarium Level

Progression dùng:

> Sobi World Level.

### Không thêm pH

Không triển khai water chemistry.

### Không thêm Exploration Map

Discovery chỉ là gameplay progression.

### Không biến Aquarium thành combat game

Combat thuộc Sobi Adventure.

### Không biến Aquarium thành hardcore simulator

Các hệ thống phải đơn giản, dễ hiểu.

### Không để rarity quyết định mọi thứ

Common animals vẫn phải có giá trị.

### Không làm death quá thường xuyên

Animal death là hậu quả nghiêm trọng và hiếm.

------------------------------------------------------------------------

# 44. COMPLETE PLAYER EXPERIENCE

Một người chơi mới nên trải nghiệm:

``` text
START
 ↓
Receive first aquatic animal
 ↓
Place it in Ocean Floor
 ↓
Learn feeding
 ↓
Build basic habitat
 ↓
Discover second species
 ↓
Expand Ocean Floor
 ↓
Build basic filter
 ↓
Maintain Cleanliness/Oxygen
 ↓
Breed first animals
 ↓
Discover baby
 ↓
Grow collection
 ↓
Unlock Research
 ↓
Discover rare variant
 ↓
Expand ecosystem
 ↓
Connect Aquarium resources with other Sobi Areas
 ↓
Increase Sobi World Level
 ↓
Unlock new content
 ↓
Build personal Ocean Floor
 ↓
Complete Aquadex
 ↓
Master breeding/mutation/ecosystem
```

------------------------------------------------------------------------

# 45. FINAL GAMEPLAY DEFINITION

**Sobi Aquarium** là một **offline aquatic ecosystem simulation +
collection + breeding game** diễn ra trong **một Ocean Floor duy nhất**.

Người chơi:

-   xây dựng đáy đại dương
-   nuôi nhiều loại aquatic animals
-   cho ăn
-   chăm sóc
-   quan sát behavior
-   duy trì ecosystem
-   breeding
-   khám phá genetics
-   tạo mutation
-   sưu tầm Aquadex
-   nghiên cứu
-   mở rộng Ocean Floor
-   thu thập resources
-   tham gia events
-   kết nối resources với các Area khác
-   tăng Sobi World XP

Toàn bộ progression cuối cùng quy về:

> **Sobi World Level**

Mục tiêu thiết kế cuối cùng:

> **Một khu đáy đại dương duy nhất nhưng luôn có cảm giác đang sống,
> phát triển và thay đổi.**

Game nên khiến người chơi muốn mở game mỗi ngày không phải vì bị ép làm
nhiệm vụ, mà vì muốn xem:

> **"Hôm nay trong đại dương của mình có chuyện gì mới?"**
