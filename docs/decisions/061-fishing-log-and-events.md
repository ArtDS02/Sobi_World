# 061 — Sổ câu cá (kỷ lục kích thước) và sự kiện khi câu

**Ngày:** 2026-11-18 · **Trạng thái:** Chủ dự án chọn hướng 3 và 5 trong các đề xuất làm câu cá hay hơn; chờ duyệt bản làm

## Bối cảnh
Câu cá ba nhịp (decision 035) lặp lại giống nhau mỗi lần và không cho lý do câu tiếp: Codex chỉ ghi "đã câu được loài này".

## Sổ câu cá
- Mỗi cá câu được có **kích cỡ (cm)**: dải cm theo độ hiếm (`fishing.size.byRarity`), vị trí trong dải theo cỡ bóng
  (nhỏ / vừa / lớn / vàng) cộng một roll. Chỉ là chỉ số trình bày + kỷ lục, không đổi giá bán.
- Save: `areas.sobi_aquarium.catchBook` (trường tùy chọn, save cũ không cần migration): theo loài `{ count, bestCm, firstAt }`.
- **Phá kỷ lục** (lớn hơn `bestCm` đã có, từ lần câu thứ hai của loài đó) thưởng `fishing.record.coins` Sobi Coin qua ledger
  (`AQUARIUM_FISH_RECORD`). Lần câu đầu của loài không thưởng (Codex đã thưởng).
- Màn "Sổ câu cá" trong bến câu: mỗi loài câu được hiện số lần và kỷ lục; loài chưa câu hiện bóng đen.

## Sự kiện khi câu
Sau một lần câu thành công bằng cần (có cỡ bóng; đường dẫn kiểm thử / bot không có cỡ bóng thì không có sự kiện), tối đa
một sự kiện, bốc theo `fishing.events` (tỉ lệ cộng dồn, có độ sâu tối thiểu):
- **Đàn cá**: cá câu được kèm thêm 1–2 con cùng loài.
- **Cá khổng lồ** (xa khơi): kích cỡ x`sizeFactor` ngoài dải thường, thưởng xu.
- **Chai thư**: vớt được một khoản xu nhỏ.
- **Rương chìm** (giữa hồ trở ra): vật phẩm (ngọc trai, thức ăn cá).
Sự kiện chỉ làm giàu kết quả: không đổi bảng bốc cá, không đổi thời gian nghỉ của cần.

## Mục tiêu hằng ngày
`fish.caught` mang thêm `shadow` và `depth` (tùy chọn). Hai bộ đếm mới: `bigFishCaught` (bóng lớn / vàng), `farCatches`
(xa khơi). Hai mẫu mục tiêu ngày mới (mở từ cấp thế giới 6, như mục tiêu câu cá hiện có): "Câu N cá lớn", "Câu N cá xa khơi".

## Ngoài phạm vi
Art / animation / âm thanh cho các sự kiện (GĐ14; nhu cầu ghi `docs/ASSET_TODO.md`): trước đó dùng biểu tượng chữ.
Mồi, kiểu chiến đấu riêng từng loài: để đợt sau.
