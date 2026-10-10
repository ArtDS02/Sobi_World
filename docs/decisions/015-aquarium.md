# 015 — Sobi Aquarium: bể cá, câu cá, vảy và ngọc trai (GĐ8)

**Ngày:** 2026-10-10 · **Trạng thái:** Đã làm, số liệu chờ chủ dự án chơi thử

## Bối cảnh
GĐ8 (spec V2 §8.3, §13; GAME_BALANCE §9) thêm Area thứ ba, mở qua cổng Biển ở Sảnh. Cá phải dùng **model sinh vật chung** (`systems/creature`, `health`, `bond`,
`quality`, `breeding`), không viết lại. Điều kiện mở theo decision 007: **Sobi World cấp 6** (GAME_BALANCE §7 ghi "Farm Lv6, Garden Lv4", đã được thay bởi cấp chung).

## Lựa chọn
- **Cá là sinh vật chung.** `Fish = Creature` (+ `breedReadyAt`). `advanceCreature` chạy y như heo, chỉ khác bộ số (`fishLife.ts`): đói −5/giờ (spec), không ngủ / không
  mệt (`energy` 0), "phân" của heo là **vảy cá** (cùng sổ `poopProgress`, rơi mỗi `scaleHours` khi cá lớn hẳn). Bệnh, nguy kịch (48 giờ), chết (72 giờ), ân hạn sau bù
  offline dùng nguyên `content/shared/health.json` (decision 002, 004). Thuốc là `MEDICINE_COMMON` (Healing Potion của GĐ9 nối vào sau).
- **Nước = độ sạch của cá.** Bể có một độ trong `water` (0–100): mất `waterPerHour + waterPerFishPerHour × số cá` mỗi giờ, nhân hệ số lọc của cấp bể. Mọi cá mất sạch sẽ
  cùng tốc độ đó nên `cleanliness` của cá luôn bằng độ trong của nước; **Thay nước** (miễn phí) đặt cả hai về 100. Số cá chỉ đổi lúc có hành động hoặc lúc trứng nở, và mô
  phỏng cắt đúng ở các lúc nở → kết quả **không phụ thuộc cỡ lát thời gian** (test: một lần nhảy / từng phút / từng giờ).
- **Bể.** 4 cấp, sức chứa 5 / 8 / 12 / 16; giá 0 / 800 / 2.500 / 8.000 Sobi Coin; cấp 3 cần 10 vảy, cấp 4 cần 20 vảy + 3 ngọc trai; cấp cao lọc tốt hơn (nước đục chậm
  hơn: ×1 / 0,85 / 0,7 / 0,6). Vảy chờ trong bể tối đa 2 × sức chứa (thu bằng nút "Thu vảy" hoặc bấm vào đống vảy).
- **Câu cá** (`logic/fishing.ts`, thuần). Hộp thoại ở bến có mini-game dễ thương: phao chạy qua lại trên thanh, **Giật cần** khi phao nằm trong vùng xanh. Điểm 0..1 (càng gần
  tâm vùng xanh càng cao) gửi vào `castLine`; dưới `missBelow` = 0,25 thì cá tuột (chỉ nghỉ nửa thời gian chờ). Cần câu nghỉ **2 phút** (spec). Trên mức đó: bốc có trọng số
  theo `catchWeight` × `(1 + 0,6 × điểm × bậc hiếm)`, nên cast đẹp gặp hiếm hơn. **Cá đêm** (4 loài `nightOnly`) chỉ vào bảng khi đang ở buổi tối (`night` của `time.json`).
  Có thêm **trai ngọc** (~2% mỗi lần) cho ngọc trai. Điểm của mini-game đọc đồng hồ một lần lúc giật (UI), phần bốc dùng rng chung của hành động.
- **12 loài, 4 bậc** (Common 3, Uncommon 4, Rare 3, Epic 2), 6–24 giờ lớn (spec), 4 loài chỉ cắn lúc tối. Mỗi loài có một **vật phẩm** `item_fish_*` (câu được nằm trong túi).
  Công dụng của mỗi loài (≥ 2, GĐ8 §4): **bán** (giá của vật phẩm), **nuôi lớn rồi bán giá cao hơn nhiều** (`tankGold` × cỡ × chất lượng × sức khỏe × tính trạng),
  **Codex** (loài `fish`, khám phá ở lần câu đầu), **đơn hàng** (cá thường, Uncommon, Betta ở Bảng đơn), **vảy** (mọi loài rụng vảy khi lớn hẳn), **lai** (6 loài đẻ được),
  **phiêu lưu về sau** (GĐ10, `purpose` ADVENTURE đã có chỗ, đang khóa).
- **Cá đẻ.** Hai cá cùng loài (loài `breedable`), một đực một cái, lớn hẳn, khỏe, no (≥ 50), không phải thú cưng, không đang nghỉ: tốn 2 thức ăn cá, đẻ **một trứng** (tối đa 2 trứng
  trong bể), nở sau 6 giờ khi còn chỗ (không chỗ thì trứng chờ), đôi cá nghỉ 12 giờ. Con **được định lúc đẻ** (giới, tính trạng, tính trạng ẩn, phả hệ) bằng đúng
  `systems/breeding` của GĐ7 (di truyền 50%, đột biến, tối đa 3, ẩn, phả hệ 3 đời) với rng sinh từ (mẹ, bố, thời điểm) → không dùng rng chung. **Không lai khác loài** ở GĐ8
  (không có "công thức cá"); không có vận may (pity) cho cá. Hiệu ứng tính trạng nối vào cá: lớn nhanh (`growth`), giá bán (`sellValue`), thân thiết (`bondGain`).
- **Thức ăn cá từ Garden.** Recipe mới `recipe_fish_feed` ở **Máy xay**: 2 khoai tây → 4 `FOOD_FISH` (10 phút). Cá chỉ ăn `FOOD_FISH` (hoặc món yêu thích của nó, lấy từ Garden
  như heo). Cho ăn mà túi thiếu thì **mua phần thiếu theo giá `priceGold` (20)** trong cùng hành động (giống hạt giống của Garden), để cá không chết đói chỉ vì quên Máy xay;
  công thức rẻ hơn nhiều nên vẫn là đường đáng đi. Mở khu tặng 6 thức ăn và một cá vàng nửa lớn.
- **Vật liệu cho nơi khác.** **Vòi tưới của Garden** cấp 2 cần 10 vảy, cấp 3 cần 20 vảy + 3 ngọc trai (`content/garden/balance.json` → `sprinkler[].materials`, tùy chọn). Người chơi
  đã mua Vòi tưới trước đó không bị ảnh hưởng. Vảy và ngọc trai còn dùng cho bể và bán được (40 / 300 Sobi Coin), có trong đơn hàng.
- **Liên kết với thế giới.** Sự kiện chuẩn mới `fish.caught` (đếm `fishCaught`, khám phá Codex `fish`) và `tank.cleaned` (đếm `tanksCleaned`); mục tiêu hằng ngày "Câu N con cá",
  "Thay nước bể"; 5 thành tựu (`FISH_10/100/500`, `TANK_20`, `CODEX_FISH`); 9 dòng đơn hàng; NPC `npc_fisher` (Cô Gà Mơ Màng) với 5 chủ đề; gợi ý "việc tiếp theo" và dòng "vắng mặt".
- **Cảnh và giao diện.** Cảnh Phaser (`AquariumScene`): bể kính với cá bơi (mỗi cá có seed riêng, to dần theo tuổi, tô xanh khi bệnh, biểu tượng đói / bệnh), trứng trên cát, đống
  vảy, bến câu, bóng nước, màn tối ban đêm, nước đục dần theo độ trong. HUD + thanh nút + hộp thoại (cá, bán, bến câu, cá trong túi, bể, cho đẻ) ở DOM (`ui/`), mỗi nút tắt
  đều nói lý do (thử chạy hành động thật). Vì có hai Area chơi bằng chuột, lớp phủ của Garden và Aquarium dùng chung một overlay của shell (`app/areaOverlays.ts`).
- **Admin.** "Số liệu" sửa được cá (giờ lớn, giá, độ hay cắn, giờ rụng vảy, tên, mô tả) và cân bằng Aquarium (bể, nước, cá, cần câu, đẻ trứng, KN); Admin tua thời gian dịch cả
  đồng hồ bể. Các cờ (`nightOnly`, `breedable`) và danh sách loài là dữ liệu của file, đổi bằng cách sửa file (như danh mục heo trước GĐ7).
- **Save.** Slice mới `areas.sobi_aquarium` version 1 (không đổi world save v10, không cần migration); Area mở tự động khi đủ cấp (registry `unlockReady`), save cũ đủ cấp 6 được mở
  ở lần tick đầu. Thêm hạng mục vào `ITEM_CATEGORY_VALUES` (`FISH`), `STAT_ID_VALUES`, `ErrorCode` (13 mã), Codex `discovery.fish`.

## Cân bằng (bot `npm run sim:week -- 7 17`, 3 phiên mỗi ngày, 6 lần câu mỗi phiên)
Aquarium mở ngày 9,5 (cấp 6). Trong ~7,5 ngày sau đó bot câu ~150 lần, bán cá câu được ~9.900 + cá nuôi lớn ~3.200 Sobi Coin (≈ 1.700 / ngày, khoảng 20% thu nhập khi đó, phần còn lại
là xuất chuồng heo), không cá nào bệnh hay chết (bot thay nước và cho ăn mỗi phiên), bể lên đủ 4 cấp sau khoảng 10 ngày kể từ khi mở. Kết luận: **bổ sung**, không lấn Farm; số cần
chủ dự án chơi thử: giá cá hiếm (Koi Rồng 800 vật phẩm / 2.000 nuôi lớn), ~2% trai ngọc, tốc độ rụng vảy.

## Giới hạn / để sau
- Cá chưa có "công thức lai" khác loài, chưa có cá phiêu lưu (GĐ10), chưa có Healing Potion (GĐ9); chưa đổi tên cá trong UI (hành động `renameFish` đã có).
- Art toàn bộ là placeholder (`docs/ASSET_TODO.md`); chưa có nhạc / âm riêng cho cá (dùng bộ có sẵn).
- Hoa Cloud tăng đột biến khi lai (GĐ9) sẽ nối vào `mutationBoost` của `rollChildTraits`; cá đã đi qua đúng hàm đó.
