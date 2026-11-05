# HIỆU CHUẨN NEO — vòng 1 (rubric §10.5)

> round 1 · runId `20261104-152903-755dce5-f5ba39e3` · 2026-11-04 · TD
> Các neo này giữ nguyên ở các vòng sau; đổi neo phải ghi lý do. Chủ dự án chỉ cần sửa nếu thấy mức điểm sai.

| Neo | Đơn vị | Điểm tiêu chí | Lý do (bằng chứng) |
|---|---|---|---|
| **Thấp (1–2)** | `battle.variant.skill_cl_taunt.reduce` | C1 = 1, C3 = 1 | Sheet `.../sheets/battle.variant.skill_cl_taunt.reduce.png`: từ `t=0` đến `impact` (t=1160 ms) không có gì đổi trên sân, không vòng phép, không chuyển động của người ra đòn; chỉ sau `impact+80` mới có hai huy hiệu nhỏ. 1/13 khung đổi pixel ([Auto] `changedFrames`). Người chơi không biết ai ra đòn, lên ai. |
| **Giữa (3)** | `battle.status.stun.apply` | C1 = 3, C4 = 3 | `.../sheets/battle.status.stun.apply.png` ô `t=1400`–`1520`: có tia chớp + sao vàng trên đầu sói và vụ nổ đá, hiểu được "bị choáng" nhưng phải để ý; hình khối đá/sao dùng chung cho mọi skill đất nên thiếu dấu ấn riêng của choáng. |
| **Tốt (4)** | `battle.ult.skill_ult_nh` | C1 = 4, C3 = 4, C4 = 4 | `.../sheets/battle.ult.skill_ult_nh.png`: cut-in, cá voi, sóng tự cuộn có bọt (`t=2104`–`2320`), letterbox vào/ra, cầu vồng ở `end`; đọc ngay là nước, ai làm gì lên ai. Chưa 5 vì wind-up dài (500 ms) và cut-in dùng chung khung với các ultimate khác. |
| **Xuất sắc (5)** | (chưa có) | — | Chưa có animation nào trong mẫu đã xem đạt C-nào = 5; neo này sẽ chọn khi gặp. |

Ghi chú phương pháp: điểm theo rubric §3 (trọng số nhóm), số nguyên 0–5; khi nghi giữa hai mức chọn mức thấp.
