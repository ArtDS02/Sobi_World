# UPDATE SPEC — SOBI GARDEN GAMEPLAY V1

> **Document:** `update_spec_sobi_garden_gameplay_v1.md`
> **Project:** Sobi World · **Area:** Sobi Garden 🌱 · **Version:** v1.0
> **Mode:** Offline / Single-player
> **Primary progression:** Sobi World Level (dùng chung toàn thế giới)
> **Đọc kèm:** `lore/LORE_TO_GAMEPLAY.md` (tầng dùng chung), `GAME_BALANCE.md` §5–§6

Trước bản này, toàn bộ Sobi Garden chỉ gồm một đoạn trong `SOBI_WORLD_PROJECT_SPEC_V2.md` §8.2 và 5 cây
trong `GAME_BALANCE.md` §5. Bản này mở rộng thành spec đầy đủ, **không tăng số thao tác của người chơi**.

---

# 1. GARDEN LÀ GÌ

Sobi Garden là **mảnh đất duy nhất không bị Great Fracture xé khỏi mặt đất**.

Trời mất một phần đất, biển nuốt một thành phố — khu vườn vẫn ở nguyên chỗ cũ. Vì thế Lumina chưa bao giờ
ngừng chạm tới nó, và **Life Essence ở đây đậm hơn bất cứ đâu**. Đất trong vườn *nhớ* những gì đã mọc trên nó.

Đó không phải lời văn trang trí: nó là cơ chế (mục 5).

**Vai trò trong thế giới:** Garden là **nguồn thức ăn duy nhất**. Mọi sinh vật ở Farm và Aquarium đều ăn thứ
mọc ở đây. Nếu Garden ngừng, cả thế giới đói. Đó là lý do nó là Area thứ hai được mở.

**Cảm giác mục tiêu:** *gọn gàng, có nhịp, thấy kết quả nhanh.* Garden là Area có chu kỳ ngắn nhất
(1–6 giờ), đối lập với Farm (24–48 giờ) và Cloud (4–12 giờ). Người chơi mở game 5 phút → Garden là nơi
luôn có việc để làm và luôn có thứ để thu.

---

# 2. CORE GAMEPLAY LOOP

```text
Chọn ô đất  ──►  CHỌN CÂY (quyết định thật, mục 5 + 6)
                      ↓
                 Gieo hạt
                      ↓
      ┌──── Cây lớn theo giờ thật ────┐
      │                               │
  Vòi tưới tự động            Cửa sổ khát (tưới tay)
  → cây không bao giờ chết    → +1 bậc Quality
      │                               │
      └───────────┬───────────────────┘
                  ↓
              Chín  ──(quá 48 giờ)──►  héo, sản lượng −50%
                  ↓
              Thu hoạch
                  ↓
    ┌─────────────┼──────────────┬───────────────┐
    ↓             ↓              ↓               ↓
Thức ăn      Nguyên liệu   Life Essence      World XP
(Farm,       (Cloud,       (nếu Great+)
 Aquarium)    Aquarium,
              chế biến)
    ↓             ↓
  Nuôi          Chế biến ──► công trình tốt hơn ──► ô đất nhiều hơn
    ↓                                                      ↓
  Phân ────────────────────────────────────────────► Phân bón ↻
```

**Vòng lặp hai chiều với Farm là trục chặt nhất của cả game** và không được làm hỏng: phân heo → phân bón →
cây → thức ăn → heo. Mọi thứ trong tài liệu này đều xây quanh trục đó, không thay thế nó.

---

# 3. NHỊP CHƠI MỤC TIÊU

| Khung | Người chơi làm gì |
|---|---|
| **1–3 phút** | Thu các ô đã chín, gieo lại, bấm "Tưới cả vườn" |
| **5–10 phút** | Thêm: quyết định luân canh, đặt cây đi kèm, bón phân cho lứa quan trọng, chế biến |
| **15–30 phút** | Thêm: dọn lại bố cục vườn theo cây đi kèm, chuẩn bị lứa Essence (tưới tay đúng cửa sổ) |
| **Vắng 1 ngày** | Vòi tưới giữ mọi thứ sống; về thu đủ sản lượng, Quality trần Good |
| **Vắng 1 tuần** | Mọi thứ đã chín và héo (−50%). **Không mất cây, không mất ô.** |

---

# 4. Ô ĐẤT

## 4.1 Cấu trúc

```text
Ô đất
├── Loại đất      (Thường / Ẩm / Nước)
├── Cây đang trồng
├── Tiến độ lớn   (0–100%)
├── Nước          (0–100)
├── Phân bón      (có / không)
├── Trí nhớ đất   (2 cây gần nhất — mục 5)
└── Vị trí trong lưới (dùng cho cây đi kèm — mục 6)
```

## 4.2 Ba loại đất

| Loại đất | Mở khi | Trồng được | Ghi chú |
|---|---|---|---|
| **Thường** | Có sẵn | Cây thường | 6 ô ban đầu |
| **Ẩm** | World Lv 8 | Cây thường (−10% thời gian) + cây ẩm | Cạnh nguồn nước |
| **Nước** | World Lv 12, cần 20 Ngọc trai | Chỉ cây nước (rong) | Nối Garden ↔ Aquarium |

Ô Nước là cách Garden phục vụ Aquarium mà không cần Aquarium tự trồng cây.

## 4.3 Mở rộng

| Mốc | Số ô | Giá | Điều kiện |
|---|---|---|---|
| Khởi đầu | 6 | — | Mở Garden |
| +3 | 9 | 200 | — |
| +3 | 12 | 500 | World Lv 6 |
| +3 | 15 | 1.200 | World Lv 9 |
| +3 | 18 | 3.000 | World Lv 12 |
| +3 | 21 | 7.000 + 10 Ngọc trai | World Lv 15 |
| +3 | 24 | 15.000 + 5 Vật liệu cổ | World Lv 18 |

Lưới vườn là **6 cột × 4 hàng**. Vị trí có ý nghĩa vì cây đi kèm (mục 6).

---

# 5. TRÍ NHỚ ĐẤT — luân canh

> **Đây là quyết định trung tâm của Sobi Garden.** Nó tốn đúng **không** thao tác thêm: người chơi vẫn chỉ
> bấm "gieo", chỉ là chọn gieo gì.

## 5.1 Luật

Mỗi ô nhớ **2 cây gần nhất**. Khi gieo, so nhóm cây mới với 2 cây đó:

| Tình huống | Hiệu ứng |
|---|---|
| Khác nhóm cả 2 lần trước | **+20% sản lượng, +1 cơ hội Quality** |
| Khác nhóm 1 trong 2 | Bình thường |
| Cùng nhóm cả 2 lần trước (lần thứ 3 liên tiếp) | **−30% sản lượng** |
| Ô vừa bón phân | Xóa trí nhớ đất về trạng thái trung tính |

## 5.2 Nhóm cây

```text
NGŨ CỐC    Lúa mì · Bắp · Lúa Trăng
CỦ         Khoai tây · Cà rốt · Củ Nghệ
LÁ         Cỏ · Rau Dại · Rong
HOA QUẢ    Bí Đỏ · Dâu Sương · Chuông Đất
```

## 5.3 Vì sao luật này đúng

- **Không trừng phạt người chơi ẩu.** Người bỏ qua hoàn toàn chỉ mất 30% trên lứa thứ 3 — vẫn lãi.
- **Thưởng người chơi để ý.** Luân phiên 3 nhóm là mẹo rất dễ học, và tự nhiên theo đúng cách nông dân thật làm.
- **Biến danh sách 12 cây thành một bài toán nhỏ** mà không cần thêm hệ thống nào.
- **Phân bón là lối thoát.** Ai không muốn nghĩ thì bón phân — phân bón vốn đã là sink của phân heo.

## 5.4 Hiển thị

Ô đất hiện **2 chấm màu nhỏ** ở góc = 2 cây gần nhất. Khi mở menu gieo hạt, cây được **+20%** có viền xanh,
cây bị **−30%** có viền xám mờ. Không có bảng, không có số, không có tooltip bắt buộc đọc.

---

# 6. CÂY ĐI KÈM — bố cục có ý nghĩa

Quyết định thứ hai lúc đặt. Cũng không tốn thao tác thêm.

Cây ở ô **kề ngang hoặc dọc** (không tính chéo) có thể tác động lẫn nhau:

| Cặp | Hiệu ứng | Lore |
|---|---|---|
| Cỏ ↔ bất kỳ | Cây kia **+10% tốc độ lớn** | Cỏ giữ ẩm cho đất |
| Bắp ↔ Bí Đỏ | Cả hai **+1 sản lượng** | Bí che gốc, bắp che nắng |
| Cà rốt ↔ Rau Dại | Cà rốt **+1 cơ hội Quality** | Rau dại đuổi sâu |
| Lúa Trăng ↔ Dâu Sương | Cả hai **+15% cơ hội Life Essence** | Hai cây đêm cộng hưởng |
| Củ Nghệ ↔ bất kỳ Ngũ cốc | Ngũ cốc **−10% thời gian lớn** | Nghệ làm tơi đất |
| Chuông Đất ↔ bất kỳ | Cây kia **+5% Quality**, Chuông Đất **−10% sản lượng** | Chuông Đất hút Life Essence xung quanh |

**Luật trình bày:** khi người chơi chọn một ô để gieo, các ô kề sáng nhẹ và hiện biểu tượng ✦ nếu có cặp phù
hợp với cây đang chọn. Chỉ vậy. Không bảng tra, không bắt học thuộc.

**Luật thiết kế:** mỗi hiệu ứng ≤ ±15%, và **không cặp nào là bắt buộc**. Bố cục tốt cho khoảng +25% tổng thể
— đủ để người thích tối ưu có việc làm, không đủ để người không quan tâm bị tụt lại.

Cặp mới được khám phá qua Codex (trồng cạnh nhau 1 lần → ghi vào Codex kèm một dòng lore).

---

# 7. DANH SÁCH CÂY

| Cây | Nhóm | Giá hạt | Thời gian | Sản lượng | Giá bán | Buổi | Công dụng chính |
|---|---|---:|---:|---:|---:|---|---|
| **Cỏ** | Lá | 2 | 1 giờ | 3 | 1 | mọi | Phân bón · ăn vặt heo · thức ăn cá thường |
| **Lúa mì** | Ngũ cốc | 4 | 3 giờ | 3 | 3 | mọi | Thức ăn heo |
| **Bắp** | Ngũ cốc | 5 | 4 giờ | 3 | 4 | mọi | Thức ăn heo · thức ăn cao cấp |
| **Khoai tây** | Củ | 6 | 5 giờ | 3 | 5 | mọi | **Thức ăn cá** · đơn hàng |
| **Cà rốt** | Củ | 8 | 6 giờ | 2 | 10 | mọi | Món yêu thích · thức ăn cao cấp |
| **Rau Dại** | Lá | 6 | 3 giờ | 4 | 4 | mọi | Thức ăn cá · đuổi sâu (mục 6) |
| **Bí Đỏ** | Hoa quả | 12 | 8 giờ | 2 | 18 | mọi | Thức ăn cao cấp · đơn hàng · trang trí mùa |
| **Dâu Sương** | Hoa quả | 15 | 5 giờ | 2 | 22 | **đêm** | Món yêu thích hiếm · nguyên liệu potion |
| **Lúa Trăng** | Ngũ cốc | 18 | 7 giờ | 2 | 25 | **đêm** | **Life Essence cao** · thức ăn Guardian |
| **Củ Nghệ** | Củ | 14 | 6 giờ | 2 | 16 | mọi | Nguyên liệu potion (Cloud) · thuốc nhuộm |
| **Chuông Đất** | Hoa quả | 30 | 10 giờ | 1 | 55 | mọi | **Life Essence rất cao** · nguyên liệu trang bị |
| **Rong** | Lá | 10 | 4 giờ | 4 | 7 | mọi (ô Nước) | **Thức ăn cá chính** · phân bón biển |

**Mở khóa cây theo World Level:** 5 cây đầu có sẵn khi mở Garden · Rau Dại Lv5 · Bí Đỏ Lv7 · Dâu Sương Lv9 ·
Củ Nghệ Lv10 · Lúa Trăng Lv12 · Rong Lv12 (cùng ô Nước) · Chuông Đất Lv15.

## 7.1 Cây đêm

Dâu Sương và Lúa Trăng **chỉ lớn trong khung 20:00–05:00** (buổi Đêm theo `GAME_BALANCE` §1). Ban ngày chúng
dừng tiến độ, **không héo, không chết**.

Lý do thiết kế: thế giới đã có hệ thống 4 buổi nhưng ban đêm hiện chỉ dùng để sinh vật ngủ. Cây đêm cho người
chơi buổi tối một lý do mở game, và tạo nhịp khác hẳn ban ngày — mà không ép ai phải thức.

Lore: Lúa Trăng mọc theo ánh sáng phản chiếu từ các mảnh đất trôi trên trời. Nó là cây duy nhất ở mặt đất
còn chạm được vào Sky Essence.

---

# 8. NƯỚC VÀ CỬA SỔ KHÁT

Áp dụng **Luật 1** của `LORE_TO_GAMEPLAY.md`: tự động giữ cho sống, bàn tay nâng chất lượng.

## 8.1 Nước

| Mức nước | Tốc độ lớn |
|---|---|
| 60–100 | ×1,0 |
| 20–59 | ×0,75 |
| 1–19 | ×0,5 |
| 0 | ×0,25 (**không bao giờ dừng hẳn, không bao giờ chết**) |

Nước giảm **−12/giờ**. Tưới một lần = đầy 100. Nước là vô hạn và miễn phí.

Thao tác hàng loạt bắt buộc: **"Tưới cả vườn"** — một nút, tưới mọi ô. Đây là thao tác mặc định; người chơi
bình thường chỉ cần nút này.

## 8.2 Cửa sổ khát

Mỗi cây có một **cửa sổ khát** nằm ở **giữa vòng đời**, kéo dài **30% thời gian lớn** (tối thiểu 45 phút thật).

> Tưới **bằng tay** trong cửa sổ đó → cây được **+1 bậc Quality** khi thu hoạch.

- Hiển thị: ô đất hiện biểu tượng giọt nước nhấp nháy chậm. Không âm thanh, không đếm ngược.
- **Nút "Tưới cả vườn" cũng tính là tưới tay.** Người chơi không phải tưới từng ô.
- Vòi tưới tự động tưới ngoài cửa sổ: cây vẫn đủ nước, nhưng **không** được +1 bậc.
- Nếu vòi tự động vừa khớp cửa sổ: vẫn **không** tính. Chất lượng là phần thưởng cho sự có mặt.
- Bỏ lỡ cửa sổ: không mất gì. Cây vẫn lớn, vẫn thu được, chỉ là trần Quality thấp hơn một bậc.

## 8.3 Vòi tưới tự động

| Cấp | Phạm vi | Giá | Điều kiện |
|---|---:|---:|---|
| Lv1 | 6 ô | 500 | — |
| Lv2 | 12 ô | 1.800 | World Lv 8 |
| Lv3 | 24 ô (cả vườn) | 5.000 + 15 Ngọc trai | World Lv 14 |

Vòi tưới giữ nước ở mức ≥ 60 mọi lúc. Nó là **tiện nghi**, không phải tối ưu.

---

# 9. PHÂN BÓN

| Loại | Công thức | Hiệu ứng |
|---|---|---|
| **Phân bón thường** | Phân ×3 + Cỏ ×1 → ×2 (Thùng ủ, 30 phút) | −25% thời gian, +1 sản lượng, xóa trí nhớ đất |
| **Phân bón biển** | Phân bón ×2 + Rong ×2 → ×3 (Thùng ủ, 45 phút) | Như trên, **+1 cơ hội Quality** |
| **Phân bón Sương** | Phân bón biển ×1 + Dâu Sương ×1 → ×1 (Thùng ủ, 2 giờ) | Như trên, **+10% cơ hội Life Essence** |

Phân bón **không bắt buộc**. Nó là công cụ tối ưu và là lối thoát cho người không muốn nghĩ về luân canh.

**Phân heo bán được từ GĐ2** với giá 1 Coin/đống. Sửa lỗ hổng: trước đây heo thải phân từ GĐ2 nhưng Thùng ủ
tới GĐ5 mới có, nên phân là tài nguyên chết trong 3 giai đoạn.

---

# 10. QUALITY VÀ LIFE ESSENCE

## 10.1 Tính Quality

Dùng chung thang 5 bậc của thế giới. Điểm chăm sóc của một lứa cây:

```text
Điểm = 50 (nền)
     + 20  nếu tưới tay trong cửa sổ khát
     + 15  nếu có bón phân
     + 10  nếu luân canh đúng (khác nhóm cả 2 lần trước)
     +  5  mỗi hiệu ứng cây đi kèm đang áp dụng (tối đa +10)
     − 20  nếu nước về 0 bất kỳ lúc nào trong vòng đời
     − 25  nếu để héo (chín quá 48 giờ)
```

| Điểm | Quality |
|---:|---|
| ≥ 90 | Perfect |
| ≥ 75 | Excellent |
| ≥ 60 | Great |
| ≥ 40 | Good |
| < 40 | Normal |

**Trần khi hoàn toàn tự động:** không tưới tay = tối đa 50 + 15 + 10 + 10 = 85 → Excellent là có thể, nhưng
Perfect thì không. Đúng tinh thần Luật 1: người bận vẫn lên được bậc cao nếu chơi khéo, chỉ bậc cao nhất là
phần thưởng cho sự có mặt.

Quality ảnh hưởng: **giá bán** (×1,0 / 1,2 / 1,5 / 2,0 / 3,0) và **Life Essence**.

## 10.2 Life Essence

| Quality khi thu | Life Essence |
|---|---:|
| Great | 1 |
| Excellent | 2 |
| Perfect | 3 |

Nhân thêm theo cây: cây thường ×1 · **Lúa Trăng ×2** · **Chuông Đất ×3**.

Life Essence chỉ dùng để tinh luyện Sobi Essence ở Bàn Cộng Hưởng, và đổi hạt hiếm. Xem
`LORE_TO_GAMEPLAY.md` §3.

---

# 11. HÉO — hình phạt duy nhất, và nó nhẹ

Cây chín mà không thu trong **48 giờ** → héo: sản lượng **−50%**, không có Life Essence, vẫn thu được.

**Cây không bao giờ chết. Ô đất không bao giờ mất. Không có sâu bệnh ở Garden.**

Garden là Area đầu tiên người chơi gặp sau Farm. Nó phải dạy rằng thế giới này không trừng phạt người vắng nhà.
(Sâu bệnh là cơ chế của Cloud — nơi người chơi đã quen luật chơi và đã có trợ thủ tự động.)

---

# 12. CÔNG TRÌNH

| Công trình | Lv1 | Lv2 | Lv3 | Lv4 |
|---|---|---|---|---|
| **Vòi tưới** | 6 ô · 500 | 12 ô · 1.800 | 24 ô · 5.000 + 15 Ngọc trai | — |
| **Máy xay** (Feed Mill) | 1 khe · 800 | 2 khe, −20% thời gian · 2.500 | 3 khe, −35% · 6.000 + 10 Ngọc trai | 4 khe, −50% · 15.000 + 5 Vật liệu cổ |
| **Thùng ủ** | 1 khe · 600 | 2 khe · 2.000 | 3 khe, +1 sản lượng · 5.500 + 10 Ngọc trai | — |
| **Nhà kính** | — | — | Lv 15 · 12.000 + 20 Ngọc trai | Cây đêm lớn được cả ban ngày (×0,6 tốc độ) |

Nhà kính là phần thưởng late-game cho người đã đầu tư vào cây đêm: nó không xóa cơ chế, chỉ nới nó.

**Ngọc trai đến từ Aquarium, vật liệu cổ đến từ Adventure *hoặc* mảnh di tích của Aquarium.** Garden không có
nhánh nâng cấp nào bị khóa cứng sau một Area duy nhất.

---

# 13. RECIPE

| Recipe | Đầu vào | Đầu ra | Thời gian | Công trình |
|---|---|---|---:|---|
| Thức ăn heo | Bắp ×2 + Lúa mì ×1 | ×4 | 10 phút | Máy xay |
| Thức ăn cao cấp | Bắp ×2 + Cà rốt ×1 | ×2 | 20 phút | Máy xay |
| **Thức ăn cá** | Khoai tây ×1 + Rau Dại ×1 | ×3 | 15 phút | Máy xay |
| **Thức ăn cá cao cấp** | Rong ×2 + Khoai tây ×1 | ×3 | 25 phút | Máy xay |
| **Thức ăn Guardian** | Lúa Trăng ×2 + Cà rốt ×1 | ×1 | 1 giờ | Máy xay Lv3 |
| Phân bón | Phân ×3 + Cỏ ×1 | ×2 | 30 phút | Thùng ủ |
| Phân bón biển | Phân bón ×2 + Rong ×2 | ×3 | 45 phút | Thùng ủ |
| Phân bón Sương | Phân bón biển ×1 + Dâu Sương ×1 | ×1 | 2 giờ | Thùng ủ Lv2 |

**Thứ tự giải quyết khi bù offline** (sửa edge case audit đã nêu): recipe chạy theo **thứ tự người chơi đặt
vào khe**, không theo thứ tự trong bảng. Khe thiếu nguyên liệu thì dừng và giữ nguyên liệu đã nạp, không hủy.

---

# 14. GIAO DIỆN — tối thiểu thao tác

**Nguyên tắc:** người chơi bình thường chỉ cần **3 nút**.

```text
┌─────────────────────────────────────┐
│  [ Tưới cả vườn ]  [ Thu tất cả ]   │
│  [ Gieo lại như cũ ]                │
└─────────────────────────────────────┘
```

- **Tưới cả vườn** — một lần cho mọi ô. Tính là tưới tay (mục 8.2).
- **Thu tất cả** — thu mọi ô đã chín.
- **Gieo lại như cũ** — gieo lại đúng cây vừa thu vào đúng ô đó. **Tự động tránh lần thứ 3 liên tiếp**: nếu
  gieo lại sẽ dính phạt luân canh, nút sẽ đổi sang cây cùng vị trí trong vòng luân canh gợi ý, và báo một dòng
  nhỏ "Đã đổi sang Bắp để đất nghỉ".

Điểm cuối cùng là quan trọng nhất của cả tài liệu này: **hệ thống luân canh phải tự chăm sóc người chơi không
muốn nghĩ về nó.** Chiều sâu dành cho người tìm nó; sự tiện lợi là mặc định.

Bón phân và đặt cây đi kèm là thao tác **tùy chọn**, nằm trong menu từng ô.

---

# 15. CODEX GARDEN

Tab của Codex chung, không phải sổ riêng.

| Mục | Mốc |
|---|---|
| **Cây** | Trồng lần đầu → ghi; thu Perfect lần đầu → ghi kỷ lục |
| **Cặp cây đi kèm** | Trồng cạnh nhau 1 lần → mở, kèm một dòng lore |
| **Kỷ lục** | Lứa Quality cao nhất từng đạt của mỗi cây |

**Mốc thưởng:**

| Mốc | Thưởng |
|---|---|
| 6 cây | +3 ô đất miễn phí |
| 6 cặp cây đi kèm | Công thức Phân bón biển |
| 12 cây | Hạt Chuông Đất ×3 |
| Perfect ở 6 cây khác nhau | Công thức Phân bón Sương |
| Perfect ở toàn bộ 12 cây | **Danh hiệu "Người Giữ Đất"** + ô đất Nước miễn phí |

---

# 16. LIÊN KẾT VỚI AREA KHÁC

| Chiều | Nội dung |
|---|---|
| Garden → **Farm** | Thức ăn heo, thức ăn cao cấp, món yêu thích (Cà rốt, Dâu Sương), Thức ăn Guardian |
| Garden → **Aquarium** | Thức ăn cá, thức ăn cá cao cấp, Rong giống |
| Garden → **Cloud** | Củ Nghệ và Dâu Sương làm nguyên liệu potion |
| Garden → **Adventure** | Thức ăn Guardian (buff trước trận), Chuông Đất (vật liệu trang bị) |
| **Farm** → Garden | Phân → phân bón |
| **Aquarium** → Garden | Ngọc trai (công trình), Rong giống đầu tiên, phân bón biển |
| **Cloud** → Garden | Sky Water: tưới 1 lần cho toàn vườn ở mức "tưới tay" — **vật phẩm tiện nghi**, không bắt buộc |
| **Adventure** → Garden | Hạt giống hiếm, vật liệu cổ cho Máy xay Lv4 |

Sky Water là ví dụ của một liên kết đúng: nó cho người chơi Cloud một món quà dùng được ở Garden, nhưng nó
chỉ tiết kiệm thao tác chứ không tạo ra sức mạnh mà người không chơi Cloud bị thiếu.

---

# 17. OFFLINE

Theo luật chung: **trần 30 ngày** (không phải trần riêng của Area).

Khi bù offline, Garden tính: tiến độ lớn, tiêu hao nước, vòi tưới hoạt động, cây chín, héo sau 48 giờ, recipe
chạy trong Máy xay và Thùng ủ.

`getSummary()` trả về cho màn hình "Trong lúc bạn vắng nhà":

> 🌱 **Khu vườn** — 8 ô đã chín · 3 ô bị héo · Máy xay đã làm xong 12 Thức ăn heo · Thùng ủ xong 4 Phân bón

Cây đêm chỉ tiến triển trong các khung Đêm đã trôi qua — tính bằng số giờ đêm trong khoảng vắng mặt, không
phải tổng thời gian.

---

# 18. SAVE DATA

```text
areas.sobi_garden
├── schemaVersion
├── plots[]
│     ├── index           (vị trí trong lưới 6×4)
│     ├── soilType        ('normal' | 'moist' | 'water')
│     ├── crop            (id | null)
│     ├── plantedAt
│     ├── growth          (0–100)
│     ├── water           (0–100)
│     ├── fertilizer      (null | 'basic' | 'sea' | 'dew')
│     ├── careScore       (điểm chăm sóc tích lũy, mục 10.1)
│     ├── wateredInWindow (bool)
│     ├── memory          [cropGroup, cropGroup]   ← trí nhớ đất
│     └── readyAt / witheredAt
├── unlockedPlots
├── buildings      { sprinkler, feedMill, composter, greenhouse }
├── productionSlots[]  { building, recipe, startedAt, inputsConsumed }
└── codex          { cropsSeen[], pairsSeen[], bestQuality{} }
```

Hạt giống, nông sản, phân bón, Life Essence **nằm trong túi đồ chung**, không trong state của Area.

---

# 19. MVP (GĐ5)

## Bắt buộc
- 6 ô đất Thường, mở rộng tới 12
- 7 cây đầu (Cỏ → Bí Đỏ), chưa có cây đêm và cây nước
- Nước + cửa sổ khát + "Tưới cả vườn"
- Trí nhớ đất (luân canh) + nút "Gieo lại như cũ" thông minh
- Héo
- Quality + Life Essence
- Vòi tưới Lv1–2, Máy xay Lv1–2, Thùng ủ Lv1–2
- 6 recipe đầu
- Tab Codex Garden
- Admin: sửa cây, recipe, bảng luân canh, cặp cây đi kèm

## Chưa cần ở MVP
- Cây đêm (cần sau khi hệ thống buổi đã ổn định ở GĐ2)
- Ô đất Ẩm và Nước (cần Aquarium, GĐ8)
- Cây đi kèm (có thể thêm ở GĐ6 cùng Codex đầy đủ)
- Nhà kính, Phân bón Sương, Thức ăn Guardian

---

# 20. GUARDRAILS — những thứ KHÔNG làm với Garden

- ❌ **Không thêm sâu bệnh.** Đó là cơ chế của Cloud. Garden phải là Area an toàn nhất.
- ❌ **Không cho cây chết.** Héo −50% là hình phạt tối đa.
- ❌ **Không thêm mùa bắt buộc.** Thời tiết (GĐ12) chỉ được tạo cơ hội, không được khóa cây.
- ❌ **Không bắt tưới từng ô.** "Tưới cả vườn" luôn phải là một nút và luôn tính là tưới tay.
- ❌ **Không làm luân canh thành bài tập.** Nếu người chơi phải mở bảng tra để gieo hạt, cơ chế đã sai — nút
  "Gieo lại như cũ" phải tự xử lý giúp họ.
- ❌ **Không thêm Garden Level.** XP cộng vào Sobi World Level.
- ❌ **Không thêm trần offline riêng.** 30 ngày, như cả thế giới.
- ❌ **Không tự dựng nhiệm vụ / thương nhân / túi đồ riêng.** Dùng hệ thống chung ở Sảnh.
