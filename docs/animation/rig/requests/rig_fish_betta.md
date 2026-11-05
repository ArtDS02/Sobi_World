# Yêu cầu art: rig `fish_betta` — Cá Betta (aquatic, thân uốn, vây lụa)

Quy chuẩn chung: `rig_README.md`. Bố cục + khớp: `rig_fish_betta_guide.png`. Tham chiếu: `public/assets/props/combat/cb_fish_betta_idle.png`.

1. **Đối tượng**: Cá Betta (chiến binh Aquarium trong Adventure, art id `fish_betta`).
2. **Mục đích**: lơ lửng (+ fidget: phóng ngắn, nhả bong bóng), bơi, đánh thường (cuộn chữ C → quất → cắn), cast (xoè vây, bốc lên, đẩy), bị đánh (vây co, đuôi văng), bị đánh nặng (xoay vòng), KO (lật bụng), thắng (nhảy vồng), thủ (cuộn vây che), choáng, buff, né.
3. **Lý do**: ảnh phẳng không uốn thân được; vây lụa là thứ đẹp nhất của betta nhưng hiện chỉ đứng yên theo ảnh.
4. **Phương pháp**: đầu là bộ phận cứng; **thân sau đầu, vây đuôi, vây lưng, vây bụng là dải uốn** (Phaser Rope, sóng chạy từ gốc ra ngọn); vây ngực cứng có lò xo; mặt đổi ảnh.
5. **Danh sách layer**:
| Layer | Mô tả | Gốc / khớp |
|---|---|---|
| `head` | nửa thân trước gồm đầu + nắp mang (không mắt, không miệng), đỏ hồng | 600,600 |
| `fin_pec` | vây ngực nhỏ hình quạt | 656,628 |
| `spine` (dải) | **thân sau** từ sau mang tới cuống đuôi, duỗi ngang, gốc (dày ~136 px) bên trái → ngọn (dày ~68 px) bên phải, có vảy; **dải này chạy từ đầu về phía đuôi nên vẽ bụng sáng ở mép TRÊN** (dải bị lật khi hướng sang trái) | gốc tại 600,600 |
| `tail_fin` (dải) | vây đuôi lụa lớn: gốc hẹp (~80 px) bên trái, xoè dần (~400 px) bên phải, tia vây; **cũng lật: mép trên của dải hiện ở dưới** | nối ngọn `spine` |
| `veil_top` (dải) | vây lưng dài dạng dải lụa, gốc hẹp → ngọn rộng | 600,540 |
| `veil_low` (dải) | vây bụng dài, nhỏ hơn | 600,660 |
| `eyes_*` (7) | **1 mắt** (nhìn ngang) to tròn, 2 đốm sáng | 712,580 |
| `mouth_*` (5: neutral, open "o", smile, grit, cry) | miệng nhỏ ở mõm | 764,620 |
6. **Góc nhìn**: ngang (side) quay phải, hơi ba phần tư ở đầu.
7. **Cấu trúc**: các dải vẽ thẳng, đối xứng quanh đường tâm ngang; gốc mỗi dải phủ vào trong đầu ~15 px.
8. **Hình ảnh**: thân #d23a64 → #f3a2b4 (bụng), vây tím lụa #9a6ad8 pha đỏ #cf4a7c, tia vây hồng nhạt, viền #6a2440; vây hơi trong (alpha 90–95 %).
9. **Kỹ thuật**: PNG 1024², trong suốt, `asset/rigs/fish_betta/layers/`, `npm run rig:parts fish_betta`.
10. **Pose**: lơ lửng ngang, vây duỗi (ảnh guide cho vị trí đầu, các dải nằm riêng ở góc canvas).
