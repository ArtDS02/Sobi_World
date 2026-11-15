# 05 — Công nghệ AI / tự động hóa tạo asset 3D từ ảnh 2D (khảo sát 2026-11-11)

**Phạm vi:** khảo sát hiện hành công cụ AI và tự động hóa cho chuỗi 2D → 3D, phục vụ quyết định 2D/3D của Sobi World.
**Phần cứng đối chiếu (đã đo):** RTX 3050 **6 GB VRAM**, RAM **16 GB**, i5-14600KF, Windows 10.
**Cách đọc nhãn:**
- **[DỮ LIỆU]** = lấy từ trang đã mở trong phiên này (URL kèm theo, liệt kê ở "## Nguồn").
- **[DỮ LIỆU-2]** = chỉ thấy qua đoạn trích kết quả tìm kiếm / trang tổng hợp bên thứ ba, **chưa mở trang chính thức** → độ tin thấp hơn.
- **[NHẬN ĐỊNH]** = suy luận của người viết từ dữ liệu.
- **[GIẢ ĐỊNH]** = con số/điều kiện tự đặt để ước lượng.
- **[NỀN]** = kiến thức nền của người viết, **không mở được nguồn trong phiên này** (xem "Điều chưa xác minh").

> **Giới hạn của bản khảo sát này (đọc trước):** công cụ tra cứu web bị chạm hạn mức giữa chừng. Nhóm (a), (b), (e), phần lớn (f) và (i) đã tra được nguồn chính thức. Nhóm **(d) retopo/UV, (g) Blender, (h) runtime 3D** và một phần (c), (i) **chưa mở được nguồn** — các dòng đó gắn nhãn [NỀN] và nằm trong "Điều chưa xác minh". Không có phép thử thực tế nào được chạy (đúng giới hạn quyền: không tải, không cài).

---

## 1. Sáu mức chuyển 2D → 3D và thực trạng AI

### 1.1 Vì sao khó
Một ảnh 2D thiếu: (a) **mặt sau** và các phần bị che — model phải "bịa"; (b) **độ sâu** thật — tỷ lệ chibi (đầu to, chân ngắn) dễ bị bóp dẹt hoặc kéo dài; (c) **topology** — đầu ra AI là lưới tam giác dày từ marching cubes / voxel, không có edge loop quanh khớp; (d) **UV** — tự sinh, vụn, khó sửa tay; (e) **xương** — không có thông tin khớp; (f) **ý đồ phong cách** — nét viền, mảng màu phẳng pastel trong tranh là "ánh sáng đã vẽ sẵn", khi thành texture PBR sẽ bị "nướng" bóng vào màu.

Unique3D tự ghi hạn chế đúng các điểm này: kết quả phụ thuộc hướng nhìn ảnh vào, ảnh chính diện tư thế nghỉ cho kết quả tốt nhất, phần bị che giảm chất lượng. [DỮ LIỆU] https://github.com/AiuniAI/Unique3D

### 1.2 Bảng sáu mức

| Mức | Nội dung | Thực trạng AI 11/2026 | Nhãn |
|---|---|---|---|
| 1 | Render tĩnh trông 3D | Đã giải quyết. Không cần mesh: AI sinh ảnh làm trực tiếp; hoặc mesh AI thô + render. | [NHẬN ĐỊNH] |
| 2 | Mesh xoay được | Làm tốt với vật thể đơn. TRELLIS.2 (MIT) xuất GLB PBR tới 1536³; Hunyuan3D 2.1, Pixal3D, Meshy 7.1, Tripo H3.1, Rodin Gen-2.5 đều ở mức này. Mặt sau vẫn là phỏng đoán; nhập 2–4 góc nhìn cải thiện rõ. | [DỮ LIỆU] https://github.com/microsoft/TRELLIS.2 ; https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026 |
| 3 | Topology tốt (quad, edge loop) | **Một phần.** Dịch vụ trả phí có đầu ra quad/low-poly (Tripo P2.0 "native quad topology", Rodin "High-Poly Quads"/"Smart Low-Poly", Meshy Remesh/Smart Topology). Mã mở: MeshAnythingV2 giới hạn ≤ 1600 mặt. Không nguồn nào tôi mở được cam kết edge loop đúng vị trí khớp để biến dạng đẹp. | [DỮ LIỆU] https://developers.tripo3d.ai/ ; https://hyper3d.ai/pricing ; https://github.com/buaacyw/MeshAnythingV2 |
| 4 | Rig / skin | **Một phần.** Người hai chân: tốt. Bốn chân: có (Tripo; UniRig/SkinTokens/Puppeteer/RigAnything mã mở). Cá, cánh, tai dài, đuôi: yếu — README UniRig tự ghi skin kém khi skeleton thiếu xương đuôi/cánh, khuyên sửa skeleton trước. Meshy auto-rig **chỉ humanoid**. | [DỮ LIỆU] https://github.com/VAST-AI-Research/UniRig ; https://docs.meshy.ai/en/api/rigging-and-animation |
| 5 | Animation | **Người: tốt. Không phải người: gần như chưa.** HY-Motion 1.0 ghi rõ không hỗ trợ động vật/sinh vật không phải người. Mocap video (DeepMotion, Move, Rokoko Vision…) đều dựng trên khung người. Bốn chân chỉ có preset (Tripo) hoặc công cụ hỗ trợ làm tay (Cascadeur, quadruped AutoPosing chỉ ở gói Pro). Cá: không thấy công cụ AI nào. | [DỮ LIỆU] https://github.com/Tencent-Hunyuan/HY-Motion-1.0 ; https://cascadeur.com/plans |
| 6 | Production (UV sạch, LOD, nhất quán style) | **Chưa tự động.** Có từng mảnh (remesh/LOD tự động ở vài dịch vụ) nhưng nhất quán phong cách giữa hàng trăm asset, UV chỉnh được, deformation đẹp vẫn cần người kiểm và sửa. | [NHẬN ĐỊNH] |

### 1.3 Giữ phong cách Sobi (tròn, chibi, pastel, nét, nhận diện)
- **Hình tròn trịa, khối đơn giản** là trường hợp *dễ* cho image-to-3D (ít chi tiết mảnh, ít lỗ). [NHẬN ĐỊNH]
- **Tỷ lệ chibi**: rủi ro ở độ sâu đầu/thân và ở bước rig — rig tự động huấn luyện chủ yếu trên tỷ lệ người/thú thật (Objaverse, VRoid). [NHẬN ĐỊNH; dữ liệu huấn luyện: https://github.com/VAST-AI-Research/UniRig]
- **Pastel và nét viền**: texture AI mặc định PBR + delight; nét viền vẽ tay trong tranh sẽ thành vệt trên texture. Cách giữ đúng là **bỏ texture PBR, dùng toon/cel shader + outline (inverted hull hoặc post-process) + bảng màu phẳng** rồi render. [NHẬN ĐỊNH]
- **Nhận diện nhân vật**: không tìm thấy đánh giá độc lập nào thử riêng nhân vật chibi động vật qua nhiều công cụ; mọi so sánh tìm được là blog của nhà cung cấp. **Chưa xác minh** → cần tự thử trên tranh Sobi.
- Step1X-3D công bố chuyển được LoRA 2D sang 3D (điều khiển style) nhưng cần ~27–29 GB VRAM. [DỮ LIỆU] https://github.com/stepfun-ai/Step1X-3D

### 1.4 Các hướng phong cách

| Hướng | AI hỗ trợ tới đâu | Hợp Sobi | Nhãn |
|---|---|---|---|
| Stylized 3D (PBR nhẹ) | Mesh + texture AI dùng được cho prop tĩnh; nhân vật cần sửa | Vừa | [NHẬN ĐỊNH] |
| Low-poly | Meshy 6 "Low Poly Mode", Tripo P1.0/P2.0, Rodin "Smart Low-Poly" | Vừa–cao cho prop | [DỮ LIỆU] https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026 |
| Hand-painted | Không có model nào tôi mở được cam kết texture hand-painted nhất quán; StableGen (SDXL + ControlNet/IPAdapter chiếu lên mesh) là đường mã mở gần nhất | Vừa, cần thử | [DỮ LIỆU] https://github.com/sakalond/StableGen |
| 2.5D (billboard, parallax, normal-map trên sprite, depth-map) | Giữ nguyên tranh 2D đã duyệt; chỉ thêm normal/depth. Rủi ro thấp nhất | **Cao** | [NHẬN ĐỊNH] |
| Toon / cel shading | Là shader, không phải AI; khớp phong cách pastel phẳng | **Cao** nếu đi 3D | [NHẬN ĐỊNH] |
| "Dựng 3D bằng code → render ra 2D" | Dự án **đã thử** (decision 051, Unity batchmode + SDF + toon): đồng bộ hơn nhưng **không đẹp hơn** tranh cũ, cổng U1 không đạt | Đã có dữ liệu thật: thấp cho *tạo hình*, đạt cho *chuyển động trên tranh có sẵn* | [DỮ LIỆU] `docs/decisions/051-unity-studio.md` |

**[NHẬN ĐỊNH] quan trọng:** thất bại U1 là của hướng *dựng hình bằng code (SDF)*. Hướng *image-to-3D từ chính tranh đã duyệt → toon render lại ra 2D* là hướng khác và **chưa được thử**; nó có cơ hội giữ nhận diện tốt hơn SDF vì xuất phát từ tranh gốc, nhưng chưa có bằng chứng.

---

## 2. Bảng công cụ

Quy ước cột "6 GB": **Được** / **Sát ngưỡng** (yêu cầu công bố ≈ 6 GB, chưa thử) / **Không** (yêu cầu công bố > 6 GB) / **?** (không có số).
Cột "Agent": Claude Code điều khiển được qua CLI / Python / HTTP API hay không.

### 2a. Image-to-3D / text-to-3D mã mở hoặc chạy local

| Công cụ | Nguồn chính thức | License code / weights | VRAM công bố | 6 GB | Agent | Ghi chú chất lượng / hạn chế | Hợp Sobi |
|---|---|---|---|---|---|---|---|
| **TRELLIS.2-4B** (Microsoft, 12/2025) | https://github.com/microsoft/TRELLIS.2 | MIT cho cả model và code; nvdiffrast/nvdiffrec có license riêng (NVlabs — chưa đọc); StableGen ghi encoder DINOv3 có license riêng | **≥ 24 GB**, chỉ thử trên Linux | **Không** | Python; có trong ComfyUI | GLB PBR (base color, roughness, metallic, opacity). Được nhiều trang gọi là model mở tốt nhất 2026 (nguồn là blog nhà cung cấp). Mesh có thể chứa vỏ rỗng bên trong (StableGen có "Make Solid"). Bản lượng tử hóa cộng đồng chạy VRAM thấp hơn: [DỮ LIỆU-2], chưa xác minh | **Cao về chất lượng + license, nhưng phải thuê GPU / cloud** |
| **Pixal3D** (Tencent ARC, 5/2026; multi-view 9/2026) | https://github.com/TencentARC/Pixal3D | Code MIT; weights: trang không ghi → chưa xác minh | Không ghi số; có `--low_vram` (1024 thay vì 1536). Cài theo hướng dẫn TRELLIS.2 | **?** (nhiều khả năng không) | CLI `python inference.py --image … --output … --low_vram` | Nền TRELLIS.2, "pixel-aligned" (bám sát ảnh gốc) — đáng quan tâm cho giữ nhận diện | Cao nếu có GPU lớn; chưa xác minh trên 6 GB |
| **TRELLIS v1** (12/2024) | https://github.com/microsoft/TRELLIS | MIT; submodule diffoctreerast và FlexiCubes có license riêng | ≥ 16 GB, Linux | Không | Python | Có bản text-to-3D (342M–2.0B) nhưng README khuyên sinh ảnh trước | Vừa (đã bị TRELLIS.2 thay) |
| **Hunyuan3D-2.1** (Tencent, 6/2025) | https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1 | **Tencent Hunyuan 3D 2.1 Community License** (không phải OSI): loại trừ EU, UK, Hàn Quốc; trần 1 triệu MAU; cấm dùng output cải thiện model AI khác | Shape 10 GB; texture 21 GB; cả hai 29 GB | Không | `api_server.py`, Gradio; Win/macOS/Linux | PBR; đủ code huấn luyện | Vừa — **rủi ro license lãnh thổ** (xem dưới) |
| **Hunyuan3D-2.0 / 2mini / 2mv / Turbo** | https://github.com/Tencent-Hunyuan/Hunyuan3D-2 | Tencent Hunyuan 3D 2.0 Community License (cùng loại trừ EU/UK/KR, trần MAU, cấm huấn luyện model khác) | Shape **6 GB**; shape+texture 16 GB. 2mini = 0.6B tham số | **Sát ngưỡng (chỉ shape)**; texture: Không | `api_server.py` (POST `/generate` → GLB), `blender_addon.py`, `--low_vram_mode` | Chỉ hình học trên máy dự án; texture phải làm cách khác | Vừa (chạy được) nhưng vướng license |
| **Hunyuan3D-2GP** (fork cộng đồng) | https://github.com/deepbeepmeep/Hunyuan3D-2GP | Fork của Hunyuan3D-2 (license gốc áp dụng; trang không ghi rõ) | Ghi "6 GB shape; 24.5 GB shape+texture"; `--profile 4` cho thẻ 6 GB; profile 4/5 = LowRAM_LowVRAM | **Sát ngưỡng → Được (shape)** theo công bố; chưa thử | Python/Gradio; Windows cần VS 2022 | Cập nhật ghi nhận gần nhất 3/2025; không hỗ trợ 2.1 | Vừa |
| **Hunyuan 2.5 / 3.0 / 3.1** | (hosted) | **Không phát hành weights** | — | Không (chỉ cloud) | Tencent Cloud API | Nền tảng global: 20 lượt miễn phí/ngày — [DỮ LIỆU-2 qua trang tổng hợp] | Vừa (cloud miễn phí giới hạn; điều khoản chưa đọc) |
| **Hunyuan3D-Omni** (9/2025) / **Hunyuan3D-Part** (9/2025) | qua https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026 | Community License riêng, loại trừ EU/UK/KR | Omni 10 GB; Part: không ghi | Không | — | Omni: điều khiển bằng skeleton/bbox/voxel. Part: tách part | Thấp–vừa |
| **TripoSG** (VAST, 3/2025) | https://github.com/VAST-AI-Research/TripoSG | Repo MIT; weights trên HF: trang không ghi riêng | ≥ 8 GB | **Không** (thiếu 2 GB; chưa thử offload) | CLI `python -m scripts.inference_triposg --image-input … --output-path out.glb --faces 5000` | Chỉ hình học, không texture. Có bản scribble | Vừa |
| **TripoSR** (VAST + Stability, 2024) | https://github.com/VAST-AI-Research/TripoSR | **MIT** (code + model) | ~6 GB mặc định | **Sát ngưỡng** | CLI `python run.py img.png --output-dir out/ --bake-texture` | Model đời 2024, chất lượng thấp hơn hẳn thế hệ 2025–2026; vertex color hoặc bake texture | Vừa: **lựa chọn MIT duy nhất chạy được local** để thử nghiệm |
| **Stable Fast 3D (SF3D)** | https://huggingface.co/stabilityai/stable-fast-3d | Stability AI Community License: miễn phí thương mại nếu doanh thu năm ≤ 1 triệu USD; repo gated | Model card không ghi; ~6–7 GB theo [DỮ LIỆU-2] | Sát ngưỡng | Python | Mesh low-poly có UV, delight, roughness/metallic, < 1 s | Vừa (prop nhanh) |
| **SPAR3D** (Stability, 1/2025) | https://github.com/Stability-AI/stable-point-aware-3d | `LICENSE.md` (trang không tóm tắt; [DỮ LIỆU-2]: Stability Community License) | 10.5 GB mặc định; low-VRAM ~7 GB; README còn một chỗ ghi ~6 GB (mâu thuẫn nội bộ) | **Không chắc** | CLI `python run.py … --low-vram-mode --remesh_option Quad` | Windows "experimental"; có tùy chọn remesh Quad | Thấp–vừa |
| **InstantMesh** | https://github.com/TencentARC/InstantMesh | Code Apache-2.0; weights và Zero123++ UNet: chưa xác minh | Không ghi | ? | CLI | OBJ vertex color hoặc texture map; đời 2024 | Thấp |
| **CRM** | https://github.com/thu-ml/CRM | MIT | Không ghi; "tối ưu cho GPU ít bộ nhớ" còn là việc chưa làm | ? | CLI | OBJ + UV texture; đời 2024 | Thấp |
| **Unique3D** | https://github.com/AiuniAI/Unique3D | MIT | Không ghi | ? | Có script .bat cho Windows | Phụ thuộc mạnh hướng nhìn ảnh vào | Thấp |
| **Hi3DGen / Stable3DGen** (3/2025) | https://github.com/Stable-X/Stable3DGen | MIT | Không ghi | ? | Python | Hình học qua "normal bridging" trên nền TRELLIS | Thấp–vừa |
| **Step1X-3D** (5/2025) | https://github.com/stepfun-ai/Step1X-3D | Apache-2.0 | 27–29 GB | Không | Python | Hỗ trợ LoRA (style) | Vừa về ý tưởng, không chạy được local |
| **Direct3D-S2** (5/2025) | [DỮ LIỆU-2] | MIT | 10 GB @512; ~24 GB @1024 | Không | — | Chỉ hình học | Thấp |
| **PartCrafter** (7/2025) | https://github.com/wgsxm/PartCrafter | MIT | ≥ 8 GB | Không | CLI | Sinh nhiều part một lượt; phải tự đặt `--num_parts`; Windows qua fork cộng đồng; texture: trang không ghi | Vừa (tách part có ích cho rig) |
| **PartPacker** (NVIDIA, 6/2025) | [DỮ LIỆU-2] | NVIDIA Source Code License — **phi thương mại** | ~10 GB | Không | — | — | Thấp (license) |
| **SAM 3D Objects / Body** (Meta, 11/2025) | [DỮ LIỆU-2] | SAM License | Không ghi | ? | — | Objects ra Gaussian splat; Body là người | Thấp |
| **Roblox Cube 3D** | [DỮ LIỆU-2] https://github.com/Roblox/cube (chưa mở) | Mâu thuẫn giữa các nguồn (OpenRAIL vs "Research-Only RAIL-MS") → **chưa xác minh** | — | ? | — | Text-to-mesh hướng Roblox | Thấp |

**Cảnh báo license Tencent Hunyuan (mọi bản 2.x):** bản quyền sử dụng chỉ áp dụng trong "Territory" = toàn cầu **trừ EU, Vương quốc Anh, Hàn Quốc**; điều 5(c) coi việc dùng ngoài Territory là không được cấp phép; cấm dùng model/output để cải thiện model AI khác; trên 1 triệu MAU phải xin phép riêng. [DỮ LIỆU] https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE ; https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE
**[NHẬN ĐỊNH]** Với game bán toàn cầu (Steam có EU/UK/KR), việc asset sinh bằng Hunyuan có được phân phối trong các vùng đó hay không là câu hỏi pháp lý **chưa rõ** — cần phần bản quyền xử lý trước khi dùng Hunyuan cho asset ship.

### 2b. Dịch vụ thương mại

| Dịch vụ | Giá / credit | Free: quyền thương mại | Trả phí | API | Retopo / quad | Auto-rig / animation | Hợp Sobi |
|---|---|---|---|---|---|---|---|
| **Meshy** (model mới nhất `meshy-7.1`) | Free 100 credit/tháng; Starter ₫260.000 (250 credit); **Pro ₫527.000 (1.000 credit)**; Premium ₫1.050.000 (3.000); Studio ₫1.850.000 (5.500). API: image-to-3D 20 credit (mesh) / 30 (có texture 2K–4K); remesh 5; retexture 10; rig 5; mỗi animation 3; text-to-motion 3–10 | **CC BY 4.0** — dùng thương mại được nhưng **phải ghi công**; 10 lượt tải Meshy 6 Lite | Private, khách sở hữu | **Chỉ từ Pro**; credit trả trước | Remesh, Smart Topology, Low Poly Mode | **Rig chỉ humanoid hai chân** (tài liệu API ghi rõ không hợp asset không phải người); 500+ animation ở gói trả phí | **Vừa**: tốt cho prop; **rig không dùng được cho heo/cá** |
| **Tripo** (VAST; H3.1, P2.0) | API: **1 credit = 0,01 USD**; image-to-3D 20–30; texture 10–30; retopo 10–40; **auto rig 25**; retarget 10/animation; convert 5–10. Giá gói web: trang pricing trả 403 → [DỮ LIỆU-2] mâu thuẫn (≈ 16–25 USD/tháng gói Pro) | [DỮ LIỆU-2] Free = CC BY 4.0, **không** kèm quyền thương mại (nhiều trang thứ cấp thống nhất; chưa đọc điều khoản gốc) | [DỮ LIỆU-2] có quyền thương mại, model private | Có; có **Tripo CLI** và prompt cài cho AI agent | **P2.0 "native quad topology"** | Rig "various types", 100+ preset motion. [DỮ LIỆU-2]: trang trợ giúp ghi hỗ trợ humanoid T-pose **và thú bốn chân đứng chuẩn**; một trang bên thứ ba ghi Rigging 2.5 có thêm hexapod/avian/serpentine/**aquatic** — chưa xác minh | **Cao** trong nhóm trả phí: trả theo dùng, có CLI, có quad, có rig bốn chân |
| **Rodin / Hyper3D** (Deemos; Gen-2.5, 5/2026) | Free 0 USD "trả theo kết quả", credit lẻ 1,5 USD; Creator 30 USD/tháng (~60 model); Business 120 USD/tháng (~416 model) | Trang không ghi rõ quyền gói Free | Creator: "unlimited export and any use" | **Chỉ Business** (full API) | Creator: Smart Low-Poly; Business: High-Poly Quads | Trang pricing không nhắc rig | Vừa: chất lượng cao nhưng đắt theo model, API ở gói 120 USD |
| **Sloyd** | Guest miễn phí (1 lượt/ngày, **chỉ dùng cá nhân**); Plus 15 USD/tháng; Pro 50 USD/tháng | Không | Thương mại, không royalty; bán lại asset chỉ ở Pro | API tính riêng, credit trả trước | — | "AI rigging, basic animation" không giới hạn ở Plus/Pro (loại nhân vật: không ghi) | Vừa (thiên về prop); chưa xác minh với nhân vật |
| **3D AI Studio** (trang gộp nhiều model) | Gói 1.000 / 3.500 / 18.000 credit/tháng (giá tháng không đọc được); gói một lần 2.000 credit = 34 USD, không hết hạn. Image-to-3D 20; rig 20; animation 15; remesh, LOD, UV unwrap miễn phí | — | "Fully owned by you", thương mại | Liên hệ | Remesh + LOD tự động | Rigging AI | Vừa (gói mua một lần hợp ngân sách nhỏ) |
| **Autodesk Flow Studio — Wonder 3D** (3/2026) | [DỮ LIỆU-2] Free 300 credit/tháng = 15 lượt 3D; Lite 10 USD; Standard 45 USD; Pro 95 USD (có nguồn ghi 64) | Chưa xác minh | Chưa xác minh | Chưa xác minh | — | Flow Studio gốc là mocap AI cho người | Thấp–vừa |
| **Luma Genie** | [DỮ LIỆU-2] mâu thuẫn (miễn phí qua Discord đời đầu vs 30–300 USD/tháng theo trang tổng hợp 2026) | Chưa xác minh | — | — | — | Không | **Thấp** (Luma đã chuyển trọng tâm sang video) |
| **CSM (Common Sense Machines)** | [DỮ LIỆU-2] Free → 20 / 60 / 499 / 2.000 USD/tháng; tên miền `www.csm.ai` không phân giải được lúc tra | Chưa xác minh | — | — | — | — | Thấp (chưa xác minh còn hoạt động thế nào) |
| **Kaedim** | [DỮ LIỆU-2] 50 → 1.200 USD/tháng, có người làm trong vòng lặp; trang pricing trả 404 | — | — | — | Có (người làm) | — | **Thấp** (vượt ngân sách) |
| **Spline AI** | [DỮ LIỆU-2] AI gộp vào gói, 2.000 / 3.000 / 10.000 credit/tháng | Chưa xác minh | — | — | — | — | Thấp (thiên về web 3D design) |
| **Adobe Substance 3D Viewer (beta) Text to 3D** | [DỮ LIỆU-2] sinh **Gaussian splat**, Adobe tự ghi không nhằm production | — | — | — | Không | Không | **Thấp** |
| **Roblox Cube** | Xem 2a | — | — | Trong Roblox Studio | — | — | Thấp |

Nguồn [DỮ LIỆU]: https://www.meshy.ai/pricing ; https://docs.meshy.ai/api/pricing.md ; https://docs.meshy.ai/en/webapp/pricing ; https://docs.meshy.ai/en/api/rigging-and-animation ; https://developers.tripo3d.ai/ ; https://hyper3d.ai/pricing ; https://www.sloyd.ai/pricing ; https://www.3daistudio.com/pricing
Ghi chú Meshy: giá hiển thị bằng VND theo vùng; quy đổi Pro ≈ 20 USD là [GIẢ ĐỊNH] (≈ 26.000 VND/USD).

### 2c. Texture / material AI

| Công cụ | Nguồn | License | Phần cứng | 6 GB | Ghi chú | Hợp Sobi |
|---|---|---|---|---|---|---|
| **Hunyuan3D-Paint 2.0 / 2.1** | https://github.com/Tencent-Hunyuan/Hunyuan3D-2 | Tencent Community License | 2.0: tổng 16 GB; 2.1: 21 GB | Không | 2.1 ra PBR | Thấp (local), vừa (cloud) |
| **TRELLIS.2 / Pixal3D** (texture gắn liền) | xem 2a | MIT | 24 GB | Không | PBR 4K | Vừa |
| **StableGen** (Blender add-on) | https://github.com/sakalond/StableGen | Add-on GPL-3.0; model kèm theo có license riêng (Qwen Image = Research License, Bria FIBO = CC BY-NC → **không thương mại**) | SDXL ~8 GB; Qwen ≥ 16 GB; cần ComfyUI | **Không / sát** (8 GB) | Chiếu ảnh diffusion đa camera lên mesh; PBR qua Marigold; tích hợp TRELLIS.2 + SkinTokens + remesh "LATO.2"; Blender 4.2–4.5 hoặc ≥ 5.1 | Vừa: đường mã mở đầy đủ nhất, nhưng quá VRAM máy dự án |
| **Meshy Retexture / AI Texturing** | https://docs.meshy.ai/api/pricing.md | Dịch vụ | Cloud | — | 10 credit (2K/4K), 15 (8K) | Vừa |
| **Tripo AI Texture** | https://developers.tripo3d.ai/ | Dịch vụ | Cloud | — | 10–30 credit | Vừa |
| TEXTure / Text2Tex, Material Maker | — | **chưa xác minh** | — | — | [NỀN] TEXTure/Text2Tex là nghiên cứu 2023, đã bị thế hệ sau vượt; Material Maker là công cụ vật liệu procedural mã mở, không phải AI | Thấp |

**PBR vs hand-painted — [NHẬN ĐỊNH]:** mọi model trên tối ưu cho PBR "delight". Phong cách Sobi (màu phẳng pastel + nét) hợp hơn với: (1) **không texture**, vertex color / bảng màu theo vật liệu + toon shader; hoặc (2) chiếu chính tranh 2D gốc lên mặt trước rồi tô bù phần còn lại. Cả hai làm được bằng `bpy`, không cần model texture nặng.

### 2d. Retopology & UV — **toàn bộ [NỀN], chưa mở nguồn trong phiên này**

| Công cụ | Loại | Ghi chú | Nhãn |
|---|---|---|---|
| **QuadriFlow** (có sẵn trong Blender, Remesh → Quad) | Tự động, miễn phí, gọi được bằng `bpy` | Quad đều nhưng **không** đặt edge loop theo khớp | [NỀN] |
| **Instant Meshes** | Mã mở, có CLI | Field-aligned quad; cùng hạn chế | [NỀN] |
| **AutoRemesher** | Mã mở | Dự án ít cập nhật | [NỀN] chưa xác minh trạng thái |
| **QuadRemesher** (Exoside) | Trả phí, plugin Blender | Thường được coi là auto-quad tốt nhất; giá chưa xác minh | [NỀN] |
| **xatlas**, **Blender Smart UV Project** | UV tự động, miễn phí | UV vụn, dùng được khi texture sinh tự động/bake, khó vẽ tay | [NỀN] |
| **UVPackmaster** | Trả phí, đóng gói UV | Giá chưa xác minh | [NỀN] |
| **MeshAnythingV2** | AI retopo mã mở | **≤ 1600 mặt**; ~8 GB VRAM, 45 s trên A6000; license trong `LICENSE.txt` chưa đọc; loại mặt (tri/quad) trang không ghi | [DỮ LIỆU] https://github.com/buaacyw/MeshAnythingV2 |
| **Meshtron** (tới 64K mặt), **BPT**, **DeepMesh**, **QuadGPT** (ICLR 2026, quad gốc) | Nghiên cứu | Không tìm thấy bản phát hành code/license dùng được; QuadGPT: "code chưa có, dự kiến API" | [DỮ LIỆU-2] |
| **Tripo P2.0**, **Rodin Quads**, **Meshy Remesh** | Dịch vụ | Xem 2b | [DỮ LIỆU] |

**[NHẬN ĐỊNH]:** với nhân vật chibi ít khớp (4–10 xương), topology quad đều từ QuadriFlow/Tripo P2.0 **có thể đủ** cho biến dạng nhẹ (nhún, lắc, bước ngắn); squash-and-stretch mạnh, biểu cảm mặt, khớp gập sâu vẫn cần edge loop đặt tay.

### 2e. Auto-rig & skinning

| Công cụ | Nguồn | License | Phần cứng | 6 GB | Loại nhân vật | Agent | Hợp Sobi |
|---|---|---|---|---|---|---|---|
| **UniRig** (VAST, SIGGRAPH 2025) | https://github.com/VAST-AI-Research/UniRig | Code MIT; checkpoint trên HF: không ghi riêng | ≥ 8 GB | **Không** (thiếu 2 GB) | "người, động vật, vật thể"; ví dụ hươu cao cổ, rồng, thỏ. Checkpoint công bố huấn luyện trên Articulation-XL2.0; bản đầy đủ Rig-XL/VRoid **chưa phát hành**. Tự ghi: thiếu xương đuôi/cánh làm hỏng skin | CLI bash (`generate_skeleton.sh`, `generate_skin.sh`, `merge.sh`), vào .obj/.fbx/.glb, ra .fbx/.glb | Vừa–cao (cần GPU ≥ 8 GB) |
| **SkinTokens / TokenRig** (VAST, 2026 — kế nhiệm UniRig) | https://github.com/VAST-AI-Research/SkinTokens | Code MIT; weights không ghi | **≥ 14 GB** | Không | Dữ liệu ArticulationXL 2.0, VRoid Hub, ModelsResource; ví dụ hươu cao cổ | CLI `python demo.py --input a.glb --output b.glb`, chạy theo thư mục | Cao về năng lực, cần cloud GPU |
| **Puppeteer** (NeurIPS 2025 Spotlight) | https://github.com/Seed3D/Puppeteer | **Apache-2.0** | Không ghi | ? | Rig + skin + **animation dẫn bằng video**; ví dụ con hươu | Script `demo_rigging.sh`, `demo_animation.sh`, `export.py` → FBX | Vừa (nghiên cứu, cài đặt nặng) |
| **RigAnything** (SIGGRAPH TOG 2025) | https://github.com/Isabella98Liu/RigAnything | `LICENSE.md` chưa đọc | Không ghi | ? | Không template; bài báo nêu người, bốn chân, sinh vật biển, côn trùng [DỮ LIỆU-2] | Script, ra GLB đã rig | Vừa; license chưa xác minh |
| **Tripo auto-rig** | https://developers.tripo3d.ai/ | Dịch vụ | Cloud | — | Xem 2b: humanoid + bốn chân (các loại khác chưa xác minh) | API/CLI, 25 credit = 0,25 USD | **Cao** |
| **Meshy auto-rig** | https://docs.meshy.ai/en/api/rigging-and-animation | Dịch vụ | Cloud | — | **Chỉ humanoid hai chân**; cần model có texture, ≤ 380.000 tam giác, mặt hướng +Z; API cần gói trả phí | API | **Thấp** cho heo/cá |
| **Mixamo** (Adobe) | https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400 | Miễn phí, không royalty, thương mại được (FAQ 2022, viết thời "technology preview"); **cấm phân phối file thô**; **cấm dùng để huấn luyện ML** | Web | — | [NỀN] chỉ humanoid; không có API công khai chính thức; [DỮ LIỆU-2] 7/2026 vẫn chạy, ở chế độ bảo trì | Không (web, thủ công) | **Thấp**: sai loại nhân vật, không tự động hóa được |
| **AccuRIG** (Reallusion) | [DỮ LIỆU-2] diễn đàn Reallusion | Miễn phí, dùng thương mại được (bài diễn đàn cũ) | App desktop | — | [NỀN] humanoid | Không (GUI) | Thấp |
| **Rigify** (Blender) | [NỀN] | GPL (theo Blender); output không bị ràng buộc | CPU | **Được** | [NỀN] có metarig người, bốn chân (ngựa, mèo, sói), chim, cá mập; phải đặt xương tay hoặc bằng script | `bpy` | **Cao**: miễn phí, local, script được; nhưng cần agent/người đặt xương |
| **Anything World** | `anything.world` chuyển hướng sang `everythinguniver.se` (chưa đọc được) | chưa xác minh | Cloud | — | [NỀN] từng quảng bá rig nhiều loại động vật | chưa xác minh | Chưa xác minh |

**Theo loại sinh vật — [NHẬN ĐỊNH] dựa trên dữ liệu trên:**
- *Thú bốn chân (heo)*: có đường tự động (Tripo; UniRig/SkinTokens) nhưng tỷ lệ chibi (chân rất ngắn, đầu chiếm nửa thân) nằm ngoài phân bố huấn luyện → kỳ vọng phải sửa.
- *Cá*: không dịch vụ nào tôi mở được cam kết. Thực tế cá chibi chỉ cần chuỗi 3–5 xương sống + vây → **viết bằng `bpy` nhanh và ổn định hơn AI**.
- *Cánh / đuôi / tai dài*: điểm yếu được chính UniRig thừa nhận.
- *Chibi đầu to*: weight vùng cổ–đầu dễ lem; cần kiểm bằng mắt.

### 2f. AI animation & mocap

| Công cụ | Nguồn | Giá / license | Phần cứng | Không phải người? | Hợp Sobi |
|---|---|---|---|---|---|
| **Cascadeur** | https://cascadeur.com/plans | Free: **phi thương mại**, chỉ xuất .casc, ≤ 300 frame / 120 khớp. **Indie 19 USD/tháng hoặc 96 USD/năm**, doanh thu/vốn < 100.000 USD/năm, xuất FBX/DAE/USD/glTF. **Pro 49 USD/tháng hoặc 396 USD/năm**, không giới hạn. Gói năm chuyển thành bản vĩnh viễn [DỮ LIỆU-2] | Desktop, local | **Quadruped AutoPosing chỉ ở Pro/Teams** | Vừa: công cụ *hỗ trợ* làm tay, GUI — agent khó điều khiển; scripting chưa xác minh |
| **HY-Motion 1.0** (Tencent, text-to-motion) | https://github.com/Tencent-Hunyuan/HY-Motion-1.0 | `License.txt` chưa đọc; [DỮ LIỆU-2] community license riêng | **26 GB** (Lite 24 GB) | **Không** — README ghi rõ không hỗ trợ động vật | **Thấp** |
| **Meshy Text to Motion / Animation library** | https://docs.meshy.ai/api/pricing.md | 3–10 credit; 3 credit/animation | Cloud | Không (rig humanoid) | Thấp |
| **Tripo retarget** | https://developers.tripo3d.ai/ | 10 credit/animation, 100+ preset | Cloud | Bốn chân: có preset (số lượng/chất lượng chưa xác minh) | Vừa |
| **Rokoko** (Vision = mocap từ video) | https://rokoko.com/pricing/ | Starter miễn phí: 30 giây video/tháng, xuất FBX; Basic 10–12, Plus 20–28, Pro 50–70 USD/tháng (trang có một khối giá mâu thuẫn) | Cloud | Không (người) | Thấp |
| **DeepMotion** (Animate 3D, SayMotion) | https://www.deepmotion.com/pricing | Trang chỉ dẫn link, không có số → chưa xác minh; có API | Cloud | Không (người) | Thấp |
| **Move.ai**, **Plask**, **QuickMagic** | [DỮ LIỆU-2] | Giá mâu thuẫn / không có → chưa xác minh | Cloud | Không (người) | Thấp |
| **MDM, MoMask, WHAM, GVHMR, 4DHumans** | — | **chưa xác minh** trong phiên này. [NỀN]: đều dựng trên mô hình thân người SMPL (license SMPL có điều khoản riêng cho thương mại), dữ liệu huấn luyện mocap người | GPU | **Không** | Thấp |
| **Puppeteer** (animation theo video cho vật thể bất kỳ) | https://github.com/Seed3D/Puppeteer | Apache-2.0 | ? | **Có về nguyên tắc** | Vừa (nghiên cứu) |

**[NHẬN ĐỊNH]:** với heo/cá/sinh vật chibi, animation thực dụng nhất vẫn là **procedural / keyframe do agent viết** (nhún, lắc, bơi hình sin, vẫy vây) — đúng cách dự án đang làm với puppet rig 2D (decision 050). AI mocap gần như không giúp gì cho bộ nhân vật này.

### 2g. Blender và xưởng tự động hóa

| Hạng mục | Nội dung | Nhãn |
|---|---|---|
| **Blender Python API** | `blender -b -P script.py` chạy không giao diện; `bpy` làm được import GLB, remesh, UV, rig, keyframe, render, export. Miễn phí (GPL; output thuộc người dùng). Chạy tốt trên máy dự án | [NỀN] — không mở được docs trong phiên này |
| **Render headless** | Cycles chạy CPU/GPU không cần màn hình; Eevee cần ngữ cảnh GPU (trên Windows có card NVIDIA thường chạy được ở chế độ `-b`) | [NỀN], cần thử thật |
| **Geometry Nodes** | Dựng hình procedural có tham số, điều khiển qua `bpy` | [NỀN] |
| **glTF exporter** | Có sẵn, xuất GLB kèm skin + animation | [NỀN] |
| **MCP for Blender** (trước là `ahujasid/blender-mcp`, đã đổi tên; PyPI `mcp-for-blender`) | MIT, dự án cộng đồng. Chạy Python tùy ý trong Blender, xem viewport, tích hợp Poly Haven (CC0), Sketchfab, **Hyper3D Rodin, Hunyuan3D (Tencent Cloud), Meshy, Tripo**. Cần Blender ≥ 3.0, Python ≥ 3.10, `uv`. **Cảnh báo:** socket không xác thực/mã hóa; có telemetry ẩn danh mặc định (tắt bằng `DISABLE_TELEMETRY=true`); dữ liệu opt-in có thể dùng huấn luyện AI | [DỮ LIỆU] https://github.com/ahujasid/blender-mcp |
| **Blender MCP chính thức (Blender Lab)** | Có tồn tại: `blender.org/lab/mcp-server`, mã ở `projects.blender.org/lab/blender_mcp`; cần Blender ≥ 5.1; add-on v1.0.3 (9/2026); định hướng phân tích/gỡ lỗi/scripting, không phải sinh art; chạy code LLM không sandbox | **[DỮ LIỆU-2]** — trang chính thức trả 403 |
| **Unity batchmode** | **Đã chạy thật trong repo**: Unity 6000.6.8f1 batchmode, recipe → PNG → manifest | [DỮ LIỆU] `docs/decisions/051-unity-studio.md` |
| **Godot headless** | [NỀN] Godot (MIT) có chế độ `--headless`; chưa xác minh khả năng render offscreen | [NỀN] |

**[NHẬN ĐỊNH]:** với agent, **`blender -b -P` trực tiếp ổn định và tái lập được hơn MCP** (MCP hợp thao tác tương tác; pipeline hàng trăm asset nên là script có hash, giống `scripts/studio/`). Hai chuẩn xưởng (Unity đã có, Blender mới) không nên cùng tồn tại lâu dài; Blender mạnh hơn hẳn ở import mesh AI, remesh, rig, bake.

### 2h. Runtime 3D cho Electron + Phaser — **phần lớn [NỀN], chưa mở nguồn**

| Lựa chọn | Nội dung | Nhãn |
|---|---|---|
| **Phaser 4** | **Không có 3D và sẽ không có**: Phaser Studio viết "Phaser 4 is a 2D engine"; demo 3D từng thấy thuộc engine khác (Phaser AE). Phaser 4.2 có "New Spine Renderer, Mesh2D, Stencil APIs" (chỉ thấy tiêu đề bài, chưa đọc) | [DỮ LIỆU] https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update |
| **phas3d** | Fork thử nghiệm thêm pipeline 3D cho Phaser 4; tự cảnh báo không ổn định, chỉ để R&D | [DỮ LIỆU-2] |
| **enable3d** (Phaser 3 + three.js + ammo.js) | **LGPL-3.0**; phụ thuộc `phaser ^3.55.2` (ghi chạy với 3.60/3.70), `three 0.171.0`; không thấy ngày phát hành/commit gần nhất; **không nhắc Phaser 4** | [DỮ LIỆU] https://github.com/enable3d/enable3d |
| **three.js** | [NỀN] MIT; GLTFLoader, DRACOLoader, KTX2Loader, Meshopt decoder, MeshToonMaterial, OutlineEffect; trưởng thành nhất, cộng đồng lớn nhất | [NỀN] chưa xác minh phiên bản hiện hành |
| **Babylon.js** | [NỀN] Apache-2.0; engine đầy đủ hơn (scene, animation, GUI, inspector), glTF tốt | [NỀN] |
| **PlayCanvas engine** | [NỀN] MIT; dùng độc lập không cần editor cloud; nhẹ | [NỀN] |
| **Định dạng** | [NỀN] glTF/GLB là chuẩn; KTX2 (Basis) giảm VRAM texture; Draco/Meshopt nén hình học; cả ba là chuẩn mở | [NỀN] |

**[NHẬN ĐỊNH] cho phương án B/C:**
- Không có đường "3D trong Phaser" được hỗ trợ chính thức. Đường khả thi là **canvas three.js đặt dưới/trên canvas Phaser** (hai WebGL context, Phaser giữ UI/logic hiển thị 2D), hoặc three.js **render ra texture / sprite sheet** rồi đưa vào Phaser.
- enable3d là LGPL và gắn Phaser 3 — không nên làm nền cho bản thương mại dài hạn.
- GPU tích hợp: nhân vật chibi low-poly (vài nghìn tam giác), toon shader không PBR, texture nhỏ → tải nhẹ; rủi ro chính là **hai context WebGL + bộ nhớ**, không phải số tam giác. Chưa đo.

### 2i. 2D đối chứng (phương án A)

| Công cụ | Giá / license | Ghi chú | Nhãn |
|---|---|---|---|
| **Spine** | Essential 69 USD (giá gốc 99) — **không có mesh, IK**; **Professional 379 USD (gốc 449)** — đủ tính năng; Enterprise 2.499 USD + 379/người/năm, bắt buộc khi doanh thu > 500.000 USD/năm. License một lần theo người dùng; có license thì được dùng Spine Runtimes trong sản phẩm | Phaser 4.2 có renderer Spine mới (tiêu đề bài) | [DỮ LIỆU] https://esotericsoftware.com/spine-purchase |
| **Rive** | Free 0 USD (xuất kèm splash screen); Cadet 9 USD/ghế/tháng (bỏ splash); Voyager 32; Enterprise 120 (≥ 10 triệu USD doanh thu). Runtime **MIT, không royalty**; có runtime JavaScript; **không nhắc Phaser** | Có CLI (publish/push) → agent điều khiển được một phần | [DỮ LIỆU] https://rive.app/pricing |
| **Live2D Cubism** | Xuất bản nội dung dùng SDK **phải ký Release License**; ngưỡng 10 triệu yên doanh thu/năm phân biệt indie và business; giá hiện hành chưa xác minh | Hợp nhân vật anime nửa người, ít hợp thú chibi toàn thân | [DỮ LIỆU-2] (trang tải về không có số) |
| **DragonBones**, **Spriter** | chưa xác minh trạng thái 2026. [NỀN]: DragonBones miễn phí, editor đã ngừng phát triển nhiều năm; Spriter ít cập nhật | — | [NỀN] |
| **Puppet rig tự viết** (decision 050) | 0 đồng, đã có trong repo, agent điều khiển hoàn toàn | Đối chứng mạnh nhất về chi phí | [DỮ LIỆU] repo |
| **Phaser Mesh2D / lighting normal-map** | Phaser 4.2 có Mesh2D (tiêu đề bài). Lighting normal-map trên sprite: [NỀN] có từ Phaser 3 (Light2D) | Cho hiệu ứng "2.5D" trên tranh sẵn có | [DỮ LIỆU-2] + [NỀN] |
| **AI sinh sprite sheet / tách layer** | chưa xác minh (tra cứu bị chặn). Dữ liệu nội bộ: vẽ lại từng khung bằng AI **lệch nhận diện** (batch `rig-05-aquarium-move`) | — | [DỮ LIỆU] `docs/decisions/051-unity-studio.md` |

**So sánh công bằng — [NHẬN ĐỊNH]:** mọi bước 3D từ mức 3 trở lên đều có tỉ lệ sửa tay; phương án 2D (puppet rig có sẵn, hoặc Spine Pro 379 USD một lần) không có rủi ro mặt sau/topology/UV và giữ nguyên tranh đã duyệt. 3D chỉ thắng khi cần **xoay nhân vật nhiều góc** hoặc **tái dùng một bộ animation cho rất nhiều nhân vật cùng khung xương**.

---

## 3. Xếp hạng theo ưu tiên của chủ dự án

Thứ tự ưu tiên: (1) miễn phí + mã mở → (2) miễn phí giới hạn chất lượng tốt → (3) chạy local → (4) có API/CLI/SDK → (5) trả phí chỉ khi vượt trội.

| Hạng | Công cụ | (1) | (2) | (3) trên 6 GB | (4) | Lý do |
|---|---|---|---|---|---|---|
| 1 | **Blender + `bpy`** (Rigify, QuadriFlow, Smart UV, glTF, toon render) | Có | — | **Được** | CLI/Python | Xương sống của mọi kịch bản; không phụ thuộc VRAM [NỀN] |
| 2 | **TRELLIS.2 / Pixal3D** (MIT) | Có | — | **Không** (24 GB) | Python/CLI | Chất lượng + license tốt nhất nhóm mở; cần GPU thuê hoặc demo cloud |
| 3 | **SkinTokens / UniRig** (MIT) | Có | — | **Không** (14 / 8 GB) | CLI | Rig mở tốt nhất cho non-humanoid |
| 4 | **TripoSR** (MIT) | Có | — | Sát ngưỡng | CLI | Thứ duy nhất MIT + chạy được local; chất lượng đời 2024 |
| 5 | **Hunyuan3D-2mini / 2GP** | Mở weights, license hạn chế | — | Sát ngưỡng (shape) | API server | Chất lượng hình học tốt hơn TripoSR nhưng vướng license lãnh thổ |
| 6 | **Tripo API/CLI** | Không | Free phi thương mại [DỮ LIỆU-2] | Cloud | **API + CLI**, 0,01 USD/credit | Trả phí đáng nhất: quad, rig bốn chân, trả theo dùng |
| 7 | **Meshy** | Không | Free 100 credit, **CC BY 4.0** | Cloud | API từ Pro | Tốt cho prop; rig chỉ humanoid |
| 8 | **Cascadeur Indie** | Không | Free phi thương mại | Local | GUI | Chỉ khi cần animation làm tay chất lượng cao |
| 9 | **Rodin** | Không | Trả theo kết quả | Cloud | API ở gói 120 USD | Chất lượng cao, vượt ngân sách |

### Bộ công cụ đề xuất theo kịch bản

**Kịch bản 1 — chỉ local trên RTX 3050 6 GB** [NHẬN ĐỊNH]
- Hình học: TripoSR (MIT) để thử; Hunyuan3D-2mini qua 2GP `--profile 4` nếu phần bản quyền cho phép (chỉ shape). Cả hai **sát ngưỡng 6 GB, chưa thử**; RAM 16 GB cũng là giới hạn.
- Dọn mesh / remesh / UV / rig / animation / render: Blender headless bằng script. Rig: Rigify hoặc xương tự đặt bằng `bpy`. Animation: procedural.
- Texture: không dùng model texture (không đủ VRAM) → vertex color / bảng màu + toon shader, hoặc chiếu tranh gốc.
- **Trần chất lượng:** mức 2 ở chất lượng đời cũ; mức 3–5 do script + agent tự làm. Thực chất đây là "Blender bằng code có thêm mesh AI thô làm phôi".

**Kịch bản 2 — local + cloud miễn phí** [NHẬN ĐỊNH]
- Thêm phôi mesh chất lượng cao từ: demo công khai của TRELLIS.2 / Pixal3D / Hunyuan (hạn mức chưa xác minh); Hunyuan global 20 lượt/ngày [DỮ LIỆU-2]; Meshy Free 100 credit/tháng (**CC BY 4.0 — phải ghi công nếu ship**, không có API → thao tác tay); Flow Studio Free ~15 lượt/tháng [DỮ LIỆU-2].
- GPU notebook miễn phí (Colab/Kaggle) để chạy TripoSG / UniRig (8 GB): khả thi về VRAM, hạn mức và điều khoản chưa xác minh.
- Hậu kỳ vẫn là Blender local.
- **Hạn chế:** không tự động hóa được (không API ở gói free), license lẫn lộn (CC BY, Tencent, non-commercial ở Tripo free), đưa tranh dự án lên dịch vụ ngoài → **cần chủ dự án duyệt**.

**Kịch bản 3 — ngân sách ~20–100 USD/tháng** [NHẬN ĐỊNH]
- **Tripo API** (trả theo dùng) làm đường chính cho nhân vật: image/multiview-to-3D → retopo quad → auto-rig bốn chân; agent gọi qua CLI.
- Hoặc **thuê GPU 24 GB theo giờ** chạy TRELLIS.2/Pixal3D + SkinTokens (đều MIT): không phí theo asset, license sạch nhất, agent chạy bằng CLI. Giá thuê GPU chưa xác minh.
- **Meshy Pro (~20 USD)** nếu cần nhiều prop + API + license private.
- **Cascadeur Indie 96 USD/năm** chỉ khi có người làm animation tay (không có quadruped AutoPosing).
- Đối chứng 2D cùng ngân sách: **Spine Professional 379 USD một lần**.

---

## 4. Quy mô hàng trăm / nghìn asset

- **Tính ổn định giữa các lần sinh:** model sinh là ngẫu nhiên theo seed; cùng một ảnh cho mesh khác nhau giữa các lần và giữa các phiên bản model (Meshy đi từ 5 → 6 → 7 → 7.1 trong ~15 tháng; Tripo 2.5 → 3.0 → H3.1/P2.0). [DỮ LIỆU] https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026 ; https://docs.meshy.ai/api/pricing.md. **[NHẬN ĐỊNH]** dịch vụ cloud đổi model theo quý → asset sinh cách nhau vài tháng sẽ lệch chất; muốn tái lập phải ghim model local (TRELLIS.2 + seed) hoặc ghim model id trong API.
- **Nhất quán phong cách:** không model nào nhận "file phong cách" chung. Nhất quán phải đến từ (a) tranh đầu vào đã nhất quán, và (b) **hậu kỳ tất định**: cùng toon shader, cùng bảng màu, cùng outline, cùng camera — đúng bài học "một nguồn phong cách" của decision 051. [NHẬN ĐỊNH]
- **Tỉ lệ làm lại:** không tìm thấy số liệu độc lập. [GIẢ ĐỊNH] prop tĩnh đơn giản 20–40 % phải sinh lại; nhân vật cần rig 50–80 % cần sinh lại hoặc sửa tay ít nhất một bước (mặt sau sai, tay/chân dính thân, weight lem). Phải đo bằng pilot.
- **Chi phí mở rộng (ước lượng, giá Tripo API 0,01 USD/credit):**

| Loại | Phép tính [GIẢ ĐỊNH] | Mỗi asset dùng được | 100 asset | 1.000 asset |
|---|---|---|---|---|
| Prop tĩnh | (30 sinh + 20 retopo) = 50 credit × 1,5 lượt | ≈ 0,75 USD | ≈ 75 USD | ≈ 750 USD |
| Nhân vật có rig | (30 sinh + 20 texture + 30 retopo + 25 rig + 5 × 10 animation) = 155 credit × 3 lượt | ≈ 4,7 USD | ≈ 470 USD | ≈ 4.700 USD |
| TRELLIS.2 trên GPU thuê | không phí theo asset; chỉ giờ GPU | chưa xác minh | — | — |

- **Chi phí thật nằm ở thời gian kiểm và sửa**, không ở credit. [NHẬN ĐỊNH] Với đội không có nghệ sĩ 3D, mỗi nhân vật vẫn cần một vòng QA bằng mắt (xoay, bẻ khớp, xem từng animation) — cần cổng QA tự động kiểu `assets:check` trước khi mở rộng.
- **Lưu trữ:** Meshy ghi file kết quả có thể hết hạn (`expires_at`) → phải tải về và lưu local ngay. [DỮ LIỆU] https://docs.meshy.ai/en/api/rigging-and-animation

---

## 5. Kết luận trung thực (11/2026)

Cho **nhân vật chibi động vật có rig + animation dùng được trong game thương mại**:

| Mức | AI tự làm được? |
|---|---|
| 1 Render trông 3D | **Có.** |
| 2 Mesh xoay được | **Có**, chất lượng tốt với model 2025–2026 — nhưng **không chạy được trên máy 6 GB** ở chất lượng đó (TRELLIS.2 cần 24 GB); local chỉ có model đời cũ / chỉ hình học. Mặt sau là phỏng đoán. |
| 3 Topology | **Một phần.** Quad đều: có (trả phí). Edge loop đúng khớp: không. |
| 4 Rig / skin | **Một phần.** Bốn chân: ra được rig thô, cần kiểm weight. Cá, cánh, tai, đuôi, tỷ lệ chibi: thường phải sửa hoặc tự đặt xương. |
| 5 Animation | **Gần như không** cho non-humanoid. Toàn bộ text-to-motion và mocap AI là cho người. Phải procedural / keyframe. |
| 6 Production | **Không.** Nhất quán phong cách, UV, LOD, QA vẫn là việc của người (hoặc pipeline script do agent viết và người duyệt). |

**Phần vẫn cần nghệ sĩ 3D (hoặc người có mắt 3D):** quyết định hình khối mặt sau/độ dày; edge loop quanh khớp và mặt; weight painting vùng cổ–đầu–chân ngắn; animation có cá tính (squash/stretch, timing); và giữ nhất quán phong cách trên cả bộ.

**[NHẬN ĐỊNH] tổng:** AI hiện đưa một đội không có nghệ sĩ 3D tới **mức 2 chắc chắn, mức 3–4 chập chờn, mức 5–6 chưa**. "Chuyển toàn bộ sang 3D runtime" chưa phải việc AI tự gánh được. Hướng có tỉ lệ thành công cao nhất với nguồn lực này là dùng 3D **như xưởng offline** (mesh AI từ chính tranh đã duyệt → Blender headless → toon render ra PNG cho Phaser) cho một nhóm asset hẹp, sau khi qua **một pilot có cổng chấm điểm** như U1 — vì cổng U1 trước đây đã cho thấy "đồng bộ hơn" không đồng nghĩa "đẹp hơn".

---

## Nguồn
Tất cả truy cập ngày **2026-11-11**. Chỉ liệt kê URL đã mở thành công.

Image-to-3D mã mở
- https://github.com/microsoft/TRELLIS.2
- https://github.com/microsoft/TRELLIS
- https://github.com/TencentARC/Pixal3D
- https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1
- https://github.com/Tencent-Hunyuan/Hunyuan3D-2
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE
- https://github.com/deepbeepmeep/Hunyuan3D-2GP
- https://github.com/VAST-AI-Research/TripoSG
- https://github.com/VAST-AI-Research/TripoSR
- https://huggingface.co/stabilityai/stable-fast-3d
- https://github.com/Stability-AI/stable-point-aware-3d
- https://github.com/TencentARC/InstantMesh
- https://github.com/thu-ml/CRM
- https://github.com/AiuniAI/Unique3D
- https://github.com/Stable-X/Stable3DGen
- https://github.com/stepfun-ai/Step1X-3D
- https://github.com/wgsxm/PartCrafter
- https://app.cinevva.com/guides/ai-3d-model-generation-timeline-2026 (trang tổng hợp bên thứ ba, cập nhật 2026-09-06)

Dịch vụ thương mại
- https://www.meshy.ai/pricing
- https://docs.meshy.ai/api/pricing.md
- https://docs.meshy.ai/en/webapp/pricing
- https://docs.meshy.ai/en/api/rigging-and-animation
- https://developers.tripo3d.ai/
- https://hyper3d.ai/pricing
- https://www.sloyd.ai/pricing
- https://www.3daistudio.com/pricing

Texture, retopo, rig, animation
- https://github.com/sakalond/StableGen
- https://github.com/buaacyw/MeshAnythingV2
- https://github.com/VAST-AI-Research/UniRig
- https://github.com/VAST-AI-Research/SkinTokens
- https://github.com/Seed3D/Puppeteer
- https://github.com/Isabella98Liu/RigAnything
- https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400
- https://cascadeur.com/plans
- https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- https://rokoko.com/pricing/
- https://www.deepmotion.com/pricing (mở được nhưng không có số liệu)

Blender, runtime, 2D
- https://github.com/ahujasid/blender-mcp
- https://phaser.io/news/2026/07/no-you-didn-t-miss-a-3d-update
- https://github.com/enable3d/enable3d
- https://esotericsoftware.com/spine-purchase
- https://rive.app/pricing
- https://www.live2d.com/en/cubism/download/editor/ (mở được nhưng không có số liệu)

Tài liệu nội bộ
- `docs/decisions/051-unity-studio.md`

URL **không mở được** (ghi lại để lần sau thử): `https://www.tripo3d.ai/pricing` (403), `https://www.blender.org/lab/mcp-server/` (403), `https://www.kaedim3d.com/pricing` (404), `https://www.csm.ai/pricing` (không phân giải DNS), `https://www.move.ai/pricing` (404), `https://anything.world/pricing` (chuyển hướng sang `everythinguniver.se`, chưa đọc), `https://actorcore.reallusion.com/auto-rig` (trang rỗng), `https://www.tripo3d.ai/help/features/...` (403).

## Điều chưa xác minh
1. **Không có phép thử thực tế nào.** Mọi kết luận "chạy được trên 6 GB" là đối chiếu số công bố, không phải đo. Các dòng "sát ngưỡng" (TripoSR, SF3D, Hunyuan3D-2mini/2GP) có thể thất bại vì Windows + trình duyệt đã chiếm một phần VRAM và vì RAM 16 GB.
2. **Chất lượng với nhân vật chibi/động vật của Sobi:** không tìm thấy đánh giá độc lập; mọi so sánh là blog nhà cung cấp.
3. **Toàn bộ nhóm 2d (trừ MeshAnythingV2), 2g (trừ MCP for Blender và Unity), 2h (trừ Phaser 4 và enable3d)** gắn nhãn [NỀN]: license và tính năng của Blender/bpy/Rigify/QuadriFlow/Instant Meshes/AutoRemesher/xatlas/QuadRemesher/UVPackmaster/three.js/Babylon.js/PlayCanvas/Godot **chưa được mở nguồn trong phiên này** do chạm hạn mức tra cứu.
4. **Tripo:** giá gói web, điều khoản gói Free, danh sách loại rig chính xác (có "aquatic"/"avian" hay không), hạn mức API miễn phí.
5. **Blender MCP chính thức (Blender Lab):** phiên bản, yêu cầu Blender 5.1, phạm vi — chỉ có nguồn thứ cấp.
6. **License weights** (khác license code) của Pixal3D, TripoSG, UniRig, SkinTokens, InstantMesh; license của RigAnything, MeshAnythingV2, HY-Motion, SPAR3D, Roblox Cube; license các phụ thuộc của TRELLIS.2 (nvdiffrast, nvdiffrec, DINOv3).
7. **TRELLIS.2 VRAM thấp** (bản lượng tử hóa / ComfyUI cộng đồng) và **Pixal3D `--low_vram`**: không có số chính thức.
8. **Hunyuan 3D global (3.x):** hạn mức miễn phí 20 lượt/ngày và điều khoản thương mại của output.
9. **Luma Genie, CSM, Kaedim, Spline AI, Autodesk Flow Studio Wonder 3D, Adobe Substance 3D Viewer, Anything World, AccuRIG, DeepMotion, Move.ai, Plask, QuickMagic:** giá/điều khoản chỉ có nguồn thứ cấp mâu thuẫn hoặc không có.
10. **MDM, MoMask, WHAM, GVHMR, 4DHumans, TEXTure/Text2Tex, Material Maker, Meshtron, BPT, DeepMesh:** không tra được.
11. **2D:** Live2D (giá, điều khoản Release License chi tiết), DragonBones, Spriter, AI sinh sprite sheet, AI tách layer (ví dụ Qwen-Image-Layered), chi tiết Mesh2D/lighting của Phaser 4.2.
12. **Giá thuê GPU cloud** và hạn mức GPU notebook miễn phí.
13. **Tỉ lệ làm lại và chi phí mục 4** là giả định, chưa có số đo.
14. **Tỷ giá** quy đổi giá Meshy từ VND.

## Cần chủ dự án cung cấp / duyệt
1. **Có cho phép đưa tranh Sobi (ảnh nhân vật đã duyệt) lên dịch vụ cloud bên ngoài** (Tripo, Meshy, Hunyuan, demo công khai) để thử không? Đây là gửi tài sản dự án ra ngoài; một số dịch vụ có thể dùng dữ liệu để huấn luyện.
2. **Game có bán ở EU / UK / Hàn Quốc không?** Nếu có, mọi model Tencent Hunyuan 2.x cần ý kiến pháp lý trước khi dùng cho asset ship.
3. **Chấp nhận ghi công CC BY 4.0** trong game (nếu dùng gói Free của Meshy) hay không?
4. **Ngân sách thử nghiệm:** có duyệt một khoản nhỏ một lần (đề xuất ≤ 20–30 USD credit Tripo API hoặc vài giờ GPU 24 GB) cho pilot không?
5. **Pilot đề xuất để lấy số thật** (cần duyệt vì phải cài phần mềm, ngoài phạm vi khảo sát này): 3 nhân vật (một heo, một cá, một sinh vật phiêu lưu) × 2 đường (local 6 GB; cloud) → Blender headless toon render → đặt cạnh tranh gốc trong game, chấm theo cổng kiểu U1 (đẹp hơn? đồng bộ hơn? đáng đổi?), đồng thời đo VRAM thật, thời gian, tỉ lệ làm lại.
6. **Có cài Blender trên máy dự án không**, và có giữ song song với Unity Studio (`studio/`) hay thay thế?
7. **Mục tiêu 3D thật sự là gì:** nhân vật xoay nhiều góc trong gameplay (cần 3D runtime — phương án B/C), hay chỉ cần hình đẹp và đồng bộ hơn (xưởng offline / 2.5D là đủ)? Câu trả lời quyết định có cần đầu tư nhóm 2h hay không.
8. **Rà lại phần còn thiếu của khảo sát** (mục "Điều chưa xác minh" 3, 4, 5, 9–12) khi hạn mức tra cứu web được mở lại.
