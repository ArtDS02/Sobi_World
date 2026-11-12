# Prompt mở phiên mới (dán nguyên khối vào phiên Fable 5.2, thư mục `D:\Local\Sobi_World`)

```
Bạn tiếp quản phần animation / VFX 3D của skill trong Sobi World (Electron + Vite + TypeScript + Phaser, game offline). Trả lời tiếng Việt.

BẮT ĐẦU: đọc theo thứ tự, rồi tóm tắt cho tôi 10 dòng những gì bạn hiểu trước khi sửa bất cứ thứ gì:
1. CLAUDE.md, docs/AGENT_RULES.md, docs/PROGRESS.md (mục "Trạng thái hiện tại" và 5 mục nhật ký đầu).
2. docs/handover/FABLE_VFX3D_HANDOVER.md  ← tài liệu chính, làm đúng kế hoạch và cổng trong đó.
3. docs/animation/SKILL_DESCRIPTION_STANDARD.md, docs/handover/VFX3D_SKILL_INVENTORY.md, docs/animation/SKILL_REVIEW.md.
4. docs/decisions/058-*.md, 059-*.md, 021-*.md, 048-*.md.
5. Code lớp 3D: src/areas/adventure/scene/battle/vfx3d/ (stage3d.ts, effects.ts rồi các file hiệu ứng), fxActs.ts, fxPlayer.ts.

VIỆC: nâng chất lượng animation của skill từ mức hiện tại (chủ dự án chấm ~5–6/10: chưa sinh động, chưa đẹp, chưa đúng mô tả) lên ≥ 7,5/10 THEO CHẤM CỦA CHỦ DỰ ÁN, đúng từng chữ trong mô tả skill (descVi), chạy ≥ 50 FPS trên RTX 3050, không đổi gameplay.

CÁCH LÀM — theo cổng, không nhảy bước:
- P0: chạy `npm run check` và ghi 5 test đỏ đã biết (mục 1 của handover) để không nhầm là do bạn. Chụp baseline 3 skill pilot bằng `npx tsx scripts/animation/shots.ts skill_ult_trident,skill_ult_phoenix,skill_ld_chain`. Hỏi tôi ảnh / clip tham chiếu "đẹp" cho Nước, Lửa, Sét (chỉ học nguyên lý, không sao chép: luật bản quyền decision 048).
- P1: nâng hạ tầng hình ảnh TRƯỚC khi làm skill nào: bloom, bộ shader chung (fbm lửa / khói, nước có bọt, sét phân nhánh, ribbon có vệt), sprite hạt sinh bằng code, cỡ hiệu ứng đủ lớn, nối `quality` và Cường độ hiệu ứng (off / light / full) vào lớp 3D, đo FPS thật. Mô tả đầy đủ ở handover mục 4.
- P2 (CỔNG): viết "hợp đồng nhìn thấy" (khuôn ở SKILL_DESCRIPTION_STANDARD §6) rồi dựng lại ba skill pilot: skill_ult_trident, skill_ult_phoenix, skill_ld_chain. Tự chấm theo thước handover mục 3, đưa tôi chấm. KHÔNG làm skill khác cho tới khi tôi chấm cả ba ≥ 7. Nếu dưới 7: dừng, báo ngắn gọn thiếu gì (kỹ thuật hay hướng nghệ thuật).
- P3 trở đi chỉ làm khi tôi cho phép từng bước, mỗi lần một hệ nguyên tố, và xin tôi chấm trước khi sang hệ khác.
- Skill mới (docs/animation/NEW_SKILLS_PROPOSAL.md) chỉ làm sau khi tôi duyệt; phải viết decision 060 TRƯỚC khi sửa content/.

LUẬT CỨNG:
- Gameplay đóng băng (decision 021): chỉ sửa trình diễn. Không đổi skills.json, số, trạng thái, save nếu chưa có decision 060 và tôi duyệt.
- Không mạng; Three.js đóng gói cùng game. Không dùng asset / tên / thiết kế của bên thứ ba.
- Mỗi file ≤ 300 dòng (npm run guard). Sửa JSON nội dung xong chạy `npm run content:fmt`. Comment code tiếng Anh, file LF.
- Mọi kết luận về hình ảnh phải kèm contact sheet CHỤP SAU lần sửa cuối, phóng to các khung quan trọng ở cỡ đầy đủ; không kết luận từ ảnh thu nhỏ. Nói thẳng điều bạn không kiểm chứng được.
- Trong cây làm việc có hai thay đổi KHÔNG phải của bạn: content/farm/layout.json và tools/admin/battleLab.ts. Đừng revert, đừng đưa vào commit 3D.
- Chưa có gì được commit. KHÔNG commit, KHÔNG push, KHÔNG tạo PR khi tôi chưa yêu cầu. Hỏi tôi trước khi commit phần 3D hiện có.
- Cuối mỗi phiên báo cáo theo mẫu handover mục 11 và cập nhật docs/PROGRESS.md.

Nếu có điều gì trong handover mâu thuẫn với code hoặc với những gì bạn thấy khi chạy, tin code và báo tôi.
```
