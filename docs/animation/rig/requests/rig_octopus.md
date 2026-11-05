# Yêu cầu art: rig `octopus` — Bạch Tuộc (cephalopod, cấu trúc đặc biệt)

Quy chuẩn chung: `rig_README.md`. Bố cục + khớp: `rig_octopus_guide.png`. Tham chiếu màu: `public/assets/props/fish_octopus.png` (Aquarium).

1. **Đối tượng**: Bạch Tuộc cam (nền tảng cho cá Aquarium + quái biển sau này).
2. **Mục đích**: lơ lửng thở bằng túi đầu (+ fidget: vẫy một xúc tu chào, vươn người), bơi phản lực (túi đầu bóp – xúc tu khép rồi xoè), đánh (cuộn một xúc tu ra sau rồi quất), cast (6 xúc tu giơ lên, túi đầu vươn cao → đập xuống), bị đánh (túi đầu bẹp, xúc tu co cuộn), KO (chìm xuống, xúc tu xoè bẹp), thắng (nhảy, xúc tu múa), thủ (xúc tu cuộn che trước).
3. **Lý do**: ảnh Aquarium là ảnh phẳng; xúc tu là phần cần chuyển động mềm nhất — không thể làm bằng tween cả ảnh.
4. **Phương pháp**: túi đầu cứng (co giãn bằng scale); **6 xúc tu là dải uốn** (cuộn `curl` + sóng); mặt đổi ảnh.
5. **Danh sách layer**:
| Layer | Mô tả | Gốc / khớp |
|---|---|---|
| `mantle` | túi đầu tròn cam, đốm sẫm, má hồng (không mắt, không miệng) | 516,644 |
| `arm` (dải) | xúc tu trước: gốc dày ~64 px bên trái → ngọn ~14 px bên phải, dài ~336 px, **giác hút kem ở mép dưới** | 6 gốc theo guide |
| `arm_back` (dải) | xúc tu sau: như `arm` nhưng tối hơn 15 %, giác hút nhạt | 2 gốc |
| `eyes_*` (7) | 2 mắt to trên nửa dưới túi đầu | 580,540 |
| `mouth_*` (5) | miệng nhỏ, `open` là chữ "o" (phun) | 582,604 |
6. **Góc nhìn**: ba phần tư quay phải.
7. **Cấu trúc**: một ảnh `arm` dùng cho 4 xúc tu trước, `arm_back` cho 2 xúc tu sau (rig xoay / uốn từng cái); gốc xúc tu sẽ nằm dưới mép túi đầu.
8. **Hình ảnh**: cam #f4864f → #d9673a, giác hút #fde3cc, viền #8a3a1e; mềm, dễ thương, không ghê.
9. **Kỹ thuật**: PNG 1024², trong suốt, `asset/rigs/octopus/layers/`, `npm run rig:parts octopus`. *Tuỳ chọn sau*: 2 biến thể `arm` (cong sẵn nhẹ) để 6 xúc tu không giống hệt nhau.
10. **Pose**: túi đầu thẳng, xúc tu do rig tự xếp (ảnh guide cho vị trí gốc).
