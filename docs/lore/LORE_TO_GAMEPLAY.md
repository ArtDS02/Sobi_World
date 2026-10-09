# LORE → GAMEPLAY — Tầng dùng chung của Sobi World

**Phiên bản:** 1.0 · **Nguồn lore:** `lore/Lore_Sobi_World.md`
**Áp dụng cho:** Sobi Garden, Sobi Aquarium, Sobi Cloud (và mở rộng sang Farm, Adventure)

Tài liệu này giữ **những thứ dùng chung cho nhiều Area**, để ba spec Area không phải định nghĩa lại
cùng một hệ thống ba lần (lỗi mà audit đã ghi nhận: thương nhân, nhiệm vụ hằng ngày, túi đồ, trần offline
đều đang được định nghĩa lặp ở từng file).

Thứ tự ưu tiên khi mâu thuẫn: `SOBI_WORLD_PROJECT_SPEC_V2.md` > tài liệu này > spec từng Area.

---

## 1. Lore cho người thiết kế — bản rút gọn

| Khái niệm | Là gì | Dùng trong gameplay |
|---|---|---|
| **Lumina** | Tia sáng đầu tiên, cho sự sống khả năng phát triển | Lý do mọi thứ lớn lên được. Không phải tài nguyên. |
| **Sobi Essence** | Dòng máu của thế giới. Mọi sinh vật mang một phần | **Tài nguyên meta dùng chung** (mục 3) |
| **Umbra** | Ý thức cổ xưa. Triết lý: *"Life creates suffering because life is divided"* | Phản diện. Không xuất hiện trong 3 Area này. |
| **Umbraflux** | Essence bị tha hóa. Ghi đè ý chí vật chủ | **Nguồn rủi ro và nguồn nhiệm vụ** của giai đoạn sau |
| **The Great Fracture** | Thế giới bị xé rách: đất bay lên trời, thành phố chìm xuống biển | **Bối cảnh vật lý của Cloud và Aquarium** (mục 2) |
| **First Guardians** | Sinh vật cộng hưởng mạnh với Lumina, đã hy sinh để phong ấn Umbra | Tổ tiên của Combat Animal. Dấu vết của họ nằm trong di tích. |
| **Phong ấn đang yếu đi** | Twist trung tâm | **Endgame** (mục 6) |

**Một câu tóm tắt để kiểm tra mọi quyết định thiết kế:**

> Người chơi bắt đầu bằng việc chăm vài con vật nhỏ, và dần phát hiện những con vật đó mang trong mình
> thứ năng lượng từng cứu cả thế giới.

Nếu một tính năng mới không nằm trên đường đi từ *chăm sóc* đến *khám phá ra mình đang chăm sóc cái gì*,
nó không thuộc về game này.

---

## 2. Great Fracture giải thích cấu trúc thế giới

Đây là món quà lớn nhất mà lore tặng cho gameplay: **ba Area không còn là ba cái sân chơi đặt cạnh nhau,
mà là ba mảnh của cùng một thế giới cũ.**

```text
                  THẾ GIỚI TRƯỚC GREAT FRACTURE
                              │
         ┌────────────────────┼────────────────────┐
         ↓                    ↓                    ↓
  bị đẩy lên trời       vẫn ở mặt đất        chìm xuống biển
         │                    │                    │
   SOBI CLOUD            SOBI GARDEN         SOBI AQUARIUM
  mảnh đất trôi          đất còn nguyên       thành phố ngập nước
   Sky Essence           Life Essence           Tide Essence
```

Hệ quả thiết kế, trực tiếp và cụ thể:

- **Cloud không phải "vườn trên mây".** Mỗi tầng mây là **một mảnh đất thật bị xé khỏi mặt đất** — một bậc
  thềm vườn gãy, một mái đền, một khúc bờ biển có cảng đã cạn nước. Mở Cloud Area mới = *tìm thấy và neo
  lại* một mảnh thế giới cũ, không phải mua thêm ô trống.
- **Aquarium không phải bể cá.** Đáy đại dương là **một thành phố đã chìm**. Vật thể habitat là cổng vòm
  gãy, cột đổ, chuông ngập nước. Câu cá kéo lên cả cá lẫn **mảnh di tích**.
- **Garden là mảnh duy nhất không bị xé.** Đó là lý do nó là Area thứ hai được mở, và là nơi Life Essence
  đậm nhất. Đất ở đây *nhớ*.

Chi phí thao tác của toàn bộ phần này: **bằng không.** Nó chỉ đổi cách đặt tên và cách vẽ.

---

## 3. Sobi Essence — tầng tài nguyên dùng chung

### 3.1 Vấn đề cần giải

Audit đã chỉ ra ba lỗ hổng riêng biệt, và cả ba có chung một lời giải:

1. Quality và Bond được xây công phu nhưng chỉ chảy vào **giá bán**. Lối chơi tối ưu là bán sớm.
2. Tự động hóa (vòi tưới, sóc, máng, cleaner) xóa dần gameplay — chăm kỹ và chăm ẩu cho kết quả gần như nhau.
3. Ba Area "nông trại" không có liên hệ nào với câu chuyện chính.

### 3.2 Luật

> **Sobi Essence là phần thưởng cho việc chăm sóc tốt, không phải cho việc bấm nhiều.**

Mỗi Area sinh ra một dạng Essence riêng, **chỉ khi sản phẩm đạt Quality cao**:

| Area | Essence | Sinh ra khi |
|---|---|---|
| Sobi Garden 🌱 | **Life Essence** | Thu hoạch cây đạt Great trở lên |
| Sobi Aquarium 🐟 | **Tide Essence** | Mỗi 6 giờ Ecosystem Balance ≥ 70 |
| Sobi Cloud ☁️ | **Sky Essence** | Thu hoạch hoa đạt Great trở lên |
| Sobi Farm 🐷 | **Bond Essence** | Xuất chuồng sinh vật có Bond ≥ 3 tim |

Quy đổi: **Great = 1 · Excellent = 2 · Perfect = 3.**

Ba loại Essence của Garden/Aquarium/Cloud **không tiêu riêng lẻ**. Chúng được tinh luyện thành
**Sobi Essence** — tài nguyên meta duy nhất:

```text
Life Essence ×1  ┐
Tide Essence ×1  ├──►  Sobi Essence ×1      (Bàn Cộng Hưởng, ở Sảnh Sobi, 30 phút)
Sky  Essence ×1  ┘
```

**Điểm then chốt:** công thức cần **cả ba**. Nghĩa là không Area nào bị bỏ rơi, và người chơi chỉ mê một
Area vẫn tiến được (họ mua/đổi hai loại còn lại qua đơn hàng và thương nhân), nhưng chơi cả ba thì nhanh hơn
hẳn. Đây là "keo dán" thật, không phải lời hứa.

### 3.3 Sobi Essence tiêu vào đâu

| Mục đích | Mô tả | Có từ |
|---|---|---|
| **Thanh tẩy Umbraflux** | Chữa sinh vật/cây bị tha hóa | GĐ10 |
| **Đánh thức Guardian** | Mở trait ẩn của sinh vật có Bond 5 tim → mới có `combatCapability` | GĐ10 |
| **Trang bị cổ** | Nguyên liệu bắt buộc cho trang bị bậc cao | GĐ11 |
| **Neo mảnh đất** | Mở Cloud Area mới (cùng với Coin) | GĐ9 |
| **Hồi phong ấn** | Tiến trình endgame (mục 6) | GĐ13 |
| **Trước GĐ10** | Đổi lấy hạt/trứng/chậu hiếm ở Bàn Cộng Hưởng | GĐ5 |

Mục cuối quan trọng: Essence **phải có chỗ tiêu ngay từ GĐ5**, nếu không nó là tài nguyên chết trong 5 giai
đoạn — đúng lỗi mà Event Tokens đang mắc phải.

### 3.4 Những gì Essence KHÔNG phải

- Không phải tiền thứ tư có giá niêm yết. Không mua bằng Coin, không bán ra Coin.
- Không phải thanh năng lượng chặn hành động. Không bao giờ ngăn người chơi làm gì.
- Không rơi ngẫu nhiên. Nó là hàm của Quality, nên nó luôn giải thích được.

---

## 4. Ba luật dùng chung cho Garden, Aquarium, Cloud

Ba Area này cùng một thể loại (nuôi/trồng → chăm → thu). Ba luật dưới đây áp cho cả ba, và là lý do để
chúng *cảm giác* khác nhau mà không cần ba bộ cơ chế khác nhau.

### Luật 1 — Tự động hóa giữ cho sống, bàn tay nâng chất lượng

> Thiết bị tự động **không bao giờ để mất** cây/con. Nhưng Quality trần khi hoàn toàn tự động là **Good**.
> Chỉ thao tác tay đúng lúc mới lên được Great / Excellent / Perfect.

Cụ thể:

| Area | Tự động | Trần Quality | Thao tác tay nâng chất lượng |
|---|---|---|---|
| Garden | Vòi tưới | Good | Tưới tay trong **cửa sổ khát** |
| Cloud | Sóc tưới / chim bắt sâu | Good | Tưới tay trong cửa sổ khát; bắt sâu trong 6 giờ đầu |
| Aquarium | Máy lọc + cleaner animal | Good | Dọn tay khi có cảnh báo; đặt đúng habitat |
| Farm | Máng tự động | Good | Cho ăn món yêu thích; vuốt ve |

**Tại sao luật này đúng với cozy:** người chơi bận không mất gì — cây vẫn lớn, cá vẫn sống, vẫn bán được,
vẫn tiến bộ. Người chơi rảnh có một việc *đáng làm* khi mở game. Không ai bị phạt; chỉ có người được thưởng.

**Cửa sổ khát / cửa sổ chăm sóc phải rộng rãi.** Tối thiểu 25% vòng đời của cây, tối thiểu 6 giờ thật với
cây ngắn. Có biểu tượng rõ trên đối tượng. Không có âm thanh giục, không có đếm ngược đỏ.

### Luật 2 — Một quyết định lúc đặt, không phải mười thao tác lúc chăm

Chiều sâu của ba Area này nằm ở **lúc bắt đầu** (trồng gì vào ô nào, thả con gì vào vùng nào, đặt hoa lên
mảnh đất nào), không nằm ở việc lặp lại thao tác.

| Area | Quyết định lúc đặt | Hệ quả |
|---|---|---|
| Garden | Luân canh + cây đi kèm | Sản lượng và Quality |
| Aquarium | Habitat phù hợp + bạn cùng bể | Comfort và Ecosystem Balance |
| Cloud | Mảnh đất nào (mỗi mảnh một tính chất) | Tốc độ lớn và Quality |

Sau khi đặt xong, người chơi **không cần đụng lại** cho tới khi thu hoạch. Đó là khác biệt giữa "có chiều sâu"
và "phiền".

### Luật 3 — Mỗi Area là nguồn duy nhất của đúng một thứ cả thế giới cần

| Area | Độc quyền | Cả thế giới cần nó để |
|---|---|---|
| Garden | **Thức ăn** (mọi sinh vật ăn đồ từ Garden) | Nuôi Farm và Aquarium |
| Aquarium | **Ngọc trai + mảnh di tích** | Nâng công trình bậc cao, và là **nguồn vật liệu cổ thứ hai** ngoài Adventure |
| Cloud | **Potion** (chữa bệnh, thanh tẩy, buff trận đánh) | Cứu sinh vật, đi phiêu lưu |
| Farm | **Phân bón + sinh vật chiến đấu** | Trồng trọt, và toàn bộ Adventure |

Dòng Aquarium quan trọng về mặt rủi ro dự án: audit đã cảnh báo Adventure đang là **nguồn duy nhất** của vật
liệu cổ, nên nếu Adventure trượt lịch thì trần nâng cấp của cả 4 Area bị khóa. Mảnh di tích từ câu cá phá thế
độc quyền đó — chậm hơn, đắt hơn, nhưng có.

---

## 5. Những thứ KHÔNG định nghĩa lại ở từng Area

Các hệ thống dưới đây thuộc `core/`. Spec Area **tham chiếu**, không viết lại. Chỗ nào spec Area hiện đang
định nghĩa riêng thì phải xóa.

| Hệ thống | Nguồn sự thật | Spec Area đang vi phạm |
|---|---|---|
| Level và XP | **Một Sobi World Level chung.** Mọi Area cộng vào cùng một thanh XP | — (Cloud và Aquarium đã đúng; `GAME_BALANCE` §7 cần sửa theo) |
| Túi đồ | 40 ô, stack 99, +20 mỗi cấp Kho | Cloud §XVIII (50/75/100/150) — **xóa** |
| Trần bù offline | **30 ngày**, toàn thế giới | Cloud §XIV (24–48 giờ), Aquarium §28 (8 giờ) — **xóa cả hai** |
| Quality | 5 bậc Normal→Perfect, dùng chung | Cloud §IX giữ được, Aquarium dùng chung |
| Rarity | 6 bậc Common→Mythic | — |
| Thương nhân | Một hệ thống ở Sảnh; Area đăng ký bảng hàng riêng | Cloud §XXIV (Wandering Merchants) — **gộp vào** |
| Nhiệm vụ hằng ngày | 3 mục tiêu/ngày ở Sảnh, lấy đề bài từ các Area đã mở | Cloud §XXX–XXXI, Aquarium §24 — **gộp vào** |
| Đơn hàng | Bảng đơn hàng ở Sảnh | Aquarium §24 (6 loại quest) — **gộp vào** |
| Codex | Một Codex chung, có tab theo Area | Aquarium §19 AquaDex = tab của Codex; §23 Research = trang Codex; §30 Rank = mốc Codex |
| Sưu tầm / mốc thưởng | Codex | — |
| Save | Một save world, Area giữ state con | Cloud §XXXIII — **viết lại theo Area Contract** |

**Nguyên tắc:** nếu người chơi phải mở hai menu khác nhau để làm cùng một việc ở hai Area, đó là lỗi thiết kế,
không phải tính năng.

---

## 6. Endgame

Audit ghi nhận: không tài liệu nào định nghĩa "chơi xong Sobi World". Lore cho câu trả lời.

> **Phong ấn đang yếu đi.** Endgame là **hồi phục phong ấn** bằng chính thứ mà First Guardians đã dùng:
> Sobi Essence gom từ khắp thế giới.

```text
Chăm sóc tốt ở 4 Area
        ↓
Life / Tide / Sky / Bond Essence
        ↓
Sobi Essence
        ↓
Đài Phong Ấn ở Sảnh Sobi  ──►  mỗi mốc mở một đoạn lore + một vùng Adventure
        ↓
Phong ấn hoàn chỉnh = kết thúc câu chuyện
        ↓
Thế giới vẫn chạy tiếp (không prestige, không reset, không mất gì)
```

Ba điều kiện của "hoàn thành", nêu rõ để ràng buộc khối lượng nội dung:

1. **Codex 100%** — mọi loài, cây, hoa, cá, di tích, công thức.
2. **Mọi công trình Lv4** ở cả 5 Area.
3. **Phong ấn hồi phục hoàn toàn** — mốc Sobi Essence cuối.

Sau khi hoàn thành: không có New Game+, không reset. Thế giới mở khóa **chế độ tự do** — mọi mảnh đất đã neo,
mọi công thức đã có, không còn mục tiêu bắt buộc. Đúng tinh thần cozy: phần thưởng cho việc hoàn thành là
được ở lại và sống trong thứ mình đã xây.

---

## 7. Umbraflux trong ba Area này — nhẹ, có cảnh báo, có cách phòng

Lore nói Umbraflux lan bằng cách khiến chính thế giới tự lan truyền nó. Ba Area nông trại **không** biến thành
chiến trường. Nhưng chúng nên *chạm* vào nó, nếu không câu chuyện chỉ sống ở Adventure.

Thiết kế tối giản, bật từ GĐ10 (sau khi Adventure mở):

- Rất thỉnh thoảng (**≤1 lần/tuần thật**, có mốc đảm bảo không dồn), một cây / một con / một mảnh đất xuất
  hiện **dấu hiệu lạ**: lá sẫm màu, mắt đổi màu, mây xám bám quanh mảnh đất.
- Nó **không lây**, **không giết**, **không làm mất gì**. Nó chỉ *dừng sinh trưởng* của đúng đối tượng đó.
- Chữa bằng **Cleansing Potion** (Cloud) hoặc 1 Sobi Essence.
- Chữa xong: đối tượng đó **vĩnh viễn tốt hơn một bậc** (+1 Quality trần, hoặc +1 habitat tag). Lore: Essence
  đã kháng lại Umbraflux một lần thì cộng hưởng mạnh hơn.

**Lý do thiết kế:** biến thứ duy nhất có thể gây khó chịu thành **một cơ hội hiếm mà người chơi mong gặp**.
Đây là cách duy nhất để đưa phản diện vào một game cozy mà không phản bội chữ "cozy".

Rõ ràng là KHÔNG: không lây lan theo cấp số nhân trong Farm/Garden/Aquarium/Cloud, không đếm ngược, không mất
sinh vật, không bắt người chơi đi Adventure để cứu nông trại.

---

## 8. Bảng dòng chảy tài nguyên sau cập nhật

```text
                        ┌──────────── SẢNH SOBI ────────────┐
                        │  Đơn hàng · Chợ · Bàn Cộng Hưởng  │
                        │        Đài Phong Ấn               │
                        └───────────────────────────────────┘
                              ▲       ▲       ▲       ▲
        ┌─────────────────────┘       │       │       └──────────────────┐
        │                             │       │                          │
   SOBI FARM 🐷               SOBI GARDEN 🌱   SOBI AQUARIUM 🐟     SOBI CLOUD ☁️
        │                             │       │                          │
        ├─ phân ──────────────────────►       │                          │
        │                             ├─ thức ăn heo ───────────────────►│ (không)
        ├◄──── thức ăn, món yêu thích ─┤       │                          │
        │                             ├─ thức ăn cá, rong giống ────────►│
        │                             │       ├─ ngọc trai ──────────────►
        ├◄──── ngọc trai (công trình) ─────────┤                          │
        ├◄──── Healing Potion ─────────────────────────────────────────────┤
        │                             ├◄──── Sky Water (tưới) ────────────┤
        │                             │       ├─ mảnh di tích ───► ADVENTURE
        ├─ sinh vật chiến đấu ────────────────────────────────────► ADVENTURE
        │                             │       │                          │
   Bond Essence              Life Essence  Tide Essence           Sky Essence
        └─────────────┬───────────────┴───────┴──────────────────────────┘
                      ▼
               SOBI ESSENCE  ──►  thanh tẩy · đánh thức Guardian · trang bị cổ · phong ấn
```

Kiểm tra theo luật §13.2 của spec gốc ("không tài nguyên chết" — mỗi tài nguyên ≥ 2 công dụng):

| Tài nguyên | Công dụng 1 | Công dụng 2 | Công dụng 3 |
|---|---|---|---|
| Phân | Phân bón (Garden) | Bán (từ GĐ2, giá thấp) | — |
| Cỏ | Phân bón | Ăn vặt heo | Thức ăn cá thường |
| Khoai tây | Thức ăn cá | Đơn hàng | Thức ăn heo cấp thấp |
| Rong giống | Trồng ở ô nước Garden | Thức ăn cá | Nguyên liệu phân bón biển |
| Ngọc trai | Nâng công trình Aquarium | Nâng công trình Farm/Garden | Trang trí |
| Mảnh di tích | Vật liệu cổ (thay Adventure) | Codex + lore | Trang trí Aquarium |
| Hoa Item | Potion chữa bệnh | Cleansing Potion | Buff trận đánh |
| Hoa Material | Rèn chậu | Vật liệu trang bị | Đơn hàng |
| Life/Tide/Sky Essence | Tinh luyện Sobi Essence | Đổi hạt/trứng/chậu hiếm | — |

**Phân đã có sink từ GĐ2** (bán được, giá thấp) — sửa lỗ hổng audit đã nêu: trước đây heo thải phân từ GĐ2 mà
Thùng ủ tới GĐ5 mới có.

---

## 9. Checklist cho mọi Area mới sau này

Trước khi một Area được coi là thiết kế xong, phải trả lời được:

- [ ] Nó là mảnh nào của thế giới trước Great Fracture?
- [ ] Nó sinh ra Essence gì, và khi nào?
- [ ] Nó độc quyền thứ gì mà cả thế giới cần?
- [ ] Nó tiêu thụ thứ gì từ Area khác?
- [ ] Quyết định *lúc đặt* của nó là gì? (Luật 2)
- [ ] Tự động hóa của nó giữ cho sống, trần Quality là Good? (Luật 1)
- [ ] Nó dùng lại Codex / đơn hàng / mục tiêu hằng ngày / túi đồ chung, hay đang tự dựng bản riêng?
- [ ] Người chơi bỏ nó 2 tuần thì mất gì? (Câu trả lời đúng: **thời gian, không mất tài sản**)
