# 014 — Lai giống nâng cao: gen, tính trạng, vận may, phả hệ, tin đồn (GĐ7)

**Ngày:** 2026-10-10 · **Trạng thái:** Đã làm, số liệu chờ chủ dự án chơi thử

## Bối cảnh
Farm đã có sẵn lai giống theo **loài** (bảng cặp, công thức đặc biệt, random genetics theo bậc hiếm, gene pool, Codex ẩn "???"). GĐ7 (spec V2 §7, §9,
GAME_BALANCE §4) thêm tầng **cá thể**: tính trạng, tính trạng ẩn, đột biến, vận may, phả hệ, tin đồn. Không đụng công thức chọn loài.

## Lựa chọn
- **Từ vựng.** "Gen" = thẻ gen của *loài* (`species.traits`, gene pool, đã có từ PS-2, quyết định loài nào ra). "Tính trạng" (trait) = thứ của *từng con heo*
  (`content/breeding/traits.json`, tối đa 3, truyền cho con). Hai thứ không lẫn nhau.
- **Vị trí code.** `src/systems/breeding` (thuần, rules truyền vào, dùng được cho cá sau này): `inherit` (di truyền + đột biến), `pity`, `lineage`, `rumors`,
  `traits`. Phần gắn với loài heo ở `areas/farm/logic/heredity.ts`, `breedingSim.ts`. Bảng cặp và công thức đặc biệt **giữ ở `content/farm/breeding.json`**
  (đã có Admin riêng); `content/breeding/` giữ phần không gắn loài: tính trạng, cân bằng, tin đồn.
- **Di truyền** (`balance.json`): mỗi tính trạng của mỗi bố/mẹ truyền 50% (cả hai cùng có thì có hai lần bốc); 12% thêm một tính trạng thường mới;
  đột biến cơ bản 2% (cộng tính trạng của bố mẹ, hoa Cloud/cầu vồng về sau; trần 25%) cho một tính trạng Hiếm (80%) hoặc Sử thi (20%);
  quá 3 thì ưu tiên: tính trạng riêng của loài, đột biến, rồi ngẫu nhiên.
- **Tính trạng ẩn.** Tính trạng Hiếm/Sử thi bị ẩn với 50% (tối đa 1 ẩn mỗi con, đếm vào 3). Lộ khi Bond đủ **5 tim**: lúc đó mới hiện tên và mới có hiệu ứng
  (thưởng cho việc chăm); khi chưa lộ vẫn **truyền** cho đời sau. Lúc lộ có sự kiện `PIG_TRAIT_REVEALED` + toast.
- **Hiệu ứng** (4 loại, đều nối vào luật đang có): `growth` (tốc độ lớn), `sellValue` (giá xuất chuồng, hiện trong hộp thoại), `bondGain` (Bond mỗi lần vuốt
  ve / món yêu thích / chăm bệnh), `mutation` (cộng cơ hội đột biến của cặp).
- **Vận may (pity).** Lưu ở farm (`breedingPity`, vắng = 0). Lai không ra Rare+ *trong khi cặp có thể ra Rare+* → +2 điểm % cho lần sau (trần 30); ra Rare+ → về
  0; cặp không thể ra Rare+ → không đổi. Phần cộng được chuyển từ kết quả không-Rare+ sang kết quả Rare+ theo tỉ lệ (`applyPity`). "Rare+" = bậc Rare trở lên.
- **Con được định lúc bắt đầu mang thai**, như loài và giới tính: tính trạng, tính trạng ẩn, phả hệ ghi trong `pregnancy.child*`. Rng của phần này sinh từ
  `hash(mẹ, bố, thời điểm)` nên **không tiêu thụ rng chung** (kết quả loài và giới tính của mọi test cũ giữ nguyên).
- **Phả hệ.** Mỗi con giữ bản chụp tổ tiên sâu 3 đời (`lineageDepth`): tên, loài, giới, đời, tính trạng nhìn thấy (tính trạng ẩn không lộ). Bán/mất bố mẹ không làm
  mất cây. Xem ở bảng heo → "Phả hệ".
- **6 giống mới** (đủ 69 → 75): Nấm (Khá hiếm), Đom Đóm, Mây, San Hô (Hiếm), Pha Lê, Cực Quang (Sử thi). Chuỗi khám phá: Bí Ngô × Hươu Sao → Nấm; Nấm × Ong → Đom
  Đóm; Cừu × Pegasus → Mây; Rùa × Kỳ Giông → San Hô; San Hô × Kỳ Lân → Pha Lê; Mây × Đom Đóm → Cực Quang (nối hai nhánh). Mỗi giống có **tính trạng riêng**
  (`signatureTrait`, luôn có, luôn thấy), **món yêu thích riêng** (`favorite`), giá riêng (`sellGold`), màu và gene tag riêng. Art là placeholder
  (`docs/ASSET_TODO.md`). Chỉ có công thức đặc biệt (không mua được): tìm bằng lai.
- **NPC Nhà lai giống** (Bà Ngan Lai, `npc_breeder`, `station: breeding`, không phải NPC hướng dẫn của Area): mở từ Menu hoặc nút "Hỏi Nhà lai giống" trong hộp
  thoại phối giống. Mỗi ngày: 1 tin đồn gợi ý công thức *chưa khám phá* (nói "heo khá hiếm họ Nước ... gặp ...", **không bao giờ gọi tên loài** kết quả; test quét
  tên 80 ngày) + 1 mẹo. Cố định theo ngày (hash của số ngày), không đổi khi mở lại game. Hết công thức chưa khám phá → "chưa có tin mới".
- **Codex.** Ô chưa khám phá hiện "???" + bậc hiếm + tooltip "họ ..."; ô đã khám phá có tooltip họ, tính trạng riêng, món yêu thích.
- **Admin.** Tab "🧪 Mô phỏng lai" (1.000 lần lai bằng đúng luật game: tỉ lệ loài, Rare+, đột biến, tính trạng, chuỗi trượt dài nhất, vận may; cùng seed cùng kết
  quả); "Số liệu" sửa được tính trạng (hiệu ứng, trọng số, tên, mô tả), cân bằng lai giống và câu tin đồn. Bảng cặp / công thức: tab cũ của "Luật phối giống".
- **Save.** Mọi trường mới là tùy chọn (heo, thai kỳ, trẻ sơ sinh, farm): **không cần migration**, save cũ đọc như cũ (test). `breedingPity` chỉ được ghi khi > 0.

## Giới hạn / để sau
- Hoa Cloud và cầu vồng cộng đột biến: đã có tham số `mutationBoost`, chưa có nguồn (GĐ9 / thế giới động).
- Cá (GĐ8) dùng lại `systems/breeding`; chưa có trait riêng của cá.
- Heo mua ở cửa hàng và heo khởi đầu không có tính trạng: tính trạng chỉ đến từ lai giống (đột biến, 12% tính trạng thường mới).
- Art 6 giống mới là placeholder.
