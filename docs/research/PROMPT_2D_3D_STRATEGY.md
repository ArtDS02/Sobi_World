# PROMPT NGHIÊN CỨU — Chiến lược 2D / Hybrid / 3D và AI asset pipeline cho Sobi World

> Dán nguyên file này vào session mới. Đây là nhiệm vụ NGHIÊN CỨU + TƯ VẤN, không phải triển khai.

## 0. Vai trò và đầu ra

Bạn là cố vấn chiến lược đồ họa/kỹ thuật độc lập cho Sobi World (game desktop Electron + Vite + TypeScript + Phaser, chơi đơn, offline, định hướng thương mại). Hãy nghiên cứu khách quan, kiểm chứng bằng bằng chứng, rồi khuyến nghị một trong ba phương án — hoặc một phương án khác nếu bằng chứng dẫn tới đó.

**Đầu ra bắt buộc:** bộ file Markdown trong `docs/research/2d-3d-strategy/` (thư mục này là nơi DUY NHẤT được ghi trong repo):
- `00_EXECUTIVE_SUMMARY.md` — hiện trạng, khuyến nghị, 5 lý do chính, quyết định cần chủ dự án duyệt.
- `01_HIEN_TRANG.md` … `11_NGUON_THAM_KHAO.md` theo cấu trúc mục 6.
- `PROS_CONS_<phuong-an>.md` cho từng phương án (A, B, C): bảng lợi/hại có trọng số, kèm bằng chứng và mức tin cậy.
Báo cáo bằng tiếng Việt, thuật ngữ kỹ thuật giữ nguyên. Mỗi kết luận gắn nhãn **[DỮ LIỆU]** (đọc được trong repo/nguồn chính thức) / **[NHẬN ĐỊNH]** / **[GIẢ ĐỊNH]**, kèm đường dẫn file hoặc URL nguồn.

## 1. Ba phương án cần so sánh (chưa chọn)

- **A — Toàn bộ 2D:** giữ 2D, nâng cấp asset, animation, VFX, ánh sáng, cách trình bày.
- **B — Hybrid:** Farm, Garden, Aquarium, Cloud giữ 2D; riêng Adventure chuyển 3D; vẫn thống nhất phong cách/nhận diện.
- **C — Toàn bộ 3D:** mọi khu vực 3D (camera/cách thể hiện có thể khác theo gameplay), nền tảng chung tái sử dụng model, material, rig, animation, VFX, môi trường.

Nguyên tắc: không mặc định 3D tốt hơn 2D, không bảo vệ phương án vì "mới hơn". Không đề xuất 3D nếu vấn đề giải quyết được rẻ hơn/tốt hơn bằng nâng cấp 2D. Mục tiêu cuối: hình ảnh đẹp + sản xuất hiệu quả + chi phí hợp lý + phát triển lâu dài.

## 2. Bối cảnh có sẵn trong repo — PHẢI đọc và đối chiếu trước khi kết luận

Đọc theo thứ tự: `CLAUDE.md` → `docs/AGENT_RULES.md` → `docs/PROGRESS.md` → `docs/SOBI_WORLD_PROJECT_SPEC_V2.md` → `docs/ARCHITECTURE.md`.

Các quyết định đã có và LIÊN QUAN TRỰC TIẾP (không được bỏ qua; nếu khuyến nghị mâu thuẫn thì nêu rõ và đề xuất cách sửa decision):
- `docs/decisions/017` (gameplay trước, art sau), `022` (art pipeline), `048` (không IP bên thứ ba — ràng buộc cứng với mọi tool AI/dataset)
- `docs/decisions/018`, `037`, `039`, `040`, `041`, `042`, `043`, `044`, `046`, `047` (Adventure, battle motion, animation scripts, map)
- `docs/decisions/049` (animation reference library), **`050` (puppet rig 2D tự viết + lớp sống thủ tục)**, **`051` (Sobi Studio: Unity làm xưởng offline render ra 2D)** và `docs/UNITY_STUDIO_PLAN.md`, thư mục `studio/`
- `docs/SOBI_WORLD_ANIMATION_SPEC.md`, `docs/animation/`, `docs/animation-review/`, `docs/research/`, `docs/ASSET_TODO.md`, `docs/THIRD_PARTY.md`, `docs/IP_AUDIT_PROMPT.md`

Phải trả lời rõ: phương án B/C so với đường đã chọn ở 050 + 051 (2D puppet rig + Unity studio render ra PNG/JSON) khác gì, thừa kế được gì, bỏ phí gì, và 051 đã tiến tới đâu (đọc `docs/PROGRESS.md` + `studio/`).

**Tài liệu animation Adventure (ưu tiên cao nhất, đọc toàn văn, không đọc lướt):**
- `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md`
- `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_filled_new.md`
- Tìm thêm bằng Glob/Grep: mô tả animation từng skill, Ultimate, hiệu ứng nguyên tố, chuyển động nhân vật/quái/Animal, hiệu ứng chiến đấu (trong `docs/animation/`, `docs/animation-review/`, `content/`, `src/`).
- Thư mục `art_inbox/` và `asset/` là nguồn art: chỉ mở những gì tác vụ cần; không đọc hàng loạt ảnh.

**HTML prototype:** chưa tìm thấy file prototype nào trong git (chỉ có `index.html`, `admin.html` của game). Hãy tìm thêm (kể cả `studio/`, `tools/`, `art_inbox/`, `docs/`, ngoài repo nếu được cấp quyền). Nếu không thấy, ghi rõ "chưa kiểm tra được" và liệt kê chính xác cần chủ dự án cung cấp gì (file/ảnh chụp/video). TUYỆT ĐỐI không giả định đã xem prototype.

## 3. Nội dung nghiên cứu

**3.1 Hiện trạng:** cấu trúc Sobi World, các Area (Farm, Garden, Aquarium, Cloud, Adventure), gameplay từng khu, tổ chức asset (manifest, id), nhân vật/Animal/NPC/vật phẩm/môi trường, cơ chế animation (puppet rig, tween, FeedbackDirector), tích hợp VFX, camera/chuyển động/tương tác, kiến trúc & engine, giới hạn hiện tại. Đo mức tách biệt Game Logic / Gameplay / Animation / Asset pipeline / Rendering / Camera / VFX: nếu đổi 2D→3D, giữ lại được bao nhiêu `src/core/`?

**3.2 Adventure (chuyên sâu):** khám phá/di chuyển, chiến đấu, Animal/nhân vật/quái, kỹ năng–nguyên tố–phản ứng, animation nhân vật/skill/Ultimate, hiệu ứng đánh/trúng/trạng thái, vấn đề về độ sống động và đồng bộ animation↔gameplay. Với từng vấn đề: giải được bằng nâng cấp pipeline 2D hay thực sự cần 3D? Phải có lập luận.

**3.3 Phân tích animation skill (từ tài liệu mục 2):** với từng nhóm skill — động tác, các giai đoạn, chuyển động từng bộ phận (đầu/tay/chân/cánh/đuôi…), anticipation, thời điểm đánh/VFX/sát thương, kết thúc, cần animation riêng theo Animal hay dùng chung. Không kết luận "chỉ đổi màu/VFX là đủ".
- So sánh thể hiện bằng sprite sheet 2D (cần frame nào), skeletal 2D, và 3D (rig/chuyển động); chỗ nào 3D thật sự hơn, chỗ nào 2D tương đương.
- Phân loại skill theo độ phức tạp và lợi ích khi sang 3D (bảng).
- Nếu 3D: chuyển mô tả thành state machine, clips, yêu cầu rig, animation events, timing skill, đồng bộ VFX, hit reaction, blending, transition, Ultimate/boss — GIỮ NGUYÊN ý đồ thiết kế, không đơn giản hóa vì AI khó làm.
- Đề xuất hệ thống animation mở rộng cho cả 2D và 3D: dùng chung theo body-plan, đặc thù khi cần, kết hợp clip + procedural + VFX, thêm Animal/skill mới không phải xây lại.

**3.4 Chất lượng hình ảnh & prototype:** (nếu có prototype) cái gì tốt hơn và vì sao (chuyển động, camera, chiều sâu, ánh sáng, đồng bộ…) — đừng mặc định mọi cải thiện đến từ 3D; vì sao vẫn chưa đẹp: tách theo art direction / modeling / topology / material-texture / lighting / rendering / camera / animation / VFX / composition, mỗi vấn đề một giải pháp. Đích: stylized có khối, ánh sáng có chủ đích, vật liệu không "nhựa", chuyển động có trọng lượng, VFX có chiều sâu, không photorealistic, giữ phong cách Sobi (tròn trịa, thân thiện, pastel). Kiểm chứng riêng: 2D hiện tại nâng lên mức mong muốn được không.

**3.5 So sánh A/B/C** theo: chất lượng hình, thể hiện nhân vật/animation/skill/VFX/tương tác môi trường, trải nghiệm, giữ phong cách, tái sử dụng, mở rộng nội dung, độ phức tạp, chi phí, hiệu năng, tốc độ, phụ thuộc nhân sự chuyên môn, khả năng dùng AI. Đánh giá riêng từng Area: Farm (cây trồng/vật nuôi/tương tác), Garden (cây cảnh/chậu/trang trí), Aquarium (cá/nước), Cloud (đất mây/vật thể), Adventure (khám phá/chiến đấu/skill). Không chấm 3D chỉ vì "đẹp hơn".

**3.6 Chuyển asset 2D → 3D bằng AI:** phân biệt 6 mức (render tĩnh; xoay được; topology tốt; có rig/skin; có animation; đạt production). Khó khăn do thiếu mặt sau/độ sâu/topology/UV/xương. Khả năng giữ hình tròn trịa, tỷ lệ, pastel, đường nét, chất liệu, nhận diện. Xét stylized 3D, low-poly, hand-painted, 2.5D, và cả đường hiện có của 051 (dựng 3D bằng code → render ra 2D).

**3.7 Công cụ AI & tự động hóa:** Blender + Python API/MCP, image-to-3D, text-to-3D, AI mesh, texture/material, retopo, UV, auto-rig, skinning, AI animation, mocap AI, render/QA tự động, agent/CLI/API. Ưu tiên: (1) miễn phí + mã nguồn mở, (2) miễn phí giới hạn chất lượng tốt, (3) chạy local, (4) có API/CLI/SDK, (5) trả phí chỉ khi vượt trội rõ. Phần cứng máy chủ dự án: kiểm tra GPU/VRAM thực tế của máy này trước khi đánh giá khả năng chạy local.
- Mỗi công cụ ghi: website chính thức, GitHub, giấy phép (code + weights + dataset), quyền thương mại, phần cứng/VRAM, chạy local, API/CLI, Claude điều khiển được không, chất lượng thực tế, hạn chế, chi phí, mức hợp Sobi. Dùng thông tin hiện hành từ nguồn chính thức; không bịa tính năng/giấy phép/benchmark.
- Tự động hóa 12 bước (nhận 2D → phân tích → model → topo → UV → texture → rig/skin → animation → preview → kiểm lỗi → tự sửa → xuất): bước nào tự động, bước nào cần người duyệt, bước nào cần nghệ sĩ 3D.
- Quy mô hàng trăm/nghìn asset: tính ổn định, giữ phong cách, chi phí khi mở rộng.

**3.8 Bản quyền (bắt buộc, gắn với decision 048):** với mọi tool/model/dataset/thư viện/asset: giấy phép phần mềm, weights, dataset, quyền thương mại, attribution, redistribution, sublicensing, tác phẩm phái sinh, hạn chế đầu ra AI, nguồn gốc đầu vào/đầu ra. Phân biệt miễn phí ≠ mã nguồn mở ≠ được dùng thương mại. Gán rủi ro thấp/trung bình/cao/chưa xác định; loại rủi ro cao khỏi production nếu chưa có cách xử lý. Đề xuất sổ nguồn gốc/giấy phép cho từng asset (tích hợp `docs/THIRD_PARTY.md`). Chưa đủ dữ kiện pháp lý thì ghi "chưa xác minh", không cam kết an toàn tuyệt đối.

**3.9 Chi phí & hiệu quả dài hạn (A/B/C):** chuyển đổi, asset, animation, VFX, tích hợp, dịch vụ AI, nhân sự, tối ưu hiệu năng, bảo trì, tái sử dụng, tốc độ, mở rộng, rủi ro kỹ thuật/bản quyền. Thiếu số liệu thì cho khoảng ước lượng + giả định + độ tin cậy.

**3.10 Prototype kiểm chứng (chỉ đề xuất, chưa làm):** 1 Animal đơn giản, 1 Animal cấu trúc phức tạp, 1 nhân vật/quái, 1 môi trường nhỏ, vài tương tác, 1 tình huống chiến đấu, vài skill/VFX khác nhau (CHỌN từ tài liệu animation mục 2, nêu lý do chọn), clip idle/walk/run/attack/cast/hurt/KO/victory. Chấm 15 tiêu chí: trung thành thiết kế 2D, model, topology, rig/skin, animation, VFX, ánh sáng/vật liệu, hình ảnh tổng thể, tích hợp engine, hiệu năng, thời gian, tự động hóa, chi phí, bản quyền, sản xuất hàng loạt. Đặt tiêu chí đạt/không đạt TRƯỚC khi mở rộng.

**3.11 Lộ trình:** theo giai đoạn, có tiêu chí nghiệm thu, điều kiện dừng, điểm quay lại; ghi rõ ảnh hưởng tới roadmap/GĐ hiện tại và decision 017/050/051.

## 4. Cấu trúc báo cáo cuối

A. Executive Summary · B. Hiện trạng · C. Phân tích tài liệu animation skill · D. Phân tích HTML prototype · E. So sánh 2D/Hybrid/3D · F. Công nghệ AI 3D · G. Pipeline miễn phí & tự động hóa · H. Bản quyền · I. Chi phí & hiệu quả dài hạn · J. Prototype & tiêu chí · K. Khuyến nghị cuối & lộ trình · L. Nguồn tham khảo (website chính thức, tài liệu kỹ thuật, GitHub, giấy phép, đánh giá độc lập).

## 5. Cách làm việc

1. Đọc repo/tài liệu trước, tra cứu web sau; ưu tiên nguồn chính thức và trang giấy phép. Dùng subagent song song cho các nhánh độc lập (đọc tài liệu animation / khảo sát tool AI 3D / giấy phép).
2. Không đánh giá 3D chỉ qua demo; mọi khuyến nghị gắn với thực tế Sobi World.
3. Cuối mỗi file ghi "Điều chưa xác minh" và "Cần chủ dự án cung cấp/duyệt".
4. Báo cáo cuối theo mẫu AGENT_RULES §7.

## 6. GIỚI HẠN QUYỀN (bắt buộc)

Chỉ được ĐỌC, phân tích, tra cứu web và ghi file báo cáo trong `docs/research/2d-3d-strategy/`. KHÔNG: sửa source/`content/`/`src/`/`studio/`, đổi kiến trúc, xóa hoặc ghi đè asset, thay asset 2D, tạo hàng loạt asset 3D, cài/đổi dependency (`package.json`, lockfile), commit/push, chuyển đổi production. Cần thử công cụ thì chỉ trong thư mục tạm ngoài repo, độc lập dự án chính, và nếu phải tải file về thì hỏi chủ dự án trước (nêu tên file, nguồn, dung lượng). Mọi triển khai/prototype trong repo cần chủ dự án duyệt riêng.

**Mục tiêu giai đoạn này: cho chủ dự án đủ bằng chứng để quyết định đúng, không phải bắt đầu chuyển đổi.**
