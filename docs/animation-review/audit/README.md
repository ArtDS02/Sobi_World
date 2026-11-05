# Audit animation — "sprite tĩnh di chuyển", tác động, lớp, nhịp

Bước P0 của nghiên cứu Animation & VFX Reference (2026-11-05). Mục đích: biến cảm nhận "hiệu ứng chỉ là ảnh tĩnh được kéo đi / phóng to" thành **số đo**, để xếp ưu tiên nâng cấp cho cả 9 hệ, không chỉ hệ Nước.
Hai thước đo, bổ sung cho nhau. Cả hai chỉ cho **cờ gợi ý** (như rubric §10.3): không tự hạ điểm, TD vẫn phải xem hình.

| Thước đo | Lệnh | Đọc gì | Chi phí |
|---|---|---|---|
| **Audit dữ liệu** | `npm run anim:audit` (`--check`: báo lỗi nếu file dưới đây cũ) | kịch bản trong `content/adventure/battle_fx.json` + `skills.json` + số khung trong manifest asset | < 1 giây, không mở trình duyệt |
| **Đo hình từ frame** | `npm run anim:capture` (chỉ số `shapeIoU`, cờ `STATIC_SHAPE`) | frame chụp thật của harness | như capture |

File sinh ra (không sửa tay): [`AUDIT.md`](AUDIT.md) (người đọc), [`inventory.json`](inventory.json) (máy đọc). Code: `scripts/anim-review/audit.ts`, `lib/scriptAudit.ts`, `lib/shape.ts`; test `tests/scripts/animAudit.test.ts`, `animShape.test.ts`.

## 1. Audit dữ liệu (`lib/scriptAudit.ts`)

**Hình chủ đạo (hero)**: trong các act vẽ hình (`prop, strip, ribbon, beam, cone, tether`) bắt đầu **trước va chạm đầu tiên**, lấy vật nặng nhất (kích thước × thời gian hiện, act phủ cả sân ×2; nhiều act cùng một ảnh tính là một vật). Đó là thứ người chơi nhớ: ngọn sóng, bong bóng, đinh ba.

**Độ sống (liveness)** của một act vẽ hình: `prop` (ảnh `fxp_` / `fxs_` một khung, chỉ di chuyển / phóng / xoay / nhún) = 0; `strip` = số khung ÷ 8 (4 khung = 0,5); `ribbon / beam / cone / tether` (vẽ bằng code, biến dạng mỗi khung) = 1.

**Bậc sức mạnh** (T0–T4): cần = theo `power` (0 → T0, < 0,9 → T1, < 1,4 → T2, còn lại T3, ultimate T4); có = mạnh nhất trong hit-stop (`light/medium/heavy/ultimate` → T1–T4), rung (≥ 3 → T2, ≥ 5 → T3, ≥ 7 → T4), `punch`, `flash` (alpha ≥ 0,4 → T3), `slowmo`.

| Cờ | Điều kiện | Trọng số ưu tiên |
|---|---|---|
| `STATIC_HERO` | hình chủ đạo có liveness 0 | 3 |
| `STATIC_SHARE` | > 30% trọng lượng hình vẽ là ảnh tĩnh | 2 |
| `IMPACT_UNDER_TIER` | bậc có < bậc cần − 1 | 3 |
| `IMPACT_OVER_TIER` | bậc có > bậc cần + 1 (ví dụ buff rung màn) | 1 |
| `NO_PREPARATION` | người ra đòn không có `pose/move/glow` trước va chạm | 2 |
| `NO_AFTERMATH` | không có `decal` từ lúc va chạm, hay hạt / hình nào bắt đầu ≥ 150 ms sau va chạm | 1 |
| `FEW_LAYERS` | số lớp (L0 màn · L1 thân · L2 lõi/vệt · L3 hạt/vết · L4 phản hồi) < 2 / 3 / 4 / 5 (T0 / T1–2 / T3 / ultimate) | 2 |
| `DURATION_OVER` / `UNDER` | ngoài ngân sách x1: thường 900–1500, T3 1300–2000, hỗ trợ 700–1400, ultimate 2500–4500 ms (act không có `dur` tính 300 ms) | 1 |
| `SHARED_FLIPBOOK_HERO` | hình chủ đạo là flipbook dùng ở > 5 skill | 1 |
| `NO_SCRIPT` | skill không có kịch bản | 3 |

**Ưu tiên** = tổng trọng số cờ × mức người chơi thấy (`class` 3 — heo nào cũng có; `unique`, `enemy` 2; `ultimate` 1).

Giới hạn: chỉ đọc kịch bản của skill; hành động chung (`actions.hit`, `heavy`, `crit` phát thêm khi trúng đòn mạnh / chí mạng) không tính, nên `IMPACT_UNDER_TIER` có thể nhẹ hơn thực tế khi chí mạng. Ngưỡng là **đề xuất** của nghiên cứu, chưa được chủ dự án duyệt thành chuẩn.

## 2. Đo hình từ frame (`lib/shape.ts`)
Với mỗi frame sau `release`: mặt nạ thay đổi so với frame đầu (ô 8 px), lấy **khối liền lớn nhất**, cắt theo hộp bao rồi co về lưới 24×24 (bỏ vị trí và tỉ lệ), so hai frame liền nhau bằng IoU. `shapeIoU` = trung vị. Ảnh tĩnh trượt / phóng → IoU gần 1; sóng dâng – cuộn – vỡ → IoU thấp. Cờ `STATIC_SHAPE` (skill, ultimate): `shapeIoU ≥ 0,85` trên ≥ 3 cặp frame (`STATIC_SHAPE` trong `lib/metrics.ts`).
Giới hạn: khối lớn nhất có thể là thân sinh vật bị đánh bật thay vì VFX; xoay chưa được chuẩn hóa. Cờ này là gợi ý để mở sheet, không là bằng chứng.

## 3. Hiệu chuẩn (run `20261105-095545-fb12afa-5264cbf5`, 11 case, canary + determinism pass)
| case | audit dữ liệu (hình chủ đạo) | `shapeIoU` (cặp) | xem sheet |
|---|---|---|---|
| `ult.skill_ult_trident` | `prop fxp_trident`, tĩnh | **0.993** (21) | đinh ba một ảnh |
| `skill_nh_tsunami` | `prop fxp_wave_crest`, tĩnh | **0.891** (12) | cùng một ảnh sóng trượt ngang, không dâng / cuộn / vỡ |
| `skill_hk_void_vortex` | `strip fx_void_portal` 4 khung | 0.803 (9) | |
| `skill_hg_hot_claw` | `strip fx_flame_burst` 4 khung | 0.793 (8) | |
| `skill_e_bubble` | `prop fxs_bubble`, tĩnh (nhỏ) | 0.769 (8) | |
| `skill_nh_bubble` | `prop fxp_bubble_big`, tĩnh (nhỏ) | 0.743 (8) | |
| `skill_cl_armor_crush` | tĩnh | 0.689 (8) | |
| `skill_cl_stomp`, `e_vine_lash`, `e_rune_beam` | strip / beam | 0.648–0.658 | |
| `skill_cl_energy_orb` | tĩnh (nhỏ) | 0.609 (8) | |

Kết luận: đo hình bắt được **ảnh tĩnh lớn** (phủ sân: sóng, đinh ba) — ngưỡng 0,85 tách đúng 2/2 mà không bắt nhầm skill có strip. Ảnh tĩnh **nhỏ** (bong bóng, quả cầu) thì khối lớn nhất trong frame là sinh vật / hạt, nên không phân biệt được → dựa vào audit dữ liệu (`STATIC_HERO`). Hai thước đo bổ sung nhau; chỉ hiệu chuẩn trên 11 case, nên coi ngưỡng là tạm.
Run hiệu chuẩn chỉ nằm trên máy (thư mục `runs/` bị gitignore); `capture/LATEST.json` vẫn trỏ run của vòng 4.
