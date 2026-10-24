# 01 — Khoá nhận diện nhân vật (làm trước mọi animation)

**Dùng khi:** bắt đầu một chiến binh / quái chưa từng có key pose. Kết quả là "model sheet" để đính kèm cho mọi prompt sau.
**Công cụ:** Gemini web (như decision 022). Đính kèm `[REFERENCE_IMAGE]` = file trong `public/assets/` (vd. `props/enemy_mossling.png`, ảnh heo `pigs/base/<giống>.png`).

## Trường cần thay

| Trường | Ví dụ |
| --- | --- |
| `[REFERENCE_IMAGE]` | ảnh của chính con heo (`artId` trong roster, vd. `pigs/base/pig_classic.png`) |
| `[ENTITY_NAME]` | Cu Ủn — heo dòng Mộc Mẫu |
| `[ENTITY_TYPE / BODY_PLAN]` | quadruped (heo bốn chân) |
| `[OUTPUT_FORMAT]` | 1 ảnh PNG 1536×512, 3 ô ngang 512×512 |
| `[ENGINE_OR_RUNTIME_CONSTRAINTS]` | nền trong suốt; nhìn sang trái; chân trên đường 82% chiều cao ô |

## Prompt (copy)

> Use the attached image as the exact identity reference for [ENTITY_NAME], a [ENTITY_TYPE / BODY_PLAN] character from a cozy 2D farm-adventure game. Produce a clean model sheet of the SAME character in three poses side by side, each in its own equal square cell with generous empty margin: (1) the reference pose, unchanged; (2) a slight crouch, weight shifted back, ready to move; (3) a neutral standing pose seen from the same three-quarter side angle. Keep exactly the same anatomy, number of legs, ears, tail, markings, colours, proportions, line weight (thin warm-brown outline), soft cel shading and light from the top-left. Facing left in every cell. Feet on the same ground line in every cell (about 82% of the cell height). Transparent background if supported, otherwise plain flat white. No text, no labels, no grid lines, no watermark, no props, no ground, no shadow puddle, no extra characters. Output: [OUTPUT_FORMAT]. Constraints: [ENGINE_OR_RUNTIME_CONSTRAINTS].

## Nghiệm thu

- Ba ô đúng một nhân vật (đốm, màu, phụ kiện), không thêm / bớt chi.
- Cùng kích thước, cùng đường chân; không ô nào bị cắt.
- Loại nếu: đổi màu da / đốm, mắt khác kiểu, có bóng đổ nền, có chữ.
