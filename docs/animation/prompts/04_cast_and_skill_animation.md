# 04 — Cast / kỹ năng (key pose thi triển)

**Runtime:** `adventure-pose-cast` (nâng người, sáng lên ~35%, đẩy tới ~50%). Key pose thay ảnh tĩnh trong lúc thi triển; **VFX là asset riêng** (prompt 06), không vẽ năng lượng vào nhân vật trừ phần dính trên thân.

| Trường | Ví dụ (vertical slice) |
| --- | --- |
| `[REFERENCE_IMAGE]` | ảnh heo của Cu Ủn + model sheet |
| `[ENTITY_NAME]` | Cu Ủn — heo dòng Mộc Mẫu |
| `[SKILL_NAME]` | Gai Độc (`skill_mm_poison_thorn`) |
| `[ELEMENT_OR_SKILL_THEME]` | Thiên nhiên — gai độc, lá |
| `[SKILL_EFFECT]` | bắn một chiếc gai vào một kẻ địch, dễ làm nó Trúng độc |
| `[DURATION_OR_FRAME_COUNT]` | 2 key pose (gồng / bắn) |
| `[OUTPUT_FORMAT]` | 2 ô 512×512 |
| `[ENGINE_OR_RUNTIME_CONSTRAINTS]` | nhìn sang trái; nền trong suốt; năng lượng chỉ là vầng sáng nhỏ quanh mõm / lưng |

## Prompt (copy)

> Draw [ENTITY_NAME] casting [SKILL_NAME] ([ELEMENT_OR_SKILL_THEME]), visually identical to the attached reference (same anatomy, markings, colours, outline and shading). Two key poses in equal square cells: (1) GATHER — the body lifts slightly and tenses, a small soft glow of [ELEMENT_OR_SKILL_THEME] energy gathers close to the body; (2) RELEASE — the body leans forward toward the left as the power is let go; the glow is just leaving the body. The effect itself ([SKILL_EFFECT]) is NOT drawn — it is a separate asset. Gentle, natural Sobi Essence energy: warm, round particles. Do not use dark purple corruption colours. The face and silhouette stay readable. Camera fixed, same scale and ground line. No text, UI, watermark, background, props or extra effects. Output [DURATION_OR_FRAME_COUNT] as [OUTPUT_FORMAT]. Constraints: [ENGINE_OR_RUNTIME_CONSTRAINTS].
