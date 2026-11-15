# 11 — Nguồn tham khảo (mục L)

Ngày: 2026-11-11. File này gom nguồn của cả bộ báo cáo. Nguồn web được chép nguyên từ mục "Nguồn" của `05_CONG_NGHE_AI_3D.md` và `07_BAN_QUYEN.md`: đó là các URL mà phiên tra cứu ghi là đã mở được ngày 2026-11-11. Người tổng hợp không mở lại từng URL.

## 1. Nguồn trong repo

| Nhóm | Đường dẫn |
|---|---|
| Luật và trạng thái | `CLAUDE.md`, `docs/AGENT_RULES.md`, `docs/PROGRESS.md`, `HANDOFF.md` |
| Đặc tả, kiến trúc | `docs/SOBI_WORLD_PROJECT_SPEC_V2.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` |
| Decision | `docs/decisions/017`, `018`, `021`, `022`, `037`, `039`–`044`, `046`–`051` |
| Sobi Studio | `docs/UNITY_STUDIO_PLAN.md`, `docs/studio/STATUS.md`, `docs/studio/u1/`, `docs/studio/vfx/`, `studio/` |
| Animation | `docs/SOBI_WORLD_ANIMATION_SPEC.md`, `docs/animation/` (gồm `rig/AUDIT.md`, `rig/ACCEPTANCE.md`), `docs/animation-review/` (gồm `ANIMATION_REVIEW_FEEDBACK.md`, `ANIMATION_QUALITY_RUBRIC.md`, `rounds/`) |
| Tài liệu animation Adventure | `art_inbox/.batch/adventure-12-animation/all_animation_sobi_adventure_final.md`, `all_animation_sobi_adventure_filled_new.md` |
| Asset, bản quyền | `docs/ASSET_TODO.md`, `docs/THIRD_PARTY.md`, `docs/IP_AUDIT_PROMPT.md`, `public/assets/manifest/assets.json`, `src/core/assets/manifestSchema.ts` |
| Nội dung và code | `content/adventure/` (`skills.json`, `battle_fx.json`, …), `content/anim/rigs/`, `content/schemas/`, `src/` |
| Đo máy | `nvidia-smi`, `Get-CimInstance` chạy ngày 2026-11-11: RTX 3050 6144 MiB, RAM 16 GB, i5-14600KF |

Số dòng trích dẫn cụ thể nằm trong `01_HIEN_TRANG.md` và `02_PHAN_TICH_ANIMATION_SKILL.md`.

## 2. Nguồn web về công nghệ (từ `05`)

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

## 3. Nguồn web về giấy phép và pháp lý (từ `07`)

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

## 4. Mức tin cậy của nguồn

- Trang giấy phép, file LICENSE, model card, tài liệu API chính thức: dùng làm [DỮ LIỆU].
- Bài tổng hợp, tracker vụ kiện, bài đánh giá của bên thứ ba: `05` và `07` gắn nhãn [DỮ LIỆU-2] (nguồn thứ cấp).
- Kiến thức nền không mở được nguồn trong phiên (nhóm retopo / UV, Blender, runtime three.js / Babylon.js / PlayCanvas): `05` gắn nhãn [NỀN] và liệt kê ở "Điều chưa xác minh".
- Không có đánh giá độc lập nào về chất lượng image-to-3D trên nhân vật chibi động vật đủ tốt để thay cho phép thử ở `09`.

## Điều chưa xác minh

- Các trang không mở được: giấy phép Blender, FAQ Mixamo, điều khoản Tripo, CSM, 3D AI Studio, DeepMotion, Rokoko, Move.ai, Spriter, Hunyuan3D 2.5 / 3.x, bản PDF Part 2 của US Copyright Office (`07`).
- Luật AI và Luật Sở hữu trí tuệ sửa đổi của Việt Nam chỉ được xác nhận qua nguồn thứ cấp (`07` mục 3.3).
- Giá và điều khoản dịch vụ thay đổi thường xuyên; mọi con số có giá trị tại ngày truy cập.

## Cần chủ dự án cung cấp/duyệt

- Trước khi dùng bất kỳ công cụ nào cho asset ship: mở lại trang điều khoản, chụp lưu, ghi vào sổ nguồn gốc (`07` mục 6).
- Hỏi luật sư ở các điểm `07` đã đánh dấu.
