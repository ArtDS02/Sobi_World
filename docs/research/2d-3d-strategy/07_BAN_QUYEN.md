# 07 — Bản quyền và giấy phép (2D / Hybrid / 3D + pipeline AI)

> **Người viết là agent phân tích giấy phép, KHÔNG phải luật sư.** Tài liệu này là rà soát kỹ thuật dựa trên văn bản giấy phép / điều khoản đọc được ngày **2026-11-11**; không phải tư vấn pháp lý và **không cam kết an toàn tuyệt đối** cho bất kỳ công cụ nào. Điều khoản dịch vụ thay đổi thường xuyên: phải đọc lại và chụp lưu tại thời điểm dùng thật (mục 6).

**Nhãn:** **[DỮ LIỆU]** = đọc trực tiếp từ nguồn chính thức trong phiên này (kèm URL / đường dẫn file). **[DỮ LIỆU-2]** = nguồn thứ cấp (blog, tracker, diễn đàn, kết quả tìm kiếm) hoặc lấy lại từ `05_CONG_NGHE_AI_3D.md`. **[NHẬN ĐỊNH]** = đánh giá của người viết. **[GIẢ ĐỊNH]** = giả định về dự án. **[NỀN]** = kiến thức nền chưa mở được nguồn trong phiên. "Chưa xác minh" = không mở được trang giấy phép.

**Giả định về dự án [GIẢ ĐỊNH]:** Sobi World bán bản build Windows qua kênh toàn cầu (ví dụ cửa hàng game quốc tế), tức là có người mua ở EU, Vương quốc Anh, Hàn Quốc; doanh thu + vốn hiện dưới 100.000 USD/năm; chủ thể phát hành ở Việt Nam. Nếu sai một trong ba điểm, các mức rủi ro bên dưới phải chấm lại.

---

## 1. Khung phân biệt

### 1.1 Ba khái niệm hay bị lẫn

| Khái niệm | Nghĩa | Ví dụ đã kiểm |
|---|---|---|
| **Miễn phí** | Không mất tiền để tải / dùng. Không nói gì về quyền thương mại | Cascadeur Free (phi thương mại), BRIA RMBG (tải tự do, CC BY-NC), nvdiffrast (tải tự do, cấm thương mại) |
| **Mã nguồn mở** (theo nghĩa OSI) | Cho dùng, sửa, phân phối lại cho mọi mục đích, kể cả thương mại | MIT, Apache-2.0, BSD, GPL, LGPL |
| **"Open weights" / source-available** | Tải được weights, nhưng giấy phép tự soạn có điều kiện | Tencent Hunyuan Community License (loại trừ lãnh thổ), Stability Community License (ngưỡng doanh thu), S-Lab License (phi thương mại), NVIDIA Source Code License (phi thương mại) |
| **Được dùng thương mại** | Phải đọc từng lớp bên dưới; một lớp phi thương mại là đủ chặn cả pipeline | — |

### 1.2 Bốn lớp giấy phép của một công cụ AI

1. **CODE** — file `LICENSE` của repo. Chỉ nói về mã nguồn.
2. **WEIGHTS** — model card (Hugging Face). Có thể khác code (ví dụ code MIT, weights CC BY-NC). Repo GitHub ghi "MIT" **không** tự động phủ weights.
3. **DATASET huấn luyện** — giấy phép của dữ liệu. Không ràng buộc trực tiếp người dùng model theo hợp đồng, nhưng là nguồn rủi ro: (a) tác giả model có thể đã vi phạm điều khoản dataset; (b) đầu ra có thể tái hiện vật thể trong dataset. Pháp luật về việc này chưa ngã ngũ (mục 3).
4. **ĐIỀU KHOẢN ĐẦU RA** — ai sở hữu / được làm gì với thứ model sinh ra. Với model mở: nằm trong giấy phép weights. Với dịch vụ: nằm trong Terms of Service, thường **khác nhau giữa gói free và gói trả phí**.

Thêm lớp thứ 5 hay bị quên: **PHỤ THUỘC** (rasterizer, bộ tách nền, encoder ảnh). Đây là chỗ nhiều pipeline "MIT" thực tế thành phi thương mại.

### 1.3 Các thuật ngữ cần kiểm ở mỗi giấy phép

- **Attribution:** có phải ghi công không, ghi ở đâu (trong game, trang credit, file NOTICE).
- **Redistribution:** được phân phối lại *cái gì* — công cụ, weights, hay asset đầu ra nằm trong game. Game bán ra = phân phối asset đầu ra tới người mua.
- **Sublicensing:** có được cấp quyền tiếp cho người khác (nhà phát hành, cửa hàng) không. Giấy phép "non-transferable" hạn chế điều này.
- **Tác phẩm phái sinh:** bản đã sửa (retopo, vẽ lại texture) có còn chịu giấy phép gốc không. CC BY-SA và GPL "lây"; MIT / Apache thì không.
- **Hạn chế đầu ra AI:** cấm dùng đầu ra để train model khác; giới hạn lãnh thổ; yêu cầu gắn nhãn AI.
- **Nguồn gốc đầu vào / đầu ra:** ảnh đưa vào có phải của mình; đầu ra có giống tác phẩm có sẵn không. Mọi điều khoản đã đọc đều đẩy trách nhiệm này về người dùng.

---

## 2. Bảng giấy phép

Cột "Rủi ro" là **[NHẬN ĐỊNH]** cho trường hợp Sobi World (bán thương mại toàn cầu, studio nhỏ), không phải đánh giá chung.

### 2.1 Image / text-to-3D mở

| Mục | Code | Weights | Dataset công bố và rủi ro | Quyền thương mại với đầu ra | Attribution | Redistribution / sublicense | Hạn chế đặc biệt | Rủi ro | Nguồn |
|---|---|---|---|---|---|---|---|---|---|
| **TRELLIS v1** (Microsoft) | MIT [DỮ LIỆU] | MIT (README: "TRELLIS models and the majority of the code"; model card ghi `mit`) [DỮ LIỆU] | TRELLIS-500K lấy từ Objaverse(-XL), ABO, 3D-FUTURE, HSSD, Toys4k [DỮ LIỆU]. HSSD là CC BY-NC; Objaverse có phần NC (mục 2.2) | MIT không hạn chế đầu ra | Giữ notice MIT khi phân phối code | Tự do | Submodule **diffoctreerast**: giấy phép phái sinh từ Gaussian-Splatting License của Inria — "THE USER CANNOT USE, EXPLOIT OR DISTRIBUTE THE SOFTWARE FOR COMMERCIAL PURPOSES" [DỮ LIỆU]. Script cài còn kéo nvdiffrast, kaolin | **Trung bình** (cao nếu chạy đường có diffoctreerast / nvdiffrast) | https://github.com/microsoft/TRELLIS ; https://huggingface.co/microsoft/TRELLIS-image-large ; https://raw.githubusercontent.com/JeffreyXiang/diffoctreerast/master/LICENSE |
| **TRELLIS.2** (Microsoft) | MIT [DỮ LIỆU] | MIT (model card TRELLIS.2-4B) [DỮ LIỆU] | README nêu huấn luyện trên Objaverse-XL [DỮ LIỆU]; danh sách đầy đủ không ghi | MIT không hạn chế | Notice MIT | Tự do | README tự cảnh báo: **nvdiffrast** và **nvdiffrec** "governed by its own License" — cả hai là NVIDIA Source Code License, chỉ phi thương mại [DỮ LIỆU]. Encoder ảnh: theo `05_CONG_NGHE_AI_3D.md` là DINOv3 (DINOv3 License của Meta, giấy phép tự soạn; điều khoản thương mại **chưa đọc hết**) | **Trung bình** | https://github.com/microsoft/TRELLIS.2 ; https://huggingface.co/microsoft/TRELLIS.2-4B |
| **Hunyuan3D 2.0** (Tencent; gồm 2mini / 2mv / Turbo) | Tencent Hunyuan 3D 2.0 Community License (không phải OSI) [DỮ LIỆU] | Cùng giấy phép | Không công bố trong giấy phép | "Tencent claims no rights in Outputs" (§6.d), **nhưng** §5(c) cấm dùng / phân phối / hiển thị cả **Output** ngoài Territory | NOTICE bắt buộc khi phân phối model; "Powered by Tencent Hunyuan" chỉ khuyến khích | "non-exclusive, non-transferable"; phải kèm bản giấy phép khi phân phối model | **Territory = toàn cầu trừ EU, UK, Hàn Quốc**; cấm dùng model / Output để cải thiện model AI khác (§5.b); > 1 triệu MAU phải xin phép | **Cao** (xem ghi chú A) | https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE |
| **Hunyuan3D 2.1** | Tencent Hunyuan 3D 2.1 Community License [DỮ LIỆU] | Cùng (model card: `tencent-hunyuan-community`) | Không công bố | Như 2.0 | Như 2.0 | Như 2.0 | Như 2.0. Nguyên văn §5(c): "You must not use, reproduce, modify, distribute, or display the Tencent Hunyuan 3D 2.1 Works, Output or results of the Tencent Hunyuan 3D 2.1 Works outside the Territory." | **Cao** | https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE |
| **Hunyuan3D-Part** | Tencent Hunyuan 3D-Part Community License (23/09/2025) [DỮ LIỆU] | Cùng | — | Cùng mẫu | Cùng mẫu | Cùng mẫu | Cùng loại trừ EU/UK/KR + 1 triệu MAU | **Cao** | https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-Part/main/LICENSE |
| **Hunyuan3D-Omni** | Chưa mở được file LICENSE | Model card: `tencent-hunyuan-community` [DỮ LIỆU] | — | Chưa xác minh | — | — | Nhiều khả năng cùng mẫu [NHẬN ĐỊNH] | **Chưa xác định** (coi như Cao) | https://huggingface.co/tencent/Hunyuan3D-Omni |
| **Hunyuan3D 2.5 / 3.0 / 3.1** | Không thấy repo weights mở trong tổ chức GitHub Tencent-Hunyuan (liệt kê qua API ngày 2026-11-11) [DỮ LIỆU]; chỉ có dạng dịch vụ / API [DỮ LIỆU-2] | — | — | Theo ToS của nền tảng Tencent — **chưa xác minh** | — | — | — | **Chưa xác định** | https://api.github.com/orgs/Tencent-Hunyuan/repos |
| **TripoSR** | MIT (Tripo AI & Stability AI) [DỮ LIỆU] | README: MIT gồm "source code, pretrained models" [DỮ LIỆU] | Không nêu trên trang | Không hạn chế | Notice MIT | Tự do | Tách nền mặc định dùng rembg (xem 2.1b) | **Thấp–trung bình** | https://github.com/VAST-AI-Research/TripoSR |
| **TripoSG** | MIT [DỮ LIỆU] | Model card `mit` [DỮ LIỆU] | "2 million curated Image-SDF pairs", không nêu nguồn | Không hạn chế | Notice MIT | Tự do | Repo dẫn tới **RMBG-1.4** để tách nền — phi thương mại (2.1b) | **Trung bình** (thấp nếu thay bộ tách nền) | https://github.com/VAST-AI-Research/TripoSG ; https://huggingface.co/VAST-AI/TripoSG |
| **Stable Fast 3D** | Stability AI Community License [DỮ LIỆU] | Cùng; repo gated | Renders từ Objaverse; "We filter objects based on the review of licenses" [DỮ LIỆU] | "You own any outputs … to the extent permitted by applicable law" | Phải hiển thị **"Powered by Stability AI"** (web, UI, trang about hoặc tài liệu sản phẩm) | Phân phối model phải kèm giấy phép + NOTICE | Miễn phí thương mại khi doanh thu năm < **1.000.000 USD**; dùng thương mại **phải đăng ký** với Stability; cấm dùng đầu ra để tạo / cải thiện foundation model | **Trung bình** | https://huggingface.co/stabilityai/stable-fast-3d ; https://stability.ai/community-license-agreement |
| **SPAR3D (Stable Point Aware 3D)** | Stability AI Community License [DỮ LIỆU] | Cùng | Objaverse, có lọc theo license [DỮ LIỆU] | Như SF3D | Như SF3D | Như SF3D | Như SF3D | **Trung bình** | https://huggingface.co/stabilityai/stable-point-aware-3d |
| **InstantMesh** (TencentARC) | Apache-2.0 [DỮ LIỆU] | Model card `apache-2.0` [DỮ LIỆU] | Dataloader `objaverse.py` → Objaverse; không công bố bộ lọc | Không hạn chế | NOTICE Apache | Tự do | Dựng trên **Zero123++** (code Apache-2.0 [DỮ LIỆU]; license weights Zero123++ **chưa xác minh**); FlexiCubes; rembg | **Trung bình** | https://github.com/TencentARC/InstantMesh ; https://huggingface.co/TencentARC/InstantMesh |
| **CRM** (thu-ml) | MIT [DỮ LIỆU] | Không ghi riêng | Không nêu | — | — | — | Acknowledgement nêu **nvdiffrast**, kaolin, GET3D | **Trung bình** | https://github.com/thu-ml/CRM |
| **Unique3D** | MIT [DỮ LIỆU] | Không ghi riêng; gói ckpt gồm `realesrgan-x4.onnx`, controlnet-tile… mỗi cái có license gốc riêng, **chưa xác minh** | Không nêu | — | — | — | Nhiều thành phần mượn (Stable Diffusion, Wonder3D, Zero123Plus) | **Chưa xác định** | https://github.com/AiuniAI/Unique3D |
| **Hi3DGen / Stable3DGen** | MIT (Bytedance) [DỮ LIỆU] | Không ghi riêng | Không nêu | — | — | — | Trang tự nêu đã **gỡ phụ thuộc NVIDIA** (kaolin, nvdiffrast, flexicube) "để dùng thương mại được"; phỏng theo TRELLIS | **Thấp–trung bình** | https://github.com/Stable-X/Hi3DGen |
| **Step1X-3D** | Apache-2.0 [DỮ LIỆU] | Không ghi riêng | Objaverse (320K), Objaverse-XL (480K) [DỮ LIỆU] | — | — | — | Tái dùng `custom_rasterizer` + `differentiable_renderer` **của Hunyuan3D 2.0** → kéo theo Tencent Community License cho phần texture [NHẬN ĐỊNH] | **Trung bình–cao** | https://github.com/stepfun-ai/Step1X-3D |
| **MeshAnything / V2** | **S-Lab License 1.0** — chỉ "for non-commercial purpose"; thương mại phải liên hệ tác giả [DỮ LIỆU] | Cùng | Objaverse | **Không** | — | — | Phi thương mại | **Cao — loại** | https://raw.githubusercontent.com/buaacyw/MeshAnythingV2/main/LICENSE.txt ; https://raw.githubusercontent.com/buaacyw/MeshAnything/main/LICENSE.txt |
| **UniRig** | MIT [DỮ LIỆU] | Model card `mit` [DỮ LIỆU] | Articulation-XL2.0 (license chưa đọc); Rig-XL lấy từ Objaverse-XL + VRoid [DỮ LIỆU] | Không hạn chế | Notice MIT | Tự do | Dữ liệu VRoid: điều khoản VRoid Hub **chưa xác minh** | **Thấp–trung bình** | https://github.com/VAST-AI-Research/UniRig ; https://huggingface.co/VAST-AI/UniRig |

**Ghi chú A — Hunyuan và Việt Nam.** [DỮ LIỆU] Việt Nam **không** bị loại: Territory là "worldwide … excluding the European Union, United Kingdom and South Korea". Chạy model tại Việt Nam nằm trong phạm vi cấp phép. [NHẬN ĐỊNH] Vấn đề nằm ở đầu ra: §5(c) cấm "use, distribute, or display" cả **Output** ngoài Territory. Một game bán cho người mua ở EU / UK / Hàn Quốc có chứa model, texture hoặc sprite render từ Output của Hunyuan là phân phối và hiển thị Output ngoài Territory. Chưa thấy điều khoản nào miễn trừ cho Output đã chỉnh sửa. Vì vậy với giả định bán toàn cầu, mọi bản Hunyuan3D mở xếp **Cao**. Cách xử lý duy nhất đọc được từ văn bản: không bán ở ba vùng đó, hoặc xin giấy phép riêng từ Tencent. Đây là điểm **nên hỏi luật sư** trước khi dùng dù chỉ một asset.

#### 2.1b Phụ thuộc hay bị quên

| Phụ thuộc | Giấy phép | Dùng thương mại | Rủi ro | Nguồn |
|---|---|---|---|---|
| **nvdiffrast** (NVIDIA) | "Nvidia Source Code License (1-Way Commercial)"; §3.3: "The Work and any derivative works thereof only may be used or intended for use non-commercially" [DỮ LIỆU] | **Không** | **Cao — loại** | https://github.com/NVlabs/nvdiffrast/blob/main/LICENSE.txt |
| **nvdiffrec** (NVIDIA) | NVIDIA Source Code License, §3.3 phi thương mại [DỮ LIỆU] | **Không** | **Cao — loại** | https://github.com/NVlabs/nvdiffrec/blob/main/LICENSE.txt |
| **diffoctreerast** / **diff-gaussian-rasterization** | Gaussian-Splatting License (Inria / MPII): chỉ nghiên cứu, cấm thương mại [DỮ LIỆU] | **Không** | **Cao — loại** | https://raw.githubusercontent.com/graphdeco-inria/diff-gaussian-rasterization/main/LICENSE.md |
| **kaolin** (NVIDIA) | Apache-2.0; còn thư mục `kaolin/non_commercial/` (bản cũ, gồm FlexiCubes trước khi đổi license) và file `LICENSE.NSCL` [DỮ LIỆU] | Có, **trừ** `non_commercial/` | Thấp nếu không import đường `non_commercial` | https://github.com/NVIDIAGameWorks/kaolin |
| **FlexiCubes** (nv-tlabs) | Apache-2.0 ("Copyright (c) 2025, NVIDIA") [DỮ LIỆU]. Bản cũ nhúng trong repo khác có thể còn license phi thương mại cũ | Có (bản hiện hành) | Thấp–trung bình: phải kiểm bản nhúng | https://github.com/nv-tlabs/FlexiCubes |
| **DINOv2** (Meta) | Code + weights Apache-2.0; ngoại lệ: XRay-DINO, Cell-DINO phi thương mại [DỮ LIỆU] | Có (backbone thường) | Thấp | https://github.com/facebookresearch/dinov2 |
| **DINOv3** (Meta) | DINOv3 License (tự soạn; có điều khoản Trade Controls, cấm mục đích quân sự) [DỮ LIỆU một phần]; điều khoản thương mại **chưa đọc hết** | Chưa xác minh | Chưa xác định | https://raw.githubusercontent.com/facebookresearch/dinov3/main/LICENSE.md |
| **xatlas** | MIT [DỮ LIỆU] | Có | Thấp | https://github.com/jpcy/xatlas |
| **rembg** (code) | MIT [DỮ LIỆU]. README: "Model weights carry their own licenses"; **model mặc định hiện là `bria-rmbg` (RMBG-2.0)** [DỮ LIỆU] | Code: có. **Mặc định: không** | **Cao nếu để mặc định**; thấp nếu chỉ định `-m u2net` hoặc model có license mở | https://github.com/danielgatis/rembg |
| **BRIA RMBG-1.4 / 2.0** | 1.4: license `bria-rmbg-1.4`, "non-commercial use"; 2.0: CC BY-NC 4.0; "Commercial use is subject to a commercial agreement with BRIA" [DỮ LIỆU] | **Không** (trừ khi mua) | **Cao — loại** | https://huggingface.co/briaai/RMBG-1.4 ; https://huggingface.co/briaai/RMBG-2.0 |
| **U2Net** | Code Apache-2.0 [DỮ LIỆU]; license weights và dataset DUTS không ghi trên trang | Có (code); weights chưa ghi rõ | Thấp–trung bình | https://github.com/xuebinqin/U-2-Net |
| **Zero123++** | Code Apache-2.0 [DỮ LIỆU]; weights **chưa xác minh** | Chưa xác minh | Chưa xác định | https://raw.githubusercontent.com/SUDO-AI-3D/zero123plus/main/LICENSE |

[NHẬN ĐỊNH] Hệ quả thực tế: "TRELLIS / TRELLIS.2 là MIT" chỉ đúng với code và weights của Microsoft. Bản cài mặc định dùng rasterizer phi thương mại của NVIDIA / Inria ở khâu render và bake texture. Ghi chú: pipeline hiện tại của repo không dùng rembg / RMBG / U2Net (đã grep `rembg|u2net|RMBG|birefnet` trong repo, không có kết quả) [DỮ LIỆU].

### 2.2 Dataset

| Dataset | Giấy phép | Hệ quả cho model huấn luyện trên nó | Rủi ro | Nguồn |
|---|---|---|---|---|
| **Objaverse 1.0** | Toàn bộ: ODC-By v1.0. Từng vật thể: CC BY 4.0 (~721K), **CC BY-NC 4.0 (~25K)**, **CC BY-NC-SA 4.0 (~52K)**, CC BY-SA 4.0 (~16K), CC0 (~3,5K) [DỮ LIỆU] | Khoảng 77K vật thể NC nằm trong dữ liệu trừ khi tác giả model lọc. Chỉ Stability nêu rõ có lọc theo license. Phần lớn vật thể lấy từ Sketchfab [NỀN] — có thể có fan-art của IP nổi tiếng do người dùng tải lên | Trung bình | https://huggingface.co/datasets/allenai/objaverse |
| **Objaverse-XL** | Toàn bộ: ODC-By v1.0; "Individual objects in Objaverse-XL are licensed under different licenses" [DỮ LIỆU]; không liệt kê | Nguồn hỗn hợp (GitHub, Thingiverse, Sketchfab, Polycam… [NỀN]); khó lọc | Trung bình–chưa xác định | https://github.com/allenai/objaverse-xl |
| **ShapeNet** | "Researcher shall use the Database only for non-commercial research and educational purposes" [DỮ LIỆU] | Model train trên ShapeNet rồi dùng thương mại: tác giả model có thể vi phạm điều khoản | Cao (với model phụ thuộc nặng) | https://huggingface.co/spaces/ShapeNet/README/raw/main/TERMS.md |
| **3D-FUTURE** (Alibaba) | **Chưa xác minh** (trang không trả nội dung điều khoản). [NỀN] thường mô tả là chỉ nghiên cứu | — | Chưa xác định | https://tianchi.aliyun.com/specials/promotion/alibaba-3d-future |
| **ABO** (Amazon Berkeley Objects) | CC BY 4.0 [DỮ LIỆU] | Thương mại được, cần attribution | Thấp | https://amazon-berkeley-objects.s3.amazonaws.com/index.html |
| **HSSD** | CC BY-NC 4.0 [DỮ LIỆU] | Phi thương mại; nằm trong TRELLIS-500K | Trung bình | https://huggingface.co/datasets/hssd/hssd-hab |
| **Dữ liệu lấy từ Sketchfab** | Theo từng model (CC hoặc Standard); **chưa xác minh** điều khoản hiện hành của Sketchfab về việc dùng cho AI | Nguồn rủi ro IP lớn nhất của Objaverse [NHẬN ĐỊNH] | Trung bình | — |
| **Mixamo data** | Adobe cấm dùng nội dung Mixamo để train ML (xem 2.4) [DỮ LIỆU-2] | Model rig / motion train trên Mixamo có rủi ro nguồn gốc | Trung bình | xem 2.4 |
| **AMASS** | Chỉ "non-commercial scientific research"; "prohibits the use of the Dataset to train methods/algorithms/neural networks/etc. for commercial use of any kind" [DỮ LIỆU] | **Mọi** model text-to-motion train trên AMASS / HumanML3D đều mang rủi ro này | **Cao** | https://amass.is.tue.mpg.de/license.html |
| **HumanML3D** | Repo MIT, nhưng dữ liệu "originates from a combination of HumanAct12 and Amass"; không được phân phối trực tiếp do chính sách AMASS; cần body model SMPL+H [DỮ LIỆU] | Kế thừa hạn chế AMASS | **Cao** | https://github.com/EricGuo5513/HumanML3D |

[NHẬN ĐỊNH] Giấy phép dataset không tự động biến đầu ra của model thành "phi thương mại"; nhưng nó quyết định hai thứ: khả năng model bị rút / đổi giấy phép về sau, và mức rủi ro đầu ra tái hiện một vật thể có chủ. Với text-to-motion, lệnh cấm của AMASS nhắm thẳng vào việc train cho mục đích thương mại, nên coi là rủi ro cao chứ không chỉ là "vùng xám".

### 2.3 Dịch vụ thương mại

Lưu ý chung: **không điều khoản nào đọc được có cam kết bồi thường (indemnity) cho người dùng**; chiều bồi thường đều là người dùng bồi thường cho dịch vụ (Luma §12, Hyper3D §9) [DỮ LIỆU]. Tải tranh Sobi lên dịch vụ ngoài là việc cần chủ dự án duyệt riêng.

| Dịch vụ | Gói free: sở hữu / thương mại | Gói trả phí | Dùng trong game bán | Indemnity cho người dùng | Rủi ro | Nguồn |
|---|---|---|---|---|---|---|
| **Meshy** | "we grant you a CC BY 4.0 license"; đề nghị ghi công Meshy [DỮ LIỆU]. Thương mại được nhưng **bắt buộc attribution** và asset không phải của riêng mình | "if you are a paid customer, you own the assets", với điều kiện đầu vào không vi phạm bản quyền người khác [DỮ LIỆU] | Có (cả hai gói, điều kiện khác nhau) | Không thấy; trang Terms đầy đủ **chưa mở được** (404) | Trung bình (free) / thấp–trung bình (trả phí) | https://help.meshy.ai/en/articles/9992001-can-i-use-my-generated-assets-for-commercial-projects |
| **Tripo** | Mâu thuẫn giữa các trang của chính Tripo: nơi ghi CC BY 4.0 công khai, nơi ghi "Non-Commercial Use" [DỮ LIỆU-2]. Trang Terms **chưa mở được** (403) | Model riêng tư + quyền thương mại [DỮ LIỆU-2] | Chỉ nên tính gói trả phí | Chưa xác minh | **Chưa xác định** (free coi như không được) | https://www.tripo3d.ai/terms (không đọc được) |
| **Rodin / Hyper3D** (Deemos) | Xuất "for private or commercial use depending on your subscription plan" (§2); free: quyền thương mại không rõ | "we will not limit your use of such Output" (§5.b); "no representations … as to the copyrightability of any Output" [DỮ LIỆU] | Có ở gói có quyền thương mại; trang giá ghi commercial license thuộc gói Business [DỮ LIỆU-2] | Không; người dùng bồi thường (§9) | Trung bình | https://hyper3d.ai/legal/terms |
| **Luma (Genie / 3D)** | Người dùng sở hữu Output, nhưng **không được dùng thương mại** Output tạo ngoài kỳ thuê bao có quyền thương mại; Luma được cấp license rộng (hiển thị công khai, phái sinh) với Output free [DỮ LIỆU] | Thương mại chỉ cho Output "produced during an active Subscription Term" | Chỉ gói trả phí. Trang không nhắc tên Genie — tình trạng sản phẩm 3D **chưa xác minh** | Không; người dùng bồi thường (§12) | Trung bình | https://lumalabs.ai/legal/tos (cập nhật 14/05/2026) |
| **CSM** | Gói Tinkerer: CC BY 4.0; "AI training not allowed without licensing" [DỮ LIỆU-2] | Gói cao: riêng tư, khách hàng sở hữu [DỮ LIỆU-2] | Chưa xác minh (trang FAQ không truy cập được) | Chưa xác minh | Chưa xác định | https://docs.csm.ai/credits (qua tìm kiếm) |
| **Sloyd** | Terms §6: "Personal, non-commercial and commercial use are permitted", không gắn với gói; trang FAQ lại ghi gói Guest chỉ dùng cá nhân [DỮ LIỆU + DỮ LIỆU-2: mâu thuẫn] | License "non-exclusive, perpetual, worldwide" (là quyền dùng, không phải chuyển sở hữu); bán lại trên chợ asset chỉ ở gói Pro (§7) | Có ở gói trả phí | Không nhắc | Thấp–trung bình | https://www.sloyd.ai/terms-of-use (16/02/2026) |
| **Kaedim** | — | "All the 3D models that users create with Kaedim are the users' IP, given that you are subscribed to one of our plans" (FAQ, dẫn ToS §3.2) [DỮ LIỆU] | Có khi còn thuê bao | Chưa xác minh | Thấp–trung bình | https://docs.kaedim3d.com/welcome/faq |
| **3D AI Studio** | Không rõ | Trang giá: "fully owned by you" [DỮ LIỆU-2]. Là trang gộp nhiều model của bên khác (ví dụ Meshy) → điều khoản từng model có thể khác | Chưa xác minh (Terms 404) | Chưa xác minh | **Chưa xác định** | https://www.3daistudio.com/Pricing (qua tìm kiếm) |

### 2.4 Rig / animation

| Mục | Giấy phép / điều khoản | Thương mại | Hạn chế | Rủi ro | Nguồn |
|---|---|---|---|---|---|
| **Mixamo** (Adobe) | FAQ (bài cộng đồng 29/09/2022): miễn phí, không royalty, dùng thương mại và phi thương mại; không bắt buộc ghi công [DỮ LIỆU-2]. Trang FAQ chính thức `helpx.adobe.com` **trả 403**, PDF Additional Terms 23/06/2021 không trích được văn bản | Có, nhúng trong game | **Cấm phân phối file character / animation thô** (gói asset, template engine); **cấm dùng để train ML / AI** | Trung bình: điều khoản hiện hành chưa đọc được bản gốc; chỉ humanoid; thư viện dùng chung nên animation không độc quyền | https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400 |
| **AccuRIG** (Reallusion) | Công cụ miễn phí; trả lời diễn đàn: nhân vật tự làm, không chứa nội dung Reallusion thì rig xong dùng trong game được [DỮ LIỆU-2]. EULA Animation Tools (29/10/2025) **chưa đọc trực tiếp** | Có điều kiện | Xuất kèm motion ActorCore thì chịu license nội dung | Trung bình–chưa xác định | https://discussions.reallusion.com/t/question-about-accurig-2s-eula/15034 |
| **ActorCore / nội dung Reallusion** | Content policy: Standard cho dùng trong game "one character" mỗi license; phân phối lại phải xin; AI training không có ở Standard [DỮ LIỆU]. Kết quả tìm kiếm về các bản EULA mâu thuẫn nhau [DỮ LIỆU-2] | Có điều kiện, từng asset | Cấm train AI (Standard); giới hạn nhân vật | Trung bình–cao | https://www.reallusion.com/license/content.html |
| **Cascadeur** | Free: phi thương mại, chỉ xuất `.casc`. Indie: doanh thu / vốn < 100.000 USD/năm. Pro: không giới hạn [DỮ LIỆU-2, lấy từ `05_CONG_NGHE_AI_3D.md`, nguồn https://cascadeur.com/plans] | Indie / Pro | Ngưỡng doanh thu Indie | Thấp (Indie / Pro); **loại** bản Free | `05_CONG_NGHE_AI_3D.md` |
| **DeepMotion** | **Chưa xác minh** | — | — | Chưa xác định | — |
| **Rokoko Vision** | **Chưa xác minh** | — | — | Chưa xác định | — |
| **Move.ai** | **Chưa xác minh** | — | — | Chưa xác định | — |
| **MDM** | Code MIT; "depends on other libraries, including CLIP, SMPL, SMPL-X, PyTorch3D" và dataset "each have their own respective licenses" [DỮ LIỆU] | Weights train trên HumanML3D (→ AMASS) | AMASS cấm train cho thương mại; SMPL có license riêng | **Cao — loại** | https://github.com/GuyTevet/motion-diffusion-model |
| **MoMask** | Code MIT; weights không ghi license; HumanML3D / KIT-ML; SMPL [DỮ LIỆU] | Như MDM | Như MDM | **Cao — loại** | https://github.com/EricGuo5513/momask-codes |
| **HY-Motion 1.0** (Tencent) | Tencent HY-Motion 1.0 Community License (30/12/2025): Territory trừ EU/UK/KR; 1 triệu MAU [DỮ LIỆU]. Dữ liệu: "over 3,000 hours" không nêu nguồn; dùng SMPL/SMPL-H, CLIP, Qwen3 | Trong Territory | Cùng mẫu Hunyuan → cùng vấn đề Output ngoài Territory [NHẬN ĐỊNH: chưa đọc §5(c) của bản này] | **Cao** | https://raw.githubusercontent.com/Tencent-Hunyuan/HY-Motion-1.0/master/License.txt |

[NHẬN ĐỊNH] Tất cả model text-to-motion đã xem đều là chuyển động **người**; nhân vật Sobi là thú chibi nên vừa kém phù hợp kỹ thuật (`05_CONG_NGHE_AI_3D.md`) vừa rủi ro giấy phép cao. Không có lý do đưa vào production.

### 2.5 DCC / engine / runtime

| Mục | Giấy phép | Ghi chú cho Sobi | Rủi ro | Nguồn |
|---|---|---|---|---|
| **Blender** | GPL [NỀN]; trang license chính thức **trả 403** trong phiên này. [NỀN] đầu ra (model, ảnh render, file `.blend`) không chịu GPL; add-on Python gọi API Blender phải tương thích GPL khi **phân phối** | Dùng làm xưởng offline: đầu ra dùng thương mại được. Script `bpy` nội bộ không phân phối thì không phát sinh nghĩa vụ | Thấp (chưa xác minh nguyên văn) | https://www.blender.org/about/license/ (không đọc được) |
| **Blender MCP** (ahujasid/blender-mcp) | MIT [DỮ LIỆU] | Tích hợp Poly Haven (CC0), Sketchfab, Poly Pizza (~69% CC-BY), Hyper3D, Hunyuan3D, Meshy, Tripo. **Telemetry mặc định bật** (tắt bằng `DISABLE_TELEMETRY=true`); dữ liệu "may be used … to train AI models". Socket không xác thực | **Trung bình**: rủi ro không nằm ở license MIT mà ở việc agent tự kéo asset bên thứ ba vào scene và gửi dữ liệu ra ngoài | https://github.com/ahujasid/blender-mcp |
| **Instant Meshes** | BSD (3 điều khoản) [DỮ LIỆU: đọc phần đầu file] | Công cụ offline | Thấp | https://raw.githubusercontent.com/wjakob/instant-meshes/master/LICENSE.txt |
| **QuadriFlow** | BSD-style [DỮ LIỆU: đọc phần đầu file]; license các thư viện nhúng chưa kiểm | Công cụ offline | Thấp | https://raw.githubusercontent.com/hjwdzh/QuadriFlow/master/LICENSE.txt |
| **Godot** | MIT [DỮ LIỆU] | Nếu ship: kèm văn bản license | Thấp | https://raw.githubusercontent.com/godotengine/godot/master/LICENSE.txt |
| **Unity** (Personal) | Xem ghi chú B | Đang dùng ở `studio/` (decision 051) | Thấp–trung bình | https://unity.com/legal/editor-terms-of-service/software ; https://unity.com/products/pricing-updates |
| **three.js** | MIT [DỮ LIỆU] | Ship được; giữ notice | Thấp | https://raw.githubusercontent.com/mrdoob/three.js/dev/LICENSE |
| **Babylon.js** | Apache-2.0 [DỮ LIỆU] | Ship được; giữ NOTICE | Thấp | https://raw.githubusercontent.com/BabylonJS/Babylon.js/master/license.md |
| **PlayCanvas engine** | MIT [DỮ LIỆU] | Ship được (chỉ engine; editor cloud là dịch vụ riêng) | Thấp | https://raw.githubusercontent.com/playcanvas/engine/main/LICENSE |
| **enable3d** | **LGPL-3.0** [DỮ LIỆU] | Ship trong bundle đã minify của Electron: phải cho người dùng khả năng thay thư viện + cung cấp mã nguồn phần LGPL. Làm được nhưng thêm nghĩa vụ | **Trung bình** | https://raw.githubusercontent.com/enable3d/enable3d/master/LICENSE |
| **Phaser** | MIT [DỮ LIỆU] | Đang dùng (`package.json`: `phaser ^3.90.0`) | Thấp | https://raw.githubusercontent.com/phaserjs/phaser/master/LICENSE.md |
| **glTF-Transform** | MIT [DỮ LIỆU] | Công cụ build | Thấp | https://raw.githubusercontent.com/donmccurdy/glTF-Transform/main/LICENSE.md |
| **Draco** | Apache-2.0 [DỮ LIỆU] | Decoder ship kèm: giữ NOTICE | Thấp | https://raw.githubusercontent.com/google/draco/main/LICENSE |
| **meshoptimizer** | MIT [DỮ LIỆU] | — | Thấp | https://raw.githubusercontent.com/zeux/meshoptimizer/master/LICENSE.md |
| **Basis Universal / KTX2** | Apache-2.0 [DỮ LIỆU] (KTX-Software chưa kiểm riêng) | Transcoder ship kèm: giữ NOTICE | Thấp | https://raw.githubusercontent.com/BinomialLLC/basis_universal/master/LICENSE |
| **ammo.js** | zlib-style ("any purpose, including commercial applications") [DỮ LIỆU] | — | Thấp | https://raw.githubusercontent.com/kripken/ammo.js/main/LICENSE |
| **Rapier** | Apache-2.0 [DỮ LIỆU] | — | Thấp | https://raw.githubusercontent.com/dimforge/rapier/master/LICENSE |
| **cannon-es** | MIT [DỮ LIỆU] | — | Thấp | https://raw.githubusercontent.com/pmndrs/cannon-es/master/LICENSE |

**Ghi chú B — Unity Personal dùng làm xưởng render (decision 051).**
- [DỮ LIỆU] "The Financial Threshold for Unity Personal is $200,000 USD for the most recent twelve (12) month period" (Editor Software Terms, cập nhật 30/06/2026). Kiểm tra tại mỗi ngày dùng phần mềm, theo 12 tháng gần nhất.
- [DỮ LIỆU] Cách đo: với **pháp nhân** là "aggregate gross revenues and funding" — không giới hạn theo nguồn; với **cá nhân** là số tiền "generated in connection with your use of the Software". Vượt ngưỡng thì "may not use Unity Personal at all, even for internal projects or prototyping".
- [DỮ LIỆU] Runtime Fee đã hủy từ 12/09/2024; Personal miễn phí trong 2026; Pro bắt buộc trên 200.000 USD (2.310 USD/năm mỗi seat sau đợt tăng 5% từ 12/01/2026).
- [NHẬN ĐỊNH] Việc game ship **không chứa** Unity runtime không làm ngưỡng biến mất: nếu chủ thể là pháp nhân, doanh thu bán Sobi World + vốn nhận được tính vào ngưỡng dù game chạy Phaser. Dòng trong `docs/THIRD_PARTY.md` hiện ghi đúng con số 200.000 USD.
- [DỮ LIỆU] Điều khoản không có câu nào nói trực tiếp về "chỉ dùng Editor để render ảnh cho sản phẩm không phải Unity". §2.1 cấp quyền Editor "solely for internal use" để phát triển Project, và cấm cung cấp chức năng Editor cho người dùng cuối qua cloud / SaaS. [NHẬN ĐỊNH] Render offline nội bộ rồi ship PNG không rơi vào điều cấm đó, nhưng vì không có điều khoản khẳng định → **nên hỏi Unity hoặc luật sư** nếu Unity trở thành khâu chính của pipeline 3D.

### 2.6 2D đối chứng

| Mục | Giấy phép / giá | Ngưỡng | Rủi ro | Nguồn |
|---|---|---|---|---|
| **Spine** | Essential 69 USD (không mesh / IK), Professional 379 USD, Enterprise 2.499 USD + 379 USD/người/năm; phải có license Spine mới được tích hợp Spine Runtimes vào sản phẩm [DỮ LIỆU-2, từ `05_CONG_NGHE_AI_3D.md`, nguồn https://esotericsoftware.com/spine-purchase] | Enterprise bắt buộc khi doanh thu > 500.000 USD/năm | Thấp (có license) | `05_CONG_NGHE_AI_3D.md` |
| **DragonBones** | Runtime JS: MIT ("Copyright (c) 2012-2025 The DragonBones team") [DỮ LIỆU]. Tình trạng editor và license editor **chưa xác minh** | — | Thấp (runtime); chưa xác định (editor) | https://raw.githubusercontent.com/DragonBones/DragonBonesJS/master/LICENSE |
| **Rive** | Free 0 USD (xuất kèm splash Rive), Cadet 9 USD, Voyager 32 USD, Enterprise 120 USD mỗi seat/tháng; runtime MIT, "no revenue share, no runtime fees, no royalties" [DỮ LIỆU] | Enterprise cho tổ chức doanh thu ≥ 10 triệu USD/năm | Thấp | https://rive.app/pricing |
| **Live2D Cubism** | "License only required upon releasing your content"; hợp đồng phải xong trước phát hành ≥ 1 tháng; có miễn cho cá nhân / doanh nghiệp quy mô nhỏ nhưng trang không ghi con số; phí theo gói (One-time / Running Royalty) không ghi số [DỮ LIỆU]. Ngưỡng 10 triệu yên [DỮ LIỆU-2] | Chưa xác minh con số | Trung bình (phí xuất bản + thủ tục) | https://www.live2d.com/en/sdk/license/ |
| **Spriter** | **Chưa xác minh** | — | Chưa xác định | — |
| **Puppet rig tự viết** (decision 050) | Mã của dự án | Không | Thấp nhất | `docs/decisions/` |

### 2.7 Công cụ AI đang dùng trong pipeline hiện tại

| Công cụ | Bằng chứng trong repo | Điều khoản đọc được | Rủi ro | Nguồn |
|---|---|---|---|---|
| **Gemini** (bản web miễn phí, do chủ dự án thao tác) | `docs/decisions/022-art-pipeline.md` dòng 10: "Gemini bản miễn phí vẽ sheet"; `docs/decisions/051-unity-studio.md`: 2547 PNG "ảnh Gemini" [DỮ LIỆU] | Google Terms of Service (hiệu lực 30/07/2026): "Google won't claim ownership over that content"; cấm dùng nội dung AI sinh ra để phát triển model ML; cấm "misleading others into thinking that generative AI content was created by a human" [DỮ LIỆU]. Trang **không có câu nào cho phép hay cấm dùng thương mại** | **Trung bình**: không bị đòi quyền sở hữu, nhưng không có cấp phép thương mại minh thị, không indemnity ở bản consumer; có điều khoản cấm gây hiểu nhầm là do người làm | https://policies.google.com/terms |
| Gemini API / AI Studio (nếu chuyển sang) | Chưa dùng | Hiệu lực 23/03/2026: Google không đòi sở hữu; dịch vụ dành cho "professional or business purposes"; gói không trả tiền: Google dùng nội dung để cải thiện sản phẩm và ML; gói trả tiền: không dùng [DỮ LIỆU] | Thấp–trung bình | https://aistudio.google.com/docs/terms |
| **Mureka AI** (nhạc nền) | `docs/THIRD_PARTY.md` dòng 12: "Chưa xác minh"; `public/assets/manifest/assets.json` dòng 12705–12706 ghi license "Project-owned (Mureka AI output, per the account plan terms)" [DỮ LIỆU] | Trang điều khoản **không đọc được** nội dung | **Chưa xác định** — hai file trong repo đang nói khác nhau về cùng một asset | https://www.mureka.ai/terms (không đọc được) |

[NHẬN ĐỊNH] Điều khoản Google cấm dùng nội dung AI sinh ra để phát triển model ML. Nếu sau này dùng ảnh Gemini của Sobi để fine-tune một model (LoRA phong cách, model image-to-3D riêng) thì chạm điều khoản này → cần hỏi luật sư trước.

---

## 3. Tình trạng pháp lý của đầu ra AI (tóm tắt)

### 3.1 Hoa Kỳ
- [DỮ LIỆU] US Copyright Office, báo cáo *Copyright and Artificial Intelligence*: Part 1 (Digital Replicas) 31/07/2024; **Part 2 (Copyrightability) 29/01/2025**; Part 3 (Generative AI Training) bản pre-publication 09/05/2025. Trang tổng hợp không liệt kê cập nhật nào trong 2026. Nguồn: https://www.copyright.gov/ai/
- [NỀN — file PDF Part 2 không trích được văn bản trong phiên] Kết luận chính của Part 2: quyền tác giả cần tác giả là con người; prompt đơn thuần thường không đủ để người dùng là tác giả của đầu ra; phần con người đóng góp (chọn lọc, sắp xếp, chỉnh sửa đáng kể, dùng AI như công cụ hỗ trợ trên tác phẩm của chính mình) vẫn được bảo hộ; đánh giá theo từng trường hợp.
- [DỮ LIỆU-2] *Thaler v. Perlmutter*: Tòa Tối cao từ chối thụ lý ngày 02/03/2026 — tác phẩm do AI tạo hoàn toàn, không có tác giả con người, không được bảo hộ theo luật Hoa Kỳ. Nguồn thứ cấp: tracker tại https://chatgptiseatingtheworld.com (chưa đối chiếu hồ sơ tòa).

### 3.2 Liên minh châu Âu
- [DỮ LIỆU] EU AI Act Điều 50: **nhà cung cấp** hệ thống AI sinh nội dung phải đánh dấu đầu ra ở dạng máy đọc được; **bên triển khai** phải công bố khi tạo deepfake; với tác phẩm "evidently artistic, creative, satirical, fictional" nghĩa vụ chỉ còn là cho biết có nội dung được tạo / chỉnh bằng AI, theo cách không cản trở việc thưởng thức. Áp dụng từ **02/08/2026**. Trang đánh dấu điều này "amended" và dẫn tới Digital Omnibus; có lùi hạn hay không **chưa xác minh**. Nguồn: https://artificialintelligenceact.eu/article/50/
- [NHẬN ĐỊNH] Art game cách điệu không phải deepfake; nghĩa vụ trực tiếp với studio dùng công cụ là nhỏ. Nhưng cửa hàng game có thể yêu cầu khai báo nội dung AI theo chính sách riêng — **chưa xác minh** trong phiên này.

### 3.3 Việt Nam
- [DỮ LIỆU-2] **Luật Trí tuệ nhân tạo số 134/2025/QH15**, thông qua 10/12/2025, hiệu lực **01/03/2026**; có yêu cầu minh bạch / gắn nhãn nội dung do AI tạo (các bài tư vấn dẫn Điều 11); mức phạt doanh nghiệp được báo chí nêu tới 2 tỷ đồng. Phạm vi gắn nhãn với art trong game **chưa đối chiếu văn bản gốc**.
- [DỮ LIỆU-2] **Luật số 131/2025/QH15** sửa đổi Luật Sở hữu trí tuệ, thông qua 10/12/2025, hiệu lực **01/04/2026**; giao Chính phủ quy định việc phát sinh, xác lập quyền SHTT khi đối tượng được tạo ra có sử dụng hệ thống AI. Một nguồn thứ cấp nêu **Nghị định 134/2026/NĐ-CP** (hiệu lực 09/04/2026, bổ sung Điều 5a): tác phẩm tạo bằng AI chỉ được bảo hộ khi đáp ứng điều kiện về vai trò của con người. **Chưa đối chiếu văn bản nghị định.**
- Nguồn tìm kiếm: https://moj.gov.vn (infographic Luật SHTT sửa đổi), https://english.luatvietnam.vn/law-no-134-2025-qh15-dated-december-10-2025-of-the-national-assembly-on-artificial-intelligence-422299-doc1.html , https://vtcnews.vn/nhung-quy-dinh-ve-ai-trong-luat-so-huu-tri-tue-sua-doi-co-hieu-luc-tu-ngay-1-4-ar1010602.html — chỉ đọc qua trích đoạn kết quả tìm kiếm.
- **Đây là điểm bắt buộc hỏi luật sư Việt Nam:** nghĩa vụ gắn nhãn theo Luật AI với game bán ra, và điều kiện "vai trò con người" để art của Sobi được bảo hộ.

### 3.4 Các vụ kiện (đến 2026) — toàn bộ là [DỮ LIỆU-2], từ tracker thứ cấp
- *Disney / Universal (và WBD) v. Midjourney* (C.D. Cal.): đang trong giai đoạn discovery. Trọng tâm là đầu ra tái hiện nhân vật có bản quyền.
- *Getty v. Stability AI* (Anh): Getty bỏ các yêu cầu chính, Stability thắng phần còn lại, Getty thắng hẹp về nhãn hiệu; đã được phép kháng cáo. Bản ở Mỹ (N.D. Cal.): đơn bác bỏ bị từ chối 23/04/2026.
- *Andersen v. Stability AI, Midjourney, DeviantArt* (N.D. Cal.): còn tiếp diễn; ngày xử chưa xác nhận được.
- *Thomson Reuters v. Ross* (Third Circuit): tranh luận 11/06/2026 về fair use trong huấn luyện AI, chưa có phán quyết tính đến tracker tháng 7/2026.
- **Không tìm thấy vụ kiện nào nhắm riêng vào một trình sinh model 3D.** [NHẬN ĐỊNH] Không có vụ kiện không có nghĩa là an toàn: dataset 3D (Objaverse / Sketchfab) có cấu trúc rủi ro giống dataset ảnh.

### 3.5 Hệ quả thực tế cho một studio nhỏ [NHẬN ĐỊNH]
1. **Asset sinh thuần bằng AI có thể không được bảo hộ** → người khác sao chép, mình khó đòi quyền. Thứ bảo vệ Sobi là phần đóng góp của con người: thiết kế nhân vật gốc, art direction, chọn lọc, chỉnh sửa tay, retopo, vẽ lại texture, rig, animation.
2. **Ghi lại quá trình** (mục 6): bản phác, prompt, các vòng chỉnh, ai duyệt. Đây là bằng chứng vừa cho quyền tác giả vừa cho thiện chí nếu bị khiếu nại.
3. **Rủi ro lớn nhất không phải "không được bảo hộ" mà là "đầu ra giống tác phẩm có chủ"** — điều khoản mọi công cụ đều đẩy trách nhiệm về người dùng, không ai bồi thường.
4. Tên, logo, nhân vật chủ lực nên bảo hộ bằng **nhãn hiệu**, không chỉ dựa vào quyền tác giả (`docs/THIRD_PARTY.md` đã có TODO tra nhãn hiệu "Sobi World").

---

## 4. Đối chiếu decision 048

Căn cứ: `docs/decisions/048-no-third-party-ip.md`, `docs/AGENT_RULES.md` §9, `docs/IP_AUDIT_PROMPT.md` [DỮ LIỆU].

| Đường sinh asset | Rủi ro IP đầu vào | Rủi ro IP đầu ra | Nhận định |
|---|---|---|---|
| **Image-to-3D từ art gốc Sobi** | Thấp nếu ảnh đầu vào đã qua rà soát §9. Lưu ý: art hiện có là ảnh Gemini, và `docs/IP_AUDIT_REPORT.md` từng phải xử lý các mục nhái IP (AGENT_RULES §9 dòng 67) → chỉ đưa vào ảnh đã duyệt | **Trung bình.** Model phải "bịa" mặt sau, mặt dưới, chi tiết bị che — lấy từ phân phối dữ liệu huấn luyện (Objaverse / Sketchfab, có fan-art). Mặt trước giống Sobi không bảo đảm mặt sau không mang nét nhận diện của nhân vật khác | Chấp nhận được có điều kiện |
| **Text-to-3D** | Trung bình: prompt chung chung vẫn có thể kéo về thiết kế nổi tiếng nhất của khái niệm đó | **Cao hơn**: không có thiết kế gốc làm neo | Không dùng cho nhân vật / sinh vật; cân nhắc cho prop vô danh (đá, thùng, hàng rào) |
| **Text-to-motion** | — | Chuyển động khó là "IP" theo nghĩa hình ảnh, nhưng rủi ro giấy phép dataset cao (AMASS) | Loại (mục 5) |
| **Thư viện animation / asset pack** | Cao nếu pack có nhân vật, tư thế đặc trưng, tên gọi theo IP | — | Cấm pack có nhân vật IP; chỉ lấy chuyển động trung tính |
| **Agent + Blender MCP kéo asset từ Sketchfab / Poly Pizza** | **Cao**: agent có thể tự tải model bên thứ ba vào scene mà không ai thấy | — | Tắt các tích hợp tải asset; chỉ cho CC0 đã ghi sổ |

**Quy trình kiểm soát đề xuất (bổ sung cho §9, chưa sửa file nào):**
1. **Đầu vào:** chỉ ảnh có `status` đã duyệt và không nằm trong danh sách nghi vấn của `docs/IP_AUDIT_REPORT.md`. Không dùng ảnh reference bên ngoài làm đầu vào image-to-3D.
2. **Prompt:** không tên IP, không tên nghệ sĩ / studio / game / phim, không "in the style of …". Áp dụng cho cả negative prompt và tên file.
3. **Đầu ra — rà soát bắt buộc trước khi vào manifest:** render turnaround 8 hướng (đặc biệt lưng, đỉnh đầu, đuôi, phụ kiện) và soi theo ba mức CAO / TRUNG BÌNH / THẤP của `docs/IP_AUDIT_PROMPT.md`. Hiện prompt đó chỉ yêu cầu "nhìn trực tiếp ảnh" 2D; đề xuất thêm một dòng cho model 3D và clip animation.
4. **Nghi ngờ thì bỏ** (đúng tinh thần 048: "không đổi nhẹ để né") — sinh lại hoặc dựng tay phần đó.
5. **Chỉnh sửa của con người là bắt buộc**, không chỉ để đẹp: retopo, sửa mặt sau theo thiết kế Sobi, vẽ lại texture theo `style` của dự án. Ghi mức chỉnh sửa vào sổ (mục 6).
6. **Không train / fine-tune** model nào bằng đầu ra của công cụ có điều khoản cấm (Google, Stability, Tencent, Mixamo, CSM) khi chưa hỏi luật sư.
7. **Rà soát định kỳ:** chạy `docs/IP_AUDIT_PROMPT.md` sau mỗi batch 3D, như đã quy định cho batch art lớn.

---

## 5. Danh sách LOẠI và CHẤP NHẬN CÓ ĐIỀU KIỆN

Toàn bộ là **[NHẬN ĐỊNH]** dựa trên dữ liệu mục 2, cho giả định bán thương mại toàn cầu.

### 5.1 LOẠI khỏi production (rủi ro cao, chưa có cách xử lý)

| Mục | Lý do | Điều kiện để xét lại |
|---|---|---|
| **nvdiffrast, nvdiffrec** | NVIDIA Source Code License: chỉ phi thương mại | Mua license thương mại từ NVIDIA, hoặc dùng bản đã gỡ phụ thuộc này |
| **diffoctreerast / diff-gaussian-rasterization** | Giấy phép Inria: cấm thương mại | Thỏa thuận riêng với Inria |
| **BRIA RMBG-1.4 / 2.0**, và **rembg ở cấu hình mặc định** | CC BY-NC / phi thương mại; rembg mặc định tải RMBG-2.0 | Mua license BRIA, hoặc chỉ định model khác có license mở |
| **MeshAnything / MeshAnythingV2** | S-Lab License 1.0: phi thương mại | Xin phép tác giả |
| **Hunyuan3D 2.0 / 2.1 / Part / Omni, HY-Motion 1.0** (bản weights mở) | §5(c): Output không được dùng / phân phối / hiển thị ở EU, UK, Hàn Quốc | Không bán ở ba vùng đó, hoặc có giấy phép riêng của Tencent, hoặc luật sư kết luận khác |
| **Step1X-3D** (khâu texture) | Tái dùng mã rasterizer / renderer của Hunyuan3D 2.0 | Thay khâu texture |
| **MDM, MoMask và mọi text-to-motion train trên HumanML3D / AMASS** | AMASS cấm train cho mục đích thương mại; phụ thuộc SMPL | Model có dữ liệu sạch được công bố |
| **Cascadeur Free** | Phi thương mại | Dùng Indie / Pro |
| **Gói free của Tripo, Luma, Rodin** cho asset ship | Điều khoản mâu thuẫn hoặc không cho thương mại ở gói free | Dùng gói trả phí, lưu điều khoản |
| **Unique3D, 3D AI Studio, CSM, Hunyuan3D 2.5 / 3.x (dịch vụ), DeepMotion, Rokoko Vision, Move.ai, Spriter** | **Chưa xác định** — không đọc được giấy phép / điều khoản. Chưa xác minh thì không vào production | Đọc được điều khoản và ghi sổ |
| **Tích hợp tải asset của Blender MCP** (Sketchfab, Poly Pizza) và telemetry | Asset bên thứ ba vào scene không kiểm soát; dữ liệu dự án gửi ra ngoài | Tắt tích hợp + `DISABLE_TELEMETRY=true` |
| **Asset pack / thư viện animation có nhân vật IP** | Decision 048 | Không |

### 5.2 CHẤP NHẬN ĐƯỢC có điều kiện

| Mục | Điều kiện |
|---|---|
| **TRELLIS.2 / TRELLIS v1** (MIT) | Chỉ dùng weights + code MIT; **thay hoặc bỏ** nvdiffrast / nvdiffrec / diffoctreerast (xuất mesh thô rồi bake texture trong Blender); xác minh license encoder ảnh (DINOv3); ghi hash weights |
| **Hi3DGen / Stable3DGen** (MIT) | Xác minh license weights trên Hugging Face trước khi dùng |
| **TripoSR, TripoSG, UniRig** (MIT) | Thay bộ tách nền (không dùng RMBG); với UniRig xác minh license Articulation-XL2.0 |
| **InstantMesh, CRM** | Chỉ sau khi xác minh weights Zero123++ và gỡ nvdiffrast |
| **Stable Fast 3D / SPAR3D** | Doanh thu năm < 1 triệu USD; **đăng ký** với Stability; hiển thị "Powered by Stability AI"; không dùng đầu ra để train foundation model |
| **Meshy trả phí** | Giữ asset riêng tư (không đăng Community); lưu ảnh chụp điều khoản + hóa đơn kỳ thuê bao; đầu vào là art gốc. Gói free chỉ dùng thử nghiệm (nếu ship thì phải ghi công CC BY 4.0) |
| **Kaedim, Sloyd trả phí; Tripo / Rodin / Luma trả phí** | Đọc Terms đầy đủ tại thời điểm mua; asset phải được tạo **trong** kỳ thuê bao có quyền thương mại (Luma ghi rõ điều này) |
| **Mixamo** | Chỉ nhúng trong build; không phân phối file thô; không dùng để train; đọc được FAQ chính thức hiện hành trước khi ship |
| **AccuRIG** | Chỉ rig nhân vật tự làm; không xuất kèm motion ActorCore khi chưa có license nội dung |
| **Cascadeur Indie / Pro** | Indie khi doanh thu / vốn < 100.000 USD/năm |
| **Blender, Instant Meshes, QuadriFlow, xatlas, glTF-Transform, Draco, meshoptimizer, Basis** | Công cụ offline; ghi phiên bản. Blender: xác minh lại trang license khi truy cập được |
| **three.js, Babylon.js, PlayCanvas engine, Rapier, cannon-es, ammo.js, Phaser, Godot** | Ship được; kèm file license / NOTICE trong bản build |
| **enable3d** (LGPL-3.0) | Chỉ khi chấp nhận nghĩa vụ LGPL; ưu tiên three.js trực tiếp |
| **Unity Personal làm xưởng** | Doanh thu + vốn 12 tháng < 200.000 USD; không dùng package Asset Store (đúng như `docs/THIRD_PARTY.md`) |
| **Spine, Rive, DragonBones runtime** | Spine: mua license theo người dùng. Rive Free: chấp nhận splash hoặc trả phí |
| **Gemini (web / API)** | Art phải qua chỉnh sửa và duyệt của người; không tuyên bố là "vẽ tay"; không dùng để train model; cân nhắc API trả phí để dữ liệu không bị dùng cải thiện model |

---

## 6. Đề xuất "sổ nguồn gốc / giấy phép" cho từng asset

**Chỉ là đề xuất — phiên này không sửa file nào ngoài tài liệu này.**

### 6.1 Hiện trạng trong repo [DỮ LIỆU]
- `src/core/assets/manifestSchema.ts`: mọi dòng manifest dùng chung khối `base` = `id`, `status` (`placeholder | production | final`), **`credit?`**, **`license?`** (chuỗi tự do, tùy chọn). Manifest version 3; 7 mục: `pigs, fx, props, buildings, environment, ui, audio`. Chưa có mục cho model 3D / clip animation.
- `public/assets/manifest/assets.json`: `credit` / `license` đã được điền ở một số dòng (ví dụ dòng 12705–12706 cho nhạc Mureka).
- `docs/THIRD_PARTY.md`: bảng 4 cột theo **thành phần** (Thành phần | Dùng ở | License | Ghi chú), không theo asset.
- Mâu thuẫn hiện có: nhạc `music_farm` — manifest ghi "Project-owned", `THIRD_PARTY.md` ghi "Chưa xác minh".

### 6.2 Kiến trúc đề xuất: ba tầng, không nhồi vào manifest runtime

| Tầng | File | Vai trò |
|---|---|---|
| 1. Công cụ | `docs/THIRD_PARTY.md` (giữ) + thêm bảng "Công cụ AI / pipeline" | Mỗi công cụ một dòng, có `toolId` ổn định |
| 2. Asset | **`docs/provenance/assets.jsonl`** (mới; một dòng JSON mỗi asset mỗi lần sinh) + `docs/provenance/terms/` chứa ảnh chụp / PDF điều khoản | Sổ nguồn gốc đầy đủ, không đi kèm bản build |
| 3. Runtime | `assets.json` giữ `credit` / `license` ngắn; thêm tùy chọn `provenance?: string` trỏ tới `recordId` của tầng 2 | Liên kết id → sổ; không tăng kích thước manifest |

Lý do tách tầng 2 khỏi manifest: manifest nằm trong `public/` và được ship; prompt, tên người duyệt, hash weights không nên đi kèm game. Sổ để trong `docs/` phù hợp nguyên tắc "asset chỉ qua id → manifest".

### 6.3 Schema bản ghi tầng 2

```jsonc
{
  "recordId": "prov_2026_11_000123",        // ổn định, không tái sử dụng
  "assetId": "pig_farm_basic",              // khớp assetIdSchema: ^[a-z][a-z0-9_]*$
  "manifestSection": "pigs",                // một trong MANIFEST_SECTIONS (hoặc mục 3D mới)
  "assetKind": "model3d",                   // sprite | sheet | model3d | texture | rig | animation | audio | font
  "date": "2026-11-11",
  "inputs": [
    { "path": "asset/…/pig_farm_basic.png", "sha256": "…",
      "origin": "project-original | ai-generated | third-party",
      "inputRecordId": "prov_2026_08_000045" } // chuỗi nguồn gốc ngược về ảnh đầu vào
  ],
  "steps": [
    { "toolId": "trellis2",                 // khớp dòng trong THIRD_PARTY.md
      "toolVersion": "git:abc1234",
      "weights": { "repo": "microsoft/TRELLIS.2-4B", "revision": "…", "sha256": "…" },
      "licenseCode": "MIT",
      "licenseWeights": "MIT",
      "licenseCheckedOn": "2026-11-11",
      "termsSnapshot": "docs/provenance/terms/trellis2_2026-11-11.pdf",
      "serviceTier": null,                  // với dịch vụ: "free" | "pro" + kỳ thuê bao + mã hóa đơn
      "prompt": null,
      "negativePrompt": null,
      "params": { "seed": 42, "steps": 12 },
      "dependencies": ["dinov3", "xatlas"]  // để bắt phụ thuộc phi thương mại
    }
  ],
  "humanEdit": {
    "level": 3,                             // 0 không sửa | 1 dọn nhẹ | 2 sửa đáng kể | 3 dựng lại phần lớn | 4 làm tay hoàn toàn
    "notes": "retopo tay, vẽ lại mặt sau, texture vẽ lại theo style.json",
    "editor": "…"
  },
  "ipReview": {
    "reviewer": "…",                        // người, không phải agent
    "date": "2026-11-11",
    "method": "turnaround 8 hướng theo docs/IP_AUDIT_PROMPT.md",
    "result": "pass | fail | needs-owner",
    "evidence": "docs/provenance/review/pig_farm_basic_turnaround.png"
  },
  "outputLicense": "Project-owned",         // chuỗi sẽ ghi vào manifest.license
  "attributionRequired": null,              // ví dụ "Powered by Stability AI" / "CC BY 4.0 — Meshy"
  "restrictions": [],                       // ví dụ ["no-eu-uk-kr", "revenue<1M", "no-train"]
  "risk": "low | medium | high | unknown",
  "supersedes": null
}
```

### 6.4 Cổng kiểm đề xuất (để chủ dự án quyết có làm hay không)
- `assets:check --release` (đã tồn tại trong `package.json`) có thể kiểm thêm: mọi dòng `status: production | final` phải có `license`; nếu `credit` nhắc công cụ AI thì phải có `provenance`.
- Chặn release khi bản ghi có `risk: high | unknown`, `ipReview.result != pass`, hoặc `restrictions` không rỗng mà chưa có dòng xử lý tương ứng.
- Chặn theo danh sách `toolId` bị loại ở mục 5.1.
- Sinh tự động trang credit / file NOTICE trong bản build từ `attributionRequired` và từ license các thư viện runtime (đáp ứng TODO "liệt kê license cho toàn bộ dependency" của `docs/THIRD_PARTY.md`).

### 6.5 Bổ sung cho `docs/THIRD_PARTY.md` (đề xuất cột)
`toolId | Thành phần | Dùng ở | License code | License weights | Điều khoản đầu ra | Ngưỡng / hạn chế | Ship kèm game? | Ngày kiểm | Ảnh chụp điều khoản | Trạng thái (dùng / thử nghiệm / loại)`.
Dòng nên thêm ngay cả khi chưa dùng 3D: **Gemini** (đang là nguồn của 2547 PNG nhưng chưa có dòng nào), và sửa cho khớp dòng **Mureka** giữa hai file.

---

## Nguồn

Đã thực sự mở trong phiên, ngày truy cập **2026-11-11** (một phần đọc qua công cụ tóm tắt trang, một phần đọc văn bản thô của file LICENSE).

Model mở và phụ thuộc
- https://github.com/microsoft/TRELLIS · https://huggingface.co/microsoft/TRELLIS-image-large
- https://github.com/microsoft/TRELLIS.2 · https://huggingface.co/microsoft/TRELLIS.2-4B
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2/main/LICENSE
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-2.1/main/LICENSE · https://huggingface.co/tencent/Hunyuan3D-2.1
- https://raw.githubusercontent.com/Tencent-Hunyuan/Hunyuan3D-Part/main/LICENSE · https://huggingface.co/tencent/Hunyuan3D-Omni
- https://raw.githubusercontent.com/Tencent-Hunyuan/HY-Motion-1.0/master/License.txt · https://github.com/Tencent-Hunyuan/HY-Motion-1.0
- https://api.github.com/orgs/Tencent-Hunyuan/repos
- https://github.com/VAST-AI-Research/TripoSR · https://github.com/VAST-AI-Research/TripoSG · https://huggingface.co/VAST-AI/TripoSG
- https://huggingface.co/stabilityai/stable-fast-3d · https://huggingface.co/stabilityai/stable-point-aware-3d · https://stability.ai/community-license-agreement
- https://github.com/TencentARC/InstantMesh · https://huggingface.co/TencentARC/InstantMesh · https://github.com/thu-ml/CRM · https://github.com/AiuniAI/Unique3D · https://github.com/Stable-X/Hi3DGen · https://github.com/stepfun-ai/Step1X-3D
- https://github.com/buaacyw/MeshAnythingV2 · https://raw.githubusercontent.com/buaacyw/MeshAnythingV2/main/LICENSE.txt · https://raw.githubusercontent.com/buaacyw/MeshAnything/main/LICENSE.txt
- https://github.com/VAST-AI-Research/UniRig · https://huggingface.co/VAST-AI/UniRig
- https://github.com/NVlabs/nvdiffrast/blob/main/LICENSE.txt · https://github.com/NVlabs/nvdiffrec/blob/main/LICENSE.txt
- https://raw.githubusercontent.com/graphdeco-inria/diff-gaussian-rasterization/main/LICENSE.md · https://raw.githubusercontent.com/JeffreyXiang/diffoctreerast/master/LICENSE
- https://github.com/NVIDIAGameWorks/kaolin · https://github.com/nv-tlabs/FlexiCubes · https://github.com/facebookresearch/dinov2 · https://raw.githubusercontent.com/facebookresearch/dinov3/main/LICENSE.md · https://github.com/jpcy/xatlas
- https://github.com/danielgatis/rembg · https://huggingface.co/briaai/RMBG-1.4 · https://huggingface.co/briaai/RMBG-2.0 · https://github.com/xuebinqin/U-2-Net
- Phần đầu file LICENSE của: TripoSR, TripoSG, InstantMesh, CRM, Unique3D, Hi3DGen, Step1X-3D, UniRig, zero123plus, TRELLIS, TRELLIS.2 (raw.githubusercontent.com)

Dataset và motion
- https://huggingface.co/datasets/allenai/objaverse · https://github.com/allenai/objaverse-xl · https://objaverse.allenai.org/docs/intro/ (không có thông tin license)
- https://huggingface.co/spaces/ShapeNet/README/raw/main/TERMS.md · https://amazon-berkeley-objects.s3.amazonaws.com/index.html · https://huggingface.co/datasets/hssd/hssd-hab
- https://amass.is.tue.mpg.de/license.html · https://github.com/EricGuo5513/HumanML3D · https://github.com/EricGuo5513/momask-codes · https://github.com/GuyTevet/motion-diffusion-model

Dịch vụ và công cụ
- https://help.meshy.ai/en/articles/9992001-can-i-use-my-generated-assets-for-commercial-projects · https://hyper3d.ai/legal/terms · https://lumalabs.ai/legal/tos · https://www.sloyd.ai/terms-of-use · https://docs.kaedim3d.com/welcome/faq
- https://community.adobe.com/questions-696/mixamo-faq-licensing-royalties-ownership-eula-and-tos-589400 · https://www.reallusion.com/license/content.html
- https://unity.com/products/pricing-updates · https://unity.com/legal/editor-terms-of-service/software
- https://github.com/ahujasid/blender-mcp
- Phần đầu file LICENSE (raw.githubusercontent.com) của: enable3d, three.js, Babylon.js, PlayCanvas engine, instant-meshes, QuadriFlow, glTF-Transform, draco, meshoptimizer, basis_universal, ammo.js, rapier, cannon-es, phaser, godot, DragonBonesJS
- https://rive.app/pricing · https://www.live2d.com/en/sdk/license/
- https://policies.google.com/terms · https://policies.google.com/terms/generative-ai · https://aistudio.google.com/docs/terms

Pháp lý
- https://www.copyright.gov/ai/ · https://artificialintelligenceact.eu/article/50/
- Kết quả tìm kiếm (chỉ đọc trích đoạn, nguồn thứ cấp): luật Việt Nam 131/2025/QH15 và 134/2025/QH15; tracker các vụ kiện AI; điều khoản Meshy / Tripo / Rodin / Sloyd / CSM / Kaedim / 3D AI Studio / Reallusion.

Trong repo
- `docs/decisions/048-no-third-party-ip.md`, `docs/decisions/051-unity-studio.md`, `docs/decisions/022-art-pipeline.md`, `docs/AGENT_RULES.md` §9, `docs/THIRD_PARTY.md`, `docs/IP_AUDIT_PROMPT.md`, `package.json`, `src/core/assets/manifestSchema.ts`, `public/assets/manifest/assets.json`, `docs/research/2d-3d-strategy/05_CONG_NGHE_AI_3D.md`.

## Điều chưa xác minh

1. **Trang không mở được (403 / 404 / không có nội dung):** Blender license; Mixamo FAQ chính thức (helpx.adobe.com) và PDF Additional Terms; Tripo Terms; Meshy Terms đầy đủ; 3D AI Studio Terms; CSM FAQ / Terms; Mureka Terms; 3D-FUTURE; Hunyuan3D-Omni LICENSE; PDF Part 2 của US Copyright Office (chỉ xác nhận được ngày phát hành).
2. **Chưa tra:** DeepMotion, Rokoko Vision, Move.ai, Spriter, editor DragonBones, Cascadeur và Spine (dùng lại số liệu của `05_CONG_NGHE_AI_3D.md`), EULA Animation Tools của Reallusion, điều khoản Sketchfab và VRoid Hub về AI, license của SMPL / SMPL-H, KTX-Software, Toys4k, Articulation-XL2.0.
3. **License weights tách riêng khỏi code** của CRM, Unique3D, Hi3DGen, Step1X-3D, Zero123++; điều khoản thương mại đầy đủ của DINOv3 License.
4. **Hunyuan3D 2.5 / 3.0 / 3.1:** không thấy weights mở; điều khoản đầu ra của nền tảng / API Tencent chưa đọc. §5(c) của HY-Motion và Hunyuan3D-Part chưa đọc nguyên văn (suy từ cùng mẫu giấy phép).
5. **Luma Genie:** không rõ sản phẩm 3D còn tồn tại dưới điều khoản hiện hành.
6. **Pháp luật Việt Nam:** chưa đọc văn bản gốc Luật 134/2025/QH15, Luật 131/2025/QH15, Nghị định 134/2026/NĐ-CP; số hiệu và nội dung nghị định chỉ từ một nguồn thứ cấp.
7. **Vụ kiện:** toàn bộ trạng thái lấy từ tracker thứ cấp, chưa đối chiếu hồ sơ tòa. Lùi hạn Điều 50 EU AI Act theo Digital Omnibus chưa kiểm.
8. **Chính sách khai báo nội dung AI của cửa hàng game** chưa tra.
9. Kết quả đọc qua công cụ tóm tắt trang có thể sai chi tiết; các điểm quyết định (Hunyuan §5(c), nvdiffrast §3.3, S-Lab, AMASS, ShapeNet, rembg mặc định) đã được đọc từ văn bản thô hoặc trích nguyên văn.
10. Ghi chú thao tác: công cụ tra web tự lưu hai file PDF (Adobe Mixamo Additional Terms, USCO Part 2) vào thư mục kết quả của phiên dưới `C:\Users\ToraTech\.claude\projects\…\tool-results\`, ngoài repo; không file nào khác được tải.

## Cần chủ dự án cung cấp / duyệt

**Cung cấp**
1. Kênh và vùng bán dự kiến (có EU / UK / Hàn Quốc không) — quyết định trực tiếp việc loại họ Hunyuan.
2. Chủ thể phát hành là cá nhân hay pháp nhân; doanh thu + vốn 12 tháng (ngưỡng Unity 200.000 USD, Cascadeur Indie 100.000 USD, Spine 500.000 USD, Stability 1.000.000 USD).
3. Gói Mureka đang dùng và bản điều khoản tại thời điểm tạo nhạc; tài khoản Gemini dùng để tạo art là cá nhân hay Workspace.
4. Có chấp nhận tải tranh Sobi lên dịch vụ đám mây bên ngoài hay không.

**Duyệt**
5. Danh sách LOẠI (5.1) và CHẤP NHẬN có điều kiện (5.2).
6. Có lập sổ nguồn gốc (mục 6) và cổng kiểm trong `assets:check --release` hay không.
7. Bổ sung dòng Gemini vào `docs/THIRD_PARTY.md` và làm khớp dòng Mureka giữa manifest và `THIRD_PARTY.md`.
8. Bổ sung bước rà soát model 3D / animation vào `docs/IP_AUDIT_PROMPT.md`.

**Nên hỏi luật sư ở các điểm sau**
- (a) Điều §5(c) của Tencent Hunyuan Community License có áp dụng cho asset đã chỉnh sửa nằm trong game bán tại EU / UK / Hàn Quốc không.
- (b) Luật Trí tuệ nhân tạo 134/2025/QH15: game có art do AI hỗ trợ có phải gắn nhãn không, gắn thế nào.
- (c) Luật SHTT sửa đổi và nghị định hướng dẫn: mức đóng góp của con người cần có để art Sobi được bảo hộ; hồ sơ nào nên lưu.
- (d) Art tạo bằng Gemini bản consumer: quyền dùng thương mại khi điều khoản không cấp phép minh thị; nghĩa vụ không gây hiểu nhầm về nguồn gốc AI.
- (e) Unity Personal dùng thuần làm công cụ render cho sản phẩm không chứa Unity, và cách tính ngưỡng cho chủ thể của dự án.
- (f) Dùng đầu ra AI (Gemini, model 3D) để fine-tune model riêng — nhiều điều khoản cấm.
- (g) Rủi ro còn lại khi dùng model huấn luyện trên Objaverse (có phần CC BY-NC và nội dung người dùng tải lên) cho sản phẩm thương mại.
- (h) Đăng ký nhãn hiệu "Sobi World" và nhân vật chủ lực.
