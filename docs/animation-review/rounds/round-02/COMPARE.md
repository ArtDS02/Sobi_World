# SO SÁNH TRƯỚC/SAU — Vòng 1 → 2

> TRƯỚC: `20261104-152903-755dce5-f5ba39e3` · SAU: `20261104-161729-755dce5-36236937` · sinh bằng `npm run anim:compare`; sheet BEFORE|AFTER|DIFF ở `docs/animation-review/rounds/round-02/compare/`.
> Điều kiện: cùng `env` (viewport, seed, GPU) ✓. **Giới hạn** (TESTER_NOTES §2): harness đổi giữa hai run (trạng thái nền sạch, case status chụp khác) nên chỉ tin so sánh cho case Dev nhắm tới; khác biệt ở case không bị sửa (4–16%) là nhiễu harness cho tới khi vòng 3 so với run này.

| ID | case | TRƯỚC | SAU | Số đo [Auto] trước → sau | Kết luận |
|---|---|---|---|---|---|
| ANIM-110 | `ult_qs`, `ult_qt`, `ult_mm` | không đứng hình lúc bùng buff | có (sheet `ult_qt`: bùng sao/tim sau cut-in) | `hitStopMs` null → 220 (cả 3) | **fixed** ([Auto] + code; chưa chụp được khung đứng hình vì nằm giữa hai ô lưới) |
| ANIM-111 | `variant.skill_cl_taunt.reduce` | gần như trống | vòng tĩnh dưới người ra đòn | `changedFrames` 1/13 → 4/13 | **fixed** |
| ANIM-111 | `variant.skill_ult_nh.reduce` | trống 4,1 s | vòng tĩnh dưới 3 đồng đội và sói lúc impact; giọt nước | `changedFrames` 1/28 → 8/28 | **fixed** |
| ANIM-112 | 12 `ult.*` | cùng khung cut-in, cùng 500/820 ms | 4 kiểu cut-in (nhìn thấy ở sheet tổng: dải ngang ×2 `tg`, cột dọc `mm`, vòng phủ `nh`/`hk`), nhịp khác nhau | `anticipationMs` {500×12} → {300…700} (11 giá trị); `circleMs` 820×12 → 420…1000 | **partial**: vẫn cùng chân dung; kiểu `ring` phủ phẳng toàn màn hình (xem ANIM-112) |
| ANIM-119 | 25 status `.expire` | 7 debuff không có | có đủ 25/25 | `maxChangeVsStart` expire: 3.8–5.4% (buff, debuff) vs 15–20% (burn, doom) | **có nhưng gần như không thấy** → ANIM-120 |
| ANIM-114 | 7 debuff Down | cùng cấu trúc | hình riêng trong script | — | **chưa đạt**: hình riêng quá nhỏ/tối, bị che bởi đòn thường (sheet `status.atkDown.apply` t=650) |

## Hồi quy
Không thấy hồi quy rõ ràng ở 12 ultimate (cut-in/hit-stop/letterbox còn nguyên); không phát hiện lỗi console (cờ `CONSOLE_ERRORS` = 0). Hồi quy ở case ngoài mục tiêu chưa thể kết luận (nhiễu harness).
