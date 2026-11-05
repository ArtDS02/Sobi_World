# Audit bản đồ Sobi Adventure — đối chiếu với đề xuất mở rộng 18 map

Ngày: 2026-10-29 · Nhánh: `phase-14-art` · Chỉ đọc, chưa sửa gameplay.
Đầu vào: `Sobi_Adventure_World_Map_Spec_for_Claude.md` (chủ dự án, gọi tắt **spec map**), `content/adventure/{maps,zones,enemies}.json`, `src/areas/adventure/logic/**`, `scene/mapView.ts`, decision 019 / 037 / 041, batch `art_inbox/.batch/adventure-11-map/`.

Về quyền sửa: decision 037 đã mở băng cho Adventure (combat, progression, bản đồ, slice save Adventure), nên mở rộng map **được phép** về nguyên tắc. Tuy vậy, đây là thay đổi lớn về gameplay, nên cần một decision mới được duyệt trước khi làm.

---

## 1. Chín map hiện có và nguồn định nghĩa

Toàn bộ bản đồ nằm trong một file dữ liệu là `content/adventure/maps.json`, có schema `content/schemas/adventure/maps.ts` và Admin `tools/admin/adventureMaps.ts`. Vùng nằm trong `content/adventure/zones.json`. Map vẽ bằng ô: mỗi vùng có một bộ tile `adv_tile_<zone>_{ground,path,bridge,wall,water}`, chưa có tranh nền vẽ tay. Ô 40 px, lưới 50 × 28 (2000 × 1120).

| # | Map key | Tên | Vùng (cấp đội) | Nhóm quái | Rương | Cổng hệ | Lore | Khác |
|---|---|---|---|---|---|---|---|---|
| M1 | `map_forest_edge` | Bìa Rừng | Rừng (1–10, WL 8) | 4 thường + kẻ canh | 2 | FIRE | 1 | NPC thảo dược, suối, 2 điểm hái |
| M2 | `map_forest_deep` | Rừng Sâu | Rừng | 4 + kẻ canh | 2 | NATURE, EARTH | 1 | NPC đền, suối |
| M3 | `map_forest_heart` | Lõi Rừng | Rừng | 3 + **trùm Cổ Thụ Giận Dữ** | 1 | DARK | 1 | đền Guardian NATURE |
| M4 | `map_mountain_foot` | Chân Núi | Núi (7–16, WL 10, sau trùm Rừng) | 4 + kẻ canh | 2 | METAL | 1 | NPC thợ mỏ |
| M5 | `map_mountain_mine` | Mỏ Quặng Bỏ Hoang | Núi | 4 + kẻ canh | 2 | WATER, LIGHTNING | 1 | suối nước nóng |
| M6 | `map_mountain_peak` | Đỉnh Dung Nham | Núi | 3 + **trùm Rồng Dung Nham** | 1 | EARTH | 1 | đền FIRE |
| M7 | `map_ruins_gate` | Cổng Tàn Tích | Tàn Tích (12–22, WL 13, sau trùm Núi) | 4 + kẻ canh | 2 | LIGHT | 1 | bàn thờ rune |
| M8 | `map_ruins_hall` | Hành Lang Rune | Tàn Tích | 4 + kẻ canh | 2 | LIGHTNING, DARK | 1 | kho cổ |
| M9 | `map_ruins_sanctum` | Điện Phong Ấn | Tàn Tích | 3 + **trùm Hộ Pháp Cổ Đại** | 1 | METAL | 1 | đền LIGHT |

Mỗi map còn có một cổng khu 2×2 (`portal`) và một điểm xuất phát (`spawn`).

### 1.1 Lý do map "ít và nhàm"

**Ba vùng dùng chung ba bố cục.** Map thứ hai và thứ ba của mỗi vùng giống hệt nhau (0 ô khác biệt):
- M2 = M5 = M8
- M3 = M6 = M9

Map đầu vùng cũng gần như là một: M1 / M4 / M7 chỉ lệch 118–182 ô trên 1.400 ô. Thực tế game chỉ có **3 layout**, đổi màu tile và đổi vật trang trí theo vùng. Mục 8 của spec map cấm đúng điều này ("Không dùng cùng một bố cục chỉ đổi palette").

**Phòng kín.** Cả 9 map có vành `#` chạy quanh chu vi. Chỗ hở duy nhất là 3 ô giữa mép trái và/hoặc phải (hàng 12–14), chỗ đặt lối ra.

| Map | Ô mép không phải tường | Mép có lối hở |
|---|---|---|
| M1, M4, M7 | 3 / 152 | chỉ Đông |
| M2, M5, M8 | 6 / 152 | Tây + Đông |
| M3, M6, M9 | 3 / 152 | chỉ Tây; lối "tiếp" là cổng đặt bên trong, sau trùm |

**Lối ra luôn cùng một chỗ.** Mọi lối ra đều ở hàng 12–14, bên trái hoặc bên phải; không có lối Bắc / Nam, không có cửa hang hay cầu bên trong map.

**Quái lặp lại.** Cả 3 map trong một vùng bốc quái từ cùng một nhóm 7 loài.

---

## 2. Bảng lối ra thực tế (từ code)

Logic khóa: `exitOpen()` trong `logic/actions/trip.ts`.
- `lock: 'guardian'` → mở khi đã hạ kẻ canh hoặc trùm của map nguồn (`beaten`, lưu vĩnh viễn).
- Nếu map đích thuộc vùng khác thì **vùng đích phải đang mở** (`zoneOpen` = đủ World Level + đã hạ trùm vùng `requiresCleared`).

| Nguồn | Lối ra (ô) | → Đích (ô đến) | Điều kiện | Lưu ở |
|---|---|---|---|---|
| M1 | `exit_f1_east` (49,12–14) | M2 (2,13) | guardian M1 (Heo Rừng Gai) | `beaten` |
| M2 | `exit_f2_west` (0,12–14) | M1 (47,13) | — | |
| M2 | `exit_f2_east` (49,12–14) | M3 (2,13) | guardian M2 (Sói Đầu Đàn) | `beaten` |
| M3 | `exit_f3_west` (0,12–14) | M2 (47,13) | — | |
| M3 | `exit_f3_next` (48,12–14, trong map) | M4 (3,13) | trùm Cổ Thụ + vùng Núi mở | `beaten`, `cleared` |
| M4 | `exit_m1_back` (1,12–14) | M3 (46,13) | — | |
| M4 | `exit_m1_east` (49,12–14) | M5 (2,13) | guardian M4 (Người Đá Quặng) | `beaten` |
| M5 | `exit_m2_west` / `exit_m2_east` | M4 / M6 | east: guardian M5 (Cừu Sừng Sấm) | `beaten` |
| M6 | `exit_m3_west` (0,12–14) | M5 (47,13) | — | |
| M6 | `exit_m3_next` (48,12–14, trong map) | M7 (3,13) | trùm Rồng Dung Nham + vùng Tàn Tích mở | `beaten`, `cleared` |
| M7 | `exit_r1_back` / `exit_r1_east` | M6 / M8 | east: guardian M7 (Lính Gác Đá) | `beaten` |
| M8 | `exit_r2_west` / `exit_r2_east` | M7 / M9 | east: guardian M8 (Thầy Tế Bóng Tối) | `beaten` |
| M9 | `exit_r3_west` (0,12–14) | M8 (47,13) | — (ngõ cụt; sau trùm mở Vết Nứt Umbraflux ở Trại) | |

Ngoài lối ra còn có **cổng khu** (`portal`). Cổng dịch chuyển giữa mọi map đã thắp, kể cả khác vùng. Map đầu vùng thắp sẵn; các map khác thắp sau khi hạ kẻ canh / trùm (`activePortals`).

Kết luận: graph hiện tại là **một đường thẳng 9 nút** M1–M2–…–M9. Mọi lối đều hai chiều, chiều tiến bị khóa sau kẻ canh.

### 2.1 Sơ đồ boss / progression hiện có

| Vùng | Trùm (map) | Lưu khi thắng | Thứ phụ thuộc |
|---|---|---|---|
| Rừng | Cổ Thụ Giận Dữ (M3) | `cleared.zone_forest` + `beaten` | mở vùng Núi (`requiresCleared`), lối M3→M4, đi nhanh (sweep) vùng Rừng |
| Núi | Rồng Dung Nham (M6) | `cleared.zone_mountain` | mở vùng Tàn Tích, lối M6→M7 |
| Tàn Tích | Hộ Pháp Cổ Đại (M9) | `cleared.zone_ruins` | mở Vết Nứt Umbraflux (`RIFT.requiresCleared`) |

Mỗi map đều có kẻ canh (`elite`), hạ một lần là xong; lối tiến của map khóa sau kẻ canh. Vì vậy **luật boss gate ở mục 14.2 của spec map đã có sẵn**, và còn chặt hơn spec vì khóa theo từng map chứ không chỉ theo vùng.

---

## 3. So sánh với graph mục tiêu (mục 4 của spec map)

### 3.1 Cạnh hiện có

| Cạnh | Code | Spec map | Đề xuất |
|---|---|---|---|
| M1–M2, M2–M3, M3–M4, M4–M5, M7–M8, M8–M9 | có | tuyến chính | **giữ** |
| M5–M6 | có, tuyến chính | nhánh | **giữ là tuyến chính** |
| M6–M7 | có, tuyến chính (sau trùm Núi) | **không có** (spec đi M5→M7) | **giữ**. Bỏ cạnh này thì trùm Núi không còn chặn đường chính, mâu thuẫn với mục 14.2 của chính spec |
| M5–M7 | không có | tuyến chính | **không thêm**. Nếu thêm thì là một lối bỏ qua trùm Núi |

**Mâu thuẫn trong spec map:** mục 4.1 đặt tuyến chính đi M5 → M7, bỏ qua M6, trong khi mục 14.2 bắt phải hạ trùm Núi mới được sang Tàn Tích, mà trùm Núi ở M6. Đề xuất giữ tuyến chính như code: **M1→…→M6→M7→M8→M9**.

### 3.2 Cạnh mục tiêu chưa có (17 cạnh, đều cần map mới)

`M1–N1, N1–N2, N2–N3, N2–M3, N3–N7, N7–N8, N7–N9, N8–N9, M4–N4, N4–M6, N4–M7, M2–N5, N5–M5, N5–M8, M7–N6, M8–N6, M9–N6`

Lối ra mới cần mở trên **mỗi** map cũ: M1 +1, M2 +1, M3 +1, M4 +1, M5 +1, M6 +1, M7 +2, M8 +2, M9 +1. Không map cũ nào giữ nguyên được.

### 3.3 Nhánh có thể vượt boss gate, và cơ chế sẵn có xử lý được đến đâu

`exitOpen()` đã chặn mọi lối sang **vùng chưa mở**, nên chỉ cần gán map mới vào đúng vùng là phần lớn rủi ro tự được khóa:

| Cạnh | Rủi ro | Cơ chế vùng chặn? | Còn hở | Đề xuất |
|---|---|---|---|---|
| M2–N5–M5 | đi tắt Rừng → Núi | **Có** nếu N5 thuộc vùng Núi (M2→N5 khóa tới khi hạ trùm Rừng) | N5→M5 bỏ qua kẻ canh M4 | N5↔M5 là **đường tắt mở từ phía M5** |
| N5–M8 | đi tắt Núi → Tàn Tích | **Có** (M8 thuộc vùng Tàn Tích) | — | giữ |
| M4–N4–M6 | tới thẳng sân trùm Núi | không (cùng vùng) | bỏ qua kẻ canh M5 | N4↔M6 là **đường tắt mở từ phía M6** |
| N4–M7 | sang Tàn Tích | **Có** | — | giữ |
| N2–M3 | tới thẳng sân trùm Rừng | không | bỏ qua kẻ canh M2 | N2↔M3 là **đường tắt mở từ phía M3** |
| N3–N7 | sang vùng biển sớm | **Có** nếu vùng Biển có `requiresCleared` | — | cần quyết định mở vùng Biển sau trùm nào (câu hỏi Q3) |

Cơ chế duy nhất **còn thiếu** là đường tắt mở từ một phía (`lock: 'shortcut'`), xem mục 4.

---

## 4. Hệ thống tái sử dụng được và phần phải thêm

| Nhu cầu trong spec map | Đã có | Ghi chú |
|---|---|---|
| Lối ra có dữ liệu (§13.3) | `exits[]`: `id, x, y, w, h, to, arriveX, arriveY, lock` | Thiếu: hướng khi đến (`takeExit` đoán trái / phải theo `exit.x <= 1`, sai với lối Bắc / Nam / trong map) và loại ngưỡng (trail / cave / bridge…) để vẽ |
| Boss gate | `lock: 'guardian'`, `beaten`, `zoneOpen`, `cleared` | Đủ |
| Mở khóa rồi quay lại | **Cổng hệ** (`gates[]`, đội có con đúng hệ thì mở, lưu `openedGates`) | Đủ dùng cho bụi gai / dây leo / đá. Mẫu "rương trong ngách sau cổng hệ" đã có ở mọi map |
| Đường tắt mở từ phía bên kia | **Chưa có** | Thêm `lock: 'shortcut'` và mảng save `openedExits` (slice v4 → v5, migration cộng thêm, mặc định `[]`) |
| Kho báu | `chests[]` + bảng loot vùng (`treasure_*`, `boss_*`, `cache_ancient`), lưu `openedChests` | Map mới dùng lại bảng vùng; nên thêm 1 bảng "nhánh" có món độc quyền |
| Lore | `lore[]` (`textVi`), lưu `loreFound`, tính vào % khám phá | **Chưa có màn đọc lại** (Sổ Lore); 9 mảnh, mỗi map một |
| % khám phá | `logic/progress.ts`: theo vùng (thẻ Trại) và theo map (tiêu đề bản đồ) | Phải cộng thêm map nhánh |
| Dịch chuyển nhanh | `portal` + `activePortals` | Map nhánh có cổng khu riêng: tiện, nhưng làm giảm lý do đi đường tắt. Cần quyết định (Q6) |
| Kiểm tra dữ liệu | schema: ô hợp lệ, lối trỏ map có thật; `config/content.ts`: bảng loot, trùm ở map cuối; test `adventureMaps.test.ts`: đứng được ở spawn, rương sau cổng tới được | Thiếu: lối ra **hai chiều khớp nhau**, ô đến đứng được, mọi map đi tới được, không có ngõ cụt một chiều |
| Admin | `tools/admin/adventureMaps.ts` | Sửa map mới bằng Admin được |

### 4.1 Code đang giả định "vùng = 3 map thẳng hàng"

| Chỗ | Giả định | Ảnh hưởng nếu nhét map nhánh vào `zone.maps` |
|---|---|---|
| `actions/start.ts`, `trip.ts portalLit`, `progress.ts` | `zone.maps[0]` là cửa vào vùng | ổn nếu map nhánh không đứng đầu |
| `config/content.ts` (kiểm tra), `actions/rift.ts` | `zone.maps.at(-1)` là map trùm | map nhánh không được đứng cuối |
| `actions/sweep.ts` (đi nhanh) | cộng mọi nhóm thường của `zone.maps` | đi nhanh **tăng thưởng**, lệch cân bằng |
| `battleSim.ts` (`sim:week`, cân bằng) | đánh lần lượt `zone.maps` như một tuyến | bot đi cả nhánh, lệch số ngày hạ trùm |
| `tests/unit/adventureMaps.test.ts` | "ba map mỗi vùng" | test đỏ |

→ Đề xuất: **giữ `zone.maps` là tuyến chính** và thêm `zone.branches: string[]` cho map nhánh. Sweep và sim không đổi; % khám phá và cổng khu đọc cả hai danh sách.

### 4.2 Vẽ và vùng mới

- `scene/mapView.ts` lấy màu và tile theo tên vùng (`forest | mountain | ruins`). Vùng chưa biết thì lùi về màu Rừng, nên vùng Biển cần thêm màu placeholder và sau này một bộ tile `adv_tile_coast_*`.
- Mỗi lối ra hiện chỉ có một hình "cổng dịch chuyển". Để có nhiều kiểu ngưỡng (§13.2) cần thêm trường `kind` cho lối ra và hình tương ứng.

---

## 5. Roster quái và Combat Animal

**Quái** (`content/adventure/enemies.json`, 22 loài; không có trường vai trò hay cấp riêng, sức mạnh theo vùng):

| Vùng | Quái thường | Kẻ canh | Trùm |
|---|---|---|---|
| Rừng | Rêu Con (NATURE), Mầm Gai (NATURE), Chim Sẻ Sấm (LIGHTNING), Cáo Lửa (FIRE), Ếch Sương (WATER), Sói Đêm (DARK), Heo Rừng Gai (EARTH) | Heo Rừng Gai (M1), Sói Đầu Đàn + Sói Đêm (M2) | Cổ Thụ Giận Dữ (NATURE) |
| Núi | Bọ Giáp Thép (METAL), Ưng Vách Đá (LIGHTNING), Kỳ Nhông Dung Nham (FIRE), Dê Tuyết (WATER), Người Đá Quặng (EARTH), Cừu Sừng Sấm (LIGHTNING) | Người Đá Quặng (M4), Cừu Sừng Sấm (M5) | Rồng Dung Nham (FIRE) |
| Tàn Tích | Lính Gác Đá (EARTH), Hồn Rune (LIGHT), Hồn Ma Thủy Triều (DARK), Tượng Lửa (FIRE), Thầy Tế Bóng Tối (DARK) | Lính Gác Đá ×2 (M7), Thầy Tế (M8) | Hộ Pháp Cổ Đại (METAL) |

Mỗi vùng dùng chung một nhóm quái cho cả 3 map. Chưa có quái biển nào. Batch art `adventure-13-combat-poses` đề xuất 12 quái mới N01–N12 (4 con mỗi vùng Rừng / Núi / Tàn Tích), chưa có chỉ số và chưa có chỗ xuất hiện.

**Combat Animal:** 22 loài (20 heo, 2 cá), 9 dòng Guardian (decision 041). Không ảnh hưởng tới map.

Gợi ý phân bổ (chỉ là đề xuất):
- N1–N3 dùng quái Rừng + 4 quái mới vùng Rừng.
- N4–N5 dùng quái Núi + 4 quái mới vùng Núi.
- N6 dùng quái Tàn Tích + 4 quái mới vùng Tàn Tích.
- N7–N9 cần **6–8 loài biển mới** (cua, bạch tuộc, sứa, cá, tôm) và 1 trùm. Đây là việc art lớn nhất của đợt này.

---

## 6. Lore — chỗ spec map khác với game hiện tại

- Spec map nói lore "chưa xác nhận Guardian cụ thể". Nhưng 9 bia lore trong game **đã gọi tên** Mộc Mẫu, Hỏa Giải, Dạ Mặc, Thiết Giáp (tên các dòng Guardian của Combat Animal, decision 041). Lore mới nên tiếp nối các tên này cho nhất quán, thay vì tránh hẳn.
- Trùm Tàn Tích là **Hộ Pháp Cổ Đại** (`enemy_ancient_guardian`), và `lore_r3_seal` mô tả "pho tượng Thiết Giáp canh phong ấn… vết nứt đen đang lan". Hiểu theo kiểu "một Guardian bị Umbraflux ăn mòn" thì đụng luật §15.7 của spec map ("Không biến First Guardian thành phản diện"). Cần chủ dự án chốt cách hiểu (Q7).

---

## 7. Batch vẽ lại map (adventure-11-map) bị ảnh hưởng

`art_inbox/.batch/adventure-11-map/after/` đã có đủ **9 tranh vẽ lại** (2026-10-27), vẽ theo layout hiện tại, nhưng **chưa nối vào game**. Mọi thay đổi bố cục của 9 map cũ, như mở tường bao, thêm lối nhánh hay bỏ trùng layout, sẽ làm tranh lệch lưới.

Ba hướng:
1. **Đổi layout trước, vẽ lại sau.** Sửa luôn gốc của sự nhàm chán (3 layout lặp ×3), nhưng 9 tranh phải làm lại.
2. **Giữ layout, nối tranh hiện có ngay.** Lối nhánh mới đặt **bên trong map** (cửa hang, bậc đá, đầu cầu trên ô trống; §13.2 cho phép), sửa tranh bằng cách vẽ thêm một vùng nhỏ. Rẻ nhất, nhưng M4–M9 vẫn là bản sao bố cục của M1–M3.
3. **Lai.** Giữ layout M1–M3 (tranh dùng được). Đổi layout M4–M9 (6 map trùng) và vẽ lại 6 tranh đó. Lối nhánh trên M1–M3 đặt bên trong map.

**Đề xuất hướng 3.** Nó sửa được lỗi "trùng bố cục" mà mục 8 của spec map cấm, lại tận dụng được 3 tranh. Có điều kiện: thay đổi layout M4–M9 chỉ thay `terrain`, `props` và tọa độ vật, còn **id map, id rương / cổng / lore / nhóm quái không đổi**, nên save không bị ảnh hưởng (save chỉ lưu id).

**Rủi ro save khi đổi layout:** một chuyến đang dở lưu `run.x / run.y` theo pixel. Nếu layout mới đặt tường đúng chỗ đó thì người chơi kẹt. Cách xử lý: migration v5 đưa `run` đang ở map bị đổi layout về `spawn` của map đó.

---

## 8. Câu hỏi chủ dự án cần quyết định

1. **Q1 — Tuyến chính:** giữ M5 → M6 → M7 như code (đề xuất), thay cho M5 → M7 của spec map?
2. **Q2 — Vùng của map mới:** N1 / N2 / N3 → Rừng, N4 / N5 → Núi, N6 → Tàn Tích (đề xuất)?
3. **Q3 — Vùng Biển (N7–N9):** là vùng thứ tư `zone_coast`. Mở sau trùm nào, cấp đội bao nhiêu? Đề xuất: sau trùm **Núi**, cấp 14–24, vào qua N3 (Rừng) nhưng khóa tới khi đủ điều kiện. Như vậy vùng Rừng có lý do quay lại giữa game.
4. **Q4 — Đường tắt một phía** (`lock: 'shortcut'` + save `openedExits`, migration v5): đồng ý?
5. **Q5 — Batch vẽ lại 9 map:** chọn hướng 1, 2 hay 3 (mục 7)?
6. **Q6 — Map nhánh có cổng khu dịch chuyển riêng không?** Đề xuất: **có**, nhưng chỉ thắp sau khi lấy hết các điểm chính của map đó, hoặc không có, để đường tắt có giá trị.
7. **Q7 — Lore:** Hộ Pháp Cổ Đại có phải Thiết Giáp bị tha hóa không? Lore mới có được dùng tên 9 dòng Guardian không?
8. **Q8 — Quái mới:** dùng N01–N12 của batch 13 cho map nhánh, và mở thêm batch quái biển?
9. **Q9 — Phần thưởng độc quyền ở map nhánh:** ví dụ mỗi vùng một trang bị chỉ có ở nhánh, mảnh lore đủ bộ đổi danh hiệu. Có muốn không?

---

## 9. Kế hoạch triển khai (sau khi duyệt)

Mỗi đợt là một commit nhỏ, `npm run check` xanh, thử trong sandbox. Đợt sau không phụ thuộc art của đợt trước, vì art luôn có placeholder.

**Đợt 0 — Nền tảng (không thêm map, không đổi cảm giác chơi)**
- Schema: `exits[].lock` thêm `'shortcut'`; `exits[]` thêm `facing?` và `kind?` (trail / cave / bridge / gate / shore / tunnel); `zones[].branches?`.
- Logic: `exitOpen` (shortcut); `takeExit` (ghi `openedExits` khi đi qua từ phía mở, dùng `facing`); `progress.ts` và `portalLit` đọc `branches`.
- Save: slice v4 → v5 (`openedExits: []`). Migration test với save thật (`tests/fixtures/adventure-slice-v2-real.json`).
- Kiểm tra mới trong `config/content.ts` và test: lối ra có cặp ngược lại, ô đến đứng được và không trùng vật, mọi map tới được từ cửa vùng, lối một chiều phải khai báo rõ.
- Màn bản đồ: lối bị khóa hiện lý do ("Hạ kẻ canh khu trước", "Mở từ phía bên kia").
- File: `content/schemas/adventure/{maps,zones}.ts`, `logic/actions/{trip,explore}.ts`, `logic/{state,migrations,progress}.ts`, `logic/config/content.ts`, `ui/exploreVm.ts`, `scene/mapView.ts`, `content/i18n/en.json`, `src/i18n/vi*`, tests.

**Đợt 1 — Bỏ trùng layout M4–M9** (nếu chọn hướng 1 hoặc 3)
- Layout mới cho 6 map theo bảng "layout signature" ở mục 7 của spec map. Mép mở (chỉ chặn bằng vách / rừng có khe), lối ra không còn cố định ở hàng 12–14, id giữ nguyên.
- Migration đưa chuyến đang dở về spawn.
- Chụp lại `before/` bằng `scripts/capture/adventureMaps.ts`, viết lại prompt cho 6 tranh.

**Đợt 2 — N1 + N2 (Rừng)**
- Thử toàn bộ cơ chế nhánh ở vùng đầu game: nhánh mở từ M1; đường tắt N2 → M3 mở từ phía M3; rương nhìn thấy nhưng chưa lấy được; cổng hệ.
- Lối vào N1 trên M1 và N2 trên M3 đặt bên trong map.

**Đợt 3 — N4 + N5 (Núi)**
- Đường ngầm N5 nối 3 vùng; đường tắt N4 ↔ M6, N5 ↔ M5.

**Đợt 4 — N6 (Tàn Tích) + Sổ Lore**
- Màn đọc lại lore theo vùng / dòng Guardian, đủ bộ có thưởng (nếu Q9 đồng ý).

**Đợt 5 — Vùng Biển N3 → N7 / N8 / N9**
- `zone_coast`, bảng loot, trùm, quái biển (chờ batch art quái, dùng placeholder trước).

**Sau mỗi đợt**
- Cập nhật `docs/GAME_BALANCE.md` (cấp quái từng map nhánh) và chạy `npm run sim:week` (sim không đổi vì nhánh nằm ngoài `zone.maps`).
- e2e `tests/e2e/adventure.spec.ts`: đi nhánh trước khi hạ trùm, thử qua lối khóa, mở đường tắt rồi lưu / tải, đi lối chính hai chiều.

**Art** (GĐ14, làm sau gameplay từng đợt): tranh nền cho map mới, bộ tile Biển, hình các kiểu ngưỡng lối ra, quái biển. Ghi vào `docs/ASSET_TODO.md` theo từng đợt.
