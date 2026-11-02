# M2 Rừng Sâu — kế hoạch pilot bản đồ 3/4 nền liên tục (Lượt 1)

Ngày: 2026-11-02 · Nhánh: `phase-14-art` · Trạng thái: **Lượt 2 xong (2026-11-02), chờ chủ dự án duyệt mask M2** — nền liên tục + camera ×1.5 + layout v3 M2 đã vào game (decision 046). Ảnh: `art_inbox/.batch/adventure-15-m2-3q/after/` (18 map ×1.5), `guide/M2_mask_overlay.png`.
Đầu vào: `docs/maps/SOBI_ADVENTURE_NEW_MAP_DIRECTION.md` v1.1 (mục 16 ưu tiên cao nhất), `art_inbox/.batch/adventure-update-layout/Context.md`, decision 043, 045.
Gói Gemini: `art_inbox/.batch/adventure-15-m2-3q/` (`PROMPT.md`). Layout v3 nháp: `docs/maps/v3/M2_layout_draft.txt`. Ảnh before: `art_inbox/.batch/adventure-15-m2-3q/before/`.

Mục lục: 1 Code khác Context · 2 Audit M2 · 3 Camera ×1.5 · 4 Bố cục M2 mới + lộ trình 18 map · 5 Kiến trúc · 6 Schema · 7 Độ phân giải + chunk · 8 Style Guide · 9 Authoring · 10 Tha hóa động · 11 Props / landmark · 12 File sẽ đổi · 13 Rủi ro · 14 Kiểm thử · 15 Hiệu năng · 16 Tự quyết · 17 Cần duyệt.

---

## 1. Chỗ code thực tế khác / bổ sung cho Context.md

| # | Context.md | Code thực tế (chuẩn) |
|---|---|---|
| 1 | "camera zoom = fitZoom × 2 trong `mapCamera.ts`" | Đúng, nhưng `fitZoom` tính ở `AdventureScene.ts:116` (`farmCamera(...)` với khung thiết kế `ADVENTURE_DESIGN` 1600 × 900, `AdventureScene.ts:27`); hệ số ×2 là hằng `EXPLORE_ZOOM` ở `mapCamera.ts:9`, dùng cho cả zoom lẫn khoảng chừa HUD (`HUD_TOP / EXPLORE_ZOOM`). Ở Trại / trận (`showBackdrop`) camera dùng `fitZoom` không nhân, không bị ảnh hưởng. |
| 2 | (không nói) | Người dẫn So / Bi cao **120 px logic = 3 ô** (`walker.ts:13`, ảnh 96 × 144 có 2 px lề → thân ≈ 2,9 ô); bạn đi theo 74 px (1,85 ô). Nhóm quái 2–4 ô. Đây là chuẩn tỉ lệ cho Style Guide. |
| 3 | `docs/maps/v2/M2_*.txt`: portal (5, 21), lore `lore_f2` | `maps.json`: **portal (4, 21)**, lore **`lore_f2_pond`** (id cũ được giữ khi nhập). "crystal 33 26" của txt chỉ là trang trí, không có trong `maps.json`. |
| 4 | `exit_f2_south` "đóng tới khi vùng Núi mở" | Không có `lock` trong dữ liệu; đóng qua `exitOpen` (vùng đích chưa mở). |
| 5 | `maps.json` "jsonc" tự do | Có schema zod **strictObject** (`content/schemas/adventure/maps.ts:75`): thêm trường mới phải thêm vào schema (chỉ thêm, tùy chọn). |
| 6 | art:process | Mục `environment` là ảnh full-bleed (không tách nền, không đệm). `assets:check` chỉ đo cỡ / alpha file `.png`; file khác đuôi chỉ cần tồn tại và tên snake_case. Ảnh PNG `production` phải có kênh alpha. |
| 7 | Chuyến dở khi đổi bố cục | `settleWalker` (decision 043 Đợt 1) đưa người dẫn về `spawn` nếu đứng trên ô không còn đi được — áp dụng sẵn cho đổi mask M2. |
| 8 | `scripts/capture/adventureMaps.ts` | Đã có `--view` (chưa commit trước phiên này). Phiên này thêm `--zoom <k>` (ảnh xem trước camera ×k, không đổi camera game) và `--only <mã/id,…>`. |

## 2. Audit M2 — `map_forest_deep` (phải bảo toàn)

`zone_forest`, 64 × 36 ô, `tile` 40, tha hóa 18 %, tuyến chính M1 → **M2** → M3, nhánh xuống N5. Toàn bộ bản vẽ có id: `art_inbox/.batch/adventure-15-m2-3q/guide/M2_guide_annotated.png` và `guide/M2_before_grid.png`.

**Điểm vào / ra**

| Thứ | Ô | Ghi chú |
|---|---|---|
| spawn | (2, 18) | |
| portal | (4, 21) 2 × 2 | thắp khi hạ kẻ canh |
| `exit_f2_west` | (0, 18) 1 × 2, trail, facing left | → `map_forest_edge`, tới (62, 17). Chiều về: `exit_f1_east` (M1, 63,17, lock guardian) tới M2 **(1, 18)** |
| `exit_f2_east` | (63, 10) 1 × 2, trail, **lock guardian**, facing right | → `map_forest_heart`, tới (1, 14). Chiều về: `exit_f3_west` (M3, 0,14) tới M2 **(62, 10)** |
| `exit_f2_south` | (30, 35) 2 × 1, tunnel, facing right | → `map_mountain_tunnels`, tới (1, 20). Chiều về: `exit_n5_west` (N5, 0,20, facing up) tới M2 **(30, 34)** |

**Nhóm quái (12)** — id, ô, loại: `g_f2_elite` (58,10) elite [wolf_alpha + forest_wolf, quà]; `g_f2_a` (6,14); `g_f2_b` (20,19); `g_f2_c` (30,11); `g_f2_d` (33,23); `g_f2_e` (48,16); `g_f2_f` (53,8); `g_f2_g` (38,8); `g_f2_h` (56,20); `g_f2_i` (28,31); `g_f2_j` (10,26); `g_f2_sleep` (46,24) ngủ. 11 nhóm thường + 1 tinh anh.

**Vật** — rương `chest_f2_hidden` (21,29) hidden · `chest_f2_vines` (7,6) silver · `chest_f2_boulder` (57,29) wood; cổng `gate_f2_vines` (10,10) NATURE · `gate_f2_boulder` (56,26) EARTH, `look: crack` (tường giả); lớp che `cover_f2_a` (14,25) 10 × 7 canopy; suối `spring_f2` (6,22); NPC `npc_f2_shrine` (44,15) `event_shrine`; lore `lore_f2_pond` (40,9); prop `prop_adv_lm_f2` (57,4) 3 × 2 (vòng đá rêu, ảnh `adv_map_forest_landmark_stone_ring`). Không có `nodes`, `puzzles`, `shrine`.

**Địa hình logic** (nguồn sự thật va chạm): `docs/maps/v2/M2_map_forest_deep.txt`; cao nguyên `^` (37–49, 14–18), vách `F` mặt trước hàng 19–20 với bậc `s` (42–43, 19–20); ao (20–30, 6–12), suối x 24–27 chảy xuống mép dưới; cầu `=` (24–26, 15–16) và (25–27, 23–24); vạt `c` (32–34, 25–27).

**Save liên quan** (slice Adventure v7, `logic/state.ts`): `openedChests` (3 rương), `openedGates` (2 cổng), `foundSecrets` (`cover_f2_a`), `beaten` (`map_forest_deep/g_f2_elite`), `activePortals` (`map_forest_deep`), `explored['map_forest_deep']` (bitmask hex theo khối 4 × 4 ô: **phụ thuộc cols/rows**, nên giữ 64 × 36), `loreFound` (`lore_f2_pond`), `openedExits`, chuyến dở: `run.mapId`, `run.pos` (px), `run.defeated` / `harvested` / `springs` (`<mapId>/<id>`).

**Kiểm tra hiện tại**: `mapProblems` M2 sạch, graph sạch (chạy trong `npm run check`, xem §14).

## 3. Camera ×2 → ×1.5 (chưa làm ở lượt này)

- **Nơi áp dụng duy nhất**: `src/areas/adventure/scene/mapCamera.ts:9` `const EXPLORE_ZOOM = 2;` → `1.5`. `fit()` dùng nó cho zoom (`fitZoom * EXPLORE_ZOOM`) và khoảng chừa HUD (`HUD_TOP / EXPLORE_ZOOM`, `HUD_BOTTOM / EXPLORE_ZOOM` → giữ đúng 270 / 70 px màn hình). Không có chỗ nào khác nhân ×2 (đã grep `scene/`, `ui/`, `tools/`, `tests/`).
- Kéo theo (chỉ chữ / công cụ): comment đầu `mapCamera.ts`, comment `scripts/capture/adventureMaps.ts` ("trip's ×2 zoom"), README adventure, decision 045 (ghi chú cập nhật), một decision mới.
- Hệ quả: khung 1600 × 900 thấy **26,7 × 15 ô** (trước 20 × 11,25). Đội: So cao 180 px màn hình (trước 240). Chữ thế giới (nhãn nhóm 15 px, chữ khóa lối ra 15 px) nhỏ còn 22,5 px — vẫn đọc được; nếu chủ dự án thấy nhỏ, nâng cỡ chữ nhãn chứ không phóng nhân vật.
- Map nhỏ nhất 48 × 27 (1920 × 1080 px logic) > khung ×1.5 (1067 × 600 + HUD) nên giới hạn biên vẫn cuộn được trên mọi map.
- Xem trước: `before/M2_map_forest_deep_view_x1.5.png` (cùng M1, M3, N5). Lượt 2 chụp lại **cả 18 map** sau khi đổi.

## 4. Bố cục M2 mới (layout v3)

**Chủ dự án chốt (2026-11-02):** làm lại layout **mọi map**, không giữ bố cục v2; **M2 làm thử trước**, duyệt xong mới nhân rộng (§4b).

Bản nháp: `docs/maps/v3/M2_layout_draft.txt` / `.json` (sinh bằng `scripts/art/map_v3/m2_layout.py`), kiểm bằng `npx tsx scripts/art/map_v3/check_draft.ts M2`: **`mapProblems` + `mapGraph` sạch**, 1051 ô đi được (46 %). Cùng id, số lượng, loại, hành vi với `maps.json` (script tự assert). Đây là khung cho tranh; sau khi có tranh, lưới đi lại được author lại theo tranh (Lượt 2) và kiểm lại.

Ý tưởng: một thung rừng sâu có **suối chảy từ mép trên** xuống, mở thành **ao** giữa rừng rồi chảy ra **mép dưới**; **gò rêu tròn** (cao 2 bậc, vách mặt nam + bậc đá) ở tây bắc mang vòng đá cổ và đền nhỏ; **bãi cây rỗng** ở giữa là điểm hẹn của hai tuyến; ba túi bí mật / phần thưởng ở ba góc.

| Vai trò | Vùng (ô) | Nội dung (id, ô) |
|---|---|---|
| Starting | (1,16)–(13,27) | spawn (2,21), portal (5,24), `spring_f2` (9,24), `g_f2_a` (14,19) ở mép bãi; Open |
| Landmark | gò rêu (6,1)–(25,12) | `prop_adv_lm_f2` vòng đá (13,4) trên mặt gò, `npc_f2_shrine` (19,5), `g_f2_g` (12,5); bậc đá (15–16, 9–10); Special |
| Secret | thung dây leo (25,0)–(36,8) | `gate_f2_vines` (31,7) NATURE ở cổ hẹp 1 ô → `chest_f2_vines` (31,2) silver |
| Combat A | đồng ao (24,9)–(41,19) | `g_f2_b` (20,12), `g_f2_c` (28,11), `g_f2_j` (35,16); `lore_f2_pond` (33,17) bên bờ ao |
| Combat B | đồng đông bắc (44,1)–(62,11) | `g_f2_f` (49,4); tuyến bắc qua cầu ván (39–40, 7–10) |
| Special | bãi cây rỗng (30,16)–(47,28) | `g_f2_d` (34,23), `g_f2_sleep` (41,25) ngủ; vạt đất tha hóa `c` (43–45, 23–25); landmark cây rỗng (trang trí, Lượt 3) |
| Combat C | đồng đông (47,11)–(62,24) | `g_f2_e` (51,16), `g_f2_h` (56,20); kẻ canh `g_f2_elite` (58,9) ngay trước `exit_f2_east` |
| Secret | rừng ẩn đông nam (50,24)–(63,34) | `cover_f2_a` (51,25) 11 × 7 canopy che lối mòn ẩn từ đồng đông → `chest_f2_hidden` (59,30) (Hidden Passage) |
| Reward | túi tảng đá tây nam (3,27)–(14,35) | `gate_f2_boulder` (9,28) EARTH tường giả → `chest_f2_boulder` (8,32) wood |
| Combat D | bờ suối hạ lưu (14,24)–(30,35) | `g_f2_i` (19,30) |
| Exit | W (0,21–22), E (63,7–8), S (44–45,35) | xem bảng dưới |

**Tuyến:** chính A (nam) W → bãi khởi đầu → cầu suối (23–25, 20–22) → bãi cây rỗng → đồng đông → kẻ canh → E. Chính B (bắc) tách ở (17,20) → chân gò → bờ bắc ao → cầu ván bắc → đồng đông bắc → kẻ canh. Phụ: lên gò (bậc đá), thung dây leo, xuống bờ suối hạ lưu, túi tảng đá, nhánh nam ra N5. Ẩn: dưới tán đông nam.

**Lối ra dời → phải sửa phía bên kia** (Lượt 2, cùng lúc nhập bố cục):

| Lối ở M2 | Ô mới (cũ) | Lối ngược ở map bên kia | arriveX/Y mới (cũ) |
|---|---|---|---|
| `exit_f2_west` → M1 | (0,21) 1 × 2 (0,18) | `map_forest_edge/exit_f1_east` | **(1,21)** (1,18) |
| `exit_f2_east` → M3 | (63,7) 1 × 2 (63,10) | `map_forest_heart/exit_f3_west` | **(62,7)** (62,10) |
| `exit_f2_south` → N5 | (44,35) 2 × 1 (30,35) | `map_mountain_tunnels/exit_n5_west` | **(44,34)** (30,34) |

`arriveX/Y` của chính các lối M2 (nơi tới ở M1 / M3 / N5) **không đổi** vì map bên kia chưa làm lại; khi làm lại map đó thì sửa cặp tương ứng. Mật độ: Open = khởi đầu, đồng ao, đồng đông; Dense = rừng biên, quanh thung / túi bí mật, bờ suối hạ lưu; Special = gò rêu, bãi cây rỗng. Khoảng trống ≥ 2 ô quanh tuyến chính và quanh mỗi nhóm quái.

### 4b. Lộ trình cho cả 18 map

**Cập nhật 2026-11-02:** mask M2 đã duyệt. Chủ dự án chọn: làm tiếp các map theo cách này để có layout + logic mẫu, **chưa làm props cho từng map**; vị trí / kích thước asset sẽ chỉnh bằng màn Admin "Cập nhật bản đồ" làm sau (`docs/maps/v3/ADMIN_MAP_EDITOR.md`). Vùng Rừng: bản nháp M1, M3, N1, N2, N3 (`scripts/art/map_v3/forest_v3.py` trên bộ công cụ `layout_v3.py`, `mapProblems` + `mapGraph` sạch), gói Gemini `art_inbox/.batch/adventure-16-forest-3q/` (chỉ ảnh nền). Lối ra ra khỏi vùng (M3 → Chân Núi, N3 → Bãi Vỏ Sò) giữ ô cũ. Rừng vào game và mask duyệt (2026-11-02); vùng Núi: bản nháp + gói `adventure-17-mountain-3q` (`mountain_v3.py`).

1. **M2** (pilot): Lượt 1 → 2 → 3, chủ dự án nghiệm thu.
2. Cập nhật Style Guide / prompt / công cụ theo bài học M2 (ghi decision mới).
3. Làm theo vùng, mỗi vùng một gói Gemini: **Rừng** (M1, M3, N1–N3) → **Núi** (M4–M6, N4, N5) → **Tàn Tích** (M7–M9, N6) → **Biển** (N7–N9). Mỗi map: layout v3 mới (script `<code>_layout.py` + `check_draft.ts`), tranh nền, mask, đặt lại đối tượng (giữ id), sửa lối hai phía, `mapProblems` + `mapGraph` + `sim:adventure` theo vùng.
4. Khi cả 18 map có `scene`: bỏ renderer ô ghép cũ (`mapGround`, `mapCliffs`, `wallPropsOf`, kit ô nền) và trường `scene` thành bắt buộc (decision riêng).

**Sương mù khám phá khi đổi layout:** `slice.explored[mapId]` là các khối 4 × 4 ô đã thấy theo **vị trí**; layout mới thì phần đã mở cũ không khớp địa hình mới (chỉ ảnh hưởng bản đồ nhỏ, không ảnh hưởng tiến trình). Đề xuất: khi một map nhận layout v3, **xóa `explored` của riêng map đó** bằng một migration nhỏ (slice v7 → v8, chỉ xóa khóa map đã làm lại, có test). Chờ duyệt (§17); nếu không duyệt thì giữ nguyên (bản đồ nhỏ hiện sai vài vùng cho tới khi đi lại).

## 5. Kiến trúc đề xuất

```
maps.json (terrain + objects, KHÔNG đổi)  +  map.scene (MỚI, tùy chọn)
        │                                          │
 logic/maps.ts: blockedTiles = terrain + footprint vật + scene.scenery[].foot  (vẫn là nguồn sự thật va chạm)
        │
 scene/mapView.ts buildMap():
   map.scene ? layScene()  : renderer cũ (dressArea.under, layGround, drawCliffs, decals, wallPropsOf)   ← map chưa chuyển vẫn y như cũ
   layScene(): 1 nền (4 khối từ 1 ảnh nguồn) → 2 decal nền (tùy) → 3 scenery 'world' + vật + đội (sort theo chân)
               → 5 scenery 'canopy' + covers (trên đội, mờ khi đội ở dưới) → 6 tha hóa động + hạt + VFX
   things / groups / exits / covers / fog / corruption state: GIỮ code hiện có, chỉ vẽ chồng lên nền mới
```

- Module mới: `scene/mapScene.ts` (Phaser: dựng nền khối + scenery + canopy), `scene/mapSceneKit.ts` (thuần: tính vị trí khối, depth theo chân, chỗ fade), `scene/mapCorruptionOverlay.ts` (lớp tha hóa động cho map có `scene`).
- Depth: mọi vật đứng `depth = y chân (px)`; ảnh nền depth −10; canopy depth 100000+ (như covers). Occlusion: một vật `fade: true` (cây lớn) mờ còn 0,45 khi chân đội nằm sau chân cây và trong hộp ảnh của cây (giống cách covers mờ).
- `src/core/` không đổi. Asset chỉ qua id → manifest.

## 6. Schema (chỉ thêm, không sửa)

Thêm vào `mapSchema` (`content/schemas/adventure/maps.ts`) **một trường tùy chọn**:

```ts
scene: z.strictObject({
  /** Manifest id stem of the background; chunks are `<art>_c<col><row>` (environment rows). */
  art: z.string().regex(/^bg_adv_v3_[a-z0-9_]+$/),
  /** Source px per tile of the background (64), and its chunk grid. */
  px: posInt,
  chunks: z.tuple([posInt, posInt]),
  /** Standing / flat / overhead pieces painted separately (trees, rocks, landmarks, canopy). */
  scenery: z.array(z.strictObject({
    art: z.string(), x: z.number(), y: z.number(),          // foot anchor in tiles (centre of the base)
    w: z.number().positive(),                               // drawn width in tiles
    layer: z.enum(['ground', 'world', 'canopy']),
    foot: z.strictObject({ ...cell, w: posInt, h: posInt }).optional(), // tiles it blocks (trunk, rock foot)
    flip: z.boolean().optional(), fade: z.boolean().optional(),
  })).default([]),
  /** Elevation 0–9 per tile (presentation, occlusion, future stairs logic), rows like `terrain`. */
  elevation: z.array(z.string()).optional(),
  /** Where props may stand (authoring aid only), rows of '1' / '0'. */
  placement: z.array(z.string()).optional(),
}).optional(),
```

- Không xóa / đổi nghĩa trường nào. `terrain` vẫn quyết định đi lại; scenery chỉ **thêm** ô chặn qua `foot` và `mapProblems` kiểm tra nó (không đè lên vật, lối ra, đường tới vật).
- Hidden Path dùng `covers` có sẵn (không cần lớp mới); lớp `hidden` của mục 8.2 = vùng `covers` trên ô đi được.
- Không đổi cấu trúc save: id, cols/rows giữ nguyên → **trường `scene` không cần migration**. Riêng `explored` của map làm lại: xem §4b (migration nhỏ, chờ duyệt).
- Rollback: xóa trường `scene` khỏi M2 → map về renderer cũ ngay.

## 7. Độ phân giải, chunking, định dạng

- **px/ô nguồn = 64** (thay 80 của ×2). Lý do: ở ×1.5, 1 ô = 60 px màn hình trên 1600 × 900, 72 px ở 1920 × 1080, 96 px ở 2560 × 1440. 64 khớp 1:1 ở khung thiết kế, phóng nhẹ ×1,125 ở 1080p (không thấy mờ), ×1,5 ở 1440p (hơi mềm, chấp nhận cho nền vẽ mềm). 80 px/ô cho M2 = 5120 × 2880 vượt 4096 và tốn 1,56× bộ nhớ mà lợi rất ít.
- M2 nguồn = **4096 × 2304** (64 × 36 ô; đúng tỉ lệ 16 : 9 của Gemini). Chia **2 × 2 khối 2048 × 1152** cắt từ cùng ảnh nguồn (mép trùng pixel, không chồng, không vẽ riêng). Lý do: mỗi khối ≤ 2048 an toàn cho mọi GPU (giới hạn tối thiểu thực tế 4096), ít draw call; map lớn 80 × 45 → 5120 × 2880 → 3 × 3 khối ≤ 2048 dùng cùng quy tắc.
- **Từ ảnh Gemini nhỏ tới 4096 × 2304** (một ảnh nguồn):
  1. Gemini 4K (5504 × 3072) → thu nhỏ Lanczos về 4096 × 2304. Tốt nhất.
  2. Gemini 2K (≈ 2752 × 1536) → phóng Lanczos ×1,49 + unsharp nhẹ (bán kính 1,2, 40 %). Đủ dùng.
  3. Chỉ 1344 × 768 → phóng ×3,05 thành **master**, rồi (tùy chọn, Lượt 2) **lượt vẽ chi tiết**: cắt master thành 3 × 2 mảnh có chồng 25 %, chủ dự án đưa từng mảnh cho Gemini "chỉ vẽ nét lại, giữ y bố cục"; agent đăng ký vị trí (tương quan ảnh thu nhỏ), loại mảnh lệch hình > 2 px ở 1/4 độ phân giải, trộn mép bằng mặt nạ mềm 128 px + khớp màu theo histogram vùng chồng. Mảnh hỏng → giữ bản phóng của master. Mọi mảnh đều là chi tiết hóa của **cùng một master**, nên giữ nguyên tắc một ảnh nguồn.
- Định dạng: lưu master PNG trong `art_inbox/` (không ship). Khối ship: **PNG** ở Lượt 2 (đi được `assets:check`, không mất chất lượng), đo dung lượng; nếu tổng > 12 MB / map thì đổi khối sang **WebP q 90** (Chromium của Electron đọc được; `assets:check` chấp nhận đuôi khác) — ghi vào decision khi đổi.
- Script mới (Lượt 2): `scripts/art/map_v3/bg_prepare.py` (scale, sharpen, chunk, ghi `scripts/assets/mapV3Sizes.json`), thêm hàng manifest `environment` `bg_adv_v3_forest_deep_c00…c11`.

## 8. Style Guide (số liệu)

Đơn vị: **ô** = 40 px logic = 64 px nguồn. Áp cho nền, props, landmark M2 (và vùng Rừng sau pilot).

| Mục | Giá trị |
|---|---|
| Hướng sáng | từ **trên-trái**, phương vị ~ 315° (10 giờ 30), cao ~ 50° |
| Bóng đổ | về **dưới-phải**; dài 0,3 × chiều cao vật (cây 7,5 ô → bóng ~ 2,2 ô); màu #1E3B2C, alpha 35–40 %; mềm, nhòe mép ~ 6 px nguồn; bóng tiếp xúc ngay dưới chân alpha 55 %, rộng 0,7 × bề ngang chân |
| Phép chiếu | song song (không điểm tụ), nhìn từ nam xuống; mặt phẳng ngang co còn ~ 75 %, mặt đứng hiện ~ 60 % chiều cao thật; mặt trước luôn quay thẳng xuống màn hình; **không** góc thoi 45° |
| Quy ước cao độ | 1 bậc cao độ = **1 ô mặt đứng** trên màn hình; gò M2 cao 2 bậc → vách mặt trước 2 ô (128 px nguồn) |
| Nhân vật | So / Bi 3 ô (192 px nguồn; thân thật 2,9 ô); bạn đi theo 1,85 ô; quái 2–4 ô |
| Cây | sồi lớn 7,5 ô (2,5 × So), sồi vừa 5 ô, thông 8 ô, cây hoa 5,5 ô, cây cổ rêu 6 ô; footprint chặn = thân **1 × 1 ô** (sồi lớn 2 × 1) ở chân |
| Bụi / đá | bụi 1,3–1,6 ô (không chặn hoặc 1 × 1); dương xỉ 1; nấm 0,5; đá nhỏ 0,5 (không chặn); tảng đá 1,5 cao × 2 rộng (chặn 2 × 1); khúc gỗ 1,2 × 4 (chặn 3 × 1) |
| Landmark | vòng đá 3,5 cao × 5 rộng (giữ footprint `prop_adv_lm_f2` 3 × 2); đền gò 3 × 3; cây rỗng 8 × 6 (chặn 2 × 1); bia đá 2 |
| Địa hình | đường chính 2–3 ô, đường phụ 1,5–2 ô; vách gò 2 ô; mặt trước khối rừng ~ 1 ô; suối 2–3 ô |
| Bảng màu Rừng | cỏ sáng #9CCB63 · cỏ giữa #7FB04F · cỏ tối / rêu #4E7E3C · rừng sâu #2F5A35 · bóng xanh lam #1E3B2C · đất đường #D9B77E · mép đường #B88F5A · đá #8E8F84 · nước #4FA9DE · nước sâu #2E7FB8 · gỗ #9A6B3C · nhấn hoa trắng #F4F1E4 / vàng #F2C94C / hồng #F2A7B8 |
| Bão hòa | nền: S 45–60 % (HSV); vật tương tác / quái giữ S cao hơn nền ≥ 10 % để nổi; vùng Dense tối hơn Open ~ 15 % độ sáng |
| Viền | nét mảnh tối (≈ 2 px nguồn ở vật 3 ô), màu tối của chính vật, không đen thuần |
| Layer | nền: mặt đất, đường, nước, cầu gỗ, vách, khối rừng biên · `ground`: decal phẳng (rễ, hoa) · `world`: cây, đá, landmark, vật, đội, quái (sort theo chân) · `canopy`: tán che, dây leo (trên đội, mờ khi che) |

## 9. Công cụ authoring

1. **Admin "Bản đồ khu"** (`tools/admin/adventureMaps.ts`, Lượt 2): vẽ ảnh nền (thu nhỏ về 40 px/ô) **dưới** lưới; thanh trượt độ mờ nền / lưới; bật tắt lớp: đi được / chặn (terrain), cao độ (`scene.elevation`), placement, footprint scenery; vẫn dùng bút vẽ ô và `mapProblems` như cũ. Admin không có trong bản build.
2. **Script đề xuất mask** `scripts/art/map_v3/propose_mask.py` (Lượt 2): phân loại màu ảnh nền theo từng ô (đa số pixel: cỏ / đường / nước / vách / rừng), so với `terrain` hiện có, xuất `docs/maps/v3/M2_mask_proposal.txt` + ảnh overlay (xanh = đi được, đỏ = chặn, vàng = khác terrain cũ, tím = vùng che) và danh sách đối tượng rơi vào ô chặn. **Không** áp tự động: chủ dự án duyệt overlay, agent mới ghi `terrain`.
3. `scripts/art/map_v3/m2_hints.py` (đã có): sinh ảnh hint / guide từ `maps.json`.

## 10. Lớp tha hóa động

Nền không chứa tha hóa. Với map có `scene`:
- **Màn tím** như hiện có (`mapCorruption.ts`, alpha theo %), nhưng phủ qua một **mặt nạ mềm** (texture dựng bằng code 1 lần, 1 px = 1 ô → làm mờ Gaussian, phóng lên) thay cho ô vuông: đậm ở ô `c`, giảm dần ra ngoài; ngưỡng mặt nạ = % tha hóa nên khi thanh tẩy vùng tím **co lại** chứ không chỉ nhạt đi.
- **Đồ tha hóa** (`corruptionDecalsOf`, ảnh `adv_map_corrupt_*` đã có) giữ; vẫn chỉ đứng trên ô đi được, không chặn.
- **Bụi tím** giữ. Không bake gì vào nền; dựng lại khi `corruption` đổi (có sẵn `builtCorruption`).
- Thứ tự: trên nền + decal, dưới vật / đội (màn, đồ); bụi trên đội.

## 11. Props / landmark M2 cần

| Id (manifest, mới) | Loại | Số lượng đặt (dự kiến) | Cỡ (ô) | Layer | Footprint chặn |
|---|---|---|---|---|---|
| `adv_v3_forest_oak_big_a/b` | cây | 8–12 (lật) | 7,5 cao | world, fade | 2 × 1 |
| `adv_v3_forest_oak_mid` | cây | 6–8 | 5 | world, fade | 1 × 1 |
| `adv_v3_forest_fir_tall` | cây | 6–10 | 8 | world, fade | 1 × 1 |
| `adv_v3_forest_blossom` | cây | 3–4 (Starting, gò) | 5,5 | world | 1 × 1 |
| `adv_v3_forest_old_mossy` | cây | 2–3 (Dense) | 6 | world, fade | 1 × 1 |
| `adv_v3_forest_bush_cluster`, `_bush_berry` | bụi | 15–25 | 1,3–1,6 | world | 0 hoặc 1 × 1 (chỉ trên ô đã chặn) |
| `adv_v3_forest_fern`, `_mushrooms`, `_reeds`, `_rock_small`, `_roots` | nhỏ / phẳng | 30–50 | 0,5–1,5 | world / ground | không |
| `adv_v3_forest_boulder_mossy` | đá | 3–5 | 1,5 × 2 | world | 2 × 1 |
| `adv_v3_forest_log_mossy`, `_stumps` | gỗ | 2–4 | 1,2 × 4 / 1 | world | 3 × 1 / 0 |
| `adv_v3_forest_lm_stone_ring` | landmark | 1 (`prop_adv_lm_f2`, đổi `art`, giữ id + w 3 h 2) | 3,5 × 5 | world | 3 × 2 (giữ) |
| `adv_v3_forest_lm_ridge_shrine` | landmark | 1 (gò, cạnh NPC) | 3 × 3 | world | 2 × 1 |
| `adv_v3_forest_lm_hollow_oak` | landmark | 1 (ngã tư) | 8 × 6 | world, fade | 2 × 1 |
| `adv_v3_forest_lm_lore_stone` | landmark | 1 (ảnh mới cho `lore_f2_pond`, chỉ đổi hình) | 2 | world | (vật đã có footprint) |
| `adv_v3_forest_canopy_mass` | tán che | 1 (`cover_f2_a`) | 10 × 7 | canopy | không |
| `adv_v3_forest_canopy_strip`, `_corner_l/_r` | tán mép | dọc mép dưới (foreground) | 8 × 3 | canopy | không |
| `adv_v3_forest_vines_hanging` | dây leo | 3–5 (túi bí mật) | 4 × 3 | canopy | không |

Sheet: P1 cây, P2 bụi / đá / gỗ, P3 landmark, P4 tán (xem `PROMPT.md`). Rương, cổng dây leo, tường giả tảng đá, suối, lối ra, cổng dịch chuyển: **dùng lại kit `adv_map_*` hiện có**; soạn sheet vẽ lại chỉ khi ảnh ghép cho thấy lệch phong cách. Cắt: theo cách `cut_kit.py` (nền xám #C8C8C8) → `art_inbox/<id>.png` → `npm run art:process` (mục `props`, tách nền, chân ở mép dưới).

## 12. File sẽ đổi

**Lượt 1 (phiên này):** `scripts/capture/adventureMaps.ts` (công cụ: `--view` đã dở + `--zoom`, `--only`), `scripts/art/map_v3/{m2_layout.py,m2_hints.py,check_draft.ts}` (mới), `docs/maps/v3/M2_layout_draft.{txt,json}` (mới), `docs/maps/v3/M2_PLAN.md` (mới), `art_inbox/.batch/adventure-15-m2-3q/**` (mới), `docs/PROGRESS.md`.

**Lượt 2:** `scene/mapCamera.ts` (×1.5); `content/schemas/adventure/maps.ts` (+`scene`); `content/adventure/maps.json` (M2: +`scene`, `terrain` theo mask đã duyệt, đối tượng theo layout v3, giữ id; `arriveX/Y` của `exit_f1_east`, `exit_f3_west`, `exit_n5_west`); `logic/migrations.ts` + `state.ts` (nếu duyệt xóa `explored` M2); `logic/maps.ts` (+foot scenery trong `blockedTiles` / `mapProblems`); `scene/mapView.ts` (rẽ nhánh `scene`); `scene/mapScene.ts`, `mapSceneKit.ts` (mới); manifest + `scripts/art/map_v3/{bg_prepare,propose_mask}.py`; `tools/admin/adventureMaps.ts`; test `tests/unit/adventureMapScene.test.ts`; decision 046; README; PROGRESS.
**Lượt 3:** `scene/mapCorruptionOverlay.ts`, `mapCovers.ts` (canopy kit v3), scenery M2 trong `maps.json`, `props.json` (`prop_adv_lm_f2.art`), manifest props, ASSET_TODO.

## 13. Rủi ro

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Gemini vẽ lệch bố cục (lối ra không ở đúng mép, vách sai chỗ) | cao | hint không chữ, đúng 16 : 9; mask theo tranh + dời đối tượng; lối ra mép là ràng buộc cứng: nếu lệch thì tạo lại BG |
| Gemini vẽ cây lẻ / vật vào nền | trung bình | prompt cấm rõ; chấp nhận cây chìm trong khối rừng; cây lẻ trong bãi → xin vẽ lại hoặc che bằng scenery cùng chỗ |
| Ảnh nhỏ → nền mềm khi phóng | trung bình | đường 2K/4K; lượt vẽ chi tiết; 64 px/ô thay 80 |
| Lệch phong cách nền ↔ props (vẽ ở lượt khác) | trung bình | Style Guide số; P1–P4 đính kèm BG đã chốt; tint / chỉnh màu toàn cục khi cắt |
| Layout mới đổi độ khó / đường đi | trung bình | cùng số / loại nhóm; kẻ canh vẫn chắn lối tiến; `mapProblems`, `mapGraph`, `sim:adventure` sau nhập |
| ×1.5 làm chữ nhãn nhỏ, thấy quái sớm hơn | thấp | chụp mọi map; nâng cỡ chữ nhãn nếu cần; quái đứng yên nên không đổi luật |
| Save dở chuyến đứng ở ô vừa thành chặn | thấp | `settleWalker` về spawn (có sẵn); test với save sandbox |
| Bộ nhớ khi nhiều map chuyển đổi | thấp (pilot) | nạp khối theo map, hủy texture khi rời map (Lượt 2 đo) |

## 14. Kiểm thử

- Lượt 1: `npm run check` xanh (typecheck, lint, guard, assets, test — gồm `mapProblems` mọi map và `mapGraph`).
- Lượt 2–3: `npm run check`; test mới: map có `scene` dựng đúng số khối / thứ tự depth (thuần ở `mapSceneKit`), scenery `foot` vào `blockedTiles`, `mapProblems` bắt foot đè vật / chặn lối; map không `scene` cho kết quả `blockedTiles` **giống hệt** trước (snapshot 18 map).
- **Save cũ:** chép `%TEMP%/sobiworld-anim/fixture/save.json` và save sandbox khác (không đụng save thật), dựng ba ca: (a) chuyến dở đang đứng ở M2, (b) đã mở cả 3 rương + 2 cổng + tìm `cover_f2_a` + hạ kẻ canh, (c) save trước v7 qua chuỗi migration. Kiểm tra tải được, `openedChests` / `foundSecrets` / `beaten` / `explored` giữ, rương mở vẫn mở trên nền mới, người dẫn ở ô đi được.
- Chụp: `npx tsx scripts/capture/adventureMaps.ts --view --zoom 1.5` mọi map sau đổi camera; M2 before / after toàn khu + góc người chơi; overlay mask.
- Chơi thử M2 bằng sandbox: đi hết hai tuyến, ba túi, ba lối ra, sau cây (occlusion), dưới tán (khu ẩn), thanh tẩy (tha hóa co lại).

## 15. Ngân sách hiệu năng (M2)

| Mục | Ước tính |
|---|---|
| VRAM nền | 4096 × 2304 × 4 B = **37,7 MB** (4 texture 9,4 MB) |
| Props v3 (≈ 20 ảnh, ≤ 512 × 600) | ≤ 15 MB VRAM |
| Dung lượng đĩa | PNG 4 khối ≈ 10–16 MB (WebP q90 ≈ 2–4 MB) |
| Tải khu | đọc + giải mã PNG local ≈ 150–350 ms (WebP ≈ 80–150 ms); đo ở Lượt 2, mục tiêu < 500 ms trên máy chủ dự án |
| Draw | nền 4 ảnh thay 2304 ảnh ô + đồ tường → ít object hơn hẳn; scenery ≤ 150 object; giữ 60 fps ở ×1.5 |
| Giới hạn | mỗi texture ≤ 2048 cạnh; tổng VRAM map ≤ 64 MB; hủy texture nền khi rời map |

## 16. Quyết định AI tự đưa ra (mục 16.3, 16.5, 16.7)

1. **64 px/ô, 4096 × 2304, 2 × 2 khối 2048 × 1152**, PNG trước, WebP nếu > 12 MB (§7).
2. **Schema `scene` tùy chọn**, không đổi save, `terrain` vẫn là va chạm; map không `scene` = renderer cũ (§6).
3. **Layout v3 mới cho M2** (chủ dự án chốt làm lại hết): thiết kế cụ thể là của AI (§4) — vị trí khu, tuyến, đối tượng; lối ra vẫn ở mép trái / phải / dưới như cũ (khớp hướng M1 / M3 / N5) nhưng dời ô, sửa `arriveX/Y` phía bên kia.
4. **Khối rừng biên và cầu gỗ nằm trong nền** (cấu trúc cố định); cây đứng lẻ cạnh đường là scenery riêng để sort theo chân. Rủi ro: khối rừng trong nền không che đội — chấp nhận vì khối đó chặn đi, đội không đứng sau nó.
5. **Occlusion bằng làm mờ cả cây** (không tách thân / tán) — ít asset, đủ cho pilot.
6. **Tha hóa** = mặt nạ mềm theo ô `c` + ngưỡng theo % (§10).
7. **Dùng lại kit cho vật tương tác**; chỉ landmark + cây + tán vẽ mới.
8. **Công cụ chụp**: thêm `--zoom`, `--only` (không đổi game).
9. Gói prompt viết tay (không qua `batch.json` / `art.py prep`) vì nền một tấm không phải sheet nhiều asset.

## 17. Cần chủ dự án duyệt

Đã chốt 2026-11-02: làm lại layout mọi map; M2 thử trước rồi nhân rộng theo vùng.

1. **Mặt bằng M2 mới** (§4, `art_inbox/.batch/adventure-15-m2-3q/guide/M2_guide_annotated.png`): vị trí các khu, hai tuyến chính, ba lối ra.
2. **Xóa sương mù (`explored`) của map làm lại** bằng migration nhỏ (§4b) — có / không.
3. **Thêm 2 landmark trang trí** (cây rỗng ở bãi giữa, đền nhỏ trên gò), mỗi cái chặn 2 × 1 ô trên đất trống.
4. **Đổi ảnh** `prop_adv_lm_f2` (vòng đá) và bia `lore_f2_pond` sang bản 3/4 mới (giữ id, footprint).
5. **Camera ×1.5 toàn game** làm ở Lượt 2 cùng nền M2.
6. Sau khi có BG: duyệt mask đi được / chặn / cao độ trên overlay (Lượt 2).
