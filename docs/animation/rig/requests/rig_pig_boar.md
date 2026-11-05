# Yêu cầu art: rig `pig_boar` — Heo Rừng (quadruped nhanh nhẹn, hiếu chiến)

Quy chuẩn chung: `rig_README.md`. Bố cục + khớp: `rig_pig_boar_guide.png`. Tham chiếu nhận diện: `public/assets/props/combat/cb_pig_boar_idle.png`, `pigs/base/pig_boar.png`.

1. **Đối tượng**: Heo Rừng (chiến binh Adventure, art id `pig_boar`).
2. **Mục đích**: puppet trận — idle (+ 3 fidget: đánh hơi, cào đất, giũ mình), di chuyển (phi), đánh thường (húc nanh), cast (giậm chân, ngửa cổ gầm), bị đánh nhẹ / nặng, KO, thắng (nhảy vẫy đuôi), thủ, choáng, buff, né. Clip đã có trong `content/anim/rigs/pig_boar.json`.
3. **Lý do**: key pose hiện tại là ảnh phẳng, không tách được chân / đầu / tai; 6 pose lệch tỉ lệ → chỉ tween cả ảnh (xem `docs/animation/rig/AUDIT.md`).
4. **Phương pháp**: cutout puppet (bộ phận cứng trên xương) + lò xo (tai, bờm, đầu) + dải uốn (đuôi) + đổi ảnh mặt.
5. **Danh sách layer** (tên file = tên layer):
| Layer | Mô tả | Khớp (canvas 1024, xấp xỉ) |
|---|---|---|
| `leg_bl`, `leg_fl` | chân sau xa / chân trước xa — tối hơn 15 %, có móng | hông 264,792 · 632,792 |
| `body` | thân hình trứng, bụng sáng, đốm lông nhạt; **vẽ đủ phần dưới đầu và bờm** | 440,760 |
| `leg_br`, `leg_fr` | chân sau gần / chân trước gần, có móng | 316,800 · 572,800 |
| `head` | đầu tròn to (không mắt, không miệng, không mõm, không tai), má hồng | cổ 580,670 |
| `mane` | chùm bờm gai dọc gáy, nằm sau đầu | 570,450 |
| `ear_far`, `ear_near` | tai xa (sau đầu) / tai gần (trước), lòng tai hồng | 554,448 · 708,432 |
| `snout` | mõm hồng + 2 lỗ mũi + **2 nanh** cong lên | 776,596 |
| `eyes_open`, `eyes_half`, `eyes_closed`, `eyes_angry` (mày chau), `eyes_hurt` (>< + giọt nước mắt), `eyes_dizzy` (xoắn ốc), `eyes_happy` (^^) | **2 mắt** (ba phần tư), cùng vị trí | 660,516 |
| `mouth_neutral`, `mouth_open` (há, lưỡi), `mouth_grit` (nghiến răng), `mouth_smile`, `mouth_cry` (miệng run) | dưới mõm | 752,672 |
| `tail` (dải) | đuôi mảnh có túm lông ở ngọn, duỗi ngang, gốc bên trái, ~180 × 64 px | — |
6. **Góc nhìn**: ba phần tư quay phải (như `cb_pig_boar_idle`).
7. **Cấu trúc**: như bảng; mép trên mỗi chân kéo vào thân 20 px; gốc tai / bờm kéo vào đầu 15 px; thân vẽ đủ dưới đầu.
8. **Hình ảnh**: lông nâu ấm (#8a5a3a → #6e452c), bụng #c49870, đốm #c9a07a, mõm hồng #e39a90, nanh kem #f4ead2, viền #4a2b1b; giữ dáng chibi đầu to như ảnh hiện có.
9. **Kỹ thuật**: PNG 1024², nền trong suốt, sRGB, `asset/rigs/pig_boar/layers/<layer>.png`, rồi `npm run rig:parts pig_boar`.
10. **Pose**: tư thế nghỉ đứng 4 chân thẳng, đầu thẳng nhìn phải (ảnh guide là đúng tư thế này).
