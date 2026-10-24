# 05 — Trúng đòn / thắng / thua

**Runtime:** trúng đòn và gục đã có bằng code (đẩy lùi + loé; gục = xám, mờ, hạ thấp). Khung vẽ chỉ cần cho **biểu cảm** (mặt nhăn khi trúng, vui khi thắng, mệt khi thua) — làm cho chiến binh hay dùng nhất và 3 trùm trước.

| Trường | Ví dụ |
| --- | --- |
| `[REFERENCE_IMAGE]` | ảnh gốc + model sheet |
| `[ENTITY_NAME]` | Heo Hồng Cổ Điển |
| `[ANIMATION_NAME]` | HIT REACTION / VICTORY / DEFEAT (một loại mỗi lần) |
| `[DURATION_OR_FRAME_COUNT]` | 1 key pose mỗi loại |
| `[OUTPUT_FORMAT]` | 1 ô 512×512 PNG |

## Prompt (copy)

> Using the attached [ENTITY_NAME] reference, draw a single [ANIMATION_NAME] key pose that keeps the exact identity, anatomy, proportions, colours, outline and shading. It must read instantly at a small size (about 100 px tall). HIT REACTION: flinching back away from the left, eyes squeezed, no wound, no blood, no damage to the design. VICTORY: a happy, species-appropriate celebration (a little hop, tail up, bright eyes). DEFEAT: tired and dizzy, sitting or lying on its side, eyes as swirls or closed — cosy, never frightening, the character stays recognisable. Facing left, same scale and ground line as the reference. No extra limbs, no text, UI, watermark, background or props. Output [DURATION_OR_FRAME_COUNT] as [OUTPUT_FORMAT].

## Nghiệm thu

Thua phải là "kiệt sức" (decision 039), không gợi chết. Loại nếu có máu, vết thương, nước mắt quá mức, đổi màu.
