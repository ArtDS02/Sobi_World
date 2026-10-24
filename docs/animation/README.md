# docs/animation — Animation trận Sobi Adventure (GĐ14, decision 040)

Bộ tài liệu theo prompt `art_inbox/.batch/Sobi_Adventure_UI_Animation_Claude_Prompt.md`. Đặt trong `docs/` (có git); `art_inbox/` bị `.gitignore` nên chỉ chứa ảnh chụp và file trỏ về đây.

**Bắt đầu đọc:** [`HUONG_DAN_CHU_DU_AN.md`](HUONG_DAN_CHU_DU_AN.md) — hướng dẫn từng bước cho chủ dự án.

| File | Nội dung |
| --- | --- |
| `sobi_adventure_audit.md` | Audit: công nghệ, màn hình / trạng thái, bản đồ, combat, asset, lỗi UI/UX, phần chưa xác minh, ưu tiên |
| `animation_inventory.csv` | 295 dòng (id thật từ content): idle / pose / reaction / corruption của chiến binh + 22 quái, VFX 112 kỹ năng, 9 hệ, 6 phản ứng, 9 cut-in, 12 feedback UI; priority, status, kỹ thuật, asset đề xuất, fallback, QA |
| `animation_style_guide.md` | Nhận diện, quy tắc từng loại, ngôn ngữ hình 9 hệ, Essence vs Umbraflux, pivot / canvas, lỗi cấm |
| `technical_pipeline.md` | 11 bước ảnh nguồn → runtime, quy ước id / file, thời lượng, nén |
| `integration_spec.md` | Luồng dữ liệu, state, nguồn dữ liệu duy nhất, fallback, bước tích hợp tiếp |
| `qa_checklist.md` | Checklist ảnh tham chiếu, animation, regression (kết quả lần này ghi sẵn) |
| `manual_capture_checklist.md` | Trạng thái cần chụp tay và cách mở |
| `prompts/01..08` | Prompt AI tái sử dụng (model sheet, idle, attack, cast, hit / thắng / thua, VFX hệ, Umbraflux, dọn sheet) |
| `manifests/` | JSON schema cho dòng animation (lập kế hoạch) + ví dụ dòng manifest `fx` |
| `examples/sample_animation_spec.md` | Brief mẫu: Cu Ủn — Gai Độc (vertical slice) |

Code: `src/areas/adventure/ui/{battleMotion,battleMotionView,motionProfiles}.ts`, `src/styles/features/_adventureMotion.scss`. Chụp ảnh: `scripts/capture/adventureShots.ts`.
