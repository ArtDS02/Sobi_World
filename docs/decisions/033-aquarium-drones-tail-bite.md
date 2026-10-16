# 033 — Aquarium: drone mang thức ăn / nước, cá vẫy đuôi thật, cá cắn câu thay dấu "!", bỏ bảng "Bể cá"

**Ngày:** 2026-10-16 · **Trạng thái:** Chủ dự án góp ý trên decision 032; agent tự chọn cách làm (chờ duyệt)

## Bối cảnh
Sau decision 032: bảng "Bể cá" thừa (bảng tên nơi và thẻ "Bể cá" ở thanh dưới đã mở thẻ Bể); dấu "!" trên cần câu lạ;
cá bơi còn giả (cả con chỉ nghiêng, không vẫy đuôi); cho ăn nên có drone bay tới thả thức ăn; thay nước cũng nên có vật gì đó.

## Quyết định
- **Bỏ bảng "Bể cá"** trong cảnh (`place.sign`, chuỗi `scene.sign`). Thẻ Bể vẫn mở bằng bảng tên nơi và thẻ "Bể cá".
- **Cá vẫy đuôi thật** (`scene/fishBody.ts`): ảnh cá vẽ thành dải 14 đoạn (Phaser Rope, WebGL) và uốn theo một sóng chạy từ
  đầu ra đuôi, mạnh ở đuôi, gần như không ở đầu (`bodyWave`); đuôi đập nhanh và rộng hơn khi bơi nhanh / quay đầu, chỉ phe phẩy
  khi nghỉ. Thân cả con lắc nhẹ ngược pha. Trình Canvas (không có Rope) dùng ảnh thường. Bấm cá qua một vùng chữ nhật.
- **Cá cắn câu** (thay "!"): khi câu được, cứ 1,1–2,2 giây phao giật xuống 2 lần và cần câu rung trên cán. Phao được cắt riêng
  khỏi ảnh `bld_fish_dock` (3 phần cùng texture, `setCrop`) nên không cần ảnh mới. Nơi vẽ sẵn chỗ câu: cấp 1 gợn sóng
  quanh phao vẽ trong nền, cấp 5 đèn lồng loé sáng và nhả bọt.
- **Drone** (dùng `ui/world/fertilizerDrone.ts` như Garden / Cloud; `scene/aquariumCare.ts`):
  - Cho ăn: drone thức ăn bay từ trái vào, dừng trên chỗ các cá vừa ăn, rắc hạt (hạt toả ra rồi rơi xuống nước), bay ra phải;
    cá chỉ lao tới khi hạt đã rơi.
  - Thay nước: drone nước dừng trên bên trái mặt nước, dòng nước đổ từ bụng drone xuống; nước đục giữ nguyên tới lúc đổ
    rồi mới tan (dải sáng quét, bọt, lấp lánh như 032).
  - Ảnh `prop_drone_aquarium` (hopper thức ăn cá) và `prop_drone_water` (bồn nước + vòi); tới khi có, mượn drone Garden / Cloud.
    Prompt: `art_inbox/.batch/aquarium-03-fx/PROMPT.md` (sheet W). Dòng manifest thêm khi giao ảnh.

## Còn lại
- Bay vào từ trái mất ~0,8 giây ở 1600 px; nếu thấy chậm có thể cho drone xuất phát gần hơn.
