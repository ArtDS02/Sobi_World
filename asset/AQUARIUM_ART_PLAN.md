# Sobi Aquarium — Kế hoạch art, layout và bộ prompt (GĐ14)

**Ngày:** 2026-10-13 · **Trạng thái:** đề xuất, chờ chủ dự án duyệt (các điểm cần chốt ở §0)
**Nguồn gameplay:** decision 015 + `content/aquarium/*.json` + `src/areas/aquarium/` (đã freeze, decision 021). Tài liệu này không đổi logic, trừ **cấp bể 5** do chủ dự án chốt (decision 026).
**Chuẩn hình:** phong cách Sobi Farm (decision 022) trong cách dựng cảnh của Sobi Cloud đã duyệt (decision 023: nền vẽ sẵn 2:1, vật tương tác là sprite riêng, chữ do game viết, HUD pastel tím–trắng).

---

## 0. Điểm cần chủ dự án chốt trước khi tạo ảnh

| # | Đề xuất | Vì sao |
|---|---|---|
| 1 | ✅ **Đã chốt (2026-10-13): 5 cấp môi trường**, gắn 5 cấp bể: 4 cấp có sẵn + **cấp 5 "Đại Dương Sâu"** (decision 026). Số của cấp 5 (sức chứa, giá, vật liệu, lọc) là đề xuất, chờ duyệt. | Thêm một dòng vào `tank.levels` của `content/aquarium/balance.json`; code đọc số cấp từ content, save không cần migration. |
| 2 | Khung thiết kế Aquarium đổi **1600×900 → 1800×900 (2:1)** như Cloud (1816×900) và Sảnh (1932×900). | Phủ kín màn hình rộng, cùng nhịp HUD với Cloud. Chỉ đổi phần trình bày (`aquariumView.ts`). |
| 3 | Nền đổi theo cấp bể: `bg_aquarium` → `bg_aquarium_t1..t5`; lớp tiền cảnh theo cấp; vài sprite mới (§4). | Cần **dòng manifest mới** (decision 022: hỏi trước). |
| 4 | Ảnh riêng cho Cô Gà Mơ Màng (`npc_fisher`, đang mượn `prop_animal_hen_cream`). | Đổi `artId` trong `content/shared/npcs.json` (như Cú Giả Kim). |
| 5 | Sinh vật trang trí mỗi cấp (mòng biển, ếch, cua, rùa, sứa) — chỉ trang trí như chim mây, không gameplay, không save. | Tạo cảm giác sống động; có tiền lệ ở Cloud. Có thể bỏ. |

---

## 1. Định hướng nghệ thuật tổng thể

**Một câu:** *"Bến cá nhỏ ấm áp, mỗi lần nâng bể là một lần mở rộng ra biển."* Người chơi bắt đầu với một bể kính trên cầu gỗ, và mỗi cấp bể là một không gian nuôi lớn hơn, sâu hơn, nhiều màu hơn — nhưng vẫn là **cùng một bến**, cùng một khung màn hình.

### 1.1 Kế thừa từ Sobi Cloud (giữ nguyên)
- Nét vẽ Farm: viền nâu ấm (không đen), đổ bóng cel 1 tông tối + 1 tông sáng, nắng từ trên-trái, pastel bão hòa vừa, hơi có vân vẽ, khối tròn mũm mĩm, chi tiết thấp–vừa (`GAME_ART_DIRECTION.md`).
- Cách dựng: **một nền vẽ sẵn tỉ lệ 2:1** không chứa UI; mọi thứ bấm được (bể, bến, bảng, trứng, vảy, cá) là sprite riêng; bảng gỗ / băng rôn để trống, game viết chữ.
- HUD: viên thuốc trắng–tím nhạt chữ tím đậm ở trên; thanh dưới pastel bo tròn; chân dung NPC góc dưới trái; băng rôn tên tầng ở giữa dưới.

### 1.2 Bản sắc riêng của Aquarium
| Yếu tố | Cloud | Aquarium |
|---|---|---|
| Góc nhìn | 3/4 từ trên xuống, đảo nổi | **Mặt cắt ngang mực nước**: ~25% trên là bờ/trời, ~75% dưới là nước. Cá nhìn ngang, quay phải (standard). |
| Màu chủ | kem, tím lavender, trắng mây | **ngọc lam (aqua), xanh ngọc bích, cát kem, gỗ ấm**; điểm nhấn san hô hồng đào, vàng nắng |
| Ánh sáng | nắng trưa dịu, cầu vồng | nắng rọi xuống nước thành **vệt sáng (god rays)** + **vân sáng đáy (caustics, code)**; càng sâu càng mát |
| Chất liệu | mây bông, gỗ, đá | **kính, nước trong, đá cuội bo tròn, rong mềm, san hô bông, vỏ sò, dây thừng, gỗ bến** |
| Chuyển động | mây trôi, hoa đung đưa | bong bóng, rong lắc, cá bơi, gợn mặt nước, phao nhấp nhô (tất cả code) |

### 1.3 Luật nhất quán (áp dụng mọi ảnh)
1. **Mực nước cố định** ở y ≈ 250 / 900 ở T1–T4; **T5 chìm hẳn dưới nước** (không mặt nước, ánh sáng rọi từ ngoài khung trên). **Vùng cá bơi và mọi chỗ bấm cố định** ở cả 5 cấp (§3.1). Đổi cấp chỉ đổi "vỏ", không đổi chỗ bấm.
2. Chỗ câu luôn ở **góc phải trên** (T1–T4: bến gỗ trên mực nước; T5: dây câu thả từ trên xuống, lưỡi câu có đèn mồi); bảng "Bể cá" luôn **bên trái** (T5: cắm trên gờ đá dưới nước).
3. Vùng cá bơi trên nền phải **sáng và ít chi tiết** (nước trong, đáy cát) để cá đọc rõ; chi tiết dày dồn ra mép trái, mép phải, đáy.
4. Không chữ, không số, không logo trong mọi ảnh dùng cho game. Chữ chỉ có trong UI của game.
5. Không người. Sinh vật đều là con vật dễ thương kiểu Farm (đầu không to hơn thân, không mặt nhìn thẳng kiểu sticker).
6. Nền ảnh asset rời: xám phẳng `#C8C8C8`; nền cảnh: phủ kín (ngoại lệ duy nhất).
7. Cá nhìn ngang quay **phải**; sinh vật trang trí đi lại tự do (code lật hình).

---

## 2. Các cấp môi trường

| Cấp bể | Tên đề xuất (vi) | Sức chứa · lọc | Điều kiện (có sẵn) | Bản sắc thị giác |
|---|---|---|---|---|
| 1 | **Bể Kính Bên Bến** | 5 cá · ×1 | khởi đầu | Buổi sáng nắng trên cầu gỗ bến cá. Một bể kính bo tròn trên chân gỗ; phía sau là vịnh xanh ngọc, nhà thuyền nhỏ, phao cứu sinh, giỏ lưới. Nhỏ, gọn, ấm cúng. |
| 2 | **Hồ Đá Ven Bờ** | 8 cá · ×0,85 | 800 Sobi Coin | Buổi chiều sớm. Bể được thay bằng một hồ đá tự nhiên ở mép bờ: đá cuội phủ rêu, lá súng, cỏ nến, hoa sen nhỏ; dưới nước xanh ngọc bích, rong đuôi chó, sỏi màu. "Cá đã ra thiên nhiên". |
| 3 | **Đầm San Hô Sinh Thái** | 12 cá · ×0,7 | 2.500 + 10 vảy | Trưa nắng nhiệt đới. Đầm nước lợ: rễ đước bên trái, bãi cát, san hô mềm hồng–cam, hải quỳ (nhà cá Hề), cỏ biển, sao biển, sò to; vệt nắng xuyên nước. Rực rỡ, đông vui. |
| 4 | **Vịnh Ngọc Trai Cổ** | 16 cá · ×0,6 | 8.000 + 20 vảy + 3 ngọc trai + 4 bánh răng cổ | Hoàng hôn tím–xanh. Vịnh sâu dưới vách đá, cột đá cổ đổ nghiêng có hoa văn bánh răng (nối với Tàn tích của Adventure), sò ngọc khổng lồ phát sáng nhẹ, rừng tảo bẹ, đốm sáng sinh học (hợp cá Phát Sáng / Đèn Lồng / Trăng). Huyền bí nhưng vẫn dịu, dễ thương. |
| 5 (mới) | **Đại Dương Sâu** | 20 cá · ×0,5 *(đề xuất)* | 20.000 + 40 vảy + 5 ngọc trai + 8 bánh răng cổ *(đề xuất)* | Chìm hẳn dưới đại dương, không còn mặt nước. Vệt sáng rọi từ trên cao, cá voi hiền khổng lồ, cá đuối manta, tháp san hô và tảo bẹ khổng lồ, vách hẻm vực mờ dần nhiều lớp, san hô và sứa phát quang ở mép. Hùng vĩ, sâu thẳm, kỳ diệu; vẫn dễ thương, không đáng sợ. |

**Cảm giác tiến triển:** nhỏ → rộng, nhân tạo → tự nhiên → hệ sinh thái → bí ẩn cổ xưa → đại dương bao la; sáng sớm → chiều → trưa nhiệt đới → hoàng hôn → lặn hẳn xuống biển sâu; màu ấm gỗ → xanh rêu → san hô rực → xanh tím → xanh chàm phát quang. Mực nước giữ cùng một chỗ ở mọi cấp; độ sâu thể hiện bằng màu nước (càng lên cấp càng xanh sâu ở mép và đáy).

**Ban đêm / thời tiết** (đã có trong game): không vẽ nền đêm riêng. Code phủ màu đêm (`night` 0x10204a) + làm cá đêm phát sáng (cộng sáng), thời tiết là lớp phủ / hạt. Nền vẽ cần để chỗ trời đủ rộng cho lớp phủ. Riêng T5 (dưới biển sâu, không có trời) lớp phủ đêm nhẹ hơn (khoảng một nửa) và chủ yếu làm tối vệt sáng, để không quá tối.

---

## 3. Layout chi tiết

### 3.1 Khung chung (mọi cấp) — thiết kế 1800 × 900

```text
y   0 ┌───────────────────────────────────────────────────────────────────────────────┐
      │ [Coin][Nước 82%][Cấp 17 ▬▬▬]                          [Ra Sảnh][Vật phẩm][Menu] │ HUD trên (0–80)
  80  │ (chip buổi / thời tiết)                                                         │
      │   TRỜI + BỜ (nền)                                         ┌──── Bến câu ────┐   │
      │  ┌Bảng "Bể cá"┐                                            │ bld_fish_dock   │   │
 250  │~~└────────────┘~~~~~~~~~~~ mực nước ~~~~~~~~~~~~~~~~~~~~~~~~│  ~ phao ~       │~~~│
      │      ┌──────────────── VÙNG CÁ BƠI 1120 × 420 ────────────────┐ └─────────────┘   │
      │ rong │   (x 330–1450, y 270–690; nền sáng, ít chi tiết)        │  san hô / đá      │
      │ / đá │                                                         │  mép phải         │
 690  │      │ [trứng]                                   [đống vảy ⑥]  │                   │
      │  ░░░░ TIỀN CẢNH (sprite riêng, che trước cá) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
 720  │                    ╔═══ băng rôn tên cấp ═══╗                                    │
 800  │[NPC]┌─────────────────────────────────────────────────────────────────────────┐ │
      │     │ 🐟 3/5  💧▬▬▬ 82%  🥚 1  │ [Câu cá][Cho ăn][Thay nước][Thu vảy][Túi][Bể][Đẻ] │ │ thanh dưới (800–900)
 900  └─────┴─────────────────────────────────────────────────────────────────────────┴─┘
```

| Vùng | Vị trí (px, khung 1800×900) | Nội dung | Tương tác (đã có) |
|---|---|---|---|
| HUD trên trái | 16–640, 12–64 | Sobi Coin · **Độ trong nước %** (thay ô "Nước tinh khiết" của Cloud) · Cấp + thanh KN | — |
| Chip buổi | 16, 76 | Sáng/Ngày/Chiều/Đêm + thời tiết | — |
| HUD trên phải | 1440–1784, 12–64 | Ra Sảnh · Vật phẩm · Menu | như Cloud |
| Bảng "Bể cá" | 90–390, 170–260 (bảng gỗ biển trống) | chữ "Bể cá", viên số cấp bể | mở hộp thoại Bể (nâng cấp) |
| Bến câu | 1420–1790, 120–420 | `bld_fish_dock`, phao nhấp nhô ở mặt nước | mở Bến câu (mini-game) |
| Vùng cá bơi | 330–1450, 270–690 | cá (code), bong bóng | bấm cá → thẻ cá |
| Trứng | 380–620, 650–690 | `prop_fish_egg` × ≤ 2, nở có hiệu ứng | — |
| Đống vảy | 1300–1420, 630–690 + viên số | `prop_scale_pile` | thu vảy |
| Tiền cảnh | dải 0–1800, 640–800 | 3–5 sprite rong / san hô / đá theo cấp, trước cá | — (chỉ hình) |
| Băng rôn | 650–1150, 715–795 | `prop_title_banner_sea`, tên cấp bể | rê chuột nảy nhẹ |
| Chân dung NPC | 12–112, 790–890 | Cô Gà Mơ Màng | trò chuyện (đã có) |
| Thanh dưới trái | 130–620, 810–890 | sức chứa `n/cap`, đồng hồ nước, số trứng | — |
| Thanh dưới phải | 640–1784, 810–890 | 7 nút có icon (đúng 7 nút của `bar`), dòng lý do khi tắt | như hiện tại |

Lớp vẽ (depth): nền → (cấp 1: bể kính) → trứng / vảy → cá → nước đục (code) → tiền cảnh → bến → bong bóng → đêm → HUD.

### 3.2 Riêng từng cấp

**T1 — Bể Kính Bên Bến.** Nền: cầu gỗ chạy ngang dưới đáy khung, vịnh xanh phía sau, nhà thuyền nhỏ bên trái, giỏ lưới / phao / thùng gỗ ở mép. `bld_fish_tank` (bể kính bo tròn, chân gỗ) đứng giữa, lòng bể = vùng cá bơi (bể to, chiếm 1120×420). Mực nước của bể ≈ y 270. Tiền cảnh: 2 cây rong nhỏ trong bể, 1 lâu đài gốm. Không có tiền cảnh ngoài bể.

**T2 — Hồ Đá Ven Bờ.** Không còn kính: vùng cá là lòng hồ đá mặt cắt. Trên mực nước: bờ đá rêu, lá súng nổi, cỏ nến bên trái, bụi hoa bên phải dưới bến. Dưới nước: thành hồ đá cong bo hai bên, đáy sỏi màu. Tiền cảnh: cụm rong đuôi chó, tảng đá rêu, hoa súng tím, cỏ nến.

**T3 — Đầm San Hô Sinh Thái.** Trên mực nước: rễ đước và tán lá bên trái, bãi cát + cây dừa nhỏ bên phải dưới bến. Dưới nước: vệt nắng chéo, đáy cát gợn, san hô ở hai mép. Tiền cảnh: hải quỳ (cá Hề núp), san hô bông hồng, cỏ biển, sò to, sao biển.

**T4 — Vịnh Ngọc Trai Cổ.** Trên mực nước: vách đá, cột đá cổ đổ nghiêng có hoa văn bánh răng, trời hoàng hôn tím–cam. Dưới nước: xanh lam đậm dần xuống đáy nhưng **vùng cá vẫn đủ sáng** (giữa khung sáng nhất), vòm đá cổ ở xa, rừng tảo bẹ hai mép, đốm sáng xanh nhạt. Tiền cảnh: sò ngọc khổng lồ (chỉ trang trí, ngọc trai thật vẫn câu từ trai ngọc), tảo bẹ, mảnh cột đá có bánh răng, san hô phát sáng.

**T5 — Đại Dương Sâu.** Chìm hẳn dưới nước, không có mặt nước, trời hay bờ. Vệt sáng rọi từ ngoài khung phía trên xuống giữa (vùng cá sáng nhất); cá voi hiền khổng lồ lướt qua nền trên, cá đuối manta xa phía sau, đàn cá bạc nhỏ xoáy ở xa; tháp san hô và tảo bẹ khổng lồ hai mép, vách hẻm vực xanh mờ dần nhiều lớp (cảm giác hùng vĩ, sâu thẳm); san hô, hải quỳ phát quang, sứa đèn lồng ở mép; đáy cát nhạt kết thúc ở mép vực. Xanh chàm đậm chỉ ở mép xa và hai góc dưới. Bảng "Bể cá" cắm trên gờ đá rêu bên trái; chỗ câu là **dây câu thả từ trên xuống** ở góc phải trên (`bld_fish_line_deep`, thay `bld_fish_dock` ở cấp này, cùng vùng bấm). Không có cột đá / tàn tích (đó là bản sắc T4). Tiền cảnh: san hô phát quang, cụm hải quỳ sáng, sứa nhỏ, đá vực, cỏ biển sâu.

**Chuyển cấp** (khi `toast.upgraded`): màn bong bóng dâng từ đáy che kín 0,6 s → đổi nền + tiền cảnh → bong bóng tan; băng rôn bật tên mới. Code, tắt khi "Giảm chuyển động".

---

## 4. Danh sách asset

Ký hiệu backend: **G** Gemini (sheet hoặc ảnh sửa), **K** code vẽ, **D** K-derive (icon cắt từ sprite đã duyệt), **VFX** hiệu ứng code. Mới = cần thêm dòng manifest (§0.3).

### 4.1 Ưu tiên P0 — để màn chơi được và đẹp ở cấp 1

| Id | Cỡ canvas | Dùng chung / riêng | Backend | Mới? |
|---|---|---|---|---|
| `fish_goldfish` … `fish_moonfish` (12) | 192×120 | chung mọi cấp | G, 2 sheet 2×3 | có sẵn |
| `bg_aquarium_t1` | 1800×900 | T1 | G: mock → sửa thành nền | mới (thay `bg_aquarium`) |
| `bld_fish_tank` | 640×400 → đề xuất 1200×520 | T1 | G | có sẵn (đổi cỡ) |
| `bld_fish_dock` | 520×300 → đề xuất 400×320 | T1–T4 | G | có sẵn (đổi cỡ) |
| `bld_fish_line_deep` (dây câu + lưỡi câu + đèn mồi, thả từ trên xuống) | 160×420 | T5 (thay bến) | G, ô 3 của AQ-W1 | mới |
| `prop_sign_plank_sea`, `prop_title_banner_sea` | 300×110, 520×198 | chung | G | mới |
| `prop_fish_egg`, `prop_scale_pile`, `prop_fishing_bobber` | 64×64, 128×96, 64×80 | chung | G | mới |
| `ui_item_scale`, `ui_item_pearl`, `ui_item_food_fish` | 128×128 | chung (túi đồ, đơn hàng) | G | có sẵn |
| `ui_item_fish_*` (12) | 128×128 | chung | D từ sprite cá | có sẵn |
| 8 icon nút / HUD (`ui_icon_aq_*`) | 96×96 | chung | G, sheet 2×4 | mới |
| Dùng lại: `ui_icon_coin`, `ui_icon_xp`, `ui_icon_hunger`, `ui_icon_health` (thay emoji 🍽 / 🤒 trên cá) | | chung | đã có | — |

### 4.2 P1 — các cấp tiếp theo

| Id | Cỡ | Riêng | Backend |
|---|---|---|---|
| `bg_aquarium_t2` … `_t5` | 1800×900 | từng cấp | G: mock → sửa thành nền |
| `fg_aq_t1_*` … `fg_aq_t5_*` (4–5 mỗi cấp, ~23) | 160–360 px | từng cấp | G, 1 sheet 2×3 mỗi cấp |
| `npc_fisher` (Cô Gà Mơ Màng) | 240×300 | chung | G (bảng `creature`) |

### 4.3 P2 — làm sống thế giới (tùy chọn)

| Id | Riêng | Backend |
|---|---|---|
| `prop_aq_seagull` (T1), `prop_aq_frog` (T2), `prop_aq_crab` (T3), `prop_aq_turtle` (T4), `prop_aq_jellyfish` (T5) | từng cấp | G, 1 sheet 1×6 cùng NPC |
| Ảnh concept tổng thể, 5 mock layout | — (tham khảo, **không vào game**) | G |

### 4.4 Hiệu ứng code (không cần ảnh)
Bong bóng (cá thở, máy lọc T1, đáy), vân sáng đáy (caustics) trượt chậm, vệt nắng nhấp nháy nhẹ, gợn mặt nước + phao nhấp nhô, nước bắn khi câu được, viên thức ăn rơi khi cho ăn, nước đục (màu phủ theo `water`), làm trong nước (sóng sáng quét ngang), vảy lấp lánh, trứng rung rồi nở, cá đêm phát sáng, rong / tảo lắc, hover (bể sáng mép, bến nảy, bảng phóng nhẹ), chuyển cấp bằng bong bóng. Tất cả tắt khi "Giảm chuyển động".

### 4.5 Bảng tái sử dụng
- **Chung 5 cấp:** 12 cá, icon cá, vảy / ngọc / thức ăn, trứng, đống vảy, phao, bến, bảng gỗ, băng rôn, 8 icon, NPC, mọi VFX, toàn bộ HUD.
- **Riêng từng cấp:** 1 nền + 4–5 tiền cảnh (+ 1 sinh vật trang trí). Cấp 1 thêm bể kính.
- → Thêm một cấp mới chỉ tốn **2–3 lượt Gemini** (mock, nền, tiền cảnh).

---

## 5. Bộ prompt

### 5.0 Cách dùng
- Mỗi prompt = **một cuộc trò chuyện Gemini mới** (AI Studio để không có watermark). Đính kèm đúng file, đúng thứ tự, dán nguyên khối `text`.
- File đính kèm:
  - `REF_CLOUD_BG` = `public/assets/environment/bg_cloud.png` (cảnh đã duyệt: cách vẽ cảnh)
  - `REF_CLOUD_MOCK` = `asset/reference/sobi_cloud/cloud_layout_mock.png` (cách đặt UI)
  - `1_style_<board>.png` = bảng phong cách do `batch.mjs prep` ghép từ art Farm (`creature`, `item`, `building`, `flora`)
  - `REF_AQ_CONCEPT` = ảnh concept 5.1 đã chọn (`asset/reference/sobi_aquarium/aquarium_concept.png`)
  - `MOCK_Tn.png` = ảnh mock cấp n đã được duyệt (bước 5.2)
- **Concept / mock = tham khảo** (lưu ở `asset/reference/sobi_aquarium/`, lớp CONTENT). **Không cắt mock làm sprite.** Asset thật lấy từ: nền = sửa từ mock (5.3), vật = sheet nền xám (5.4–5.8).
- Khi đưa vào quy trình batch, các khối §5.4–5.8 sẽ thành `asset/batches/aquarium-0x-*.json` và `batch.mjs prep` sinh lại prompt + file đính kèm; nội dung dưới đây là bản gốc.

### 5.1 Concept tổng thể (tham khảo, không vào game)

Ra **một** ảnh gộp cả 4 vùng: chỉ để chốt màu và chất liệu, rồi làm ảnh đính kèm số 3 cho 4 prompt của 5.2. Không phải layout màn chơi.

Đính kèm: `REF_CLOUD_BG`

```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy its objects.

Draw ONE wide concept illustration (2:1 landscape) of "Sobi Aquarium", a cozy fish-keeping world, shown as a journey from left to right in four connected zones that blend into each other, all cut away at the waterline so we see both above and below the water:
1) left: a sunny wooden fishing pier in the morning with a rounded glass fish tank on a little wooden stand, a small boathouse, rope, nets and a life ring;
2) a natural rock pool at the shore with mossy round pebbles, lily pads, cattails and jade-green clear water with soft waterweeds;
3) a tropical mangrove lagoon at noon with mangrove roots, sandy bottom, pink and peach soft corals, a sea anemone, seagrass, starfish and sun rays through turquoise water;
4) right: a deep cove at sunset under a cliff, with leaning ancient stone pillars carved with round gear patterns, a giant pearl clam softly glowing, a kelp forest and tiny pale-blue glowing specks in deep blue-violet water.
Small cute round fish swim in every zone (side view), bubbles rise. The water in the middle of each zone is clear and bright. No people, no characters with human shape.

No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo.
```

### 5.2 Mock layout từng cấp — 5 prompt riêng (tham khảo vị trí; bước duyệt bố cục)

Mỗi cấp **một cuộc trò chuyện Gemini mới**, một prompt hoàn chỉnh, ra **một màn chơi** (không gộp các cấp).
Đính kèm theo thứ tự:
1. `REF_CLOUD_BG` (cách vẽ cảnh)
2. `REF_CLOUD_MOCK` (cách đặt UI)
3. T1–T4: `REF_AQ_CONCEPT` = ảnh concept 5.1 đã chọn (`asset/reference/sobi_aquarium/aquarium_concept.png`), để lấy màu và chất liệu của đúng vùng đó. T5: `MOCK_T4.png` (mock T4 đã duyệt)

Bố cục cố định giống nhau ở cả 5 prompt (mực nước ~28% từ trên, vùng cá bơi sáng ở giữa, bảng trái, bến phải, UI trống chữ), để các màn khớp nhau khi đổi cấp.

**T1 — Bể Kính Bên Bến**
```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail.
Image 2 is the LAYOUT REFERENCE of another screen of the same game: copy how its user interface is placed and shaped (soft white-lilac rounded pill boxes at the top left and top right, a wide rounded pastel bottom bar with buttons, a small framed animal portrait at the bottom left, a wooden title banner at the bottom centre, wooden label planks next to buildings). Do NOT copy its scene.
Image 3 is the CONCEPT of my fish world, made of four zones. This screen shows ONLY its LEFT zone (the wooden pier with the glass tank). Use the colours, materials and mood of that zone only. Do NOT draw the rock pool, the mangroves, the corals or the ruins of the other zones.

Draw ONE game screenshot mock-up, wide landscape 2:1, of a single place: "the glass tank on the pier", on a sunny morning. The whole picture is this one place.
SCENE: a cozy honey-wood fishing pier runs across the bottom of the picture. On it, in the centre, stands ONE big wide rounded glass fish tank on a low wooden stand. The tank is large: it fills the middle of the screen from 18% to 80% of the width and from 28% to 77% of the height, and its water line is a straight line at 28% from the top. Inside the tank: clear light-aqua water, pale sand with a few round pebbles at the bottom, two small waterweeds and a tiny ceramic castle near the edges, 4 small cute round fish (side view, different colours) and a few rising bubbles; the middle of the tank stays clear and calm. Behind the tank: a calm turquoise bay, a small wooden boathouse with a blue roof at the left, a far little green island, a soft blue sky with white clouds. Around the pier edges: a coiled rope, a net basket, a wooden crate, a red-and-white life ring, a lantern on a post.
FIXED GAME LAYOUT:
- Left, above the tank's water line: an empty wooden label plank on a post.
- Right, at the end of the pier above the water: a small wooden fishing dock corner with a bamboo fishing rod and a red-white float on the bay water.
- On the tank's sand: two small peach fish eggs at the left, a small shiny pile of fish scales at the right.
- UI exactly like image 2: three pill boxes top left, three pill buttons top right, a small chip under the top-left boxes, an animal portrait frame at the bottom left, a wide bottom bar with a small status group on its left and seven rounded buttons each with a small simple icon on its right, and an empty wooden title banner at the bottom centre above the bar.
All UI boxes, buttons, planks and the banner are EMPTY: no letters, no numbers, only small simple icons.
Palette: aqua, cream sand, warm honey wood, sky blue, small red accents.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

**T2 — Hồ Đá Ven Bờ**
```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail.
Image 2 is the LAYOUT REFERENCE of another screen of the same game: copy how its user interface is placed and shaped (soft white-lilac rounded pill boxes at the top left and top right, a wide rounded pastel bottom bar with buttons, a small framed animal portrait at the bottom left, a wooden title banner at the bottom centre, wooden label planks next to buildings). Do NOT copy its scene.
Image 3 is the CONCEPT of my fish world, made of four zones. This screen shows ONLY its SECOND zone from the left (the mossy rock pool with lily pads and cattails). Use the colours, materials and mood of that zone only. Do NOT draw the glass tank, the boathouse, the mangroves, the corals or the ruins of the other zones.

Draw ONE game screenshot mock-up, wide landscape 2:1, of a single place: "the rock pool at the shore", in the early afternoon. The whole picture is this one place, seen as a side cut-away at the waterline.
SCENE: the waterline runs straight across at 28% from the top. Above it: mossy round grey boulders with small white flowers along the shore, green lily pads floating on the surface with two small pink water lilies, tall cattails at the left, a far calm sea and a soft blue sky. Below it: a natural rock pool; its walls are big rounded mossy stones curving in at the left and right edges, the floor is small colourful river pebbles, soft green foxtail waterweeds and eelgrass sway along both edges, the water is clear jade green with gentle light. The big open middle (from 18% to 80% of the width, from 30% to 77% of the height) is the swimming area: clear, bright, calm water with very little detail, with 6 small cute round fish (side view, different colours) and a few rising bubbles.
FIXED GAME LAYOUT:
- Left, on a boulder just above the waterline: an empty wooden label plank on a post.
- Right, standing on the shore above the waterline: a small wooden fishing dock with a bamboo fishing rod and a red-white float on the water.
- On the pebble floor: two small peach fish eggs at the left, a small shiny pile of fish scales at the right.
- UI exactly like image 2: three pill boxes top left, three pill buttons top right, a small chip under the top-left boxes, an animal portrait frame at the bottom left, a wide bottom bar with a small status group on its left and seven rounded buttons each with a small simple icon on its right, and an empty wooden title banner at the bottom centre above the bar.
All UI boxes, buttons, planks and the banner are EMPTY: no letters, no numbers, only small simple icons.
Palette: jade green, teal, moss green, warm grey stone, soft afternoon light, small pink accents.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

**T3 — Đầm San Hô Sinh Thái**
```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail.
Image 2 is the LAYOUT REFERENCE of another screen of the same game: copy how its user interface is placed and shaped (soft white-lilac rounded pill boxes at the top left and top right, a wide rounded pastel bottom bar with buttons, a small framed animal portrait at the bottom left, a wooden title banner at the bottom centre, wooden label planks next to buildings). Do NOT copy its scene.
Image 3 is the CONCEPT of my fish world, made of four zones. This screen shows ONLY its THIRD zone from the left (the mangrove lagoon with sun rays and corals). Use the colours, materials and mood of that zone only. Do NOT draw the glass tank, the pier, the rock pool or the ruins of the other zones.

Draw ONE game screenshot mock-up, wide landscape 2:1, of a single place: "the living coral lagoon", at tropical noon. The whole picture is this one place, seen as a side cut-away at the waterline.
SCENE: the waterline runs straight across at 28% from the top. Above it: at the left, mangrove trees whose roots arch into the water and whose leafy branches reach over it; at the right, a small sandy beach with a little palm tree; a bright blue sky and a far turquoise sea. Below it: soft diagonal sun rays through clear turquoise water, a rippled cream sand floor, and along the left and right edges colourful soft corals (peach, coral pink, butter yellow, lilac), a pink sea anemone, seagrass, two orange starfish and a big closed clam. The big open middle (from 18% to 80% of the width, from 30% to 77% of the height) is the swimming area: clear, bright, calm water with very little detail, with 8 small cute round fish (side view, different colours, one clownfish near the anemone) and a few rising bubbles.
FIXED GAME LAYOUT:
- Left, on a mangrove root just above the waterline: an empty wooden label plank on a post.
- Right, standing on the beach above the waterline: a small wooden fishing dock with a bamboo fishing rod and a red-white float on the water.
- On the sand: two small peach fish eggs at the left, a small shiny pile of fish scales at the right.
- UI exactly like image 2: three pill boxes top left, three pill buttons top right, a small chip under the top-left boxes, an animal portrait frame at the bottom left, a wide bottom bar with a small status group on its left and seven rounded buttons each with a small simple icon on its right, and an empty wooden title banner at the bottom centre above the bar.
All UI boxes, buttons, planks and the banner are EMPTY: no letters, no numbers, only small simple icons.
Palette: turquoise, cream sand, coral pink, peach, sunny yellow, fresh leaf green. Lively and colourful at the edges, calm in the middle.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

**T4 — Vịnh Ngọc Trai Cổ**
```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail.
Image 2 is the LAYOUT REFERENCE of another screen of the same game: copy how its user interface is placed and shaped (soft white-lilac rounded pill boxes at the top left and top right, a wide rounded pastel bottom bar with buttons, a small framed animal portrait at the bottom left, a wooden title banner at the bottom centre, wooden label planks next to buildings). Do NOT copy its scene.
Image 3 is the CONCEPT of my fish world, made of four zones. This screen shows ONLY its RIGHT zone (the sunset cove with ancient pillars, kelp and the pearl clam). Use the colours, materials and mood of that zone only. Do NOT draw the glass tank, the pier, the rock pool or the mangroves of the other zones.

Draw ONE game screenshot mock-up, wide landscape 2:1, of a single place: "the ancient pearl cove", at a gentle sunset. The whole picture is this one place, seen as a side cut-away at the waterline.
SCENE: the waterline runs straight across at 28% from the top. Above it: warm rocky cliffs with hanging vines at the left and right, two leaning ancient stone pillars carved with round gear patterns, a lilac-pink-orange sunset sky with the sun low over a far sea. Below it: the water is light teal near the surface and turns deep blue-violet toward the floor and the edges, while the middle stays light; a far ruined stone arch in the background, tall golden-green kelp forests along both edges, stone ruins with gear carvings on the floor, a giant open pearl clam with a large white pearl on the floor at the right, tiny pale-blue glowing specks near the bottom. The big open middle (from 18% to 80% of the width, from 30% to 77% of the height) is the swimming area: clear, light, calm water with very little detail, with 10 small cute round fish (side view, different colours) and a few rising bubbles. Mysterious but soft and cute, never dark or scary.
FIXED GAME LAYOUT:
- Left, on a cliff ledge just above the waterline: an empty wooden label plank on a post.
- Right, standing on the rocks above the waterline: a small wooden fishing dock with a bamboo fishing rod and a red-white float on the water.
- On the floor: two small peach fish eggs at the left, a small shiny pile of fish scales at the right (in front of the pearl clam, not inside it).
- UI exactly like image 2: three pill boxes top left, three pill buttons top right, a small chip under the top-left boxes, an animal portrait frame at the bottom left, a wide bottom bar with a small status group on its left and seven rounded buttons each with a small simple icon on its right, and an empty wooden title banner at the bottom centre above the bar.
All UI boxes, buttons, planks and the banner are EMPTY: no letters, no numbers, only small simple icons.
Palette: teal, blue-violet, lilac, pearl white, warm sunset orange and pink, golden-green kelp.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

**T5 — Đại Dương Sâu** (chìm hẳn dưới nước, **không có mặt nước** trong khung; xem §1.3 luật 1–2)

Cách A — **sửa từ mock T5 đã có bố cục UI đúng** (khuyên dùng: giữ nguyên vị trí UI). Đính kèm: mock T5 hiện có (`aquarium_t5_mock_v1.png`) duy nhất.
```text
Edit this game screenshot. Keep exactly the same image size, framing, art style, user interface (every box, button, bar, the animal portrait, the empty wooden title banner) and the same positions of the swimming fish, the two peach eggs and the scale pile.
CHANGE THE SCENE into the deep open ocean, fully underwater:
- REMOVE the waterline and the water surface completely: there is no air, no sky and no shore anywhere; the whole picture is underwater from the top edge to the bottom edge. Bright light shafts come down from above the top edge.
- REMOVE all stone ruins, towers, pillars, arches and carved gears.
- At the left, where the wooden sign is, put the same empty wooden sign on a post planted on a mossy underwater rock ledge.
- At the top right, replace the fishing rod, the float and the ledge with a single fishing line coming down from above the top edge, ending in a hook with a small warm-yellow lantern lure, hanging in open water.
- Make the place feel vast and majestic: a gigantic friendly whale much closer and clearer, gliding across the upper background; a graceful manta ray far behind; huge towering coral spires and giant kelp along the left and right edges; deep blue canyon walls fading into the distance in several hazy layers; a school of tiny silver fish swirling far away; softly luminous corals, anemones and lantern jellyfish at the edges; the floor is pale sand ending in a deep drop-off.
- The middle stays clear and light so the fish read well; the deepest navy is only at the far edges and the bottom corners.
Cute, calm and awe-inspiring, never dark or scary.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

Cách B — **vẽ mới hoàn toàn**. Đính kèm: `REF_CLOUD_BG`, `REF_CLOUD_MOCK`, `MOCK_T4.png` (chỉ để giữ vị trí UI).
```text
Image 1 is the STYLE REFERENCE: a finished background from my cozy game. Copy its painting style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail.
Image 2 is the LAYOUT REFERENCE of another screen of the same game: copy how its user interface is placed and shaped (soft white-lilac rounded pill boxes at the top left and top right, a wide rounded pastel bottom bar with buttons, a small framed animal portrait at the bottom left, a wooden title banner at the bottom centre, wooden label planks next to buildings). Do NOT copy its scene.
Image 3 is the PREVIOUS LEVEL of this fish screen. Use it ONLY for the positions of the user interface, the label sign at the left, the fishing spot at the top right, the eggs and the scale pile. Do NOT copy anything of its scenery: no waterline, no sky, no cliffs, no stone ruins, no pillars, no arches, no pearl clam.

Draw ONE game screenshot mock-up, wide landscape 2:1, of a single place: "the deep ocean", seen fully underwater. There is NO water surface, NO sky and NO shore anywhere in the picture: everything from the top edge to the bottom edge is underwater.
SCENE: bright soft light shafts fall from far above the top edge into the middle. A gigantic friendly whale glides across the upper background, large and clear but softer in colour than the foreground; a graceful manta ray swims far behind; a swirling school of tiny silver fish in the distance. Huge towering coral spires and giant kelp rise along the left and right edges; deep blue canyon walls fade into the distance in several hazy layers, giving a vast and majestic sense of depth. Softly luminous corals and sea anemones in mint, cyan, lilac and pink, and a few round lantern jellyfish drift at the edges. The floor is fine pale sand ending in a gentle deep drop-off at the bottom, with small glowing anemones along it. The big open middle (from 18% to 80% of the width, from 25% to 77% of the height) is the swimming area: clear, light aqua-blue, calm water with very little detail, with 12 small cute round fish (side view, different colours) and a few rising bubbles. The deepest navy and indigo are only at the far edges and the bottom corners. Cute, calm and awe-inspiring, never dark or scary.
FIXED GAME LAYOUT:
- Left, at 20–30% from the top: an empty wooden label sign on a post, planted on a mossy underwater rock ledge.
- Top right, at the same place as the fishing dock of image 3: a single fishing line coming down from above the top edge, ending in a hook with a small warm-yellow lantern lure, hanging in open water.
- On the sand floor: two small peach fish eggs at the left, a small shiny pile of fish scales at the right.
- UI exactly like image 2: three pill boxes top left, three pill buttons top right, a small chip under the top-left boxes, an animal portrait frame at the bottom left, a wide bottom bar with a small status group on its left and seven rounded buttons each with a small simple icon on its right, and an empty wooden title banner at the bottom centre above the bar.
All UI boxes, buttons, signs and the banner are EMPTY: no letters, no numbers, only small simple icons.
Palette: light aqua and sunlit blue in the middle, ocean blue, indigo and navy at the far edges, luminous mint, cyan, lilac and pink accents, warm yellow lantern light.

No readable text, letters, numbers, captions, watermark or logo. Not glossy, not a 3D render, not flat vector, not pixel art, not a photo. No people.
```

Gemini vẫn vẽ lẫn vùng khác → thêm cuối prompt: `Show only this one place. No other zones, no split screen, no panels side by side.`

Duyệt mock: đúng khung (mực nước ~28%, vùng giữa sáng, bến phải, bảng trái), đúng màu cấp, không chữ đọc được. Mock đạt → lưu `asset/reference/sobi_aquarium/aquarium_t<n>_mock.png` → đo toạ độ.

### 5.3 Nền sạch từ mock (asset thật: `bg_aquarium_t1..t5`)

Đính kèm: `MOCK_Tn.png` (duy nhất). Dùng AI Studio.

```text
Edit this game screenshot into a clean background picture for the game. Keep the exact same image size, framing, art style, colours and lighting. REMOVE completely and paint natural scenery in their place: every UI element (the boxes and buttons at the top left and top right, the small chip, the whole bottom bar with its buttons and icons, the animal portrait at the bottom left, the wooden title banner at the bottom centre), the empty wooden label plank and its post, the wooden fishing dock with its rod and float, every fish, every bubble, the fish eggs and the pile of scales. Where the dock stood, keep the shore empty and natural so a dock can be placed there. Where the bottom bar was, continue the bottom scenery naturally down to the edge.
KEEP: the sky, the shore, the waterline exactly where it is, the water, the floor, and all scenery along the edges. The middle swimming area must stay clear, bright and calm.

No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```

Riêng **T1** thêm câu: `Also REMOVE the glass fish tank and its stand: paint the wooden pier and the bay behind where it stood.` (bể là sprite riêng).

### 5.4 Cá — sheet AQ-F1, AQ-F2 (P0)

Đính kèm: `1_style_creature.png`. Lưới 2×3, cắt `fit shared` (cùng tỉ lệ).

**AQ-F1:**
```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of 6 separate game sprites in a clean grid of 2 rows x 3 columns, in exactly this order, left to right, top to bottom:
Row 1: (1) a round chubby orange goldfish with a soft flowing double tail and shiny orange scales; (2) a small quick olive-green perch with faint dark stripes and a spiky but soft back fin; (3) a calm plump golden-bronze carp with two tiny whiskers and big round scales.
Row 2: (4) a small orange clownfish with three white stripes edged in dark brown; (5) a round yellow-and-cream pufferfish, slightly puffed, with tiny soft spikes; (6) a tall silver-and-lilac angelfish with very long elegant trailing fins.
Every fish: whole body in pure side view, FACING RIGHT, cute small eye with a white highlight and a tiny smile, no water, no bubbles, no shadow. All fish drawn at the same scale and the same hand, each filling most of its cell.

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```

**AQ-F2:** giống AQ-F1, thay hai dòng `Row 1/Row 2` bằng:
```text
Row 1: (1) a small pale-mint glowfish with a soft luminous turquoise belly and little light spots along its side (drawn with colour only, no glow effect); (2) a rare betta with huge silky flowing fins in ruby red fading to violet; (3) a round dark-blue lanternfish with a tiny warm-yellow lantern hanging from a stalk on its head.
Row 2: (4) a cute coral-pink seahorse standing upright with its tail curled, its head and snout turned to the RIGHT; (5) a majestic dragon koi, long body with gleaming golden scales, red-orange patches, flowing whisker barbels and a fluttering tail; (6) a round flat silver moonfish with a pearly sheen and pale-blue fin edges.
```

Icon cá `ui_item_fish_*`: **không** vẽ thêm; script cắt từ sprite đã duyệt (D), viền mềm, 128×128.

### 5.5 Bể, bến, đồ vật — sheet AQ-W1, AQ-P1 (P0)

**AQ-W1** (đính kèm `1_style_building.png`, lưới 1×3, `fit each`):
```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of 3 separate game sprites in a clean grid of 1 row x 3 columns, in exactly this order:
Row 1: (1) a big wide rounded-rectangle glass fish tank seen straight from the front, about 2.3 times wider than tall, on a low honey-wood stand with short rounded legs; a wooden rim and a small wooden lid strip on top, a little bubbling filter tube at the back left corner; inside: pale clear light-aqua water filling it up to just under the rim, a thin floor of cream sand and a few round pebbles at the bottom ONLY, the rest of the inside EMPTY and calm (no fish, no plants); (2) a small cozy wooden fishing dock seen from the front-left: a few planks on round posts, a coiled rope, a small bucket, a little lantern on a post, and one bamboo fishing rod leaning out to the left with its line hanging down; (3) a tall thin vertical fishing line hanging straight down from the top of its cell, ending in a small silver hook with a little round warm-yellow lantern lure and a tiny pink bait, about 3 times taller than wide.
All are front-on game objects, fully visible.

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```

**AQ-P1** (đính kèm `1_style_item.png`, lưới 2×4, `fit each`):
```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of 8 separate game sprites in a clean grid of 2 rows x 4 columns, in exactly this order, left to right, top to bottom:
Row 1: (1) a single shiny fish scale, a rounded shell shape in pearly aqua and gold; (2) a single round white pearl with a soft pink-lilac sheen, on nothing; (3) a small cloth pouch of fish food tied with string, little brown-orange pellets spilling out; (4) a small translucent-looking peach fish egg cluster of three round eggs with tiny dark dots inside.
Row 2: (5) a small pile of shiny aqua-gold fish scales on a little patch of sand; (6) a round red-and-white fishing float with a small top stick; (7) a blank horizontal rounded wooden plank sign, about 3 times wider than tall, with a small pink seashell and a tiny orange starfish on its left end and an empty smooth area for text; (8) a blank wide rounded wooden banner plank, about 3.5 times wider than tall, decorated at both ends with seashells, a starfish and green seaweed, empty smooth centre for text.
Icons (1)–(4) are front-on, centred, fill most of the cell and read at 48 px. Plank (7) and banner (8) have NO letters at all.

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```
→ `ui_item_scale`, `ui_item_pearl`, `ui_item_food_fish`, `prop_fish_egg`, `prop_scale_pile`, `prop_fishing_bobber`, `prop_sign_plank_sea`, `prop_title_banner_sea`.

### 5.6 Icon nút và HUD — sheet AQ-U1 (P0)

Đính kèm `1_style_item.png`, lưới 2×4.
```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of 8 separate small game icons in a clean grid of 2 rows x 4 columns, in exactly this order, left to right, top to bottom:
Row 1: (1) a bamboo fishing rod with a curved line and a red-white float; (2) a small wooden scoop sprinkling brown fish-food pellets; (3) a wooden bucket with a big clear blue water drop above it; (4) a small round hand net holding shiny aqua-gold scales.
Row 2: (5) a wicker basket with a little orange fish peeking out; (6) a tiny rounded glass fish tank with one fish inside; (7) two small fish facing each other with a pink heart between them; (8) a single round clear aqua water drop with a white shine.
Each icon is a simple chunky silhouette, front-on, centred, filling most of its cell, readable at 32 px. No ground, no shadow, no button frame, no circle behind it.

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```
→ `ui_icon_aq_fish`, `_feed`, `_water`, `_scales`, `_bag`, `_tank`, `_breed`, `_clarity` (đúng 7 nút của `bar` + ô Độ trong nước).

### 5.7 Tiền cảnh từng cấp — sheet AQ-FG1..5 (P1)

Đính kèm `1_style_flora.png`, lưới 2×3, `fit each`. Dán phần mở và phần đuôi chung, thay **Row** theo cấp.

```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of separate underwater foreground decorations for a side-view fish tank scene, in a clean grid of 2 rows x 3 columns, in exactly this order, left to right, top to bottom. Each one grows from a flat bottom edge (it will stand on the floor of the scene), seen in pure side view:
{ROWS}

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```

| Sheet | `{ROWS}` |
|---|---|
| AQ-FG1 (T1) | `Row 1: (1) a small clump of bright green aquarium waterweed; (2) a tall thin ribbon waterweed; (3) a tiny cream ceramic castle with a round tower and an arch door. Row 2: (4) three round pebbles in pastel colours; (5) a small leafy aquarium plant with round leaves; (6) a little terracotta pot lying on its side.` |
| AQ-FG2 (T2) | `Row 1: (1) a big clump of soft green foxtail waterweed; (2) a rounded mossy grey boulder; (3) a lily stem rising with one pink water lily bud. Row 2: (4) two cattails with brown tips; (5) a cluster of small colourful river pebbles; (6) a fan of tall jade-green eelgrass.` |
| AQ-FG3 (T3) | `Row 1: (1) a pastel-pink sea anemone with soft waving tentacles; (2) a peach soft coral like a little tree; (3) a butter-yellow brain coral dome. Row 2: (4) a clump of seagrass blades; (5) a big rounded clam shell, closed, cream and lilac; (6) a small rock with two orange starfish.` |
| AQ-FG4 (T4) | `Row 1: (1) a tall wavy golden-brown kelp stalk with long leaves; (2) a broken ancient stone pillar piece carved with a round gear pattern, with moss; (3) a giant open pearl clam with one large white pearl (no glow effect, colour only). Row 2: (4) a pale-blue branching coral with lighter tips; (5) a cluster of round sea-violet sponges; (6) a short clump of dark teal sea moss.` |
| AQ-FG5 (T5) | `Row 1: (1) a softly luminous mint-and-cyan branching coral (luminous look made with light pastel colours only, no glow effect); (2) a cluster of three lilac sea anemones with pale glowing tips; (3) a small round pink lantern jellyfish with short wavy tentacles. Row 2: (4) a dark rounded deep-sea rock with a few tiny pale spots; (5) a clump of long thin deep-sea grass in indigo and teal; (6) a cluster of tiny pale-blue glowing mushroom-like sea polyps.` |

→ `fg_aq_t<n>_<1..6>`; dùng 4–5 cái mỗi cấp, đặt bằng layout content.

### 5.8 NPC và sinh vật trang trí — sheet AQ-C1 (P1/P2)

Đính kèm `1_style_creature.png`, lưới 1×6 (hoặc 1×1 nếu chỉ làm NPC).
```text
Image 1 is the STYLE REFERENCE: finished art from my game. Copy its art style exactly: a dark warm-brown outline (never black) of even weight, soft cel shading with one shadow tone and one highlight tone, light from the top-left, warm pastel colours of medium saturation, a subtle painted texture, rounded chunky friendly shapes, low-to-medium detail. Do NOT copy the objects of image 1.

Draw ONE image: a sheet of 6 separate game sprites in a clean grid of 1 row x 6 columns, in exactly this order, left to right:
Row 1: (1) Dreamy Hen the fisher: a plump cream hen standing, sleepy half-closed eyes and pink cheeks, a wide straw sun hat with a blue ribbon, a small bamboo fishing rod resting on her shoulder under one wing, a tiny fish-shaped charm on the hat, body facing right with the head turned toward the viewer; (2) a small round white seagull standing, facing right; (3) a round green frog sitting, facing right; (4) a small orange crab with round claws, side view; (5) a small sea turtle swimming, pastel-green shell with a cream pattern, facing right; (6) a small round lantern jellyfish in soft pink and lilac with short wavy tentacles.
All are cute and friendly animals, full body, in the style of image 1, at sizes that feel natural next to each other (the hen the largest).

Every object is fully visible and centred in its own cell, with wide empty gaps between objects; nothing touches, overlaps or crosses into another cell. Wide landscape image.
Background: one plain flat light-grey colour (#C8C8C8) everywhere. No gradient, no texture, no floor, no cast shadow on the background.
No text, letters, numbers, labels, captions, watermark, logo, border or frame. Not glossy, not a 3D render, not flat vector, not pixel art. No glow, no sparkles, no floating particles.
```

### 5.9 Khuôn cho cấp mới (nếu sau này có cấp 6+)
Mock: chép prompt T2 (5.2), chỉ thay đoạn "Image 3 … zone", dòng "Draw ONE … single place", đoạn SCENE và Palette (giữ mực nước 28%, vùng giữa sáng, FIXED GAME LAYOUT y nguyên). Rồi 5.3 để ra nền, 5.7 với 6 tiền cảnh mới. Không đổi gì khác.

### 5.10 Câu sửa nhanh khi Gemini lệch
| Lỗi | Thêm vào cuối prompt |
|---|---|
| Có chữ giả | `Absolutely no writing of any kind anywhere, not even fake letters or scribbles.` |
| Cá quay trái / nhìn thẳng | `Every fish faces RIGHT in strict side view; never front view.` |
| Vật chạm nhau, cắt không được | `Make every object about 20% smaller with much more empty grey space around it.` |
| Bóng loáng, 3D | `Matte painted look like image 1; no glossy highlights, no reflections, no 3D shading.` |
| Vùng giữa nền quá rối / tối | `Keep the middle swimming area clear, light and almost empty; move details to the edges.` |
| Sai tỉ lệ khung | `Keep exactly the same size and framing as the input image.` |

---

## 6. Quy trình tạo, kiểm tra, tích hợp

Theo skill `image-to-asset` (`workflows/batch.md`), dừng chờ duyệt sau mỗi mốc.

| Bước | Việc | Ai | Kiểm |
|---|---|---|---|
| 1 | Chốt §0 (khung 2:1, dòng manifest mới, NPC) + số của cấp bể 5 (decision 026); thêm dòng cấp 5 vào `balance.json`, test, Admin | chủ dự án duyệt, Claude làm | `npm run check`, `sim:week` |
| 2 | Concept 5.1 + 5 mock 5.2 (T5 làm sau khi T4 được duyệt) → chọn; lưu vào `asset/reference/sobi_aquarium/` (CONTENT, đăng ký registry) | chủ dự án tạo, Claude lưu | đúng khung §3.1, đúng màu cấp |
| 3 | Viết batch: `aquarium-01-fish` (F1, F2), `aquarium-02-items` (P1, U1 + icon cá D), `aquarium-03-world` (W1 + E t1), `aquarium-04-tiers` (E t2–t5 + FG1–5), `aquarium-05-life` (C1); `batch.mjs prep` | Claude | prompt + file đính kèm sinh ra đúng |
| 4 | Tạo ảnh theo `asset/batches/aquarium-0x.md`, lưu `art_inbox/.batch/<id>/<sheet>.png` | chủ dự án (22 lượt Gemini: 1 concept + 5 mock + 5 nền + 2 cá + 2 vật/icon + 1 bể/bến + 5 tiền cảnh + 1 sinh vật; chưa tính lượt làm lại) | — |
| 5 | `batch.mjs cut` → bảng duyệt, chọn bản; lỗi → sửa 1 câu (5.10), tạo lại sheet đó | Claude | QA V/Q: đúng phong cách Farm, cá quay phải, không chữ, cùng tỉ lệ |
| 6 | `deliver` → `npm run art:process` → `npm run assets:check`; `qa.mjs` (T) | Claude | không 404, cỡ canvas đúng |
| 7 | Tích hợp (chỉ phần trình bày): khung 1800×900; `bg_aquarium_t<level>` + tiền cảnh theo cấp bể (layout trong content, như `content/plaza/layout.json`); bảng / băng rôn / icon nút / icon đói-bệnh thay emoji; VFX §4.4; chuyển cấp bằng bong bóng | Claude | `npm run check` xanh, e2e xanh, save không đổi |
| 8 | Chụp 5 cấp (save Admin ở cấp 1–5), ngày + đêm, hover bể / bến / bảng, câu một con, cho ăn, thay nước, nâng cấp | Claude | không lỗi console; ảnh vào `art_inbox/.qa/aquarium-review/` |
| 9 | Duyệt → commit `feat(art): aquarium <batch> (G)`, cập nhật `PROGRESS.md`, `ASSET_TODO.md`, `batches/README.md` | chủ dự án duyệt | — |

**Tiêu chí đạt (mỗi màn):** cá đọc rõ trên nền ở cả 5 cấp và ban đêm; bấm được đúng chỗ (bến, bảng, vảy, cá) không bị tiền cảnh che; mọi chữ là chữ game (đổi được Việt/Anh); không có vật nào chỉ nằm trong nền mà lẽ ra phải bấm được; đổi cấp bể không làm lệch vùng cá bơi.
