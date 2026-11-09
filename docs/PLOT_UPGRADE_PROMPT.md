# Prompt: triển khai Level 100, nâng cấp tầng/khu, đúc khuông (dán vào session mới)

Cách dùng: mở session mới trong thư mục dự án, rồi dán **phần nằm giữa hai đường kẻ `---` dưới đây**. Trước khi dán, xem lại bảng "Mặc định" (mục B): sửa ngay trong prompt nếu muốn khác.

---

Bạn là agent triển khai tính năng cho Sobi World. Chủ dự án đã duyệt **mở băng gameplay tạm thời** (decision 021) cho đúng ba hạng mục dưới đây; làm xong thì **đóng băng lại**. Không mở rộng sang việc khác.

## A. Đã được chủ dự án chốt (không bàn lại)
1. **World Level tối đa 100** (hiện 20).
2. **Nâng cấp theo tầng mây (Cloud) / khu đất (Garden)**, không theo từng ô. **Nâng bậc thì môi trường quanh tầng/khu cũng nâng cấp** (trang trí, vật mốc, chuyển động).
3. **Tên bậc đặt riêng cho từng khu**, tên hay, gốc.
4. **Đúc khuông**: trả bằng **Gems hoặc Sobi Coin** (người chơi chọn).
5. Mở băng chỉ tạm thời: cuối việc ghi decision **đóng băng lại**.

## B. Mặc định theo khuyến nghị nghiên cứu (áp dụng; mọi con số nằm trong `content/`, sửa được ở Admin)
| Chủ đề | Mặc định |
|---|---|
| Level 100 | Giữ nguyên bảng cấp 1–20 và mọi cổng hiện có; nối cấp 21–100: XP để lên cấp n = `4000 + 300 × (n − 21)` (cấp 100 = 1.335.135 XP, ~13 tháng với bot 3 phiên/ngày) |
| Thưởng cấp 21–100 | Mỗi cấp: Sobi Coin `1000 + 100 × (n − 21)` + 1 Gem; mỗi 10 cấp (30…100): thành tựu mới 20–50 Gems; dữ liệu trong content, không hard-code |
| Số bậc | 5 bậc / tầng hoặc khu (bậc 1 = hiện tại) |
| Tên bậc | Cloud: Mây Bông · Mây Sương Sớm · Mây Lụa Trời · Mây Ngọc Trai · Mây Thiên Quang. Garden: Đất Vườn · Đất Mùn Tơi · Đất Phù Sa · Đất Hoàng Thổ · Đất Ngàn Mùa |
| Lợi ích | **Chỉ +% sản lượng**: bậc 2/3/4/5 = +5/+10/+15/+20 %. Áp lúc thu hoạch: mỗi vật phẩm thu được có p% ra thêm 1, dùng `ctx.rng` (tất định, có seed). **Không** bonus EXP, **không** bonus tốc độ |
| EXP | Một lần khi nâng bậc: 50 × bậc mới; một lần khi đúc mẫu: 30 |
| Điều kiện nâng | Đủ ô của tầng/khu (tầng 1 đủ 15 ô, khu 1 đủ 24 ô); World Level: bậc 2 ≥ 12, bậc 3 ≥ 25, bậc 4 ≥ 40, bậc 5 ≥ 60 |
| Giá vàng | `base[bậc] × (1 + k × (g − 1))`, g = số thứ tự tầng/khu từ 1. Cloud base 3.000 / 9.000 / 24.000 / 60.000, k = 0,2. Garden base 4.000 / 12.000 / 32.000 / 80.000, k = 0,4 |
| Vật phẩm (Cloud, mỗi tầng) | bậc 2: 30 hoa thường · bậc 3: 10 hoa hiếm + 20 vảy · bậc 4: 30 vảy + 10 bánh răng cổ · bậc 5: 2 ngọc trai + 1 rune cổ + 10 hoa EPIC/LEGENDARY |
| Vật phẩm (Garden, mỗi khu) | bậc 2: 40 nông sản thường + 20 phân bón · bậc 3: 30 vảy + 20 thảo mộc rừng · bậc 4: 15 bánh răng cổ + 20 nanh thú · bậc 5: 3 ngọc trai + 2 rune cổ + 50 hướng dương |
| Nâng cấp trả Gems? | **Không** (GAME_BALANCE §8: Gems không mua sức mạnh). Chỉ xu + vật phẩm |
| Đặc quyền bậc 5 | Cloud: mỗi lần tưới ô trong tầng có 25% không tốn Nước tinh khiết (rng). Garden: cây trong khu héo sau 72 giờ thay vì 48. **Làm cuối cùng, bỏ được** nếu rủi ro với `simulate()` |
| Môi trường theo bậc | Chỉ trình bày. Bậc 2: viền hoa / hàng rào, lối lát. Bậc 3: vật mốc riêng theo tên tầng/khu xuất hiện. Bậc 4: đèn, ánh đêm, sinh vật nhỏ. Bậc 5: điểm nhấn lớn (Cloud: thác mây, vầng sáng; Garden: cây cổ thụ / chợ quê nhỏ). Xếp lớp lên nền hiện có, không vẽ lại nền mỗi bậc |
| Đúc khuông | Mở khóa **mẫu ngoại hình vĩnh viễn**, **chỉ thẩm mỹ**, không ngẫu nhiên, không thất bại. Mỗi mẫu có bản mây + bản đất. Áp theo **tầng/khu** (không theo ô). Bậc hiện bằng viền / huy hiệu phủ lên mẫu |
| Mẫu v1 (4 mẫu, tên tạm) | Rừng Xanh (thảo mộc rừng + nanh thú + nông sản; mở khi hạ trùm vùng Rừng) · Biển Ngọc (vảy + ngọc trai; mở khi Codex có ≥ 10 loài cá) · Pha Lê (quặng núi + Mẫu Đơn Pha Lê; mở khi phòng lai đã cho ra Mẫu Đơn Pha Lê) · Tinh Tú (hoa đêm + rune cổ; mở ở World Level 30). Không làm chủ đề núi lửa |
| Giá đúc | Nguyên liệu cố định + **X xu hoặc Y Gems**, tỉ giá **1 Gem = 500 xu** (ví dụ mẫu thường 10.000 xu hoặc 20 Gems; mẫu hiếm 30.000 hoặc 60) |
| Đúc tức thì | Có (không thời gian chờ) |
| Codex / World Development | Mẫu và bậc **không** tính vào Codex hay World Development |

## C. Đọc trước
1. `docs/AGENT_RULES.md`, `docs/PROGRESS.md`, `CLAUDE.md`.
2. `docs/research/PLOT_UPGRADE_FORGING_RESEARCH.md` (nhất là §1 hiện trạng, §4 kinh tế, §10 cập nhật), `docs/research/WORLD_LEVEL_100_PROPOSAL.md`. `docs/research/AREA_LAYOUT_ANIMATION_PROPOSAL.md` chỉ đọc §3 C6 (môi trường theo bậc). Phần layout lớn của các khu **không** thuộc việc này.
3. Code chính: `src/systems/plants/plot.ts`; Cloud `src/areas/cloud/logic/{state,derived,simulate}.ts`, `actions/{plants,buildings,kit}.ts`, `ui/cloudVm.ts`, `scene/{CloudScene,cloudTierBar,cloudView}.ts`; Garden tương ứng (`viewedZone.ts`, `gardenZoneVm.ts`); `src/core/progression/{levels,xp}.ts`, `content/shared/progression.json` + `content/schemas/shared/progression.ts` (độ dài `xp` phải bằng `maxLevel`); `src/core/save/world.ts` + migrations; `content/shared/achievements.json`; `ui/components/shopGrid.ts`; `tools/admin/`.

## D. Bắt đầu
1. `git status`. Trên cây làm việc đang có: thay đổi "uốn cây theo thân" chưa commit (Cloud/Garden scene, `systems/animation`, `tools/admin/plantLab*`, `docs/PROGRESS.md`, `.claude/launch.json`), thư mục `docs/research/` và file này chưa track, và `art_inbox.rar` (**không commit, không đụng**).
2. Tạo nhánh `feature-plot-upgrade` từ nhánh hiện tại. Chạy `npm run check`; nếu xanh (trừ test hỏng sẵn), commit gói "uốn cây" riêng một commit, rồi commit `docs/research/` + file prompt này một commit.
3. Chạy `npx vitest run` một lần, ghi các test đang hỏng sẵn (đã biết: 2 test `tests/scripts/studio.test.ts` vì thiếu tag `pre-unity-studio`) vào `docs/PLOT_UPGRADE_LOG.md`, để không đổ lỗi nhầm.
4. Viết **decision 056** (`docs/decisions/056-plot-upgrade-level-100.md`): mở băng tạm thời, phạm vi đúng mục A, các mặc định mục B, trạng thái "Đang làm". Thêm một dòng lưu ý vào đầu decision 021 trỏ tới 056.

## E. Các bước (mỗi bước: test, `npm run check` xanh, commit riêng, tick vào log)
1. **Level 100**
   - Nối bảng XP tới 100 (giữ nguyên 20 phần tử đầu). Thêm bảng thưởng cấp vào content + schema, phát qua sổ cái (Transaction) và sự kiện.
   - Save cũ: XP đổi thẳng ra cấp mới. Lần chạy đầu chỉ **một** thông báo tóm tắt + thưởng các cấp đã vượt, phát một lần (không spam toast, không phát lại khi tải lại save).
   - Thành tựu cấp 30…100. HUD (huy hiệu ngôi sao 3 chữ số, chữ "Cấp cao nhất", thanh XP), Admin sửa bảng cấp và thưởng. Grep mọi chỗ giả định cấp 20.
   - Test: `levelFromXp` với bảng dài, thưởng không phát trùng, save thật cũ.
2. **Logic nâng cấp tầng/khu**
   - Content + schema (bậc, tên, giá, vật phẩm, cổng cấp, bonus) trong `content/cloud/`, `content/garden/`.
   - Save: Cloud slice v2 → v3 (`tierLevels`), Garden v1 → v2 (`zoneLevels`), có migration và test với save thật; vắng = bậc 1.
   - Hành động `upgradeTier` / `upgradeZone`: kiểm đủ ô, cấp, xu, vật phẩm; trả qua sổ cái với loại riêng (`CLOUD_TIER_UPGRADE`, `GARDEN_ZONE_UPGRADE`); phát sự kiện; nối sự kiện thế giới.
   - Bonus sản lượng áp **trong hành động thu hoạch** (`harvestFlowers` sau `pickYield`, thu hoạch Garden sau `harvestYield`) bằng `ctx.rng`. **Không đổi `simulate()`**. Sự kiện thu hoạch có thêm số "bội thu".
   - Test: cổng, chi phí, không âm tiền, tất định theo seed, kỳ vọng ≈ p trên nhiều lần thu, migration.
3. **UI nâng cấp + Admin**
   - Banner tầng (`cloudTierBar`) / thanh khu Garden hiện bậc + nút Nâng cấp (chỉ hiện khi đủ điều kiện mở).
   - Hộp thoại Trước / Sau, chi phí có / cần, nơi kiếm vật phẩm; nút luôn nói lý do bị tắt.
   - Thẻ ô thêm dòng bậc + bonus. Chuỗi trong `src/i18n/` (vi + en).
   - Phản hồi qua `FeedbackDirector`. Trang Admin sửa bảng bậc.
4. **Môi trường theo bậc (trình bày)**
   - Lớp trang trí theo bậc + vật mốc từng tầng (10) / khu (4) trong `CloudScene` / `GardenScene`. Asset qua id → manifest; chưa có ảnh thì dùng placeholder.
   - Chuyển động bằng tween / hạt / `breezeAt`; tắt khi "Giảm chuyển động"; có đường lui khi không có WebGL.
   - Ghi nhu cầu ảnh vào `docs/ASSET_TODO.md` và soạn một file batch trong `asset/batches/` (mô tả, cỡ, tên id) để chủ dự án tạo ảnh. **Không** tự tạo ảnh, **không** sửa ảnh trong `asset/`.
5. **Đúc khuông**
   - Content `content/shared/plotSkins.json` + schema: mẫu, bản mây / bản đất, nguyên liệu, giá xu / Gems, điều kiện mở bản thiết kế.
   - Sở hữu mẫu lưu ở **world save** (v12 → v13, migration + test save thật), ví dụ `cosmetics.plotSkins: string[]`. Mẫu đang áp: trong slice Cloud / Garden theo tầng/khu (gộp vào migration của bước 2 nếu chưa phát hành).
   - Hành động `forgePlotSkin` (chọn trả xu hoặc Gems, qua sổ cái; Gems qua `changeCurrency`), `applyPlotSkin`.
   - UI "Xưởng đúc khuông" dùng lại `shopGrid` (đã có / đúc được / chưa mở + gợi ý cách mở); dải chọn mẫu xem trước trên tầng/khu đang xem.
   - Admin cho danh sách mẫu. `npm run items:audit` phải sạch.
6. **Kinh tế**
   - Thêm vào bot (`scripts/economy/`) hành vi nâng bậc và đúc mẫu một cách thận trọng.
   - Chạy `npm run sim:week -- 7 60` và `-- 7 120`, so với trước khi làm: thời điểm lên cấp, vàng / Gems cuối, tổng chi cho nâng cấp / đúc. Ghi bảng so sánh vào log.
   - Chỉnh số trong content nếu lệch rõ (ví dụ bậc 2 không mua nổi trước ngày 40, hoặc max hết trước ngày 120). Ghi số cũ → mới và lý do.
7. **Đặc quyền bậc 5** (tùy chọn, mục B). Garden chống héo phải giữ đúng tính tất định của `simulateGarden` (lát nhỏ = nhảy dài) và có test. Không ổn thì bỏ, ghi lý do.
8. **Kết thúc**
   - Rà tên mới theo `docs/IP_AUDIT_PROMPT.md`.
   - `npm run check`, `npm run guard`, `npm run items:audit`.
   - Chạy game trong **sandbox riêng** (thêm cấu hình mới trong `.claude/launch.json` chép từ `sandbox-max`, không dùng sandbox chung, không đụng save thật): thử nâng bậc, thu hoạch có bội thu, đúc trả xu và trả Gems, áp mẫu, giảm chuyển động, console sạch; chụp màn hình.
   - Cập nhật README thư mục có thay đổi, `docs/GAME_BALANCE.md` (mục cấp + mục mới), `docs/PROGRESS.md`.
   - **Đóng băng lại**: decision 056 chuyển "Đã làm, đóng băng lại", liệt kê luật mới vào danh sách đã đóng băng (cấp 1–100, 5 bậc tầng/khu, đúc mẫu thẩm mỹ); con số vẫn chỉnh được như quy định của decision 021.

## F. Cách làm việc
- Chỉ hỏi chủ dự án khi phải đổi một điều ở mục A hoặc phạm vi lớn hơn. Chỗ mơ hồ khác: chọn phương án hợp lý nhất → hấp dẫn nhất → dễ làm nhất (AGENT_RULES §6), ghi vào `docs/PLOT_UPGRADE_LOG.md`.
- Kẹt sau nỗ lực hợp lý: ghi rõ (nguyên nhân, đã thử, còn gì), làm tiếp bước khác.
- Dùng danh sách việc của ứng dụng để báo tiến độ. Khi ngữ cảnh bị tóm tắt, đọc lại log + decision 056 để biết đang ở đâu.
- Kiểm bằng việc thật (test, sandbox, ảnh chụp), không báo "xong" khi chưa kiểm. Lệnh dài chạy nền.

## G. Ràng buộc bắt buộc (CLAUDE.md, AGENT_RULES)
- `src/core/` thuần: không DOM/Node, không `Date.now()` / `Math.random()`; `now` / `rng` inject. Logic thời gian đi qua `simulate()`. Area không import Area khác.
- Tiền / Gems chỉ đổi qua helper ghi Transaction. Mọi hành động thành công phát GameEvent; hiệu ứng / âm thanh / toast chỉ qua `FeedbackDirector`.
- Chuỗi hiển thị trong `src/i18n/` (vi + en); asset chỉ qua id → manifest; comment code tiếng Anh; file LF.
- **Không làm mất save**: mọi đổi cấu trúc save có migration + test với save thật; lỗi ghi không được nuốt.
- Bản quyền (decision 048, §9): tên, hình, mô tả gốc. Không dùng ý "chậu cung hoàng đạo" hay tên / hình của game khác.
- Admin không có mặt trong bản build người chơi. Không mạng, không server.

## H. Giới hạn an toàn
- Không `git push`, không PR, không merge vào `main`, không đổi/xóa tag, không `reset --hard` / `clean` / `checkout --` trên thay đổi chưa commit, không force. Chỉ commit trên `feature-plot-upgrade`.
- Không đụng `%APPDATA%\SobiWorld` (save thật), `asset/` (trừ thêm file batch mô tả trong `asset/batches/`), `docs/archive/`, `art_inbox.rar`.
- Không cài gói mới nếu không thật cần (nếu cần: ghi lý do + giấy phép vào `docs/THIRD_PARTY.md`). Không sửa cấu hình quyền / hook của Claude Code.
- Không nới test hay xóa assert cho xanh; chỉ đổi test khi hành vi đúng đã đổi theo yêu cầu (ví dụ trần cấp 20 → 100) và nói rõ trong commit.

## I. Báo cáo cuối
Theo mẫu AGENT_RULES §7, tiếng Việt: đã làm, chưa làm (lý do), quyết định tự chọn, bảng kinh tế trước / sau, ảnh chụp, rủi ro, việc chủ dự án cần duyệt (con số, tên, ảnh cần tạo), danh sách commit. Dừng ở đó: không push, không merge.

---

## Ghi chú cho chủ dự án (không dán)
- **Đóng băng lại sau khi xong là hợp lý** và đúng tiền lệ (023, 028, 037, 053–055): mở có phạm vi rõ trong decision 056, đóng lại khi nghiệm thu; sau đó vẫn được chỉnh con số ở Admin như decision 021 cho phép. Lợi ích: art môi trường / mẫu khuông vẽ sau sẽ không phải vẽ lại vì cơ chế đổi.
- Muốn đổi mặc định ở mục B (tên bậc, % bonus, giá, cổng cấp, 4 mẫu, tỉ giá Gem), sửa trực tiếp trong bảng trước khi dán.
- Thay đổi "uốn cây" đang chưa commit: prompt cho agent commit nó thành commit riêng ở bước D2. Nếu anh muốn tự commit trước thì bỏ câu đó.
- An toàn hơn: chạy session trong **worktree riêng** để nhánh mới không động tới thư mục đang dùng (khi đó gói "uốn cây" chưa commit sẽ không có trong worktree; nên commit nó trước).
- Ảnh môi trường / mẫu khuông: agent chỉ soạn batch trong `asset/batches/`; anh tạo ảnh Gemini như các batch trước, rồi giao lại để cắt và nối vào game.
- Đề xuất layout lớn cho 6 khu (`docs/research/AREA_LAYOUT_ANIMATION_PROPOSAL.md`) là việc GĐ14 riêng, chưa nằm trong prompt này.
