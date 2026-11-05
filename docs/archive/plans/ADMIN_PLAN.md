# Kế hoạch: trang Admin hoàn chỉnh cho Sobi World

**Ngày:** 2026-10-17 · **Trạng thái:** bản kế hoạch, chờ chủ dự án duyệt trước khi làm · Thay cho bố cục của decision 036
(giữ phần lõi đã đúng của 036: API lưu content có kiểm tra, sửa save qua `worldEdits.ts`, không hot-reload).

---

## 1. Mục tiêu

1. **Mỗi game một tab**: Farm, Garden, Aquarium, Cloud, Adventure, cộng một tab **Thế giới chung** (vật phẩm, kinh tế, tiến trình,
   sự kiện, Sảnh). Vào tab nào là thấy ngay **danh sách mọi thứ chỉnh được** của game đó.
2. **Luôn thấy tên và ảnh, không thấy mã**: mọi loài / vật phẩm / ô đất / con vật hiện bằng ảnh + tên tiếng Việt; mã (id) chỉ là chữ nhỏ
   phụ. Mọi chỗ chọn một thứ khác (hạt giống, rơi đồ, cha mẹ khi lai…) là **ô chọn có ảnh + tên + tìm kiếm**, không phải ô chọn mã.
3. **Phân loại rõ ràng**: danh mục loài có lọc theo độ hiếm, nhóm / loại, trạng thái (chỉ lai ra, ban đêm, đang tắt…), sắp xếp, tìm theo
   tên không dấu.
4. **Trang người chơi dễ dùng**: không ô nào đè nhau; mỗi game một tab với **giao diện giống trong game** (chuồng heo, bản đồ ô đất,
   bể cá, tầng mây, đội phiêu lưu) và các **thao tác nhanh** (tưới hết, cho chín ngay, tặng cá…). JSON thô chỉ còn ở "Nâng cao".
5. Giữ an toàn hiện có: mọi lần lưu kiểm bằng luật của game, không xoá id đã phát hành, save cũ vào backups.

## 2. Hiện trạng — những gì đang tệ (đã kiểm trên admin đang chạy)

| # | Chỗ | Vấn đề | Nguyên nhân |
|---|---|---|---|
| 1 | Menu | Chỉ có nhóm "Sobi Farm" (heo); Garden / Aquarium / Cloud / Adventure không có mục riêng, phải vào "Nội dung game" rồi tự tìm file | Menu vẫn theo bố cục Sobi Farm cũ |
| 2 | Nội dung game | Form dựng thẳng từ schema: trường xếp theo thứ tự file, nhãn còn tiếng Anh ("Seed item"), không chia nhóm Kinh tế / Thời gian / Lai giống | Form chung, không có "cách trình bày" riêng cho từng loại |
| 3 | Nội dung game | Công thức lai, rơi đồ, đơn hàng hiện mã (`hy_tomato`, `PIG_KNIGHT`, `crop_wheat`); ô chọn là danh sách chữ dài | Không có bộ chọn có ảnh |
| 4 | Người chơi › Aquarium | Danh sách cá hiện UUID (`7e9f61bf-…`), không tên, không ảnh | Tên cá nằm ở trường `name`, form chỉ đọc `nameVi`; ảnh nạp sau lần vẽ đầu |
| 5 | Người chơi › Adventure | Chiến binh là khóa `sobi_farm:<uuid>` | Không tra ra tên heo |
| 6 | Người chơi › Garden / Cloud | 72 / 90 ô đất là danh sách dòng `#1…#90` với `cropId` | Không có bản đồ ô theo khu / tầng |
| 7 | Người chơi › Tiến trình | Lưới "Bộ đếm thành tích" tràn ra ngoài khung bên phải | Ô số có độ rộng tối thiểu lớn hơn cột |
| 8 | Người chơi | Thanh "Lưu" dính trên cùng đè lên nội dung khi cuộn; icon 🪙 hiện ô trống | `position: sticky` không chừa chỗ; emoji thiếu font |
| 9 | Người chơi | Tab Heo dạng bảng chữ, không lọc theo giống / tình trạng | Chưa có danh mục thẻ ảnh |

## 3. Bố cục mới (sitemap)

Đường dẫn: `#/<khu>/<mục>[/<id>]`, ví dụ `#/aquarium/fish/fish_octopus`, `#/players/<save>/garden`.

```
🏠 Tổng quan
👤 Người chơi            danh sách save → một save (tab theo game, mục 6)
🐷 Sobi Farm             (mục 4.1)
🌱 Sobi Garden           (mục 4.2)
🐟 Sobi Aquarium         (mục 4.3)
☁️ Sobi Cloud            (mục 4.4)
⚔️ Sobi Adventure        (mục 4.5)
🌍 Thế giới chung        (mục 4.6)
🖼️ Asset                 ảnh nguồn, thư viện, ảnh còn thiếu
⚙️ Hệ thống              bản desktop, hướng dẫn, lịch sử thay đổi (git diff các file đã ghi)
```

**Trang chủ của mỗi game** = "bảng điều khiển" của game đó:
- Dải số: số loài, số công thức, cấp mở khu, ảnh còn thiếu, lỗi dữ liệu.
- **Lưới thẻ "Chỉnh được gì"**: mỗi thẻ = một mục (icon, tên, mô tả một dòng, số mục, file nguồn nhỏ bên dưới, chấm vàng nếu còn nháp).
- Lối tắt: "Thử nhanh trên save" (mở tab game này của save gần nhất), "Mô phỏng" (nếu game có).

## 4. Mỗi game chỉnh được gì

Ký hiệu cách sửa: **[DM]** danh mục loài (thẻ ảnh + lọc + trang chi tiết), **[BG]** bảng sửa tại chỗ, **[NH]** nhóm thông số có nhãn,
**[TR]** trang riêng đã có (giữ, chỉ đổi giao diện), **[MP]** mô phỏng.

### 4.1 🐷 Sobi Farm
| Mục | Nguồn | Cách sửa | Gồm |
|---|---|---|---|
| Giống heo | `farm/species.json` + manifest | [DM][TR] | ảnh trái/phải/ngủ, tên, độ hiếm, nhóm, giá mua, cấp mở, lớn, mang thai, cân nặng, tính trạng riêng, món thích, bật / tắt |
| Phối giống | `farm/breeding.json` | [TR] | luật cặp, di truyền, công thức đột biến (cha mẹ = ô chọn ảnh heo), sơ đồ phả hệ, mô phỏng lai |
| Tính trạng & lai nâng cao | `breeding/traits.json`, `breeding/balance.json`, `breeding/rumors.json` | [DM][NH] | tính trạng (hiệu ứng, trọng số), đột biến, vận may, câu tin đồn |
| Nhu cầu & sức khỏe heo | `farm/balance.json` (care, balance) | [NH] | đói / sạch / năng lượng mỗi giờ, phân, giai đoạn lớn, máng tự ăn, bệnh |
| Chuồng, máng, phí | `farm/balance.json` | [BG] | giá mở chuồng, các cấp máng, phí phối giống, giới hạn |
| Đơn heo | `farm/balance.json` (orderDemand) | [NH] | nhịp đơn, thưởng |
| Hành vi heo | `farm/behavior.json` | [NH] | ngủ, đi dạo, giao lưu, tốc độ |
| Hộp quà | `farm/gifts.json` | [NH] | nhịp, giá trị theo độ hiếm |
| Trang trí | `farm/decor.json` + tên `vi.decor` | [DM] | ảnh, tên Việt / Anh, giá, cấp mở, vui vẻ, chỗ đặt |
| Tên heo ngẫu nhiên | `farm/names.json` | [BG] | danh sách tên |
| Cửa hàng Farm | `shared/shop.json` | [TR] | gói hàng, giá, thứ tự |
| Bố cục cảnh | `farm/layout.json` | [TR] | kéo thả vật trên cảnh |
| Mùa & hiệu ứng | `farm/season-fx.json` | [TR] | hiệu ứng theo mùa |
| Điều kiện mở khu | `farm/area.json` | [NH] | cấp, phát triển, công trình |

### 4.2 🌱 Sobi Garden
| Mục | Nguồn | Cách sửa | Gồm |
|---|---|---|---|
| Cây trồng | `garden/crops.json` | [DM] | ảnh 4 giai đoạn, tên, hạt giống ↔ nông sản (ô chọn ảnh), giờ lớn, sản lượng, "chỉ lai ra" |
| Lai giống cây | `garden/hybrids.json` | [BG] | mỗi dòng: ảnh cây A + ảnh cây B → ảnh kết quả, tỉ lệ %; phí lab, hạt nhận, vận may |
| Công trình chế biến | `shared/recipes.json` (building = mill, composter) | [DM] | Máy xay / Thùng ủ: nguyên liệu → thành phẩm (ảnh), thời gian |
| Ô đất, khu, vòi tưới | `garden/balance.json` | [BG][NH] | ô ban đầu, ô mỗi khu, giá & cấp mở khu, các cấp vòi tưới, tưới, héo, phân bón |
| Cửa hàng Garden | `garden/balance.json` (shop) | [BG] | món bán (ô chọn ảnh vật phẩm), giá |
| Hạt & nông sản | `shared/items.json` (SEED, CROP) | [DM] | giá mua / bán, tên — lọc sẵn theo loại |
| KN & điều kiện mở khu | `garden/balance.json` (xp), `garden/area.json` | [NH] | |

### 4.3 🐟 Sobi Aquarium
| Mục | Nguồn | Cách sửa | Gồm |
|---|---|---|---|
| Loài cá | `aquarium/fish.json` | [DM] | ảnh, tên, mô tả, độ hiếm, vật phẩm cá, giờ lớn, giá trong bể, độ hay cắn câu, chỉ ban đêm, vảy, đẻ được |
| Lai giống cá | `aquarium/hybrids.json` | [BG] | cặp cá (ảnh) → loài trứng nở, tỉ lệ |
| Bể & nước | `aquarium/balance.json` (tank, start) | [BG][NH] | các cấp bể (giá, sức chứa, nước), nước đục, vảy |
| Đời sống cá | `aquarium/balance.json` (life, breeding, sell) | [NH] | đói, lớn, bệnh, đẻ trứng, giá bán |
| Câu cá | `aquarium/balance.json` (fishing) | [NH] | thời gian nghỉ, ngưỡng tuột, may mắn theo độ xa, trai ngọc |
| Cửa hàng Aquarium | `aquarium/balance.json` (shop) | [BG] | món bán, giá |
| Tên cá ngẫu nhiên | `aquarium/names.json` | [BG] | |
| KN & điều kiện mở khu | `aquarium/balance.json` (xp), `aquarium/area.json` | [NH] | |

### 4.4 ☁️ Sobi Cloud
| Mục | Nguồn | Cách sửa | Gồm |
|---|---|---|---|
| Hoa | `cloud/flowers.json` | [DM] | ảnh, tên, loại, hạt ↔ hoa, giờ lớn, sản lượng, hoa đêm |
| Lai giống hoa | `cloud/hybrids.json` | [BG] | như Garden |
| Potion & Vạc nấu | `shared/recipes.json` (building = cauldron) + `shared/items.json` (POTION) | [DM] | công thức, tác dụng (tâm trạng, giờ, đột biến), giá xây vạc, số mẻ |
| Tầng mây & ô hoa | `cloud/balance.json` | [BG] | ô mỗi tầng, giá & cấp mở tầng, tưới, héo |
| Suối nước tinh khiết | `cloud/balance.json` (spring) | [BG] | các cấp: phút / giọt, sức chứa, giá |
| Cửa hàng Cloud | `cloud/balance.json` (shop) | [BG] | |
| KN & điều kiện mở khu | `cloud/balance.json` (xp), `cloud/area.json` | [NH] | |

### 4.5 ⚔️ Sobi Adventure
| Mục | Nguồn | Cách sửa | Gồm |
|---|---|---|---|
| Kẻ địch | `adventure/enemies.json` | [DM] | ảnh, tên, nguyên tố, chỉ số, kỹ năng (ô chọn), KN, xu, rơi đồ (ô chọn ảnh vật phẩm + tỉ lệ) |
| Kỹ năng | `adventure/skills.json` | [DM] | sức mạnh, năng lượng, hồi chiêu, hiệu ứng |
| Kiểu đánh | `adventure/archetypes.json` | [DM] | chỉ số gốc, bộ 4 kỹ năng |
| Vùng phiêu lưu | `adventure/zones.json` | [DM] | ảnh nền, điểm dừng (sơ đồ theo thứ tự), bảng loot, sự kiện nhỏ, điều kiện |
| Trang bị | `adventure/equipment.json` + `shared/items.json` (EQUIPMENT) | [DM] | chỉ số cộng, giá |
| Công nghệ | `shared/tech.json` | [DM] | giá từng cấp (xu + vật liệu), hiệu quả |
| Luật đánh, cấp, năng lượng | `adventure/balance.json` | [NH] | |
| Mô phỏng trận | — | [MP] | đã có, chuyển vào đây |
| Điều kiện mở khu | `adventure/area.json` | [NH] | |

### 4.6 🌍 Thế giới chung
| Nhóm | Mục (nguồn) |
|---|---|
| Vật phẩm & kinh tế | Vật phẩm — mọi loại, lọc theo loại / độ hiếm / khu dùng (`shared/items.json` + tên `vi.shop`) · Túi đồ (`shared/inventory.json`) · Giá trị & chợ theo ngày (`shared/valuation.json`) · Chất lượng (`shared/quality.json`) |
| Tiến trình | Cấp Sobi World — biểu đồ KN theo cấp (`shared/progression.json`) · Thành tựu [DM] (`shared/achievements.json` + tên) · Codex & mốc (`shared/codex.json`) · Quà đăng nhập 7 ngày [BG] (`shared/daily.json`) · Mục tiêu ngày (`shared/goals.json`) · Bảng đơn Sảnh (`shared/orders.json`) |
| Sinh vật chung | Sức khỏe (`shared/health.json`) · Thân thiết (`shared/bond.json`) · Thời gian (`shared/time.json`) |
| Sự kiện | Thời tiết (`shared/weather.json`) · Lễ hội + cửa hàng lễ hội [DM] (`shared/festivals.json`) · Thương nhân (`shared/merchant.json`) · Lịch 30 ngày tới (xem trước) |
| Sảnh & nhân vật | NPC — lời thoại theo NPC [DM] (`shared/npcs.json`) · Nhân vật So & Bi (`shared/character.json`) · Bố cục Sảnh [TR] · Ngày / Đêm [TR] |

## 5. Thành phần giao diện dùng chung

1. **Sổ đăng ký thực thể** (`tools/admin/entities/`): mỗi loại (heo, cá, cây, hoa, quái, kỹ năng, vùng, vật phẩm, công thức, trang trí,
   thành tựu, NPC, lễ hội…) khai báo một lần: lấy tên (nameVi, name.vi, bảng chuỗi, hoặc `name` của con vật trong save), lấy ảnh
   (art → manifest, icon vật phẩm, ảnh heo), các trường để lọc / nhóm, các **nhóm trường** của trang chi tiết (Thông tin · Kinh tế ·
   Thời gian · Lai giống · Ảnh) và nhãn tiếng Việt từng trường. Sổ này được nạp **trước** lần vẽ đầu.
2. **Danh mục [DM]**: lưới thẻ ảnh (ảnh, tên, huy hiệu độ hiếm, 1–2 số chính như giá / giờ lớn), thanh lọc (độ hiếm, loại / nhóm, trạng
   thái), sắp xếp, tìm không dấu, chuyển dạng lưới ↔ bảng; bấm thẻ mở **trang chi tiết** (ảnh lớn bên trái, nhóm trường bên phải, "Dùng
   ở đâu": công thức / đơn / rơi đồ có nhắc tới nó). Nút "＋ Thêm" = nhân bản một mục có sẵn rồi đổi mã.
3. **Ô chọn có ảnh**: mở hộp chọn dạng lưới thẻ có tìm + lọc; hiện mục đã chọn bằng ảnh + tên. Dùng cho mọi tham chiếu id.
4. **Bảng sửa [BG]**: các cột có nhãn tiếng Việt, ô số có đơn vị (giờ, phút, %, xu), ô tham chiếu dùng ô chọn có ảnh; thêm / xoá / kéo đổi
   thứ tự dòng.
5. **Nhóm thông số [NH]**: thẻ theo chủ đề, mỗi ô có nhãn, đơn vị, gợi ý ("≈ 2 ngày"), giá trị gốc mờ bên cạnh khi đã đổi, nút ↺ từng ô.
6. **Thanh lưu chung** dính đáy màn hình (không đè nội dung): số thay đổi, "Xem thay đổi" (so sánh trước / sau từng trường), Hoàn tác,
   Lưu. Lỗi game sẽ từ chối hiện ngay tại ô + danh sách bấm được để nhảy tới ô.
7. **Icon**: dùng ảnh trong manifest (`ui_icon_coin`, gem, vé…) thay emoji tiền tệ; emoji chỉ còn ở menu.
8. Bố cục chuẩn: lưới 12 cột, ô số rộng tối thiểu 140 px và co trong cột, thẻ không có chiều rộng cố định; kiểm ở 1440 / 1280 / 1024 /
   375 px không tràn ngang, không đè.

## 6. Trang người chơi (một save)

Đầu trang: thẻ hồ sơ (tên save, cấp + thanh KN, 3 loại tiền có icon ảnh, khu đã mở, lần chơi cuối), thanh lưu dính đáy.

| Tab | Giao diện | Thao tác nhanh |
|---|---|---|
| Tổng quan | thẻ từng khu (trạng thái chính: heo ốm, cây chín, cá đói, năng lượng đội) | tặng tiền, mở hết khu, xong hướng dẫn |
| Ví | 3 thẻ tiền + lịch sử lọc theo loại tiền / loại giao dịch | +/−, đặt số |
| Túi đồ | lưới ảnh nhóm theo **loại** (Thức ăn, Hạt giống, Nông sản, Cá, Hoa, Potion, Trang bị, Nguyên liệu), thanh dùng ô túi | tặng bộ khởi đầu, xoá sạch, thêm nhanh theo loại |
| Tiến trình | KN từng khu (thanh), khu đã mở (công tắc), bộ đếm thành tích (lưới không tràn), quà ngày | đặt cấp thế giới |
| Bộ sưu tập | mỗi loại một lưới ảnh, ảnh tối = chưa khám phá, bấm để bật / tắt | khám phá hết / bỏ hết theo loại |
| Thành tựu | thẻ có tiến độ (bộ đếm / đích), đã nhận / chưa | |
| 🐷 Farm | **chuồng**: thẻ heo (ảnh giống, tên, giới, thanh no / sạch / năng lượng / vui, tim, huy hiệu ốm / mang thai), lọc theo giống / độ hiếm / tình trạng; heo con chờ; máng; chuồng; trang trí (lưới ảnh); đơn heo (ảnh giống heo được đặt) | tặng heo (ô chọn ảnh), chữa hết, cho ăn đầy hết, lớn hết |
| 🌱 Garden | **bản đồ ô đất** chia theo khu: mỗi ô = ảnh cây đúng giai đoạn, giọt nước nếu ướt, sao nếu bón; bấm ô để sửa (cây, % lớn, tưới, bón); công trình (Máy xay / Thùng ủ: mẻ đang nấu); vòi tưới cấp | tưới hết, chín ngay, gieo cả khu loại X, dọn ô |
| 🐟 Aquarium | **bể**: thẻ cá (ảnh loài, tên đặt, loài, giới, thanh đói / lớn, ốm); trứng (loài sẽ nở, giờ nở); cấp bể, nước, vảy chờ | thả cá (ô chọn loài), cho ăn hết, thay nước, nở trứng ngay |
| ☁️ Cloud | **tầng mây**: lưới ô hoa theo tầng như Garden; suối (cấp, nước đang có); vạc (mẻ đang nấu) | tưới hết, chín ngay, đầy suối, nấu xong ngay |
| ⚔️ Adventure | **đội**: thẻ chiến binh (ảnh + tên heo tra từ `sobi_farm:<id>`, cấp, KN, 3 ô trang bị bằng ảnh, năng lượng, kiệt sức); vùng đã hạ; chuyến đang đi | hồi năng lượng hết, hết kiệt sức, tặng trang bị |
| Thế giới & thời gian | lịch 14 ngày + công tắc thử; tua thời gian; Bảng đơn Sảnh (ảnh vật phẩm được đặt) | |
| Nâng cao | JSON cả save, tải bản nháp, reset, xoá vào backups | |

Thao tác nhanh mới viết thành hàm trong `worldEdits.ts` / file sửa của từng khu (thuần, có test), không viết thẳng trong giao diện.

## 7. Kỹ thuật

- **Giữ**: `scripts/admin/contentSave.ts` (lưu có kiểm tra), `worldEdits.ts` + `farmEdits.ts`, kiểm save bằng schema thế giới + từng khu,
  `hmr: false`, nháp trong sessionStorage. Form tự dựng từ schema (`schemaForm.ts`) chỉ còn làm **dự phòng** ("Mọi trường") ở cuối trang
  chi tiết và tab Nâng cao.
- **Thêm**:
  - `tools/admin/entities/<loại>.ts` — sổ đăng ký thực thể (mục 5.1); `tools/admin/views/` — danh mục, chi tiết, bảng, nhóm thông số,
    ô chọn có ảnh, thanh lưu.
  - `tools/admin/games/<khu>.ts` — trang chủ + các mục của từng game (mục 4), khai báo bằng dữ liệu (mục → file, đường dẫn trong file,
    cách sửa) để thêm mục mới chỉ cần một dòng.
  - `tools/admin/players/<khu>.ts` — tab game của trang người chơi (mục 6); thao tác nhanh ở `tools/admin/edits/<khu>.ts`.
  - Router `#/<khu>/<mục>/<id>`; đường cũ (`#/pigs`, `#/content/...`) chuyển hướng sang đường mới.
- **Không đổi** game, save, content schema. Nếu một thao tác nhanh cần logic game (ví dụ "chín ngay"), gọi hàm có sẵn của khu; thiếu thì
  ghi vào "Câu hỏi" thay vì tự thêm luật vào `src/`.
- File giữ dưới 300 dòng như guard của `src/`.

## 8. Các bước làm (mỗi bước một commit, `npm run check` xanh, chạy thật admin)

| Bước | Nội dung | Xong khi |
|---|---|---|
| 1 | Sổ đăng ký thực thể + nạp tên / ảnh trước lần vẽ đầu; sửa lỗi #4 #5 #7 #8 | không còn UUID / mã làm tên ở đâu; 4 khổ màn hình không tràn / đè |
| 2 | Thành phần chung: danh mục, chi tiết, ô chọn có ảnh, bảng, nhóm thông số, thanh lưu đáy | dùng được cho cá (thử nghiệm đầu) |
| 3 | Menu + trang chủ từng game + router mới | 5 tab game + Thế giới chung, mỗi tab liệt kê đủ mục ở mục 4 |
| 4 | Các mục Aquarium + Garden | sửa / thêm loài cá, cây, công thức lai, cửa hàng bằng ảnh; lưu → game đọc đúng |
| 5 | Các mục Cloud + Adventure | như trên cho hoa, potion, quái, vùng, trang bị |
| 6 | Farm (gộp giống heo, phối giống, cửa hàng, bố cục, mùa vào tab Farm) + Thế giới chung | mọi file content có chỗ sửa có nhãn tiếng Việt |
| 7 | Trang người chơi: hồ sơ, Ví, Túi đồ theo loại, Tiến trình, Bộ sưu tập, Thành tựu | |
| 8 | Trang người chơi: tab Farm, Garden, Aquarium, Cloud, Adventure + thao tác nhanh (có test) | thao tác trên save thử → mở game thấy đúng |
| 9 | Hướng dẫn trong admin, README, decision mới, PROGRESS | |

**Kiểm tra mỗi bước:** unit test cho mọi thao tác nhanh và sổ đăng ký (mọi id content có tên + ảnh hoặc báo thiếu ảnh); quét tự động
mọi trang không lỗi console; chụp màn hình 1440 / 1024 / 375 px sáng + tối; lưu không đổi gì → không có diff; save thử (thư mục tạm,
không đụng save thật) đọc lại bằng bộ đọc save của game.

## 9. Câu hỏi cho chủ dự án (cần chốt trước bước 4)

1. Thao tác nhanh trên save (chín ngay, nở trứng ngay, hồi năng lượng…) có được phép không, hay admin chỉ sửa số?
2. Có cần sửa **chữ tiếng Anh** của tên loài / NPC / kỹ năng (`content/i18n/en.json`) ngay trong admin không?
3. Có cần trình kéo thả bố cục cho cảnh Garden / Aquarium / Cloud / Adventure không (hiện chỉ Farm và Sảnh có file bố cục)?
4. Thêm loài mới qua admin: chỉ dùng ảnh đã có trong manifest, hay cần tải ảnh lên luôn (như giống heo)?
5. Ẩn hẳn mục kỹ thuật (Hành vi heo, Nhân vật, Thời gian mô phỏng) khỏi menu, chỉ để trong "Nâng cao"?
