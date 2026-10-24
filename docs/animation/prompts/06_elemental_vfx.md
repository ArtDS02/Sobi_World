# 06 — VFX nguyên tố / kỹ năng (ưu tiên P0)

**Runtime:** code tự dùng ảnh nếu manifest có id (không sửa code). Mỗi hệ cần 2 ảnh: `fx_adv_<hệ>_projectile` (vật bay, **hướng sang phải**, code tự xoay) và `fx_adv_<hệ>_impact` (vụ nổ khi trúng). Kỹ năng riêng: `fx_<skillId>_projectile|impact`. Hình theo bảng §3 của `animation_style_guide.md` — khác **hình**, không chỉ khác màu.

Nên làm **một sheet cho cả 9 hệ** (9 cột × 2 hàng) để đồng bộ nét, rồi cắt bằng skill `image-to-prompt` / `npm run art:process`.

| Trường | Ví dụ |
| --- | --- |
| `[SKILL_NAME]` | (sheet) Element bolts; hoặc Gai Độc |
| `[ELEMENT_OR_EFFECT]` | 9 hệ theo bảng; hoặc "poison thorn, Nature" |
| `[GAMEPLAY FUNCTION]` | PROJECTILE (hàng 1) / IMPACT (hàng 2) |
| `[TARGET_DISPLAY_SIZE]` | projectile ~74 px, impact ~104 px trên màn 1600×900 |
| `[OUTPUT_FORMAT]` | sheet 9×2, ô 256×256, nền trong suốt |

## Prompt — sheet 9 hệ (copy)

> Create a game VFX sprite sheet in a cozy hand-painted 2D style (thin warm outlines, soft glow, no realism). Grid: 9 columns × 2 rows of equal 256×256 cells with empty margin, transparent background if supported, otherwise flat pure white. Row 1 = PROJECTILES flying to the RIGHT, small and compact; row 2 = IMPACT bursts seen at the moment of contact. Columns in this order, each with its own SHAPE language (not just a colour swap): 1 FIRE — teardrop ember with flame tongues / flame burst; 2 WATER — round bubble with a white highlight / splash ring; 3 NATURE — spinning leaf and thorn / scatter of petals and leaves; 4 EARTH — angular rock chunk / dust ring with pebbles; 5 METAL — thin shining blade glint / cross-shaped spark; 6 LIGHTNING — zigzag bolt / short star-shaped flash; 7 DARK — round ink blob with a soft purple edge / spreading ink ring; 8 LIGHT — four-pointed sparkle star / rays of warm light; 9 VOID — hollow warped ring / ring collapsing inward. Every effect readable at [TARGET_DISPLAY_SIZE], centred in its cell, nothing touching the cell edge. No characters, no text, no labels, no grid lines, no borders, no watermark, no scenery, no full-cell flash. If clean transparency is impossible, say that background removal is required.

## Prompt — một kỹ năng (copy)

> Create a standalone 2D game VFX for [SKILL_NAME], representing [ELEMENT_OR_EFFECT]. Its gameplay function is [GAMEPLAY FUNCTION]. Two cells of 256×256 side by side: (1) the projectile flying to the right, (2) its impact at contact. Distinct shape, clear silhouette, cozy hand-painted style matching the attached Sobi reference art. Readable at [TARGET_DISPLAY_SIZE]; must not hide the target. Transparent background if supported. No characters, text, UI, borders, watermark or scenery. No full-screen flash or noisy particles. Output [OUTPUT_FORMAT].

## Ví dụ Gai Độc (slice)

`[SKILL_NAME]` = Poison Thorn · `[ELEMENT_OR_EFFECT]` = a sharp green thorn with a faint purple poison glow at its tip (Nature) / impact: thorn splinters and a small puff of purple-green poison · id: `fx_skill_mm_poison_thorn_projectile`, `fx_skill_mm_poison_thorn_impact` (đã khai trong `SKILL_MOTION`).
