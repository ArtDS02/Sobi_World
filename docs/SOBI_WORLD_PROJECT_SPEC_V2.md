# SOBI WORLD — PROJECT SPEC V2

**Phiên bản:** 2.0 (thay thế V1, V1 chỉ giữ để tham khảo tầm nhìn)
**Thể loại:** Cozy life simulation, chơi một mình, offline
**Nền tảng:** Desktop (cài như game bình thường, không cần internet, không cần phần mềm lập trình)
**Triết lý:** *Everything is connected.*
**Slogan:** *Grow Your World. Discover Your Adventure.*

Tài liệu đi kèm (cùng thư mục `docs/`):

| File | Nội dung |
|---|---|
| `ARCHITECTURE.md` | Cấu trúc source, quy tắc kỹ thuật, save, đóng gói |
| `GAME_BALANCE.md` | Toàn bộ con số khởi điểm (đều chỉnh được qua Admin) |
| `ROADMAP.md` | Lộ trình 13 giai đoạn và tiêu chí hoàn thành |
| `AGENT_RULES.md` | Luật làm việc bắt buộc cho AI agent |
| `HUONG_DAN_TRIEN_KHAI.md` | Prompt copy cho từng giai đoạn |

---

## 1. Định nghĩa game

Sobi World là **một game duy nhất, một thế giới duy nhất**. Người chơi điều khiển một nhân vật, sống trong thế giới gồm một **Sảnh Sobi** trung tâm và nhiều **Area** có gameplay riêng: nuôi heo, trồng trọt, nuôi cá, trồng hoa phép, phiêu lưu đánh theo lượt.

Các Area **không phải mini-game**. Tất cả dùng chung nhân vật, túi đồ, tiền, vật phẩm, sản xuất, tiến trình và save. Thứ làm ra ở Area này là nguyên liệu của Area khác.

Sobi Farm là **Area đầu tiên**, không phải toàn bộ kiến trúc game.

---

## 2. Các quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Thời gian | Chạy theo **giờ thật** (1 phút game = 1 phút thật). Ngày/đêm theo đồng hồ máy. |
| Khi tắt game | Thế giới **vẫn tiếp tục**. Khi mở lại, game tính bù phần thời gian đã trôi qua. |
| Đói khi vắng mặt | Có. Sinh vật đói, bẩn, có thể bệnh khi người chơi vắng mặt. |
| Bệnh và chết | Bệnh kéo dài **72 giờ** thì chết. Trong lúc bệnh, giá trị giảm dần (tối đa −30%, chữa xong hồi đủ). Chết thì mất con vật. **Không chết trong lúc bù offline**: khi mở game, sinh vật nguy kịch còn ít nhất 12 giờ để chữa (decision 004). |
| Heo thịt | Không dùng "harvest". Dùng **"Xuất chuồng"**: heo được gửi đi chợ, người chơi nhận tiền. |
| Area không hiển thị | Chỉ tính số liệu, **không chạy AI di chuyển và animation**. Ưu tiên hiệu năng. |
| Adventure | **Đánh theo lượt**. Mỗi heo/cá có skill riêng. |
| Gems | Chỉ kiếm từ **thành tựu** và **loot hiếm**. Không có nạp tiền. |
| Admin Dashboard | Là **công cụ biên tập nội dung cho nhà phát triển**. **Không** được đóng gói vào bản cho người chơi. |
| Server | **Không có server**, kể cả server cục bộ. Game đọc/ghi dữ liệu trên máy. |
| Cài đặt | Có bộ cài/file chạy. Người chơi mở bằng shortcut, không terminal, không cài thêm phần mềm. |
| Nhân vật | Có nhân vật, đi lên/xuống/trái/phải. Phím điều khiển tùy chỉnh được. |
| Di chuyển giữa Area | Qua **Sảnh Sobi** với các cổng là vật thể trong cảnh (mục 3). |

---

## 3. Cấu trúc thế giới

### 3.1 Sảnh Sobi (Sobi Plaza)

Khu vực trung tâm, nơi người chơi xuất hiện khi mở game. Người chơi đi bộ đến vật thể và nhấn phím tương tác để sang Area:

| Vật thể trong Sảnh | Dẫn đến |
|---|---|
| Chuồng heo | Sobi Farm 🐷 |
| Khu vườn | Sobi Garden 🌱 |
| Biển | Sobi Aquarium 🐟 |
| Cây cao chọc trời | Sobi Cloud ☁️ |
| Cổng dịch chuyển | Sobi Adventure ⚔️ |

Area chưa mở khóa vẫn hiển thị nhưng có trạng thái khóa (rào, mây che, cổng tắt). Khi người chơi đến gần, game hiện điều kiện mở khóa.

Sảnh cũng là nơi đặt **Bảng đơn hàng**, **Chợ** và các NPC hướng dẫn. Như vậy người chơi luôn quay về Sảnh, và Sảnh trở thành điểm gặp nhau của mọi hệ thống.

### 3.2 Thứ tự mở khóa

```text
Sobi Farm (có sẵn) → Sobi Garden → Sobi Aquarium → Sobi Cloud → Sobi Adventure
```

Điều kiện cụ thể nằm trong `GAME_BALANCE.md`.

### 3.3 Vòng lặp lõi

```text
Garden → cây trồng → thức ăn → Farm → heo lớn → xuất chuồng (tiền)
                                  ↓
                                 phân → phân bón → Garden
Aquarium, Cloud → vật liệu hiếm, thuốc, hoa → Farm, Adventure
Adventure → loot, vật liệu cổ, hạt giống hiếm → nâng cấp mọi Area
```

---

## 4. Nhân vật người chơi

- Một nhân vật duy nhất, di chuyển trong mọi Area và Sảnh.
- Di chuyển 4 hướng (trái/phải/lên/xuống), cho phép đi chéo khi nhấn 2 phím.
- Tương tác bằng cách đứng gần vật thể rồi nhấn phím tương tác: cho ăn, dọn phân, tưới cây, thu hoạch, vuốt ve, mở cửa hàng, đi qua cổng.
- Phím mặc định: `WASD` / mũi tên (di chuyển), `E` (tương tác), `I` (túi đồ), `C` (Codex), `Esc` (menu). Đổi được trong Cài đặt. Cài đặt lưu riêng, không nằm trong save game.
- Một số thao tác hàng loạt (ví dụ đổ thức ăn vào máng) vẫn làm được bằng chuột qua UI để không mệt tay.

---

## 5. Thời gian và thế giới sống

**Đồng hồ.** Lấy theo giờ thật của máy. Các buổi trong ngày: Sáng 05–10, Ngày 10–17, Chiều 17–20, Đêm 20–05. Ban đêm sinh vật ngủ, một số nội dung chỉ có ban đêm.

**Ba chế độ mô phỏng, dùng chung một bộ công thức:**

| Chế độ | Khi nào | Chạy gì |
|---|---|---|
| Đang xem | Area người chơi đang đứng | Đầy đủ: AI di chuyển, animation, số liệu |
| Nền | Area khác khi game đang mở | Chỉ số liệu (đói, lớn, bệnh, cây lớn, sản xuất) |
| Bù offline | Khi mở game sau thời gian tắt | Chỉ số liệu, tính theo bước thời gian |

Cả ba chế độ phải cho ra **cùng một kết quả số liệu**. Không được có công thức riêng cho offline.

**Màn hình "Trong lúc bạn vắng nhà".** Mỗi lần mở game, hiện tóm tắt những gì đã xảy ra: con nào đói, con nào bệnh, con nào đã mất, cây nào chín, sản xuất xong gì, đơn hàng mới. Có nút đi thẳng đến chỗ cần xử lý.

**Bảo vệ người chơi mới.** 72 giờ đầu của một save mới, sinh vật không bị bệnh. Người chơi có thời gian học cách chơi trước khi gặp rủi ro.

**Chống chỉnh giờ máy.** Nếu giờ máy lùi về quá khứ, game không tính ngược. Thời gian bù offline tối đa 30 ngày.

**Công cụ giúp vắng nhà.** Máng ăn tự động, vòi tưới tự động (nâng cấp được) cho phép người chơi đi vắng mà sinh vật vẫn ổn. Đây là lý do có giá trị để kiếm tiền và nâng cấp.

---

## 6. Hệ thống dùng chung

| Hệ thống | Mô tả ngắn |
|---|---|
| Inventory | Một túi đồ chung cho toàn thế giới. Có giới hạn ô, nâng cấp bằng Kho. |
| Tiền tệ | **Coins** (kiếm bằng bán, xuất chuồng, đơn hàng), **Gems** (thành tựu, loot hiếm), **Event Tokens** (sự kiện). |
| Item | Định nghĩa bằng dữ liệu. Mỗi item có category, rarity, giá bán, công dụng. |
| Quality | Normal / Good / Great / Excellent / Perfect. Phản ánh mức chăm sóc. |
| Rarity | Common / Uncommon / Rare / Epic / Legendary / Mythic. Phản ánh độ hiếm. Quality và Rarity luôn là hai hệ thống riêng. |
| Production | Mọi chế biến là **recipe** dữ liệu: đầu vào, đầu ra, thời gian, công trình thực hiện. |
| Codex | Sổ sưu tầm: sinh vật, cây, cá, hoa, trang bị, vật liệu, khám phá. Có mốc thưởng. |
| Tiến trình | Mỗi Area có Level riêng. **World Development** là chỉ số tổng, dùng để mở Area và nội dung mới. |
| Thành tựu | Mục tiêu dài hạn, thưởng Gems. |
| Save | Lưu toàn bộ world state trên máy, có backup, validation, migration. |

---

## 7. Sinh vật (dùng chung cho heo, cá, sinh vật sau này)

Mọi sinh vật dùng **một model chung**. Heo, cá là các **species** định nghĩa bằng dữ liệu.

**Thuộc tính chung:** id, species, breed, tên (người chơi đặt), rarity, quality, tuổi, giai đoạn lớn, cân nặng, đói, sạch sẽ, năng lượng, tâm trạng, sức khỏe, thân thiết (bond), traits, gen, bố mẹ, thế hệ, mục đích nuôi, vị trí. Sinh vật đánh được có thêm: combatCapability, level, EXP, chỉ số chiến đấu, skill, nguyên tố, trang bị.

**Giai đoạn lớn:** Baby → Young → Adult → Mature.

**Sức khỏe và bệnh:**
- Đói lâu, bẩn lâu, buồn lâu làm tăng nguy cơ bệnh.
- Khi bệnh: ngừng lớn, tâm trạng giảm, **giá trị giảm dần mỗi ngày**.
- Sau 48 giờ bệnh: trạng thái **Nguy kịch**, cảnh báo đỏ.
- Sau 72 giờ bệnh: **chết**. Con vật biến mất khỏi chuồng, Codex lưu lại một dòng kỷ niệm.
- Chữa bằng Thuốc (mua ở chợ), sau này có Healing Potion từ Sobi Cloud.

**Mục đích nuôi** (chọn khi heo đến tuổi Adult, đổi được):
- **Xuất chuồng:** ưu tiên cân nặng và chất lượng.
- **Giống:** dùng để lai.
- **Phiêu lưu:** chỉ với sinh vật có combatCapability.
- **Thú cưng:** không bán, không đánh, chỉ để yêu thương. Tăng tâm trạng chung của chuồng.

**Thân thiết (Bond) — hệ thống mới.** Mỗi sinh vật có 5 trái tim. Bond tăng khi vuốt ve, cho ăn món yêu thích, chăm sóc khi bệnh. Bond cao giúp tăng chất lượng, mở trait ẩn, tăng sức mạnh khi phiêu lưu. Mỗi con có một **món yêu thích** riêng (lấy từ Garden). Đây là thứ tạo cảm giác "đây là con heo của mình".

---

## 8. Các Area

### 8.1 Sobi Farm 🐷 (có sẵn)
Nuôi heo: cho ăn, dọn phân, vuốt ve, chữa bệnh, lai giống, xuất chuồng. Heo có AI hành vi (đi lang thang, tìm máng khi đói, ngủ ban đêm, chơi). **Phân** rơi trong chuồng, người chơi thu gom thành tài nguyên. Phân để lâu làm chuồng bẩn.
Công trình: Chuồng (sức chứa), Máng ăn tự động, Trạm lai giống, Kho.

### 8.2 Sobi Garden 🌱
Trồng trọt trên ô đất: gieo hạt, tưới, bón phân, thu hoạch. Cây không tưới lớn chậm hơn. Cây chín để quá lâu bị héo, giảm sản lượng.
Công trình: Ô đất (mở rộng), Vòi tưới tự động, Máy xay thức ăn (Feed Mill), Thùng ủ phân.
Liên kết: thức ăn heo, món yêu thích, phân bón từ phân heo.

### 8.3 Sobi Aquarium 🐟
Nuôi cá trong bể: cho ăn, giữ nước sạch, cá lớn, bán, sưu tầm, lai một số loài. Câu cá ở bờ biển để có cá mới. Một số cá chỉ xuất hiện ban đêm. Có cá đánh được.
Liên kết: vật liệu hiếm (vảy, ngọc trai) cho chế tạo; cá phiêu lưu.

### 8.4 Sobi Cloud ☁️
Vườn hoa phép trên mây. Trồng hoa bằng hạt + nước tinh khiết + phân bón. Tạo hoa hiếm, nấu potion.
Liên kết: Healing Potion chữa bệnh cho heo/cá; hoa tăng tỉ lệ đột biến khi lai; potion hỗ trợ trận đánh.

### 8.5 Sobi Adventure ⚔️
Chọn đội tối đa 3 sinh vật có combatCapability, chọn vùng, đi qua chuỗi ô sự kiện (trận đánh, rương, sự kiện nhỏ), đánh trùm cuối vùng.
**Trận đánh theo lượt:** thứ tự theo Tốc độ; mỗi lượt chọn đòn thường, skill hoặc dùng vật phẩm. Có khắc chế nguyên tố.
**Thua không chết:** sinh vật bị **Kiệt sức**, phải nghỉ vài giờ thật. Phiêu lưu là phần thưởng, không phải rủi ro mất con.
Loot: vật liệu cổ (nâng cấp công trình), hạt giống hiếm, cá hiếm, heo hiếm, trang bị, Gems (hiếm).

---

## 9. Hệ thống gắn kết (mới, bắt buộc)

**Bảng đơn hàng (Order Board)** — ở Sảnh. NPC đặt đơn cần vật phẩm, càng về sau càng cần đồ từ nhiều Area. Thưởng tốt hơn bán lẻ. Đây là chất keo chính nối các Area.

**Mục tiêu hằng ngày** — 3 mục tiêu nhẹ, làm mới lúc 00:00 giờ máy. Không bắt buộc.

**Thành tựu** — mục tiêu dài hạn, nguồn Gems chính.

**NPC** — mỗi Area có một NPC hướng dẫn khi mở khóa. NPC Nhà lai giống thỉnh thoảng kể "tin đồn" gợi ý tổ hợp lai hiếm (không nói thẳng).

**Chợ** — mua bán. Mỗi ngày một vài loại hàng được giá hơn, một loại bị rớt giá (cố định theo ngày, không ngẫu nhiên mỗi lần mở game).

**Trang trí** — đặt đồ trang trí trong Area. Đồ trang trí tăng nhẹ tâm trạng sinh vật gần đó, để trang trí vừa đẹp vừa có ích.

---

## 10. Thế giới động (làm sau, xem Roadmap)

Thời tiết (nắng, mưa, sương, tuyết, cầu vồng) có tác dụng nhẹ: mưa giúp cây lớn nhanh, mưa đêm có cá hiếm, cầu vồng tăng đột biến. Thời tiết xác định theo ngày, không bắt buộc người chơi chạy theo. Sự kiện theo mùa dùng Event Tokens.

---

## 11. Admin Dashboard (công cụ nhà phát triển)

- Chỉ chạy trong môi trường phát triển. **Không có trong bản build cho người chơi.**
- Chỉnh mọi dữ liệu nội dung: sinh vật, item, giá, recipe, công thức lai, shop, đơn hàng, thành tựu, vùng phiêu lưu, kẻ địch, loot, asset, layout, **toàn bộ con số trong `GAME_BALANCE.md`**.
- Kiểm thử: xem/sửa save, cộng tiền, thêm đồ, **tua nhanh thời gian**, reset dữ liệu test.
- Mọi thay đổi ghi vào file dữ liệu và được kiểm tra hợp lệ trước khi lưu.

---

## 12. Kỹ thuật và phát hành

- Offline hoàn toàn, không server, không cần internet.
- Save và cài đặt lưu trong thư mục dữ liệu người dùng của hệ điều hành, không lưu trong thư mục cài game.
- Có bộ cài (installer) hoặc file chạy. Người chơi bấm shortcut là vào game.
- Chạy được trên máy không cài phần mềm lập trình.
- Chi tiết: `ARCHITECTURE.md`.

---

## 13. Luật thiết kế nội dung

1. **Không có hệ thống cô lập.** Mỗi hệ thống phải đóng góp vào vòng lặp chung.
2. **Không có tài nguyên chết.** Mỗi tài nguyên nên có ít nhất 2 công dụng.
3. **Mỗi nội dung mới có ít nhất 1 liên kết** với Area khác.
4. **Cozy trước tiên.** Không ép grind, chơi ngắn vẫn có tiến bộ. Rủi ro (bệnh, chết) luôn có cảnh báo sớm và có cách phòng tránh.
5. **Người chơi tự chọn lối chơi:** nông dân, nhà lai giống, nhà sưu tầm, thương nhân, nhà phiêu lưu.
6. **Quyết định nhẹ nhưng có ý nghĩa:** bán hay giữ, xuất chuồng hay cho phiêu lưu, dùng vật liệu nâng Area nào.
7. Khi thêm ý tưởng mới, ưu tiên theo thứ tự: **hợp lý → hấp dẫn → dễ làm**.

---

## 14. Ngoài phạm vi

Multiplayer, PvP, server online, nạp tiền, quảng cáo, đồng bộ cloud. Kiến trúc không cần chuẩn bị cho những thứ này.
