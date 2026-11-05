# Thư viện tham chiếu Animation & VFX — Sobi Adventure

Decision 049. Mục đích: một chuẩn chung cho **mọi** animation trận (skill, status, phản ứng, hành động của sinh vật) để nâng cấp đồng bộ, và để agent / người cùng hiểu "tốt" trông thế nào trước khi làm.
Thứ chạy trong game vẫn chỉ là `content/adventure/battle_fx.json` (decision 044). Thư viện mô tả; không thay engine.

## Cấu trúc
| Đường dẫn | Nội dung | Ai ghi |
|---|---|---|
| [`STANDARDS.md`](STANDARDS.md) | Chuẩn chung: giai đoạn, 5 lớp, bậc lực T0–T4, ngân sách thời gian, "ba dấu hiệu sống", checklist | Motion Designer (chủ dự án duyệt khi đổi) |
| `bibles/elements/<HỆ>.md` | Mỗi hệ: vật lý, hình khối, nhịp, palette, act gợi ý, cấm, hiện trạng (`anim:audit`) | Motion Designer |
| `bibles/motifs/<motif>.md` | Thẻ phụ dùng xuyên hệ: ice, steam, wind, poison, heal, shield… | Motion Designer |
| `bibles/actions/<loại>.md` | Mỗi loại hành động: phóng đạn, cận chiến & bị đánh, cast, buff, status, ultimate, idle… | Motion Designer |
| `refs/<REF-ID>.json` | Một hiệu ứng tham chiếu: giai đoạn (ms), lớp, hạt, act gợi ý, nguồn + loại bản quyền, cách chuyển sang phong cách Sobi | Reference Curator |
| `briefs/<skillId>.md` | Motion Brief của một skill (khi làm thật): REF, bậc, bảng giai đoạn → act, danh sách asset cho Artist, tiêu chí nghiệm thu đo được | Motion Designer |

Đã có: STANDARDS; bible [WATER](bibles/elements/WATER.md), motif [ice](bibles/motifs/ice.md), hành động [projectile](bibles/actions/projectile.md), [melee-and-hit](bibles/actions/melee-and-hit.md); REF trong `refs/`. Còn lại: xem decision 049 §Lộ trình.

## Bản ghi REF
Schema: `scripts/anim-review/lib/library.ts` (zod), kiểm bằng `tests/scripts/animLibrary.test.ts` (chạy trong `npm run check`):
- `id` = tên file, dạng `REF-<NHÓM>-<TÊN>-NNN`; `element` là hệ của game hoặc `NONE`; `motifs` là thẻ phụ.
- `phases[]`: `phase` (preparation · startup · execution · travel · impact · aftermath · recovery), `ms: [từ, tới]` tăng dần, `desc`, `acts` (tên `do:` thật của engine).
- `layers` (L0–L4 của STANDARDS), `particles`, `secondary`, `complexity` S/M/L/XL, `tier` T0–T4.
- `sources[]`: `kind` = `R` (chỉ nghiên cứu) / `F` (dùng được, phải có `license`) / `L` (cần phép) / `GAME` (frame của chính Sobi). **Không** trỏ tới file ảnh của bên thứ ba trong repo.
- `implementedBy`: id skill / `status:<id>` / `action:<id>` / `reaction:<id>` có thật; `status`: `draft` → `approved` → `implemented` (chỉ `implemented` khi có run capture trỏ kèm trong `evidence`).

## Quy trình (tóm tắt — chi tiết ở nghiên cứu 2026-11-05, decision 049)
1. `npm run anim:audit` → chọn đơn vị ưu tiên.
2. Motion Designer đọc bible hệ + bible hành động + REF → viết `briefs/<skillId>.md`.
3. Artist (chủ dự án render Gemini qua skill `image-to-asset` / `image-to-prompt`) làm phần asset của brief → `art_inbox/` → `art:process` → `assets:check` → IP audit (`docs/IP_AUDIT_PROMPT.md`).
4. Developer chuyển bảng giai đoạn → act trong `battle_fx.json`; `npm run check`.
5. Harness `anim:capture` + `anim:audit` → TD chấm theo rubric (`docs/animation-review/`) → chủ dự án playtest C2/C5.

## Bản quyền (decision 048, 049)
Chỉ học nguyên lý (nhịp, lớp, vật lý, cách phối hợp). Không sao chép sprite, khung hình, âm thanh, tên chiêu, thiết kế đặc trưng của game khác. Không ghi "giống chiêu X của game Y" trong brief; mô tả bằng hình khối và chuyển động.
