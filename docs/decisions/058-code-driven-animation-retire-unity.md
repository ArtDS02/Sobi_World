# 058 — Animation và VFX bằng code Phaser; bỏ Unity Studio, thay decision 051

**Ngày:** 2026-11-11. **Trạng thái:** đã duyệt (chủ dự án 2026-11-11: phương án Unity "quá tệ", chọn animation bằng code Phaser).

## Bối cảnh
Decision 051 dựng Unity làm xưởng tạo asset và animation. Kết quả theo `docs/studio/STATUS.md`: tạo lại toàn bộ asset
không đạt cổng U1; VFX vẽ bằng Unity không đạt; chỉ phần "chuyển động trên tranh đã duyệt" cho 22 / 23 sheet VFX trận
đạt mức vừa. Chi phí giữ Unity (cài đặt, giấy phép, tag git, kiểm máy chậm) lớn hơn lợi ích còn lại. Bộ nghiên cứu
`docs/research/2d-3d-strategy/` khuyến nghị giữ 2D làm đường chính cho 1.0.

## Quyết định
1. **Bỏ Unity khỏi quy trình.** Không dùng Unity cho asset hay animation mới. Hướng "xưởng 3D → render 2D" kết thúc.
2. **Art giữ nguyên:** tranh Gemini đã duyệt, rig pose to pose (decision 050) và 22 sheet VFX đã có chuyển động vẫn nằm
   trong game như hiện nay. Không render lại, không đổi id asset.
3. **Animation và VFX mới làm bằng code trong Phaser**: tween, particle, shader nhẹ, uốn / rung / co giãn, theo kịch bản
   khai báo trong `content/` (ví dụ `content/adventure/battle_fx.json`). Mọi hiệu ứng đi qua GameEvent → FeedbackDirector;
   tôn trọng cài đặt Cường độ hiệu ứng (`off | light | full`) và Giảm chuyển động (decision 057 B8).
4. **Ưu tiên đầu tiên:** rà từng skill (112 skill trận, rồi skill Area khác) và đối chiếu mô tả với kịch bản hiện có, sửa
   chỗ kịch bản chưa khớp mô tả. Làm theo nhóm, mỗi nhóm có bảng "skill → mô tả → hiệu ứng" để chủ dự án duyệt trước khi
   nhập. Mô tả mơ hồ thì ghi giả định, hỏi chủ dự án.
5. **Không làm 3D**, kể cả nhánh thử A+ trong nghiên cứu. Chỉ mở lại khi chủ dự án có quyết định riêng.
6. Giữ nguyên: bản quyền (048), gameplay freeze (021), save, `npm run check`, quy tắc `core` thuần.

## Thay thế
- Decision 051 và `docs/UNITY_STUDIO_PLAN.md`: **không còn hiệu lực** (giữ làm lịch sử).
- Phần "chủ dự án chờ chọn phương án hẹp" của 051 được đóng bằng quyết định này.

## Việc dọn dẹp (chưa làm, cần phiên riêng)
- `studio/`, `scripts/studio/`, `tests/scripts/studio.test.ts` còn trong git. Test này hỏng khi thiếu tag `pre-unity-studio`
  (2 test). Khi dọn, phải giữ nguồn của 22 sheet VFX đã nhập (tag `pre-unity-studio` dùng làm nguồn tranh gốc) và cập nhật
  `docs/THIRD_PARTY.md` (dòng Unity). Đề xuất: lưu `studio/` vào một tag rồi xoá khỏi nhánh, sau khi chủ dự án đồng ý.
- Đồng thời cần chủ dự án trả lời các câu còn mở của `docs/research/2d-3d-strategy/00_EXECUTIVE_SUMMARY.md` (phép thử P-1,
  thương mại ở EU / UK / Hàn Quốc, `THIRD_PARTY.md` thiếu dòng Gemini).

## Quay lại
Hướng Unity ở nhánh `phase-14-unity-studio` và tài liệu 051; không cần tag mới.
