# 08 — Dọn sheet và xuất cho game

**Dùng sau** khi có ảnh từ prompt 01–07. Bước cắt / làm sạch chính do agent làm bằng skill `image-to-prompt` (cắt sheet) / `image-to-asset` (QA phong cách) và `npm run art:process`. Prompt dưới dùng khi cần nhờ AI sửa một sheet lỗi.

| Trường | Ví dụ |
| --- | --- |
| `[ENTITY_NAME / SKILL_NAME]` | VFX 9 hệ |
| `[GRID_LAYOUT]` | 9 × 2, ô 256 |
| `[TARGET_DIMENSIONS]` | 256×256 mỗi ô |
| `[FILE_FORMAT]` | PNG RGBA |
| `[COLOR/ALPHA REQUIREMENTS]` | nền trong suốt, không viền trắng, không bóng nền |

## Prompt (copy)

> Prepare the supplied frames of [ENTITY_NAME / SKILL_NAME] for a 2D game. Do not redesign or reinterpret the art. Keep a consistent canvas size, alignment, scale, pivot (centre for effects, bottom-centre for characters), lighting and silhouette, and keep the frame order. Remove leftover background only where it is safe; keep intended glow. No part may be clipped and no frames may overlap. Arrange as [GRID_LAYOUT] with [TARGET_DIMENSIONS] cells, [FILE_FORMAT], [COLOR/ALPHA REQUIREMENTS]. List any frame that needs manual repair and why. Never claim perfect alpha, seamless looping or production readiness without checking.

## Checklist xuất (agent)

1. Cắt theo lưới, kiểm từng ô (không dính ô bên, không mất mép).
2. Alpha: nền về 0, viền không còn quầng trắng (xem trên nền tối và sáng).
3. Pivot: VFX giữa ô; nhân vật giữa đáy, chân 82%.
4. Lưu `public/assets/fx/<id>.png`, thêm dòng manifest nhóm `fx` (`status: production`; sheet thì thêm `frames`).
5. `npm run assets:check`, chạy script chụp, cập nhật `animation_inventory.csv` + `docs/ASSET_TODO.md`.
