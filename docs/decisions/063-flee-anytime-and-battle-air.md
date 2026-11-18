# 063 — Bỏ chạy mọi lượt và không khí trong trận

Ngày: 2026-11-18. Nguồn: chủ dự án.

## Quyết định
1. **Bỏ chạy được ở mọi trận, ở bất kỳ lượt nào của mình.** Trước đây bị khóa với kẻ canh khu, trùm và tầng Khe Nứt.
   - Kẻ canh khu / trùm: chạy như nhóm thường (sát thương giữ nguyên, nhóm vẫn còn, không tính thắng, có thời gian ân hạn).
   - Khe Nứt: chạy = rời Khe Nứt, giữ phần thưởng đã có (như nút về nhà).
   - Chỉ chạy được khi đến lượt đồng đội (`NOT_YOUR_TURN` nếu không). `canFlee` / `fleeOff` còn trong code nhưng không còn dùng ở trận.
2. **Hiệu ứng môi trường trong trận** (`scene/battleAmbient.ts`): lá và phấn hoa ở Rừng, tuyết và bụi ở Núi, đốm sáng bay lên ở Di tích (và Khe Nứt), bong bóng / hơi nước ở Biển. Vẽ bằng texture sinh tại chỗ (không cần art), dưới mọi unit và hiệu ứng; tắt khi giảm chuyển động.

## Hệ quả
- Cân bằng: trùm có thể bị bỏ chạy rồi quay lại; cần chủ dự án chơi thử xem có bị lạm dụng không (hồi máu / MP nhờ chạy?). Sát thương giữ nguyên nên khó lạm dụng.
