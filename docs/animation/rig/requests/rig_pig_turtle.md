# Yêu cầu art: rig `pig_turtle` — Heo Rùa (thân nặng, chậm, hiền)

Quy chuẩn chung: `rig_README.md`. Bố cục + khớp: `rig_pig_turtle_guide.png`. Tham chiếu: `public/assets/props/combat/cb_pig_turtle_idle.png`.

1. **Đối tượng**: Heo Rùa (heo hồng mang mai rùa xanh có chồi lá, art id `pig_turtle`).
2. **Mục đích**: idle chậm (+ fidget: ngước nhìn trời, rụt đầu ngủ gật), đi lạch bạch, đánh thường (lao mai), cast (cắm chân, mai trồi, lá xoay, ngửa đầu), bị đánh (rụt đầu vào mai), bị đánh nặng (rụt cả chân), KO, thắng (lắc lư nhún), **thủ = rụt hẳn vào mai** (nét đặc trưng), choáng, buff, né.
3. **Lý do**: ảnh hiện tại phẳng; pose `cast` dời mai sang chỗ khác so với `idle` (đứng 2 chân) → nhảy hình; không rụt đầu vào mai được vì đầu và mai dính nhau.
4. **Phương pháp**: cutout puppet; mai là bộ phận riêng có lò xo nặng (lắc trễ); lá có lò xo mềm; tai cụp lò xo; đuôi xoắn là dải.
5. **Danh sách layer**:
| Layer | Mô tả | Khớp (canvas 1024) |
|---|---|---|
| `leg_bl`, `leg_fl` | chân xa, ngắn mập, móng xanh rêu | 286,840 · 636,840 |
| `body` | thân hồng (phần lộ dưới mai); **vẽ đủ cả phần mai che** | 456,780 |
| `leg_br`, `leg_fr` | chân gần | 334,844 · 580,844 |
| `shell` | mai vòm xanh, vân lục giác, **viền kem dưới mai**; mép trước mai phải để hở chỗ đầu thụt vào | 456,800 |
| `leaf` | chồi 2 lá trên đỉnh mai, cuống vào mai 15 px | 464,500 |
| `head` | đầu heo hồng tròn (không mắt / miệng / mõm / tai) — **vẽ đủ phần cổ ~40 px phía sau** (khi rụt vào mai cổ trượt dưới mép mai) | 600,720 |
| `ear_far`, `ear_near` | tai hồng cụp mềm | 610,540 · 720,536 |
| `snout` | mõm hồng to | 780,680 |
| `eyes_*` (7: open, half, closed, angry, hurt, dizzy, happy) | 2 mắt | 690,610 |
| `mouth_*` (5: neutral, open, grit, smile, cry) | | 770,752 |
| `tail` (dải) | đuôi xoắn hồng — **được phép vẽ cong sẵn 1 vòng** (dải chỉ lắc nhẹ) | — |
6. **Góc nhìn**: ba phần tư quay phải.
7. **Cấu trúc**: đầu và mai tách rời, đầu nằm trên mai (z cao hơn) nhưng cổ vẽ dài để thụt; 4 chân tách; mép chân kéo vào thân.
8. **Hình ảnh**: da #f6bfb0, mai #6f9e46 → #4c7a31, viền mai #efe6b8, lá #b6e27c → #5f9a34, viền #7a4434; cảm giác **nặng, chắc, hiền**.
9. **Kỹ thuật**: PNG 1024², trong suốt, `asset/rigs/pig_turtle/layers/`, `npm run rig:parts pig_turtle`.
10. **Pose**: đứng 4 chân thấp, đầu thò ra phía trước-phải như ảnh guide.
