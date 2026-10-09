# SOBI CLOUD — GAMEPLAY DESIGN SPEC

## Offline Single-player Cloud Farming & Garden

---

# I. TỔNG QUAN

**Sobi Cloud** là game trồng hoa và xây dựng khu vườn trên những tầng mây thuộc hệ sinh thái **Sobi World**.

Gameplay tập trung vào:

* Trồng và chăm sóc hoa.
* Thu hoạch tài nguyên.
* Thu thập và sưu tầm các loại hoa.
* Rèn chậu hoa.
* Mở rộng các tầng mây.
* Tự động hóa công việc.
* Khám phá hoa hiếm và hoa lai.
* Trang trí khu vườn trên mây.
* Cung cấp tài nguyên cho các game khác trong Sobi World, đặc biệt là **Sobi Adventure**.

Sobi Cloud là game **Offline Single-player**, không yêu cầu kết nối mạng để chơi.

Mục tiêu thiết kế:

> **Relaxing + Collection + Progression + Light Management + Cross-game Ecosystem**

Game không tập trung vào áp lực cạnh tranh hoặc thất bại nghiêm trọng. Người chơi có thể chơi trong thời gian ngắn hoặc quay lại sau nhiều giờ/ngày mà không bị mất toàn bộ tiến trình.

---

# II. VỊ TRÍ CỦA SOBI CLOUD TRONG SOBI WORLD

Sobi Cloud không có Level riêng.

Toàn bộ hệ sinh thái sử dụng **Sobi World Level** chung.

Các khu vực khác nhau đều cung cấp **World EXP**:

```text
Sobi Cloud
Sobi Farm
Sobi Aqua
Sobi Garden
Sobi Adventure
       ↓
   World EXP
       ↓
Sobi World Level
```

Ví dụ:

* Trồng và thu hoạch hoa → World EXP.
* Nuôi heo và hoàn thành hoạt động ở Farm → World EXP.
* Chăm sóc cá ở Aqua → World EXP.
* Hoàn thành hoạt động ở Garden → World EXP.
* Chiến đấu ở Adventure → World EXP.

World Level được sử dụng để mở khóa nội dung trên toàn Sobi World.

### Nguyên tắc

> **Người chơi có thể chơi khu vực mình thích nhưng vẫn tiến triển toàn bộ Sobi World.**

Ví dụ:

Người chơi chủ yếu thích Sobi Adventure vẫn có thể tăng World Level và từ đó mở khóa nội dung mới trong Sobi Cloud.

---

# III. CORE GAMEPLAY LOOP

Vòng lặp chính:

```text
Trồng hoa
   ↓
Chăm sóc
   ├─ Tưới nước
   ├─ Bắt sâu
   └─ Bón phân
   ↓
Hoa phát triển
   ↓
Thu hoạch
   ↓
┌──────────────┬───────────────┬───────────────┐
↓              ↓               ↓
Sobi Coin      Vật phẩm        Nguyên liệu
Hạt giống      Combat Item     Crafting Material
↓              ↓               ↓
Trồng lại      Sobi Adventure  Rèn chậu
                               ↓
                         Chậu tốt hơn
                               ↓
                        Hoa tốt hơn
```

Song song:

```text
Thu hoạch / Hoàn thành hoạt động
          ↓
      World EXP
          ↓
   World Level tăng
          ↓
Mở khóa Cloud Content
```

---

# IV. SOBI WORLD PROGRESSION

## 1. World EXP

Mọi hoạt động hợp lệ trong Sobi Cloud có thể cung cấp World EXP.

Ví dụ:

* Trồng hoa.
* Chăm sóc hoa.
* Thu hoạch hoa.
* Hoàn thành nhiệm vụ.
* Khám phá hoa mới.
* Tạo hoa Hybrid.
* Rèn chậu.
* Hoàn thành các mục tiêu đặc biệt.

EXP phải được cân bằng để tránh người chơi có thể spam một hành động đơn giản nhằm tăng Level quá nhanh.

---

# V. CLOUD AREAS / TẦNG MÂY

Sobi Cloud được chia thành nhiều tầng/khu vực mây.

Mỗi Cloud Area có số lượng slot cố định.

### Cấu trúc mặc định

```text
1 Cloud Area = 10 Flower Slots
```

Mỗi slot:

```text
1 Slot
├── 1 Flower Pot
└── 1 Flower
```

Khi World Level đạt yêu cầu, người chơi có thể mở khóa Cloud Area mới.

Ví dụ:

```text
Cloud Area 1
→ World Lv.1

Cloud Area 2
→ World Lv.5

Cloud Area 3
→ World Lv.10

Cloud Area 4
→ World Lv.15
```

Các mốc Level thực tế phải được cấu hình bằng data, không hard-code.

---

# VI. FLOWER SLOT

Mỗi Flower Slot bao gồm:

* Pot.
* Seed.
* Flower Growth State.
* Water State.
* Fertilizer State.
* Pest State.
* Growth Progress.
* Harvest State.

Slot phải thể hiện trực quan trạng thái hiện tại.

Ví dụ:

```text
Empty
↓
Seeded
↓
Growing
↓
Needs Water
↓
Pest Infested
↓
Growing
↓
Ready to Harvest
```

---

# VII. FLOWER SYSTEM

Hoa được chia thành 3 nhóm chính.

## 1. Economic Flowers

Mục tiêu chính: tạo Sobi Coin.

Khi thu hoạch:

* Sobi Coin.
* Có tỷ lệ nhận lại Seed cùng loại.
* World EXP.

---

## 2. Item Flowers

Mục tiêu chính: tạo vật phẩm hỗ trợ Combat Animal.

Khi thu hoạch:

* Combat Item.
* Combat Material hoặc Enhancement Item.
* World EXP.

Không rơi Seed thông thường nếu thiết kế của flower đó không cho phép.

---

## 3. Material Flowers

Mục tiêu chính: cung cấp nguyên liệu.

Khi thu hoạch:

* Crafting Material.
* Pot Forging Material.
* Có thể có Material dùng cho Sobi Adventure.
* World EXP.

---

# VIII. FLOWER RARITY

Hoa có hệ thống độ hiếm.

Đề xuất:

```text
Common
Uncommon
Rare
Epic
Legendary
Mythic
```

Không bắt buộc mọi loại hoa phải sử dụng đủ tất cả rarity.

Độ hiếm ảnh hưởng đến:

* Growth Time.
* Harvest Value.
* Resource Output.
* Seed Drop.
* Hybrid Potential.
* Collection Value.

Hoa càng hiếm không nhất thiết phải đơn giản là "mọi chỉ số đều cao hơn".

Một số hoa hiếm có thể có:

* Growth rất lâu.
* Output đặc biệt.
* Material độc quyền.
* Khả năng tạo Hybrid đặc biệt.

---

# IX. FLOWER QUALITY

Ngoài Rarity, mỗi lần thu hoạch có thể có **Quality**.

Ví dụ:

```text
Normal
Good
Great
Excellent
Perfect
```

Quality được quyết định dựa trên trạng thái chăm sóc của cây.

Các yếu tố ảnh hưởng:

* Water.
* Fertilizer.
* Pest.
* Pot.
* Weather.
* Growth condition.
* Các bonus đặc biệt.

Quality có thể ảnh hưởng:

* Sobi Coin.
* Quantity of materials.
* Seed drop chance.
* Hybrid chance.
* Special reward.

Ví dụ:

```text
Perfect Flower
→ +30% Harvest Value
→ tăng Material Output
→ tăng cơ hội nhận Seed đặc biệt
```

Quality phải là hệ thống bonus, không khiến người chơi cảm thấy thất bại nếu chỉ nhận Normal.

---

# X. FLOWER GROWTH

Mỗi flower có:

* Base Growth Time.
* Water Requirement.
* Pest Chance.
* Harvest Yield.
* Seed Drop Rate.
* Quality Parameters.

Growth được tính dựa trên thời gian thực.

Ví dụ:

```text
Seeded
→ Growth 0%
→ Growth 25%
→ Growth 50%
→ Growth 75%
→ Ready
```

---

# XI. WATER SYSTEM

Nước là tài nguyên **vô hạn**.

Người chơi không phải mua nước.

Mỗi cây có Water State.

Đề xuất:

```text
100% → Growth ×1.0
50–99% → Growth ×0.8
1–49% → Growth ×0.5
0% → Growth = 0
```

Các giá trị phải được cấu hình bằng data.

Cây không chết vì thiếu nước.

Khi Water = 0:

> Cây chỉ tạm dừng sinh trưởng.

Điều này phù hợp với định hướng relaxing/offline.

---

# XII. PEST / DISEASE SYSTEM

Sâu bệnh là một rủi ro nhẹ.

Mỗi cây có thể xuất hiện sâu tối đa khoảng **1–2 lần trong một vòng đời**, tùy cấu hình flower.

Khi xuất hiện:

```text
Healthy
↓
Pest Appears
↓
Warning
↓
Critical
↓
Plant Damaged
```

Nếu không xử lý trong khoảng **48 giờ**, cây có thể bị hỏng hoàn toàn.

Tuy nhiên:

* Không nên để Pest xuất hiện quá thường xuyên.
* Không nên khiến người chơi cảm thấy bị phạt nặng.
* Automation có thể xử lý Pest.

Có thể cấu hình một số flower đặc biệt có khả năng kháng sâu.

---

# XIII. FERTILIZER

Phân bón được lưu trong Inventory.

Phân bón có thể có nhiều cấp:

```text
Basic Fertilizer
Advanced Fertilizer
Premium Fertilizer
Special Fertilizer
```

Hiệu ứng có thể gồm:

* Giảm Growth Time.
* Tăng Yield.
* Tăng Quality.
* Tăng Seed Drop.
* Tăng Hybrid Chance.

Phân bón không bắt buộc cho việc trồng cây.

Nó là công cụ tối ưu hóa.

---

# XIV. OFFLINE SIMULATION

Sobi Cloud phải hỗ trợ offline progression.

Khi người chơi đóng game:

```text
Last Saved Timestamp
```

được lưu lại.

Khi mở game:

```text
Current Time
      -
Last Saved Time
      ↓
Elapsed Time
      ↓
Offline Simulation
```

Game mô phỏng:

* Flower Growth.
* Water Consumption.
* Pest Chance.
* Fertilizer Duration.
* Weather effects nếu phù hợp.
* Automation.
* Harvest-ready state.

Ví dụ:

```text
22:00
Player plants Flower

↓ Close Game

08:00
Player returns

→ 10 giờ elapsed
→ Flower tiếp tục phát triển
→ Water được tính
→ Automation hoạt động nếu đã mở khóa
```

Nên có giới hạn offline simulation để tránh các giá trị tăng vô hạn.

Ví dụ mặc định:

```text
Maximum Offline Simulation = 24–48 hours
```

Giá trị phải configurable.

---

# XV. WEATHER SYSTEM

Weather là hệ thống tạo biến động tích cực cho gameplay.

Weather không nên phá hủy tiến trình của người chơi.

## 1. Cloud Rain

Hiệu ứng:

* Tự động tưới cây.
* Có thể tăng nhẹ Water Efficiency.

## 2. Strong Sun

Hiệu ứng:

* Growth Speed +20%.
* Water Consumption tăng.

## 3. Fog

Hiệu ứng:

* Tăng Pest Chance.
* Có thể giảm một số Quality Bonus.

## 4. Rainbow

Weather đặc biệt.

Hiệu ứng:

* Harvest Yield tăng.
* Sobi Coin tăng.
* Material Output tăng.
* Có thể tăng Hybrid Chance.

Weather nên tạo cảm giác:

> "Hôm nay có cơ hội đặc biệt."

thay vì:

> "Hôm nay game phạt tôi."

---

# XVI. AUTOMATION SYSTEM

Automation được mở khóa dựa trên **World Level**.

Automation được mua/thuê/nâng cấp theo Cloud Area hoặc hệ thống progression tương ứng.

## 1. Squirrel Watering Assistant

Sóc tự động tưới cây trong một Cloud Area.

Phạm vi:

```text
1 Assistant
→ 1 Cloud Area
→ tối đa 10 slots
```

Có thể nâng cấp:

```text
Basic
→ Advanced
→ Premium
```

---

## 2. Bird Pest Assistant

Chim tự động bắt sâu.

Phạm vi tương tự:

```text
1 Assistant
→ 1 Cloud Area
→ 10 slots
```

---

## 3. Future Automation

Có thể mở rộng:

* Auto Fertilizer.
* Auto Harvest.
* Auto Seed Replant.
* Smart Farming Assistant.

Không nên mở tất cả ngay từ đầu.

Automation phải là phần thưởng cho progression.

---

# XVII. INVENTORY SYSTEM

Inventory lưu trữ toàn bộ vật phẩm ngoại trừ:

* Sobi Coin.
* Water.

### Tabs

```text
Seeds
Pots
Fertilizers & Assistants
Crafting Materials
Combat Items
Special Items
```

Inventory phải có giới hạn sức chứa.

---

# XVIII. INVENTORY CAPACITY

Người chơi có thể dùng **Sobi Coin** để nâng cấp Inventory.

Ví dụ:

```text
Capacity 50
↓
Capacity 75
↓
Capacity 100
↓
Capacity 150
...
```

Không giới hạn cứng số lần nâng cấp nếu hệ thống economy cho phép, nhưng mỗi cấp phải có cost tăng dần.

Inventory expansion là một trong các **Coin Sink** chính.

---

# XIX. POT SYSTEM

Pot là vật phẩm bắt buộc để trồng hoa.

Pot có Rarity:

```text
Common
Uncommon
Rare
Epic
Legendary
Mythic
```

Pot có thể ảnh hưởng:

* Growth Speed.
* Harvest Yield.
* Quality.
* Water Efficiency.
* Hybrid Chance.
* Special Effects.

Không phải Pot hiếm nào cũng phải tăng tất cả chỉ số.

Mỗi Pot nên có identity riêng.

Ví dụ:

```text
Swift Pot
→ Growth Speed

Lucky Pot
→ Seed / Hybrid Chance

Golden Pot
→ Harvest Value

Cloud Pot
→ Water Efficiency
```

---

# XX. POT CRAFTING / FORGING

Pot cấp cao không thể mua trực tiếp từ Shop.

Người chơi phải:

```text
Material Flowers
      ↓
Crafting Materials
      ↓
Pot Recipe
      ↓
Forge Pot
```

Có hỗ trợ:

> **Mass Forging / Rèn Hàng Loạt**

Ví dụ:

```text
Forge ×1
Forge ×5
Forge ×10
Forge Maximum
```

Game phải kiểm tra nguyên liệu trước khi thực hiện.

---

# XXI. FLOWER HYBRID / MUTATION

Đây là hệ thống collection nâng cao.

Một số flower không thể mua trực tiếp từ Shop.

Chúng được tạo bằng Hybrid / Mutation.

Ví dụ:

```text
Red Flower
+
Blue Flower
      ↓
Hybrid Chance
      ↓
Purple Flower
```

Hoặc:

```text
Moon Flower
+
Rainbow Flower
      ↓
Rare Hybrid
```

Mỗi công thức Hybrid có:

* Parent Flowers.
* Required Pot condition nếu có.
* Required Weather nếu có.
* Required Quality nếu có.
* Success Rate.
* Possible Results.

### Nguyên tắc quan trọng

Không được có flower không thể thu thập.

Mọi flower phải có ít nhất một con đường hợp lý để người chơi khám phá và sở hữu.

Hybrid có thể có tỷ lệ:

```text
Common → Common
Common → Uncommon
Uncommon → Rare
Rare → Epic
Epic → Legendary
```

Flower càng hiếm thì điều kiện và tỷ lệ càng khó.

---

# XXII. COLLECTION SYSTEM

Sobi Cloud nên có **Flower Collection Book**.

Người chơi có thể xem:

* Flower đã phát hiện.
* Flower chưa phát hiện.
* Rarity.
* Growth Time.
* Harvest Output.
* Hybrid Recipe nếu đã khám phá.
* Quality Record.
* Highest Quality từng đạt.

Ví dụ:

```text
Flower Collection

[✓] Pink Flower
[✓] Blue Flower
[✓] Golden Flower
[?] Moon Flower
[?] Rainbow Flower
[?] ??? Hybrid
```

Một số thông tin có thể được ẩn cho đến khi người chơi khám phá.

Collection phải tạo cảm giác:

> "Mình muốn mở khóa toàn bộ bộ sưu tập."

---

# XXIII. CLOUD DECORATION

Ngoài việc trồng hoa, người chơi có thể trang trí Cloud Area.

Có thể đặt:

* Cây.
* Đèn.
* Ghế.
* Fountain.
* Windmill.
* Nhà nhỏ.
* Cloud decoration.
* Animal decoration.
* Flower decoration.
* Special structures.

Decoration không nhất thiết ảnh hưởng gameplay.

Mục tiêu:

> **Cho phép người chơi biến Cloud Area thành khu vườn của riêng mình.**

Một số decoration đặc biệt có thể cung cấp bonus nhỏ:

```text
Water Fountain
→ Water Efficiency

Lucky Statue
→ Small Hybrid Bonus

Windmill
→ Small Growth Bonus
```

Bonus phải được cân bằng để decoration không trở thành yêu cầu bắt buộc.

---

# XXIV. WANDERING MERCHANTS

NPC có thể xuất hiện ngẫu nhiên.

Ví dụ:

### Squirrel Merchant

* Mua một số flower với giá cao.
* Bán seed đặc biệt.

### Bird Messenger

* Mang nhiệm vụ hoặc event.

### Special Merchant

* Bán material hiếm.
* Bán decoration giới hạn.
* Bán special seed.

Merchant tạo ra các cơ hội ngắn hạn.

Ví dụ:

```text
Normal Flower Value = 100 Coin

Merchant Offer
→ 250 Coin
```

Người chơi có thể lựa chọn bán hoặc giữ lại.

---

# XXV. CLOUD STAFF / QUALITY OF LIFE TOOLS

Ở World Level cao hơn, người chơi có thể mở khóa các công cụ hỗ trợ.

Ví dụ:

## Cloud Staff

Cho phép:

* Harvest All.
* Water All.
* Fertilize All.
* Plant All.
* Collect All.

Có thể nâng cấp phạm vi:

```text
1 Cloud Area
↓
Multiple Areas
↓
Whole Cloud
```

Mục tiêu:

> Giảm thao tác lặp lại khi người chơi sở hữu nhiều Cloud Area.

---

# XXVI. SHOP SYSTEM

Shop bán:

### Seeds

* Basic Seeds.
* Common Seeds.
* Một số Seeds theo World Level.

### Pots

* Basic Pots.
* Common Pots.
* Một số Pot cơ bản.

### Fertilizers

* Basic.
* Advanced.
* Premium.

### Expansion

* Inventory Expansion.
* Một số tiện ích.

### Không bán trực tiếp

Các vật phẩm quá hiếm nên có nguồn gốc gameplay:

* Legendary Pots.
* Mythic Pots.
* Special Hybrid Flowers.
* Một số Rare Seeds.
* Special Materials.

Điều này giữ giá trị cho gameplay.

---

# XXVII. SOBI COIN ECONOMY

Sobi Coin là currency chung của Sobi World.

Trong Sobi Cloud, Coin được sử dụng cho:

* Mua Seeds.
* Mua Pots cơ bản.
* Mua Fertilizer.
* Upgrade Inventory.
* Unlock Cloud Area.
* Mua Automation.
* Upgrade Automation.
* Một số Decoration.
* Một số Quality of Life features.

### Coin Sink

Game cần nhiều nguồn tiêu Coin để tránh inflation.

Các Coin Sink chính:

```text
Cloud Expansion
Inventory Expansion
Automation
Shop
Decoration
Quality of Life
```

---

# XXVIII. CROSS-GAME INTEGRATION

Sobi Cloud không phải một game độc lập hoàn toàn.

Nó là một nguồn tài nguyên cho Sobi World.

## Cloud → Adventure

Hoa có thể tạo:

* Combat Materials.
* Enhancement Items.
* Equipment Materials.
* Buff Items.
* Special Resources.

Ví dụ:

```text
Rare Flower
↓
Rare Combat Material
↓
Adventure Equipment
```

---

## Adventure → Cloud

Adventure cũng có thể cung cấp:

* Rare Seeds.
* Cloud Materials.
* Special Fertilizer.
* Special Pot Materials.
* Rare Decoration.

Ví dụ:

```text
Adventure Boss
↓
Cloud Crystal
↓
Legendary Pot
```

Điều này tạo vòng lặp hai chiều:

```text
CLOUD
 ↓
Resources
 ↓
ADVENTURE
 ↓
Rare Rewards
 ↓
CLOUD
```

---

# XXIX. CROSS-GAME WORLD EXP

Tất cả hoạt động của Sobi Cloud có thể đóng góp World EXP.

Ví dụ:

```text
Plant Flower
→ +World EXP

Harvest Flower
→ +World EXP

Discover New Flower
→ +World EXP

Create Hybrid
→ +World EXP

Forge Pot
→ +World EXP

Complete Cloud Mission
→ +World EXP
```

World EXP phải được cân bằng để tránh exploit.

---

# XXX. CLOUD MISSIONS

Sobi Cloud có các nhiệm vụ nhẹ.

Ví dụ:

```text
Plant 5 Flowers
Harvest 10 Flowers
Use Fertilizer 3 times
Forge 2 Pots
Discover 1 New Flower
Create 1 Hybrid
Harvest 1000 Coin
```

Reward:

* World EXP.
* Sobi Coin.
* Seeds.
* Materials.
* Fertilizer.
* Special items.

Mission không nên yêu cầu người chơi phải chơi hàng giờ liên tục.

---

# XXXI. DAILY / PERIODIC ACTIVITIES

Do là game offline, không phụ thuộc server.

Có thể sử dụng:

**Daily Local Tasks**

Ví dụ:

```text
Harvest 5 Flowers
Water 10 Plants
Forge 1 Pot
```

Daily reset dựa trên local date.

Không nên thiết kế hệ thống khiến người chơi mất phần thưởng lớn nếu bỏ vài ngày.

Mục tiêu là tạo habit nhẹ, không tạo FOMO mạnh.

---

# XXXII. OFFLINE-FIRST DESIGN PRINCIPLES

Sobi Cloud phải đảm bảo:

* Không cần Internet để chơi.
* Save game local.
* Offline simulation.
* Local progression.
* Không yêu cầu server để tính growth.
* Không yêu cầu online để harvest.
* Không phụ thuộc real-time multiplayer.

Nếu sau này Sobi World có backend/account/cloud save, hệ thống có thể mở rộng nhưng gameplay offline vẫn phải hoạt động độc lập.

---

# XXXIII. SAVE DATA

Save Data tối thiểu phải lưu:

```text
World Level
World EXP

Sobi Coin

Inventory
Inventory Capacity

Cloud Areas
Cloud Slots

Pots
Flowers
Seeds

Flower Growth State
Water State
Pest State
Fertilizer State

Automation
Automation Upgrade

Flower Collection
Hybrid Discovery

Pot Recipes
Crafting Progress

Weather State

Decoration Placement

Quest / Mission Progress

Last Saved Timestamp
```

Data nên được thiết kế theo hướng **data-driven** để dễ chỉnh balance mà không cần sửa logic.

---

# XXXIV. PROGRESSION STRUCTURE

Progression tổng thể:

```text
WORLD LEVEL
     │
     ├── Unlock Cloud Area
     ├── Unlock Flower
     ├── Unlock Pot
     ├── Unlock Crafting
     ├── Unlock Automation
     ├── Unlock Weather
     ├── Unlock Merchant
     ├── Unlock Decoration
     └── Unlock QoL
```

Nhưng mỗi hệ thống chỉ mở khi phù hợp.

Không nên mở quá nhiều tính năng cùng lúc.

---

# XXXV. PLAYER EXPERIENCE PHASES

## Phase 1 — Discover

Người chơi học:

```text
Plant
→ Water
→ Grow
→ Harvest
```

Gameplay cực kỳ đơn giản.

---

## Phase 2 — Optimize

Mở:

* Fertilizer.
* Better Pots.
* More Cloud Areas.
* Inventory Expansion.

Người chơi bắt đầu tối ưu.

---

## Phase 3 — Automate

Mở:

* Squirrel.
* Bird.
* Automation upgrades.

Người chơi chuyển từ thao tác thủ công sang quản lý.

---

## Phase 4 — Collect

Mở:

* Rare Flowers.
* Flower Collection.
* Hybrid.
* Mutation.

Mục tiêu chuyển sang khám phá.

---

## Phase 5 — Master

Mở:

* Legendary Flowers.
* Advanced Pots.
* Advanced Hybrid.
* Weather optimization.
* Merchant.
* Advanced Decoration.
* Cross-game resources.

Người chơi tối ưu Cloud và hỗ trợ các game khác trong Sobi World.

---

# XXXVI. GAMEPLAY PHILOSOPHY

Sobi Cloud phải tuân thủ các nguyên tắc:

### 1. Relaxing

Không ép người chơi online liên tục.

### 2. No Hard Punishment

Cây không nên chết dễ dàng.

Thiếu nước → pause growth.

Pest → có thời gian xử lý.

### 3. Meaningful Progression

Mỗi lần chơi đều đóng góp vào:

* World EXP.
* Coin.
* Collection.
* Resources.
* Cloud Expansion.

### 4. Automation Is Reward

Automation giảm repetitive actions nhưng không được làm game mất hoàn toàn gameplay.

### 5. Collection Is Long-term Goal

Flower, Pot, Hybrid và Decoration tạo mục tiêu dài hạn.

### 6. Cross-game Integration

Resource từ Cloud phải có giá trị trong Sobi World.

### 7. Offline First

Người chơi có thể đóng game và quay lại sau mà progression vẫn hợp lý.

---

# XXXVII. CORE GAMEPLAY SUMMARY

Gameplay hoàn chỉnh:

```text
              SOBI WORLD
                   │
              WORLD LEVEL
                   │
          ┌────────┴────────┐
          │                 │
       WORLD EXP       UNLOCK CONTENT
          │                 │
          │            ┌────┴────┐
          │            │         │
          │        CLOUD AREA  FEATURES
          │
          ↓
      SOBI CLOUD
          │
          ↓
      Plant Seed
          │
          ↓
      Choose Pot
          │
          ↓
      Grow Flower
          │
    ┌─────┼─────┐
    ↓     ↓     ↓
  Water  Pest  Fertilizer
    │     │     │
    └─────┼─────┘
          ↓
       Growth
          ↓
       Quality
          ↓
       Harvest
          │
   ┌──────┼────────┐
   ↓      ↓        ↓
 Coin    Seed    Material
          │        │
          ↓        ↓
       Replant   Craft
                   │
                   ↓
                Better Pot
                   │
                   ↓
              Better Flower
                   │
                   ↓
              More Resources

          + World EXP
          + Collection
          + Hybrid Discovery
          + Cloud Expansion
          + Automation
          + Decoration

          ↓

     SOBI WORLD ECOSYSTEM
          ↕
     SOBI ADVENTURE
          ↕
     OTHER SOBI GAMES
```

---

# XXXVIII. DESIGN GOAL

Sobi Cloud không hướng tới việc trở thành một farming simulator quá phức tạp.

Trải nghiệm mục tiêu là:

> **"Vào game → chăm sóc khu vườn → thu hoạch → thấy tiến triển → mở thêm thứ mới → trang trí → thoát game → quay lại sau và thấy khu vườn vẫn tiếp tục sống."**

Người chơi có thể chơi 5 phút hoặc 30 phút tùy thời gian.

Mỗi lần quay lại đều có khả năng:

* Có hoa đã trưởng thành.
* Có tài nguyên để thu hoạch.
* Có World EXP.
* Có vật phẩm mới.
* Có Hybrid mới để thử.
* Có Cloud Area mới để mở.
* Có Pot mới để rèn.
* Có Decoration mới để đặt.

**Sobi Cloud phải tạo cảm giác đây là một khu vườn nhỏ luôn sống trên bầu trời của Sobi World.**
