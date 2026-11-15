# Prompt mở phiên mới (dán nguyên khối vào phiên Fable 5.2, thư mục `D:\Local\Sobi_World`)

```
Bạn tiếp quản phần animation / VFX 3D của skill trong Sobi World (Electron + Vite + TypeScript + Phaser, game offline). Trả lời tiếng Việt.

BẮT ĐẦU: đọc theo thứ tự, rồi tóm tắt cho tôi 10 dòng những gì bạn hiểu trước khi sửa bất cứ thứ gì:
1. CLAUDE.md, docs/AGENT_RULES.md, docs/PROGRESS.md (mục "Trạng thái hiện tại" và 5 mục nhật ký đầu).
2. docs/handover/FABLE_VFX3D_HANDOVER.md  ← tài liệu chính, làm đúng kế hoạch và cổng trong đó.
3. docs/animation/SKILL_DESCRIPTION_STANDARD.md, docs/handover/VFX3D_SKILL_INVENTORY.md, docs/animation/SKILL_REVIEW.md.
4. docs/decisions/058-*.md, 059-*.md, 021-*.md, 048-*.md.
5. Code lớp 3D: src/areas/adventure/scene/battle/vfx3d/ (stage3d.ts, effects.ts rồi các file hiệu ứng), fxActs.ts, fxPlayer.ts.

QUYỀN TỰ QUYẾT (chủ dự án cho phép, 2026-11-12): bạn TỰ QUYẾT mọi thứ (hướng nghệ thuật, thứ tự hệ, kỹ thuật, chất lượng thấp, cách chia việc) và làm MỘT MẠCH tới cuối, không dừng hỏi. Các "cổng chủ dự án chấm" bên dưới đổi thành cổng TỰ CHẤM: tự chấm bằng thước handover mục 3 kèm contact sheet chụp sau lần sửa cuối; dưới 7 thì tự sửa lại và chụp lại cho tới khi đạt, rồi đi tiếp. Ghi điểm tự chấm vào docs/animation/vfx3d/SCORES.md (cột riêng "tự chấm"), chủ dự án chấm lại sau. Chỉ dừng và báo khi gặp: (a) việc bắt buộc đụng gameplay ngoài 22 skill đã duyệt, (b) nghi vấn bản quyền, (c) thứ cần chủ dự án làm tay (ví dụ đo FPS trên máy khác), (d) nguy cơ mất dữ liệu / save. Được commit cục bộ theo từng hệ nguyên tố (thông điệp rõ, `npm run check` xanh trừ 5 test đỏ cũ); vẫn KHÔNG push, KHÔNG tạo PR. Các luật cứng bên dưới vẫn giữ nguyên.

MỤC TIÊU CUỐI: cải thiện TẤT CẢ animation skill (toàn bộ 112 skill hiện có + 22 skill mới sau khi duyệt), không bỏ sót skill nào. Ba skill pilot chỉ là thứ tự bắt đầu để qua cổng chất lượng, KHÔNG phải phạm vi của việc. Phiên chỉ kết thúc khi mọi skill đã được dựng lại và chủ dự án chấm từng hệ.

VIỆC: nâng chất lượng animation của skill từ mức hiện tại (chủ dự án chấm ~5–6/10: chưa sinh động, chưa đẹp, chưa đúng mô tả) lên ≥ 7,5/10 THEO CHẤM CỦA CHỦ DỰ ÁN, đúng từng chữ trong mô tả skill (descVi), chạy ≥ 50 FPS trên RTX 3050, không đổi gameplay.

CÁCH LÀM — theo cổng, không nhảy bước:
- P0: chạy `npm run check` và ghi 5 test đỏ đã biết (mục 1 của handover) để không nhầm là do bạn. Chụp baseline 3 skill pilot bằng `npx tsx scripts/animation/shots.ts skill_ult_trident,skill_ult_phoenix,skill_ld_chain`. Chủ dự án KHÔNG có ảnh / clip tham chiếu và không có ý định đưa: đừng hỏi lại. Tự thiết kế hướng nghệ thuật gốc (decision 048), chủ dự án chấm sau.
- P1: nâng hạ tầng hình ảnh TRƯỚC khi làm skill nào: bloom, bộ shader chung (fbm lửa / khói, nước có bọt, sét phân nhánh, ribbon có vệt), sprite hạt sinh bằng code, cỡ hiệu ứng đủ lớn, nối `quality` và Cường độ hiệu ứng (off / light / full) vào lớp 3D, đo FPS thật. Mô tả đầy đủ ở handover mục 4.
- P2 (CỔNG TỰ CHẤM, xem mục QUYỀN TỰ QUYẾT; các chỗ "đưa tôi chấm / xin tôi chấm" bên dưới nghĩa là tự chấm rồi đi tiếp): viết "hợp đồng nhìn thấy" (khuôn ở SKILL_DESCRIPTION_STANDARD §6) rồi dựng lại ba skill pilot: skill_ult_trident, skill_ult_phoenix, skill_ld_chain. Tự chấm theo thước handover mục 3, đưa tôi chấm. Chỉ hoãn các skill còn lại (không bỏ) cho tới khi tôi chấm cả ba ≥ 7, sau đó làm hết. Nếu dưới 7: dừng, báo ngắn gọn thiếu gì (kỹ thuật hay hướng nghệ thuật).
- P3: làm TẤT CẢ các nguyên tố (chủ dự án đã đồng ý phạm vi này), mỗi lần một hệ, và xin tôi chấm trước khi sang hệ khác. Thứ tự do bạn đề xuất.
- Skill mới (docs/animation/NEW_SKILLS_PROPOSAL.md): chủ dự án ĐÃ DUYỆT cả 22 skill (2026-11-12). Làm ở P4, sau P2/P3; viết decision 060 TRƯỚC khi sửa content/.
- Chất lượng thấp / thấp cấu hình: bạn tự quyết, nên có chế độ thấp nối vào Cường độ hiệu ứng (off / light / full).

PHẢN HỒI CỦA CHỦ DỰ ÁN (2026-11-12, xem docs/animation/vfx3d/SCORES.md):
- skill_ult_trident: ~7/10, phần tốt nhất phiên trước. Vẫn cần làm sinh động hơn; sau khi cải thiện mới dùng làm chuẩn cho các skill khác.
- skill_ult_phoenix: con phượng hoàng còn xấu, thiếu điểm nhấn, hơi mờ nhạt.
- Tất cả skill hệ Sét: thiếu mạnh mẽ khi sét đánh; hiệu ứng sét và mây quá mờ nhạt, thiếu sinh động. (skill_ld_chain chủ dự án chưa tìm thấy để chấm; hãy chỉ cho họ cách mở trong Battle Lab.)
- Yêu cầu chung: animation thật đẹp và sinh động cho TẤT CẢ skill.

LUẬT CỨNG:
- Gameplay đóng băng (decision 021): chỉ sửa trình diễn. Không đổi skills.json, số, trạng thái, save nếu chưa có decision 060 và tôi duyệt.
- Không mạng; Three.js đóng gói cùng game. Không dùng asset / tên / thiết kế của bên thứ ba.
- Mỗi file ≤ 300 dòng (npm run guard). Sửa JSON nội dung xong chạy `npm run content:fmt`. Comment code tiếng Anh, file LF.
- Mọi kết luận về hình ảnh phải kèm contact sheet CHỤP SAU lần sửa cuối, phóng to các khung quan trọng ở cỡ đầy đủ; không kết luận từ ảnh thu nhỏ. Nói thẳng điều bạn không kiểm chứng được.
- Trong cây làm việc có hai thay đổi KHÔNG phải của bạn: content/farm/layout.json và tools/admin/battleLab.ts. Đừng revert, đừng đưa vào commit 3D.
- Phần 3D prototype và handover đã được commit (07212701, 305ab519). Được commit cục bộ theo mục QUYỀN TỰ QUYẾT; KHÔNG push, KHÔNG tạo PR khi tôi chưa yêu cầu. Không đưa content/farm/layout.json và tools/admin/battleLab.ts vào commit 3D.
- Cuối mỗi phiên báo cáo theo mẫu handover mục 11 và cập nhật docs/PROGRESS.md.

Nếu có điều gì trong handover mâu thuẫn với code hoặc với những gì bạn thấy khi chạy, tin code và báo tôi.
```
