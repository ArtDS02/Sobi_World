# 03 — Attack (key pose tấn công)

**Runtime:** code đã có cú lao (`adventure-pose-attack`: lùi 0,7rem → lao `--lunge` → hồi). Ảnh key pose sẽ **thay ảnh tĩnh trong lúc lao** (integration spec §5.3). Vì vậy chỉ cần 2 khung: **anticipation** và **contact**.

| Trường | Ví dụ |
| --- | --- |
| `[REFERENCE_IMAGE]` | `props/enemy_forest_wolf.png` + model sheet |
| `[ENTITY_NAME]` | Sói Đêm |
| `[ENTITY_TYPE / BODY_PLAN]` | quadruped |
| `[ANIMATION_NAME]` | attack |
| `[ACTION_DESCRIPTION]` | nhe nanh, chồm tới cắn (kỹ năng `skill_e_shadow_bite`) |
| `[DURATION_OR_FRAME_COUNT]` | 2 key pose |
| `[DIRECTION]` | nhìn và lao sang trái |
| `[OUTPUT_FORMAT]` | 2 ô 512×512 ngang |
| `[ENGINE_OR_RUNTIME_CONSTRAINTS]` | chân sau giữ đường đất 82%; khung contact không vượt mép ô |

## Prompt (copy)

> Create two game key poses for [ENTITY_NAME] using the attached reference as the strict identity reference: same design, silhouette, proportions, markings, colours and art style (thin warm-brown outline, soft cel shading, light from top-left). Action: [ACTION_DESCRIPTION]. Cell 1 = ANTICIPATION: weight pulled back, body compressed, eyes on the target. Cell 2 = CONTACT / IMPACT: body stretched forward at full reach toward [DIRECTION], the clearest and most readable pose of the attack. Each pose in its own equal square cell with margin; same scale and same ground line in both cells. Camera fixed. Do not invent body parts or weapons, no motion blur, no speed lines, no effects, no text, no UI, no watermark, no background. Output [DURATION_OR_FRAME_COUNT] as [OUTPUT_FORMAT]. Constraints: [ENGINE_OR_RUNTIME_CONSTRAINTS]. If a clean pose is not possible, return the closest pose rather than a distorted one.

## Nghiệm thu

Khung contact đọc được ở 6rem (≈ 96 px): thấy rõ hướng đòn. Loại nếu thêm vũ khí, chân thứ năm, nanh khác ảnh gốc, có vệt tốc độ (VFX do code vẽ riêng).
