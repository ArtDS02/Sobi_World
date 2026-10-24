# 07 — Nhiễm Umbraflux (corruption)

**Runtime hiện tại:** đơn vị có tag `umbraflux` (biến thể "Nhiễm Umbraflux", quái Vết Nứt) chỉ có viền tím tĩnh (`.is-corrupted`). Đề xuất: **một overlay dùng chung** `fx_umbraflux_aura` (sheet lặp) đặt sau / quanh nhân vật — không vẽ lại từng quái. Quy ước hình là **đề xuất**, chưa phải canon (style guide §4).

| Trường | Ví dụ |
| --- | --- |
| `[REFERENCE_IMAGE]` | 1 quái bất kỳ (chỉ để canh cỡ), vd. `props/enemy_forest_wolf.png` |
| `[ENTITY_NAME]` | overlay dùng chung |
| `[SPECIFIED_VISUAL_CUES]` | vệt tím than chảy xuống, rìa hồng, hạt rơi chậm, mắt loé nhạt |
| `[DURATION_OR_FRAME_COUNT]` | 6 khung lặp |
| `[OUTPUT_FORMAT]` | sheet ngang 6 × 384×384 |

## Prompt (copy)

> Create a looping corruption AURA overlay for a 2D creature, sized to surround the attached reference creature without covering its face. Show Umbraflux as an invasive, unnatural energy through [SPECIFIED_VISUAL_CUES]: dark violet wisps that drip DOWNWARD (unlike natural Sobi Essence, which rises), thin pink edges, a few slow falling motes. It must feel wrong but stay cozy-game friendly (no horror, no skulls, no symbols, no runes). Draw ONLY the aura, not the creature, centred in each cell, empty in the middle where the creature will stand. [DURATION_OR_FRAME_COUNT] frames left to right in equal cells, seamless loop, same size and position in every frame. Transparent background. No text, UI, watermark, characters or screen-filling particles. Output [OUTPUT_FORMAT].

## Nghiệm thu

Đặt lên 3 quái khác cỡ (sprout, quadruped, heavy): silhouette quái vẫn rõ; vòng lặp không giật; không lẫn với màu hệ Bóng tối (Bóng tối = mực tròn, Umbraflux = vệt chảy xuống).
