# IP AUDIT REPORT — Pha 1 (chỉ báo cáo, chưa sửa gì)

Ngày: 2026-11-04 · Nhánh: `phase-14-art` · Quy trình: `docs/IP_AUDIT_PROMPT.md`

**Phạm vi đã quét:** `content/` (species, enemies, lineages, fish, flowers, crops, skills, items, NPC, festivals), `content/i18n/en.json`,
`src/`, `tests/`, `scripts/`, `tools/`, `docs/`, `asset/` (catalogue, reference), `art_inbox/.batch` (prompt), manifest + license âm thanh, font, package.json.
Đã xem trực tiếp ảnh: pig_superhero, pig_thor, pig_battlebot, pig_zeus, pig_valkyrie, pig_poseidon, fish_clownfish, fish_blue_tang.
**Chưa quét được / hạn chế:** ~1.780 file ảnh trong `public/assets` chỉ xem mẫu ở trên, chưa xem từng ảnh; ảnh trong `art_inbox/` (2,3 GB) và `asset/reference` chưa xem từng ảnh; chưa kiểm tra bản `vi.ts` từng chuỗi ngoài `nameVi`; không kiểm tra được tra cứu nhãn hiệu thật (cần luật sư/tra cứu chính thức).

## A. Tóm tắt theo loại

| Loại | Số mục | Rủi ro cao | Trung bình | Thấp/cần xác minh |
|---|---|---|---|---|
| Heo (species) | 6 | 1 (Thor) | 2 (Superman, Battlebot) | 3 (Zeus, Poseidon, Valkyrie) |
| Heo định làm, chưa làm (catalogue) | ~8 | 0 | 1 (Loki) | 7 (Hades, Athena, Medusa, Minotaur, Frankenstein, Steampunk, Elf) |
| Cá (aquarium) | 2 | 0 | 2 (Clownfish, Blue Tang: giống Nemo/Dory) | 0 |
| Quái (enemies) | 5 | 0 | 0 | 5 (Old Treant ×1 + Nightmare Treant, Mimic ×4) |
| Âm thanh | 1 | 0 | 0 | 1 (nhạc Mureka AI) |
| Font / thư viện | 1 | 0 | 0 | 1 (Baloo 2, cần ghi license) |
| Thiếu hồ sơ | 1 | 0 | 0 | 1 (chưa có `docs/THIRD_PARTY.md`) |

Không thấy: tên game/nhân vật/thương hiệu nổi tiếng nào khác trong code, i18n, content, tên app (`com.sobiworld.game`).
Tên nhà (Lân, Ông Địa, Tết, Bánh Chưng, Áo Dài), tên skill, tên hoa, cây trồng, dòng (lineage) đều là nội dung gốc/văn hóa dân gian, không nghi vấn.

## B. Chi tiết

| # | id / tên | File | IP bị nghi | Lý do | Rủi ro | Đề xuất |
|---|---|---|---|---|---|---|
| 1 | `PIG_THOR` / "Heo Thor" / `pig_thor` | `content/farm/species.json`, `content/adventure/lineages.json:103`, i18n, `ids.generated.ts`, `tests/scripts/content.test.ts`, manifest, 3 PNG `pig_thor*`, ult cut-in A08 (`art_inbox/.batch/...A08_ult_cutin.md`, `adventure-13-combat-poses`), `docs/ASSET_TODO.md` | Marvel "Thor" | Tên trùng + ảnh: mũ có cánh, áo choàng đỏ, búa phát sáng xanh = đặc điểm nhận diện phim/truyện Marvel (thần Thor thần thoại Bắc Âu là public domain, nhưng bản thiết kế này nghiêng về hình Marvel) | **CAO** | Đổi tên + thay art: thành "Heo Sấm" (thần sấm gốc, không búa nhận diện, không mũ cánh + áo choàng đỏ). Giữ lineage Lôi Dương |
| 2 | `PIG_SUPERMAN` / "Heo Siêu Nhân"; `artId pig_superhero` | species, breeding.json (4 công thức), `dialogs.ts:21`, i18n, ids, tests ×5, `save/legacy.ts`, `scripts/art/pigs.ts`, `cut-reference.ts`, manifest, 3 PNG | Superman (DC) | Id code trùng nhãn hiệu; art: áo choàng đỏ + dải ruy-băng đỏ trên thân xanh tím, tư thế đứng hero. Không có logo "S" nên nghiêng nhẹ, nhưng id và "cape đỏ" gây liên tưởng | **TRUNG BÌNH** | Đổi id (`PIG_HERO`), giữ tên "Heo Anh Hùng"; sửa lại màu/trang phục (bỏ cape đỏ, đổi mặt nạ + khăn quàng màu khác). Cần migration save |
| 3 | `PIG_BATTLEBOT` / "Heo Battlebot" / `pig_battlebot` | species, i18n, ids, `scripts/assets/eyes.ts`, manifest, 3 PNG | BattleBots (thương hiệu chương trình TV/robot chiến đấu) | "Battlebot(s)" là nhãn hiệu; art robot xám có kìm/vũ khí, khá chung chung | **TRUNG BÌNH** (tên) | Đổi tên/id (`PIG_WARBOT`/"Heo Robot Chiến"), art giữ. Cần migration save |
| 4 | `fish_clownfish` / "Cá Hề" | `content/aquarium/fish.json`, hybrids, swimStyles, tests, `props/fish_clownfish.png` | Finding Nemo (Disney/Pixar) | Cá hề cam-trắng viền đen là loài thật; art cam + 3 sọc trắng kiểu hoạt hình, mắt to rất giống Nemo | **TRUNG BÌNH** (chỉ art) | Giữ tên (loài thật). Vẽ lại: bớt "Nemo-like" (đổi tỉ lệ vây, màu hơi lệch, bỏ vây nhỏ bên ngực trái), tránh đúng biểu cảm |
| 5 | `fish_blue_tang` / "Cá Đuôi Gai Xanh" | `fish.json`, hybrids, swimStyles, `props/fish_blue_tang.png` | Dory (Disney/Pixar) | Xanh dương + đuôi vàng + vệt đen = đúng phối màu Dory | **TRUNG BÌNH** (chỉ art) | Giữ tên. Đổi art: bỏ đuôi vàng/vệt đen đặc trưng hoặc thay bằng loài khác |
| 6 | `PIG_ZEUS`, `PIG_POSEIDON`, `PIG_VALKYRIE` | species, i18n, ids, assets, 6 ảnh chiến đấu `cb_pig_*` | Thần thoại Hy Lạp/Bắc Âu | Thần thoại là public domain; nguy cơ chỉ khi art giống bản Marvel/God of War/Disney (Hercules). Ảnh thấy: vương miện + sét; vua + đinh ba; mũ cánh + giáo, thiết kế khá chung chung | THẤP | Giữ, kiểm tra lại art không copy IP cụ thể |
| 7 | `enemy_old_treant`, `rift/nightmares Treant`, title "Soother of the Old Treant" | `enemies.json`, i18n, zones, lore | Treant (D&D/Warcraft dùng; xuất phát từ Ent của Tolkien) | Từ đã phổ thông trong fantasy nhưng nguồn gốc từ Tolkien/D&D | THẤP | Giữ hoặc đổi sang "Cổ Thụ"/"Old Rootkeeper" để chắc |
| 8 | `enemy_mimic_*` ×4 "Rương Giả" | enemies, props, `adv_map_chest_mimic*` | Mimic (D&D) | Khái niệm rương giả đã phổ biến chung, tên Việt gốc | THẤP | Giữ. Đổi id `mimic` → `fake_chest` nếu muốn tuyệt đối sạch |
| 9 | Heo định làm: `pig_loki`, `pig_hades`, `pig_athena`, `pig_medusa`, `pig_minotaur`, Frankenstein, Steampunk, Elf (catalogue) | `asset/animals/sobi_farm/PIG_CATALOGUE.md` (chưa thiết kế) | Loki = Marvel (mũ sừng + áo xanh lá, đúng nhân vật phim); Frankenstein = Universal | Loki mô tả đúng hình Marvel | Loki TRUNG BÌNH; còn lại THẤP | **Chặn** trước khi làm: bỏ Loki; viết lại mô tả Frankenstein/Hades (tránh mô tả "Dark cape, flame motif" giống Hades Disney) |
| 10 | `acc_head_superhero_mask` (catalogue) | PIG_CATALOGUE.md:688 | Superhero chung | Chưa làm | THẤP | Làm kiểu gốc |
| 11 | `music_farm` | `asset/music/music-bg.mp3`, `scripts/generate-art.ts:20-21`, manifest | Nhạc sinh bằng Mureka AI | License ghi "theo điều khoản gói Mureka của chủ dự án" — chưa có bằng chứng lưu về gói trả phí/quyền thương mại; AI nhạc có nguy cơ giống bài có sẵn | Cần xác minh | Lưu ảnh chụp điều khoản + gói; kiểm tra gói cho phép thương mại; nghe thử so với bài nổi tiếng |
| 12 | SFX | `scripts/art/sfx.ts` | — | Tự tổng hợp, "Original work" | An toàn | Giữ |
| 13 | Font `@fontsource/baloo-2` | package.json | Baloo 2 (OFL) | OFL cho phép dùng thương mại nhưng cần ghi nguồn/license | Cần ghi hồ sơ | Ghi vào `docs/THIRD_PARTY.md` |
| 14 | Thư viện npm (phaser, idb, zod; dev: electron...) | package.json | — | MIT/Apache thông thường; chưa có file tổng hợp | Cần ghi hồ sơ | Tạo `docs/THIRD_PARTY.md`, chạy license-checker |
| 15 | Tên "Sobi World"/"Sobi" | app id, productName | Nhãn hiệu trùng | Chưa tra cứu | Cần xác minh | Tra cứu nhãn hiệu (VN/US/EU, nhóm 9/41) trước phát hành |

## C. Ảnh hưởng nếu xử lý

| Mục | Gameplay | **Save người chơi** | Content/code/test | Asset | Admin/docs |
|---|---|---|---|---|---|
| #1 Thor | Đổi tên + art. Lineage `loi_duong` giữ nguyên | Id `PIG_THOR` đổi → **cần migration/alias** (nếu cho đổi id). Tên hiển thị không cần migration | species, lineages:103, i18n, ids.generated, `content.test.ts` | Thay 3 PNG `pig_thor*`, `cb_pig_thor_*` (6 ảnh chiến), manifest, ult cut-in A08 | `ASSET_TODO.md` (A08), prompt art_inbox, catalogue |
| #2 Superman | Đổi tên/art, công thức lai giữ nguyên | Id `PIG_SUPERMAN` có thể nằm trong save → **cần migration**; `save/legacy.ts` đang tham chiếu `pig_superhero` | species, breeding.json (4 công thức), `dialogs.ts:21`, i18n, ids, 5 test | 3 PNG, manifest, `scripts/art/pigs.ts`, `cut-reference.ts` | Catalogue |
| #3 Battlebot | Chỉ tên | Id có thể trong save → **cần migration** | species, i18n, ids | `scripts/assets/eyes.ts`, manifest | Catalogue |
| #4–5 Cá | Không đổi | Không | Không | Vẽ lại 2 ảnh `props/fish_*`, manifest | Prompt art |
| #7–8 Treant/Mimic | Chỉ tên (nếu đổi) | Không (đổi id quái không vào save, **cần kiểm tra** codex/bestiary đã mở) | enemies, i18n, zones, maps lore, tests | Có thể đổi tên file | — |
| #9 Catalogue | Không (chưa làm) | Không | Không | Không | Sửa PIG_CATALOGUE.md |
| #11–15 | Không | Không | Không | Không | Tạo `THIRD_PARTY.md`, ghi nguồn |

## D. Phương án thay thế gốc

- **Thor → "Heo Sấm"**: heo xám-xanh, hai sừng/lông xù như mây giông, vòng tia chớp quanh chân, chùy tròn hình đám mây (không búa, không mũ cánh, không áo choàng đỏ). Giữ tinh thần Lôi Dương.
- **Superman → "Heo Anh Hùng"**: khăn quàng dài màu vàng chanh + kính bay (goggles) + giày cao, **không cape đỏ, không logo chữ cái**.
- **Battlebot → "Heo Chiến Giáp"**: giữ art robot, bỏ chữ Battlebot ở mọi nơi.
- **Loki → bỏ**, thay bằng "Heo Ảo Thuật" (mũ phù thủy tinh nghịch, áo xanh bạc hà).
- **Cá hề/Cá Đuôi Gai Xanh**: giữ loài thật nhưng vẽ lệch phối màu/hình dáng đặc trưng (ví dụ cá hề có sọc vàng-trắng; cá tang xanh-tím đuôi trắng).

## E. Thứ tự xử lý đề xuất

1. #1 Thor (cao) → 2. #2 Superman → 3. #3 Battlebot (cùng đợt migration id) → 4. #9 chặn Loki → 5. #4–5 vẽ lại cá → 6. #11–15 hồ sơ (`THIRD_PARTY.md`, license nhạc, tra nhãn hiệu) → 7. #6–8 (thấp) tùy chủ dự án.
Khối lượng: nhỏ–vừa (≈ 12 file content/code, ~20 ảnh, 1 migration save, vài test).

## F. Cần chủ dự án quyết

1. Cho đổi **id** (cần migration save) hay chỉ đổi tên hiển thị + art và giữ id cũ nội bộ? (Giữ id nội bộ an toàn cho save hơn, nhưng id `PIG_THOR`/`PIG_SUPERMAN` vẫn nằm trong code/save/file; id này không hiển thị cho người chơi.)
2. #6 (Zeus/Poseidon/Valkyrie), #7 (Treant), #8 (Mimic): giữ hay đổi?
3. Nhạc `music_farm`: có bằng chứng gói Mureka cho phép thương mại không? Nếu không chắc → thay nhạc.
4. Có tra cứu nhãn hiệu "Sobi World" chưa?
5. Duyệt các tên thay thế ở mục D hay chọn tên khác?
