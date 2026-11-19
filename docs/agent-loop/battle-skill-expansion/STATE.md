# STATE — battle-skill-expansion (mở rộng skill chiến đấu Adventure cân bằng các hệ; bước 3 của chủ dự án)
Nhánh: map-diorama-forest   Commit xanh gần nhất: 841a35dd (baseline, check 2190/2190)
Mốc hiện tại: ⏸ CỔNG DUYỆT (sau D)   Vòng: 0/3   Model coder: sonnet
Đang làm: — chờ chủ dự án duyệt design.md §F (8 câu)
Brief đang chạy: — (sau duyệt: lô B1 NATURE pilot, mẫu C)
Ngưỡng: SKILL_ANIMATION_STANDARD §7, đạt khi ≥ max(8,0, điểm thấp nhất đã duyệt cùng hệ + loại đòn) — chủ dự án ấn định 8,0; npm run check xanh; test logic mở khóa
Pilot: — (chọn sau design)

## Kế hoạch
P → R1 ∥ R2 → D (designer opus: audit 3.1 + thiết kế 3.2) → ⏸ CỔNG DUYỆT chủ dự án → 3.3: mỗi hệ một lô (đơn vị), lô đầu là pilot; mỗi lô: decision/content → C → K → chụp → V → F → M.

## Đơn vị
| # | Đơn vị | Trạng thái | Vòng | Điểm | Commit |
|---|---|---|---|---|---|
| A | Audit 3.1 + thiết kế 3.2 | ⏸ chờ duyệt | 1 | — | (commit này) |
| L1..L9 | lô theo hệ (sau duyệt) | ⏳ | 0 | — | — |

## Nhật ký
- 01:13 Chỉ đạo P: audit trước (npm run skill:audit → art_inbox/agent-loop/battle-skill-expansion/audit_before.{md,json}): 134 skill, người chơi mỗi hệ 2–5 (NATURE 2), điểm 6,5–8 (TB 7,1); 45 skill hỗ trợ element null → cần gán theo dòng loài (R1).
- 01:16 Explore R1 (sonnet): research.md — mỗi con 4U + ≤3 class + 1 ult, dòng = hệ 1:1, không có trường mở khóa, không chuỗi tiến hóa, 6 phản ứng hệ, save v8; file ghi không dấu → Chỉ đạo ghi lại có dấu (122k, 3,3′)
- 01:17 Explore R2 (sonnet): research-lore.md — 9 Guardian theo dòng, 4 vùng / 4 boss (NATURE, FIRE, METAL, WATER), VOID / LIGHTNING / EARTH / LIGHT / DARK không có boss vùng; mở khóa: hạ trùm = thanh tẩy Guardian, 100 % khám phá, Vết Nứt 10/20/30 (130k, 3,6′)
- 01:27 designer (opus) D: design.md 245 dòng — 34 skill mới (FIRE 4, WATER 3, EARTH 3, METAL 3, LIGHTNING 5, NATURE 5, LIGHT 3, DARK 5, VOID 3), mỗi hệ 10–12, 0 ô vai trống; ô Ấn Hộ Thần (Khởi → Thức → Thần) mở theo cờ save có sẵn, save giữ v8; 5 phản ứng mới; pilot NATURE (124k, 8,7′)
- 01:27 Chỉ đạo kiểm design: 14 bia lore, 5 quái, 2 lối tắt, 7 ô loài thay đúng skill hiện có, 34 id + 34 tên mới không trùng → gửi cổng duyệt

Đỏ sẵn (baseline): rỗng (npm run check). E2E ngoài check: aquarium, away, garden (treo), live, species.
Lỗi đang mở: —
Chờ chủ dự án: design.md §F 1–8 (đường ô Ấn Hộ Thần, 10 / hệ + 34 skill, 7 loài thay ô, tên Ấn, giới hạn bot, camera Ấn Thần, 4 lore mới, thứ tự lô)
Ghi chú: `package-lock.json` (npm 10.9 bỏ trường libc) — KHÔNG commit.

## Brief R1 (Explore sonnet) — dữ liệu / gameplay → research.md
Đường có skill (unique / class / ultimate, ô, cấp mở); bảng 9 hệ × skill người chơi (quy hỗ trợ null về hệ qua dòng loài); thang power/mp/cooldown/hits theo bậc; combo / phản ứng hệ / nâng cấp có sẵn; cơ chế mở khóa có sẵn (boss, vùng, nhiệm vụ) + save; ràng buộc decision 021/060; khoảng trống. Đọc skills/lineages/classes/elements/reactions/statuses/balance/battle_fx, schemas, GAME_BALANCE, decision 037/060/021/062, spec adventure §6–7, NEW_SKILLS_PROPOSAL, grep logic.

## Brief R2 (Explore sonnet) — lore → research-lore.md
Nguồn gốc 9 hệ theo lore; bảng vùng/boss/cổng/di tích; tha hóa + mạch truyện chính → điểm mở khóa tối thượng; nhiệm vụ/engagement (039, 053); tên đã dùng + luật IP; khoảng trống. Đọc docs/lore/*, spec V2 phần Adventure, spec adventure, zones/maps/enemies/elements.json, decision 043/055/039/048, IP_AUDIT_PROMPT.

## Brief D (designer opus)
Viết docs/agent-loop/battle-skill-expansion/design.md (≤ ~350 dòng: 9 lô × bảng gọn). Đọc: research.md, research-lore.md, art_inbox/agent-loop/battle-skill-expansion/audit_before.md, SKILL_ANIMATION_STANDARD.md (§1–§7), animation/SKILL_DESCRIPTION_STANDARD.md §2 + §6, decision 060, animation/NEW_SKILLS_PROPOSAL.md (tiền lệ định dạng), AGENT_RULES §8–§10, mẫu .claude/skills/agent-loop/references/design.md.
Nội dung: §0 audit 3.1 (bảng trước theo hệ × vai × bậc, điểm min/tb/max, hệ thiếu, ô vai = 0 sau khi quy hỗ trợ về dòng); §A phần chung: số tối thiểu mỗi hệ (đề xuất), đường đưa skill tới người chơi, thang bậc thường / nâng cao / đặc biệt-tối thượng (số power/mp/cd theo research §3 + quy mô VFX theo bậc), combo (phản ứng hệ mới + combo skill ↔ skill), chuỗi tiến hóa, cơ chế mở khóa (ưu tiên cờ save có sẵn, không đổi save), bot cân bằng; §B 9 lô (mỗi hệ một lô, pilot đề xuất): bảng skill (id, tên gốc, vai, bậc, đích, power/mp/cd/hits, effects, descVi), kịch bản tóm tắt theo khuôn §6 SKILL_DESCRIPTION_STANDARD (HÌNH CHỦ ĐẠO · PHẢI THẤY · NHỊP · KHÔNG ĐƯỢC), mở khóa (điều kiện + lore + file:dòng nguồn); §C nghiệm thu (điểm ≥ 8,0, test mở khóa, bot); §D test; §E ngoài phạm vi; §F Cần chủ dự án quyết (bản nháp decision mới). IP decision 048: tên gốc, không gợi IP. Không sửa content/ / code.
