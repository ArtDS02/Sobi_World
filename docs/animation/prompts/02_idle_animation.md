# 02 — Idle (nghỉ, thở)

**Lưu ý:** idle **đã có bằng code** cho mọi chiến binh và quái (CSS theo body plan). Chỉ làm khung vẽ khi muốn thêm chi tiết code không làm được: **chớp mắt**, tai / vây / râu lay. Ưu tiên: 3 trùm (`enemy_old_treant`, `enemy_magma_drake`, `enemy_ancient_guardian`).

| Trường | Ví dụ |
| --- | --- |
| `[REFERENCE_IMAGE]` | `props/enemy_magma_drake.png` + model sheet (prompt 01) |
| `[ENTITY_NAME]` | Rồng Dung Nham |
| `[ENTITY_TYPE / BODY_PLAN]` | heavy (to, chậm) |
| `[ANIMATION_NAME]` | idle_blink |
| `[DURATION_OR_FRAME_COUNT]` | 4 khung (mở mắt, khép nửa, nhắm, khép nửa) |
| `[DIRECTION]` | nhìn sang trái |
| `[OUTPUT_FORMAT]` | sheet ngang 4 ô 512×512 |
| `[ENGINE_OR_RUNTIME_CONSTRAINTS]` | nền trong suốt; mọi ô cùng vị trí thân, chỉ mắt / tai đổi |

## Prompt (copy)

> Use the attached reference as the exact identity of [ENTITY_NAME] ([ENTITY_TYPE / BODY_PLAN]). Create [DURATION_OR_FRAME_COUNT] frames of a seamless idle loop called [ANIMATION_NAME], laid out left to right in equal square cells. The body, outline, colours and position stay IDENTICAL in every frame; only small secondary parts move: natural blinking and the gentle motion that suits its anatomy (ears, fins, whiskers, tail tip, wings) — nothing else. Frame 1 and the last frame must connect smoothly. Facing [DIRECTION]. Same scale, same ground line, same lighting (top-left) in every cell. Transparent background if supported, otherwise flat white. No walking, no camera move, no new props, no text, no watermark, no background, no anatomy change, no extra or missing limbs, no style drift. Output: [OUTPUT_FORMAT]. Constraints: [ENGINE_OR_RUNTIME_CONSTRAINTS]. If the frames cannot be kept consistent, give the open-eye and closed-eye key poses only.

## Nghiệm thu

Đặt hai khung chồng nhau 50% opacity: chỉ mắt / phần phụ khác nhau. Loại nếu viền dao động, thân lệch > 2 px, màu đổi.
