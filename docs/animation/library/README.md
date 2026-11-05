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
| [`scenarios/`](scenarios/README.md)`<loại>/<id>.md` | **Kịch bản animation** của từng skill / trạng thái / hành động / phản ứng: ý tưởng → nhịp → bóc lớp L0–L4 → đặc tả asset → bước dựng → nghiệm thu. Viết và duyệt **trước** khi tạo asset và dựng act | Motion Designer |

## Mục lục
- **Hệ (9):** [WATER](bibles/elements/WATER.md) · [FIRE](bibles/elements/FIRE.md) · [NATURE](bibles/elements/NATURE.md) · [EARTH](bibles/elements/EARTH.md) · [METAL](bibles/elements/METAL.md) · [LIGHTNING](bibles/elements/LIGHTNING.md) · [DARK](bibles/elements/DARK.md) · [LIGHT](bibles/elements/LIGHT.md) · [VOID](bibles/elements/VOID.md)
- **Motif:** [ice](bibles/motifs/ice.md) · [poison](bibles/motifs/poison.md)
- **Hành động:** [projectile](bibles/actions/projectile.md) · [melee-and-hit](bibles/actions/melee-and-hit.md) · [cast](bibles/actions/cast.md) · [buff-and-heal](bibles/actions/buff-and-heal.md) · [status](bibles/actions/status.md) · [ultimate](bibles/actions/ultimate.md) · [idle-and-states](bibles/actions/idle-and-states.md)
- **REF:** `refs/` (Nước: sóng, bong bóng, băng bọc). Thêm REF khi làm brief cho hệ / loại tương ứng.

## Thứ tự nâng cấp (từ `anim:audit` + bible)
Bảng "Hiện trạng" trong bible là ảnh chụp audit lúc viết; nguồn sự thật luôn là [`AUDIT.md`](../../animation-review/audit/AUDIT.md) (`npm run anim:audit`).
1. **Pilot Nước** (P2): `skill_nh_tsunami` — so flipbook vs displacement (decision 049 §6).
2. ✅ (2026-11-05, xem PROGRESS) **Sửa dữ liệu rẻ, lợi lớn** (chi phí S, không cần art): L2 cho 11 ultimate; hạ tác động các skill quá tay (Đất `seal_quake`, `qs_quake`; Thiên nhiên `thorn_storm`; Hư Không `void_vortex`; Lửa `magma_breath`); thêm tác động cho `e_wraith_touch`, `e_rune_beam`, `e_frost_breath`; `actions.hit` dùng `$spark`; `VOID.spark` bỏ `ice_pop`; thêm pha tụ cho skill Kim / Ánh sáng quá ngắn; dư âm (`NO_AFTERMATH`, 37 skill).
3. **Hình chủ đạo sống** theo hướng chọn ở P2: ultimate → skill dòng (unique) → quái → hỗ trợ.

## Bản ghi REF
Schema: `scripts/anim-review/lib/library.ts` (zod), kiểm bằng `tests/scripts/animLibrary.test.ts` (chạy trong `npm run check`):
- `id` = tên file, dạng `REF-<NHÓM>-<TÊN>-NNN`; `element` là hệ của game hoặc `NONE`; `motifs` là thẻ phụ.
- `phases[]`: `phase` (preparation · startup · execution · travel · impact · aftermath · recovery), `ms: [từ, tới]` tăng dần, `desc`, `acts` (tên `do:` thật của engine).
- `layers` (L0–L4 của STANDARDS), `particles`, `secondary`, `complexity` S/M/L/XL, `tier` T0–T4.
- `sources[]`: `kind` = `R` (chỉ nghiên cứu) / `F` (dùng được, phải có `license`) / `L` (cần phép) / `GAME` (frame của chính Sobi). **Không** trỏ tới file ảnh của bên thứ ba trong repo.
- `implementedBy`: id skill / `status:<id>` / `action:<id>` / `reaction:<id>` có thật; `status`: `draft` → `approved` → `implemented` (chỉ `implemented` khi có run capture trỏ kèm trong `evidence`).

## Quy trình (tóm tắt — chi tiết ở nghiên cứu 2026-11-05, decision 049)
1. `npm run anim:audit` → chọn đơn vị ưu tiên.
2. Motion Designer đọc bible hệ + bible hành động + REF + thiết kế gốc → viết **kịch bản** `scenarios/<loại>/<id>.md` (khuôn ở [scenarios/README](scenarios/README.md)) → chủ dự án duyệt (`status: approved`).
3. Artist (chủ dự án render Gemini qua skill `image-to-asset` / `image-to-prompt`) làm asset theo `assets[].spec` của kịch bản → `art_inbox/` → `art:process` → `assets:check` → IP audit (`docs/IP_AUDIT_PROMPT.md`).
4. Developer dựng theo "Các bước dựng" của kịch bản (B1 nhịp → … → B7 capture) trong `battle_fx.json`; `npm run check`.
5. Harness `anim:capture` + `anim:audit` → TD chấm theo rubric (`docs/animation-review/`) → chủ dự án playtest C2/C5.

## Bản quyền (decision 048, 049)
Chỉ học nguyên lý (nhịp, lớp, vật lý, cách phối hợp). Không sao chép sprite, khung hình, âm thanh, tên chiêu, thiết kế đặc trưng của game khác. Không ghi "giống chiêu X của game Y" trong brief; mô tả bằng hình khối và chuyển động.
