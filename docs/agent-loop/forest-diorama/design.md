# forest-diorama — M2: Diorama chạy trong game cho 6 map Rừng

Nguồn: decision 064, chuẩn `docs/maps/MAP_SCENE_STANDARD.md` (gọi tắt **CHUẨN**), G0 ở `docs/research/ADVENTURE_MAP_VFX_LESSONS.md` §12–15.
Mục tiêu: vào map Rừng trong game thấy diorama như G0 (đã đạt hơn nữa theo CHUẨN), chơi y hệt map 2D.

---

## A. Kiến trúc

### A1. Module dùng chung: `src/areas/adventure/scene/diorama/`
Là phần vẽ (Three + DOM canvas) nên thuộc `scene/` của Area Adventure, không thuộc `core`/`systems`. Guard: areas được import `core, systems, ui, i18n, content` + gói npm `three`; Admin (`tools/admin`) được import `src` ⇒ cả game và lab dùng chung. Mỗi file ≤ 300 dòng, không tên `utils/helpers/common/shared/misc`.

| File mới (chuyển từ `tools/admin/diorama/`) | Ghi chú khi chuyển |
|---|---|
| `noise.ts`, `textures.ts`, `extraArt.ts`, `cards.ts`, `ground.ts`, `water.ts`, `details.ts`, `life.ts`, `birds.ts`, `bursts.ts`, `look.ts` | chuyển nguyên, sửa đường import |
| `field.ts` | thêm ký tự: `w` = thác (chặn, vẽ nước rơi), `c` = nền rêu tối đi được; ô **chặn** lấy từ `blockedTiles(map, opened, closed)` (gồm prop, vật, decor 047, cổng đóng), không chỉ từ ký tự; giảm biên độ uốn nhiễu sao cho mép 0,5 lệch ranh giới ô ≤ 0,25 ô |
| `dress.ts` → tách `dressTrees.ts` + `dressThings.ts` | cây / bụi / đá **chỉ đặt gốc trong ô chặn** (§A5); vật, quái, rương lấy art qua `thingArt()` của `mapView.ts` + resolver manifest |
| `creatures.ts` → `foes.ts` | đọc `SceneGroup` (art, size, asleep, corruption, disguised → `MIMIC_ART`, defeated → ẩn, affix vàng → viền vàng) |
| `party.ts` | **bỏ** `stepCharacter`/`walk` bên trong: chỉ đặt dáng theo vị trí do `Walker` đưa vào |
| `contracts.ts` (mới) | dữ liệu hợp đồng cảnh 6 map (mục C): lệch ánh sáng, tỉ lệ cây, điểm nhấn, sương, điểm duyệt |
| `dioramaView.ts` (thay `world.ts`) | lớp `DioramaView`: renderer, scene, camera, post, `enter/frame/hide/show/dispose`, `screenOf(px)` |
| `quality.ts` (mới) | dò GPU, đo FPS, quyết Đẹp / Nhẹ / lùi 2D (mục B) |
| `walk.ts` | **không chuyển, xóa**. Va chạm theo trường mịn không được dùng ở game lẫn lab |

Asset: không còn URL cứng (`/assets/...png`). `DioramaView` nhận `art(id) => url | null`: game truyền `deps.image`, Admin dựng resolver từ `public/assets/manifest/assets.json` như các lab khác. Đồng đội lấy từ `s.followers[].art`, không còn 3 heo cứng.

### A2. Admin lab
`tools/admin/diorama/dioramaLab.ts` giữ UI, thêm ô chọn 6 map Rừng; điểm duyệt lấy từ `contracts.ts`. Một `labDriver.ts` nhỏ trong `tools/admin/diorama/` đọc phím, đi bằng `walkableOf` + `stepCharacter` (đúng như game) và gọi `DioramaView`. Thêm nút giả lập: ngủ / tinh anh / đã thắng cho quái, rương mở, độ tha hóa 0–100 để chụp. Các file đã chuyển bị xóa khỏi `tools/admin/diorama/` (không còn 2 bản). `window.diorama` vẫn có cho script chụp. Scripts `scripts/maps/dioramaShots.ts`, `denseSpots.ts`, `dioramaWalk.ts` thêm `--map <mapId>` (mặc định `map_forest_edge`) và `--map all`.

### A3. Gắn vào AdventureScene: **chép texture** (như `battle/vfx3d/stage3d.ts`)
Chọn: Three vẽ trên canvas riêng ngoài DOM, mỗi khung `drawImage` sang `Phaser.Textures.CanvasTexture`, hiện bằng một `Image` cỡ màn hình ở depth −1000 (chỗ backdrop), `scrollFactor 0`.
Lý do (so với đặt canvas Three dưới canvas Phaser trong suốt):
- Đã chạy trong repo ở 60 FPS (lớp VFX trận); không đổi cấu hình Phaser chung (`transparent` sẽ phải sửa nền của mọi scene của farm và các Area khác).
- Mọi thứ của Phaser tự áp lên ảnh: `fadeIn` khi tới map, `flash` khi qua cổng, thứ tự vẽ với nhãn / VFX, sleep / wake cùng scene, chụp ảnh album (`preserveDrawingBuffer`).
- Chi phí chép có trần: cạnh dài tối đa 1600 (Đẹp) / 960 (Nhẹ, phóng lên). Phải đo thời gian chép trong `quality.ts`; nếu không GPU mất > 6 ms / khung thì báo (đường dự phòng là canvas-dưới, ngoài phạm vi M2).
- Không tự chạy `requestAnimationFrame`: `AdventureScene.update` gọi `diorama.frame(...)` ⇒ dừng / ngủ / giảm chuyển động đồng bộ với game.

### A4. Hợp đồng `MapRenderer` (tách vẽ khỏi luật trong AdventureScene)
Tạo `scene/mapRenderer.ts` với interface, hai bản cài:
- `ClassicRenderer` (`scene/classicRenderer.ts`): bọc nguyên code 2D hiện có (`buildMap`, `refreshThings`, `fadeCovers` phần vẽ, `fadeScenery`, `dressing.update`, `sparkles`, dáng nhóm quái trong `updateGroups`, `MapCamera`, `walker` hiện sprite). Hành vi 2D không đổi pixel.
- `DioramaRenderer` (`scene/diorama/dioramaRenderer.ts`): bọc `DioramaView` + lớp phủ Phaser.

Phương thức tối thiểu: `enter(map, s)`, `ready(): boolean`, `frame(s, walker, time, delta)`, `chestHint(id, k)`, `warp(k)`, `screenOf(px) `, `hide()`, `show()`, `leave()`.
**Luật ở lại AdventureScene, chung cho 2 renderer**: `walker.update` + `ground()` (walkableOf), chạm quái (`AB.explore.touch`, `touchLockUntil`), `updateFocus` (tầm với, chọn vật), `updateExit` + warp, `saveNow`, `placeKey`. Phần "đang đứng dưới lớp che nào" (hiện trong `fadeCovers`) tách thành hàm thuần `coverUnder(map, pos)` trong `scene/` để báo `report.move` khi tìm thấy chỗ ẩn y như cũ; `fadeCovers` gọi lại hàm này. `updateFocus` không đọc `objs.sparkles` trực tiếp nữa mà gọi `renderer.chestHint`.

Phaser vẫn vẽ ở chế độ diorama (lớp phủ, `scrollFactor 0`, vị trí = `renderer.screenOf(px)` mỗi khung): nhãn quái (`foeLabel`, khi `d < foeInfo` và không ngụy trang), Zzz, ruy băng danh hiệu, VFX một lần (`playMapVfx` thêm tham số `toScreen` tùy chọn), flash / fade camera. HUD và gợi ý tương tác là DOM như cũ. Không dựng ground / prop / sprite 2D của map.
Đồng bộ mỗi khung từ `AdventureSceneState`: `groups` (ẩn khi defeated, thở / ngủ / tha hóa theo nhóm), `openedChests` (art mở), `openedGates` + `exits` (cổng đóng / mở, vinewall ↔ `_open`), `litPuzzles`, `usedSpots`, `springUsed`, `portalLit`, `followers` (down ⇒ xám), `leader` (`chr_so`/`chr_bi`), `corruption` (đổi ⇒ dựng lại như 2D). Vị trí đội: `walker.position`, `walker.isMoving`, hướng; thêm getter chỉ-đọc `walker.followerSpots()` trả chỗ đứng các đồng đội trên vệt đi (sprite Walker ẩn ở chế độ diorama nhưng Walker vẫn chạy).

### A5. Va chạm và khớp hình (luật cứng)
- Va chạm gameplay **giữ nguyên** `walkableOf`/`stepCharacter` theo ô. `walk.ts` của G0 (trường mịn) không được thay thế va chạm.
- Thay vào đó cảnh phải khớp lưới: gốc cây / bụi / đá / gốc cụt chỉ đặt trong ô chặn (vòng chân ≤ 0,3 ô, nằm trọn trong vùng ô chặn); mỗi ô chặn có ít nhất một vật chặn (ô `#` lẻ ⇒ bụi hoặc gốc); tán được phủ ra ngoài. Cỏ cao, sậy, hoa trên ô đi được cao ≤ 0,5 ô và rẽ ra khi đội đi qua.
- Hàm thuần mới `blockerPlan(map, opened, closed)` trong `diorama/` trả cho mỗi ô chặn loại vật chặn (tree/bush/rock/cliff/water/fall/prop/thing/decor/gate) — dress dùng nó; test dùng nó.
- Lớp che (covers, decision 045): ô đi được dưới `cover` vẽ bằng `cover_canopy_*` không thân, mờ dần khi đội ở dưới.

### A6. Vòng đời
- `enterMap` (map khác, tha hóa đổi, đổi cài đặt): `renderer.leave()` rồi `enter()`. Diorama dựng bất đồng bộ: đến khi `ready()` thì Walker đứng yên (gộp vào `still`) và Phaser che đen; quá 6 s hoặc lỗi ⇒ `ClassicRenderer` cho phiên này.
- Vào trận (`mode !== 'explore'`): `hide()` — ngừng vẽ, ẩn ảnh, **giữ** đối tượng GPU. Về lại cùng map + cùng tha hóa: `show()`, đặt lại đội theo `walker` (đặt thẳng camera nếu `placeKey` đổi). Khác map: `leave()`.
- Rời Adventure / scene SHUTDOWN: `dispose()` hết, kể cả cache texture kit và WebGL renderer. Đổi map: hủy hình học + vật liệu của map, giữ cache texture kit của vùng Rừng.
- Mất WebGL context ⇒ lùi 2D cho phiên.

## B. Cài đặt

| Khóa (`settings.json`, `DisplayPrefs` trong `src/core/settings/settings.ts`) | Giá trị | Mặc định |
|---|---|---|
| `mapView` | `'diorama' \| 'classic'` | `'diorama'` |
| `mapQuality` | `'auto' \| 'full' \| 'light'` | `'auto'` |

- Thêm vào `fileSchema` dạng `.optional()`; file cũ đọc ra mặc định. **Không chạm save thế giới** ⇒ không cần migration (nếu coder thấy buộc phải đụng `src/core/save/` thì DỪNG, báo lại).
- UI: 2 hàng mới trong `src/ui/components/displaySettings.ts` (cùng kiểu `options(...)`), ghi bằng `setDisplay`. Khi đang lùi tự động, hàng hiện ghi chú.
- Truyền vào scene: `AdventureSceneDeps.mapLook(): { view, quality }` do `src/app/start.ts` cấp từ settings store. Diorama chỉ dùng khi `view === 'diorama'` **và** `map.zoneId === 'zone_forest'` **và** có hợp đồng trong `contracts.ts`; còn lại ClassicRenderer.
- `quality.ts`: chuỗi `WEBGL_debug_renderer_info` khớp `/SwiftShader|llvmpipe|Software|Basic Render/i` ⇒ Nhẹ; nếu không, Đẹp rồi đo 3 s sau 2 s khởi động: < 45 FPS ⇒ Nhẹ; Nhẹ < 24 FPS trong 5 s ⇒ 2D cho phiên. Kết quả chỉ trong bộ nhớ. Đẹp = bóng, bloom, tilt-shift, tỉ lệ điểm ảnh ≤ 1,5, dress 1; Nhẹ = không bóng / bloom / tilt, tỉ lệ 1, dress 0,55.
- Cài đặt có sẵn vẫn áp: giảm chuyển động (save) ⇒ gió 0, không hạt, không nhìn trước; cường độ hiệu ứng `off/light/full` ⇒ nhân số hạt sống (0,3 / 0,55 / 1).
- Giờ: thêm `sky: 'day' | 'golden' | 'night'` vào `AdventureSceneState` (UI tính từ `core/clock`: đêm = `isNight`; chiều = 1 giờ game trước đêm). Không phải save.
- i18n (vi + en): `settings.mapView` "Kiểu bản đồ" / "Map style", "Diorama" / "Diorama", "2D cổ điển" / "Classic 2D"; `settings.mapQuality` "Chất lượng bản đồ" / "Map quality", "Tự động" / "Auto", "Đẹp" / "High", "Nhẹ" / "Light"; ghi chú "Đang dùng 2D vì máy chạy chậm" / "Using 2D: this device is too slow".

## C. Hợp đồng cảnh 6 map (đều từ kit Rừng + code)
Kit: `adv_map_forest_tile_grass_a/top/water/water_deep`, `edge_cliff(_end_l/_r)`, `edge_stairs`, `edge_waterfall`, `prop_tree_oak/fir/blossom`, `prop_bushes/rocks/stumps`, `cover_canopy_big/mid/blossom`, `landmark_oak_giant/stone_ring`, `corrupt_bush/log/mushrooms/oak/rock`, `exit_arch/bramble/cave/log_tunnel/vinewall(_open)`; landmark prop của map qua `PROPS[...].art`. Điểm duyệt: ô gần nhất đứng được (`canStand`).

**1. Bìa Rừng `map_forest_edge`** (64×36, tha hóa 10) — *buổi sáng mở đầu*
- Vật mốc: Sồi cổ thụ `prop_adv_lm_f1` (46,6) trên cao nguyên cấp 2, bậc đá ở đường `,` (44–46, 9–12). Cây: sồi 45 %, thông 20 %, hoa 20 %, tán lớn 15 %. Ánh sáng: preset, ấm +0,02, sương xa 0,1.
- Nước: suối chảy Bắc → Nam (cột 20 → 34), cầu (23–29, 14–18), hồ sen (28–36, 21–27). Sống: bướm, gió, cá nhảy, chim. Điểm nhấn: hồ sen + bướm đông nhất vùng.
- PHẢI THẤY: suối chảy xuống Nam có bọt; hồ sen; sồi cổ thụ trên vách có bậc; lối đất từ Tây sang cổng Đông; bụi gai lửa `gate_f1_bramble` đọc được là vật chặn.
- KHÔNG ĐƯỢC: tha hóa thấy rõ (chỉ ≤ 3 cụm nhỏ). Điểm duyệt: (3,18) (22,16) (24,24) (45,13) (57,20) (52,26 dưới tán).

**2. Rừng Sâu `map_forest_deep`** (64×36, 18) — *rừng thông dày, nắng xuyên tán*
- Vật mốc: Vòng đá rêu `prop_adv_lm_f2` (11,4) trên cao nguyên, bậc `s` (15–16, 6–9). Cây: thông 50 %, sồi 30 %, tán lớn 20 %, không hoa. Ánh sáng: bão hòa −0,08, lạnh −0,02, sương xa 0,3.
- Nước: suối từ Bắc (39–40) qua cầu dài (39–42, 6–10), hồ (29–40, 11–18), cầu rộng (23–27, 19–22), suối xuống Nam (19–23). Sống: lá rơi, bụi nắng trong vệt sáng, chim.
- Điểm nhấn: **vệt nắng xiên** qua khoảng hở tán (quad cộng sáng nhẹ, lắc chậm 8 s; không bloom). Ô `c` (43–46, 24–26): nền rêu tối.
- PHẢI THẤY: vòng đá trên cao; 2 cầu; hồ giữa; ≥ 2 vệt nắng trong khung ngày; đá nứt `gate_f2_boulder` (6,29).
- KHÔNG ĐƯỢC: vệt nắng che đội; đêm có vệt nắng. Điểm duyệt: (2,21) (14,9) (40,8) (25,20) (34,16) (44,25) (55,27).

**3. Lõi Rừng `map_forest_heart`** (48×27, 30) — *tim rừng bị tha hóa*
- Vật mốc: Cây khô khổng lồ `prop_adv_lm_f3` (21,12) giữa trảng; **mực tha hóa** bò quanh gốc (viền tím, mép nhiễu, bán kính 4–6 ô, đập chậm 3 s). Cây: sồi 40 %, thông 40 %, tán lớn 20 %; ≥ 25 % thay bằng `corrupt_oak/bush/log/rock` gần trung tâm.
- Ánh sáng: bão hòa −0,15, lạnh −0,03, sương xa 0,4 tím nhạt. Không nước. Sống: lá khô rơi chậm, mảnh mực bay lên, đom đóm thưa; không bướm, chim chỉ bay xa.
- Điểm nhấn: mặt đất chuyển xám dần về phía cây khô (gradient theo khoảng cách).
- PHẢI THẤY: cây khô + mực; trùm `g_f3_boss` nổi rõ trên nền tối; cổng bóng `gate_f3_shadow` (9,18); lối chính (`,`) vẫn rõ.
- KHÔNG ĐƯỢC: mực trên lối chính dày > 30 %; tím phẳng phủ khung. Điểm duyệt: (2,14) (20,11) (trùm) (10,17) (31,4 dưới tán) (46,13).

**4. Thung Nấm `map_forest_hollow`** (64×36, 15) — *thung ẩm, bào tử*
- Vật mốc: Nấm khổng lồ `prop_adv_lm_n1` (38,18), bào tử vàng ấm bay lên quanh mũ (phấn — được phép sáng). Cụm nấm nhỏ = chính tranh landmark thu nhỏ 0,25–0,4, rải ở mép rừng. Cây: tán lớn 35 %, sồi 35 %, thông 30 %.
- Ánh sáng: lệch xanh ngọc (ấm −0,02, bão hòa +0,05), sương thấp 0,35. Nước: suối Bắc → Nam (24–26 → 19–24), các cầu (21–26, 18–24), vách cao nguyên Tây Bắc.
- Sống: bào tử, đom đóm từ chiều, gợn nước, ếch nhảy (gợn tròn).
- Điểm nhấn: tán lớn che khu ẩn `cover_n1_a` (6,17 · 14×9) mờ dần khi bước vào.
- PHẢI THẤY: nấm + bào tử; suối chảy xuống; cao nguyên có vách; bụi gai `gate_n1_bramble` (54,27).
- KHÔNG ĐƯỢC: bào tử dày che đội. Điểm duyệt: (40,33) (36,21) (23,19) (12,21) (15,6) (54,26).

**5. Thác Rêu `map_forest_falls`** (72×40, 20) — *thác trên vách lớn*
- Vật mốc: **thác** ô `w` (37–39, 12–16) đổ từ cao nguyên xuống hồ (34–46, 17–23): `adv_map_forest_edge_waterfall` + shader rơi, bụi nước, vòng bọt ở chân. Gốc cây cổ `prop_adv_lm_n2` (26,31) là mốc phụ. Cây: thông 45 %, sồi 35 %, tán lớn 20 %.
- Ánh sáng: preset, sương ẩm quanh thác 0,3; ngày có **cầu vồng mờ** trong bụi nước (dải gradient code, độ đục ≤ 0,25).
- Sống: thác, bụi nước, chim, cá nhảy ở hồ. Cầu (39–44, 23–24), (43–48, 27–28).
- PHẢI THẤY: thác rơi liên tục; hồ có bọt; vách cao nguyên cao rõ; đá nứt `gate_n2_boulder` (8,29).
- KHÔNG ĐƯỢC: bụi nước che đội; thác tĩnh khi giảm chuyển động bị cắt cụt (tĩnh nhưng nguyên hình). Điểm duyệt: (2,20) (47,20) (24,30) (41,24) (20,6) (70,26).

**6. Đầm Sương `map_forest_marsh`** (80×45, 35) — *đầm sương lạnh*
- Vật mốc: Chòi đổ nát `prop_adv_lm_n3` (51,39) bên đầm; guồng nước `puzzle_n3_wheel` (45,21) quay khi đã thắp. Cây: tán lớn 30 %, thông 30 %, sồi 30 %, `corrupt_*` 10 %.
- Ánh sáng: lạnh −0,04, bão hòa −0,1, **sương thấp trôi** trên nước và đồng (lớp code, mật độ ≤ 0,15 trong 2 ô quanh đội). Nước: đầm lớn (31–53, 26–37) cầu chữ thập (39–44, 32–38), ao Đông Bắc (52–69, 4–14), ao (60–70, 33–39). Sậy dày, lá súng.
- Sống: sương trôi, đom đóm nhiều nhất vùng (chiều, đêm), gợn, chim nước.
- PHẢI THẤY: sương trôi; sậy dày bờ đầm; chòi; cổng nước `gate_n3_water` (40,35); tha hóa vừa ở rìa.
- KHÔNG ĐƯỢC: sương che đội hoặc lối cầu. Điểm duyệt: (2,28) (41,33) (50,38) (45,21) (70,8) (31,11).

## D. Nghiệm thu (reviewer kiểm được)
1. 6 map Rừng mở ra diorama trong game (`mapView = diorama`); vùng khác vẫn 2D; `mapView = classic` ⇒ 6 map Rừng 2D giống hệt trước (so ảnh trước / sau ở 3 điểm).
2. Test thuần `blockerPlan`: với cả 6 map, 100 % ô chặn của `blockedTiles` có vật chặn; 0 gốc cây / chân đá trong ô đi được; mép trường lệch ranh giới ô ≤ 0,25 ô (mẫu lưới 0,25 ô).
3. Không file nào ngoài `diorama/`, `mapRenderer`, `classicRenderer`, `coverUnder` đổi luật: test cũ của `walkableOf`, chạm quái, rương, cổng, save xanh; `walk.ts` không còn trong repo.
4. Chơi thử mỗi map: đi tới mọi cổng ra và qua cổng; chạm 1 nhóm vào trận, thắng, về đúng chỗ, nhóm đã thắng biến mất; mở 1 rương (đổi art mở); bước vào 1 lớp che ẩn được ghi nhận như 2D; phím + tay cầm + Space đều chạy.
5. Save / load: lưu giữa map Rừng, thoát, mở lại ⇒ đúng map, đúng vị trí; file save không có khóa mới; `settings.json` có `mapView`, `mapQuality`.
6. Đổi cài đặt giữa chừng đổi renderer ngay, đội đứng nguyên chỗ; lùi tự động hoạt động (test `quality.ts` với chuỗi renderer giả `SwiftShader` ⇒ Nhẹ; FPS giả 20 ở Nhẹ ⇒ 2D).
7. Dựng map: Walker không đi được trước khi diorama sẵn sàng; lỗi / quá 6 s ⇒ 2D.
8. FPS theo CHUẨN §7 cho cả 6 map (bảng số từ `dioramaShots.ts`); đổi map 6 lần bộ nhớ GPU không tăng > 5 %.
9. 8 chỗ rậm mỗi map (`denseSpots.ts --map`): đội thấy rõ; contact sheet `docs/maps/diorama/<mapId>_dense.jpg`.
10. Mỗi map có ảnh 3 giờ ở mọi điểm duyệt + ảnh động đi bộ; reviewer độc lập chấm CHUẨN §8 trong `docs/maps/diorama/SCORES.md`: mỗi map > 7,5, tiêu chí 2 ≥ 1,5.
11. Admin `#/diorama-lab` chọn được 6 map, điểm duyệt theo map; lab đi bằng `walkableOf`.
12. i18n vi + en đủ chuỗi mục B; không chuỗi cứng trong code.
13. `npm run check` xanh HOÀN TOÀN (đỏ sẵn đã sửa ở M1), `npm run guard` xanh, không file > 300 dòng mới, không dependency mới.
14. `chr_so_down_idle.png` đã sửa ở M1; `docs/ASSET_TODO.md` ghi mọi nhu cầu art phát sinh.

## E. Ngoài phạm vi
Sửa bố cục lưới `maps.json`; tháp dịch chuyển; vòng khám phá; quái 3D; mưa; nền trận trên diorama; vùng khác; art mới; va chạm theo mép mịn.

## F. Đã quyết (Chỉ đạo, 2026-11-19, theo brief chủ dự án + AGENT_RULES §6)
1. **Va chạm theo ô** — brief chủ dự án yêu cầu "gameplay giống hệt bản 2D". Bù bằng luật khớp ô (A5). Va chạm mép mịn = đổi gameplay, ngoài phạm vi; ghi vào báo cáo cuối như đề xuất.
2. **Mặc định `mapView = diorama`** (chủ dự án muốn chơi thử diorama ngay). Khung nhìn: chỉnh camera để thấy ~34 ô ngang (gần 2D hơn G0), reviewer kiểm đội + quái + lối vẫn đọc được.
3. **Giờ theo đồng hồ game** (`sky` trong `AdventureSceneState`); Admin lab và script chụp đặt giờ tay.
