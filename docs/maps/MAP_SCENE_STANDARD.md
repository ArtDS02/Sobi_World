# SOBI WORLD — CHUẨN CẢNH MAP DIORAMA
## Phiên bản 1.0 — 2026-11-19 (decision 064)

Áp dụng cho mọi map Adventure vẽ bằng renderer Diorama (`src/areas/adventure/scene/diorama/`). Bắt đầu với 6 map Rừng; vùng khác thêm bảng chất liệu riêng ở §3 trước khi làm. Cách làm và độ nghiêm học từ `docs/SKILL_ANIMATION_STANDARD.md` (§2.4, §7): **hợp đồng trước, code sau; bằng chứng trước, ý kiến sau**. Mọi thiết kế gốc (decision 048): không tên, hình, cảnh của bên thứ ba.

---

# 1. LUẬT CỨNG (sai một luật = map chưa xong, bất kể điểm)
1. **Gameplay không đổi**: va chạm = `walkableOf` + `stepCharacter` theo ô. Renderer không có va chạm riêng, không chặn / mở ô nào.
2. **Khớp ô**: mỗi ô chặn của `blockedTiles()` có vật chặn nhìn thấy được (gốc cây / bụi / đá / vách / nước / tranh của vật); không gốc cây, chân đá, chân vách nào nằm trong ô đi được. Mép vẽ cong lệch ranh giới ô tối đa **0,25 ô**. Tán lá được phủ qua ô đi được (đã có vòng nhìn xuyên).
3. **Thấy đội** mọi lúc (§6). Thấy quái trong 6 ô quanh đội.
4. Không chớp > 2 lần / giây; không màn phủ che lối đi; tôn trọng giảm chuyển động (cảnh đứng yên, vẫn đẹp) và cường độ hiệu ứng (decision 057).
5. Chuyển động là hàm của thời gian + `hash(mapId, i)`: cùng mốc thời gian chụp lại ra cùng ảnh.
6. Asset chỉ qua id → manifest. Không art mới ngoài bộ kit của vùng + hình vẽ bằng code; thiếu thì ghi `docs/ASSET_TODO.md`.

# 2. HỢP ĐỒNG CẢNH (viết trước khi code, mỗi map một mục)
Khuôn — ghi trong `docs/agent-loop/<task>/design.md` hoặc `docs/maps/diorama/<mapId>.md`:

| Mục | Ghi gì |
|---|---|
| **VẬT MỐC** | một hình chủ đạo, chiếm ≥ 1/8 khung khi đứng cạnh nó, có sự sống riêng (lay, chảy, phát sáng có chủ đích) |
| **PHẢI THẤY** | 4–6 điều kiểm được bằng ảnh: nước chảy hướng nào, cái gì đung đưa, cái gì sáng, tha hóa nặng ở đâu, lối chính đi đâu |
| **KHÔNG ĐƯỢC** | điều cấm riêng của map (vd. sương che đội, mặt nước đứng như kính) |
| **CHẤT LIỆU** | những dòng của bảng §3 dùng, tỉ lệ cây (sồi / thông / tán lớn / hoa) |
| **ÁNH SÁNG** | tâm trạng + độ lệch so với preset ngày / chiều / đêm (§5), sương xa |
| **NƯỚC** | loại (suối, hồ, thác, đầm), hướng chảy, bờ, vật trên nước |
| **SỰ SỐNG** | 3–5 nhịp so le (gió 4–6 s, chim ~17 s, đom đóm, lá, gợn) |
| **ĐIỂM NHẤN** | một thứ chỉ map này có, để 6 map không giống nhau |
| **ĐIỂM DUYỆT** | 4–6 ô cố định (xuất phát, vật mốc, trùm / tinh anh, cổng chính, tha hóa nặng nhất) + 8 chỗ rậm (`denseSpots.ts`) |

# 3. BẢNG CHẤT LIỆU & MÀU — RỪNG

| Lớp | Nguồn (kit / code) | Phải có | Cấm |
|---|---|---|---|
| Cỏ | `adv_map_forest_tile_grass_a` + shader 3 tông theo mảng, nét cọ, hoa nhỏ | 3 tông lục #6f9a45 · #5d8a3c · #86ad52 (± 8 %), mảng to 3–6 ô | một màu phẳng; lặp vân thấy được ở khung 1600 px |
| Đường đất | `adv_map_forest_tile_top` + 2 tông | nâu ấm #9a7a4f · #84653f, viền cỏ dày ở mép | sỏi chấm (đã thử, trông như bẩn) |
| Nền rừng / ô `c` | shader | rêu tối #3f5a2c, lá mục #5a4a30 | sáng hơn cỏ |
| Vách / cao nguyên | `adv_map_forest_edge_cliff`, `_end_l/_r`, `_edge_stairs` | vân lớp, mép cỏ trên đỉnh, bậc ở ô `s` | vách cao < 0,8 đơn vị khi chênh 1 cấp |
| Cây | `prop_tree_oak/fir/blossom`, `cover_canopy_big/mid/blossom` (3 lớp, nghiêng 26°) | bóng thật từ khối ẩn, gió lay theo lớp, normal "gối phồng" | bóng vẽ sẵn còn lại ở gốc; cây trôi khỏi ô `#` |
| Bụi, đá, gốc | `prop_bushes`, `prop_rocks`, `prop_stumps` | phủ ô `#` lẻ, mép rừng | bụi cao > 0,5 ô trên ô đi được |
| Nước | `tile_water`, `tile_water_deep` làm màu tham chiếu + shader | nông #6fb7b0 → sâu #2f6f80 theo khoảng cách bờ, gợn chảy đúng hướng, bọt mép thở, lấp lánh | nước đứng như kính; bọt đồng bộ cả bờ |
| Thác | `adv_map_forest_edge_waterfall` + shader | rơi liên tục, bụi nước + bọt ở chân | thác tĩnh |
| Cầu | ván code (`plankTexture`) | ván + lan can, chân đội trên mặt ván | đội lọt xuống lòng sông |
| Tha hóa | `adv_map_forest_corrupt_*` + mực code | mực đen viền tím #7a4fb0, mép nhiễu chậm, mảnh mực có hình; mật độ theo `corruption` | màn tím phẳng; mực trên lối chính dày > 30 % |
| Sáng | chỉ đom đóm, phấn / bào tử, tia rương | bloom chỉ bắt màu > 0,9 | thứ khác phát sáng |
| Sprite (đội, quái, rương) | art hiện có, tranh đứng | cùng ánh sáng cảnh, bóng tiếp đất, viền sáng nhẹ phía nguồn | sprite sáng phẳng không theo giờ |

# 4. CAMERA
- Góc 3/4 cố định: nghiêng 50–55°, ống kính 20–24°, khung ngang 28–32 ô ở 16:9. Không xoay, không lật.
- Bám đội mềm (hằng thời gian ~0,14 s), nhìn trước theo hướng đi (≤ 2,6 ô ngang, ≤ 1,6 ô dọc, mềm 0,7 s). Giảm chuyển động: bỏ nhìn trước.
- Đổi map / về chỗ save (`placeKey` đổi): đặt thẳng, không trượt.
- Không bao giờ thấy mép thế giới: viền ≥ 10 ô rừng / vách sinh bằng code, sương xa che chân trời; camera kẹp trong map.
- Không rung camera map (rung chỉ ở trận).

# 5. ÁNH SÁNG
- Ba preset gốc (`look.ts` `PRESETS`): **Ngày** (nắng ấm #ffe7c2, bóng vừa), **Chiều** (nắng #ffc488, bóng dài, đom đóm 35 %), **Đêm** (trăng lam #8fb0ff, đèn ấm quanh đội, đom đóm 100 %). Giờ lấy theo đồng hồ game.
- Mỗi map chỉ được lệch preset: bão hòa ± 0,15, ấm / lạnh ± 0,04, sương xa 0–0,6. Không đổi hướng nắng giữa các map cùng giờ.
- Đêm: đội và quái gần phải sáng hơn nền xung quanh (đèn ấm bán kính ≥ 4 ô); không vùng đi được nào tối hơn mức nhìn rõ đường đất.
- Lớp sơn tối theo giờ, lớp sáng (đom đóm, tia rương) giữ nguyên.

# 6. LUẬT THẤY ĐỘI TRONG RỪNG RẬM
1. **Vòng nhìn xuyên**: mọi tranh đứng có gốc ngang hàng hoặc trước đội (z gốc > z đội − 0,2) bị khoét tròn quanh đội trên màn hình, bán kính 20 % chiều cao khung, mép dither mịn, giữa trong hẳn; cả 3 lớp của cây dùng gốc thật.
2. **Bóng viền**: đội, đồng đội và quái trong 6 ô có bản vẽ màu ấm 50 % chỉ hiện chỗ bị vật gần hơn che.
3. Không tán / sương / mực nào che đội > 250 ms khi đang đi.
4. Kiểm bằng 8 chỗ rậm nhất mỗi map (`denseSpots.ts`): ở cả 8, dáng đội nhận ra được trong khung 800 px.

# 7. NGÂN SÁCH HIỆU NĂNG

| Máy | Mức | Yêu cầu |
|---|---|---|
| GPU rời (RTX 3050 trở lên; máy đo thật là RTX 2060, `ANIM_GPU=high`) | Đẹp | 60 FPS (giới hạn vsync) ở mọi điểm duyệt × 3 giờ; khung chậm nhất ≤ 25 ms |
| Không GPU rời = GPU tích hợp (Intel / AMD, `ANIM_GPU=low`) | Nhẹ | ≥ 30 FPS trung bình ở mọi điểm duyệt |
| GPU phần mềm (SwiftShader, llvmpipe) | — | không chạy diorama: tự lùi 2D cổ điển (đo 2–4 FPS ở Nhẹ, 2026-11-19); kiểm bằng test `quality.ts` |
| Mọi máy | — | dựng map ≤ 1,5 s (RTX) / ≤ 4 s (không GPU); đổi map 6 lần không tăng bộ nhớ GPU (`renderer.info.memory`) quá 5 % |

**Tự lùi**: chuỗi renderer WebGL chứa `SwiftShader|llvmpipe|Software|Basic Render` ⇒ 2D cổ điển ngay. Ở Đẹp, đo 3 s sau 2 s khởi động: < 45 FPS ⇒ Nhẹ. Ở Nhẹ < 24 FPS trong 5 s, mất WebGL context, hoặc dựng quá 6 s ⇒ 2D cổ điển trong phiên. Kết quả dò chỉ giữ trong bộ nhớ.

# 8. THƯỚC CHẤM (5 TIÊU CHÍ × 0–2 = 10, bước 0,5)

| # | Tiêu chí | 2 điểm khi | 1 điểm khi | 0 khi |
|---|---|---|---|---|
| 1 | Đúng hợp đồng cảnh | vật mốc + **mọi** mục PHẢI THẤY + điểm nhấn thấy được ở ảnh điểm duyệt; không vi phạm KHÔNG ĐƯỢC | thiếu 1 mục PHẢI THẤY hoặc vật mốc nhỏ / không sống | thiếu vật mốc hoặc ≥ 2 mục, hoặc vi phạm KHÔNG ĐƯỢC |
| 2 | Đọc được lối đi | ảnh xám vẫn tách đi được / chặn; luật khớp ô §1.2 qua test 100 %; đội và quái nổi khỏi nền ở mọi điểm duyệt + 8 chỗ rậm | lối rõ nhưng có chỗ mép lệch 0,25–0,5 ô hoặc 1 chỗ rậm đội khó thấy | ô chặn không có vật, vật chặn trên ô đi được, hoặc đội mất hút |
| 3 | Sống | gió theo lớp, nước chảy, ≥ 3 nhịp so le, không vùng ¼ khung nào đứng yên, xem trên **ảnh động đi bộ** | sống nhưng có vùng ¼ khung đứng yên, hoặc nhịp đồng bộ | cảnh tĩnh |
| 4 | Chất liệu & màu | đúng bảng §3, sprite cùng ánh sáng cảnh, 3 giờ đều đẹp, không cháy trắng | 1 lớp lệch bảng (vd. mặt đất nghèo chi tiết) hoặc 1 giờ xấu | sai bảng ở ≥ 2 lớp, sprite "dán lên" |
| 5 | Hiệu năng & an toàn | đạt §7 cả hai máy, không chớp, không che đội | thiếu ≤ 10 % ngân sách ở 1 điểm | dưới ngân sách rõ, hoặc chớp / che đội |

- **Ngưỡng ĐẠT: tổng > 7,5** (tức ≥ 8), không tiêu chí nào < 1, tiêu chí 2 ≥ 1,5.
- Chỉ xem ảnh tĩnh ⇒ tiêu chí 3 tối đa **1,5**, ghi rõ. Muốn 2 phải xem ảnh động đi bộ của chính map đó.
- Map sau không thấp hơn map trước cùng vùng. Điểm của chủ dự án là điểm cuối.

# 9. QUY TRÌNH BẰNG CHỨNG
1. Chụp **sau lần sửa cuối** (sửa code sau khi chụp ⇒ chụp lại):
   - `npx tsx scripts/maps/dioramaShots.ts --base <admin url> --map <mapId> --out art_inbox/diorama_shots/<mapId>/<lô> --gpu` — mọi điểm duyệt × ngày / chiều / đêm, 1600 × 900, kèm FPS mỗi điểm.
   - `npx tsx scripts/maps/denseSpots.ts --map <mapId>` rồi `dioramaShots.ts --spots` — 8 chỗ rậm.
   - `npx tsx scripts/maps/dioramaWalk.ts --map <mapId>` — ảnh động đi bộ ≥ 20 s qua vật mốc và một khu rậm.
   - Lặp lại phần FPS không có `--gpu` ở mức Nhẹ.
2. Contact sheet cỡ đầy đủ: `docs/maps/diorama/<mapId>_times.jpg`, `<mapId>_dense.jpg`. Không kết luận từ ảnh thu nhỏ.
3. **Người chấm độc lập** (agent reviewer, không phải người code) chấm §8 trên bằng chứng, ghi `docs/maps/diorama/SCORES.md` (Map · Điểm từng tiêu chí · Tổng · Thấy gì · Còn yếu · ảnh động có / không).
4. Dưới ngưỡng ⇒ sửa, chụp lại, chấm lại. `npm run check` xanh trước commit.
