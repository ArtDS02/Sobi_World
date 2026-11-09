# Batch plot-rank-scenery — scenery layers by upgrade rank (decision 056)

Prepared by the agent for the owner to generate (nothing here is generated yet; the game shows rough placeholder shapes made by
`npm run assets:placeholders`). Style: Sobi Farm style, as the other batches (dark warm-brown outline of even weight, soft cel
shading, light from the top-left, warm pastel colours). Every layer is a PNG with a transparent background, drawn on its own, no
ground patch under it unless the row says so. **All designs must be original (decision 048, AGENT_RULES §9): no character,
creature, landmark style or product of another game, film or brand.** Replace the placeholder file with the same name under
`public/assets/props/`; the manifest rows exist already (`status: placeholder`, set to `production` when the art is in).

Where they show: `CLOUD_SCENERY` in `src/areas/cloud/scene/cloudView.ts` and `GARDEN_SCENERY` in
`src/areas/garden/scene/gardenView.ts`. Design canvas is 1600 × 900; sizes below are the placeholder canvas (the layer is drawn at
the scale in those tables, so keep the proportions).

## Which rank shows what
| Rank | Cloud (tier) | Garden (zone) |
|---|---|---|
| 2 | flower border, stepping stones | fence, stepping stones |
| 3 | the tier's own landmark (10 designs) | the zone's own landmark (4 designs) |
| 4 | lanterns (glow at night is code), a small cloud creature | lanterns, a small garden creature |
| 5 | cloud waterfall and a soft halo | an old great tree and a tiny village market |

## Sobi Cloud (16 images)
| id | size | description |
|---|---|---|
| `scn_cloud_border` | 900 × 110 | a low edging of small pastel flowers and leaves along the front of the cloud bed, left-right repeatable look |
| `scn_cloud_path` | 360 × 150 | five soft pale-lilac stepping stones leading toward the viewer, like pressed cloud |
| `scn_cloud_landmark_01` … `_10` | 280 × 300 each, standing on its bottom edge | one small landmark per cloud tier, themed on that tier's name (`vi.cloud.tierNames`): 01 Vườn Trên Mây a tiny greenhouse arch, 02 Cầu Vồng a rainbow archway, 03 Hoàng Hôn a sunset-orange lantern tower, 04 Bồ Công Anh a giant dandelion fluff globe, 05 Ngọc Bích a jade-green gazebo, 06 Hoa Anh Đào a blossom tree, 07 Sao Băng a little star-catcher telescope, 08 Ánh Trăng a moon-dial sundial, 09 Hoàng Kim a golden bell frame, 10 Đỉnh Mây a small summit flag on a cloud peak |
| `scn_cloud_lanterns` | 900 × 120 | two slim wooden lantern posts at the left and right ends, warm yellow paper lanterns on top (transparent between them) |
| `scn_cloud_critter` | 120 × 110 | a tiny round cloud-puff creature with two dot eyes, sitting, friendly (original; not any existing mascot) |
| `scn_cloud_waterfall` | 220 × 340, feet at the bottom | a soft cascade of pale-blue "cloud water" pouring from a small cloud ledge, white streaks, foamy base |
| `scn_cloud_halo` | 1000 × 700 | a very soft warm-white radial glow with a few faint rays, drawn over transparent (the game blends it additively) |

## Sobi Garden (10 images)
| id | size | description |
|---|---|---|
| `scn_garden_fence` | 900 × 110 | a low rustic wooden fence with two rails, slightly uneven pickets |
| `scn_garden_path` | 360 × 150 | five round stepping stones in warm beige, a little grass between them |
| `scn_garden_landmark_01` … `_04` | 280 × 300 each, standing on its bottom edge | one landmark per zone, themed on `vi.garden.zoneNames`: 01 Vườn Nhà a cosy garden shed with a watering can, 02 Đồng Lúa Vàng a scarecrow among wheat sheaves, 03 Đồi Bắp Nắng a stack of corn cribs with a tiny windmill, 04 Thung Lũng Rau Củ a vegetable cart with a striped awning |
| `scn_garden_lanterns` | 900 × 120 | two wooden posts with warm hanging lanterns at the left and right ends |
| `scn_garden_critter` | 120 × 110 | a tiny hedgehog-like or beetle-like friendly creature carrying a leaf (original design) |
| `scn_garden_oldtree` | 300 × 380, feet at the bottom | a wide old tree with a thick trunk, a few visible roots, a round layered crown, one small hanging swing |
| `scn_garden_market` | 300 × 260, feet at the bottom | a tiny village market stall: wooden counter, patched striped awning, baskets of produce |

## Notes for whoever cuts and imports
- Run `npm run art:process` / the `image-to-asset` skill as for the other batches, then `npm run assets:check`.
- If a final size differs from the table, change `CATALOGUE_SIZES` in `scripts/assets/sizes.ts` and the `scale` in the scenery table, not the logic.
- Motion in the game is code (bob, halo breath, lantern flicker); no extra frames are needed.

## Plot skins (12 images) — decision 056
Each skin has a cloud bed and two soil beds (dry, watered), the plots' own canvas **152 × 108** (same as `plot_cloud`, `plot_soil`, `plot_soil_wet`; same angle, same shadow, the plot's centre at the canvas centre). The skin only repaints the bed; the flower / crop stands on it as before. Original themes, by id (names in `vi.plotSkin.names`):

| skin | Vietnamese name | look |
|---|---|---|
| `verdant` | Rừng Xanh | mossy green cloud with tiny ferns and clover; soil with leaf litter and small roots |
| `pearl_sea` | Biển Ngọc | pale aqua cloud with foam curls and scattered pearl-white beads; soil like wet sand with small shells |
| `crystal` | Pha Lê | lilac cloud with faceted translucent crystal shards around the rim; soil of dark slate with glinting crystal chips |
| `starry` | Tinh Tú | deep indigo cloud sprinkled with tiny stars and a crescent edge; soil dusted with soft star-sparkle |

ids: `skin_<skin>_cloud`, `skin_<skin>_soil`, `skin_<skin>_soil_wet` (e.g. `skin_starry_soil_wet`). The rank frame (bronze / silver / gold / violet, ranks 2–5) is drawn by the game around the plots, so the skin art does **not** include a rank border.
