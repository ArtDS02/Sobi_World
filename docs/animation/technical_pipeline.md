# Technical pipeline — từ ảnh nguồn tới runtime

Runtime thực tế: trận Adventure là **DOM + CSS keyframes** (không phải Phaser). Ảnh VFX hiển thị bằng `<img>` qua manifest; tween do CSS. Vì vậy thông số dưới đây là **đề xuất có lý do**, không phải ràng buộc engine.

| Bước | Việc | Công cụ / file | Kiểm tra |
| --- | --- | --- | --- |
| 1 | Chọn entity / skill, xác nhận ảnh nguồn | `animation_inventory.csv` (cột `priority`, `status`), ảnh trong `public/assets/` | id có thật trong `content/adventure/*.json` |
| 2 | Viết brief + prompt | `examples/sample_animation_spec.md` (mẫu), `prompts/0x_*.md` | đủ trường `[...]` |
| 3 | Sinh key pose / frame / VFX | Gemini web (chủ dự án, như decision 022), đính kèm ảnh gốc | — |
| 4 | Cleanup, crop, canvas | `npm run art:process` / skill `image-to-asset`, `image-to-prompt` (cắt sheet) | nền trong suốt sạch, không viền trắng |
| 5 | Pivot, silhouette | so ảnh gốc 1:1 (style guide §1, §5) | chân cùng đường đất; hình nhận ra ở 6rem |
| 6 | Xuất | PNG RGBA. VFX đơn: 256×256. Sheet impact: ngang, 6 khung 192×192 (manifest `frames`). | `npm run assets:check` |
| 7 | Manifest | thêm dòng vào `public/assets/manifest/assets.json` (nhóm `fx`, `status: production`), id đúng quy ước §Naming | không cần sửa code |
| 8 | Controller | tự động: `vfxArt()` dùng ảnh khi id có trong manifest | — |
| 9 | Preview | `npm run dev:sandbox` hoặc sandbox `sandbox-anim`; vào Vết Nứt, dùng kỹ năng | ảnh xuất hiện thay hình CSS |
| 10 | Chụp bằng chứng | `npx tsx scripts/capture/adventureShots.ts --tag <tên>` | xem `09_motion_slice/` |
| 11 | QA + ghi lại | `qa_checklist.md`, cập nhật cột `status` / `qa_status` của inventory, `docs/ASSET_TODO.md` | `npm run check` xanh |

## Naming (id → file)

| Loại | id manifest | File (đề xuất) |
| --- | --- | --- |
| VFX hệ | `fx_adv_<hệ>_projectile`, `fx_adv_<hệ>_impact` (hệ viết thường: `fire`, `water`…) | `fx/fx_adv_<hệ>_<phase>.png` |
| VFX kỹ năng riêng | `fx_<skillId>_projectile`, `fx_<skillId>_impact` (khai báo `art` trong `SKILL_MOTION`) | `fx/fx_<skillId>_<phase>.png` |
| Overlay Umbraflux | `fx_umbraflux_aura` | `fx/fx_umbraflux_aura.png` (sheet) |
| Key pose (sau) | `<artId>_attack`, `<artId>_cast`, `<artId>_hit` | cùng thư mục ảnh gốc |

## FPS, thời lượng, nén

- Thời lượng do **code** quyết định (`TIMING` trong `motionProfiles.ts`): melee 620 ms (impact 330), projectile 760 ms (impact 520), burst 720, aura 640, slam 680, Tuyệt kỹ 1000; x2 = ×0,55; cả bước ≤ 3,2 s.
- Ảnh VFX đơn được tween (bay / phóng to / mờ) → không cần nhiều khung. Sheet impact (khi cần hình biến đổi) 6 khung ≈ 12 fps cho 460 ms.
- PNG; giữ mỗi VFX ≤ 60 KB. Không dùng GIF / WebP động (manifest chỉ nhận png / ogg / mp3 / json).

## Giới hạn hiện tại

Hiển thị `<img>` một khung cho VFX; **sheet nhiều khung cho VFX DOM chưa được nối** (manifest đã có `frames`, cần thêm lớp `steps()` trong `battleMotionView.ts` khi có sheet đầu tiên). Key pose nhân vật (attack / cast) cũng chưa nối — thứ tự đề xuất trong `integration_spec.md` §5.
