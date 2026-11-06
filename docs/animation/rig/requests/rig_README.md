# Yêu cầu art — layer bộ phận cho puppet rig (decision 050)

> **Cách làm nhanh (khuyên dùng):** chỉ cần render 12 sheet của batch Gemini **`art_inbox/.batch/rig-01-layers/PROMPT.md`** (mỗi con 3 sheet: bộ phận rời, mắt + miệng nghỉ, các miệng; file đính kèm có sẵn trong thư mục đó; thứ tự B1–B3 → T1–T3 → F1–F3 → O1–O3), lưu `B1.png`, `B2.png`… vào cùng thư mục. Không phải căn chỉnh gì: Claude chạy `npm run rig:cut` (cắt + dọn nền / dấu sparkle) + `npm run rig:batch place <rig>` + `npm run rig:parts <rig>` để đặt từng bộ phận về đúng khớp. **2026-11-06: đã xong cho cả 4 con — rồi thay bằng skin (rig bẻ chính ảnh đã duyệt, decision 050 bổ sung (2)): loài mới chỉ cần sheet mắt + miệng, không cần sheet bộ phận.** Phần dưới là quy chuẩn chi tiết (khi muốn tự vẽ layer, hoặc chỉnh tay sau đó).

Đọc file này trước, rồi file của từng con: `rig_pig_boar.md`, `rig_pig_turtle.md`, `rig_fish_betta.md`, `rig_octopus.md`. Mỗi con có ảnh bố cục `rig_<rig>_guide.png` (vẽ từ bản rig-proof đang chạy trong game: vị trí từng bộ phận + điểm khớp đỏ, gốc dải xanh, vạch đất).

## Vì sao cần vẽ lại
Ảnh key pose hiện có (`cb_<art>_<pose>`) là ảnh phẳng: không tách được đầu / chân / tai / mắt (phần bị che không tồn tại), và 6 pose không nhất quán → chỉ di chuyển được cả ảnh. Rig mới cho thân chuyển động thật, nhưng cần **mỗi bộ phận một layer, vẽ đầy đủ cả phần bị che**. Bản đang chạy là vector "rig-proof" do agent vẽ để kiểm chứng chuyển động; nét vẽ chưa đạt phong cách Sobi Farm. Layer vẽ tay thay vào **không cần sửa code hay clip**.

## Quy chuẩn chung (bắt buộc)
1. **Canvas**: mỗi layer là một PNG **1024 × 1024**, nền trong suốt, cùng một canvas cho mọi layer của một con (= canvas 512 của rig ×2). Không cắt sát, không dời: bộ phận nằm **đúng chỗ của nó trong tư thế nghỉ** như ảnh guide. Script tự cắt sát và tính hộp.
2. **Mặt đất** y = 940 (px của 1024), tâm chân x = 512. Con vật **quay phải**, góc nhìn ba phần tư (three-quarter) như key pose hiện tại.
3. **Tư thế nghỉ (bind pose)**: đứng thẳng, chân thẳng xuống, đầu thẳng, mắt mở, miệng nghỉ. Không vẽ động tác trong layer — động tác do rig làm.
4. **Vẽ phần bị che**: thân vẽ đầy đủ dưới đầu; mép trên của chân kéo dài vào trong thân ~20 px (để khi chân xoay không hở); gốc tai, gốc đuôi, gốc vây, gốc xúc tu kéo vào trong ~15 px.
5. **Mặt (slot)**: mỗi biểu cảm một layer riêng, **cùng vị trí** (mắt `eyes_*` chồng khít nhau, miệng `mouth_*` chồng khít nhau). Mắt / miệng **không** vẽ lên layer đầu.
6. **Dải (chain)**: đuôi, vây, xúc tu, thân cá vẽ **duỗi thẳng nằm ngang**, gốc ở mép **trái**, ngọn ở mép phải, đặt ở khoảng trống bất kỳ của canvas (vị trí không quan trọng, chỉ hình dạng). Độ dày phân bố đều hai bên đường tâm ngang. Không cong sẵn (rig tự uốn) — trừ khi file của con ghi khác.
7. **Phong cách**: đúng Sobi Farm (`asset/GAME_ART_DIRECTION.md`): viền nâu ấm mềm, tô bóng mềm, má hồng, mắt to bóng 2 đốm sáng; khớp bảng màu với ảnh hiện có của con đó (`cb_<art>_idle.png`) để giữ nhận diện. Không chữ, không watermark, không bóng đổ dưới chân (game tự vẽ).
8. **Tên file**: `<NAME>.png` đúng tên layer trong bảng của từng con, đặt vào `asset/rigs/<rig>/layers/`. Thiếu layer nào thì rig giữ bản vector của layer đó (thay dần được).
9. **Nộp**: chạy `npm run rig:parts <rig>` → kiểm `npm run assets:check` → mở Admin → **Xưởng rig sinh vật** (`#/rig-lab`) xem từng clip, bật "Hiện xương", "Dải 8 khung". Nếu khớp lệch: chỉnh `at` của bone trong `content/anim/rigs/<rig>.json` (hoặc báo agent).
10. **Bản quyền (decision 048)**: thiết kế gốc, không lấy dáng / màu của nhân vật có bản quyền; prompt AI không nhắc tên IP nào.

## Gợi ý làm bằng Gemini (backend G)
Tạo 1 sheet "turnaround giữ nhân vật" ở tư thế nghỉ trước, sau đó yêu cầu "exploded view": các bộ phận tách rời trên nền trắng, cùng tỉ lệ, kèm các biến thể mắt / miệng; cắt bằng `image-to-asset` rồi đặt từng bộ phận về đúng vị trí trong canvas 1024 theo ảnh guide (chồng mờ guide lên để căn). Phần bị che cần vẽ bù tay.
