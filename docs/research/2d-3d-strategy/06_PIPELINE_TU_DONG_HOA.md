# 06 — Pipeline miễn phí và tự động hóa (mục G)

Ngày: 2026-11-11. Nhãn: [DỮ LIỆU] · [NHẬN ĐỊNH] · [GIẢ ĐỊNH]. Chi tiết từng công cụ, URL và giấy phép: `05_CONG_NGHE_AI_3D.md`, `07_BAN_QUYEN.md`. File này chỉ ghép chúng thành quy trình và nói rõ ai làm bước nào.

## 1. Điều kiện biên

| Điều kiện | Giá trị | Nguồn |
|---|---|---|
| GPU máy dự án | NVIDIA RTX 3050, 6 GB VRAM (`nvidia-smi`: 6144 MiB) | [DỮ LIỆU] đo ngày 2026-11-11 |
| RAM / CPU | 16 GB / Intel i5-14600KF | [DỮ LIỆU] đo cùng ngày |
| Nhân sự | Chủ dự án + AI agent; không có nghệ sĩ 3D | [DỮ LIỆU] `docs/decisions/022`, `051` |
| Ngân sách công cụ | Chủ dự án không mua API tạo ảnh; art do Gemini bản miễn phí vẽ | [DỮ LIỆU] `docs/decisions/022-art-pipeline.md` |
| Đầu vào | Tranh 2D đã duyệt, một góc nhìn (3/4 quay phải), 6 key pose cho 43 sinh vật trận | [DỮ LIỆU] `docs/decisions/050` bổ sung (5) |

Hệ quả [NHẬN ĐỊNH]: máy này không chạy được các model image-to-3D và auto-rig tốt nhất hiện có (cần 8–24 GB VRAM, xem `05` mục 2a, 2e). Local chỉ làm được phần hậu kỳ tất định (Blender headless, Unity batchmode) và model đời cũ ở sát ngưỡng.

## 2. Mười hai bước: ai làm

Ký hiệu: **TĐ** = tự động bằng script hoặc agent, không cần người; **Duyệt** = tự động nhưng người phải nhìn và chấp nhận; **Nghệ sĩ** = cần tay nghề 3D, AI chưa thay được ổn định.

| # | Bước | Công cụ khả dĩ | Mức | Lý do |
|---|---|---|---|---|
| 1 | Nhận tranh 2D | Manifest hiện có, `art_inbox/` | TĐ | Đã có pipeline id → manifest |
| 2 | Phân tích: body-plan, bộ phận, phần bị che, bảng màu | Agent đọc ảnh; script dò mốc kiểu `scripts/rig/autoskin*.py` | Duyệt | Dò mốc tự động đã từng nhận nhầm 14/22 quái (mắt, sọc, khuy áo), phải sửa tay [DỮ LIỆU] `docs/decisions/050` bổ sung (4) |
| 3 | Dựng model | Image-to-3D (cloud hoặc GPU thuê); local chỉ model đời cũ | Duyệt | Mặt sau và độ dày là phỏng đoán của model; phải so với tranh |
| 4 | Topology | QuadriFlow trong Blender; retopo của dịch vụ trả phí | TĐ cho prop tĩnh; **Nghệ sĩ** cho nhân vật | Remesh tự động cho quad đều nhưng không đặt edge loop quanh khớp, cổ, mặt |
| 5 | UV | Blender Smart UV, xatlas | TĐ | Đủ cho texture nướng hoặc màu theo vùng; không đủ nếu muốn vẽ tay trên UV |
| 6 | Texture / material | Chiếu tranh gốc từ camera; bảng màu + toon shader; model texture AI cần > 6 GB | Duyệt | Chiếu từ một góc để lại mặt sau trống hoặc kéo sọc |
| 7 | Rig / skin | Rigify, xương đặt bằng `bpy` theo body-plan; auto-rig AI (cloud) | Duyệt cho bốn chân đơn giản; **Nghệ sĩ** cho cá, cánh, tai dài, đầu to chân ngắn | Weight vùng cổ–đầu–chân ngắn của chibi là chỗ auto-rig hay sai (`05` mục 5) |
| 8 | Animation | Clip thủ tục và keyframe viết bằng dữ liệu (như 25 clip chung của 050) | **Nghệ sĩ** hoặc agent viết + người duyệt từng clip | Text-to-motion và mocap AI chỉ cho người; không dùng được cho heo, cá, chim (`05` mục 2f) |
| 9 | Preview | Blender headless render dải khung; Admin "Xưởng rig", "Xưởng trận" đã có | TĐ | Đã có `rig:snap`, `anim:capture` |
| 10 | Kiểm lỗi | Script: cỡ canvas, neo, alpha, halo, bảng màu, khung đầu ≈ khung cuối; so cạnh tranh mẫu | TĐ cho lỗi đo được; Duyệt cho "có đẹp không" | Agent tự chấm ảnh để lọt lỗi tinh tế [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` R7; bản skin (3)/(4) của 050 agent báo đạt nhưng chủ dự án bác |
| 11 | Tự sửa | Vòng lặp agent: đổi tham số → render lại | TĐ cho lỗi kỹ thuật; không tự sửa được lỗi thẩm mỹ | U1 cần ~10 vòng chỉnh mỗi asset mà vẫn không đạt [DỮ LIỆU] `docs/studio/STATUS.md` |
| 12 | Xuất | PNG + JSON qua manifest (đường 2D); glTF/GLB (đường 3D runtime) | TĐ | Đường PNG đã có; đường GLB chưa có gì trong repo |

Đọc bảng [NHẬN ĐỊNH]: các bước 1, 5, 9, 12 tự động hoàn toàn. Các bước 2, 3, 6, 10 tự động được nhưng chất lượng do người duyệt quyết định. Các bước 4, 7, 8 với nhân vật là nơi thiếu nghệ sĩ 3D sẽ lộ ra. Đây cũng chính là ba bước phân biệt "mesh xoay được" (mức 2) với "nhân vật dùng được trong game" (mức 4–5).

## 3. Ba cấu hình pipeline

### 3.1 P0 — đường 2D hiện tại (đã chạy)

```
tranh Gemini đã duyệt → cắt sheet → 6 key pose → rig pose-to-pose (content/anim/rigs/*.json)
→ clip chung theo body-plan + lớp sống thủ tục → VFX kịch bản (battle_fx.json) → Phaser
```
Chi phí công cụ: 0. Giới hạn đã ghi: không có khung trung gian giữa hai tranh (`docs/decisions/050` bổ sung (5)).

### 3.2 P1 — 3D làm xưởng offline, game vẫn 2D (chưa thử)

```
tranh đã duyệt → image-to-3D (cloud / GPU thuê) → Blender headless: dọn, remesh, xương theo body-plan,
chiếu tranh làm texture, toon + viền → render pose trung gian ra PNG → nhập qua manifest → rig pose-to-pose có thêm tranh
```
Mục đích hẹp: sinh **tranh trung gian** (windup, giữa đòn, quay người) mà Gemini vẽ lại thì lệch nhận diện. Khác U1 ở nguồn hình: lấy từ tranh đã duyệt, không dựng bằng toạ độ. Rủi ro chính: ảnh render không khớp nét vẽ của tranh gốc khi đặt xen kẽ trong cùng một clip [GIẢ ĐỊNH, phải đo bằng prototype].

### 3.3 P2 — 3D runtime (chưa có gì trong repo)

```
P1 đến hết bước rig → clip 3D → GLB → renderer 3D trong Electron (three.js / Babylon.js) cạnh hoặc thay Phaser
```
Cần thêm: một renderer thứ hai, toon shader runtime, hệ camera, chuyển VFX sheet 2D sang billboard hoặc làm lại, và bước 4, 7, 8 phải đạt mức production cho mọi sinh vật.

## 3b. Ràng buộc giấy phép lên pipeline (tóm tắt từ `07` mục 5)

| Mắt xích | Vướng | Hệ quả cho pipeline |
|---|---|---|
| Bộ tách nền mặc định của `rembg` (BRIA RMBG) | Phi thương mại | Tranh Sobi đã có alpha sẵn: bỏ hẳn bước tách nền |
| `nvdiffrast` / `nvdiffrec` (TRELLIS.2 phụ thuộc) | Chỉ phi thương mại | Chỉ lấy mesh thô; chiếu / nướng texture trong Blender |
| Hunyuan3D 2.x bản weights mở | Cấm dùng đầu ra ở EU, UK, Hàn Quốc | Loại nếu bán toàn cầu, kể cả bản mini là thứ chạy được trên 6 GB |
| MeshAnything (retopo AI) | Phi thương mại | Dùng QuadriFlow trong Blender |
| Text-to-motion (MDM, MoMask, HY-Motion) | Dataset cấm thương mại; chỉ cho người | Clip viết bằng dữ liệu như hiện nay |
| Gói free của dịch vụ cloud | CC BY 4.0 hoặc phi thương mại | Chỉ dùng để thử; asset ship phải tạo trong kỳ trả phí |

Kết hợp với giới hạn 6 GB VRAM [NHẬN ĐỊNH]: đường "miễn phí + mã mở + chạy local + sạch giấy phép" hiện chỉ còn TripoSR (MIT, đời 2024, sát ngưỡng) cho khâu dựng mesh, cộng Blender cho mọi khâu sau. Mọi lựa chọn chất lượng cao hơn đều cần GPU thuê hoặc dịch vụ trả phí.

## 4. Claude điều khiển được gì

| Thành phần | Điều khiển bằng | Trạng thái |
|---|---|---|
| Unity batchmode | `npm run studio` (CLI đã viết) | Đã chạy trong repo [DỮ LIỆU] `docs/studio/STATUS.md` U0 |
| Blender headless | `blender -b -P script.py`, hoặc Blender MCP | Chưa cài trên máy này; cần chủ dự án duyệt cài |
| Dịch vụ image-to-3D có API/CLI | HTTP / CLI | Cần tài khoản, khoá API và đồng ý đưa tranh lên dịch vụ ngoài: **việc của chủ dự án** |
| Dịch vụ chỉ có giao diện web (gói free) | Thao tác tay | Không tự động hóa được; giống cách chủ dự án đang dán prompt Gemini |

## 5. Quy mô

Số lượng hiện có: 2279 dòng manifest, 2547 PNG; 43 sinh vật trận × 6 key pose [DỮ LIỆU] `docs/UNITY_STUDIO_PLAN.md` §2.

- Với P1 chỉ áp cho sinh vật trận: 43 model, mỗi model thêm 3–6 tranh trung gian. Khối lượng nhỏ, kiểm bằng mắt được.
- Với P2 cho Adventure: 43 model có rig và khoảng 25 clip mỗi body-plan; cộng môi trường trận và bản đồ.
- Với P2 cho cả game: thêm 89 dòng heo farm, cá, hoa, cây trồng, 26 công trình, 128 dòng môi trường. Không có số đo tỉ lệ làm lại; ước lượng trong `05` mục 4 là 50–80 % nhân vật phải sinh lại hoặc sửa tay ít nhất một bước [GIẢ ĐỊNH].

## Điều chưa xác minh

- Chưa chạy thử công cụ nào: mọi nhận xét "chạy được trên 6 GB" là đối chiếu số công bố.
- Chất lượng image-to-3D trên chính tranh Sobi (chibi, 3/4, có phụ kiện) chưa đo.
- Ảnh render toon từ model AI có trộn được với tranh Gemini trong cùng một clip không.

## Cần chủ dự án cung cấp/duyệt

- Có cho phép cài Blender (miễn phí, khoảng 400 MB) vào máy, ngoài repo, để thử P1 không.
- Có cho phép đưa 2–3 tranh đã duyệt lên một dịch vụ image-to-3D bên ngoài không, và dịch vụ nào (xem điều khoản ở `07_BAN_QUYEN.md`).
- Ngân sách tối đa cho một lần thử (đề xuất trong `09_PROTOTYPE_VA_TIEU_CHI.md`).
