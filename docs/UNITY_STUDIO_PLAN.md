# Sobi Studio — dùng Unity tạo lại toàn bộ asset và animation

> **KHÔNG CÒN HIỆU LỰC (2026-11-11):** decision 058 bỏ Unity, thay bằng animation / VFX bằng code Phaser. Tài liệu giữ làm lịch sử.

**Trạng thái:** ĐÃ DUYỆT 2026-11-07 — `docs/decisions/051-unity-studio.md`. Chủ dự án giao agent tự quyết mọi mục
§10 (đã chốt ở §10) và làm từ đầu tới cuối; chủ dự án chỉ cài đặt và duyệt kết quả. Yêu cầu bắt buộc thêm: **dễ chỉnh
sửa, dễ cập nhật, dễ mở rộng** (§12).
Nhánh: `phase-14-unity-studio` (tách từ `phase-14-art`). Điểm quay lại hướng cũ: tag `pre-unity-studio`.
Decision 051 thay các phần liên quan của decision 017 / 022 (phong cách chuẩn Sobi Farm, ảnh Gemini do chủ dự án
render) và decision 050 (nguồn tranh của rig). Mọi luật khác trong `CLAUDE.md` / `docs/AGENT_RULES.md` giữ nguyên.

---

## 0. Tóm tắt

- **Unity là xưởng làm art chạy offline** (gọi là *Sobi Studio*), **không đi kèm game**. Game vẫn là Electron + Vite +
  TypeScript + Phaser. Game chỉ nhận **PNG + JSON** qua manifest như hiện nay, không có dòng code Unity nào trong `src/`.
- **Agent làm tất cả:** dựng hình, tô màu, rig, animation, VFX, render, nạp vào game, kiểm. **Chủ dự án chỉ cài đặt
  (mục 5) và duyệt ở các cổng (mục 6).**
- **Mọi asset được sinh ra từ một "công thức" (recipe) dạng văn bản.** Đổi một quy tắc phong cách là render lại được cả
  game. Nhờ vậy các asset luôn đồng bộ với nhau, và mọi thay đổi đều diff / review / revert được.
- **Điều phải biết trước:** agent không vẽ tay. Trong Unity, agent chỉ tạo được hình **3D dựng bằng code rồi render
  kiểu toon ra ảnh 2D**. Phong cách game vì thế sẽ **đổi khác** tranh Sobi Farm hiện tại: khối tròn mềm kiểu đất nặn /
  đồ chơi, tô 2–3 bậc sáng, viền nâu. **Cổng U1** (mục 7) là để chủ dự án nhìn mẫu thật trong game trước khi cam kết làm
  lại toàn bộ.

## 1. Vì sao đổi

| Vấn đề hiện tại (ảnh Gemini) | Sobi Studio giải quyết thế nào |
|---|---|
| Mỗi bộ asset một kiểu vẽ: nét viền, cách tô, góc nhìn, độ nét khác nhau (ví dụ Hộ Pháp / chuồng heo / nền bãi biển) | Một bộ shader, bảng màu, ánh sáng và góc camera dùng chung cho mọi asset |
| Khung animation lệch nhận diện: Gemini vẽ lại cả con ở mỗi khung (batch `rig-05`, 2026-11-07) | Mọi khung render từ cùng một mô hình nên không thể lệch |
| Phụ thuộc chủ dự án render, mỗi lần render lại kết quả một khác | Agent tự render; cùng recipe luôn ra cùng một ảnh |
| Chữ vẽ chết trong ảnh (biển "Chuồng Heo") | Không vẽ chữ vào ảnh; chữ do game hiển thị qua `src/i18n/` |
| Thêm loài / vật mới phải làm lại cả quy trình prompt | Thêm một recipe, có thể kế thừa từ recipe gần giống |

## 2. Phạm vi

Số liệu đếm từ `public/assets/manifest/assets.json` và thư mục `public/assets/` ngày 2026-11-07:

| Nhóm | Dòng manifest | File PNG | Gồm |
|---|---|---|---|
| `pigs` | 89 (5 placeholder) | 263 | Heo farm: giống, trạng thái |
| `props` | 1554 | 1628 | Key pose trận (`props/combat`, 266), layer rig (`props/rig`, 814), kit bản đồ (`props/adventure_map`, 152), cá, hoa, cây trồng, vật phẩm |
| `fx` | 117 (31 có khung) | 117 | VFX trận (`fx/battle`, 95), adventure, môi trường, fx farm |
| `buildings` | 26 | 46 | Công trình |
| `environment` | 128 | 128 | Nền, tile, cảnh adventure v3 (80) |
| `ui` | 365 (22 placeholder) | 365 | Icon, khung HUD, trạng thái |
| **Tổng** | **2279** | **2547** | |

**Ngoài phạm vi:** âm thanh (59 dòng `audio`), code gameplay, save, logic, nội dung `content/` (trừ dữ liệu rig / fx do Studio xuất ra).

## 3. Nguyên tắc (luật dự án vẫn áp dụng)

1. **Unity không đi kèm bản phát hành.** Không mạng, không server. Save không đổi.
2. **Giữ nguyên id asset.** Chỉ thay file, không đổi id, nên code và save không bị đụng. Asset vẫn đi qua id → manifest.
3. Animation / VFX trong game vẫn chạy qua GameEvent → FeedbackDirector.
4. **Bản quyền (decision 048, AGENT_RULES §9):** mọi hình dựng từ đầu bằng code của agent. **Không** dùng model,
   texture, VFX hay shader từ Asset Store hoặc nguồn ngoài. Chỉ dùng package chính thức của Unity (URP, Mathematics,
   Burst, Collections…). Ghi Unity (công cụ) vào `docs/THIRD_PARTY.md`. Recipe đặt tên theo id gốc của dự án; rà soát
   bằng `docs/IP_AUDIT_PROMPT.md` sau mỗi giai đoạn.
5. **Gameplay đã freeze (decision 021).** Không đổi logic. Nếu runtime rig hoặc FX cần nhận thêm định dạng dữ liệu
   (mục 4.5) thì phải hỏi chủ dự án trước, và mọi thay đổi phải có test.
6. **Không vẽ chữ vào ảnh.**
7. Cổng chất lượng không đổi: `npm run check` xanh, `assets:check`, chuẩn `asset/ASSET_PRODUCTION_STANDARD_v1.md`
   (cỡ canvas, điểm neo, ví dụ sinh vật trận 512 với đáy tâm (256, 492)).
8. Mọi thay đổi chuyển động phải đặt cạnh mẫu đã duyệt và soi ở độ phân giải đầy đủ trước khi báo xong (luật HANDOFF §2).

## 4. Kiến trúc pipeline

```
recipe (studio/Recipes/**/*.json, văn bản)
  → Unity chạy không giao diện (-batchmode), công cụ C# của agent
      → dựng lưới 3D từ khối SDF → material toon theo bảng màu → xương (tự sinh từ bộ phận)
      → animation (clip trong recipe) → render camera trực giao ra RenderTexture có alpha
  → art_inbox/studio/<batch>/   (PNG + meta.json: cỡ, neo, khung, hit frame…)
  → scripts/studio/import.ts    (kiểm cỡ / neo / alpha / bảng màu → public/assets + manifest + content/anim/…)
  → npm run assets:check → npm run check → kiểm trong game (sandbox / Admin / Xưởng rig)
```

### 4.1 Thư mục

| Đường dẫn | Nội dung | Git |
|---|---|---|
| `studio/` | Project Unity | có |
| `studio/Assets/Sobi/Editor/` | Công cụ C#: CLI, dựng hình, rig, render, xuất | có |
| `studio/Assets/Sobi/Shaders/`, `Palette/` | Shader toon, viền, bảng màu khoá | có |
| `studio/Recipes/` | Recipe từng asset (JSON, có schema) | có |
| `studio/Library/`, `Temp/`, `Logs/`, `UserSettings/`, `obj/` | Cache của Unity (vài GB) | **bỏ qua** |
| `studio/studio.local.json` | Đường dẫn `Unity.exe` trên máy | **bỏ qua** |
| `scripts/studio/` | TS: gọi Unity, nhập kết quả, kiểm | có |
| `docs/studio/` | Style bible, schema recipe, hướng dẫn | có |

Thêm `studio` vào danh sách bỏ qua của ESLint / Prettier / guard nếu cần. `tsconfig` hiện không quét thư mục này.

### 4.2 Gọi Unity

```
"<Unity.exe>" -batchmode -quit -projectPath studio -executeMethod Sobi.Studio.Cli.Run -logFile - -- <lệnh> <recipe…>
```

Bọc thành `npm run studio -- render pigs/pig_pink` (và `studio:import`, `studio:sheet`). Không cần mở Editor: agent xem
kết quả bằng chính các PNG xuất ra. Một lần chạy Unity tốn chi phí khởi động (vài chục giây), nên mỗi lần chạy xử lý
cả một batch recipe.

### 4.3 Dựng hình (agent tự viết)

- **Mô hình SDF:** khối cầu, con nhộng, hộp bo góc, nón, xuyến, ellipsoid; ghép mềm (smooth union), khoét, uốn, thon,
  đối xứng. Tạo lưới bằng marching cubes / dual contouring rồi làm mượt. Cách này hợp với chibi tròn mềm.
- **Bộ phận có tên** (`body`, `head`, `ear_l`, `tail`, `wing_l`, `fin_tail`…) **tự thành xương** cho animation.
- **Màu:** bảng màu khoá (khoảng 40–48 màu, chốt ở U2), vùng màu theo bộ phận. Hoạ tiết sinh bằng thủ tục có seed
  (đốm, sọc, vảy, vân gỗ, ngói) trong shader.
- **Mắt / miệng:** decal 2D vẽ bằng hình học trong code, có các biểu cảm `open / closed / half / happy / hurt / angry /
  dizzy` và `neutral / grit / cry…`, khớp các khe `eyes` / `mouth` của rig hiện có.
- **Đồ vật, công trình:** kit module thủ tục (ván gỗ, ngói, đá, cỏ, hàng rào, cửa) ghép theo recipe.
- **Môi trường:** địa hình heightmap, đá, cây (L-system đơn giản), nước bằng shader; tile render liền mép theo kit bản
  đồ v2 (decision 045).

### 4.4 Tô màu và render

- URP, shader toon tự viết: 2–3 bậc sáng, rim nhẹ, **viền nâu** (vỏ lật + dò cạnh hậu kỳ), sáng từ trên trái. Không
  render bóng đổ thật; bóng dưới chân do game vẽ như hiện nay.
- Camera trực giao, góc chốt theo loại asset:

| Loại | Góc |
|---|---|
| Sinh vật trận, NPC | 3/4 nhìn chéo trước, quay phải (như key pose hiện tại) |
| Cá, sinh vật Aquarium | Nhìn ngang, quay phải |
| Heo farm, công trình, đồ vật, cây trồng | 3/4 nhìn từ trên xuống (~30°), chốt ở U2 |
| Tile / kit bản đồ | Theo phép chiếu của kit v2 hiện tại |
| Icon | 3/4, khung vuông |

- Render ở cỡ 2× rồi thu nhỏ (khử răng cưa). PNG RGBA alpha thẳng, kiểm viền sáng (halo). Đọc thẳng RenderTexture
  bằng script nên không phụ thuộc Unity Recorder.

### 4.5 Animation

Có ba kiểu xuất, chọn theo loại asset:

| Kiểu | Dùng cho | Chạy trong game |
|---|---|---|
| **A. Rig → JSON** | 43 sinh vật trận (25 clip chung), heo farm, NPC | Runtime puppet rig sẵn có (`content/anim/rigs/*.json` + layer PNG `props/rig/`). Studio render **từng bộ phận thành một lớp riêng**, xuất xương + clip. Phaser chạy 60 fps, tốn rất ít bộ nhớ |
| **B. Khung hình** | VFX skill, cá Aquarium, chim mây, hiệu ứng môi trường, vật động nhỏ | Sprite sheet + manifest `frames` (width / height / count / fps), như `fx_zzz` |
| **C. Tham số code** | Chuyển động đơn giản đang ổn (dải uốn cá, lơ lửng) | Giữ nguyên nếu đủ đẹp |

- Clip viết dạng văn bản trong recipe (key, easing, nhịp). Áp nguyên lý lấy đà, theo đà, nén / giãn, chồng nhịp theo
  thư viện `docs/animation/library/` và kịch bản skill đã có (decision 049).
- **Ngân sách bộ nhớ:** khung render ở cỡ hiển thị. Ví dụ cá 12 khung 192×120 ≈ 1 MB mỗi loài. Sinh vật trận phải dùng
  kiểu A: nếu dùng khung thì 25 clip × 16 khung × 512² ≈ 400 MB mỗi con, không chịu nổi.
- **Cần kiểm ở U2:** runtime rig hiện có (`parts`, `bones`, `skin`, khe `layers` của decision 050 R1b, khe `pose`) có
  đủ cho rig cắt lớp nhiều bộ phận xoay tự do không. Thiếu thì đề xuất thay đổi runtime (hỏi trước, có test).

### 4.6 VFX skill

- Particle System + mesh VFX (vòng sóng, vệt chém, cột sáng) + shader toon. Màu lấy theo 9 hệ trong bible animation;
  một hiệu ứng đổi hệ chỉ bằng tham số.
- Bake thành sheet theo chuẩn hiện có (khung 256 / 512, hạt 64 px). Ghi vòng lặp khớp và **hit frame** vào meta để
  nạp vào `battle_fx.json`.
- Thay 95 sheet `fx/battle` + fx adventure / môi trường / farm.

### 4.7 Kiểm chất lượng tự động

- Script kiểm: cỡ canvas, neo, alpha sạch, không halo, % điểm ảnh ngoài bảng màu, độ dày viền ở cỡ hiển thị, khung đầu
  ≈ khung cuối với clip lặp.
- Mỗi batch có contact sheet: asset mới đặt cạnh asset cũ, kèm ảnh chụp trong game (sandbox `sandbox-anim`, Admin,
  Xưởng rig).
- Agent xem ở độ phân giải đầy đủ trước khi báo, báo cáo theo AGENT_RULES §7 (đã kiểm gì, kiểm bằng cách nào, chưa kiểm
  gì).

## 5. Phần chủ dự án làm (chỉ cài đặt)

Agent không tạo tài khoản và không nhập mật khẩu thay chủ dự án.

1. Tạo tài khoản Unity (miễn phí), cài **Unity Hub**.
2. Trong Hub cài **bản Unity 6 LTS mới nhất**, không cần module build nào. Cần khoảng 15–20 GB trống, driver GPU mới.
3. Kích hoạt giấy phép **Unity Personal** (điều kiện: doanh thu + vốn huy động trong 12 tháng dưới 200.000 USD).
4. Báo agent đường dẫn `Unity.exe` (ví dụ `C:\Program Files\Unity\Hub\Editor\<version>\Editor\Unity.exe`).
5. Khi agent tạo xong `studio/`: mở project **một lần** trong Hub để Unity nhập và xác nhận giấy phép, rồi đóng lại.
6. Duyệt ở các cổng: xem ảnh agent gửi, trả lời đạt / không đạt kèm nhận xét.

## 6. Lộ trình

Mỗi giai đoạn: làm thử 1–2 asset → agent tự kiểm theo §4.7 (cột "Cổng duyệt" là mốc agent gửi ảnh cho chủ dự án
xem, không chờ trả lời, theo §10.1) → làm cả nhóm → một commit cho mỗi batch (revert được). Asset cũ
vẫn còn trong lịch sử git.

| GĐ | Việc | Kết quả | Cổng duyệt |
|---|---|---|---|
| **U0** | Cài đặt (mục 5); agent tạo `studio/`, CLI, render thử một khối có alpha, script nhập | `npm run studio` chạy được, PNG alpha sạch | Kỹ thuật (agent tự kiểm) |
| **U1** | **Thử phong cách**: bộ dựng SDF v0, shader toon, viền; 4 mẫu (mục 7) đặt trong game cạnh bản cũ | Ảnh trước / sau trong game | **Cổng cứng: tự chấm theo §7 / §10.1, không đạt thì dừng** |
| **U2** | Style bible bằng số (bảng màu, viền, góc, cỡ), schema recipe, kiểm runtime rig (4.5) | `docs/studio/STYLE_BIBLE.md`, decision 051 | Duyệt bible |
| **U3** | VFX skill (rủi ro thấp nhất, lợi nhiều nhất) | ~117 sheet fx | Duyệt 3 hệ đầu, rồi làm hết |
| **U4** | Aquarium (30 loài, bơi) + chim mây | Tranh + sheet bơi | Duyệt 3 loài đầu |
| **U5** | Heo farm (giống, trạng thái, đi / ăn / ngủ) | `pigs` | Duyệt 1 giống |
| **U6** | 43 sinh vật trận: 6 key pose + layer rig + 25 clip (kiểu A) | `props/combat`, `props/rig`, `content/anim/rigs` | Duyệt 2 con (một 4 chân, một 2 chân) trong Xưởng rig + Xưởng trận |
| **U7** | Đồ vật, công trình, cây trồng, hoa, vật phẩm | `props`, `buildings` | Theo Area |
| **U8** | Môi trường: nền, tile, kit bản đồ v2, cảnh adventure | `environment`, `props/adventure_map` | Theo vùng |
| **U9** | UI: icon (render từ chính mô hình vật phẩm); khung / panel (Unity hay giữ CSS: chốt khi tới bước này) | `ui` | Duyệt HUD |
| **U10** | Thay hết placeholder, dọn asset thừa, rà bản quyền, kiểm bộ nhớ / dung lượng bản build | Manifest không còn ảnh cũ | Nghiệm thu GĐ14 |

**Đề xuất thay theo Area trọn gói** (Farm, Garden, Aquarium, Cloud, Adventure, Sảnh) để người chơi không thấy hai
phong cách trộn trong cùng một màn. VFX (U3) là ngoại lệ vì dùng chung.

## 7. Cổng U1 — tiêu chí

Bốn mẫu, mỗi mẫu đặt **trong game, cạnh bản cũ**:

1. **Heo farm** (giống cơ bản): đứng yên + đi, trong chuồng.
2. **Cá Vàng** (`fish_goldfish`): bơi, trong Aquarium.
3. **Chuồng heo** (`prop_pig_house`): không chữ, biển tên do game hiển thị.
4. **VFX lửa** (`fx_flame_burst`): trong trận.

Chấm ba câu (agent tự chấm trung thực theo §10.1, gửi ảnh cho chủ dự án duyệt song song): (a) đẹp hơn bản cũ?
(b) đồng bộ với nhau hơn? (c) đáng đổi phong cách cho cả game?

- Đạt cả ba → U2.
- Không đạt sau **2 vòng chỉnh** → dừng hướng "tạo lại tất cả". Lúc đó có thể giữ Unity chỉ cho VFX và animation trên
  asset hiện có (phương án hẹp), hoặc bỏ hẳn.

## 8. Rủi ro

| # | Rủi ro | Mức | Giảm thế nào |
|---|---|---|---|
| R1 | **Chất lượng hình do agent dựng bằng code.** Hình SDF + toon không đạt độ chi tiết của tranh vẽ; dễ ra kiểu "đồ chơi đơn giản" | **Cao** | Chọn phong cách hợp với dựng thủ tục (tròn mềm, ít chi tiết); có cổng U1; đầu tư shader + viền + hoạ tiết |
| R2 | **Đổi phong cách cả game**, bỏ toàn bộ art Sobi Farm đã duyệt | Cao | Chỉ quyết sau U1; thay theo Area trọn gói |
| R3 | **Khối lượng và thời gian:** 2547 file, GĐ15 phát hành bị lùi | Cao | Làm theo thứ tự lợi ích (VFX trước); recipe kế thừa; mỗi Area xong là dùng được ngay |
| R4 | Mắt / biểu cảm vẽ bằng hình học có thể cứng, kém duyên | Trung bình | Thử kỹ ở U1 / U6; biểu cảm là decal riêng, sửa một chỗ áp cho tất cả |
| R5 | Runtime rig hiện có không đủ cho rig cắt lớp nhiều bộ phận | Trung bình | Kiểm ở U2; mở rộng runtime có test, hỏi trước |
| R6 | Kỹ thuật Unity: alpha khi render URP, chạy batchmode cần GPU, kích hoạt license, cache vài GB | Trung bình | Kiểm hết ở U0 trước khi làm gì khác |
| R7 | Giới hạn của agent khi tự chấm ảnh: lỗi tinh tế có thể lọt | Trung bình | Script kiểm tự động (4.7) + chủ dự án duyệt ở cổng |
| R8 | Điều khoản Unity thay đổi | Thấp | Unity chỉ là công cụ, không đi kèm game; ảnh xuất ra là của dự án; nếu cần, recipe vẫn render lại được bằng công cụ khác |
| R9 | Bản quyền: hình gốc vô tình giống IP có sẵn | Thấp | Không dùng tài nguyên ngoài; rà `IP_AUDIT_PROMPT.md` mỗi giai đoạn |

## 9. Khối lượng (ước lượng thô)

| GĐ | Cỡ | Ghi chú |
|---|---|---|
| U0–U2 | Vừa | Phần lớn là viết công cụ (dựng hình, shader, render, nhập); làm một lần, dùng cho mọi thứ sau |
| U3 VFX | Vừa | Nhiều hiệu ứng nhưng dùng chung module hạt |
| U4–U5 | Vừa | Recipe kế thừa theo kiểu thân (cá, heo) |
| U6 trận | **Lớn** | 43 con × 6 pose + layer + 25 clip; phải kiểm trong Xưởng rig / Xưởng trận |
| U7–U8 | **Lớn** | Số file nhiều nhất (props 1628, environment 128, kit bản đồ) |
| U9–U10 | Vừa | |

Tổng cộng là việc của **nhiều tuần**, nhiều phiên agent. Con số cụ thể sẽ ước lại sau U1, khi đã biết tốc độ thật của
một recipe.

## 10. Các mục đã chốt (agent tự quyết theo ủy quyền của chủ dự án, 2026-11-07)

1. **Chạy hết U0 → U10 không dừng hỏi.** Riêng cổng U1 đổi thành **tự chấm có kiểm chứng**: agent đặt 4 mẫu cạnh bản cũ
   trong game và chấm theo 3 câu ở §7. Có câu nào agent không trả lời "có" một cách trung thực sau 2 vòng chỉnh thì
   **dừng hướng "tạo lại tất cả"**, báo chủ dự án kèm ảnh. Không được che kết quả xấu để đi tiếp. Ảnh U1 vẫn gửi chủ
   dự án duyệt song song; chủ dự án có thể dừng bất cứ lúc nào.
2. **Phát hành (GĐ15) lùi** tới khi xong U10. Mỗi Area thay xong vẫn chạy được ngay, nên nếu cần có thể phát hành sớm
   với các Area đã xong (chủ dự án quyết lúc đó).
3. **Thay theo Area trọn gói**, thứ tự: VFX dùng chung (U3) → Aquarium + chim mây (U4) → Farm (U5) → Adventure / trận
   (U6, U8) → Garden, Cloud, Sảnh (U7, U8) → UI (U9). Trong một Area không trộn hai phong cách lâu hơn một commit.
4. **Project Unity đặt trong repo này**, thư mục `studio/`, để recipe, công cụ và asset đi chung một commit, revert cùng
   lúc.
5. **Bốn mẫu U1 giữ như §7.**
6. **Khung / panel UI (U9): giữ CSS** cho khung co giãn (đã có design system Admin / HUD); Unity chỉ render icon, hoa
   văn trang trí và nền họa tiết dùng trong CSS. Lý do: khung CSS co giãn và sửa nhanh hơn ảnh.
7. **Python không còn cần** cho pipeline mới (Node + C#). Script Python cũ (`art.py`, `art_inbox/.tools/`) giữ để tham
   khảo, không dùng.

## 11. Session triển khai đầu tiên làm gì

1. Đọc `HANDOFF.md` → `CLAUDE.md` → `docs/AGENT_RULES.md` → `docs/PROGRESS.md` → file này → decision 051.
2. Tìm `Unity.exe` (`C:\Program Files\Unity\Hub\Editor\*\Editor\Unity.exe`). Chưa có thì đưa chủ dự án các bước §5 và
   chờ; đây là việc duy nhất phải chờ chủ dự án.
3. Tạo `studio/` (URP tối giản) + `.gitignore`; CLI `Sobi.Studio.Cli.Run`; script `npm run studio`.
4. Render thử một khối SDF có viền toon ra PNG có alpha; kiểm alpha / halo. Nhờ chủ dự án mở project một lần nếu batchmode
   báo thiếu license.
5. Ghi PROGRESS, chạy `npm run check`, commit, rồi làm tiếp U1 → U10 theo §6 / §10 mà không dừng hỏi (trừ khi U1 không
   đạt, hoặc gặp việc phạm luật dự án).

## 12. Dễ chỉnh sửa, dễ cập nhật, dễ mở rộng (bắt buộc)

Mọi công cụ Studio phải theo các luật dưới đây. Agent sau phải sửa được một asset bằng cách sửa **một file văn bản**
rồi chạy **một lệnh**.

### 12.1 Một nguồn sự thật cho phong cách
- `studio/Style/style.json`: bảng màu, độ dày / màu viền theo cỡ hiển thị, số bậc sáng, hướng sáng, góc camera theo loại
  asset, cỡ canvas / neo (lấy từ `ASSET_PRODUCTION_STANDARD_v1.md`). Shader và công cụ **chỉ đọc từ đây**, không
  hard-code số.
- Đổi một token → `npm run studio -- build --all` render lại mọi asset bị ảnh hưởng.

### 12.2 Recipe có kế thừa
- Lớp mẫu theo kiểu thân trong `studio/Recipes/_templates/`: `quadruped`, `biped_heavy`, `bird`, `fish_tail`,
  `fish_flat`, `eel`, `jelly`, `octopus`, `turtle`, `ray`, `seahorse`, `building`, `crop`, `item`, `tile`, `fx_*`…
- Recipe một asset chỉ ghi phần khác: `{ "extends": "_templates/fish_tail", "id": "fish_goldfish", "colors": {…},
  "parts": { "fin_tail": { "shape": "veil" } } }`. Sửa template → mọi con kế thừa được cập nhật.
- Clip animation dùng chung theo kiểu thân (25 clip trận hiện có, bơi, bay, đi). Từng loài chỉ chỉnh `tempo` / `weight`
  / biên độ.
- Recipe khai báo **id asset đầu ra** (khớp manifest), nên không phải đổi schema manifest.

### 12.3 Có schema, có kiểm
- Schema recipe (JSON Schema) trong `studio/Recipes/schema/`; kiểm ở cả phía C# (lúc dựng) và TS (`npm run studio --
  validate`, chạy trong `npm run check`). Lỗi ghi rõ file, trường, giá trị.
- Test công cụ: Unity Test Framework (batchmode) cho phần dựng hình / xương; Vitest cho script nhập / kiểm.

### 12.4 Dựng lại chỉ phần thay đổi
- Mỗi recipe có hash = recipe + template + style + phiên bản công cụ. Cache ở `studio/.cache/` (bỏ qua git).
  `build --changed` chỉ render recipe có hash đổi. Cùng đầu vào luôn ra cùng ảnh (seed cố định).

### 12.5 Thêm mới theo các bước cố định
- `docs/studio/RECIPE_GUIDE.md`: thêm một sinh vật / vật phẩm / hiệu ứng mới trong ≤ 5 bước (copy recipe gần giống, đổi
  id + màu + bộ phận, build, import, kiểm). Có ví dụ đầy đủ cho mỗi template.
- `docs/studio/STYLE_BIBLE.md`: phong cách bằng số + ảnh mẫu.

### 12.6 Xem được trong Admin
- Thêm trang **Xưởng asset** (Admin, không vào bản build người chơi, AGENT_RULES §4): duyệt asset theo Area / loại,
  xem bản mới cạnh bản cũ (lấy từ tag `pre-unity-studio` qua file đã xuất), xem recipe nguồn và trạng thái (chưa làm /
  đã render / đã nhập). Chỉ đọc; sửa bằng file recipe.

### 12.7 Ranh giới rõ, revert được
- Game không biết Studio tồn tại: chỉ đọc PNG / JSON qua manifest và `content/`. Bỏ Studio đi game vẫn chạy.
- Mỗi batch một commit (recipe + công cụ + asset + manifest). Phiên bản Unity khoá trong
  `studio/ProjectSettings/ProjectVersion.txt`, package khoá trong `studio/Packages/packages-lock.json`.
- Ghi tiến độ từng Area trong `docs/PROGRESS.md` và bảng trạng thái trong `docs/studio/STATUS.md`.
