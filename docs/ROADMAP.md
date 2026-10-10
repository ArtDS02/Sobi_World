# SOBI WORLD — ROADMAP

Mỗi giai đoạn kết thúc khi **game chạy được, save cũ tải được, test qua, Admin cập nhật**. Không bắt đầu giai đoạn sau khi giai đoạn trước chưa đạt.

**Chiến lược (decision 017, 2026-10-11): gameplay trước, art sau.** Các giai đoạn gameplay (GĐ1–GĐ12) và giai đoạn tích hợp (GĐ13) dùng placeholder cho art, animation, VFX, âm thanh; UI vẫn phải đủ để chơi và kiểm thử. Toàn bộ art/animation/VFX/âm thanh làm một lần ở **GĐ14**, sau khi gameplay đã nghiệm thu. Không quay lại giai đoạn đã nghiệm thu chỉ để thêm art hay polish (việc đó vào `docs/ASSET_TODO.md` và GĐ14); chỉ sửa lại khi có lỗi gameplay, kiến trúc hoặc tích hợp thật, và phải ghi vào `PROGRESS.md`.

## Tổng quan

| # | Giai đoạn | Mốc |
|---|---|---|
| 1 | Nền móng thế giới, Farm thành Area | |
| 2 | Thời gian thật và thế giới sống | |
| 3 | Nhân vật và Sảnh Sobi | |
| 4 | Bản cài desktop đầu tiên | Game cài được trên máy sạch |
| 5 | Sobi Garden và sản xuất | |
| 6 | Gắn kết: đơn hàng, Bond, mục tiêu, thành tựu, Codex | **Vertical slice: Farm + Garden chơi vui hoàn chỉnh** |
| 7 | Lai giống và di truyền nâng cao | |
| 8 | Sobi Aquarium | |
| 9 | Sobi Cloud | |
| 10 | Adventure nền tảng (đánh theo lượt) | |
| 11 | Adventure liên hệ thống, công nghệ trang trại | **Vòng lặp thế giới đầy đủ** |
| 12 | Thế giới động: thời tiết, sự kiện, chợ | |
| 13 | Tích hợp, kiểm thử toàn bộ gameplay, nghiệm thu | **Gameplay freeze** (hết đổi cơ chế) |
| 14 | Hoàn thiện art, animation, VFX, âm thanh | Hết `placeholder` trong manifest |
| 15 | Phát hành | **Bản phát hành 1.0** |

**Lý do thứ tự:**
- Thời gian thật (GĐ2) ảnh hưởng mọi hệ thống, phải có trước khi thêm Area.
- Đóng gói desktop làm sớm (GĐ4) để phát hiện lỗi cài đặt khi dự án còn nhỏ. Sau đó mỗi giai đoạn đều phải build được.
- Gameplay trước, art sau (decision 017): art làm khi cơ chế đã đứng yên thì không phải vẽ lại; asset đi qua id → manifest nên thay placeholder không đụng logic.
- Sau GĐ6, **dừng lại chơi thử vài ngày thật**. Nếu vòng lặp Farm + Garden chưa vui, chỉnh trước khi làm tiếp. Thêm Area không cứu được vòng lặp lõi kém.

---

## GĐ1 — Nền móng thế giới
**Mục tiêu:** Tách hệ thống nền ra khỏi Sobi Farm. Farm thành Area đầu tiên.
**Kết quả:** Cấu trúc thư mục theo `ARCHITECTURE.md`; core (save mới, events, content, inventory, economy, items, progression khung, area-registry, assets); systems (creature, health khung, quality, valuation, behavior-ai, layout); Farm đăng ký qua manifest; `_template`; Admin nối vào content mới.
**Xong khi:** Farm chạy đủ tính năng như cũ; save cũ được migrate; nội dung nằm trong `content/` có schema; test phụ thuộc import qua; test Area giả lập qua.

## GĐ2 — Thời gian thật và thế giới sống
**Kết quả:** `core/clock`, `core/simulation` 3 chế độ; bù offline; bệnh → nguy kịch → chết; xuất chuồng thay harvest; máng tự động; phân và dọn phân; màn hình "Trong lúc bạn vắng nhà"; bảo vệ người chơi mới; Admin tua thời gian.
**Xong khi:** Test nhất quán bước 1 phút / 10 phút qua; bù 30 ngày dưới 3 giây; tắt game 1 ngày (tua bằng Admin) cho kết quả đúng.

## GĐ3 — Nhân vật và Sảnh Sobi
**Kết quả:** Nhân vật đi 4 hướng + chéo, tương tác bằng phím; cài đặt phím; Sảnh Sobi với 5 cổng (Area chưa làm hiển thị khóa); chuyển cảnh Sảnh ↔ Farm; Farm tương tác qua nhân vật.
**Xong khi:** Chơi trọn Farm bằng nhân vật; đổi phím được và lưu lại; Area khóa hiện điều kiện mở.

## GĐ4 — Bản cài desktop đầu tiên
**Kết quả:** Installer/file chạy, icon, shortcut; save ở thư mục dữ liệu người dùng; build không chứa Admin; hướng dẫn build trong `docs/BUILD.md`.
**Xong khi:** Cài và chơi được trên máy sạch không có công cụ lập trình, không internet.
**Ghi chú:** phần lớn đã có từ Sobi Farm (Electron + NSIS, save atomic, admin không vào build). Còn lại: tên "Sobi World", thư mục save mới + chuyển save Sobi Farm, test kiểm build không chứa admin, `docs/BUILD.md`, thử trên máy sạch.

## GĐ5 — Sobi Garden và sản xuất
**Kết quả:** Area Garden; `systems/plants`; ô đất, tưới, phân bón, héo; vòi tưới tự động; `core/production` với Máy xay và Thùng ủ; vòng lặp phân → phân bón → cây → thức ăn → heo; mở khóa Garden; Admin cho cây và recipe.
**Xong khi:** Vòng lặp chạy cả online và offline; Garden mở đúng điều kiện.

## GĐ6 — Gắn kết (mốc Vertical slice)
**Kết quả:** Bảng đơn hàng ở Sảnh; mục tiêu hằng ngày; Bond + món yêu thích + đặt tên; mục đích nuôi (gồm Thú cưng); thành tựu và Gems; Codex bản đầu; level Area và World Development; chợ giá theo ngày; trang trí cơ bản; NPC hướng dẫn Farm và Garden; hướng dẫn chơi 10 phút đầu.
**Xong khi:** Người mới chơi từ đầu hiểu cách chơi không cần đọc tài liệu; có mục tiêu ngắn hạn liên tục. **Chủ dự án chơi thử ít nhất 3 ngày thật.**

## GĐ7 — Lai giống nâng cao
**Kết quả:** Gen, trait, trait ẩn, đột biến, pity, phả hệ; tin đồn từ NPC Nhà lai giống; Admin chỉnh bảng lai.

## GĐ8 — Sobi Aquarium
**Kết quả:** Area Aquarium; cá dùng model sinh vật chung; bể, nước sạch, câu cá, cá đêm; vật liệu từ cá; đơn hàng có cá; Codex cá.

## GĐ9 — Sobi Cloud
**Kết quả:** Area Cloud; hoa phép, nước tinh khiết, potion; Healing Potion chữa bệnh heo/cá; hoa tăng đột biến khi lai.

## GĐ10 — Adventure nền tảng
**Kết quả:** Area Adventure qua Cổng dịch chuyển; `systems/combat` theo lượt; skill, nguyên tố, level, EXP; trang bị; vùng Rừng; kiệt sức khi thua; heo phiêu lưu khởi đầu.

## GĐ11 — Adventure liên hệ thống (mốc Vòng lặp đầy đủ)
**Kết quả:** Loot quay về các Area: vật liệu cổ nâng công trình Lv3–Lv4, hạt/cá/heo hiếm; công nghệ trang trại; potion và thức ăn hỗ trợ trận đánh; thêm 2 vùng phiêu lưu.

## GĐ12 — Thế giới động
**Kết quả:** Thời tiết theo ngày; sự kiện mùa với Event Tokens; NPC Thương nhân; cân bằng lại kinh tế tổng thể.

## GĐ13 — Tích hợp, kiểm thử gameplay, nghiệm thu (gameplay freeze)
**Phụ thuộc:** GĐ1–GĐ12 đã nghiệm thu.
**Kết quả:** UI chức năng hoàn chỉnh cho mọi luồng (placeholder art vẫn được); trợ năng chức năng (cỡ chữ, chế độ màu dễ nhìn, tắt rung màn hình); ngôn ngữ Việt/Anh từ bảng chuỗi; đo và tối ưu hiệu năng (FPS, bù offline); rà "không tài nguyên chết" toàn bộ item; chơi thử đủ các luồng chính trên bản cài; kiểm save/migration từ mọi phiên bản save trước; sửa lỗi gameplay/kiến trúc; chốt cân bằng; danh sách nghiệm thu từng Area.
**Xong khi:** mọi tiêu chí nghiệm thu gameplay của GĐ1–GĐ12 chạy đúng trên bản cài; `npm run check` và e2e xanh; chủ dự án chơi thử ≥ 7 ngày thật và duyệt; **sau đó không đổi cơ chế nữa** (chỉ sửa lỗi). Art placeholder không chặn nghiệm thu.

## GĐ14 — Hoàn thiện art, animation, VFX, âm thanh
**Phụ thuộc:** GĐ13 đã nghiệm thu (gameplay freeze).
**Kết quả:** thay toàn bộ `placeholder` bằng art cuối theo `docs/ASSET_TODO.md` (art từng Area, vật phẩm, NPC, UI); animation nhân vật/sinh vật/cảnh; VFX (lên cấp, mở khóa, khám phá Codex, thời tiết, sự kiện); nhạc nền mỗi Area + Sảnh và âm thanh tương tác; polish UI. Làm theo từng Area, qua skill `image-to-asset` và `npm run assets:check`.
**Xong khi:** `npm run assets:release` qua (hết `placeholder`); không đổi logic, content hay save (nếu buộc đổi thì ghi decision); test và e2e vẫn xanh; kích thước và hiệu năng không tụt; chủ dự án duyệt hình và âm thanh.

## GĐ15 — Phát hành
**Phụ thuộc:** GĐ14 xong.
**Kết quả:** rà lần cuối (lỗi, chữ, giao diện); kiểm save/migration từ mọi phiên bản; installer cuối cùng, phiên bản 1.0.0, ghi chú phát hành ngắn.
**Xong khi:** cài và chơi từ đầu trên máy sạch, đổi ngôn ngữ, chỉnh âm lượng; save từ các bản thử cũ mở được; tag `sobi-world-v1.0.0` (tag `v1.0.0` đã thuộc Sobi Farm).

## Phụ thuộc và nghiệm thu các giai đoạn còn lại

| Giai đoạn | Cần có trước | Nghiệm thu (tóm tắt) |
|---|---|---|
| GĐ10 Adventure nền tảng | GĐ1–GĐ9 (creature, health, bond, items, potion) | Trận theo lượt đúng luật; ≥ 12 skill; thua chỉ Kiệt sức 4 giờ; mô phỏng 100 trận ra tỉ lệ thắng hợp lý |
| GĐ11 Adventure liên hệ thống | GĐ10 | Loot nâng công trình và công nghệ; mọi item ≥ 2 công dụng; cân bằng 14 ngày; chủ dự án duyệt |
| GĐ12 Thế giới động | GĐ11 | Thời tiết theo seed (nhất quán mọi chế độ mô phỏng), 4 sự kiện, Thương nhân, Admin bật thử; kinh tế tổng thể cân bằng |
| GĐ13 Tích hợp | GĐ12 | Như mục GĐ13 |
| GĐ14 Art | GĐ13 | Như mục GĐ14 |
| GĐ15 Phát hành | GĐ14 | Như mục GĐ15 |
