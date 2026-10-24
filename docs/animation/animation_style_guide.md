# Animation style guide — Sobi Adventure

Áp dụng cho mọi animation / VFX trận Adventure, dù làm bằng code hay ảnh AI. Phong cách gốc: Sobi Farm (`asset/GAME_ART_DIRECTION.md`, `asset/ASSET_PRODUCTION_STANDARD_v1.md`). Mâu thuẫn thì hai tài liệu đó thắng.

## 1. Giữ nhận diện

- Ảnh gốc là chuẩn: **đúng** số chân / vây / sừng, đốm, màu, phụ kiện, tỷ lệ đầu–thân. Mỗi khung so lại ảnh gốc.
- Hướng nhìn: ảnh nguồn **nhìn sang trái** (quái đứng bên phải). Phe ta được game lật ngang bằng CSS — **không** vẽ bản nhìn phải.
- Đường viền nâu ấm mảnh, tô phẳng + bóng mềm, sáng từ trên-trái, không có vật / nền / chữ.
- Kích thước khung không đổi giữa các frame; chân chạm cùng một đường đất (82% chiều cao khung, như chuẩn heo) để tween và căn chân đúng.

## 2. Quy tắc theo loại

| Loại | Quy tắc |
| --- | --- |
| Idle | Nhỏ, đọc được, không rời chỗ: thở (co giãn ≤ 3%), chớp mắt, tai / đuôi / vây lay nhẹ. Khung đầu = khung cuối. Mỗi con lệch pha (code đã làm). |
| Attack | Lấy đà (lùi, nén) → lao / vung (khung impact rõ nhất) → hồi. Impact ở ~50% thời lượng. |
| Cast | Gồng / nâng người, năng lượng tụ ở thân hoặc phụ kiện, phóng ra ở ~35%. Mặt và silhouette không bị che quá 1 khung. |
| Support | Nhún nhẹ, ánh sáng ấm hướng lên. Không dùng màu hệ Bóng tối / Umbraflux. |
| Hit / hit mạnh | Bị đẩy **ngược hướng đòn**, loé sáng 1 khung; không vết thương vĩnh viễn, không đổi thiết kế. |
| Victory / defeat | Victory: vui theo loài (heo nhảy, cá quẫy). Defeat: mệt, ngồi phịch / nằm nghiêng, vẫn nhận ra; không gợi chết (game cozy, decision 002 + 039: thua là kiệt sức). |
| VFX | Nhịp **wind-up → release / travel → impact → fade**. Không che thanh máu, chân dung, số bay quá 1 khung; không loé toàn màn; không nhấp nháy liên tục. |

## 3. Ngôn ngữ hình của 9 hệ (khác **hình**, không chỉ khác màu)

| Hệ | Hình chủ đạo | Chuyển động | Màu (CSS dự phòng) |
| --- | --- | --- | --- |
| Lửa | tàn lửa giọt nước ngược, lưỡi lửa | bốc lên, nổ tung tóe | #ff8a3a / #ffd36a |
| Nước | bong bóng tròn có điểm sáng, vòng sóng | bay vồng, vỡ thành vòng | #5cc6ff / #d8f4ff |
| Thiên nhiên | lá, gai, cánh hoa | xoáy nhẹ, cắm vào, rơi lả tả | #62c25a / #d6ffa8 |
| Đất | đá góc cạnh, bụi | rơi nặng, vòng bụi trên đất | #b08350 / #f2d7a6 |
| Kim loại | lưỡi sáng mảnh, tia loé chữ thập | chém thẳng, loé | #c9d3e0 / #fff |
| Sấm | tia zigzag | giật, loé ngắn | #ffe14a / #fffbd0 |
| Bóng tối | mực loang, khói tròn | lan chậm, co lại | #5a3d8a / #c9a8ff |
| Ánh sáng | sao 4 cánh, tia | toả ra, lấp lánh | #fff2a8 / #fff |
| Hư Không | vòng rỗng méo | xoáy vào trong | #8c7cff / #e4dcff |

Bảng này nằm trong code tại `ELEMENT_LOOK` (`src/areas/adventure/ui/motionProfiles.ts`): đổi ở đó, không đổi rải rác.

## 4. Lumina / Sobi Essence và Umbraflux

Chỉ dùng điều đã có trong lore (`docs/lore/`, spec V2): Umbraflux là năng lượng xâm nhiễm làm sinh vật mất kiểm soát; Sobi Essence / Lumina là năng lượng tự nhiên, ấm. Quy ước **hình ảnh** (đề xuất, chưa phải canon): Essence = sáng ấm, hạt tròn, bay lên; Umbraflux = tím than + viền hồng, vệt chảy xuống, rìa răng cưa nhỏ, mắt phát sáng nhạt. Corruption là **lớp phủ** (overlay) tách khỏi nhân vật — silhouette giữ nguyên. Ký hiệu / chữ rune mới: **không tự thêm**.

## 5. Tách lớp, pivot, canvas

- Chiến binh / quái: một ảnh nhân vật + VFX riêng. Nếu sau này có key pose: cùng canvas, cùng đường chân (pivot = giữa đáy).
- VFX: canvas vuông, tâm hiệu ứng ở giữa (pivot giữa), nền trong suốt. Projectile hướng **sang phải** (code tự xoay khi bay sang trái).
- Vùng an toàn: VFX impact ≤ 1,2× chiều rộng mục tiêu; không vượt lên thanh máu trên đầu.

## 6. Lỗi cấm

Thêm / bớt chi; đổi đốm, màu nhận diện; méo mặt; đổi tỷ lệ giữa frame; camera zoom; nền / bóng đổ không mong muốn; viền nhấp nháy giữa frame; motion blur làm khó đọc; VFX che mục tiêu / thanh máu; chữ, watermark, khung, UI trong ảnh.
