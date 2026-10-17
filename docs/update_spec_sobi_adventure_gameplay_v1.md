# UPDATE SPEC — SOBI ADVENTURE GAMEPLAY V1 (Combat V2 + Bản đồ khám phá)

> **Tài liệu:** `update_spec_sobi_adventure_gameplay_v1.md` · **Area:** Sobi Adventure ⚔️ · **Phiên bản:** v1.0
> **Trạng thái:** chủ dự án đã duyệt hướng (2026-10-17); decision `037-adventure-v2.md`
> **Nguồn:** master prompt `UPDATE_SPEC_SOBI_ADVENTURE.md` (Combat V2), lore `lore/Lore_Sobi_World.md`, `lore/LORE_TO_GAMEPLAY.md`,
> kế hoạch art `asset/FIRST_GUARDIANS_ART_PLAN.md`, Adventure hiện có (decision 018, 019).
> **Thứ tự ưu tiên:** `SOBI_WORLD_PROJECT_SPEC_V2.md` > decision 037 > tài liệu này > decision 018/019 > `GAME_BALANCE.md` §9 > code.
> Tài liệu này **thay thế** phần combat, kiểu đánh, nguyên tố, trạng thái và bản đồ điểm dừng của decision 018/019.
> Những gì không nhắc tới ở đây (loot về các Area, vật liệu cổ, công nghệ, khẩu phần, potion, Bond, thua = kiệt sức) **giữ nguyên**.

Mọi con số trong tài liệu là **số khởi điểm**. Số cuối cùng chốt bằng mô phỏng (`npm run sim:adventure`, `sim:week`) và nằm trong `content/adventure/`. Code không hard-code bảng cân bằng.

---

## 0. Mười luật không được phá (một định nghĩa, nhiều nơi tham chiếu)

| # | Luật |
|---|---|
| R1 | Độ hiếm ≠ thắng chắc. Độ hiếm cho thêm hệ phụ và skill riêng; hệ số chỉ số theo độ hiếm chỉ chênh tối đa 20% (§4.3). |
| R2 | Chiến thuật > chỉ số thô. Người chơi luôn **thấy trước** điều cần để ra quyết định: hệ của địch, ý định của địch, thứ tự lượt (§15.4). |
| R3 | SP ≠ EXP ≠ MP ≠ Rage. Mỗi tài nguyên có đúng một công dụng (§1). |
| R4 | Poison là **trạng thái** gốc Thiên nhiên, không phải nguyên tố. |
| R5 | Void không khắc hệ nào và không hệ nào khắc Void. Đánh đúng hệ khắc luôn tốt hơn đánh Void. |
| R6 | Ultimate không nằm trong Class Skill Tree. |
| R7 | Affinity của trang bị chỉ khuếch đại, **không** đổi hệ gốc của sinh vật. |
| R8 | Trạng thái ≠ nguyên tố (Burn, Wet, Freeze… đều là trạng thái). |
| R9 | Ma trận nguyên tố (§9) và Phản ứng nguyên tố (§11) là hai hệ thống, hai file dữ liệu riêng. |
| R10 | Mọi bảng (class, skill, cây, nguyên tố, trạng thái, phản ứng, trang bị, bản đồ) là data có schema, sửa được ở Admin. |

---

## 1. Tài nguyên — định nghĩa chính thức

| Tài nguyên | Thuộc về | Dùng để | Có được từ | Lưu ở |
|---|---|---|---|---|
| **EXP** | từng chiến binh | lên **cấp** (chỉ số tăng, mở Unique Skill 3/4) | thắng trận, hạ trùm | hồ sơ chiến binh |
| **SP** (Skill Point) | từng chiến binh | **mở / nâng** node trong Class Skill Tree. Không bao giờ dùng trong trận | lên cấp, lần đầu hạ trùm vùng, Cuộn Kỹ Năng | hồ sơ chiến binh |
| **MP** | từng combatant, trong trận | tung skill (Unique, Class) | hồi mỗi lượt, đòn thường, Phòng thủ, vật phẩm | mang theo trong chuyến |
| **Hồi chiêu** | từng skill | giới hạn tần suất | hết sau N lượt của chính mình | trong trận |
| **Rage** | từng chiến binh | tung **Ultimate** (duy nhất) | mất máu (§8.3) | hồ sơ chiến binh (giữ qua trận và chuyến) |
| **Năng lượng phiêu lưu** | từng chiến binh | vào vùng (một chuyến) | hồi theo giờ thật (Lều Trại tăng tốc) | hồ sơ chiến binh (như cũ) |

"Năng lượng trận" dùng chung (decision 018) **bị bỏ**, thay bằng MP riêng từng con.

---

## 2. Vòng chơi

```text
Trại Phiêu Lưu (chọn đội, hồ sơ, Skill Tree, trang bị, Đền Huấn Luyện)
   │  vào vùng: mỗi chiến binh trả 30 năng lượng  → bắt đầu CHUYẾN
   ▼
Bản đồ khám phá (So/Bi dẫn, 3 sinh vật theo sau; đi bằng phím)
   │  chạm nhóm quái → TRẬN theo lượt → về đúng chỗ trên bản đồ
   │  rương, cổng nguyên tố, suối, NPC, cổng dịch chuyển
   ▼
Kết thúc chuyến: về Trại (đi bộ ra lối vào hoặc qua cổng dịch chuyển) / thua (kiệt sức) → tổng kết, loot vào túi
```

- **Một chuyến** = từ lúc rời Trại đến lúc về Trại hoặc thua. Trong chuyến: máu, MP giữ giữa các trận; quái đã hạ không xuất hiện lại; tài nguyên nhỏ đã hái không mọc lại.
- Chuyến mới: quái và tài nguyên nhỏ xuất hiện lại; máu, MP đầy. **Rương báu, cổng nguyên tố, cổng dịch chuyển đã mở thì mở vĩnh viễn** (theo save).
- Độ dài chuyến tự giới hạn bởi máu/MP (suối chỉ dùng 1 lần mỗi khu mỗi chuyến) và vì quái không hồi lại trong chuyến. Mục tiêu 12–20 phút.
- **Thua**: cả đội kiệt sức 4 giờ thật, giữ EXP và loot đã nhặt, về Trại (như cũ). Không ai chết.
- **Đi nhanh**: vùng đã hạ trùm có nút ở Trại: tốn năng lượng như một chuyến, nhận loot của quái thường × 0,7 và EXP × 0,7, không có rương báu. Không cần đi bộ.

---

## 3. Bản đồ khám phá (lấy cảm hứng Epic Battle Fantasy 3)

### 3.1 Cấu trúc
- **Vùng** (Rừng Thì Thầm, Núi Đá Vọng, Tàn Tích Cổ) gồm **3 khu** (map). Mỗi khu là một bản đồ cuộn, khoảng 1,5–2 màn hình mỗi chiều; camera đi theo So/Bi. Khu nối với nhau bằng **lối ra** ở mép bản đồ.
- Khu thứ 3 của mỗi vùng có **đấu trường trùm vùng**. Mỗi khu 1 và 2 có một **trùm khu** (tinh anh) canh lối sang khu kế.
- Góc nhìn 3/4 từ trên xuống, vẽ tay theo style Sobi Farm (GĐ14: nền + đạo cụ qua manifest).

### 3.2 Lưới ô — nguồn sự thật cho va chạm
- Mỗi khu có **lưới ô vuông** (khởi điểm 40 px thiết kế; khung 1600×900 = 40 × 22,5 ô). `content/adventure/maps/<khu>.json`.
- **Lớp địa hình**: mỗi ô là `walk` hoặc `block` (nước sâu, vách đá, tường, mép bản đồ). Vẽ theo nền.
- **Vật thể** (cây, đá, nhà, tượng, cột, hàng rào…): mỗi loại vật có **footprint** `w × h` ô + điểm neo, khai trong `content/adventure/props.json`. Ô bị chặn = hợp của địa hình `block` và footprint mọi vật.
- **Luật kích cỡ (bắt buộc)**: footprint phủ **toàn bộ phần chân / đế** của vật như nhìn thấy trên hình. Một cái nhà rộng 4 ô thì chặn 4 ô chiều ngang, không phải 1. Phần cao (tán cây, mái nhà) nằm trên footprint được vẽ theo thứ tự y để nhân vật đi **sau** nó, nhưng không bao giờ có ô đi được nằm dưới phần đế của vật.
  - Kiểm tra tự động: test đọc kích thước sprite trong manifest (khung chứa phần không trong suốt) và báo lỗi nếu chiều rộng footprint < 85% chiều rộng đế của sprite, hoặc footprint lòi ra ngoài hình > 1 ô. Admin vẽ footprint đè lên hình để soát bằng mắt.
- Va chạm dùng **hộp chân** của So/Bi (lõi `systems/character` có sẵn, chướng ngại = các ô bị chặn gộp thành hình chữ nhật), trượt dọc tường, không xuyên được qua vật mỏng khi khung hình chậm.

### 3.3 Di chuyển và tương tác
- **Chỉ bàn phím:** phím mũi tên hoặc W/A/S/D (đổi được trong Cài đặt). Giữ hai phím để đi chéo. **Không** có bấm chuột để tìm đường.
- **Space** = tương tác (mở rương, cổng, nói chuyện, suối, cổng dịch chuyển); phím E vẫn dùng được. Gợi ý phím (biển gỗ nhỏ có mũi chỉ) hiện khi đứng đủ gần.
- **So/Bi dẫn đầu** (nhân vật chọn ở Trại, lưu ở `settings.character`, ảnh đi bộ `chr_so` / `chr_bi` 12 khung có sẵn). Ba sinh vật trong đội **đi theo sau** thành hàng theo vết chân của người dẫn; không va chạm, không chặn đường. Sinh vật dùng sprite của chính nó + nhún nhảy / nghiêng khi đi (tween), không cần khung đi bộ riêng.
- Esc mở menu (Túi đồ, đội, rời vùng). Lưu: vị trí (khu, x, y, hướng) được lưu như mọi trạng thái; thoát game giữa chừng vào lại đứng đúng chỗ.

### 3.4 Quái trên bản đồ (không có trận ngẫu nhiên)
- Mỗi **nhóm quái** đặt sẵn ở một điểm, đứng yên hoặc đi tuần trên một đường ngắn (các điểm mốc nằm trên ô đi được). Quái **không đuổi theo** người chơi (cozy).
- Đứng gần (≤ 3 ô) thì trên đầu nhóm hiện **icon hệ** của từng con và mức khó (1–3 sao so với cấp đội).
- **Chạm vào** (hộp chân giao hộp quái) → vào trận. Thắng → nhóm biến mất đến hết chuyến. **Bỏ chạy** được với trận thường (luôn thành công, quái ở lại, người chơi được 2 giây không va chạm và lùi 1 ô); không bỏ chạy được với trùm khu / trùm vùng.
- Có nhóm né được, có nhóm đứng chặn lối hẹp (bắt buộc đánh). Thành phần nhóm bốc theo trọng số từ seed của chuyến (như cũ); vị trí cố định.

### 3.5 Rương báu ẩn
- Đặt ở **góc khuất**: sau vật lớn, cuối ngõ cụt, sau cổng nguyên tố, trên lối phụ. Có thể bị tán cây / mái nhà che một phần.
- Khi đứng trong 3 ô: rương **lấp lánh** nhẹ để người chơi để ý.
- Mở bằng **Space** khi đứng kề (≤ 1 ô, mặt hướng về rương). **Mở một lần duy nhất** cho mỗi save (`openedChests`). Rương đã mở vẫn nằm đó, nắp mở.
- Bên trong: bảng loot của rương báu (tiền, trang bị, vật liệu cổ, Gems theo §17), có rương chứa **Cuộn Kỹ Năng** (+2 SP) hoặc mảnh lore.
- **Luật không có góc chết (bắt buộc, có test):** mỗi rương phải có **ít nhất một ô đi được kề nó** và ô đó **đi tới được** từ điểm xuất hiện của khu (tìm đường theo lưới, coi mọi cổng nguyên tố là đã mở). Rương sau cổng nguyên tố được phép, miễn là cổng đó nằm trên đường đi tới được.
- Ngoài rương báu còn có **điểm tài nguyên nhỏ** (thảo mộc, quặng): nhặt bằng Space, mọc lại mỗi chuyến.

### 3.6 Cổng nguyên tố (câu đố nhẹ)
| Chướng ngại | Cần hệ | Gợi ý lore |
|---|---|---|
| Bụi gai | Lửa | đốt |
| Tảng đá | Đất | dời đá |
| Ngọn lửa cháy | Nước | dập lửa |
| Cột cổ tắt điện | Sấm | kích hoạt |
| Đèn cổ | Ánh sáng | thắp đèn của Quang Trư |
| Ổ khóa đồng | Kim loại | phá khóa |
| Dây leo khô | Thiên nhiên | làm dây leo mọc thành cầu |
| Màn sương đêm | Bóng tối | vén màn |

- Space trước chướng ngại: nếu trong đội có con mang đúng hệ (chính hoặc phụ), con đó nhảy lên làm hiệu ứng → chướng ngại biến mất **vĩnh viễn** (`openedGates`). Nếu không, gợi ý "Cần một bạn hệ X".
- **Đường chính** (điểm xuất hiện → lối ra → trùm) **không bao giờ** cần cổng nguyên tố (test). Cổng chỉ chặn lối phụ, rương báu, lore. Người chơi có lý do mang đội nhiều hệ và quay lại vùng cũ.

### 3.7 Cổng dịch chuyển
- Mỗi khu có **một cổng dịch chuyển**.
  - Cổng ở khu 1 (lối vào) của mỗi vùng **mở sẵn** khi vùng được mở.
  - Cổng ở các khu khác **kích hoạt khi hạ trùm của khu đó** lần đầu (trùm khu với khu 1–2, trùm vùng với khu 3). Kích hoạt vĩnh viễn (`activePortals`).
- Space ở một cổng đang hoạt động → danh sách mọi cổng đang hoạt động (của mọi vùng) + "Về Trại". Chọn là dịch chuyển, không tốn gì.
- Dịch chuyển trong chuyến không làm quái hồi lại; "Về Trại" kết thúc chuyến bình thường.
- Save cũ: vùng đã hạ trùm (`cleared`) → mọi cổng của vùng đó hoạt động (migration §19).

### 3.8 Điểm khác trên bản đồ
- **Suối nghỉ**: hồi 50% máu và MP cả đội, 1 lần mỗi khu mỗi chuyến.
- **NPC / sự kiện nhỏ**: các sự kiện hiện có (`event_spring`, `event_herbalist`, `event_trap`, `event_shrine`… ) thành điểm tương tác; chọn A/B như cũ.
- **Đền Guardian** (tối đa 1 mỗi vùng, thường sau cổng nguyên tố): buff cả đội suốt chuyến (ví dụ +10% sát thương hệ của đền).
- **Bia lore**: một đoạn lore First Guardians / Umbraflux, ghi vào Codex.

### 3.9 Khám phá và bản đồ nhỏ
- **% khám phá** mỗi vùng = (rương báu + cổng nguyên tố + bia lore + cổng dịch chuyển đã mở) / tổng. Hiện ở Trại và Codex. 100% một vùng → thành tựu.
- **Bản đồ nhỏ** (phím M hoặc góc màn hình): hình khu, phần đã đi qua, cổng, lối ra; rương chỉ hiện sau khi đã thấy.

### 3.10 Kiểm tra bản đồ tự động (test + Admin)
Mỗi file khu phải qua: (1) điểm xuất hiện, lối ra, cổng dịch chuyển, trùm, mọi nhóm quái, NPC, suối, rương đều đứng / kề ô đi được và **tới được** (§3.5); (2) đường chính không cần cổng nguyên tố; (3) không vật nào chồng lên vật khác hay lên điểm tương tác; (4) đường tuần của quái nằm trọn trên ô đi được; (5) footprint khớp kích thước sprite (§3.2); (6) mọi id (prop, quái, bảng loot) tồn tại.

---

## 4. Combat Animal và đội

### 4.1 Ai đánh được
- Sinh vật có `combatEnabled` (thay cho `fighter: true` của cá và mục đích "Phiêu lưu" của heo; heo vẫn phải đã lớn và chọn mục đích Phiêu lưu). Adventure thấy chúng qua `AreaModule.roster` (kiến trúc giữ nguyên: Adventure không import Farm / Aquarium).
- Đợt này: mọi giống heo đã có + 6 loài cá đánh được hiện có. 30 loài hậu duệ mới trong kế hoạch art **để sau**.

### 4.2 Đội
3 chiến binh, ghép tự do (heo + cá bất kỳ). Có **3 đội hình lưu sẵn** (3 con + loadout) ở Trại.

### 4.3 Hồ sơ chiến binh
```text
CombatAnimal { key, species/breed (từ Area gốc), rarity, level, exp, classId, lineageId,
  primaryElement, secondaryElement?, uniqueSkills[4], ultimateId, tree{nodeId: level}, sp,
  classLoadout[3], equipment{weapon, armor, charm}, rage, energy, energyAt, exhaustedUntil }
```
- **Dòng (lineage)**: 9 dòng First Guardian (§6). Mặc định theo họ heo / loài cá (`content/adventure/lineages.json`), ghi đè được theo từng giống.
- **Hệ**: hệ chính = hệ của dòng. Hệ phụ chỉ ở Sử thi (tùy loài) và Huyền thoại (tùy loài), khai theo loài.
- **Hệ số độ hiếm** (thay bảng 1 → 1,8 cũ): Thường 1,00 · Khá 1,05 · Hiếm 1,10 · Sử thi 1,15 · Huyền thoại 1,20. Bond giữ +5% mỗi tim.

### 4.4 Chỉ số
| Chỉ số | Ý nghĩa |
|---|---|
| HP, MP | máu, mana |
| ATK / DEF | công / thủ vật lý |
| MATK / MDEF | công / thủ phép |
| SPD | tốc độ (thứ tự lượt) |
| ACC / EVA | chính xác (gốc 100) / né (gốc 5) |
| CRIT | tỉ lệ chí mạng % (gốc 5) |

Chỉ số = gốc của class × (1 + 0,1 × (cấp − 1)) × hệ số độ hiếm × (1 + Bond) + trang bị + khẩu phần (khẩu phần cũ map: Đầy Đặn → HP, Cay → ATK và MATK, Nhanh Nhẹn → SPD và CRIT). Cấp tối đa 30, EXP lên cấp `40 × cấp^1,5` (như cũ).

---

## 5. Class

Mỗi chiến binh có đúng **1 class**. Class không khóa loài.

| Class | Vai trò | Thiên về | MP gốc |
|---|---|---|---|
| **Tanker** | chịu đòn, khiêu khích, khống chế | HP, DEF, MDEF cao; SPD thấp | 40 |
| **Physical DPS** | sát thương vật lý, chí mạng | ATK, SPD, CRIT | 45 |
| **Mage** | sát thương phép, nguyên tố, khống chế | MATK, MP; HP thấp | 80 |
| **Support** | hồi máu, buff, xóa trạng thái | MATK vừa, MDEF, MP | 70 |

- **Class mặc định** theo dòng / họ (§6.2). **Đổi class** ở Đền Huấn Luyện (Trại): tốn Sobi Coin (100 × cấp), hoàn toàn bộ SP, xóa loadout class.
- 8 kiểu đánh cũ (`archetypes.json`) bị thay bằng class + dòng (bảng chuyển ở §6.2).

---

## 6. Unique Skill và Ultimate theo dòng First Guardian

### 6.1 Luật
- Mỗi chiến binh có **4 Unique Skill** (danh tính) và **1 Ultimate**. Không thuộc Skill Tree, không tốn SP.
- Bộ gốc theo **dòng** (9 dòng × 4 skill + 1 Ultimate). Loài **Hiếm trở lên** có thể thay 1–2 Unique Skill và / hoặc Ultimate bằng bản riêng (`overrides` theo loài trong `lineages.json`).
- Mở theo cấp: skill 1 và 2 ở cấp 1, skill 3 ở cấp 10, skill 4 ở cấp 20 (giữ nhịp cũ).

### 6.2 Chín dòng
| Dòng | Hệ | Unique 1 · 2 · 3 · 4 | Ultimate | Họ heo / cá mặc định → class |
|---|---|---|---|---|
| Nam Hải (cá voi) | Nước | Bong Bóng Nước (phép + Wet) · Sóng Vỗ Về (hồi 1) · Khúc Ca Triều (hồi cả đội + xóa 1 trạng thái xấu) · Sóng Thần Cổ (cả địch + Speed Down) | **Tiếng Hát Đại Dương**: hồi 40% cả đội, xóa trạng thái xấu, Wet mọi địch | WATER → Support; cá Thiên Thần → Support |
| Quy Sơn (rùa núi) | Đất | Đập Đá (vật lý + 30% Stun) · Da Đá (tự DEF Up + Shield) · Mai Núi (cả đội DEF Up) · Địa Chấn Cổ (cả địch + 25% Stun) | **Núi Thiêng Trỗi Dậy**: cả đội Shield 30% + Taunt về mình 2 lượt | MYTHIC → Tanker |
| Dạ Mặc (bạch tuộc) | Bóng tối | Phun Mực (phép + Accuracy Down) · Màn Mực (cả đội Evasion Up) · Lưới Đêm (cả địch Speed Down + 20% Stun) · Ác Mộng (Disable 2 lượt) | **Lưới Dệt Đêm**: cả địch Stun 1 lượt (trùm: Speed Down) | HORROR → Mage |
| Quang Trư (heo đèn) | Ánh sáng | Tia Sáng (phép) · Ánh Sáng Đầu Tiên (hồi 1 + xóa trạng thái xấu, kể cả Doom) · Đèn Dẫn Lối (cả đội ACC Up + MATK Up) · Tia Lumina (phép mạnh) | **Lồng Đèn Trung Thu**: Auto-Revive cả đội 1 lần + hồi 25% | FUNNY → Support; VIETNAM → Mage; cá Phát Sáng → Mage; cá Trăng → Support |
| Lôi Dương (heo sừng) | Sấm | Lôi Kích (vật lý) · Tốc Lôi (cả đội Speed Up) · Chuỗi Sét (3 đòn vào địch ngẫu nhiên) · Gọi Sấm (cả địch + 25% Stun) | **Hiệu Lệnh Sấm**: sát thương Sấm cả địch ×2,5, Speed Up cả đội | HERO → Physical DPS; SCIFI → Mage |
| Thiết Giáp (heo rừng giáp) | Kim loại | Chém Thép (vật lý) · Tường Khiên Đồng (tự DEF Up + Taunt) · Phá Giáp (DEF Down) · Húc Thép (vật lý ×2,4 + Stun) | **Đoàn Kỵ Thép**: vật lý cả địch ×2 + DEF Down, bản thân Shield 25% | ADVENTURE → Physical DPS (Heo Hiệp Sĩ khởi đầu); JOB → Tanker |
| Hỏa Giải (cua rèn) | Lửa | Càng Nung (vật lý + Burn) · Lửa Rèn (tự ATK Up) · Phun Dung Nham (cả địch + Burn) · Búa Hỏa Ngục (vật lý ×2,4) | **Lò Rèn Nguyên Thủy**: cả địch Lửa ×2 + Burn, cả đội ATK Up | FOOD → Mage; cá Betta → Physical DPS; Koi Rồng → Physical DPS |
| Mộc Mẫu (heo mẹ hoa) | Thiên nhiên | Gai Độc (phép + Poison) · Chồi Non (Regen 1) · Rễ Trói (cả địch EVA Down + Speed Down) · Hoa Hồi Sinh (cả đội Regen) | **Rừng Mẹ Ôm Ấp**: cả đội hồi 30% + Regen 3 lượt, cả địch Poison | FARM → Tanker; MEADOW → Support; WILD → Physical DPS; cá Nóc → Mage |
| Hư Không (sứa) | Void | Va Chạm Thuần (Void) · Màn Hư Vô (xóa mọi trạng thái của cả hai phe) · Lệch Pha (tự EVA Up + hồi 15 MP) · Xoáy Hư Không (cả địch Void) | **Bầu Trời Trong Chuông**: sát thương Void cả địch ×2,2, xóa buff của địch | FANTASY → Mage |

Sức mạnh gốc của Unique Skill hệ Void thấp hơn skill cùng loại ~15% (giữ R5). Bảng tên tiếng Anh nằm ở bảng chuỗi.

### 6.3 Ultimate
- Tung được khi **Rage = Rage tối đa** (100) và không bị Stun / Freeze. Disable **không** chặn Ultimate.
- Mỗi trận mỗi con tung **tối đa 1** Ultimate. Tung xong Rage → 0.
- Ultimate có hệ (hoặc không, nếu chỉ buff / hồi); ma trận, trạng thái, phản ứng áp dụng như skill.
- Dữ liệu: `id, name, description, element, target, power, effects[], rageCost (=rageMax), oncePerBattle`.

---

## 7. Class Skill Tree, SP, nâng cấp, loadout

### 7.1 Cây
Mỗi class một cây: **3 tầng, 8 node, 2 nhánh** (khởi điểm; data cho phép nhiều hơn). Node có: `id, tier, branch, prerequisites[{node, minLevel}], unlockCost (SP), maxLevel, upgradeCost[] (SP mỗi cấp), skill (theo mẫu §12), perLevel (tăng gì mỗi cấp)`. Hỗ trợ prerequisite nhiều node (A + C → D).

| Class | Tầng 1 | Tầng 2 — nhánh trái | Tầng 2 — nhánh phải | Tầng 3 |
|---|---|---|---|---|
| Tanker | Khiêu Khích (Taunt 2 lượt) · Thủ Vững (tự DEF + MDEF Up) | *Phòng ngự:* Tường Khiên (Shield cả đội) · Hồi Sức (tự hồi 25% + xóa 1 trạng thái xấu) | *Khống chế:* Phá Giáp (DEF Down) · Dậm Đất (cả địch Speed Down) | Pháo Đài Sống (cần Tường Khiên + Khiêu Khích) · Chấn Động (cần Dậm Đất + Phá Giáp: cả địch 30% Stun) |
| Physical DPS | Chém Mạnh (×1,8) · Ngắm Chuẩn (tự ACC Up + CRIT +20 một lượt) | *Bùng nổ:* Liên Hoàn (3 đòn ×0,6) · Xé Giáp (đòn + DEF Down) | *Nhanh nhẹn:* Lướt Gió (tự EVA Up + Speed Up) · Đòn Hiểm (CRIT +40) | Tuyệt Kỹ (cần Liên Hoàn + Chém Mạnh: ×3) · Bóng Ảnh (cần Lướt Gió + Đòn Hiểm: 4 đòn, mỗi đòn +EVA) |
| Mage | Cầu Năng Lượng (hệ **của người dùng**) · Tập Trung (tự MATK Up) | *Hủy diệt:* Mưa Nguyên Tố (cả địch, hệ người dùng) · Xuyên Phép (MDEF Down) | *Khống chế:* Đóng Băng (Nước, Freeze 1 lượt, 60%) · Phong Ấn (Disable 2 lượt) | Thiên Thạch (cần Mưa Nguyên Tố + Cầu Năng Lượng: cả địch ×1,6, hệ người dùng) · Bão Phép (cần Phong Ấn + Xuyên Phép: 2 trạng thái xấu ngẫu nhiên lên cả địch) |
| Support | Hồi Phục (hồi 1) · Cổ Vũ (ATK + MATK Up 1 đồng đội) | *Chữa lành:* Mưa Hồi Phục (hồi cả đội) · Thanh Tẩy (xóa trạng thái xấu cả đội) | *Khích lệ:* Khích Lệ (cả đội ATK + MATK Up) · Truyền Năng (hồi 25 MP 1 đồng đội) | Tinh Thần Bất Khuất (cần Mưa Hồi Phục + Thanh Tẩy: Auto-Revive 1 đồng đội) · Hào Quang (cần Khích Lệ + Truyền Năng: cả đội Regen + DEF Up) |

Skill có hệ `SELF` = dùng hệ chính của người tung (Mage "Cầu Năng Lượng" của heo Lửa là cầu lửa). Đây là cách cây class chung vẫn hợp từng dòng.

### 7.2 SP
- +2 SP mỗi lần lên cấp (cấp 30 = 58 SP); +3 SP lần đầu hạ mỗi trùm vùng (một lần cho mỗi chiến binh có mặt); Cuộn Kỹ Năng (+2 SP, rương báu, dùng cho một chiến binh).
- Giá: mở node tầng 1 / 2 / 3 = 2 / 4 / 6 SP. Nâng cấp: tầng 1 tối đa Lv5, tầng 2 Lv4, tầng 3 Lv3; giá mỗi cấp 1, 2, 3, 4 SP.
- Mở hết một cây cần khoảng 86 SP > số SP có được → **phải chọn nhánh** (mục tiêu build).
- Mỗi chiến binh mới nhận sẵn node tầng 1 đầu tiên của class (miễn phí) để có skill class ngay.
- Số trong ví dụ của master prompt (50 / 200 / 500 SP) chỉ là minh họa; thang nhỏ ở đây dễ đọc hơn và cùng tỉ lệ tăng dần.

### 7.3 Nâng cấp
Mỗi cấp tăng một vài thứ theo `perLevel` (sát thương, hồi, thời gian, tỉ lệ trạng thái, chính xác, giảm MP, giảm hồi chiêu, số mục tiêu). Không phải skill nào cũng tăng mọi thứ.

### 7.4 Loadout
`Đã mở` → `Mang theo` (**3 ô** class skill, số ô là cấu hình `classLoadoutSlots`). Đổi loadout ở Trại hoặc trên bản đồ (ngoài trận).

### 7.5 Tẩy điểm
Ở Đền Huấn Luyện: lần đầu miễn phí, sau đó 50 × cấp Sobi Coin; hoàn toàn bộ SP.

### 7.6 Thanh hành động trong trận
Đánh thường · 4 Unique · 3 Class · Ultimate · Phòng thủ · Vật phẩm.

---

## 8. Tài nguyên trận: MP, hồi chiêu, Rage

### 8.1 MP
- MP tối đa = MP gốc class × tăng theo cấp. Vào chuyến đầy MP; MP mang qua các trận trong chuyến.
- Hồi: +10% MP tối đa đầu mỗi lượt của mình; đòn thường +8%; **Phòng thủ** +20% (và nhận −50% sát thương đến lượt sau).
- Skill thường 8–15 MP, skill mạnh 20–35 MP. Không đủ MP → nút mờ, kèm lý do.

### 8.2 Hồi chiêu
Đếm theo lượt của chính combatant. Skill có thể có cả MP lẫn hồi chiêu.

### 8.3 Rage
- `rageGain = round(rageMax × (sát thương cuối nhận được / HP tối đa) × rageK)`, `rageK = 1,2`. Chỉ tính **sau** giáp, kháng, khiên (sát thương khiên hút không cho Rage). Sát thương từ Poison / Burn có cho Rage.
- Không vượt Rage tối đa. Rage **giữ qua các trận và các chuyến** (lưu ở hồ sơ). Không giảm theo thời gian.

---

## 9. Chín nguyên tố và ma trận

### 9.1 Danh sách (id nội bộ duy nhất)
`METAL` Kim loại · `NATURE` Thiên nhiên · `WATER` Nước · `FIRE` Lửa · `EARTH` Đất · `LIGHTNING` Sấm · `DARK` Bóng tối · `LIGHT` Ánh sáng · `VOID` Hư Không (Void / Neutral).
Hệ cũ: `WIND` → `LIGHTNING`; `FIRE`, `EARTH`, `WATER` giữ nguyên id.

### 9.2 Kiểu tương tác (`content/adventure/elements.json`)
| Kiểu | Hệ số khởi điểm |
|---|---|
| Strong (khắc) | ×1,5 |
| Neutral | ×1,0 |
| Weak (bị kháng) | ×0,75 |
| Resist | ×0,5 |
| Immune | ×0 (chỉ dùng cho ghi đè của trùm) |

### 9.3 Ma trận — Ngũ hành tương khắc + Sấm + Ánh sáng/Bóng tối + Void
Vòng khắc Ngũ hành: **Kim → Mộc (Thiên nhiên) → Thổ (Đất) → Thủy (Nước) → Hỏa (Lửa) → Kim**.

Hàng = hệ đòn đánh, cột = hệ của mục tiêu. S = Strong, W = Weak, R = Resist, · = Neutral.

| Đòn ↓ / Mục tiêu → | Kim | T.nhiên | Nước | Lửa | Đất | Sấm | B.tối | A.sáng | Void |
|---|---|---|---|---|---|---|---|---|---|
| **Kim** | W | **S** | · | W | · | · | · | · | · |
| **Thiên nhiên** | W | W | · | · | **S** | · | · | · | · |
| **Nước** | · | · | W | **S** | W | · | · | · | · |
| **Lửa** | **S** | · | W | W | · | · | · | · | · |
| **Đất** | · | W | **S** | · | W | **S** | · | · | · |
| **Sấm** | **S** | · | **S** | · | R | W | · | · | · |
| **Bóng tối** | · | · | · | · | · | · | W | **S** | · |
| **Ánh sáng** | · | · | · | · | · | · | **S** | W | · |
| **Void** | · | · | · | · | · | · | · | · | · |

- Sinh vật hai hệ: nhân hai hệ số (giới hạn 0,25 – 2,0).
- Void: hàng và cột toàn Neutral (R5). Không bao giờ ×1,5, nên đánh đúng hệ khắc luôn hơn Void; Void hơn đánh vào hệ bị kháng.
- Ghi đè từng kẻ địch được (`elementOverrides`, ví dụ trùm miễn nhiễm một hệ).
- Thẻ **Umbraflux** của kẻ địch không phải nguyên tố; tương tác với Ánh sáng đi qua phản ứng "Thanh Tẩy" (§11).

### 9.4 Đòn thường
Vật lý, hệ = hệ chính của sinh vật, sức mạnh 1,0, chính xác 95.

---

## 10. Trạng thái (`content/adventure/statuses.json`)

### 10.1 Mẫu dữ liệu
`id, kind (dot | control | stat | recovery | special), sourceElement?, duration, maxStacks, baseChance, effect{…}, cleansable, dispellable (buff), immunityAfter (lượt miễn nhiễm sau khi hết), expiration (startOfTurn | endOfTurn | onHit)`.

### 10.2 Danh sách
| Trạng thái | Loại | Nguồn | Hiệu ứng (khởi điểm) |
|---|---|---|---|
| Poison | dot | Thiên nhiên | đầu lượt mất 6% HP tối đa, cộng dồn 3, 3 lượt |
| Burn | dot | Lửa | đầu lượt mất 5% HP tối đa (hệ Lửa, qua ma trận), 3 lượt |
| Wet | special | Nước | không gây hại; mở phản ứng (§11); 2 lượt |
| Freeze | control | (Nước, skill riêng) | mất lượt, tối đa 2 lượt; bị đánh vỡ băng (§11 "Vỡ Băng"); sau đó miễn Freeze 2 lượt |
| Stun | control | — | mất lượt hiện tại; sau đó miễn Stun 1 lượt |
| Disable | control | — | không dùng được Unique / Class skill; vẫn đánh thường, phòng thủ, vật phẩm, Ultimate |
| Doom | special | — | đếm 3 → 0 rồi KO ngay. **Chỉ kẻ địch cấp cao / trùm dùng.** Chỉ Ánh Sáng Đầu Tiên, Thanh Tẩy, Auto-Revive cứu được. Trùm miễn Doom |
| ATK / DEF / MATK / MDEF Up · Down | stat | — | ±30% (Up) / −25% (Down), 3 lượt |
| ACC / EVA Up · Down | stat | — | ±20 điểm, 3 lượt |
| Speed Up · Down | stat | — | ×1,3 / ×0,7 tốc độ, 3 lượt |
| Shield | special | — | hút sát thương = % HP tối đa của người tạo khiên |
| Taunt | special | — | địch đơn mục tiêu phải nhắm người có Taunt |
| Regen | recovery | — | đầu lượt hồi 8% HP tối đa |
| Auto-Revive (Morale) | recovery | Support / Ultimate | khi bị KO: hồi 30% HP, mất trạng thái này; không cộng dồn |

Cùng trạng thái áp lại: làm mới thời gian (trừ khi có `maxStacks`). Up và Down cùng chỉ số: triệt tiêu nhau.

### 10.3 Tỉ lệ dính
`chance = baseChance + skill + đặc tính + trang bị − kháng của mục tiêu`, giới hạn 0–95% (trừ skill đánh dấu "chắc chắn"). Mục tiêu có `statusResist{id: %}`, `statusImmune[]`, `statusVulnerable{id: %}`.

---

## 11. Phản ứng nguyên tố (`content/adventure/reactions.json`)

Mẫu: `id, trigger (incomingElement | incomingCategory), requires (status | tag), effect{damageMult, applyStatus, consume, spread}, priority`. Mỗi đòn kích tối đa 1 phản ứng (ưu tiên cao nhất).

| Phản ứng | Điều kiện | Hiệu ứng |
|---|---|---|
| Điện Giật | mục tiêu Wet + đòn Sấm | +30% sát thương, 35% Stun, tiêu Wet |
| Hơi Nước | mục tiêu Wet + đòn Lửa | tiêu Wet, ACC Down 2 lượt (bị hơi nước làm mờ) |
| Cháy Rừng | mục tiêu Poison + đòn Lửa | tiêu Poison, Burn 2 lượt lên **mọi** kẻ địch |
| Vỡ Băng | mục tiêu Freeze + đòn vật lý hoặc Lửa | ×1,5 sát thương, Freeze kết thúc (định nghĩa duy nhất của "bonus khi đóng băng") |
| Thanh Tẩy | mục tiêu có thẻ Umbraflux + đòn Ánh sáng | +25% sát thương, xóa 1 buff của mục tiêu |
| Nhật Thực | mục tiêu có trạng thái nguồn Bóng tối + đòn Ánh sáng | thêm sát thương Void = 25% đòn đó, tiêu trạng thái nguồn Bóng tối |

---

## 12. Mẫu dữ liệu skill (`content/adventure/skills.json`)

```text
Skill { id, nameKey, descKey, type (unique | class | ultimate | enemy), category (physical | magical | support),
  element (9 hệ | SELF | null nếu không gây sát thương), target (enemy | allEnemies | randomEnemies(n) | ally | allAllies | self),
  power, hits, accuracy, mpCost, cooldown, effects[ damage | heal | shield | applyStatus{id, chance, turns}
  | cleanse{count|all, side} | dispel | modifyRage | modifyMp | revive ], critBonus, upgrade{maxLevel, perLevel{…}},
  animation (id FX → manifest) }
```
Skill không gây sát thương có `element: null`. Skill gây sát thương trung tính dùng `VOID`.

---

## 13. Trang bị và Affinity (`content/adventure/equipment.json`)

```text
Equipment { id (vật phẩm loại EQUIPMENT), slot (weapon | armor | charm), rarity, levelReq, stats{hp, mp, atk, def, matk, mdef, spd, acc, eva, crit},
  elementAffinity?{element, damagePct, resistPct}, statusAffinity?{status, chancePct}, skillModifier?{category | element | skillId, effectPct},
  elementResist?{element: pct}, statusResist?{status: pct}, passive?, upgrade? }
```
- **Trần chống cộng dồn**: tổng +% sát thương một hệ ≤ 40%; tổng +tỉ lệ trạng thái ≤ 25 điểm; kháng hệ / trạng thái ≤ 60%. Trần nằm ở `balance.json`.
- Không món nào đổi hệ gốc (R7). Chuyển hệ chỉ khi món có cơ chế `elementConversion` riêng (đợt này không có món nào).
- 12 món cũ giữ id. Đổi: Lông Vũ Gió → **Lông Vũ Sấm** (Sấm +10%); Gươm Lửa (Lửa +10%, Burn +5); Giáp Rêu Đá (kháng Đất 20%); Bùa Mặt Trời (Ánh sáng +10%); bộ Rune (Void / Kim loại). Thêm khoảng 9 món mới: mỗi hệ một món có affinity (ví dụ Gậy Lửa: Lửa +15%, Burn +5; Nhẫn Rừng: Thiên nhiên +10%, Poison +5), rơi ở rương báu và trùm.
- Chuyển đổi chỉ số cũ: `atk` của vũ khí phép (gậy, bùa) → `matk`; giáp cho thêm `mdef` bằng 60% `def`.

---

## 14. Kẻ địch, trùm, Umbraflux

- Kẻ địch dùng **chung** khung chỉ số, nguyên tố, trạng thái, skill. Thêm: `intentAi` (trọng số), `elementOverrides`, `statusResist`, thẻ `umbraflux`, `phases[]` (trùm).
- 19 kẻ địch hiện có giữ id, đổi hệ để mỗi vùng phủ nhiều hệ: Gió → Sấm; thêm Kim loại / Thiên nhiên / Bóng tối / Ánh sáng cho một số con (bảng cụ thể chốt ở bước content, kiểm bằng mô phỏng để không hệ nào luôn thắng).
- **Trùm có cơ chế**: đổi pha ở 50% HP (thêm skill, đổi hệ hoặc gọi quân). Trùm Tàn Tích dùng **Doom** (đếm 3) lên một chiến binh — có cảnh báo trước một lượt qua ý định.
- **Umbraflux**: ba trùm vùng là sinh vật bị nhiễm (Cổ Thụ Giận Dữ = rễ Mộc Mẫu, Rồng Dung Nham, Hộ Pháp Cổ Đại = tượng Thiết Giáp). Lần đầu hạ trùm → cảnh **thanh tẩy** ngắn (chữ + hiệu ứng), mở bia lore Guardian trong Codex, kích hoạt cổng dịch chuyển khu 3.
- Trùm khu (khu 1, 2): một nhóm tinh anh mạnh hơn quái thường; hạ lần đầu kích hoạt cổng khu đó; lần sau là trận tinh anh bình thường.

---

## 15. Trình tự giải quyết trận (định nghĩa duy nhất)

### 15.1 Vòng và lượt
1. **Xác định thứ tự lượt**: đầu mỗi vòng sắp theo SPD hiện tại (đồng tốc: phe mình trước, rồi theo vị trí). Thanh thứ tự lượt hiển thị vòng này và vòng sau.
2. **Đầu lượt**: Poison, Burn → Regen → đếm Doom (về 0: KO, xử lý ở bước 16) → hiệu ứng đầu lượt khác → giảm thời gian các trạng thái hết hạn đầu lượt → +MP đầu lượt → giảm hồi chiêu.
3. **Kiểm tra khống chế**: Stun / Freeze → bỏ lượt (sang bước 17). Disable → chỉ cho đánh thường, phòng thủ, vật phẩm, Ultimate.
4. **Chọn hành động** (người chơi, nút Tự động, hoặc AI theo ý định đã công bố).
5. **Kiểm tra tài nguyên**: MP, hồi chiêu, Rage, số vật phẩm, Taunt (đổi mục tiêu đơn về người Taunt).
6. **Giải quyết đòn**: trừ MP / vật phẩm / Rage; với mỗi mục tiêu, mỗi đòn đánh (`hits`):
7. **Hiệu ứng gốc**: kiểm tra trúng `trúng = accuracy × ACC/100 × (1 − EVA/100)` (giới hạn 5–100%; skill hỗ trợ luôn trúng); sát thương gốc = công (ATK hoặc MATK) × power × buff của người đánh.
8. **Ma trận nguyên tố**: × hệ số (§9).
9. **Giáp / kháng**: × `K / (K + DEF hoặc MDEF)` (K = 30); × kháng hệ của trang bị; × (1 − 0,5 nếu đang Phòng thủ); × hệ số phản ứng nếu bước 13 kiểm trước rằng phản ứng có `damageMult` (phản ứng được **xác định** trước bước 10, **áp hiệu ứng phụ** ở bước 13).
10. **Sát thương cuối**: × chí mạng (×1,5 nếu trúng CRIT) × ngẫu nhiên ±10% × modifier khác (affinity, đền, khẩu phần), làm tròn, tối thiểu 1 nếu trúng và hệ số > 0.
11. **Áp sát thương / hồi / khiên**: khiên hút trước, phần còn lại trừ HP.
12. **Áp trạng thái** của skill (tung tỉ lệ §10.3).
13. **Phản ứng nguyên tố**: áp hiệu ứng phụ, tiêu trạng thái điều kiện.
14. **Cập nhật Rage** của mục tiêu theo sát thương cuối vào HP (§8.3), rồi kiểm tra Ultimate có sẵn.
15. **Kiểm tra KO** (HP ≤ 0).
16. **KO / Auto-Revive**: có Auto-Revive → hồi 30%, mất trạng thái; không → bị hạ, mất mọi trạng thái.
17. **Cuối lượt**: trạng thái hết hạn cuối lượt, Phòng thủ hết khi tới lượt sau của chính nó.
18. **Lượt kế** / vòng kế. Một phe hết người → kết thúc. Quá 40 vòng → thua.

### 15.2 Tính ngẫu nhiên
Mọi lần bốc của một hành động sinh từ `(seed trận, số hành động)` qua `core/rng` (như cũ): trận lưu giữa chừng chơi tiếp ra đúng kết quả.

### 15.3 AI
AI chấm điểm từng lựa chọn (sát thương kỳ vọng có tính ma trận và phản ứng, hồi khi máu thấp, khống chế, giải Doom) và bốc trong nhóm điểm cao. Dùng cho kẻ địch và nút **Tự động**.

### 15.4 Ý định của kẻ địch (R2)
Đầu mỗi vòng, mỗi kẻ địch **chọn trước** hành động; trên đầu nó hiện icon ý định (đánh, skill hệ X vào ai, buff, tụ lực, Doom). Tới lượt nó làm đúng việc đó (đổi mục tiêu nếu mục tiêu đã bị hạ; bị Stun thì mất). Người chơi có thông tin để phòng thủ, khống chế hay giải trạng thái đúng lúc.

### 15.5 Xem trước khi chọn mục tiêu
Chọn skill → trên mỗi mục tiêu hiện nhãn **Hiệu quả! / Bình thường / Kém / Kháng** và icon phản ứng sẽ kích (nếu có).

---

## 16. Thắng, thua, EXP, loot

- EXP mỗi trận cho cả đội còn đứng (đã gục vẫn nhận 50%). Nhịp lên cấp giữ tinh thần decision 019 (cấp 30 sau khoảng 25 ngày chơi đều), chỉnh lại bằng `sim:week`.
- Loot quái thường, rương báu, trùm theo bảng hiện có của từng vùng; Gems theo GAME_BALANCE §8 (rương báu 3–4%, rương trùm 8–12%). Vật liệu cổ, hạt / cá / trứng hiếm về các Area như decision 019.
- Thua: kiệt sức 4 giờ, giữ EXP, loot đã nhặt; Rage giữ nguyên. Không có hình phạt khác.

---

## 17. UI (chức năng; hình đẹp ở bước art)

- **Trại Phiêu Lưu**: chọn vùng (% khám phá, cổng đã mở, Đi nhanh), chọn đội + 3 đội hình lưu sẵn, chọn So / Bi, khẩu phần, Đền Huấn Luyện (đổi class, tẩy điểm).
- **Hồ sơ chiến binh** (tab): Chỉ số · Kỹ năng (4 Unique + Ultimate) · Skill Tree (node, đường nối, prerequisite, SP còn lại, nâng cấp) · Loadout (3 ô) · Trang bị.
- **Bản đồ**: HUD gọn (mỗi chiến binh: chân dung, thanh HP / MP / Rage), tên khu, năng lượng, nút Túi / Menu, gợi ý phím, bản đồ nhỏ.
- **Trận**: hai hàng đơn vị, thanh thứ tự lượt, icon ý định, icon trạng thái có giải thích khi rê chuột, thanh HP / MP / Rage, thanh hành động (§7.6), nhãn hiệu quả (§15.5), nút Tự động, tốc độ ×2, nhật ký chữ.
- Hợp màn hẹp như mọi UI hiện có. Chơi trận bằng chuột hoặc phím số (1–9).

---

## 18. Ngôn ngữ
Tiếng Việt mặc định, tiếng Anh đầy đủ (hệ thống i18n có sẵn: `vi.ts`, `en/`, `content/i18n/en.json`). Mọi tên skill, class, trạng thái, phản ứng, khu, vật thể đều qua bảng chuỗi.

---

## 19. Save và migration

- Save thế giới **giữ v11**. Slice `areas.sobi_adventure` lên **v2**, có migration v1 → v2 và test với save thật:
  - Chiến binh giữ cấp, EXP, trang bị, năng lượng, kiệt sức; thêm `classId` và `lineageId` mặc định (§6.2), `sp = 2 × (cấp − 1)`, node tầng 1 đầu tiên mở sẵn, `rage = 0`.
  - Chuyến đang dở (kiểu điểm dừng cũ): đóng an toàn, loot đã nhặt vào hàng chờ, **hoàn năng lượng** của chuyến đó.
  - `cleared` giữ nguyên → mọi cổng dịch chuyển của vùng đã hạ trùm hoạt động.
  - Mọi hệ `WIND` còn lưu → `LIGHTNING`.
- Trạng thái mới: `explore{zoneId, mapId, x, y, facing}` của chuyến, `defeatedGroups` (trong chuyến), `harvested` (trong chuyến), `springsUsed` (trong chuyến), `openedChests`, `openedGates`, `activePortals`, `loreFound` (vĩnh viễn), `formations[3]`.
- Lưu được ở mọi lúc như hiện nay (kể cả giữa trận: trận lưu theo hành động và chơi tiếp đúng kết quả). Đây là bản mạnh hơn yêu cầu "lưu khi không ở trong trận".

---

## 20. Admin
Admin mới (decision 036) dựng form từ schema nên các file content mới tự có trang sửa. Thêm:
- **Trình sửa bản đồ**: lưới ô, tô `walk` / `block`, đặt vật (hiện footprint đè lên hình), rương, nhóm quái + đường tuần, cổng nguyên tố, cổng dịch chuyển, lối ra, suối, NPC, điểm xuất hiện. Kiểm tra §3.10 chạy trực tiếp, lỗi tô đỏ, không cho lưu khi còn lỗi.
- **Xem Skill Tree** (đồ thị node, prerequisite).
- **Mô phỏng trận** cập nhật: chọn class, loadout, cấp, trang bị, đội; đo tỉ lệ thắng, số vòng, tỉ lệ dùng từng skill / phản ứng.
- Tua thời gian dịch cả năng lượng và kiệt sức (như cũ).

---

## 21. Liên kết với Area khác (giữ nguyên)
Potion (Healing, Chiến Đấu) dùng trong trận; khẩu phần Garden; vật liệu cổ cho công trình Lv3–Lv4 và công nghệ; hạt / cá / trứng hiếm về Area gốc; Bond tăng chỉ số; sự kiện chuẩn `battle.won`, `adventure.finished`; mục tiêu ngày, thành tựu, đơn hàng. Thêm sự kiện `adventure.chestOpened`, `adventure.portalActivated`, `adventure.gateOpened` cho mục tiêu / thành tựu mới.

Điều kiện mở Adventure: Sobi World cấp 8 + Phát triển thế giới **16** (chủ dự án chốt 2026-10-17, thay 20).

---

## 22. Ngoài phạm vi đợt này
30 loài hậu duệ mới và First Guardians có thể chơi; Sobi Essence và Đài Phong Ấn (endgame lore); vùng mới thứ tư; cường hóa trang bị (`upgrade` có trong schema nhưng chưa có món dùng); chuyển hệ bằng trang bị.

---

## 23. Thứ tự triển khai

| Bước | Nội dung |
|---|---|
| A0 | Tài liệu này + decision 037 |
| A1 | Lõi combat V2 (`systems/combat`): chỉ số mới, 9 hệ, ma trận, khung trạng thái, phản ứng, MP, Rage, Ultimate, Phòng thủ, ý định, pipeline §15; test từng bước |
| A2 | Content: elements, statuses, reactions, classes + cây, lineages + Unique / Ultimate, skills, kẻ địch đổi hệ, trang bị affinity; schema, chuỗi Việt / Anh, `items:audit`; mở Adventure ở WD 16 |
| A3 | Progression + save: SP, mở / nâng node, loadout, đổi class, tẩy điểm, đội hình; slice v2 + migration |
| A4 | UI trận + Trại + hồ sơ chiến binh |
| A4b | Bản đồ khám phá: lưới, footprint, di chuyển bằng phím, So / Bi + đội theo sau, quái trên bản đồ, rương báu, cổng nguyên tố, cổng dịch chuyển, suối, NPC, bản đồ nhỏ, kiểm tra §3.10; 9 khu cho 3 vùng |
| A5 | Trùm có cơ chế, Umbraflux, cân bằng (`sim:adventure`, `sim:week`), test giữ đường cong |
| A6 | Admin: trình sửa bản đồ, xem Skill Tree, mô phỏng trận |
| A7 | Art (GĐ14): nền 9 khu, đạo cụ có footprint, icon 9 hệ / trạng thái / ý định, VFX hệ, cut-in Ultimate, sprite theo `FIRST_GUARDIANS_ART_PLAN.md` |
| A8 | Nghiệm thu: e2e, build, PROGRESS |

---

## 24. Checklist nghiệm thu

**Combat**
- [ ] Đội 3; 4 Unique / chiến binh; 1 class; Ultimate riêng ngoài cây
- [ ] Skill Tree có tầng, nhánh, prerequisite nhiều node, giá SP, cấp nâng, giá nâng tăng dần; loadout 3 ô (cấu hình)
- [ ] SP chỉ cho cây; EXP chỉ cho cấp; MP chỉ cho skill; Rage chỉ cho Ultimate
- [ ] Rage theo % HP mất sau giáp, không vượt trần, giữ qua trận, về 0 sau Ultimate, 1 lần / trận
- [ ] Đúng 9 hệ; không có hệ Poison / Gió; ma trận Ngũ hành §9.3 từ data; Void toàn Neutral
- [ ] Đủ trạng thái §10.2; Freeze / Stun có miễn nhiễm sau khi hết; Doom chỉ ở kẻ địch, có cách giải
- [ ] 6 phản ứng §11 từ data, tách khỏi ma trận
- [ ] Trang bị có affinity hệ / trạng thái / skill, có trần; không đổi hệ gốc
- [ ] Pipeline đúng §15 (có test theo thứ tự bước); trận lưu giữa chừng ra đúng kết quả
- [ ] Ý định kẻ địch, thanh thứ tự lượt, nhãn hiệu quả hiển thị

**Bản đồ**
- [ ] Di chuyển chỉ bằng phím mũi tên / WASD; Space tương tác
- [ ] So / Bi dẫn, 3 sinh vật theo sau
- [ ] Va chạm theo lưới; footprint phủ đúng đế vật (test so với sprite)
- [ ] Quái thấy trước, chạm mới đánh, hạ rồi mất đến hết chuyến
- [ ] Rương báu ẩn mở 1 lần / save, luôn có đường tới (test mọi khu)
- [ ] Đường chính không cần cổng nguyên tố (test)
- [ ] Cổng dịch chuyển: khu 1 mở sẵn, khu khác mở khi hạ trùm khu; dịch chuyển giữa mọi cổng đã mở
- [ ] % khám phá, bản đồ nhỏ, lưu vị trí

**Chung**
- [ ] Save cũ đọc được, migration có test với save thật; không mất gì
- [ ] Mọi bảng sửa được ở Admin; trình sửa bản đồ chặn bản đồ lỗi
- [ ] Việt / Anh đầy đủ; `npm run check` xanh; `items:audit` sạch
