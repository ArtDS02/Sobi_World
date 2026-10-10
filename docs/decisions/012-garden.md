# 012 — Sobi Garden và sản xuất (GĐ5)

**Ngày:** 2026-10-10 · **Trạng thái:** Đã làm

## Bối cảnh
GĐ5 thêm Area thứ hai và hoàn thành vòng lặp Garden ↔ Farm (spec V2 §3.3). Số liệu theo `GAME_BALANCE.md` §5–§6; spec chi tiết
`update_spec_sobi_garden_gameplay_v1.md` (luân canh, đất ẩm / nước, cửa sổ khát, Essence, 12 cây) **không** thuộc GĐ5.

## Lựa chọn
- **Mô hình thời gian dạng đóng.** Một ô đất lưu `grown` (mili-giây "đủ nước" đã tích) và `wetUntil`; cây lớn tốc độ 1 khi đủ nước, 0,5 khi khô
  (`dryGrowthRate`). Trong một khoảng thời gian, phần có nước tính trước rồi phần khô → thời điểm chín tính chính xác, không phụ thuộc cỡ lát
  (test: lát 1 phút / 10 phút / 1 giờ / một lần nhảy ra cùng kết quả). Mẻ chế biến cũng là hàm của `now` (`core/production`).
- **Tưới tay có hiệu lực 3 giờ** (`waterHours`), sau đó cây lớn chậm lại một nửa; chỉ tưới ô đang khô (hết "tưới thừa"). Vòi tưới (Lv1: 6 ô đầu) giữ ô luôn đủ nước.
- **Phân bón:** hệ số thời gian 0,75 và +1 sản lượng cho cây đang lớn; bón lúc cây đã qua mốc mới thì chín ngay.
- **Héo:** chín quá 48 giờ không hái → sản lượng ×0,5 (làm tròn xuống, tối thiểu 1). Không bao giờ mất cây hay mất ô.
- **Gieo:** dùng hạt trong túi trước, thiếu thì mua ở giá hạt trong cùng một hành động (giống đổ máng); không có cửa hàng hạt riêng. Gieo / tưới / thu hoạch / bón làm được cho nhiều ô một lần.
- **Công trình:** Máy xay (400), Thùng ủ (300), mỗi nơi một công việc, tối đa 10 mẻ một lần; nhận thành phẩm bằng tay (túi đầy thì nhận phần vừa chỗ, phần còn lại ở lại công trình). Giá xây là quyết định của tôi (spec chưa ghi).
- **Vòi tưới nhiều cấp** (6 / 12 / 24 ô, giá 500 / 1.500 / 4.000) — spec chỉ ghi Lv1; hai cấp sau là số của tôi để ô đất mở rộng vẫn dùng được. Sửa ở Admin → Số liệu.
- **Ô đất:** 6 ô đầu, mở thêm 3 ô: 200 / 500 / 1.200 / 3.000 / 7.000 / 15.000 tới 24 ô. Bản cập nhật Garden có điều kiện cấp World và Ngọc trai / vật liệu cổ — chưa có nên chỉ tính Sobi Coin.
- **Thức ăn:** giữ thang đói của Farm (thức ăn thường +50, GAME_BALANCE ghi +35 theo thang cũ): cao cấp +70 (tỉ lệ 50/35), cỏ +14. `feedPig` nhận `itemId`; máng vẫn chỉ ăn thức ăn thường. **Tâm trạng +10 / +3 chưa làm**: tâm trạng là giá trị tính ra từ đói / sạch / năng lượng, thưởng vĩnh viễn cần Bond (GĐ6).
- **Giá:** thức ăn cao cấp 60, phân bón 50 (thang 25 của thức ăn thường); chưa bán ở cửa hàng — chỉ làm được ở công trình. Nông sản bán được ở màn Kho (cỏ 1, lúa mì 3, bắp 4, khoai 5, cà rốt 10).
- **Mở Area tự động:** `registry.advance` mở mọi Area đủ điều kiện (tạo slice, thêm `unlockedAreas`, phát `AREA_UNLOCKED` → `area.unlocked`). Save cũ đã Farm ≥ Lv3 được mở ở lần tick đầu. Không đổi world save (Garden là slice mới, version 1) nên không cần migration.
- **Cảnh:** Phaser (`GardenScene`) chỉ vẽ ruộng; HUD / bảng hạt / hộp thoại là DOM ở `src/areas/garden/ui`, gắn vào khung của shell qua `overlay` (Farm không import Garden). Garden chơi bằng click (manifest `movement: click`).
- **Phản hồi:** sự kiện không phải của Farm đi qua `FeedbackDirector.other` (một chỗ duy nhất biến sự kiện thành âm thanh + toast).
- **Admin:** trang Số liệu có thêm cây, cân bằng Garden, recipe, vật phẩm (chỉ sửa số, kiểm bằng schema); ⏩ Tua thời gian dịch cả đồng hồ Garden (`rewind.ts`).

## Hệ quả
- `core` đổi 3 chỗ, đều không phá hợp đồng: registry có `unlockReady`, `ITEM_CATEGORY_VALUES` thêm `SEED` / `CROP`, `ErrorCode` thêm 9 mã. `START_INVENTORY` đổi sang `partialRecord` (item mới không bắt buộc có mặt).
- Mỗi item thêm vào content làm `FarmGame.inventory` đầy đủ hơn: test dùng `inv()` (`tests/unit/stateFactory.ts`).
- Art của Garden là placeholder sinh bằng script (`docs/ASSET_TODO.md`).
