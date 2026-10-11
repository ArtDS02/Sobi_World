# content/ — nội dung và số liệu game (JSON)

- `shared/` — dùng chung mọi Area: item, shop, túi đồ, tiến trình, quality, thành tích, quà hằng ngày, ngày/đêm, `time.json` (4 buổi, bước mô phỏng, trần offline), `health.json` (bệnh, nguy kịch, chết, ân hạn, bảo vệ người mới).
- `farm/` — của Sobi Farm: giống heo, lai giống, balance, hành vi, trang trí, quà, tên, FX mùa, layout, `area.json` (manifest Area).
- `schemas/` — zod schema cho từng file, từ vựng đóng (`vocab.ts`), id sinh tự động (`ids.generated.ts`).

Quy tắc: không hard-code số liệu trong code; sửa nội dung bằng Admin (`npm run admin`) hoặc sửa JSON rồi chạy test.
Sau khi thêm/xóa id: `npm run content:ids`. Id đã phát hành không bị xóa (decision 006). Game đọc qua `src/core/config/content.ts`.

GĐ5: `garden/` — `crops.json` (5 cây: hạt, giờ lớn, sản lượng), `balance.json` (ô đất, tưới, héo, phân bón, vòi tưới, Máy xay / Thùng ủ, bảng cấp), `area.json`; `shared/recipes.json` (recipe của công trình); `shared/items.json` có thêm hạt, nông sản, thức ăn cao cấp, phân bón. Tất cả sửa được ở Admin → Số liệu.

GĐ3: `plaza/layout.json` (Sảnh), `shared/character.json` (nhân vật), `<area>/area.json` có `planned: true` cho Area chưa làm (Cloud, Adventure).

GĐ8: `aquarium/` — `fish.json` (12 loài cá: bậc hiếm, giờ lớn, giá, độ hay cắn câu, cá đêm, vảy, đẻ được), `balance.json` (bể và 4 cấp, nước, đời sống cá, cần câu, đẻ trứng, KN), `names.json` (tên cá), `area.json` (không còn `planned`). `shared/items.json` thêm 12 cá (`item_fish_*`, loại `FISH`), `item_scale`, `item_pearl`, `FOOD_FISH`; `shared/recipes.json` thêm `recipe_fish_feed`; `garden/balance.json` cho Vòi tưới cấp 2–3 đòi vảy và ngọc trai (`materials`). Sửa ở Admin → Số liệu.

GĐ7: `breeding/` — `traits.json` (tính trạng: hiệu ứng, trọng số), `balance.json` (di truyền, đột biến, vận may, phả hệ), `rumors.json` (câu tin đồn của Nhà lai giống). Bảng cặp và công thức đặc biệt vẫn ở `farm/breeding.json`; `farm/species.json` thêm `signatureTrait`, `favorite`; `shared/npcs.json` thêm NPC `station`.

GĐ11: `shared/tech.json` (4 công nghệ × 3 cấp: giá Sobi Coin + vật liệu Adventure, hiệu quả); `adventure/zones.json` thêm Núi Đá Vọng và Tàn Tích Cổ (`requiresCleared` nối chuỗi vùng), `enemies.json` 11 kẻ địch mới, `equipment.json` 3 món Sử thi, `balance.json` có `prep` (khẩu phần); `shared/items.json` thêm vật liệu cổ, khẩu phần, trứng (`hatchRarity`) và giá bán hạt giống; `shared/recipes.json` có `requiresTech`; `farm/balance.json` thêm `materials` cho máng và chuồng. Sửa ở Admin → Số liệu (`shared/tech.json` mới). Sau khi sửa tay: `npm run content:fmt`.

GĐ12: `shared/weather.json` (tần suất theo mùa, cầu vồng sau mưa, tác dụng của mưa / mưa đêm / sương mù / cầu vồng), `shared/festivals.json` (chu kỳ 28 ngày, 4 lễ hội, nguồn Vé Lễ Hội, cửa hàng lễ hội), `shared/merchant.json` (tần suất ghé, đơn đặc biệt, cộng giá chợ, lời thoại). Sửa ở Admin → Số liệu (cả chữ của lễ hội và Thương nhân); bật thử ở Người chơi → Trạng thái game. Sau khi sửa tay: `npm run content:fmt`.

GĐ13: `i18n/en.json` — bản tiếng Anh của mọi chữ trong các file content (tên giống heo, NPC, kỹ năng, cá, hoa…), khoá theo `<file>` → `<đường dẫn tới chữ>` (phần tử mảng gọi bằng `id` nếu có, không thì bằng số thứ tự). File content vẫn viết tiếng Việt; thêm mục mới có chữ thì chạy `npm run content:i18n` để xem mục nào thiếu bản dịch. Bài test `tests/unit/i18n.test.ts` chặn thiếu, thừa, sai `{tham_số}`.
